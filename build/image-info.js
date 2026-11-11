/**
 * Minimal image header reader (Node). Returns { width, height, alpha } for WebP, PNG and JPEG
 * files without any dependency. Used by the build (media plan) and by scripts/scan-media.mjs.
 */
import fs from 'node:fs';

export function imageInfo(file) {
  const buf = fs.readFileSync(file);
  const info = webp(buf) || png(buf) || jpeg(buf);
  if (!info) throw new Error(`Unsupported or corrupt image: ${file}`);
  return info;
}

function webp(b) {
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const fourcc = b.toString('ascii', 12, 16);
  if (fourcc === 'VP8 ') {
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff, alpha: false };
  }
  if (fourcc === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1, alpha: Boolean((bits >>> 28) & 1) };
  }
  if (fourcc === 'VP8X') {
    return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3), alpha: Boolean(b[20] & 0x10) };
  }
  return null;
}

function png(b) {
  if (b.length < 26 || b.readUInt32BE(0) !== 0x89504e47) return null;
  const colorType = b[25];
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), alpha: colorType === 4 || colorType === 6 };
}

function jpeg(b) {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i += 1; continue; }
    const marker = b[i + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01 || marker === 0xff) { i += 2; continue; }
    const len = b.readUInt16BE(i + 2);
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5), alpha: false };
    i += 2 + len;
  }
  return null;
}
