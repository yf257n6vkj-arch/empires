/**
 * The children's guide: an owl who replaces the advisor when the player
 * switches her on. She keeps a plan for the way to win the child chose
 * (core/coach.ts), tells stories from the encyclopedia at the right moments
 * on small cards and explains what each new thing means for the game.
 *
 * Settings live in the browser: whether cards come for everything or only
 * for important moments, and the owl's name. The chosen way to win and the
 * cards already seen are kept per game.
 */
import {
  BUILDINGS,
  CIVS,
  currentStage,
  leaderboardRank,
  planProgress,
  playerView,
  RULES,
  scoreOf,
  TECHS,
  UNIT_TYPES,
  VICTORY_PATHS,
  type BuildingId,
  type CivId,
  type CoachTask,
  type GameEvent,
  type GameState,
  type PlayerView,
  type StageProgress,
  type TechId,
  type UnitTypeId,
  type VictoryPath,
} from "../core";
import { unlocks } from "./advisorPanel";
import { codexPage, entryKey, pictureOf } from "./codex";
import { techPage, techPicture } from "./encyclopedia";
import { t, tn } from "./i18n";
import { buildingName, cityLabel, civName, inSentence, leaderName, techName, unitName } from "./i18n/names";
import { owlHtml, type OwlMood } from "./owl";
import { unitRole } from "./productionDetail";
import { describeBuilding, escapeHtml } from "./texts";

export interface GuideHost {
  state(): GameState;
  player(): number;
  openEntry(key: string): void;
  openTech(tech: TechId): void;
  openTechTree(): void;
  openGovernment(): void;
}

const SETTINGS_KEY = "empires.guide.settings";
const GAME_KEY = "empires.guide.game.";

interface Settings {
  /** Cards for everything, or only for important moments. */
  volume: "all" | "important";
  /** The owl's name; empty for the default. */
  name: string;
}

interface GameMemory {
  path: VictoryPath | null;
  /** Keys of things the owl has already told a story about. */
  seen: string[];
  /** Index of the stage the owl last talked about. */
  stage: number;
}

interface Card {
  important: boolean;
  mood: OwlMood;
  title: string;
  /** Entry for the picture and the "whole page" button: a codex key or "tech:<id>". */
  entry?: string;
  story?: string;
  fact?: string;
  /** What it means for the game now; may contain markup. */
  game?: string;
  /** Replaces the usual buttons: the choice of a way to win. */
  choosePath?: boolean;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...(JSON.parse(raw) as T) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Without storage the guide forgets at the next page load.
  }
}

/** The first sentences of a story, for a short card. */
function firstSentences(text: string, n: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  return sentences.slice(0, n).join("").trim();
}

export function pathName(path: VictoryPath): string {
  return path === "conquest" ? t("Dobyvatel") : path === "space" ? t("Vědec") : t("Budovatel");
}

function pathText(path: VictoryPath): string {
  switch (path) {
    case "conquest":
      return t("Postavíš silnou armádu a dobudeš města soupeřů. Vyhraješ, až zůstaneš jediný. Soupeři se ale budou bránit.");
    case "space":
      return t("Postavíš knihovny a univerzity a jako první pošleš loď k cizí hvězdě. Je to nejtěžší cesta, do {turns} tahů ji stihneš jen s hodně rychlou vědou.", { turns: RULES.maxTurns });
    case "score":
      return t("Postavíš velká spokojená města a divy světa a poznáš hodně objevů. Vyhraješ, když budeš mít po posledním tahu nejvyšší skóre.");
  }
}

export function stageName(path: VictoryPath, id: string): string {
  const names: Record<string, string> = {
    expand: t("Rozšiř říši"),
    army: t("Připrav armádu"),
    firstCity: t("Dobuď první město"),
    firstRival: t("Poraz prvního soupeře"),
    world: t("Ovládni svět"),
    schools: t("Postav školy"),
    science: t("Zrychli vědu"),
    apollo: t("Program Apollo"),
    launch: t("Vypusť loď"),
    content: t("Spokojená města"),
    wonder: t("První div"),
    grow: t("Velká říše"),
    first: t("Buď první"),
  };
  return names[id] ?? `${pathName(path)} ${id}`;
}

/** What one task asks, as a short line for the checklist. */
export function taskLabel(task: CoachTask): string {
  switch (task.kind) {
    case "cities":
      return tn("Měj {n} město|Měj {n} města|Měj {n} měst", task.n);
    case "techs":
      return tn("Poznej {n} objev|Poznej {n} objevy|Poznej {n} objevů", task.n);
    case "citizens":
      return tn("Měj ve městech dohromady {n} obyvatele|Měj ve městech dohromady {n} obyvatele|Měj ve městech dohromady {n} obyvatel", task.n);
    case "attackers":
      return tn("Měj {n} útočnou jednotku|Měj {n} útočné jednotky|Měj {n} útočných jednotek", task.n);
    case "captured":
      return tn("Dobuď {n} nepřátelské město|Dobuď {n} nepřátelská města|Dobuď {n} nepřátelských měst", task.n);
    case "defeated":
      return tn("Poraz {n} národ|Poraz {n} národy|Poraz {n} národů", task.n);
    case "wonders":
      return tn("Postav {n} div světa|Postav {n} divy světa|Postav {n} divů světa", task.n);
    case "rank":
      return t("Buď první v žebříčku");
    case "knows":
      return t("Objev {tech}", { tech: techName(task.tech) });
    case "building":
      return task.n === 1
        ? t("Postav {building}", { building: inSentence(buildingName(task.building)) })
        : tn("Postav {building} v {n} městě|Postav {building} ve {n} městech|Postav {building} v {n} městech", task.n, { building: inSentence(buildingName(task.building)) });
    case "everyBig":
      return t("Postav {building} v každém městě od {size} obyvatel", { building: inSentence(buildingName(task.building)), size: task.minSize });
    case "government":
      return t("Zaveď lepší vládu, než je despocie");
    case "apollo":
      return t("Počkej na program Apollo, nebo ho postav sám");
    case "launched":
      return t("Vypusť vesmírnou loď");
    case "conquest":
      return t("Poraz všechny soupeře");
  }
}

/** How to get a task done, for a child who is behind. */
export function taskHint(task: CoachTask): string {
  switch (task.kind) {
    case "cities":
      return t("Stav osadníky ve městech, která mají aspoň dva obyvatele, a zakládej nová města tři až čtyři políčka od starých.");
    case "techs":
      return t("Postav ve městech knihovny a posuň nahoře posuvník Věda doprava.");
    case "citizens":
      return t("Nech osadníky zavlažovat louky kolem měst a stav sýpky. Přes {size} obyvatel město pustí až akvadukt.", { size: RULES.maxCitySize });
    case "attackers":
      return t("Útočník má útok vyšší než obranu, třeba lučištník, jezdec nebo legionář. Stav je ve městě s kasárnami, pak z nich budou veteráni.");
    case "captured":
      return t("Vyber nejbližší nepřátelské město. Shromáždi útočníky na políčku vedle něj a zaútoč, až má každý šanci aspoň 60 %. Národu musíš nejdřív vyhlásit válku.");
    case "defeated":
      return t("Národ prohraje, když přijde o poslední město. Dobývej jeho města jedno po druhém a začni tím nejbližším.");
    case "wonders":
      return t("Div stav v městě, které má nejvíc štítů. Karavany z jiných měst můžou se stavbou pomoct.");
    case "rank":
      return t("Skóre dávají obyvatelé, šťastní obyvatelé, objevy a divy. V žebříčku uvidíš, kdo je před tebou.");
    case "knows":
      return t("Otevři strom technologií a vyber {tech} jako cíl, vědci k němu půjdou sami.", { tech: techName(task.tech) });
    case "building":
    case "everyBig":
      return t("Ve městě otevři výběr výroby a dej stavbu {building} na začátek plánu. Když máš dost zlata, můžeš ji koupit.", { building: inSentence(buildingName(task.building)) });
    case "government":
      return t("Objev monarchii a v okně Vláda vyhlas revoluci. Despocie bere výnos bohatým políčkům.");
    case "apollo":
      return t("Program Apollo je div, který potřebuje objev Vesmírné lety. Jakmile ho kdokoli postaví, můžou všichni stavět vesmírné lodě.");
    case "launched":
      return t("Stav díly lodi ve více městech najednou a vypusť loď, až bude mít aspoň tři moduly.");
    case "conquest":
      return t("Dobývej jedno město za druhým. Každé dobyté město ti dá zlato a často i nový objev.");
  }
}

export function createGuide(host: GuideHost) {
  let settings: Settings = load(SETTINGS_KEY, { volume: "all", name: "" });
  const queue: Card[] = [];
  let showing = false;

  const dialog = document.createElement("dialog");
  dialog.className = "guide-card";
  document.body.append(dialog);
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    next();
  });

  function name(): string {
    return settings.name.trim() || t("Sova");
  }

  function gameKey(): string {
    const s = host.state();
    return `${GAME_KEY}${s.seed}:${s.players[host.player()]?.civ ?? ""}`;
  }

  function memory(): GameMemory {
    return load(gameKey(), { path: null, seen: [], stage: 0 });
  }

  function remember(m: GameMemory): void {
    save(gameKey(), m);
  }

  /** True the first time a key is seen in this game. */
  function firstTime(key: string): boolean {
    const m = memory();
    if (m.seen.includes(key)) return false;
    m.seen.push(key);
    remember(m);
    return true;
  }

  function view(): PlayerView {
    return playerView(host.state(), host.player());
  }

  // ---------- cards ----------

  function push(card: Card): void {
    if (!card.important && settings.volume === "important") return;
    queue.push(card);
    if (!showing) next();
  }

  function next(): void {
    const card = queue.shift();
    if (!card) {
      showing = false;
      if (dialog.open) dialog.close();
      return;
    }
    showing = true;
    renderCard(card);
    if (!dialog.open) dialog.showModal();
  }

  function picture(entry: string | undefined): string | null {
    if (!entry) return null;
    if (entry.startsWith("tech:")) return techPicture(entry.slice(5) as TechId);
    return pictureOf(entry);
  }

  function renderCard(card: Card): void {
    const pic = picture(card.entry);
    const left = queue.length;
    const paths = card.choosePath
      ? `<div class="gc-paths">${VICTORY_PATHS.map(
          (p) => `<button type="button" class="gc-path" data-path="${p}"><b>${escapeHtml(pathName(p))}</b><span>${escapeHtml(pathText(p))}</span></button>`,
        ).join("")}</div>`
      : "";
    dialog.innerHTML = `
      <div class="gc">
        <div class="gc-owl">${owlHtml(card.mood, 110)}<span class="gc-name">${escapeHtml(name())}</span></div>
        <div class="gc-body">
          <h2>${escapeHtml(card.title)}</h2>
          ${
            card.story || pic
              ? `<div class="gc-main">${pic ? `<img src="${pic}" alt="">` : ""}<div>${card.story ? `<p>${escapeHtml(card.story)}</p>` : ""}${card.fact ? `<p class="gc-fact"><b>${t("Víš, že…")}</b> ${escapeHtml(card.fact)}</p>` : ""}</div></div>`
              : ""
          }
          ${card.game ? `<div class="gc-game"><b>${t("Pro tvou hru:")}</b> ${card.game}</div>` : ""}
          ${paths}
          <div class="gc-actions">
            ${card.entry ? `<button type="button" data-gc="entry">${t("Celá stránka v encyklopedii")}</button>` : ""}
            ${left > 0 ? `<button type="button" data-gc="skip">${tn("Přeskočit další kartu|Přeskočit další {n} karty|Přeskočit dalších {n} karet", left)}</button>` : ""}
            ${card.choosePath ? `<button type="button" data-gc="later">${t("Vyberu později")}</button>` : `<button type="button" class="primary" data-gc="ok">${left > 0 ? t("Další") : t("Rozumím")}</button>`}
          </div>
        </div>
      </div>`;
    dialog.querySelector('[data-gc="ok"]')?.addEventListener("click", next);
    dialog.querySelector('[data-gc="later"]')?.addEventListener("click", next);
    dialog.querySelector('[data-gc="skip"]')?.addEventListener("click", () => {
      queue.length = 0;
      next();
    });
    dialog.querySelector('[data-gc="entry"]')?.addEventListener("click", () => {
      const e = card.entry!;
      if (e.startsWith("tech:")) host.openTech(e.slice(5) as TechId);
      else host.openEntry(e);
    });
    dialog.querySelectorAll<HTMLButtonElement>("[data-path]").forEach((b) =>
      b.addEventListener("click", () => {
        choosePath(b.dataset.path as VictoryPath);
        next();
      }),
    );
  }

  // ---------- the way to win ----------

  function choosePath(path: VictoryPath): void {
    const m = memory();
    m.path = path;
    m.stage = currentStage(view(), path).index;
    remember(m);
    const stage = currentStage(view(), path);
    push({
      important: true,
      mood: "praise",
      title: t("Cesta: {path}", { path: pathName(path) }),
      game: t("Plán má {n} etap. Teď začínáme etapou „{stage}“ a měla by být hotová do tahu {turn}. Úkoly uvidíš v mém okně vlevo nahoře.", {
        n: planProgress(view(), path).length,
        stage: escapeHtml(stageName(path, stage.stage.id)),
        turn: stage.stage.by,
      }),
    });
    onChange();
  }

  function askPath(): void {
    push({
      important: true,
      mood: "advise",
      title: t("Jak chceš vyhrát?"),
      game: t("Vyber si cestu a já ti k ní udělám plán. Cestu můžeš kdykoli změnit v mém okně."),
      choosePath: true,
    });
  }

  // ---------- stories ----------

  function techCard(tech: TechId): Card {
    const page = techPage(tech).page;
    const gives = unlocks(tech);
    const m = memory();
    const plan = m.path ? planProgress(view(), m.path).find((s) => !s.done && s.stage.tasks.some((x) => x.kind === "knows" && x.tech === tech)) : undefined;
    const parts = [gives ? t("Teď můžeš stavět nebo zavést: {what}.", { what: escapeHtml(gives) }) : t("Sám nic nového neodemyká, ale vede k dalším objevům.")];
    if (plan) parts.push(t("Tenhle objev potřebuješ k etapě „{stage}“.", { stage: escapeHtml(stageName(m.path!, plan.stage.id)) }));
    return { important: false, mood: "advise", title: t("Nový objev: {tech}", { tech: techName(tech) }), entry: `tech:${tech}`, story: firstSentences(page.text, 2), fact: page.fact, game: parts.join(" ") };
  }

  function unitCard(type: UnitTypeId): Card {
    const key = entryKey("unit", type);
    const page = codexPage(key)?.page;
    const u = UNIT_TYPES[type];
    return {
      important: false,
      mood: "advise",
      title: t("První jednotka: {unit}", { unit: unitName(type) }),
      entry: key,
      story: page ? firstSentences(page.text, 2) : undefined,
      fact: page?.fact,
      game: escapeHtml(`${unitRole(u)} ${t("Útok {attack}, obrana {defense}, pohyb {moves}.", { attack: u.attack, defense: u.defense, moves: u.moves })}`),
    };
  }

  function buildingCard(id: BuildingId, wonder: boolean): Card {
    const key = entryKey("building", id);
    const page = codexPage(key)?.page;
    return {
      important: wonder,
      mood: wonder ? "praise" : "advise",
      title: wonder ? t("Tvůj div světa: {building}", { building: buildingName(id) }) : t("První stavba: {building}", { building: buildingName(id) }),
      entry: key,
      story: page ? firstSentences(page.text, 2) : undefined,
      fact: page?.fact,
      game: escapeHtml(t("Co dělá: {what}.", { what: describeBuilding(BUILDINGS[id], false) })),
    };
  }

  function nationCard(civ: CivId, own: boolean): Card {
    const page = codexPage(`civ-${civ}`)?.page;
    const leader = codexPage(`lead-${civ}`)?.page;
    const nature = CIVS[civ].personality;
    const game = own
      ? t("Tvým vládcem je {leader} a první město se bude jmenovat {capital}. Najdi pro něj místo u řeky nebo u moře, kde je kolem hodně luk.", {
          leader: escapeHtml(leaderName(civ)),
          capital: escapeHtml(cityLabel(CIVS[civ].cities[0]!)),
        })
      : nature === "expansion"
        ? t("Jejich vládcem je {leader} a rádi zakládají nová města, takže ti budou brát volnou zemi. Pospěš si s osadníky.", { leader: escapeHtml(leaderName(civ)) })
        : nature === "war"
          ? t("Jejich vládcem je {leader} a spoléhají na armádu. Ve městech u jejich hranic drž aspoň dva obránce a stav hradby.", { leader: escapeHtml(leaderName(civ)) })
          : t("Jejich vládcem je {leader} a sázejí na vědu. Budou rychle bádat, armádu ale mívají slabší.", { leader: escapeHtml(leaderName(civ)) });
    return {
      important: own,
      mood: "advise",
      title: own ? t("Tvůj národ: {nation}", { nation: civName(civ) }) : t("Nový soused: {nation}", { nation: civName(civ) }),
      entry: `civ-${civ}`,
      story: page ? firstSentences(page.text, 2) + (leader ? ` ${firstSentences(leader.text, 1)}` : "") : undefined,
      fact: page?.fact,
      game,
    };
  }

  /** Cards for what happened; called with the events of every command and turn. */
  function onEvents(events: GameEvent[]): void {
    const s = host.state();
    const me = host.player();
    for (const e of events) {
      if (e.type === "techLearned" && e.player === me) {
        if (firstTime(`tech-${e.tech}`) && TECHS[e.tech]) push(techCard(e.tech));
      } else if (e.type === "unitBuilt") {
        const city = s.cities.find((c) => c.id === e.cityId);
        if (city?.owner === me && firstTime(`unit-${e.unitType}`)) push(unitCard(e.unitType));
      } else if (e.type === "buildingBuilt") {
        const city = s.cities.find((c) => c.id === e.cityId);
        if (city?.owner === me && firstTime(`bld-${e.building}`)) push(buildingCard(e.building, false));
      } else if (e.type === "wonderBuilt" && e.owner === me) {
        push(buildingCard(e.building, true));
      } else if (e.type === "contactMade" && (e.a === me || e.b === me)) {
        const other = s.players[e.a === me ? e.b : e.a];
        if (other && other.civ !== "barbarians" && firstTime(`civ-${other.civ}`)) push(nationCard(other.civ as CivId, false));
      } else if (e.type === "cityCaptured" && e.from === me) {
        const city = s.cities.find((c) => c.id === e.cityId);
        push({
          important: true,
          mood: "warn",
          title: t("Přišel jsi o město {city}", { city: city ? cityLabel(city.name) : "" }),
          game: t("{nation} ho dobyli. Shromáždi útočníky a vezmi si ho zpátky, a do měst kolem pošli obránce, ať nepadne další.", { nation: escapeHtml(civName(s.players[e.to]!.civ)) }),
        });
      } else if (e.type === "barbariansAppeared" && e.reason !== "ruins") {
        const near = s.cities.find((c) => c.owner === me && Math.max(Math.abs(c.x - e.at.x), Math.abs(c.y - e.at.y)) <= 4);
        if (near && firstTime(`barbarians-${s.turn}-${near.id}`)) {
          push({
            important: true,
            mood: "warn",
            title: t("Barbaři u města {city}!", { city: cityLabel(near.name) }),
            game: t("Barbaři zaútočí, jakmile budou mít šanci. Dej do města aspoň dva obránce a opevni je klávesou F. Prázdné město dobudou hned."),
          });
        }
      }
    }
    onChange();
  }

  /** Watches the plan: praises a finished stage and introduces the next one. */
  function onChange(): void {
    const m = memory();
    if (!m.path) return;
    const all = planProgress(view(), m.path);
    const now = all.find((s) => !s.done)?.index ?? all.length;
    if (now <= m.stage) return;
    const finished = all[m.stage]!;
    m.stage = now;
    remember(m);
    const following = all[now];
    push({
      important: true,
      mood: "praise",
      title: t("Etapa splněna: {stage}", { stage: stageName(m.path, finished.stage.id) }),
      game: following
        ? t("Skvělá práce! Další etapa je „{stage}“ a měla by být hotová do tahu {turn}.", { stage: escapeHtml(stageName(m.path, following.stage.id)), turn: following.stage.by })
        : t("Splnil jsi celý plán. Teď už jen dotáhni vítězství!"),
    });
  }

  /** A new game: the owl introduces herself, the nation, and asks how to win. */
  function onNewGame(): void {
    const s = host.state();
    const civ = s.players[host.player()]!.civ as CivId;
    queue.length = 0;
    remember({ path: null, seen: [], stage: 0 });
    push({
      important: true,
      mood: "praise",
      title: t("Ahoj, já jsem {name}!", { name: name() }),
      game: t("Pamatuju si všechny časy od první vesnice až po lety ke hvězdám. Budu ti vyprávět, co se v nich dělo, a pomůžu ti vyhrát. Když budu mluvit moc, ztlum mě v menu."),
    });
    if (firstTime(`civ-${civ}`)) push(nationCard(civ, true));
    askPath();
  }

  // ---------- the panel ----------

  /** Status line and mood of the owl for the current stage. */
  function status(stage: StageProgress, path: VictoryPath): { mood: OwlMood; text: string } {
    const v = view();
    if (v.victory?.player === v.playerId) return { mood: "praise", text: t("Vyhrál jsi! Jsem na tebe pyšná.") };
    const left = stage.stage.by - v.turn;
    const missing = stage.tasks.find((x) => !x.done);
    if (stage.done) return { mood: "praise", text: t("Celý plán je splněný. Hraj dál a hlídej si náskok.") };
    if (stage.pace === "late")
      return {
        mood: "warn",
        text: t("Etapa „{stage}“ měla být hotová v tahu {turn}. Dá se to dohnat. {hint}", { stage: escapeHtml(stageName(path, stage.stage.id)), turn: stage.stage.by, hint: escapeHtml(missing ? taskHint(missing.task) : "") }),
      };
    if (stage.pace === "tight")
      return {
        mood: "warn",
        text: tn("Do konce etapy zbývá jen {n} tah. {hint}|Do konce etapy zbývají jen {n} tahy. {hint}|Do konce etapy zbývá jen {n} tahů. {hint}", Math.max(0, left), {
          hint: escapeHtml(missing ? taskHint(missing.task) : ""),
        }),
      };
    return { mood: "advise", text: tn("Jde ti to dobře. Na etapu máš ještě {n} tah.|Jde ti to dobře. Na etapu máš ještě {n} tahy.|Jde ti to dobře. Na etapu máš ještě {n} tahů.", left) };
  }

  /** The head and plan part of the panel; the advisor's tips follow under it. */
  function panelHead(): string {
    const m = memory();
    const close = `<button type="button" class="adv-close" data-close title="${t("Schovat do příštího tahu. Zpátky ho vrátí tlačítko Rádce nahoře nebo v menu.")}" aria-label="${t("Schovat")}">×</button>`;
    if (!m.path) {
      return `<div class="gd-head">${owlHtml("advise", 56)}<div class="gd-say"><b>${escapeHtml(name())}</b><p>${t("Vyber si, jak chceš vyhrát, a já ti udělám plán.")}</p></div>${close}</div>
        <div class="gd-choose">${VICTORY_PATHS.map((p) => `<button type="button" data-gd-path="${p}">${escapeHtml(pathName(p))}</button>`).join("")}</div>`;
    }
    const path = m.path;
    const stage = currentStage(view(), path);
    const all = planProgress(view(), path);
    const st = status(stage, path);
    const tasks = stage.tasks
      .map((x) => {
        const count = x.need > 1 && x.task.kind !== "rank" ? ` <span class="muted">${x.have}/${x.need}</span>` : "";
        return `<li class="${x.done ? "done" : ""}" title="${escapeHtml(taskHint(x.task))}"><span class="gd-tick">${x.done ? "✓" : "•"}</span>${escapeHtml(taskLabel(x.task))}${count}</li>`;
      })
      .join("");
    return `<div class="gd-head">${owlHtml(st.mood, 56)}<div class="gd-say"><b>${escapeHtml(name())}</b><p>${st.text}</p></div>${close}</div>
      <div class="gd-plan">
        <div class="gd-stage">${escapeHtml(pathName(path))} · ${t("etapa {n} z {all}", { n: stage.index + 1, all: all.length })}: <b>${escapeHtml(stageName(path, stage.stage.id))}</b> <span class="muted">${t("do tahu {turn}", { turn: stage.stage.by })}</span></div>
        <div class="gd-steps">${all.map((s) => `<span class="${s.index < stage.index ? "done" : s.index === stage.index ? "now" : ""}"></span>`).join("")}</div>
        <ul class="gd-tasks">${tasks}</ul>
      </div>`;
  }

  function panelFoot(): string {
    const m = memory();
    return `<div class="gd-foot">
      <button type="button" data-gd="scores">${t("Žebříček")}</button>
      ${m.path ? `<button type="button" class="quiet" data-gd="path">${t("Změnit cestu")}</button>` : ""}
    </div>`;
  }

  function wirePanel(panel: HTMLElement, rerender: () => void): void {
    panel.querySelectorAll<HTMLButtonElement>("[data-gd-path]").forEach((b) =>
      b.addEventListener("click", () => {
        choosePath(b.dataset.gdPath as VictoryPath);
        rerender();
      }),
    );
    panel.querySelector('[data-gd="scores"]')?.addEventListener("click", openScores);
    panel.querySelector('[data-gd="path"]')?.addEventListener("click", askPath);
  }

  /** A technology the current stage of the plan asks for and the player does not know yet. */
  function wantedTech(): TechId | null {
    const m = memory();
    if (!m.path) return null;
    const stage = currentStage(view(), m.path);
    const task = stage.tasks.find((x) => !x.done && x.task.kind === "knows");
    return task && task.task.kind === "knows" ? task.task.tech : null;
  }

  // ---------- leaderboard ----------

  const scores = document.createElement("dialog");
  scores.className = "guide-scores";
  document.body.append(scores);

  function openScores(): void {
    const s = host.state();
    const v = view();
    const mine = scoreOf(s, host.player());
    const rows = [
      { name: civName(s.players[host.player()]!.civ), score: mine.total, me: true },
      ...v.rivals.filter((r) => r.score !== null).map((r) => ({ name: civName(r.civ), score: r.score!, me: false })),
    ].sort((a, b) => b.score - a.score);
    const unknown = v.rivals.filter((r) => !r.barbarian && !r.contact && !r.defeated).length;
    const out = v.rivals.filter((r) => r.defeated && !r.barbarian).map((r) => civName(r.civ));
    scores.innerHTML = `
      <div class="dialog-head"><h2>${t("Žebříček")}</h2><button type="button" class="tp-close" data-close aria-label="${t("Zavřít")}">×</button></div>
      <p class="muted small">${t("Skóre národů, které znáš. Po tahu {turn} vyhraje ten, kdo má nejvíc.", { turn: RULES.maxTurns })}</p>
      <ol class="gs-list">${rows.map((r) => `<li class="${r.me ? "me" : ""}"><span>${escapeHtml(r.name)}</span><b>${r.score}</b></li>`).join("")}</ol>
      ${unknown ? `<p class="small">${tn("Jeden národ ještě neznáš.|Ještě neznáš {n} národy.|Ještě neznáš {n} národů.", unknown)}</p>` : ""}
      ${out.length ? `<p class="small">${t("Už prohráli: {list}", { list: escapeHtml(out.join(", ")) })}</p>` : ""}
      <h3>${t("Z čeho máš skóre")}</h3>
      <div class="gs-parts">
        <span>${t("obyvatelé")}</span><b>${mine.citizens}</b>
        <span>${t("šťastní obyvatelé")}</span><b>${mine.happy}</b>
        <span>${t("objevy")}</span><b>${mine.techs}</b>
        <span>${t("divy světa")}</span><b>${mine.wonders}</b>
        ${mine.spaceship ? `<span>${t("vesmírná loď")}</span><b>${mine.spaceship}</b>` : ""}
      </div>
      <p class="muted small">${t("Místo v žebříčku: {rank}.", { rank: leaderboardRank(v) })}</p>`;
    scores.querySelector("[data-close]")?.addEventListener("click", () => scores.close());
    if (!scores.open) scores.showModal();
  }

  // ---------- settings ----------

  function setVolume(volume: Settings["volume"]): void {
    settings = { ...settings, volume };
    save(SETTINGS_KEY, settings);
  }

  function setName(value: string): void {
    settings = { ...settings, name: value.slice(0, 24) };
    save(SETTINGS_KEY, settings);
  }

  return {
    onEvents,
    onNewGame,
    onChange,
    panelHead,
    panelFoot,
    wirePanel,
    openScores,
    settings: () => settings,
    setVolume,
    setName,
    name,
    hasPath: () => memory().path !== null,
    wantedTech,
    askPath,
    isOpen: () => dialog.open || scores.open,
  };
}
