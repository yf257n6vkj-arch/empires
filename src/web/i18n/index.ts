/**
 * Translations for the screen. Czech is the source language: every text in
 * the code is written in Czech and wrapped in t("..."), and each other
 * language maps those Czech sentences to its own. A missing translation falls
 * back to Czech, and tests/i18n.test.ts lists every key a language lacks.
 *
 * To add a language, copy en.ts, translate the values, and add it to
 * LANGUAGES below. The language is chosen once when the page loads; switching
 * saves the choice and reloads the page, so module-level t() calls are fine.
 */
import { EN } from "./en";
import type { Language } from "./types";

export type { Language, Names } from "./types";

/** Czech plural forms: 1, 2 to 4, and the rest. */
function czechPlural(n: number): number {
  const a = Math.abs(n);
  if (a === 1) return 0;
  if (Number.isInteger(a) && a >= 2 && a <= 4) return 1;
  return 2;
}

const CS: Language = {
  id: "cs",
  label: "Čeština",
  plural: czechPlural,
  strings: {},
  names: null,
  codex: null,
  techPages: null,
  guide: null,
  more: null,
  cities: null,
};

/** Every language the game offers, in the order the picker shows them. */
export const LANGUAGES: readonly Language[] = [CS, EN];

const STORAGE_KEY = "empires.lang";

function storedLanguage(): Language {
  let id: string | null = null;
  try {
    id = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage is blocked; stay with Czech.
  }
  return LANGUAGES.find((l) => l.id === id) ?? CS;
}

let current: Language = typeof localStorage === "undefined" ? CS : storedLanguage();

/** The language the page runs in. */
export function language(): Language {
  return current;
}

export function isSourceLanguage(): boolean {
  return current === CS;
}

/** Saves the choice and reloads the page in the new language. */
export function switchLanguage(id: string): void {
  if (id === current.id) return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Without storage the choice lasts only for this page.
  }
  if (typeof location !== "undefined") location.reload();
}

/** For tests: run with a given language without touching storage. */
export function useLanguageForTest(id: string): void {
  current = LANGUAGES.find((l) => l.id === id) ?? CS;
}

/** Values for {name} placeholders; any object with string or number fields will do. */
export type Vars = object;

function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  const values = vars as Record<string, unknown>;
  return text.replace(/\{(\w+)\}/g, (m, key: string) => (key in values ? String(values[key]) : m));
}

/** The text in the current language, with {name} placeholders filled from vars. */
export function t(source: string, vars?: Vars): string {
  return fill(current.strings[source] ?? source, vars);
}

/**
 * A text that changes with a number. The source lists the Czech forms for 1,
 * for 2 to 4 and for the rest, separated by "|"; a translation lists the forms
 * its own plural() picks from. {n} in the text is replaced by the number.
 */
export function tn(source: string, n: number, vars?: Vars): string {
  const translated = current.strings[source];
  const forms = (translated ?? source).split("|");
  const index = translated === undefined ? czechPlural(n) : current.plural(n);
  const form = forms[Math.min(index, forms.length - 1)] ?? "";
  return fill(form, { n, ...vars });
}

/**
 * Translates the static page: every element with data-i18n gets its inner
 * HTML translated, and every title and aria-label attribute is translated.
 */
export function translatePage(root: ParentNode): void {
  document.documentElement.lang = current.id;
  if (current === CS) return;
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    el.innerHTML = t(normalize(el.innerHTML));
  });
  for (const attr of ["title", "aria-label"]) {
    root.querySelectorAll<HTMLElement>(`[${attr}]`).forEach((el) => {
      el.setAttribute(attr, t(el.getAttribute(attr) ?? ""));
    });
  }
}

/** Collapses whitespace the way the key extractor in the tests does. */
export function normalize(html: string): string {
  return html.replace(/\s+/g, " ").trim();
}
