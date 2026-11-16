/**
 * The city governor: the owner gives a city a goal and the governor places
 * citizens for it and picks the next thing to build when the city finishes
 * something with nothing planned. Weights live in game.json under "governor".
 *
 * It reads only the city and its owner's own state, which the owner sees anyway.
 */
import { cityHappiness, cityReport } from "./city";
import { atWar } from "./combat";
import { buildingUpkeep, canBuild, fallbackProduction, productionOptions } from "./economy";
import { BUILDINGS, RULES, UNIT_TYPES, type BuildingId, type Yield } from "./rules";
import type { City, GameState, ProductionItem } from "./state";
import { distance } from "./geometry";

export const GOVERNOR_GOALS = ["balanced", "growth", "production", "science", "gold", "defense"] as const;
export type GovernorGoal = (typeof GOVERNOR_GOALS)[number];

interface GoalWeights {
  /** Weights of food, shields and trade for a tile once the city is fed. */
  tile: Yield;
  /** Food surplus the city aims for before it weighs the other yields. */
  foodTarget: number;
  /** Weights of what a building adds to the city every turn. */
  food: number;
  shields: number;
  science: number;
  gold: number;
  /** Weight of each unhappy citizen a building calms. */
  content: number;
  /** Defenders the governor keeps in the city. */
  defenders: number;
}

function weights(goal: GovernorGoal): GoalWeights {
  return RULES.governor[goal] as GoalWeights;
}

function isDefender(type: keyof typeof UNIT_TYPES): boolean {
  const u = UNIT_TYPES[type];
  return u.domain === "land" && u.defense > 0 && u.attack > 0 && !u.special && !u.buildsImprovements;
}

/** Score of a tile for the goal; used by the worker placement in city.ts. */
export function governorTileScore(goal: GovernorGoal, y: Yield, hungry: boolean): number {
  if (hungry) return y.food * 10 + y.shields * 3 + y.trade * 2;
  const w = weights(goal).tile;
  return y.food * w.food + y.shields * w.shields + y.trade * w.trade;
}

export function governorFoodTarget(goal: GovernorGoal): number {
  return weights(goal).foodTarget;
}

/** What one building would add to the city per turn, weighted by the goal, and the gold it adds after its upkeep. */
function buildingValue(state: GameState, city: City, id: BuildingId, goal: GovernorGoal): { value: number; gold: number } {
  const w = weights(goal);
  const before = cityReport(state, city);
  const after: GameState = { ...state, cities: state.cities.map((c) => (c.id === city.id ? { ...c, buildings: [...c.buildings, id] } : c)) };
  const now = cityReport(after, after.cities.find((c) => c.id === city.id)!);
  const b = BUILDINGS[id];
  let value =
    (now.foodSurplus - before.foodSurplus) * w.food +
    (now.shieldSurplus - before.shieldSurplus) * w.shields +
    (now.science - before.science) * w.science +
    (now.gold - before.gold) * w.gold +
    (before.happiness.unhappy - now.happiness.unhappy) * w.content;
  // Some buildings pay off later than this turn.
  const later = RULES.governor.later[id as keyof typeof RULES.governor.later] as Partial<Record<GovernorGoal | "any", number>> | undefined;
  if (later) value += (later[goal] ?? 0) + (later.any ?? 0);
  if (now.maxSize > before.maxSize && city.size >= before.maxSize - 1) value += w.food * 3;
  return { value: value - b.upkeep * w.gold, gold: now.gold - before.gold - b.upkeep };
}

/** Gold the owner earns per turn after building upkeep. */
function netGold(state: GameState, owner: number): number {
  return state.cities.filter((c) => c.owner === owner).reduce((n, c) => n + cityReport(state, c).gold, 0) - buildingUpkeep(state, owner);
}

/** The strongest defender the city can build now. */
function defender(state: GameState, city: City): ProductionItem {
  return fallbackProduction(state, city.owner);
}

/**
 * The next thing a governed city should build. Safety comes first: a defender
 * when the city has too few or enemies are near, a temple when it would riot.
 * Then the building that brings most for the goal per shield, and gold when
 * nothing is worth building.
 */
export function governorProduction(state: GameState, city: City, goal: GovernorGoal): ProductionItem {
  const w = weights(goal);
  const here = state.units.filter((u) => u.owner === city.owner && u.x === city.x && u.y === city.y && isDefender(u.type)).length;
  const threatened = state.units.some((u) => u.owner !== city.owner && atWar(state, city.owner, u.owner) && UNIT_TYPES[u.type].attack > 0 && distance(u, city) <= 3);
  const wanted = Math.max(1, w.defenders) + (threatened ? 1 : 0);
  if (here < wanted) return defender(state, city);

  const options = productionOptions(state, city).filter(
    (o): o is Extract<ProductionItem, { kind: "building" }> => o.kind === "building" && !BUILDINGS[o.id].wonder && !BUILDINGS[o.id].spaceship,
  );
  const h = cityHappiness(state, city);
  if (h.disorder || h.unhappy > h.happy) {
    const calming = options.filter((o) => (BUILDINGS[o.id].effects.content ?? 0) > 0).sort((a, b) => BUILDINGS[a.id].cost - BUILDINGS[b.id].cost);
    if (calming[0]) return calming[0];
  }
  let best: ProductionItem | null = null;
  let bestScore = 0;
  const net = netGold(state, city.owner);
  const treasury = state.players[city.owner]!.gold;
  for (const o of options) {
    const { value, gold } = buildingValue(state, city, o.id, goal);
    // A building the treasury cannot keep up would be sold again.
    if (gold < 0 && net + gold < 0 && treasury < RULES.governor.reserveGold) continue;
    const score = value / Math.sqrt(BUILDINGS[o.id].cost);
    if (score > bestScore) {
      best = o;
      bestScore = score;
    }
  }
  if (best) return best;
  // With nothing worth building a second defender comes before earning gold.
  if (here < 2 || !canBuild(state, city, { kind: "wealth" })) return defender(state, city);
  return { kind: "wealth" };
}
