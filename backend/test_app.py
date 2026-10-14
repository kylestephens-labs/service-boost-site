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
        self.assertEqual(app.RECIPIENT, 'kyle@serviceboost.co')

    @patch('backend.app.send_quote')
    def test_rejected_requests_do_not_send(self, send):
        for data in [{**self.data, 'company': 'bot'}, {**self.data, 'email': 'a@b.com\r\nBcc:x@y.com'}, {**self.data, 'website': 'javascript:alert(1)'}, {**self.data, 'problem': 'x'*4001}, []]:
            self.assertEqual(self.request(data)[0], '400 Bad Request')
        self.assertEqual(self.request(self.data, 'https://evil.example')[0], '403 Forbidden')
        send.assert_not_called()

    @patch('backend.app.smtplib.SMTP')
    def test_both_intakes_use_kyle_for_headers_and_envelope(self, smtp):
        transport = smtp.return_value.__enter__.return_value
        transport.send_message.return_value = {}
        for data in (self.data, self.tech_data(reply_method='email', email='visitor@example.com')):
            with self.subTest(project=data.get('project_type', 'improve')):
                app.send_quote(app.validate({**data, 'to': 'attacker@example.com'}))
                call = transport.send_message.call_args
                self.assertEqual(call.args[0]['From'], 'kyle@serviceboost.co')
                self.assertEqual(call.args[0]['To'], 'kyle@serviceboost.co')
                self.assertEqual(call.args[0]['Reply-To'], 'visitor@example.com')
                self.assertEqual(call.kwargs, dict(from_addr='kyle@serviceboost.co', to_addrs=['kyle@serviceboost.co']))

    @patch('backend.app.send_quote', side_effect=OSError('delivery unavailable'))
    def test_delivery_failure_points_to_current_business_email(self, send):
        for data in (self.data, self.tech_data()):
            status, body = self.request(data)
            self.assertEqual(status, '502 Bad Gateway')
            self.assertIn(b'kyle@serviceboost.co', body)
            self.assertNotIn(b'notify@serviceboost.co', body)

    @patch('backend.app.send_quote')
    def test_build_can_omit_website_and_preserves_name_and_scope(self, send):
        self.assertEqual(self.request({**self.data, 'website': '', 'project_type': 'build', 'name': '  Kyle  '})[0], '200 OK')
        self.assertEqual(send.call_args.args[0]['website'], '')
        self.assertEqual(send.call_args.args[0]['name'], 'Kyle')
        self.assertEqual(send.call_args.args[0]['project_type'], 'build')

    def test_project_validation_keeps_legacy_and_url_guards(self):
        self.assertEqual(app.validate(self.data)['project_type'], 'improve')
        for changes in [dict(website=''), dict(project_type='other'), dict(project_type=[]), dict(project_type='build', website='javascript:alert(1)'), dict(name='x'*121), dict(name='Hi\nInjected'), dict(name=[])]:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                app.validate({**self.data, **changes})

    @patch('backend.app.smtplib.SMTP')
    def test_notification_includes_new_project_fields_without_changing_recipient(self, smtp):
        smtp.return_value.__enter__.return_value.send_message.return_value = {}
        fields = app.validate({**self.data, 'website': '', 'project_type': 'build', 'name': 'Test Visitor'})
        app.send_quote(fields)
        message = smtp.return_value.__enter__.return_value.send_message.call_args.args[0]
        self.assertEqual(message['To'], app.RECIPIENT)
        self.assertEqual(message['Reply-To'], self.data['email'])
        self.assertIn('Project: New website', message.get_content())
        self.assertIn('Name: Test Visitor', message.get_content())
        self.assertIn('Website: Not provided', message.get_content())

    @patch('backend.app.send_quote')
    def test_rate_limit(self, send):
        for _ in range(5):
            self.assertEqual(self.request(self.data)[0], '200 OK')
        self.assertEqual(self.request(self.data)[0], '429 Too Many Requests')
        self.assertEqual(send.call_count, 5)

    def tech_data(self, **changes):
        return dict(project_type='tech_support', service='wifi', name='Test Visitor',
                    location='Walnut Creek', problem='My Wi-Fi keeps dropping.',
                    **{'reply_method': 'text', 'phone': '202-555-0123', **changes})

    def test_readiness_requires_allowed_origin(self):
        for origin, expected in [('https://serviceboost.co', '200 OK'), ('https://evil.example', '404 Not Found')]:
            result = []
            with patch.dict(os.environ, ALLOWED_ORIGINS='https://serviceboost.co'):
                body = b''.join(app.application({'PATH_INFO':'/tech-help-ready', 'REQUEST_METHOD':'GET', 'HTTP_ORIGIN':origin}, lambda status, headers:result.append((status, headers))))
            self.assertEqual(result[0][0], expected)
            if expected == '200 OK':
                self.assertIn(('Access-Control-Allow-Origin', origin), result[0][1])
                self.assertEqual(json.loads(body)['message'], 'tech_support_v1')

    @patch('backend.app.attribution.known')
    @patch('backend.app.send_quote')
    def test_tech_preserves_abuse_controls_and_does_not_attribute(self, send, known):
        self.assertEqual(self.request({**self.tech_data(), 'company':'bot'})[0], '400 Bad Request')
        self.assertEqual(self.request(self.tech_data(), origin='https://evil.example')[0], '403 Forbidden')
        send.assert_not_called()
        self.assertEqual(self.request({**self.tech_data(), 'ref':'a'*32})[0], '200 OK')
        known.assert_not_called()

    @patch('backend.app.send_quote')
    def test_tech_contact_methods_and_no_website_required(self, send):
        for method in ('text', 'call', 'email'):
            data = self.tech_data(reply_method=method)
            if method == 'email':
                data.update(email='visitor@example.com', phone='')
            status, body = self.request(data)
            self.assertEqual(status, '200 OK')
            self.assertIn(b'preferred reply method', body)
            self.assertEqual(send.call_args.args[0]['service'], 'wifi')

    def test_tech_rejects_missing_malformed_and_injected_contacts(self):
        for change in [dict(phone=''), dict(phone='abc1234567'), dict(phone='1'),
                       dict(reply_method='email'), dict(reply_method=[]), dict(service=[]),
                       dict(location=''), dict(location='Town\nInjected'), dict(name=''),
                       dict(email='bad'), dict(phone='2025550123\nInjected')]:
            with self.subTest(change=change), self.assertRaises(ValueError):
                app.validate({**self.tech_data(), **change})

    @patch('backend.app.smtplib.SMTP')
    def test_phone_only_notification_has_no_reply_to_and_keeps_fixed_recipient(self, smtp):
        smtp.return_value.__enter__.return_value.send_message.return_value = {}
        app.send_quote(app.validate(self.tech_data()))
        message = smtp.return_value.__enter__.return_value.send_message.call_args.args[0]
        self.assertEqual(message['To'], app.RECIPIENT)
        self.assertIsNone(message['Reply-To'])
        for text in ('Service: wifi', 'City / ZIP: Walnut Creek', 'Preferred reply: text', 'Phone: 202-555-0123'):
            self.assertIn(text, message.get_content())

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
