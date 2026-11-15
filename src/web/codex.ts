/**
 * The encyclopedia of everything in the game besides technologies: units,
 * buildings, wonders, governments, terrain, improvements and nations. Every entry has
 * a picture, a short story for a curious child, a surprising fact, what it
 * does in the game and a link to the Czech Wikipedia.
 */
import {
  BUILDINGS,
  CIV_IDS,
  CIVS,
  GOVERNMENT_IDS,
  GOVERNMENTS,
  IMPROVEMENT_IDS,
  IMPROVEMENTS,
  TECHS,
  TERRAIN_IDS,
  TERRAINS,
  UNIT_TYPE_IDS,
  UNIT_TYPES,
  BUILDING_IDS,
  type TechId,
} from "../core";
import { buildingPortraitCanvas } from "./buildingArt";
import { CODEX_PAGES } from "./codexPages";
import { wikiUrl } from "./encyclopedia";
import { unitPortraitCanvas } from "./render";
import { techIconSvg } from "./techIcons";
import { describeBuilding, describeGovernment, describeUnit, escapeHtml } from "./texts";

export type EntryKind = "civ" | "lead" | "unit" | "bld" | "wdr" | "gov" | "ter" | "imp";

interface Entry {
  key: string;
  kind: EntryKind;
  id: string;
  name: string;
}

const PICTURES = import.meta.glob<string>("./codex/*.{webp,jpg,jpeg,png}", {
  eager: true,
  query: "?url",
  import: "default",
});

/** URL of the encyclopedia picture for an entry, or null when there is none yet. */
export function pictureOf(key: string): string | null {
  for (const [path, url] of Object.entries(PICTURES)) {
    if (path.split("/").pop()!.replace(/\.[a-z]+$/, "") === key) return url;
  }
  return null;
}

/** Key of the entry for a thing in the game, e.g. ("unit", "trireme") → "unit-trireme". */
export function entryKey(kind: "civ" | "unit" | "building" | "government" | "terrain" | "improvement", id: string): string {
  if (kind === "civ") return `civ-${id}`;
  if (kind === "unit") return `unit-${id}`;
  if (kind === "government") return `gov-${id}`;
  if (kind === "terrain") return `ter-${id}`;
  if (kind === "improvement") return `imp-${id}`;
  return BUILDINGS[id as keyof typeof BUILDINGS]?.wonder ? `wdr-${id}` : `bld-${id}`;
}

const CATEGORIES: { kind: EntryKind; title: string; entries: Entry[] }[] = [
  {
    kind: "unit",
    title: "Jednotky",
    entries: UNIT_TYPE_IDS.map((id) => ({ key: `unit-${id}`, kind: "unit" as const, id, name: UNIT_TYPES[id].name })),
  },
  {
    kind: "bld",
    title: "Budovy",
    entries: BUILDING_IDS.filter((id) => !BUILDINGS[id].wonder).map((id) => ({ key: `bld-${id}`, kind: "bld" as const, id, name: BUILDINGS[id].name })),
  },
  {
    kind: "wdr",
    title: "Divy světa",
    entries: BUILDING_IDS.filter((id) => BUILDINGS[id].wonder).map((id) => ({ key: `wdr-${id}`, kind: "wdr" as const, id, name: BUILDINGS[id].name })),
  },
  {
    kind: "gov",
    title: "Vlády",
    entries: GOVERNMENT_IDS.map((id) => ({ key: `gov-${id}`, kind: "gov" as const, id, name: GOVERNMENTS[id].name })),
  },
  {
    kind: "ter",
    title: "Terén",
    entries: TERRAIN_IDS.map((id) => ({ key: `ter-${id}`, kind: "ter" as const, id, name: TERRAINS[id].name })),
  },
  {
    kind: "imp",
    title: "Úpravy krajiny",
    entries: IMPROVEMENT_IDS.map((id) => ({ key: `imp-${id}`, kind: "imp" as const, id, name: IMPROVEMENTS[id].name })),
  },
  {
    kind: "civ",
    title: "Národy",
    entries: CIV_IDS.map((id) => ({ key: `civ-${id}`, kind: "civ" as const, id, name: CIVS[id].name })),
  },
  {
    kind: "lead",
    title: "Vládci",
    entries: CIV_IDS.map((id) => ({ key: `lead-${id}`, kind: "lead" as const, id, name: CIVS[id].leader })),
  },
];

const ALL: Entry[] = CATEGORIES.flatMap((c) => c.entries);

export function codexEntryCount(): number {
  return ALL.length;
}

/** Every entry that has no page text yet; the tests keep this list empty. */
export function codexMissingPages(): string[] {
  return ALL.filter((e) => !CODEX_PAGES[e.key]).map((e) => e.key);
}

export interface CodexHost {
  openTech(tech: TechId): void;
}

export function createCodex(dialog: HTMLDialogElement, host: CodexHost) {
  let current = ALL[0]!.key;
  let category: EntryKind = "unit";

  function techLink(t: TechId | null | undefined): string {
    if (!t) return `<span class="muted">jde od začátku hry</span>`;
    return `<button type="button" class="tp-link" data-tech="${t}">${techIconSvg(t, TECHS[t].era, 24)}${escapeHtml(TECHS[t].name)}</button>`;
  }

  function entryLink(key: string, label: string): string {
    return `<button type="button" class="tp-link" data-entry="${key}">${escapeHtml(label)}</button>`;
  }

  /** What the thing does in the game, with links to technologies and related entries. */
  function rules(e: Entry): string {
    const row = (label: string, value: string) => `<div class="cx-row"><span class="cx-label">${label}</span><span>${value}</span></div>`;
    if (e.kind === "unit") {
      const u = UNIT_TYPES[e.id as keyof typeof UNIT_TYPES];
      const next = u.obsoleteBy ? entryLink(`unit-${u.obsoleteBy}`, UNIT_TYPES[u.obsoleteBy].name) : "";
      const older = UNIT_TYPE_IDS.filter((o) => UNIT_TYPES[o].obsoleteBy === u.id).map((o) => entryLink(`unit-${o}`, UNIT_TYPES[o].name));
      return (
        row("Co umí", escapeHtml(describeUnit(u))) +
        row("Odemyká ji", techLink(u.requires)) +
        (u.requiresWonder ? row("Potřebuje div", entryLink(entryKey("building", u.requiresWonder), BUILDINGS[u.requiresWonder].name)) : "") +
        (next ? row("Povýšíš ji na", next) : "") +
        (older.length ? row("Povýšíš na ni", older.join(" ")) : "")
      );
    }
    if (e.kind === "bld" || e.kind === "wdr") {
      const b = BUILDINGS[e.id as keyof typeof BUILDINGS];
      return (
        row("Co dělá", escapeHtml(describeBuilding(b))) +
        row("Odemyká", techLink(b.requires)) +
        (b.requiresBuilding ? row("Potřebuje", entryLink(entryKey("building", b.requiresBuilding), BUILDINGS[b.requiresBuilding].name)) : "") +
        (b.obsoleteBy ? row("Přestane působit s", techLink(b.obsoleteBy)) : "")
      );
    }
    if (e.kind === "civ") {
      const c = CIVS[e.id as keyof typeof CIVS];
      const nature = { expansion: "rád zakládá nová města", war: "spoléhá na armádu", science: "sází na vědu a výzkum" }[c.personality];
      return (
        row("Vládce", entryLink(`lead-${c.id}`, c.leader)) +
        row("Barva", `<span class="cx-color" style="background:${c.color}"></span>`) +
        row("Když hraje počítač", nature) +
        row("První města", escapeHtml(c.cities.slice(0, 6).join(", ")))
      );
    }
    if (e.kind === "lead") {
      const c = CIVS[e.id as keyof typeof CIVS];
      return row("Ve hře vede", entryLink(`civ-${c.id}`, c.name)) + row("Hlavní město", escapeHtml(c.cities[0]!));
    }
    if (e.kind === "gov") {
      const g = GOVERNMENTS[e.id as keyof typeof GOVERNMENTS];
      return (
        row("Jak se pod ní žije", escapeHtml(describeGovernment(g))) +
        (g.id === "anarchy" ? row("Kdy přijde", "po každé revoluci") : row("Odemyká", techLink(g.requires)))
      );
    }
    if (e.kind === "ter") {
      const t = TERRAINS[e.id as keyof typeof TERRAINS];
      const works = IMPROVEMENT_IDS.filter((i) => IMPROVEMENTS[i].turns[t.id] !== undefined);
      return (
        row("Výnos", `jídlo ${t.food}, štíty ${t.shields}, obchod ${t.trade}`) +
        (t.land ? row("Pohyb", `stojí ${t.moveCost === 1 ? "jeden pohyb" : `${t.moveCost} pohyby`}${t.defenseBonus ? `, obrana +${t.defenseBonus} %` : ""}`) : row("Pohyb", "jen lodě a letadla")) +
        (works.length ? row("Osadník tu postaví", works.map((i) => entryLink(`imp-${i}`, IMPROVEMENTS[i].name)).join(" ")) : "")
      );
    }
    const imp = IMPROVEMENTS[e.id as keyof typeof IMPROVEMENTS];
    const where = TERRAIN_IDS.filter((t) => imp.turns[t] !== undefined)
      .map((t) => {
        const bonus = imp.bonus[t];
        const gain = bonus
          ? [bonus.food ? `+${bonus.food} jídla` : "", bonus.shields ? `+${bonus.shields} štíty` : "", bonus.trade ? `+${bonus.trade} obchodu` : ""].filter(Boolean).join(", ")
          : "";
        return `${TERRAINS[t].name.toLowerCase()} ${imp.turns[t]} tahů${gain ? ` (${gain})` : ""}`;
      })
      .join(" · ");
    const extra =
      e.id === "railroad"
        ? "staví se na cestu, přidá polovinu štítů a jízda po ní nic nestojí"
        : e.id === "fortress"
          ? "zdvojí obranu jednotek na políčku (začne platit s bojem ve fázi 3)"
          : e.id === "irrigation"
            ? "potřebuje vodu na sousedním políčku a nesnese se s dolem"
            : e.id === "mine"
              ? "nesnese se se zavlažováním"
              : "jednotky se po ní pohybují třikrát rychleji";
    return row("Co dělá", extra) + row("Kde a jak dlouho", escapeHtml(where)) + row("Odemyká", techLink(imp.requires ?? null));
  }

  function fallbackPicture(e: Entry): HTMLElement {
    if (e.kind === "unit") return unitPortraitCanvas(e.id as never, 0, 400, 300);
    if (e.kind === "bld" || e.kind === "wdr") return buildingPortraitCanvas(e.id as never, 400, 300);
    if (e.kind === "gov" || e.kind === "civ" || e.kind === "lead") return buildingPortraitCanvas("palace", 400, 300);
    const div = document.createElement("div");
    div.className = "cx-swatch";
    div.dataset.kind = e.id;
    return div;
  }

  function renderPage(): void {
    const e = ALL.find((x) => x.key === current) ?? ALL[0]!;
    const page = CODEX_PAGES[e.key];
    const pic = pictureOf(e.key);
    const host_ = dialog.querySelector<HTMLDivElement>(".cx-page")!;
    host_.innerHTML = `
      <div class="tp">
        <div class="tp-picture ${pic ? "has-photo" : ""}">
          ${pic ? `<img class="tp-photo" src="${pic}" alt="${escapeHtml(e.name)}">` : `<div class="cx-fallback"></div>`}
          ${page?.when ? `<div class="tp-when">${escapeHtml(page.when)}</div>` : ""}
          <div class="tp-era">${escapeHtml(CATEGORIES.find((c) => c.kind === e.kind)!.title)}</div>
        </div>
        <div class="tp-main">
          <div class="tp-head"><h2>${escapeHtml(e.name)}</h2><button type="button" class="tp-close" data-act="close" aria-label="Zavřít">×</button></div>
          ${page ? `<p class="tp-text">${escapeHtml(page.text)}</p><div class="tp-fact"><b>Věděl jsi?</b> ${escapeHtml(page.fact)}</div>` : ""}
          <h3>Ve hře</h3>
          <div class="cx-rules">${rules(e)}</div>
          ${page ? `<div class="tp-foot"><a href="${wikiUrl(page.wiki)}" target="_blank" rel="noopener">Přečti si víc na Wikipedii: ${escapeHtml(page.wiki)} ↗</a></div>` : ""}
        </div>
      </div>`;
    if (!pic) host_.querySelector(".cx-fallback")!.append(fallbackPicture(e));
    host_.querySelector('[data-act="close"]')?.addEventListener("click", () => dialog.close());
    host_.querySelectorAll<HTMLButtonElement>("[data-tech]").forEach((b) => b.addEventListener("click", () => host.openTech(b.dataset.tech as TechId)));
    host_.querySelectorAll<HTMLButtonElement>("[data-entry]").forEach((b) => b.addEventListener("click", () => show(b.dataset.entry!)));
    host_.scrollTop = 0;
  }

  function renderIndex(): void {
    const nav = dialog.querySelector<HTMLDivElement>(".cx-nav")!;
    const cat = CATEGORIES.find((c) => c.kind === category)!;
    nav.innerHTML =
      `<div class="cx-tabs">${CATEGORIES.map((c) => `<button type="button" class="${c.kind === category ? "on" : ""}" data-cat="${c.kind}">${c.title} <span class="muted">${c.entries.length}</span></button>`).join("")}</div>` +
      `<div class="cx-list">${cat.entries.map((e) => `<button type="button" class="${e.key === current ? "on" : ""}" data-key="${e.key}">${escapeHtml(e.name)}</button>`).join("")}</div>`;
    nav.querySelectorAll<HTMLButtonElement>("[data-cat]").forEach((b) =>
      b.addEventListener("click", () => {
        category = b.dataset.cat as EntryKind;
        current = CATEGORIES.find((c) => c.kind === category)!.entries[0]!.key;
        render();
      }),
    );
    nav.querySelectorAll<HTMLButtonElement>("[data-key]").forEach((b) => b.addEventListener("click", () => show(b.dataset.key!)));
  }

  function render(): void {
    if (!dialog.querySelector(".cx")) {
      dialog.innerHTML = `<div class="cx"><div class="cx-nav"></div><div class="cx-page"></div></div>`;
    }
    renderIndex();
    renderPage();
  }

  function show(key: string): void {
    const e = ALL.find((x) => x.key === key);
    if (!e) return;
    current = key;
    category = e.kind;
    render();
    if (!dialog.open) dialog.showModal();
  }

  return {
    open: () => show(current),
    show,
    isOpen: () => dialog.open,
  };
}
