# Redesign offer and intake release

## Intent and acceptance

Implement the approved October 7 homepage mockup with the $1,500 redesign
package immediately after the outcome-focused hero, seven manual portfolio
slides, a vertically centered founder introduction, centered How it works,
and FAQ. Use the approved payment and turnaround copy and first-person voice.
The testimonial slot remains hidden in production until real feedback exists.

Every Start your redesign button opens one intake dialog with name, email,
required website, and improvement details. Remove the project-choice radios.
Use Start my redesign and the approved no-payment/24-hour response reassurance.
Keep the email fallback, accessible dialog behavior, attribution opt-out,
delivery errors and existing backend-compatible improvement payload.

## Protected behavior and non-goals

No backend/API/schema, credential, billing, or concept-page changes. No payment
is collected by the form. Concept demos remain isolated and fictional. Do not
publish empty testimonials or claim conversion gains are proven.

## Validation and release

Run the existing validation workflow, focused intake regression checks, desktop
and mobile browser QA, then independent exact-head review. User explicitly
authorized merge to main and production deployment after validation and review.
Vercel deploys main automatically; verify the merged commit and live homepage
and modal separately. Roll back through a reviewed revert if publication fails.

## Remaining proof

Implementation and local checks completed: 17 backend, 10 intake/attribution,
8 site tests; JavaScript syntax and static build passed. Desktop, 390px and
320px browser checks passed; see design-qa.md. Local Docker is unavailable;
the exact-head GitHub Validate gate must supply container build/smoke proof.
Independent review, merge and live verification remain separate gates recorded
on PR #29. Fresh inbox receipt and actual sales uplift remain unproven.
