/**
 * Encyclopedia pages for everything in the game except technologies (those
 * live in encyclopedia.ts): units, buildings, wonders, governments, terrain
 * and improvements. Keys match the picture files in src/web/codex/ and the
 * lists in tools/mac/encyklopedie-*.tsv. Each text is written for a curious
 * child and checked against the linked article on the Czech Wikipedia.
 */

export interface CodexPage {
  /** Rough time, as a reader would say it; missing for timeless things like terrain. */
  when?: string;
  text: string;
  fact: string;
  /** Title of the article on cs.wikipedia.org. */
  wiki: string;
}

export const CODEX_PAGES: Record<string, CodexPage> = {
  // ---------- units ----------
  "unit-settlers": {
    when: "od pravěku",
    text: "Osadníci byli lidé, kteří opustili rodnou vesnici a vydali se hledat novou půdu. Vzali s sebou nářadí a osivo, vykáceli les a postavili domy. Tak vznikla většina vesnic a měst, které dnes známe. Ve středověku zvali čeští panovníci osadníky z německých zemí, aby obdělávali pohraniční hory.",
    fact: "Mnoho českých vesnic prozradí, jak vznikly, už svým jménem. Názvy jako Lhota nebo Ves připomínají, že se tu kdysi usadili noví osadníci.",
    wiki: "Kolonizace",
  },
  "unit-warriors": {
    when: "od pravěku",
    text: "První bojovníci neměli žádné brnění ani kovové zbraně. Bránili své tlupy kyji a oštěpy s kamenným hrotem. Válčilo se o lovecká území a o vodu. Ze zkušených válečníků se časem stali náčelníci a později i první králové.",
    fact: "Archeologové našli pravěké lebky se stopami po úderech kyjem. Prozrazují, že se lidé bili už dávno předtím, než vznikla první města.",
    wiki: "Válečník",
  },
  "unit-spearmen": {
    when: "asi od 7. století př. n. l.",
    text: "Řečtí hoplité byli pěšáci s velkým kulatým štítem a dlouhým kopím. Stáli v těsných řadách, kterým se říká falanga, a štíty se navzájem kryli. Nepřítel před sebou viděl zeď ze štítů a ostnů. Výzbroj si každý voják kupoval sám, a tak sloužili hlavně svobodní občané, kteří na ni měli.",
    fact: "Slovo hoplíta pochází z řeckého hoplon, jak se říkalo velkému štítu. Vojáka tedy pojmenovali podle jeho štítu.",
    wiki: "Hoplíté",
  },
  "unit-horsemen": {
    when: "asi od roku 1000 př. n. l.",
    text: "Když se lidé naučili jezdit na koni, mohli bojovat mnohem rychleji než pěšáci. Kočovníci z euroasijských stepí trávili v sedle celý život a uměli střílet i házet oštěpy za jízdy. Jízda dokázala nepřítele obejít a zase rychle zmizet. Dlouho neměli jezdci ani třmeny, drželi se jen koleny.",
    fact: "Třmeny přišly do Evropy až ve středověku. Do té doby jezdec při prudkém úderu snadno spadl z koně.",
    wiki: "Jízda",
  },
  "unit-archers": {
    when: "asi před 20 000 lety",
    text: "Luk dovolil zasáhnout zvíře nebo nepřítele na velkou vzdálenost. Lučištníci stáli za řadami pěšáků a stříleli šípy přes jejich hlavy. Dobrý lučištník trénoval od dětství, protože napnout silný luk chce hodně síly. Angličtí lučištníci s dlouhými luky vyhrávali ve středověku i bitvy proti rytířům.",
    fact: "V Anglii platil ve středověku zákon, podle kterého museli muži každou neděli po mši cvičit střelbu z luku.",
    wiki: "Lučištník",
  },
  "unit-swordsmen": {
    when: "od 4. století př. n. l.",
    text: "Římská legie byla nejlépe vycvičená armáda starověku. Legionáři měli helmu, pancíř, velký obdélníkový štít a krátký meč, kterým bodali zpoza štítů. Uměli pochodovat desítky kilometrů denně a večer si postavit opevněný tábor. Římané s nimi dobyli celé Středomoří.",
    fact: "Legionáři také stavěli silnice a mosty. Mnoho římských silnic se v Evropě používá dodnes.",
    wiki: "Římská legie",
  },
  "unit-chariot": {
    when: "asi od roku 2000 př. n. l.",
    text: "Válečný vůz byl lehký vůz se dvěma koly, který táhli koně. Stál na něm vozataj a vedle něj lučištník nebo kopiník. Vozy se řítily proti nepříteli a lučištníci z nich stříleli. Používali je Egypťané i Číňané a dlouho patřily k nejobávanějším zbraním starověku.",
    fact: "V Tutanchamonově hrobce našli archeologové šest válečných vozů. Některé byly zdobené zlatem.",
    wiki: "Válečný vůz",
  },
  "unit-catapult": {
    when: "od 4. století př. n. l.",
    text: "Katapult je obléhací stroj, který vrhá kameny nebo oštěpy. Sílu mu dávají zkroucená lana ze šlach nebo vlasů, která se po uvolnění prudce narovnají. S katapulty se bořily hradby a útočilo na obránce z bezpečné vzdálenosti. Vymysleli je Řekové a Římané je zdokonalili.",
    fact: "Ve středověku se obléhací stroje jmenovaly třeba trebuchet. Dokázal přehodit přes hradby i kámen těžký jako malé auto.",
    wiki: "Katapult",
  },
  "unit-knights": {
    when: "od 10. století",
    text: "Rytíř byl obrněný bojovník na koni, který sloužil svému pánovi a za to dostal půdu. Na sobě měl kroužkovou zbroj a později plátovou, která vážila přes dvacet kilo. Do bitvy vyrážel s dlouhým kopím a štítem, na kterém měl svůj erb. Rytíři se měli řídit pravidly cti, kterým se říká rytířský kodex.",
    fact: "Rytíř se na boj připravoval od dětství. Nejdřív sloužil jako páže, pak jako panoš, a pasován na rytíře byl kolem dvaceti let.",
    wiki: "Rytíř",
  },
  "unit-musketeers": {
    when: "od 16. století",
    text: "Mušketýři byli vojáci se střelnou zbraní zvanou mušketa. Nabít ji trvalo skoro minutu, protože se do hlavně musel nasypat prach a pak upěchovat kulka. Proto stáli v řadách a střídali se, aby někdo vždy mohl vystřelit. Muškety pomalu vytlačily z bojišť rytíře i lučištníky.",
    fact: "Slavní tři mušketýři z románu Alexandra Dumase sloužili francouzskému králi Ludvíku XIII. Skuteční královští mušketýři opravdu existovali.",
    wiki: "Mušketýr",
  },
  "unit-cannon": {
    when: "od 14. století",
    text: "Kanón vystřeluje těžké koule pomocí střelného prachu. První děla byla obrovská a nepřesná, ale dokázala prorazit i silné hradby. Později se děla zmenšila a dostala kola, takže je koně mohli táhnout s armádou. V době Napoleona rozhodovala dělostřelba o mnoha bitvách.",
    fact: "Husité ve 15. století používali lehká děla na vozech. Jedno z nich se jmenovalo houfnice a toto české slovo se pak rozšířilo do mnoha jazyků.",
    wiki: "Kanón",
  },
  "unit-riflemen": {
    when: "od 19. století",
    text: "Puška má v hlavni spirálové drážky, které kulku roztočí. Díky tomu letí dál a přesněji než z muškety. Pěšáci s puškami se nabíjeli rychleji a mohli střílet vleže nebo ze zákopu. V první světové válce stály proti sobě miliony takových vojáků.",
    fact: "Slavnou puškou byl rakousko-uherský Mannlicher. Nosili ho i čeští vojáci a vyráběl se ve Steyru.",
    wiki: "Pěchota",
  },
  "unit-artillery": {
    when: "od 20. století",
    text: "Moderní dělostřelectvo střílí granáty na vzdálenost desítek kilometrů. Děla mají dlouhé hlavně a často je táhnou nákladní auta, některá jezdí sama. Kam mají mířit, jim počítají dělostřelci podle map a měření. Dělostřelectvo se proto někdy přezdívá bůh války.",
    fact: "Česká armáda používá samohybnou houfnici Dana. Je to dělo postavené na nákladním autě Tatra a vymysleli ho v Československu.",
    wiki: "Dělostřelectvo",
  },
  "unit-mechInf": {
    when: "od druhé poloviny 20. století",
    text: "Mechanizovaná pěchota jezdí do boje v obrněných vozidlech. Vozidlo vojáky chrání před střelbou, a když dojedou na místo, vystoupí zadními dveřmi. Mívá i vlastní kanón nebo kulomet, takže pěšákům pomáhá. Pěchota tak stačí tempu tanků.",
    fact: "Československá armáda měla bojové vozidlo pěchoty BVP. Vyrábělo se mimo jiné v Podpolianských strojírnách na Slovensku.",
    wiki: "Bojové vozidlo pěchoty",
  },
  "unit-tank": {
    when: "od roku 1916",
    text: "Tank je obrněné vozidlo na pásech s otočnou věží a kanónem. Poprvé se objevil v první světové válce, kdy měl překonat zákopy a ostnaté dráty. Pásy mu dovolí jet terénem, kde by auto uvízlo. Ve druhé světové válce už tanky rozhodovaly velké bitvy.",
    fact: "Slovo tank vzniklo jako krycí jméno. Britové tvrdili, že stavějí nádrže na vodu, anglicky tank, aby nepřítel nepoznal, o co jde.",
    wiki: "Tank",
  },
  "unit-diplomat": {
    when: "od starověku",
    text: "Diplomat jedná jménem své země s cizími panovníky a vládami. Vyjednává smlouvy o míru a obchodu a zjišťuje, co sousedé chystají. Velvyslanectví bývá v hlavním městě cizí země a platí pro něj zvláštní ochrana. Diplomat musí umět dobře mluvit a ještě lépe naslouchat.",
    fact: "Velvyslance chrání pravidla, kterým se říká diplomatická imunita. Země hostitele ho nesmí zatknout ani soudit.",
    wiki: "Diplomat",
  },
  "unit-caravan": {
    when: "od starověku",
    text: "Karavana je skupina obchodníků, kteří cestují společně, aby se ubránili lupičům. Přes pouště je nesli velbloudi, kteří vydrží dlouho bez vody. Po Hedvábné stezce putovalo z Číny do Evropy hedvábí a porcelán. Karavany zastavovaly v oázách a karavanserajích, kde mohli lidé i zvířata odpočinout.",
    fact: "Velbloud dokáže najednou vypít přes sto litrů vody. Pak vydrží v poušti i dva týdny bez pití.",
    wiki: "Karavana",
  },
  "unit-trireme": {
    when: "od 7. století př. n. l.",
    text: "Triéra byla řecká válečná loď se třemi řadami vesel nad sebou. Veslovalo na ní asi 170 veslařů a na přídi měla bronzové beranidlo. Loď se rozjela a nepřátelské lodi probodla bok. Na otevřené moře se triéry nepouštěly a držely se blízko pobřeží.",
    fact: "Řecké triéry porazily v roce 480 př. n. l. perské loďstvo u ostrova Salamína. Je to jedna z nejslavnějších námořních bitev dějin.",
    wiki: "Triéra",
  },
  "unit-sail": {
    when: "od 15. století",
    text: "Karavela byla malá a rychlá plachetnice, se kterou portugalští mořeplavci objevovali svět. Měla trojúhelníkové plachty, takže dokázala plout i proti větru. Na karavelách obepluli Afriku a Kryštof Kolumbus na nich doplul do Ameriky. Začala tak doba velkých zámořských objevů.",
    fact: "Kolumbus v roce 1492 vyplul se třemi loďmi. Pinta a Niña byly karavely, vlajková loď Santa María byla větší.",
    wiki: "Karavela",
  },
  "unit-frigate": {
    when: "od 17. století",
    text: "Fregata byla rychlá válečná plachetnice se třemi stěžni a jednou palubou děl. Byla menší než řadové lodě, ale rychlejší, a tak sloužila jako průzkumník a lovkyně pirátů. Na palubě žilo i přes dvě stě námořníků. Fregaty doprovázely obchodní lodě přes oceány.",
    fact: "Americká fregata USS Constitution je stále ve službě americké armády. Spustili ji na vodu v roce 1797 a je to nejstarší loď na světě, která ještě dokáže vyplout.",
    wiki: "Fregata",
  },
  "unit-ironclad": {
    when: "od roku 1859",
    text: "Pancéřové lodě dostaly místo dřevěných boků kovové pláty. Poháněl je parní stroj, takže už nepotřebovaly vítr. Dělové koule se od pancíře odrážely a dřevěné válečné lodě byly najednou zastaralé. Vznikla tak úplně nová éra válečného loďstva.",
    fact: "V roce 1862 se v Americe utkaly dvě pancéřové lodě, Monitor a Merrimack. Hodiny po sobě střílely a ani jedna druhou nepotopila.",
    wiki: "Pancéřová loď",
  },
  "unit-cruiser": {
    when: "od konce 19. století",
    text: "Křižník je velká a rychlá válečná loď. Dokáže sám plout daleko po oceánech a chránit obchodní lodě nebo lovit nepřátelské. Má několik dělových věží a později i rakety. Je menší než bitevní loď, zato rychlejší.",
    fact: "Ruský křižník Aurora stojí jako muzeum v Petrohradu. Jeho výstřel v roce 1917 podle tradice odstartoval ruskou revoluci.",
    wiki: "Křižník",
  },
  "unit-battleship": {
    when: "od konce 19. století",
    text: "Bitevní loď byla největší a nejsilněji vyzbrojená válečná loď. Měla tlustý pancíř a obrovská děla, která střílela na desítky kilometrů. Kdo měl víc bitevních lodí, vládl mořím. Ve druhé světové válce je ale překonaly letadlové lodě.",
    fact: "Japonská bitevní loď Jamato měřila 263 metrů a její děla vystřelila granát těžký jako malé auto.",
    wiki: "Bitevní loď",
  },
  "unit-submarine": {
    when: "od začátku 20. století",
    text: "Ponorka umí plout pod hladinou, a proto ji nepřítel těžko najde. Do nádrží si napustí vodu a ponoří se, když ji vytlačí stlačeným vzduchem, vyplave nahoru. Pod vodou se dívá periskopem a útočí torpédy. Moderní ponorky s jaderným pohonem vydrží pod hladinou celé měsíce.",
    fact: "Jules Verne popsal ponorku Nautilus v románu Dvacet tisíc mil pod mořem dávno předtím, než skutečné ponorky začaly křižovat oceány.",
    wiki: "Ponorka",
  },
  "unit-transport": {
    when: "od 19. století",
    text: "Nákladní lodě převážejí zboží i lidi přes moře a oceány. Ve válkách na nich armády přepravují vojáky i tanky na jiné kontinenty. Dnes většina zboží na světě cestuje po moři v ocelových kontejnerech. Jedna velká loď jich uveze přes dvacet tisíc.",
    fact: "Kontejner vymyslel americký podnikatel Malcolm McLean v roce 1956. Díky němu se dnes velká loď naloží za pár hodin.",
    wiki: "Nákladní loď",
  },
  "unit-carrier": {
    when: "od roku 1918",
    text: "Letadlová loď je plovoucí letiště. Na rovné palubě letadla startují a přistávají, pod ní mají hangáry. Na krátkou dráhu přistávají tak, že se háčkem zachytí za lano, které je zastaví. Letadlová loď nese desítky letadel a doplouvá s nimi kamkoli na světě.",
    fact: "Největší americké letadlové lodě mají na palubě přes pět tisíc lidí. Je to víc obyvatel, než má mnoho českých měst.",
    wiki: "Letadlová loď",
  },
  "unit-fighter": {
    when: "od první světové války",
    text: "Stíhací letoun je rychlé a obratné letadlo, které chrání nebe před nepřátelskými letadly. První stíhačky v první světové válce byly dřevěné dvouplošníky s kulometem. Dnešní proudové stíhačky letí rychleji než zvuk. Piloti musí vydržet obrovské přetížení v ostrých zatáčkách.",
    fact: "Ve druhé světové válce bojovali čeští a slovenští piloti v britském královském letectvu. Jedním z nejúspěšnějších byl Josef František.",
    wiki: "Stíhací letoun",
  },
  "unit-bomber": {
    when: "od první světové války",
    text: "Bombardovací letoun nese pumy a shazuje je na cíle na zemi. Ve druhé světové válce létaly velké čtyřmotorové bombardéry daleko nad území nepřítele. Měly posádku až deseti lidí a vlastní kulomety na obranu. Dnešní bombardéry nesou i řízené střely.",
    fact: "Českoslovenští letci měli za druhé světové války v Británii vlastní bombardovací peruť s číslem 311.",
    wiki: "Bombardovací letoun",
  },
  "unit-nuclear": {
    when: "od roku 1945",
    text: "Jaderná zbraň uvolní obrovskou energii, která je ukrytá v jádrech atomů. Jediná bomba dokáže zničit celé město. Byla použita jen dvakrát, v roce 1945 proti japonským městům Hirošima a Nagasaki. Od té doby se státy snaží, aby se už nikdy nepoužila.",
    fact: "Státy uzavřely smlouvu o nešíření jaderných zbraní, která má zabránit, aby je získaly další země. Podepsala ji většina zemí světa.",
    wiki: "Jaderná zbraň",
  },

  // ---------- governments ----------
  "gov-anarchy": {
    text: "Anarchie znamená stav, kdy v zemi nikdo nevládne. Ve hře přichází po revoluci, když stará vláda padla a nová ještě nenastoupila. Úřady nefungují a nevybírají se daně. Na vědě nikdo nepracuje. Trvá naštěstí jen krátce.",
    fact: "Slovo anarchie pochází z řečtiny a znamená bez vládce.",
    wiki: "Anarchie",
  },
  "gov-despotism": {
    text: "Despota je vládce, který má neomezenou moc a nikomu se nezodpovídá. Takhle vládli první náčelníci a králové starověku. Co despota řekl, to platilo, a kdo nesouhlasil, byl potrestán. Země pod despotou se často nerozvíjela, protože lidé pracovali hlavně pro vládce.",
    fact: "Slovo despota pochází z řečtiny a znamenalo původně pán domu, který vládne svým otrokům.",
    wiki: "Despocie",
  },
  "gov-monarchy": {
    text: "V monarchii vládne panovník, král nebo královna, a vláda se dědí v rodině. Panovníkovi pomáhají šlechtici, kteří za to dostávají půdu. Země je pevně řízená a vojsko poslouchá krále. Mnoho monarchií dnes existuje dál, ale vládnou v nich parlamenty.",
    fact: "Nejdéle vládnoucí česká dynastie byli Přemyslovci. Vládli našim zemím přes čtyři sta let.",
    wiki: "Monarchie",
  },
  "gov-communism": {
    text: "Komunismus slibuje společnost, kde všechno patří všem. Ve skutečnosti v komunistických státech vládla jedna strana, která řídila továrny i život lidí. Lidé nesměli svobodně cestovat ani říkat, co si myslí. Komunistické země dokázaly rychle postavit továrny, zato v obchodech často chybělo zboží.",
    fact: "V Československu vládla komunistická strana od roku 1948 až do sametové revoluce v listopadu 1989.",
    wiki: "Komunismus",
  },
  "gov-republic": {
    text: "V republice si lidé volí své zástupce a hlavu státu. Slovo pochází z latiny a znamená věc veřejná. Ve starověkém Římě zasedal senát a dva konzulové, kteří se každý rok střídali. Občané republiky jsou na svou zemi hrdí, ale nemají rádi dlouhé války daleko od domova.",
    fact: "Československo vzniklo jako republika 28. října 1918. Prvním prezidentem byl Tomáš Garrigue Masaryk.",
    wiki: "Republika",
  },
  "gov-democracy": {
    text: "Demokracie znamená vládu lidu. Všichni dospělí občané volí, kdo je bude zastupovat, a mohou svobodně říkat, co si myslí. Vláda se musí zodpovídat parlamentu a soudům a po volbách se může vyměnit. Demokracie obvykle bohatnou, protože lidé mohou svobodně podnikat a obchodovat.",
    fact: "První demokracie vznikla ve starověkých Athénách. O důležitých věcech tam hlasovali občané na shromáždění přímo zvednutím ruky.",
    wiki: "Demokracie",
  },

  // ---------- buildings ----------
  "bld-palace": {
    text: "Palác je sídlo panovníka nebo vlády. Odtud se řídí celá země a přijímají se tu poselstva. Paláce bývají okázalé, aby každý viděl, jak je země bohatá a silná. Čím dál je město od paláce, tím hůř se z něj řídí.",
    fact: "Pražský hrad je podle Guinnessovy knihy rekordů největší starobylý hradní komplex na světě. Sídlí tu prezident republiky.",
    wiki: "Palác",
  },
  "bld-granary": {
    text: "Sýpka je stavba, ve které se skladuje obilí. Musí být suchá a chráněná před myšmi, aby zrní nezplesnivělo a nesnědli ho škůdci. Zásoby ze sýpky pomohly lidem přežít zimu i neúrodný rok. Proto se kolem sýpek mohla města zvětšovat.",
    fact: "Už ve starověkém Egyptě se stavěly obří státní sýpky. Faraon z nich rozdával obilí v letech hladu.",
    wiki: "Sýpka",
  },
  "bld-temple": {
    text: "Chrám je místo, kde se lidé setkávají se svými bohy. Kněží v něm konají obřady a lidé přinášejí dary a modlitby. Starověké chrámy byly často nejkrásnější stavbou ve městě. Chrám dává lidem pocit bezpečí a společenství.",
    fact: "Řecké chrámy byly původně pestře pomalované. Barvy časem smyl déšť, a proto je dnes známe bílé.",
    wiki: "Chrám",
  },
  "bld-walls": {
    text: "Hradby chránily města před nepřáteli. Byly vysoké a silné a stály na nich věže, odkud obránci stříleli. Brány se na noc zavíraly a hlídali je strážní. Když přišla děla, musely se hradby stavět nižší a tlustší.",
    fact: "Pražské Nové Město obehnal Karel IV. hradbou dlouhou asi tři a půl kilometru. Část jejích zbytků stojí dodnes na Vyšehradě.",
    wiki: "Hradby",
  },
  "bld-barracks": {
    text: "Kasárna jsou budovy, kde bydlí a cvičí vojáci. Mají ubikace, jídelnu, zbrojnici, stáje a velký dvůr na výcvik. Vojáci z kasáren jsou lépe připravení a disciplinovaní. Stálé armády s kasárnami se rozšířily hlavně od 17. století.",
    fact: "Slovo kasárna pochází přes italštinu z latinského casa, což znamená dům.",
    wiki: "Kasárna",
  },
  "bld-library": {
    text: "Knihovna uchovává knihy a dovoluje lidem z nich čerpat vědění. Dřív se knihy opisovaly ručně a byly velmi drahé, proto byly knihovny vzácné. Učenci v nich studovali a psali nová díla. S knihovnou se nové poznatky nezapomenou a mohou se šířit dál.",
    fact: "Klementinum v Praze má jeden z nejkrásnějších barokních knihovních sálů na světě.",
    wiki: "Knihovna",
  },
  "bld-marketplace": {
    text: "Tržiště je místo, kde se lidé scházejí, aby prodávali a kupovali. Rolníci sem vozili obilí a zeleninu, řemeslníci své výrobky. Na trhu se vybíraly poplatky, které plnily pokladnu města. Kolem tržišť rostla města, protože kde se obchoduje, tam se daří.",
    fact: "Mnoho českých měst má dodnes uprostřed velké náměstí. Bývalo to tržiště a v názvech ulic ještě najdeš Uhelný nebo Ovocný trh.",
    wiki: "Tržiště",
  },
  "bld-courthouse": {
    text: "Soud rozhoduje spory mezi lidmi a trestá ty, kdo porušili zákon. Soudce musí být spravedlivý a nestranný a vyslechnout obě strany. Když lidé vědí, že soudy fungují, nemusejí se bránit sami. Úředníci daleko od panovníka pak nemohou tak snadno krást.",
    fact: "Spravedlnost se často kreslí jako žena se zavázanýma očima a vahami v ruce. Zavázané oči znamenají, že soudí každého stejně.",
    wiki: "Soud",
  },
  "bld-harbour": {
    text: "Přístav je místo na pobřeží, kde lodě bezpečně kotví a nakládají zboží. Chrání ho hráze a vlnolamy před bouří. Kolem přístavů vznikla velká obchodní města. Rybáři v nich vykládají úlovek a z moře tak do města přichází spousta jídla.",
    fact: "Největší přístav Evropy je v nizozemském Rotterdamu. Jeho přístavní plocha je větší než celé některé české okresy.",
    wiki: "Přístav",
  },
  "bld-amphitheater": {
    text: "Amfiteátr je kruhová nebo oválná stavba, kde lidé sedí kolem arény. Římané v nich pořádali gladiátorské hry a zápasy se zvířaty. Hry byly zdarma, a tak lidé zapomněli na starosti a byli spokojenější. Největší amfiteátr je Koloseum v Římě.",
    fact: "Do římského Kolosea se vešlo asi padesát tisíc diváků a nad hledištěm šlo natáhnout obrovskou plachtu proti slunci.",
    wiki: "Amfiteátr",
  },
  "bld-aqueduct": {
    text: "Akvadukt je vodovod, který přivádí vodu do města, často z hor vzdálených desítky kilometrů. Voda tekla kanálem s nepatrným spádem, přes údolí ji nesly mosty s oblouky. Díky čisté vodě mohla města vyrůst mnohem víc. Římské akvadukty fungovaly stovky let.",
    fact: "Starověký Řím měl jedenáct akvaduktů. Každý den do něj přitékalo tolik vody, že by naplnila tisíce bazénů.",
    wiki: "Akvadukt",
  },
  "bld-cathedral": {
    text: "Katedrála je hlavní kostel, ve kterém sídlí biskup. Gotické katedrály měly vysoké věže a obrovská barevná okna. Klenby jako by se vznášely. Stavěly se desítky i stovky let a pracovaly na nich celé generace kameníků. Katedrála byla chloubou celého města.",
    fact: "Kolínská katedrála v Německu se stavěla přes šest set let. Dokončili ji až v roce 1880.",
    wiki: "Katedrála",
  },
  "bld-university": {
    text: "Univerzita je vysoká škola, kde se studenti učí od nejlepších učenců a sami bádají. První univerzity vznikly ve středověku v Itálii a ve Francii. Studovalo se na nich hlavně právo, lékařství, teologie a svobodná umění. Univerzity vychovaly lékaře i vědce.",
    fact: "Univerzitu Karlovu v Praze založil Karel IV. v roce 1348. Je to nejstarší univerzita ve střední Evropě.",
    wiki: "Univerzita",
  },
  "bld-bank": {
    text: "Banka uchovává peníze lidí a půjčuje je těm, kdo chtějí stavět nebo podnikat. Za půjčku se platí úrok a z něj banka žije. První banky vznikly ve středověké Itálii u stolů, kterým se říkalo banco. Banky dovolily obchodníkům posílat peníze bez nebezpečného vezení zlata.",
    fact: "Když banka nemohla splácet, rozbili jí věřitelé stůl. Odtud pochází slovo bankrot, rozbitá lavice.",
    wiki: "Banka",
  },
  "bld-factory": {
    text: "Továrna je velká dílna, kde stroje vyrábějí zboží ve velkém. V průmyslové revoluci poháněly stroje parní stroje a později elektřina. Továrna vyrobila za den víc látky nebo hřebíků než řemeslník za rok. Do měst s továrnami se stěhovaly tisíce lidí z venkova.",
    fact: "Plzeňská Škodovka byla na začátku 20. století jednou z největších továren v Rakousku-Uhersku.",
    wiki: "Továrna",
  },
  "bld-powerPlant": {
    text: "Tepelná elektrárna spaluje uhlí nebo plyn. Teplem ohřeje vodu na páru, která roztočí turbínu s generátorem a ten vyrábí elektřinu. Elektřina pak běží dráty do továren i domácností. Spalování ale hodně znečišťuje vzduch.",
    fact: "V Česku vyrábějí uhelné elektrárny hlavně na severu Čech, kde se uhlí těží v obrovských povrchových dolech.",
    wiki: "Tepelná elektrárna",
  },
  "bld-hydroPlant": {
    text: "Vodní elektrárna vyrábí elektřinu z padající vody. Přehrada zadrží řeku a voda pak protéká turbínami, které roztočí generátory. Nevzniká při tom kouř ani popel. Přehrady navíc chrání krajinu před povodněmi.",
    fact: "Největší vodní elektrárna v Česku stojí na Vltavě v Orlíku. Přehrada má hráz vysokou přes devadesát metrů.",
    wiki: "Vodní elektrárna",
  },
  "bld-nuclearPlant": {
    text: "Jaderná elektrárna získává energii štěpením atomů uranu. Teplo z reaktoru ohřeje vodu na páru a ta roztočí turbínu. Z malého množství paliva vznikne obrovské množství elektřiny a vzduch se nešpiní. Použité palivo je ale nebezpečné a musí se bezpečně uložit na velmi dlouhou dobu.",
    fact: "Česko má dvě jaderné elektrárny, Dukovany a Temelín. Velké věže, které z nich vidíš, jsou chladicí věže a stoupá z nich jen pára.",
    wiki: "Jaderná elektrárna",
  },
  "bld-manufacturingPlant": {
    text: "Moderní továrny pracují s roboty. Robotická ramena svařují a lakují rychleji a přesněji než lidé. Lidé roboty programují a opravují. Díky nim se vyrobí víc aut nebo elektroniky za kratší dobu.",
    fact: "Slovo robot vymyslel Josef Čapek pro hru svého bratra Karla Čapka R.U.R. z roku 1920. Dnes ho zná celý svět.",
    wiki: "Průmyslový robot",
  },
  "bld-massTransit": {
    text: "Městská hromadná doprava vozí lidi po městě tramvajemi, autobusy, metrem nebo trolejbusy. Jeden autobus odveze tolik lidí jako desítky aut. Ve městě je pak méně zácp i smogu. Velká města by bez hromadné dopravy nemohla fungovat.",
    fact: "Pražské metro jezdí od roku 1974. Nejhlouběji leží stanice Náměstí Míru, skoro padesát metrů pod zemí.",
    wiki: "Městská hromadná doprava",
  },
  "bld-recyclingCenter": {
    text: "Recyklace znamená, že se z odpadu vyrobí něco nového. Ze starého papíru vznikne nový papír, z plastových lahví vlákna na oblečení a ze skla nové sklo. Šetří se tím suroviny a méně odpadu skončí na skládkách. Proto se odpad třídí do barevných kontejnerů.",
    fact: "Hliníková plechovka se dá recyklovat znovu a znovu. Z recyklovaného hliníku může být nová plechovka v obchodě už za pár týdnů.",
    wiki: "Recyklace",
  },
  "bld-researchLab": {
    text: "Výzkumné centrum je laboratoř, kde vědci zkoumají nové věci a vymýšlejí nové technologie. Pracují tu s mikroskopy a přístroji, které změří i nepatrné věci. Výzkum stojí hodně peněz, přináší ale nové léky i vynálezy. Vědci z mnoha zemí přitom spolupracují.",
    fact: "Ve švýcarském CERNu pracují vědci z celého světa včetně Česka. Právě tam vznikl web, na kterém dnes běží celý internet.",
    wiki: "Laboratoř",
  },
  "bld-coastalFortress": {
    text: "Pobřežní pevnosti chránily přístavy a města u moře před nepřátelskými loďmi. Stály na skalách nad vjezdem do přístavu a měly těžká děla, která mířila na moře. Silné zdi odolaly i palbě z lodí. Kdo ovládal pobřežní pevnosti, ovládal i přístav.",
    fact: "Pevnost na skále Gibraltar u jižního cípu Španělska hlídá vjezd do Středozemního moře už stovky let.",
    wiki: "Pobřežní dělostřelectvo",
  },
  "bld-sdiDefense": {
    text: "Protiraketová obrana má zachytit nepřátelskou raketu dřív, než dopadne. Radary sledují oblohu a při útoku vystřelí obranné střely, které raketu zničí ve vzduchu. Jde o velmi složitou techniku, protože rakety letí obrovskou rychlostí. Ve hře chrání město a okolí před jadernými útoky.",
    fact: "Americký prezident Ronald Reagan ohlásil v roce 1983 plán obrany proti raketám z vesmíru. Novináři mu podle filmu přezdívali Hvězdné války.",
    wiki: "Protiraketová obrana",
  },
  "bld-ssStructural": {
    text: "Velké vesmírné stavby se skládají z dílů na oběžné dráze. Nosná konstrukce drží pohromadě motory a moduly. Astronauti při montáži pracují ve skafandrech venku ve volném vesmíru. Takhle vznikla Mezinárodní vesmírná stanice.",
    fact: "Mezinárodní vesmírná stanice obletí Zemi zhruba za hodinu a půl. Astronauti na ní vidí východ slunce asi šestnáctkrát denně.",
    wiki: "Mezinárodní vesmírná stanice",
  },
  "bld-ssComponent": {
    text: "Raketový motor spaluje palivo a vzniklé plyny vyletují obrovskou rychlostí tryskou dozadu. Raketa se tím odráží dopředu, stejně jako balónek, ze kterého uniká vzduch. Na rozdíl od letadla si raketa veze i kyslík, a proto funguje i ve vzduchoprázdnu. Čím silnější motory, tím rychleji loď doletí.",
    fact: "Motory rakety Saturn V, která letěla na Měsíc, spálily za každou sekundu víc než deset tun paliva.",
    wiki: "Raketový motor",
  },
  "bld-ssModule": {
    text: "Modul je část vesmírné lodi, ve které lidé žijí a pracují. Musí mít vzduch, vodu, jídlo a ochranu před mrazem i zářením. Solární panely z něj vyrábějí elektřinu ze slunce. Na dlouhou cestu k jiné hvězdě by lidé potřebovali celé malé město ve vesmíru.",
    fact: "Prvním člověkem ve vesmíru byl v roce 1961 Jurij Gagarin. Prvním Čechem ve vesmíru byl v roce 1978 Vladimír Remek.",
    wiki: "Kosmická loď",
  },

  // ---------- wonders ----------
  "wdr-stoneCircle": {
    when: "asi 3000 až 2000 let př. n. l.",
    text: "Stonehenge je kruh z obrovských kamenů na pláni v jižní Anglii. Pravěcí lidé tahali některé kameny až z Walesu, vzdáleného přes dvě stě kilometrů. Kameny jsou postavené tak, že o slunovratu ukazují na místo, kde vychází slunce. K čemu přesně sloužil, dodnes nevíme.",
    fact: "Největší kameny Stonehenge váží přes dvacet tun, jako tři sloni. Lidé je přitom stěhovali bez kol a bez kovových nástrojů.",
    wiki: "Stonehenge",
  },
  "wdr-pyramids": {
    when: "kolem roku 2560 př. n. l.",
    text: "Pyramidy v Gíze jsou hrobky egyptských faraonů. Největší z nich nechal postavit faraon Chufu a měřila skoro 147 metrů. Stavěly ji tisíce dělníků, kteří tahali kamenné kvádry po rampách. Je to jediný ze sedmi divů starověkého světa, který stojí dodnes.",
    fact: "Českou egyptologii proslavil Zbyněk Žába a dnes čeští archeologové kopou v egyptském Abúsíru. Objevili tam i hrobky, o kterých nikdo nevěděl.",
    wiki: "Pyramidy v Gíze",
  },
  "wdr-colossus": {
    when: "kolem roku 280 př. n. l.",
    text: "Rhódský kolos byla obrovská bronzová socha boha slunce Hélia na ostrově Rhodos. Měřila asi třicet metrů, skoro jako desetipatrový dům. Stavěli ji dvanáct let z peněz za prodané zbraně nepřátel. Po padesáti letech ji povalilo zemětřesení.",
    fact: "Obrázky, kde kolos stojí rozkročený nad vjezdem do přístavu, jsou nejspíš výmysl. Tak velkou sochu by nikdo neudržel nad vodou.",
    wiki: "Rhódský kolos",
  },
  "wdr-hangingGardens": {
    when: "kolem roku 600 př. n. l.",
    text: "Visuté zahrady v Babylóně byly podle starých vyprávění terasy plné stromů a květin, které rostly nad sebou jako zelená hora. Vodu na ně museli otroci nebo stroje čerpat z řeky Eufrat. Podle legendy je dal postavit král Nabukadnesar pro svou ženu, které se stýskalo po horách. Archeologové je dodnes nenašli.",
    fact: "Některé badatelky si myslí, že zahrady stály v jiném městě, v asyrském Ninive, a teprve vypravěči je přesunuli do Babylóna.",
    wiki: "Visuté zahrady Semiramidiny",
  },
  "wdr-greatWall": {
    when: "od 7. století př. n. l.",
    text: "Velká čínská zeď chránila Čínu před nájezdy kočovníků ze severu. Stavěla se a opravovala přes dva tisíce let. S odbočkami a pevnostmi měří přes dvacet tisíc kilometrů. Na zdi stojí strážní věže, ze kterých vojáci kouřem hlásili blížícího se nepřítele.",
    fact: "Často se říká, že je Velká čínská zeď vidět z Měsíce. Není to pravda, je na to příliš úzká.",
    wiki: "Velká čínská zeď",
  },
  "wdr-lighthouse": {
    when: "kolem roku 280 př. n. l.",
    text: "Maják na ostrově Faros u Alexandrie byl jednou z nejvyšších staveb starověku. Měl tři patra a nahoře hořel oheň, který ukazoval lodím cestu do přístavu. Ve dne prý světlo odráželo velké kovové zrcadlo. Maják stál přes tisíc let, než ho zničila zemětřesení.",
    fact: "Podle ostrova Faros se maják řekne v italštině i ve francouzštině skoro stejně, faro a phare.",
    wiki: "Alexandrijský maják",
  },
  "wdr-oracle": {
    when: "od 8. století př. n. l.",
    text: "V Delfách ve středním Řecku stála svatyně boha Apollóna. Sídlila v ní věštkyně Pýthie, která v transu odpovídala na otázky. Radit se s ní chodili obyčejní lidé i králové, než se rozhodli pro válku nebo založení města. Její odpovědi byly často tak nejasné, že se daly vyložit dvojím způsobem.",
    fact: "Lýdský král Kroisos se zeptal, jestli má zaútočit na Persii. Věštba řekla, že zničí velkou říši. Zničil tu svou.",
    wiki: "Delfská věštírna",
  },
  "wdr-greatLibrary": {
    when: "3. století př. n. l.",
    text: "Alexandrijská knihovna v Egyptě byla největší knihovnou starověku. Shromáždila snad stovky tisíc svitků se vším, co tehdy lidé věděli. Pracovali v ní nejslavnější učenci své doby. Lodím, které připluly do Alexandrie, prý zabavili knihy, opsali je a majitelům vrátili jen opisy.",
    fact: "Učenec Eratosthenés z Alexandrie změřil obvod Země jen podle stínů a vzdálenosti dvou měst. Spletl se jen o pár procent.",
    wiki: "Alexandrijská knihovna",
  },
  "wdr-hallOfScholars": {
    when: "kolem roku 387 př. n. l.",
    text: "Filozof Platón založil v Athénách školu v olivovém háji zasvěceném hrdinovi Akádémovi. Učitelé a žáci tu spolu rozmlouvali o pravdě, spravedlnosti, matematice a hvězdách. Škola fungovala skoro devět set let. Studoval na ní i Aristotelés.",
    fact: "Podle Platónovy školy se dodnes jmenují akademie a akademici. Máme třeba Akademii věd nebo Akademii múzických umění.",
    wiki: "Platónská Akademie",
  },
  "wdr-greatObservatory": {
    when: "od 16. století",
    text: "Hvězdárna je místo, odkud astronomové pozorují oblohu. Mikuláš Koperník zjistil, že se Země točí kolem Slunce. Dánský hvězdář Tycho Brahe postavil na ostrově Hven velkolepou observatoř a pak přišel do Prahy. Hvězdárny přinesly přesné kalendáře i mapy hvězd pro mořeplavce.",
    fact: "Tycho Brahe a Johannes Kepler pracovali v Praze na dvoře císaře Rudolfa II. Tycho je pohřbený v Týnském chrámu na Staroměstském náměstí.",
    wiki: "Hvězdárna",
  },
  "wdr-circumnavigation": {
    when: "1519 až 1522",
    text: "Fernão de Magalhães vyplul s pěti loďmi na západ, aby našel cestu k ostrovům koření. Proplul úžinou u jihu Ameriky, která dnes nese jeho jméno, a přeplul Tichý oceán. Sám zahynul na Filipínách. Domů se vrátila jen jedna loď s osmnácti muži, kteří jako první obepluli celý svět.",
    fact: "Námořníci po návratu zjistili, že jim v kalendáři chybí jeden den. Obepluli Zemi na západ a jeden den tak ztratili.",
    wiki: "Magalhãesova výprava",
  },
  "wdr-sistineChapel": {
    when: "1508 až 1512",
    text: "Sixtinská kaple ve Vatikánu je zvenku obyčejná cihlová stavba. Uvnitř ale Michelangelo vymaloval strop obrazy z Bible, mezi nimi i Stvoření Adama. Maloval čtyři roky na lešení, vestoje a s hlavou zakloněnou. Kaple slouží dodnes, volí se v ní papež.",
    fact: "Když kardinálové v kapli zvolí nového papeže, vypustí komínem bílý kouř. Černý kouř znamená, že ještě nevybrali.",
    wiki: "Sixtinská kaple",
  },
  "wdr-stVitus": {
    when: "1344 až 1929",
    text: "Katedrála svatého Víta stojí na Pražském hradě a je největším kostelem v Česku. Stavbu založil Karel IV. a vedli ji stavitelé Matyáš z Arrasu a Petr Parléř. Dokončit ji trvalo skoro šest set let. Uvnitř leží korunovační klenoty a hrobky českých králů.",
    fact: "Korunovační klenoty se uchovávají v komoře se sedmi zámky. Klíče od nich mají různí lidé, mimo jiné prezident a pražský arcibiskup.",
    wiki: "Katedrála svatého Víta, Václava a Vojtěcha",
  },
  "wdr-globeTheatre": {
    when: "1599",
    text: "Divadlo Globe v Londýně byla dřevěná kruhová stavba s doškovou střechou. Hrála v něm divadelní společnost Williama Shakespeara a uváděla jeho hry jako Hamlet nebo Romeo a Julie. Chudí diváci stáli přímo před jevištěm pod širým nebem. Bohatší seděli na lavicích v patrech.",
    fact: "V roce 1613 vystřelilo při představení divadelní dělo a od jiskry chytla doškovou střechu. Divadlo vyhořelo, nikdo ale nezemřel.",
    wiki: "Globe Theatre",
  },
  "wdr-grandBazaar": {
    when: "od roku 1455",
    text: "Velký bazar v Istanbulu je jedno z největších krytých tržišť na světě. Pod klenbami se skrývá spleť desítek uliček a tisíce obchůdků. Prodávají se tu koberce, šperky, koření i lampy. Obchodníci si tu zboží předávali celá staletí.",
    fact: "Velký bazar každý den navštíví desítky tisíc lidí. Je to jedno z nejnavštěvovanějších míst na světě.",
    wiki: "Velký bazar",
  },
  "wdr-royalSociety": {
    when: "od roku 1660",
    text: "Královská společnost v Londýně je jedno z nejstarších vědeckých sdružení na světě. Vědci se v ní scházeli a předváděli si pokusy. Jejím předsedou byl i Isaac Newton, který popsal gravitaci a zákony pohybu. Heslem společnosti je nevěř nikomu na slovo.",
    fact: "Podle vyprávění přišel Newton na gravitaci, když viděl padat jablko. Strom z jeho zahrady prý roste dodnes.",
    wiki: "Královská společnost",
  },
  "wdr-darwinVoyage": {
    when: "1831 až 1836",
    text: "Mladý přírodovědec Charles Darwin se plavil pět let kolem světa na lodi HMS Beagle. Sbíral zvířata a zkameněliny. Na Galapágách si všiml, že se pěnkavy na každém ostrově trochu liší. Z toho později vznikla jeho teorie, že se živé bytosti vyvíjejí.",
    fact: "Darwinovi bylo při odplutí jen 22 let. Celou cestu trpěl mořskou nemocí.",
    wiki: "HMS Beagle",
  },
  "wdr-womensSuffrage": {
    when: "od konce 19. století",
    text: "Dlouho mohli volit jen muži. Ženy se za volební právo musely zasadit samy, psaly petice a pořádaly demonstrace. Jako první dostaly volební právo ženy na Novém Zélandu v roce 1893. Postupně je získaly ženy na celém světě.",
    fact: "První ženou zvolenou do poslanecké sněmovny v Evropě byla Češka Božena Viková-Kunětická. Zvolili ji v roce 1912 do českého zemského sněmu.",
    wiki: "Volební právo žen",
  },
  "wdr-hooverDam": {
    when: "1931 až 1936",
    text: "Hooverova přehrada na řece Colorado v Americe je obrovská betonová hráz v hlubokém kaňonu. Zadržuje řeku a vytváří jezero Mead, které zásobuje vodou pouštní města. Její turbíny vyrábějí elektřinu pro miliony lidí. Stavělo ji tisíce dělníků v obrovských vedrech.",
    fact: "Do hráze spotřebovali tolik betonu, že by vystačil na silnici přes celé Spojené státy.",
    wiki: "Hooverova přehrada",
  },
  "wdr-unitedNations": {
    when: "od roku 1945",
    text: "Organizace spojených národů vznikla po druhé světové válce, aby se už nikdy neopakovala. Zasedají v ní zástupci skoro všech států světa a snaží se řešit spory mírem. Pomáhá dětem a lidem v nouzi. Sídlí ve výškové budově v New Yorku.",
    fact: "Československo patří mezi zakládající státy OSN. Smlouvu podepsalo už v roce 1945.",
    wiki: "Organizace spojených národů",
  },
  "wdr-manhattanProject": {
    when: "1942 až 1946",
    text: "Projekt Manhattan byl tajný americký program, který za druhé světové války vyvinul první jadernou bombu. Pracovaly na něm tisíce vědců a dělníků v utajených městech. Vedl ho fyzik Robert Oppenheimer. Výsledek změnil svět a ukázal, jak velkou sílu atomy skrývají.",
    fact: "Celé tajné město Los Alamos v Novém Mexiku vzniklo jen kvůli tomuto projektu. Jeho obyvatelé nesměli nikomu prozradit, kde žijí.",
    wiki: "Projekt Manhattan",
  },
  "wdr-setiProgram": {
    when: "od roku 1960",
    text: "SETI je hledání mimozemské civilizace. Obří radioteleskopy naslouchají, jestli z vesmíru nepřichází signál, který by vyslali jiní tvorové. Zatím žádný přesvědčivý nenašly. Vědci při tom ale objevují mnoho jiných zajímavých věcí o vesmíru.",
    fact: "Doma se k hledání mohl přidat každý. Program SETI@home posílal kousky dat do milionů počítačů, které je zpracovávaly, když je nikdo nepoužíval.",
    wiki: "SETI",
  },
  "wdr-apolloProgram": {
    when: "1961 až 1972",
    text: "Program Apollo byl americký let na Měsíc. V roce 1969 přistála na Měsíci loď Apollo 11 a Neil Armstrong jako první člověk vystoupil na jeho povrch. Celkem tam stanulo dvanáct astronautů. Raketa Saturn V, která je vynesla, je dodnes jednou z nejsilnějších, jaké kdy letěly.",
    fact: "Stopy astronautů na Měsíci tam nejspíš zůstanou miliony let. Na Měsíci nefouká vítr ani neprší, a tak je nic nesmaže.",
    wiki: "Program Apollo",
  },
  "wdr-genomeProject": {
    when: "1990 až 2003",
    text: "Projekt lidského genomu přečetl celý návod, podle kterého se staví lidské tělo. Ten návod je zapsaný v DNA, dlouhé molekule ve tvaru dvojité šroubovice, která je v každé buňce. Spolupracovali na něm vědci z mnoha zemí třináct let. Díky němu lékaři lépe chápou nemoci a hledají nové léky.",
    fact: "Základy dědičnosti objevil Gregor Johann Mendel při pokusech s hrachem v klášteře v Brně.",
    wiki: "Projekt lidského genomu",
  },

  // ---------- terrain ----------
  "ter-ocean": {
    text: "Oceány pokrývají asi sedmdesát procent povrchu Země. Žijí v nich ryby i velryby. Moře dává lidem potravu a cestu k jiným zemím. Kdo se naučil plout, mohl obchodovat přes celý svět.",
    fact: "Nejhlubší místo oceánu je Marianský příkop v Tichém oceánu. Je hluboký přes jedenáct kilometrů, víc než je vysoký Mount Everest.",
    wiki: "Oceán",
  },
  "ter-grassland": {
    text: "Louka je travnatá plocha s květinami, kterou lidé pravidelně kosí nebo spásají. Roste na ní tráva a byliny pro dobytek. Úrodná půda pod loukou se dá snadno přeorat na pole. Proto se u luk a řek usazovali první zemědělci.",
    fact: "Na jediné louce může růst přes padesát druhů rostlin a žít stovky druhů hmyzu.",
    wiki: "Louka",
  },
  "ter-plains": {
    text: "Step je rozlehlá rovina porostlá travou, kde roste málo stromů. Prší tu méně než v lese, ale tráva vyživí stáda koní a ovcí. Na stepích žili kočovní pastevci a jezdci. Mnoho stepí se dnes změnilo v obrovská obilná pole.",
    fact: "Euroasijská step se táhne od Maďarska až do Mongolska. Po této trávě kdysi táhla vojska Čingischána.",
    wiki: "Step",
  },
  "ter-forest": {
    text: "Les dává dřevo na stavby i na oheň a skrývá zvěř k lovu. Lidé v něm sbírali houby a lesní plody. Aby mohli pěstovat obilí, museli část lesů vykácet. Les ale také zadržuje vodu a chrání půdu.",
    fact: "Lesy pokrývají asi třetinu Česka. Nejvíc je v nich smrků, které lidé vysazovali kvůli rychle rostoucímu dřevu.",
    wiki: "Les",
  },
  "ter-hills": {
    text: "Pahorkatina je krajina mírných kopců a údolí. Na svazích se dobře daří vinné révě a pastvinám a z kopců je dobrý výhled. Obránce na kopci má výhodu, proto se tam stavěly hrady. Pod kopci se často skrývají ložiska rud a kamene.",
    fact: "Velkou část Česka tvoří pahorkatiny a vrchoviny. Českomoravská vrchovina leží přímo uprostřed republiky.",
    wiki: "Pahorkatina",
  },
  "ter-mountains": {
    text: "Hory jsou vysoké a strmé, cesty přes ně jsou těžké a nebezpečné. Na vrcholech leží sníh i v létě a skoro nic tam neroste. Hory chránily země před nepřáteli jako přirozená hradba. V horách se těžily kovy a drahé kameny.",
    fact: "Nejvyšší horou Česka je Sněžka v Krkonoších. Měří 1603 metrů a stojí na hranici s Polskem.",
    wiki: "Hora",
  },
  "ter-desert": {
    text: "Poušť je krajina, kde skoro vůbec neprší. Přes den bývá žár a v noci zima. Rostliny a zvířata se naučily šetřit vodou, třeba kaktusy nebo velbloudi. Lidé v poušti žili hlavně v oázách, kde vyvěrá voda.",
    fact: "Největší horkou pouští světa je Sahara v Africe. Je skoro tak velká jako celé Spojené státy.",
    wiki: "Poušť",
  },

  // ---------- improvements ----------
  "imp-road": {
    when: "od starověku",
    text: "Cesty spojují vesnice a města. Po zpevněné silnici se jezdí rychleji a vozy nezapadnou do bláta. Římané stavěli silnice z několika vrstev štěrku a kamene, které vydržely staletí. Po cestách putovali vojáci i obchodníci.",
    fact: "Říká se, že všechny cesty vedou do Říma. Ve starověku opravdu síť silnic spojovala hlavní město s celou říší.",
    wiki: "Silnice",
  },
  "imp-irrigation": {
    when: "asi od roku 6000 př. n. l.",
    text: "Zavlažování přivádí vodu z řek a jezer na pole, kde by jinak bylo sucho. Lidé kopali kanály a stavěli hráze a čerpadla. Díky tomu mohli pěstovat obilí i v pouštních krajích. U zavlažovaných řek vznikly první civilizace v Mezopotámii a Egyptě.",
    fact: "Egypťané používali k zalévání šaduf, dlouhou tyč s vědrem na jednom konci a závažím na druhém.",
    wiki: "Zavlažování",
  },
  "imp-mine": {
    when: "od pravěku",
    text: "V dolech se z hlubin země těží rudy a uhlí. Horníci kopali šachty a štoly a vyváželi rudu na vozících. Práce v dole byla těžká a nebezpečná. Z vytěžené rudy se tavily kovy na nástroje i mince.",
    fact: "Ve středověku byla Kutná Hora jedním z nejbohatších měst Evropy díky stříbrným dolům. Razil se tu pražský groš.",
    wiki: "Důl",
  },
  "imp-railroad": {
    when: "od roku 1825",
    text: "Železnice je cesta z ocelových kolejnic, po které jezdí vlaky. Parní lokomotiva utáhla mnohem víc nákladu než koně a jela rychleji. Železnice spojila města a doly s továrnami a lidé mohli poprvé cestovat daleko za den. Kolem nádraží rostla nová města.",
    fact: "Na našem území vedla první koněspřežka z Českých Budějovic do rakouského Lince. Vagony po ní táhli koně.",
    wiki: "Železniční trať",
  },
  "imp-fortress": {
    when: "od starověku",
    text: "Pevnost je opevněné místo, kde se vojáci mohou bránit přesile. Mívá valy a bašty, odkud se dá střílet na útočníky ze všech stran. Pevnosti hlídaly hranice a důležité cesty. Ve hře v ní jednotky dostanou silnou obranu.",
    fact: "Terezín a Josefov postavila Marie Terezie a Josef II. jako pevnosti proti Prusku. Mají hvězdicový tvar s mnoha baštami.",
    wiki: "Pevnost",
  },
};
