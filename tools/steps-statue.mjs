export default async ({ ev, shot, sleep }) => {
  await sleep(1200);
  await ev(`(()=>{
    const T = window.__co.THREE, co = window.__co;
    const cv = document.createElement('canvas');
    cv.style.cssText='position:fixed;inset:0;z-index:99999;width:100%;height:100%';
    document.body.appendChild(cv);
    const r = new T.WebGLRenderer({canvas:cv, antialias:true, preserveDrawingBuffer:true});
    r.setPixelRatio(1); r.toneMapping=T.ACESFilmicToneMapping;
    r.shadowMap.enabled = true;
    const sc = new T.Scene(); sc.background = new T.Color(0xf6efdf);
    sc.add(new T.HemisphereLight(0xffffff, 0x887766, 1.5));
    const dl = new T.DirectionalLight(0xffffff, 1.5); dl.position.set(3,6,6); sc.add(dl);
    const fl = new T.Mesh(new T.PlaneGeometry(40,40), new T.MeshStandardMaterial({color:0xefe3cd, roughness:0.9}));
    fl.rotation.x = -Math.PI/2; fl.position.y = -0.01; fl.receiveShadow = true; sc.add(fl);
    const cam = new T.PerspectiveCamera(20, 1, 0.1, 200);
    window.__sv = { r, sc, cam, T, cur: null };
    window.__show = (kind, yawDeg, pad, faceOnly) => {
      const d = window.__sv, T = d.T;
      if (d.cur) d.sc.remove(d.cur);
      d.cur = kind === 'buddha' ? co.buildBuddha() : co.buildQuanAm();
      d.cur.rotation.y = yawDeg * Math.PI / 180;
      d.sc.add(d.cur); d.cur.updateMatrixWorld(true);
      let box;
      if (faceOnly) {
        const head = d.cur.getObjectByName('head');
        const p = head.getWorldPosition(new T.Vector3());
        box = new T.Box3(p.clone().addScalar(-0.85), p.clone().addScalar(0.85));
      } else box = new T.Box3().setFromObject(d.cur);
      const c = box.getCenter(new T.Vector3()), s = box.getSize(new T.Vector3());
      const w = innerWidth, h = innerHeight;
      d.r.setSize(w, h, false); d.cam.aspect = w/h; d.cam.updateProjectionMatrix();
      const fov = d.cam.fov * Math.PI/180;
      const need = Math.max(s.y, s.x / d.cam.aspect) * (1 + pad) / (2 * Math.tan(fov/2));
      d.cam.position.set(0, c.y, c.z + need);
      d.cam.lookAt(0, c.y, c.z);
      d.r.render(d.sc, d.cam);
      return { h:+s.y.toFixed(2), w:+s.x.toFixed(2), d:+need.toFixed(1) };
    };
  })()`);
  const views = [
    ['q-full', 'guanyin', 0, 0.06, false], ['q-side', 'guanyin', 90, 0.06, false], ['q-3q', 'guanyin', 35, 0.06, false], ['q-face', 'guanyin', 0, 0.02, true],
    ['b-full', 'buddha', 0, 0.06, false], ['b-side', 'buddha', 90, 0.06, false], ['b-3q', 'buddha', 35, 0.06, false], ['b-face', 'buddha', 0, 0.02, true],
  ];
  for (const [label, kind, yaw, pad, face] of views) {
    console.log(label, JSON.stringify(await ev(`window.__show('${kind}', ${yaw}, ${pad}, ${face})`)));
    await sleep(250); await shot(label);
  }
};
