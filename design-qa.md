# Builds and proof homepage QA

Date: September 28, 2026 (Pacific).

Source visual truth: approved generated mockup
`/Users/kylestephens/.codex/generated_images/01a093d4-f7dc-7413-8dc8-fe858777f181/exec-9bdf221c-d431-44b7-972b-158a04d02749.png`
(837 × 1879 pixels). Implementation: `http://127.0.0.1:8126/`.

## Evidence and comparison

Evidence directory:
`/Users/kylestephens/Documents/Codex/2026-09-11/what-is-x20/work/builds-proof-qa/`

Desktop CSS viewport 1440 × 1000, device pixel ratio 1. Browser screenshots omit
the scrollbar and can report 1425 × 990. Source and implementation regions were
normalized to 720 pixels wide, preserving aspect ratio, and viewed together:

- `compare-hero.png`: source hero beside `desktop-hero.png`.
- `compare-work.png`: source proof section beside `desktop-work.png`.
- `compare-about.png`: source About/process/footer beside `desktop-about.png`.
- `mobile-hero.png` and `mobile-form.png`: 390 × 844 responsive render and form state.

The browser's stitched full-page output contained duplicate regions and blank
canvas. It was discarded as comparison evidence. Individual viewport captures
cover the page instead. Mobile and 320px checks had no horizontal overflow.

## Findings and iteration history

Initial pass found P2 hierarchy drift: hero type was too small and vertically
centered too low. Increased the display scale, aligned the pitch toward the top,
and adjusted the hero tracks. The revised hero comparison preserves the three
headline lines, yellow emphasis, gray form panel and clear page margins.

Mobile pass found P2 wrapping of the navigation CTA and unequal project choice
heights. Reduced mobile CTA type/padding, prevented CTA wrapping, and stretched
the choice labels equally. The revised mobile capture shows a single-line CTA,
readable content and no clipped fields.

Required fidelity surfaces:
- Typography: existing Arial family retained; strong display scale and hierarchy.
  Persistent field labels improve usability over placeholder-only mock inputs.
- Spacing: aligned content edges, paired service/proof columns, stacked mobile
  layout, gray form padding and compact process row match the intended structure.
- Colors: existing cobalt #234bf1 and pale yellow #faf6ac retained, with white and
  gray form surfaces. Flat fills intentionally replace generated-image texture.
- Assets: actual original-site screenshot, existing booking illustration, and
  MIT-licensed Tabler desktop/tool icons. No fabricated customer work or results.
- Copy: approved build/repair and personal introduction copy retained. Internal
  editorial instructions and the mock portrait placeholder are not published.

Acceptable differences: the real screenshot and existing booking illustration
retain their original landscape proportions instead of the mock's approximate
square images. About now uses Kyle’s supplied portrait, preserved as an original
asset and framed with CSS. The frame is 280px on desktop and 200px on mobile.
Browser checks confirmed no horizontal overflow; the desktop evidence is
`../builds-proof-qa/portrait-desktop.png`.
Privacy disclosure, visible input labels and working states are retained.

## Interaction and functional checks

- Sticky navigation, Work/About anchors, quote CTA and both service links work.
- Build request accepts no URL; repair selection makes it required.
- Invalid supplied URL shows its field error and keeps input.
- Mobile repair request with a valid URL reaches the preview-only state.
- Preview disables delivery and visit tracking; no live inquiry was sent.
- Browser console error inspection returned none.
- Frontend tests cover successful reset, failure retention, request payloads,
  rate-limit feedback and preserved visit/quote attribution.
- Backend tests cover legacy payloads, build/repair validation, name bounds,
  fixed recipient, notification contents and existing abuse protections.

No actionable P0/P1/P2 findings remain. Portrait is a follow-up, not fake proof.
Production deployment and real inbox delivery remain NOT_PROVEN. Release must
coordinate backend deployment before frontend promotion, as documented in README.

final result: passed
