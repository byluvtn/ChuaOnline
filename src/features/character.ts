import * as THREE from 'three';
import { OUTFIT_COLOR, OUTFIT_LABEL, type Outfit } from '../../shared/types';
import { animateCharacter, buildCharacter, type Character } from '../character';
import { h, openCustomPanel, closePanel } from '../panels';
import type { MenuCtx } from '../menu';

export const COLORS = ['#d9a62b', '#778c96', '#72818e', '#bc7672', '#c0561f', '#e8821e', '#7a6130', '#5b6377', '#2f5aa8', '#a3343f', '#3b8a52', '#c27d1e', '#7a3f8f', '#e3b341', '#d99a1e', '#8fb0c4', '#5a3a22', '#6f93b5'];
const OUTFITS = (['monk', 'nun', 'male', 'female'] as Outfit[]).map((o) => [o, OUTFIT_LABEL[o]] as [Outfit, string]);

export function openCharacter(ctx: MenuCtx) {
  openCustomPanel('Nhân vật', (body) => {
    const p = ctx.profile();
    let outfit: Outfit = p?.outfit ?? 'monk';
    let color = p?.color ?? '#d99a1e';
    const name = h('input', { maxlength: 24, value: p?.name ?? '', 'aria-label': 'Pháp danh', autocomplete: 'off' });
    name.value = p?.name ?? '';

    const cv = h('canvas', { class: 'cprev', width: 300, height: 220, 'aria-hidden': 'true' });
    let renderer: THREE.WebGLRenderer | null = null;
    let raf = 0, ch: Character | null = null;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, 300 / 220, 0.1, 50);
    cam.position.set(0, 1.4, 5.5); cam.lookAt(0, 1.12, 0);
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(300, 220, false);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      scene.add(new THREE.HemisphereLight(0xffffff, 0x887766, 1.6));
      const l = new THREE.DirectionalLight(0xffffff, 1.4); l.position.set(2, 4, 4); scene.add(l);
      const rim = new THREE.DirectionalLight(0xffcf8a, 1.2); rim.position.set(-3, 3, -3); scene.add(rim);
    } catch { renderer = null; cv.hidden = true; }
    const rebuild = () => {
      if (!renderer) return;
      if (ch) scene.remove(ch.root);
      ch = buildCharacter(outfit, color, '');
      ch.label.visible = false;
      ch.setAccessory(ctx.profile()?.accessory ?? null);
      scene.add(ch.root);
    };
    const loop = (t = 0) => {
      raf = requestAnimationFrame(loop);
      if (ch && renderer) { ch.root.rotation.y = Math.sin(t / 1000) * 0.5; animateCharacter(ch, 'idle', t / 1000); renderer.render(scene, cam); }
    };
    if (renderer) { rebuild(); loop(); }

    const outBar = h('div', { class: 'tabs' });
    const sw = h('div', { class: 'colors' });
    const draw = () => {
      outBar.replaceChildren(...OUTFITS.map(([o, label]) => h('button', { class: o === outfit ? 'on' : '', onclick: () => { outfit = o; color = OUTFIT_COLOR[o]; draw(); rebuild(); } }, label)));
      sw.replaceChildren(...COLORS.map((c) => {
        const b = h('button', { class: c === color ? 'on' : '', 'aria-label': `Màu ${c}`, onclick: () => { color = c; draw(); rebuild(); } });
        b.style.background = c;
        return b;
      }));
    };
    draw();
    body.append(cv, outBar, h('label', { class: 'lbl' }, 'MÀU ÁO'), sw, h('label', { class: 'lbl', for: 'cname' }, 'PHÁP DANH'), name,
      h('button', { class: 'gold', onclick: () => {
        const n = name.value.replace(/[<>]/g, '').trim().slice(0, 24);
        if (!n) return ctx.toast('Vui lòng nhập pháp danh');
        ctx.changeLook(n, outfit, color);
        ctx.toast('Đã lưu nhân vật');
        closePanel();
      } }, 'Lưu'));
    name.id = 'cname';
    return () => {
      cancelAnimationFrame(raf);
      if (ch) scene.remove(ch.root);
      renderer?.dispose();
      renderer?.forceContextLoss();
    };
  });
}
