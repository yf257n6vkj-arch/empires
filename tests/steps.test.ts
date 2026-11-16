import { describe, expect, it } from "vitest";
import { apply, newGame, type GameState } from "../src/core";
import { nextStep, type StepContext } from "../src/web/steps";
import { addUnit, stateFromAscii } from "./helpers";

function ctx(state: GameState, more: Partial<StepContext> = {}): StepContext {
  return { state, me: 0, selectedUnitId: null, selectedCityId: null, openCityId: null, governmentOpen: false, taught: [], task: null, wantedTech: null, ...more };
}

describe("the owl step by step", () => {
  it("starts with the settler: click it, then press B", () => {
    const s = newGame({ seed: "steps-1", playerCount: 2 });
    const settler = s.units.find((u) => u.owner === 0 && u.type === "settlers")!;
    const first = nextStep(ctx(s))!;
    expect(first.target).toMatchObject({ kind: "unit", unitId: settler.id });
    const second = nextStep(ctx(s, { selectedUnitId: settler.id }))!;
    // Either found right here or walk to the blinking tile first.
    expect(["button", "tile"]).toContain(second.target.kind);
    if (second.target.kind === "button") expect(second.target.selector).toContain("found");
  });

  it("asks for research and points at the advance the plan wants", () => {
    let s = stateFromAscii([".......", ".......", "......."]);
    const settler = addUnit(s, "settlers", 3, 1);
    s = apply(s, { type: "foundCity", unitId: settler.id });
    s.players[0]!.researching = null;
    const step = nextStep(ctx(s, { wantedTech: "bronze" }))!;
    expect(step.id).toBe("research");
    expect(step.target).toMatchObject({ kind: "button" });
    if (step.target.kind === "button") expect(step.target.selector.split("||")[0]).toContain('data-tech="bronze"');
  });

  it("leads to a building the plan wants: click the city, open it, choose the building", () => {
    let s = stateFromAscii([".......", ".......", "......."]);
    const settler = addUnit(s, "settlers", 3, 1);
    s = apply(s, { type: "foundCity", unitId: settler.id });
    s.players[0]!.researching = "alphabet";
    s.players[0]!.techs.push("bronze");
    const city = s.cities[0]!;
    const task = { kind: "building", building: "barracks", n: 1 } as const;
    const a = nextStep(ctx(s, { task }))!;
    expect(a.target).toMatchObject({ kind: "city", cityId: city.id });
    const b = nextStep(ctx(s, { task, selectedCityId: city.id }))!;
    expect(b.target).toMatchObject({ kind: "button", selector: "[data-open-city]" });
    const c = nextStep(ctx(s, { task, openCityId: city.id }))!;
    expect(c.target).toMatchObject({ kind: "button", selector: '[data-item="building:barracks"]' });
    // Once the city builds it, the owl lets the city screen close.
    s.cities[0]!.production = { kind: "building", id: "barracks" };
    const d = nextStep(ctx(s, { task, openCityId: city.id }))!;
    expect(d.target).toMatchObject({ kind: "button", selector: ".cs-close" });
  });

  it("teaches each improvement by hand before automatic work", () => {
    let s = stateFromAscii(["~~~~~~~", "~,,,,,~", "~,,,,,~", "~,,,,,~", "~~~~~~~"]);
    const founder = addUnit(s, "settlers", 3, 2);
    s = apply(s, { type: "foundCity", unitId: founder.id });
    s.players[0]!.researching = "alphabet";
    const worker = addUnit(s, "settlers", 3, 2);
    const taught = nextStep(ctx(s, { selectedUnitId: worker.id, taught: ["road", "irrigation", "mine", "railroad"] }))!;
    expect(taught.target).toMatchObject({ kind: "button", selector: '[data-action="auto"]' });
    const first = nextStep(ctx(s, { selectedUnitId: worker.id }))!;
    expect(first.id).not.toContain("auto");
  });

  it("ends the turn when nothing is left", () => {
    let s = stateFromAscii([".......", ".......", "......."]);
    const settler = addUnit(s, "settlers", 3, 1);
    s = apply(s, { type: "foundCity", unitId: settler.id });
    s.players[0]!.researching = "alphabet";
    const step = nextStep(ctx(s))!;
    expect(step.target).toMatchObject({ kind: "button", selector: "#end-turn" });
  });
  it("sends only one scout out; another soldier in the field goes home", () => {
    let s = newGame({ seed: "steps-scout", playerCount: 2 });
    const settler = s.units.find((u) => u.owner === 0 && u.type === "settlers")!;
    s = apply(s, { type: "foundCity", unitId: settler.id });
    s.players[0]!.researching = "alphabet";
    const city = s.cities[0]!;
    const free = (dx: number) => ({ x: city.x + dx, y: city.y });
    const a = addUnit(s, "warriors", free(1).x, free(1).y);
    const b = addUnit(s, "warriors", free(-1).x, free(-1).y);
    s.units = s.units.filter((u) => u.owner !== 0 || u.id === a.id || u.id === b.id);
    const first = nextStep(ctx(s, { selectedUnitId: a.id }))!;
    expect(first.id).toBe(`explore-${a.id}`);
    const second = nextStep(ctx(s, { selectedUnitId: b.id }))!;
    expect(second.id).not.toBe(`explore-${b.id}`);
  });
});
