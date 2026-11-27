"""Run the isolated booking preview on Kyle's Mac: python3 scheduler/preview.py"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
from collections import deque
from html import unescape
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from time import monotonic
from urllib.parse import parse_qs, urlsplit

from engine import CalendarUnavailable, Conflict, PACIFIC, Scheduler

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent


def prepare(directory):
    subprocess.run([sys.executable, 'build-site.py', '--review-visits'], cwd=ROOT, check=True,
                   env={**os.environ, 'SERVICE_BOOST_OWNED_SCHEDULER': 'mock'})
    shutil.copytree(ROOT/'visit-preview', directory)
    result = subprocess.check_output(['node', str(HERE/'catalog.mjs')], text=True)
    catalog = {item['id']:item for item in json.loads(result)}
    remote = directory/'remote-tech-help.html'
    html = remote.read_text()
    for intent, section in zip(('fix','improve'), html.split('<section class="remote-card">')[1:]):
        title = re.search(r'<h2>(.*?)</h2>',section)[1]
        terms = re.search(r'<p><strong>(.*?)</p>',section)[1]
        service = 'remote-' + intent
        catalog[service] = dict(id=service,kind='remote',name=title,price=re.search(r'\$([0-9.]+) for',terms)[1],
                                terms=unescape(re.sub('<.*?>','',terms)),attribution=service)
        html = html.replace('role="link" aria-disabled="true"',f'href="/schedule?service={service}"',1)
    remote.write_text(html.replace('<p>Remote scheduling is unavailable in this preview.</p>',''))
    # The review bundle alone redirects eligible local routes after the site's normal guards.
    booking = directory/'booking.js'
    booking.write_text('function renderBooking(root, service, id) { location.replace("/schedule?service=" + encodeURIComponent(id)); }')
    for name in ('schedule.html','schedule.css','schedule.js'):
        shutil.copyfile(HERE/name,directory/name)
    return catalog


def clean_details(item, fields):
    if not isinstance(fields, dict):
        raise ValueError('Enter your details.')
    remote = item['kind']=='remote'
    names = ('name','email','notes','guests') if remote else ('name','email','phone','address','notes')
    data = {}
    for field in names:
        value = fields.get(field,'')
        if not isinstance(value,str) or len(value)>2000:
            raise ValueError('Please shorten the entry.')
        data[field] = value.strip()
    required = ('name','email','notes') if remote else ('name','email','address','phone')
    if not all(data[k] for k in required):
        raise ValueError('Complete the required fields.')
    emails = [data['email']] + ([v.strip() for v in data['guests'].split(',')] if data.get('guests') else [])
    if len(emails)>11 or any(not re.fullmatch(r'[^@\s,]+@[^@\s,]+\.[^@\s,]+',v) for v in emails):
        raise ValueError('Enter a valid email address.')
    return data


class Preview(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(self.site),**kwargs)

    def log_message(self,*args):
        pass  # Management tokens, contact fields and request URLs never enter access logs.

    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('Referrer-Policy','no-referrer')
        self.send_header('X-Robots-Tag','noindex, nofollow')
        self.send_header('X-Content-Type-Options','nosniff')
        super().end_headers()

    def json(self,status,value):
        body=json.dumps(value).encode()
        self.send_response(status)
        self.send_header('Content-Type','application/json')
        self.send_header('Content-Length',str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def translate_path(self,path):
        original=Path(super().translate_path(path))
        clean=Path(str(original)+'.html')
        return str(clean if clean.is_file() else original)

    def list_directory(self,path):
        self.send_error(404)

    def valid_host(self):
        return self.headers.get('Host')==f'127.0.0.1:{self.server.server_port}'

    def do_GET(self):
        if not self.valid_host():
            return self.send_error(403)
        url=urlsplit(self.path)
        if url.path!='/api/availability':
            return super().do_GET()
        try:
            args=parse_qs(url.query)
            service=args.get('service',[''])[0]
            token=self.headers.get('X-Manage','')
            with self.engine.transaction() as db:
                current=None
                omit=''
                if token:
                    omit=self.engine.authorized(token)
                    row=db.execute('SELECT service,start,active FROM bookings WHERE id=?',(omit,)).fetchone()
                    if not row:
                        raise ValueError('Unknown appointment.')
                    current=dict(row)
                    current['delivered']=not db.execute('SELECT 1 FROM outbox WHERE booking=?',(omit,)).fetchone()
                    event=db.execute('SELECT conference FROM events WHERE id=? AND active=1',(omit,)).fetchone()
                    current['conference']=event['conference'] if event and current['delivered'] else ''
                    service=row['service']
                item=self.engine.catalog[service]
                today=self.engine.clock().astimezone(PACIFIC).date()
                slots=self.engine.slots(db,service,today,self.engine.rules[item['kind']].horizon+1,omit)
                return self.json(200,dict(item=item,slots=slots,current=current))
        except CalendarUnavailable:
            self.json(503,{'error':'Calendar unavailable. Please try again later.'})
        except (ValueError,KeyError):
            self.json(400,{'error':'Unknown service or management link.'})

    def do_POST(self):
        expected='http://'+str(self.headers.get('Host'))
        if not self.valid_host() or self.headers.get('Origin')!=expected or self.headers.get_content_type()!='application/json':
            return self.send_error(403)
        if self.path!='/api/booking':
            return self.send_error(404)
        now=monotonic()
        with self.limit_lock:
            while self.attempts and self.attempts[0]<=now-60:
                self.attempts.popleft()
            if len(self.attempts)>=30:
                return self.json(429,{'error':'Please wait a minute before trying again.'})
            self.attempts.append(now)
        try:
            length=int(self.headers.get('Content-Length',0))
            if not 0<length<=16384:
                return self.send_error(413)
            data=json.loads(self.rfile.read(length))
            service=data['service']
            item=self.engine.catalog[service]
            token=self.headers.get('X-Manage','')
            details=None if token else clean_details(item,data['details'])
            action=data['action']
            if action not in ('book','move','cancel') or bool(token)!=(action!='book'):
                raise ValueError('Invalid action.')
            receipt=self.engine.apply(data['key'],service,int(data['start']),details,token,action=='cancel')
            self.engine.flush()
            return self.json(200,dict(token=receipt))
        except (CalendarUnavailable,TimeoutError):
            self.json(503,{'error':'Calendar unavailable. Retry the same request.'})
        except Conflict as err:
            self.json(409,{'error':str(err)})
        except (TypeError,ValueError,KeyError,OverflowError,OSError):
            self.json(400,{'error':'Please check your appointment details.'})


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=18771)
    options=parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='sb-scheduling-') as tmp:
        Preview.site=Path(tmp)/'site'
        catalog=prepare(Preview.site)
        Preview.engine=Scheduler(Path(tmp)/'preview.sqlite3',catalog)
        Preview.attempts=deque()
        Preview.limit_lock=threading.Lock()
        server=ThreadingHTTPServer(('127.0.0.1',options.port),Preview)
        print(f'Preview http://127.0.0.1:{options.port}/#services',flush=True)
        def retry_delivery():
            while not stopping.wait(5):
                try:
                    Preview.engine.flush()
                except (TimeoutError,CalendarUnavailable):
                    continue
        stopping=threading.Event()
        worker=threading.Thread(target=retry_delivery,daemon=True)
        worker.start()
        try:
            server.serve_forever()
        finally:
            stopping.set()
            worker.join()
            server.server_close()
