import * as THREE from 'three';
import { RIVER_FALLS, riverAt } from '../shared/campus';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type Rock = [x: number, y: number, z: number, rx: number, ry: number, rz: number];

function batch(parts: THREE.BufferGeometry[]) {
  const mesh = mergeGeometries(parts)!;
  parts.forEach(g => g.dispose());
  return mesh;
}

function colored(g: THREE.BufferGeometry, base: THREE.Color, moss = base, mossAt = 0.2) {
  const pos = g.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const grain = 0.91 + 0.09 * Math.sin(13 * pos.getX(i) + 6 * pos.getY(i) + 9 * pos.getZ(i));
    c.copy(base).lerp(moss, THREE.MathUtils.smoothstep(pos.getY(i), mossAt, mossAt + 0.42)).multiplyScalar(grain).toArray(colors, i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

export function buildRiverWaterfall() {
  const group = new THREE.Group();
  group.name = 'east-river-waterfall';
  group.position.set(RIVER_FALLS.x, 0.062, RIVER_FALLS.z);

  const stone = [0x536762, 0x74817a, 0x667674, 0x858b77].map(hex => new THREE.Color(hex));
  const moss = new THREE.Color(0x698448);
  const foliage = [0x355f37, 0x4b7438, 0x6d883b, 0x628342].map(hex => new THREE.Color(hex));
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, flatShading: true });
  const boulder = ([x, y, z, w, h, d]: Rock, i: number, top = moss, base = stone[i % stone.length], mossAt = 0.16) =>
    colored(new THREE.IcosahedronGeometry(1, 2).rotateY(i * 1.73).rotateZ(Math.sin(i * 2.7) * 0.22), base, top, mossAt)
      .scale(w, h, d).translate(x, y, z);

  // Closed cores connect the ledges; irregular boulders hide the seams and outline the islands.
  const shelf = (y: number, back: number, front: readonly [number, number][], bottom: number) => {
    const outline = [...front, [front.at(-1)![0] - 0.35, back], [front[0][0] + 0.4, back - 0.24]];
    const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: y - bottom, bevelEnabled: false });
    g.rotateX(-Math.PI / 2).translate(0, bottom, 0);
    return colored(g, stone[0], moss, y - 0.38);
  };
  // Local geometry keeps the original crest profile; the group translates it to the new
  // head-water position (80, -82), widening every element by WIDE about its own centre.
  const WIDE = RIVER_FALLS.hw / 6.2;
  const rocks: Rock[] = [
    [-5.95, 0.75, -1.85, 1.10, 1.76, 1.46], [-4.75, 0.85, -1.86, 1.26, 1.48, 1.23],
    [-3.24, 0.76, -1.72, 1.09, 1.42, 1.15], [-1.88, 0.60, -1.42, 1.02, 1.41, 1.15],
    [-0.43, 0.80, -1.82, 1.02, 1.49, 1.19], [1.16, 0.75, -1.61, 1.28, 1.40, 1.04],
    [2.9, 0.71, -1.66, 1.23, 1.68, 1.21], [4.46, 0.80, -1.94, 1.28, 1.40, 1.35],
    [5.87, 1.03, -2.02, 1.14, 1.86, 1.65], [-5.63, 2.96, -4.02, 1.22, 2.22, 1.22],
    [-4.60, 3.26, -4.72, 1.38, 1.63, 1.46], [-2.72, 3.29, -4.86, 1.32, 1.75, 1.28],
    [-0.83, 3.35, -5.04, 1.27, 1.64, 1.17], [1.07, 3.40, -5.12, 1.34, 1.73, 1.23],
    [2.65, 3.32, -4.72, 1.14, 1.82, 1.4], [4.18, 3.29, -4.44, 1.44, 1.70, 1.54],
    [5.67, 2.91, -4.02, 1.35, 2.30, 1.45], [-1.38, 5.09, -5.21, 0.65, 0.65, 0.78],
    [1.38, 5.06, -5.08, 0.62, 0.69, 0.79], [-3.86, 5.01, -6.23, 0.64, 0.33, 1.12],
    [3.91, 5.0, -6.27, 0.59, 0.38, 1.13], [-3.07, 5.88, -8.45, 1.58, 2.54, 1.47],
    [-1.53, 6.19, -8.76, 1.22, 2.24, 1.2], [0.08, 6.05, -8.87, 1.32, 2.36, 1.36],
    [1.49, 6.29, -8.69, 1.13, 2.14, 1.14], [2.87, 6.05, -8.35, 1.2, 2.48, 1.46],
    [-1.8, 8.30, -9.41, 0.93, 0.57, 1.13], [1.87, 8.25, -9.02, 0.8, 0.53, 1.21],
  ].map(([x, y, z, w, h, d]): Rock => [x * WIDE, y, z, w * 0.86 + w * 0.14 * WIDE, h, d]);
  // Hai khối đá mới ở hai mép thác, theo đúng mẫu boulder + rêu của dãy cũ.
  rocks.push([-7.72, 0.72, -1.86, 1.14, 1.62, 1.32], [7.74, 0.76, -1.92, 1.16, 1.70, 1.30]);

  const rockParts = rocks.map(([x, y, z, w, h, d], i) => {
    // Recess the rock behind the sheets, leaving the mossy islands at their lips.
    if ((i >= 1 && i <= 7) || (i >= 10 && i <= 15) || (i >= 22 && i <= 24)) {
      return boulder([x, y - .14, z - .69, w, h * .94, d], i);
    }
    return boulder([x, y, z, w, h, d], i);
  });
  const scaleFront = (front: [number, number][]) => front.map(([x, z]): [number, number] => [x * WIDE, z]);
  rockParts.push(
    shelf(2.16, -9, scaleFront([[-6.2,-2.67],[-4.9,-2.47],[-3.3,-2.72],[-1.75,-2.6],[0,-2.79],[1.8,-2.6],[3.1,-2.78],[4.9,-2.52],[6.2,-2.70]]), -0.75),
    shelf(4.96, -10.9, scaleFront([[-5.35,-5.24],[-3.75,-5.17],[-2.72,-5.44],[-1.36,-5.31],[0,-5.38],[1.35,-5.23],[2.6,-5.32],[4.08,-5.07],[5.33,-5.42]]), 1.88),
    shelf(8.48, -11.5, scaleFront([[-2.49,-8.58],[-1.05,-8.3],[0,-8.51],[1.05,-8.34],[2.62,-8.64]]), 4.59),
  );
  const cliff = new THREE.Mesh(batch(rockParts), material);
  cliff.name = 'ban-gioc-cliff';
  cliff.castShadow = cliff.receiveShadow = true;
  group.add(cliff);

  // Snap each plant to the actual rock surface so foliage follows the irregular ledges.
  const ray = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0,-1,0));
  const plants: [number, number, number][] = [
    [-5.88,-2.72,.41],[-4.88,-2.76,.26],[5.64,-2.39,.43],[6.22,-1.98,.24],
    [-5.58,-4.24,.48],[-4.70,-5.12,.33],[5.52,-3.99,.50],[4.56,-4.75,.38],
    [-1.39,-5.28,.39],[-1.51,-5.59,.24],[1.39,-5.08,.40],[1.48,-5.43,.24],
    [-3.88,-6.47,.32],[4.01,-6.68,.36],[-2.23,-9.42,.38],[-2.63,-8.93,.30],
    [2.47,-8.71,.34],[1.97,-9.91,.33],[-2.31,-10.61,.39],
    [-7.42,-2.66,.42],[7.46,-2.62,.40],[-7.05,-4.58,.38],[7.10,-4.52,.36],
  ].map(([x, z, s]): [number, number, number] => [x * WIDE, z, s]);
  const leaves: THREE.BufferGeometry[] = [];
  plants.forEach(([x, z, s], i) => {
    for (let j = 0; j < 4; j++) {
      const angle = j * 2.4 + i, r = j === 0 ? 0 : s * 0.43;
      const xx = x + r * Math.cos(angle), zz = z + r * Math.sin(angle);
      ray.ray.origin.set(xx, 10, zz);
      const hit = ray.intersectObject(cliff, false)[0];
      if (!hit) continue;
      const h = s * (j === 0 ? 0.86 : 0.48);
      leaves.push(colored(new THREE.IcosahedronGeometry(1, 1), foliage[(i + j) % 4], foliage[(i + j + 1) % 4], -0.1)
        .scale(s * 0.72, h, s * 0.60).translate(xx, hit.point.y + h * 0.45, zz));
    }
  });
  const shrubs = new THREE.Mesh(batch(leaves), material);
  shrubs.name = 'ban-gioc-island-foliage';
  shrubs.receiveShadow = true;
  group.add(shrubs);

  const karst = new THREE.Mesh(batch(([
    [-4.46, 3.5, -11.45, 3.27, 8.25, 3.85],
    [-0.63, 3.7, -13.75, 3.68, 9.75, 3.70],
    [3.75, 3.65, -11.65, 3.18, 7.62, 3.84],
    [8.1, 3.55, -12.4, 3.4, 8.1, 3.75],
  ] satisfies Rock[]).map((r, i) => boulder(r, i + 9, foliage[i + 1], stone[0], -0.85))), material);
  karst.name = 'ban-gioc-karst';
  group.add(karst);

  const time = { value: 0 };
  const flow = (foam: boolean) => new THREE.ShaderMaterial({
    uniforms: { time, ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog) }, fog: true,
    side: THREE.DoubleSide, transparent: true, depthWrite: false, forceSinglePass: true,
    vertexShader: `varying vec2 vUv;
      #include <fog_pars_vertex>
      void main() { vUv=uv; vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
        gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform float time; varying vec2 vUv;
      #include <fog_pars_fragment>
      void main() {
        ${foam ? `vec2 p=(vUv-.5)*2.; float r=length(p);
        float rip=pow(.5+.5*cos(38.*r+1.3*sin(8.*p.x)-time*7.),4.);
        float flecks=.5+.5*sin(50.*p.x+2.*sin(23.*p.y+time*4.));
        float alpha=(.20+.38*rip+.20*flecks)*(1.-smoothstep(.18,1.,r));
        gl_FragColor=vec4(.77,.95,.97,alpha);` : `float x=vUv.x, y=vUv.y;
        float streak=.5+.5*sin(83.*x+sin(26.*x+y*16.+time*2.)+1.25*sin(38.*x));
        float bands=.5+.5*sin(53.*y-time*12.+sin(x*50.)*2.7);
        float ribbons=.5+.5*sin(21.*x+sin(7.*y-time*1.8));
        float spray=smoothstep(.72,1.,y);
        vec3 water=mix(vec3(.11,.54,.56),vec3(.94,1.,1.),.18+.25*streak+.17*bands+.21*ribbons+.17*spray);
        float edge=smoothstep(0.,.12,x)*smoothstep(0.,.12,1.-x);
        gl_FragColor=vec4(water,edge*(.58+.33*streak+.07*spray));`}
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const curtain = (cx: number, w: number, crest: number, base: number, rear: number, impact: number, shift = 0, endWidth = w * 1.08) => {
    const g = new THREE.PlaneGeometry(1, 1, 17, 18);
    const p = g.getAttribute('position'), uv = g.getAttribute('uv');
    for (let i = 0; i < p.count; i++) {
      const u = uv.getX(i), v = 1 - uv.getY(i);
      const x = cx + shift * v ** 1.6 + (u - 0.5) * THREE.MathUtils.lerp(w, endWidth, v);
      const y = THREE.MathUtils.lerp(crest, base, v ** 1.82) + (1 - v) * Math.sin(u * 11) * 0.035;
      const z = THREE.MathUtils.lerp(rear, impact, v ** 0.84) + Math.sin(u * 14 + v * 3) * 0.057;
      p.setXYZ(i, x, y, z);
      uv.setY(i, v);
    }
    return g;
  };
  // Three tiers widen with the new 16 m crest: 3 / 4 / 6 sheets, outer inlets barely arcing
  // inwards because the source basin is now 11 m wide instead of the old four-metre channel.
  const w = WIDE;
  const curtains = new THREE.Mesh(batch([
    curtain(-2.35 * w, 2.40 * w, 8.55, 5.06, -8.62, -7.22, -.36),
    curtain(.02 * w, 1.90 * w, 8.54, 5.06, -8.67, -7.15, .10),
    curtain(2.37 * w, 2.40 * w, 8.55, 5.06, -8.60, -7.20, .34),
    curtain(-4.05 * w, 2.30 * w, 5.06, 2.24, -5.39, -3.79, -.28),
    curtain(-1.35 * w, 2.10 * w, 5.07, 2.24, -5.36, -3.53, -.08),
    curtain(1.36 * w, 2.10 * w, 5.05, 2.24, -5.34, -3.60, .08),
    curtain(4.06 * w, 2.30 * w, 5.05, 2.24, -5.25, -3.75, .26),
    // Six outlets; only the two outermost lean inwards, and gently, into the wide basin.
    curtain(-5.55 * w, 2.00 * w, 2.25, 0.003, -2.73, .46, 1.40 * w, .90 * w),
    curtain(-3.35 * w, 1.95 * w, 2.23, 0.003, -2.73, .64, .70 * w, .92 * w),
    curtain(-1.12 * w, 1.90 * w, 2.23, 0.003, -2.89, .60, .22 * w, .90 * w),
    curtain(1.12 * w, 1.90 * w, 2.24, 0.003, -2.86, .58, -.22 * w, .90 * w),
    curtain(3.36 * w, 1.95 * w, 2.24, 0.003, -2.74, .55, -.70 * w, .92 * w),
    curtain(5.55 * w, 2.00 * w, 2.24, 0.003, -2.74, .43, -1.40 * w, .90 * w),
  ]), flow(false));
  curtains.name = 'ban-gioc-thirteen-curtains';
  curtains.renderOrder = 2;
  group.add(curtains);

  const pool = (x: number, y: number, z: number, rx: number, rz: number) => {
    const g = new THREE.CircleGeometry(1, 46).rotateX(-Math.PI / 2);
    const p = g.getAttribute('position');
    for (let i = 1; i < p.count; i++) {
      const a = Math.atan2(p.getZ(i), p.getX(i)), n = 1 + 0.045 * Math.sin(a * 5) + 0.035 * Math.sin(a * 3 + 1);
      p.setXYZ(i, p.getX(i) * n, 0, p.getZ(i) * n);
    }
    return g.scale(rx, 1, rz).translate(x, y, z);
  };
  const pools = new THREE.Mesh(batch([
    pool(-.12, 8.53, -9.43, 1.72, 1.09), pool(0, 5.035, -6.54, 6.5, 1.45), pool(-.11, 2.21, -3.64, 6.5, 1.22),
  ]), new THREE.MeshStandardMaterial({ color: 0x35a0a8, emissive: 0x10585a, emissiveIntensity: .29,
    roughness: .24, transparent: true, opacity: .9, depthWrite: false }));
  pools.name = 'ban-gioc-jade-pools';
  pools.renderOrder = 1;
  group.add(pools);

  const foam = new THREE.Mesh(batch(([
    [6.8, 1.09, 5.068, -7.03], [13.2, 1.25, 2.245, -3.69], [6.2, 2.24, 0.015, 1.16],
  ]).map(([w2, d, y, z]) => new THREE.PlaneGeometry(w2, d).rotateX(-Math.PI / 2).translate(0, y, z))), flow(true));
  foam.name = 'ban-gioc-three-foam-sheets';
  foam.renderOrder = 3;
  group.add(foam);

  // Fish stay just under the water surface and follow the S-curve centre line each frame, so
  // they never drift onto the banks where the river now swings east.
  const fin = new THREE.BufferGeometry();
  fin.setAttribute('position', new THREE.Float32BufferAttribute([
    0,0,-.14, -.093,0,-.31, .093,0,-.31,
    -.069,0,-.065, -.134,0,-.12, -.061,0,.061,
    .069,0,-.065, .061,0,.061, .134,0,-.12,
  ], 3));
  fin.computeVertexNormals();
  fin.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(18), 2));
  const fishBody = new THREE.SphereGeometry(1, 8, 5).scale(.084,.021,.19);
  const fishGeo = batch([fishBody.toNonIndexed(), fin]);
  fishBody.dispose();
  const school = new THREE.InstancedMesh(fishGeo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), 7);
  school.name = 'east-river-fish';
  school.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 42), 45);
  group.add(school);
  const tones = [0xffaa4d, 0xffcf83, 0xf2edbe, 0xe48243, 0xffbe62, 0xf7e1a2, 0xec9953];
  tones.forEach((hex, i) => school.setColorAt(i, new THREE.Color(hex)));
  const dummy = new THREE.Object3D();
  const lanes = [5.8, 7.1, 8.3, 26, 48, 72, 79];
  const update = (t: number) => {
    time.value = t;
    for (let i = 0; i < lanes.length; i++) {
      const a = t * (.51 + i * .037) + i * 2.492;
      const localZ = lanes[i] + (2.7 + i * .17) * Math.cos(a);
      const worldZ = RIVER_FALLS.z + localZ;
      const center = riverAt(worldZ);
      // Stay a body-length inside the bank so the school never beaches on the S-curve.
      const sway = Math.max(-1, Math.min(1, 1.22 / Math.max(0.6, center.hw - 0.5))) * 1.22 * Math.sin(a);
      const dx = 1.22 * Math.cos(a), dz = -(2.7 + i * .17) * Math.sin(a);
      dummy.position.set(center.x - RIVER_FALLS.x + sway, -.032 + .004 * Math.sin(a * 2), localZ);
      dummy.rotation.y = Math.atan2(dx, dz) + .145 * Math.sin(t * 12 + i);
      dummy.scale.setScalar(.90 + (i % 3) * .12);
      dummy.updateMatrix();
      school.setMatrixAt(i, dummy.matrix);
    }
    school.instanceMatrix.needsUpdate = true;
  };
  school.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  update(0);
  return { group, update };
}
