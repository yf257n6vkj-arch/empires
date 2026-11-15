/**
 * The technology tree as a chart (like the poster that came with old strategy
 * games) and an encyclopedia page for every technology.
 */
import {
  BUILDINGS,
  canResearch,
  pathToTech,
  researchCost,
  TECH_IDS,
  TECHS,
  UNIT_TYPES,
  type BuildingId,
  type Player,
  type TechId,
  type UnitTypeId,
} from "../core";
import { buildingPortraitCanvas } from "./buildingArt";
import { ERA_NAMES, TECH_PAGES, techPicture, wikiUrl } from "./encyclopedia";
import { unitPortraitCanvas } from "./render";
import { ERA_COLORS, techIconSvg } from "./techIcons";
import { describeBuilding, escapeHtml } from "./texts";

export interface TreeHost {
  me(): Player;
  /** Science the empire collects per turn. */
  sciencePerTurn(): number;
  chooseResearch(tech: TechId): void;
  chooseGoal(tech: TechId): void;
}

type Unlock = { kind: "unit"; id: UnitTypeId } | { kind: "building"; id: BuildingId };

export function unlocksOf(tech: TechId): Unlock[] {
  return [
    ...Object.values(UNIT_TYPES)
      .filter((u) => u.requires === tech)
      .map((u) => ({ kind: "unit" as const, id: u.id })),
    ...Object.values(BUILDINGS)
      .filter((b) => b.requires === tech)
      .map((b) => ({ kind: "building" as const, id: b.id })),
  ];
}

export function unlockNames(tech: TechId): string[] {
  return unlocksOf(tech).map((u) =>
    u.kind === "unit" ? UNIT_TYPES[u.id].name : BUILDINGS[u.id].wonder ? `div ${BUILDINGS[u.id].name}` : BUILDINGS[u.id].name,
  );
}

/** Technologies that need `tech`. */
function leadsTo(tech: TechId): TechId[] {
  return TECH_IDS.filter((t) => TECHS[t].requires.includes(tech));
}

// ---------- layout ----------

const CARD_W = 178;
const CARD_H = 64;
const COL_GAP = 52;
const ROW_GAP = 14;
const PAD = 24;

interface Layout {
  pos: Record<TechId, { x: number; y: number; col: number }>;
  width: number;
  height: number;
}

/**
 * Columns follow the longest chain of prerequisites. Inside a column the
 * cards sit near the average height of what they need, which keeps most
 * arrows short and level.
 */
function computeLayout(): Layout {
  const col = {} as Record<TechId, number>;
  for (const t of TECH_IDS) col[t] = TECHS[t].requires.length ? 1 + Math.max(...TECHS[t].requires.map((r) => col[r])) : 0;
  const columns: TechId[][] = [];
  for (const t of TECH_IDS) (columns[col[t]] ??= []).push(t);
  const row = {} as Record<TechId, number>;
  for (const c of columns) c.forEach((t, i) => (row[t] = i));
  const children = (t: TechId) => leadsTo(t);
  const ROWS = Math.max(...columns.map((c) => c.length)) + 1;
  const mean = (xs: number[], fallback: number) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : fallback);

  const place = (c: TechId[], want: (t: TechId) => number) => {
    const sorted = [...c].sort((a, b) => want(a) - want(b) || TECH_IDS.indexOf(a) - TECH_IDS.indexOf(b));
    let last = -Infinity;
    for (const t of sorted) {
      row[t] = Math.max(0, Math.round(want(t) * 2) / 2, last + 1);
      last = row[t];
    }
    // Keep the chart within ROWS rows: push the bottom of the column back up.
    let limit = ROWS - 1;
    for (let k = sorted.length - 1; k >= 0; k--) {
      const t = sorted[k]!;
      row[t] = Math.min(row[t], limit);
      limit = row[t] - 1;
    }
  };
  for (let pass = 0; pass < 6; pass++) {
    for (let k = 1; k < columns.length; k++) {
      place(columns[k]!, (t) => mean(TECHS[t].requires.map((r) => row[r]), row[t]));
    }
    for (let k = columns.length - 2; k >= 0; k--) {
      place(columns[k]!, (t) => {
        const kids = children(t).filter((x) => col[x] === k + 1);
        return mean(kids.map((x) => row[x]), row[t]);
      });
    }
  }
  const minRow = Math.min(...TECH_IDS.map((t) => row[t]));
  const pos = {} as Layout["pos"];
  let maxRow = 0;
  for (const t of TECH_IDS) {
    const r = row[t] - minRow;
    maxRow = Math.max(maxRow, r);
    pos[t] = { x: PAD + col[t] * (CARD_W + COL_GAP), y: PAD + 26 + r * (CARD_H + ROW_GAP), col: col[t] };
  }
  return {
    pos,
    width: PAD * 2 + columns.length * (CARD_W + COL_GAP) - COL_GAP,
    height: PAD * 2 + 26 + (maxRow + 1) * (CARD_H + ROW_GAP),
  };
}

let layout: Layout | null = null;

// ---------- small glyphs for unlocks ----------

const GLYPH_UNIT = `<svg viewBox="0 0 16 16" width="13" height="13"><path d="M3 13L13 3M13 3h-3M13 3v3M13 13L3 3M3 3h3M3 3v3" stroke="#e8c27a" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
const GLYPH_BUILDING = `<svg viewBox="0 0 16 16" width="13" height="13"><path d="M2 8l6-5 6 5v6H2z" fill="#a9c4dc"/><rect x="6.5" y="9" width="3" height="5" fill="#2a2f36"/></svg>`;
const GLYPH_WONDER = `<svg viewBox="0 0 16 16" width="13" height="13"><path d="M8 1l2 4.2 4.6.6-3.4 3.2.9 4.5L8 11.3 3.9 13.5l.9-4.5L1.4 5.8 6 5.2z" fill="#f2cf6b"/></svg>`;

function unlockChip(u: Unlock): string {
  if (u.kind === "unit") return `<span class="chip">${GLYPH_UNIT}${escapeHtml(UNIT_TYPES[u.id].name)}</span>`;
  const b = BUILDINGS[u.id];
  return `<span class="chip ${b.wonder ? "wonder" : ""}">${b.wonder ? GLYPH_WONDER : GLYPH_BUILDING}${escapeHtml(b.name)}</span>`;
}

// ---------- tree ----------

/** Rows of the chart, for checking the layout outside the browser. */
export function techLayoutForTests(): Layout {
  return computeLayout();
}

export function createTechTree(host: TreeHost) {
  const dialog = document.querySelector<HTMLDialogElement>("#tech-dialog")!;
  const scroller = document.querySelector<HTMLDivElement>("#tech-tree")!;
  const status = document.querySelector<HTMLDivElement>("#tech-status")!;
  const page = document.querySelector<HTMLDialogElement>("#tech-page")!;
  let hovered: TechId | null = null;

  function stateOf(p: Player, t: TechId): "known" | "current" | "open" | "locked" {
    if (p.techs.includes(t)) return "known";
    if (p.researching === t) return "current";
    if (canResearch(p, t)) return "open";
    return "locked";
  }

  function turnsFor(p: Player, techs: TechId[]): string {
    const science = host.sciencePerTurn();
    if (science <= 0) return "";
    let need = -p.research;
    let known = p.techs.length;
    for (let k = 0; k < techs.length; k++) need += researchCost({ ...p, techs: new Array(known++).fill("pottery") });
    const turns = Math.max(1, Math.ceil(need / science));
    return `asi ${turns} ${turns === 1 ? "tah" : turns < 5 ? "tahy" : "tahů"}`;
  }

  /** Builds the chart once per opening; hovering only changes classes, so clicks are never lost. */
  function render(): void {
    layout ??= computeLayout();
    const edges: string[] = [];
    for (const t of TECH_IDS) {
      const to = layout.pos[t];
      for (const r of TECHS[t].requires) {
        const from = layout.pos[r];
        const x1 = from.x + CARD_W;
        const y1 = from.y + CARD_H / 2;
        const x2 = to.x;
        const y2 = to.y + CARD_H / 2;
        const mid = x1 + Math.min(COL_GAP * 0.75, (x2 - x1) / 2);
        edges.push(
          `<g data-from="${r}" data-to="${t}"><path d="M${x1} ${y1}C${mid} ${y1} ${mid} ${y2} ${x2 - 6} ${y2}"/><path class="head" d="M${x2 - 7} ${y2 - 4}L${x2} ${y2}L${x2 - 7} ${y2 + 4}z"/></g>`,
        );
      }
    }
    const eraLabels: string[] = [];
    for (let era = 1; era <= 5; era++) {
      const x = Math.min(...TECH_IDS.filter((t) => TECHS[t].era === era).map((t) => layout!.pos[t].x));
      eraLabels.push(`<div class="tt-era" style="left:${x}px;top:${PAD - 6}px;--era:${ERA_COLORS[era]}">${ERA_NAMES[era]}</div>`);
    }
    const cards = TECH_IDS.map((t) => {
      const { x, y } = layout!.pos[t];
      const chips = unlocksOf(t).map(unlockChip).join("");
      return `<button type="button" class="tt-card" data-tech="${t}" style="left:${x}px;top:${y}px">
        ${techIconSvg(t, TECHS[t].era, 46)}
        <span class="tt-body"><b>${escapeHtml(TECHS[t].name)}</b><span class="tt-chips">${chips}</span></span>
        <span class="tt-mark">✓</span>
      </button>`;
    }).join("");
    scroller.innerHTML = `<div class="tt-canvas" style="width:${layout.width}px;height:${layout.height}px">
      <svg class="tt-edges" width="${layout.width}" height="${layout.height}">${edges.join("")}</svg>
      ${eraLabels.join("")}${cards}</div>`;
    scroller.querySelectorAll<HTMLButtonElement>(".tt-card").forEach((b) => {
      const t = b.dataset.tech as TechId;
      b.addEventListener("click", () => openPage(t));
      b.addEventListener("mouseenter", () => {
        hovered = t;
        paint();
      });
      b.addEventListener("mouseleave", () => {
        if (hovered === t) {
          hovered = null;
          paint();
        }
      });
    });
    paint();
  }

  /** Colours cards and arrows by what the player knows, researches, aims at and points at. */
  function paint(): void {
    const p = host.me();
    const goalPath = new Set(p.researchGoal ? pathToTech(p, p.researchGoal) : p.researching ? [p.researching] : []);
    const hoverPath = new Set(hovered && !p.techs.includes(hovered) ? pathToTech(p, hovered) : []);
    scroller.querySelectorAll<HTMLButtonElement>(".tt-card").forEach((b) => {
      const t = b.dataset.tech as TechId;
      const st = stateOf(p, t);
      for (const k of ["known", "current", "open", "locked"]) b.classList.toggle(k, k === st);
      b.classList.toggle("on-goal", goalPath.has(t));
      b.classList.toggle("on-hover", hoverPath.has(t));
      b.classList.toggle("goal", p.researchGoal === t);
    });
    scroller.querySelectorAll<SVGGElement>(".tt-edges g").forEach((g) => {
      const r = g.dataset.from as TechId;
      const t = g.dataset.to as TechId;
      const done = (x: TechId, set: Set<TechId>) => set.has(x) || p.techs.includes(x);
      const cls =
        hoverPath.has(t) && done(r, hoverPath)
          ? "hover"
          : goalPath.has(t) && done(r, goalPath)
            ? "goal"
            : p.techs.includes(t)
              ? "known"
              : "";
      g.setAttribute("class", cls);
    });
    showStatus();
  }

  function showStatus(): void {
    const p = host.me();
    const parts: string[] = [];
    if (hovered && !p.techs.includes(hovered)) {
      const path = pathToTech(p, hovered);
      parts.push(
        `Na <b>${escapeHtml(TECHS[hovered].name)}</b> ${path.length === 1 ? "stačí jeden objev" : `potřebuješ ${path.length} objevů`}${turnsFor(p, path) ? `, ${turnsFor(p, path)}` : ""}.`,
      );
    } else if (p.researching) {
      parts.push(`Zkoumáš <b>${escapeHtml(TECHS[p.researching].name)}</b>.`);
      if (p.researchGoal) {
        const path = pathToTech(p, p.researchGoal);
        parts.push(`Míříš k <b>${escapeHtml(TECHS[p.researchGoal].name)}</b>, zbývá ${path.length} objevů, ${turnsFor(p, path)}.`);
      }
    } else {
      parts.push("Vyber, co se bude zkoumat. Klikni na technologii a přečti si o ní víc.");
    }
    parts.push(`<span class="muted">Známé technologie: ${p.techs.length} z ${TECH_IDS.length}</span>`);
    status.innerHTML = parts.join(" ");
  }

  function open(): void {
    hovered = null;
    render();
    dialog.showModal();
    // Start where the player is: the leftmost technology that can be researched.
    const p = host.me();
    const target = p.researching ?? TECH_IDS.find((t) => canResearch(p, t));
    if (target && layout) scroller.scrollLeft = Math.max(0, layout.pos[target].x - 260);
    else scroller.scrollLeft = 0;
  }

  // ---------- encyclopedia page ----------

  function openPage(t: TechId): void {
    const p = host.me();
    const info = TECH_PAGES[t];
    const rule = TECHS[t];
    const s = stateOf(p, t);
    const path = s === "known" ? [] : pathToTech(p, t);
    const action =
      s === "open"
        ? `<button type="button" class="primary" data-act="research">Zkoumat ${escapeHtml(rule.name)}${turnsFor(p, [t]) ? ` (${turnsFor(p, [t])})` : ""}</button>`
        : s === "locked"
          ? `<button type="button" class="primary" data-act="goal">${p.researchGoal === t ? "Tohle je tvůj cíl" : `Nastavit jako cíl výzkumu (${path.length} objevů${turnsFor(p, path) ? `, ${turnsFor(p, path)}` : ""})`}</button>`
          : s === "current"
            ? `<span class="tp-state">Právě se zkoumá.</span>`
            : `<span class="tp-state ok">Tuhle technologii už znáš.</span>`;
    const link = (x: TechId) =>
      `<button type="button" class="tp-link ${stateOf(p, x)}" data-go="${x}">${techIconSvg(x, TECHS[x].era, 26)}${escapeHtml(TECHS[x].name)}</button>`;
    const needs = rule.requires.map(link).join("") || `<span class="muted">Nic, s touhle technologií začínali už pravěcí lidé.</span>`;
    const next = leadsTo(t).map(link).join("") || `<span class="muted">Tady strom končí.</span>`;
    const unlocks = unlocksOf(t);
    const picture = techPicture(t);

    page.innerHTML = `
      <div class="tp">
        <div class="tp-picture ${picture ? "has-photo" : ""}" style="--era:${ERA_COLORS[rule.era]}">
          ${picture ? `<img class="tp-photo" src="${picture}" alt="${escapeHtml(rule.name)}"><div class="tp-medal small">${techIconSvg(t, rule.era, 64)}</div>` : `<div class="tp-medal">${techIconSvg(t, rule.era, 168)}</div>`}
          <div class="tp-when">${escapeHtml(info.when)}</div>
          <div class="tp-era">${ERA_NAMES[rule.era]}</div>
        </div>
        <div class="tp-main">
          <div class="tp-head"><h2>${escapeHtml(rule.name)}</h2><button type="button" class="tp-close" data-act="close" aria-label="Zavřít">×</button></div>
          <p class="tp-text">${escapeHtml(info.text)}</p>
          <div class="tp-fact"><b>Věděl jsi?</b> ${escapeHtml(info.fact)}</div>
          <h3>Co to přinese ve hře</h3>
          <div class="tp-unlocks">${
            unlocks.length
              ? unlocks
                  .map((u, k) => `<div class="tp-unlock" data-k="${k}"><div class="tp-portrait"></div><div>${unlockDetail(u)}</div></div>`)
                  .join("")
              : `<span class="muted">Sama nic neodemkne, ale bez ní se nedostaneš k dalším objevům.</span>`
          }</div>
          <div class="tp-tree">
            <div><h3>Co je potřeba předem</h3><div class="tp-links">${needs}</div></div>
            <div><h3>Kam vede dál</h3><div class="tp-links">${next}</div></div>
          </div>
          <div class="tp-foot">
            <a href="${wikiUrl(info.wiki)}" target="_blank" rel="noopener">Přečti si víc na Wikipedii: ${escapeHtml(info.wiki)} ↗</a>
            <span class="spacer"></span>${action}
          </div>
        </div>
      </div>`;
    unlocks.forEach((u, k) => {
      const slot = page.querySelector<HTMLDivElement>(`.tp-unlock[data-k="${k}"] .tp-portrait`);
      if (!slot) return;
      slot.append(u.kind === "unit" ? unitPortraitCanvas(u.id, 0, 76, 64) : buildingPortraitCanvas(u.id, 76, 64));
    });
    page.querySelector('[data-act="close"]')?.addEventListener("click", () => page.close());
    page.querySelector('[data-act="research"]')?.addEventListener("click", () => {
      host.chooseResearch(t);
      page.close();
      if (dialog.open) paint();
    });
    page.querySelector('[data-act="goal"]')?.addEventListener("click", () => {
      host.chooseGoal(t);
      openPage(t);
      if (dialog.open) paint();
    });
    page.querySelectorAll<HTMLButtonElement>("[data-go]").forEach((b) =>
      b.addEventListener("click", () => openPage(b.dataset.go as TechId)),
    );
    if (!page.open) page.showModal();
    page.scrollTop = 0;
  }

  function unlockDetail(u: Unlock): string {
    if (u.kind === "unit") {
      const r = UNIT_TYPES[u.id];
      return `<b>${escapeHtml(r.name)}</b><br><span class="muted">jednotka · útok ${r.attack}, obrana ${r.defense}, pohyb ${r.moves} · ${r.cost} štítů</span>`;
    }
    const b = BUILDINGS[u.id];
    return `<b>${b.wonder ? "Div světa " : ""}${escapeHtml(b.name)}</b><br><span class="muted">${escapeHtml(describeBuilding(b))}</span>`;
  }

  scroller.addEventListener(
    "wheel",
    (e) => {
      // A plain mouse wheel scrolls the wide chart sideways.
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey) {
        scroller.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    },
    { passive: false },
  );
  let drag: { x: number; y: number; left: number; top: number } | null = null;
  scroller.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest(".tt-card")) return;
    drag = { x: e.clientX, y: e.clientY, left: scroller.scrollLeft, top: scroller.scrollTop };
    scroller.setPointerCapture(e.pointerId);
  });
  scroller.addEventListener("pointermove", (e) => {
    if (!drag) return;
    scroller.scrollLeft = drag.left - (e.clientX - drag.x);
    scroller.scrollTop = drag.top - (e.clientY - drag.y);
  });
  scroller.addEventListener("pointerup", () => (drag = null));
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  page.addEventListener("click", (e) => {
    if (e.target === page) page.close();
  });
  document.querySelector("#tech-close")?.addEventListener("click", () => dialog.close());

  return {
    open,
    openPage,
    refresh(): void {
      if (dialog.open) paint();
    },
    isOpen: () => dialog.open || page.open,
  };
}
