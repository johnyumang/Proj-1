#!/usr/bin/env node
/**
 * npm run single
 *
 * Packs the built page (dist/) into ONE self-contained HTML file that opens with a double click
 * and can be sent by mail or chat: styles, script, fonts and images are embedded, nothing is
 * loaded from a server.
 *
 *   preview/siil-ostomy-belt-preview.html
 *
 * It is a review copy, not a deployment: every picture is embedded once at full size (no
 * responsive variants), so it is heavier than the hosted page and needs JavaScript to show its
 * pictures. Deploy dist/ itself.
 *
 * Only placeholder and still mode are packed. Frame sequences (seq/…) are far too large to embed;
 * the script stops if the build uses any.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'preview');
const outFile = path.join(outDir, 'siil-ostomy-belt-preview.html');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/index.html not found: run "npm run build" first.');
  process.exit(1);
}

const MIME = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const dataUri = (file) => `data:${MIME[path.extname(file).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(file).toString('base64')}`;
const kb = (n) => `${Math.round(n / 1024)} KB`;

let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

if (/"mode":"sequence"/.test(html)) {
  console.error('This build uses frame sequences, which cannot be packed into one file. Use dist/ instead.');
  process.exit(1);
}

// 1. Stylesheet, with its fonts embedded.
html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/, (_, rel) => {
  const cssFile = path.join(dist, rel);
  const css = fs
    .readFileSync(cssFile, 'utf8')
    .replace(/url\((['"]?)(\.\/[^)'"]+)\1\)/g, (m, q, ref) => `url(${dataUri(path.join(path.dirname(cssFile), ref))})`);
  return `<style>${css}</style>`;
});
html = html.replace(/\s*<link rel="preload"[^>]*as="font"[^>]*>/g, '');

// 2. Pictures: each file is embedded once, in a small script that hands it to every <img> that
//    asks for it, both the ones in the markup and the ones the story creates later.
const media = {};
const embed = (ref) => {
  const rel = decodeURIComponent(ref).replace(/^\.\//, '');
  if (!media[rel]) media[rel] = dataUri(path.join(dist, rel));
  return rel;
};
const blank = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
html = html.replace(/<img\b[^>]*>/g, (tag) => {
  const src = /\ssrc="(\.\/media\/[^"]+)"/.exec(tag);
  if (!src) return tag;
  const rel = embed(src[1]);
  return tag
    .replace(src[0], ` src="${blank}" data-media="${rel}"`)
    .replace(/\ssrcset="[^"]*"/, '')
    .replace(/\ssizes="[^"]*"/, '')
    .replace(/\sloading="lazy"/, '');
});
// Files the story asks for by script: the stage builds its own <img> elements from the media
// plan and sets each one's main file ("src", which is followed by its list of smaller copies).
for (const m of html.matchAll(/"src":"([^"]+\.(?:webp|jpe?g|png))","sources"/g)) embed(`media/belt/${m[1]}`);

const shim = `(function () {
  var M = ${JSON.stringify(media)};
  var key = function (u) {
    u = String(u);
    try { u = decodeURIComponent(u); } catch (e) {}
    var i = u.indexOf('media/');
    return i < 0 ? null : u.slice(i).split(/[?#]/)[0];
  };
  var proto = HTMLImageElement.prototype;
  var src = Object.getOwnPropertyDescriptor(proto, 'src');
  Object.defineProperty(proto, 'src', {
    configurable: true,
    enumerable: true,
    get: function () { return src.get.call(this); },
    set: function (v) { var k = key(v); src.set.call(this, k && M[k] ? M[k] : v); },
  });
  // One embedded size per picture: responsive candidates are ignored.
  Object.defineProperty(proto, 'srcset', { configurable: true, enumerable: true, get: function () { return ''; }, set: function () {} });
  var fill = function () {
    var list = document.querySelectorAll('img[data-media]');
    for (var i = 0; i < list.length; i += 1) {
      var k = list[i].getAttribute('data-media');
      if (M[k]) src.set.call(list[i], M[k]);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill);
  else fill();
})();`;

// 3. The page script, inline. It must stay a module; the shim runs before it.
html = html.replace(/<script type="module"[^>]*src="\.\/(assets\/[^"]+\.js)"[^>]*><\/script>/, (_, rel) => {
  const js = fs.readFileSync(path.join(dist, rel), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script>${shim.replace(/<\/script/gi, '<\\/script')}</script>\n    <script type="module">${js}</script>`;
});

const left = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => m[1]);
if (left.length) {
  console.error(`Still pointing at separate files: ${[...new Set(left)].join(', ')}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, html);
console.log(`${path.relative(root, outFile)}  ${kb(Buffer.byteLength(html))}`);
for (const [rel, uri] of Object.entries(media)) console.log(`  embedded ${rel}  ${kb(uri.length * 0.75)}`);
