import * as THREE from 'three';
import { RIVER_BOAT_HEIGHT, RIVER_BOAT_SEAT_Y, RIVER_BOAT_SEAT_Z, riverBoatAt } from '../shared/river-tour';

export function buildRiverBoat(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = 'east-river-skiff';
  const wood = new THREE.MeshStandardMaterial({ color: 0x623821, roughness: .85, side: THREE.DoubleSide });
  const trim = new THREE.MeshStandardMaterial({ color: 0x9d6b41, roughness: .78 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xaf8747, metalness: .45, roughness: .54 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x487269, side: THREE.DoubleSide, roughness: .91 });
  const cushion = new THREE.MeshStandardMaterial({ color: 0x9b6943, roughness: 1 });
  const add = (geometry: THREE.BufferGeometry, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, mat = trim) => {
    const mesh = add(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
  };
  const stations = [[-2.25, .035], [-1.79, .48], [-1.15, .77], [-.42, .86], [.42, .86], [1.15, .74], [1.78, .48], [2.25, .035]];
  const railY = (z: number) => .35 + .22 * (Math.abs(z) / 2.25) ** 4;
  const canopyCenter = -1.02, canopyHalf = .68;
  const canopyY = (x: number, z: number) => RIVER_BOAT_HEIGHT - .39 * (x / .85) ** 2 - .033 * ((z - canopyCenter) / canopyHalf) ** 2;
  const hull = new THREE.BufferGeometry(), vertices: number[] = [], indices: number[] = [];
  stations.forEach(([z, w], i) => {
    const top = railY(z), bottom = -.19 + .39 * (Math.abs(z) / 2.25) ** 4;
    vertices.push(-w, top, z, -.61 * w, bottom, z, .61 * w, bottom, z, w, top, z);
    if (i) for (let j = 0; j < 3; j++) {
      const a = i * 4 + j, b = a - 4;
      indices.push(b, a, b + 1, b + 1, a, a + 1);
    }
  });
  hull.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  hull.setIndex(indices); hull.computeVertexNormals();
  add(hull, wood);
  for (const side of [-1, 1]) {
    const rail = new THREE.CatmullRomCurve3(stations.map(([z, w]) => new THREE.Vector3(side * w, railY(z), z)));
    add(new THREE.TubeGeometry(rail, 22, .042, 6, false), trim);
    for (const [z, x, base] of [[-1.49, .53, .38], [-.47, .75, .35]]) {
      const top = canopyY(x, z) - .012;
      box(.055, top - base, .055, side * x, (top + base) / 2, z, wood);
    }
  }
  for (let i = -2; i <= 2; i++) box(.19, .05, 2.94 - Math.abs(i) * .19, i * .207, .18, 0);
  box(1.07, .095, .31, 0, .3425, -1.30);
  box(1.14, .03, 1.1, 0, RIVER_BOAT_SEAT_Y - .015, RIVER_BOAT_SEAT_Z + .15, cushion);
  for (const z of [-1.95, 1.95]) box(.36, .065, .29, 0, .425, z, brass);
  const canopy = new THREE.PlaneGeometry(1.7, 2 * canopyHalf, 14, 4).rotateX(-Math.PI / 2);
  const p = canopy.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setXYZ(i, x, canopyY(x, z + canopyCenter), z + canopyCenter);
  }
  canopy.computeVertexNormals(); add(canopy, cloth).name = 'east-river-canopy';
  for (const z of [canopyCenter - canopyHalf, canopyCenter + canopyHalf]) {
    const rib = new THREE.CatmullRomCurve3([-1, -.67, -.33, 0, .33, .67, 1].map(u =>
      new THREE.Vector3(u * .85, canopyY(u * .85, z), z)));
    add(new THREE.TubeGeometry(rib, 14, .025, 6), brass);
  }
  scene.add(group);
  const seat = new THREE.Vector3();
  return {
    update(elapsed: number, t: number) {
      const p = riverBoatAt(elapsed);
      const y = .067 + .014 * Math.sin(t * 2.4);
      group.position.set(p.x, y, p.z);
      group.rotation.set(.011 * Math.sin(t * 2.1), p.ry, .018 * Math.sin(t * 1.7), 'YXZ');
      seat.set(0, RIVER_BOAT_SEAT_Y, RIVER_BOAT_SEAT_Z).applyQuaternion(group.quaternion).add(group.position);
      return { seat, rotation: group.rotation };
    },
  };
}
