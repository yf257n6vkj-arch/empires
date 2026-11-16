#!/bin/bash
# Nainstaluje nebo aktualizuje hru Empires do složky Aplikace a spustí ji.
# Spuštění v Terminálu:  bash ~/Desktop/Claude/Empires/instalace.sh
# Předpokládá, že vedle tohoto skriptu leží soubor Empires-mac.zip, který připravil Claude.
cd "$(dirname "$0")" || exit 1
ZIP="Empires-mac.zip"
if [ ! -f "$ZIP" ]; then
  echo "Chybí soubor $ZIP. Napiš Claudovi, ať ho sem nahraje."
  exit 1
fi
echo "Zavírám Empires, pokud běží"
osascript -e 'quit app "Empires"' >/dev/null 2>&1
sleep 1
echo "Rozbaluji do složky Aplikace"
ditto -x -k "$ZIP" /Applications || exit 1
# Aplikace není podepsaná u Applu. Mac jí proto bez těchhle dvou kroků nedovolí spustit:
# první smaže značku „staženo z internetu“, druhý aplikaci podepíše jen pro tenhle počítač.
xattr -cr /Applications/Empires.app
codesign --force --deep --sign - /Applications/Empires.app 2>/dev/null || { echo "Podpis se nepovedl. Pošli Claudovi, co se vypsalo."; exit 1; }
echo "Hotovo. Spouštím Empires."
open /Applications/Empires.app
