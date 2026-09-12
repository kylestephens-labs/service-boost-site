# Service Boost launch

The static frontend consists of index.html, style.css, app.js, and favicon.svg at the repository root. No build or dependencies are needed.

## Preview

Run `python3 -m http.server 8123` from this repository, then open http://localhost:8123.

## GitHub Pages

After the frontend pull request is approved and merged, select Settings > Pages > Deploy from a branch > main > /(root). No custom domain is configured by this change. Configure a domain only after its ownership and DNS target are confirmed.

## Quote delivery is not connected

The form currently validates input and displays an explicit preview-only message. It does not send, save, or email submissions. Intended recipient: notify@serviceboost.co.

Connect a hosted form service or a separately deployed Hetzner endpoint. Keep provider credentials out of this public repository. The endpoint must validate input, limit abuse, and report failures without losing entered values. Remove the preview banner only after an end-to-end submission is received in the business inbox. Add accurate privacy information for the chosen processor before accepting customer submissions.
