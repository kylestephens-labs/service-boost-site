# Dedicated tech request page

Replace the homepage modal with /request-help. All six service links pass an
allowlisted service selection. The general help CTA selects the unsure option.
Call and Text remain separate direct links in the navigation and on the request
page. The form collects problem, city/ZIP, name and email; there is no phone
field or reply-method selector. Requests use the existing tech_support contract
with reply_method=email. No backend changes, new dependencies or migration.

Preserve legacy website-design routing, existing website intake, notification
recipient and delivery protections. Old tech-support fragment links redirect
to the new page without copying unrelated query parameters. Service changes
retain input. Failed/ambiguous delivery retains input and advises direct contact;
success clears personal details while retaining service. No browser persistence.

The form stays unavailable until the existing readiness endpoint confirms the
contract. A manual availability retry does not clear input. Without JavaScript,
the form fields and submit button are disabled and direct contact remains usable.

Validation: backend unit checks, static site contracts, JavaScript regression
tests, full Validate gate, desktop/mobile browser and visual comparison.
Local delivery checks must use the synthetic preview, never send inquiries.

Merge publishes the frontend through Vercel. Backend readiness is currently
unproven after the previous deployment failed on missing environment settings;
this frontend change does not resolve or bypass that operational blocker.
Merge/deployment require separate owner authority. Inbox receipt, phone handoff
and customer outcomes remain NOT_PROVEN. Reverting this PR restores the modal.
