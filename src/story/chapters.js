/**
 * The storyboard as data: what happens in each chapter and when.
 *
 * Every time is a fraction of the chapter's own scroll range: 0 when the chapter's section
 * reaches the top of the viewport, 1 when the next chapter takes over. Two schedules per
 * chapter, because small screens show the text panels of a chapter one after another:
 *   desktop   900 px and wider: text beside the model
 *   compact   below 900 px: model in the upper half, text panels take turns in the lower half
 *
 * move      the stage change that opens the chapter: the model travels to its place, images
 *           cross-fade, the accent colour and the giant word change
 * pose      where the model settles: x −1 = left third, 0 = centre, +1 = right third;
 *           y as a fraction of the viewport height; s = scale. On compact screens y and s
 *           are worked out from the room left above the text, only x is taken from here.
 * drift     added slowly while the chapter is held, so a still never sits dead
 * panels    when each text panel enters and leaves; null = already there / stays
 * counters  when each number counts; a second counter replaces the first in the same place
 * settle    where a nav link or keyboard focus lands so the chapter is fully readable
 */

export const SCRUB = 0.8;
export const COMPACT_QUERY = '(max-width: 899px)';

export const CHAPTERS = [
  {
    id: 'hero',
    accent: 'beige',
    word: 1,
    desktop: {
      pose: { x: 0, y: 0.03, s: 0.94 },
      drift: { y: -0.012, s: 0.03 },
      panels: { a: { in: null, out: [0.42, 0.74] }, b: { in: null, out: [0.5, 0.82] } },
      frames: [0, 1],
      settle: 0,
    },
    compact: {
      pose: { x: 0 },
      drift: { s: 0.03 },
      panels: { a: { in: null, out: [0.16, 0.32] }, b: { in: [0.34, 0.5], out: [0.8, 0.95] } },
      frames: [0, 1],
      settle: 0,
    },
  },
  {
    id: 'fit',
    accent: 'ivory',
    word: 0,
    desktop: {
      pose: { x: 1, y: 0, s: 1 },
      drift: { y: -0.01, s: 0.04 },
      move: [0, 0.12],
      panels: { a: { in: [0.07, 0.2], out: [0.88, 0.97] }, b: { in: [0.2, 0.32], out: [0.89, 0.98] } },
      counters: [{ count: [0.09, 0.24], out: [0.3, 0.35] }, { in: [0.33, 0.38], count: [0.36, 0.58] }],
      hotspots: { in: [0.36, 0.5], out: [0.86, 0.92] },
      frames: [0.12, 0.86],
      settle: 0.68,
    },
    compact: {
      pose: { x: -1 },
      drift: { s: 0.03 },
      move: [0, 0.1],
      panels: { a: { in: [0.06, 0.16], out: [0.5, 0.56] }, b: { in: [0.57, 0.67], out: [0.9, 0.98] } },
      counters: [{ count: [0.08, 0.2], out: [0.25, 0.29] }, { in: [0.28, 0.32], count: [0.3, 0.46] }],
      hotspots: { in: [0.16, 0.28], out: [0.86, 0.92] },
      frames: [0.1, 0.86],
      settle: 0.42,
    },
  },
  {
    id: 'clothes',
    accent: 'bronze',
    word: 0,
    desktop: {
      pose: { x: -1, y: 0, s: 1 },
      drift: { y: -0.01, s: 0.04 },
      move: [0, 0.14],
      panels: { a: { in: [0.12, 0.24], out: [0.87, 0.96] }, b: { in: [0.2, 0.32], out: [0.88, 0.97] } },
      frames: [0.14, 0.84],
      settle: 0.6,
    },
    compact: {
      pose: { x: 0 },
      drift: { s: 0.03 },
      move: [0, 0.1],
      panels: { a: { in: [0.08, 0.18], out: [0.46, 0.52] }, b: { in: [0.53, 0.63], out: [0.9, 0.98] } },
      frames: [0.1, 0.86],
      settle: 0.32,
    },
  },
  {
    id: 'access',
    accent: 'bronze',
    word: 0,
    desktop: {
      pose: { x: 0, y: 0, s: 1 },
      move: [0, 0.09],
      push: [0.09, 0.38], // camera pushes in on the access opening
      dissolve: [0.28, 0.4], // the model dissolves …
      detailIn: [0.27, 0.38], // … into the close view, full frame at first,
      detailSettle: [0.36, 0.52], // which then floats free beside the text
      detailOut: [0.9, 0.985],
      panels: {
        a: { in: [0.48, 0.58], out: [0.88, 0.96] },
        b: { in: [0.54, 0.64], out: [0.89, 0.97] },
        c: { in: [0.6, 0.7], out: [0.9, 0.98] },
      },
      settle: 0.8,
    },
    compact: {
      pose: { x: 0 },
      move: [0, 0.06],
      push: [0.06, 0.25],
      dissolve: [0.19, 0.27],
      detailIn: [0.18, 0.26],
      detailSettle: [0.25, 0.37],
      detailOut: [0.93, 0.99],
      panels: {
        a: { in: [0.36, 0.44], out: [0.52, 0.57] },
        b: { in: [0.58, 0.65], out: [0.73, 0.78] },
        c: { in: [0.79, 0.86], out: [0.93, 0.98] },
      },
      settle: 0.48,
    },
  },
  {
    id: 'pool',
    accent: 'blue',
    word: 0,
    desktop: {
      pose: { x: -1, y: 0, s: 1 },
      drift: { y: -0.01, s: 0.04 },
      move: [0, 0.14],
      panels: { a: { in: [0.12, 0.24], out: [0.87, 0.96] }, b: { in: [0.2, 0.32], out: [0.88, 0.97] } },
      frames: [0.14, 0.84],
      settle: 0.6,
    },
    compact: {
      pose: { x: 0 },
      drift: { s: 0.03 },
      move: [0, 0.1],
      panels: { a: { in: [0.08, 0.18], out: [0.46, 0.52] }, b: { in: [0.53, 0.63], out: [0.9, 0.98] } },
      frames: [0.1, 0.86],
      settle: 0.32,
    },
  },
  {
    id: 'colors',
    accent: 'choice',
    word: 0,
    desktop: {
      pose: { x: 1, y: 0, s: 1 },
      drift: { s: 0.03 },
      move: [0, 0.14],
      panels: { a: { in: [0.12, 0.28], out: [0.88, 0.97] } },
      settle: 0.55,
    },
    compact: {
      pose: { x: 0 },
      drift: { s: 0.03 },
      move: [0, 0.1],
      panels: { a: { in: [0.1, 0.22], out: [0.9, 0.98] } },
      settle: 0.5,
    },
  },
  {
    id: 'close',
    accent: 'choice',
    word: 1,
    desktop: {
      pose: { x: 0, y: 0.03, s: 0.94 },
      drift: { s: 0.02 },
      move: [0, 0.18],
      panels: { a: { in: [0.16, 0.36], out: null }, b: { in: [0.3, 0.5], out: null } },
      counters: [{ count: [0.34, 0.62] }],
      settle: 0.8,
    },
    compact: {
      pose: { x: 0 },
      drift: { s: 0.02 },
      move: [0, 0.12],
      panels: { a: { in: [0.1, 0.22], out: [0.42, 0.48] }, b: { in: [0.5, 0.62], out: null } },
      counters: [{ count: [0.54, 0.76] }],
      settle: 0.3,
    },
  },
];
