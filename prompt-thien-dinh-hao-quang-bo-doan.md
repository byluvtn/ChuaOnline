# Prompt Kilo: Thiền định — Hào quang 2 tầng theo ngày + Bồ đoàn cánh sen

Một session làm CẢ HAI việc dưới đây rồi push 1 commit chung. Phần A và Phần B độc lập nhau (chỉ chung file `news.ts`), làm phần nào trước cũng được nhưng phải xong cả hai mới push.

---

## PHẦN A — Hào quang thiền định (2 tầng, theo ngày)

### A.1. Bối cảnh — những gì đã có sẵn

- Hào quang ĐÃ CÓ SẴN dưới dạng phụ kiện `hao_quang` (vòng torus vàng + đĩa mờ sau đầu, `src/character.ts` nhánh `setAccessory`, tọa độ `(0, 1.68, -0.55)`). Phụ kiện này hiện bán trong shop 300 xu (`shared/game.ts` ~dòng 100). Việc này KHÔNG vẽ mẫu mới — chỉ thêm đường mở khóa bằng thiền + biến thể lớn.
- Thiền hiện tại: server tick mỗi 10 s (`MEDITATE_TICK_MS`, `server/index.ts` ~1451-1477) cộng `meditate_sec` cho người có `anim === 'sit'`; `GROUP_MEDITATE_MIN = 3` cho x2. Mốc ngày dùng `dayKeyICT()` (00:00 giờ VN, `shared/time.ts`).
- Đồng bộ ngoại hình đã có mẫu: `player:look` (phụ kiện) và `player:title` (danh hiệu) ở `src/main.ts` ~636-664; `toast(text)` ở `src/main.ts:386`.
- ĐÃ KIỂM CHỨNG trên DB live: không ai sở hữu `hao_quang` (inventory rỗng, không ai đang đeo) → xóa khỏi shop KHÔNG cần hoàn tiền hay migration dữ liệu.

### A.2. Quyết định đã chốt (user chốt ngày 2026-11-18, không đổi)

1. **Hai tầng, tính theo lần ngồi LIÊN TỤC** (đứng dậy / tụng kinh / làm động tác khác / đổi phòng / mất kết nối → tính lại từ đầu):
   - Ngồi liên tục **10 phút** → hào quang thường (tầng 1).
   - Ngồi liên tục **20 phút** → hào quang lớn, sáng hơn (tầng 2). Một lần ngồi 20 phút sẽ đạt tầng 1 ở phút 10 rồi tầng 2 ở phút 20. Đã có tầng 1 rồi đứng dậy thì muốn tầng 2 phải ngồi lại một mạch 20 phút mới.
2. **Theo ngày, không vĩnh viễn:** hào quang chỉ có trong ngày đạt được. Qua **00:00 giờ VN** là tắt; hôm sau vào game phải thiền lại từ đầu. Đăng xuất rồi vào lại TRONG NGÀY thì hào quang còn nguyên.
3. **Hào quang là trạng thái riêng, KHÔNG phải phụ kiện:** không chiếm ô phụ kiện — đeo nón lá vẫn có hào quang cùng lúc. Không vào Túi đồ, không mua bán.
4. **Xóa `hao_quang` khỏi shop** — chỉ thiền mới có. (Nhánh render phụ kiện `hao_quang` trong `character.ts` và entry icon trong `panels.ts` cứ để nguyên, không xóa.)
5. **NPC trụ trì / sư thầy có hào quang mặc định:** mọi NPC có `role === 'abbot'` (Sư Thầy, Sư Thầy Trực Ban, Sư Phó, Sư Ông) luôn hiện hào quang tầng 1. Tiểu tăng/tiểu ni (`novice`) và phật tử (`lay`) không có.
6. Hào quang đã đạt thì hiện MỌI LÚC trong ngày (đi, đứng, ngồi đều có), không chỉ lúc thiền. Người chơi khác nhìn thấy.

### A.3. Server

#### A.3.1 Hằng số (`shared/game.ts`, gần `MEDITATE_TICK_MS` ~dòng 432)

```ts
export const HALO_TIER1_SEC = 600;  // 10 phút ngồi liên tục
export const HALO_TIER2_SEC = 1200; // 20 phút ngồi liên tục
```

#### A.3.2 DB (`server/db.ts`)

- Bảng mới (mẫu theo `fortune_daily` / `minigame_daily`):
  `halo_daily (player_id INTEGER NOT NULL, day_key TEXT NOT NULL, level INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (player_id, day_key))`. Tạo bằng `CREATE TABLE IF NOT EXISTS` trong khối migration khởi động.
- `getHaloLevel(id): Promise<0 | 1 | 2>` — đọc dòng có `day_key = dayKeyICT()` của hôm nay, không có → 0.
- `setHaloLevel(id, level)` — `INSERT OR REPLACE` với `day_key = dayKeyICT()`.

#### A.3.3 Trạng thái phiên (`server/index.ts`)

- Thêm vào interface `Session`: `sitSince?: number; haloDay?: string; haloLevel?: 0 | 1 | 2`.
- Thêm vào `PlayerState` (`shared/types.ts:10`): `halo?: 0 | 1 | 2` (optional — NPC không có trường này).

#### A.3.4 Tick thiền (`server/index.ts` ~1451-1477) — logic cấp hào quang

Trong tick thiền hiện tại, thêm các bước sau (KHÔNG sửa logic cộng merit / quest / `meditate_sec` sẵn có):

1. `const today = dayKeyICT();`
2. **Dọn `sitSince`:** với MỌI session của mọi phòng (không chỉ người đang ngồi): nếu `s.state.anim !== 'sit'` thì `s.sitSince = undefined`.
3. **Qua ngày mới:** nếu `s.haloDay !== today`: nếu `s.haloLevel > 0` thì gửi cho socket đó event `halo` `{ level: 0, reason: 'reset' }` và broadcast `player:halo` `{ id, level: 0 }` cho phòng; rồi `s.haloDay = today; s.haloLevel = 0; s.sitSince = undefined;`.
4. **Cấp tầng:** với mỗi người đang ngồi (`anim === 'sit'`): nếu chưa có `s.sitSince` thì `s.sitSince = Date.now()`; `elapsed = (Date.now() - s.sitSince) / 1000`; `target = elapsed >= HALO_TIER2_SEC ? 2 : elapsed >= HALO_TIER1_SEC ? 1 : 0`; nếu `target > (s.haloLevel ?? 0)` thì: `s.haloLevel = target; await db.setHaloLevel(s.pid, target);` gửi socket đó `halo` `{ level: target, reason: 'grant' }` và broadcast phòng `player:halo` `{ id: s.state.id, level: target }`.
- Lưu ý: tick chạy mỗi 10 s nên cấp hào quang có thể chậm tối đa 10 s sau mốc — chấp nhận được, không cần timer riêng.
- Chỉ tụng kinh (`anim === 'chant'`) hay làm động tác khác đều làm mất chuỗi ngồi — đúng như cách `meditate_sec` đang tính.

#### A.3.5 Join (`server/index.ts` ~468)

- Sau khi load profile: `const haloLevel = await db.getHaloLevel(pid);` thêm `halo: haloLevel` vào `PlayerState` khi tạo state; `s.haloDay = dayKeyICT(); s.haloLevel = haloLevel; s.sitSince = undefined;`.
- Sau khi join xong, gửi riêng cho socket đó event `halo` `{ level: haloLevel, reason: 'join' }` (để client tự áp lên nhân vật của mình; KHÔNG toast khi join).
- `player:join` mang nguyên `PlayerState` nên tự có `halo` — kiểm tra chỗ emit `player:join` không lược trường này.
- KHÔNG thêm `halo` vào broadcast `state` 100 ms (`server/index.ts` ~1440) — trạng thái tần suất thấp, event riêng là đủ.

### A.4. Client

#### A.4.1 `setHalo(level)` (`src/character.ts`)

- Thêm `setHalo(level: 0 | 1 | 2)` + nhóm riêng `haloGroup` + mảng `haloMats`, theo đúng mẫu dispose của `accMats` (Đợt 3 đã fix rò GPU — material mới tạo phải dispose khi đổi tầng và trong `dispose()`).
- Tầng 1 = đúng công thức nhánh phụ kiện `hao_quang`: torus `(0.78, 0.04, 8, 40)` màu `0xffd36b` nhân `2.2`, đĩa `(0.76, 32)` màu `0xffe9a8` opacity `0.22` DoubleSide, đặt `(0, 1.68, -0.55)`.
- Tầng 2 = cùng công thức nhưng nhóm scale `1.35`, ống torus `0.055`, màu nhân `3.0`, đĩa opacity `0.30`.
- Thêm nhóm vào `body` (đi theo tư thế như phụ kiện). Dùng key `geo()` RIÊNG cho từng tầng (vd `haloRing1`/`haloDisc1`/`haloRing2`/`haloDisc2`) — KHÔNG dùng lại key `halo`/`haloD` của phụ kiện vì thông số hình học khác.
- KHÔNG sửa nhánh `setAccessory('hao_quang')`.
- Export `setHalo` cùng chỗ với `setAccessory` trong object trả về của `buildCharacter`.

#### A.4.2 Đồng bộ (`src/main.ts`)

- `addPlayer` (~dòng 367), sau `char.setAccessory(...)`:
  - NPC: `if (p.npc && p.role === 'abbot') char.setHalo(1);`
  - Người chơi: `char.setHalo(p.halo ?? 0);`
- Thêm handler cạnh `player:look` (~dòng 664):
  `s.on('player:halo', ({ id, level }) => { const r = remotes.get(id); if (!r || r.data.npc) return; r.data.halo = level; r.char.setHalo(level); });`
- Thêm handler event `halo` cho chính mình: giữ biến `myHalo` (khởi tạo 0). Khi nhận `{ level, reason }`:
  - `reason === 'grant'` và `level > myHalo` → toast: tầng 1: `'Hào quang đã hiện trên đầu bạn! Thiền tiếp tới 20 phút để có hào quang lớn.'`; tầng 2: `'Hào quang lớn đã hiện — 20 phút thiền định!'`.
  - `reason === 'reset'` và `myHalo > 0` → toast: `'Đã qua ngày mới — hào quang tắt, thiền lại để có hào quang mới.'`.
  - `reason === 'join'` → không toast.
  - Cập nhật `myHalo = level`; `if (me) me.char.setHalo(level);` (guard vì event có thể tới trước khi `me` tồn tại).

#### A.4.3 HUD tiến độ (trong `updateMeditationHud`, `src/main.ts` ~462)

- Theo dõi giờ ngồi liên tục của chính mình: thêm `let mySitSince: number | null = null;` — set khi anim của mình chuyển thành `'sit'`, clear khi rời `'sit'` (móc vào chỗ client đã theo dõi anim của mình, gần dòng 2671-2672).
- Khi đang ngồi, nối thêm vào text của banner thiền:
  - `myHalo === 0`: `· Hào quang của bạn: M/10 phút`
  - `myHalo === 1`: `· Hào quang lớn: M/20 phút`
  - `myHalo === 2`: `· Hào quang lớn đã hiện`
  - với `M = floor((Date.now() - mySitSince) / 60000)`. Không ngồi thì không thêm dòng này.
- Banner chỉ cập nhật theo event `meditation` (mỗi 10 s) — chấp nhận được, không cần interval riêng.

### A.5. Xóa khỏi shop

- Xóa entry `hao_quang` khỏi `ITEMS` trong `shared/game.ts` (~dòng 100). Giữ nguyên entry icon `hao_quang: 'halo'` trong `src/panels.ts` và nhánh render trong `character.ts`.
- Kiểm tra bằng grep: không quest / milestone / nhiệm vụ nào thưởng `hao_quang` (đã kiểm chứng: không có).

---

## PHẦN B — Bồ đoàn cánh sen + giãn cách chỗ ngồi

### B.1. Bối cảnh — đệm hiện tại

- `src/zafu.ts`: `buildZafuParts(radius, height, topY, positions)` trả về 3 `InstancedMesh` (`body` cầu dẹt đỏ `0xa0201a`, `ring` torus vàng, `button` nút vàng). Đệm hiện tại là cục tròn đỏ trơn.
- 7 điểm dùng, tất cả họ A `(0.38, 0.10)`: Chính Điện 96, Tam Thế 48, deck 98, thiền đường 12 (10 + 2 tụng kinh), Điện Mẫu 2, am cổ 1, thủy đình 3. Tổng 260 đệm.
- Lưới ngồi hiện tại chật (cách nhau 1,5–1,9 m), chiếu 1,1×1,05. Ghế ngồi (`seats`) được push trong cùng vòng lặp với `zafuPos` — đổi mảng lưới là ghế tự theo.

### B.2. Thiết kế mới — bồ đoàn cánh sen (đã được user duyệt từ ảnh concept)

#### B.2.1 Hình dáng (áp dụng cho MỌI đệm)

- **Thân, vòng, nút GIỮ NGUYÊN** (đỏ `0xa0201a`, vàng `0xe8b83a`, cùng kích thước).
- **Thêm 2 vòng cánh sen quanh mép đệm**, làm bằng `InstancedMesh` như thân đệm (KHÔNG dùng Mesh riêng từng cánh — cả chùa ~170 đệm):
  - **Vòng ngoài: 12 cánh**, màu hồng đậm `0xd96a8a`, `MeshStandardMaterial` roughness 0.7.
  - **Vòng trong: 8 cánh**, màu hồng nhạt `0xf7c3d0`, cùng material type. Vòng trong xoay lệch nửa bước (22,5°) để xen kẽ vòng ngoài.
- **Hình học cánh:** ellipsoid từ `SphereGeometry(1, 12, 8)` scale theo bán kính đệm `r` (để họ B `(0.49, 0.12)` sau này vẫn đúng tỉ lệ):
  - Cánh ngoài: dài `0.92·r`, rộng `0.45·r`, dày `0.105·r`. Với `r = 0.38`: dài 0,35, rộng 0,17, dày 0,04.
  - Cánh trong: dài `0.74·r`, rộng `0.37·r`, dày `0.09·r`. Với `r = 0.38`: dài 0,28, rộng 0,14, dày 0,035.
  - Nướng sẵn `geometry.translate(0, 0, L/2)` để cánh kéo dài từ gốc tới `+z` (gốc cánh ở tâm local).
- **Đặt cánh (ma trận mỗi instance):** `M = T(đệm + hướng·baseR) · RY(góc) · RX(-nghiêng)`, với hướng `= (sin(góc), 0, cos(góc))`:
  - Vòng ngoài: `baseR = 0.84·r` (0,32), nghiêng 30°, `baseY = bodyY - 0.01` (gốc cánh hơi chui dưới mép thân). Đầu cánh tới bán kính ≈ 0,62 m, cao hơn gốc ≈ 0,17 m.
  - Vòng trong: `baseR = 0.74·r` (0,28), nghiêng 50°, `baseY = bodyY + 0.005`. Đầu cánh tới bán kính ≈ 0,46 m, cao hơn gốc ≈ 0,21 m (vòng trong vươn cao hơn vòng ngoài — đúng dáng sen nở).
- **Mặt ngồi giữa vẫn phẳng** (chỉ có nút vàng như cũ) — cánh chỉ ở mép, người ngồi không bị cấn.
- Mở rộng `ZafuGeo`/`ZafuParts` thêm `petalOuter`/`petalInner` (geometry + InstancedMesh). Số instance: ngoài `n×12`, trong `n×8`. Material dùng chung cấp module như `bodyMat`/`goldMat`. Geometry cache theo key `radius|height` sẵn có (cánh suy ra từ `r` nên không cần key mới).
- **Cập nhật cả 7 điểm gọi** `buildZafuParts` để add thêm 2 mesh mới, với cùng cờ `castShadow` như 3 mesh cũ tại điểm đó (Chính Điện/Tam Thế: `false`; các điểm trong `temple.ts`: `true`). `receiveShadow = true` như cũ. Lưu ý cũ vẫn đúng: nếu add vào group có `mergeStaticByMaterial` thì add SAU lệnh merge.

#### B.2.2 Giãn cách + giảm số đệm (user chốt)

- Quy tắc: lưới lớn giãn tới **khoảng cách tâm ≥ 1,9 m**; chiếu dưới đệm to ra cho vừa cánh sen (đường kính cánh 1,24 m). Vị trí mới PHẢI nằm trong phạm vi lưới cũ (không lấn ra ngoài khu ngồi, không chạm đường NPC).
- **Chính Điện** (`src/hall.ts` ~241-253): rows `[-3.2, -1.0, 1.2, 3.4, 5.6]` (5 hàng, cách 2,2), cols `[3.4, 5.5, 7.6, 9.7, 11.8, 13.9]` (6 cột, cách 2,1) → **60 đệm** (từ 96). Chiếu `1.1×1.05` → **`1.5×1.5`**.
- **Tam Thế** (`src/tamthe.ts` ~309-321): rows `[-0.4, 2.3, 5.0]` (3 hàng, cách 2,7), cols `[3.2, 5.7, 8.2, 10.7]` (4 cột, cách 2,5) → **24 đệm** (từ 48). Chiếu → **`1.5×1.5`**.
- **Deck** (`src/temple.ts` ~75-97): rows `[-17.6, -15.4, -13.2, -11.0, -8.8, -6.6]` (6 hàng, cách 2,2), cols `[5.7, 7.7, 9.7, 11.7, 13.7, 15.7]` (6 cột, cách 2,0) → **72 đệm** (từ 98). Chiếu giữ `1.43×1.36` (đã đủ rộng).
- **Thiền đường** (`src/temple.ts` ~876-883): 2 dãy giữ `x = ±1.2`; hàng `z` từ `[-3.4, -1.9, -0.4, 1.1, 2.6]` (5 hàng, cách 1,5) → **`[-3.4, -1.4, 0.6, 2.6]`** (4 hàng, cách 2,0) → 8 đệm. **2 bồ đoàn tụng kinh ở `(0, 2)` và `(0, 4)` GIỮ NGUYÊN TUYỆT ĐỐI** (vị trí quest CHANT_SEATS) — cặp gần nhất (tụng kinh ↔ hàng cuối, 1,34 m) vẫn đủ chỗ cho cánh 1,24 m. Chiếu thiền đường giữ `1.0×1.0` (cánh hơi chờm ra ngoài chiếu một chút là bình thường, không nâng chiếu vì sẽ chồng nhau ở chỗ tụng kinh).
- **Điện Mẫu** (2 đệm cách nhau 2,0 m), **am cổ** (1 đệm), **thủy đình** (3 đệm, cặp gần nhất 1,6 m): **giữ nguyên vị trí**. Chiếu Điện Mẫu/thủy đình `0.9–1.0` → `1.2` nếu không chồng nhau, nếu không thì giữ nguyên.
- Tổng sau đổi: 60 + 24 + 72 + 10 + 2 + 1 + 3 = **172 đệm** (từ 260).
- `seats` đi theo `zafuPos` trong cùng vòng lặp — kiểm tra sau khi đổi mảng rằng mỗi đệm vẫn có đúng 1 ghế ngồi trùng tọa độ.

---

## TIN TỨC (`src/data/news.ts`) — 2 entries, 1 lần push

- Đọc `LATEST_NEWS_ID` hiện tại lúc làm. Thêm **2 entries mới lên đầu mảng** (mới nhất trước): entry hào quang trước, entry bồ đoàn sau. `LATEST` tăng **2**. KHÔNG hardcode số. `date: '2026-11-18'` cho cả hai.
- **Entry 1 — hào quang.** Title: `'Hào quang thiền định: thiền 10 phút có hào quang, 20 phút có hào quang lớn'`. Items:
  - `'Ngồi thiền liên tục 10 phút: hào quang vàng hiện trên đầu. Ngồi liên tục 20 phút: hào quang lớn, sáng hơn.'`
  - `'Hào quang chỉ có trong ngày — qua 00:00 sẽ tắt, hôm sau thiền lại để có hào quang mới.'`
  - `'Hào quang không còn bán trong shop — chỉ thiền định mới có.'`
  - `'Sư Ông, Sư Thầy và Sư Phó có hào quang mặc định.'`
- **Entry 2 — bồ đoàn.** Title: `'Bồ đoàn cánh sen mới, chỗ ngồi thiền thoáng hơn'`. Items:
  - `'Đệm thiền trong các điện đổi thành bồ đoàn cánh sen: đệm đỏ ôm trong hai vòng cánh hồng nở.'`
  - `'Các đệm xếp thưa hơn, mỗi người một khoảng riêng để ngồi thiền thoải mái.'`

## NGHIỆM THU (làm đủ cả hai phần rồi mới push)

### Phần A — hào quang
1. `npm run build` PASS (tsc + vite) — chạy 1 lần cho cả hai phần.
2. Shop không còn liệt kê Hào quang.
3. Kiểm thử cấp tầng (CHỈ test local, KHÔNG commit hằng số đã sửa): tạm hạ `HALO_TIER1_SEC`/`HALO_TIER2_SEC` xuống 60/120, chạy game, ngồi 1 phút → tầng 1 hiện trên đầu mình + client thứ hai (hoặc log `player:halo`) thấy; ngồi tiếp tới 2 phút → tầng 2 to/sáng hơn; đứng dậy trước mốc → HUD về 0. Khôi phục hằng số 600/1200 trước khi commit; diff cuối cùng PHẢI cho thấy 600/1200.
4. HUD: ngồi 1 phút thấy dòng `Hào quang của bạn: 1/10 phút`.
5. NPC: chụp ảnh Sư Ông hoặc Sư Thầy có hào quang trong game.
6. DB: sau khi đạt tầng, bảng `halo_daily` có dòng đúng `day_key` hôm nay và `level` đúng; đăng xuất vào lại trong ngày vẫn còn hào quang.
7. Không lỗi console. Rà soát code: material hào quang được dispose khi đổi tầng / khi nhân vật bị dispose.

### Phần B — bồ đoàn
8. Chụp ảnh: (a) lưới Chính Điện nhìn từ trên cao — thấy khoảng cách thưa + cánh sen; (b) cận cảnh 1 đệm — thấy rõ 2 vòng cánh xen kẽ + nút vàng; (c) thiền đường 2 dãy; (d) deck. Xem ảnh để xác nhận cánh không chồng nhau giữa các đệm kề.
9. Đếm số đệm: Chính Điện 60, Tam Thế 24, deck 72, thiền đường 10 (8 + 2 tụng kinh).
10. Ngồi thử lên 1 đệm ở vị trí mới (ghế ngồi trùng đệm, nhân vật ngồi đúng tâm đệm).
11. Rà soát: không còn chỗ nào gọi `buildZafuParts` mà quên add 2 mesh cánh (grep cả 7 điểm).

### Chung
12. Tin tức: 2 entries mới nằm đầu danh sách (hào quang trước, bồ đoàn sau), LATEST tăng đúng 2.

## COMMIT & PUSH

- `git add` từng file đã sửa (KHÔNG `git add -A`).
- `git pull --rebase origin main` trước, rồi `git push origin main`. Lỗi HTTP 400 thì thử lại 1 lần với `-c http.postBuffer=524288000`. Không force-push. Conflict hoặc lỗi khác thì dừng và báo nguyên văn.
- Commit message: `feat: hao quang thien dinh 2 tang va bo doan canh sen`.
- Báo HEAD mới sau khi push.
