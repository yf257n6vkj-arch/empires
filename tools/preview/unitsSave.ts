// A save with every unit type standing outside the first city, for screenshots.
import { readFileSync, writeFileSync } from "node:fs";
import { UNIT_TYPE_IDS } from "../../src/core";
const data = JSON.parse(readFileSync("/tmp/prev/save.json", "utf8"));
const s = data.state;
const c = s.cities[0];
const spots = [[-1, 1], [0, 1], [1, 1], [2, 1], [-2, 1], [-1, 2], [0, 2], [1, 2], [2, 0], [-2, 0], [1, -1], [-1, -1]];
UNIT_TYPE_IDS.forEach((t, k) => {
  const [dx, dy] = spots[k]!;
  s.units.push({ id: s.nextId++, owner: k % 2 ? 1 : 0, type: t, x: c.x + dx!, y: c.y + dy!, movesLeft: 3, homeCity: null, fortified: false, work: null, goto: null });
});
writeFileSync("/tmp/prev/save_units.json", JSON.stringify(data));
