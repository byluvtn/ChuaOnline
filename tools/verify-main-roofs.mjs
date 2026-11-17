import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const audit = JSON.parse(readFileSync(new URL('./blender/main-roofs-audit.json', import.meta.url), 'utf8'));
assert.equal(audit.length, 2);
for (const expected of audit) {
  const path = new URL(`../public/models/${expected.name}.glb`, import.meta.url);
  const bytes = readFileSync(path);
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)).trim());
  assert.match(gltf.asset.generator, /Blender/);
  assert.equal(gltf.meshes.length, expected.meshes);
  assert.equal(gltf.materials.length, expected.meshes);
  assert.equal(gltf.images?.length ?? 0, 0);
  assert.equal(gltf.buffers.length, 1);
  assert.equal(gltf.buffers[0].uri, undefined);
  assert.equal(gltf.animations?.length ?? 0, 0);
  let triangles = 0;
  for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
    assert(primitive.attributes.NORMAL !== undefined);
    triangles += gltf.accessors[primitive.indices].count / 3;
  }
  assert.equal(triangles, expected.triangles);
  assert.equal(bytes.length, expected.bytes);
  assert(triangles < 40000 && bytes.length < 2300000);
  console.log('PASS', expected.name, { triangles, meshes: gltf.meshes.length, bytes: bytes.length });
}
assert(statSync(new URL('./blender/main-roofs.blend', import.meta.url)).size > 1000);
