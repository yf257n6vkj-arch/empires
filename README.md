# Empires

Tahová strategie do prohlížeče ve stylu Civilizace 1. Jedna partie má trvat 45 až 60 minut proti třem počítačovým soupeřům, kteří hrají rozumně a nepodvádějí. Celé zadání je v projektu Empires v Claudovi.

Hotová je fáze 1 a probíhá fáze 2. Hráč si vybere jeden z patnácti národů (čtrnáct z Civilizace 1 a Češi), zakládá a rozvíjí města, staví cesty, doly a zavlažování, zkoumá 68 technologií v 5 érách (strom podle Civilizace 1, každá technologie má stránku s vyprávěním) a dělí obchod mezi vědu, daně a zábavu. Za zlato platí údržbu budov, může dokoupit výrobu a budovy jde i prodat. Města mají vlastní obrazovku s pohledem na město, šťastné, spokojené a nespokojené obyvatele, oslavy, specialisty, korupci a znečištění, 27 budov a 24 divů světa a jde vyrábět 29 typů jednotek včetně lodí a letadel. Starší jednotky jde ve městě za zlato povýšit na novější typ a každou jednotku jde rozpustit. Říše si volí ze šesti vlád a může vyhrát vesmírnou lodí. Soupeři a boj přijdou ve fázi 3. Hra se sama ukládá do prohlížeče a navíc jde uložit pod jménem nebo do souboru. Mapa vzniká podle přírody s pohořími, srážkovým stínem a řekami tekoucími z hor k moři a kreslí se jako fyzická mapa s reliéfem. Má dvanáct terénů z Civilizace 1 včetně řek a polárního ledu a na části políček leží suroviny jako ryby, koně nebo zlato. Osadníci umí terén měnit, přidat se k městu a čistit znečištění. Města můžou postihnout katastrofy a příliš mnoho znečištění vede ke globálnímu oteplování.

## Jak se hra ovládá

- Po spuštění se ukáže hlavní nabídka. Odtud pokračuješ v rozehrané hře, začneš novou, nahraješ uloženou nebo otevřeš encyklopedii. Kapitola Jak hrát v encyklopedii vysvětluje, jak nechat města růst, jak udržet obyvatele spokojené a jak rychle bádat.
- Tlačítko `Menu` vlevo nahoře nebo `Esc` bez vybrané jednotky otevře nabídku ve hře. Tam hru uložíš, nahraješ jinou nebo se vrátíš do hlavní nabídky.
- Klikni na svou jednotku nebo město a vyber ho.
- Klik na sousední políčko jednotku posune, klik dál ji tam pošle i na víc tahů. Cestu ukáže přerušovaná čára.
- Do města nebo k jiné jednotce ji pošleš pravým klikem (na trackpadu dvěma prsty) nebo klávesou `G` a klikem na cíl. Jednotka na cestě má u sebe modrou šipku. Když ji vybereš, cestu zrušíš klávesou `C`.
- Šipky nebo číslice 1 až 9 posouvají vybranou jednotku.
- `B` založí město, ve vlastním městě k němu osadníka přidá. `R` postaví cestu, `I` zavlažování, `M` důl, `V` vyčistí znečištění, `F` opevní jednotku, mezerník ji nechá do příštího tahu, `N` vybere další jednotku, `U` ji povýší a `D` rozpustí. Zavlažování v lese, džungli a bažině a důl na louce a pláních mění terén.
- `K` a klik na cíl pošle osadníka stavět cestu po celé trase, `A` mu zapne automatickou práci kolem měst. Obojí zastaví `C`.
- `Enter` ukončí tah, `Esc` zruší výběr. Druhé `Esc` otevře nabídku.
- `T` otevře strom technologií. Na výzkum klikneš i v hlavičce. Posuvníky Věda a Zábava vedle nastavíš, kolik obchodu jde do výzkumu a kolik na zábavu, zbytek jsou daně. Zábava dělá obyvatele spokojenými a šťastnými a šťastná města slaví.
- Klik na technologii ve stromu otevře její stránku. Vzdálenou technologii jde nastavit jako cíl a hra k ní bude zkoumat sama.
- Dvojklik na město nebo tlačítko `Otevřít město` ukáže obrazovku města. Klikem na políčko v okolí města přesuneš obyvatele. Tlačítkem + u stavby ji přidáš do plánu. Pořadí v plánu změníš šipkami nebo přetažením a hranici mezi obrázkem a panely jde táhnout myší.
- `O` nebo tlačítko `Města` nahoře otevře přehled všech měst. U každého města je vidět velikost, růst, výroba, obchod a nálada a v seznamu jde rovnou změnit, co staví.
- Jazyk hry přepneš na úvodní obrazovce nebo v menu. Hra umí česky a anglicky.
- Rádce vlevo radí začátečníkům, co dělat dál. Křížkem ho schováš, tlačítkem Rádce nahoře nebo v menu ho zase ukážeš.
- Ve městě můžeš místo stavby zvolit Vydělávat zlato. Otazník u stavby nebo klik na budovu v obrázku města otevře encyklopedii. Tlačítkem Prodat u budovy ji prodáš, jednu za tah. Klik na obyvatele mimo pole z něj udělá výběrčího daní nebo vědce.
- Mapu přiblížíš roztažením prstů na trackpadu, `Ctrl` a kolečkem myši, tlačítky v rohu mapy nebo klávesami `+` a `−`. Nula vrátí celou mapu.
- Přiblíženou mapu posuneš dvěma prsty na trackpadu, kolečkem myši nebo tažením. Klik do malé mapy vpravo dole tě přenese na to místo.
- Záznam událostí vpravo nahoře rozbalíš šipkou.

## Jak hru spustit na Macu

Potřebuješ Node.js 22 nebo novější. Nejjednodušší je stáhnout instalátor z nodejs.org, nebo přes Homebrew `brew install node`.

```sh
git clone https://github.com/yf257n6vkj-arch/empires.git
cd empires
npm install
npm run dev
```

Poslední příkaz vypíše adresu, typicky `http://localhost:5173`. Otevři ji v prohlížeči. Kód mapy je v adrese za `#seed=`, takže konkrétní mapu jde poslat odkazem.

## Příkazy

| Příkaz | Co dělá |
| --- | --- |
| `npm run dev` | Spustí hru v prohlížeči a po každé změně kódu ji obnoví |
| `npm test` | Pustí automatické testy |
| `npm run typecheck` | Zkontroluje typy, zvlášť i to, že herní jádro nepoužívá nic z prohlížeče |
| `npm run check-maps -- 500` | Vygeneruje 500 map bez obrazovky a vypíše statistiky |
| `npm run pace -- 300` | Automatický hráč odehraje 120 tahů na 300 mapách a vypíše, jak rychle postupuje výzkum a růst |
| `npm run build` | Připraví hotovou stránku do složky `dist` |
| `npm run i18n -- en` | Vypíše texty, které v angličtině chybí nebo přebývají |

## Jak je kód rozdělený

```
src/core/        herní jádro, žádná vazba na prohlížeč
  rng.ts         generátor náhody se semenem, jeho stav jde uložit
  rules.ts       načtení pravidel z datových souborů
  data/          čísla pravidel v JSON (terén, jednotky, budovy, vylepšení, vlády, národy, konstanty)
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
  workers.ts     osadník staví cestu po celé trase nebo sám vylepšuje okolí měst
  advisor.ts     rady pro začínajícího hráče
  economy.ts     technologie, cíl výzkumu, zlato, co jde stavět
src/web/         vykreslení do Canvasu, ovládání a texty
  i18n/          překlady: index.ts (t, tn, výběr jazyka), names.ts (jména z pravidel),
                 en*.ts (anglické texty, jména a encyklopedie)
  citiesOverview.ts přehled všech měst
  render.ts      mapa, terén, města
  unitArt.ts     figurky jednotek
  newGame.ts     výběr národa pro novou hru
  terrainField.ts terén jako souvislá plocha s přírodními hranicemi
  cityView.ts    pohled do města z obrázků od Gemini
  menu.ts        hlavní nabídka, nabídka ve hře a dialog uložených her
  saves.ts       automatické ukládání, pojmenované uložené hry a soubory
  buildingArt.ts budovy a divy pro obrazovku města a encyklopedii
  cityScreen.ts  obrazovka města
  empire.ts      dialogy vlády, vesmírné lodi a vítězství
  techTree.ts    plakát se stromem technologií a stránky technologií
  techIcons.ts   ikony technologií
  encyclopedia.ts texty ke každé technologii
tests/           automatické testy
tools/           skripty, které běží v Node bez prohlížeče
tools/preview/   náhledy figurek, budov a uložená hra pro snímky obrazovky
```

## Pravidla, která v kódu držíme

- Do hry přidáváme jen to, co umí používat i AI soupeřů.
- AI nikdy nedostane celý stav hry. Dostane jen `playerView(stav, hráč)`, tedy to, co by na jejím místě viděl člověk.
- Veškerá náhoda jde přes `Rng`. Stejné semeno dá stejnou mapu, stejné boje a stejná rozhodnutí AI.
- Stav hry je obyčejný objekt, který jde uložit do JSON a zase načíst. Tah stav nemění, vrací nový.
- Čísla pravidel patří do `src/core/data`, ne do kódu.
- Hráč i AI dělají všechno přes stejné příkazy v `commands.ts` se stejnými kontrolami.
- `src/core` nesmí používat nic z prohlížeče, jinak by nešly pouštět turnaje AI v Node.

## Jak přidat další jazyk

Texty píšeme česky přímo v kódu a obalujeme je funkcí `t("...")`, texty s číslem funkcí `tn("1 tvar|2 až 4|5 a víc", n)`. Česká věta slouží jako klíč. Další jazyk vznikne tak, že zkopíruješ `src/web/i18n/en.ts` a soubory `en-*.ts`, přeložíš hodnoty a jazyk přidáš do seznamu `LANGUAGES` v `src/web/i18n/index.ts`. Příkaz `npm run i18n -- kód` vypíše, co v novém jazyce ještě chybí, a test `tests/i18n.test.ts` neprojde, dokud chybí cokoli z textů rozhraní. Encyklopedie se bez překladu ukáže česky.
