# Empires

Tahová strategie do prohlížeče ve stylu Civilizace 1. Jedna partie má trvat 45 až 60 minut proti třem počítačovým soupeřům, kteří hrají rozumně a nepodvádějí. Celé zadání je v projektu Empires v Claudovi.

Hotová je fáze 1 a probíhá fáze 2. Hráč zakládá a rozvíjí města, staví cesty, doly a zavlažování, zkoumá 24 technologií ve 4 érách a dělí obchod mezi výzkum a zlato. Za zlato platí údržbu budov a může dokoupit výrobu. Města mají spokojenost, 10 budov a 5 divů světa a jde vyrábět 12 typů jednotek. Soupeři a boj přijdou ve fázi 3. Hra se sama ukládá do prohlížeče.

## Jak se hra ovládá

- Klikni na svou jednotku nebo město a vyber ho.
- Klik na sousední políčko jednotku posune, klik dál ji tam pošle i na víc tahů. Cestu ukáže přerušovaná čára.
- Šipky nebo číslice 1 až 9 posouvají vybranou jednotku.
- `B` založí město, `R` postaví cestu, `I` zavlažování, `M` důl, `F` opevní jednotku, mezerník ji nechá do příštího tahu, `N` vybere další jednotku.
- `Enter` ukončí tah, `Esc` zruší výběr.
- `T` otevře strom technologií. Na výzkum klikneš i v hlavičce a posuvníkem vedle nastavíš, kolik obchodu jde do výzkumu a kolik do zlata.
- Mapu přiblížíš roztažením prstů na trackpadu, `Ctrl` a kolečkem myši, tlačítky v rohu mapy nebo klávesami `+` a `−`. Nula vrátí celou mapu.
- Přiblíženou mapu posuneš dvěma prsty na trackpadu, kolečkem myši nebo tažením.

## Jak hru spustit na Macu

Potřebuješ Node.js 22 nebo novější. Nejjednodušší je stáhnout instalátor z nodejs.org, nebo přes Homebrew `brew install node`.

```sh
git clone https://github.com/yf257n6vkj-arch/empires.git
cd empires
npm install
npm run dev
```

Poslední příkaz vypíše adresu, typicky `http://localhost:5173`. Otevři ji v prohlížeči. Semeno mapy je v adrese za `#seed=`, takže konkrétní mapu jde poslat odkazem.

## Příkazy

| Příkaz | Co dělá |
| --- | --- |
| `npm run dev` | Spustí hru v prohlížeči a po každé změně kódu ji obnoví |
| `npm test` | Pustí automatické testy |
| `npm run typecheck` | Zkontroluje typy, zvlášť i to, že herní jádro nepoužívá nic z prohlížeče |
| `npm run check-maps -- 500` | Vygeneruje 500 map bez obrazovky a vypíše statistiky |
| `npm run pace -- 300` | Automatický hráč odehraje 120 tahů na 300 mapách a vypíše, jak rychle postupuje výzkum a růst |
| `npm run build` | Připraví hotovou stránku do složky `dist` |

## Jak je kód rozdělený

```
src/core/        herní jádro, žádná vazba na prohlížeč
  rng.ts         generátor náhody se semenem, jeho stav jde uložit
  rules.ts       načtení pravidel z datových souborů
  data/          čísla pravidel v JSON (terén, jednotky, budovy, vylepšení, konstanty)
  geometry.ts    mřížka, vzdálenosti, okruh města 21 políček
  mapgen.ts      generátor kontinentu
  start.ts       výběr startovních pozic
  state.ts       stav hry jako jeden datový objekt
  game.ts        nová hra
  commands.ts    všechno, co hráč i AI smí udělat, a kontroly, jestli to jde
  units.ts       pohyb jednotek a rozkazy na víc tahů
  path.ts        hledání cesty jen přes to, co hráč zná
  city.ts        obsazení políček, růst, hladovění, výroba
  turn.ts        konec tahu a začátek dalšího
  world.ts       pomocné funkce pro čtení mapy a výnosů
  events.ts      události pro záznam a pro AI
  view.ts        pohled hráče, jediný vstup pro AI
src/web/         vykreslení do Canvasu, ovládání a české texty
tests/           automatické testy
tools/           skripty, které běží v Node bez prohlížeče
```

## Pravidla, která v kódu držíme

- Do hry přidáváme jen to, co umí používat i AI soupeřů.
- AI nikdy nedostane celý stav hry. Dostane jen `playerView(stav, hráč)`, tedy to, co by na jejím místě viděl člověk.
- Veškerá náhoda jde přes `Rng`. Stejné semeno dá stejnou mapu, stejné boje a stejná rozhodnutí AI.
- Stav hry je obyčejný objekt, který jde uložit do JSON a zase načíst. Tah stav nemění, vrací nový.
- Čísla pravidel patří do `src/core/data`, ne do kódu.
- Hráč i AI dělají všechno přes stejné příkazy v `commands.ts` se stejnými kontrolami.
- `src/core` nesmí používat nic z prohlížeče, jinak by nešly pouštět turnaje AI v Node.
