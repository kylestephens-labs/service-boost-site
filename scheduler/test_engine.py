import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, time, timedelta
from pathlib import Path
from threading import Barrier

from engine import CalendarUnavailable, Conflict, PACIFIC, PreviewProvider, Scheduler, UTC
from preview import clean_details


class BookingTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.provider=PreviewProvider()
        self.now=datetime(2026,11,26,16,tzinfo=UTC)
        self.items={'0/1':dict(name='Printer',kind='local',price=229,attribution='service-0-1'),
                    'remote-fix':dict(name='Fix a problem',kind='remote',price='99.99',attribution='remote-fix')}
        self.app=Scheduler(Path(self.tmp.name)/'test.sqlite3',self.items,self.provider,lambda:self.now)
        self.day=datetime(2026,11,28).date()
        self.contact={'name':'Sample','email':'demo@example.invalid'}

    def slots(self,service):
        with self.app.transaction() as db:
            return self.app.slots(db,service,self.day)

    def book(self,key,service,start):
        return self.app.apply(key*24,service,start,self.contact)

    def test_rules_and_busy_intervals(self):
        local=self.slots('0/1')
        self.assertEqual([datetime.fromtimestamp(s,PACIFIC).hour for s in local],[8,11,14,17])
        remote=self.slots('remote-fix')
        self.assertEqual(len(remote),12)
        with self.app.transaction(True) as db:
            db.execute('INSERT INTO busy VALUES(?,?)',(local[0]+7200,local[0]+9000))
        self.assertNotIn(local[0],self.slots('0/1'))  # Busy during local travel buffer.
        self.assertIn(remote[0],self.slots('remote-fix'))
        with self.assertRaises(Conflict):
            self.book('a','0/1',local[0])

    def test_simultaneous_cross_type(self):
        start=self.slots('0/1')[0]
        gate=Barrier(2)
        def reserve(pair):
            key,service=pair
            gate.wait()
            try:
                self.book(key,service,start)
                return True
            except Conflict:
                return False
        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(sorted(pool.map(reserve,[('a','remote-fix'),('b','0/1')])),[False,True])

    def test_duplicate_submit_and_recovery(self):
        start=self.slots('remote-fix')[0]
        token=self.book('a','remote-fix',start)
        def timeout(*args):
            raise TimeoutError()
        self.provider.deliver=timeout
        with self.assertRaises(TimeoutError): self.app.flush()
        self.assertNotIn(start,self.slots('0/1'))
        self.assertEqual(self.book('a','remote-fix',start),token)
        del self.provider.deliver
        self.app.flush()
        self.app.flush()
        with self.app.transaction() as db:
            for table in ('messages','events','bookings'):
                self.assertEqual(db.execute('SELECT count(*) FROM '+table).fetchone()[0],1)
        with self.assertRaises(Conflict):
            self.book('a','0/1',start)

    def test_management_and_token(self):
        start,next_time,*_=self.slots('0/1')
        token=self.book('a','0/1',start)
        with self.assertRaises(ValueError):
            self.app.apply('b'*24,'0/1',next_time,token=token+'1')
        with self.app.transaction(True) as db: db.execute('INSERT INTO busy VALUES(?,?)',(next_time,next_time+900))
        with self.assertRaises(Conflict): self.app.apply('b'*24,'0/1',next_time,token=token)
        self.assertNotIn(start,self.slots('remote-fix'))
        with self.app.transaction(True) as db: db.execute('DELETE FROM busy')
        self.app.apply('b'*24,'0/1',next_time,token=token)
        self.assertIn(start,self.slots('remote-fix'))
        self.app.apply('c'*24,'0/1',next_time,token=token,cancel=True)
        self.app.flush()
        self.assertIn(next_time,self.slots('remote-fix'))

    def test_unavailable_at_commit(self):
        start=self.slots('0/1')[0]
        self.provider.available=False
        with self.assertRaises(CalendarUnavailable): self.slots('0/1')
        with self.assertRaises(CalendarUnavailable): self.book('a','0/1',start)
        with self.app.transaction() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM bookings').fetchone()[0],0)

    def test_dst_and_notice(self):
        for month,first,last,utc_hours in [(3,7,8,[16,15]),(10,31,32,[15,16])]:
            self.now=datetime(2026,month,1,tzinfo=UTC)
            first_day=datetime(2026,month,first).date()
            hours=[]
            for day in (first_day,first_day+timedelta(days=1)):
                self.day=day
                stamp=self.slots('remote-fix')[0]
                self.assertEqual(datetime.fromtimestamp(stamp,PACIFIC).hour,8)
                hours.append(datetime.fromtimestamp(stamp,UTC).hour)
            self.assertEqual(hours,utc_hours)
        self.now=datetime.combine(self.day,datetime.min.time(),PACIFIC)+timedelta(hours=7)
        self.assertTrue(all(s>=self.now.timestamp()+4*3600 for s in self.slots('remote-fix')))
        self.day+=timedelta(days=121)
        self.assertEqual(self.slots('remote-fix'),[])

    def test_office_and_commute_fail_closed(self):
        self.day=datetime(2026,11,30).date()
        self.assertFalse(self.slots('remote-fix'))
        self.app.commute_clear[self.day]=time(18,15)
        self.assertTrue(self.slots('remote-fix'))
        self.assertTrue(all(datetime.fromtimestamp(s,PACIFIC).time()>=time(18,15) for s in self.slots('remote-fix')))

    def test_required_intake_and_no_client_price(self):
        for item in self.items.values():
            with self.assertRaises(ValueError): clean_details(item,self.contact)
        fields=dict(self.contact,notes='Sample issue',price=0,address='Sample',phone='5550100')
        self.assertNotIn('price',clean_details(self.items['0/1'],fields))
        self.assertNotIn('address',clean_details(self.items['remote-fix'],fields))


if __name__=='__main__': unittest.main()
