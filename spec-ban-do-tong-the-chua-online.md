# BẢN ĐỒ TỔNG THỂ CHÙA ONLINE — BẢN CUỐI (đã gộp)

> Đây là masterplan duy nhất làm chuẩn. Nó gộp: (1) bản thiết kế của Lux
> (2026-11-10, kèm ảnh ý tưởng `ban-do-tong-the-chua-online` trong `imagine_media`)
> và (2) tài liệu `spec-mat-bang-chua-online.md` trong repo (commit `6871320`).
> File trong repo giữ vai trò bản tham khảo; khi hai bản lệch nhau, **bản này thắng**.
> Xem mục 8 để biết từng điểm gộp đã quyết thế nào.
>
> Hệ tọa độ theo `src/layout.ts`: trục x ngang (Đông dương), trục z dọc,
> **Bắc = z âm, Nam = z dương**. Cổng chính phía Nam (z = 45), chính điện phía Bắc
> (z = −32). Đơn vị là mét trong game. Ảnh ý tưởng chỉ là sơ đồ minh họa —
> tọa độ và danh mục trong file này mới là chuẩn.

## 1. Nguồn tham khảo (đã tra cứu 2026-11-10)

- **Bái Đính (Ninh Bình):** một trục chính leo dần theo cao độ: Cổng Tam Quan →
  hai dãy hành lang La Hán (500 tượng đá, mỗi bên 250) chạy dọc trục → Gác Chuông →
  Điện Quan Âm → Điện Pháp Chủ (Thích Ca) → **Điện Tam Thế ở cao nhất**; Bảo Tháp
  13 tầng thờ xá lợi đứng cạnh điện trên cùng; chùa cổ nằm xa trục trên núi.
- **Tam Chúc (Hà Nam):** hành trình bắt đầu **trên mặt nước**: Tam Quan Ngoại →
  nhà khách Thủy Đình nổi trên hồ → thuyền qua hồ → Tam Quan Nội → **Vườn Cột Kinh**
  (32 cột đá khắc kinh cao 13,5 m) → **Tam Điện leo dần: Quan Âm → Pháp Chủ →
  Tam Thế (cao và lớn nhất)** → Chùa Ngọc trên đỉnh là điểm cao nhất quần thể;
  đình cổ trên đảo giữa hồ. Phong thủy: nước phía trước, núi phía sau.
- **Chùa Hương (Hà Nội):** chùa là một **hành trình**: bến đò → xuôi suối Yến →
  **Đền Trình** (dừng "trình diện" trước tiên) → chùa Thiên Trù (chùa Ngoài) →
  đường núi qua Giải Oan, Cửa Võng → **động Hương Tích (chùa Trong)** là đích trong
  cùng, linh thiêng nhất. Mức linh thiêng tăng dần từ ngoài vào trong.

Khung áp dụng: **Bái Đính** cho trục thẳng + hành lang, **Tam Chúc** cho mặt nước
và các hạng mục "chữ ký" (Thủy Đình, Vườn Cột Kinh), **Chùa Hương** cho cảm giác
hành trình có trạm đầu và đích cuối.

## 2. Nguyên tắc bố cục

1. **Một trục thần đạo thẳng, đối xứng hai bên** — mọi công trình chính nằm trên
   trục Nam→Bắc (x = 0); giữ trục thông suốt từ tam quan đến điện cuối, không đặt
   vật cản lên trục.
2. **Cao độ = cấp bậc:** càng vào sâu/lên cao càng linh thiêng; điện trên cùng
   luôn là Tam Thế. Nền leo bậc: sân thấp, sàn bồ đoàn cao hơn, chính điện trên
   bệ 1.35, điện Tam Thế trên nền ~3.0.
3. **Nước ở phía trước** (minh đường): cổng → mặt nước → mới vào sân lễ; phía sau
   là cây/rừng làm "hậu chẩm".
4. **Hành trình có trạm đầu và đích cuối:** trình diện ở Đền Trình ngay sau cổng;
   đích là điểm trong cùng/cao nhất (Điện Tam Thế, Am Cổ), không phải điện đầu tiên gặp.
5. **Vành đai phụ trợ nằm ở rìa yên tĩnh:** nhà Tổ, tăng xá, trai đường, vườn tháp —
   không chen lên trục chính, không đặt sau lưng điện chính trên trục.

## 3. Hiện trạng khuôn viên (từ `src/layout.ts`, đã kiểm chứng ở HEAD `1cb0550`)

| Hạng mục | Tọa độ | Ghi chú |
|---|---|---|
| Tường rào | x ±47, z từ −45 đến 45 | Cổng Nam, `gate` 4.4 mỗi bên trục |
| Chính điện | (0, −32), nửa rộng 17 × nửa sâu 10 | Bệ cao 1.35; 8 cột, mái 3 tầng, cao 22.47 (commit `4dae30a`) |
| Sân đài thiền (DECK) | \|x\| 4.6–17.2, z −18.6..−4 | Đối xứng hai bên trục |
| Hành lang (CORR) | x = ±20.5, z −19..−1 | Rộng 3.8 |
| Quảng trường (PLAZA) | (0, 6), r 8.4 | Sân trước chính điện |
| Đường ngang (PATH_Z) | z = 2 | Chạy x −40..40 |
| Hồ cá koi (LAKE) | (0, 22), a 9 × b 6.5 | Elip giữa tam quan và sân |
| Cầu (BRIDGE) | x = 0, z 14.2..29.8 | Rộng 2.3, đỉnh cao 1.4 |
| Tháp chuông (BELL) | (−34, −6) | Tây |
| Tháp Quan Âm (QUAN) | (28, 14) | Đông, tháp vuông 4 trụ |
| Tượng Phật sân Tây (BUDDHA_YARD) | (−28, 14) | |
| Tháp nhỏ (PAGODA) | (38, −14) | Đông Bắc |
| Vườn thiền (ZEN) | (−34, −26) | Tây Bắc |
| Khu nghỉ (REST) | (27, 31) | Đông Nam |
| Hai bồn hoa bên hồ | (±16.5, 23), a 5 × b 3.5 | |

**Phần còn thiếu so với bố cục chùa Việt:** tam quan mới là cổng mở trong tường,
chưa phải công trình có mái đúng nghĩa; chưa có lầu trống đối xứng tháp chuông;
trục chưa có "trạm đầu" (Đền Trình) và "đích cuối" đúng nghĩa (điện cao nhất phía
sau); chưa có nhà Tổ/tăng xá; hành lang chưa có tượng La Hán.

## 4. Kế hoạch tổng thể (giữ nguyên mọi thứ đã xây)

Đọc theo trục từ Nam lên Bắc. [CÓ] đã có · [MỚI] bổ sung theo giai đoạn.

### Giai đoạn 1 — trong tường hiện tại (toàn hạng mục nhỏ, hiệu quả cao)

| # | Hạng mục | Vị trí | Trạng thái / ghi chú |
|---|----------|--------|----------------------|
| 1 | Tam Quan | (0, 45) | [CÓ] |
| 1b | **Nâng cấp Tam Quan thành công trình có mái 2 tầng**, cao ~9–10, 3 lối (giữa 4.4) | (0, 45) | [MỚI · GĐ1] — điểm "thiếu" do bản repo chỉ ra |
| 2 | **Đền Trình** — đền nhỏ "trình diện", điểm bắt đầu tuyến nhiệm vụ hành hương | (9, 39), trong cổng phía Đông | [MỚI · GĐ1] |
| 3 | Hồ + cầu trục | (0, 22) | [CÓ] |
| 4 | **Thủy Đình** — đình nhỏ **giữa hồ** phía Tây cầu, điểm thả đèn hoa đăng/ngắm cảnh | (−6.5, 23) | [MỚI · GĐ1] — "chữ ký" Tam Chúc |
| 5 | Sân Phật ngoài trời (BUDDHA_YARD) | (−28, 14) | [CÓ] |
| 6 | Tháp Quan Âm | (28, 14) | [CÓ] |
| 7 | Quảng trường | (0, 6) | [CÓ] — giữ nguyên bán kính 8.4 |
| 8 | **Vườn Cột Kinh** — 2 hàng cột đá khắc kinh dọc mép đường trục, mỗi bên 5 cột | x ±3.4, z −2..−10 | [MỚI · GĐ1] — Kilo kiểm tra chồng lấn mép sàn bồ đoàn |
| 9 | **Hành lang La Hán** — hành lang có mái dọc 2 hành lang hiện hữu + dãy tượng La Hán quay mặt vào trục, ~12 tượng/bên, điểm xuyết bia đá | x ±20.5, z −19..−1 | [MỚI · GĐ1] — mái hành lang thấp (5–6) để không át chính điện |
| 10 | Tháp chuông | (−34, −6) | [CÓ] |
| 11 | **Gác Trống** — đối xứng tháp chuông qua trục (tả chung hữu cổ), làm điểm tương tác đánh trống | (34, −6) | [MỚI · GĐ1] — dùng lại hàm dựng tháp chuông, đổi hình khối. Không dời vào ±22 vì chạm hành lang ±20.5 |
| 12 | Điện Pháp Chủ = chính điện hiện tại (đổi vai trò/đặt biển) | (0, −32) | [CÓ] |
| 13 | Tháp nhỏ (PAGODA) | (38, −14) | [CÓ] |
| 14 | Vườn Thiền | (−34, −26) | [CÓ] |
| 15 | Khu nghỉ + bồn hoa bờ hồ | (27, 31) · (±16.5, 23) | [CÓ] |
| 9b | (Tùy chọn, sau khi mục 9 xong) kéo hành lang nối vòng quanh quảng trường thành khung bao sân kiểu Bái Đính | vòng quanh PLAZA | Cập nhật `CORR` + `blocked()`; chỉ làm nếu không chật trục/đường ngang |

### Giai đoạn 2 — mở rộng phía Bắc: dời tường Bắc z −45 → −64, nền đất leo bậc

| # | Hạng mục | Vị trí | Ghi chú |
|---|----------|--------|---------|
| 16 | **Điện Tam Thế** — điện lớn nhất, cao nhất, trên nền ~3.0 với thang lớn giữa trục | (0, −54) | Đích cao nhất của trục, như Bái Đính/Tam Chúc |
| 17 | **Bảo Tháp** — tháp đá nhiều tầng thờ xá lợi, cạnh Điện Tam Thế phía Tây | (−17, −52) | Như Bảo Tháp Bái Đính. Khác với tháp nhỏ PAGODA có sẵn |
| 18 | **Am Cổ** — am đá nhỏ cổ kính, điểm "chùa Trong" ở góc Tây–Bắc | (−38, −50) | Đích hành hương yên tĩnh |
| 19 | **Vườn Tháp** — cụm tháp mộ đá nhỏ trong cây, góc Đông–Bắc | (36, −48) | |
| 19b | Dải cây dày dọc tường Bắc mới làm "hậu chẩm" | z ≈ −60..−64 | Che tường hậu, tạo núi tựa |

### Giai đoạn 3 — đời sống chùa (rìa yên tĩnh, ngoài trục)

| # | Hạng mục | Vị trí | Ghi chú |
|---|----------|--------|---------|
| 20 | **Nhà Tổ** — thờ tổ sư, sau lưng Điện Pháp Chủ phía Tây | (−27, −38) | Trong tường hiện tại |
| 21 | **Tăng xá + trai đường** dọc tường Tây | (−40, −16) | Khu sinh hoạt; có thể gắn NPC/shop |
| 22 | Điện Mẫu nhỏ phía Đông (tùy chọn — chùa Bắc thường có) | (38, 4) | Chỉ làm nếu muốn đủ bộ tín ngưỡng Bắc |
| 23 | Nhà khách phía Đông–Bắc (tùy chọn, từ bản repo) | (30, −26) | Điểm đón khách/NPC; chỉ làm nếu GĐ3 còn ngân sách công việc |
| 24 | Thiền đường nhỏ (tùy chọn) gom cụm với Vườn Thiền | cạnh ZEN (−34, −26) | Vườn Thiền đã đảm nhiệm phần sân thiền ngoài trời |

### Cao độ bậc thang theo trục
Cổng/hồ 0 → quảng trường 0 → sàn bồ đoàn ~0.6 → Điện Pháp Chủ 1.35 →
nền Điện Tam Thế ~3.0.

## 5. Khoảng cách và tỷ lệ tham chiếu (chỉnh sau khi xem trong game)

| Quan hệ | Khoảng cách gợi ý (m) |
|---|---|
| Tam quan đến tâm hồ | 15–20 |
| Cầu đến quảng trường | 8–10 |
| Quảng trường đến chân chính điện | 12–15 |
| Chuông/trống cách trục | 34 (giữ nguyên vị trí hiện hữu) |
| Công trình phụ cách chính điện | 6–10 |
| Bề rộng lối đi chính | 4–5 |
| Bề rộng hành lang | 3.8 (hiện tại) |

Chiều cao tương đối: Điện Tam Thế cao nhất khi hoàn thành GĐ2 (nền 3.0 + điện lớn);
trước GĐ2 thì chính điện (22.47) là cao nhất. Bảo Tháp gần ngang chính điện;
tam quan 9–10; chuông/trống 10–12; hành lang/tăng xá 5–6.

## 6. Luồng người chơi

1. Vào cổng Nam: qua Tam Quan, dừng Đền Trình "trình diện" (bắt đầu tuyến nhiệm vụ).
2. Qua cầu trên hồ (ghé Thủy Đình thả đèn), đến quảng trường: thắp hương, nhận nhiệm vụ.
3. Rẽ Tây: tháp chuông, Phật sân, Vườn Thiền. Rẽ Đông: tháp Quan Âm, khu nghỉ.
4. Đi thẳng dọc Vườn Cột Kinh, qua hành lang La Hán, vào Điện Pháp Chủ lạy Phật.
5. (GĐ2) Leo tiếp lên Điện Tam Thế — đích cao nhất; Am Cổ là điểm dừng cuối yên tĩnh,
   hợp để đặt nhiệm vụ đặc biệt.

## 7. Lưu ý kỹ thuật khi triển khai

- Mọi công trình mới phải thêm collider và vùng cấm vào `blocked()`; cây/hoa ngẫu
  nhiên ở `src/world.ts` không được mọc đè công trình mới. Khi dời tường (GĐ2):
  sửa `WALL` trong `src/layout.ts` rồi kiểm tra `clampToCompound()`, `blocked()`
  và vùng sinh cảnh ngẫu nhiên.
- Theo quy tắc "mọi thứ phải chạm nhau" của dự án: công trình nối với hành lang/
  sân qua bậc thềm, không để khe hở (kiểm bằng `sealArchitectureJoints` như các
  vòng trước).
- Mô hình mới dùng lại vật liệu sẵn có (`tileM`, `redM`, `goldM`…) để đồng bộ phong cách.
- Không đổi tọa độ các hạng mục [CÓ]. Hạng mục [MỚI] khi vào spec chi tiết được
  phép tinh chỉnh ±vài đơn vị nếu vướng collider/địa hình, nhưng phải giữ vị trí
  tương đối trên trục và tính đối xứng.

## 8. Nhật ký gộp — đã quyết thế nào với bản repo (`6871320`)

**Lấy từ bản repo vào bản này:**
- Bảng hiện trạng chi tiết (DECK/CORR/PATH_Z/BRIDGE) và nhận định "tam quan chưa
  có mái đúng nghĩa" → mục 1b.
- Gợi ý dùng lại hàm dựng tháp chuông cho Gác Trống; lý do giữ chuông/trống ở
  ±34 thay vì ±22 (chạm hành lang).
- Ý tưởng hành lang nối vòng quanh quảng trường → mục 9b (tùy chọn).
- Bảng khoảng cách/tỷ lệ (mục 5), luồng người chơi (mục 6), lưu ý kỹ thuật (§9 của
  bản repo → mục 7), dải cây "hậu chẩm" (mục 19b), nhà khách (mục 23), thiền đường
  gom cụm Vườn Thiền (mục 24).

**Không lấy / đã đổi:**
- *Hậu đường/nhà Tổ ở (0, −50) trên trục, tường Bắc lùi z −62:* **bỏ.** Đặt nhà Tổ
  lên trục chính sau chính điện vừa trái nguyên tắc "phụ trợ ở rìa yên tĩnh" (chính
  bản repo cũng nêu nguyên tắc này), vừa chiếm đúng vị trí của Điện Tam Thế —
  hạng mục mà cả Bái Đính lẫn Tam Chúc đều dành cho điểm cao nhất của trục. Thay
  bằng: Điện Tam Thế (0, −54), tường lùi **−64**, Nhà Tổ ở (−27, −38).
- *Đình thủy tạ bờ Đông hồ (14, 28):* **bỏ**, thay bằng Thủy Đình giữa hồ (−6.5, 23)
  — đình trên mặt nước mới là "chữ ký" Tam Chúc; điểm (14, 28) lại sát bồn hoa Đông
  và cửa cầu, dễ chật. Ngắm cá từ bờ đã có ghế ở hai bồn hoa đảm nhiệm.
- *Tăng xá phía Đông (30, −26) làm khu chính:* đổi thành tăng xá + trai đường dọc
  tường **Tây** (−40, −16) để phía Đông giữ cho thờ tự/nghỉ ngơi; vị trí Đông của
  bản repo chỉ còn là nhà khách tùy chọn (mục 23).
- *Coi tháp PAGODA (38, −14) là "bảo tháp":* tách rõ — đó là tháp nhỏ trang trí;
  Bảo Tháp thờ xá lợi là hạng mục mới riêng ở GĐ2 (−17, −52).

## 9. Cách dùng bản đồ này

- Đây là **định hướng tổng thể**, không phải spec thi công. Mỗi giai đoạn khi bắt
  đầu sẽ tách thành spec riêng + prompt Kilo riêng, theo quy trình 1 spec = 1 session.
- Thứ tự ưu tiên: GĐ1 (rẻ, toàn hạng mục nhỏ, hiệu quả "giống chùa thật" tăng mạnh)
  → GĐ2 (thay đổi lớn nhất: mở đất + Điện Tam Thế) → GĐ3 (hoàn thiện)
  → **sau khi khuôn viên hoàn thiện** mới làm các gói hệ thống **R1 → R2 → R3 → R4**
  (giữ chân, nghi lễ sâu, xã hội, phát hành — chi tiết ở
  `~/workspace/doi-chieu-chuaonline-org.md`; thứ tự này do người dùng chốt
  2026-11-10: thiết kế/xây dựng xong khuôn viên trước, hệ thống làm sau).
- Khi bắt đầu thi công thật, chép file này vào repo thay cho vai trò chuẩn của
  `spec-mat-bang-chua-online.md` để Kilo chỉ bám một bản.
