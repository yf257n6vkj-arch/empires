/** Texts for the screen: error reasons and event messages. */
import {
  RULES,
  UNIT_TYPES,
  visibleTiles,
  type BuildingRule,
  type CommandError,
  type DisasterId,
  type GameEvent,
  type GameState,
  type GovernmentRule,
  type Happiness,
  type TechId,
  type UnitRule,
} from "../core";
import { t, tn } from "./i18n";
import {
  buildingName,
  cityLabel,
  civName,
  governmentName,
  improvementName,
  inSentence,
  productionLabel,
  realmLabel,
  techName,
  unitName,
} from "./i18n/names";

export const ERROR_TEXT: Record<CommandError, string> = {
  unknownUnit: t("Jednotka už neexistuje."),
  notYourUnit: t("Tahle jednotka ti nepatří."),
  unknownCity: t("Město už neexistuje."),
  notYourCity: t("Tohle město ti nepatří."),
  noMovesLeft: t("Jednotka už v tomhle tahu nemá pohyb."),
  notAdjacent: t("Jednotka se může pohnout jen na sousední políčko."),
  cannotEnter: t("Sem jednotka nemůže. Pozemní jednotka vstoupí na moře jen na vlastní loď s volným místem, loď pluje jen po moři a do přímořských měst."),
  notEnoughMoves: t("Na tenhle terén už jednotce nezbývá dost pohybu."),
  occupiedByOther: t("Políčko je obsazené jiným hráčem."),
  cannotFoundCity: t("Město umí založit jen osadník."),
  cityTooClose: t("Město nejde založit hned vedle jiného města."),
  cannotBuildImprovements: t("Vylepšení umí stavět jen osadník."),
  terrainNotSuitable: t("Na tomhle terénu to postavit nejde."),
  alreadyBuilt: t("Tohle už na políčku je."),
  needsWater: t("Zavlažování potřebuje vodu na sousedním políčku (moře, zavlažované políčko nebo město)."),
  onCityTile: t("Ve městě je cesta i zavlažování automaticky."),
  noPath: t("Na tohle místo nevede žádná známá cesta."),
  invalidProduction: t("Tohle město teď postavit nemůže."),
  queueFull: t("Do plánu se víc staveb nevejde."),
  alreadyComplete: t("Výroba je už zaplacená, dokončí se na konci tahu."),
  notEnoughGold: t("Na nákup nemáš dost zlata."),
  unknownTech: t("Taková technologie neexistuje."),
  cannotResearch: t("Tuhle technologii teď zkoumat nejde. Buď ji už znáš, nebo ti chybí předchozí."),
  invalidRate: t("Takový poměr výzkumu a zlata nejde. Mění se po deseti procentech a tvoje vláda dovolí dát vědě nebo zlatu jen určitý podíl."),
  alreadyKnown: t("Tuhle technologii už znáš."),
  tileNotWorkable: t("Tohle políčko město obdělávat nemůže. Buď je mimo jeho okolí, nebo ho obdělává jiné město."),
  tooManyWorkers: t("Město nemá tolik obyvatel."),
  noShip: t("Ve městě není tvoje loď s volným místem."),
  unknownGovernment: t("Taková vláda neexistuje."),
  governmentNotKnown: t("Tuhle vládu zatím neznáš, nejdřív ji musíš objevit."),
  alreadyGovernment: t("Tuhle vládu už máš."),
  revolutionRunning: t("Revoluce už probíhá."),
  spaceshipNotReady: t("Loď ještě nemůže odstartovat. Potřebuje palác, aspoň jeden motor, jeden modul a na každý z nich nosnou konstrukci."),
  wrongUnit: t("Tohle tahle jednotka neumí."),
  notBuildingWonder: t("Město zrovna nestaví div světa."),
  notInCity: t("Jednotka musí stát ve vlastním městě."),
  tooClose: t("Obchodní cesta musí vést aspoň {tradeRouteMinDistance} políček od domovského města.", { tradeRouteMinDistance: RULES.tradeRouteMinDistance }),
  routeExists: t("Tahle obchodní cesta už existuje."),
  tooManyRoutes: t("Město může mít nejvýš {tradeRoutesPerCity} obchodní cesty.", { tradeRoutesPerCity: RULES.tradeRoutesPerCity }),
  noHomeCity: t("Karavana nemá domovské město."),
  notForeign: t("Tohle je tvoje vlastní město."),
  embassyExists: t("Velvyslanectví u téhle říše už máš."),
  nothingToSteal: t("Tahle říše nezná nic, co bys neznal ty."),
  alreadyStolen: t("V tomhle městě už tvůj diplomat jednou kradl."),
  isCapital: t("Hlavní město se podplatit nedá."),
  tooFar: t("Tak daleko raketa v tomhle tahu nedoletí."),
  needsTech: t("Na tohle ti chybí technologie."),
  needsRoad: t("Železnice se staví na cestu."),
  carriesUnits: t("Na palubě jsou jednotky. Na moři by se utopily, loď rozpusť až ve městě."),
  nothingToUpgrade: t("Na novější typ zatím nejde povýšit, chybí ti technologie."),
  cityTooBig: t("Město je na to moc velké. Osadník se přidá jen k městu, které má méně než {joinCityMaxSize} obyvatel a ještě může růst.", { joinCityMaxSize: RULES.joinCityMaxSize }),
  noPollution: t("Na tomhle políčku žádné znečištění není."),
  cannotSell: t("Tohle prodat nejde. Divy světa ani palác se neprodávají."),
  alreadySold: t("V tomhle městě jsi už v tomhle tahu jednu budovu prodal."),
  cityTooSmall: t("Výběrčí daní a vědce může mít až město s aspoň {specialistMinSize} obyvateli.", { specialistMinSize: RULES.specialistMinSize }),
  tooManySpecialists: t("Tolik obyvatel mimo pole město nemá."),
  cannotAttack: t("Tahle jednotka sem zaútočit nemůže. Útočí jen vojenské jednotky, pozemní na souši a ne z lodi, lodě na moři a na pobřeží. Letadlo ve vzduchu dostihne jen jiné letadlo."),
  nothingToAttack: t("Na políčku není nikdo, na koho by šlo zaútočit."),
  notAtWar: t("S tímhle národem jsi v míru. Zaútočit můžeš, až mu vyhlásíš válku."),
  noContact: t("S tímhle národem ses ještě nepotkal."),
  alreadyAtWar: t("S tímhle národem už válčíš."),
  invalidGovernor: t("Takový cíl správce nezná."),
};

/** "před požárem": what a building or technology keeps away, in the instrumental. */
export function disasterAgainst(id: DisasterId): string {
  switch (id) {
    case "earthquake":
      return t("před zemětřesením");
    case "fire":
      return t("před požárem");
    case "flood":
      return t("před povodní");
    case "famine":
      return t("před hladomorem");
    case "piracy":
      return t("před piráty");
    case "plague":
      return t("před morem");
    case "volcano":
      return t("před sopkou");
  }
}

function disasterText(state: GameState, e: Extract<GameEvent, { type: "disaster" }>): string {
  const city = cityName(state, e.cityId);
  switch (e.disaster) {
    case "earthquake":
      return e.building
        ? t("Zemětřesení ve městě {city} zbořilo budovu {building}.", { city, building: buildingName(e.building) })
        : t("Městem {city} otřáslo zemětřesení, naštěstí nic nespadlo.", { city });
    case "fire":
      return e.building
        ? t("Ve městě {city} vypukl požár a shořela budova {building}. Akvadukt by požáru zabránil.", { city, building: buildingName(e.building) })
        : t("Ve městě {city} hořelo, naštěstí nic neshořelo. Akvadukt by požáru zabránil.", { city });
    case "flood":
      return t("Řeka zaplavila město {city}, zbylo {size} obyvatel. Hradby by povodni zabránily.", { city, size: e.size });
    case "famine":
      return t("Ve městě {city} vypukl hladomor, sýpka je prázdná a zbylo {size} obyvatel. Sýpka by hladomoru zabránila.", { city, size: e.size });
    case "piracy":
      return t("Piráti vyplenili město {city}, vzali zásoby jídla i rozestavěnou výrobu. Kasárna by piráty odrazila.", { city });
    case "plague":
      return t("Ve městě {city} řádil mor, zbylo {size} obyvatel. Akvadukt nebo lékařství by moru zabránily.", { city, size: e.size });
    case "volcano":
      return t("U města {city} vybuchla sopka, zbylo {size} obyvatel. Chrám by město ochránil.", { city, size: e.size });
  }
}

/** "Římská říše": the realm of a player, for sentences with a feminine subject. */
export function realmName(state: GameState, player: number): string {
  const p = state.players[player];
  if (!p) return t("Jiná říše");
  return realmLabel(p.civ);
}

/** The people of a player, "Římané". */
function nationOf(state: GameState, player: number): string {
  const civ = state.players[player]?.civ;
  return civ ? civName(civ) : "";
}

function lootText(gold: number, tech: TechId | null): string {
  if (gold > 0 && tech) return t(" Kořist: {gold} zlata a objev {tech}.", { gold, tech: techName(tech) });
  if (gold > 0) return t(" Kořist: {gold} zlata.", { gold });
  if (tech) return t(" Kořist: objev {tech}.", { tech: techName(tech) });
  return "";
}

/** One fight, told from the side of the viewer. */
function combatText(state: GameState, e: Extract<GameEvent, { type: "combat" }>, viewer: number): string | null {
  const mine = e.attacker.owner === viewer ? e.attacker : e.defender.owner === viewer ? e.defender : null;
  if (!mine) return null;
  const other = mine === e.attacker ? e.defender : e.attacker;
  const nation = nationOf(state, other.owner);
  const unit = unitName(mine.unitType);
  const enemy = unitName(other.unitType);
  const iWon = (mine === e.attacker) === e.attackerWon;
  const max = UNIT_TYPES[mine.unitType].hp;
  let text: string;
  if (mine === e.attacker) {
    text = iWon
      ? t("Tvoje jednotka {unit} porazila jednotku {enemy} ({nation}) a zbývá jí {hp} z {max} životů.", { unit, enemy, nation, hp: e.winnerHp, max })
      : t("Útok se nepovedl: tvoje jednotka {unit} padla v boji s jednotkou {enemy} ({nation}).", { unit, enemy, nation });
  } else {
    text = iWon
      ? t("{nation} zaútočili jednotkou {enemy} na tvou jednotku {unit} a prohráli. Tvé jednotce zbývá {hp} z {max} životů.", { nation, enemy, unit, hp: e.winnerHp, max })
      : t("{nation} zaútočili jednotkou {enemy} a tvoje jednotka {unit} padla.", { nation, enemy, unit });
  }
  if (e.alsoLost > 0) {
    text += iWon
      ? tn(" Nepříteli padla i další jednotka na políčku.| Nepříteli padly i další {n} jednotky na políčku.| Nepříteli padlo i dalších {n} jednotek na políčku.", e.alsoLost)
      : tn(" Padla s ní i další jednotka na políčku.| Padly s ní i další {n} jednotky na políčku.| Padlo s ní i dalších {n} jednotek na políčku.", e.alsoLost);
  }
  if (e.promoted && iWon) text += t(" Jednotka {unit} se stala veteránem.", { unit });
  return text;
}

/**
 * Whether the viewer should hear about an event. Events from other players'
 * turns mostly concern them alone; what the viewer would notice stays.
 */
export function eventConcerns(state: GameState, e: GameEvent, viewer: number): boolean {
  const cityOwner = (id: number) => state.cities.find((c) => c.id === id)?.owner;
  const unitOwner = (id: number) => state.units.find((u) => u.id === id)?.owner;
  switch (e.type) {
    case "wonderBuilt":
    case "spaceshipLaunched":
    case "spaceshipArrived":
    case "globalWarming":
    case "civDestroyed":
    case "nuclearStrike":
      return true;
    case "combat":
      return e.attacker.owner === viewer || e.defender.owner === viewer;
    case "cityCaptured":
      return e.from === viewer || e.to === viewer;
    case "contactMade":
      return e.a === viewer || e.b === viewer;
    case "ruinsExplored":
      return e.owner === viewer;
    case "barbariansAppeared":
      // The player hears of barbarians they can see or that landed near their cities.
      return visibleTiles(state, viewer)[e.at.y * state.map.width + e.at.x] === 1 || nearestOwnCity(state, e.at, viewer, 4) !== null;
    case "warDeclared": {
      // Wars between others are news once the viewer knows both sides.
      const knows = (p: number) => state.players[viewer]?.contacts.includes(p) ?? false;
      return e.by === viewer || e.on === viewer || (knows(e.by) && knows(e.on));
    }
    case "cityDestroyed":
      return e.owner === viewer || e.by === viewer;
    case "embassyOpened":
      return e.player === viewer || e.with === viewer;
    case "techStolen":
      return e.player === viewer || e.from === viewer;
    case "cityIncited":
      return e.from === viewer || e.to === viewer;
    case "techLearned":
    case "researchNeeded":
    case "revolutionStarted":
    case "governmentChanged":
    case "governmentCollapsed":
    case "palaceMoved":
    case "turnStarted":
      return e.player === viewer;
    case "unitLost":
    case "unitDismissed":
    case "unitUpgraded":
    case "cityFounded":
      return e.owner === viewer;
    case "tradeRouteOpened":
      return cityOwner(e.from) === viewer;
    case "improvementDone":
    case "gotoBlocked":
    case "routeBuilt":
    case "pollutionCleaned":
      return unitOwner(e.unitId) === viewer;
    default:
      return "cityId" in e ? cityOwner(e.cityId) === viewer : false;
  }
}

/** The player's city nearest to a point, within `range` when given. */
function nearestOwnCity(state: GameState, at: { x: number; y: number }, viewer: number, range = Infinity) {
  let best: GameState["cities"][number] | null = null;
  let bestD = range;
  for (const c of state.cities) {
    if (c.owner !== viewer) continue;
    const d = Math.max(Math.abs(c.x - at.x), Math.abs(c.y - at.y));
    if (d <= bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
}

export function cityName(state: GameState, id: number): string {
  const name = state.cities.find((c) => c.id === id)?.name;
  return name ? cityLabel(name) : t("Zaniklé město");
}

/** Text for the event log, or null for events the player does not need to read. */
export function eventText(state: GameState, e: GameEvent, viewer = 0): string | null {
  switch (e.type) {
    case "cityFounded":
      return t("Založil jsi město {city}.", { city: cityName(state, e.cityId) });
    case "cityGrew":
      return t("{city} vyrostlo na velikost {size}.", { city: cityName(state, e.cityId), size: e.size });
    case "cityStarved":
      return t("{city} hladoví a zmenšilo se na {size}.", { city: cityName(state, e.cityId), size: e.size });
    case "cityNeedsSize":
      return t("{city} má hotového osadníka, ale čeká, až bude mít aspoň dva obyvatele.", { city: cityName(state, e.cityId) });
    case "unitBuilt":
      return t("{city} postavilo jednotku {unit}.", { city: cityName(state, e.cityId), unit: unitName(e.unitType) });
    case "buildingBuilt":
      return t("{city} postavilo budovu {building}.", { city: cityName(state, e.cityId), building: buildingName(e.building) });
    case "governorChose": {
      const city = state.cities.find((c) => c.id === e.cityId);
      return city ? t("Správce města {city} začal stavět: {production}.", { city: cityLabel(city.name), production: productionLabel(e.item) }) : null;
    }
    case "productionNeeded": {
      const city = state.cities.find((c) => c.id === e.cityId);
      return city ? t("{city} potřebuje novou výrobu, zatím staví: {production}.", { city: cityLabel(city.name), production: productionLabel(city.production) }) : null;
    }
    case "wonderBuilt":
      return e.owner === viewer
        ? t("{city} dostavělo div světa {building}!", { city: cityName(state, e.cityId), building: buildingName(e.building) })
        : t("Jiná říše dostavěla div světa {building}.", { building: buildingName(e.building) });
    case "buildingSold":
      return e.manual
        ? t("Ve městě {city} jsi prodal budovu {building}.", { city: cityName(state, e.cityId), building: buildingName(e.building) })
        : t("Nemáš na údržbu, a tak {city} prodalo budovu {building}.", { city: cityName(state, e.cityId), building: buildingName(e.building) });
    case "cityDisorder":
      return t("Ve městě {city} jsou nepokoje, tento tah nic nevyrobilo.", { city: cityName(state, e.cityId) });
    case "cityAtMaxSize":
      return t("{city} dál neroste, na velikost nad {size} potřebuje akvadukt.", { city: cityName(state, e.cityId), size: e.size });
    case "techLearned":
      return e.player === viewer ? t("Tvoji učenci objevili: {tech}.", { tech: techName(e.tech) }) : null;
    case "researchNeeded":
      return e.player === viewer ? t("Vyber, co se bude zkoumat dál.") : null;
    case "improvementDone":
      return t("Osadník dokončil: {improvement}.", { improvement: improvementName(e.improvement) });
    case "gotoBlocked":
      return t("Jednotka nenašla cestu k cíli a zastavila se.");
    case "routeBuilt":
      return e.improvement === "road" ? t("Osadník dostavěl cestu až do cíle.") : t("Osadník dostavěl železnici až do cíle.");
    case "queueAdvanced": {
      const city = state.cities.find((c) => c.id === e.cityId);
      return city ? t("Ve městě {city} se podle plánu začalo stavět: {production}.", { city: cityLabel(city.name), production: productionLabel(e.item) }) : null;
    }
    case "turnStarted":
      return null;
    case "unitDisbanded":
      return t("{city} nemá štíty na údržbu jednotek, a tak rozpustilo jednotku {unit}.", { city: cityName(state, e.cityId), unit: unitName(e.unitType) });
    case "unitDismissed":
      if (e.owner !== viewer) return null;
      return e.cityId !== null && e.shields > 0
        ? t("Rozpustil jsi jednotku {unit}. {city} z ní dostalo {shields} štítů do výroby.", { unit: unitName(e.unitType), city: cityName(state, e.cityId), shields: e.shields })
        : t("Rozpustil jsi jednotku {unit}.", { unit: unitName(e.unitType) });
    case "unitUpgraded":
      if (e.owner !== viewer) return null;
      return t("Jednotku {unit} jsi povýšil na {unit2} za {cost} zlata.", { unit: unitName(e.from), unit2: unitName(e.to), cost: e.cost });
    case "unitLost":
      if (e.owner !== viewer) return null;
      return e.reason === "fuel"
        ? t("Letadlu {unit} došlo palivo, než stihlo přistát.", { unit: unitName(e.unitType) })
        : t("{unit} se na volném moři potopila.", { unit: unitName(e.unitType) });
    case "spaceshipPartBuilt":
      return t("{city} dokončilo díl vesmírné lodi: {building}.", { city: cityName(state, e.cityId), building: inSentence(buildingName(e.building)) });
    case "spaceshipLaunched":
      return e.player === viewer
        ? t("Tvoje vesmírná loď odstartovala a přistane v tahu {arrivalTurn}.", { arrivalTurn: e.arrivalTurn })
        : t("{realm} vypustila vesmírnou loď, přistane v tahu {arrivalTurn}.", { realm: realmName(state, e.player), arrivalTurn: e.arrivalTurn });
    case "spaceshipArrived": {
      if (e.player === viewer) return e.success ? t("Tvoje vesmírná loď přistála u cizí hvězdy!") : t("Tvoje vesmírná loď se při přistání ztratila.");
      return e.success
        ? t("{realm} přistála se svou vesmírnou lodí u cizí hvězdy!", { realm: realmName(state, e.player) })
        : t("{realm} přišla o vesmírnou loď při přistání.", { realm: realmName(state, e.player) });
    }
    case "revolutionStarted":
      return e.player === viewer
        ? tn("Začala revoluce. Jeden tah vládne anarchie, pak nastoupí {government}.|Začala revoluce. {n} tahy vládne anarchie, pak nastoupí {government}.|Začala revoluce. {n} tahů vládne anarchie, pak nastoupí {government}.", e.turns, { government: inSentence(governmentName(e.target)) })
        : null;
    case "governmentChanged":
      return e.player === viewer ? t("Novou vládou je {government}.", { government: inSentence(governmentName(e.government)) }) : null;
    case "tradeRouteOpened":
      return t("Karavana otevřela obchodní cestu z města {city} do města {city2} a přivezla {bonus} zlata a stejně vědy.", { city: cityName(state, e.from), city2: cityName(state, e.to), bonus: e.bonus });
    case "wonderHelped":
      return t("Karavana přidala {shields} štítů na div ve městě {city}.", { shields: e.shields, city: cityName(state, e.cityId) });
    case "embassyOpened":
      return e.player === viewer ? t("Otevřel jsi velvyslanectví. {realm} ti teď neutají, co zkoumá a kolik má zlata.", { realm: realmName(state, e.with) }) : null;
    case "techStolen":
      return e.player === viewer
        ? t("Diplomat ukradl technologii {tech}.", { tech: techName(e.tech) })
        : e.from === viewer
          ? t("Cizí diplomat ti ukradl technologii {tech}.", { tech: techName(e.tech) })
          : null;
    case "citySabotaged":
      return e.building
        ? t("Sabotáž ve městě {city} zničila budovu {building}.", { city: cityName(state, e.cityId), building: buildingName(e.building) })
        : t("Sabotáž ve městě {city} zničila rozestavěnou výrobu.", { city: cityName(state, e.cityId) });
    case "cityIncited":
      return e.to === viewer ? t("{city} se přidalo k tvé říši.", { city: cityName(state, e.cityId) }) : t("{city} přešlo k jiné říši.", { city: cityName(state, e.cityId) });
    case "nuclearStrike":
      return e.intercepted ? t("Protiraketový štít zastavil jadernou raketu.") : t("Jaderná raketa vybuchla u [{at}, {at2}].", { at: e.at.x, at2: e.at.y });
    case "cityJoined":
      return t("Osadník se přidal k městu {city}, má teď {size} obyvatel.", { city: cityName(state, e.cityId), size: e.size });
    case "celebrationStarted":
      return t("Obyvatelé města {city} slaví na tvou počest!", { city: cityName(state, e.cityId) });
    case "celebrationEnded":
      return t("Oslavy ve městě {city} skončily.", { city: cityName(state, e.cityId) });
    case "tilePolluted":
      return t("Město {city} znečistilo políčko [{x}, {y}]. Dokud ho osadník nevyčistí, dává polovinu.", { city: cityName(state, e.cityId), x: e.at.x, y: e.at.y });
    case "pollutionCleaned":
      return t("Osadník vyčistil znečištěné políčko.");
    case "nuclearMeltdown":
      return t("V jaderné elektrárně města {city} se kvůli nepokojům roztavil reaktor! Zbylo {size} obyvatel a okolí je znečištěné.", { city: cityName(state, e.cityId), size: e.size });
    case "globalWarming":
      return tn("Svět se oteplil. Jedno políčko u moře se změnilo v bažinu nebo džungli a ve vnitrozemí v poušť.|Svět se oteplil. {n} políčka u moře se změnila v bažiny a džungle a ve vnitrozemí v poušť.|Svět se oteplil. {n} políček u moře se změnilo v bažiny a džungle a ve vnitrozemí v poušť.", e.tiles);
    case "disaster":
      return disasterText(state, e);
    case "disasterPrevented":
      return e.building
        ? t("Budova {building} ochránila město {city} {against}.", { building: buildingName(e.building), city: cityName(state, e.cityId), against: disasterAgainst(e.disaster) })
        : t("Díky technologii {tech} se město {city} ubránilo {against}.", { tech: techName(e.tech!), city: cityName(state, e.cityId), against: disasterAgainst(e.disaster) });
    case "governmentCollapsed":
      return e.player === viewer
        ? t("Nepokoje ve městech svrhly vládu. Vládne anarchie, pak se vrátí {government}.", { government: inSentence(governmentName(e.government)) })
        : null;
    case "combat":
      return combatText(state, e, viewer);
    case "cityCaptured": {
      const city = cityName(state, e.cityId);
      if (e.to === viewer) {
        const loot = lootText(e.gold, e.tech);
        const lost = e.lostBuildings.length ? t(" Při dobývání zaniklo: {list}.", { list: e.lostBuildings.map((b) => buildingName(b)).join(", ") }) : "";
        return t("Dobyl jsi město {city}.", { city }) + loot + lost;
      }
      if (e.from === viewer) return t("{nation} dobyli tvé město {city}.", { nation: nationOf(state, e.to), city });
      return null;
    }
    case "cityDestroyed": {
      const city = cityLabel(e.name);
      if (e.by === viewer) return t("Město {city} bylo tak malé, že při dobývání zaniklo.", { city }) + lootText(e.gold, e.tech);
      if (e.owner === viewer) return t("{nation} zničili tvé město {city}.", { nation: nationOf(state, e.by), city });
      return null;
    }
    case "palaceMoved":
      return e.player === viewer ? t("Hlavní město padlo a vláda se přestěhovala do města {city}.", { city: cityName(state, e.cityId) }) : null;
    case "ruinsExplored":
      switch (e.outcome) {
        case "gold":
          return t("V ruinách starého města jsi našel poklad: {gold} zlata.", { gold: e.gold ?? 0 });
        case "tech":
          return t("V ruinách ležely staré svitky. Tví vědci z nich poznali objev {tech}.", { tech: techName(e.tech!) });
        case "mercenaries":
          return t("V ruinách se k tobě přidali žoldnéři: {unit}.", { unit: unitName(e.unitType!) });
        case "settlers":
          return t("V ruinách žili kočovníci a přidali se k tobě jako osadníci.");
        case "barbarians":
          return t("Z ruin vyrazili barbaři! Stáhni jednotku do bezpečí, nebo se připrav k boji.");
        case "empty":
          return t("Ruiny jsou prázdné. Někdo je vyraboval před tebou.");
      }
      return null;
    case "barbariansAppeared": {
      if (e.reason === "ruins") return null;
      const near = nearestOwnCity(state, e.at, viewer);
      if (e.reason === "landing") {
        return near
          ? tn("U pobřeží nedaleko města {city} se vylodil barbar.|U pobřeží nedaleko města {city} se vylodili {n} barbaři.|U pobřeží nedaleko města {city} se vylodilo {n} barbarů.", e.count, { city: cityLabel(near.name) })
          : tn("U pobřeží se vylodil barbar.|U pobřeží se vylodili {n} barbaři.|U pobřeží se vylodilo {n} barbarů.", e.count);
      }
      return tn("V divočině se vzbouřil barbar.|V divočině se vzbouřili {n} barbaři.|V divočině se vzbouřilo {n} barbarů.", e.count);
    }
    case "contactMade": {
      const other = e.a === viewer ? e.b : e.b === viewer ? e.a : null;
      return other === null ? null : t("Potkal jsi nový národ: {nation}. Zatím spolu žijete v míru.", { nation: nationOf(state, other) });
    }
    case "warDeclared":
      if (e.by === viewer) return t("Vyhlásil jsi válku. Válčíš teď s národem {nation}.", { nation: nationOf(state, e.on) });
      if (e.on === viewer) return t("{nation} ti vyhlásili válku!", { nation: nationOf(state, e.by) });
      return t("{a} vyhlásili válku. Proti nim teď stojí {b}.", { a: nationOf(state, e.by), b: nationOf(state, e.on) });
    case "civDestroyed":
      return e.player === viewer
        ? t("Přišel jsi o poslední město a tvoje říše zanikla.")
        : t("{nation} přišli o poslední město a jejich říše zanikla.", { nation: nationOf(state, e.player) });
  }
}

/** One line about a unit for panels and the encyclopedia. */
export function describeUnit(u: UnitRule, withCost = true): string {
  const parts = [t("útok {attack}, obrana {defense}, pohyb {moves}, životy {hp}", { attack: u.attack, defense: u.defense, moves: u.moves, hp: u.hp })];
  if (u.firepower > 1) parts.push(t("palebná síla {fp}", { fp: u.firepower }));
  if (u.foundsCity) parts.push(t("založí nové město"));
  if (u.buildsImprovements) parts.push(t("staví cesty, zavlažování a doly"));
  if (u.populationCost) parts.push(tn("ubere městu jednoho obyvatele|ubere městu {n} obyvatele|ubere městu {n} obyvatel", u.populationCost));
  if (u.domain === "sea") parts.push(u.capacity ? u.carries === "air" ? tn("loď, uveze jedno letadlo|loď, uveze {n} letadla|loď, uveze {n} letadel", u.capacity) : tn("loď, uveze jednu jednotku|loď, uveze {n} jednotky|loď, uveze {n} jednotek", u.capacity) : t("loď"));
  if (u.domain === "air") parts.push(tn("letadlo, ve vzduchu vydrží jeden tah|letadlo, ve vzduchu vydrží {n} tahy|letadlo, ve vzduchu vydrží {n} tahů", u.fuel ?? 0));
  if (u.coastal) parts.push(t("na volném moři se může potopit"));
  if (u.special === "diplomat") parts.push(t("otevírá velvyslanectví, krade technologie, sabotuje a podplácí města"));
  if (u.special === "caravan") parts.push(t("pomáhá stavět divy a otevírá obchodní cesty"));
  if (u.special === "nuclear") parts.push(t("zničí jednotky a zmenší města kolem cíle"));
  if (u.requiresWonder) parts.push(t("jde stavět, až někde stojí {building}", { building: buildingName(u.requiresWonder) }));
  // In short lists the unit's job matters more than its numbers.
  return withCost ? t("{parts} · {cost} štítů", { parts: parts.join(", "), cost: u.cost }) : [...parts.slice(1), parts[0]].join(", ");
}

/** One line about a government. */
export function describeGovernment(g: GovernmentRule): string {
  const parts: string[] = [];
  if (g.maxRate === 0) parts.push(t("nevybírá daně a nezkoumá"));
  else parts.push(t("vědě, daním ani zábavě nedá víc než {maxRate} %", { maxRate: g.maxRate }));
  if (g.tilePenalty) parts.push(t("políčka s výnosem nad 2 dají o jeden méně"));
  if (g.tradeBonus) parts.push(t("políčka s obchodem dají o jeden víc"));
  if (g.corruptionFlatPct) parts.push(t("korupce {corruptionFlatPct} % všude stejně", { corruptionFlatPct: g.corruptionFlatPct }));
  else if (g.corruptionPct === 0) parts.push(t("bez korupce"));
  else if (g.corruptionPct < 100) parts.push(t("korupce je jen {pct} % té za despocie", { pct: g.corruptionPct }));
  if (g.martialLaw) parts.push(t("vojáci ve městě uklidní nespokojené"));
  if (g.militaryUnhappy) parts.push(tn("každý voják mimo vlastní města rozladí jednoho obyvatele|každý voják mimo vlastní města rozladí {n} obyvatele|každý voják mimo vlastní města rozladí {n} obyvatel", g.militaryUnhappy));
  parts.push(g.freeUnits ? t("město živí {freeUnits} jednotky zdarma", { freeUnits: g.freeUnits }) : t("každá jednotka stojí štít"));
  if (g.settlerFood > 1) parts.push(t("osadník jí {settlerFood} jídla", { settlerFood: g.settlerFood }));
  if (g.celebration === "noTilePenalty") parts.push(t("slavící město nemá postih na políčkách"));
  if (g.celebration === "tradeBonus") parts.push(t("slavící město dostane obchod navíc na políčkách s obchodem"));
  if (g.celebration === "rapture") parts.push(t("slavící město roste každý tah"));
  if (g.collapsesInDisorder) parts.push(t("dlouhé nepokoje ji můžou svrhnout"));
  return parts.join(", ");
}

/** "Šťastní 1 · spokojení 3 · nespokojení 0 · baviči 1": the moods of a city in one line. */
export function moodLine(h: Happiness): string {
  const parts = [
    ...(h.happy ? [t("šťastní {n}", { n: h.happy })] : []),
    t("spokojení {n}", { n: h.content }),
    t("nespokojení {n}", { n: h.unhappy }),
    ...(h.entertainers ? [t("baviči {n}", { n: h.entertainers })] : []),
    ...(h.taxmen ? [t("výběrčí {n}", { n: h.taxmen })] : []),
    ...(h.scientists ? [t("vědci {n}", { n: h.scientists })] : []),
  ];
  const line = parts.join(" · ");
  return line.charAt(0).toUpperCase() + line.slice(1);
}

export { productionLabel as productionName };

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** One line saying what a building does, for panels and the encyclopedia. */
export function describeBuilding(b: BuildingRule, withCost = true): string {
  const e = b.effects;
  const parts: string[] = [];
  const where = b.wonder && b.scope === "all" ? t(" ve všech tvých městech") : "";
  if (e.content) parts.push(tn("uklidní jednoho nespokojeného{where}|uklidní {n} nespokojené{where}|uklidní {n} nespokojených{where}", e.content, { where }));
  if (e.sciencePct) parts.push(t("+{sciencePct} % vědy{where}", { sciencePct: e.sciencePct, where }));
  if (e.goldPct) parts.push(t("+{goldPct} % zlata{where}", { goldPct: e.goldPct, where }));
  if (e.shieldsPct) parts.push(t("+{shieldsPct} % výroby{where}", { shieldsPct: e.shieldsPct, where }));
  if (e.keepFoodOnGrowth) parts.push(t("po růstu města zůstane {keepFoodOnGrowth} % jídla", { keepFoodOnGrowth: Math.round(e.keepFoodOnGrowth * 100) }));
  if (e.maxSize) parts.push(t("město může vyrůst až na {maxSize}", { maxSize: e.maxSize }));
  if (e.capital) parts.push(t("sídlo vlády, v tomto městě není korupce a ostatní města ztrácí obchod podle vzdálenosti od něj"));
  if (e.corruptionCutPct) parts.push(t("ubere {pct} % korupce", { pct: e.corruptionCutPct }));
  if (e.oceanFood) parts.push(t("+{oceanFood} jídla na každém obdělávaném políčku oceánu", { oceanFood: e.oceanFood }));
  if (e.industryPollutionPct) parts.push(t("znečištění z výroby klesne na {industryPollutionPct} %", { industryPollutionPct: e.industryPollutionPct }));
  if (e.noPopulationPollution) parts.push(t("obyvatelé přestanou znečišťovat vzduch"));
  if (e.tradeOnTradeTiles) parts.push(t("+{tradeOnTradeTiles} obchodu na políčkách s obchodem", { tradeOnTradeTiles: e.tradeOnTradeTiles }));
  if (e.templePct) parts.push(t("chrámy uklidní o {templePct} % víc{where}", { templePct: e.templePct, where }));
  if (e.cathedralPct) parts.push(t("katedrály uklidní o {cathedralPct} % víc{where}", { cathedralPct: e.cathedralPct, where }));
  if (e.libraryBoostPct) parts.push(t("knihovny, univerzity a výzkumná centra dají o {libraryBoostPct} % vědy víc{where}", { libraryBoostPct: e.libraryBoostPct, where }));
  if (e.noUnhappy) parts.push(t("ve městě nikdo není nespokojený"));
  if (e.plantInEveryCity) parts.push(t("každé město s továrnou funguje, jako by mělo vodní elektrárnu"));
  if (e.shipMoves) parts.push(t("lodě se pohnou o {shipMoves} políčko dál", { shipMoves: e.shipMoves }));
  if (e.safeTriremes) parts.push(t("triéry se nepotopí"));
  if (e.techsFromOthers) parts.push(t("dostaneš každou technologii, kterou znají aspoň {techsFromOthers} jiné říše", { techsFromOthers: e.techsFromOthers }));
  if (e.freeTechs) parts.push(t("hned dá {freeTechs} technologie zdarma", { freeTechs: e.freeTechs }));
  if (e.noAnarchy) parts.push(t("vládu změníš hned, bez anarchie"));
  if (e.allGovernments) parts.push(t("můžeš zvolit každou vládu i bez technologie"));
  if (e.seesAllCities) parts.push(t("uvidíš všechna města světa a všichni můžou stavět vesmírné lodě"));
  if (e.militaryUnhappyCut) parts.push(t("vojáci mimo města rozladí méně obyvatel"));
  if (e.peaceOffers) parts.push(t("soupeři ti budou nabízet mír (začne platit s diplomacií)"));
  if (e.defenseVsSeaPct) parts.push(t("obrana proti lodím +{pct} %", { pct: e.defenseVsSeaPct }));
  if (e.defenseVsLandPct) parts.push(t("obrana proti pozemním jednotkám +{pct} %", { pct: e.defenseVsLandPct }));
  if (e.veteranUnits) parts.push(t("vojáci z města jsou veteráni a zranění se tu vyléčí za jeden tah"));
  if (e.nuclearShield) parts.push(t("zastaví jaderné rakety do {nuclearShield} políček od města", { nuclearShield: e.nuclearShield }));
  if (b.spaceship) parts.push(b.spaceship === "structural" ? t("díl vesmírné lodi, nese motory a moduly") : b.spaceship === "component" ? t("díl vesmírné lodi, zkrátí let") : t("díl vesmírné lodi, zvýší šanci na přistání"));
  if (b.id === "manhattanProject") parts.push(t("všichni můžou stavět jaderné rakety"));
  if (b.obsoleteBy) parts.push(t("přestane působit, až objevíš {tech}", { tech: inSentence(techName(b.obsoleteBy)) }));
  if (b.requiresBuilding) parts.push(t("potřebuje ve městě {building}", { building: inSentence(buildingName(b.requiresBuilding)) }));
  if (b.coastal) parts.push(t("jde postavit jen u moře"));
  if (b.onePerPlayer) parts.push(t("máš jen jeden, nový přestěhuje sídlo vlády"));
  if (b.group) parts.push(t("město má jen jednu elektrárnu, nová nahradí starou"));
  if (b.requiresWonder && !b.spaceship) parts.push(t("jde stavět, až stojí {building}", { building: buildingName(b.requiresWonder) }));
  const against = RULES.disasters.filter((d) => d.preventBuilding === b.id).map((d) => disasterAgainst(d.id));
  if (against.length) parts.push(t("chrání město {against}", { against: against.join(t(" a ")) }));
  if (!parts.length) parts.push(t("začne chránit město, až do hry přibude boj"));
  if (!withCost) return `${parts.join(", ")}${b.upkeep ? t(" · údržba {upkeep} zlata za tah", { upkeep: b.upkeep }) : ""}`;
  const cost = t("{cost} štítů{upkeep}", { cost: b.cost, upkeep: b.upkeep ? t(", údržba {upkeep} zlata za tah", { upkeep: b.upkeep }) : "" });
  return `${parts.join(", ")} · ${cost}`;
}
