import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, vig: { value: 0.32 }, warm: { value: 0.05 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vig; uniform float warm; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5; float v = smoothstep(0.85, 0.2, length(d) * 1.25);
      c.rgb *= mix(1.0 - vig, 1.0, v);
      c.rgb = mix(c.rgb, c.rgb * vec3(1.04, 1.0, 0.94), warm * 4.0);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114)); c.rgb = mix(vec3(l), c.rgb, 1.12);
      gl_FragColor = c; }`,
};

export interface Post { render(): void; resize(w: number, h: number): void; bloom: UnrealBloomPass; enabled: boolean }

/** Bloom + warm grade + vignette. Falls back to direct render when disabled. */
export function createPost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, lite: boolean): Post {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const size = renderer.getSize(new THREE.Vector2());
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), lite ? 0.35 : 0.5, 0.65, 0.88);
  let composer: EffectComposer | null = null;
  const ensure = (): EffectComposer => {
    if (composer) return composer;
    const s = renderer.getSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(s.x, s.y, { type: THREE.HalfFloatType, samples: lite ? 0 : 4 });
    composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    composer.addPass(new ShaderPass(GradeShader));
    return composer;
  };

  const post: Post = {
    enabled: true, bloom,
    render() { if (!post.enabled) { renderer.render(scene, camera); return; } ensure().render(); },
    resize(w, h) { if (!composer) return; composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); },
  };
  return post;
}
