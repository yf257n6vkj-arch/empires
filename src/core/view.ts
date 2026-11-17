/**
 * What one player is allowed to know.
 *
 * The AI never receives GameState. It receives only PlayerView, built here,
 * which contains exactly what a human in the same seat could see on screen.
 * The screen for the human player is drawn from the same object, so both
 * sides play with the same information. New knowledge (enemy units, cities,
 * scores) must be added here, and only in the form a human could see it.
 */
import { distance, tilesInRadius, type Point } from "./geometry";
import { inciteCost } from "./bribe";
import { scoreOf, type Score } from "./score";
import { buildingUpkeep, builtWonders, researchCost, wonderFlag } from "./economy";
import { cityReport } from "./city";
import { BUILDINGS, maxTurns, RULES, UNIT_TYPES, type BarbarianLevel, type BuildingId, type Difficulty, type GameSpeed, type GovernmentId, type NationId, type TechId, type TerrainId } from "./rules";
import { isBarbarian, type City, type GameState, type PlayerId, type Spaceship, type Unit } from "./state";

/** Buildings anybody can see from outside a city: fortifications, the palace and wonders. */
export function seenFromOutside(id: BuildingId): boolean {
  const b = BUILDINGS[id];
  return b.wonder || id === "palace" || (b.effects.defenseVsLandPct ?? 0) > 0 || (b.effects.defenseVsSeaPct ?? 0) > 0;
}

/** What a player knows about another empire. */
export interface RivalView {
  id: PlayerId;
  /** Nation, so the AI and the screen know the leader, colour and nature. */
  civ: NationId;
  /** The barbarians: always at war, no treaties, not a rival for victory. */
  barbarian: boolean;
  name: string;
  /** The two empires have met. */
  contact: boolean;
  atWar: boolean;
  /** Details only an embassy reveals. */
  embassy: { techs: TechId[]; gold: number; government: GovernmentId } | null;
  /** Everybody hears about a launched spaceship and when it lands. */
  spaceshipArrival: number | null;
  /** Score, known once the two have met; the barbarians have none. */
  score: number | null;
  /** The nation has lost its last city; everybody hears of it. */
  defeated: boolean;
  /** Turn the war with this nation began, null at peace. */
  warSince: number | null;
  /** Turn of the last peace with this nation, null if there was none. */
  peaceSince: number | null;
  /** This nation offered peace and waits for an answer. */
  offersPeace: boolean;
  /** The player offered this nation peace and waits for its answer. */
  peaceOffered: boolean;
  /** Turn the player last offered this nation peace, null if never. */
  lastOfferTurn: number | null;
  /** How many times this nation declared war on the player. */
  declaredOnUs: number;
  /** Peace treaties this nation has broken; every nation hears of it. */
  treatiesBroken: number;
  /** The nation owns a working wonder that makes others keener on peace. */
  peaceWonder: boolean;
}

export interface PlayerView {
  playerId: PlayerId;
  civ: NationId;
  turn: number;
  isMyTurn: boolean;
  width: number;
  height: number;
  /** Terrain of explored tiles, null where the player has not been. */
  terrain: (TerrainId | null)[];
  /**
   * Improvements on explored tiles. For now they show the current state;
   * once opponents can change land the player cannot see, this becomes
   * "as last seen".
   */
  road: number[];
  irrigation: number[];
  mine: number[];
  railroad: number[];
  fortress: number[];
  /** Special resources on explored tiles. */
  special: number[];
  /** Polluted explored tiles. */
  pollution: number[];
  /** Ruins on explored tiles that nobody has entered yet. */
  ruins: number[];
  /** How close global warming is, 0 to 100 percent; the whole world sees it. */
  warmingPct: number;
  start: Point;
  /** Names of all players. Contact and diplomacy rules come later. */
  playerNames: string[];
  units: Unit[];
  /** Other players' units on tiles the player sees right now, passengers of ships hidden. */
  foreignUnits: Unit[];
  /** Tiles the player sees right now; elsewhere the map shows what was last seen. */
  visible: number[];
  cities: City[];
  /**
   * Price of bribing each foreign city an own diplomat stands next to, as the
   * diplomat's button shows it; keyed by city id.
   */
  bribePrices: Record<number, number>;
  /** Shields each own city adds to its production per turn, as its city screen shows; keyed by city id. */
  cityShields: Record<number, number>;
  /** Food each own city has to spare per turn, as its city screen shows; keyed by city id. */
  cityFood: Record<number, number>;
  /**
   * Other players' cities the player has seen on explored land, or all of them
   * with the space program. Without an embassy with the owner only buildings
   * seen from outside are listed (walls and other fortifications, the palace,
   * wonders) and `production` is wealth; `productionKnown` says which it is.
   */
  foreignCities: (City & { productionKnown: boolean })[];
  rivals: RivalView[];
  /** The player's own economy, as shown in the top bar. */
  economy: {
    techs: TechId[];
    researching: TechId | null;
    researchGoal: TechId | null;
    research: number;
    researchCost: number;
    gold: number;
    scienceRate: number;
    luxuryRate: number;
    government: GovernmentId;
    revolution: { target: GovernmentId; turnsLeft: number } | null;
    spaceship: Spaceship;
    embassies: PlayerId[];
    /** Enemy cities this player has taken or razed. */
    captured: number;
    /** Gold the treasury gains each turn after building upkeep, as the top bar shows it. */
    income: number;
  };
  victory: GameState["victory"];
  /** The player's own score with its parts. */
  score: Score;
  /** Difficulty of the game; everybody knows it. */
  difficulty: Difficulty;
  /** A person plays this seat; the difficulty does not weaken them. */
  isHuman: boolean;
  /** How many barbarians the game has; everybody knows it. */
  barbarians: BarbarianLevel;
  /** Length of the game and its last turn; everybody knows them. */
  speed: GameSpeed;
  maxTurns: number;
  /** Wonders already standing somewhere; every player hears when one is finished. */
  builtWonders: BuildingId[];
}

/** Tiles a player sees this moment: around own units by their sight and around own cities. */
export function visibleTiles(state: GameState, playerId: PlayerId): number[] {
  const seen = new Array<number>(state.map.width * state.map.height).fill(0);
  const mark = (center: Point, radius: number) => {
    for (const i of tilesInRadius(state.map, center, radius)) seen[i] = 1;
  };
  for (const u of state.units) if (u.owner === playerId) mark(u, UNIT_TYPES[u.type].sight ?? RULES.unitSight);
  for (const c of state.cities) if (c.owner === playerId) mark(c, RULES.citySight);
  return seen;
}

export function playerView(state: GameState, playerId: PlayerId): PlayerView {
  const ownReports = state.cities.filter((c) => c.owner === playerId).map((c) => [c.id, cityReport(state, c)] as const);
  const player = state.players[playerId];
  if (!player) throw new Error(`playerView: unknown player ${playerId}`);
  const visible = visibleTiles(state, playerId);
  const known = (values: number[]) => values.map((v, i) => (player.explored[i] ? v : 0));
  const seesAll = wonderFlag(state, playerId, "seesAllCities");
  return {
    playerId,
    civ: player.civ,
    turn: state.turn,
    isMyTurn: state.currentPlayer === playerId,
    width: state.map.width,
    height: state.map.height,
    terrain: state.map.terrain.map((t, i) => (player.explored[i] ? t : null)),
    road: known(state.map.road),
    irrigation: known(state.map.irrigation),
    mine: known(state.map.mine),
    railroad: known(state.map.railroad),
    fortress: known(state.map.fortress),
    special: known(state.map.special),
    pollution: known(state.map.pollution),
    ruins: known(state.map.ruins),
    warmingPct: Math.min(100, Math.round((100 * state.warming) / RULES.warmingLimit)),
    start: { ...player.start },
    playerNames: state.players.map((p) => p.name),
    // Only own units and cities until other players can be met.
    units: state.units.filter((u) => u.owner === playerId).map((u) => ({ ...u })),
    foreignUnits: state.units
      .filter((u) => u.owner !== playerId && u.carriedBy === null && visible[u.y * state.map.width + u.x])
      .map((u) => ({ ...u, goto: null, orders: null, work: null, homeCity: null })),
    visible,
    cities: state.cities.filter((c) => c.owner === playerId).map((c) => ({ ...c })),
    bribePrices: Object.fromEntries(
      state.cities
        .filter((c) => c.owner !== playerId && state.units.some((u) => u.owner === playerId && UNIT_TYPES[u.type].special === "diplomat" && distance(u, c) <= 1))
        .map((c) => [c.id, inciteCost(state, c)]),
    ),
    cityShields: Object.fromEntries(ownReports.map(([id, r]) => [id, r.shieldSurplus])),
    cityFood: Object.fromEntries(ownReports.map(([id, r]) => [id, r.foodSurplus])),
    foreignCities: state.cities
      .filter((c) => c.owner !== playerId && (seesAll || player.explored[c.y * state.map.width + c.x]))
      .map((c) => {
        const embassy = player.embassies.includes(c.owner);
        return {
          ...c,
          buildings: embassy ? [...c.buildings] : c.buildings.filter(seenFromOutside),
          production: embassy ? { ...c.production } : { kind: "wealth" as const },
          productionKnown: embassy,
          worked: [],
          food: 0,
          shields: 0,
          queue: [],
          tradeRoutes: [],
          stolenBy: c.stolenBy.filter((p) => p === playerId),
          taxmen: 0,
          scientists: 0,
          disorderTurns: 0,
          soldTurn: null,
          governor: null,
        };
      }),
    rivals: state.players
      .filter((p) => p.id !== playerId)
      .map((p) => ({
        id: p.id,
        civ: p.civ,
        barbarian: isBarbarian(p),
        score: player.contacts.includes(p.id) && !isBarbarian(p) && !p.defeated ? scoreOf(state, p.id).total : null,
        defeated: p.defeated,
        warSince: player.warSince[String(p.id)] ?? null,
        peaceSince: player.peaceSince[String(p.id)] ?? null,
        offersPeace: player.peaceOffers.includes(p.id),
        peaceOffered: p.peaceOffers.includes(playerId),
        lastOfferTurn: player.offeredPeace[String(p.id)] ?? null,
        declaredOnUs: player.declaredOnMe[String(p.id)] ?? 0,
        treatiesBroken: p.treatiesBroken,
        peaceWonder: wonderFlag(state, p.id, "peaceOffers"),
        name: p.name,
        contact: player.contacts.includes(p.id),
        atWar: player.atWar.includes(p.id),
        embassy: player.embassies.includes(p.id) ? { techs: [...p.techs], gold: p.gold, government: p.government } : null,
        spaceshipArrival: p.spaceship.arrivalTurn,
      })),
    economy: {
      techs: [...player.techs],
      researching: player.researching,
      researchGoal: player.researchGoal,
      research: player.research,
      researchCost: researchCost(player),
      gold: player.gold,
      scienceRate: player.scienceRate,
      luxuryRate: player.luxuryRate,
      government: player.government,
      revolution: player.revolution ? { ...player.revolution } : null,
      spaceship: { ...player.spaceship },
      embassies: [...player.embassies],
      captured: player.captured,
      income: state.cities.filter((c) => c.owner === playerId).reduce((n, c) => {
        const r = cityReport(state, c);
        return n + r.gold + r.wealthGold;
      }, 0) - buildingUpkeep(state, playerId),
    },
    victory: state.victory ? { ...state.victory } : null,
    score: scoreOf(state, playerId),
    difficulty: state.difficulty,
    isHuman: player.isHuman,
    barbarians: state.barbarians,
    speed: state.speed ?? "normal",
    maxTurns: maxTurns(state),
    builtWonders: builtWonders(state),
  };
}
