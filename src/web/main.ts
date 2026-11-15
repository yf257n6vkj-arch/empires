/**
 * The playable page: draws the human player's view and turns clicks and keys
 * into the same commands the AI will use.
 */
import {
  applyCommand,
  buildingUpkeep,
  canOpenTradeRoute,
  canUpgrade,
  CIVS,
  disbandShields,
  upgradeCost,
  upgradeTarget,
  GOVERNMENTS,
  inciteCost,
  knowsTech,
  shipWithRoom,
  type DiplomatAction,
  BUILDINGS,
  buyCost,
  canBuildImprovement,
  canFoundCity,
  cityRadiusTiles,
  cityReport,
  cityTileYield,
  distance,
  findPath,
  IMPROVEMENTS,
  migrateState,
  newGame,
  passComputerTurns,
  planPath,
  playerView,
  productionCost,
  productionName,
  productionOptions,
  researchableTechs,
  researchCost,
  RULES,
  sameItem,
  STATE_VERSION,
  TECHS,
  TERRAINS,
  tileYield,
  UNIT_TYPES,
  type City,
  type CivId,
  type Command,
  type GameEvent,
  type GameState,
  type ImprovementId,
  type Point,
  type ProductionItem,
  type TechId,
  type Unit,
} from "../core";
import {
  DEFAULT_CAMERA,
  keepInView,
  MAX_ZOOM,
  panBy,
  screenToTile,
  zoomAt,
  ZOOM_STEP,
  type Camera,
} from "./camera";
import { draw, setPlayerColors, setSprites, setupCanvas, tileSize, type DrawInput } from "./render";
import { ERROR_TEXT, escapeHtml, eventText } from "./texts";
import { createTechTree, unlockNames } from "./techTree";
import { techIconSvg } from "./techIcons";
import { createCityScreen } from "./cityScreen";
import { createEmpireDialogs } from "./empire";
import { createCodex, entryKey } from "./codex";
import { createNewGameDialog } from "./newGame";

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
const seedLabel = $<HTMLElement>("#seed-label");
const newGameButton = $<HTMLButtonElement>("#new-game");
const showAllBox = $<HTMLInputElement>("#show-all");
const researchButton = $<HTMLButtonElement>("#research");
const goldLabel = $<HTMLSpanElement>("#gold");
const rateInput = $<HTMLInputElement>("#rate");
const rateLabel = $<HTMLSpanElement>("#rate-label");
const researchPanel = $<HTMLElement>("#research-pick");
const zoomInButton = $<HTMLButtonElement>("#zoom-in");
const zoomOutButton = $<HTMLButtonElement>("#zoom-out");
const zoomResetButton = $<HTMLButtonElement>("#zoom-reset");
const governmentButton = $<HTMLButtonElement>("#government");
const spaceshipButton = $<HTMLButtonElement>("#spaceship");

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
let camera: Camera = DEFAULT_CAMERA;
/** Selected unit and its position when the view last followed it. */
let followed = "";
/** A missile waiting for the player to click its target. */
let targetingUnitId: number | null = null;
/** Unit whose "Rozpustit" button was pressed once and now asks for confirmation. */
let disbandConfirmUnitId: number | null = null;

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
    const data = JSON.parse(raw) as { version: number; state: Record<string, unknown>; log: LogEntry[] };
    const loaded = migrateState(data.state);
    if (!loaded) return false;
    state = loaded;
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

function startNewGame(seed: string, civ?: CivId): void {
  state = newGame({ seed, playerCount: PLAYER_COUNT, civ });
  const nation = CIVS[state.players[HUMAN]!.civ];
  const rivals = state.players.filter((p) => p.id !== HUMAN).map((p) => p.name).join(", ");
  log = [
    {
      turn: 1,
      text: `Jsi ${nation.leader} a vedeš ${nation.adjective.slice(0, -1)}ou říši. Na kontinentu žijí i ${rivals}. Najdi osadníkem dobré místo a založ hlavní město (klávesa B). Bude se jmenovat ${nation.cities[0]}.`,
    },
  ];
  selectedCityId = null;
  selectedUnitId = null;
  targetingUnitId = null;
  empire.resetVictory();
  camera = DEFAULT_CAMERA;
  updateZoomButtons();
  selectNextUnit();
  save();
  ctx = setupCanvas(canvas, state.map.width, state.map.height, fitTileSize());
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
    railroad: showAll ? state.map.railroad : view.railroad,
    fortress: showAll ? state.map.fortress : view.fortress,
    units: view.units.map((u) => ({
      id: u.id,
      owner: u.owner,
      type: u.type,
      x: u.x,
      y: u.y,
      fortified: u.fortified,
      working: u.work !== null,
      workProgress: u.work ? workShare(u) : undefined,
      hasMoves: needsOrders(u),
    })),
    cities: [...view.cities, ...view.foreignCities].map((c) => ({
      id: c.id,
      owner: c.owner,
      name: c.name,
      x: c.x,
      y: c.y,
      size: c.size,
      walls: c.buildings.includes("walls"),
    })),
    starts: showAll ? state.players.slice(1).map((p) => ({ point: p.start, playerId: p.id })) : [],
    selectedUnitId,
    selectedCityId,
    territory: territoryOf(view.cities),
    highlight: city ? city.worked : [],
    path: route?.path ?? undefined,
    pathTurns: route?.stepTurns,
    target: route ? { point: route.target, turns: route.turns } : null,
    camera,
  };
}

/** Share of a settler's current improvement that is done, 0..1. */
function workShare(u: Unit): number {
  if (!u.work) return 0;
  const terrain = state.map.terrain[u.y * state.map.width + u.x]!;
  const need = IMPROVEMENTS[u.work.improvement].turns[terrain] ?? 1;
  return u.work.progress / need;
}

/** Largest tile size that fits the map next to the side panel in the current window. */
function fitTileSize(): number {
  const panel = 290 + 16 + 34;
  const header = 84;
  const byWidth = (window.innerWidth - panel) / state.map.width;
  const byHeight = (window.innerHeight - header) / state.map.height;
  return Math.max(20, Math.min(44, Math.floor(Math.min(byWidth, byHeight))));
}

let resizeTimer: number | undefined;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    const tile = fitTileSize();
    if (tile !== tileSize()) {
      ctx = setupCanvas(canvas, state.map.width, state.map.height, tile);
      refresh();
    }
  }, 150);
});

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

/** When zoomed in, scrolls the map so the selected unit stays in view after it moves or changes. */
function followSelection(): void {
  const unit = selectedUnit();
  const key = unit ? `${unit.id}:${unit.x}:${unit.y}` : "";
  if (key === followed) return;
  followed = key;
  if (unit) camera = keepInView(camera, unit, state.map);
}

function refresh(): void {
  setPlayerColors(state.players.map((p) => CIVS[p.civ].color));
  followSelection();
  // The selection or the units may have changed, so the hovered route is computed again.
  if (hoverTile) {
    const unit = selectedUnit();
    hoverRouteText = unit && clickWouldMove(unit, hoverTile) ? routeText(routeTo(unit, hoverTile)) : "";
  }
  draw(ctx, buildDrawInput());
  turnLabel.textContent = `Tah ${state.turn} z ${RULES.maxTurns}`;
  seedLabel.textContent = state.seed;
  const waiting = state.units.some(needsOrders);
  const choose = needsResearchChoice();
  endTurnButton.classList.toggle("ready", !waiting && !choose);
  renderEconomy();
  renderResearchPick();
  renderSelection();
  renderLog();
  techTree.refresh();
  cityScreen.refresh();
}

// ---------- economy and research ----------

function me() {
  return state.players[HUMAN]!;
}

/** Science and gold the empire collects next turn, after building upkeep. */
function empireTotals(): { science: number; gold: number; upkeep: number } {
  let science = 0;
  let gold = 0;
  for (const c of state.cities) {
    if (c.owner !== HUMAN) continue;
    const r = cityReport(state, c);
    science += r.science;
    gold += r.gold;
  }
  return { science, gold, upkeep: buildingUpkeep(state, HUMAN) };
}

function needsResearchChoice(): boolean {
  return me().researching === null && researchableTechs(me()).length > 0;
}

function renderEconomy(): void {
  const p = me();
  const t = empireTotals();
  const net = t.gold - t.upkeep;
  goldLabel.innerHTML = `Zlato <b>${p.gold}</b> <span class="${net < 0 ? "neg" : "muted"}">(${net >= 0 ? "+" : ""}${net} za tah)</span>`;
  goldLabel.title = `Příjem ${t.gold}, údržba budov ${t.upkeep}`;
  const cost = researchCost(p);
  if (p.researching) {
    const left = Math.max(0, cost - p.research);
    const turns = t.science > 0 ? turnsText(Math.max(1, Math.ceil(left / t.science))) : "nikdy";
    researchButton.innerHTML = `Výzkum: <b>${TECHS[p.researching].name}</b> <span class="muted">${Math.min(p.research, cost)}/${cost} · ${turns}</span>`;
    researchButton.classList.remove("attention");
  } else if (researchableTechs(p).length > 0) {
    researchButton.innerHTML = `<b>Vyber výzkum</b> <span class="muted">${p.research}/${cost}</span>`;
    researchButton.classList.add("attention");
  } else {
    researchButton.innerHTML = `Všechno je vyzkoumané`;
    researchButton.classList.remove("attention");
  }
  const gov = GOVERNMENTS[p.government];
  rateInput.disabled = gov.maxRate === 0;
  if (gov.maxRate > 0) {
    rateInput.min = String(100 - gov.maxRate);
    rateInput.max = String(gov.maxRate);
  }
  rateInput.value = String(p.scienceRate);
  rateLabel.textContent = gov.maxRate === 0 ? "anarchie: nic" : `${p.scienceRate} % · zlato ${100 - p.scienceRate} %`;
  governmentButton.innerHTML = p.revolution
    ? `Vláda: <b>Anarchie</b> <span class="muted">${GOVERNMENTS[p.revolution.target].name} za ${turnsText(p.revolution.turnsLeft)}</span>`
    : `Vláda: <b>${gov.name}</b>`;
  const ship = p.spaceship;
  const apollo = state.cities.some((c) => c.buildings.includes("apolloProgram"));
  spaceshipButton.hidden = !apollo && ship.structural + ship.component + ship.module === 0 && !state.players.some((x) => x.spaceship.arrivalTurn !== null);
  spaceshipButton.innerHTML =
    ship.arrivalTurn !== null ? `Loď letí, přistání v tahu <b>${ship.arrivalTurn}</b>` : `Vesmírná loď <span class="muted">${ship.structural}/${ship.component}/${ship.module}</span>`;
  empire.checkVictory();
}

const empire = createEmpireDialogs($<HTMLDialogElement>("#empire-dialog"), {
  state: () => state,
  player: () => HUMAN,
  run,
  refresh,
  openEntry: (key) => codex.show(key),
});
governmentButton.addEventListener("click", () => empire.openGovernment());
const codex = createCodex($<HTMLDialogElement>("#codex-dialog"), { openTech: (t) => techTree.openPage(t) });
$<HTMLButtonElement>("#codex").addEventListener("click", () => codex.open());
const newGameDialog = createNewGameDialog($<HTMLDialogElement>("#new-game-dialog"), {
  start: (seed, civ) => startNewGame(seed, civ),
  randomSeed,
  showNation: (civ) => codex.show(entryKey("civ", civ)),
});
spaceshipButton.addEventListener("click", () => empire.openSpaceship());

function chooseResearch(tech: TechId): void {
  if (run({ type: "setResearch", tech })) say(`Zkoumáme: ${TECHS[tech].name}.`);
  refresh();
}

function chooseGoal(tech: TechId): void {
  if (run({ type: "setResearchGoal", tech })) {
    const p = me();
    say(p.researchGoal ? `Míříme k objevu ${TECHS[tech].name}, teď zkoumáme ${TECHS[p.researching!].name}.` : `Zkoumáme: ${TECHS[tech].name}.`);
  }
  refresh();
}

const techTree = createTechTree({
  me,
  sciencePerTurn: () => empireTotals().science,
  chooseResearch,
  chooseGoal,
  openEntry: (kind, id) => codex.show(entryKey(kind, id)),
});

function renderResearchPick(): void {
  if (!needsResearchChoice()) {
    researchPanel.hidden = true;
    return;
  }
  researchPanel.hidden = false;
  const options = researchableTechs(me())
    .sort((a, b) => TECHS[a].era - TECHS[b].era)
    .map((t) => {
      const what = unlockNames(t);
      return `<div class="tech-pick-row"><button type="button" class="tech-pick" data-tech="${t}">${techIconSvg(t, TECHS[t].era, 34)}<span><b>${TECHS[t].name}</b><span>${escapeHtml(what.join(", ") || "otevře další technologie")}</span></span></button><button type="button" class="tech-info" data-info="${t}" title="Přečíst si o téhle technologii">?</button></div>`;
    })
    .join("");
  researchPanel.innerHTML = `<h2>Vyber výzkum</h2><div class="tech-picks">${options}</div>
    <button type="button" class="wide" data-tree>Ukázat celý strom technologií</button>`;
  researchPanel.querySelectorAll<HTMLButtonElement>("button[data-tech]").forEach((b) =>
    b.addEventListener("click", () => chooseResearch(b.dataset.tech as TechId)),
  );
  researchPanel.querySelectorAll<HTMLButtonElement>("button[data-info]").forEach((b) =>
    b.addEventListener("click", () => techTree.openPage(b.dataset.info as TechId)),
  );
  researchPanel.querySelector("button[data-tree]")?.addEventListener("click", techTree.open);
}

researchButton.addEventListener("click", techTree.open);

const cityScreen = createCityScreen({
  state: () => state,
  run,
  refresh,
  selectUnit: (id) => {
    selectedUnitId = id;
    selectedCityId = null;
    refresh();
  },
  drawInput: () => buildDrawInput(),
  say,
  openEntry: (key) => codex.show(key),
});

function cityScreenOpen(): boolean {
  return cityScreen.isOpen();
}
rateInput.addEventListener("input", () => {
  run({ type: "setScienceRate", rate: Number(rateInput.value) });
  refresh();
});

function renderLog(): void {
  logList.innerHTML = log
    .map((e) => `<li><span class="t">${e.turn}.</span>${escapeHtml(e.text)}</li>`)
    .join("");
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
  if (unit.carriedBy !== null) {
    const ship = state.units.find((u) => u.id === unit.carriedBy);
    status = `Je na palubě: ${ship ? UNIT_TYPES[ship.type].name : "loď"}. ${rule.domain === "land" ? "Vystoupí krokem na pevninu." : ""}` + (status ? ` ${status}` : "");
  }
  if (rule.capacity) {
    const cargo = state.units.filter((u) => u.carriedBy === unit.id).length;
    status = `Na palubě ${cargo} z ${rule.capacity}. ` + status;
  }
  if (rule.domain === "air" && rule.fuel) {
    const left = rule.fuel - unit.turnsAloft;
    status = `Palivo ještě na ${left === 1 ? "tento tah" : `${left} tahy`}, pak musí přistát ve městě nebo na letadlové lodi. ` + status;
  }

  const buttons: string[] = [];
  const button = (action: string, label: string, key: string, error: string | null) =>
    buttons.push(
      `<button type="button" data-action="${action}" ${error ? `disabled title="${escapeHtml(error)}"` : ""}>${label}${key ? `<kbd>${key}</kbd>` : ""}</button>`,
    );

  if (rule.foundsCity) {
    const err = canFoundCity(state, unit);
    button("found", "Založit město", "B", err ? ERROR_TEXT[err] : null);
  }
  if (rule.buildsImprovements) {
    const keys: Record<ImprovementId, string> = { road: "R", irrigation: "I", mine: "M", railroad: "Z", fortress: "P" };
    for (const imp of ["road", "irrigation", "mine", "railroad", "fortress"] as ImprovementId[]) {
      const needs = IMPROVEMENTS[imp].requires;
      if (needs && !knowsTech(me(), needs)) continue;
      const err = canBuildImprovement(state, unit, imp);
      const turns = IMPROVEMENTS[imp].turns[terrain];
      const label = turns ? `${IMPROVEMENTS[imp].name} (${turnsText(turns)})` : IMPROVEMENTS[imp].name;
      button(`build:${imp}`, label, keys[imp], err ? ERROR_TEXT[err] : null);
    }
  } else if (rule.domain === "land") {
    button("fortify", "Opevnit", "F", unit.fortified ? "Jednotka už je opevněná." : null);
  }
  const here = state.cities.find((c) => c.x === unit.x && c.y === unit.y);
  if (rule.domain !== "sea" && here && unit.carriedBy === null && state.units.some((u) => u.x === unit.x && u.y === unit.y && UNIT_TYPES[u.type].capacity)) {
    button("board", "Nalodit", "L", shipWithRoom(state, unit, unit) ? null : ERROR_TEXT.noShip);
  }
  const near = state.cities.filter((c) => distance(c, unit) <= 1);
  if (rule.special === "caravan") {
    const wonder = here && here.owner === HUMAN && here.production.kind === "building" && BUILDINGS[here.production.id].wonder;
    button("help", "Pomoct se stavbou divu", "H", wonder ? null : ERROR_TEXT.notBuildingWonder);
    for (const c of near) {
      const err = canOpenTradeRoute(state, unit, c.id);
      if (c.id !== unit.homeCity) button(`route:${c.id}`, `Obchodní cesta: ${escapeHtml(c.name)}`, "", err ? ERROR_TEXT[err] : null);
    }
  }
  if (rule.special === "diplomat") {
    for (const c of near.filter((x) => x.owner !== HUMAN)) {
      const price = inciteCost(state, c);
      button(`dip:embassy:${c.id}`, `Velvyslanectví: ${escapeHtml(c.name)}`, "", me().embassies.includes(c.owner) ? ERROR_TEXT.embassyExists : null);
      button(`dip:stealTech:${c.id}`, "Ukrást technologii", "", c.stolenBy.includes(HUMAN) ? ERROR_TEXT.alreadyStolen : null);
      button(`dip:sabotage:${c.id}`, "Sabotáž", "", null);
      button(`dip:incite:${c.id}`, `Podplatit město (${price} zlata)`, "", c.buildings.includes("palace") ? ERROR_TEXT.isCapital : me().gold < price ? ERROR_TEXT.notEnoughGold : null);
    }
  }
  if (rule.special === "nuclear") {
    button("aim", targetingUnitId === unit.id ? "Klikni na cíl na mapě" : "Zamířit a odpálit", "X", unit.movesLeft > 0 ? null : ERROR_TEXT.noMovesLeft);
  }
  button("skip", "Počkat", "mezera", unit.movesLeft > 0 ? null : "Jednotka už nemá pohyb.");
  if (unit.goto || unit.work || unit.fortified) button("cancel", "Zrušit rozkaz", "C", null);
  const upgradeTo = upgradeTarget(me(), unit.type);
  if (upgradeTo) {
    const err = canUpgrade(state, unit);
    button("upgrade", `Povýšit: ${UNIT_TYPES[upgradeTo].name} (${upgradeCost(unit.type, upgradeTo)} zlata)`, "U", err ? ERROR_TEXT[err] : null);
  }
  const ownCity = here && here.owner === HUMAN;
  const disbandLabel =
    disbandConfirmUnitId === unit.id
      ? "Opravdu rozpustit?"
      : ownCity
        ? `Rozpustit (+${disbandShields(unit.type)} štítů do výroby)`
        : "Rozpustit";
  button("disband", disbandLabel, "D", null);
  button("next", "Další jednotka", "N", null);

  const home = unit.homeCity !== null ? state.cities.find((c) => c.id === unit.homeCity)?.name : undefined;
  selectionPanel.innerHTML = `
    <div class="panel-title"><h3><button type="button" class="linklike" data-codex="${entryKey("unit", unit.type)}" title="Co je to za jednotku? (klávesa E)">${rule.name}</button></h3><span class="sub">[${unit.x}, ${unit.y}] ${TERRAINS[terrain].name}</span></div>
    <p class="facts">Pohyb: ${moves}${home ? ` · domov: ${escapeHtml(home)}` : ""}<br>
    <span class="muted">${status || "Klikni na mapu, kam má jít."}</span></p>
    <div class="actions">${buttons.join("")}</div>`;

  selectionPanel.querySelectorAll<HTMLButtonElement>("button[data-action]").forEach((b) =>
    b.addEventListener("click", () => doUnitAction(b.dataset.action!)),
  );
  selectionPanel.querySelector<HTMLButtonElement>("[data-codex]")?.addEventListener("click", (e) => codex.show((e.currentTarget as HTMLElement).dataset.codex!));
}

function doUnitAction(action: string): void {
  const unit = selectedUnit();
  if (action !== "disband") disbandConfirmUnitId = null;
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
  if (action === "board") return unitAction({ type: "board", unitId: unit.id });
  if (action === "upgrade") {
    run({ type: "upgrade", unitId: unit.id });
    return refresh();
  }
  if (action === "disband") {
    // Disbanding cannot be undone, so the first press only asks.
    if (disbandConfirmUnitId !== unit.id) {
      disbandConfirmUnitId = unit.id;
      return refresh();
    }
    disbandConfirmUnitId = null;
    if (run({ type: "disband", unitId: unit.id })) {
      selectedUnitId = null;
      selectNextUnit();
    }
    return refresh();
  }
  if (action === "help") return unitAction({ type: "helpWonder", unitId: unit.id });
  if (action.startsWith("route:")) return unitAction({ type: "tradeRoute", unitId: unit.id, cityId: Number(action.slice(6)) });
  if (action.startsWith("dip:")) {
    const [, what, city] = action.split(":");
    return unitAction({ type: "diplomat", unitId: unit.id, cityId: Number(city), action: what as DiplomatAction });
  }
  if (action === "aim") {
    if (UNIT_TYPES[unit.type].special !== "nuclear") return;
    targetingUnitId = targetingUnitId === unit.id ? null : unit.id;
    say(targetingUnitId ? "Klikni na políčko, kam má raketa dopadnout. Esc zamíření zruší." : "");
    return refresh();
  }
}

function renderCity(city: City): void {
  const r = cityReport(state, city);
  const cost = productionCost(city.production);
  const foodPct = Math.min(100, (city.food / r.growthThreshold) * 100);
  const prodPct = Math.min(100, (city.shields / cost) * 100);
  const growth =
    city.size >= r.maxSize && r.foodSurplus > 0
      ? "dál neroste, potřebuje akvadukt"
      : r.foodSurplus > 0
        ? `roste za ${turnsText(r.turnsToGrow!)}`
        : r.foodSurplus === 0
          ? "neroste"
          : "hladoví";
  const done = r.waitingForSize
    ? "čeká na druhého obyvatele"
    : city.shields >= cost
      ? "hotovo na konci tahu"
      : r.turnsToComplete
        ? `hotovo za ${turnsText(r.turnsToComplete)}`
        : "nevyrábí";
  const options = productionOptions(state, city)
    .map((o) => {
      const selected = sameItem(o, city.production) ? "selected" : "";
      const turns = r.shieldSurplus > 0 ? `, ${turnsText(Math.max(1, Math.ceil((productionCost(o) - city.shields) / r.shieldSurplus)))}` : "";
      const tag = o.kind === "building" && BUILDINGS[o.id].wonder ? "Div: " : "";
      return `<option value="${o.kind}:${o.id}" ${selected}>${tag}${productionName(o)} (${productionCost(o)} štítů${turns})</option>`;
    })
    .join("");
  const unitsHere = state.units.filter((u) => u.x === city.x && u.y === city.y && u.owner === HUMAN);
  const buildings =
    city.buildings.map((b) => (BUILDINGS[b].upkeep ? `${BUILDINGS[b].name} (${BUILDINGS[b].upkeep})` : BUILDINGS[b].name)).join(", ") ||
    "žádné";
  const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
  const h = r.happiness;
  const price = buyCost(city);
  const gold = me().gold;
  const buy =
    price === 0
      ? ""
      : `<button type="button" class="wide" data-buy ${gold < price ? `disabled title="Máš jen ${gold} zlata."` : ""}>Koupit hned za ${price} zlata</button>`;

  selectionPanel.innerHTML = `
    <div class="panel-title"><h3>${escapeHtml(city.name)}</h3><span class="sub">velikost ${city.size}</span></div>
    <p class="facts">Jídlo ${city.food} z ${r.growthThreshold} (${signed(r.foodSurplus)} za tah), ${growth}</p>
    <div class="bar food"><div style="width:${foodPct}%"></div></div>
    <p class="facts">${productionName(city.production)}: ${Math.min(city.shields, cost)} z ${cost} (${signed(r.shieldSurplus)} za tah), ${done}</p>
    <div class="bar prod"><div style="width:${prodPct}%"></div></div>
    <label for="production">Co stavět</label>
    <select id="production">${options}</select>
    ${buy}
    <p class="facts" style="margin-top:8px">${
      h.disorder ? `<span class="neg">Nepokoje! Město nic nevyrábí.</span><br>` : ""
    }Spokojení ${h.content} · nespokojení ${h.unhappy}${h.entertainers ? ` · baviči ${h.entertainers}` : ""}<br>
    Obchod ${r.production.trade}${r.corruption ? `, korupce −${r.corruption}` : ""}: věda ${r.science}, zlato ${r.gold}<br>${
      r.pollution.unhappy ? `<span class="neg">Znečištěný vzduch rozladí ${r.pollution.unhappy} obyvatel.</span><br>` : ""
    }
    <span class="muted">Budovy: ${buildings}</span><br>
    <span class="muted">Obyvatelé obdělávají políčka orámovaná na mapě.${
      h.entertainers ? " Baviči nepracují na poli a udržují ve městě klid." : ""
    }</span></p>
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
    <div class="actions" style="margin-top:10px"><button type="button" data-open-city class="primary">Otevřít město</button><button type="button" data-close>Zavřít <kbd>Esc</kbd></button></div>`;

  selectionPanel.querySelector("button[data-buy]")?.addEventListener("click", () => {
    run({ type: "buy", cityId: city.id });
    refresh();
  });
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
  selectionPanel.querySelector("button[data-open-city]")?.addEventListener("click", () => cityScreen.open(city.id));
}

function closeCity(): void {
  selectedCityId = null;
  selectNextUnit();
  refresh();
}

// ---------- input ----------

function tileFromEvent(e: MouseEvent): Point | null {
  const rect = canvas.getBoundingClientRect();
  const { x, y } = screenToTile(camera, e.clientX - rect.left, e.clientY - rect.top, tileSize());
  if (x < 0 || y < 0 || x >= state.map.width || y >= state.map.height) return null;
  return { x, y };
}

// ---------- zoom and scrolling ----------

function setCamera(next: Camera): void {
  if (next.zoom === camera.zoom && next.x === camera.x && next.y === camera.y) return;
  camera = next;
  hoverTile = null;
  tooltip.hidden = true;
  updateZoomButtons();
  draw(ctx, buildDrawInput());
}

/** Zooms around a point given in CSS pixels on the canvas; the map centre when omitted. */
function zoomTo(zoom: number, px?: number, py?: number): void {
  const t = tileSize();
  const ax = px === undefined ? state.map.width / 2 : px / t;
  const ay = py === undefined ? state.map.height / 2 : py / t;
  setCamera(zoomAt(camera, zoom, ax, ay, state.map));
}

function updateZoomButtons(): void {
  zoomResetButton.textContent = `${Math.round(camera.zoom * 100)} %`;
  zoomInButton.disabled = camera.zoom >= MAX_ZOOM - 1e-6;
  zoomOutButton.disabled = camera.zoom <= 1 + 1e-6;
  zoomResetButton.disabled = camera.zoom <= 1 + 1e-6;
  canvas.classList.toggle("zoomed", camera.zoom > 1 + 1e-6);
}

zoomInButton.addEventListener("click", () => zoomTo(camera.zoom * ZOOM_STEP));
zoomOutButton.addEventListener("click", () => zoomTo(camera.zoom / ZOOM_STEP));
zoomResetButton.addEventListener("click", () => zoomTo(1));

// Trackpad: two fingers move the map, pinching zooms (the browser reports a pinch
// as a wheel event with ctrlKey). Mouse: the wheel moves the map, Ctrl + wheel zooms.
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1;
    if (e.ctrlKey) {
      const factor = Math.exp(-e.deltaY * unit * 0.01);
      zoomTo(camera.zoom * factor, e.clientX - rect.left, e.clientY - rect.top);
      return;
    }
    const px = tileSize() * camera.zoom;
    setCamera(panBy(camera, (e.deltaX * unit) / px, (e.deltaY * unit) / px, state.map));
  },
  { passive: false },
);

// Safari reports trackpad pinching as gesture events instead of wheel events.
interface GestureEvent extends UIEvent {
  scale: number;
  clientX: number;
  clientY: number;
}
let gestureStartZoom = 1;
canvas.addEventListener("gesturestart", (e) => {
  e.preventDefault();
  gestureStartZoom = camera.zoom;
});
canvas.addEventListener("gesturechange", (e) => {
  e.preventDefault();
  const g = e as GestureEvent;
  const rect = canvas.getBoundingClientRect();
  zoomTo(gestureStartZoom * g.scale, g.clientX - rect.left, g.clientY - rect.top);
});

// Dragging with the mouse moves the map; a drag does not count as a click.
const DRAG_THRESHOLD = 5;
let drag: { x: number; y: number; moved: boolean } | null = null;
let suppressClick = false;
canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  drag = { x: e.clientX, y: e.clientY, moved: false };
});
canvas.addEventListener("pointermove", (e) => {
  if (!drag || (e.buttons & 1) === 0) return;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
  if (!drag.moved) {
    drag.moved = true;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("dragging");
  }
  const px = tileSize() * camera.zoom;
  setCamera(panBy(camera, -dx / px, -dy / px, state.map));
  drag.x = e.clientX;
  drag.y = e.clientY;
});
const endDrag = () => {
  if (drag?.moved) suppressClick = true;
  drag = null;
  canvas.classList.remove("dragging");
};
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

canvas.addEventListener("dblclick", (e) => {
  const p = tileFromEvent(e);
  if (!p) return;
  const city = state.cities.find((c) => c.x === p.x && c.y === p.y && c.owner === HUMAN);
  if (city) cityScreen.open(city.id);
});

canvas.addEventListener("click", (e) => {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  const p = tileFromEvent(e);
  if (!p) return;
  const unit = selectedUnit();
  if (targetingUnitId !== null) {
    const missile = targetingUnitId;
    targetingUnitId = null;
    return unitAction({ type: "detonate", unitId: missile, at: p });
  }
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
    const owner = state.cities.find((c) => c.owner === HUMAN && (c.x === p.x && c.y === p.y || c.worked.includes(i)));
    const y = owner ? cityTileYield(state, owner, i) : tileYield(state.map, i, city !== undefined);
    const extras = [
      state.map.road[i] ? "cesta" : "",
      state.map.irrigation[i] ? "zavlažování" : "",
      state.map.mine[i] ? "důl" : "",
      state.map.railroad[i] ? "železnice" : "",
      state.map.fortress[i] ? "pevnost" : "",
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
  z: "build:railroad",
  p: "build:fortress",
  l: "board",
  h: "help",
  u: "upgrade",
  d: "disband",
  x: "aim",
  f: "fortify",
  " ": "skip",
  c: "cancel",
  n: "next",
};

document.addEventListener("keydown", (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (techTree.isOpen() || cityScreenOpen() || empire.isOpen() || codex.isOpen() || newGameDialog.isOpen()) return;
  if (e.key.toLowerCase() === "t") {
    e.preventDefault();
    return techTree.open();
  }
  if (e.key.toLowerCase() === "e") {
    e.preventDefault();
    const unit = selectedUnit();
    return unit ? codex.show(entryKey("unit", unit.type)) : codex.open();
  }
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
  if (e.key === "+" || e.key === "=") {
    e.preventDefault();
    return zoomTo(camera.zoom * ZOOM_STEP);
  }
  if (e.key === "-") {
    e.preventDefault();
    return zoomTo(camera.zoom / ZOOM_STEP);
  }
  if (e.key === "0") {
    e.preventDefault();
    return zoomTo(1);
  }
  if (e.key === "Escape") {
    if (targetingUnitId !== null) {
      targetingUnitId = null;
      say("");
      return refresh();
    }
    if (selectedCityId !== null) return closeCity();
    selectedUnitId = null;
    refresh();
  }
});

endTurnButton.addEventListener("click", endTurn);
showAllBox.addEventListener("change", refresh);

newGameButton.addEventListener("click", () => newGameDialog.open());

// ---------- start ----------

// Graphics trial: painted sprites from Gemini replace the drawn figures of a few units and the cities.
const SPRITES_KEY = "empires.sprites";
const spritesBox = $<HTMLInputElement>("#sprites");
function applySprites(on: boolean): void {
  if (!on) {
    setSprites(new Map());
    refresh();
    return;
  }
  const files = import.meta.glob<string>("./sprites/*.webp", { eager: true, query: "?url", import: "default" });
  const loaded = new Map<string, HTMLImageElement>();
  let pending = Object.keys(files).length;
  const done = () => {
    if (--pending > 0) return;
    setSprites(loaded);
    refresh();
  };
  for (const [path, url] of Object.entries(files)) {
    const img = new Image();
    img.onload = () => {
      loaded.set(path.split("/").pop()!.replace(/\.webp$/, ""), img);
      done();
    };
    img.onerror = done;
    img.src = url;
  }
}
try {
  spritesBox.checked = localStorage.getItem(SPRITES_KEY) === "1" || new URLSearchParams(location.search).has("sprity");
} catch {
  spritesBox.checked = false;
}
spritesBox.addEventListener("change", () => {
  try {
    localStorage.setItem(SPRITES_KEY, spritesBox.checked ? "1" : "0");
  } catch {
    // Storage may be unavailable; the switch still works for this visit.
  }
  applySprites(spritesBox.checked);
});

updateZoomButtons();
if (load()) {
  ctx = setupCanvas(canvas, state.map.width, state.map.height, fitTileSize());
  selectNextUnit();
  refresh();
} else {
  startNewGame(randomSeed());
  newGameDialog.open(true);
}
if (spritesBox.checked) applySprites(true);
