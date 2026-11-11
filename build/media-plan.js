/**
 * Media plan (Node, build time).
 *
 * Reads public/media/belt/manifest.json, looks at what is actually on disk and decides, for
 * every chapter and colour, which of the three modes the page uses:
 *
 *   sequence     seq/<chapter>/<color>/0001.webp … exist          → canvas, scrubbed by scroll
 *   still        still/<chapter>/<color>.webp exists               → cut-out still, moved and cross-faded
 *   placeholder  neither exists                                    → a real SIIL product photo: cut out of its
 *                background when the manifest names a "cutout" file for it, otherwise as a framed plate
 *                (or a neutral card with the file name if that photo is missing too)
 *
 * Files on disk decide the mode and the measured numbers (frame count, pixel size, alpha).
 * The manifest carries what cannot be measured: descriptions, hotspots, focal region, light.
 * `npm run manifest` writes the measured numbers back into the manifest so both agree.
 */
import fs from 'node:fs';
import path from 'node:path';
import { imageInfo } from './image-info.js';

export const CHAPTER_IDS = ['hero', 'fit', 'clothes', 'access', 'pool', 'colors', 'close'];
export const COLOR_IDS = ['beige', 'navy', 'black'];
export const MEDIA_BASE = 'media/belt';

const DEFAULT_LIGHT = { floor: 0.45, rim: 0.3 };
const frameName = (i) => `${String(i).padStart(4, '0')}.webp`;

export function countFrames(absDir) {
  let n = 0;
  while (fs.existsSync(path.join(absDir, frameName(n + 1)))) n += 1;
  return n;
}

/** Measures a sequence folder. Returns null when it holds no frames. */
export function sequenceOnDisk(root, dir) {
  const abs = path.join(root, dir);
  const frames = countFrames(abs);
  if (!frames) return null;
  const first = imageInfo(path.join(abs, frameName(1)));
  const seq = { frames, width: first.width, height: first.height, alpha: first.alpha, small: null };
  const smallFrames = countFrames(path.join(abs, 'm'));
  if (smallFrames) {
    const s = imageInfo(path.join(abs, 'm', frameName(1)));
    seq.small = { frames: smallFrames, width: s.width, height: s.height };
  }
  return seq;
}

const clamp01 = (n) => Math.min(1, Math.max(0, n));

function normalizeHotspots(list, frames) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((h) => h && typeof h.id === 'string' && Number.isFinite(h.x) && Number.isFinite(h.y))
    .map((h) => ({
      id: h.id,
      x: clamp01(h.x),
      y: clamp01(h.y),
      side: h.side === 'left' || h.side === 'right' ? h.side : h.x < 0.5 ? 'left' : 'right',
      from: Array.isArray(h.frames) ? Math.max(1, h.frames[0] | 0) : 1,
      to: Array.isArray(h.frames) ? Math.min(frames || 1, h.frames[1] | 0) : frames || 1,
    }));
}

function normalizeFocal(f) {
  if (!f || !Number.isFinite(f.x) || !Number.isFinite(f.y)) return null;
  return { x: clamp01(f.x), y: clamp01(f.y), w: clamp01(f.w ?? 0.4), h: clamp01(f.h ?? 0.4) };
}

export function buildMediaPlan({ publicDir }) {
  const root = path.join(publicDir, MEDIA_BASE);
  const warnings = [];
  const warn = (msg) => {
    if (!warnings.includes(msg)) warnings.push(msg);
  };
  const abs = (rel) => path.join(root, rel);
  const exists = (rel) => fs.existsSync(abs(rel));

  let manifest = { chapters: {}, placeholders: {} };
  if (exists('manifest.json')) {
    try {
      manifest = JSON.parse(fs.readFileSync(abs('manifest.json'), 'utf8'));
    } catch (err) {
      warn(`manifest.json could not be parsed (${err.message}); every chapter falls back to a neutral card`);
    }
  } else {
    warn('manifest.json is missing; every chapter falls back to a neutral card');
  }
  const chapters = manifest.chapters ?? {};
  const placeholders = manifest.placeholders ?? {};
  const lightFor = (color, entry) => ({ ...DEFAULT_LIGHT, ...(manifest.light?.[color] ?? {}), ...(entry?.light ?? {}) });

  /**
   * A real SIIL product photo standing in for an own-model image.
   * `framed: true` always returns the photo itself (the chapter-4 close view is a framed photo).
   * Otherwise, when the manifest names a "cutout" for the photo (the same picture on the same
   * canvas with its background removed) and that file is on disk, the cut-out is shown: the
   * figure then stands on the stage the way an own-model still does.
   */
  function placeholderVisual(id, { framed = false } = {}) {
    const def = placeholders[id];
    if (!def || !def.file) {
      warn(`placeholder "${id}" is not defined in manifest.json; a neutral card is shown`);
      return { key: `ph:${id}`, id, mode: 'placeholder', missing: true, name: String(id), width: 2, height: 3, alpha: false, cutout: false, alt: null };
    }
    const name = path.basename(def.file);
    if (!exists(def.file)) {
      warn(`placeholder photo is missing: ${def.file}; a neutral card with the file name is shown`);
      return { key: `ph:${id}`, id, mode: 'placeholder', missing: true, name, width: def.width || 2, height: def.height || 3, alpha: false, cutout: false, alt: def.alt ?? null };
    }
    let shown = def.file;
    if (!framed && def.cutout) {
      if (exists(def.cutout)) shown = def.cutout;
      else warn(`placeholder cut-out is missing: ${def.cutout}; the framed photo is shown instead`);
    }
    const cutout = shown !== def.file;
    const info = imageInfo(abs(shown));
    if (cutout) {
      const photo = imageInfo(abs(def.file));
      if (!info.alpha) warn(`${def.cutout} has no transparency; it is shown as it is`);
      // Hotspots and the focal region are fractions of the photo, so both files must share one canvas.
      if (Math.abs(info.width / info.height - photo.width / photo.height) > 0.005) {
        warn(`${def.cutout} does not have the proportions of ${def.file}; hotspots and the push-in will be off`);
      }
    }
    const dir = path.posix.dirname(shown);
    const stem = path.basename(shown).replace(/\.[^.]+$/, '');
    // Smaller copies of the same picture sit next to it as "<name>-w<width>.webp".
    const sources = fs
      .readdirSync(abs(dir))
      .map((f) => {
        const m = f.startsWith(`${stem}-w`) && f.slice(stem.length).match(/^-w(\d+)\.webp$/);
        return m ? { w: Number(m[1]), src: `${dir}/${f}` } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.w - b.w);
    sources.push({ w: info.width, src: shown });
    return {
      key: cutout || !framed ? `ph:${id}` : `ph:${id}:framed`,
      id, mode: 'placeholder', missing: false, name, src: shown, sources,
      width: info.width, height: info.height, alpha: info.alpha, cutout, alt: def.alt ?? null,
    };
  }

  function resolve(chapterId, color) {
    const chapter = chapters[chapterId] ?? {};
    const entry = chapter[color] ?? {};
    // A chapter may borrow another chapter's own-model files (access pushes in on the hero plate).
    const sources = chapter.use ? [chapterId, chapter.use] : [chapterId];
    for (const cid of sources) {
      const own = cid === chapterId ? entry : chapters[cid]?.[color] ?? {};
      const dir = `seq/${cid}/${color}`;
      const stillFile = `still/${cid}/${color}.webp`;
      const seq = sequenceOnDisk(root, dir);
      const alt = entry.alt ?? own.alt ?? null;
      if (seq) {
        const declared = own.sequence;
        if (!declared || declared.frames !== seq.frames || declared.width !== seq.width || declared.height !== seq.height) {
          warn(`${dir}: ${seq.frames} frames of ${seq.width}×${seq.height} on disk do not match manifest.json; run "npm run manifest"`);
        }
        if (!alt) warn(`${dir}: no "alt" description in manifest.json (chapter "${chapterId}", colour "${color}")`);
        return {
          key: `seq:${cid}/${color}`, mode: 'sequence', dir, ...seq,
          small: seq.small ? { dir: `${dir}/m`, ...seq.small } : null,
          poster: exists(stillFile) ? stillFile : `${dir}/${frameName(1)}`,
          alt, hotspots: normalizeHotspots(entry.hotspots, seq.frames), focal: normalizeFocal(entry.focal), light: lightFor(color, entry),
        };
      }
      if (exists(stillFile)) {
        const info = imageInfo(abs(stillFile));
        if (!own.still || own.still.width !== info.width || own.still.height !== info.height) {
          warn(`${stillFile} is on disk but manifest.json does not describe it; run "npm run manifest"`);
        }
        if (!alt) warn(`${stillFile}: no "alt" description in manifest.json (chapter "${chapterId}", colour "${color}")`);
        return {
          key: `still:${cid}/${color}`, mode: 'still', src: stillFile, sources: [{ w: info.width, src: stillFile }], ...info,
          alt, hotspots: normalizeHotspots(entry.hotspots, 1), focal: normalizeFocal(entry.focal), light: lightFor(color, entry),
        };
      }
    }
    const ph = entry.placeholder ?? {};
    const visual = placeholderVisual(ph.use ?? `${chapterId}-${color}`);
    return { ...visual, hotspots: normalizeHotspots(ph.hotspots, 1), focal: normalizeFocal(ph.focal), light: lightFor(color, ph) };
  }

  const plan = { base: MEDIA_BASE, chapters: {}, detail: null };
  for (const id of CHAPTER_IDS) {
    const colors = COLOR_IDS.filter((c) => chapters[id]?.[c]);
    if (!colors.length) {
      warn(`manifest.json has no colour entry for chapter "${id}"; using beige`);
      colors.push('beige');
    }
    const variants = {};
    for (const c of colors) variants[c] = resolve(id, c);
    plan.chapters[id] = { id, colors, variants };
  }

  // Close view of the access opening (chapter 4).
  const detailDef = manifest.detail?.access ?? {};
  if (exists('detail/access.webp')) {
    const info = imageInfo(abs('detail/access.webp'));
    if (!detailDef.alt) warn('detail/access.webp: no "alt" description in manifest.json (detail.access.alt)');
    plan.detail = { key: 'detail:access', mode: 'detail', src: 'detail/access.webp', sources: [{ w: info.width, src: 'detail/access.webp' }], ...info, alt: detailDef.alt ?? null, crop: null };
  } else {
    const access = plan.chapters.access.variants[plan.chapters.access.colors[0]];
    // The close view is cropped from the very picture chapter 4 pushes in on (cut-out or framed
    // photo), so the hand-over between the two cannot be seen.
    const phId = detailDef.placeholder?.use ?? (access.mode === 'placeholder' ? access.id : null);
    const ph = phId ? placeholderVisual(phId) : null;
    if (ph) {
      const crop = normalizeFocal(detailDef.placeholder?.crop) ?? access.focal ?? { x: 0.5, y: 0.5, w: 0.5, h: 0.5 };
      plan.detail = { ...ph, key: 'detail:placeholder', hotspots: undefined, focal: undefined, light: undefined, crop, alt: detailDef.placeholder?.alt ?? ph.alt };
    } else {
      warn('detail/access.webp is missing and no placeholder is defined for it; chapter 4 shows no detail image');
    }
  }

  return { plan, warnings };
}
