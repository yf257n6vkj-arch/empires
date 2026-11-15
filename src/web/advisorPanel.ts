/**
 * The advisor's panel in the top left corner of the map. It shows the most
 * urgent tips from core/advisor.ts in plain words for a young player, each
 * with a button that takes them to the right place.
 */
import { advise, BUILDINGS, type Advice, type CityId, type GameState, type UnitId } from "../core";
import { describeBuilding, escapeHtml } from "./texts";
import { t, tn } from "./i18n";
import { buildingName, cityLabel } from "./i18n/names";

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
    const name = host.state().cities.find((c) => c.id === id)?.name;
    return escapeHtml(name ? cityLabel(name) : t("město"));
  }

  /** Words and an optional button for one tip. */
  function words(a: Advice): { text: string; button?: string; act?: () => void } {
    const s = host.state();
    switch (a.kind) {
      case "foundFirstCity":
        return {
          text: t("Nejdřív potřebuješ město. Vyber osadníka a stiskni <kbd>B</kbd>. Hodí se místo, kde je kolem hodně louky a k tomu trochu lesa nebo kopců."),
          button: t("Ukaž osadníka"),
          act: () => host.selectUnit(a.unitId),
        };
      case "chooseResearch":
        return { text: t("Tví vědci nevědí, co mají zkoumat. Vyber jim další objev, jinak výzkum stojí."), button: t("Vybrat objev"), act: host.openTechTree };
      case "cityInDisorder":
        return {
          text: t("Ve městě {city} se lidé bouří a město nic nevyrábí. Postav tam chrám, pošli do města vojáka nebo udělej z jednoho obyvatele baviče.", { city: cityName(a.cityId) }),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      case "cityStarving":
        return {
          text: t("{city} hladoví a brzy se zmenší. Přesuň obyvatele na políčka s jídlem, nebo tam pošli osadníka zavlažovat.", { city: cityName(a.cityId) }),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      case "goldRunningOut":
        return {
          text: tn("Každý tah ti ubude {gold} zlata a za {n} tah dojde. Pak hra začne prodávat budovy. Posuň posuvník Věda nahoře doleva, ať víc obchodu jde do zlata.|Každý tah ti ubude {gold} zlata a za {n} tahy dojde. Pak hra začne prodávat budovy. Posuň posuvník Věda nahoře doleva, ať víc obchodu jde do zlata.|Každý tah ti ubude {gold} zlata a za {n} tahů dojde. Pak hra začne prodávat budovy. Posuň posuvník Věda nahoře doleva, ať víc obchodu jde do zlata.", a.turnsLeft, { gold: -a.perTurn }),
        };
      case "defendCity":
        return {
          text: t("{city} nikdo nebrání. Postav tam válečníka nebo jinou jednotku, která umí bránit.", { city: cityName(a.cityId) }),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      case "idleSettler":
        return {
          text: t("Osadník nemá práci. Když mu zapneš automatickou práci, bude sám stavět cesty, zavlažování a doly kolem tvých měst."),
          button: t("Zapnout automatickou práci"),
          act: () => host.automate(a.unitId),
        };
      case "buildSettlers": {
        const n = s.cities.filter((c) => c.owner === host.player()).length;
        return {
          text: tn("Máš {n} město. Víc měst ti dá víc jídla, výroby i vědy. Postav ve městě {city} osadníka a založ s ním další město.|Máš {n} města. Víc měst ti dá víc jídla, výroby i vědy. Postav ve městě {city} osadníka a založ s ním další město.|Máš {n} měst. Víc měst ti dá víc jídla, výroby i vědy. Postav ve městě {city} osadníka a založ s ním další město.", n, { city: cityName(a.cityId) }),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      }
      case "needsAqueduct":
        return {
          text: t("{city} už dál neroste. Aby mohlo být větší, potřebuje akvadukt.", { city: cityName(a.cityId) }),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      case "buildBuilding": {
        const b = BUILDINGS[a.building];
        return {
          text: t("Ve městě {city} by se hodila stavba {building}: {what}.", { city: cityName(a.cityId), building: escapeHtml(buildingName(b.id)), what: escapeHtml(describeBuilding(b)) }),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      }
      case "spendGold":
        return {
          text: t("Máš hodně zlata. Stavbu ve městě {city} můžeš rovnou koupit a nemusíš čekat.", { city: cityName(a.cityId) }),
          button: t("Otevřít město"),
          act: () => host.openCity(a.cityId),
        };
      case "unitsWaiting":
        return {
          text: tn("Na rozkaz čeká {n} jednotka. Stiskni <kbd>N</kbd> a projdi je jednu po druhé. Vojáky ve městě můžeš opevnit klávesou <kbd>F</kbd>.|Na rozkaz čekají {n} jednotky. Stiskni <kbd>N</kbd> a projdi je jednu po druhé. Vojáky ve městě můžeš opevnit klávesou <kbd>F</kbd>.|Na rozkaz čeká {n} jednotek. Stiskni <kbd>N</kbd> a projdi je jednu po druhé. Vojáky ve městě můžeš opevnit klávesou <kbd>F</kbd>.", a.count),
          button: t("Ukaž jednotku"),
          act: () => host.selectUnit(a.unitId),
        };
      case "allDone":
        return { text: t("Všechno má práci. Ukonči tah klávesou <kbd>Enter</kbd>.") };
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
      `<div class="adv-head"><span class="adv-owl" aria-hidden="true">🦉</span><b>${t("Rádce")}</b><span class="spacer"></span>` +
      `<button type="button" class="adv-close" data-close title="${t("Schovat do příštího tahu. Zpátky ho vrátí tlačítko Rádce nahoře nebo v menu.")}" aria-label="${t("Schovat")}">×</button></div>` +
      `<ol class="adv-tips">${tips
        .map((tip, n) => `<li><p>${tip.text}</p>${tip.button ? `<button type="button" data-tip="${n}">${tip.button}</button>` : ""}</li>`)
        .join("")}</ol>`;
    panel.querySelector("[data-close]")?.addEventListener("click", () => {
      hiddenInTurn = s.turn;
      render();
    });
    panel.querySelectorAll<HTMLButtonElement>("[data-tip]").forEach((b) => b.addEventListener("click", () => tips[Number(b.dataset.tip)]?.act?.()));
  }

  /** Shows the panel again, also when the player switched the advisor off or closed it this turn. */
  function show(): void {
    if (!enabled) {
      enabled = true;
      toggle.checked = true;
      try {
        localStorage.setItem(STORAGE_KEY, "on");
      } catch {
        // The choice holds until the page reloads.
      }
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

  return { render, show, toggleShown };
}
