# HANDOFF — Bản đồ gợi ý mở rộng chùa 24/7 (game)

- **Ngày:** 2026-11-17. **Người chốt thiết kế:** user (jenyfer).
- **Trạng thái:** THIẾT KẾ XONG dưới dạng bản đồ tương tác. CHƯA THI CÔNG
  trong game — chưa có code, chưa có model 3D cho hạng mục mới.
- **Bản đồ tương tác (artifact):** "Bản đồ gợi ý mở rộng chùa 24/7",
  slug `ban-do-goi-y-mo-rong-chua-24-7` — mở trong app Muse để xem,
  bấm ghim số 1–11 để xem thẻ chi tiết từng hạng mục.
- **Mục đích file này:** để session sau (Kilo / Muse ở nhà) tiếp tục
  được việc mở rộng mà không cần hỏi lại user những gì đã chốt.
  Mọi tọa độ dưới đây là số CUỐI CÙNG sau tất cả lần sửa của user
  trong ngày 2026-11-17.

## 1. Hệ tọa độ (bắt buộc dùng đúng)

- Đơn vị: mét trong game, theo `src/layout.ts`. Trục x ngang,
  **Đông = x dương**; trục z dọc, **Bắc = z âm, Nam = z dương**.
  Bắc lên trên bản đồ.
- Cổng chính phía Nam tại (0, 45). Trục thần đạo là đường x = 0,
  phải luôn thông suốt, không đặt vật cản lên trục.

## 2. Khuôn viên HIỆN TẠI (nền của bản đồ)

Số liệu từ `src/layout.ts` tại HEAD `26c54a1` (repo `byluvtn/ChuaOnline`):

- Tường: x ±62, Bắc z = −82, Nam z = 45. Cổng Nam (0, 45),
  rộng 4.4 mỗi bên trục.
- Tam Quan (0, 45) · Đền Trình (11, 39) · Hồ cá koi (0, 22, elip a 9 × b 6.5)
  + Cầu (x 0, z 14.2–29.8) · Thủy Đình/bến (−6.7, 23) · Bồn hoa (±16.5, 23)
  · Sân Phật Tây (−28, 14) · Sân Quan Âm (28, 14) · Điện Mẫu (39, 10)
  · Điện Pháp Chủ = chính điện (0, −32), nửa rộng 17 × nửa sâu 10, bệ 1.35
  · Tháp nhỏ (34, −15) · Vườn Thiền (−34, −26) · Thiền đường (−47, −27)
  · Vườn Phóng Sinh: ao (41, −31, elip a 7.5 × b 5.5) + bến thả
  · Điện Tam Thế (0, −68), nền cao 3.0, thang lớn giữa trục
  · Nhà Tổ (36, −68) · Nhà khách (−47, −61) · Trai đường (−29, −61)
  · Am Cổ (53, −75) · Viện Khách Tăng (x −58..−22, z −80..−54, có rào)
  · Viện Tổ (x 24..58, z −80..−54, có rào)
- Tháp chuông, Gác trống, Bảo Tháp, Phòng ghi công đức, Khu nghỉ,
  Quảng trường: xem mục 3 — user đã dời/đổi các hạng mục này trên
  bản đồ (vị trí trong game hiện tại KHÁC vị trí trên bản đồ mới).

## 3. Cân đối phong thủy — vị trí MỚI của công trình hiện có (ĐÃ CHỐT)

User ra lệnh cân đối phong thủy ngày 2026-11-17. Bản đồ vẽ vị trí MỚI
dưới đây. **Lưu ý:** đây là quyết định trên BẢN ĐỒ — việc có áp các
lần dời này vào game thật hay không là quyết định riêng, chưa ra lệnh.

- **Đông chuông, Tây trống** (quy tắc cổ; trong game hiện đang ngược):
  Tháp chuông (−34, −6) → **(34, −6)**; Gác trống (34, −6) → **(−34, −6)**.
  Chuông = Thanh Long (Đông, dương, tiếng vang xa); trống = Bạch Hổ (Tây).
  Hai gác đối xứng qua trục, ôm sân trước chính điện.
- **Bảo Tháp** (−30, −38) → **(−34, −15)**, ngay SAU Gác trống (−34, −6),
  đối diện sang tháp chuông phía Đông; đối xứng với Tháp nhỏ (34, −15).
  Hai hàng tháp hai bên sân trước điện: Tây có Gác trống + Bảo Tháp,
  Đông có Tháp chuông + Tháp nhỏ. Khu đất cũ (−30, −38) thành vườn thiền,
  nối với Vườn Thiền (−34, −26). (User đã BÁC ý đặt Bảo Tháp làm tâm
  Vườn Tháp ở (50, −84) — không dùng vị trí đó.)
- **Phòng ghi công đức ↔ Khu nghỉ** đổi chỗ + căn đối xứng:
  Phòng công đức (−42, 35) → **(35, 33)** (Đông-Nam = tài vị, Tốn);
  Khu nghỉ (27, 31) → **(−35, 33)** (Tây-Nam = Khôn, đất, nghỉ ngơi).
  Cặp đối xứng (±35, 33) ôm sân trước phía Nam.
- **Viện Tổ + Viện Khách Tăng GIỮ NGUYÊN vị trí** (đã đối xứng qua trục
  x ±(22..58), z −80..−54, ôm Điện Tam Thế): Viện Tổ (Đông-Bắc) +
  Vườn Tháp = khu tổ tiên; Viện Khách Tăng (Tây-Bắc) + Tăng xá +
  Tịnh thất (mục 4.3) = khu tăng xá.
- **Quảng trường BỎ** (user đồng ý): không vẽ Quảng trường (0, 6, r 8.4).
  Đường trục chạy thẳng từ cầu hồ tới thềm Điện Pháp Chủ. Sân tụ họp
  chính là sân trước điện (giữa hai gác chuông/trống và điện).
- **Hồ cá koi mở rộng + XOAY NGANG** lấp chỗ quảng trường:
  (0, 22, a 9 × b 6.5) → **(0, 14, elip a 14 × b 10, ngang)** — hồ rộng
  x −14..14, z 4..24, nằm giữa nhãn Sân trước điện (phía Bắc hồ) và
  nhãn Hồ cá koi. Dải đất z −2..4 phía Bắc hồ là sân trước điện.
  Cầu trục kéo dài z 14.2–29.8 → **z 2..26**, qua hết hồ mới.
  Thủy Đình/bến (−6.7, 23) và Bồn hoa (±16.5, 23) giữ nguyên.
- **Ghi tên đầy đủ mọi công trình/khu vực trên bản đồ** (user thấy có
  chỗ chưa ghi tên): đã rà soát nhãn tất cả các khối — đặc biệt Tháp nhỏ
  (34, −15), Thiền đường (−47, −27), vườn thiền ở chỗ cũ Bảo Tháp
  (−30, −38). Không để khối nào không có nhãn.

## 4. Đề xuất MỞ RỘNG — 11 hạng mục (đánh số theo bản đồ)

- Tường mới: **x ±92, Bắc z = −122**, Nam giữ 45. Khuôn viên từ
  124×127 m thành 184×167 m. Dải cây "hậu chẩm" dời lên dọc tường
  Bắc mới (z −116..−122).
- Cổng phụ: Tây (−92, 2) và Đông (92, 2), trên đường ngang z = 2,
  cổng nhỏ 1 lối. Phía Bắc KHÔNG mở cổng (núi thiêng chắn sau).

### Phía Tây (x −62 → −92) — đời sống tu hành + hồ sen

- **2. Vườn rau chùa + ao sen** — tâm (−76, −42), vùng x −88..−64,
  z −55..−30. Luống rau, ao sen nhỏ, nhà kho nông cụ. Gắn gameplay:
  chấp tác hái rau (hệ thống vườn + rota chấp tác R5.2).
- **3. Tăng xá + Tịnh thất — DI DỜI từ Viện Khách Tăng** — toàn bộ
  tăng xá dời KHỎI Viện Khách Tăng ra khu mới phía Tây, vùng
  x −70..−58, z −78..−62 (ngoài tường Tây cũ), gồm nhà tăng xá +
  3 am tịnh thất nhỏ thành MỘT khu cư xá tăng đoàn thống nhất.
  Vị trí cũ (−41, −71) trong Viện Khách Tăng bỏ trống, không vẽ
  tăng xá trong viện nữa. Am yên tĩnh cho sư nghỉ + người chơi
  "tịnh tu" (gắn lộ trình tu sĩ Phần C/R5).
- **4. Hồ sen Tây + đình ngắm sen** — hồ (−78, −2), elip a 10 × b 7;
  đình (−70, 5). Dời từ Đông sang Tây (đổi chỗ với rừng trúc).
  Cầu nhỏ qua hồ tại z 2 (nối đường ngang ra cổng Tây — BẮT BUỘC,
  nếu không hồ cắt đường ra cổng). Điểm thả đèn hoa đăng thứ hai +
  ngắm sen.

### Phía Đông (x 62 → 92) — thờ tự + nghỉ ngơi + rừng trúc

- **1. Rừng trúc + đường thiền hành** — tâm (80, −3), vùng x 70..90,
  z −20..14. Dời từ Tây sang Đông (đổi chỗ với hồ sen, chiếm khu hồ cũ);
  sông Đông ở ngay phía Tây rừng. Vòng đường lát đá trong rừng trúc,
  ghế đá nghỉ chân. Gắn gameplay: nhiệm vụ thiền hành ngoài trời.
- **5. Điện Dược Sư** — (77, −38), nền 12×9. Điện thờ Phật Dược Sư,
  điểm cầu an sức khỏe (nghi lễ mới: dâng đèn Dược Sư).
- **6. Vườn hoa + đồi cỏ** — tâm (79, 28), vùng x 68..90, z 15..40.
  Ao cuối sông Đông (65, 16) ở góc Tây-Bắc vườn. Sân cỏ, vườn hoa
  bốn mùa, ghế đá — khu nghỉ ngơi phía Đông.
- **11. Sông Đông** — dải nước x 63..67, z −82..14, chảy từ chân đồi
  Bắc xuống Nam dọc hành lang giữa Viện Tổ (mép Đông x 58) và Điện
  Dược Sư (mép Tây x 71), ngay phía Đông tường cũ (x 62). Rộng ~4 m,
  bờ đá. 2 cầu đá nhỏ: cầu Bắc z −38 (nối khuôn viên cũ sang Điện
  Dược Sư), cầu Giữa z 2 (trên đường ngang ra cổng Đông — BẮT BUỘC,
  nếu không sông cắt đường ra cổng). Cuối sông là ao nhỏ (65, 16)
  ở góc Tây-Bắc vườn hoa. Gắn gameplay: đường thiền hành bờ sông;
  thả đèn hoa đăng trôi sông (điểm thả đèn thứ ba, khác hồ sen);
  điểm chụp ảnh trên cầu.
  (Lịch sử: user thêm sông vì khu Đông trống, rồi dời sông vào hành
  lang giữa Dược Sư và Viện Tổ. Bản đồ hiện vẽ sông kết thúc ở z 14
  với ao ở (65, 16) — user chưa yêu cầu kéo dài lại về phía Nam.)

### Phía Bắc (z −82 → −122) — đích linh thiêng nhất

- **7. Đồi Chùa Ngọc + 299 bậc** — đỉnh (0, −112), thang đá dọc trục
  từ z −82 lên −112, 299 bậc (như Tam Chúc). Chùa Ngọc nhỏ trên đỉnh
  đồi, nền cao ~6 — đích cao nhất MỚI của trục thần đạo, sau Điện
  Tam Thế. Thiết kế thang xem mục 5.
- **8. Động thiền (hang đá)** — (−26, −104). Hang đá thiền định kiểu
  động Hương Tích (Chùa Hương), điểm hành hương yên tĩnh trong cùng.
- **9. Rừng thông + đường núi** — hai dải x ±(12..40), z −86..−118,
  đường núi uốn lượn với 2 nhà nghỉ chân.
- **10. Vườn Tháp — DI DỜI từ Viện Tổ** — toàn bộ vườn tháp dời KHỎI
  Viện Tổ ra khu mới phía Bắc, vùng x 40..60, z −106..−82 (ngoài
  tường Bắc cũ, không còn chồng lên Viện Tổ). Một khu tháp mộ duy
  nhất với tháp mộ + cây cổ thụ. Vị trí cũ (49, −63) trong Viện Tổ
  bỏ trống, không vẽ vườn tháp trong viện nữa.

## 5. Chùa Ngọc 299 bậc — thiết kế chi tiết (đã chốt trên bản đồ)

- Thang thẳng dọc trục từ tường Bắc cũ (z −82) lên đỉnh (0, −112),
  dài 30 m, cao 0 → ~6. Rộng ~4.2 (như thang Tam Thế).
- 299 bậc nông — bước sâu ~0.094 m, cao ~0.02 m mỗi bậc — chia 3 đợt
  (99 + 100 + 100) với 2 chiếu nghỉ có đèn đá + ghế đá.
- Mẫu kỹ thuật (đã kiểm chứng trong code): thang Tam Thế trong
  `layout.ts` (20 bậc, bước sâu 0.38, `groundY()` tính cao độ từng bậc
  tại `layout.ts:134-136`); thang Ngọc mở rộng `groundY` theo đúng mẫu
  đó, vẽ bằng 1 mesh gộp duy nhất (không tách 299 mesh — hiệu năng),
  collider 2 bên thang.
- Chùa Ngọc: tháp đá granite 3 tầng kiểu Tam Chúc, thu nhỏ theo tỉ lệ
  game (~7–8 m, KHÔNG lấy đúng 15 m thật).
- Gắn gameplay: hành hương leo 299 bậc lên đỉnh (nhiệm vụ + công đức),
  điểm ngắm toàn cảnh chùa từ nơi cao nhất, dâng hương tại Chùa Ngọc.
- Tham khảo thực tế: chùa Tam Chúc (Hà Nam) — 299 bậc lên Chùa Ngọc,
  tháp granite 3 tầng, cao 15 m, đỉnh 468 m. Có bản đồ Tam Chúc riêng
  (artifact slug `ban-do-chua-tam-chuc`) để đối chiếu, KHÔNG phải
  bản đồ game.

## 6. Nguyên tắc thiết kế (ghi trên bản đồ)

- Trục thần đạo x = 0 luôn thông suốt; linh thiêng tăng dần về Bắc
  (cổng 0 → Pháp Chủ 1.35 → Tam Thế 3.0 → Chùa Ngọc ~6).
- Tây = đời sống tu hành (vườn rau, tăng xá) + hồ sen; Đông = thờ tự
  (Dược Sư) + nghỉ ngơi (rừng trúc, vườn hoa, sông); Bắc = núi thiêng
  làm đích.
- Nước ở phía trước (Nam), núi/rừng ở phía sau (Bắc) làm hậu chẩm.
  Sông Đông chảy dọc hành lang giữa Viện Tổ và Điện Dược Sư, từ núi
  Bắc xuống ao ở góc vườn hoa — dòng chảy dọc Đông, không phá trục chính.
- Không đặt công trình mới lên trục chính hay chồng lên hạng mục đã có.
- Phong thủy: đông chuông tây trống; tài vị Đông-Nam (phòng công đức),
  Khôn Tây-Nam (khu nghỉ); Bảo Tháp sau gác trống, đối xứng Tháp nhỏ;
  tổ tiên Đông-Bắc, tăng xá Tây-Bắc; quảng trường bỏ, trục thông thẳng
  từ cầu tới điện.

## 7. Kế hoạch thi công trong game (KHI user ra lệnh — chưa ra lệnh)

Thứ tự gợi ý: tường + cổng trước, rồi hạng mục Tây/Đông, rồi khu Bắc
(thang Ngọc + tháp) cuối cùng vì nặng nhất.

1. **`src/layout.ts`:** sửa `WALL` (x 92, zN −122), `clampToCompound()`
   (hiện tại `layout.ts:238-242`, tường ±62/−82/45, cổng ±4.4),
   `blocked()`, vùng sinh cảnh (scenery spawn bounds).
2. **Collider** cho từng hạng mục mới (tường mới, điện, tháp, cầu,
   bờ sông, thang Ngọc 2 bên). Cổng phụ (±92, 2) phải mở được như
   cổng Nam (khe ±4.4).
3. **Thang Ngọc:** mở rộng `groundYBase`/`groundY` (`layout.ts:91, 167`)
   theo mẫu thang Tam Thế; 299 bậc = 1 mesh gộp duy nhất.
4. **Hiệu năng (bắt buộc):** mọi công trình mới phải qua mesh merge
   (`mergeStaticByMaterial`) — 5 nhà cũ không qua merge vẫn gây
   đứng hình 2–3s trên Galaxy S26 Ultra. Không lặp lại lỗi đó.
5. **Đường đi NPC/thú:** `shared/roads.ts` (`ROAD_NODES`) cần thêm
   node cho khu mới, nếu không NPC không đi tới được; thêm điểm đến
   mới vào `SPREAD_ROUTE_POOL` trong `server/npcs.ts`.
6. **Phong thủy (mục 3):** nếu user ra lệnh áp vào game thật thì dời
   tháp chuông/trống, Bảo Tháp, phòng công đức/khu nghỉ, bỏ quảng
   trường, mở rộng + xoay ngang hồ cá koi, kéo dài cầu — làm riêng
   1 đợt, kiểm chứng bằng ảnh trong game.
7. **Gameplay mới (theo từng hạng mục):** dâng đèn Dược Sư (mục 5),
   nhiệm vụ hành hương 299 bậc (mục 7), thiền hành rừng trúc/bờ sông
   (mục 1, 11), điểm thả đèn thứ 2 (hồ sen Tây) + thứ 3 (sông Đông).
8. **Luật tin:** khi thi công xong và phát hành, phải có mục tin trong
   `src/data/news.ts` (luật đứng của dự án: release không có tin thì
   không đạt nghiệm thu).
9. **Nghiệm thu:** ảnh chụp trong game ở từng hạng mục mới + kiểm tra
   không kẹt đường (đi bộ từ cổng Nam lên Chùa Ngọc phải thông),
   đo frame-time trên điện thoại thật ở khu mới.

## 8. Chưa quyết / việc còn lại

- User chưa ra lệnh thi công — chưa biết làm hay không, làm khi nào,
  làm theo thứ tự nào. Không tự ý code khi chưa có lệnh.
- Có áp các lần dời phong thủy (mục 3) vào game thật hay không.
- Sông Đông có kéo dài lại về phía Nam hay giữ như bản đồ (kết thúc
  ở z 14, ao ở (65, 16)).
- Model 3D cho công trình mới (Điện Dược Sư, tháp Chùa Ngọc, động
  thiền, đình ngắm sen): code procedural như các công trình hiện có,
  hay GLB vẽ bằng Blender (user đang định học Blender để vẽ điện chùa).
- Quy mô Chùa Ngọc (~7–8 m) cần kiểm chứng bằng mắt trong game khi
  thi công — số 7–8 m chỉ là ước lượng theo tỉ lệ.

## 9. Quan hệ với các tài liệu khác

- `spec-ban-do-tong-the-chua-online.md` (masterplan BẢN CUỐI): bản
  quy hoạch GỐC của khuôn viên hiện tại — bản mở rộng này NỐI TIẾP
  nó, không thay thế. Tường hiện tại ±62/−82 chính là kết quả của
  A2.1 (đã thi công xong).
- `spec-a2-1-mo-rong-ban-do-chua-online.md`: đợt mở rộng TRƯỚC
  (đã xong) — đừng nhầm với đợt này.
- Phần C/R5 (`phan-b-he-thong-r1-r4-chua-online.md`, cuối file): lộ
  trình tu sĩ — tăng xá/tịnh thất (mục 4.3) và chấp tác vườn rau
  (mục 4.2) gắn với R5.2.
- Bản đồ Tam Chúc thật (artifact `ban-do-chua-tam-chuc`): tham khảo
  thực tế cho Chùa Ngọc 299 bậc, không phải bản đồ game.
