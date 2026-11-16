#!/usr/bin/env node
// Vá khe hở giữa các tầng của public/models/pagoda.glb.
// Chỉ dùng node:fs — không dependency ngoài.
// Chạy: node tools/fix-pagoda-gaps.mjs   (idempotent: chạy lần 2 an toàn)

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'public/models/pagoda.glb';
const EPS = 1e-3;

const buf = readFileSync(FILE);
if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('không phải GLB');
if (buf.readUInt32LE(4) !== 2) throw new Error('không phải GLB v2');
const totalLen = buf.readUInt32LE(8);

// --- parse chunks ---
const chunks = [];
let off = 12;
while (off < totalLen) {
  const len = buf.readUInt32LE(off);
  const type = buf.readUInt32LE(off + 4);
  chunks.push({ type, dataStart: off + 8, len });
  off += 8 + len;
}
const jsonChunk = chunks.find(c => c.type === 0x4e4f534a); // 'JSON'
const binChunk = chunks.find(c => c.type === 0x004e4942);  // 'BIN\0'
if (!jsonChunk || !binChunk) throw new Error('thiếu chunk JSON/BIN');

const gltf = JSON.parse(buf.subarray(jsonChunk.dataStart, jsonChunk.dataStart + jsonChunk.len).toString('utf8'));
const bin = buf.subarray(binChunk.dataStart, binChunk.dataStart + binChunk.len);

// --- helper: đọc/ghi POSITION của 1 primitive (float32 LE, không stride) ---
function accessorFloats(accIdx) {
  const acc = gltf.accessors[accIdx];
  if (acc.componentType !== 5126 || acc.type !== 'VEC3') throw new Error('accessor không phải VEC3 float32');
  const bv = gltf.bufferViews[acc.bufferView];
  if (bv.byteStride && bv.byteStride !== 12) throw new Error('có byteStride, không hỗ trợ');
  const start = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  return { start, count: acc.count };
}
function readY(accIdx) {
  const { start, count } = accessorFloats(accIdx);
  const out = [];
  for (let i = 0; i < count; i++) out.push(bin.readFloatLE(start + i * 12 + 4));
  return out;
}
function yLevels(ys) {
  const set = new Set();
  for (const y of ys) set.add(Math.round(y * 1000) / 1000);
  return [...set].sort((a, b) => a - b);
}

// --- map tên primitive ---
const mesh = gltf.meshes[0];
const prims = {};
for (const p of mesh.primitives) {
  const name = gltf.materials?.[p.material]?.name ?? `prim${p.material}`;
  if (p.attributes?.POSITION != null) prims[name] = p.attributes.POSITION;
}
if (prims.lant == null || prims.gold == null) throw new Error('thiếu primitive "lant" hoặc "gold"');

let changed = false;

// --- 1) "lant": hạ đáy các hộp thân (trừ hộp 1) xuống 0,15 ---
{
  const { start, count } = accessorFloats(prims.lant);
  const targets = [2.2, 3.8, 5.4, 7.0];
  // đọc y trước
  const ysBefore = readY(prims.lant);
  console.log('lant Y (trước):', yLevels(ysBefore).join(', '));
  // xác định mức đáy nào thực sự còn cần hạ (delta 0,15)
  let n = 0;
  for (let i = 0; i < count; i++) {
    const yOff = start + i * 12 + 4;
    const y = bin.readFloatLE(yOff);
    for (const t of targets) {
      if (Math.abs(y - t) < EPS) {
        bin.writeFloatLE(t - 0.15, yOff); // 2.2->2.05, 3.8->3.65, 5.4->5.25, 7.0->6.85
        n++;
        changed = true;
        break;
      }
    }
  }
  console.log(`lant: hạ ${n} vertex (kỳ vọng > 0 ở lần đầu, 0 ở lần chạy lại)`);
  console.log('lant Y (sau):  ', yLevels(readY(prims.lant)).join(', '));
}

// --- 2) "gold": dời toàn bộ vertex xuống 0,3 ---
{
  const { start, count } = accessorFloats(prims.gold);
  const ysBefore = readY(prims.gold);
  console.log('gold Y (trước):', yLevels(ysBefore).join(', '));
  // chỉ dời nếu còn ở mức cũ (8.7..10.9); nếu đã ở 8.4..10.6 thì coi như đã vá
  const minY = Math.min(...ysBefore);
  if (Math.abs(minY - 8.7) < EPS) {
    for (let i = 0; i < count; i++) {
      const yOff = start + i * 12 + 4;
      bin.writeFloatLE(bin.readFloatLE(yOff) - 0.3, yOff);
    }
    changed = true;
    console.log(`gold: dời ${count} vertex xuống 0,3`);
  } else {
    console.log('gold: đã vá (minY ≈', minY.toFixed(3), '), bỏ qua');
  }
  console.log('gold Y (sau):  ', yLevels(readY(prims.gold)).join(', '));
}

// --- ghi đè file nếu có thay đổi ---
if (!changed) {
  console.log('Không có gì để sửa — file đã được vá.');
  process.exit(0);
}
// ghi BIN đã sửa vào buffer gốc (bin là subarray -> view, dùng set vào buf)
buf.set(bin, binChunk.dataStart);
writeFileSync(FILE, buf);
console.log('Đã ghi', FILE);
