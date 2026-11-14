/**
 * Things that happened during a command or a turn change. Events carry data
 * only; the screen turns them into Czech text, the AI can read them directly.
 */
import type { Point } from "./geometry";
import type { BuildingId, ImprovementId, UnitTypeId } from "./rules";
import type { CityId, PlayerId, ProductionItem, UnitId } from "./state";

export type GameEvent =
  | { type: "cityFounded"; cityId: CityId; owner: PlayerId }
  | { type: "cityGrew"; cityId: CityId; size: number }
  | { type: "cityStarved"; cityId: CityId; size: number }
  | { type: "cityNeedsSize"; cityId: CityId; item: ProductionItem }
  | { type: "unitBuilt"; cityId: CityId; unitId: UnitId; unitType: UnitTypeId }
  | { type: "buildingBuilt"; cityId: CityId; building: BuildingId }
  | { type: "productionNeeded"; cityId: CityId }
  | { type: "improvementDone"; unitId: UnitId; at: Point; improvement: ImprovementId }
  | { type: "gotoBlocked"; unitId: UnitId }
  | { type: "turnStarted"; turn: number; player: PlayerId };
