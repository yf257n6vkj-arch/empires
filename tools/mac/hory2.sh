#!/bin/bash
# Další druhy hor pro šikmou mapu ve hře Empires.
# Spuštění v Terminálu:  bash ~/Desktop/Claude/Empires/hory2.sh TVŮJ_API_KLÍČ
# Co už je hotové, přeskočí, takže přerušený běh stačí pustit znovu.
cd "$(dirname "$0")" || exit 1
KEY="${1:-$GEMINI_API_KEY}"
if [ -z "$KEY" ]; then
  echo "Chybí klíč. Spusť: bash hory2.sh TVŮJ_API_KLÍČ"
  exit 1
fi
ASPECT=4:3 bash obrazky.sh "$KEY" hory2.tsv encyklopedie/hory || exit 1
echo "Všechno hotovo. Obrázky jsou ve složce encyklopedie/hory. Napiš Claudovi."
