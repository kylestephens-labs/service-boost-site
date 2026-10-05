# Readable homepage release QA

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
