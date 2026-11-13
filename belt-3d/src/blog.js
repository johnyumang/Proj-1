/**
 * Library page: store switcher, staggered clipped rise of the cards as they scroll in, tilt and
 * magnetic buttons. The page is complete without this file.
 */
import { initLang } from './ui/lang.js';
import { initMagnetic, initTilt } from './ui/fx.js';

initLang();
initMagnetic();
initTilt();

const root = document.documentElement;
if (root.classList.contains('can-reveal')) {
  const cards = [...document.querySelectorAll('[data-reveal]')];
  const io = new IntersectionObserver(
    (entries) => {
      const entering = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      entering.forEach((e, i) => {
        e.target.style.setProperty('--d', `${i * 0.08}s`);
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  cards.forEach((c) => io.observe(c));
}
