/**
 * One ScrollTrigger per chapter, each owning one scrubbed timeline.
 *
 * A timeline runs from 0 to 1 over its chapter's scroll range and contains
 *  - tweens on the chapter's stage proxy (pose, cross-fade, accent, frame index, push-in …);
 *  - tweens on the chapter's own text: headlines line by line out of a blur, blocks, lists,
 *    counters, hotspots.
 * No tween carries its own ScrollTrigger. Every tween is an explicit fromTo with
 * immediateRender off, and the starting look is set once up front, so a timeline shows the
 * same thing at a given progress no matter how it got there (forwards, backwards, a jump).
 */
import { gsap, SplitText } from './gsap.js';
import { CHAPTERS, SCRUB, configFor } from './chapters.js';
import { DETAIL_EXIT } from './stage.js';

const SHIFT = 22; // px a block travels when it enters or leaves
const LINE_SHIFT = 60; // % of its own height a headline line travels

export function buildTimelines({ story, stage, layout }) {
  const timelines = [];
  const splits = [];
  const touched = new Set(); // elements that receive inline styles, cleared on teardown
  const syncs = [];
  const chapters = [];
  const panelInfo = new Map();
  const restores = [];

  const set = (target, vars) => {
    const list = Array.isArray(target) ? target : [target];
    list.forEach((node) => touched.add(node));
    gsap.set(target, vars);
  };

  /** Turns the [data-a] elements of a panel into the units that enter and leave one by one. */
  function unitsOf(panel) {
    const units = [];
    for (const node of panel.querySelectorAll('[data-a]')) {
      const kind = node.dataset.a;
      if (kind === 'lines') {
        // aria "none": the split lines stay readable text; only the blurred copies are hidden.
        const split = SplitText.create(node, { type: 'lines', linesClass: 'line', aria: 'none' });
        splits.push(split);
        for (const line of split.lines) {
          // The blurred copy is drawn from an attribute, so the text exists only once in the document.
          const sharp = document.createElement('span');
          sharp.className = 'line__sharp';
          while (line.firstChild) sharp.appendChild(line.firstChild);
          const blur = document.createElement('span');
          blur.className = 'line__blur';
          blur.setAttribute('aria-hidden', 'true');
          blur.dataset.text = sharp.textContent;
          line.append(sharp, blur);
          units.push({ kind: 'line', el: line, sharp, blur });
        }
      } else if (kind === 'each') {
        for (const child of node.children) units.push({ kind: 'block', el: child });
      } else {
        units.push({ kind: 'block', el: node });
      }
    }
    return units;
  }

  function showUnit(unit, visible) {
    if (unit.kind === 'line') {
      set(unit.el, { yPercent: visible ? 0 : LINE_SHIFT });
      set(unit.sharp, { opacity: visible ? 1 : 0 });
      set(unit.blur, { opacity: 0 });
    } else {
      set(unit.el, { opacity: visible ? 1 : 0, y: visible ? 0 : SHIFT });
    }
  }

  function addEnter(tl, units, [from, to]) {
    const span = to - from;
    const each = span * 0.55;
    units.forEach((unit, i) => {
      const at = from + (units.length > 1 ? (span * 0.45 * i) / (units.length - 1) : 0);
      if (unit.kind === 'line') {
        tl.fromTo(unit.el, { yPercent: LINE_SHIFT }, { yPercent: 0, duration: each }, at)
          .fromTo(unit.blur, { opacity: 0 }, { opacity: 0.9, duration: each * 0.45 }, at)
          .fromTo(unit.blur, { opacity: 0.9 }, { opacity: 0, duration: each * 0.5 }, at + each * 0.5)
          .fromTo(unit.sharp, { opacity: 0 }, { opacity: 1, duration: each * 0.6 }, at + each * 0.4);
      } else {
        tl.fromTo(unit.el, { opacity: 0, y: SHIFT }, { opacity: 1, y: 0, duration: each }, at);
      }
    });
  }

  function addLeave(tl, units, [from, to]) {
    const span = to - from;
    const each = span * 0.6;
    units.forEach((unit, i) => {
      const at = from + (units.length > 1 ? (span * 0.4 * i) / (units.length - 1) : 0);
      if (unit.kind === 'line') {
        tl.fromTo(unit.el, { yPercent: 0 }, { yPercent: -LINE_SHIFT, duration: each }, at)
          .fromTo(unit.sharp, { opacity: 1 }, { opacity: 0, duration: each * 0.6 }, at)
          .fromTo(unit.blur, { opacity: 0 }, { opacity: 0.9, duration: each * 0.45 }, at)
          .fromTo(unit.blur, { opacity: 0.9 }, { opacity: 0, duration: each * 0.5 }, at + each * 0.5);
      } else {
        tl.fromTo(unit.el, { opacity: 1, y: 0 }, { opacity: 0, y: -SHIFT, duration: each }, at);
      }
    });
  }

  CHAPTERS.forEach((ch, index) => {
    const section = story.querySelector(`.chapter[data-chapter="${ch.id}"]`);
    const cfg = configFor(ch, layout);
    const p = stage.proxies[index];
    const isLast = index === CHAPTERS.length - 1;

    const tl = gsap.timeline({
      defaults: { ease: 'none', immediateRender: false, lazy: false },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        // The last chapter keeps its final frame for one more viewport while the light sections wipe over it.
        end: isLast ? 'bottom 200%' : 'bottom bottom',
        scrub: SCRUB,
        onToggle: (self) => {
          section.classList.toggle('is-active', self.isActive);
          if (self.isActive) stage.setFocus(index);
        },
      },
    });
    tl.to({}, { duration: 1 }, 0); // the timeline is exactly one unit long
    timelines.push(tl);

    // ----- Stage -----
    const move = cfg.move;
    if (move) {
      const [from, to] = move;
      const span = to - from;
      tl.fromTo(p, { x: p.start.x, y: p.start.y, s: p.start.s }, { x: p.pose.x, y: p.pose.y, s: p.pose.s, duration: span }, from);
      tl.fromTo(p, { a: 0 }, { a: 1, duration: span }, from);
      if (stage.runs[stage.runOf[index]].first === index) {
        // Dissolve to this chapter's image in the middle of the move. After chapter 4 it waits
        // until the detail has left.
        const afterDetail = index > 0 && CHAPTERS[index - 1].id === 'access';
        const [fadeFrom, fadeTo] = afterDetail ? [DETAIL_EXIT - 0.1, 0.9] : [0.25, 0.75];
        tl.fromTo(p, { m: 0 }, { m: 1, duration: span * (fadeTo - fadeFrom) }, from + span * fadeFrom);
      }
      if (p.wordEnd !== p.wordStart) {
        // The giant word leaves quickly and returns a little after the model has started to move.
        const at = p.wordEnd ? from + span * 0.2 : from;
        tl.fromTo(p, { word: p.wordStart }, { word: p.wordEnd, duration: span * (p.wordEnd ? 0.8 : 0.6) }, at);
      }
    }
    const held = move ? move[1] : 0;
    if (p.end.x !== p.pose.x || p.end.y !== p.pose.y || p.end.s !== p.pose.s) {
      tl.fromTo(p, { x: p.pose.x, y: p.pose.y, s: p.pose.s }, { x: p.end.x, y: p.end.y, s: p.end.s, duration: 1 - held }, held);
    }

    // Image sequence: a frame index tweened with snap; the stage redraws when the index changes.
    const keys = stage.chapterKeys[index];
    let frameWindow = null;
    let frameCount = 0;
    if (cfg.frames) {
      for (const color of keys.colors) {
        const entry = stage.visuals.get(keys.keys[color]);
        if (entry.seq && entry.chapters[0] === index) frameCount = Math.max(frameCount, entry.seq.count);
      }
      if (frameCount > 1) {
        frameWindow = cfg.frames;
        tl.fromTo(p, { frame: 0 }, { frame: frameCount - 1, snap: { frame: 1 }, duration: frameWindow[1] - frameWindow[0] }, frameWindow[0]);
      }
    }

    if (ch.id === 'access') {
      const add = (prop, [from, to]) => tl.fromTo(p, { [prop]: 0 }, { [prop]: 1, duration: to - from }, from);
      add('push', cfg.push);
      add('dissolve', cfg.dissolve);
      add('detailAlpha', cfg.detailIn);
      add('detail', cfg.detailSettle);
    }

    // ----- Hotspots: shown for a range of scroll (or, with a sequence, for their frame range) -----
    const spots = stage.hotspotLayers.find((layer) => layer.chapter === index);
    if (spots && cfg.hotspots) {
      const [inFrom, inTo] = cfg.hotspots.in;
      const [outFrom, outTo] = cfg.hotspots.out;
      spots.nodes.forEach(({ node, spot }, i) => {
        const line = node.querySelector('.hotspot__line');
        const note = node.querySelector('.hotspot__note');
        const nudge = node.dataset.side === 'right' ? -10 : 10;
        let from = inFrom + ((inTo - inFrom) * 0.3 * i) / Math.max(1, spots.nodes.length - 1);
        let span = (inTo - inFrom) * 0.7;
        let leaveFrom = outFrom;
        let leaveTo = outTo;
        if (frameWindow && frameCount > 1) {
          const timeOf = (frame) => frameWindow[0] + ((frame - 1) / (frameCount - 1)) * (frameWindow[1] - frameWindow[0]);
          if (spot.from > 1) {
            from = Math.max(from, timeOf(spot.from));
            span = Math.min(span, 0.05);
          }
          if (spot.to < frameCount) {
            leaveTo = Math.min(outTo, timeOf(spot.to) + 0.02);
            leaveFrom = Math.max(from + span, leaveTo - 0.04);
          }
        }
        set(node, { autoAlpha: 0 });
        set(line, { scaleX: 0 });
        set(note, { opacity: 0, x: nudge });
        tl.fromTo(node, { autoAlpha: 0 }, { autoAlpha: 1, duration: span * 0.4 }, from)
          .fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: span * 0.6 }, from + span * 0.2)
          .fromTo(note, { opacity: 0, x: nudge }, { opacity: 1, x: 0, duration: span * 0.5 }, from + span * 0.5)
          .fromTo(node, { autoAlpha: 1 }, { autoAlpha: 0, duration: leaveTo - leaveFrom }, leaveFrom);
      });
    }

    // ----- Text panels -----
    const windows = [];
    for (const panel of section.querySelectorAll('.panel')) {
      const schedule = cfg.panels[panel.dataset.panel] || { in: null, out: null };
      const units = unitsOf(panel);
      units.forEach((unit) => showUnit(unit, !schedule.in));
      if (schedule.in) addEnter(tl, units, schedule.in);
      if (schedule.out) addLeave(tl, units, schedule.out);
      const info = {
        panel,
        timeline: tl,
        on: null,
        onAt: schedule.in ? (schedule.in[0] + schedule.in[1]) / 2 : -1,
        offAt: schedule.out ? (schedule.out[0] + schedule.out[1]) / 2 : 2,
        settle: schedule.in ? Math.min(1, schedule.in[1] + 0.015) : 0,
      };
      windows.push(info);
      panelInfo.set(panel, info);
    }

    // ----- Counters: a number tweened by scroll and written to the DOM when it changes -----
    const counterEls = [...section.querySelectorAll('[data-counter]')];
    (cfg.counters || []).forEach((schedule, i) => {
      const node = counterEls[i];
      if (!node) return;
      const num = node.querySelector('.counter__num');
      const from = Number(node.dataset.from);
      const to = Number(node.dataset.to);
      const state = { value: from, shown: null };
      set(node, schedule.in ? { opacity: 0, y: SHIFT } : { opacity: 1, y: 0 });
      if (schedule.in) {
        tl.fromTo(node, { opacity: 0, y: SHIFT }, { opacity: 1, y: 0, duration: schedule.in[1] - schedule.in[0] }, schedule.in[0]);
      }
      if (schedule.out) {
        tl.fromTo(node, { opacity: 1, y: 0 }, { opacity: 0, y: -SHIFT, duration: schedule.out[1] - schedule.out[0] }, schedule.out[0]);
      }
      tl.fromTo(state, { value: from }, { value: to, duration: schedule.count[1] - schedule.count[0] }, schedule.count[0]);
      syncs.push(() => {
        const n = Math.round(state.value);
        if (n !== state.shown) {
          state.shown = n;
          num.textContent = String(n);
        }
      });
      restores.push(() => {
        num.textContent = String(to); // the plain page shows the final value
      });
    });

    // Only the panel that is on screen takes pointer input.
    syncs.push(() => {
      const t = tl.time();
      for (const info of windows) {
        const on = t >= info.onAt && t < info.offAt;
        if (on !== info.on) {
          info.on = on;
          info.panel.style.pointerEvents = on ? 'auto' : 'none';
        }
      }
    });

    chapters.push({ id: ch.id, anchor: section.id, section, trigger: tl.scrollTrigger, settle: cfg.settle || 0 });
  });

  return {
    chapters,
    panelInfo,
    sync() {
      for (const fn of syncs) fn();
    },
    kill() {
      for (const tl of timelines) {
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
        tl.kill();
      }
      gsap.set([...touched], { clearProps: 'opacity,visibility,transform' });
      for (const split of splits) split.revert();
      for (const fn of restores) fn();
      for (const info of panelInfo.values()) info.panel.style.removeProperty('pointer-events');
      for (const ch of chapters) ch.section.classList.remove('is-active');
    },
  };
}
