# SPEC — Dựng lại KHUNG chính điện Chùa Online (dán vào Kilo)

Ảnh mẫu: `khung-chinh-dien-v2` (chính điện 3 tầng mái nối liền khối). File sửa chính: `src/hall.ts`. Giữ nguyên: vị trí/kích thước HALL trong `layout.ts`, lưới cột hiện tại, bàn thờ + 5 tượng, bồ đoàn, zone, collider.

## 1. Chẩn đoán bản hiện tại (vì sao nhìn rời rạc)

- 3 tầng mái là 3 hình `roofGeometry` **không độ dày** (mặt phẳng) xếp chồng: chân mái tầng trên (21 × 12 và 10 × 6) rộng hơn hẳn mặt cắt của mái dưới tại cao độ đó → quanh chân mỗi tầng trên là **vành không khí**, nhìn góc nào cũng thấy mái "bay".
- 4 cột chống ngắn (±9, ±4.5, cao 3.2) không chạm đúng vào kết cấu tầng 2 — chỉ đâm xuyên qua mái tầng 1.
- Mái tầng 1 quá khổ (W+9 × D+7.5) và `lift` 1.2 làm 4 góc mái vểnh như cánh giấy, tách khỏi đường xà (beamY = BASE + 8.1).
- `sealArchitectureJoints` chỉ bù được khe hộp đơn trục ≤ 0.9 và bỏ qua cặp chéo/góc — HANDOFF đã ghi chính điện còn ~28 khe lớn. Không vá nữa; dựng lại cho đúng ngay từ đầu.

## 2. Nguyên tắc khung mới — "mọi thứ phải chạm vào nhau"

Chuỗi chịu lực liền mạch, mỗi mắt xích chồng lấp mắt xích kế tiếp tối thiểu 0.15:
**bệ đá → chân cột → thân cột → đấu (cap) → xà ngang/dọc → vành đòn tay → cổ diêm → mái (khối đặc có diềm) → tầng trên lặp lại → nóc + đỉnh vàng.**
Cấm tuyệt đối: bộ phận nào nằm lơ lửng không có điểm tiếp xúc hình học với bộ phận dưới nó.

## 3. Thông số dựng lại (đơn vị = world unit, gốc tại tâm HALL, y tính từ mặt đất)

Giữ nguyên: nền BASE = 1.35, W = 34, D = 20, lưới cột và colH = 7.6 như hiện tại (đấu vàng trên đỉnh cột giữ nguyên).

1. **Hệ xà 2 lớp** tại beamY = BASE + 8.1 (như cũ):
   - Lớp dưới: vành xà chu vi hiện có (giữ) + thêm xà dọc trục giữa.
   - Lớp trên: vành đòn tay (purlin ring) nhỏ hơn (0.4 × 0.4) lùi vào 0.8 so với mặt cột, nằm ngay trên xà qua các đấu phụ — đây là vành mà chân mái tầng 1 TỰA LÊN, không còn khoảng hở 0.3 như hiện tại: chân mái tầng 1 đặt tại đúng beamY + 0.55 (đỉnh vành đòn tay), mặt dưới mái chạm vành.
2. **Mái = khối đặc, không phải mặt phẳng.** Mỗi tầng mái gồm 3 phần gộp 1 group:
   - Thân mái: dùng `roofGeometry` như cũ nhưng thu kích thước (xem mục 4).
   - **Diềm mái (fascia):** vành hộp cao 0.38, dày 0.18 chạy quanh chu vi chân mái, màu ngói đậm hơn — nhìn từ dưới/ngang mái có "thịt", hết cảm giác tờ giấy.
   - **Tấm lót dưới mái (soffit):** mặt phẳng ngang màu gỗ tối che kín mặt dưới chu vi mái, nối diềm mái vào vành đòn tay → nhìn từ dưới lên không thấy khe sáng.
3. **Cổ diêm (clerestory) giữa các tầng — điểm quan trọng nhất:** giữa mái tầng 1–2 và 2–3 dựng 1 vành tường đứng cao 0.9 (tầng dưới) / 0.8 (tầng trên), mặt ngoài đỏ son như cột, khoét ô cửa sổ hoa văn đơn giản (khung hộp vàng + song dọc mảnh, hoặc texture lưới). Chân cổ diêm **chôn sâu 0.3 vào sườn mái dưới**, đỉnh cổ diêm **đỡ trực tiếp chân mái tầng trên**. Nhờ vành tường này, 3 tầng mái thành 1 khối tháp liền, hết vành không khí.
4. **Kích thước mái mới (thu bớt cho cân khung):**
   - Tầng 1: (W + 5) × (D + 4.5), cao 4.4, lift 0.6. Chân mái tại y ≈ BASE + 8.65.
   - Cổ diêm 1: cao 0.9, chu vi lùi vào theo sườn mái tầng 1 tại cao độ đó.
   - Tầng 2: (W × 0.60) × (D × 0.58), cao 3.4, lift 0.5.
   - Cổ diêm 2: cao 0.8.
   - Tầng 3: (W × 0.30) × (D × 0.30), cao 2.4, lift 0.45.
   - Nóc: xà nóc vàng chạy dọc đỉnh tầng 3 + 2 đầu đao cong lên ở 2 đầu + đỉnh chóp vàng (cone như cũ) tại đỉnh. Tổng chiều cao toàn điện ~21–22 (xấp xỉ hiện tại, không lùn đi).
5. **Bỏ hẳn** 4 cột chống (±9, ±4.5) và cơ chế vá `sealArchitectureJoints` cho riêng phần mái (giữ seal cho cột–xà nếu còn cần, nhưng mục tiêu là dựng đúng để `remaining` của chính điện về 0 khe > 0.3).

## 4. Việc kèm theo trong cùng file (lỗi chữ vỡ — commit riêng)

`src/hall.ts` hiện bị lỗi mã hoá: toàn bộ chuỗi tiếng Việt trong file đã thành mojibake (kiểu `Ä áº I HÃ™NG...`), nên hoành phi và câu đối trong game hiển thị chữ vỡ. Khôi phục đúng:
- Hoành phi trước: `ĐẠI HÙNG BẢO ĐIỆN`; hoành phi sau: `PHẬT NHẬT TĂNG HUY`.
- Câu đối 2 cột tiền đường: `Cửa thiền rộng mở đón người về nương Phật` / `Lòng tịnh an nhiên nghe chuông vọng núi xa`.
- Kiểm tra mọi chuỗi tiếng Việt còn lại trong file (comment không quan trọng, chuỗi hiển thị là bắt buộc) và đảm bảo file lưu UTF-8.

## 5. Quy trình & nghiệm thu

1. Làm 2 commit riêng: (a) sửa chuỗi tiếng Việt trong hall.ts, (b) dựng lại khung + mái.
2. `npm run typecheck` pass; log seal của chính điện không còn cảnh báo khe lớn.
3. Screenshot nghiệm thu bắt buộc:
   - Chính diện từ quảng trường: 3 tầng mái liền khối, thấy rõ 2 vành cổ diêm, hoành phi đọc đúng chữ.
   - Góc 3/4 gần 1 góc mái tầng 1: thấy diềm mái có độ dày, góc mái chạm vành đòn tay, không khe sáng.
   - Góc ngang (side view): các tầng xếp chồng thẳng trục, không tầng nào lệch/bay.
   - Nhìn từ dưới hiên lên: soffit kín, không thấy trời qua khe giữa xà và mái.
- Tiêu chí đạt: đứng ở quảng trường nhìn chính điện 3 giây — cảm giác 1 khối kiến trúc duy nhất, không chi tiết nào "dán hờ".
