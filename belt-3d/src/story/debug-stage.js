/**
 * DEBUG ONLY (?stub=1): a 2D stand-in with the scene contract's surface, drawn from the same
 * StageState, so the choreography can be seen before/without the WebGL scene. Not used by
 * default; the page always uses createStage from ../scene/index.js.
 */
const FABRIC = [
  [248, 205, 160],
  [48, 55, 91],
  [47, 41, 37],
];
// angle of each anchor around the belt (0 = front panel); facing the camera when cos(angle + spin) > 0
const ANCHORS = { pocket: 0, zip: 0, fastening: -2.2, label: 0.5 };

const lerp = (a, b, t) => a + (b - a) * t;
const mixColor = (c) => {
  const i = Math.max(0, Math.min(1.999, c));
  const a = FABRIC[Math.floor(i)];
  const b = FABRIC[Math.min(2, Math.floor(i) + 1)];
  const t = i - Math.floor(i);
  return a.map((v, k) => Math.round(lerp(v, b[k], t)));
};
const rgb = (c, f = 1, a = 1) => `rgba(${c.map((v) => Math.round(Math.min(255, v * f))).join(',')},${a})`;

export function createDebugStage(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 1;
  let H = 1;
  let anchors = {};
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  function apply(s) {
    ctx.clearRect(0, 0, W, H);
    const view = s.view ?? 1;
    const zoom = s.zoom ?? 1;
    const spin = s.spin ?? 0;
    const present = s.present ?? 1;
    const min = Math.min(W, H);
    const cx = W / 2 + (s.x ?? 0) * W;
    const bob = Math.sin((s.time ?? 0) * 1.1) * 4;
    const cy = H / 2 + (s.y ?? 0) * H + (1 - present) * H * 0.9 + bob * (1 - view * 0) * 0.5;
    const R = lerp(0.2 * min, 0.3 * H * 0.9, view) * zoom;
    const ry = R * lerp(1, 0.24, view);
    const band = 0.2 * H * zoom * view; // height of the band in the front view
    const thick = lerp(0.045 * min * zoom, 0.012 * H * zoom, view);
    const col = mixColor(s.color ?? 0);

    if ((s.form ?? 0) > 0.01) {
      ctx.fillStyle = `rgba(220,210,196,${0.9 * s.form})`;
      const tw = R * 1.5;
      ctx.beginPath();
      ctx.roundRect(cx - tw / 2, cy - band * 2.2, tw, band * 4.6, tw * 0.3);
      ctx.fill();
    }
    const bandPath = (a0, a1) => {
      ctx.beginPath();
      for (let k = 0; k <= 40; k += 1) {
        const a = lerp(a0, a1, k / 40);
        ctx.lineTo(cx + R * Math.cos(a), cy + ry * Math.sin(a) - band / 2);
      }
      for (let k = 40; k >= 0; k -= 1) {
        const a = lerp(a0, a1, k / 40);
        ctx.lineTo(cx + R * Math.cos(a), cy + ry * Math.sin(a) + band / 2);
      }
      ctx.closePath();
    };
    // back half
    ctx.lineJoin = 'round';
    bandPath(Math.PI, Math.PI * 2);
    ctx.fillStyle = rgb(col, 0.7);
    ctx.strokeStyle = rgb(col, 0.6);
    ctx.lineWidth = thick;
    ctx.fill();
    ctx.stroke();
    // front half
    bandPath(0, Math.PI);
    ctx.fillStyle = rgb(col, 1.05);
    ctx.strokeStyle = rgb(col, 0.9);
    ctx.fill();
    ctx.stroke();

    // anchors and the front panel
    anchors = {};
    for (const [name, a0] of Object.entries(ANCHORS)) {
      const a = a0 + spin;
      const px = cx + R * Math.sin(a);
      const py = cy + ry * Math.cos(a) * 0.9 + (name === 'zip' ? band * 0.32 : name === 'label' ? -band * 0.25 : 0);
      anchors[name] = { x: px, y: py, visible: Math.cos(a) > 0.15 && present > 0.5 };
    }
    const fp = anchors.pocket;
    if (Math.cos(spin) > 0) {
      const w = R * 0.5 * Math.cos(spin);
      ctx.fillStyle = rgb(col, 0.85);
      ctx.beginPath();
      ctx.roundRect(fp.x - w / 2, fp.y - band * 0.36, w, band * 0.72, 12);
      ctx.fill();
      const open = s.open ?? 0;
      ctx.strokeStyle = `rgba(20,16,12,${0.4 + open * 0.5})`;
      ctx.lineWidth = 3 + open * 8;
      ctx.beginPath();
      ctx.moveTo(fp.x - w * 0.4, fp.y + band * 0.3);
      ctx.lineTo(fp.x + w * 0.4, fp.y + band * 0.3);
      ctx.stroke();
    }
    const fa = anchors.fastening;
    if (Math.cos(ANCHORS.fastening + spin) > 0) {
      const peel = s.peel ?? 0;
      ctx.fillStyle = rgb(col, 0.6);
      ctx.save();
      ctx.translate(fa.x, fa.y);
      ctx.rotate(-peel * 0.9);
      ctx.fillRect(0, -band * 0.25, R * 0.35, band * 0.5);
      ctx.restore();
    }

    // scene ribbon (drawn part ribbonA..ribbonB), sweeping in front of the belt
    const a = s.ribbonA ?? 0;
    const b = s.ribbonB ?? 0;
    if (b > a) {
      const acc = s.accent ?? 0xffffff;
      ctx.strokeStyle = `#${acc.toString(16).padStart(6, '0')}`;
      ctx.lineWidth = Math.max(8, 0.018 * H);
      ctx.lineCap = 'butt';
      ctx.beginPath();
      for (let k = 0; k <= 60; k += 1) {
        const t = lerp(a, b, k / 60);
        const x = lerp(cx - R * 1.8, cx + R * 1.8, t);
        const y = cy + Math.sin(t * Math.PI * 2.2) * ry * 1.6 + band * 0.1;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // floating pieces
    const drift = s.drift ?? 0;
    if (drift > 0.01) {
      const t = s.time ?? 0;
      for (let i = 0; i < 12; i += 1) {
        const px = ((i * 0.618 + 0.13) % 1) * W;
        const py = ((i * 0.377 + 0.21) % 1) * H + Math.sin(t * (0.4 + i * 0.05) + i) * 14;
        const sz = 8 + (i % 4) * 6;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(t * 0.2 + i);
        ctx.fillStyle = i % 2 ? rgb(col, 1, drift * 0.8) : `rgba(255,255,255,${drift * 0.7})`;
        ctx.fillRect(-sz / 2, -sz / 4, sz, sz / 2);
        ctx.restore();
      }
    }
  }

  return {
    apply,
    resize,
    dispose() {},
    project(name) {
      return anchors[name] || { x: W / 2, y: H / 2, visible: false };
    },
  };
}
