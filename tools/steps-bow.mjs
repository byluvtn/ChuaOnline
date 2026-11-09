export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`(()=>{
    const co = window.__co, T = co.THREE;
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:99999';
    document.body.appendChild(cv);
    const r = new T.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.toneMapping = T.ACESFilmicToneMapping;
    const sc = new T.Scene(); sc.background = new T.Color(0xf6efdf);
    sc.add(new T.HemisphereLight(0xffffff, 0x887766, 1.6));
    const dl = new T.DirectionalLight(0xffffff, 1.4); dl.position.set(2, 4, 4); sc.add(dl);
    const rim = new T.DirectionalLight(0xffcf8a, 1.2); rim.position.set(-3, 3, -3); sc.add(rim);
    const g = new T.GridHelper(8, 16, 0xb08968, 0xd8c6ae); sc.add(g);
    const fl = new T.Mesh(new T.PlaneGeometry(8, 8), new T.MeshBasicMaterial({ color: 0xefe3cd }));
    fl.rotation.x = -Math.PI / 2; fl.position.y = -0.002; sc.add(fl);
    const cam = new T.PerspectiveCamera(16, 1, 0.1, 60);
    window.__d = { r, sc, cam, ch: null, T };
    window.__show = (outfit, e, yaw, camY, camZ, lookY) => {
      const d = window.__d, T = d.T;
      if (d.ch) d.sc.remove(d.ch.root);
      const ch = co.build(outfit); ch.label.visible = false; d.sc.add(ch.root); d.ch = ch;
      ch.root.rotation.y = yaw;
      co.anim(ch, 'idle', 99);
      for (let s = 0; s <= e + 1e-6; s += 0.05) co.anim(ch, 'bow', 100 + s);
      ch.root.updateMatrixWorld(true);
      const w = innerWidth, h = innerHeight; d.r.setSize(w, h, false);
      d.cam.fov = 16; d.cam.aspect = w / h; d.cam.updateProjectionMatrix();
      d.cam.position.set(0, camY, camZ); d.cam.lookAt(0, lookY, 0.2);
      d.r.render(d.sc, d.cam);
      const box = new T.Box3().setFromObject(ch.root);
      const handW = new T.Vector3(); ch.foreR.children[2] ? 0 : 0;
      const hp = new T.Vector3(0, 0, 0).applyMatrix4(ch.foreR.matrixWorld);
      return { minY: +box.min.y.toFixed(3), maxY: +box.max.y.toFixed(3), minZ: +box.min.z.toFixed(3), maxZ: +box.max.z.toFixed(3),
               foreRWorld: [ +hp.x.toFixed(3), +hp.y.toFixed(3), +hp.z.toFixed(3) ] };
    };
  })()`);
  for (const outfit of ['male', 'female']) {
    for (const [e, tag] of [[0.0, 'start'], [1.3, 'mid'], [1.7, 'deep']]) {
      const info = await ev(`window.__show('${outfit}', ${e}, ${Math.PI/2}, 1.6, 19, 0.75)`);
      console.log(outfit, tag, JSON.stringify(info));
      await sleep(200); await shot(`${outfit}-${tag}-side`);
    }
    await ev(`window.__show('${outfit}', 1.7, 0.7, 1.7, 19, 0.75)`);
    await sleep(200); await shot(`${outfit}-deep-3q`);
  }
};
