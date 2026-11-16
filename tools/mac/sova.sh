#!/bin/bash
# Namaluje průvodkyni Sovu ve třech náladách přes Gemini API.
# Spuštění v Terminálu ve složce s tímto souborem:  bash sova.sh TVŮJ_API_KLÍČ
# Obrázky uloží do složky sova/ a pošli je Claudovi, převede je do hry.
KEY="${1:-$GEMINI_API_KEY}"
cd "$(dirname "$0")" || exit 1
ASPECT=1:1 bash obrazky.sh "$KEY" sova.tsv sova
