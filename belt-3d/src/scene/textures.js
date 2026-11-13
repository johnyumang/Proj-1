import {
  CanvasTexture,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  ClampToEdgeWrapping,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three';

/** Procedural textures: no image files are loaded. */

function dataTexture(w, h, data, { repeat = false, srgb = false } = {}) {
  const t = new DataTexture(data, w, h, RGBAFormat, UnsignedByteType);
  t.wrapS = t.wrapT = repeat ? RepeatWrapping : ClampToEdgeWrapping;
  t.magFilter = LinearFilter;
  t.minFilter = LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

/** Height field (Float32Array w*h) -> tangent-space normal map RGBA bytes. */
function heightToNormal(hf, w, h, strength, wrap) {
  const out = new Uint8Array(w * h * 4);
  const at = (x, y) => {
    if (wrap) {
      x = (x + w) % w;
      y = (y + h) % h;
    } else {
      x = Math.min(w - 1, Math.max(0, x));
      y = Math.min(h - 1, Math.max(0, y));
    }
    return hf[y * w + x];
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      let nx = -dx;
      let ny = -dy;
      let nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l;
      ny /= l;
      nz /= l;
      const k = (y * w + x) * 4;
      out[k] = Math.round((nx * 0.5 + 0.5) * 255);
      out[k + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      out[k + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      out[k + 3] = 255;
    }
  }
  return out;
}

function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - ax - vx * t, py - ay - vy * t);
}

/** Fine jersey knit: columns of small V loops. Tile = 4 x 4 stitches. */
export function knitNormalMap() {
  const S = 64;
  const cell = 16;
  const hf = new Float32Array(S * S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = (x % cell) / cell;
      const v = (y % cell) / cell;
      // two slanted legs meeting low in the cell
      const d1 = segDist(u, v, 0.08, 0.95, 0.47, 0.12);
      const d2 = segDist(u, v, 0.92, 0.95, 0.53, 0.12);
      // neighbouring cell legs that reach into this cell from above
      const d3 = segDist(u, v + 1, 0.08, 0.95, 0.47, 0.12);
      const d4 = segDist(u, v + 1, 0.92, 0.95, 0.53, 0.12);
      const d = Math.min(d1, d2, d3, d4);
      const r = Math.max(0, 1 - d / 0.2);
      hf[y * S + x] = r * r * (3 - 2 * r);
    }
  }
  return dataTexture(S, S, heightToNormal(hf, S, S, 1.6, true), { repeat: true });
}

/** Stadium test in local (s along, t across) coordinates. */
function inStadium(s, t, len, r, roundStart) {
  if (s < 0 || s > len) return false;
  if (Math.abs(t) > r) return false;
  if (s > len - r) return (s - (len - r)) ** 2 + t * t <= r * r;
  if (roundStart && s < r) return (s - r) ** 2 + t * t <= r * r;
  return true;
}

/**
 * Hook side of the VELCRO tab: colour (multiplied with the hook colour) + normal map.
 * u along the tab (0 = stitched end, 1 = rounded free end), v across.
 */
export function hookMaps(len, width) {
  const W = 512;
  const H = Math.round((512 * width) / len);
  const col = new Uint8Array(W * H * 4);
  const hf = new Float32Array(W * H);
  const r = width / 2;
  const m = 0.035; // plain fabric margin
  const pitch = 0.011; // rib spacing (world)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const s = ((x + 0.5) / W) * len;
      const t = ((y + 0.5) / H - 0.5) * width;
      const k = y * W + x;
      // panel inset by the margin, rounded at the free end
      const inPanel = s > m && inStadium(s - m, t, len - 2 * m, r - m, false);
      let c;
      if (inPanel) {
        const ph = (t / pitch) * Math.PI * 2;
        const rib = 0.5 + 0.5 * Math.cos(ph);
        hf[k] = rib * 0.8 + 0.4;
        c = 150 + rib * 70; // ribs: lighter crests, darker grooves (multiplied with hook tint)
      } else {
        hf[k] = 0;
        c = 255; // margin shows as plain fabric tint (set in shader)
      }
      col[k * 4] = col[k * 4 + 1] = col[k * 4 + 2] = c;
      col[k * 4 + 3] = inPanel ? 255 : 0; // alpha: 1 inside hook panel, 0 on margin
    }
  }
  return {
    map: dataTexture(W, H, col, { srgb: false }),
    normal: dataTexture(W, H, heightToNormal(hf, W, H, 3.0, false)),
  };
}

/** Loop side of the VELCRO (the pad on the band): fuzzy grey with a stitched border. */
export function padMaps(len, width) {
  const W = 512;
  const H = Math.round((512 * width) / len);
  const col = new Uint8Array(W * H * 4);
  const hf = new Float32Array(W * H);
  const r = width / 2;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const s = ((x + 0.5) / W) * len;
      const t = ((y + 0.5) / H - 0.5) * width;
      const k = y * W + x;
      const n = rnd();
      hf[k] = n;
      // distance to the border of the stadium (approx.)
      let d;
      if (s < r) d = r - Math.hypot(s - r, t);
      else if (s > len - r) d = r - Math.hypot(s - (len - r), t);
      else d = r - Math.abs(t);
      const border = d < 0.022 && d > 0.008;
      const c = border ? 235 : 200 + n * 40;
      col[k * 4] = col[k * 4 + 1] = col[k * 4 + 2] = c;
      col[k * 4 + 3] = 255;
    }
  }
  return {
    map: dataTexture(W, H, col),
    normal: dataTexture(W, H, heightToNormal(hf, W, H, 0.7, false)),
  };
}

/** Zip tape + teeth. One tooth per texture repeat along u; v: 0 = tape edge, 1 = the split. */
export function zipMap() {
  const W = 16;
  const H = 32;
  const col = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = (y + 0.5) / H;
      const u = (x + 0.5) / W;
      let c = 235;
      if (v > 0.55) c = u < 0.55 ? 150 : 205; // teeth
      if (v < 0.12) c = 210; // stitched tape edge
      const k = (y * W + x) * 4;
      col[k] = col[k + 1] = col[k + 2] = c;
      col[k + 3] = 255;
    }
  }
  const t = dataTexture(W, H, col, { repeat: true });
  t.wrapT = ClampToEdgeWrapping;
  return t;
}

/** Small ivory woven label. */
export function labelTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#f2ede1';
  g.fillRect(0, 0, 256, 96);
  // woven rows
  for (let y = 0; y < 96; y += 3) {
    g.fillStyle = y % 6 === 0 ? 'rgba(120,110,95,0.10)' : 'rgba(255,255,255,0.18)';
    g.fillRect(0, y, 256, 1);
  }
  g.fillStyle = '#4b4741';
  g.font = '700 46px Helvetica, Arial, sans-serif';
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.fillText('SIIL', 112, 50);
  // small mark to the right of the word
  g.fillRect(172, 33, 7, 34);
  g.fillRect(184, 33, 7, 34);
  g.fillRect(172, 60, 19, 7);
  // folded edge shading
  g.fillStyle = 'rgba(0,0,0,0.12)';
  g.fillRect(0, 0, 6, 96);
  g.fillRect(250, 0, 6, 96);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Soft radial blob for the contact shadow (alpha only, rgb white). */
export function shadowTexture() {
  const S = 128;
  const d = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = ((x + 0.5) / S) * 2 - 1;
      const v = ((y + 0.5) / S) * 2 - 1;
      const r = Math.hypot(u, v);
      const a = Math.max(0, 1 - r);
      const k = (y * S + x) * 4;
      d[k] = d[k + 1] = d[k + 2] = 255;
      d[k + 3] = Math.round(255 * Math.exp(-3.2 * r * r) * Math.min(1, a * 3));
    }
  }
  return dataTexture(S, S, d);
}
