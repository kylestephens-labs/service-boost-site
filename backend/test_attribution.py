import io
import json
import os
import sqlite3
import tempfile
import time
import unittest
import uuid
from unittest.mock import patch
from backend import app, attribution


class AttributionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = self.tmp.name + '/events.sqlite3'
        setting = patch.dict(os.environ, ATTRIBUTION_DB=self.path, ALLOWED_ORIGINS='https://serviceboost.co', RATE_LIMIT_EXEMPT_IP='')
        setting.start()
        self.addCleanup(setting.stop)
        self.ref = attribution.issue('SB-028', 'agency', 'pilot')
        self.event_id = str(uuid.uuid4())
        app.limiter = app.Limiter()
        app.visit_limiter = app.Limiter()

    def request(self, path='/events', data=None, **extra):
        raw = json.dumps(data if data is not None else dict(ref=self.ref, event_id=self.event_id, type='visit')).encode()
        env = dict(PATH_INFO=path, REQUEST_METHOD='POST', HTTP_ORIGIN='https://serviceboost.co', CONTENT_TYPE='application/json', CONTENT_LENGTH=str(len(raw)), REMOTE_ADDR='192.0.2.1', HTTP_USER_AGENT='Mozilla/5.0')
        env['wsgi.input'] = io.BytesIO(raw)
        env.update(extra)
        status = []
        b''.join(app.application(env, lambda s, h: status.append(s)))
        return status[0]

    def count(self):
        with sqlite3.connect(self.path) as db:
            return db.execute('SELECT count(*) FROM events').fetchone()[0]

    def test_private_issue_is_idempotent_and_events_persist_deduplicated(self):
        self.assertEqual(self.ref, attribution.issue('SB-028', 'agency', 'pilot'))
        for _ in range(2):
            self.assertEqual(self.request(), '200 OK')
        self.assertEqual(self.count(), 1)
        self.assertEqual(len(self.ref), 32)

    def test_unknown_malformed_bot_and_disallowed_events(self):
        self.request(data=dict(ref='x'*32, event_id=self.event_id, type='visit'))
        self.request(data=dict(ref=[], event_id=self.event_id, type='visit'))
        self.request(HTTP_USER_AGENT='security scanner')
        self.assertEqual(self.request(HTTP_ORIGIN='https://evil.example'), '403 Forbidden')
        self.assertEqual(self.request(data=dict(ref=self.ref, event_id=self.event_id, type='quote_accepted')), '400 Bad Request')
        self.assertEqual(self.count(), 0)

    def test_separate_rate_limit_does_not_consume_quote_budget(self):
        for _ in range(5):
            self.request()
        self.assertEqual(self.request(), '429 Too Many Requests')
        self.assertEqual(app.limiter.global_hits, [])

    def test_expiry_removes_mapping_and_events(self):
        self.request()
        with patch('backend.attribution.time.time', return_value=time.time()+attribution.RETENTION+1):
            self.assertIsNone(attribution.known(self.ref))
        self.assertEqual(self.count(), 0)

    @patch('backend.app.send_quote')
    def test_quote_only_after_acceptance_and_tracking_failure_is_nonblocking(self, send):
        data = dict(website='example.com', email='a@example.com', problem='A valid description.', ref=self.ref, event_id=self.event_id)
        send.side_effect = OSError('SMTP failed')
        self.assertEqual(self.request('/quote', data), '502 Bad Gateway')
        self.assertEqual(self.count(), 0)
        send.side_effect = None
        self.assertEqual(self.request('/quote', data), '200 OK')
        self.assertEqual(send.call_args.args[0]['ref'], self.ref)
        self.assertEqual(self.count(), 1)
        with patch('backend.attribution.record', side_effect=sqlite3.OperationalError('disk full')):
            self.assertEqual(self.request('/quote', data), '200 OK')

    @patch('backend.app.send_quote')
    def test_unknown_ref_and_unavailable_store_do_not_block_quotes(self, send):
        data = dict(website='example.com', email='a@example.com', problem='A valid description.', ref='z'*32)
        self.assertEqual(self.request('/quote', data), '200 OK')
        self.assertNotIn('ref', send.call_args.args[0])
        with patch.dict(os.environ, ATTRIBUTION_DB='/nonexistent/path/db'):
            self.assertEqual(self.request('/quote', data), '200 OK')


if __name__ == '__main__':
    unittest.main()
