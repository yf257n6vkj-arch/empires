import { EN_CODEX } from "./en-codex";
import { EN_NAMES } from "./en-names";
import { EN_STRINGS } from "./en-strings";
import { EN_TECH_PAGES } from "./en-techs";
import type { Language } from "./types";

export const EN: Language = {
  id: "en",
  label: "English",
  plural: (n) => (Math.abs(n) === 1 ? 0 : 1),
  strings: EN_STRINGS,
  names: EN_NAMES,
  codex: EN_CODEX,
  techPages: EN_TECH_PAGES,
  wikipedia: "en",
};
