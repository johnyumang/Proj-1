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
 *                              The VELCRO closure sits on the wearer's left at the back: it faces the
 *                              camera at spin ≈ 2.2 and is visible from about spin 1.3 to π.
 *                              A peeled tab (peel > 0) reads best from its free-end side,
 *                              spin ≈ 1.4 … 1.7 (it lifts toward the camera at 2.2).
 * @property {number} tilt      extra forward/back tilt in radians (small, for life).
 * @property {number} x         horizontal offset of the belt centre, in canvas widths (-0.5 … 0.5), 0 = centre
 * @property {number} y         vertical offset, in canvas heights, positive = down
 * @property {number} color     0 = beige, 1 = navy, 2 = black; fractions blend the fabric colour
 * @property {number} open      0 = access zip closed, 1 = zip open and the lower front panel lifted
 * @property {number} peel      0 = VELCRO closure shut as worn, 1 = the long hook tab peeled open from its
 *                              rounded free end (hinge at the stitched end, ~65° at the tip), showing the
 *                              ribbed hook face and the loop pad beneath.
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

import {
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createBelt, createForm, FORM_BOTTOM } from './belt.js';
import { createRibbon } from './ribbon.js';
import { createDrift } from './drift.js';
import { shadowTexture } from './textures.js';
import { TOP, bottomY, BULGE_C, clamp, lerp, smoothstep } from './shape.js';

export const DEFAULT_STATE = Object.freeze({
  view: 1,
  zoom: 1,
  spin: 0,
  tilt: 0,
  x: 0,
  y: 0,
  color: 0,
  open: 0,
  peel: 0,
  form: 0,
  present: 1,
  ribbonA: 0,
  ribbonB: 0,
  drift: 0,
  accent: 0xfaf8f4,
  time: 0,
});

const KEYS = Object.keys(DEFAULT_STATE);

/** True when this browser can give us a WebGL context. */
export function canRender() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// ---- framing constants (belt-local units) ----
const FOV = 30; // hero view
const FOV_TOP = 58; // view 0: wider so the inside walls of the ring read as a loop of fabric
const tanOf = (fov) => Math.tan(((fov / 2) * Math.PI) / 180);
const TAN = tanOf(FOV);
const BELT_LOW = bottomY(BULGE_C) - 0.04; // lowest point incl. binding
const HERO_H = TOP + 0.04 - BELT_LOW; // visual height of the belt in the hero view
const HERO_CY = (TOP + BELT_LOW) / 2;
const HERO_W = 2.3; // visual width incl. hip flare and binding
const RING_W = 2.2; // ring size seen from above
const HERO_ELEV = 0.2; // radians above waist height in view 1

function num(v, d) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : d;
}

function normalise(state) {
  const s = {};
  for (const k of KEYS) s[k] = num(state && state[k], DEFAULT_STATE[k]);
  s.accent = Math.round(s.accent) & 0xffffff;
  return s;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ pixelRatio?: number }} [options]
 */
export async function createStage(canvas, options = {}) {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  const maxRatio = Math.min(2, num(options.pixelRatio, 2));
  const pixelRatio = () => Math.max(0.5, Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, maxRatio));

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 100);

  // environment
  let pmrem = new PMREMGenerator(renderer);
  let envRT = null;
  let room = new RoomEnvironment();
  function buildEnv() {
    if (envRT) envRT.dispose();
    envRT = pmrem.fromScene(room, 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.24;
  }
  buildEnv();

  // lights: soft key, gentle fill, warm rim
  const key = new DirectionalLight(0xffffff, 2.9);
  key.position.set(-5, 3.6, 3.2);
  const fill = new DirectionalLight(0xeef2ff, 0.4);
  fill.position.set(4.5, 0.6, 3.5);
  const rim = new DirectionalLight(0xffcf9c, 3.4);
  rim.position.set(3.5, 2.5, -5);
  const rim2 = new DirectionalLight(0xffd8b0, 2.2);
  rim2.position.set(-4.5, 1.2, -3.5);
  scene.add(key, fill, rim, rim2);

  // scene graph
  const stage = new Group(); // tilt
  const beltRoot = new Group(); // present + idle float
  const spinGroup = new Group(); // spin
  stage.add(beltRoot);
  beltRoot.add(spinGroup);
  scene.add(stage);

  const belt = createBelt();
  spinGroup.add(belt.group);
  const form = createForm();
  spinGroup.add(form.group);
  const ribbon = createRibbon();
  stage.add(ribbon.mesh);
  const drift = createDrift();
  stage.add(drift.mesh);

  const shadowTex = shadowTexture();
  const shadowMat = new MeshBasicMaterial({
    color: 0x1d140c,
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const shadowGeo = new PlaneGeometry(1, 1);
  const shadow = new Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = -1;
  stage.add(shadow);

  // ---- state ----
  let width = 1;
  let height = 1;
  let lost = false;
  let disposed = false;
  let lastKey = '';
  let last = normalise(DEFAULT_STATE);
  let applied = { open: -1, peel: -1, color: -1, accent: -1 };
  const fabric = new Color();
  const accent = new Color();
  const tmpV = new Vector3();
  const dir = new Vector3();
  const up = new Vector3();
  const target = new Vector3();

  function readSize() {
    const w = Math.max(1, Math.round(canvas.clientWidth || canvas.width || 1));
    const h = Math.max(1, Math.round(canvas.clientHeight || canvas.height || 1));
    width = w;
    height = h;
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(w, h, false);
  }
  readSize();

  // ---- camera ----
  function placeCamera(s) {
    const aspect = width / height;
    const zoom = Math.max(0.05, s.zoom);
    const e = smoothstep(0, 1, clamp(s.view, 0, 1));
    // view 0: ring ~40% of the smaller side; camera above the top rim, pushes through the ring
    const fov = lerp(FOV_TOP, FOV, e);
    const tan0 = tanOf(FOV_TOP);
    const d0 = RING_W / (0.4 * 2 * tan0 * Math.min(1, aspect));
    // beyond zoom ~3 the camera dives into the ring; at zoom 6 it is inside, below the top edge,
    // where only the hole is in frame (checked for 9:19 … 21:9)
    const push = Math.pow(smoothstep(1, 6, zoom), 2);
    const dist0 = d0 / zoom - (d0 / 6 + 1.05) * push;
    // view 1: belt ~46% of the height, never wider than ~86% of the width
    const d1 = Math.max(HERO_H / (0.46 * 2 * TAN) + 0.85, HERO_W / (0.86 * 2 * TAN * aspect) + 0.2);
    const dist1 = d1 / zoom;
    const dist = lerp(dist0, dist1, e);
    const phi = lerp(Math.PI / 2, HERO_ELEV, e);
    dir.set(0, Math.sin(phi), Math.cos(phi));
    up.set(0, Math.cos(phi), -Math.sin(phi));
    target.set(0, lerp(TOP, HERO_CY, e), 0);
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.up.copy(up);
    tmpV.copy(camera.position).sub(dir);
    camera.lookAt(tmpV);
    camera.aspect = aspect;
    camera.fov = fov;
    const ad = Math.abs(dist);
    camera.near = clamp(ad * 0.04, 0.005, 0.5);
    camera.far = ad + 40;
    camera.updateProjectionMatrix();
    // lens shift for x / y (screen-space offset of everything)
    camera.projectionMatrix.elements[8] = -2 * s.x;
    camera.projectionMatrix.elements[9] = 2 * s.y;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    camera.updateMatrixWorld(true);
    return { dist, e };
  }

  // ---- apply ----
  function update(s) {
    const { dist, e } = placeCamera(s);

    if (s.open !== applied.open) {
      belt.setOpen(clamp(s.open, 0, 1));
      applied.open = s.open;
    }
    if (s.peel !== applied.peel) {
      belt.setPeel(clamp(s.peel, 0, 1));
      applied.peel = s.peel;
    }
    if (s.color !== applied.color) {
      belt.setColor(s.color);
      applied.color = s.color;
    }
    // fabric colour for drift tint
    {
      const pal = [new Color('#f8cda0'), new Color('#30375b'), new Color('#2f2925')];
      const t = clamp(s.color, 0, 2);
      const i = Math.min(1, Math.floor(t));
      fabric.copy(pal[i]).lerp(pal[i + 1], t - i);
    }
    accent.setHex(s.accent);
    ribbon.material.color.copy(accent);

    // tilt + idle float
    const t = s.time;
    stage.rotation.set(s.tilt, 0, 0);
    spinGroup.rotation.set(0, -s.spin, 0);
    const present = clamp(s.present, 0, 1.5);
    const halfH = Math.max(Math.abs(dist), 1.5) * Math.tan(((camera.fov / 2) * Math.PI) / 180);
    const travel = ((1 - 2 * s.y) * halfH + 2.2) * (1 - present);
    beltRoot.position.copy(up).multiplyScalar(-travel);
    beltRoot.position.y += 0.022 * Math.sin(t * 1.25);
    beltRoot.rotation.set(0.01 * Math.sin(t * 0.9 + 1.0), 0, 0.016 * Math.sin(t * 0.7));
    beltRoot.visible = present > 0.0005;

    // torso form
    const f = clamp(s.form, 0, 1);
    form.group.visible = f > 0.001;
    form.group.scale.setScalar(lerp(0.93, 1, f));
    const ft = f < 0.999;
    if (form.material.transparent !== ft) {
      form.material.transparent = ft;
      form.material.needsUpdate = true;
    }
    form.material.opacity = f;

    // contact shadow (view 1 only, fades when the belt leaves)
    const sh = 0.38 * smoothstep(0.35, 0.9, e) * present * present;
    shadow.visible = sh > 0.002;
    shadowMat.opacity = Math.min(1, sh);
    shadow.position.set(0, lerp(BELT_LOW - 0.03, FORM_BOTTOM - 0.01, f), 0.05);
    shadow.scale.set(lerp(3.0, 3.3, f), lerp(2.4, 2.6, f), 1);

    // ribbon
    const rk = smoothstep(0.5, 0.62, s.view);
    const ra = clamp(s.ribbonA, 0, 1);
    const rb = clamp(s.ribbonB, 0, 1);
    ribbon.mesh.visible = rk > 0.001 && rb > ra;
    ribbon.setRange(ra, rb);
    const rt = rk < 0.999;
    if (ribbon.material.transparent !== rt) {
      ribbon.material.transparent = rt;
      ribbon.material.needsUpdate = true;
    }
    ribbon.material.opacity = rk;

    // drift
    drift.update(t, clamp(s.drift, 0, 1), fabric, accent);

    scene.updateMatrixWorld(true);
  }

  function draw() {
    if (lost || disposed) return;
    renderer.render(scene, camera);
  }

  function apply(state) {
    if (disposed) return false;
    const s = normalise(state);
    const k = KEYS.map((key) => s[key]).join('|') + `|${width}x${height}`;
    if (k === lastKey) return false;
    last = s;
    update(s);
    if (lost) return false;
    lastKey = k;
    draw();
    return true;
  }

  function resize() {
    if (disposed) return;
    readSize();
    lastKey = '';
    apply(last);
  }

  // ---- context loss ----
  function onLost(ev) {
    ev.preventDefault();
    lost = true;
    lastKey = '';
  }
  function onRestored() {
    lost = false;
    // the PMREM render target lost its contents; textures and buffers are re-uploaded by three.
    // The old GL objects died with the old context, so they are dropped, not deleted.
    pmrem = new PMREMGenerator(renderer);
    envRT = null;
    buildEnv();
    for (const tex of belt.textures) tex.needsUpdate = true;
    shadowTex.needsUpdate = true;
    lastKey = '';
    apply(last);
  }
  canvas.addEventListener('webglcontextlost', onLost, false);
  canvas.addEventListener('webglcontextrestored', onRestored, false);

  // ---- anchors ----
  const aP = new Vector3();
  const aN = new Vector3();
  const camPos = new Vector3();
  function project(name) {
    const fallback = { x: width / 2, y: height / 2, visible: false };
    if (!belt.anchor(name, aP, aN)) return fallback;
    belt.group.updateWorldMatrix(true, false);
    aP.applyMatrix4(belt.group.matrixWorld);
    aN.transformDirection(belt.group.matrixWorld);
    camera.getWorldPosition(camPos);
    const facing = aN.dot(tmpV.copy(camPos).sub(aP)) > 0;
    const ndc = aP.clone().project(camera);
    const inFront = ndc.z > -1 && ndc.z < 1;
    return {
      x: ((ndc.x + 1) / 2) * width,
      y: ((1 - ndc.y) / 2) * height,
      visible: Boolean(facing && inFront && beltRoot.visible && last.present > 0.02),
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener('webglcontextlost', onLost, false);
    canvas.removeEventListener('webglcontextrestored', onRestored, false);
    belt.dispose();
    form.dispose();
    ribbon.dispose();
    drift.dispose();
    shadowGeo.dispose();
    shadowMat.dispose();
    shadowTex.dispose();
    if (envRT) envRT.dispose();
    pmrem.dispose();
    room.dispose && room.dispose();
    room = null;
    scene.environment = null;
    renderer.renderLists.dispose();
    renderer.dispose();
  }

  // first frame
  apply(DEFAULT_STATE);

  return { apply, resize, dispose, project };
}
