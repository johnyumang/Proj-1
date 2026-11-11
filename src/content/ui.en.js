/**
 * Interface strings (English).
 *
 * Section 1 of the build prompt allows exactly two kinds of text that do not come from the
 * verified content: interface labels ("Menu", "Close", "Skip to content") and ARIA labels.
 * All of them live here so they are easy to audit. Nothing in this file is marketing copy and
 * none of it is shown as customer-facing prose.
 */
export const ui = {
  // Visible interface labels
  skip: 'Skip to content',
  menu: 'Menu',
  close: 'Close',

  // ARIA labels (never rendered as visible text)
  navLabel: 'Page sections',
  footerNavLabel: 'Footer',
  newTab: '(opens in a new tab)',
  unitLabel: 'Waist unit',
  reviewsLabel: 'Reviews',
  logoAlt: 'SIIL Ostomy',
  missingImage: 'Image not available:',
  // Used only when own-model media has no description in manifest.json (the build warns).
  fallbackAlt: 'Model wearing the SIIL Ostomy Belt',
};

export default ui;
