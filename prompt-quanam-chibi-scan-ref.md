# Prompt: Vẽ lại tượng Quan Âm chibi (v4) — dùng scan Water-Moon Guanyin làm ref

> **XẾP HÀNG SAU gói tượng Phật Cleveland** (prompt-statue-cleveland.md, đã push 21d8eb0) — làm gói này sau khi gói đó xong + push.

Mục tiêu: vẽ lại tượng Quan Âm trong game cho đúng thiết kế chibi v4 (hiện tại vẫn là bản cũ: áo choàng như chuông úp, bình vàng thay vì ngọc, liễu chỉ 5 lá, mặt là texture 2D). Dùng scan 3D Water-Moon Guanyin của bảo tàng làm ref cho chi tiết vương miện / mặt / nếp áo. Chỉ sửa **một tượng Quan Âm** trong `src/statues.ts` (`buildQuanAm`); KHÔNG đụng tượng Phật chính (lead Buddha), KHÔNG đụng `src/hall.ts`, KHÔNG đổi vị trí đặt tượng, KHÔNG đưa scan vào game (scan chỉ là ref để nhìn, không phải asset).

**Quy tắc làm việc (bắt buộc):** trước khi làm bất cứ việc gì, tạo **todo list bằng `todowrite`** liệt kê đủ các việc dưới đây; luôn chỉ có 1 việc `in_progress`; xong việc nào cập nhật todo list ngay việc đó; toàn bộ gói này **1 commit riêng** (`git add` từng đường dẫn, không `git add -A`), làm xong thì **push luôn trong cùng session** (`pull --rebase` trước, không force-push) — quyết định của chủ dự án 2026-11-11. Không thêm chữ Hán.

## 0. Ref — đối chiếu trước khi làm (đừng đoán)

### 0a. Scan ref: Water-Moon Guanyin, thế kỷ 12 (chỉ để nhìn, KHÔNG đưa vào game)

- Đây là tượng Quan Âm Thủy Nguyệt thật, thế kỷ 12, hiện ở **Minneapolis Institute of Art**, giấy phép **CC0 1.0** (dùng tự do). Nguồn: https://sketchfab.com/3d-models/12th-c-ce-water-moon-guanyin-f3316610c8b740c595c22ca1d7df54ca — mở trang này trong viewer để xoay xem tượng từ mọi góc.
- Ảnh ref (tải về xem, link công khai): https://media.sketchfab.com/models/f3316610c8b740c595c22ca1d7df54ca/thumbnails/76d37f852a1e4c44827c7f78186b7eec/2fa0a051ea414b6488f912ce1ff8c6be.jpeg
- Số liệu đã kiểm (2026-11-12): **201.796 tris**, tượng ngồi dáng Thủy Nguyệt. Chỉ học ở scan này: **vương miện cao có Phật A Di Đà nhỏ ngay giữa** (nhìn rõ trong ảnh ref), mặt hiền mắt nhắm nhìn xuống, vòng cổ trang sức, nếp áo rủ mềm. **KHÔNG copy:** dáng ngồi Thủy Nguyệt (một chân thõng — tượng game ngồi kiết già trên sen như thiết kế v4), màu gỗ/đá cũ của scan (tượng game: áo trắng viền vàng), KHÔNG copy texture scan.
- **File scan ĐÃ CÓ TRÊN MÁY** (user đã tải từ Sketchfab, giải nén tại `12th_c_ce_water-moon_guanyin/` — ngay trong thư mục gốc project): `scene.gltf` (9 KB) + `scene.bin` (~8,9 MB) + `textures/` + `license.txt` (CC0). Mở file này để xem tượng 3D trực tiếp (xoay, zoom) và đối chiếu vương miện / mặt / nếp áo — chi tiết hơn hẳn ảnh thumbnail. File .zip gốc ~66 MB (chủ yếu là textures). **Chỉ làm ref — KHÔNG commit thư mục này vào repo, KHÔNG đưa file scan vào game (không load scene.gltf trong code), KHÔNG copy texture scan.** Nếu cần xem nhanh trên web thì dùng viewer + ảnh thumbnail (link ở trên). Có bản low-poly trên Thingiverse (thing:2642999) nhưng không cần.

### 0b. Thiết kế v4 (mục tiêu cuối)

- Ảnh thiết kế (tượng Quan Âm chibi solo, nền trơn — link công khai, **hết hạn ~15:34 ngày 14/11/2026 giờ VN**; nếu link chết thì dùng spec chữ ở mục 1, đừng đoán): https://muse.ai/files/1399693233233008/1167970365903772/lnraeenpm18jdqz2jy3csemj/design-quanam-chibi.webp
- Ảnh này là đích đến cho silhouette chibi: đầu ~50% chiều cao, mặt 3D vui vẻ, vương miện có A Di Đà nhỏ, khăn choàng sau vai, áo trắng viền vàng, bình ngọc đưa ra trước, liễu lá tròn to, tay chunky, đế sen hồng.

### 0c. Lỗi cũ — kết quả MỚI không được giống (mô tả bằng chữ)

- Bản thử SDF (Opus 5): mặt không có (blob trơn), khăn choàng nuốt trọn thân, mặt quay đi — đã loại, **không dùng SDF cho mặt chibi**.
- Bản v3-flat (đang trong game): áo trắng/kem, thân dài hình thùng trơn, tay nhỏ xíu, sash mỏng — đã bị chê là "không chibi chỗ nào". Bản mới phải khác hẳn: đầu to, tay to rõ, áo có viền vàng, bình ngọc xanh, liễu lá tròn.

## 1. Spec v4 — tượng Quan Âm chibi (viết đầy đủ bằng chữ)

- Đọc `src/statues.ts` (hàm `buildQuanAm`) + `src/character.ts` (cách dựng nhân vật chibi bằng primitives) trước khi code. Phương pháp: **primitives** (sphere, capsule, torus…) như `character.ts`, **KHÔNG dùng SDF**.
- Tỉ lệ: **đầu ~50% chiều cao tượng**, thân ngắn mũm mĩm, ngồi kiết già trên đế sen hồng.
- **Mặt 3D thật bằng mesh** (không dùng CanvasTexture 2D như hiện tại): mắt nhắm đường cong vui vẻ, miệng cười, **má hồng to** (sphere dẹt), mũi gợi ý; tóc búi cụm sphere; **vương miện có Phật A Di Đà nhỏ ngồi phía trước giữa** (học theo scan mục 0a).
- Khăn choàng: chỉ phủ **sau vai/lưng**, không trùm kín thân (lỗi cũ: áo choàng như chuông úp).
- Áo: **trắng, viền vàng** ở gấu và tay áo; không để áo trắng trơn toàn thân kiểu v3.
- Tay **chunky, to rõ**: một tay đưa **bình ngọc xanh lá** ra trước, tay còn lại cầm **cành liễu lá tròn to** buông xuống.
- Hào quang sau đầu, đế sen hồng. Gộp geometry theo vật liệu (`mergeGeometries`), tổng ~15–20 meshes/tượng.
- Không đổi vị trí đặt tượng, không đổi collider (chỉ sửa hình dạng tượng trong `buildQuanAm`).

## 2. Nghiệm thu

- `npm run typecheck` + `npm run build` sạch.
- Ảnh vào `shots/` (chụp bằng `STEPS=./steps-temple.mjs node tools/shot.mjs`, tên ảnh `quanam`, `yard`): cận cảnh tượng, toàn cảnh sân tượng — so với ảnh thiết kế v4 (mục 0b) + ảnh scan (mục 0a). Checklist: đầu ~50% đọc được ở khoảng cách chơi; mặt 3D (mắt nhắm, cười, má hồng) nhìn rõ; vương miện có A Di Đà nhỏ; bình **ngọc xanh** (không vàng); liễu lá tròn to; tay chunky; áo không còn hình chuông úp; không giống 2 lỗi cũ ở mục 0c.
- Cập nhật `HANDOFF.md` (mục tượng Quan Âm v4) + thêm mục tin tức "Có gì mới" vào đầu `src/data/news.ts` (tăng `LATEST_NEWS_ID`).

> Nhiệm vụ: vẽ lại tượng Quan Âm chibi theo thiết kế v4 (mục 1), dùng scan Water-Moon Guanyin làm ref cho vương miện / mặt / nếp áo (mục 0a), đúng thứ tự (0 đối chiếu ref → 1 sửa `buildQuanAm` → 2 nghiệm thu), 1 commit riêng rồi push. **Việc đầu tiên là tạo todo list bằng `todowrite` liệt kê đủ các việc.** Chỉ sửa tượng Quan Âm, **không đụng tượng Phật chính, hall, NPC, animation**. Chạy `npm run typecheck` + `npm run build` sau từng việc, nghiệm thu theo mục 2 rồi mới báo xong.
