#!/bin/bash
# Obrázky pro pohled do města ve hře Empires: budovy, divy, domy a dvě krajiny v pozadí.
# Spuštění v Terminálu:  bash ~/Desktop/Claude/Empires/mesto.sh TVŮJ_API_KLÍČ
# Co už je hotové, přeskočí, takže přerušený běh stačí pustit znovu.
cd "$(dirname "$0")" || exit 1
KEY="${1:-$GEMINI_API_KEY}"
if [ -z "$KEY" ]; then
  echo "Chybí klíč. Spusť: bash mesto.sh TVŮJ_API_KLÍČ"
  exit 1
fi
echo "1/2 Kreslím budovy, divy a domy"
ASPECT=1:1 bash obrazky.sh "$KEY" mesto.tsv encyklopedie/mesto || exit 1
echo "2/2 Kreslím krajinu za městem"
ASPECT=21:9 bash obrazky.sh "$KEY" mesto-pozadi.tsv encyklopedie/mesto || exit 1
echo "Všechno hotovo. Napiš Claudovi."
