/**
 * More for every encyclopedia page: a second paragraph and further surprising
 * facts, so "Did you know?" changes. Keys are the codex keys ("unit-settlers")
 * and "tech-" plus the technology id. Czech; other languages have their own
 * copy in src/web/i18n.
 */
export interface PageMore {
  more: string;
  facts: string[];
}

export const PAGE_MORE: Record<string, PageMore> = {
  "unit-settlers": {
    more: "Osadníci si museli vybrat dobré místo. Hledali vodu, úrodnou půdu a dřevo na stavby a palivo. Kolem nové osady pak museli vyklučit les a vyorat první pole, což trvalo celé roky.",
    facts: [
      "Ve středověku dostávali noví osadníci často několik let bez daní, aby se jim vyplatilo do pustého kraje přijít.",
      "Američtí osadníci na Divokém západě cestovali v krytých vozech taženích voly. Cesta přes celý kontinent jim trvala skoro půl roku.",
    ],
  },
  "unit-warriors": {
    more: "Válečníci nosili zbraně, které si sami vyrobili. Kyj z tvrdého dřeva, kamennou sekeru nebo oštěp. Bojovalo se hlavně zblízka a vyhrával silnější a odvážnější.",
    facts: [
      "Pravěcí lidé uměli opracovat pazourek tak ostře, že se jeho hranou dalo holit.",
      "Prak, se kterým se házely kameny, patří k nejstarším zbraním na světě. Dobrý pastevec s ním trefil vlka na desítky metrů.",
    ],
  },
  "unit-spearmen": {
    more: "Falanga byla silná hlavně zepředu. Když ji nepřítel obešel ze strany nebo zezadu, vojáci se těžko otáčeli. Proto se generálové snažili mít boky kryté jízdou nebo terénem.",
    facts: [
      "Spartští hoplité si nechávali růst dlouhé vlasy a před bitvou si je česali.",
      "Makedonci později prodloužili kopí až na šest metrů. Přední řady pak měly před sebou les hrotů.",
    ],
  },
  "unit-horsemen": {
    more: "Kůň potřebuje hodně trávy a vody, a tak jízdu nejlépe uživily stepi. Kočovní jezdci měli každý několik koní a střídali je, aby žádný neunavil.",
    facts: [
      "Mongolský jezdec dokázal ujet za den i přes sto kilometrů.",
      "Uzda s udidlem, kterou člověk ovládá koně, je stará přes pět tisíc let.",
    ],
  },
  "unit-archers": {
    more: "Luk se dělal ze dřeva, které je pružné a nezlomí se. Nejlepší byl tis. Šípy měly na konci peří, aby letěly rovně, a hrot z kamene, kosti nebo kovu.",
    facts: [
      "Anglický dlouhý luk byl vysoký skoro jako dospělý muž a napnout ho chtělo sílu jako zvednout čtyřicet kilo.",
      "Mongolové používali luk složený ze dřeva, rohoviny a šlach. Byl krátký, takže se z něj dobře střílelo ze sedla.",
    ],
  },
  "unit-swordsmen": {
    more: "Legionář nosil na pochodu všechno na zádech: zbraně, jídlo, nádobí i nářadí na stavbu tábora. Vážilo to přes třicet kilo, a proto jim lidé přezdívali Mariovy mezky.",
    facts: [
      "Legionář sloužil v armádě kolem pětadvaceti let. Na konci služby často dostal kus půdy.",
      "Římané uměli postavit štíty nad hlavou i kolem sebe tak, že vznikla želva, kterou šípy neprorazily.",
    ],
  },
  "unit-chariot": {
    more: "Vůz potřeboval rovný a tvrdý terén. V kopcích nebo v bahně byl k ničemu. Proto se bitvy vozů odehrávaly na velkých pláních.",
    facts: [
      "V bitvě u Kadeše kolem roku 1274 př. n. l. bojovaly možná až pět tisíc válečných vozů. Byla to jedna z největších bitev vozů v dějinách.",
      "Lehká kola s loukotěmi byla na válečném voze důležitá. Plné dřevěné kolo by bylo příliš těžké a pomalé.",
    ],
  },
  "unit-catapult": {
    more: "Obléhání města mohlo trvat měsíce. Obránci za hradbami čekali, až útočníkům dojde jídlo, a útočníci čekali, až dojde obráncům. Katapulty pomáhaly obléhání zkrátit.",
    facts: [
      "Archimédés prý při obraně Syrakus vymyslel jeřáby, které chytaly římské lodě a převracely je.",
      "Ve středověku házeli obléhatelé přes hradby i mrtvá zvířata, aby ve městě vypukla nemoc.",
    ],
  },
  "unit-knights": {
    more: "Rytířský kůň musel být silný a klidný, aby unesl jezdce ve zbroji a nepolekal se v bitvě. Takový válečný kůň stál tolik jako malá vesnice.",
    facts: [
      "Turnaje se pořádaly i v Praze. Král Jan Lucemburský na nich rád bojoval.",
      "Pod plátovou zbrojí nosil rytíř prošívaný kabátec, který tlumil rány a chránil před odřením.",
    ],
  },
  "unit-musketeers": {
    more: "Mušketa byla těžká a dlouhá, a tak si ji mušketýr opíral o vidlici zapíchnutou do země. Přesná nebyla, na sto metrů trefila jen občas.",
    facts: [
      "Střelný prach v mušketách vytvořil tolik dýmu, že po pár výstřelech vojáci na bojišti skoro nic neviděli.",
      "Později dostaly muškety bodák. Mušketýr pak mohl bojovat i zblízka a kopiníci přestali být potřeba.",
    ],
  },
  "unit-cannon": {
    more: "Odlévat děla uměli zvonaři, protože to bylo podobné jako odlévat zvony. Dělo se odlilo z bronzu, později ze železa.",
    facts: [
      "Osmané obléhali v roce 1453 Konstantinopol s obřím dělem, které táhlo šedesát volů.",
      "Dělové koule byly nejdřív z kamene. Železné koule byly menší a pronikly hradbou lépe.",
    ],
  },
  "unit-riflemen": {
    more: "S puškou mohl voják střílet přesně i na stovky metrů. Bitvy se proto přestaly vést v sevřených řadách a vojáci se kryli v zákopech a za terénem.",
    facts: [
      "Zadovka, která se nabíjí zezadu, dovolila nabíjet vleže. Do té doby musel voják při nabíjení stát.",
      "Barevné uniformy postupně zmizely. Vojáci dostali zelenou, šedou nebo khaki barvu, aby je nepřítel hůř viděl.",
    ],
  },
  "unit-artillery": {
    more: "Za první světové války se střílelo z děl celé dny. Rachot byl slyšet až desítky kilometrů daleko.",
    facts: [
      "Některá děla byla tak velká, že se vozila po železnici. Německé dělo Gustav vážilo přes tisíc tun.",
      "Dělostřelci si zacpávali uši a otevírali ústa, aby jim tlaková vlna nepoškodila uši.",
    ],
  },
  "unit-mechInf": {
    more: "Obrněné vozidlo pěchoty má pásy nebo kola. Pásy jsou lepší v bahně, kola jsou rychlejší na silnici a méně se kazí.",
    facts: [
      "Některá vozidla pěchoty umí plavat a přejedou řeku bez mostu.",
      "Uvnitř je těsno. Vojáci sedí v řadě proti sobě a mají vybavení na klíně.",
    ],
  },
  "unit-tank": {
    more: "První tanky byly pomalé, sotva jely rychlostí chůze. Uvnitř bylo horko, hluk a výpary, a posádka často omdlévala.",
    facts: [
      "Československo vyrábělo před druhou světovou válkou tanky LT vz. 38. Němci je po obsazení země používali ve vlastní armádě.",
      "Moderní tank váží šedesát i více tun, ale na rovině jede přes šedesát kilometrů za hodinu.",
    ],
  },
  "unit-diplomat": {
    more: "Dřív posel nesl dopis od panovníka a musel ho doručit i přes válečné území. Někdy čekal na odpověď celé měsíce.",
    facts: [
      "Diplomaté mluví často několika jazyky. Dlouho se v diplomacii mluvilo hlavně francouzsky.",
      "Vídeňský kongres v letech 1814 a 1815 se zapsal i tím, že se na něm hodně tančilo. Říkalo se, že kongres tančí.",
    ],
  },
  "unit-caravan": {
    more: "Karavany putovaly hlavně v chladnějších částech dne a v noci, kdy se dalo jít podle hvězd. Velká karavana mohla mít stovky velbloudů.",
    facts: [
      "Velbloudí hrb neobsahuje vodu, ale tuk. Velbloud z něj bere energii, když nemá co jíst.",
      "Marco Polo cestoval z Benátek do Číny po obchodních stezkách a cesta mu trvala tři a půl roku.",
    ],
  },
  "unit-trireme": {
    more: "Veslaři na triéře nebyli otroci, jak se často myslí. V Athénách veslovali svobodní chudší občané a dostávali za to plat.",
    facts: [
      "Aby veslaři veslovali naráz, udával jim rytmus pištec na flétnu.",
      "V roce 1987 postavili Řekové věrnou kopii triéry jménem Olympias a vyzkoušeli, jak rychle pluje.",
    ],
  },
  "unit-sail": {
    more: "Na dlouhých plavbách bylo nejtěžší udržet čerstvé jídlo a vodu. Námořníci jedli suchary a nasolené maso.",
    facts: [
      "Bez ovoce a zeleniny dostávali námořníci kurděje, nemoc z nedostatku vitamínu C.",
      "Portugalský princ Jindřich Mořeplavec sám skoro nikam neplul, ale posílal výpravy a platil mapaře a stavitele lodí.",
    ],
  },
  "unit-frigate": {
    more: "Na stavbu jedné velké válečné plachetnice padly i dva tisíce dubů. Celé lesy se kácely pro loďstvo.",
    facts: [
      "Námořníci spali v houpacích sítích zavěšených mezi děly.",
      "Fregaty dostávaly zprávy z admirálské lodi pomocí barevných vlajek, každá kombinace něco znamenala.",
    ],
  },
  "unit-ironclad": {
    more: "Pancéřové lodě měly často jen jednu otočnou věž s děly. Mohla střílet na všechny strany a loď se nemusela otáčet.",
    facts: [
      "Monitor byl tak nízký, že mu přezdívali krabice od sýra na voru.",
      "Dřevěné lodě se někdy obkládaly železnými pláty dodatečně, protože nové pancéřové lodě nestihly postavit.",
    ],
  },
  "unit-cruiser": {
    more: "Křižníky vyplouvaly daleko na moře a hledaly nepřátelské obchodní lodě. Dokázaly být měsíce na cestě bez přístavu.",
    facts: [
      "Německý křižník Emden v první světové válce zajal nebo potopil přes dvacet obchodních lodí v Indickém oceánu.",
      "Lodní kuchyně na velkém křižníku vařila pro stovky námořníků několikrát denně.",
    ],
  },
  "unit-battleship": {
    more: "Britská loď Dreadnought z roku 1906 měla tolik velkých děl, že všechny starší bitevní lodě rázem zastaraly. Podle ní se novým lodím začalo říkat dreadnoughty.",
    facts: [
      "Velká bitevní loď měla posádku přes dva tisíce námořníků, jako malé město.",
      "Americká bitevní loď Missouri byla místem, kde Japonsko v roce 1945 podepsalo kapitulaci.",
    ],
  },
  "unit-submarine": {
    more: "Ponorka pod vodou nevidí. Hledá lodě sonarem, který vysílá zvuk a poslouchá jeho ozvěnu.",
    facts: [
      "První ponorka, která potopila válečnou loď, byla v roce 1864 ruční ponorka Hunley. Posádka ji poháněla klikou.",
      "Na jaderné ponorce si posádka vyrábí kyslík z mořské vody.",
    ],
  },
  "unit-transport": {
    more: "Za druhé světové války postavili Američané přes dva a půl tisíce lodí Liberty. Některé byly hotové za pár dní.",
    facts: [
      "Největší kontejnerové lodě jsou dlouhé přes čtyři sta metrů, víc než čtyři fotbalová hřiště za sebou.",
      "Velké nákladní lodě potřebují posádku jen kolem dvaceti lidí, protože většinu práce dělají stroje.",
    ],
  },
  "unit-carrier": {
    more: "Letadla na letadlové lodi startují pomocí katapultu, který je na krátké palubě rozjede na rychlost potřebnou ke vzletu za pár sekund.",
    facts: [
      "Křídla letadel na letadlových lodích se dají sklopit, aby se jich do hangáru vešlo víc.",
      "Letadlová loď je tak velká, že ve špatném počasí se na ní houpe mnohem méně než menší lodě.",
    ],
  },
  "unit-fighter": {
    more: "Piloti za první světové války neměli padáky. Letouny byly z plátna a dřeva a lehce hořely.",
    facts: [
      "Rudý baron Manfred von Richthofen sestřelil v první světové válce osmdesát letounů.",
      "Moderní stíhačky jsou tak neklidné, že by je pilot bez počítače neudržel ve vzduchu.",
    ],
  },
  "unit-bomber": {
    more: "Posádky bombardérů létaly v noci, aby je nepřátelské stíhačky hůř našly. Cíl hledaly podle hvězd a map.",
    facts: [
      "Americký bombardér B-29 měl přetlakovou kabinu, takže posádka nemusela v obrovské výšce mrznout.",
      "Některé bombardéry jsou tvarované tak, aby je radar skoro neviděl.",
    ],
  },
  "unit-nuclear": {
    more: "Výbuch jaderné bomby vytvoří ohnivou kouli a obrovský hřibovitý mrak. Po něm zůstane radioaktivní spad, který škodí lidem ještě dlouho.",
    facts: [
      "Za studené války měly Spojené státy a Sovětský svaz dohromady přes šedesát tisíc jaderných hlavic.",
      "Ve škole se kdysi děti učily schovat pod lavici, kdyby přišel jaderný útok. Dnes víme, že by to moc nepomohlo.",
    ],
  },
  "gov-anarchy": {
    more: "Za anarchie si lidé často pomáhají sami. Sousedé hlídají ulice a dělí se o jídlo, dokud nevznikne nová vláda.",
    facts: [
      "Po pádu vlády v Rusku v roce 1917 vládl v zemi několik měsíců zmatek, než se moci ujali bolševici.",
      "Ve hře jde za anarchie všechen obchod na zábavu, aby se lidé nebouřili.",
    ],
  },
  "gov-despotism": {
    more: "Despota často bydlel v pevném paláci a obklopil se strážemi, protože se bál vzpoury.",
    facts: [
      "Despota mohl nechat postavit obrovské stavby, protože lidé museli pracovat, kolik řekl.",
      "Despoty často svrhl jiný silný muž, a tak se vlády střídaly v bojích.",
    ],
  },
  "gov-monarchy": {
    more: "Král býval korunován v chrámu. Koruna, žezlo a jablko jsou znamení jeho moci.",
    facts: [
      "Svatováclavská koruna, kterou dal udělat Karel IV., je jednou z nejstarších dochovaných korun v Evropě.",
      "Ve Velké Británii dodnes vládne král, ale zákony dělá parlament.",
    ],
  },
  "gov-communism": {
    more: "Komunistické státy plánovaly hospodářství na pět let dopředu. Úředníci určovali, kolik se čeho vyrobí.",
    facts: [
      "V Československu se na banány a pomeranče stály fronty, protože jich bylo málo.",
      "Lidé, kteří chtěli z komunistických zemí utéct, riskovali život na hranicích s ostnatým drátem.",
    ],
  },
  "gov-republic": {
    more: "V římské republice se nikdo nesměl stát králem. Když bylo nejhůř, zvolil senát diktátora jen na půl roku.",
    facts: [
      "Benátky byly republikou přes tisíc let a vedl je dóže, kterého volili.",
      "Republika je dnes většina států světa, mají prezidenta místo krále.",
    ],
  },
  "gov-democracy": {
    more: "V demokracii jsou volby tajné. Nikdo nesmí vědět, koho volíš, aby tě nikdo nemohl nutit.",
    facts: [
      "Švýcaři dodnes hlasují o mnoha věcech přímo v referendu, někdy i několikrát do roka.",
      "V demokracii platí, že vláda se musí podřídit soudům stejně jako obyčejní lidé.",
    ],
  },
  "bld-palace": {
    more: "Paláce mívaly trůnní sál, kde panovník přijímal hosty. Čím větší a zdobnější byl, tím víc panovník ukazoval svou moc.",
    facts: [
      "Versailles u Paříže má Zrcadlový sál se 357 zrcadly.",
      "Ve Zakázaném městě v Pekingu je skoro tisíc budov a dlouho tam nesměl vstoupit nikdo bez svolení císaře.",
    ],
  },
  "bld-granary": {
    more: "Sýpky se stavěly na nožkách nebo s kameny pod podlahou, aby k obilí nemohly myši a nevlhlo.",
    facts: [
      "V Egyptě se obilím platilo místo penězi a ze sýpek se dávaly mzdy dělníkům.",
      "Kočky lidé začali chovat možná právě proto, že chytaly myši v sýpkách.",
    ],
  },
  "bld-temple": {
    more: "Chrámy bývaly zároveň místem, kde se uchovávaly poklady a účty. Kněží uměli psát a počítat.",
    facts: [
      "Angkor Vat v Kambodži je největší náboženská stavba na světě.",
      "Ve staroegyptských chrámech směli do nejsvětější místnosti jen kněží a faraon.",
    ],
  },
  "bld-walls": {
    more: "Hradby měly často příkop s vodou, přes který vedl padací most. Když se zvedl, do města se nedalo dostat.",
    facts: [
      "Dubrovník v Chorvatsku má hradby dlouhé skoro dva kilometry a dá se po nich obejít celé staré město.",
      "Starověké město Jericho mělo kamennou zeď už před deseti tisíci lety.",
    ],
  },
  "bld-barracks": {
    more: "V kasárnách se brzy ráno troubí budíček. Vojáci si ustelou postele a nastoupí na nástup.",
    facts: [
      "Pražská kasárna na Karlíně patří k největším stavbám tohoto druhu v Praze.",
      "Vojáci se v kasárnách učí pochodovat, střílet, ale i první pomoc a vařit v poli.",
    ],
  },
  "bld-library": {
    more: "Ve středověku byly knihy v knihovnách přikované řetězy k pultům, aby je nikdo neodnesl.",
    facts: [
      "Největší knihovnou světa je Knihovna Kongresu ve Washingtonu, má přes sto sedmdesát milionů položek.",
      "Ve Strahovském klášteře v Praze najdeš knihovnu se dvěma nádhernými sály, Teologickým a Filozofickým.",
    ],
  },
  "bld-marketplace": {
    more: "Na trhu se dbalo na poctivé váhy. Kdo šidil, toho mohli dát do klády na náměstí na posměch.",
    facts: [
      "Stará česká města měla často vlastní míru, třeba pražský loket, podle kterého se měřila látka.",
      "Některé trhy se konaly jen jednou za rok a trvaly několik dní. Říkalo se jim jarmarky.",
    ],
  },
  "bld-courthouse": {
    more: "Ve středověku soudil často pán na svém panství. Lidé se mohli odvolat ke králi, ale cesta byla dlouhá a drahá.",
    facts: [
      "Ve starých soudech se někdy dokazovala nevina zkouškou ohněm nebo vody. Dnes se rozhoduje podle důkazů.",
      "Soudci v mnoha zemích nosí talár a v Británii dokonce bílou paruku.",
    ],
  },
  "bld-harbour": {
    more: "Přístavy mají majáky, bóje a světla, aby lodě v noci bezpečně trefily vjezd.",
    facts: [
      "Česko nemá moře, ale za první republiky mělo v Hamburku pronajatou část přístavu.",
      "Rybáři vyplouvají často v noci a ráno se v přístavu na trhu prodávají čerstvé ryby.",
    ],
  },
  "bld-amphitheater": {
    more: "Gladiátoři byli často otroci nebo zajatci, ale ti nejlepší byli slavní jako dnešní sportovci.",
    facts: [
      "V Pule v Chorvatsku stojí jeden z nejzachovalejších římských amfiteátrů.",
      "Do Kolosea vedlo osmdesát vchodů, aby se zaplnilo a vyprázdnilo rychle.",
    ],
  },
  "bld-aqueduct": {
    more: "Akvadukt ve francouzském Pont du Gard má tři patra oblouků a voda tekla po jeho horním okraji.",
    facts: [
      "Některé římské akvadukty klesaly jen o pár centimetrů na kilometr, tak přesně uměli Římané měřit.",
      "Pražské vodárenské věže čerpaly vodu z Vltavy do kašen ve městě.",
    ],
  },
  "bld-cathedral": {
    more: "Gotické katedrály mají opěrné pilíře venku, aby zdi unesly vysoké klenby a mohly mít velká okna.",
    facts: [
      "Barevná okna vyprávěla příběhy z Bible lidem, kteří neuměli číst.",
      "Katedrála Sagrada Família v Barceloně se staví od roku 1882 a pořád není hotová.",
    ],
  },
  "bld-university": {
    more: "Studenti ve středověku často cestovali od jedné univerzity k druhé a poslouchali různé učitele.",
    facts: [
      "Na Karlově univerzitě v Praze studovali v začátcích čtyři národy: čeští, bavorští, polští a saští.",
      "Akademický titul doktor znamená původně učitel.",
    ],
  },
  "bld-bank": {
    more: "První bankovky na světě se používaly v Číně už kolem roku 1000.",
    facts: [
      "Banky mají trezory s tlustými ocelovými dveřmi, které se otevírají jen v určitý čas.",
      "Česká národní banka sídlí v Praze a vydává české koruny.",
    ],
  },
  "bld-factory": {
    more: "První továrny poháněla voda z řek. Proto stávaly u vodních toků.",
    facts: [
      "Ve Zlíně vyrostlo kolem Baťovy továrny celé město s domky z červených cihel pro dělníky.",
      "Továrny dlouho dávaly práci i dětem, než to zákony zakázaly.",
    ],
  },
  "bld-powerPlant": {
    more: "Elektřina se z elektrárny posílá po vedení vysokého napětí, aby se cestou neztrácela.",
    facts: [
      "První veřejnou elektrárnu postavil Thomas Edison v New Yorku v roce 1882.",
      "Velké tepelné elektrárny mají vysoké komíny, aby kouř odnesl vítr co nejdál.",
    ],
  },
  "bld-hydroPlant": {
    more: "Vodní mlýny používaly sílu vody už ve starověku. Vodní elektrárna je jejich moderní potomek.",
    facts: [
      "Přehrada Tři soutěsky v Číně je největší vodní elektrárnou na světě.",
      "Přečerpávací elektrárna Dlouhé stráně v Jeseníkách v noci čerpá vodu nahoru a ve dne ji pouští dolů.",
    ],
  },
  "bld-nuclearPlant": {
    more: "Palivo v jaderné elektrárně jsou malé tabletky uranu, zasunuté do dlouhých trubek.",
    facts: [
      "První jaderná elektrárna v Československu byla Jaslovské Bohunice na Slovensku.",
      "Jaderná elektrárna musí mít hodně vody na chlazení, proto stojí u řek nebo nádrží.",
    ],
  },
  "bld-manufacturingPlant": {
    more: "V moderní automobilce sjede z linky hotové auto každou minutu nebo dvě.",
    facts: [
      "Škoda Auto v Mladé Boleslavi patří k největším továrnám v Česku a pracují v ní tisíce robotů.",
      "Někteří roboti v továrnách pracují i v noci bez světel, protože ho nepotřebují.",
    ],
  },
  "bld-massTransit": {
    more: "První podzemní dráha na světě začala jezdit v Londýně v roce 1863. Vlaky tehdy táhly parní lokomotivy.",
    facts: [
      "Pražská tramvaj jezdí od roku 1875, nejdřív ji tahali koně.",
      "V některých městech jezdí metro bez řidiče, řídí ho počítač.",
    ],
  },
  "bld-recyclingCenter": {
    more: "Ve sběrném dvoře se třídí elektronika, kovy, dřevo i nebezpečný odpad, aby se dal znovu použít nebo bezpečně zničit.",
    facts: [
      "Z vytříděných PET lahví se dají vyrobit vlákna na mikiny a koberce.",
      "Sklo jde recyklovat donekonečna a pořád zůstane stejně dobré.",
    ],
  },
  "bld-researchLab": {
    more: "Vědci si své pokusy pečlivě zapisují, aby je mohl kdokoli zopakovat a ověřit.",
    facts: [
      "Český chemik Jaroslav Heyrovský dostal v roce 1959 Nobelovu cenu za objev polarografie.",
      "Velký hadronový urychlovač v CERNu je kruhový tunel dlouhý skoro sedmadvacet kilometrů.",
    ],
  },
  "bld-coastalFortress": {
    more: "Pobřežní pevnosti měly děla schovaná za zemními valy, aby je lodní dělostřelectvo nemohlo snadno zasáhnout.",
    facts: [
      "Do skály Gibraltaru vyrazili Britové přes padesát kilometrů tunelů.",
      "Na Gibraltaru žijí opice makakové, jediné divoké opice v Evropě.",
    ],
  },
  "bld-sdiDefense": {
    more: "Radar funguje tak, že vyšle rádiové vlny a zachytí jejich odraz od letadla nebo rakety.",
    facts: [
      "Izraelská Železná kopule zachytává rakety, které letí na města.",
      "Zachytit raketu je jako trefit kulku kulkou, obě letí obrovskou rychlostí.",
    ],
  },
  "bld-ssStructural": {
    more: "Díly vesmírné stanice musí unést start rakety, kdy na ně působí obrovské otřesy a přetížení.",
    facts: [
      "Mezinárodní vesmírná stanice je velká skoro jako fotbalové hřiště.",
      "Astronauti na stanici cvičí každý den dvě hodiny, aby jim ve stavu beztíže neslábly kosti a svaly.",
    ],
  },
  "bld-ssComponent": {
    more: "Raketový motor potřebuje palivo a okysličovadlo, třeba kapalný vodík a kapalný kyslík, aby palivo hořelo i ve vesmíru.",
    facts: [
      "Kapalný vodík se musí chladit na minus dvě stě padesát tři stupňů.",
      "Iontové motory dávají malou sílu, ale vydrží běžet celé měsíce a postupně loď hodně zrychlí.",
    ],
  },
  "bld-ssModule": {
    more: "Ve vesmíru se rostliny pěstují pod speciálními lampami. Astronauti už ochutnali salát vypěstovaný na stanici.",
    facts: [
      "Voda na stanici se recykluje, i z potu a moči se znovu vyrobí pitná voda.",
      "Kosmonauti spí ve spacích pytlích připoutaných ke stěně, aby neodplouvali.",
    ],
  },
  "wdr-stoneCircle": {
    more: "Kolem Stonehenge je v krajině spousta pravěkých hrobů a mohyl. Lidé sem nejspíš přicházeli na slavnosti a pohřby.",
    facts: [
      "Menší kameny Stonehenge, kterým se říká modré kameny, přivezli lidé z kopců Preseli ve Walesu.",
      "I v Česku stojí pravěké menhiry, třeba Zkamenělý pastýř u Klobuk.",
    ],
  },
  "wdr-pyramids": {
    more: "Uvnitř Velké pyramidy vedou úzké chodby do komory, kde stál faraonův sarkofág. Hrobku ale vykradli zloději už ve starověku.",
    facts: [
      "Pyramidy byly původně obložené hladkým bílým vápencem a na slunci zářily.",
      "Dělníci, kteří stavěli pyramidy, nebyli otroci. Archeologové našli jejich vesnici, pekárny i hroby.",
    ],
  },
  "wdr-colossus": {
    more: "Kolos stál nejspíš u přístavu na kamenném podstavci. Uvnitř měl kamenné pilíře a železnou kostru, na které byly bronzové pláty.",
    facts: [
      "I ležící zbytky kolosu byly tak velké, že je cestovatelé chodili obdivovat ještě stovky let.",
      "Socha svobody v New Yorku se někdy nazývá novým kolosem.",
    ],
  },
  "wdr-hangingGardens": {
    more: "Babylón ležel v horké a suché krajině. Zelená zahrada uprostřed města musela působit jako zázrak.",
    facts: [
      "Řecký spisovatel Strabón popsal, že vodu do zahrad zvedaly šroubové stroje.",
      "Visuté zahrady jsou jediný ze sedmi divů starověkého světa, o kterém nevíme jistě, jestli vůbec existoval.",
    ],
  },
  "wdr-greatWall": {
    more: "Velká zeď nebyla postavená najednou. Je to mnoho zdí z různých dob, které se časem spojily.",
    facts: [
      "Do malty na některých částech zdi se přidávala lepkavá rýže, aby lépe držela.",
      "Na stavbě zdi pracovaly statisíce lidí, vojáci, rolníci i odsouzenci.",
    ],
  },
  "wdr-lighthouse": {
    more: "Maják na Faru byl vysoký možná přes sto metrů. Byl to jeden z nejvyšších lidských výtvorů starověku.",
    facts: [
      "Potápěči našli v moři u Alexandrie obrovské kameny a sochy, které možná pocházejí z majáku.",
      "Stavitelem majáku byl Sóstratos z Knidu.",
    ],
  },
  "wdr-oracle": {
    more: "Na Apollónově chrámu v Delfách byl nápis Poznej sám sebe.",
    facts: [
      "Delfy měly i divadlo a stadion, kde se konaly hry na Apollónovu počest.",
      "Lidé, kteří přišli k věštírně, přinášeli dary. Města dokonce stavěla vlastní pokladnice na jejich uložení.",
    ],
  },
  "wdr-greatLibrary": {
    more: "Knihovnu založili egyptští králové z rodu Ptolemaiovců, kteří chtěli mít ve městě všechno vědění světa.",
    facts: [
      "V Alexandrii vědci zjistili, že mozek řídí tělo, a pitvali lidi, aby poznali, jak fungují.",
      "Dnes v Alexandrii stojí nová knihovna Bibliotheca Alexandrina s kulatou střechou nakloněnou k moři.",
    ],
  },
  "wdr-hallOfScholars": {
    more: "Nad vchodem do Platónovy Akademie byl podle pověsti nápis Nevstupuj, kdo neznáš geometrii.",
    facts: [
      "Aristotelés později založil vlastní školu, Lykeion. Učil při procházkách, a tak se jeho žákům říkalo peripatetici, tedy chodící.",
      "Akademii zavřel císař Justinián v roce 529.",
    ],
  },
  "wdr-greatObservatory": {
    more: "Tycho Brahe měřil polohy hvězd bez dalekohledu, jen obřími přístroji s ryskami, a přesto byl nesmírně přesný.",
    facts: [
      "Na pražském Klementinu stojí Astronomická věž, kde se počasí měří už od roku 1775.",
      "Kepler díky Tychovým měřením přišel na to, že planety obíhají po elipsách.",
    ],
  },
  "wdr-circumnavigation": {
    more: "Magalhãesova výprava objevila na jihu Ameriky Ohňovou zemi. Pojmenovali ji podle ohňů, které viděli na břehu.",
    facts: [
      "Tichý oceán dostal jméno od Magalhãese, protože ho výprava zastihla klidný.",
      "Během plavby přes Tichý oceán námořníci tak hladověli, že jedli kůži z lodních ráhen.",
    ],
  },
  "wdr-sistineChapel": {
    more: "Michelangelo se považoval spíš za sochaře a malovat strop nechtěl. Papež Julius II. ho přemluvil.",
    facts: [
      "Na stropě je přes tři sta postav.",
      "Kaple je pojmenovaná po papeži Sixtu IV., který ji dal postavit.",
    ],
  },
  "wdr-stVitus": {
    more: "Na jižní straně katedrály je Zlatá brána s mozaikou Posledního soudu z doby Karla IV.",
    facts: [
      "Ve Svatováclavské kapli jsou stěny vykládané drahými kameny.",
      "Hlavní věž katedrály je vysoká skoro sto metrů a dá se na ni vystoupat.",
    ],
  },
  "wdr-globeTheatre": {
    more: "Na představení se vyvěšovala vlajka. Černá znamenala tragédii a bílá komedii.",
    facts: [
      "Ženské role hráli v Shakespearově době chlapci, ženy na jevišti hrát nesměly.",
      "Nové divadlo Globe postavili v Londýně v roce 1997 blízko místa toho původního.",
    ],
  },
  "wdr-grandBazaar": {
    more: "Velký bazar má přes šedesát uliček a kolem čtyř tisíc obchodů.",
    facts: [
      "Obchodníci si s kupci rádi povídají a nabízejí jim čaj, než se začne smlouvat o ceně.",
      "Bazar má vlastní mešity, kašny i lázně.",
    ],
  },
  "wdr-royalSociety": {
    more: "Členové Královské společnosti zkoušeli i podivné pokusy, třeba přelévání krve ze zvířat do lidí.",
    facts: [
      "Časopis Královské společnosti vychází od roku 1665 a je jedním z nejstarších vědeckých časopisů na světě.",
      "Členy společnosti byli i Charles Darwin a Albert Einstein.",
    ],
  },
  "wdr-darwinVoyage": {
    more: "Darwin si z cesty přivezl tisíce vzorků, ptáky, brouky i kosti vyhynulých zvířat.",
    facts: [
      "Svou knihu O vzniku druhů vydal až dvacet let po návratu, v roce 1859.",
      "Galapágské želvy, které Darwin viděl, se dožívají přes sto let.",
    ],
  },
  "wdr-womensSuffrage": {
    more: "Britským bojovnicím za volební právo se říkalo sufražetky. Některé za své protesty šly do vězení.",
    facts: [
      "V Československu směly ženy volit od první republiky a ve volbách v roce 1920 byly zvoleny první poslankyně.",
      "Ve Švýcarsku mohou ženy volit v celostátních volbách až od roku 1971.",
    ],
  },
  "wdr-hooverDam": {
    more: "Hráz je dole tlustá přes dvě stě metrů a nahoře jen asi patnáct metrů.",
    facts: [
      "Beton by tuhl celá desetiletí, a tak ho chladili vodou v trubkách zabetonovaných uvnitř.",
      "Na hrázi vede hranice dvou amerických států, Nevady a Arizony, a každý má jiný čas.",
    ],
  },
  "wdr-unitedNations": {
    more: "OSN má modrou vlajku s mapou světa obklopenou olivovými ratolestmi, které znamenají mír.",
    facts: [
      "Mírové jednotky OSN nosí modré přilby, a proto se jim říká modré přilby.",
      "Ve shromáždění OSN má každý stát jeden hlas, malý i velký.",
    ],
  },
  "wdr-manhattanProject": {
    more: "První zkušební jaderný výbuch se jmenoval Trinity. Proběhl v poušti v Novém Mexiku v červenci 1945.",
    facts: [
      "Na projektu pracovali i vědci, kteří utekli z Evropy před nacisty.",
      "Po válce mnoho vědců z projektu varovalo před jadernými zbraněmi a chtělo jejich zákaz.",
    ],
  },
  "wdr-setiProgram": {
    more: "V roce 1977 zachytil radioteleskop v Ohiu krátký silný signál. Astronom k němu na papír napsal Wow! a signál se už nikdy neopakoval.",
    facts: [
      "Na sondách Voyager letí zlaté desky se zvuky a obrázky Země pro případné mimozemšťany.",
      "V roce 1974 vyslali vědci z radioteleskopu Arecibo zprávu k hvězdokupě vzdálené pětadvacet tisíc světelných let.",
    ],
  },
  "wdr-apolloProgram": {
    more: "Astronauti Apolla 11 strávili na povrchu Měsíce asi dvě a půl hodiny venku z modulu.",
    facts: [
      "Z Měsíce přivezly mise Apollo přes tři sta osmdesát kilogramů hornin.",
      "Apollo 13 mělo na cestě k Měsíci výbuch kyslíkové nádrže. Posádka se vrátila díky vynalézavosti lidí na Zemi i ve vesmíru.",
    ],
  },
  "wdr-genomeProject": {
    more: "Lidská DNA má asi tři miliardy písmen. Kdyby se vytiskla, zaplnila by stovky tlustých knih.",
    facts: [
      "Lidé a šimpanzi mají většinu DNA stejnou.",
      "Dnes se celý genom člověka dá přečíst za pár dní a za zlomek původní ceny.",
    ],
  },
  "ter-ocean": {
    more: "Oceány pokrývají asi sedm desetin povrchu Země. Většina vody na planetě je slaná a lidé ji nemohou pít bez úpravy.",
    facts: [
      "Nejhlubší místo oceánu leží v Marianském příkopu, asi jedenáct kilometrů pod hladinou.",
      "Na dně oceánů se táhne pohoří delší než všechna pohoří na souši dohromady.",
    ],
  },
  "ter-grassland": {
    more: "Travní porosty patří mezi nejrozšířenější krajiny na světě. Pasou se na nich stáda a lidé na nich založili většinu polí.",
    facts: [
      "Bizoni v Severní Americe kdysi tvořili stáda o milionech zvířat.",
      "Kořeny trav sahají hluboko a drží půdu, aby ji neodnesl vítr ani déšť.",
    ],
  },
  "ter-plains": {
    more: "Na rovinách se dobře orá i staví. Proto na nich vyrostla velká města a vedly přes ně důležité cesty.",
    facts: [
      "Velká maďarská nížina je tak plochá, že na ní člověk vidí daleko do kraje.",
      "Na rovinách se často točí větrné mlýny, protože vítr tam nic nezastaví.",
    ],
  },
  "ter-forest": {
    more: "Lesy dávají dřevo, zvěř a houby a čistí vzduch. Kdysi pokrývaly skoro celou střední Evropu.",
    facts: [
      "Nejstarší stromy na světě, borovice v Kalifornii, jsou staré přes čtyři tisíce let.",
      "Stromy si přes houby v půdě předávají vodu a živiny.",
    ],
  },
  "ter-hills": {
    more: "Kopce dávají dobrý výhled na okolí. Proto na nich lidé stavěli hradiště a hrady.",
    facts: [
      "Řím vznikl podle pověsti na sedmi pahorcích.",
      "Na svazích kopců se pěstuje vinná réva, protože na ně dobře svítí slunce.",
    ],
  },
  "ter-mountains": {
    more: "Hory jsou těžko prostupné, a tak dlouho chránily země před nepřáteli. V horách se těží kovy a kámen.",
    facts: [
      "Mount Everest roste ještě dnes o pár milimetrů za rok, protože se do sebe tlačí dvě desky zemské kůry.",
      "Na vrcholcích hor najdeme zkameněliny mořských živočichů, protože horniny kdysi ležely na dně moře.",
    ],
  },
  "ter-desert": {
    more: "Poušť je místo, kde skoro neprší. Může být horká jako Sahara i mrazivá jako vnitrozemí Antarktidy.",
    facts: [
      "Saharu kdysi pokrývaly trávy a jezera. Na skalách jsou tam kresby žiraf a hrochů.",
      "Velbloud vydrží bez pití mnoho dní a potom vypije desítky litrů vody najednou.",
    ],
  },
  "ter-tundra": {
    more: "Tundra leží za hranicí lesa. Půda v ní je skoro celý rok zmrzlá a v létě rozmrzne jen na povrchu.",
    facts: [
      "V zamrzlé půdě tundry se našli mamuti, kteří tam leželi desítky tisíc let.",
      "Během krátkého léta tam rozkvetou tisíce drobných květin a přiletí hejna ptáků.",
    ],
  },
  "ter-arctic": {
    more: "V polárních krajích slunce v zimě celé týdny nevyjde a v létě zase nezapadne.",
    facts: [
      "Ledový štít Grónska je místy silný přes tři kilometry.",
      "Lední medvěd má pod bílou srstí černou kůži, která lépe chytá teplo.",
    ],
  },
  "ter-jungle": {
    more: "V deštném pralese žije víc druhů rostlin a zvířat než kdekoli jinde na souši.",
    facts: [
      "Amazonský prales je obrovský, zabírá zhruba polovinu rozlohy Evropy.",
      "V pralese prší skoro každý den a stromy dorůstají výšky přes padesát metrů.",
    ],
  },
  "ter-swamp": {
    more: "Bažiny zadržují vodu jako houba a chrání okolí před povodněmi.",
    facts: [
      "V rašeliništích se dochovala těla lidí stará přes dva tisíce let, protože rašelina brzdí rozklad.",
      "Třeboňsko u nás vzniklo z velké části z bažin, které lidé koncem středověku a v renesanci proměnili v rybníky.",
    ],
  },
  "ter-river": {
    more: "Řeky dávají vodu na pití i zavlažování a po proudu se snadno dopravuje náklad. U řek proto vznikla první města.",
    facts: [
      "Nil je spolu s Amazonkou nejdelší řekou světa a obě mají přes šest tisíc kilometrů.",
      "Vltava je nejdelší řeka, která teče jen po českém území.",
    ],
  },
  "imp-road": {
    more: "Římané postavili přes osmdesát tisíc kilometrů dlážděných silnic a po některých se jezdí dodnes.",
    facts: [
      "Podle Římanů se říká, že všechny cesty vedou do Říma.",
      "Římské silnice měly několik vrstev kamene a štěrku a uprostřed byly vypouklé, aby z nich stékala voda.",
    ],
  },
  "imp-irrigation": {
    more: "Zavlažování umožnilo pěstovat obilí i tam, kde málo prší. Bez něj by nevznikly říše v Egyptě a Mezopotámii.",
    facts: [
      "Egypťané zvedali vodu z Nilu jednoduchým zařízením zvaným šadúf. Bylo to dlouhé ráhno se závažím na jednom konci a vědrem na druhém.",
      "Dnes se na zavlažování spotřebuje víc sladké vody než na cokoli jiného.",
    ],
  },
  "imp-mine": {
    more: "Doly dávají kovy, uhlí i sůl. Nejstarší doly lidé kopali už v pravěku kvůli pazourku.",
    facts: [
      "Kutná Hora zbohatla díky stříbrným dolům, ze kterých se razily pražské groše.",
      "Solný důl ve Věličce v Polsku má podzemní kapli, kde je všechno vytesané ze soli.",
    ],
  },
  "imp-railroad": {
    more: "První veřejná železnice s parní lokomotivou začala jezdit v Anglii v roce 1825.",
    facts: [
      "Někteří lidé se tehdy báli, že při rychlosti přes třicet kilometrů za hodinu nebudou moci dýchat.",
      "Transsibiřská magistrála z Moskvy do Vladivostoku měří přes devět tisíc kilometrů a cesta trvá týden.",
    ],
  },
  "imp-fortress": {
    more: "Pevnosti chránily hranice a důležité cesty. Vojáci v nich vydrželi i dlouhé obléhání.",
    facts: [
      "Josefov a Terezín jsou pevnosti, které nechal postavit císař Josef II. proti Prusku.",
      "Pevnosti z doby děl mívaly tvar hvězdy, aby obránci mohli střílet na útočníky ze stran.",
    ],
  },
  "civ-romans": {
    more: "Římané převzali mnoho od Řeků, bohy, umění i stavby. Sami přidali beton, silnice, akvadukty a právo, ze kterého vychází i dnešní evropské zákony.",
    facts: [
      "Z latiny, jazyka Římanů, vznikla italština, španělština, francouzština, portugalština a rumunština.",
      "Římané si oblíbili veřejné lázně. Byly to velké budovy s horkou i studenou vodou, kde se lidé setkávali.",
    ],
  },
  "civ-babylonians": {
    more: "Babylon patřil mezi první města na světě, kde žilo přes sto tisíc lidí.",
    facts: [
      "Babylonské hvězdáři zapisovali pohyby planet celá staletí a uměli předpovědět zatmění Měsíce.",
      "Ištařina brána z Babylonu byla obložená modrými cihlami se lvy a draky. Dnes stojí v muzeu v Berlíně.",
    ],
  },
  "civ-germans": {
    more: "Germánské kmeny žily na sever od římských hranic. Z jejich jazyků vznikla němčina, angličtina, holandština i švédština.",
    facts: [
      "Německo se sjednotilo v jeden stát až v roce 1871. Předtím ho tvořily desítky menších království a knížectví.",
      "Johannes Gutenberg z Mohuče kolem roku 1450 vymyslel tisk s pohyblivými písmeny.",
    ],
  },
  "civ-egyptians": {
    more: "Egyptská říše trvala skoro tři tisíce let. Kleopatra žila blíž naší době než stavbě Velké pyramidy.",
    facts: [
      "Egypťané uměli dělat papír z rostliny papyru, která rostla u Nilu.",
      "Hieroglyfy dokázal přečíst až Francouz Jean-François Champollion v roce 1822 díky kameni z Rosetty, na kterém byl stejný text i řecky.",
    ],
  },
  "civ-americans": {
    more: "Spojené státy vznikly v roce 1776, kdy se třináct britských kolonií prohlásilo za nezávislé.",
    facts: [
      "Ve Spojených státech žijí lidé, jejichž předkové přišli z celého světa. Mnoho jich přišlo i z Čech a Moravy.",
      "Na americké vlajce je padesát hvězd za padesát států a třináct pruhů za prvních třináct kolonií.",
    ],
  },
  "civ-greeks": {
    more: "Řekové žili v mnoha městských státech, které spolu často válčily. Spojovala je řeč, bohové a olympijské hry.",
    facts: [
      "Mnoho slov máme z řečtiny, třeba demokracie, škola, matematika a divadlo.",
      "Starořecké sochy a chrámy byly původně pestře pomalované. Barvy časem opadaly.",
    ],
  },
  "civ-indians": {
    more: "V Indii se mluví stovkami jazyků. Na bankovkách je hodnota napsaná v sedmnácti z nich.",
    facts: [
      "Šachy vznikly v Indii asi před půldruhým tisíciletím pod jménem čaturanga.",
      "Číslice, kterým říkáme arabské, vymysleli ve skutečnosti indičtí matematici. Arabové je jen přinesli do Evropy.",
    ],
  },
  "civ-russians": {
    more: "Rusko je rozlohou největší stát světa. Mezi Moskvou a Kamčatkou je časový rozdíl devět hodin.",
    facts: [
      "Ruština se píše azbukou, která vychází z písma, jež sestavili žáci Cyrila a Metoděje.",
      "Bajkal na Sibiři je nejhlubší jezero světa a drží asi pětinu sladké vody na povrchu Země.",
    ],
  },
  "civ-zulus": {
    more: "Zuluové žijí na jihu Afriky. Jejich říše vznikla na začátku devatenáctého století.",
    facts: [
      "V roce 1879 porazili Zuluové britskou armádu u Isandlwany, přestože měli hlavně kopí a štíty.",
      "Zulština má mlaskavé hlásky, které se vyslovují plesknutím jazyka.",
    ],
  },
  "civ-french": {
    more: "Francouzi dali světu metr a kilogram. Po revoluci zavedli míry, které platí skoro v celém světě.",
    facts: [
      "Francouzské jídlo a stolování je na seznamu světového dědictví UNESCO.",
      "Francouzština byla dlouho jazykem diplomatů a šlechty v celé Evropě.",
    ],
  },
  "civ-aztecs": {
    more: "Aztékové postavili své hlavní město Tenochtitlán na ostrově v jezeře. Do města vedly dlouhé hráze.",
    facts: [
      "Aztékové pěstovali plodiny na plovoucích zahradách, kterým se říká čínampy.",
      "Z jazyka Aztéků máme slova čokoláda, rajče a avokádo.",
    ],
  },
  "civ-chinese": {
    more: "Čínské dějiny sahají přes tři tisíce let zpátky a čínské písmo se používá celou tu dobu.",
    facts: [
      "Číňané vymysleli papír, kompas, střelný prach i knihtisk dřív než Evropané.",
      "Čaj pili Číňané už před dvěma tisíci lety. Do Evropy se dostal až v sedmnáctém století.",
    ],
  },
  "civ-english": {
    more: "Britská říše byla na začátku dvacátého století největší v dějinách. Patřila k ní asi čtvrtina souše světa.",
    facts: [
      "Fotbal, tenis a ragby dostaly svá pravidla v Anglii.",
      "Angličtina má díky Normanům spoustu francouzských slov, třeba beef, pork a table.",
    ],
  },
  "civ-mongols": {
    more: "Mongolové byli kočovníci. Žili ve stanech zvaných jurty a stěhovali se se stády po stepi.",
    facts: [
      "Mongolská říše měla rychlou poštu. Poslové měnili koně na stanicích a za den ujeli i dvě stě kilometrů.",
      "Dodnes se v Mongolsku konají slavnosti Naadam se zápasem, lukostřelbou a dostihy.",
    ],
  },
  "civ-czechs": {
    more: "Češi žijí ve střední Evropě od raného středověku. Ještě před českým knížectvím vznikla na našem území Velká Morava, kam přišli Cyril a Metoděj.",
    facts: [
      "Za Karla IV. byla Praha jedním z největších měst Evropy.",
      "Kostku cukru vymyslel Jakub Kryštof Rad v cukrovaru v Dačicích v roce 1843.",
    ],
  },
  "lead-romans": {
    more: "Caesar dobyl Galii, dnešní Francii, a o válce sám napsal knihu, kterou studenti latiny čtou dodnes.",
    facts: [
      "Podle Caesara se jmenuje měsíc červenec v mnoha jazycích, anglicky July.",
      "Když Caesar překročil s vojskem řeku Rubikon, začala občanská válka. Proto se dodnes říká překročit Rubikon, když někdo udělá krok, který nejde vzít zpátky.",
    ],
  },
  "lead-babylonians": {
    more: "Chammurapi vládl Babylonu asi čtyřicet let a z malého města udělal vládce celé Mezopotámie.",
    facts: [
      "Chammurapi nechal kopat zavlažovací kanály a v dopisech na hliněných tabulkách úředníkům přikazoval, aby je udržovali.",
      "Nahoře na sloupu se zákoníkem je Chammurapi, jak stojí před bohem slunce a spravedlnosti.",
    ],
  },
  "lead-germans": {
    more: "Fridrich Veliký hrál na flétnu a skládal hudbu. Napsal přes sto skladeb.",
    facts: [
      "Prosazoval pěstování brambor. Podle jedné historky nechal pole hlídat stráží, aby si lidé mysleli, že jsou brambory vzácné.",
      "Fridrich si dopisoval s francouzským filozofem Voltairem a nějakou dobu ho hostil na svém zámku.",
    ],
  },
  "lead-egyptians": {
    more: "Ramesse II. vládl Egyptu asi šedesát šest let a měl přes sto dětí.",
    facts: [
      "Jeho chrám v Abú Simbelu vytesali do skály. Když se stavěla přehrada na Nilu, rozřezali ho na bloky a přestěhovali výš.",
      "V Abú Simbelu dopadá slunce dvakrát do roka až do nejzazší místnosti a osvětlí sochy uvnitř.",
    ],
  },
  "lead-americans": {
    more: "Abraham Lincoln vyrostl v chudé rodině na hranici osídlení a učil se hlavně sám z půjčených knih.",
    facts: [
      "Byl nejvyšším americkým prezidentem, měřil asi metr devadesát tři.",
      "Jeho projev u Gettysburgu měl jen asi dvě stě sedmdesát slov a patří k nejslavnějším projevům v dějinách.",
    ],
  },
  "lead-greeks": {
    more: "Alexandr Veliký nikdy neprohrál bitvu, ve které sám velel.",
    facts: [
      "Alexandr založil mnoho měst a skoro všechna pojmenoval po sobě. Nejslavnější je Alexandrie v Egyptě.",
      "Jeho kůň se jmenoval Bukefalos. Když padl, Alexandr po něm pojmenoval město.",
    ],
  },
  "lead-indians": {
    more: "Gándhí vystudoval práva v Londýně a dlouho pracoval jako právník v Jižní Africe.",
    facts: [
      "Na protest proti britské dani ze soli ušel v roce 1930 s tisíci lidí skoro čtyři sta kilometrů k moři.",
      "V Indii se jeho narozeniny, 2. října, slaví jako státní svátek a OSN je vyhlásila Mezinárodním dnem nenásilí.",
    ],
  },
  "lead-russians": {
    more: "Stalin se narodil v Gruzii a jeho skutečné jméno bylo Josif Džugašvili. Stalin znamená ocelový.",
    facts: [
      "Za jeho vlády se ze zemědělské země stala průmyslová velmoc, ale miliony lidí zemřely v pracovních táborech a hladomorech.",
      "Sovětský svaz pod jeho vedením nesl největší ztráty ve válce proti Hitlerovi.",
    ],
  },
  "lead-zulus": {
    more: "Šaka zavedl krátké bodné kopí a velké štíty, se kterými vojáci bojovali zblízka.",
    facts: [
      "Jeho vojáci chodili bosí, aby byli rychlejší, a za den ušli i desítky kilometrů.",
      "Šaka seřadil vojsko do tvaru býčí hlavy s rohy, které obklíčily nepřítele ze stran.",
    ],
  },
  "lead-french": {
    more: "Napoleon nebyl malý, jak se často říká. Měřil asi sto sedmdesát centimetrů, což bylo na tu dobu normální.",
    facts: [
      "Jeho občanský zákoník platí v upravené podobě ve Francii dodnes.",
      "Bitva u Slavkova v roce 1805 se odehrála na Moravě a říká se jí bitva tří císařů.",
    ],
  },
  "lead-aztecs": {
    more: "Za Moctezumy II. byla aztécká říše na vrcholu a do Tenochtitlánu proudily dary z celé země.",
    facts: [
      "Moctezuma měl v paláci zoologickou zahradu a velké zahrady s léčivými rostlinami.",
      "Když do říše dorazil Hernán Cortés, Moctezuma ho přijal jako hosta. Brzy potom se stal jeho zajatcem.",
    ],
  },
  "lead-chinese": {
    more: "Mao Ce-tung vedl komunisty v dlouhé občanské válce a v roce 1949 vyhlásil Čínskou lidovou republiku.",
    facts: [
      "Se svou armádou ušel během Dlouhého pochodu přes deset tisíc kilometrů.",
      "Jeho plán Velký skok vpřed vyvolal hladomor, při kterém zemřely desítky milionů lidí.",
    ],
  },
  "lead-english": {
    more: "Alžběta I. mluvila několika jazyky, mimo jiné latinsky, francouzsky a italsky.",
    facts: [
      "Nikdy se nevdala, a proto se jí říkalo panenská královna. Podle ní se jmenuje americký stát Virginie.",
      "Za její vlády psal své hry William Shakespeare.",
    ],
  },
  "lead-mongols": {
    more: "Čingischán se narodil jako Temüdžin. Jméno Čingischán dostal, až když sjednotil mongolské kmeny.",
    facts: [
      "Zavedl písmo pro mongolštinu a sepsané zákony pro celou říši.",
      "Nikdo neví, kde je pohřbený. Podle pověsti po pohřbu přejela místo stáda koní, aby ho nikdo nenašel.",
    ],
  },
  "lead-czechs": {
    more: "Karel IV. byl pokřtěný jako Václav. Jméno Karel přijal při biřmování ve Francii, kde vyrůstal.",
    facts: [
      "Karel založil v Praze Nové Město a nechal postavit Karlův most i hrad Karlštejn.",
      "Napsal vlastní životopis. Je to jeden z prvních životopisů, které panovník sepsal sám o sobě.",
    ],
  },
  "tech-pottery": {
    more: "Hrnce umožnily vařit polévky a kaše, takže lidé mohli jíst i tvrdá zrna a jídlo měkčené varem. Do keramických nádob se také ukládaly zásoby, voda i víno.",
    facts: [
      "Římané vyhazovali rozbité amfory na jedno místo u řeky Tibery. Vznikl z nich celý kopec, Monte Testaccio.",
      "Na hrnčířském kruhu se dá vytočit miska za pár minut. Dřív se hrnce stavěly z hliněných válečků ručně.",
    ],
  },
  "tech-bronze": {
    more: "Z bronzu se dělaly zbraně, nářadí, šperky i zrcadla. Měď se těžila na jednom místě a cín na jiném, a tak doba bronzová rozhýbala obchod na velké vzdálenosti.",
    facts: [
      "Cín pro středomořský bronz se vozil i z dalekých krajů, třeba z Británie.",
      "Kolosální bronzová socha boha Slunce na Rhodu byla jedním ze sedmi divů světa.",
    ],
  },
  "tech-masonry": {
    more: "Kameníci se naučili lámat kámen, tesat ho do pravidelných bloků a skládat zdi, které vydrží tisíce let. Z kamene vznikly hradby, chrámy i hrobky.",
    facts: [
      "Inkové stavěli zdi z kamenů, které k sobě sedí tak přesně, že mezi ně nejde zasunout ani nůž, a to bez malty.",
      "Nejstarší kamenné chrámy na světě stojí v Göbekli Tepe v Turecku a jsou staré přes jedenáct tisíc let.",
    ],
  },
  "tech-ceremonies": {
    more: "Lidé odedávna pohřbívali své blízké s péčí. Dávali jim do hrobu jídlo, nástroje a šperky na cestu na onen svět.",
    facts: [
      "Egypťané dávali do hrobů sošky sluhů, kterým se říká vešebti. Měly za mrtvého pracovat na posmrtných polích.",
      "V Číně pohřbili prvního císaře s tisíci sochami vojáků z pálené hlíny.",
    ],
  },
  "tech-horseback": {
    more: "Na koni se dalo cestovat a válčit mnohem rychleji než pěšky. Jezdci mohli hlídat stáda na velkých pláních a posílat zprávy daleko.",
    facts: [
      "Třmeny se objevily až stovky let po prvních jezdcích. Do té doby se jezdci drželi jen koleny.",
      "Kůň vidí skoro dokola kolem sebe, protože má oči po stranách hlavy.",
    ],
  },
  "tech-wheel": {
    more: "Kolo usnadnilo dopravu nákladů a později poháněl vodní kola proud řek. Bez kola by nevznikl ani hrnčířský kruh, ani ozubená kola strojů.",
    facts: [
      "Národy staré Střední Ameriky znaly kolo jen z hraček. Na dopravu ho nepoužívaly, protože neměly tažná zvířata.",
      "Na voze s plnými koly se jezdilo pomalu, asi tak rychle, jak šli voli.",
    ],
  },
  "tech-archery": {
    more: "Luk dal lovcům možnost zasáhnout zvíře z bezpečné vzdálenosti. Ve válkách rozhodovali lučištníci mnoho bitev.",
    facts: [
      "Anglický dlouhý luk byl vysoký jako člověk a jeho šíp prorazil i kroužkovou zbroj.",
      "Mongolští jezdci uměli střílet z luku v plném cvalu, a to i dozadu.",
    ],
  },
  "tech-writing": {
    more: "Písmo vzniklo z potřeby zapisovat, kolik má kdo obilí a dobytka. Brzy lidé zapisovali i zákony, dopisy, modlitby a příběhy.",
    facts: [
      "Jeden z nejstarších příběhů na světě, Epos o Gilgamešovi, je zapsaný klínovým písmem na hliněných tabulkách.",
      "Písaři v Mezopotámii psali seříznutým rákosem do vlhké hlíny. Proto má jejich písmo tvar klínků.",
    ],
  },
  "tech-alphabet": {
    more: "Abeceda má jen pár desítek znaků. Naučit se číst už nemuseli jen kněží a písaři, stačilo pár týdnů.",
    facts: [
      "Naše latinka vychází z řeckého písma a to zase z písma Féničanů.",
      "Háčky a čárky v češtině zavedl podle tradice Jan Hus. Před ním se psalo s mnoha spřežkami.",
    ],
  },
  "tech-codeOfLaws": {
    more: "Psané zákony říkaly všem stejně, co se smí a co ne. Soudci se pak nemohli rozhodovat jen podle své libovůle.",
    facts: [
      "Římské Zákony dvanácti desek visely veřejně na náměstí a děti se je učily nazpaměť.",
      "Za Karla IV. vznikl návrh zákoníku Maiestas Carolina, který šlechta odmítla.",
    ],
  },
  "tech-mysticism": {
    more: "Lidé se snažili vyložit znamení na nebi, v ohni i ve vnitřnostech zvířat. Kněží a věštci měli proto velkou moc.",
    facts: [
      "Římané se před bitvou ptali posvátných kuřat. Když kuřata nežrala, bylo to špatné znamení.",
      "Astrologie a astronomie byly dlouho jedna a táž věda. Johannes Kepler sestavoval horoskopy pro císaře Rudolfa II.",
    ],
  },
  "tech-currency": {
    more: "Peníze nahradily výměnu zboží za zboží. Obchodník nemusel hledat někoho, kdo chce právě jeho kozu a má zrovna to, co potřebuje.",
    facts: [
      "První mince razili v Lýdii v dnešním Turecku. Byly ze slitiny zlata a stříbra.",
      "Na ostrově Yap v Tichomoří platili lidé obřími kamennými kruhy, které se ani nehýbaly z místa.",
    ],
  },
  "tech-iron": {
    more: "Železná ruda se najde skoro všude, a tak se železné nástroje dostaly i k obyčejným lidem. Železný pluh zoral těžkou půdu, kterou dřevěné rádlo nezvládlo.",
    facts: [
      "Železný sloup v Dillí je starý přes tisíc šest set let a skoro vůbec nezrezivěl.",
      "Kováři měli ve vesnici velkou úctu. V pohádkách často umí kouzlit nebo přelstí čerta.",
    ],
  },
  "tech-mapMaking": {
    more: "Mapy pomohly najít cestu, rozdělit pole a plánovat války. Dlouho se kreslily podle vyprávění cestovatelů a byly v nich velké chyby.",
    facts: [
      "Řecký učenec Eratosthenés změřil obvod Země už ve třetím století před naším letopočtem a skoro se trefil.",
      "Na starých mapách se do neznámých krajů kreslily mořské příšery.",
    ],
  },
  "tech-mathematics": {
    more: "Matematika pomáhala měřit pole po záplavách, počítat daně a stavět chrámy se správnými úhly.",
    facts: [
      "Nulu jako číslo zavedli indičtí matematici. Římané žádnou nulu neměli.",
      "Egypťané uměli spočítat objem pyramidy. Je to napsané na papyru starém přes tři a půl tisíce let.",
    ],
  },
  "tech-literacy": {
    more: "Když umí číst víc lidí, šíří se rychleji zprávy, nápady i zákony. Lidé si mohou sami přečíst smlouvu nebo dopis.",
    facts: [
      "Ve středověku se knihy opisovaly ručně a jedna Bible zabrala písaři i několik let.",
      "Codex gigas, Ďáblova bible, je největší středověký rukopis na světě. Vznikl v Čechách a dnes je ve Stockholmu.",
    ],
  },
  "tech-monarchy": {
    more: "V monarchii vládne panovník a jeho moc se většinou dědí. Dědic se tak dal připravovat na vládu od dětství.",
    facts: [
      "Česká koruna svatováclavská se ukazuje lidem jen výjimečně. Klíče od komnaty s korunovačními klenoty má sedm lidí.",
      "Japonský císařský rod vládne podle tradice nepřetržitě přes tisíc pět set let.",
    ],
  },
  "tech-republic": {
    more: "V republice si lidé volí své zástupce. Slovo republika pochází z latiny a znamená věc veřejná.",
    facts: [
      "Římská republika měla dva konzuly, kteří vládli spolu a jen jeden rok.",
      "Benátská republika vydržela přes tisíc let a její vládce dóže se volil doživotně.",
    ],
  },
  "tech-construction": {
    more: "Římský beton vznikal z vápna, vody a sopečného popela. Ve vodě dokonce tvrdl, a tak se z něj stavěly přístavy.",
    facts: [
      "Římské betonové mola stojí v moři dodnes, zatímco moderní beton by mořská voda dávno rozrušila.",
      "Dnes je beton nejpoužívanějším stavebním materiálem na světě.",
    ],
  },
  "tech-trade": {
    more: "Obchod přinášel zboží, které doma nebylo, sůl, koření, hedvábí nebo kovy. Města na obchodních cestách bohatla.",
    facts: [
      "Po Jantarové stezce se vozil jantar od Baltu až do Říma a vedla i přes Moravu.",
      "Koření bylo ve středověku tak drahé, že se pepřem dalo platit jako penězi.",
    ],
  },
  "tech-astronomy": {
    more: "Hvězdáři sledovali Slunce, Měsíc a planety, aby věděli, kdy sít a kdy slavit svátky. Z jejich pozorování vznikly kalendáře.",
    facts: [
      "Mikuláš Koperník přišel s myšlenkou, že Země obíhá kolem Slunce. Knihu o tom vydal až v roce, kdy zemřel.",
      "Galileo Galilei jako první namířil dalekohled na Jupiter a objevil čtyři jeho měsíce.",
    ],
  },
  "tech-philosophy": {
    more: "Filozofové se ptali, jak poznat pravdu, co je spravedlivé a jak dobře žít. Z jejich otázek se později oddělily vědy jako fyzika nebo psychologie.",
    facts: [
      "Sókratés sám nic nenapsal. O jeho myšlenkách víme hlavně od jeho žáka Platóna.",
      "Slovo filozofie znamená řecky láska k moudrosti.",
    ],
  },
  "tech-bridgeBuilding": {
    more: "Mosty spojily břehy řek a zkrátily cesty o celé dny. Města u brodů a mostů rostla, protože tudy chodili obchodníci.",
    facts: [
      "Před Karlovým mostem stál v Praze kamenný Juditin most z dvanáctého století. Strhla ho povodeň v roce 1342.",
      "Římané stavěli mosty z kamenných oblouků, které drží samy svou vahou.",
    ],
  },
  "tech-engineering": {
    more: "Inženýři vymysleli stroje, které ulehčily práci, kladky, jeřáby, vodní mlýny a obléhací stroje.",
    facts: [
      "Archimédés prý řekl, že by pohnul Zemí, kdyby měl pevný bod a dost dlouhou tyč.",
      "Římské akvadukty vedly vodu desítky kilometrů a sklon měly tak malý, že voda tekla jen pomalu.",
    ],
  },
  "tech-feudalism": {
    more: "Ve feudalismu dostali šlechtici od krále půdu a za ni mu slibovali věrnost a vojáky. Rolníci obdělávali půdu pána a odváděli mu část úrody.",
    facts: [
      "Poddaní se nesměli bez svolení pána odstěhovat ani oženit s někým z jiného panství.",
      "Robotu v Rakousku zrušili až v roce 1848.",
    ],
  },
  "tech-chivalry": {
    more: "Rytíři bojovali na koních v těžké zbroji a měli dodržovat pravidla cti, chránit slabé a být věrní pánovi.",
    facts: [
      "Plátová zbroj vážila asi patnáct až pětadvacet kilogramů. Rytíř v ní zvládl vyskočit na koně i bez pomoci.",
      "Na turnajích se rytíři utkávali kopím. Vítěz často získal koně a zbroj poraženého.",
    ],
  },
  "tech-medicine": {
    more: "Lékaři se učili poznat nemoci, zahojit rány a vyrobit léky z bylin. Hodně dlouho ale nevěděli, že nemoci způsobují drobné bakterie.",
    facts: [
      "Lékař Ignác Semmelweis přišel na to, že když si lékaři myjí ruce, umírá méně matek po porodu.",
      "Alexander Fleming objevil penicilin náhodou, když mu na zapomenuté misce vyrostla plíseň.",
    ],
  },
  "tech-university": {
    more: "Na univerzitách se učitelé a studenti scházeli, aby studovali teologii, práva, medicínu a svobodná umění.",
    facts: [
      "Nejstarší univerzita v Evropě je v italské Boloni. Učí se na ní od roku 1088.",
      "Studenti ve středověku se dělili podle zemí, odkud přišli, na takzvané národy.",
    ],
  },
  "tech-banking": {
    more: "Banky půjčovaly peníze panovníkům i obchodníkům a schovávaly úspory. Obchodník mohl cestovat jen se směnkou a nemusel vozit truhlu zlata.",
    facts: [
      "Florentská rodina Medici zbohatla na bankovnictví a platila umělce jako Michelangela.",
      "Nejstarší banka, která funguje dodnes, je italská Monte dei Paschi di Siena z roku 1472.",
    ],
  },
  "tech-navigation": {
    more: "Námořníci se naučili určit polohu podle hvězd, Slunce a kompasu. Mohli se odvážit dál od pobřeží.",
    facts: [
      "Délku na moři neuměl nikdo přesně změřit, dokud John Harrison nesestrojil přesné lodní hodiny.",
      "Kryštof Kolumbus si myslel, že doplul do Indie. Proto se původním obyvatelům Ameriky říkalo Indiáni.",
    ],
  },
  "tech-religion": {
    more: "Náboženství spojovalo lidi ve společné víře, svátcích a pravidlech. Kolem chrámů a klášterů vznikaly školy, nemocnice a knihovny.",
    facts: [
      "Kláštery ve středověku opisovaly knihy a uchovaly tak mnoho starověkých spisů.",
      "Na světě je dnes přes čtyři miliardy lidí, kteří patří k některému z velkých světových náboženství.",
    ],
  },
  "tech-physics": {
    more: "Fyzika zkoumá, jak se věci pohybují, proč padají, jak se šíří světlo a zvuk. Pomocí ní lidé postavili lepší stroje.",
    facts: [
      "Galileo prý pouštěl koule z šikmé věže v Pise. Ve skutečnosti je hlavně kutálel po nakloněné desce a měřil čas.",
      "Zvuk se ve vzduchu šíří rychlostí asi tři sta čtyřicet metrů za sekundu. Proto slyšíme hrom až po blesku.",
    ],
  },
  "tech-invention": {
    more: "Vynálezci zkoušeli nové stroje a nástroje. Z dílen renesance vyšly přesné hodiny, tiskařský lis i první dalekohledy.",
    facts: [
      "Leonardo da Vinci nakreslil návrhy létacích strojů, potápěčského obleku i tanku. Většinu z nich nikdy nepostavil.",
      "Knihtisk zlevnil knihy natolik, že si je mohli koupit i obyčejní měšťané.",
    ],
  },
  "tech-gunpowder": {
    more: "Střelný prach vymysleli Číňané, když hledali elixír nesmrtelnosti. Nejdřív ho používali na ohňostroje a zápalné šípy.",
    facts: [
      "Střelný prach je směs ledku, síry a dřevěného uhlí.",
      "S děly ztratily kamenné hrady svou sílu a vznikly nízké pevnosti s tlustými valy.",
    ],
  },
  "tech-theoryOfGravity": {
    more: "Isaac Newton popsal, že stejná síla, která táhne jablko k zemi, drží Měsíc na oběžné dráze kolem Země.",
    facts: [
      "Díky Newtonovým zákonům předpověděl Edmond Halley návrat komety, která dnes nese jeho jméno.",
      "Na Měsíci bys vážil šestkrát méně než na Zemi a vyskočil bys šestkrát výš.",
    ],
  },
  "tech-magnetism": {
    more: "Magnetka kompasu ukazuje k severu, protože Země je obrovský magnet. Díky tomu se dalo plout i za mlhy.",
    facts: [
      "Polární záře vzniká, když částice ze Slunce narazí do magnetického pole Země.",
      "Někteří ptáci a želvy se při dlouhých cestách orientují podle magnetického pole.",
    ],
  },
  "tech-steamEngine": {
    more: "Parní stroj proměnil teplo z uhlí v pohyb. Poháněl čerpadla v dolech, stroje v továrnách, lokomotivy i lodě.",
    facts: [
      "První parní stroje čerpaly vodu z dolů, aby horníci mohli kopat hlouběji.",
      "Hérón z Alexandrie sestrojil točící se kouli poháněnou párou už v prvním století.",
    ],
  },
  "tech-chemistry": {
    more: "Chemie vyrostla z alchymie. Alchymisté chtěli vyrobit zlato a cestou objevili mnoho látek a postupů.",
    facts: [
      "Na dvoře Rudolfa II. v Praze pracovali alchymisté. Ulička na Pražském hradě se ale jmenuje Zlatá podle zlatníků.",
      "Voda je složená z vodíku a kyslíku. Oba jsou plyny, a přece z nich vznikne kapalina.",
    ],
  },
  "tech-metallurgy": {
    more: "Hutníci se naučili odlévat kanóny, zvony i stroje a vyrábět lepší železo ve vysokých pecích.",
    facts: [
      "Nejstarší zvony se odlévaly přímo u kostela, protože převážet je bylo těžké.",
      "Zvon Zikmund ve svatovítské katedrále váží přes třináct tun a je největší v Česku.",
    ],
  },
  "tech-democracy": {
    more: "V demokracii vládnou zástupci, které si lidé svobodně zvolí, a po čase je mohou vyměnit. Platí svoboda slova a soudy nezávislé na vládě.",
    facts: [
      "Ve starých Athénách mohli hlasovat jen svobodní muži. Ženy, otroci a cizinci hlasovat nesměli.",
      "Athéňané jednou za rok mohli střepinou s vyrytým jménem vypovědět politika, který měl příliš velkou moc.",
    ],
  },
  "tech-railroad": {
    more: "Železnice zkrátila cestu z týdnů na hodiny. Lidé začali jezdit za prací, na výlety a do lázní.",
    facts: [
      "Kvůli železnici se zavedl jednotný čas. Předtím měla každá obec svůj čas podle Slunce.",
      "První parostrojní železnice v českých zemích vedla od roku 1839 z Vídně do Břeclavi a dál na Moravu.",
    ],
  },
  "tech-conscription": {
    more: "Branná povinnost znamená, že každý mladý muž musí určitý čas sloužit v armádě. Státy tak měly obrovská vojska.",
    facts: [
      "V Česku se povinná vojenská služba zrušila v roce 2004. Od té doby je armáda složená z dobrovolníků.",
      "Před zavedením branné povinnosti bojovali hlavně žoldnéři, kteří se nechali najmout za peníze.",
    ],
  },
  "tech-explosives": {
    more: "Výbušniny pomohly razit tunely, těžit kámen a stavět silnice v horách. Zároveň změnily války.",
    facts: [
      "Nitroglycerin byl tak nebezpečný, že vybuchl i při otřesu. Nobel ho nechal nasáknout do křemeliny, jemného prášku ze schránek řas, a vznikl bezpečnější dynamit.",
      "Při stavbě Gotthardského tunelu ve Švýcarsku se v devatenáctém století hojně používal dynamit.",
    ],
  },
  "tech-electricity": {
    more: "Elektřina rozsvítila města, rozjela tramvaje a poháněla stroje v továrnách. Dnes bez ní nefunguje skoro nic.",
    facts: [
      "Benjamin Franklin pouštěl za bouřky draka, aby ukázal, že blesk je elektřina. Bylo to velmi nebezpečné.",
      "Blesk je pětkrát teplejší než povrch Slunce.",
    ],
  },
  "tech-atomicTheory": {
    more: "Vědci zjistili, že všechno kolem nás se skládá z atomů a ty z ještě menších částic, protonů, neutronů a elektronů.",
    facts: [
      "Myšlenka atomů je stará přes dva tisíce let. Řecký filozof Démokritos věřil, že hmota se nedá dělit do nekonečna.",
      "Atom je skoro celý prázdný. Kdyby bylo jádro velké jako hrášek, elektrony by kroužily daleko na okraji fotbalového stadionu.",
    ],
  },
  "tech-industrialization": {
    more: "Továrny se stroji vyráběly látky, nástroje i nádobí mnohem rychleji a levněji než řemeslníci. Lidé se stěhovali z vesnic do měst.",
    facts: [
      "Ostrava a Kladno vyrostly díky uhlí a železárnám z malých obcí na průmyslová města.",
      "Tkalcovský stav poháněný párou zvládl práci mnoha tkalců najednou.",
    ],
  },
  "tech-corporation": {
    more: "Velké firmy spojily peníze mnoha lidí a mohly stavět železnice, doly a obří továrny. Kdo koupil akcii, vlastnil kousek firmy.",
    facts: [
      "První akciovou společností s obchodovatelnými akciemi byla Nizozemská Východoindická společnost z roku 1602.",
      "Škoda v Plzni vyráběla stroje, lokomotivy i zbraně a byla jedním z největších podniků v Rakousku-Uhersku.",
    ],
  },
  "tech-steel": {
    more: "Ocel je železo s malým množstvím uhlíku. Je pevná a pružná, a tak se z ní stavěly mosty, lodě, kolejnice i mrakodrapy.",
    facts: [
      "Eiffelova věž je ze železa a skládá se z osmnácti tisíc dílů spojených nýty.",
      "Ocel se dá recyklovat znovu a znovu, aniž by ztratila své vlastnosti.",
    ],
  },
  "tech-refining": {
    more: "Z ropy se v rafinerii vyrábí benzín, nafta, petrolej, asfalt i suroviny pro plasty.",
    facts: [
      "Ropa vznikla z drobných mořských organismů, které se miliony let měnily pod zemí.",
      "Ropa se měří v barelech. Jeden barel má asi sto padesát devět litrů.",
    ],
  },
  "tech-electronics": {
    more: "Elektronika řídí proud v drobných součástkách. Díky ní vzniklo rádio, televize, počítače i mobilní telefony.",
    facts: [
      "První rádia měla velké skleněné elektronky, které se hodně zahřívaly a často praskaly.",
      "Tranzistor vynalezli v roce 1947 v amerických Bellových laboratořích.",
    ],
  },
  "tech-communism": {
    more: "Komunisté chtěli společnost bez soukromého vlastnictví továren a půdy, kde se o majetek dělí všichni. Ve skutečnosti v takových zemích vládla jedna strana a lidé neměli svobodu.",
    facts: [
      "Myšlenky komunismu sepsali Karl Marx a Friedrich Engels v Komunistickém manifestu z roku 1848.",
      "Za komunistické vlády v Československu se nesmělo volně cestovat na Západ a hranice hlídal ostnatý drát.",
    ],
  },
  "tech-combustion": {
    more: "Ve spalovacím motoru shoří palivo přímo uvnitř válce. Motor je proto menší a lehčí než parní stroj a hodí se do aut i letadel.",
    facts: [
      "Benzín se dlouho prodával v lékárnách jako čisticí prostředek.",
      "Bertha Benzová podnikla v roce 1888 první dlouhou jízdu autem a cestou kupovala benzín v lékárně.",
    ],
  },
  "tech-automobile": {
    more: "Auta dovolila lidem jezdit, kam chtějí a kdy chtějí. Města se začala stavět kolem silnic a parkovišť.",
    facts: [
      "V Anglii platil zákon, podle kterého musel před autem chodit člověk s červenou vlajkou.",
      "Laurin a Klement v Mladé Boleslavi začali s jízdními koly, potom vyráběli motocykly a od roku 1905 i auta.",
    ],
  },
  "tech-flight": {
    more: "Bratři Wrightové vzlétli poprvé v roce 1903. Jejich let trval dvanáct sekund a urazil kratší vzdálenost, než je dnes délka dopravního letadla.",
    facts: [
      "Bratři Wrightové předtím vyráběli a opravovali jízdní kola.",
      "Už v roce 1783 vzlétli lidé v Paříži v horkovzdušném balonu bratří Montgolfierů.",
    ],
  },
  "tech-advancedFlight": {
    more: "Proudové motory umožnily letadlům letět výš a rychleji. Dnes je ve vzduchu v jednu chvíli přes deset tisíc letadel.",
    facts: [
      "Dopravní letadla létají asi ve výšce deset kilometrů, kde je vzduch řidší a let spotřebuje méně paliva.",
      "Největší dopravní letadlo Airbus A380 uveze přes pět set cestujících.",
    ],
  },
  "tech-massProduction": {
    more: "Při sériové výrobě dělá každý dělník stále stejný krok a výrobek jede dál po pásu. Výroba se zrychlila a zboží zlevnilo.",
    facts: [
      "Henry Ford zkrátil výrobu jednoho auta z dvanácti hodin na hodinu a půl.",
      "Fordova auta byla dlouho jen černá. Černá barva prý schla nejrychleji.",
    ],
  },
  "tech-laborUnion": {
    more: "Odbory jsou spolky zaměstnanců. Společně mohou s majiteli vyjednat lepší mzdy, kratší pracovní dobu a bezpečnější práci.",
    facts: [
      "Dělníci v devatenáctém století pracovali i čtrnáct hodin denně a šest dní v týdnu.",
      "Volné soboty se v Československu zavedly až v roce 1968.",
    ],
  },
  "tech-geneticEngineering": {
    more: "Genetické inženýrství mění geny rostlin, zvířat i bakterií. Bakterie dnes vyrábějí třeba inzulin pro lidi s cukrovkou.",
    facts: [
      "Gregor Mendel zkoumal dědičnost na hrachu v klášteře v Brně a je považovaný za zakladatele genetiky.",
      "Vědci vložili do ryb a myší gen medúzy, a ta zvířata pak svítí zeleně.",
    ],
  },
  "tech-computers": {
    more: "Počítače zvládnou miliardy výpočtů za sekundu. Řídí letadla, banky, nemocnice i hry, které hrajeme.",
    facts: [
      "První elektronické počítače zabíraly celé místnosti a vážily desítky tun.",
      "Slovo bug pro chybu v programu se proslavilo poté, co v roce 1947 našli v počítači zaseklou můru.",
    ],
  },
  "tech-rocketry": {
    more: "Raketa letí tak, že z ní vysokou rychlostí proudí plyn dozadu. Funguje i ve vzduchoprázdnu, kde se nemá od čeho odrazit.",
    facts: [
      "Konstantin Ciolkovskij byl učitel matematiky a už v roce 1903 spočítal, jak by raketa mohla doletět do vesmíru.",
      "Raketa Saturn V, se kterou lidé letěli na Měsíc, byla vysoká přes sto deset metrů.",
    ],
  },
  "tech-nuclearFission": {
    more: "Při štěpení se těžké jádro uranu rozpadne na dvě menší a uvolní obrovskou energii. Kilogram uranu dá tolik energie jako tisíce tun uhlí.",
    facts: [
      "Lise Meitnerová vysvětlila štěpení jádra jako první, Nobelovu cenu za objev ale dostal jen Otto Hahn.",
      "V Africe v Gabonu našli vědci místo, kde se uran před dvěma miliardami let sám štěpil jako přírodní reaktor.",
    ],
  },
  "tech-spaceFlight": {
    more: "V roce 1957 vypustil Sovětský svaz první umělou družici Sputnik. O čtyři roky později vzlétl Jurij Gagarin jako první člověk do vesmíru.",
    facts: [
      "Mezinárodní vesmírná stanice obletí Zemi zhruba za devadesát minut. Astronauti na ní vidí šestnáct východů Slunce denně.",
      "První živým tvorem na oběžné dráze byla fenka Lajka.",
    ],
  },
  "tech-plastics": {
    more: "Plasty jsou lehké, levné a dají se vytvarovat do čehokoli. Proto jsou všude, od hraček po součástky letadel.",
    facts: [
      "Bakelit z roku 1907 byl první plast vyrobený úplně uměle. Dělaly se z něj telefony a rádia.",
      "Plastová lahev se v přírodě rozkládá stovky let. Proto je důležité plasty třídit.",
    ],
  },
  "tech-robotics": {
    more: "Roboti dělají práci, která je pro lidi těžká, nebezpečná nebo nudná. Svářejí auta, třídí balíky a zkoumají jiné planety.",
    facts: [
      "První průmyslový robot Unimate začal pracovat v továrně na auta v roce 1961.",
      "Robotické vozítko Curiosity jezdí po Marsu od roku 2012.",
    ],
  },
  "tech-superconductor": {
    more: "Supravodič vede elektrický proud úplně bez odporu. Zatím to ale většinou zvládne jen při obrovském mrazu.",
    facts: [
      "Supravodivost objevil nizozemský fyzik Heike Kamerlingh Onnes v roce 1911 ve rtuti ochlazené skoro na absolutní nulu.",
      "Supravodivé magnety jsou v přístrojích pro magnetickou rezonanci v nemocnicích.",
    ],
  },
  "tech-nuclearPower": {
    more: "Jaderná elektrárna vyrábí elektřinu z tepla štěpení uranu. Nevypouští kouř, ale vyhořelé palivo se musí bezpečně uložit na velmi dlouhou dobu.",
    facts: [
      "První jaderná elektrárna připojená k síti začala dodávat proud v roce 1954 v Obninsku u Moskvy.",
      "Z chladicích věží jaderné elektrárny stoupá jen vodní pára.",
    ],
  },
  "tech-recycling": {
    more: "Recyklace dělá z odpadu nové suroviny. Ušetří se tak dřevo, ropa, kovy i energie a ubude skládek.",
    facts: [
      "Z recyklovaného papíru se dá papír vyrobit znovu asi pětkrát až sedmkrát, pak jsou vlákna příliš krátká.",
      "Sklo se dá recyklovat donekonečna a pořád zůstane stejně dobré.",
    ],
  },
  "tech-fusionPower": {
    more: "Jaderná fúze by vyráběla energii z vodíku, kterého je v mořské vodě obrovské množství. Odpadem je neškodné helium.",
    facts: [
      "Plazma v tokamaku je mnohokrát teplejší než střed Slunce, přes sto milionů stupňů.",
      "V roce 2022 se v americké laboratoři poprvé podařilo získat z fúze víc energie, než do paliva dodaly lasery.",
    ],
  },
};
