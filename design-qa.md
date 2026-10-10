# Service-aware popup QA — October 10, 2026

Source visual: `/Users/kylestephens/.codex/generated_images/01a093d4-f7dc-7413-8dc8-fe858777f181/exec-a6392e71-28fe-4a34-aea8-11a36dffcc5e.png` (1036 x 1518), an approved comparison board showing two states of one modal. The user explicitly confirmed these must remain popup dialogs over the page.
Implementation: built public-only preview at `http://127.0.0.1:8768/`. Final desktop captures: `/private/tmp/service-intake-updates-final.png`, `/private/tmp/service-intake-redesign-final.png`, `/private/tmp/service-intake-page-faq.png` (1428 x 1091 each). Mobile: `/private/tmp/service-intake-updates-mobile.png`, `/private/tmp/service-intake-mobile-footer.png`, `/private/tmp/service-intake-narrow-final.png` (last 308 x 722).
Viewports: desktop 1440 x 1100 CSS; mobile 390 x 844 and 320 x 750. Browser override needs a 1.2 multiplier at the current zoom. Captures include unused canvas padding; normalized comparison uses modal content width and ignores that padding. Source is a multi-state board, while implementation shows one real popup at a time; the full board and both desktop states were opened together for comparison.

Typography: existing DM Sans family, strong navy heading, readable labeled controls and purple submit action. Spacing: a single dropdown beneath the heading divider, consistent field grouping, scrollable modal on short screens. Colors: existing navy/purple/slate palette and white surface; existing dimmed native backdrop intentionally replaces the board's pale presentation background. Assets: existing site imagery and native controls preserved; no new image assets needed. Copy: both exact dropdown choices, matching titles/prompts/submit labels, no Change service control, approved FAQ only in the page, removed hourly subtitle. Intentional accessible variations: existing text Close button, native select affordance, stacked privacy/email footer, and website/email placeholder examples remain. Footer arrangement is P3 polish only.

Initial P2: at 320 CSS pixels the long hourly option was truncated by the browser's default dialog maximum width. Set an explicit viewport-based max-width and reduced narrow-screen padding/select type. Recaptured `service-intake-narrow-final.png`; full selected value is visible and no horizontal overflow remains. Desktop final captures were then compared with the source; no actionable P0/P1/P2 findings remain. Full-view modal text is legible at original size, so a separate focused crop was unnecessary.

Interactions checked: both entry services, dropdown changes preserving name/email/website/message, native `:modal` state, Escape close and trigger focus restoration, mobile footer access, direct `#request` default, allowlisted concept context, and page FAQ expansion. Console error log empty. No real request submitted; payload, success/reset, failure/retry, bounds and pending-submit behavior are covered by deterministic tests. Fresh inbox receipt remains NOT_PROVEN.

Implementation checklist: visual comparison complete; responsive correction verified; popup behavior verified; exact-head CI and independent review required before merge.

final result: passed

---

# Service offer hierarchy QA — October 10, 2026

Source visual: `/Users/kylestephens/.codex/generated_images/01a093d4-f7dc-7413-8dc8-fe858777f181/exec-8d370bf1-139d-447b-9175-ec0f9076cbcc.png` (1435 x 1096), with the requested single hourly heading, “Website updates & small fixes.”
Implementation: `http://127.0.0.1:8123/#package`, desktop `/private/tmp/service-hierarchy-desktop-v2.png` (1428 x 1091), mobile `/private/tmp/service-hierarchy-mobile.png` and `/private/tmp/service-hierarchy-mobile-updates.png`.
Desktop CSS viewport: 1440 x 1100. Mobile: 390 x 844; narrow overflow check: 320 pixels. Browser zoom requires a 1.2 override multiplier. Captures contain unused white padding; comparison normalized the visible content width, excluding padding. The generated reference supplies composition rather than exact font metrics.

Full reference and implementation were opened together for comparison. The initial capture (`/private/tmp/service-hierarchy-desktop.png`) had a P2 hierarchy mismatch: redesign type and section height were too compact. Enlarged the title, price, CTA and checklist, increased padding, and restored the hourly column divider. The v2 capture resolves that finding. Both offers and their text are readable in the full comparison, so an additional focused crop was unnecessary.

Typography: existing site family retained; larger redesign title and price, smaller hourly title and price. Spacing: dominant navy block followed by compact white offer, aligned columns and mobile stacking. Colors: existing navy, lavender and purple tokens retained; outline hourly action. Assets: existing brand and check SVG retained, no replacement artwork. Copy: one hourly heading, short supporting sentence, separate action labels and explicit hourly terms; existing prices and inclusions retained. Header size and exact font metrics follow the existing site intentionally. No remaining actionable P0/P1/P2 findings.

Both offer buttons open the existing neutral dialog; close works on desktop and mobile. No horizontal overflow at 1440, 390 or 320 CSS pixels. Browser error log empty. No form submitted. Live email delivery and conversion impact remain NOT_PROVEN. No backend, attribution or schema changes.

Implementation checklist: desktop comparison complete; responsive check complete; primary interactions complete; exact-head CI and independent review required before merge.

final result: passed

---

# Two-service section QA — October 9, 2026

Source: `/Users/kylestephens/.codex/generated_images/01a093d4-f7dc-7413-8dc8-fe858777f181/exec-f97c77c3-b12e-43ea-8f2f-c0ab48eddc80.png` (1190 x 1322 raster), with the user-requested removal of the intro and shared footer disclaimer.
Implementation: local homepage `http://127.0.0.1:8123/#package`.
Evidence: `/private/tmp/services-desktop-final.jpg` and `/private/tmp/services-mobile.jpg`.
Desktop CSS viewport 1440 x 1500; mobile 390 x 844. Browser zoom required a 1.2 viewport override multiplier; screenshot output includes unused white padding, excluded from visual comparison. Source is a conceptual raster, normalized by content width rather than treated as a pixel-exact CSS specification.

Compared reference and desktop capture together, including both service rows. Navy surface, lavender prices, purple buttons, aligned columns, check icons and stacked composition match. Existing font and icon assets retained. Intro and disclaimer are absent as requested; hero and portfolio are preserved. Mobile stacks each offer and checklist with readable wrapping and no horizontal overflow. No new imagery needed.

Initial P2: vertical checklist dividers did not span the offer height. Fixed with stretch alignment and centered list content, then recaptured and inspected both full service rows. No remaining P0/P1/P2 findings. Typography, spacing, palette, asset fidelity and copy checked; responsive sizing intentionally uses existing site typography.

Both service buttons open the same neutral inquiry dialog; close works on desktop/mobile. Browser error log empty. Existing automated tests cover required/invalid website input, unchanged improve payload, failed delivery and success/reset copy. No live email submitted; fresh inbox delivery NOT_PROVEN. No backend changes.

final result: passed

---

# Restrained portfolio refinement QA

Date: October 7, 2026 (Pacific). Ten routes across seven fictional concepts.
Implementation: built public-site at http://127.0.0.1:58607/.
Visual source: the approved restrained Field & Form mock,
`output/portfolio-mocks-2026-10-07/01-landscape-refined.png`, in the parent task.
For the other routes, existing compositions supply the visual identities;
the approved principles are concise copy, generous space and details on demand.

## Visual evidence and normalization

Evidence folder:
`/Users/kylestephens/Documents/Codex/2026-09-11/what-is-x20/output/portfolio-refinement-qa/`.
Each route has a `-desktop.png` and `-mobile.png` capture. Desktop uses 1440px
CSS width; phone uses 390px. Captures exclude the 15px scrollbar. Browser
measurements also confirm no horizontal overflow at 320px on all ten routes.
The comparison HTML files put reference and implementation at equal width
without stretching heights. All ten combined comparisons were inspected.
`comparison-landscape.png` records the final approved-mock comparison.

The source raster is an illustrative composition, not an exact CSS specification.
Other original desktop captures use 1280px CSS width versus 1440px for the
implementation; comparisons assess composition and hierarchy after normalization.
Existing images are reused rather than the mock's regenerated variants.
All ten real phone captures were inspected separately.

Initial P2: landscape headings and service labels were too small against the
approved reference. Increased their desktop scale and rechecked the combined
comparison. No actionable P0/P1/P2 remains in the checked states.

- Typography: DM Sans and Libre Caslon retained; stronger landscape hierarchy,
  concise service labels and readable dialog controls.
- Layout: image-led identities retained, quieter main pages, selectable service
  rows and supporting information behind explicit buttons. Juniper Contact
  now has a workshop image and useful introduction before its request action.
- Color: existing olive, cream, burgundy, terracotta and charcoal palettes retained.
- Assets: existing concept images and arrow assets only; no new dependencies.
- Copy: location/service context is labeled fictional or illustrative; no results,
  real listings, clinical suitability, licenses or completed work are fabricated.
  Shared design explanations distinguish design intent from measured outcomes.

## Runtime evidence

- All seven demo flows preview local sample requests. Service choices preselect
  correctly; sample autofill, required fields, edit, reset, close and Escape work.
- Restaurant rejects its unavailable sample time and accepts the offered
  alternative. Contractor previews an out-of-area next step. Buyer/seller labels
  and summaries differ correctly. Dental collects selections, not health data.
- All 23 detail-panel triggers open the intended native dialog and close cleanly.
- Juniper service links open the selected request; Contact navigation reaches
  the page without opening a dialog automatically.
- Sample text containing HTML syntax renders literally; no elements are injected.
- Landscape redesign handoff retains its allowlisted concept and validated ref;
  all real intake fields remain empty. No live submission was made.
- No browser warning/error entries were recorded during these checks.

## Validation and limitations

17 backend tests, 11 attribution/intake tests, 11 site tests, all three JavaScript
syntax checks and static build pass locally. Docker is unavailable locally;
exact-head Validate CI owns the container build and smoke test.
Shared framing and sample controls are generated once; dialog handling is shared.
Production intake delivery, configuration, backend and deployment settings are
unchanged. Independent review and live deployment checks are separate PR gates.
Actual bookings, inbox delivery and conversion uplift remain NOT_PROVEN.

final result: passed

---

# Redesign offer and intake release QA

Date: October 7, 2026 (Pacific).
Source visual truth:
`/Users/kylestephens/.codex/generated_images/01a093d4-f7dc-7413-8dc8-fe858777f181/exec-051502e1-1e45-443d-bd90-426a736b6ad5.png`.
Latest user changes override this source: vertically center founder copy,
center How it works, rename FAQ, and replace quote choice with redesign intake.
Implementation: `http://127.0.0.1:58601/`, built public-site.

## Evidence and normalization

Evidence folder:
`/Users/kylestephens/Documents/Codex/2026-09-11/what-is-x20/output/redesign-qa/`.
Source raster: 724 × 2172, a generated desktop composition rather than measured
CSS. Implementation: desktop-final.png, 1425 × 3692 from 1440 × 1000 CSS,
1× capture with scrollbar excluded. comparison.png places both full-page
images together at equal 620px width without stretching their heights.
State: first carousel slide, first two FAQs expanded, dialog closed.

Focused evidence: desktop-v1.png (1265px content width), modal-desktop.png,
mobile-v1.png and modal-mobile.png (390 × 844 CSS), narrow-320.png
(320 × 740 CSS). The complete source/render composite and these focused views
were inspected. Browser measurements confirm founder image and copy centers
at 354.535px and 354.531px, and process-heading text-align: center.

## Findings and required fidelity surfaces

No actionable P0/P1/P2 issue remains in the checked states.

- Typography: existing DM Sans retained; two-line outcome headline, prominent
  price, 16–22px readable UI/body copy. Labels and paragraphs wrap without
  clipping at 320px, 390px and desktop. Generated raster scaling is not a
  pixel-perfect font specification.
- Layout: outcome → package → one-slide portfolio → founder → process → FAQ.
  Founder copy is centered vertically, process title centered, FAQ title exact.
  The reserved empty testimonial section is hidden in production intentionally.
- Colors: white, navy and pale lavender retained. The price uses lighter violet
  on navy for readable contrast; primary buttons retain brand indigo.
- Assets: supplied portrait/logo retained. Seven compressed device showcase
  images reference the actual concept designs, replacing the mock's invented
  GreenScape example. Phone layouts are illustrative adaptations; concept links
  lead to the real interactive pages. Icon assets are MIT-licensed Tabler.
- Copy: approved single-person hero, package, payment terms, timeline, approval
  reassurance and final CTA. Removed package/about eyebrows and personally.
  Intake title, labels, button, 24-hour reassurance and email fallback match the
  user's exact request. No fake testimonials or outcome statistics.

The shorter total page reflects the intentionally unpublished empty testimonial
slot and responsive real text. This is accepted composition variance, not a
claim of pixel-identical implementation. No visual repair loop was needed after
the first captured comparison; subsequent captures verify other states.

## Runtime and regression checks

- All four Start your redesign buttons open the same native dialog.
- Required website blocks a blank submission; malformed text shows a focused,
  associated error. Neither check sends a request.
- Carousel last-slide dot → 7/7, previous → 6/7, keyboard right → 2/7.
  Landscape Explore the concept opens the correct route; return link works.
- FAQ disclosure toggles, including platform answer. No horizontal overflow
  at 320px or 390px. Browser console warning/error list empty.
- 17 backend unit tests, 10 intake/attribution tests, 8 site integration tests,
  three JavaScript syntax checks and static build passed locally.
- Docker daemon is unavailable locally; the unchanged required GitHub Validate
  workflow owns Docker build/container-smoke proof on the exact PR head.
- No live inquiry was sent. Fresh inbox receipt and sales uplift are NOT_PROVEN.
  Independent review, merge and Vercel/live checks are separate release gates.

final result: passed

---

# Historical readable homepage release QA

Latest portfolio refinement (October 6, 2026): see [refinement-qa.md](refinement-qa.md)
for Juniper, landscape and salon changes, carousel checks and visual evidence.
PR #26 records final release validation and publication status.
The release QA below records the earlier homepage work.

Date: October 5, 2026 (Pacific).
Source: user-approved combined mockup with the top eyebrow and services section removed.
Visual target: /Users/kylestephens/.codex/generated_images/01a093d4-f7dc-7413-8dc8-fe858777f181/exec-400bb42a-4345-4352-965b-b2a1cba7d065.png
Implementation: http://127.0.0.1:4174/ (built public-site output).

## Comparison and findings

Source raster is 876 x 1796; it depicts a desktop composition, not a measured
CSS viewport. Implementation desktop is 1425 x 2735 pixels from a 1440 x 1000
CSS viewport (scrollbar excluded). Source and implementation were opened together
in one comparison input, comparing proportional width and section composition
rather than claiming pixel identity across this generated raster and real CSS.
Both show the homepage with the quote dialog and FAQ closed.

- Initial P2: the landscape thumbnail cropped its headline. Changed cover to
  contain and retained the supplied screenshots' taller natural proportions.
  Initial evidence: /private/tmp/sb-redesign-desktop.jpg.
  Post-fix desktop: /private/tmp/sb-redesign-desktop-v2.jpg.
- Initial P2: at 320px the wrapped sticky header covered the process section
  after navigation. Reduced narrow header sizing and increased responsive anchor
  offsets. Post-fix: /private/tmp/sb-redesign-narrow.jpg, section top 194.75px
  versus header bottom 157px. At 768px, section top 159.92px versus header 139px.
- Hero typography and portrait proportions were adjusted after the first
  comparison. The revised desktop capture was compared with the source again.
- No remaining actionable P0/P1/P2 findings in the checked states.

## Required fidelity surfaces

- Typography: existing DM Sans retained; 18px body copy, 16px desktop navigation,
  24px project headings, 48px desktop section headings, prominent two-line hero.
  Mobile body remains 18px, navigation 15px, and headings reflow without clipping.
- Layout: hero portrait at right; process immediately below; two example columns;
  full-width FAQ and closing quote band. White, pale lavender and cool-gray
  sections match the selected structure. No visible form on initial load.
- Colors: blue CTAs and emphasis, navy text and muted supporting text. The real
  brand asset is retained. No new decorative imagery or dependencies.
- Assets: original supplied portrait and actual concept screenshots are reused.
  Their natural aspect ratios intentionally differ slightly from the generated
  mock so no content is cropped. Both concept pages keep their original styles.
- Content: approved headline, process and example copy; no services section or
  top eyebrow. FAQ answers, privacy notice and actual quote intake are retained.
  The mock's stale Services link is replaced by How it works.

Native FAQ disclosure markers remain at the left instead of the mock's right
chevrons (P3 fidelity detail). Portrait uses the original photograph rather than
the image generator's softened rendition. No claim of pixel-perfect identity.

## Runtime and focused checks

- Desktop full-page comparison plus focused tablet examples, narrow navigation,
  and mobile dialog screenshots were inspected.
- Mobile evidence: /private/tmp/sb-redesign-mobile.jpg (375 x 3700 pixels,
  390 x 844 CSS viewport); modal: /private/tmp/sb-redesign-mobile-quote.jpg.
- 320px, 390px and 768px widths checked without horizontal overflow.
- All three quote buttons open the one native dialog. Escape closes it and
  restores focus to the quote button.
- Build selection leaves website optional; improve requires it as before.
  A malformed supplied URL is rejected and focused before network submission.
- FAQ opens and exposes the existing price/approval text.
- Both new text links open their concept page; return links work.
- Browser console error log is empty.
- app.js, config.js, site-ui.js, backend and concept HTML are unchanged.
- No live inquiry was sent. Actual fresh inbox delivery remains NOT_PROVEN.

## Validation and scope

17 backend tests, 9 quote/attribution tests, and 4 static integration tests pass.
Stylesheet references are now included in asset checks. Static build includes
homepage.css. Required exact-head GitHub Validate includes Docker build/smoke.
Independent review and deployment status are separate gates recorded on the PR.

Consolidation removed superseded homepage rules from shared style.css and placed
the new homepage presentation in homepage.css, preserving concept-page rules.
No schema or backend migration. Rollback is a revert of this frontend change.

final result: passed
