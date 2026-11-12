# Prompt: Làm mượt chuyển động nhân vật (accel/decel + bước chân khớp tốc độ)

Mục tiêu: nhân vật đi/chạy/dừng/quay mượt hơn — hết cảm giác "bật-tắt" tốc độ và chân trượt trên mặt đất. Đây là gói polish chuyển động, không phải làm lại animation: vòng animation (blink, pose clip, palms/beads, crossfade 0.15s, LOD) đã xong và đã push (commits d103285–605f844), giữ nguyên hết.

**Quy tắc làm việc (bắt buộc):** trước khi làm bất cứ việc gì, tạo **todo list bằng `todowrite`** liệt kê đủ các việc dưới đây; luôn chỉ có 1 việc `in_progress`; xong việc nào cập nhật todo list ngay việc đó; toàn bộ gói này **1 commit riêng** (`git add` từng đường dẫn, không `git add -A`), làm xong thì **push luôn trong cùng session** (`pull --rebase` trước, không force-push) — quyết định của chủ dự án 2026-11-11. Không sửa IK lễ lạy, NPC, tượng, LOD, blink; không đổi thời gian crossfade 0.15s; không thêm chữ Hán.

## 0. Đọc skill đã cài trước khi làm (đừng đoán)

- Đọc 2 skill trong `~/.kilo/skills/`: **`threejs-animation`** (procedural motion, spring physics, smooth damping, clip blending) và **`threejs-gameplay-systems`** (game feel, character controllers, camera). Áp dụng đúng pattern của 2 skill này cho hệ pose thủ công của chùa (không dùng skeleton/mixer — nhân vật dựng bằng primitive + pose viết tay trong `src/character.ts`).
- Code hiện tại (head `0ba70ff`, đã kiểm 2026-11-12):
  - `src/character.ts` (761 dòng): `CLIPS` phase-evaluated — walk period 1.24s (0.62s/bước, 1 chu kỳ = 2 bước), amp 0.65; run period `TAU/14` ≈ 0.449s, amp 0.95; idle period π. Đổi anim thì `c.curAnim = anim; c.t0 = t` — **gait phase khởi động lại từ 0**. Crossfade `FADE_S = 0.15` snapshot pose cũ rồi slerp/lerp về pose mới (`fadeQ`/`fadeV`). Thân nảy `|cycle| * 0.09` khi đi.
  - `src/main.ts` (939 dòng): tốc độ `running ? 7 : 3.8` (dòng ~820) — **đổi tức thì, không tăng/giảm tốc**; joystick nhân thêm `max(0.5, mag)`, bàn phím nhị phân. Hướng `me.ry = Math.atan2(...)` gán tức thì khi đổi hướng; root rotation lerp theo với `dt * 12` (dòng ~915). clickTarget đi `speed * dt` đều, tới <0.2m thì dừng đột ngột. Camera đã damping sẵn (`1 - Math.pow(0.001, dt)`) — **không đụng camera**. Người chơi xa lerp vị trí `1 - Math.pow(0.0005, dt)`. NPC đã có chống trượt chân (walk→idle khi đứng yên >500ms).
- Nếu code trên máy khác những dòng trên thì dừng lại, đối chiếu lại rồi báo — đừng tự bịa số.

## 1. Tăng/giảm tốc (accel/decel) cho người chơi

- Giữ một biến tốc độ hiện tại (vd `curSpeed`); mỗi frame ramp nó về tốc độ đích (0 / 3.8 đi / 7 chạy) thay vì gán trực tiếp: lên tốc độ trong ~0.2–0.3s, giảm về 0 trong ~0.25s. **Không đổi tốc độ tối đa** (3.8 đi, 7 chạy) và không đổi nhịp gửi `move` 60ms.
- Áp dụng cho cả 3 nguồn di chuyển: phím WASD/mũi tên, joystick (tốc độ đích = `speed * max(0.5, mag)` như hiện tại), và clickTarget/planPath (đi tới điểm).
- Kết quả phải đo được: thả phím, nhân vật trượt thêm một đoạn ngắn rồi mới dừng hẳn (không dừng chết trong 1 frame); bấm Shift, tốc độ tăng dần lên 7 thay vì nhảy vọt.

## 2. Bước chân khớp tốc độ + giữ pha khi đổi anim

- **Vấn đề:** period đi cố định 1.24s dù tốc độ thật thay đổi (joystick nghiêng nửa → 1.9 m/s nhưng chân vẫn bước nhịp 3.8 m/s) → chân trượt trên đất. Và đổi walk↔run/idle thì `t0` reset → chân nhảy pha.
- **Cách làm (chọn một, ghi rõ trong báo cáo):** hoặc (a) pha bước tiến theo **quãng đường đã đi** (phase += khoảng cách / độ dài bước) thay vì theo thời gian — chân bước đúng nhịp với tốc độ thật; hoặc (b) giữ pha khi đổi anim (lưu phase hiện tại, tính lại `t0` từ phase đó) + scale period theo tốc độ thật (period tỉ lệ nghịch với `curSpeed`). Chuẩn tham chiếu giữ nguyên: đi đủ tốc 3.8 m/s thì 0.62s/bước.
- Không đổi biên độ bước (amp 0.65/0.95) và thân nảy (`|cycle| * 0.09`) trừ khi test cho thấy cần; không đụng crossfade 0.15s (nó đã đúng, chỉ cần gait phase không reset nữa).
- **Đổi hướng đột ngột (>90°):** khi `me.ry` đổi hướng lớn, giảm tốc trong lúc xoay (nhân vật không đi lùi "moonwalk" trong lúc thân đang quay theo `dt * 12`). Đo bằng mắt: quay 180° phải thấy người xoay rồi mới bước, không trượt lùi.

## 3. Giảm tốc khi tới đích (clickTarget / planPath)

- Khi còn ~1.5m tới waypoint cuối (hoặc tới `clickTarget`), giảm dần tốc độ đích theo khoảng cách còn lại thay vì chạy hết tốc rồi dừng đột ngột ở <0.2m. Giữ nguyên `planPath` (Dijkstra) và logic tới bồ đoàn (`bowSeat` <0.5m → ngồi + lạy) — không đụng.
- Đi thử: bấm bản đồ tới Bảo Tháp và bấm đất xa — nhân vật phải chậm dần rồi dừng đúng chỗ, không khựng.

## 4. Nghiệm thu

- `npm run typecheck` + `npm run build` sạch.
- Đi thử 1 tuyến cố định (cổng Tam Quan → chính điện → Bảo Tháp, cả đi bộ lẫn chạy, cả joystick lẫn click bản đồ), quay video hoặc chụp dãy ảnh trước/sau ở cùng khung hình: (a) khởi hành, (b) đổi đi→chạy giữa đường, (c) dừng đột ngột, (d) quay 180°, (e) tới đích. Ghi nhận xét từng cảnh: còn trượt chân / khựng / nhảy pha chỗ nào không.
- Không hồi quy: lễ lạy (bow 3.0s + IK), ngồi thiền, click-to-walk, `planPath`, NPC (anim từ server), LOD, blink vẫn như cũ. Chụp 2–3 ảnh vào `shots/` ( vd `smooth-*.png`).
- Cập nhật `HANDOFF.md` (mục làm mượt chuyển động) + thêm mục tin tức "Có gì mới" vào đầu `src/data/news.ts` nếu có thay đổi người chơi cảm nhận được (tăng `LATEST_NEWS_ID`).

> Nhiệm vụ: làm mượt chuyển động theo đúng thứ tự (0 đọc 2 skill + đối chiếu code → 1 tăng/giảm tốc → 2 bước chân khớp tốc độ + giữ pha → 3 giảm tốc tới đích → 4 nghiệm thu), 1 commit riêng rồi push. **Việc đầu tiên là tạo todo list bằng `todowrite` liệt kê đủ các việc.** Đọc skill `threejs-animation` + `threejs-gameplay-systems` trước khi code; giữ nguyên tốc độ tối đa, crossfade 0.15s, camera, bow IK, NPC. Chạy `npm run typecheck` + `npm run build` sau từng việc, nghiệm thu theo mục 4 rồi mới báo xong.
