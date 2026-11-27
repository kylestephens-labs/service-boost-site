"""Read only the busy intervals returned by the Google Calendar freeBusy endpoint."""
import json
from datetime import datetime, timezone
from urllib.request import Request, urlopen

from engine import CalendarUnavailable


def instant(value):
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.utcoffset() is None:
        raise ValueError('Expected an absolute timestamp.')
    return parsed.astimezone(timezone.utc)


class GoogleFreeBusy:
    def __init__(self, calendar_ids, access_token, transport=urlopen):
        self.ids = tuple(calendar_ids)
        if not self.ids or not all(self.ids) or len(set(self.ids)) != len(self.ids):
            raise ValueError('Explicit conflict calendars are required.')
        self.access_token = access_token
        self.transport = transport

    def intervals(self, begin, end):
        payload = dict(timeMin=begin.isoformat(), timeMax=end.isoformat(),
                       items=[{'id': key} for key in self.ids])
        try:
            request = Request('https://www.googleapis.com/calendar/v3/freeBusy',
                              data=json.dumps(payload).encode(), headers={
                                  'Content-Type': 'application/json',
                                  'Authorization': 'Bearer ' + self.access_token()})
            with self.transport(request, timeout=5) as response:
                result = json.load(response)
            if instant(result['timeMin']) > begin or instant(result['timeMax']) < end:
                raise ValueError('Incomplete range.')
            intervals = []
            for key in self.ids:
                entry = result['calendars'][key]
                if entry.get('errors') or not isinstance(entry['busy'], list):
                    raise ValueError('Incomplete calendar.')
                for period in entry['busy']:
                    start, stop = instant(period['start']), instant(period['end'])
                    if stop <= start:
                        raise ValueError('Invalid busy interval.')
                    intervals.append((start.timestamp(), stop.timestamp()))
            return intervals
        except Exception:
            # Provider responses and token errors must never leak through the public API.
            raise CalendarUnavailable() from None
