#!/bin/bash
# Obrázky hor a kopců pro šikmou mapu ve hře Empires.
# Spuštění v Terminálu:  bash ~/Desktop/Claude/Empires/hory.sh TVŮJ_API_KLÍČ
# Co už je hotové, přeskočí, takže přerušený běh stačí pustit znovu.
cd "$(dirname "$0")" || exit 1
KEY="${1:-$GEMINI_API_KEY}"
if [ -z "$KEY" ]; then
  echo "Chybí klíč. Spusť: bash hory.sh TVŮJ_API_KLÍČ"
  exit 1
fi
ASPECT=4:3 bash obrazky.sh "$KEY" hory.tsv encyklopedie/hory || exit 1
echo "Všechno hotovo. Obrázky jsou ve složce encyklopedie/hory. Napiš Claudovi."
