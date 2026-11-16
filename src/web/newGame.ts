/**
 * The new game dialog: the player picks a nation and, if they like, the
 * world (size, shape, climate and so on) and a map code.
 */
import {
  CIV_IDS,
  CIVS,
  DEFAULT_WORLD_CHOICE,
  maxOpponents,
  parseGameCode,
  WORLD_OPTIONS,
  WORLD_RULES,
  type CivId,
  type WorldChoice,
} from "../core";
import { pictureOf } from "./codex";
import { escapeHtml } from "./texts";
import { t, tn } from "./i18n";
import { cityLabel, civName, leaderName, techName } from "./i18n/names";

export interface NewGameHost {
  start(seed: string, civ: CivId | undefined, world: WorldChoice): void;
  randomSeed(): string;
  /** Opens the encyclopedia page of a nation. */
  showNation(civ: CivId): void;
}

type SettingKey = keyof typeof WORLD_OPTIONS;

/** Names of the values of each setting, in the order of WORLD_OPTIONS. */
function valueLabel(key: SettingKey, value: string): string {
  const labels: Record<SettingKey, Record<string, string>> = {
    size: { small: t("Malý"), medium: t("Střední"), large: t("Velký") },
    shape: { continent: t("Kontinent"), islands: t("Kontinent s ostrovy") },
    land: { less: t("Méně"), normal: t("Normálně"), more: t("Víc") },
    temperature: { cool: t("Chladno"), temperate: t("Mírně"), warm: t("Teplo") },
    rainfall: { arid: t("Sucho"), normal: t("Normálně"), wet: t("Vlhko") },
    age: { young: t("Mladý"), normal: t("Střední"), old: t("Starý") },
    resources: { rare: t("Vzácné"), normal: t("Běžné"), abundant: t("Hojné") },
  };
  return labels[key][value] ?? value;
}

function settingTitle(key: SettingKey): string {
  const titles: Record<SettingKey, string> = {
    size: t("Velikost světa"),
    shape: t("Tvar světa"),
    land: t("Pevnina"),
    temperature: t("Teplota"),
    rainfall: t("Srážky"),
    age: t("Stáří světa"),
    resources: t("Suroviny"),
  };
  return titles[key];
}

function settingHint(key: SettingKey): string {
  const hints: Partial<Record<SettingKey, string>> = {
    land: t("Méně pevniny znamená při stejném počtu soupeřů větší tlačenici."),
    temperature: t("Chladný svět má víc tundry, teplý víc pouští a džunglí."),
    rainfall: t("Suchý svět má víc pouští a plání, vlhký víc lesů, bažin a řek."),
    age: t("Mladý svět má delší pohoří a víc hor, starý víc kopců a rovin."),
    resources: t("Kolik políček nese vzácnou surovinu, třeba ryby, koně nebo zlato."),
  };
  return hints[key] ?? "";
}

/** A small drawing of the world's shape. */
function shapePicture(shape: string): string {
  const continent = `<path d="M10 9 C 18 3, 34 4, 40 10 C 47 16, 44 26, 36 29 C 27 33, 14 31, 9 24 C 5 18, 5 13, 10 9 Z" fill="#7aa45a" stroke="#d8c890" stroke-width="1"/>`;
  const islands =
    shape === "islands"
      ? `<circle cx="5" cy="5" r="2.4" fill="#7aa45a"/><circle cx="47" cy="30" r="2.8" fill="#7aa45a"/><circle cx="48" cy="6" r="2" fill="#7aa45a"/><circle cx="4" cy="29" r="2.2" fill="#7aa45a"/>`
      : "";
  const scale = shape === "islands" ? `transform="translate(5 3.5) scale(0.8)"` : "";
  return `<svg class="ng-shape" viewBox="0 0 52 36" aria-hidden="true"><rect width="52" height="36" rx="4" fill="#2f5f86"/><g ${scale}>${continent}</g>${islands}</svg>`;
}

function opponentsLabel(n: number): string {
  return tn("{n} soupeř|{n} soupeři|{n} soupeřů", n);
}

/** One line about the chosen world, for the nation page. */
function worldSummary(choice: WorldChoice): string {
  const random = t("náhodně");
  const size = choice.size === "random" ? t("náhodná velikost") : valueLabel("size", choice.size).toLowerCase();
  const shape = choice.shape === "random" ? t("náhodný tvar") : valueLabel("shape", choice.shape).toLowerCase();
  const opponents =
    choice.opponents === "random" ? `${t("soupeři")} ${random}`
    : choice.opponents === "auto" ? (choice.size === "random" ? t("soupeři podle velikosti") : opponentsLabel(WORLD_RULES.sizes[choice.size].opponents))
    : opponentsLabel(choice.opponents);
  const changed = (["land", "temperature", "rainfall", "age", "resources"] as const).filter((k) => choice[k] !== DEFAULT_WORLD_CHOICE[k]).length;
  const more = changed ? `, ${tn("{n} další změna|{n} další změny|{n} dalších změn", changed)}` : "";
  return `${size}, ${shape}, ${opponents}${more}`;
}

const WORLD_KEY = "empires.world";

function loadChoice(): WorldChoice {
  try {
    const saved = JSON.parse(localStorage.getItem(WORLD_KEY) ?? "null") as Partial<WorldChoice> | null;
    if (!saved) return { ...DEFAULT_WORLD_CHOICE };
    const choice = { ...DEFAULT_WORLD_CHOICE };
    for (const key of Object.keys(WORLD_OPTIONS) as SettingKey[]) {
      const v = saved[key];
      if (v === "random" || (WORLD_OPTIONS[key] as readonly string[]).includes(v as string)) (choice as Record<string, unknown>)[key] = v;
    }
    const o = saved.opponents;
    if (o === "auto" || o === "random" || (typeof o === "number" && o >= 1 && o <= 5)) choice.opponents = o;
    return choice;
  } catch {
    return { ...DEFAULT_WORLD_CHOICE };
  }
}

function saveChoice(choice: WorldChoice): void {
  try {
    localStorage.setItem(WORLD_KEY, JSON.stringify(choice));
  } catch {
    // Storage may be unavailable; the choice just isn't remembered.
  }
}

export function createNewGameDialog(dialog: HTMLDialogElement, host: NewGameHost) {
  let chosen: CivId | "random" = "czechs";
  let world: WorldChoice = loadChoice();
  let view: "nations" | "world" = "nations";

  function setWorld(next: WorldChoice, firstGame: boolean): void {
    world = next;
    // Keep the number of opponents within what the size has room for.
    if (typeof world.opponents === "number" && world.size !== "random") world.opponents = Math.min(world.opponents, maxOpponents(world.size));
    saveChoice(world);
    render(firstGame);
  }

  function renderWorld(firstGame: boolean): void {
    const row = (key: SettingKey) => {
      const values = [...WORLD_OPTIONS[key], "random"] as string[];
      const buttons = values
        .map((v) => {
          const label = v === "random" ? t("Náhodně") : valueLabel(key, v);
          const size = key === "size" && v !== "random" ? `<span class="muted small">${WORLD_RULES.sizes[v as "small"].width} × ${WORLD_RULES.sizes[v as "small"].height}</span>` : "";
          const pic = key === "shape" && v !== "random" ? shapePicture(v) : "";
          return `<button type="button" class="ng-opt ${world[key] === v ? "on" : ""}" data-key="${key}" data-value="${v}">${pic}<span>${label}</span>${size}</button>`;
        })
        .join("");
      const hint = settingHint(key);
      return `<div class="ng-row"><div class="ng-label">${settingTitle(key)}${hint ? `<span class="muted small">${hint}</span>` : ""}</div><div class="ng-opts">${buttons}</div></div>`;
    };
    const max = world.size === "random" ? 5 : maxOpponents(world.size);
    const autoCount = world.size === "random" ? null : WORLD_RULES.sizes[world.size].opponents;
    const opponentButtons = [
      `<button type="button" class="ng-opt ${world.opponents === "auto" ? "on" : ""}" data-opponents="auto"><span>${t("Podle velikosti")}</span>${autoCount ? `<span class="muted small">${autoCount}</span>` : ""}</button>`,
      ...Array.from({ length: max }, (_, k) => k + 1).map((n) => `<button type="button" class="ng-opt ng-num ${world.opponents === n ? "on" : ""}" data-opponents="${n}"><span>${n}</span></button>`),
      `<button type="button" class="ng-opt ${world.opponents === "random" ? "on" : ""}" data-opponents="random"><span>${t("Náhodně")}</span></button>`,
    ].join("");
    const islandsNote =
      world.shape === "islands" || world.shape === "random"
        ? `<p class="muted small ng-note">${t("Všichni začínají na kontinentu. Na ostrovy se dostaneš jen lodí a první loď postavíš po objevení technologie {tech}.", { tech: escapeHtml(techName("mapMaking")) })}</p>`
        : "";
    const advancedChanged = (["land", "temperature", "rainfall", "age", "resources"] as const).some((k) => world[k] !== DEFAULT_WORLD_CHOICE[k]);
    dialog.innerHTML = `
      <div class="ng">
        <div class="dialog-head"><h2>${t("Nastav si svět")}</h2></div>
        <p class="muted">${t("Výchozí svět odpovídá jedné partii na večer. Větší svět a víc soupeřů partii prodlouží.")}</p>
        ${row("size")}
        <div class="ng-row"><div class="ng-label">${t("Počet soupeřů")}<span class="muted small">${t("Na malý svět se vejdou nejvýš 3, na střední 4 a na velký 5.")}</span></div><div class="ng-opts">${opponentButtons}</div></div>
        ${row("shape")}
        ${islandsNote}
        <details class="ng-more" ${advancedChanged ? "open" : ""}>
          <summary>${t("Další nastavení")}</summary>
          ${row("land")}${row("temperature")}${row("rainfall")}${row("age")}${row("resources")}
        </details>
        <div class="ng-foot">
          <button type="button" data-act="surprise">${t("Překvap mě")}</button>
          <button type="button" data-act="default">${t("Výchozí svět")}</button>
          <span class="ng-chosen"></span>
          <button type="button" class="primary" data-act="done">${t("Hotovo")}</button>
        </div>
      </div>`;
    dialog.querySelectorAll<HTMLButtonElement>("[data-key]").forEach((b) =>
      b.addEventListener("click", () => {
        const details = dialog.querySelector<HTMLDetailsElement>(".ng-more");
        const keepOpen = details?.open ?? false;
        setWorld({ ...world, [b.dataset.key!]: b.dataset.value }, firstGame);
        const again = dialog.querySelector<HTMLDetailsElement>(".ng-more");
        if (again && keepOpen) again.open = true;
      }),
    );
    dialog.querySelectorAll<HTMLButtonElement>("[data-opponents]").forEach((b) =>
      b.addEventListener("click", () => {
        const v = b.dataset.opponents!;
        setWorld({ ...world, opponents: v === "auto" || v === "random" ? v : Number(v) }, firstGame);
      }),
    );
    dialog.querySelector('[data-act="surprise"]')!.addEventListener("click", () => {
      setWorld({ size: "random", opponents: "random", shape: "random", land: "random", temperature: "random", rainfall: "random", age: "random", resources: "random" }, firstGame);
    });
    dialog.querySelector('[data-act="default"]')!.addEventListener("click", () => setWorld({ ...DEFAULT_WORLD_CHOICE }, firstGame));
    dialog.querySelector('[data-act="done"]')!.addEventListener("click", () => {
      view = "nations";
      render(firstGame);
      dialog.querySelector<HTMLButtonElement>('[data-act="start"]')?.focus();
    });
  }

  function render(firstGame: boolean): void {
    if (view === "world") {
      renderWorld(firstGame);
      return;
    }
    const card = (id: CivId | "random") => {
      if (id === "random") {
        return `<button type="button" class="ng-card ng-random ${chosen === id ? "on" : ""}" data-civ="random">
          <span class="ng-pic ng-dice">?</span><b>${t("Náhodný národ")}</b><span class="muted small">${t("nech to na osudu")}</span></button>`;
      }
      const c = CIVS[id];
      const pic = pictureOf(`civ-${id}`);
      return `<button type="button" class="ng-card ${chosen === id ? "on" : ""}" data-civ="${id}" style="--civ:${c.color}">
        <span class="ng-pic" ${pic ? `style="background-image:url('${pic}')"` : ""}></span>
        <b>${escapeHtml(civName(id))}</b><span class="muted small">${escapeHtml(leaderName(id))}</span></button>`;
    };
    const c = chosen === "random" ? null : chosen;
    dialog.innerHTML = `
      <div class="ng">
        <div class="dialog-head"><h2>${firstGame ? t("Vyber si národ") : t("Nová hra")}</h2>${firstGame ? "" : `<button type="button" class="tp-close" data-act="close" aria-label="${t("Zavřít")}">×</button>`}</div>
        <p class="muted">${t("Národy se liší jménem, vládcem, barvou a jmény měst. Žádný nemá zvláštní výhody, stejně jako v Civilizaci 1. Soupeři dostanou národy v jiných barvách.")}</p>
        <div class="ng-grid">${[...CIV_IDS, "random" as const].map(card).join("")}</div>
        <div class="ng-foot">
          <div class="ng-chosen">${
            c
              ? `${t("Hraješ za národ <b>{civ}</b> a vládne {leader}, první město bude {capital}.", { civ: escapeHtml(civName(c)), leader: escapeHtml(leaderName(c)), capital: escapeHtml(cityLabel(CIVS[c].cities[0]!)) })} <button type="button" class="linklike" data-act="read">${t("Přečíst o národu")}</button>`
              : t("Národ hra vybere náhodně.")
          }</div>
          <div class="ng-world">${shapePicture(world.shape === "random" ? "continent" : world.shape)}<span>${t("Svět")}: <b>${escapeHtml(worldSummary(world))}</b></span> <button type="button" data-act="world">${t("Nastavit svět")}</button></div>
          <label class="ng-seed" title="${t("Kód mapy s nastavením světa, třeba z jiné partie, má přednost před nastavením.")}">${t("Kód mapy")} <input type="text" spellcheck="false" placeholder="${t("náhodný")}" data-seed></label>
          <button type="button" class="primary" data-act="start">${t("Začít hru")}</button>
        </div>
      </div>`;
    dialog.querySelectorAll<HTMLButtonElement>("[data-civ]").forEach((b) =>
      b.addEventListener("click", () => {
        chosen = b.dataset.civ as CivId | "random";
        render(firstGame);
        dialog.querySelector<HTMLButtonElement>('[data-act="start"]')?.focus();
      }),
    );
    dialog.querySelector('[data-act="close"]')?.addEventListener("click", () => dialog.close());
    dialog.querySelector('[data-act="world"]')?.addEventListener("click", () => {
      view = "world";
      render(firstGame);
    });
    dialog.querySelector('[data-act="read"]')?.addEventListener("click", () => {
      if (chosen !== "random") host.showNation(chosen);
    });
    dialog.querySelector('[data-act="start"]')!.addEventListener("click", () => {
      const typed = dialog.querySelector<HTMLInputElement>("[data-seed]")!.value.trim();
      const seed = typed && parseGameCode(typed).seed ? typed : host.randomSeed();
      dialog.close();
      host.start(seed, chosen === "random" ? undefined : chosen, world);
    });
  }

  return {
    open(firstGame = false): void {
      view = "nations";
      render(firstGame);
      // The very first game cannot be dismissed: there is nothing behind it yet.
      dialog.oncancel = firstGame ? (e) => e.preventDefault() : null;
      dialog.showModal();
      dialog.querySelector<HTMLButtonElement>('[data-act="start"]')?.focus();
    },
    isOpen: () => dialog.open,
  };
}
