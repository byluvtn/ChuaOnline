# Prompt: Học animation + hành động NPC từ chuaonline.org

Mục tiêu: lấy từ client của chuaonline.org (đã phân tích từ bundle của họ — chỉ học cách làm, toàn bộ code tự viết mới theo code của mình) áp vào ChuaOnline, theo đúng thứ tự dưới đây: 1 chớp mắt → 2 pose clip đi/chạy/đứng/ngồi → 3 lấy thêm 2 animation (palms + beads) → 4 crossfade 0.15s → 5 LOD NPC xa → 6 hành động NPC (khách viếng thăm + sư thầy/chuông gắn thời khóa).

**Quy tắc làm việc (bắt buộc):** trước khi làm bất cứ việc gì, tạo **todo list bằng `todowrite`** liệt kê đủ 6 việc dưới đây; luôn chỉ có 1 việc `in_progress`; xong việc nào cập nhật todo list ngay việc đó; mỗi việc **1 commit riêng**. **Giữ nguyên lễ lạy** (`bow` + IK `solveArm` — không đụng, không đổi nhịp 3.0 giây của mình theo 2.6 giây của họ).

## 0. Bối cảnh code hiện tại (đừng đoán, đối chiếu lại trong file)

- `src/character.ts`: `buildCharacter(outfit, color, name)` — H = 2.12, HR = 0.53 (đầu = 50% chiều cao), HEAD_Y = 1.59. Mặt là CanvasTexture 512×512 vẽ trên vỏ sphere trước đầu (`faceTexture(outfit)`, cache theo outfit trong `faceCache`; mesh mặt dùng MeshToonMaterial riêng, map = faceTexture, emissive 0x4a2c16, transparent, polygonOffset −2, renderOrder 2). Tóc: mũ sphere + blob theo outfit. Tay IK 2 xương (`solveArm`) cho lễ lạy — **không đụng vào phần này**.
- `src/toon.ts`: `geo()` cache geometry, `outlined()` outline inverted-hull, `toon()` MeshToonMaterial.
- `src/main.ts`: vòng lặp render update các remote (lerp vị trí/xoay + gọi `animateCharacter` mỗi frame).
- `src/character.ts` `animateCharacter(c, anim, t)`: pose tính trực tiếp bằng sin theo thời gian (đi: speed 9/14, tay đung ngược chân, thân nảy `|sin|*0.09`), đổi anim thì gán `curAnim` ngay (không blend), không có chớp mắt, không LOD.
- Bên kia làm thế này: mặt chớp 2–6 giây/lần, nhắm ~0.12–0.15 giây; bước đi 0.62 giây/bước, tay đung ngược chân, thân nảy 2 lần/chu kỳ; pose là clip 32 kênh đánh giá theo phase, chuyển anim crossfade 0.15 giây; NPC xa thì giảm tần suất update pose, đứng yên thì tắt `matrixWorldAutoUpdate`.

## 1. Chớp mắt (làm trước)

- Vẽ thêm biến thể **mắt nhắm** của `faceTexture(outfit)`: dùng đúng code vẽ hiện tại nhưng thay mắt mở (tròng nâu + highlight) bằng đường cong mí nhắm (như bên kia: quadratic curve nâu). Lông mày, má, miệng, mũi giữ nguyên. Cache biến thể nhắm theo outfit như biến thể mở (`faceCache`).
- Thêm 2 số vào interface `Character` + khởi tạo trong `buildCharacter`: `blinkNext`, `blinkUntil` (giây, theo `t` của `animateCharacter`).
- Trong `animateCharacter`: khi `t >= blinkNext` thì nhắm mắt (đổi `face.material.map` sang texture nhắm) tới `blinkUntil = t + 0.12 + random*0.03`, rồi mở lại và đặt `blinkNext = t + 2 + random*4`. Đổi map thì giữ nguyên material, chỉ đổi `map`.
- Áp dụng cho **mọi nhân vật** (người chơi + NPC sư thầy/chú tiểu — bên kia NPC cũng chớp). **Tượng Phật không chớp** (mặt tượng là texture khác trong `src/statues.ts`, đừng đụng).
- Kiểm chứng: script steps lấy mẫu `face.material.map` của một nhân vật trong 10 giây — phải đổi ít nhất 1 lần; mặt tượng trong cùng cảnh không đổi.

## 2. Animation: pose clip có phase (chỉ đi/chạy/đứng/ngồi)

- Đưa `walk` / `run` / `idle` / `sit` về dạng **clip đánh giá theo phase**: mỗi clip có `period` + hàm tính góc khớp theo phase (0..1 của chu kỳ), giữ nguyên công thức hiện tại (tay đung ngược chân, chân bước, thở) nhưng tính qua phase thay vì `sin(t*speed)` trực tiếp.
- Nhịp bước đi: **0.62 giây/bước** (như bên kia), thân nảy **2 lần mỗi chu kỳ bước**.
- **Không refactor lễ lạy**: `bow` / `chant` / `incense` / `lantern` / `sweep` / `ring` giữ nguyên code procedural + IK như hiện tại.
- Kiểm chứng: đi bộ nhìn bằng mắt qua ảnh chụp — nhịp bước đều, tay/chân ngược pha, thân nảy 2 lần/chu kỳ.

## 3. Lấy thêm 2 animation còn thiếu: palms (chắp tay vái) + beads (lần tràng hạt)

Bên kia có 10 clip pose: incense, lantern, idle, walk, run, sit, bow, palms, sweep, beads. Mình đã có 8 trong 10 (thiếu palms + beads; ngược lại mình có chant + ring mà bên kia không có). Chỉ lấy thêm 2 cái thiếu, **không lấy riding/cưỡi** (lộ trình cấm mounts), **không đổi bow**.

- **`palms` — chắp tay vái (1.5 giây, một chu kỳ):** tay nâng lên, chắp trước ngực, giữ một nhịp, hạ xuống. Làm bằng IK sẵn có (`solveArm` tới `CHEST`, envelope như `prayW`: vào 0.3 giây, giữ, ra 0.3 giây) — không viết pose mới từ đầu.
- **`beads` — lần tràng hạt (2.4 giây, một chu kỳ mỗi lần bấm):** tay phải nâng lên ngang ngực chạm tràng hạt (sư thầy đã có vòng 14 hạt 3D trên ngực), lắc nhẹ nhịp nhàng ~2–3 Hz như đang lần từng hạt, tay trái buông. Các outfit không có tràng hạt vẫn làm động tác tay như thường.
- Cả hai: thêm `'palms' | 'beads'` vào `ActionKind` trong `shared/types.ts` **và** vào danh sách `ANIMS` của `server/index.ts` (server kiểm tra anim, thiếu là bị loại), thêm nút "Chắp tay" + "Lần hạt" vào `#actions` trong `index.html` cạnh các nút lễ hiện có, chạy qua `doAction` trong `src/main.ts` như các lễ khác (tự trở về `idle` sau 1500ms / 2400ms). Chỉ là động tác visual, không thêm luật điểm/công đức.
- NPC chưa dùng 2 anim này — chỉ làm cho người chơi trước.
- Kiểm chứng: 2 nút hiện trong game; bấm mỗi nút thì nhân vật làm đủ chu kỳ rồi về `idle`; client thứ hai nhìn thấy anim qua `state` (không bị server loại).

## 4. Crossfade 0.15 giây khi đổi anim

- Khi `anim` đổi trong `animateCharacter`: chụp nhanh toàn bộ góc khớp hiện tại (tay, cẳng tay, chân, thân) làm pose cũ, rồi trong **0.15 giây** sau đó blend từ pose cũ sang pose mới bằng smoothstep (ease như hàm `ease` đã có).
- Áp dụng cho mọi chuyển anim (đi → đứng, đứng → lạy, v.v.). Riêng tay lễ (prayW) đã có blend riêng thì giữ nguyên, không blend 2 lần.
- Kiểm chứng: lấy mẫu góc xoay tay 0.05 giây sau khi đổi anim — phải nằm giữa pose cũ và pose mới, không nhảy cóc.

## 5. LOD: bỏ qua update pose cho NPC xa

- Trong vòng lặp render ở `src/main.ts`, với mỗi remote là NPC: nếu cách camera **> 30 m** thì chỉ gọi `animateCharacter` tối đa **2 lần/giây**; nếu NPC đứng yên (vị trí không đổi) thì đặt `root.matrixWorldAutoUpdate = false` cho tới khi nó di chuyển lại.
- **Không bao giờ** áp LOD cho người chơi của mình, NPC ở gần (≤ 30 m), hay việc lerp vị trí/xoay (chỉ bỏ qua phần pose animation, vị trí vẫn đồng bộ bình thường).
- NPC tới gần lại phải animate ngay lập tức, không trễ.
- Kiểm chứng: 2 client, 1 NPC đứng xa > 30 m — đếm số lần `animateCharacter` chạy cho NPC đó trong 10 giây phải ≤ 20 lần, trong khi NPC gần vẫn chạy đủ frame; khi NPC xa bắt đầu đi thì pose chạy lại ngay.

## 6. Hành động NPC: khách viếng thăm + sư thầy/chuông gắn thời khóa

Bên kia có 5 NPC (mình mới có 4), sư thầy + chuông gắn với 3 thời khóa mỗi ngày (5:00–5:20, 12:00–12:30, 20:00–20:30 giờ Việt Nam). Làm 3 việc nhỏ dưới đây, đều trong `server/npcs.ts` + ống đồng bộ sẵn có (welcome/state), không viết ống NPC mới.

- **6a. Khách viếng thăm (npc5, phật tử đi lễ):** NPC thứ 5, outfit lay (nam/nữ), scale 1.0, `role` thêm `'lay'` vào `PlayerState` trong `shared/types.ts`. Vòng lặp: xuất hiện ở Tam Quan → đi tới trước bàn thờ chính điện → lạy (`bow`) → tụng (`chant`) một lúc → đi ra sân → lặp lại. Dùng đúng cơ chế NPC hiện có (có trong `welcome.players`, không tính vào số online, không gửi `player:join`, phòng trống thì đóng băng).
- **6b. Sư thầy giữ thời khóa:** trong 3 khung giờ thời khóa (tính theo **múi Asia/Ho_Chi_Minh**, không dùng giờ local của server — server Render ở Singapore UTC+8, lệch 1 tiếng), sư thầy npc1 tạm dừng đi lang thang, đi vào ngồi (`sit`) trước bàn thờ trong chính điện. Mỗi 10 phút trong giờ, server gửi 1 tin chat từ sư thầy (qua kênh chat hiện có) nhắc niệm Phật — tự soạn 3–4 câu ngắn bằng tiếng Việt, luân phiên. Cuối giờ, sư thầy đọc 1 tin: số người đang ở trong phòng (đếm từ roomSessions của server) + câu khích lệ; rồi quay lại đi lang thang. Số lạy/số bài kinh của đại chúng CHƯA làm (cần theo dõi R1) — không làm trong việc này.
- **6c. Chuông gắn thời khóa:** tiểu đánh chuông npc4 thỉnh chuông liên tục ~1 phút vào đầu mỗi thời khóa (5:00, 12:00, 20:00) + chuông chiều 18:00. **Bỏ bộ đếm kêu chuông mỗi 45 giây hiện tại** (thay bằng lịch thời khóa này); trống vẫn giữ bộ đếm cũ.
- **KHÔNG làm trong gói này:** sư thầy làm chủ trò minigame (giấu hòm báu, nối từ, mời chơi) — cần hệ chat + game + quà, để R1/R2 sau.
- Kiểm chứng: chỉnh đồng hồ test hoặc chờ tới giờ — sư thầy ngồi điện trong giờ, nói chuyện mỗi 10 phút, đọc số người cuối giờ; npc4 thỉnh chuông ~1 phút đầu giờ; npc5 đi đủ vòng cổng → bàn thờ → lạy/tụng → sân; ngoài giờ mọi NPC chạy như cũ.

## 7. Nghiệm thu chung

- `npm run typecheck` + `npm run build` pass sau từng việc.
- Chụp kiểm tra theo từng việc (script steps riêng cho blink/crossfade/LOD), ảnh vào `shots/`.
- Không sửa server, không sửa tượng, không sửa lễ lạy IK.

> Nhiệm vụ: làm 6 việc trên theo đúng thứ tự (1 chớp mắt → 2 pose clip đi/chạy/đứng/ngồi → 3 palms + beads → 4 crossfade 0.15s → 5 LOD NPC xa → 6 hành động NPC), mỗi việc 1 commit riêng. **Việc đầu tiên là tạo todo list bằng `todowrite` liệt kê đủ 6 việc, rồi mới bắt đầu làm.** Học cách làm từ chuaonline.org (chớp mắt 2–6s, bước 0.62s/bước, crossfade 0.15s, LOD theo khoảng cách; 2 animation palms 1.5s + beads 2.4s; NPC thứ 5 phật tử đi lễ; sư thầy giữ thời khóa + chuông đầu giờ) nhưng toàn bộ code tự viết mới theo code ChuaOnline hiện tại, **giữ nguyên lễ lạy**. Chạy `npm run typecheck` + `npm run build` sau từng việc, chụp kiểm tra theo mục 7 rồi mới báo xong.
