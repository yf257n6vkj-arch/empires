/** Czech texts for the screen: error reasons and event messages. */
import {
  BUILDINGS,
  IMPROVEMENTS,
  TECHS,
  productionName,
  UNIT_TYPES,
  type CommandError,
  type GameEvent,
  type GameState,
} from "../core";

export const ERROR_TEXT: Record<CommandError, string> = {
  unknownUnit: "Jednotka už neexistuje.",
  notYourUnit: "Tahle jednotka ti nepatří.",
  unknownCity: "Město už neexistuje.",
  notYourCity: "Tohle město ti nepatří.",
  noMovesLeft: "Jednotka už v tomhle tahu nemá pohyb.",
  notAdjacent: "Jednotka se může pohnout jen na sousední políčko.",
  cannotEnter: "Na moře pozemní jednotka nevstoupí.",
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
  alreadyComplete: "Výroba je už zaplacená, dokončí se na konci tahu.",
  notEnoughGold: "Na nákup nemáš dost zlata.",
  unknownTech: "Taková technologie neexistuje.",
  cannotResearch: "Tuhle technologii teď zkoumat nejde. Buď ji už znáš, nebo ti chybí předchozí.",
  invalidRate: "Poměr výzkumu a zlata jde nastavit jen po deseti procentech.",
  alreadyKnown: "Tuhle technologii už znáš.",
  tileNotWorkable: "Tohle políčko město obdělávat nemůže. Buď je mimo jeho okolí, nebo ho obdělává jiné město.",
  tooManyWorkers: "Město nemá tolik obyvatel.",
};

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
    case "turnStarted":
      return null;
  }
}

export { productionName };
