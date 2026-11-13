/**
 * The page's own SVG ribbons, built in viewport pixels on every (re)build:
 *  back   sweeps behind the giant word in the scene chapters
 *  weave  the same path, masked to a few windows across the word, drawn in front of it:
 *         the ribbon passes over and under the word (the scene's ribbon is in front of the belt)
 *  front  runs across Access and loops round the ring in Close, where it ends
 * Drawing is two custom properties per ribbon (--rb-len, --rb-off), set from compose().
 */
const P = (pts, W, H) => pts.map(([x, y]) => `${(x * W).toFixed(1)} ${(y * H).toFixed(1)}`);

function backPath(W, H, compact) {
  const p = compact
    ? P([[-0.08, 0.52], [0.2, 0.62], [0.28, 0.12], [0.55, 0.22], [0.82, 0.32], [0.86, 0.5], [1.08, 0.36]], W, H)
    : P([[-0.06, 0.8], [0.22, 0.96], [0.26, 0.18], [0.5, 0.3], [0.74, 0.42], [0.8, 0.72], [1.06, 0.24]], W, H);
  return `M${p[0]}C${p[1]} ${p[2]} ${p[3]}C${p[4]} ${p[5]} ${p[6]}`;
}

function frontPath(W, H, compact, ring) {
  // access part, then a loop round the close ring (centre ring.x/y, radius ring.r)
  const head = compact
    ? `M${P([[1.08, 0.1]], W, H)}C${P([[0.6, -0.02], [-0.06, 0.12], [0.08, 0.42]], W, H).join(' ')}C${P([[0.2, 0.7], [0.92, 0.5], [0.98, 0.86]], W, H).join(' ')}`
    : `M${P([[-0.06, 0.1]], W, H)}C${P([[0.3, -0.02], [0.56, 0.16], [0.5, 0.52]], W, H).join(' ')}C${P([[0.46, 0.82], [0.12, 0.98], [0.16, 0.86]], W, H).join(' ')}`;
  const { x, y, r } = ring;
  const start = [x - r * 0.4, y + r * 0.92];
  let d = `${head}C${(0.3 * W).toFixed(1)} ${(0.9 * H).toFixed(1)} ${(start[0] - r * 0.3).toFixed(1)} ${(y + r).toFixed(1)} ${start[0].toFixed(1)} ${start[1].toFixed(1)}`;
  // loop round the ring: about 330 degrees, counter-clockwise on screen, ending on the right
  const a0 = Math.atan2(start[1] - y, start[0] - x);
  const steps = 8;
  for (let i = 1; i <= steps; i += 1) {
    const a = a0 - (i / steps) * Math.PI * 1.75;
    const rr = r * (1 + 0.02 * Math.sin(i));
    d += ` A${rr.toFixed(1)} ${rr.toFixed(1)} 0 0 0 ${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)}`;
  }
  return d;
}

export function buildRibbons({ W, H, compact, ring, word }) {
  const svgs = {
    back: document.querySelector('[data-ribbon="back"]'),
    weave: document.querySelector('[data-ribbon="weave"]'),
    front: document.querySelector('[data-ribbon="front"]'),
  };
  const width = compact ? Math.max(16, W * 0.045) : Math.max(22, Math.min(40, W * 0.022));
  const d = { back: backPath(W, H, compact), front: frontPath(W, H, compact, ring) };
  d.weave = d.back;
  const lengths = {};
  for (const [name, svg] of Object.entries(svgs)) {
    if (!svg) continue;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.querySelectorAll('path').forEach((p) => p.setAttribute('d', d[name]));
    lengths[name] = svg.querySelector('.rb__band').getTotalLength();
    svg.style.setProperty('--rb-w', `${width.toFixed(1)}px`);
    svg.style.setProperty('--rb-len', '0');
  }
  // the windows where the ribbon passes over the word: two vertical slices of its band
  const mask = svgs.weave && svgs.weave.querySelector('mask');
  if (mask) {
    const top = word.top - 20;
    const h = word.height + 40;
    const slices = compact ? [[0.1, 0.3], [0.62, 0.86]] : [[0.16, 0.33], [0.6, 0.78]];
    mask.replaceChildren(
      ...slices.map(([a, b]) => {
        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('x', String(a * W));
        r.setAttribute('width', String((b - a) * W));
        r.setAttribute('y', String(top));
        r.setAttribute('height', String(h));
        r.setAttribute('fill', '#fff');
        return r;
      }),
    );
  }
  return { svgs, lengths };
}
