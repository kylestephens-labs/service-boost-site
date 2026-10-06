"""Preview the built public directory locally, including Vercel-style clean URLs."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

PUBLIC = Path(__file__).resolve().parent / 'public-site'


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def translate_path(self, path):
        target = Path(super().translate_path(path))
        clean_page = Path(str(target) + '.html')
        if clean_page.is_file():
            return str(clean_page)
        return str(target)

    def list_directory(self, path):
        self.send_error(404)
        return None


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8768)
    args = parser.parse_args()
    if not (PUBLIC / 'index.html').is_file():
        parser.error('Run python3 build-site.py first.')
    print(f'Portfolio preview: http://127.0.0.1:{args.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), PreviewHandler).serve_forever()
