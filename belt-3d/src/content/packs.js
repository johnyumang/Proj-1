/**
 * Pack options of the shop block. PROVISIONAL: the multi-pack, triple-pack and add-on prices
 * were set by the owner as placeholders (2026-11-13) until the real ones are known; only the
 * single-belt price is verified (content.meta.price). Change them here, nowhere else.
 * Labels are owner-dictated (see OPEN-QUESTIONS.md part C).
 */
export const packs = {
  options: [
    { id: 'single', label: 'Single', belts: '1 belt', cents: 7699 },
    { id: 'multi', label: 'Multi-pack', belts: '2 belts', cents: 14599 },
    { id: 'triple', label: 'Triple pack', belts: '3 belts', cents: 20999 },
  ],
  addon: { id: 'washbag', label: 'Upgraded: with mesh wash bag', item: 'Mesh wash bag', cents: 600 },
  included: 'Care guide included',
};

/** "$152.99" */
export const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

export default packs;
