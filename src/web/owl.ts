/**
 * The owl who guides children through the game, in three moods: she gives
 * advice, praises or warns. Painted pictures from Gemini replace the drawing
 * once they are in src/web/guide/ as owl-advise, owl-praise and owl-warn.
 */

export type OwlMood = "advise" | "praise" | "warn";

const PICTURES = import.meta.glob<string>("./guide/*.{webp,jpg,jpeg,png}", { eager: true, query: "?url", import: "default" });

function painted(mood: OwlMood): string | null {
  for (const [path, url] of Object.entries(PICTURES)) {
    if (path.split("/").pop()!.replace(/\.[a-z]+$/, "") === `owl-${mood}`) return url;
  }
  return null;
}

/** The owl as HTML: the painted picture when there is one, otherwise the drawing. */
export function owlHtml(mood: OwlMood, size: number): string {
  const url = painted(mood);
  if (url) return `<img class="owl owl-${mood}" src="${url}" width="${size}" height="${size}" alt="">`;
  return owlSvg(mood, size);
}

/** A round wise owl with spectacles, drawn on a 100 × 100 grid. */
export function owlSvg(mood: OwlMood, size: number): string {
  const body = "#8a5a32";
  const dark = "#5e3a1e";
  const belly = "#e8cfa0";
  const eye = (cx: number) => {
    if (mood === "praise") {
      // Happy closed eyes.
      return `<circle cx="${cx}" cy="40" r="12" fill="#fff8e6" stroke="${dark}" stroke-width="1.5"/><path d="M${cx - 7} 42 Q${cx} 33 ${cx + 7} 42" fill="none" stroke="#2a1a0e" stroke-width="3" stroke-linecap="round"/>`;
    }
    const look = mood === "warn" ? 0 : 1.5;
    return `<circle cx="${cx}" cy="40" r="12" fill="#fff8e6" stroke="${dark}" stroke-width="1.5"/><circle cx="${cx + look}" cy="41" r="6.5" fill="#e8a628"/><circle cx="${cx + look}" cy="41" r="3.6" fill="#1d120a"/><circle cx="${cx + look + 1.6}" cy="39.2" r="1.3" fill="#fff"/>`;
  };
  const brows =
    mood === "warn"
      ? `<path d="M26 26 L44 32 M74 26 L56 32" stroke="${dark}" stroke-width="3.5" stroke-linecap="round"/>`
      : mood === "praise"
        ? `<path d="M27 25 Q35 20 43 25 M57 25 Q65 20 73 25" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`
        : `<path d="M27 26 Q35 23 43 27 M57 27 Q65 23 73 26" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`;
  // Wings: raised in joy, one up like a raised finger for advice and warnings.
  const left =
    mood === "praise"
      ? `<path d="M22 58 Q4 44 8 24 Q18 40 26 50 Z" fill="${dark}"/>`
      : `<path d="M22 52 Q10 66 18 84 Q24 72 28 62 Z" fill="${dark}"/>`;
  const right =
    mood === "praise"
      ? `<path d="M78 58 Q96 44 92 24 Q82 40 74 50 Z" fill="${dark}"/>`
      : `<path d="M78 56 Q94 46 94 26 Q84 36 74 48 Z" fill="${dark}"/>`;
  const extra =
    mood === "praise"
      ? `<path d="M10 14 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z M88 10 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" fill="#f2cf6b"/>`
      : mood === "warn"
        ? `<g transform="translate(86 14)"><circle r="9" fill="#d9483b"/><rect x="-1.6" y="-5.5" width="3.2" height="7" rx="1.2" fill="#fff"/><circle cy="4.2" r="1.7" fill="#fff"/></g>`
        : "";
  return `<svg class="owl owl-${mood}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
    <ellipse cx="50" cy="94" rx="26" ry="4" fill="rgba(0,0,0,0.25)"/>
    <path d="M28 14 L34 26 L24 24 Z M72 14 L66 26 L76 24 Z" fill="${dark}"/>
    <ellipse cx="50" cy="56" rx="30" ry="36" fill="${body}"/>
    ${left}${right}
    <ellipse cx="50" cy="66" rx="18" ry="22" fill="${belly}"/>
    <path d="M38 60 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 M40 70 q3 3 6 0 q3 3 6 0 q3 3 6 0 M43 80 q3 3 6 0 q3 3 6 0" fill="none" stroke="#c9a46a" stroke-width="1.4"/>
    ${eye(36)}${eye(64)}
    <path d="M48 40 L52 40" stroke="#3b2a1a" stroke-width="2"/>
    ${brows}
    <path d="M45 47 L55 47 L50 56 Z" fill="#e8a628" stroke="${dark}" stroke-width="1"/>
    <path d="M40 92 l-3 4 M44 92 l0 5 M48 92 l3 4 M56 92 l-3 4 M60 92 l0 5 M64 92 l3 4" stroke="#e8a628" stroke-width="2.4" stroke-linecap="round"/>
    ${extra}
  </svg>`;
}
