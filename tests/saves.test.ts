import { beforeEach, describe, expect, it } from "vitest";
import { newGame } from "../src/core";
import {
  deleteSlot,
  listSlots,
  loadSlot,
  MAX_SLOTS,
  payloadOf,
  readAutosave,
  readPayload,
  saveSlot,
  writeAutosave,
} from "../src/web/saves";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

beforeEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
});

const game = newGame({ seed: "saves", playerCount: 4 });
const payload = payloadOf(game, [{ turn: 1, text: "Začátek" }]);

describe("saved games", () => {
  it("keeps the automatic save", () => {
    expect(readAutosave()).toBeNull();
    expect(writeAutosave(payload)).toBe(true);
    expect(readAutosave()).toEqual(payload);
  });

  it("stores, lists, loads and deletes named slots", () => {
    expect(saveSlot("První", payload, 0)).toBeNull();
    const [slot] = listSlots();
    expect(slot).toMatchObject({ name: "První", turn: game.turn, civ: game.players[0]!.civ, seed: game.seed });
    expect(loadSlot(slot!.id)).toEqual(payload);
    deleteSlot(slot!.id);
    expect(listSlots()).toEqual([]);
    expect(loadSlot(slot!.id)).toBeNull();
  });

  it("overwrites a slot with the same name", () => {
    saveSlot("Hra", payload, 0);
    const later = payloadOf({ ...game, turn: game.turn + 5 }, []);
    saveSlot("Hra", later, 0);
    const slots = listSlots();
    expect(slots).toHaveLength(1);
    expect(loadSlot(slots[0]!.id)?.state.turn).toBe(game.turn + 5);
  });

  it("names an unnamed save after the nation and turn", () => {
    saveSlot("  ", payload, 0);
    expect(listSlots()[0]!.name).toMatch(/, tah \d+$/);
  });

  it("refuses a new slot when the browser list is full", () => {
    for (let i = 0; i < MAX_SLOTS; i++) expect(saveSlot(`Hra ${i}`, payload, 0)).toBeNull();
    expect(saveSlot("Navíc", payload, 0)).toMatch(/smaž/);
    expect(saveSlot("Hra 3", payload, 0)).toBeNull();
  });

  it("rejects files that are not a game", () => {
    expect(readPayload("not json")).toBeNull();
    expect(readPayload(JSON.stringify({ hello: 1 }))).toBeNull();
    expect(readPayload(JSON.stringify(payload))?.state).toEqual(game);
  });
});
