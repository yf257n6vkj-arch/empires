#!/bin/bash
# Podklady pro encyklopedii hry Empires: stáhne články z české Wikipedie
# a vygeneruje obrázky přes Gemini ke všem jednotkám, budovám, divům,
# vládám, terénům a vylepšením.
# Spuštění v Terminálu:  bash ~/Desktop/Claude/Empires/encyklopedie.sh TVŮJ_API_KLÍČ
# Co už je hotové, přeskočí, takže přerušený běh stačí pustit znovu.
cd "$(dirname "$0")" || exit 1
KEY="${1:-$GEMINI_API_KEY}"
if [ -z "$KEY" ]; then
  echo "Chybí klíč. Spusť: bash encyklopedie.sh TVŮJ_API_KLÍČ"
  exit 1
fi
echo "1/2 Stahuju články z Wikipedie"
bash wiki.sh encyklopedie-wiki.tsv encyklopedie/wiki
echo "2/2 Generuju obrázky"
bash obrazky.sh "$KEY" encyklopedie-zadani.tsv encyklopedie/obrazky || exit 1
echo "Všechno hotovo. Napiš Claudovi."
