// Round 2: hồ cá koi, bồ đoàn, cửa sổ tụng kinh/shop/nhiệm vụ.
export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  await shot('enter');

  // tới hồ cá: đặt camera nhìn thẳng xuống mặt hồ và chụp
  await ev(`(()=>{ const T = window.__co.THREE, cam = window.__co.camera; window.__co.freeze = true;
    cam.position.set(0, 14, 12); cam.lookAt(0, 0, 22); })()`);
  await sleep(800); await shot('koi-top');
  await ev(`(()=>{ const T = window.__co.THREE, cam = window.__co.camera;
    cam.position.set(0, 2.5, 34); cam.lookAt(0, 0.4, 22); })()`);
  await sleep(800); await shot('koi-low');

  // bồ đoàn: góc nhìn từ trên xuống khu thiền đường
  await ev(`(()=>{ const T = window.__co.THREE, cam = window.__co.camera;
    cam.position.set(12, 5, -2); cam.lookAt(11, 0, -12); })()`);
  await sleep(800); await shot('cushions');

  // cửa sổ tụng kinh: chọn Bát Nhã và đọc
  await ev(`window.__co.openPanel('chant', window.__co.panelCtx())`);
  await sleep(700); await shot('chant');
  await ev(`(()=>{ const b=[...document.querySelectorAll('#panelBody button')].find(x=>x.textContent==='Bắt đầu'); b&&b.click(); })()`);
  await sleep(1200); await shot('chant-reading');
  // nhiệm vụ: cuộn xuống cuối để thấy mục mỗi tuần (đợi render xong rồi mới cuộn)
  await ev(`window.__co.openPanel('quests', window.__co.panelCtx())`);
  await sleep(1500);
  await ev(`window.__co.openPanel('quests', window.__co.panelCtx())`);
  await sleep(900);
  await ev(`document.querySelector('#panel .card').scrollTop = 99999`);
  await sleep(500); await shot('quests-weekly');
  // quay lại danh sách kinh bằng nút Dừng lại
  await ev(`(()=>{ const b=[...document.querySelectorAll('#panelBody button')].find(x=>x.textContent==='Dừng lại'); b&&b.click(); })()`);
  await ev(`window.__co.closePanel ? window.__co.closePanel() : document.getElementById('panel').hidden = true`);
};
