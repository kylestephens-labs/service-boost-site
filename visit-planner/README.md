# Fixed-price visits

Build with `python3 build-site.py`. Eligible visits use Service Boost’s Google appointment schedules. For a non-booking review build, run `python3 build-site.py --review-visits` and `python3 preview-site.py --review-visits --port 18786`. The review build disables all direct scheduling links.

Customers choose a package and an available time, then enter their name, email, address and phone in Google Calendar. Google owns the intake fields. Service ID travels in utm_content; service name, price and scope remain visible on the website. Google handles booking confirmations and cancellations; the page never creates a second inquiry or a synthetic confirmation. Payment is due after the visit. The existing /request-help flow remains separate.

Approved packages for review and release:

| Price | Visit scope |
| --- | --- |
| $199 | Set up or reconnect one working printer on a working network for up to two computers and test print. |
| $199 | Set up one phone or tablet, Wi-Fi, one existing account and basics. Excludes migration and account recovery. |
| $199 | Pair one compatible plug-in or battery smart-home device with its app and working Wi-Fi. Excludes mounting and wiring. |
| $229 | Set up one new computer and one user account, updates and existing Wi-Fi. Excludes migration. |
| $229 | Set up one router on active internet for up to two devices. No whole-home coverage guarantee. |
| $229 | Diagnose one computer or printer issue. Time is paid even if unresolved. Explain findings and next steps. |
| $229 | Help with one existing email account or one sending or receiving issue. Excludes password recovery, mailbox migration and server administration. |
| $229 | Install and configure one licensed app. Excludes custom integrations and business deployments. |
| $229 | Practice one everyday computer task in a 60-minute lesson. Excludes device repair and ongoing support. |
| Request a quote | Copy one selected folder to one working drive. Excludes full-device migration, damaged drives and data recovery. |

Extra work requires prior approval. Ring mounting requires separate scope and pricing. Google Calendar reserves appointments; the website does not collect payment or store contact details. Actual notification delivery is not proven without an authorized booking.

Validate with `node --test test-visit-planner.mjs` and the repository Validate workflow. To roll back, revert the release PR and redeploy the prior static site. The backend contract and data schema are unchanged.
