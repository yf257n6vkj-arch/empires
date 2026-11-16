/**
 * Small fills for older Safari, which the game must run in on a Mac.
 * Safari learned canvas roundRect only in version 16.
 */
const proto = typeof CanvasRenderingContext2D === "undefined" ? null : CanvasRenderingContext2D.prototype;
if (proto && !("roundRect" in proto)) {
  Object.defineProperty(proto, "roundRect", {
    configurable: true,
    writable: true,
    value: function (this: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[] = 0) {
      const radius = Math.max(0, Math.min(Array.isArray(r) ? (r[0] ?? 0) : r, Math.abs(w) / 2, Math.abs(h) / 2));
      this.moveTo(x + radius, y);
      this.arcTo(x + w, y, x + w, y + h, radius);
      this.arcTo(x + w, y + h, x, y + h, radius);
      this.arcTo(x, y + h, x, y, radius);
      this.arcTo(x, y, x + w, y, radius);
      this.closePath();
    },
  });
}
export {};
