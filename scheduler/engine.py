"""Service Boost scheduler. This preview uses a private SQLite store and local delivery sinks."""
import hashlib
import hmac
import json
import re
import secrets
import sqlite3
from contextlib import closing, contextmanager
from pathlib import Path
from dataclasses import dataclass
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

PACIFIC = ZoneInfo("America/Los_Angeles")
UTC = timezone.utc
DAY = timedelta(days=1)
CONFIG = Path(__file__).with_name("calendly.v1.json")


@dataclass(frozen=True)
class Rule:
    minutes: int
    before: int = 0
    after: int = 0
    step: int = 30
    notice: int = 4
    horizon: int = 120


class Conflict(ValueError):
    pass


class CalendarUnavailable(Exception):
    pass


class PreviewProvider:
    """Busy intervals only. All calendar effects and mock messages stay in the preview DB."""
    available = True

    def freebusy(self, db, omit, first, last):
        if not self.available:
            raise CalendarUnavailable()
        return list(db.execute('SELECT start,end FROM busy')) + list(db.execute(
            'SELECT lo,hi FROM events WHERE active=1 AND id!=?', (omit,)))

    def deliver(self, db, booking, version, state):
        # Stable IDs also identify retries. A new remote appointment gets a distinct
        # synthetic conference; moving it keeps the same conference.
        conference = 'preview-meet-' + booking if state['remote'] else ''
        db.execute('INSERT OR REPLACE INTO events VALUES(?,?,?,?,?,?)',
                   (booking, state['start'], state['active'], conference, state['lo'], state['hi']))
        db.execute('INSERT OR IGNORE INTO messages VALUES(?,?,?)',
                   (booking, version, json.dumps(state)))


class Scheduler:
    def __init__(self, path, catalog, provider=None, clock=None, rules=None, configuration=CONFIG, external_busy=None, delivery=None):
        config = json.loads(Path(configuration).read_text())
        if config['version'] != 1 or config['timezone'] != PACIFIC.key:
            raise ValueError('Unsupported schedule configuration.')
        self.events = config['events']
        self.schedules = config['schedules']
        self.external_busy = external_busy
        self.path = path
        self.catalog = catalog
        self.provider = provider or PreviewProvider()
        self.delivery = delivery or self.provider
        self.clock = clock or (lambda: datetime.now(UTC))
        self.rules = rules or {kind: Rule(**{key: values[key] for key in Rule.__dataclass_fields__})
                               for kind, values in self.events.items()}
        with closing(sqlite3.connect(path)) as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS settings(secret TEXT);
                CREATE TABLE IF NOT EXISTS busy(start INTEGER,end INTEGER);
                CREATE TABLE IF NOT EXISTS legacy_busy(lo INTEGER,hi INTEGER);
                CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY, service TEXT, start INTEGER,
                    lo INTEGER, hi INTEGER, active INTEGER, version INTEGER, details TEXT, price TEXT, attribution TEXT);
                CREATE TABLE IF NOT EXISTS requests(key TEXT PRIMARY KEY, digest TEXT, booking TEXT);
                CREATE TABLE IF NOT EXISTS outbox(booking TEXT, version INTEGER, payload TEXT,
                    PRIMARY KEY(booking,version));
                CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, start INTEGER, active INTEGER, conference TEXT, lo INTEGER, hi INTEGER);
                CREATE TABLE IF NOT EXISTS messages(booking TEXT, version INTEGER, payload TEXT, PRIMARY KEY(booking,version));
            """)
            db.execute('INSERT INTO settings SELECT ? WHERE NOT EXISTS (SELECT 1 FROM settings)', (secrets.token_hex(32),))
            self.secret = bytes.fromhex(db.execute('SELECT secret FROM settings').fetchone()[0])
            db.commit()

    @contextmanager
    def transaction(self, write=False):
        with closing(sqlite3.connect(self.path, timeout=10)) as db:
            db.row_factory = sqlite3.Row
            with db:
                db.execute('BEGIN IMMEDIATE' if write else 'BEGIN')
                yield db

    def token(self, booking):
        return booking + '.' + hmac.new(self.secret, booking.encode(), hashlib.sha256).hexdigest()

    def authorized(self, token):
        booking = token.partition('.')[0]
        if not re.fullmatch(r'[a-f0-9]{32}\.[a-f0-9]{64}', token) or not hmac.compare_digest(token, self.token(booking)):
            raise ValueError('Invalid management link.')
        return booking

    def slots(self, db, service, first, days=1, omit=''):
        rule = self.rules[self.catalog[service]['kind']]
        now = self.clock()
        today = now.astimezone(PACIFIC).date()
        event = self.events[self.catalog[service]['kind']]
        week = self.schedules[event['schedule']]['weekly_minutes_from_midnight']
        begin = datetime.combine(first, time(), PACIFIC).astimezone(UTC) - timedelta(minutes=rule.before)
        end = datetime.combine(first + days * DAY, time(), PACIFIC).astimezone(UTC) + timedelta(minutes=rule.after)
        busy = self.provider.freebusy(db, omit, begin, end)
        busy.extend(db.execute('SELECT lo,hi FROM legacy_busy WHERE lo < ? AND hi > ?',
                               (end.timestamp(), begin.timestamp())))
        if self.external_busy:
            busy.extend(self.external_busy.intervals(begin, end))
        busy.extend(db.execute('SELECT lo,hi FROM bookings WHERE active=1 AND id!=?', (omit,)))
        result = []
        for offset in range(days):
            day = first + offset * DAY
            if not today <= day <= today + rule.horizon * DAY:
                continue
            for opening, closing in event['overrides'].get(day.isoformat(), week[day.weekday()]):
                midnight = datetime.combine(day, time(), PACIFIC)
                for minute in range(opening, closing-rule.minutes+1, rule.step):
                    start = midnight + timedelta(minutes=minute)
                    epoch = int(start.timestamp())
                    lo, hi = epoch-rule.before*60, epoch+(rule.minutes+rule.after)*60
                    if start < now + timedelta(hours=rule.notice):
                        continue
                    if not any(lo < b and a < hi for a, b in busy):
                        result.append(epoch)
        return result

    def apply(self, key, service, start, details=None, token='', cancel=False):
        if not re.fullmatch(r'[a-zA-Z0-9_-]{20,80}', key):
            raise ValueError('Invalid request.')
        existing = self.authorized(token) if token else ''
        digest = hashlib.sha256(json.dumps([service,start,details,token,cancel],sort_keys=True).encode()).hexdigest()
        with self.transaction(True) as db:
            prior = db.execute('SELECT digest,booking FROM requests WHERE key=?',(key,)).fetchone()
            if prior:
                if prior['digest'] != digest:
                    raise Conflict('Request changed. Please start again.')
                return self.token(prior['booking'])
            booking = existing or secrets.token_hex(16)
            row = db.execute('SELECT * FROM bookings WHERE id=?',(booking,)).fetchone()
            if existing and (not row or not row['active']):
                raise Conflict('This appointment is no longer active.')
            if row:
                service, details = row['service'], json.loads(row['details'])
            item = self.catalog[service]
            rule = self.rules[item['kind']]
            if cancel:
                if not existing:
                    raise ValueError('Management link required.')
                start = row['start']
            else:
                day = datetime.fromtimestamp(start, PACIFIC).date()
                if start not in self.slots(db, service, day, omit=existing):
                    raise Conflict('That time is unavailable. Please choose another.')
            version = row['version'] + 1 if row else 1
            db.execute('INSERT OR REPLACE INTO bookings VALUES(?,?,?,?,?,?,?,?,?,?)',
                       (booking, service, start, start-rule.before*60, start+(rule.minutes+rule.after)*60,
                        int(not cancel), version, json.dumps(details), str(item['price']), item['attribution']))
            payload = dict(start=start, lo=start-rule.before*60, hi=start+(rule.minutes+rule.after)*60,
                           active=not cancel, remote=item['kind']=='remote',
                           service=service, name=item['name'], price=item['price'], manage=self.token(booking), to=details['email'],
                           conference=('https://meet.invalid/' + booking if item['kind']=='remote' and not cancel else ''),
                           end=start+rule.minutes*60, location=details.get('address', ''),
                           guests=details.get('guests',''))
            db.execute('INSERT INTO outbox VALUES(?,?,?)',(booking,version,json.dumps(payload)))
            db.execute('INSERT INTO requests VALUES(?,?,?)',(key,digest,booking))
        return self.token(booking)

    def flush(self):
        # Ordered transactional outbox. Never acknowledge an effect until the
        # provider has accepted its stable booking/version ID.
        with self.transaction(True) as db:
            for row in db.execute('SELECT * FROM outbox ORDER BY rowid').fetchall():
                self.delivery.deliver(db,row['booking'],row['version'],json.loads(row['payload']))
                db.execute('DELETE FROM outbox WHERE booking=? AND version=?',(row['booking'],row['version']))
