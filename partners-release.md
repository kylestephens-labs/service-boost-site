# Partner coverage release

Adds `/partners` with scheduled onsite setup/troubleshooting coverage, an
illustrative completion report and a coverage inquiry dialog. The report also
has a standalone no-JavaScript route. Inquiry details reuse the existing
`tech_support` contract; the real company name stays separate from the honeypot.

The five real offering/intake/report pages share one build-time header and
stylesheet, including Home, For IT providers, Call/Text icons and Request help.
Fictional portfolio navigation remains separate. Consumer services, pricing,
intake and website-design body content remain protected. The website-design
page retains its body redesign buttons and direct `#request` dialog entry.

Validation: 19 static integration tests and 33 JavaScript behavior tests pass.
The final commit must also pass the complete Validate workflow and independent
review before merge. Main automatically publishes through Vercel. The user
authorized inclusion of the local shared-header changes, merge and deployment.

No backend release, database migration, dispatch portal, payment, booking or
new analytics is included. Live partner inbox receipt remains NOT_PROVEN;
synthetic tests prove payload/UI behavior only. Verify production pages after
merge; rollback is a revert of this frontend PR.
