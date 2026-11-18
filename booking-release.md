# Simplified Calendly booking

## Contract

Replace the eligible fixed-price visit wizard with the approved compact service summary and a single Calendly scheduling/intake flow. Preserve catalog prices and scope, diagnostic-charge disclosure, service selection, pay-after-visit terms, quote-only/unavailable services and the existing request-help path. No customer-facing service time caps are added.

Use the existing public Service Boost event. Its verified question order is address (a1), phone (a2), issue (a3). Pass selected catalog scope/price into a3 and service ID into tracking; never use editable answers as authoritative pricing. Native Calendly owns booking confirmation and management links. No second inquiry is submitted. No API credentials, billing, payment, Yelp changes or backend changes.

## Acceptance

- Selected service and price visible; supplementary details collapsed.
- Real provider calendar and one native intake on production; review build cannot book.
- Legacy visit URLs reach the new route without losing selected service.
- No invented availability, date, confirmation or successful request.
- Safe error/contact fallback, correct keyboard/mobile behavior, no customer data in application storage.
- Exact-head Validate CI and independent review before merge; verify deployed commit and live page separately.

## Launch blocker

November 18 public inspection still offered November 19 at 17:00 Pacific, conflicting with LaDonna's agreed 17:00–18:00 window. Reconcile the already-authorized calendar entry and verify the slot disappears before releasing live scheduling.

## NOT_PROVEN

Actual booking/notification delivery (no synthetic appointment authorized), travel buffers, and durable service metadata in received provider notifications. Event answers are editable; the website catalog remains authoritative. The public direct Calendly URL lacks service selection. Account plan and connections must not be inferred from public availability.

## Rollback

Revert this PR and allow Vercel to redeploy the previous static homepage. No migration or backend rollback is needed.
