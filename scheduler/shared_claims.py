"""Opt-in, isolated booking QA. A private, pre-provisioned Google event owns each day's claims."""
import hashlib
import hmac
import json
import re
import time
from datetime import datetime
from urllib.error import HTTPError

from engine import CalendarUnavailable, Conflict, PACIFIC


class SharedClaims:
    def __init__(self, engine, request, day_records, signing_key):
        if len(signing_key) < 32 or not hmac.compare_digest(signing_key, engine.secret):
            raise ValueError('A shared signing key is required.')
        self.engine = engine
        self.request = request
        self.records = day_records
        self.signing_key = signing_key

    def change(self, day, transition):
        url = self.records.get(day)
        if not url:
            raise CalendarUnavailable()
        for attempt in range(5):
            try:
                record = self.request('GET', url)
                props = record.get('extendedProperties', {}).get('private', {})
                if (record.get('status') == 'cancelled' or record.get('attendees')
                        or record.get('visibility') != 'private' or props.get('sbDay') != day):
                    raise CalendarUnavailable()
                patch, result = transition(props)
                if patch:
                    self.request('PATCH', url + '?sendUpdates=none',
                                 {'extendedProperties': {'private': patch}}, record['etag'])
                return result
            except HTTPError as exc:
                reasons = [e.get('reason') for e in json.load(exc).get('error', {}).get('errors', [])]
                if exc.code not in (412, 429) and 'rateLimitExceeded' not in reasons and 'userRateLimitExceeded' not in reasons:
                    raise CalendarUnavailable() from None
                time.sleep(0.25 * 2**attempt)
            except OSError:
                raise CalendarUnavailable() from None
        raise CalendarUnavailable()

    def book(self, key, service, start, details):
        if not re.fullmatch(r'[a-zA-Z0-9_-]{20,80}', key):
            raise ValueError('Invalid request.')
        day = datetime.fromtimestamp(start, PACIFIC).date()
        rule = self.engine.rule_for_day(self.engine.catalog[service]['kind'], day)
        lo, hi = start - rule.before*60, start + (rule.minutes+rule.after)*60
        data = json.dumps([service, start, details], sort_keys=True).encode()
        digest = hmac.new(self.signing_key, data, hashlib.sha256).hexdigest()
        field = 'r' + hashlib.sha256(key.encode()).hexdigest()[:32]

        def reserve(props):
            if field in props:
                prior = json.loads(props[field])
                if prior['digest'] != digest:
                    raise Conflict('Request changed. Please start again.')
                if 'booking' in prior:
                    return None, self.engine.token(prior['booking'])
                raise CalendarUnavailable()
            for name, value in props.items():
                if name.startswith('r'):
                    claim = json.loads(value)
                    if claim['lo'] < hi and lo < claim['hi']:
                        raise Conflict('That time is unavailable. Please choose another.')
            with self.engine.transaction() as db:
                if start not in self.engine.slots(db, service, day):
                    raise Conflict('That time is unavailable. Please choose another.')
            return {field: json.dumps(dict(lo=lo, hi=hi, digest=digest))}, None

        saved = self.change(day.isoformat(), reserve)
        if saved:
            return saved
        receipt = self.engine.apply(key, service, start, details)
        self.engine.flush()

        def finish(props):
            prior = json.loads(props[field])
            if prior['digest'] != digest:
                raise CalendarUnavailable()
            prior['booking'] = receipt.split('.')[0]
            return {field: json.dumps(prior)}, receipt

        return self.change(day.isoformat(), finish)

    def cancel(self, key, service, start, token):
        booking = self.engine.authorized(token)
        with self.engine.transaction() as db:
            row = db.execute('SELECT start FROM bookings WHERE id=?', (booking,)).fetchone()
        if not row:
            raise CalendarUnavailable()
        receipt = self.engine.apply(key, service, row['start'], token=token, cancel=True)
        self.engine.flush()
        day = datetime.fromtimestamp(row['start'], PACIFIC).date().isoformat()

        def release(props):
            for field, value in props.items():
                if field.startswith('r'):
                    claim = json.loads(value)
                    if claim.get('booking') == booking:
                        # Keep the original idempotency receipt while releasing the interval.
                        claim['lo'] = claim['hi'] = 0
                        return {field: json.dumps(claim)}, receipt
            raise CalendarUnavailable()
        return self.change(day, release)
