"""Copy only public website assets into the static deployment directory."""
from pathlib import Path
import shutil
from html import escape

root = Path(__file__).resolve().parent
output = root / 'public-site'
if output.exists():
    shutil.rmtree(output)
output.mkdir()
for name in ('index.html', 'landscape.html', 'salon.html', 'auto-repair.html',
             'restaurant.html', 'dental.html', 'contractor.html', 'real-estate.html',
             'style.css', 'homepage.css', 'concepts.css', 'auto-repair.css', 'industry-concepts.css', 'portfolio.css', 'industry-experiences.css',
             'app.js', 'site-ui.js', 'config.js', 'favicon.svg'):
    shutil.copyfile(root / name, output / name)
shutil.copytree(root / 'assets', output / 'assets')
shutil.copytree(root / 'auto-repair', output / 'auto-repair')

# Keep one authoritative Juniper request dialog; include it on every entry page.
contact = (root / 'auto-repair/contact.html').read_text()
dialog = contact.split('<!-- auto-request-start -->', 1)[1].split('<!-- auto-request-end -->', 1)[0]
for name in ('auto-repair.html', 'auto-repair/services.html', 'auto-repair/about.html'):
    page = output / name
    page.write_text(page.read_text().replace('<script src="/site-ui.js">', dialog + '<script src="/site-ui.js">'))

# Contact shows that same request in context; other routes retain a native dialog.
page = output / 'auto-repair/contact.html'
inline_request = dialog.replace('<dialog ', '<section ').replace('</dialog>', '</section>')
inline_request = inline_request.replace('<form method="dialog"><button class="auto-modal-close" aria-label="Close service request">×</button></form>', '')
inline_request = inline_request.replace(' required autofocus', ' required')
page.write_text(page.read_text().replace(dialog, '').replace('<!-- inline-auto-request -->', inline_request))

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
    destination = f'/?concept={key}#request'
    bar = '''<div class="portfolio-bar"><a href="/#examples" data-preserve-ref>← Portfolio</a>
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
    source = source.replace('<link rel="stylesheet" href="/portfolio.css">', '<link rel="stylesheet" href="/portfolio.css">\n<link rel="stylesheet" href="/industry-experiences.css">')
    assert source.count('<!-- portfolio-bar -->') == 1, name
    assert source.count('<!-- portfolio-context -->') == 1, name
    source = source.replace('<!-- portfolio-bar -->', bar).replace('<!-- portfolio-context -->', context)
    source = source.replace('<form id="demo-form"', '<div class="demo-tools"><button type="button" data-use-sample>Use sample details</button></div>\n<form id="demo-form"')
    if 'data-industry-demo' in source:
        source = source.replace('<button type="submit">Preview request', '<p class="sample-contact">Sample reply contact: Demo Visitor · demo@example.com</p>\n<button type="submit">Preview request')
    page.write_text(source)
