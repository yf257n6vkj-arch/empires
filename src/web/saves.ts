/**
 * Saved games: the automatic save of the running game, named save slots in
 * the browser and export to or import from a file.
 */
import { migrateState, STATE_VERSION, type CivId, type GameState } from "../core";
import { t } from "./i18n";
import { civName } from "./i18n/names";

export interface LogEntry {
  turn: number;
  text: string;
}

/** Everything needed to continue a game. */
export interface SavePayload {
  version: number;
  state: GameState;
  log: LogEntry[];
}

export interface SlotInfo {
  id: string;
  name: string;
  /** Milliseconds since 1970, for sorting and showing the date. */
  savedAt: number;
  turn: number;
  civ: CivId;
  seed: string;
}

const AUTOSAVE_KEY = "empires.save";
const INDEX_KEY = "empires.slots";
const SLOT_PREFIX = "empires.slot.";
/** Slots beyond this are refused; the browser storage holds only a few megabytes. */
export const MAX_SLOTS = 12;

export function payloadOf(state: GameState, log: LogEntry[]): SavePayload {
  return { version: STATE_VERSION, state, log };
}

/** Brings any stored payload up to date, or returns null when it cannot be read. */
export function readPayload(raw: string): SavePayload | null {
  try {
    const data = JSON.parse(raw) as { version?: number; state?: Record<string, unknown>; log?: LogEntry[] };
    if (!data || typeof data !== "object" || !data.state) return null;
    const state = migrateState(data.state);
    if (!state) return null;
    return { version: STATE_VERSION, state, log: Array.isArray(data.log) ? data.log : [] };
  } catch {
    return null;
  }
}

// ---------- automatic save ----------

export function writeAutosave(payload: SavePayload): boolean {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function readAutosave(): SavePayload | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    return raw ? readPayload(raw) : null;
  } catch {
    return null;
  }
}

// ---------- named slots ----------

export function listSlots(): SlotInfo[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const list = raw ? (JSON.parse(raw) as SlotInfo[]) : [];
    return list.filter((s) => s && typeof s.id === "string").sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

function writeIndex(list: SlotInfo[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(list));
}

export function defaultSlotName(state: GameState, player: number): string {
  return t("{civ}, tah {turn}", { civ: civName(state.players[player]!.civ), turn: state.turn });
}

/**
 * Saves the game under a name. An existing slot with the same name is
 * overwritten. Returns an error text for the player, or null on success.
 */
export function saveSlot(name: string, payload: SavePayload, player: number): string | null {
  const clean = name.trim() || defaultSlotName(payload.state, player);
  const list = listSlots();
  const existing = list.find((s) => s.name === clean);
  if (!existing && list.length >= MAX_SLOTS) return t("Uložených her je už {n}. Nějakou nejdřív smaž.", { n: MAX_SLOTS });
  const info: SlotInfo = {
    id: existing?.id ?? `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
    name: clean,
    savedAt: Date.now(),
    turn: payload.state.turn,
    civ: payload.state.players[player]!.civ as CivId,
    seed: payload.state.seed,
  };
  try {
    localStorage.setItem(SLOT_PREFIX + info.id, JSON.stringify(payload));
    writeIndex([info, ...list.filter((s) => s.id !== info.id)]);
    return null;
  } catch {
    return t("Prohlížeč už nemá místo. Smaž nějakou starou uloženou hru, nebo hru ulož do souboru.");
  }
}

export function loadSlot(id: string): SavePayload | null {
  try {
    const raw = localStorage.getItem(SLOT_PREFIX + id);
    return raw ? readPayload(raw) : null;
  } catch {
    return null;
  }
}

export function deleteSlot(id: string): void {
  try {
    localStorage.removeItem(SLOT_PREFIX + id);
    writeIndex(listSlots().filter((s) => s.id !== id));
  } catch {
    // Nothing to do: the slot stays listed and can be deleted later.
  }
}

// ---------- files ----------

/** Offers the game as a file to download. */
export function exportToFile(payload: SavePayload, player: number): void {
  const civ = payload.state.players[player]!.civ;
  const blob = new Blob([JSON.stringify({ format: "empires-save", ...payload })], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `empires-${civ}-tah-${payload.state.turn}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lets the player pick a saved file and reads it. */
export function importFromFile(): Promise<SavePayload | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      file
        .text()
        .then((text) => resolve(readPayload(text)))
        .catch(() => resolve(null));
    });
    input.click();
  });
}
