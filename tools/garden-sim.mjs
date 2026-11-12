// Garden verification: models, road reachability, collider clearance.
// Run from repo root: npx tsx tools/garden-sim.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GARDEN_PLACEMENTS, GARDEN_COLLIDERS } from '../src/garden.ts';
import { ROAD_NODES, ROAD_EDGES, roadPath } from '../shared/roads.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const MODELS = path.resolve(here, '..', 'public', 'models');
const EXPECT = {
  cherry_tree: { size: 10424, tris: 80 },
  maple_tree: { size: 8380, tris: 60 },
  bamboo_cluster: { size: 26924, tris: 288 },
  stone_lantern: { size: 8568, tris: 82 },
  pagoda: { size: 12424, tris: 118 },
  zen_sand_garden: { size: 13684, tris: 124 },
};
const EXPECT_INSTANCES = 12;
const MIN_CLEAR = 0.5;

let failed = false;
const report = (ok, label, detail = '') => {
  if (!ok) failed = true;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ' ' + detail : ''}`);
};

// Normalize shapes defensively.
const typeOf = (p) => p.type ?? p.name ?? p.model;
const xzOf = (o) => [o.x ?? o.cx ?? o.pos?.x ?? o.position?.x, o.z ?? o.cz ?? o.pos?.z ?? o.position?.z];
const nodeList = (Array.isArray(ROAD_NODES)
  ? ROAD_NODES.map((n) => ({ id: n.id, x: n.x, z: n.z }))
  : Object.entries(ROAD_NODES).map(([id, n]) => ({ id, x: n.x, z: n.z })));
const nodeById = new Map(nodeList.map((n) => [String(n.id), n]));

function glbTris(buf) {
  const jsonLen = buf.readUInt32LE(12);
  if (buf.readUInt32LE(16) !== 0x4e4f534a) throw new Error('first chunk is not JSON');
  const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
  let tris = 0;
  for (const mesh of json.meshes ?? []) {
    for (const prim of mesh.primitives ?? []) {
      if (prim.mode !== undefined && prim.mode !== 4) continue;
      const acc = prim.indices !== undefined ? prim.indices : prim.attributes.POSITION;
      tris += json.accessors[acc].count / 3;
    }
  }
  return tris;
}

// Check A
{
  const counts = {};
  for (const p of GARDEN_PLACEMENTS) counts[typeOf(p)] = (counts[typeOf(p)] ?? 0) + 1;
  const missing = Object.keys(EXPECT).filter((t) => !counts[t]);
  report(missing.length === 0, 'A1 types present', missing.length ? `missing: ${missing.join(', ')}` : '');
  report(GARDEN_PLACEMENTS.length === EXPECT_INSTANCES, 'A2 instance count',
    `${GARDEN_PLACEMENTS.length} (expected ${EXPECT_INSTANCES})`);

  let total = 0;
  for (const [name, exp] of Object.entries(EXPECT)) {
    const file = path.join(MODELS, `${name}.glb`);
    try {
      if (!fs.existsSync(file)) throw new Error('file missing');
      const buf = fs.readFileSync(file);
      if (buf.toString('latin1', 0, 4) !== 'glTF') throw new Error('bad magic');
      const sizeOk = buf.length === exp.size;
      const tris = glbTris(buf);
      const n = counts[name] ?? 0;
      total += tris * n;
      console.log(`  ${name}: ${tris} tris x ${n} instances, ${buf.length} bytes`);
      report(sizeOk && tris === exp.tris, `A3 ${name}`,
        `size ${buf.length}/${exp.size}, tris ${tris}/${exp.tris}`);
    } catch (e) {
      report(false, `A3 ${name}`, e.message);
    }
  }
  console.log(`  total garden tris: ${total}`);
}

// Check B
{
  const bad = [];
  for (const n of nodeList) {
    const p = roadPath('plaza', n.id);
    if (!Array.isArray(p) || p.length === 0) bad.push(n.id);
  }
  report(bad.length === 0, 'B reachability from plaza',
    bad.length ? `unreachable: ${bad.join(', ')}` : `${nodeList.length} nodes`);
}

// Check C
{
  const segs = [];
  for (const e of ROAD_EDGES) {
    const [ai, bi] = Array.isArray(e) ? e : [e.a ?? e.from, e.b ?? e.to];
    const a = nodeById.get(String(ai));
    const b = nodeById.get(String(bi));
    if (a && b) segs.push([a, b, `${ai}-${bi}`]);
  }
  const segDist = (px, pz, a, b) => {
    const dx = b.x - a.x, dz = b.z - a.z;
    const l2 = dx * dx + dz * dz;
    let t = l2 ? ((px - a.x) * dx + (pz - a.z) * dz) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (a.x + t * dx), pz - (a.z + t * dz));
  };
  let min = Infinity, minWhat = '';
  const viol = [];
  GARDEN_COLLIDERS.forEach((c, i) => {
    const [x, z] = xzOf(c);
    for (const n of nodeList) {
      const d = Math.hypot(x - n.x, z - n.z);
      if (d < min) { min = d; minWhat = `collider ${i} to node ${n.id}`; }
      if (d < MIN_CLEAR) viol.push(`collider ${i} (${x},${z}) node ${n.id} d=${d.toFixed(2)}`);
    }
    for (const [a, b, label] of segs) {
      const d = segDist(x, z, a, b);
      if (d < min) { min = d; minWhat = `collider ${i} to edge ${label}`; }
      if (d < MIN_CLEAR) viol.push(`collider ${i} (${x},${z}) edge ${label} d=${d.toFixed(2)}`);
    }
  });
  console.log(`  colliders: ${GARDEN_COLLIDERS.length}, edges: ${segs.length}`);
  console.log(`  min distance: ${min.toFixed(3)} m (${minWhat})`);
  viol.forEach((v) => console.log(`  violation: ${v}`));
  report(viol.length === 0 && Number.isFinite(min), 'C clearance >= 0.5 m', `min ${min.toFixed(3)}`);
}

console.log(failed ? 'GARDEN_SIM: FAIL' : 'GARDEN_SIM: ALL PASS');
process.exit(failed ? 1 : 0);
