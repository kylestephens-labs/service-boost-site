import io
import json
import unittest
from datetime import timedelta
from unittest.mock import Mock

from engine import CalendarUnavailable, Conflict, PACIFIC
from freebusy import GoogleFreeBusy
from migration import compare_slots, replace_legacy_snapshot
import test_engine


class ParityTests(unittest.TestCase):
    setUp = test_engine.BookingTests.setUp
    slots = test_engine.BookingTests.slots
    book = test_engine.BookingTests.book

    def test_legacy_local_blocks_remote_and_retains_buffer_after_bad_refresh(self):
        start = self.slots('0/1')[0]
        record = [('local', start)]
        replace_legacy_snapshot(self.app, record, record)
        # A remote-only date override permits a start inside a legacy travel buffer.
        self.app.events['remote']['overrides'][self.day.isoformat()] = [[600, 720]]
        self.assertNotIn(start + 7200, self.slots('remote-fix'))
        with self.assertRaises(CalendarUnavailable):
            replace_legacy_snapshot(self.app, record, [])
        with self.assertRaises(Conflict):
            self.book('a', 'remote-fix', start + 7200)

    def test_closed_override_is_per_event(self):
        self.app.events['local']['overrides'][self.day.isoformat()] = []
        self.assertEqual(compare_slots(self.app, {('0/1', self.day): []}), {})
        self.assertTrue(compare_slots(self.app, {('remote-fix', self.day): []}))

    def test_google_busy_and_incomplete_data_at_commit(self):
        start = self.slots('0/1')[0]
        def reply(request, timeout):
            payload = json.loads(request.data)
            self.assertEqual(payload['items'], [{'id': 'test.invalid'}])
            return io.BytesIO(json.dumps(dict(timeMin=payload['timeMin'], timeMax=payload['timeMax'],
                                              calendars=calendars)).encode())
        calendars = {'test.invalid': {'busy': []}}
        self.app.external_busy = GoogleFreeBusy(['test.invalid'], lambda: 'mock', reply)
        self.assertIn(start, self.slots('0/1'))
        from datetime import datetime
        first = datetime.fromtimestamp(start, PACIFIC)
        calendars['test.invalid']['busy'] = [dict(start=first.isoformat(), end=(first+timedelta(hours=1)).isoformat())]
        with self.assertRaises(Conflict):
            self.book('a', '0/1', start)
        for bad in ({}, {'test.invalid': {'errors': ['unavailable'], 'busy': []}}, {'test.invalid': {}}):
            calendars = bad
            with self.assertRaises(CalendarUnavailable):
                self.book('a', '0/1', start)
        self.app.external_busy.transport = Mock(side_effect=TimeoutError())
        with self.assertRaises(CalendarUnavailable):
            self.slots('remote-fix')

    def test_managed_calendar_retry_move_and_cancel_with_fake_transport(self):
        from urllib.error import HTTPError
        from managed_calendar import ManagedCalendar
        events = {}
        operations = []
        mail = {}
        def transport(request, timeout):
            method = request.get_method()
            url = request.full_url.split('?')[0]
            operations.append(method)
            if method == 'GET' and url not in events:
                raise HTTPError(url, 404, 'missing', {}, None)
            if method == 'POST':
                event = json.loads(request.data)
                self.assertNotIn('/schedule#', event['description'])
                self.assertEqual(event['conferenceData']['createRequest']['requestId'], event['id'])
                url += '/' + event['id']
                events[url] = dict(event, etag='v1', hangoutLink='https://meet.google.com/mock')
                raise TimeoutError()
            if method in ('PATCH','DELETE'):
                self.assertEqual(request.get_header('If-match'), events[url]['etag'])
                if method == 'PATCH':
                    events[url].update(json.loads(request.data))
                else:
                    del events[url]
            return io.BytesIO(json.dumps(events.get(url, {})).encode())
        self.provider.deliver = ManagedCalendar('test.invalid', lambda: 'mock', 'https://test.invalid',
            lambda key, recipient, *args: mail.setdefault(key, recipient), transport).deliver
        first, second = self.slots('remote-fix')[:2]
        token = self.book('a', 'remote-fix', first)
        with self.assertRaises(CalendarUnavailable):
            self.app.flush()
        self.app.flush()
        self.app.apply('b'*24, 'remote-fix', second, token=token)
        self.app.flush()
        self.app.apply('c'*24, 'remote-fix', second, token=token, cancel=True)
        self.app.flush()
        self.assertEqual([operations.count(m) for m in ['POST','PATCH','DELETE']], [1,1,1])
        self.assertEqual(len(mail), 3)
        self.assertFalse(events)
