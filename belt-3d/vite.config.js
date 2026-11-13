import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineConfig } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');

/** Fonts of the first view, preloaded in the build (stems as emitted from @fontsource). */
const PRELOAD = ['anton-latin-400-normal', 'albert-sans-latin-400-normal', 'albert-sans-latin-800-normal'];

/**
 * Renders the page bodies into index.html and blog.html (<!--app-->, <!--title-->), so all
 * text is in the served HTML without JavaScript. Copy: ../src/content/belt.en.js (verified),
 * src/content/* (interface labels, owner-dictated words, listings, blog posts).
 */
function storyRender() {
  let server = null;
  const load = (rel) => {
    const file = path.join(here, rel);
    return server ? server.ssrLoadModule(file) : import(pathToFileURL(file).href);
  };
  const json = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
  return {
    name: 'belt-3d-render',
    configureServer(s) {
      server = s;
      const reload = (file) => {
        if (/belt-3d[\\/]src[\\/](render|content)[\\/]|src[\\/]content[\\/]belt\.en\.js/.test(file)) s.ws.send({ type: 'full-reload' });
      };
      s.watcher.on('change', reload);
    },
    transformIndexHtml: {
      order: 'post',
      async handler(source, ctx) {
        if (!source.includes('<!--app-->')) return source; // e.g. the scene engineer's scene-test.html
        const [{ renderPage }, { renderBlog }, { content, brief }, { ui3d }, { scenes, library, shop }, { packs }] = await Promise.all([
          load('src/render/page.js'),
          load('src/render/blog.js'),
          load('../src/content/belt.en.js'),
          load('src/content/ui3d.en.js'),
          load('src/content/scenes.js'),
          load('src/content/packs.js'),
        ]);
        const listings = json(path.join(here, 'src/content/listings.json'));
        const posts = json(path.join(here, 'src/content/blog.en.json')).posts.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
        const manifest = json(path.join(repo, 'public/media/belt/manifest.json'));
        const alts = Object.fromEntries(Object.entries(manifest.placeholders).map(([k, v]) => [k, v.alt]));
        const isBlog = path.basename(ctx.filename || ctx.path || '') === 'blog.html';
        const data = { content, brief, ui3d, scenes, library, shop, packs, listings, posts, alts };
        const body = isBlog ? renderBlog(data) : renderPage(data);
        const title = isBlog ? `${library.heading} · ${content.meta.title}` : content.meta.title;
        let out = source.replace('<!--title-->', esc(title)).replace('<!--app-->', String(body));
        let links = '';
        if (ctx.bundle) {
          const files = Object.values(ctx.bundle).map((b) => b.fileName);
          links = PRELOAD.map((stem) => files.find((f) => path.basename(f).startsWith(`${stem}-`) && f.endsWith('.woff2')))
            .filter(Boolean)
            .map((f) => `<link rel="preload" href="./${f}" as="font" type="font/woff2" crossorigin>`)
            .join('\n    ');
        }
        return out.replace('<!--preload-->', links);
      },
    },
  };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Second page of the repository: the 3D scroll story, with its own root.
export default defineConfig({
  root: here,
  base: './',
  publicDir: path.join(here, 'public'),
  plugins: [storyRender()],
  server: { fs: { allow: [repo] } },
  build: {
    target: 'es2020',
    outDir: path.join(repo, 'dist-3d'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        index: path.join(here, 'index.html'),
        blog: path.join(here, 'blog.html'),
      },
    },
  },
  preview: { port: 4174, strictPort: true },
});
