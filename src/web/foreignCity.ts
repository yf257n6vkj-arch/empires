/**
 * Window of a foreign city: what the player knows about it. Everything comes
 * from the player's view, so it shows the same as the computer players know:
 * size, the defenders on the tile when it is in sight, fortifications, the
 * palace and wonders; with an embassy also the other buildings and what the
 * city builds.
 */
import { BUILDINGS, currentEra, isBarbarian, playerView, UNIT_TYPES, type BuildingId, type CivId, type GameState } from "../core";
import { cityPage } from "./cityPages";
import { entryKey, pictureOf } from "./codex";
import { playerColor } from "./render";
import { t, tn } from "./i18n";
import { buildingName, cityLabel, civName, leaderName, productionLabel, unitName } from "./i18n/names";
import { escapeHtml } from "./texts";

const CITY_PICTURES = import.meta.glob<string>("./sprites/city-*.webp", { eager: true, query: "?url", import: "default" });

function cityPicture(era: number, size: number): string | null {
  const stage = era >= 5 ? "modern" : era >= 4 ? "industrial" : era >= 2 ? "medieval" : "ancient";
  const big = size >= 6 ? "large" : "small";
  const find = (s: string) => Object.entries(CITY_PICTURES).find(([path]) => path.endsWith(`/city-${stage}-${s}.webp`))?.[1] ?? null;
  return find(big) ?? find(big === "large" ? "small" : "large");
}

export interface ForeignCityHost {
  state(): GameState;
  player(): number;
  openEntry(key: string): void;
  openNations(): void;
  /** Name of the selected unit, or null when none is selected. */
  selectedUnitName(): string | null;
  /** Sends the selected unit towards the point. */
  sendTo(p: { x: number; y: number }): void;
}

export function createForeignCity(dialog: HTMLDialogElement, host: ForeignCityHost) {
  let cityId: number | null = null;
  let historyOpen = false;

  function render(): void {
    const s = host.state();
    const me = host.player();
    const view = playerView(s, me);
    const c = view.foreignCities.find((x) => x.id === cityId);
    if (!c) {
      dialog.close();
      return;
    }
    const owner = s.players[c.owner]!;
    const barbarian = isBarbarian(owner);
    const rival = view.rivals.find((r) => r.id === c.owner);
    const civ = owner.civ as CivId;
    const inSight = view.visible[c.y * view.width + c.x] === 1;
    const defenders = view.foreignUnits.filter((u) => u.x === c.x && u.y === c.y);
    const picture = cityPicture(currentEra(owner), c.size);
    const portrait = barbarian ? null : pictureOf(`lead-${civ}`);

    const relation = rival?.atWar ? `<b class="neg">${t("válka")}</b>` : t("mír");
    const who = barbarian
      ? t("Město drží barbaři.")
      : t("{nation}, vládce {leader}", { nation: escapeHtml(civName(civ)), leader: escapeHtml(leaderName(civ)) });

    const unitList = defenders.length
      ? `<ul class="fc-list">${defenders
          .map((u) => {
            const r = UNIT_TYPES[u.type];
            return `<li><button type="button" class="linklike" data-entry="unit-${u.type}">${escapeHtml(unitName(u.type))}</button>${u.veteran ? " ★" : ""} <span class="muted small">${t("obrana {d} · životy {hp} z {max}", { d: r.defense, hp: u.hp, max: r.hp })}</span></li>`;
          })
          .join("")}</ul>`
      : `<p class="small">${inSight ? t("Ve městě nevidíš žádné jednotky. Ve válce ho dobude první voják, který do něj vejde.") : t("Město teď nevidíš, takže nevíš, kdo ho brání. Pošli k němu jednotku.")}</p>`;

    const isFort = (b: BuildingId) => !BUILDINGS[b].wonder && b !== "palace";
    const forts = c.buildings.filter((b) => isFort(b) && ((BUILDINGS[b].effects.defenseVsLandPct ?? 0) > 0 || (BUILDINGS[b].effects.defenseVsSeaPct ?? 0) > 0));
    const wonders = c.buildings.filter((b) => BUILDINGS[b].wonder);
    const others = c.buildings.filter((b) => !BUILDINGS[b].wonder && b !== "palace" && !forts.includes(b));
    const link = (b: BuildingId) => `<button type="button" class="linklike" data-entry="${entryKey("building", b)}">${escapeHtml(buildingName(b))}</button>`;

    const facts: string[] = [];
    facts.push(tn("Ve městě žije jeden obyvatel.|Ve městě žijí {n} obyvatelé.|Ve městě žije {n} obyvatel.", c.size));
    if (c.buildings.includes("palace")) facts.push(t("Je to hlavní město říše."));
    facts.push(forts.length ? t("Chrání ho {list}.", { list: forts.map(link).join(", ") }) : t("Hradby nemá."));
    if (wonders.length) facts.push(t("Stojí v něm {list}.", { list: wonders.map(link).join(", ") }));

    const embassy = c.productionKnown
      ? `<h3>${t("Co víš od velvyslanectví")}</h3>
         <p>${t("Staví: {item}.", { item: escapeHtml(productionLabel(c.production)) })}</p>
         <p>${others.length ? t("Další budovy: {list}.", { list: others.map(link).join(", ") }) : t("Jiné budovy nemá.")}</p>`
      : barbarian
        ? ""
        : `<p class="small muted">${t("Co město staví a jaké má další budovy, prozradí velvyslanectví. Otevře ho diplomat, který dojde do kteréhokoli města tohoto národa.")}</p>`;

    const history = cityPage(c.name, owner.civ);
    const sendable = host.selectedUnitName();
    const historyBlock =
      history && historyOpen
        ? `<div class="fc-history"><p>${escapeHtml(history.page.text)}</p><a href="${history.url}" target="_blank" rel="noopener">${t("Přečti si víc na Wikipedii: {title}", { title: escapeHtml(history.page.wiki) })} ↗</a></div>`
        : "";

    dialog.innerHTML = `
      <div class="dialog-head"><h2>${escapeHtml(cityLabel(c.name))}</h2><span class="muted small">${relation}</span><button type="button" class="tp-close" data-close aria-label="${t("Zavřít")}" title="${t("Zavřít (Esc)")}">×</button></div>
      <div class="fc-top">
        ${picture ? `<img class="fc-city" src="${picture}" alt="" style="--owner:${playerColor(c.owner)}">` : ""}
        <div class="fc-facts">
          <div class="fc-who">${portrait ? `<button type="button" class="fc-portrait" data-entry="lead-${civ}" title="${t("O vládci v encyklopedii")}"><img src="${portrait}" alt=""></button>` : ""}<span>${who}</span></div>
          <p>${facts.join(" ")}</p>
        </div>
      </div>
      <h3>${t("Kdo město brání")}</h3>
      ${unitList}
      ${embassy}
      ${historyBlock}
      <div class="fc-buttons">
        ${sendable ? `<button type="button" data-send>${t("Poslat sem: {unit}", { unit: escapeHtml(sendable) })}</button>` : ""}
        ${history ? `<button type="button" data-history>${historyOpen ? t("Skrýt historii") : t("Historie města")}</button>` : ""}
        ${barbarian ? "" : `<button type="button" data-nations>${t("Národy")}</button>`}
      </div>`;
    dialog.querySelector("[data-close]")?.addEventListener("click", () => dialog.close());
    dialog.querySelectorAll<HTMLButtonElement>("[data-entry]").forEach((b) => b.addEventListener("click", () => host.openEntry(b.dataset.entry!)));
    dialog.querySelector("[data-history]")?.addEventListener("click", () => {
      historyOpen = !historyOpen;
      render();
    });
    dialog.querySelector("[data-send]")?.addEventListener("click", () => {
      dialog.close();
      host.sendTo({ x: c.x, y: c.y });
    });
    dialog.querySelector("[data-nations]")?.addEventListener("click", () => {
      dialog.close();
      host.openNations();
    });
  }

  return {
    open(id: number): void {
      cityId = id;
      historyOpen = false;
      render();
      if (!dialog.open) dialog.showModal();
    },
    isOpen: () => dialog.open,
  };
}
