/**
 * The practical sections on the light background, in normal document flow:
 * The difference, (reviews), Size guide, Specifications, FAQ, Complete the kit, footer.
 */
import { html } from './html.js';
import { arrowIcon, externalLink, mediaUrl, plusIcon } from './parts.js';

function sectionHead({ id, eyebrow, headline, lede }) {
  return html`<header class="section__head">
      <p class="eyebrow">${eyebrow}</p>
      <h2 class="headline headline--section" id="${id}-title">${headline}</h2>
      ${lede ? html`<p class="lede">${lede}</p>` : ''}
    </header>`;
}

function difference({ content: c }) {
  const d = c.difference;
  return html`
<section class="section section--difference" id="difference" aria-labelledby="difference-title">
  <div class="section__inner">
    ${sectionHead({ id: 'difference', eyebrow: d.eyebrow, headline: d.headline, lede: d.title })}
    <div class="section__body">
      <div class="compare" role="table" aria-labelledby="difference-title">
        <div class="compare__head" role="row">
          <span class="compare__corner" role="cell"></span>
          ${d.columns.map((col, i) => html`<span class="compare__col${i === 0 ? ' compare__col--own' : ''}" role="columnheader">${col}</span>`)}
        </div>
        ${d.rows.map(
          ([feature, ...values]) => html`<div class="compare__row" role="row">
          <span class="compare__feature" role="rowheader">${feature}</span>
          ${values.map((value, i) => html`<span class="compare__value${i === 0 ? ' compare__value--own' : ''}" role="cell" data-col="${d.columns[i]}">${value}</span>`)}
        </div>`,
        )}
      </div>
    </div>
  </div>
</section>`;
}

/**
 * Renders only when src/content/reviews.json has entries exported from the real review
 * system: [{ "text": "...", "name": "...", "date": "2026-01-31", "url": "https://..." }].
 * No images are ever placed in or next to this band.
 */
function reviewsBand({ reviews, ui }) {
  const items = Array.isArray(reviews) ? reviews.filter((r) => r && r.text && r.name) : [];
  if (!items.length) return '';
  return html`
<section class="section section--reviews" id="reviews" aria-label="${ui.reviewsLabel}">
  <div class="section__inner">
    <ul class="reviews">${items.map(
      (r) => html`<li class="review"><blockquote class="review__text">${r.text}</blockquote><p class="review__by">${r.url ? externalLink({ label: r.name, href: r.url, className: 'review__name', ui }) : html`<span class="review__name">${r.name}</span>`}${r.date ? html` <time datetime="${r.date}">${r.date}</time>` : ''}</p></li>`,
    )}</ul>
  </div>
</section>`;
}

function sizeGuide({ content: c, ui }) {
  const s = c.size_guide;
  const [sizeCol, waistCol, bestCol] = s.columns;
  const units = ['in', 'cm'];
  return html`
<section class="section section--sizes" id="size-guide" aria-labelledby="size-guide-title" data-unit-scope>
  <div class="section__inner">
    ${sectionHead({ id: 'size-guide', eyebrow: s.eyebrow, headline: s.headline, lede: s.body })}
    <div class="section__body">
      <div class="units" role="radiogroup" aria-label="${ui.unitLabel}">${s.toggle.map(
        (label, i) => html`<label class="units__option"><input class="units__input" type="radio" name="waist-unit" value="${units[i]}"${i === 0 ? html` checked` : ''}><span class="units__label">${label}</span></label>`,
      )}</div>
      <table class="sizes">
        <thead><tr><th scope="col">${sizeCol}</th><th scope="col">${waistCol}</th><th scope="col">${bestCol}</th></tr></thead>
        <tbody>${s.rows.map(
          ([size, inches, cm, best]) => html`<tr><th scope="row">${size}</th><td class="sizes__waist"><span data-unit="in">${inches}</span><span data-unit="cm">${cm}</span></td><td>${best}</td></tr>`,
        )}</tbody>
      </table>
      <p class="section__more">${externalLink({ label: s.link.text, href: s.link.url, className: 'link link--strong', ui })}</p>
    </div>
  </div>
</section>`;
}

function specifications({ content: c }) {
  const s = c.specifications;
  return html`
<section class="section section--specs" id="specifications" aria-labelledby="specifications-title">
  <div class="section__inner">
    ${sectionHead({ id: 'specifications', eyebrow: s.eyebrow, headline: s.headline, lede: s.body })}
    <div class="section__body">
      <dl class="specs">${s.rows.map(([label, value]) => html`<div class="specs__row"><dt>${label}</dt><dd>${value}</dd></div>`)}</dl>
    </div>
  </div>
</section>`;
}

function faq({ content: c }) {
  const f = c.faq;
  return html`
<section class="section section--faq" id="faq" aria-labelledby="faq-title">
  <div class="section__inner">
    ${sectionHead({ id: 'faq', eyebrow: f.eyebrow, headline: f.headline, lede: f.body })}
    <div class="section__body">
      <div class="faq" data-faq>${f.items.map(
        (item, i) => html`<div class="faq__item is-open">
          <h3 class="faq__q"><button class="faq__button" type="button" id="faq-q-${i + 1}" aria-expanded="true" aria-controls="faq-a-${i + 1}"><span>${item.q}</span>${plusIcon}</button></h3>
          <div class="faq__a" id="faq-a-${i + 1}"><p>${item.a}</p></div>
        </div>`,
      )}</div>
    </div>
  </div>
</section>`;
}

function kit({ content: c, ui }) {
  const k = c.kit;
  return html`
<section class="section section--kit" id="kit" aria-labelledby="kit-title">
  <div class="section__inner">
    ${sectionHead({ id: 'kit', eyebrow: k.eyebrow, headline: k.headline, lede: k.body })}
    <div class="section__body">
      <ul class="kit">${k.items.map(
        (item) => html`<li class="kit__card">
          <h3 class="kit__name">${item.name}</h3>
          <a class="kit__link" href="${item.url}" target="_blank" rel="noopener" aria-label="${k.cta}: ${item.name} ${ui.newTab}"><span>${k.cta}</span>${arrowIcon}</a>
        </li>`,
      )}</ul>
    </div>
  </div>
</section>`;
}

export function renderFooter({ content: c, brief, ui, plan }) {
  const f = c.footer;
  const logoFile = f.logo.split('/').pop();
  return html`
<footer class="footer" id="footer">
  <p class="footer__strip">${f.strip}</p>
  <div class="footer__inner">
    <div class="footer__brand">
      <img class="footer__logo" src="./media/brand/${logoFile}" width="300" height="116" alt="${ui.logoAlt}" loading="lazy" decoding="async">
      <p class="footer__contact"><span class="footer__contact-label">${f.contact.label}</span> <a class="link" href="mailto:${f.contact.email}">${f.contact.email}</a></p>
    </div>
    <nav class="footer__nav" aria-label="${ui.footerNavLabel}">${Object.entries(f.columns).map(
      ([title, links]) => html`<div class="footer__col">
        <h2 class="footer__title">${title}</h2>
        <ul>${links.map(([label, href]) => html`<li>${externalLink({ label, href, className: 'footer__link', ui })}</li>`)}</ul>
      </div>`,
    )}</nav>
  </div>
  <div class="footer__base">
    <p class="footer__copy">${f.copyright}</p>
    <ul class="footer__legal">${f.legal.map(([label, href]) => html`<li>${externalLink({ label, href, className: 'footer__link', ui })}</li>`)}</ul>
    <p class="footer__preview">${brief.previewNote}</p>
  </div>
</footer>`;
}

export const renderSections = (ctx) => [difference(ctx), reviewsBand(ctx), sizeGuide(ctx), specifications(ctx), faq(ctx), kit(ctx)];

export { mediaUrl };
