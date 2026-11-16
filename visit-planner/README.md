# Fixed-price visits

Build with `python3 build-site.py`. The production homepage submits a tech support inquiry through the configured /quote endpoint only on the two Service Boost production origins. For a non-sending review build, run `python3 build-site.py --review-visits` and `python3 preview-site.py --review-visits --port 18786`. The review build blanks the endpoint and keeps details in browser memory.

Customers choose a package, enter the visit address, choose email, call or text, and state a Pacific timing preference. Kyle confirms coverage using the full address and manually confirms the date and arrival window. Cancel or reschedule by notifying Kyle as soon as possible, with no fee. Payment is due after the visit and Kyle confirms payment options beforehand.

Approved packages for review and release:

| Price and duration | Visit scope |
| --- | --- |
| $199, up to 45 minutes | Set up or reconnect one working printer on a working network for up to two computers and test print. |
| $199, up to 45 minutes | Set up one phone or tablet, Wi-Fi, one existing account and basics. Excludes migration and account recovery. |
| $199, up to 45 minutes | Pair one compatible plug-in or battery smart-home device with its app and working Wi-Fi. Excludes mounting and wiring. |
| $229, up to 60 minutes | Set up one new computer and one user account, updates and existing Wi-Fi. Excludes migration. |
| $229, up to 60 minutes | Set up one router on active internet for up to two devices. No whole-home coverage guarantee. |
| $229, up to 60 minutes | Diagnose one computer or printer issue. Time is paid even if unresolved. Explain findings and next steps. |
| $229, up to 60 minutes | Help with one existing email account or one sending or receiving issue. Excludes password recovery, mailbox migration and server administration. |
| $229, up to 60 minutes | Install and configure one licensed app. Excludes custom integrations and business deployments. |
| $229, 60-minute lesson | Practice one everyday computer task. Excludes device repair and ongoing support. |
| Request a quote | Copy one selected folder to one working drive. Excludes full-device migration, damaged drives and data recovery. |

 Extra work requires prior approval. Ring mounting requires separate scope and pricing. No reservation or payment transaction runs on submission.

Validate with `node --test test-visit-planner.mjs` and the repository Validate workflow. To roll back, revert the release PR and redeploy the prior static site. The backend contract and data schema are unchanged.
