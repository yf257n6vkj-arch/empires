import { describe, expect, it } from "vitest";
import {
  DEFAULT_CAMERA,
  MAX_ZOOM,
  centerOn,
  clampCamera,
  isVisible,
  keepInView,
  panBy,
  screenToTile,
  zoomAt,
} from "../src/web/camera";

const map = { width: 40, height: 28 };

describe("camera", () => {
  it("shows the whole map at zoom 1 and cannot be moved", () => {
    expect(panBy(DEFAULT_CAMERA, 5, 5, map)).toEqual(DEFAULT_CAMERA);
  });

  it("keeps zoom in range and the view inside the map", () => {
    expect(clampCamera({ zoom: 10, x: 100, y: -4 }, map)).toEqual({
      zoom: MAX_ZOOM,
      x: 40 - 40 / MAX_ZOOM,
      y: 0,
    });
    expect(clampCamera({ zoom: 0.2, x: 3, y: 3 }, map)).toEqual(DEFAULT_CAMERA);
  });

  it("keeps the tile under the anchor in place when zooming", () => {
    const anchor = { x: 30, y: 7 };
    const before = screenToTile(DEFAULT_CAMERA, anchor.x * 25, anchor.y * 25, 25);
    const cam = zoomAt(DEFAULT_CAMERA, 2, anchor.x, anchor.y, map);
    expect(cam.zoom).toBe(2);
    expect(screenToTile(cam, anchor.x * 25, anchor.y * 25, 25)).toEqual(before);
  });

  it("converts screen pixels to tiles with zoom and offset", () => {
    const cam = { zoom: 2, x: 10, y: 4 };
    // One tile is 50 px at zoom 2 when the base tile is 25 px.
    expect(screenToTile(cam, 0, 0, 25)).toEqual({ x: 10, y: 4 });
    expect(screenToTile(cam, 49, 99, 25)).toEqual({ x: 10, y: 5 });
    expect(screenToTile(cam, 50, 100, 25)).toEqual({ x: 11, y: 6 });
  });

  it("centres on a tile but stops at the map edge", () => {
    const cam = { zoom: 2, x: 0, y: 0 };
    expect(centerOn(cam, { x: 20, y: 14 }, map)).toEqual({ zoom: 2, x: 10.5, y: 7.5 });
    expect(centerOn(cam, { x: 39, y: 27 }, map)).toEqual({ zoom: 2, x: 20, y: 14 });
  });

  it("moves the view only when the tile is near or past the edge", () => {
    const cam = { zoom: 2, x: 10, y: 5 };
    expect(isVisible(cam, { x: 15, y: 10 }, map)).toBe(true);
    expect(keepInView(cam, { x: 15, y: 10 }, map)).toBe(cam);
    expect(isVisible(cam, { x: 10, y: 10 }, map)).toBe(false);
    expect(keepInView(cam, { x: 35, y: 20 }, map)).toEqual(centerOn(cam, { x: 35, y: 20 }, map));
  });
});
