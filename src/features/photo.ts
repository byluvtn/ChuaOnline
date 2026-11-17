import type { Post } from '../post';

let busy = false;
let lastPhoto: string | null = null;

export function getLastPhoto(): string | null {
  return lastPhoto;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function fileName(d: Date): string {
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `chua247-${date}-${time}.png`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, name: string, now: Date): void {
  const pad1 = w / 60;
  const size1 = Math.max(18, Math.round(w / 48));
  const size2 = Math.max(14, Math.round(size1 * 0.8));
  const line1 = 'Chùa 24/7 \u2022 chua247.top';
  const line2 = `${name} \u2022 ${now.toLocaleDateString('vi-VN')}`;
  const font = '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif';

  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 ${size1}px ${font}`;
  const w1 = ctx.measureText(line1).width;
  ctx.font = `400 ${size2}px ${font}`;
  const w2 = ctx.measureText(line2).width;

  const boxW = Math.max(w1, w2) + pad1 * 2;
  const boxH = size1 + size2 + pad1 * 2 + pad1 * 0.3;
  const x = w - boxW - pad1;
  const y = h - boxH - pad1;
  const r = Math.min(boxH / 2, pad1 * 1.2);

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + boxW - r, y);
  ctx.quadraticCurveTo(x + boxW, y, x + boxW, y + r);
  ctx.lineTo(x + boxW, y + boxH - r);
  ctx.quadraticCurveTo(x + boxW, y + boxH, x + boxW - r, y + boxH);
  ctx.lineTo(x + r, y + boxH);
  ctx.quadraticCurveTo(x, y + boxH, x, y + boxH - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  const right = x + boxW - pad1;
  ctx.font = `600 ${size1}px ${font}`;
  ctx.fillText(line1, right, y + pad1 + size1 * 0.85);
  ctx.font = `400 ${size2}px ${font}`;
  ctx.fillText(line2, right, y + pad1 + size1 + pad1 * 0.3 + size2 * 0.85);
}

export function takePhoto(
  canvas: HTMLCanvasElement,
  post: Post,
  getName: () => string,
  toast: (t: string) => void,
): void {
  if (busy) return;
  busy = true;
  document.body.classList.add('photo-mode');
  let dataUrl: string;
  try {
    // Render + toDataURL trong cùng task đồng bộ: tránh ảnh đen của WebGL.
    post.render();
    dataUrl = canvas.toDataURL('image/png');
  } catch {
    document.body.classList.remove('photo-mode');
    busy = false;
    toast('Chụp ảnh thất bại, thử lại nhé');
    return;
  }
  document.body.classList.remove('photo-mode');

  const now = new Date();
  void (async () => {
    try {
      const img = await loadImage(dataUrl);
      const off = document.createElement('canvas');
      off.width = img.naturalWidth;
      off.height = img.naturalHeight;
      const ctx = off.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      ctx.drawImage(img, 0, 0);
      drawWatermark(ctx, off.width, off.height, getName(), now);
      const out = off.toDataURL('image/png');
      lastPhoto = out;
      const a = document.createElement('a');
      a.href = out;
      a.download = fileName(now);
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast('Đã lưu ảnh vào máy');
    } catch {
      toast('Chụp ảnh thất bại, thử lại nhé');
    } finally {
      busy = false;
    }
  })();
}
