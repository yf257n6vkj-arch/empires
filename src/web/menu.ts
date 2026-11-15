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

export interface MenuHost {
  /** The nation and turn of the automatically saved game, or null when there is none. */
  autosaveInfo(): { civ: CivId; turn: number } | null;
  continueGame(): void;
  /** Opens the dialog for choosing a nation. */
  newGame(): void;
  currentPayload(): SavePayload;
  loadPayload(payload: SavePayload): void;
  openCodex(): void;
  /** Player whose game is saved, for slot names. */
  player: number;
}

const BACKDROPS = ["civ-czechs", "civ-romans", "civ-egyptians", "wdr-pyramids", "civ-english", "civ-aztecs", "wdr-greatWall", "civ-greeks", "wdr-stVitus", "civ-chinese"];

function dateText(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
    const cont = info ? `${CIVS[info.civ].name}, tah ${info.turn}` : "žádná rozehraná hra";
    start.innerHTML = `
      <div class="st-bg"></div><div class="st-bg"></div><div class="st-shade"></div>
      <div class="st-panel">
        <h1 class="st-title">Empires</h1>
        <p class="st-sub">tahová strategie o patnácti národech</p>
        <nav class="st-menu">
          <button type="button" data-act="continue" ${info ? "" : "disabled"}>Pokračovat<span>${escapeHtml(cont)}</span></button>
          <button type="button" data-act="new">Nová hra</button>
          <button type="button" data-act="load">Nahrát hru</button>
          <button type="button" data-act="codex">Encyklopedie</button>
          <button type="button" data-act="help">Ovládání</button>
        </nav>
        <p class="st-foot">fáze 2 · hra se ukládá sama po každém kroku</p>
      </div>`;
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
    act("main", showStart);
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
              <div class="sv-info"><b>${escapeHtml(s.name)}</b><span class="muted small">${escapeHtml(CIVS[s.civ]?.name ?? "")} · tah ${s.turn} · ${dateText(s.savedAt)}</span></div>
              <button type="button" class="${mode === "load" ? "primary" : ""}" data-slot="${s.id}">${mode === "load" ? "Nahrát" : "Přepsat"}</button>
              <button type="button" class="sv-del" data-del="${s.id}" title="Smazat">Smazat</button>
            </li>`,
          )
          .join("")
      : `<li class="muted sv-empty">Zatím tu nic uloženého není.</li>`;
    savesDialog.innerHTML = `
      <div class="sv">
        <div class="dialog-head"><h2>${mode === "save" ? "Uložit hru" : "Nahrát hru"}</h2><button type="button" class="tp-close" data-act="close" aria-label="Zavřít">×</button></div>
        ${
          mode === "save"
            ? `<form class="sv-new"><input type="text" maxlength="60" value="${escapeHtml(suggested)}" aria-label="Jméno uložené hry"><button type="submit" class="primary">Uložit</button></form>`
            : ""
        }
        <p class="sv-msg" aria-live="polite"></p>
        <ul class="sv-list">${rows}</ul>
        <div class="sv-foot">
          <span class="muted small">V prohlížeči se vejde ${MAX_SLOTS} uložených her. Do souboru si hru přeneseš i na jiný počítač.</span>
          <button type="button" data-act="file">${mode === "save" ? "Uložit do souboru" : "Nahrát ze souboru"}</button>
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
      openSaves("save", "Hra je uložená.");
    });
    savesDialog.querySelectorAll<HTMLButtonElement>("[data-slot]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.dataset.slot!;
        if (mode === "save") {
          const slot = slots.find((s) => s.id === id)!;
          const error = saveSlot(slot.name, host.currentPayload(), host.player);
          if (error) return say(error);
          return openSaves("save", "Hra je uložená.");
        }
        const loaded = loadSlot(id);
        if (!loaded) return say("Tuhle uloženou hru už nejde přečíst.");
        finishLoad(loaded);
      }),
    );
    savesDialog.querySelectorAll<HTMLButtonElement>("[data-del]").forEach((b) =>
      b.addEventListener("click", () => {
        if (b.dataset.confirm !== "1") {
          b.dataset.confirm = "1";
          b.textContent = "Opravdu?";
          return;
        }
        deleteSlot(b.dataset.del!);
        openSaves(mode);
      }),
    );
    savesDialog.querySelector('[data-act="file"]')!.addEventListener("click", async () => {
      if (mode === "save") return exportToFile(host.currentPayload(), host.player);
      const loaded = await importFromFile();
      if (!loaded) return say("Tenhle soubor neobsahuje uloženou hru, kterou bych uměl přečíst.");
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
