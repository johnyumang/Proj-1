/**
 * The library index (belt-3d/blog.html): all posts as a typographic contents page. No WebGL,
 * readable without JavaScript. Titles and excerpts are shown exactly as in blog.en.json.
 */
import { html, ext, icons, topBar, footer, postCard } from './parts.js';

/** Size rhythm of the contents page: one lead, then wide / std / std / tall … */
const RHYTHM = ['lead', 'std', 'std', 'wide', 'std', 'tall', 'std', 'wide', 'std', 'std', 'std', 'wide'];

export function renderBlog({ content, brief, ui3d, library, listings, posts }) {
  return html`
  <a class="skip" href="#main">${ui3d.skip}</a>
  ${topBar({ content, ui3d, listings, home: './' })}
  <main id="main" class="blog" tabindex="-1">
    <div class="blog__ribbon" aria-hidden="true"><svg viewBox="0 0 1600 3000" preserveAspectRatio="none"><path d="M-40 260C420 120 600 520 980 420S1500 300 1640 520M1640 1300C1200 1200 900 1600 500 1500S60 1700 -40 1900M-40 2500C400 2400 800 2800 1640 2600" pathLength="1"/></svg></div>
    <header class="blog__head">
      <p class="blog__back"><a class="textlink" href="./">${icons.arrow}<span>${ui3d.backToStory}</span></a></p>
      <p class="eyebrow">${ui3d.library}</p>
      <h1 class="blog__title">${library.heading}</h1>
      <p>${ext({ href: library.url, label: ui3d.visitLibrary, ui3d, cls: 'btn btn--ghost' })}</p>
    </header>
    <ol class="posts posts--index">${posts.map((post, i) => postCard({ post, index: i, ui3d, size: RHYTHM[i % RHYTHM.length], headingLevel: 2 }))}</ol>
  </main>
  ${footer({ content, brief })}`;
}
