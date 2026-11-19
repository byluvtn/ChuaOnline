import * as THREE from 'three';

export function createSkyDome() {
  const uniforms = {
    horizon: { value: new THREE.Color() }, zenith: { value: new THREE.Color() },
    lightDir: { value: new THREE.Vector3() }, lightColor: { value: new THREE.Color() },
    moonDir: { value: new THREE.Vector3(-18, 26, -36).normalize() },
    night: { value: 0 }, time: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms,
    vertexShader: `
      varying vec3 ray;
      void main() {
        ray = position;
        vec4 clip = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
        gl_Position = clip.xyww;
      }`,
    fragmentShader: `
      uniform vec3 horizon, zenith, lightDir, lightColor, moonDir;
      uniform float night, time;
      varying vec3 ray;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
      }
      float cloudNoise(vec2 p) {
        return 0.55 * noise(p) + 0.27 * noise(p * 2.05 + 4.2)
             + 0.12 * noise(p * 4.13 - 2.0) + 0.06 * noise(p * 8.32 + 1.2);
      }
      float crater(vec2 p, vec2 center, float r) {
        float d = length(p - center) / r;
        float rim = (d - 0.95) * 9.0;
        return -0.20 * (1.0 - smoothstep(0.55, 1.0, d)) + 0.09 * exp(-rim * rim);
      }
      vec3 stars(vec2 coord, float columns, float rows, float chance, float radiusScale) {
        vec2 p = coord * vec2(columns, rows), id = floor(p);
        id.x = mod(id.x, columns);
        float seed = hash(id + 26.7);
        vec2 center = 0.28 + 0.44 * vec2(hash(id + 8.4), hash(id - 14.7));
        vec2 delta = fract(p) - center;
        delta.x *= max(0.25, cos(coord.y * 1.5707963)) * 1.27;
        float size = (0.021 + 0.047 * pow(seed, 5.0)) * radiusScale;
        float r = length(delta), aa = max(fwidth(r) * 0.5, 0.008);
        float core = 1.0 - smoothstep(max(0.0, size - aa), size + aa, r);
        float glow = 0.18 * (1.0 - smoothstep(size, size * 3.3, r));
        float flicker = 0.86 + 0.14 * sin(time * (0.65 + seed) + seed * 120.0);
        return mix(vec3(0.62,0.76,1.0), vec3(1.0,0.87,0.66), hash(id + 3.1))
             * (core + glow) * flicker * step(chance, seed) * (0.18 + 0.48 * seed);
      }

      void main() {
        vec3 dir = normalize(ray);
        float h = clamp(dir.y, 0.0, 1.0);
        vec3 c = mix(horizon, zenith, pow(h, 0.43));
        float dayDot = max(dot(dir, lightDir), 0.0);
        c += lightColor * (pow(dayDot, 76.0) * 0.65 + pow(dayDot, 8.0) * 0.13) * (1.0 - night);
        if (night > 0.001 && dir.y > 0.0) {
          vec2 coord = vec2(atan(dir.z, dir.x) / 6.2831853 + 0.5, asin(h) / 1.5707963);
          c += (stars(coord, 156.0, 62.0, 0.77, 1.08) + stars(coord + vec2(0.143, 0.0), 89.0, 36.0, 0.965, 1.75))
               * night * smoothstep(0.025, 0.18, h);
          float angle = length(dir - moonDir);
          float moon = min(1.0, night / 0.78);
          c += vec3(0.16, 0.27, 0.58) * moon * (0.24 * exp(-angle * 13.0) + 0.21 * exp(-angle * 42.0));
          if (angle < 0.046) {
            vec3 right = normalize(cross(vec3(0,1,0), moonDir)), skyUp = cross(moonDir, right);
            vec2 p = vec2(dot(dir, right), dot(dir, skyUp)) / 0.039;
            float disc = 1.0 - smoothstep(0.978, 1.022, length(p));
            float maria = smoothstep(0.45, 0.71, cloudNoise(p * 3.1 + vec2(4.0, 7.0)));
            float light = 0.88 - 0.41 * maria + 0.17 * noise(p * 22.0);
            light += crater(p, vec2(-0.26, -0.43), 0.22) + crater(p, vec2(0.36, 0.18), 0.26)
                   + crater(p, vec2(-0.45, 0.31), 0.29) + crater(p, vec2(0.12, -0.62), 0.13);
            light *= 0.65 + 0.35 * sqrt(max(0.0, 1.0 - dot(p,p)));
            c = mix(c, vec3(1.24, 1.18, 1.05) * light, moon * disc);
          }
        }
        if (dir.y > 0.045) {
          vec2 p = dir.xz / (0.29 + h) * vec2(3.0, 4.8);
          p += vec2(time * 0.020, time * 0.0035);
          float wisps = cloudNoise(p * vec2(1.24, 1.85) + vec2(7.2, 2.5));
          float mass = cloudNoise(p);
          float cover = smoothstep(0.51, 0.69, mass) * 0.76 + smoothstep(0.60, 0.77, wisps) * 0.18;
          float lit = 1.0 - smoothstep(0.5, 0.73, cloudNoise(p + vec2(0.08, -0.13)));
          float moonlight = pow(max(dot(dir, moonDir), 0.0), 15.0);
          vec3 cloudDay = mix(vec3(0.47, 0.57, 0.72), vec3(0.96, 0.96, 0.95), lit);
          vec3 cloudNight = mix(vec3(0.010, 0.016, 0.040), vec3(0.047, 0.070, 0.13), lit)
                          + moonlight * lit * vec3(0.12, 0.18, 0.31);
          c = mix(c, mix(cloudDay, cloudNight, night), cover * smoothstep(0.045, 0.23, h));
        }
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), material);
  mesh.name = 'celestial-sky-dome';
  mesh.frustumCulled = false;
  mesh.renderOrder = -100;
  return { mesh, uniforms };
}
