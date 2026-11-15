/**
 * The "How to play" chapter of the encyclopedia: how the rules work and how
 * to make an empire grow. Texts are Czech; other languages have their own
 * copy in src/web/i18n. Paragraphs are separated by a blank line and
 * {placeholders} are filled with rule numbers from game.json, so the texts
 * stay true when the numbers change.
 */
import { BUILDINGS, GOVERNMENTS, RULES } from "../core";

export interface GuidePage {
  title: string;
  /** A large symbol shown instead of a picture. */
  icon: string;
  text: string;
}

export const GUIDE_KEYS = [
  "how-start",
  "how-growth",
  "how-happy",
  "how-production",
  "how-trade",
  "how-research",
  "how-settlers",
  "how-government",
  "how-wonders",
  "how-corruption",
  "how-space",
  "how-tips",
] as const;

export type GuideKey = (typeof GUIDE_KEYS)[number];

/** Rule numbers the guide texts may mention as {name}. */
export function guideNumbers(): Record<string, number> {
  return {
    contentBase: RULES.contentBase,
    maxCitySize: RULES.maxCitySize,
    aqueductSize: BUILDINGS.aqueduct.effects.maxSize ?? 16,
    foodPerCitizen: RULES.foodPerCitizen,
    growthFoodBase: RULES.growthFoodBase,
    luxuryPerContent: RULES.luxuryPerContent,
    martialLawMax: RULES.martialLawMax,
    templeContent: BUILDINGS.temple.effects.content ?? 2,
    rateStep: RULES.rateStep,
    despotismMax: GOVERNMENTS.despotism.maxRate,
    democracyMax: GOVERNMENTS.democracy.maxRate,
    anarchyTurns: RULES.anarchyTurns,
    corruptionPerTile: RULES.corruptionPerTile,
    corruptionMaxPct: RULES.corruptionMaxPct,
    pollutionFree: RULES.pollutionFree,
    queueLength: RULES.queueLength,
    maxTurns: RULES.maxTurns,
    tradeRouteMinDistance: RULES.tradeRouteMinDistance,
    successPerModule: RULES.spaceship.successPerModule,
    maxStructural: RULES.spaceship.maxStructural,
  };
}

export const GUIDE_PAGES: Record<GuideKey, GuidePage> = {
  "how-start": {
    title: "Jak začít",
    icon: "🏕️",
    text: `Na začátku máš osadníka a válečníka. Osadníkem najdi dobré místo a klávesou B na něm založ hlavní město. Hodí se políčko u řeky nebo u moře, kolem kterého je hodně louky a plání a k tomu trochu lesa nebo kopců. Louka a pláně dávají jídlo, les a kopce štíty na výrobu.

Neváhej moc dlouho. Každý tah bez města je ztracený tah. Válečníka nech ve městě, aby ho chránil, nebo s ním na pár tahů prozkoumej okolí.

V prvním městě postav nejdřív válečníka na obranu a potom osadníka. Osadník vezme městu jednoho obyvatele, ale založí nové město, a to se rychle vrátí. Víc měst znamená víc jídla, výroby i vědy.

Hned na začátku vyber, co budou tví učenci zkoumat. Když nevíš, začni hrnčířstvím, bronzem nebo pohřebními obřady, které odemknou chrám.`,
  },
  "how-growth": {
    title: "Jak nechat města růst",
    icon: "🌾",
    text: `Každý obyvatel sní za tah {foodPerCitizen} jídla. Co zbude, jde do sýpky města. Když se sýpka naplní, město vyroste o jednoho obyvatele. Malé město potřebuje málo jídla, každé další patro sýpky je o {growthFoodBase} jídla větší.

Jídlo dávají hlavně louky, pláně, řeky a moře. Osadník může políčko zavlažit, pak dá jídla víc. Zavlažovat jde jen vedle vody, tedy vedle řeky, moře, jiného zavlaženého políčka nebo města. Suroviny jako ryby nebo úrodná půda přidávají jídlo navíc.

Město bez akvaduktu doroste nejvýš na {maxCitySize} obyvatel. Akvadukt dovolí růst až na {aqueductSize}. Sýpka po růstu nechá v sýpce polovinu jídla, takže další růst přijde dřív. Přístav přidá jídlo na mořských políčkách.

Když město hladoví, sýpka se vyprázdní a město se zmenší. Otevři ho a pošli obyvatele na políčka s jídlem. Osadníci navíc jedí jídlo svého domovského města.`,
  },
  "how-happy": {
    title: "Jak udělat obyvatele šťastnými",
    icon: "😊",
    text: `Prvních {contentBase} obyvatel v každém městě je spokojených. Každý další je nespokojený. Když je ve městě víc nespokojených než spokojených, vypuknou nepokoje a město celý tah nic nevyrobí ani nevydělá.

Nespokojené uklidní chrám, který uklidní {templeContent} obyvatele. Amfiteátr a katedrála uklidní ještě víc. Některé divy světa uklidňují obyvatele ve všech tvých městech.

Za despocie, monarchie a komunismu uklidní každý voják ve městě jednoho nespokojeného, nejvýš {martialLawMax} vojáci na město. V republice a demokracii to nejde. Tam naopak vojáci mimo vlastní města lidi rozlaďují.

Posuvník Zábava nahoře posílá část obchodu na zábavu. Každé {luxuryPerContent} body zábavy ve městě udělají z jednoho nespokojeného spokojeného. Tržiště zábavu zvětší. Když se blíží nepokoje v hodně městech najednou, zábava pomůže nejrychleji.

Poslední možnost je baviči. Klikni ve městě na obsazené políčko a obyvatel z pole odejde bavit ostatní. Bavič nic nevyrábí, ale udrží ve městě klid. Hra baviče přidává sama, když hrozí nepokoje.`,
  },
  "how-production": {
    title: "Jak víc vyrábět",
    icon: "⚒️",
    text: `Štíty z políček města jdou do výroby. Nejvíc štítů dávají lesy, kopce a hory. Důl na kopci přidá další štíty. Uhlí, koně nebo zlato na políčku dají ještě víc.

Ve městě si můžeš naplánovat až {queueLength} staveb za sebou. Tlačítkem + u stavby ji přidáš do plánu, šipkami nebo tažením změníš pořadí. Když město dostaví jednu věc, samo začne další.

Zlatem jde výrobu koupit hned. Nejdražší je kupovat, když město ještě nic nevyrobilo, levnější je dokoupit zbytek. Divy světa stojí dvojnásobek.

Továrna přidá polovinu štítů a elektrárna ještě čtvrtinu. Každá jednotka nad počet, který město živí zdarma, stojí štít za tah. Když nemáš co stavět, zvol Vydělávat zlato a štíty se změní na zlato.`,
  },
  "how-trade": {
    title: "Jak dělit obchod na vědu, daně a zábavu",
    icon: "⚖️",
    text: `Obchod přichází z řek, moří, oceánů a cest na pláních, loukách a v poušti. Obchod každého města se dělí na tři díly: vědu, daně a zábavu. Posuvníky Věda a Zábava nahoře nastavíš, kolik jde na vědu a na zábavu. Daně dostanou, co zbude.

Věda posouvá výzkum. Daně platí údržbu budov a dají se ušetřit na nákupy. Zábava dělá obyvatele spokojenými.

Vláda určuje, kolik nejvýš smíš dát do jednoho dílu. Za despocie je to {despotismMax} %, za demokracie až {democracyMax} %. Posuvníky se mění po {rateStep} %.

Knihovna, univerzita a výzkumné centrum přidávají vědu. Tržiště a banka přidávají daně i zábavu. Karavana může otevřít obchodní cestu do vzdáleného města, aspoň {tradeRouteMinDistance} políček daleko, a ta pak přináší obchod každý tah.`,
  },
  "how-research": {
    title: "Jak rychle bádat",
    icon: "🔬",
    text: `Každý objev stojí víc než ten předchozí. Věda ze všech měst se sčítá, takže víc měst rychleji bádá.

Ve stromu technologií klikni na vzdálenou technologii a nastav ji jako cíl. Hra pak sama vybírá objevy, které k ní vedou.

Postav knihovny ve městech s velkým obchodem. Města u řek a moře mají obchodu nejvíc. Republika a demokracie dávají víc obchodu na každém políčku, kde už nějaký je.

Síň učenců přidá vědu ve všech tvých městech a Velká hvězdárna zdvojí vědu ve svém městě. Alexandrijská knihovna ti dá každou technologii, kterou znají aspoň dvě jiné říše. Na konci stromu čeká vesmírná loď.`,
  },
  "how-settlers": {
    title: "Jak pracují osadníci",
    icon: "⛏️",
    text: `Osadník zakládá města a vylepšuje krajinu. Cesta zrychlí pohyb a na pláních, loukách a v poušti přidá obchod. Zavlažování přidá jídlo. Důl přidá štíty na kopcích a v horách. Železnice přidá další štíty a pohyb po ní nic nestojí.

Klávesou A pustíš osadníka pracovat samotného. Bude vylepšovat políčka kolem tvých měst, nejdřív ta, na kterých obyvatelé pracují.

Klávesou K a klikem na cíl postaví osadník cestu po celé trase. Hodí se k propojení měst.

Nová města zakládej tak, aby měla mezi sebou pár políček volna. Města se nesmí dotýkat a každé chce kolem sebe dost polí.`,
  },
  "how-government": {
    title: "Jakou zvolit vládu",
    icon: "🏛️",
    text: `Hra začíná v despocii. Ta ubírá štít, jídlo nebo obchod na políčkách, která dávají víc než dva. Proto se vyplatí co nejdřív objevit monarchii.

Monarchie ten postih ruší a snižuje korupci. Republika a demokracie přidávají obchod a tím i vědu, ale vojáci mimo vlastní města v nich rozlaďují obyvatele. Komunismus má všude stejně malou korupci.

Změna vlády začíná revolucí. Následuje {anarchyTurns} tahy anarchie, kdy se nevybírají daně a nebádá se. Celý obchod jde na zábavu. S pyramidami trvá revoluce jen jeden tah.`,
  },
  "how-wonders": {
    title: "Jak stavět divy světa",
    icon: "🏆",
    text: `Div světa může mít jen jedna říše. Kdo ho dostaví první, ten ho má, a ostatní o rozestavěné štíty přijdou nebo je přesunou na jinou stavbu.

Divy jsou drahé, ale jejich účinek bývá silný. Některé působí jen ve svém městě, jiné ve všech tvých městech. Některé přestanou působit, když objevíš určitou technologii.

Divy stav ve městech s velkou výrobou. Karavany z jiných měst můžou na div přidat štíty. Koupit div stojí dvojnásobek proti běžné stavbě.`,
  },
  "how-corruption": {
    title: "Jak se bránit korupci a znečištění",
    icon: "🏭",
    text: `Čím dál je město od paláce, tím víc obchodu ztratí korupcí. Za každé políčko vzdálenosti je to {corruptionPerTile} %, nejvýš {corruptionMaxPct} %. Soudní dvůr korupci zmenší. Hlavní město korupci nemá.

Velká výroba a hodně obyvatel špiní vzduch. Do {pollutionFree} bodů znečištění město nic nepozná. Nad tuhle hranici začnou být obyvatelé nespokojení. Vodní a jaderná elektrárna, recyklační centrum a městská hromadná doprava znečištění snižují.`,
  },
  "how-space": {
    title: "Jak vyhrát",
    icon: "🚀",
    text: `Hra trvá {maxTurns} tahů. Teď se vyhrává tak, že tvoje vesmírná loď přistane u cizí hvězdy jako první. Dobývání soupeřů a vítězství podle skóre přibudou s bojem ve fázi 3.

Díly lodi se stavějí ve městech jako budovy, ale až po programu Apollo. Nosné konstrukce, nejvýš {maxStructural}, drží motory a moduly. Motory zkrátí let a každý modul přidá {successPerModule} % šance na bezpečné přistání. Loď odstartuje z hlavního města.

Stav díly ve více městech najednou a pošli loď, až bude mít aspoň tři moduly. Pak je přistání skoro jisté.`,
  },
  "how-tips": {
    title: "Rady, jak rychle růst",
    icon: "💡",
    text: `Zakládej hodně měst brzy. Pět měst po dvaceti tazích dá víc než jedno velké město.

Ve městech s hodně jídlem stav osadníky, ve městech s hodně štíty vojáky a divy.

Vylepšuj okolí měst. Zavlažená louka a cesty kolem města udělají z malého města velké.

Brzy objev monarchii a později republiku. Knihovny a tržiště se vyplatí ve městech s velkým obchodem.

Hlídej spokojenost. Než město vyroste nad {contentBase} obyvatel, měj v něm chrám nebo vojáka.

Když máš hodně zlata, kupuj osadníky a knihovny. Zlato v pokladně samo nic nepřináší.

Rádce vlevo nahoře ti radí, co je právě nejdůležitější.`,
  },
};
