# PHẦN B — HỆ THỐNG: CÁC BƯỚC R1 → R4 (BẢN LÀM LẠI)

> Làm lại ngày 2026-11-11, đối chiếu trực tiếp code tại HEAD `d25a7e4` (repo
> `byluvtn/ChuaOnline`) + báo cáo Mục 21 GĐ3 (chưa commit). Bản này thay thế
> mục Phần B trong `lo-trinh-du-an-chua-online.md` (bản cũ viết khi chưa quét
> lại code sau đợt xây đêm 10→11/11, nên vài mục đã làm xong mà lộ trình vẫn
> ghi "chưa có").
>
> Quy tắc giữ nguyên: 1 bước = 1 session Kilo = 1 commit riêng; `git add` từng
> đường dẫn; typecheck pass; nghiệm thu bằng hành vi thật trong game, không
> chỉ mô phỏng; nội dung tự viết, không chép chuaonline.org.
>
> Cập nhật 2026-11-11: **Phần C (R5 — Con đường tu tập)** đã được gộp vào
> cuối tài liệu này — cuộn xuống cuối để đọc thiết kế phase chạy sau R4.

## Bước 0 — Đóng Phần A trước khi mở Phần B

- Commit Mục 21 (2 commit như Lux đã soạn) + Lux chấm bộ ảnh cổng Phần A
  (`gd3-21a-pano-*`, `gd3-21a-axis`) → tuyên bố đóng băng bố cục khuôn viên.
- Từ đây chỉ sửa lỗi khuôn viên, không thêm công trình.

## Trạng thái thật sau khi quét code (căn cứ của bản làm lại)

| Mục | Trạng thái | Bằng chứng trong code |
|---|---|---|
| R1.1 Điểm danh/streak | CHƯA CÓ | 0 kết quả `checkin/streak` toàn repo |
| R1.2 Hòm thư | CHƯA CÓ | 0 kết quả `mail/mailbox` |
| R1.3 Vòng quay | CHƯA CÓ | 0 kết quả `spin`; nhưng khung `MINIGAMES` + `claimMinigame` đã sẵn |
| R1.4 Hệ số thời khoá | CHƯA CÓ | `ACTION_RULES` (shared/game.ts) chỉ có merit/cooldown/boostItems |
| R1.5 Mốc tích lũy | CHƯA CÓ | `level_rewards` mới là thưởng **theo cấp**; chưa có bộ đếm trọn đời |
| R2.1 Xin xăm | CÓ BẢN TỐI THIỂU | `src/features/fortune.ts`: 1 quẻ/ngày nhưng chốt bằng localStorage phía client, bốc ngẫu nhiên |
| R2.2 Tràng hạt 108 UI riêng | CHƯA CÓ | Đã có action + animation lần hạt (character.ts), chưa có UI vòng 108 hạt |
| R2.3 Đèn hiện điều ước | **ĐÃ XONG** | Server tạo `Lantern {name, wish}` phát cả phòng; client hiện feed điều ước; zoneBtn Thủy Đình mở hộp ước |
| R3.1 Tặng quà | CHƯA CÓ | 0 kết quả `gift/tặng` (chờ nền hòm thư R1.2) |
| R3.2 Chụp ảnh | CHƯA CÓ | 0 kết quả `photo/toDataURL` |
| R3.3 Bia công đức | CHƯA CÓ | Chưa có bia/stele trong thế giới |
| R4.1 Trang bìa SEO | CHƯA CÓ | `index.html` vẫn là trang game trần, chưa có thẻ OG |
| R4.2 PWA | **ĐÃ CÓ GẦN ĐỦ** | Có `manifest.webmanifest` + icon + panel "Cài vào màn hình" hoàn chỉnh (`src/features/install.ts`); còn kiểm chứng service worker |
| R4.3 Push | CHƯA CÓ | Chưa có `web-push` trong package.json, chưa có endpoint đăng ký |

**Hệ quả:** R2 rút từ 3 bước xuống còn ~1,5 bước; R4 rút còn ~2 bước. Khối việc
chính của Phần B là **R1 (5 bước)** và **R3 (3 bước)**. Tổng Phần B ≈ **12
session Kilo**.

---

## R1 — GIỮ CHÂN (5 bước, làm trước)

### Bước R1.1 — Điểm danh 7 ngày + streak
- Server: bảng `checkins` (player_id, day_key, streak, cycle_day) hoặc cột mở
  rộng trên `players` — chốt trong spec; hàm claim dùng `dayKey()` sẵn có
  trong `server/db.ts`, server là nơi chốt, client không tự tính.
- Thưởng 7 ngày tăng dần: ngày 1–6 thưởng Sen tăng dần, ngày 7 thưởng lớn
  (Sen + 1 lễ vật). Đứt 1 ngày → streak về 0, bắt đầu lại ngày 1.
- Client: panel lịch 7 ô (module mới trong `src/features/`), ô hôm nay sáng,
  nút Nhận; trạng thái đã nhận hiện rõ.
- Nghiệm thu: nhận 2 lần trong ngày bị server chặn; giả lập qua ngày →
  streak +1; giả lập bỏ 1 ngày → về ngày 1; thưởng cộng đúng vào Sen/túi.

### Bước R1.2 — Hòm thư tối thiểu (nền bắt buộc cho R3.1)
- Server: bảng `mail` (id, to_player, title, body, gift JSON, read_at,
  claimed, created_at); socket `mail:list`, `mail:read`, `mail:claim` — claim
  chỉ cộng quà 1 lần.
- **Quà nhập môn:** khi tạo tài khoản mới, tự sinh 1 thư chào mừng kèm quà
  (Sen + hương/nến/đèn cơ bản). Tài khoản cũ (72 tài khoản hiện hữu): gửi 1
  thư "quà ra mắt hòm thư" tương tự khi R1.2 lên sóng — không ai bị thiệt.
- Client: nút Thư trong menu (điểm bám `src/menu.ts`) + chấm đỏ khi có thư
  chưa đọc; panel thư: danh sách, đọc, nhận quà.
- Nghiệm thu: tài khoản mới đăng ký → có thư + nhận quà được đúng 1 lần;
  chấm đỏ mất sau khi đọc hết; claim lại không cộng thêm.

### Bước R1.3 — Vòng quay lộc 1 lượt/ngày
- Server: thêm 1 mục `spin` vào bảng `MINIGAMES` sẵn có
  (`server/index.ts`, cơ chế `minigame:reward` + `claimMinigame` đếm lượt
  theo ngày) — không xây cơ chế đếm mới.
- Bảng thưởng: chủ yếu Sen nhỏ (5–30), tỉ lệ thấp (~5%) ra lễ vật; server
  quyết định kết quả, client chỉ quay hình cho khớp.
- Client: vòng quay trong panel minigame (`src/features/games.ts`).
- Nghiệm thu: quay lần 2 trong ngày bị chặn từ server; kết quả client khớp
  thưởng server trả; qua ngày quay lại được.

### Bước R1.4 — Hệ số thời khoá
- Server: hàm `meritMultiplier()` theo giờ Asia/Ho_Chi_Minh: **×2** trong 3
  khung thời khoá (5:00–5:20, 12:00–12:30, 20:00–20:30), **×1,5** ngày
  Mùng 1 + Rằm âm lịch. Áp vào handler `action` (`server/index.ts`) ngay sau
  `ACTION_RULES` — không sửa cấu trúc bảng thưởng.
- Âm lịch: nhúng bảng chuyển đổi cho các năm hiện tại (hoặc thuật toán gọn)
  vào `shared/` để cả client hiển thị dùng chung — chốt cách làm trong spec.
- Client: khi đang trong khung nhân, hiện 1 dòng thông báo ("Đang giờ thời
  khoá — công đức ×2"); ngoài khung, hiện khung giờ sắp tới trong panel
  Nhiệm vụ.
- Nghiệm thu: giả lập đồng hồ vào 3 khung + ngày Rằm/Mùng 1 → công đức nhận
  đúng hệ số; ngoài khung = ×1; ranh giới khung (phút đầu/cuối) đúng.

### Bước R1.5 — Mốc thành tựu tích lũy trọn đời
- Server: bảng/bộ đếm `stats` trọn đời (tổng số lạy, tổng giây thiền, tổng
  vòng tràng hạt hoàn thành, tổng đèn đã thả, tổng lượt tụng kinh) — tăng
  ngay trong các handler hành động tương ứng, server chốt.
- Mốc + thưởng một lần theo mẫu `level_rewards` sẵn có (bảng
  `stat_rewards` + claim chống nhận trùng). Mốc gợi ý (chốt số trong spec):
  lạy 100 / 300 / 1.000; thiền 30 / 60 / 180 phút; tràng hạt 7 / 30 vòng.
- Client: hiển thị tiến độ các mốc trong panel Nhiệm vụ hoặc
  `src/features/levels.ts`.
- Nghiệm thu: làm hành động → số đếm tăng đúng; đạt mốc → nhận thưởng đúng
  1 lần; đăng nhập lại số liệu còn nguyên (đã lưu DB).

---

## R2 — NGHI LỄ SÂU (đã vơi một nửa)

### Bước R2.1 — Xin xăm: nâng cấp bản tối thiểu (nhẹ, ưu tiên thấp)
Bản hiện tại (`src/features/fortune.ts`) đã có 1 quẻ/ngày nhưng chốt bằng
localStorage phía client và bốc ngẫu nhiên — đổi máy hoặc xóa dữ liệu là xin
lại được. Nâng cấp 3 việc:
- Chốt phía server theo (tài khoản + `day_key`): trong ngày xin lại vẫn ra
  đúng quẻ cũ trên mọi thiết bị; server lưu quẻ của ngày vào DB.
- Kiểm đếm bộ `FORTUNES` hiện có; bổ sung **tự viết** tới tối thiểu 30 quẻ
  (mỗi quẻ: số, bậc, thơ 4 câu tự sáng tác, lời giải ngắn: tổng quát / công
  việc / tình cảm / sức khỏe, giọng nhẹ nhàng, không phán tiêu cực nặng).
- Xem lại quẻ hôm nay từ panel Xin xăm (không bốc lại).
- Nghiệm thu: xin quẻ → đăng xuất → máy/trình duyệt khác đăng nhập xin tiếp
  → ra đúng quẻ cũ; qua ngày mới bốc quẻ mới.

### Bước R2.2 — Tràng hạt lần tay 108 (việc chính của R2)
- Client: module mới `src/features/beads.ts` — UI vòng 108 hạt quanh màn
  hình; chạm hoặc Space lần từng hạt (hạt sáng dần theo vòng), đếm số câu
  niệm; nhân vật ngồi bồ đoàn + chạy animation lần hạt đã có
  (`character.ts`, `BEADS_MS`) đồng bộ theo nhịp hạt.
- Server: chỉ cộng thưởng khi hoàn thành đủ 108 hạt trong một phiên hợp lệ
  (chốt qua action/minigame sẵn có, có thời gian tối thiểu chống auto-click
  gian lận).
- Tái dùng logic đếm niệm hiện có trong panel tụng kinh, không viết lại hệ
  tụng kinh.
- Nghiệm thu: lần đủ 108 mới có thưởng; thoát giữa chừng = không thưởng;
  nhịp hạt khớp chuyển động tay; Space và chạm đều chạy.

### R2.3 — Đèn hoa đăng hiện điều ước: ĐÃ XONG, không làm lại
- Server đã nhận `wish`, tạo đèn kèm pháp danh + điều ước phát cho cả phòng;
  client đã hiện feed điều ước; nút ngữ cảnh ở Thủy Đình đã mở hộp điều ước
  (kiểm chứng tại `d25a7e4`).
- Việc tùy chọn duy nhất còn lại (không chặn, để sau nếu thích): cho chữ điều
  ước bay ngay trên đèn 3D thay vì chỉ ở feed.

---

## R3 — XÃ HỘI (3 bước)

### Bước R3.1 — Tặng quà qua hòm thư (phụ thuộc R1.2)
- Luồng: chọn người chơi (đang cùng phòng hoặc từ danh sách) → chọn 1 lễ vật
  trong túi + lời nhắn (giới hạn độ dài + lọc từ bằng hàm `clean()` sẵn có
  như điều ước đèn) → server trừ túi người gửi, sinh thư kèm quà trong hòm
  thư người nhận (dùng đúng bảng `mail` của R1.2).
- Chống farm: giới hạn số lượt tặng/ngày phía server (đếm theo ngày như
  `minigame_daily`); không tự tặng chính mình.
- Nghiệm thu: hai tài khoản thật — quà trừ đúng người gửi, vào đúng hòm thư
  người nhận, nhận quà cộng đúng túi; vượt giới hạn ngày bị chặn.

### Bước R3.2 — Chụp ảnh trong game
- Nút chụp: ẩn UI → render 1 khung qua composer (`src/post.ts`) → chụp
  `canvas.toDataURL` **ngay trong cùng frame sau render** (cách chuẩn tránh
  ảnh đen của WebGL, không cần `preserveDrawingBuffer`).
- Đóng dấu: vẽ overlay 2D — tên game + pháp danh người chụp + ngày, góc dưới
  ảnh; tải xuống file PNG.
- Nghiệm thu: ảnh tải về đúng khung hình đang thấy (không đen, không lệch
  tỉ lệ), có watermark đọc được; chụp ở cả desktop + mobile.

### Bước R3.3 — Bia công đức
- Dựng bia đá tại sân trước (tọa độ chốt trong spec R3 — gợi ý rìa quảng
  trường phía cổng, không chắn trục); khắc tên bằng texture canvas như cột
  kinh đã làm.
- Nội dung bia: người chơi công đức cao nhất **tuần** — server chốt theo
  `weekly_merit` + `week_key` sẵn có trong `players`; client dựng lại
  texture khi sang tuần/mỗi lần vào chùa. Chỉ công đức trong game, **không
  gắn tiền thật**.
- Nghiệm thu: tên trên bia khớp hạng 1 bảng xếp hạng tuần; giả lập qua tuần
  → bia đổi tên đúng.

---

## R4 — PHÁT HÀNH (đã xong một phần)

### Bước R4.1 — Trang bìa SEO (chưa có)
- Tách trang giới thiệu riêng khỏi trang game: landing ở đường gốc, game
  chuyển vào đường dẫn con (chốt `/choi` hay giữ nguyên trong spec; cập nhật
  `start_url` trong manifest cho khớp).
- Nội dung landing: tên game + mô tả ngắn, cách chơi và điều khiển (viết
  kiểu how-to ngắn), ảnh chụp thật từ admin cam (bộ ảnh cổng Phần A dùng
  lại được), nút "Chơi ngay".
- Meta đầy đủ: description, Open Graph (title/description/image), thẻ
  canonical. Đây là phần chuaonline.org đang làm tốt hơn mình rõ nhất.
- **Chốt tên hiển thị trước khi làm bước này:** tên "Chùa Online" đang
  trùng một sản phẩm khác đang sống (có fanpage + tuyên bố bản quyền). Cần
  tên phân biệt (thêm tiền tố/hậu tố riêng) cho landing + fanpage, tránh
  nhầm lẫn và khiếu nại về sau.

### R4.2 — PWA: ĐÃ CÓ GẦN ĐỦ, chỉ kiểm chứng + bổ sung nếu thiếu
- Đã có: `manifest.webmanifest`, bộ icon, metas cài đặt, panel "Cài vào màn
  hình" hoàn chỉnh cho Android/iOS (`src/features/install.ts`).
- Còn làm: kiểm chứng service worker — đã đăng ký chưa, cache vỏ game
  (HTML/JS/CSS/icon) có cho mở lại khi mất mạng không. Thiếu thì bổ sung SW
  tối thiểu: cache-first cho vỏ tĩnh, network-first cho API/socket (không
  cache dữ liệu game).
- Nghiệm thu: Chrome Android cài được lên màn hình chính; bật chế độ máy
  bay mở app → hiện vỏ game + thông báo mất kết nối tử tế, không trắng
  trang.

### Bước R4.3 — Push notification (làm cuối cùng của Phần B)
- Thêm `web-push` vào server + bảng `push_subs` (endpoint, keys, player);
  API đăng ký/hủy đăng ký; người chơi bật/tắt trong panel Cài đặt, chỉ gửi
  khi đã cấp quyền.
- Hai loại nhắc đầu tiên: (1) streak sắp đứt — chiều tối kiểm tra ai hôm
  nay chưa điểm danh (phụ thuộc R1.1); (2) nhắc Mùng 1/Rằm (dùng chung lịch
  âm của R1.4).
- Nghiệm thu: đăng ký trên 1 máy thật → nhận được push thử; hủy đăng ký →
  không nhận nữa; người chưa cấp quyền không bị gửi.

### R4.4 — Kênh cộng đồng (ngoài code)
- Lập fanpage/nhóm dưới tên hiển thị đã chốt ở R4.1; gắn link vào landing
  và trong game (menu). Không code, làm song song lúc chờ các bước khác.

---

## Thứ tự thực thi + phụ thuộc

```
Bước 0 (đóng Phần A)
R1.1 → R1.2 → R1.3 → R1.4 → R1.5        (R1.2 là nền của R3.1; R1.4 cấp lịch âm cho R4.3)
R2.2 → R2.1 (nhẹ)                        (R2.3 đã xong)
R3.1 → R3.2 → R3.3
R4.1 → R4.2 (kiểm chứng) → R4.3 → R4.4
```

Sau Phần B: phiên audit Fable 5.2 theo bộ prompt đã soạn
(`prompt-audit-fable-chua-online.md`) — vị trí gợi ý: giữa R3 và R4, hoặc
ngay sau R4 như kế hoạch ban đầu của người dùng.

---

# PHẦN C — R5: CON ĐƯỜNG TU TẬP (trải nghiệm làm chú tiểu / sư thầy)

Thiết kế phase — chốt bởi chủ dự án ngày 2026-11-11; gộp vào tài liệu này theo yêu cầu của chủ dự án (bản riêng trước đây đã hợp nhất, không còn hai bản song song).
Vị trí: chạy **SAU R4** (khi game đã phát hành và có người chơi thật). Gồm 5 bước
R5.1 → R5.5; mỗi bước là một phiên Kilo riêng và sẽ có spec chi tiết riêng khi
bắt đầu, theo đúng nhịp R1.x. Tài liệu này chốt THIẾT KẾ và ranh giới, không
phải spec thi công.

---

## 1. Ý tưởng cốt lõi

Người chơi đang *đến chùa lễ Phật với tư cách phật tử*. Phase này mở thêm một
con đường thứ hai: **phát nguyện vào chùa tu tập** — bắt đầu là chú tiểu/tiểu ni
tập sự làm việc chấp tác và giữ thời khóa, tích lũy công phu, thọ giới lên Sa di,
rồi thành Sư thầy/Sư cô có vai trò phục vụ cộng đồng người chơi.

Game đã có sẵn gần hết nguyên liệu: nhân vật tiểu tăng/tiểu ni chọn được từ đầu;
NPC Sư Thầy và các chú tiểu NPC đã sống theo lịch trình mỗi ngày; giờ lễ
(R1.4), thống kê tích lũy trọn đời (R1.5), điểm danh (R1.1) và hòm thư (R1.2)
đều là đầu vào trực tiếp của hệ cấp bậc.

## 2. Nguyên tắc thiết kế (bất biến, mọi spec con phải tuân)

1. **Đường tu cho danh xưng, áo, nghi lễ và vai trò phục vụ — KHÔNG nhân công
   đức, không tăng tốc cày.** Nếu làm sư mà lên cấp nhanh hơn, mọi người chơi
   bị ép đi tu để tối ưu và game mất chất. Thưởng chấp tác ngang mức nhiệm vụ
   thường, không hơn.
2. **Không khóa nội dung cũ.** Đánh chuông, thả đèn, thiền… vẫn mở cho mọi
   phật tử như hiện tại. Cấp bậc thêm *nghi lễ và ý nghĩa* quanh hành động cũ,
   không tước quyền của ai.
3. **Luôn có lối ra.** Người chơi được **hoàn tục** bất cứ lúc nào (về làm phật
   tử, giữ nguyên mọi thống kê đã tích lũy) và phát nguyện lại sau nếu muốn.
   Không ai bị giam trong một quyết định giải trí.
4. **Áo và danh xưng chỉ đạt được bằng tu tập** — không bán trong Cửa hàng,
   không tặng qua sự kiện. Đây là ranh giới tôn trọng tối thiểu với hình ảnh
   người tu hành.
5. **Đối xứng nam/nữ:** đường nam — Tiểu tăng → Sa di → Sư thầy; đường nữ —
   Tiểu ni → Sa di ni → Sư cô. Điều kiện và quyền lợi giống hệt nhau.

## 3. Hệ cấp bậc

Cấp bậc tu tập là một trục **song song** với Cấp độ công đức hiện có (không
thay thế). Điều kiện neo vào số liệu R1.5 để công phu người chơi tích lũy từ
trước ngày phase lên sóng đều được tính (trừ hai bộ đếm mới của chính phase
này: việc chấp tác và buổi thời khóa).

| Hạng | Danh xưng (nam / nữ) | Điều kiện thọ hạng | Áo |
|---|---|---|---|
| 0 | Phật tử (mặc định) | — | Áo phật tử như hiện tại |
| 1 | Tập sự — Chú tiểu / Tiểu ni | Phát nguyện với Sư Thầy NPC + tổng công đức ≥ 100 + đã điểm danh ≥ 3 ngày | Đổi sang nhân vật tu sĩ (tiểu tăng/tiểu ni theo giới đã chọn), màu áo gốc hiện tại |
| 2 | Sa di / Sa di ni | Lạy ≥ 100 · Tụng kinh ≥ 50 · Thiền ≥ 60 phút · Chấp tác ≥ 10 việc · Điểm danh tổng ≥ 7 ngày | Áo tu sĩ **sậm hơn một tông** (vàng đậm / lam đậm) |
| 3 | Sư thầy / Sư cô (Tỳ kheo) | Lạy ≥ 300 · Tụng kinh ≥ 200 · Thiền ≥ 180 phút · Thả đèn ≥ 50 · Chấp tác ≥ 40 việc · Giữ ≥ 10 buổi thời khóa · Điểm danh tổng ≥ 30 ngày | Áo **nâu sẫm** + phụ kiện **cà sa** vắt vai (dùng ô `accessory` sẵn có của Profile) |

Ghi chú căn chỉnh: các ngưỡng 100 lạy / 60 phút thiền / 180 phút thiền trùng
chủ đích với mốc thành tựu R1.5 — một công phu được ghi nhận ở cả hai hệ,
người chơi thấy tiến bộ đồng thời ở hai nơi. Ngưỡng điểm danh dùng cột `total`
của bảng `checkins` (tổng số ngày đã điểm danh), không dùng chuỗi liên tục —
đứt chuỗi vì bận đời thường không nên chặn đường tu.

## 4. Vòng lặp hằng ngày của người tu

### 4.1 Việc chấp tác (từ bước R5.2)

Mỗi ngày server phân **3 việc chấp tác** cho mỗi người tu (chọn xác định từ
pool theo ngày + id người chơi, mẫu chọn như vòng quay), hiển thị ở "Bảng phân
công" trong panel Con đường tu tập. Pool việc — chỉ dùng hành động đã tồn tại
trong game:

- Dâng hương tại Đền Trình ×2 (hành động thắp hương trong zone Đền Trình)
- Dâng hương tại Chính điện ×2
- Thỉnh chuông ×1 · Thỉnh trống ×1 (cần bổ sung hook: hai nút zoneBtn hiện gọi
  thẳng phía client; R5.2 thêm sự kiện lên server để đếm — đồng thời dùng cho
  việc khai lễ ở R5.4)
- Tụng trọn một bài kinh (sự kiện `sutra:done`) ×1
- Thả đèn nguyện tại Thủy Đình ×2
- Thiền định tích lũy 5 phút trong ngày

Hoàn thành 1 việc: **+5 công đức, +10 xu** (ngang nhiệm vụ ngày) và +1 vào bộ
đếm `duties_done` trọn đời. Cơ chế đếm đi qua cùng đường `questEvent` hiện có;
việc theo zone dùng sự kiện vào vùng (QuestEvent đã có `'room'`).

### 4.2 Thời khóa (từ bước R5.3)

Ba phiên tụng mỗi ngày theo đúng giờ lễ R1.4 (05:00 / 12:00 / 20:00 giờ Việt
Nam). Người tu **giữ được một buổi** khi trong cửa sổ giờ lễ đó họ có tụng kinh
hoặc ngồi thiền tích lũy ≥ 3 phút trong khuôn viên; mỗi cửa sổ tính tối đa 1
buổi/ngày (`sessions_kept` là bộ đếm trọn đời; khóa chống trùng theo
ngày + giờ phiên theo mẫu `minigame_daily`). Phật tử thường vẫn nhận ×2 công
đức giờ lễ như hiện tại — thời khóa là cam kết riêng của người tu, không đổi
quyền lợi của ai.

### 4.3 Công phu tự do

Mọi hành động lễ Phật/tụng kinh/thả đèn/thiền tiếp tục đổ vào thống kê R1.5
như bình thường — đó là "công phu" xét lên hạng ở mục 3.

## 5. Lễ thọ giới — khoảnh khắc trung tâm của phase (bước R5.3)

Khi đủ điều kiện, panel báo "Đủ điều kiện thọ giới". Người chơi đến Chính
điện, tương tác với **Sư Thầy NPC** (nút tương tác khi đến gần, theo mẫu
zoneBtn hiện có) và buổi lễ chạy như một kịch bản ngắn ~20 giây, cả phòng
cùng chứng kiến:

1. Chuông chùa ngân (phát sự kiện chuông cho cả phòng như khi đánh chuông).
2. Người chơi tự động lạy 3 lạy trước Sư Thầy (dùng animation lạy sẵn có,
   server điều phối).
3. Áo đổi sang màu của hạng mới + danh xưng cập nhật trên bảng tên và Profile.
4. Chat phòng hiện dòng thông báo: "Phật tử … đã thọ giới Sa di" (tên hạng
   tương ứng).
5. Một **thư chúc mừng từ nhà chùa** vào Hòm thư (hệ R1.2) làm kỷ niệm — thư
   không quà, chỉ để lưu giữ.

Lễ phát nguyện (vào hạng 1) dùng cùng kịch bản ở dạng rút gọn. Buổi lễ là
trải nghiệm cảm xúc chính của phase — khi viết spec R5.3 phải có ảnh nghiệm
thu chụp tại Chính điện với admin cam.

## 6. Vai trò của Sư thầy / Sư cô (bước R5.4)

Chỉ mở ở hạng 3, và đều là **phục vụ người khác**:

- **Chủ tọa thiền:** khi một Sư thầy/Sư cô ngồi trong khu thiền, họ được tính
  bằng **2 người ngồi** trong điều kiện thiền tập thể (hiện cần ≥ 3 người —
  `GROUP_MEDITATE_MIN`). Nhờ đó một buổi thiền đôi cũng thành thiền tập thể
  ×2. Banner thiền hiển thị thêm "· Có Sư thầy chủ tọa" (tên theo giới).
  Người chủ tọa không nhận thêm gì ngoài việc buổi thiền của mọi người được
  tính — phục vụ thuần túy.
- **Ban phước:** Sư dùng hành động ban phước lên một người chơi khác trong
  cùng phòng và gần mình: người nhận **+5 công đức** (qua đường `grantRewards`
  phía người nhận, kèm toast "Sư thầy … ban phước cho bạn"). Chống cày:
  mỗi người cho tối đa 10 lượt/ngày, mỗi người nhận tối đa 1 lượt/ngày (hai
  khóa trên bảng `minigame_daily` sẵn có, không thêm bảng). Người cho không
  nhận vật chất — chỉ +1 bộ đếm `blessings_given` trọn đời.
- **Thỉnh chuông khai lễ:** trong 5 phút đầu của một giờ lễ, Sư thỉnh chuông
  thì buổi đó được ghi "đã khai lễ": thông báo cả phòng "Tiếng chuông khai
  lễ giờ tụng kinh" và chính người thỉnh chuông được tính **giữ buổi thời
  khóa đó** ngay (vẫn phải ở trong khuôn viên). Nghi lễ mở màn, không kèm
  hệ số thưởng nào.

## 7. Mô hình dữ liệu (khung — chi tiết chốt trong spec R5.1)

- Bảng mới `monastic`: `player_id` PK, `rank` (0–3), `vowed_at`, `duties_done`,
  `sessions_kept`, `blessings_given`. Cấp bậc và các bộ đếm riêng của phase
  nằm hết ở đây; thống kê R1.5 (`player_stats`) và `checkins` chỉ ĐỌC để xét
  điều kiện, không sửa.
- `Profile` thêm: hạng tu tập + danh xưng hiển thị (client suy từ hạng + giới
  nhân vật). Bảng tên trong game thêm tiền tố danh xưng ở hạng ≥ 1.
- Phân việc chấp tác mỗi ngày: suy xác định từ (ngày, player_id) + bảng tiến
  độ ngày theo mẫu `minigame_daily`/`quest_progress` sẵn có.
- Phát nguyện đổi `outfit` của người chơi: nam `male → monk`, nữ
  `female → nun`; hoàn tục đổi ngược lại. Người vốn đang dùng nhân vật tu sĩ
  thì giữ nguyên. Màu áo theo hạng do server chốt khi trả Profile (ghi đè
  `OUTFIT_COLOR` phía hiển thị theo (outfit, rank)) — không thêm cột màu mới.

## 8. Phân bước thi công

| Bước | Nội dung | Đầu ra nhìn thấy được |
|---|---|---|
| **R5.1 Nền cấp bậc** | Bảng `monastic`, định nghĩa hạng + điều kiện trong `shared`, phát nguyện / hoàn tục với Sư Thầy NPC (bản tĩnh, chưa lễ), Profile + bảng tên có danh xưng, áo theo hạng, panel "Con đường tu tập" hiển thị điều kiện còn thiếu | Người chơi phát nguyện được, thấy mình là Chú tiểu/Tiểu ni và biết còn thiếu gì để lên Sa di |
| **R5.2 Chấp tác** | Pool việc + phân 3 việc/ngày + Bảng phân công + đếm hoàn thành + hook server cho chuông/trống | Việc nhà chùa mỗi ngày, làm xong có thưởng và tích vào điều kiện lên hạng |
| **R5.3 Thời khóa & lễ thọ giới** | Đếm buổi thời khóa, kịch bản lễ thọ giới tại Chính điện, thư kỷ niệm, thông báo phòng | Buổi lễ thật sự diễn ra trước mọi người — đỉnh cảm xúc của phase |
| **R5.4 Vai trò Sư thầy** | Chủ tọa thiền, ban phước, thỉnh chuông khai lễ | Sư thầy/Sư cô thành trụ cột xã hội của sân chùa |
| **R5.5 Hoàn thiện** | Đối thoại Sư Thầy giải thích đường tu cho người mới, cân bằng số liệu, ảnh tổng kết phase, bài fanpage | Phase đóng gói phát hành |

Mỗi bước: 1 phiên Kilo, 1 spec riêng do Lux viết khi bước bắt đầu, kèm một
mục "Có gì mới" theo quy ước đứng của dự án.

## 9. Ngoài phạm vi & rủi ro đã lường

- Không bán áo/danh xưng/phụ kiện tu sĩ trong Cửa hàng; cà sa không phải vật
  phẩm giao dịch được (tránh lọt vào hệ quà tặng R3.1).
- Không PvP, không bảng xếp hạng ép buộc theo hạng. (Bia đá R3.3 sau này có
  thể vinh danh "phục vụ" — `blessings_given` và buổi chủ tọa — nhưng đó là
  quyết định riêng của R3.3, không thuộc phase này.)
- Rủi ro lớn nhất là phạm vi buổi lễ R5.3 (điều phối NPC + animation + sự
  kiện phòng): vì vậy lễ nằm ở bước riêng sau khi nền và chấp tác đã vững,
  và bản rút gọn (không có lạy tự động) là phương án dự phòng chấp nhận được
  nếu kịch bản đầy đủ vấp — chốt lại trong spec R5.3.
- Tên gọi và nghi thức giữ ở mức trang trọng tối thiểu, tránh chi tiết tôn
  giáo chuyên sâu dễ sai: game dùng khung "phát nguyện — thọ giới — chấp
  tác — thời khóa" quen thuộc với người đi chùa Việt Nam, không mô phỏng
  nghi lễ thật ngoài đời.
