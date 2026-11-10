import * as THREE from 'three';

function canvasTex(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export function grassTexture(repeat: [number, number]) {
  return canvasTex(512, (g, s) => {
    g.fillStyle = '#4a7a38';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) { // soft blotches
      g.fillStyle = `hsla(${rnd(88, 112)},${rnd(35, 50)}%,${rnd(28, 40)}%,.35)`;
      g.beginPath(); g.arc(rnd(0, s), rnd(0, s), rnd(14, 46), 0, 7); g.fill();
    }
    for (let i = 0; i < 2600; i++) { // blades
      g.strokeStyle = `hsla(${rnd(80, 125)},${rnd(35, 60)}%,${rnd(24, 48)}%,.55)`;
      g.lineWidth = rnd(1, 2.2);
      const x = rnd(0, s), y = rnd(0, s);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(-3, 3), y - rnd(3, 9)); g.stroke();
    }
  }, repeat);
}

export function stoneTexture(base: [number, number, number], repeat: [number, number], cols = 4) {
  return canvasTex(512, (g, s) => {
    g.fillStyle = '#4a463e';
    g.fillRect(0, 0, s, s);
    const cell = s / cols;
    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        const off = r % 2 ? cell / 2 : 0;
        const l = rnd(-9, 9);
        g.fillStyle = `rgb(${base[0] + l},${base[1] + l},${base[2] + l * 0.8})`;
        const x = c * cell + off + 2, y = r * cell + 2;
        g.beginPath(); g.roundRect(x, y, cell - 4, cell - 4, 6); g.fill();
        g.fillStyle = 'rgba(255,255,255,.07)';
        g.fillRect(x + 3, y + 3, cell - 10, 3); // top highlight
        for (let k = 0; k < 14; k++) { // speckle
          g.fillStyle = `rgba(0,0,0,${rnd(.04, .12)})`;
          g.fillRect(x + rnd(4, cell - 8), y + rnd(4, cell - 8), rnd(1, 3), rnd(1, 3));
        }
        if (off && c === cols - 1) { // wrap seam piece
          g.fillStyle = `rgb(${base[0] + l},${base[1] + l},${base[2] + l * 0.8})`;
          g.beginPath(); g.roundRect(-cell / 2 + 2, y, cell - 4, cell - 4, 6); g.fill();
        }
      }
    }
  }, repeat);
}

export function softDot(color = '#ffffff') {
  return canvasTex(64, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, color); gr.addColorStop(.35, color.replace(')', ',.45)').replace('rgb', 'rgba'));
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });
}
export const glowTexture = (() => {
  let t: THREE.Texture | null = null;
  return () => t ?? (t = canvasTex(64, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  }));
})();

export function petalTexture() {
  return canvasTex(32, (g, s) => {
    g.translate(s / 2, s / 2); g.rotate(-0.5);
    const gr = g.createLinearGradient(-10, 0, 10, 0);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#ffd0de');
    g.fillStyle = gr;
    g.beginPath(); g.ellipse(0, 0, 11, 6, 0, 0, 7); g.fill();
  });
}

export function shadowBlobTexture() {
  return canvasTex(64, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(.6, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });
}

export function signTexture(text: string) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#5a1a12'; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = '#e8b64a'; g.lineWidth = 6; g.strokeRect(8, 8, 496, 112);
  g.fillStyle = '#f4d27a'; g.font = '700 58px "Times New Roman", serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ *
 * Khuôn mặt Chibi vẽ bằng CanvasTexture 2D
 * Trả về texture trong suốt, chỉ chứa nét (mắt cong, miệng, má hồng) để
 * dán lên một chỏm cầu cùng bán kính với đầu tượng.
 * ------------------------------------------------------------------ */
export function faceTexture(kind: 'buddha' | 'guanyin') {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, S, S);
  g.lineCap = 'round';
  g.lineJoin = 'round';

  const ink = '#4a3728';

  // ---- mắt cong hình trăng khuyết (⌒), mí khép hạnh phúc ----
  g.strokeStyle = ink;
  g.lineWidth = 22;
  for (const s of [-1, 1]) {
    const cx = S / 2 + s * 128, cy = 196, r = 54;
    g.beginPath();
    g.arc(cx, cy, r, Math.PI * 1.12, Math.PI * 1.88);
    g.stroke();
  }

  // ---- má hồng đào #f28482 ----
  for (const s of [-1, 1]) {
    const cx = S / 2 + s * 152, cy = 300, r = 64;
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    gr.addColorStop(0, 'rgba(242,132,130,.62)');
    gr.addColorStop(0.55, 'rgba(242,132,130,.34)');
    gr.addColorStop(1, 'rgba(242,132,130,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  }

  // ---- miệng mỉm cười ----
  g.strokeStyle = ink;
  g.lineWidth = kind === 'guanyin' ? 15 : 17;
  g.beginPath();
  g.moveTo(S / 2 - 42, 334);
  g.quadraticCurveTo(S / 2, 374, S / 2 + 42, 334);
  g.stroke();

  // ---- chấm urna giữa trán (chỉ Phật Tổ) ----
  if (kind === 'buddha') {
    const gr = g.createRadialGradient(S / 2, 92, 0, S / 2, 92, 20);
    gr.addColorStop(0, 'rgba(224,169,59,.95)');
    gr.addColorStop(1, 'rgba(224,169,59,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(S / 2, 92, 20, 0, Math.PI * 2); g.fill();
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Bảng chữ tiếng Việt (câu đối) — vàng trên nền sơn son, thay cho chữ Hán cũ.
 *  Câu dài được ngắt dòng theo từ và xếp dọc từ trên xuống cho dễ đọc trên cột hẹp. */
export function vietnameseColumnTexture(text: string, w = 160, h = 900, opts: { title?: string } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;

  const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, '#5a0e0a'); gr.addColorStop(0.5, '#7d1a12'); gr.addColorStop(1, '#5a0e0a');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#e8b64a'; g.lineWidth = Math.max(3, w * 0.03); g.strokeRect(w * 0.04, w * 0.04, w * 0.92, h - w * 0.08);
  g.strokeStyle = 'rgba(232,182,74,.45)'; g.lineWidth = Math.max(1, w * 0.012);
  g.strokeRect(w * 0.09, w * 0.09, w * 0.82, h - w * 0.18);

  const padX = w * 0.14, maxW = w - padX * 2;
  const family = '"Segoe UI", "Be Vietnam Pro", system-ui, sans-serif';
  const words = text.split(/\s+/).filter(Boolean);
  const padY = w * 0.14 + (opts.title ? h * 0.07 : 0);
  const lineH = (h - padY * 2) / Math.max(1, words.length);
  let font = Math.min(Math.round(lineH * 0.72), Math.round(w * 0.5));
  g.font = `600 ${font}px ${family}`;
  const widest = () => Math.max(...words.map((wd) => g.measureText(wd).width));
  while (widest() > maxW && font > 8) { font -= 1; g.font = `600 ${font}px ${family}`; }
  g.fillStyle = '#f6d67c';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,.55)';
  g.shadowBlur = 3;
  const y0 = padY + lineH / 2;
  words.forEach((wd, i) => g.fillText(wd, w / 2, y0 + i * lineH, maxW));

  if (opts.title) {
    g.fillStyle = '#e8b64a';
    g.font = `700 ${Math.round(font * 1.15)}px ${family}`;
    g.fillText(opts.title, w / 2, h * 0.06 + font * 0.6, maxW);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Hoành phi tiếng Việt: chữ vàng trên nền sơn mài đen, viền chỉ vàng. */
export function vietnamesePlaqueTexture(text: string, w = 1024, h = 256) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1b0d08'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#e8b64a'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
  g.strokeStyle = 'rgba(232,182,74,.45)'; g.lineWidth = 3; g.strokeRect(24, 24, w - 48, h - 48);
  const family = '"Segoe UI", "Be Vietnam Pro", system-ui, sans-serif';
  let font = Math.round(h * 0.46);
  g.font = `700 ${font}px ${family}`;
  while (g.measureText(text).width > w - 140 && font > 12) { font -= 2; g.font = `700 ${font}px ${family}`; }
  g.fillStyle = '#f6d67c';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 4;
  g.fillText(text, w / 2, h / 2 + 4, w - 140);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/** Thân cột kinh: đá sáng, chữ Việt in hoa xếp dọc (mỗi từ một dòng), khắc chìm tông tối. */
export function sutraPillarTexture(text: string, w = 192, h = 1120) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = '#d6cbb6'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 420; i++) {
    g.fillStyle = `rgba(${rnd(0, 1) > 0.5 ? '255,255,255' : '60,50,36'},${rnd(0.03, 0.09)})`;
    g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 4), rnd(1, 4));
  }
  g.strokeStyle = 'rgba(70,58,40,.5)'; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20);
  g.strokeStyle = 'rgba(70,58,40,.3)'; g.lineWidth = 1.5; g.strokeRect(20, 20, w - 40, h - 40);
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  const family = '"Segoe UI", "Be Vietnam Pro", system-ui, sans-serif';
  const padY = 70, maxW = w - 60;
  let font = 96;
  g.font = `700 ${font}px ${family}`;
  while (Math.max(...words.map((wd) => g.measureText(wd).width)) > maxW && font > 10) { font -= 2; g.font = `700 ${font}px ${family}`; }
  const lineH = Math.min(font * 1.7, (h - padY * 2) / Math.max(1, words.length));
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const y0 = h / 2 - (lineH * (words.length - 1)) / 2;
  words.forEach((wd, i) => {
    const y = y0 + i * lineH;
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText(wd, w / 2 + 2, y + 2);
    g.fillStyle = '#4a3f2e'; g.fillText(wd, w / 2, y);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function woodTexture(repeat: [number, number]) {
  return canvasTex(512, (g, s) => {
    g.fillStyle = '#8a5a34'; g.fillRect(0, 0, s, s);
    const n = 8, pw = s / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = `hsl(${rnd(24, 30)},${rnd(38, 48)}%,${rnd(30, 40)}%)`;
      g.fillRect(i * pw, 0, pw - 2, s);
      for (let k = 0; k < 26; k++) {
        g.strokeStyle = `hsla(${rnd(20, 28)},40%,${rnd(20, 30)}%,.35)`; g.lineWidth = rnd(.5, 1.6);
        const x = i * pw + rnd(3, pw - 5);
        g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + rnd(-4, 4), s * .3, x + rnd(-4, 4), s * .7, x + rnd(-3, 3), s); g.stroke();
      }
    }
  }, repeat);
}
