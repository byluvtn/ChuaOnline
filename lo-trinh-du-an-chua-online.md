# LỘ TRÌNH DỰ ÁN CHÙA ONLINE — GĐ1 → GĐ2 → GĐ3 → R1 → R2 → R3 → R4

> File lộ trình duy nhất, chứa nội dung cụ thể của mọi giai đoạn theo đúng thứ tự
> người dùng chốt ngày 2026-11-10: **xây xong toàn bộ khuôn viên trước
> (GĐ1 → GĐ2 → GĐ3), rồi mới làm các gói hệ thống (R1 → R2 → R3 → R4)**.
>
> Nguồn nội dung: masterplan bản cuối (`spec-ban-do-tong-the-chua-online.md`),
> spec thi công GĐ1 (`spec-giai-doan-1-chua-online.md`), bản đối chiếu
> chuaonline.org (`doi-chieu-chuaonline-org.md`). File này là **lộ trình**;
> khi bắt đầu từng gói/hạng mục sẽ tách spec thi công riêng đối chiếu code tại
> thời điểm đó. Tọa độ theo `src/layout.ts`: Bắc = z âm, Nam = z dương, cổng
> chính phía Nam (z = 45), chính điện phía Bắc (z = −32).

## Trạng thái tại ngày lập (2026-11-10, HEAD `6871320`)

- Đã xong: khuôn viên cơ bản (tam quan dạng cổng, hồ + cầu, quảng trường, chính
  điện = Điện Pháp Chủ cao 22.47, tháp chuông, sân tượng Quan Âm tại (28, 14)
  (thay tháp — quyết định của chủ dự án 11/11, commit `0dfbf6d`), Vườn
  Thiền, khu nghỉ, 2 bồn hoa), tượng Phật Tổ + Quan Âm, admin account + free cam,
  database người chơi trên Turso (72 tài khoản, sống qua restart).
- Hệ thống đã có: tài khoản, Sen + công đức + cấp, socket.io multiplayer nhiều
  phòng, chat, 14 nhiệm vụ ngày + 3 nhiệm vụ tuần, tụng kinh 3 bài, shop 22 món /
  11 nhóm, xếp hạng, minigame theo ngày, feedback.
- Đang chạy: **GĐ1 Gói 1 (Gác Trống)**.

## Quy tắc xuyên suốt mọi giai đoạn

- 1 gói việc = 1 session Kilo = 1 commit riêng; `git add` từng đường dẫn, không
  `git add -A`; không gộp gói.
- Công trình mới: có collider, có vùng cấm trong `blocked()` khi cần,
  `sealArchitectureJoints` + báo cáo gapdump, dùng lại vật liệu sẵn có
  (`tileM`, `redM`, `goldM`, `stoneM`, `lamb(...)`).
- **Không dùng chữ Hán** ở bất cứ đâu; chữ trên cột/bảng/hoành phi chỉ tiếng Việt.
- Nghiệm thu: `npm run typecheck` pass; ảnh chụp **vào `shots/`** (không xoá sau
  khi chụp); đi thử bằng nhân vật thật trong game, không chỉ mô phỏng hàm.
- Nội dung (quẻ xăm, lời giải, câu chữ) **tự viết** — không sao chép từ
  chuaonline.org hay bất kỳ game nào khác.

---

# PHẦN A — KHUÔN VIÊN

## GĐ1 — Hoàn thiện trong tường hiện tại (6 gói, thứ tự cố định)

### Gói 1 — Gác Trống (34, −6) · ĐANG LÀM
- Dựng tháp trống đối xứng tháp chuông (−34, −6) qua trục, dùng lại hàm
  `tower()` trong `src/temple.ts`; trong khung đặt **trống lớn nằm ngang**
  (thân trụ r ~0.85, dài ~1.1, thân đỏ sẫm, 2 mặt da bò) trên giá gỗ thay cho
  chuông.
- Sửa lỗi sẵn có: `tower()` luôn lấy bảng câu đối `chuong` → sửa để dùng đúng
  theo `coupletId`; thêm `COLUMN_LABELS.trong` ("Trống vọng sân thiền tan phiền
  não" / "Âm vang cửa Phật tỏ lòng thành") và `COUPLETS.trong`.
- Tương tác gõ trống: nhân bản cơ chế `ringBell` thành `ringDrum` (temple →
  world → điểm gọi trong `main.ts`); zone `trong` r 7; `DRUM` + vòng cấm r 7
  trong `blocked()`; lối lát đá `pathRect` tới tháp.
- Commit: `feat: drum tower mirroring bell tower (masterplan GD1)`.
- Nghiệm thu: ảnh quảng trường thấy cả chuông (Tây) + trống (Đông); cận cảnh
  mặt trống + bảng THÁP TRỐNG.

### Gói 2 — Đền Trình (9, 39)
- Đền nhỏ một gian **ngay trong cổng phía Đông**, mặt tiền quay Tây về đường
  trục (`rotation.y ≈ −π/2`): bệ đá 4.4 × 3.6 cao 0.35; 4 cột đỏ r 0.16 cao 2.4;
  tường hậu + 2 tường hông thấp (`wallM`); mái `roofGeometry(5.6, 4.6, 1.5, 0.6)`;
  trong đền có bàn thờ đá + lư hương + 2 đôn đá; bảng `ĐỀN TRÌNH` +
  `COLUMN_LABELS.denTrinh`; `COUPLETS.denTrinh`.
- `DEN_TRINH` + vòng cấm r 5.5 trong `blocked()`; collider cột r 0.25, bàn thờ
  r 0.8; zone `denTrinh` r 5; `pathRect` nối từ đường trục sang đền.
- Chỉ là công trình + zone + popup — **chưa gắn nhiệm vụ hành hương** (để spec
  gameplay riêng sau).
- Commit: `feat: Den Trinh shrine inside the gate (masterplan GD1)`.
- Nghiệm thu: ảnh từ ngoài cổng (thấy tam quan + đền phía Đông); ảnh mặt tiền
  từ trên trục; cận cảnh bàn thờ/lư hương.

### Gói 3 — Tam Quan thành cổng 3 lối, mái 2 tầng (0, 45)
- Biến 2 khối đặc đỏ hai bên cổng (hiện **không có collider, đi xuyên được**)
  thành **2 lối phụ thật**: mỗi lối gồm 2 cột đỏ 0.8 × 4.6 cách nhau ~2.2,
  xà ngang y 4.7, mái nhỏ riêng `roofGeometry(4.6, 3.6, 1.2, 0.5)` ở y ~5.4;
  collider cột mới r 0.55.
- Thêm **tầng mái 2** cho lối giữa: `roofGeometry(gate*2 + 4.2, 4.2, 1.5, 0.6)`
  ở y ~9.2 + chóp vàng; cổng cao tổng ~11. Giữ nguyên cột chính, bảng
  CHÙA ONLINE, bảng câu đối, zone `tamQuan`.
- Chạy lại seal + gapdump cho nhóm `gate`. Chỉ sửa khối cổng trong
  `src/temple.ts`.
- Commit: `feat: three-passage two-roof tam quan gate (masterplan GD1)`.
- Nghiệm thu: chính diện từ ngoài (đủ 3 lối + 2 tầng mái); góc 3/4 từ trong
  sân; ảnh nhân vật đứng trong lối phụ.

### Gói 4 — Vườn Cột Kinh (±3.4, z −3.2..−10.4)
- 2 hàng cột đá khắc kinh dẫn từ quảng trường lên chính điện: **5 cột/bên**,
  z = −3.2, −5.0, −6.8, −8.6, −10.4, bước 1.8. Không sửa `layout.ts` (vùng đã
  nằm trong vùng cấm trục của `blocked()`; sàn bồ đoàn bắt đầu ở |x| 4.6 nên
  không chồng).
- Mỗi cột: bệ đá 1.1 × 0.5 × 1.1; thân vuông 0.72 × 4.2 × 0.72 với **texture
  canvas khắc chữ tiếng Việt chạy dọc** ("NAM MÔ A DI ĐÀ PHẬT" / "TÂM TỊNH
  PHẬT TỊNH" — thuần Việt, không chữ Hán); phiến đầu 0.95 × 0.18 × 0.95 + cầu
  vàng r 0.14. Cao tổng ~5.1; collider r 0.6/cột; glow nhẹ chỉ ở 2 cột đầu hàng.
- Commit: `feat: sutra pillar rows along the axis (masterplan GD1)`.
- Nghiệm thu: ảnh từ quảng trường nhìn dọc trục; cận cảnh chữ khắc trên 1 cột;
  đi thử giữa hai hàng.

### Gói 5 — Thủy Đình (−6.5, 23) + cầu nối bờ Tây
- Đình nhỏ **trên mặt hồ** phía Tây cầu trục — gói duy nhất của GĐ1 đụng logic
  nước. Thêm hằng `PIER = { x0: −10.6, x1: −4.4, z: 23, hw: 1.6, y: 0.55 }`:
  `groundY()` trả chiều cao sàn trong hình chữ nhật PIER; `resolveWater()` bỏ
  qua điểm trong PIER (nới 0.2) — phần hồ còn lại giữ nguyên hành vi đẩy ra bờ.
- Sàn chạy suốt PIER + lan can thấp đoạn trên nước + cọc gỗ chìm dưới sàn;
  đình tại (−6.7, 23): sàn 4.4 × 3.4, 4 cột đỏ r 0.16 cao 2.6, mái
  `roofGeometry(5.8, 5.0, 1.6, 0.6)`, bảng `THỦY ĐÌNH` quay Đông; **3 ghế
  ngồi** (`seats.push`: Đông, Bắc, Nam); collider cột r 0.25; zone `thuyDinh`
  r 4.5; `COUPLETS.thuyDinh`.
- Mở rộng có điều kiện: nếu tìm thấy điểm gọi `spawnLantern` sẵn trong
  `main.ts` trong ≤ 15 phút thì gắn tương tác thả đèn tại đình; không thì bỏ
  qua và báo cáo.
- Điểm neo x0 = −10.6 phải kiểm tra không đè hoa bồn Tây khi nghiệm thu; nếu
  đè thì dịch cả PIER xuống z = 24.2.
- Commit: `feat: Thuy Dinh pavilion on the lake (masterplan GD1)`.
- Nghiệm thu: ảnh từ cầu nhìn sang; ảnh từ đình nhìn về cầu/cổng; đi thử từ bờ
  ra đình + ngồi ghế; ảnh chứng minh phần hồ còn lại vẫn đẩy người ra bờ.

### Gói 6 — Hành lang La Hán (±20.5, z −19..−1)
- Hành lang đã có mái/cột/ghế — gói này **chỉ thêm tượng, không sửa cấu trúc**.
  Thêm `buildArhat(variant 0|1|2)` trong `src/statues.ts` theo quy tắc tượng
  của dự án: khối tròn trịa, **mặt vẽ texture, mắt là nét cong nhắm, không tạc
  hốc mắt/sống mũi**, tay là khối tròn không ngón; 3 biến thể tư thế tay (để
  trong lòng / một tay nâng / ôm bát); áo luân phiên vàng đất, xám lam, nâu;
  tượng ngồi cao ~1.15.
- Đặt **10 tượng/bên (tổng 20)** trên bệ đá 0.8 × 0.55 × 0.8, quay mặt vào
  trục, z từ −18.2 tới −1.8 bước ~1.82, lệch ngang **luân phiên hàng trong
  (−side × 1.5) / hàng ngoài (+side × 1.5)** để tránh ghế (z ≈ −16.6, −9.4,
  −2.2) và cột hành lang (lệch ±1.7, z −18.4/−14.8/−11.2/−7.6/−4.0); vị trí
  chồng thì dịch z ±0.3 và ghi lại. Collider r 0.42/tượng. Không thêm zone.
- Commit: `feat: arhat statues along both corridors (masterplan GD1)`.
- Nghiệm thu: ảnh dọc hành lang Đông; cận cảnh 1 tượng chính diện (chấm theo
  quy tắc chống kinh dị); đi thử dọc hành lang không kẹt.

### Mục tùy chọn 9b — Hành lang vòng quanh quảng trường
- Sau Gói 6, nếu muốn: kéo dài hành lang nối vòng quanh PLAZA thành khung bao
  sân kiểu Bái Đính (cập nhật `CORR` + `blocked()`). Chỉ làm nếu không chật
  trục/đường ngang z = 2.

**Cổng qua GĐ2:** chụp 1 ảnh toàn cảnh admin cam đối chiếu masterplan, nghiệm
thu tổng GĐ1 xong mới mở spec GĐ2.

## GĐ2 — Mở rộng phía Bắc (thay đổi lớn nhất của dự án)

**Công việc nền (làm trước mọi hạng mục GĐ2, là 1 gói riêng):**
- Dời tường Bắc `WALL.zN` từ −45 → **−64** trong `src/layout.ts`; kiểm tra lại
  `clampToCompound()`, toàn bộ `blocked()`, vùng sinh cây/hoa ngẫu nhiên trong
  `src/world.ts` cho dải đất mới.
- San nền leo bậc cho khu Bắc: cao độ trục tăng dần từ nền chính điện 1.35 lên
  **nền Điện Tam Thế ~3.0**; bậc thang/bờ kè đá dọc trục; đường trục kéo dài từ
  chính điện (z −32) lên điện mới, lát đá như đoạn hiện hữu.
- Cập nhật luồng: đích hành hương cuối cùng chuyển lên Điện Tam Thế; Am Cổ là
  điểm dừng phụ yên tĩnh.

**Các hạng mục (mỗi hạng mục = spec thi công riêng khi tới lượt):**

### Mục 16 — Điện Tam Thế (0, −54)
- Điện **lớn nhất và cao nhất** của chùa (đích cao nhất của trục, như Bái Đính
  / Tam Chúc), trên nền ~3.0, thang lớn giữa trục dẫn lên.
- Dựng bằng cách mở rộng bộ khung chính điện hiện có (hàm dựng hall): quy mô
  lớn hơn Điện Pháp Chủ, mái 3 tầng, trong điện thờ **3 tượng Phật Tam Thế**
  (clone từ `buddhaGroup` đã có, chỉnh tư thế/quy mô theo spec riêng), bàn thờ
  + lư hương + hàng bồ đoàn phía trước.
- Collider + vòng cấm quanh nền điện; zone riêng cho popup câu đối; biển tên
  tiếng Việt. Chiều cao tổng thể sau GĐ2 phải vượt chính điện (22.47 + nền).

### Mục 17 — Bảo Tháp (−17, −52)
- Tháp đá **nhiều tầng** thờ xá lợi, đứng Tây của Điện Tam Thế (kiểu Bảo Tháp
  Bái Đính) — phân biệt rõ với tháp nhỏ trang trí PAGODA (38, −14) đã có.
- Thân tháp thu dần theo tầng, đỉnh chóp vàng; cửa nhỏ mặt Nam; collider +
  vòng cấm; zone + popup riêng.

### Mục 18 — Am Cổ (−38, −50)
- Am đá nhỏ cổ kính ở góc Tây–Bắc — vai trò "chùa Trong": điểm đích yên tĩnh
  nhất, tách khỏi trục ồn ào.
- Quy mô nhỏ (1 gian), vật liệu đá cũ hơn (tông `stoneM` sẫm), cây cổ thụ che
  bóng cạnh am, lối mòn lát đá từ trục Tây sang; collider + zone riêng. Hợp để
  sau này gắn nhiệm vụ đặc biệt (để dành, chưa làm ở GĐ2).

### Mục 19 — Vườn Tháp (36, −48)
- Cụm **tháp mộ đá nhỏ** (5–9 tháp, kích thước lệch nhau có chủ ý) trong cây ở
  góc Đông–Bắc; lối dạo nhỏ giữa cụm; collider từng tháp; vùng cấm trong
  `blocked()` để cảnh ngẫu nhiên không mọc đè.

### Mục 19b — Dải hậu chẩm (z ≈ −60..−64)
- Dải cây dày dọc tường Bắc mới làm "núi tựa" che tường hậu; dùng hệ cây sẵn
  có trong `world.ts`, mật độ cao hơn dải cây thường; đảm bảo không lấn vào
  nền Điện Tam Thế và Vườn Tháp.

**Cổng qua GĐ3:** ảnh toàn cảnh từ cổng Nam nhìn lên Bắc thấy đủ bậc cao độ
0 → 1.35 → 3.0; đi thử trọn trục từ tam quan lên Điện Tam Thế và sang Am Cổ.

## GĐ3 — Đời sống chùa (rìa yên tĩnh, ngoài trục)

Mỗi mục là 1 gói riêng; mục 22–24 là **tùy chọn**, chỉ làm khi còn ngân sách
công việc sau mục 20–21.

### Mục 20 — Nhà Tổ (−27, −38)
- Nhà thờ tổ sư sau lưng Điện Pháp Chủ phía Tây: nhà ngang 1 tầng mái,
  trong có bàn thờ tổ + bài vị (bảng chữ tiếng Việt), 2 cột câu đối riêng;
  collider + zone `nhaTo` + `COUPLETS.nhaTo`; lối lát đá nối từ đường Tây.

### Mục 21 — Tăng xá + trai đường dọc tường Tây (−40, −16)
- Dãy nhà sinh hoạt (tăng xá) + nhà ăn (trai đường) dọc tường Tây: khối nhà
  dài thấp (cao 5–6, không át công trình thờ), cửa sổ, hiên; collider + vùng
  cấm. Để trống khả năng gắn NPC/shop ở các gói hệ thống sau — GĐ3 chỉ dựng
  công trình + zone.

### Mục 22 — Điện Mẫu (38, 4) · TÙY CHỌN
- Điện Mẫu nhỏ phía Đông nếu muốn đủ bộ tín ngưỡng Bắc Bộ: quy mô tương đương
  Đền Trình, biển tên + câu đối tiếng Việt riêng, zone + popup.

### Mục 23 — Nhà khách (30, −26) · TÙY CHỌN
- Nhà đón khách phía Đông–Bắc: điểm dừng chân + sau này là điểm NPC đón khách.
  Chỉ dựng công trình + zone ở GĐ3.

### Mục 24 — Thiền đường cạnh Vườn Thiền · TÙY CHỌN
- Sàn/hiên thiền nhỏ gom cụm với ZEN (−34, −26) (phần thiền ngoài trời đã có
  Vườn Thiền đảm nhiệm): thêm mái che + hàng bồ đoàn cố định; chỉ làm nếu
  Vườn Thiền hiện tại chưa đủ chỗ thiền theo nhu cầu chơi thật.

**Cổng hoàn thành PHẦN A:** chụp bộ ảnh toàn cảnh 4 hướng + 1 ảnh trục dọc từ
admin cam; đối chiếu từng hạng mục với masterplan; từ đây khuôn viên coi như
đóng băng bố cục (chỉ sửa lỗi), chuyển sang PHẦN B.

---

# PHẦN B — HỆ THỐNG (chỉ bắt đầu khi Phần A xong)

## R1 — Giữ chân (retention)

1. **Điểm danh 7 ngày + streak:** dùng `day_key` sẵn có trong hệ nhiệm vụ.
   Server ghi ngày vào chùa gần nhất + chuỗi ngày liên tiếp; lịch 7 ô, thưởng
   tăng dần (Sen + vật phẩm lễ), đứt 1 ngày quay về ngày 1. Có bảng
   `checkin` riêng hoặc mở rộng bảng tiến độ ngày hiện có — chốt trong spec R1.
2. **Hòm thư tối thiểu:** bảng `mail` (người nhận, tiêu đề, nội dung, quà đính
   kèm, đã đọc); thư hệ thống + **quà nhập môn** cho tài khoản mới (Sen +
   hương/nến/đèn); chấm đỏ báo thư chưa đọc ở nút Menu. Đây là nền bắt buộc
   cho R3.1.
3. **Vòng quay lộc 1 lượt/ngày:** gắn vào cơ chế `minigame:reward` đã có
   (đếm lượt theo ngày phía server); vòng quay client đơn giản, thưởng Sen nhỏ
   + tỉ lệ thấp ra vật phẩm.
4. **Hệ số thời khoá:** trong `ACTION_RULES` phía server: **×2 công đức** vào
   3 khung giờ thời khoá (gợi ý 5:00–5:20, 12:00–12:30, 20:00–20:30 giờ VN)
   và **×1,5 vào Mùng 1 + Rằm âm lịch**; client hiện thông báo khi đang trong
   khung nhân. Chỉ là nhân hệ số + hiển thị — không đổi cấu trúc thưởng.
5. **Mốc thành tựu dài hạn:** đếm tích lũy trọn đời (tổng số lạy, tổng phút
   thiền, tổng chuỗi tràng hạt hoàn thành, tổng đèn đã thả) + thưởng mốc một
   lần (mẫu sẵn: cơ chế `level_rewards`), ví dụ mốc 300 lạy / 60 phút thiền /
   7 chuỗi. Hiển thị trong cùng panel Nhiệm vụ.

## R2 — Nghi lễ sâu

1. **Xin xăm:** cơ chế 1 quẻ/ngày/tài khoản — seed theo (ngày + id tài khoản)
   để xin lại trong ngày vẫn ra quẻ cũ; điểm xin xăm đặt tại khu Gác Trống
   (đúng vị trí ống xăm cạnh gác trống theo truyền thống bố cục đã có).
   Nội dung: **tự viết 30 quẻ ở bản đầu** (nâng dần lên 60), mỗi quẻ gồm số,
   bậc (Thượng thượng / Thượng / Trung / Hạ), thơ 4 câu tự sáng tác, lời giải
   ngắn cho tổng quát / công việc / tình cảm / sức khỏe, giọng nhẹ nhàng.
2. **Tràng hạt lần tay 108:** tách niệm Phật khỏi panel tụng kinh thành UI
   riêng: vòng 108 hạt hiển thị quanh màn hình, chạm hoặc Space để lần từng
   hạt (mỗi hạt 1 câu niệm), trọn vòng cộng thưởng; tái dùng logic đếm +
   `sutra:done` hiện có. Nhân vật ngồi bồ đoàn khi lần hạt.
3. **Đèn hoa đăng hiện điều ước:** kiểm tra bản hiện tại — server `action` đã
   nhận tham số `wish`; bổ sung phần còn thiếu để đèn trôi trên hồ **hiện điều
   ước + pháp danh** cho cả phòng cùng thấy (chữ nhỏ trên đèn, mờ dần theo
   khoảng cách), kèm giới hạn độ dài + lọc từ cho điều ước.

## R3 — Xã hội

1. **Tặng quà qua hòm thư** (phụ thuộc R1.2): đứng gần một người chơi hoặc
   chọn từ danh sách phòng → tặng 1 lễ vật trong túi kèm lời nhắn; quà vào túi
   người nhận + thư báo trong hòm thư. Giới hạn số lượt tặng/ngày phía server
   để chống farm tài khoản phụ.
2. **Chụp ảnh trong game:** nút chụp lưu khung hình canvas thành ảnh tải về,
   **đóng dấu tên game** ở góc (watermark); ẩn UI khi chụp. Người chơi tự
   quảng bá game bằng ảnh của họ.
3. **Bia công đức:** bia đá tại sân trước (vị trí chốt trong spec R3, gợi ý
   gần đầu trục/quảng trường), khắc tên người chơi có công đức cao nhất tuần
   (server chốt theo tuần, dùng chung `week_key`); chỉ công đức trong game —
   **không gắn tiền thật**.

## R4 — Phát hành

1. **Trang bìa SEO:** trang giới thiệu riêng trước cổng vào game (tên game,
   mô tả, cách chơi, cách điều khiển, ảnh chụp thật bằng admin cam, nút "Chơi
   ngay" vào game) — thay vai trò của `index.html` trần hiện tại; game chuyển
   vào đường dẫn con. Kèm thẻ meta/OG đầy đủ.
2. **PWA:** `manifest.webmanifest` + service worker (cache vỏ game, chơi lại
   được khi mạng chập chờn) + bộ icon; cài được lên màn hình chính điện thoại.
3. **Push notification (làm cuối cùng trong R4):** nhắc khi streak sắp đứt và
   nhắc ngày Rằm/Mùng 1 — theo mẫu endpoint `/api/push` (đăng ký/hủy đăng ký),
   chỉ gửi khi người chơi đã cấp quyền; cần HTTPS chuẩn trên domain production.
4. **Kênh cộng đồng (ngoài code):** lập fanpage/nhóm cho game dưới tên chính
   thức đã chốt; gắn link vào trang bìa và trong game.

## Những thứ KHÔNG làm trong lộ trình này

- Đua thú cưỡi, trồng cây, bản đồ hành hương (đi chùa thật khác), đăng nhập
  Google, donate/ủng hộ bằng tiền thật kèm xếp hạng — đều là hệ thống con lớn
  hoặc việc ngoài game; chỉ xét lại khi đã có cộng đồng người chơi ổn định.
- Multiplayer dạng một thế giới chung duy nhất: giữ nguyên mô hình nhiều
  phòng chùa hiện tại.

---

## Tài liệu liên quan

- `spec-ban-do-tong-the-chua-online.md` — masterplan khuôn viên bản cuối.
- `spec-giai-doan-1-chua-online.md` — spec thi công chi tiết 6 gói GĐ1.
- `doi-chieu-chuaonline-org.md` — bản đối chiếu tính năng với chuaonline.org
  (căn cứ của Phần B).
- `HANDOFF.md` trong repo — trạng thái bàn giao giữa các session Kilo.
