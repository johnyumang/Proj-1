/**
 * Page chrome that depends on scroll position, independent of the story:
 *  - the navigation switches to its light look once the light sections reach it;
 *  - the mobile menu button;
 *  - the sticky buy bar appears after chapter 1 and hides over the footer.
 * One passive scroll listener, coalesced with requestAnimationFrame.
 */
export function initChrome() {
  const root = document.documentElement;
  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const light = document.querySelector('[data-light]');
  const footer = document.querySelector('.footer');
  const bar = document.querySelector('[data-buybar]');
  const second = document.querySelector('[data-chapter="fit"]');
  let queued = false;

  const update = () => {
    queued = false;
    const vh = window.innerHeight;
    if (nav && light) {
      nav.classList.toggle('is-light', light.getBoundingClientRect().top <= nav.offsetHeight / 2);
    }
    if (bar && second && footer) {
      // In the pinned story chapter 2 starts when its section reaches the top of the viewport;
      // as a plain page it counts once the section has come well into view.
      const threshold = root.classList.contains('is-story') ? 1 : vh * 0.6;
      const afterFirst = second.getBoundingClientRect().top <= threshold;
      const overFooter = footer.getBoundingClientRect().top < vh;
      bar.classList.toggle('is-visible', afterFirst && !overFooter);
    }
  };
  const request = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  update();

  if (nav && toggle) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (event) => {
      if (event.target.closest('.nav__link')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  return { update: request };
}
