/**
 * The pinned story: builds the stage and the seven chapter timelines, keeps them in step
 * with scroll, and tears everything down again.
 *
 * build()    stage + SplitText + one ScrollTrigger per chapter, then ScrollTrigger.refresh()
 * unbuild()  kills every trigger and timeline, reverts the split text, removes the stage
 *
 * The story is rebuilt when the viewport width changes (line breaks, layout and the model's
 * position all depend on it) and when the fonts arrive late. Because what is on screen is a
 * pure function of scroll position, a rebuild shows exactly the same frame again.
 */
import { gsap, ScrollTrigger } from './gsap.js';
import { COMPACT_QUERY, MID_QUERY } from './chapters.js';
import { createIntro } from './intro.js';
import { createStage } from './stage.js';
import { buildTimelines } from './timelines.js';
import { getChoice, onChoice } from '../ui/color.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createStory({ plan, word }) {
  const root = document.documentElement;
  const story = document.querySelector('[data-story]');
  const compactQuery = window.matchMedia(COMPACT_QUERY);
  const midQuery = window.matchMedia(MID_QUERY);
  const coarseQuery = window.matchMedia('(pointer: coarse)');
  let stage = null;
  let built = null;
  let intro = null;
  let running = false;
  let size = { w: 0, h: 0 };
  let resizeTimer = 0;
  let offChoice = null;

  function build() {
    const layout = compactQuery.matches ? 'compact' : midQuery.matches ? 'mid' : 'desktop';
    stage = createStage({ story, plan, word, layout, choice: getChoice() });
    stage.measure();
    stage.reset();
    built = buildTimelines({ story, stage, layout });
    root.classList.add('story-ready');
    ScrollTrigger.refresh();
    built.sync();
    stage.tick();
    size = { w: window.innerWidth, h: window.innerHeight };
  }

  function unbuild() {
    if (intro && !intro.finished) intro.skip();
    if (built) built.kill();
    if (stage) stage.dispose();
    built = null;
    stage = null;
    root.classList.remove('story-ready');
  }

  function rebuild() {
    if (!running) return;
    unbuild();
    build();
    stage.loadRest();
  }

  // One callback per frame: write counters and pointer state, then let the stage redraw if anything moved.
  const tick = () => {
    if (!built) return;
    built.sync();
    stage.tick();
  };

  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Phones resize the window when the address bar shows or hides; that is not a layout change.
      const heightChanged = !coarseQuery.matches && Math.abs(h - size.h) > 40;
      if (w !== size.w || heightChanged) rebuild();
    }, 160);
  };

  /** Scroll position at which a chapter is fully on screen. */
  const chapterY = (chapter) => Math.round(chapter.trigger.start + (chapter.trigger.end - chapter.trigger.start) * chapter.settle);

  // In-page links: "#top" and chapter anchors land where the chapter can be read, not at its
  // first, still empty frame. Links to the light sections are left to the browser.
  const onClick = (event) => {
    if (!built || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    const chapter = built.chapters.find((c) => c.anchor === id);
    if (id !== 'top' && !chapter) return;
    event.preventDefault();
    if (intro && !intro.finished) intro.skip();
    window.scrollTo(0, chapter ? chapterY(chapter) : 0);
    history.replaceState(null, '', chapter ? `#${id}` : window.location.pathname + window.location.search);
    if (chapter) {
      chapter.section.setAttribute('tabindex', '-1');
      chapter.section.focus({ preventScroll: true });
    }
  };

  // Keyboard: when focus moves to a control in a panel that is not on screen, scroll to it.
  const onFocusIn = (event) => {
    if (!built || !event.target.closest) return;
    const panel = event.target.closest('.panel');
    const info = panel && built.panelInfo.get(panel);
    if (!info || info.on) return;
    const trigger = info.timeline.scrollTrigger;
    const y = Math.round(trigger.start + (trigger.end - trigger.start) * info.settle);
    requestAnimationFrame(() => window.scrollTo(0, y));
  };

  async function start() {
    running = true;
    // Line breaks depend on the fonts. They are preloaded, so this is normally immediate; never wait long.
    let fontsReady = false;
    const fonts = (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      fontsReady = true;
    });
    await Promise.race([fonts, wait(1200)]);
    if (!running) return;

    build();
    gsap.ticker.add(tick);
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('click', onClick);
    story.addEventListener('focusin', onFocusIn);
    offChoice = onChoice((color) => stage && stage.setChoice(color));
    if (!fontsReady) fonts.then(rebuild);

    // A link straight to a chapter (…/#why) lands on the readable frame as well. Not on a
    // reload or a back/forward step: there the browser restores the reader's own position.
    const [navigation] = performance.getEntriesByType('navigation');
    const hashed = built.chapters.find((c) => `#${c.anchor}` === window.location.hash);
    if (hashed && hashed.id !== 'hero' && (!navigation || navigation.type === 'navigate')) {
      window.scrollTo(0, chapterY(hashed));
    }

    // Intro: only from the top of the page. A reload further down goes straight to that frame.
    // The other chapters' images load in the background once the first view is up.
    const loadRest = () => stage && stage.loadRest();
    if (window.scrollY < 8) {
      const current = stage;
      intro = createIntro({ stage, onDone: loadRest });
      intro.prepare();
      await Promise.race([stage.heroReady, wait(900)]);
      if (running && stage === current) intro.play();
    } else {
      root.classList.remove('is-intro');
      loadRest();
    }
  }

  function stop() {
    running = false;
    clearTimeout(resizeTimer);
    gsap.ticker.remove(tick);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('click', onClick);
    story.removeEventListener('focusin', onFocusIn);
    if (offChoice) offChoice();
    unbuild();
    root.classList.remove('is-intro');
  }

  return { start, stop };
}
