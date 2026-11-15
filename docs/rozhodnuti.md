# Rozhodnutí

Sem zapisujeme, co jsme s Michalem rozhodli, ať se k tomu nemusíme vracet. Nejnovější je nahoře.

## 15. 11. 2026: Město má plán staveb, osadníci pracují sami a hra má rádce

Michal chtěl ve městě frontu práce. Město si teď může naplánovat až osm dalších staveb. Když dokončí tu současnou, vezme další z plánu a přeskočí, co už postavit nejde. Bez plánu dál vyrábí stejnou jednotku, nebo po dokončené budově přejde na obránce. Plán je obyčejný příkaz, takže ho bude používat i AI.

Osadník umí postavit cestu nebo železnici po celé trase k cíli. Na každém políčku bez cesty se zastaví, postaví ji a jde dál. Pod železnici nejdřív položí cestu. Osadník taky může pracovat sám: vybere políčko kolem vlastních měst, kde vylepšení přidá nejvíc jídla, výroby a obchodu, a započítá, jak daleko musí jít. Políčka, která město obdělává, mají přednost. Dva osadníci si práci nerozeberou na stejné políčko. Rozkazy plní na začátku každého tahu a AI je bude používat stejně.

Hra má rádce pro syna. Ukazuje vlevo nahoře nejvýš tři rady podle naléhavosti, například zvolit výzkum, uklidnit nepokoje, nedovolit, aby došlo zlato, nebo založit další město. U každé rady je tlačítko, které hráče dovede na správné místo. Rádce čte jen to, co hráč vidí o svých městech a jednotkách. Jde vypnout v menu.

V detailu města jde hranici mezi obrázkem a panely táhnout myší, hra si výšku pamatuje.

## 15. 11. 2026: Detail města kreslí Gemini a terén má přírodní hranice

Michal chtěl, aby detail města vypadal dobře a všechny budovy nakreslil Gemini. Gemini nakreslí každou budovu a každý div jako samostatný obrázek z mírného nadhledu, k tomu tři typy domů pro každou éru a dvě krajiny do pozadí, jednu s mořem pro přístavní města. Město v detailu staví budovy na louku do řad, divy dostanou nejlepší místa a zbytek zaplní domy podle počtu obyvatel. Hradby stojí vepředu. Dokud obrázky nejsou ve hře, zůstává pohled kreslený kódem.

Detail města se teď vejde na obrazovku bez posouvání. Nahoře je pohled do města s obyvateli, dole okolí města, výroba a přehled města. Nabídka toho, co stavět, je seznam rozdělený na jednotky, budovy a divy.

Terén na mapě dál kreslí kód. Hranice mezi terény se ale vlní podle hladkého šumu, takže se louka, pláně a les potkávají v křivkách a pobřeží nemá schody. Pobřeží se vlní méně, aby políčko pevniny vždycky vypadalo jako pevnina. Stromy a tráva rostou podle toho, na jaké zemi zrovna leží. Pravidla se nemění, každé políčko má dál jeden terén.

Jednotku jde poslat do města nebo k jiné jednotce pravým klikem nebo klávesou G. Dřív klik na vlastní město jen vybral město. Jednotka na cestě má modrou šipku a cestu jí zruší klávesa C.

## 15. 11. 2026: Hra má hlavní nabídku a mapa zabírá celé okno

Michal chtěl rozhraní podle Civilizace 3. Po spuštění se ukáže hlavní nabídka s obrázky z encyklopedie, které se pomalu prolínají. Z ní hráč pokračuje v rozehrané hře, začne novou, nahraje uloženou nebo otevře encyklopedii a přehled ovládání.

Ve hře otevře nabídku tlačítko vlevo nahoře nebo klávesa Esc, když není vybraná žádná jednotka. Hru jde uložit pod jménem. V prohlížeči se vejde dvanáct uložených her, protože prohlížeč má na data jen pár megabajtů. Kdo chce hru přenést jinam nebo jich mít víc, uloží ji do souboru. Automatické ukládání po každém kroku zůstává a hlavní nabídka z něj nabízí tlačítko Pokračovat.

Postranní panel zmizel a mapa vyplní celé okno pod horní lištou. Výběr výzkumu a panel jednotky nebo města plují vlevo dole, záznam událostí vpravo nahoře a jde ho sbalit. Vpravo dole je malá mapa celého kontinentu. Klik do ní přenese pohled na to místo, a když je mapa oddálená, rovnou ji přiblíží.

## 15. 11. 2026: Jednotky a města kreslí Gemini

Michal schválil, že jednotky a města na mapě budou obrázky od Gemini místo figurek kreslených kódem. Gemini kreslí každou jednotku jako figurku z mírného nadhledu na purpurovém pozadí a Claude pozadí vyřízne. Města mají podobu podle éry svého majitele (pravěk a starověk, středověk, průmyslová doba, moderní doba) a pro každou éru malou a velkou verzi. Velká verze platí od šesti obyvatel.

Na obrázcích nemá oblečení barvu národa, takže barvu ukazuje podstavec pod jednotkou a kruh kolem města. Co obrázek nemá, kreslí dál kód. Terén zůstává kreslený kódem.

Opevněnou jednotku teď obklopuje kamenná hradba s cimbuřím a nad ní je štítek s věží. Dřív ji poznal jen ten, kdo si všiml nízké zídky před podstavcem.

## 15. 11. 2026: Encyklopedie má hesla o vládcích

Každý vládce má v encyklopedii heslo s portrétem od Gemini. Michal chtěl, aby texty kromě obecného popisu přinesly i skutečnosti ze života a nevyhýbaly se temným stránkám. U Caesara, Čingischána, Stalina, Maa a dalších proto heslo říká, kolik lidí za jejich vlády nebo v jejich válkách zemřelo, a u Karla IV. připomíná pogrom v Norimberku. Čísla jsou podle odhadů historiků a tam, kde se odhady liší, to text přizná.

Gemini odmítl nakreslit Gándhího, Stalina a Maa, a to i zezadu nebo bez jména. Jejich portréty proto Michal nechal nakreslit v Groku ve stejném malířském stylu. Ostatní obrázky v encyklopedii a na mapě dál kreslí Gemini.

## 15. 11. 2026: Hraje se za národy z Civilizace 1 a za Čechy

Michal chtěl národy podle Civilizace 1 a k nim Čechy. Na výběr je patnáct národů: Římané, Babyloňané, Němci, Egypťané, Američané, Řekové, Indové, Rusové, Zuluové, Francouzi, Aztékové, Číňané, Angličané, Mongolové a Češi s Karlem IV. Původní zadání počítalo s tím, že jména národů vymyslí syn, tohle ho nahrazuje. Syn může dál vymýšlet jména jednotek a divů.

Národy nemají žádné zvláštní bonusy, stejně jako v Civilizaci 1. Liší se jménem, vládcem, barvou, jmény měst a povahou, podle které bude hrát počítač. Mongolové třeba spoléhají na armádu a Češi sázejí na vědu. Národy jsou rozdělené do barevných dvojic jako v Civilizaci 1 a dva národy stejné barvy se v jedné hře nepotkají. Každý národ má šestnáct skutečných jmen měst, pak hra bere obecná česká jména.

Vládci jsou stejní jako v Civilizaci 1, včetně Stalina a Maa. Claude je nejdřív nahradil Petrem Velikým a prvním čínským císařem, protože hru bude hrát i syn. Michal chtěl originál a o vládcích je v encyklopedii poctivé heslo, které nezamlčí, kolik lidí za jejich vlády zemřelo.

Novou hru začíná okno, ve kterém si hráč národ vybere. Soupeři dostanou náhodné národy z jiných barev. Uložené hry dostanou národy samy.

## 15. 11. 2026: Jednotky jde rozpustit a povýšit

Rozpustit jde jakoukoli jednotku. Ve vlastním městě dá polovinu své ceny do výroby, jinde prostě zmizí. Loď s jednotkami na palubě jde rozpustit jen ve městě, aby se nikdo neutopil.

Povýšit jde jednotku jen ve vlastním městě, a to na nejnovější typ v její řadě, na který má hráč technologie. Řady vedou podle toho, co v Civilizaci 1 kterou jednotku nahradilo, třeba válečník, kopiník, mušketýr a střelec. Povýšení stojí 10 zlata a 2 zlata za každý štít rozdílu v ceně a zabere jednotce zbytek tahu. Válečník na mušketýra tak vyjde na 30 zlata, kdežto koupit mušketýra v městě, které ještě nic nevyrobilo, stojí přes 80. Obě akce jsou běžné příkazy, takže je bude moct používat i počítač.

## 15. 11. 2026: Encyklopedie popisuje všechno, co ve hře je

Michal chtěl, aby každá jednotka, budova, div, vláda, terén i úprava krajiny měla popis a obrázek. Encyklopedie má 98 hesel a otevírá se tlačítkem v horní liště nebo klávesou E. Do hesla se dá skočit i ze stromu technologií nebo kliknutím na budovu ve městě.

Každé heslo má krátký text pro děti, zajímavost s vazbou na Česko, kde to šlo, a odkaz na článek české Wikipedie. Texty Claude psal sám a ověřoval je proti staženým článkům. Pod textem hra vypíše, co heslo dělá podle pravidel a která technologie ho odemyká, takže se popis nerozejde s čísly v datech.

Obrázky kreslí Gemini v jednotném malovaném stylu a Michal je generuje skriptem na svém Macu, protože klíč k Gemini nechává u sebe. Claude je zmenšuje na 800 × 600 a ořízne papírový okraj, když ho obrázek má. Kdyby nějaký obrázek chyběl, hra místo něj ukáže portrét jednotky nebo budovy kreslený kódem.

## 15. 11. 2026: Hra má všechno, co technologie v Civilizaci 1 odemykají

Michal schválil výzkumné centrum a pak chtěl projít strom Civilizace 1 a doplnit ke každé technologii, co odemyká. Claude doporučoval vynechat vlády, diplomata a karavanu, protože je zadání vyřadilo kvůli AI. Michal se rozhodl pro úplně všechno, takže hra teď jde v těchto věcech nad rámec zadání první verze.

Jednotek je 29. Přibyl válečný vůz, dělostřelectvo, mechanizovaná pěchota, diplomat, karavana, devět lodí od triéry po letadlovou loď a stíhačka, bombardér a jaderná raketa. Lodě se staví jen v přímořských městech, plují po moři a vezou pozemní jednotky. Jednotka nastoupí, když vstoupí na loď z pobřeží, a vystoupí krokem na pevninu. Triéra se může na volném moři potopit. Letadla musí do jednoho nebo dvou tahů přistát ve městě nebo na letadlové lodi. Útok a obranu všech jednotek použije boj ve fázi 3.

Budov je 27 včetně výzkumného centra, pobřežní pevnosti, protiraketového štítu a tří dílů vesmírné lodi. Divů je 24: všech 21 z Civilizace 1 a k nim naše Síň učenců, Velký bazar a Kamenný kruh, který se přestěhoval k pohřebním obřadům. Divy nesou skutečná historická jména, třeba Pyramidy v Gíze, Alexandrijská knihovna, Sixtinská kaple nebo Program Apollo. Kde Civilizace jen spojila jméno se stavbou, jsme vybrali skutečné místo: Bachovu katedrálu nahradil Chrám svatého Víta, Newtonovu kolej Královská společnost a lék na rakovinu Projekt lidského genomu. Div přestane působit, když jeho majitel objeví technologii, která ho v Civilizaci 1 ruší.

Cestou k vítězství je teď vesmírná loď a nahradila Velké dílo. Program Apollo dovolí všem stavět díly. Loď potřebuje motory a moduly a na každý z nich nosnou konstrukci, motory zkracují let a moduly zvyšují šanci na přistání. Kdo první přistane, vyhrál.

Vlád je šest. Despocie bere jedno z políček s výnosem nad 2, střed města ale nechává, jinak města v partii na 120 tahů skoro nerostla. Monarchie a komunismus mají stanné právo, republika a demokracie dávají víc obchodu, zato je rozladí vojáci mimo vlastní města. Každá vláda omezuje, kolik obchodu jde na vědu nebo na zlato. Revoluce znamená dva tahy anarchie, s pyramidami jeden. Jednotky nad počet, který město živí zdarma, stojí štít, a když město na údržbu nemá, rozpustí nejnovější jednotku.

Diplomat umí otevřít velvyslanectví, ukrást technologii, sabotovat a podplatit město. Karavana pomáhá stavět divy a otevírá obchodní cesty do vzdálených měst. Jaderná raketa zmenší města a zničí jednotky kolem cíle, protiraketový štít ji zastaví. Osadník staví železnici, po které se jezdí zadarmo a která přidá štíty, a pevnost.

Měřidlo tempa na 100 mapách ukázalo, že na vládě záleží. Automatický hráč, který zůstane v monarchii, má ve 120. tahu 10 měst a moderní dobu kolem 92. tahu. Když přejde do republiky, má jen 7 měst, protože jeho jednotky stojí štíty, zato moderní dobu má kolem 87. tahu a celý strom kolem 104. tahu.

Co zatím nefunguje: boj, a s ním obrana pevností, pobřežní pevnosti a hradeb, a diplomacie, a s ní nabídky míru od Velké zdi a OSN a senát republiky. Přijdou ve fázi 3. Most přes řeku z technologie stavba mostů chybí, protože mapa nemá řeky. Jaderná elektrárna nemůže vybuchnout. Dvanáct technologií neodemyká nic, stejně jako v Civilizaci 1.

## 15. 11. 2026: Hra má všechny budovy z Civilizace 1, které dávají smysl bez lodí a jaderných zbraní

Michal chtěl doplnit aspoň všechny budovy z Civilizace 1. Přibylo jich deset: palác, soudní dvůr, přístav, banka, tepelná, vodní a jaderná elektrárna, robotizovaná továrna, městská hromadná doprava a recyklační centrum. Ceny jsou jako u ostatních budov zhruba poloviční proti originálu, údržba zůstala skoro stejná. Hra teď má 21 budov a 5 divů.

Aby palác a soudní dvůr k něčemu byly, přidali jsme korupci. Každé město ztratí 3 % obchodu za každé políčko vzdálenosti od paláce, nejvýš polovinu. Palác dostane hráč zdarma v prvním městě a postavit ho jinde znamená přestěhovat sídlo vlády. Soudní dvůr ubere polovinu korupce. Na měřidle tempa korupce sebrala v tahu 120 zhruba 15 % obchodu a výzkum se zpomalil, tak jsme zlevnili technologie na 6 + 0,45 × počet známých. Antika pak přichází kolem 43. tahu, moderní doba kolem 87. a celý strom má automatický hráč v mediánu ve 106. tahu, ve 43 % partií ho nedokončí.

Hromadná doprava, recyklace a rozdíl mezi elektrárnami stojí v originálu na znečištění. Zadání znečištění v první verzi vynechává, protože s ním AI musí posílat osadníky čistit políčka. Zavedli jsme proto jednoduchou podobu bez špinavých políček. Výroba města a obyvatelé s průmyslovými technologiemi dělají body znečištění. Nad 20 body rozladí každých započatých 10 bodů jednoho obyvatele. Vodní a jaderná elektrárna znečišťují o polovinu méně než tepelná, recyklace ubere dvě třetiny znečištění z výroby a hromadná doprava vypne znečištění od obyvatel. AI to zvládne bez nového druhu rozhodování, vidí jen čísla ve městě. Měřidlo tempa našlo znečištění až v pozdní hře a málokdy.

Elektrárny potřebují továrnu a město má jen jednu, nová nahradí starou. Jaderná elektrárna v originálu mohla vybuchnout, to jsme vynechali. Přístav jde postavit jen u moře a přidá jídlo na oceánu. Odemyká ho kartografie, protože přístav k hrnčířství, kam ho dala Civilizace 1, historicky nepatří a kartografie jinak nic neodemykala. Budova, které chybí potřebná budova, třeba elektrárna po prodané továrně, nepůsobí.

Vynechali jsme tři věci. Pobřežní pevnost chrání před loděmi a protiraketový štít před jadernými zbraněmi, ani jedno ve hře není. Díly vesmírné lodi nahrazuje poslední div Velké dílo. Kdyby lodě nebo jaderné zbraně někdy přibyly, přidáme je s nimi.

## 15. 11. 2026: Texty technologií jsme porovnali s českou Wikipedií

Michal stáhl na Macu skriptem `tools/mac/wiki.sh` všech 68 článků, na které odkazují stránky technologií, a texty jsme s nimi porovnali. Opravili jsme, co nesedělo: nejstarší keramika je stará přes 17 000 let, lublaňské kolo přes 5 000 let, Präsident byl první auto vyrobené na území dnešního Česka a pověst o vejcích v maltě Karlova mostu vyvrátili v roce 2010 chemici z VŠCHT. K mapám jsme přidali mapu vyrytou do mamutího klu z Pavlova. Odkazy vedou rovnou na hlavní články bez přesměrování a stavitelství odkazuje na článek Beton, protože článek o římském betonu neexistuje.

## 15. 11. 2026: Obrázky k technologiím vygenerujeme, z Wikipedie bereme jen texty

Michal rozhodl, že obrázky na stránky technologií vygenerujeme, místo abychom stahovali fotky z Wikimedia Commons. Odpadne tím uvádění autorů a licencí. Každá stránka má místo na jeden obrázek v poměru 4 : 3, soubor se jmenuje podle zkratky technologie a patří do `src/web/techs/`. Zadání pro generátor ke všem 68 technologiím jsou v `docs/obrazky-technologii.md` a mají společný styl dětské encyklopedie. Dokud obrázek chybí, stránka ukáže velkou ikonu. Pro hru samotnou dál platí, že grafiku kreslíme kódem.

## 15. 11. 2026: Strom technologií má všech 67 objevů z Civilizace 1 a lukostřelbu

Michal chtěl celý strom jako v Civilizaci 1, a to hned. Strom má 68 technologií v pěti érách: pravěk a starověk, antika, středověk a renesance, novověk a moderní doba. Vychází z plakátu Civilizace 1 a liší se ve dvou věcech. Písmo je před abecedou, protože lidé psali klínovým písmem a hieroglyfy dávno před vznikem abecedy, takže zákony a matematika navazují na písmo. A přibyla lukostřelba, aby lučištníci měli vlastní objev. Jednotky, budovy a divy se navázaly na nejbližší technologii z Civilizace 1, tank odemyká automobil a akvadukt stavitelství. Náboženství odemyká novou budovu katedrálu, která uklidní tři nespokojené.

Aby se strom vešel do 120 tahů, stojí výzkum 6 + 0,55 × počet známých technologií. Na 300 mapách měl automatický hráč antiku kolem 44. tahu, středověk kolem 56., novověk kolem 70. a moderní dobu kolem 88. tahu. Celý strom měl v mediánu ve 106. tahu, ve 29 % partií ho do konce nedokončil. Objev teď přichází zhruba každé dva tahy, proto přibyl cíl výzkumu. Hráč klikne na vzdálenou technologii a hra k ní zkoumá sama, cíl umí použít i AI.

Ze 68 technologií zatím 45 nic neodemyká a jen otvírá cestu dál. Hlavně od novověku je strom chudý na budovy a jednotky. O jejich doplnění rozhodneme zvlášť.

## 15. 11. 2026: Každá technologie má stránku pro zvídavé dítě

Michal chtěl, aby se ze hry něco naučil i syn. Každá technologie má kreslenou ikonu, kdy vznikla, krátké vyprávění, zajímavost s nadpisem Věděl jsi? a odkaz na článek v české Wikipedii. Kde to jde, zajímavosti míří do Česka, třeba Únětice, Karlův most, píšťala a pistole, tolar a dolar, Mendel nebo Čapkův robot. Strom technologií je teď plakát s ikonami a šipkami, kde je vidět, co hráč zná, co zkoumá a kudy vede cesta k cíli.

Michal chce na stránkách i fotografie a obrázky z internetu, čímž mění pravidlo ze zadání, že cizí obrázky v první verzi nebudou. Pravidlo platí dál pro samotnou hru, fotky budou jen v encyklopedii a s uvedeným autorem a licencí. Zatím je stáhnout nejde, protože prostředí, ve kterém Claude pracuje, nemá Wikimedia Commons mezi povolenými weby. Michal je může povolit v nastavení Clauda pod Settings > Capabilities. Později jsme se rozhodli obrázky generovat, viz záznam výš.

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
