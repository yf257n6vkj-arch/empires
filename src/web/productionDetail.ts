/**
 * A detail card for one item in the city's production list: what the unit or
 * building is, its numbers, what it would change in this city right now and
 * buttons to build it or open its encyclopedia page.
 */
import {
  BUILDINGS,
  cityReport,
  productionCost,
  UNIT_TYPE_IDS,
  UNIT_TYPES,
  type BuildingId,
  type City,
  type GameState,
  type ProductionItem,
  type UnitRule,
} from "../core";
import { codexPage, entryKey, pictureOf } from "./codex";
import { t, tn } from "./i18n";
import { buildingName, productionLabel, unitName } from "./i18n/names";
import { describeBuilding, describeUnit, escapeHtml } from "./texts";

export type DetailItem = Exclude<ProductionItem, { kind: "wealth" }>;

/** Encyclopedia key of an item. */
export function detailEntry(o: DetailItem): string {
  return o.kind === "unit" ? entryKey("unit", o.id) : entryKey("building", o.id);
}

/** What a unit is good for, in a short sentence a young player understands. */
export function unitRole(u: UnitRule): string {
  if (u.foundsCity) return t("Zakládá nová města a umí zvelebovat krajinu.");
  if (u.buildsImprovements) return t("Staví cesty, zavlažování a doly. Bojovat neumí.");
  if (u.special === "diplomat") return t("Nebojuje. Jezdí do cizích měst zakládat velvyslanectví a krást objevy.");
  if (u.special === "caravan") return t("Nebojuje. Odveze zboží do jiného města a otevře obchodní cestu, nebo pomůže stavět div.");
  if (u.special === "nuclear") return t("Zničí všechno kolem cíle. Použít ji jde jen jednou.");
  if (u.domain === "sea") {
    if (u.capacity && u.attack <= 1) return t("Vozí jednotky po moři.");
    return u.capacity ? t("Bojuje na moři a uveze i jiné jednotky.") : t("Bojuje na moři a ostřeluje pobřeží.");
  }
  if (u.domain === "air") return t("Létá a útočí z výšky. Musí se včas vrátit do města.");
  if (u.attack === 0) return t("Neumí útočit.");
  const fast = u.moves >= 2 ? t(" Je rychlá, hodí se i na průzkum.") : "";
  if (u.defense > u.attack) return t("Dobře brání města. Na útok je slabá.") + fast;
  if (u.attack > u.defense) return t("Hodí se na útok. Ve městě se brání slabě, sama ho neubrání.") + fast;
  return t("Umí útočit i bránit.") + fast;
}

function sign(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/** What the building would change in this city now (or in all cities for wonders that act everywhere). */
export function buildingGain(state: GameState, city: City, id: BuildingId): string[] {
  const b = BUILDINGS[id];
  const cities = b.wonder && b.scope === "all" ? state.cities.filter((c) => c.owner === city.owner) : [city];
  const after: GameState = {
    ...state,
    cities: state.cities.map((c) => (c.id === city.id ? { ...c, buildings: [...c.buildings, id] } : c)),
  };
  const sum = (s: GameState) => {
    const total = { food: 0, shields: 0, science: 0, gold: 0, unhappy: 0, happy: 0, maxSize: 0 };
    for (const c of cities) {
      const r = cityReport(s, s.cities.find((x) => x.id === c.id)!);
      total.food += r.foodSurplus;
      total.shields += r.shieldSurplus;
      total.science += r.science;
      total.gold += r.gold;
      total.unhappy += r.happiness.unhappy;
      total.happy += r.happiness.happy;
      total.maxSize = Math.max(total.maxSize, r.maxSize);
    }
    return total;
  };
  const before = sum(state);
  const now = sum(after);
  const out: string[] = [];
  if (now.food !== before.food) out.push(t("{n} jídla za tah", { n: sign(now.food - before.food) }));
  if (now.shields !== before.shields) out.push(t("{n} štítů za tah", { n: sign(now.shields - before.shields) }));
  if (now.science !== before.science) out.push(t("{n} vědy za tah", { n: sign(now.science - before.science) }));
  if (now.gold !== before.gold) out.push(t("{n} zlata za tah", { n: sign(now.gold - before.gold) }));
  if (now.unhappy < before.unhappy) out.push(tn("o jednoho nespokojeného méně|o {n} nespokojené méně|o {n} nespokojených méně", before.unhappy - now.unhappy));
  if (now.happy > before.happy) out.push(tn("o jednoho šťastného víc|o {n} šťastné víc|o {n} šťastných víc", now.happy - before.happy));
  if (now.maxSize > before.maxSize && cities.length === 1) out.push(t("město poroste až na {n}", { n: now.maxSize }));
  return out;
}

function row(label: string, value: string): string {
  return `<div class="pd-row"><span class="pd-label">${label}</span><span>${value}</span></div>`;
}

/** The first one or two sentences of the encyclopedia story. */
function shortStory(key: string): string {
  const text = codexPage(key)?.page.text ?? "";
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  return sentences.slice(0, 2).join("").trim();
}

export interface DetailOptions {
  /** Turns to finish at the current production, null when the city makes no shields. */
  turnsLeft: number | null;
  /** The item is already being built or waits in the plan. */
  planned: boolean;
  /** The plan has no room left. */
  full: boolean;
  current: boolean;
}

export function detailHtml(state: GameState, city: City, o: DetailItem, opts: DetailOptions): string {
  const key = detailEntry(o);
  const story = shortStory(key);
  const cost = productionCost(o);
  const time = opts.turnsLeft ? tn("{n} tah|{n} tahy|{n} tahů", opts.turnsLeft) : t("město teď nevyrábí");
  const rows: string[] = [];
  let kind: string;
  if (o.kind === "unit") {
    const u = UNIT_TYPES[o.id];
    kind = t("Jednotka");
    rows.push(row(t("Na co je"), escapeHtml(unitRole(u))));
    const stats = t("útok {attack}, obrana {defense}, pohyb {moves}, životy {hp}", u);
    rows.push(row(t("Síla"), escapeHtml(stats) + (u.firepower > 1 ? escapeHtml(t(", palebná síla {fp}", { fp: u.firepower })) : "")));
    // What the unit does besides its numbers: the description without the numbers and firepower.
    const fp = u.firepower > 1 ? t("palebná síla {fp}", { fp: u.firepower }) : null;
    const extra = describeUnit(u, false)
      .replace(stats, "")
      .split(", ")
      .filter((x) => x && x !== fp);
    if (extra.length) rows.push(row(t("Umí"), escapeHtml(extra.join(", "))));
    const next = u.obsoleteBy;
    if (next) rows.push(row(t("Zastará"), escapeHtml(t("až budeš umět stavět jednotku {unit}", { unit: unitName(next) }))));
    const older = UNIT_TYPE_IDS.filter((x) => UNIT_TYPES[x].obsoleteBy === u.id);
    if (older.length) rows.push(row(t("Nahrazuje"), escapeHtml(older.map(unitName).join(", "))));
  } else {
    const b = BUILDINGS[o.id];
    kind = b.wonder ? t("Div světa") : t("Budova");
    rows.push(row(t("Co dělá"), escapeHtml(describeBuilding(b, false))));
    const gain = buildingGain(state, city, o.id);
    if (gain.length) rows.push(row(b.wonder && b.scope === "all" ? t("Tvým městům teď dá") : t("Tady teď dá"), `<b class="pos">${escapeHtml(gain.join(", "))}</b>`));
    if (b.requiresBuilding) rows.push(row(t("Potřebuje"), escapeHtml(buildingName(b.requiresBuilding))));
  }
  rows.push(row(t("Cena"), escapeHtml(t("{cost} štítů, hotovo za {time}", { cost, time }))));
  const button = opts.current
    ? `<button type="button" disabled>${t("Město to právě staví")}</button>`
    : `<button type="button" class="primary" data-pd-build>${t("Stavět teď")}</button>`;
  const add = `<button type="button" data-pd-add ${opts.planned || opts.full ? "disabled" : ""}>${opts.planned ? t("Už je v plánu") : t("Přidat do plánu")}</button>`;
  const pic = pictureOf(key);
  return `<div class="cs-detail">
    <div class="cs-about-head"><b>${escapeHtml(productionLabel(o))}</b><span class="muted small">${kind}</span><button type="button" class="tp-close" data-pd-close aria-label="${t("Zavřít")}">×</button></div>
    <div class="pd-body">
      <div class="pd-pic">${pic ? `<img src="${pic}" alt="">` : ""}</div>
      <div class="pd-text">${story ? `<p>${escapeHtml(story)}</p>` : ""}</div>
    </div>
    <div class="pd-rows">${rows.join("")}</div>
    <div class="pd-actions">${button}${add}<button type="button" data-pd-entry="${key}">${t("Celá stránka v encyklopedii")}</button></div>
  </div>`;
}
