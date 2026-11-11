/**
 * The intro: a timed timeline that runs once on load, about 2.2 s, then leaves everything
 * to scroll. Black stage → floor light comes up → the model appears → the giant word
 * reveals letter by letter → hero copy → navigation last.
 *
 * It animates wrappers that no scroll timeline touches (the rig's inner layer, the single
 * letters, the hero's text groups, the nav), so there is nothing to hand over: scrolling
 * during the intro simply finishes it.
 */
import { gsap } from './gsap.js';

const SCROLL_KEYS = new Set([' ', 'PageDown', 'ArrowDown', 'End']);

export function createIntro({ stage, onDone }) {
  const root = document.documentElement;
  const nav = document.querySelector('[data-nav]');
  const groups = [...document.querySelectorAll('.chapter--hero .g')];
  const { rigInner, letters } = stage.parts;
  const targets = [nav, rigInner, ...letters, ...groups].filter(Boolean);
  let timeline = null;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    if (timeline) timeline.kill();
    stage.intro.light = 1;
    gsap.set(targets, { clearProps: 'opacity,visibility,transform' });
    root.classList.remove('is-intro');
    window.removeEventListener('wheel', skip);
    window.removeEventListener('touchmove', skip);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('scroll', onScroll);
    onDone();
  };
  const skip = () => {
    if (timeline && !finished) timeline.progress(1);
    else finish();
  };
  const onKey = (event) => {
    if (SCROLL_KEYS.has(event.key)) skip();
  };
  const onScroll = () => {
    if (window.scrollY > 2) skip();
  };

  return {
    /** Hides what the intro will reveal. Call in the same task that makes the story visible. */
    prepare() {
      stage.intro.light = 0;
      gsap.set(targets, { autoAlpha: 0 });
      root.classList.remove('is-intro');
      window.addEventListener('wheel', skip, { passive: true });
      window.addEventListener('touchmove', skip, { passive: true });
      window.addEventListener('keydown', onKey);
      window.addEventListener('scroll', onScroll, { passive: true });
    },
    play() {
      if (finished) return;
      timeline = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: finish });
      timeline
        .to(stage.intro, { light: 1, duration: 0.9 }, 0) // floor light comes up
        .fromTo(rigInner, { autoAlpha: 0, yPercent: 3 }, { autoAlpha: 1, yPercent: 0, duration: 0.9 }, 0.15) // the model appears
        // The hero copy comes in with the model, not after the show: the page is readable early.
        .fromTo(groups, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.05 }, 0.25)
        .fromTo(letters, { autoAlpha: 0, yPercent: 14 }, { autoAlpha: 1, yPercent: 0, duration: 0.7, stagger: 0.12 }, 0.45) // the giant word, letter by letter
        .fromTo(nav, { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 1.5); // navigation last; ends at 2.2 s
    },
    skip: finish,
    get finished() {
      return finished;
    },
  };
}
