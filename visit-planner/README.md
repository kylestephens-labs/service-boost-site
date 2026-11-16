# Fixed-price visits

Build with `python3 build-site.py`. The production homepage submits a tech support inquiry through the configured /quote endpoint only on the two Service Boost production origins. For a non-sending review build, run `python3 build-site.py --review-visits` and `python3 preview-site.py --review-visits --port 18786`. The review build blanks the endpoint and keeps details in browser memory.

Customers choose a package, enter the visit address, choose email, call or text, and state a Pacific timing preference. Kyle confirms coverage using the full address and manually confirms the date and arrival window. Cancel or reschedule by notifying Kyle as soon as possible, with no fee. Payment is due after the visit and Kyle confirms payment options beforehand.

The six package prices, scopes, durations and diagnostic policy are approved. Extra work requires prior approval. Ring mounting requires separate scope and pricing. No reservation or payment transaction runs on submission.

Validate with `node --test test-visit-planner.mjs` and the repository Validate workflow. To roll back, revert the release PR and redeploy the prior static site. The backend contract and data schema are unchanged.
