#!/bin/bash
# Stáhne z české Wikipedie texty článků k technologiím hry Empires, aby je Claude mohl porovnat s texty ve hře.
# Spuštění v Terminálu:  bash ~/Desktop/Claude/Empires/wiki.sh [seznam.tsv] [složka]
# Články, které už jsou stažené, přeskočí. Wikipedie nemá ráda rychlé dotazy, proto skript mezi nimi čeká.
cd "$(dirname "$0")" || exit 1
LIST="${1:-wiki.tsv}"
OUT="${2:-wiki}"
mkdir -p "$OUT"
total=$(grep -c . "$LIST")
n=0
while IFS=$'\t' read -r id title; do
  n=$((n + 1))
  [ -z "$id" ] && continue
  # Skip articles already downloaded under the same title (a changed title is fetched again).
  if [ -s "$OUT/$id.json" ] && head -c 1 "$OUT/$id.json" | grep -q '{' && ! grep -q '"missing"' "$OUT/$id.json" && grep -qF "\"$title\"" "$OUT/$id.json"; then
    echo "[$n/$total] $title už je stažený"
    continue
  fi
  for attempt in 1 2 3 4 5; do
    curl -s -G "https://cs.wikipedia.org/w/api.php" \
      -H "User-Agent: EmpiresGame/1.0 (rodinny projekt; michal)" \
      --data-urlencode "action=query" --data-urlencode "format=json" --data-urlencode "utf8=1" --data-urlencode "redirects=1" \
      --data-urlencode "prop=extracts|info" --data-urlencode "explaintext=1" --data-urlencode "inprop=url" \
      --data-urlencode "titles=$title" -o "$OUT/$id.json"
    if head -c 1 "$OUT/$id.json" | grep -q '{'; then
      # No article with this exact title: take the best match of the Wikipedia search.
      if grep -q '"missing"' "$OUT/$id.json"; then
        sleep 2
        curl -s -G "https://cs.wikipedia.org/w/api.php" \
          -H "User-Agent: EmpiresGame/1.0 (rodinny projekt; michal)" \
          --data-urlencode "action=query" --data-urlencode "format=json" --data-urlencode "utf8=1" \
          --data-urlencode "generator=search" --data-urlencode "gsrlimit=1" --data-urlencode "gsrsearch=$title" \
          --data-urlencode "prop=extracts|info" --data-urlencode "explaintext=1" --data-urlencode "inprop=url" \
          -o "$OUT/$id.json"
        echo "  $title nenalezen přesně, beru nejlepší výsledek hledání"
      fi
      break
    fi
    echo "  Wikipedie chce zpomalit, čekám $((attempt * 10)) s"
    sleep $((attempt * 10))
  done
  echo "[$n/$total] $title"
  sleep 2
done < "$LIST"
echo "Hotovo. Napiš Claudovi."
