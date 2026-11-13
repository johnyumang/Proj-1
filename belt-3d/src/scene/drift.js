import { Color, IcosahedronGeometry, InstancedMesh, Matrix4, MeshStandardMaterial, Object3D, Quaternion, Euler, Vector3 } from 'three';

/**
 * Floating pieces: soft matte pebbles at varied depths round the belt, tinted between the fabric
 * colour and the accent. Their layout is seeded (always the same); `time` only moves them.
 */
const COUNT = 34;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createDrift() {
  const geo = new IcosahedronGeometry(1, 2);
  geo.scale(1, 0.5, 0.85); // a soft pebble / disc
  const mat = new MeshStandardMaterial({ roughness: 0.95, metalness: 0, transparent: false });
  const mesh = new InstancedMesh(geo, mat, COUNT);
  mesh.name = 'drift';
  mesh.frustumCulled = false;
  const r = rng(20251113);
  const items = [];
  const D = 7.5; // nominal hero camera distance used to keep pieces off the belt on screen
  while (items.length < COUNT) {
    const z = -3.5 + r() * 6;
    const x = (r() * 2 - 1) * 5.8;
    const y = -2.9 + r() * 5.4;
    const sx = x / (D - z);
    const sy = (y + 0.25) / (D - z);
    if (Math.abs(sx) < 0.2 && Math.abs(sy) < 0.17) continue; // keep the centre clear
    const near = (z + 3.5) / 6; // 0 far .. 1 near
    items.push({
      p: new Vector3(x, y, z),
      size: (0.05 + r() * 0.07) * (0.7 + near * 0.9),
      tint: r(),
      rot: new Euler(r() * 6.28, r() * 6.28, r() * 6.28),
      spin: new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.5),
      f: [0.25 + r() * 0.35, 0.2 + r() * 0.3, 0.15 + r() * 0.25],
      ph: [r() * 6.28, r() * 6.28, r() * 6.28],
    });
  }
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const s = new Vector3();
  const p = new Vector3();
  const c = new Color();
  const dummy = new Object3D();
  void dummy;

  function update(time, strength, fabric, accent) {
    mesh.visible = strength > 0.001;
    if (!mesh.visible) return;
    const k = 0.45 + 0.55 * strength;
    for (let i = 0; i < COUNT; i++) {
      const it = items[i];
      p.set(
        it.p.x + Math.sin(time * it.f[0] + it.ph[0]) * 0.14,
        it.p.y + Math.sin(time * it.f[1] + it.ph[1]) * 0.2,
        it.p.z + Math.sin(time * it.f[2] + it.ph[2]) * 0.1,
      );
      e.set(it.rot.x + time * it.spin.x, it.rot.y + time * it.spin.y, it.rot.z + time * it.spin.z);
      q.setFromEuler(e);
      s.setScalar(it.size * k);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      c.copy(fabric).lerp(accent, it.tint);
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    const t = strength < 0.999;
    if (mat.transparent !== t) {
      mat.transparent = t;
      mat.needsUpdate = true;
    }
    mat.opacity = Math.min(1, strength);
  }

  return {
    mesh,
    update,
    dispose() {
      geo.dispose();
      mat.dispose();
      mesh.dispose();
    },
  };
}
