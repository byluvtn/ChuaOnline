# SPEC R2.2 — LẦN HẠT 108 (giao diện lần tràng hạt + thưởng vòng + mốc thành tựu)

> Neo code: `main` tại `1a1ec79` (sau R1.5). 1 spec = 1 session Kilo.
> Bối cảnh: hành động `beads` đã có (animation nhân vật lần hạt ở `character.ts`,
> `ACTION_RULES.beads = { merit: 0, cooldownMs: 2400 }`, server early-return chỉ để
> diễn hoạt) nhưng CHƯA có giao diện lần hạt từng hạt, chưa có thưởng, và cột
> `player_stats.beads_rounds` (R1.5) đang ngủ đông — chưa có điểm đếm, chưa có mốc.
> R2.2 lấp đúng các khoảng đó. Không thay đổi schema DB.

## 1. Thiết kế đã chốt (không bàn lại khi làm)

- **Một vòng = 108 hạt.** Người chơi chạm vào hạt lớn (hoặc bấm Space) để lần
  từng hạt, bộ đếm n/108. Đủ 108 = hoàn thành một vòng.
- **Thưởng mỗi vòng: +10 công đức, +5 xu**, qua `grantRewards` (đếm vào nhiệm
  vụ/cấp như hành lễ thường) + `questEvent(s, 'beads')`.
- **Giới hạn thưởng: tối đa 5 vòng/ngày** (dùng `claimMinigame(pid, 'lanhat', 5)`
  — khung sẵn của vòng quay). Vòng thứ 6 trở đi trong ngày vẫn tính thành tựu
  trọn đời nhưng không thưởng.
- **Hệ số giờ lễ (R1.4) ÁP DỤNG cho công đức của vòng** (`meritBoost`, làm tròn
  `Math.round`) — lần hạt là hành lễ, nhất quán với thắp hương/tụng kinh. Đây là
  mở rộng có chủ đích của R1.4, ghi rõ để khỏi thắc mắc khi review.
- **Chống gian lận bằng thời gian, không tin client:** client chỉ đếm hạt để
  hiển thị. Server ghi mốc bắt đầu ở `beads:start`; `beads:done` chỉ hợp lệ khi
  đã qua tối thiểu `BEAD_ROUND_MIN_MS = 45_000` (108 hạt ⇒ trung bình ≥ ~0,42
  giây/hạt — người thật lần nhanh cũng không dưới ngưỡng này, bot bấm tức thì
  thì bị chặn) và chưa quá 30 phút (mốc bắt đầu cũ bị bỏ).
- **Mốc thành tựu mới** cho `beads_rounds` (bổ sung vào `STAT_MILESTONES`, cùng
  khung thưởng 20/50/120 xu như 4 track hiện có).
- Số vòng trọn đời đếm bằng chính `countStatSafe(s, 'beads_rounds')` của R1.5 —
  mốc tự bắn qua `countStat`, không viết đường riêng.

## 2. Server (`server/index.ts`)

Trạng thái vòng đang lần giữ trong session (bộ nhớ, không DB): `s.beadStart?: number`.

- Handler `beads:start`: `s.beadStart = Date.now()`; ack `{ ok: true }`.
  Gọi lại khi đang có vòng dở = bắt đầu lại từ đầu (ghi đè mốc).
- Handler `beads:done` (ack):
  - Không có `s.beadStart`, hoặc `elapsed < BEAD_ROUND_MIN_MS`, hoặc
    `elapsed > 30 * 60_000` → ack `{ ok: false }`, xóa `s.beadStart`, KHÔNG
    đếm, KHÔNG thưởng.
  - Hợp lệ → xóa `s.beadStart`, rồi:
    1. `await countStatSafe(s, 'beads_rounds')` — luôn đếm (kể cả khi đã hết
       lượt thưởng ngày).
    2. `const rewarded = await db.claimMinigame(s.pid, 'lanhat', 5)`; nếu
       `rewarded`: `const merit = Math.round(10 * meritBoost().mult)` (dùng
       hàm `meritBoost` từ `shared/time.ts` như R1.4), `grantRewards(s, merit, 5)`,
       `questEvent(s, 'beads')`.
    3. ack `{ ok: true, rewarded, merit: rewarded ? merit : 0 }` và emit lại
       `'beads' { rewarded: <số vòng đã thưởng hôm nay> }` (đếm bằng
       `db.minigameCount(s.pid, 'lanhat')`).
- Emit lúc join (cạnh các emit 'checkin'/'spin' hiện có):
  `socket.emit('beads', { rewarded: await db.minigameCount(pid, 'lanhat') })`.
- Hằng số đặt cạnh `MINIGAMES`: `BEAD_ROUND_MIN_MS = 45_000`,
  `BEAD_ROUND_REWARD = { merit: 10, coins: 5 }`, `BEAD_DAILY_CAP = 5`.
- Hành động animation `beads` trong handler `action` GIỮ NGUYÊN (early-return,
  merit 0) — vòng hạt đi đường riêng ở trên, không đụng vào.

## 3. Mốc thành tựu (`shared/game.ts`)

Thêm vào cuối `STAT_MILESTONES` (StatKey `'beads_rounds'` đã có sẵn):

```ts
{ id: 'bead5',   stat: 'beads_rounds', threshold: 5,   title: 'Khởi tâm lần hạt',       coins: 20 },
{ id: 'bead25',  stat: 'beads_rounds', threshold: 25,  title: 'Tràng hạt không rời tay', coins: 50, item: 'huong_tram' },
{ id: 'bead100', stat: 'beads_rounds', threshold: 100, title: 'Một trăm vòng an nhiên',  coins: 120, item: 'den_hoa_dang' },
```

Panel Cấp độ (`src/features/stats.ts`): thêm track thứ 5 vào danh sách track của
`renderStatsSection` — 📿 "Vòng hạt", giá trị = `beads_rounds`, đơn vị "vòng",
mốc lấy từ `STAT_MILESTONES` như 4 track kia (không hardcode lại số).

## 4. Client (mới: `src/features/beads.ts` + nối vào `src/menu.ts`)

Theo mẫu `checkin.ts`/`spin.ts` (`initBeads(ctx)`, panel qua `openCustomPanel`):

- **Nút menu** "📿 Lần hạt" (cùng cụm Điểm danh / Vòng quay). Chấm đỏ khi số
  vòng đã thưởng hôm nay < 5 (trạng thái từ emit 'beads' lúc join + ack của
  `beads:done`; cập nhật qua `refreshDots()` như các nút khác).
- **Panel "Lần hạt 108":**
  - Một vòng tròn 108 chấm nhỏ xếp vòng (SVG hoặc CSS), tô dần theo số hạt đã
    lần; 3 hạt mốc ở vị trí 27 / 54 / 81 vẽ to hơn (dấu chia phần tư của tràng
    hạt thật). Giữa vòng là **hạt lớn để chạm** (≥120px) + số đếm lớn `n / 108`.
  - Chạm hạt lớn / click / phím Space = lần 1 hạt: hạt hiện tại sáng lên, số
    đếm +1, hạt lớn nảy nhẹ (transform scale). Không âm thanh (hành động
    `beads` hiện cũng không phát tiếng — giữ nguyên tính chất tĩnh lặng).
  - Lần đầu tiên chạm hạt trong một vòng mới: emit `beads:start` TRƯỚC khi
    đếm hạt 1. Đủ 108: emit `beads:done`, theo ack hiển thị dòng kết quả:
    - `rewarded`: "Hoàn thành một vòng · +{merit} công đức · +5 xu"
    - hết lượt: "Hoàn thành một vòng · Vòng này tính vào thành tựu (đã hết
      lượt thưởng hôm nay)"
    - `ok: false`: "Vòng chưa hợp lệ — hãy lần chậm rãi, đủ nhịp."
  - Nút "Bắt đầu vòng mới" sau khi hoàn thành (reset đếm về 0; `beads:start`
    sẽ phát ở lần chạm đầu tiên của vòng sau).
  - Đóng panel giữa vòng = bỏ vòng dở phía client (không cần báo server; mốc
    bắt đầu phía server tự hết hạn sau 30 phút hoặc bị vòng sau ghi đè).
- **Hiện diện trong phòng:** khi panel đang mở và vòng đang dở, cứ mỗi ~2,4
  giây client gọi lại hành động animation `beads` như cách game đang phát các
  action khác (nhân vật đứng lần hạt cho cả phòng thấy); dừng khi đóng panel
  hoặc hoàn thành vòng. Không sửa animation `beads` trong `character.ts`.
- Panel phải dùng tốt ở 390×844: hạt lớn nằm trong tầm ngón cái, không phần tử
  nào tràn màn hình.

## 5. Tin tức (bắt buộc — luật "Có gì mới")

Thêm entry vào `src/data/news.ts`, `LATEST_NEWS_ID` 4 → 5 (ngày tháng theo
đúng định dạng các entry hiện có trong file):

- Tiêu đề: **"Lần hạt 108"**
- Nội dung:
  - "Thêm tính năng Lần hạt: chạm từng hạt, đủ 108 hạt là hoàn thành một vòng — nhận công đức và xu."
  - "Mỗi ngày thưởng tối đa 5 vòng; các vòng sau vẫn tính vào Thành tựu tích lũy."
  - "Thêm 3 mốc thành tựu mới cho người lần hạt: 5, 25 và 100 vòng (xem trong mục Cấp độ)."
  - "Vào giờ lễ và ngày Mùng 1, Rằm, công đức lần hạt cũng được nhân như các hành lễ khác."

## 6. Nghiệm thu

- `npm run typecheck` pass.
- Script mới `tools/steps-verify-beads.mjs` (mẫu harness R1.1–R1.5: DB tạm +
  server thật + socket.io-client). Lưu ý script có 3 lần chờ thật ~46 giây —
  tổng thời gian chạy ~2,5 phút là bình thường, không phải treo:
  1. `beads:done` khi chưa `beads:start` → `{ ok: false }`, `beads_rounds` = 0.
  2. `start` rồi `done` ngay → `{ ok: false }` (quá nhanh), stats vẫn 0.
  3. Vòng hợp lệ (start, chờ ≥46s, done) → `{ ok: true, rewarded: true }`;
     profile tăng đúng `Math.round(10 × mult hiện hành)` công đức và +5 xu;
     `beads_rounds` = 1.
  4. Mốc: seed `player_stats.beads_rounds = 4` cho một người chơi khác (qua
     helper DB của harness như R1.5 đã làm) → một vòng hợp lệ → nhận đúng một
     event `milestone` id `bead5`, xu tăng thêm đúng 20 (phần của mốc, tách
     khỏi phần thưởng vòng); `claimStatReward(pid, 'bead5')` gọi lại trả false.
  5. Hết lượt: seed `minigame_daily` game `'lanhat'` count = 5 → một vòng hợp
     lệ → `{ ok: true, rewarded: false }`, `beads_rounds` vẫn +1, công đức/xu
     không đổi.
  6. Bền vững: reconnect → `stats:get` thấy tổng số vòng và `claimed` chứa
     `bead5`.
  7. Hồi quy: action `incense` vẫn trả thưởng như cũ; action animation `beads`
     vẫn không cho công đức.
- Ảnh trong `shots/`:
  - `r22-panel.png` — panel desktop giữa vòng (khoảng 54/108, vòng chấm tô
    một nửa, hạt mốc 27/54 thấy rõ).
  - `r22-done.png` — trạng thái vừa hoàn thành, dòng kết quả có số thưởng.
  - `r22-m-panel.png` — panel ở 390×844 giữa vòng, hạt lớn trong tầm tay,
    không tràn màn hình.

## 7. Commit & Push (bắt buộc — làm xong là đẩy luôn, không chờ lệnh riêng)

1. `feat: 108-bead counting with daily rewards and milestones (R2.2)`
2. `docs: update HANDOFF for R2.2`

(Add từng path cụ thể, không `git add -A`.)

Sau commit cuối, push ngay trong cùng session:

1. `git pull --rebase origin main` trước (repo có thể đã tiến thêm vì docs/tài
   liệu). Nếu rebase báo xung đột: DỪNG, báo cáo nguyên văn, không tự xử.
2. `git push origin main`. Nếu lỗi HTTP 400 (ảnh nặng) thì chạy lại đúng một
   lần: `git -c http.postBuffer=524288000 push origin main`.
3. Tuyệt đối không force-push. Push lỗi khác thì dừng và báo cáo.
4. Báo cáo phải kèm HEAD mới sau khi push thành công.

## 8. Ngoài phạm vi

- Không nối vật phẩm `trang_hat` (boost của `chant`) vào lần hạt.
- Không đổi `ACTION_RULES.beads`, không đổi animation lần hạt hiện có.
- Không làm âm thanh hạt, không làm vòng hạt 3D trong thế giới — panel 2D là đủ.
- Không đếm hạt lẻ vào stats — chỉ vòng trọn 108 mới tính.
