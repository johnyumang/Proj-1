/**
 * The seven story chapters (dark stage).
 *
 * Without JavaScript, or with reduced motion, each chapter is a normal section: still image,
 * all text, final counter values. With the story enabled the same markup is pinned and its
 * [data-a] elements are driven by one scroll-scrubbed timeline per chapter (src/story).
 *
 * data-panel groups text for small screens, where the panels of a chapter take turns in the
 * lower half of the viewport. data-a marks what a timeline animates:
 *   lines  headline split into lines     fade  one block     each  children, staggered
 */
import { html } from './html.js';
import { COLOR_IDS, buyButton, chips, colorLabel, figure } from './parts.js';

/** Order of content.fit.hotspots. The ids link the copy to positions in manifest.json. */
export const HOTSPOT_IDS = ['pocket', 'fastening', 'fabric'];

function shell({ id, anchor = id, layout, labelledby, figures, text }) {
  return html`
<section class="chapter chapter--${id}" id="${anchor}" data-chapter="${id}" data-layout="${layout}" aria-labelledby="${labelledby}">
  <div class="chapter__pin">
    <div class="chapter__figures">${figures}</div>
    <div class="chapter__text">${text}</div>
  </div>
</section>`;
}

function figures(ctx, id, { eager = false } = {}) {
  const chapter = ctx.plan.chapters[id];
  const many = chapter.colors.length > 1;
  return chapter.colors.map((color) =>
    figure({ visual: chapter.variants[color], plan: ctx.plan, ui: ctx.ui, color: many ? color : null, eager }),
  );
}

const counter = ({ from = 0, to, unit }) =>
  html`<p class="counter" data-counter data-from="${from}" data-to="${to}"><span class="counter__num">${to}</span><span class="counter__unit">${unit}</span></p>`;

function hero(ctx) {
  const { content: c, brief } = ctx;
  return shell({
    id: 'hero',
    layout: 'hero',
    labelledby: 'hero-title',
    figures: html`<span class="figure__word" aria-hidden="true">${brief.stageWord}</span>${figures(ctx, 'hero', { eager: true })}`,
    text: html`
      <div class="panel" data-panel="a">
        <div class="g g--lead">
          <p class="eyebrow" data-a="fade">${c.hero.eyebrow}</p>
          <h1 class="hero__title" id="hero-title" data-a="fade">${c.hero.title}</h1>
          <p class="headline" data-a="lines">${c.hero.headline}</p>
        </div>
        <div class="g g--actions">
          <div class="actions" data-a="fade">
            ${buyButton({ label: c.hero.cta, content: c, ui: ctx.ui })}
            <a class="link" href="#size-guide">${c.hero.secondary}</a>
          </div>
          <p class="note" data-a="fade">${c.hero.shipping}</p>
        </div>
      </div>
      <div class="panel" data-panel="b">
        <ul class="g g--bullets bullets" data-a="each">${c.hero.bullets.map((b) => html`<li>${b}</li>`)}</ul>
        <p class="g g--spec specline" data-a="fade">${c.hero.specline}</p>
      </div>`,
  });
}

function fit(ctx) {
  const { content: c } = ctx;
  return shell({
    id: 'fit',
    layout: 'left',
    labelledby: 'fit-title',
    figures: figures(ctx, 'fit'),
    text: html`
      <div class="panel" data-panel="a">
        <p class="eyebrow" data-a="fade">${c.fit.eyebrow}</p>
        <div class="counters" aria-hidden="true">
          ${counter({ from: 0, to: c.fit.counter1.value, unit: c.fit.counter1.unit })}
          ${counter({ from: c.fit.counter2.from, to: c.fit.counter2.to, unit: c.fit.counter2.unit })}
        </div>
        <h2 class="headline" id="fit-title" data-a="lines">${c.fit.headline}</h2>
      </div>
      <div class="panel" data-panel="b">
        <p class="body" data-a="fade">${c.fit.body}</p>
        ${chips(c.fit.chips)}
        <ul class="hotspots" data-hotspots data-a="each">${c.fit.hotspots.map(
          (h, i) => html`<li class="hotspots__item" data-hotspot="${HOTSPOT_IDS[i]}"><span class="hotspots__label">${h.label}</span> <span class="hotspots__text">${h.text}</span></li>`,
        )}</ul>
        <div class="actions" data-a="fade"><a class="btn" href="#size-guide">${c.fit.cta}</a></div>
      </div>`,
  });
}

function clothes(ctx) {
  const { content: c } = ctx;
  return shell({
    id: 'clothes',
    layout: 'right',
    labelledby: 'clothes-title',
    figures: figures(ctx, 'clothes'),
    text: html`
      <div class="panel" data-panel="a">
        <p class="eyebrow" data-a="fade">${c.clothes.eyebrow}</p>
        <h2 class="headline" id="clothes-title" data-a="lines">${c.clothes.headline}</h2>
      </div>
      <div class="panel" data-panel="b">
        <p class="body" data-a="fade">${c.clothes.body}</p>
        ${chips(c.clothes.chips)}
        <div class="actions" data-a="fade">${buyButton({ label: c.clothes.cta, content: c, ui: ctx.ui })}</div>
      </div>`,
  });
}

function access(ctx) {
  const { content: c, plan, ui } = ctx;
  // With a real close-up photo on disk, the static chapter shows that; otherwise the chapter plate.
  const staticFigure = plan.detail && plan.detail.mode === 'detail' ? figure({ visual: plan.detail, plan, ui }) : figures(ctx, 'access');
  return shell({
    id: 'access',
    layout: 'left',
    labelledby: 'access-title',
    figures: staticFigure,
    text: html`
      <div class="panel" data-panel="a">
        <p class="eyebrow" data-a="fade">${c.access.eyebrow}</p>
        <h2 class="headline" id="access-title" data-a="lines">${c.access.headline}</h2>
      </div>
      <div class="panel" data-panel="b">
        <p class="body" data-a="fade">${c.access.body}</p>
        ${chips(c.access.chips)}
        <div class="actions" data-a="fade">${buyButton({ label: c.access.cta, content: c, ui })}</div>
      </div>
      <div class="panel" data-panel="c">
        <dl class="deflist" data-a="each">${c.access.list.map(
          (row) => html`<div class="deflist__row"><dt>${row.label}</dt><dd>${row.value}</dd></div>`,
        )}</dl>
      </div>`,
  });
}

function pool(ctx) {
  const { content: c } = ctx;
  return shell({
    id: 'pool',
    layout: 'right',
    labelledby: 'pool-title',
    figures: figures(ctx, 'pool'),
    text: html`
      <div class="panel" data-panel="a">
        <p class="eyebrow" data-a="fade">${c.pool.eyebrow}</p>
        <h2 class="headline" id="pool-title" data-a="lines">${c.pool.headline}</h2>
      </div>
      <div class="panel" data-panel="b">
        <p class="body" data-a="fade">${c.pool.body}</p>
        ${chips(c.pool.chips)}
        <div class="actions" data-a="fade">${buyButton({ label: c.pool.cta, content: c, ui: ctx.ui })}</div>
      </div>`,
  });
}

function colors(ctx) {
  const { content: c } = ctx;
  return shell({
    id: 'colors',
    layout: 'left',
    labelledby: 'colors-title',
    figures: figures(ctx, 'colors'),
    text: html`
      <div class="panel" data-panel="a">
        <p class="eyebrow" data-a="fade">${c.colors.eyebrow}</p>
        <h2 class="headline" id="colors-title" data-a="lines">${c.colors.headline}</h2>
        <p class="body" data-a="fade">${c.colors.body}</p>
        <div class="swatches" role="radiogroup" aria-labelledby="colors-title" data-a="fade">${c.colors.options.map(
          (name, i) => html`<label class="swatch" data-swatch="${COLOR_IDS[i]}"><input class="swatch__input" type="radio" name="belt-color" id="color-${COLOR_IDS[i]}" value="${COLOR_IDS[i]}"${i === 0 ? html` checked` : ''}><span class="swatch__dot" aria-hidden="true"></span><span class="swatch__name">${name}</span></label>`,
        )}</div>
        <div class="buyrow" data-a="fade">
          ${colorLabel(c, 'buyrow__label')}
          ${buyButton({ label: c.sticky.cta, content: c, ui: ctx.ui })}
        </div>
      </div>`,
  });
}

function close(ctx) {
  const { content: c, brief } = ctx;
  return shell({
    id: 'close',
    anchor: 'why',
    layout: 'close',
    labelledby: 'close-title',
    figures: html`<span class="figure__word" aria-hidden="true">${brief.stageWord}</span>${figures(ctx, 'close')}`,
    text: html`
      <div class="panel" data-panel="a">
        <p class="eyebrow" data-a="fade">${c.close.eyebrow}</p>
        <h2 class="headline headline--serif" id="close-title" data-a="lines">${c.close.headline}</h2>
        <p class="body" data-a="fade">${c.close.body}</p>
      </div>
      <div class="panel" data-panel="b">
        <div class="counters" aria-hidden="true">${counter({ from: 0, to: c.close.counter.value, unit: c.close.counter.unit })}</div>
        <p class="body body--small" data-a="fade">${c.close.returns}</p>
        <div class="actions" data-a="fade">${buyButton({ label: c.close.cta, content: c, ui: ctx.ui })}</div>
        <ul class="lines" data-a="each">${c.close.lines.map((line) => html`<li>${line}</li>`)}</ul>
      </div>`,
  });
}

export const renderChapters = (ctx) => [hero, fit, clothes, access, pool, colors, close].map((render) => render(ctx));
