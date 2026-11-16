/**
 * The owl's next instruction, one concrete step at a time: what to click or
 * which key to press, and what to highlight on the map or on the screen.
 * Pure: it reads the game, what is selected and open on the screen, and what
 * the owl has already taught, so it can be tested without a browser.
 */
import {
  BUILDINGS,
  bestWorkerTask,
  canFoundCity,
  combatOdds,
  distance,
  IMPROVEMENTS,
  playerView,
  productionOptions,
  sameItem,
  TECHS,
  UNIT_TYPES,
  type City,
  type CoachTask,
  type GameState,
  type ImprovementId,
  type Point,
  type ProductionItem,
  type TechId,
  type Unit,
} from "../core";
import { averageKnownValue, bestSite, reservedSites } from "../ai/settle";
import { at, frontier, landmasses } from "../ai/knowledge";
import { bestAttacker } from "../ai/war";
import { t } from "./i18n";
import { cityLabel, productionLabel, techName, unitName } from "./i18n/names";

export type StepTarget =
  | { kind: "unit"; unitId: number; at: Point }
  | { kind: "tile"; at: Point }
  | { kind: "city"; cityId: number; at: Point }
  /** A control on the screen; several CSS selectors separated by || are tried in order. */
  | { kind: "button"; selector: string }
  | { kind: "none" };

export interface Step {
  /** Stays the same while the owl waits for the same thing, so a change means the child did it. */
  id: string;
  text: string;
  target: StepTarget;
  /** Codex key for "Tell me about it", when the step is about one thing. */
  entry?: string;
}

export interface StepContext {
  state: GameState;
  me: number;
  selectedUnitId: number | null;
  selectedCityId: number | null;
  /** City whose screen is open, or null. */
  openCityId: number | null;
  /** The government dialog is open. */
  governmentOpen: boolean;
  /** Things the owl has taught and now only names: improvement ids, "auto", "fortify". */
  taught: string[];
  /** The first unfinished task of the plan, or null without a plan. */
  task: CoachTask | null;
  /** Technology the plan asks for, if any. */
  wantedTech: TechId | null;
}

/** The improvements the owl teaches one by one before she lets settlers work alone. */
const TEACH: ImprovementId[] = ["road", "irrigation", "mine", "railroad"];
const KEYS: Record<string, string> = { road: "R", irrigation: "I", mine: "M", railroad: "Z", fortress: "P" };

function needsOrders(u: Unit, me: number): boolean {
  return u.owner === me && u.movesLeft > 0 && !u.goto && !u.fortified && !u.work && !u.orders && u.carriedBy === null;
}

function improvementText(imp: ImprovementId): string {
  switch (imp) {
    case "road":
      return t("Stiskni R a osadník postaví cestu. Po cestě se chodí třikrát rychleji a políčko dá víc obchodu.");
    case "irrigation":
      return t("Stiskni I a osadník políčko zavlaží. Zavlažené políčko dá víc jídla a město poroste rychleji.");
    case "mine":
      return t("Stiskni M a osadník postaví důl. Důl dá víc štítů, takže město staví rychleji.");
    case "railroad":
      return t("Stiskni Z a osadník postaví železnici. Po železnici se jezdí zadarmo a políčko dá víc štítů.");
    default:
      return t("Stiskni {key} a osadník začne pracovat.", { key: KEYS[imp] ?? "" });
  }
}

/** Selects the unit first: "click on the settler", then the real step. */
function select(ctx: StepContext, u: Unit, then: () => Step): Step {
  if (ctx.selectedUnitId === u.id) return then();
  // A click on a city selects the city; units inside are picked in its panel.
  const city = ctx.state.cities.find((c) => c.x === u.x && c.y === u.y && c.owner === ctx.me);
  if (city) {
    if (ctx.selectedCityId === city.id) {
      return {
        id: `select-${u.id}`,
        text: t("V panelu vlevo klikni na Vybrat u jednotky {unit}.", { unit: unitName(u.type) }),
        target: { kind: "button", selector: `[data-unit="${u.id}"]` },
        entry: `unit-${u.type}`,
      };
    }
    return {
      id: `pick-${u.id}`,
      text: t("Ve městě {city} čeká jednotka {unit}. Klikni na to město.", { city: cityLabel(city.name), unit: unitName(u.type) }),
      target: { kind: "city", cityId: city.id, at: { x: city.x, y: city.y } },
      entry: `unit-${u.type}`,
    };
  }
  return {
    id: `select-${u.id}`,
    text: t("Klikni na jednotku {unit}, která bliká na mapě.", { unit: unitName(u.type) }),
    target: { kind: "unit", unitId: u.id, at: { x: u.x, y: u.y } },
    entry: `unit-${u.type}`,
  };
}

/** A production the plan asks for: which city and what. */
function planProduction(ctx: StepContext): { city: City; item: ProductionItem } | null {
  const s = ctx.state;
  const task = ctx.task;
  if (!task) return null;
  const cities = s.cities.filter((c) => c.owner === ctx.me).sort((a, b) => b.size - a.size || a.id - b.id);
  const can = (c: City, item: ProductionItem) => productionOptions(s, c).some((o) => sameItem(o, item));
  const producing = (item: ProductionItem) => cities.some((c) => sameItem(c.production, item));
  const pick = (want: (c: City) => ProductionItem | null): { city: City; item: ProductionItem } | null => {
    for (const c of cities) {
      const item = want(c);
      if (item && can(c, item) && !sameItem(c.production, item)) return { city: c, item };
    }
    return null;
  };
  switch (task.kind) {
    case "building":
    case "everyBig": {
      const b = task.building;
      const item: ProductionItem = { kind: "building", id: b };
      return pick((c) => (c.buildings.includes(b) || (task.kind === "everyBig" && c.size < task.minSize) ? null : item));
    }
    case "cities": {
      const settlers: ProductionItem = { kind: "unit", id: "settlers" };
      if (producing(settlers) || s.units.some((u) => u.owner === ctx.me && UNIT_TYPES[u.type].foundsCity && !u.orders && !u.work)) return null;
      return pick((c) => (c.size >= 2 ? settlers : null));
    }
    case "attackers": {
      const type = bestAttacker(playerView(s, ctx.me));
      const item: ProductionItem = { kind: "unit", id: type };
      if (producing(item)) return null;
      return pick(() => item);
    }
    case "wonders": {
      if (cities.some((c) => c.production.kind === "building" && BUILDINGS[c.production.id].wonder)) return null;
      const city = cities[0];
      if (!city) return null;
      const wonder = productionOptions(s, city).find((o) => o.kind === "building" && BUILDINGS[o.id].wonder);
      return wonder ? { city, item: wonder } : null;
    }
    default:
      return null;
  }
}

function itemKey(item: ProductionItem): string {
  return item.kind === "wealth" ? "wealth" : `${item.kind}:${item.id}`;
}

function itemEntry(item: ProductionItem): string | undefined {
  if (item.kind === "unit") return `unit-${item.id}`;
  if (item.kind === "building") return BUILDINGS[item.id].wonder ? `wdr-${item.id}` : `bld-${item.id}`;
  return undefined;
}

/** Steps for a city the plan wants to build something: click it, open it, choose the item. */
function cityProduction(ctx: StepContext, want: { city: City; item: ProductionItem }): Step {
  const { city, item } = want;
  const name = cityLabel(city.name);
  const what = productionLabel(item);
  const id = `build-${city.id}-${itemKey(item)}`;
  if (ctx.openCityId === city.id) {
    return {
      id: `${id}-choose`,
      text: t("Klikni na {item} a město to začne stavět.", { item: what }),
      target: { kind: "button", selector: `[data-item="${itemKey(item)}"]` },
      entry: itemEntry(item),
    };
  }
  if (ctx.selectedCityId === city.id) {
    return { id: `${id}-open`, text: t("Klikni na Otevřít město."), target: { kind: "button", selector: "[data-open-city]" } };
  }
  const why =
    item.kind === "unit" && UNIT_TYPES[item.id].foundsCity
      ? t("Potřebujeme další osadníky na nová města.")
      : item.kind === "building"
        ? t("Ve městě {city} by se hodila stavba {item}.", { city: name, item: what })
        : t("Město {city} by mělo postavit: {item}.", { city: name, item: what });
  return { id: `${id}-select`, text: `${why} ${t("Klikni na město {city}.", { city: name })}`, target: { kind: "city", cityId: city.id, at: { x: city.x, y: city.y } }, entry: itemEntry(item) };
}

function settlerStep(ctx: StepContext, u: Unit): Step | null {
  const s = ctx.state;
  const view = playerView(s, ctx.me);
  const land = landmasses(view);
  const site = bestSite(view, u, land, averageKnownValue(view), reservedSites(view, u.id));
  const cities = s.cities.filter((c) => c.owner === ctx.me).length;
  const founder = cities === 0 || (site !== null && ctx.task?.kind === "cities");
  if (founder) {
    const here = canFoundCity(s, u) === null;
    const sitePoint = site ? { x: site.i % s.map.width, y: Math.floor(site.i / s.map.width) } : null;
    const atSite = !sitePoint || (sitePoint.x === u.x && sitePoint.y === u.y) || (cities === 0 && here);
    if (atSite && here) {
      return select(ctx, u, () => ({
        id: `found-${u.id}`,
        text: cities === 0 ? t("Tady je dobré místo. Stiskni B a založ hlavní město.") : t("Tady je dobré místo. Stiskni B a založ nové město."),
        target: { kind: "button", selector: '[data-action="found"]' },
      }));
    }
    if (sitePoint) {
      return select(ctx, u, () => ({
        id: `walk-${u.id}-${sitePoint.x}-${sitePoint.y}`,
        text: t("Klikni na blikající políčko. Osadník tam dojde a založí tam město."),
        target: { kind: "tile", at: sitePoint },
      }));
    }
  }
  // A worker: teach each improvement once by hand, then let the settler work alone.
  const task = bestWorkerTask(s, u);
  const work = task && task.improvement !== "clean" ? (task.improvement as ImprovementId) : null;
  const known = (imp: ImprovementId) => !IMPROVEMENTS[imp].requires || s.players[ctx.me]!.techs.includes(IMPROVEMENTS[imp].requires as TechId);
  if (work && TEACH.includes(work) && !ctx.taught.includes(work) && known(work)) {
    if (task!.at.x !== u.x || task!.at.y !== u.y) {
      return select(ctx, u, () => ({
        id: `goto-work-${u.id}-${task!.at.x}-${task!.at.y}`,
        text: t("Klikni na blikající políčko. Osadník tam dojde a něco tam postaví."),
        target: { kind: "tile", at: task!.at },
      }));
    }
    return select(ctx, u, () => ({ id: `work-${u.id}-${work}`, text: improvementText(work), target: { kind: "button", selector: `[data-action="build:${work}"]` }, entry: `imp-${work}` }));
  }
  return select(ctx, u, () => ({
    id: `auto-${u.id}`,
    text: ctx.taught.includes("auto")
      ? t("Stiskni A a osadník bude pracovat sám.")
      : t("Teď už víš, co osadník umí. Stiskni A a bude stavět cesty, zavlažování a doly sám, kde je to nejvíc potřeba."),
    target: { kind: "button", selector: '[data-action="auto"]' },
  }));
}

function soldierStep(ctx: StepContext, u: Unit): Step {
  const s = ctx.state;
  const view = playerView(s, ctx.me);
  // A good attack right next to it.
  for (const f of view.foreignUnits) {
    if (distance(f, u) !== 1 || !s.players[ctx.me]!.atWar.includes(f.owner)) continue;
    const odds = combatOdds(s, u, f);
    if (odds && odds.winChance >= 0.7) {
      return select(ctx, u, () => ({
        id: `attack-${u.id}-${f.x}-${f.y}`,
        text: t("Vedle stojí nepřítel a máš velkou šanci vyhrát ({pct} %). Klikni na něj a potvrď útok.", { pct: Math.round(odds.winChance * 100) }),
        target: { kind: "tile", at: { x: f.x, y: f.y } },
      }));
    }
  }
  const city = s.cities.find((c) => c.x === u.x && c.y === u.y && c.owner === ctx.me);
  const defenders = (c: City) => s.units.filter((x) => x.owner === ctx.me && x.x === c.x && x.y === c.y && UNIT_TYPES[x.type].attack > 0 && UNIT_TYPES[x.type].domain === "land").length;
  // Early on, one soldier who is not needed at home explores, one at a time.
  // The scout is the oldest soldier out in the field; the others go home instead of all exploring.
  const scouting = s.units.some(
    (x) =>
      x.owner === ctx.me &&
      x.id !== u.id &&
      UNIT_TYPES[x.type].attack > 0 &&
      UNIT_TYPES[x.type].domain === "land" &&
      (x.goto !== null || (x.id < u.id && !s.cities.some((c) => c.x === x.x && c.y === x.y))),
  );
  if (s.turn < 50 && !scouting && (!city || defenders(city) > 1)) {
    const land = landmasses(view);
    const edge = frontier(view, true).filter((i) => land[i] === land[at(view, u)]);
    let best: Point | null = null;
    for (const i of edge) {
      const p = { x: i % view.width, y: Math.floor(i / view.width) };
      if (!best || distance(u, p) < distance(u, best)) best = p;
    }
    if (best) {
      return select(ctx, u, () => ({
        id: `explore-${u.id}`,
        text: t("Prozkoumej okolí. Klikni na blikající políčko na kraji tmy a voják tam dojde."),
        target: { kind: "tile", at: best! },
      }));
    }
  }
  if (city) {
    return select(ctx, u, () => ({
      id: `fortify-${u.id}`,
      text: ctx.taught.includes("fortify") ? t("Stiskni F a voják se ve městě opevní.") : t("Stiskni F a voják se ve městě opevní. Opevněný voják brání město o polovinu lépe."),
      target: { kind: "button", selector: '[data-action="fortify"]' },
    }));
  }
  // Out in the field: back to the nearest own city.
  const home = s.cities.filter((c) => c.owner === ctx.me).sort((a, b) => distance(a, u) - distance(b, u))[0];
  if (home) {
    return select(ctx, u, () => ({
      id: `home-${u.id}`,
      text: t("Pošli vojáka bránit město {city}. Klikni na to město pravým tlačítkem, na trackpadu dvěma prsty.", { city: cityLabel(home.name) }),
      target: { kind: "city", cityId: home.id, at: { x: home.x, y: home.y } },
    }));
  }
  return select(ctx, u, () => ({ id: `wait-${u.id}`, text: t("Stiskni mezerník a jednotka počká do dalšího tahu."), target: { kind: "button", selector: '[data-action="skip"]' } }));
}

/** The owl's next instruction, or null when there is nothing to say. */
export function nextStep(ctx: StepContext): Step | null {
  const s = ctx.state;
  const me = s.players[ctx.me];
  if (!me || me.defeated || s.victory) return null;

  // Inside a city: choose what the plan wants, or close the city again.
  const want = planProduction(ctx);
  if (ctx.openCityId !== null) {
    if (want && want.city.id === ctx.openCityId) return cityProduction(ctx, want);
    return { id: `close-${ctx.openCityId}`, text: t("Zavři město tlačítkem Zavřít nebo klávesou Esc."), target: { kind: "button", selector: ".cs-close" } };
  }

  // The scientists need a task.
  const hasCity = s.cities.some((c) => c.owner === ctx.me);
  if (hasCity && me.researching === null && Object.keys(TECHS).some((x) => !me.techs.includes(x as TechId))) {
    const tech = ctx.wantedTech;
    return {
      id: "research",
      text: tech ? t("Vyber, co budou vědci zkoumat. Doporučuju {tech}, klikni na něj vlevo.", { tech: techName(tech) }) : t("Vyber, co budou vědci zkoumat. Klikni na jeden z objevů vlevo."),
      target: { kind: "button", selector: tech ? `#research-pick [data-tech="${tech}"]||#research-pick [data-tech]` : "#research-pick [data-tech]" },
      entry: tech ? `tech:${tech}` : undefined,
    };
  }

  // A better government when the plan asks for one.
  if (ctx.task?.kind === "government") {
    const options = (["republic", "monarchy"] as const).filter((g) => me.techs.includes(g));
    if (options.length > 0 && !me.revolution) {
      const g = options[0]!;
      if (ctx.governmentOpen) return { id: `gov-${g}`, text: t("Klikni na Vyhlásit revoluci u vlády, kterou ti doporučuju."), target: { kind: "button", selector: `[data-gov="${g}"]` }, entry: `gov-${g}` };
      return { id: "gov-open", text: t("Je čas na lepší vládu. Klikni nahoře na tlačítko Vláda."), target: { kind: "button", selector: "#government" } };
    }
  }

  // Units waiting for orders: settlers first, then soldiers, then the rest.
  const waiting = s.units.filter((u) => needsOrders(u, ctx.me));
  const ordered = [
    ...waiting.filter((u) => u.id === ctx.selectedUnitId),
    ...waiting.filter((u) => u.id !== ctx.selectedUnitId && UNIT_TYPES[u.type].foundsCity),
    ...waiting.filter((u) => u.id !== ctx.selectedUnitId && !UNIT_TYPES[u.type].foundsCity),
  ];
  for (const u of ordered) {
    const rule = UNIT_TYPES[u.type];
    if (rule.foundsCity) {
      const step = settlerStep(ctx, u);
      if (step) return step;
    } else if (rule.domain === "land" && rule.attack > 0 && !rule.special) {
      return soldierStep(ctx, u);
    } else {
      return select(ctx, u, () => ({ id: `wait-${u.id}`, text: t("Tahle jednotka čeká na rozkaz. Když nevíš, co s ní, stiskni mezerník a počká."), target: { kind: "button", selector: '[data-action="skip"]' } }));
    }
  }

  // A city the plan wants to build something.
  if (want) return cityProduction(ctx, want);

  return { id: `end-${s.turn}`, text: t("Všechno je hotové. Stiskni Enter nebo klikni na Konec tahu."), target: { kind: "button", selector: "#end-turn" } };
}

/** Names for the praise after a done step. */
export function praise(n: number): string {
  const words = [t("Výborně!"), t("Skvěle!"), t("Přesně tak!"), t("Dobrá práce!")];
  return words[n % words.length]!;
}


/**
 * True when the child did what the step asked, read from the game and the
 * screen after the fact. Only a done step earns praise: picking another unit
 * changes the step too, but is no achievement.
 */
export function stepDone(step: Step, ctx: StepContext): boolean {
  const s = ctx.state;
  const parts = step.id.split("-");
  const unitOf = (n: string | undefined) => s.units.find((u) => u.id === Number(n));
  const kind = parts[0];
  switch (kind) {
    case "select":
      return ctx.selectedUnitId === Number(parts[1]);
    case "pick":
      return ctx.selectedCityId !== null || ctx.selectedUnitId === Number(parts[1]);
    case "found": {
      const u = unitOf(parts[1]);
      return !u;
    }
    case "walk":
    case "explore":
    case "home": {
      const u = unitOf(parts[1]);
      return !u || u.goto !== null || !needsOrders(u, ctx.me);
    }
    case "goto": {
      // goto-work-<unit>-x-y
      const u = unitOf(parts[2]);
      return !u || u.goto !== null || u.work !== null;
    }
    case "work": {
      const u = unitOf(parts[1]);
      return !!u && u.work !== null;
    }
    case "auto": {
      const u = unitOf(parts[1]);
      return !!u && u.orders?.kind === "auto";
    }
    case "fortify": {
      const u = unitOf(parts[1]);
      return !u || u.fortified;
    }
    case "attack": {
      const x = Number(parts[2]);
      const y = Number(parts[3]);
      return !s.units.some((f) => f.owner !== ctx.me && f.x === x && f.y === y);
    }
    case "wait": {
      const u = unitOf(parts[1]);
      return !u || u.movesLeft === 0;
    }
    case "build": {
      const city = s.cities.find((c) => c.id === Number(parts[1]));
      const stage = parts[parts.length - 1];
      const key = parts.slice(2, -1).join("-");
      if (!city) return false;
      if (stage === "select") return ctx.selectedCityId === city.id || ctx.openCityId === city.id;
      if (stage === "open") return ctx.openCityId === city.id;
      return itemKey(city.production) === key;
    }
    case "close":
      return ctx.openCityId === null;
    case "research":
      return s.players[ctx.me]?.researching !== null;
    case "gov":
      return parts[1] === "open" ? ctx.governmentOpen : !!s.players[ctx.me]?.revolution;
    default:
      return false;
  }
}
