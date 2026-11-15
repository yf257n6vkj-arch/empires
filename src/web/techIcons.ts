/**
 * Small pictures for the technologies, drawn as SVG on a 48 × 48 grid.
 * They sit on a medallion whose colour comes from the era (see eraColors).
 */
import type { TechId } from "../core";

const I = "#2b2118"; // ink
const L = "#f6ead0"; // light
const M = "#c9974f"; // bronze / wood
const D = "#7a5634"; // dark wood
const R = "#b5452f"; // red
const B = "#4f7fa8"; // blue
const G = "#5f8a3a"; // green
const S = "#a7b0b8"; // steel
const Y = "#f0c24a"; // gold
const W = "#ffffff";

const st = (w = 1.6) => `stroke="${I}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

export const TECH_ICONS: Record<TechId, string> = {
  pottery: `<path d="M18 9h12v3c0 2 6 5 6 13 0 9-6 14-12 14s-12-5-12-14c0-8 6-11 6-13z" fill="${M}" ${st()}/>
    <path d="M14 24h20M15 29h18" stroke="${D}" stroke-width="2"/><path d="M17 9h14" ${st(2.4)}/>`,
  bronze: `<path d="M24 5l4 6v22h-8V11z" fill="${M}" ${st()}/><path d="M24 9v23" stroke="${Y}" stroke-width="1.4"/>
    <path d="M15 33h18v3H15z" fill="${D}" ${st()}/><path d="M22 36h4v7h-4z" fill="${D}" ${st()}/><circle cx="24" cy="44" r="2" fill="${M}" ${st(1.2)}/>`,
  masonry: `<g fill="#cdbb9a" ${st(1.4)}><rect x="6" y="30" width="12" height="8"/><rect x="18" y="30" width="12" height="8"/><rect x="30" y="30" width="12" height="8"/>
    <rect x="12" y="22" width="12" height="8"/><rect x="24" y="22" width="12" height="8"/><rect x="18" y="14" width="12" height="8"/></g>`,
  ceremonies: `<path d="M8 40c4-8 28-8 32 0z" fill="${G}" ${st()}/><path d="M13 36V20h5v16zM30 36V20h5v16z" fill="#b8ad98" ${st()}/>
    <path d="M10 20c4-4 24-4 28 0v-4H10z" fill="#9c9282" ${st()}/><circle cx="24" cy="10" r="4" fill="${Y}" ${st(1.2)}/>`,
  horseback: `<path d="M14 42l2-12c-4-2-6-6-4-10l6-10 4 3 3-5 2 6c6 3 11 9 12 17 0 2-2 3-4 2l-6-4-3 13z" fill="${D}" ${st()}/>
    <path d="M22 13c3 1 6 4 8 8" stroke="${I}" stroke-width="3"/><circle cx="18" cy="17" r="1.4" fill="${I}"/>`,
  wheel: `<circle cx="24" cy="24" r="17" fill="none" stroke="${D}" stroke-width="5"/><circle cx="24" cy="24" r="17" fill="none" ${st(1.2)}/>
    <g stroke="${D}" stroke-width="3">${[0, 45, 90, 135].map((a) => `<path d="M24 24l${(15 * Math.cos((a * Math.PI) / 180)).toFixed(1)} ${(15 * Math.sin((a * Math.PI) / 180)).toFixed(1)}M24 24l${(-15 * Math.cos((a * Math.PI) / 180)).toFixed(1)} ${(-15 * Math.sin((a * Math.PI) / 180)).toFixed(1)}"/>`).join("")}</g>
    <circle cx="24" cy="24" r="4.5" fill="${M}" ${st(1.2)}/>`,
  archery: `<path d="M14 6c14 6 14 30 0 36" fill="none" stroke="${D}" stroke-width="3.2"/><path d="M14 6v36" stroke="${I}" stroke-width="1"/>
    <path d="M10 24h30" ${st(1.8)}/><path d="M40 24l-6-4v8z" fill="${S}" ${st(1.2)}/><path d="M10 24l-3-3M10 24l-3 3M13 24l-3-3M13 24l-3 3" stroke="${R}" stroke-width="1.6"/>`,
  writing: `<rect x="10" y="7" width="28" height="34" rx="4" fill="#d6b98a" ${st()}/>
    <g fill="${I}">${[12, 19, 26, 33].map((y) => [14, 21, 28].map((x, k) => `<path d="M${x + (y % 2) * 2} ${y}l4 1.6-4 1.6z"/>${k === 1 ? `<path d="M${x + 2} ${y + 3.5}l1.5 3h-3z"/>` : ""}`).join("")).join("")}</g>`,
  alphabet: `<rect x="6" y="9" width="36" height="30" rx="3" fill="${L}" ${st()}/>
    <text x="24" y="31" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="17" font-weight="700" fill="${I}">ABC</text>`,
  codeOfLaws: `<path d="M24 6v32M14 38h20" ${st(2.2)}/><path d="M10 12h28" ${st(2.2)}/>
    <path d="M10 12l-5 12h10zM38 12l-5 12h10z" fill="none" ${st(1.2)}/><path d="M4 24c1 4 11 4 12 0zM32 24c1 4 11 4 12 0z" fill="${Y}" ${st(1.2)}/><circle cx="24" cy="6" r="2.5" fill="${Y}" ${st(1.2)}/>`,
  mysticism: `<path d="M30 8a16 16 0 1 0 0 32a13 13 0 1 1 0-32z" fill="${Y}" ${st()}/>
    <path d="M36 12l1.5 4 4 .5-3 2.6 1 4-3.5-2.2-3.5 2.2 1-4-3-2.6 4-.5z" fill="${L}" ${st(1)}/><circle cx="38" cy="32" r="1.6" fill="${L}"/><circle cx="31" cy="38" r="1.2" fill="${L}"/>`,
  currency: `<ellipse cx="24" cy="36" rx="13" ry="4.5" fill="${M}" ${st()}/><path d="M11 36v-4c0 2.5 26 2.5 26 0v4" fill="${M}" ${st(1.2)}/>
    <ellipse cx="24" cy="31" rx="13" ry="4.5" fill="${Y}" ${st()}/><ellipse cx="22" cy="18" rx="11" ry="11" fill="${Y}" ${st()}/><circle cx="22" cy="18" r="7.5" fill="none" stroke="${M}" stroke-width="1.4"/>
    <path d="M19 14h6M22 14v8" stroke="${D}" stroke-width="2"/>`,
  iron: `<path d="M8 26h28c0 4-4 6-8 6v4h6v4H14v-4h6v-4c-6 0-12-2-12-6z" fill="#5f6870" ${st()}/><path d="M36 26c4 0 6-1 6-3H36z" fill="#5f6870" ${st(1.2)}/>
    <path d="M16 8l12 12" stroke="${D}" stroke-width="3.2"/><rect x="22" y="4" width="10" height="8" rx="1.5" transform="rotate(45 27 8)" fill="${S}" ${st(1.2)}/><path d="M30 22l2-4 2 3" stroke="${R}" stroke-width="1.6" fill="none"/>`,
  mapMaking: `<path d="M8 10l10-3 12 4 10-3v30l-10 3-12-4-10 3z" fill="#e7d6ad" ${st()}/><path d="M18 7v30M30 11v30" stroke="${D}" stroke-width="1"/>
    <path d="M12 30c4-2 6-10 12-8s8-6 12-8" fill="none" stroke="${R}" stroke-width="1.8" stroke-dasharray="2.5 2"/><path d="M34 11l3 3m0-3l-3 3" stroke="${R}" stroke-width="1.6"/>`,
  mathematics: `<path d="M8 40V12l26 28z" fill="${L}" ${st()}/><path d="M8 34h6v6" fill="none" ${st(1.2)}/>
    <path d="M30 6l-6 20M30 6l8 20" stroke="${S}" stroke-width="2.4"/><circle cx="30" cy="6" r="2.4" fill="${M}" ${st(1)}/>
    <text x="17" y="34" font-family="Georgia, serif" font-size="9" font-weight="700" fill="${I}">π</text>`,
  literacy: `<path d="M24 12c-6-4-14-4-18-2v26c4-2 12-2 18 2 6-4 14-4 18-2V10c-4-2-12-2-18 2z" fill="${L}" ${st()}/><path d="M24 12v26" ${st(1.2)}/>
    <g stroke="${D}" stroke-width="1.2">${[17, 21, 25, 29].map((y) => `<path d="M10 ${y}c3-1 7-1 10 0M28 ${y}c3-1 7-1 10 0"/>`).join("")}</g>`,
  monarchy: `<path d="M8 34l-2-20 9 8 9-12 9 12 9-8-2 20z" fill="${Y}" ${st()}/><rect x="8" y="34" width="32" height="6" rx="1" fill="${Y}" ${st()}/>
    <circle cx="24" cy="26" r="2.6" fill="${R}" ${st(1)}/><circle cx="15" cy="28" r="1.8" fill="${B}" ${st(1)}/><circle cx="33" cy="28" r="1.8" fill="${B}" ${st(1)}/>`,
  republic: `<g fill="${G}" ${st(1)}>${[0, 1, 2, 3, 4, 5].map((k) => `<ellipse cx="${13 - k * 0.6}" cy="${36 - k * 5}" rx="2.4" ry="4.4" transform="rotate(${-40 + k * 8} ${13 - k * 0.6} ${36 - k * 5})"/><ellipse cx="${35 + k * 0.6}" cy="${36 - k * 5}" rx="2.4" ry="4.4" transform="rotate(${40 - k * 8} ${35 + k * 0.6} ${36 - k * 5})"/>`).join("")}</g>
    <path d="M16 41c4-2 12-2 16 0" stroke="${R}" stroke-width="2.4" fill="none"/><text x="24" y="27" text-anchor="middle" font-family="Georgia, serif" font-size="8" font-weight="700" fill="${I}">SPQR</text>`,
  construction: `<path d="M6 40V18h36v22h-8V30a10 10 0 0 0-20 0v10z" fill="#d9c9a6" ${st()}/><path d="M6 18h36" ${st(2)}/>
    <path d="M21 18l1.5 5h3l1.5-5" fill="#bfae8a" ${st(1)}/><path d="M6 24h8M34 24h8M6 30h6M36 30h6" stroke="${D}" stroke-width="1"/>`,
  trade: `<path d="M8 32c0-6 4-10 8-10 2-6 6-8 9-4 3-4 7-2 8 4 4 0 6 4 6 8z" fill="${M}" ${st()}/>
    <path d="M39 30l4-10 3 1-1 4" fill="${M}" ${st(1.2)}/><path d="M12 32v10M17 32v10M30 32v10M35 32v10" ${st(2.2)}/>
    <path d="M18 20h12v6H18z" fill="${R}" ${st(1)}/>`,
  astronomy: `<ellipse cx="24" cy="24" rx="19" ry="9" fill="none" stroke="${B}" stroke-width="1.6" transform="rotate(-20 24 24)"/>
    <circle cx="24" cy="24" r="7" fill="${Y}" ${st()}/><g stroke="${Y}" stroke-width="1.6">${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<path d="M${(24 + 9 * Math.cos((k * Math.PI) / 4)).toFixed(1)} ${(24 + 9 * Math.sin((k * Math.PI) / 4)).toFixed(1)}l${(2.5 * Math.cos((k * Math.PI) / 4)).toFixed(1)} ${(2.5 * Math.sin((k * Math.PI) / 4)).toFixed(1)}"/>`).join("")}</g>
    <circle cx="41" cy="18" r="3.2" fill="${B}" ${st(1.2)}/>`,
  philosophy: `<path d="M12 40c-2-10 0-26 12-30 12 4 14 20 12 30z" fill="#9b7a52" ${st()}/><path d="M14 12l-2-5 6 3M34 12l2-5-6 3" fill="#9b7a52" ${st(1.2)}/>
    <circle cx="18.5" cy="20" r="5" fill="${L}" ${st(1.2)}/><circle cx="29.5" cy="20" r="5" fill="${L}" ${st(1.2)}/><circle cx="18.5" cy="20" r="2.2" fill="${I}"/><circle cx="29.5" cy="20" r="2.2" fill="${I}"/>
    <path d="M22 26l2 3 2-3z" fill="${Y}" ${st(1)}/><path d="M16 32c4 2 12 2 16 0M17 36c4 1.5 10 1.5 14 0" stroke="#6b5136" stroke-width="1.2" fill="none"/>`,
  bridgeBuilding: `<path d="M4 38c6 3 10-3 16 0s10 3 16 0 6-1 8 0v4H4z" fill="${B}"/><path d="M4 18h40v6H4z" fill="#cdbb9a" ${st()}/>
    <path d="M6 24v14h4a10 10 0 0 1 14-10 10 10 0 0 1 14 10h4V24" fill="#cdbb9a" ${st()}/><path d="M10 38a14 14 0 0 1 28 0" fill="none" stroke="${D}" stroke-width="1"/>`,
  engineering: `<g transform="translate(24 24)"><path d="${Array.from({ length: 10 }, (_, k) => {
    const a = (k * Math.PI) / 5;
    const p = (r: number, d: number) => `${(r * Math.cos(a + d)).toFixed(1)} ${(r * Math.sin(a + d)).toFixed(1)}`;
    return `${k === 0 ? "M" : "L"}${p(13, -0.16)}L${p(17, -0.12)}L${p(17, 0.12)}L${p(13, 0.16)}`;
  }).join("")}z" fill="${S}" ${st()}/><circle r="6" fill="${L}" ${st(1.2)}/><circle r="2.2" fill="${I}"/></g>`,
  feudalism: `<path d="M12 42V18h-3v-8h5v4h4v-4h4v4h4v-4h4v4h4v-4h5v8h-3v24z" fill="#b8ad98" ${st()}/>
    <path d="M20 42v-8a4 4 0 0 1 8 0v8" fill="${D}" ${st(1.2)}/><path d="M19 22h3v5h-3zM27 22h3v5h-3z" fill="${I}"/><path d="M24 10V3l7 2-7 2" fill="${R}" ${st(1)}/>`,
  chivalry: `<path d="M24 6l15 5v12c0 10-7 16-15 19C16 39 9 33 9 23V11z" fill="${R}" ${st()}/>
    <path d="M24 9v30M11 22h26" stroke="${Y}" stroke-width="4"/><path d="M24 6l15 5v12c0 10-7 16-15 19C16 39 9 33 9 23V11z" fill="none" ${st()}/>`,
  medicine: `<path d="M24 4v40" stroke="${D}" stroke-width="3.2"/><circle cx="24" cy="5" r="2.6" fill="${D}"/>
    <path d="M24 38c-8-2-8-7 0-9s8-7 0-9-8-6 0-8c4-1 6-3 5-5" fill="none" stroke="${G}" stroke-width="3"/><circle cx="29" cy="7" r="2" fill="${G}"/>`,
  university: `<path d="M4 20l20-9 20 9-20 9z" fill="#3b3a46" ${st()}/><path d="M12 24v9c4 4 20 4 24 0v-9l-12 5z" fill="#3b3a46" ${st()}/>
    <path d="M40 22v12" stroke="${Y}" stroke-width="1.6"/><path d="M38 34h4l-1 5h-2z" fill="${Y}" ${st(1)}/>`,
  banking: `<path d="M6 16l18-10 18 10z" fill="#d9cfb8" ${st()}/><rect x="8" y="16" width="32" height="3" fill="#d9cfb8" ${st(1.2)}/>
    <g fill="#ece4d0" ${st(1.2)}><rect x="10" y="20" width="4" height="16"/><rect x="18" y="20" width="4" height="16"/><rect x="26" y="20" width="4" height="16"/><rect x="34" y="20" width="4" height="16"/></g>
    <rect x="6" y="36" width="36" height="5" fill="#d9cfb8" ${st(1.2)}/><circle cx="24" cy="12" r="2.6" fill="${Y}" ${st(1)}/>`,
  navigation: `<circle cx="24" cy="24" r="18" fill="${L}" ${st()}/><circle cx="24" cy="24" r="14" fill="none" stroke="${D}" stroke-width="1"/>
    <path d="M24 6l4 18-4 18-4-18z" fill="${R}" ${st(1.2)}/><path d="M24 24l4 0-4 18-4-18z" fill="${S}" ${st(1.2)}/>
    <path d="M6 24l18-3 18 3-18 3z" fill="#d8c9a4" ${st(1)}/><circle cx="24" cy="24" r="2" fill="${Y}" ${st(1)}/>`,
  religion: `<path d="M8 42V22L24 6l16 16v20z" fill="#cfc4ae" ${st()}/><circle cx="24" cy="24" r="8" fill="${B}" ${st(1.4)}/>
    <g stroke="${Y}" stroke-width="1.2">${[0, 1, 2, 3, 4, 5].map((k) => `<path d="M24 24l${(8 * Math.cos((k * Math.PI) / 3)).toFixed(1)} ${(8 * Math.sin((k * Math.PI) / 3)).toFixed(1)}"/>`).join("")}</g>
    <circle cx="24" cy="24" r="2.4" fill="${R}"/><path d="M19 42v-6a5 5 0 0 1 10 0v6" fill="${D}" ${st(1.2)}/>`,
  physics: `<path d="M6 40h36L6 18z" fill="#d7c7a1" ${st()}/><circle cx="16" cy="19" r="5" fill="${S}" ${st(1.4)}/>
    <path d="M24 10l-6 4" stroke="${B}" stroke-width="1.4" stroke-dasharray="2 2"/><path d="M36 6v12" ${st(1.2)}/><circle cx="36" cy="20" r="3" fill="${Y}" ${st(1.2)}/><path d="M30 6h12" ${st(2)}/>`,
  invention: `<circle cx="24" cy="24" r="18" fill="${L}" ${st()}/><circle cx="24" cy="24" r="14" fill="none" stroke="${M}" stroke-width="3"/>
    <g fill="${I}">${Array.from({ length: 12 }, (_, k) => `<circle cx="${(24 + 14 * Math.cos((k * Math.PI) / 6)).toFixed(1)}" cy="${(24 + 14 * Math.sin((k * Math.PI) / 6)).toFixed(1)}" r="1"/>`).join("")}</g>
    <path d="M24 24V12M24 24l8 5" ${st(2.2)}/><circle cx="24" cy="24" r="2" fill="${Y}" ${st(1)}/><path d="M24 8l2 3h-4z" fill="${Y}"/>`,
  gunpowder: `<path d="M12 14c0-3 24-3 24 0v22c0 3-24 3-24 0z" fill="${M}" ${st()}/><ellipse cx="24" cy="14" rx="12" ry="3" fill="#3a2d22" ${st(1.2)}/>
    <path d="M12 20c6 2 18 2 24 0M12 30c6 2 18 2 24 0" stroke="#565a5e" stroke-width="2.4"/><path d="M28 12c4-4 6-6 10-6" ${st(1.4)} fill="none"/>
    <path d="M38 6l3-3m-3 3l4 1m-4-1l1 4" stroke="${Y}" stroke-width="1.8"/>`,
  theoryOfGravity: `<path d="M24 10c-6-4-14 2-12 12 2 10 8 14 12 12 4 2 10-2 12-12 2-10-6-16-12-12z" fill="${R}" ${st()}/>
    <path d="M24 10c0-3 1-5 3-6" stroke="${D}" stroke-width="2"/><path d="M26 6c3-2 7-1 8 1-3 2-6 1-8-1z" fill="${G}" ${st(1)}/>
    <path d="M24 38v6M20 40l4 4 4-4" ${st(1.8)} fill="none"/><path d="M16 16c1-2 3-3 5-3" stroke="${L}" stroke-width="1.6" fill="none"/>`,
  magnetism: `<path d="M10 8h9v18a5 5 0 0 0 10 0V8h9v18a14 14 0 0 1-28 0z" fill="${R}" ${st()}/>
    <path d="M10 8h9v6h-9zM29 8h9v6h-9z" fill="${S}" ${st(1.2)}/><path d="M8 4l3 3M40 4l-3 3M24 44v-3" stroke="${B}" stroke-width="1.6"/>`,
  steamEngine: `<circle cx="16" cy="30" r="10" fill="none" stroke="${I}" stroke-width="3"/><circle cx="16" cy="30" r="3" fill="${S}" ${st(1)}/>
    <path d="M16 30l8-8" ${st(2)}/><rect x="24" y="16" width="16" height="10" rx="2" fill="${S}" ${st()}/><path d="M22 21h4" ${st(2.4)}/>
    <path d="M34 14c-2-3 1-5 3-4 0-3 5-3 5 0 3 0 3 4 0 4" fill="${W}" ${st(1)}/><rect x="6" y="40" width="34" height="3" fill="${D}" ${st(1)}/>`,
  chemistry: `<path d="M19 6h10M20 6v12L9 38c-1 2 0 4 2 4h26c2 0 3-2 2-4L28 18V6" fill="${L}" ${st()}/>
    <path d="M14 30h20l4 8c1 2 0 3-2 3H12c-2 0-3-1-2-3z" fill="${G}"/><circle cx="22" cy="34" r="1.6" fill="${L}"/><circle cx="27" cy="31" r="1.2" fill="${L}"/>
    <path d="M20 6v12L9 38c-1 2 0 4 2 4h26c2 0 3-2 2-4L28 18V6" fill="none" ${st()}/>`,
  metallurgy: `<path d="M8 12h20l-2 12c-1 3-15 3-16 0z" fill="#5f6870" ${st()}/><path d="M28 14l8-4" ${st(2.4)}/>
    <path d="M12 22c1 6 2 10 2 14" stroke="#f08a2a" stroke-width="4" fill="none"/><path d="M12 22c1 6 2 10 2 14" stroke="${Y}" stroke-width="1.6" fill="none"/>
    <path d="M6 36h22l-2 6H8z" fill="#3a3f45" ${st()}/><ellipse cx="17" cy="37" rx="8" ry="1.6" fill="#f08a2a"/>`,
  democracy: `<rect x="8" y="22" width="32" height="20" rx="2" fill="${B}" ${st()}/><path d="M16 22h16" stroke="${I}" stroke-width="3"/>
    <path d="M18 24V8h12v16" fill="${W}" ${st(1.4)}/><path d="M21 13l2 3 4-6" stroke="${R}" stroke-width="2" fill="none"/>`,
  railroad: `<path d="M6 32V18h18v-6h6v6h4V12h6v20z" fill="#2f3439" ${st()}/><rect x="10" y="20" width="10" height="8" fill="${Y}" ${st(1)}/>
    <circle cx="13" cy="35" r="5" fill="${R}" ${st()}/><circle cx="27" cy="35" r="5" fill="${R}" ${st()}/><circle cx="37" cy="37" r="3" fill="${R}" ${st(1.2)}/>
    <path d="M40 32l5 7H34" fill="#2f3439" ${st(1.2)}/><path d="M33 10c-2-3 2-6 5-4 2-3 7 0 5 3" fill="${W}" ${st(1)}/><path d="M2 42h44" ${st(1.6)}/>`,
  conscription: `<ellipse cx="24" cy="18" rx="15" ry="5" fill="${L}" ${st()}/><path d="M9 18v16c0 3 30 3 30 0V18" fill="${R}" ${st()}/>
    <path d="M9 22l7 12 8-12 8 12 7-12" stroke="${Y}" stroke-width="1.6" fill="none"/><path d="M16 4l8 13M32 4l-8 13" stroke="${D}" stroke-width="2.4"/>
    <circle cx="16" cy="4" r="2" fill="${L}" ${st(1)}/><circle cx="32" cy="4" r="2" fill="${L}" ${st(1)}/>`,
  explosives: `<g fill="${R}" ${st(1.4)}><rect x="9" y="18" width="9" height="24" rx="2"/><rect x="19.5" y="16" width="9" height="26" rx="2"/><rect x="30" y="18" width="9" height="24" rx="2"/></g>
    <path d="M8 30h32" stroke="${D}" stroke-width="3"/><path d="M24 16c0-6 4-8 8-10" ${st(1.4)} fill="none"/>
    <path d="M32 6l4-3m-4 3l5 1m-5-1l1 5m-1-5l-4-2" stroke="${Y}" stroke-width="2"/>`,
  electricity: `<path d="M28 4L12 26h10l-4 18 18-24H26z" fill="${Y}" ${st()}/>`,
  atomicTheory: `<g fill="none" stroke="${B}" stroke-width="1.8"><ellipse cx="24" cy="24" rx="19" ry="7"/><ellipse cx="24" cy="24" rx="19" ry="7" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="19" ry="7" transform="rotate(-60 24 24)"/></g>
    <circle cx="24" cy="24" r="4.5" fill="${R}" ${st(1.2)}/><circle cx="43" cy="24" r="2" fill="${Y}" ${st(1)}/><circle cx="14.5" cy="7.5" r="2" fill="${Y}" ${st(1)}/><circle cx="14.5" cy="40.5" r="2" fill="${Y}" ${st(1)}/>`,
  industrialization: `<path d="M4 42V24l10 6v-6l10 6v-6l10 6V10h6v32z" fill="#8c5a44" ${st()}/><g fill="${Y}"><rect x="8" y="33" width="4" height="4"/><rect x="18" y="33" width="4" height="4"/><rect x="28" y="33" width="4" height="4"/></g>
    <path d="M36 9c-2-4 2-7 6-5 2-2 6 0 4 3" fill="#9aa0a6" ${st(1)}/>`,
  corporation: `<path d="M6 42h36" ${st(2)}/><g ${st(1.2)}><rect x="9" y="30" width="7" height="12" fill="${B}"/><rect x="20" y="23" width="7" height="19" fill="${B}"/><rect x="31" y="14" width="7" height="28" fill="${B}"/></g>
    <path d="M7 26l11-8 7 4 15-14" stroke="${G}" stroke-width="2.6" fill="none"/><path d="M33 7h8v8" stroke="${G}" stroke-width="2.6" fill="none"/>`,
  steel: `<path d="M8 10h32v6H28v16h12v6H8v-6h12V16H8z" fill="${S}" ${st()}/><path d="M10 12h28" stroke="${W}" stroke-width="1"/>`,
  refining: `<path d="M24 4L14 42h4l6-24 6 24h4z" fill="none" ${st(1.8)}/><path d="M17 30h14M19 22h10M21 14h6" ${st(1.4)}/>
    <path d="M36 26c0 0 6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" fill="#1d1a17" ${st(1.2)}/><path d="M34 37a2 2 0 0 0 2 2" stroke="${W}" stroke-width="1"/>`,
  electronics: `<path d="M16 36V18a8 8 0 0 1 16 0v18z" fill="#dfe8ee" fill-opacity="0.9" ${st()}/><rect x="14" y="36" width="20" height="5" fill="#2f3439" ${st(1.2)}/>
    <path d="M18 41v4M22 41v4M26 41v4M30 41v4" ${st(1.4)}/><path d="M20 30V20h8v10" fill="none" stroke="${R}" stroke-width="1.6"/><path d="M19 24h10" stroke="#f08a2a" stroke-width="1.6"/>`,
  communism: `<path d="M10 4v40" stroke="${D}" stroke-width="3"/><path d="M11 6c8-3 14 3 24 0v18c-10 3-16-3-24 0z" fill="${R}" ${st()}/>`,
  combustion: `<rect x="14" y="6" width="20" height="26" rx="2" fill="${S}" fill-opacity="0.5" ${st()}/><rect x="15" y="20" width="18" height="8" fill="#6f777e" ${st(1.2)}/>
    <path d="M24 28v14" ${st(2.6)}/><circle cx="24" cy="42" r="2.4" fill="${S}" ${st(1)}/><path d="M18 14l3-6 2 5 3-4 2 5" stroke="#f08a2a" stroke-width="1.8" fill="none"/>`,
  automobile: `<path d="M4 32v-6c0-2 2-3 4-3h6l4-8h14l6 8h4c2 0 3 1 3 3v6z" fill="${R}" ${st()}/><path d="M19 17h5v6h-9zM27 17h4l4 6h-8z" fill="#cfe2ee" ${st(1)}/>
    <circle cx="13" cy="33" r="5" fill="#2b2b2b" ${st(1.2)}/><circle cx="35" cy="33" r="5" fill="#2b2b2b" ${st(1.2)}/><circle cx="13" cy="33" r="2" fill="${S}"/><circle cx="35" cy="33" r="2" fill="${S}"/>`,
  flight: `<path d="M4 18h40M4 30h40" ${st(3.2)}/><path d="M10 18v12M38 18v12M18 18l-4 12M30 18l4 12" ${st(1.2)}/>
    <path d="M14 24h22l6-2v4l-6-1H14z" fill="${M}" ${st(1.2)}/><path d="M42 20v8" ${st(2.4)}/>`,
  advancedFlight: `<path d="M4 26l18-2 12-16h5l-6 16 9-1 4-5h3l-2 8 2 8h-3l-4-5-9-1 6 16h-5L22 28 4 26z" fill="#e7ecf0" ${st()}/><path d="M20 25h3M26 25h3" stroke="${B}" stroke-width="1.6"/>`,
  massProduction: `<rect x="4" y="30" width="40" height="6" rx="3" fill="#3a3f45" ${st(1.2)}/><g fill="${S}">${[9, 17, 25, 33, 41].map((x) => `<circle cx="${x - 2}" cy="33" r="1.6"/>`).join("")}</g>
    <g ${st(1.2)}><rect x="7" y="20" width="9" height="10" fill="${M}"/><rect x="20" y="20" width="9" height="10" fill="${M}"/><rect x="33" y="20" width="9" height="10" fill="${M}"/></g>
    <path d="M24 6v8l-3-3m3 3l3-3" ${st(1.8)} fill="none"/><path d="M4 42h40" ${st(1.4)}/>`,
  laborUnion: `<g ${st(1.2)}><circle cx="13" cy="16" r="5" fill="${M}"/><circle cx="35" cy="16" r="5" fill="${M}"/><circle cx="24" cy="12" r="5.5" fill="${M}"/>
    <path d="M5 40c0-10 4-16 8-16s8 6 8 16z" fill="${B}"/><path d="M27 40c0-10 4-16 8-16s8 6 8 16z" fill="${B}"/><path d="M14 40c0-12 4-20 10-20s10 8 10 20z" fill="${R}"/></g>`,
  geneticEngineering: `<g fill="none" stroke-width="2.6"><path d="M16 4c0 10 16 10 16 20s-16 10-16 20" stroke="${B}"/><path d="M32 4c0 10-16 10-16 20s16 10 16 20" stroke="${R}"/></g>
    <g stroke="${I}" stroke-width="1.4">${[8, 14, 34, 40].map((y) => `<path d="M${y < 24 ? 18 + (y - 8) * 0.3 : 18} ${y}h${12 - (y < 24 ? (y - 8) * 0.6 : 0)}"/>`).join("")}<path d="M21 20h6M21 28h6"/></g>`,
  computers: `<rect x="6" y="8" width="36" height="24" rx="2" fill="#2f3439" ${st()}/><rect x="9" y="11" width="30" height="18" fill="#3c6f4f"/>
    <path d="M12 16h10M12 20h16M12 24h8" stroke="#a6f0b8" stroke-width="1.6"/><path d="M20 32l-2 6h12l-2-6" fill="#8b9197" ${st(1.2)}/><rect x="12" y="38" width="24" height="4" rx="1" fill="#c8ccd0" ${st(1.2)}/>`,
  rocketry: `<path d="M24 4c6 6 8 14 8 24h-16c0-10 2-18 8-24z" fill="#e7ecf0" ${st()}/><path d="M16 22l-6 10 6-2zM32 22l6 10-6-2z" fill="${R}" ${st(1.2)}/>
    <circle cx="24" cy="17" r="3" fill="${B}" ${st(1.2)}/><path d="M19 28h10l-2 6h-6z" fill="#5f6870" ${st(1.2)}/><path d="M21 34c-1 4 0 8 3 10 3-2 4-6 3-10z" fill="#f08a2a"/><path d="M23 34c0 3 0 5 1 7 1-2 1-4 1-7z" fill="${Y}"/>`,
  nuclearFission: `<circle cx="15" cy="26" r="8" fill="${G}" ${st()}/><circle cx="33" cy="26" r="8" fill="${G}" ${st()}/>
    <circle cx="24" cy="8" r="3" fill="${B}" ${st(1.2)}/><path d="M24 12v6" ${st(1.4)}/><path d="M10 38l-4 6M38 38l4 6M24 36v8" stroke="${Y}" stroke-width="2"/>
    <path d="M21 22l6 8M27 22l-6 8" stroke="${Y}" stroke-width="2.2"/>`,
  spaceFlight: `<circle cx="24" cy="24" r="10" fill="#c9ccd0" ${st()}/><path d="M17 20a8 8 0 0 1 8-6" stroke="${W}" stroke-width="2" fill="none"/>
    <path d="M30 31l12 12M32 29l14 8M27 33l8 13M29 32l6 4" ${st(1.4)}/><path d="M4 12c6-6 16-8 24-6" stroke="${B}" stroke-width="1.4" stroke-dasharray="2 2" fill="none"/>`,
  plastics: `<path d="M20 4h8v5l4 5v26c0 2-1 3-3 3H19c-2 0-3-1-3-3V14l4-5z" fill="#9fd3e6" fill-opacity="0.85" ${st()}/><rect x="19" y="2" width="10" height="4" rx="1" fill="${B}" ${st(1.2)}/>
    <rect x="16" y="20" width="16" height="10" fill="${R}"/><path d="M16 20h16M16 30h16" ${st(1)}/><path d="M19 34v6" stroke="${W}" stroke-width="1.6"/>`,
  robotics: `<rect x="10" y="12" width="28" height="22" rx="4" fill="${S}" ${st()}/><path d="M24 12V6" ${st(1.6)}/><circle cx="24" cy="5" r="2.2" fill="${R}" ${st(1)}/>
    <circle cx="18" cy="21" r="4" fill="${Y}" ${st(1.2)}/><circle cx="30" cy="21" r="4" fill="${Y}" ${st(1.2)}/><rect x="16" y="28" width="16" height="3" fill="#3a3f45"/>
    <path d="M10 22H6M42 22h-4" ${st(2.4)}/><rect x="16" y="34" width="16" height="8" fill="#8b9197" ${st(1.2)}/>`,
  superconductor: `<ellipse cx="24" cy="38" rx="17" ry="5" fill="#6f777e" ${st()}/><ellipse cx="24" cy="36" rx="17" ry="5" fill="#c3e6f5" ${st()}/>
    <path d="M24 4l10 6-10 6-10-6z" fill="${S}" ${st(1.2)}/><path d="M14 10v8l10 6 10-6v-8l-10 6z" fill="#7f8890" ${st(1.2)}/>
    <path d="M10 30c4-3 24-3 28 0" stroke="${B}" stroke-width="1.4" stroke-dasharray="2 2" fill="none"/>`,
  nuclearPower: `<path d="M8 42c4-8 4-20 0-30h22c-4 10-4 22 0 30z" fill="#d6d2c8" ${st()}/><path d="M9 18h20" stroke="#a8a297" stroke-width="2"/>
    <path d="M12 10c-2-4 3-7 6-5 2-3 8-2 8 2 4-1 6 3 3 5z" fill="${W}" ${st(1)}/><path d="M32 42V28h10v14z" fill="#b8ad98" ${st(1.2)}/><path d="M36 28v-6" ${st(2.4)}/>`,
  recycling: `<g fill="none" stroke="${G}" stroke-width="4.5"><path d="M17 12a14 14 0 0 1 14 0"/><path d="M38 22a14 14 0 0 1-7 12"/><path d="M17 34a14 14 0 0 1-7-12"/></g>
    <g fill="${G}"><path d="M31 6l6 7-9 1z"/><path d="M33 38l-9 3 3-8z"/><path d="M6 20l3-9 5 8z"/></g>`,
  fusionPower: `<circle cx="24" cy="24" r="9" fill="${Y}" ${st()}/><circle cx="24" cy="24" r="5" fill="#f08a2a"/>
    <ellipse cx="24" cy="24" rx="19" ry="8" fill="none" stroke="#c05ad8" stroke-width="3"/><ellipse cx="24" cy="24" rx="19" ry="8" fill="none" stroke="${W}" stroke-width="1" stroke-dasharray="3 3"/>
    <path d="M24 24" ${st(1)}/>`,
};

/** Medallion colours per era, from bronze to steel blue. */
export const ERA_COLORS = ["#999", "#c8a46a", "#b9c48d", "#9fb6c9", "#c7a1b8", "#9fd0c6"];

export function techIconSvg(tech: TechId, era: number, size = 48): string {
  const c = ERA_COLORS[era] ?? "#ccc";
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">
    <defs><radialGradient id="m${tech}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fffaf0"/><stop offset="0.55" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0.75"/></radialGradient></defs>
    <circle cx="24" cy="24" r="23" fill="url(#m${tech})" stroke="rgba(40,30,20,.55)" stroke-width="1"/>
    <g transform="translate(5.5 5.5) scale(0.77)">${TECH_ICONS[tech]}</g></svg>`;
}
