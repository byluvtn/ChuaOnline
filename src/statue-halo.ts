import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const tau = Math.PI * 2;
const solarGold = new THREE.MeshStandardMaterial({
  color: 0xb96823, metalness: 0.32, roughness: 0.43, emissive: 0xef7010, emissiveIntensity: 0.45,
});
const lightGold = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb840).multiplyScalar(1.45) });
const ivory = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffdd8f).multiplyScalar(2.2) });
const aura = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  vertexShader: `varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `varying vec2 vUv;
    void main() {
      float r = length(vUv * 2.0 - 1.0) * 1.48;
      float d = r - 0.96;
      float rim = exp(-36.0 * d * d);
      float falloff = 1.0 - smoothstep(1.12, 1.48, r);
      gl_FragColor = vec4(1.0, 0.41, 0.08, (0.24 * rim + 0.065 * (1.0 - smoothstep(0.2, 1.05, r))) * falloff);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
});
const glowPlane = new THREE.PlaneGeometry(2.96, 2.96);

function lotusRay(length: number, width: number, depth: number) {
  const petal = new THREE.Shape();
  petal.moveTo(0, 0);
  petal.bezierCurveTo(-width, length * 0.32, -width * 0.72, length * 0.69, 0, length);
  petal.bezierCurveTo(width * 0.72, length * 0.69, width, length * 0.32, 0, 0);
  return new THREE.ExtrudeGeometry(petal, { depth, bevelEnabled: false, curveSegments: 5 }).translate(0, 0, -depth / 2);
}

function makeRelief() {
  const rim = (radius: number, width: number, z: number) =>
    new THREE.TorusGeometry(radius, width, 6, 72).translate(0, 0, z);
  const relief: THREE.BufferGeometry[] = [rim(0.92, 0.05, 0), rim(0.80, 0.020, 0.006)];
  const inlay: THREE.BufferGeometry[] = [rim(0.955, 0.014, 0.024), rim(0.855, 0.013, 0.008)];
  const highlights: THREE.BufferGeometry[] = [rim(0.917, 0.013, 0.049), rim(0.917, 0.013, -0.049)];
  const outer = lotusRay(0.252, 0.11, 0.032), inner = lotusRay(0.165, 0.047, 0.04);
  const bead = new THREE.OctahedronGeometry(0.023);
  for (let i = 0; i < 12; i++) {
    const a = i * tau / 12;
    relief.push(outer.clone().translate(0, 0.97, 0).rotateZ(a));
    inlay.push(inner.clone().translate(0, 1.004, 0).rotateZ(a));
    const gap = a + tau / 24;
    highlights.push(bead.clone().translate(0, 1.035, 0).rotateZ(gap));
  }
  const combine = (parts: THREE.BufferGeometry[]) => {
    // Extrude and Octahedron are non-indexed; use the same representation for the rims.
    const normalized = parts.map(g => g.index ? g.toNonIndexed() : g);
    const merged = mergeGeometries(normalized)!;
    normalized.forEach((g, i) => { if (g !== parts[i]) g.dispose(); });
    parts.forEach(g => g.dispose());
    return merged;
  };
  [outer, inner, bead].forEach(g => g.dispose());
  return [combine(relief), combine(inlay), combine(highlights)];
}

let reliefGeometry: THREE.BufferGeometry[] | undefined;
let brightRelief: THREE.Material[] | undefined;

/** Radiant lotus aureole in the statue's local XY plane, with +Z facing the player. */
export function buildHalo(radius: number, y: number, z: number, bright = false) {
  reliefGeometry ??= makeRelief();
  const halo = new THREE.Group();
  halo.name = 'halo';
  halo.position.set(0, y, z);
  halo.scale.setScalar(radius);
  const materials = bright ? (brightRelief ??= [solarGold.clone(), lightGold.clone(), ivory.clone()].map(material => {
    if (material instanceof THREE.MeshStandardMaterial) material.emissiveIntensity *= 1.35;
    else material.color.multiplyScalar(1.25);
    return material;
  })) : [solarGold, lightGold, ivory];
  materials.forEach((material, i) => {
    // Separate the sculpted relief from glow so statue bounds can ignore the soft edge.
    halo.add(new THREE.Mesh(reliefGeometry![i], material));
  });
  const glow = new THREE.Mesh(glowPlane, aura);
  glow.name = 'halo-glow';
  glow.position.z = -0.062;
  halo.add(glow);
  return halo;
}

const strippedGeometry = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();

/** Remove baked halo pieces; for mixed primitives keep the gold of the figure and its accessories. */
export function hideBakedHalo(model: THREE.Object3D, asset: string) {
  model.traverse(object => {
    if (/\bhalo\b/i.test(object.name)) object.visible = false;
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
    const { name } = object.material;
    // These GLBs batch the rear disk with trim, or the rear rim with the front lamp.
    const cutoff = asset === 'chibi-dia-tang' && /^Gold \| (Satin|Rounded highlights)$/.test(name) ? -0.765
      : (asset === 'chibi-a-di-da' || asset === 'chibi-nhien-dang') && name === 'Satin gold leaf' ? -0.82
      : asset === 'chibi-nhien-dang' && name === 'Polished halo rim' ? -0.80 : null;
    if (cutoff !== null && object.geometry.index) {
      const original = object.geometry as THREE.BufferGeometry;
      let filtered = strippedGeometry.get(original);
      if (!filtered) {
        const index = original.index!;
        const position = original.getAttribute('position');
        const keep: number[] = [];
        for (let i = 0; i < index.count; i += 3) {
          const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
          if (Math.max(position.getZ(a), position.getZ(b), position.getZ(c)) > cutoff) keep.push(a, b, c);
        }
        filtered = new THREE.BufferGeometry().setIndex(keep);
        for (const [key, attribute] of Object.entries(original.attributes)) filtered.setAttribute(key, attribute);
        strippedGeometry.set(original, filtered);
      }
      object.geometry = filtered;
    } else if (/\bhalo\b/i.test(name)) {
      object.visible = false;
    }
  });
}
