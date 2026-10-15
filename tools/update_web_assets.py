#!/usr/bin/env python3
"""Copy one complete Trunk build into docs without replacing the custom launcher."""
from pathlib import Path
import base64
import hashlib
import re
import shutil

root = Path(__file__).resolve().parents[1]
source = root / 'native/dist/web'
target = root / 'docs'
stems = set(re.findall(r'photocraft-web-[a-f0-9]+', (source / 'index.html').read_text()))
if len(stems) != 1:
    raise SystemExit('Expected exactly one JS/WASM build in the generated index.html')
stem = stems.pop()
assets = [source / (stem + '.js'), source / (stem + '_bg.wasm')]
for asset in assets:
    if not asset.is_file():
        raise SystemExit(f'Missing build asset: {asset.name}')
html_path = target / 'index.html'
html = re.sub(r'photocraft-web-[a-f0-9]+', stem, html_path.read_text())
for asset in assets:
    digest = base64.b64encode(hashlib.sha384(asset.read_bytes()).digest()).decode()
    pattern = r'(href="\./' + re.escape(asset.name) + r'"[^>]*integrity=")[^"]+'
    html, count = re.subn(pattern, lambda match: match[1] + 'sha384-' + digest, html)
    if count != 1:
        raise SystemExit(f'Expected one preload for {asset.name}')
for asset in assets:
    shutil.copy2(asset, target / asset.name)
html_path.write_text(html)
print(f'Updated docs with {stem}; previous assets retained for cached pages.')
