import type {
  BuildingId,
  CivId,
  NationId,
  GovernmentId,
  ImprovementId,
  TechId,
  TerrainId,
  UnitTypeId,
} from "../../core";
import type { CityPage } from "../cityPages";
import type { CodexPage } from "../codexPages";
import type { TechPage } from "../encyclopedia";
import type { GuideKey, GuidePage } from "../guidePages";
import type { PageMore } from "../pageMore";

/** Names of everything defined in the rule data, in one language. */
export interface Names {
  units: Record<UnitTypeId, string>;
  buildings: Record<BuildingId, string>;
  techs: Record<TechId, string>;
  terrain: Record<TerrainId, string>;
  /** The special resource of each terrain that has one. */
  specials: Partial<Record<TerrainId, string>>;
  governments: Record<GovernmentId, string>;
  improvements: Record<ImprovementId, string>;
  civs: Record<
    NationId,
    {
      /** The people, in plural. */
      name: string;
      /** The adjective, as in "Roman Empire". */
      adjective: string;
      leader: string;
      /** The nation's city names in the same order as civs.json. */
      cities: string[];
    }
  >;
}

export interface Language {
  /** BCP 47 code, also used for the html lang attribute. */
  id: string;
  /** The name of the language in that language, for the picker. */
  label: string;
  /** Index of the plural form for a number, see tn(). */
  plural(n: number): number;
  /** Czech source text to translation. */
  strings: Record<string, string>;
  /** Names of rule data; null means the Czech names from the data files. */
  names: Names | null;
  /** Encyclopedia pages; null means the Czech pages. Missing pages fall back to Czech. */
  codex: Record<string, CodexPage> | null;
  techPages: Partial<Record<TechId, TechPage>> | null;
  /** The "How to play" chapter; null means the Czech pages. */
  guide: Record<GuideKey, GuidePage> | null;
  /** Second paragraphs and further facts of encyclopedia pages; null means Czech. */
  more: Record<string, PageMore> | null;
  /** Histories of the nations' cities; null means the Czech texts. */
  cities: Record<string, CityPage> | null;
  /** Wikipedia the encyclopedia links to, e.g. "en" for en.wikipedia.org. */
  wikipedia?: string;
  /**
   * Where pages this language does not have yet come from: German and French
   * show the English encyclopedia, Slovak the Czech one. UI texts never fall back here.
   */
  fallback?: Language;
}
