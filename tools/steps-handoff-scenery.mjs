import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';

export default async ({ ev, send, sleep }) => {
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 200, deviceScaleFactor: 1, mobile: false });
  if (process.env.BLOCK_ARCH === '1') {
    await send('Network.enable');
    await send('Network.setBlockedURLs', { urls: ['*dien-duoc-su-blender.glb*'] });
    await send('Page.reload', { ignoreCache: true });
  }
  for (let i = 0; i < 45 && !(await ev(`Boolean(window.__co && document.getElementById('enter')?.onclick)`)); i++) await sleep(1000);
  assert(await ev(`Boolean(window.__co && document.getElementById('enter')?.onclick)`), 'Game did not initialize');
  if (process.env.HANDOFF_WALK === '1') {
    await ev(`window.alert = text => { window.__handoffAlert = text; }`);
    await ev(`document.getElementById('enter').click()`);
    for (let i = 0; i < 45 && !(await ev('Boolean(window.__co?.me())')); i++) await sleep(1000);
    assert(await ev('Boolean(window.__co?.me())'), 'Guest did not enter: ' + await ev('window.__handoffAlert ?? document.body.innerText.slice(0, 800)'));
  }
  const result = await ev(`(async () => {
    const c = window.__co, { world, pathfinder, THREE } = c;
    const { NGOC } = await import('/shared/campus.ts');
    const { VIEN_KT, VIEN_TO } = await import('/src/layout.ts');
    const urn = world.scene.getObjectByName('main-courtyard-incense-urn');
    const fences = [VIEN_KT, VIEN_TO].map(v => world.colliders.filter(col => col.x2 !== undefined &&
      ((col.x === col.x2 && [v.x0, v.x1].includes(col.x) && col.z >= v.z0 && col.z <= v.z1) ||
       (col.z === col.z2 && [v.z0, v.z1].includes(col.z) && col.x >= v.x0 && col.x <= v.x1))).length);
    const to = { x: NGOC.x, z: NGOC.stairStart };
    const routes = [
      [{ x: 0, z: -12 }, { x: 0, z: -20 }],
      [{ x: -24, z: -46 }, to],
      [{ x: 26, z: -46 }, to],
      [to, { x: NGOC.x, z: NGOC.stairTop - 0.6 }],
    ].map(([from, target]) => {
      const path = pathfinder.findPath(from, target);
      let push = 0;
      for (const [i,p] of path.entries()) {
        const prev = path[i - 1] ?? from;
        const n = Math.max(1, Math.ceil(Math.hypot(p.x-prev.x,p.z-prev.z)/.12));
        for (let j = 0; j <= n; j++) {
          const x = prev.x + (p.x-prev.x)*j/n, z = prev.z + (p.z-prev.z)*j/n;
          const v = new THREE.Vector3(x,world.groundY(x,z),z);
          c.collide(v); push = Math.max(push,Math.hypot(v.x-x,v.z-z));
        }
      }
      return { end: path.at(-1), target, push, fallback: pathfinder.lastFallback };
    });
    const hall = world.scene.getObjectByName('expansion-chuaNgoc');
    const height = new THREE.Box3().setFromObject(hall).max.y - NGOC.y;
    return { urn: urn.position.toArray(), urnCollider: world.colliders.some(col => col.x === 0 && col.z === -17 && col.r === 1.9), fences, routes, height };
  })()`);
  console.log('HANDOFF_SCENERY', JSON.stringify(result));
  assert(result);
  assert.equal(result.urn[0], 0);
  assert.equal(result.urn[2], -17);
  assert(result.urnCollider);
  assert.deepEqual(result.fences, [0, 0]);
  assert(result.height >= 10 && result.height <= 11.5);
  for (const route of result.routes) {
    assert.deepEqual(route.end, route.target);
    assert(route.push <= 0.06 && !route.fallback);
  }
  if (process.env.BLOCK_ARCH !== '1') {
    for (let i = 0; i < 30 && !(await ev(`Boolean(window.__co.world.scene.getObjectByName('dien-duoc-su-blender'))`)); i++) await sleep(1000);
  }
  const duocSuHeight = await ev(`(() => {
    const { world, THREE } = window.__co;
    const arch = world.scene.getObjectByName('expansion-duocSu-architecture');
    const model = world.scene.getObjectByName('dien-duoc-su-blender') || arch;
    return model && new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).y;
  })()`);
  assert(Math.abs(duocSuHeight - 14.07) < (process.env.BLOCK_ARCH === '1' ? 0.3 : 0.02), 'Dược Sư height: ' + duocSuHeight);
  if (process.env.HANDOFF_WALK === '1') {
    await send('Page.bringToFront');
    await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    // Exercise the real movement loop without the cost of rendering on software WebGL.
    await ev('window.__handoffRender = window.__co.post.render; window.__co.post.render = () => {}');
    for (const [name, start, target] of [
      ['main-urn', [0, -12], [0, -20]],
      ['west-to-stairs', [-24, -46], [0, -90]],
      ['east-to-stairs', [26, -46], [0, -90]],
      ['raised-stairs', [0, -89.5], [0, -117.3]],
    ]) {
      const walked = await ev(`(async () => {
        const c = window.__co, p = c.me().char.root.position;
        c.renderer.setSize(160,100,false);
        const [x0,z0] = ${JSON.stringify(start)}, [x,z] = ${JSON.stringify(target)};
        p.set(x0,c.world.groundY(x0,z0),z0); c.me().target.copy(p); c.walkTo(x,z);
        return await new Promise(resolve => {
          const start = performance.now(), targetY = c.world.groundY(x,z);
          const timer = setInterval(() => {
            const distance = Math.hypot(p.x-x,p.z-z), y = p.y;
            if ((distance < .91 && Math.abs(y-targetY) < .1) || performance.now()-start > 60000) {
              clearInterval(timer); resolve({distance,y,targetY,x:p.x,z:p.z});
            }
          },250);
        });
      })()`);
      assert(walked && walked.distance < 0.91 && Math.abs(walked.y - walked.targetY) < 0.1, name + ': ' + JSON.stringify(walked));
      console.log('HANDOFF_WALK', name, JSON.stringify(walked));
    }
    await ev('window.__co.post.render = window.__handoffRender; delete window.__handoffRender');
  }
  if (!process.env.HANDOFF_SHOTS) return;
  await ev('window.__co.freeze = true');
  await sleep(2500);
  for (const [name, position, target] of [
    ['chua-ngoc-san', [28, 22, -74], [0, 10, -119]],
    ['chua-ngoc-thang', [7, 6.5, -89], [0, 10, -114]],
    ['duoc-su', [84, 6.8, -19], [77, 6, -38]],
    ['lu-huong', [0, 3.6, -10.9], [0, 3, -21]],
    ['ho-sen', [-74, 2.8, 12], [-78, .8, 6.4]],
    ['vuon-rau', [-59, 2.1, -40], [-64.35, .9, -42]],
    ['rung-truc', [67, 2.3, -2], [72, .8, -3]],
    ['vuon-hoa', [65, 2.7, 23], [70.6, .8, 20.4]],
    ['cay-co-thu', [59, 2.7, -78], [56, 1, -83.4]],
    ['song-dong-bien', [72, 2.7, -37], [70, .9, -42.5]],
  ]) {
    const image = await ev(`(() => {
      const c = window.__co, { world, camera, renderer, THREE } = c;
      renderer.setSize(850, 540, false); camera.aspect = 850/540; camera.updateProjectionMatrix();
      camera.position.set(...${JSON.stringify(position)}); camera.lookAt(...${JSON.stringify(target)});
      const fog = world.scene.fog, light = new THREE.HemisphereLight(0xfff3da, 0x5b7053, 2);
      world.scene.fog = null; world.scene.add(light); renderer.render(world.scene, camera);
      const png = renderer.domElement.toDataURL('image/png'); world.scene.remove(light); world.scene.fog = fog;
      return png;
    })()`);
    assert(image?.startsWith('data:image/png'));
    writeFileSync(`${process.env.HANDOFF_SHOTS}-${name}.png`, Buffer.from(image.split(',')[1], 'base64'));
  }
};
