/**
 * The stage: one full-viewport layer that stays put for the whole story.
 *
 * Back to front: ambient light, the giant word, the rig (floor light, rim light, the model
 * as canvas frames, stills or placeholder plates, hotspots) and the chapter-4 detail.
 *
 * The chapter timelines never touch these elements directly. Each chapter owns a small
 * plain object (its "proxy") and tweens numbers on it; the stage reads all proxies and
 * derives what is on screen. That makes the picture a pure function of scroll position:
 *  - position and scale are the hero pose plus the sum of every chapter's own movement,
 *    so chapters hand over without jumps even while one is still catching up (scrub lag);
 *  - reloading mid-page, scrolling backwards or jumping with a nav link cannot leave the
 *    stage in a stale state, whatever order the timelines happen to render in.
 * Only transform, opacity, the canvas and the accent custom property are written.
 */
import { gsap } from './gsap.js';
import { CHAPTERS } from './chapters.js';
import { Sequence, createQueue } from './loader.js';

const FRAME_ASPECT = 4 / 5; // width / height of the rig box, the format of the own-model plates
const COLORS = ['beige', 'navy', 'black'];
const ACCENT_TOKENS = {
  beige: '--accent-beige',
  ivory: '--accent-ivory',
  bronze: '--accent-bronze',
  blue: '--accent-blue',
};
const CHOICE_TOKENS = { beige: '--accent-beige', navy: '--accent-blue', black: '--accent-black' };
const DEFAULT_FOCAL = { x: 0.5, y: 0.55, w: 0.4, h: 0.4 };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const clamp01 = (v) => clamp(v, 0, 1);

function el(tag, className, parent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (parent) parent.appendChild(node);
  return node;
}

export function createStage({ story, plan, word, compact, choice: initialChoice }) {
  const rootStyle = getComputedStyle(document.documentElement);
  const nav = document.querySelector('[data-nav]');
  const bar = document.querySelector('[data-buybar]');
  const sections = Object.fromEntries(CHAPTERS.map((ch) => [ch.id, story.querySelector(`[data-chapter="${ch.id}"]`)]));
  const mode = compact ? 'compact' : 'desktop';
  const mediaUrl = (rel) => `./${plan.base}/${rel.split('/').map(encodeURIComponent).join('/')}`;
  const tokenRgb = (name) => gsap.utils.splitColor(rootStyle.getPropertyValue(name).trim() || '#9a7e4f').slice(0, 3);
  const accents = Object.fromEntries(Object.entries(ACCENT_TOKENS).map(([k, token]) => [k, tokenRgb(token)]));
  const choiceAccents = Object.fromEntries(Object.entries(CHOICE_TOKENS).map(([k, token]) => [k, tokenRgb(token)]));

  // ---------- DOM ----------
  const stageEl = el('div', 'stage');
  stageEl.setAttribute('aria-hidden', 'true');
  const ambientEl = el('div', 'stage__ambient', stageEl);
  const wordEl = el('p', 'stage__word', stageEl);
  const letters = [...word].map((ch) => {
    const span = el('span', 'stage__letter', wordEl);
    span.textContent = ch;
    return span;
  });
  const rigEl = el('div', 'stage__rig', stageEl);
  const rigInner = el('div', 'rig__inner', rigEl);
  el('div', 'rig__rim', rigInner);
  el('div', 'rig__floor', rigInner);
  const canvas = el('canvas', 'rig__canvas', rigInner);
  const ctx = canvas.getContext('2d');
  story.insertBefore(stageEl, story.firstChild);

  // ---------- Visuals: one entry per distinct image or sequence ----------
  const queue = createQueue({ concurrency: 4 });
  const visuals = new Map();
  let canvasStale = true;

  function markMissing(entry) {
    entry.missing = true;
    const frame = entry.el.firstElementChild;
    frame.className = 'plate plate--missing';
    frame.dataset.placeholder = entry.visual.name || '';
    frame.textContent = '';
    const label = el('span', 'plate__file', frame);
    label.textContent = entry.visual.name || '';
  }

  function register(visual, chapterIndex) {
    if (visuals.has(visual.key)) return visuals.get(visual.key);
    const entry = { key: visual.key, visual, weight: 0, rect: { left: 0, top: 0, w: 0, h: 0 }, shown: -1, chapters: [] };
    if (visual.mode === 'sequence') {
      const small = compact && visual.small;
      entry.seq = new Sequence({
        key: visual.key,
        base: mediaUrl(small ? visual.small.dir : visual.dir),
        frames: small ? visual.small.frames : visual.frames,
        width: small ? visual.small.width : visual.width,
        height: small ? visual.small.height : visual.height,
      });
      entry.seq.onFrame = () => {
        canvasStale = true;
      };
      entry.seq.preload(queue, chapterIndex);
    } else {
      entry.el = el('div', `rig__layer rig__layer--${visual.mode}`, rigInner);
      entry.el.dataset.key = visual.key;
      const frame = el('div', visual.mode === 'placeholder' ? 'plate' : 'cutout', entry.el);
      if (visual.missing) {
        markMissing(entry);
      } else {
        const img = el('img', '', frame);
        img.alt = '';
        img.decoding = 'async';
        img.width = visual.width;
        img.height = visual.height;
        if (visual.mode === 'placeholder') img.dataset.placeholder = visual.name;
        entry.img = img;
        const load = () =>
          new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = () => {
              markMissing(entry); // never a stand-in: a neutral card with the file name
              resolve();
            };
            if (visual.sources && visual.sources.length > 1) {
              img.srcset = visual.sources.map((s) => `${mediaUrl(s.src)} ${s.w}w`).join(', ');
              // The chapter-4 plate is pushed in until one detail fills the screen, so it needs the full file.
              img.sizes = entry.wide ? '100vw' : '(max-width: 899px) 58vw, 30vw';
            }
            img.src = mediaUrl(visual.src);
          });
        entry.load = load;
      }
    }
    visuals.set(visual.key, entry);
    return entry;
  }

  // Which image each chapter shows, per colour.
  const chapterKeys = CHAPTERS.map((ch, index) => {
    const def = plan.chapters[ch.id];
    const keys = {};
    for (const color of def.colors) {
      const visual = def.variants[color];
      const entry = register(visual, index);
      if (ch.id === 'access') entry.wide = true;
      entry.chapters.push(index);
      keys[color] = visual.key;
    }
    return { colors: def.colors, keys };
  });
  for (const entry of visuals.values()) {
    if (entry.load) queue.add(entry.load, { chapter: entry.chapters[0], urgent: entry.chapters[0] === 0 });
  }

  // Consecutive chapters that show the same image(s) form a run; images cross-fade between runs only.
  const runs = [];
  const runOf = [];
  chapterKeys.forEach((ck, index) => {
    const signature = ck.colors.map((c) => `${c}=${ck.keys[c]}`).join('|');
    const last = runs[runs.length - 1];
    if (last && last.signature === signature) last.chapters.push(index);
    else runs.push({ signature, first: index, chapters: [index], colors: ck.colors, keys: ck.keys });
    runOf[index] = runs.length - 1;
  });

  // ---------- Hotspots (chapter 2): only for parts that are visible in the image ----------
  const hotspotLayers = [];
  CHAPTERS.forEach((ch, index) => {
    const ck = chapterKeys[index];
    if (ck.colors.length !== 1) return;
    const entry = visuals.get(ck.keys[ck.colors[0]]);
    const list = sections[ch.id].querySelector('[data-hotspots]');
    if (!list || !entry.visual.hotspots || !entry.visual.hotspots.length || entry.visual.missing) return;
    const layer = el('div', 'rig__hotspots', rigInner);
    layer.dataset.chapter = ch.id;
    const nodes = [];
    for (const spot of entry.visual.hotspots) {
      const item = list.querySelector(`[data-hotspot="${spot.id}"]`);
      if (!item) continue;
      item.classList.add('is-staged');
      const node = el('div', 'hotspot', layer);
      node.dataset.id = spot.id;
      node.dataset.side = compact ? 'right' : spot.side;
      node.style.setProperty('--x', spot.x);
      node.style.setProperty('--y', spot.y);
      el('span', 'hotspot__dot', node);
      el('span', 'hotspot__line', node);
      const note = el('span', 'hotspot__note', node);
      el('span', 'hotspot__label', note).textContent = item.querySelector('.hotspots__label').textContent;
      el('span', 'hotspot__text', note).textContent = item.querySelector('.hotspots__text').textContent;
      nodes.push({ node, spot });
    }
    hotspotLayers.push({ chapter: index, entry, layer, nodes });
  });

  // ---------- Detail (chapter 4) ----------
  let detailEl = null;
  let detailImg = null;
  const detail = plan.detail;
  if (detail) {
    detailEl = el('div', 'stage__detail', stageEl);
    if (detail.missing) {
      detailEl.dataset.placeholder = detail.name || '';
      el('span', 'plate__file', detailEl).textContent = detail.name || '';
    } else {
      detailImg = el('img', '', detailEl);
      detailImg.alt = '';
      detailImg.decoding = 'async';
      if (detail.mode === 'placeholder') detailImg.dataset.placeholder = detail.name;
      const accessIndex = CHAPTERS.findIndex((ch) => ch.id === 'access');
      queue.add(
        () =>
          new Promise((resolve) => {
            detailImg.onload = detailImg.onerror = resolve;
            detailImg.src = mediaUrl(detail.src);
          }),
        { chapter: accessIndex },
      );
    }
  }
  const detailAspect = detail
    ? detail.crop
      ? (detail.crop.w * detail.width) / (detail.crop.h * detail.height)
      : detail.width / detail.height
    : FRAME_ASPECT;

  // ---------- Geometry ----------
  const g = { vw: 0, vh: 0, navH: 64, rigW: 0, rigH: 0, cx0: 0, cy0: 0, ux: 0, dpr: 1, detail: { w: 0, h: 0, cx: 0, cy: 0 } };

  function wordFontSize() {
    return parseFloat(getComputedStyle(wordEl).fontSize) || 144;
  }

  /** Room for the model above the text of a chapter on compact screens. */
  function compactZone(ch) {
    let textTop = Infinity;
    sections[ch.id].querySelectorAll('.panel').forEach((panel) => {
      textTop = Math.min(textTop, panel.offsetTop);
    });
    if (!Number.isFinite(textTop)) textTop = g.vh * 0.55;
    const peek = ch.word ? wordFontSize() * 0.36 : 0; // let the giant word show above the model
    const top = g.navH + 6 + peek;
    const height = clamp(textTop - 18 - top, g.vh * 0.2, Math.min(g.vh * 0.46, g.vw * 1.02));
    return { top, height };
  }

  function poseFor(ch) {
    const cfg = ch[mode];
    if (!compact) return { x: cfg.pose.x, y: cfg.pose.y, s: cfg.pose.s };
    const zone = compactZone(ch);
    return { x: cfg.pose.x || 0, y: (zone.top + zone.height / 2 - g.cy0) / g.vh, s: zone.height / g.rigH };
  }

  function containRect(visual) {
    const ar = visual.width / visual.height;
    let w;
    let h;
    if (ar <= FRAME_ASPECT) {
      h = g.rigH;
      w = h * ar;
    } else {
      w = g.rigW;
      h = w / ar;
    }
    // Plates are centred; cut-out figures stand on the floor line.
    const top = visual.mode === 'placeholder' ? (g.rigH - h) / 2 : g.rigH - h;
    return { left: (g.rigW - w) / 2, top, w, h };
  }

  function measure() {
    g.vw = stageEl.clientWidth;
    g.vh = stageEl.clientHeight;
    g.navH = nav ? nav.offsetHeight : 64;
    g.dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (compact) {
      g.rigH = Math.min(g.vh * 0.36, g.vw * 0.98);
      g.cx0 = g.vw / 2;
      g.cy0 = g.navH + 6 + g.rigH / 2;
      g.ux = g.vw * 0.14;
    } else {
      g.rigH = Math.min(g.vh * 0.66, g.vw * 0.5);
      g.cx0 = g.vw / 2;
      g.cy0 = g.navH + (g.vh - g.navH) / 2;
      g.ux = g.vw * 0.2;
    }
    g.rigW = g.rigH * FRAME_ASPECT;
    Object.assign(rigEl.style, {
      width: `${g.rigW}px`,
      height: `${g.rigH}px`,
      left: `${g.cx0 - g.rigW / 2}px`,
      top: `${g.cy0 - g.rigH / 2}px`,
    });

    for (const entry of visuals.values()) {
      entry.rect = containRect(entry.visual);
      if (entry.el) {
        Object.assign(entry.el.style, {
          left: `${entry.rect.left}px`,
          top: `${entry.rect.top}px`,
          width: `${entry.rect.w}px`,
          height: `${entry.rect.h}px`,
        });
      }
    }

    for (const hs of hotspotLayers) {
      const r = hs.entry.rect;
      Object.assign(hs.layer.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.w}px`, height: `${r.h}px` });
      for (const { node, spot } of hs.nodes) {
        const side = node.dataset.side;
        const toEdge = (side === 'right' ? 1 - spot.x : spot.x) * r.w;
        node.style.setProperty('--reach', `${Math.round(toEdge + (compact ? 4 : 14))}px`);
      }
    }

    // Canvas backing store: device pixels, capped at 2x.
    const cw = Math.round(g.rigW * g.dpr);
    const chh = Math.round(g.rigH * g.dpr);
    if (canvas.width !== cw || canvas.height !== chh) {
      canvas.width = cw;
      canvas.height = chh;
    }
    canvasStale = true;

    // The detail's resting place: beside the text on desktop, in the model's zone on compact screens.
    if (detailEl) {
      const access = CHAPTERS.find((ch) => ch.id === 'access');
      let h;
      let cx;
      let cy;
      if (compact) {
        const zone = compactZone(access);
        h = Math.min(zone.height, (g.vw * 0.8) / detailAspect);
        cx = g.vw / 2;
        cy = zone.top + zone.height / 2;
      } else {
        h = Math.min(g.vh * 0.62, (g.vw * 0.3) / detailAspect);
        cx = g.cx0 + g.ux;
        cy = g.cy0;
      }
      const w = h * detailAspect;
      g.detail = { w, h, cx, cy };
      Object.assign(detailEl.style, { width: `${w}px`, height: `${h}px`, left: `${cx - w / 2}px`, top: `${cy - h / 2}px` });
      if (detailImg) {
        if (detail.crop) {
          const c = detail.crop;
          Object.assign(detailImg.style, {
            width: `${100 / c.w}%`,
            height: `${100 / c.h}%`,
            left: `${(-(c.x - c.w / 2) / c.w) * 100}%`,
            top: `${(-(c.y - c.h / 2) / c.h) * 100}%`,
          });
        } else {
          Object.assign(detailImg.style, { width: '100%', height: '100%', left: '0', top: '0', objectFit: 'cover' });
        }
      }
    }

    // Each letter of the giant word shows its own slice of one gradient across the whole word.
    wordEl.style.setProperty('--word-w', `${wordEl.offsetWidth}px`);
    for (const letter of letters) letter.style.setProperty('--letter-x', `${letter.offsetLeft}px`);

    last.length = 0; // force the next render
  }

  // ---------- Proxies ----------
  let proxies = [];
  const choice = { beige: 0, navy: 0, black: 0 };
  choice[initialChoice] = 1;
  const intro = { light: 1 };

  /**
   * Creates the per-chapter proxies with their key values. Called once per build, after
   * measure(), before the timelines are made.
   */
  function reset() {
    proxies = [];
    let prevEnd = null;
    let prevWord = CHAPTERS[0].word;
    CHAPTERS.forEach((ch, index) => {
      const cfg = ch[mode];
      const pose = poseFor(ch);
      const drift = cfg.drift || {};
      const start = prevEnd || pose;
      const end = { x: pose.x + (drift.x || 0), y: pose.y + (drift.y || 0), s: pose.s + (drift.s || 0) };
      proxies.push({
        id: ch.id,
        x: start.x, y: start.y, s: start.s,
        start, pose, end,
        word: prevWord, wordStart: prevWord, wordEnd: ch.word,
        m: index === 0 ? 1 : 0, // cross-fade into this chapter's image (only used when it starts a run)
        a: index === 0 ? 1 : 0, // mix towards this chapter's accent
        frame: 0,
        push: 0, dissolve: 0, detail: 0, detailAlpha: 0, detailOut: 0,
      });
      prevEnd = end;
      prevWord = ch.word;
    });
    last.length = 0;
    return proxies;
  }

  // ---------- Render ----------
  const last = [];
  const snapshot = [];
  const cache = new Map();
  const setStyle = (node, prop, value) => {
    let own = cache.get(node);
    if (!own) cache.set(node, (own = {}));
    if (own[prop] === value) return;
    own[prop] = value;
    if (prop.startsWith('--')) node.style.setProperty(prop, value);
    else node.style[prop] = value;
  };
  const setAlpha = (node, alpha) => {
    const a = alpha < 0.002 ? 0 : alpha > 0.998 ? 1 : Math.round(alpha * 1000) / 1000;
    setStyle(node, 'opacity', String(a));
    setStyle(node, 'visibility', a === 0 ? 'hidden' : 'visible');
  };
  const accentSinks = [story, nav, bar].filter(Boolean);
  let canvasSignature = '';

  function collect() {
    let n = 0;
    for (const p of proxies) {
      snapshot[n++] = p.x; snapshot[n++] = p.y; snapshot[n++] = p.s; snapshot[n++] = p.word;
      snapshot[n++] = p.m; snapshot[n++] = p.a; snapshot[n++] = p.frame;
      snapshot[n++] = p.push; snapshot[n++] = p.dissolve; snapshot[n++] = p.detail; snapshot[n++] = p.detailAlpha; snapshot[n++] = p.detailOut;
    }
    snapshot[n++] = choice.beige; snapshot[n++] = choice.navy; snapshot[n++] = choice.black;
    snapshot[n++] = intro.light;
    snapshot.length = n;
    let changed = snapshot.length !== last.length || canvasStale;
    for (let i = 0; i < n && !changed; i += 1) changed = snapshot[i] !== last[i];
    if (changed) for (let i = 0; i < n; i += 1) last[i] = snapshot[i];
    last.length = n;
    return changed;
  }

  function render() {
    if (!proxies.length || !g.vw) return;

    // Pose: the hero pose plus every chapter's own movement.
    const first = proxies[0];
    let x = first.start.x;
    let y = first.start.y;
    let s = first.start.s;
    let wordAlpha = first.wordStart;
    for (const p of proxies) {
      x += p.x - p.start.x;
      y += p.y - p.start.y;
      s += p.s - p.start.s;
      wordAlpha += p.word - p.wordStart;
    }
    const cx = g.cx0 + x * g.ux;
    const cy = g.cy0 + y * g.vh;
    setStyle(rigEl, 'transform', `translate3d(${(cx - g.cx0).toFixed(2)}px, ${(cy - g.cy0).toFixed(2)}px, 0) scale(${s.toFixed(4)})`);
    setAlpha(wordEl, clamp01(wordAlpha));

    // Accent: start with the hero's, mix towards each later chapter's as it opens.
    const choiceRgb = [0, 1, 2].map((i) => COLORS.reduce((sum, c) => sum + choice[c] * choiceAccents[c][i], 0));
    const rgbOf = (name) => (name === 'choice' ? choiceRgb : accents[name] || accents.bronze);
    let accent = rgbOf(CHAPTERS[0].accent);
    for (let i = 1; i < proxies.length; i += 1) {
      const t = clamp01(proxies[i].a);
      if (t > 0) {
        const to = rgbOf(CHAPTERS[i].accent);
        accent = [0, 1, 2].map((k) => accent[k] + (to[k] - accent[k]) * t);
      }
    }
    const accentCss = `rgb(${Math.round(accent[0])} ${Math.round(accent[1])} ${Math.round(accent[2])})`;
    for (const sink of accentSinks) setStyle(sink, '--accent', accentCss);

    // Image weights: each run fades in when its first chapter opens and out when the next run does.
    for (const entry of visuals.values()) entry.weight = 0;
    for (let r = 0; r < runs.length; r += 1) {
      const run = runs[r];
      const fadeIn = r === 0 ? 1 : clamp01(proxies[run.first].m);
      const fadeOut = r + 1 < runs.length ? clamp01(proxies[runs[r + 1].first].m) : 0;
      let dissolved = 0;
      for (const index of run.chapters) dissolved = Math.max(dissolved, proxies[index].dissolve);
      const weight = fadeIn * (1 - fadeOut) * (1 - clamp01(dissolved));
      if (weight <= 0) continue;
      for (const color of run.colors) {
        visuals.get(run.keys[color]).weight += weight * (run.colors.length > 1 ? choice[color] : 1);
      }
    }
    let floor = 0;
    let rim = 0;
    const drawList = [];
    for (const entry of visuals.values()) {
      const w = clamp01(entry.weight);
      const light = entry.visual.light || { floor: 0.45, rim: 0.3 };
      floor += w * light.floor;
      rim += w * light.rim;
      if (entry.el) setAlpha(entry.el, w);
      else if (w > 0.002) drawList.push(entry);
    }
    setStyle(rigInner, '--floor', (clamp(floor, 0, 0.6) * intro.light).toFixed(3));
    setStyle(rigInner, '--rim', (clamp(rim, 0, 0.7) * intro.light).toFixed(3));
    setStyle(ambientEl, 'opacity', intro.light.toFixed(3));

    // Canvas: redraw only when a frame index or a weight changes.
    let signature = '';
    const draws = [];
    for (const entry of drawList) {
      let frame = 0;
      for (const index of entry.chapters) frame += proxies[index].frame;
      const hit = entry.seq.nearest(frame);
      if (!hit) continue;
      const alpha = Math.round(clamp01(entry.weight) * 100) / 100;
      signature += `${entry.key}:${hit.index}:${alpha};`;
      draws.push({ img: hit.img, alpha, rect: entry.rect });
    }
    if (signature !== canvasSignature || canvasStale) {
      canvasSignature = signature;
      canvasStale = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of draws) {
        ctx.globalAlpha = d.alpha;
        ctx.drawImage(d.img, d.rect.left * g.dpr, d.rect.top * g.dpr, d.rect.w * g.dpr, d.rect.h * g.dpr);
      }
      ctx.globalAlpha = 1;
    }

    // Chapter 4: push in on the focal region until it fills the frame.
    const accessIndex = CHAPTERS.findIndex((ch) => ch.id === 'access');
    const pa = proxies[accessIndex];
    const push = clamp01(pa.push);
    const accessKeys = chapterKeys[accessIndex];
    for (const color of accessKeys.colors) {
      const entry = visuals.get(accessKeys.keys[color]);
      const target = entry.el || canvas;
      if (push <= 0) {
        setStyle(target, 'transform', 'none');
        continue;
      }
      const f = entry.visual.focal || DEFAULT_FOCAL;
      const r = entry.rect;
      const localX = r.left + f.x * r.w;
      const localY = r.top + f.y * r.h;
      const screenX = cx + s * (localX - g.rigW / 2);
      const screenY = cy + s * (localY - g.rigH / 2);
      const fill = Math.max(g.vw / (f.w * r.w), g.vh / (f.h * r.h)) * 1.02; // scale at which the region covers the viewport
      const zoom = Math.pow(fill / s, push);
      const dx = (push * (g.vw / 2 - screenX)) / s;
      const dy = (push * (g.vh / 2 - screenY)) / s;
      const origin = entry.el ? `${(f.x * r.w).toFixed(1)}px ${(f.y * r.h).toFixed(1)}px` : `${localX.toFixed(1)}px ${localY.toFixed(1)}px`;
      setStyle(target, 'transformOrigin', origin);
      setStyle(target, 'transform', `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${zoom.toFixed(4)})`);
    }

    // … then the close view takes over at the same framing and settles beside the text.
    if (detailEl) {
      const settle = clamp01(pa.detail);
      const out = clamp01(pa.detailOut);
      const cover = Math.max(g.vw / g.detail.w, g.vh / g.detail.h) * 1.02;
      const scale = Math.pow(cover, 1 - settle);
      const tx = (g.vw / 2 - g.detail.cx) * (1 - settle);
      const ty = (g.vh / 2 - g.detail.cy) * (1 - settle) - out * g.vh * 0.04;
      setAlpha(detailEl, clamp01(pa.detailAlpha) * (1 - out));
      setStyle(detailEl, 'transform', `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`);
    }
  }

  function tick() {
    if (collect()) render();
  }

  // ---------- Colour choice ----------
  let choiceTween = null;
  function setChoice(color, { instant = false } = {}) {
    const to = { beige: 0, navy: 0, black: 0, [color]: 1 };
    if (choiceTween) choiceTween.kill();
    if (instant) Object.assign(choice, to);
    else choiceTween = gsap.to(choice, { ...to, duration: 0.6, ease: 'power3.out' });
  }

  function dispose() {
    queue.stop();
    if (choiceTween) choiceTween.kill();
    for (const hs of hotspotLayers) {
      for (const { spot } of hs.nodes) {
        const item = sections[CHAPTERS[hs.chapter].id].querySelector(`[data-hotspot="${spot.id}"]`);
        if (item) item.classList.remove('is-staged');
      }
    }
    for (const sink of accentSinks) sink.style.removeProperty('--accent');
    stageEl.remove();
  }

  return {
    el: stageEl,
    parts: { rigInner, letters, wordEl, ambientEl },
    intro,
    runs,
    runOf,
    hotspotLayers,
    visuals,
    chapterKeys,
    measure,
    reset,
    render,
    tick,
    setChoice,
    setFocus: (index) => queue.setFocus(index),
    dispose,
    get proxies() {
      return proxies;
    },
    get geometry() {
      return g;
    },
  };
}
