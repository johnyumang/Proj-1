/**
 * Authored intro on first load (about 1.8 s), only at the top of a fresh navigation:
 * a navy sheet lifts off the pool-coloured field, the ring rises into place, the title sets
 * letter by letter, the bar and the scroll cue arrive. Skipped at once by any scroll, wheel,
 * touch or key. It is an additive layer: `value` (0 → 1) scales the belt's presence in
 * compose(); everything else it touches is its own inner elements, never scroll state.
 */
import { gsap, SplitText } from './gsap.js';

export function createIntro(onDone) {
  const root = document.documentElement;
  root.classList.add('is-intro');
  const o = { value: 0 };
  const overlay = document.querySelector('[data-intro]');
  const bar = document.querySelector('.bar');
  const title = document.querySelector('.gate__title');
  const line = document.querySelector('.gate__line');
  const cue = document.querySelector('.cue span');
  const splits = [SplitText.create(title, { type: 'chars' }), SplitText.create(line, { type: 'words', mask: 'words' })];
  const tl = gsap.timeline({ onComplete: finish });
  tl.fromTo(overlay, { yPercent: 0 }, { yPercent: -100, duration: 0.85, ease: 'power3.inOut' }, 0.1)
    .to(o, { value: 1, duration: 1.2, ease: 'back.out(1.4)' }, 0.4)
    .from(splits[0].chars, { yPercent: 100, opacity: 0, stagger: 0.02, duration: 0.5, ease: 'power3.out' }, 0.6)
    .from(splits[1].words, { yPercent: 110, stagger: 0.05, duration: 0.6, ease: 'power3.out' }, 0.75)
    .from(bar, { yPercent: -150, duration: 0.55, ease: 'power3.out' }, 1.15)
    .from(cue, { opacity: 0, y: -8, duration: 0.35 }, 1.45);

  const skipEvents = ['wheel', 'touchstart', 'keydown', 'scroll'];
  const skip = () => tl.progress(1);
  skipEvents.forEach((ev) => window.addEventListener(ev, skip, { passive: true, once: true }));

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    skipEvents.forEach((ev) => window.removeEventListener(ev, skip));
    root.classList.remove('is-intro');
    o.value = 1;
    splits.forEach((s) => s.revert());
    gsap.set([overlay, bar], { clearProps: 'transform' });
    if (onDone) onDone();
  }

  return {
    get value() {
      return o.value;
    },
    skip,
  };
}
