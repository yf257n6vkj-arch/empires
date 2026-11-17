import { describe, expect, it } from "vitest";
import { GOVERNMENTS } from "../src/core";
import { governmentCells } from "../src/web/texts";

describe("government comparison table", () => {
  it("shows despotism's limits and its tile penalty", () => {
    const c = governmentCells(GOVERNMENTS.despotism);
    expect(c.rate).toBe("60 %");
    expect(c.corruption).toBe("100 %");
    expect(c.freeUnits).toBe("3");
    expect(c.soldiers).toBe("doma uklidní");
    expect(c.celebration).toBe("bez postihu");
    expect(c.extra).toContain("o jeden méně");
  });

  it("shows flat corruption for communism and none for democracy", () => {
    expect(governmentCells(GOVERNMENTS.communism).corruption).toBe("15 % všude");
    expect(governmentCells(GOVERNMENTS.democracy).corruption).toBe("žádná");
  });

  it("lists every special rule of democracy on its own line", () => {
    const c = governmentCells(GOVERNMENTS.democracy);
    expect(c.soldiers).toBe("venku rozladí 2");
    expect(c.celebration).toBe("roste každý tah");
    expect(c.extra.split("<br>")).toHaveLength(3);
  });

  it("shows a dash where a government has nothing special", () => {
    expect(governmentCells(GOVERNMENTS.monarchy).extra).toBe("–");
  });
});
