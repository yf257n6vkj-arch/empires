/**
 * Things that happened during a command or a turn change. Events carry data
 * only; the screen turns them into Czech text, the AI can read them directly.
 */
import type { Point } from "./geometry";
import type { BuildingId, DisasterId, GovernmentId, ImprovementId, RuinOutcome, TechId, UnitTypeId } from "./rules";
import type { CityId, PlayerId, ProductionItem, UnitId } from "./state";

export type GameEvent =
  | { type: "cityFounded"; cityId: CityId; owner: PlayerId }
  | { type: "cityGrew"; cityId: CityId; size: number }
  | { type: "cityStarved"; cityId: CityId; size: number }
  | { type: "cityNeedsSize"; cityId: CityId; item: ProductionItem }
  | { type: "unitBuilt"; cityId: CityId; unitId: UnitId; unitType: UnitTypeId }
  | { type: "buildingBuilt"; cityId: CityId; building: BuildingId }
  | { type: "productionNeeded"; cityId: CityId }
  /** A land unit entered ruins; what it found depends on the outcome. */
  | {
      type: "ruinsExplored";
      owner: PlayerId;
      unitId: UnitId;
      at: Point;
      outcome: RuinOutcome;
      gold?: number;
      tech?: TechId;
      unitType?: UnitTypeId;
    }
  /** Barbarians rose up in the wilds, landed on a coast or came out of ruins. */
  | { type: "barbariansAppeared"; at: Point; count: number; reason: "uprising" | "landing" | "ruins" }
  /** Somebody won by conquest or score; a spaceship win is told by spaceshipArrived. */
  | { type: "gameWon"; player: PlayerId; kind: "conquest" | "score" }
  /** The city governor picked what the city builds next. */
  | { type: "governorChose"; cityId: CityId; item: ProductionItem }
  | { type: "improvementDone"; unitId: UnitId; at: Point; improvement: ImprovementId }
  | { type: "gotoBlocked"; unitId: UnitId }
  /** A settler finished its road or railroad along the whole way. */
  | { type: "routeBuilt"; unitId: UnitId; improvement: "road" | "railroad" }
  /** A city took the next item from its queue. */
  | { type: "queueAdvanced"; cityId: CityId; item: ProductionItem }
  | { type: "turnStarted"; turn: number; player: PlayerId }
  | { type: "wonderBuilt"; cityId: CityId; owner: PlayerId; building: BuildingId }
  | { type: "buildingSold"; cityId: CityId; building: BuildingId; manual?: boolean }
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
  | { type: "unitUpgraded"; unitId: UnitId; owner: PlayerId; from: UnitTypeId; to: UnitTypeId; cost: number }
  | { type: "cityJoined"; cityId: CityId; size: number }
  | { type: "celebrationStarted"; cityId: CityId }
  | { type: "celebrationEnded"; cityId: CityId }
  | { type: "tilePolluted"; cityId: CityId; at: Point }
  | { type: "pollutionCleaned"; unitId: UnitId; at: Point }
  | { type: "nuclearMeltdown"; cityId: CityId; size: number }
  /** Land changed all over the world; every player hears about it. */
  | { type: "globalWarming"; tiles: number }
  | { type: "disaster"; cityId: CityId; disaster: DisasterId; building: BuildingId | null; size: number }
  /** A building or a technology kept a disaster away. */
  | { type: "disasterPrevented"; cityId: CityId; disaster: DisasterId; building: BuildingId | null; tech: TechId | null }
  /** A fight between two units; the loser is gone, and outside a city or fortress so is the rest of a beaten stack. */
  | {
      type: "combat";
      attacker: { id: UnitId; owner: PlayerId; unitType: UnitTypeId };
      defender: { id: UnitId; owner: PlayerId; unitType: UnitTypeId };
      at: Point;
      attackerWon: boolean;
      winnerHp: number;
      alsoLost: number;
      promoted: boolean;
      winChance: number;
    }
  | { type: "cityCaptured"; cityId: CityId; from: PlayerId; to: PlayerId; gold: number; tech: TechId | null; lostBuildings: BuildingId[] }
  | { type: "cityDestroyed"; cityId: CityId; name: string; owner: PlayerId; by: PlayerId; gold: number; tech: TechId | null }
  /** The capital fell and the government moved to another city. */
  | { type: "palaceMoved"; player: PlayerId; cityId: CityId }
  /** Two empires saw each other for the first time. */
  | { type: "contactMade"; a: PlayerId; b: PlayerId }
  | { type: "warDeclared"; by: PlayerId; on: PlayerId; brokeTreaty?: boolean }
  | { type: "peaceOffered"; from: PlayerId; to: PlayerId }
  | { type: "peaceMade"; a: PlayerId; b: PlayerId }
  | { type: "peaceRejected"; by: PlayerId; from: PlayerId }
  /** The player lost the last city and is out of the game. */
  | { type: "civDestroyed"; player: PlayerId; by: PlayerId | null }
  /** Disorder brought the government down into anarchy. */
  | { type: "governmentCollapsed"; player: PlayerId; government: GovernmentId };
