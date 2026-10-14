# Dedicated request page visual QA

final result: passed

## Evidence and state

Source: selected option 2, refined to remove the reply selector and phone input:
/Users/kylestephens/.codex/generated_images/01a13831-9c9b-7863-a02d-85f85f22f3a7/exec-3b918bfd-7cb1-4bfc-bca3-d0439726e427.png

Implementation: local synthetic-delivery preview /request-help?service=wifi.
Desktop evidence: ../../outputs/dedicated-request-desktop.png.
Mobile evidence: ../../outputs/dedicated-request-mobile.png.
Source raster 1487x1058. Browser CSS viewport 1487x1058, screenshot 1472x1047
excluding browser scrollbar regions. Compared together in one image inspection
input at natural scale; no screenshot stretching. Empty form, Wi-Fi selected,
local readiness available. Mobile CSS viewport 390x844, full page 375x1487.
No separate mobile source was supplied; mobile is a responsive adaptation.

## Findings and iteration

Initial desktop inspection found P2 column proportion drift: the form began too
far right and intro text wrapped into two very long lines. Reduced left grid
track from 40% to 36%, constrained intro text to 410px, and aligned the header
and selected-service spacing. Final source/implementation comparison shows the
same two-column hierarchy, heading wraps, four input fields and primary action.

At 320px, the request-page navigation exceeded the available width by 19px.
Reduced mobile nav type to 16px. Post-fix document width equals scroll width
(305px available at 320px viewport); homepage likewise has no overflow.
Other checked viewport widths: 390, 768, 1024, 1440 and 1487px.

Fonts: reused existing locally served DM Sans, bold headings, 18px field labels,
20px primary action and visible focus states. Preserves brand typography rather
than approximating the raster's antialiasing. Spacing: open white page with a
divider and two groups, no overlay or nested scrolling. Color: existing blue,
navy and muted tokens retained; no invented decorative gradients. Assets:
existing brand and service icons reused at crisp native resolution.
Copy: requested fields removed, one email reply channel explained. Existing
service-scope and privacy disclosures intentionally remain below the form;
they are not shown in the generated design but preserve relevant context.
Call/Text are text links without the mock's decorative phone/chat glyphs.
This minor P3 simplification does not change their visible labels or function.

The full-view comparison was sufficient to assess typography, form alignment,
button visibility and whitespace; no separate cropped comparison was needed.
No remaining actionable P0/P1/P2 visual findings.

## Runtime checks

All six homepage service entries carry the correct selection. General Request
help selects the unsure option. Change reveals and focuses the native selector,
and retains existing input. Native validation focuses the first missing field.
Synthetic 502 retains all input; synthetic 200 clears personal fields, retains
service, and explains email follow-up without claiming an appointment.
No live emails, calls or texts were sent. Browser console check returned no
errors/warnings on the final route. Unit tests cover readiness retry, duplicate
submission, malformed service input, network failures and rate limits.

No physical-phone, inbox-delivery, screen-reader or production-readiness proof.
The live backend configuration blocker remains separate from this UI change.
