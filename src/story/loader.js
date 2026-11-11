/**
 * Image loading for the stage.
 *
 * - A small priority queue: the first frame of every sequence and the hero image go first,
 *   everything else follows in the background, nearest chapter first.
 * - Sequence: the frames of one scroll-scrubbed image sequence.
 */

export function createQueue({ concurrency = 4 } = {}) {
  const pending = [];
  let running = 0;
  let stopped = false;
  let background = false; // background jobs wait until the first view is on screen
  let focus = 0; // index of the chapter the reader is in

  const pump = () => {
    while (!stopped && running < concurrency && pending.length) {
      // Lowest score first: urgent jobs, then distance from the current chapter, then order.
      let best = -1;
      let bestScore = Infinity;
      for (let i = 0; i < pending.length; i += 1) {
        const job = pending[i];
        if (!job.urgent && !background) continue;
        const score = job.urgent ? -1 : Math.abs(job.chapter - focus) * 1000 + job.order;
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }
      if (best < 0) return;
      const [job] = pending.splice(best, 1);
      running += 1;
      Promise.resolve()
        .then(job.run)
        .catch(() => {})
        .then(() => {
          running -= 1;
          pump();
        });
    }
  };

  return {
    /** chapter: index of the chapter the file belongs to; order: position within it. */
    add(run, { chapter = 0, order = 0, urgent = false } = {}) {
      pending.push({ run, chapter, order, urgent });
      pump();
    },
    setFocus(index) {
      focus = index;
    },
    /** Lets the background jobs run (call once the first view has what it needs). */
    startBackground() {
      background = true;
      pump();
    },
    stop() {
      stopped = true;
      pending.length = 0;
    },
  };
}

/** Loads and decodes one image; resolves with the element, or null when it cannot be loaded. */
export function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const done = () => resolve(img);
      if (img.decode) img.decode().then(done, done);
      else done();
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

const frameName = (index) => `${String(index + 1).padStart(4, '0')}.webp`;

export class Sequence {
  /**
   * @param {object} opts
   * @param {string} opts.base     URL of the folder that holds 0001.webp …
   * @param {number} opts.frames   frame count
   * @param {number} opts.width    pixel size of one frame
   * @param {number} opts.height
   */
  constructor({ key, base, frames, width, height }) {
    this.key = key;
    this.base = base;
    this.count = frames;
    this.width = width;
    this.height = height;
    this.images = new Array(frames).fill(null);
    this.promises = new Array(frames).fill(null);
    this.onFrame = null;
  }

  url(index) {
    return `${this.base}/${frameName(index)}`;
  }

  /** Loads one frame (once). */
  load(index) {
    if (!this.promises[index]) {
      this.promises[index] = loadImage(this.url(index)).then((img) => {
        this.images[index] = img;
        if (img && this.onFrame) this.onFrame(index);
        return img;
      });
    }
    return this.promises[index];
  }

  /** Queues every frame: the first one at once, the rest in the background. */
  preload(queue, chapter) {
    queue.add(() => this.load(0), { chapter, urgent: true });
    for (let i = 1; i < this.count; i += 1) {
      queue.add(() => this.load(i), { chapter, order: i });
    }
  }

  /** The loaded frame closest to the wanted index, or null while nothing has arrived. */
  nearest(index) {
    const want = Math.min(this.count - 1, Math.max(0, Math.round(index)));
    if (this.images[want]) return { img: this.images[want], index: want };
    for (let d = 1; d < this.count; d += 1) {
      const before = want - d;
      const after = want + d;
      if (before >= 0 && this.images[before]) return { img: this.images[before], index: before };
      if (after < this.count && this.images[after]) return { img: this.images[after], index: after };
    }
    return null;
  }
}
