/**
 * The 3D scroll story, rendered to HTML at dev/build time (belt-3d/vite.config.js).
 *
 * The HTML is complete without JavaScript: every word, the scene art, the stills and the final
 * counter values are in it. Story mode (html.is-story) turns the art, words and fields into
 * fixed layers of one stage and the text panels into sticky pins; without it, every section is
 * a normal block (the plain presentation).
 */
import { html, raw, buy, ext, pills, icons, topBar, footer, postCard, COLOR_IDS } from './parts.js';
import { sceneArt, foldArt } from './art.js';
import { shopBlock } from './shop.js';

const STILLS = {
  beige: { src: 'media/Ostomy-BELT-WOMEN-BEIGE-SIIL-Ostomy-3-scaled-cut-w800.webp', small: 'media/Ostomy-BELT-WOMEN-BEIGE-SIIL-Ostomy-3-scaled-cut-w480.webp', w: 800, h: 1200, sw: 480, alt: 'beige-front' },
  navy: { src: 'media/Siilostomy76890-683x1024-cut.webp', small: 'media/Siilostomy76890-683x1024-cut-w480.webp', w: 683, h: 1024, sw: 480, alt: 'navy' },
  black: { src: 'media/ostomy-belt-for-men-and-women-square-cut-w800.webp', small: 'media/ostomy-belt-for-men-and-women-square-cut-w480.webp', w: 800, h: 800, sw: 480, alt: 'black-navy' },
};

export function still(key, alts, cls = 'still') {
  const s = STILLS[key];
  return html`<figure class="${cls}"><img src="./${s.src}" srcset="./${s.small} ${s.sw}w, ./${s.src} ${s.w}w" sizes="(max-width: 899px) 70vw, 30vw" width="${s.w}" height="${s.h}" alt="${alts[s.alt]}" loading="lazy" decoding="async"></figure>`;
}

/** Visual counter: the number is drawn from --n by CSS (so scrolling writes only a custom property); the text is for assistive tech. */
const counter = (value, label, from = null) =>
  html`<p class="stat"><span class="stat__fig" aria-hidden="true">${from !== null ? html`<span class="stat__from">${from}</span>${icons.arrow}` : ''}<span class="count" data-count style="--n:${value}"></span></span><span class="stat__unit" aria-hidden="true">${label}</span><span class="sr-only">${from !== null ? `${from}–${value}` : value} ${label}</span></p>`;

export function renderPage({ content, brief, ui3d, scenes, library, shop, packs, listings, posts, alts }) {
  const c = content;
  const words = scenes.words;
  const chapters = [
    { id: 'pool', color: 'navy', still: 'navy', copy: { eyebrow: c.pool.eyebrow, headline: c.pool.headline, body: c.pool.body, chips: c.pool.chips, cta: c.pool.cta } },
    { id: 'beach', color: 'beige', still: 'beige', copy: { headline: c.hero.bullets[2], body: c.fit.hotspots[2].text, chips: c.pool.chips, cta: c.hero.cta } },
    { id: 'casual', color: 'beige', still: 'beige', copy: { eyebrow: c.clothes.eyebrow, headline: c.clothes.headline, body: c.clothes.body, chips: c.clothes.chips, cta: c.clothes.cta } },
    { id: 'office', color: 'black', still: 'black', copy: { eyebrow: c.fit.eyebrow, headline: c.fit.headline, body: c.fit.body, support: c.hero.bullets[1], chips: c.fit.chips, cta: c.fit.cta, ctaHref: c.size_guide.link.url, counters: true } },
  ].map((ch, i) => ({ ...ch, word: words[i] }));

  const sceneSection = (ch, i) => {
    const art = sceneArt(i);
    const k = ch.copy;
    const cta = ch.copy.ctaHref
      ? ext({ href: k.ctaHref, label: k.cta, ui3d, cls: 'btn' })
      : buy({ label: k.cta, content: c, ui3d });
    return html`<section class="sec sec--scene scene--${ch.id}" id="${ch.id}" data-sec="scene" data-i="${i}" aria-labelledby="${ch.id}-h">
      <div class="layer field" data-field style="--field:${art.base}" aria-hidden="true"></div>
      <div class="layer art" data-art aria-hidden="true">${raw(art.far)}${raw(art.mid)}${raw(art.near)}</div>
      <div class="layer word" aria-hidden="true"><span class="word__clip"><span class="word__text" data-word>${ch.word}</span></span></div>
      <div class="pin">
        ${still(ch.still, alts)}
        <div class="card" data-card>
          <p class="num" aria-hidden="true"><span class="num__n">${ui3d.chapterNumbers[i]}</span><span class="num__of">${ui3d.of}${ui3d.chapterNumbers[3]}</span></p>
          ${k.eyebrow ? html`<p class="eyebrow" data-in>${k.eyebrow}</p>` : ''}
          <h2 class="headline" id="${ch.id}-h" data-split>${k.headline}</h2>
          <p class="body" data-in>${k.body}</p>
          ${k.support ? html`<p class="support" data-in>${k.support}</p>` : ''}
          <p class="card__cta" data-in>${cta}</p>
        </div>
        <div class="side" data-side>
          ${k.counters ? html`<div class="stats">${counter(c.fit.counter1.value, c.fit.counter1.unit)}${counter(c.fit.counter2.to, c.fit.counter2.unit, c.fit.counter2.from)}</div>` : ''}
          ${pills(k.chips, k.counters ? 'pills--alt' : '')}
        </div>
      </div>
    </section>`;
  };

  const hlFolds = foldArt(['#2a211b', '#33281f', '#3b2e23']);
  const acFolds = foldArt(['#1e1814', '#251d17', '#2c221a']);
  const clFolds = foldArt(['#bb6640', '#a5512e', '#c8774f']);
  const anchors = ['pocket', 'fastening', 'label'];

  const newest = posts.slice(0, 3);

  return html`
  <a class="skip" href="#main">${ui3d.skip}</a>
  ${topBar({ content: c, ui3d, listings, home: '#top', chapters, libraryHref: './blog.html' })}

  <div class="layer ribbon ribbon--back" aria-hidden="true"><svg data-ribbon="back"><path class="rb__shade"/><path class="rb__band"/></svg></div>
  <div class="layer ribbon ribbon--weave" aria-hidden="true"><svg data-ribbon="weave"><defs><mask id="weave-mask" maskUnits="userSpaceOnUse"><rect data-weave-mask fill="#fff"/></mask></defs><g mask="url(#weave-mask)"><path class="rb__shade"/><path class="rb__band"/></g></svg></div>
  <canvas class="layer belt" data-canvas aria-label="${ui3d.belt}" role="img"></canvas>
  <div class="layer ribbon ribbon--front" aria-hidden="true"><svg data-ribbon="front"><path class="rb__shade"/><path class="rb__band"/></svg></div>
  <div class="rail" aria-hidden="true"><span class="rail__fill" data-rail></span>${ui3d.chapterNumbers.map((n, i) => html`<span class="rail__n" data-rail-n="${i}">${n}</span>`)}</div>
  <div class="intro" aria-hidden="true" data-intro></div>

  <main id="main" tabindex="-1">
    <section class="sec sec--gate" id="top" data-sec="gate" aria-labelledby="gate-h">
      <div class="layer field" data-field style="--field:#bfe8e4" aria-hidden="true"></div>
      <div class="pin">
        <div class="gate">
          <h1 class="gate__title" id="gate-h" data-gate>${c.hero.title}</h1>
          <p class="gate__line" data-gate>${c.hero.headline}</p>
        </div>
        <p class="cue" aria-hidden="true" data-gate><span>${ui3d.scroll}</span><span class="cue__line"></span></p>
      </div>
    </section>

    ${chapters.map(sceneSection)}

    <section class="sec sec--hl" id="highlights" data-sec="highlights" aria-labelledby="hl-h">
      <div class="layer field" data-field style="--field:#221a15" aria-hidden="true"></div>
      <div class="layer art" data-art aria-hidden="true">${raw(hlFolds.far)}${raw(hlFolds.mid)}${raw(hlFolds.near)}</div>
      <div class="pin">
        <header class="hl__head" data-in>
          <p class="eyebrow">${c.specifications.eyebrow}</p>
          <h2 class="headline" id="hl-h">${c.specifications.headline}</h2>
        </header>
        <ol class="hl__list">
          ${c.fit.hotspots.map(
            (h, i) => html`<li class="hs" data-hs="${anchors[i]}" data-hs-i="${i}">
              <span class="hs__dot" aria-hidden="true"></span><span class="hs__line" aria-hidden="true"></span>
              <div class="hs__card"><span class="hs__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><h3 class="hs__label">${h.label}</h3><p class="hs__text">${h.text}</p></div>
            </li>`,
          )}
        </ol>
      </div>
    </section>

    <section class="sec sec--access" id="access" data-sec="access" aria-labelledby="access-h">
      <div class="layer field" data-field style="--field:#17120f" aria-hidden="true"></div>
      <div class="layer art" data-art aria-hidden="true">${raw(acFolds.far)}${raw(acFolds.mid)}${raw(acFolds.near)}</div>
      <div class="pin">
        <div class="card card--dark" data-card>
          <p class="eyebrow" data-in>${c.access.eyebrow}</p>
          <h2 class="headline" id="access-h" data-split>${c.access.headline}</h2>
          <p class="body" data-in>${c.access.body}</p>
          <div data-in>${pills(c.access.chips)}</div>
          <dl class="facts" data-in>${c.access.list.map((r) => html`<div class="facts__row"><dt>${r.label}</dt><dd>${r.value}</dd></div>`)}</dl>
          <p class="card__cta" data-in>${buy({ label: c.access.cta, content: c, ui3d })}</p>
        </div>
        <div class="hs hs--zip" data-hs="zip" aria-hidden="true"><span class="hs__dot"></span><span class="hs__line"></span><div class="hs__card hs__card--tag"><span class="hs__label">${c.access.chips[0]}</span></div></div>
      </div>
    </section>

    ${shopBlock({ content: c, ui3d, shop, packs, listings, alts })}

    <section class="sec sec--lib" id="library" data-sec="library" aria-labelledby="lib-h">
      <div class="lib">
        <div class="lib__ribbon" aria-hidden="true"><svg viewBox="0 0 1600 900" preserveAspectRatio="none"><path d="M-40 160C300 60 520 300 760 240S1180 40 1640 180" pathLength="1"/></svg></div>
        <header class="lib__head">
          <p class="eyebrow">${ui3d.library}</p>
          <h2 class="lib__title" id="lib-h">${library.heading}</h2>
          <p class="lib__links"><a class="btn btn--ghost" href="./blog.html">${ui3d.allArticles}${icons.arrow}</a>${ext({ href: library.url, label: ui3d.visitLibrary, ui3d, cls: 'textlink' })}</p>
        </header>
        <ol class="posts posts--teaser">${newest.map((post, i) => postCard({ post, index: i, ui3d, size: i === 0 ? 'lead' : 'std' }))}</ol>
      </div>
    </section>

    <section class="sec sec--close" id="why" data-sec="close" aria-labelledby="close-h">
      <div class="layer field" data-field style="--field:#b0532e" aria-hidden="true"></div>
      <div class="layer art" data-art aria-hidden="true">${raw(clFolds.far)}${raw(clFolds.mid)}${raw(clFolds.near)}</div>
      <div class="pin">
        <div class="hole" data-card>
          <p class="eyebrow" data-in>${c.close.eyebrow}</p>
          <h2 class="headline headline--hole" id="close-h" data-split>${c.close.headline}</h2>
          <div data-in>${counter(c.close.counter.value, c.close.counter.unit)}</div>
          <p class="card__cta" data-in>${buy({ label: c.close.cta, content: c, ui3d, cls: 'btn btn--light' })}</p>
        </div>
      </div>
      <div class="close-more">
        <div class="close-more__card">
          <p class="body body--lg">${c.close.body}</p>
          <p class="body">${c.close.returns}</p>
          <ul class="lines">${c.close.lines.map((l) => html`<li>${icons.check}<span>${l}</span></li>`)}</ul>
          <p>${buy({ label: c.close.cta, content: c, ui3d })}</p>
        </div>
      </div>
    </section>
  </main>

  ${footer({ content: c, brief })}

  <div class="buybar" data-buybar aria-label="${ui3d.buyBar}" role="region">
    <p class="buybar__label">${raw(
      c.sticky.label
        .split('{color}')
        .map((part) => html`${part}`.toString())
        .join(c.colors.options.map((name, i) => `<span class="buybar__c" data-bc="${COLOR_IDS[i]}">${html`${name}`}</span>`).join('')),
    )}</p>
    ${buy({ label: c.sticky.cta, content: c, ui3d, cls: 'btn btn--bar' })}
  </div>`;
}
