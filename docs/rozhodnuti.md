# Rozhodnutí

Sem zapisujeme, co jsme s Michalem rozhodli, ať se k tomu nemusíme vracet. Nejnovější je nahoře.

## 15. 11. 2026: Strom technologií má všech 67 objevů z Civilizace 1 a lukostřelbu

Michal chtěl celý strom jako v Civilizaci 1, a to hned. Strom má 68 technologií v pěti érách: pravěk a starověk, antika, středověk a renesance, novověk a moderní doba. Vychází z plakátu Civilizace 1 a liší se ve dvou věcech. Písmo je před abecedou, protože lidé psali klínovým písmem a hieroglyfy dávno před vznikem abecedy, takže zákony a matematika navazují na písmo. A přibyla lukostřelba, aby lučištníci měli vlastní objev. Jednotky, budovy a divy se navázaly na nejbližší technologii z Civilizace 1, tank odemyká automobil a akvadukt stavitelství. Náboženství odemyká novou budovu katedrálu, která uklidní tři nespokojené.

Aby se strom vešel do 120 tahů, stojí výzkum 6 + 0,55 × počet známých technologií. Na 300 mapách měl automatický hráč antiku kolem 44. tahu, středověk kolem 56., novověk kolem 70. a moderní dobu kolem 88. tahu. Celý strom měl v mediánu ve 106. tahu, ve 29 % partií ho do konce nedokončil. Objev teď přichází zhruba každé dva tahy, proto přibyl cíl výzkumu. Hráč klikne na vzdálenou technologii a hra k ní zkoumá sama, cíl umí použít i AI.

Ze 68 technologií zatím 45 nic neodemyká a jen otvírá cestu dál. Hlavně od novověku je strom chudý na budovy a jednotky. O jejich doplnění rozhodneme zvlášť.

## 15. 11. 2026: Každá technologie má stránku pro zvídavé dítě

Michal chtěl, aby se ze hry něco naučil i syn. Každá technologie má kreslenou ikonu, kdy vznikla, krátké vyprávění, zajímavost s nadpisem Věděl jsi? a odkaz na článek v české Wikipedii. Kde to jde, zajímavosti míří do Česka, třeba Únětice, Karlův most, píšťala a pistole, tolar a dolar, Mendel nebo Čapkův robot. Strom technologií je teď plakát s ikonami a šipkami, kde je vidět, co hráč zná, co zkoumá a kudy vede cesta k cíli.

Michal chce na stránkách i fotografie a obrázky z internetu, čímž mění pravidlo ze zadání, že cizí obrázky v první verzi nebudou. Pravidlo platí dál pro samotnou hru, fotky budou jen v encyklopedii a s uvedeným autorem a licencí. Zatím je stáhnout nejde, protože prostředí, ve kterém Claude pracuje, nemá Wikimedia Commons mezi povolenými weby. Michal je může povolit v nastavení Clauda pod Settings > Capabilities.

## 15. 11. 2026: Město má vlastní obrazovku a obyvatele jde přesouvat ručně

Dvojklik na město nebo tlačítko Otevřít město ukáže obrazovku inspirovanou Civilizací 1 a 3. Nahoře je malovaný pohled na město, kde stojí každá postavená budova a div a domů přibývá s velikostí. Pod ním jsou obyvatelé jako postavičky (spokojení, nespokojení, baviči), okolí města s výnosy políček, zásoby jídla, výroba s obrázky všeho, co jde stavět, obchod, budovy a jednotky. Klikem na políčko hráč pošle obyvatele na pole nebo ho z pole odvolá a z volného obyvatele je bavič. Ruční rozmístění platí, dokud město nevyroste nebo se nezmenší, pak město rozmisťuje samo. AI bude používat automatické rozmístění, ruční volbu ale může použít stejným příkazem.

## 15. 11. 2026: Postavy jsou realističtější

Postavy mají klouby, stínování a výstroj podle doby: válečník s kyjem a kožešinou, hoplít s bronzovou přilbou a štítem, lukostřelec v kápi s napjatým lukem, legionář v plátové zbroji se štítem, mušketýr s kloboukem a mušketou, voják s přilbou a puškou s bajonetem. Jezdci sedí na koních s hřívou a ohonem, rytířův kůň má čaprák v barvě hráče. Katapult, dělo a tank jsou podrobnější a osadníka táhne vůl s rohy.

## 14. 11. 2026: Hospodářství běží zhruba dvakrát rychleji než v Civilizaci 1

Čísla převzatá z Civilizace 1 jsou stavěná na partii o více než 500 tazích. Při 120 tazích by hráč do konce hry objevil jen pár technologií. Měřidlo tempa (`npm run pace`) to ukázalo hned. Automatický hráč, který jen zakládá města, staví budovy, cesty a zavlažování a zkoumá, měl ve 120. tahu 4 technologie z 24. Proto jsme upravili čísla v datech: města rostou dvakrát rychleji, jednotky a budovy stojí polovinu a výzkum stojí 10 + 6 × počet známých technologií. Na 300 mapách teď automatický hráč dosáhne antiky kolem 47. tahu, středověku kolem 70. a novověku kolem 93. tahu. Celý strom má v mediánu ve 110. tahu, takže na Velké dílo zbývá zhruba deset tahů. Rozumný člověk by měl být o kousek rychlejší. Až si fázi zahraješ, čísla podle dojmu doladíme.

## 14. 11. 2026: Fáze 2 je ekonomika jedné civilizace, boj přijde ve fázi 3

Ve fázi 2 postavíme technologie (asi 24 ve 4 érách), posuvník mezi výzkumem a zlatem, údržbu budov a urychlení výroby za zlato, asi 10 budov, 5 divů, spokojenost a všech asi 12 typů jednotek. Jednotky budou mít útok a obranu, ale bojovat začnou až ve fázi 3, kde přibude hra dvou lidí, válka a mír, vítězství a skóre. Boj jsme posunuli, protože bez soupeře by ho nešlo vyzkoušet. Fáze 2 projde, když jeden hráč dohraje do 120. tahu a strom technologií jde za tu dobu rozumně projít. Tempo změříme jednoduchým automatickým hráčem na stovkách map. Ten nenahrazuje AI, slouží jen k ladění čísel.

## 14. 11. 2026: Fáze 1 je hotová

Michal fázi 1 uzavřel. Hra umí průzkum, zakládání a růst měst, výrobu, stavbu cest, dolů a zavlažování, přiblížení mapy a automatické ukládání, grafika je doladěná. Pokračujeme fází 2.

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
