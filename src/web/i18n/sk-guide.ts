import type { GuideKey, GuidePage } from "../guidePages";

/** Slovak "How to play" pages, same keys and placeholders as GUIDE_PAGES. */
export const SK_GUIDE: Record<GuideKey, GuidePage> = {
  "how-start": {
    title: "Ako začať",
    icon: "🏕️",
    text: `Začínaš s osadníkom a bojovníkom. Nájdi osadníkom dobré miesto a klávesom B tam založ hlavné mesto. Hodí sa políčko pri rieke alebo pri mori, okolo veľa lúk a plání a trochu lesa alebo kopcov. Lúky a pláne dávajú jedlo, les a kopce štíty na výrobu.

Nečakaj príliš dlho. Každý ťah bez mesta je stratený ťah. Bojovníka nechaj v meste ako stráž, alebo s ním pár ťahov preskúmaj okolie.

V prvom meste postav najprv bojovníka na obranu a potom osadníka. Osadník mestu uberie jedného obyvateľa, ale založí nové mesto, a to sa čoskoro vráti. Viac miest znamená viac jedla, výroby aj vedy.

Hneď na začiatku vyber, čo budú tvoji učenci skúmať. Keď nevieš, začni Hrnčiarstvom, Spracovaním bronzu alebo Pohrebnými obradmi, ktoré odomknú chrám.

Pred novou hrou si v okne s národmi môžeš nastaviť svet. Vyberieš jeho veľkosť, počet súperov a to, či okolo kontinentu ležia ostrovy. V ďalších nastaveniach zmeníš množstvo pevniny, teplotu, zrážky, vek sveta a suroviny. Nastavenie sveta nesie aj kód mapy, takže kto zadá rovnaký kód, dostane rovnaký svet.`,
  },
  "how-growth": {
    title: "Ako nechať mestá rásť",
    icon: "🌾",
    text: `Každý obyvateľ zje {foodPerCitizen} jedla za ťah. Čo zostane, ide do zásobárne mesta. Keď je zásobáreň plná, mesto vyrastie o jedného obyvateľa. Malé mesto potrebuje jedla málo, každý ďalší stupeň zásobárne pojme o {growthFoodBase} jedla viac.

Jedlo dávajú hlavne lúky, pláne, rieky a more. Osadník môže políčko zavlažiť, aby dávalo viac jedla. Zavlažovať sa dá len pri vode: pri rieke, mori, inom zavlaženom políčku alebo meste. Suroviny ako ryby alebo úrodná pôda pridajú jedla navyše.

Mesto bez akvaduktu vyrastie najviac na {maxCitySize} obyvateľov. S akvaduktom môže rásť až na {aqueductSize}. Sýpka po raste mesta podrží polovicu jedla, takže ďalší rast príde skôr. Prístav pridá jedlo na morských políčkach.

Keď mesto hladuje, zásobáreň sa vyprázdni a mesto sa zmenší. Otvor ho a presuň obyvateľov na políčka s jedlom. Jedlo zo svojho mesta jedia aj osadníci.`,
  },
  "how-happy": {
    title: "Ako udržať obyvateľov spokojných",
    icon: "😊",
    text: `Obyvatelia sú šťastní, spokojní alebo nespokojní. Prví {contentBase} obyvatelia každého mesta sú spokojní a každý ďalší je nespokojný. Keď má mesto viac nespokojných ako spokojných a šťastných dohromady, vypuknú nepokoje a mesto celý ťah nič nevyrobí ani nezarobí.

Veľkú ríšu je ťažšie udržať. Pri viac ako {empireSizeBase} mestách má každé mesto o jedného spokojného menej, a o ďalšieho menej za každých ďalších {empireSizeStep} miest.

Chrám upokojí {templeContent} nespokojných. Amfiteáter a katedrála upokoja ešte viac. Niektoré divy sveta upokojujú obyvateľov vo všetkých tvojich mestách. Za despotizmu, monarchie a komunizmu upokojí každý vojak v meste jedného nespokojného, najviac {martialLawMax} vojaci na mesto. V republike a demokracii to nefunguje a vojaci mimo vlastných miest naopak ľudí rozladia.

Posuvník Zábava hore pošle časť obchodu na zábavu. Každé {luxuryPerContent} body zábavy v meste najprv upokoja jedného nespokojného. Keď už nikto nespokojný nie je, urobia zo spokojného šťastného. Trhovisko zábavu zväčší.

Keď mesto s aspoň {celebrationMinSize} obyvateľmi nemá nikoho nespokojného a šťastných má aspoň toľko ako spokojných, oslavuje. Za despotizmu potom jeho políčka strácajú postih, za monarchie a komunizmu dajú políčka s obchodom obchod navyše a v republike alebo demokracii mesto rastie každý ťah o jedného obyvateľa, kým má jedla nazvyš. Oslavy v republike sú najrýchlejšia cesta k veľkým mestám.

Obyvateľ, ktorého odvoláš z poľa, je špecialista. Zabávač dáva {specialistYield} body zábavy. V meste s aspoň {specialistMinSize} obyvateľmi môžeš na špecialistu kliknúť a urobiť z neho výbercu daní, ktorý prinesie {specialistYield} zlata, alebo vedca, ktorý prinesie {specialistYield} body vedy. Zabávačov hra pridá sama, keď hrozia nepokoje.`,
  },
  "how-production": {
    title: "Ako vyrábať viac",
    icon: "⚒️",
    text: `Štíty z políčok mesta idú do výroby. Najviac štítov dávajú lesy, kopce a hory. Baňa na kopci pridá ďalšie. Uhlie, kone alebo zlato na políčku dajú ešte viac.

Mesto si môže naplánovať až {queueLength} stavby za sebou. Tlačidlom + pri stavbe ju pridáš do plánu, šípkami alebo ťahaním zmeníš poradie. Keď mesto jednu vec dokončí, samo začne ďalšiu.

Za zlato sa výroba dá kúpiť hneď. Najdrahší je nákup, keď mesto ešte nič nevyrobilo, doplatiť zvyšok je lacnejšie. Divy sveta stoja dvojnásobok.

Továreň pridá polovicu štítov a elektráreň ďalšiu štvrtinu. Každá jednotka nad počet, ktorý mesto živí zadarmo, stojí štít za ťah. Keď nie je čo stavať, vyber Zarábať zlato a štíty sa zmenia na zlato.`,
  },
  "how-trade": {
    title: "Ako deliť obchod na vedu, dane a zábavu",
    icon: "⚖️",
    text: `Obchod dávajú rieky, moria, oceány a cesty na pláňach, lúkach a púšti. Obchod každého mesta sa delí na tri časti: vedu, dane a zábavu. Posuvníky Veda a Zábava hore určujú, koľko ide do vedy a na zábavu. Dane dostanú zvyšok.

Veda posúva výskum. Dane platia údržbu budov a dajú sa šetriť na nákupy. Zábava robí obyvateľov spokojnými a šťastnými.

Tvoja vláda určuje, koľko najviac môžeš dať do jednej časti. Za despotizmu je to {despotismMax} %, za demokracie až {democracyMax} %. Posuvníky sa hýbu po {rateStep} %.

Knižnice, univerzity a výskumné centrá pridávajú vedu. Trhoviská a banky pridávajú dane a zábavu. Karavána môže otvoriť obchodnú cestu do vzdialeného mesta, aspoň {tradeRouteMinDistance} políčok ďaleko, ktorá potom každý ťah prináša obchod.`,
  },
  "how-research": {
    title: "Ako rýchlo bádať",
    icon: "🔬",
    text: `Každý objav stojí viac ako ten predchádzajúci. Veda zo všetkých tvojich miest sa sčíta, takže viac miest bádá rýchlejšie.

V strome technológií klikni na vzdialenú technológiu a nastav ju ako cieľ. Hra potom sama vyberá objavy, ktoré k nej vedú.

Knižnice stavaj v mestách s veľkým obchodom. Najviac ho majú mestá pri riekach a pri mori. Republika a demokracia dávajú viac obchodu na každom políčku, ktoré už nejaký má.

Sieň učencov pridáva vedu vo všetkých tvojich mestách a Veľké observatórium zdvojnásobí vedu vo svojom meste. Alexandrijská knižnica ti dá každú technológiu, ktorú poznajú aspoň dve iné ríše. Na konci stromu čaká vesmírna loď.`,
  },
  "how-settlers": {
    title: "Ako pracujú osadníci",
    icon: "⛏️",
    text: `Osadníci zakladajú mestá a zveľaďujú krajinu. Cesta zrýchli pohyb a na pláňach, lúkach a púšti pridá obchod. Zavlažovanie pridá jedlo. Baňa pridá štíty na kopcoch a horách. Železnica pridá ďalšie štíty a pohyb po nej nič nestojí.

Osadníci vedia meniť aj terén. Zavlažovanie vyklčuje les na pláň a vysuší džungľu alebo močiar na lúku. Baňa urobí opak a vysadí les na lúke, pláni, v džungli alebo močiari. Zmena terénu nepotrebuje vodu, ale trvá dlhšie ako bežná práca.

Klávesom A necháš osadníka pracovať samého. Zveľaďuje políčka okolo tvojich miest, najprv tie obrábané, a čistí aj znečistenie. Klávesom K a klikom na cieľ dáš osadníkovi postaviť cestu po celej trase. Hodí sa na spojenie miest.

Keď osadník stojí v tvojom meste, klávesom B sa k mestu pridá a mesto vyrastie o jedného obyvateľa. Funguje to pri mestách menších ako {joinCityMaxSize} obyvateľov, ktoré ešte môžu rásť. Hodí sa to, keď máš osadníkov viac, ako potrebuješ.

Znečistené políčko dáva polovicu. Osadník ho klávesom V vyčistí za {pollutionCleanTurns} ťahy.

Nové mestá zakladaj pár políčok od seba. Mestá sa nesmú dotýkať a každé chce okolo seba dosť polí.`,
  },
  "how-government": {
    title: "Akú vládu zvoliť",
    icon: "🏛️",
    text: `Hra začína despotizmom. Ten berie štít, jedlo alebo obchod políčkam, ktoré dávajú viac ako dva. Preto sa oplatí objaviť monarchiu, čo najskôr to ide.

Monarchia ten postih ruší a znižuje korupciu. Republika a demokracia pridávajú obchod a tým aj vedu, ale vojaci mimo vlastných miest tam obyvateľov rozladia. Komunizmus má všade rovnakú malú korupciu. Každá vláda dáva oslavujúcim mestám inú odmenu.

Demokracia neznesie dlhé nepokoje. Keď sa mesto búri dva ťahy po sebe, vláda môže padnúť a ríša spadne do anarchie.

Zmena vlády začína revolúciou. Potom prídu {anarchyTurns} ťahy anarchie, keď sa nevyberajú dane a nebádá sa. Všetok obchod ide na zábavu. S pyramídami sa vláda zmení hneď a môžeš vybrať ktorúkoľvek, aj takú, ktorú si ešte neobjavil.`,
  },
  "how-wonders": {
    title: "Ako stavať divy sveta",
    icon: "🏆",
    text: `Každý div môže mať len jedna ríša. Kto ho dokončí prvý, ten ho má, a ostatní prídu o svoje štíty alebo ich presunú na inú stavbu.

Divy sú drahé, ale ich účinok býva silný. Niektoré pôsobia len vo svojom meste, iné vo všetkých tvojich mestách. Niektoré prestanú pôsobiť, keď objavíš určitú technológiu.

Divy stavaj v mestách s veľkou výrobou. Karavány z iných miest môžu na div pridať štíty. Kúpiť div stojí dvojnásobok oproti bežnej stavbe.`,
  },
  "how-corruption": {
    title: "Ako bojovať s korupciou a znečistením",
    icon: "🏭",
    text: `Čím ďalej je mesto od paláca, tým viac obchodu stratí na korupcii. Je to {corruptionPerTile} % za každé políčko vzdialenosti, najviac {corruptionMaxPct} %. Súdny dvor korupciu zníži. Hlavné mesto žiadnu nemá.

Veľký priemysel a veľa obyvateľov špinia okolie. Do {pollutionFree} bodov znečistenia sa nič nedeje. Každý bod navyše pridá {pollutionPctPerPoint} % šancu, že mesto v tomto ťahu znečistí jedno políčko v okolí. Znečistené políčko dáva polovicu jedla, štítov aj obchodu, kým ho osadník nevyčistí.

Keď vo svete zostáva priveľa znečistenia, plní sa hore počítadlo globálneho otepľovania. Keď dôjde na 100 %, krajina sa zmení. Pri mori vzniknú močiare a džungle a vo vnútrozemí sa lúky, pláne a lesy zmenia na púšť.

Vodné a jadrové elektrárne, recyklačné centrá a hromadná doprava znečistenie znižujú. Jadrová elektráreň v meste s nepokojmi sa však môže roztaviť, zabiť polovicu obyvateľov a znečistiť okolie. Toto nebezpečenstvo trvá, kým neobjavíš jadrovú fúziu.`,
  },
  "how-combat": {
    title: "Ako bojovať",
    icon: "⚔️",
    text: `Na nepriateľa zaútočíš tak, že na neho pošleš vojenskú jednotku zo susedného políčka. Pred bojom hra ukáže silu oboch jednotiek a šancu na výhru a ty sa rozhodneš, či zaútočíš. Útok stojí jeden pohyb a útočník zostáva na svojom políčku.

Boj beží v kolách. V každom kole vyhrá útočník so šancou útok delený súčtom útoku a obrany. Porazený príde o toľko životov, koľko má víťaz palebnej sily. Kto prvý príde o všetky životy, padne. Preto silnejšia jednotka vyhráva oveľa istejšie, než by naznačoval jeden hod kockou.

Terén pomáha obrancovi. Kopce obranu zdvojnásobia, hory strojnásobia a les, džungľa, močiar a rieka pridajú štvrtinu. Opevnená jednotka a jednotka v meste sa bránia o {fortifiedPct} % lepšie, v pevnosti o {fortressPct} % lepšie. Hradby pridajú {wallsPct} % proti pozemným jednotkám a pobrežná pevnosť zdvojnásobí obranu proti lodiam.

Keď obranca padne vo voľnej krajine, padnú s ním všetky jednotky na jeho políčku. V meste alebo pevnosti padne len obranca. Víťaz sa so šancou {veteranChancePct} % stane veteránom a potom útočí aj bráni o {veteranPct} % lepšie. Jednotky z mesta s kasárňami sú veteráni hneď.

Zranená jednotka bojuje so životmi, ktoré jej zostali. Keď celý ťah stojí, vylieči sa v poli o {healFieldPct} %, vo vlastnom meste o {healCityPct} % a v meste s kasárňami úplne.

Tvoja vojenská jednotka môže vojsť do mesta bez obrancov a dobyť ho. Mesto príde o jedného obyvateľa, každá budova zanikne so šancou {captureBuildingLossPct} % a divy zostanú. Dostaneš časť zlata porazenej ríše a jednu jej technológiu. Mesto s jediným obyvateľom pri dobytí zanikne. Kto príde o posledné mesto, vypadáva z hry.

Národy sa spoznajú, keď sa ich jednotky alebo mestá uvidia, a najprv spolu žijú v mieri. Zaútočiť môžeš len na národ, s ktorým bojuješ. Keď pošleš jednotku na národ, s ktorým žiješ v mieri, hra sa spýta, či mu chceš vyhlásiť vojnu. Súperi vyhlásia vojnu sami, keď majú silnejšiu armádu, a potom tiahnu na najbližšie mesto v skupine. Mier ponúkneš v okne Národy a súper odpovie vo svojom ťahu. Súperi sami ponúkajú mier, keď ich vojna unavuje alebo sa im nedarí. Uzavretý mier platí aspoň {treatyTurns} ťahov a kto ho poruší skôr, tomu ostatné národy prestanú veriť.

Na mape ležia ruiny starých miest. Keď do nich vojde tvoja pozemná jednotka, nájde zlato, starý objav, žoldnierov alebo kočovníkov, ktorí sa k tebe pridajú. Niekedy sú ruiny prázdne a niekedy z nich vyrazia barbari. Barbari bojujú so všetkými. Objavia sa v divočine ďaleko od miest alebo sa vylodia na pobreží a tiahnu na najbližšie mesto. Pri malom počte barbarov chodia zhruba od 45. ťahu, pri veľkom už od 25. ťahu. Dobyté mesto si nechajú a stavajú v ňom ďalších barbarov, kým ho niekto nevezme späť. Koľko ich má byť, nastavíš v okne novej hry.`,
  },
  "how-disasters": {
    title: "Ako chrániť mestá pred pohromami",
    icon: "🌋",
    text: `Od {disasterStart}. ťahu je každý ťah malá šanca, že jedno z tvojich miest postihne pohroma. Správna budova jej zabráni a hra ti oznámi, že mesto ochránila.

Požiar zničí budovu a mor zabije časť obyvateľov. Pred oboma chráni akvadukt, pred morom aj objav lekárstva. Hladomor vyprázdni sýpku a vezme obyvateľov, chráni pred ním sýpka.

Mestám pri rieke hrozia povodne, ktoré zastavia hradby. Prímorské mestá prepadávajú piráti, ktorí vezmú zásoby aj rozostavanú výrobu, kasárne ich odrazia. Mestám pri horách hrozia sopky a chráni ich chrám.

Zemetrasenie v mestách pri kopcoch zbúra budovu a nič proti nemu nepomôže. Divy sveta ani palác pohromy nikdy nezničia.`,
  },
  "how-space": {
    title: "Ako vyhrať",
    icon: "🚀",
    text: `Hra trvá {maxTurns} ťahov a vyhrať sa dá tromi spôsobmi. Keď porazíš všetkých súperov, vyhráš dobytím. Keď tvoja vesmírna loď pristane pri cudzej hviezde ako prvá, vyhráš vesmírne preteky. A keď po poslednom ťahu nikto nevyhral, vyhrá ríša s najvyšším skóre. Skóre dáva bod za každého obyvateľa, ďalší bod za každého šťastného, {scoreTech} body za každý objav a {scoreWonder} bodov za každý div. Ako si stojíš proti národom, ktoré poznáš, ukáže rebríček v menu.

Diely vesmírnej lode sa stavajú v mestách ako budovy, ale až po programe Apollo. Nosné konštrukcie, najviac {maxStructural}, nesú motory a moduly. Motory skracujú let a každý modul pridá {successPerModule} % k šanci na bezpečné pristátie. Loď štartuje z tvojho hlavného mesta.

Diely stavaj vo viacerých mestách naraz a loď pošli, keď má aspoň tri moduly. Potom je pristátie takmer isté.`,
  },
  "how-tips": {
    title: "Tipy na rýchly rast",
    icon: "💡",
    text: `Zakladaj veľa miest skoro. Päť miest po dvadsiatich ťahoch dá viac ako jedno veľké mesto.

Osadníkov stavaj v mestách s veľkým množstvom jedla, vojakov a divy v mestách s veľkým množstvom štítov.

Zveľaďuj krajinu okolo miest. Zavlažené lúky a cesty okolo mesta urobia z malého mesta veľké.

Objav skoro monarchiu a neskôr republiku. Knižnice a trhoviská sa oplatia v mestách s veľkým obchodom.

Sleduj náladu. Skôr ako mesto prerastie {contentBase} obyvateľov, daj mu chrám alebo vojaka.

Keď máš veľa zlata, kupuj osadníkov a knižnice. Zlato v pokladnici samo nič neprinesie.

Radca vľavo hore ti povie, čo je práve najdôležitejšie.`,
  },
};
