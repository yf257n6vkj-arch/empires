import { spaceshipCanvas, type SpaceshipPicture } from "../../src/web/spaceshipArt";
document.body.style.cssText = "background:#222;margin:0;padding:8px";
const pics: SpaceshipPicture[] = [
  { structural: 0, component: 0, module: 0, scene: "pad" },
  { structural: 5, component: 2, module: 1, scene: "pad" },
  { structural: 12, component: 6, module: 3, scene: "pad" },
  { structural: 8, component: 3, module: 2, scene: "flight", progress: 0.4 },
  { structural: 12, component: 6, module: 3, scene: "landed" },
];
for (const p of pics) {
  const c = spaceshipCanvas({ ...p, color: "#c23b30" }, 400, 300);
  c.style.margin = "4px";
  document.body.append(c);
}
