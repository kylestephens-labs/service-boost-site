# Portfolio review — 6 October 2026

Original local review branch: `codex/portfolio-auto-repair`, based on `origin/main`
at `3988e15`. The following records the initial mockup review. The user later
authorized release through PR #26; see refinement-qa.md for the final modal and
carousel changes. No pricing or production/backend behavior changes are included.

## Design and audit

Visual thesis: preserve Field & Form's garden photography and olive palette,
and Morrow's editorial portrait, warm paper and burgundy; add Juniper as an
independent workshop identity with natural light, dark ink and a rust accent.
Content sequence: hero, useful services, story/process, clear enquiry.
Interaction thesis: restrained entrance, persistent navigation, responsive hover
feedback and accessible native dialogs. Motion honors reduced motion.

Initial rendered audit at desktop and 390px mobile:
1. Landscape entry — strong imagery; mobile header consumed unnecessary space.
2. Landscape services/contact — weak destinations: intro copy/footer, without
   a real service menu or final enquiry path. Added useful sections.
3. Salon entry/services — strong imagery and readable price list; booking CTA
   looked real until opening. Renamed to “Try booking demo” and labeled prices.
4. Salon booking — native validation and honest confirmation already existed;
   added edit/reset recovery and close cleanup. Clarified existing scheduler
   links versus separately scoped custom booking.

Existing visuals remain the starting point. No testimonial, certification,
customer count, outcome, real workshop address or business history is invented.
Juniper demonstrates four-page structure without changing the general offer.

## Validation

- `python3 -m unittest test_site.py`: 5 pass, including routes, assets, unique IDs,
  current-page navigation, concept noindex, and isolation from production delivery.
- `node --test test-attribution.mjs`: 10 pass; auto routes and service selection
  preserve only the allowlisted query parameters alongside the valid reference.
- `python3 -m unittest discover -s backend -p 'test_*.py'`: 17 pass.
- `node --check app.js`, `node --check config.js`, `node --check site-ui.js`: pass.
- `python3 build-site.py` and `git diff --check`: pass.
- Browser: all four auto pages; landscape services/project/enquiry; salon
  booking; required-field validation; honest confirmation; back preserves input;
  reset/reopen clears input; Escape closes; close restores focus to the opener.
- Browser desktop/mobile screenshots and overflow checks recorded in the
  task's sibling `evidence/` directory.

The unrelated Docker backend image/container gate was not run. Docker was
stopped, and the app-opening tool was not approved; the user explicitly directed
that it should not be started. The lightweight static preview is sufficient for
these frontend mockups. No production enquiry was submitted.

Limits: local browser verification is not an exhaustive accessibility audit or
cross-browser/device lab. Google Fonts remains an existing external dependency.
No publication or live Vercel routing is claimed; clean routes work locally and
the build preserves the repository's existing Vercel cleanUrls configuration.

## Image provenance

`assets/auto-workshop.jpg` was made with the built-in Imagegen tool and converted
to JPEG for the site. It is a fictional workshop illustration; its generated
source remains in the task's `generated_images/` directory. The About page labels
it as AI-generated. `assets/auto-preview.jpg` is a screenshot of the local home.

Final generation prompt:

> Use case: photorealistic-natural. Asset type: full bleed landscape hero photograph
> for a fictional independent auto repair website named Juniper Motor Works.
> Primary request: an editorial photograph inside a warm, carefully kept neighborhood
> automotive workshop. One unbranded graphite gray older station wagon on the right
> side, hood raised, warm daylight streaming through high steel windows, neatly
> arranged tools and a subtle burnt-orange tool cabinet, matte concrete floors.
> No people. Wide 3:2 composition, camera at human eye level, generous dark quiet
> negative space on the left half for white website typography that will be added
> separately. Realistic architectural photography, tactile materials, natural film
> grain, deep olive-gray shadows and late afternoon light. No text, logos, signs,
> watermarks, UI, collage, certifications or visible license plate details.
