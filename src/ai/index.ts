/**
 * Computer players. The AI sees the world only through PlayerView, the same
 * information a human in its seat has, and acts only through commands, the
 * same ones the human uses (CLAUDE.md, rules 1 and 2).
 *
 * This first version only holds its ground: it founds a capital, keeps
 * defenders in its cities and builds walls. Expansion, armies and diplomacy
 * come in the next steps of phase 3.
 */
import {
  applyCommand,
  BUILDINGS,
  playerView,
  TECHS,
  UNIT_TYPES,
  type BuildingId,
  type Command,
  type GameEvent,
  type GameState,
  type PlayerView,
  type TechId,
  type UnitTypeId,
} from "../core";

/** Plays every computer player in a row until a human is on turn (or the game ends). */
export function playComputerTurns(state: GameState): { state: GameState; events: GameEvent[] } {
  let current = state;
  const events: GameEvent[] = [];
  let guard = current.players.length;
  while (!current.players[current.currentPlayer]?.isHuman && guard-- > 0) {
    const played = playTurn(current);
    current = played.state;
    events.push(...played.events);
  }
  return { state: current, events };
}

/** One computer player's whole turn, ending with endTurn. */
export function playTurn(state: GameState): { state: GameState; events: GameEvent[] } {
  let current = state;
  const events: GameEvent[] = [];
  const me = current.currentPlayer;
  if (!current.players[me]?.defeated) {
    for (const command of decide(playerView(current, me))) {
      const result = applyCommand(current, command);
      // A command the rules refuse is skipped; the AI tries again next turn.
      if (!result.ok) continue;
      current = result.state;
      events.push(...result.events);
    }
  }
  const ended = applyCommand(current, { type: "endTurn" });
  if (ended.ok) {
    current = ended.state;
    events.push(...ended.events);
  }
  return { state: current, events };
}

/** Research the AI prefers while it only defends: defence and walls first. */
const RESEARCH_ORDER: TechId[] = ["bronze", "masonry", "alphabet", "ceremonies", "pottery", "archery", "horseback", "writing", "iron", "mathematics", "currency", "feudalism", "gunpowder"];

function knows(view: PlayerView, tech: TechId | null): boolean {
  return tech === null || view.economy.techs.includes(tech);
}

function researchable(view: PlayerView): TechId[] {
  return (Object.keys(TECHS) as TechId[]).filter((t) => !knows(view, t) && TECHS[t].requires.every((r) => knows(view, r)));
}

/** The strongest defender the player can build on land. */
function bestDefender(view: PlayerView): UnitTypeId {
  let best: UnitTypeId = "warriors";
  for (const [id, rule] of Object.entries(UNIT_TYPES) as [UnitTypeId, (typeof UNIT_TYPES)[UnitTypeId]][]) {
    if (rule.domain !== "land" || rule.attack <= 0 || rule.special || !knows(view, rule.requires)) continue;
    if (rule.requiresWonder && !view.builtWonders.includes(rule.requiresWonder)) continue;
    const current = UNIT_TYPES[best];
    if (rule.defense > current.defense || (rule.defense === current.defense && rule.cost < current.cost)) best = id;
  }
  return best;
}

function canBuild(view: PlayerView, cityBuildings: BuildingId[], b: BuildingId): boolean {
  const rule = BUILDINGS[b];
  if (rule.wonder || rule.spaceship || rule.coastal || cityBuildings.includes(b)) return false;
  if (!knows(view, rule.requires)) return false;
  return rule.requiresBuilding === null || cityBuildings.includes(rule.requiresBuilding);
}

/** Defenders a city keeps at home. */
const GARRISON = 2;
const BUILD_ORDER: BuildingId[] = ["walls", "barracks", "granary", "temple", "library", "marketplace"];

export function decide(view: PlayerView): Command[] {
  const commands: Command[] = [];

  if (view.economy.researching === null) {
    const options = researchable(view);
    const pick = RESEARCH_ORDER.find((t) => options.includes(t)) ?? options[0];
    if (pick) commands.push({ type: "setResearch", tech: pick });
  }

  // The first settler founds the capital where it stands.
  if (view.cities.length === 0) {
    const settler = view.units.find((u) => UNIT_TYPES[u.type].foundsCity);
    if (settler) commands.push({ type: "foundCity", unitId: settler.id });
  }

  const soldiers = view.units.filter((u) => UNIT_TYPES[u.type].attack > 0 && UNIT_TYPES[u.type].domain === "land");
  for (const u of soldiers) {
    const home = view.cities.find((c) => c.x === u.x && c.y === u.y);
    if (home) {
      if (!u.fortified) commands.push({ type: "fortify", unitId: u.id });
      continue;
    }
    // Soldiers outside walk to the city with the fewest defenders.
    const target = [...view.cities].sort((a, b) => garrison(view, a) - garrison(view, b))[0];
    if (target && !u.goto) commands.push({ type: "goto", unitId: u.id, to: { x: target.x, y: target.y } });
  }

  for (const city of view.cities) {
    const wanted = (() => {
      if (garrison(view, city) < GARRISON) return { kind: "unit" as const, id: bestDefender(view) };
      const building = BUILD_ORDER.find((b) => canBuild(view, city.buildings, b));
      return building ? { kind: "building" as const, id: building } : { kind: "wealth" as const };
    })();
    const now = city.production;
    const same = now.kind === wanted.kind && (now.kind === "wealth" || ("id" in wanted && now.id === wanted.id));
    if (!same) commands.push({ type: "setProduction", cityId: city.id, item: wanted });
  }
  return commands;
}

/** Defenders standing in the city or on their way there, plus one in production. */
function garrison(view: PlayerView, city: { x: number; y: number }): number {
  return view.units.filter(
    (u) =>
      UNIT_TYPES[u.type].attack > 0 &&
      UNIT_TYPES[u.type].domain === "land" &&
      ((u.x === city.x && u.y === city.y) || (u.goto?.x === city.x && u.goto?.y === city.y)),
  ).length;
}
