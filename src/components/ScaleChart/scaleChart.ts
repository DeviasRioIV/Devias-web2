// Geometry for the "scale curve" chart.
//
// Single source of truth shared by the server render (initial paint) and the
// client script (live updates while dragging), so the math lives in one place.
//
// The SVG uses a 560 x 150 coordinate space. In SVG a *lower* y value is
// *higher* on screen, so the curves climb by decreasing y.

/** Points along the x axis (0–1) where each warning pin sits. */
export const THRESHOLDS = [0.22, 0.46, 0.7, 0.94] as const;

/** Pole height in px for each pin once its threshold is reached. */
export const POLE_HEIGHTS = [48, 82, 116, 150] as const;

/** Size of the SVG drawing area, in its own coordinate space. */
const SVG_WIDTH = 560;
const SVG_HEIGHT = 150;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// The green "system" line is the quadratic Bézier drawn below:
//   start (0, 120) — control (280, cpY) — end (560, 95)
// Its control point rises (cpY drops from 115 to 60) as the slider advances,
// so the line bulges upward. Because the control x (280) is the midpoint of
// 0 and 560, the Bézier parameter equals the normalized x — so we can read the
// line's exact height at any x, which is what keeps the dots glued to it.
const CURVE_START_Y = 120;
const CURVE_END_Y = 95;

/** Control-point Y of the green curve for slider position t (0–1). */
const controlPointY = (t: number) => lerp(115, 60, Math.min(t * 1.6, 1));

/** Exact Y of the green curve at normalized x = s (0–1), for slider t. */
const curveYAt = (s: number, t: number) => {
  const cpY = controlPointY(t);
  return (1 - s) ** 2 * CURVE_START_Y + 2 * (1 - s) * s * cpY + s ** 2 * CURVE_END_Y;
};

/** SVG path for the green curve at the current scale value. */
const buildControlPath = (t: number) =>
  `M 0 ${CURVE_START_Y} Q 280 ${controlPointY(t)} 560 ${CURVE_END_Y}`;

export interface PinGeometry {
  active: boolean;
  leftPct: number;
  dotBottom: number;
  anchorTransform: string;
  poleHeight: number;
}

export interface ChartState {
  controlPath: string;
  /** Horizontal position of both moving markers (% of the plot width). */
  markerLeftPct: number;
  /** Blue marker's distance from the bottom of the plot (px). */
  markerCompanyBottom: number;
  /** Green marker's distance from the bottom of the plot (px). */
  markerControlBottom: number;
  pins: PinGeometry[];
}

/**
 * Derive every positioned value from the slider value (0–100).
 *
 * Every px output is expressed against the *rendered* height of the plot's SVG,
 * which stretches (`preserveAspectRatio="none"`) and is taller on desktop. Pass
 * the measured height so dots and poles stay glued to the curve; the default
 * matches the mobile CSS height, which is what the server render uses.
 */
export function computeChart(value: number, svgHeight: number = SVG_HEIGHT): ChartState {
  const t = value / 100;
  /** SVG units → rendered px. */
  const k = svgHeight / SVG_HEIGHT;

  const markerX = lerp(0, SVG_WIDTH, t);
  const markerYCompany = lerp(120, 20, t);
  // The marker's x is markerX, so its curve parameter is exactly t.
  const markerYControl = curveYAt(t, t);

  return {
    controlPath: buildControlPath(t),
    // The markers are HTML elements positioned over the plot (not SVG
    // <circle>s), so they stay perfectly round even when the stretched SVG
    // squashes its own coordinate system on narrow screens. They are centred
    // on their (left, bottom) point via a CSS transform.
    markerLeftPct: (markerX / SVG_WIDTH) * 100,
    markerCompanyBottom: (SVG_HEIGHT - markerYCompany) * k,
    markerControlBottom: (SVG_HEIGHT - markerYControl) * k,
    pins: THRESHOLDS.map((threshold, i) => {
      const active = t >= threshold;
      const leftPct = threshold * 100;
      return {
        active,
        leftPct,
        // Glue the dot to the green curve at the current slider value. The pin
        // is anchored by its bottom edge; centring the dot on the line is done
        // in CSS (negative margin of half a dot) so the dot can change size per
        // breakpoint. Recomputed on every drag as the curve reshapes.
        dotBottom: (SVG_HEIGHT - curveYAt(threshold, t)) * k,
        // Keep the label inside the card near the edges.
        anchorTransform:
          leftPct < 14
            ? "translateX(0%)"
            : leftPct > 86
              ? "translateX(-100%)"
              : "translateX(-50%)",
        poleHeight: (active ? POLE_HEIGHTS[i] : 3) * k,
      };
    }),
  };
}
