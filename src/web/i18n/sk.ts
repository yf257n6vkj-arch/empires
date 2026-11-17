import { SK_GUIDE } from "./sk-guide";
import { SK_NAMES } from "./sk-names";
import { SK_STRINGS } from "./sk-strings";
import type { Language } from "./types";

/** Slovak plural forms, like Czech: 1, 2 to 4, and the rest. */
function slovakPlural(n: number): number {
  const a = Math.abs(n);
  if (a === 1) return 0;
  if (Number.isInteger(a) && a >= 2 && a <= 4) return 1;
  return 2;
}

/** Slovak: the encyclopedia stays in Czech, which Slovak readers understand. */
export const SK: Language = {
  id: "sk",
  label: "Slovenčina",
  plural: slovakPlural,
  strings: SK_STRINGS,
  names: SK_NAMES,
  codex: null,
  techPages: null,
  guide: SK_GUIDE,
  more: null,
  cities: null,
};
