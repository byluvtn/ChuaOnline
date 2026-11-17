import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const audit = JSON.parse(readFileSync(new URL('./blender/architecture-audit.json', import.meta.url), 'utf8'));
for (const expected of audit) {
  const path = new URL(`../public/models/${expected.name}.glb`, import.meta.url);
  const bytes = readFileSync(path);
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)).trim());
  assert.equal(gltf.asset.generator.includes('Blender'), true);
  assert.equal(gltf.images?.length ?? 0, 0);
  assert.equal(gltf.textures?.length ?? 0, 0);
  assert.equal(gltf.animations?.length ?? 0, 0);
  assert.equal(gltf.materials.length, 6);
  assert.equal(gltf.meshes.length, 6);
  assert.equal(gltf.buffers.length, 1);
  assert.equal(gltf.buffers[0].uri, undefined, 'GLB must be self-contained');
  assert.equal(bytes.length, expected.bytes);
  let triangles = 0, primitives = 0;
  for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
    primitives++;
    assert.equal(primitive.mode ?? 4, 4);
    assert(primitive.attributes.NORMAL !== undefined);
    const position = gltf.accessors[primitive.attributes.POSITION];
    assert(position.min.every(Number.isFinite) && position.max.every(Number.isFinite));
    triangles += gltf.accessors[primitive.indices].count / 3;
  }
  for (const material of gltf.materials) {
    assert.equal(material.alphaMode ?? 'OPAQUE', 'OPAQUE');
    assert.equal(material.doubleSided ?? false, false);
    assert(material.pbrMetallicRoughness.roughnessFactor >= 0.4);
  }
  assert.equal(triangles, expected.triangles);
  assert.equal(primitives, 6);
  assert(triangles < (expected.name.startsWith('dien') ? 18000 : 6000));
  assert(statSync(path).size < 1500000);
  console.log('PASS', expected.name, JSON.stringify({ triangles, primitives, bytes: bytes.length, materials: 6, textures: 0 }));
}
assert(statSync(new URL('./blender/campus-architecture.blend', import.meta.url)).size > 1000);
