/**
 * Names of rule data in the current language. The web code never shows
 * UNIT_TYPES[x].name and friends directly; it asks here.
 */
import {
  BUILDINGS,
  CIVS,
  CIV_IDS,
  GOVERNMENTS,
  IMPROVEMENTS,
  TECHS,
  TERRAINS,
  UNIT_TYPES,
  type BuildingId,
  type CivId,
  type GovernmentId,
  type ImprovementId,
  type ProductionItem,
  type TechId,
  type TerrainId,
  type UnitTypeId,
} from "../../core";
import { isSourceLanguage, language, t } from "./index";

export function unitName(id: UnitTypeId): string {
  return language().names?.units[id] ?? UNIT_TYPES[id].name;
}

export function buildingName(id: BuildingId): string {
  return language().names?.buildings[id] ?? BUILDINGS[id].name;
}

export function techName(id: TechId): string {
  return language().names?.techs[id] ?? TECHS[id].name;
}

export function terrainName(id: TerrainId): string {
  return language().names?.terrain[id] ?? TERRAINS[id].name;
}

export function specialName(terrain: TerrainId): string {
  return language().names?.specials[terrain] ?? TERRAINS[terrain].special?.name ?? "";
}

export function governmentName(id: GovernmentId): string {
  return language().names?.governments[id] ?? GOVERNMENTS[id].name;
}

export function improvementName(id: ImprovementId): string {
  return language().names?.improvements[id] ?? IMPROVEMENTS[id].name;
}

/** The people, in plural: "Češi", "Czechs". */
export function civName(id: CivId): string {
  return language().names?.civs[id]?.name ?? CIVS[id].name;
}

export function leaderName(id: CivId): string {
  return language().names?.civs[id]?.leader ?? CIVS[id].leader;
}

/** "Česká říše", "Czech Empire". */
export function realmLabel(id: CivId): string {
  const own = language().names?.civs[id];
  if (own) return t("{adjective} říše", { adjective: own.adjective });
  const adj = CIVS[id].adjective;
  return `${adj.charAt(0).toUpperCase()}${adj.slice(1)} říše`;
}

/** The realm as the object of a sentence: Czech "vedeš českou říši", English "you lead the Czech Empire". */
export function realmObject(id: CivId): string {
  if (language().names) return realmLabel(id);
  return `${CIVS[id].adjective.slice(0, -1)}ou říši`;
}

let cityMap: Map<string, string> | null = null;

/**
 * A city keeps the name it got when it was founded, which is Czech. In other
 * languages the name is looked up in the nation lists; made-up names stay.
 */
export function cityLabel(name: string): string {
  const names = language().names;
  if (!names) return name;
  if (!cityMap) {
    cityMap = new Map();
    for (const civ of CIV_IDS) {
      const own = names.civs[civ]?.cities ?? [];
      CIVS[civ].cities.forEach((cs, i) => {
        const local = own[i];
        if (local && !cityMap!.has(cs)) cityMap!.set(cs, local);
      });
    }
  }
  const exact = cityMap.get(name);
  if (exact) return exact;
  // Repeated names get a number: "Brod 2".
  const m = /^(.*) (\d+)$/.exec(name);
  if (m && cityMap.has(m[1]!)) return `${cityMap.get(m[1]!)} ${m[2]}`;
  return name;
}

/** What a city builds, as the production list shows it. */
export function productionLabel(item: ProductionItem): string {
  switch (item.kind) {
    case "unit":
      return unitName(item.id);
    case "building":
      return buildingName(item.id);
    case "wealth":
      return t("Vydělávat zlato");
  }
}

/** A name in the middle of a sentence: Czech writes "postav sýpku" in lower case, English keeps the capitals. */
export function inSentence(name: string): string {
  return isSourceLanguage() ? name.toLowerCase() : name;
}
