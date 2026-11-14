# Empires

Tahová strategie do prohlížeče ve stylu Civilizace 1. Jedna partie má trvat 45 až 60 minut proti třem počítačovým soupeřům, kteří hrají rozumně a nepodvádějí. Celé zadání je v projektu Empires v Claudovi.

Teď je hotová fáze 0: herní jádro, generátor náhody se semenem, generátor kontinentu 40 × 28 se sedmi typy terénu, startovní pozice pro čtyři hráče a stránka, která mapu vykreslí.

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
| `npm run build` | Připraví hotovou stránku do složky `dist` |

## Jak je kód rozdělený

```
src/core/        herní jádro, žádná vazba na prohlížeč
  rng.ts         generátor náhody se semenem, jeho stav jde uložit
  rules.ts       načtení pravidel z datových souborů
  data/          čísla pravidel v JSON (zatím terén)
  geometry.ts    mřížka, vzdálenosti, okruh města 21 políček
  mapgen.ts      generátor kontinentu
  start.ts       výběr startovních pozic
  state.ts       stav hry jako jeden datový objekt
  game.ts        nová hra a tah
  view.ts        pohled hráče, jediný vstup pro AI
src/web/         vykreslení do Canvasu a ovládání
tests/           automatické testy
tools/           skripty, které běží v Node bez prohlížeče
```

## Pravidla, která v kódu držíme

- Do hry přidáváme jen to, co umí používat i AI soupeřů.
- AI nikdy nedostane celý stav hry. Dostane jen `playerView(stav, hráč)`, tedy to, co by na jejím místě viděl člověk.
- Veškerá náhoda jde přes `Rng`. Stejné semeno dá stejnou mapu, stejné boje a stejná rozhodnutí AI.
- Stav hry je obyčejný objekt, který jde uložit do JSON a zase načíst. Tah stav nemění, vrací nový.
- Čísla pravidel patří do `src/core/data`, ne do kódu.
- `src/core` nesmí používat nic z prohlížeče, jinak by nešly pouštět turnaje AI v Node.
