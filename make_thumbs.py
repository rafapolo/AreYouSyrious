#!/usr/bin/env python3
import subprocess, sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

src = Path('assets')
dst = Path('thumbs')
exts = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}

images = [p for p in src.rglob('*') if p.suffix.lower() in exts and p.is_file()]
total = len(images)
print(f'Found {total} images', flush=True)

done = 0
errors = 0

def make_thumb(img):
    out = dst / img
    if out.exists():
        return True
    out.parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        ['magick', str(img), '-gravity', 'Center',
         '-resize', '75x75^', '-extent', '75x75',
         '-quality', '82', str(out)],
        capture_output=True, timeout=30
    )
    return r.returncode == 0

with ThreadPoolExecutor(max_workers=12) as ex:
    futs = {ex.submit(make_thumb, img): img for img in images}
    for fut in as_completed(futs):
        done += 1
        if not fut.result():
            errors += 1
        if done % 500 == 0:
            print(f'  {done}/{total} ({errors} errors)', flush=True)

print(f'Done: {done} processed, {errors} errors', flush=True)
