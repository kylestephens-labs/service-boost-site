# Simplified Calendly booking

## Contract

Replace the eligible fixed-price visit wizard with the approved compact service summary and a single Calendly scheduling/intake flow. Preserve catalog prices and scope, diagnostic-charge disclosure, service selection, pay-after-visit terms, quote-only/unavailable services and the existing request-help path. No customer-facing service time caps are added.

Use the existing public Service Boost event. Leave all invitee answers blank, including the optional issue/notes field. Keep selected catalog scope/price on the website and service ID in tracking. Native Calendly owns booking confirmation and management links. No second inquiry is submitted. No API credentials, billing, payment, Yelp changes or backend changes.

## Acceptance

- Selected service and price visible; supplementary details collapsed.
- Real provider calendar and one native intake on production; review build cannot book.
- Legacy visit URLs reach the new route without losing selected service.
- No invented availability, date, confirmation or successful request.
- Safe error/contact fallback, correct keyboard/mobile behavior, no customer data in application storage.
- Exact-head Validate CI and independent review before merge; verify deployed commit and live page separately.

## Scheduling decision

On November 18, the user explicitly accepted the existing appointment overlap risk and instructed implementation, merge and deployment without reconciling that calendar entry. Calendar availability settings are outside this release.

## NOT_PROVEN

Actual booking/notification delivery (no synthetic appointment authorized), travel buffers, and durable service metadata in received provider notifications. Event answers are editable; the website catalog remains authoritative. The public direct Calendly URL lacks service selection. Account plan and connections must not be inferred from public availability.

## Rollback

Revert this PR and allow Vercel to redeploy the previous static homepage. No migration or backend rollback is needed.
