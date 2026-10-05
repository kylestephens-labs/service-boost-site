"""Static integration contracts for the production site and isolated demos."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent


class Page(HTMLParser):
    def __init__(self, filename):
        super().__init__()
        self.nodes = []
        self.feed((ROOT / filename).read_text())

    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))


class SiteContracts(unittest.TestCase):
    def test_main_has_one_production_form_and_one_script_instance(self):
        page = Page('index.html')
        ids = [attrs['id'] for _, attrs in page.nodes if 'id' in attrs]
        self.assertEqual(len(ids), len(set(ids)), 'IDs must remain unique')
        for required in ['request', 'request-form', 'website', 'website-label',
                         'website-error', 'problem', 'form-status', 'about', 'faq']:
            self.assertIn(required, ids)
        names = {attrs.get('name') for _, attrs in page.nodes}
        self.assertTrue({'name', 'email', 'website', 'problem', 'project_type',
                         'company'} <= names)
        scripts = [attrs['src'] for tag, attrs in page.nodes if tag == 'script']
        self.assertEqual(scripts, ['config.js', 'app.js', 'site-ui.js'])
        text = (ROOT / 'index.html').read_text()
        self.assertIn('Privacy notice', text)
        self.assertNotIn('Form does not submit', text)
        self.assertEqual(text.count('data-open-quote'), 3)

    def test_demo_pages_cannot_load_production_quote_delivery(self):
        for filename in ['landscape.html', 'salon.html']:
            page = Page(filename)
            scripts = [attrs['src'] for tag, attrs in page.nodes if tag == 'script']
            self.assertEqual(scripts, ['/site-ui.js'])
            self.assertNotIn('request-form', [a.get('id') for _, a in page.nodes])
            self.assertIn('demo-form', [a.get('id') for _, a in page.nodes])
            demo = next(a for tag, a in page.nodes if a.get('id') == 'demo-form')
            self.assertEqual(demo.get('method'), 'dialog', 'No navigation or transmission if JavaScript is unavailable')
            self.assertIn('Nothing will be sent, saved or booked.', (ROOT / filename).read_text())

    def test_local_assets_and_section_links_resolve(self):
        for filename in ['index.html', 'landscape.html', 'salon.html']:
            page = Page(filename)
            ids = {attrs.get('id') for _, attrs in page.nodes}
            for tag, attrs in page.nodes:
                src = attrs.get('src', '')
                if src and not src.startswith('https://'):
                    self.assertTrue((ROOT / src.lstrip('/')).is_file(), src)
                href = attrs.get('href', '')
                if tag == 'link' and attrs.get('rel') == 'stylesheet':
                    self.assertTrue((ROOT / href.split('?')[0].lstrip('/')).is_file(), href)
                if href.startswith('#'):
                    self.assertIn(href[1:], ids, f'{filename}: {href}')
                if tag == 'img':
                    self.assertIn('alt', attrs)

    def test_portfolio_links_keep_attribution_hooks_and_logos_use_fragments(self):
        for filename in ['index.html', 'landscape.html', 'salon.html']:
            for tag, attrs in Page(filename).nodes:
                if tag != 'a':
                    continue
                if 'brand' in attrs.get('class', '').split():
                    self.assertEqual(attrs['href'], '#home')
                if attrs.get('href') in ['/', '/landscape', '/salon']:
                    self.assertIn('data-preserve-ref', attrs)


if __name__ == '__main__':
    unittest.main()
