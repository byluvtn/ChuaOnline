import { writeFileSync } from 'node:fs';

export default async ({ ev, send, shot }) => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  assert(await ev(`document.querySelectorAll('.pin').length === 11`), 'Expected 11 map pins');
  for (let id = 1; id <= 11; id++) {
    assert(await ev(`(()=>{document.querySelector('.pin[data-id="${id}"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));return document.getElementById('detail-title').textContent.startsWith('${id}. ') && document.getElementById('detail-coord').textContent.length>10 && document.getElementById('detail-text').textContent.length>30})()`), `Pin ${id} has no detail`);
  }
  assert(await ev(`(()=>{document.getElementById('in').click();const enlarged=document.getElementById('map').style.width==='125%';document.getElementById('fit').click();return enlarged && document.getElementById('map').style.width==='100%'})()`), 'Zoom controls failed');
  assert(await ev(`(()=>{const t=document.getElementById('old');t.click();const hidden=document.getElementById('old-layer').style.display==='none';t.click();return hidden && document.getElementById('old-layer').style.display===''})()`), 'Old boundary toggle failed');
  await ev(`document.querySelector('.pin.selected')?.classList.remove('selected')`);
  const xml = await ev(`(()=>{const c=document.getElementById('map').cloneNode(true);c.removeAttribute('style');c.setAttribute('width','1400');c.setAttribute('height','1240');return new XMLSerializer().serializeToString(c)})()`);
  writeFileSync('../public/ban-do-mo-rong-chua-24-7.svg', xml);
  // Capture the actual vector drawing, not the page chrome or clipped scroll viewport.
  const rendered = await ev(`new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{const c=document.createElement('canvas');c.width=2800;c.height=2480;c.getContext('2d').drawImage(image,0,0,2800,2480);resolve(c.toDataURL('image/png').split(',')[1])};image.onerror=()=>reject(new Error('SVG export failed'));image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(${JSON.stringify(xml)})})`);
  assert(rendered, 'PNG rendering failed');
  writeFileSync('../shots/ban-do-mo-rong-chua-24-7.png', Buffer.from(rendered, 'base64'));
  await shot('desktop');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert(await ev(`document.documentElement.scrollWidth<=innerWidth`), 'Mobile page overflows');
  assert(await ev(`(()=>{document.querySelector('#places button[data-id="7"]').click();return document.getElementById('detail-title').textContent.includes('Chùa Ngọc')})()`), 'Mobile selection failed');
  await shot('mobile');
  console.log('PASS: 11 pins, coordinates, details, zoom, boundary toggle, mobile overflow and selection; SVG + PNG exported.');
};
