#!/bin/bash
# Builds the browser version and zips it for itch.io ("Kind of project: HTML",
# "This file will be played in the browser"). index.html sits at the root of the zip.
# itch.io limits: at most 1000 files and 500 MB unpacked.
# Usage: bash tools/build-web-zip.sh [zip path]   (default: dist-web.zip)
set -e
cd "$(dirname "$0")/.."
ZIP="${1:-$PWD/dist-web.zip}"
npm run build
cp LICENSE LICENSE-ASSETS.md dist/
FILES=$(find dist -type f | wc -l)
if [ "$FILES" -gt 1000 ]; then echo "Too many files for itch.io: $FILES" >&2; exit 1; fi
rm -f "$ZIP"
(cd dist && zip -qr "$ZIP" .)
echo "Built $ZIP with $FILES files"
