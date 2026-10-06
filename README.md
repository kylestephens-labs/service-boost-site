# service-boost-site
Service Boost website frontend. Complete websites and practical improvements,
with small fixes starting at $199.

Build the public-only static output with `python3 build-site.py`. Quote delivery
and attribution remain in the existing backend; see BACKEND.md and ATTRIBUTION.md.

The single-page homepage includes Kyle's supplied headshot and introduction in
the hero, a three-step process, three explicitly fictional portfolio concepts in a manual carousel, and
FAQ. Homepage typography and responsive layouts live in homepage.css; style.css
owns shared foundations. concepts.css adds landscape/salon sections; auto-repair.css
owns the Juniper identity. Navigation remains visible
while scrolling. The only conversion CTA is "Get a free quote", which opens the
existing production intake in a native dialog. Direct `#request` links still work.

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

Run `python3 -m unittest test_site.py`, `node --check site-ui.js`, and the existing
validation workflow when changing the presentation or intake integration.

## Build and repair intake release

The new form submits `name` and `project_type` (`build` or `improve`). A website
is optional for builds, required for improvements, and validated whenever supplied.
The backend accepts legacy requests without these fields as improvements.

Deployment requires separate authorization. Before merging, account for any
automatic frontend publication: hold frontend promotion until the matching
backend has been deployed and verified. The old backend rejects blank URLs.
Deploy the new backend first, then publish the frontend and confirm both a build
without a URL and a repair request arrive in the inbox. A merge or green CI is
not evidence that these production checks passed. Roll back the frontend before
rolling back the backend. No database migration is needed.
