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

const HAN_FONT = '"Noto Serif CJK TC","Songti TC","STSong","PMingLiU","PingFang TC","Hiragino Mincho ProN",serif';

/** Vertical couplet board (câu đối): Han characters top-to-bottom, gold on red lacquer. */
export function coupletTexture(han: string, w = 160, h = 880) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, '#5a0e0a'); gr.addColorStop(.5, '#7a1812'); gr.addColorStop(1, '#5a0e0a');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#e8b64a'; g.lineWidth = 5; g.strokeRect(7, 7, w - 14, h - 14);
  g.strokeStyle = 'rgba(232,182,74,.45)'; g.lineWidth = 2; g.strokeRect(15, 15, w - 30, h - 30);
  const chars = [...han];
  const step = (h - 70) / chars.length;
  const font = Math.min(step * 0.86, w * 0.62);
  g.fillStyle = '#f6d67c'; g.font = `700 ${font}px ${HAN_FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 3;
  chars.forEach((ch, i) => g.fillText(ch, w / 2, 35 + step * (i + 0.5)));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/** Horizontal board (hoành phi): Han characters left-to-right, gold on black lacquer. */
export function hoanhPhiTexture(han: string, w = 1024, h = 256) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1b0d08'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#e8b64a'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
  g.strokeStyle = 'rgba(232,182,74,.45)'; g.lineWidth = 3; g.strokeRect(24, 24, w - 48, h - 48);
  const chars = [...han];
  const step = (w - 120) / chars.length;
  const font = Math.min(step * 0.86, h * 0.66);
  g.fillStyle = '#f6d67c'; g.font = `700 ${font}px ${HAN_FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 4;
  chars.forEach((ch, i) => g.fillText(ch, 60 + step * (i + 0.5), h / 2 + 4));
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
