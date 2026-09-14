"""Quote intake. Run one Gunicorn worker; SMTP acceptance is not inbox proof."""
import json
from ipaddress import ip_address
import os
import re
import smtplib
import ssl
import sqlite3
import uuid
import time
from collections import OrderedDict
from email.message import EmailMessage
from urllib.parse import urlsplit
try:
    from . import attribution
except ImportError:
    import attribution

RECIPIENT = 'notify@serviceboost.co'
MAX_BODY = 16384
EMAIL = re.compile(r"[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}")


class Limiter:
    def __init__(self):
        self.entries = OrderedDict()
        self.global_hits = []

    def allow(self, key, now):
        # One worker owns bounded, ephemeral abuse counters. No request contents.
        self.global_hits = [t for t in self.global_hits if now - t < 3600]
        hits = [t for t in self.entries.pop(key, []) if now - t < 3600]
        allowed = len(hits) < 5 and len(self.global_hits) < 50
        if allowed:
            hits.append(now)
            self.global_hits.append(now)
        self.entries[key] = hits
        while len(self.entries) > 10000:
            self.entries.popitem(last=False)
        return allowed


limiter = Limiter()
visit_limiter = Limiter()


def rate_limit_exempt(peer):
    # Exact server-configured address only; never accept an exemption from form data.
    configured = os.environ.get('RATE_LIMIT_EXEMPT_IP', '').strip()
    try:
        return bool(configured) and ip_address(peer) == ip_address(configured)
    except ValueError:
        return False


def validate(data):
    if not isinstance(data, dict):
        raise ValueError('Invalid request.')
    fields = {}
    for key, maximum in [('website', 500), ('problem', 4000), ('email', 254), ('company', 200)]:
        value = data.get(key, '')
        if not isinstance(value, str) or len(value) > maximum:
            raise ValueError('Please check the form fields.')
        value.encode('utf-8')
        fields[key] = value.strip()
    if fields['company']:
        raise ValueError('Unable to accept this request.')
    if not EMAIL.fullmatch(fields['email']):
        raise ValueError('Enter a valid email address.')
    address = fields['website']
    if '://' not in address:
        address = 'https://' + address
    url = urlsplit(address)
    if url.scheme not in ('http', 'https') or not url.hostname or '.' not in url.hostname or url.username or url.password or any(c.isspace() for c in address):
        raise ValueError('Enter a website address, like yourbusiness.com.')
    if len(fields['problem']) < 10 or '\x00' in fields['problem']:
        raise ValueError('Describe the problem in at least 10 characters.')
    fields['website'] = address
    return fields


def send_quote(fields):
    message = EmailMessage()
    message['From'] = RECIPIENT
    message['To'] = RECIPIENT
    message['Reply-To'] = fields['email']
    message['Subject'] = 'Service Boost — new quote request'
    source = f"\nOutreach reference: {fields['ref']}\n" if fields.get('ref') else ''
    message.set_content(f"Website: {fields['website']}\nCustomer email: {fields['email']}\n\n{fields['problem']}\n{source}")
    # STARTTLS is mandatory. Never log SMTP traffic or message contents.
    with smtplib.SMTP('smtp-relay.gmail.com', 587, timeout=15) as smtp:
        smtp.ehlo()
        smtp.starttls(context=ssl.create_default_context())
        smtp.ehlo()
        refused = smtp.send_message(message, from_addr=RECIPIENT, to_addrs=[RECIPIENT])
        if refused:
            raise smtplib.SMTPException('Recipient refused')


def application(env, start_response):
    origin = env.get('HTTP_ORIGIN', '')
    allowed = {x.strip() for x in os.environ.get('ALLOWED_ORIGINS', '').split(',') if x.strip()}
    headers = [('Content-Type', 'application/json'), ('Cache-Control', 'no-store'), ('X-Content-Type-Options', 'nosniff'), ('Vary', 'Origin')]
    if origin in allowed:
        headers.append(('Access-Control-Allow-Origin', origin))

    def respond(code, message):
        start_response(code, headers)
        return [json.dumps({'message': message}).encode()]

    if env.get('PATH_INFO') == '/health' and env.get('REQUEST_METHOD') == 'GET':
        return respond('200 OK', 'ok')
    tracking = env.get('PATH_INFO') == '/events'
    if env.get('PATH_INFO') not in ('/quote', '/events'):
        return respond('404 Not Found', 'Not found.')
    if not origin or origin not in allowed:
        return respond('403 Forbidden', 'Request origin not allowed.')
    if env.get('REQUEST_METHOD') == 'OPTIONS':
        headers.extend([('Access-Control-Allow-Methods', 'POST'), ('Access-Control-Allow-Headers', 'Content-Type')])
        return respond('200 OK', 'ok')
    if env.get('REQUEST_METHOD') != 'POST':
        return respond('405 Method Not Allowed', 'Use POST.')
    # Caddy must overwrite this header; backend port must remain loopback-only.
    peer = env.get('HTTP_X_REAL_IP', env.get('REMOTE_ADDR', 'unknown'))
    if tracking:
        if not visit_limiter.allow(peer, time.monotonic()):
            return respond('429 Too Many Requests', 'Rate limited.')
    elif not rate_limit_exempt(peer) and not limiter.allow(peer, time.monotonic()):
        headers.append(('Retry-After', '3600'))
        return respond('429 Too Many Requests', 'Too many requests. Please try again later.')
    if env.get('CONTENT_TYPE', '').split(';')[0] != 'application/json':
        return respond('415 Unsupported Media Type', 'Send JSON.')
    try:
        length = int(env.get('CONTENT_LENGTH', '0'))
        if not 0 < length <= MAX_BODY:
            return respond('413 Payload Too Large', 'Request is too large or empty.')
        data = json.loads(env['wsgi.input'].read(length))
        if tracking:
            if not isinstance(data, dict) or set(data) != {'ref', 'event_id', 'type'} or data['type'] != 'visit':
                return respond('400 Bad Request', 'Invalid event.')
            # Cheap filtering only; origin and user-agent can be forged.
            if re.search(r'bot|crawler|spider|scanner|headless', env.get('HTTP_USER_AGENT', ''), re.I):
                return respond('200 OK', 'Ignored.')
            try:
                attribution.record(data['ref'], data['event_id'], 'visit')
            except (OSError, sqlite3.Error):
                return respond('503 Service Unavailable', 'Tracking unavailable.')
            # Do not expose whether a private reference exists.
            return respond('200 OK', 'Recorded if eligible.')
        fields = validate(data)
        ref = attribution.known(data.get('ref'))
        if ref:
            fields['ref'] = ref
    except (ValueError, UnicodeError):
        return respond('400 Bad Request', 'Check your website, email, and problem description.')
    try:
        send_quote(fields)
    except (smtplib.SMTPException, OSError):
        return respond('502 Bad Gateway', 'We could not confirm delivery. Your details remain here; please try again or email notify@serviceboost.co.')
    if fields.get('ref'):
        event_id = data.get('event_id')
        if not isinstance(event_id, str) or not attribution.EVENT.fullmatch(event_id):
            event_id = str(uuid.uuid4())
        try:
            attribution.record(fields['ref'], event_id, 'quote_accepted')
        except (OSError, sqlite3.Error):
            # SMTP already accepted: never invite a duplicate submission because
            # analytics failed. The notification includes the source reference.
            pass
    return respond('200 OK', 'Your request has been sent. We’ll reply by email.')
