import { UNIT_TYPE_IDS } from "../../src/core";
import { unitPortraitCanvas } from "../../src/web/render";
document.body.style.background = "#6f9a4a";
for (const owner of [1]) {
  const row = document.createElement("div");
  for (const id of UNIT_TYPE_IDS) {
    const d = document.createElement("div");
    d.style.cssText = "display:inline-block;margin:2px;font:11px sans-serif;text-align:center";
    d.append(unitPortraitCanvas(id, owner, 180, 150), document.createElement("br"), id);
    row.append(d);
  }
  document.body.append(row);
}
