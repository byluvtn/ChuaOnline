import type { Post } from '../post';

let busy = false;
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function fileName(d: Date): string {
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `chua247-${date}-${time}.png`;
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
  const now = new Date();
  let off: HTMLCanvasElement;
  try {
    // Render + drawImage trong cùng task đồng bộ: tránh ảnh đen của WebGL.
    post.render();
    off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    const ctx = off.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(canvas, 0, 0);
    drawWatermark(ctx, off.width, off.height, getName(), now);
  } catch {
    busy = false;
    toast('Chụp ảnh thất bại, thử lại nhé');
    return;
  }

  void savePhoto(off, now, toast);
}

function toBlob(c: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    c.toBlob((blob) => resolve(blob), 'image/png');
  });
}

async function savePhoto(
  off: HTMLCanvasElement,
  now: Date,
  toast: (t: string) => void,
): Promise<void> {
  try {
    const blob = await toBlob(off);
    if (!blob) {
      toast('Chụp ảnh thất bại, thử lại nhé');
      return;
    }
    const name = fileName(now);
    if (typeof navigator.canShare === 'function') {
      const file = new File([blob], name, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          toast('Đã lưu ảnh vào máy');
          return;
        } catch (err) {
          if ((err as { name?: string } | null)?.name === 'AbortError') {
            toast('Đã hủy lưu ảnh');
            return;
          }
        }
      }
    }
    const url = URL.createObjectURL(blob);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    if ('download' in HTMLAnchorElement.prototype) {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast('Đang tải ảnh xuống…');
    } else if (window.open(url, '_blank')) {
      toast('Đã mở ảnh — giữ ảnh để lưu vào máy');
    } else {
      toast('Không mở được ảnh, thử lại nhé');
    }
  } catch {
    toast('Chụp ảnh thất bại, thử lại nhé');
  } finally {
    busy = false;
  }
}
