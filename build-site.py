"""Copy only public website assets into the static deployment directory."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent
output = root / 'public-site'
if output.exists():
    shutil.rmtree(output)
output.mkdir()
for name in ('index.html', 'landscape.html', 'salon.html', 'auto-repair.html', 'style.css', 'homepage.css', 'concepts.css', 'auto-repair.css', 'app.js', 'site-ui.js', 'config.js', 'favicon.svg'):
    shutil.copyfile(root / name, output / name)
shutil.copytree(root / 'assets', output / 'assets')
shutil.copytree(root / 'auto-repair', output / 'auto-repair')

# Keep one authoritative Juniper request dialog; include it on every entry page.
contact = (root / 'auto-repair/contact.html').read_text()
dialog = contact.split('<!-- auto-request-start -->', 1)[1].split('<!-- auto-request-end -->', 1)[0]
for name in ('auto-repair.html', 'auto-repair/services.html', 'auto-repair/about.html'):
    page = output / name
    page.write_text(page.read_text().replace('<script src="/site-ui.js">', dialog + '<script src="/site-ui.js">'))
