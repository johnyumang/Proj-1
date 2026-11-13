import { BufferAttribute, BufferGeometry, CatmullRomCurve3, DoubleSide, Mesh, MeshStandardMaterial, Vector3 } from 'three';

/**
 * One long flat ribbon: in from off-screen left, behind the belt, once round the front at a slant,
 * behind again and out to the right. Drawn only between ribbonA and ribbonB (fractions of its
 * length) with round ends, done in the fragment shader so the page can draw it on and wipe it off.
 */
export const RIBBON_WIDTH = 0.11; // ~7% of the belt height

export function createRibbon() {
  const pts = [
    new Vector3(-9.5, 1.25, -0.3),
    new Vector3(-6.2, 0.85, -0.65),
    new Vector3(-3.4, 0.3, -1.15),
  ];
  // helix round the belt: back-left -> right side -> front (slanting down to the wearer's right) ->
  // left side -> back -> out right
  const RX = 1.42;
  const RZ = 1.2;
  const a0 = Math.PI * 1.2;
  const a1 = -Math.PI * 1.2;
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    const y = -0.2 + 0.45 * Math.sin(a) + 0.05 * a;
    pts.push(new Vector3(RX * Math.sin(a), y, RZ * Math.cos(a)));
  }
  pts.push(new Vector3(3.4, -0.55, -1.15), new Vector3(6.2, -1.05, -0.65), new Vector3(9.5, -1.45, -0.3));
  const curve = new CatmullRomCurve3(pts, false, 'centripetal');
  const N = 1400;
  const length = curve.getLength();
  const P = curve.getSpacedPoints(N);
  const pos = new Float32Array((N + 1) * 2 * 3);
  const nor = new Float32Array((N + 1) * 2 * 3);
  const uv = new Float32Array((N + 1) * 2 * 2);
  const up = new Vector3(0, 1, 0);
  const T = new Vector3();
  const W = new Vector3();
  const Nn = new Vector3();
  const hw = RIBBON_WIDTH / 2;
  for (let i = 0; i <= N; i++) {
    const p0 = P[Math.max(0, i - 1)];
    const p1 = P[Math.min(N, i + 1)];
    T.subVectors(p1, p0).normalize();
    W.copy(up).addScaledVector(T, -up.dot(T)).normalize();
    Nn.crossVectors(T, W).normalize();
    for (let s = 0; s < 2; s++) {
      const k = i * 2 + s;
      const sg = s === 0 ? -1 : 1;
      pos[k * 3] = P[i].x + W.x * hw * sg;
      pos[k * 3 + 1] = P[i].y + W.y * hw * sg;
      pos[k * 3 + 2] = P[i].z + W.z * hw * sg;
      nor[k * 3] = Nn.x;
      nor[k * 3 + 1] = Nn.y;
      nor[k * 3 + 2] = Nn.z;
      uv[k * 2] = i / N;
      uv[k * 2 + 1] = sg;
    }
  }
  const idx = [];
  for (let i = 0; i < N; i++) {
    const k = i * 2;
    idx.push(k, k + 2, k + 3, k, k + 3, k + 1);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('normal', new BufferAttribute(nor, 3));
  geo.setAttribute('uv', new BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();

  const uniforms = {
    uRange: { value: [0, 0] },
    uLen: { value: length },
    uHalfW: { value: hw },
  };
  const mat = new MeshStandardMaterial({ roughness: 0.82, metalness: 0, side: DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uRange = uniforms.uRange;
    sh.uniforms.uLen = uniforms.uLen;
    sh.uniforms.uHalfW = uniforms.uHalfW;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vRib;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRib = uv;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vRib;\nuniform vec2 uRange;\nuniform float uLen;\nuniform float uHalfW;')
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        {
          float s = vRib.x * uLen;
          float a = uRange.x * uLen;
          float b = uRange.y * uLen;
          if (b <= a) discard;
          float t = vRib.y * uHalfW;
          float r = min(uHalfW, 0.5 * (b - a));
          float s0 = a + r;
          float s1 = b - r;
          if (s < a || s > b) discard;
          if (s < s0 && (s0 - s) * (s0 - s) + t * t > r * r) discard;
          if (s > s1 && (s - s1) * (s - s1) + t * t > r * r) discard;
        }`,
      );
  };
  mat.customProgramCacheKey = () => 'belt-ribbon';
  const mesh = new Mesh(geo, mat);
  mesh.name = 'ribbon';
  mesh.frustumCulled = false;
  return {
    mesh,
    material: mat,
    setRange(a, b) {
      uniforms.uRange.value[0] = a;
      uniforms.uRange.value[1] = b;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
