import { h, openCustomPanel } from '../panels';

let deferred: any = null;
export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
export function initInstallCapture() {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });
  window.addEventListener('appinstalled', () => { deferred = null; });
}
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function openInstall() {
  openCustomPanel('Cài vào màn hình', (body) => {
    body.append(h('p', {}, 'Cài Chùa Online như một ứng dụng để mở nhanh từ màn hình chính, toàn màn hình, không cần mở trình duyệt.'));
    if (isStandalone()) { body.append(h('div', { class: 'thanks' }, h('b', {}, 'Đã cài'), h('p', {}, 'Bạn đang dùng Chùa Online dưới dạng ứng dụng.'))); return; }
    if (deferred) {
      body.append(h('button', { class: 'gold', onclick: async () => {
        const d = deferred; deferred = null;
        try { await d.prompt(); await d.userChoice; } catch { /* dismissed */ }
        openInstall();
      } }, 'Cài đặt ngay'));
    } else if (isIos()) {
      body.append(h('ol', { class: 'steps' },
        h('li', {}, 'Mở trang này bằng Safari.'),
        h('li', {}, 'Bấm nút Chia sẻ ở thanh công cụ.'),
        h('li', {}, 'Chọn "Thêm vào MH chính" (Add to Home Screen).'),
        h('li', {}, 'Bấm "Thêm" ở góc trên.')));
    } else {
      body.append(h('p', { class: 'hint' }, 'Trình duyệt chưa cho phép cài tự động. Hãy mở menu trình duyệt (dấu ba chấm) và chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".'),
        h('p', { class: 'hint' }, 'Trên iPhone/iPad: dùng Safari, bấm Chia sẻ → Thêm vào MH chính.'));
    }
  });
}
