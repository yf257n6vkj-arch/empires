/**
 * Measures the pace of the economy: a simple scripted player builds cities,
 * buildings and researches on its own for 120 turns, on many maps. It is a
 * measuring stick for the numbers in the data files, not the AI. It reads the
 * whole game state, which the real AI must never do.
 *
 *   npm run pace -- 200
 */
import {
  applyCommand,
  canBuildImprovement,
  cityRadiusTiles,
  findPath,
  type ImprovementId,
  BUILDINGS,
  buildingUpkeep,
  buyCost,
  cityReport,
  currentEra,
  distance,
  fallbackProduction,
  newGame,
  passComputerTurns,
  productionOptions,
  researchableTechs,
  RULES,
  sameItem,
  siteScore,
  TECHS,
  UNIT_TYPES,
  type BuildingId,
  type City,
  type Command,
  type GameState,
  type Point,
  type ProductionItem,
} from "../src/core";

const games = Number(process.argv[2] ?? 100);

// Experiments without editing the data files:
//   PACE_SET="growthFoodBase=6,researchCostBase=10" PACE_COST=0.6 npm run pace -- 50
for (const pair of (process.env.PACE_SET ?? "").split(",").filter(Boolean)) {
  const [key, value] = pair.split("=");
  (RULES as unknown as Record<string, number>)[key!] = Number(value);
}
const costScale = Number(process.env.PACE_COST ?? 1);
if (costScale !== 1) {
  for (const u of Object.values(UNIT_TYPES)) (u as { cost: number }).cost = Math.round(u.cost * costScale);
  for (const b of Object.values(BUILDINGS)) (b as { cost: number }).cost = Math.round(b.cost * costScale);
}
const TARGET_CITIES = 10;
const ME = 0;

/** Buildings in the order the scripted player wants them once it has enough cities. */
const BUILD_ORDER: BuildingId[] = [
  "library",
  "granary",
  "marketplace",
  "hallOfScholars",
  "greatObservatory",
  "university",
  "stoneCircle",
  "grandBazaar",
  "factory",
  "greatWork",
];

function run(state: GameState, command: Command): GameState {
  const result = applyCommand(state, command);
  return result.ok ? result.state : state;
}

const targets = new Map<number, Point>();
/** Settlers that build roads and irrigation instead of founding cities. */
const workers = new Set<number>();
const founders = new Set<number>();
/** Settlers in production that are meant as workers (counted roughly). */
let pendingWorkers = 0;

/** Next job for a worker: the nearest worked tile of an own city that still lacks something useful. */
function chooseJob(state: GameState, from: Point, unitId: number): { at: Point; improvement: ImprovementId } | null {
  const jobs = [...targets.entries()].filter(([id]) => id !== unitId).map(([, p]) => p);
  let best: { at: Point; improvement: ImprovementId; value: number } | null = null;
  for (const c of state.cities.filter((x) => x.owner === ME)) {
    for (const i of cityRadiusTiles(state.map, c)) {
      if (!c.worked.includes(i)) continue;
      const at = { x: i % state.map.width, y: Math.floor(i / state.map.width) };
      if (jobs.some((j) => j.x === at.x && j.y === at.y)) continue;
      const t = state.map.terrain[i]!;
      const wish: ImprovementId[] =
        t === "hills" ? ["mine"] : t === "grassland" || t === "plains" || t === "desert" ? ["road", "irrigation"] : [];
      for (const improvement of wish) {
        if (state.map[improvement][i]) continue;
        const probe = { ...state.units.find((u) => u.id === unitId)!, x: at.x, y: at.y, movesLeft: 3 };
        if (canBuildImprovement(state, probe, improvement) !== null) continue;
        const value = 10 - distance(from, at) - (improvement === "road" ? 0 : 2);
        if (!best || value > best.value) best = { at, improvement, value };
        break;
      }
    }
  }
  return best;
}

function chooseSite(state: GameState, from: Point, settlerId: number): Point | null {
  const cities = state.cities.filter((c) => c.owner === ME);
  const taken = [...targets.entries()].filter(([id]) => id !== settlerId).map(([, p]) => p);
  let best: Point | null = null;
  let bestValue = -Infinity;
  for (let y = 0; y < state.map.height; y++) {
    for (let x = 0; x < state.map.width; x++) {
      const p = { x, y };
      const d = distance(p, from);
      if (d > 8) continue;
      if (cities.some((c) => distance(c, p) < 3)) continue;
      if (taken.some((t) => distance(t, p) < 3)) continue;
      if (cities.length > 0 && Math.min(...cities.map((c) => distance(c, p))) > 6) continue;
      const score = siteScore(state.map, p);
      if (!Number.isFinite(score)) continue;
      // A city on forest or desert has too little food in its centre to grow.
      const centre = state.map.terrain[y * state.map.width + x];
      if (centre === "forest" || centre === "desert") continue;
      const value = score - d * 1.5;
      if (value > bestValue) {
        bestValue = value;
        best = p;
      }
    }
  }
  return best;
}

function moveUnits(state: GameState): GameState {
  for (const unit of state.units.filter((u) => u.owner === ME)) {
    const u = state.units.find((x) => x.id === unit.id);
    if (!u || u.movesLeft <= 0) continue;
    if (UNIT_TYPES[u.type].foundsCity && !targets.has(u.id) && !workers.has(u.id) && !founders.has(u.id)) {
      // The purpose is decided once, when the settler appears, like the real AI will do.
      const mine = state.cities.filter((c) => c.owner === ME).length;
      const liveWorkers = [...workers].filter((id) => state.units.some((x) => x.id === id)).length;
      const liveFounders = [...founders].filter((id) => state.units.some((x) => x.id === id)).length;
      if (mine >= 3 && (liveWorkers < Math.floor(mine / 2) || mine + liveFounders >= TARGET_CITIES)) workers.add(u.id);
      else founders.add(u.id);
    }
    if (UNIT_TYPES[u.type].foundsCity && workers.has(u.id)) {
      if (u.work) continue;
      const job = chooseJob(state, u, u.id);
      if (!job) continue;
      targets.set(u.id, job.at);
      if (u.x === job.at.x && u.y === job.at.y) {
        state = run(state, { type: "buildImprovement", unitId: u.id, improvement: job.improvement });
        targets.delete(u.id);
      } else if (!u.goto || u.goto.x !== job.at.x || u.goto.y !== job.at.y) {
        if (findPath(state, ME, u, job.at)) state = run(state, { type: "goto", unitId: u.id, to: job.at });
      }
      continue;
    }
    if (UNIT_TYPES[u.type].foundsCity) {
      let target = targets.get(u.id) ?? chooseSite(state, u, u.id);
      if (!target) continue;
      if (u.x === target.x && u.y === target.y) {
        const next = run(state, { type: "foundCity", unitId: u.id });
        if (next !== state) {
          targets.delete(u.id);
          state = next;
          continue;
        }
        target = chooseSite(state, u, u.id);
        if (!target) continue;
      }
      targets.set(u.id, target);
      if (!u.goto) state = run(state, { type: "goto", unitId: u.id, to: target });
    } else if (!u.fortified) {
      state = run(state, { type: "fortify", unitId: u.id });
    }
  }
  return state;
}

function wants(state: GameState, city: City): ProductionItem {
  const options = productionOptions(state, city);
  const can = (item: ProductionItem) => options.some((o) => sameItem(o, item));
  const mine = state.cities.filter((c) => c.owner === ME);
  const defenders = state.units.filter(
    (u) => u.owner === ME && u.x === city.x && u.y === city.y && UNIT_TYPES[u.type].attack > 0,
  ).length;
  if (defenders === 0) return fallbackProduction(state, ME);

  const settlersOut = state.units.filter((u) => u.owner === ME && UNIT_TYPES[u.type].foundsCity).length;
  const settlersPlanned = mine.filter((c) => c.production.kind === "unit" && c.production.id === "settlers").length;
  const report = cityReport(state, city);
  const founders = settlersOut - [...workers].filter((id) => state.units.some((u) => u.id === id)).length;
  const mineSettler = city.production.kind === "unit" && city.production.id === "settlers";
  const expanding = mine.length + founders + settlersPlanned - (mineSettler ? 1 : 0) < TARGET_CITIES;
  const workerCount = [...workers].filter((id) => state.units.some((u) => u.id === id)).length + pendingWorkers;
  const wantWorkers = Math.floor(mine.length / 2);
  if (workerCount < wantWorkers && city.size >= 3 && (settlersPlanned < 2 || mineSettler)) {
    return { kind: "unit", id: "settlers" };
  }
  if (expanding && (settlersPlanned < 3 || mineSettler)) return { kind: "unit", id: "settlers" };
  const building = (id: BuildingId): ProductionItem => ({ kind: "building", id });
  if (report.happiness.entertainers > 0) {
    for (const id of ["temple", "amphitheater"] as BuildingId[]) if (can(building(id))) return building(id);
  }
  if (city.size >= report.maxSize && can(building("aqueduct"))) return building("aqueduct");
  const strongest = [...mine].sort((a, b) => cityReport(state, b).shieldSurplus - cityReport(state, a).shieldSurplus)[0];
  for (const id of BUILD_ORDER) {
    if (BUILDINGS[id].wonder && strongest?.id !== city.id) continue;
    if (can(building(id))) return building(id);
  }
  // Nothing better to do: another worker if the city can spare a citizen.
  if (city.size >= 4) return { kind: "unit", id: "settlers" };
  return fallbackProduction(state, ME);
}

function manageCities(state: GameState): GameState {
  for (const c of state.cities.filter((x) => x.owner === ME)) {
    const city = state.cities.find((x) => x.id === c.id)!;
    const item = wants(state, city);
    if (!sameItem(item, city.production)) state = run(state, { type: "setProduction", cityId: city.id, item });
  }
  // Spend spare gold on the most advanced building in progress.
  const me = state.players[ME]!;
  if (me.gold > 150) {
    const city = state.cities
      .filter((c) => c.owner === ME && c.production.kind === "building" && buyCost(c) > 0)
      .sort((a, b) => buyCost(a) - buyCost(b))[0];
    if (city && buyCost(city) <= me.gold - 60) state = run(state, { type: "buy", cityId: city.id });
  }
  return state;
}

function manageEconomy(state: GameState): GameState {
  const me = state.players[ME]!;
  if (me.researching === null) {
    const options = researchableTechs(me).sort((a, b) => TECHS[a].era - TECHS[b].era);
    if (options[0]) state = run(state, { type: "setResearch", tech: options[0] });
  }
  // Highest science rate that does not drain the treasury.
  for (let rate = 100; rate >= 0; rate -= RULES.rateStep) {
    const trial = run(state, { type: "setScienceRate", rate });
    let gold = 0;
    for (const c of trial.cities) if (c.owner === ME) gold += cityReport(trial, c).gold;
    const net = gold - buildingUpkeep(trial, ME);
    if (net >= 0 || (trial.players[ME]!.gold > 40 && net >= -2) || rate === 0) return trial;
  }
  return state;
}

interface Result {
  eraTurn: Record<number, number | null>;
  techsAt: Record<number, number>;
  allTechsTurn: number | null;
  cities: number;
  population: number;
  wonders: number;
}

function playOne(seed: string): Result {
  targets.clear();
  workers.clear();
  founders.clear();
  let state = newGame({ seed, playerCount: 4 });
  const eraTurn: Record<number, number | null> = { 2: null, 3: null, 4: null };
  const techsAt: Record<number, number> = {};
  let allTechsTurn: number | null = null;
  const total = Object.keys(TECHS).length;
  while (state.turn <= RULES.maxTurns) {
    state = manageEconomy(state);
    state = moveUnits(state);
    state = manageCities(state);
    const ended = applyCommand(state, { type: "endTurn" });
    if (!ended.ok) break;
    state = passComputerTurns(ended.state).state;
    const me = state.players[ME]!;
    const era = currentEra(me);
    for (const e of [2, 3, 4]) if (era >= e && eraTurn[e] === null) eraTurn[e] = state.turn;
    if (allTechsTurn === null && me.techs.length === total) allTechsTurn = state.turn;
    if ([40, 60, 80, 100, 120].includes(state.turn - 1)) techsAt[state.turn - 1] = me.techs.length;
    if (process.env.PACE_DEBUG && state.turn % 10 === 0) {
      const mine = state.cities.filter((c) => c.owner === ME);
      const rs = mine.map((c) => cityReport(state, c));
      console.log(`t${state.turn} cities ${mine.length} pop ${mine.reduce((n, c) => n + c.size, 0)} trade ${rs.reduce((n, r) => n + r.production.trade, 0)} sci ${rs.reduce((n, r) => n + r.science, 0)} gold ${me.gold} rate ${me.scienceRate} research ${me.research}/${me.researching} techs ${me.techs.length} units ${state.units.length}`);
      if (process.env.PACE_SEED) for (const c of mine) console.log(" ", c.x, c.y, state.map.terrain[c.y * state.map.width + c.x], JSON.stringify(cityReport(state, c).production), c.worked.length, c.food, c.shields, c.production.id, state.players[ME]!.explored.reduce((a, b) => a + b, 0));

    }
  }
  const mine = state.cities.filter((c) => c.owner === ME);
  return {
    eraTurn,
    techsAt,
    allTechsTurn,
    cities: mine.length,
    population: mine.reduce((n, c) => n + c.size, 0),
    wonders: mine.reduce((n, c) => n + c.buildings.filter((b) => BUILDINGS[b].wonder).length, 0),
  };
}

const results: Result[] = [];
const stuck: string[] = [];
const started = performance.now();
for (let i = 1; i <= games; i++) {
  const r = playOne(process.env.PACE_SEED ?? `pace-${i}`);
  results.push(r);
  if (r.cities < 3) stuck.push(`pace-${i}`);
}
const seconds = ((performance.now() - started) / 1000).toFixed(0);

function quantiles(values: (number | null)[]): string {
  const known = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
  const missing = values.length - known.length;
  if (known.length === 0) return `nikdy (${missing}×)`;
  const q = (p: number) => known[Math.min(known.length - 1, Math.floor(p * known.length))];
  return `medián ${q(0.5)}, 10 % ${q(0.1)}, 90 % ${q(0.9)}${missing ? `, nedosaženo ${missing}×` : ""}`;
}

console.log(`${games} partií za ${seconds} s, cena výzkumu ${RULES.researchCostBase} + ${RULES.researchCostPerTech} × počet technologií`);
for (const e of [2, 3, 4]) console.log(`éra ${e} v tahu: ${quantiles(results.map((r) => r.eraTurn[e] ?? null))}`);
for (const t of [40, 60, 80, 100, 120]) console.log(`technologie v tahu ${t}: ${quantiles(results.map((r) => r.techsAt[t] ?? null))}`);
console.log(`celý strom v tahu: ${quantiles(results.map((r) => r.allTechsTurn))}`);
console.log(`města v tahu 120: ${quantiles(results.map((r) => r.cities))}`);
console.log(`obyvatel v tahu 120: ${quantiles(results.map((r) => r.population))}`);
console.log(`divy: ${quantiles(results.map((r) => r.wonders))}`);
if (stuck.length) console.log(`zaseknuté partie (méně než 3 města): ${stuck.join(", ")}`);
