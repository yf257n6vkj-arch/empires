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
echo "1/4 Stahuju články z Wikipedie"
bash wiki.sh encyklopedie-wiki.tsv encyklopedie/wiki
echo "2/4 Generuju obrázky"
bash obrazky.sh "$KEY" encyklopedie-zadani.tsv encyklopedie/obrazky || exit 1
echo "3/4 Kreslím znovu obrázky, které se napoprvé nepovedly"
bash obrazky.sh "$KEY" encyklopedie-oprava.tsv encyklopedie/oprava || exit 1
echo "4/4 Kreslím jednotky a města pro mapu"
ASPECT=1:1 bash obrazky.sh "$KEY" grafika-test.tsv encyklopedie/grafika || exit 1
ASPECT=1:1 bash obrazky.sh "$KEY" grafika.tsv encyklopedie/grafika || exit 1
echo "Všechno hotovo. Napiš Claudovi."
