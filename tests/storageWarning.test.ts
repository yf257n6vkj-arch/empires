import { describe, expect, it } from "vitest";
import { savesVanishOnQuit } from "../src/web/storageWarning";

const SAFARI_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15";
const CHROME_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const EDGE_WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0";
const FIREFOX_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0";
const CHROME_IPAD = "Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1";

describe("warning about saves in a frame", () => {
  it("warns in Safari inside a frame", () => {
    expect(savesVanishOnQuit(SAFARI_MAC, true)).toBe(true);
  });

  it("warns for every browser on iPad, since they all use WebKit", () => {
    expect(savesVanishOnQuit(CHROME_IPAD, true)).toBe(true);
  });

  it("does not warn in Chrome, Edge or Firefox", () => {
    for (const ua of [CHROME_MAC, EDGE_WIN, FIREFOX_MAC]) expect(savesVanishOnQuit(ua, true)).toBe(false);
  });

  it("does not warn when the game has its own tab", () => {
    expect(savesVanishOnQuit(SAFARI_MAC, false)).toBe(false);
  });
});
