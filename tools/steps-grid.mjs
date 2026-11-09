// Renders a contact sheet of pose parameter combinations for visual comparison.
export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  const setup = [
    "(()=>{",
    "const co = window.__co, T = co.THREE;",
    "if (window.__old) window.__old.remove();",
    "const cv = document.createElement('canvas');",
    "cv.style.cssText = 'position:fixed;inset:0;z-index:99999';",
    "document.body.appendChild(cv); window.__old = cv;",
    "const r = new T.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });",
    "r.setPixelRatio(1); r.toneMapping = T.ACESFilmicToneMapping;",
    "const sc = new T.Scene(); sc.background = new T.Color(0xf6efdf);",
    "sc.add(new T.HemisphereLight(0xffffff, 0x887766, 1.6));",
    "const dl = new T.DirectionalLight(0xffffff, 1.4); dl.position.set(2, 4, 4); sc.add(dl);",
    "const rim2 = new T.DirectionalLight(0xffcf8a, 1.2); rim2.position.set(-3, 3, -3); sc.add(rim2);",
    "sc.add(new T.GridHelper(8, 16, 0xb08968, 0xd8c6ae));",
    "const fl = new T.Mesh(new T.PlaneGeometry(8, 8), new T.MeshBasicMaterial({ color: 0xefe3cd, side: T.DoubleSide }));",
    "fl.rotation.x = -Math.PI / 2; fl.position.y = -0.002; sc.add(fl);",
    "const cam = new T.PerspectiveCamera(16, 1, 0.1, 60);",
    "window.__r = r; window.__sc = sc; window.__cam = cam; window.__T = T; window.__co2 = co;",
    "window.__grid = (outfit, combos) => {",
    "  const T = window.__T, r = window.__r, sc = window.__sc, cam = window.__cam, co = window.__co2;",
    "  const cols = 3, rows = Math.ceil(combos.length / 3);",
    "  if (window.__sheet) window.__sheet.remove();",
    "  const out = document.createElement('canvas');",
    "  out.width = 480 * cols; out.height = 480 * rows;",
    "  out.style.cssText = 'position:fixed;inset:0;z-index:100000;background:#111';",
    "  document.body.appendChild(out); window.__sheet = out;",
    "  const g2 = out.getContext('2d');",
    "  r.setSize(480, 480, false);",
    "  cam.aspect = 1; cam.fov = 17; cam.updateProjectionMatrix();",
    "  cam.position.set(0, 1.15, 13); cam.lookAt(0, 0.72, 0.28);",
    "  combos.forEach((c, i) => {",
    "    if (window.__ch) sc.remove(window.__ch.root);",
    "    const ch = co.build(outfit); ch.label.visible = false; sc.add(ch.root); window.__ch = ch;",
    "    ch.root.rotation.y = Math.PI / 2;",
    "    co.anim(ch, 'idle', 99);",
    "    for (let s = 0; s <= 2.4; s += 0.05) co.anim(ch, 'bow', 100 + s);",
    "    const th = c.th, hy = c.hy;",
    "    ch.body.rotation.x = th;",
    "    ch.body.position.set(0, hy - 0.45 * Math.cos(th), -0.45 * Math.sin(th));",
    "    ch.legL.position.set(-0.16, c.legY, c.legZ); ch.legR.position.set(0.16, c.legY, c.legZ);",
    "    ch.legL.rotation.x = ch.legR.rotation.x = -th * (c.tK === undefined ? 1 : c.tK);",
    "    ch.root.updateMatrixWorld(true);",
    "    r.render(sc, cam);",
    "    g2.drawImage(r.domElement, (i % 3) * 480, Math.floor(i / 3) * 480);",
    "    g2.fillStyle = '#ffe9ad'; g2.font = '22px monospace';",
    "    g2.fillText('th=' + th + ' hy=' + hy + ' legY=' + c.legY + ' legZ=' + c.legZ + ' tK=' + (c.tK === undefined ? 1 : c.tK), (i % 3) * 480 + 12, Math.floor(i / 3) * 480 + 30);",
    "  });",
    "};",
    "})()",
  ].join('\n');
  await ev(setup);

  const HIP = 0.45, HEMF = 0.205, HEMZ = 0.37;
  const solveHy = (th) => 0.005 + (HIP - HEMF) * Math.cos(th) - HEMZ * Math.sin(th);
  const combos = [];
  for (const th of [0.2, 0.35, 0.5]) combos.push({ th, hy: +solveHy(th).toFixed(3), legY: 0.14, legZ: -0.10 });
  await ev("window.__grid('male', " + JSON.stringify(combos) + ")");
  await sleep(400);
  await shot('grid-a');

  const combos2 = [];
  for (const th of [0.35, 0.5, 0.65]) combos2.push({ th, hy: +solveHy(th).toFixed(3), legY: 0.14, legZ: -0.10 });
  await ev("window.__grid('male', " + JSON.stringify(combos2) + ")");
  await sleep(400);
  await shot('grid-b');
};
