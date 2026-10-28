"""Copy only public website assets into the static deployment directory."""
from pathlib import Path
import shutil
from html import escape

root = Path(__file__).resolve().parent
output = root / 'public-site'
if output.exists():
    shutil.rmtree(output)
output.mkdir()
for name in ('robots.txt', 'sitemap.xml', 'index.html', 'request-help.html', 'web-design.html', 'landscape.html', 'salon.html', 'auto-repair.html',
             'restaurant.html', 'dental.html', 'contractor.html', 'real-estate.html',
             'style.css', 'homepage.css', 'concepts.css', 'auto-repair.css', 'industry-concepts.css', 'portfolio.css',
             'tech-support.css', 'tech-request.css', 'tech-support.js', 'partners.html', 'partner-report.html',
             'partners.css', 'partners.js', 'partner-inquiry.html', 'partner-inquiry.css', 'partner-inquiry.js', 'site-header.css', 'app.js', 'site-ui.js', 'config.js', 'favicon.svg'):
    shutil.copyfile(root / name, output / name)
shutil.copytree(root / 'assets', output / 'assets')
shutil.copytree(root / 'auto-repair', output / 'auto-repair')

# Shared markup and styles keep contact controls identical on every real offering.
header = (root / 'site-header.html').read_text()
for name, route in [('index.html', '/'), ('request-help.html', '/request-help'),
                    ('web-design.html', '/web-design'), ('partners.html', '/partners'),
                    ('partner-report.html', '/partner-report'), ('partner-inquiry.html', '/partners')]:
    page = output / name
    source = page.read_text()
    assert source.count('<!-- site-header -->') == 1, name
    current_header = header.replace(f'href="{route}">', f'href="{route}" aria-current="page">')
    source = source.replace('<!-- site-header -->', current_header)
    source = source.replace('</head>', '<link rel="stylesheet" href="/site-header.css">\n</head>')
    page.write_text(source)

# One authoritative illustrative report, usable with or without JavaScript.
report = (root / 'partner-report.html').read_text()
report_content = report.split('<!-- report-content-start -->', 1)[1].split('<!-- report-content-end -->', 1)[0]
partners = output / 'partners.html'
partners.write_text(partners.read_text().replace('<!-- partner-report-content -->',
                                               report_content.replace('<h1 ', '<h2 ').replace('</h1>', '</h2>')))

# Keep one authoritative Juniper request dialog; include it on every entry page.
contact = (root / 'auto-repair/contact.html').read_text()
dialog = contact.split('<!-- auto-request-start -->', 1)[1].split('<!-- auto-request-end -->', 1)[0]
for name in ('auto-repair.html', 'auto-repair/services.html', 'auto-repair/about.html'):
    page = output / name
    page.write_text(page.read_text().replace('<script src="/site-ui.js">', dialog + '<script src="/site-ui.js">'))

# One quiet portfolio frame; explanations stay behind an explicit action.
concepts = {
    'landscape': ('Field & Form', 'Choose a service, explore a project, then share enough information to discuss fit. The selected service stays with the sample inquiry.'),
    'salon': ('Morrow Studio', 'Compare services at a glance, choose one, and preview the next step. Sample prices and durations help explain the choice; a request is not a reserved appointment.'),
    'auto-repair': ('Juniper Motor Works', 'Four pages answer four questions: what the shop does, which service fits, how decisions are made, and how to get in touch. Service choices carry into the request.'),
    'restaurant': ('Sera', 'Find the menu and visit details quickly, then explore a table request. The sample availability flow offers alternatives without claiming a reservation.'),
    'dental': ('Stillwell', 'Answer first-visit questions before asking for a conversation. The short request demonstrates a reply path without asking for health information.'),
    'contractor': ('Alder & Stone', 'Show the work first, then help a homeowner share project type, area and timing. A focused brief supports a useful fit conversation.'),
    'real-estate': ('Elena Vale', 'Buyers and sellers have different questions. Separate starting points lead to relevant sample inquiries and clear next steps.'),
}
for name in ('landscape.html', 'salon.html', 'auto-repair.html',
             'auto-repair/services.html', 'auto-repair/about.html', 'auto-repair/contact.html',
             'restaurant.html', 'dental.html', 'contractor.html', 'real-estate.html'):
    key = name.split('/')[0].removesuffix('.html')
    title, explanation = concepts[key]
    destination = f'/web-design?concept={key}#request'
    bar = '''<div class="portfolio-bar"><a href="/web-design#examples" data-preserve-ref>← Portfolio</a>
<span>Fictional concept</span><button type="button" data-open-panel="design-details">About this design ↗</button></div>'''
    context = f'''<aside class="portfolio-handoff" aria-label="Service Boost redesign">
<span>Like this approach for your website?</span><a href="{destination}" data-preserve-ref>Start your redesign ↗</a></aside>
<dialog id="design-details" class="context-dialog" aria-labelledby="design-heading">
<form method="dialog"><button class="close">Close</button></form>
<p class="eyebrow">Design by Service Boost</p><h2 id="design-heading">{escape(title)}</h2>
<p>{escape(explanation)}</p><p>These are design choices, not measured client results. Your redesign would use your content, verified business details and agreed contact process.</p>
<p class="fine-print">$1,500 · Up to four pages. Platform and integrations confirmed before work begins.</p>
<a class="context-cta" href="{destination}" data-preserve-ref>Start your redesign ↗</a></dialog>'''
    page = output / name
    source = page.read_text()
    assert source.count('<!-- portfolio-bar -->') == 1, name
    assert source.count('<!-- portfolio-context -->') == 1, name
    source = source.replace('<!-- portfolio-bar -->', bar).replace('<!-- portfolio-context -->', context)
    source = source.replace('<form id="demo-form"', '<div class="demo-tools"><button type="button" data-use-sample>Use sample details</button></div>\n<form id="demo-form"')
    if 'data-industry-demo' in source:
        source = source.replace('<button type="submit">Preview request', '<p class="sample-contact">Sample reply contact: Demo Visitor · demo@example.com</p>\n<button type="submit">Preview request')
    page.write_text(source)
