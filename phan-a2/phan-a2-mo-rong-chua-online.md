# PHẦN A2 — MỞ RỘNG KHUÔN VIÊN, NỘI THẤT, NPC (TỔNG HỢP THIẾT KẾ)

> Trạng thái: **TÀI LIỆU TỔNG HỢP THIẾT KẾ — đã chốt hướng ngày 2026-11-11, CHƯA tách spec.**
> Mỗi mục dưới đây sẽ thành spec riêng (1 spec = 1 session Kilo) khi bắt đầu làm.
> Tài liệu này THAY THẾ trạng thái "Phần A đóng băng" trước đây: user quyết định mở lại
> mặt bằng vì 5 nhà dịch vụ phải nới rộng để chứa nội thất đúng chức năng.
> File kèm trong thư mục này: `Bản đồ Phần A2 v7.png` (bản đồ v7), `Concept A Di Đà.webp`,
> `Concept Di Lặc.webp` (mẫu tượng cho Điện Tam Thế).

## 1. Bản đồ mới

![Bản đồ Phần A2 v7](Ba%CC%89n%20%C4%91o%CC%82%CC%80%20Pha%CC%82%CC%80n%20A2%20v7.png)

Tường bao: **Đông/Tây ±62, Bắc −82, Nam giữ 45** (cũ ±47 / −64 / 45; diện tích +54%).
Trục thiêng giữ nguyên tuyệt đối: tam quan (0,45) → hồ sen (0,22) → sân chùa (0,6) →
chính điện (0,−32) → Điện Tam Thế (0,−54). Tháp chuông (−34,−6), gác trống (34,−6),
hai sân tượng (±28,14), đền trình (11,39), vườn cột kinh, điện mẫu (39,10), khu nghỉ
(27,31), bảo tháp (−17,−52), vườn thiền (−34,−26) giữ nguyên vị trí.

### Hai viện phía sau (mới)

**Viện Khách Tăng** (Tây Bắc, sân riêng, đất x −58..−22, z −78..−54):

| Công trình | Cũ | Mới | Kích thước mới |
|---|---|---|---|
| Nhà khách | (30,−26) | (−47,−61) | 12×8.5 |
| Tăng xá (gộp bắc + tây thành một nhà) | (22,−56) và (−42.6,−14.5) | (−41,−71) | 15×8 |
| Trai đường | (−42.6,−1) | (−29,−61) | 12×7.5 |

Đất tăng xá tây + trai đường cũ trả cho vườn: bãi tre mở rộng phía Tây vườn thiền.

**Viện Tổ — Tưởng niệm** (Đông Bắc, đất x 24..58, z −78..−54):

| Công trình | Cũ | Mới | Kích thước mới |
|---|---|---|---|
| Nhà tổ | (10,−56) | (36,−68) | 12×8.5 |
| Vườn tháp | (36,−48) | quanh (49,−63) | mở rộng ~14×10 |
| Am cổ | (−38,−50) | (53,−75) — góc xa nhất của viện, trong vườn tháp | 6.5×5.5 |

### Các thay đổi còn lại

- **Khu Thiền** (Tây): thiền đường dời (−40,−36) → **(−47,−27)**, nới 8×6.4 → **dọc 9×13,
  mặt tiền hướng Đông vào chính điện**, ôm sát vườn thiền.
- **Vườn Phóng Sinh** (Đông chính điện, ô đất trống cũ): vườn (41,−31) cỡ 30×22,
  **ao phóng sinh 15×11** ở giữa, bến thả cá bờ Tây của ao, lối vào từ hành lang Đông.
- **Phòng Ghi Công Đức** (xây mới): **(−42,35) góc Tây Nam trong tường, 13×9** — to như
  thiền đường, có sư thầy NPC ngồi trực bàn ghi công đức (xem mục 6). KHÔNG đặt ở cổng.
- **Tháp nhỏ** dời (38,−14) → **(34,−15)**: thẳng một cột x=34 với gác trống (34,−6).
- **Hành lang La Hán**: nới bề rộng **3.8 → 5.2** (CORR.half 1.9 → 2.6; cột, đèn lồng,
  ghế đá, tượng dời theo), **giảm còn 6 tượng La Hán mỗi bên**, cách nhau 3 đơn vị,
  xếp dọc mép NGOÀI hành lang cho lối đi thông thoáng.
- **Phố trước cổng** (ngoài tường Nam): mặt đường chạy hết chiều ngang map, dãy quán:
  cơm chay, trà đá ×2, bán chim phóng sinh, bán cá phóng sinh, phở chay; sân cổng riêng
  trước tam quan.

## 2. Đường đi (4 cấp)

1. **Trục chính** (rộng nhất ~4.5): tam quan → cầu → sân → chính điện → Điện Tam Thế.
2. **Đường hậu** z = −46 chạy ngang sau chính điện (vòng chân nền Tam Thế) + **đường
   vành đai** sát tường trong. Cổng hai viện mở ra đường hậu (connector tại x = −30 và
   x = 30).
3. **Lối nhánh** (rộng 2–2.2) tới cửa TỪNG công trình: hai sân tượng, đền trình, khu
   nghỉ, điện mẫu, tháp chuông, gác trống, bảo tháp, phòng công đức, thiền đường
   (từ hành lang Tây), vườn phóng sinh (vào tới bến thả cá + một lối dạo ven bờ Nam ao).
4. **Lối nội bộ hai viện**: Viện Khách Tăng — cổng → sân chung → nhà khách / trai
   đường / tăng xá. Viện Tổ — cổng → nhà tổ → dọc vườn tháp → am cổ.

Mạng đường này đồng thời là **đồ thị đường đi cho NPC** (mục 6) — thay thế các tuyến
"spokes" gõ tay hiện tại.

## 3. Luật vỏ nhà + nội thất

**Luật vỏ nhà (áp cho mọi nhà dịch vụ):**

- Ít cột trong nhà — cột nhiều che hết bảng tên/câu đối.
- Nhà không cần kín: **chỉ xây tường phía SAU**; hai bên và mặt trước để thoáng trên
  cột; **mặt trước đúng 4 cột, hai cột giữa treo bảng tiếng Việt** (bảng tên/câu đối
  như đang áp dụng trong game).
- Đồ nội thất lớn (ban thờ, giường, bàn dài) **bắt buộc có collider** (bài học ghế đá
  hành lang xuyên qua được).
- **Toàn bộ props nội thất phải qua mesh merge** (xem mục 4) — nội thất không được
  làm nặng thêm đúng 5 ngôi nhà đang bị đơ.

**Nội thất từng nhà:**

- **Nhà khách:** bộ bàn trà (bàn gỗ + ghế/đôn) giữa nhà, ấm chén trên bàn, một băng
  ghế dài ở hiên.
- **Tăng xá:** **2 giường gỗ** (khung + chiếu + gối) dọc tường hậu, bàn nhỏ đầu
  giường. Giường là điểm nghỉ THẬT của NPC (mục 6).
- **Trai đường:** bàn ăn dài + băng ghế hai bên, khu bếp giữ như hiện tại.
- **Nhà tổ:** ban thờ tổ ở gian trong — án gian dài, bài vị tổ, lư hương, đôi bình
  hoa (mượn bộ đồ thờ của chính điện thu nhỏ), hai ghế hai bên.
- **Am cổ:** tối giản đúng chất ẩn tu — 1 giường nhỏ, 1 bồ đoàn trước ban thờ nhỏ
  (đã có lư hương), bàn trà mini.
- **Thiền đường:** sàn gỗ nâng, **2 dãy bồ đoàn có lối đi giữa**, bát hương + mõ ở
  đầu dãy. Bồ đoàn phải đăng ký vào hệ `seats` có sẵn để ngồi thiền được thật (và là
  nhà của thời khóa R5 sau này).
- **Phòng Ghi Công Đức:** bàn dài, ghế cho sư thầy trực, kệ/sổ ghi; biển hiệu rõ.

## 4. Trị đơ trên máy thật (S26 Ultra)

Triệu chứng (user báo 2026-11-11): đơ cứng 2–3 giây khi tới gần **nhà khách, tăng xá,
nhà tổ, am cổ, thiền đường** — đúng 5 nhà dùng `buildHouse` / `extraHouse` / builder
riêng của am cổ.

Nguyên nhân khả nghi số 1 (đã kiểm chứng bằng code): `mergeStaticByMaterial` hiện
**chỉ áp dụng trong `longHouse()`** (hai nhà phía Tây — không bị đơ); 5 nhà kia còn
nguyên hàng chục mesh lẻ cast bóng. Cộng dồn: shadow pass + bloom độ phân giải cao +
nạp texture bảng/câu đối lần đầu nhìn thấy.

Việc làm:

1. Mở rộng mesh merge cho `buildHouse`, `extraHouse`, builder am cổ — và mọi props
   nội thất mới (mục 3).
2. Pre-warm lúc loading: `renderer.compile` + nạp trước texture của các bảng hiệu,
   tránh giật ở lần nhìn đầu tiên.
3. **Nghiệm thu bắt buộc:** đo frame-time TRÊN MÁY THẬT (không phải headless) theo
   một tuyến đi cố định qua 5 nhà, có số liệu trước/sau. Không có số đo = chưa xong.

## 5. Điện Tam Thế — DỰNG TỪ ZERO (hạng mục lớn)

**Sự thật đã kiểm chứng 2026-11-11:** Điện Tam Thế **chưa hề tồn tại trong game**.
Trong code chỉ có hằng tọa độ để dành `TAM_THE = {x: 0, z: -54}` (layout.ts) và hai
ghi chú lấy nó làm mốc ("Bảo Tháp phía Tây Điện Tam Thế", "Nhà Tổ sau Điện Tam Thế").
Đợt xây GĐ2 đã dựng các nhà xung quanh nhưng bỏ sót chính điện này — đó là lý do
không có bất kỳ ảnh nghiệm thu nào của nó.

Dựng mới:

- Nền cao ~3.0 tại (0,−54) như tổng mặt bằng gốc, điện thờ trên nền, bậc lên từ
  đường trục.
- **Bộ ba tượng Tam Thế** trên bệ thờ: **A Di Đà (trái) — Thích Ca (giữa, lớn nhất)
  — Di Lặc (phải)**; ban thờ phía trước (bát hương, hoa, đèn).
- Mẫu tượng: Thích Ca dùng concept Phật Tổ đã duyệt; A Di Đà và Di Lặc dùng
  `Concept A Di Đà.webp` + `Concept Di Lặc.webp` kèm tài liệu này (cùng hệ chống
  creepy: mặt trơn, chi tiết vẽ bằng nét cong, không hốc mắt/mũi sắc).
- Ghế ngồi thiền / zone thắp hương trước điện như chính điện nếu khuôn viên cho
  phép — chốt ở spec riêng.

## 6. NPC — mở rộng + tổ chức lại

- **Roster 5 → 12 NPC:** thêm 1 sư thầy, 2 chú tiểu, 3–5 phật tử đi lễ. Hai NPC
  trùng tên "Tiểu Quét Lá" phải đặt tên riêng. Thêm **NPC sư thầy trực bàn công
  đức** — ngồi cố định tại Phòng Ghi Công Đức, ghi công đức cho khách (NPC này
  đứng yên là ĐÚNG vai).
- **Di chuyển theo mạng đường** (mục 2) thay cho spokes gõ tay; khách đi lễ đi hết
  vòng trục + rẽ vào các khu mới (vườn phóng sinh, phòng công đức, hai viện chỉ
  tới cổng).
- **Tiểu Đánh Chuông hết đứng yên:** đi lại quanh tháp chuông/vườn cột kinh, chỉ
  về tháp đánh chuông đúng các khung BELL_TIMES (05:00, 12:00, 18:00, 20:00).
- **Ca trực + nghỉ ngơi:** NPC làm nhiệm vụ theo ca (quét sân, quét cầu, đánh
  chuông, trực bàn...). Hết ca, NPC về **tăng xá nằm lên 1 trong 2 giường** ngủ
  nghỉ (cần tư thế nằm cho NPC), NPC khác ra thay. Tối đa 2 NPC nghỉ cùng lúc
  (= số giường).

## 7. Lỗi lẻ kèm theo

- **Chuông treo ngược:** profile lathe của chuông trong temple.ts đang loe dần từ
  r 0.2 (đáy) lên r 0.95 (đỉnh) — ngược với chuông thật (chóp nhỏ trên, miệng loe
  dưới). Lật lại profile.
- **Ghế đá dọc hành lang không có collider** (đi xuyên qua) — bổ sung; rà soát
  luôn collider của tượng La Hán khi xếp lại 6 tượng/bên.
- Tháp nhỏ (PAGODA) còn 5 khoảng hở lớn giữa các tầng mái — xử lý nếu gói cho
  phép, không chặn nghiệm thu A2.

## 8. Phố + phóng sinh (giữ chỗ — cơ chế viết spec riêng sau)

Vòng lặp đã chốt hướng: **mua chim/cá ở phố bằng xu → mang qua cổng → thả ở Vườn
Phóng Sinh** (cá xuống ao, chim lên cây trong vườn) → nhận công đức. Giá, mức công
đức, giới hạn chống cày theo ngày sẽ tính ở spec riêng (cỡ R2/R3). Ghi công đức tại
Phòng Ghi Công Đức là ghi danh TRONG GAME (nối với bia công đức R3.3), tuyệt đối
không dính tiền thật.

## 9. Đề xuất chia gói (chờ user chốt thứ tự)

1. **A2.1** Mở map + dời/nới nhà + mạng đường (nền cho mọi gói sau).
2. **A2.2** Trị đơ (merge + pre-warm + đo máy thật) + lỗi lẻ (chuông, collider).
3. **A2.3** Nội thất 6 nhà theo mục 3.
4. **A2.4** Điện Tam Thế + bộ ba tượng.
5. **A2.5** NPC mở rộng + ca trực/nghỉ + di chuyển theo mạng đường.

Fable 5.2 cho tượng/audit: **để sau** (quyết định của user 2026-11-11) — mặc định
vẫn Kilo + Sonnet như hiện tại.
