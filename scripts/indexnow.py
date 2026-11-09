#!/usr/bin/env python3
"""Submit sitemap URLs to IndexNow (Bing / Yandex / Seznam, also feeds AI search)."""
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parent.parent
key_file = root / '.indexnow-key'
sitemap = root / 'dist' / 'sitemap.xml'

if not key_file.exists() or not sitemap.exists():
    print('IndexNow: skipped (missing key or sitemap)')
    sys.exit(0)

key = key_file.read_text().strip()
raw = re.findall(r'<loc>(.*?)</loc>', sitemap.read_text())
urls = [urllib.parse.quote(u, safe=':/?&=#%') for u in raw if u.startswith('http')]
# 短網址別名係 noindex，唔需要提交
urls = [u for u in urls if '/p/' not in u]
if not urls:
    print('IndexNow: no URLs')
    sys.exit(0)

ok = 0
failed = 0
for i in range(0, len(urls), 100):
    chunk = urls[i:i + 100]
    payload = {
        'host': 'queeniehub.estate',
        'key': key,
        'keyLocation': f'https://queeniehub.estate/{key}.txt',
        'urlList': chunk,
    }
    req = urllib.request.Request(
        'https://api.indexnow.org/indexnow',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json; charset=utf-8'},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status in (200, 202):
                ok += len(chunk)
            else:
                failed += len(chunk)
                print(f'IndexNow chunk {i // 100}: HTTP {resp.status}')
    except Exception as exc:
        failed += len(chunk)
        print(f'IndexNow chunk {i // 100} failed: {exc}')
    time.sleep(1)

print(f'IndexNow: {ok} URLs accepted, {failed} failed')
