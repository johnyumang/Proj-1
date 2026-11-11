/** FAQ accordion: real buttons with aria-expanded. Without scripts every answer is open. */
export function initFaq() {
  const root = document.querySelector('[data-faq]');
  if (!root) return;
  for (const item of root.querySelectorAll('.faq__item')) {
    const button = item.querySelector('.faq__button');
    const panel = item.querySelector('.faq__a');
    const set = (open) => {
      item.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    };
    set(false);
    button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
  }
  root.setAttribute('data-ready', '');
}
