"""Google managed-calendar delivery. The preview never instantiates this adapter."""
import hashlib
import json
from datetime import datetime, timezone
from urllib.error import HTTPError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from engine import CalendarUnavailable


class ManagedCalendar:
    def __init__(self, calendar_id, access_token, manage_origin, send_management, transport=urlopen):
        if not calendar_id or not manage_origin.startswith('https://'):
            raise ValueError('A managed calendar and HTTPS management origin are required.')
        self.events_url = ('https://www.googleapis.com/calendar/v3/calendars/' +
                           quote(calendar_id, safe='') + '/events')
        self.manage_origin = manage_origin.rstrip('/')
        self.access_token = access_token
        self.send_management = send_management
        self.transport = transport

    def request(self, method, path, body=None, etag=None):
        headers = {'Authorization': 'Bearer ' + self.access_token(), 'Content-Type': 'application/json'}
        if etag:
            headers['If-Match'] = etag
        data = None if body is None else json.dumps(body).encode()
        with self.transport(Request(path, data=data, headers=headers, method=method), timeout=5) as response:
            raw = response.read()
            return json.loads(raw) if raw else {}

    def deliver(self, db, booking, version, state):
        # The hex digest is valid Google's base32hex alphabet. Never update an
        # unrecognized event even if a calendar unexpectedly contains this ID.
        event_id = hashlib.sha256(('serviceboost:' + booking).encode()).hexdigest()
        path = self.events_url + '/' + event_id
        try:
            current = self.request('GET', path)
        except HTTPError as exc:
            if exc.code not in (404, 410):
                raise CalendarUnavailable() from None
            current = None
        except (OSError, ValueError):
            raise CalendarUnavailable() from None
        try:
            if current and current.get('status') != 'cancelled':
                private = current.get('extendedProperties', {}).get('private', {})
                if private.get('booking') != booking:
                    raise CalendarUnavailable()
            else:
                current = None
            query = '?' + urlencode({'sendUpdates': 'all', 'conferenceDataVersion': 1})
            if not state['active']:
                if current:
                    self.request('DELETE', path + query, etag=current['etag'])
                conference = ''
            else:
                def time_point(epoch):
                    return {'dateTime': datetime.fromtimestamp(epoch, timezone.utc).isoformat()}
                if current is None or int(private['version']) < version:
                    body = dict(summary=state['name'], start=time_point(state['start']),
                                end=time_point(state['end']), description='Service Boost · $' + str(state['price']),
                                attendees=[{'email': address} for address in
                                           [state['to'], *filter(None, (v.strip() for v in state['guests'].split(',')))]],
                                extendedProperties={'private': {'booking': booking, 'version': str(version),
                                                                'service': state['service']}})
                    if state['location']:
                        body['location'] = state['location']
                    if current is None:
                        body['id'] = event_id
                        if state['remote']:
                            body['conferenceData'] = {'createRequest': {'requestId': event_id,
                                'conferenceSolutionKey': {'type': 'hangoutsMeet'}}}
                        current = self.request('POST', self.events_url + query, body)
                    else:
                        current = self.request('PATCH', path + query, body, current['etag'])
                conference = current.get('hangoutLink', '')
                if state['remote'] and not conference.startswith('https://meet.google.com/'):
                    raise CalendarUnavailable()
            # This capability is only for the primary invitee. Never put it on the
            # calendar event shared with optional guests. The mail transport must
            # deduplicate the supplied stable key across ambiguous retries.
            self.send_management(booking + '/' + str(version), state['to'],
                                 self.manage_origin + '/schedule#' + state['manage'],
                                 state['active'], conference)
            db.execute('INSERT OR REPLACE INTO events VALUES(?,?,?,?,?,?)',
                       (booking, state['start'], state['active'], conference, state['lo'], state['hi']))
        except (OSError, ValueError, KeyError, TypeError):
            raise CalendarUnavailable() from None
