# SPEC THI CÔNG — GIAI ĐOẠN 1 mở rộng Chùa Online (trong tường hiện tại)

> Nguồn chuẩn: `spec-ban-do-tong-the-chua-online.md` (masterplan bản cuối, mục GĐ1).
> Spec này đã đối chiếu code thật tại HEAD `6871320` (`src/layout.ts`, `src/temple.ts`,
> `src/couplets.ts`). GĐ1 gồm **6 gói việc độc lập — mỗi gói = 1 session Kilo riêng =
> 1 commit riêng**, làm theo đúng thứ tự dưới đây (xếp theo độ khó tăng dần).
> Không gộp gói, không làm tắt sang gói sau trong cùng session.

## Quy tắc chung cho mọi gói

- Đọc `HANDOFF.md` + mục GĐ1 của masterplan trước khi code. Gõ `/vibe-game-workflow`
  ở đầu session.
- Chỉ sửa các file được liệt kê trong từng gói. Mọi công trình mới phải: có collider,
  có vùng cấm trong `blocked()` (nếu gói yêu cầu), `userData.sealable = true` cho các
  khối chính và chạy `sealArchitectureJoints` cho group mới, dùng lại vật liệu sẵn có
  (`tileM`, `redM`, `goldM`, `stoneM`, `lamb(...)`) — không chế vật liệu/phong cách mới.
- **Không dùng chữ Hán ở bất cứ đâu** (đúng quyết định ở commit `4dae30a`): chữ trên
  cột/bảng chỉ dùng tiếng Việt.
- Nghiệm thu mỗi gói: `npm run typecheck` pass; chạy gapdump của
  `sealArchitectureJoints` cho group mới và báo số khe lớn còn lại; chụp ảnh nghiệm
  thu **vào thư mục `shots/`** (không để ở repo root, **không xoá sau khi chụp**);
  đi thử bằng nhân vật thật (không chỉ mô phỏng hàm `collide()`).
- Commit: `git add` từng đường dẫn (không `git add -A`), message ghi sẵn trong từng gói.
- Báo cáo cuối session theo mẫu: việc đã làm / file đã sửa / typecheck / số khe hở /
  ảnh đã chụp (liệt kê tên file) / điểm chưa chắc chắn.

---

## Gói 1 — Gác Trống đối xứng tháp chuông (34, −6)

**Mục tiêu:** khuôn viên có đủ cặp chuông–trống hai bên quảng trường, trống gõ được
như chuông.

**Sự thật trong code để bám vào:**
- `src/temple.ts` đã có hàm dựng khung tháp dùng chung `tower(x, z, ry, sign, coupletId)`
  (2 tầng bệ đá, 4 cột đỏ, 2 tầng mái, nóc vàng, bảng tên, bảng câu đối) — tháp chuông
  đang gọi `tower(BELL.x, BELL.z, Math.PI/2, 'THÁP CHUÔNG', 'chuong')`, chuông đồng
  treo riêng bằng `LatheGeometry` trong `bellPivot`, hiệu ứng rung qua biến `ring`
  và hàm `ringBell()` trả ra ngoài (world đã phơi `ringBell`).
- Lỗi nhỏ sẵn có: bên trong `tower()`, bảng câu đối luôn lấy `COLUMN_LABELS.chuong`
  bất kể `coupletId` truyền vào là gì.

**Việc làm:**
1. `src/layout.ts`: thêm `export const DRUM = { x: 34, z: -6 };` và thêm vào
   `blocked()` một vòng cấm quanh DRUM bán kính 7 (như BELL). Kiểm tra lối đi:
   `blocked()` hiện có quy tắc đường Đông `|x − SIDE_X| < 2.5, z từ PATH_Z − 2.5 đến
   QUAN.z + 2.5` — tháp trống ở z = −6 nằm ngoài đoạn đường đó, không xung đột.
2. `src/textures.ts` (nơi chứa `COLUMN_LABELS`): thêm cặp bảng cho trống, mỗi bảng
   một câu thơ tiếng Việt dạng mỗi-từ-một-dòng như các bảng hiện hữu, nội dung:
   "Trống vọng sân thiền tan phiền não" / "Âm vang cửa Phật tỏ lòng thành"
   (Kilo được sửa văn cho hay hơn nhưng giữ ý và giữ thuần Việt).
   Đồng thời sửa `tower()` để dùng đúng cặp bảng theo `coupletId` thay vì luôn lấy
   `chuong` — kiểm tra tháp chuông vẫn hiển thị đúng bảng cũ sau khi sửa.
3. `src/couplets.ts`: thêm mục `trong` (âm + nghĩa) theo đúng format các mục hiện có,
   để popup giới thiệu khu vực trống hoạt động như khu chuông.
4. `src/temple.ts`: gọi `tower(DRUM.x, DRUM.z, -Math.PI/2, 'THÁP TRỐNG', 'trong')`;
   dựng **trống lớn** treo/đặt trong khung tháp thay cho chuông: thân trống hình trụ
   nằm ngang (bán kính ~0.85, dài ~1.1) thân đỏ sẫm, hai mặt trống màu da bò
   (vòng tròn phẳng hai đầu, thêm đinh tán nhỏ quanh rìa nếu rẻ), giá đỡ gỗ chữ X
   hoặc hai chân hộp dưới thân; thêm `glowSpr` như tháp chuông. Thêm zone
   `{ x: DRUM.x, z: DRUM.z, r: 7, id: 'trong' }`.
5. Hiệu ứng gõ trống: nhân bản cơ chế `ringBell` — thêm trạng thái `drumHit` trong
   `buildTemple`, hàm `ringDrum()` (trống rung/nảy nhẹ ~0.4 giây trong `update()`),
   trả ra cùng chỗ `ringBell` đang trả; `src/world.ts` phơi thêm `ringDrum` cạnh
   `ringBell`; `src/main.ts`: tìm đúng chỗ đang gọi `world.ringBell()` (tương tác ở
   khu chuông) và nhân bản cho khu `trong` gọi `world.ringDrum()` — không đổi hành
   vi của chuông. Nếu không tìm thấy điểm gọi trong main.ts thì báo cáo rõ thay vì tự chế cơ chế mới.
6. Lối đi lát đá tới tháp trống: thêm `pathRect` tương tự các lối tới tháp chuông
   (từ đường ngang z = 2 xuống tháp ở (34, −6), và đoạn ngang nối vào).

**Không làm:** không dời tháp chuông, không đổi kích thước khung tháp, không sửa zone chuông.

**Ảnh nghiệm thu:** (a) đứng ở quảng trường nhìn chếch thấy cả chuông (Tây) và trống
(Đông) trong một khung hình; (b) cận cảnh tháp trống chính diện thấy mặt trống và bảng tên.

**Commit:** `feat: drum tower mirroring bell tower (masterplan GD1)`

---

## Gói 2 — Đền Trình (9, 39)

**Mục tiêu:** trạm "trình diện" đầu tiên ngay trong cổng, đúng tinh thần Chùa Hương —
điểm bắt đầu tuyến hành hương.

**Sự thật trong code:** zone `tamQuan` ở (0, 45) r 6 đã có; popup câu đối theo zone
nằm ở `src/couplets.ts`; bảng chữ trên cột dùng `COLUMN_LABELS` + `labelBoard`.
Vị trí (9, 39) đã kiểm tra: ngoài vùng cấm của trục (`|x| < 6`), cách tâm khu nghỉ
REST (27, 31) ~19.7 (ngoài r 9), không vướng bồn hoa hay đường ngang.

**Việc làm:**
1. `src/layout.ts`: thêm `export const DEN_TRINH = { x: 9, z: 39 };` và thêm vòng
   cấm `blocked()` bán kính 5.5 quanh điểm này.
2. `src/temple.ts`: dựng đền nhỏ một gian, **mặt tiền quay về phía Tây** (về phía
   đường trục, `rotation.y ≈ −Math.PI/2`) để người vừa qua cổng đi trên trục nhìn thấy:
   - Bệ đá 1 tầng 4.4 × 3.6, cao 0.35.
   - 4 cột đỏ (r 0.16, cao 2.4) ở 4 góc gian; tường hậu và hai tường hông thấp bằng
     vật liệu tường `wallM`; mặt trước mở.
   - 1 tầng mái `roofGeometry(5.6, 4.6, 1.5, 0.6)` + nóc vàng nhỏ.
   - Bên trong: bàn thờ đá nhỏ, lư hương (trụ tròn + vành), 2 ghế đôn đá hai bên.
   - Bảng tên `ĐỀN TRÌNH` (dùng `signTexture` như các tháp) treo trên mặt tiền;
     2 bảng câu đối ở hai cột trước (thêm `COLUMN_LABELS.denTrinh`).
   - Collider: 4 cột r 0.25 + 1 collider bàn thờ r 0.8. Zone `{ x: 9, z: 39, r: 5, id: 'denTrinh' }`.
   - Thêm `pathRect` lát đá nối từ lối trục (x ≈ 1.4) sang đền ở z ≈ 39.
3. `src/couplets.ts`: thêm mục `denTrinh` (âm + nghĩa), nội dung theo ý "dừng chân
   trình diện, gột sạch bụi trần trước khi vào cửa Phật".

**Không làm:** không gắn cơ chế nhiệm vụ (quest) trong gói này — đền chỉ là công
trình + zone + popup; phần nhiệm vụ hành hương là spec gameplay riêng sau.

**Ảnh nghiệm thu:** (a) đứng ngoài cổng nhìn vào: thấy tam quan + đền trình phía
Đông; (b) đứng trên trục nhìn thẳng mặt tiền đền; (c) cận cảnh bàn thờ/lư hương.

**Commit:** `feat: Den Trinh shrine inside the gate (masterplan GD1)`

---

## Gói 3 — Tam Quan thành cổng ba lối có mái 2 tầng (0, 45)

**Mục tiêu:** cổng hiện tại (đã có 1 tầng mái, 2 cột chính, bảng CHÙA ONLINE) nâng
thành tam quan đúng nghĩa: **3 lối đi thật + 2 tầng mái**, cao tổng ~11.

**Sự thật trong code:** khối cổng nằm ở cuối `src/temple.ts` (nhóm `gate`): tường Nam
chừa khoảng trống ±(`WALL.gate` + 1.6); 2 cột đỏ 1.2 × 6.4 tại x = ±4.4; hai khối đặc
đỏ 2.4 × 4.2 tại x = ±(4.4 + 1.8) — **hai khối này hiện không có collider, người chơi
đi xuyên qua được**; xà ngang ở y 6.45; mái `roofGeometry(gate*2 + 7.5, 5, 2.0, 0.8)`
ở y 7.45; bảng `CHÙA ONLINE` và 2 bảng câu đối `COLUMN_LABELS.tamQuan` đã có; zone
`tamQuan` r 6 đã có.

**Việc làm (chỉ sửa khối `gate` trong `src/temple.ts`):**
1. Biến hai khối đặc hai bên thành **hai lối phụ thật**: mỗi bên thay khối đặc bằng
   2 cột đỏ nhỏ (0.8 × 4.6) cách nhau ~2.2 tạo lối đi ở giữa, xà ngang riêng ở y 4.7,
   và một mái nhỏ riêng `roofGeometry(4.6, 3.6, 1.2, 0.5)` ở y ~5.4 cho mỗi lối phụ.
   Thêm collider cho các cột mới (r 0.55) — lối phụ phải đi qua được, cột không đi
   xuyên được.
2. Thêm **tầng mái thứ hai** cho lối giữa: `roofGeometry(gate*2 + 4.2, 4.2, 1.5, 0.6)`
   ở y ~9.2 + chóp vàng nhỏ trên đỉnh. Giữ nguyên cột chính, xà, bảng tên và bảng
   câu đối hiện hữu.
3. Chạy lại `sealArchitectureJoints(gate, ...)` và gapdump; đảm bảo chân cột/mái
   không hở sáng. Không đổi `WALL.gate`, không đổi vị trí zone.

**Ảnh nghiệm thu:** (a) chính diện từ ngoài cổng (thấy đủ 3 lối + 2 tầng mái);
(b) góc 3/4 từ trong sân nhìn ra; (c) ảnh đi thử: nhân vật đứng trong một lối phụ.

**Commit:** `feat: three-passage two-roof tam quan gate (masterplan GD1)`

---

## Gói 4 — Vườn Cột Kinh dọc trục (±3.4, z −3.2..−10.4)

**Mục tiêu:** hai hàng cột đá khắc kinh theo Tam Chúc, dẫn mắt từ quảng trường lên
chính điện.

**Số liệu đã kiểm chứng:** sàn bồ đoàn bắt đầu ở |x| = 4.6 nên hàng cột ở ±3.4 không
chạm sàn; vành quảng trường (0, 6) r 8.4 tại x = ±3.4 chỉ tới z ≈ −1.7 nên hàng cột
bắt đầu từ z = −3.2 là an toàn; vùng này đã nằm trong vùng cấm cảnh vật của
`blocked()` (băng trục |x| < 6) nên không cần sửa `blocked()`. Giữa hai hàng cột còn
~6.1 m lối đi thông thoáng.

**Việc làm (`src/temple.ts`, thêm một khối dựng riêng; không sửa layout.ts):**
1. Mỗi bên 5 cột, z = −3.2, −5.0, −6.8, −8.6, −10.4 (bước 1.8), x = ±3.4. Tổng 10 cột.
2. Cấu trúc mỗi cột: bệ đá 1.1 × 0.5 × 1.1; thân cột đá vuông 0.72 × 4.2 × 0.72 với
   **texture canvas khắc chữ tiếng Việt chạy dọc** (ví dụ các dòng "NAM MÔ A DI ĐÀ
   PHẬT" / "TÂM TỊNH PHẬT TỊNH" khắc chìm tông đá tối trên nền đá sáng — dùng lại
   phong cách `signTexture`/`stoneTexture` hiện có; **tuyệt đối không chữ Hán**);
   đầu cột: phiến đá 0.95 × 0.18 × 0.95 + chóp tháp nhỏ hoặc cầu vàng r 0.14.
   Tổng chiều cao mỗi cột ~5.1.
3. Collider mỗi cột r 0.6. Các khối `sealable = true`, chạy seal cho cả nhóm cột.
4. Hai cột đầu hàng (gần quảng trường nhất) treo thêm đèn đá nhỏ hoặc glow nhẹ như
   các đèn hành lang — chỉ 2 cột đầu, tránh lòe loẹt.

**Ảnh nghiệm thu:** (a) đứng ở quảng trường nhìn thẳng trục lên chính điện (thấy hai
hàng cột dẫn mắt); (b) cận cảnh 1 cột thấy rõ chữ khắc; (c) đi thử giữa hai hàng cột.

**Commit:** `feat: sutra pillar rows along the axis (masterplan GD1)`

---

## Gói 5 — Thủy Đình giữa hồ (−6.5, 23) + cầu gỗ nối bờ Tây

**Mục tiêu:** đình nhỏ **trên mặt nước** phía Tây cầu — "chữ ký" Tam Chúc — nơi ngồi
ngắm cá/thả đèn. Đây là gói duy nhất của GĐ1 đụng vào logic nước, làm cẩn thận.

**Số liệu đã kiểm chứng:** hồ elip tâm (0, 22), a 9 × b 6.5 → điểm (−6.5, 23) nằm
trong mặt nước; bờ Tây của hồ ở z = 23 là x ≈ −8.9; cầu trục rộng hw 1.15 ở x = 0,
vành an toàn `resolveWater` ±1.75 → mép Tây của đình phải cách trục ≥ 3.5.
`resolveWater()` hiện đẩy mọi điểm trong hồ ra bờ trừ khi ở trên cầu; `groundY()`
chưa biết gì về sàn đình.

**Việc làm:**
1. `src/layout.ts`: thêm
   `export const PIER = { x0: -10.6, x1: -4.4, z: 23, hw: 1.6, y: 0.55 };`
   (x0 ăn vào bờ đất làm neo, x1 dừng trước vành an toàn của cầu).
   - `groundY()`: nếu điểm nằm trong hình chữ nhật PIER (x0..x1, z ± hw) thì
     `y = Math.max(y, PIER.y)`.
   - `resolveWater()`: nếu điểm nằm trong hình chữ nhật PIER (nới 0.2) thì bỏ qua,
     không đẩy ra bờ.
   - Kiểm tra điểm neo x0 = −10.6: nằm trong vành đệm `blocked()` của bồn hoa Tây
     nhưng **ngoài** elip hoa nhìn thấy được (a 5) — khi chụp nghiệm thu phải xác
     nhận đầu cầu gỗ không đè lên hoa; nếu đè, dịch cả PIER xuống z = 24.2.
2. `src/temple.ts`: dựng nhóm thủy đình:
   - Sàn gỗ/đá chạy suốt PIER: hộp (x1−x0) × 0.18 × (hw*2) ở y = PIER.y − 0.09,
     lan can thấp hai bên đoạn trên mặt nước (thanh ngang gỗ ở y +0.55, cọc nhỏ
     mỗi 1.2) — chừa trống đầu phía bờ.
   - Đình ở tâm (−6.7, 23): sàn riêng 4.4 × 3.4 dày 0.22 trên mặt sàn cầu; 4 cột đỏ
     r 0.16 cao 2.6 ở 4 góc; mái `roofGeometry(5.8, 5.0, 1.6, 0.6)` + chóp vàng;
     bảng `THỦY ĐÌNH` quay mặt về phía Đông (về phía cầu trục).
   - 3 ghế ngồi (`seats.push`) trên sàn đình: 1 quay Đông (ngắm cầu/hồ), 1 quay
     Bắc, 1 quay Nam — theo đúng mẫu `Seat { x, z, ry }` hiện có.
   - Collider: 4 cột đình r 0.25. Zone `{ x: -6.7, z: 23, r: 4.5, id: 'thuyDinh' }`.
   - Cọc gỗ tròn dưới sàn đoạn trên mặt nước (mỗi 1.5 một cọc, chìm xuống đáy) để
     sàn không trông như bay.
3. `src/couplets.ts`: thêm mục `thuyDinh` (âm + nghĩa) theo format hiện có.
4. (Mở rộng, chỉ làm nếu tìm thấy điểm gọi sẵn trong `main.ts` trong ≤ 15 phút):
   tương tác ở zone `thuyDinh` gọi `world.spawnLantern()` thả một đèn hoa đăng.
   Không tìm thấy thì bỏ qua và ghi rõ trong báo cáo — không tự chế cơ chế mới.

**Ảnh nghiệm thu:** (a) từ cầu trục nhìn sang đình; (b) đứng trên sàn đình nhìn về
cầu/cổng; (c) đi thử: nhân vật đi từ bờ Tây ra đình và ngồi được trên ghế;
(d) ảnh chứng minh đứng trên cầu vẫn bình thường và bơi/đi ở phần hồ còn lại vẫn bị
đẩy ra bờ như cũ (không phá `resolveWater`).

**Commit:** `feat: Thuy Dinh pavilion on the lake (masterplan GD1)`

---

## Gói 6 — Tượng La Hán dọc hai hành lang (±20.5, z −19..−1)

**Mục tiêu:** hành lang có mái sẵn có trở thành hành lang La Hán kiểu Bái Đính.

**Sự thật trong code:** hành lang đã hoàn chỉnh (sàn, cột mỗi 3.6 m ở lệch ±1.7,
tay vịn, mái dốc, đèn, ghế dài phía trong ở lệch −side × 1.3). Việc của gói này chỉ
là thêm tượng — **không sửa cấu trúc hành lang**.

**Việc làm:**
1. `src/statues.ts`: thêm `buildArhat(variant: 0 | 1 | 2)` dựng tượng La Hán ngồi
   theo đúng quy tắc tượng của dự án (spec tượng Phật/Quan Âm): thân khối tròn trịa
   mặc áo tràng (lathe/cone bo tròn), đầu khối trơn, **mặt vẽ bằng texture — mắt là
   nét cong nhắm, không tạc hốc mắt/sống mũi**; 3 biến thể tư thế tay bằng các khối
   tay tròn không ngón (tay để trong lòng / một tay nâng / hai tay ôm bát); màu áo
   luân phiên trong nhóm màu trầm (vàng đất, xám lam, nâu). Tượng cao ~1.15 khi ngồi.
2. `src/temple.ts`: đặt **10 tượng mỗi bên (tổng 20)**: bệ đá 0.8 × 0.55 × 0.8;
   tượng ngồi trên bệ, **quay mặt vào trục**; vị trí z từ −18.2 tới −1.8 bước ~1.82;
   lệch ngang **luân phiên** giữa hàng trong (lệch −side × 1.5, phía trục) và hàng
   ngoài (lệch +side × 1.5) để không chắn lối đi và không đụng ghế dài (ghế ở
   z ≈ −16.6, −9.4, −2.2 — lệch z của tượng đã tránh các vị trí này, khi đặt phải
   kiểm tra lại từng vị trí); collider mỗi tượng r 0.42.
   Kiểm tra va chạm với cột hành lang (cột ở lệch ±1.7, z = −18.4, −14.8, −11.2,
   −7.6, −4.0): tượng lệch ±1.5 và z so le 0.9 so với cột — khoảng cách chéo ~0.9,
   đạt; vị trí nào chồng thì dịch z ±0.3 trong giới hạn cho phép và ghi lại.
3. Không thêm zone mới (popup khu vực đã có `hanhLang` qua bảng cột đầu hành lang).

**Ảnh nghiệm thu:** (a) đứng đầu hành lang Đông nhìn dọc: thấy dãy tượng hai hàng
so le; (b) cận cảnh 1 tượng chính diện (chấm mặt tượng theo quy tắc chống kinh dị);
(c) đi thử dọc hành lang không bị kẹt.

**Commit:** `feat: arhat statues along both corridors (masterplan GD1)`

---

## Sau GĐ1

Cả 6 gói xong → chụp 1 ảnh toàn cảnh bằng admin cam (góc F3 nếu đã làm) gửi nghiệm
thu tổng GĐ1 đối chiếu masterplan, rồi mới bàn GĐ2 (mở tường Bắc + Điện Tam Thế).
