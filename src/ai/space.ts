/**
 * The space race. Once the Apollo Program stands somewhere, the AI builds
 * spaceship parts in its most productive cities: structures first, then
 * engines and modules, and launches when the ship is good enough or when
 * waiting longer would land it after the last turn.
 */
import { BUILDINGS, RULES, spaceshipFlight, type BuildingId, type City, type Command, type PlayerView, type ProductionItem } from "../core";

/** The ship the AI is happy with: three modules for a safe landing and three engines for a short flight. */
const WANTED = { module: 3, component: 3 };
/** Cities that build parts at the same time. */
const BUILDERS = 5;

function knows(view: PlayerView, tech: string | null): boolean {
  return tech === null || view.economy.techs.includes(tech as never);
}

function partAvailable(view: PlayerView, id: BuildingId): boolean {
  const b = BUILDINGS[id];
  return view.builtWonders.includes("apolloProgram") && knows(view, b.requires);
}

/** Parts on the ship plus parts being built now, by kind. */
function partsPlanned(view: PlayerView): { structural: number; component: number; module: number } {
  const ship = view.economy.spaceship;
  const out = { structural: ship.structural, component: ship.component, module: ship.module };
  for (const c of view.cities) {
    if (c.production.kind !== "building") continue;
    const kind = BUILDINGS[c.production.id].spaceship;
    if (kind) out[kind] += 1;
  }
  return out;
}

/** The cities that build parts: the most productive ones. */
export function spaceBuilders(view: PlayerView): number[] {
  if (view.economy.spaceship.launchedTurn !== null || !partAvailable(view, "ssStructural")) return [];
  return [...view.cities]
    .sort((a, b) => (view.cityShields[b.id] ?? 0) - (view.cityShields[a.id] ?? 0) || b.size - a.size || a.id - b.id)
    .slice(0, BUILDERS)
    .map((c) => c.id);
}

/**
 * Order of parts: the smallest ship that can fly comes first, so a late start
 * still gets off the ground, then more engines and modules with their structures.
 */
const ORDER: ("structural" | "component" | "module")[] = ["structural", "structural", "component", "module", "structural", "component", "structural", "module", "structural", "component", "structural", "module"];
const PART: Record<(typeof ORDER)[number], BuildingId> = { structural: "ssStructural", component: "ssComponent", module: "ssModule" };

/** The next part this city should build, or null when the ship needs nothing more from it. */
export function spacePart(view: PlayerView, city: City, claimed: SpaceClaims = { structural: 0, component: 0, module: 0 }): ProductionItem | null {
  // A city already on a part keeps building it.
  if (city.production.kind === "building" && BUILDINGS[city.production.id].spaceship) return city.production;
  const planned = partsPlanned(view);
  // Parts other cities picked earlier in this same turn.
  for (const kind of KINDS) planned[kind] += claimed[kind];
  const pick = nextPart(view, planned);
  if (pick) claimed[BUILDINGS[pick.id].spaceship!] += 1;
  return pick;
}

/** Parts other cities chose earlier in the same turn, which the view does not show yet. */
export type SpaceClaims = { structural: number; component: number; module: number };
const KINDS = ["structural", "component", "module"] as const;

function nextPart(view: PlayerView, planned: SpaceClaims): (ProductionItem & { kind: "building" }) | null {
  const seen = { structural: 0, component: 0, module: 0 };
  for (const kind of ORDER) {
    seen[kind] += 1;
    if (planned[kind] >= seen[kind]) continue;
    if (!partAvailable(view, PART[kind])) {
      // Waiting for the technology: a couple of structures ahead, no more.
      const ahead = planned.structural < Math.min(RULES.spaceship.maxStructural, planned.component + planned.module + 2);
      return kind !== "structural" && partAvailable(view, "ssStructural") && ahead ? { kind: "building", id: "ssStructural" } : null;
    }
    return { kind: "building", id: PART[kind] };
  }
  return null;
}

/**
 * How urgent a part is for the ship: engines and modules until the ship can
 * fly, then whatever the ship has least of. Lower is more urgent.
 */
export function partUrgency(view: PlayerView, id: BuildingId): number {
  const ship = view.economy.spaceship;
  const kind = BUILDINGS[id].spaceship;
  if (!kind) return 99;
  if (kind === "component" && ship.component < 1) return 0;
  if (kind === "module" && ship.module < 1) return 0;
  if (kind === "structural" && ship.structural < ship.component + ship.module + 1) return 1;
  return 2 + ship[kind];
}

/** Launch when the ship is complete, or now if a later start would land after the last turn. */
export function launchCommands(view: PlayerView): Command[] {
  const ship = view.economy.spaceship;
  if (ship.launchedTurn !== null || ship.component < 1 || ship.module < 1 || ship.structural < ship.component + ship.module) return [];
  const complete = ship.module >= WANTED.module && ship.component >= WANTED.component;
  const flight = spaceshipFlight(ship).turns;
  const lastChance = view.turn + flight >= view.maxTurns - 1;
  return complete || lastChance ? [{ type: "launchSpaceship" }] : [];
}
