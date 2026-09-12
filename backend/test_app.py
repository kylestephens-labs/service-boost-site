import io
import json
import os
import unittest
from unittest.mock import patch
from backend import app


class IntakeTests(unittest.TestCase):
    def setUp(self):
        setting = patch.dict(os.environ, RATE_LIMIT_EXEMPT_IP='')
        setting.start()
        self.addCleanup(setting.stop)
        app.limiter = app.Limiter()
        self.data = dict(website='example.com', email='visitor@example.com', problem='The booking button does not work.')

    def request(self, data, origin='https://serviceboost.co', peer='127.0.0.1'):
        raw = json.dumps(data).encode()
        env = {'PATH_INFO': '/quote', 'REQUEST_METHOD': 'POST', 'HTTP_ORIGIN': origin, 'CONTENT_TYPE': 'application/json', 'CONTENT_LENGTH': str(len(raw)), 'wsgi.input': io.BytesIO(raw), 'REMOTE_ADDR': '127.0.0.1'}
        result = []
        env['HTTP_X_REAL_IP'] = peer
        with patch.dict(os.environ, ALLOWED_ORIGINS='https://serviceboost.co'):
            body = b''.join(app.application(env, lambda status, headers: result.append(status)))
        return result[0], body

    @patch('backend.app.send_quote')
    def test_valid_and_fixed_recipient(self, send):
        self.assertEqual(self.request({**self.data, 'to': 'attacker@example.com'})[0], '200 OK')
        self.assertNotIn('to', send.call_args.args[0])
        self.assertEqual(app.RECIPIENT, 'notify@serviceboost.co')

    @patch('backend.app.send_quote')
    def test_rejected_requests_do_not_send(self, send):
        for data in [{**self.data, 'company': 'bot'}, {**self.data, 'email': 'a@b.com\r\nBcc:x@y.com'}, {**self.data, 'website': 'javascript:alert(1)'}, {**self.data, 'problem': 'x'*4001}, []]:
            self.assertEqual(self.request(data)[0], '400 Bad Request')
        self.assertEqual(self.request(self.data, 'https://evil.example')[0], '403 Forbidden')
        send.assert_not_called()

    @patch('backend.app.send_quote')
    def test_rate_limit(self, send):
        for _ in range(5):
            self.assertEqual(self.request(self.data)[0], '200 OK')
        self.assertEqual(self.request(self.data)[0], '429 Too Many Requests')
        self.assertEqual(send.call_count, 5)

    @patch('backend.app.send_quote')
    def test_exact_exemption_bypasses_both_limits_without_consuming_budget(self, send):
        with patch.dict(os.environ, RATE_LIMIT_EXEMPT_IP='192.0.2.10'):
            for _ in range(55):
                self.assertEqual(self.request(self.data, peer='192.0.2.10')[0], '200 OK')
            self.assertEqual(app.limiter.global_hits, [])
            self.assertEqual(len(app.limiter.entries), 0)
            for _ in range(5):
                self.assertEqual(self.request(self.data, peer='192.0.2.11')[0], '200 OK')
            self.assertEqual(self.request(self.data, peer='192.0.2.11')[0], '429 Too Many Requests')

    @patch('backend.app.send_quote')
    def test_exemption_keeps_honeypot_validation_and_origin_checks(self, send):
        with patch.dict(os.environ, RATE_LIMIT_EXEMPT_IP='192.0.2.10'):
            for _ in range(6):
                self.assertEqual(self.request({**self.data, 'company':'bot'}, peer='192.0.2.10')[0], '400 Bad Request')
            self.assertEqual(self.request({**self.data, 'email':'invalid'}, peer='192.0.2.10')[0], '400 Bad Request')
            self.assertEqual(self.request(self.data, 'https://evil.example', '192.0.2.10')[0], '403 Forbidden')
        send.assert_not_called()

    def test_invalid_or_broad_exemption_is_disabled(self):
        for value in ['', '*', '192.0.2.0/24', 'invalid']:
            with patch.dict(os.environ, RATE_LIMIT_EXEMPT_IP=value):
                self.assertFalse(app.rate_limit_exempt('192.0.2.10'))
        with patch.dict(os.environ, RATE_LIMIT_EXEMPT_IP='2001:db8::1'):
            self.assertTrue(app.rate_limit_exempt('2001:0db8:0:0:0:0:0:1'))
            self.assertFalse(app.rate_limit_exempt('2001:db8::2'))
            self.assertFalse(app.rate_limit_exempt('invalid'))

    @patch('backend.app.send_quote')
    def test_invalid_unicode_is_rejected(self, send):
        self.assertEqual(self.request({**self.data, 'problem': 'invalid text \ud800'})[0], '400 Bad Request')
        send.assert_not_called()

    @patch('backend.app.send_quote', side_effect=OSError('secret provider detail'))
    def test_failure_not_success_and_no_secret_leak(self, send):
        status, body = self.request(self.data)
        self.assertEqual(status, '502 Bad Gateway')
        self.assertNotIn(b'secret provider detail', body)

if __name__ == '__main__':
    unittest.main()
