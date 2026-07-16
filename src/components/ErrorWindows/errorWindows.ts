// Client-side behaviour for the <ErrorWindows> component:
//   1. an animated "liquid blobs" background rendered on a canvas with
//      Bayer 8x8 ordered dithering, and
//   2. draggable error windows that come to the front when touched.
//
// Kept out of the .astro file so the markup stays readable. Every setup
// function returns a cleanup callback.

const GREEN: [number, number, number] = [0, 200, 0]; // matches --color-secondary
const BG: [number, number, number] = [255, 255, 255];

/** css px per dithered "pixel" — larger = chunkier and cheaper to draw. */
const CELL = 2;
/** Global slow-down factor for the blob motion. */
const SLOW = 0.35;

// 8x8 Bayer ordered-dither matrix, normalized to 0..1.
const BAYER8 = [
  [0, 48, 12, 60, 3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8, 56, 4, 52, 11, 59, 7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2, 50, 14, 62, 1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6, 54, 9, 57, 5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21],
].map((row) => row.map((v) => (v + 0.5) / 64));

interface Blob {
  bx: number; by: number; // base position (0–1)
  ax: number; ay: number; // wander amplitude
  fx: number; fy: number; // wander frequency
  ph: number;             // phase offset
  r: number; ra: number; fr: number; // radius, radius amplitude, radius frequency
  mixFr: number; mixPh: number;       // green<->white colour mix
}

const BLOBS: Blob[] = [
  { bx: 0.28, by: 0.26, ax: 0.16, ay: 0.14, fx: 0.00011 * SLOW, fy: 0.00014 * SLOW, ph: 0.0, r: 0.32, ra: 0.08, fr: 0.00019 * SLOW, mixFr: 0.00006, mixPh: 0.5 },
  { bx: 0.76, by: 0.16, ax: 0.12, ay: 0.16, fx: 0.00016 * SLOW, fy: 0.0001 * SLOW, ph: 1.7, r: 0.24, ra: 0.06, fr: 0.00023 * SLOW, mixFr: 0.00005, mixPh: 2.8 },
  { bx: 0.58, by: 0.55, ax: 0.15, ay: 0.15, fx: 0.00013 * SLOW, fy: 0.00017 * SLOW, ph: 3.1, r: 0.34, ra: 0.08, fr: 0.00015 * SLOW, mixFr: 0.00004, mixPh: 4.6 },
  { bx: 0.12, by: 0.78, ax: 0.11, ay: 0.11, fx: 0.00021 * SLOW, fy: 0.00012 * SLOW, ph: 4.4, r: 0.22, ra: 0.05, fr: 0.00027 * SLOW, mixFr: 0.00007, mixPh: 1.2 },
  { bx: 0.85, by: 0.86, ax: 0.1, ay: 0.1, fx: 0.00014 * SLOW, fy: 0.00019 * SLOW, ph: 5.9, r: 0.2, ra: 0.05, fr: 0.00017 * SLOW, mixFr: 0.000055, mixPh: 3.4 },
  { bx: 0.42, by: 0.9, ax: 0.12, ay: 0.1, fx: 0.00018 * SLOW, fy: 0.00015 * SLOW, ph: 2.2, r: 0.19, ra: 0.05, fr: 0.00021 * SLOW, mixFr: 0.00006, mixPh: 6.0 },
];

const lerp3 = (a: number[], b: number[], t: number): number[] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export interface BlobField {
  /** Start the animation loop (idempotent). */
  play: () => void;
  /** Pause the animation loop to save CPU while off-screen. */
  pause: () => void;
  /** Tear everything down. */
  destroy: () => void;
}

/** Render the animated dithered blob field onto `canvas`, sized to `stage`. */
export function createBlobField(canvas: HTMLCanvasElement, stage: HTMLElement): BlobField {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { play() {}, pause() {}, destroy() {} };

  let w = 0;
  let h = 0;
  const resize = () => {
    const rect = stage.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width / CELL));
    h = Math.max(1, Math.round(rect.height / CELL));
    canvas.width = w;
    canvas.height = h;
  };
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  let raf: number | null = null;
  let lastDrawTime = -1000;

  const draw = (t: number) => {
    // Throttle to ~25fps; the dithered look doesn't need more.
    if (t - lastDrawTime < 40) {
      raf = requestAnimationFrame(draw);
      return;
    }
    lastDrawTime = t;

    const img = ctx.createImageData(w, h);
    const data = img.data;
    const minDim = Math.min(w, h);

    const centers = BLOBS.map((b) => {
      const mix = (Math.sin(t * b.mixFr + b.mixPh) + 1) / 2; // 0 = green core, 1 = white
      return {
        cx: (b.bx + Math.sin(t * b.fx + b.ph) * b.ax) * w,
        cy: (b.by + Math.cos(t * b.fy + b.ph * 1.3) * b.ay) * h,
        r: (b.r + Math.sin(t * b.fr + b.ph) * b.ra) * minDim,
        color: lerp3(GREEN, BG, mix),
      };
    });

    for (let y = 0; y < h; y++) {
      const bayerRow = BAYER8[y % 8];
      for (let x = 0; x < w; x++) {
        let field = 0, cr = 0, cg = 0, cb = 0;
        for (let i = 0; i < centers.length; i++) {
          const c = centers[i];
          const dx = x - c.cx;
          const dy = y - c.cy;
          const d2 = dx * dx + dy * dy;
          const sigma = c.r * 0.5;
          const contrib = Math.exp(-d2 / (2 * sigma * sigma));
          field += contrib;
          cr += contrib * c.color[0];
          cg += contrib * c.color[1];
          cb += contrib * c.color[2];
        }
        const v = field < 0.008 ? 0 : 1 - Math.exp(-field * 1.7);
        const idx = (y * w + x) * 4;
        let r: number, g: number, b2: number;
        if (v < 0.02) {
          r = BG[0]; g = BG[1]; b2 = BG[2];
        } else {
          const blend = [cr / field, cg / field, cb / field];
          if (v > 0.94) {
            r = blend[0]; g = blend[1]; b2 = blend[2];
          } else {
            const on = v > bayerRow[x % 8];
            r = on ? blend[0] : BG[0];
            g = on ? blend[1] : BG[1];
            b2 = on ? blend[2] : BG[2];
          }
        }
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b2;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    raf = requestAnimationFrame(draw);
  };

  return {
    play() {
      if (raf === null) raf = requestAnimationFrame(draw);
    },
    pause() {
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    },
    destroy() {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      ro.disconnect();
    },
  };
}

/**
 * Make every `.window` inside `stage` draggable by its `.window__bar`, and
 * bring a window to the front whenever it is touched. Returns a cleanup fn.
 */
export function initDraggableWindows(stage: HTMLElement): () => void {
  const windows = Array.from(stage.querySelectorAll<HTMLElement>(".window"));
  let zTop = windows.length;
  const cleanups: Array<() => void> = [];

  for (const win of windows) {
    const bar = win.querySelector<HTMLElement>(".window__bar");

    const bringToFront = () => {
      zTop += 1;
      win.style.zIndex = String(zTop);
    };

    // Touching anywhere on the window raises it.
    win.addEventListener("pointerdown", bringToFront);
    cleanups.push(() => win.removeEventListener("pointerdown", bringToFront));

    if (!bar) continue;

    let dragging = false;
    let startX = 0, startY = 0, origLeft = 0, origTop = 0, maxLeft = 0, maxTop = 0;

    const onDown = (ev: PointerEvent) => {
      bringToFront();
      const winRect = win.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      // Switch from the percentage layout to absolute px so dragging is stable.
      origLeft = winRect.left - stageRect.left;
      origTop = winRect.top - stageRect.top;
      maxLeft = Math.max(0, stageRect.width - winRect.width);
      maxTop = Math.max(0, stageRect.height - winRect.height);
      win.style.left = `${origLeft}px`;
      win.style.top = `${origTop}px`;
      win.style.right = "auto";
      win.style.bottom = "auto";
      startX = ev.clientX;
      startY = ev.clientY;
      dragging = true;
      try { bar.setPointerCapture(ev.pointerId); } catch {}
      ev.preventDefault();
    };

    const onMove = (ev: PointerEvent) => {
      if (!dragging) return;
      const newLeft = Math.max(0, Math.min(maxLeft, origLeft + (ev.clientX - startX)));
      const newTop = Math.max(0, Math.min(maxTop, origTop + (ev.clientY - startY)));
      win.style.left = `${newLeft}px`;
      win.style.top = `${newTop}px`;
    };

    const onUp = (ev: PointerEvent) => {
      dragging = false;
      try { bar.releasePointerCapture(ev.pointerId); } catch {}
    };

    bar.addEventListener("pointerdown", onDown);
    bar.addEventListener("pointermove", onMove);
    bar.addEventListener("pointerup", onUp);
    bar.addEventListener("pointercancel", onUp);
    cleanups.push(() => {
      bar.removeEventListener("pointerdown", onDown);
      bar.removeEventListener("pointermove", onMove);
      bar.removeEventListener("pointerup", onUp);
      bar.removeEventListener("pointercancel", onUp);
    });
  }

  return () => cleanups.forEach((fn) => fn());
}
