# Approved portfolio release QA

Date: October 5, 2026 (Pacific).

Source truth is the user-approved local portfolio preview, including the later
About/FAQ restoration, sticky navigation and replacement headshot. The original
selected board is `exec-64684b84-d7f0-49fd-9020-b91628a83cf1.png` in the chat's
generated-images directory. The final approved prototype is at
`../portfolio-preview`; production presentation uses ordinary static HTML/CSS.

## Visual evidence

- Source: `/private/tmp/serviceboost-approved-desktop.jpg`.
- Static release: `/private/tmp/serviceboost-release-desktop.jpg`.
- Mobile release: `/private/tmp/serviceboost-release-mobile.jpg`.
- Source URL: `http://127.0.0.1:4173/`.
- Release URL: `http://127.0.0.1:4174/` (public-site output).

Both desktop full-page images are 1185 × 2546 pixels, from a 1200 × 900 CSS
viewport with the scrollbar omitted. They were opened in the same comparison
input at equal density. The initial unequal-width capture was replaced before
the final comparison. Mobile was separately inspected at 390 × 844.

No material visual differences remain between the approved homepage and release.
The footer intentionally replaces the local-preview disclaimer with production
copy. The quote CTA intentionally opens the real intake rather than a dummy form.
Focused browser captures checked the About portrait and sticky header, and the
real quote dialog at desktop and mobile sizes.

Required fidelity surfaces: DM Sans and Libre Caslon Display retained; section
spacing, grids and responsive stacking retained; blue/white, olive/cream and
burgundy/charcoal tokens retained; supplied headshot and generated concept assets
retained without substitutes; approved headlines, FAQ and About text retained.

## Functional evidence

- All three quote CTAs share the production quote dialog. Existing `app.js`,
  `config.js` and backend bytes are unchanged from main.
- Build selection makes the website optional; improve selection requires it.
- Invalid website input shows the existing error before any request is sent.
- Privacy notice, email alternative, honeypot and attribution contract retained.
- Both concept routes load and their demo forms reach explicit no-send
  confirmation. Project detail dialog opens and closes.
- Demo forms use `method="dialog"` as a no-transmission fallback without JS.
- About anchor, sticky navigation, headshot and mobile quote dialog inspected.
- Browser console error inspection returned none.
- No real inquiry was sent during verification. Fresh inbox delivery remains
  NOT_PROVEN by this frontend release; no backend deployment is required.

## Checks and review boundary

17 backend unit tests, 9 quote/attribution tests and 4 static integration tests
pass. The static build and JS syntax checks pass. GitHub Validate also runs Docker
build and the container smoke test on the exact PR head. Exact-head CI and an
independent review are required before merging; this file does not certify them.

All changed paths concern the approved frontend, its static packaging, tests or
documentation. Shared dialog wiring replaces prototype React state; no frontend
runtime dependency was added. Rollback is a revert of the frontend commit.

Independent review identified dropped outreach references during portfolio round
trips. Navigation now carries only a validated 32-character ref through concept
links and return links. Brand links use same-page fragments. Regression tests
cover both round trips and the resulting quote payload, malformed refs, unrelated
query data and explicit opt-out by removing ref. No storage-based restoration.

final result: passed
