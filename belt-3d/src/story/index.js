/**
 * The scroll story: builds the section timelines, composes their states into one StageState
 * per frame and hands it to the WebGL scene; writes the page's own layers (fields, scene art
 * planes, giant words, SVG ribbons, hotspots, counters, progress) from the same state.
 *
 * Data flow:  scroll → ScrollTrigger (scrub) → section timeline → section state object
 *             → compose() (latest started section wins; additive pointer/intro layers on top)
 *             → stage.apply(StageState) + DOM writes (transform, opacity, custom properties only)
 */
import { gsap, ScrollTrigger, SplitText } from './gsap.js';
import { buildTimelines, layoutConstants, GROUPS, ANCHORS } from './timelines.js';
import { buildRibbons } from './ribbons.js';
import { createIntro } from './intro.js';

const ACCENTS = ['#ffffff', '#fff6ea', '#fbf3e6', '#fffaf2', '#d1b07a', '#b39062', '#fbf3e6'];
const PLANE_RATE = { far: 0.35, mid: 0.7, near: 1.05 };
const COLOR_NAMES = ['beige', 'navy', 'black'];

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const ACC_RGB = ACCENTS.map(hexToRgb);
function accentAt(f) {
  const i = Math.max(0, Math.min(ACCENTS.length - 1.001, f));
  const a = ACC_RGB[Math.floor(i)];
  const b = ACC_RGB[Math.floor(i) + 1] || a;
  const t = i - Math.floor(i);
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * t));
  return { int: (c[0] << 16) | (c[1] << 8) | c[2], css: `rgb(${c.join(',')})` };
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Writes a style value only when it changed. */
const cache = new WeakMap();
function put(el, prop, value) {
  let m = cache.get(el);
  if (!m) cache.set(el, (m = {}));
  if (m[prop] === value) return;
  m[prop] = value;
  if (prop.startsWith('--')) el.style.setProperty(prop, value);
  else el.style[prop] = value;
}

export function createStory({ stub = false } = {}) {
  const root = document.documentElement;
  const canvas = document.querySelector('[data-canvas]');
  const sectionEls = [...document.querySelectorAll('main [data-sec]')].filter((el) => el.dataset.sec !== 'shop');
  const compactQ = window.matchMedia('(max-width: 899px)');
  const midQ = window.matchMedia('(max-width: 1199px)');
  const fineQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  let stage = null;
  let built = null;
  let L = null;
  let layout = 'desktop';
  let dom = null;
  let ribbons = null;
  let size = { w: 0, h: 0 };
  let running = false;
  let ticking = false;
  let intro = null;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const lastTime = { t: 0 };

  /* ------------------------------------------------------------ measuring */
  function fitWords() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    document.querySelectorAll('[data-word]').forEach((el) => {
      el.style.setProperty('--fs', '100px');
      const w = el.getBoundingClientRect().width || 1;
      const target = (layout === 'compact' ? 0.92 : 0.9) * W;
      const maxByHeight = ((layout === 'compact' ? 0.27 : 0.5) * H) / 0.86;
      el.style.setProperty('--fs', `${Math.min((100 * target) / w, maxByHeight).toFixed(1)}px`);
    });
  }

  function collect() {
    const byGroup = GROUPS.map(() => ({ field: null, planes: [], amb: [] }));
    const groupOf = { gate: 0, highlights: 5, access: 6, close: 7 };
    sectionEls.forEach((el) => {
      const kind = el.dataset.sec;
      const gi = kind === 'scene' ? Number(el.dataset.i) + 1 : groupOf[kind];
      if (gi === undefined) return;
      const g = byGroup[gi];
      g.el = el;
      g.mid = el.offsetTop + el.offsetHeight / 2;
      g.field = el.querySelector(':scope > [data-field]');
      el.querySelectorAll(':scope > [data-art] [data-plane]').forEach((p) => {
        const visibleArt = [...p.children].find((svg) => getComputedStyle(svg).display !== 'none') || p;
        g.planes.push({ el: p, rate: PLANE_RATE[p.dataset.plane], amb: [...visibleArt.querySelectorAll('[data-amb]')] });
      });
      g.word = el.querySelector(':scope > .word [data-word]');
    });
    const hl = document.querySelector('.sec--hl');
    const hs = [...hl.querySelectorAll('[data-hs-i]')].map((li) => ({
      li,
      dot: li.querySelector('.hs__dot'),
      line: li.querySelector('.hs__line'),
      card: li.querySelector('.hs__card'),
    }));
    const zipEl = document.querySelector('.hs--zip');
    const zip = { li: zipEl, dot: zipEl.querySelector('.hs__dot'), line: zipEl.querySelector('.hs__line'), card: zipEl.querySelector('.hs__card') };
    const counters = [...document.querySelectorAll('[data-count]')];
    const shop = document.querySelector('[data-sec="shop"]');
    const lib = document.querySelector('[data-sec="library"]');
    return {
      groups: byGroup,
      hs,
      zip,
      counters: { n7: counters[0], n140: counters[1], n30: counters[2] },
      progress: document.querySelector('[data-progress]'),
      rail: document.querySelector('[data-rail]'),
      railN: [...document.querySelectorAll('[data-rail-n]')],
      chapterLinks: [...document.querySelectorAll('[data-chapter-link]')],
      buybar: document.querySelector('[data-buybar]'),
      libRibbon: lib.querySelector('.lib__ribbon path'),
      cover: { top: shop.offsetTop, bottom: lib.offsetTop + lib.offsetHeight },
      storyEnd: document.querySelector('.sec--hl').offsetTop,
    };
  }

  /** Card anchor points for the hotspot leader lines, relative to the pin (= viewport when stuck). */
  function measureHotspots() {
    const pin = document.querySelector('.sec--hl .pin');
    const pr = pin.getBoundingClientRect();
    dom.hs.forEach((h) => {
      const r = h.card.getBoundingClientRect();
      h.target = compactQ.matches ? { x: r.left - pr.left + r.width / 2, y: r.top - pr.top } : { x: r.left - pr.left, y: r.top - pr.top + 30 };
    });
  }

  /* ------------------------------------------------------------ compose */
  function current() {
    const secs = built.sections;
    for (let i = secs.length - 1; i >= 0; i -= 1) if (secs[i].tl.progress() > 0) return secs[i];
    return secs[0];
  }

  function compose(time) {
    const sec = current();
    const s = sec.s;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const y = window.scrollY;
    // pointer parallax (additive, eased; off for touch and reduced motion)
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    const px = pointer.x;
    const py = pointer.y;
    const ip = intro ? intro.value : 1; // additive intro layer

    // fields and scene planes
    dom.groups.forEach((g, i) => {
      if (!g.el) return;
      const o = s[`o${i}`];
      const p = s[`p${i}`];
      if (g.field) {
        put(g.field, 'opacity', o.toFixed(3));
        put(g.field, '--on', o > 0.001 ? 'visible' : 'hidden');
      }
      const v = clamp((y + H / 2 - g.mid) / H, -2, 2);
      const axisY = i === 1 && sec.kind === 'scene' && sec.el.dataset.i === '0';
      g.planes.forEach((pl) => {
        const r = pl.rate;
        const slide = axisY ? 0 : p * W * (0.45 + 0.6 * r);
        const lift = axisY ? p * H * (0.25 + 0.55 * r) : 0;
        const tx = slide + px * 7 * (r + 0.2);
        const ty = lift - v * 36 * r + py * 5 * (r + 0.2);
        const visible = o > 0.001 && Math.abs(p) < 1.6;
        put(pl.el, 'opacity', visible ? o.toFixed(3) : '0');
        put(pl.el, '--on', visible ? 'visible' : 'hidden');
        if (visible) {
          put(pl.el, 'transform', `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0)`);
          // ambient motion inside the scene, driven by the ticker time
          pl.amb.forEach((a, j) => {
            const kind = a.dataset.amb;
            const t = time + j * 1.7;
            let tr = '';
            if (kind === 'ripple') tr = `translate(${(Math.sin(t * 0.35) * 40).toFixed(1)}px,${(Math.cos(t * 0.25) * 6).toFixed(1)}px)`;
            else if (kind === 'bob') tr = `translate(0,${(Math.sin(t * 0.9) * 4).toFixed(1)}px)`;
            else if (kind === 'shimmer') tr = `scale(${(1 + Math.sin(t * 1.3) * 0.04).toFixed(3)})`;
            else if (kind === 'glitter' || kind === 'foam') tr = `translate(${(Math.sin(t * 0.6) * 18).toFixed(1)}px,0)`;
            else if (kind === 'sway') tr = `rotate(${(Math.sin(t * 0.5) * 1.6).toFixed(2)}deg)`;
            else if (kind === 'steam') tr = `translate(0,${(-((t * 8) % 24)).toFixed(1)}px)`;
            else if (kind === 'beams') tr = `translate(${((t * 6) % 46 - 23).toFixed(1)}px,${((t * 3) % 23).toFixed(1)}px)`;
            else if (kind === 'glow') tr = `scale(${(1 + Math.sin(t * 0.8) * 0.05).toFixed(3)})`;
            if (tr) put(a, 'transform', tr);
            if (kind === 'steam') put(a, 'opacity', (0.8 - ((t * 8) % 24) / 30).toFixed(2));
          });
        }
      });
    });

    // giant words: w = -1 waiting below, 0 in place, 1 gone above (slid through the clip)
    for (let k = 0; k < 4; k += 1) {
      const g = dom.groups[k + 1];
      if (!g.word) continue;
      const w = s[`w${k}`];
      const on = w > -0.999 && w < 0.999;
      put(g.word, 'opacity', on ? '1' : '0');
      put(g.word.closest('.word'), '--on', on ? 'visible' : 'hidden');
      if (on) put(g.word, 'transform', `translate3d(${(px * 6).toFixed(1)}px,${(-w * 110).toFixed(2)}%,0)`);
    }

    // ribbons
    const acc = accentAt(s.acc);
    const rib = (name, a, b) => {
      const svg = ribbons.svgs[name];
      const len = ribbons.lengths[name] || 0;
      const d = Math.max(0, b - a);
      put(svg, '--rb-len', (d * len).toFixed(1));
      put(svg, '--rb-off', (-a * len).toFixed(1));
      put(svg, '--rb-color', name === 'front' ? (s.acc >= 5.5 ? acc.css : '#b39062') : acc.css);
    };
    rib('back', s.backA, s.backB);
    rib('weave', s.backA, s.backB);
    rib('front', s.frontA, s.frontB);
    if (dom.libRibbon) put(dom.libRibbon, '--draw', s.lib.toFixed(3));

    // counters (the figure is drawn from --n)
    if (dom.counters.n7) put(dom.counters.n7, '--n', String(Math.round(s.n7)));
    if (dom.counters.n140) put(dom.counters.n140, '--n', String(Math.round(s.n140)));
    if (dom.counters.n30) put(dom.counters.n30, '--n', String(Math.round(s.n30)));

    // progress: bar line over the whole page, rail over the story chapters
    const max = Math.max(1, document.documentElement.scrollHeight - H);
    put(dom.progress, 'transform', `scaleX(${clamp(y / max, 0, 1).toFixed(4)})`);
    put(dom.rail, 'transform', `scaleY(${clamp(y / Math.max(1, dom.storyEnd - H), 0, 1).toFixed(4)})`);
    const chapter = sec.kind === 'scene' && sec.tl.progress() > sec.h * 0.5 ? Number(sec.el.dataset.i) : sec.kind === 'scene' ? Number(sec.el.dataset.i) - 1 : -1;
    dom.railN.forEach((n, i) => n.classList.toggle('is-on', i === chapter));
    dom.chapterLinks.forEach((a, i) => a.classList.toggle('is-on', i === chapter));
    if (dom.buybar) {
      dom.buybar.classList.toggle('is-on', sec.kind !== 'gate');
      const cname = COLOR_NAMES[clamp(Math.round(s.color), 0, 2)];
      if (dom.buybar.dataset.c !== cname) dom.buybar.dataset.c = cname;
    }

    // the scene
    return {
      view: s.view,
      zoom: s.zoom,
      spin: s.spin + (1 - ip) * -2.2,
      tilt: s.tilt + py * 0.03,
      x: s.x + px * 0.004,
      y: s.y + py * 0.004,
      color: s.color,
      open: s.open,
      form: s.form,
      present: s.present * ip,
      ribbonA: s.ribbonA,
      ribbonB: s.ribbonB,
      drift: s.drift,
      peel: s.peel,
      accent: acc.int,
      time,
    };
  }

  function placeHotspots(s) {
    if (!stage) return;
    const sec = current();
    const hlOn = sec.kind === 'highlights' ? sec.s.hl : 0;
    const compact = compactQ.matches;
    dom.hs.forEach((h, i) => {
      const act = clamp(1 - Math.abs(sec.s.hlk - i), 0, 1);
      const cardOpacity = hlOn * (compact ? act : 0.38 + 0.62 * act);
      put(h.li, 'opacity', cardOpacity.toFixed(3));
      const a = hlOn > 0 ? stage.project(ANCHORS[i]) : null;
      const lineOn = a && a.visible ? hlOn * act : 0;
      put(h.dot, 'opacity', lineOn.toFixed(3));
      put(h.line, 'opacity', lineOn.toFixed(3));
      if (lineOn > 0) {
        const dx = h.target.x - a.x;
        const dy = h.target.y - a.y;
        put(h.dot, 'transform', `translate3d(${a.x.toFixed(1)}px,${a.y.toFixed(1)}px,0)`);
        put(h.line, 'transform', `translate3d(${a.x.toFixed(1)}px,${a.y.toFixed(1)}px,0) rotate(${Math.atan2(dy, dx).toFixed(4)}rad) scaleX(${Math.hypot(dx, dy).toFixed(1)})`);
      }
    });
    const zipOn = sec.kind === 'access' ? sec.s.zip : 0;
    const z = zipOn > 0 ? stage.project('zip') : null;
    const zo = z && z.visible ? zipOn : 0;
    put(dom.zip.li, 'opacity', zo.toFixed(3));
    if (zo > 0) {
      const tx = z.x + (compactQ.matches ? 40 : 70);
      const ty = z.y - (compactQ.matches ? 60 : 90);
      put(dom.zip.dot, 'transform', `translate3d(${z.x.toFixed(1)}px,${z.y.toFixed(1)}px,0)`);
      put(dom.zip.line, 'transform', `translate3d(${z.x.toFixed(1)}px,${z.y.toFixed(1)}px,0) rotate(${Math.atan2(ty - z.y, tx - z.x).toFixed(4)}rad) scaleX(${Math.hypot(tx - z.x, ty - z.y).toFixed(1)})`);
      put(dom.zip.card, 'transform', `translate3d(${tx.toFixed(1)}px,${(ty - 22).toFixed(1)}px,0)`);
    }
    void s;
  }

  /* ------------------------------------------------------------ ticker */
  const tick = (time) => {
    if (!built) return;
    lastTime.t = time;
    const y = window.scrollY;
    const H = window.innerHeight;
    // paper sections cover the stage: hide the rail, and draw nothing while they cover it fully
    root.classList.toggle('is-paper', y + H * 0.5 >= dom.cover.top && y + H * 0.5 <= dom.cover.bottom);
    if (y >= dom.cover.top && y + H <= dom.cover.bottom) return;
    const state = compose(time);
    if (stage) {
      stage.apply(state);
      placeHotspots(state);
    }
  };
  function startTicking() {
    if (ticking || document.hidden) return;
    ticking = true;
    gsap.ticker.add(tick);
  }
  function stopTicking() {
    if (!ticking) return;
    ticking = false;
    gsap.ticker.remove(tick);
  }
  const onVisibility = () => (document.hidden ? stopTicking() : startTicking());

  /* ------------------------------------------------------------ build / teardown */
  function build() {
    layout = compactQ.matches ? 'compact' : midQ.matches ? 'mid' : 'desktop';
    L = layoutConstants(layout);
    fitWords();
    dom = collect();
    const W = window.innerWidth;
    const H = window.innerHeight;
    const min = Math.min(W, H);
    const ring = { x: W / 2, y: H / 2 + L.clY * H, r: 0.2 * min * L.clZ + (layout === 'compact' ? 18 : 28) };
    const wordEl = dom.groups[1].word.parentElement;
    const wr = wordEl.getBoundingClientRect();
    ribbons = buildRibbons({ W, H, compact: layout === 'compact', ring, word: { top: wr.top, height: wr.height } });
    built = buildTimelines({ sections: sectionEls, L });
    ScrollTrigger.refresh();
    measureHotspots();
    size = { w: W, h: H };
    if (stage) stage.resize();
    tick(gsap.ticker.time);
  }

  function unbuild() {
    if (built) built.kill();
    built = null;
  }

  function rebuild() {
    if (!running) return;
    const y = window.scrollY;
    unbuild();
    build();
    window.scrollTo(0, y);
  }

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      if (window.innerWidth !== size.w || (!coarse && Math.abs(window.innerHeight - size.h) > 40)) rebuild();
      else if (stage) stage.resize();
    }, 150);
  };

  const onPointer = (e) => {
    if (!fineQ.matches) return;
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };

  /** Scroll position where a section's text has fully arrived. */
  const settleY = (b) => Math.round(b.st.start + (b.st.end - b.st.start) * Math.min(0.95, b.h + 0.2));

  const onClick = (e) => {
    if (!built || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (id === 'main') return;
    const b = built.sections.find((x) => x.el.id === id);
    if (!b && id !== 'top') return;
    e.preventDefault();
    window.scrollTo(0, b && b.kind !== 'gate' ? settleY(b) : 0);
    history.replaceState(history.state, '', id === 'top' ? location.pathname + location.search : `#${id}`);
    if (b) {
      b.el.setAttribute('tabindex', '-1');
      b.el.focus({ preventScroll: true });
    }
  };

  // keyboard: focus moving into a section whose text has not arrived scrolls it into its readable state
  const onFocusIn = (e) => {
    if (!built || !e.target.closest) return;
    const pin = e.target.closest('.pin, .close-more');
    if (!pin) return;
    const b = built.sections.find((x) => x.el.contains(pin));
    if (!b) return;
    const p = (window.scrollY - b.st.start) / Math.max(1, b.st.end - b.st.start);
    const sticky = pin.classList.contains('pin');
    if (sticky && (p < b.h + 0.15 || p > 1)) requestAnimationFrame(() => window.scrollTo(0, settleY(b)));
  };

  async function start() {
    running = true;
    build();
    window.__storyReady = true;
    clearTimeout(window.__storyGuard);
    root.classList.add('story-ready');

    if (location.hash) {
      const b = built.sections.find((x) => `#${x.el.id}` === location.hash);
      if (b && b.kind !== 'gate') window.scrollTo(0, settleY(b));
    }
    const nav = performance.getEntriesByType('navigation')[0];
    if (window.scrollY < 4 && !location.hash && (!nav || nav.type === 'navigate')) intro = createIntro(() => {
      intro = null;
    });

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('click', onClick);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('visibilitychange', onVisibility);
    startTicking();

    // fonts change line breaks and word widths: rebuild once they are in
    if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => running && rebuild());

    // the scene: three.js only through the scene module, loaded after the text has painted
    try {
      if (stub) {
        const { createDebugStage } = await import('./debug-stage.js');
        stage = createDebugStage(canvas);
      } else {
        const scene = await import('../scene/index.js');
        stage = await scene.createStage(canvas, { pixelRatio: Math.min(window.devicePixelRatio || 1, 2) });
      }
      if (!running) {
        stage.dispose();
        stage = null;
        return;
      }
      stage.resize();
      root.classList.add('stage-ready');
    } catch (err) {
      console.error('[story] the 3D stage could not start; showing the plain page', err);
      stop();
      root.classList.remove('is-story', 'is-intro', 'story-ready');
    }
  }

  function stop() {
    running = false;
    stopTicking();
    if (intro) intro.skip();
    unbuild();
    if (stage) stage.dispose();
    stage = null;
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('click', onClick);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('visibilitychange', onVisibility);
  }

  void SplitText;
  return { start, stop };
}
