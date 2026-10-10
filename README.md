# service-boost-site
Service Boost website frontend. The homepage offers a $1,500 redesign of up to
four existing pages, working directly with Kyle Stephens.

Build the public-only static output with `python3 build-site.py`. Quote delivery
and attribution remain in the existing backend; see BACKEND.md and ATTRIBUTION.md.

The single-page homepage orders its outcome, package, seven fictional portfolio
concepts, founder introduction, three-step process, and FAQ. The manual carousel
supports arrows, pagination, swiping and keyboard navigation. The testimonial
slot stays hidden until real client feedback is approved.
Homepage typography and responsive layouts live in homepage.css; style.css
owns shared foundations. concepts.css adds landscape/salon sections; auto-repair.css
owns the Juniper identity. Navigation remains visible
while scrolling. "Start your redesign" opens the production redesign intake in
a native dialog. Direct `#request` links still work.

portfolio.css owns shared portfolio framing, selectable service rows and
on-demand detail panels. The build inserts one shared design explanation,
redesign handoff and sample-data control on each of the ten concept routes.
The seven identities retain their existing images, fonts and palettes.
Only an allowlisted concept name and valid outreach reference carry into the
real redesign form; demo inputs never carry over.

`/landscape` and `/salon` are static concept demonstrations. Their forms never
load the production quote script or send data. Vercel's clean URLs resolve these
paths to their corresponding HTML files. No client work or results are claimed.

`/auto-repair` is the fictional Juniper Motor Works multi-page concept, with
`/auto-repair/services`, `/auto-repair/about`, and `/auto-repair/contact`.
All concept pages remain `noindex`. The auto request form is a compact modal; landscape
and salon use native dialogs. Demo forms make no network requests and support
editing and resetting sample details. Dialog close clears the sample data.
Each demo shows a request summary. Landscape and salon also show an illustrative next step. Salon booking is a mock interaction;
linking an existing scheduler and building custom booking are distinct scopes.

For a local static preview, run `python3 build-site.py`, then
`python3 preview-site.py --port 8768` and open `http://127.0.0.1:8768`.
The preview serves only public-site, supports clean URLs, and binds only to
loopback. No Docker, backend, credentials, or package installation is needed.
The homepage retains its production intake; use only concept forms for demo QA.
See portfolio-review.md for the portfolio acceptance evidence and asset provenance.
See portfolio-refinement-release.md and the latest entry in design-qa.md for
the restrained portfolio refinement, browser checks and release boundaries.

Run `python3 -m unittest test_site.py`, `node --check site-ui.js`, and the existing
validation workflow when changing the presentation or intake integration.

## Redesign intake release

The homepage requires name, email, website and improvement details. Its one native
popup dialog offers Website redesign or Website updates and small fixes. Entry
buttons preselect the service; changing the dropdown updates the title, prompt,
submit label and reassurance without clearing typed details. The hourly billing
FAQ stays on the page, outside the modal. Direct `#request` arrivals default to redesign.

Both services use the existing `project_type: improve` backend contract. The
allowlisted service name is prepended to the emailed problem description, so this
frontend release requires no backend deployment. The textarea reserves 50 of the
backend's 4,000 characters for that label. During submission the service and submit
button are disabled; failures retain details and the selected service for retry.
Successful submission clears the form's details while retaining the selected service.
Website validation, delivery errors, honeypot and attribution remain in app.js.
The backend continues to accept its existing legacy/build clients unchanged.

Deployment requires authorization; main publishes automatically through Vercel.
Check exact-head CI and independently review the complete change before merge.
Verify the live page and modal after promotion. Synthetic delivery tests prove
the payload and UI paths, not fresh inbox receipt. No payment is taken in the form,
and no database migration is needed. Revert the frontend release for rollback.
