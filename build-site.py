"""Copy only public website assets into the static deployment directory."""
from pathlib import Path
import shutil
import os
import argparse
import re
import json
from html import escape
from string import Template

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--review-visits', action='store_true', help='Build the fixed-price review site into visit-preview.')
review_visits = parser.parse_args().review_visits
output = root / ('visit-preview' if review_visits else 'public-site')
if output.exists():
    shutil.rmtree(output)
output.mkdir()
if not review_visits and os.environ.get('VERCEL_ENV') == 'production':
    key = (root / 'deploy/indexnow-key.txt').read_text().strip()
    (output / f'{key}.txt').write_text(key + '\n')
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
mobile_header = (root / 'site-mobile-header.html').read_text()
if review_visits:
    (output / 'config.js').write_text("window.SERVICE_BOOST_QUOTE_ENDPOINT = '';\nwindow.SERVICE_BOOST_BOOKING_ENABLED = false;\n")
    home = output / 'index.html'
    home.write_text(home.read_text().replace('<!-- preview-notice -->', '<div class="strip"><div>Review preview</div></div>')
                    .replace('</head>', '<meta name="robots" content="noindex"></head>'))
public_booking = 'https://script.google.com/macros/s/AKfycbxzWsNXi4OajSJtV_w-hW2h41PEbsfZHoH-wdOcrPoPpVDbRtYHV2f1dT_RtkikhcCD/exec'
workspace_booking = '' if review_visits else os.environ.get('WORKSPACE_BOOKING_URL', public_booking if os.environ.get('VERCEL_ENV') == 'production' else '')
if workspace_booking:
    if not re.fullmatch(r'https://script\.google\.com/macros/s/[A-Za-z0-9_-]+/exec', workspace_booking):
        raise ValueError('Set WORKSPACE_BOOKING_URL to a versioned Google web app deployment.')
    with (output / 'config.js').open('a') as config:
        config.write('\nwindow.SERVICE_BOOST_WORKSPACE_BOOKING = ' + json.dumps(workspace_booking) + ';\n')
    picker_dir = root / 'workspace-booking/app'
    picker = (picker_dir / 'Picker.html').read_text().replace("<base target='_top'>", '<meta name="robots" content="noindex"><script src="/config.js"></script>')
    for component in ('Style', 'Client'):
        picker = picker.replace(f"<?!= include_('{component}') ?>", (picker_dir / f'{component}.html').read_text())
    (output / 'schedule.html').write_text(picker)
for asset in ('visit.css', 'booking.css', 'service-menu.css', 'booking.js', 'service-menu.js', 'computer-menu.js',
              'smart-home.js', 'wifi-menu.js', 'visit.js', 'service-cta.js'):
    shutil.copyfile(root / 'visit-planner' / asset, output / asset)

service_pages = {
    'computer-troubleshooting': ('In-home computer troubleshooting',
                                 'Computer won’t start, keeps freezing, or shows an error you can’t get past?',
                                 'computer'),
    'printer-setup': ('Printer setup and troubleshooting',
                      'Printer offline, disconnected after a router change, or ready for Wi-Fi setup?',
                      'printer'),
    'wifi-networking': ('Home Wi-Fi and networking',
                        'Wi-Fi drops during calls, misses the home office, or needs a new router or mesh?',
                        'wifi'),
    'phone-tablet-setup': ('Phone or tablet setup', 'On-site phone and tablet setup', 'mobile'),
    'smart-home': ('Smart-home installation and support',
                   'Ask about installing a compatible video doorbell or get help with one you already use.',
                   'smart-home'),
}
service_sources = root / 'service-pages'
service_layout = Template((service_sources / 'layout.html').read_text())
for slug, (title, description, service) in service_pages.items():
    subtitle = escape(description + (' in ' if service == 'mobile' else ' Visits in ') + 'Walnut Creek and nearby communities.')
    hero_intro = ('<a class="service-page-printer-link" href="/printer-setup">Looking for printer help?</a>' if service == 'computer'
                  else f'<p class="visit-menu-subtitle">{subtitle}</p>')
    if service in ('smart-home', 'wifi'):
        hero_intro = ''
    (output / f'{slug}.html').write_text(service_layout.substitute(
        title=escape(title), heading='Mobile devices' if service == 'mobile' else escape(title),
        subtitle=subtitle, hero_intro=hero_intro,
        canonical=f'https://www.serviceboost.co/{slug}',
        robots='<meta name="robots" content="noindex">' if review_visits else '',
        content=(service_sources / f'{slug}.html').read_text(),
        inquiry=f'/request-help?service={service}',
    ))

# Remote help uses the dedicated Google Meet schedule.
remote_event = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1YGjxU07QopqQD3lVF_FXvTcLO-c_wwSr9hLQmYWThfhECgf8YynI373UfHfIII8RyaP2XQGBo'

def remote_action():
    if review_visits:
        return 'role="link" aria-disabled="true"'
    if workspace_booking:
        return 'href="/schedule?service=remote-help"'
    return f'href="{remote_event}?utm_source=serviceboost&amp;utm_content=remote-help"'

remote_ready = not review_visits
(output / 'remote-tech-help.html').write_text(Template((service_sources / 'remote-tech-help.html').read_text()).substitute(
    remote_action=remote_action(),
    robots='' if remote_ready else '<meta name="robots" content="noindex">',
    status='' if remote_ready else '<p>Remote scheduling is unavailable in this preview.</p>',
))

header_routes = [('remote-tech-help.html', '/remote-tech-help'), ('index.html', '/'), ('request-help.html', '/request-help'),
                    ('web-design.html', '/web-design'), ('partners.html', '/partners'),
                    ('partner-report.html', '/partner-report'), ('partner-inquiry.html', '/partners')]
header_routes.extend((f'{slug}.html', f'/{slug}') for slug in service_pages)
for name, route in header_routes:
    page = output / name
    source = page.read_text()
    assert source.count('<!-- site-header -->') == 1, name
    current_header = header.replace(f'href="{route}">', f'href="{route}" aria-current="page">')
    source = source.replace('<!-- site-header -->', current_header)
    source = source.replace('<!-- site-mobile-header -->', mobile_header.rstrip())
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
