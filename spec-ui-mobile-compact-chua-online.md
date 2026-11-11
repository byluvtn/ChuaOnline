# SPEC — THU NHỎ HUD TRÊN ĐIỆN THOẠI (mobile compact + chế độ ngang)

> Neo code: `main` tại `1a1ec79`. 1 spec = 1 session Kilo. **Chỉ sửa CSS**
> (`src/style.css`, `src/menu.css`) — không sửa logic TS, không sửa DOM.
> Lý do: người chơi phản hồi HUD trên điện thoại quá to, chiếm gần hết màn
> hình (cột 7 nút hành động hiện cao 470px ≈ 56% chiều cao máy 844px).
> Mockup tỉ lệ thật do Lux vẽ: `mockup-ui-mobile-v1.png` (đính kèm khi giao spec).

## 0. Nguyên tắc (không được phá)

- Desktop (màn > 760px, không cảm ứng) giữ nguyên **từng pixel** — mọi thay
  đổi chỉ nằm trong các media query mobile hiện có + 1 block ngang mới.
- Không nút tương tác nào bị thu xuống dưới 44×44. Các nút vốn đã nhỏ hơn và
  đang chạy tốt thì GIỮ NGUYÊN, không thu thêm: `#soundBtn` 38×38, nút thu
  gọn chat trên cảm ứng 40×40.
- `#chatInput` giữ `font-size: 16px` (chống iOS tự zoom — sửa chữa R1.3).
- Giữ nguyên mọi `env(safe-area-inset-*)` đang có; vị trí phần tử chỉ đổi
  đúng theo bảng dưới đây.
- Rider R1.5 (ẩn banner boost khi chat mở trên ≤760px) là logic theo class,
  không phụ thuộc kích thước — không được làm hỏng; ảnh nghiệm thu phải
  kiểm lại.

## BƯỚC 1 — Dọc compact (`@media (max-width: 760px)` hiện có)

### `src/style.css`

| Phần tử | Hiện tại | Mới |
|---|---|---|
| `#marquee` | height/line-height 26px, font 12px | **22px, font 11px** |
| `#profile` | top 36px | **top 30px**; padding `5px 12px 5px 5px` |
| `.avatar` | 44×44, font 19px | **34×34, font 15px** |
| `.pinfo b` / `#plevel` | 15px / 12px | **13.5px / 11px** (ghi đè trong media) |
| `.bar` | width 100px, height 6px | **width 80px, height 5px** |
| `#online` | top 98px, font 12px | **top 78px, font 11px, padding 4px 10px** |
| `#topright` | top 36px | **top 30px** |
| `#coins` | font 15px, icon 20px | **font 13.5px, icon 17px, padding 5px 10px** |
| `.act` | 62×62, radius 17, icon 22, nhãn 10 | **48×48, radius 14, icon 20, nhãn 9.5** |
| `#actions` | right 8, gap 6, bottom `calc(80px + safe)` | **right 6, gap 5, bottom `calc(72px + safe)`** |
| `.act.teacher` (zoneBtn/teacherBtn) | min-width 78, nhãn max 100px/11px | **min-width 64, nhãn max 84px/10px** (chỉ trong media) |
| `body.touch #chat` | top 138, width `min(250px, 62vw)`, max-height `min(46dvh, 100dvh − 442px)` | **top 116, width `min(228px, 58vw)`, max-height `min(38dvh, calc(100dvh - 380px - env(safe-area-inset-bottom)))`** |
| `#chat .title` / `#msgs` / `#chatInput` | 14px / 13px / padding 9px 13px | **13px / 12.5px / padding 8px 11px** (font input vẫn 16px) |
| `#medBanner` (cả bản thường + `body.touch`) | top 128px | **top 106px** |
| `#boostBanner` (cả bản thường + `body.touch`) | top 186px | **top 144px** |
| `#joystick` | 124×124, left 22 (gốc) | **104×104**, trong media thêm **left 14px** (bottom giữ `calc(92px + safe)`) |
| `#stick` | 52×52 tại left/top 36 | **46×46 tại left/top 29** (ghi đè trong media) |
| `#joyGrip` | 34×34 | **30×30** (ghi đè trong media) |
| `#couplet` (`@media max-width 700px`) | bottom 170px | **bottom 148px** |

Kiểm tra nhãn dài nhất "Thắp hương" phải vừa trong nút 48px ở font 9.5px
(`.act` đã có `overflow: hidden`); nếu tràn, hạ nhãn `.act .lb` xuống 9px.

Tổng chiều cao cột hành động sau thu: 7×48 + 6×5 = **366px** (từ 470px).

### `src/menu.css` (trong `@media (max-width: 760px)` của nó)

| Phần tử | Hiện tại | Mới |
|---|---|---|
| `#menu` | padding 4, gap 4, radius 18 | **padding 3, gap 3, radius 16** |
| `#menu .mscroll` | gap 4 | **gap 3** |
| `#menu button` | 58×56 | **54×50** |
| `#menu .ico` / `.lb` | 20px / 9.5px | **19px / 9px** |
| `body.touch #menu.collapsed` | bottom `calc(228px + safe)` | **bottom `calc(208px + safe)`** (theo joystick 104) |
| `body.touch #menu.collapsed .mtoggle` | 64×56 | **54×50** (min 48 giữ nguyên) |

## BƯỚC 2 — Chế độ ngang (mới)

Hiện trạng: game xoay ngang được (manifest `orientation: any`, renderer tự
vẽ lại theo khung) nhưng breakpoint chỉ tính theo chiều rộng — máy ngang
844×390 bị nhảy về layout desktop (nút 78px, chat mất bản sửa cảm ứng).

Cách làm: trong `style.css`, mở rộng điều kiện của block HUD mobile hiện có
thành `@media (max-width: 760px), (orientation: landscape) and (max-height: 500px)`
(block này còn chứa `.card` padding — áp cho ngang là vô hại), rồi thêm block
riêng cho các vị trí khác nhau khi nằm ngang:

```css
@media (orientation: landscape) and (max-height: 500px) {
  #profile { top: 28px; }
  #online { top: 34px; left: 190px; }        /* ngang hàng với profile, đỡ tốn chiều cao */
  #topright { top: 28px; }
  #medBanner { top: 64px; }
  #boostBanner { top: 102px; }
  #toast { top: 60px; }
  #actions { flex-direction: column; right: 6px; bottom: calc(70px + env(safe-area-inset-bottom)); }
  body.touch #chat { top: 76px; width: min(300px, 40vw); max-height: 56dvh; }
  #joystick { width: 96px; height: 96px; left: 12px; bottom: calc(66px + env(safe-area-inset-bottom)); }
  #stick { width: 44px; height: 44px; left: 26px; top: 26px; }
  #couplet { bottom: calc(64px + env(safe-area-inset-bottom)); }
}
```

Và trong `menu.css` thêm block tương ứng:

```css
@media (orientation: landscape) and (max-height: 500px) {
  #menu { left: 6px; right: 6px; transform: none; width: auto; max-width: none; bottom: calc(4px + env(safe-area-inset-bottom)); padding: 3px; gap: 3px; border-radius: 16px; }
  #menu button { width: 54px; height: 46px; }
  #menu .ico { font-size: 19px; }
  #menu .lb { font-size: 9px; }
}
```

## Nghiệm thu

- `npm run typecheck` pass (CSS-only nhưng vẫn chạy cho chắc build).
- Ảnh trong `shots/` (mẫu harness các spec trước, `?touch=1` cho cảm ứng):
  - `uim-portrait.png` — 390×844, chat thu gọn: cột hành động đo được
    ≤ 370px; joystick Ø104; thanh menu ≤ 62px; không phần tử nào chồng nhau.
  - `uim-chat-open.png` — 390×844, chat mở + đồng hồ giả 05:30 ICT: khung
    chat cao ≤ 38dvh, banner boost ẨN (rider R1.5 còn đúng), ô nhập không
    bị che, gõ thử được một tin.
  - `uim-landscape.png` — 844×390: HUD compact như Bước 2, cột hành động
    dọc bên phải, không phần tử nào tràn khỏi chiều cao 390.
  - `uim-desktop.png` — 1280×800: đối chứng desktop không khác trước.
- Kiểm tay trên điện thoại thật (chỉ người dùng làm được): bấm lần lượt 7
  nút hành động — không bấm nhầm sang nút kề.

## Commit & Push (bắt buộc — làm xong là đẩy luôn, không chờ lệnh riêng)

1. `style: compact mobile HUD for portrait screens`
2. `style: landscape HUD layout for short screens`
3. `docs: update HANDOFF for mobile UI compact`

(Add từng path cụ thể, không `git add -A`.)

Sau commit cuối, push ngay trong cùng session:

1. `git pull --rebase origin main` trước (repo có thể đã tiến thêm vì docs/tài
   liệu). Nếu rebase báo xung đột: DỪNG, báo cáo nguyên văn, không tự xử.
2. `git push origin main`. Nếu lỗi HTTP 400 (ảnh nặng) thì chạy lại đúng một
   lần: `git -c http.postBuffer=524288000 push origin main`.
3. Tuyệt đối không force-push. Push lỗi khác thì dừng và báo cáo.
4. Báo cáo phải kèm HEAD mới sau khi push thành công.

## Ngoài phạm vi

- Không đổi icon, nhãn, thứ tự nút; không gộp/ẩn nút nào.
- Không đổi các panel (`.card`) ngoài những gì media query hiện có đã làm.
- Không thêm nút "ẩn toàn bộ HUD" — thanh menu đã có Thu gọn.
- Không đụng vào `#lanternFeed` (đang ẩn trên mobile — giữ nguyên).
