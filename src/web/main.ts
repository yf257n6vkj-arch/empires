/**
 * The playable page: draws the human player's view and turns clicks and keys
 * into the same commands the AI will use.
 */
import "./polyfills";
import {
  DEFAULT_WORLD_CHOICE,
  formatGameCode,
  parseGameCode,
  resolveWorld,
  type WorldChoice,
  applyCommand,
  buildingUpkeep,
  canOpenTradeRoute,
  canUpgrade,
  CIVS,
  currentEra,
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
  canAttack,
  distance,
  visibleTiles,
  findPath,
  fitRates,
  IMPROVEMENTS,
  newGame,
  planPath,
  playerView,
  productionCost,
  productionName,
  productionOptions,
  researchableTechs,
  researchCost,
  RULES,
  sameItem,
  TECHS,
  TERRAINS,
  tileYield,
  UNIT_TYPES,
  canCleanPollution,
  canJoinCity,
  workTurns,
  type City,
  type CivId,
  type BarbarianLevel,
  type Difficulty,
  type Command,
  type GameEvent,
  type GameState,
  type ImprovementId,
  type Point,
  type ProductionItem,
  type TechId,
  type Unit,
  maxTurns,
  type GameSpeed,
} from "../core";
import {
  clampCamera,
  DEFAULT_CAMERA,
  isVisible,
  keepInView,
  centerOn,
  MAX_ZOOM,
  panBy,
  screenToTile,
  zoomAt,
  ZOOM_STEP,
  type Camera,
} from "./camera";
import { PARCHMENT, draw, drawBattle, mapTilt, setPlayerColors, setSprites, setTilt, setupCanvas, tileSize, type BattleFrame, type DrawInput } from "./render";
import { ERROR_TEXT, escapeHtml, eventConcerns, eventText, moodLine } from "./texts";
import { attackHint, createAttackDialog } from "./attack";
import { playComputerTurns } from "../ai";
import { createTechTree, unlockNames } from "./techTree";
import { techIconSvg } from "./techIcons";
import { createCityScreen } from "./cityScreen";
import { createEmpireDialogs } from "./empire";
import { createCodex, entryKey } from "./codex";
import { createNewGameDialog } from "./newGame";
import { loadCityArt } from "./cityView";
import { createMenus } from "./menu";
import { createAdvisor } from "./advisorPanel";
import { createGuide } from "./guide";
import { createNations } from "./nations";
import { createForeignCity } from "./foreignCity";
import { createEndScreen } from "./endScreen";
import { createCitiesOverview } from "./citiesOverview";
import { createCelebration } from "./celebration";
import { payloadOf, readAutosave, writeAutosave, type LogEntry, type SavePayload } from "./saves";
import { t, tn, translatePage } from "./i18n";
import {
  buildingName,
  cityLabel,
  civName,
  governmentName,
  improvementName,
  inSentence,
  leaderName,
  productionLabel,
  realmObject,
  specialName,
  techName,
  terrainName,
  unitName,
} from "./i18n/names";

// The static page is translated before anything reads it.
translatePage(document);

const HUMAN = 0;
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
const mapWrap = $<HTMLDivElement>("#map-wrap");
const minimap = $<HTMLCanvasElement>("#minimap");
const showAllBox = $<HTMLInputElement>("#show-all");
/** The map seen at an angle: a tile is this much shorter than wide, and mountains, trees, cities and units stand up. */
const MAP_TILT = 0.72;
const MAP_VIEW_KEY = "empires.mapView";
const mapViewSelect = $<HTMLSelectElement>("#map-view");
mapViewSelect.value = localStorage.getItem(MAP_VIEW_KEY) === "flat" ? "flat" : "tilted";
setTilt(mapViewSelect.value === "flat" ? 1 : MAP_TILT);
document.body.classList.toggle("map-tilted", mapViewSelect.value !== "flat");
const researchButton = $<HTMLButtonElement>("#research");
const goldLabel = $<HTMLSpanElement>("#gold");
const rateInput = $<HTMLInputElement>("#rate");
const rateLabel = $<HTMLSpanElement>("#rate-label");
const luxInput = $<HTMLInputElement>("#lux");
const luxLabel = $<HTMLSpanElement>("#lux-label");
const taxLabel = $<HTMLSpanElement>("#tax-label");
const researchPanel = $<HTMLElement>("#research-pick");
// The owl's bubble and the panels at the top left keep clear of the bar at the bottom.
new ResizeObserver(() => document.documentElement.style.setProperty("--sel-h", `${selectionPanel.offsetHeight}px`)).observe(selectionPanel);
const zoomInButton = $<HTMLButtonElement>("#zoom-in");
const zoomOutButton = $<HTMLButtonElement>("#zoom-out");
const zoomResetButton = $<HTMLButtonElement>("#zoom-reset");
const governmentButton = $<HTMLButtonElement>("#government");
const warmingLabel = $<HTMLSpanElement>("#warming");
const spaceshipButton = $<HTMLButtonElement>("#spaceship");

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
/** The unit waiting for a click that says where to send it, whatever is on the tile. */
let sendingUnitId: number | null = null;
/** What the click does with it: go there, or build a road or railroad all the way. */
let sendMode: "goto" | "road" | "railroad" = "goto";
/** Unit whose "Rozpustit" button was pressed once and now asks for confirmation. */
let disbandConfirmUnitId: number | null = null;

// ---------- saving ----------

/** Whether a real game is running (the placeholder behind the start screen is never saved). */
let gameStarted = false;
/** Runs after every map drawing; the owl's ring follows the map once the guide exists. */
let afterDraw: () => void = () => {};

function save(): void {
  // Storage may be unavailable (private mode, embedded viewer); the game still works.
  if (gameStarted) writeAutosave(payloadOf(state, log));
}

function useGame(payload: SavePayload): void {
  state = payload.state;
  log = payload.log;
  gameStarted = true;
  selectedCityId = null;
  selectedUnitId = null;
  targetingUnitId = null;
  disbandConfirmUnitId = null;
  endScreen.reset();
  camera = DEFAULT_CAMERA;
  updateZoomButtons();
  ctx = setupCanvas(canvas, state.map.width, state.map.height, fitTileSize());
  selectNextUnit();
  save();
  refresh();
}

function randomSeed(): string {
  const words = t("sever jih řeka hora údolí les zátoka pláň ostrov mys").split(" ");
  // Math.random is fine here: it only picks a seed, the game itself is driven by Rng.
  const w = words[Math.floor(Math.random() * words.length)];
  return `${w}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function startNewGame(input: string, civ?: CivId, choice: WorldChoice = DEFAULT_WORLD_CHOICE, persist = true, barbarians: BarbarianLevel = "few", difficulty: Difficulty = "normal", speed: GameSpeed = "normal"): void {
  // A map code that carries settings wins over the choice in the dialog.
  const parsed = parseGameCode(input);
  const world = parsed.world ?? resolveWorld(choice, parsed.seed);
  const seed = formatGameCode(parsed.seed, world);
  state = newGame({ seed, playerCount: world.opponents + 1, civ, world, opponentUnits: true, barbarians, difficulty, speed });
  const civ0 = state.players[HUMAN]!.civ;
  // The rivals stay unnamed: the player meets them while exploring.
  log = [
    {
      turn: 1,
      text: t("Jsi {leader} a vedeš {realm}. Na kontinentu žijí i jiné národy a poznáš je, až na ně narazíš. Najdi osadníkem dobré místo a založ hlavní město (klávesa B). Bude se jmenovat {capital}.", {
        leader: leaderName(civ0),
        realm: realmObject(civ0),
        capital: cityLabel(CIVS[civ0].cities[0]!),
      }),
    },
  ];
  selectedCityId = null;
  selectedUnitId = null;
  targetingUnitId = null;
  endScreen.reset();
  camera = DEFAULT_CAMERA;
  updateZoomButtons();
  selectNextUnit();
  gameStarted = persist;
  save();
  ctx = setupCanvas(canvas, state.map.width, state.map.height, fitTileSize());
  refresh();
  if (persist && advisor.mode() === "guide") guide.onNewGame();
}

// ---------- commands ----------

function say(text: string): void {
  statusLine.textContent = text;
}

function addLog(events: GameEvent[]): void {
  for (const e of events) {
    if (!eventConcerns(state, e, HUMAN)) continue;
    const text = eventText(state, e);
    if (text) log.unshift({ turn: state.turn, text });
  }
  log = log.slice(0, LOG_LIMIT);
}

function run(command: Command): boolean {
  const before = visiblePositions();
  const result = applyCommand(state, command);
  if (!result.ok) {
    say(ERROR_TEXT[result.error]);
    return false;
  }
  say("");
  state = result.state;
  const events = [...result.events];
  if (command.type === "endTurn") {
    const passed = playComputerTurns(state);
    state = passed.state;
    events.push(...passed.events);
  }
  animateMoves(before);
  queueBattles(events, animation ? animation.duration : 0);
  addLog(events);
  if (advisor.mode() === "guide") guide.onEvents(events);
  // Peace offers from computer players wait for an answer at the start of the turn.
  if (command.type === "endTurn") nations.askOffers();
  // A declaration of war against the player must not slip by in the log.
  const war = events.find((e) => e.type === "warDeclared" && e.on === HUMAN);
  if (war && war.type === "warDeclared") {
    const nation = civName(state.players[war.by]!.civ);
    attackDialog.notice(t("Válka!"), t("{nation} ti vyhlásili válku. Posil obranu měst, hlavně těch, která leží blízko jejich území.", { nation }));
  }
  for (const e of events) {
    if (e.type === "wonderBuilt" && e.owner === HUMAN) {
      const city = state.cities.find((c) => c.id === e.cityId);
      celebration.show(e.building, city ? cityLabel(city.name) : "");
    }
  }
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
  return u.owner === HUMAN && u.movesLeft > 0 && !u.goto && !u.fortified && !u.work && !u.orders;
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
  // A step onto an enemy asks first and shows the chance of winning.
  if (distance(unit, to) === 1 && state.units.some((u) => u.x === to.x && u.y === to.y && u.owner !== unit.owner)) {
    const problem = canAttack(state, unit, to);
    if (problem === "notAtWar") attackDialog.openWar(unit, to);
    else if (!attackDialog.open(unit, to)) {
      say(ERROR_TEXT[problem ?? "cannotAttack"]);
      refresh();
    }
    return;
  }
  const mode = sendingUnitId === unit.id ? sendMode : "goto";
  const ok =
    mode !== "goto"
      ? run({ type: "buildRoute", unitId: unit.id, to, improvement: mode })
      : distance(unit, to) === 1
        ? run({ type: "move", unitId: unit.id, to })
        : run({ type: "goto", unitId: unit.id, to });
  sendingUnitId = null;
  sendMode = "goto";
  if (ok && mode !== "goto") {
    say(mode === "road" ? t("Osadník staví cestu až do cíle. Když ho vybereš, stavbu zrušíš klávesou C.") : t("Osadník staví železnici až do cíle. Když ho vybereš, stavbu zrušíš klávesou C."));
    afterUnitAction();
    return;
  }
  if (ok) {
    const moved = state.units.find((u) => u.id === unit.id);
    if (moved?.goto) say(t("{unit} je na cestě. Cestu zrušíš klávesou C, až jednotku znovu vybereš.", { unit: unitName(unit.type) }));
    afterUnitAction();
  } else refresh();
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
  if (distance(unit, p) === 1 || sendingUnitId === unit.id) return true;
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
  if (route.turns === null) return t("Sem jednotka nedojde.");
  if (route.turns === 1) return t("Jednotka sem dojde ještě v tomhle tahu.");
  return t("Cesta sem zabere {turns}.", { turns: turnsText(route.turns) });
}

/** Routes of the player's units that are on their way somewhere: a goto or a road being built along a route. */
function ownRoutes(): { unitId: number; path: Point[] }[] {
  const out: { unitId: number; path: Point[] }[] = [];
  for (const u of state.units) {
    if (u.owner !== HUMAN || u.carriedBy !== null) continue;
    const to = u.goto ?? (u.orders?.kind === "route" ? u.orders.to : null);
    if (!to) continue;
    const path = findPath(state, HUMAN, u, to);
    if (path && path.length > 0) out.push({ unitId: u.id, path });
  }
  return out;
}

/** Units the player sees and where they stand, to animate their moves. */
function visiblePositions(): Map<number, Point> {
  const view = playerView(state, HUMAN);
  return new Map([...view.units, ...view.foreignUnits].filter((u) => u.carriedBy === null).map((u) => [u.id, { x: u.x, y: u.y }]));
}

/** Units sliding from their old tile to the new one after a move or the computer players' turns. */
let animation: { moves: Map<number, { from: Point; to: Point }>; start: number; duration: number } | null = null;
let animationFrame = 0;
const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- battles ----------

/*
 * Every fight the player takes part in is played on the map: the attacker steps up, blows land
 * round by round as they were rolled, the loser falls and a banner says who won and what the odds
 * were. Fights of the computer players' turns against the player's units follow after their moves.
 * A click or a key skips the rest.
 */
type CombatEvent = Extract<GameEvent, { type: "combat" }>;
const battleQueue: CombatEvent[] = [];
let battle: { e: CombatEvent; start: number; lunge: number; round: number; fall: number; hold: number } | null = null;
let battleBannerTimer = 0;
const battleBanner = document.createElement("div");
battleBanner.className = "battle-banner";
battleBanner.hidden = true;
battleBanner.setAttribute("aria-live", "polite");
mapWrap.appendChild(battleBanner);

function queueBattles(events: GameEvent[], delay: number): void {
  for (const e of events) {
    if (e.type !== "combat" || e.rounds === undefined || !e.from) continue;
    if (e.attacker.owner !== HUMAN && e.defender.owner !== HUMAN) continue;
    battleQueue.push(e);
  }
  if (!battle && battleQueue.length) startBattle(performance.now() + delay);
}

function startBattle(at: number): void {
  const e = battleQueue.shift();
  if (!e) {
    battle = null;
    return;
  }
  const n = e.rounds!.length;
  const round = reduceMotion ? 0 : Math.max(70, Math.min(150, 1500 / Math.max(1, n)));
  battle = { e, start: at, lunge: reduceMotion ? 0 : 260, round, fall: reduceMotion ? 0 : 450, hold: reduceMotion ? 1600 : 900 };
  camera = keepInView(camera, e.at, state.map);
  drawMap();
}

function battleEnd(b: NonNullable<typeof battle>): number {
  return b.start + b.lunge + b.round * b.e.rounds!.length + b.fall + b.hold;
}

/** What the fight looks like at time `now`; null before it starts. */
function battleFrame(b: NonNullable<typeof battle>, now: number): BattleFrame | null {
  const t = now - b.start;
  if (t < 0) return null;
  const e = b.e;
  const rounds = e.rounds!;
  const fighter = (side: CombatEvent["attacker"], at: Point) => ({
    id: side.id,
    owner: side.owner,
    type: side.unitType,
    x: at.x,
    y: at.y,
    fortified: false,
    working: false,
    hasMoves: true,
  });
  const aFp = UNIT_TYPES[e.attacker.unitType].firepower;
  const dFp = UNIT_TYPES[e.defender.unitType].firepower;
  const aMax = UNIT_TYPES[e.attacker.unitType].hp;
  const dMax = UNIT_TYPES[e.defender.unitType].hp;
  const inRounds = t - b.lunge;
  const landed = b.round === 0 ? rounds.length : Math.max(0, Math.min(rounds.length, Math.floor(inRounds / b.round) + 1));
  let ahp = e.attackerHp ?? aMax;
  let dhp = e.defenderHp ?? dMax;
  for (const r of rounds.slice(0, inRounds < 0 ? 0 : landed)) {
    if (r === "a") dhp = Math.max(0, dhp - aFp);
    else ahp = Math.max(0, ahp - dFp);
  }
  const last = inRounds >= 0 && landed > 0 ? rounds[landed - 1] : undefined;
  const roundsEnd = b.lunge + b.round * rounds.length;
  const after = t - roundsEnd;
  const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - (1 - x) ** 2);
  const lunge = t < b.lunge ? ease(t / b.lunge) : after < 0 ? 1 : b.fall ? 1 - ease(after / b.fall) : 0;
  const winner = e.attackerWon ? "attacker" : "defender";
  return {
    attacker: fighter(e.attacker, e.from!),
    defender: fighter(e.defender, e.at),
    lunge,
    attackerHealth: ahp / aMax,
    defenderHealth: dhp / dMax,
    hit: last === undefined || after >= b.round ? null : last === "a" ? "defender" : "attacker",
    hitAge: last === undefined ? 1 : Math.min(1, (inRounds - (landed - 1) * b.round) / (b.round * 2 || 1)),
    fallen: after >= 0 ? (e.attackerWon ? "defender" : "attacker") : null,
    fall: b.fall ? Math.max(0, Math.min(1, after / b.fall)) : after >= 0 ? 1 : 0,
    star: e.promoted && after >= 0 ? Math.min(1, after / (b.fall + b.hold)) : 0,
    starOn: e.promoted ? winner : null,
  };
}

function showBattleBanner(e: CombatEvent): void {
  const mine = e.attacker.owner === HUMAN;
  const iWon = mine === e.attackerWon;
  const pct = Math.round((mine ? e.winChance : 1 - e.winChance) * 100);
  const title = iWon ? (mine ? t("Vítězství!") : t("Ubránil ses!")) : t("Prohra");
  battleBanner.className = `battle-banner ${iWon ? "won" : "lost"}`;
  battleBanner.innerHTML = `<b>${title}</b><span>${eventText(state, e) ?? ""} ${t("Šance na výhru byla {pct} %.", { pct })}</span>`;
  battleBanner.hidden = false;
  window.clearTimeout(battleBannerTimer);
  battleBannerTimer = window.setTimeout(() => (battleBanner.hidden = true), 3200);
}

/** Skips the fight being shown and all that wait. */
function skipBattles(): boolean {
  if (!battle) return false;
  battleQueue.length = 0;
  battle = null;
  battleBanner.hidden = true;
  drawMap();
  return true;
}

// A click or key during a fight only skips it, so it cannot give an order by accident.
let swallowClick = false;
document.addEventListener(
  "pointerdown",
  (ev) => {
    if (battle && performance.now() >= battle.start && skipBattles()) {
      swallowClick = true;
      ev.stopPropagation();
      ev.preventDefault();
    }
  },
  true,
);
document.addEventListener(
  "click",
  (ev) => {
    if (!swallowClick) return;
    swallowClick = false;
    ev.stopPropagation();
    ev.preventDefault();
  },
  true,
);
document.addEventListener(
  "keydown",
  (ev) => {
    if (battle && performance.now() >= battle.start && skipBattles()) {
      ev.stopPropagation();
      ev.preventDefault();
    }
  },
  true,
);

function animateMoves(before: Map<number, Point>): void {
  if (reduceMotion) return;
  const after = visiblePositions();
  const moves = new Map<number, { from: Point; to: Point }>();
  let longest = 0;
  for (const [id, to] of after) {
    const from = before.get(id);
    if (!from || (from.x === to.x && from.y === to.y)) continue;
    moves.set(id, { from, to });
    longest = Math.max(longest, distance(from, to));
  }
  if (moves.size === 0) return;
  animation = { moves, start: performance.now(), duration: Math.min(700, 160 + 90 * longest) };
}

/** Draws the map, with moving units part of the way while an animation runs. */
function drawMap(): void {
  const input = buildDrawInput();
  if (animation) {
    const t = Math.min(1, (performance.now() - animation.start) / animation.duration);
    const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    if (t < 1) {
      input.units = input.units.map((u) => {
        const m = animation!.moves.get(u.id);
        return m ? { ...u, x: m.from.x + (m.to.x - m.from.x) * ease, y: m.from.y + (m.to.y - m.from.y) * ease } : u;
      });
      if (!animationFrame) animationFrame = requestAnimationFrame(() => {
        animationFrame = 0;
        drawMap();
      });
    } else animation = null;
  }
  if (battle) {
    const now = performance.now();
    const b = battle;
    if (now >= b.start) input.units = input.units.filter((u) => u.id !== b.e.attacker.id && u.id !== b.e.defender.id);
    draw(ctx, input);
    const frame = battleFrame(b, now);
    if (frame) {
      drawBattle(ctx, frame);
      if (now - b.start >= b.lunge + b.round * b.e.rounds!.length && battleBanner.dataset.for !== `${b.start}`) {
        battleBanner.dataset.for = `${b.start}`;
        showBattleBanner(b.e);
      }
    }
    if (now >= battleEnd(b)) startBattle(now);
    if (battle && !animationFrame)
      animationFrame = requestAnimationFrame(() => {
        animationFrame = 0;
        drawMap();
      });
  } else draw(ctx, input);
  afterDraw();
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
    special: showAll ? state.map.special : view.special,
    pollution: showAll ? state.map.pollution : view.pollution,
    ruins: showAll ? state.map.ruins : view.ruins,
    units: [...view.units, ...view.foreignUnits].map((u) => ({
      id: u.id,
      owner: u.owner,
      type: u.type,
      x: u.x,
      y: u.y,
      fortified: u.fortified,
      onRoute: u.owner === HUMAN && state.units.some((x) => x.id === u.id && (x.goto !== null || x.orders?.kind === "route")),
      automated: u.owner === HUMAN && state.units.some((x) => x.id === u.id && x.orders?.kind === "auto"),
      working: u.work !== null,
      workProgress: u.work ? workShare(u) : undefined,
      hasMoves: needsOrders(u),
      health: u.hp / UNIT_TYPES[u.type].hp,
      veteran: u.veteran,
    })),
    cities: [...view.cities, ...view.foreignCities].map((c) => ({
      id: c.id,
      owner: c.owner,
      name: cityLabel(c.name),
      x: c.x,
      y: c.y,
      size: c.size,
      walls: c.buildings.includes("walls"),
      era: currentEra(state.players[c.owner]!),
    })),
    starts: showAll ? state.players.slice(1).map((p) => ({ point: p.start, playerId: p.id })) : [],
    selectedUnitId,
    selectedCityId,
    territory: territoryOf(view.cities),
    highlight: city ? city.worked : [],
    path: route?.path ?? undefined,
    routes: ownRoutes(),
    pathTurns: route?.stepTurns,
    target: route ? { point: route.target, turns: route.turns } : null,
    camera,
  };
}

/** Who owns the foreign units or city on the tile, and whether it is war or peace with them. */
function foreignLine(p: Point): string {
  const i = p.y * state.map.width + p.x;
  const city = state.cities.find((c) => c.x === p.x && c.y === p.y && c.owner !== HUMAN);
  const seen = visibleTiles(state, HUMAN)[i] === 1;
  const units = seen ? state.units.filter((u) => u.x === p.x && u.y === p.y && u.owner !== HUMAN && u.carriedBy === null) : [];
  const owner = city?.owner ?? units[0]?.owner;
  if (owner === undefined) return "";
  const me = state.players[HUMAN]!;
  const relation = me.atWar.includes(owner) ? `<b class="neg">${t("válka")}</b>` : t("mír");
  const list = units.map((u) => `${unitName(u.type)} ${u.hp}/${UNIT_TYPES[u.type].hp}${u.veteran ? " ★" : ""}`).join(", ");
  return `<br>${escapeHtml(civName(state.players[owner]!.civ))} · ${relation}${list ? `<br>${escapeHtml(list)}` : ""}`;
}

/** Share of a settler's current improvement that is done, 0..1. */
function workShare(u: Unit): number {
  if (!u.work) return 0;
  const terrain = state.map.terrain[u.y * state.map.width + u.x]!;
  const need = workTurns(state.map, u.y * state.map.width + u.x, u.work.improvement) ?? 1;
  void terrain;
  return u.work.progress / need;
}

/** Largest tile size that fits the whole map into the map area of the window. */
function fitTileSize(): number {
  const byWidth = mapWrap.clientWidth / state.map.width;
  const byHeight = mapWrap.clientHeight / (state.map.height * mapTilt());
  return Math.max(16, Math.min(56, Math.floor(Math.min(byWidth, byHeight))));
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
  drawMap();
  turnLabel.textContent = t("Tah {turn} z {maxTurns}", { turn: state.turn, maxTurns: maxTurns(state) });
  seedLabel.textContent = state.seed;
  const waiting = state.units.some(needsOrders);
  const choose = needsResearchChoice();
  endTurnButton.classList.toggle("ready", !waiting && !choose);
  renderEconomy();
  renderResearchPick();
  renderSelection();
  renderLog();
  drawMinimap();
  techTree.refresh();
  cityScreen.refresh();
  citiesOverview.refresh();
  advisor.render();
  guide.updateSteps(advisor.mode() === "guide");
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
    gold += r.gold + r.wealthGold;
  }
  return { science, gold, upkeep: buildingUpkeep(state, HUMAN) };
}

function needsResearchChoice(): boolean {
  return me().researching === null && researchableTechs(me()).length > 0;
}

function renderEconomy(): void {
  const p = me();
  const totals = empireTotals();
  const net = totals.gold - totals.upkeep;
  goldLabel.innerHTML = t("Zlato <b>{gold}</b>", { gold: p.gold }) + ` <span class="${net < 0 ? "neg" : "muted"}">(${t("{net} za tah", { net: `${net >= 0 ? "+" : ""}${net}` })})</span>`;
  goldLabel.title = t("Příjem {gold}, údržba budov {upkeep}", { gold: totals.gold, upkeep: totals.upkeep });
  const cost = researchCost(p);
  if (p.researching) {
    const left = Math.max(0, cost - p.research);
    const turns = totals.science > 0 ? turnsText(Math.max(1, Math.ceil(left / totals.science))) : t("nikdy");
    researchButton.innerHTML = t("Výzkum: <b>{tech}</b>", { tech: techName(p.researching) }) + ` <span class="muted">${Math.min(p.research, cost)}/${cost} · ${turns}</span>`;
    researchButton.classList.remove("attention");
  } else if (researchableTechs(p).length > 0) {
    researchButton.innerHTML = `<b>${t("Vyber výzkum")}</b> <span class="muted">${p.research}/${cost}</span>`;
    researchButton.classList.add("attention");
  } else {
    researchButton.innerHTML = t("Všechno je vyzkoumané");
    researchButton.classList.remove("attention");
  }
  const gov = GOVERNMENTS[p.government];
  // Science and luxuries have sliders, taxes get the rest; the government caps each share.
  const anarchy = gov.maxRate === 0;
  rateInput.disabled = anarchy;
  luxInput.disabled = anarchy;
  rateInput.max = luxInput.max = String(anarchy ? 100 : gov.maxRate);
  rateInput.value = String(anarchy ? 0 : p.scienceRate);
  luxInput.value = String(anarchy ? 100 : p.luxuryRate);
  rateLabel.textContent = anarchy ? "0 %" : `${p.scienceRate} %`;
  luxLabel.textContent = anarchy ? "100 %" : `${p.luxuryRate} %`;
  taxLabel.textContent = anarchy ? t("anarchie: jen zábava") : t("daně {tax} %", { tax: 100 - p.scienceRate - p.luxuryRate });
  governmentButton.innerHTML = p.revolution
    ? t("Vláda: <b>{gov}</b>", { gov: governmentName("anarchy") }) + ` <span class="muted">${t("{gov} za {turns}", { gov: governmentName(p.revolution.target), turns: turnsText(p.revolution.turnsLeft) })}</span>`
    : t("Vláda: <b>{gov}</b>", { gov: governmentName(p.government) });
  const ship = p.spaceship;
  const apollo = state.cities.some((c) => c.buildings.includes("apolloProgram"));
  spaceshipButton.hidden = !apollo && ship.structural + ship.component + ship.module === 0 && !state.players.some((x) => x.spaceship.arrivalTurn !== null);
  spaceshipButton.innerHTML =
    ship.arrivalTurn !== null ? t("Loď letí, přistání v tahu <b>{arrivalTurn}</b>", { arrivalTurn: ship.arrivalTurn }) : `${t("Vesmírná loď")} <span class="muted">${ship.structural}/${ship.component}/${ship.module}</span>`;
  // Global warming: the whole world sees how close it is.
  const polluted = state.map.pollution.reduce((n, x) => n + x, 0);
  const warming = Math.min(100, Math.round((100 * state.warming) / RULES.warmingLimit));
  warmingLabel.hidden = polluted === 0 && warming === 0;
  warmingLabel.innerHTML = `<span class="sun" style="--heat:${warming / 100}"></span>${warming} %`;
  warmingLabel.title = t("Globální oteplování je na {pct} %. Na světě je {n} znečištěných políček. Až počítadlo dojde na 100 %, změní se krajina: u moře vzniknou bažiny a džungle, ve vnitrozemí poušť. Pomůže vyčistit znečištění osadníky.", { pct: warming, n: polluted });
  endScreen.check();
}

const empire = createEmpireDialogs($<HTMLDialogElement>("#empire-dialog"), {
  state: () => state,
  player: () => HUMAN,
  run,
  refresh,
  openEntry: (key) => codex.show(key),
});
governmentButton.addEventListener("click", () => empire.openGovernment());
const codex = createCodex($<HTMLDialogElement>("#codex-dialog"), { openTech: (t) => techTree.openPage(t), maxTurns: () => maxTurns(state) });
$<HTMLButtonElement>("#codex").addEventListener("click", () => codex.open());
const attackDialog = createAttackDialog($<HTMLDialogElement>("#attack-dialog"), {
  state: () => state,
  attack: (unitId, to) => unitAction({ type: "attack", unitId, to }),
  declareWar: (player) => {
    const ok = run({ type: "declareWar", player });
    refresh();
    return ok;
  },
});
const newGameDialog = createNewGameDialog($<HTMLDialogElement>("#new-game-dialog"), {
  start: (seed, civ, world, barbarians, difficulty, speed) => {
    menus.hideStart();
    startNewGame(seed, civ, world, true, barbarians, difficulty, speed);
  },
  randomSeed,
  showEntry: (key) => codex.show(key),
});
spaceshipButton.addEventListener("click", () => empire.openSpaceship());

function chooseResearch(tech: TechId): void {
  if (run({ type: "setResearch", tech })) say(t("Zkoumáme: {tech}.", { tech: techName(tech) }));
  refresh();
}

function chooseGoal(tech: TechId): void {
  if (run({ type: "setResearchGoal", tech })) {
    const p = me();
    say(p.researchGoal ? t("Míříme k objevu {tech}, teď zkoumáme {tech2}.", { tech: techName(tech), tech2: techName(p.researching!) }) : t("Zkoumáme: {tech}.", { tech: techName(tech) }));
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
    .map((tech) => {
      const what = unlockNames(tech);
      return `<div class="tech-pick-row"><button type="button" class="tech-pick" data-tech="${tech}">${techIconSvg(tech, TECHS[tech].era, 34)}<span><b>${techName(tech)}</b><span>${escapeHtml(what.join(", ") || t("otevře další technologie"))}</span></span></button><button type="button" class="tech-info" data-info="${tech}" title="${t("Přečíst si o téhle technologii")}">?</button></div>`;
    })
    .join("");
  researchPanel.innerHTML = `<h2>${t("Vyber výzkum")}</h2><div class="tech-picks">${options}</div>
    <button type="button" class="wide" data-tree>${t("Ukázat celý strom technologií")}</button>`;
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

const nations = createNations($<HTMLDialogElement>("#nations-dialog"), $<HTMLDialogElement>("#peace-dialog"), {
  state: () => state,
  player: () => HUMAN,
  run: (command) => {
    const ok = run(command);
    refresh();
    return ok;
  },
  openEntry: (key) => codex.show(key),
});
$<HTMLButtonElement>("#nations-button").addEventListener("click", () => nations.open());
const endScreen = createEndScreen($<HTMLDialogElement>("#end-dialog"), {
  state: () => state,
  player: () => HUMAN,
  newGame: () => newGameDialog.open(),
});
const foreignCity = createForeignCity($<HTMLDialogElement>("#foreign-city-dialog"), {
  state: () => state,
  player: () => HUMAN,
  openEntry: (key) => codex.show(key),
  openNations: () => nations.open(),
  selectedUnitName: () => {
    const u = selectedUnit();
    return u ? unitName(u.type) : null;
  },
  sendTo: (p) => moveSelected(p),
});

/** A foreign city the player knows of on the tile, or undefined. */
function knownForeignCity(p: Point): { id: number } | undefined {
  return playerView(state, HUMAN).foreignCities.find((c) => c.x === p.x && c.y === p.y);
}
const guide = createGuide({
  state: () => state,
  player: () => HUMAN,
  openEntry: (key) => codex.show(key),
  openTech: (tech) => techTree.openPage(tech),
  openTechTree: () => techTree.open(),
  openGovernment: () => empire.openGovernment(),
  ui: () => ({ selectedUnitId, selectedCityId, openCityId: cityScreen.openCityId() }),
  tileRect: (p) => {
    if (!isVisible(camera, p, state.map, 0)) return null;
    const rect = canvas.getBoundingClientRect();
    const size = tileSize() * camera.zoom;
    const k = mapTilt();
    return new DOMRect(rect.left + (p.x - camera.x) * size, rect.top + (p.y - camera.y) * size * k, size, size * k);
  },
  centerTile: (p) => {
    // With the whole map in view nothing can move, so the map zooms in first.
    camera = centerOn({ ...camera, zoom: Math.max(camera.zoom, 2) }, p, state.map);
    drawMap();
  },
  showTile: (p) => {
    camera = keepInView(camera, p, state.map);
    drawMap();
  },
});
afterDraw = () => guide.placeHighlight();
// The owl's step follows every click and key: dialogs open and close without a refresh of the game.
let stepTimer = 0;
const stepSoon = () => {
  window.clearTimeout(stepTimer);
  stepTimer = window.setTimeout(() => guide.updateSteps(advisor.mode() === "guide"), 0);
};
document.addEventListener("click", stepSoon, true);
document.addEventListener("keyup", stepSoon, true);
const advisor = createAdvisor($<HTMLElement>("#advisor"), $<HTMLSelectElement>("#helper-mode"), {
  guide,
  state: () => state,
  player: () => HUMAN,
  openCity: (id) => cityScreen.open(id),
  selectUnit: (id) => {
    selectedUnitId = id;
    selectedCityId = null;
    refresh();
  },
  openTechTree: () => techTree.open(),
  automate: (id) => {
    if (run({ type: "automate", unitId: id })) say(t("Osadník teď sám vylepšuje okolí tvých měst."));
    refresh();
  },
  openGovernment: () => empire.openGovernment(),
  run: (command) => {
    const ok = run(command);
    refresh();
    return ok;
  },
});

$<HTMLButtonElement>("#advisor-button").addEventListener("click", () => advisor.toggleShown());

// Settings of the children's guide in the menu.
const helperMode = $<HTMLSelectElement>("#helper-mode");
const guideVolume = $<HTMLSelectElement>("#guide-volume");
const guideName = $<HTMLInputElement>("#guide-name");
const guideSettings = document.querySelector<HTMLElement>(".gm-guide")!;
guideVolume.value = guide.settings().volume;
guideName.value = guide.settings().name;
guideName.placeholder = t("Sova");
guideSettings.hidden = advisor.mode() !== "guide";
helperMode.addEventListener("change", () => {
  guideSettings.hidden = advisor.mode() !== "guide";
  if (advisor.mode() === "guide" && gameStarted && !guide.hasPath()) guide.askPath();
});
guideVolume.addEventListener("change", () => guide.setVolume(guideVolume.value as "all" | "important"));
guideName.addEventListener("change", () => {
  guide.setName(guideName.value);
  advisor.render();
});

const celebration = createCelebration($<HTMLDialogElement>("#celebration-dialog"), { openEntry: (key) => codex.show(key) });
const citiesOverview = createCitiesOverview($<HTMLDialogElement>("#cities-dialog"), {
  state: () => state,
  player: () => HUMAN,
  run,
  refresh,
  openCity: (id) => cityScreen.open(id),
});
$<HTMLButtonElement>("#cities-button").addEventListener("click", () => citiesOverview.open());

function cityScreenOpen(): boolean {
  return cityScreen.isOpen();
}
function setRates(keep: "science" | "luxury"): void {
  const fitted = fitRates(Number(rateInput.value), Number(luxInput.value), me().government, keep);
  run({ type: "setRates", science: fitted.science, luxury: fitted.luxury });
  refresh();
}
luxInput.addEventListener("input", () => setRates("luxury"));
rateInput.addEventListener("input", () => {
  setRates("science");
  refresh();
});

function renderLog(): void {
  logList.innerHTML = log
    .map((e) => `<li><span class="t">${e.turn}.</span>${escapeHtml(e.text)}</li>`)
    .join("");
}

function turnsText(n: number): string {
  return tn("{n} tah|{n} tahy|{n} tahů", n);
}

function renderSelection(): void {
  const city = selectedCity();
  const unit = selectedUnit();
  if (city) return renderCity(city);
  if (unit) return renderUnit(unit);
  const waiting = state.units.filter(needsOrders).length;
  selectionPanel.dataset.kind = "idle";
  selectionPanel.innerHTML =
    `<p class="facts">` +
    (waiting > 0
      ? tn("Na rozkaz čeká {n} jednotka. Stiskni <kbd>N</kbd> nebo klikni na jednotku.|Na rozkaz čekají {n} jednotky. Stiskni <kbd>N</kbd> nebo klikni na jednotku.|Na rozkaz čeká {n} jednotek. Stiskni <kbd>N</kbd> nebo klikni na jednotku.", waiting)
      : t("Všechny jednotky mají rozkazy. Ukonči tah klávesou <kbd>Enter</kbd>.")) +
    `</p>`;
}

function renderUnit(unit: Unit): void {
  const rule = UNIT_TYPES[unit.type];
  const terrain = state.map.terrain[unit.y * state.map.width + unit.x]!;
  const left = unit.movesLeft / RULES.movesFraction;
  const moves = t("{left} z {all}", { left: Number.isInteger(left) ? left : left.toFixed(1).replace(".", t(",")), all: rule.moves });
  let status = "";
  if (unit.work) {
    const need = workTurns(state.map, unit.y * state.map.width + unit.x, unit.work.improvement) ?? 0;
    const left = turnsText(need - unit.work.progress);
    const kind = unit.work.improvement;
    const into = kind === "clean" ? undefined : IMPROVEMENTS[kind].transform?.[terrain];
    status =
      kind === "clean"
        ? t("Čistí znečištění, hotovo za {turns}.", { turns: left })
        : into
          ? t("Mění terén na: {terrain}, hotovo za {turns}.", { terrain: inSentence(terrainName(into)), turns: left })
          : t("Staví: {improvement}, hotovo za {turns}.", { improvement: inSentence(improvementName(kind)), turns: left });
    if (unit.orders?.kind === "auto") status += t(" Pak si sám najde další práci.");
    if (unit.orders?.kind === "route") status += t(" Pak pokračuje k políčku [{x}, {y}].", { x: unit.orders.to.x, y: unit.orders.to.y });
  } else if (unit.orders?.kind === "auto") {
    status = t("Sám vylepšuje okolí tvých měst.") + (unit.orders.target ? "" : t(" Teď tu není co dělat, počká na další tah."));
  } else if (unit.orders?.kind === "route") {
    status = (unit.orders.improvement === "road" ? t("Staví cestu až na políčko [{x}, {y}].", unit.orders.to) : t("Staví železnici až na políčko [{x}, {y}].", unit.orders.to));
  } else if (unit.goto) {
    const turns = routeTo(unit, unit.goto).turns;
    status = t("Míří na políčko [{x}, {y}]", unit.goto) + (turns ? `, ${turns === 1 ? t("dojde v tomhle tahu") : t("dojde za {turns}", { turns: turnsText(turns) })}.` : ".");
  }
  else if (unit.fortified) status = t("Opevněná.");
  if (unit.carriedBy !== null) {
    const ship = state.units.find((u) => u.id === unit.carriedBy);
    status = t("Je na palubě: {ship}.", { ship: ship ? unitName(ship.type) : t("loď") }) + (rule.domain === "land" ? " " + t("Vystoupí krokem na pevninu.") : "") + (status ? ` ${status}` : "");
  }
  if (rule.capacity) {
    const cargo = state.units.filter((u) => u.carriedBy === unit.id).length;
    status = t("Na palubě {cargo} z {capacity}. ", { cargo, capacity: rule.capacity }) + status;
  }
  if (rule.domain === "air" && rule.fuel) {
    const left = rule.fuel - unit.turnsAloft;
    status = tn("Palivo ještě na tento tah, pak musí přistát ve městě nebo na letadlové lodi. |Palivo ještě na {n} tahy, pak musí přistát ve městě nebo na letadlové lodi. |Palivo ještě na {n} tahů, pak musí přistát ve městě nebo na letadlové lodi. ", left) + status;
  }

  const buttons: string[] = [];
  const button = (action: string, label: string, key: string, error: string | null) =>
    buttons.push(
      `<button type="button" data-action="${action}" ${error ? `disabled title="${escapeHtml(error)}"` : ""}>${label}${key ? `<kbd>${key}</kbd>` : ""}</button>`,
    );

  const standsInOwnCity = state.cities.some((c) => c.x === unit.x && c.y === unit.y && c.owner === HUMAN);
  if (rule.foundsCity && standsInOwnCity) {
    const err = canJoinCity(state, unit);
    button("join", t("Přidat se k městu"), "B", err ? ERROR_TEXT[err] : null);
  } else if (rule.foundsCity) {
    const err = canFoundCity(state, unit);
    button("found", t("Založit město"), "B", err ? ERROR_TEXT[err] : null);
  }
  if (rule.buildsImprovements) {
    const keys: Record<ImprovementId, string> = { road: "R", irrigation: "I", mine: "M", railroad: "Z", fortress: "P" };
    for (const imp of ["road", "irrigation", "mine", "railroad", "fortress"] as ImprovementId[]) {
      const needs = IMPROVEMENTS[imp].requires;
      if (needs && !knowsTech(me(), needs)) continue;
      const err = canBuildImprovement(state, unit, imp);
      const turns = IMPROVEMENTS[imp].turns[terrain];
      const into = IMPROVEMENTS[imp].transform?.[terrain];
      const name = into ? t("Změnit na: {terrain}", { terrain: inSentence(terrainName(into)) }) : improvementName(imp);
      const label = turns ? `${name} (${turnsText(turns)})` : name;
      button(`build:${imp}`, label, keys[imp], err ? ERROR_TEXT[err] : null);
    }
    if (state.map.pollution[unit.y * state.map.width + unit.x]) {
      const err = canCleanPollution(state, unit);
      button("clean", t("Vyčistit znečištění ({turns})", { turns: turnsText(RULES.pollutionCleanTurns) }), "V", err ? ERROR_TEXT[err] : null);
    }
    const choosing = (mode: "road" | "railroad") => sendingUnitId === unit.id && sendMode === mode;
    button("lay:road", choosing("road") ? t("Klikni, kam má cesta vést") : t("Cesta až na místo"), "K", null);
    if (knowsTech(me(), "railroad")) button("lay:railroad", choosing("railroad") ? t("Klikni, kam má železnice vést") : t("Železnice až na místo"), "", null);
    button("auto", t("Automatická práce"), "A", unit.orders?.kind === "auto" ? t("Osadník už pracuje sám.") : null);
  } else if (rule.domain === "land") {
    button("fortify", t("Opevnit"), "F", unit.fortified ? t("Jednotka už je opevněná.") : null);
  }
  const here = state.cities.find((c) => c.x === unit.x && c.y === unit.y);
  if (rule.domain !== "sea" && here && unit.carriedBy === null && state.units.some((u) => u.x === unit.x && u.y === unit.y && UNIT_TYPES[u.type].capacity)) {
    button("board", t("Nalodit"), "L", shipWithRoom(state, unit, unit) ? null : ERROR_TEXT.noShip);
  }
  const near = state.cities.filter((c) => distance(c, unit) <= 1);
  if (rule.special === "caravan") {
    const wonder = here && here.owner === HUMAN && here.production.kind === "building" && BUILDINGS[here.production.id].wonder;
    button("help", t("Pomoct se stavbou divu"), "H", wonder ? null : ERROR_TEXT.notBuildingWonder);
    for (const c of near) {
      const err = canOpenTradeRoute(state, unit, c.id);
      if (c.id !== unit.homeCity) button(`route:${c.id}`, t("Obchodní cesta: {city}", { city: escapeHtml(cityLabel(c.name)) }), "", err ? ERROR_TEXT[err] : null);
    }
  }
  if (rule.special === "diplomat") {
    for (const c of near.filter((x) => x.owner !== HUMAN)) {
      const price = inciteCost(state, c);
      button(`dip:embassy:${c.id}`, t("Velvyslanectví: {city}", { city: escapeHtml(cityLabel(c.name)) }), "", me().embassies.includes(c.owner) ? ERROR_TEXT.embassyExists : null);
      button(`dip:stealTech:${c.id}`, t("Ukrást technologii"), "", c.stolenBy.includes(HUMAN) ? ERROR_TEXT.alreadyStolen : null);
      button(`dip:sabotage:${c.id}`, t("Sabotáž"), "", null);
      button(`dip:incite:${c.id}`, t("Podplatit město ({price} zlata)", { price }), "", c.buildings.includes("palace") ? ERROR_TEXT.isCapital : me().gold < price ? ERROR_TEXT.notEnoughGold : null);
    }
  }
  if (rule.special === "nuclear") {
    button("aim", targetingUnitId === unit.id ? t("Klikni na cíl na mapě") : t("Zamířit a odpálit"), "X", unit.movesLeft > 0 ? null : ERROR_TEXT.noMovesLeft);
  }
  button("send", sendingUnitId === unit.id ? t("Klikni na cíl na mapě") : t("Poslat na místo"), "G", null);
  button("skip", t("Počkat"), t("mezera"), unit.movesLeft > 0 ? null : t("Jednotka už nemá pohyb."));
  if (unit.orders?.kind === "auto") button("cancel", t("Zrušit automatickou práci"), "C", null);
  else if (unit.orders?.kind === "route") button("cancel", t("Zrušit stavbu cesty"), "C", null);
  else if (unit.goto) button("cancel", t("Zrušit cestu"), "C", null);
  else if (unit.work) button("cancel", t("Přestat pracovat"), "C", null);
  else if (unit.fortified) button("cancel", t("Zrušit opevnění"), "C", null);
  const upgradeTo = upgradeTarget(me(), unit.type);
  if (upgradeTo) {
    const err = canUpgrade(state, unit);
    button("upgrade", t("Povýšit: {unit} ({upgradeCost} zlata)", { unit: unitName(upgradeTo), upgradeCost: upgradeCost(unit.type, upgradeTo) }), "U", err ? ERROR_TEXT[err] : null);
  }
  const ownCity = here && here.owner === HUMAN;
  const disbandLabel =
    disbandConfirmUnitId === unit.id
      ? t("Opravdu rozpustit?")
      : ownCity
        ? t("Rozpustit (+{disbandShields} štítů do výroby)", { disbandShields: disbandShields(unit.type) })
        : t("Rozpustit");
  button("disband", disbandLabel, "D", null);
  button("next", t("Další jednotka"), "N", null);

  const homeName = unit.homeCity !== null ? state.cities.find((c) => c.id === unit.homeCity)?.name : undefined;
  const home = homeName ? cityLabel(homeName) : undefined;
  selectionPanel.dataset.kind = "unit";
  selectionPanel.innerHTML = `
    <div class="sel-info"><div class="panel-title"><h3><button type="button" class="linklike" data-codex="${entryKey("unit", unit.type)}" title="${t("Co je to za jednotku? (klávesa E)")}">${unitName(unit.type)}</button></h3><span class="sub">[${unit.x}, ${unit.y}] ${terrainName(terrain)}</span></div>
    <p class="facts">${t("Pohyb: {moves}", { moves })}${home ? ` · ${t("domov: {city}", { city: escapeHtml(home) })}` : ""}<br>
    ${t("Útok {attack} · obrana {defense} · životy {hp} z {max}", { attack: UNIT_TYPES[unit.type].attack, defense: UNIT_TYPES[unit.type].defense, hp: unit.hp, max: UNIT_TYPES[unit.type].hp })}${unit.veteran ? ` · <b>${t("veterán")}</b>` : ""}<br>
    <span class="muted">${status || (sendingUnitId === unit.id ? t("Klikni na políčko, kam má jít. Může to být i město nebo jiná jednotka.") : t("Klikni na mapu, kam má jít. Do města ji pošleš pravým klikem nebo klávesou G."))}</span></p></div>
    <div class="actions row">${buttons.join("")}</div>`;

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
  // In its own city B lets the settler join instead of founding.
  if (action === "found" && state.cities.some((c) => c.x === unit.x && c.y === unit.y && c.owner === HUMAN)) return unitAction({ type: "joinCity", unitId: unit.id });
  if (action === "found") return unitAction({ type: "foundCity", unitId: unit.id });
  if (action === "join") return unitAction({ type: "joinCity", unitId: unit.id });
  if (action === "clean") return unitAction({ type: "cleanPollution", unitId: unit.id });
  if (action === "fortify") return unitAction({ type: "fortify", unitId: unit.id });
  if (action === "skip") return unitAction({ type: "skipTurn", unitId: unit.id });
  if (action === "cancel") {
    const hadRoute = unit.goto !== null;
    if (run({ type: "cancelOrders", unitId: unit.id }) && hadRoute) say(t("Cesta je zrušená. Jednotka čeká na nový rozkaz."));
    return refresh();
  }
  if (action === "lay:road" || action === "lay:railroad") {
    const mode = action === "lay:road" ? "road" : "railroad";
    const again = sendingUnitId === unit.id && sendMode === mode;
    sendingUnitId = again ? null : unit.id;
    sendMode = again ? "goto" : mode;
    say(sendingUnitId ? mode === "road" ? t("Klikni na políčko, kam má cesta vést. Osadník ji postaví po celé délce. Esc to zruší.") : t("Klikni na políčko, kam má železnice vést. Osadník ji postaví po celé délce. Esc to zruší.") : "");
    return refresh();
  }
  if (action === "auto") {
    if (run({ type: "automate", unitId: unit.id })) {
      say(t("Osadník teď sám vylepšuje okolí tvých měst. Když ho vybereš, klávesou C ho zastavíš."));
      afterUnitAction();
    } else refresh();
    return;
  }
  if (action === "send") {
    sendMode = "goto";
    sendingUnitId = sendingUnitId === unit.id ? null : unit.id;
    say(sendingUnitId ? t("Klikni na políčko, kam má jednotka jít. Esc to zruší.") : "");
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
    say(targetingUnitId ? t("Klikni na políčko, kam má raketa dopadnout. Esc zamíření zruší.") : "");
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
      ? t("dál neroste, potřebuje akvadukt")
      : r.foodSurplus > 0
        ? t("roste za {turns}", { turns: turnsText(r.turnsToGrow!) })
        : r.foodSurplus === 0
          ? t("neroste")
          : t("hladoví");
  const done = r.waitingForSize
    ? t("čeká na druhého obyvatele")
    : city.shields >= cost
      ? t("hotovo na konci tahu")
      : r.turnsToComplete
        ? t("hotovo za {turns}", { turns: turnsText(r.turnsToComplete) })
        : t("nevyrábí");
  const options = productionOptions(state, city)
    .map((o) => {
      const selected = sameItem(o, city.production) ? "selected" : "";
      if (o.kind === "wealth") return `<option value="wealth:" ${selected}>${productionLabel(o)} (${t("+{gold} zlata za tah", { gold: r.shieldSurplus * RULES.wealthGoldPerShield })})</option>`;
      const turns = r.shieldSurplus > 0 ? `, ${turnsText(Math.max(1, Math.ceil((productionCost(o) - city.shields) / r.shieldSurplus)))}` : "";
      const tag = o.kind === "building" && BUILDINGS[o.id].wonder ? t("Div: ") : "";
      return `<option value="${o.kind}:${o.id}" ${selected}>${tag}${productionLabel(o)} (${t("{cost} štítů", { cost: productionCost(o) })}${turns})</option>`;
    })
    .join("");
  const unitsHere = state.units.filter((u) => u.x === city.x && u.y === city.y && u.owner === HUMAN);
  const buildings =
    city.buildings.map((b) => (BUILDINGS[b].upkeep ? `${buildingName(b)} (${BUILDINGS[b].upkeep})` : buildingName(b))).join(", ") ||
    t("žádné");
  const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
  const h = r.happiness;
  const price = buyCost(city);
  const gold = me().gold;
  const buy =
    price === 0
      ? ""
      : `<button type="button" class="wide" data-buy ${gold < price ? `disabled title="${t("Máš jen {gold} zlata.", { gold })}"` : ""}>${t("Koupit hned za {price} zlata", { price })}</button>`;

  selectionPanel.dataset.kind = "city";
  selectionPanel.innerHTML = `
    <div class="sel-col"><div class="panel-title"><h3>${escapeHtml(cityLabel(city.name))}</h3><span class="sub">${t("velikost {size}", { size: city.size })}</span></div>
    <p class="facts">${t("Jídlo {food} z {need} ({change} za tah), {growth}", { food: city.food, need: r.growthThreshold, change: signed(r.foodSurplus), growth })}</p>
    <div class="bar food"><div style="width:${foodPct}%"></div></div>
    <p class="facts">${productionLabel(city.production)}: ${t("{done} z {cost} ({change} za tah), {state}", { done: Math.min(city.shields, cost), cost, change: signed(r.shieldSurplus), state: done })}</p>
    <div class="bar prod"><div style="width:${prodPct}%"></div></div>
    <div class="sel-prod"><label for="production">${t("Co stavět")}</label>
    <select id="production">${options}</select></div>
    ${buy}</div>
    <div class="sel-col"><p class="facts">${
      h.disorder ? `<span class="neg">${t("Nepokoje! Město nic nevyrábí.")}</span><br>` : ""
    }${city.celebrating ? `<span class="pos">${t("Město slaví!")}</span> ` : ""}${moodLine(h)}<br>
    ${t("Obchod {trade}", { trade: r.production.trade })}${r.corruption ? t(", korupce −{corruption}", { corruption: r.corruption }) : ""}: ${t("věda {science}, zlato {gold}", { science: r.science, gold: r.gold + r.wealthGold })}${r.luxury ? t(", zábava {luxury}", { luxury: r.luxury }) : ""}<br>${
      r.pollution.chancePct ? `<span class="neg">${t("Šance na znečištění okolí: {pct} % za tah.", { pct: r.pollution.chancePct })}</span><br>` : ""
    }
    <span class="muted">${t("Budovy: {list}", { list: buildings })}</span><br>
    <span class="muted">${t("Obyvatelé obdělávají políčka orámovaná na mapě.")}${
      h.entertainers ? t(" Baviči nepracují na poli a udržují ve městě klid.") : ""
    }</span></p>
    </div>
    <div class="sel-col sel-side">${
      unitsHere.length
        ? `<h2>${t("Jednotky ve městě")}</h2><ul class="unit-list">${unitsHere
            .map(
              (u) =>
                `<li>${unitName(u.type)}${u.fortified ? t(" (opevněný)") : ""}<button type="button" data-unit="${u.id}">${t("Vybrat")}</button></li>`,
            )
            .join("")}</ul>`
        : ""
    }
    <div class="actions"><button type="button" data-open-city class="primary">${t("Otevřít město")}</button><button type="button" data-close>${t("Zavřít")} <kbd>Esc</kbd></button></div></div>`;

  selectionPanel.querySelector("button[data-buy]")?.addEventListener("click", () => {
    run({ type: "buy", cityId: city.id });
    refresh();
  });
  selectionPanel.querySelector<HTMLSelectElement>("#production")!.addEventListener("change", (e) => {
    const [kind, id] = (e.target as HTMLSelectElement).value.split(":");
    const item = (kind === "wealth" ? { kind } : { kind, id }) as ProductionItem;
    run({ type: "setProduction", cityId: city.id, item });
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
  const { x, y } = screenToTile(camera, e.clientX - rect.left, e.clientY - rect.top, tileSize(), mapTilt());
  if (x < 0 || y < 0 || x >= state.map.width || y >= state.map.height) return null;
  return { x, y };
}

/**
 * On the tilted map cities and units stand up and reach into the lower part of the tile behind them.
 * A click there on an empty tile picks the city or unit that stands in front, so clicking the picture works.
 */
function standingTileFromEvent(e: MouseEvent): Point | null {
  const p = tileFromEvent(e);
  if (!p || mapTilt() === 1 || p.y + 1 >= state.map.height) return p;
  const rect = canvas.getBoundingClientRect();
  const rowY = camera.y + (e.clientY - rect.top) / (tileSize() * camera.zoom * mapTilt());
  if (rowY - p.y < 0.55) return p;
  const occupied = (q: Point) =>
    state.cities.some((c) => c.x === q.x && c.y === q.y && (c.owner === HUMAN || knownForeignCity(q))) ||
    state.units.some((u) => u.x === q.x && u.y === q.y && u.owner === HUMAN);
  const front = { x: p.x, y: p.y + 1 };
  return !occupied(p) && occupied(front) ? front : p;
}

// ---------- zoom and scrolling ----------

function setCamera(next: Camera): void {
  if (next.zoom === camera.zoom && next.x === camera.x && next.y === camera.y) return;
  camera = next;
  hoverTile = null;
  tooltip.hidden = true;
  updateZoomButtons();
  drawMap();
}

/** Zooms around a point given in CSS pixels on the canvas; the map centre when omitted. */
function zoomTo(zoom: number, px?: number, py?: number): void {
  const t = tileSize();
  const ax = px === undefined ? state.map.width / 2 : px / t;
  const ay = py === undefined ? state.map.height / 2 : py / (t * mapTilt());
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
    setCamera(panBy(camera, (e.deltaX * unit) / px, (e.deltaY * unit) / (px * mapTilt()), state.map));
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
  setCamera(panBy(camera, -dx / px, -dy / (px * mapTilt()), state.map));
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
  if (city) return cityScreen.open(city.id);
  const foreign = knownForeignCity(p);
  if (foreign) foreignCity.open(foreign.id);
});

// A right click (two-finger click on a trackpad) sends the selected unit anywhere, cities included.
canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const p = tileFromEvent(e);
  const unit = selectedUnit();
  if (!p || !unit || targetingUnitId !== null) return;
  if (unit.x === p.x && unit.y === p.y) return;
  moveSelected(p);
});

canvas.addEventListener("click", (e) => {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  const unit = selectedUnit();
  // With a unit selected a click gives it orders, so it goes exactly where the mouse is.
  const p = unit || targetingUnitId !== null ? tileFromEvent(e) : standingTileFromEvent(e);
  if (!p) return;
  if (targetingUnitId !== null) {
    const missile = targetingUnitId;
    targetingUnitId = null;
    return unitAction({ type: "detonate", unitId: missile, at: p });
  }
  if (unit && sendingUnitId === unit.id) {
    if (unit.x === p.x && unit.y === p.y) {
      sendingUnitId = null;
      say("");
      return refresh();
    }
    return moveSelected(p);
  }
  const myCity = state.cities.find((c) => c.x === p.x && c.y === p.y && c.owner === HUMAN);
  const myUnits = state.units.filter((u) => u.x === p.x && u.y === p.y && u.owner === HUMAN);

  // A selected unit steps onto any neighbouring tile, including own cities.
  if (unit && distance(unit, p) === 1) return moveSelected(p);
  // A foreign city further away opens its window; a right click or G sends the unit there.
  const foreignHere = knownForeignCity(p);
  if (foreignHere) return foreignCity.open(foreignHere.id);
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
  const ter = state.map.terrain[i]!;
  if (!known) {
    tooltip.textContent = t("[{x}, {y}] neprozkoumáno", p);
  } else {
    const city = state.cities.find((c) => c.x === p.x && c.y === p.y);
    const owner = state.cities.find((c) => c.owner === HUMAN && (c.x === p.x && c.y === p.y || c.worked.includes(i)));
    const y = owner ? cityTileYield(state, owner, i) : tileYield(state.map, i, city !== undefined);
    const extras = [
      state.map.road[i] ? t("cesta") : "",
      state.map.irrigation[i] ? t("zavlažování") : "",
      state.map.mine[i] ? t("důl") : "",
      state.map.railroad[i] ? t("železnice") : "",
      state.map.fortress[i] ? t("pevnost") : "",
      state.map.pollution[i] ? t("znečištění, dává polovinu") : "",
    ].filter(Boolean);
    const r = TERRAINS[ter];
    const special = r.special && state.map.special[i] ? ` · ${specialName(ter)}` : "";
    tooltip.innerHTML =
      `<b>${city ? escapeHtml(cityLabel(city.name)) + " · " : ""}${terrainName(ter)}${special}</b> [${p.x}, ${p.y}]<br>` +
      t("jídlo {food} · štíty {shields} · obchod {trade}", { food: y.food, shields: y.shields, trade: y.trade }) +
      (extras.length ? `<br>${extras.join(", ")}` : "") +
      (r.land ? `<br>${t("pohyb {cost}", { cost: r.moveCost })}${r.defenseBonus ? ` · ${t("obrana +{pct} %", { pct: r.defenseBonus })}` : ""}` : "") +
      foreignLine(p);
  }
  // Highlight the target and redraw only when the tile under the mouse changes.
  if (!hoverTile || hoverTile.x !== p.x || hoverTile.y !== p.y) {
    hoverTile = p;
    hoverRouteText = "";
    const unit = selectedUnit();
    const enemy = unit && distance(unit, p) === 1 ? attackHint(state, unit, p) : null;
    if (enemy) hoverRouteText = enemy;
    else if (unit && clickWouldMove(unit, p)) hoverRouteText = routeText(routeTo(unit, p));
    drawMap();
  }
  if (hoverRouteText) tooltip.insertAdjacentHTML("beforeend", `<br><span class="route">${hoverRouteText}</span>`);

  tooltip.hidden = false;
  const rect = mapWrap.getBoundingClientRect();
  tooltip.style.left = `${Math.min(e.clientX - rect.left + 14, rect.width - tooltip.offsetWidth - 4)}px`;
  tooltip.style.top = `${Math.min(e.clientY - rect.top + 14, rect.height - tooltip.offsetHeight - 4)}px`;
});

canvas.addEventListener("mouseleave", () => {
  tooltip.hidden = true;
  if (hoverTile) {
    hoverTile = null;
    drawMap();
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
  v: "clean",
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
  g: "send",
  k: "lay:road",
  a: "auto",
  c: "cancel",
  n: "next",
};

document.addEventListener("keydown", (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (techTree.isOpen() || cityScreenOpen() || empire.isOpen() || codex.isOpen() || attackDialog.isOpen() || newGameDialog.isOpen() || menus.isOpen() || citiesOverview.isOpen() || celebration.isOpen() || guide.isOpen() || nations.isOpen() || endScreen.isOpen() || foreignCity.isOpen()) return;
  if (e.key.toLowerCase() === "o") {
    e.preventDefault();
    return citiesOverview.open();
  }
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
    if (targetingUnitId !== null || sendingUnitId !== null) {
      targetingUnitId = null;
      sendingUnitId = null;
      sendMode = "goto";
      say("");
      return refresh();
    }
    if (selectedCityId !== null) return closeCity();
    if (selectedUnitId === null) {
      // Without preventDefault the browser treats this Escape as a request to close the dialog it just opened.
      e.preventDefault();
      return menus.openMenu();
    }
    selectedUnitId = null;
    refresh();
  }
});

endTurnButton.addEventListener("click", endTurn);
showAllBox.addEventListener("change", refresh);
mapViewSelect.addEventListener("change", () => {
  const flat = mapViewSelect.value === "flat";
  localStorage.setItem(MAP_VIEW_KEY, flat ? "flat" : "tilted");
  setTilt(flat ? 1 : MAP_TILT);
  document.body.classList.toggle("map-tilted", !flat);
  ctx = setupCanvas(canvas, state.map.width, state.map.height, fitTileSize());
  refresh();
});

const menus = createMenus($<HTMLElement>("#start-screen"), $<HTMLDialogElement>("#menu-dialog"), $<HTMLDialogElement>("#saves-dialog"), $<HTMLDialogElement>("#help-dialog"), {
  autosaveInfo: () => {
    const saved = readAutosave();
    return saved ? { civ: saved.state.players[HUMAN]!.civ as CivId, turn: saved.state.turn } : null;
  },
  continueGame: () => {
    const saved = readAutosave();
    if (saved) useGame(saved);
  },
  newGame: () => newGameDialog.open(),
  currentPayload: () => payloadOf(state, log),
  loadPayload: (payload) => {
    useGame(payload);
    say(t("Hra je nahraná: {civ}, tah {turn}.", { civ: civName(state.players[HUMAN]!.civ), turn: state.turn }));
  },
  openCodex: () => codex.open(),
  openAdvisor: () => advisor.show(),
  openScores: () => endScreen.open(),
  openCities: () => citiesOverview.open(),
  player: HUMAN,
});
$<HTMLButtonElement>("#menu-button").addEventListener("click", () => menus.openMenu());

// The event log folds into one line so the map stays visible.
const logPanel = $<HTMLElement>("#log-panel");
$<HTMLButtonElement>("#log-toggle").addEventListener("click", () => logPanel.classList.toggle("open"));

// ---------- minimap ----------

const MINI_COLORS: Record<string, string> = {
  ocean: "#2f6c9e",
  grassland: "#6aa84f",
  plains: "#b9a85a",
  forest: "#2f6b3a",
  hills: "#8c9a55",
  mountains: "#9a958c",
  desert: "#dcc98d",
  tundra: "#a3a888",
  arctic: "#e6eef2",
  jungle: "#25612a",
  swamp: "#5f6e45",
  river: "#4f8fc4",
};

function drawMinimap(): void {
  const w = state.map.width;
  const h = state.map.height;
  const scale = 5;
  const dpr = window.devicePixelRatio || 1;
  if (minimap.width !== w * scale * dpr) {
    minimap.width = w * scale * dpr;
    minimap.height = h * scale * dpr;
    minimap.style.width = `${w * scale}px`;
    minimap.style.height = `${h * scale}px`;
  }
  const g = minimap.getContext("2d")!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = PARCHMENT;
  g.fillRect(0, 0, w * scale, h * scale);
  const explored = state.players[HUMAN]!.explored;
  const all = showAllBox.checked;
  for (let i = 0; i < w * h; i++) {
    if (!all && !explored[i]) continue;
    g.fillStyle = MINI_COLORS[state.map.terrain[i]!] ?? "#555";
    g.fillRect((i % w) * scale, Math.floor(i / w) * scale, scale, scale);
  }
  for (const c of state.cities) {
    if (!all && !explored[c.y * w + c.x]) continue;
    g.fillStyle = CIVS[state.players[c.owner]!.civ].color;
    g.fillRect(c.x * scale - 1.5, c.y * scale - 1.5, scale + 3, scale + 3);
    g.strokeStyle = "#111";
    g.lineWidth = 1;
    g.strokeRect(c.x * scale - 1.5, c.y * scale - 1.5, scale + 3, scale + 3);
  }
  for (const u of state.units) {
    if (u.owner !== HUMAN) continue;
    g.fillStyle = u.id === selectedUnitId ? "#ffd84a" : "#f3efe6";
    g.fillRect(u.x * scale + 1.5, u.y * scale + 1.5, scale - 3, scale - 3);
  }
  // The part of the map the big view shows.
  g.strokeStyle = "#ffd84a";
  g.lineWidth = 1.5;
  g.strokeRect(camera.x * scale + 0.75, camera.y * scale + 0.75, (w / camera.zoom) * scale - 1.5, (h / camera.zoom) * scale - 1.5);
}

function minimapJump(e: PointerEvent): void {
  const rect = minimap.getBoundingClientRect();
  const tx = ((e.clientX - rect.left) / rect.width) * state.map.width;
  const ty = ((e.clientY - rect.top) / rect.height) * state.map.height;
  // Zoom in first when the whole map is shown, otherwise there is nowhere to move.
  const zoom = camera.zoom > 1 + 1e-6 ? camera.zoom : ZOOM_STEP * ZOOM_STEP;
  setCamera(clampCamera({ zoom, x: tx - state.map.width / zoom / 2, y: ty - state.map.height / zoom / 2 }, state.map));
}
let miniDrag = false;
minimap.addEventListener("pointerdown", (e) => {
  miniDrag = true;
  minimap.setPointerCapture(e.pointerId);
  minimapJump(e);
});
minimap.addEventListener("pointermove", (e) => {
  if (miniDrag) minimapJump(e);
});
minimap.addEventListener("pointerup", () => (miniDrag = false));

// ---------- start ----------

// Units and cities are painted sprites; anything without a sprite keeps its drawn figure.
function loadSprites(): void {
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

updateZoomButtons();
// The start screen covers a game: the saved one when there is one, otherwise a
// random placeholder that is never saved.
const saved = readAutosave();
if (saved) useGame(saved);
else startNewGame(randomSeed(), undefined, DEFAULT_WORLD_CHOICE, false);
menus.showStart();
loadSprites();
// Load the city pictures while the player looks at the map, so the city screen opens with them ready.
setTimeout(() => void loadCityArt(), 1500);
