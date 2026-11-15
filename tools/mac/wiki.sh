#!/bin/bash
# Stáhne z české Wikipedie texty článků k technologiím hry Empires, aby je Claude mohl porovnat s texty ve hře.
# Spuštění v Terminálu:  bash ~/Desktop/Claude/Empires/wiki.sh
# Články, které už jsou stažené, přeskočí. Wikipedie nemá ráda rychlé dotazy, proto skript mezi nimi čeká.
cd "$(dirname "$0")" || exit 1
mkdir -p wiki
total=$(grep -c . wiki.tsv)
n=0
while IFS=$'\t' read -r id title; do
  n=$((n + 1))
  [ -z "$id" ] && continue
  if [ -s "wiki/$id.json" ] && head -c 1 "wiki/$id.json" | grep -q '{' && ! grep -q '"missing"' "wiki/$id.json"; then
    echo "[$n/$total] $title už je stažený"
    continue
  fi
  for attempt in 1 2 3 4 5; do
    curl -s -G "https://cs.wikipedia.org/w/api.php" \
      -H "User-Agent: EmpiresGame/1.0 (rodinny projekt; michal)" \
      --data-urlencode "action=query" --data-urlencode "format=json" --data-urlencode "redirects=1" \
      --data-urlencode "prop=extracts|info" --data-urlencode "explaintext=1" --data-urlencode "inprop=url" \
      --data-urlencode "titles=$title" -o "wiki/$id.json"
    if head -c 1 "wiki/$id.json" | grep -q '{'; then break; fi
    echo "  Wikipedie chce zpomalit, čekám $((attempt * 10)) s"
    sleep $((attempt * 10))
  done
  echo "[$n/$total] $title"
  sleep 2
done < wiki.tsv
echo "Hotovo. Napiš Claudovi."
