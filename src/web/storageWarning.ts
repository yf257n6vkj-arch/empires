/**
 * Safari (and every browser on iPhone and iPad, which all use WebKit) keeps the
 * storage of a page shown in a frame of another site only until the browser quits.
 * On itch.io the game runs in such a frame, so its saves would vanish. The start
 * screen then offers to open the game in its own tab, where the storage lasts.
 */
export function savesVanishOnQuit(userAgent: string, framed: boolean): boolean {
  if (!framed) return false;
  const ios = /iPhone|iPad|iPod/.test(userAgent);
  const safari = /Safari\//.test(userAgent) && !/Chrome\/|Chromium\/|Edg\/|Firefox\/|OPR\//.test(userAgent);
  return ios || safari;
}

/** True when the page runs inside a frame of another page. */
export function isFramed(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // A cross-origin parent throws on access, which also means a frame.
    return true;
  }
}
