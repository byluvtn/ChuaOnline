# AUDIT.md — Kiểm toán codebase Chùa Online (Prompt A)

> **Ngày:** 2026-11-17 · **HEAD đã audit:** `f07a9ae` (snapshot; xem lưu ý về `fd6e1eb` dưới đây)
> **Model:** Claude Fable 5.2 (`claude-fable-5-2`) qua Vilao API, `reasoning_effort: high`
> (theo lựa chọn mặc định của chủ dự án) · **Nhiệt độ:** 0.2
> **Phương pháp:** Fable qua API thô không đọc được repo nên Lux paste toàn bộ
> file cần audit vào từng prompt, chia 12 khu vực (mỗi prompt ≤ ~140 KB để tránh
> trần request-body của relay). Tổng 70 file code + cấu hình, ~1,13 triệu ký tự.
> **Trạng thái:** CHỈ ĐỌC — không sửa code. Mọi mục dưới đây chờ chủ dự án + Lux
> duyệt từng mục rồi mới có prompt thực thi theo khu vực (xem kit audit).
>
> **Kiểm chứng của Lux:** Lux đã đọc lại toàn bộ 12 báo cáo và đối chiếu các
> phát hiện quan trọng với code thật (grep toàn repo + đọc đúng số dòng). Kết
> quả kiểm chứng ghi ở đầu mỗi mục khu vực: ✅ = đã xác nhận đúng; ⚠️ = Fable
> sai hoặc thiếu — Lux đã sửa/bổ sung; 🔍 = cần kiểm chứng thêm (lúc chạy,
> tools/ hoặc hạ tầng). Các mục "cần kiểm chứng chéo" của Fable mà Lux giải
> quyết được bằng grep toàn repo đã được ghi rõ kết quả. `tools/` (113 file)
> không nằm trong phạm vi fetch nên các kiểm chứng liên quan harness vẫn mở.
>
> **Lưu ý snapshot:** sau khi snapshot `f07a9ae` được lấy, có thêm commit
> `fd6e1eb` (1 dòng: thêm `!s ||` vào guard của `admin:grant` để sửa lỗi
> TS18048 làm deploy #32 fail). Fable KHÔNG phát hiện lỗi TS18048 này — nó đã
> được sửa ngoài audit. Ngoài dòng đó, code đã audit = code hiện tại.
>
> **Chi phí:** 923.485 token vào / 279.339 token ra, tổng **24.362đ** cho 13 lần
> gọi (12 khu vực thành công + 1 lần gọi hỏng, xem bảng chi phí ở cuối file;
> cộng thêm 24đ cho lần gọi kiểm tra credential đầu buổi, tổng chi cả buổi
> 24.386đ). Cao hơn ước tính ban đầu (5.000–15.000đ) vì: (a) chữ tiếng Việt
> tốn token gấp đôi ước tính (~1,7 ký tự/token thay vì ~4); (b) Fable ở mức
> thinking high dùng ~14–27K token hoàn thành mỗi khu vực (suy luận + trả
> lời); (c) lần gọi đầu khu vực 1 tốn 1.725đ mà không có trả lời (xem bài học
> ở cuối file).

## DANH SÁCH CẤM ĐỀ XUẤT XÓA (theo kit — chỉ nêu quan sát)
- `tools/steps-*.mjs` và mọi script kiểm chứng trong `tools/`; `shots/`; các
  file spec, lo-trinh, HANDOFF.md; schema DB, logic auth/admin, xử lý purchase
  trong server/; mọi thứ chạm vào dữ liệu người chơi. Không mục nào dưới đây
  đề xuất xóa các thứ này.

## 10 PHÁT HIỆN QUAN TRỌNG NHẤT (tác động × độ an toàn)

1. **Vật phẩm boost mô tả sai, Tràng hạt 108 vô dụng (khu vực 11, ✅).**
   Server dùng `max(merit_gốc, boostMerit)` chứ không cộng thêm: Nến sáp ong
   ghi "nhận 7 công đức" nhưng thực tế là 5; Hoa dâng Phật ghi "8" nhưng thực
   tế là 4; Tràng hạt 108 (30 xu) có boostMerit 2 = đúng merit gốc của tụng
   kinh → mua xong không được thêm gì. Người chơi đã trả xu thật (xu game) cho
   mô tả sai. Sửa: chữa mô tả cho khớp số, và quyết lại boost của tràng hạt.
2. **Vườn trồng cây không nguyên tử — thu hoạch/tưới đôi được (khu vực 2, ✅).**
   Harvest/water/plant đều kiểm-tra-rồi-ghi: hai request đồng thời cùng qua
   kiểm tra → thu hoạch `ok` 2 lần, `waters` +2 trong một cooldown. Sửa bằng
   điều kiện WHERE (`harvested = 0`, `last_watered_at = ?`) + kiểm
   `rowsAffected`, không đổi schema.
3. **Giới hạn tần suất theo IP proxy — mọi người chơi chung 1 hạn mức
   (khu vực 1, ✅).** `limited()` dùng `req.socket.remoteAddress`; sau proxy
   Fly/Render đây có thể là IP proxy → toàn bộ người chơi chung 20
   request/phút cho login/guest/me. Lộ rõ khi R4 mở landing. Sửa nhỏ, cần xác
   nhận hạ tầng trước (lấy IP thật từ header proxy).
4. **`roundRect` không có fallback — 5 chỗ, máy cũ throw ngay (khu vực 5+7, ✅).**
   `character.ts:152,718`, `textures.ts:43,52`, `src/animals.ts:64` dùng
   `ctx.roundRect` (cần Safari 16+/Chrome 99+); repo KHÔNG có polyfill. Máy iOS
   dưới 16 không dựng được nhân vật/cảnh. Sửa 2–5 dòng (path `arcTo` hoặc
   polyfill). Làm trước R4 (PWA/mobile).
5. **Đường nóng DB: mỗi hành lễ ~30 truy vấn tuần tự; `move` đọc DB mỗi giây
   (khu vực 1, ✅).** `grantRewards` gọi `getProfile` (5 truy vấn) 3–4 lần chỉ
   để so cấp; `move` gọi `questRows` 1 lần/giây cho mỗi người đang di chuyển.
   Ổn với SQLite local, sẽ chậm rõ nếu chọn Turso (HTTP). Sửa: đọc riêng cột
   `merit` khi so cấp; cache quest rows trong `Session`.
6. **Rò GPU tích lũy theo phiên dài (khu vực 3+5, ✅).** `updateGuidePath`
   `clear()` group mà không dispose geometry/material (tạo mới mỗi lần gọi, có
   chỗ gọi mỗi 2s); WebGL context thứ hai của màn hình preview không dispose
   sau khi vào game; `Character.dispose()` thiếu nón/khăn/material mặt/tràng
   hạt. Game treo máy "24/7" nên rò này tích lũy. Sửa vài dòng mỗi chỗ.
7. **Hai pipeline deploy cùng `main`, hai DB khác nhau (khu vực 11, ✅).**
   Render auto-deploy trỏ Turso (72 tài khoản thật) + Fly.io auto-deploy chạy
   SQLite local — mỗi push có thể đưa code mới lên cả hai, dữ liệu tách đôi.
   KHÔNG sửa code lúc này: chỉ cần xác minh auto-deploy Render còn bật không
   và chờ chủ dự án chốt host rồi mới xóa pipeline thừa.
8. **NPC kẹt vĩnh viễn khi tuyến bị chặn (khu vực 2, ✅).** `step()` hủy tuyến
   khi bị chặn nhưng `toChant`/`toRest`/`toWork` không có đường hồi phục
   (`runSchedule` bỏ qua các mode này) → tiểu/sư kẹt, giữ ghế tụng; người bán
   bỏ quầy mãi. Trong khi luồng visitor ĐÃ có xử lý hồi phục. Sửa cục bộ trong
   `decide` (nhả ghế/giường, về `normal`).
9. **Nhật ký quản trị hiển thị sai: mọi dòng đều ghi "tự tặng cho bản thân"
   (khu vực 9, ✅).** `panels.ts:479` hard-code chữ đó dù row có `targetName`;
   từ khi `admin:grant` cũng ghi log (commit `7a70bf1`), mọi lần tặng cho người
   khác đều hiện sai thành tự tặng. Sửa 1 dòng (hiện tên người nhận).
10. **Lô xóa code chết đã xác nhận 0 tham chiếu (nhiều khu vực, ✅).**
    Lux grep toàn repo xác nhận: cả file `sdf.ts` (97 dòng); `getStatValue`;
    `sereneSky`; `removeSolidGrassClumps` (+ không ai gán `grassClump`);
    `meritForLevel`, `CHAIN_QUEST_IDS`, khóa `'buy'` trong `Session.last`;
    6 import thừa trong `map.ts`; `MUTE`/`WHITE`/`BLUSH`/`robeLight`,
    `stoneM`, `cw1/cd1`, `cw2/cd2`, `COL.leaf`; biến `current` của boost;
    field `left` của games, field `a/rx/rz/s` của koi, field `id` của
    couplets; re-export `levelOf` từ panels. Rủi ro gần bằng 0 (chỉ cần grep
    lại `tools/` lúc thực thi vì audit này không fetch tools/).

*Sát sau top 10:* panel hồ sơ vẽ lại làm mất nội dung đang gõ (khu vực 8);
cache vòng quay chặn lượt sau 07:00 (khu vực 8); nhạc nền không tuân theo tắt
tiếng trên iOS + một bài lỗi là mất nhạc cả phiên (khu vực 10); mốc ngày
UTC (07:00 VN) vs ICT (00:00) không thống nhất — cần chủ dự án quyết, chạm dữ
liệu nên không tự đổi (khu vực 1+11); ~980 mesh tre + cầu/tháp chưa gộp mesh
(khu vực 4+6); gửi `move` 16 gói/giây cả khi đứng yên (khu vực 3).

---

## Khu vực 1/12 — Server core (`server/index.ts`, `server/db.ts`)

**Lux kiểm chứng:** hầu hết đã xác nhận đúng (đếm tay khớp: 20 wrapper `reply`,
15 chỗ `(q as any)`, 6 khối chat, import game.js tách đôi). Kiểm chứng chéo đã
giải quyết: `getStatValue` chết thật trong toàn bộ server/ (chỉ còn tools/ chưa
kiểm); `checkin:get`/`spin:get`/`stats:get` KHÔNG chết — client còn gọi
(`checkin.ts`, `spin.ts`, `profile.ts`/`stats.ts`). Lookup prototype
(`ACTION_RULES[kind]`, `ITEM_BY_ID[...]`) đã xác nhận: plain object nên khóa
`'constructor'` đi qua được guard `!rule`/`!item` (merit/cost thành
`undefined`/`NaN`, `safeHandler` bắt lỗi — mức thấp–trung bình, sửa bằng
`Object.hasOwn`/whitelist).

| Khu vực/file | Vấn đề | Bằng chứng | Rủi ro nếu xóa/sửa | Đề xuất |
|---|---|---|---|---|
| index.ts — symbol chết | `meritForLevel`, `CHAIN_QUEST_IDS`, khóa `'buy'` trong `Session.last` không được dùng. Import `shared/game.js` bị tách đôi. Comment "npc1..npc5" đã cũ. | L12, L206, L114: mỗi tên chỉ xuất hiện 1 lần. Import trùng L6-10 và L21-23. L140 so với npc15–38. ✅ | Không có: không chạm runtime. | Xóa 3 symbol, gộp import, sửa comment. |
| db.ts — `getStatValue` | Hàm export không có nơi gọi trong 2 file. | db L662-667; index.ts chỉ gọi `bumpStat`/`getStats` (L299, L303). ✅ (Lux: 0 tham chiếu trong toàn bộ server/) | Có thể được tools/ dùng. | Grep tools/ rồi xóa nếu 0 tham chiếu. |
| index.ts — đẩy profile thừa | `pushProfile` gọi lại ngay sau `grantRewards` (vốn đã push ở L295). | L567 (sau L563), L921 (sau L919). L565 và L864+866 đọc profile 2 lần liên tiếp. ✅ | Thấp: client nhận ít hơn 1 event `profile` trùng nội dung. | Xóa L567, L921; ở L565 và L864 dùng lại 1 lần đọc. |
| index.ts — khối đẩy chat lặp 6 lần | Cùng 5 dòng push / cắt 100 / set / emit. | L335-339, 495-499, 858-862, 901-905, 1338-1342, 1377-1381. ✅ | Thấp. | Gộp thành 1 hàm nội bộ. |
| index.ts — logic lặp khác | Trừ vật phẩm boost, thưởng lên cấp, `shop:buy` và `shop:buy5`, vòng kick, kiểm tra luống vườn đều bị chép. | L519-526 = L580-587; L285-294 ≈ L879-890; L611-621 ≈ L624-637; L405-407 = L1318-1320; L955-957, 975-977, 992-994. ✅ | Trung bình: `donate` cố ý không nhân hệ số (L883), phải giữ khác biệt đó. | Gộp từng cặp, giữ tham số "không nhân boost". |
| index.ts — wrapper `reply` | 20 handler tự khai báo `reply` kiểm tra `typeof cb`, phần còn lại dùng `cb?.()`. | L549, 654, 677, 704, 723, 776, 794, 810, 838, 871, 1018, 1039, 1052, 1251, 1259, 1281, 1298, 1305, 1326, 1348; `safeHandler` L380-396. ✅ | Thấp. | Thống nhất `cb?.()`, bỏ 20 wrapper. |
| index.ts + db.ts — `getProfile` trên đường nóng | `getProfile` tốn 5 truy vấn. `grantRewards` gọi 3 lần chỉ để so cấp, `maybeAwardTitles` thêm 1 lần. Một lần lạy ước ~30 truy vấn tuần tự. | db L356, L359, L361; index L285, L289, L295, L321; chuỗi gọi L538-543. ✅ | Trung bình: phải giữ đúng lúc trao thưởng cấp và danh hiệu. | Đọc riêng cột `merit` khi so cấp; mỗi handler push profile 1 lần ở cuối. |
| index.ts — `move` đọc DB mỗi giây | Mỗi người đang di chuyển gọi `questRows` 1 lần/giây để dò quest `visit`. Đường này không qua breaker. | L477-486; breaker chỉ có ở L177 và L1408. ✅ | Thấp–trung bình: phải làm mới cache khi accept/claim. | Giữ quest rows trong `Session`, chỉ đọc lại khi accept/claim/bump. |
| index.ts — tick thiền | Mỗi người ngồi, mỗi tick: `grantRewards` + `questEvent` + `countStat`, ước ~28 truy vấn, chạy tuần tự. Tick sau có thể chồng tick trước. | L1400-1421. 🔍 (số truy vấn là ước tính của Fable) | Trung bình: chạm thưởng công đức. | Sẽ nhẹ đi nếu sửa hàng `getProfile`. |
| index.ts — giới hạn tần suất theo IP | `limited()` dùng `req.socket.remoteAddress`. Sau proxy của Fly/Render đây có thể là IP proxy, nên mọi người chơi chung hạn mức 20 request/phút. | L42-47, L72-73. ✅ | Thấp: đổi nguồn IP, không chạm dữ liệu. | Xác nhận hạ tầng rồi lấy IP thật từ header của proxy. |
| db.ts — mốc ngày UTC lẫn ICT | Điểm danh, quay, xin xăm, minigame, quà tặng, quest ngày và tuần reset theo UTC (07:00 giờ VN). Riêng `dq_`/`gq_` reset 00:00 ICT. | `dayKey` L275; dùng ở L719, 723, 729, 868, 944, 949, 955; `questKey` L542; ICT ở L456, L544. ✅ | Cao: `day_key` đã lưu theo UTC, đổi mốc có thể cho nhận đôi hoặc đứt chuỗi điểm danh. | Chỉ nêu quan sát; chủ dự án quyết định mốc. Xem thêm khu vực 11 (#8). |
| index.ts — kiểm tra rồi ghi không nguyên tử | `market:buy` kiểm xu rồi trừ bằng `addRewards(-10)`. `release:phongsinh` không có cooldown, 2 request đồng thời có thể nhận công đức 2 lần. Mail/quest đánh dấu đã nhận trước khi cộng thưởng. | L826-828 (`spendCoins` có sẵn ở db L474); L916-919; L1152-1156; L1026-1027; lệnh ghi không retry ở db L163-169. ✅ | Chạm dữ liệu người chơi. | Chỉ nêu quan sát; hướng nhỏ nhất là dùng `spendCoins` và thêm cooldown `s.last`. Cùng họ với khu vực 2 (#1). |
| db.ts — breaker, retry, `tursoFetch` | Khoảng 120 dòng chỉ có tác dụng khi dùng Turso; Fly đang chạy SQLite local. `bootRetry` gần như trùng `withDbRetry`. | db L15-28, L37-57, L65-124, L127-152; breaker chỉ có 2 nơi gọi (index L177-196, L1408-1415). ✅ | Cao nếu quay lại Turso: mất lớp chống treo. | Chưa xóa, chờ quyết định DB. Gộp `bootRetry` vào `withDbRetry` ngay được. |
| db.ts — migration một lần chạy mỗi lần boot | 7 lệnh anh_dao, `grantLaunchMail`, log PRAGMA chạy lại mỗi lần khởi động. L252 chạy trước khi `garden_plots` được tạo. Có 2 kiểu migration (try/catch và PRAGMA). | L252-258 (bảng tạo ở L613); L894-914; L259-264; L247-251 so với L632-644. 🔍 (thứ tự L252 cần kiểm lúc boot) | Chạm schema và dữ liệu người chơi. | Chỉ nêu quan sát, không đề xuất xóa. |
| db.ts — `syncAdmins` mỗi phiên | Mỗi lần login/guest/register chạy `UPDATE players SET is_admin = 0` toàn bảng rồi gán lại. Giữa 2 lệnh, admin tạm mất quyền. Lúc boot đã chạy rồi. | L297 gọi L266-270; boot ở L271. ✅ | Thuộc logic auth/admin. | Chỉ nêu quan sát. |

**4 câu hỏi (khu vực 1):** (1) Xóa được: symbol chết, `pushProfile` thừa, comment sai; cần kiểm chứng chéo: `getStatValue`, 3 handler get (Lux đã giải quyết: 3 handler còn dùng — giữ lại). (2) Phức tạp thừa: breaker + 2 retry + `tursoFetch` (~120 dòng cho 2 job nền); 4 transaction viết tay với 3 kiểu rollback; 20 wrapper `reply`; `questEvent` gọi 2–3 lần/handler. (3) Giả định yếu: IP client = `remoteAddress`; "hôm nay" = UTC; DB gần và nhanh (~30 truy vấn/hành lễ); client trung thực về vị trí; cooldown trong RAM mất khi reconnect; một process duy nhất (state RAM mất mỗi deploy; `roomMinutes` không bao giờ reset); snapshot đầy đủ 10 lần/giây; tọa độ gõ cứng; file tĩnh đọc đồng bộ không cache header; khóa tra cứu từ client (prototype — Lux đã xác nhận cơ chế). (4) Đơn giản hóa tiếp: một hàm đẩy chat, một hàm trừ boost, một hàm xét lên cấp; `shop:buy5` thành tham số số lượng; quest rows trong `Session`; khai báo field quest tùy chọn để bỏ 15 chỗ `(q as any)`; gộp `bootRetry`; hạ giới hạn lưu đèn/chat cho khớp số gửi (200→20, 100→30).

**Top 3 khu vực 1:** (1) Giới hạn tần suất theo `remoteAddress`. (2) Đường nóng DB (`getProfile` + `move`). (3) Lô xóa code chết và gộp khối lặp.

## Khu vực 2/12 — Server NPC + thú + vườn (`server/npcs.ts`, `server/animals.ts`, `server/garden.ts`)

**Lux kiểm chứng:** các phát hiện chính đã xác nhận: vườn kiểm-tra-rồi-ghi
(harvest L137-143 không có `AND harvested = 0`; water L127-132; plant L106-112);
`quality` không validate — `GARDEN_HEAD_START[quality]` ở garden.ts:51,90 sẽ
thành `undefined` → `NaN` → cây không bao giờ lớn nếu quality lạ; NPC kẹt
(`step()` hủy tuyến ở L1104-1105 trong khi `runSchedule` bỏ qua
toChant/toRest/toWork ở L883, L964 — luồng visitor thì CÓ xử lý hồi phục ở
L632-637); không post NPC nào có x = −11/11/0 (x thực tế: 39, −29, 7, 12, 17,
32, 37, 22, 27, 42, 47, 52, −48); mode `toSeatChant`/`seatChant` chỉ ghi không
đọc (0 lần so sánh mode; `case 'seatChant'` ở L638 là switch theo `stage`);
`NPC_CLOCK_OFFSET_MIN` không phải số → `NaN` âm thầm (L60). Kiểm chứng chéo đã
giải quyết: `isIndoors` CÒN DÙNG (index.ts:553, 850 — kiểm tra đèn trời/pháo
hoa); `wateredToday` được client đọc trong key dựng lại cây (`vuoncay.ts:328`)
nhưng không nhánh hành vi nào dùng → tàn dư, không xóa vội.

| Khu vực/file | Vấn đề | Bằng chứng | Rủi ro nếu xóa/sửa | Đề xuất |
|---|---|---|---|---|
| garden.ts thu hoạch/tưới/gieo | Kiểm tra rồi mới ghi, không nguyên tử. Hai request đồng thời cùng qua kiểm tra: thu hoạch trả `ok` 2 lần, `waters` +2 trong một cooldown, `grew` báo trùng. | 137-143 (UPDATE không có `AND harvested = 0`); 127-132; 106-112; 52, 69-73. ✅ | Chạm dữ liệu người chơi nên chỉ thêm điều kiện, không đổi schema. | Thêm điều kiện vào WHERE (`harvested = 0`, `last_watered_at = ?`) và kiểm tra `rowsAffected`. |
| garden.ts `gdb` | Chỉ lệnh ghi có retry SQLITE_BUSY; lệnh đọc gọi `db.execute` trần. Comment tự nhận lỗi không bắt làm chết tiến trình. | 21-23, 24-32; đọc trần ở 59, 148. ✅ | Thấp. Retry tối đa ~1,75 s cho mỗi request. | Cho SELECT đi qua `gdb`. |
| garden.ts `plantGardenRow` | `species` được validate, `quality` thì không. Giá trị lạ làm `GARDEN_HEAD_START[quality]` thành undefined, phép so sánh NaN, cây không bao giờ lớn. | 104 so với 109, 112; 51, 90. ✅ | Thấp. | Ép `quality` về `'good'`/`'normal'` trước INSERT. |
| garden.ts `wateredToday` | Có vẻ là tàn dư giới hạn tưới theo ngày; server giờ dùng cooldown theo giai đoạn. Trong file chỉ ghi ra và xuất state, không nhánh nào đọc. | 16, 85, 95, 132 so với 122-127. ✅ (Lux: client chỉ dùng trong key dựng lại cây, vuoncay.ts:328) | Cột `watered_day_vn` phải giữ (schema). | Nếu xác nhận key không cần: bỏ field, `today()` và import `dayKeyICT`; vẫn giữ cột. Xem thêm khu vực 11 (`GardenPlotState.wateredToday`). |
| npcs.ts tuyến bị chặn | `step()` hủy tuyến nhưng `toChant`/`toRest`/`toWork` không có đường hồi phục. Tiểu, sư ni kẹt vĩnh viễn và giữ ghế; người bán bỏ quầy mãi; `toRest` nằm ngủ sai chỗ. | 1104-1105; 883; 964, 967-976, 1034; 882 + 979; 907-908 → 790-796. Visitor/wander có xử lý: 633, 671, 897. ✅ | Thấp. | Trong `decide`: gặp các mode này khi `phase` idle thì nhả ghế/giường, đưa về `normal`. |
| npcs.ts `ry` của NPC post | Ba nhánh `post.x === -11 / 11 / 0` không bao giờ đúng: không NPC post nào có x đó. | 236 so với toàn bộ `post` ở 28-33, 45-50, 52. ✅ | Không. Kết quả giữ nguyên (π nếu z ≥ 47, còn lại 0). | Xóa 3 nhánh. |
| npcs.ts giá trị và nhánh chết nhỏ | Mode `toSeatChant`/`seatChant` chỉ ghi, không nơi nào đọc. Nhánh `else` cuối `arrive` không tới được. `if (!base)`, `o.state &&` luôn đúng. Tham số `now` của `wakeNpc` thừa. | 147, 493, 627; 874-876; 281; 262, 310, 1146; 699. ✅ (mode: 0 lần đọc) | Rất thấp. Không export nào bị ảnh hưởng. | Xóa. |
| npcs.ts trùng lặp | `pick`/`near` chép 2 lần. `visitorSpot` và `visitorSpeed` cùng lọc `NPC_DEFS` mỗi lần gọi. Ba hàm chọn ghế. Ánh xạ npc27→thienDuong lặp 5 chỗ. Tọa độ cửa Nhà Khách, ghế trực lặp. | 260-262 ≡ 308-310; 125-126 ≡ 133-134; 196, 465, 527; 221, 236, 243, 1036, 1042; 543 so với 531-532; 226 so với 738. | Thấp. | Gộp helper; tính chỉ số visitor một lần; đưa điện nhà vào `NpcDef`; dùng lại `NK_DOOR`/`NK_OUT`. |
| npcs.ts máy trạng thái | Ba trục chồng nhau: `phase` (3), `mode` (19), `stage` (13), thêm `tourPhase` và `WeakMap npc6State`. `runSchedule` 135 dòng, gọi `activeSession` tới 5 lần mỗi NPC mỗi tick. | 147-148, 150; 744-749; 958-1092; 968, 979, 988, 1024, 1055. | Trung bình: đây là lõi hành vi NPC. Không nên tái cấu trúc trước R4. | Chỉ tính `activeSession` một lần mỗi tick và đưa state npc6 vào `Npc`. |
| npcs.ts roster tụng | Liệt kê 15 và 45 cặp tổ hợp chỉ để chọn 2 tăng + 2 người bán mỗi buổi. | 920-927, 932-955. | Thấp. Chỉ đổi thứ tự luân phiên, thuần hình ảnh. | Thay `pairsOf` bằng offset `idx % pool.length`. |
| animals.ts + npcs.ts biến toàn cục | State cấp module dùng chung mọi phòng dù thú lưu theo phòng. Chỉ phòng tick đầu được dời đàn. `rooms` không bao giờ xóa, `get()` tự tạo. | animals 38-39, 368-369, 411, 494-499, 515, 523; npcs 520. ✅ (flockAnchor/flockMoveAt dùng chung mọi phòng) | Thấp nếu chỉ có 1 phòng (game có 3 phòng). | Một phòng: bỏ Map. Nhiều phòng: đưa state vào từng phòng và thêm dọn phòng. |
| animals.ts chồng keep-out | Khoảng 290 dòng hình học cho 7 chó mèo. 194/212 bồ đoàn nằm trong HALL và DECK vốn đã cấm; 15 cái nữa nhiều khả năng nằm trong các nhà khác. | 58-345; 84-106; 78, 87-92, 134-135; npcs 460. 🔍 (cần kích thước `*_PLAT` trong `src/layout`) | Trung bình: thú có thể đi xuyên bồ đoàn Thủy Đình. | Rút `ZAFU_RINGS` còn 3 điểm Thủy Đình (104) sau khi kiểm chứng. |
| animals.ts kiểm tra trong nhà | Ba bản gần giống nhau. `outdoorJitter` gọi cả `indoors` và `keepOut`, lặp vòng `INDOOR_RECTS`. Biểu thức `onBridge` chép 3 lần. | 53-56 ≡ 134 ≡ 349-351; 359-360; 142, 154, 162. ✅ (`isIndoors` còn dùng ở index.ts — giữ export) | Thấp. | `indoors` chỉ giữ kiểm tra bán kính Bảo Tháp (352); tách một helper `onBridge`. |
| animals.ts giá trị chết | Tọa độ và `home` của vẹt, gà con bị ghi đè ngay sau khi tạo. Nhánh `!a.path` và `if (!target)` không xảy ra. Field `cat` lặp `kind`. | 394-399 bị 403-408 ghi đè; 455, 459-463 (`sanitizePath` luôn đẩy đích: 342); 12, 380. | Rất thấp. | Bỏ tham số `home` của `mk`, bỏ 2 nhánh chết, dùng `kind === 'cat'`. |
| Tọa độ cứng đồng bộ tay | Ghế tụng, bồ đoàn, giường, biên Chính Điện chép số từ client. Điểm cú đậu là tâm Thiền Đường, chính comment nói là trong nhà; cú đáp y = 0. | npcs 159-184, 213-215, 462, 431; animals 84-106; animals 33 so với 24-25, 436. | Không xóa. Đổi layout client là lệch âm thầm. | Quan sát. Dùng `HALL` đã import cho `inChinhDien`; dời điểm đậu ra ngoài như `LOST_SPOTS` (28). |

**4 câu hỏi (khu vực 2):** (1) Xóa được: mục 6, 7, 14 (chắc chắn); `isIndoors` và `wateredToday`/`today()` sau kiểm chứng chéo (Lux: `isIndoors` còn dùng — giữ; `wateredToday` chỉ còn trong key client). (2) Phức tạp thừa: chồng keep-out của thú; máy trạng thái NPC ba trục; roster tụng bằng tổ hợp cặp; vòng đi 8 điểm kèm bảng `via` cho riêng npc6. (3) Giả định yếu: tuyến NPC không bao giờ bị chặn ở toChant/toRest/toWork; chỉ có một phòng; mỗi người chơi chỉ gửi một request vườn tại một thời điểm; chỉ lệnh ghi mới gặp SQLITE_BUSY; `quality` luôn hợp lệ; tọa độ server luôn khớp client; tiểu đánh chuông kịp về tháp trong 2 phút; `NPC_CLOCK_OFFSET_MIN` luôn là số (Lux ✅: `Number(...)` có thể ra NaN). (4) Đơn giản hóa tiếp: gộp kiểm tra trong nhà + helper `onBridge`; rút `ZAFU_RINGS`; gộp helper npc; tính `activeSession` một lần/tick; chuẩn hóa `quality ?? 'normal'` và `waters ?? 0` một lần trong `syncRows`.

**Top 3 khu vực 2:** (1) Vườn không nguyên tử. (2) NPC kẹt vĩnh viễn khi tuyến bị chặn. (3) Keep-out của thú (mục 12+13) + lô xóa an toàn (mục 6, 7, 14).

## Khu vực 3/12 — Client core (`src/main.ts`, 2644 dòng)

**Lux kiểm chứng:** ✅ Throttle bia tuần vô nghĩa (gap 10s vs interval 5 phút, cả
hai nhánh đều load — L534-588). ✅ Nhánh chết `nearestFreeSeat` L1125 (L1119
return sớm khi `best === Infinity`). ✅ Rò GPU `guideGroup` (L1869-1875:
`clear()` không dispose, tạo mới 2 geometry + 2 material mỗi lần gọi; có nơi
gọi mỗi 2s). ✅ `move` gửi mỗi 60ms không kiểm tra thay đổi (L2531-2534).
✅ Preview WebGL (L53-56) không dispose sau khi vào game (L692 chỉ dừng vòng
lặp). ✅ `getLastPhoto` chỉ còn hook DEV `__co.pr` (L2643). Các mục còn lại
giữ nguyên như Fable nêu (chưa đối chiếu từng dòng).

| # | Khu vực | Vấn đề | Bằng chứng | Rủi ro nếu xóa/sửa | Đề xuất |
|---|---|---|---|---|---|
| 1 | Bia tuần (stele) | Throttle vô nghĩa: `loadSteleThrottled` chỉ có 1 nơi gọi, trong interval 5 phút, trong khi gap chỉ 10 s. Hai nhánh if/else đều tải. | 534–538, 548–552, 584–588. `lastSteleWeek` chỉ đọc ở 586. ✅ | Gần như không; tệ nhất thêm 1 request `rank:get`. | XÓA `loadSteleThrottled`, `STELE_MIN_GAP`, `steleTimer`, `steleLast`, `lastSteleWeek`; interval gọi thẳng `loadStele()`. |
| 2 | `nearestFreeSeat` | Nhánh chết: 1119 đã return khi `limit === Infinity` nên điều kiện ở 1125 không bao giờ đúng. Đoạn kiểm tra "taken" lặp lại `seatTaken`. | 1119, 1125; 1126–1127 trùng 1005–1009. Hai nơi gọi: 1136, 1188. ✅ | Thấp, không đổi hành vi. | XÓA 1119 và 1125; `startBow` gọi thẳng `pickBowSeat()`; dùng `seatTaken(st)`. |
| 3 | Code chết lặt vặt | Field `lastX`/`lastZ` không dùng; nhánh `visit`/`release` trùng nhánh mặc định; `r.data.npc &&` thừa; gán `onclick` hai lần; truy vấn lại `#questTracker`. | 233; 1782, 1784 so với 1790; 1781 ≡ 1783; 2590 trong khối 2586; 1565–1570; 1831, 1919 so với 1545. | Không. | XÓA hoặc gộp. |
| 4 | Hội thoại npc30 | 4 nút mua viết tay, trùng định dạng với khối bảng `SHOP_VENDOR_GOODS`. Giá cứng ở client. | 1485–1516 so với 1517–1528; npc34 đã có 3 món y hệt ở 1315–1319; "10 xu" cứng ở 1478. | Thấp, UI giữ nguyên. Giá thật ở server/shared: cần kiểm chứng chéo. | Thêm `npc30` vào bảng, XÓA 1485–1516 (~32 dòng). |
| 5 | Sạp chợ | Tọa độ sạp và cặp sạp–NPC khai báo lại, dù đã dùng `MARKET_STALLS` (có `id`, `x`, `z`). | 624–635; 1308 trùng 4 cặp; `MARKET_STALLS` dùng ở 1781. | Trung bình nếu `MARKET_STALLS` thiếu field npc: cần kiểm chứng chéo `shared/game`. | Lấy x/z từ `MARKET_STALLS`, chỉ giữ map sạp→npc ở một chỗ. |
| 6 | `updateGuidePath` | Rò bộ nhớ GPU: `guideGroup.clear()` không dispose, mỗi lần gọi tạo mới 2 geometry và 2 material. | 1869–1875. Gọi từ 611, 1565, 1820, 1969, 2389 (mỗi 2 s khi bám NPC), 2418, 2425. ✅ | Thấp. | Dispose trước `clear()`, hoặc dùng chung `discGeo`/`discMat` ở cấp module. |
| 7 | Hợp đồng client–server | Rẽ nhánh theo chuỗi lỗi tiếng Việt của server. Đổi một chữ ở server là hỏng âm thầm, đúng vùng sweep từng lỗi. | 1811 (`'Đã nhận hoặc đã hoàn thành…'`), 1975 (`'Điểm này đã quét rồi'`). | Sửa cần chạm server: cần kiểm chứng chéo. | Tối thiểu đưa hai chuỗi vào hằng dùng chung ở `shared/`. Cùng họ khu vực 8 (#11). |
| 8 | `pathfinder.lastFallback` | Cờ này được đọc như thể thuộc về `pathQueue` hiện tại, nhưng `findPath` còn được gọi ở chỗ khác xen giữa (guide, `routeLength`). | Gọi `findPath`: 1013, 1860, 2474. Đọc cờ: 1014, 1861, 2481, 2484. | Thấp. Cần kiểm chứng chéo `shared/pathfind` rằng cờ là trạng thái của lần gọi cuối. | Chụp cờ vào biến cục bộ ngay sau 2474, lưu cùng `pathQueue`. |
| 9 | Watchdog dẫn đường | Ba bộ phát hiện kẹt chồng nhau (tiến độ, đứng yên, lặp feed) với 14 biến trạng thái và 2 đường bỏ cuộc. Chú thích cho thấy mỗi lớp vá lỗi của lớp trước. | 1547–1562; 2397–2420; 2421–2427; 2449–2452; toast trùng ở 1560 và 2405. | Trung bình: hồi quy sweep hoặc bám Sư Ông; phải chạy harness `tools/steps-*`. | Giữ bộ "tiến độ tới đích" (bao trùm hai bộ kia), bỏ bộ đứng yên và bộ đếm feed. |
| 10 | Đi tới bồ đoàn | Hình học tự viết (~60 dòng) lặp ngưỡng `r + 0.55` của pathfinder. Mỗi lần bấm Lạy có thể gọi tới 13 `findPath` đồng bộ. | 1011–1070; 1107–1108; 1198; 2474; 2481–2483. | Trung bình: hành vi trong từng điện. | Thử bỏ `bowDirect`; `collide()` trượt tường và fallback lạy tại chỗ (2516–2520) đã có sẵn. |
| 11 | Tọa độ bản đồ cứng | Cùng một vùng khai báo ở 5 nơi và đã lệch nhau: Tam Thế `-78..-58` so với `-80..-56`; Điện Mẫu hộp so với hình tròn. | 988–994 ≈ 997–1003; 1898–1914; 1571–1572; 1671–1674; 1695–1701; 2328–2333. | Thấp khi gộp `seatGroup`/`insideHall`; phần còn lại cần kiểm chứng chéo `world`/`layout`. | Gộp hai hàm thành một (tham số hộp Chính Điện); ghi nhận độ lệch để chủ dự án quyết. |
| 12 | Vòng lặp | 9 hàm cập nhật HUD chạy mỗi rAF (chỉ render bị chặn 60 Hz). `markerFor` filter/find quest cho từng NPC mỗi frame. Ba nút gán lại nhãn hằng số. | 2611–2622, 2624; 2030–2038, 2042; 1590–1592, 1649–1650, 1658–1659. | Thấp. | Throttle logic nút và marker khoảng 4 Hz (như 1985); chỉ cập nhật vị trí sprite mỗi frame. |
| 13 | Gửi `move` | Gửi mỗi 60 ms kể cả khi đứng yên hoặc ngồi thiền (hoạt động AFK chính), tức khoảng 16 gói/giây/người. | 2531–2534. ✅ | Cần kiểm chứng chéo: server có dùng `move` làm heartbeat hoặc tính thiền không. | Bỏ gửi khi x/z/ry/anim không đổi (hoặc giữ 1 gói/giây). |
| 14 | Preview đăng nhập | WebGL context thứ hai (`pr`) không được dispose sau khi vào game; chỉ dừng vòng lặp. | 53–56, 692; sau đó chỉ còn hook DEV ở 2643 tham chiếu. ✅ | Thấp. Harness có dùng `__co.pr`/`pScene` không: cần kiểm chứng chéo tools/. | `pr.dispose()` sau `enter`. |
| 15 | Join / menu | `startMenu()` gọi `initMenu` ở mỗi `welcome` (đổi phòng, reconnect). `changeLook` emit `join` thiếu `resume` và lặp lại `sendJoin`. | 569, 733–743; 731 so với 516. | Cần kiểm chứng chéo `menu.ts` (idempotent?) và handler `join` của server. | Nếu xác nhận: gọi `initMenu` một lần; `changeLook` gọi `sendJoin()`. |

**4 câu hỏi (khu vực 3):** (1) Xóa được ngay: mục 1–4 (~50 dòng); nhánh đọc vị trí joystick dạng cũ (px) ở 908–911 (chỉ là tùy chọn UI trong localStorage); `buildBuddha`/`buildQuanAm` (L21) chỉ dùng trong hook DEV `__co` (2643) — chỉ nêu quan sát vì harness có thể phụ thuộc. (2) Phức tạp thừa: watchdog dẫn đường (mục 9), hình học đi tới bồ đoàn (mục 10), joystick kéo-thả (~115 dòng, 822–937), `nearestFreeSeat` hai chế độ qua `limit = Infinity`, `HOUSE_CAM` 6/8 mục giống hệt nhau kèm cơ chế `savedOutDist`/`savedBump`. (3) Giả định yếu: chuỗi lỗi server không đổi (mục 7); `lastFallback` thuộc về path hiện tại (mục 8); bản đồ không đổi — tọa độ cứng 5 nơi, luật chơi cứng trong chuỗi hiển thị (424 "cần 3 người", 1208 "mỗi 10 giây", 2151, 2164 "/8", 15 phút, 24h/48h); `isTouch` quyết định một lần lúc tải (L33) — máy lai bị phân loại sai; tên người chơi duy nhất (đèn nguyện tìm người thả theo `name`, L457, trong khi `randName` chỉ có 9×99 tổ hợp); đồng hồ client khớp server (`weekKey()` cho bia tuần L542, khung giờ lời thoại L1330); người chơi luôn di chuyển (mục 13); toast không chồng nhau (timer không clear, L350). (4) Đơn giản hóa tiếp: một bảng vendor duy nhất (`VENDOR_STALL`, `VENDOR_GOODS`, `SHOP_VENDOR_GOODS`, 1308–1326); callback "lỗi thì toast" lặp ở 1396, 1474–1476, 1523–1525, 1604, 2107, 2116; `authOpen` (141–147) gọi `logout()` (722–727); `updateProfileHud` (404–406) gọi `refreshLabel(me)`; `updateDonorBtn`/`updateNoticeBtn` (1644–1660) chỉ khác hằng số; tách file: hội thoại (1307–1536), minimap (1667–1762), vườn (2079–2246) có thể chuyển sang `src/features/` — chỉ di chuyển, không trừu tượng mới.

**Top 3 khu vực 3:** (1) Mục 6 — rò GPU ở `updateGuidePath`. (2) Mục 1–4 — lô xóa code chết và trùng lặp (~50 dòng). (3) Mục 12 — throttle HUD và marker khỏi vòng rAF. Mục 7 đứng sát sau.

## Khu vực 4/12 — Khuôn viên chùa (`src/temple.ts`, 1634 dòng)

**Lux kiểm chứng:** ✅ Biến chết `td` (752–753), `pierLen` (1038+1107), `void pcd`
(773), `void pondHandle` (1618) — đúng là chết. ✅ Hack `extraHouse` L684:
nhánh `: rwb` không bao giờ chạy với k≤2, áp cho cả 3 caller dù comment chỉ
nhắc Nhà Khách. ✅ `gapdump` đúng 14 lần xuất hiện (tools/ chưa kiểm — có thể
harness parse log này). ⚠️ Wall collider (#7): r=0.55 cách nhau 3m → khe hở
1.9m là đúng, NHƯNG `clampToCompound` tồn tại ở main.ts:1293 — cần kiểm bounds
của clamp trước khi xóa collider. ✅ Kiểm chứng chéo đã giải quyết:
`resolveWater` CÒN DÙNG (main.ts:1292, world.ts:607); `relabelColumns` CÒN
DÙNG (temple.ts:54, 1631); `placeKoiPond` CÒN DÙNG (temple.ts:934, 984) — ba
hàm này KHÔNG chết (sửa lại kết luận của khu vực 6, #3).

| # | Khu vực | Vấn đề | Bằng chứng | Rủi ro nếu xóa/sửa | Đề xuất |
|---|---|---|---|---|---|
| 1 | Biến chết, lệnh no-op | Biến và `void` thừa, gán `rotation.y = 0` vô nghĩa | `td` 752–753; `pierLen` 1038 + 1107; `void pcd` 773 (pcd dùng ở 897); `void pondHandle` 1618 (đã return ở 1633); 721, 1191, 1297. ✅ | Không | Xóa |
| 2 | `buildHouse`, `tower` | Tham số và giá trị trả về không dùng | `at`, `zoneId` (594) không xuất hiện trong thân 595–631; `corners` (631) không nơi nào đọc; `coupletId?` (195) luôn được truyền (264, 279), ép kiểu sai ở 252 | Không (chỉ chữ ký hàm nội bộ) | Xóa tham số; bỏ `if (coupletId)` |
| 3 | Log `gapdump` | 14 dòng `console.warn` debug DEV; biến `*Seal` chỉ phục vụ log | 192, 257, 516, 590, 637, 653, 676, 738, 761, 1105, 1237, 1308, 1358, 1579. ✅ (đúng 14) | Script trong `tools/` có thể đọc log này — cần kiểm chứng chéo | Xóa nếu `tools/` không parse "gapdump" |
| 4 | `sealArchitectureJoints` | Gọi trên nhóm không có mesh `sealable` | 1578: `psGroup` (1484–1576) không mesh nào gắn `sealable`; 191: `arhatGroup` chỉ có bệ rời (165) | Cần kiểm chứng chéo `compound.ts` (seal có chỉ xét `sealable` không) | Xóa 1578–1579; xem lại 191 |
| 5 | Collider tường nhà | Cùng một công thức chép 5 lần; hàm xoay toạ độ chép 3 lần | 640–645, 656–661, 679–684, 743–748, 765–770; `tw`/`twd` ở 741, 764, 777 | Trung bình: lệch số là hở hoặc kẹt tường | Gộp một hàm; so mảng `colliders` trước và sau phải bằng nhau |
| 6 | `extraHouse` dòng 684 | Hack theo `j` viết cho Nhà Khách nhưng áp cả Điện Mẫu, Trai Đường; nhánh `: rwb` không bao giờ chạy | Chú thích 684 chỉ nêu Nhà Khách; với kích thước ở 689, 731, 754 thì k ≤ 2. ✅ | Trung bình: đổi bán kính tường Đông ba nhà | Đưa ngoại lệ về riêng Nhà Khách; bỏ nhánh chết |
| 7 | Tường bao `wallSeg` | Collider cách nhau tới 3 m, r 0.55, vùng chặn chỉ khoảng 1.9 m nên còn khe | 1118–1119; "blocking = r + 0.4" suy từ chú thích 410, 662. ⚠️ | Cần kiểm chứng chéo: có clamp biên ở file di chuyển không (Lux: `clampToCompound` ở main.ts:1293 — kiểm bounds) | Có clamp thì xóa 1118–1119; không có thì tường đi xuyên được |
| 8 | Rào viện `buildVienFence` | `wr` có thể ≤ 0; trường `x2/z2` nằm ngoài kiểu `colliders`; số 0.4 (bán kính người chơi) rải rác | 1375 (`len/n/2 + 0.002 − 0.4`, tối đa 0.152); 1367, 1377–1381 so với kiểu ở 22; 640, 642 | Cần kiểm chứng chéo code va chạm (r âm, có đọc `x2/z2` không) | Không ai đọc `x2/z2` thì xóa; đặt hằng cho 0.4 |
| 9 | Toạ độ tuyệt đối | Số thế giới viết tay lẫn với hằng `layout`; ghế tụng kinh chép tay | Zone 274–276; cột đèn 415; ghế 695, 879; 705; Đền Trình 1312, 1315 (lẫn `DEN_TRINH.x + 1.6`); 994–997; 1525 | Dời layout thì collider, zone, ghế lệch khỏi mesh | Quy về hằng layout / `CHANT_SEATS` (cần kiểm chứng chéo nguồn) |
| 10 | Chữ trên cột | Ba cơ chế cho cùng một việc | `COLUMN_LABELS` 36–42; `COUPLETS…split(',')[0]` ở 511, 634, 650, 690, 732, 734, 755; `relabelColumns(scene)` 1631 + `inscription` 58 | Cần kiểm chứng chéo `compound.ts`: relabel có vẽ lại texture không (Lux: `relabelColumns` còn dùng) | Giữ một nguồn; bỏ bước thừa |
| 11 | Tượng hành lang | Hai promise (một resolve từ ngoài) và hai hàm apply gần giống nhau | 173–190; 713–729 | Thấp–trung bình: ảnh hưởng fallback khi mạng chậm | Truyền thẳng callback vào `buildCorridorStatues` (175), bỏ `corridorLateP` |
| 12 | Helper dựng hộp, khung đình | Khoảng 10 helper "Box + shadow + sealable + add"; khung 4 cột–xà–mái chép 5 lần | Helper: 209, 213, 359, 478, 519, 549, 596, 778, 1037, 1242. Khung: 217–247, 490–508, 603–628, 1054–1067, 1248–1271 | Thấp nếu giữ nguyên số | Một factory `(group, sealable)`; khung để sau |
| 13 | Hồ, cá, cầu tàu, bảng | Khối chép đôi | Hồ 937–956 / 1487–1518; koi 972–982 / 1494–1504 và 1597–1606 / 1608–1616; cầu tàu 1038–1051 / 1551–1564; bảng 1153–1174 / 1178–1194; sân tượng 311–319 / 322–330 | Thấp | Gộp hàm; đặt cá ao Phóng Sinh trong group để dùng chung vòng update |
| 14 | Vật liệu trùng | Vật liệu giống hệt tạo nhiều lần, có chỗ trong vòng lặp | Trong vòng lặp: 82, 579, 1023 (= `stoneBase` ở 100). Trùng cặp: 158 = 1330; 555 = 1331; 523 = 788; 1036 = 1551; 937/939 = 1487/1489; 1154/1159 = 1179/1184 | Không; cần kiểm chứng chéo `lamb`/`stoneTexture` có cache không | Dùng lại biến sẵn có |
| 15 | Mesh tĩnh chưa gộp | `mergeStaticByMaterial` (448) chỉ áp cho nhà và nội thất | Cầu khoảng 130 mesh (1004–1032); Vườn Tháp khoảng 85 (560–576); lá sen tới 88 (958–968); 32 đinh trống (292–296) | Không gộp `pond` (cá động) và tháp chuông/trống (pivot động) | Gọi merge cho `bridge`, `vuon`, `baoThap` sau khi seal |

**4 câu hỏi (khu vực 4):** (1) Xóa được chắc chắn: mục 1 và 2 (mọi tham chiếu trong file). Sau kiểm chứng chéo: mục 3 (`tools/`), mục 4 (`compound.ts`), collider tường bao mục 7 (nếu đã có clamp biên), `x2/z2` mục 8. `resolveWater` chỉ re-export ở dòng 33 — Lux đã giải quyết: CÒN DÙNG (main.ts:1292, world.ts:607), giữ lại. (2) Phức tạp thừa: seal khe hở lúc chạy — 19 chỗ gọi cho hình học tĩnh trong khi chú thích 113 và 205–206 nói cấu kiện đã chạm nhau (nếu log gapdump báo `filled=0` thì đây là việc thừa mỗi lần tải); tải tượng hai pha bằng promise (mục 11); ba cơ chế chữ cột (mục 10); ba cách lắp một ngôi nhà: inline (633–670), `extraHouse` (672–688), inline có xoay (733–773). (3) Giả định yếu: bán kính người chơi 0.4 cố định, ẩn trong công thức collider (mục 8); tường bao kín nhờ các vòng tròn cách nhau 3m (mục 7); layout không bao giờ dời (mục 9); `weekKey` luôn dạng `YYYY-Www` (1227) — sai định dạng sẽ hiện "Tuần NaN"; 98 chỗ thiền ở hai dãy sàn (70–73) so với khoảng 72 tài khoản tổng (chỉ nêu quan sát); thiết bị chịu được hàng trăm mesh rời có đổ bóng (mục 15) — đáng lưu ý trước R4 (PWA, di động); `setHonorBoard` (1166–1170) vẽ lại texture mỗi lần gọi, không có khóa chống trùng như `setStele` (1221–1225). (4) Đơn giản hóa tiếp: gộp ba cách lắp nhà thành một `buildHouse({rot, openFront})` tự sinh collider và zone (mục 5, 6); một factory hộp và dùng lại vật liệu (mục 12, 14); gộp các khối chép đôi (mục 13); tách `buildTemple` theo khu (tháp, nhà, hồ, cổng, rào) trong cùng file, không thêm tầng trừu tượng.

**Top 3 khu vực 4:** (1) Mục 5 và 6 — công thức collider tường chép 5 lần kèm hack dòng 684. (2) Mục 1, 2, 3, 4 — xóa code chết, tham số chết, log gapdump, seal no-op. (3) Mục 7 và 8 — giả định va chạm của tường bao và rào viện.

## Khu vực 5/12 — Nhân vật, trang phục, Tam Thế (`src/character.ts`, `src/clothing.ts`, `src/tamthe.ts`)

**Lux kiểm chứng:** ✅ `MUTE`/`WHITE`/`BLUSH`/`robeLight` mỗi tên 1 lần xuất
hiện (chết); `lay` chết (các match khác là type literal + comment). ✅ tamthe
`stoneM`/`cw1`/`cd1`/`cw2`/`cd2` mỗi tên 1 lần (chết). ✅ Guard `li >= 18`
không bao giờ đúng (vòng lặp 4×3=12). ✅ Bàn lễ 10m chỉ có 3 collider r=1.15 →
hở ~0.7m giữa các vòng + hai đầu (±4.15–5) không phủ. ✅ `stairTop`/`stairRiser`
giống hệt nhau (tamthe.ts:54-61). ✅ `roundRect` ở character.ts:152,718 và KHÔNG
có polyfill trong repo (grep toàn repo: 5 call site ở 3 file — xem thêm khu vực
7 và 10). 🔍 `chip*`/`animCalls` (mục 3): Fable cần grep tools/ — Lux chưa
kiểm tools/ vì không fetch. Quan sát phụ của Fable: comment hỏng encoding ở
character.ts 333, 569, 865, 894, 898, 934; comment góc cúi lạy lệch code (898
ghi ~38°, 900 ghi ~43°, trong khi 0.66×0.65 ≈ 24.6° — thuộc phiên audit
animation, không phải Prompt A).

| # | Khu vực/file | Vấn đề | Bằng chứng | Rủi ro nếu xóa/sửa | Đề xuất |
|---|---|---|---|---|---|
| 1 | character.ts – hằng/biến chết | `MUTE`, `WHITE`, `BLUSH`, `robeLight`, `lay` khai báo nhưng không dùng; `void bun`; binding thừa `upper`, `foreS`, `cuff`. | 116-118, 318, 325, 456-457, 510, 515-516. Mỗi tên chỉ xuất hiện một lần trong file, không export. ✅ | Không. `robeLight` còn tạo thừa một material cache cho mỗi màu áo. | Xóa khai báo; giữ lời gọi tạo mesh ở 456, 510, 515, 516. |
| 2 | tamthe.ts – biến chết | `stoneM` (kèm `stoneTexture`) không dùng sau khi thềm đổi sang gỗ; `cw1/cd1`, `cw2/cd2` không dùng; guard `li >= 18` không bao giờ đúng. | 28 và import ở 5; 156; 162; 236-239 (vòng lặp chỉ 4×3 = 12, sức chứa 18). ✅ | Không. | Xóa; bỏ `stoneTexture` khỏi import; đặt sức chứa InstancedMesh = 12. |
| 3 | character.ts – dữ liệu chỉ ghi, nhánh không chạy | `chipFrac/chipTop/chipBot` và `animCalls` chỉ được ghi; nhánh nhãn cao 96 không bao giờ chạy cho nhãn tên. | 674-684 (chú thích 675 tự nhận "chỉ còn lưu dữ liệu"); 93, 802; 669 chỉ tạo 144/192 nên `tall` (679) và `oy > 0` (166) luôn đúng. 🔍 | Harness trong tools/ có thể đọc `animCalls` hoặc `chip*`. | Cần kiểm chứng chéo (grep src/ và tools/). Nếu không ai đọc thì xóa 675-684 và bỏ hai điều kiện. |
| 4 | character.ts – biểu thức vô nghĩa, gán lặp | Phép cộng trừ tự triệt tiêu; `shinRot?` luôn có giá trị; gán lặp `visible`; điều kiện cane lặp hai lần. | 165 (`+6 −0 −6`); 14, 812, 996; 877 lặp 858; 887 lặp 859; 623 bị 859/1042 ghi đè; 985 (`w>0` ≡ `prayW>0`); 1006 ≡ 1023. | Rất thấp, kết quả tính không đổi. | Rút gọn: 165 còn `x0 + chip/2 + w/2`; bỏ `?` và `if`; dùng `hunched` ở 1023. |
| 5 | clothing.ts – hai áo dài trùng nhau | `buildAoDaiVangNhatV3` gần như sao chép `buildAoDaiHongSenV3`; chỉ khác màu, số cánh sen và dải viền xẻ. | 11-131 so với 136-271; khác biệt ở 175-180, 184-189, 222. Bà ba đã tham số hóa sẵn (276, 375-381). | Chỉ ảnh hưởng hình ảnh. `g.name` (13, 138) có thể được harness dùng: cần kiểm chứng chéo. | Gộp thành một builder nhận tham số như `buildBaBaV3`; giữ nguyên hai hàm export. |
| 6 | clothing.ts – khối lặp trong 5 builder | Khối tay/chân lặp 4 lần, hoa sen 4 lần, helper `add` 5 lần với `castShadow` không nhất quán. | Tay/chân: 90-121, 230-261, 336-368, 440-471. Sen: 65-81, 205-221, 303-320, 418-435. `add`: 20, 145, 281, 394, 507; có bóng ở 23, 148, 510. | Thấp. Bà ba/áo lam hiện không đổ bóng thân (character.ts 622 ẩn áo gốc); sửa sẽ đổi hình bóng. | Một helper `add`, một `lotus`, một `limbs` dùng chung trong file. |
| 7 | character.ts + clothing.ts – map pivot bằng suy đoán | Ba quy ước đặt tên pivot, trái/phải ngược nhau; bên dùng phải đoán theo tọa độ rồi throw lúc chạy. | character.ts 39-60, 619; clothing.ts 92, 109, 123-126 (s<0 = L) so với 337 và 440 (s>0 = L). | Harness đọc `userData.pivots` (clothing.ts 4): cần kiểm chứng chéo trước khi đổi key. | Sau mục 6, helper trả thẳng `{armL…shinR}` theo quy ước x<0 = L (character.ts 523); bỏ `mapGarmentPivots` và try/catch. |
| 8 | Nón lá gắn cứng vào áo lam | Đội `non_la` phải dựng cả bộ áo lam rồi hủy ngay; mặc `ao_lam` thì dựng nón rồi ẩn. | character.ts 617, 626-636; clothing.ts 476-492. | Harness có thể gọi `getObjectByName('nonLa')` trên bộ áo: cần kiểm chứng chéo. | Tách 476-492 thành `buildNonLa()`; xóa character.ts 617 và 627-631. |
| 9 | character.ts – `dispose()` thiếu | Không hủy nón/khăn đang đội, material mặt, material thêu, geometry tràng hạt, material đầu nhang. | 729 so với 607 và 633-641 (`accOwned`), 352, 361, 488-491, 503, 576, 656-657. | Thấp. Rò GPU tích lũy theo lượt vào/ra khi tab mở lâu; nơi gọi `dispose()` cần kiểm chứng chéo. | Trong `dispose()` gọi `setAccessory(null)` thay đoạn hủy garment riêng; đưa material 576 thành hằng module. |
| 10 | character.ts – giả định trình duyệt mới | `ctx.roundRect` chỉ có từ Safari 16 / Chrome 99 / Firefox 112. Máy cũ sẽ throw ngay ở `setLabel(name)` (686), không dựng được nhân vật nào. | 152, 718. ✅ (Lux: KHÔNG có polyfill trong repo; tổng cộng 5 call site ở 3 file — xem khu vực 7 #12 và animals.ts:64) | Rủi ro nằm ở việc không sửa, nhất là trước R4 (PWA trên di động). | Thay bằng path `arcTo` trong hai chỗ này (hoặc thêm polyfill một lần cho cả 5 chỗ). |
| 11 | clothing.ts – tài nguyên riêng cho mỗi người mặc | Mỗi lần mặc tạo mới toàn bộ geometry và material; áo dài khoảng 47 mesh đều đổ bóng. Dùng `MeshStandardMaterial` trong khi thân nhân vật là toon có cache. | clothing.ts 15-18, 54, 71, 140-143, 278, 391, 504; character.ts 109-115, 616. | Thấp. Giả định ít người mặc áo cùng lúc; buổi lễ đông trên di động sẽ lộ. | Sau mục 5-6: đưa material lên cấp module và dùng lại geometry; khi đó cũng xóa được `disposeGarment`. |
| 12 | tamthe.ts – số draw call | 20 bậc thang dùng mảng 6 material, tức khoảng 120 draw call; thềm thêm 18; song cổ diêm khoảng 54 mesh rời. | 67, 71-79; 41-44; 143-148 (n = 12, 7, 5, 3 mỗi cặp vách). | Thấp, chỉ hình ảnh. Giả định yếu về GPU di động. | Gộp geometry bậc thang (`mergeGeometries` đã dùng ở character.ts 2); song dùng InstancedMesh như 236, 249. |
| 13 | tamthe.ts – material bậc thang rườm rà | `stairTop` và `stairRiser` giống hệt nhau; bốn lần clone material + map chỉ để đổi `repeat`, trong khi chỗ khác gọi thẳng `woodTexture([..])`. | 54-65, 81-84 so với 38-39, 45, 111. ✅ | Thấp. Cần kiểm chứng chéo textures.ts: `woodTexture(repeat)` có trả texture độc lập không. | Dùng chung một material cho mặt bậc và mặt đứng; thay clone bằng `lamb(…woodTexture([4,1]))`. |
| 14 | tamthe.ts – vá khe lúc chạy | `sealArchitectureJoints` chạy mỗi lần tải trên hình học tĩnh; im lặng chấp nhận tới 8 khe còn lại. | 263-267; cờ `sealable` ở 33, 98-100, 108-109 (28 vật). | Bỏ đi có thể lộ khe ở cột/xà. Chi phí và kết quả thật nằm ở compound.ts: cần kiểm chứng chéo. | Chỉ quan sát. Nếu harness cho thấy `filled` ổn định bằng 0 thì bỏ lời gọi và cờ. |
| 15 | tamthe.ts – va chạm bàn lễ | Bàn 10 m × 1.6 m chỉ có ba vòng tròn r = 1.15 cách nhau 3 m: hở khoảng 0.7 m giữa các vòng, hai đầu bàn (±4.15 đến ±5) không được phủ. | 214, 234. ✅ | Người chơi có thể đi xuyên bàn; tùy bán kính người chơi: cần kiểm chứng chéo. | Sửa tại dòng 234: thêm tâm hoặc tăng r, như cách bệ thờ dùng 11 vòng (202). |

**4 câu hỏi (khu vực 5):** (1) Xóa được chắc chắn: mục 1 và 2. Có điều kiện: mục 3 (`chip*`, `animCalls`) sau khi grep src/ và tools/. clothing.ts: không có export chết — cả 6 builder đều dùng ở character.ts 600-604, 627, 638. Không có file nào xóa nguyên được. (2) Phức tạp thừa: mục 7 (suy đoán pivot theo tọa độ kèm throw lúc chạy); mục 8 (dựng cả bộ áo để lấy cái nón); mục 13 (clone material/texture 4 lần chỉ để đổi `repeat`); mục 14 (vá khe lúc chạy cho hình học tĩnh). (3) Giả định yếu: thiết bị — mục 10 (`roundRect` máy cũ) và mục 12 (draw call di động); số người cùng lúc — mục 11, nhãn tên `sizeAttenuation: false` + `depthTest: false` (character.ts 135) nên khi đông người nhãn chồng lên nhau, cơ chế dời nhãn đã bị bỏ (675); phiên ngắn trong khi game là "24/7" (mục 9); người chơi không đi sát bàn lễ (mục 15); `say()` chỉ ngắt dòng theo khoảng trắng (703-710) nên chuỗi dài không dấu cách tràn bong bóng 408px. (4) Đơn giản hóa tiếp: mục 5, 6, 7, 8 theo thứ tự — clothing.ts ước giảm ~200/531 dòng, `mapGarmentPivots` biến mất; mục 11 sau đó thì `disposeGarment` cũng xóa được; mục 4, 9, 13 rút gọn tại chỗ; `suitBuilders` (character.ts 599-605) đưa lên cấp module.

**Top 3 khu vực 5:** (1) Trùng lặp trong clothing.ts (mục 5, 6, kéo theo 7 và 8) — khối giảm code lớn nhất, nghiệm thu bằng harness chụp ảnh sẵn có. (2) `roundRect` không có fallback (mục 10) — làm trước R4. (3) Code chết mục 1 và 2 + `dispose()` gọi `setAccessory(null)` (mục 9).

## Khu vực 6/12 — Thế giới + bố cục + chánh điện (`src/world.ts`, `src/compound.ts`, `src/layout.ts`, `src/hall.ts`)

**Lux kiểm chứng:** ✅ `pathN` có chiều dài âm (14.4−14.7=−0.3, world.ts:138).
✅ `ring` đồng phẳng với tấm lát (y=0.045) → nguy cơ nhấp nháy. ✅ Bamboo
~980 mesh (49 khóm × 20, mỗi lá `new SphereGeometry`, compound.ts:379). ✅
`roofGeometry` L70 chứa phép toán đồng nhất (`x*(…)/(…)` ≡ x, hạng tử `*0.0`/
`*0`). ⚠️ **Sửa kết luận của Fable ở #3:** `sereneSky` CHẾT thật (chỉ
compound.ts tự tham chiếu), NHƯNG `placeKoiPond` CÒN DÙNG (temple.ts:934, 984)
và `relabelColumns` CÒN DÙNG (temple.ts:54, 1631) — chỉ xóa `sereneSky` (+
`SkyPalette` nếu không ai dùng). ✅ #4: `grassClump` CHẾT (không nơi nào gán
`userData.grassClump` — chỉ còn compound.ts:208) → xóa `removeSolidGrassClumps`
+ lời gọi. 🔍 #6 (seal ở chánh điện): cần log `seal.filled` lúc chạy, không
xác minh được tĩnh.

| # | Khu vực/file | Vấn đề | Bằng chứng | Rủi ro nếu xóa/sửa | Đề xuất |
|---|---|---|---|---|---|
| 1 | world.ts:136-156 | Lớp nền cũ bị `paveCompound` phủ kín; `pathN` có chiều dài âm. | `pathN`: 14.4 − 14.7 = −0.3 (138). ✅ `plaza` y=0.03 (148), `lotusFlat` 0.04 (155), `ring` 0.045 (152) nằm dưới tấm lát 0.045/0.049 (compound.ts:223-243). | `pathS` (142-145) còn lộ dải 1 m z 44→45 ngoài tấm lát (compound.ts:228-231). `ring` đồng phẳng tấm lát, có thể đang nhấp nháy. | Xóa `pathN`, `plaza`, `ring`, `lotusFlat`, `plazaT`. `pathS`: soi cổng rồi xóa hoặc thu còn 1 m. |
| 2 | world.ts:7-9, 158-159, 356 | Import và biến chết. | `signTexture` (7), `geo, outlined, toon` (8), `HALL` (9) không dùng. `stoneM` chỉ có `void stoneM` (159), không truyền vào `buildTemple` (346). `void LAKE; void HALL` (356). | Gần bằng 0. Cần kiểm chứng chéo: `./toon` có side-effect khi import không. | Xóa. |
| 3 | compound.ts:155-157, 173-198, 265-292 | `sereneSky`, `placeKoiPond`/`PondHandle`, `relabelColumns`/`ColumnLabel` không được file đính kèm nào gọi. | world.ts:6 và hall.ts:4 không import ba hàm này. hall.ts:152 tự vẽ chữ cột; `userData.inscription` (hall.ts:154) chỉ phục vụ `relabelColumns`. ⚠️ | Cần kiểm chứng chéo: grep ba tên hàm trong temple.ts, garden.ts, tools/. **Lux đã grep: `sereneSky` chết thật; `placeKoiPond` dùng ở temple.ts:934, 984; `relabelColumns` dùng ở temple.ts:54, 1631.** | Chỉ xóa `sereneSky` (+ `SkyPalette` nếu không ai dùng). Giữ `placeKoiPond` và `relabelColumns`. |
| 4 | compound.ts:205-216, world.ts:354 | `removeSolidGrassClumps` duyệt cả scene nhưng nhiều khả năng không làm gì. | Không file đính kèm nào gán `userData.grassClump`; world.ts:239-240 ghi bụi cỏ "đã được loại bỏ hoàn toàn". ✅ (Lux: grep toàn repo — không nơi nào gán `grassClump`) | Cần kiểm chứng chéo: grep `grassClump`. Nếu còn nơi gán thì bụi cỏ hiện lại. | Grep trống thì xóa hàm, lời gọi và import. |
| 5 | hall.ts:78, 121, 128, 149, 164, 206-209 | Biến chết và nhánh không bao giờ chạy. | `cw1, cd1` (121), `cw2, cd2` (128) không đọc lại. `if (li >= 16) break` (209): vòng lặp chỉ 4×3=12. Comment 78 tả hàm không tồn tại; 149 trùng 150; 164 lặp 28. | Không. | Xóa; InstancedMesh 16→12. |
| 6 | hall.ts:235-239, compound.ts:42-137 | `sealArchitectureJoints` trong chánh điện có vẻ không tạo gì nhìn thấy. | Tính tay từ hall.ts:43-64: 12 miếng bù cột–xà (khe 0.11) nằm lọt trong đấu 1.5×0.38. `remaining` luôn rỗng nên nhánh cảnh báo 236-239 chết. 🔍 | Tính tay có thể sai. Hàm còn dùng cho Bảo Tháp (layout.ts:113) nên chỉ bỏ lời gọi ở hall. | Log `seal.filled`, ẩn thử nhóm `joint-seals`. Đúng thì xóa 235-239, cờ `sealable` (29, 50-52, 63-64) và import (4). |
| 7 | layout.ts:91-164 | `groundY` chép tay cao độ từ mesh bằng số cứng, phải chạy theo cả miếng bù tự sinh. | Hall 0.45/0.8/0.9 (96-98) so với hall.ts:34. Hộp seal 4.34/0.92 (113-115), dòng 44. Dòng 13 trích "temple.ts:1130-1131". Số cứng ở 130-132, 156-157. | Sửa mesh mà quên layout thì nhân vật lơ lửng hoặc chìm. Sửa `groundY` đổi vị trí đứng của mọi người chơi. | Chưa xóa được. Tối thiểu: đưa bậc nền hall vào `HALL` để hall.ts:34 và layout.ts:96-98 dùng chung. |
| 8 | world.ts:22-26, 80-81, 97-98, 504-519; compound.ts:140-170 | Hai bảng màu trời song song cho một việc. | `MOODS` trùng giá trị `SERENE_SKY.day/dusk` (world 23, 25 và compound 150-151). Giá trị khởi tạo bị `setMood` ghi đè ngay (519). Dòng 513 lặp compound.ts:169. `pal.hemi`, `pal.night` không ai đọc. | Màu nền khung hình đầu đổi 0xd8ecfb→0xdcefff, không nhận ra. Cần kiểm chứng chéo: nơi khác import `SERENE_SKY`. | Giữ `MOODS`. Bỏ `SERENE_SKY`, `SkyPalette`, dòng 513; `applySkyPalette` nhận thẳng `Mood` hoặc nhập vào `setMood`. |
| 9 | world.ts:60-76 | `roofGeometry` còn số hạng thử nghiệm vô nghĩa. | Dòng 70: `x*(…)/(…)` ≡ x; `*0.0` và `*0` ≡ 0. Độ hất mái cộng hai lần (t² ở 70, t³ ở 72). ✅ | Hàm dùng cho mọi mái (346, hall.ts:78). Phải giữ đúng tổng `corner*lift*(t²+t³)` − bend. | Viết gọn thành một phép gán, không đổi kết quả. |
| 10 | world.ts:255-278, 402-415, 441-454; compound.ts:428-452 | Code đèn bị nhân đôi hai chỗ. | `spawnLantern` 403-409 ≡ `spawnSkyLantern` 442-448. Hàm `tint` 263-269 ≡ compound 436-441. Material của floater không dispose (562), khác 570/578/586. | Thấp. Đèn vườn thiền không vào `glowers` nên không sáng theo đêm; gộp sẽ đổi điều đó. | Một hàm tạo thân đèn có tham số; một hàm clone `hanging_lantern` dùng chung. |
| 11 | layout.ts:139-152; 2, 31, 40 | Công thức nền dốc lặp 3 lần; có trường không ai đọc. | 139-142 (`AM_CO`), 144-148 (vòng lặp), 149-152 (`VUON_THAP`) cùng công thức, cùng dạng dữ liệu. `HALL.ramp`, `TAM_THE_PLAT.ramp` (comment 26 mâu thuẫn 128), `BAO_THAP_PLAT.r` không đọc trong file đính kèm. | Gộp vòng lặp an toàn vì toàn `Math.max`. Ba trường: cần kiểm chứng chéo temple.ts trước khi xóa. | Thêm hai nền vào mảng dòng 144. Grep rồi xóa trường thừa; sửa comment 26 và hall.ts:33. |
| 12 | world.ts:196-223; layout.ts:187-235 | Rải cây ngẫu nhiên cố định nhưng phải vá tay theo chỉ số seed. | Ngoại lệ Vườn Cây 204-206 nằm ngoài `blocked()`, có ghi "scatter i=138". `v === 3` bỏ 1/4 điểm (210) nhưng vẫn tính vào trần 90 (197). `blocked()` dùng toạ độ thô (220-233). | Sửa bất kỳ luật nào làm cây và collider dịch chỗ, có thể chặn lối. | Dời 204-206 vào `blocked()`; lọc `v===3` trước khi đếm trần, sau khi so vị trí cây trước/sau. |
| 13 | compound.ts:372-393 | Rặng tre: khoảng 980 mesh rời có đổ bóng. | Tính tay: 6+4+39 = 49 khóm × (5 thân + 15 lá). Mỗi lá `new SphereGeometry` giống hệt nhau (379). ✅ Sỏi và hoa cùng file đã dùng instancing (357, 477). | Giả định máy mạnh; khoảng 980 draw call ×2 vì bóng, đáng ngại trên điện thoại trước R4. | Dùng chung một geometry lá; tắt `castShadow` cho lá. Instancing là bước tối ưu sau. |
| 14 | world.ts:435-438, 461-497 | Pháo hoa: mỗi tàn là một Sprite và material riêng; màn kết suy từ nhịp nổ. | 24-40 sprite mỗi quả (462-464). Màn kết 3 quả cùng lúc, tối đa khoảng 120 sprite (480-484). `intervalMs >= 3000` nghĩa là "show lớn" (437, 480). | Đổi `intervalMs` trong shared/game làm màn kết tự xuất hiện hoặc biến mất. Cần kiểm chứng chéo `FIREWORKS` và giới hạn tần suất ở server. | Chỉ quan sát. Nếu sửa: dùng chung material theo màu; bỏ `Math.max/round` thừa ở 478. |
| 15 | compound.ts:411-415 | Góc xoay ghế đá truyền vào rồi bị ghi đè qua chỉ số `children`. | `Math.PI/2*0 + Math.PI/2*1` (411). Dòng 413-414 gán lại `rotation.y` qua `grp.children[length-2/-1]`; kết quả là π/2 và π. | Thêm vật vào `grp` giữa hai lệnh sẽ xoay nhầm vật khác. | Truyền thẳng `Math.PI/2` và `Math.PI`, xóa 413-414. |

Quan sát ngoài bảng (Fable): world.ts:529 `position.y +=` không nhân `dt` nên biên độ lắc đèn phụ thuộc FPS; nắp, tua và dây (332-336) không lắc theo — chuyển Prompt B (animation). world.ts:280 comment "chưa có mechanic" đã cũ so với bảng "chạm vào ống để xin quẻ" (301). world.ts:198, 232 rải cây và hoa theo hình vuông ±`MAP_HALF`, trong khi tường lệch (`WALL.zN=-82`, `zS=45`, layout.ts:9) — cần kiểm chứng chéo giá trị `MAP_HALF`.

**4 câu hỏi (khu vực 6):** (1) Xóa được chắc chắn trong phạm vi file: #2 và #5. Gần chắc: #1 (riêng `pathS` cần soi cổng). Chờ grep xác nhận: #3 (Lux đã giải quyết một phần — chỉ `sereneSky` chết) và #4 (Lux: grep trống — xóa được). Chờ log lúc chạy: lời gọi seal ở chánh điện (#6). (2) Phức tạp thừa: `sealArchitectureJoints` (#6, #7) — thuật toán dò khe O(n²) lúc chạy để sửa toạ độ đặt tay; ở chánh điện nó không tạo gì thấy được, ở Bảo Tháp nó sinh hình học mà `groundY` phải chạy theo; hai bảng màu trời và lớp `applySkyPalette` (#8); `placeKoiPond`/`PondHandle` (#3) bọc một lệnh `position.set` (nhưng còn dùng — giữ); `paveCompound` có `opts` và giá trị trả về (compound.ts:222, 261) không ai dùng (world.ts:355); `blocked()` cộng ngoại lệ theo chỉ số seed (#12). (3) Giả định yếu: mesh và `groundY` luôn được sửa đồng bộ bằng tay, kể cả tham chiếu số dòng sang file khác (#7); chuỗi `rngSeed` và các luật `blocked()` không đổi, nên vá theo `i=138` mới đúng (#12); thiết bị đủ mạnh cho khoảng 980 mesh tre và khoảng 120 sprite pháo cùng lúc (#13, #14); `intervalMs >= 3000` nghĩa là "show lớn" (#14); bản đồ vuông đối xứng quanh gốc (`MAP_HALF`) trong khi tường lệch. (4) Đơn giản hóa tiếp: sau #1, `paveCompound` là nguồn duy nhất của mặt sân — bỏ `opts`, bỏ `return`, bỏ texture `pave`/`plazaT` ở world.ts; sau #3 và #4, compound.ts chỉ còn seal, `paveCompound` và ba khu vườn — lúc đó gộp palette (#8); sau #6, bỏ tham số `seal` của `box()` trong hall.ts; các mục độc lập: #9, #10, #11, #15.

**Top 3 khu vực 6:** (1) #1 + #2 — xóa lớp nền cũ và code chết trong world.ts (~25 dòng, bớt 5 mesh và 3 texture canvas, loại nguy cơ nhấp nháy của `ring`). (2) #3 + #4 (+ #5) — xóa export không ai gọi trong compound.ts và biến chết trong hall.ts (~70 dòng; Lux: chỉ `sereneSky` + `removeSolidGrassClumps` trong #3/#4 là chết thật). (3) #6 — bỏ lời gọi seal ở chánh điện (cần log `seal.filled` và ẩn thử `joint-seals` trước).

## Khu vực 7/12 — Tượng + texture + vật liệu (`statues.ts`, `statue-corridor.ts`, `statue-scan.ts`, `textures.ts`, `toon.ts`, `sdf.ts`)

**Lux kiểm chứng:** ✅ `goldEnv`/`getGoldEnv` trùng NGUYÊN VĂN (corridor:39-48
≡ scan:13-22); `makeGoldMaterial` đã export từ scan. ✅ `sdf.ts` CHẾT THẬT
(0 tham chiếu trong toàn bộ repo đã fetch — xóa cả file 97 dòng). ⚠️ **Sửa kết
luận của Fable ở #4:** `toon.ts` KHÔNG chết — được import bởi character,
garden, market, vuoncay, world; chỉ dedupe cache `geo` (trùng statues.ts)
chứ không xóa file. ✅ `faceTexture` tạo canvas 512² mới mỗi lần gọi, không
memo. ✅ `COL.leaf` 1 lần xuất hiện (chết). ✅ `roundRect` ở textures.ts:43,52
(tổng cộng 5 call site ở 3 file, không có polyfill — xem khu vực 5 #10).
🔍 #10 `vertexBox`: tác giả cố ý tránh `setFromObject` (có comment giải thích);
three 0.170.0 — cần xác minh cờ `precise` tồn tại ở bản đó trước khi thay.

| # | Khu vực/file | Vấn đề | Bằng chứng | Rủi ro nếu xóa/sửa | Đề xuất |
|---|---|---|---|---|---|
| 1 | statue-corridor.ts ↔ statue-scan.ts | Trùng nguyên `goldEnv`/`getGoldEnv` và vật liệu vàng → PMREM chạy 2 lần, 2 env texture giống nhau | corridor 39–48, 87–89 ≡ scan 13–22, 24–26 (`makeGoldMaterial` đã export). ✅ | Thấp; corridor thêm phụ thuộc vào statue-scan | Xóa corridor 2, 39–48; dòng 87 gọi `makeGoldMaterial(renderer)` |
| 2 | statue-corridor.ts, statue-scan.ts | Lớp bọc no-op: `FACE_OFFSET` toàn 0 nên tham số `offset` và group `turn` vô tác dụng; `wrap.rotation.y = 0` | corridor 28–33, 50, 71–73, 107; scan 80–83 | Thấp; cần kiểm chứng chéo temple.ts không dò cấu trúc wrap>turn>inst | Xóa bảng, tham số, group `turn`; scan add `inst` thẳng vào `root` |
| 3 | sdf.ts | Cả file Surface Nets không được file đính kèm nào import; statues ghi "chỉ dùng primitive" | sdf 1–97; import ở statues 1–2, corridor 1–3, scan 1–5 không có `./sdf`; statues 7. ✅ (Lux: 0 tham chiếu toàn repo) | Cần kiểm chứng chéo: grep `./sdf` toàn `src/`; còn tham chiếu thì build gãy | 0 tham chiếu → xóa cả file |
| 4 | toon.ts | Không file đính kèm nào import; `geo` trùng nguyên văn với statues.ts | toon 39–44 ≡ statues 48–53; statues 8 ("100% MeshStandardMaterial"). ⚠️ | Cần kiểm chứng chéo (avatar/NPC có thể dùng); gộp cache dễ đụng khoá chung như `'head'`, `'flame'` (statues 177, 120). **Lux: toon.ts CÒN DÙNG (character/garden/market/vuoncay/world import) — KHÔNG xóa file.** | Chỉ gộp một `geo` cache |
| 5 | statues.ts | Hằng chết và comment lệch code | `COL.leaf` 27 (chỉ `leafRound` dùng ở 453, `COL` không export); 12 (`FIG_SCALE` không tồn tại); 364 vs 367; 8 vs 153, 214. ✅ | Không | Xóa dòng 27; sửa hoặc xóa comment sai |
| 6 | statues.ts + textures.ts | Mỗi lần `faceDecal` tạo canvas 512² và material mới, trái cam kết cache ở đầu file | statues 10 vs 165–168; textures 187–240 không memo (so `glowTexture` 67–74); `limb` 79 cũng `new` geometry. ✅ | Thấp; cần kiểm chứng chéo số lần temple.ts gọi `buildArhat` | Memo `faceTexture` và material theo `kind` (tối đa 2 bản) |
| 7 | statues.ts, textures.ts | Kind `'guanyin'` là tên sót: Quan Âm dùng mặt mesh riêng, chỉ La Hán dùng kind này | statues 476 vs 546; textures 221, 228 (khác mỗi nét 15/17 và urna) | Thấp (đổi tên ở 2 file) | Thay bằng cờ `urna`; bỏ nhánh lineWidth |
| 8 | statues.ts `buildArhat` | Tượng 3 biến thể được mô tả là fallback khi GLB lỗi; scan chỉ dùng khối trụ giữ chỗ | statues 486–550; corridor 80–81, 106; scan 51–57 | Cần kiểm chứng chéo temple.ts (có thể còn dùng nơi khác); đổi hình ảnh khi mạng yếu. **Lux: `buildArhat` CÒN DÙNG (temple.ts:157, corridor:81) — đây là quyết định thiết kế, không phải code chết.** | Chủ dự án quyết: nếu chỉ là fallback → dùng khối giữ chỗ, xóa `buildArhat` |
| 9 | corridor + scan | Hai cài đặt riêng cho "thử lại 1 lần sau 20 s"; `onLate` tùy chọn nên có thể không bao giờ retry | corridor 85, 91–96, 101; scan 64 (số 20000 viết cứng) | Cần kiểm chứng chéo models.ts: nếu `loadModel` cache kết quả lỗi thì retry vô ích | Gom một helper retry; xác minh retry thật sự tải lại |
| 10 | statue-corridor.ts `vertexBox` | Tự viết bbox theo đỉnh, quét mọi đỉnh 2 lần mỗi tượng; scan lại dùng `setFromObject` thường | corridor 9–26, 58, 63; scan 71, 75. 🔍 | Trung bình: lệch chiều cao tượng nếu bản three chưa có tham số `precise` (cần kiểm chứng chéo package.json — three 0.170.0; tác giả có comment giải thích việc tránh `setFromObject`) | `new Box3().setFromObject(inst, true)`; xóa `vertexBox` |
| 11 | corridor ↔ scan | Chuỗi clone → phủ vàng → scale 1.6 → căn tâm → đặt đáy viết 2 lần; `TARGET_HEIGHT` khai 2 nơi | corridor 51–69, 7; scan 66–79, 10 | Thấp–TB: lệch vị trí tượng vườn tháp, cần chụp nghiệm thu lại | Sau mục 1: scan dùng chung `prepare`, đặt `wrap.position.y = topY` |
| 12 | textures.ts `stoneTexture` | Dùng `roundRect` (cần Safari 16+/Chrome 99+/Firefox 112+); máy cũ sẽ throw | 43, 52; scan 40 gọi đồng bộ trước `scene.add` (59) và collider (60). ✅ | Sửa gần như không đổi hình (bo 6 px trên 512); cần kiểm chứng chéo có polyfill chưa (Lux: KHÔNG có) | Thay bằng `fillRect` hoặc kiểm tra tồn tại trước khi gọi |
| 13 | textures.ts (font) | Font giả định máy Windows: "Segoe UI", "Times New Roman"; canvas vẽ một lần, không chờ webfont | 102, 121, 143, 257, 293, 338, 385 | Đổi font làm đổi bề ngang chữ → phải chụp lại biển, bia | Một hằng font chung; cần kiểm chứng chéo "Be Vietnam Pro" đã nạp trước khi vẽ |
| 14 | textures.ts | 8 hàm lặp đoạn tạo canvas và `CanvasTexture`; vòng co chữ lặp 7 chỗ; anisotropy không nhất quán | Kết: 106–108, 130–132, 176–179, 236–239, 279–282, 301–303, 367–369, 398–400. Co chữ: 104, 123, 128, 264, 296, 355–358, 389 | Thấp; độ nét biển hiệu đổi nhẹ khi thống nhất anisotropy | `canvasTex` nhận w×h; thêm helper co chữ |
| 15 | textures.ts `softDot`, `petalTexture`, `shadowBlobTexture` | Không memo; `softDot` giả định chuỗi `rgb(...)` nhưng mặc định là `'#ffffff'` nên stop .35 mất alpha | 59–66 (dòng 62), 76–84, 86–92; so 67–74 | Cần kiểm chứng chéo nơi gọi: gọi theo từng thực thể thì nhân bản texture GPU | Memo như `glowTexture`; sửa stop .35 |

**4 câu hỏi (khu vực 7):** (1) Xóa được chắc chắn (bằng chứng trong file): `COL.leaf` (statues 27); `FACE_OFFSET`, tham số `offset`, group `turn` (corridor 28–33, 71–73); `wrap.rotation.y = 0` (scan 82); bản sao `goldEnv`/`getGoldEnv` và vật liệu vàng viết tay (corridor 39–48, 87–89); các comment lệch (statues 8, 10, 12, 364). Có điều kiện (grep toàn `src/`): `sdf.ts` cả file (97 dòng) — Lux: grep trống, xóa được; `toon.ts` cả file hoặc ít nhất một trong hai `geo` trùng nhau — Lux: toon.ts còn dùng, chỉ gộp `geo`; `buildArhat` cùng `ARHAT_*` (statues 486–550) nếu temple.ts chỉ dùng làm fallback và chủ dự án chấp nhận khối giữ chỗ — Lux: còn dùng, quyết định thiết kế. (2) Phức tạp thừa: tượng hành lang có 3 tầng dự phòng (GLB → tượng chibi 3 biến thể → retry 20s → `onLate` thay nóng; corridor 83–99, statues 500–550) trong khi tượng vườn tháp làm cùng việc chỉ bằng một khối trụ (scan 51–57); `vertexBox` tự viết trong khi three có sẵn chế độ `precise`; wrapper lồng `wrap > turn > inst` cho góc quay luôn bằng 0; `buildHalo(radius, …, flames)` có tham số nhưng luôn được gọi với 1.3 và 8 (statues 135, 261, 482). (3) Giả định yếu: thiết bị — `roundRect` luôn có (textures 43, 52), font Windows luôn có (102, 257, 293, 385); hiệu năng máy yếu — model scan đủ nhẹ để quét từng đỉnh 2 lần trên main thread và bật `castShadow` (corridor 20–23, 54; scan 69), cần kiểm chứng chéo số đỉnh của các file GLB; mạng — lỗi tải tự khỏi sau đúng 20s và một lần thử là đủ (corridor 101, scan 64); nơi gọi — texture không memo được coi là chỉ gọi một lần (textures 59, 76, 86, 187), `honorBoardTexture` và `steleTexture` tạo texture mới mỗi lần cập nhật (176, 367), cần kiểm chứng chéo nơi gọi có `dispose` bản cũ; `softDot` giả định màu dạng `rgb(...)` (62). (4) Đơn giản hóa tiếp: scan và corridor dùng chung một `prepare`, một `TARGET_HEIGHT`, một helper retry (mục 9, 11); `canvasTex` nhận kích thước chữ nhật, thêm helper co chữ và một hằng font (mục 13, 14); memo `faceTexture` và material mặt, thay kind `'guanyin'` bằng cờ `urna` (mục 6, 7); chỉ còn một `geo` cache (mục 4).

**Top 3 khu vực 7:** (1) Gộp env và vật liệu vàng (mục 1) — bớt một lần PMREM lúc khởi động, ~13 dòng. (2) `roundRect` trong `stoneTexture` (mục 12) — sửa 2 dòng, làm trước R4. (3) Grep rồi xóa `sdf.ts` (mục 3) — Lux đã grep: xóa được; `toon.ts` thì KHÔNG xóa.

## Khu vực 8/12 — Features đợt 1 (`src/features/`: fortune, beads, photo, profile, mail, checkin, spin, stats, character)

**Lux kiểm chứng:** ✅ Profile panel vẽ lại xóa nội dung đang gõ (profile.ts:28
`replaceChildren` + L102 vẽ lại mỗi event `profile`). ✅ Spin cache lỗi thời sau
07:00 (spin.ts:57-60). ✅ Photo mã hóa đôi + class `photo-mode` thêm/gỡ trong
cùng task đồng bộ nên không bao giờ paint (photo.ts:80/85/87/92/97). ✅ Beads
cờ `waiting`/`started` thừa + callback ack `beads:start` rỗng (L96) + lỗi chung
bỏ qua `r.error` (L85). ✅ mail.ts:140-141 tự ghép chuỗi thay vì dùng `giftText`,
L143 regex trên câu lỗi tiếng Việt của server. ✅ Brand lệch: fortune.ts:9 share
text kết "(Chùa Online…)", photo.ts:17 filename `chua-online-…` trong khi
watermark là "Chùa 24/7" (photo.ts:33). ⚠️ `spinDone` CÒN DÙNG (games.ts) —
Fable sai ở mục "gần chắc". ✅ `getLastPhoto` chỉ còn hook DEV (main.ts:2643).
✅ `giftText`/`COLORS` đều có nơi dùng trong file.

| # | Khu vực/file | Vấn đề | Bằng chứng | Rủi ro nếu xóa/sửa | Đề xuất |
|---|---|---|---|---|---|
| 1 | profile.ts | Mỗi event `profile` vẽ lại toàn bộ panel, xóa nội dung tiểu sử/tuổi đang gõ dở | 28 (`replaceChildren`), 38, 40 nạp lại từ profile; 102, 104 gọi rerender. ✅ | Thấp, chỉ client. Cần kiểm chứng chéo: tần suất server emit `profile` | Tách form khỏi phần vẽ lại; chỉ vẽ lại đầu thẻ và danh sách danh hiệu |
| 2 | spin.ts | Cache `spinUsed` không làm mới khi mở panel; qua mốc 07:00 vẫn báo "đã quay", ẩn nút | 57 dùng cache; chỉ hỏi server khi `null` (58-60). checkin.ts:60 thì luôn hỏi lại. ✅ | Thấp. Cần kiểm chứng chéo: server có đẩy lại `spin` lúc sang ngày không | Luôn gọi `spin:get` khi mở, bỏ nhánh 57-58 |
| 3 | photo.ts | Mã hóa PNG hai lần: canvas → dataURL → Image → canvas phụ → dataURL | 85, 97-105; `loadImage` 20-27 chỉ phục vụ vòng này. ✅ | Thấp; cần thử ảnh không đen trên máy thật | `drawImage(canvas)` thẳng trong cùng task sau `post.render()`; bỏ `loadImage` và khối async |
| 4 | photo.ts | Class `photo-mode` thêm rồi gỡ trong cùng task đồng bộ nên không bao giờ được paint; `toDataURL` cũng không chụp DOM | 80, 87, 92. ✅ | Rất thấp. Cần kiểm chứng chéo: `post.render()` hoặc CSS có đọc class này không | Xóa 3 dòng |
| 5 | photo.ts | `lastPhoto` giữ nguyên dataURL PNG (vài MB) suốt phiên | 4-8, 106; không file nào trong 9 file đính kèm gọi `getLastPhoto`. ✅ (Lux: chỉ còn hook DEV main.ts:2643) | Cần kiểm chứng chéo: grep `getLastPhoto` toàn repo | Không có nơi dùng thì xóa biến, hàm và phép gán |
| 6 | photo.ts | Giả định `<a download>` với data URL luôn lưu được; toast "Đã lưu" hiện vô điều kiện | 107-113 | Người dùng iOS hoặc webview Zalo/Facebook có thể được báo đã lưu nhưng không có file | Chỉ nêu quan sát; cần thử trên thiết bị thật trước R4 |
| 7 | beads.ts | Hai cờ trạng thái thừa: `waiting` chỉ true khi `finished` đã true; `started` tương đương `n > 0` | `waiting`: 48, 77, 82, 93, 108. `started`: 46, 94-95, 108. ✅ | Rất thấp, chứng minh được ngay trong file | Xóa `waiting`; thay `started` bằng kiểm tra `n === 0` |
| 8 | beads.ts | Bỏ qua ack `beads:start`; mọi lỗi `beads:done` đều báo "lần chậm rãi" dù nguyên nhân khác | 96 (callback rỗng), 85 (không đọc `r.error`). ✅ | Rớt mạng giữa vòng thì mất 108 lần chạm và bị báo sai lý do. Cần kiểm chứng chéo: server giữ trạng thái start thế nào | Hiện `r?.error` nếu có |
| 9 | beads.ts | Luật thưởng gõ cứng ở client, một phần lấy từ ack, một phần không | 7 (`DAILY_CAP`), 86 ("+5 xu" cứng, merit từ ack), 128 | Lệch chữ khi server đổi luật. Cần kiểm chứng chéo: `shared/game` có hằng số tương ứng không | Dùng hằng số chung nếu đã có |
| 10 | mail.ts | Toast nhận quà tự ghép chuỗi, trùng `giftText`; quà chỉ có vật phẩm sẽ hiện "+0" hoặc "+undefined" | 140-141 so với 22-28 (đã bỏ qua mục rỗng). ✅ | Thấp. Cần kiểm chứng chéo: `MailAck` có khớp dạng `MailGift` không | Dùng lại `giftText`, bỏ dòng 140 |
| 11 | mail.ts | Logic "đã nhận" dựa vào regex trên câu lỗi tiếng Việt của server | 143. ✅ | Server đổi câu chữ thì nút "Nhận quà" bật lại và báo lỗi lặp; không mất dữ liệu | Cần kiểm chứng chéo: ack có cờ nào dùng thay được không |
| 12 | mail.ts | Người nhận quà là socket id chụp lúc mở form; `<select>` chỉ hiện tên, trùng tên không phân biệt được | 54, 77, 94 | Người nhận kết nối lại thì id đổi, gửi lỗi; có thể gửi nhầm người | Chỉ nêu quan sát. Cần kiểm chứng chéo: server xử lý id cũ thế nào |
| 13 | profile.ts | `stats:get` bỏ kết quả ack; cache chỉ đổi nếu server tự đẩy `stats` | 104; stats.ts:66-68 mới ghi cache từ ack | Cần kiểm chứng chéo: server có emit `stats` kèm `stats:get` không | Có đẩy thì xóa dòng 104; không thì nó vô tác dụng, cũng xóa |
| 14 | profile.ts | Gõ cứng "/24" dù đã import `TITLES`; kiểm tra độ dài 200 không chạy tới được | 70; 44 (đã có `maxlength` ở 37 và `trim`) | Rất thấp | Dùng `TITLES.length`; xóa dòng 44 |
| 15 | fortune, beads, spin, checkin, mail | Emit chờ ack không có timeout; mất kết nối thì nút khóa hoặc "Đang tải..." treo | fortune 42-52; beads 79-89; spin 59-60, 69-71; checkin 59-60; mail 156-157 | Trung bình: mạng di động, host đang chuyển đổi | Mở khóa nút khi socket `disconnect`. Cần kiểm chứng chéo: cách xử lý reconnect ở file gọi. Cùng họ khu vực 9 (#2). |

**4 câu hỏi (khu vực 8):** (1) Xóa được chắc chắn (chứng minh trong file): beads.ts cờ `waiting` (48, 77, 82, 93, 108); profile.ts dòng 44; character.ts gán `value` hai lần (15 và 16), bỏ một. Gần chắc, cần grep chéo: photo.ts `photo-mode` (80, 87, 92); photo.ts `lastPhoto` và `getLastPhoto` (4-8, 106) — Lux: chỉ còn hook DEV; profile.ts dòng 104; spin.ts `spinDone` (10) — ⚠️ Lux: CÒN DÙNG (games.ts), giữ lại. Chỉ kiểm tra từ khóa `export`: `giftText` (mail.ts:22) và `COLORS` (character.ts:7) — Lux: cả hai đều có nơi dùng. Nút có thể chết: spin.ts:101 luôn vẽ nút "← Trò chơi" dù `back` là tùy chọn (37) — cần kiểm chứng chéo mọi nơi gọi có truyền `back` không. (2) Phức tạp thừa: không bị trừu tượng hóa thừa. Chỉ có ba chỗ nhỏ: photo.ts đường ống async hai lần mã hóa (mục 3); stats.ts `onChange` một chỗ chứa, tự hủy đăng ký (6, 64-65), hơi vòng vèo nhưng chấp nhận được; fortune.ts mảng `timers` (14, 57) cho đúng một timer. Mẫu `initX`/`xPending`/`onChange` lặp ở 4 file (mail, checkin, spin, beads), mỗi nơi ~8 dòng — nên giữ nguyên, gộp lại sẽ thêm trừu tượng không đáng. (3) Giả định yếu: ack luôn về (mục 15); phiên không vắt qua 07:00 (mục 2; chấm đỏ ở beads.ts:14-17 và checkin.ts:9 cũng dựa vào server tự đẩy lại); không có event `profile` khi đang gõ (mục 1); tải ảnh bằng data URL chạy trên mọi trình duyệt di động (mục 6); người nhận quà đang cùng phòng và tên không trùng (mục 12); câu lỗi server không đổi (mục 11); lưu nhân vật luôn thành công — character.ts:62-64 báo "Đã lưu" ngay, không chờ ack (cần kiểm chứng chéo `changeLook`); máy yếu chịu được WebGL context thứ hai có antialias và pixelRatio 2 (character.ts:25-26), đã có try/catch dự phòng ở 32; thứ tự dữ liệu vòng quay — ô cuối là jackpot (spin.ts:21) và "có cả merit lẫn coins" nghĩa là ĐẠI CÁT (28), cần kiểm chứng chéo `SPIN_SEGMENTS`; điểm danh đúng 7 ngày — checkin.ts:24 và 32 gõ cứng số 7. (4) Đơn giản hóa tiếp: photo.ts sau mục 3-5, `takePhoto` thành hàm đồng bộ, bỏ được cả cờ `busy` (3, 78-79, 117); beads.ts sau mục 7, trạng thái chỉ còn `n` và `finished`; profile.ts — style inline dài (37, 39, 41, 59-83) có thể thay bằng class `gold`/`hint` mà các file khác đang dùng, nút vàng lặp ở 41 và 83, literal stats mặc định trùng stats.ts:32 (profile.ts:34); chuỗi luật chơi "07:00 giờ Việt Nam" lặp ở checkin.ts:54 và spin.ts:103; tên thương hiệu lệch (chỉ nêu quan sát): fortune.ts:9 và photo.ts:17 dùng "Chùa Online"/`chua-online-`, còn photo.ts:33 dùng "Chùa 24/7" — ✅ Lux xác nhận.

**Top 3 khu vực 8:** (1) profile.ts — vẽ lại panel làm mất nội dung đang gõ (mục 1). (2) spin.ts — cache chặn lượt quay sau 07:00 (mục 2). (3) photo.ts — dọn code chết và đường ống hai lần mã hóa (mục 3-5).

## Khu vực 9/12 — Features đợt 2 + menu/panel (`src/features/`: games, festivals, boost, levels, install, settings, misc, map; `src/menu.ts`, `src/panels.ts`)

**Lux kiểm chứng:** ✅ `donors:get` callback không có guard mở panel
(panels.ts:154-156; mẫu guard `alive` có sẵn ở L205/291). ✅ **Admin-log UI
hard-code "tự tặng… cho bản thân" (panels.ts:479) — SAI đối với dòng grant cho
người khác kể từ khi `admin:grant` cũng ghi log (commit `7a70bf1`), và không
hiển thị `targetName` (có sẵn ở L463).** ✅ Map imports: đếm theo word-boundary
— `AM_CO`, `NHA_TO`, `TANG_XA`, `TRAI_DUONG`, `THIEN_DUONG_PLAT`, `PHONG_CD`
đều 0 lần dùng (chỉ các biến `_PLAT` tương ứng được dùng). ✅ `ly` 0 lần dùng.
✅ Boost `current` chỉ ghi (cả 3 caller đều truyền đối số tường minh,
boost.ts:28-30). ✅ PLACES vs TELEPORT_DEST lệch (Thiền đường −39.5 vs −47;
Vườn Phóng Sinh 28 vs 30). ✅ Ba cách nói giờ reset khác nhau ("giờ UTC"
misc.ts:87, "7h sáng" panels.ts:598, "0h" panels.ts:569). ✅ SW chỉ đăng ký
trong `initMenu` sau login (menu.ts:175-178, hai nhánh gần giống nhau). ✅
Games `left` 1 lần xuất hiện (chết), `k` + `sort(random)` thiên lệch, hack
`_s`. ✅ Levels hard-cap 30 (levels.ts:46). ✅ Menu trùng mục donate
(menu.ts:88-89). ✅ `#logoutBtn` tĩnh ở index.html:130 + logout trong menu
(L93/124). ⚠️ **Sửa kết luận của Fable ở #4:** panel `teacher` CÒN ĐƯỢC MỞ
(main.ts:1300, 1532) — KHÔNG xóa; chỉ re-export `levelOf` (panels.ts:708) là
không có importer — xóa được. ⚠️ `hydrateIcons` KHÔNG phải no-op (có body thật,
icons.ts:59-64) — Fable sai. ✅ `isStandalone`, `daysUntil` đều có nơi dùng
trong file.

| # | Khu vực/file | Vấn đề | Bằng chứng | Rủi ro nếu xóa/sửa | Đề xuất |
|---|---|---|---|---|---|
| 1 | panels.ts — Bảng vinh danh | Callback `donors:get` ghi vào `#panelBody` dùng chung mà không kiểm panel còn mở. Ack về trễ sẽ xóa nội dung panel khác. | 154-156, 179. Nơi khác có guard: `alive` (205, 291), `current` (693, 700). ✅ | Thấp, chỉ thêm guard. | Thêm guard như dòng 291/693. |
| 2 | panels.ts, misc.ts — emit có ack | Giả định server luôn ack. Rớt mạng thì nút khóa vĩnh viễn hoặc "Đang tải..." mãi. | panels 129-135, 154-155, 260-262, 680+693, 697-699; misc 105-109. | Thấp. | Dùng `socket.timeout()` có sẵn của socket.io, hoặc mở lại nút khi quá hạn. Cùng họ khu vực 8 (#15). |
| 3 | panels.ts — hai hệ panel | `openPanel` + `render` + `ctxRef` chạy song song `openCustomPanel`. Chant phải gán thẳng `cleanup`. Có nhánh chết. | 55-57, 78-102 so với 68-77; hack 618; dòng 93 không bao giờ đúng (render chỉ gọi từ 85, 88); 88 liệt kê phủ định 5 kind. | Xóa dòng 93: không rủi ro. Gộp hệ: trung bình, `openPanel`/`refreshPanel` gọi từ file ngoài (cần kiểm chứng chéo). | Xóa 93. Đổi 88 thành `shop/bag/quests`. Sau đó chuyển rank/rooms/chant/teacher sang `openCustomPanel`. |
| 4 | panels.ts — panel `teacher`, re-export | Panel "Sư Thầy" tĩnh, không mở từ menu. `export { levelOf }` re-export lạ từ shared. | 19, 54, 101, 708, 711-732; menu.ts 77-83 chỉ dùng quests/bag/shop/rank/rooms. ⚠️ | Cần kiểm chứng chéo: grep `openPanel('teacher'` và import `levelOf` từ `./panels`. **Lux: `teacher` CÒN ĐƯỢC MỞ (main.ts:1300, 1532) — giữ panel; `levelOf` không có importer — xóa được dòng 708.** | Chỉ xóa dòng 708. |
| 5 | panels.ts — UI quản trị | 315/733 dòng là UI admin nằm chung file panel người chơi. Hai hàm parse trùng nhau. Nhật ký luôn in "tự tặng". | 186-500; 228-234 và 235-241 chỉ khác max; 258 hard-code "1.000.000"; 463 có `id`, `targetName` không hiển thị (479). ✅ | Trung bình vì chạm luồng admin. Không đề xuất xóa. | Chỉ quan sát: tách file riêng, gộp parse thành một hàm có tham số max. **Sửa dòng 479: hiển thị `targetName` thay vì hard-code "tự tặng" — nay đã sai với grant cho người khác.** |
| 6 | menu.ts + misc.ts + settings.ts — mục trùng | "Ủng hộ" trùng nội dung "Góp ý & ủng hộ". "Thoát" có hai nơi. "Facebook" chỉ toast nếu chưa cấu hình. | menu 88-89, 93, 124; misc 111 và 126 cùng gọi `supportBlock()`; settings 29; misc 129. ✅ | Thấp, chỉ UI. `#logoutBtn` và `CONFIG` cần kiểm chứng chéo. | Xóa mục `donate` và `openDonate` (125-127). Cân nhắc bỏ một nút Thoát. |
| 7 | menu.ts — comment cũ, boilerplate | Header là ghi chú tích hợp đợt cũ, lệch `MenuCtx` hiện tại. Sáu dòng tạo dot và năm khối refresh lặp. `run?` tùy chọn thừa. | 1-16 (thiếu `act`, `guideTo`, `takePhoto`); 118-123; 131-140; 69 và 117 (cả 24 def đều có `run`). ⚠️ | Rất thấp. | Xóa hoặc rút comment. Đưa dot vào bảng `{id, pending}`. `hydrateIcons` (179) có vẻ no-op, cần kiểm chứng chéo icons.ts — **Lux: KHÔNG phải no-op (icons.ts:59-64 có body thật), giữ lại.** |
| 8 | menu.ts — đăng ký service worker | Đăng ký SW nằm trong `initMenu`, tức chỉ chạy sau đăng nhập. Hai nhánh cho cùng một việc. | 175-178; dòng 4 "after login (once)". ✅ | Thấp, nhưng liên quan trực tiếp R4. | Rút còn một lệnh `register`. Quan sát cho R4: trang trước đăng nhập chưa có SW. |
| 9 | map.ts — import và field chết | Sáu import không dùng. Field `ly` không dùng. `r` < 5 vô nghĩa khi bấm. | Dòng 1: `AM_CO`, `NHA_TO`, `TANG_XA`, `TRAI_DUONG`, `THIEN_DUONG_PLAT`, `PHONG_CD` không xuất hiện ở 2-142; `ly` dòng 5; 133 `Math.max(p.r, 5)`. ✅ (Lux: đếm word-boundary — cả 6 đều 0 lần dùng) | Không. | Xóa sáu import và `ly`. |
| 10 | map.ts — số ma thuật, vẽ lại | Tọa độ gõ tay dù có hằng layout. Vẽ lại toàn bộ nền mỗi 500ms. Hiệu ứng pulse lấy mẫu 2 lần/giây nên giật. | 17-21, 23-27, 61-66, 72, 79 (có `PLAZA` vẫn gõ `0, 8`); 110-111, 119-121, 127; 107 dựa `slice(1)`. | Thấp. Tọa độ gõ tay có thể cố ý là điểm trước cửa (cần kiểm chứng chéo layout). | Bỏ pulse, hoặc chỉ vẽ nền một lần. |
| 11 | map.ts và panels.ts — hai danh sách điểm đến | `PLACES` và `TELEPORT_DEST` mô tả cùng địa điểm, tọa độ lệch nhau. | map 6-31 so với panels 403-416. Thiền đường: -39.5 (23) so với -47 (414). Vườn Phóng Sinh: 28 (25) so với 30 (413). ✅ | Thấp-trung bình, thuộc UI admin. | Quan sát: dùng chung một bảng dữ liệu, tránh import vòng map↔panels. |
| 12 | boost.ts | Biến `current` chết. Comment nói "mỏ neo server" nhưng đồng hồ máy khách ghi đè sau tối đa 30 giây. | 15, 17-18 (ba lời gọi 28, 29, 30 đều truyền đối số); 26 so với 28-30. ✅ | Xóa `current`: không rủi ro. | Xóa `current`. Chọn một nguồn: server hoặc client. Múi giờ của `meritBoost` cần kiểm chứng chéo shared/time. |
| 13 | games, festivals, misc, panels — số và giờ gõ tay | Thưởng, giới hạn, giờ reset viết cứng trong chữ, dễ lệch server. Ba câu về giờ reset không thống nhất. | games 56, 103; festivals 83-85 (giá lấy hằng, số quả gõ tay); panels 136 (bỏ qua `r.merit`), 146; misc 86; misc 87 "giờ UTC", panels 598 "7h sáng", 569 "0h". ✅ | Thấp, chỉ sửa chữ. Cần kiểm chứng chéo shared/game và server. | Thống nhất một cách nói giờ reset. Lấy số từ hằng shared hoặc từ ack. |
| 14 | festivals.ts — âm lịch | Dùng lịch Trung Quốc của Intl theo múi giờ thiết bị. Tới 400 lần `formatToParts` cho mỗi lễ hằng năm. Điều kiện thừa. | 12 (không có `timeZone`), 27-32; 22 `\|\| m.includes('bis')` trùng regex; boost.ts 10 cho thấy shared/time cũng có `lunarDay`. | Thấp. | Xóa vế thừa dòng 22. Tính 400 ngày một lần rồi tra. Kiểm chứng chéo: có hai bộ tính âm lịch không. |
| 15 | games.ts | Field chết và hack `any`. Xáo bài lệch. Thưởng do client tự báo "đã chơi xong". | `left` (7) không đọc; `k` (67) không dùng; `_s` (82, 88); `sort(random)` 67; emit chỉ gửi tên game (10). ✅ | Xóa field: không rủi ro. | Xóa `left`, `k`. Lưu biểu tượng trong closure thay `_s`. Giới hạn ngày phía server cần kiểm chứng chéo. |

**4 câu hỏi (khu vực 9):** (1) Xóa được đủ bằng chứng ngay trong file: map.ts sáu import + field `ly`; boost.ts biến `current`; panels.ts nhánh chết dòng 93; games.ts `left` (7) và `k` (67); festivals.ts vế `|| m.includes('bis')` (dòng 22); menu.ts comment tích hợp cũ (1-16) và dấu `?` của `run` (69, 117); misc.ts + menu.ts mục "Ủng hộ" (misc 125-127, menu 89). Cần kiểm chứng chéo trước khi xóa: panels.ts panel `teacher` (711-732) — Lux: CÒN DÙNG, giữ; `export { levelOf }` (708) — Lux: không importer, xóa được; menu.ts `hydrateIcons(bar)` (179) — Lux: có body thật, giữ; `id = 'logoutBtn'` (124); các export chưa thấy nơi dùng trong file đính kèm: `isStandalone` (install.ts 4), `daysUntil` (festivals.ts 26), `MenuCtx.act` (menu.ts 55) — Lux: `isStandalone` và `daysUntil` đều có nơi dùng. (2) Phức tạp thừa: hai hệ panel song song trong panels.ts (55-102 so với 68-77), kèm hack `cleanup = stop` ở dòng 618; hai interface ctx gần trùng nhau: `PanelCtx` (panels 8-18) và `MenuCtx` (menu 41-57); UI quản trị 315 dòng nằm chung file panel người chơi (186-500); dot thông báo trong menu.ts viết tay từng dòng (118-123, 131-140); map.ts vẽ lại toàn bộ nền hai lần mỗi giây cho vài chấm người chơi (110-127). (3) Giả định yếu: server luôn ack và ack về trước khi người chơi đổi panel (mục 1, 2); đồng hồ và múi giờ thiết bị đúng giờ Việt Nam, và lịch Trung Quốc của Intl trùng âm lịch Việt (boost.ts 29-30, festivals.ts 12, 27-28); client trung thực khi báo đã chơi xong minigame hay tụng xong (games.ts 10; panels.ts 634, 643-647 dùng timer client); cấp tối đa là 30 (levels.ts 7-8, 46 — ✅ Lux xác nhận hard-cap); người chơi đọc hết changelog: `openNews` dựng DOM cho toàn bộ `NEWS` mỗi lần mở (misc.ts 13-16); 1 xu luôn bằng 1 công đức kể cả khi có boost (panels.ts 136); `takePhoto` có thể vắng: nút "Chụp ảnh" im lặng không làm gì (menu.ts 48, 85). (4) Đơn giản hóa tiếp: gom năm chỗ tự dựng thanh `rtabs` về helper `tabs()` sẵn có ở misc.ts 20-30 (panels 218-226, 531-534, 682-684; settings 16-18); cho `MenuCtx extends PanelCtx`; chuyển rank/rooms/chant sang `openCustomPanel`, khi đó bỏ được `render()`, `ctxRef` và kiểu `Cur`; gộp `parseAmount` và `parseSelfAmount` (panels 228-241); gộp phần tính tiến độ cấp đang lặp ở levels.ts 37-43 và panels.ts 586-595; gộp nội dung "Nội quy" (misc 55-62) với "Lễ nghi" (misc 88-89); gộp hành động "đi tới" đang lặp ở map.ts 134, 136 và misc.ts 40.

**Top 3 khu vực 9:** (1) Race ở Bảng vinh danh và emit không timeout (mục 1, 2). (2) Gói xóa code chết đã đủ bằng chứng trong file (mục 9, 12, 15, dòng 93 của mục 3, comment của mục 7, mục "Ủng hộ" của mục 6). (3) Chữ hiển thị lệch nhau về giờ reset và phần thưởng (mục 13). Gộp hai hệ panel (mục 3) là khoản đơn giản hóa lớn nhất nhưng độ an toàn thấp hơn vì phụ thuộc các lời gọi từ file ngoài.

## Khu vực 10/12 — Client phụ + CSS (`src/market.ts`, `src/animals.ts`, `src/koi.ts`, `src/garden.ts`, `src/vuoncay.ts`, `src/models.ts`, `src/audio.ts`, `src/settings.ts`, `src/config.ts`, `src/post.ts`, `src/couplets.ts`, `src/icons.ts`, `src/style.css`, `src/menu.css`)

**Lux kiểm chứng:** ✅ Audio: `play()` L22 không kiểm `muted`; tắt tiếng chỉ
chỉnh `volume` (L9, L83) — **iOS Safari không cho JS đặt `volume` nên nhạc vẫn
nghe được khi đã tắt tiếng trên iPhone**; một bài lỗi gán `bgm=null` (L17) là
mất nhạc cả phiên. ✅ Hai nguồn trạng thái âm thanh (audio.ts `co:mute`/`vol`
vs settings.ts `sound`/`volume`). ✅ Market nhánh `'chim'`/`'ca'` chết (style
map về `'phongsinh'`). ✅ Animals `mul`: 0 spec nào đặt (nhánh L142/146/158
chết); `makeLabel` chỉ gọi 1 lần với `labelY` tường minh (L216) nên default
`LABEL_Y` 1.0 chết. ✅ `CONFIG` cả 4 giá trị rỗng — nhưng misc.ts xử lý trống
gracefully (hiện "Thông tin ủng hộ sẽ sớm được cập nhật"). ✅ Vuoncay rebuild
key gồm `wateredToday`/`harvestable` (không được render đọc) nhưng thiếu
`progress` (nhãn đọc). ✅ Post composer luôn cấp phát dù disabled
(post.ts:29-35 vs L39). ✅ `[hidden]!important` (style.css:9) làm L68/L96 thừa.
✅ Rule reduced-motion toàn cục `*` (style.css:226) có thể ẩn nội dung marquee/
level-up. ✅ Koi field `a`/`rx`/`rz`/`s` 0 lần đọc (chết). ✅ Couplets `id`
25 lần xuất hiện, 0 lần đọc (chết, trùng key Record).

| Khu vực/file | Vấn đề | Bằng chứng | Rủi ro nếu xóa/sửa | Đề xuất |
|---|---|---|---|---|
| `src/market.ts` | Nhánh hàng hóa `chim`, `ca` không bao giờ chạy | Type L7; `STALL_STYLE` L10-19 không dùng 2 loại này (`stall_chim` → `phongsinh` L18); `addGoods` chỉ gọi ở L189; nhánh chết L114-126. ✅ | Không; `STALL_STYLE` không export | Xóa L114-126 và 2 thành viên type L7 |
| `src/animals.ts` | `Tint.mul`, mặc định `LABEL_Y`, fallback trong `lostAnimal` đều chết | `mul` L22, 142, 146, 158 — tint L32, L37 không đặt; `LABEL_Y` L49, 56 — mọi spec có tên đều `labelY: 1.6` (L31-37); L285 `p` không thể null (L255-256). ✅ | Không | Xóa `mul` và 3 nhánh; gộp `labelY`/`LABEL_Y` thành một hằng 1.6; L285 dùng thẳng `p` |
| `src/style.css`, `src/menu.css` | Rule thừa và selector khai trùng | `[hidden]` `!important` (style L9) làm thừa style L68, L96, menu L158, L190; `.act` L119-120; `.spin-lb` menu L151-152; style L204-205 trùng giá trị L219-220. ✅ | Rất thấp; soi lại bằng ảnh nghiệm thu mobile | Xóa 4 rule `[hidden]` và L204-205; gộp selector trùng |
| `src/config.ts` | Cả 4 giá trị cấu hình đều rỗng | L3-6; phần có vẻ phụ thuộc: menu.css L46-47 (`.donate`, `.qr`), icons.ts L50-51. ✅ (Lux: misc.ts xử lý trống — hiện "Thông tin ủng hộ sẽ sớm được cập nhật") | Xóa nhầm nếu chủ dự án sắp điền link thật | Cần kiểm chứng chéo nơi đọc `CONFIG`; điền giá trị thật hoặc xóa cả nhánh UI phụ thuộc |
| `src/style.css` | Fallback cho trường hợp "menu.css chưa nạp" | L237-239; menu.css thực tế chứa cả panel và minigame (L35-190), không riêng menu | Nếu menu.css nạp trễ thật, thanh menu lệch chốc lát | Cần kiểm chứng chéo cách nạp 2 file CSS; nếu cùng bundle thì xóa fallback |
| `src/models.ts` | Hai loader gần trùng nhau; HEAD dò trước mỗi GET | `loadOnce` L26-38 so với `loadGltf` L67-87; 2 cache L6, L60; HEAD L28, L70; retry chỉ có ở `loadModel` L24, L40-46 | Trung bình: mọi model đi qua đây. Bỏ HEAD thì file thiếu sẽ tải HTML rồi parse lỗi (vẫn bị catch L35) | `loadModel` = `loadGltf().scene`, một cache, một retry; cân nhắc bỏ HEAD |
| `src/animals.ts` | Trừu tượng thừa khi chọn clip và tint | `candidates()` luôn trả mảng 1 phần tử (L180-184) nhưng L189 vẫn map/find hai tầng; `tintTexture` phòng video/tainted (L89-109) cho đúng 2 spec tint | Thấp; tint vertex color L158-174 cần kiểm chứng chéo với GLB | Trả về string; rút gọn guard ảnh |
| `src/vuoncay.ts` | Key dựng lại cây không khớp dữ liệu thật sự vẽ | Key L328 có `wateredToday`, `harvestable` nhưng L362-393 không đọc; nhãn dùng `progress` (L253) mà key bỏ `progress` (chú thích L319-320). ✅ | Thấp; nhãn "Cần tưới/Đang lớn" có thể hiển thị cũ | Key chỉ gồm trường được vẽ; cần kiểm chứng chéo ngữ nghĩa `progress` |
| `src/vuoncay.ts` | Collider động của cây lớn chồng lên luống đã rào kín | 4 line collider mỗi luống L152-157; collider cây r=1.0 L388-392, gỡ L356-360, state L230, L232; pathfinder dựng một lần (garden.ts L123) | Người chơi đứng sát cây hơn khoảng 0,3 m | Xóa `treeCols`/`dynColliders`; cần kiểm chứng chéo pathfinder trước |
| `src/audio.ts` | Nhạc nền vẫn phát khi tắt tiếng; một bài lỗi là mất nhạc cả phiên | L22 `play()` không kiểm `muted` (khác L18, L84); tắt tiếng chỉ chỉnh `volume` (L9, L83); L17 gán null, `startBgm` chỉ gọi một lần (L107-109). ✅ | Thấp, gói trong 1 file | Tắt tiếng thì `pause()`; lỗi thì chuyển bài kế. Cần thử trên iPhone thật (iOS không cho JS đặt `volume`) |
| `src/audio.ts`, `src/settings.ts` | Hai nguồn trạng thái âm thanh | audio.ts: `co:mute` L4, `vol = 1` L6; settings.ts: `sound`, `volume` 0.8 ở L3-4, L12, L19-20. ✅ | Đổi key localStorage làm mất lựa chọn tắt tiếng đã lưu (chỉ phía máy khách) | Cần kiểm chứng chéo nơi đồng bộ; giữ một nguồn (settings) |
| `src/style.css` | Rule reduced-motion toàn cục làm mất nội dung | L226 ép duration .01ms cho `*`: marquee L63 lặp vô hạn nên nhấp nháy; L70, L133, L136/140 kết thúc ngay ở trạng thái ẩn. ✅ | Thấp | Chỉ áp cho hiệu ứng trang trí; marquee và level-up cần trạng thái tĩnh nhìn thấy được |
| `src/garden.ts`, `src/market.ts`, `src/vuoncay.ts`, `src/animals.ts` | Giả định GLB luôn tải được | Collider thêm trước khi có model: garden L124 so với L130-133; market L22-23 so với L206. Cây lỗi bị bỏ (vuoncay L376) nhưng key vẫn lưu (L329); thú không retry (animals L205) | Thấp | Một chính sách retry chung sau khi gộp loader; không lưu key khi còn cây lỗi |
| `src/vuoncay.ts` | Số luống và mặt đất phẳng viết cứng | "/8" ở L43; y tuyệt đối 0 ở cổng L117, luống L147-151, giếng L163-183, trong khi rào và cây dùng `groundY` (L90, L108, L189) | Không | Dùng `GARDEN_PLOTS.length`; cần kiểm chứng chéo `groundY` tại khu vườn |
| `src/post.ts`, `src/settings.ts`, `src/style.css` | Giả định về thiết bị | Chất lượng mặc định theo `pointer: coarse` (settings L12); composer và target HalfFloat MSAA luôn cấp phát dù `enabled=false` (post L29-35, L39); `backdrop-filter` phủ canvas (style L15, 26, 120, 172, 228). ✅ | Trung bình: đổi mặc định ảnh hưởng hình ảnh | Chỉ tạo composer khi bật; cần kiểm chứng chéo cách `quality` bật/tắt post |

**4 câu hỏi (khu vực 10):** (1) Xóa được chắc chắn (bằng chứng nằm trọn trong file): `market.ts` L114-126 cùng `'chim' | 'ca'` ở L7; `animals.ts`: `Tint.mul` (L22, 142, 146, 158), `LABEL_Y` (L49, 56), ternary ở L285; CSS: style L68, L96, L204-205; menu L158, L190. Chỉ xóa sau khi kiểm chứng chéo: `config.ts` cùng UI phụ thuộc; fallback `:where(#menu)` ở style L237-239; CSS minigame lật thẻ (menu L61-69) và vòng quay (menu L148-161) — hai tính năng này không có trong danh sách gameplay ở phần bối cảnh; các trường `a/rx/rz/s` của `Koi` (koi.ts L25-30, L215) — ✅ Lux: 0 lần đọc, xóa được; trường `id` trong `couplets.ts` — ✅ Lux: 25 lần xuất hiện, 0 lần đọc, xóa được. (2) Phức tạp thừa: `models.ts` hai loader, hai cache, HEAD dò trước — lưu ý cho R4: Cache API của service worker chỉ lưu GET, nên HEAD dò trước sẽ không được phục vụ từ cache; `vuoncay.ts` hàng đợi `treeRenderBusy`/`pendingStates`/`takePending` (L234-235, L315-335) cộng collider động, cho 8 luống; `animals.ts` `candidates()` trả mảng cho một giá trị, `tintTexture` phòng thủ quá mức cho 2 spec; `koi.ts` tham số 3 loại vây nhưng `dorsal` và `pectoral` xử lý y hệt nhau (L124-126). (3) Giả định yếu: thiết bị — `bgm.volume` có hiệu lực trên mọi máy (audio L9), cảm ứng nghĩa là máy yếu, chuột nghĩa là máy mạnh (settings L12), blur phủ WebGL không tốn kém; mạng — cả 4 file MP3 `preload='auto'` đều tải được (audio L10, L15, L17), mọi GLB tải xong trong 3 lần thử/7 giây (models L24); người dùng — không ai bật Reduce Motion (style L226); bố cục — `#donateMarquee` (top 146, L67) và `#medBanner` (top 142, L93) cùng căn giữa, sẽ đè nhau trên desktop nếu hiện cùng lúc; con số 438px (L176-182) phụ thuộc chiều cao `#lanternFeed`; dữ liệu dùng chung — luôn có 8 luống (vuoncay L43), mọi stall trong `MARKET_STALLS` đều có style (market L22-23 so với L206). (4) Đơn giản hóa tiếp: `animals.ts` bỏ `mul` thì `applyTint` hết rẽ nhánh ở L146 và L158; `style.css` bỏ L204-205 thì L260-261 không cần selector `body.touch` nữa; `garden.ts` sau khi gộp loader, `.catch` ở L139-141 gần như thừa vì `loadModel` không reject (models L35-37) — nó chỉ bắt lỗi của `buildInstance`, với thông báo sai nghĩa; `audio.ts` vòng tạo nhiễu lặp hai lần (L59-62 và L112-115), gộp thành một hàm; `koi.ts` cache geometry vây và material da theo giống, như `bodyGeo` đã làm (L156, 191, 200, 208); `menu.css` hai khối media L19 và L29 gần giống nhau, gộp điều kiện như style.css L186; `garden.ts` `toToon` chạy lại cho từng bản clone (L92) — chuyển thành một lần mỗi model, cần kiểm chứng chéo xem `toon()` có cache không.

**Top 3 khu vực 10:** (1) `audio.ts` — nhạc nền không tuân theo tắt tiếng và chết hẳn khi một bài lỗi (L17, L22, L79-85). (2) Lô code chết đã chứng minh trong file (`market.ts` L114-126; `animals.ts` `mul`/`LABEL_Y`/L285; 6 rule CSS thừa). (3) `models.ts` — gộp hai loader, cân nhắc bỏ HEAD dò trước (L26-38, L67-87); gỡ trước một vướng mắc cho PWA ở R4.

## Khu vực 11/12 — Shared + dữ liệu quẻ/lễ + cấu hình deploy (`shared/game.ts`, `shared/time.ts`, `shared/pathfind.ts`, `shared/roads.ts`, `shared/types.ts`, `src/data/festivals.ts`, `src/data/fortunes.ts`, `public/sw.js`, `public/manifest.webmanifest`, `index.html`, `package.json`, `tsconfig.json`, `render.yaml`, `fly.toml`, `Dockerfile`, `.github/workflows/deploy-fly.yml`)

**Lux kiểm chứng:** ✅ Hai pipeline (render.yaml: branch main + Turso env;
fly.toml: local SQLite `DB_FILE=/data/chuaonline.db`; deploy-fly.yml:
`setup-flyctl@master` không ghim, không có `concurrency`). ✅ **ITEMS mô tả sai
dưới ngữ nghĩa max** — server làm `merit = Math.max(merit, boost.boostMerit)`
(index.ts:523, 584): nến sáp ong mô tả "7 công đức" nhưng boostMerit 5 (thực
tế 5, không phải 7), hoa dâng Phật mô tả "8" nhưng boostMerit 4 (thực tế 4),
và **tràng hạt 108 (30 xu, boostMerit 2) bằng đúng merit gốc của tụng kinh 2
→ không lợi gì**. ✅ SUTRAS: "Bồ Đề Tát Đề" phải là "Tát Đỏa" (game.ts:190);
Niệm Phật đếm 107, không phải 108 (game.ts:233-234: 2 dòng đầu + 106 vòng lặp).
✅ `reps` luôn bằng 1 NHƯNG ĐƯỢC ĐỌC ở panels.ts — KHÔNG chết, giữ lại. ✅
Pathfind nhánh chuẩn hóa phòng thủ chết (pathfind.ts:113-125). ⚠️ **Sửa kết
luận của Fable ở #6:** `roadPath` chết thật (0 người dùng ngoài roads.ts,
L225–~267) NHƯNG `roadRoute`/`nearestNode`/`routeFrom` đều được dùng — "xóa 97
dòng" là nói quá, chỉ `roadPath` (~43 dòng) là chết; vấn đề thật là hai
Dijkstra song song khác hành vi. ✅ `weekKey` dùng UTC trong khi `dayKeyICT`
dùng ICT (time.ts:22-29 vs 16-19), tuần không đệm 0 (`W5` thay vì `W05`). ✅
sw.js handler navigate cache không kiểm `res.ok` (không đối xứng với nhánh
assets). ✅ index.html ghi "Chùa Online" ở 4 chỗ (L12/14/24/69),
apple-touch-icon là SVG (L9 — iOS không nhận), menu tĩnh L124-131 giữ
`#questDot`/`#logoutBtn` sống. ✅ Manifest tên "Chùa Online", chỉ có icon SVG.
✅ `defaultTitle` = phần tử cuối cùng được trao (game.ts:537-538). ✅ festivals
field `monthly` không dùng; lễ Địa Tạng 30/7 không tồn tại ở tháng âm thiếu.
✅ Fortunes comment L62 ghi "Thượng thượng (10 quẻ)" nhưng số thật là 11
(Lux đã đếm: 11/13/9); 3 quẻ đầu nằm ngoài nhóm (L20-61); server trả chỉ số
mảng `n` (thứ tự là giao thức). ✅ `.dockerignore` ĐÃ loại `shots/`, `tools/`,
`data/`, `node_modules`, `dist`, `.env`, các file `.glb` lớn — lo ngại của
Fable về `COPY . .` kéo shots/tools vào image ĐÃ ĐƯỢC GIẢI QUYẾT (không sao).
⚠️ `return 0` ở game.ts:534 là fallback exhaustiveness của TS (switch đủ 4
kind), không đáng xóa — bỏ qua.

| # | Khu vực/file | Vấn đề | Bằng chứng | Rủi ro nếu xóa/sửa | Đề xuất |
|---|---|---|---|---|---|
| 1 | `render.yaml` + `deploy-fly.yml` + `fly.toml` | Hai pipeline cùng nhánh `main` trỏ hai DB khác nhau; mỗi push có thể đưa code mới lên cả hai. | `render.yaml:7` (`branch: main`), `:16-19` (Turso); `deploy-fly.yml:5-6`; `fly.toml:19-20` (SQLite). ✅ | Xóa `render.yaml` lúc này làm mất cấu hình duy nhất trỏ tới Turso. | Kiểm chứng chéo dashboard Render (auto-deploy còn bật không). Chỉ xóa `render.yaml` sau khi chủ dự án chốt host. |
| 2 | `shared/game.ts` ITEMS | Mô tả vật phẩm lệch `boostMerit`; Tràng hạt 108 giá 30 xu có thể không lợi gì. | `:63` ghi "7", số là 5; `:64` ghi "8", số là 4; `:82` boost 2 bằng chant gốc `:7`. ✅ (Lux: server dùng `Math.max` — index.ts:523, 584 — nên boost THAY THẾ chứ không cộng thêm; tràng hạt 108 cho đúng 0 lợi ích) | Sửa số đổi cân bằng; sửa chữ thì an toàn. | Sửa mô tả cho khớp số. Quyết lại boost của tràng hạt (tăng boostMerit hoặc hạ giá). |
| 3 | `shared/game.ts` SUTRAS | "Niệm Phật 108 lần" chỉ sinh 107 câu; Tâm Kinh ghi "Bồ Đề Tát Đề" (chuẩn: Tát Đỏa); `reps` luôn bằng 1. | `:233` có 1 câu, vòng `:234` thêm 106; `:190`; `reps` ở `:176, :202, :231`. ✅ | Thấp. Cần kiểm chứng chéo nếu client/quest đếm theo `lines.length`. | Sửa vòng lặp và chính tả. **`reps` ĐƯỢC ĐỌC ở panels.ts — giữ lại, không xóa.** |
| 4 | `shared/pathfind.ts` | Nhánh chuẩn hóa "phòng thủ" cho node/edge không bao giờ chạy. | `:113-125` (`as unknown as any[]`, `e.a ?? e.from`, `typeof v === 'number'`); kiểu đã chặt ở `roads.ts:28-32, :165`. ✅ | Rất thấp. | Xóa các nhánh thay thế, dùng thẳng `id` và tuple. |
| 5 | `shared/pathfind.ts` | Ba bản sao vòng quét lưới; `blockers` trả 12 phần tử nhưng chỉ dùng `bl[0]`; sort hai lần. | `:59-81` ≡ `:89-111` (chỉ khác `:76` và `:106`); `:221-251`; `:259-269`; sort `:249` và `:264`; comment `:220` lỗi thời | Trung bình: heuristic nhạy, cần chạy lại harness lưới 441 (nhắc ở `:467`). | Gộp một hàm quét có tham số clearance; `blockers` trả vật cản gần nhất. |
| 6 | `shared/roads.ts` | Dijkstra thứ hai song song với `planRoute`; hai bản khác hành vi (pathfind loại cạnh vướng, roads thì không). | `roads.ts:210-306`; `pathfind.ts:1` chỉ import dữ liệu; `pathfind.ts:126-129, :331-343`. ⚠️ | Nếu server/NPC đang dùng thì không xóa được. **Lux: `roadRoute`/`nearestNode`/`routeFrom` đều được dùng — chỉ `roadPath` (L225–~267, ~43 dòng) là chết; "xóa 97 dòng" là nói quá.** | Xóa `roadPath` nếu không ai dùng ngoài file. Vấn đề thật là hai Dijkstra khác hành vi — cho hai bên chung một Dijkstra. |
| 7 | `shared/pathfind.ts` | Hằng số chép tay "phải khớp" file khác, cộng nhiều ngưỡng ma thuật vá theo từng lỗi. | `:10-11` (`main.ts`); `:137-139` (`layout.ts`); `types.ts:68` trùng `WALL_ZN`; ngưỡng ở `:269, :483, :494` | Lệch âm thầm khi đổi bản đồ; không có gì báo lỗi. | Gom `CLEARANCE`/`WALL` về một nguồn trong `shared/` (cần kiểm chứng chéo `layout.ts`, `main.ts`). |
| 8 | `shared/time.ts` `weekKey` | Tuần tính theo UTC, ngày theo ICT, nên tuần reset 07:00 thứ Hai giờ VN; có bản sao ở server; số tuần không đệm 0. | `:22-29` so với `:16-19`; comment `:21`; `:28`; `game.ts:152`. ✅ | Cao: đổi công thức hoặc định dạng là đổi `week_key` đã lưu. | Không sửa định dạng. Chỉ gộp hai bản sao về một (cần kiểm chứng chéo `server/db.ts`). Cùng họ khu vực 1 (#11). |
| 9 | `shared/game.ts` NPC_QUESTS | Quest `nq_`/`dq_` trùng nội dung; `event` lệch `steps` (có chỗ `'buy'` không nằm trong steps). | `:281-282` ≡ `:323`; `:283-284` ≡ `:324`; `:310` ≡ `:327`; points `:268` ≡ `:322`; `event` ở `:310-312, :327-328` | Xóa quest làm mồ côi tiến độ đã lưu. | Không xóa id. Cần kiểm chứng chéo server có bỏ qua `event` khi có `steps` không, rồi thống nhất `event = steps[0]`. |
| 10 | `shared/game.ts` mốc + danh hiệu | Hai hệ thưởng trên cùng stat, hai kiểu khóa (snake và camel); `q26` hard-code theo số `nq_` cũ. | `:461` so với `:487`; ngưỡng trùng `:464/:509`, `:467/:505`, `:468/:506`, `:470/:510`, `:477/:511`, `:474/:512`; `:501` (26 `nq_` ở `:267-315`) | Danh hiệu và mốc đã trao nằm trong DB, không xóa được. | Giữ mọi id. Chỉ thống nhất kiểu khóa stat trong code, không đụng schema. |
| 11 | `src/data/festivals.ts` | Field `monthly` không mục nào dùng; lễ 30/7 âm không tồn tại ở tháng thiếu; không có cờ tháng nhuận. | `:6` so với `:10-22`; `:18`; `time.ts:31` có `leap`. ✅ | Thấp. | Xóa `monthly` cùng nhánh đọc nó (cần kiểm chứng chéo nơi dùng). Kiểm chứng chéo cách so khớp tháng nhuận. |
| 12 | `src/data/fortunes.ts` | Server trả chỉ số mảng `n`; kiểu giao thức nằm trong `src/data`; 3 quẻ đầu nằm ngoài nhóm. | `:11-17`; `:20-61` so với comment `:62, :203, :372`. ✅ (Lux: comment L62 ghi "10 quẻ" nhưng số thật là 11 — comment lệch) | Xóa hoặc sắp lại quẻ sẽ đổi nghĩa `n` đã lưu trong ngày. | Không sắp xếp lại, chỉ thêm cuối. Cần kiểm chứng chéo server lấy số quẻ (33) từ đâu. |
| 13 | `public/sw.js` | Mọi navigation ghi đè khóa `'/'` kể cả phản hồi lỗi; cache không đổi phiên bản nên bundle cũ tích lũy; icon không cập nhật. | `:13` (không kiểm `res.ok`, khác `:17`); `:2`; `:16-17`; `index.html` không đăng ký SW. ✅ | Thấp. | Cần kiểm chứng chéo `main.ts` có đăng ký SW không (Lux: chỉ menu.ts đăng ký, sau login — khu vực 9 #8). Trước R4: thêm `res.ok`, chỉ cache đúng pathname `/`. |
| 14 | `index.html` + `manifest.webmanifest` | Tên "Chùa Online" lệch tên game "Chùa 24/7"; menu tĩnh bị JS dựng lại; icon iOS là SVG (iOS không nhận). | `index.html:12, :14, :24, :69`; `manifest:2-3`; `fly.toml:10`; `index.html:123-131`; `:9`. ✅ | Xóa menu tĩnh có thể mất `#questDot`, `#logoutBtn`. | Chốt tên trước R4. Xóa `:124-131` sau khi kiểm chứng chéo `menu.ts` tự tạo đủ id. |
| 15 | `fly.toml` + `deploy-fly.yml` | Một máy gắn volume, mỗi push `src/**` là restart và ngắt socket; không có `concurrency`; action `@master`; comment nhắc Turso sai bối cảnh. | `fly.toml:22-27, :42-44`; `:34` trái `:19`; `deploy-fly.yml:5-19, :27`. ✅ | Thấp (chỉ cấu hình). | Sửa comment `:34`. Thêm khóa `concurrency`, ghim phiên bản action. |

**4 câu hỏi (khu vực 11):** (1) Xóa được đủ bằng chứng trong file đính kèm: nhánh chuẩn hóa ở `pathfind.ts:113-125` (#4); sort thừa `pathfind.ts:264` và comment sai `:220` (#5); `return 0` không tới được ở `game.ts:534` — ⚠️ Lux: đây là fallback exhaustiveness của TS, không đáng xóa; nhánh ba ngôi chết ở `roads.ts:305` (`out` luôn có ít nhất 1 phần tử); comment `fly.toml:34`. Cần kiểm chứng chéo trước khi xóa: `roads.ts:210-306` (#6) — Lux: chỉ `roadPath` chết; `Festival.monthly` (#11) và `Sutra.reps` (#3) — Lux: `reps` còn dùng, giữ; menu tĩnh `index.html:124-131` (#14); `GardenPlotState.wateredToday` ở `game.ts:400` — sót từ mô hình tưới theo ngày, nay đã có `waterCooldownMs` ở `:402` (xem khu vực 2 #4); `sw.js`, nếu `main.ts` không đăng ký. Chưa xóa: `render.yaml`, chờ chủ dự án quyết host (#1). (2) Phức tạp thừa: `pathfind.ts` chồng 6 chiến lược (`tangentDetour` đệ quy sâu 6, Dijkstra, `escapePoint`, `startExitPoint`/`endEntryPoint`, ngoại lệ cầu, ngoại lệ cửa nhà — `:256-512`); không đề xuất viết lại, chỉ gộp phần trùng (#5); hai đoạn "tìm node tới được gần nhất" giống nhau ở `pathfind.ts:345-354` và `:378-386`; `endsAt` và `endsAt2` giống hệt ở `:364` và `:389`; hai hệ mốc/danh hiệu trên cùng stat (#10); 13 tab cửa hàng cho khoảng 45 món, có 3 tab chỉ 1 món: `may` (`game.ts:97`), `dieu` (`:102`), `do_linh_thu` (`:104`); service worker giữ shell offline cho một game bắt buộc online (`sw.js:13`). (3) Giả định yếu: số người chơi — 3 phòng × 60 chỗ = 180 cho khoảng 72 tài khoản (`game.ts:420-425`), làm loãng người chơi; thiền nhóm cần 3 người cùng lúc (`:428`); thời gian — tuần theo UTC, ngày theo ICT (#8), lễ 30/7 và tháng nhuận (#11); thứ tự mảng là bất biến — chỉ số quẻ (#12), `defaultTitle` coi phần tử cuối là "cao nhất" (`game.ts:537-538`), nên người cấp 28 có thể mặc định đeo danh hiệu thắp hương; đồng bộ thủ công giữa các file — #7, và giá hạt giống khai hai nơi (`game.ts:110-112` và `:356-358`); deploy — push nào cũng an toàn cho người đang chơi (#15), thiếu biến Turso thì server âm thầm rơi về file local (`render.yaml:15`, `fly.toml:19`; cần kiểm chứng chéo `server/`); Docker — `COPY . .` ở `Dockerfile:9` có thể kéo cả `shots/` và `tools/` vào image — ✅ Lux: `.dockerignore` ĐÃ loại chúng, không sao; thiết bị — iOS không nhận icon SVG (`index.html:9`). (4) Đơn giản hóa tiếp: `pathfind.ts` một hàm quét lưới, một helper node tới được gần nhất, một `endsAt` — ước giảm 60–80 dòng; nếu `roads.ts:210-306` còn dùng: cho hai bên chung một Dijkstra; `GARDEN_SEEDS.price` lấy từ `ITEM_BY_ID` thay vì khai lại; thống nhất kiểu khóa stat (#10) và quy ước `event`/`steps` (#9); gộp `weekKey` về một bản (#8); tự động hóa (ưu tiên thấp nhất): chạy một lần `tsc --noEmit --noUnusedLocals --noUnusedParameters` để dò code chết ở phần chưa audit — `tsconfig.json:2-11` hiện không bật hai cờ này.

**Top 3 khu vực 11:** (1) #1 — Hai pipeline cùng `main`, hai DB. (2) #2 và #3 — Nội dung sai mà người chơi nhìn thấy (3 vật phẩm mô tả lệch, 107 câu thay vì 108, sai chữ trong Tâm Kinh). (3) #4, #5, #6 — Dọn `pathfind.ts` và `roads.ts` (riêng #6 chờ kiểm chứng chéo — Lux đã làm: chỉ `roadPath` chết). Nếu `main.ts` đã đăng ký service worker thì #13 phải sửa trước khi bắt đầu R4.

## Khu vực 12/12 — Dữ liệu thoại + tin tức (`src/data/dialogues.ts`, `src/data/news.ts`)

**Lux kiểm chứng:** ✅ Tin quản trị hiện công khai (news.ts:122-131 tự tặng
"1.000.000", 214-222 bảng quản trị, 223-231 camera quản trị) — đây là mục cần
quyết định, không phải lỗi rõ ràng. ✅ Thoại npc38 lỗi thời ("20 phút/5 phút/ít
xu", dialogues.ts:888/900/902, vs news.ts:253-254 "45 phút/15 phút/không xu cây
thường"). ✅ Ghi chú dev/QA trong tin cho người chơi (L238 "nhắn lại", L272 tọa
độ, L146/L46/L183 ghi chú QA, L374/L1047/L700/L237 thuật ngữ kỹ thuật). ✅ Ngày
tin không đơn điệu (L863 11-13 kẹp giữa các mục 11-14; L898 11-13). ✅ npc1
trùng thoại quest (L49-51 ≈ L100-102, L54-56 ≈ L105-107, có dòng giống hệt).
✅ `TimeSlot 'any'` dùng đúng 1 lần (L1038). ✅ npc30/npc34 thoại shop gần
giống hệt. ⚠️ **Sửa kết luận của Fable ở #5/#6:** LATEST 129 vs 131 mục là
**quirk offset-2 đã biết và có tài liệu** (2 mục cũ nhất không được đếm), KHÔNG
phải lỗi — quy tắc "mục mới = LATEST+1" vẫn đúng. Vấn đề thật (nhỏ) chỉ là hằng
số bump tay và thiếu id riêng từng mục. **Cắt NEWS (#6) sẽ làm lệch ID vị trí
— KHÔNG cắt khi chưa thêm id ổn định.**

| # | Khu vực/file | Vấn đề | Bằng chứng | Rủi ro nếu xóa/sửa | Đề xuất |
|---|---|---|---|---|---|
| 1 | dialogues.ts npc38 | Thoại mô tả cơ chế vườn cũ: "20 phút", "5 phút mỗi giai đoạn", thu hoạch có "ít xu" | 888, 900, 902 mâu thuẫn news 253–254 (45 phút, tưới 3 lần, cây thường không còn xu). ✅ | Thấp, chỉ là chữ | Xóa con số khỏi thoại, giữ câu chung chung |
| 2 | dialogues.ts npc3, npc8 | Lời giao việc quét tả sai chỗ sau khi dời điểm quét | 186, 195–196 (dưới tán cây, hai đầu cầu) vs news 331 (giữa mặt cầu); 316, 325, 331 vs news 333 (đường chợ) | Thấp | Sửa chữ theo vị trí hiện tại; cần kiểm chứng chéo tọa độ thật |
| 3 | news.ts | Ghi chú dev/agent lọt vào tin cho người chơi | 238 ("nhắn lại"), 272 (tọa độ), 146, 46, 183 (ghi chú QA), 374, 1047, 700, 237 (thuật ngữ kỹ thuật). ✅ | Thấp; giữ dòng giấy phép 110 | Xóa các câu này |
| 4 | news.ts | Tin chỉ dành cho quản trị hiện cho mọi người, gồm "tự thêm 1.000.000 công đức" trong game có bảng vinh danh | 122–131, 214–222, 223–231. ✅ | Thấp, chỉ xóa chữ, không chạm logic admin | Xóa 3 mục khỏi NEWS (hoặc giữ nếu chủ dự án muốn minh bạch — quyết định của chủ dự án) |
| 5 | news.ts | `LATEST_NEWS_ID` gõ tay, lệch số mục; `NewsItem` không có id | Dòng 7 = 129; đếm tay 131 mục (9–1151); interface 1–5. ⚠️ | Trung bình: đổi giá trị có thể bật/tắt badge "tin mới" | **Lux: đây là quirk offset-2 ĐÃ BIẾT (2 mục cũ nhất không đếm), không phải lỗi. Quy tắc "mục mới = LATEST+1" vẫn đúng. Chỉ cần thêm id riêng từng mục khi có dịp.** |
| 6 | news.ts | 131 mục trong 7 ngày, nhiều mục đã bị mục sau phủ định, nằm trong bundle client | 432–433 vs 37, 253; 414 vs 405; 839 vs 783; 584 vs 568; 827 vs 153. ⚠️ | Thấp–trung bình, phụ thuộc #5 | **Lux: KHÔNG cắt khi chưa có id ổn định — ID tin là vị trí trong mảng, cắt mục cũ sẽ lệch ID. Thêm id trước, cắt sau.** |
| 7 | dialogues.ts npc30, npc34 | Hai người bán cùng hàng phóng sinh, thoại gần trùng | 834–862 vs 983–1005; 854≈996, 855≈998; 852 vs 994; news 560 ("gộp thành 1"). ✅ | Cao nếu xóa nhầm: npc30 giữ Q25 + `nq_feed_birds` (842–851) | Chỉ quan sát; cần kiểm chứng chéo npc nào còn spawn |
| 8 | dialogues.ts | Giá và thông số hardcode trong thoại, dễ lệch (đã lệch ở #1) | 852, 898, 922, 946, 970, 994, 1019; 873 ("8 luống") | Thấp | Bỏ con số khỏi `shopGreeting`; cần kiểm chứng chéo giá ở shared/ |
| 9 | dialogues.ts npc1, npc37 | Thoại quest lặp gần nguyên văn | 49–51 ≈ 100–102; 54–56 ≈ 105–107 (51=102, 56=107 y hệt). ✅ | Thấp; cần kiểm chứng chéo `nq_bow_tamthe`, `nq_chant_thienduong` còn trong NPC_QUESTS | Nếu nq_* đã bị dq_* thay thì xóa 48–57 |
| 10 | dialogues.ts interface | Ba field quest bắt buộc nên phải điền `''` hàng loạt | 15–19; 7 NPC rỗng cả ba: 653–655, 676–678, 723–725, 747–749, 770–772, 794–796, 819–821; 476–477 | Trung bình: code đọc có thể so sánh `=== ''` | Đổi thành optional, xóa các dòng `''`; cần kiểm chứng chéo nơi đọc |
| 11 | dialogues.ts `TimeSlot` | Mỗi NPC chỉ có 3/4 khung giờ, không có khung đêm; `'any'` dùng đúng 1 lần | Dòng 1; 1038; thiếu afternoon: 40–42, 215–217; thiếu evening: 160–162 và đa số còn lại. ✅ | Trung bình: phụ thuộc fallback của bộ chọn | Cần kiểm chứng chéo hàm chọn câu chào; nếu fallback đủ thì bỏ `'any'` |
| 12 | dialogues.ts `chanting`, `farewell` | Có thể đã thừa sau "dòng trạng thái" và "chỉ hiện 1 câu" | 26–29; `chanting` ở 11 NPC (78…1051); news 466, 518, 245 | Trung bình nếu vẫn còn đọc | Cần kiểm chứng chéo; nếu không ai đọc `chanting` thì xóa field |
| 13 | dialogues.ts comment | Comment lỗi thời | 12 ("quy ước ở đầu file" không tồn tại); 30 ("npc15–npc18" nhưng 852, 898, 922… cũng có); 596, 620, 690 ("chưa có mã Q") | Không | Xóa/sửa comment; dùng quest id thay mã Q (35, 462) |
| 14 | dialogues.ts npc2, npc14 | Xưng hô lệch vai trong questLines; "hai bé" đã cũ | 169–171 xưng "tôi/con" vs 160–166 "con/thí chủ"; 481–483 "tôi/thầy", "hai bé" vs news 107, 154; 842 lặp chữ "thả" | Thấp | Sửa chữ cho khớp vai NPC |
| 15 | news.ts `date` | Ngày không đơn điệu theo thứ tự mảng | 863 (11-13) kẹp giữa 852 và 872 (11-14); 898 lại 11-13. ✅ | Thấp; chỉ lỗi nếu UI sắp xếp theo ngày | Sửa ngày 863 hoặc đổi chỗ mục; cần kiểm chứng chéo UI |

**4 câu hỏi (khu vực 12):** (1) Xóa được chắc chắn, không phụ thuộc file khác: ba mục tin quản trị (#4), các câu ghi chú dev (#3), comment lỗi thời (#13). Xóa được sau khi kiểm chứng chéo: phần đuôi NEWS (#6) sau khi chốt #5 — Lux: cần id ổn định trước; field `chanting` (#12); thoại `nq_bow_tamthe`/`nq_chant_thienduong` của npc1 (#9); một trong hai npc30/npc34 (#7). Không có bằng chứng code chết trong phạm vi hai file này. Riêng "chưa có mã Q" (596, 620, 690): nhiều khả năng comment sai chứ thoại không chết — news 918 nói 21 nhiệm vụ; trừ Q1–Q14 còn đúng 7, bằng số NPC nhờ vặt (npc5, 9, 11, 12, 19, 20, 23). (2) Phức tạp thừa: thoại quest có hai hình dạng song song — ba field chính và `questLines` (15–23), vì vậy mới sinh ra các dòng `''` (#10); `greetings` phân khung giờ, cộng `smallTalk` và `farewell` riêng, trong khi UI chỉ hiện 1 câu mỗi lần (news 518); `LATEST_NEWS_ID` là hằng số tách rời khỏi mảng (#5). (3) Giả định yếu: giờ chơi — game tên "24/7" nhưng không có thoại đêm, đa số NPC thiếu khung evening (#11); con số trong thoại — giả định giá và thông số không đổi, đã sai một lần (#1, #8); bump tay — giả định dev luôn nhớ tăng `LATEST_NEWS_ID`, đã lệch 2 (#5) — Lux: lệch 2 là quirk đã biết, không phải lỗi; người đọc tin — giọng viết như báo cáo cho chủ dự án, không phải cho người chơi (#3, #4, mã Q ở 155–156, 328, 434); giới tính/tuổi người chơi — "Anh ơi" (606, 608), "em mua giúp chị" (630); ranh giới ngày — điểm danh 07:00 VN (news 1140) nhưng nhiệm vụ reset 00:00 (news 406, dialogues 81); 07:00 VN trùng 00:00 UTC, nên có thể là vô tình chứ không phải thiết kế — cần kiểm chứng chéo ở server. (4) Đơn giản hóa tiếp: gộp ba field quest vào một hình dạng optional (#10), rồi bỏ `'any'` (#11); sau khi cắt NEWS: gộp các chuỗi vá liên tiếp thành một mục (ví dụ râu Sư Ông 41, 178, 354; tên NPC 565, 581, 606; cầu thang Tam Thế 843, 933, 949); sắp `DIALOGUES` theo thứ tự id — hiện npc37 nằm ở dòng 82, npc30 ở 834, npc29 ở 1032, và không có npc35.

**Top 3 khu vực 12:** (1) #1 + #2 — thoại NPC hướng dẫn sai cơ chế vườn và sai chỗ quét. (2) #3 + #4 — tin quản trị và ghi chú dev trong "Có gì mới"; nên làm trước R4. (3) #5 → #6 — chốt ngữ nghĩa `LATEST_NEWS_ID` rồi cắt NEWS — Lux: #5 là quirk đã biết, không phải lỗi; #6 cần id ổn định trước.

---

## Lux sửa/bổ sung kết luận của Fable (kiểm chứng chéo toàn repo)

Fable mỗi lần chỉ thấy file của khu vực mình; Lux đã grep toàn bộ 70 file đã
fetch để giải quyết các mục "cần kiểm chứng chéo". Kết quả:

**Fable sai — đã sửa trong các mục trên:**
- `toon.ts` KHÔNG chết (khu vực 7 #4): được import bởi character, garden,
  market, vuoncay, world. Chỉ dedupe cache `geo`.
- `placeKoiPond` và `relabelColumns` KHÔNG chết (khu vực 6 #3): dùng ở
  temple.ts:934, 984 và temple.ts:54, 1631. Chỉ `sereneSky` chết.
- Panel `teacher` KHÔNG chết (khu vực 9 #4): được mở từ main.ts:1300, 1532.
  Chỉ re-export `levelOf` (panels.ts:708) là không có importer.
- `spinDone` KHÔNG chết (khu vực 8): dùng ở games.ts.
- `hydrateIcons` KHÔNG phải no-op (khu vực 9 #7): có body thật ở icons.ts:59-64.
- `roads.ts` Dijkstra KHÔNG xóa được 97 dòng (khu vực 11 #6): chỉ `roadPath`
  (~43 dòng) chết; `roadRoute`/`nearestNode`/`routeFrom` đều được dùng.
- `reps` KHÔNG chết (khu vực 11 #3): được đọc ở panels.ts.
- `buildArhat` KHÔNG phải code chết (khu vực 7 #8): dùng ở temple.ts:157 và
  corridor:81 — đây là quyết định thiết kế (fallback khi GLB lỗi).
- LATEST 129 vs 131 mục KHÔNG phải lỗi (khu vực 12 #5): quirk offset-2 đã
  biết và có tài liệu; quy tắc "mục mới = LATEST+1" vẫn đúng.
- `game.ts:534 return 0` KHÔNG đáng xóa: fallback exhaustiveness của TS.
- `checkin:get` / `spin:get` / `stats:get` KHÔNG chết (khu vực 1): client còn
  gọi (checkin.ts, spin.ts, profile.ts/stats.ts).
- `isIndoors` CÒN DÙNG (khu vực 2 #13): index.ts:553, 850.
- `resolveWater` CÒN DÙNG (khu vực 4): main.ts:1292, world.ts:607.
- `.dockerignore` ĐÃ loại shots/tools/data/glb (khu vực 11): lo ngại về
  `COPY . .` đã được giải quyết.

**Lux xác nhận thêm, mạnh hơn cách Fable nêu:**
- `roundRect` có **5 call site ở 3 file** (character.ts:152,718;
  textures.ts:43,52; animals.ts:64) và **KHÔNG có polyfill nào trong repo** —
  mạnh hơn cách nêu từng khu vực của Fable.
- Lookup prototype (khu vực 1): `ACTION_RULES`/`ITEM_BY_ID` là plain object
  nên khóa `'constructor'` từ client đi qua được guard `!rule`/`!item`
  (index.ts:505-506, 599-600); merit/cost thành `undefined`/`NaN`, `safeHandler`
  bắt lỗi — mức thấp–trung bình, sửa bằng `hasOwn`/whitelist.
- Fable KHÔNG phát hiện lỗi TS18048 ở `admin:grant` (làm deploy #32 fail) —
  đã sửa ngoài audit bằng commit `fd6e1eb` (1 dòng).
- `getLastPhoto` chỉ còn hook DEV `__co.pr` (main.ts:2643).
- `wateredToday`: server ghi, client chỉ đọc trong key dựng lại cây
  (vuoncay.ts:328) — tàn dư về mặt hành vi, không xóa vội.

**Dedup giữa các khu vực (đã gộp trong các mục trên):**
- `roundRect`: khu vực 5 #10, 7 #12, 10 (animals.ts:64) — một mục sửa chung
  (polyfill hoặc `arcTo`).
- `sealArchitectureJoints` chạy lúc tải: khu vực 4 (Q2), 5 #14, 6 #6 — cần một
  lần log `seal.filled` lúc chạy để quyết chung.
- Mốc ngày UTC vs ICT: khu vực 1 #11, 9 #13, 11 #8, 12 (Q3) — một quyết định
  của chủ dự án, chạm dữ liệu.
- Emit chờ ack không timeout: khu vực 8 #15, 9 #2 — một mẫu sửa chung
  (`socket.timeout()` hoặc mở khóa khi disconnect).
- Rẽ nhánh theo chuỗi lỗi tiếng Việt của server: khu vực 3 #7, 8 #11 — một
  mẫu sửa chung (error code).
- `wateredToday`: khu vực 2 #4, 11 (Q1) — một mục.
- `getProfile`/`move` tải DB: khu vực 1 (2 mục) — một mục tối ưu.
- Cache `geo` của toon vs statues: khu vực 7 #4 — một mục dedupe.

## Còn khu vực chưa audit

- `tools/` (113 file: verify harness `steps-*.mjs` + script hỗ trợ) — thuộc
  danh sách cấm của kit (không audit chi tiết). Hệ quả: các kiểm chứng chéo
  liên quan harness vẫn mở (`getStatValue`, `animCalls`/`chip*`, `gapdump`,
  `__co.pr`, `buildBuddha`/`buildQuanAm` trong hook DEV).
- `shots/` (ảnh nghiệm thu), `*.glb` (model quét), `public/audio/`,
  `public/models/`, `public/textures/` (tài sản nhị phân) — ngoài phạm vi.
- `package-lock.json`, `node_modules/`, `dist/` — không audit.
- `phan-a2/` (tài liệu), `.kilo/` (cấu hình Kilo) — không audit.
- `data/` — không có trong repo (phải copy riêng).
- Kiểm chứng lúc chạy chưa làm: log `seal.filled` (khu vực 4/5/6), số draw
  call tre/cầu/tháp (khu vực 4 #15, 6 #13), tần suất NPC kẹt (khu vực 2 #5),
  bounds của `clampToCompound` (khu vực 4 #7), tần suất server emit `profile`
  (khu vực 8 #1), thử audio/photo trên iPhone thật (khu vực 8 #6, 10).

## Chi phí (từ `chunks/usage.jsonl`, giá occ: 10.500đ/1M vào, 52.500đ/1M ra)

| Khu vực | Token vào | Token ra | Chi phí (đ) | Trạng thái |
|---|---|---|---|---|
| 1. server/index.ts + db.ts (lần 1) | 82.412 | 16.384 | 1.725 | HỎNG — trả về rỗng (`finish=length`): thinking high đã nuốt hết budget 16.384 token |
| 1. server/index.ts + db.ts (lần 2) | 82.490 | 25.599 | 2.210 | OK (`finish=stop`, max-tokens 65.536) |
| 2. server/npcs.ts + animals.ts + garden.ts | 69.553 | 24.825 | 2.034 | OK |
| 3. src/main.ts | 82.519 | 19.832 | 1.908 | OK |
| 4. src/temple.ts | 80.283 | 21.249 | 1.959 | OK |
| 5. character.ts + clothing.ts + tamthe.ts | 70.877 | 22.553 | 1.928 | OK |
| 6. world.ts + compound.ts + layout.ts + hall.ts | 69.894 | 26.962 | 2.149 | OK |
| 7. statues/textures/toon/sdf | 45.234 | 17.006 | 1.368 | OK |
| 8. features đợt 1 | 29.641 | 14.209 | 1.057 | OK |
| 9. features đợt 2 + menu.ts + panels.ts | 54.176 | 20.845 | 1.663 | OK |
| 10. client phụ + CSS | 84.228 | 23.638 | 2.125 | OK |
| 11. shared + data quẻ/lễ + deploy | 89.113 | 26.323 | 2.318 | OK |
| 12. dialogues.ts + news.ts | 83.065 | 19.914 | 1.918 | OK |
| **Tổng 13 lần gọi** | **923.485** | **279.339** | **24.362** | 12/12 khu vực thành công |
| Lần gọi kiểm tra credential đầu buổi | 2.303 | 4 | 24 | OK ("OK", 2,3s) |
| **Tổng chi cả buổi** | **925.788** | **279.343** | **24.386** | |

**Bài học chi phí:**
- Lần gọi đầu khu vực 1 dùng `max-tokens 16384` (theo brief) trả về rỗng:
  Fable ở thinking high dùng hết budget cho suy luận, không còn token để trả
  lời. Lần 2 dùng 65.536 thì thành công. **Mọi lần gọi Fable thinking-high sau
  này phải để max-tokens ≥ 65.536.**
- Tiếng Việt tốn token gấp đôi ước tính (~1,7 ký tự/token thay vì ~4), và
  Fable high-thinking dùng ~14–27K token hoàn thành mỗi khu vực — đó là lý do
  tổng chi (24.362đ) vượt ước tính ban đầu (5.000–15.000đ).
- Prompt mỗi khu vực đã giới hạn 15 phát hiện + ô bảng ~30 từ để kiểm soát chi
  phí; các khu vực vẫn trả đủ 15 mục.

## Tài liệu tham khảo của audit

- Prompt kit: `~/workspace/prompt-audit-fable-chua-online.md` (Prompt A).
- File đã fetch (70 file, mirror theo đường dẫn repo):
  `~/workspace/vilao-work/fable-audit/files/`
- Prompt + trả lời từng khu vực:
  `~/workspace/vilao-work/fable-audit/chunks/chunk-N-prompt.txt`,
  `chunks/chunk-N-reply.txt` (N = 1..12).
- Log token từng lần gọi: `~/workspace/vilao-work/fable-audit/chunks/usage.jsonl`.
- Script: `build_prompts.py`, `run_chunks.py` (cùng thư mục).
- Ghi chú kiểm chứng chi tiết khu vực 1: `chunks/chunk-1-verified.md`.
