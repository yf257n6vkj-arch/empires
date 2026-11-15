#!/bin/bash
# Obrázky do encyklopedie pro nové terény: tundra, ledovec, džungle, bažina a řeka.
# Spuštění v Terminálu:  bash ~/Desktop/Claude/Empires/teren.sh TVŮJ_API_KLÍČ
# Co už je hotové, přeskočí, takže přerušený běh stačí pustit znovu.
cd "$(dirname "$0")" || exit 1
KEY="${1:-$GEMINI_API_KEY}"
if [ -z "$KEY" ]; then
  echo "Chybí klíč. Spusť: bash teren.sh TVŮJ_API_KLÍČ"
  exit 1
fi
bash obrazky.sh "$KEY" teren.tsv encyklopedie/teren || exit 1
echo "Všechno hotovo. Napiš Claudovi."
