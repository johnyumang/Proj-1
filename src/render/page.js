/**
 * Renders the whole page body from the verified content, the interface strings, the review
 * list and the media plan. Runs at build time (and on every dev-server page load), so the
 * finished HTML contains all text and the still images without any JavaScript.
 */
import { html, jsonScript } from './html.js';
import { buyButton, colorLabel } from './parts.js';
import { renderChapters } from './chapters.js';
import { renderFooter, renderSections } from './sections.js';

/** In-page targets of content.nav.links, in the same order. */
const NAV_TARGETS = ['#why', '#size-guide', '#specifications', '#faq'];

/** The part of the media plan the browser needs (no build-only fields). */
function clientPlan(plan) {
  const slim = (v) => {
    if (!v) return null;
    const { source, ...rest } = v;
    return rest;
  };
  const chapters = {};
  for (const [id, chapter] of Object.entries(plan.chapters)) {
    chapters[id] = { colors: chapter.colors, variants: Object.fromEntries(Object.entries(chapter.variants).map(([c, v]) => [c, slim(v)])) };
  }
  return { base: plan.base, chapters, detail: slim(plan.detail) };
}

export function renderPage(ctx) {
  const { content: c, ui, plan } = ctx;
  return html`
<a class="skip" href="#main">${ui.skip}</a>

<header class="nav" data-nav>
  <a class="nav__brand" href="#top">${c.nav.brand}</a>
  <nav class="nav__links" id="nav-links" aria-label="${ui.navLabel}">
    ${c.nav.links.map((label, i) => html`<a class="nav__link" href="${NAV_TARGETS[i]}">${label}</a>`)}
  </nav>
  ${buyButton({ label: c.nav.cta, content: c, ui, className: 'btn btn--small nav__cta' })}
  <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-links" data-nav-toggle>
    <span class="nav__toggle-open">${ui.menu}</span><span class="nav__toggle-close">${ui.close}</span>
  </button>
</header>

<main id="main">
  <div class="story" data-story>
    <div class="chapters">${renderChapters(ctx)}</div>
  </div>
  <div class="light" data-light>${renderSections(ctx)}</div>
</main>

${renderFooter(ctx)}

<div class="buybar" data-buybar>
  ${colorLabel(c, 'buybar__label')}
  ${buyButton({ label: c.sticky.cta, content: c, ui, className: 'btn btn--small buybar__cta' })}
</div>

<script type="application/json" id="belt-plan">${jsonScript(clientPlan(plan))}</script>
`.toString();
}
