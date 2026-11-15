/**
 * The new game dialog: the player picks a nation and, if they like, a seed.
 */
import { CIV_IDS, CIVS, type CivId } from "../core";
import { pictureOf } from "./codex";
import { escapeHtml } from "./texts";
import { t } from "./i18n";
import { cityLabel, civName, leaderName } from "./i18n/names";

export interface NewGameHost {
  start(seed: string, civ: CivId | undefined): void;
  randomSeed(): string;
  /** Opens the encyclopedia page of a nation. */
  showNation(civ: CivId): void;
}

export function createNewGameDialog(dialog: HTMLDialogElement, host: NewGameHost) {
  let chosen: CivId | "random" = "czechs";

  function render(firstGame: boolean): void {
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
          <label class="ng-seed">${t("Kód mapy")} <input type="text" spellcheck="false" placeholder="${t("náhodný")}" data-seed></label>
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
    dialog.querySelector('[data-act="read"]')?.addEventListener("click", () => {
      if (chosen !== "random") host.showNation(chosen);
    });
    dialog.querySelector('[data-act="start"]')!.addEventListener("click", () => {
      const seed = dialog.querySelector<HTMLInputElement>("[data-seed]")!.value.trim() || host.randomSeed();
      dialog.close();
      host.start(seed, chosen === "random" ? undefined : chosen);
    });
  }

  return {
    open(firstGame = false): void {
      render(firstGame);
      // The very first game cannot be dismissed: there is nothing behind it yet.
      dialog.oncancel = firstGame ? (e) => e.preventDefault() : null;
      dialog.showModal();
      dialog.querySelector<HTMLButtonElement>('[data-act="start"]')?.focus();
    },
    isOpen: () => dialog.open,
  };
}
