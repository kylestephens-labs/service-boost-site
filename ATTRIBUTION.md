# Outreach attribution

Source implementation only until separately approved deployment and end-to-end
verification. No email sends, recurring inbox tests, draft edits, or third-party
subscriptions are activated by this PR.

## Data and limits

- A private SQLite volume holds random 192-bit references mapped to prospect ID
  (not email/name), audience (`agency`/`business`), batch and creation time.
- Only `visit` and server-generated `quote_accepted` events are stored. Each has
  a reference, event ID and timestamp. Quote acceptance means SMTP acceptance,
  not inbox delivery. Gmail remains the source of truth for inquiries.
- References expire 90 days after issuance; events cascade-delete. Every store
  operation purges expired records, plus an hourly Gunicorn maintenance thread
  while the container runs. A stopped service cannot purge until restarted.
  Do not retain volume backups beyond this policy. Secure-delete is enabled.
- No IP, user-agent, form contents or fingerprint is written to this database.
  IPs are used only in bounded ephemeral abuse counters. Keep proxy request
  logging disabled, including frontend URL logs that could contain references.
- A tab session reuses its visit event ID on reload. Private browsing, blocked
  storage, forwarded links and scanners limit accuracy. Count these as tracked
  visits, never verified people or an exact click rate. Explicit visibility,
  webdriver and common bot-agent checks reduce obvious noise, not all bots.
- `/events` accepts only visit events, known unexpired references, exact allowed
  browser origins and small JSON bodies. Existing limits of 5 requests/IP/hour
  and 50 globally/hour apply in a separate event budget. No owner bypass for
  events. These deliberately conservative limits may undercount; adjust only
  after reviewing real traffic. Origin checks are not authentication.
- Database errors never turn an accepted quote into a failure. The email includes
  its validated reference for reconciliation if event recording failed. A retry
  event ID deduplicates analytics, not SMTP sends (existing no-auto-retry policy).
- No public reporting, registration or reference-lookup endpoint exists.

## Deployment and private link creation

Deploy backend first via the existing protected workflow; verify the named volume
is writable by UID 65534 and persists across container recreation. Then publish
the frontend and updated privacy notice. Do not alter production without approval.
The Docker image supplies ATTRIBUTION_DB=/data/attribution.sqlite3.

Run these commands on the authorized host from `/opt/serviceboost`:

```
docker compose exec -T quote python attribution.py issue SB-028 agency 2026-09-batch3
docker compose exec -T quote python attribution.py report
docker compose exec -T quote python attribution.py purge
```

Issuance is idempotent for an unexpired prospect/audience/batch tuple. Keep generated
URLs private, in the existing restricted prospect sheet. Never commit the mapping,
report or database. Issue a different prospect ID for authorized tests so their
activity can be excluded. Do not reuse real prospect links for QA.

After deployment verification, issue references for the still-unsent drafts;
update only the signature hyperlink target and reopen each draft to verify the
recipient, unchanged copy and correct destination. Keep visible link text intact.
Record the reference/link and batch in the private sheet. Already-sent messages
cannot be retroactively tagged. Draft link changes wait until endpoints work.

## Reporting in the existing sheet

The private CSV report contains prospect ID, audience, batch, tracked visits and
accepted quote events, including zero-activity references. Join by prospect ID;
never overwrite Gmail outcomes with analytics. Per audience/batch show sent,
bounced, prospects with tracked visits, qualified replies, quote requests and paid
jobs. Count prospects with >0 visits separately from event totals. Keep initial
sends and follow-ups separate; use a shared observation window and exclude tests.
Sent/bounce/reply/job values come from Gmail and the tracker, not this database.
Show unknowns rather than invented zeroes. Reconcile on demand; scheduling later
requires explicit authorization. Expired references disappear from the report.

## Inbox placement tests

Await specific authorized Gmail and Outlook test recipients before sending. No
test recipients are assumed and no mail is sent by the analytics code. Use the
actual subject/body/signature with a dedicated test reference. Record this header
in a private sheet when test accounts are provided:

`Date | Provider | Test address | Template/version | Sent time | Observed folder | Checked time | Notes`

Check the actual mailbox, not delivery receipts. Mark unobserved results unknown.
Report e.g. “1 Gmail inbox, 1 Outlook junk”, not a prospect inbox-placement rate.
Run on demand before a batch or after a material template/delivery change; no
periodic automation is enabled by this change.

## Validation and rollback

Run `python3 -m unittest discover -s backend -p 'test_*.py'`,
`node --test test-attribution.mjs`, `node --check app.js`, and
`python3 build-site.py`. Public output must contain no private database/mapping.
Use only mocked SMTP for local tests. Production acceptance requires an authorized
test visit plus a separately authorized test quote and inbox confirmation.

Rollback the frontend tracking and backend image together. Preserve the volume
for investigation only within retention; do not run `docker compose down -v`.
If rolling back to code without cleanup, arrange approved purge of retained data
within its original retention period. Link parameters are harmless to old code.
