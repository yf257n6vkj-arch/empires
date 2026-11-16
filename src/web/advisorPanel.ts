/**
 * The advisor's panel in the top left corner of the map. It shows the most
 * urgent tips from core/advisor.ts in plain words for a young player, each
 * with a button that takes them to the right place.
 */
import { advise, BUILDING_IDS, BUILDINGS, GOVERNMENT_IDS, GOVERNMENTS, UNIT_TYPE_IDS, UNIT_TYPES, type Advice, type CityId, type Command, type GameState, type TechId, type UnitId } from "../core";
import { describeBuilding, escapeHtml } from "./texts";
import { t, tn } from "./i18n";
import { buildingName, cityLabel, governmentName, inSentence, techName, unitName } from "./i18n/names";

export interface AdvisorHost {
  state(): GameState;
  player(): number;
  openCity(id: CityId): void;
  selectUnit(id: UnitId): void;
  openTechTree(): void;
  automate(id: UnitId): void;
  openGovernment(): void;
  /** Runs a command for the player; true when it went through. */
  run(command: Command): boolean;
  /** The children's guide, which takes over the panel when the player chooses her. */
  guide: {
    panelHead(): string;
    panelFoot(): string;
    wirePanel(panel: HTMLElement, rerender: () => void): void;
    /** A technology the guide's plan asks for now. */
    wantedTech(): TechId | null;
  };
}

/** Who helps the player: nobody, the advisor, or the children's guide. */
export type HelperMode = "off" | "on" | "guide";

interface Tip {
  /** What to do. */
  text: string;
  /** Why it helps. */
  why?: string;
  button?: string;
  act?: () => void;
  /** A second, quieter button. */
  more?: { button: string; act: () => void };
}

/** What a technology opens up, as a list of names. */
export function unlocks(tech: TechId): string {
  const names = [
    ...UNIT_TYPE_IDS.filter((u) => UNIT_TYPES[u].requires === tech).map(unitName),
    ...BUILDING_IDS.filter((b) => BUILDINGS[b].requires === tech && !BUILDINGS[b].spaceship).map(buildingName),
    ...GOVERNMENT_IDS.filter((g) => GOVERNMENTS[g].requires === tech).map((g) => t("vládu {government}", { government: inSentence(governmentName(g)) })),
  ];
  return names.slice(0, 4).join(", ");
}

const STORAGE_KEY = "empires.advisor";
const SHOWN = 3;
/** Under the guide's plan fewer tips fit. */
const GUIDE_SHOWN = 2;
/** Whether all tips are shown, not just the first few. */
let showAll = false;

export function createAdvisor(panel: HTMLElement, picker: HTMLSelectElement, host: AdvisorHost) {
  let mode: HelperMode = "on";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "off" || stored === "guide") mode = stored;
  } catch {
    // Without storage the advisor is simply on.
  }
  /** Turn in which the player closed the panel; it comes back next turn. */
  let hiddenInTurn = -1;
  picker.value = mode;
  picker.addEventListener("change", () => setMode(picker.value as HelperMode));

  function setMode(next: HelperMode): void {
    mode = next;
    picker.value = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // The choice holds until the page reloads.
    }
    hiddenInTurn = -1;
    render();
  }

  function cityName(id: CityId): string {
    const name = host.state().cities.find((c) => c.id === id)?.name;
    return escapeHtml(name ? cityLabel(name) : t("město"));
  }

  function unitLabel(id: UnitId): string {
    const u = host.state().units.find((x) => x.id === id);
    return escapeHtml(u ? unitName(u.type) : t("jednotka"));
  }

  /** What to do, why it helps, and an optional button for one tip. */
  function words(a: Advice): Tip {
    const s = host.state();
    switch (a.kind) {
      case "foundFirstCity":
        return {
          text: t("Vyber osadníka a stiskni <kbd>B</kbd>, založí první město."),
          why: t("Bez města nemáš z čeho vyrábět ani bádat. Hodí se místo s loukami kolem a trochou lesa nebo kopců, nejlépe u řeky nebo u moře."),
          button: t("Ukaž osadníka"),
          act: () => host.selectUnit(a.unitId),
        };
      case "chooseResearch": {
        const planned = mode === "guide" ? host.guide.wantedTech() : null;
        if (planned) {
          const gives = unlocks(planned);
          return {
            text: t("Vědci čekají na úkol. Pro tvůj plán potřebuješ objev {tech}.", { tech: `<b>${escapeHtml(techName(planned))}</b>` }),
            why: gives ? t("Odemkne {what}. Vědci k němu půjdou sami, i když bude potřebovat jiné objevy předem.", { what: escapeHtml(gives) }) : t("Vědci k němu půjdou sami, i když bude potřebovat jiné objevy předem."),
            button: t("Zkoumat {tech}", { tech: escapeHtml(techName(planned)) }),
            act: () => host.run({ type: "setResearchGoal", tech: planned }),
            more: { button: t("Vybrat jiný"), act: host.openTechTree },
          };
        }
        if (!a.tech) return { text: t("Vyber vědcům další objev."), why: t("Dokud nic nevybereš, výzkum stojí a body vědy přicházejí nazmar."), button: t("Vybrat objev"), act: host.openTechTree };
        const gives = unlocks(a.tech);
        const why = a.leadsTo
          ? t("Vede k objevu {goal}, který odemkne {what}.", { goal: escapeHtml(techName(a.leadsTo)), what: escapeHtml(unlocks(a.leadsTo) || t("další objevy")) })
          : gives
            ? t("Odemkne {what}.", { what: escapeHtml(gives) })
            : t("Otevře cestu k dalším objevům.");
        const tech = a.tech;
        return {
          text: t("Vědci čekají na úkol. Doporučuji zkoumat {tech}.", { tech: `<b>${escapeHtml(techName(tech))}</b>` }),
          why,
          button: t("Zkoumat {tech}", { tech: escapeHtml(techName(tech)) }),
          act: () => host.run({ type: "setResearch", tech }),
          more: { button: t("Vybrat jiný"), act: host.openTechTree },
        };
      }
      case "enemyNearCity": {
        const unit = a.defender ? t(", nejlépe jednotku {unit},", { unit: escapeHtml(unitName(a.defender)) }) : "";
        return {
          text: tn("U města {city} stojí nepřátelská jednotka. Postav nebo přesuň do města obránce{unit} a opevni ho klávesou <kbd>F</kbd>.|U města {city} stojí {n} nepřátelské jednotky. Postav nebo přesuň do města obránce{unit} a opevni ho klávesou <kbd>F</kbd>.|U města {city} stojí {n} nepřátelských jednotek. Postav nebo přesuň do města obránce{unit} a opevni ho klávesou <kbd>F</kbd>.", a.enemies, { city: cityName(a.cityId), unit }),
          why:
            (a.defenders === 0 ? t("Město teď nikdo nebrání. ") : tn("Ve městě je jen jeden obránce. |Ve městě jsou jen {n} obránci. |Ve městě je jen {n} obránců. ", a.defenders)) +
            t("Když město padne, nepřítel ho dobude a vezme ti část zlata a jeden objev. Hradby obranu proti pozemním jednotkám ztrojnásobí."),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      }
      case "captureCity":
        return {
          text: t("Město {city} nikdo nebrání. Pošli do něj jednotku {unit} a dobuď ho.", { city: cityName(a.cityId), unit: unitLabel(a.unitId) }),
          why: t("Dobyté město ti zůstane i s obyvateli a část budov přežije. Nepřítel přijde o výrobu a ty k tomu dostaneš zlato."),
          button: t("Ukaž jednotku"),
          act: () => host.selectUnit(a.unitId),
        };
      case "goodAttack":
        return {
          text: t("Jednotka {unit} může zaútočit na sousední nepřátele se šancí {pct} %.", { unit: unitLabel(a.unitId), pct: a.chancePct }),
          why: t("Čím dřív nepřítele porazíš, tím méně škody udělá. Vítěz se navíc může stát veteránem a bude silnější. Před útokem ti hra šanci ukáže ještě jednou."),
          button: t("Ukaž jednotku"),
          act: () => host.selectUnit(a.unitId),
        };
      case "woundedUnit":
        return {
          text: t("Jednotka {unit} je těžce zraněná. Vrať ji do vlastního města a nech ji tam tah stát.", { unit: unitLabel(a.unitId) }),
          why: t("Se zbytkem životů prohraje i se slabším soupeřem. V poli se léčí pomalu, ve městě rychle a ve městě s kasárnami se vyléčí celá za jeden tah."),
          button: t("Ukaž jednotku"),
          act: () => host.selectUnit(a.unitId),
        };
      case "growthDisorder":
        return {
          text: tn("Město {city} za jeden tah vyroste a pak by se lidé začali bouřit. Postav tam včas chrám, nebo posuň posuvník Zábava doprava.|Město {city} za {n} tahy vyroste a pak by se lidé začali bouřit. Postav tam včas chrám, nebo posuň posuvník Zábava doprava.|Město {city} za {n} tahů vyroste a pak by se lidé začali bouřit. Postav tam včas chrám, nebo posuň posuvník Zábava doprava.", a.turns, { city: cityName(a.cityId) }),
          why: t("Nový obyvatel bude nespokojený. Když je nespokojených víc než šťastných, město přestane vyrábět, dokud se lidé neuklidní."),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      case "revolution":
        return {
          text: t("Už znáš vládu {government}. Vyhlas revoluci a zaveď ji.", { government: escapeHtml(inSentence(governmentName(a.government))) }),
          why: t("Despocie bere jedno jídlo, štít nebo obchod z každého bohatého políčka. Lepší vláda ti dá víc ze stejné země. Revoluce způsobí na pár tahů anarchii, proto je lepší ji udělat brzy."),
          button: t("Ukázat vlády"),
          act: host.openGovernment,
        };
      case "explore":
        return {
          text: t("Pošli jednotku {unit} prozkoumat okolí. Vyber ji a klikej na neznámá místa na mapě.", { unit: unitLabel(a.unitId) }),
          why: t("Najdeš místa pro další města a třeba i ruiny s pokladem. Ve městě zůstane druhý obránce."),
          button: t("Ukaž jednotku"),
          act: () => host.selectUnit(a.unitId),
        };
      case "visitRuins":
        return {
          text: t("Nedaleko je ruina starého města. Pošli k ní jednotku {unit}.", { unit: unitLabel(a.unitId) }),
          why: t("V ruinách často leží zlato nebo staré svitky s objevem. Občas z nich ale vyrazí barbaři, proto tam neposílej osadníka."),
          button: t("Ukaž jednotku"),
          act: () => host.selectUnit(a.unitId),
        };
      case "buildWonder": {
        const b = BUILDINGS[a.building];
        return {
          text: t("Ve městě {city} můžeš začít stavět div {building}.", { city: cityName(a.cityId), building: `<b>${escapeHtml(buildingName(b.id))}</b>` }),
          why: t("Každý div postaví jen jedna říše na světě a kdo bude první, má ho napořád. Tenhle dá: {what}.", { what: escapeHtml(describeBuilding(b, false)) }),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      }
      case "cityInDisorder":
        return {
          text: t("Ve městě {city} se lidé bouří. Postav tam chrám, pošli do města vojáka, udělej z jednoho obyvatele baviče nebo posuň nahoře posuvník Zábava doprava.", { city: cityName(a.cityId) }),
          why: t("Během nepokojů město nic nevyrábí a neplatí daně ani vědu. Každý tah nepokojů je ztracený."),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      case "cityStarving":
        return {
          text: t("{city} hladoví. Přesuň obyvatele na políčka s jídlem, nebo tam pošli osadníka zavlažovat.", { city: cityName(a.cityId) }),
          why: t("Až dojdou zásoby, jeden obyvatel umře a město se zmenší."),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      case "cleanPollution":
        return {
          text: t("Kolem města {city} je znečištěné políčko. Pošli tam osadníka a klávesou V ho vyčisti, nebo mu zapni automatickou práci.", { city: cityName(a.cityId) }),
          why: t("Znečištěné políčko dává jen polovinu a každé další přibližuje globální oteplování, které promění louky v poušť."),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      case "goldRunningOut":
        return {
          text: t("Posuň posuvník Věda nahoře doleva, ať víc obchodu jde do zlata."),
          why: tn("Každý tah ti ubude {gold} zlata a za {n} tah dojde. Pak hra začne prodávat budovy.|Každý tah ti ubude {gold} zlata a za {n} tahy dojde. Pak hra začne prodávat budovy.|Každý tah ti ubude {gold} zlata a za {n} tahů dojde. Pak hra začne prodávat budovy.", a.turnsLeft, { gold: -a.perTurn }),
        };
      case "defendCity":
        return {
          text: t("{city} nikdo nebrání. Postav tam válečníka nebo jinou jednotku, která umí bránit.", { city: cityName(a.cityId) }),
          why: t("Do prázdného města stačí vejít a je dobyté. Jeden voják navíc uklidní lidi, když vládneš despocií nebo monarchií."),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      case "idleSettler":
        return {
          text: t("Osadník nemá práci. Zapni mu automatickou práci."),
          why: t("Sám bude zvelebovat krajinu kolem tvých měst, takže města dostanou víc jídla a štítů ze stejných políček."),
          button: t("Zapnout automatickou práci"),
          act: () => host.automate(a.unitId),
        };
      case "buildSettlers": {
        const n = s.cities.filter((c) => c.owner === host.player()).length;
        return {
          text: t("Postav ve městě {city} osadníka a založ s ním další město.", { city: cityName(a.cityId) }),
          why: tn("Máš {n} město. Každé nové město přidá jídlo a výrobu a zabere zemi dřív, než ji vezmou soupeři.|Máš {n} města. Každé nové město přidá jídlo a výrobu a zabere zemi dřív, než ji vezmou soupeři.|Máš {n} měst. Každé nové město přidá jídlo a výrobu a zabere zemi dřív, než ji vezmou soupeři.", n),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      }
      case "needsAqueduct":
        return {
          text: t("Postav ve městě {city} akvadukt.", { city: cityName(a.cityId) }),
          why: t("Město má dost jídla, ale bez akvaduktu už nevyroste. Větší město obdělá víc políček."),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      case "buildBuilding": {
        const b = BUILDINGS[a.building];
        return {
          text: t("Ve městě {city} by se hodila stavba {building}.", { city: cityName(a.cityId), building: `<b>${escapeHtml(buildingName(b.id))}</b>` }),
          why: t("Dá městu tohle: {what}.", { what: escapeHtml(describeBuilding(b)) }),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      }
      case "spendGold":
        return {
          text: t("Kup stavbu ve městě {city}.", { city: cityName(a.cityId) }),
          why: t("Máš víc zlata, než potřebuješ na údržbu budov. Koupená stavba bude hotová hned příští tah."),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      case "unitsWaiting":
        return {
          text: tn("Na rozkaz čeká {n} jednotka. Stiskni <kbd>N</kbd> a projdi je jednu po druhé.|Na rozkaz čekají {n} jednotky. Stiskni <kbd>N</kbd> a projdi je jednu po druhé.|Na rozkaz čeká {n} jednotek. Stiskni <kbd>N</kbd> a projdi je jednu po druhé.", a.count),
          why: t("Vojáky ve městě opevni klávesou <kbd>F</kbd>, opevněný voják se brání o polovinu líp a dál se na něj hra neptá."),
          button: t("Ukaž jednotku"),
          act: () => host.selectUnit(a.unitId),
        };
      case "allDone":
        return { text: t("Všechno má práci. Ukonči tah klávesou <kbd>Enter</kbd>.") };
    }
  }

  function render(): void {
    const s = host.state();
    if (mode === "off" || hiddenInTurn === s.turn) {
      panel.hidden = true;
      return;
    }
    const guide = mode === "guide";
    const all = advise(s, host.player());
    const shown = guide ? GUIDE_SHOWN : SHOWN;
    const tips = (showAll ? all : all.slice(0, shown)).map(words);
    const hiddenCount = all.length - tips.length;
    panel.hidden = false;
    panel.classList.toggle("guide", guide);
    panel.innerHTML =
      (guide
        ? host.guide.panelHead() + `<div class="gd-now">${t("Co udělat teď")}</div>`
        : `<div class="adv-head"><span class="adv-owl" aria-hidden="true">🦉</span><b>${t("Rádce")}</b><span class="spacer"></span>` +
          `<button type="button" class="adv-close" data-close title="${t("Schovat do příštího tahu. Zpátky ho vrátí tlačítko Rádce nahoře nebo v menu.")}" aria-label="${t("Schovat")}">×</button></div>`) +
      `<ol class="adv-tips">${tips
        .map(
          (tip, n) =>
            `<li><p>${tip.text}</p>${tip.why ? `<p class="adv-why"><b>${t("Proč:")}</b> ${tip.why}</p>` : ""}${tip.button ? `<button type="button" data-tip="${n}">${tip.button}</button>` : ""}${tip.more ? ` <button type="button" class="quiet" data-more="${n}">${tip.more.button}</button>` : ""}</li>`,
        )
        .join("")}</ol>` +
      (hiddenCount > 0
        ? `<button type="button" class="adv-all" data-all>${tn("Další rada|Další {n} rady|Dalších {n} rad", hiddenCount)}</button>`
        : showAll && all.length > shown
          ? `<button type="button" class="adv-all" data-all>${t("Jen nejdůležitější")}</button>`
          : "") +
      (guide ? host.guide.panelFoot() : "");
    if (guide) host.guide.wirePanel(panel, render);
    panel.querySelector("[data-all]")?.addEventListener("click", () => {
      showAll = !showAll;
      render();
    });
    panel.querySelector("[data-close]")?.addEventListener("click", () => {
      hiddenInTurn = s.turn;
      render();
    });
    const after = (f?: () => void) => () => {
      f?.();
      render();
    };
    panel.querySelectorAll<HTMLButtonElement>("[data-tip]").forEach((b) => b.addEventListener("click", after(tips[Number(b.dataset.tip)]?.act)));
    panel.querySelectorAll<HTMLButtonElement>("[data-more]").forEach((b) => b.addEventListener("click", after(tips[Number(b.dataset.more)]?.more?.act)));
  }

  /** Shows the panel again, also when the player switched the advisor off or closed it this turn. */
  function show(): void {
    if (mode === "off") {
      setMode("on");
      return;
    }
    hiddenInTurn = -1;
    render();
    panel.scrollIntoView({ block: "nearest" });
  }

  /** Hides the panel when it is shown, shows it otherwise. */
  function toggleShown(): void {
    if (panel.hidden) show();
    else {
      hiddenInTurn = host.state().turn;
      render();
    }
  }

  return { render, show, toggleShown, mode: () => mode, setMode };
}
