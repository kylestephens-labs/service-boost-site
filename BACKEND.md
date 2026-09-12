# Quote delivery deployment

## Current state

Source is prepared; deployment and inbox delivery are NOT_PROVEN. The frontend endpoint is blank and the preview banner remains. Customer submissions are not saved in a database or logged by this application. Gmail retains the messages under the business account's retention settings.

## Required setup

1. Confirm the Hetzner host. Do not assume the trading production host can accept another workload. Provision Docker and an HTTPS proxy, plus a dedicated deployment user owning `/opt/serviceboost`. Docker privileges are root-equivalent; restrict the SSH key to this deployment's trusted workflow and host.
2. Configure `serviceboost-production` GitHub environment with required reviewer approval and main-only deployments. Add environment secrets `DEPLOY_SSH_KEY` and `DEPLOY_KNOWN_HOSTS` (verify the host key out of band), and variables `DEPLOY_HOST`, `DEPLOY_USER`, `ALLOWED_ORIGINS` (comma-separated exact HTTPS frontend origins, no paths). Never paste private keys in chat or commit them.
3. Google Workspace administrator: configure SMTP relay for the confirmed host's single outgoing IP, only senders in serviceboost.co, and require TLS. This backend uses smtp-relay.gmail.com:587, with notify@serviceboost.co as both sender and fixed recipient. Ensure the sender meets your Workspace relay policy. No Gmail password is needed with IP-authorized relay. Verify outbound port 587 is permitted.
4. Choose an API hostname and point its DNS to the approved host. Adapt `deploy/Caddyfile.example` into the existing proxy without replacing other sites. The proxy overwrites X-Real-IP; backend port 8137 is loopback-only. Do not enable request-body logging or retain customer data in proxy logs.
5. Merge after review, then manually run Deploy quote backend. It runs only from main. Health checks prove the process is reachable, not email delivery. Deployment does not provision a host, DNS, Google settings, or the proxy.
6. Test the HTTPS endpoint and confirm a test email arrives in notify@serviceboost.co and Reply routes to the test customer. With separate frontend publication approval, set config.js to the actual HTTPS /quote endpoint, remove the preview notice, and publish accurate privacy information about Gmail processing. Enable GitHub Pages for the frontend. Do not expose backend configs or secrets as public assets.

## Abuse controls and limitations

Fixed recipient; strict field/body limits; header-injection protection; honeypot; exact browser origin allowlist; 5 attempts/IP/hour and 50 attempts globally/hour. Origin checks are not authentication. Counters are bounded in memory, reset on process restart, and require exactly one worker. Distributed bots can exhaust the global budget; add a server-verified challenge if needed. No automatic SMTP retry, since ambiguous delivery can duplicate emails. SMTP acceptance does not guarantee inbox placement.

## Validation

`python3 -m unittest discover -s backend -p 'test_*.py'`

`node --check app.js`

## Rollback

Restore the previous reviewed backend source and rerun the deployment, or stop only the serviceboost Compose project. Restore a blank frontend endpoint and the preview notice if delivery is unavailable. Never stop unrelated containers or proxies.
