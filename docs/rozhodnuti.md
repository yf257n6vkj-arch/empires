# Rozhodnutí

Sem zapisujeme, co jsme s Michalem rozhodli, ať se k tomu nemusíme vracet. Nejnovější je nahoře.

## 17. 11. 2026: Rychlá hra na 60 tahů

Druhý návrh pro syna. Hodina u obrazovky denně nestačí na partii, která trvá celý večer, a průzkum ukázal, že krátké partie fungují. Polytopia má režim na 30 tahů a Sid Meier radil zmenšovat hru, dokud zábava nezačne mizet. Michal schválil volbu délky v nastavení světa.

Rychlá hra skončí po 60 tazích a měla by zabrat asi 25 minut. Svět je malý (34 × 24) a soupeři dva, obojí jde ručně změnit. Všem stejně se násobí přebytek štítů 2,2krát, výzkumu 3,2krát a jídla 2krát. Nedostatek jídla se nenásobí. Čísla jsou v game.json pod speeds a hra si volbu pamatuje. Hry uložené dřív se nahrají jako normální.

Všechno, co bylo psané na tah normální hry, se v rychlé hře posune na stejné místo partie. Barbaři se objevují od 25. tahu místo od 50., z ruin vylézají od 15. tahu, katastrofy začínají v 10. tahu a termíny etap u Sovy se zkrátí na polovinu. Soupeři podle toho počítají i začátek her, kdy ještě neválčí, a přechod na republiku.

Tempo jsem ladil měřicím skriptem na stovkách map. Pomalejší násobky (1,7 a 1,9) nestačily, rychlá hra skončila zhruba tam, kde je normální v 62. tahu. S novými čísly skončí tam, kde je normální kolem 80. tahu, tedy v pozdních érách před tanky a vesmírnou lodí. Další zrychlování už skoro nepomáhalo, protože brzdou je zakládání měst a cesta osadníků po mapě. Vesmírný závod v rychlé hře proto prakticky vyhrát nejde a rozhoduje dobytí nebo skóre.

V 50 partiích počítačů neselhala žádná, válka byla v 47 z nich a první začala v mediánu ve 34. tahu. Na partii připadá asi 11 bitev, v normální hře 34. Na minutu hraní je to v rychlé hře méně bojů než v normální, protože soupeři pořád dlouho staví armádu, než si troufnou zaútočit. Tohle zůstává otevřené.

## 17. 11. 2026: Boje se přehrávají na mapě

Michal chtěl hru zábavnější pro syna, kterého baví hlavně hry, kde bojují armády. Z průzkumu vyšlo, že nejhorší odpověď hry na hráčovo rozhodnutí je, když se nic nestane (Sid Meier na GDC 2012), a že děti baví zpětná vazba a to, co je vidět a slyšet (Malone 1981). U nás boj končil textovou zprávou.

Každý boj, ve kterém je hráčova jednotka, se teď přehraje na mapě. Útočník vyrazí k obránci, rány padají kolo po kole tak, jak je hra opravdu hodila, jiskří to a oběma ubývají životy na velkých ukazatelích. Poražený padne a nahoře se ukáže Vítězství, Ubránil ses nebo Prohra, k tomu co se stalo a jakou šanci boj měl. Nový veterán dostane nad hlavu zlatou hvězdu. Útoky soupeřů na hráčovy jednotky se přehrají po jejich tahu, až doběhnou pohyby, a mapa se k boji posune. Klik nebo klávesa zbytek přeskočí a nic dalšího přitom neudělá. Kdo má v systému omezený pohyb, uvidí jen výsledek. Jádro proto u každého boje zapisuje, odkud útočník útočil, životy na začátku a pořadí kol. Na pravidlech ani na soupeřích se nic nemění.

## 17. 11. 2026: Panely se stáhly do rohů a k dolnímu okraji

Michalovi vadilo, že levý sloupec panelů zakrývá mapu, a napadlo ho, že by si je mohl posouvat. Podívali jsme se, jak to řeší podobné hry. Civilizace 6 má výzkum jako malý sbalitelný ukazatel nahoře vlevo a panel jednotky dole. Freeciv21 má ovládání jednotky v pruhu dole uprostřed a malou mapu vpravo dole a jako jediný dovoluje panely přetahovat, k čemuž potřebuje i tlačítko na zamknutí rozhraní. Vývojáři Freecivu radí panely v rozích šetřit, protože zakrývají mapu, a u Humankind si hráči stěžují právě na obří panel jednotky.

Michal schválil sloupec rozpustit a přetahování nedělat. Výběr výzkumu a Rádce jsou teď vlevo nahoře. Výběr výzkumu se ukáže, jen když je potřeba vybrat. Rádce jde šipkou sbalit do jednoho řádku s počtem rad a hra si to pamatuje. Vybraná jednotka má nízký pruh dole uprostřed s popisem vlevo a tlačítky akcí v řadě vpravo. Město má v pruhu tři sloupce: růst a výrobu, spokojenost a obchod, jednotky ve městě s tlačítky. Když není nic vybrané, zůstane dole jen jeden řádek s počtem jednotek, které čekají. Mapa visí od horního okraje, takže volné místo zbývá dole pod pruhem. Bublina Sovy se drží nad pruhem.

## 16. 11. 2026: Hra se spouští jako aplikace Empires na Macu

Michal vybral pro finální verzi aplikaci pro Mac místo vlastní webové adresy nebo stránky na claude.ai. Hru balíme do Electronu. Je to okno s prohlížečem Chromium, ve kterém běží stejná hra jako na webu, jen se načítá ze souborů v aplikaci, takže funguje bez internetu a bez přihlášení. Aplikace má ikonu se středověkým městem, standardní menu Macu a odkazy do Wikipedie otevírá v normálním prohlížeči. Má asi 280 MB, protože si Chromium nese s sebou.

Aplikaci staví Claude skriptem tools/build-mac-app.sh a výsledný Empires-mac.zip nahraje do Michalovy složky. Michal ji nainstaluje skriptem instalace.sh. Ten ji rozbalí do složky Aplikace a podepíše ji jen pro tenhle počítač, protože bez placeného účtu u Applu by ji macOS jinak nespustil. Stejný postup slouží i pro každou novou verzi. Rozehrané hry se ukládají uvnitř aplikace, ne v prohlížeči, takže partii ze stránky na claude.ai je potřeba uložit do souboru a v aplikaci nahrát. Stránka na claude.ai dál zůstává pro rychlé zkoušení novinek.

## 16. 11. 2026: Šestnáct druhů hor a každé pohoří má svůj ráz

Michal chtěl členitější mapu, a tak Gemini namaloval dalších deset hor. Přibyl alpský štít s ledovcem, zubatý hřeben, dvojvrchol s jezírkem, žulová kupole, stolová hora z červeného pískovce, hora s lesem na úbočí, vápencové skály, velký trojvrcholový masiv, nízké předhůří a tmavá skalnatá hora.

Aby pohoří nebylo strakaté, mají hory tři rázy: zasněžené štíty, hnědé a šedé skály a teplé pouštní skály. Ráz se mění po kusech mapy zhruba pět na čtyři políčka. Hory u pouště dostanou pouštní skály a hory u ledovce a tundry sníh. V rámci jednoho rázu si každé políčko vybere svůj obrázek, takže hory vedle sebe nejsou stejné, a přesto k sobě patří.

## 16. 11. 2026: Gemini maluje všechno, co stojí na jednom políčku

Michal schválil, že Gemini namaluje i ruiny, všech jedenáct surovin, důl, pevnost a znečištění. Ruiny mají čtyři podoby: řecký chrám, zbořenou věž, zbytky městečka a zarostlou pyramidu. Zadání jsou v souborech ruiny.tsv a veci.tsv a Michal je spustí jedním skriptem veci.sh. Hra obrázky použije v obou pohledech, a dokud nejsou, kreslí tyhle věci kódem jako dosud.

Podklad terénu, řeky, cesty, železnice, zavlažování, hranice států a mlha zůstávají kreslené kódem. Mění totiž tvar podle sousedních políček a z obrázků by vznikla šachovnice. Stromy v lesích a džunglích taky zůstávají kreslené, protože je jich na mapě tisíce a malované shluky by se opakovaly. Podle toho jsme upravili i pravidlo v CLAUDE.md, které dřív říkalo, že celý terén kreslí kód. Hory a kopce od Gemini ho přitom už porušovaly.

Gemini všechno nakreslil a obrázky jsou ve hře. Kvádr hlíny tentokrát nenamaloval, jen pevnost stojí na hliněném valu, což k ní patří. Kouř u znečištění Gemini namaloval průsvitný přes purpurové pozadí a po vyříznutí byl do fialova. Skript proto umí u poloprůhledných míst purpurovou barvu z obrázku odečíst a kouř přebarvit do hnědé.

## 16. 11. 2026: Cesty a železnice vypadají jako skutečné

Michal chtěl cesty a železnici realističtější. Dřív vedla z každého políčka k sousedům rovná čára a tři políčka do L udělala trojúhelník. Teď se cesta na políčku, kterým jen prochází, plynule ohne, rovný úsek se lehce vlní a šikmá spojka chybí tam, kde se dvě políčka potkají přes společného souseda. Cesta je udusaná písčitá polní cesta s tmavší krajnicí a dvěma vyjetými kolejemi od vozů. Železnice má štěrkové lože, dřevěné pražce v pravidelných rozestupech a dvě ocelové kolejnice s odleskem. Kde vede železnice, cesta se vedle ní nekreslí a odbočuje jen k políčkům, kde železnice není.

## 16. 11. 2026: Neprozkoumaný svět je stará mapa a hory nakreslí Gemini

Michal vybral dva nápady z toho, jak grafiku řeší Civilizace 6 a Freeciv. Neprozkoumaný svět už není černý. Vypadá jako starý pergamen se skvrnami, čárkovanými poledníky a rovnoběžkami, silnějším rovníkem a větrnou růžicí v rohu. K okrajům je papír tmavší. Prozkoumaná krajina na kraji přechází do papíru a za ní má papír hnědý okraj, jako by ji někdo vmaloval do staré mapy. Platí to v šikmém pohledu i v pohledu shora, v okně města i na malé mapě.

Hory a kopce na šikmé mapě namaluje Gemini, šest obrázků hor a čtyři kopců na purpurovém pozadí, stejně jako jednotky a města. Zadání je v souboru hory.tsv a Michal ho spustí skriptem hory.sh. Pozadí vyřízne skript tools/cut-sprites.py, který zároveň spodek obrázku nechá vyblednout do země. Každé políčko si podle své polohy vybere jeden obrázek, takže se při každém překreslení nemění. Dokud obrázky nejsou, kreslí hra hory a kopce kódem jako dosud.

Gemini obrázky nakreslil. Hory se povedly hned, pod kopce ale namaloval kvádr hlíny jako u výřezu z diorámatu. Skript ho teď odřízne: změří, jak je kvádr silný, a obrázek usekne podél jeho dolního obrysu posunutého o tuto tloušťku. Pata hor i kopců pak vybledne do země.

## 16. 11. 2026: Mapa se dívá šikmo a hory, stromy, města i jednotky na ní stojí

Michal chtěl hru víc do 3D. Vybrali jsme šikmý pohled místo plného 3D přes WebGL, protože se dál kreslí do Canvasu a nic ze stávající hry se nerozbije. Plné 3D by znamenalo přepsat kreslení i klikání a v Safari na starším Macu by mohlo zpomalit. Krok šest z fáze 4, grafiku mapy, jsme tím vzali dřív, než bylo v plánu.

Mapa je teď nakloněná jako deska na stole. Políčko je na obrazovce o čtvrtinu nižší, než je široké, a přední okraj mapy má hnědou hranu. Na horách stojí skalní masivy se dvěma nebo třemi vrcholy, osvícenou západní stěnou, stinnou východní a sněhem na vyšších štítech. Pata hory se rozplývá do suti, takže pohoří nevypadá jako řada stanů. Na kopcích jsou zvlněné pahorky různé velikosti. Ruiny mají popraskanou kamennou podlahu chrámu, dva sloupy s kusem trámu, zlomené sloupy a spadlý válec sloupu. Stromy, palmy, rákosí, kaktusy, zvířata u surovin, ruiny, města, jednotky i praporek na konci cesty stojí vzpřímeně, nejsou splácnuté se zemí. Jména měst a čísla tahů na cestě zůstávají čitelná. Kdo klikne na horní část města nebo jednotky, která přesahuje do políčka za ní, vybere ji. Když je jednotka vybraná, klik ji posílá přesně na políčko pod myší.

V menu jde pohled přepnout zpátky na plán shora a hra si volbu pamatuje. Okno města kreslí okolí dál shora. Konec tahu v pozdní hře trvá v prohlížeči i se šikmou mapou 110 až 250 milisekund.

## 16. 11. 2026: Sova vede krok za krokem a ukazuje, kam kliknout

Syn Sovu přehlížel a nepřišel na to, jak stavět cesty, zavlažování a železnici. Sova teď v bublině dole na obrazovce říká vždycky jen jednu věc, kterou má hráč udělat hned teď. To, na co má kliknout, na mapě bliká žlutým kroužkem a tlačítka v panelech svítí. Když hráč krok udělá, Sova ho pochválí a ukáže další. Vede tak celou hru: založit město, vybrat výzkum, vybrat jednotku, opevnit vojáka, poslat průzkumníka, postavit osadníka, dojít s ním na dobré místo a založit tam město, stavět ve městě, co chce zvolený plán, a nakonec ukončit tah.

Cestu, zavlažování, důl a železnici ukáže Sova poprvé ručně a řekne, k čemu jsou. Teprve potom naučí tlačítko pro automatickou práci. Na průzkum posílá vždycky jen jednoho vojáka, ostatní vede domů do měst. Když políčko, na které se má kliknout, zakrývá panel, mapa se přiblíží a políčko posune doprostřed. Když hráč nemá zvolený plán, vede ho Sova podle plánu stavitele. Povídání o objevech, jednotkách a budovách už samo nevyskakuje, Sova ho nabídne tlačítkem v bublině. Bublinu jde na jeden tah schovat.

Zkoušel jsem to automatem, který 30 tahů klikal jen tam, kam Sova ukázala. Nikde se nezasekl, založil tři města, postavil cestu a zavlažování a ve 30. tahu měl rozjetý výzkum.

## 16. 11. 2026: Jednotky chodí rovně a je vidět, kam jdou

Michal si všiml, že jednotka na cestě k cíli málokdy jde rovně. Hledání cesty mělo dvě chyby. Mezi stejně dlouhými cestami vybíralo tu, která vedla po políčkách s nejmenším číslem, tedy nahoru a doleva. A les nebo kopec počítalo jako dvojnásobnou cestu, i když pomalá jednotka s jedním pohybem do nich vstoupí za jeden tah stejně jako na louku, takže zbytečně obcházela. Teď krok nikdy nestojí víc než celý tah jednotky a mezi stejně dlouhými cestami vyhraje ta nejblíž přímce k cíli. Platí to pro hráče i pro soupeře.

Každá vlastní jednotka na cestě má na mapě slabou modrou přerušovanou čáru až k cíli a na konci praporek. Vybraná jednotka má cestu jako dřív žlutou s tečkami, kde skončí každý tah. Když se jednotky pohnou, ať hráčovy, nebo soupeřů po konci tahu, na mapě se plynule přesunou z políčka na políčko a nepřeskočí. Kdo má v systému zapnuté omezení pohybu, animaci neuvidí.

## 16. 11. 2026: Soupeři zakládají města u jídla a dělníci zavlažují hladová města

Soupeř teď při výběru místa pro město počítá, kolik políček v okolí může dát dvě jídla, když je zavlaží. Za každé, které chybí do šesti, dá místu tři body dolů. Zkusili jsme taky přecenit jídlo u každého políčka, ale soupeři pak přestali osidlovat ostrovy, protože jim na pevnině vycházelo víc slabých míst. Tuhle cestu jsme proto zahodili.

Automatický osadník teď u města, které přestalo růst, cení jídlo dvaapůlkrát víc než jinde. Takové město proto dostane zavlažování dřív než důl. Platí to i pro hráčovy osadníky na automatické práci. Tempo podle měřicího skriptu se nezhoršilo, hráč měl ve 120. tahu 61 obyvatel místo 59.

Na 50 automatických partiích měl soupeř ve 120. tahu v mediánu 7 měst a 68 objevů. Jeho města měla průměrně 4,9 obyvatele místo 3,8 před fází 4. Obyvatel má soupeř zhruba stejně jako dřív, jen v menším počtu větších měst, a bádá rychleji. S jedním městem uvízli 3 hráči z 200. Vesmírnou lodí vyhrál soupeř v 10 partiích z 50.

## 16. 11. 2026: Fáze 4, první kroky: rychlost, Safari a soupeři, kteří rostou

Rychlost je v pořádku. Ve 100. tahu trvají tahy tří soupeřů v Node 60 až 90 milisekund. V prohlížeči trvá konec tahu i s překreslením 100 až 190 milisekund a posun mapy běží 60 snímků za sekundu. Cíl dvě sekundy hra splňuje s velkou rezervou, a to jsme měřili na pomalejším stroji, než je Mac M1.

Safari tady spustit nejde a WebKit se do pracovního prostředí stáhnout nepodařilo. Prošel jsem proto kód a doplnil dvě věci, které starší Safari neumí: kreslení zaoblených obdélníků na plátno (Safari ho umí až od verze 16) a rozmazané pozadí oken, které Safari do verze 18 potřebuje pod předponou. Vyzkoušet hru v Safari musí Michal.

Při hledání hráčů, kteří uvíznou s jedním městem, se ukázalo, že 35 % startů leželo na lese, bažině nebo džungli. Město na takovém políčku má ze středu jen jedno jídlo a skoro neroste. Starty teď leží jen tam, kde střed města uživí. Týká se to i hráče. Soupeři stejně tak nezakládají města na místech, kde by střed dával méně než dvě jídla. Osadníka staví jen město, které má jídlo navíc, protože osadník jí ze svého domovského města každý tah. Dělník potřebuje jídlo navíc i po svém narození, zakladatel smí vzít to poslední, protože brzy odejde. Soupeři navíc staví divy v nejproduktivnějším městě. Dřív kromě programu Apollo nepostavili žádný, teď zhruba jeden div na partii. Projekt Manhattan staví jen válečník.

Na 50 automatických partiích měla města soupeřů ve 120. tahu průměrně 4,6 obyvatele místo 3,8. Soupeř měl v mediánu 8 měst místo 9 a 66 objevů místo 62. S jedním městem uvízlo 5 hráčů z 200, stejně jako dřív. Vesmírnou lodí vyhrál soupeř v 15 partiích z 50, dřív zhruba v osmi procentech partií. Jestli je to moc, ukáže Michalova partie.

## 16. 11. 2026: Fáze 4 dotáhne první verzi

Michal schválil obsah fáze 4. Nepřidává nové funkce, má z hry udělat partii na jeden večer bez zádrhelů pro Michala i pro syna. Kroky jdou v tomhle pořadí:

1. Opravit, co Michal najde ve zkušební partii na normální obtížnost. Ta je zároveň poslední podmínkou brány fáze 3 a má přednost před vším ostatním.
2. Změřit a zrychlit pozdní hru. Konec tahu ve 100. tahu má na Macu M1 trvat nejvýš dvě sekundy.
3. Ověřit hru v Safari: ukládání, okna, myš, trackpad a obrázky.
4. Doladit soupeře podle automatických partií a Michalovy hry: hráče, kteří uvíznou s jedním městem, hledání nepřítele za mořem, projekt Manhattan a obtížnost.
5. Dát hru synovi. Zahraje si se Sovou na velmi snadnou obtížnost a vybere jí jméno. Jména jednotek a divů, která vymyslí, dostane jako vlastní národ vedle skutečných, aby se nepřepisovala encyklopedie.
6. Doladit grafiku mapy, ke které jsme se po fázi 0 chtěli vrátit.

Fáze projde, když Michal i syn dohrají každý jednu partii bez chyby, která by hru zastavila, Michalova partie se vejde do 45 až 60 minut, konec tahu ve 100. tahu trvá do dvou sekund a stovky automatických partií proběhnou bez chyby.

## 16. 11. 2026: Automatické partie pro bránu fáze 3

Pro bránu fáze 3 odehrála AI 600 partií bez chyby. Na 300 partiích standardního světa měl soupeř ve 120. tahu v mediánu 9 měst, desetina soupeřů 3 až 4 města a nejlepší desetina 15 až 16. Jen s jedním městem zůstalo po 60. tahu 36 z 1200 hráčů, tedy 3 %, a 15 hráčů prohrálo úplně. Válka byla v 297 partiích a první začala v mediánu ve 54. tahu. Do měst útočili soupeři ve dvou třetinách případů ve skupině aspoň tří vojáků. Vesmírnou lodí vyhrál soupeř ve 24 partiích, ostatní rozhodlo skóre. Barbaři dobyli 235 měst a soupeři z nich 103 vzali zpátky.

Na 100 partiích světa s ostrovy stálo na ostrovech v průměru přes dvě města na partii a za mořem dobyl soupeř město jen jednou. Na 100 partiích normální obtížnosti vyhrálo místo, které hraje jako člověk, 23 partií, což odpovídá férovému podílu jedné čtvrtiny. Na těžké vyhrálo 12 partií a mělo v mediánu 60 % skóre nejlepšího soupeře místo 72 až 79 %. Rozdíl mezi normální a těžkou obtížností je tedy na větším vzorku jasně vidět, dřívější měření na 20 partiích bylo jen šum.

## 16. 11. 2026: Soupeři používají jadernou raketu volně

Claude navrhl raketu jen jako odvetu, Michal chtěl, aby ji AI používala volně. Za války si soupeř postaví jednu raketu v nejproduktivnějším městě, jakmile někdo dokončí projekt Manhattan a soupeř zná raketovou techniku. Raketa čeká ve městě nejblíž nepříteli. Odpálí ji na město, na které jde jeho armáda, když v něm vidí obránce, nebo na nepřátelské město, kde výbuch vezme aspoň osm bodů: každý obyvatel, o kterého město přijde, je bod a každý zničený voják dva. Nikdy nestřílí tam, kde by výbuch zasáhl jeho vlastní město nebo jednotky, na národ, se kterým má mír, ani na město, o kterém ví, že ho chrání protiraketový štít. Štít vidí jen s velvyslanectvím, stejně jako hráč. Jakmile někdo dokončí projekt Manhattan, staví soupeř štít ve dvou největších městech od velikosti 6.

V automatických partiích zatím jadernou raketu nikdo neodpálil, protože soupeři projekt Manhattan sami nestaví. Raketu tedy uvidíš hlavně tehdy, když projekt postavíš ty.

## 16. 11. 2026: Soupeři létají s bombardéry a stíhačkami

Michal schválil letadla bez letadlových lodí. Bombardéry staví soupeř z rozpočtu armády, jeden místo každého čtvrtého útočníka, takže letectvo nebere štíty jiným stavbám. První pokus se samostatným rozpočtem pro letadla stál soupeře výrazně víc výher vesmírnou lodí. Bombardér letí jen na cíl, ze kterého se ještě týž tah vrátí do města: na nepřátelské jednotky v poli, které soupeř vidí, a na obránce města, na které jde jeho armáda. Zaútočí, když má šanci aspoň 65 %. Stíhačky staví soupeř až ve chvíli, kdy uvidí nepřátelské letadlo. Čekají ve městě nejblíž nepříteli a sestřelují letadla v dosahu.

Na 50 automatických partiích postavili soupeři 8 letadel a zaútočili s nimi desetkrát. Žádné letadlo nespadlo pro nedostatek paliva. Letadla přicházejí až v posledních třiceti tazích a soupeři je moc nestaví, protože v té době míří k vesmírné lodi. Na stejných 50 partiích vyhrál soupeř vesmírnou lodí pětkrát, před diplomatem, loděmi a letadly devětkrát. Rozdíl může být i náhoda, ale budeme ho hlídat.

## 16. 11. 2026: Soupeři mají válečné lodě a umějí se vylodit

Claude navrhl válečné lodě bez výsadků, Michal chtěl i výsadky. Za války si soupeř staví v přímořských městech pár válečných lodí, nejvýš tři. Válečná loď je loď s útokem, která neveze vojáky, tedy od pancéřové lodi dál. Útočí na nepřátelské lodě a jednotky u pobřeží, když má šanci na výhru aspoň 60 %. Pluje k pobřežnímu městu, o které se válčí, nebo k nejbližší nepřátelské lodi a město ostřeluje, když má šanci aspoň 50 %. Zraněná loď se vrací do přístavu a v míru tam čeká.

Když soupeř nemá žádné nepřátelské město, ke kterému by armáda došla pěšky, vybere pobřežní město za mořem. Armáda se shromáždí ve vlastním přístavu, odkud je to lodí nejblíž, a ten přístav postaví loď pro vojáky. Jakmile je vojáků dost nebo jsou jasně silnější než obrana města, nalodí se, loď je doveze k volnému políčku vedle cílového města a vojáci vystoupí. Odtud útočí, a když je město prázdné, vejdou do něj. Válku přes moře soupeř zvažuje i sám, jen s menší chutí než válku po souši.

Test s dvěma ostrovy ukazuje, že soupeř nepřátelské město za mořem během tří tahů dobude. V automatických partiích se zatím skoro neprojeví. Na standardním světě s jedním kontinentem výsadek potřeba není a na světě s ostrovy soupeři většinou nepřátelská města za mořem neznají, takže je nemají kam poslat. Válečných lodí postavili na 20 partiích jen 3 až 5, protože přímořská města soupeřů jsou malá a staví hlavně obránce.

## 16. 11. 2026: Diplomat AI podplácí a sabotuje

Michal schválil, aby diplomat AI uměl totéž co hráčův. Soupeř teď podplácí malá města do velikosti 4 u nepřítele, se kterým válčí, a u barbarů. Město musí ležet nejvýš osm políček od jeho vlastního města a hlavní město podplatit nejde. Cenu odhaduje stejným vzorcem jako hra, z toho, co ví: zlato majitele zná jen s velvyslanectvím, vzdálenost k hlavnímu městu jen když ho viděl, a obránce jen když na město dohlédne. Přesnou cenu uvidí, až diplomat stojí vedle města, stejně jako hráč na tlačítku diplomata. Na úplatek do 300 zlatých si soupeř šetří a nekupuje za ně budovy. Když je cena nakonec moc vysoká, diplomat ve městě ukradne objev nebo ho sabotuje. Sabotovat chodí ve válce města, která staví div nebo vesmírnou loď. To ale ví jen s velvyslanectvím, protože výrobu cizích měst bez něj nevidí ani hráč.

Na 20 automatických partiích podplatili soupeři 5 měst, z toho 3 barbarská, a barbaři na konci drželi 2 města místo 7. Sabotáž byla jen výjimečně, protože soupeř zřídka ví, že nepřítel staví div.

## 16. 11. 2026: Soupeři berou barbarům města zpátky

Na nastavení málo vzali soupeři barbarům zpátky jen jedno město ze třinácti. Rozbor ukázal tři chyby v armádě. Děla a katapulty zůstávaly ve městech jako posádka, takže armáda nikdy nebyla pohromadě. Armáda čekala na tři jednotky i proti jednomu barbarovi. A soupeř hádal obranu města podle jeho velikosti, i když na posádku viděl. Teď drží města nejdřív obránci, obléhací jednotky ve válce posádku nedělají a menší skupina zaútočí, když je aspoň dvakrát silnější než obrana. Město, na které soupeř vidí, posuzuje podle jednotek, které v něm opravdu stojí. Barbarské město do šesti políček od vlastního města je pro armádu první cíl, i když soupeř zrovna válčí jinde.

Na 50 automatických partiích dobyli barbaři 38 měst a soupeři z nich 18 vzali zpátky. Oprava zlepšila armádu i ve válkách mezi národy. Na 20 partiích dobyli soupeři před opravou 32 měst, po ní 67. Silnější armáda i vesmírné lodě změnily měření obtížnosti. Místo, které hraje jako člověk, vyhrálo na normální obtížnosti 5 z 20 partií a mělo v mediánu 72 % skóre nejlepšího soupeře, na těžké vyhrálo 3 partie a mělo 70 %. Rozdíl mezi úrovněmi je teď vidět spíš na výhrách než na skóre a přeměříme ho, až AI dostane lodě a letadla.

## 16. 11. 2026: Soupeři staví vesmírnou loď a někdy s ní vyhrají

Žádný soupeř dřív neodstartoval, protože program Apollo stavělo jedno město s pár štíty a zbytek říše dělal jiné věci. Teď soupeři po svém seznamu objevů míří na železnici, vesmírné lety, plasty a robotiku. Apollo staví nejproduktivnější město a ostatní města mu posílají karavany, které soupeř dokupuje za zlato. Díly lodi staví pět nejproduktivnějších měst a každé vezme jiný díl, takže loď má brzy motor i modul. Za zlato soupeř kupuje nejdřív ten díl, který lodi chybí nejvíc. Když zná všechny objevy pro loď, sníží vědu na minimum a daněmi platí díly. Města pro vesmírný program přepne na správce s cílem výroba.

Okno každého vlastního města ukazuje, kolik štítů dává, a teď to ví i AI. Města, která už nemůžou růst, protože jim chybí akvadukt, obsazují políčka se štíty místo políček s jídlem navíc, které by propadlo. Tohle platí i pro hráčova města bez ručního výběru. Tempo hráče se tím podle měřicího skriptu nezměnilo.

Na 50 automatických partiích odstartovalo 48 lodí a soupeř vyhrál vesmírnou lodí v 9 partiích, ve zbylých 41 rozhodlo skóre.

## 16. 11. 2026: Závěrečná obrazovka hodnotí partii

Když někdo vyhraje nebo hráč přijde o poslední město, otevře se závěrečné okno. Ukáže, kdo a jak vyhrál, graf skóre, počtu měst a objevů všech národů po tazích a tabulku s pořadím. Pod ní hodnotí hráčovu hru. Dá mu titul podle skóre proti nejlepšímu soupeři, od náčelníka kmene po vládce, na kterého se nezapomene, a výhra je vždycky aspoň moudrý vládce. Napíše, v čem byl nejlepší a kde nejvíc ztrácel, a přidá pár čísel: založená a dobytá města, nejvyšší skóre a tah, kdy se hráč poprvé dostal do čela. Odtud jde hrát dál, nebo začít novou hru. Hra si kvůli tomu na konci každého tahu zapisuje skóre, města a objevy všech národů. Uložené hry z dřívějška graf mají až od dalšího tahu.

Stejné okno otevře během hry Žebříček v menu. Ukazuje jen národy, které hráč zná.

## 16. 11. 2026: Klik na cizí město ukáže, co o něm víš

Okno cizího města ukáže národ a vládce, velikost města, jestli je hlavní, hradby a další opevnění, divy a obránce, pokud město právě vidíš. S velvyslanectvím u toho národa ukáže i to, co město staví, a ostatní budovy. Má tlačítka na historii města, okno Národy a poslání vybrané jednotky k městu. Otevře se klikem na cizí město, které nesousedí s vybranou jednotkou. Klik na sousední město dál znamená útok.

Kvůli tomu dostává AI o cizích městech stejně informací jako hráč. Dřív viděla všechny jejich budovy i výrobu, teď bez velvyslanectví jen to, co je vidět zvenku.

## 16. 11. 2026: Válka jde ukončit mírem, který platí 15 tahů

Tímhle je hotový krok 4 fáze 3. Tlačítko Národy nahoře otevře okno se všemi národy, které hráč zná. U každého ukazuje, jestli s ním válčí nebo má mír a od kterého tahu, jakou má soupeř povahu, jeho skóre a jestli chce mír. Odtud jde nabídnout mír nebo vyhlásit válku. Válku je potřeba potvrdit druhým klikem. Když soupeř nabídne mír hráči, hra se na začátku tahu zeptá oknem s portrétem vládce a hráč nabídku přijme nebo odmítne. Nabídka platí do konce tahu toho, komu přišla.

Mír platí aspoň 15 tahů. Kdo vyhlásí válku dřív, poruší smlouvu a ostatní národy si to pamatují. Okno útoku na to hráče upozorní, než útok potvrdí. S barbary mír uzavřít nejde. Velká čínská zeď a Organizace spojených národů teď opravdu působí. Soupeři jejich majiteli mír nabízejí častěji a jeho nabídky snáz přijmou.

Soupeři rozhodují o míru podle nálady, kterou skládají z jednotlivých důvodů podobně jako Unciv. Mír chtějí víc, čím déle válka trvá, když jsou slabší než obrana nepřátelských měst nebo když mají nepřátelské vojáky u svých měst. Vědci chtějí mír snáz, válečníci hůř. Válku chtějí dál, když mají jasnou převahu, když nepřítel už porušil smlouvu nebo jim víckrát vyhlásil válku. Nabízejí mír nejdřív po šesti tazích války a pak nejvýš jednou za šest tahů. Na 40 automatických partiích padlo 445 nabídek a 134 skončilo mírem. Válka trvala v mediánu 18 tahů a žádný soupeř smlouvu neporušil.

Soupeři navíc posílají karavany pomáhat stavět divy a zakládat obchodní cesty a diplomaty zakládat velvyslanectví, ve válce i krást objevy.

## 16. 11. 2026: Soupeři bádají rychleji a staví vesmírnou loď

Michal si všiml, že AI bádá pomaleji, než by mohla. Rozbor ukázal čtyři příčiny. Soupeři zůstávali celou hru v monarchii, nechávali vědu na výchozím poměru, v republice je dusila údržba starých jednotek a nikdy si nic nekoupili. Teď soupeři přejdou z monarchie do republiky od 80. tahu, nebo dřív, když už nemají kde zakládat města. Válečník ve válce v monarchii zůstane. Posuvník vědy nastavují podle příjmu a nechávají si rezervu 50 zlatých. Zastaralé obránce za zlato povýší, a když na to nemají, propustí ty, bez kterých se město ubrání. Zbylé zlato nad rezervu dají do dokoupení budov.

Soupeř měl ve 120. tahu v mediánu 63 až 66 objevů místo 55. Na konci partie zbylo ve stromu dost objevů na vesmírnou loď, a tak jsme ji zlevnili. Projekt Apollo stojí 180 štítů, součástka 60, modul 90 a let trvá základně 12 tahů. Soupeři Apollo staví v největším městě a pak loď v pořadí, které nejdřív dá dohromady nejmenší loď schopnou letu. Odstartují, když je loď hotová nebo když by jinak nestihla doletět. Výroba soupeřů je ale pořád nízká a v automatických partiích zatím žádný neodstartoval. Plán Vědce u Sovy jsme posunuli: školy do 60. tahu, věda do 85., Apollo do 100. a start do 110. tahu.

## 16. 11. 2026: Barbaři na nastavení málo jsou slabší

Michal napsal, že barbaři jsou silní i na nastavení málo. Při nastavení málo se teď objeví až od 50. tahu, je jich najednou nejvýš 4 a chodí po dvou. Útočí, až když mají šanci na výhru aspoň 55 %. Dobyté město nic nestaví, takže ho jde snadno vzít zpátky. Jednotky odpovídají éře, do které došla aspoň polovina národů, dřív stačil jeden nejpokročilejší národ. Z ruin vylezou barbaři až od 30. tahu. Nastavení hodně zůstalo jako dřív.

Na 40 automatických partiích dobyli barbaři zhruba 0,6 města na partii, předtím 1,5. Zpátky je soupeři pořád berou málokdy.

## 16. 11. 2026: Skok mezi normální a těžkou obtížností je menší

Michal chtěl menší skok mezi normální a těžkou úrovní. Na těžké mají města soupeřů o 20 % víc jídla a štítů, na velmi těžké o 45 % víc a osadníka navíc. Při nových pravidlech pro výzkum a barbary vyšly úrovně na 20 partiích takhle (medián skóre místa, které hraje jako člověk, v procentech skóre nejlepšího soupeře): velmi snadná 112, snadná 112, normální 95, těžká 72, velmi těžká 59. Velmi snadná a snadná se podle skóre neliší. Na velmi snadné soupeři hlavně nezačínají války, a to skóre neukáže.

## 16. 11. 2026: Pět úrovní obtížnosti

Michal chtěl aspoň tři úrovně. Claude navrhl čtyři, Michal vybral pět. Obtížnost se volí v okně nové hry vedle barbarů a výchozí je normální. Podle zadání určuje na lehčích úrovních obtížnost to, jak dobře soupeři rozhodují, a na těžších dostanou soupeři bonusy. Hráč ani barbaři bonusy nikdy nedostanou. Všechna čísla jsou v datech pravidel.

Na velmi snadné úrovni soupeři nikdy sami nezačnou válku, založí nejvýš 4 města, útočí jen se šancí o 25 procentních bodů vyšší než obvykle a drží poloviční armádu. Na snadné válčí málokdy, založí nejvýš 6 měst, na útok chtějí o 15 bodů víc a armádu mají menší o 40 %. Normální úroveň je dnešní AI bez bonusů. Na těžké mají města soupeřů o 25 % víc jídla a štítů z políček. Na velmi těžké mají o 50 % víc a každý soupeř začíná s osadníkem navíc.

Úrovně jsme změřili na automatických partiích, kde jedno místo hraje AI s normálním rozhodováním a bez bonusů, tedy jako člověk. Na 20 partiích pro každou úroveň mělo toto místo na konci v mediánu tolik procent skóre nejlepšího soupeře: velmi snadná 129, snadná 114, normální 93, těžká 57, velmi těžká 41. Vyhrálo 15, 12, 9, 1 a 0 partií z dvaceti.

## 16. 11. 2026: Průvodkyně Sova pro děti a výhra dobytím a skóre

Michal chtěl dětského průvodce, který radí, vypráví o národu, objevech a jednotkách a hlavně pomáhá vyhrát. Rozhodli jsme tři věci. Průvodce je postava s kartami, kterou hráč zapne v menu místo rádce. Je to moudrá sova, jméno jí vybere syn a do té doby se jmenuje Sova. Plán na výhru potřeboval něco, co měří, a tak jsme z kroku 5 předběhli skóre a výhru dobytím.

Skóre dává bod za každého obyvatele, další bod za každého šťastného, dva body za objev, dvacet za div a sto za vesmírnou loď, která přistála. Čísla jsou v datech pravidel. Kdo porazí všechny ostatní národy, vyhraje dobytím, barbaři se nepočítají. Když po 120. tahu nikdo nevyhrál, vyhraje národ s nejvyšším skóre. Skóre národů, které hráč zná, ukazuje žebříček v menu. Na 10 automatických partiích skončily všechny výhrou na skóre. Závěrečná obrazovka a hodnocení hry zůstávají v kroku 5.

Sova sedí na místě rádce. Na začátku hry se představí, poví něco o hráčově národu a vládci a zeptá se, jak chce dítě vyhrát: jako Dobyvatel, Vědec, nebo Budovatel. Ke každé cestě má plán s pěti etapami. Každá etapa má cílový tah a dva až tři úkoly, třeba mít do 35. tahu čtyři města a znát zpracování bronzu. Plány jsou v datech a sova je čte jen z toho, co hráč vidí na obrazovce. Úkoly se v jejím okně odškrtávají a sova hlídá tempo. Když etapa nestíhá, řekne, kolik tahů zbývá a co udělat. Splněnou etapu pochválí a představí další. Pod plánem ukazuje dvě nejdůležitější rady rádce. Výzkum doporučí podle plánu.

Ve chvílích, kdy se ve hře objeví něco nového, ukáže sova kartu s obrázkem z encyklopedie, dvěma větami příběhu a zajímavostí. Pod tím vysvětlí, co to znamená pro hru. Karta přijde po každém novém objevu, u první jednotky a první budovy každého druhu, u vlastního divu a když hráč potká nový národ. U souseda sova poradí podle jeho povahy. Varovná karta přijde, když hráč přijde o město nebo když se u jeho města objeví barbaři. V menu jde vyprávění ztlumit na to důležité a sově změnit jméno.

Sova má tři malované portréty od Gemini podle toho, jestli radí, chválí, nebo varuje. Zadání jsou v tools/mac/sova.tsv a Michal je spustil příkazem bash sova.sh. Kdyby obrázek chyběl, nakreslí sovu kód.

## 16. 11. 2026: Ruiny a barbaři podle Civilizace 2

Michal vybral barbary podle Civilizace 2. V okně nové hry si hráč nastaví žádné, málo, nebo hodně barbarů, výchozí je málo. Barbaři hrají jako zvláštní hráč na konci pořadí a válčí se všemi od začátku hry. Nepotkávají se s ostatními a mír s nimi uzavřít nepůjde. Při nastavení málo se začnou objevovat od 45. tahu, při nastavení hodně od 25. tahu. Každý svůj tah mají šanci, že se vzbouří v divočině nejméně šest políček od měst, nebo se vylodí na pobřeží dvě až tři políčka od pobřežního města. Skupina má dvě až čtyři jednotky podle nastavení a jednotky odpovídají nejpokročilejšímu národu, od válečníků a jezdců po tanky. Barbarů je najednou nejvýš 6, nebo 18 při nastavení hodně. Barbaři táhnou na nejbližší město, na které dojdou pěšky, a útočí už se šancí 35 %. Dobyté město si nechají, jedna jednotka v něm zůstane a město staví útočníky. Soupeři vyrazí dobýt barbarské město zpátky, když leží do deseti políček od jejich měst, a pošlou na to menší armádu než do války.

Na mapě leží ruiny, jedna na 28 políček pevniny, nejméně tři políčka od startů a nikdy na polárním ledu. První pozemní jednotka, která do ruin vstoupí, najde zlato (25 až 100), objev, žoldnéře, kočovníky, kteří se přidají jako osadníci, barbary, nebo nic. Barbaři z ruin vylezou až od 15. tahu, jen ve hře s barbary a nikdy blíž než tři políčka od města. Kočovníci se objevují jen do 60. tahu. Soupeři posílají svého průzkumníka k ruinám, o kterých vědí, a rádce na blízké ruiny upozorní hráče.

Na 40 automatických partiích s barbary nastavenými na málo dobyli barbaři 60 měst a soupeři z nich 17 vzali zpátky, na konci partie drželi barbaři zhruba jedno město na partii. Soupeř měl ve 120. tahu medián 9 měst a 55 objevů, bez barbarů 10 měst a 57 objevů. Uložené hry z dřívějška žádné barbary ani ruiny nemají.

## 16. 11. 2026: Správce města, rádce, který vysvětluje, a detail stavby

Ve městě jde zapnout správce s cílem rovnováha, růst, výroba, věda, zlato nebo obrana. Správce obsadí políčka podle cíle. Když město dostaví stavbu a v plánu nic nemá, vybere další. Nejdřív zajistí obránce, při nepokojích chrám a pak spočítá, co která budova městu přidá, a vybere tu, která na jeden štít přinese nejvíc. Nestaví budovy, jejichž údržbu by pokladna neutáhla, a divy nechává na hráči. Když nic stavět nestojí za to, postaví druhého obránce a potom vydělává zlato. Plán města i políčka vybraná ručně mají přednost. Soupeři správce nepotřebují, svá města řídí sami stejnými příkazy. Váhy cílů jsou v datech pravidel.

Rádce teď u každé rady píše, co udělat a proč. Nově radí, který objev zkoumat a co odemkne, varuje před nepřáteli u města, ukáže snadný útok a nehájené nepřátelské město, pošle zraněnou jednotku léčit, upozorní na město, které po růstu začne bouřit, doporučí monarchii, průzkum, blízké ruiny a div pro největší město. Ukazuje tři nejdůležitější rady a tlačítkem jde zobrazit všechny.

Otazník u jednotky nebo budovy ve výběru výroby otevře přímo ve městě kartu s obrázkem, začátkem příběhu z encyklopedie a čísly. U jednotky říká, na co se hodí, u budovy spočítá, co by tomuhle městu přidala hned teď. Z karty jde stavbu rovnou zadat, přidat do plánu nebo otevřít celou stránku encyklopedie. Výběr jazyka v menu i na úvodní obrazovce mají vlajky kreslené kódem.

## 16. 11. 2026: Fáze 3, krok 3: soupeři vyhlašují válku a útočí ve skupině

Národy se poznají, když jejich jednotky nebo města přijdou na dohled, a pak spolu žijí v míru. Útočit a dobývat města jde jen ve válce a válku může vyhlásit jen národ, který toho druhého zná. Když hráč pošle jednotku na národ, se kterým žije v míru, hra se zeptá, jestli mu chce vyhlásit válku. Hráč se dozví i o válkách mezi soupeři, pokud zná obě strany. Bublina nad cizí jednotkou ukazuje národ, jestli s ním hráč válčí, a životy jednotek na políčku. Uložené hry z dřívějška fungují, všechny národy v nich začínají v míru a bez kontaktu.

O válce AI rozhoduje podle pojmenovaných důvodů, jak to dělá Unciv. Každý důvod přidá nebo ubere body a válku vyhlásí, když součet vyjde kladný. Válečník k ní má blíž, vědec daleko. Před 30. tahem AI nevyhlásí válku nikomu. Nevyhlásí ji ani tehdy, když nemá na dosah žádné cizí město nebo má méně než tři útočné jednotky. Hlavní váhu má poměr sil obou armád. Body přidá nedostatek místa k rozšíření a uberou vzdálenost a každá válka, kterou už AI vede. Dokud jednu válku vede, další nevyhlásí.

Ve válce si AI vybere nepřátelské město nejblíž svému hlavnímu městu a postaví na ně armádu podle počtu svých měst. Útočné jednotky se nejdřív shromáždí na políčku před cílem a vyrazí, až jich je dost. Zaútočí jen tehdy, když má šanci na výhru aspoň 60 %, válečník už od 50 %. Šanci počítá stejná funkce, kterou vidí hráč v okně před útokem, jen z toho, co AI opravdu vidí. Zraněné jednotky se vracejí do nejbližšího města léčit. Obránci ve městě vyrazí na sousední políčko, jen když je šance aspoň 75 % a ve městě zůstane druhý obránce.

Na 40 partiích standardního světa došlo k válce ve 39 z nich, první válka přišla v mediánu v 64. tahu. Odehrálo se 1102 bojů, útočník vyhrál 94 % z nich, protože AI útočí jen s dobrou šancí. Soupeři dobyli 54 měst a 19 jich zaniklo, dva hráči prohráli. Na 8 partiích světa s ostrovy válčili soupeři ve všech a dobyli 19 měst. Mír zatím uzavřít nejde, válka trvá do konce partie. Mír a nabídky míru přijdou v dalším kroku.

## 16. 11. 2026: Fáze 3, krok 2: soupeři zakládají města, stavějí a bádají

AI je ve složce src/ai a vidí jen PlayerView, stejně jako člověk na jejím místě. Hraje stejnými příkazy jako člověk. Každý tah projde ve třech kolech, aby další krok viděl výsledek předchozího, třeba nové město hned dostane výrobu.

Místo pro město AI vybírá podle poznámek z Unciv a Freeciv. Sečte hodnotu 21 políček, která by město obdělávalo, s váhou podle vzdálenosti od středu. Přidá body za řeku, kopec a pobřeží a neprozkoumaná políčka počítá jako průměr těch, která zná. Nejraději staví čtyři až pět políček od vlastních měst, cizím městům se vyhýbá. Místa, ke kterým už jde jiný osadník, jsou zabraná, a každé políčko cesty sníží hodnotu, aby osadníci nebloudili daleko. Když na vlastní pevnině dojde místo, postaví AI triéru, která podél pobřeží hledá ostrovy a vozí na ně osadníky. Triéra pluje jen po vodě u pobřeží, aby se nepotopila. Osadníci, pro které už není místo, zvelebují krajinu stejnou automatikou, jakou má hráč.

Ve městech má přednost obrana: jeden voják, v hlavním městě, velkých městech a městech s nepřítelem nablízku víc. Hlavní město pošle na začátku jednoho válečníka na průzkum. Osadníky staví města od velikosti 2, najednou nejvýš dva, rozpínavý národ tři, dokud je kam stavět. Na každá dvě města připadá jeden osadník na práci v krajině. Budovy AI vybírá podle hodnoty a ceny, vědec dává přednost knihovnám a univerzitám, válečník hradbám a kasárnám. Div staví jen největší město říše, která má aspoň čtyři města. Výzkum jde podle pořadí cílů pro každou povahu a monarchii AI zavede, jakmile ji zná. Poměr vědy a daní nechává na výchozí hodnotě, protože pokus o víc vědy skončil v automatických partiích hůř.

Nový nástroj npm run ai-games odehraje partie, ve kterých hrají jen počítačoví hráči. Na 40 partiích standardního světa má soupeř ve 40. tahu medián 4 města, v 80. tahu 8 a ve 120. tahu 10 měst a 55 technologií. Na světě s ostrovy založili soupeři na 8 partiích 42 měst na ostrovech. Zhruba jeden hráč ze 160 zůstane po 60. tahu s jedním městem, protože ho sousedé obklopí. Válčit soupeři zatím neumějí.

## 16. 11. 2026: Fáze 3, krok 1: boj, dobývání měst a soupeři, kteří se brání

Boj běží podle Civilizace 2. Jednotky mají životy a palebnou sílu z Civilizace 2, uložené v datech jednotek. Obraně pomáhá terén podle Civilizace 2 (kopce +100 %, hory +200 %, les, džungle, bažina a řeka +25 %), opevnění a pobyt ve městě +50 %, pevnost +100 %, hradby +200 % proti pozemním jednotkám a pobřežní pevnost +100 % proti lodím. Veterán je o 50 % silnější, vítěz se veteránem stane se šancí 50 % a kasárna cvičí veterány rovnou. Jednotka s méně než celým pohybem útočí slaběji. Pozemní jednotka útočí jen na souši a ne z lodi, loď na moři a na pobřeží, letadlo ve vzduchu dostihne jen jiné letadlo.

Před útokem se ukáže okno se silou obou stran, s tím, z čeho se skládá, a se šancí na výhru. Šanci počítá jedna funkce přesně, stejnou použije AI, a test na tisících bojů ověřuje, že sedí. Když obránce padne v otevřené krajině, padnou všechny jednotky na políčku, ve městě a pevnosti jen on. Zraněná jednotka, která celý tah stála, se vyléčí o 10 % v poli, o 25 % v pevnosti, o 33 % ve vlastním městě a úplně ve městě s kasárnami.

Do města bez obránců vejde vojenská pozemní jednotka a dobude ho. Město se zmenší o jednoho obyvatele, každá budova zanikne se šancí 34 %, divy zůstanou a palác zanikne. Vítěz získá část zlata podle velikosti města a jeden objev poraženého. Město velikosti 1 zanikne. Když padne hlavní město, vláda se zadarmo přestěhuje do největšího zbylého města, aby se říše nerozpadla. Kdo přijde o poslední město, prohrál a jeho zbylé jednotky zmizí.

Soupeři teď dostanou startovní jednotky a hrají první verzi AI. Zatím se jen brání: založí hlavní město, drží v něm dva obránce, stavějí hradby a další budovy. Nerozšiřují se a neútočí, to přijde v dalších krocích. Hráč vidí cizí jednotky jen tam, kam právě dohlédne. Záznam událostí ukazuje jen to, co se hráče týká, takže z tahů soupeřů se dozví o bojích, dobytých městech, divech a vesmírných lodích. Uložené hry z dřívějška soupeře bez jednotek mají, proto je potřeba začít novou hru.

## 16. 11. 2026: Boj má životy jako v Civilizaci 2

Claude navrhoval boj na kola bez trvalých zranění, Michal zvolil životy jako v Civilizaci 2. Boj běží v kolech. V každém kole vyhraje útočník s pravděpodobností útok / (útok + obrana) a poraženému ubude tolik životů, kolik má vítěz palebné síly. Boj končí, když jedné jednotce dojdou životy. Silnější jednotka tak vyhrává mnohem jistěji než v Civilizaci 1, třeba tank proti opevněnému kopiníkovi v kopcích asi v 96 % případů. Životy a palebnou sílu převezmeme z Civilizace 2 a budou v datech jednotek. Zraněná jednotka bojuje dál se zbytkem životů a léčí se, v poli pomalu, ve městě rychleji a s kasárnami do plného zdraví za tah. Šance na výhru před útokem počítá jedna funkce, která zná i zbývající životy obou jednotek, a stejnou funkci použije AI. AI se kvůli tomu musí naučit stáhnout zraněné jednotky k léčení.

## 16. 11. 2026: Fáze 3 přinese boj rovnou se soupeři, hra dvou lidí odpadá

Zadání počítalo s tím, že fáze 3 skončí hrou dvou lidí u jednoho počítače a pravidla boje vyzkoušíme na lidech dřív, než na ně postavíme AI. Claude to tak navrhl, ale Michal se rozhodl hru dvou lidí přeskočit a boj ladit rovnou proti počítačovým soupeřům.

Fáze 3 proto spojí boj a AI. Patří do ní boj včetně dobývání měst a šance na výhru ukázané před útokem, válka a mír, diplomat a karavana proti soupeři, vítězství a skóre, soupeři na mapě a počítačoví soupeři podle poznámek z Unciv a Freeciv: zakládání měst, výroba, výzkum, armáda, diplomacie a povahy. AI se musí naučit i osidlovat ostrovy lodí. Pravidla boje bez lidského soupeře ověříme testy a automatickými partiemi AI proti AI. Fáze projde, když Michal dohraje partii proti třem soupeřům na normální obtížnost a stovky partií AI proti AI ukážou, že se soupeři rozšiřují, válčí ve skupinách a nikde se nezaseknou.

## 16. 11. 2026: Při výběru národa jde číst o národu i vládci a města mají svou historii

Okno nové hry ukazuje vedle národů text z encyklopedie o vybraném národu i o jeho vládci s obrázky. Odkazy pod texty otevřou celé stránky v encyklopedii.

Všech 240 měst národů dostalo krátkou historii skutečného města podle Wikipedie, česky i anglicky. Ve městě ji ukáže tlačítko Historie města vedle jména a pod textem je odkaz na článek na Wikipedii. Odkaz vede přes vyhledávání, aby článek našel, i když se jeho název trochu liší. Dvě města se stejným jménem, egyptské a řecké Théby nebo aztécká a ruská Tula, mají každé svůj text a hra vybere ten podle národa, kterému město patří. Vymyšlená jména měst historii nemají a tlačítko se u nich neukáže.

## 16. 11. 2026: Soupeře hráč pozná až při průzkumu a delta má bažinatý vějíř

Úvodní hláška už nevyjmenuje národy, které na kontinentu žijí. Hráč je pozná, až na ně narazí. Michal chce, aby na to hráč přišel sám při hře.

Delta řeky se kreslí jako vějíř bažinaté země, který řeka vysune do moře. Řeka se v něm rozdělí na tři až pět ramen a každé rameno ústí na výběžku vějíře, mezi rameny se pobřeží vrací v zátokách. Okraj vějíře lemuje písek a kolem ústí je kalnější voda. Vějíř u břehu průhlední, takže navazuje na jakýkoli terén za ním.

Obrázky do pohledu na město se načítají hned po spuštění hry na pozadí. Kdo otevře město dřív, než jsou načtené, uvidí místo staré kreslené grafiky prázdnou krajinu s nápisem, že se obrázek načítá.

## 16. 11. 2026: Svět si hráč nastaví při založení hry

Michal chtěl vybírat parametry mapy podobně jako v jiných hrách a schválil návrh podle Civilizace 1 a 6. V okně nové hry je tlačítko Nastavit svět. Kdo ho nepoužije, hraje na stejné mapě jako dřív.

Nahoře se volí velikost světa a počet soupeřů. Malý svět má 34 × 24 políček a 2 soupeře, střední 40 × 28 a 3 soupeře, velký 50 × 34 a 4 soupeře. Počet soupeřů jde změnit od 1 do 3 na malém, do 4 na středním a do 5 na velkém světě. Malý svět měl být původně 32 × 22, jenže s nejvíc soupeři a málo pevninou se tam starty tlačily na 4 políčka od sebe, a tak jsme ho zvětšili. Tvar světa je kontinent, nebo kontinent s ostrovy. Ostrovy dostanou zhruba šestinu souše, leží v moři kolem kontinentu a od kontinentu je dělí aspoň jedno políčko moře. Všichni začínají na kontinentu a na ostrovy se dostanou jen lodí.

V dalším nastavení je množství pevniny (34, 42 nebo 50 % mapy), teplota, srážky, stáří světa a suroviny. Teplota posune hranici tundry a mění podíl pouští a džunglí. Srážky mění podíl pouští a plání proti lesům, bažinám a džunglím a počet řek. Mladý svět má víc hor a jedno pohoří navíc, starý víc kopců a o pohoří méně. Suroviny leží na 6, 10 nebo 15 % políček. Každou volbu jde nechat náhodě a náhodu určí kód mapy. Kód mapy nese nastavení v osmi číslicích za lomítkem, třeba „hora-1234/25120220“. Standardní svět má kód beze změny. Čísla jsou v souboru world.json.

Michal chtěl kontinent s ostrovy hned, i když jsme navrhovali počkat, až to zvládne AI. Ve fázi 3 se proto AI musí naučit dovézt osadníka lodí na ostrov a tam založit město. Dokud to neumí, ostrovy dávají hráči výhodu. Dva kontinenty a souostroví přidáme, až AI zvládne vylodit armádu. Tempo výzkumu automatického hráče je na všech třech velikostech skoro stejné.

## 16. 11. 2026: Řeky se u pramene ztrácejí a suroviny jsou nakreslené v krajině

Michal chtěl, aby se řeky u pramene zužovaly do ztracena, a nechal na Claudovi, jak nakreslit vzácné suroviny. Pravidla se nemění.

Šířka řeky roste s odmocninou množství vody, které jí protéká, a u pramene začíná skoro jako čára. Krajní potoky pramenného vějíře a boční přítoky se zužují až na vlásek. Tenké potoky postupně blednou a jejich tmavý břeh se zužuje spolu s nimi, takže se u konce ztratí v krajině. Delší přítok má cestou ještě jeden menší přítok. Tak to kreslí i fyzické mapy, kde je šířka čáry úměrná průtoku.

Suroviny už nejsou odznaky v rohu políčka. Nakreslili jsme je kódem přímo do krajiny: hejno ryb pod hladinou, pasoucí se koně, bažant na mýtině, jeleni v tundře, uhlí vylamující se ze svahu, zlatá žíla se zlatými valouny ve skále, drahokamy v džungli, oáza s jezírkem a palmami, tuleni na ledu, nařezaná rašelina a bujná louka s květy. Každé políčko obrázek trochu obmění, aby sousední suroviny nevypadaly jako razítko. Kdyby Michal chtěl malovanější vzhled, můžeme suroviny nechat namalovat od Gemini jako ostatní obrázky.

## 16. 11. 2026: Mapa vzniká podle přírody a kreslí se jako fyzická mapa

Michal schválil návrh realističtější mapy a chtěl hezčí řeky. Pravidla se nemění. Políčka zůstávají políčky Civilizace 1 a každý terén má zhruba stejný podíl země jako dřív, což hlídá kontrola na 500 mapách.

Generátor nejdřív udělá výšky. K šumu přidá dvě pohoří, která vedou po mírně zahnutých čarách přes různé části kontinentu. Hory leží na hřebenech a kopce v podhůří. Potom spočítá podnebí. Déšť přichází od západu a padá tam, kde země stoupá, takže za horami je sucho. Mezi tropy a chladným severem a jihem leží suchý pás. Podle toho vzniknou pouště, džungle v teplých vlhkých nížinách, bažiny ve vlhkých nížinách u moře a lesy tam, kde prší. Řeky tečou z podhůří dolů po svahu k moři a přítoky se spojují s hlavní řekou. Partie podle automatického hráče běží stejně rychle jako dřív.

Mapa se kreslí jako fyzická mapa. Terény do sebe plynule přecházejí a země má reliéf stínovaný od severozápadu. Hory a kopce už nemají nakreslené kopečky a štíty, poznají se podle reliéfu a nejvyšší hřebeny mají sníh. Svahy obrácené k severozápadu jsou světlé a ty za hřebenem ve stínu, aby hory vypadaly vyvýšené. Řeka se kreslí jako celá říční soustava. U pramene ji tvoří vějíř drobných potoků, které míří do nejbližších kopců a hor, cestou se do ní vlévají boční přítoky a velká řeka se u moře rozdělí do delty s několika rameny a písčinami. Malá řeka má u moře nálevkovité ústí. Od pramene k ústí se řeka rozšiřuje. Meandry dělá jedno společné hladké pole posunů, takže se přítok s řekou vždy potká. Potoky a přítoky jsou jen obrázek, pro pravidla je řekou dál jen políčko řeky. Při přiblížení nad 160 % se ukáže jemná mřížka políček.

## 15. 11. 2026: Doplnili jsme ekonomiku podle Civilizace 1

Prošli jsme pravidla Civilizace 1 a doplnili, co z ekonomiky jedné říše chybělo. Boj, skóre a soupeři zůstávají na fázi 3.

Obyvatelé jsou šťastní, spokojení, nebo nespokojení. Zábava nejdřív uklidní nespokojené a potom dělá spokojené šťastnými. Nepokoje počítáme mírněji než originál: vypuknou, když je nespokojených víc než spokojených a šťastných dohromady. Město s aspoň třemi obyvateli, kde nikdo není nespokojený a šťastných je aspoň tolik co spokojených, slaví. Za despocie pak nemá postih na políčkách, za monarchie a komunismu dostane obchod navíc a za republiky a demokracie roste každý tah, dokud má přebytek jídla. Oslava začne platit tah po tom, co se splní podmínky.

Obyvatel mimo pole je specialista. Bavič dá 2 body zábavy, výběrčí daní 2 zlata a vědec 2 body vědy. Výběrčí a vědce jde zvolit od velikosti 5 kliknutím na specialistu ve městě. Velká říše má méně spokojených: nad 6 měst je v každém městě o jednoho spokojeného méně a za každých dalších 6 měst zase o jednoho. Čísla jsme odhadli a doladíme je, až budou hrát soupeři.

Osadník umí měnit terén jako v Civilizaci 1. Zavlažováním udělá z lesa pláně a z džungle a bažiny louku, dolem z louky, plání, džungle a bažiny les. Automatický osadník mění terén jen tehdy, když políčko dá víc jídla. Osadník se může přidat k vlastnímu městu menšímu než 10 obyvatel, které ještě může růst.

Budovu jde ve městě prodat jednou za tah za tolik zlata, kolik stála štítů. Divy a palác prodat nejde. Demokracie může padnout do anarchie, když je některé město v nepokojích dva tahy po sobě, každý další tah s šancí 50 %. Po anarchii se vrátí demokracie. Pyramidy teď mění vládu hned bez anarchie a dovolí zvolit kteroukoli vládu.

Znečištění už nedělá obyvatele nespokojenými. Každý bod nad 20 dává 2 % šance, že město znečistí políčko v okolí. Znečištěné políčko dává polovinu, dokud ho osadník tři tahy nečistí. Když je na světě víc než 3 znečištěná políčka, plní se počítadlo oteplování a při plném počítadle se krajina změní. U moře vzniknou bažiny a džungle, ve vnitrozemí poušť. Jaderná elektrárna ve městě v nepokojích se může roztavit, dokud hráč nezná jadernou fúzi.

Katastrofy postihnou každý tah s šancí 4 % jedno město hráče, nejdřív od 20. tahu. Jsou to zemětřesení, požár, povodeň, hladomor, piráti, mor a sopka a před každou chrání budova podle Civilizace 1, kromě zemětřesení, před kterým nechrání nic. Hra hráči řekne i to, když ho budova ochránila. Na 120 automatických partiích zasáhnou hráče v mediánu dvě katastrofy za hru.

## 15. 11. 2026: Obchod se dělí na vědu, zábavu a daně a encyklopedie učí hrát

Michal chtěl rozdělovat peníze na vědu, daně a zábavu. Nahoře přibyl druhý posuvník Zábava a daně dostanou, co zbude. Jako v Civilizaci 1 platí limit vlády pro každou ze tří částí, za despocie tedy nejde dát víc než 60 % ani na vědu, ani na zábavu, ani na daně. Každé 2 body zábavy ve městě udělají z jednoho nespokojeného obyvatele spokojeného a tržiště zábavu zvětší. Za anarchie jde celý obchod na zábavu. Po revoluci zůstane zábava, jak ji hráč nastavil, a když by daně přetekly přes limit nové vlády, přidá se věda. Staré uložené hry si posuvníky upraví stejně.

Díly vesmírné lodi jde dát do plánu města opakovaně. Pořadí staveb v plánu se mění šipkami u každé stavby nebo přetažením myší. Seznam staveb ve městě po přidání do plánu zůstane tam, kde hráč byl. Zlato, které města vydělávají místo stavby, se teď počítá do příjmu nahoře i v přehledu měst.

Když hráč dostaví div světa, hra spustí ohňostroj a ukáže obrázek divu, co je zač a co hráči přinese. Odtud vede tlačítko do encyklopedie. Vesmírnou loď kreslí kód. Na rampě postupně roste podle postavených dílů, po startu letí mezi Zemí a cílovou hvězdou a po přistání stojí na cizí planetě s vlajkou hráče. Hradba ve městě obíhá obdélník kolem celé zástavby, takže zeď nedělá zbytečné zuby.

Encyklopedie má novou kapitolu Jak hrát s dvanácti stránkami o růstu, spokojenosti, výrobě, obchodu, výzkumu, vládách, divech, korupci a vítězství. Čísla v ní bere z pravidel, takže po změně pravidel nelžou. Každá stránka encyklopedie i technologie má druhý odstavec a tři zajímavosti, mezi kterými hráč přepíná tlačítkem Další zajímavost. První zajímavost se vybírá náhodně.

Prošli jsme češtinu a přejmenovali pár věcí. Masonry je Stavitelství, construction je Beton, šermíř je Legionář, obrněná loď je Pancéřová loď, Štěpení atomu je Štěpení jádra a technologie Jaderná elektrárna se jmenuje Jaderná energie, aby se nepletla s budovou. Opravili jsme i skloňování ve zprávách o městech.

## 15. 11. 2026: Hra mluví česky i anglicky a má přehled měst

Michal chtěl dvojjazyčnou hru, do které půjdou přidat další jazyky. Texty dál píšeme česky přímo v kódu a česká věta slouží jako klíč k překladu. Angličtina má vlastní soubor s překlady vět, jmen jednotek, budov, technologií, národů i měst a celou encyklopedii. Další jazyk vznikne zkopírováním anglických souborů a přeložením hodnot, test hlídá, aby žádný text rozhraní nechyběl. Encyklopedie se v jazyce bez překladu ukáže česky.

Jazyk se vybírá na úvodní obrazovce nebo v menu a hra si ho pamatuje. Výchozí je čeština. Po přepnutí se stránka znovu načte, rozehraná hra zůstane. Záznam událostí, který už ve hře je, zůstane v jazyce, ve kterém vznikl. Klávesy jsou v obou jazycích stejné, železnice zůstává na Z.

Anglické texty píšeme britským pravopisem. Města, která už stojí, mají v uložené hře česká jména, a anglická verze je překládá podle seznamu národa, takže z Prahy je Prague. Odkazy z anglické encyklopedie vedou přes vyhledávání na anglické Wikipedii, protože názvy článků jsme tam neověřovali. Věta o Civilizaci 1 u výběru národa v angličtině jméno hry nepoužívá.

Přehled měst otevře klávesa O, tlačítko Města nahoře nebo položka v menu. U každého města ukazuje velikost, jídlo a růst, štíty, obchod, vědu, zlato, náladu a počet budov. Ve sloupci Vyrábí jde rovnou změnit stavbu a vedle ní koupit hotovou výrobu. Klik na jméno otevře celé město. Přehled používá stejné příkazy jako zbytek hry.

## 15. 11. 2026: Město v detailu vypadá pořád stejně a hradbu kreslí kód

Když Michal měnil výšku obrázku města, hra rozložila budovy pokaždé znovu a město vypadalo jinak. Teď si rozložení spočítá jen z toho, co ve městě stojí, a při změně velikosti obrázek jen přiblíží nebo oddálí. Jiné rozložení přijde, až město vyroste nebo postaví něco nového.

Hradbu z obrázku hradu od Gemini jsme opakovali v každém rohu a vypadalo to špatně. Hradbu teď kreslí kód: kamenná zeď s ochozem a cimbuřím obíhá okraj města a kulaté věže s červenou střechou stojí jen tam, kde hradba zatáčí.

## 15. 11. 2026: Mapa má všechny terény z Civilizace 1 a suroviny

Michal chtěl všechny terény z Civilizace 1. K oceánu, louce, pláním, lesu, kopcům, horám a poušti přibyla tundra, ledovec, džungle, bažina a řeka. Výnosy a pohyb odpovídají Civilizaci 1. Michal poslal seznam, kde měla louka 2/1/0 a řeka 2/1/1, ale v Civilizaci 1 má louka 2/0/0 a řeka 1/0/1 a jeden štít navíc dává až surovina na louce. Držíme hodnoty z Civilizace 1.

Řeka je samostatný terén jako v Civilizaci 1 a teče od kopců a hor k moři. Cestu nebo železnici přes ni jde postavit až se stavbou mostů. Tundra leží k pólům, džungle a bažina ve vlhkých nížinách, u horního a dolního okraje mapy je polární led. Džungli a bažinu zatím nejde zavlažit ani přeměnit na jiný terén.

Každý terén kromě řeky má surovinu z Civilizace 1, třeba ryby v moři, koně na pláních, uhlí v kopcích nebo zlato v horách. Objeví se asi na desetině políček a dvě nikdy nesousedí. Ryby jsou jen u pobřeží kontinentu. Hra je ukazuje malou značkou na políčku a počítá je do výnosu, takže je vidí i AI.

Město může místo stavby vydělávat zlato. Každý štít se pak změní na jeden kus zlata a uložené štíty počkají na další stavbu. Do plánu staveb tahle volba nejde, protože nikdy neskončí.

## 15. 11. 2026: Město má plán staveb, osadníci pracují sami a hra má rádce

Michal chtěl ve městě frontu práce. Město si teď může naplánovat až osm dalších staveb. Když dokončí tu současnou, vezme další z plánu a přeskočí, co už postavit nejde. Bez plánu dál vyrábí stejnou jednotku, nebo po dokončené budově přejde na obránce. Plán je obyčejný příkaz, takže ho bude používat i AI.

Osadník umí postavit cestu nebo železnici po celé trase k cíli. Na každém políčku bez cesty se zastaví, postaví ji a jde dál. Pod železnici nejdřív položí cestu. Osadník taky může pracovat sám: vybere políčko kolem vlastních měst, kde vylepšení přidá nejvíc jídla, výroby a obchodu, a započítá, jak daleko musí jít. Políčka, která město obdělává, mají přednost. Dva osadníci si práci nerozeberou na stejné políčko. Rozkazy plní na začátku každého tahu a AI je bude používat stejně.

Hra má rádce pro syna. Ukazuje vlevo nahoře nejvýš tři rady podle naléhavosti, například zvolit výzkum, uklidnit nepokoje, nedovolit, aby došlo zlato, nebo založit další město. U každé rady je tlačítko, které hráče dovede na správné místo. Rádce čte jen to, co hráč vidí o svých městech a jednotkách. Jde vypnout v menu.

V detailu města jde hranici mezi obrázkem a panely táhnout myší, hra si výšku pamatuje.

## 15. 11. 2026: Pohled do města je izometrická deska

První pokus o detail města se nepovedl. Budovy od Gemini jsou kreslené izometricky, krajina za nimi zepředu, a tak budovy vypadaly jako nalepené na fotku a každá stála na jiném podstavci. Michal schválil předělat pohled podle Civilizace 3. Město teď stojí na izometrické desce ve stejném úhlu jako obrázky budov. Ulice obíhají bloky po dvou na dvě parcely, na každé parcele stojí budova nebo dům a div zabere celý blok. Podstavec každého obrázku hra změří a zarovná na parcelu, takže podstavce na sebe navazují. Město roste od středu blok po bloku, s více obyvateli přibývají domy. Přístavní města mají vpravo moře a přístavní stavby stojí na pobřeží. Hradba obíhá okraj města a věže stojí v rozích. Malovaná krajina z pozadí zmizela.

## 15. 11. 2026: Detail města kreslí Gemini a terén má přírodní hranice

Michal chtěl, aby detail města vypadal dobře a všechny budovy nakreslil Gemini. Gemini nakreslí každou budovu a každý div jako samostatný obrázek z mírného nadhledu, k tomu tři typy domů pro každou éru a dvě krajiny do pozadí, jednu s mořem pro přístavní města. Město v detailu staví budovy na louku do řad, divy dostanou nejlepší místa a zbytek zaplní domy podle počtu obyvatel. Vepředu vede hradba s věžemi. Široké okno doplní krajinu po stranách zrcadlenými kusy louky. Obrázky budov slouží i jako ikony v seznamech města.

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
