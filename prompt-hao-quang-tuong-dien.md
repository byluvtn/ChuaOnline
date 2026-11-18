# Prompt: Hào quang cho 8 tượng chibi ở Chính Điện + Điện Tam Thế

## Bối cảnh

- 8 tượng chibi GLB đã live (`a85877b`): 5 tượng Chính Điện (Địa Tạng, Văn Thù, A Di Đà, Phổ Hiền, Dược Sư) + 3 tượng Điện Tam Thế (Nhiên Đăng, Thích Ca, Di Lặc). Code nối tượng ở commit `8762007`, fallback-first qua `replaceModel` (`src/models.ts`).
- Tượng fallback cũ (procedural, `buildBuddha` trong `src/statues.ts`) CÓ hào quang lửa — `buildHalo` (torus R 1.3 + 8 ngọn lửa, vàng emissive, `src/statues.ts:135-149`, object tên `'halo'`). Khi GLB tải xong, `replaceModel` xóa cả fallback (kèm hào quang của nó) — nên 8 tượng GLB hiện KHÔNG có hào quang. User yêu cầu thêm hào quang lại cho cả 8 tượng.
- Hào quang fallback cũ còn được xoay chậm mỗi frame ở `src/temple.ts:1589-1598` (`halos.forEach((h, i) => { h.rotation.z = t * (0.12 + i * 0.02); })`) — mảng `halos` lấy từ `buildHall`/`buildTamThe`. Hiện tại các object đó đã bị detach (nằm trong fallback bị xóa) nên vòng xoay không còn tác dụng nhìn thấy được.

## Thiết kế: hào quang theo vị trí đặt tượng (slot halo)

- KHÔNG gắn hào quang vào model GLB (khó căn đầu từng tượng, lại phụ thuộc tải async). Thay vào đó: mỗi vị trí đặt tượng có MỘT hào quang riêng, là đối tượng độc lập trong group của điện — hiển thị đúng dù tượng đang là GLB hay fallback.
- Tái dùng `buildHalo` nguyên vẹn (cùng torus + 8 lửa + vật liệu vàng emissive) để hào quang mới giống hệt hào quang fallback cũ. Export `buildHalo` ra khỏi `src/statues.ts` (hiện là hàm private).
- Công thức (suy ra từ fallback: torus R 1.3 local × BUDDHA_SCALE 1.62 = 2.11 m; tâm y 2.42 × 1.62 = 3.92 m; z −0.6 × 1.62 = −0.97 m; chiều cao fallback H = 6.5448 m theo `measureBuddhaHeight`):
  - Chiều cao slot: `slotH = 6.5448 × s` (s = scale của vị trí đó, giống hệt số dùng trong `replaceModel`).
  - Bán kính hào quang: `R = 0.32 × slotH`.
  - Tâm hào quang: cao `0.60 × slotH` so với mặt bệ (`altarY`), lùi sau lưng tượng `0.15 × slotH`.
  - Bảng tính sẵn: A Di Đà (s 0.95): H 6.22, R 1.99. Văn Thù / Phổ Hiền (s 0.72): H 4.71, R 1.51. Địa Tạng / Dược Sư (s 0.5): H 3.27, R 1.05. Nhiên Đăng / Di Lặc (s 0.92): H 6.02, R 1.93. Thích Ca (s 1.2): H 7.85, R 2.51.
- Cách đặt (cho mỗi vị trí trong `place()` của `src/hall.ts` và `src/tamthe.ts`):
  - Tạo group con tại `(x, altarY, altarZ)`, `rotation.y = ry` (ry của tượng tại vị trí đó — tượng bên hông xoay ∓0.15/∓0.3).
  - Thêm `buildHalo(R, 0.60 × slotH, −0.15 × slotH, 8)` vào group con đó. (`buildHalo(radius, y, z)` đặt group hào quang tại `(0, y, z)` local.)
  - Thêm group hào quang vào group của điện (cùng parent với tượng).
- Ẩn hào quang của fallback để không bị hai hào quang chồng nhau: trong `place()`, sau khi clone fallback, lấy `b.getObjectByName('halo')` và đặt `.visible = false` (chỉ ẩn, không xóa khỏi cây — giữ nguyên cấu trúc fallback). Khi GLB lỗi tải, fallback hiện lên với hào quang slot — nhìn giống như cũ.
- Mảng `halos` trả về từ `buildHall`/`buildTamThe`: thu thập các hào quang SLOT (không phải hào quang của fallback nữa) để vòng xoay ở `temple.ts:1598` tiếp tục xoay đúng các hào quang đang hiển thị. Giữ nguyên hình dạng trả về (mảng, `filter(Boolean)` ở temple.ts vẫn chạy).
- PHẠM VI: chỉ 8 tượng trong 2 điện (5 Chính Điện + 3 Tam Thế). KHÔNG đụng: tượng hành lang (`src/statue-corridor.ts`), tượng sân (`src/statue-courtyard.ts`), Quan Âm Điện Mẫu, `replaceModel`, vòng xoay ở `temple.ts`, nội dung `buildBuddha`/`buildQuanAm` (ngoài việc export `buildHalo`).

## Tin tức (1 entry, LATEST + 1 tại thời điểm build)

- Đọc `LATEST_NEWS_ID` hiện tại trong `src/data/news.ts` rồi +1 (không hard-code số — các đợt khác có thể đã thêm tin trước).
- Title: `Tám tượng chibi có hào quang`
- Body: `Tám pho tượng chibi ở Chính Điện và Điện Tam Thế giờ đều có hào quang vàng phía sau đầu, xoay nhẹ như trước đây. Hào quang gắn theo từng vị trí đặt tượng nên vẫn hiện đúng dù tượng là bản GLB hay bản dự phòng.`
- Date: `2026-11-18`. Entry mới lên đầu danh sách (newest-first).

## Nghiệm thu

1. `npm run typecheck` + `npm run build` PASS.
2. Ảnh chụp 8 tượng (góc chính diện từng tượng): hào quang vàng nằm sau đầu, cân giữa, không che mặt tượng, không lơ lửng quá cao/thấp. Tỉ lệ chibi có thể lệch chút so với fallback — nếu ảnh cho thấy hào quang lệch rõ, chỉnh tỉ lệ riêng cho tượng đó (trong khoảng ±0.05) rồi chụp lại.
3. Kiểm tra fallback: chặn 1 URL GLB (ví dụ `chibi-a-di-da.glb`) rồi load lại — tượng fallback hiện lên với hào quang slot, KHÔNG có hai hào quang chồng nhau.
4. Kiểm tra vòng xoay: grep xác nhận `temple.ts` vẫn lặp mảng `halos` và mảng đó giờ chứa hào quang slot (không sửa logic xoay).
5. Không có lỗi console liên quan tới hào quang.

## Commit & Push

- `git add` từng file đã sửa (không `git add -A`).
- `git pull --rebase origin main` trước khi push.
- Một commit duy nhất, message: `feat: hao quang cho 8 tuong chibi trong 2 dien`.
- `git push origin main` (lỗi HTTP 400 thì thử lại một lần với `-c http.postBuffer=524288000`). Không force-push. Lỗi khác thì dừng và báo nguyên văn.
- Báo HEAD mới sau khi push.
