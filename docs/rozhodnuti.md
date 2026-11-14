# Rozhodnutí

Sem zapisujeme, co jsme s Michalem rozhodli, ať se k tomu nemusíme vracet. Nejnovější je nahoře.

## 14. 11. 2026: Terén má vlastní barvy, povrch a měkké přechody

Michal chtěl terén realističtější a jednotlivé druhy lépe rozlišitelné. Každý terén má teď vlastní barvu i tvary. Louka je sytě zelená s trsy trávy a kvítky, pláně zlatavé se suchou trávou a keři. Les je tmavý a hustý, kopce olivově zelené oblé hřbety. Hory jsou šedé skalnaté štíty se sněhem, poušť světlý písek s dunami a občas kaktusem. Sousední políčka se na hranách a v rozích jemně prolínají a moře plynule tmavne od pobřeží, takže mapa nepůsobí jako šachovnice. U pobřeží je mělčina, pláž a příboj. Přiblížená mapa si kreslí pozadí s rezervou kolem výřezu, aby posouvání zůstalo plynulé.

## 14. 11. 2026: Mapu jde přiblížit až na trojnásobek

Michal chtěl mapu přibližovat. Na trackpadu se přibližuje roztažením prstů a posouvá dvěma prsty, myší přes Ctrl a kolečko a tažením. Fungují i tlačítka v rohu mapy a klávesy + a −, nula vrátí celou mapu. Když je mapa přiblížená a vybraná jednotka se dostane k okraji výřezu, mapa se na ni sama posune. Jmenovky měst rostou pomaleji než mapa, aby ji při přiblížení nezakrývaly. Jde jen o pohled, pravidla hry ani AI se to netýká.

## 14. 11. 2026: Jednotky jsou figurky na podstavci, města mají domy a hradby

Michal chtěl, aby jednotky a města víc připomínaly skutečné. Jednotky teď stojí jako malované figurky na oválném podstavci v barvě hráče. Válečník má tuniku v barvě hráče, kyj a dřevěný štít, osadník je krytý vůz tažený volem. Opevněná jednotka má před sebou nízkou kamennou zídku, osadník při práci zlatý oblouk postupu kolem podstavce. Města mají hrázděné domy se sedlovými střechami a rostou po stupních: do velikosti 2 tři domy v palisádě, do 5 přibude radnice, od 6 kamenné hradby s branou, hradem a věžemi, od 8 i zadní věže. Jednotka ve městě stojí zmenšená v levém rohu, aby nezakryla město ani jmenovku.

Vzhled hradeb zatím říká jen velikost města. Až budou ve hře budovy Hradby, má je ukazovat ta budova, ať hráč pozná, které město je opevněné.

## 14. 11. 2026: Grafika zůstává plochá a kreslená kódem, ale s detailem

Michal chtěl velký skok ve vzhledu. Jednotky jsou kulaté žetony v barvě hráče s kreslenou postavičkou (válečník s kyjem, osadník s vozem), města jsou shluky domků s palisádou, které s velikostí rostou a od velikosti 4 mají věž. Velikost města je ve jmenovce. Terén má textury, moře hloubku, pobřeží písčitý okraj a mlha měkký přechod. Mapa se zvětšuje podle velikosti okna. Pixelový vzhled staré Civilizace jsme nezvolili.

## 14. 11. 2026: Hranice jen vyznačujeme, jako pravidlo přijdou později

Na mapě je vidět dosah měst (21 políček kolem každého města) jako přerušovaná hranice v barvě hráče. Pravidla hranice nemají, stejně jako Civilizace 1: jednotky smí kamkoli a město nejde založit jen těsně vedle jiného. Skutečné hranice (zákaz vstupu v míru, zákaz zakládat města na cizím území, šíření hranic kulturou) jsou nápad na pozdější verzi, až bude základ s AI hrát dobře, protože by AI přidaly nová rozhodnutí. Až přibudou soupeři, ukážeme stejně i dosah jejich měst.

## 14. 11. 2026: Fáze 1 končí hratelnými prvními 30 tahy bez soupeřů

Fáze 1 obsahuje start s osadníkem a válečníkem, pohyb po mapě podle ceny terénu, odkrývání mlhy války, zakládání měst, růst měst podle jídla, výrobní frontu (válečník, osadník, sýpka), osadníka jako dělníka (cesta, důl, zavlažování), konec tahu a automatické ukládání. Boj, technologie, obchod, spokojenost a soupeři přijdou v dalších fázích. Počítačoví hráči mají ve fázi 1 jen startovní pozici a žádné jednotky. Fázi uzavře hratelná verze, na které doladíme grafiku.

## 14. 11. 2026: Grafiku ladíme až na konci fáze 1

Mapa z fáze 0 sedí, grafika potřebuje doladit. Uděláme to až nad hratelnou mapou s jednotkami a městy, protože terén pak bude hlavně pozadí, přes které musí být vidět jednotky a barvy hráčů. Do té doby kreslíme jednotky a města jednoduše, aby šly snadno změnit, a terén zůstává, jak je.

## 14. 11. 2026: Osadník má jako v Civ 1 dvě práce

Jedna jednotka zakládá města i staví cesty, doly a zavlažování. AI určí účel osadníka (zakladatel, nebo dělník) už při zadání do výroby a během jeho života ho nemění. Výroba počítá zvlášť, kolik zakladatelů a kolik dělníků chce. Turnaje AI hlídají, jestli se jeden z účelů nepřestal stavět. Hráč může svého osadníka použít na cokoli.
