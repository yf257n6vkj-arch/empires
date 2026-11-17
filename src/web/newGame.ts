/**
 * The new game dialog: the player picks a nation and, if they like, the
 * world (size, shape, climate and so on) and a map code.
 */
import {
  CIV_IDS,
  type BarbarianLevel,
  type Difficulty,
  DIFFICULTIES,
  CIVS,
  DEFAULT_WORLD_CHOICE,
  maxOpponents,
  parseGameCode,
  WORLD_OPTIONS,
  WORLD_RULES,
  RULES,
  type CivId,
  type GameSpeed,
  type WorldChoice,
} from "../core";
import { codexPage, pictureOf } from "./codex";
import { escapeHtml } from "./texts";
import { t, tn } from "./i18n";
import { cityLabel, civName, leaderName, techName } from "./i18n/names";

export interface NewGameHost {
  start(seed: string, civ: CivId | undefined, world: WorldChoice, barbarians: BarbarianLevel, difficulty: Difficulty, speed: GameSpeed): void;
  randomSeed(): string;
  /** Opens an encyclopedia page, e.g. "civ-czechs" or "lead-czechs". */
  showEntry(key: string): void;
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
const BARBARIANS_KEY = "empires.barbarians";
const BARBARIAN_LEVELS: BarbarianLevel[] = ["none", "few", "many"];

function loadBarbarians(): BarbarianLevel {
  try {
    const v = localStorage.getItem(BARBARIANS_KEY) as BarbarianLevel | null;
    return v && BARBARIAN_LEVELS.includes(v) ? v : "few";
  } catch {
    return "few";
  }
}

const SPEED_KEY = "empires.speed";
const SPEEDS: GameSpeed[] = ["quick", "normal"];

function loadSpeed(): GameSpeed {
  try {
    const v = localStorage.getItem(SPEED_KEY) as GameSpeed | null;
    return v && SPEEDS.includes(v) ? v : "normal";
  } catch {
    return "normal";
  }
}

export function speedLabel(speed: GameSpeed): string {
  return speed === "quick" ? t("Rychlá") : t("Normální");
}

function speedHint(speed: GameSpeed): string {
  const turns = RULES.speeds[speed].maxTurns;
  return speed === "quick"
    ? t("Hra skončí po {turns} tazích a zabere asi 25 minut. Svět je malý a soupeři dva, výzkum i stavby jdou rychleji všem stejně.", { turns })
    : t("Hra skončí po {turns} tazích a vydrží na celý večer.", { turns });
}

const DIFFICULTY_KEY = "empires.difficulty";

function loadDifficulty(): Difficulty {
  try {
    const v = localStorage.getItem(DIFFICULTY_KEY) as Difficulty | null;
    return v && DIFFICULTIES.includes(v) ? v : "normal";
  } catch {
    return "normal";
  }
}

export function difficultyLabel(level: Difficulty): string {
  switch (level) {
    case "veryEasy":
      return t("velmi snadná");
    case "easy":
      return t("snadná");
    case "normal":
      return t("normální");
    case "hard":
      return t("těžká");
    case "veryHard":
      return t("velmi těžká");
  }
}

function difficultyHint(level: Difficulty): string {
  const l = RULES.difficulty.levels[level];
  switch (level) {
    case "veryEasy":
      return t("Soupeři nikdy nezačnou válku, založí nejvýš {n} měst a útočí jen s velkou převahou. Na první hry.", { n: l.ai.cityLimit });
    case "easy":
      return t("Soupeři válčí málokdy, založí nejvýš {n} měst a útočí opatrně.", { n: l.ai.cityLimit });
    case "normal":
      return t("Soupeři hrají naplno a podle stejných pravidel jako ty. Nic nepodvádějí.");
    case "hard":
      return t("Soupeři hrají naplno a jejich města mají o {food} % víc jídla a o {shields} % víc štítů.", { food: l.foodPct, shields: l.shieldsPct });
    case "veryHard":
      return t("Města soupeřů mají o {food} % víc jídla a o {shields} % víc štítů a každý soupeř začíná s osadníkem navíc.", { food: l.foodPct, shields: l.shieldsPct });
  }
}

function barbarianLabel(level: BarbarianLevel): string {
  return level === "none" ? t("žádní") : level === "few" ? t("málo") : t("hodně");
}

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
  let barbarians: BarbarianLevel = loadBarbarians();
  let difficulty: Difficulty = loadDifficulty();
  let speed: GameSpeed = loadSpeed();
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
        <div class="ng-row"><div class="ng-label">${t("Délka hry")}<span class="muted small">${escapeHtml(speedHint(speed))}</span></div><div class="ng-opts">${SPEEDS.map((s) => `<button type="button" class="ng-opt ${speed === s ? "on" : ""}" data-speed="${s}"><span>${speedLabel(s)}</span><span class="muted small">${tn("{n} tah|{n} tahy|{n} tahů", RULES.speeds[s].maxTurns)}</span></button>`).join("")}</div></div>
        ${row("size")}
        <div class="ng-row"><div class="ng-label">${t("Počet soupeřů")}<span class="muted small">${t("Na malý svět se vejdou nejvýš 3, na střední 4 a na velký 5.")}</span></div><div class="ng-opts">${opponentButtons}</div></div>
        ${row("shape")}
        ${islandsNote}
        <div class="ng-row"><div class="ng-label">${t("Obtížnost")}<span class="muted small">${escapeHtml(difficultyHint(difficulty))}</span></div><div class="ng-opts">${DIFFICULTIES.map((l) => `<button type="button" class="ng-opt ${difficulty === l ? "on" : ""}" data-difficulty="${l}"><span>${difficultyLabel(l)}</span></button>`).join("")}</div></div>
        <div class="ng-row"><div class="ng-label">${t("Barbaři")}<span class="muted small">${t("Objevují se v divočině a u pobřeží a dobývají města. Pár jich vyleze i z ruin.")}</span></div><div class="ng-opts">${BARBARIAN_LEVELS.map((l) => `<button type="button" class="ng-opt ${barbarians === l ? "on" : ""}" data-barbarians="${l}"><span>${barbarianLabel(l)}</span></button>`).join("")}</div></div>
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
    dialog.querySelectorAll<HTMLButtonElement>("[data-speed]").forEach((b) =>
      b.addEventListener("click", () => {
        const next = b.dataset.speed as GameSpeed;
        if (next === speed) return;
        speed = next;
        try {
          localStorage.setItem(SPEED_KEY, speed);
        } catch {
          // Not remembered without storage.
        }
        // A quick game wants a small world, a normal one the standard size.
        setWorld({ ...world, size: speed === "quick" ? "small" : DEFAULT_WORLD_CHOICE.size, opponents: "auto" }, firstGame);
      }),
    );
    dialog.querySelector('[data-act="default"]')!.addEventListener("click", () => {
      barbarians = "few";
      difficulty = "normal";
      speed = "normal";
      try {
        localStorage.setItem(SPEED_KEY, speed);
      } catch {
        // Not remembered without storage.
      }
      setWorld({ ...DEFAULT_WORLD_CHOICE }, firstGame);
    });
    dialog.querySelectorAll<HTMLButtonElement>("[data-difficulty]").forEach((b) =>
      b.addEventListener("click", () => {
        difficulty = b.dataset.difficulty as Difficulty;
        try {
          localStorage.setItem(DIFFICULTY_KEY, difficulty);
        } catch {
          // Not remembered without storage.
        }
        render(firstGame);
      }),
    );
    dialog.querySelectorAll<HTMLButtonElement>("[data-barbarians]").forEach((b) =>
      b.addEventListener("click", () => {
        barbarians = b.dataset.barbarians as BarbarianLevel;
        try {
          localStorage.setItem(BARBARIANS_KEY, barbarians);
        } catch {
          // Not remembered without storage.
        }
        render(firstGame);
      }),
    );
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
    // What the encyclopedia says about the nation and its leader, right next to the choice.
    const about = (key: string, title: string, subtitle: string, more: string) => {
      const page = codexPage(key)?.page;
      const pic = pictureOf(key);
      return `<div class="ng-about">
        <div class="ng-about-head">${pic ? `<img src="${pic}" alt="">` : ""}<div><b>${escapeHtml(title)}</b><span class="muted small">${escapeHtml(subtitle)}${page?.when ? ` · ${escapeHtml(page.when)}` : ""}</span></div></div>
        ${page ? `<p>${escapeHtml(page.text)}</p>` : ""}
        <button type="button" class="linklike" data-read="${key}">${more}</button>
      </div>`;
    };
    const info = c
      ? about(`civ-${c}`, civName(c), t("národ"), t("Celá stránka o národu")) + about(`lead-${c}`, leaderName(c), t("vládce"), t("Celá stránka o vládci"))
      : `<div class="ng-about"><p class="muted">${t("Národ vybere hra náhodně, až začneš. Kdo to bude, zjistíš na první mapě.")}</p></div>`;
    dialog.innerHTML = `
      <div class="ng">
        <div class="dialog-head"><h2>${firstGame ? t("Vyber si národ") : t("Nová hra")}</h2>${firstGame ? "" : `<button type="button" class="tp-close" data-act="close" aria-label="${t("Zavřít")}">×</button>`}</div>
        <p class="muted">${t("Národy se liší jménem, vládcem, barvou a jmény měst. Žádný nemá zvláštní výhody, stejně jako v klasické hře, ze které tahle vychází. Soupeři dostanou národy v jiných barvách.")}</p>
        <div class="ng-body">
          <div class="ng-grid">${[...CIV_IDS, "random" as const].map(card).join("")}</div>
          <aside class="ng-info">${info}</aside>
        </div>
        <div class="ng-foot">
          <div class="ng-chosen">${
            c
              ? `${t("Hraješ za národ <b>{civ}</b> a vládne {leader}, první město bude {capital}.", { civ: escapeHtml(civName(c)), leader: escapeHtml(leaderName(c)), capital: escapeHtml(cityLabel(CIVS[c].cities[0]!)) })}`
              : t("Národ hra vybere náhodně.")
          }</div>
          <div class="ng-world">${shapePicture(world.shape === "random" ? "continent" : world.shape)}<span>${t("Svět")}: <b>${escapeHtml(worldSummary(world))}</b> · ${t("obtížnost")} <b>${escapeHtml(difficultyLabel(difficulty))}</b> · <b>${tn("{n} tah|{n} tahy|{n} tahů", RULES.speeds[speed].maxTurns)}</b></span> <button type="button" data-act="world">${t("Nastavit svět")}</button></div>
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
    dialog.querySelectorAll<HTMLButtonElement>("[data-read]").forEach((b) => b.addEventListener("click", () => host.showEntry(b.dataset.read!)));
    dialog.querySelector('[data-act="start"]')!.addEventListener("click", () => {
      const typed = dialog.querySelector<HTMLInputElement>("[data-seed]")!.value.trim();
      const seed = typed && parseGameCode(typed).seed ? typed : host.randomSeed();
      dialog.close();
      host.start(seed, chosen === "random" ? undefined : chosen, world, barbarians, difficulty, speed);
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
