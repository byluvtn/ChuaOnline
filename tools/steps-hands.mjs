export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`(()=>{
    const co = window.__co, T = co.THREE;
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:99999';
    document.body.appendChild(cv);
    const r = new T.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(2); r.toneMapping = T.ACESFilmicToneMapping;
    const sc = new T.Scene(); sc.background = new T.Color(0xf6efdf);
    sc.add(new T.HemisphereLight(0xffffff, 0x887766, 1.6));
    const dl = new T.DirectionalLight(0xffffff, 1.4); dl.position.set(2, 4, 4); sc.add(dl);
    const rim = new T.DirectionalLight(0xffcf8a, 1.2); rim.position.set(-3, 3, -3); sc.add(rim);
    const cam = new T.PerspectiveCamera(14, 1, 0.1, 60);
    window.__d = { r, sc, cam, ch: null };
    window.__show = (outfit, e, yaw, ty, tz, camY, camZ, fov) => {
      const d = window.__d;
      if (d.ch) d.sc.remove(d.ch.root);
      const ch = co.build(outfit); ch.label.visible = false; d.sc.add(ch.root); d.ch = ch;
      ch.root.rotation.y = yaw;
      co.anim(ch, 'idle', 99);
      for (let s = 0; s <= e + 1e-6; s += 0.05) co.anim(ch, 'bow', 100 + s);
      const w = innerWidth, h = innerHeight; d.r.setSize(w, h, false);
      d.cam.fov = fov; d.cam.aspect = w / h; d.cam.updateProjectionMatrix();
      d.cam.position.set(0, camY, camZ); d.cam.lookAt(0, ty, tz);
      d.r.render(d.sc, d.cam);
    };
  })()`);
  // standing: close-up on hands beside the body
  await ev(`window.__show('male', -100, 0, 0.65, 0, 0.85, 6, 16)`);
  await sleep(250); await shot('male-stand-hands');
  // standing face close-up for colour reference
  await ev(`(()=>{const d=window.__d; d.cam.position.set(0,1.72,5.2); d.cam.fov=16; d.cam.updateProjectionMatrix(); d.cam.lookAt(0,1.62,0); d.r.render(d.sc,d.cam);})()`);
  await sleep(250); await shot('male-stand-face');
  // bow close-up on joined palms
  await ev(`window.__show('male', 1.7, 0.9, 0.42, 0.5, 1.2, 5.0, 16)`);
  await sleep(250); await shot('male-bow-hands');
  await ev(`window.__show('female', -100, 0, 0.65, 0, 0.85, 6, 16)`);
  await sleep(250); await shot('female-stand-hands');
};
