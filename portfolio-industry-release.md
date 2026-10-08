# Industry-specific portfolio experiences

## Intent
Implement the approved October 8 portfolio audit across all seven concepts and the existing auto-repair supporting pages. Preserve the premium image quality and restraint while differentiating page composition, information order and customer tasks.

## Acceptance
- Landscape: project-first garden journal with distinct project views.
- Salon: editorial lookbook linked to service, price and duration.
- Auto repair: compact concern selector, visible approval guidance and useful contact page.
- Restaurant: asymmetric food opening, inline sample reservation and menu categories.
- Dental: bright welcome and visible first-visit guide/practical answers.
- Contractor: project dossier with scope, materials and process chapters.
- Real estate: coherent room gallery and distinct buyer/seller guidance.
- Responsive layouts, keyboard controls, sample preview/edit/reset behavior and no data transmission remain intact.

## Protected behavior / non-goals
Production redesign intake, offer, backend, attribution and current routes remain intact. Concepts remain fictional, noindex and local-only; no invented credentials, results, real listings or availability. No external integrations or new production services. Shared framing stays consistent.

## Validation / release
Run repository checks and desktop/mobile interaction QA, inspect complete diff, then obtain independent exact-head review. This request authorizes implementation and a draft PR. Merge and deployment require separate authorization for this change.

Status: implementation complete; exact-head CI and independent review pending.

## Implemented and checked
- Seven differentiated landing compositions; Juniper services/about retained and checked, contact now renders its authoritative sample form inline.
- Six new locally served fictional AI images: two salon looks, dental welcome, restaurant room, and two Olive House interiors. Existing landscape and contractor imagery retained.
- Native-button editorial switches expose pressed state and control only their own panels. Restaurant and Juniper contact reuse the existing local-only preview/edit/reset flow inline.
- Desktop 1440 × 1000 and phone 390 × 844 checks on all ten routes found no horizontal overflow or broken loaded images. Visual evidence is in the task's `output/portfolio-industry-2026-10-08` folder.
- Browser checks: unavailable restaurant time blocks preview; an available alternative produces the sample summary; salon consultation preselection; landscape, dental and seller preselection; keyboard chapter switching; property kitchen gallery; Juniper URL service preselection and edit preservation.
- Backend unit checks (17), attribution tests (11), site contracts (13), and JavaScript syntax checks pass locally. CI also owns the Docker build/container smoke gate.

Conversion impact, live bookings, real industry services, merge, deployment and production acceptance remain NOT_PROVEN.
