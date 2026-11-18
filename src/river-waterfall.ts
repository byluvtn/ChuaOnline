import * as THREE from 'three';
import { RIVER } from '../shared/campus';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function buildRiverWaterfall() {
  const group = new THREE.Group();
  group.name = 'east-river-waterfall';
  group.position.set(RIVER.x, 0.062, RIVER.z0);
  const rocks: [number, number, number, number, number, number][] = [
    [0, 2.15, -2.6, 1.96, 2.78, 1.67], [-1.64, 1.5, -2.35, 1.16, 2.0, 1.4],
    [1.31, 1.8, -2.45, 1.26, 2.4, 1.2], [-2.39, 0.46, -1.77, 0.9, 0.86, 1.08],
    [2.32, 0.61, -1.72, 0.87, 0.95, 1.16], [-1.27, 2.82, -2.03, 1.12, 0.49, 0.78],
    [0.82, 3.93, -2.34, 1.0, 0.69, 0.82], [-0.60, 4.28, -2.65, 1.02, 0.61, 0.83],
    [-1.65, 0.17, 0.24, 0.53, 0.42, 0.79], [1.54, 0.18, 0.38, 0.56, 0.45, 0.63],
  ];
  const rockParts = rocks.map(([x, y, z, w, h, d], i) => {
    const g = new THREE.IcosahedronGeometry(1, 1).scale(w, h, d).rotateY(i * 0.81).rotateZ(Math.sin(i * 9) * 0.19).translate(x, y, z);
    const col = new THREE.Color([0x5c6761, 0x71756c, 0x7c8074, 0x77796e][i % 4]);
    const colors: number[] = [];
    const p = g.getAttribute('position');
    for (let j = 0; j < p.count; j++) {
      const moss = THREE.MathUtils.smoothstep(p.getY(j) - y, h * 0.56, h);
      colors.push(...col.clone().lerp(new THREE.Color(0x657844), moss * 0.82).toArray());
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return g;
  });
  const rock = new THREE.Mesh(mergeGeometries(rockParts)!, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, flatShading: true }));
  rock.castShadow = rock.receiveShadow = true;
  group.add(rock);
  rockParts.forEach(g => g.dispose());

  const time = { value: 0 };
  const flow = (foam: boolean) => new THREE.ShaderMaterial({
    uniforms: { time, ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog) }, fog: true,
    side: THREE.DoubleSide, transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vUv;
      #include <fog_pars_vertex>
      void main() { vUv=uv; vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
        gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform float time; varying vec2 vUv;
      #include <fog_pars_fragment>
      void main() {
        ${foam ? `vec2 p=(vUv-.5)*2.; float r=length(p), a=atan(p.y,p.x);
        float rip=pow(.5+.5*cos(46.*r+1.7*sin(a*6.)-time*11.),5.);
        float alpha=(.23+.38*rip)*(1.-smoothstep(.25,1.,r));
        gl_FragColor=vec4(.72,.91,.96,alpha);` : `float x=vUv.x, y=vUv.y;
        float streak=.5+.5*sin(89.*x+sin(28.*x+y*17.+time*3.)*.8);
        float bands=.5+.5*sin(61.*y-time*16.+sin(x*51.)*2.2);
        float spray=smoothstep(.74,1.,y);
        vec3 water=mix(vec3(.15,.52,.62),vec3(.91,.99,1.), .28+.28*streak+.14*bands+.24*spray);
        float edge=smoothstep(0.,.07,x)*smoothstep(0.,.07,1.-x);
        gl_FragColor=vec4(water,edge*(.62+.26*streak));`}
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const water = flow(false);
  const curtain = (cx: number, w: number, crest: number, rear: number, impact: number) => {
    const g = new THREE.PlaneGeometry(1, 1, 22, 24);
    const p = g.getAttribute('position'), uv = g.getAttribute('uv');
    for (let i = 0; i < p.count; i++) {
      const u = uv.getX(i), v = 1 - uv.getY(i);
      const x = cx + (u - 0.5) * w * (0.8 + v * 0.34);
      p.setXYZ(i, x, crest * (1 - v ** 1.43) + 0.045, THREE.MathUtils.lerp(rear, impact, Math.sin(v * Math.PI / 2))
        + Math.sin(u * 21 + v * 3) * 0.063);
      uv.setY(i, v);
    }
    group.add(new THREE.Mesh(g, water));
  };
  curtain(-0.48, 1.43, 4.15, -1.91, 0.98);
  curtain(0.74, 0.91, 3.54, -1.57, 0.83);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(3.55, 4.05), flow(true));
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(0, 0.027, 1.26);
  group.add(foam);

  return { group, update: (t: number) => { time.value = t; } };
}
