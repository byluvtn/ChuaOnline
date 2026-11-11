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
