# Prompt 1 — SIIL Ostomy Belt, scroll-driven listing page

**How to use:** open Claude Code on this repository and paste everything below the line as one message.
The two design skills it calls for are already in `.claude/skills/` in this repo.
Facts were captured from `https://www.siilostomy.com/en/ostomy-belt/` on 2026-11-11.

---

Build a scroll-driven listing page for the **SIIL Ostomy Belt**. It reproduces the scroll mechanics of a reference page (a dark, cinematic product page where one hero object stays on screen while scrolling drives everything around it), using SIIL's real product, real copy and SIIL's own models.

Read sections 1 and 5 before writing any code. They decide what is allowed on the page.

## 1. Rules that override everything else

1. **Invent nothing.** Every word of customer-facing copy, every number, every product detail comes from section 4. If a chapter needs a fact that is not in section 4, leave that element out and add a line to `OPEN-QUESTIONS.md`. Do not paraphrase, "improve" or extend the copy. Interface labels such as "Menu", "Close", "Skip to content" and ARIA labels are the only text you may write yourself.
2. **Nothing from section 5 goes on the page.** Those claims are on the live site but contradict each other or have no source.
3. **Models are illustrations, never evidence.** The people in the images are SIIL's own generated models. Never caption or alt-text them as customers, "real ostomates", reviewers, nurses or patients, and never place a model image next to a review. Alt text describes what is visible ("Woman in a beige SIIL Ostomy Belt under an open white shirt").
4. **No medical promises.** No hernia or leak statistics, no "prevents", no "#1", no "best", no competitor names. Keep the post-surgery FAQ answers exactly as written: they send the reader to their stoma care team.
5. **This is a concept preview.** Add `<meta name="robots" content="noindex,nofollow">` and a small footer line "Concept preview — not the live store". Buying actions open the live page `https://www.siilostomy.com/en/ostomy-belt/` in a new tab.
6. **Use the skills.** Load `gsap-scrolltrigger` before writing any animation code and `modern-web-design` before designing. Follow their pinning, scrubbing, cleanup, performance and accessibility guidance.

## 2. The reference, reverse-engineered

The reference is a single page for a watch. These are its mechanics. Reproduce the mechanics, not the watch, its copy or its artwork.

| # | What happens on screen | How it is done |
|---|---|---|
| A | Black screen. The product fades in over a pool of coloured light on the floor. A giant word appears behind it, letter by letter, with a gradient fill. The navigation fades in last. | A timed intro timeline that runs once on load, then hands control to scroll. |
| B | The hero object never leaves. It stays fixed in the viewport for the whole story while text scrolls past it. | One fixed, full-viewport stage layer. Chapters are tall scroll sections with sticky text. |
| C | Scrolling turns, moves and resizes the object. Scroll back and it reverses exactly. | Scroll-scrubbed animation (`scrub`), no time-based playback after the intro. |
| D | A giant word sits behind the object, and the object overlaps its middle letters. | Three layers: word, then object with transparency, then text. |
| E | Huge numbers count up as you scroll (49, 3000, 100, 36), each with a small unit and a short headline under it. | A number tweened by scroll progress and written to the DOM on every update. |
| F | Headlines enter line by line, sliding up out of a blur, and leave the same way. | Text split into lines, staggered, tied to scroll. |
| G | The accent colour changes per chapter (orange, lilac, amber, blue). The buy button, the floor light and the gradient word all follow it. | One CSS custom property tweened per chapter and used everywhere. |
| H | Small labels with a dot and a leader line point at parts of the object and stay attached to it. | Hotspots positioned in the object's own coordinates, shown for a range of scroll. |
| I | The camera pushes into one detail until it fills the screen; the object dissolves and the detail floats free beside a headline and a three-row spec list. | Scale from a focal point, then cross-fade to a detail layer. |
| J | Layout alternates: text left and object right, then the reverse. | Per-chapter stage position. |
| K | Three colour swatches. Clicking one recolours the object and the page accent immediately, and the choice is still applied in the last chapter. | An interactive control that sets shared state; scroll does not drive it. |
| L | The ending mirrors the opening: giant word returns, object returns to its first pose, one counter, a short headline, the buy button with the price. | Bookend chapter reusing the hero layout. |
| M | After the story: a three-column comparison with large values, then a quiet footer. | Normal document flow, no pinning. |

The reference renders its object in real-time 3D. A garment on a body cannot be modelled that way without inventing the product, so this page gets the same result from **image sequences of SIIL's own models** drawn to a canvas and scrubbed by scroll.

## 3. Storyboard

Seven pinned chapters on a dark stage, then four practical sections on a light background. All text keys refer to section 4.

| Ch | Reference chapter it mirrors | Stage (model action) | Text | Counter | Accent |
|---|---|---|---|---|---|
| 0 Intro | A | Dark. Floor light comes up, model appears wearing the beige belt, giant word **SIIL** reveals behind them, nav fades in. Runs once, about 2.2 s, skippable by scrolling. | — | — | beige |
| 1 Hero | B, D | Model centred, three-quarter view, belt visible. Word SIIL behind. | `hero.*` bottom left; buy button and size-guide link; `hero.specline` bottom right | — | beige |
| 2 Fit | C, E, H | Model turns from front to side profile. Three hotspots attach to the belt. | `fit.*` | **7** `fit.counter1.unit`, then **55 → 140** `fit.counter2.unit` | ivory |
| 3 Clothes | C, F | Model faces front and lowers their shirt over the belt; the outline stays smooth. | `clothes.*` | — | bronze |
| 4 Access | I | Push in on the access opening until it fills the frame, then cross-fade to the detail image beside the text and the three-row list. | `access.*` | — | bronze |
| 5 Pool | G, J | Layout flips. Model in the navy belt at the water, floor light turns blue. | `pool.*` | — | blue |
| 6 Colors | K | Three stills in the same pose. Swatches switch colour, accent and the label on the buy button. Clicking, not scrolling. | `colors.*` | — | follows choice |
| 7 Close | L | Word SIIL returns, model returns to the hero pose in the chosen colour. | `close.*`, buy button, shipping lines | **30** `close.counter.unit` | follows choice |

Light sections, in this order: **The difference** (comparison table), **Size guide** (cm/inch toggle), **Specifications**, **FAQ** (accordion), **Complete the kit**, footer. A reviews band exists in the layout but renders only if `src/content/reviews.json` has entries; ship that file as an empty array.

Mobile adds a sticky bottom bar with `sticky.label` and `sticky.cta` that appears after chapter 1 and hides over the footer.

## 4. Verified content (use verbatim)

```yaml
meta:
  title: "SIIL Ostomy Belt"
  product_url: "https://www.siilostomy.com/en/ostomy-belt/"
  price: "$76.99"
  currency_note: "USD, English (US) page"

nav:
  brand: "SIIL Ostomy Belt"
  links: ["Why SIIL Belt", "Size guide", "Specifications", "FAQ"]
  cta: "Add to cart — $76.99"

hero:
  eyebrow: "Ostomy belt"
  title: "SIIL Ostomy Belt"
  headline: "Forget you're wearing a bag."
  bullets:
    - "The inner pocket carries its weight: your pouch stays flat and still."
    - "Invisible under jeans, shirts and fitted dresses."
    - "Empty it, swim in it, sleep in it: the belt stays on."
  cta: "Add to cart — $76.99"
  secondary: "📏 Size guide"
  shipping: "Free US shipping on orders over $50"
  specline: "7 sizes XS–3XL · 55–140 cm waist · Beige, navy blue and black"

fit:
  eyebrow: "Comfort that fits you"
  headline: "Put it on. Forget it's there."
  body: "Stretch, take a walk or settle into your favorite chair. The inner pocket holds your pouch close, while the adjustable VELCRO® fastening lets you find a fit that feels right."
  chips: ["7 sizes XS–3XL", "55–140 cm waist"]
  cta: "Pick your size"
  counter1: { value: 7, unit: "sizes XS–3XL" }
  counter2: { from: 55, to: 140, unit: "cm waist" }
  hotspots:
    - { label: "Pouch pocket", text: "An inner pocket holds the pouch flat and carries its weight as it fills" }
    - { label: "Fastening", text: "Adjustable VELCRO® closure, with a zipper for quick pouch access" }
    - { label: "Fabric", text: "Breathable, quick-dry, antibacterial and hypoallergenic; pool and sea ready" }

clothes:
  eyebrow: "Your clothes. Your choice."
  headline: "Wear the clothes you love."
  body: "Your pouch lies flat against your body, so nothing shows under your clothes. Wear the outfits that feel like you."
  chips: ["Universal pouch fit", "1- & 2-piece systems"]
  cta: "Shop the belt"

access:
  eyebrow: "Keep your routine simple"
  headline: "Empty your pouch. Keep your belt on."
  body: "The access opening lets you reach your pouch without taking the belt off. Empty it into the toilet, close your pouch and the opening, then get back to your day."
  chips: ["Reinforced YKK zip", "Both-side access"]
  cta: "Add yours to cart"
  list:
    - { label: "Works with", value: "All major pouch brands, one-piece or two-piece; colostomy, ileostomy or urostomy" }
    - { label: "Fastening", value: "Adjustable VELCRO® closure, with a zipper for quick pouch access" }
    - { label: "For", value: "Women and men" }

pool:
  eyebrow: "Make room for your plans"
  headline: "Back in the pool."
  body: "Swim, walk, chase the kids: the belt holds your pouch through all of it. Quick-dry fabric, comfortable from the sea to the towel to lunch."
  chips: ["Hypoallergenic", "Pool + sea OK", "Machine wash"]
  cta: "Get my belt"

colors:
  eyebrow: "Colors"
  headline: "Beige, navy blue and black"
  body: "Choose Beige, Navy Blue or Black to suit your clothes and preferences."
  options: ["Beige", "Navy Blue", "Black"]

close:
  eyebrow: "Why SIIL Belt"
  headline: "The bag stays put. You get your day back."
  body: "A walk in the park, coffee with your best friend, the grandkids on your lap: you think about everything except your bag."
  counter: { value: 30, unit: "days from delivery" }
  returns: "Try it at home: you have 30 days from delivery to return or exchange it, and your first size exchange ships free."
  cta: "Add to cart — $76.99"
  lines:
    - "Free US shipping on orders over $50"
    - "Order now · arrives in 3–5 business days"
    - "Discreet packaging · Plain box, your privacy first"

sticky:
  label: "SIIL Ostomy Belt · {color} · pick size"
  cta: "Add — $76.99"

difference:
  eyebrow: "The difference"
  title: "SIIL Belt vs. cheap belt · surgical binder"
  headline: "Same waist. Different day."
  columns: ["SIIL Belt", "Cheap belt", "Surgical binder"]
  rows:
    - ["Internal pouch pocket", "Holds bag flat", "No pocket", "No pocket"]
    - ["Zipper pouch-access", "Empty without removing", "Remove every time", "Remove every time"]
    - ["Quick-dry, swim-ready", "Pool + sea OK", "Cotton only", "Not waterproof"]
    - ["Discreet under clothes", "Invisible", "Bulky seams", "Medical look"]
    - ["Hypoallergenic fabric", "Skin-safe daily wear", "Generic", "Stiff"]
  # The live table has a sixth row, "Recommended by nurses". It is held back: see section 5.

size_guide:
  eyebrow: "Size guide"
  headline: "Find your perfect fit"
  body: "Measure your waist at the level of the stoma over light clothing. The VELCRO® gives you full adjustability."
  toggle: ["Inches", "CM"]
  columns: ["Size", "Waist", "Best for"]
  rows:
    - ["XS",  "21.7–29.5 in", "55–75 cm",   "Petite frames · post-op recovery"]
    - ["S",   "29.5–34.3 in", "75–87 cm",   "Slim build"]
    - ["M",   "34.6–38.2 in", "88–97 cm",   "Average build · most common"]
    - ["L",   "38.6–42.5 in", "98–108 cm",  "Curvier · sturdy build"]
    - ["XL",  "42.9–46.5 in", "109–118 cm", "Plus size"]
    - ["XXL", "46.9–50.8 in", "119–129 cm", "Extended plus"]
    - ["3XL", "51.2–55.1 in", "130–140 cm", "Extra-extended · large frames"]
  link: { text: "📏 Open the interactive size finder →", url: "https://www.siilostomy.com/en/size-guide/" }

specifications:
  eyebrow: "Specifications"
  headline: "The ostomy belt at a glance"
  body: "Everything you need to compare before you choose."
  rows:
    - ["Works with", "All major pouch brands, one-piece or two-piece; colostomy, ileostomy or urostomy"]
    - ["Sizes", "7 sizes, XS–3XL: waist 21.7–55.1 in (55–140 cm)"]
    - ["Fastening", "Adjustable VELCRO® closure, with a zipper for quick pouch access"]
    - ["Pouch pocket", "An inner pocket holds the pouch flat and carries its weight as it fills"]
    - ["Fabric", "Breathable, quick-dry, antibacterial and hypoallergenic; pool and sea ready"]
    - ["Care", "Machine wash on a gentle cycle, cold water, no bleach; air dry"]
    - ["Colors", "Beige, navy blue and black"]
    - ["For", "Women and men"]
    - ["Shipping", "Ships in 24h, arrives in 3–5 business days; free US shipping on orders over $50"]
    - ["Returns", "30 days from delivery; your first size exchange is free"]
  # The live table also has Leaks, Hernia and Confidence rows. They are held back: see section 5.

faq:
  eyebrow: "FAQ"
  headline: "Real questions, real answers"
  body: "Everything ostomates ask before their first SIIL belt."
  items:
    - q: "What is the SIIL Ostomy Belt?"
      a: "The SIIL Ostomy Belt supports the weight of your pouch and holds it close to your body, helping you feel more comfortable as you move. It helps smooth the pouch’s outline under clothes and lets you reach it for emptying without taking the belt off."
    - q: "Can I wear it with any pouch system?"
      a: "Yes. The internal pocket fits all standard pouches from Coloplast, Hollister, ConvaTec, B.Braun, Welland, Salts, NuHope, Pelican and Marlen — both one-piece and two-piece systems."
    - q: "Can I sleep with the SIIL belt?"
      a: "Absolutely — that's one of its main use cases. The breathable stretch fabric is comfortable through the night, and the internal pocket keeps the pouch flat when you turn over. Loosen the VELCRO® one notch for sleep mode."
    - q: "Can I wear it for swimming or in the shower?"
      a: "Yes. The belt supports your pouch in the pool or sea, and its quick-drying fabric is suitable for use in water. Rinse it after swimming and follow the care instructions on the label."
    - q: "How do I empty the bag without removing the belt?"
      a: "Use the access opening to reach your pouch and empty it into the toilet. Close your pouch securely, then close the opening. The belt can stay on throughout."
    - q: "Is it for men, women, or both?"
      a: "Both. The belt is unisex and comes in seven sizes, XS–3XL, with an adjustable fastening. Choose Beige, Navy Blue or Black to suit your clothes and preferences."
    - q: "How do I choose my size?"
      a: "Measure around your waist at stoma level, standing naturally and breathing normally. Open the size guide beside the size selector to compare your measurement in inches or centimeters. Use the belt guide, as sizing differs between product families."
    - q: "How long should I wear it each day?"
      a: "Choose a comfortable fit and adjust it as needed. Follow your stoma care team’s advice after surgery."
    - q: "Is the belt suitable just after surgery?"
      a: "Ask your stoma nurse or surgical team when a support garment is appropriate for you after surgery, and how it should fit. They can advise you based on your recovery."
    - q: "What is the return policy?"
      a: "You have 30 days from delivery to request a return or exchange in our returns portal. Your first size exchange ships free. If anything isn't right, write to us and we'll help."
    - q: "Is shipping free?"
      a: "Free standard shipping on orders over $50 (except Japan). Ships within 24 hours from our US fulfillment center — usually arrives in 3–5 business days. Canada delivery 3–5 business days."

kit:
  eyebrow: "Complete the kit"
  headline: "Often worn together"
  body: "Accessories to wear with the SIIL Belt"
  items:
    - { name: "Ostomy Bag Covers", url: "https://www.siilostomy.com/en/ostomy-bag-covers/" }
    - { name: "Ostomy Wraps", url: "https://www.siilostomy.com/en/ostomy-wraps-siil-ostomy-line/" }
    - { name: "Anti-Leak Panties", url: "https://www.siilostomy.com/en/ostomy-panty-anti-leak-post-op-menstrual-panty/" }
  cta: "View product"

footer:
  strip: "30-day returns · First size exchange free"
  columns:
    Shop:
      - ["Ostomy belts", "https://www.siilostomy.com/en/ostomy-belt/"]
      - ["Ostomy bag covers", "https://www.siilostomy.com/en/ostomy-bag-covers/"]
      - ["Swimwear", "https://www.siilostomy.com/en/ostomy-swimwear-siil-ostomy/"]
      - ["Stoma protectors", "https://www.siilostomy.com/en/stoma-guard-protector/"]
      - ["Ostomy supplies", "https://www.siilostomy.com/en/ostomy-supplies/"]
    "Customer care":
      - ["Find your size", "https://www.siilostomy.com/en/size-guide-en/"]
      - ["Shipping & returns", "https://www.siilostomy.com/en/shipping/"]
      - ["Contact us", "https://www.siilostomy.com/en/contact/"]
    "Guides & resources":
      - ["New patient guide", "https://www.siilostomy.com/en/new-ostomy-patient-guide/"]
      - ["Stoma care guide", "https://www.siilostomy.com/en/ostomy-troubleshooting-guide/"]
      - ["Nutrition guide", "https://www.siilostomy.com/en/ostomy-diet/"]
      - ["Ostomy associations", "https://www.siilostomy.com/en/ostomy-associations-support/"]
    "About SIIL":
      - ["About SIIL", "https://www.siilostomy.com/en/about-us/"]
      - ["For stoma nurses", "https://www.siilostomy.com/en/ostomy-nurses/"]
      - ["Instagram", "https://www.instagram.com/siilostomy/"]
      - ["Facebook", "https://www.facebook.com/siilostomy"]
  contact: { label: "WE’RE HERE FOR YOU", email: "hola@siilostomy.com" }
  legal:
    - ["Privacy", "https://www.siilostomy.com/en/privacy-policy/"]
    - ["Cookies", "https://www.siilostomy.com/en/cookies-policy/"]
    - ["Terms & conditions", "https://www.siilostomy.com/en/terms-and-conditions/"]
  copyright: "© 2026 SIIL Ostomy"
  logo: "https://www.siilostomy.com/wp-content/uploads/2026/01/logo_siil_Black-300x116-1.png"
```

The product, for anyone drawing or checking it: a wide, smooth, matte stretch-fabric band worn around the waist at stoma level. The front carries a deeper rounded panel, the pouch pocket, whose lower edge curves down below the waistband. A narrow binding runs along the top edge, a small woven SIIL label sits on the upper front, and the pocket has a zip access opening. No buckles or straps are visible from the front. Colours: beige (warm sand), navy blue, black.

## 5. Held back until the owner confirms

These are on the live site today. They conflict with each other or have no visible source, so none of them appears on this page. List each one in `OPEN-QUESTIONS.md` with the options found.

| Topic | What the live site says | 
|---|---|
| Rating and review count | "4.8 · 8,248 verified reviews" on the belt page; "over 12,000 verified five-star reviews" lower on the same page; "4.9/5" and "8,247" on the home page. No review data is in the page markup. |
| Number of wearers | "More than 12,000", "50,000+" (belt page); "40,000+", "50,000+", "60,000+" (home page). |
| Quoted reviews | The same reviewer names appear with different cities and products on different pages (for example "Sandra L." in NYC with a belt and in Berlin with a wrap, with nearly the same words). Use only reviews exported from the real review system. |
| Leak statistic | "85% of wearers report fewer leaks", "85% fewer accidental leaks" (a different claim), "73% of users report fewer leaks". |
| Hernia statistic | "Up to 40% fewer parastomal hernias in studies" and "Up to 75% reduction". |
| Between two sizes | "choose the smaller" (sizing text), "Go up" (buy box), "choose the larger" (size guide tip). |
| Waist range | "55–140 cm" (size chart, used here) and "60–150 cm" (women's section). |
| Returns | "30 days from delivery" (belt page, used here) and "60-day guarantee" (home page). |
| Superlatives | "#1 ostomy belt of 2026", "best ostomy belt of 2026", "most recommended by stoma care nurses", "96% would recommend". |
| Named competitors | A price and feature table against Stealth, Coloplast Brava and Hollister. |
| Endorsements | "Recommended by stoma care nurses at NHS trusts", "supported by" a list of ostomy associations, and a "Recommended by · Featured in" strip of association and press logos. Use only with written permission or a link to the coverage. |
| People in the photos | Lifestyle images and reviewer avatars are stored in folders named "canva", and some alt text calls the people "real ostomate" or "verified SIIL customer". Confirm which are real, consenting customers. |
| Other product claims found only in long-form text | "antibacterial silver-thread lining", "anti-odor technology", "less than 2 mm thick", "dries within 20 minutes", "VELCRO® opens up to 4 cm". |

## 6. Visual system

Tokens come from the live site's own stylesheet. Belt colours are sampled from the product photos, not guessed.

```css
:root {
  --ink:    #0f0f0f;   /* stage background */
  --ink-2:  #181715;   /* raised surfaces on the stage */
  --ivory:  #faf8f4;   /* text on the stage, background of the light sections */
  --paper:  #f3efe7;   /* cards on light sections */
  --bronze: #9a7e4f;   /* default accent */
  --muted:  #6b6b6b;
  --accent: var(--bronze);            /* tweened per chapter */
  --belt-beige: /* eyedrop from the beige belt photo */;
  --belt-navy:  /* eyedrop from the navy belt photo */;
  --belt-black: /* eyedrop from the black belt photo */;
  --font-display: 'Albert Sans', system-ui, sans-serif;      /* 800–900 for the giant word, counters, headlines */
  --font-serif:   'Cormorant Garamond', Georgia, serif;      /* eyebrows and the closing headline, italic */
  --font-body:    'Albert Sans', system-ui, sans-serif;
}
```

- Self-host both fonts with `@fontsource`; no requests to font CDNs.
- Giant word: `clamp(9rem, 30vw, 34rem)`, weight 900, letter-spacing −0.04em, horizontal gradient from `--ink-2` to `--accent`.
- Counters: `clamp(5rem, 13vw, 13rem)`, weight 800, `font-variant-numeric: tabular-nums`; unit in small caps beside the last digit.
- Headlines: `clamp(2rem, 4.2vw, 4.5rem)`, weight 800, line-height 0.98, letter-spacing −0.02em, at most 14 characters wide per line where the copy allows.
- Floor light: a blurred ellipse under the model, `radial-gradient` in `--accent`, 35–55% opacity.
- Skin has to stay rich on the dark stage. If a model's skin or the black belt sinks into the background, raise the floor light and add a soft rim behind the figure. Never lighten the skin itself.
- Light sections use `--ivory` with `--ink` text, hairline dividers and generous whitespace. The change from dark to light is one clean wipe tied to scroll.
- Motion: `power3.out` for entrances, `none` for anything scrubbed, 0.6–0.9 s for the few time-based moves. Nothing bounces.

## 7. Stack

- Vite, vanilla JavaScript modules, no UI framework. Output is a static `dist/` that works from any subfolder (`base: './'`).
- `gsap` 3.13 or later with `ScrollTrigger` and `SplitText` (all GSAP plugins are free in that version).
- Native scrolling. Smoothness comes from `scrub: 0.8`, not from replacing the scroll. Do not add a smooth-scroll library unless a test proves it keeps keyboard, touch and reduced-motion behaviour intact.
- One `ScrollTrigger` per chapter, each owning one timeline. No ScrollTriggers on tweens nested inside a timeline. Register plugins once. Kill every trigger on teardown and call `ScrollTrigger.refresh()` after fonts and first frames load.
- Content lives in `src/content/belt.en.js`, transcribed from section 4. No copy in templates.

## 8. Images: SIIL's own models

The page is built for the image set produced by `prompts/02-own-model-sheets.md`. It must work before those exist.

```
public/media/belt/
  manifest.json
  seq/<chapter>/<color>/0001.webp …     # frames with transparency, 1080 px tall; optional
  seq/<chapter>/<color>/m/0001.webp …   # 720 px tall set for small screens; optional
  still/<chapter>/<color>.webp          # one frame with transparency; required per chapter
  detail/access.webp                    # close view of the access opening
```

`manifest.json` lists, per chapter and colour: frame count, pixel size, whether frames have transparency, the focal point for the chapter-4 push-in, and hotspot positions as fractions of the frame with the frame range where each is visible.

- **Sequence mode**: preload the first frame at once and the rest in the background, nearest chapter first. Draw to one canvas, sized for device pixel ratio up to 2. Tween a frame index with `snap` and redraw only when the index changes.
- **Still mode** (no sequence for a chapter): show the still and animate it with scale, small translation and cross-fades between chapters. The page must look deliberate in this mode, not broken.
- **Placeholder mode** (no own-model files yet): download these real SIIL product photos into `public/media/belt/placeholder/` and show them as framed plates that overlap the giant word. Mark each with `data-placeholder` and list them in `README.md` under "Images to replace".
  - `https://www.siilostomy.com/wp-content/uploads/2025/09/Ostomy-BELT-WOMEN-BEIGE-SIIL-Ostomy-3-scaled.jpg` (beige, front)
  - `https://www.siilostomy.com/wp-content/uploads/2025/09/Ostomy-BELT-WOMEN-BEIGE-SIIL-Ostomy-6-1-scaled.jpg` (beige, access opening)
  - `https://www.siilostomy.com/wp-content/uploads/2023/01/Siilostomy76890-683x1024.jpg` (navy)
  - `https://www.siilostomy.com/wp-content/uploads/2026/10/ostomy-belt-for-men-and-women-square.jpg` (black and navy)
  - If a download fails, draw a neutral card with the file name. Never substitute stock or generated people.
- A hotspot is only placed on a part of the belt that is actually visible in that frame. If it is not visible, show that item as a chip in the text column instead.

## 9. Quality bar

- **Responsive**: designed at 390, 768, 1280 and 1920 px wide. On small screens the model sits in the upper half and text in the lower half; counters and the giant word scale down but stay bold. No horizontal scroll at any width.
- **Performance**: first view usable in under 2.5 s on a mid-range phone profile; no layout shift from late fonts or images; animate only `transform`, `opacity` and the canvas; the pinned story holds 60 fps on desktop with no long tasks while scrolling.
- **Reduced motion**: with `prefers-reduced-motion: reduce`, nothing is pinned or scrubbed. Each chapter becomes a normal section with its still image, final counter values and visible text.
- **Accessibility**: one `h1`; real headings per chapter; all text is real text, never baked into images; visible focus styles; the colour choice is a radio group and the FAQ is built from buttons with `aria-expanded`; contrast at least 4.5:1 for body text on both themes; a skip link; the canvas is `aria-hidden` and every chapter carries an `img`-role description of what the model is doing.
- **No JavaScript**: the full text and the still images are readable.
- **Scroll both ways**: every chapter looks correct when scrolled backwards, after a mid-page reload, after a window resize and after jumping with a nav link.

## 10. How to work

1. Restate the storyboard in ten lines and list anything in sections 3–4 you cannot build as written. Then proceed without waiting.
2. Build the static page first: all content, both themes, fully responsive, no animation. Screenshot it at 390 and 1440 px wide and fix what looks wrong.
3. Add the stage and one chapter end to end (chapter 2 has every mechanic). Get it right, then repeat the pattern for the others.
4. Add the intro, the colour choice and the dark-to-light wipe.
5. Test with Playwright against the built `dist/`: capture each chapter at its start, middle and end, at 1440×900 and 390×844; repeat with reduced motion; scroll to the end and back and compare the first frame; fail on any console error. Look at every screenshot yourself and fix overlaps, clipped text, empty frames and anything that reads as a template.
6. Check section 1 again against the finished page, line by line.

## 11. Deliver

- The site source and a `README.md` covering: how to run and build, how to replace images (the folder contract in section 8), and how the page would move into the WordPress child theme later.
- `OPEN-QUESTIONS.md` with every item from section 5 and anything else you could not source.
- `docs/screens/` with the final screenshots from step 5.
- A short report: what was built, what was checked and how, what is still placeholder.
