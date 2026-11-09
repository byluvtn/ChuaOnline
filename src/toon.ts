import * as THREE from 'three';

const gradient = (() => {
  const data = new Uint8Array([105, 105, 105, 255, 175, 175, 175, 255, 228, 228, 228, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

export const toon = (color: THREE.ColorRepresentation, extra: Partial<THREE.MeshToonMaterialParameters> = {}) =>
  new THREE.MeshToonMaterial({ color, gradientMap: gradient, ...extra });

const outlineCache = new Map<number, THREE.ShaderMaterial>();
export function outlineMaterial(thick: number) {
  let m = outlineCache.get(thick);
  if (!m) {
    m = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      fog: false,
      uniforms: { thick: { value: thick }, tint: { value: new THREE.Color(0x2e211a) } },
      vertexShader: 'uniform float thick; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * thick, 1.0); }',
      fragmentShader: 'uniform vec3 tint; void main(){ gl_FragColor = vec4(tint, 1.0); }',
    });
    outlineCache.set(thick, m);
  }
  return m;
}

/** Adds an inverted-hull outline as a child sharing the mesh geometry. */
export function outlined<T extends THREE.Mesh>(mesh: T, thick = 0.022): T {
  const o = new THREE.Mesh(mesh.geometry, outlineMaterial(thick));
  o.castShadow = false;
  o.raycast = () => {};
  mesh.add(o);
  return mesh;
}

const geoCache = new Map<string, THREE.BufferGeometry>();
export function geo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g as T;
}
