/**
 * Store language switcher. Changes only the store links (buy buttons, listing names and URLs,
 * "View this page in …"); the page copy stays English. Choice kept in localStorage and in ?lang=.
 * Menu pattern: button (aria-haspopup, aria-expanded) + role=menu of menuitemradio links;
 * arrows / Home / End move, Escape closes and returns focus, Tab closes.
 */
import listings from '../content/listings.json';

const KEY = 'siil-belt-store-lang';
const byCode = new Map(listings.languages.map((l) => [l.code, l]));
const TAG = { en: 'en-US', 'en-gb': 'en-GB', es: 'es', de: 'de', fr: 'fr' };

function readChoice() {
  const q = new URLSearchParams(window.location.search).get('lang');
  if (q && byCode.has(q)) return q;
  try {
    const s = window.localStorage.getItem(KEY);
    if (s && byCode.has(s)) return s;
  } catch {
    /* storage blocked */
  }
  return listings.default;
}

function apply(code) {
  const L = byCode.get(code);
  if (!L) return;
  document.querySelectorAll('a[data-buy]').forEach((a) => (a.href = L.belt_page));
  document.querySelectorAll('a[data-unisex]').forEach((a) => (a.href = L.unisex.url));
  document.querySelectorAll('a[data-listing]').forEach((a) => {
    const [kind, color] = a.dataset.listing.split(':');
    a.href = L[kind][color].url;
  });
  document.querySelectorAll('[data-listing-name]').forEach((el) => {
    const key = el.dataset.listingName;
    if (key === 'unisex') el.textContent = L.unisex.name;
    else {
      const [kind, color] = key.split(':');
      el.textContent = L[kind][color].name;
    }
    el.setAttribute('lang', TAG[code]);
  });
  document.querySelectorAll('a[data-view-in]').forEach((a) => {
    a.href = L.belt_page;
    a.hreflang = TAG[code];
    const label = a.querySelector('[data-view-label]');
    if (label) label.textContent = L.label;
  });
  document.querySelectorAll('[data-lang]').forEach((root) => {
    const flagSrc = root.querySelector(`a[data-code="${code}"] .flag`);
    const slot = root.querySelector('[data-lang-flag]');
    if (flagSrc && slot) slot.replaceChildren(flagSrc.cloneNode(true));
    const label = root.querySelector('[data-lang-label]');
    if (label) label.textContent = L.label;
    root.querySelectorAll('a[data-code]').forEach((a) => a.setAttribute('aria-checked', String(a.dataset.code === code)));
  });
}

function save(code) {
  try {
    window.localStorage.setItem(KEY, code);
  } catch {
    /* storage blocked: the URL still carries it */
  }
  const url = new URL(window.location.href);
  if (code === listings.default) url.searchParams.delete('lang');
  else url.searchParams.set('lang', code);
  history.replaceState(history.state, '', url);
}

export function initLang() {
  const code = readChoice();
  apply(code);
  if (new URLSearchParams(window.location.search).get('lang') !== code && code !== listings.default) save(code);

  document.querySelectorAll('[data-lang]').forEach((root) => {
    const btn = root.querySelector('[data-lang-btn]');
    const items = [...root.querySelectorAll('a[data-code]')];
    const open = (focusIndex) => {
      root.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      const i = focusIndex ?? Math.max(0, items.findIndex((a) => a.getAttribute('aria-checked') === 'true'));
      items[i].focus();
    };
    const close = (returnFocus = true) => {
      if (!root.classList.contains('is-open')) return;
      root.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) btn.focus();
    };
    btn.addEventListener('click', () => (root.classList.contains('is-open') ? close() : open()));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        open(e.key === 'ArrowUp' ? items.length - 1 : undefined);
      }
    });
    root.addEventListener('keydown', (e) => {
      const i = items.indexOf(document.activeElement);
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (i >= 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
      } else if (i >= 0 && (e.key === 'Home' || e.key === 'End')) {
        e.preventDefault();
        items[e.key === 'Home' ? 0 : items.length - 1].focus();
      } else if (e.key === 'Tab' && i >= 0) {
        close(false);
      } else if (i >= 0 && e.key === ' ') {
        e.preventDefault();
        items[i].click();
      }
    });
    items.forEach((a) =>
      a.addEventListener('click', (e) => {
        e.preventDefault();
        apply(a.dataset.code);
        save(a.dataset.code);
        close();
      }),
    );
    document.addEventListener('pointerdown', (e) => {
      if (!root.contains(e.target)) close(false);
    });
  });
}
