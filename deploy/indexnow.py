"""Notify IndexNow about changed HTML on the public production sitemap."""
from hashlib import sha256
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen
from xml.etree import ElementTree

HOST = 'www.serviceboost.co'
ORIGIN = 'https://' + HOST
KEY_FILE = Path(__file__).with_name('indexnow-key.txt')
STATE = Path('.indexnow-cache/pages.json')


def fetch(url):
    with urlopen(url, timeout=20) as response:
        if response.geturl() != url or response.status != 200:
            raise ValueError('Unexpected response for ' + url)
        return response.read()


def page_hashes(sitemap, fetch_page):
    pages = {}
    for loc in ElementTree.fromstring(sitemap).findall('{*}url/{*}loc'):
        url = loc.text or ''
        if not re.fullmatch(re.escape(ORIGIN) + r'/(?:[a-z0-9-]+)?', url):
            raise ValueError('Unexpected production sitemap URL: ' + url)
        pages[url] = sha256(fetch_page(url)).hexdigest()
    if not pages:
        raise ValueError('Empty production sitemap')
    return pages


def notify(urls, key):
    payload = json.dumps(dict(host=HOST, key=key, urlList=urls)).encode()
    request = Request('https://api.indexnow.org/indexnow', data=payload,
                      headers={'Content-Type': 'application/json'})
    with urlopen(request, timeout=30) as response:
        if response.status not in (200, 202):
            raise ValueError('Unexpected IndexNow status: ' + str(response.status))
        print(f'IndexNow HTTP {response.status} for {len(urls)} URLs')


def sync(fetch_url=fetch, send=notify, state=STATE):
    key = KEY_FILE.read_text().strip()
    if fetch_url(f'{ORIGIN}/{key}.txt').decode().strip() != key:
        raise ValueError('Production does not serve the ownership key')
    current = page_hashes(fetch_url(ORIGIN + '/sitemap.xml'), fetch_url)
    previous = json.loads(state.read_text()) if state.exists() else {}
    changed = [url for url, digest in current.items() if previous.get(url) != digest]
    if changed:
        send(changed, key)
    if current != previous:
        state.parent.mkdir(exist_ok=True)
        state.write_text(json.dumps(current, sort_keys=True))
    return current != previous


if __name__ == '__main__':
    import os
    updated = sync()
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        print('updated=' + str(updated).lower(), file=output)
