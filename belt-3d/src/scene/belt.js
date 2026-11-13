import {
  BoxGeometry,
  Color,
  DoubleSide,
  BackSide,
  FrontSide,
  Group,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector2,
  Vector3,
} from 'three';
import {
  TOP,
  GAP,
  TH,
  OUTER,
  VZ,
  ZIP_HALF,
  HOLE,
  INNER_ZIP,
  CLOSURE,
  STRAP_MID,
  bottomY,
  bandY,
  dvForDy,
  vOfY,
  seamY,
  SEAM,
  topY,
  zipY,
  offsetPoint,
  sectionNormal,
  outerPoint,
  arcRadius,
  zipSlider,
  bodyPoint,
  clamp,
  lerp,
} from './shape.js';
import { makeGrid, makeTube, makeSweep } from './geom.js';
import { knitNormalMap, hookMaps, padMaps, zipMap, labelTexture } from './textures.js';

const PI = Math.PI;

// Fabric colours sampled from the photos, and their tone-on-tone partners.
const PALETTE = {
  fabric: ['#f8cda0', '#30375b', '#2f2925'],
  binding: ['#c99f78', '#17181f', '#151312'],
  tape: ['#d9b089', '#262c49', '#231f1c'],
  pad: ['#b7a28c', '#41434c', '#3d3b3a'],
  hook: ['#c4a487', '#2b2f45', '#262423'],
};
function lin(hex) {
  return new Color(hex); // converted to linear working space by three
}
const PAL = Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [k, v.map(lin)]));

function blend(list, c, out) {
  const t = clamp(c, 0, 2);
  const i = Math.min(1, Math.floor(t));
  return out.copy(list[i]).lerp(list[i + 1], t - i);
}

/** Warm fresnel rim shared by the fabric materials (keeps navy/black readable). */
const RIM = { uRim: { value: new Color() } };
function rimChunk(src) {
  return src
    .replace('#include <common>', '#include <common>\nuniform vec3 uRim;')
    .replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      {
        float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        totalEmissiveRadiance += uRim * rimF * rimF * rimF;
      }`,
    );
}
function fabricHook(mat, key, backFactor, extra) {
  mat.onBeforeCompile = (sh) => {
    if (backFactor !== null) sh.uniforms.uRim = RIM.uRim;
    let f = backFactor === null ? sh.fragmentShader : rimChunk(sh.fragmentShader);
    if (backFactor && backFactor > 0) {
      f = f.replace(
        '#include <color_fragment>',
        `#include <color_fragment>\n if (!gl_FrontFacing) diffuseColor.rgb *= ${backFactor.toFixed(3)};`,
      );
    }
    sh.fragmentShader = f;
    if (extra) extra(sh);
  };
  mat.customProgramCacheKey = () => key;
}

export function createBelt() {
  const group = new Group();
  group.name = 'belt';
  const disposables = [];
  const keep = (x) => (disposables.push(x), x);

  // ---------- textures ----------
  const knit = keep(knitNormalMap());
  const knitInner = keep(knit.clone());
  const knitBind = keep(knit.clone());
  knitInner.needsUpdate = knitBind.needsUpdate = true;
  knit.repeat.set(1, 1); // uv already in tile units
  const R0 = arcRadius((CLOSURE.padTh0 + CLOSURE.padTh1) / 2, STRAP_MID);
  const padLen = (CLOSURE.padTh1 - CLOSURE.padTh0) * R0;
  const hook = hookMaps(CLOSURE.tabLen, CLOSURE.tabW);
  keep(hook.map);
  keep(hook.normal);
  const pad = padMaps(padLen, CLOSURE.padW);
  keep(pad.map);
  keep(pad.normal);
  const zipTex = keep(zipMap());
  const labelTex = keep(labelTexture());

  // ---------- materials ----------
  const fabricParams = {
    roughness: 0.86,
    metalness: 0,
    sheen: 0.6,
    sheenRoughness: 0.5,
    normalMap: knit,
    normalScale: new Vector2(0.42, 0.42),
  };
  const mOuter = keep(new MeshPhysicalMaterial({ ...fabricParams, side: DoubleSide }));
  fabricHook(mOuter, 'belt-outer', 0.62);
  const mTabTop = keep(new MeshPhysicalMaterial({ ...fabricParams, side: FrontSide }));
  fabricHook(mTabTop, 'belt-tabtop', 0);
  const mInner = keep(new MeshPhysicalMaterial({ ...fabricParams, normalMap: knitInner, side: FrontSide }));
  const holeR0 = arcRadius(HOLE.th, HOLE.y);
  fabricHook(mInner, 'belt-inner-hole', null, (sh) => {
    sh.uniforms.uHole = { value: new Vector3(HOLE.th, HOLE.y, HOLE.r) };
    sh.uniforms.uHoleR0 = { value: holeR0 };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBeltPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBeltPos = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vBeltPos;\nuniform vec3 uHole;\nuniform float uHoleR0;',
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        float hth = atan(vBeltPos.x, vBeltPos.z) - uHole.x;
        vec2 hd = vec2(hth * uHoleR0, vBeltPos.y - uHole.y);
        if (dot(hd, hd) < uHole.z * uHole.z) discard;`,
      );
  });
  const mLining = keep(new MeshStandardMaterial({ roughness: 0.95, side: DoubleSide }));
  const mBinding = keep(
    new MeshPhysicalMaterial({ ...fabricParams, normalMap: knitBind, roughness: 0.78, sheen: 0.7 }),
  );
  fabricHook(mBinding, 'belt-binding', 0);
  const mTape = keep(new MeshStandardMaterial({ roughness: 0.7, map: zipTex }));
  const mPuller = keep(new MeshStandardMaterial({ roughness: 0.45, metalness: 0.0 }));
  const mLabel = keep(new MeshStandardMaterial({ roughness: 0.9, map: labelTex }));
  const mPad = keep(
    new MeshStandardMaterial({ roughness: 0.97, map: pad.map, normalMap: pad.normal, normalScale: new Vector2(0.6, 0.6) }),
  );
  const mHook = keep(
    new MeshStandardMaterial({
      roughness: 0.8,
      side: BackSide,
      map: hook.map,
      normalMap: hook.normal,
      normalScale: new Vector2(0.9, 0.9),
    }),
  );
  const hookUniforms = { uMargin: { value: new Color() } };
  mHook.onBeforeCompile = (sh) => {
    sh.uniforms.uMargin = hookUniforms.uMargin;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uMargin;')
      .replace(
        '#include <map_fragment>',
        `vec4 hk = texture2D( map, vMapUv );
        diffuseColor.rgb = mix( uMargin, diffuseColor.rgb * hk.rgb, hk.a );
        diffuseColor.a = opacity;`,
      );
  };
  mHook.customProgramCacheKey = () => 'belt-hook';

  // ---------- helpers ----------
  const n = [0, 0, 0];
  const outward = (th, y, out) => {
    sectionNormal(th, y, out);
    return out;
  };
  const inward = (th, y, out) => {
    sectionNormal(th, y, out);
    out[0] = -out[0];
    out[2] = -out[2];
    return out;
  };
  const mesh = (geo, mat, name) => {
    keep(geo);
    const m = new Mesh(geo, mat);
    m.name = name;
    group.add(m);
    return m;
  };

  const thOf = (a) => -PI + 2 * PI * a;
  const UREP = 70; // knit tiles round the waist
  const VREP = 15; // knit tiles across the height

  // ---------- outer face: two grids split at the access zip ----------
  let open = 0;
  const lowerF = (a, b, out) => outerPoint(thOf(a), b * VZ, -1, open, out);
  const upperF = (a, b, out) => outerPoint(thOf(a), VZ + b * (1 - VZ), 1, open, out);
  const lowerRef = (a, b, out) => outward(thOf(a), bandY(thOf(a), b * VZ), out);
  const upperRef = (a, b, out) => outward(thOf(a), bandY(thOf(a), VZ + b * (1 - VZ)), out);
  const NU = 200;
  const outerLo = makeGrid(NU, 10, lowerF, lowerRef, (a, b) => [a * UREP, b * VZ * VREP]);
  const outerHi = makeGrid(NU, 24, upperF, upperRef, (a, b) => [a * UREP, (VZ + b * (1 - VZ)) * VREP]);
  mesh(outerLo.geometry, mOuter, 'outer-lower').frustumCulled = false;
  mesh(outerHi.geometry, mOuter, 'outer-upper').frustumCulled = false;
  // only the columns/rows round the access zip move when it opens
  const zi0 = Math.floor(((-ZIP_HALF - 0.08 + PI) / (2 * PI)) * NU);
  const zi1 = Math.ceil(((ZIP_HALF + 0.08 + PI) / (2 * PI)) * NU);
  const zjHi = Math.ceil((0.42 / (1 - VZ)) * 24) + 1;

  // ---------- inner face ----------
  const innerF = (a, b, out) => {
    const th = thOf(a);
    return offsetPoint(th, bandY(th, b), GAP, out);
  };
  const innerRef = (a, b, out) => inward(thOf(a), bandY(thOf(a), b), out);
  // denser near the front where the opening is cut out
  const inner = makeGrid(150, 22, innerF, innerRef, (a, b) => [a * UREP, b * VREP]);
  mesh(inner.geometry, mInner, 'inner');

  // ---------- lining (seen through the open zip and through the inner opening) ----------
  const LTH0 = -0.74;
  const LTH1 = 0.74;
  const liningF = (a, b, out) => {
    const th = lerp(LTH0, LTH1, a);
    return offsetPoint(th, bandY(th, lerp(VZ - 0.13, 0.8, b)), GAP + TH * 0.45, out);
  };
  const liningRef = (a, b, out) => outward(lerp(LTH0, LTH1, a), 0, out);
  mesh(makeGrid(40, 16, liningF, liningRef).geometry, mLining, 'lining');

  // ---------- binding round the top and bottom edges ----------
  const makeBinding = (top) => {
    const r = TH / 2 + 0.013; // soft rolled binding
    const bw = top ? 0.03 : 0.028;
    const mid = [0, 0, 0];
    const pA = [0, 0, 0];
    const pB = [0, 0, 0];
    const e = [0, 0, 0];
    return makeSweep(NU, 11, (a, P, N) => {
      const th = thOf(a);
      const v = top ? 1 : 0;
      const y = bandY(th, v);
      offsetPoint(th, y, GAP + TH / 2, mid);
      sectionNormal(th, y, n);
      offsetPoint(th, bandY(th, top ? 0.98 : 0.02), GAP + TH / 2, pA);
      offsetPoint(th, y, GAP + TH / 2, pB);
      e[0] = pB[0] - pA[0];
      e[1] = pB[1] - pA[1];
      e[2] = pB[2] - pA[2];
      const el = Math.hypot(e[0], e[1], e[2]) || 1;
      e[0] /= el;
      e[1] /= el;
      e[2] /= el;
      const set = (i, sn, se, sd) => {
        // point = mid + n*sn*r + e*(se*r) - e*sd ; normal from (sn, se)
        P[i][0] = mid[0] + n[0] * sn * r + e[0] * (se * r - sd);
        P[i][1] = mid[1] + n[1] * sn * r + e[1] * (se * r - sd);
        P[i][2] = mid[2] + n[2] * sn * r + e[2] * (se * r - sd);
        let nx = n[0] * sn + e[0] * se;
        let ny = n[1] * sn + e[1] * se;
        let nz = n[2] * sn + e[2] * se;
        const l = Math.hypot(nx, ny, nz) || 1;
        N[i][0] = nx / l;
        N[i][1] = ny / l;
        N[i][2] = nz / l;
      };
      set(0, 1, 0, bw);
      set(1, 1, 0, bw * 0.5);
      for (let k = 0; k < 7; k++) {
        const f = (k / 6) * PI;
        set(2 + k, Math.cos(f), Math.sin(f), 0);
      }
      set(9, -1, 0, bw * 0.5);
      set(10, -1, 0, bw);
    });
  };
  const bindTop = makeBinding(true);
  const bindBot = makeBinding(false);
  // knit along the binding
  for (const g of [bindTop, bindBot]) {
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * UREP * 1.6, uv.getY(i) * 0.6);
  }
  mesh(bindTop, mBinding, 'binding-top');
  mesh(bindBot, mBinding, 'binding-bottom');

  // ---------- access zip on the outer face ----------
  const ZT0 = -ZIP_HALF - 0.035;
  const ZT1 = ZIP_HALF + 0.035;
  const zipArc = (ZT1 - ZT0) * arcRadius(0, -0.6);
  const teeth = Math.round(zipArc / 0.012);
  const zipLoF = (a, b, out) => {
    const th = lerp(ZT0, ZT1, a);
    const v = VZ - (1 - b) * dvForDy(th, 0.032, -1);
    outerPoint(th, v, -1, open, out);
    sectionNormal(th, out[1], n);
    out[0] += n[0] * 0.004;
    out[2] += n[2] * 0.004;
    return out;
  };
  const zipHiF = (a, b, out) => {
    const th = lerp(ZT0, ZT1, a);
    const v = VZ + (1 - b) * dvForDy(th, 0.032, 1);
    outerPoint(th, v, 1, open, out);
    sectionNormal(th, out[1], n);
    out[0] += n[0] * 0.004;
    out[2] += n[2] * 0.004;
    return out;
  };
  const zipRef = (a, b, out) => outward(lerp(ZT0, ZT1, a), -0.6, out);
  const zipLo = makeGrid(90, 2, zipLoF, zipRef, (a, b) => [a * teeth, b]);
  const zipHi = makeGrid(90, 2, zipHiF, zipRef, (a, b) => [a * teeth + 0.5, b]);
  mesh(zipLo.geometry, mTape, 'zip-lower');
  mesh(zipHi.geometry, mTape, 'zip-upper');

  // slider + pull tab (tone-on-tone, matte)
  const sliderGeo = keep(new BoxGeometry(0.05, 0.032, 0.016));
  const pullGeo = keep(new BoxGeometry(0.032, 0.08, 0.009));
  pullGeo.translate(0, -0.045, 0.004);
  const slider = new Mesh(sliderGeo, mPuller);
  const pull = new Mesh(pullGeo, mPuller);
  slider.matrixAutoUpdate = pull.matrixAutoUpdate = false;
  group.add(slider, pull);

  const frameAt = (pt, th, y, sign, m) => {
    // basis: X along the waist (+th), Z = surface normal (sign), Y = Z x X
    const p0 = [0, 0, 0];
    const p1 = [0, 0, 0];
    offsetPoint(th - 1e-3, y, 0, p0);
    offsetPoint(th + 1e-3, y, 0, p1);
    const X = new Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize();
    sectionNormal(th, y, n);
    const Z = new Vector3(n[0] * sign, 0, n[2] * sign);
    if (sign < 0) X.negate();
    const Y = new Vector3().crossVectors(Z, X).normalize();
    m.makeBasis(X, Y, Z).setPosition(pt[0], pt[1], pt[2]);
    return m;
  };
  const sliderPos = [0, 0, 0];
  function placeSlider() {
    const th = clamp(zipSlider(open), -ZIP_HALF, ZIP_HALF);
    outerPoint(th, VZ, -1, open, sliderPos);
    sectionNormal(th, sliderPos[1], n);
    sliderPos[0] += n[0] * 0.012;
    sliderPos[2] += n[2] * 0.012;
    frameAt(sliderPos, th, sliderPos[1], 1, slider.matrix);
    pull.matrix.copy(slider.matrix);
    slider.matrixWorldNeedsUpdate = pull.matrixWorldNeedsUpdate = true;
  }
  placeSlider();

  // ---------- seam where the front apron is sewn to the band (a soft raised welt) ----------
  const seamP = (t, out) => {
    const th = lerp(SEAM.th0, SEAM.th1, t);
    const y = seamY(th);
    const v = vOfY(th, y);
    outerPoint(th, v, v >= VZ ? 1 : -1, open, out);
    sectionNormal(th, out[1], n);
    out[0] += n[0] * 0.002;
    out[2] += n[2] * 0.002;
    return out;
  };
  const seamR = (t, out) => outward(lerp(SEAM.th0, SEAM.th1, t), -0.3, out);
  const seam = makeTube(seamP, seamR, 160, 5, 0.0042, false);
  const mSeam = keep(new MeshPhysicalMaterial({ ...fabricParams, normalMap: null, roughness: 0.9 }));
  mesh(seam.geometry, mSeam, 'seam');

  // ---------- woven label, upper front on the wearer's left ----------
  const LAB = { th: 0.52, y: TOP - 0.135, w: 0.25, h: 0.09 };
  const labR = arcRadius(LAB.th, LAB.y);
  const labelF = (a, b, out) => {
    const th = LAB.th + ((a - 0.5) * LAB.w) / labR;
    return offsetPoint(th, LAB.y + (b - 0.5) * LAB.h, OUTER + 0.005, out);
  };
  mesh(makeGrid(8, 2, labelF, (a, b, out) => outward(LAB.th, LAB.y, out)).geometry, mLabel, 'label');

  // ---------- inner face: elastic-bound round opening ----------
  const ringP = (t, out) => {
    const f = t * 2 * PI;
    const th = HOLE.th + (HOLE.r * Math.cos(f)) / holeR0;
    return offsetPoint(th, HOLE.y + HOLE.r * Math.sin(f), GAP - 0.006, out);
  };
  const ringR = (t, out) => {
    const f = t * 2 * PI;
    const th = HOLE.th + (HOLE.r * Math.cos(f)) / holeR0;
    return inward(th, HOLE.y, out);
  };
  mesh(makeTube(ringP, ringR, 80, 8, 0.021, true).geometry, mBinding, 'hole-ring');

  // ---------- inner face: zip along the bulge (from the flat-pattern photo) ----------
  const izY = (th) => bottomY(th) + INNER_ZIP.above;
  const izArc = (INNER_ZIP.th1 - INNER_ZIP.th0) * arcRadius(0, -0.85);
  const izTeeth = Math.round(izArc / 0.012);
  const izF = (side) => (a, b, out) => {
    const th = lerp(INNER_ZIP.th0, INNER_ZIP.th1, a);
    const y = izY(th) + side * (1 - b) * 0.03;
    return offsetPoint(th, y, GAP - 0.004, out);
  };
  const izRef = (a, b, out) => inward(lerp(INNER_ZIP.th0, INNER_ZIP.th1, a), -0.85, out);
  mesh(makeGrid(60, 2, izF(-1), izRef, (a, b) => [a * izTeeth, b]).geometry, mTape, 'inner-zip-lower');
  mesh(makeGrid(60, 2, izF(1), izRef, (a, b) => [a * izTeeth + 0.5, b]).geometry, mTape, 'inner-zip-upper');
  {
    const th = INNER_ZIP.th1 - 0.02;
    const pt = offsetPoint(th, izY(th), GAP - 0.012, [0, 0, 0]);
    const s2 = new Mesh(sliderGeo, mPuller);
    const p2 = new Mesh(pullGeo, mPuller);
    s2.matrixAutoUpdate = p2.matrixAutoUpdate = false;
    frameAt(pt, th, pt[1], -1, s2.matrix);
    p2.matrix.copy(s2.matrix);
    group.add(s2, p2);
  }

  // ---------- VELCRO closure: long loop pad on the band + long hook tab over it ----------
  const padF = (a, b, out) => {
    const s = a * padLen;
    const r = CLOSURE.padW / 2;
    let hw = r;
    if (s < r) hw = Math.sqrt(Math.max(0, r * r - (r - s) ** 2));
    else if (s > padLen - r) hw = Math.sqrt(Math.max(0, r * r - (s - (padLen - r)) ** 2));
    hw = Math.max(hw, 0.003);
    const th = CLOSURE.padTh0 + s / R0;
    return offsetPoint(th, STRAP_MID + (b - 0.5) * 2 * hw, OUTER + 0.004, out);
  };
  const padUV = (a, b) => {
    const s = clamp(a, 0, 1) * padLen;
    const r = CLOSURE.padW / 2;
    let hw = r;
    if (s < r) hw = Math.sqrt(Math.max(0, r * r - (r - s) ** 2));
    else if (s > padLen - r) hw = Math.sqrt(Math.max(0, r * r - (s - (padLen - r)) ** 2));
    hw = Math.max(hw, 0.003);
    return [a, ((b - 0.5) * 2 * hw) / CLOSURE.padW + 0.5];
  };
  const padRef = (a, b, out) => outward(CLOSURE.padTh0 + (a * padLen) / R0, STRAP_MID, out);
  mesh(makeGrid(64, 8, padF, padRef, padUV).geometry, mPad, 'velcro-pad');

  // tab centre line, bent away from the band from its free end (peel)
  const L = CLOSURE.tabLen;
  const TR = CLOSURE.tabW / 2;
  const NC = 160;
  const cu = new Float32Array(NC + 1);
  const cw = new Float32Array(NC + 1);
  let peel = 0;
  function bendCurve() {
    // the detach line runs back from the free end toward the hinge; the peeled part bends
    // near the detach line and then runs fairly straight, reaching ~65 degrees at peel 1
    const ld = L * (1 - 0.75 * peel);
    const tip = 1.13 * peel;
    let u = 0;
    let w = 0;
    cu[0] = 0;
    cw[0] = 0;
    const ds = L / NC;
    for (let i = 1; i <= NC; i++) {
      const s = (i - 0.5) * ds;
      const f = s > ld ? (s - ld) / Math.max(1e-4, L - ld) : 0;
      const g = Math.min(1, f / 0.55);
      const al = tip * (1 - (1 - g) * (1 - g));
      u += Math.cos(al) * ds;
      w += Math.sin(al) * ds;
      cu[i] = u;
      cw[i] = w;
    }
  }
  const TAB_OFF = OUTER + 0.017;
  function tabCentre(s, out2) {
    const x = clamp(s / L, 0, 1) * NC;
    const i = Math.min(NC - 1, Math.floor(x));
    const f = x - i;
    out2[0] = lerp(cu[i], cu[i + 1], f);
    out2[1] = lerp(cw[i], cw[i + 1], f);
    return out2;
  }
  const c2 = [0, 0];
  function tabPoint(s, t, lift, out) {
    tabCentre(s, c2);
    const th = CLOSURE.hinge - c2[0] / R0;
    return offsetPoint(th, STRAP_MID + t, TAB_OFF + c2[1] + lift, out);
  }
  const tabHW = (s) => {
    if (s <= L - TR) return TR;
    return Math.max(0.004, Math.sqrt(Math.max(0, TR * TR - (s - (L - TR)) ** 2)));
  };
  const tabF = (a, b, out) => {
    const s = clamp(a, 0, 0.997) * L;
    return tabPoint(s, (b - 0.5) * 2 * tabHW(s), 0, out);
  };
  const tabUV = (a, b) => {
    const s = clamp(a, 0, 0.997) * L;
    return [a, ((b - 0.5) * 2 * tabHW(s)) / CLOSURE.tabW + 0.5];
  };
  // reference: away from the band at the tab (normal of the lifted surface is close to it)
  const tabRefPt = [0, 0, 0];
  const tabRefPt2 = [0, 0, 0];
  const tabRef = (a, b, out) => {
    // the outward side of the tab is the side away from the band
    const s = clamp(a, 0, 0.997) * L;
    tabPoint(s, 0, 0, tabRefPt);
    tabPoint(s, 0, 0.01, tabRefPt2);
    out[0] = tabRefPt2[0] - tabRefPt[0];
    out[1] = tabRefPt2[1] - tabRefPt[1];
    out[2] = tabRefPt2[2] - tabRefPt[2];
    return out;
  };
  bendCurve();
  const tab = makeGrid(70, 10, tabF, tabRef, tabUV);
  // tab top face uses its own knit uv scale
  const tabTopGeo = tab.geometry.clone();
  const tabTop = mesh(tabTopGeo, mTabTop, 'velcro-tab-top');
  const tabHook = mesh(tab.geometry, mHook, 'velcro-tab-hook');
  {
    const uv = tabTopGeo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 11, uv.getY(i) * 4);
  }
  void tabTop;
  void tabHook;

  // binding round the tab outline (gives the tab its thickness)
  const sideLen = L - TR;
  const per = 2 * sideLen + PI * TR + 2 * TR;
  const outlineST = (t, o) => {
    let d = (((t % 1) + 1) % 1) * per;
    if (d < sideLen) {
      o[0] = d;
      o[1] = -TR;
      return o;
    }
    d -= sideLen;
    if (d < PI * TR) {
      const f = -PI / 2 + d / TR;
      o[0] = L - TR + Math.cos(f) * TR;
      o[1] = Math.sin(f) * TR;
      return o;
    }
    d -= PI * TR;
    if (d < sideLen) {
      o[0] = sideLen - d;
      o[1] = TR;
      return o;
    }
    d -= sideLen;
    o[0] = 0;
    o[1] = TR - d;
    return o;
  };
  const st = [0, 0];
  const tabOutP = (t, out) => {
    outlineST(t, st);
    return tabPoint(clamp(st[0], 0, L), st[1] * 0.985, 0, out);
  };
  const tabOutR = (t, out) => {
    outlineST(t, st);
    return tabRef(clamp(st[0] / L, 0, 1), 0.5, out);
  };
  const tabBind = makeTube(tabOutP, tabOutR, 200, 6, 0.011, true);
  mesh(tabBind.geometry, mBinding, 'velcro-tab-binding');

  function setPeel(p) {
    peel = p;
    bendCurve();
    tab.update(tabF);
    tabTopGeo.attributes.position.array.set(tab.geometry.attributes.position.array);
    tabTopGeo.attributes.normal.array.set(tab.geometry.attributes.normal.array);
    tabTopGeo.attributes.position.needsUpdate = tabTopGeo.attributes.normal.needsUpdate = true;
    tabTopGeo.computeBoundingSphere();
    tabBind.update(tabOutP, tabOutR);
  }

  function setOpen(o) {
    open = o;
    outerLo.update(lowerF, zi0, zi1, 0, 10);
    outerHi.update(upperF, zi0, zi1, 0, zjHi);
    seam.update(seamP, seamR);
    zipLo.update(zipLoF);
    zipHi.update(zipHiF);
    placeSlider();
  }

  // ---------- colours ----------
  const tmp = new Color();
  const white = new Color(1, 1, 1);
  function setColor(c) {
    const fabric = blend(PAL.fabric, c, new Color());
    const dark = clamp(c, 0, 1);
    mOuter.color.copy(fabric);
    mTabTop.color.copy(fabric);
    mInner.color.copy(fabric).multiplyScalar(0.9);
    mLining.color.copy(fabric).multiplyScalar(0.5);
    blend(PAL.binding, c, mBinding.color);
    blend(PAL.tape, c, mTape.color);
    blend(PAL.binding, c, mPuller.color).lerp(blend(PAL.tape, c, tmp), 0.35);
    blend(PAL.pad, c, mPad.color);
    blend(PAL.hook, c, mHook.color);
    hookUniforms.uMargin.value.copy(fabric).multiplyScalar(0.92);
    RIM.uRim.value.setRGB(1.0, 0.78, 0.55).multiplyScalar(lerp(0.03, 0.16, dark));
    // soft sheen keeps the dark knits readable: stronger and lighter on navy/black
    mSeam.color.copy(fabric).multiplyScalar(0.8);
    mInner.sheen = 0.2;
    mInner.sheenColor.copy(mInner.color);
    for (const m of [mOuter, mTabTop, mBinding]) {
      m.sheen = lerp(0.2, 0.45, dark);
      m.sheenColor.copy(m.color).lerp(white, lerp(0.25, 0.2, dark));
      m.sheenRoughness = lerp(0.55, 0.42, dark);
    }
  }

  // ---------- anchors (belt-local point + outward normal) ----------
  function anchor(name, outP, outN) {
    let th;
    let y;
    let off = OUTER;
    if (name === 'pocket') {
      th = 0;
      y = lerp(bottomY(0), topY(0), 0.55);
    } else if (name === 'zip') {
      th = 0;
      y = zipY(0);
    } else if (name === 'fastening') {
      th = (CLOSURE.padTh0 + CLOSURE.padTh1) / 2;
      y = STRAP_MID;
      off = OUTER + 0.02;
    } else if (name === 'label') {
      th = LAB.th;
      y = LAB.y;
    } else return false;
    const p = offsetPoint(th, y, off, [0, 0, 0]);
    sectionNormal(th, y, n);
    outP.set(p[0], p[1], p[2]);
    outN.set(n[0], 0, n[2]);
    return true;
  }

  return {
    group,
    setOpen,
    setPeel,
    setColor,
    anchor,
    materials: [mOuter, mTabTop, mInner, mLining, mBinding, mTape, mPuller, mLabel, mPad, mHook],
    textures: [knit, knitInner, knitBind, hook.map, hook.normal, pad.map, pad.normal, zipTex, labelTex],
    dispose() {
      for (const d of disposables) d.dispose && d.dispose();
    },
  };
}

// ---------- torso form: abstract waist form continuing the belt's own surface ----------
export const FORM_TOP = 1.35;
export const FORM_BOTTOM = -1.8;
const FORM_FADE = 0.5;

export function createForm() {
  const group = new Group();
  group.name = 'form';
  // a quiet cool neutral: clearly not skin and not fabric
  const mat = new MeshStandardMaterial({
    color: 0xb9bcb8,
    roughness: 1,
    metalness: 0,
    transparent: true,
    depthWrite: true,
  });
  const fade = { uFadeY: { value: new Vector2(FORM_BOTTOM, FORM_TOP) } };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFadeY = fade.uFadeY;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vFormY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFormY = position.y;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vFormY;\nuniform vec2 uFadeY;')
      .replace(
        '#include <alphamap_fragment>',
        `#include <alphamap_fragment>
        diffuseColor.a *= smoothstep(uFadeY.x, uFadeY.x + ${FORM_FADE.toFixed(2)}, vFormY)
          * smoothstep(uFadeY.y, uFadeY.y - ${FORM_FADE.toFixed(2)}, vFormY);`,
      );
  };
  mat.customProgramCacheKey = () => 'belt-form';
  const sideF = (a, b, out) => {
    const th = -PI + 2 * PI * a;
    return bodyPoint(th, lerp(FORM_BOTTOM, FORM_TOP, b), out);
  };
  const sideRef = (a, b, out) => sectionNormal(-PI + 2 * PI * a, lerp(FORM_BOTTOM, FORM_TOP, b), out);
  const side = makeGrid(120, 48, sideF, sideRef);
  const m = new Mesh(side.geometry, mat);
  m.renderOrder = 1;
  group.add(m);
  return {
    group,
    material: mat,
    dispose() {
      side.geometry.dispose();
      mat.dispose();
    },
  };
}
