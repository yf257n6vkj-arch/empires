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
  type CivId,
  type TechId,
} from "../core";
import { buildingPortraitCanvas } from "./buildingArt";
import { CODEX_PAGES, type CodexPage } from "./codexPages";
import { wikiUrl } from "./encyclopedia";
import { language, t, tn } from "./i18n";
import { GUIDE_KEYS, GUIDE_PAGES, guideNumbers, type GuideKey, type GuidePage } from "./guidePages";
import { factBox, moreParagraph, wireFacts } from "./pageExtras";
import {
  buildingName,
  cityLabel,
  civName,
  governmentName,
  improvementName,
  inSentence,
  leaderName,
  specialName,
  techName,
  terrainName,
  unitName,
} from "./i18n/names";
import { unitPortraitCanvas } from "./render";
import { techIconSvg } from "./techIcons";
import { describeBuilding, describeGovernment, describeUnit, escapeHtml } from "./texts";

export type EntryKind = "how" | "civ" | "lead" | "unit" | "bld" | "wdr" | "gov" | "ter" | "imp";

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

/** A page of the "How to play" chapter in the current language. */
export function guidePage(key: GuideKey): GuidePage {
  return language().guide?.[key] ?? GUIDE_PAGES[key];
}

const CATEGORIES: { kind: EntryKind; title: string; entries: Entry[] }[] = [
  {
    kind: "how",
    title: t("Jak hrát"),
    entries: GUIDE_KEYS.map((id) => ({ key: id, kind: "how" as const, id, name: guidePage(id).title })),
  },
  {
    kind: "unit",
    title: t("Jednotky"),
    entries: UNIT_TYPE_IDS.map((id) => ({ key: `unit-${id}`, kind: "unit" as const, id, name: unitName(id) })),
  },
  {
    kind: "bld",
    title: t("Budovy"),
    entries: BUILDING_IDS.filter((id) => !BUILDINGS[id].wonder).map((id) => ({ key: `bld-${id}`, kind: "bld" as const, id, name: buildingName(id) })),
  },
  {
    kind: "wdr",
    title: t("Divy světa"),
    entries: BUILDING_IDS.filter((id) => BUILDINGS[id].wonder).map((id) => ({ key: `wdr-${id}`, kind: "wdr" as const, id, name: buildingName(id) })),
  },
  {
    kind: "gov",
    title: t("Vlády"),
    entries: GOVERNMENT_IDS.map((id) => ({ key: `gov-${id}`, kind: "gov" as const, id, name: governmentName(id) })),
  },
  {
    kind: "ter",
    title: t("Terén"),
    entries: TERRAIN_IDS.map((id) => ({ key: `ter-${id}`, kind: "ter" as const, id, name: terrainName(id) })),
  },
  {
    kind: "imp",
    title: t("Úpravy krajiny"),
    entries: IMPROVEMENT_IDS.map((id) => ({ key: `imp-${id}`, kind: "imp" as const, id, name: improvementName(id) })),
  },
  {
    kind: "civ",
    title: t("Národy"),
    entries: CIV_IDS.map((id) => ({ key: `civ-${id}`, kind: "civ" as const, id, name: civName(id) })),
  },
  {
    kind: "lead",
    title: t("Vládci"),
    entries: CIV_IDS.map((id) => ({ key: `lead-${id}`, kind: "lead" as const, id, name: leaderName(id) })),
  },
];

const ALL: Entry[] = CATEGORIES.flatMap((c) => c.entries);

/** Number of entries with an encyclopedia page; the "How to play" chapter has its own texts. */
export function codexEntryCount(): number {
  return ALL.filter((e) => e.kind !== "how").length;
}

/** The page of an entry in the current language, falling back to Czech, with the link to its article. */
export function codexPage(key: string): { page: CodexPage; url: string } | null {
  const own = language().codex?.[key];
  if (own) return { page: own, url: wikiUrl(own.wiki, language().wikipedia ?? "cs") };
  const page = CODEX_PAGES[key];
  return page ? { page, url: wikiUrl(page.wiki) } : null;
}

/** Entry keys of the encyclopedia, for the tests. */
export function codexKeys(): string[] {
  return ALL.map((e) => e.key);
}

/** Every entry that has no page text yet; the tests keep this list empty. */
export function codexMissingPages(): string[] {
  return ALL.filter((e) => e.kind !== "how" && !CODEX_PAGES[e.key]).map((e) => e.key);
}

export interface CodexHost {
  openTech(tech: TechId): void;
}

export function createCodex(dialog: HTMLDialogElement, host: CodexHost) {
  let current = "unit-settlers";
  let category: EntryKind = "unit";

  function techLink(tech: TechId | null | undefined): string {
    if (!tech) return `<span class="muted">${t("jde od začátku hry")}</span>`;
    return `<button type="button" class="tp-link" data-tech="${tech}">${techIconSvg(tech, TECHS[tech].era, 24)}${escapeHtml(techName(tech))}</button>`;
  }

  function entryLink(key: string, label: string): string {
    return `<button type="button" class="tp-link" data-entry="${key}">${escapeHtml(label)}</button>`;
  }

  /** What the thing does in the game, with links to technologies and related entries. */
  function rules(e: Entry): string {
    const row = (label: string, value: string) => `<div class="cx-row"><span class="cx-label">${label}</span><span>${value}</span></div>`;
    if (e.kind === "unit") {
      const u = UNIT_TYPES[e.id as keyof typeof UNIT_TYPES];
      const next = u.obsoleteBy ? entryLink(`unit-${u.obsoleteBy}`, unitName(u.obsoleteBy)) : "";
      const older = UNIT_TYPE_IDS.filter((o) => UNIT_TYPES[o].obsoleteBy === u.id).map((o) => entryLink(`unit-${o}`, unitName(o)));
      return (
        row(t("Co umí"), escapeHtml(describeUnit(u))) +
        row(t("Odemyká ji"), techLink(u.requires)) +
        (u.requiresWonder ? row(t("Potřebuje div"), entryLink(entryKey("building", u.requiresWonder), buildingName(u.requiresWonder))) : "") +
        (next ? row(t("Povýšíš ji na"), next) : "") +
        (older.length ? row(t("Povýšíš na ni"), older.join(" ")) : "")
      );
    }
    if (e.kind === "bld" || e.kind === "wdr") {
      const b = BUILDINGS[e.id as keyof typeof BUILDINGS];
      return (
        row(t("Co dělá"), escapeHtml(describeBuilding(b))) +
        row(t("Odemyká"), techLink(b.requires)) +
        (b.requiresBuilding ? row(t("Potřebuje"), entryLink(entryKey("building", b.requiresBuilding), buildingName(b.requiresBuilding))) : "") +
        (b.obsoleteBy ? row(t("Přestane působit s"), techLink(b.obsoleteBy)) : "")
      );
    }
    if (e.kind === "civ") {
      const c = CIVS[e.id as CivId];
      const nature = { expansion: t("rád zakládá nová města"), war: t("spoléhá na armádu"), science: t("sází na vědu a výzkum") }[c.personality];
      return (
        row(t("Vládce"), entryLink(`lead-${c.id}`, leaderName(c.id))) +
        row(t("Barva"), `<span class="cx-color" style="background:${c.color}"></span>`) +
        row(t("Když hraje počítač"), nature) +
        row(t("První města"), escapeHtml(c.cities.slice(0, 6).map(cityLabel).join(", ")))
      );
    }
    if (e.kind === "lead") {
      const c = CIVS[e.id as CivId];
      return row(t("Vede národ"), entryLink(`civ-${c.id}`, civName(c.id))) + row(t("Hlavní město"), escapeHtml(cityLabel(c.cities[0]!)));
    }
    if (e.kind === "gov") {
      const g = GOVERNMENTS[e.id as keyof typeof GOVERNMENTS];
      return (
        row(t("Jak se pod ní žije"), escapeHtml(describeGovernment(g))) +
        (g.id === "anarchy" ? row(t("Kdy přijde"), t("po každé revoluci")) : row(t("Odemyká"), techLink(g.requires)))
      );
    }
    if (e.kind === "ter") {
      const ter = TERRAINS[e.id as keyof typeof TERRAINS];
      const works = IMPROVEMENT_IDS.filter((i) => IMPROVEMENTS[i].turns[ter.id] !== undefined);
      const sp = ter.special;
      return (
        row(t("Výnos"), t("jídlo {food}, štíty {shields}, obchod {trade}", ter)) +
        (ter.land
          ? row(t("Pohyb"), tn("stojí jeden pohyb|stojí {n} pohyby|stojí {n} pohybů", ter.moveCost) + (ter.defenseBonus ? t(", obrana +{pct} %", { pct: ter.defenseBonus }) : ""))
          : row(t("Pohyb"), t("jen lodě a letadla"))) +
        (sp
          ? row(
              t("Surovina"),
              t("{special}: {bonus}, objeví se jen na některých políčkách", { special: specialName(ter.id), bonus: [sp.food ? t("+{food} jídla", { food: sp.food }) : "", sp.shields ? t("+{shields} štíty", { shields: sp.shields }) : "", sp.trade ? t("+{trade} obchodu", { trade: sp.trade }) : ""].filter(Boolean).join(", ") }),
            )
          : "") +
        (ter.id === "river" ? row(t("Most"), t("cestu přes řeku postavíš, až objevíš stavbu mostů")) : "") +
        (works.length ? row(t("Osadník tu postaví"), works.map((i) => entryLink(`imp-${i}`, improvementName(i))).join(" ")) : "")
      );
    }
    const imp = IMPROVEMENTS[e.id as keyof typeof IMPROVEMENTS];
    const where = TERRAIN_IDS.filter((ter) => imp.turns[ter] !== undefined)
      .map((ter) => {
        const bonus = imp.bonus[ter];
        const gain = bonus
          ? [bonus.food ? t("+{food} jídla", { food: bonus.food }) : "", bonus.shields ? t("+{shields} štíty", { shields: bonus.shields }) : "", bonus.trade ? t("+{trade} obchodu", { trade: bonus.trade }) : ""].filter(Boolean).join(", ")
          : "";
        return tn("{terrain} {n} tah{gain}|{terrain} {n} tahy{gain}|{terrain} {n} tahů{gain}", imp.turns[ter] ?? 0, { terrain: inSentence(terrainName(ter)), gain: gain ? ` (${gain})` : "" });
      })
      .join(" · ");
    const extra =
      e.id === "railroad"
        ? t("staví se na cestu, přidá polovinu štítů a jízda po ní nic nestojí")
        : e.id === "fortress"
          ? t("zdvojí obranu jednotek na políčku, a když obránce padne, ostatní jednotky na políčku přežijí")
          : e.id === "irrigation"
            ? t("potřebuje vodu na sousedním políčku a nesnese se s dolem")
            : e.id === "mine"
              ? t("nesnese se se zavlažováním")
              : t("jednotky se po ní pohybují třikrát rychleji");
    return row(t("Co dělá"), extra) + row(t("Kde a jak dlouho"), escapeHtml(where)) + row(t("Odemyká"), techLink(imp.requires ?? null));
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

  function renderGuide(e: Entry): void {
    const page = guidePage(e.id as GuideKey);
    const numbers = guideNumbers();
    const paragraphs = page.text
      .split(/\n\s*\n/)
      .map((p) => `<p class="tp-text">${escapeHtml(p.trim()).replace(/\{(\w+)\}/g, (m, k: string) => (k in numbers ? String(numbers[k]) : m))}</p>`)
      .join("");
    const host_ = dialog.querySelector<HTMLDivElement>(".cx-page")!;
    host_.innerHTML = `
      <div class="tp">
        <div class="tp-picture cx-guide"><div class="cx-guide-icon">${page.icon}</div><div class="tp-era">${escapeHtml(t("Jak hrát"))}</div></div>
        <div class="tp-main">
          <div class="tp-head"><h2>${escapeHtml(page.title)}</h2><button type="button" class="tp-close" data-act="close" aria-label="${t("Zavřít")}">×</button></div>
          ${paragraphs}
        </div>
      </div>`;
    host_.querySelector('[data-act="close"]')?.addEventListener("click", () => dialog.close());
    host_.scrollTop = 0;
  }

  function renderPage(): void {
    const e = ALL.find((x) => x.key === current) ?? ALL[0]!;
    if (e.kind === "how") return renderGuide(e);
    const found = codexPage(e.key);
    const page = found?.page;
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
          <div class="tp-head"><h2>${escapeHtml(e.name)}</h2><button type="button" class="tp-close" data-act="close" aria-label="${t("Zavřít")}">×</button></div>
          ${page ? `<p class="tp-text">${escapeHtml(page.text)}</p>${moreParagraph(e.key)}${factBox(e.key, page.fact)}` : ""}
          <h3>${t("Ve hře")}</h3>
          <div class="cx-rules">${rules(e)}</div>
          ${found ? `<div class="tp-foot"><a href="${found.url}" target="_blank" rel="noopener">${t("Přečti si víc na Wikipedii: {title}", { title: escapeHtml(found.page.wiki) })} ↗</a></div>` : ""}
        </div>
      </div>`;
    if (!pic) host_.querySelector(".cx-fallback")!.append(fallbackPicture(e));
    wireFacts(host_);
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
