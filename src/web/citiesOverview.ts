/**
 * Overview of all the player's cities in one table: size, growth, production,
 * trade, mood and what each city builds, with a list to change it right there.
 */
import {
  BUILDINGS,
  buyCost,
  cityReport,
  productionCost,
  productionOptions,
  RULES,
  sameItem,
  type City,
  type CityId,
  type Command,
  type GameState,
  type ProductionItem,
} from "../core";
import { escapeHtml } from "./texts";
import { t, tn } from "./i18n";
import { buildingName, cityLabel, productionLabel } from "./i18n/names";

export interface CitiesHost {
  state(): GameState;
  player(): number;
  run(command: Command): boolean;
  refresh(): void;
  openCity(id: CityId): void;
}

function turns(n: number): string {
  return tn("{n} tah|{n} tahy|{n} tahů", n);
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function itemValue(item: ProductionItem): string {
  return item.kind === "wealth" ? "wealth:" : `${item.kind}:${item.id}`;
}

function parseItem(value: string): ProductionItem {
  const [kind, id] = value.split(":");
  return (kind === "wealth" ? { kind } : { kind, id }) as ProductionItem;
}

export function createCitiesOverview(dialog: HTMLDialogElement, host: CitiesHost) {
  function close(): void {
    if (dialog.open) dialog.close();
  }

  function row(s: GameState, c: City): string {
    const r = cityReport(s, c);
    const h = r.happiness;
    const cost = productionCost(c.production);
    const growth =
      c.size >= r.maxSize && r.foodSurplus > 0
        ? `<span class="warn-text">${t("potřebuje akvadukt")}</span>`
        : r.turnsToGrow
          ? t("roste za {turns}", { turns: turns(r.turnsToGrow) })
          : r.foodSurplus < 0
            ? `<span class="neg">${t("hladoví")}</span>`
            : t("neroste");
    const options = productionOptions(s, c)
      .map((o) => {
        const wonder = o.kind === "building" && BUILDINGS[o.id].wonder;
        const label = `${wonder ? t("Div: ") : ""}${productionLabel(o)}`;
        const price = o.kind === "wealth" ? "" : ` (${productionCost(o)})`;
        return `<option value="${itemValue(o)}" ${sameItem(o, c.production) ? "selected" : ""}>${escapeHtml(label)}${price}</option>`;
      })
      .join("");
    const progress =
      c.production.kind === "wealth"
        ? t("+{gold} zlata za tah", { gold: r.shieldSurplus * RULES.wealthGoldPerShield })
        : r.waitingForSize
          ? t("čeká na druhého obyvatele")
          : c.shields >= cost
            ? t("hotovo na konci tahu")
            : `${Math.min(c.shields, cost)}/${cost} · ${r.turnsToComplete ? turns(r.turnsToComplete) : t("nevyrábí")}`;
    const gold = s.players[c.owner]?.gold ?? 0;
    const price = buyCost(c);
    const buy =
      price > 0
        ? `<button type="button" class="co-buy" data-buy="${c.id}" ${gold < price ? `disabled title="${t("Máš jen {gold} zlata.", { gold })}"` : `title="${t("Koupit hned za {price} zlata", { price })}"`}>${t("{price} zl.", { price })}</button>`
        : "";
    const queue = c.queue.length ? `<span class="muted small">${t("potom: {list}", { list: c.queue.map((q) => escapeHtml(productionLabel(q))).join(", ") })}</span>` : "";
    const buildings = c.buildings.map((b) => buildingName(b)).join(", ");
    return `<tr class="${h.disorder ? "disorder" : ""}">
      <td class="co-name"><button type="button" class="linklike" data-open="${c.id}" title="${t("Otevřít město")}">${escapeHtml(cityLabel(c.name))}</button>${c.buildings.includes("palace") ? ` <span class="muted small">★</span>` : ""}</td>
      <td class="num">${c.size}</td>
      <td><span class="${r.foodSurplus < 0 ? "neg" : ""}">${signed(r.foodSurplus)}</span> <span class="muted small">${growth}</span></td>
      <td class="num">${signed(r.shieldSurplus)}</td>
      <td class="num">${r.production.trade}</td>
      <td class="num">${r.science}</td>
      <td class="num">${r.gold + r.wealthGold}</td>
      <td>${h.disorder ? `<b class="neg">${t("nepokoje")}</b>` : `${h.happy ? `<span class="pos">${h.happy}</span> / ` : ""}${h.content} / <span class="${h.unhappy ? "neg" : ""}">${h.unhappy}</span>${c.celebrating ? ` <span class="pos" title="${t("Město slaví")}">★</span>` : ""}`}</td>
      <td class="co-make"><select data-city="${c.id}" aria-label="${t("Co stavět")}">${options}</select><div class="muted small">${progress} ${queue}</div></td>
      <td>${buy}</td>
      <td class="num" title="${escapeHtml(buildings)}">${c.buildings.length}</td>
    </tr>`;
  }

  function render(): void {
    const s = host.state();
    const me = host.player();
    const cities = s.cities.filter((c) => c.owner === me);
    let trade = 0;
    let science = 0;
    let gold = 0;
    let upkeep = 0;
    for (const c of cities) {
      const r = cityReport(s, c);
      trade += r.production.trade;
      science += r.science;
      gold += r.gold + r.wealthGold;
      upkeep += c.buildings.reduce((n, b) => n + BUILDINGS[b].upkeep, 0);
    }
    const body = cities.length
      ? `<table class="co-table">
          <thead><tr>
            <th>${t("Město")}</th>
            <th class="num" title="${t("Počet obyvatel")}">${t("Velikost")}</th>
            <th title="${t("Jídlo navíc za tah")}">${t("Jídlo")}</th>
            <th class="num" title="${t("Štíty navíc za tah")}">${t("Štíty")}</th>
            <th class="num">${t("Obchod")}</th>
            <th class="num">${t("Věda")}</th>
            <th class="num">${t("Zlato")}</th>
            <th title="${t("Šťastní / spokojení / nespokojení obyvatelé, hvězdička znamená, že město slaví")}">${t("Nálada")}</th>
            <th>${t("Vyrábí")}</th>
            <th>${t("Koupit")}</th>
            <th class="num" title="${t("Počet budov")}">${t("Budovy")}</th>
          </tr></thead>
          <tbody>${cities.map((c) => row(s, c)).join("")}</tbody>
          <tfoot><tr>
            <td colspan="4">${tn("Celkem {n} město|Celkem {n} města|Celkem {n} měst", cities.length)}</td>
            <td class="num">${trade}</td><td class="num">${science}</td><td class="num">${gold}</td>
            <td colspan="4" class="muted small">${t("Údržba budov stojí {upkeep} zlata za tah.", { upkeep })}</td>
          </tr></tfoot>
        </table>`
      : `<p class="muted">${t("Zatím nemáš žádné město. Založ ho osadníkem klávesou B.")}</p>`;
    dialog.innerHTML = `
      <div class="dialog-head"><h2>${t("Přehled měst")}</h2><span class="spacer"></span><button type="button" data-close>${t("Zavřít")} <kbd>Esc</kbd></button></div>
      <div class="co-body">${body}
        <p class="hint">${t("Klikni na jméno města a otevře se celé. V seznamu Vyrábí změníš, co město staví.")}</p>
      </div>`;
    dialog.querySelector("[data-close]")?.addEventListener("click", close);
    dialog.querySelectorAll<HTMLButtonElement>("[data-open]").forEach((b) =>
      b.addEventListener("click", () => {
        close();
        host.openCity(Number(b.dataset.open));
      }),
    );
    dialog.querySelectorAll<HTMLSelectElement>("select[data-city]").forEach((sel) =>
      sel.addEventListener("change", () => {
        host.run({ type: "setProduction", cityId: Number(sel.dataset.city), item: parseItem(sel.value) });
        host.refresh();
        render();
      }),
    );
    dialog.querySelectorAll<HTMLButtonElement>("[data-buy]").forEach((b) =>
      b.addEventListener("click", () => {
        host.run({ type: "buy", cityId: Number(b.dataset.buy) });
        host.refresh();
        render();
      }),
    );
  }

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });

  return {
    open(): void {
      render();
      if (!dialog.open) dialog.showModal();
    },
    refresh(): void {
      if (dialog.open) render();
    },
    isOpen: () => dialog.open,
  };
}
