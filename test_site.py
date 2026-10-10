"""Static integration contracts for the production site and isolated demos."""
from html.parser import HTMLParser
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parent
AUTO_CONCEPTS = ['auto-repair.html', 'auto-repair/services.html',
                 'auto-repair/about.html', 'auto-repair/contact.html']
INDUSTRY_CONCEPTS = ['restaurant.html', 'dental.html', 'contractor.html', 'real-estate.html']
CONCEPTS = ['landscape.html', 'salon.html'] + AUTO_CONCEPTS + INDUSTRY_CONCEPTS


class Page(HTMLParser):
    def __init__(self, filename):
        super().__init__()
        self.nodes = []
        self.feed((ROOT / filename).read_text())

    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))


class SiteContracts(unittest.TestCase):
    def test_new_industries_are_published_and_reachable_from_carousel(self):
        subprocess.run([sys.executable, str(ROOT / 'build-site.py')], check=True)
        home = Page('public-site/index.html')
        slides = [a for _, a in home.nodes if a.get('aria-roledescription') == 'slide']
        self.assertEqual(len(slides), 7)
        links = {a.get('href') for t, a in home.nodes if t == 'a'}
        for filename in INDUSTRY_CONCEPTS:
            self.assertIn('/' + filename.removesuffix('.html'), links)
            page = Page('public-site/' + filename)
            self.assertEqual(sum(t == 'h1' for t, _ in page.nodes), 1)
            # New industries use selections and a fixed fictional reply contact,
            # never editable contact or health data.
            self.assertFalse(any(t in ('input', 'textarea') for t, _ in page.nodes))
            self.assertGreaterEqual(sum(t == 'select' for t, _ in page.nodes), 2)
            self.assertTrue(any('data-industry-demo' in a for _, a in page.nodes))

    def test_built_portfolio_has_one_quiet_frame_and_isolated_sample_tools(self):
        subprocess.run([sys.executable, str(ROOT / 'build-site.py')], check=True)
        for filename in CONCEPTS:
            page = Page('public-site/' + filename)
            ids = [a['id'] for _, a in page.nodes if 'id' in a]
            self.assertEqual(len(ids), len(set(ids)), filename)
            self.assertEqual(ids.count('design-details'), 1)
            self.assertEqual(sum('data-use-sample' in a for _, a in page.nodes), 1)
            links = [a['href'] for t, a in page.nodes if t == 'a' and a.get('href', '').endswith('#request')]
            self.assertEqual(len(links), 2)
            self.assertTrue(all(link.startswith('/?concept=') for link in links))
            text = (ROOT / 'public-site' / filename).read_text()
            self.assertNotIn('<!-- portfolio-', text)
            self.assertNotIn('app.js', text)

    def test_context_and_intent_do_not_copy_personal_data_or_offer_viewings(self):
        page = Page('real-estate.html')
        source = (ROOT / 'real-estate.html').read_text()
        self.assertNotIn('sample viewing request', source)
        self.assertIn('data-area-label', source)
        for intent in ['Buying a home', 'Selling a home']:
            self.assertTrue(any(a.get('data-demo-value') == intent for _, a in page.nodes))
        home = (ROOT / 'index.html').read_text()
        self.assertIn('id="concept-context"', home)
        self.assertNotIn('Atelier', home)

    def test_demo_assets_and_scripts_cannot_submit_or_persist_samples(self):
        script = (ROOT / 'site-ui.js').read_text()
        for forbidden in ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'innerHTML']:
            self.assertNotIn(forbidden, script)
        self.assertIn('demoForm.reportValidity()', script)

    def test_build_includes_one_isolated_request_dialog_on_every_auto_page(self):
        subprocess.run([sys.executable, str(ROOT / 'build-site.py')], check=True)
        for filename in AUTO_CONCEPTS:
            page = Page('public-site/' + filename)
            ids = [attrs['id'] for _, attrs in page.nodes if 'id' in attrs]
            self.assertEqual(len(ids), len(set(ids)), filename)
            self.assertEqual(ids.count('demo-dialog'), 1, filename)
            self.assertEqual(ids.count('demo-form'), 1, filename)
            self.assertNotIn('request-form', ids)
            self.assertEqual([a['src'] for t, a in page.nodes if t == 'script'], ['/site-ui.js'])
            self.assertTrue(all(a.get('method') == 'dialog' and not a.get('action')
                                for t, a in page.nodes if t == 'form'))

    def test_main_has_one_production_form_and_one_script_instance(self):
        page = Page('index.html')
        ids = [attrs['id'] for _, attrs in page.nodes if 'id' in attrs]
        self.assertEqual(len(ids), len(set(ids)), 'IDs must remain unique')
        for required in ['request', 'request-form', 'website', 'website-label',
                         'website-error', 'problem', 'form-status', 'about', 'faq']:
            self.assertIn(required, ids)
        names = {attrs.get('name') for _, attrs in page.nodes}
        self.assertTrue({'name', 'email', 'website', 'problem',
                         'company'} <= names)
        self.assertNotIn('project_type', names)
        website = next(a for _, a in page.nodes if a.get('id') == 'website')
        self.assertIn('required', website)
        self.assertFalse(any(a.get('type') == 'radio' for _, a in page.nodes))
        scripts = [attrs['src'] for tag, attrs in page.nodes if tag == 'script']
        self.assertEqual(scripts, ['config.js', 'app.js', 'site-ui.js'])
        text = (ROOT / 'index.html').read_text()
        self.assertIn('Privacy notice', text)
        self.assertNotIn('Form does not submit', text)
        self.assertEqual(text.count('data-open-quote'), 5)

    def test_redesign_offer_order_and_unpublished_testimonials(self):
        page = Page('index.html')
        sections = [a.get('id') for t, a in page.nodes if t == 'section']
        self.assertEqual([s for s in sections if s],
                         ['package', 'examples', 'about', 'process', 'faq', 'contact'])
        testimonials = next(a for _, a in page.nodes
                            if a.get('class') == 'testimonials-section')
        self.assertIn('hidden', testimonials)
        text = (ROOT / 'index.html').read_text()
        self.assertIn("No payment due today. I'll review your site and reply within 24 hours with next steps.", text)
        self.assertNotIn('Get a free quote', text)
        self.assertNotIn('A few questions', text)
        self.assertIn('one-hour minimum', text)
        self.assertIn('send an estimate for your approval before work begins.', text)

    def test_demo_pages_cannot_load_production_quote_delivery(self):
        for filename in CONCEPTS:
            page = Page(filename)
            scripts = [attrs['src'] for tag, attrs in page.nodes if tag == 'script']
            self.assertEqual(scripts, ['/site-ui.js'])
            self.assertNotIn('request-form', [a.get('id') for _, a in page.nodes])
            self.assertTrue(any(a.get('name') == 'robots' and a.get('content') == 'noindex'
                                for _, a in page.nodes), filename)
            self.assertFalse(any(a.get('action') for tag, a in page.nodes if tag == 'form'))
            if filename in ['auto-repair.html', 'auto-repair/services.html', 'auto-repair/about.html']:
                continue
            self.assertIn('demo-form', [a.get('id') for _, a in page.nodes])
            demo = next(a for tag, a in page.nodes if a.get('id') == 'demo-form')
            self.assertEqual(demo.get('method'), 'dialog', 'No navigation or transmission if JavaScript is unavailable')
            self.assertIn('Nothing will be sent, saved or booked.', (ROOT / filename).read_text())

    def test_local_assets_and_section_links_resolve(self):
        for filename in ['index.html'] + CONCEPTS:
            page = Page(filename)
            ids = {attrs.get('id') for _, attrs in page.nodes}
            all_ids = [attrs['id'] for _, attrs in page.nodes if 'id' in attrs]
            self.assertEqual(len(all_ids), len(set(all_ids)), filename)
            for tag, attrs in page.nodes:
                src = attrs.get('src', '')
                if src and not src.startswith('https://'):
                    self.assertTrue((ROOT / src.lstrip('/')).is_file(), src)
                href = attrs.get('href', '')
                if tag == 'link' and attrs.get('rel') == 'stylesheet':
                    self.assertTrue((ROOT / href.split('?')[0].lstrip('/')).is_file(), href)
                if href.startswith('#'):
                    self.assertIn(href[1:], ids, f'{filename}: {href}')
                if tag == 'a' and href.startswith('/'):
                    route = href.split('?')[0].split('#')[0]
                    target = ROOT / ('index.html' if route == '/' else route.lstrip('/') + '.html')
                    self.assertTrue(target.is_file(), f'{filename}: {href}')
                    self.assertIn('data-preserve-ref', attrs)
                if tag == 'img':
                    self.assertIn('alt', attrs)

    def test_portfolio_links_keep_attribution_hooks_and_logos_use_fragments(self):
        for filename in ['index.html'] + CONCEPTS:
            for tag, attrs in Page(filename).nodes:
                if tag != 'a':
                    continue
                if 'brand' in attrs.get('class', '').split():
                    self.assertEqual(attrs['href'], '#home')
                if attrs.get('href') in ['/', '/landscape', '/salon']:
                    self.assertIn('data-preserve-ref', attrs)

    def test_auto_pages_have_one_current_page_and_coherent_navigation(self):
        for filename in AUTO_CONCEPTS:
            page = Page(filename)
            self.assertEqual(sum(tag == 'h1' for tag, _ in page.nodes), 1)
            current = [a for _, a in page.nodes if a.get('aria-current') == 'page']
            self.assertEqual(len(current), 1)
            expected = '/' + filename.removesuffix('.html')
            self.assertEqual(current[0]['href'], expected)


if __name__ == '__main__':
    unittest.main()
