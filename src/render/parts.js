/**
 * Shared template fragments. No copy lives here: every string comes from the content
 * module (verified copy) or the ui module (interface and ARIA labels).
 */
import { html } from './html.js';

export const COLOR_IDS = ['beige', 'navy', 'black'];

/** Width a chapter image is shown at. The stage uses the same value, so both pick the same file. */
export const IMAGE_SIZES = '(max-width: 899px) 66vw, 30vw';

/** URL of a media file, relative to the page (the build uses base "./"). */
export const mediaUrl = (plan, rel) => `./${plan.base}/${rel.split('/').map(encodeURIComponent).join('/')}`;

export const srcset = (plan, visual) => visual.sources.map((s) => `${mediaUrl(plan, s.src)} ${s.w}w`).join(', ');

/** A link that leaves the preview (buying actions and store links). Opens in a new tab. */
export function externalLink({ label, href, className, ui, attrs = '', icon = '' }) {
  return html`<a class="${className}" href="${href}" target="_blank" rel="noopener" aria-label="${label} ${ui.newTab}"${attrs ? html` ${attrs}` : ''}>${icon}${label}</a>`;
}

export const buyButton = ({ label, content, ui, className = 'btn' }) =>
  externalLink({ label, href: content.meta.product_url, className, ui, attrs: html`data-buy` });

export const chips = (items, extra = '') =>
  html`<ul class="chips" data-a="each">${items.map((text) => html`<li class="chip">${text}</li>`)}${extra}</ul>`;

export const arrowIcon = html`<svg class="icon icon--arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const rulerIcon = html`<svg class="icon icon--ruler" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M3.5 15.5 15.5 3.5l5 5-12 12zM7.5 11.5l2 2M10.5 8.5l2 2M13.5 5.5l2 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * The live copy marks its size-guide links with a ruler pictograph. The words stay exactly as
 * they are; the pictograph is drawn as an icon in the page's own line style instead of an emoji,
 * which renders differently on every device.
 */
export function rulerLabel(label) {
  const m = /^\u{1F4CF}\s*(.*)$/u.exec(label);
  return m ? { text: m[1], icon: rulerIcon } : { text: label, icon: '' };
}

export const plusIcon = html`<svg class="icon icon--plus" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path class="icon__h" d="M5 12h14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path class="icon__v" d="M12 5v14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

/**
 * Static image for a chapter (shown as-is without JavaScript or with reduced motion; kept as
 * the text alternative of the stage when the story is pinned).
 * The wrapper carries the img-role description; the <img> itself is presentational.
 */
export function figure({ visual, plan, ui, color = null, eager = false, sizes = IMAGE_SIZES }) {
  const colorAttr = color ? html` data-color="${color}"` : '';
  if (visual.missing) {
    return html`<div class="figure"${colorAttr} role="img" aria-label="${ui.missingImage} ${visual.name}">
      <div class="plate plate--missing" style="--ar:${visual.width}/${visual.height}" data-placeholder="${visual.name}"><span class="plate__file">${visual.name}</span></div>
    </div>`;
  }
  const isPlaceholder = visual.mode === 'placeholder';
  const src = visual.mode === 'sequence' ? visual.poster : visual.src;
  const sources = visual.mode === 'sequence' ? null : visual.sources;
  const img = html`<img src="${mediaUrl(plan, src)}"${sources && sources.length > 1 ? html` srcset="${srcset(plan, visual)}" sizes="${sizes}"` : ''} width="${visual.width}" height="${visual.height}" alt="" decoding="async"${eager ? html` loading="eager" fetchpriority="high"` : html` loading="lazy"`}${isPlaceholder ? html` data-placeholder="${visual.name}"` : ''}>`;
  return html`<div class="figure"${colorAttr} role="img" aria-label="${visual.alt || ui.fallbackAlt}">
      <div class="${isPlaceholder && !visual.cutout ? 'plate' : 'cutout'}" style="--ar:${visual.width}/${visual.height}">${img}</div>
    </div>`;
}

/** "SIIL Ostomy Belt · {color} · pick size" with one span per colour; CSS shows the chosen one. */
export function colorLabel(content, className) {
  const [before, after = ''] = content.sticky.label.split('{color}');
  return html`<p class="${className}" data-buy-label>${before}${content.colors.options.map(
    (name, i) => html`<span class="color-name" data-color-name="${COLOR_IDS[i]}">${name}</span>`,
  )}${after}</p>`;
}
