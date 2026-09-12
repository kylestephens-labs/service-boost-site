import io
import json
import os
import unittest
from unittest.mock import patch
from backend import app


class IntakeTests(unittest.TestCase):
    def setUp(self):
        app.limiter = app.Limiter()
        self.data = dict(website='example.com', email='visitor@example.com', problem='The booking button does not work.')

    def request(self, data, origin='https://serviceboost.co'):
        raw = json.dumps(data).encode()
        env = {'PATH_INFO': '/quote', 'REQUEST_METHOD': 'POST', 'HTTP_ORIGIN': origin, 'CONTENT_TYPE': 'application/json', 'CONTENT_LENGTH': str(len(raw)), 'wsgi.input': io.BytesIO(raw), 'REMOTE_ADDR': '127.0.0.1'}
        result = []
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

    @patch('backend.app.send_quote', side_effect=OSError('secret provider detail'))
    def test_failure_not_success_and_no_secret_leak(self, send):
        status, body = self.request(self.data)
        self.assertEqual(status, '502 Bad Gateway')
        self.assertNotIn(b'secret provider detail', body)

if __name__ == '__main__':
    unittest.main()
