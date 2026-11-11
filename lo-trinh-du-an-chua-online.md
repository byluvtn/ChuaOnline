# LỘ TRÌNH DỰ ÁN CHÙA ONLINE — BẢN TỔNG HỢP (cập nhật 2026-11-11)

> File lộ trình duy nhất của dự án. Bản này **thay thế bản cũ** (viết khi
> GĐ1 còn đang làm): cập nhật trạng thái thật tới HEAD `1a1ec79`, ghi lại
> quyết định ngày 2026-11-11 của chủ dự án — **Phần A2 (mở rộng khuôn viên)
> được xen vào Phần B** theo thứ tự ở mục "Thứ tự thực thi" dưới đây.
>
> Tên thương hiệu: **Chùa 24/7** · Domain: **chua247.top** (Porkbun, hết hạn
> 2027-11-11, tự gia hạn). Repo: `byluvtn/ChuaOnline`, nhánh `main` — Render
> tự deploy mỗi lần push. DB người chơi: Turso (Singapore), 72 tài khoản.
>
> Chi tiết thiết kế nằm ở các file chuyên sâu (liệt kê cuối file); file này
> chỉ giữ **trạng thái + thứ tự + quy tắc**.

## Trạng thái hiện tại (đã kiểm chứng bằng code/ảnh, không theo tự báo cáo)

**Phần A — khuôn viên GĐ1 → GĐ3: XONG**, trừ một ngoại lệ lớn:

- GĐ1 đủ 6 gói (gác trống, Đền Trình, tam quan 3 lối, vườn cột kinh, Thủy
  Đình, hành lang La Hán) + tháp chuông, hồ + cầu, quảng trường, chính điện
  Điện Pháp Chủ (cao 22.47).
- GĐ2/GĐ3 đã dựng: Bảo Tháp, Am Cổ, Vườn Tháp, Nhà Tổ, Tăng Xá, Điện Mẫu,
  Nhà Khách, Thiền Đường, dãy nhà Tây (tăng xá + trai đường), sân tượng
  Phật Tổ và sân tượng Quan Âm đối xứng qua trục (sân Quan Âm thay tháp —
  quyết định của chủ dự án, commit `0dfbf6d`).
- ⚠️ **Điện Tam Thế CHƯA ĐƯỢC DỰNG** — mới có hằng số đặt chỗ `TAM_THE`
  (0, −54) trong `layout.ts`. Các công trình quanh nó đã xây xong nên dễ
  tưởng là có; kiểm code 2026-11-11 xác nhận chưa có điện, chưa nền, chưa
  tượng. Hạng mục này chuyển sang **A2.4**.

**Phần B — hệ thống:**

- **R1 XONG TOÀN BỘ** (đã nghiệm thu từng mục): R1.1 điểm danh 7 ngày
  (`f2ac33c`), R1.2 hòm thư + quà ra mắt (`1ee97b0`), R1.3 vòng quay mỗi
  ngày + sửa chat mobile (`0adb61e`), R1.4 hệ số giờ lễ/Rằm (`1f56a67`),
  R1.5 thống kê trọn đời + mốc thành tựu (`1a1ec79`).
- R2.3 đèn nguyện: đã có từ trước. R2.2 lần hạt: **spec đã viết xong**,
  chờ giao (xem thứ tự dưới). R2.1 xin xăm: đã có bản tối thiểu phía
  client, chờ nâng nhẹ.
- R4.2 PWA: gần xong (manifest + icon + panel cài đặt); còn kiểm chứng
  service worker/offline.
- Tên miền đã mua xong; chưa trỏ về Render (làm ở R4.1).

## Quy tắc xuyên suốt

- 1 mục = 1 session Kilo = spec riêng của Lux đối chiếu code tại thời điểm
  bắt đầu; commit riêng từng mục, `git add` từng đường dẫn, không `git add -A`.
- **Mỗi spec đều có sẵn mục "Commit & Push"**: làm xong là tự push lên
  GitHub trong cùng session (`pull --rebase` trước, không force-push) —
  quyết định của chủ dự án 2026-11-11.
- **Mỗi tính năng phát hành đều kèm một mục "Có gì mới"** viết sẵn trong
  spec (`src/data/news.ts`); thiếu mục tin tức = không đạt nghiệm thu.
- Nghiệm thu bằng **code thật + ảnh thật trong `shots/`**, không nghiệm thu
  bằng lời tự báo cáo của agent. Việc liên quan hiệu năng phải có số đo
  trên thiết bị thật trước/sau.
- Không dùng chữ Hán ở bất cứ đâu; bảng/câu đối/hoành phi thuần tiếng Việt.
- Nội dung (quẻ xăm, lời giải, câu chữ) **tự viết** — không sao chép từ
  chuaonline.org hay bất kỳ game nào khác.
- Quy tắc tượng & nhân vật đã chốt (mặt vẽ texture, mắt nét cong nhắm,
  tay khối tròn không ngón, tràng hạt chỉ cho 2 nhân vật xuất gia) áp dụng
  cho mọi tượng/NPC mới.

---

# THỨ TỰ THỰC THI TỪ 2026-11-11

| # | Hạng mục | Trạng thái |
|---|---|---|
| 1 | Thu nhỏ HUD mobile (dọc compact + chế độ ngang) | **ĐANG LÀM** (Kilo) |
| 2 | R2.2 — Lần hạt 108 (giao diện + thưởng vòng + mốc `beads_rounds`) | Spec sẵn: `spec-r2-2-lan-hat-108-chua-online.md` |
| 3 | **A2.1** — Mở đất, dời nhà, mạng đường đi | Chờ spec (thiết kế: Phần A2) |
| 4 | **A2.2** — Trị đơ máy + sửa nhỏ (chuông lộn ngược, collider ghế đá) | Chờ spec |
| 5 | **A2.3** — Nội thất từng nhà | Chờ spec |
| 6 | **A2.4** — Dựng Điện Tam Thế + bộ tượng Tam Thế | Chờ spec |
| 7 | **A2.5** — Mở rộng NPC + ca trực/nghỉ | Chờ spec |
| 8 | R2.1 — Xin xăm nâng nhẹ (khóa server theo ngày, bộ quẻ ≥ 30 tự viết) | Chờ spec |
| 9 | R3.1 — Tặng quà qua hòm thư | Chờ spec |
| 10 | R3.2 — Chụp ảnh trong game (watermark Chùa 24/7) | Chờ spec |
| 11 | R3.3 — Bia công đức tuần | Chờ spec |
| 12 | Audit toàn code bằng Fable 5.2 + làm mượt animation | Bộ prompt sẵn: `prompt-audit-fable-chua-online.md` |
| 13 | R4 — Phát hành: landing + trỏ domain → kiểm PWA → push notification → fanpage | Chờ spec từng mục |
| 14 | Phần C — R5 "Con đường tu tập" (5 bước R5.1–R5.5) | Thiết kế sẵn ở file Phần B |

Nguyên tắc xen kẽ: **A2.1 phải xong trước A2.2** (đo hiệu năng trên bố cục
cuối), **A2.2 trước A2.3** (nội thất chỉ được thêm sau khi cơ chế gộp mesh
đã phủ các nhà — thêm đồ vào nhà chưa gộp sẽ làm đơ nặng hơn). Sau A2.5 mới
quay lại Phần B để R3/R4 chạy trên khuôn viên đã ổn định.

---

# PHẦN A2 — MỞ RỘNG KHUÔN VIÊN (thiết kế đã chốt)

Thiết kế đầy đủ + bản đồ v7 + concept tượng: thư mục `phan-a2/` trong repo
(`phan-a2-mo-rong-chua-online.md`). Tóm tắt các quyết định đã khóa:

- **Tường mới:** x ±62, Bắc z −82, Nam giữ z 45 (diện tích +54%). Trục
  thiêng và toàn bộ công trình Phần A giữ nguyên vị trí.
- **Viện Khách Tăng** (Tây–Bắc, sân riêng có cổng): nhà khách (−47, −61)
  12×8.5; tăng xá gộp **một nhà** (−41, −71) 15×8; trai đường (−29, −61)
  12×7.5. Đất tăng xá/trai đường cũ ở phía Tây trả lại cho vườn tre.
- **Viện Tổ — Tưởng niệm** (Đông–Bắc): nhà tổ (36, −68) 12×8.5; vườn tháp
  mở rộng quanh (49, −63); am cổ (53, −75) ở góc xa của cụm.
- **Khu Thiền:** thiền đường dời về (−47, −27), xoay dọc 9×13, mặt tiền
  quay Đông về chính điện, ôm Vườn Thiền.
- **Vườn Phóng Sinh** (Đông của chính điện): vườn (41, −31) 30×22, ao
  15×11, bến thả cá bờ Tây của ao. **Phố trước cổng** ngoài tường Nam:
  hàng cơm chay, trà đá, bán chim, bán cá — vòng chơi mua → thả phóng
  sinh mới dựng sân khấu ở A2; cơ chế (giá, công đức, chống farm) để
  spec gameplay sau.
- **Phòng Ghi Công Đức** (−42, 35) trong tường, 13×9, có NPC sư thầy ngồi
  ghi sổ — chỉ ghi nhận trong game, không tiền thật.
- **Tháp nhỏ** dời (38, −14) → (34, −15), thẳng cột với Gác Trống.
- **Hành lang** nới rộng 3.8 → **5.2**; tượng La Hán giảm 10 → **6 tượng/bên**,
  đặt mép ngoài hành lang, chừa lối đi.
- **Mạng đường 4 cấp** như bản đồ: trục chính; đường ngang sau chính điện
  (z −46); đường vành đai trong tường; đường nhánh tới cửa **mọi** công
  trình + đường nội bộ hai viện. Mạng đường này cũng là đồ thị di chuyển
  cho NPC ở A2.5.
- **Vỏ nhà & nội thất (khóa):** ít cột trong; mặc định chỉ tường hậu đặc,
  hai bên + mặt trước thoáng trên cột; mặt trước đúng 4 cột, 2 cột giữa
  treo bảng tên/câu đối. Nội thất theo từng nhà: nhà khách = bộ bàn trà +
  ghế dài hiên; tăng xá = **đúng 2 giường** + bàn đầu giường; trai đường =
  bàn dài + ghế băng hai bên; nhà tổ = bàn thờ tổ (bài vị, lư hương, đôi
  lọ hoa) + 2 ghế; am cổ = tối thiểu (1 giường nhỏ, 1 bồ đoàn trước bàn
  thờ nhỏ); thiền đường = 2 dãy bồ đoàn trên sàn gỗ có lối giữa, bồ đoàn
  đăng ký thành **ghế thiền thật** trong hệ `seats`. Đồ lớn (bàn thờ,
  giường, bàn dài) **bắt buộc có collider**; mọi đồ nội thất **bắt buộc
  qua gộp mesh**.
- **Đơ máy (A2.2):** 5 nhà bị đơ khi tới gần (nhà khách, tăng xá Bắc, nhà
  tổ, am cổ, thiền đường) đúng là 5 nhà chưa qua `mergeStaticByMaterial`
  (hiện chỉ áp trong `longHouse`). Việc: mở rộng gộp mesh cho
  `buildHouse`/`extraHouse`/am cổ + tiền tải (`renderer.compile`) lúc
  loading + rà soát shadow/bloom trên cảm ứng — **điều kiện nghiệm thu là
  số đo frame-time trên điện thoại thật** chạy một tuyến đường cố định
  qua 5 nhà, trước và sau. Kèm sửa nhỏ: lật lại biên dạng chuông (đang
  ngược: miệng 0.2 → đỉnh 0.95), bổ sung collider ghế đá hành lang + rà
  collider tượng La Hán, (tùy chọn, không chặn) 5 khe mái tháp nhỏ.
- **Điện Tam Thế (A2.4):** nền cao ~3.0 tại (0, −54) sau chính điện, điện
  lớn nhất chùa, thờ **A Di Đà — Thích Ca (giữa, lớn nhất) — Di Lặc**;
  concept A Di Đà + Di Lặc đã duyệt (trong `phan-a2/`), Thích Ca theo
  concept Phật Tổ hiện có.
- **NPC (A2.5):** hiện có 5 NPC. Thêm: 1 sư thầy, 2 chú tiểu, 3–5 phật tử,
  + NPC ngồi bàn ở Phòng Ghi Công Đức (đứng yên theo thiết kế). Đổi tên
  hai NPC "Tiểu Quét Lá" trùng nhau thành tên riêng. NPC di chuyển theo
  **mạng đường A2** thay vì các đường nan hoa vẽ tay; tiểu đánh chuông
  không đứng chết ở tháp (chỉ tới tháp khi tới giờ thỉnh 05:00/12:00/
  18:00/20:00). **Ca trực:** NPC luân phiên chấp tác; hết ca thì về tăng
  xá, leo lên 1 trong 2 giường nằm nghỉ (tối đa 2 người cùng nghỉ) —
  cần tư thế nằm cho NPC.

# PHẦN B — HỆ THỐNG (phần còn lại)

Thiết kế chi tiết: `phan-b-he-thong-r1-r4-chua-online.md`. Tóm tắt phần
chưa làm theo đúng thứ tự ở bảng trên: R2.2 (spec sẵn) → R2.1 xin xăm
nâng nhẹ (server khóa 1 quẻ/ngày/tài khoản, ≥30 quẻ tự viết) → R3.1 tặng
quà qua hòm thư (giới hạn lượt/ngày chống farm) → R3.2 chụp ảnh trong
game (qua composer sẵn có + watermark 2D) → R3.3 bia công đức (top tuần
theo `weekly_merit`, chỉ công đức trong game) → **audit Fable** (đọc
toàn code, xuất AUDIT.md, duyệt từng mục mới sửa; buổi animation riêng
với 4 tiêu chí đo được: không pop hình, độc lập FPS, không trượt chân,
không nhảy LOD) → R4.1 landing Chùa 24/7 + thẻ OG + trỏ chua247.top về
Render → R4.2 kiểm chứng PWA/service worker → R4.3 push notification →
R4.4 fanpage (việc ngoài code).

# PHẦN C — R5: CON ĐƯỜNG TU TẬP (sau R4)

Phát nguyện tu tập trước sư thầy: hạng Phật tử → Tập sự → Sa di/Sa di ni
→ Sư thầy/Sư cô, tiêu chí gắn với thống kê R1.5 (lạy ≥100/300, tụng ≥50/
200, thiền ≥60/180 phút, chấp tác, giữ thời khóa); áo + danh hiệu theo
hạng do server quyết định; hạng cao phục vụ cộng đồng (chủ tọa thiền,
ban phước, thỉnh chuông khai lễ); hoàn tục bất cứ lúc nào, giữ nguyên
thống kê. Thiết kế đầy đủ 5 bước R5.1–R5.5 ở Phần C của file Phần B.

---

# BACKLOG VIỆC LẺ (không chặn tuyến chính, làm khi rảnh hoặc gộp spec gần)

- Ảnh nghiệm thu chánh điện chụp lại bằng admin cam thật + chạy
  `sealArchitectureJoints` gapdump cho chính điện; xong thì chủ dự án
  quyết có dựng dốc mái tầng 1 không; đóng xong thì xóa
  `spec-khung-chinh-dien-chua-online.md` khỏi repo.
- Tượng Quan Âm bản v2 (bình sứ trắng cầm tay, cành liễu rủ từ tay hạ,
  khăn choàng dày viền vàng — spec mục 3b đã có) + ảnh 3/4 không bị che
  để nghiệm thu độ dày khăn choàng.
- Tư thế lạy sâu: cần 1 khung hình chụp nghiêng đóng băng đạt chuẩn
  (gối chạm đất, lưng dốc ~60°, trán gần đất, 2 lòng bàn tay áp đất).
- Preset F3 + nhãn "ADMIN CAM" cho admin cam (spec đã giao, chưa làm).
- Hai sân tượng chưa có zone popup — bổ sung khi tiện.
- Mục 9b (hành lang vòng quanh quảng trường): **khuyến nghị bỏ hẳn**.

# VIỆC CỦA CHỦ DỰ ÁN (Kilo không làm thay được)

- Test trên điện thoại thật sau mỗi đợt deploy lớn: ô chat có bị bàn
  phím ảo che không (treo từ R1.3); bấm thử 7 nút hành động sau đợt thu
  nhỏ HUD.
- Bật 2FA cho tài khoản Porkbun giữ domain.
- Cân nhắc mua thêm `chua247.com` (đang trống) để bảo vệ tên.
- Sau 2026-11-29 (hết khuyến mãi STEYG −50%): nhờ Lux so lại giá Vilao.

## Những thứ KHÔNG làm trong lộ trình này

- Đua thú cưỡi, trồng cây, bản đồ hành hương (đi chùa thật khác), đăng
  nhập Google, donate/ủng hộ bằng tiền thật kèm xếp hạng — chỉ xét lại
  khi đã có cộng đồng người chơi ổn định.
- Multiplayer dạng một thế giới chung duy nhất: giữ nguyên mô hình nhiều
  phòng chùa hiện tại.
- Hành lang vòng quanh quảng trường (mục 9b cũ).

## Tài liệu liên quan

- `phan-a2/phan-a2-mo-rong-chua-online.md` — thiết kế Phần A2 (+ bản đồ
  v7 và 2 concept tượng trong cùng thư mục).
- `phan-b-he-thong-r1-r4-chua-online.md` — thiết kế Phần B + Phần C (R5).
- `spec-ban-do-tong-the-chua-online.md` — masterplan khuôn viên bản cuối
  (bố cục Phần A2 đã thay thế phần bố cục công trình phụ trong file này;
  trục thiêng + nguyên tắc quy hoạch vẫn giữ).
- `prompt-audit-fable-chua-online.md` — bộ prompt audit + animation.
- Các spec thi công từng mục: giữ ở workspace của Lux, giao Kilo từng
  session (R1.1–R1.5 đã xong; R2.2 và thu nhỏ HUD đã viết sẵn).
- `HANDOFF.md` trong repo — trạng thái bàn giao giữa các session Kilo.
