/**
 * Template fragments shared by the story page and the library page. No copy lives here:
 * strings come from src/content/belt.en.js (verified), ../content/ui3d.en.js (interface),
 * ../content/scenes.js and ../content/packs.js (owner-dictated) and the two JSON files.
 */
import { html, raw } from '../../../src/render/html.js';

export { html, raw };

export const COLOR_IDS = ['beige', 'navy', 'black'];
export const COLOR_HEX = { beige: '#f8cda0', navy: '#30375b', black: '#2f2925' };
/** BCP 47 tags for lang/hreflang, by listings.json code. */
export const LANG_TAG = { en: 'en-US', 'en-gb': 'en-GB', es: 'es', de: 'de', fr: 'fr' };

/** Link that leaves the preview: new tab, rel=noopener, a screen-reader hint. */
export function ext({ href, label, cls = 'btn', ui3d, attrs = '', inner = null }) {
  return html`<a class="${cls}" href="${href}" target="_blank" rel="noopener"${attrs ? raw(` ${attrs}`) : ''}>${inner ?? label}<span class="sr-only"> ${ui3d.newTab}</span></a>`;
}

/** Buy button to the product page (the store language switcher rewrites data-buy links). */
export const buy = ({ label, content, ui3d, cls = 'btn' }) => ext({ href: content.meta.product_url, label, cls, ui3d, attrs: 'data-buy' });

export const pills = (items, cls = '') =>
  html`<ul class="pills${cls ? ` ${cls}` : ''}">${items.map((t) => html`<li class="pill"><span class="pill__dot" aria-hidden="true"></span>${t}</li>`)}</ul>`;

/* --------------------------------------------------------------- flags (drawn, never emoji) */
const FLAG_BODY = {
  us: (() => {
    let s = '<rect width="24" height="16" fill="#fff"/>';
    for (let i = 0; i < 7; i += 1) s += `<rect y="${(i * 16) / 6.5}" width="24" height="${16 / 13}" fill="#b22234"/>`;
    s += '<rect width="10.4" height="8.6" fill="#3c3b6e"/>';
    for (let r = 0; r < 4; r += 1) for (let c = 0; c < 5; c += 1) s += `<circle cx="${1.3 + c * 2}" cy="${1.2 + r * 2.1}" r="0.42" fill="#fff"/>`;
    return s;
  })(),
  gb:
    '<rect width="24" height="16" fill="#012169"/><path d="M0 0L24 16M24 0L0 16" stroke="#fff" stroke-width="3.2"/><path d="M0 0L24 16M24 0L0 16" stroke="#c8102e" stroke-width="1.1"/><path d="M12 0V16M0 8H24" stroke="#fff" stroke-width="5"/><path d="M12 0V16M0 8H24" stroke="#c8102e" stroke-width="3"/>',
  es: '<rect width="24" height="16" fill="#aa151b"/><rect y="4" width="24" height="8" fill="#f1bf00"/>',
  de: '<rect width="24" height="16" fill="#000"/><rect y="5.33" width="24" height="5.34" fill="#dd0000"/><rect y="10.67" width="24" height="5.33" fill="#ffce00"/>',
  fr: '<rect width="24" height="16" fill="#fff"/><rect width="8" height="16" fill="#002395"/><rect x="16" width="8" height="16" fill="#ed2939"/>',
};

let flagSeq = 0;
export function flag(code) {
  flagSeq += 1;
  const id = `fc-${code}-${flagSeq}`;
  return raw(
    `<svg class="flag" viewBox="0 0 24 16" width="24" height="16" aria-hidden="true" focusable="false"><defs><clipPath id="${id}"><rect width="24" height="16" rx="3"/></clipPath></defs><g clip-path="url(#${id})">${FLAG_BODY[code]}</g><rect x="0.5" y="0.5" width="23" height="15" rx="2.5" fill="none" stroke="rgba(0,0,0,.18)"/></svg>`,
  );
}

/* --------------------------------------------------------------- icons (one line style) */
const I = (d, extra = '') =>
  raw(`<svg class="icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false"${extra}><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</g></svg>`);

export const icons = {
  arrow: raw('<svg class="icon icon--arrow" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'),
  chevron: raw('<svg class="icon icon--chev" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'),
  returns: I('<path d="M8 12a9 9 0 1 1 1 9"/><path d="M8 6v6h6"/>'),
  exchange: I('<path d="M6 11h18l-5-5"/><path d="M26 21H8l5 5"/>'),
  truck: I('<path d="M3 8h15v13H3z"/><path d="M18 12h6l4 5v4h-10"/><circle cx="9" cy="23" r="2.5"/><circle cx="23" cy="23" r="2.5"/>'),
  clock: I('<circle cx="16" cy="16" r="11"/><path d="M16 10v6l4 3"/>'),
  box: I('<path d="M5 10l11-5 11 5v12l-11 5-11-5z"/><path d="M5 10l11 5 11-5M16 15v12"/>'),
  calendar: I('<rect x="5" y="7" width="22" height="20" rx="3"/><path d="M5 13h22M11 4v6M21 4v6"/>'),
  washer: I('<rect x="6" y="4" width="20" height="24" rx="3"/><circle cx="16" cy="18" r="6"/><path d="M10 8h4"/><path d="M12.5 19c1.5-1.5 3.5 1.5 7 0"/>'),
  cold: I('<path d="M16 4v24M6 10l20 12M26 10L6 22"/><path d="M13 6l3 3 3-3M13 26l3-3 3 3"/>'),
  nobleach: I('<path d="M16 6l11 19H5z"/><path d="M6 6l20 20"/>'),
  airdry: I('<rect x="6" y="5" width="20" height="22" rx="2"/><path d="M6 11c5 3 15 3 20 0"/>'),
  rinse: I('<path d="M16 4c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z"/><path d="M12 20a4 4 0 0 0 4 4"/>'),
  check: I('<path d="M7 16l6 6 12-13"/>'),
};

/* --------------------------------------------------------------- language / store switcher */
export function langSwitch({ listings, ui3d, id = 'lang' }) {
  const cur = listings.languages.find((l) => l.code === listings.default);
  return html`<div class="lang" data-lang>
    <button class="lang__btn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="${id}-menu" data-lang-btn>
      <span data-lang-flag>${flag(cur.flag)}</span><span class="lang__label" data-lang-label>${cur.label}</span>${icons.chevron}<span class="sr-only">${ui3d.store}</span>
    </button>
    <div class="lang__panel" id="${id}-menu" data-lang-panel>
      <ul class="lang__list" role="menu" aria-label="${ui3d.store}">
        ${listings.languages.map(
          (l) => html`<li role="none"><a role="menuitemradio" aria-checked="${l.code === cur.code ? 'true' : 'false'}" tabindex="-1" href="?lang=${l.code}" hreflang="${LANG_TAG[l.code]}" lang="${LANG_TAG[l.code]}" data-code="${l.code}">${flag(l.flag)}<span>${l.label}</span></a></li>`,
        )}
      </ul>
      <p class="lang__hint">${ui3d.storeHint}</p>
      ${viewIn({ cur, ui3d })}
    </div>
  </div>`;
}

export const viewIn = ({ cur, ui3d, cls = 'lang__view' }) =>
  html`<a class="${cls}" href="${cur.belt_page}" target="_blank" rel="noopener" hreflang="${LANG_TAG[cur.code]}" data-view-in>${ui3d.viewIn} <span data-view-label>${cur.label}</span><span class="sr-only"> ${ui3d.newTab}</span></a>`;

/* --------------------------------------------------------------- top bar and footer */
export function topBar({ content, ui3d, listings, home, chapters = [], libraryHref }) {
  return html`<header class="bar" data-bar>
    <a class="bar__brand" href="${home}">${content.nav.brand}</a>
    ${chapters.length
      ? html`<nav class="bar__chapters" aria-label="${ui3d.chapters}"><ol>${chapters.map(
          (c, i) => html`<li><a href="#${c.id}" data-chapter-link="${i}"><span class="bar__num">${ui3d.chapterNumbers[i]}</span><span class="sr-only"> ${c.word}</span></a></li>`,
        )}</ol></nav>`
      : ''}
    <div class="bar__end">
      ${libraryHref ? html`<a class="bar__link" href="${libraryHref}">${ui3d.library}</a>` : ''}
      ${langSwitch({ listings, ui3d })}
      ${buy({ label: content.nav.cta, content, ui3d, cls: 'btn btn--bar' })}
    </div>
    <div class="bar__progress" aria-hidden="true"><span data-progress></span></div>
  </header>`;
}

export function footer({ content, brief }) {
  return html`<footer class="foot">
    <p class="foot__strip">${content.footer.strip}</p>
    <p class="foot__note">${brief.previewNote}</p>
    <p class="foot__copy">${content.footer.copyright}</p>
  </footer>`;
}

/* --------------------------------------------------------------- library cards (typographic) */
export function formatDate(iso, ui3d) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${ui3d.months[m - 1]} ${d}, ${y}`;
}

const CARD_TONES = ['pool', 'beach', 'casual', 'office', 'ink', 'clay'];

export function postCard({ post, index, ui3d, size = 'std', headingLevel = 3 }) {
  const tone = CARD_TONES[index % CARD_TONES.length];
  const num = String(index + 1).padStart(2, '0');
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return html`<li class="post post--${size} tone--${tone}" data-reveal>
    <a class="post__link" href="${post.url}" target="_blank" rel="noopener" data-tilt>
      <span class="post__fold" aria-hidden="true">${raw(foldCorner(index))}</span>
      <span class="post__num" aria-hidden="true">${num}</span>
      <span class="post__meta"><span class="post__cat">${post.category}</span><time datetime="${post.date}">${formatDate(post.date, ui3d)}</time></span>
      ${raw(`<${H} class="post__title">`)}${post.title}${raw(`</${H}>`)}
      <span class="post__excerpt">${post.excerpt}</span>
      <span class="post__more">${ui3d.readArticle}${icons.arrow}<span class="sr-only"> ${ui3d.newTab}</span></span>
    </a>
  </li>`;
}

function foldCorner(i) {
  const flip = i % 2 ? ' transform="scale(-1 1) translate(-400 0)"' : '';
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true" focusable="false"><g${flip}><path d="M400 0V300C330 210 260 120 140 80C90 60 40 30 0 0Z" class="f1"/><path d="M400 0V170C350 120 300 80 220 50C180 30 150 15 130 0Z" class="f2"/></g></svg>`;
}
