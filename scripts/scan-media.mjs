#!/usr/bin/env node
/**
 * npm run manifest
 *
 * Looks at public/media/belt and writes what it measures into manifest.json:
 *   seq/<chapter>/<color>/0001.webp …      → "sequence": { frames, width, height, alpha, small }
 *   still/<chapter>/<color>.webp            → "still": { width, height, alpha }
 *   detail/access.webp                      → "detail.access": { width, height }
 * Everything that cannot be measured (alt text, hotspots, focal region, light, placeholders)
 * is left exactly as it is. Run it after adding or replacing images, then fill in the
 * descriptions it asks for, then build.
 *
 *   node scripts/scan-media.mjs           update manifest.json and print a report
 *   node scripts/scan-media.mjs --check   report only; exit 1 if manifest.json is out of date
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageInfo } from '../build/image-info.js';
import { CHAPTER_IDS, COLOR_IDS, MEDIA_BASE, buildMediaPlan, sequenceOnDisk } from '../build/media-plan.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const mediaDir = path.join(publicDir, MEDIA_BASE);
const manifestPath = path.join(mediaDir, 'manifest.json');
const checkOnly = process.argv.includes('--check');

if (!fs.existsSync(manifestPath)) {
  console.error(`No manifest at ${path.relative(root, manifestPath)}`);
  process.exit(1);
}

const before = fs.readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(before);
manifest.chapters ??= {};
const notes = [];

for (const chapter of CHAPTER_IDS) {
  manifest.chapters[chapter] ??= {};
  const entry = manifest.chapters[chapter];
  // Colours: those already listed, plus any that have files on disk.
  const colors = COLOR_IDS.filter(
    (c) => entry[c] || fs.existsSync(path.join(mediaDir, 'seq', chapter, c)) || fs.existsSync(path.join(mediaDir, 'still', chapter, `${c}.webp`)),
  );
  for (const color of colors) {
    entry[color] ??= { sequence: null, still: null, alt: null };
    const slot = entry[color];
    const seq = sequenceOnDisk(mediaDir, `seq/${chapter}/${color}`);
    slot.sequence = seq ? { frames: seq.frames, width: seq.width, height: seq.height, alpha: seq.alpha, small: seq.small } : null;
    const stillFile = path.join(mediaDir, 'still', chapter, `${color}.webp`);
    slot.still = fs.existsSync(stillFile) ? imageInfo(stillFile) : null;

    if (seq && !seq.alpha) notes.push(`seq/${chapter}/${color}: frames have no transparency; the page expects cut-out frames`);
    if (seq && seq.small && seq.small.frames !== seq.frames) notes.push(`seq/${chapter}/${color}/m: ${seq.small.frames} frames, the full set has ${seq.frames}`);
    if (slot.still && !slot.still.alpha) notes.push(`still/${chapter}/${color}.webp has no transparency; the page expects a cut-out`);
    if ((seq || slot.still) && !slot.alt) notes.push(`chapters.${chapter}.${color}.alt is empty: describe what is visible (never "customer", "patient" or "real ostomate")`);
    if ((seq || slot.still) && chapter === 'fit' && !(slot.hotspots || []).length) notes.push('chapters.fit: no hotspots for the own-model image; all three items will show as chips');
    if ((seq || slot.still) && chapter === 'access' && !slot.focal) notes.push('chapters.access: no "focal" region for the own-model image; the push-in aims at the middle of the frame');
  }
}

manifest.detail ??= {};
manifest.detail.access ??= {};
const detailFile = path.join(mediaDir, 'detail', 'access.webp');
if (fs.existsSync(detailFile)) {
  const info = imageInfo(detailFile);
  manifest.detail.access.width = info.width;
  manifest.detail.access.height = info.height;
  if (!manifest.detail.access.alt) notes.push('detail.access.alt is empty: describe the close view of the access opening');
} else {
  manifest.detail.access.width = null;
  manifest.detail.access.height = null;
}

const after = `${JSON.stringify(manifest, null, 2)}\n`;
const changed = JSON.stringify(JSON.parse(before)) !== JSON.stringify(manifest);
if (changed && !checkOnly) fs.writeFileSync(manifestPath, after);

// Report: which mode each chapter ends up in.
const { plan, warnings } = buildMediaPlan({ publicDir });
console.log('\nChapter    Colour  Mode         Source');
for (const chapter of CHAPTER_IDS) {
  for (const color of plan.chapters[chapter].colors) {
    const v = plan.chapters[chapter].variants[color];
    const source = v.mode === 'sequence' ? `${v.dir} (${v.frames} frames, ${v.width}×${v.height})` : v.missing ? `MISSING ${v.name}` : v.src;
    console.log(`${chapter.padEnd(10)} ${color.padEnd(7)} ${v.mode.padEnd(12)} ${source}`);
  }
}
console.log(`detail     -       ${plan.detail ? plan.detail.mode.padEnd(12) : 'none        '} ${plan.detail ? plan.detail.src || plan.detail.name : ''}`);
for (const line of [...new Set([...notes, ...(checkOnly || !changed ? warnings : [])])]) console.log(`  ! ${line}`);
console.log(changed ? (checkOnly ? '\nmanifest.json is out of date: run "npm run manifest".' : '\nmanifest.json updated.') : '\nmanifest.json is up to date.');
if (checkOnly && changed) process.exit(1);
