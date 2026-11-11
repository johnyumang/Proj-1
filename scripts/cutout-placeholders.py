#!/usr/bin/env python3
"""Cut the placeholder product photos out of their backgrounds and light them for the dark stage.

For every placeholder in public/media/belt/manifest.json that names a "cutout" file, this reads
the photo ("file"), removes the background and writes the cut-out (plus the smaller copies the
page picks by screen size) next to it. The picture keeps its canvas, so hotspots and the
chapter-4 push-in, which are fractions of the photo, stay where they are.

What is changed, and what is not:
  - the background is removed (BiRefNet matting model, run locally through rembg);
  - low-key "shadow" lighting: light from high camera-left, the far side falls into shadow, a
    narrow warm rim traces the shadow-side edge so the figure does not merge with the stage;
  - the cropped lower edge fades out, so a figure cut at the thigh does not end in a hard line.
Nothing is added to or removed from the person or the belt: only transparency and brightness
change. The original photos stay untouched beside the cut-outs.

Setup (once; the matting model, about 1 GB, is downloaded on first use):
    python3 -m venv .venv-cutout && .venv-cutout/bin/pip install "rembg[cpu]" pillow numpy

Run from the repository root:
    .venv-cutout/bin/python scripts/cutout-placeholders.py            # all placeholders
    .venv-cutout/bin/python scripts/cutout-placeholders.py navy       # only this placeholder id
then `npm run build`.

Per-photo settings live in the manifest, under placeholders.<id>.grade (all optional):
    { "shadow": 0.6, "rim": 0.2, "fade": 0.2 }
shadow 0 = no falloff, 1 = far side black; rim 0 = none; fade = share of the height over which
the lower edge fades out (0 = keep the hard edge, for photos that show the feet).

The same script lights own-model stills that were shot or generated evenly lit: point a
placeholder's "file" at the picture. Plates made with the shadow-lighting block of
prompts/02-own-model-sheets.md need no grading; export those straight to still/<chapter>/<color>.webp.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "public" / "media" / "belt"
WIDTHS = (480, 800, 1100)
DEFAULTS = {"shadow": 0.6, "rim": 0.2, "fade": 0.2}


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def grade(cut, shadow, rim, fade):
    rgba = np.asarray(cut.convert("RGBA")).astype(np.float32) / 255.0
    rgb, alpha = rgba[..., :3], rgba[..., 3]
    h, w = alpha.shape
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)

    # Left-to-right position within the figure itself, so the falloff sits on the body whatever the framing.
    cols = np.where(alpha.max(axis=0) > 0.5)[0]
    x0, x1 = (cols[0], cols[-1]) if len(cols) else (0, w - 1)
    u = (xs - x0) / max(1, x1 - x0)
    v = ys / (h - 1)

    # Key light: full on the camera-left side, falling off towards the right and a little towards the floor.
    light = 1.0 - shadow * smoothstep(0.3, 1.02, u + 0.1 * (v - 0.5))
    light *= 1.0 - 0.22 * smoothstep(0.55, 1.0, v)

    # Rim light: pixels close to a right-facing edge of the silhouette, on the shadow side only.
    reach = max(2, round(w * 0.006))
    shifted = np.zeros_like(alpha)
    shifted[:, :-reach] = alpha[:, reach:]
    edge = np.clip(alpha - shifted, 0, 1)
    edge = Image.fromarray((edge * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(max(0.8, reach * 0.4)))
    edge = np.asarray(edge).astype(np.float32) / 255.0 * smoothstep(0.35, 0.8, u)
    warm = np.array([1.0, 0.86, 0.68], dtype=np.float32)

    out = rgb * light[..., None]
    out = np.clip(out + (1.0 - out) * (rim * edge)[..., None] * warm, 0, 1)
    if fade > 0:
        alpha = alpha * (1.0 - smoothstep(1.0 - fade, 1.0, v))
    return Image.fromarray((np.dstack([out, alpha]) * 255 + 0.5).astype(np.uint8), "RGBA")


def main():
    from rembg import new_session, remove  # imported here so --help works without it

    only = set(sys.argv[1:])
    manifest = json.loads((MEDIA / "manifest.json").read_text(encoding="utf-8"))
    session = None
    for pid, entry in manifest.get("placeholders", {}).items():
        if only and pid not in only:
            continue
        if not entry.get("cutout"):
            print(f"{pid}: no \"cutout\" named in the manifest, skipped")
            continue
        src, dst = MEDIA / entry["file"], MEDIA / entry["cutout"]
        if not src.exists():
            print(f"{pid}: {entry['file']} is missing, skipped")
            continue
        session = session or new_session("birefnet-general")
        cut = remove(Image.open(src).convert("RGB"), session=session, post_process_mask=False)
        settings = {**DEFAULTS, **entry.get("grade", {})}
        plate = grade(cut, settings["shadow"], settings["rim"], settings["fade"])
        plate.save(dst, "WEBP", quality=84, method=6)
        made = [dst.name]
        for width in WIDTHS:
            small = dst.with_name(f"{dst.stem}-w{width}.webp")
            if width < plate.width:
                plate.resize((width, round(plate.height * width / plate.width)), Image.LANCZOS).save(small, "WEBP", quality=82, method=6)
                made.append(small.name)
            elif small.exists():
                small.unlink()
        print(f"{pid}: {plate.width}×{plate.height}, shadow {settings['shadow']}, rim {settings['rim']}, fade {settings['fade']} → {', '.join(made)}")


if __name__ == "__main__":
    main()
