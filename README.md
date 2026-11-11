# SIIL Ostomy Belt — scroll-driven listing page (concept preview)

A single static page for the SIIL Ostomy Belt. One model image stays on a dark stage while
scrolling drives everything around it; the practical sections follow on a light background.
Built from `prompts/01-ostomy-belt-scroll-page.md`.

This is a **concept preview, not the live store**: the page carries `noindex,nofollow`, says so
in its footer, and every buying action opens `https://www.siilostomy.com/en/ostomy-belt/` in a
new tab.

## Run, build, preview

Requires Node 20.19+ or 22.12+.

```bash
npm install
npm run dev        # development server (Vite prints the URL, usually http://localhost:5173)
npm run build      # static site in dist/
npm run preview    # serves dist/ at http://localhost:4173
npm run manifest   # after adding or replacing images: measure them into manifest.json
npm run single     # after a build: pack the page into one file, preview/siil-ostomy-belt-preview.html
```

`preview/siil-ostomy-belt-preview.html` is the whole page in a single file (styles, script, fonts
and pictures embedded). It opens with a double click and can be sent by mail or chat for review.
It is a review copy: deploy `dist/`, not this file.

`dist/` uses relative URLs only (`base: './'`), so it can be copied into any sub-folder of any
static host.

## What is where

```
index.html                 page shell; a small inline script picks the presentation before first paint
vite.config.js             Vite config (base './', prerender plugin)
build/
  prerender.js             Vite plugin: renders the page body into index.html at build time
  media-plan.js            decides per chapter and colour: sequence, still or placeholder
  image-info.js            reads width/height/alpha from WebP, PNG and JPEG headers
scripts/scan-media.mjs     npm run manifest
scripts/cutout-placeholders.py   cuts the placeholder photos out of their backgrounds and lights them for the dark stage
src/
  content/belt.en.js       ALL customer-facing copy, transcribed from section 4 of the prompt
  content/ui.en.js         interface labels and ARIA labels
  content/reviews.json     [] — the reviews band renders only when this has entries
  render/                  HTML templates (plain functions, no copy inside)
  styles/                  tokens, base, nav, chapters (plain page), story (pinned page), light, footer
  story/                   the scroll story: stage, chapter timelines, intro, image loading
  ui/                      colour choice, FAQ accordion, unit toggle, nav and buy-bar behaviour
  main.js                  entry point
public/media/belt/         images and manifest.json (see "Replacing the images")
public/media/brand/        the SIIL logo used in the footer
docs/screens/              screenshots of every chapter (see "Screenshots and checks")
docs/video/                a 45-second scroll-through of the page (desktop)
preview/                   the page as one self-contained HTML file (npm run single)
OPEN-QUESTIONS.md          claims held back until the owner confirms, and other open points
```

## How the page works

The built HTML already contains every word and every still image. Three presentations come
from that one document:

| Presentation | When | What you get |
|---|---|---|
| Plain page | no JavaScript, `prefers-reduced-motion: reduce`, or a viewport too short to hold a chapter (under 560 px tall; under 620 px on screens narrower than 900 px) | seven normal sections on the dark background (still image, all text, final counter values), then the light sections. Nothing is pinned or scrubbed. Colour and unit radios work through CSS alone. |
| Story, desktop | 900 px and wider | one stage layer pinned for the whole story; text beside the model. From 1200 px the hero and closing chapters use three columns (copy, model in front of the giant word, more copy); from 900 to 1199 px they keep the model on the right and show their two text panels one after the other |
| Story, compact | below 900 px | model in the upper half, the text panels of a chapter take turns in the lower half, sticky buy bar after chapter 1 |

The story as built:

0. **Intro** (once on load at the top of the page, about 2.2 s, skippable by scrolling): black stage, floor light comes up, the image appears with the hero copy, SIIL reveals letter by letter behind it, navigation last.
1. **Hero**: image centred in front of the giant word; hero copy bottom left with buy button and size-guide link; spec line bottom right.
2. **Fit**: image moves right; counter 7 "sizes XS–3XL", then 55 → 140 "cm waist"; hotspots on the belt parts that are visible, the rest as chips; accent ivory.
3. **Clothes**: image crosses to the left, headline enters line by line out of a blur; accent bronze.
4. **Access**: push in on the access opening until it fills the frame, dissolve to the close view, which settles beside the headline and the three-row list.
5. **Pool**: layout flips, navy belt, floor light and accent turn blue.
6. **Colors**: a radio group switches image, accent and the buy label at once (click, not scroll).
7. **Close**: SIIL returns, image back in the hero position in the chosen colour, counter 30 "days from delivery", closing headline, buy button, shipping lines.
8. **Wipe**: the light sections rise over the pinned stage. The difference, Size guide (in/cm), Specifications, FAQ, Complete the kit, footer.

Technique, for whoever maintains it:

- GSAP 3 with ScrollTrigger and SplitText, native scrolling, `scrub: 0.8`.
- Exactly one ScrollTrigger per chapter, each owning one timeline (`src/story/timelines.js`); the schedule of every chapter is data in `src/story/chapters.js`.
- Timelines never touch the stage. Each chapter tweens numbers on its own small object; `src/story/stage.js` reads all of them and derives the picture (position and scale are the hero pose plus the sum of every chapter's own movement). The frame on screen is therefore a pure function of scroll position: scrolling back, reloading mid-page, resizing and nav jumps cannot leave stale state.
- Chapter text is pinned with CSS `position: sticky`, not with ScrollTrigger pins. Sticky needs every ancestor of `.story` to be free of `overflow: hidden/auto` (the page uses `overflow-x: clip`).
- Only `transform`, `opacity`, the canvas and the accent custom property are written while scrolling (plus one custom property on the chapter-4 close view, which fades its outline in as it comes to rest). The headline "out of a blur" effect cross-fades a fixed, pre-blurred copy of each line instead of animating a filter.
- The story is rebuilt when the viewport width changes or the fonts arrive late; every trigger and timeline is killed and the split text reverted on teardown.

## Replacing the images

The page is built for SIIL's own-model image set (see `prompts/02-own-model-sheets.md`) and
runs on placeholders until those exist. **Files on disk decide** what each chapter shows:

```
public/media/belt/
  manifest.json
  seq/<chapter>/<color>/0001.webp …     frames with transparency, 1080 px tall     → sequence mode
  seq/<chapter>/<color>/m/0001.webp …   720 px tall set, used below 900 px          (optional)
  still/<chapter>/<color>.webp          one frame with transparency                → still mode
  detail/access.webp                    real close-up photo of the access opening  (chapter 4)
  placeholder/…                         real SIIL product photos, and their cut-outs → placeholder mode
```

Chapters: `hero`, `fit`, `clothes`, `access`, `pool`, `colors`, `close`. Colours: `beige`, `navy`, `black`.

| Mode | Chosen when | What the page does |
|---|---|---|
| sequence | `seq/<chapter>/<color>/0001.webp` exists | first frame loads at once, the rest in the background (nearest chapter first); frames are drawn to one canvas (device pixel ratio up to 2); a frame index is tweened with snap and the canvas is redrawn only when it changes |
| still | no sequence, but `still/<chapter>/<color>.webp` exists | the cut-out still stands on the stage; it moves, scales slightly and cross-fades between chapters |
| placeholder | neither exists | the product photo named in the manifest, marked `data-placeholder`. If the manifest also names a `cutout` for it and that file is on disk, the cut-out stands on the stage like a still; otherwise the photo is shown whole as a framed plate. If the photo is missing, a neutral card with the file name |

Steps:

1. Copy the files into the folders above (frame numbers start at `0001`, no gaps).
2. `npm run manifest` — writes frame count, pixel size and transparency into `manifest.json` and prints which mode every chapter now uses, plus anything still missing.
3. Fill in by hand what cannot be measured, in `manifest.json` under `chapters.<chapter>.<color>`:
   - `alt`: what is visible, for example "Woman in a beige SIIL Ostomy Belt under an open white shirt". Never "customer", "patient", "real ostomate", "reviewer" or "nurse": the models are illustrations.
   - `hotspots` (chapter `fit`): `{ "id": "pocket" | "fastening" | "fabric", "x": 0–1, "y": 0–1, "side": "left" | "right", "frames": [first, last] }`. Positions are fractions of the frame. Add a hotspot only for a part that is actually visible; an item without one is shown as a chip in the text column.
   - `focal` (chapter `access`): `{ "x", "y", "w", "h" }`, the centre and size of the region that should fill the screen at the end of the push-in.
   - optional `light`: `{ "floor": 0.35–0.55, "rim": 0–0.7 }` to raise the floor and rim light for a dark belt or deep skin tones. The skin itself is never lightened.
4. `npm run build`. The build warns about files that do not match the manifest.

`access` has `"use": "hero"`: with own-model files it pushes in on the hero plate (the shot
list has no separate access plate), then cross-fades to `detail/access.webp`.

Sequence size: every frame of every sequence is downloaded in the background and kept ready
for drawing. A 4-second clip exported at every frame is about 100 to 120 frames per chapter;
exporting every second frame (50 to 60 frames) scrubs just as smoothly at `scrub: 0.8` and
halves the download and the memory. Sequence mode has so far only been exercised with a
36-frame synthetic test sequence, not with real 1080 px frames.

### Images to replace

All four are real SIIL product photos downloaded on 2026-11-11. Each also has smaller WebP
copies next to it (`-w480`, `-w800`, `-w1100`) that the page picks by screen size; delete them
together with the original.

Next to each photo sits a cut-out of it (`…-cut.webp` and its smaller copies), and the cut-out
is what the page shows. It is the same photo on the same canvas with the background removed,
low-key "shadow" lighting applied (light from high camera-left, the far side in shadow, a thin
warm rim on the shadow side) and the cropped lower edge faded out. Nothing about the person or
the belt is added or removed. `scripts/cutout-placeholders.py` makes them and explains the
setup; per-photo strength is set under `placeholders.<id>.grade` in the manifest. To go back to
framed photos, remove the `cutout` lines from the manifest and build.

| Placeholder file (`public/media/belt/placeholder/`) | Source | Shown in | Replace with |
|---|---|---|---|
| `Ostomy-BELT-WOMEN-BEIGE-SIIL-Ostomy-3-scaled.jpg` | `https://www.siilostomy.com/wp-content/uploads/2025/09/Ostomy-BELT-WOMEN-BEIGE-SIIL-Ostomy-3-scaled.jpg` | hero, fit, clothes, colors (beige), close (beige) | `still/hero/beige.webp`, `still/fit/beige.webp`, `still/clothes/beige.webp`, `still/colors/beige.webp`, `still/close/beige.webp` and the `seq/…/beige/` sets |
| `Ostomy-BELT-WOMEN-BEIGE-SIIL-Ostomy-6-1-scaled.jpg` | `https://www.siilostomy.com/wp-content/uploads/2025/09/Ostomy-BELT-WOMEN-BEIGE-SIIL-Ostomy-6-1-scaled.jpg` | access (push-in plate; the close view is a crop of the same cut-out, so the hand-over cannot be seen) | `detail/access.webp` (a real photograph), plus a `focal` region on the hero plate |
| `Siilostomy76890-683x1024.jpg` | `https://www.siilostomy.com/wp-content/uploads/2023/01/Siilostomy76890-683x1024.jpg` | pool, colors (navy), close (navy) | `still/pool/navy.webp`, `still/colors/navy.webp`, `still/close/navy.webp` and `seq/pool/navy/` |
| `ostomy-belt-for-men-and-women-square.jpg` | `https://www.siilostomy.com/wp-content/uploads/2026/10/ostomy-belt-for-men-and-women-square.jpg` | colors (black), close (black); it also shows a navy belt | `still/colors/black.webp`, `still/close/black.webp` |

When a chapter has no placeholder left, remove its `placeholder` entry from the manifest; when
none is left, delete the `placeholder/` folder and the `placeholders` block.

## Screenshots and checks

`docs/screens/` holds captures of the built `dist/` (Chromium, device scale factor 1). Each
chapter is shown at 10 % (`start`), 50 % (`middle`) and 90 % (`end`) of its scroll range, after
the scrub has settled.

| Folder | What it shows |
|---|---|
| `desktop-1440x900/` | the pinned story, seven chapters × three positions |
| `phone-390x844/` | the same on a phone-sized viewport (compact layout, sticky buy bar) |
| `reduced-motion-1440x900/`, `reduced-motion-390x844/` | the same scroll positions with `prefers-reduced-motion: reduce`: plain sections, nothing pinned |
| `tablet-1024x768/` | the middle of each chapter at 1024 × 768, where the hero and closing chapters use their side-by-side arrangement |
| `more/` | the dark-to-light wipe, the light sections and footer, the navy and black colour choice (desktop and phone) |
| `highlights/` | the readable frame of each chapter at double resolution, for presenting (desktop 1440 × 900 and phone 390 × 844) |

A `start` frame is taken while the stage is still changing over from the chapter before, so its
text is only beginning to arrive; that is intended.

What to check again after changing content, images or layout (all of these were run against
`dist/` with Playwright; the scripts are not part of the repository):

- no console errors, failed requests or horizontal scrolling at 390, 768, 1280, 1440 and 1920 px;
- every chapter at its start, middle and end, in motion and with reduced motion;
- scroll to the end and back, reload in the middle of a chapter, resize away and back, jump with the nav links: the same scroll position must give the same picture;
- colour choice: image, accent and buy label change at once and are still applied in the last chapter;
- reduced motion and no JavaScript: no pinning, all text and still images visible, final counter values;
- keyboard: skip link first, visible focus, tabbing into a later chapter scrolls it into view;
- the page text against `src/content/belt.en.js` (nothing added) and against section 5 of the prompt (nothing held back has slipped in).

## Content rules

- Every word of customer-facing copy is in `src/content/belt.en.js`, verbatim from section 4 of the prompt. Templates contain no copy. Do not paraphrase or extend it there; if a fact is missing, leave the element out and add a line to `OPEN-QUESTIONS.md`.
- The only other text on the page: interface and ARIA labels (`src/content/ui.en.js`), the giant word "SIIL" and the footer line "Concept preview — not the live store" (both dictated by the prompt, kept in `belt.en.js` as `brief`), and the image descriptions in `public/media/belt/manifest.json`, which say what is visible and nothing more.
- Nothing from section 5 of the prompt is on the page (ratings, wearer counts, quoted reviews, leak and hernia statistics, superlatives, competitor table, endorsements). `OPEN-QUESTIONS.md` lists each one.
- `src/content/reviews.json` is an empty array. The reviews band appears only when it holds entries exported from the real review system: `[{ "text": "…", "name": "…", "date": "2026-01-31", "url": "https://…" }]` (`date` and `url` optional). No image is placed in or next to it.

## Moving it into the WordPress child theme later

The build is plain HTML, CSS and ES modules, so it ports without a framework:

1. **Template.** Add a page template to the child theme that prints this page's markup on a blank canvas (no page-builder wrappers). Either port `src/render/*.js` to PHP template parts fed from one content array per language, or let the build write the rendered body to a partial and include that. The theme's own header and footer can replace `.nav` and `.footer`; keep the `data-nav`, `data-light`, `data-story`, `data-stage` and `data-buybar` hooks or adjust `src/ui/chrome.js`.
2. **Assets.** Build with `build.manifest: true` and enqueue the hashed CSS and the module script from Vite's manifest (`wp_enqueue_style`, `wp_enqueue_script` with `type="module"`). Print the small inline script from `index.html` in `<head>` before the stylesheet, and the font preloads next to it. Copy `media/belt/` into the theme (or uploads) and keep it relative to the page, or set the base path in `src/render/parts.js` and `src/story/stage.js`.
3. **Sticky and fixed layout.** No ancestor of `.story` may have `overflow: hidden/auto`, a transform or a filter; any of these breaks the pinned text and the stage. Check the theme wrapper and optimisation plugins that wrap content.
4. **Buying.** Replace the links to the live page with the real add-to-cart form: the colour radio group maps to the colour variation, a size control has to be added, and the buy buttons submit instead of opening a new tab.
5. **Content.** Move `belt.en.js` into the CMS (one set per language) and keep the rule that only verified copy goes in. Reviews come from the review system's export, not from page text.
6. **Launch.** Remove `noindex,nofollow` and the "Concept preview" footer line, add title/description/Open Graph from approved copy, and repeat the checks listed under "Screenshots and checks" on the theme.

## Credits and licences

GSAP 3 (ScrollTrigger, SplitText) under GreenSock's standard no-charge licence. Albert Sans and
Cormorant Garamond via `@fontsource`, SIL Open Font License, self-hosted. Photos and logo are
SIIL's own, downloaded from siilostomy.com for this preview. The cut-outs were made locally
with rembg and the BiRefNet matting model (both MIT licensed); neither is shipped with the page.
