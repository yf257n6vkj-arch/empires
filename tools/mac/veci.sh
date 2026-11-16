#!/bin/bash
# Obrázky surovin, dolu, pevnosti a znečištění pro mapu ve hře Empires, a k tomu ruiny.
# Spuštění v Terminálu:  bash ~/Desktop/Claude/Empires/veci.sh TVŮJ_API_KLÍČ
# Co už je hotové, přeskočí, takže přerušený běh stačí pustit znovu.
cd "$(dirname "$0")" || exit 1
KEY="${1:-$GEMINI_API_KEY}"
if [ -z "$KEY" ]; then
  echo "Chybí klíč. Spusť: bash veci.sh TVŮJ_API_KLÍČ"
  exit 1
fi
echo "1/2 Kreslím ruiny"
ASPECT=4:3 bash obrazky.sh "$KEY" ruiny.tsv encyklopedie/ruiny || exit 1
echo "2/2 Kreslím suroviny, důl, pevnost a znečištění"
ASPECT=4:3 bash obrazky.sh "$KEY" veci.tsv encyklopedie/veci || exit 1
echo "Všechno hotovo. Obrázky jsou ve složkách encyklopedie/ruiny a encyklopedie/veci. Napiš Claudovi."
