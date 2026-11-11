# Ghi chú bàn giao

## Chạy dự án
- `npm install`
- `npm run dev` chạy cả API (cổng 3001) và Vite (cổng 5173).
- `npm run typecheck` kiểm tra kiểu. `npm run build` cho bản production.
- Thư mục `data` không nằm trong repo, copy riêng nếu cần dữ liệu cũ.

## Commit gần nhất: 605c05d (round 1 + round 2 merged)
Push lên `origin/main` (byluvtn/ChuaOnline).

---

## Round 1 — tượng, kiến trúc, hồ, trời, sân, chữ Việt (XONG)

### Đã làm
- **Tượng Phật Tổ & Quan Âm dựng lại bằng primitive** (`src/statues.ts`):
  MeshStandardMaterial, roughness 0.4–0.7, castShadow + receiveShadow. `buddhaGroup` /
  `guanyinGroup` (buildBuddha / buildQuanAm, giữ export + tên `halo` + `userData.glow`).
  Buddha: lotus base (Cylinder 24seg #d4a373), 12 cánh sen scale (0.28,0.45,0.14) #f4978e,
  chân kiết già, cà sa TubeGeometry #e0a93b roughness 0.3 / metalness 0.4, Dhyana Mudra,
  đầu + Ushnisha + búi tóc + hạt ngọc, tai dẹt dài, halo Torus (R 1.3, ống 0.08, emissive #ffb703)
  8 ngọn lửa, mặt CanvasTexture. Quan Âm: áo trắng Cylinder 0.35→0.85, dải lụa TubeGeometry
  CatmullRom (chữ U sau lưng), tay phải cầm liễu #70e000, tay trái bình cam lộ LatheGeometry
  #e0a93b, khăn trùm đầu, mũ miện vàng + tượng Phật nhỏ. Kích thước nhân với FIG_SCALE để giữ
  "dấu chân" cũ trong sân.
- **Hồ cá về giữa khuôn viên**: `LAKE = {x:0, z:22, a:9, b:6.5}`, cầu cong chạy Bắc–Nam
  (`BRIDGE = {x:0, z0:14.2, z1:29.8, hw:1.15, peak:1.4}`), `bridgeY`/`inLake`/`resolveWater`/
  `blocked` viết lại theo trục z. Quảng trường thu gọn r8.4 tại (0,6).
- **Sửa kiến trúc** (`src/compound.ts::sealArchitectureJoints`): bù dougong/hộp tiếp xúc giữa
  cột–kèo–mái (maxGap ~0.32–1.4), đặt fascia ring dưới mái. Gọi ở corridor, towers, hall, gate, pagoda.
- **Bầu trời xanh yên bình** (`world.ts::MOODS` + `sereneSky`): vo-luong `#dcefff`/`#5aa7e0`,
  tu-bi `#e7f2ff`/`#4f9bd8`, an-lac hoàng hôn tím nhạt. Hết tông bão cát sa mạc.
- **Mặt sân sạch** (`paveCompound`): gỡ hết bụi cỏ khối cứng, lát gạch phẳng + quảng trường tròn
  + lawn phẳng quanh hồ; đài sen to của tượng vẫn giữ.
- **Cột chữ Việt**: `vietnameseColumnTexture` + `vietnamesePlaqueTexture` thay chữ Hán; câu đối 2 cột
  tiền đường là tiếng Việt ("Cửa thiền rộng mở...", "Lòng tịnh an nhiên..."), hoành phi ĐẠI HÙNG BẢO
  ĐIỆN / PHẬT NHẬT TĂNG HUY, bảng chuông/trống Quan Âm/tam quan cũng đổi. `relabelColumns()` quét
  `userData.inscription`.
- **Face + glow dùng chung material/geometry cache** trong statues.ts để clone tượng trong chánh điện không nặng.

### Chưa xong / cần kiểm tra lại
1. **Tỷ lệ tượng Quan Âm**: áo trắng vỏ chóp đọc như "chuông úp" khi vào tháp (đã thấy qua ảnh
   `shots/chibi-guanyin.png` và `chibi-quanam-face.png`). Cần thu hẹp vỏ áo dưới + loe khăn trùm.
2. **Tay Phật bị nén vào thân** ở góc chính diện chánh điện; ngực cà sa gần như không thấy vì
   vỏ áo màu vàng bọc kín thân — muốn giống ảnh mẫu thì bỏ shell phía trước hoặc hở ngực phải rõ hơn.
3. **Cảnh báo "khe kiến trúc còn lại"**: sau khi siết logic kề, hall còn ~28 khe lớn (>0.9m) cần
   chỉnh tay; sealArchitectureJoints ưu tiên khe một trục, cặp chéo góc bỏ qua.
4. **Tượng không kiểm thử runtime đủ góc** — chỉ dùng `steps-chibi.mjs`/`steps-statues.mjs` chụp headless.
   Chưa verify khi 5 tượng trong chánh điện cùng hiển thị (clone `buddhaGroup` có thể lệch glow).
5. **Cá koi bơi vào trong hồ to**: ellipse rx/rz dựa trên `LAKE.a/b` mới, nhưng bán kính lotus/pad chưa
   điều chỉnh theo hồ lớn — cần kiểm tra cá không bơi xuyên lá sen khi hồ đã dời.

---

## Round 2 — cá koi, bồ đoàn, lạy Phật, tụng kinh, nhiệm vụ, shop (XONG về code)

### Đã làm
- **Cá koi vẽ lại** (`src/koi.ts`): mỗi con là Group — thân chép sphere kéo dài + đầu tròn, mắt đen,
  râu, vây lưng mỏng, 2 vây ngực, vây đuôi xòe vẫy trong `update()` (`rotation.y = sin(t*6.5+pha)*0.45`).
  4 mẫu CanvasTexture: Kohaku, Yamabuki, Shiro Utsuri, Hi. 9 con, giữ ellipse + sign(s) hướng như cũ.
- **Bồ đoàn rộng +30%**: cylinder r 0.44→0.49, chiếu 1.43×1.36, bước hàng 1.9 / bước cột 1.7 →
  7×7×2 = 98 chỗ. 8 cánh sen InstancedMesh quanh mỗi bồ đoàn (hồng/trắng xen kẽ, ngửa 0.55 rad).
- **Lạy Phật tự chạy tới bồ đoàn** (`src/main.ts::startBow` + `nearestFreeSeat`): bấm "Lạy Phật" →
  tìm bồ đoàn trống gần nhất toàn sân (bỏ giới hạn 3.2m), set `clickTarget`, nhân vật tự đi bộ tới,
  tới nơi (<0.5m) → `setSitting(true)` rồi lạy. Tự bấm di chuyển giữa đường huỷ hành trình.
- **Cửa sổ tụng kinh** (`src/panels.ts::renderChant`, `shared/game.ts::SUTRAS`): nút "Tụng kinh"
  mở panel (PanelKind `'chant'`), chọn Bát Nhã Tâm Kinh / Chú Đại Bi / Niệm Phật A Di Đà (108 lần),
  chế độ đọc karaoke (line highlight + scrollIntoView), tự gõ mõ theo nhịp (nút bật/tắt + slider
  40–120/phút, mặc định 60). Hoàn thành 1 biến → `socket.emit('sutra:done', id)` → server cộng theo
  `ACTION_RULES.chant` (hỗ trợ boost `nen_sap_ong`, `trang_hat`).
- **Nhiệm vụ mở rộng** (`shared/game.ts`, `server/`):
  - 14 nhiệm vụ ngày (lạy 5 và 10, thắp hương 3 và 5, tụng 2, đèn 1 và 3, chat 3 và 5, thiền 2 và 5 phút,
    tụng 1 bài, mua 1 món, viếng 3 chùa, tích công đức) + 3 nhiệm vụ tuần (`w_merit100`, `w_bow50`,
    `w_sutra10`, id prefix `w_`).
  - `questKey()` dùng `day_key` cho ngày và `week_key` (ISO tuần) cho tuần — không đổi schema.
  - Nhiệm vụ tuần reset thứ Hai (UTC). Thưởng lớn hơn daily.
  - Thưởng mốc cấp: `LEVEL_BONUS = { coinsPerLevel: 10, meritPerLevel: 5 }`, server tự cộng + emit
    `level:bonus` khi `levelOf(after) > levelOf(before)`, lưu bảng `level_rewards`.
  - Thanh tiến độ cấp trong cửa sổ Nhiệm vụ (cấp hiện tại + còn bao nhiêu công đức lên cấp).
- **Shop mở rộng** (`shared/game.ts::ITEMS`, `SHOP_CATEGORIES`, `panels.ts::renderShop`):
  22 món trong 11 tab (Lễ vật, Cây Phật, Áo tràng, Tràng hạt, Bồ đoàn, Mũ, Pháp khí, Mây,
  Linh thú, Diều, Đồ linh thú). `category`, `minLevel`, `boostMerit`. "Mua 5 · giá" cho consumable.
  Khóa theo cấp (`minLevel` thiếu thì `🔒 Cần cấp X`). Giữ nguyên `shop:buy`, `inv:equip`, `renderBag`.
  Không thêm tiền tệ mới — chỉ Sen.

### Chưa xong / chưa kiểm chứng
1. **`startBow` chưa test runtime**: chỉ typecheck; chưa chụp video nhân vật chạy tới bồ đoàn rồi lạy.
   Trường hợp `sitting` sẵn → lạy `doAction('bow')` tại chỗ; chưa thử khi đang ngồi rồi bấm Lạy.
2. **Tụng kinh unfinished edge case**: đóng panel giữa chừng → `cleanup` stops timer/moh (ok),
   nhưng `myActionUntil` / `me.anim = 'chant'` không reset vì client không gửi `chant` nữa —
   nhân vật giữ pose chắp tay cho đến khi `myActionUntil` hết (2.5s, ok).
3. **`level:bonus` chưa chụp UI**: chỉ toast, chưa có panel hiển thị lịch sử mốc cấp.
4. **Boost items chưa rà trong `character.ts`**: `nen_sap_ong`, `trang_hat` cộng công đức nhưng
   không có visual gắn trên nhân vật (chỉ `mu_sen`, `hao_quang`, `khan_do`, `ao_trang` là accessory có model).
5. **Shop chưa test đầy đủ 11 tab** — chỉ chụp tab Lễ vật; các món `minLevel` chưa thử với profile cấp thấp.
6. **`tools/steps-round2.mjs`** là script chụp headless ad-hoc, không vào CI; cần copy flag `STEPS=` khi dùng.
7. **Anh em giữa chánh điện chưa khớp với hồ mới**: vị trí đài sen tượng Quan Âm trong tháp +
   tượng Phật sân Tây (BUDDHA_YARD) vẫn giữ toạ độ cũ, chưa verify có bị hồ mới che khi nhìn từ lối vào.
8. `hoanhPhiTexture` / `coupletTexture` vẫn còn export trong textures.ts (không dùng nữa, để lại
   cho caller khác nếu cần; nếu muốn sạch, xoá sau).

---

## GĐ1 Gói 1 — Gác Trống (commit b3ee146)

### Đã làm
- `layout.ts`: `DRUM = {x:34, z:-6}` + vòng cấm `blocked()` r7.
- `temple.ts`: `COLUMN_LABELS.trong`; `tower()` dùng đúng cặp bảng theo `coupletId` (tháp chuông vẫn dùng `chuong`); dựng `drumTower` (trống trụ nằm ngang R0.85 dài 1.1, 2 mặt da bò, vành vàng + 16 đinh tán/mặt, chân gỗ + đế), glowSpr, zone `trong` r7, 3 `pathRect` lát đá, `ringDrum()` (drumHit decay, rung/nảy ~0.4s trong `update()`). `tower()` nay log `gapdump tower <sign>` ở DEV.
- `couplets.ts`: `COUPLETS.trong`. `world.ts`: phơi `ringDrum`. `main.ts`: timer tự gõ trống mỗi 45s (`lastDrum`, lệch pha 22s so với chuông).
- `tools/steps-drum.mjs`, `tools/steps-drum-walk.mjs`: script chụp + đi thử.

### Kết quả kiểm chứng
- `npm run typecheck`: pass (sau khi sửa trùng tên biến `dt`).
- gapdump: THÁP CHUÔNG filled=5 remaining=0; THÁP TRỐNG filled=5 remaining=0.
- Đi thử nhân vật thật (đặt vị trí rồi giữ phím): từ (30,-6) giữ D 1.5s chỉ tới x=30.19 (bị chặn); từ (34,-2.5) giữ W dừng ở z=-2.69; zone `trong` + popup câu đối hiện đúng.

### Chưa chắc chắn / lưu ý
- `main.ts:769` KHÔNG phải tương tác ở khu chuông mà là timer 45s tự động; đã nhân bản đúng kiểu đó cho trống. Chưa có tương tác chủ động gõ trống/chuông.
- Ảnh `drum-walk-couplet.png` và các ảnh walk chụp khi camera chưa bám nhân vật (freeze) nên không phải góc nhìn tháp trống; ảnh nghiệm thu đúng spec là `drum-plaza-both.png` (chuông + trống một khung) và `drum-front.png` (cận cảnh).
- Chưa kiểm chứng riêng bằng ảnh hiệu ứng `ringDrum` (có `drum-hit.png` nhưng chụp 150ms sau khi gọi, rung biên độ nhỏ).

---

## GĐ1 — Thống nhất kiến trúc tháp chuông/trống

### Đã làm
- `temple.ts` `tower()` viết lại theo chuỗi chuẩn: bệ đá 2 tầng → chân cột đá → cột đỏ → xà dưới/trên → đấu củng → vành xà → mái 1 (ngồi sát vành xà) → cổ mái 4 cột + tường đỏ nửa chiều cao → mái 2 → đế chóp + chóp vàng. Chuẩn được ghi trong comment đầu `tower()`.
- Chuông hạ trục treo còn `by+3.55` để nằm dưới xà.
- `tools/steps-tower-unify.mjs`, `tools/steps-tower-probe.mjs`: script chụp.

### Kiểm chứng
- typecheck pass. gapdump: THÁP CHUÔNG filled=74 remaining=0; THÁP TRỐNG filled=74 remaining=0.
- Probe: miếng bù quanh tháp trống đều là dầm nhỏ trong khung tháp. Khối mái "thừa" sau tháp trống là bảo tháp (38,-14), không phải lỗi.

### Chưa chắc chắn
- Chưa áp chuẩn cho tháp Quan Âm (`qa`) và bảo tháp: khác kiểu (đài 4 cột mở có tượng; tháp 5 tầng), cần quyết định riêng.
- Chóp vàng nhìn từ xa hơi lệch tông với thân đỏ; chưa chỉnh.
- Trống: pivot `by+1.7`, glow `by+3.2` chưa chụp lại sát khung mới.

---

## Chạy / chụp kiểm tra
- `STEPS=./steps-chibi.mjs` hoặc `steps-round2.mjs` với `node tools/shot.mjs <prefix> http://localhost:5173/ 1280 800`.
  Các steps tự bật `window.__co.freeze = true` để khoá camera.
- Tốt nhất chụp sau `npm run dev` + chờ Vite sẵn sàng (hiện dev server có thể đã tắt khi phiên này kết thúc).
- `shots/` đã track trong repo; round 2 chụp gồm `round2-*.png`.

## Sau khi push
- Commit `605c05d`. Nếu cần sửa tiếp: ưu tiên (1) runtime verify `startBow` bằng cách mở chùa thật,
  (2) thu hẹp áo Quan Âm trong tháp, (3) tinh chỉnh khe kiến trúc còn lại, (4) cân nhắc bỏ export
  `hoanhPhiTexture`/`coupletTexture` không dùng.
---

## GĐ1 Gói 5 — Thủy Đình (commit 873bf47)

### Đã làm
- `layout.ts`: `PIER {x0:-10.6,x1:-4.4,z:23,hw:1.6,y:0.55}`, `PIER_RAMP` 1.3 (đoạn dốc ở đầu bờ, tránh nhân vật nhảy bậc), `PIER_FLOOR` (sàn đình, y 0.77). `groundY()` nâng theo cầu gỗ + sàn đình; `resolveWater()` bỏ qua hình chữ nhật PIER (nới 0.2).
- `temple.ts`: nhóm `thuy-dinh`: cầu gỗ có dốc + cọc chìm, sàn đá, 4 cột đỏ, mái `roofGeometry(5.8,5,1.6,0.6)` + chóp vàng, bảng `THỦY ĐÌNH` quay Đông, đèn lồng, lan can 3 phía (Bắc, Nam, Đông; hở phía Tây để vào), 3 chỗ ngồi (Đông/Bắc/Nam), collider 4 cột + lan can, zone `thuyDinh` r4.5. Bỏ đá bờ hồ nằm trên đường cầu.
- `couplets.ts`: `thuyDinh`. `Seat` thêm cờ `rest`; `main.ts::nearestFreeSeat` bỏ qua ghế `rest` khi bấm Lạy Phật (không kéo người chơi ra giữa hồ), nhưng nút Thiền (limit 3.2m) vẫn ngồi được.
- `main.ts` dev hook `__co.walkTo(x,z)`; `tools/steps-thuydinh*.mjs`.

### Kiểm chứng
- typecheck pass; gapdump thuyDinh filled=5 remaining=0.
- Đi thử thật: bờ Tây → lên dốc → sàn đình y=0.77 → ngồi được (ry 0); lan can chặn ở x≈-4.95, z≈21.75 và 24.25; (-5,19.5) bị đẩy ra bờ như cũ; cầu trục đi tới đỉnh y=1.52.
- Đầu cầu gỗ (x0=-10.6) không đè bồn hoa (ảnh b3), không phải dịch PIER xuống 24.2.

### Chưa làm / chưa chắc chắn
- Mục mở rộng 4 (thả đèn khi vào zone `thuyDinh`): không làm. `main.ts` chỉ thả đèn qua nút "Thả đèn nguyện" (modal điều ước, `doAction('lantern', wish)`), không có điểm gọi theo zone.
- Cảnh báo cũ trong spec: nhân vật đi bộ tới ghế bằng ngồi/Thiền, chưa có hành động "ngồi ghế đình" riêng.

---

## GĐ1 Gói 6 — Tượng La Hán dọc hai hành lang

### Đã làm
- `statues.ts`: `buildArhat(variant 0|1|2)`: thân lathe bo tròn + áo tràng 3 màu trầm (vàng đất, xám lam, nâu), đầu trọc dùng lại `buildHead` + `faceTexture` (mắt cong nhắm, không tạc hốc mắt/sống mũi), 3 tư thế tay: để trong lòng / một tay nâng / ôm bát. Cao ~1.15 khi ngồi.
- `temple.ts`: 20 tượng (10/bên) trên bệ đá 0.8×0.55×0.8, z = -17.5 + 1.8k (k=0..9), quay mặt vào trục, collider r0.42.

### Vị trí (đã tính lại, spec cũ lệch)
- Spec ghi "z so le 0.9 so với cột", nhưng bước 1.82 từ -18.2 làm cột (z = -18.4 + 3.6j) trùng tượng ở k chẵn. Dùng z = -17.5 + 1.8k thì mọi tượng cách cột đúng 0.9.
- Ghế dài (hàng trong, z = -16.6, -9.4, -2.2) trùng slot k=1, 5, 9 → các slot đó và k=0, 4, 8 ở hàng ngoài (+side×1.5); k=2,3,6,7 ở hàng trong (-side×1.5). Không cần dịch ±0.3.

### Kiểm chứng
- typecheck pass; gapdump arhats filled=0 remaining=0.
- Đi thử thật dọc tâm lối đi (x=±20.5) từ z=-0.4 tới -18.5 ở cả hai hành lang, không kẹt.
- Ảnh trong `shots/arhat-*.png`.

### Chưa chắc chắn
- Tượng ở hàng trong cách ghế dài ~0.4 về ngang (ghế lệch 1.3, tượng lệch 1.5); chỉ so le về z, nhìn gần hơi sát.
- 3 mẫu tượng clone dùng chung geometry/material; chưa đo hiệu năng trên máy yếu (20 bệ + 20 tượng).
---

## GĐ3 Mục 21 — Tăng xá + Trai đường dọc tường Tây (commit `5b40c7b`)

Mục 22 (Điện Mẫu), 23 (Nhà khách), 24 (Thiền đường) đã có từ commit `d25a7e4`.

### Đã làm
- `layout.ts`: `TANG_XA_TAY (−42.6, −14.5)`, `TRAI_DUONG (−42.6, −1)` (+ `_PLAT`, `_DOOR`). `*_DOOR` là điểm trống trước cửa (x = −39.0) để gắn NPC/shop sau. `groundY()` nâng bệ 0.2; `blocked()` thêm dải x < −37.5 (z −21.5..3.5) và hai hành lang chừa cho lối cửa.
- `temple.ts::longHouse()`: nhà dài thấp (đỉnh mái ~6.2), trục dài Bắc–Nam, hiên 6 cột đỏ + cửa sổ, đèn lồng, bảng tên + 2 câu đối tiếng Việt. Trai đường có thêm ống khói và bàn bếp. Collider cột, tường hậu, hai hồi, tường trước (chừa cửa giữa). Zone `tangXaTay`, `traiDuong` r7. `pathRect` nối từ hiên ra đường dọc x = −28.
- `couplets.ts`: `tangXaTay`, `traiDuong`.
- `compound.ts`: Vườn Thiền bỏ bụi tre x = −44 với z > −23 và hàng rào Nam với x < −38 để nhường chỗ.

### Kiểm chứng
- typecheck pass. gapdump: tang-xa-tay filled=167 remaining=0; trai-duong filled=187 remaining=0.
- Đi thử thật: vào cửa giữa tới x=−42.4 (z −14.5), tới x=−41.8 (z −1). Ra ngoài cửa, tường chặn ở x≈−41.4/−41.1. Zone popup Tăng xá hiện đúng.
- Ảnh: `shots/gd3-21-*.png`, `gd3-21a-*.png` (4 hướng + trục), `gd3-21p-tangxa-inside.png`. Script: `tools/steps-tangxa*.mjs`, `steps-phan-a.mjs`.

### Chưa chắc chắn
- Nội thất mới là khối đơn giản (bệ gỗ, bàn bếp); chưa có bàn ghế/bồ đoàn riêng.
- Biển "TĂNG XÁ" của nhà Tây trùng chữ với tăng xá phía Bắc `TANG_XA` (22, −56). Tên biến `TANG_XA_TAY`/`tangXaTay` tránh trùng; chữ trên biển chưa đổi.
- Vị trí lệch masterplan (−40, −16) thành (−42.6, −14.5) để tránh hàng rào và tre Vườn Thiền.

### Bổ sung sau commit `5b40c7b`
- **Tháp Quan Âm → sân tượng:** bỏ tháp, giữ tượng, đối xứng sân Phật Tổ (`BUDDHA_YARD`). `temple.ts`: khối `qyard` gồm 3 bậc đá bát giác + `buildQuanAm()` scale 1.15, y=1.2, `rotation.y = -π/2 - 0.3`; collider r=4. `layout.ts`: bỏ `QUAN_ROT`, `QUAN_PLAT`, nhánh QUAN trong `groundY()`; `blocked()` bán kính 9 quanh QUAN. `couplets.ts`: bỏ zone `thap`. `server/npcs.ts` vẫn import `QUAN` (không đổi). Ảnh `shots/gd3-qa-*.png`. Hướng quay mặt của tượng chưa được xác nhận.
- **Gộp mesh:** `temple.ts::mergeStaticByMaterial(root)` gọi trong `longHouse` sau `sealArchitectureJoints`, gộp theo material (bỏ qua mesh có `userData.inscription`). Mỗi nhà từ ≈300 xuống 11 mesh; scene 4542 → 3935 mesh, số tam giác không đổi. Biển/bảng không gắn cờ `inscription` cũng có thể bị gộp; ảnh `shots/gd3-21m-*.png` nhìn ổn. Script: `tools/steps-cost.mjs`.
- **FPS (chưa kết luận):** `tools/shot.mjs` mặc định dùng SwiftShader (0.4–0.9 FPS, vô nghĩa). Đo GPU thật cần bản sao tạm của `shot.mjs` đổi sang `--use-angle=metal`. Sau gộp, bật/tắt nhà: Tây 29.3/41.8, Tây-rộng 19.2/29.2; sân chính ≈10 dù bật hay tắt nhà. Lần đo thứ hai (`tools/steps-fps2.mjs`) dao động rất lớn. Chưa thấy bằng chứng rõ về sụt FPS bất thường nhưng số đo nhiễu, nên **chưa coi là đã đóng băng layout**. Nên đo lại trên trình duyệt thật.
- **Sự cố file:** lệnh `rm -f shots/probe-*.png` xóa nhầm 4 file. 3 file đã tracked (`probe-drum-from-north.png`, `probe-drum-from-south.png`, `probe-probe.png`) đã khôi phục bằng `git checkout --`. `shots/probe-plaza-wide.png` chưa tracked nên mất vĩnh viễn.
