# Fixed-price visit review

Run `python3 build-site.py --review-visits` and `python3 preview-site.py --review-visits --port 18786`. Open http://127.0.0.1:18786/. The review build uses the project assets and shared navigation. The normal Vercel build emits the existing public site.

The planner keeps visit details in browser memory until reload. Preferred windows are generated examples in Pacific time. There is no reservation or payment operation. Production's /quote endpoint delivers inquiries by email and does not reserve time. The review build blanks the inquiry endpoint.

Before release, approve the package prices, add-ons, service area, duration and cancellation terms. Decide how a request reaches Kyle and how he confirms a window. Payment is due after the visit. Verify card-present and Apple Pay acceptance with the intended merchant account and device, and confirm cash handling before displaying accepted methods.
