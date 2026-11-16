/**
 * Small flags for the language picker, drawn as SVG. Czech has the Czech flag,
 * English the British one.
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
  return `${open}<rect width="60" height="40" fill="#777"/></svg>`;
}
