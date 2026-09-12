# Service Boost launch

The static frontend consists of index.html, style.css, app.js, config.js, and favicon.svg. `python3 build-site.py` copies only these public assets into public-site for Vercel deployment from this public GitHub repository. Backend and deployment files are never served as website assets.

## Preview

Run `python3 -m http.server 8123` from this repository, then open http://localhost:8123.

## Production

Vercel serves serviceboost.co and www.serviceboost.co. The user approved replacing the older dental template. Configure both origins in the Hetzner backend's ALLOWED_ORIGINS before publication. GitHub remains the public source repository.

## Quote delivery

The form sends to https://quotes.serviceboost.co/quote. Hetzner processes submissions and Google Workspace delivers them to notify@serviceboost.co. No application database or submission-content logging is used.

API TLS, security headers, container restrictions, rejection controls, and Gmail inbox delivery were verified on 2026-09-12. Verify the browser form again after frontend deployment. Credentials stay outside Git and browser assets. Roll back the frontend deployment if submissions fail; do not change unrelated hosted applications.
