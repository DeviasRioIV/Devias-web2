// Client-side behaviour for the <ErrorWindows> component:
//   1. an animated "liquid blobs" background rendered on a canvas with
//      Bayer 8x8 ordered dithering, and
//   2. draggable error windows that come to the front when touched.
//
// Kept out of the .astro file so the markup stays readable. Every setup
// function returns a cleanup callback.
//
// --- Notas de rendimiento (importante si tocas `render`) --------------------
// La version original hacia, por pixel: una `Math.exp()` por blob (6), otra
// `Math.exp()` para la curva de cobertura y ademas alocaba dos arrays
// (`lerp3` y `blend`). A 1440x900 con cell=2 eso es ~2.3M de `Math.exp()` y
// ~324k allocations por frame. Safari/JSC es especialmente lento en ambas
// cosas, asi que el frame bloqueaba el hilo principal y el scroll se trababa.
//
// Ahora se usan tres trucos que dejan el loop interno en puras multiplicaciones:
//   1. La gaussiana es separable: exp(-(dx^2+dy^2)/2s^2) = exp(-dx^2/2s^2) *
//      exp(-dy^2/2s^2). Se precalculan dos LUT por blob (una de w entradas y
//      otra de h) por frame, asi las `exp` pasan de w*h*blobs a (w+h)*blobs.
//   2. La curva de cobertura (1 - exp(-field*1.7)) y la paleta verde->blanco
//      salen de tablas precalculadas una sola vez al cargar el modulo.
//   3. Los pixeles se escriben como enteros de 32 bits sobre la misma memoria
//      del ImageData, en vez de cuatro escrituras de byte.
// Ademas cada blob conoce su radio util, asi que las filas/columnas donde no
// aporta nada se rellenan de fondo con `fill()` sin recorrerlas.

const GREEN: [number, number, number] = [0, 200, 0]; // matches --color-secondary
const BG: [number, number, number] = [255, 255, 255];

/** css px per dithered "pixel" — larger = chunkier and cheaper to draw. */
const CELL = 2;
const CELL_SAFARI = 3;
/**
 * Techo de pixeles del buffer. En pantallas anchas (ultrawide, 5K) el canvas
 * crecia sin limite; ahora se agranda la celda hasta entrar en el presupuesto.
 */
const MAX_PIXELS = 260_000;
/** Global slow-down factor for the blob motion. */
const SLOW = 0.35;
const FRAME_MS_DEFAULT = 33; // ~30 fps
const FRAME_MS_SAFARI = 45; // ~22 fps

/**
 * Por debajo de esto la contribucion de un blob se descarta. Verificado contra
 * el render exacto: con 0.0005 la diferencia queda en ~0.02% de los pixeles
 * (puntos sueltos del dither mas tenue) y ningun canal se corre mas de 8/255.
 */
const CUT = 0.0005;
const LN_CUT = -Math.log(CUT);

// 8x8 Bayer ordered-dither matrix, normalized to 0..1. Plana para poder
// indexarla con ((y & 7) << 3) | (x & 7) sin pasar por un array de arrays.
const BAYER8 = new Float32Array(
  [
    0, 48, 12, 60, 3, 51, 15, 63,
    32, 16, 44, 28, 35, 19, 47, 31,
    8, 56, 4, 52, 11, 59, 7, 55,
    40, 24, 36, 20, 43, 27, 39, 23,
    2, 50, 14, 62, 1, 49, 13, 61,
    34, 18, 46, 30, 33, 17, 45, 29,
    10, 58, 6, 54, 9, 57, 5, 53,
    42, 26, 38, 22, 41, 25, 37, 21,
  ].map((v) => (v + 0.5) / 64),
);

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

const N_BLOBS = BLOBS.length;

// --- Tablas precalculadas ---------------------------------------------------

const LITTLE_ENDIAN = (() => {
  const buf = new ArrayBuffer(4);
  new Uint32Array(buf)[0] = 0x11223344;
  return new Uint8Array(buf)[0] === 0x44;
})();

/** Empaqueta un color opaco en el entero de 32 bits que espera el ImageData. */
const pack = (r: number, g: number, b: number): number =>
  LITTLE_ENDIAN
    ? ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
    : ((r << 24) | (g << 16) | (b << 8) | 255) >>> 0;

/**
 * Rampa verde -> blanco. Todos los blobs mezclan sobre este mismo eje, asi que
 * el color final de un pixel siempre cae en la rampa: alcanza con un indice en
 * lugar de tres interpolaciones y una division por canal.
 */
const MIX_STEPS = 256;
const PALETTE = new Uint32Array(MIX_STEPS);
for (let i = 0; i < MIX_STEPS; i++) {
  const t = i / (MIX_STEPS - 1);
  PALETTE[i] = pack(
    Math.round(GREEN[0] + (BG[0] - GREEN[0]) * t),
    Math.round(GREEN[1] + (BG[1] - GREEN[1]) * t),
    Math.round(GREEN[2] + (BG[2] - GREEN[2]) * t),
  );
}
const BG_PACKED = pack(BG[0], BG[1], BG[2]);

/** Curva de cobertura: field -> v = 1 - exp(-field * 1.7). */
const FIELD_MAX = 6;
// 8192 entradas: el paso de `v` queda muy por debajo del escalon del dither
// (1/64), asi que la tabla no cambia ninguna decision de prendido/apagado.
const FIELD_LUT_N = 8192;
const FIELD_LUT = new Float32Array(FIELD_LUT_N + 1);
for (let i = 0; i <= FIELD_LUT_N; i++) {
  FIELD_LUT[i] = 1 - Math.exp(-((i / FIELD_LUT_N) * FIELD_MAX) * 1.7);
}
const FIELD_LUT_SCALE = FIELD_LUT_N / FIELD_MAX;

export interface BlobField {
  /** Start the animation loop (idempotent). */
  play: () => void;
  /** Pause the animation loop to save CPU while off-screen. */
  pause: () => void;
  /** Draw a single frame without starting the loop (reduced motion). */
  renderStatic: () => void;
  /** Tear everything down. */
  destroy: () => void;
}

/** Render the animated dithered blob field onto `canvas`, sized to `stage`. */
export function createBlobField(canvas: HTMLCanvasElement, stage: HTMLElement): BlobField {
  // `alpha: false` le permite a WebKit saltarse el blending del canvas contra
  // la pagina: todos los pixeles que escribimos son opacos.
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return { play() {}, pause() {}, renderStatic() {}, destroy() {} };

  const ua = navigator.userAgent || "";
  const isWebKitSafari = /AppleWebKit/i.test(ua) && !/(Chrome|CriOS|Edg|OPR|FxiOS|Firefox)/i.test(ua);
  const baseCell = isWebKitSafari ? CELL_SAFARI : CELL;
  const frameMs = isWebKitSafari ? FRAME_MS_SAFARI : FRAME_MS_DEFAULT;

  let w = 0;
  let h = 0;
  let img: ImageData | null = null;
  let out: Uint32Array | null = null;

  // Buffers reutilizados entre frames: nada se aloca dentro del loop de dibujo.
  let xLut = new Float32Array(0); // exp del eje x, N_BLOBS bloques de w
  let yLut = new Float32Array(0); // exp del eje y, N_BLOBS bloques de h
  let fieldRow = new Float32Array(0);
  let mixRow = new Float32Array(0);
  const xStart = new Int32Array(N_BLOBS);
  const xEnd = new Int32Array(N_BLOBS);
  const yStart = new Int32Array(N_BLOBS);
  const yEnd = new Int32Array(N_BLOBS);
  const mixes = new Float32Array(N_BLOBS);
  const actIdx = new Int32Array(N_BLOBS);
  const actKy = new Float32Array(N_BLOBS);

  /** Devuelve true si el buffer cambio de tamano (y hay que repintar). */
  const resize = (): boolean => {
    const rect = stage.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);

    // Si la celda base no alcanza para entrar en MAX_PIXELS, se agranda.
    let cell = baseCell;
    const area = cssW * cssH;
    if (area / (cell * cell) > MAX_PIXELS) cell = Math.ceil(Math.sqrt(area / MAX_PIXELS));

    const nextW = Math.max(1, Math.round(cssW / cell));
    const nextH = Math.max(1, Math.round(cssH / cell));
    if (nextW === w && nextH === h && img) return false;

    w = nextW;
    h = nextH;
    canvas.width = w;
    canvas.height = h;
    img = ctx.createImageData(w, h);
    out = new Uint32Array(img.data.buffer);
    out.fill(BG_PACKED);
    if (xLut.length < N_BLOBS * w) xLut = new Float32Array(N_BLOBS * w);
    if (yLut.length < N_BLOBS * h) yLut = new Float32Array(N_BLOBS * h);
    if (fieldRow.length < w) {
      fieldRow = new Float32Array(w);
      mixRow = new Float32Array(w);
    }
    ctx.imageSmoothingEnabled = false;
    return true;
  };
  resize();
  ctx.imageSmoothingEnabled = false;

  const render = (t: number) => {
    if (!img || !out) return;
    const minDim = Math.min(w, h);

    // --- Paso 1: estado de cada blob + sus dos LUT separables ---------------
    for (let i = 0; i < N_BLOBS; i++) {
      const b = BLOBS[i];
      mixes[i] = (Math.sin(t * b.mixFr + b.mixPh) + 1) / 2; // 0 = green core, 1 = white
      const r = (b.r + Math.sin(t * b.fr + b.ph) * b.ra) * minDim;
      const sigma = r * 0.5;
      const sigmaInv2 = 1 / (2 * sigma * sigma);
      const cx = (b.bx + Math.sin(t * b.fx + b.ph) * b.ax) * w;
      const cy = (b.by + Math.cos(t * b.fy + b.ph * 1.3) * b.ay) * h;
      // Distancia a la que la gaussiana ya vale menos que CUT.
      const reach = Math.sqrt(LN_CUT / sigmaInv2);

      const x0 = Math.max(0, Math.ceil(cx - reach));
      const x1 = Math.min(w - 1, Math.floor(cx + reach));
      xStart[i] = x0;
      xEnd[i] = x1;
      const xb = i * w;
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        xLut[xb + x] = Math.exp(-dx * dx * sigmaInv2);
      }

      const y0 = Math.max(0, Math.ceil(cy - reach));
      const y1 = Math.min(h - 1, Math.floor(cy + reach));
      yStart[i] = y0;
      yEnd[i] = y1;
      const yb = i * h;
      for (let y = y0; y <= y1; y++) {
        const dy = y - cy;
        yLut[yb + y] = Math.exp(-dy * dy * sigmaInv2);
      }
    }

    // --- Paso 2: una pasada por fila ---------------------------------------
    for (let y = 0; y < h; y++) {
      const rowOff = y * w;

      // Blobs que llegan a esta fila, con su factor vertical ya resuelto.
      let nActive = 0;
      let minX = w;
      let maxX = -1;
      for (let i = 0; i < N_BLOBS; i++) {
        if (y < yStart[i] || y > yEnd[i]) continue;
        const ky = yLut[i * h + y];
        if (ky < CUT) continue;
        actIdx[nActive] = i;
        actKy[nActive] = ky;
        nActive++;
        if (xStart[i] < minX) minX = xStart[i];
        if (xEnd[i] > maxX) maxX = xEnd[i];
      }

      if (nActive === 0 || maxX < minX) {
        out.fill(BG_PACKED, rowOff, rowOff + w);
        continue;
      }

      // Acumuladores solo en el tramo que algun blob toca.
      const span = maxX + 1;
      fieldRow.fill(0, minX, span);
      mixRow.fill(0, minX, span);
      for (let a = 0; a < nActive; a++) {
        const i = actIdx[a];
        const ky = actKy[a];
        const m = mixes[i];
        const xb = i * w;
        const e = xEnd[i];
        for (let x = xStart[i]; x <= e; x++) {
          const c = ky * xLut[xb + x];
          fieldRow[x] += c;
          mixRow[x] += c * m;
        }
      }

      // Los bordes de la fila son fondo puro: se rellenan de una.
      if (minX > 0) out.fill(BG_PACKED, rowOff, rowOff + minX);
      if (maxX < w - 1) out.fill(BG_PACKED, rowOff + span, rowOff + w);

      const bRow = (y & 7) << 3;
      for (let x = minX; x <= maxX; x++) {
        const field = fieldRow[x];
        if (field < 0.008) {
          out[rowOff + x] = BG_PACKED;
          continue;
        }
        let li = (field * FIELD_LUT_SCALE + 0.5) | 0;
        if (li > FIELD_LUT_N) li = FIELD_LUT_N;
        const v = FIELD_LUT[li];
        // Nucleo solido arriba de 0.94; en el medio decide el dither ordenado.
        if (v < 0.02 || (v <= 0.94 && v <= BAYER8[bRow | (x & 7)])) {
          out[rowOff + x] = BG_PACKED;
          continue;
        }
        let mi = ((mixRow[x] / field) * (MIX_STEPS - 1) + 0.5) | 0;
        if (mi < 0) mi = 0;
        else if (mi >= MIX_STEPS) mi = MIX_STEPS - 1;
        out[rowOff + x] = PALETTE[mi];
      }
    }

    ctx.putImageData(img, 0, 0);
  };

  let raf: number | null = null;
  let lastDrawTime = -1000;
  let lastT = 0;

  // El ResizeObserver de un stage con `height: 100vh` se dispara seguido en
  // mobile (barra de direcciones, rotacion). Se agenda en un rAF y `resize()`
  // sale temprano si el tamano del buffer no cambio, asi no se realoca nada.
  let resizeFrame: number | null = null;
  const ro = new ResizeObserver(() => {
    if (resizeFrame !== null) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null;
      if (resize() && raf === null) render(lastT); // repinta aunque este pausado
    });
  });
  ro.observe(stage);

  const draw = (t: number) => {
    raf = requestAnimationFrame(draw);
    // Throttle the loop; Safari benefits from a lower target fps.
    if (t - lastDrawTime < frameMs) return;
    lastDrawTime = t;
    lastT = t;
    render(t);
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
    renderStatic() {
      render(lastT);
    },
    destroy() {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeFrame = null;
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
    // Safari entrega varios pointermove por frame; escribir left/top en cada
    // uno invalida el layout del stage otras tantas veces. Se acumula y se
    // aplica una sola vez por frame.
    let moveFrame: number | null = null;
    let pendingLeft = 0, pendingTop = 0;

    const flush = () => {
      moveFrame = null;
      win.style.left = `${pendingLeft}px`;
      win.style.top = `${pendingTop}px`;
    };

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
      pendingLeft = origLeft;
      pendingTop = origTop;
      dragging = true;
      win.classList.add("is-dragging");
      try { bar.setPointerCapture(ev.pointerId); } catch {}
      ev.preventDefault();
    };

    const onMove = (ev: PointerEvent) => {
      if (!dragging) return;
      pendingLeft = Math.max(0, Math.min(maxLeft, origLeft + (ev.clientX - startX)));
      pendingTop = Math.max(0, Math.min(maxTop, origTop + (ev.clientY - startY)));
      if (moveFrame === null) moveFrame = requestAnimationFrame(flush);
    };

    const onUp = (ev: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (moveFrame !== null) {
        cancelAnimationFrame(moveFrame);
        flush();
      }
      win.classList.remove("is-dragging");
      try { bar.releasePointerCapture(ev.pointerId); } catch {}
    };

    bar.addEventListener("pointerdown", onDown);
    bar.addEventListener("pointermove", onMove);
    bar.addEventListener("pointerup", onUp);
    bar.addEventListener("pointercancel", onUp);
    cleanups.push(() => {
      if (moveFrame !== null) cancelAnimationFrame(moveFrame);
      bar.removeEventListener("pointerdown", onDown);
      bar.removeEventListener("pointermove", onMove);
      bar.removeEventListener("pointerup", onUp);
      bar.removeEventListener("pointercancel", onUp);
    });
  }

  return () => cleanups.forEach((fn) => fn());
}
