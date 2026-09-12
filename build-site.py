"""Copy only public website assets into the static deployment directory."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent
output = root / 'public-site'
if output.exists():
    shutil.rmtree(output)
output.mkdir()
for name in ('index.html', 'style.css', 'app.js', 'config.js', 'favicon.svg'):
    shutil.copyfile(root / name, output / name)
