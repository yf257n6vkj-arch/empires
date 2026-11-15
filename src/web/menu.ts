/**
 * The start screen, the in-game menu, saving and loading, and the controls
 * help. Inspired by the main menu of Civilization III: a big painted
 * background with a short column of choices.
 */
import { CIVS, type CivId } from "../core";
import { pictureOf } from "./codex";
import {
  defaultSlotName,
  deleteSlot,
  exportToFile,
  importFromFile,
  listSlots,
  loadSlot,
  MAX_SLOTS,
  saveSlot,
  type SavePayload,
} from "./saves";
import { escapeHtml } from "./texts";
import { language, LANGUAGES, switchLanguage, t } from "./i18n";
import { civName } from "./i18n/names";

export interface MenuHost {
  /** The nation and turn of the automatically saved game, or null when there is none. */
  autosaveInfo(): { civ: CivId; turn: number } | null;
  continueGame(): void;
  /** Opens the dialog for choosing a nation. */
  newGame(): void;
  currentPayload(): SavePayload;
  loadPayload(payload: SavePayload): void;
  openCodex(): void;
  /** Shows the advisor's tips again. */
  openAdvisor(): void;
  /** Opens the overview of all cities. */
  openCities(): void;
  /** Player whose game is saved, for slot names. */
  player: number;
}

const BACKDROPS = ["civ-czechs", "civ-romans", "civ-egyptians", "wdr-pyramids", "civ-english", "civ-aztecs", "wdr-greatWall", "civ-greeks", "wdr-stVitus", "civ-chinese"];

function dateText(ms: number): string {
  const format = new Intl.DateTimeFormat(language().id, { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return format.format(new Date(ms));
}

export function createMenus(
  start: HTMLElement,
  menuDialog: HTMLDialogElement,
  savesDialog: HTMLDialogElement,
  helpDialog: HTMLDialogElement,
  host: MenuHost,
) {
  // ---------- start screen ----------

  let slide = 0;
  let slideTimer: number | undefined;
  const pictures = BACKDROPS.map(pictureOf).filter((u): u is string => u !== null);

  function showSlide(): void {
    const layers = start.querySelectorAll<HTMLDivElement>(".st-bg");
    if (layers.length < 2 || pictures.length === 0) return;
    const [front, back] = slide % 2 === 0 ? [layers[0]!, layers[1]!] : [layers[1]!, layers[0]!];
    front.style.backgroundImage = `url('${pictures[slide % pictures.length]}')`;
    front.classList.add("on");
    back.classList.remove("on");
    slide++;
  }

  function renderStart(): void {
    const info = host.autosaveInfo();
    const cont = info ? t("{civ}, tah {turn}", { civ: civName(info.civ), turn: info.turn }) : t("žádná rozehraná hra");
    start.innerHTML = `
      <div class="st-bg"></div><div class="st-bg"></div><div class="st-shade"></div>
      <div class="st-panel">
        <h1 class="st-title">Empires</h1>
        <p class="st-sub">${t("tahová strategie o patnácti národech")}</p>
        <nav class="st-menu">
          <button type="button" data-act="continue" ${info ? "" : "disabled"}>${t("Pokračovat")}<span>${escapeHtml(cont)}</span></button>
          <button type="button" data-act="new">${t("Nová hra")}</button>
          <button type="button" data-act="load">${t("Nahrát hru")}</button>
          <button type="button" data-act="codex">${t("Encyklopedie")}</button>
          <button type="button" data-act="help">${t("Ovládání")}</button>
        </nav>
        <div class="st-langs">${LANGUAGES.map((l) => `<button type="button" data-lang="${l.id}" class="${l.id === language().id ? "on" : ""}" lang="${l.id}">${escapeHtml(l.label)}</button>`).join("")}</div>
        <p class="st-foot">${t("fáze 2 · hra se průběžně ukládá sama")}</p>
      </div>`;
    start.querySelectorAll<HTMLButtonElement>("[data-lang]").forEach((b) => b.addEventListener("click", () => switchLanguage(b.dataset.lang!)));
    start.querySelector('[data-act="continue"]')!.addEventListener("click", () => {
      hideStart();
      host.continueGame();
    });
    start.querySelector('[data-act="new"]')!.addEventListener("click", host.newGame);
    start.querySelector('[data-act="load"]')!.addEventListener("click", () => openSaves("load"));
    start.querySelector('[data-act="codex"]')!.addEventListener("click", host.openCodex);
    start.querySelector('[data-act="help"]')!.addEventListener("click", () => helpDialog.showModal());
    showSlide();
  }

  function showStart(): void {
    if (menuDialog.open) menuDialog.close();
    renderStart();
    start.hidden = false;
    window.clearInterval(slideTimer);
    slideTimer = window.setInterval(showSlide, 7000);
    start.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
  }

  function hideStart(): void {
    start.hidden = true;
    window.clearInterval(slideTimer);
  }

  // ---------- in-game menu ----------

  function wireMenu(): void {
    const act = (name: string, fn: () => void) => menuDialog.querySelector(`[data-act="${name}"]`)!.addEventListener("click", fn);
    act("resume", () => menuDialog.close());
    act("save", () => openSaves("save"));
    act("load", () => openSaves("load"));
    act("new", () => {
      menuDialog.close();
      host.newGame();
    });
    act("codex", () => {
      menuDialog.close();
      host.openCodex();
    });
    act("help", () => helpDialog.showModal());
    act("cities", () => {
      menuDialog.close();
      host.openCities();
    });
    act("advisor", () => {
      menuDialog.close();
      host.openAdvisor();
    });
    act("main", showStart);
    const picker = menuDialog.querySelector<HTMLSelectElement>("#language");
    if (picker) {
      picker.innerHTML = LANGUAGES.map((l) => `<option value="${l.id}" ${l.id === language().id ? "selected" : ""}>${escapeHtml(l.label)}</option>`).join("");
      picker.addEventListener("change", () => switchLanguage(picker.value));
    }
  }
  wireMenu();
  helpDialog.querySelector('[data-act="close"]')?.addEventListener("click", () => helpDialog.close());

  // ---------- saving and loading ----------

  function openSaves(mode: "save" | "load", message = ""): void {
    const slots = listSlots();
    const payload = mode === "save" ? host.currentPayload() : null;
    const suggested = payload ? defaultSlotName(payload.state, host.player) : "";
    const rows = slots.length
      ? slots
          .map(
            (s) => `<li class="sv-row" data-id="${s.id}">
              <span class="sv-dot" style="background:${CIVS[s.civ]?.color ?? "#888"}"></span>
              <div class="sv-info"><b>${escapeHtml(s.name)}</b><span class="muted small">${escapeHtml(CIVS[s.civ] ? civName(s.civ) : "")} · ${t("tah {turn}", { turn: s.turn })} · ${dateText(s.savedAt)}</span></div>
              <button type="button" class="${mode === "load" ? "primary" : ""}" data-slot="${s.id}">${mode === "load" ? t("Nahrát") : t("Přepsat")}</button>
              <button type="button" class="sv-del" data-del="${s.id}" title="${t("Smazat")}">${t("Smazat")}</button>
            </li>`,
          )
          .join("")
      : `<li class="muted sv-empty">${t("Zatím tu nic uloženého není.")}</li>`;
    savesDialog.innerHTML = `
      <div class="sv">
        <div class="dialog-head"><h2>${mode === "save" ? t("Uložit hru") : t("Nahrát hru")}</h2><button type="button" class="tp-close" data-act="close" aria-label="${t("Zavřít")}">×</button></div>
        ${
          mode === "save"
            ? `<form class="sv-new"><input type="text" maxlength="60" value="${escapeHtml(suggested)}" aria-label="${t("Jméno uložené hry")}"><button type="submit" class="primary">${t("Uložit")}</button></form>`
            : ""
        }
        <p class="sv-msg" aria-live="polite"></p>
        <ul class="sv-list">${rows}</ul>
        <div class="sv-foot">
          <span class="muted small">${t("V prohlížeči se vejde {n} uložených her. Do souboru si hru přeneseš i na jiný počítač.", { n: MAX_SLOTS })}</span>
          <button type="button" data-act="file">${mode === "save" ? t("Uložit do souboru") : t("Nahrát ze souboru")}</button>
        </div>
      </div>`;
    const msg = savesDialog.querySelector<HTMLParagraphElement>(".sv-msg")!;
    const say = (text: string) => (msg.textContent = text);
    say(message);
    savesDialog.querySelector('[data-act="close"]')!.addEventListener("click", () => savesDialog.close());
    savesDialog.querySelector("form.sv-new")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = savesDialog.querySelector<HTMLInputElement>("form.sv-new input")!.value;
      const error = saveSlot(name, host.currentPayload(), host.player);
      if (error) return say(error);
      openSaves("save", t("Hra je uložená."));
    });
    savesDialog.querySelectorAll<HTMLButtonElement>("[data-slot]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.dataset.slot!;
        if (mode === "save") {
          const slot = slots.find((s) => s.id === id)!;
          const error = saveSlot(slot.name, host.currentPayload(), host.player);
          if (error) return say(error);
          return openSaves("save", t("Hra je uložená."));
        }
        const loaded = loadSlot(id);
        if (!loaded) return say(t("Tuhle uloženou hru už nejde přečíst."));
        finishLoad(loaded);
      }),
    );
    savesDialog.querySelectorAll<HTMLButtonElement>("[data-del]").forEach((b) =>
      b.addEventListener("click", () => {
        if (b.dataset.confirm !== "1") {
          b.dataset.confirm = "1";
          b.textContent = t("Opravdu?");
          return;
        }
        deleteSlot(b.dataset.del!);
        openSaves(mode);
      }),
    );
    savesDialog.querySelector('[data-act="file"]')!.addEventListener("click", async () => {
      if (mode === "save") return exportToFile(host.currentPayload(), host.player);
      const loaded = await importFromFile();
      if (!loaded) return say(t("Tenhle soubor neobsahuje uloženou hru, kterou bych uměl přečíst."));
      finishLoad(loaded);
    });
    if (!savesDialog.open) savesDialog.showModal();
    savesDialog.querySelector<HTMLInputElement>("form.sv-new input")?.select();
  }

  function finishLoad(payload: SavePayload): void {
    savesDialog.close();
    if (menuDialog.open) menuDialog.close();
    hideStart();
    host.loadPayload(payload);
  }

  return {
    showStart,
    hideStart,
    isStartOpen: () => !start.hidden,
    openMenu: () => menuDialog.showModal(),
    isOpen: () => menuDialog.open || savesDialog.open || helpDialog.open || !start.hidden,
  };
}
