/**
 * Story page entry. The page is complete without this file (all text, art and stills are in
 * the HTML). It adds the store switcher, pointer touches and, when the head script chose the
 * story presentation, the scroll story (loaded with a dynamic import so the text paints first).
 */
import { initLang } from './ui/lang.js';
import { initMagnetic, initTilt } from './ui/fx.js';

initLang();
initMagnetic();
initTilt();

const root = document.documentElement;
const stub = /[?&]stub=1/.test(window.location.search);

if (root.classList.contains('is-story') && !window.__storyGaveUp) {
  import('./story/index.js')
    .then(({ createStory }) => {
      if (window.__storyGaveUp) return;
      const story = createStory({ stub });
      story.start();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      reduced.addEventListener('change', () => {
        if (reduced.matches) {
          story.stop();
          root.classList.remove('is-story', 'is-intro', 'story-ready');
        }
      });
      if (import.meta.hot) import.meta.hot.dispose(() => story.stop());
    })
    .catch((err) => {
      console.error('[story] could not load; showing the plain page', err);
      root.classList.remove('is-story', 'is-intro');
    });
}
