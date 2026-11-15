/**
 * A celebration when the player completes a wonder: fireworks and confetti
 * over a card with the wonder's picture, what it was in history and what it
 * does in the game. Several wonders in one turn are shown one after another.
 */
import { BUILDINGS, type BuildingId } from "../core";
import { codexPage, pictureOf } from "./codex";
import { buildingPortraitCanvas } from "./buildingArt";
import { describeBuilding, escapeHtml } from "./texts";
import { t } from "./i18n";
import { buildingName } from "./i18n/names";

export interface CelebrationHost {
  openEntry(key: string): void;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  confetti: boolean;
  spin: number;
}

const COLORS = ["#ffd45e", "#ff7a59", "#7fd1ff", "#b78bff", "#7be08a", "#ffffff", "#ff9ad5"];

export function createCelebration(dialog: HTMLDialogElement, host: CelebrationHost) {
  const waiting: { building: BuildingId; city: string }[] = [];
  let frame = 0;

  function fireworks(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext("2d")!;
    const sparks: Spark[] = [];
    let last = performance.now();
    let nextBurst = 0;
    let started = last;
    // Screen decoration only, so Math.random is fine here.
    const burst = (w: number, h: number) => {
      const x = w * (0.15 + Math.random() * 0.7);
      const y = h * (0.12 + Math.random() * 0.35);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]!;
      for (let k = 0; k < 46; k++) {
        const a = (k / 46) * Math.PI * 2;
        const v = 90 + Math.random() * 110;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.2 + Math.random() * 0.6, color, size: 2.2, confetti: false, spin: 0 });
      }
    };
    const confetti = (w: number) => {
      for (let k = 0; k < 90; k++) {
        sparks.push({
          x: Math.random() * w,
          y: -20 - Math.random() * 200,
          vx: (Math.random() - 0.5) * 40,
          vy: 60 + Math.random() * 80,
          life: 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
          size: 4 + Math.random() * 4,
          confetti: true,
          spin: Math.random() * Math.PI * 2,
        });
      }
    };
    const step = (now: number) => {
      if (!dialog.open) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (sparks.length === 0 && now - started < 100) confetti(w);
      // Bursts for the first seconds, then the sky calms down.
      if (now > nextBurst && now - started < 6000) {
        burst(w, h);
        nextBurst = now + 450 + Math.random() * 500;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (let k = sparks.length - 1; k >= 0; k--) {
        const s = sparks[k]!;
        s.life -= dt;
        if (s.life <= 0 || s.y > h + 20) {
          sparks.splice(k, 1);
          continue;
        }
        if (s.confetti) {
          s.spin += dt * 6;
          s.x += (s.vx + Math.sin(s.spin) * 30) * dt;
          s.y += s.vy * dt;
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.spin);
          ctx.fillStyle = s.color;
          ctx.fillRect(-s.size / 2, -s.size / 4, s.size, s.size / 2);
          ctx.restore();
        } else {
          s.vy += 90 * dt;
          s.vx *= 0.985;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          ctx.globalAlpha = Math.max(0, Math.min(1, s.life));
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      frame = requestAnimationFrame(step);
    };
    started = performance.now();
    frame = requestAnimationFrame(step);
  }

  function showNext(): void {
    const next = waiting.shift();
    if (!next) {
      if (dialog.open) dialog.close();
      return;
    }
    const { building, city } = next;
    const key = `wdr-${building}`;
    const page = codexPage(key)?.page;
    const pic = pictureOf(key);
    dialog.innerHTML = `
      <canvas class="cel-sky"></canvas>
      <div class="cel-card">
        <div class="cel-head">${t("Div světa je hotový!")}</div>
        <div class="cel-picture">${pic ? `<img src="${pic}" alt="${escapeHtml(buildingName(building))}">` : ""}</div>
        <h2>${escapeHtml(buildingName(building))}</h2>
        <p class="cel-city">${t("Postavilo ho město {city}. Žádná jiná říše už ho mít nebude.", { city: escapeHtml(city) })}</p>
        ${page ? `<p class="cel-text">${escapeHtml(page.text)}</p>` : ""}
        <div class="cel-rule"><b>${t("Co ti přinese:")}</b> ${escapeHtml(describeBuilding(BUILDINGS[building], false))}</div>
        <div class="cel-actions">
          <button type="button" data-read>${t("Přečíst v encyklopedii")}</button>
          <button type="button" class="primary" data-next>${waiting.length ? t("Další div") : t("Pokračovat")}</button>
        </div>
      </div>`;
    if (!pic) dialog.querySelector(".cel-picture")!.append(buildingPortraitCanvas(building, 320, 240));
    dialog.querySelector("[data-next]")!.addEventListener("click", showNext);
    dialog.querySelector("[data-read]")!.addEventListener("click", () => {
      waiting.length = 0;
      dialog.close();
      host.openEntry(key);
    });
    if (!dialog.open) dialog.showModal();
    cancelAnimationFrame(frame);
    fireworks(dialog.querySelector<HTMLCanvasElement>(".cel-sky")!);
    dialog.querySelector<HTMLButtonElement>("[data-next]")!.focus();
  }

  dialog.addEventListener("close", () => {
    cancelAnimationFrame(frame);
    waiting.length = 0;
  });

  return {
    /** Adds a completed wonder; the first one opens the celebration right away. */
    show(building: BuildingId, city: string): void {
      waiting.push({ building, city });
      if (!dialog.open) showNext();
    },
    isOpen: () => dialog.open,
  };
}
