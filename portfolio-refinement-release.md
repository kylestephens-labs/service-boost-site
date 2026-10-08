# Portfolio refinement

## Intent
Preserve the premium visual identities of all seven fictional concepts while
making services, practical details and next steps easier to understand. Landscape
follows the approved restrained Field & Form mockup. Apply the same principles
to salon, restaurant, dental, contractor, real estate and all four Juniper pages.

## Acceptance
- Large imagery, generous spacing and concise page copy; supporting details open on demand.
- Clear service choices carry into isolated sample inquiries; buyer and seller paths remain relevant.
- Practical customer information and honest next-step previews are accessible without dense main-page sections.
- A quiet shared design explanation and redesign link connects each concept to Service Boost.
- Desktop and mobile navigation, dialogs, validation, edit/reset and keyboard dismissal work.
- All demo information stays local; no live messages, bookings, health intake or payments.
- Existing real redesign intake, backend contract, attribution and homepage offer remain protected.

## Scope and release
One feature branch and PR from current main. Existing assets are reused to preserve
the approved identities. No backend/schema changes, new providers or fabricated
customer outcomes. The user authorized implementation, merge to main and production
deployment in this chat. Exact-head validation and independent review precede merge.
Vercel deployment and the live routes must be checked separately after merge.

## Validation
Implemented and locally validated: 17 backend tests, 11 attribution/intake tests,
11 site contracts, three JavaScript syntax checks and the static build pass.
All ten routes were inspected at desktop and 390px; 320px overflow checks pass.
All seven sample flows, 23 detail triggers, edit/reset, invalid availability,
service preselection and the concept/ref handoff were exercised in the browser.
No live request was submitted. See design-qa.md for evidence and limitations.

Consolidation keeps shared framing in the build, shared presentation in one
stylesheet and dialog/sample handling in site-ui.js. The complete change was
checked against the scope. Production app.js, config.js and backend are unchanged.
Local Docker is unavailable; the required exact-head Validate workflow must prove
the Docker build and container smoke check. Independent review, merge and live
deployment verification remain release gates recorded on the PR.

## NOT_PROVEN
Real delivery, actual appointments, customer conversion uplift and operator results
are outside fictional demo validation. Rollback is a frontend revert.
