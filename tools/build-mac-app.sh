#!/bin/bash
# Builds "Empires Reloaded.app" for Apple Silicon Macs into desktop/out and zips it.
# Usage: bash tools/build-mac-app.sh [zip path]   (default: desktop/out/Empires-mac.zip)
# The app is not signed here (codesign only exists on macOS); tools/mac/instalace.sh signs it
# ad hoc on Michal's Mac during installation.
set -e
cd "$(dirname "$0")/.."
ZIP="${1:-$PWD/desktop/out/Empires-mac.zip}"
npm run build
rm -rf desktop/game
cp -r dist desktop/game
cd desktop
[ -d node_modules/@electron/packager ] || npm install --no-audit --no-fund
npm run package
cd "out/Empires Reloaded-darwin-arm64"
rm -f "$ZIP"
zip -qry "$ZIP" "Empires Reloaded.app"
echo "Built $ZIP"
