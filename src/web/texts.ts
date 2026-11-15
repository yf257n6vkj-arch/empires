/** Czech texts for the screen: error reasons and event messages. */
import {
  BUILDINGS,
  CIVS,
  GOVERNMENTS,
  IMPROVEMENTS,
  RULES,
  TECHS,
  productionName,
  UNIT_TYPES,
  type BuildingRule,
  type CommandError,
  type GameEvent,
  type GameState,
  type GovernmentRule,
  type UnitRule,
} from "../core";

export const ERROR_TEXT: Record<CommandError, string> = {
  unknownUnit: "Jednotka už neexistuje.",
  notYourUnit: "Tahle jednotka ti nepatří.",
  unknownCity: "Město už neexistuje.",
  notYourCity: "Tohle město ti nepatří.",
  noMovesLeft: "Jednotka už v tomhle tahu nemá pohyb.",
  notAdjacent: "Jednotka se může pohnout jen na sousední políčko.",
  cannotEnter: "Sem jednotka nemůže. Pozemní jednotka vstoupí na moře jen na vlastní loď s volným místem, loď pluje jen po moři a do přímořských měst.",
  notEnoughMoves: "Na tenhle terén už jednotce nezbývá dost pohybu.",
  occupiedByOther: "Políčko je obsazené jiným hráčem.",
  cannotFoundCity: "Město umí založit jen osadník.",
  cityTooClose: "Město nejde založit hned vedle jiného města.",
  cannotBuildImprovements: "Vylepšení umí stavět jen osadník.",
  terrainNotSuitable: "Na tomhle terénu to postavit nejde.",
  alreadyBuilt: "Tohle už na políčku je.",
  needsWater: "Zavlažování potřebuje vodu na sousedním políčku (moře, zavlažované políčko nebo město).",
  onCityTile: "Ve městě je cesta i zavlažování automaticky.",
  noPath: "Na tohle místo nevede žádná známá cesta.",
  invalidProduction: "Tohle město teď postavit nemůže.",
  queueFull: "Do plánu se víc staveb nevejde.",
  alreadyComplete: "Výroba je už zaplacená, dokončí se na konci tahu.",
  notEnoughGold: "Na nákup nemáš dost zlata.",
  unknownTech: "Taková technologie neexistuje.",
  cannotResearch: "Tuhle technologii teď zkoumat nejde. Buď ji už znáš, nebo ti chybí předchozí.",
  invalidRate: "Takový poměr výzkumu a zlata nejde. Mění se po deseti procentech a tvoje vláda dovolí dát vědě nebo zlatu jen určitý podíl.",
  alreadyKnown: "Tuhle technologii už znáš.",
  tileNotWorkable: "Tohle políčko město obdělávat nemůže. Buď je mimo jeho okolí, nebo ho obdělává jiné město.",
  tooManyWorkers: "Město nemá tolik obyvatel.",
  noShip: "Ve městě není tvoje loď s volným místem.",
  unknownGovernment: "Taková vláda neexistuje.",
  governmentNotKnown: "Tuhle vládu zatím neznáš, nejdřív ji musíš objevit.",
  alreadyGovernment: "Tuhle vládu už máš.",
  revolutionRunning: "Revoluce už probíhá.",
  spaceshipNotReady: "Loď ještě nemůže odstartovat. Potřebuje palác, aspoň jeden motor, jeden modul a na každý z nich nosnou konstrukci.",
  wrongUnit: "Tohle tahle jednotka neumí.",
  notBuildingWonder: "Město zrovna nestaví div světa.",
  notInCity: "Jednotka musí stát ve vlastním městě.",
  tooClose: `Obchodní cesta musí vést aspoň ${RULES.tradeRouteMinDistance} políček od domovského města.`,
  routeExists: "Tahle obchodní cesta už existuje.",
  tooManyRoutes: `Město může mít nejvýš ${RULES.tradeRoutesPerCity} obchodní cesty.`,
  noHomeCity: "Karavana nemá domovské město.",
  notForeign: "Tohle je tvoje vlastní město.",
  embassyExists: "Velvyslanectví u téhle říše už máš.",
  nothingToSteal: "Tahle říše nezná nic, co bys neznal ty.",
  alreadyStolen: "V tomhle městě už tvůj diplomat jednou kradl.",
  isCapital: "Hlavní město se podplatit nedá.",
  tooFar: "Tak daleko raketa v tomhle tahu nedoletí.",
  needsTech: "Na tohle ti chybí technologie.",
  needsRoad: "Železnice se staví na cestu.",
  carriesUnits: "Na palubě jsou jednotky. Na moři by se utopily, loď rozpusť až ve městě.",
  nothingToUpgrade: "Na novější typ zatím nejde povýšit, chybí ti technologie.",
};

/** "Římská říše": the realm of a player, for sentences with a feminine subject. */
export function realmName(state: GameState, player: number): string {
  const p = state.players[player];
  if (!p) return "Jiná říše";
  const adj = CIVS[p.civ].adjective;
  return `${adj.charAt(0).toUpperCase()}${adj.slice(1)} říše`;
}

export function cityName(state: GameState, id: number): string {
  return state.cities.find((c) => c.id === id)?.name ?? "Zaniklé město";
}

/** Text for the event log, or null for events the player does not need to read. */
export function eventText(state: GameState, e: GameEvent, viewer = 0): string | null {
  switch (e.type) {
    case "cityFounded":
      return `Založil jsi město ${cityName(state, e.cityId)}.`;
    case "cityGrew":
      return `${cityName(state, e.cityId)} vyrostlo na velikost ${e.size}.`;
    case "cityStarved":
      return `${cityName(state, e.cityId)} hladoví a zmenšilo se na ${e.size}.`;
    case "cityNeedsSize":
      return `${cityName(state, e.cityId)} má hotového osadníka, ale čeká, až bude mít aspoň dva obyvatele.`;
    case "unitBuilt":
      return `${cityName(state, e.cityId)} postavilo jednotku ${UNIT_TYPES[e.unitType].name}.`;
    case "buildingBuilt":
      return `${cityName(state, e.cityId)} postavilo budovu ${BUILDINGS[e.building].name}.`;
    case "productionNeeded": {
      const city = state.cities.find((c) => c.id === e.cityId);
      return city ? `${city.name} potřebuje novou výrobu, zatím staví: ${productionName(city.production)}.` : null;
    }
    case "wonderBuilt":
      return e.owner === viewer
        ? `${cityName(state, e.cityId)} dostavělo div světa ${BUILDINGS[e.building].name}!`
        : `Jiná říše dostavěla div světa ${BUILDINGS[e.building].name}.`;
    case "buildingSold":
      return `Nemáš na údržbu, a tak ${cityName(state, e.cityId)} prodalo budovu ${BUILDINGS[e.building].name}.`;
    case "cityDisorder":
      return `V ${cityName(state, e.cityId)} jsou nepokoje, město tento tah nic nevyrobilo.`;
    case "cityAtMaxSize":
      return `${cityName(state, e.cityId)} dál neroste, na velikost nad ${e.size} potřebuje akvadukt.`;
    case "techLearned":
      return e.player === viewer ? `Tvoji učenci objevili: ${TECHS[e.tech].name}.` : null;
    case "researchNeeded":
      return e.player === viewer ? "Vyber, co se bude zkoumat dál." : null;
    case "improvementDone":
      return `Osadník dokončil: ${IMPROVEMENTS[e.improvement].name}.`;
    case "gotoBlocked":
      return "Jednotka nenašla cestu k cíli a zastavila se.";
    case "routeBuilt":
      return e.improvement === "road" ? "Osadník dostavěl cestu až do cíle." : "Osadník dostavěl železnici až do cíle.";
    case "queueAdvanced": {
      const city = state.cities.find((c) => c.id === e.cityId);
      return city ? `Ve městě ${city.name} se podle plánu začalo stavět: ${productionName(e.item)}.` : null;
    }
    case "turnStarted":
      return null;
    case "unitDisbanded":
      return `${cityName(state, e.cityId)} nemá štíty na údržbu jednotek, a tak rozpustilo jednotku ${UNIT_TYPES[e.unitType].name}.`;
    case "unitDismissed":
      if (e.owner !== viewer) return null;
      return e.cityId !== null && e.shields > 0
        ? `Rozpustil jsi jednotku ${UNIT_TYPES[e.unitType].name}. ${cityName(state, e.cityId)} z ní dostalo ${e.shields} štítů do výroby.`
        : `Rozpustil jsi jednotku ${UNIT_TYPES[e.unitType].name}.`;
    case "unitUpgraded":
      if (e.owner !== viewer) return null;
      return `Jednotku ${UNIT_TYPES[e.from].name} jsi povýšil na ${UNIT_TYPES[e.to].name} za ${e.cost} zlata.`;
    case "unitLost":
      if (e.owner !== viewer) return null;
      return e.reason === "fuel"
        ? `${UNIT_TYPES[e.unitType].name} nestihla přistát a došlo jí palivo.`
        : `${UNIT_TYPES[e.unitType].name} se na volném moři potopila.`;
    case "spaceshipPartBuilt":
      return `${cityName(state, e.cityId)} dokončilo ${BUILDINGS[e.building].name.toLowerCase()} pro vesmírnou loď.`;
    case "spaceshipLaunched":
      return e.player === viewer
        ? `Tvoje vesmírná loď odstartovala a přistane v tahu ${e.arrivalTurn}.`
        : `${realmName(state, e.player)} vypustila vesmírnou loď, přistane v tahu ${e.arrivalTurn}.`;
    case "spaceshipArrived": {
      if (e.player === viewer) return e.success ? "Tvoje vesmírná loď přistála u cizí hvězdy!" : "Tvoje vesmírná loď se při přistání ztratila.";
      return e.success
        ? `${realmName(state, e.player)} přistála se svou vesmírnou lodí u cizí hvězdy!`
        : `${realmName(state, e.player)} přišla o vesmírnou loď při přistání.`;
    }
    case "revolutionStarted":
      return e.player === viewer
        ? `Začala revoluce. ${e.turns === 1 ? "Jeden tah" : `${e.turns} tahy`} vládne anarchie, pak nastoupí ${GOVERNMENTS[e.target].name.toLowerCase()}.`
        : null;
    case "governmentChanged":
      return e.player === viewer ? `Novou vládou je ${GOVERNMENTS[e.government].name.toLowerCase()}.` : null;
    case "tradeRouteOpened":
      return `Karavana otevřela obchodní cestu z ${cityName(state, e.from)} do ${cityName(state, e.to)} a přivezla ${e.bonus} zlata a stejně vědy.`;
    case "wonderHelped":
      return `Karavana přidala ${e.shields} štítů na div v ${cityName(state, e.cityId)}.`;
    case "embassyOpened":
      return e.player === viewer ? `Otevřel jsi velvyslanectví. ${realmName(state, e.with)} ti teď neutají, co zkoumá a kolik má zlata.` : null;
    case "techStolen":
      return e.player === viewer
        ? `Diplomat ukradl technologii ${TECHS[e.tech].name}.`
        : e.from === viewer
          ? `Cizí diplomat ti ukradl technologii ${TECHS[e.tech].name}.`
          : null;
    case "citySabotaged":
      return e.building
        ? `Sabotáž v ${cityName(state, e.cityId)} zničila budovu ${BUILDINGS[e.building].name}.`
        : `Sabotáž v ${cityName(state, e.cityId)} zničila rozestavěnou výrobu.`;
    case "cityIncited":
      return e.to === viewer ? `${cityName(state, e.cityId)} se přidalo k tvé říši.` : `${cityName(state, e.cityId)} přešlo k jiné říši.`;
    case "nuclearStrike":
      return e.intercepted ? "Protiraketový štít zastavil jadernou raketu." : `Jaderná raketa vybuchla u [${e.at.x}, ${e.at.y}].`;
  }
}

/** One line about a unit for panels and the encyclopedia. */
export function describeUnit(u: UnitRule): string {
  const parts = [`útok ${u.attack}, obrana ${u.defense}, pohyb ${u.moves}`];
  if (u.domain === "sea") parts.push(u.capacity ? `loď, uveze ${u.capacity} ${u.carries === "air" ? "letadel" : "jednotek"}` : "loď");
  if (u.domain === "air") parts.push(`letadlo, ve vzduchu vydrží ${u.fuel === 1 ? "jeden tah" : `${u.fuel} tahy`}`);
  if (u.coastal) parts.push("na volném moři se může potopit");
  if (u.special === "diplomat") parts.push("otevírá velvyslanectví, krade technologie, sabotuje a podplácí města");
  if (u.special === "caravan") parts.push("pomáhá stavět divy a otevírá obchodní cesty");
  if (u.special === "nuclear") parts.push("zničí jednotky a zmenší města kolem cíle");
  if (u.requiresWonder) parts.push(`jde stavět, až někde stojí ${BUILDINGS[u.requiresWonder].name}`);
  return `${parts.join(", ")} · ${u.cost} štítů`;
}

/** One line about a government. */
export function describeGovernment(g: GovernmentRule): string {
  const parts: string[] = [];
  if (g.maxRate === 0) parts.push("nevybírá daně a nezkoumá");
  else parts.push(`vědě nebo zlatu dá nejvýš ${g.maxRate} %`);
  if (g.tilePenalty) parts.push("políčka s výnosem nad 2 dají o jeden méně");
  if (g.tradeBonus) parts.push("políčka s obchodem dají o jeden víc");
  if (g.corruptionFlatPct) parts.push(`korupce ${g.corruptionFlatPct} % všude stejně`);
  else if (g.corruptionPct === 0) parts.push("bez korupce");
  else if (g.corruptionPct < 100) parts.push(`korupce ${g.corruptionPct} % proti despocii`);
  if (g.martialLaw) parts.push("vojáci ve městě uklidní nespokojené");
  if (g.militaryUnhappy) parts.push(`každý voják mimo vlastní města rozladí ${g.militaryUnhappy === 1 ? "jednoho obyvatele" : `${g.militaryUnhappy} obyvatele`}`);
  parts.push(g.freeUnits ? `město živí ${g.freeUnits} jednotky zdarma` : "každá jednotka stojí štít");
  if (g.settlerFood > 1) parts.push(`osadník jí ${g.settlerFood} jídla`);
  return parts.join(", ");
}

export { productionName };

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** One line saying what a building does, for panels and the encyclopedia. */
export function describeBuilding(b: BuildingRule): string {
  const e = b.effects;
  const parts: string[] = [];
  const where = b.wonder && b.scope === "all" ? " ve všech tvých městech" : "";
  if (e.content) parts.push(`uklidní ${e.content} ${e.content === 1 ? "nespokojeného" : "nespokojené"}${where}`);
  if (e.sciencePct) parts.push(`+${e.sciencePct} % vědy${where}`);
  if (e.goldPct) parts.push(`+${e.goldPct} % zlata${where}`);
  if (e.shieldsPct) parts.push(`+${e.shieldsPct} % výroby${where}`);
  if (e.keepFoodOnGrowth) parts.push(`po růstu města zůstane ${Math.round(e.keepFoodOnGrowth * 100)} % jídla`);
  if (e.maxSize) parts.push(`město může vyrůst až na ${e.maxSize}`);
  if (e.capital) parts.push("sídlo vlády, v tomto městě není korupce a ostatní města ztrácí obchod podle vzdálenosti od něj");
  if (e.corruptionCutPct) parts.push(`ubere ${e.corruptionCutPct} % korupce`);
  if (e.oceanFood) parts.push(`+${e.oceanFood} jídla na každém obdělávaném políčku oceánu`);
  if (e.industryPollutionPct) parts.push(`znečištění z výroby klesne na ${e.industryPollutionPct} %`);
  if (e.noPopulationPollution) parts.push("obyvatelé přestanou znečišťovat vzduch");
  if (e.tradeOnTradeTiles) parts.push(`+${e.tradeOnTradeTiles} obchodu na políčkách s obchodem`);
  if (e.templePct) parts.push(`chrámy uklidní o ${e.templePct} % víc${where}`);
  if (e.cathedralPct) parts.push(`katedrály uklidní o ${e.cathedralPct} % víc${where}`);
  if (e.libraryBoostPct) parts.push(`knihovny, univerzity a výzkumná centra dají o ${e.libraryBoostPct} % vědy víc${where}`);
  if (e.noUnhappy) parts.push("ve městě nikdo není nespokojený");
  if (e.plantInEveryCity) parts.push("každé město s továrnou funguje, jako by mělo vodní elektrárnu");
  if (e.shipMoves) parts.push(`lodě se pohnou o ${e.shipMoves} políčko dál`);
  if (e.safeTriremes) parts.push("triéry se nepotopí");
  if (e.techsFromOthers) parts.push(`dostaneš každou technologii, kterou znají aspoň ${e.techsFromOthers} jiné říše`);
  if (e.freeTechs) parts.push(`hned dá ${e.freeTechs} technologie zdarma`);
  if (e.fastRevolution) parts.push("revoluce trvá jen jeden tah");
  if (e.seesAllCities) parts.push("uvidíš všechna města světa a všichni můžou stavět vesmírné lodě");
  if (e.militaryUnhappyCut) parts.push("vojáci mimo města rozladí méně obyvatel");
  if (e.peaceOffers) parts.push("soupeři ti budou nabízet mír (začne platit s diplomacií ve fázi 3)");
  if (e.defenseVsSeaPct) parts.push(`zdvojí obranu proti lodím (začne platit s bojem ve fázi 3)`);
  if (e.nuclearShield) parts.push(`zastaví jaderné rakety do ${e.nuclearShield} políček od města`);
  if (b.spaceship) parts.push(b.spaceship === "structural" ? "díl vesmírné lodi, nese motory a moduly" : b.spaceship === "component" ? "díl vesmírné lodi, zkrátí let" : "díl vesmírné lodi, zvýší šanci na přistání");
  if (b.id === "manhattanProject") parts.push("všichni můžou stavět jaderné rakety");
  if (b.obsoleteBy) parts.push(`přestane působit, až objevíš ${TECHS[b.obsoleteBy].name.toLowerCase()}`);
  if (b.requiresBuilding) parts.push(`potřebuje ve městě ${BUILDINGS[b.requiresBuilding].name.toLowerCase()}`);
  if (b.coastal) parts.push("jde postavit jen u moře");
  if (b.onePerPlayer) parts.push("máš jen jeden, nový přestěhuje sídlo vlády");
  if (b.group) parts.push("město má jen jednu elektrárnu, nová nahradí starou");
  if (b.requiresWonder && !b.spaceship) parts.push(`jde stavět, až stojí ${BUILDINGS[b.requiresWonder].name}`);
  if (!parts.length) parts.push("začne chránit město, až do hry přibude boj");
  const cost = `${b.cost} štítů${b.upkeep ? `, údržba ${b.upkeep} zlata za tah` : ""}`;
  return `${parts.join(", ")} · ${cost}`;
}
