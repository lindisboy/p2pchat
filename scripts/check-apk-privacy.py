"""Reject APKs containing this builder's home or checkout paths."""
import argparse
from pathlib import Path
from zipfile import ZipFile

parser = argparse.ArgumentParser()
parser.add_argument('apk', type=Path)
args = parser.parse_args()
markers = [str(Path.home()).encode(), str(Path.cwd()).encode()]
with ZipFile(args.apk) as archive:
    matches = [name for name in archive.namelist()
               if not name.endswith('/') and any(marker in archive.read(name) for marker in markers)]
if matches:
    print('FAIL: local builder paths remain in APK entries:')
    for name in matches:
        print(name)
    raise SystemExit(1)
print('PASS: no local home or checkout paths in APK entries.')
