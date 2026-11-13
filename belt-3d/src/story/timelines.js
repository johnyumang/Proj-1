/**
 * One ScrollTrigger + one timeline per section. Every timeline has duration 1 (= its scroll
 * range) and tweens plain numbers on its own state object (plus the opacity/transform of its
 * own text). A section's state starts as a copy of the previous section's END state, so the
 * hand-over is continuous by construction; compose() then reads the state of the latest section
 * that has started. Picture = f(scroll position).
 *
 * Ranges: the gate runs from the top of the page until its end is reached ('top top' →
 * 'bottom bottom'); every later section from the moment its top enters the viewport ('top
 * bottom') to its end ('bottom bottom'). The first `h` (= one viewport) of each range is the
 * hand-over beat while the previous text scrolls away; the new text arrives right after it.
 */
import { gsap, ScrollTrigger, SplitText } from './gsap.js';

const TAU = Math.PI * 2;
export const GROUPS = ['gate', 'pool', 'beach', 'casual', 'office', 'hl', 'access', 'close'];
const SCENE_COLOR = [1, 0, 0, 2]; // pool navy, beach beige, casual beige, office black
/** spin phases for the highlights (0 = front panel to camera): pocket, fastening (side/back), fabric label */
export const HL_SPIN = [0, 2.2, TAU - 0.5];
export const ANCHORS = ['pocket', 'fastening', 'label'];

/** Per layout: where the belt stands and how big it is. */
export function layoutConstants(layout) {
  if (layout === 'compact') {
    return { y: -0.2, z: 0.74, gateY: 0.06, gateZ: 0.95, hlX: 0, hlY: -0.18, hlZ: 0.92, acX: 0, acY: -0.24, acZ: 0.72, clY: -0.13, clZ: 1.45 };
  }
  return { y: -0.02, z: 1, gateY: 0.1, gateZ: 1, hlX: layout === 'mid' ? -0.16 : -0.13, hlY: 0.02, hlZ: 1.32, acX: layout === 'mid' ? -0.25 : -0.23, acY: 0.02, acZ: 1, clY: 0, clZ: layout === 'mid' ? 1.95 : 2.1 };
}

function initialState(L) {
  const s = {
    view: 0, zoom: L.gateZ, spin: 0, tilt: 0, x: 0, y: L.gateY, color: 1, open: 0, form: 0, present: 1,
    ribbonA: 0, ribbonB: 0, drift: 0, peel: 0, acc: 0,
    w0: -1, w1: -1, w2: -1, w3: -1,
    backA: 0, backB: 0, frontA: 0, frontB: 0,
    hl: 0, hlk: 0, zip: 0, n7: 1, n140: 140, n30: 30, lib: 0,
  };
  GROUPS.forEach((g, i) => {
    s[`o${i}`] = g === 'gate' ? 1 : 0;
    s[`p${i}`] = 1;
  });
  return s;
}

/** next angle >= a (plus `min` of travel) that has phase `phase` mod 2π */
const forwardTo = (a, phase, min = 0.6) => {
  let t = Math.floor(a / TAU) * TAU + phase;
  while (t < a + min) t += TAU;
  return t;
};

export function buildTimelines({ sections, L, scrub = 0.8, onUpdate }) {
  const vh = window.innerHeight;
  const built = [];
  const splits = [];
  let state = initialState(L);

  for (const el of sections) {
    const kind = el.dataset.sec;
    const s = { ...state };
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none', duration: 0.1 } });
    const H = el.offsetHeight;
    const first = kind === 'gate';
    const range = first ? Math.max(1, H - vh) : H; // 'top top'→'bottom bottom' vs 'top bottom'→'bottom bottom'
    const h = first ? 0 : Math.min(0.5, vh / range);
    const to = (vars, at, dur, ease = 'none') => tl.to(s, { ...vars, duration: Math.max(0.001, dur), ease }, at);
    const set = (vars, at) => tl.set(s, vars, at);
    tl.set({}, {}, 1); // fix the duration at 1

    const textIn = (at) => {
      const items = [];
      el.querySelectorAll('[data-split]').forEach((node) => {
        const split = SplitText.create(node, { type: 'lines', mask: 'lines', linesClass: 'line' });
        splits.push(split);
        items.push(...split.lines);
      });
      const inEls = [...el.querySelectorAll('.pin [data-in], .pin .pill, .pin .stat')];
      if (items.length) tl.fromTo(items, { yPercent: 105 }, { yPercent: 0, duration: 0.07, stagger: 0.012, ease: 'power3.out', immediateRender: false }, at);
      if (inEls.length) tl.fromTo(inEls, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.06, stagger: 0.008, ease: 'power2.out', immediateRender: false }, at + 0.02);
    };

    if (kind === 'gate') {
      // look down through the ring, turn slowly, push in until the hole fills the screen
      to({ spin: 0.9 }, 0, 1);
      to({ zoom: 6.4 }, 0.05, 0.95, 'power2.in');
      to({ y: 0 }, 0.05, 0.5, 'power2.inOut');
      tl.to(el.querySelectorAll('[data-gate]'), { opacity: 0, y: -24, duration: 0.22, ease: 'power1.in' }, 0.04);
    } else if (kind === 'scene') {
      const k = Number(el.dataset.i);
      const g = k + 1; // group index
      const beat = h;
      if (k === 0) {
        // coming out of the ring: switch to the front view while nothing of the belt is in frame
        set({ view: 1, zoom: L.z, x: 0, y: L.y, present: 0, spin: -1.7, color: SCENE_COLOR[0], drift: 0 }, 0);
        to({ [`o${g}`]: 1 }, 0, beat * 0.25);
        to({ [`p${g}`]: 0 }, 0, beat * 0.95, 'power3.out');
        to({ o0: 0 }, beat * 0.3, beat * 0.3);
        to({ present: 1 }, beat * 0.15, beat * 0.85, 'back.out(1.5)');
        to({ spin: -0.6 }, beat * 0.15, beat * 0.85, 'power2.out');
        to({ w0: 0 }, beat * 0.3, beat * 0.7, 'power3.out');
        to({ drift: 1 }, beat * 0.4, beat * 0.6);
      } else {
        // one beat: belt turns once, colour blends, the old scene parts while the new arrives, words swap
        const s0 = s.spin;
        to({ spin: s0 + TAU - 1.2 }, 0, beat, 'power3.inOut');
        to({ zoom: L.z * 0.84 }, 0, beat * 0.5, 'power2.in');
        to({ zoom: L.z }, beat * 0.5, beat * 0.5, 'power2.out');
        to({ y: L.y + 0.03 }, 0, beat * 0.5, 'sine.inOut');
        to({ y: L.y }, beat * 0.5, beat * 0.5, 'sine.inOut');
        to({ color: SCENE_COLOR[k] }, beat * 0.25, beat * 0.5, 'sine.inOut');
        to({ acc: k }, beat * 0.3, beat * 0.4);
        to({ [`p${g - 1}`]: -1 }, 0, beat, 'power3.inOut');
        to({ [`o${g - 1}`]: 0 }, beat * 0.75, beat * 0.25);
        set({ [`p${g}`]: 1 }, 0);
        to({ [`p${g}`]: 0 }, 0, beat, 'power3.inOut');
        to({ [`o${g}`]: 1 }, beat * 0.1, beat * 0.45, 'sine.inOut');
        to({ [`w${k - 1}`]: 1 }, 0.0, beat * 0.5, 'power2.in');
        to({ [`w${k}`]: 0 }, beat * 0.5, beat * 0.5, 'power3.out');
        to({ ribbonA: 1, backA: 1 }, 0, beat * 0.4, 'power1.in');
        set({ ribbonA: 0, ribbonB: 0, backA: 0, backB: 0 }, beat * 0.42);
        to({ drift: 0.35 }, 0, beat * 0.4);
        to({ drift: 1 }, beat * 0.6, beat * 0.4);
      }
      // through the chapter: slow turn, ribbons draw on
      to({ spin: (k === 0 ? -0.6 : s.spin + TAU - 1.2) + 1.2 }, beat, 1 - beat);
      to({ ribbonB: 1 }, beat * 0.9, 0.42, 'power1.inOut');
      to({ backB: 1 }, beat * 0.7, 0.4, 'power1.inOut');
      to({ tilt: k % 2 ? -0.05 : 0.05 }, beat, 1 - beat, 'sine.inOut');
      if (el.querySelector('[data-count]')) {
        set({ n7: 1, n140: 55 }, 0);
        to({ n7: 7, n140: 140 }, beat + 0.06, 0.24, 'power2.out');
      }
      textIn(beat + 0.02);
    } else if (kind === 'highlights') {
      const g = 5;
      const beat = h;
      const base = forwardTo(s.spin, HL_SPIN[0], 1.4);
      to({ [`p4`]: -1 }, 0, beat, 'power3.inOut');
      to({ o4: 0 }, beat * 0.75, beat * 0.25);
      set({ [`p${g}`]: 1 }, 0);
      to({ [`p${g}`]: 0 }, 0, beat, 'power3.inOut');
      to({ [`o${g}`]: 1 }, beat * 0.1, beat * 0.45, 'sine.inOut');
      to({ w3: 1 }, 0, beat * 0.5, 'power2.in');
      to({ ribbonA: 1, backA: 1 }, 0, beat * 0.4, 'power1.in');
      set({ ribbonA: 0, ribbonB: 0, backA: 0, backB: 0 }, beat * 0.42);
      to({ spin: base }, 0, beat, 'power3.inOut');
      to({ color: 0 }, beat * 0.25, beat * 0.5, 'sine.inOut');
      to({ acc: 4 }, beat * 0.3, beat * 0.4);
      to({ x: L.hlX, y: L.hlY, zoom: L.hlZ, tilt: 0 }, 0, beat, 'power3.inOut');
      to({ drift: 0.4 }, 0, beat);
      textIn(beat);
      // three parts: pocket → fastening (VELCRO tab peels open and shut) → fabric
      const seg = (1 - beat) / 3;
      const t1 = beat + seg;
      const t2 = beat + seg * 2;
      to({ hl: 1 }, beat + 0.02, 0.05);
      to({ spin: base + 0.25 }, beat, seg * 0.9, 'sine.inOut');
      to({ spin: base - HL_SPIN[0] + HL_SPIN[1] }, t1, seg * 0.35, 'power2.inOut');
      to({ hlk: 1 }, t1, seg * 0.25, 'power2.inOut');
      to({ peel: 1 }, t1 + seg * 0.35, seg * 0.2, 'power2.out');
      to({ peel: 0 }, t1 + seg * 0.7, seg * 0.2, 'power2.in');
      to({ spin: base - HL_SPIN[0] + HL_SPIN[2] }, t2, seg * 0.35, 'power2.inOut');
      to({ hlk: 2 }, t2, seg * 0.25, 'power2.inOut');
      to({ spin: base - HL_SPIN[0] + HL_SPIN[2] + 0.25 }, t2 + seg * 0.35, seg * 0.6, 'sine.inOut');
      to({ hl: 0 }, 0.95, 0.05);
    } else if (kind === 'access') {
      const g = 6;
      const beat = h;
      to({ p5: -1 }, 0, beat, 'power3.inOut');
      to({ o5: 0 }, beat * 0.75, beat * 0.25);
      set({ [`p${g}`]: 1 }, 0);
      to({ [`p${g}`]: 0 }, 0, beat, 'power3.inOut');
      to({ [`o${g}`]: 1 }, beat * 0.1, beat * 0.45, 'sine.inOut');
      to({ x: L.acX, y: L.acY, zoom: L.acZ }, 0, beat, 'power3.inOut');
      to({ spin: forwardTo(s.spin, 0, 1.2) }, 0, beat, 'power3.inOut');
      to({ form: 1 }, beat * 0.3, beat * 0.7, 'power2.inOut');
      to({ acc: 5 }, beat * 0.3, beat * 0.4);
      to({ drift: 0.25 }, 0, beat);
      to({ open: 1 }, beat + 0.1, 0.2, 'power2.inOut');
      to({ zip: 1 }, beat + 0.22, 0.06);
      to({ frontB: 0.56 }, beat * 0.4, 0.6, 'power1.inOut');
      to({ zip: 0 }, 0.95, 0.05);
      textIn(beat);
    } else if (kind === 'library') {
      // the paper section covers the stage; only its own cards and ribbon move
      const cards = [...el.querySelectorAll('.post')];
      cards.forEach((c, i) => tl.fromTo(c, { '--rise': 0 }, { '--rise': 1, duration: 0.2, ease: 'power3.out', immediateRender: false }, 0.12 + i * 0.06));
      to({ lib: 1 }, 0.05, 0.6, 'power1.inOut');
    } else if (kind === 'close') {
      const g = 7;
      // hidden behind the library while it sets up: ring seen from above, rising into place
      set({ view: 0, x: 0, y: L.clY + 0.2, zoom: L.clZ, form: 0, open: 0, present: 0, color: 0, o6: 0, p6: 0, [`o${g}`]: 1, [`p${g}`]: 0, frontA: 0.56, frontB: 0.56, acc: 6, drift: 0, zip: 0, tilt: 0, n30: 0 }, 0);
      const beat = Math.min(0.45, vh / range);
      to({ present: 1 }, beat * 0.2, beat * 0.8, 'back.out(1.3)');
      to({ y: L.clY }, beat * 0.2, beat * 0.8, 'power3.out');
      to({ spin: s.spin + 1.4 }, 0, 1);
      to({ frontB: 1 }, beat * 0.4, beat * 1.4, 'power1.inOut');
      to({ drift: 0.6 }, beat, 0.2);
      to({ n30: 30 }, beat + 0.06, 0.18, 'power2.out');
      to({ zoom: L.clZ * 0.8, y: L.clY - 0.04 }, 0.7, 0.3, 'power1.inOut');
      textIn(beat);
    }

    // end state of this section = start state of the next
    tl.progress(1);
    state = { ...s };
    tl.progress(0);

    const st = ScrollTrigger.create({
      trigger: el,
      start: first ? 'top top' : 'top bottom',
      end: 'bottom bottom',
      animation: tl,
      scrub,
      invalidateOnRefresh: false,
      onUpdate,
    });
    built.push({ el, kind, tl, st, s, h, index: built.length });
  }

  return {
    sections: built,
    kill() {
      built.forEach((b) => {
        b.st.kill();
        b.tl.progress(0).kill();
      });
      splits.forEach((sp) => sp.revert());
    },
  };
}
