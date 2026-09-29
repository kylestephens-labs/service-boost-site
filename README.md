# service-boost-site
Service Boost website frontend. Complete websites and practical improvements,
with small fixes starting at $199.

Build the public-only static output with `python3 build-site.py`. Quote delivery
and attribution remain in the existing backend; see BACKEND.md and ATTRIBUTION.md.

The project examples are an actual screenshot of Service Boost's original site
and an explicitly illustrative booking comparison. No client results are claimed.
The About section uses Kyle’s supplied portrait in a responsive circular frame.

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
