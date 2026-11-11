/**
 * Vite plugin: renders the page body into index.html.
 *
 * - Content comes from src/content/belt.en.js (verified copy), src/content/ui.en.js
 *   (interface and ARIA labels) and src/content/reviews.json.
 * - Images come from the media plan (build/media-plan.js), i.e. from what is on disk under
 *   public/media/belt plus the annotations in its manifest.json.
 * - In a production build it also adds <link rel="preload"> for the fonts of the first view.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildMediaPlan } from './media-plan.js';

/** Fonts needed for the first view (file name stems as emitted from @fontsource). */
const PRELOAD_FONTS = [
  'albert-sans-latin-400-normal',
  'albert-sans-latin-600-normal',
  'albert-sans-latin-800-normal',
  'albert-sans-latin-900-normal',
  'cormorant-garamond-latin-500-italic',
];

export function prerender() {
  let config;
  let warned = '';

  return {
    name: 'belt-prerender',

    configResolved(resolved) {
      config = resolved;
    },

    configureServer(server) {
      // Templates, content and the manifest are read on every page load; reload when they change.
      const reload = (file) => {
        const rel = path.relative(config.root, file).split(path.sep).join('/');
        if (/^src\/(render|content)\//.test(rel) || /^public\/media\/belt\//.test(rel)) {
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('change', reload);
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    },

    transformIndexHtml: {
      order: 'post',
      async handler(htmlSource, ctx) {
        const load = (file) =>
          ctx.server ? ctx.server.ssrLoadModule(`/${file}`) : import(pathToFileURL(path.join(config.root, file)).href);

        const [{ renderPage }, { content, brief }, { ui }] = await Promise.all([
          load('src/render/page.js'),
          load('src/content/belt.en.js'),
          load('src/content/ui.en.js'),
        ]);
        const reviews = JSON.parse(fs.readFileSync(path.join(config.root, 'src/content/reviews.json'), 'utf8'));
        const { plan, warnings } = buildMediaPlan({ publicDir: config.publicDir });

        const report = warnings.join('\n');
        if (report && report !== warned) {
          warned = report;
          for (const line of warnings) config.logger.warn(`[media] ${line}`);
        }

        let out = htmlSource
          .replace('<!--title-->', escapeText(content.meta.title))
          .replace('<!--app-->', renderPage({ content, brief, ui, reviews, plan }));

        if (ctx.bundle) {
          const assets = Object.values(ctx.bundle).map((item) => item.fileName);
          const links = PRELOAD_FONTS.map((stem) => assets.find((f) => path.basename(f).startsWith(`${stem}-`) && f.endsWith('.woff2')))
            .filter(Boolean)
            .map((file) => `<link rel="preload" href="./${file}" as="font" type="font/woff2" crossorigin>`);
          out = out.replace('<!--preload-->', links.join('\n    '));
        } else {
          out = out.replace('<!--preload-->', '');
        }
        return out;
      },
    },
  };
}

const escapeText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
