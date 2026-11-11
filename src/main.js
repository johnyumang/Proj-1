/**
 * Entry point.
 *
 * The page is complete without this file (all text and the still images are in the HTML).
 * Scripts add: the colour choice state, the FAQ accordion, the unit toggle fallback, the
 * navigation and buy-bar behaviour and, when motion is welcome and the viewport is tall
 * enough to pin a chapter, the scroll-driven story.
 */
import { createStory } from './story/index.js';
import { initChrome } from './ui/chrome.js';
import { initColorChoice } from './ui/color.js';
import { initFaq } from './ui/faq.js';
import { initUnits } from './ui/units.js';

const root = document.documentElement;

initColorChoice();
initFaq();
initUnits();
const chrome = initChrome();

const planNode = document.getElementById('belt-plan');
const wordNode = document.querySelector('.figure__word');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// Same test as the inline script in index.html: a chapter needs 560 px of height when the text
// sits beside the model and 620 px when it sits below it.
const tallEnough = window.matchMedia('(min-height: 620px), (min-width: 900px) and (min-height: 560px)');
let story = null;

function update() {
  const wanted = planNode && !window.__storyGaveUp && !reducedMotion.matches && tallEnough.matches;
  if (wanted && !story) {
    root.classList.add('is-story');
    story = createStory({ plan: JSON.parse(planNode.textContent), word: wordNode ? wordNode.textContent : '' });
    story.start();
  } else if (!wanted) {
    if (story) story.stop();
    story = null;
    root.classList.remove('is-story', 'is-intro', 'story-ready');
  }
  chrome.update();
}

// Tell the inline guard in index.html that the scripts did start.
window.__storyReady = true;
clearTimeout(window.__storyGuard);

update();
reducedMotion.addEventListener('change', update);
tallEnough.addEventListener('change', update);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (story) story.stop();
  });
}
