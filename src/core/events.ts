/**
 * Things that happened during a command or a turn change. Events carry data
 * only; the screen turns them into Czech text, the AI can read them directly.
 */
import type { Point } from "./geometry";
import type { BuildingId, GovernmentId, ImprovementId, TechId, UnitTypeId } from "./rules";
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
  /** A settler finished its road or railroad along the whole way. */
  | { type: "routeBuilt"; unitId: UnitId; improvement: "road" | "railroad" }
  /** A city took the next item from its queue. */
  | { type: "queueAdvanced"; cityId: CityId; item: ProductionItem }
  | { type: "turnStarted"; turn: number; player: PlayerId }
  | { type: "wonderBuilt"; cityId: CityId; owner: PlayerId; building: BuildingId }
  | { type: "buildingSold"; cityId: CityId; building: BuildingId }
  | { type: "cityDisorder"; cityId: CityId }
  | { type: "cityAtMaxSize"; cityId: CityId; size: number }
  | { type: "techLearned"; player: PlayerId; tech: TechId }
  | { type: "researchNeeded"; player: PlayerId }
  | { type: "unitDisbanded"; cityId: CityId; unitType: UnitTypeId }
  | { type: "unitLost"; unitId: UnitId; unitType: UnitTypeId; owner: PlayerId; reason: "sea" | "fuel" }
  | { type: "spaceshipPartBuilt"; cityId: CityId; building: BuildingId }
  | { type: "spaceshipLaunched"; player: PlayerId; arrivalTurn: number }
  | { type: "spaceshipArrived"; player: PlayerId; success: boolean }
  | { type: "revolutionStarted"; player: PlayerId; target: GovernmentId; turns: number }
  | { type: "governmentChanged"; player: PlayerId; government: GovernmentId }
  | { type: "tradeRouteOpened"; from: CityId; to: CityId; bonus: number }
  | { type: "wonderHelped"; cityId: CityId; shields: number }
  | { type: "embassyOpened"; player: PlayerId; with: PlayerId }
  | { type: "techStolen"; player: PlayerId; from: PlayerId; tech: TechId }
  | { type: "citySabotaged"; cityId: CityId; building: BuildingId | null }
  | { type: "cityIncited"; cityId: CityId; from: PlayerId; to: PlayerId }
  | { type: "nuclearStrike"; at: Point; owner: PlayerId; intercepted: boolean }
  | { type: "unitDismissed"; unitType: UnitTypeId; owner: PlayerId; cityId: CityId | null; shields: number }
  | { type: "unitUpgraded"; unitId: UnitId; owner: PlayerId; from: UnitTypeId; to: UnitTypeId; cost: number };
