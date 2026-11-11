# Open questions

Nothing in part A is on the page. Each item is on the live site today but conflicts with
another statement there or has no visible source. Part B lists what the page needed and could
not take from the verified content, and what was decided in the meantime.

Facts were captured from `https://www.siilostomy.com/en/ostomy-belt/` and the home page on
2026-11-11 (see section 5 of `prompts/01-ostomy-belt-scroll-page.md`).

## A. Held back until the owner confirms

| # | Topic | What the live site says (options found) | What we need |
|---|---|---|---|
| 1 | Rating and review count | "4.8 · 8,248 verified reviews" (belt page); "over 12,000 verified five-star reviews" (lower on the same page); "4.9/5" and "8,247" (home page). No review data is in the page markup. | One rating and one count, with the review system they come from and the date. |
| 2 | Number of wearers | "More than 12,000" and "50,000+" (belt page); "40,000+", "50,000+", "60,000+" (home page). | One figure and its source (orders, customers, units?). |
| 3 | Quoted reviews | The same reviewer names appear with different cities and products on different pages (for example "Sandra L." in NYC with a belt and in Berlin with a wrap, with nearly the same words). | Reviews exported from the real review system only. They go into `src/content/reviews.json`; the band stays hidden until then. |
| 4 | Leak statistic | "85% of wearers report fewer leaks"; "85% fewer accidental leaks" (a different claim); "73% of users report fewer leaks". | Which claim, measured how, on how many people. Until then no leak figure. This also keeps the "Leaks" row out of the specifications table. |
| 5 | Hernia statistic | "Up to 40% fewer parastomal hernias in studies"; "Up to 75% reduction". | The study, or drop the claim. This also keeps the "Hernia" row out of the specifications table. |
| 6 | Between two sizes | "choose the smaller" (sizing text); "Go up" (buy box); "choose the larger" (size guide tip). | One rule. The size guide on this page gives none. |
| 7 | Waist range | "55–140 cm" (size chart, used on this page); "60–150 cm" (women's section). | Confirm 55–140 cm. |
| 8 | Returns | "30 days from delivery" (belt page, used on this page); "60-day guarantee" (home page). | Confirm 30 days from delivery and the free first size exchange. |
| 9 | Superlatives | "#1 ostomy belt of 2026"; "best ostomy belt of 2026"; "most recommended by stoma care nurses"; "96% would recommend". | A source for each, or leave them out for good. This also keeps the "Confidence" row out of the specifications table. |
| 10 | Named competitors | A price and feature table against Stealth, Coloplast Brava and Hollister. | Legal sign-off and dated sources, or keep the generic comparison (cheap belt, surgical binder) that the page uses. |
| 11 | Endorsements | "Recommended by stoma care nurses at NHS trusts"; "supported by" a list of ostomy associations; a "Recommended by · Featured in" strip of association and press logos. | Written permission or a link to the coverage for each. This also keeps the sixth comparison row, "Recommended by nurses", off the page. |
| 12 | People in the photos | Lifestyle images and reviewer avatars are stored in folders named "canva", and some alt text calls the people "real ostomate" or "verified SIIL customer". | Which people are real, consenting customers. On this page nobody is described as a customer, patient, reviewer, nurse or ostomate. |
| 13 | Other product claims found only in long-form text | "antibacterial silver-thread lining"; "anti-odor technology"; "less than 2 mm thick"; "dries within 20 minutes"; "VELCRO® opens up to 4 cm". | Test reports or supplier specifications. |

## B. Could not be sourced, or decided provisionally

| # | Point | What the page does now | Decision needed |
|---|---|---|---|
| 1 | The four placeholder photos show people from the live site's product photography (see A12). | They are used only as placeholders, described by what is visible, on a `noindex` preview. They are shown cut out of their backgrounds (see 19). | Confirm they may be shown at all until SIIL's own models replace them. |
| 2 | "Fastening" hotspot. The VELCRO® closure is not visible in the front-view placeholder photo used in chapter 2. | "Pouch pocket" and "Fabric" are hotspots on the photo; "Fastening" is a chip in the text column, as the rule for invisible parts says. | Where "Fastening" should point on the own-model plates: the closure (needs a view that shows it) or the zip. |
| 3 | FAQ answer 2 names nine pouch manufacturers (Coloplast, Hollister, ConvaTec, B.Braun, Welland, Salts, NuHope, Pelican, Marlen). Rule 4 says no competitor names, and two of them are in the competitor table of A10. | Kept verbatim, because it is in the verified content and states compatibility, not a comparison. | Confirm the brand names may be used and that "fits all standard pouches" has a basis. |
| 4 | The size guide's "Best for" column says "post-op recovery" for XS, while the FAQ sends post-surgery questions to the stoma care team. | Kept verbatim. | Confirm the wording or drop it from the column. |
| 5 | Accent colours for the navy and black belts. The sampled belt colours (`#30375b`, `#2f2925`) are too dark to light a `#0f0f0f` stage or carry a button. | Stage accents are derived: blue `#8b9ae4` (same hue as the sampled navy) and a warm neutral `#d8d2c7` for black. The swatches show the sampled colours. | Approve or supply brand values. |
| 6 | Counter "55 → 140 cm waist". Its final value alone reads "140 cm waist". | The number counts from 55 to 140; the plain page shows 140, with the chip "55–140 cm waist" next to it. | Whether the resting state should read "55–140". |
| 7 | Nav link "Why SIIL Belt" has no target in the content. | It jumps to the closing chapter, whose eyebrow is "Why SIIL Belt". | Confirm, or point it at "The difference". |
| 8 | "Pick your size" (chapter 2). | In-page link to the size guide, since sizes cannot be picked on this page. Every other call to action opens the live product page. | Confirm. |
| 9 | Colour choice and the live page. No verified URL parameter preselects a colour there. | Buying actions open the product page without a colour. | The variation URL scheme, if one exists. |
| 10 | "The label on the buy button" (chapter 6). The only text with a colour slot is `sticky.label`. | Chapter 6 shows that label with the chosen colour beside a buy button on desktop; on phones the sticky bar does the same. | Confirm. |
| 11 | Complete the kit: no images, prices or descriptions in the content. | Three text cards with "View product". | Supply images and prices if wanted. |
| 12 | Close view of the access opening (`detail/access.webp`). Product close-ups must be real photographs. | A crop of the placeholder photo stands in. | Photograph the access opening. |
| 13 | Footer logo. The only source is a 300 × 116 px PNG on the live site. | Downloaded to `public/media/brand/` and shown small. | A vector or larger logo. |
| 14 | No meta description or Open Graph text in the content; `currency_note` ("USD, English (US) page") is not shown. | Neither is on the page. | Approved copy before launch. |
| 15 | The "📏" in two labels ("Size guide", "Open the interactive size finder →") is an emoji, which every device draws differently. | Shown as a drawn ruler icon in the page's own line style. The words are unchanged. | Confirm. |
| 16 | FAQ "How do I choose my size?" says "Open the size guide beside the size selector". This page has a size guide but no size selector. | Kept verbatim. | Reword for this page once sizes can be picked on it, or confirm it may stay. |
| 17 | The fabric is called "antibacterial" in the verified content (hotspot and specifications), while "antibacterial silver-thread lining" is among the claims held back in A13. | "antibacterial" is shown where the verified content has it; the silver-thread wording is not. | Confirm the plain claim has a basis (test report or supplier specification). |
| 18 | "Three stills in the same pose" for the colour choice cannot be shown with the placeholder photos: the black belt only exists in a photo of two people that also shows a navy belt. | Choosing Black shows that photo. | Resolved by the own-model stills (`still/colors/*.webp`, `still/close/*.webp`). |
| 19 | Shadow lighting. The placeholder photos are evenly lit studio shots; the page is a dark stage. | Each photo is cut out and lit after the fact: light from high camera-left, the far side in shadow, a thin warm rim, the cropped lower edge faded. Only brightness and transparency change; the belt keeps its colour on the lit side. `scripts/cutout-placeholders.py` holds the settings. | Approve the look and its strength. The own-model stage plates get real shadow lighting from the block in `prompts/02-own-model-sheets.md` and need no such grading. |
| 20 | "Elena's fashion guide" was asked for as the styling reference. It could not be found by that name on the site, in Canva or in mail. | Wardrobe and styling in `prompts/02-own-model-sheets.md` are provisional (plain basics that keep the belt visible). | The guide itself (link or file), so wardrobe, poses and colours can follow it. |
