/**
 * Collects every translatable text of the web game: t("...") and tn("...")
 * calls in src/web and the marked parts of index.html. Run it with a language
 * code to see what that language still lacks:
 *
 *   npm run i18n -- en
 *
 * The keys are the Czech source texts, see src/web/i18n/index.ts.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export interface Key {
  text: string;
  /** Used with tn(): the text holds plural forms separated by "|". */
  plural: boolean;
  where: string;
}

const ROOT = join(import.meta.dirname, "..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith(".ts") ? [path] : [];
  });
}

/** Collapses whitespace like translatePage() does. */
export function normalize(html: string): string {
  return html.replace(/\s+/g, " ").trim();
}

function unescapeHtmlAttr(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

export function collectKeys(): Key[] {
  const keys: Key[] = [];
  const call = /\b(tn?)\(\s*("(?:[^"\\\n]|\\.)*")/g;
  for (const file of walk(join(ROOT, "src/web"))) {
    // Language files hold translations, not keys; names.ts has keys of its own.
    if (file.includes(join("src", "web", "i18n")) && !file.endsWith("names.ts")) continue;
    const source = readFileSync(file, "utf8");
    for (const m of source.matchAll(call)) {
      const line = source.slice(0, m.index).split("\n").length;
      keys.push({ text: JSON.parse(m[2]!) as string, plural: m[1] === "tn", where: `${file.slice(ROOT.length + 1)}:${line}` });
    }
  }
  const html = readFileSync(join(ROOT, "index.html"), "utf8");
  for (const inner of markedElements(html)) keys.push({ text: normalize(inner), plural: false, where: "index.html" });
  for (const m of html.matchAll(/\s(?:title|aria-label)="([^"]*)"/g)) {
    if (/[a-zA-Zá-ž]{2}/.test(m[1]!)) keys.push({ text: unescapeHtmlAttr(m[1]!), plural: false, where: "index.html" });
  }
  return keys;
}

/** Inner HTML of every element with a data-i18n attribute. */
export function markedElements(html: string): string[] {
  const found: string[] = [];
  const open = /<(\w+)\b[^>]*\sdata-i18n(?=[\s>])[^>]*>/g;
  for (const m of html.matchAll(open)) {
    const tag = m[1]!;
    const start = m.index + m[0].length;
    const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, "g");
    re.lastIndex = start;
    let depth = 1;
    for (let x = re.exec(html); x; x = re.exec(html)) {
      depth += x[1] ? -1 : 1;
      if (depth === 0) {
        found.push(html.slice(start, x.index));
        break;
      }
    }
  }
  return found;
}

/** Placeholders such as {city} in a text, without {n} which tn() fills itself. */
export function placeholders(text: string): string[] {
  return [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).filter((p) => p !== "n"))].sort();
}

async function main(): Promise<void> {
  const id = process.argv[2];
  const { LANGUAGES } = await import("../src/web/i18n/index");
  const keys = collectKeys();
  const unique = new Map(keys.map((k) => [k.text, k]));
  if (!id) {
    console.log(`${unique.size} texts to translate. Languages: ${LANGUAGES.map((l) => l.id).join(", ")}`);
    return;
  }
  const lang = LANGUAGES.find((l) => l.id === id);
  if (!lang) throw new Error(`Unknown language ${id}`);
  const missing = [...unique.values()].filter((k) => lang.strings[k.text] === undefined);
  for (const k of missing) console.log(`${JSON.stringify(k.text)}: "",  // ${k.where}${k.plural ? " (plural)" : ""}`);
  const unused = Object.keys(lang.strings).filter((k) => !unique.has(k));
  for (const k of unused) console.log(`unused: ${JSON.stringify(k)}`);
  console.log(`${missing.length} missing, ${unused.length} unused, ${unique.size} in total.`);
}

if (process.argv[1]?.endsWith("i18n.ts")) void main();
