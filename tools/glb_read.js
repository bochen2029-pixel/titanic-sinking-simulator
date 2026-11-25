// A small reader of the GLBs the Blender builds write (tools/blender/build_ship.py, build_spaces.py), for their checks:
// the file read here, not by Blender, every node's triangles back in the ship frame.
//   const G = require('./glb_read');  const parts = G.partsOf(G.readGLB(buf));   // Map name -> Float64Array, 9 a triangle
// glTF is +Y up: (X, Y, Z) in the file is (x, z, -y) of the ship frame (x forward, y to port, z up), metres.
'use strict';

function readGLB(buf) {
  if (buf.readUInt32LE(0) !== 0x46546C67 || buf.readUInt32LE(4) !== 2) throw new Error('not a glTF 2 binary');
  let off = 12, json = null, bin = null;
  while (off < buf.readUInt32LE(8)) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4), data = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4E4F534A) json = JSON.parse(data.toString('utf8')); else if (type === 0x004E4942) bin = data;
    off += 8 + len;
  }
  return { json, bin };
}
function accessor(g, i) {
  const a = g.json.accessors[i], bv = g.json.bufferViews[a.bufferView], n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  const size = { 5126: 4, 5125: 4, 5123: 2, 5121: 1 }[a.componentType];
  const rd = { 5126: (o) => g.bin.readFloatLE(o), 5125: (o) => g.bin.readUInt32LE(o), 5123: (o) => g.bin.readUInt16LE(o), 5121: (o) => g.bin.readUInt8(o) }[a.componentType];
  const start = (bv.byteOffset || 0) + (a.byteOffset || 0), stride = bv.byteStride || n * size, out = new Float64Array(a.count * n);
  for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = rd(start + k * stride + c * size);
  return out;
}
// every node's triangles in the ship frame (its translation, rotation and scale applied)
function partsOf(g) {
  const parts = new Map();
  for (const nd of g.json.nodes || []) {
    if (nd.mesh === undefined) continue;
    const T = nd.translation || [0, 0, 0], Q = nd.rotation || [0, 0, 0, 1], Sc = nd.scale || [1, 1, 1];
    const rot = (v) => {                                   // q v q*, q = [x, y, z, w]
      const [qx, qy, qz, qw] = Q, [vx, vy, vz] = v;
      const tx = 2 * (qy * vz - qz * vy), ty = 2 * (qz * vx - qx * vz), tz = 2 * (qx * vy - qy * vx);
      return [vx + qw * tx + (qy * tz - qz * ty), vy + qw * ty + (qz * tx - qx * tz), vz + qw * tz + (qx * ty - qy * tx)];
    };
    const tris = [];
    for (const pr of g.json.meshes[nd.mesh].primitives) {
      if ((pr.mode === undefined ? 4 : pr.mode) !== 4) continue;
      const P = accessor(g, pr.attributes.POSITION), I = pr.indices === undefined ? null : accessor(g, pr.indices), nI = I ? I.length : P.length / 3;
      for (let k = 0; k < nI; k++) {
        const v = I ? I[k] : k, w = rot([P[v * 3] * Sc[0], P[v * 3 + 1] * Sc[1], P[v * 3 + 2] * Sc[2]]);
        tris.push(w[0] + T[0], -(w[2] + T[2]), w[1] + T[1]);
      }
    }
    parts.set(nd.name, Float64Array.from(tris));
  }
  return parts;
}
// the volume a closed, outward-wound set of triangles holds (the divergence theorem: signed tetrahedra from the origin)
function volume(tris) {
  let v = 0;
  for (let t = 0; t < tris.length; t += 9) {
    const ax = tris[t], ay = tris[t + 1], az = tris[t + 2], bx = tris[t + 3], by = tris[t + 4], bz = tris[t + 5], cx = tris[t + 6], cy = tris[t + 7], cz = tris[t + 8];
    v += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
  }
  return v / 6;
}

module.exports = { readGLB, accessor, partsOf, volume };
