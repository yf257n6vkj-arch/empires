/**
 * The playable page: draws the human player's view and turns clicks and keys
 * into the same commands the AI will use.
 */
import {
  applyCommand,
  BUILDINGS,
  canBuildImprovement,
  canFoundCity,
  cityRadiusTiles,
  cityReport,
  distance,
  findPath,
  IMPROVEMENTS,
  newGame,
  passComputerTurns,
  planPath,
  playerView,
  productionCost,
  productionName,
  productionOptions,
  RULES,
  sameItem,
  STATE_VERSION,
  TERRAINS,
  tileYield,
  UNIT_TYPES,
  type City,
  type Command,
  type GameEvent,
  type GameState,
  type ImprovementId,
  type Point,
  type ProductionItem,
  type Unit,
} from "../core";
import { draw, setupCanvas, TILE, type DrawInput } from "./render";
import { ERROR_TEXT, eventText } from "./texts";

const HUMAN = 0;
const PLAYER_COUNT = 4;
const SAVE_KEY = "empires.save";
const LOG_LIMIT = 60;

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const canvas = $<HTMLCanvasElement>("#map");
const tooltip = $<HTMLDivElement>("#tooltip");
const selectionPanel = $<HTMLElement>("#selection");
const logList = $<HTMLOListElement>("#log");
const statusLine = $<HTMLDivElement>("#status");
const turnLabel = $<HTMLSpanElement>("#turn");
const endTurnButton = $<HTMLButtonElement>("#end-turn");
const seedInput = $<HTMLInputElement>("#seed");
const seedLabel = $<HTMLElement>("#seed-label");
const newGameButton = $<HTMLButtonElement>("#new-game");
const showAllBox = $<HTMLInputElement>("#show-all");

interface LogEntry {
  turn: number;
  text: string;
}

let state!: GameState;
let log: LogEntry[] = [];
let selectedUnitId: number | null = null;
let selectedCityId: number | null = null;
let hoverTile: Point | null = null;
let hoverRouteText = "";
let ctx: CanvasRenderingContext2D;

// ---------- saving ----------

function save(): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: STATE_VERSION, state, log }));
  } catch {
    // Storage may be unavailable (private mode, embedded viewer); the game still works.
  }
}

function load(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as { version: number; state: GameState; log: LogEntry[] };
    if (data.version !== STATE_VERSION) return false;
    state = data.state;
    log = data.log ?? [];
    return true;
  } catch {
    return false;
  }
}

function randomSeed(): string {
  const words = ["sever", "jih", "řeka", "hora", "údolí", "les", "zátoka", "pláň", "ostrov", "mys"];
  // Math.random is fine here: it only picks a seed, the game itself is driven by Rng.
  const w = words[Math.floor(Math.random() * words.length)];
  return `${w}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function startNewGame(seed: string): void {
  state = newGame({ seed, playerCount: PLAYER_COUNT });
  log = [{ turn: 1, text: "Začíná nová hra. Najdi osadníkem dobré místo a založ první město (klávesa B)." }];
  selectedCityId = null;
  selectedUnitId = null;
  selectNextUnit();
  save();
  ctx = setupCanvas(canvas, state.map.width, state.map.height);
  refresh();
}

// ---------- commands ----------

function say(text: string): void {
  statusLine.textContent = text;
}

function addLog(events: GameEvent[]): void {
  for (const e of events) {
    const text = eventText(state, e);
    if (text) log.unshift({ turn: state.turn, text });
  }
  log = log.slice(0, LOG_LIMIT);
}

function run(command: Command): boolean {
  const result = applyCommand(state, command);
  if (!result.ok) {
    say(ERROR_TEXT[result.error]);
    return false;
  }
  say("");
  state = result.state;
  const events = [...result.events];
  if (command.type === "endTurn") {
    const passed = passComputerTurns(state);
    state = passed.state;
    events.push(...passed.events);
  }
  addLog(events);
  if (command.type === "foundCity") {
    const founded = events.find((e) => e.type === "cityFounded");
    if (founded && founded.type === "cityFounded") {
      selectedCityId = founded.cityId;
      selectedUnitId = null;
    }
  }
  save();
  return true;
}

function needsOrders(u: Unit): boolean {
  return u.owner === HUMAN && u.movesLeft > 0 && !u.goto && !u.fortified && !u.work;
}

function selectedUnit(): Unit | undefined {
  return state.units.find((u) => u.id === selectedUnitId);
}

function selectedCity(): City | undefined {
  return state.cities.find((c) => c.id === selectedCityId);
}

/** Selects the next unit that still waits for orders, starting after the current one. */
function selectNextUnit(): void {
  const waiting = state.units.filter(needsOrders);
  if (waiting.length === 0) {
    selectedUnitId = null;
    return;
  }
  const after = waiting.find((u) => selectedUnitId !== null && u.id > selectedUnitId);
  selectedUnitId = (after ?? waiting[0]!).id;
  selectedCityId = null;
}

function afterUnitAction(): void {
  const unit = selectedUnit();
  // Founding a city opens the city panel; keep it open.
  if (selectedCityId === null && (!unit || !needsOrders(unit))) selectNextUnit();
  refresh();
}

function moveSelected(to: Point): void {
  const unit = selectedUnit();
  if (!unit) return;
  const ok =
    distance(unit, to) === 1
      ? run({ type: "move", unitId: unit.id, to })
      : run({ type: "goto", unitId: unit.id, to });
  if (ok) afterUnitAction();
  else refresh();
}

function unitAction(command: Command): void {
  if (run(command)) afterUnitAction();
  else refresh();
}

function endTurn(): void {
  selectedCityId = null;
  run({ type: "endTurn" });
  selectedUnitId = null;
  selectNextUnit();
  refresh();
}

// ---------- drawing ----------

interface Route {
  target: Point;
  path: Point[] | null;
  stepTurns: number[];
  /** Turns needed, 1 = this turn; null when the unit cannot get there. */
  turns: number | null;
}

/** What a click on `p` would do with the selected unit: move or send it there. */
function clickWouldMove(unit: Unit, p: Point): boolean {
  if (unit.x === p.x && unit.y === p.y) return false;
  if (distance(unit, p) === 1) return true;
  const ownCity = state.cities.some((c) => c.x === p.x && c.y === p.y && c.owner === HUMAN);
  const ownUnits = state.units.some((u) => u.x === p.x && u.y === p.y && u.owner === HUMAN);
  return !ownCity && !ownUnits;
}

function routeTo(unit: Unit, target: Point): Route {
  const path = findPath(state, HUMAN, unit, target);
  if (!path) return { target, path: null, stepTurns: [], turns: null };
  const plan = planPath(state, unit, path);
  return { target, path, stepTurns: plan.stepTurns, turns: plan.turns };
}

/** The route to show: the tile under the mouse first, otherwise the unit's current goto. */
function routePreview(): Route | null {
  const unit = selectedUnit();
  if (!unit) return null;
  if (hoverTile && clickWouldMove(unit, hoverTile)) return routeTo(unit, hoverTile);
  if (unit.goto) return routeTo(unit, unit.goto);
  return null;
}

function routeText(route: Route): string {
  if (route.turns === null) return "Sem jednotka nedojde.";
  if (route.turns === 1) return "Jednotka sem dojde ještě v tomhle tahu.";
  return `Cesta sem zabere ${turnsText(route.turns)}.`;
}

function buildDrawInput(): DrawInput {
  const unit = selectedUnit();
  const city = selectedCity();
  const view = playerView(state, HUMAN);
  const showAll = showAllBox.checked;
  const route = routePreview();
  return {
    width: view.width,
    height: view.height,
    terrain: showAll ? state.map.terrain : view.terrain,
    road: showAll ? state.map.road : view.road,
    irrigation: showAll ? state.map.irrigation : view.irrigation,
    mine: showAll ? state.map.mine : view.mine,
    units: view.units.map((u) => ({
      id: u.id,
      owner: u.owner,
      type: u.type,
      x: u.x,
      y: u.y,
      fortified: u.fortified,
      working: u.work !== null,
      hasMoves: needsOrders(u),
    })),
    cities: view.cities.map((c) => ({ id: c.id, owner: c.owner, name: c.name, x: c.x, y: c.y, size: c.size })),
    starts: showAll ? state.players.slice(1).map((p) => ({ point: p.start, playerId: p.id })) : [],
    selectedUnitId,
    selectedCityId,
    territory: territoryOf(view.cities),
    highlight: city ? city.worked : [],
    path: route?.path ?? undefined,
    pathTurns: route?.stepTurns,
    target: route ? { point: route.target, turns: route.turns } : null,
  };
}

/** Tiles within the 21-tile radius of each player's known cities. */
function territoryOf(cities: City[]): Map<number, Set<number>> {
  const result = new Map<number, Set<number>>();
  for (const c of cities) {
    const tiles = result.get(c.owner) ?? new Set<number>();
    for (const i of cityRadiusTiles(state.map, c)) tiles.add(i);
    result.set(c.owner, tiles);
  }
  return result;
}

function refresh(): void {
  // The selection or the units may have changed, so the hovered route is computed again.
  if (hoverTile) {
    const unit = selectedUnit();
    hoverRouteText = unit && clickWouldMove(unit, hoverTile) ? routeText(routeTo(unit, hoverTile)) : "";
  }
  draw(ctx, buildDrawInput());
  turnLabel.textContent = `Tah ${state.turn} z ${RULES.maxTurns}`;
  seedLabel.textContent = state.seed;
  const waiting = state.units.some(needsOrders);
  endTurnButton.classList.toggle("ready", !waiting);
  renderSelection();
  renderLog();
}

function renderLog(): void {
  logList.innerHTML = log
    .map((e) => `<li><span class="t">${e.turn}.</span>${escapeHtml(e.text)}</li>`)
    .join("");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

function turnsText(n: number): string {
  return `${n} ${plural(n, "tah", "tahy", "tahů")}`;
}

function renderSelection(): void {
  const city = selectedCity();
  const unit = selectedUnit();
  if (city) return renderCity(city);
  if (unit) return renderUnit(unit);
  const waiting = state.units.filter(needsOrders).length;
  selectionPanel.innerHTML =
    `<h2>Výběr</h2><p class="facts">` +
    (waiting > 0
      ? `Na rozkaz ${plural(waiting, "čeká", "čekají", "čeká")} ${waiting} ${plural(waiting, "jednotka", "jednotky", "jednotek")}. Stiskni <kbd>N</kbd> nebo klikni na jednotku.`
      : `Všechny jednotky mají rozkazy. Ukonči tah klávesou <kbd>Enter</kbd>.`) +
    `</p>`;
}

function renderUnit(unit: Unit): void {
  const rule = UNIT_TYPES[unit.type];
  const terrain = state.map.terrain[unit.y * state.map.width + unit.x]!;
  const left = unit.movesLeft / RULES.movesFraction;
  const moves = `${Number.isInteger(left) ? left : left.toFixed(1).replace(".", ",")} z ${rule.moves}`;
  let status = "";
  if (unit.work) {
    const need = IMPROVEMENTS[unit.work.improvement].turns[terrain] ?? 0;
    status = `Staví: ${IMPROVEMENTS[unit.work.improvement].name.toLowerCase()}, hotovo za ${turnsText(need - unit.work.progress)}.`;
  } else if (unit.goto) {
    const turns = routeTo(unit, unit.goto).turns;
    status = `Míří na políčko [${unit.goto.x}, ${unit.goto.y}]` + (turns ? `, ${turns === 1 ? "dojde v tomhle tahu" : `dojde za ${turnsText(turns)}`}.` : ".");
  }
  else if (unit.fortified) status = "Opevněná.";

  const buttons: string[] = [];
  const button = (action: string, label: string, key: string, error: string | null) =>
    buttons.push(
      `<button type="button" data-action="${action}" ${error ? `disabled title="${escapeHtml(error)}"` : ""}>${label}<kbd>${key}</kbd></button>`,
    );

  if (rule.foundsCity) {
    const err = canFoundCity(state, unit);
    button("found", "Založit město", "B", err ? ERROR_TEXT[err] : null);
  }
  if (rule.buildsImprovements) {
    const keys: Record<ImprovementId, string> = { road: "R", irrigation: "I", mine: "M" };
    for (const imp of ["road", "irrigation", "mine"] as ImprovementId[]) {
      const err = canBuildImprovement(state, unit, imp);
      const turns = IMPROVEMENTS[imp].turns[terrain];
      const label = turns ? `${IMPROVEMENTS[imp].name} (${turnsText(turns)})` : IMPROVEMENTS[imp].name;
      button(`build:${imp}`, label, keys[imp], err ? ERROR_TEXT[err] : null);
    }
  } else {
    button("fortify", "Opevnit", "F", unit.fortified ? "Jednotka už je opevněná." : null);
  }
  button("skip", "Počkat", "mezera", unit.movesLeft > 0 ? null : "Jednotka už nemá pohyb.");
  if (unit.goto || unit.work || unit.fortified) button("cancel", "Zrušit rozkaz", "C", null);
  button("next", "Další jednotka", "N", null);

  const home = unit.homeCity !== null ? state.cities.find((c) => c.id === unit.homeCity)?.name : undefined;
  selectionPanel.innerHTML = `
    <div class="panel-title"><h3>${rule.name}</h3><span class="sub">[${unit.x}, ${unit.y}] ${TERRAINS[terrain].name}</span></div>
    <p class="facts">Pohyb: ${moves}${home ? ` · domov: ${escapeHtml(home)}` : ""}<br>
    <span class="muted">${status || "Klikni na mapu, kam má jít."}</span></p>
    <div class="actions">${buttons.join("")}</div>`;

  selectionPanel.querySelectorAll<HTMLButtonElement>("button[data-action]").forEach((b) =>
    b.addEventListener("click", () => doUnitAction(b.dataset.action!)),
  );
}

function doUnitAction(action: string): void {
  const unit = selectedUnit();
  if (action === "next") {
    selectNextUnit();
    return refresh();
  }
  if (!unit) return;
  if (action === "found") return unitAction({ type: "foundCity", unitId: unit.id });
  if (action === "fortify") return unitAction({ type: "fortify", unitId: unit.id });
  if (action === "skip") return unitAction({ type: "skipTurn", unitId: unit.id });
  if (action === "cancel") {
    run({ type: "cancelOrders", unitId: unit.id });
    return refresh();
  }
  if (action.startsWith("build:")) {
    return unitAction({ type: "buildImprovement", unitId: unit.id, improvement: action.slice(6) as ImprovementId });
  }
}

function renderCity(city: City): void {
  const r = cityReport(state, city);
  const cost = productionCost(city.production);
  const foodPct = Math.min(100, (city.food / r.growthThreshold) * 100);
  const prodPct = Math.min(100, (city.shields / cost) * 100);
  const growth =
    r.foodSurplus > 0 ? `roste za ${turnsText(r.turnsToGrow!)}` : r.foodSurplus === 0 ? "neroste" : "hladoví";
  const done = r.waitingForSize
    ? "čeká na druhého obyvatele"
    : r.turnsToComplete
      ? `hotovo za ${turnsText(r.turnsToComplete)}`
      : "nevyrábí";
  const options = productionOptions(city)
    .map((o) => {
      const selected = sameItem(o, city.production) ? "selected" : "";
      return `<option value="${o.kind}:${o.id}" ${selected}>${productionName(o)} (${productionCost(o)} štítů)</option>`;
    })
    .join("");
  const unitsHere = state.units.filter((u) => u.x === city.x && u.y === city.y && u.owner === HUMAN);
  const buildings = city.buildings.map((b) => BUILDINGS[b].name).join(", ") || "žádné";
  const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

  selectionPanel.innerHTML = `
    <div class="panel-title"><h3>${escapeHtml(city.name)}</h3><span class="sub">velikost ${city.size}</span></div>
    <p class="facts">Jídlo ${city.food} z ${r.growthThreshold} (${signed(r.foodSurplus)} za tah), ${growth}</p>
    <div class="bar food"><div style="width:${foodPct}%"></div></div>
    <p class="facts">${productionName(city.production)}: ${city.shields} z ${cost} (${signed(r.shieldSurplus)} za tah), ${done}</p>
    <div class="bar prod"><div style="width:${prodPct}%"></div></div>
    <label for="production">Co stavět</label>
    <select id="production">${options}</select>
    <p class="facts" style="margin-top:8px">Obchod: ${r.production.trade}<br><span class="muted">Budovy: ${buildings}</span><br>
    <span class="muted">Obyvatelé obdělávají políčka orámovaná na mapě.</span></p>
    ${
      unitsHere.length
        ? `<h2>Jednotky ve městě</h2><ul class="unit-list">${unitsHere
            .map(
              (u) =>
                `<li>${UNIT_TYPES[u.type].name}${u.fortified ? " (opevněný)" : ""}<button type="button" data-unit="${u.id}">Vybrat</button></li>`,
            )
            .join("")}</ul>`
        : ""
    }
    <div class="actions" style="margin-top:10px"><button type="button" data-close>Zavřít <kbd>Esc</kbd></button></div>`;

  selectionPanel.querySelector<HTMLSelectElement>("#production")!.addEventListener("change", (e) => {
    const [kind, id] = (e.target as HTMLSelectElement).value.split(":");
    run({ type: "setProduction", cityId: city.id, item: { kind, id } as ProductionItem });
    refresh();
  });
  selectionPanel.querySelectorAll<HTMLButtonElement>("button[data-unit]").forEach((b) =>
    b.addEventListener("click", () => {
      selectedUnitId = Number(b.dataset.unit);
      selectedCityId = null;
      refresh();
    }),
  );
  selectionPanel.querySelector("button[data-close]")?.addEventListener("click", closeCity);
}

function closeCity(): void {
  selectedCityId = null;
  selectNextUnit();
  refresh();
}

// ---------- input ----------

function tileFromEvent(e: MouseEvent): Point | null {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE);
  const y = Math.floor((e.clientY - rect.top) / TILE);
  if (x < 0 || y < 0 || x >= state.map.width || y >= state.map.height) return null;
  return { x, y };
}

canvas.addEventListener("click", (e) => {
  const p = tileFromEvent(e);
  if (!p) return;
  const unit = selectedUnit();
  const myCity = state.cities.find((c) => c.x === p.x && c.y === p.y && c.owner === HUMAN);
  const myUnits = state.units.filter((u) => u.x === p.x && u.y === p.y && u.owner === HUMAN);

  // A selected unit steps onto any neighbouring tile, including own cities.
  if (unit && distance(unit, p) === 1) return moveSelected(p);
  if (myCity) {
    selectedCityId = myCity.id;
    selectedUnitId = null;
    return refresh();
  }
  if (myUnits.length > 0) {
    // Repeated clicks cycle through a stack.
    const current = myUnits.findIndex((u) => u.id === selectedUnitId);
    const pick = myUnits.find((u, i) => i > current && needsOrders(u)) ?? myUnits[(current + 1) % myUnits.length]!;
    selectedUnitId = pick.id;
    selectedCityId = null;
    return refresh();
  }
  if (unit) return moveSelected(p);
  selectedCityId = null;
  refresh();
});

canvas.addEventListener("mousemove", (e) => {
  const p = tileFromEvent(e);
  if (!p) {
    tooltip.hidden = true;
    return;
  }
  const i = p.y * state.map.width + p.x;
  const known = showAllBox.checked || state.players[HUMAN]!.explored[i] === 1;
  const t = state.map.terrain[i]!;
  if (!known) {
    tooltip.textContent = `[${p.x}, ${p.y}] neprozkoumáno`;
  } else {
    const city = state.cities.find((c) => c.x === p.x && c.y === p.y);
    const y = tileYield(state.map, i, city !== undefined);
    const extras = [
      state.map.road[i] ? "cesta" : "",
      state.map.irrigation[i] ? "zavlažování" : "",
      state.map.mine[i] ? "důl" : "",
    ].filter(Boolean);
    const r = TERRAINS[t];
    tooltip.innerHTML =
      `<b>${city ? escapeHtml(city.name) + " · " : ""}${r.name}</b> [${p.x}, ${p.y}]<br>` +
      `jídlo ${y.food} · štíty ${y.shields} · obchod ${y.trade}` +
      (extras.length ? `<br>${extras.join(", ")}` : "") +
      (r.land ? `<br>pohyb ${r.moveCost}${r.defenseBonus ? ` · obrana +${r.defenseBonus} %` : ""}` : "");
  }
  // Highlight the target and redraw only when the tile under the mouse changes.
  if (!hoverTile || hoverTile.x !== p.x || hoverTile.y !== p.y) {
    hoverTile = p;
    hoverRouteText = "";
    const unit = selectedUnit();
    if (unit && clickWouldMove(unit, p)) hoverRouteText = routeText(routeTo(unit, p));
    draw(ctx, buildDrawInput());
  }
  if (hoverRouteText) tooltip.insertAdjacentHTML("beforeend", `<br><span class="route">${hoverRouteText}</span>`);

  tooltip.hidden = false;
  const rect = canvas.getBoundingClientRect();
  tooltip.style.left = `${Math.min(e.clientX - rect.left + 14, rect.width - tooltip.offsetWidth - 4)}px`;
  tooltip.style.top = `${Math.min(e.clientY - rect.top + 14, rect.height - tooltip.offsetHeight - 4)}px`;
});

canvas.addEventListener("mouseleave", () => {
  tooltip.hidden = true;
  if (hoverTile) {
    hoverTile = null;
    draw(ctx, buildDrawInput());
  }
});

const DIRECTIONS: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  "1": { x: -1, y: 1 },
  "2": { x: 0, y: 1 },
  "3": { x: 1, y: 1 },
  "4": { x: -1, y: 0 },
  "6": { x: 1, y: 0 },
  "7": { x: -1, y: -1 },
  "8": { x: 0, y: -1 },
  "9": { x: 1, y: -1 },
};

const KEY_ACTIONS: Record<string, string> = {
  b: "found",
  r: "build:road",
  i: "build:irrigation",
  m: "build:mine",
  f: "fortify",
  " ": "skip",
  c: "cancel",
  n: "next",
};

document.addEventListener("keydown", (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const unit = selectedUnit();
  const dir = DIRECTIONS[e.key];
  if (dir && unit) {
    e.preventDefault();
    return moveSelected({ x: unit.x + dir.x, y: unit.y + dir.y });
  }
  const action = KEY_ACTIONS[e.key.toLowerCase()];
  if (action) {
    e.preventDefault();
    return doUnitAction(action);
  }
  if (e.key === "Enter") {
    e.preventDefault();
    return endTurn();
  }
  if (e.key === "Escape") {
    if (selectedCityId !== null) return closeCity();
    selectedUnitId = null;
    refresh();
  }
});

endTurnButton.addEventListener("click", endTurn);
showAllBox.addEventListener("change", refresh);

let confirmTimer: number | undefined;
newGameButton.addEventListener("click", () => {
  if (newGameButton.dataset.confirm !== "1") {
    newGameButton.dataset.confirm = "1";
    newGameButton.textContent = "Opravdu?";
    confirmTimer = window.setTimeout(() => {
      newGameButton.dataset.confirm = "";
      newGameButton.textContent = "Nová hra";
    }, 3000);
    return;
  }
  window.clearTimeout(confirmTimer);
  newGameButton.dataset.confirm = "";
  newGameButton.textContent = "Nová hra";
  startNewGame(seedInput.value.trim() || randomSeed());
  seedInput.value = "";
});

// ---------- start ----------

if (load()) {
  ctx = setupCanvas(canvas, state.map.width, state.map.height);
  selectNextUnit();
  refresh();
} else {
  startNewGame(randomSeed());
}
