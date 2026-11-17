/**
 * Small flags for the language picker, drawn as SVG: the flag of the country
 * where the language comes from (the British one for English).
 */

export function flagSvg(language: string, w: number, h: number): string {
  const open = `<svg class="flag" width="${w}" height="${h}" viewBox="0 0 60 40" aria-hidden="true" preserveAspectRatio="none">`;
  if (language === "cs") {
    return `${open}<rect width="60" height="20" fill="#fff"/><rect y="20" width="60" height="20" fill="#d7141a"/><path d="M0 0 L30 20 L0 40 Z" fill="#11457e"/></svg>`;
  }
  if (language === "en") {
    return (
      `${open}<clipPath id="uk-clip"><rect width="60" height="40"/></clipPath><g clip-path="url(#uk-clip)">` +
      `<rect width="60" height="40" fill="#012169"/>` +
      `<path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" stroke-width="8"/>` +
      `<path d="M0 0 L60 40 M60 0 L0 40" stroke="#c8102e" stroke-width="2.6"/>` +
      `<path d="M30 0 V40 M0 20 H60" stroke="#fff" stroke-width="12"/>` +
      `<path d="M30 0 V40 M0 20 H60" stroke="#c8102e" stroke-width="7"/></g></svg>`
    );
  }
  if (language === "sk") {
    return (
      `${open}<rect width="60" height="40" fill="#ee1c25"/><rect width="60" height="26.7" fill="#0b4ea2"/><rect width="60" height="13.3" fill="#fff"/>` +
      // The coat of arms, simplified: a red shield with a white double cross on blue hills.
      `<path d="M13 9 H31 V22 Q31 30 22 33 Q13 30 13 22 Z" fill="#fff"/>` +
      `<path d="M14.2 10.2 H29.8 V22 Q29.8 28.8 22 31.6 Q14.2 28.8 14.2 22 Z" fill="#ee1c25"/>` +
      `<path d="M21 12 h2 v15 h-2 Z M17.5 15 h9 v1.8 h-9 Z M16.5 19 h11 v1.8 h-11 Z" fill="#fff"/>` +
      `<path d="M14.6 25 Q18 22.5 22 25 Q26 22.5 29.4 25 Q28 29.5 22 31.4 Q16 29.5 14.6 25 Z" fill="#0b4ea2"/></svg>`
    );
  }
  if (language === "de") {
    return `${open}<rect width="60" height="13.4" fill="#000"/><rect y="13.3" width="60" height="13.4" fill="#dd0000"/><rect y="26.6" width="60" height="13.4" fill="#ffce00"/></svg>`;
  }
  if (language === "fr") {
    return `${open}<rect width="20" height="40" fill="#002654"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ce1126"/></svg>`;
  }
  return `${open}<rect width="60" height="40" fill="#777"/></svg>`;
}
