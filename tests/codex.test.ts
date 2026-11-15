import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { codexEntryCount, codexMissingPages } from "../src/web/codex";
import { CODEX_PAGES } from "../src/web/codexPages";

describe("encyclopedia", () => {
  it("has a page for every unit, building, wonder, government, terrain and improvement", () => {
    expect(codexMissingPages()).toEqual([]);
    expect(Object.keys(CODEX_PAGES)).toHaveLength(codexEntryCount());
  });

  it("asks the Mac scripts for an article and a picture for every entry", () => {
    const ids = (file: string) =>
      readFileSync(`tools/mac/${file}`, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((l) => l.split("\t")[0]);
    expect(ids("encyklopedie-wiki.tsv").sort()).toEqual(Object.keys(CODEX_PAGES).sort());
    expect(ids("encyklopedie-zadani.tsv").sort()).toEqual(Object.keys(CODEX_PAGES).sort());
  });
});
