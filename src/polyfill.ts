// Polyfill for CanvasRenderingContext2D.roundRect.
// iOS < 16 does not implement it, so every call throws and the character and
// scene textures cannot be built. Imported first in main.ts so the prototype
// is patched before any other module runs.

if (
  typeof CanvasRenderingContext2D !== 'undefined' &&
  !CanvasRenderingContext2D.prototype.roundRect
) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    this: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radii: unknown = 0,
  ): void {
    if (!(w > 0) || !(h > 0)) return;
    const max = Math.min(w, h) / 2;
    const list: unknown[] = Array.isArray(radii) ? radii : [radii];
    const r = list.slice(0, 4).map((v) => (typeof v === 'number' && v > 0 ? Math.min(v, max) : 0));
    // CSS shorthand order: TL, TR, BR, BL; missing values repeat.
    const tl = r[0] ?? 0;
    const tr = r[1] ?? tl;
    const br = r[2] ?? tl;
    const bl = r[3] ?? tr;

    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.arcTo(x + w, y, x + w, y + tr, tr);
    this.lineTo(x + w, y + h - br);
    this.arcTo(x + w, y + h, x + w - br, y + h, br);
    this.lineTo(x + bl, y + h);
    this.arcTo(x, y + h, x, y + h - bl, bl);
    this.lineTo(x, y + tl);
    this.arcTo(x, y, x + tl, y, tl);
    this.closePath();
  };
}
