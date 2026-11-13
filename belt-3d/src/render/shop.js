/**
 * The shop block on light paper, between Access and the Library: listings for women / men /
 * unisex, pack options, care guide with the mesh wash bag, trust signals.
 *
 * Pack choice works without JavaScript: radios plus :has() show the matching summary line and
 * buy label, all of which are rendered here. Store links carry data-listing / data-unisex so
 * the language switcher can swap URL and product name.
 */
import { html, raw, ext, pills, icons, viewIn, COLOR_IDS, COLOR_HEX } from './parts.js';
import { formatPrice } from '../content/packs.js';

const IMGS = {
  women: { src: 'media/Ostomy-BELT-WOMEN-BEIGE-SIIL-Ostomy-3-scaled-cut-w480.webp', w: 480, h: 720, alt: 'beige-front', color: 'beige' },
  men: { src: 'media/Siilostomy76890-683x1024-cut-w480.webp', w: 480, h: 720, alt: 'navy', color: 'navy' },
  unisex: { src: 'media/ostomy-belt-for-men-and-women-square-cut-w480.webp', w: 480, h: 480, alt: 'black-navy', color: null },
};

/** A belt drawn flat, folded: a band with a pocket panel and a tab. */
const flatBelt = (fill, y, dark) =>
  `<g transform="translate(0 ${y})"><rect x="40" y="0" width="320" height="64" rx="22" fill="${fill}"/><rect x="40" y="0" width="320" height="64" rx="22" fill="none" stroke="${dark}" stroke-width="2" opacity=".5"/><rect x="150" y="10" width="100" height="44" rx="12" fill="${dark}" opacity=".18"/><path d="M360 18h28a10 10 0 0 1 0 28h-28" fill="${fill}" stroke="${dark}" stroke-width="2" stroke-opacity=".4"/><path d="M60 32h70M270 32h70" stroke="${dark}" stroke-width="2" stroke-dasharray="4 6" opacity=".45"/></g>`;

function packArt() {
  const belts = [
    ['#f8cda0', '#9a6a3c'],
    ['#30375b', '#11152a'],
    ['#2f2925', '#000'],
  ];
  const stack = belts.map(([f, d], i) => `<g class="pa__belt pa__belt--${i + 1}">${flatBelt(f, 150 - i * 52, d)}</g>`).join('');
  return raw(`<svg class="pa" viewBox="0 0 440 300" aria-hidden="true" focusable="false">
    <ellipse cx="210" cy="250" rx="190" ry="22" fill="#e3d6c2"/>
    ${stack}
    <g class="pa__bag">${washBagSvg(true)}</g>
  </svg>`);
}

/** Mesh wash bag: fine white mesh, a coloured zip, a folded belt inside; drum circle behind (own drawing). */
function washBagSvg(small = false) {
  const t = small ? ' transform="translate(270 120) scale(.42)"' : '';
  return `<g${t}>
    ${small ? '' : '<circle cx="200" cy="190" r="170" fill="#d9e3ea"/><circle cx="200" cy="190" r="132" fill="#eef3f6"/><circle cx="200" cy="190" r="132" fill="none" stroke="#b7c6d1" stroke-width="6"/>'}
    <defs><pattern id="mesh${small ? 's' : ''}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H9M0 0V9" stroke="#c9d3da" stroke-width="1.4"/></pattern></defs>
    <rect x="70" y="96" width="260" height="210" rx="26" fill="#fbfcfd"/>
    <g opacity=".9"><rect x="104" y="170" width="190" height="56" rx="20" fill="#f8cda0"/><rect x="104" y="214" width="190" height="56" rx="20" fill="#e9b884"/><path d="M294 186h18a9 9 0 0 1 0 18h-18" fill="#f8cda0"/></g>
    <rect x="70" y="96" width="260" height="210" rx="26" fill="url(#mesh${small ? 's' : ''})" opacity=".85"/>
    <rect x="70" y="96" width="260" height="210" rx="26" fill="none" stroke="#c3ced6" stroke-width="3"/>
    <rect x="70" y="96" width="260" height="22" rx="11" fill="#c2623a"/>
    <path d="M86 107H314" stroke="#fbe1cf" stroke-width="3" stroke-dasharray="3 4"/>
    <rect x="290" y="100" width="26" height="40" rx="8" fill="#8f3f22"/>
  </g>`;
}

export function shopBlock({ content: c, ui3d, shop, packs, listings, alts }) {
  const en = listings.languages.find((l) => l.code === listings.default);
  const opt = c.colors.options;

  const listingCard = (kind) => {
    const img = IMGS[kind];
    const isUnisex = kind === 'unisex';
    const main = isUnisex ? en.unisex : en[kind][img.color];
    const key = isUnisex ? 'unisex' : `${kind}:${img.color}`;
    return html`<li class="lc lc--${kind}">
      <div class="lc__pic"><span class="lc__fold" aria-hidden="true"></span><img src="./${img.src}" width="${img.w}" height="${img.h}" alt="${alts[img.alt]}" loading="lazy" decoding="async"></div>
      <div class="lc__body">
        <h3 class="lc__title">${shop.cards[kind]}</h3>
        <p class="lc__name" data-listing-name="${key}">${main.name}</p>
        <p class="lc__label">${ui3d.colour}</p>
        <ul class="swatches">${COLOR_IDS.map((id, i) => {
          const target = isUnisex ? en.unisex : en[kind][id];
          return html`<li>${ext({
            href: target.url,
            label: opt[i],
            ui3d,
            cls: 'swatch',
            attrs: `data-${isUnisex ? 'unisex' : 'listing'}="${isUnisex ? '' : `${kind}:${id}`}"`,
            inner: html`<span class="swatch__dot" style="--sw:${COLOR_HEX[id]}" aria-hidden="true"></span><span class="swatch__name">${opt[i]}</span>`,
          })}</li>`;
        })}</ul>
        <p class="lc__cta">${ext({ href: main.url, label: c.clothes.cta, ui3d, cls: 'btn', attrs: isUnisex ? 'data-unisex=""' : `data-listing="${key}"` })}</p>
      </div>
    </li>`;
  };

  // Pack totals for every combination (option x add-on), shown by :has() in CSS.
  const combos = [];
  for (const o of packs.options) for (const add of [false, true]) combos.push({ o, add, cents: o.cents + (add ? packs.addon.cents : 0) });
  const buyPrefix = c.nav.cta.replace(c.meta.price, '');

  const [careLabel, careValue] = c.specifications.rows.find((r) => r[0] === 'Care');
  // "Machine wash on a gentle cycle, cold water, no bleach; air dry" -> split at its punctuation, words unchanged.
  const careSteps = careValue.split(/[,;]\s*/);
  const careIcons = [icons.washer, icons.cold, icons.nobleach, icons.airdry];
  const rinse = c.faq.items[3].a.split(/(?<=\.)\s+/).find((s) => s.startsWith('Rinse'));
  const spec = (name) => c.specifications.rows.find((r) => r[0] === name);

  const trust = [
    [icons.exchange, c.footer.strip],
    [icons.truck, c.close.lines[0]],
    [icons.clock, c.close.lines[1]],
    [icons.box, c.close.lines[2]],
  ];

  return html`<div class="shop" id="shop" data-sec="shop">
    <div class="shop__ribbon" aria-hidden="true"><svg viewBox="0 0 1600 2400" preserveAspectRatio="none"><path d="M1640 60C1200 140 1300 420 900 520S200 700 -40 980M-40 1500C400 1400 700 1700 1100 1660S1500 1900 1640 2100" pathLength="1"/></svg></div>

    <section class="shop__sec" aria-labelledby="listings-h">
      <header class="shop__head">
        <p class="eyebrow">${c.access.list[2].label} · ${c.access.list[2].value}</p>
        <h2 class="shop__title" id="listings-h">${shop.title}</h2>
        <p class="body shop__intro">${c.faq.items[5].a}</p>
        <p class="shop__view">${viewIn({ cur: en, ui3d, cls: 'textlink' })}</p>
      </header>
      <ul class="listings">${['women', 'men', 'unisex'].map(listingCard)}</ul>
    </section>

    <section class="shop__sec packs" aria-labelledby="packs-h">
      <div class="packs__art">${packArt()}</div>
      <form class="packs__form" action="#" onsubmit="return false">
        <h2 class="shop__title shop__title--sm" id="packs-h">${ui3d.packs}</h2>
        <fieldset class="packs__opts">
          <legend class="sr-only">${ui3d.packs}</legend>
          ${packs.options.map(
            (o, i) => html`<label class="po"><input type="radio" name="pack" value="${o.id}"${i === 0 ? raw(' checked') : ''}><span class="po__box"><span class="po__name">${o.label}</span><span class="po__belts">${o.belts}</span><span class="po__price">${formatPrice(o.cents)}</span></span></label>`,
          )}
        </fieldset>
        <label class="po po--add"><input type="checkbox" name="addon" value="${packs.addon.id}"><span class="po__box"><span class="po__name">${packs.addon.label}</span><span class="po__price">+ ${formatPrice(packs.addon.cents)}</span></span></label>
        <p class="packs__inc">${icons.check}<span>${packs.included}</span></p>
        <p class="packs__hint"><span class="sr-only">${ui3d.colour}: </span>${COLOR_IDS.map((id, i) => html`<span class="hint-sw"><span class="swatch__dot" style="--sw:${COLOR_HEX[id]}" aria-hidden="true"></span>${opt[i]}</span>`)}</p>
        <p class="packs__summary" aria-live="polite">${combos.map(
          (k) => html`<span class="sum" data-pack="${k.o.id}" data-add="${k.add ? 1 : 0}">${ui3d.selected} ${k.o.label} · ${k.o.belts}${k.add ? ` · ${packs.addon.item}` : ''} · ${packs.included} — <strong>${formatPrice(k.cents)}</strong></span>`,
        )}</p>
        <p class="packs__cta">${ext({
          href: en.unisex.url,
          label: '',
          ui3d,
          cls: 'btn btn--lg',
          attrs: 'data-unisex=""',
          inner: html`${combos.map((k) => html`<span class="sum" data-pack="${k.o.id}" data-add="${k.add ? 1 : 0}">${buyPrefix}${formatPrice(k.cents)}</span>`)}`,
        })}</p>
      </form>
    </section>

    <section class="shop__sec care" aria-labelledby="care-h">
      <div class="care__art">${raw(`<svg class="bag" viewBox="0 0 400 380" aria-hidden="true" focusable="false">${washBagSvg(false)}</svg>`)}<p class="care__bag">${packs.addon.item}</p></div>
      <div class="care__body">
        <h2 class="shop__title shop__title--sm" id="care-h">${careLabel}</h2>
        <ol class="steps">${careSteps.map((s, i) => html`<li class="step">${careIcons[i]}<span class="step__t">${s}</span></li>`)}</ol>
        <p class="care__rinse">${icons.rinse}<span>${rinse}</span></p>
        ${pills([c.pool.chips[2]])}
      </div>
    </section>

    <section class="shop__sec trust" aria-label="${spec('Shipping')[0]} · ${spec('Returns')[0]}">
      <ul class="trust__row">${trust.map(([ic, t]) => html`<li>${ic}<span>${t}</span></li>`)}</ul>
      <p class="trust__returns">${icons.returns}<span>${c.close.returns}</span></p>
      <dl class="trust__specs">${['Shipping', 'Returns'].map((n) => html`<div><dt>${spec(n)[0]}</dt><dd>${spec(n)[1]}</dd></div>`)}</dl>
    </section>
  </div>`;
}
