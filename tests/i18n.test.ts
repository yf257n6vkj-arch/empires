import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CIV_IDS, CIVS, TECH_IDS } from "../src/core";
import { collectKeys, placeholders } from "../tools/i18n";
import { LANGUAGES, t, tn, useLanguageForTest } from "../src/web/i18n";
import { cityLabel, productionLabel, realmLabel, unitName } from "../src/web/i18n/names";
import { codexKeys, codexPage } from "../src/web/codex";
import { techPage } from "../src/web/encyclopedia";

const keys = collectKeys();
const unique = new Map(keys.map((k) => [k.text, k]));
const others = LANGUAGES.filter((l) => l.id !== "cs");

afterEach(() => useLanguageForTest("cs"));

describe("translations", () => {
  it("finds the texts of the game", () => {
    expect(unique.size).toBeGreaterThan(500);
    expect(unique.has("Konec tahu")).toBe(true);
  });

  for (const lang of others) {
    it(`${lang.id} translates every text and nothing more`, () => {
      const missing = [...unique.keys()].filter((k) => lang.strings[k] === undefined);
      const unused = Object.keys(lang.strings).filter((k) => !unique.has(k));
      expect(missing).toEqual([]);
      expect(unused).toEqual([]);
    });

    it(`${lang.id} keeps the placeholders and gives every plural form`, () => {
      const needed = Math.max(...[0, 1, 2, 3, 4, 5, 11, 21, 100].map((n) => lang.plural(n))) + 1;
      for (const [text, key] of unique) {
        const own = lang.strings[text];
        if (own === undefined) continue;
        expect(placeholders(own), text).toEqual(placeholders(text));
        if (key.plural) expect(own.split("|").length, text).toBe(needed);
        else expect(own.includes("|"), text).toBe(text.includes("|"));
      }
    });

    it(`${lang.id} names every nation's cities in the same order`, () => {
      if (!lang.names) return;
      for (const civ of CIV_IDS) expect(lang.names.civs[civ].cities, civ).toHaveLength(CIVS[civ].cities.length);
    });

    it(`${lang.id} encyclopedia pages, where present, cover every entry`, () => {
      if (lang.codex) expect(codexKeys().filter((k) => !lang.codex![k])).toEqual([]);
      if (lang.techPages) expect(TECH_IDS.filter((x) => !lang.techPages![x])).toEqual([]);
    });
  }

  it("uses plain ASCII placeholder names", () => {
    for (const text of unique.keys()) expect(text, text).not.toMatch(/\{[^}]*[^\w}][^}]*\}/);
  });

  it("marks every plural text with three Czech forms", () => {
    for (const k of keys.filter((x) => x.plural)) expect(k.text.split("|"), k.where).toHaveLength(3);
  });

  it("leaves no Czech text in the web code outside t()", () => {
    const czech = /[ěščřžýáíéůúňťďĚŠČŘŽÝÁÍÉŮÚŇŤĎ]/;
    const skip = ["codexPages.ts", "encyclopedia.ts", join("web", "i18n")];
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? files(p) : p.endsWith(".ts") ? [p] : [];
      });
    const found: string[] = [];
    for (const file of files("src/web")) {
      if (skip.some((s) => file.includes(s))) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, n) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
          const code = line.replace(/\b(t|tn)\(\s*"(?:[^"\\]|\\.)*"/g, "").replace(/\/\/.*$/, "");
          if (czech.test(code)) found.push(`${file}:${n + 1}: ${trimmed}`);
        });
    }
    expect(found).toEqual([]);
  });
});

describe("switching the language", () => {
  it("translates texts, plurals and names", () => {
    useLanguageForTest("en");
    expect(t("Konec tahu")).toBe("End turn");
    expect(tn("{n} tah|{n} tahy|{n} tahů", 1)).toBe("1 turn");
    expect(tn("{n} tah|{n} tahy|{n} tahů", 3)).toBe("3 turns");
    expect(unitName("settlers")).toBe("Settler");
    expect(productionLabel({ kind: "wealth" })).toBe("Earn gold");
    expect(realmLabel("czechs")).toBe("Czech Empire");
    expect(cityLabel("Praha")).toBe("Prague");
    expect(cityLabel("Praha 2")).toBe("Prague 2");
    expect(cityLabel("Lipník")).toBe("Lipník");
  });

  it("keeps Czech forms and names in Czech", () => {
    expect(tn("{n} tah|{n} tahy|{n} tahů", 1)).toBe("1 tah");
    expect(tn("{n} tah|{n} tahy|{n} tahů", 3)).toBe("3 tahy");
    expect(tn("{n} tah|{n} tahy|{n} tahů", 5)).toBe("5 tahů");
    expect(unitName("settlers")).toBe("Osadník");
    expect(realmLabel("czechs")).toBe("Česká říše");
    expect(cityLabel("Praha")).toBe("Praha");
  });

  it("shows encyclopedia pages in the chosen language with links to its Wikipedia", () => {
    useLanguageForTest("en");
    expect(techPage("pottery").page.text).toMatch(/^When clay is fired/);
    expect(techPage("pottery").url).toBe("https://en.wikipedia.org/w/index.php?search=Pottery");
    expect(codexPage("unit-settlers")!.url).toBe("https://en.wikipedia.org/w/index.php?search=Colonization");
    useLanguageForTest("cs");
    expect(techPage("pottery").url).toBe("https://cs.wikipedia.org/wiki/Keramika");
  });
});
