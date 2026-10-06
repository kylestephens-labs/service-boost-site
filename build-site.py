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
