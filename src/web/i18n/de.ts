import { DE_GUIDE } from "./de-guide";
import { DE_NAMES } from "./de-names";
import { DE_STRINGS } from "./de-strings";
import { EN } from "./en";
import type { Language } from "./types";

/** German: the encyclopedia pages come from English until they are translated. */
export const DE: Language = {
  id: "de",
  label: "Deutsch",
  plural: (n) => (Math.abs(n) === 1 ? 0 : 1),
  strings: DE_STRINGS,
  names: DE_NAMES,
  codex: null,
  techPages: null,
  guide: DE_GUIDE,
  more: null,
  cities: null,
  wikipedia: "de",
  fallback: EN,
};
