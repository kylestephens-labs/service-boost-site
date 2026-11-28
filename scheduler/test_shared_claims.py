import copy
import tempfile
import unittest
from datetime import date, datetime, time
from pathlib import Path
from engine import CalendarUnavailable, Conflict, PACIFIC, Scheduler
from shared_claims import SharedClaims


class SharedClaimTest(unittest.TestCase):
    def test_independent_worker_replay_and_overlap(self):
        day = date(2026, 12, 3)
        start = int(datetime.combine(day,time(17),PACIFIC).timestamp())
        secret = bytes(range(32))
        props = {'sbDay':day.isoformat()}
        def request(method, url, body=None, etag=None):
            if method == 'PATCH':
                props.update(body['extendedProperties']['private'])
            return dict(etag='fixture', visibility='private',
                        extendedProperties={'private':copy.deepcopy(props)})
        items = {k:dict(kind=k, price='99', name=k, attribution=k) for k in ('local','remote')}
        with tempfile.TemporaryDirectory() as tmp:
            workers = []
            for worker in ('a','b'):
                engine = Scheduler(Path(tmp)/worker, items,
                                   clock=lambda: datetime(2026,12,1,tzinfo=PACIFIC),
                                   configuration=Path(__file__).with_name('google-local.v1.json'))
                engine.secret = secret
                workers.append(SharedClaims(engine,request,{day.isoformat():'fixture'},secret))
            a,b = workers
            details = {'email':'qa@example.invalid'}
            receipt = a.book('a'*24,'local',start,details)
            self.assertEqual(b.book('a'*24,'local',start,details),receipt)
            with self.assertRaises(Conflict):
                b.book('a'*24,'local',start,{'email':'different@example.invalid'})
            with self.assertRaises(Conflict):
                b.book('b'*24,'remote',start+3*3600,details)
            with self.assertRaises(CalendarUnavailable):
                b.book('c'*24,'local',start+86400,details)
            a.cancel('d'*24,'local',start,receipt)
            self.assertEqual(b.book('a'*24,'local',start,details),receipt)
            b.book('b'*24,'remote',start+3*3600,details)
