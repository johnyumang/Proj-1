import { BufferAttribute, BufferGeometry } from 'three';

/** Flip each triangle whose winding disagrees with its vertex normals (so FrontSide culling works). */
function orient(idx, pos, nor) {
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3;
    const b = idx[t + 1] * 3;
    const c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a];
    const uy = pos[b + 1] - pos[a + 1];
    const uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a];
    const vy = pos[c + 1] - pos[a + 1];
    const vz = pos[c + 2] - pos[a + 2];
    const gx = uy * vz - uz * vy;
    const gy = uz * vx - ux * vz;
    const gz = ux * vy - uy * vx;
    const nx = nor[a] + nor[b] + nor[c];
    const ny = nor[a + 1] + nor[b + 1] + nor[c + 1];
    const nz = nor[a + 2] + nor[b + 2] + nor[c + 2];
    if (gx * nx + gy * ny + gz * nz < 0) {
      const tmp = idx[t + 1];
      idx[t + 1] = idx[t + 2];
      idx[t + 2] = tmp;
    }
  }
  return idx;
}

/**
 * A parametric grid surface: F(a, b, out) writes the point for a, b in [0, 1].
 * Normals come from central differences (F must accept a, b slightly outside [0, 1]) and are
 * oriented to agree with ref(a, b, out) (a rough outward direction).
 * The grid can be rewritten in place with update(F) (same topology).
 */
export function makeGrid(nu, nv, F, ref, uvFn) {
  const cols = nu + 1;
  const rows = nv + 1;
  const count = cols * rows;
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      const a = i / nu;
      const b = j / nv;
      if (uvFn) {
        const t = uvFn(a, b);
        uv[k * 2] = t[0];
        uv[k * 2 + 1] = t[1];
      } else {
        uv[k * 2] = a;
        uv[k * 2 + 1] = b;
      }
    }
  }
  const idx = [];
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const k0 = j * cols + i;
      const k1 = k0 + 1;
      const k2 = k0 + cols;
      const k3 = k2 + 1;
      idx.push(k0, k1, k3, k0, k3, k2);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('normal', new BufferAttribute(nor, 3));
  geo.setAttribute('uv', new BufferAttribute(uv, 2));

  const p = [0, 0, 0];
  const pa0 = [0, 0, 0];
  const pa1 = [0, 0, 0];
  const pb0 = [0, 0, 0];
  const pb1 = [0, 0, 0];
  const r = [0, 0, 0];
  const h = 1e-3;

  function update(G, i0 = 0, i1 = cols - 1, j0 = 0, j1 = rows - 1) {
    const partial = i0 > 0 || j0 > 0 || i1 < cols - 1 || j1 < rows - 1;
    for (let j = Math.max(0, j0); j <= Math.min(rows - 1, j1); j++) {
      const b = j / nv;
      for (let i = Math.max(0, i0); i <= Math.min(cols - 1, i1); i++) {
        const a = i / nu;
        const k = (j * cols + i) * 3;
        G(a, b, p);
        G(a - h, b, pa0);
        G(a + h, b, pa1);
        G(a, b - h, pb0);
        G(a, b + h, pb1);
        const ax = pa1[0] - pa0[0];
        const ay = pa1[1] - pa0[1];
        const az = pa1[2] - pa0[2];
        const bx = pb1[0] - pb0[0];
        const by = pb1[1] - pb0[1];
        const bz = pb1[2] - pb0[2];
        let nx = ay * bz - az * by;
        let ny = az * bx - ax * bz;
        let nz = ax * by - ay * bx;
        ref(a, b, r);
        if (nx * r[0] + ny * r[1] + nz * r[2] < 0) {
          nx = -nx;
          ny = -ny;
          nz = -nz;
        }
        let l = Math.hypot(nx, ny, nz);
        if (l < 1e-12) {
          nx = r[0];
          ny = r[1];
          nz = r[2];
          l = Math.hypot(nx, ny, nz) || 1;
        }
        pos[k] = p[0];
        pos[k + 1] = p[1];
        pos[k + 2] = p[2];
        nor[k] = nx / l;
        nor[k + 1] = ny / l;
        nor[k + 2] = nz / l;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.normal.needsUpdate = true;
    if (!partial) geo.computeBoundingSphere();
  }

  update(F);
  orient(idx, pos, nor);
  geo.setIndex(count > 65535 ? new BufferAttribute(new Uint32Array(idx), 1) : new BufferAttribute(new Uint16Array(idx), 1));
  return { geometry: geo, update };
}

/**
 * A tube following a closed or open polyline given by P(t, out) for t in [0, 1], with a rough
 * "outward" reference direction R(t, out) used to build its frame. Radius may be a number.
 */
export function makeTube(P, R, segs, radial, radius, closed) {
  const cols = radial + 1;
  const rows = segs + 1;
  const pos = new Float32Array(cols * rows * 3);
  const nor = new Float32Array(cols * rows * 3);
  const p = [0, 0, 0];
  const p0 = [0, 0, 0];
  const p1 = [0, 0, 0];
  const r = [0, 0, 0];
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('normal', new BufferAttribute(nor, 3));
  function update(Pf, Rf) {
    for (let j = 0; j < rows; j++) {
      const t = j / segs;
      Pf(t, p);
      const t0 = closed ? t - 1e-3 : Math.max(0, t - 1e-3);
      const t1 = closed ? t + 1e-3 : Math.min(1, t + 1e-3);
      Pf(t0, p0);
      Pf(t1, p1);
      let tx = p1[0] - p0[0];
      let ty = p1[1] - p0[1];
      let tz = p1[2] - p0[2];
      const tl = Math.hypot(tx, ty, tz) || 1;
      tx /= tl;
      ty /= tl;
      tz /= tl;
      Rf(t, r);
      const d = r[0] * tx + r[1] * ty + r[2] * tz;
      let nx = r[0] - d * tx;
      let ny = r[1] - d * ty;
      let nz = r[2] - d * tz;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl;
      ny /= nl;
      nz /= nl;
      const bx = ty * nz - tz * ny;
      const by = tz * nx - tx * nz;
      const bz = tx * ny - ty * nx;
      for (let i = 0; i < cols; i++) {
        const a = (i / radial) * Math.PI * 2;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const ox = nx * c + bx * s;
        const oy = ny * c + by * s;
        const oz = nz * c + bz * s;
        const k = (j * cols + i) * 3;
        pos[k] = p[0] + ox * radius;
        pos[k + 1] = p[1] + oy * radius;
        pos[k + 2] = p[2] + oz * radius;
        nor[k] = ox;
        nor[k + 1] = oy;
        nor[k + 2] = oz;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.normal.needsUpdate = true;
    geo.computeBoundingSphere();
  }
  update(P, R);
  const idx = [];
  for (let j = 0; j < segs; j++) {
    for (let i = 0; i < radial; i++) {
      const k0 = j * cols + i;
      const k1 = k0 + 1;
      const k2 = k0 + cols;
      const k3 = k2 + 1;
      idx.push(k0, k1, k3, k0, k3, k2);
    }
  }
  orient(idx, pos, nor);
  geo.setIndex(idx);
  return { geometry: geo, update };
}

/** Profile sweep: for each a in [0,1] (nu segments) a list of `m` profile points/normals. */
export function makeSweep(nu, m, profile) {
  const cols = m;
  const rows = nu + 1;
  const pos = new Float32Array(cols * rows * 3);
  const nor = new Float32Array(cols * rows * 3);
  const uv = new Float32Array(cols * rows * 2);
  const P = [];
  const Nn = [];
  for (let i = 0; i < m; i++) {
    P.push([0, 0, 0]);
    Nn.push([0, 0, 0]);
  }
  for (let j = 0; j < rows; j++) {
    const a = j / nu;
    profile(a, P, Nn);
    for (let i = 0; i < m; i++) {
      const k = (j * cols + i) * 3;
      pos[k] = P[i][0];
      pos[k + 1] = P[i][1];
      pos[k + 2] = P[i][2];
      nor[k] = Nn[i][0];
      nor[k + 1] = Nn[i][1];
      nor[k + 2] = Nn[i][2];
      uv[(j * cols + i) * 2] = a;
      uv[(j * cols + i) * 2 + 1] = i / (m - 1);
    }
  }
  const idx = [];
  for (let j = 0; j < nu; j++) {
    for (let i = 0; i < m - 1; i++) {
      const k0 = j * cols + i;
      const k1 = k0 + 1;
      const k2 = k0 + cols;
      const k3 = k2 + 1;
      idx.push(k0, k1, k3, k0, k3, k2);
    }
  }
  orient(idx, pos, nor);
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('normal', new BufferAttribute(nor, 3));
  geo.setAttribute('uv', new BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}
