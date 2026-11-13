/**
 * The WebGL stage of the 3D scroll story: the belt, the ribbon around it and the floating pieces.
 *
 * CONTRACT (the page depends on exactly this; do not change it without changing the page):
 *
 *   const stage = await createStage(canvas, options?)
 *   stage.apply(state)     draw the frame described by `state`. Pure: the picture depends on
 *                          `state` (and `time`, see below) only, never on earlier calls.
 *                          Cheap to call every animation frame; skips the draw if nothing changed.
 *   stage.resize()         read the canvas' CSS size again (call after layout changes).
 *   stage.dispose()        free every GPU resource and listener.
 *   stage.project(name)    -> { x, y, visible } in CSS pixels relative to the canvas, for one of
 *                          the named anchors ('pocket' | 'zip' | 'fastening' | 'label'), as of the
 *                          last apply(). `visible` is false when the anchor faces away.
 *
 * The canvas is transparent: the page puts its own background and the giant word behind it.
 *
 * @typedef {object} StageState   every field optional, defaults in DEFAULT_STATE
 * @property {number} view      0 = camera straight above the belt, looking down through the ring
 *                              1 = camera in front of the belt at waist height (the hero view)
 *                              values between blend the two along an arc.
 * @property {number} zoom      1 = belt at its normal size (about 46% of the canvas height in view 1,
 *                              ring about 40% of the smaller canvas side in view 0);
 *                              larger pushes the camera in. At view 0 and zoom >= 6 the hole of the
 *                              ring covers the whole canvas (nothing of the belt is left in frame).
 * @property {number} spin      rotation of the belt about its vertical axis, radians. 0 = front panel
 *                              to the camera, positive turns the wearer's left side toward the camera.
 * @property {number} tilt      extra forward/back tilt in radians (small, for life).
 * @property {number} x         horizontal offset of the belt centre, in canvas widths (-0.5 … 0.5), 0 = centre
 * @property {number} y         vertical offset, in canvas heights, positive = down
 * @property {number} color     0 = beige, 1 = navy, 2 = black; fractions blend the fabric colour
 * @property {number} open      0 = access zip closed, 1 = zip open and the lower front panel lifted
 * @property {number} form      0 = belt alone (a free-standing ring), 1 = worn on the neutral torso form
 * @property {number} present   0 = belt absent (dropped out of frame below), 1 = in place. Between,
 *                              it travels up into place with a little overshoot handled by the page's
 *                              easing, not here (map linearly).
 * @property {number} ribbonA   start of the drawn part of the ribbon, 0 … 1 of its length
 * @property {number} ribbonB   end of the drawn part of the ribbon, 0 … 1 (ribbonB <= ribbonA draws nothing)
 * @property {number} drift     0 … 1 strength of the floating pieces (0 hides them)
 * @property {number} accent    colour of ribbon as 0xRRGGBB
 * @property {number} time      seconds; drives idle float only. Same state + same time = same picture.
 */

export const DEFAULT_STATE = Object.freeze({
  view: 1,
  zoom: 1,
  spin: 0,
  tilt: 0,
  x: 0,
  y: 0,
  color: 0,
  open: 0,
  form: 0,
  present: 1,
  ribbonA: 0,
  ribbonB: 0,
  drift: 0,
  accent: 0xfaf8f4,
  time: 0,
});

/** True when this browser can give us a WebGL context. */
export function canRender() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ pixelRatio?: number }} [options]
 */
export async function createStage(canvas, options = {}) {
  // Stub until the scene is built: same surface, draws nothing.
  void options;
  return {
    apply() {},
    resize() {},
    dispose() {},
    project() {
      return { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2, visible: false };
    },
  };
}
