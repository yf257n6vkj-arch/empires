#!/bin/bash
# Vygeneruje obrázky k technologiím hry Empires přes Gemini API od Googlu.
# Spuštění v Terminálu ve složce s tímto souborem:  bash obrazky.sh TVŮJ_API_KLÍČ
# Hotové obrázky přeskakuje, takže přerušený běh stačí pustit znovu.

KEY="${1:-$GEMINI_API_KEY}"
MODEL="${MODEL:-gemini-nano-banana-2.1}"
cd "$(dirname "$0")" || exit 1
if [ -z "$KEY" ]; then
  echo "Chybí klíč. Spusť: bash obrazky.sh TVŮJ_API_KLÍČ"
  exit 1
fi
mkdir -p obrazky
total=$(grep -c . zadani.tsv)
n=0
while IFS=$'\t' read -r id prompt; do
  n=$((n + 1))
  [ -z "$id" ] && continue
  if [ -s "obrazky/$id.jpg" ]; then
    echo "[$n/$total] $id už je hotový"
    continue
  fi
  printf '{"model":"%s","input":"%s","response_format":{"type":"image","mime_type":"image/jpeg","aspect_ratio":"4:3","image_size":"1K"}}' \
    "$MODEL" "$prompt" > /tmp/empires-request.json
  ok=0
  for attempt in 1 2 3 4; do
    code=$(curl -s -o /tmp/empires-response.json -w '%{http_code}' \
      -X POST "https://generativelanguage.googleapis.com/v1beta/interactions" \
      -H "x-goog-api-key: $KEY" -H "Content-Type: application/json" \
      --data @/tmp/empires-request.json)
    if [ "$code" = "200" ]; then
      data=$(grep -o '"data": *"[A-Za-z0-9+/=\\u]*"' /tmp/empires-response.json | head -1 \
        | sed -e 's/^"data": *"//' -e 's/"$//' -e 's/\\u003d/=/g')
      if [ -n "$data" ]; then
        printf '%s' "$data" | base64 -D > "obrazky/$id.jpg" 2>/dev/null || printf '%s' "$data" | base64 -d > "obrazky/$id.jpg"
        echo "[$n/$total] $id hotovo"
        ok=1
        break
      fi
      echo "[$n/$total] $id: odpověď neobsahuje obrázek"
      head -c 600 /tmp/empires-response.json; echo
      break
    elif [ "$code" = "429" ] || [ "${code:0:1}" = "5" ]; then
      echo "[$n/$total] $id: Google je přetížený ($code), zkusím to znovu za $((attempt * 10)) s"
      sleep $((attempt * 10))
    else
      echo "[$n/$total] $id: chyba $code"
      head -c 600 /tmp/empires-response.json; echo
      echo "Zastavuju. Pošli tuhle chybu Claudovi."
      exit 1
    fi
  done
  [ "$ok" = "1" ] || echo "[$n/$total] $id se nepovedl, při dalším spuštění ho zkusím znovu"
done < zadani.tsv
rm -f /tmp/empires-request.json /tmp/empires-response.json
echo "Hotovo. Obrázky jsou ve složce obrazky. Napiš Claudovi."
