"""Private, expiring outreach references. Never expose this database over HTTP."""
import argparse
import csv
import os
import re
import secrets
import sqlite3
import sys
import time
from contextlib import contextmanager

RETENTION = 90 * 86400
TOKEN = re.compile(r'[A-Za-z0-9_-]{32}')
EVENT = re.compile(r'[a-f0-9-]{36}')


@contextmanager
def database():
    path = os.environ.get('ATTRIBUTION_DB')
    if not path:
        raise OSError('Attribution disabled')
    with sqlite3.connect(path, timeout=2) as db:
        db.execute('PRAGMA secure_delete=ON')
        db.execute('PRAGMA foreign_keys=ON')
        db.execute('CREATE TABLE IF NOT EXISTS refs (token TEXT PRIMARY KEY, prospect TEXT NOT NULL, audience TEXT NOT NULL, batch TEXT NOT NULL, created REAL NOT NULL)')
        db.execute('CREATE TABLE IF NOT EXISTS events (token TEXT NOT NULL REFERENCES refs(token) ON DELETE CASCADE, event_id TEXT NOT NULL, kind TEXT NOT NULL, created REAL NOT NULL, PRIMARY KEY(token,event_id,kind))')
        db.execute('DELETE FROM refs WHERE created <= ?', (time.time() - RETENTION,))
        yield db


def known(token):
    if not isinstance(token, str) or not TOKEN.fullmatch(token):
        return None
    try:
        with database() as db:
            return token if db.execute('SELECT 1 FROM refs WHERE token=?', (token,)).fetchone() else None
    except (OSError, sqlite3.Error):
        return None


def record(token, event_id, kind):
    if not isinstance(token, str) or not TOKEN.fullmatch(token) or not isinstance(event_id, str) or not EVENT.fullmatch(event_id) or kind not in ('visit', 'quote_accepted'):
        return False
    with database() as db:
        if not db.execute('SELECT 1 FROM refs WHERE token=?', (token,)).fetchone():
            return False
        # Also bound rows per reference against callers minting new event IDs.
        count = db.execute('SELECT COUNT(*) FROM events WHERE token=?', (token,)).fetchone()[0]
        if count >= 1000:
            return False
        db.execute('INSERT OR IGNORE INTO events VALUES (?,?,?,?)', (token, event_id, kind, time.time()))
    return True


def issue(prospect, audience, batch):
    if audience not in ('agency', 'business') or not re.fullmatch(r'SB-\d{3,6}', prospect) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,64}', batch):
        raise ValueError('Use a prospect ID, agency/business and a short batch slug')
    with database() as db:
        row = db.execute('SELECT token FROM refs WHERE prospect=? AND audience=? AND batch=?', (prospect, audience, batch)).fetchone()
        if row:
            return row[0]
        token = secrets.token_urlsafe(24)
        db.execute('INSERT INTO refs VALUES (?,?,?,?,?)', (token, prospect, audience, batch, time.time()))
    return token


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    create = sub.add_parser('issue')
    create.add_argument('prospect')
    create.add_argument('audience', choices=['agency', 'business'])
    create.add_argument('batch')
    sub.add_parser('report')
    sub.add_parser('purge')
    args = parser.parse_args()
    if args.command == 'issue':
        print('https://www.serviceboost.co/?ref=' + issue(args.prospect, args.audience, args.batch))
    else:
        with database() as db:
            if args.command == 'report':
                writer = csv.writer(sys.stdout)
                writer.writerow(['prospect', 'audience', 'batch', 'tracked_visits', 'accepted_quote_events'])
                writer.writerows(db.execute("SELECT r.prospect,r.audience,r.batch,SUM(CASE WHEN e.kind='visit' THEN 1 ELSE 0 END),SUM(CASE WHEN e.kind='quote_accepted' THEN 1 ELSE 0 END) FROM refs r LEFT JOIN events e ON r.token=e.token GROUP BY r.token ORDER BY r.prospect"))


if __name__ == '__main__':
    main()
