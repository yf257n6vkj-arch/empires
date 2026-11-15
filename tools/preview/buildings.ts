import { BUILDING_IDS } from "../../src/core";
import { buildingPortraitCanvas, drawHouse } from "../../src/web/buildingArt";
document.body.style.background = "#2a2622";
for (const id of BUILDING_IDS) {
  const d = document.createElement("div");
  d.style.cssText = "display:inline-block;margin:6px;color:#eee;font:12px sans-serif;text-align:center";
  d.append(buildingPortraitCanvas(id, 220, 170), document.createElement("br"), id);
  document.body.append(d);
}
const c = document.createElement("canvas");
c.width = 600; c.height = 120;
const ctx = c.getContext("2d")!;
ctx.fillStyle = "#cfe0c0"; ctx.fillRect(0, 0, 600, 120);
for (let k = 0; k < 12; k++) { ctx.save(); ctx.translate(30 + k * 46, 100); ctx.scale(2.6, 2.6); drawHouse(ctx, k * 7 + 3); ctx.restore(); }
document.body.append(c);
