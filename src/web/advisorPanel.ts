/**
 * The advisor's panel in the top left corner of the map. It shows the most
 * urgent tips from core/advisor.ts in plain words for a young player, each
 * with a button that takes them to the right place.
 */
import { advise, BUILDINGS, type Advice, type CityId, type GameState, type UnitId } from "../core";
import { describeBuilding, escapeHtml } from "./texts";

export interface AdvisorHost {
  state(): GameState;
  player(): number;
  openCity(id: CityId): void;
  selectUnit(id: UnitId): void;
  openTechTree(): void;
  automate(id: UnitId): void;
}

const STORAGE_KEY = "empires.advisor";
const SHOWN = 3;

function plural(n: number, one: string, few: string, many: string): string {
  return n === 1 ? one : n >= 2 && n <= 4 ? few : many;
}

export function createAdvisor(panel: HTMLElement, toggle: HTMLInputElement, host: AdvisorHost) {
  let enabled = true;
  try {
    enabled = localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    // Without storage the advisor is simply on.
  }
  /** Turn in which the player closed the panel; it comes back next turn. */
  let hiddenInTurn = -1;
  toggle.checked = enabled;
  toggle.addEventListener("change", () => {
    enabled = toggle.checked;
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch {
      // The choice holds until the page reloads.
    }
    hiddenInTurn = -1;
    render();
  });

  function cityName(id: CityId): string {
    return escapeHtml(host.state().cities.find((c) => c.id === id)?.name ?? "město");
  }

  /** Words and an optional button for one tip. */
  function words(a: Advice): { text: string; button?: string; act?: () => void } {
    const s = host.state();
    switch (a.kind) {
      case "foundFirstCity":
        return {
          text: "Nejdřív potřebuješ město. Vyber osadníka a stiskni <kbd>B</kbd>. Hodí se místo, kde je kolem hodně louky a k tomu trochu lesa nebo kopců.",
          button: "Ukaž osadníka",
          act: () => host.selectUnit(a.unitId),
        };
      case "chooseResearch":
        return { text: "Tví vědci nevědí, co mají zkoumat. Vyber jim další objev, jinak výzkum stojí.", button: "Vybrat objev", act: host.openTechTree };
      case "cityInDisorder":
        return {
          text: `Ve městě ${cityName(a.cityId)} se lidé bouří a město nic nevyrábí. Postav tam chrám, pošli do města vojáka nebo udělej z jednoho obyvatele baviče.`,
          button: "Otevřít město",
          act: () => host.openCity(a.cityId),
        };
      case "cityStarving":
        return {
          text: `${cityName(a.cityId)} hladoví a brzy se zmenší. Přesuň obyvatele na políčka s jídlem, nebo tam pošli osadníka zavlažovat.`,
          button: "Otevřít město",
          act: () => host.openCity(a.cityId),
        };
      case "goldRunningOut":
        return {
          text: `Každý tah ti ubude ${-a.perTurn} zlata a za ${a.turnsLeft} ${plural(a.turnsLeft, "tah", "tahy", "tahů")} dojde. Pak hra začne prodávat budovy. Posuň posuvník Věda nahoře doleva, ať víc obchodu jde do zlata.`,
        };
      case "defendCity":
        return {
          text: `${cityName(a.cityId)} nikdo nebrání. Postav tam válečníka nebo jinou jednotku, která umí bránit.`,
          button: "Otevřít město",
          act: () => host.openCity(a.cityId),
        };
      case "idleSettler":
        return {
          text: "Osadník nemá práci. Když mu zapneš automatickou práci, bude sám stavět cesty, zavlažování a doly kolem tvých měst.",
          button: "Zapnout automatickou práci",
          act: () => host.automate(a.unitId),
        };
      case "buildSettlers": {
        const n = s.cities.filter((c) => c.owner === host.player()).length;
        return {
          text: `Máš ${n} ${plural(n, "město", "města", "měst")}. Víc měst ti dá víc jídla, výroby i vědy. Postav ve městě ${cityName(a.cityId)} osadníka a založ s ním další město.`,
          button: "Otevřít město",
          act: () => host.openCity(a.cityId),
        };
      }
      case "needsAqueduct":
        return {
          text: `${cityName(a.cityId)} už dál neroste. Aby mohlo být větší, potřebuje akvadukt.`,
          button: "Otevřít město",
          act: () => host.openCity(a.cityId),
        };
      case "buildBuilding": {
        const b = BUILDINGS[a.building];
        return {
          text: `Ve městě ${cityName(a.cityId)} by se hodila stavba ${escapeHtml(b.name)}: ${escapeHtml(describeBuilding(b))}.`,
          button: "Otevřít město",
          act: () => host.openCity(a.cityId),
        };
      }
      case "spendGold":
        return {
          text: `Máš hodně zlata. Stavbu ve městě ${cityName(a.cityId)} můžeš rovnou koupit a nemusíš čekat.`,
          button: "Otevřít město",
          act: () => host.openCity(a.cityId),
        };
      case "unitsWaiting":
        return {
          text: `Na rozkaz ${plural(a.count, "čeká", "čekají", "čeká")} ${a.count} ${plural(a.count, "jednotka", "jednotky", "jednotek")}. Stiskni <kbd>N</kbd> a projdi je jednu po druhé. Vojáky ve městě můžeš opevnit klávesou <kbd>F</kbd>.`,
          button: "Ukaž jednotku",
          act: () => host.selectUnit(a.unitId),
        };
      case "allDone":
        return { text: "Všechno má práci. Ukonči tah klávesou <kbd>Enter</kbd>." };
    }
  }

  function render(): void {
    const s = host.state();
    if (!enabled || hiddenInTurn === s.turn) {
      panel.hidden = true;
      return;
    }
    const tips = advise(s, host.player()).slice(0, SHOWN).map(words);
    panel.hidden = false;
    panel.innerHTML =
      `<div class="adv-head"><span class="adv-owl" aria-hidden="true">🦉</span><b>Rádce</b><span class="spacer"></span>` +
      `<button type="button" class="adv-close" data-close title="Schovat do příštího tahu" aria-label="Schovat">×</button></div>` +
      `<ol class="adv-tips">${tips
        .map((t, n) => `<li><p>${t.text}</p>${t.button ? `<button type="button" data-tip="${n}">${t.button}</button>` : ""}</li>`)
        .join("")}</ol>`;
    panel.querySelector("[data-close]")?.addEventListener("click", () => {
      hiddenInTurn = s.turn;
      render();
    });
    panel.querySelectorAll<HTMLButtonElement>("[data-tip]").forEach((b) => b.addEventListener("click", () => tips[Number(b.dataset.tip)]?.act?.()));
  }

  return { render };
}
