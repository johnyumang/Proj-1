/**
 * Shape of the belt and of the torso form, as pure functions.
 *
 * Belt-local space (before spin): units are about 12.5 cm, +y up, +z = front (the side that faces the
 * camera at spin 0), +x = the wearer's left. Angles `th` run round the waist: th = 0 is the front
 * centre, th = +PI/2 the wearer's left side, +-PI the back centre. Points on the body follow
 * x = r sin(th), z = r cos(th).
 *
 * The band is parameterised by (th, v): v = 0 on the lower edge, v = 1 on the top edge (at the navel).
 * The lower edge drops in one deep, smooth, slightly asymmetric bulge under the front (the pocket
 * panel) and is a narrow strap round the back, as in the flat pattern photo.
 */

export const TOP = 0.55; // top edge at the sides (navel height); dips slightly at the front
export const SIDE_BOTTOM = -0.35; // lower edge of the plain band at the sides (~56% of the front height)
export const BACK_BOTTOM = -0.1; // lower edge of the narrower straps round the back
export const FRONT_DEPTH = 0.7; // drop of the rounded front apron below the side edge -> lower edge -1.05
export const BULGE_C = -0.05; // centre of the apron (slightly toward the wearer's right)
export const BULGE_NEG = 1.5; // half width (radians) of the apron toward -th
export const BULGE_POS = 1.38; // toward +th (asymmetric, like the flat pattern)

export const GAP = 0.006; // inner face of the belt over the body surface
export const TH = 0.032; // fabric thickness (inner face -> outer face)
export const OUTER = GAP + TH;

export const VZ = 0.29; // v of the access zip on the outer face (a gentle smile following the bulge)
export const ZIP_HALF = 0.6; // zip runs th in [-ZIP_HALF, ZIP_HALF]

// Inner face features (flat-pattern photo): round opening with elastic binding + a zip near the bulge.
export const HOLE = { th: 0.02, y: -0.2, r: 0.27 };
export const INNER_ZIP = { th0: -0.5, th1: 0.42, above: 0.17 };

// VELCRO closure on the outer face, back/side on the wearer's left. Pad ~22% of the circumference.
export const CLOSURE = {
  hinge: 2.93, // stitched end of the hook tab (th)
  padTh0: 1.47, // pad spans th in [padTh0, padTh1]
  padTh1: 2.98,
  tabLen: 1.12, // arc length of the hook tab (world units)
  tabW: 0.5,
  padW: 0.54,
};

export const STRAP_MID = (TOP + BACK_BOTTOM) / 2;

const N = 2.2; // superellipse exponent of the waist section (a wide, soft ellipse)
const RX = 1.05;
const RZF = 0.7; // depth / width ~0.63
const RZB = 0.62;

export function clamp(x, a, b) {
  return x < a ? a : x > b ? b : x;
}
export function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
export function wrap(th) {
  let t = th;
  while (t > Math.PI) t -= Math.PI * 2;
  while (t < -Math.PI) t += Math.PI * 2;
  return t;
}

function bottomRaw(th) {
  const t0 = wrap(th);
  const d = t0 - BULGE_C;
  const t = Math.abs(d) / (d < 0 ? BULGE_NEG : BULGE_POS);
  if (t < 1) return SIDE_BOTTOM - FRONT_DEPTH * Math.pow(1 - t * t, 0.85);
  // plain band at the sides, narrowing into the straps round the back
  return lerp(SIDE_BOTTOM, BACK_BOTTOM, smoothstep(1.85, 2.55, Math.abs(t0)));
}

// The lower edge is tabulated and softened (two box blurs) so the apron meets the band with a
// rounded corner instead of a kink.
const BT_N = 2048;
const BT = (() => {
  let a = new Float64Array(BT_N);
  for (let i = 0; i < BT_N; i++) a[i] = bottomRaw(-Math.PI + (2 * Math.PI * i) / BT_N);
  const w = Math.round((0.06 / (2 * Math.PI)) * BT_N);
  for (let pass = 0; pass < 2; pass++) {
    const b = new Float64Array(BT_N);
    for (let i = 0; i < BT_N; i++) {
      let sum = 0;
      for (let k = -w; k <= w; k++) sum += a[(i + k + BT_N) % BT_N];
      b[i] = sum / (2 * w + 1);
    }
    a = b;
  }
  return a;
})();

/** Lower edge of the band at angle th. */
export function bottomY(th) {
  const x = ((wrap(th) + Math.PI) / (2 * Math.PI)) * BT_N;
  const i = Math.floor(x);
  const f = x - i;
  return lerp(BT[((i % BT_N) + BT_N) % BT_N], BT[(i + 1) % BT_N], f);
}

/** Top edge: level at the sides and back, dipping a few mm at the front. */
export function topY(th) {
  const c = Math.cos(th);
  return TOP - (c > 0 ? 0.035 * c * c * c : 0);
}

function smax(a, b, k) {
  const h = clamp(0.5 + (0.5 * (a - b)) / k, 0, 1);
  return lerp(b, a, h) + k * h * (1 - h);
}

/** Height of the access zip line at th (nearly level, a slight smile, as in the access photo). */
export function zipY(th) {
  const t = wrap(th);
  const b = bottomY(t);
  const want = smax(b + 0.14, -0.6 + 0.07 * (t / ZIP_HALF) ** 2, 0.06);
  // away from the zip the row just runs at ~30% of the strap height
  return -smax(-want, -(b + 0.3 * (topY(t) - b)), 0.06);
}

/** Height of the band at (th, v): v in [0, VZ] spans lower edge -> zip line, [VZ, 1] zip -> top. */
export function bandY(th, v) {
  const z = zipY(th);
  if (v <= VZ) return lerp(bottomY(th), z, v / VZ);
  return lerp(z, topY(th), (v - VZ) / (1 - VZ));
}

/** Inverse of bandY: the v of height y at th. */
export function vOfY(th, y) {
  const z = zipY(th);
  if (y <= z) return (clamp((y - bottomY(th)) / (z - bottomY(th)), 0, 1)) * VZ;
  return VZ + clamp((y - z) / (topY(th) - z), 0, 1) * (1 - VZ);
}

/** Seam where the rounded front apron is stitched to the band (th in the apron range). */
export const SEAM = { th0: BULGE_C - BULGE_NEG * 0.97, th1: BULGE_C + BULGE_POS * 0.97 };
export function seamY(th) {
  const d = th - BULGE_C;
  const t = d < 0 ? d / BULGE_NEG : d / BULGE_POS;
  return Math.max(bottomY(th) + 0.012, SIDE_BOTTOM + 0.02 - 0.07 * (1 - t * t));
}

/** dv that moves the height by dy near the zip line, on the given side (+1 above, -1 below). */
export function dvForDy(th, dy, side) {
  const z = zipY(th);
  return side > 0 ? (dy * (1 - VZ)) / (topY(th) - z) : (dy * VZ) / (z - bottomY(th));
}

function radiusPolar(th) {
  const c = Math.cos(th);
  const s = Math.sin(th);
  const a = c >= 0 ? RZF : RZB;
  return Math.pow(Math.pow(Math.abs(c) / a, N) + Math.pow(Math.abs(s) / RX, N), -1 / N);
}

/**
 * Scale of the section with height: a gentle waist (narrowest just below the navel), hips widening
 * below, ribcage widening a little above.
 */
function heightScale(y) {
  const w = clamp((y - 0.15) / 0.45, -1.2, 2.6);
  const hip = clamp((-0.2 - y) / 1.0, 0, 1.6);
  return 1 + (w > 0 ? 0.016 : 0.02) * w * w + 0.08 * Math.pow(hip, 1.6);
}

/** Body surface point (the torso form / inside of the worn belt). out = [x, y, z] */
export function bodyPoint(th, y, out) {
  const r = radiusPolar(th) * heightScale(y);
  const c = Math.cos(th);
  const s = Math.sin(th);
  const front = c > 0 ? c * c : 0;
  // soft fullness of the lower front, a little more on the wearer's left
  const belly = 0.05 * front * (1 + 0.55 * s) * Math.exp(-Math.pow((y + 0.55) / 0.42, 2));
  out[0] = r * s;
  out[1] = y;
  out[2] = r * c + belly;
  return out;
}

/** Very shallow diagonal tension folds of the stretch fabric near the sides (belt only). */
function foldOffset(th, y) {
  const a = Math.abs(wrap(th));
  const side = Math.exp(-Math.pow((a - 1.5) / 0.32, 2));
  if (side < 0.01) return 0;
  const env = Math.exp(-Math.pow((y - 0.05) / 0.32, 2));
  return 0.0035 * side * env * Math.sin((2 * Math.PI * (y + 0.22 * (a - 1.5))) / 0.24);
}

const _a = [0, 0, 0];
const _b = [0, 0, 0];
/** Horizontal outward normal of the section at (th, y). out = [nx, 0, nz] */
export function sectionNormal(th, y, out) {
  const h = 1e-3;
  bodyPoint(th - h, y, _a);
  bodyPoint(th + h, y, _b);
  const tx = _b[0] - _a[0];
  const tz = _b[2] - _a[2];
  // tangent goes toward +th; outward normal = (-tz, tx)
  let nx = -tz;
  let nz = tx;
  const l = Math.hypot(nx, nz) || 1;
  nx /= l;
  nz /= l;
  out[0] = nx;
  out[1] = 0;
  out[2] = nz;
  return out;
}

const _n = [0, 0, 0];
/** Point at (th, y) offset `off` along the section normal. */
export function offsetPoint(th, y, off, out) {
  bodyPoint(th, y, out);
  sectionNormal(th, y, _n);
  if (off > 0.001) off += foldOffset(th, y);
  out[0] += _n[0] * off;
  out[2] += _n[2] * off;
  return out;
}

/** Approximate local radius (for converting arc length to angle) at th. */
export function arcRadius(th, y) {
  const h = 1e-3;
  bodyPoint(th - h, y, _a);
  bodyPoint(th + h, y, _b);
  return Math.hypot(_b[0] - _a[0], _b[2] - _a[2]) / (2 * h);
}

/**
 * Displacement of the outer face when the access zip opens.
 * side: +1 = part above the zip, -1 = part below. Returns [outward, up] amounts.
 */
export function zipOpening(th, v, side, open) {
  if (open <= 1e-4) return ZERO2;
  const t = wrap(th);
  const thz = ZIP_HALF;
  const ths = thz - 2 * thz * open; // slider travels from the right end (+th) to the left end
  if (t > thz || t < ths) return ZERO2;
  const span = Math.max(1e-4, thz - ths);
  const lens = Math.pow(Math.sin((Math.PI * (thz - t)) / span), 1.4);
  const grow = smoothstep(0, 0.35, open);
  const w = lens * grow;
  if (side > 0) {
    const d = (v - VZ) / 0.4;
    if (d >= 1) return ZERO2;
    const f = (1 - d) * (1 - d);
    RES2[0] = 0.25 * w * f;
    RES2[1] = 0.19 * w * f;
  } else {
    const d = (VZ - v) / (VZ - 0.05);
    if (d >= 1) return ZERO2;
    const f = (1 - d) * (1 - d);
    RES2[0] = 0.04 * w * f;
    RES2[1] = -0.035 * w * f;
  }
  return RES2;
}
const ZERO2 = [0, 0];
const RES2 = [0, 0];

/** Outer face point of the band. side used only at the zip row. */
export function outerPoint(th, v, side, open, out) {
  const y = bandY(th, v);
  offsetPoint(th, y, OUTER, out);
  const d = zipOpening(th, v, side, open);
  if (d[0] !== 0 || d[1] !== 0) {
    sectionNormal(th, y, _n);
    out[0] += _n[0] * d[0];
    out[2] += _n[2] * d[0];
    out[1] += d[1];
  }
  return out;
}

/** Slider position of the access zip. */
export function zipSlider(open) {
  return ZIP_HALF - 2 * ZIP_HALF * open;
}
