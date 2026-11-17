import { EN } from "./en";
import { FR_GUIDE } from "./fr-guide";
import { FR_NAMES } from "./fr-names";
import { FR_STRINGS } from "./fr-strings";
import type { Language } from "./types";

/** French: the encyclopedia pages come from English until they are translated. */
export const FR: Language = {
  id: "fr",
  label: "Français",
  // In French, 0 and 1 take the singular.
  plural: (n) => (Math.abs(n) < 2 ? 0 : 1),
  strings: FR_STRINGS,
  names: FR_NAMES,
  codex: null,
  techPages: null,
  guide: FR_GUIDE,
  more: null,
  cities: null,
  wikipedia: "fr",
  fallback: EN,
};
