/**
 * Map camera: which part of the map the canvas shows. Pure functions without
 * DOM access, so they can be unit tested.
 *
 * The canvas always has the size of the whole map at zoom 1. At zoom z it
 * shows width / z × height / z tiles, starting at the tile coordinates (x, y).
 */
export interface Camera {
  zoom: number;
  /** Left edge of the view, in tiles (may be fractional). */
  x: number;
  /** Top edge of the view, in tiles (may be fractional). */
  y: number;
}

export interface MapSize {
  width: number;
  height: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;
/** Zoom change for one press of + or −. */
export const ZOOM_STEP = 1.5;

export const DEFAULT_CAMERA: Camera = { zoom: 1, x: 0, y: 0 };

/** Keeps the zoom in range and the view inside the map. */
export function clampCamera(cam: Camera, map: MapSize): Camera {
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cam.zoom));
  const maxX = map.width - map.width / zoom;
  const maxY = map.height - map.height / zoom;
  return {
    zoom,
    x: Math.max(0, Math.min(maxX, cam.x)),
    y: Math.max(0, Math.min(maxY, cam.y)),
  };
}

/**
 * Changes the zoom so that the map point under the anchor stays where it is.
 * The anchor is given in tiles of the unzoomed view (0..width, 0..height).
 */
export function zoomAt(cam: Camera, zoom: number, anchorX: number, anchorY: number, map: MapSize): Camera {
  const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
  const mapX = cam.x + anchorX / cam.zoom;
  const mapY = cam.y + anchorY / cam.zoom;
  return clampCamera({ zoom: z, x: mapX - anchorX / z, y: mapY - anchorY / z }, map);
}

/** Moves the view by a number of map tiles. */
export function panBy(cam: Camera, dx: number, dy: number, map: MapSize): Camera {
  return clampCamera({ zoom: cam.zoom, x: cam.x + dx, y: cam.y + dy }, map);
}

/** Map tile shown at a canvas position given in CSS pixels; `tilePx` is the tile size at zoom 1. */
export function screenToTile(cam: Camera, px: number, py: number, tilePx: number): { x: number; y: number } {
  return {
    x: Math.floor(cam.x + px / (tilePx * cam.zoom)),
    y: Math.floor(cam.y + py / (tilePx * cam.zoom)),
  };
}

/** Centres the view on a tile, as far as the map edges allow. */
export function centerOn(cam: Camera, p: { x: number; y: number }, map: MapSize): Camera {
  const w = map.width / cam.zoom;
  const h = map.height / cam.zoom;
  return clampCamera({ zoom: cam.zoom, x: p.x + 0.5 - w / 2, y: p.y + 0.5 - h / 2 }, map);
}

/** True when the tile and `margin` tiles around it are fully in view. */
export function isVisible(cam: Camera, p: { x: number; y: number }, map: MapSize, margin = 1): boolean {
  const w = map.width / cam.zoom;
  const h = map.height / cam.zoom;
  const left = Math.max(0, p.x - margin);
  const top = Math.max(0, p.y - margin);
  const right = Math.min(map.width, p.x + 1 + margin);
  const bottom = Math.min(map.height, p.y + 1 + margin);
  return left >= cam.x - 1e-9 && top >= cam.y - 1e-9 && right <= cam.x + w + 1e-9 && bottom <= cam.y + h + 1e-9;
}

/** Centres on the tile only if it is not comfortably in view already. */
export function keepInView(cam: Camera, p: { x: number; y: number }, map: MapSize): Camera {
  return isVisible(cam, p, map) ? cam : centerOn(cam, p, map);
}
