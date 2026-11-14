/** Czech texts for the screen: error reasons and event messages. */
import {
  BUILDINGS,
  IMPROVEMENTS,
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
};

export function cityName(state: GameState, id: number): string {
  return state.cities.find((c) => c.id === id)?.name ?? "Zaniklé město";
}

/** Text for the event log, or null for events the player does not need to read. */
export function eventText(state: GameState, e: GameEvent): string | null {
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
    case "productionNeeded":
      return `${cityName(state, e.cityId)} potřebuje novou výrobu, zatím staví válečníka.`;
    case "improvementDone":
      return `Osadník dokončil: ${IMPROVEMENTS[e.improvement].name}.`;
    case "gotoBlocked":
      return "Jednotka nenašla cestu k cíli a zastavila se.";
    case "turnStarted":
      return null;
  }
}

export { productionName };
