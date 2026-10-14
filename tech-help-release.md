# Tech help intake release

Replace the seven email-only homepage dialogs with one service-aware request
modal. All service rows and help CTAs open it. Call and Text use the
owner-approved 928-225-7944. Collect name, city/ZIP, issue, and the contact
needed for the chosen text/call/email reply. Keep service boundaries collapsed.

The existing /quote endpoint accepts an additive project_type: tech_support
contract with allowlisted service and reply_method values. Phone-only requests
omit Reply-To. Notifications retain the fixed business recipient. Existing
website clients, origin/body/rate limits, honeypot and SMTP failure behavior
remain protected. Tech requests do not record outreach attribution.

## Promotion and rollback

Main automatically publishes the frontend through Vercel; backend deployment is
manual and requires separate approval. The form checks /tech-help-ready before
enabling submission. Until the matching backend is deployed, visitors see an
explicit form-unavailable message and can call/text. After approved merge,
deploy the reviewed main backend using Deploy quote backend, verify readiness,
then verify the live modal. Do not claim inbox receipt from SMTP acceptance.

No schema migration, new dependency, payment or booking. Revert the frontend
to restore email handoffs. The additive backend can remain or be rolled back
after reverting the frontend; readiness then disables the new form.

## Validation and proof

Run backend unittest discovery, test_site.py, JavaScript syntax checks and
test-attribution.mjs and test-tech-help.mjs; exact-head Validate also runs
Docker build/container smoke.
Inspect desktop/mobile, service preselection, reply switching, Escape/focus,
failed delivery retaining details, duplicate-submit protection, and success.
Use synthetic local delivery only. Live deployment, inbox arrival, call/text
handoff on a physical phone, availability and service outcomes remain NOT_PROVEN.

This contract supersedes the email-only interaction in tech-support-release.md.

The same release refines homepage typography: service descriptions sit below
their titles, desktop supporting text uses a shared fluid 22–26px scale and
service titles 28–34px, with 24px/20px service text on mobile. The founder block
is larger and the closing action has a full-width blue background. Brief hero
entrances and hover feedback respect reduced-motion preferences. The sticky
header, six services, existing imagery and intake behavior remain intact.

Local evidence: all six service rows and the header CTA preselect correctly;
Escape restores trigger focus; the 390px mobile dialog scrolls without horizontal
overflow and keeps Close accessible. Synthetic local responses exercised 502
detail retention and 200 clearing, email reply switching, and native required
field focus. Unit checks cover older-backend readiness and in-flight duplicate
submission. No live customer inquiry, call or text was sent during validation.
