# Service Boost booking preview

Start from the repo root with `python3 scheduler/preview.py` (Python 3.9+ with IANA time zones and Node). Open the printed loopback URL on the same Mac. Use the homepage tiles and ordinary Schedule links. Use sample information. The preview process creates its own temporary static bundle and private SQLite database, and destroys both when it exits normally. It uses no credentials and sends no network requests to a calendar or email service. The preview cannot manage a Calendly booking. Run `python3 -m unittest discover -s scheduler` for scheduler regression tests.

## Current contract and evidence

Read from the two logged-in Calendly event editors and the existing website on November 26 Pacific time. Both events belong to Kyle. The account checks one connected Service Boost Google Calendar and adds events to that calendar. Calendly has access through its own authorization. A replacement app does not inherit that access.

| Setting | Local | Remote |
| --- | --- | --- |
| Existing event | kyle-serviceboost/book-a-visit | kyle-serviceboost/remote-tech-help |
| Internal block | 120 minutes | 45 minutes |
| Start increments | 60 minutes | 30 minutes |
| Before / after buffer | 0 / 60 minutes | none |
| Horizon / minimum notice | 120 calendar days / 4 hours | 120 calendar days / 4 hours (set at launch) |
| User details | Name, email, home address, phone; optional notes | Name, email, one required issue/setup question; optional guests |
| Confirmation | Immediate calendar invitation | Immediate calendar invitation; Google Meet |
| Reminders | Email and SMS off; no follow-up or automation | Same |
| Manage | Include cancellation and reschedule links enabled | Same |

Custom Pacific weekly hours: Mon/Thu 5–9 pm; Wed unavailable; Tue/Fri/Sat/Sun 8–10 am, 11 am–1 pm, 2–4 pm, 5–7 pm. Remote hours were copied at launch and do not automatically track later edits. No sample day is extrapolated. Business windows limit the booked block; a local visit also consumes travel time afterward across both event types. Date overrides and busy intervals are separate inputs. Office days are suppressed in the preview until an explicit commute-clear time is supplied for that date. No access to employer calendars is assumed. Confirm exceptions, final commute clearance, and the interaction of external busy intervals, buffers and date overrides against a test calendar before enabling live inventory.

The website resolves eligible local selections through its existing route guards and task catalog; inquiry-only services retain their inquiry paths. The preview server reads the trusted local catalog and remote cards at startup, including existing prices and terms. The server accepts a service ID, resolves its price and attribution, and keeps the two remote intents distinct. Calendar instants are UTC epoch seconds; office rules use America/Los_Angeles and the displayed time zone is the visitor’s selection. The two-hour internal block is never shown as a labor allowance.

## Calendar, email and recovery

One SQLite write transaction rechecks free/busy and all overlapping intervals, including the travel buffer, before committing a reservation. A pending delivery still blocks its slot. A booking or move also writes a versioned outbox entry; an unsuccessful move retains the original time. The synthetic calendar and email sink process entries in order. Booking IDs identify events, booking/version pairs identify deliveries, and a remote booking gets a unique simulated conference reference. Provider timeouts leave entries for the retry worker. Opaque management links require a random ID and server signature, and the capability stays in the browser fragment. Availability/management responses expose no invitee inputs. Contact data stays in private temporary storage, request logging is disabled, and same-origin JSON writes are rate-limited on the loopback server.

## Before live use

- Authorize a Service Boost-owned server application for free/busy on the permitted busy calendar(s), plus separate write authority on a managed **test** booking calendar. Use a controlled recipient, and verify the calendar supports Google Meet. Never request event descriptions from a conflict source. Treat any missing, partial, stale or failed free/busy response as unavailable. Google documents calendar-specific errors in successful responses. [Free/busy API](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query)
- Use server-only OAuth, offline refresh, encrypted durable token storage, rotation and revocation handling. Confirm the consent-screen publishing status and prove refresh across restarts and expiration. External apps in Testing can receive seven-day refresh tokens for Calendar scopes. No Service Boost-owned Google authorization or refresh lifecycle has been verified. [Google OAuth token expiration](https://developers.google.com/identity/protocols/oauth2#expiration)
- Replace the local sinks with idempotent calendar and mail adapters. Supply a stable Google-compatible event ID, verify an existing event after an ambiguous insert, and use a separate unique conference creation request ID with conferenceDataVersion=1. Wait for successful conference creation before delivering the link; do not reuse conferences across bookings. Validate real invitations, cancellation and rescheduling email with a controlled recipient, including a provider timeout after acceptance. [Create Google Calendar events](https://developers.google.com/workspace/calendar/api/guides/create-events)
- Deploy a persistent shared booking store, centralized rate limits, secrets, retention policy, outbox worker and private delivery-failure monitoring. The local simulator is single-host; its management tokens and records last only as long as the private preview database.
- Only the explicit preview launcher substitutes the scheduler into the isolated review build. The normal website build retains Calendly and has no scheduler endpoints. Future rollout should use independently switchable local/remote provider settings, defaulting to Calendly. For rollback, point new traffic back to Calendly while keeping already-issued owned management links and delivery workers running.
- Inventory direct Calendly links, old confirmations, and both active booking calendars before switching. Keep legacy cancellation/reschedule URLs valid. Reconcile pending events and buffers; avoid two providers selling the same slots concurrently. An application transaction cannot lock an external Calendly or Google writer. Establish a single writer for new reservations or partition the schedule during transition. Get separate approval for any production cutover.

Real Google events, Meet conference issuance, refresh-token persistence, actual email delivery and production concurrency with third-party writers have not been tested.
