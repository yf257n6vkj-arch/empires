/**
 * Unit figures painted like small miniatures. A figure stands with its feet
 * at (0, 0) and is about 22 design units tall; the light comes from the upper
 * left. People are built from jointed limbs so that each unit only describes
 * its pose, clothes and gear.
 */
import type { UnitTypeId } from "../core";
import { tone } from "./buildingArt";

type Ctx = CanvasRenderingContext2D;
type P = [number, number];

const LINE = "rgba(28, 20, 14, 0.8)";
const SKIN = "#d9a47c";
const HAIR = "#3b2a1d";
const WOOD = "#7d5532";
const IRON = "#9aa2aa";
const BRONZE = "#c48f45";
const LEATHER = "#7a5232";
const KHAKI = "#7d7b56";

// ---------- drawing helpers ----------

/** A tapered limb from a to b with rounded ends, shaded across its width. */
function limb(ctx: Ctx, a: P, b: P, ra: number, rb: number, color: string, outline = true): void {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const g = ctx.createLinearGradient(a[0] + nx * ra, a[1] + ny * ra, a[0] - nx * ra, a[1] - ny * ra);
  // Light from the upper left: the side whose normal points left/up is lit.
  const lit = nx + ny < 0;
  g.addColorStop(0, tone(color, lit ? 1.18 : 0.7));
  g.addColorStop(0.45, color);
  g.addColorStop(1, tone(color, lit ? 0.7 : 1.18));
  ctx.beginPath();
  const angle = Math.atan2(dy, dx);
  ctx.arc(a[0], a[1], ra, angle + Math.PI / 2, angle - Math.PI / 2);
  ctx.arc(b[0], b[1], rb, angle - Math.PI / 2, angle + Math.PI / 2);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 0.32;
    ctx.stroke();
  }
}

function fillShaded(ctx: Ctx, x0: number, x1: number, color: string, light = 1.16, dark = 0.68): void {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, tone(color, light));
  g.addColorStop(0.5, color);
  g.addColorStop(1, tone(color, dark));
  ctx.fillStyle = g;
  ctx.fill();
}

function stroke(ctx: Ctx, w = 0.35, c = LINE): void {
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  ctx.stroke();
}

function line(ctx: Ctx, pts: number[], color: string, w: number): void {
  ctx.beginPath();
  ctx.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

/** A long shaft (spear, lance, musket stock) shaded along its length. */
function shaft(ctx: Ctx, a: P, b: P, w: number, color: string): void {
  line(ctx, [a[0], a[1], b[0], b[1]], tone(color, 0.6), w + 0.35);
  line(ctx, [a[0], a[1], b[0], b[1]], color, w);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  line(ctx, [a[0] - (dy / len) * w * 0.2, a[1] + (dx / len) * w * 0.2, b[0] - (dy / len) * w * 0.2, b[1] + (dx / len) * w * 0.2], tone(color, 1.35), w * 0.3);
}

// ---------- people ----------

interface Pose {
  farLeg: [P, P, P];
  nearLeg: [P, P, P];
  farArm: [P, P, P];
  nearArm: [P, P, P];
  /** Head centre. */
  head: P;
}

const STAND: Pose = {
  farLeg: [[1.3, -10], [1.7, -5.2], [2, -0.6]],
  nearLeg: [[-1.3, -10], [-1.5, -5.2], [-1.8, -0.6]],
  farArm: [[3, -17], [4, -13.5], [4.3, -10.6]],
  nearArm: [[-3, -17], [-3.9, -13.6], [-3.5, -10.6]],
  head: [0, -19.9],
};

interface Outfit {
  skin?: string;
  /** Colour of the legs: trousers, hose or skin. */
  legs: string;
  boots: string;
  /** Upper body garment. */
  body: string;
  /** Sleeves; skin when bare. */
  sleeves: string;
  /** Length of the garment below the waist, 0 = none. */
  skirt: number;
  skirtColor?: string;
  belt?: string;
  /** Extra drawing on the torso (armour bands, straps). */
  chest?: (ctx: Ctx) => void;
  hair?: string;
  beard?: boolean;
  /** Headgear drawn over the head. */
  hat?: (ctx: Ctx, h: P) => void;
}

function drawHead(ctx: Ctx, h: P, o: Outfit): void {
  const skin = o.skin ?? SKIN;
  // Neck.
  limb(ctx, [h[0] + 0.1, h[1] + 1.6], [h[0] + 0.1, h[1] + 2.6], 0.85, 0.95, tone(skin, 0.9), false);
  const g = ctx.createRadialGradient(h[0] - 0.8, h[1] - 0.8, 0.3, h[0], h[1], 2.6);
  g.addColorStop(0, tone(skin, 1.15));
  g.addColorStop(0.7, skin);
  g.addColorStop(1, tone(skin, 0.72));
  ctx.beginPath();
  ctx.moveTo(h[0] - 1.95, h[1] - 0.3);
  ctx.quadraticCurveTo(h[0] - 2, h[1] - 2.4, h[0], h[1] - 2.4);
  ctx.quadraticCurveTo(h[0] + 2, h[1] - 2.4, h[0] + 1.95, h[1] - 0.3);
  ctx.quadraticCurveTo(h[0] + 1.8, h[1] + 1.9, h[0] - 0.1, h[1] + 2.2);
  ctx.quadraticCurveTo(h[0] - 1.8, h[1] + 1.9, h[0] - 1.95, h[1] - 0.3);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  stroke(ctx, 0.3);
  // Face: brows, eyes, nose shadow, mouth.
  ctx.fillStyle = "#2a1a10";
  ctx.fillRect(h[0] - 1.25, h[1] - 0.15, 0.55, 0.45);
  ctx.fillRect(h[0] + 0.45, h[1] - 0.15, 0.55, 0.45);
  ctx.fillStyle = tone(skin, 0.7);
  ctx.beginPath();
  ctx.moveTo(h[0] - 0.05, h[1] + 0.1);
  ctx.lineTo(h[0] + 0.45, h[1] + 1.05);
  ctx.lineTo(h[0] - 0.15, h[1] + 1.05);
  ctx.fill();
  line(ctx, [h[0] - 0.55, h[1] + 1.55, h[0] + 0.45, h[1] + 1.5], tone(skin, 0.55), 0.28);
  if (o.beard) {
    ctx.fillStyle = o.hair ?? HAIR;
    ctx.beginPath();
    ctx.moveTo(h[0] - 1.9, h[1] + 0.2);
    ctx.quadraticCurveTo(h[0] - 1.4, h[1] + 2.9, h[0], h[1] + 2.9);
    ctx.quadraticCurveTo(h[0] + 1.4, h[1] + 2.9, h[0] + 1.9, h[1] + 0.2);
    ctx.quadraticCurveTo(h[0] + 1, h[1] + 1.2, h[0] + 0.45, h[1] + 1.3);
    ctx.lineTo(h[0] - 0.55, h[1] + 1.3);
    ctx.quadraticCurveTo(h[0] - 1, h[1] + 1.2, h[0] - 1.9, h[1] + 0.2);
    ctx.fill();
  }
  if (o.hair) {
    ctx.fillStyle = o.hair;
    ctx.beginPath();
    ctx.moveTo(h[0] - 2.1, h[1] + 0.2);
    ctx.quadraticCurveTo(h[0] - 2.4, h[1] - 2.9, h[0] + 0.2, h[1] - 2.7);
    ctx.quadraticCurveTo(h[0] + 2.4, h[1] - 2.6, h[0] + 2.1, h[1] + 0.2);
    ctx.quadraticCurveTo(h[0] + 1.2, h[1] - 1.4, h[0] - 0.3, h[1] - 1.3);
    ctx.quadraticCurveTo(h[0] - 1.6, h[1] - 1.2, h[0] - 2.1, h[1] + 0.2);
    ctx.fill();
  }
  o.hat?.(ctx, h);
}

function drawTorso(ctx: Ctx, o: Outfit): void {
  // Garment below the waist (tunic skirt, coat tails).
  if (o.skirt > 0) {
    ctx.beginPath();
    ctx.moveTo(-3, -10.6);
    ctx.lineTo(3, -10.6);
    ctx.quadraticCurveTo(3.6, -10.6 + o.skirt * 0.6, 3.5, -10.6 + o.skirt);
    ctx.quadraticCurveTo(0, -10.6 + o.skirt + 0.7, -3.5, -10.6 + o.skirt);
    ctx.quadraticCurveTo(-3.6, -10.6 + o.skirt * 0.6, -3, -10.6);
    ctx.closePath();
    fillShaded(ctx, -3.5, 3.5, o.skirtColor ?? o.body);
    stroke(ctx);
    // Folds.
    ctx.strokeStyle = tone(o.skirtColor ?? o.body, 0.7, 0.7);
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    for (const x of [-1.6, 0.2, 1.8]) {
      ctx.moveTo(x, -10);
      ctx.lineTo(x * 1.12, -10.8 + o.skirt);
    }
    ctx.stroke();
  }
  // Chest, slightly wider at the shoulders.
  ctx.beginPath();
  ctx.moveTo(-3.3, -17.4);
  ctx.quadraticCurveTo(0, -18.3, 3.3, -17.4);
  ctx.quadraticCurveTo(3.4, -13.6, 2.7, -10.3);
  ctx.lineTo(-2.7, -10.3);
  ctx.quadraticCurveTo(-3.4, -13.6, -3.3, -17.4);
  ctx.closePath();
  fillShaded(ctx, -3.3, 3.3, o.body);
  stroke(ctx);
  o.chest?.(ctx);
  if (o.belt) {
    ctx.fillStyle = o.belt;
    ctx.fillRect(-2.85, -11.4, 5.7, 0.95);
    ctx.fillStyle = "#c9a65a";
    ctx.fillRect(-0.45, -11.45, 0.9, 1.05);
  }
}

function drawPerson(ctx: Ctx, pose: Pose, o: Outfit, behind?: (ctx: Ctx) => void, front?: (ctx: Ctx) => void): void {
  const skin = o.skin ?? SKIN;
  const legW = (k: number) => [0.95 - k * 0.12, 0.7 - k * 0.05] as const;
  // Far arm and leg first.
  limb(ctx, pose.farArm[0], pose.farArm[1], 0.85, 0.7, tone(o.sleeves, 0.86));
  limb(ctx, pose.farArm[1], pose.farArm[2], 0.7, 0.55, tone(o.sleeves === o.body ? skin : o.sleeves, 0.86));
  ctx.fillStyle = tone(skin, 0.85);
  ctx.beginPath();
  ctx.arc(pose.farArm[2][0], pose.farArm[2][1], 0.62, 0, Math.PI * 2);
  ctx.fill();
  behind?.(ctx);
  for (const [leg, k] of [
    [pose.farLeg, 1],
    [pose.nearLeg, 0],
  ] as const) {
    const [w1, w2] = legW(k);
    limb(ctx, leg[0], leg[1], w1 + 0.2, w2 + 0.1, k ? tone(o.legs, 0.85) : o.legs);
    limb(ctx, leg[1], leg[2], w2 + 0.1, 0.55, k ? tone(o.legs, 0.85) : o.legs);
    // Foot.
    ctx.beginPath();
    ctx.ellipse(leg[2][0] - 0.45, leg[2][1] + 0.1, 1.15, 0.55, 0, 0, Math.PI * 2);
    fillShaded(ctx, leg[2][0] - 1.6, leg[2][0] + 0.7, o.boots);
    stroke(ctx, 0.25);
  }
  drawTorso(ctx, o);
  drawHead(ctx, pose.head, o);
  // Near arm over the body.
  limb(ctx, pose.nearArm[0], pose.nearArm[1], 0.9, 0.72, o.sleeves);
  limb(ctx, pose.nearArm[1], pose.nearArm[2], 0.72, 0.56, o.sleeves === o.body ? skin : o.sleeves);
  const hand = pose.nearArm[2];
  const hg = ctx.createRadialGradient(hand[0] - 0.2, hand[1] - 0.2, 0.1, hand[0], hand[1], 0.8);
  hg.addColorStop(0, tone(skin, 1.12));
  hg.addColorStop(1, tone(skin, 0.75));
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(hand[0], hand[1], 0.68, 0, Math.PI * 2);
  ctx.fill();
  front?.(ctx);
}

/** A hand drawn over a held item, so fingers wrap around it. */
function grip(ctx: Ctx, at: P, skin = SKIN): void {
  const g = ctx.createRadialGradient(at[0] - 0.2, at[1] - 0.2, 0.1, at[0], at[1], 0.8);
  g.addColorStop(0, tone(skin, 1.12));
  g.addColorStop(1, tone(skin, 0.72));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(at[0], at[1], 0.7, 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  stroke(ctx, 0.2);
}

function roundShield(ctx: Ctx, c: P, r: number, face: string, rim: string, boss: string, device?: (ctx: Ctx) => void): void {
  ctx.beginPath();
  ctx.ellipse(c[0] + 0.35, c[1] + 0.2, r, r * 1.02, 0, 0, Math.PI * 2);
  ctx.fillStyle = tone(rim, 0.55);
  ctx.fill();
  const g = ctx.createRadialGradient(c[0] - r * 0.4, c[1] - r * 0.45, r * 0.1, c[0], c[1], r * 1.1);
  g.addColorStop(0, tone(face, 1.3));
  g.addColorStop(0.6, face);
  g.addColorStop(1, tone(face, 0.62));
  ctx.beginPath();
  ctx.ellipse(c[0], c[1], r, r * 1.02, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = r * 0.16;
  ctx.strokeStyle = rim;
  ctx.stroke();
  stroke(ctx, 0.3);
  device?.(ctx);
  const bg = ctx.createRadialGradient(c[0] - 0.3, c[1] - 0.3, 0.1, c[0], c[1], r * 0.3);
  bg.addColorStop(0, "#fff3d0");
  bg.addColorStop(0.4, boss);
  bg.addColorStop(1, tone(boss, 0.55));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(c[0], c[1], r * 0.26, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- units on foot ----------

function warrior(ctx: Ctx, color: string): void {
  const pose: Pose = {
    ...STAND,
    farArm: [[3, -17], [4.6, -15.6], [5.6, -17.6]],
    nearArm: [[-3, -17], [-4.4, -14.2], [-4.2, -12.2]],
  };
  drawPerson(
    ctx,
    pose,
    {
      legs: SKIN,
      boots: "#5a3b22",
      body: "#8a6a48",
      sleeves: SKIN,
      skirt: 3.4,
      skirtColor: "#9a7a52",
      belt: tone(color, 0.8),
      hair: "#4a3220",
      beard: true,
      chest: (c) => {
        // Fur collar and a strap in the tribe's colour.
        c.fillStyle = "#c9b48e";
        c.beginPath();
        c.ellipse(0, -17.3, 3.3, 1, 0, 0, Math.PI * 2);
        c.fill();
        line(c, [-2.6, -17, 2.2, -11.4], color, 0.9);
      },
    },
    (c) => {
      // Club raised in the far hand.
      shaft(c, [5.4, -16.6], [7.6, -24.2], 0.85, WOOD);
      c.beginPath();
      c.ellipse(7.8, -24.8, 1.3, 2, 0.28, 0, Math.PI * 2);
      fillShaded(c, 6.5, 9.1, "#8a5e36");
      stroke(c);
      for (const [x, y] of [[7.1, -25.6], [8.7, -24.6], [7.6, -23.6]] as const) {
        c.fillStyle = "#d9d2c0";
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 0.8, y - 0.3);
        c.lineTo(x, y + 0.4);
        c.fill();
      }
      grip(c, [5.6, -17.6]);
    },
    (c) => roundShield(c, [-4.4, -12.4], 3.3, "#8a5a32", tone(color, 0.95), "#b8b0a0", (cc) => {
      cc.strokeStyle = "rgba(60, 35, 15, 0.45)";
      cc.lineWidth = 0.3;
      for (const k of [-1.6, 0, 1.6]) {
        cc.beginPath();
        cc.moveTo(-4.4 + k, -15.4);
        cc.lineTo(-4.4 + k, -9.4);
        cc.stroke();
      }
    }),
  );
}

function hopliteHelmet(color: string) {
  return (ctx: Ctx, h: P) => {
    ctx.beginPath();
    ctx.moveTo(h[0] - 2.2, h[1] + 1.8);
    ctx.lineTo(h[0] - 2.3, h[1] - 1);
    ctx.quadraticCurveTo(h[0] - 2.2, h[1] - 3, h[0], h[1] - 3);
    ctx.quadraticCurveTo(h[0] + 2.2, h[1] - 3, h[0] + 2.3, h[1] - 1);
    ctx.lineTo(h[0] + 2.2, h[1] + 1.8);
    ctx.lineTo(h[0] + 1.1, h[1] + 1.9);
    ctx.lineTo(h[0] + 1, h[1] + 0.4);
    ctx.lineTo(h[0] + 0.25, h[1] - 0.2);
    ctx.lineTo(h[0] + 0.2, h[1] + 1.6);
    ctx.lineTo(h[0] - 0.2, h[1] + 1.6);
    ctx.lineTo(h[0] - 0.25, h[1] - 0.2);
    ctx.lineTo(h[0] - 1, h[1] + 0.4);
    ctx.lineTo(h[0] - 1.1, h[1] + 1.9);
    ctx.closePath();
    fillShaded(ctx, h[0] - 2.3, h[0] + 2.3, BRONZE, 1.4, 0.6);
    stroke(ctx, 0.3);
    // Crest of horsehair in the player's colour.
    ctx.beginPath();
    ctx.moveTo(h[0] - 2.6, h[1] - 2.2);
    ctx.quadraticCurveTo(h[0] - 1, h[1] - 6, h[0] + 3.4, h[1] - 3.6);
    ctx.quadraticCurveTo(h[0] + 3.8, h[1] - 1.6, h[0] + 3.2, h[1] - 0.6);
    ctx.quadraticCurveTo(h[0] + 2.4, h[1] - 3.2, h[0] - 2.6, h[1] - 2.2);
    fillShaded(ctx, h[0] - 2.6, h[0] + 3.8, color);
    stroke(ctx, 0.25);
  };
}

function spearman(ctx: Ctx, color: string): void {
  const pose: Pose = {
    ...STAND,
    farArm: [[3, -17], [4.4, -14.4], [4.8, -12.6]],
    nearArm: [[-3, -17], [-3.6, -14.4], [-2.8, -12.8]],
  };
  drawPerson(
    ctx,
    pose,
    {
      legs: SKIN,
      boots: "#6a4a2a",
      body: BRONZE,
      sleeves: tone(color, 0.95),
      skirt: 3,
      skirtColor: tone(color, 0.95),
      hat: hopliteHelmet(color),
      chest: (c) => {
        // Muscle cuirass highlights.
        c.strokeStyle = tone(BRONZE, 0.6);
        c.lineWidth = 0.3;
        c.beginPath();
        c.moveTo(-1.6, -15.8);
        c.quadraticCurveTo(-0.6, -14.6, 0, -15.6);
        c.quadraticCurveTo(0.6, -14.6, 1.6, -15.8);
        c.moveTo(0, -14.6);
        c.lineTo(0, -11);
        c.stroke();
        // Fringe of leather strips.
        c.fillStyle = "#e7dcc4";
        for (let x = -2.6; x <= 2.6; x += 0.9) c.fillRect(x - 0.3, -10.6, 0.6, 1.8);
      },
    },
    (c) => {
      // Spear in the far hand, point up.
      shaft(c, [4.9, -1.5], [4.6, -27], 0.6, "#8a6038");
      c.beginPath();
      c.moveTo(4.6, -30.2);
      c.quadraticCurveTo(5.5, -28.4, 5.1, -27);
      c.lineTo(4.1, -27);
      c.quadraticCurveTo(3.7, -28.4, 4.6, -30.2);
      fillShaded(c, 3.7, 5.5, IRON, 1.5, 0.6);
      stroke(c, 0.2);
      grip(c, [4.8, -12.6]);
    },
    (c) => {
      // Greaves.
      for (const leg of [pose.nearLeg]) limb(c, leg[1], [leg[2][0], leg[2][1] - 1], 0.85, 0.65, BRONZE);
      // Large round shield with a simple device.
      roundShield(c, [-3.4, -12.6], 4.4, color, BRONZE, BRONZE, (cc) => {
        cc.fillStyle = tone(color, 0.55, 0.85);
        cc.beginPath();
        cc.moveTo(-3.4, -15.6);
        cc.lineTo(-1.6, -12);
        cc.lineTo(-5.2, -12);
        cc.closePath();
        cc.fill();
      });
    },
  );
}

function archer(ctx: Ctx, color: string): void {
  // Turned sideways, drawing the bow to the left.
  const pose: Pose = {
    farLeg: [[0.9, -10], [2.1, -5.4], [3, -0.6]],
    nearLeg: [[-1, -10], [-1.9, -5.2], [-2.6, -0.6]],
    farArm: [[1.6, -16.8], [-1.6, -15.6], [-6, -15.2]],
    nearArm: [[-1.2, -17], [1.6, -15.6], [2.4, -16.4]],
    head: [-0.3, -19.9],
  };
  drawPerson(
    ctx,
    pose,
    {
      legs: "#6a5a3c",
      boots: "#4a3220",
      body: "#7d6a42",
      sleeves: "#6f5e3a",
      skirt: 2.6,
      skirtColor: "#7d6a42",
      belt: LEATHER,
      chest: (c) => {
        line(c, [-2.8, -17, 2.4, -11], LEATHER, 0.8);
        c.fillStyle = color;
        c.fillRect(-2.7, -14.2, 5.4, 1);
      },
      hat: (c, h) => {
        // Hood.
        c.beginPath();
        c.moveTo(h[0] - 2.3, h[1] + 2.4);
        c.quadraticCurveTo(h[0] - 2.8, h[1] - 3.4, h[0] + 0.6, h[1] - 3.1);
        c.quadraticCurveTo(h[0] + 3.4, h[1] - 2.2, h[0] + 2.4, h[1] + 2.6);
        c.quadraticCurveTo(h[0] + 1.6, h[1] - 1.8, h[0] - 0.2, h[1] - 1.6);
        c.quadraticCurveTo(h[0] - 1.8, h[1] - 1.2, h[0] - 2.3, h[1] + 2.4);
        fillShaded(c, h[0] - 2.8, h[0] + 3.4, "#55603a");
        stroke(c, 0.25);
      },
    },
    (c) => {
      // Quiver on the back.
      c.save();
      c.translate(2.6, -15.4);
      c.rotate(0.35);
      c.beginPath();
      c.roundRect(-0.9, -1.2, 1.8, 6.6, 0.6);
      fillShaded(c, -0.9, 0.9, LEATHER);
      stroke(c, 0.25);
      for (const [x, k] of [[-0.4, 0], [0.1, 1], [0.5, 2]] as const) {
        line(c, [x, -1.2, x + 0.2, -3.4], "#d8c9a4", 0.25);
        c.fillStyle = k === 1 ? color : "#e8e2d0";
        c.fillRect(x - 0.15, -3.8, 0.5, 0.9);
      }
      c.restore();
    },
    (c) => {
      // Bow held out to the left, string drawn back to the cheek.
      c.beginPath();
      c.moveTo(-6.4, -22.4);
      c.quadraticCurveTo(-8.6, -15.2, -6.4, -8);
      c.strokeStyle = tone(WOOD, 0.6);
      c.lineWidth = 0.9;
      c.stroke();
      c.strokeStyle = "#a9773f";
      c.lineWidth = 0.55;
      c.stroke();
      line(c, [-6.4, -22.4, 2.2, -16.4, -6.4, -8], "#efe6cf", 0.18);
      line(c, [-9.2, -15.6, 2.4, -16.3], "#7a5530", 0.3);
      c.beginPath();
      c.moveTo(-10.2, -15.6);
      c.lineTo(-9, -16.1);
      c.lineTo(-9, -15.1);
      c.closePath();
      c.fillStyle = IRON;
      c.fill();
      c.fillStyle = color;
      c.fillRect(1.2, -16.8, 1.2, 0.9);
      grip(c, [-6, -15.2]);
      grip(c, [2.4, -16.4]);
    },
  );
}

function legionary(ctx: Ctx, color: string): void {
  const pose: Pose = {
    ...STAND,
    farArm: [[3, -17], [4.8, -15], [6, -16.8]],
    nearArm: [[-3, -17], [-4.2, -14.4], [-3.6, -12.6]],
  };
  drawPerson(
    ctx,
    pose,
    {
      legs: SKIN,
      boots: "#5a3b22",
      body: "#b9bec4",
      sleeves: tone(color, 0.95),
      skirt: 3,
      skirtColor: tone(color, 0.95),
      chest: (c) => {
        // Bands of segmented armour.
        c.strokeStyle = "rgba(60, 64, 70, 0.75)";
        c.lineWidth = 0.35;
        for (let y = -16; y <= -11; y += 1.25) {
          c.beginPath();
          c.moveTo(-3.1, y);
          c.quadraticCurveTo(0, y + 0.5, 3.1, y);
          c.stroke();
        }
        c.fillStyle = "#e3e6e9";
        c.fillRect(-1.6, -17.6, 3.2, 0.8);
        c.fillStyle = LEATHER;
        for (let x = -2.4; x <= 2.4; x += 1.2) c.fillRect(x - 0.25, -10.6, 0.5, 2.6);
      },
      hat: (c, h) => {
        c.beginPath();
        c.moveTo(h[0] - 2.3, h[1] + 0.6);
        c.quadraticCurveTo(h[0] - 2.4, h[1] - 3, h[0], h[1] - 3);
        c.quadraticCurveTo(h[0] + 2.4, h[1] - 3, h[0] + 2.3, h[1] + 0.6);
        c.lineTo(h[0] + 3.1, h[1] + 1.4);
        c.lineTo(h[0] + 2.2, h[1] + 1.6);
        c.lineTo(h[0] + 1.6, h[1] - 0.8);
        c.lineTo(h[0] - 1.6, h[1] - 0.8);
        c.lineTo(h[0] - 2.2, h[1] + 1.6);
        c.closePath();
        fillShaded(c, h[0] - 2.4, h[0] + 3.1, "#a9b0b8", 1.4, 0.6);
        stroke(c, 0.3);
        // Cheek guards.
        c.fillStyle = BRONZE;
        c.fillRect(h[0] - 2.2, h[1] - 0.6, 0.9, 2.4);
        c.fillRect(h[0] + 1.3, h[1] - 0.6, 0.9, 2.4);
        // Transverse crest.
        c.beginPath();
        c.ellipse(h[0], h[1] - 3.5, 2.6, 0.9, 0, 0, Math.PI * 2);
        fillShaded(c, h[0] - 2.6, h[0] + 2.6, color);
        stroke(c, 0.25);
      },
    },
    (c) => {
      // Short sword raised.
      c.beginPath();
      c.moveTo(6.2, -17.4);
      c.lineTo(7.6, -24.6);
      c.lineTo(8.1, -24.9);
      c.lineTo(7.2, -17.2);
      c.closePath();
      fillShaded(c, 6.2, 8.1, "#dfe4e8", 1.3, 0.6);
      stroke(c, 0.2);
      line(c, [5.2, -17.2, 7.6, -16.6], BRONZE, 0.6);
      grip(c, [6, -16.8]);
    },
    (c) => {
      // Curved rectangular shield.
      c.beginPath();
      c.moveTo(-7, -18.2);
      c.quadraticCurveTo(-4.6, -19, -2.2, -18.2);
      c.lineTo(-2.2, -7.4);
      c.quadraticCurveTo(-4.6, -6.6, -7, -7.4);
      c.closePath();
      fillShaded(c, -7, -2.2, color, 1.3, 0.62);
      stroke(c, 0.35);
      c.strokeStyle = "#e3c06a";
      c.lineWidth = 0.4;
      c.beginPath();
      c.moveTo(-4.6, -18.4);
      c.lineTo(-4.6, -7);
      c.moveTo(-6.8, -12.8);
      c.lineTo(-2.4, -12.8);
      c.stroke();
      // Wings of lightning.
      for (const s of [-1, 1]) line(c, [-4.6, -12.8, -4.6 + s * 1.6, -15.2, -4.6 + s * 0.6, -14.6, -4.6 + s * 1.8, -16.6], "#e3c06a", 0.3);
      const bg = c.createRadialGradient(-4.9, -13.1, 0.1, -4.6, -12.8, 1.1);
      bg.addColorStop(0, "#fff3d0");
      bg.addColorStop(1, BRONZE);
      c.fillStyle = bg;
      c.beginPath();
      c.arc(-4.6, -12.8, 1, 0, Math.PI * 2);
      c.fill();
    },
  );
}

function musketeer(ctx: Ctx, color: string): void {
  const pose: Pose = {
    ...STAND,
    farArm: [[3, -17], [4.2, -14], [3.6, -11.6]],
    nearArm: [[-3, -17], [-4.4, -14.6], [-4.6, -12.8]],
  };
  drawPerson(
    ctx,
    pose,
    {
      legs: "#e9e1cc",
      boots: "#2e2620",
      body: color,
      sleeves: color,
      skirt: 4.4,
      skirtColor: tone(color, 0.9),
      belt: "#3a2a1e",
      hair: "#5a3a22",
      beard: true,
      chest: (c) => {
        // White collar, buttons and the bandolier with powder flasks.
        c.fillStyle = "#f4efe2";
        c.beginPath();
        c.moveTo(-2.4, -17.6);
        c.quadraticCurveTo(0, -16, 2.4, -17.6);
        c.quadraticCurveTo(0, -18.6, -2.4, -17.6);
        c.fill();
        line(c, [-2.6, -17.2, 2.8, -10.2], "#3a2a1e", 0.75);
        for (const t of [0.3, 0.55, 0.8]) {
          c.fillStyle = "#c9a65a";
          c.beginPath();
          c.arc(-2.6 + 5.4 * t, -17.2 + 7 * t + 0.5, 0.42, 0, Math.PI * 2);
          c.fill();
        }
      },
      hat: (c, h) => {
        // Broad brimmed hat with a plume.
        c.beginPath();
        c.ellipse(h[0] + 0.2, h[1] - 1.6, 3.9, 1.05, -0.08, 0, Math.PI * 2);
        fillShaded(c, h[0] - 3.7, h[0] + 4.1, "#2b2622");
        stroke(c, 0.25);
        c.beginPath();
        c.moveTo(h[0] - 1.8, h[1] - 1.8);
        c.quadraticCurveTo(h[0] - 1.8, h[1] - 4.4, h[0] + 0.3, h[1] - 4.4);
        c.quadraticCurveTo(h[0] + 2.2, h[1] - 4.4, h[0] + 2.1, h[1] - 1.8);
        c.closePath();
        fillShaded(c, h[0] - 1.8, h[0] + 2.2, "#3a332d");
        stroke(c, 0.25);
        c.beginPath();
        c.moveTo(h[0] + 1.6, h[1] - 3.2);
        c.quadraticCurveTo(h[0] + 5.2, h[1] - 6.4, h[0] + 5.6, h[1] - 2.6);
        c.quadraticCurveTo(h[0] + 4, h[1] - 4.4, h[0] + 1.6, h[1] - 2.4);
        fillShaded(c, h[0] + 1.6, h[0] + 5.6, "#f4efe2");
      },
    },
    (c) => {
      // Musket rest (forked stick) held low in the far hand.
      shaft(c, [3.6, -11.6], [4.6, -0.4], 0.4, WOOD);
      grip(c, [3.6, -11.6]);
    },
    (c) => {
      // Musket standing at the side, butt on the ground.
      shaft(c, [-4.9, -0.8], [-5, -10.6], 1.05, "#7a4f2a");
      shaft(c, [-5, -10.6], [-5.2, -26.4], 0.5, "#4a4f55");
      line(c, [-5.5, -9.4, -4.4, -9.4], "#c9a65a", 0.4);
      grip(c, [-4.8, -12.8]);
    },
  );
}

function rifleman(ctx: Ctx, color: string): void {
  const pose: Pose = {
    ...STAND,
    farArm: [[3, -17], [4.4, -14.6], [4.8, -12.8]],
    nearArm: [[-3, -17], [-1.6, -14], [2.6, -15.2]],
  };
  drawPerson(
    ctx,
    pose,
    {
      legs: tone(KHAKI, 0.9),
      boots: "#2e2620",
      body: KHAKI,
      sleeves: KHAKI,
      skirt: 4.2,
      skirtColor: tone(KHAKI, 0.95),
      belt: "#4a3a26",
      chest: (c) => {
        // Collar patches, pockets and the armband in the player's colour.
        c.fillStyle = color;
        c.fillRect(-1.9, -17.6, 1.1, 0.9);
        c.fillRect(0.8, -17.6, 1.1, 0.9);
        c.strokeStyle = tone(KHAKI, 0.6);
        c.lineWidth = 0.3;
        c.strokeRect(-2.3, -15.6, 1.6, 1.8);
        c.strokeRect(0.7, -15.6, 1.6, 1.8);
        for (const x of [-2.6, -1.4, 1.2, 2.4]) {
          c.fillStyle = "#5a4a30";
          c.fillRect(x - 0.5, -11.6, 1, 1.4);
        }
      },
      hat: (c, h) => {
        // Steel helmet with a rim.
        c.beginPath();
        c.ellipse(h[0], h[1] - 0.9, 3.4, 0.85, 0, 0, Math.PI * 2);
        fillShaded(c, h[0] - 3.4, h[0] + 3.4, "#5d6448", 1.3, 0.6);
        stroke(c, 0.25);
        c.beginPath();
        c.moveTo(h[0] - 2.3, h[1] - 1);
        c.quadraticCurveTo(h[0] - 2.4, h[1] - 3.6, h[0], h[1] - 3.6);
        c.quadraticCurveTo(h[0] + 2.4, h[1] - 3.6, h[0] + 2.3, h[1] - 1);
        c.closePath();
        fillShaded(c, h[0] - 2.4, h[0] + 2.4, "#5d6448", 1.35, 0.6);
        stroke(c, 0.25);
      },
    },
    undefined,
    (c) => {
      // Rifle held upright at the right side, bayonet fixed.
      shaft(c, [4.4, -7.6], [4.2, -15], 1.1, "#6e4a2a");
      shaft(c, [4.2, -15], [3.9, -24.4], 0.5, "#3d4247");
      line(c, [3.9, -24.4, 3.8, -28.4], "#d9dee2", 0.35);
      grip(c, [4.8, -12.8]);
      grip(c, [2.6, -15.2]);
    },
  );
}

// ---------- horses ----------

function horse(ctx: Ctx, coat: string, cloth: string | null, armored = false): void {
  const dark = tone(coat, 0.62);
  // Far legs.
  for (const [hip, knee, hoof] of [
    [[-5.4, -7.6], [-6.4, -4.2], [-6.9, -0.4]],
    [[4.4, -7.8], [5.6, -4.4], [6.1, -0.4]],
  ] as [P, P, P][]) {
    limb(ctx, hip, knee, 1.25, 0.65, dark);
    limb(ctx, knee, hoof, 0.6, 0.5, dark);
    ctx.fillStyle = "#2a221c";
    ctx.fillRect(hoof[0] - 0.7, hoof[1] - 0.5, 1.4, 0.9);
  }
  // Tail.
  ctx.beginPath();
  ctx.moveTo(6.6, -9.6);
  ctx.quadraticCurveTo(9.4, -8.6, 8.8, -2.8);
  ctx.quadraticCurveTo(8, -5.6, 6.4, -7.8);
  ctx.fillStyle = tone(coat, 0.45);
  ctx.fill();
  // Body: chest, belly and rump.
  ctx.beginPath();
  ctx.moveTo(-6.6, -11.2);
  ctx.bezierCurveTo(-8.2, -9.6, -7.8, -6.6, -5.8, -6.2);
  ctx.bezierCurveTo(-2.4, -5.2, 2.2, -5.4, 4.6, -6.2);
  ctx.bezierCurveTo(7.2, -6.6, 7.8, -9.8, 6.4, -11.2);
  ctx.bezierCurveTo(4.4, -12.4, 1.6, -11.6, -0.6, -11.8);
  ctx.bezierCurveTo(-3, -12, -5.2, -12.4, -6.6, -11.2);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -12.4, 0, -5.2);
  g.addColorStop(0, tone(coat, 1.25));
  g.addColorStop(0.55, coat);
  g.addColorStop(1, tone(coat, 0.65));
  ctx.fillStyle = g;
  ctx.fill();
  stroke(ctx, 0.35);
  // Neck and head.
  ctx.beginPath();
  ctx.moveTo(-5.2, -11.6);
  ctx.bezierCurveTo(-6.2, -14.4, -7, -16.6, -8.4, -17.6);
  ctx.lineTo(-9.4, -18.2);
  ctx.bezierCurveTo(-10.6, -17.2, -11.8, -15.4, -12.2, -14.4);
  ctx.quadraticCurveTo(-12.4, -13.4, -11.3, -13.4);
  ctx.bezierCurveTo(-10.2, -14, -9.4, -14.6, -8.8, -14.4);
  ctx.bezierCurveTo(-8.4, -12.6, -8.4, -10.6, -7.2, -9.4);
  ctx.closePath();
  const ng = ctx.createLinearGradient(-12, -16, -5, -11);
  ng.addColorStop(0, tone(coat, 1.2));
  ng.addColorStop(1, tone(coat, 0.8));
  ctx.fillStyle = ng;
  ctx.fill();
  stroke(ctx, 0.35);
  // Ear, eye, nostril, mane.
  ctx.beginPath();
  ctx.moveTo(-8.6, -17.8);
  ctx.lineTo(-8.2, -19.6);
  ctx.lineTo(-7.7, -17.6);
  ctx.fillStyle = tone(coat, 0.8);
  ctx.fill();
  ctx.fillStyle = "#14100c";
  ctx.beginPath();
  ctx.arc(-9.4, -16.4, 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-11.6, -14, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-8.2, -18);
  ctx.bezierCurveTo(-6.6, -16.8, -5.4, -14.2, -4.8, -11.8);
  ctx.lineTo(-5.6, -11.6);
  ctx.bezierCurveTo(-6.2, -13.8, -7.2, -15.8, -8.6, -17.4);
  ctx.fillStyle = tone(coat, 0.4);
  ctx.fill();
  // Bridle.
  line(ctx, [-11.2, -14.6, -9, -16.8, -8.4, -17.4], "#3a2a1e", 0.3);
  // Near legs, with a bend at the knee and hock.
  for (const [hip, knee, hoof] of [
    [[-4.8, -7.4], [-5.2, -4], [-4.9, -0.4]],
    [[5.4, -7.6], [6.6, -4.6], [7.3, -0.4]],
  ] as [P, P, P][]) {
    limb(ctx, hip, knee, 1.45, 0.72, coat);
    limb(ctx, knee, hoof, 0.66, 0.55, tone(coat, 0.92));
    ctx.fillStyle = "#2a221c";
    ctx.fillRect(hoof[0] - 0.75, hoof[1] - 0.55, 1.5, 0.95);
  }
  if (cloth) {
    // Caparison reaching down over the body.
    ctx.beginPath();
    ctx.moveTo(-6.4, -12);
    ctx.quadraticCurveTo(0, -12.6, 6.6, -11.6);
    ctx.lineTo(7.4, -5.2);
    for (let x = 7.4; x > -7; x -= 1.45) ctx.quadraticCurveTo(x - 0.72, -4.2, x - 1.45, -5.2);
    ctx.lineTo(-7.2, -5.2);
    ctx.closePath();
    fillShaded(ctx, -7.2, 7.4, cloth, 1.2, 0.65);
    stroke(ctx, 0.3);
    ctx.fillStyle = "#e8d58a";
    for (let x = -6.2; x < 7; x += 2.6) {
      ctx.beginPath();
      ctx.arc(x, -8.4, 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    if (armored) {
      ctx.beginPath();
      ctx.moveTo(-8.4, -17.6);
      ctx.lineTo(-11.6, -14.8);
      ctx.lineTo(-10.6, -14);
      ctx.lineTo(-8, -16.4);
      ctx.closePath();
      fillShaded(ctx, -11.6, -8, IRON, 1.4, 0.6);
      stroke(ctx, 0.25);
    }
  } else {
    // Saddle blanket.
    ctx.beginPath();
    ctx.roundRect(-2.6, -12.2, 5, 3.4, 0.6);
    fillShaded(ctx, -2.6, 2.4, "#8a2f24");
    stroke(ctx, 0.25);
  }
}

function rider(ctx: Ctx, color: string, armored: boolean, armFront: [P, P]): void {
  const metal = "#b5bcc3";
  const body = armored ? metal : color;
  // Leg hanging down the horse's side.
  limb(ctx, [-0.4, -11.6], [0.6, -9], 1.15, 0.8, armored ? metal : "#6a5236");
  limb(ctx, [0.6, -9], [0, -6.2], 0.8, 0.6, armored ? metal : "#6a5236");
  ctx.fillStyle = "#2e2620";
  ctx.beginPath();
  ctx.ellipse(-0.4, -6, 1, 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Torso.
  ctx.beginPath();
  ctx.moveTo(-1.9, -18.6);
  ctx.quadraticCurveTo(0, -19.4, 2.1, -18.6);
  ctx.lineTo(1.9, -12);
  ctx.lineTo(-1.9, -12);
  ctx.closePath();
  fillShaded(ctx, -1.9, 2.1, body, armored ? 1.45 : 1.15, 0.62);
  stroke(ctx);
  if (armored) {
    // Surcoat in the player's colour over the armour.
    ctx.beginPath();
    ctx.moveTo(-1.6, -17.6);
    ctx.lineTo(1.8, -17.6);
    ctx.lineTo(2, -11.4);
    ctx.lineTo(-1.8, -11.4);
    ctx.closePath();
    fillShaded(ctx, -1.8, 2, color);
    stroke(ctx, 0.25);
    line(ctx, [0.1, -17.2, 0.1, -12], "#e8d58a", 0.45);
    line(ctx, [-1.4, -15.2, 1.6, -15.2], "#e8d58a", 0.45);
  }
  const h: P = [0.1, -20.8];
  if (armored) {
    // Great helm.
    ctx.beginPath();
    ctx.moveTo(h[0] - 1.9, h[1] + 2);
    ctx.lineTo(h[0] - 1.9, h[1] - 1.4);
    ctx.quadraticCurveTo(h[0], h[1] - 3.2, h[0] + 1.9, h[1] - 1.4);
    ctx.lineTo(h[0] + 1.9, h[1] + 2);
    ctx.closePath();
    fillShaded(ctx, h[0] - 1.9, h[0] + 1.9, metal, 1.5, 0.55);
    stroke(ctx, 0.3);
    ctx.fillStyle = "#1c1a18";
    ctx.fillRect(h[0] - 1.9, h[1] - 0.2, 3, 0.45);
    // Plume.
    ctx.beginPath();
    ctx.moveTo(h[0], h[1] - 2.4);
    ctx.quadraticCurveTo(h[0] + 3, h[1] - 6, h[0] + 4.4, h[1] - 3);
    ctx.quadraticCurveTo(h[0] + 2.6, h[1] - 4, h[0] + 0.4, h[1] - 1.8);
    fillShaded(ctx, h[0], h[0] + 4.4, color);
  } else {
    drawHead(ctx, h, { legs: "", boots: "", body: "", sleeves: "", skirt: 0, hair: HAIR, beard: false });
  }
  limb(ctx, [-1.2, -18], armFront[0], 0.8, 0.65, armored ? metal : body);
  limb(ctx, armFront[0], armFront[1], 0.65, 0.5, armored ? metal : SKIN);
  grip(ctx, armFront[1], armored ? metal : SKIN);
}

function horseman(ctx: Ctx, color: string): void {
  horse(ctx, "#8a5a36", null);
  // Javelin held high, ready to throw.
  shaft(ctx, [3.4, -17], [-8.6, -26], 0.45, "#8a6038");
  ctx.beginPath();
  ctx.moveTo(-10.2, -27.2);
  ctx.lineTo(-8.2, -26.6);
  ctx.lineTo(-8.8, -25.6);
  ctx.closePath();
  ctx.fillStyle = IRON;
  ctx.fill();
  rider(ctx, color, false, [[-2.4, -16.4], [-3.2, -14]]);
  line(ctx, [-3.2, -14, -10.4, -14.6], "#3a2a1e", 0.25);
  grip(ctx, [1.6, -19.8]);
}

function knight(ctx: Ctx, color: string): void {
  horse(ctx, "#e4ddd0", color, true);
  rider(ctx, color, true, [[-1.6, -15.6], [-3.4, -15.2]]);
  // Couched lance.
  shaft(ctx, [3.6, -16.6], [-15.4, -17.8], 0.7, "#d9c9a0");
  ctx.beginPath();
  ctx.moveTo(-17.2, -17.9);
  ctx.lineTo(-15, -18.4);
  ctx.lineTo(-15, -17.2);
  ctx.closePath();
  fillShaded(ctx, -17.2, -15, IRON, 1.4, 0.6);
  ctx.beginPath();
  ctx.moveTo(-10, -17.6);
  ctx.lineTo(-12.8, -16.6);
  ctx.lineTo(-10, -15.6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  grip(ctx, [-3.4, -15.2], "#b5bcc3");
  // Heater shield with a cross.
  ctx.beginPath();
  ctx.moveTo(1.2, -18.4);
  ctx.lineTo(4.6, -18.4);
  ctx.lineTo(4.6, -15.6);
  ctx.quadraticCurveTo(4.4, -13, 2.9, -12.2);
  ctx.quadraticCurveTo(1.4, -13, 1.2, -15.6);
  ctx.closePath();
  fillShaded(ctx, 1.2, 4.6, color, 1.25, 0.6);
  stroke(ctx, 0.3);
  line(ctx, [2.9, -18.2, 2.9, -12.6], "#e8d58a", 0.55);
  line(ctx, [1.4, -16.2, 4.4, -16.2], "#e8d58a", 0.55);
}

// ---------- machines ----------

function spokedWheel(ctx: Ctx, x: number, y: number, r: number, tyre: string, hub = "#a07a4a"): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  fillShaded(ctx, x - r, x + r, tyre, 1.1, 0.55);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(40, 30, 20, 0.35)";
  ctx.fill();
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 6 + 0.2;
    line(ctx, [x - Math.cos(a) * r * 0.8, y - Math.sin(a) * r * 0.8, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8], hub, r * 0.13);
  }
  ctx.beginPath();
  ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = tone(hub, 0.8);
  ctx.fill();
  stroke(ctx, 0.25);
}

function settlers(ctx: Ctx, color: string, working: boolean): void {
  // Ox.
  ctx.save();
  ctx.translate(-8.6, 0);
  ctx.scale(0.62, 0.6);
  const ox = "#7a5a3e";
  for (const [a, b, c] of [
    [[-4.6, -7.4], [-5.2, -3.6], [-5.4, -0.4]],
    [[4, -7.6], [4.6, -3.8], [4.8, -0.4]],
  ] as [P, P, P][]) {
    limb(ctx, a, b, 1.6, 1, tone(ox, 0.7));
    limb(ctx, b, c, 1, 0.8, tone(ox, 0.7));
  }
  ctx.beginPath();
  ctx.moveTo(-6.4, -12.4);
  ctx.bezierCurveTo(-8.4, -10.6, -7.6, -6.4, -5.6, -6);
  ctx.bezierCurveTo(-2, -5, 2.4, -5.4, 5.2, -6.2);
  ctx.bezierCurveTo(7.4, -7, 7.6, -11, 6.2, -12.2);
  ctx.bezierCurveTo(2.4, -13.6, -2, -13.6, -6.4, -12.4);
  fillShaded(ctx, -8, 7.6, ox, 1.25, 0.65);
  stroke(ctx, 0.5);
  ctx.beginPath();
  ctx.ellipse(-8.8, -10.2, 2.6, 2, -0.4, 0, Math.PI * 2);
  fillShaded(ctx, -11.4, -6.2, tone(ox, 0.95));
  stroke(ctx, 0.5);
  line(ctx, [-8.4, -11.8, -10.4, -14.2, -11.6, -13.4], "#efe6cf", 0.8);
  line(ctx, [-7.6, -12, -6, -14.6, -4.8, -14.2], "#efe6cf", 0.8);
  for (const [a, b, c] of [
    [[-4.2, -7.2], [-4.4, -3.6], [-4.2, -0.4]],
    [[4.6, -7.4], [5.4, -3.8], [5.8, -0.4]],
  ] as [P, P, P][]) {
    limb(ctx, a, b, 1.7, 1.05, ox);
    limb(ctx, b, c, 1.05, 0.85, ox);
  }
  ctx.restore();
  // Yoke and pole.
  line(ctx, [-5.6, -6.2, 0.4, -4.4], WOOD, 0.7);
  // Wagon.
  ctx.beginPath();
  ctx.moveTo(-0.6, -6.4);
  ctx.lineTo(10.8, -6.4);
  ctx.lineTo(10.2, -3.4);
  ctx.lineTo(-0.2, -3.4);
  ctx.closePath();
  fillShaded(ctx, -0.6, 10.8, "#8a5a34");
  stroke(ctx, 0.3);
  line(ctx, [-0.4, -4.9, 10.5, -4.9], tone("#8a5a34", 0.7), 0.25);
  // Canvas cover with hoops.
  ctx.beginPath();
  ctx.moveTo(0, -6.4);
  ctx.bezierCurveTo(-0.4, -14.6, 10.6, -14.6, 10.2, -6.4);
  ctx.closePath();
  const cg = ctx.createRadialGradient(3, -12, 0.5, 5, -9, 8);
  cg.addColorStop(0, "#fffaf0");
  cg.addColorStop(1, "#cbbd9c");
  ctx.fillStyle = cg;
  ctx.fill();
  stroke(ctx, 0.35);
  ctx.strokeStyle = "rgba(120, 100, 70, 0.5)";
  ctx.lineWidth = 0.3;
  for (const x of [2.6, 5.1, 7.6]) {
    ctx.beginPath();
    ctx.moveTo(x, -6.4);
    ctx.quadraticCurveTo(x - 0.2, -11, x + (x - 5.1) * 0.1, -12.6);
    ctx.stroke();
  }
  // Belongings at the back.
  ctx.fillStyle = "#6a4a2c";
  ctx.fillRect(9.4, -8.4, 1.8, 2);
  spokedWheel(ctx, 1.8, -2.4, 2.4, "#4f3420");
  spokedWheel(ctx, 8.4, -2.4, 2.4, "#4f3420");
  // Flag of the new city.
  line(ctx, [10.4, -6.4, 10.4, -18], "#3a2a1e", 0.4);
  ctx.beginPath();
  ctx.moveTo(10.4, -18);
  ctx.quadraticCurveTo(12.4, -18.6, 14.4, -17.4);
  ctx.lineTo(14.2, -15.2);
  ctx.quadraticCurveTo(12.4, -16, 10.4, -15.4);
  ctx.closePath();
  fillShaded(ctx, 10.4, 14.4, color);
  stroke(ctx, 0.25);
  if (working) {
    // A shovel stuck in the ground next to the wagon.
    line(ctx, [-2, -0.6, -3.4, -8.4], WOOD, 0.5);
    ctx.beginPath();
    ctx.moveTo(-2.6, -1.4);
    ctx.lineTo(-1.2, -1.6);
    ctx.lineTo(-1.4, 0.4);
    ctx.lineTo(-2.4, 0.6);
    ctx.closePath();
    fillShaded(ctx, -2.6, -1.2, IRON, 1.4, 0.6);
  }
}

function catapult(ctx: Ctx, color: string): void {
  const wood = "#8a6038";
  // Base frame in perspective.
  ctx.beginPath();
  ctx.moveTo(-8.6, -5.4);
  ctx.lineTo(6.6, -5.4);
  ctx.lineTo(8, -6.8);
  ctx.lineTo(-7.2, -6.8);
  ctx.closePath();
  fillShaded(ctx, -8.6, 8, tone(wood, 0.8));
  stroke(ctx, 0.3);
  ctx.beginPath();
  ctx.rect(-8.6, -5.4, 15.2, 2);
  fillShaded(ctx, -8.6, 6.6, wood);
  stroke(ctx, 0.3);
  // Uprights and cross beam.
  limb(ctx, [-0.6, -5.4], [0.2, -12.6], 0.65, 0.55, wood);
  limb(ctx, [2.8, -5.4], [1.8, -12.6], 0.65, 0.55, tone(wood, 0.85));
  limb(ctx, [-1.4, -12.8], [3, -12.8], 0.6, 0.6, tone(wood, 1.05));
  // Twisted rope skein at the pivot.
  ctx.beginPath();
  ctx.ellipse(-4.6, -6.3, 1.4, 1.1, 0, 0, Math.PI * 2);
  fillShaded(ctx, -6, -3.2, "#cbb68a");
  stroke(ctx, 0.25);
  for (let k = -1; k <= 1; k++) line(ctx, [-5.6, -6.8 + k * 0.5, -3.6, -5.8 + k * 0.5], "rgba(90,70,40,0.6)", 0.2);
  // Throwing arm with the sling.
  limb(ctx, [-4.6, -6.4], [4.4, -15.6], 0.75, 0.55, tone(wood, 1.1));
  ctx.beginPath();
  ctx.ellipse(4.9, -16.2, 1.6, 1, -0.75, 0, Math.PI * 2);
  fillShaded(ctx, 3.3, 6.5, LEATHER);
  stroke(ctx, 0.25);
  const sg = ctx.createRadialGradient(4.7, -17.2, 0.1, 5, -16.8, 1.3);
  sg.addColorStop(0, "#d6d0c4");
  sg.addColorStop(1, "#6f6a62");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(5, -16.9, 1.15, 0, Math.PI * 2);
  ctx.fill();
  // Pennant.
  line(ctx, [6.8, -6.8, 6.8, -12.8], "#3a2a1e", 0.35);
  ctx.beginPath();
  ctx.moveTo(6.8, -12.8);
  ctx.lineTo(9.6, -12);
  ctx.lineTo(6.8, -11.2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  spokedWheel(ctx, -5.8, -2.1, 2.1, "#5a3b22");
  spokedWheel(ctx, 4.6, -2.1, 2.1, "#5a3b22");
}

function cannon(ctx: Ctx, color: string): void {
  // Trail resting on the ground.
  ctx.beginPath();
  ctx.moveTo(-0.6, -6.2);
  ctx.lineTo(9.2, -0.9);
  ctx.lineTo(8.6, 0);
  ctx.lineTo(-1.6, -4.6);
  ctx.closePath();
  fillShaded(ctx, -1.6, 9.2, "#6a4a2c");
  stroke(ctx, 0.3);
  ctx.fillStyle = color;
  ctx.fillRect(3.4, -3.8, 1.6, 1.4);
  // Bronze barrel with rings and muzzle swell.
  ctx.save();
  ctx.translate(0.4, -7.6);
  ctx.rotate(-0.2);
  ctx.beginPath();
  ctx.moveTo(3.4, -1.9);
  ctx.lineTo(-10.6, -1.25);
  ctx.quadraticCurveTo(-11.6, -1.5, -11.8, -1.7);
  ctx.lineTo(-11.8, 1.7);
  ctx.quadraticCurveTo(-11.6, 1.5, -10.6, 1.25);
  ctx.lineTo(3.4, 1.9);
  ctx.quadraticCurveTo(5.2, 0, 3.4, -1.9);
  ctx.closePath();
  const bg = ctx.createLinearGradient(0, -2, 0, 2);
  bg.addColorStop(0, "#f0c98a");
  bg.addColorStop(0.35, BRONZE);
  bg.addColorStop(1, "#6a4a22");
  ctx.fillStyle = bg;
  ctx.fill();
  stroke(ctx, 0.3);
  for (const x of [-9.8, -4.6, 0.8]) {
    ctx.fillStyle = "rgba(90, 60, 25, 0.6)";
    ctx.fillRect(x, -1.7, 0.55, 3.4);
  }
  ctx.fillStyle = "#1a1612";
  ctx.beginPath();
  ctx.ellipse(-11.8, 0, 0.35, 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Carriage cheek and the big wheel.
  ctx.beginPath();
  ctx.moveTo(-2.4, -8.6);
  ctx.lineTo(2.2, -8.2);
  ctx.lineTo(2.6, -5.2);
  ctx.lineTo(-2, -5.2);
  ctx.closePath();
  fillShaded(ctx, -2.4, 2.6, "#7a5232");
  stroke(ctx, 0.3);
  spokedWheel(ctx, 0.4, -3.6, 3.5, "#4f3420");
  // Cannonballs.
  for (const [x, y] of [[7.4, -0.8], [8.9, -0.8], [8.15, -1.9]] as const) {
    const g = ctx.createRadialGradient(x - 0.25, y - 0.25, 0.05, x, y, 0.75);
    g.addColorStop(0, "#9aa0a6");
    g.addColorStop(1, "#2a2d30");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tank(ctx: Ctx, color: string): void {
  const paint = tone(color, 0.78);
  // Track run with guide teeth.
  ctx.beginPath();
  ctx.roundRect(-11, -5.2, 21.4, 5, 2.5);
  fillShaded(ctx, -11, 10.4, "#3a3d40", 1.2, 0.7);
  stroke(ctx, 0.35);
  ctx.fillStyle = "#24272a";
  for (let x = -10; x < 10; x += 1.1) ctx.fillRect(x, -0.3, 0.55, 0.45);
  for (const x of [-8.2, -5, -1.8, 1.4, 4.6, 7.8]) {
    const g = ctx.createRadialGradient(x - 0.4, -3, 0.1, x, -2.7, 1.6);
    g.addColorStop(0, "#9aa0a6");
    g.addColorStop(1, "#4a4f54");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, -2.7, 1.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a2d30";
    ctx.beginPath();
    ctx.arc(x, -2.7, 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  // Hull with a sloped front.
  ctx.beginPath();
  ctx.moveTo(-12, -5.2);
  ctx.lineTo(-9.6, -9.2);
  ctx.lineTo(9.2, -9.2);
  ctx.lineTo(11, -5.2);
  ctx.closePath();
  const hg = ctx.createLinearGradient(0, -9.2, 0, -5.2);
  hg.addColorStop(0, tone(paint, 1.25));
  hg.addColorStop(1, tone(paint, 0.75));
  ctx.fillStyle = hg;
  ctx.fill();
  stroke(ctx, 0.35);
  // Track guards and side skirts.
  ctx.fillStyle = tone(paint, 0.6);
  ctx.fillRect(-11.6, -5.6, 22.4, 0.7);
  // Camouflage patches.
  ctx.fillStyle = "rgba(60, 70, 40, 0.35)";
  ctx.beginPath();
  ctx.ellipse(-4, -7.4, 2.6, 1, 0.2, 0, Math.PI * 2);
  ctx.ellipse(5, -7, 2, 0.9, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Turret.
  ctx.beginPath();
  ctx.moveTo(-4.6, -9.2);
  ctx.lineTo(-3.6, -13);
  ctx.quadraticCurveTo(0, -14, 4.4, -13);
  ctx.lineTo(5.4, -9.2);
  ctx.closePath();
  fillShaded(ctx, -4.6, 5.4, paint, 1.3, 0.65);
  stroke(ctx, 0.35);
  // Gun with a muzzle brake.
  ctx.beginPath();
  ctx.rect(-14.6, -11.9, 11, 1.2);
  fillShaded(ctx, -14.6, -3.6, "#4a4f54", 1.4, 0.7);
  stroke(ctx, 0.25);
  ctx.fillStyle = "#33373a";
  ctx.fillRect(-15.4, -12.3, 1.4, 2);
  ctx.fillStyle = tone(paint, 0.75);
  ctx.fillRect(-4.6, -12.6, 1.4, 2.6);
  // Hatch, commander and a white star of recognition.
  ctx.beginPath();
  ctx.ellipse(1.6, -13.4, 1.6, 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#2f3337";
  ctx.fill();
  ctx.fillStyle = "#f2efe6";
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 0.45 : 1.05;
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    ctx[k ? "lineTo" : "moveTo"](0.6 + Math.cos(a) * r, -11.1 + Math.sin(a) * r);
  }
  ctx.fill();
}

/** Units drawn wider than tall; they get a wider base. */
export const WIDE_UNITS: readonly UnitTypeId[] = ["settlers", "horsemen", "knights", "catapult", "cannon", "tank"];

export function drawUnitArt(ctx: Ctx, type: UnitTypeId, color: string, working: boolean): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // People are drawn 22 units tall; on the map a figure stands about 18 units high.
  const k = 0.8;
  ctx.scale(k, k);
  switch (type) {
    case "settlers":
      settlers(ctx, color, working);
      break;
    case "warriors":
      warrior(ctx, color);
      break;
    case "spearmen":
      spearman(ctx, color);
      break;
    case "archers":
      archer(ctx, color);
      break;
    case "swordsmen":
      legionary(ctx, color);
      break;
    case "musketeers":
      musketeer(ctx, color);
      break;
    case "riflemen":
      rifleman(ctx, color);
      break;
    case "horsemen":
      horseman(ctx, color);
      break;
    case "knights":
      knight(ctx, color);
      break;
    case "catapult":
      catapult(ctx, color);
      break;
    case "cannon":
      cannon(ctx, color);
      break;
    case "tank":
      tank(ctx, color);
      break;
  }
  ctx.restore();
}
