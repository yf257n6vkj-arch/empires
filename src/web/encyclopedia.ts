/**
 * Encyclopedia pages for the technologies: when it happened, a short story
 * for a curious child, one surprising fact and a Czech Wikipedia article.
 * Texts are written for this game; each page links the Czech Wikipedia article
 * where the reader can check and continue.
 */
import type { TechId } from "../core";

export interface TechPage {
  /** Rough time, as a reader would say it. */
  when: string;
  text: string;
  fact: string;
  /** Title of the article on cs.wikipedia.org. */
  wiki: string;
}

export const TECH_PAGES: Record<TechId, TechPage> = {
  pottery: {
    when: "asi před 20 000 lety",
    text: "Hlína se po vypálení v ohni změní v tvrdý materiál, který nepropouští vodu. Lidé z ní začali dělat hrnce a misky, ve kterých šlo vařit a skladovat obilí. Nejstarší známé střepy našli archeologové v jeskyni v Číně. Asi před šesti tisíci lety přibyl hrnčířský kruh a nádoby se daly točit rychle a pravidelně.",
    fact: "Podle zdobení keramiky archeologové poznají, kdo kde žil. Celé pravěké kultury proto mají jména podle hrnců, třeba kultura s lineární keramikou.",
    wiki: "Keramika",
  },
  bronze: {
    when: "kolem roku 3300 př. n. l.",
    text: "Bronz vznikne, když se roztavená měď smíchá s trochou cínu. Je mnohem tvrdší než samotná měď, a tak se z něj daly dělat ostré meče, hroty kopí, sekery i šperky. Cín se ale těžil jen na pár místech, takže se s ním obchodovalo přes celou Evropu. Proto se tomuhle období říká doba bronzová.",
    fact: "Jedna z nejznámějších kultur doby bronzové se jmenuje únětická. Dostala jméno podle vesnice Únětice, která leží kousek za Prahou.",
    wiki: "Doba bronzová",
  },
  masonry: {
    when: "asi před 11 000 lety",
    text: "Lidé se naučili skládat kameny tak, aby držely bez malty i s ní. Nejdřív stavěli zdi kolem vesnic a svatyně. Nejstarší známá kamenná svatyně stojí v Turecku a jmenuje se Göbekli Tepe. O mnoho tisíc let později postavili Egypťané pyramidy z obrovských kvádrů.",
    fact: "Velká pyramida v Gíze má asi 2,3 milionu kamenných bloků a skoro čtyři tisíce let byla nejvyšší stavbou na světě.",
    wiki: "Zdivo",
  },
  ceremonies: {
    when: "asi před 100 000 lety",
    text: "Už pravěcí lidé své mrtvé neopouštěli. Pohřbívali je do hrobů a dávali jim s sebou ozdoby, nástroje nebo jídlo na cestu. Je to jeden z prvních důkazů, že lidé přemýšleli o smrti a o tom, co bude potom. Ze společných obřadů později vyrostly chrámy a náboženství.",
    fact: "V Dolních Věstonicích na Moravě našli archeologové hrob tří mladých lidí starý asi 30 000 let. Byli pohřbení vedle sebe a posypaní červeným barvivem.",
    wiki: "Pohřeb",
  },
  horseback: {
    when: "asi před 5 000 lety",
    text: "Divocí koně se pásli ve stepích, kde dnes leží Ukrajina a Kazachstán. Tamní lidé je ochočili, nejdřív kvůli mléku a masu, pak kvůli jízdě. Na koni se dalo cestovat a bojovat mnohem rychleji než pěšky. Třmeny, do kterých jezdec opře nohy, se ale objevily až o tisíce let později.",
    fact: "Všichni dnešní domácí koně pocházejí z jedné skupiny koní, kterou chovali lidé na dolním toku Volhy a Donu asi před 4 200 lety.",
    wiki: "Jezdectví",
  },
  wheel: {
    when: "kolem roku 3500 př. n. l.",
    text: "Kolo se objevilo skoro současně v Mezopotámii a ve střední Evropě. Nejdřív sloužilo hrnčířům, potom na vozech, které táhli voli. Plné dřevěné kolo bylo těžké, a tak lidé později vymysleli kolo s loukotěmi, které je lehčí. Bez kola by nebyly vozy, mlýny ani hodinové strojky.",
    fact: "Nejstarší dochované dřevěné kolo s nápravou našli v bažinách u Lublaně ve Slovinsku. Je staré asi 5 150 let.",
    wiki: "Kolo",
  },
  archery: {
    when: "asi před 60 000 lety",
    text: "Luk umožnil zasáhnout zvíře nebo nepřítele na velkou vzdálenost. Nejstarší kamenné hroty šípů pocházejí z jeskyně v Jižní Africe. Luky ze dřeva se dochovaly hůř, nejstarší jsou z Dánska a mají asi 9 000 let. Lukostřelci pak tisíce let rozhodovali bitvy.",
    fact: "Ledový muž Ötzi, kterého našli v Alpách, měl u sebe luk a toulec se čtrnácti šípy. Zemřel před více než 5 000 lety.",
    wiki: "Lukostřelba",
  },
  writing: {
    when: "kolem roku 3300 př. n. l.",
    text: "První písmo vymysleli Sumerové v Mezopotámii. Ryli značky rákosem do mokrých hliněných tabulek, a protože značky vypadají jako klínky, říká se mu klínové písmo. Skoro ve stejné době začali Egypťané psát hieroglyfy. Nejstarší texty nejsou příběhy, jsou to účty za obilí, pivo a ovce.",
    fact: "Hliněné tabulky vydrží tisíce let, hlavně když shoří knihovna a oheň je vypálí. Tak se zachovala i velká knihovna asyrského krále Aššurbanipala.",
    wiki: "Klínové písmo",
  },
  alphabet: {
    when: "kolem roku 1800 př. n. l.",
    text: "Starší písma měla stovky značek a naučit se je trvalo roky. Abeceda má jen pár desítek písmen a každé znamená jednu hlásku. Vymysleli ji lidé, kteří pracovali pro Egypťany na Sinaji, a rozšířili ji Féničané. Řekové do ní přidali samohlásky a od nich ji převzali Římané, jejichž písmena používáme dodnes.",
    fact: "Slovo abeceda je složené z prvních písmen a, b, c. Slovo alfabeta vzniklo stejně z řeckých písmen alfa a beta.",
    wiki: "Abeceda",
  },
  codeOfLaws: {
    when: "kolem roku 1754 př. n. l.",
    text: "Když lidé žijí ve velkých městech, potřebují pravidla, která platí pro všechny. Babylonský král Chammurapi nechal vytesat 282 zákonů do kamenného sloupu a postavit ho tak, aby ho každý viděl. Zákony říkaly, jak se trestá krádež, kolik se platí za práci nebo co dělat při sporu o pole.",
    fact: "Odtud pochází známé pravidlo oko za oko, zub za zub. Chammurapiho sloup vysoký přes dva metry si dnes můžeš prohlédnout v pařížském Louvru.",
    wiki: "Chammurapiho zákoník",
  },
  mysticism: {
    when: "asi před 5 000 lety",
    text: "Lidé věřili, že svět řídí skryté síly, a snažili se jim porozumět. Kněží sledovali hvězdy, vnitřnosti obětovaných zvířat nebo let ptáků a vykládali z nich budoucnost. Stavěli k tomu svatyně a kamenné kruhy. Ze sledování oblohy časem vyrostla astronomie.",
    fact: "Ve starém Řecku putovali lidé do Delf za věštkyní Pýthií. Její odpovědi bývaly tak mlhavé, že se daly vyložit několika způsoby.",
    wiki: "Mystika",
  },
  currency: {
    when: "kolem roku 600 př. n. l.",
    text: "Dřív lidé zboží měnili, třeba ovci za obilí. Pak začali platit kousky stříbra, které se vážily. První mince s razítkem, které zaručovalo jejich hodnotu, se razily v Lýdii na území dnešního Turecka. S mincemi se obchodovalo mnohem snáz.",
    fact: "Stříbrné mince z Jáchymova se jmenovaly jáchymovské tolary. Z jejich jména vzniklo slovo dolar.",
    wiki: "Peníze",
  },
  iron: {
    when: "kolem roku 1200 př. n. l.",
    text: "Železná ruda je skoro všude, ale železo z ní jde dostat jen při velkém žáru. Kováři se naučili rudu tavit v hliněných pecích a výsledný kus železa ukovat. Železné nástroje byly levnější než bronzové, a tak mohl mít železný meč nebo pluh skoro každý.",
    fact: "Faraon Tutanchamon měl v hrobce dýku ze železa, které spadlo z nebe. Vyrobili ji z meteoritu.",
    wiki: "Doba železná",
  },
  mapMaking: {
    when: "kolem roku 600 př. n. l.",
    text: "Mapa zachytí krajinu tak, jak by ji viděl pták shora. Nejstarší známá mapa světa je babylonská hliněná tabulka, na které je svět kruh obklopený oceánem. Řek Ptolemaios později popsal, jak kreslit mapy podle zeměpisných souřadnic. Námořníci a obchodníci bez map nedokázali dojít daleko.",
    fact: "Na babylonské mapě je uprostřed světa Babylon. Kreslíři map rádi dávali doprostřed svou vlastní zemi.",
    wiki: "Kartografie",
  },
  mathematics: {
    when: "kolem roku 2000 př. n. l.",
    text: "Babyloňané a Egypťané potřebovali počítat úrodu, měřit pole po povodních a stavět pyramidy. Vymysleli k tomu čísla, zlomky a pravidla pro výpočet ploch. Babyloňané počítali po šedesáti, Egypťané po desíti. Nulu jako číslo zavedli až indičtí matematici asi před 1 400 lety.",
    fact: "Hodina má 60 minut a kruh 360 stupňů kvůli Babyloňanům a jejich počítání po šedesáti.",
    wiki: "Dějiny matematiky",
  },
  literacy: {
    when: "od starověku po rok 1774",
    text: "Dlouho uměla číst a psát jen hrstka kněží a písařů. Řekové a Římané zakládali školy, ale chodily do nich hlavně děti bohatých. Jan Amos Komenský chtěl, aby se učily všechny děti, a to hrou a s obrázky. V habsburské monarchii zavedla povinnou školní docházku Marie Terezie v roce 1774.",
    fact: "Komenského kniha Orbis pictus z roku 1658 je jedna z prvních učebnic s obrázky pro děti na světě.",
    wiki: "Gramotnost",
  },
  monarchy: {
    when: "kolem roku 3100 př. n. l.",
    text: "V monarchii vládne jeden panovník, král nebo královna, a vláda se dědí v rodině. Prvním faraonem sjednoceného Egypta byl podle tradice Narmer. V českých zemích vládli Přemyslovci. Dědičný královský titul získal Přemysl Otakar I. a potvrdila mu ho Zlatá bula sicilská z roku 1212.",
    fact: "Dodnes má na světě krále nebo královnu přes čtyřicet států, třeba Velká Británie, Dánsko nebo Japonsko.",
    wiki: "Monarchie",
  },
  republic: {
    when: "509 př. n. l.",
    text: "Římané vyhnali posledního krále a rozhodli se, že už jim nebude vládnout jeden člověk. Každý rok si volili dva konzuly a radil jim senát. Latinsky se tomu říkalo res publica, věc veřejná. Republikou je i Česko, od roku 1918 jsme ji měli jako Československo.",
    fact: "Prvním prezidentem Československa byl Tomáš Garrigue Masaryk. Zvolili ho v listopadu 1918, když byl ještě v Americe.",
    wiki: "Republika",
  },
  construction: {
    when: "kolem roku 200 př. n. l.",
    text: "Římané objevili beton. Míchali vápno se sopečným popelem a kamením a směs v dřevěném bednění ztvrdla jako skála. Z betonu stavěli přístavy, lázně, amfiteátry a akvadukty, kterými přiváděli do měst vodu z hor. Některé stavby stojí dodnes.",
    fact: "Kupole římského Pantheonu je téměř dva tisíce let stará a pořád je to největší kupole z betonu bez železných výztuží.",
    wiki: "Římský beton",
  },
  trade: {
    when: "kolem roku 200 př. n. l.",
    text: "Obchodníci vozili zboží tam, kde ho bylo málo, a dobře na tom vydělávali. Hedvábná stezka spojovala Čínu se Středomořím a putovalo po ní hedvábí, koření, sklo i nápady. Přes Moravu vedla Jantarová stezka, po které se vozil jantar od Baltu do Říma.",
    fact: "Po obchodních stezkách se nešířilo jen zboží. Cestovaly po nich i nemoci, náboženství a třeba čínský papír.",
    wiki: "Hedvábná stezka",
  },
  astronomy: {
    when: "od starověku po rok 1543",
    text: "Lidé odjakživa sledovali Slunce, Měsíc a hvězdy, aby věděli, kdy sít a kdy sklízet. Dlouho si mysleli, že Země stojí uprostřed vesmíru. Mikuláš Koperník v roce 1543 ukázal, že Země obíhá kolem Slunce. V Praze na dvoře císaře Rudolfa II. pak pracovali slavní astronomové Tycho Brahe a Johannes Kepler.",
    fact: "Tycho Brahe je pohřbený v Týnském chrámu na Staroměstském náměstí. Nos měl kovový, ten pravý přišel o souboj.",
    wiki: "Astronomie",
  },
  philosophy: {
    when: "kolem roku 600 př. n. l.",
    text: "Filozofie znamená láska k moudrosti. Řečtí myslitelé jako Sókratés, Platón a Aristotelés se ptali, z čeho je svět, co je dobré a jak poznáme pravdu. Odpovědi hledali přemýšlením a rozhovorem. Ve stejné době učil v Číně Konfucius.",
    fact: "Aristotelés byl vychovatelem Alexandra Velikého, pozdějšího krále, který dobyl říši od Řecka až po Indii.",
    wiki: "Filozofie",
  },
  bridgeBuilding: {
    when: "od starověku po rok 1357",
    text: "Most přes řeku je těžká stavba, protože pilíře stojí ve vodě a proud je podemílá. Římané stavěli kamenné mosty s oblouky, které rozloží váhu do stran. V Praze stál od roku 1172 Juditin most a po jeho zřícení začal císař Karel IV. stavět Karlův most.",
    fact: "Podle pověsti se do malty na Karlův most přidávala vejce. Základní kámen podle tradice položili v roce 1357, 9. 7. v 5:31, a číslice tvoří řadu 1-3-5-7-9-7-5-3-1.",
    wiki: "Karlův most",
  },
  engineering: {
    when: "kolem roku 250 př. n. l.",
    text: "Inženýři vymýšlejí stroje, které práci usnadní. Řek Archimédés vysvětlil, jak zvednout těžké břemeno malou silou, a vymyslel šroub na čerpání vody. Římští stavitelé uměli zvedat těžké kameny jeřáby poháněnými lidmi v obřím kole. Z ozubených kol se skládaly první mechanické hračky a přístroje.",
    fact: "Mechanismus z Antikythéry je bronzový strojek s ozubenými koly starý přes dva tisíce let. Počítal polohu Slunce a Měsíce, takže se mu říká první počítač.",
    wiki: "Mechanismus z Antikythéry",
  },
  feudalism: {
    when: "od roku 800 do roku 1500",
    text: "Ve středověku patřila půda šlechticům. Rolníci na ní hospodařili a za to museli pánovi odvádět část úrody a pracovat na jeho polích. Šlechtic sám sloužil vyššímu pánovi a nakonec králi. Šlechtici si stavěli hrady, odkud vládli okolí.",
    fact: "Povinné práci na panském se česky říkalo robota. Z tohohle slova vymysleli bratři Čapkové slovo robot.",
    wiki: "Feudalismus",
  },
  chivalry: {
    when: "kolem roku 1100",
    text: "Rytíř byl jezdec v těžkém brnění a se dřevcem. Na turnajích se cvičil v boji a měl se řídit pravidly cti, třeba chránit slabé a dodržet slovo. Plátová zbroj vážila kolem 25 kilogramů, ale rozložila se po celém těle, takže se v ní dalo jezdit i vstát ze země.",
    fact: "Český král Jan Lucemburský byl slepý, a přesto šel v roce 1346 do bitvy u Kresčaku. Jeho rytíři k němu přivázali své koně, aby ho vedli.",
    wiki: "Rytíř",
  },
  medicine: {
    when: "kolem roku 400 př. n. l.",
    text: "Řecký lékař Hippokratés tvrdil, že nemoci mají přirozené příčiny, a ne že je posílají bohové. Lékaři začali pozorovat nemocné a zapisovat, co pomáhá. Perský učenec Avicenna sepsal velkou knihu o medicíně, podle které se učilo stovky let. Lidské tělo pak podrobně popsal Andreas Vesalius.",
    fact: "Lékař Jan Jesenius v roce 1600 v Praze veřejně pitval tělo popraveného muže, aby studenti viděli, jak je člověk uvnitř uspořádaný.",
    wiki: "Dějiny lékařství",
  },
  university: {
    when: "1088",
    text: "Univerzita je škola, kde se studenti a učitelé spolu věnují vědě. První vznikla v italské Boloni, potom v Paříži a Oxfordu. Studovalo se tam právo, lékařství a teologie a učilo se latinsky, takže si rozuměli studenti z celé Evropy.",
    fact: "Univerzitu Karlovu v Praze založil Karel IV. v roce 1348. Je to nejstarší univerzita ve střední Evropě.",
    wiki: "Univerzita",
  },
  banking: {
    when: "kolem roku 1400",
    text: "Banka uschová peníze a půjčuje je dál těm, kdo je potřebují, za poplatek, kterému se říká úrok. Velkou sílu měli italští bankéři, třeba rod Medicejských ve Florencii. Obchodník nemusel vozit truhlu zlata, stačilo mu psané potvrzení od banky.",
    fact: "Slovo banka pochází z italského banco, lavice, na které sedávali směnárníci. Když zkrachovali, lavici jim rozbili, banca rotta, a odtud je slovo bankrot.",
    wiki: "Banka",
  },
  navigation: {
    when: "1492 až 1522",
    text: "Námořníci se naučili určit, kde jsou, i na širém moři daleko od pobřeží. Pomáhal jim kompas, astroláb a mapy. Kryštof Kolumbus doplul v roce 1492 do Ameriky. O pár let později se Magalhãesova výprava jako první plavila kolem celé Země.",
    fact: "Z pěti Magalhãesových lodí se po třech letech vrátila jediná a s ní jen 18 mužů. Sám Magalhães cestou zemřel.",
    wiki: "Navigace",
  },
  religion: {
    when: "od starověku po středověk",
    text: "Velká náboženství světa daly lidem společné příběhy, svátky a pravidla, jak spolu žít. Kolem chrámů a klášterů vznikaly školy, nemocnice a knihovny. Mniši přepisovali knihy ručně a díky nim se zachovala spousta starověkých textů. Lidé stavěli obrovské katedrály, na kterých pracovaly celé generace.",
    fact: "Katedrálu svatého Víta na Pražském hradě začali stavět v roce 1344 a dokončili ji až v roce 1929.",
    wiki: "Náboženství",
  },
  physics: {
    when: "kolem roku 1600",
    text: "Galileo Galilei začal přírodu zkoumat pokusy. Pouštěl koule po nakloněné rovině, měřil kyvadla a výsledky zapisoval čísly. Zjistil, že těžká a lehká věc padají stejně rychle, když jim nepřekáží vzduch. Dalekohledem objevil čtyři měsíce Jupiteru.",
    fact: "Astronaut David Scott pustil v roce 1971 na Měsíci, kde není vzduch, kladivo a pírko zároveň. Dopadly ve stejnou chvíli.",
    wiki: "Galileo Galilei",
  },
  invention: {
    when: "kolem roku 1450",
    text: "V renesanci se vynálezy rychle šířily po Evropě. Johannes Gutenberg sestavil knihtisk s pohyblivými písmeny a knihy najednou stály zlomek dřívější ceny. Leonardo da Vinci kreslil létající stroje, potápěčské obleky a mosty. Mechanické hodiny začaly lidem měřit čas.",
    fact: "Pražský orloj na Staroměstské radnici běží od roku 1410. Je to nejstarší orloj na světě, který ještě funguje.",
    wiki: "Knihtisk",
  },
  gunpowder: {
    when: "kolem roku 850",
    text: "Střelný prach objevili čínští alchymisté, když hledali lék na nesmrtelnost. Je to směs ledku, síry a dřevěného uhlí, která prudce hoří. Číňané z něj dělali ohňostroje a ohnivé šípy. Do Evropy se dostal ve 13. století a změnil války, protože hradby přestaly stačit.",
    fact: "Husité používali malou palnou zbraň, které říkali píšťala. Z tohohle českého slova vzniklo slovo pistole.",
    wiki: "Střelný prach",
  },
  theoryOfGravity: {
    when: "1687",
    text: "Isaac Newton přišel na to, že stejná síla, která táhne jablko k zemi, drží Měsíc na oběžné dráze kolem Země. Popsal ji jednoduchým vzorcem. Navázal na Johannese Keplera, který v Praze zjistil, že planety obíhají Slunce po elipsách.",
    fact: "Příběh o jablku, které Newtonovi spadlo na hlavu, je spíš legenda. Newton ale opravdu vyprávěl, že ho napadlo, když viděl jablko padat ze stromu.",
    wiki: "Gravitace",
  },
  magnetism: {
    when: "1600",
    text: "Číňané věděli dávno, že magnetovec se natočí k severu, a vyrobili z něj kompas. Angličan William Gilbert v roce 1600 vysvětlil proč. Celá Země je velký magnet a střelka kompasu se podle něj řídí. Magnetismus později pomohl objevit elektřinu.",
    fact: "Severní magnetický pól není na stejném místě jako zeměpisný severní pól a pomalu se posouvá, dnes několik desítek kilometrů za rok.",
    wiki: "Magnetismus",
  },
  steamEngine: {
    when: "1712 až 1776",
    text: "Parní stroj mění teplo z ohně na pohyb. První stroje čerpaly vodu z dolů, aby horníci mohli kopat hlouběji. James Watt je vylepšil tak, že spotřebovaly mnohem méně uhlí a hodily se pro továrny. Pára pak poháněla tkalcovské stavy, lodě i lokomotivy.",
    fact: "Podle Jamese Watta se jmenuje jednotka výkonu watt. Najdeš ji na každé žárovce.",
    wiki: "Parní stroj",
  },
  chemistry: {
    when: "1789",
    text: "Alchymisté se staletí snažili vyrobit zlato a při tom objevili spoustu látek. Antoine Lavoisier z toho udělal vědu. Pečlivě vážil, co do pokusu dal a co z něj vyšlo, a pojmenoval kyslík a vodík. Dmitrij Mendělejev později seřadil prvky do periodické tabulky.",
    fact: "Mendělejev v tabulce nechal prázdná místa pro prvky, které ještě nikdo neznal, a předpověděl jejich vlastnosti. Později je opravdu našli.",
    wiki: "Chemie",
  },
  metallurgy: {
    when: "kolem roku 1450",
    text: "Hutníci postavili vysoké pece, ve kterých se železo dalo roztavit a odlévat do forem. Zvonaři, kteří uměli odlévat obrovské zvony, začali stejným způsobem odlévat děla. Z lepšího kovu se pak dělaly nástroje, stroje a později koleje.",
    fact: "Ve Vítkovicích v Ostravě vznikly v roce 1828 železárny, ze kterých se stal jeden z největších hutních podniků střední Evropy.",
    wiki: "Metalurgie",
  },
  democracy: {
    when: "508 př. n. l. a 1776",
    text: "Démokratia řecky znamená vláda lidu. V antických Athénách o zákonech hlasovali svobodní muži přímo na shromáždění. Moderní demokracie vznikla v Americe a ve Francii na konci 18. století. Lidé si volí zástupce a ti musí po čase obhájit své místo v dalších volbách.",
    fact: "Ženy směly poprvé volit v celé zemi na Novém Zélandu v roce 1893. V Československu volily od roku 1919.",
    wiki: "Demokracie",
  },
  railroad: {
    when: "1825",
    text: "Vůz na kolejích jede lehce, protože kola netlačí do bláta. Když se na koleje postavila parní lokomotiva, začala nová doba. První veřejná železnice s parní lokomotivou vedla v Anglii a George Stephenson pro ni stavěl stroje. Za pár desítek let vedly koleje skoro do každého města.",
    fact: "Mezi Českými Budějovicemi a Lincem jezdila od roku 1832 koněspřežná železnice, jedna z prvních na evropské pevnině. Vagony tahali koně.",
    wiki: "Železniční doprava",
  },
  conscription: {
    when: "1793",
    text: "Dřív válčili hlavně žoldnéři a šlechtici. Francouzská revoluce zavedla, že bránit zemi musí každý mladý muž. Armády se tím zvětšily na statisíce vojáků. V Rakousku-Uhersku platila všeobecná branná povinnost od roku 1868.",
    fact: "Napoleon měl díky branné povinnosti armádu tak velkou, že do Ruska v roce 1812 vyrazil s více než půl milionem vojáků.",
    wiki: "Branná povinnost",
  },
  explosives: {
    when: "1867",
    text: "Nitroglycerin vybuchne při sebemenším otřesu a zabil mnoho dělníků. Alfred Nobel ho nasákl do jemné hlinky a vznikl dynamit, se kterým se dalo bezpečně zacházet. Dynamit pomohl razit tunely, stavět silnice a těžit v dolech.",
    fact: "Nobel ze zisku z dynamitu založil Nobelovy ceny. Od roku 1901 se každý rok udělují vědcům, spisovatelům a lidem, kteří pomáhají míru.",
    wiki: "Dynamit",
  },
  electricity: {
    when: "1752 až 1879",
    text: "Benjamin Franklin pouštěl draka do bouřky a dokázal, že blesk je elektřina. Alessandro Volta sestavil první baterii a Michael Faraday zjistil, jak elektřinu vyrábět pohybem magnetu. Thomas Edison pak prodával žárovky. Elektřina rozsvítila města a roztočila motory.",
    fact: "Český kněz Prokop Diviš sestrojil v roce 1754 hromosvod. František Křižík pustil v roce 1891 na Letné první pražskou elektrickou tramvaj.",
    wiki: "Elektřina",
  },
  atomicTheory: {
    when: "1803 až 1911",
    text: "Řek Démokritos tvrdil, že všechno se skládá z malinkých nedělitelných kousků, atomů. Až o dva tisíce let později to John Dalton dokázal pokusy. Ernest Rutherford pak zjistil, že atom má uprostřed malé těžké jádro a kolem něj obíhají elektrony.",
    fact: "Atomy jsou tak malé, že by se jich na délku jednoho milimetru vešlo vedle sebe asi deset milionů.",
    wiki: "Atom",
  },
  industrialization: {
    when: "od roku 1760",
    text: "V Anglii se začaly stroje stavět do továren. Jeden stroj nahradil práci desítek přadlen a tkalců. Lidé se stěhovali z vesnic do měst za prací. České země se staly průmyslovým srdcem Rakouska-Uherska, s továrnami na textil, sklo, cukr a stroje.",
    fact: "V prvních továrnách pracovaly i malé děti, často dvanáct hodin denně. Zákony, které dětskou práci omezily, přišly až postupně.",
    wiki: "Průmyslová revoluce",
  },
  corporation: {
    when: "1602",
    text: "Velký podnik potřebuje víc peněz, než má jeden člověk. Nizozemská Východoindická společnost proto prodávala akcie, malé podíly na firmě, komukoli, kdo chtěl. Když se firmě dařilo, akcionáři dostávali část zisku. Tak vznikly obří firmy, které stavěly železnice a továrny.",
    fact: "Firma Baťa ze Zlína byla ve 30. letech 20. století jedním z největších výrobců bot na světě a měla továrny na několika kontinentech.",
    wiki: "Akciová společnost",
  },
  steel: {
    when: "1856",
    text: "Ocel je železo s malým množstvím uhlíku. Je pevná a pružná zároveň. Henry Bessemer vymyslel, jak ji vyrábět levně ve velkém, když se roztaveným železem profoukne vzduch. Z oceli se pak stavěly mosty, lodě, kolejnice a mrakodrapy.",
    fact: "První mrakodrap s ocelovou kostrou postavili v Chicagu v roce 1885. Měl deset pater.",
    wiki: "Ocel",
  },
  refining: {
    when: "1856",
    text: "Ropa vytéká ze země jako hustá černá kapalina. V rafinerii se zahřívá a rozdělí na různé části, třeba petrolej, benzín, naftu a asfalt. Nejdřív se z ní vyráběl hlavně petrolej do lamp. S auty se nejcennější částí stal benzín.",
    fact: "Ignacy Łukasiewicz vyrobil petrolejovou lampu a v Polsku postavil jednu z prvních rafinerií na světě. Benzín se tehdy často vyléval jako zbytečný odpad.",
    wiki: "Rafinerie",
  },
  electronics: {
    when: "1904 až 1947",
    text: "Elektronika ovládá elektrický proud tak jemně, že s ním jde přenášet zvuk, obraz i čísla. Nejdřív k tomu sloužily skleněné elektronky velké jako žárovky, díky nimž fungovalo rádio. V roce 1947 vynalezli v Americe tranzistor, který byl malý a nehřál se.",
    fact: "V mobilním telefonu jsou dnes miliardy tranzistorů a každý je mnohem menší než bakterie.",
    wiki: "Elektronika",
  },
  communism: {
    when: "1848 až 1989",
    text: "Karel Marx a Bedřich Engels napsali v roce 1848, že majetek má patřit všem společně. Komunistické strany pak převzaly vládu v Rusku a v dalších zemích. V Československu vládla komunistická strana od roku 1948 do roku 1989. Lidé nesměli volně cestovat do ciziny a za kritiku vlády mohli jít do vězení.",
    fact: "Vláda komunistů v Československu skončila sametovou revolucí v listopadu 1989. Proto je 17. listopad státní svátek.",
    wiki: "Komunismus",
  },
  combustion: {
    when: "1876",
    text: "Ve spalovacím motoru vybuchuje směs paliva se vzduchem přímo uvnitř válce a tlačí na píst. Je mnohem menší a lehčí než parní stroj s kotlem. Nikolaus Otto sestavil čtyřdobý motor, který se používá dodnes. Rudolf Diesel vymyslel motor na naftu.",
    fact: "Na světové výstavě v Paříži v roce 1900 jezdil Dieselův motor na arašídový olej.",
    wiki: "Spalovací motor",
  },
  automobile: {
    when: "1886",
    text: "Carl Benz postavil tříkolový vůz s benzínovým motorem a nechal si ho patentovat. Jeho žena Bertha s ním pak bez manželova vědomí ujela se dvěma syny přes sto kilometrů za svou matkou a ukázala, že auto opravdu funguje. Brzy začaly auta vyrábět desítky firem.",
    fact: "Prvním autem ve střední Evropě byl vůz Präsident z Kopřivnice z roku 1897. Kopřivnická firma vyrábí dodnes nákladní auta Tatra.",
    wiki: "Automobil",
  },
  flight: {
    when: "1903",
    text: "Bratři Wrightové postavili letadlo s motorem a vrtulí. Dne 17. prosince 1903 s ním poprvé uletěli 36 metrů za 12 sekund. Už o šest let později přeletěl Louis Blériot kanál La Manche. Létat chtěli lidé odjakživa, předtím se ale vznesli jen v balonech.",
    fact: "Prvním Čechem, který vzlétl s letadlem, byl Jan Kašpar. Povedlo se mu to v Pardubicích v roce 1910.",
    wiki: "Letectví",
  },
  advancedFlight: {
    when: "1939",
    text: "Proudový motor nasává vzduch, stlačí ho, spálí v něm palivo a horké plyny vyfukuje dozadu. Letadla s ním létají mnohem rychleji a výš než s vrtulí. Dnes lidé přeletí oceán za pár hodin. Obří dopravní letadla unesou přes čtyři sta cestujících.",
    fact: "Letadlo Concorde létalo dvakrát rychleji než zvuk. Z Londýna do New Yorku se dostalo za necelé tři a půl hodiny.",
    wiki: "Proudový motor",
  },
  massProduction: {
    when: "1913",
    text: "Henry Ford zavedl pohyblivý pás. Auto jelo po pásu kolem dělníků a každý přidal jen jednu součástku. Výroba jednoho auta se tím zkrátila z dvanácti hodin na hodinu a půl. Auta zlevnila natolik, že si je mohly koupit obyčejné rodiny.",
    fact: "Pásovou výrobu zavedla i Baťova továrna ve Zlíně. Boty putovaly mezi dělníky po pásu.",
    wiki: "Sériová výroba",
  },
  laborUnion: {
    when: "od roku 1886",
    text: "Dělníci v továrnách pracovali dlouhé hodiny za malou mzdu. Jednotlivec s tím nic nezmohl, a tak se spojili do odborů a vyjednávali společně. Prosadili osmihodinový pracovní den, placenou dovolenou a bezpečnější práci.",
    fact: "Svátek práce 1. května připomíná stávku dělníků v Chicagu v roce 1886, kteří žádali osmihodinový pracovní den.",
    wiki: "Odborová organizace",
  },
  geneticEngineering: {
    when: "1865 až 1996",
    text: "Mnich Gregor Mendel v Brně křížil hrách a zjistil, podle jakých pravidel se vlastnosti dědí. O sto let později vědci popsali DNA, molekulu, ve které je zapsaný návod na každý živý tvor. Genetičtí inženýři dnes umí ten návod upravit, třeba aby bakterie vyráběly lék na cukrovku.",
    fact: "V roce 1996 se narodila ovce Dolly, první savec naklonovaný z buňky dospělého zvířete.",
    wiki: "Genetické inženýrství",
  },
  computers: {
    when: "1945",
    text: "Počítač provádí miliony výpočtů podle programu, který mu člověk napíše. Jeden z prvních elektronických počítačů ENIAC vážil 27 tun a zabral celou místnost. Dnes je mnohem výkonnější počítač v každém telefonu. První program napsala už v roce 1843 Ada Lovelace pro stroj, který se tehdy nepodařilo dostavět.",
    fact: "První československý počítač SAPO postavil tým Antonína Svobody a pracoval od roku 1957. Měl sedm tisíc relé, která cvakala jako stovky hodin.",
    wiki: "Počítač",
  },
  rocketry: {
    when: "1926",
    text: "Raketa letí, protože prudce vyfukuje plyny dozadu, a nepotřebuje k tomu vzduch. Proto dokáže letět i ve vesmíru. Číňané stříleli rakety se střelným prachem už ve středověku. Robert Goddard v roce 1926 odpálil první raketu na kapalné palivo.",
    fact: "Goddardova první raketa letěla jen dvě a půl sekundy a dopadla do zelí. Za necelých padesát let rakety dovezly lidi na Měsíc.",
    wiki: "Raketa",
  },
  nuclearFission: {
    when: "1938",
    text: "Když se do jádra uranu trefí neutron, jádro se rozštěpí na dvě menší a uvolní obrovské množství energie. Objevili to Otto Hahn a Fritz Strassmann a vysvětlila Lise Meitnerová. Štěpení jednoho kilogramu uranu uvolní tolik energie jako spálení zhruba tří tisíc tun uhlí.",
    fact: "Marie Curie-Skłodowská objevila radium v uranové rudě z Jáchymova. Je to stejné město, podle kterého se jmenuje dolar.",
    wiki: "Jaderné štěpení",
  },
  spaceFlight: {
    when: "1957 až 1969",
    text: "V roce 1957 vynesla raketa na oběžnou dráhu první umělou družici Sputnik. Jurij Gagarin obletěl jako první člověk Zemi 12. dubna 1961. V červenci 1969 přistáli Neil Armstrong a Buzz Aldrin na Měsíci. Dnes ve vesmíru obíhá Mezinárodní vesmírná stanice, kde pořád žijí astronauti.",
    fact: "Vladimír Remek letěl do vesmíru v roce 1978. Byl to první kosmonaut, který nebyl Američan ani Sovět.",
    wiki: "Kosmonautika",
  },
  plastics: {
    when: "1907",
    text: "Plasty jsou látky z ropy, které jde ohřát a vytvarovat do jakékoli podoby. Prvním plně umělým plastem byl bakelit. Dnes jsou z plastu obaly, hračky, oblečení i součástky letadel. Problém je, že se v přírodě rozkládají stovky let.",
    fact: "Otto Wichterle vymyslel měkké kontaktní čočky. První stroj na jejich výrobu sestavil doma v roce 1961 ze stavebnice Merkur.",
    wiki: "Plast",
  },
  robotics: {
    when: "1961",
    text: "Robot je stroj, který sám vykoná práci podle programu. První průmyslový robot Unimate začal v roce 1961 svařovat auta v americké továrně. Dnes roboti montují auta, operují pacienty a jezdí po Marsu.",
    fact: "Slovo robot vymyslel malíř Josef Čapek pro hru svého bratra Karla Čapka R.U.R. z roku 1920. Dnes ho zná celý svět.",
    wiki: "Robot",
  },
  superconductor: {
    when: "1911",
    text: "Některé látky po ochlazení na hodně nízkou teplotu vedou elektrický proud úplně bez odporu. Objevil to Heike Kamerlingh Onnes, když ochladil rtuť na minus 269 stupňů. Supravodivé magnety jsou v nemocničních přístrojích na magnetickou rezonanci a nesou rychlovlaky.",
    fact: "Japonský vlak na magnetickém polštáři dosáhl v roce 2015 rychlosti 603 kilometrů za hodinu.",
    wiki: "Supravodivost",
  },
  nuclearPower: {
    when: "1954",
    text: "Jaderná elektrárna řízeně štěpí uran a teplem vaří vodu. Pára pak točí turbínu, která vyrábí elektřinu. Elektrárna při tom nevypouští kouř, ale vyhořelé palivo se musí tisíce let bezpečně skladovat. První jaderná elektrárna dodávající proud do sítě začala pracovat v Obninsku v roce 1954.",
    fact: "Česko má jaderné elektrárny Dukovany a Temelín. Vyrábějí asi třetinu elektřiny, kterou spotřebujeme.",
    wiki: "Jaderná elektrárna",
  },
  recycling: {
    when: "od 70. let 20. století",
    text: "Recyklace znamená, že se z odpadu vyrobí nová věc. Ze starých novin je nový papír, ze střepů nové sklo a z PET lahví třeba fleecová mikina. Šetří se tím suroviny i energie a ubývá skládek.",
    fact: "Výroba hliníku z recyklovaných plechovek spotřebuje asi o 95 procent méně energie než výroba z rudy.",
    wiki: "Recyklace",
  },
  fusionPower: {
    when: "dnes a v budoucnosti",
    text: "Slunce svítí, protože v jeho nitru se jádra vodíku spojují na helium. Při tom vzniká obrovská energie. Vědci se snaží totéž zvládnout na Zemi v zařízeních zvaných tokamak, kde je žhavý plyn sevřený magnety. Kdyby se to povedlo, měli bychom skoro nevyčerpatelný a čistý zdroj energie.",
    fact: "Ve Francii se staví obří fúzní reaktor ITER, na kterém spolupracuje přes třicet zemí. Svůj tokamak má i Ústav fyziky plazmatu v Praze.",
    wiki: "Jaderná fúze",
  },
};

/** Era names in Czech, index = era number. */
export const ERA_NAMES = ["", "Pravěk a starověk", "Antika", "Středověk a renesance", "Novověk", "Moderní doba"];

export function wikiUrl(title: string): string {
  return `https://cs.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

/**
 * Pictures for the encyclopedia, one per technology, kept in src/web/techs/
 * and named by the technology id (pottery.webp, bronze.jpg …). Pages without
 * a picture show the large icon instead.
 */
const PICTURE_FILES = import.meta.glob<string>("./techs/*.{webp,jpg,jpeg,png}", {
  eager: true,
  query: "?url",
  import: "default",
});

export function techPicture(tech: TechId): string | null {
  for (const [path, url] of Object.entries(PICTURE_FILES)) {
    const name = path.split("/").pop()!.replace(/\.[a-z]+$/, "");
    if (name === tech) return url;
  }
  return null;
}
