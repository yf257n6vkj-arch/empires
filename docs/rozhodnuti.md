# Rozhodnutí

Sem zapisujeme, co jsme s Michalem rozhodli, ať se k tomu nemusíme vracet. Nejnovější je nahoře.

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
