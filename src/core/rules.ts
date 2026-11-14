/**
 * Game rules loaded from the data files in ./data.
 * Numbers live in JSON so they can be tuned without touching the code.
 */
import terrainData from "./data/terrain.json";

export const TERRAIN_IDS = [
  "ocean",
  "grassland",
  "plains",
  "forest",
  "hills",
  "mountains",
  "desert",
] as const;

export type TerrainId = (typeof TERRAIN_IDS)[number];

export interface TerrainRule {
  id: TerrainId;
  name: string;
  food: number;
  shields: number;
  trade: number;
  moveCost: number;
  /** Percent bonus for the defender, e.g. 50 means x1.5. */
  defenseBonus: number;
  land: boolean;
}

function loadTerrains(): Record<TerrainId, TerrainRule> {
  const result = {} as Record<TerrainId, TerrainRule>;
  for (const raw of terrainData.terrains) {
    if (!(TERRAIN_IDS as readonly string[]).includes(raw.id)) {
      throw new Error(`terrain.json: unknown terrain id "${raw.id}"`);
    }
    result[raw.id as TerrainId] = raw as TerrainRule;
  }
  for (const id of TERRAIN_IDS) {
    if (!result[id]) throw new Error(`terrain.json: missing terrain "${id}"`);
  }
  return result;
}

export const TERRAINS: Readonly<Record<TerrainId, TerrainRule>> = loadTerrains();

export function isLand(terrain: TerrainId): boolean {
  return TERRAINS[terrain].land;
}
