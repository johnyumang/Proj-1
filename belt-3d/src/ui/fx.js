/**
 * Small pointer effects, desktop only (fine pointer, motion welcome): magnetic buttons and a
 * slight 3D tilt of library cards toward the pointer. Both write custom properties only and
 * never change layout or what is readable.
 */
const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initMagnetic(root = document) {
  if (!fine()) return;
  root.addEventListener('pointermove', (e) => {
    const b = e.target.closest && e.target.closest('.btn');
    if (!b) return;
    const r = b.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    b.style.setProperty('--mx', `${(x * 5).toFixed(1)}px`);
    b.style.setProperty('--my', `${(y * 4).toFixed(1)}px`);
  });
  root.addEventListener(
    'pointerout',
    (e) => {
      const b = e.target.closest && e.target.closest('.btn');
      if (b && !b.contains(e.relatedTarget)) {
        b.style.setProperty('--mx', '0px');
        b.style.setProperty('--my', '0px');
      }
    },
    true,
  );
}

export function initTilt(root = document) {
  if (!fine()) return;
  root.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
    });
  });
}
