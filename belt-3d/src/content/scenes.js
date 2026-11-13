/**
 * Owner-dictated strings for the 3D scroll story (belt-3d/).
 *
 * These words were dictated by the owner for this page (chat brief, 2026-11-13). They are NOT
 * from the verified product content in src/content/belt.en.js and make no product claim:
 *  - the four giant scene words behind the belt,
 *  - the library heading (the live site's own blog category name) and its address,
 *  - the shop block titles: the three listing card titles, the pack option names and the
 *    "Mesh wash bag" label.
 * Keep them here (one place to audit), never in templates. See OPEN-QUESTIONS.md part C.
 */
export const scenes = {
  /** Giant words, one per scene chapter, in story order. Uppercased by CSS. */
  words: ['Pool', 'Beach', 'Casual', 'Office'],
};

export const library = {
  heading: 'Ostomy life & care library',
  url: 'https://www.siilostomy.com/en/living-with-an-ostomy/',
};

export const shop = {
  /** Section title of the listings block ("always unisex"). */
  title: 'Always unisex',
  cards: {
    women: 'For women',
    men: 'For men',
    unisex: 'Unisex',
  },
  packs: {
    single: 'Single belt',
    multi: 'Multi-pack',
    triple: 'Triple pack',
    upgrade: 'Upgraded: with mesh wash bag',
  },
  washBag: 'Mesh wash bag',
};

export default scenes;
