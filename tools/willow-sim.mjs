// Willow verification (news 105): willow-sketchfab-S model, placement, clearance.
// Run from repo root: npx tsx tools/willow-sim.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GARDEN_PLACEMENTS, GARDEN_COLLIDERS } from '../src/garden.ts';
import { ROAD_NODES, ROAD_EDGES, roadPath } from '../shared/roads.ts';
import { blocked, groundY, LAKE, FLOWER_BEDS } from '../src/layout.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const MODEL = path.resolve(here, '..', 'public', 'models', 'willow-sketchfab-S.glb');
const GARDEN_SRC = path.resolve(here, '..', 'src', 'garden.ts');
const TOL = 0.05;
const W = { x: -14, z: 30, r: 1.0 };

let failed = false;
const report = (ok, label, detail = '') => {
  if (!ok) failed = true;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ' ' + detail : ''}`);
};
const near = (v, exp) => Math.abs(v - exp) <= TOL;

const typeOf = (p) => p.type ?? p.name ?? p.model;
const xzOf = (o) => [o.x ?? o.cx ?? o.pos?.x ?? o.position?.x, o.z ?? o.cz ?? o.pos?.z ?? o.position?.z];
const nodeList = Array.isArray(ROAD_NODES)
  ? ROAD_NODES.map((n) => ({ id: n.id, x: n.x, z: n.z }))
  : Object.entries(ROAD_NODES).map(([id, n]) => ({ id, x: n.x, z: n.z }));
const byId = Object.fromEntries(nodeList.map((n) => [String(n.id), n]));
const ptSeg = (px, pz, a, b) => {
  const dx = b.x - a.x, dz = b.z - a.z;
  const l2 = dx * dx + dz * dz;
  let t = l2 ? ((px - a.x) * dx + (pz - a.z) * dz) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a.x + t * dx), pz - (a.z + t * dz));
};

function glbJson(buf) {
  const jsonLen = buf.readUInt32LE(12);
  if (buf.readUInt32LE(16) !== 0x4e4f534a) throw new Error('first chunk is not JSON');
  return JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
}
function glbTris(buf) {
  const json = glbJson(buf);
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

// Check A1: model file
try {
  if (!fs.existsSync(MODEL)) throw new Error('file missing');
  const buf = fs.readFileSync(MODEL);
  if (buf.toString('latin1', 0, 4) !== 'glTF') throw new Error('bad magic');
  const json = glbJson(buf);
  const tris = glbTris(buf);
  const meshes = (json.meshes ?? []).length;
  const mats = json.materials ?? [];
  const maskMats = mats.filter(m => m.alphaMode === 'MASK');
  const mask = maskMats.length === 1 && near(maskMats[0].alphaCutoff, 0.246);
  report(buf.length === 5510480 && tris === 9082 && meshes === 2 && mask, 'A1 willow glb',
    `size ${buf.length}/5510480, tris ${tris}/9082, meshes ${meshes}/2, materials ${mats.length}, MASK ${maskMats.length}, alphaMode ${maskMats[0]?.alphaMode}, cutoff ${maskMats[0]?.alphaCutoff}`);
} catch (e) {
  report(false, 'A1 willow glb', e.message);
}

// Check A2: placement
{
  const hits = GARDEN_PLACEMENTS.filter((p) => typeOf(p) === 'willow-sketchfab-S');
  const p = hits[0];
  const ok = hits.length === 1 && p && p.x === -14 && p.z === 30 && p.ry === 0.4 &&
    p.height === 13 && p.colliderR === 1.0;
  report(!!ok, 'A2 willow placement', p ? `x=${p.x} z=${p.z} ry=${p.ry} height=${p.height} colliderR=${p.colliderR}` : 'not found');
  report(hits.length === 1, 'A2 willow entry count', `${hits.length}`);
  report(GARDEN_PLACEMENTS.length === 25, 'A2 total placements', `${GARDEN_PLACEMENTS.length}/25`);
}

// Check A3: terrain
{
  const b = blocked(-14, 30);
  const g = groundY(-14, 30);
  report(b === false && g === 0, 'A3 blocked/groundY', `blocked=${b} groundY=${g}`);
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
    const a = byId[String(ai)], b = byId[String(bi)];
    if (a && b) segs.push([a, b, `${ai}-${bi}`]);
  }
  const col = GARDEN_COLLIDERS.find((c) => {
    const [x, z] = xzOf(c);
    return x === W.x && z === W.z;
  });
  let min = Infinity, what = '';
  for (const n of nodeList) {
    const d = Math.hypot(W.x - n.x, W.z - n.z) - W.r;
    if (d < min) { min = d; what = `node ${n.id}`; }
  }
  for (const [a, b, label] of segs) {
    const d = ptSeg(W.x, W.z, a, b) - W.r;
    if (d < min) { min = d; what = `edge ${label}`; }
  }
  console.log(`  willow collider found: ${!!col}, min clearance ${min.toFixed(3)} m (${what})`);
  report(!!col && Number.isFinite(min) && min >= 0.5, 'C clearance >= 0.5 m', `min ${min.toFixed(3)} (${what})`);
}

// Check D
{
  const gw = byId['gateW'], vc = byId['vuonCayE'];
  const dRoad = gw && vc ? ptSeg(W.x, W.z, gw, vc) : NaN;
  let dLake = Infinity;
  for (let i = 0; i < 720; i++) {
    const t = (i / 720) * Math.PI * 2;
    dLake = Math.min(dLake, Math.hypot(W.x - (LAKE.x + LAKE.a * Math.cos(t)), W.z - (LAKE.z + LAKE.b * Math.sin(t))));
  }
  // Bồn hoa lấy từ FLOWER_BEDS (ellipse); cột đèn (-9.5, 26) và anh đào (-8, 30) vẫn hardcode theo vị trí đã đo
  const dLamp = Math.hypot(W.x + 9.5, W.z - 26);
  const bedW = FLOWER_BEDS.find(b => b.x < 0);
  let dBed = Infinity;
  for (let i = 0; i < 720; i++) {
    const t = (i / 720) * Math.PI * 2;
    const ex = bedW.x + bedW.a * Math.cos(t);
    const ez = bedW.z + bedW.b * Math.sin(t);
    dBed = Math.min(dBed, Math.hypot(W.x - ex, W.z - ez));
  }
  const dCherry = Math.hypot(W.x + 8, W.z - 30);
  console.log(`  d road gateW-vuonCayE ${dRoad.toFixed(3)}, lake ${dLake.toFixed(3)}, lamp ${dLamp.toFixed(3)}, ` +
    `flowerbed W ${dBed.toFixed(3)}, castle-cherry ${dCherry.toFixed(3)}`);
  report(dRoad >= 8 - TOL, 'D1 road edge >= 8', `${dRoad.toFixed(3)} (expect 8.35)`);
  report(dLake >= 7.5 - TOL, 'D2 lake rim >= 7.5', `${dLake.toFixed(3)} (expect 7.81)`);
  report(dLamp >= 6 - TOL, 'D3 lamp post >= 6', `${dLamp.toFixed(3)} (expect 6.02)`);
  report(dBed >= 3.5 - TOL, 'D4 flowerbed W >= 3.5', `${dBed.toFixed(3)} (expect 3.79)`);
  report(dCherry >= 6 - TOL, 'D5 castle-cherry >= 6', `${dCherry.toFixed(3)} (expect 6.00)`);
}

// Check E: regression guard for toToon() alphaTest fix
{
  const src = fs.readFileSync(GARDEN_SRC, 'utf8');
  report(src.includes('alphaTest'), 'E garden.ts contains alphaTest');
}

console.log(failed ? 'WILLOW_SIM: FAIL' : 'WILLOW_SIM: ALL PASS');
process.exit(failed ? 1 : 0);
