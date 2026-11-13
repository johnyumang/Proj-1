/**
 * Scene illustrations: flat cut-paper vector scenes, drawn for this page. No people, no body
 * parts, no logos, no text. Every scene has a base and three planes (far, mid, near) that the
 * story moves at different rates; ambient pieces carry data-amb and are moved by the ticker.
 *
 * Each plane is drawn twice from the same code: a wide composition (1600 x 1000, used from
 * 900 px) and a tall one (800 x 1300, phones), so the phone picture is recomposed rather than
 * cropped: key objects stay in the upper half around the belt, the lower band stays calm for
 * the copy. `V.cx/V.cy` is where the belt stands in each composition.
 */
const WIDE = { w: 1600, h: 1000, cx: 800, cy: 470, tall: false };
const TALL = { w: 800, h: 1300, cx: 400, cy: 400, tall: true };

const svg = (V, body, cls = '') =>
  `<svg class="art-svg art-svg--${V.tall ? 'tall' : 'wide'}${cls ? ` ${cls}` : ''}" viewBox="0 0 ${V.w} ${V.h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${body}</svg>`;

const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}"${extra}/>`;
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${extra}/>`;
const g = (body, extra = '') => `<g${extra}>${body}</g>`;
const amb = (kind, body, extra = '') => `<g data-amb="${kind}"${extra}>${body}</g>`;

/** A wavy horizontal line from x0 to x1 at y (light ripples, sea foam). */
function wave(x0, x1, y, amp, len, stroke, width, extra = '') {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x1; x += len) d += ` q${len / 4} ${-amp} ${len / 2} 0 t${len / 2} 0`;
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"${extra}/>`;
}

/* ------------------------------------------------------------------ POOL (navy belt) */
const POOL = {
  base: '#bfe8e4',
  far(V) {
    const { w, h, tall } = V;
    let s = rect(0, 0, w, h, '#bfe8e4');
    // floor tiles: fine grid in a slightly deeper tone
    const step = tall ? 70 : 80;
    let grid = '';
    for (let x = 0; x <= w; x += step) grid += `M${x} 0V${h}`;
    for (let y = 0; y <= h; y += step) grid += `M0 ${y}H${w}`;
    s += `<path d="${grid}" stroke="#acdcd8" stroke-width="2" fill="none"/>`;
    // lane floor marks: long dark-teal bars with T ends, kept clear of the belt
    const lanes = tall ? [110, 690] : [230, 1370];
    for (const x of lanes) {
      s += rect(x - 14, tall ? 90 : 140, 28, tall ? 760 : 700, '#4aa6b0', ' rx="6"');
      s += rect(x - 60, tall ? 90 : 140, 120, 26, '#4aa6b0', ' rx="6"');
    }
    // deeper water toward the far end
    s += path(tall ? `M0 0H${w}V200C560 240 240 170 0 230Z` : `M0 0H${w}V170C1150 230 520 120 0 200Z`, '#9fd8d6');
    return svg(V, s);
  },
  mid(V) {
    const { w, h, tall } = V;
    // caustic light lines drifting over the water
    let lines = '';
    const rows = tall ? 9 : 8;
    for (let i = 0; i < rows; i += 1) {
      const y = (tall ? 120 : 110) + i * (tall ? 92 : 108);
      lines += wave(-200, w + 200, y, 14, 120, '#effcfa', i % 2 ? 4 : 6, ' opacity="0.75"');
    }
    let s = amb('ripple', lines);
    // lane rope: a diagonal chain of floats crossing the top-left corner
    const n = tall ? 9 : 14;
    const [x0, y0, x1, y1] = tall ? [-40, 300, 520, -20] : [-40, 380, 760, -40];
    let rope = `<path d="M${x0} ${y0}L${x1} ${y1}" stroke="#2c6e7c" stroke-width="5"/>`;
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      const cx = x0 + (x1 - x0) * t;
      const cy = y0 + (y1 - y0) * t;
      const col = i % 3 === 0 ? '#e2604a' : i % 3 === 1 ? '#fbf7ef' : '#203a6b';
      rope += ellipse(cx + 6, cy + 10, 26, 17, '#7fc3c2', ` transform="rotate(-28 ${cx} ${cy})"`);
      rope += ellipse(cx, cy, 26, 17, col, ` transform="rotate(-28 ${cx} ${cy})"`);
    }
    s += amb('bob', rope);
    return svg(V, s);
  },
  near(V) {
    const { w, h, tall } = V;
    let s = '';
    // pale tiled pool edge along the right side (wide) / the top (tall)
    if (tall) {
      s += path(`M0 0H${w}V96C620 112 260 88 0 104Z`, '#f4efe5');
      s += path(`M0 104C260 88 620 112 ${w} 96V112C620 128 260 104 0 120Z`, '#d8d0c0');
      for (let x = 40; x < w; x += 90) s += rect(x, 18, 3, 70, '#e5ddcf');
    } else {
      s += path(`M1420 0H${w}V${h}H1460C1440 700 1446 300 1420 0Z`, '#f4efe5');
      s += path(`M1420 0C1446 300 1440 700 1460 ${h}H1440C1420 700 1426 300 1400 0Z`, '#d8d0c0');
      for (let y = 40; y < h; y += 90) s += rect(1462, y, 120, 3, '#e5ddcf');
    }
    // ladder rails: two bent tubes, each with a flat shadow on the water
    const lx = tall ? 640 : 1400;
    const ly = tall ? 100 : 300;
    for (const dx of [0, 70]) {
      s += path(`M${lx + dx + 18} ${ly + 8}c-60 0 -60 40 -60 90v180`, 'none', ' stroke="#7cbcbc" stroke-width="16" stroke-linecap="round"');
      s += path(`M${lx + dx} ${ly}c-60 0 -60 40 -60 90v180`, 'none', ' stroke="#f7fbfb" stroke-width="16" stroke-linecap="round"');
    }
    s += rect(lx - 62, ly + 150, 72, 10, '#e5eeee', ' rx="5"');
    // striped towel corner
    const [tx, ty, rot] = tall ? [-60, 980, -8] : [1080, 760, -10];
    let towel = rect(18, 22, 420, 300, '#2b6f7f', ' rx="14" opacity="0.35"');
    towel += rect(0, 0, 420, 300, '#fbf7ef', ' rx="14"');
    for (let i = 0; i < 5; i += 1) towel += rect(0, 30 + i * 56, 420, 26, i % 2 ? '#203a6b' : '#e2604a');
    s += g(towel, ` transform="translate(${tx} ${ty}) rotate(${rot})"`);
    return svg(V, s);
  },
};

/* ------------------------------------------------------------------ BEACH (beige belt) */
const BEACH = {
  base: '#f7dcc0',
  far(V) {
    const { w, h, tall } = V;
    const horizon = tall ? 230 : 330;
    let s = rect(0, 0, w, h, '#f7dcc0');
    s += rect(0, 0, w, horizon * 0.55, '#f9e6d2');
    const sx = tall ? 600 : 1230;
    const sy = tall ? 130 : 170;
    s += amb('shimmer', circle(sx, sy, tall ? 120 : 150, '#fbc98f', ' opacity="0.55"'));
    s += circle(sx, sy, tall ? 80 : 100, '#f2a65a');
    // sea bands
    s += rect(0, horizon, w, h - horizon, '#2f7ea5');
    s += path(`M0 ${horizon + 60}C${w * 0.3} ${horizon + 40} ${w * 0.7} ${horizon + 80} ${w} ${horizon + 56}V${h}H0Z`, '#3f8fb5');
    // sun glitter on the water, under the sun
    let glit = '';
    for (let i = 0; i < 7; i += 1) glit += rect(sx - 90 + ((i * 53) % 160), horizon + 16 + i * 26, 60 - i * 5, 6, '#fbe3c2', ' rx="3"');
    s += amb('glitter', glit);
    return svg(V, s);
  },
  mid(V) {
    const { w, h, tall } = V;
    const shore = tall ? 690 : 690;
    let s = path(`M0 ${shore - 150}C${w * 0.35} ${shore - 190} ${w * 0.6} ${shore - 120} ${w} ${shore - 160}V${h}H0Z`, '#62a9c6');
    let foam = '';
    foam += wave(-160, w + 160, shore - 60, 10, 160, '#d9eef2', 7);
    foam += wave(-160, w + 160, shore - 20, 8, 120, '#bfe2ea', 5);
    s += amb('foam', foam);
    s += path(`M0 ${shore}C${w * 0.3} ${shore - 40} ${w * 0.62} ${shore + 20} ${w} ${shore - 24}V${h}H0Z`, '#ecc993');
    s += path(`M0 ${shore + 60}C${w * 0.4} ${shore + 20} ${w * 0.7} ${shore + 90} ${w} ${shore + 50}V${h}H0Z`, '#e3b97c');
    return svg(V, s);
  },
  near(V) {
    const { w, h, tall } = V;
    let s = '';
    // parasol: canopy, pole, flat shadow on the sand
    const px = tall ? 120 : 260;
    const py = tall ? 470 : 360;
    const r = tall ? 200 : 250;
    s += ellipse(px + 120, py + r * 1.75, r * 0.95, r * 0.18, '#c99a5e', ' opacity="0.55"');
    s += rect(px - 6, py, 12, r * 1.75, '#7b4a2c', ' rx="6"');
    const canopy = (fill, a0, a1) => {
      const p0 = [px + r * Math.cos(a0), py + r * 0.5 * Math.sin(a0)];
      const p1 = [px + r * Math.cos(a1), py + r * 0.5 * Math.sin(a1)];
      return path(`M${px} ${py - r * 0.42}L${p0[0]} ${p0[1] + r * 0.2}Q${(p0[0] + p1[0]) / 2} ${(p0[1] + p1[1]) / 2 + r * 0.05} ${p1[0]} ${p1[1] + r * 0.2}Z`, fill);
    };
    const cols = ['#b85a33', '#fbf3e6', '#b85a33', '#fbf3e6', '#b85a33'];
    for (let i = 0; i < 5; i += 1) s += canopy(cols[i], Math.PI + (i * Math.PI) / 5, Math.PI + ((i + 1) * Math.PI) / 5);
    s += circle(px, py - r * 0.42, 9, '#7b4a2c');
    // terracotta towel on the sand
    const [tx, ty, rot] = tall ? [420, 760, -6] : [1060, 760, -5];
    let towel = rect(16, 20, tall ? 420 : 460, 210, '#b88b55', ' rx="12" opacity="0.5"');
    towel += rect(0, 0, tall ? 420 : 460, 210, '#b85a33', ' rx="12"');
    towel += rect(0, 150, tall ? 420 : 460, 22, '#f2c79a');
    s += g(towel, ` transform="translate(${tx} ${ty}) rotate(${rot})"`);
    // a shell-like pebble pair
    s += ellipse(tall ? 660 : 640, tall ? 1080 : 900, 30, 14, '#f6e7cf');
    s += ellipse(tall ? 610 : 600, tall ? 1100 : 916, 18, 9, '#d7a46e');
    return svg(V, s);
  },
};

/* ------------------------------------------------------------------ CASUAL (beige belt, park café) */
const CASUAL = {
  base: '#f0e2c6',
  far(V) {
    const { w, h, tall } = V;
    let s = rect(0, 0, w, h, '#f0e2c6');
    // deep olive hedge band behind the belt, so the beige reads
    const top = tall ? 210 : 280;
    const bot = tall ? 640 : 700;
    let hedge = `M0 ${top + 40}`;
    for (let x = 0; x <= w; x += tall ? 100 : 130) hedge += ` Q${x + (tall ? 50 : 65)} ${top - 30} ${x + (tall ? 100 : 130)} ${top + 30}`;
    hedge += `V${bot}H0Z`;
    s += path(hedge, '#6b7a42');
    s += path(`M0 ${bot - 120}C${w * 0.3} ${bot - 170} ${w * 0.6} ${bot - 90} ${w} ${bot - 140}V${bot}H0Z`, '#5b6936');
    return svg(V, s);
  },
  mid(V) {
    const { w, h, tall } = V;
    let s = '';
    const ground = tall ? 620 : 680;
    s += path(`M0 ${ground}C${w * 0.4} ${ground - 30} ${w * 0.7} ${ground + 20} ${w} ${ground - 10}V${h}H0Z`, '#d9c08f');
    // path winding into the distance
    s += path(tall ? `M300 ${h}C340 1000 470 800 420 ${ground + 6}H450C520 800 470 1000 560 ${h}Z` : `M560 ${h}C640 900 780 780 760 ${ground + 4}H800C860 780 900 900 1060 ${h}Z`, '#ecdcb8');
    // round trees: canopy, trunk, flat shadow
    const trees = tall
      ? [[90, 270, 120, '#8c9a5b'], [720, 240, 110, '#7d8b4c']]
      : [[230, 260, 150, '#8c9a5b'], [1380, 230, 170, '#7d8b4c'], [1140, 330, 100, '#a3ad6a']];
    for (const [x, y, r, col] of trees) {
      s += ellipse(x + 40, ground + 12, r * 0.8, 18, '#b9a06e', ' opacity="0.7"');
      s += rect(x - 10, y + r * 0.6, 20, ground - y - r * 0.6 + 8, '#9a5a35', ' rx="8"');
      s += amb('sway', circle(x, y, r, col) + circle(x - r * 0.35, y - r * 0.2, r * 0.45, '#9eab69', ' opacity="0.6"'), ` style="transform-origin:${x}px ${y + r}px"`);
    }
    return svg(V, s);
  },
  near(V) {
    const { tall } = V;
    let s = '';
    // café table seen at an angle, two cups with saucers, a chair back
    const [tx, ty, tr] = tall ? [610, 640, 170] : [1240, 800, 220];
    s += ellipse(tx + 30, ty + 40, tr, tr * 0.32, '#8f5a36', ' opacity="0.35"');
    s += rect(tx - 12, ty, 24, tall ? 160 : 210, '#5b3a24');
    s += ellipse(tx, ty, tr, tr * 0.3, '#c4663b');
    s += ellipse(tx, ty - 8, tr, tr * 0.3, '#d9814f');
    for (const [dx, dy] of [[-tr * 0.38, -4], [tr * 0.3, 10]]) {
      const cx = tx + dx;
      const cy = ty + dy - 10;
      s += ellipse(cx, cy + 6, 46, 13, '#f7efe2');
      s += path(`M${cx - 26} ${cy - 40}h52l-6 40h-40z`, '#fbf7ef');
      s += path(`M${cx + 24} ${cy - 32}c18 0 18 22 0 22`, 'none', ' stroke="#fbf7ef" stroke-width="7"');
      s += ellipse(cx, cy - 40, 26, 6, '#7b4a2c');
      s += amb('steam', path(`M${cx - 6} ${cy - 56}c-14 -20 14 -30 0 -54`, 'none', ' stroke="#fbf7ef" stroke-width="5" stroke-linecap="round" opacity="0.8"'));
    }
    return svg(V, s);
  },
};

/* ------------------------------------------------------------------ OFFICE (black belt) */
const OFFICE = {
  base: '#cdd7e0',
  far(V) {
    const { w, h, tall } = V;
    let s = rect(0, 0, w, h, '#cdd7e0');
    // window with blinds on the left
    const [wx, wy, ww, wh] = tall ? [60, 120, 300, 460] : [140, 120, 420, 560];
    s += rect(wx - 16, wy - 16, ww + 32, wh + 32, '#b6c3cf', ' rx="8"');
    s += rect(wx, wy, ww, wh, '#eef3f7');
    let slats = '';
    for (let y = wy + 10; y < wy + wh; y += 26) slats += rect(wx, y, ww, 12, '#d8e1e9');
    s += slats;
    // light stripes thrown by the blinds across the wall (drift slowly)
    let beams = '';
    for (let i = 0; i < 7; i += 1) {
      const y = (tall ? 520 : 300) + i * 46;
      beams += path(`M${wx + ww} ${y}L${w + 200} ${y + 260}V${y + 284}L${wx + ww} ${y + 20}Z`, '#e3eaf0', ' opacity="0.85"');
    }
    s += amb('beams', beams);
    return svg(V, s);
  },
  mid(V) {
    const { w, h, tall } = V;
    let s = '';
    // monitor silhouette (right), lamp with the one warm accent (left), plant
    const [mx, my, mw, mh] = tall ? [520, 300, 260, 170] : [1110, 300, 360, 230];
    s += rect(mx + 18, my + 18, mw, mh, '#9eacba', ' rx="14"');
    s += rect(mx, my, mw, mh, '#4f5e72', ' rx="14"');
    s += rect(mx + 14, my + 14, mw - 28, mh - 28, '#5f7086', ' rx="8"');
    s += rect(mx + mw / 2 - 14, my + mh, 28, tall ? 90 : 120, '#4f5e72');
    s += rect(mx + mw / 2 - 80, my + mh + (tall ? 84 : 112), 160, 16, '#4f5e72', ' rx="8"');
    const [lx, ly] = tall ? [110, 560] : [330, 470];
    s += path(`M${lx} ${ly + 230}l40 -150 -70 -80`, 'none', ' stroke="#3f4b5b" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"');
    s += path(`M${lx - 110} ${ly - 20}l70 -60 70 60z`, '#e08a3c', ` transform="rotate(-20 ${lx - 40} ${ly})"`);
    s += amb('glow', ellipse(lx - 40, ly + 40, 120, 60, '#f7c58f', ' opacity="0.35"'));
    // plant in a pot
    const [px, py] = tall ? [700, 540] : [1520, 560];
    for (const a of [-50, -25, 0, 25, 50]) s += ellipse(px, py - 70, 26, 90, '#5d7a5e', ` transform="rotate(${a} ${px} ${py})"`);
    s += path(`M${px - 60} ${py}h120l-16 110h-88z`, '#b9805a');
    void w;
    void h;
    return svg(V, s);
  },
  near(V) {
    const { w, h, tall } = V;
    let s = '';
    // desk edge across the bottom, with its shadow line
    const top = tall ? 760 : 820;
    s += rect(0, top - 18, w, 24, '#7d8c9c', ' opacity="0.5"');
    s += rect(0, top, w, h - top, '#9a7350');
    s += rect(0, top, w, 18, '#b48a62');
    // notebook and mug on the desk
    const [nx, ny] = tall ? [70, top - 30] : [180, top - 34];
    s += path(`M${nx} ${ny}h260l40 34h-260z`, '#eef2f5');
    s += path(`M${nx} ${ny}h260l40 34h-260z`, 'none', ' stroke="#b6c3cf" stroke-width="3"');
    const [cx, cy] = tall ? [640, top - 10] : [1260, top - 10];
    s += path(`M${cx - 34} ${cy - 90}h68l-6 90h-56z`, '#f6f1e8');
    s += path(`M${cx + 32} ${cy - 76}c26 0 26 34 0 34`, 'none', ' stroke="#f6f1e8" stroke-width="9"');
    s += amb('steam', path(`M${cx} ${cy - 104}c-14 -20 14 -30 0 -54`, 'none', ' stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.7"'));
    return svg(V, s);
  },
};

export const SCENES = [POOL, BEACH, CASUAL, OFFICE];

/** The three planes of a scene in both compositions. */
export function sceneArt(i) {
  const S = SCENES[i];
  const plane = (name) => `<div class="plane plane--${name}" data-plane="${name}">${S[name](WIDE)}${S[name](TALL)}</div>`;
  return { base: S.base, far: plane('far'), mid: plane('mid'), near: plane('near') };
}

/* ------------------------------------------------------------------ calm fields (highlights, access, close) */

/** Soft cut-paper folds on a flat field: large overlapping curves, three planes. */
export function foldArt(fills) {
  const [a, b, c] = fills;
  const far = (V) =>
    svg(V, path(V.tall ? 'M-50 0H500C380 300 520 520 260 760C120 890 -40 840 -50 900Z' : 'M-80 0H700C560 240 640 520 360 760C220 870 -40 860 -80 940Z', a));
  const mid = (V) =>
    svg(V, path(V.tall ? 'M850 360C640 420 600 700 700 900C760 1040 860 1080 900 1300H850Z' : 'M1700 200C1300 260 1180 560 1330 800C1420 950 1560 980 1700 1100Z', b));
  const near = (V) =>
    svg(
      V,
      path(V.tall ? 'M-40 1300C120 1120 420 1160 560 1260C640 1320 760 1300 860 1300Z' : 'M-80 1000C200 820 620 900 840 960C1060 1020 1300 980 1700 860V1000Z', c),
    );
  const plane = (name, fn) => `<div class="plane plane--${name}" data-plane="${name}">${fn(WIDE)}${fn(TALL)}</div>`;
  return { far: plane('far', far), mid: plane('mid', mid), near: plane('near', near) };
}
