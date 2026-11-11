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

## GĐ3 Mục 21 — Tăng xá + Trai đường dọc tường Tây (commit `aa97684`; code Quan Âm + gộp mesh ở `0dfbf6d`)

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

---

## R1.1 — Điểm danh 7 ngày + streak (commit `8e6a5cb`; bước 0 sửa biển `101d2a5`)

### Đã làm
- **Bước 0:** biển nhà Tây đổi thành "TĂNG XÁ TÂY" (`temple.ts`). `signTexture` (`textures.ts`) tự thu cỡ chữ khi chữ rộng quá 440px; biển cũ không đổi. Ảnh `shots/r11-sign-tangxatay.png`.
- `shared/game.ts`: `CHECKIN_REWARDS` (7 ngày, ngày 7 kèm `den_hoa_dang`), `CheckinState`, `CheckinAck`.
- `server/db.ts`: bảng `checkins` (tạo lúc boot, `CREATE TABLE IF NOT EXISTS`), `checkinState()`, `claimCheckin()` (một lệnh upsert nguyên tử, `rowsAffected` quyết định). Dùng nguyên `dayKey()` (ngày UTC, reset 07:00 giờ VN), không sửa `dayKey()`.
- `server/index.ts`: `checkin:get`, `checkin:claim` (thêm item trước, rồi `grantRewards`), và emit `checkin` sau `pushQuests` trong handler `join`.
- Client: `src/features/checkin.ts` (panel 7 ô, ✓ / sáng / mờ, dòng "Chuỗi điểm danh: X ngày · Tổng lượt: Y"), nút "Điểm danh" trong `menu.ts` + icon `checkin` + chấm đỏ (`.checkinDot`) bật khi vào chùa chưa nhận, tắt sau khi nhận. CSS ở `menu.css`.

### Kiểm chứng
- typecheck pass.
- `node tools/steps-verify-checkin.mjs` (server riêng + DB tạm trong thư mục tạm, không đụng DB thật/Turso): 19/19 PASS.
  - Lần đầu: streak 1, ngày 1, +3 công đức/+5 xu, profile đẩy về client.
  - Lần 2 cùng ngày (kể cả 5 lệnh song song): chặn, profile không đổi.
  - last_day = hôm qua: streak 2, ngày 2, +5/+5.
  - last_day = 2 ngày trước: state hiển thị 0, claim về streak 1, ngày 1.
  - streak 6 + hôm qua: ngày 7, +30/+30, túi +1 `den_hoa_dang`; ngày kế tiếp: streak 8, ngày chu kỳ 1.
- Ảnh: `shots/r11-menu-dot.png` (nút Điểm danh + chấm đỏ), `r11-panel-before.png`, `r11-panel-after.png`. Script chụp: `tools/steps-r11-checkin.mjs`.

### Chưa chắc chắn
- Streak/ngày game theo UTC (reset 07:00 VN); chưa có hàm giờ VN, thuộc R1.4.
- Chưa thử trên mobile/cảm ứng. Thông báo thưởng dùng `ctx.toast`, chưa có hiệu ứng riêng.
- Bảng `checkins` tự tạo trên Turso khi server Render khởi động lại; chưa deploy.
- Chưa làm R1.2 (hòm thư) và các mục khác.

---

## R1.2 — Hòm thư + quà chào mừng (commit `ed8da1b`)

### Đã làm
- `shared/game.ts`: `MailGift`, `MailItem`, `MailAck`.
- `server/db.ts`: bảng `mail` + index `idx_mail_player` và bảng `app_meta` (tạo lúc boot). Hàm `sendMail` (bỏ item lạ qua `ITEM_BY_ID` + log cảnh báo, gói rỗng lưu NULL), `mailList`, `mailUnread`, `markMailRead`, `claimMail` (UPDATE có điều kiện `claimed = 0 AND gift IS NOT NULL`, mọi truy vấn khóa `player_id`). Gói quà `MAIL_STARTER_GIFT` = 20 công đức, 30 xu, `huong_tram` ×2, `nen_sap_ong` ×1, `den_hoa_dang` ×1; nội dung thư chào mừng/ra mắt là hằng số `WELCOME_MAIL`/`LAUNCH_MAIL` ở một chỗ.
- Thư chào mừng: gọi sau INSERT trong `createGuest()` và nhánh INSERT của `register()`; nhánh nâng cấp khách không gửi. Lỗi gửi thư chỉ log, không làm hỏng tạo tài khoản.
- Thư ra mắt: `grantLaunchMail()` chạy lúc boot ngay sau khi tạo bảng, trong một transaction: nếu `app_meta.mail_launch_v1` chưa có thì `INSERT ... SELECT` cho mọi `players` rồi ghi cờ. Log `[db] mail launch grant: N thư`. Trên production tự chạy ở lần boot đầu sau deploy, không cần lệnh tay.
- `server/index.ts`: emit `mail { unread }` trong `join`; `mail:list`, `mail:read` (mailId phải là số hữu hạn), `mail:claim` (addItem từng món trước, rồi `grantRewards`).
- Client: `src/features/mail.ts` (nút "Hòm thư" + chấm đỏ `.mailDot`, panel danh sách / chi tiết / nút Nhận quà, thông báo bằng `ctx.toast`), icon `mail` trong `icons.ts`, CSS `.mrow`/`.mgift`... trong `menu.css`, nối vào `menu.ts`.

### Kiểm chứng
- `npm run typecheck` pass.
- `node tools/steps-verify-mail.mjs` (DB tạm, không đụng DB thật/Turso): 30/30 PASS, gồm:
  - Khách mới: 1 thư welcome, event `mail` unread = 1. Đăng ký mới: 1 thư welcome. Khách nâng cấp: vẫn 1 thư.
  - Nhận quà: công đức 40→60, xu 0→30 (đúng +20/+30), túi đủ 3 món; nhận lần 2 và 4 lệnh song song bị chặn, profile không đổi.
  - Người chơi B claim/read thư của C: bị chặn, `read_at` vẫn NULL, `claimed` = 0.
  - Đọc thư: unread giảm, đọc lại không lỗi, mailId không phải số trả lỗi gọn.
  - Ra mắt: 2 người chơi cũ, boot 2 lần liên tiếp (log 2 thư rồi 0 thư), mỗi người đúng 1 thư `launch`; người chơi tạo sau khi cờ set không có thư launch; boot lần 3 không phát thêm.
  - Thư không quà (`sendMail(..., null)`): claim bị chặn, đọc bình thường.
- Ảnh (chụp trên DB tạm bằng `tools/steps-r12-mail.mjs`): `shots/r12-menu-dot.png` (nút Hòm thư + chấm đỏ), `r12-list.png` (danh sách, thư chưa đọc có chấm, dòng tóm tắt quà), `r12-open.png` (thư mở ra với nút Nhận quà), `r12-claimed.png` (nút "Đã nhận quà"). Chưa nén: máy chưa có pngquant/oxipng, ảnh giữ nguyên bản PNG của `shot.mjs`, giống r11-*.

### Chưa chắc chắn
- Test ra mắt dùng DB cũ tự dựng (chỉ bảng `players` rồi boot); chưa chạy trên bản sao DB thật 72 tài khoản.
- Chưa thử mobile/cảm ứng. Danh sách giới hạn 50 thư, chưa có phân trang. Chưa có xóa thư (theo spec).
- Chấm đỏ chỉ cập nhật khi đọc/nhận hoặc vào chùa; thư mới gửi lúc đang online (R3.1) sẽ cần event đẩy riêng.
- Chưa deploy: bảng `mail`/`app_meta` và thư ra mắt sẽ tự tạo ở boot đầu trên Render/Turso.
- Chưa làm R1.3 trở đi.

---

## R1.3 — Vòng quay may mắn + ghi bù "Có gì mới" + sửa UI điện thoại
Baseline mới: `main` sau 4 commit R1.3 (trước đó `1ee97b0`). Commit: `d75ff79` (ghi bù news), `72d13ec` (vòng quay), `ce58118` (UI điện thoại), cộng commit HANDOFF này.

### Đã làm
- **Bước 0 (`d75ff79`):** `src/data/news.ts` thêm entry "Hòm thư nhà chùa" và "Điểm danh mỗi ngày", `LATEST_NEWS_ID` 1 → 2 (cả đợt chỉ tăng một lần). Quy ước đứng: mỗi tính năng ra mắt phải có entry trong file này, nếu không coi như chưa xong nghiệm thu.
- **Vòng quay (`72d13ec`):** `shared/game.ts` có `SPIN_SEGMENTS` (8 ô, tổng weight 100), `drawSpinSegment(rng)` thuần, kiểu `SpinState`/`SpinAck`. `server/index.ts`: emit `spin { used }` lúc join, `spin:get`, `spin:play`. Lượt quay dùng lại `minigame_daily` (game `'quay'`, cap 1) qua `db.claimMinigame`, không có bảng mới. Lượt bị tiêu TRƯỚC khi rút ô; thưởng đi qua `grantRewards` (nhiệm vụ merit, bonus lên cấp, `pushProfile`), item qua `db.addItem`. `moh`/`memory` không đổi.
- Client: `src/features/spin.ts` (vòng 8 ô bằng CSS `conic-gradient` + nhãn xoay, kim cố định ở đỉnh, nút QUAY ở tâm), thẻ đầu tiên "Vòng quay may mắn" trong `games.ts`, chấm đỏ `.gamesDot` ở nút Trò chơi (`menu.ts`, `initSpin`). Quy ước góc: ô i chiếm `[i×45°, (i+1)×45°)` theo chiều kim đồng hồ từ đỉnh; ack `segment = k` → xoay tới `360×5 + (360 − (k×45 + 22.5))` độ, 4,5 s `cubic-bezier(0.12, 0.8, 0.08, 1)`. Entry news "Vòng quay may mắn" đã thêm (không tăng `LATEST_NEWS_ID`).
- **EV vòng quay (ghi theo spec):** ≈ 16,1 công đức + 11 xu + 7% Hương trầm mỗi lượt. Ô lớn nhất ĐẠI CÁT 100 công đức + 100 xu (weight 5) nằm trong trần Phần B (merit ≤ 100, xu ≤ 200). Chưa đổi số nào.
- **Sửa UI điện thoại (`ce58118`)**, chỉ trong `@media (max-width: 760px)` / `body.touch`: `#chat` mở là flex cột, `max-height: min(46dvh, 100dvh − 442px − safe-area)` (số thứ hai giữ cạnh dưới chat cách nút Mở rộng, không chạm joystick trên màn thấp), `#msgs` co giãn và cuộn trong, `#chatForm` dính đáy, `#chat` z-index 9 (> joystick 8), `#chatInput` 16px, `#chatToggle` 40×40. Khi thanh menu thu gọn, nút Mở rộng chuyển thành nút nổi `left: 12px; bottom: calc(228px + safe-area)`, 64×56px. Desktop, kéo/thả joystick, logic thu gọn, nội dung chat không đổi.

### Kiểm chứng
- `npm run typecheck` pass (trước mỗi commit).
- `node tools/steps-verify-spin.mjs` (DB tạm, spawn server thật): tất cả PASS:
  - Khách mới: event `spin` used=false; `spin:get` used=false.
  - `spin:play`: ok, segment ∈ [0,7], ack merit/coins/item khớp `SPIN_SEGMENTS[segment]`; profile tăng ≥ thưởng ô (lần chạy cuối: ô +25 → merit 0→30 do bonus lên cấp, coins 0→10); túi +1 đúng món nếu ô có item.
  - Lần 2 cùng ngày: ok=false, used=true, profile không đổi. 4 lệnh song song: đúng 1 ok, `minigame_daily` count = 1.
  - Phân phối 20.000 lần: +10=22,4% | 15 xu=15,9% | +15=18,5% | 30 xu=11,5% | +25=11,9% | Hương trầm=7,3% | +40=7,6% | ĐẠI CÁT=5,0%. Mọi ô trúng ≥ 1; ĐẠI CÁT trong 2–9%; ô weight ≥ 16 ≥ nửa kỳ vọng.
  - `minigameCount('moh')` vẫn 0 sau khi quay; `minigame:reward 'moh'` vẫn nhận +3/+2. Dòng `quay` của hôm qua (UTC) → `spin:play` vẫn ok.
- Ảnh vòng quay (`tools/steps-r13-spin.mjs`, DB tạm, 1280×800): `shots/r13-dot.png` (chấm đỏ ở Trò chơi), `r13-wheel.png` (8 ô đọc được + nút QUAY), `r13-result.png`. Đối chiếu tay: lần chụp cuối kim chỉ ô "15 xu" (rot = 2092,5°, góc dưới kim 67,5° → ô 1) và dòng kết quả "Chúc mừng: 15 xu!"; sau khi quay chấm đỏ tắt và thẻ Trò chơi đổi thành "Đã quay hôm nay · Mai quay tiếp nhé".
- Ảnh điện thoại (`tools/steps-r13-mobile.mjs`, Chrome headless, `?touch=1`, 390×844 và 360×740, DB tạm): `shots/r13-m-chat-open.png`, `r13-m-chat-typing.png`, `r13-m-bar.png`, `r13-m360-chat-open.png`, `r13-m360-bar.png`. Số đo thật ở 390×844: chat 242×388 (top 138, bottom 526), ô nhập trong khung và là phần tử nhận chạm (`elementFromPoint` = `chatInput`), joystick top 628 → cách chat 102px; `#msgs` scrollHeight/clientHeight = 1086/292 (cuộn trong). Chạm vào ô nhập → focus; gõ + Enter → tin "Con xin gõ thử trên điện thoại" xuất hiện cuối danh sách. Nút Mở rộng 64×56 ở (17, 555)–(81, 611), cách joystick 17px, bấm được (`elementFromPoint` = `mtoggle`, bấm lại thì mở thanh). 360×740: chat bottom 436, joystick top 524, nút Mở rộng cách joystick 17px.
- Kéo joystick khi chat đang mở: nhân vật di chuyển được (z 9,55 → 7,36 ở 390×844; 9,4 → 7,2 ở 360×740).
- Ảnh desktop 1280×800 `shots/r13-desktop.png`: chat vẫn 340px neo đáy trái (rect 12,452–352,708), bố cục không đổi.

### Chưa chắc chắn / việc còn treo
- Chưa thử trên điện thoại thật: bàn phím ảo thật có đẩy/che khung chat hay không chưa được kiểm; ảnh chụp dùng giả lập cảm ứng của Chrome headless.
- Giả lập `pointer: coarse` của `shot.mjs` không bật `body.touch`; script mobile phải dùng `?touch=1`.
- Vòng quay chưa thử với mạng chậm/ngắt giữa chừng trên máy thật; thiết kế đã bảo đảm quà vào tài khoản trước khi ack. Nếu mất ack, client hiển thị lại trạng thái "đã quay" ở lần vào sau (event `spin` lúc join).
- Ngày quay tính theo `dayKey()` UTC (như moh/memory), chưa là mốc 07:00 VN như văn bản UI nói; thuộc R1.4 cùng điểm danh.
- Chấm đỏ Trò chơi chỉ cập nhật khi vào chùa hoặc sau khi quay; không đẩy trực tiếp lúc qua ngày (R3.1).
- Ảnh PNG chưa nén (chưa có pngquant/oxipng).
- Chưa deploy; không có bảng DB mới nên không cần migration.
- Chưa làm R1.4 trở đi.

---

## R1.4 — Hệ số công đức theo giờ lễ & ngày âm lịch
Baseline mới: `main` sau commit `7517090` (trước đó `0adb61e`), cộng commit HANDOFF này.

### Đã làm
- **`shared/time.ts` (mới, thuần, dùng chung server/client):** `ictParts(d)` (Intl `Asia/Ho_Chi_Minh` + `formatToParts`), `solarToLunar(d, m, y)` (thuật toán Hồ Ngọc Đức, múi +7, tự cài, không thêm package), `meritBoost(d)` trả `{ mult, session, lunarDay, holy }`; hằng `SESSION_HOURS = [5, 12, 20]`, `SESSION_MULT = 2`, `LUNAR_MULT = 1.5`. Cửa sổ giờ lễ là `[h:00, h+1:00)` giờ ICT; ngày âm tính từ NGÀY ICT (không phải ngày UTC).
- **Server (`server/index.ts`):** `action` (sau khi áp vật phẩm boost) và `sutra:done` tính `finalMerit = Math.round(merit × meritBoost(new Date()).mult)` rồi `grantRewards`. Xu giữ nguyên (action +1, kinh +0). Ack `sutra:done` trả số đã nhân. Lúc join, sau `spin`, emit `boost` (mỏ neo hiển thị). Thiền, điểm danh, vòng quay, thư, nhiệm vụ, minigame KHÔNG đổi; `dayKey()` (UTC) KHÔNG đổi.
- **Client:** `#boostBanner` trong `index.html` (cạnh `#medBanner`), style ở `src/style.css`, logic `src/features/boost.ts` (`initBoost` nối trong `menu.ts` cạnh `initSpin`): nghe `boost` từ server rồi tự tính lại mỗi 30 giây bằng `meritBoost(new Date())`, chỉ để hiển thị. Vị trí: `top: 186px` (desktop, `body.touch` và `max-width: 760px` cùng 186px); `#medBanner` ở `top: 142px`, nên banner hệ số nằm dưới banner thiền, không chồng.
- **News:** entry "Giờ lễ nhân công đức" đứng đầu `NEWS`, `LATEST_NEWS_ID` 2 → 3.

### Bảng hệ số và làm tròn
| Điều kiện (giờ/ngày ICT) | Hệ số |
|---|---|
| Không có | ×1 |
| Giờ tụng kinh 05:00, 12:00, 20:00 (mỗi cửa sổ đúng 60 phút) | ×2 |
| Mùng 1 hoặc Rằm âm lịch (cả ngày) | ×1,5 |
| Giờ tụng kinh trùng Mùng 1/Rằm | ×3 |

`Math.round(merit × hệ số)`, 0,5 làm tròn lên. Gốc 1 → 2 / 2 / 3; gốc 2 → 3 / 4 / 6; gốc 5 → 8 / 10 / 15; gốc 15 → 23 / 30 / 45 (ứng với ×1,5 / ×2 / ×3).

### Chữ nổi "+N công đức" (Bước 3)
Thuộc trường hợp **suy ra từ delta profile**: `updateProfileHud` (`src/main.ts:233`) so `profile.merit` mới với `lastMerit`, nên tự đúng số đã nhân, không phải sửa. Toast tụng kinh (`src/panels.ts:217`) dùng `r.merit` từ ack nên cũng đúng. Lưu ý có sẵn từ trước: chữ nổi tính cả bonus lên cấp nếu cùng đợt cập nhật profile.

### Kiểm chứng
- `npm run typecheck` pass.
- `node tools/steps-verify-boost.mjs` (DB tạm, server thật): TẤT CẢ PASS (31 kiểm tra):
  - `solarToLunar`: 17/02/2026 → 01/01/2026; 29/01/2025 → 01/01/2025; 10/02/2024 → 01/01/2024; 06/10/2025 → 15/08/2025; 17/09/2024 → 15/08/2024; 11/11/2026 → ngày âm 3 (không thuộc {1, 15}).
  - `meritBoost` 10 mốc ICT trong spec đều đúng (04:59 ×1; 05:00 ×2; 05:59 ×2; 06:00 ×1; 12:30 ×2; 20:00 ×2; 21:00 ×1; 17/02/2026 08:00 ×1,5; 05:15 ×3; 06/10/2025 13:00 ×1,5). Thêm 2 mốc ranh giới ngày ICT/UTC: 17/02/2026 00:30 ICT (vẫn 16/02 theo UTC) → ×1,5; 16/02/2026 23:30 ICT → ×1.
  - Bảng làm tròn 4 hàng × 3 cột đúng.
  - E2E: event `boost` lúc join khớp helper; thắp hương +round(1×mult), xu +1; có Hương trầm: +round(5×mult), món bị tiêu (1 → 0), xu +1; `sutra:done` ack `merit` = round(2×mult), DB khớp ack, xu +0. Lúc chạy là 12:3x ICT (giờ tụng kinh) nên mult thực = 2: thắp hương +2, Hương trầm +10, kinh +4.
  - Hồi quy: khách mới (merit đặt sẵn 100 để không lên cấp, nên không có bonus cấp) điểm danh ngày 1: ack và DB đúng +3 công đức / +5 xu, không bị nhân.
- Ảnh (`tools/steps-r14-shots.mjs` qua `tools/shot.mjs`, DB tạm, 1280×800; đồng hồ client giả lập bằng `Page.addScriptToEvaluateOnNewDocument` ghi đè `Date`, chỉ trong phiên chụp, không có mã debug trong production): `shots/r14-banner.png` (đồng hồ giả 05:30 ICT 11/11/2026, banner "Giờ tụng kinh · Công đức ×2"), `shots/r14-news.png` (entry "Giờ lễ nhân công đức" trên cùng), `shots/r14-banner-with-meditation.png` (đã chèn `#medBanner` bằng script để kiểm không chồng; đọc từ ảnh, `#medBanner` kết thúc khoảng y=175, `#boostBanner` bắt đầu khoảng y=186, cách khoảng 10px).

### Chưa chắc chắn / việc còn treo
- E2E server chỉ chạy được ở mult thực lúc chạy (×2 lúc 12:3x ICT); các mốc ×1, ×1,5, ×3 chỉ được kiểm ở mức unit (`meritBoost` + bảng làm tròn), chưa qua socket vì server dùng đồng hồ thật.
- Lần chạy cuối của script ảnh không in log (stdout bị chặn do script chạy quá timeout của công cụ); khoảng cách banner ghi ở trên đọc từ ảnh, không phải số đo `getBoundingClientRect`.
- (Đã xử lý ở rider R1.5: banner ẩn khi chat mở trên điện thoại.) Ban đầu chưa thử trên điện thoại: offset 186px dùng chung cho mọi cỡ, chat mở ở `top: 138px` chạm banner.
- Banner dựa vào đồng hồ máy khách để tự cập nhật mỗi 30 giây; máy khách sai giờ chỉ làm banner lệch, số thật vẫn do server quyết định.
- Ngày điểm danh/vòng quay/minigame vẫn theo `dayKey()` UTC (UI nói 07:00 VN); không đổi trong R1.4 theo spec.
- Chưa có thông báo đẩy khi sắp tới giờ lễ (R4.3). Chưa deploy; không có bảng DB mới.
- Chưa làm R1.5 trở đi.

## R1.5 — Thống kê tích lũy trọn đời & mốc thành tựu (+ rider banner giờ lễ trên điện thoại)
Baseline mới: `main` sau commit `8b87c49` (trước đó `44a8628` feat R1.5, `0d10619` docs), cộng commit HANDOFF này.

### Đã làm
- **DB (`server/db.ts`):** bảng `player_stats` (`bows`, `chants`, `lanterns`, `meditate_sec`, `beads_rounds`) và `stat_rewards` (PK `player_id, milestone_id`). Hàm `bumpStat(id, key, delta)` upsert nguyên tử bằng `INSERT … ON CONFLICT DO UPDATE … RETURNING`, trả giá trị mới; tên cột chỉ lấy từ bảng ánh xạ cố định `STAT_COLUMNS`, không nội suy chuỗi từ client. `getStatValue`, `getStats` (đủ 5 số, 0 nếu chưa có dòng), `claimStatReward` (INSERT OR IGNORE → boolean, theo mẫu `claimLevelReward`), `claimedStatRewards`.
- **Điểm đếm (`server/index.ts`, helper `countStat`/`countStatSafe`):** `action` sau cổng cooldown và sau nhánh early-return palms/beads: `bow` → bows, `chant` → chants, `lantern` → lanterns; `incense` KHÔNG đếm. `sutra:done` (sau cổng cooldown) → chants +1. Tick thiền: mỗi người đang ngồi +10 giây `meditate_sec` (cùng vòng `grantRewards`). Đếm nằm sau khi thưởng gốc xong; lỗi đếm chỉ log `[stats]`, không làm hỏng hành động.
- **Mốc (`shared/game.ts`):** `STAT_MILESTONES` 12 mốc đúng như spec (bow 100/300/1000, chant 50/200/500, lamp 20/50/150, med 30/60/180 phút tính bằng giây), kiểu `StatKey`, `PlayerStats`, `StatsState`, `MilestoneEvent`, thêm `StatsAck`.
- **Trao thưởng:** sau mỗi `bumpStat`, với từng mốc đã vượt: `claimStatReward` TRƯỚC, rồi `addItem` (nếu có), `addRewards(pid, 0, coins)`, `pushProfile`, emit `milestone` và `stats`. Chỉ xu + vật phẩm, không công đức, không qua `grantRewards` (không kích hoạt nhiệm vụ 'merit' hay bonus cấp).
- **Socket:** emit `stats` lúc join (sau `boost`); handler `stats:get` trả `StatsAck { ok, state }`.
- **Client:** `src/features/stats.ts` (`initStats` nối trong `menu.ts` cạnh `initBoost`: nghe `stats`, nghe `milestone` → `ctx.toast`; `renderStatsSection` vẽ từ cache rồi gọi `stats:get` làm mới). `src/features/levels.ts` thêm mục "Thành tựu tích lũy": 4 dòng (Lạy Phật / Tụng kinh / Thả đèn / Ngồi thiền, thiền hiển thị bằng phút), thanh tiến độ từ ngưỡng trước tới ngưỡng sau, 3 chip (đã nhận = vàng + ✓, mốc kế = viền sáng, chưa tới = mờ), hết mốc thì ghi "Đã đạt tất cả các mốc". CSS ở cuối `src/menu.css` (`.st*`).
- **News:** entry "Thành tựu tích lũy" đứng đầu `NEWS`, `LATEST_NEWS_ID` 3 → 4.

### Rider: banner giờ lễ vs khung chat trên điện thoại (`src/features/boost.ts`)
`render` ẩn `#boostBanner` khi `matchMedia('(max-width: 760px)')` khớp VÀ `#chat` không có class `collapsed`. Cập nhật tức thì nhờ `MutationObserver` trên thuộc tính `class` của `#chat` (bao cả nút `#chatToggle` lẫn mã khác) và listener `change` của media query, cộng nhịp 30 giây sẵn có. Không đổi CSS vị trí; desktop và điện thoại-khi-chat-đóng giữ nguyên.

### Kiểm chứng
- `npm run typecheck` pass (trước cả hai commit).
- `node tools/steps-verify-stats.mjs` (DB tạm, server thật, helper `.mts`): TẤT CẢ PASS (19 kiểm tra). Cooldown: mỗi kind dùng một khách riêng; ca "lạy lần 2" chờ ≥ 1,2 giây sau 0,9 giây sẵn có (cooldown lạy 2 giây).
  - Khách mới: `stats:get` và event join đều 5 số 0, `claimed` rỗng.
  - bow/chant/lantern mỗi kind +1 đúng cột, các cột khác giữ 0; incense không đổi gì.
  - `sutra:done` (bài đầu trong SUTRAS) làm chants từ 1 lên 2.
  - Thiền: ngồi ~26 giây → `meditate_sec = 30` (bội số 10, ≥ 2 tick).
  - bows đặt sẵn 99 qua `bumpStat`, lạy 1 lần → đúng 1 event `bow100`, xu +21 (1 của hành động + 20 mốc), `claimed` chứa `bow100`; lạy tiếp → không event mới, xu +1.
  - Mốc có quà: bows 399 → `bow300` tặng 1 Nến sáp ong, xu +51.
  - `claimStatReward` gọi 2 lần cùng mốc → true rồi false.
  - Ngắt kết nối, vào lại cùng tài khoản: stats và claimed giữ nguyên, event join khớp.
  - Hồi quy: thắp hương công đức = `Math.round(1 × mult)` tại thời điểm chạy (chạy lúc mult = 1: +1 công đức, +1 xu).
- Ảnh (DB tạm `/tmp/co-r15/db.db`, `tools/shot.mjs`):
  - `shots/r15-panel.png` (1280×800, script `tools/steps-r15-panel.mjs` dựng tài khoản có bows 137, chants 62, lanterns 8, thiền 2400 giây, mốc đã nhận bow100/chant50/med30): đủ 4 dòng, thanh tiến độ, chip đọc được.
  - `shots/r15-m-banner-chat-open.png` và `shots/r15-m-banner-chat-closed.png` (390×844, `?touch=1`, `tools/steps-r15-banner.mjs`, đồng hồ client giả lập 05:30 ICT như R1.4). Số đo từ script: chat mở → `banner hidden=true`; chat thu gọn → banner hiện "Giờ tụng kinh · Công đức ×2", banner top=186 bottom=234, chat top=138 bottom=180, khoảng cách 6px, không chồng.

### Lưu ý
- **`beads_rounds`:** cột có sẵn nhưng chưa đếm và chưa có mốc. Sự kiện "hoàn thành 1 vòng 108 hạt" chỉ tồn tại khi R2.2 (giao diện lần hạt) làm xong; đếm số lần bấm animation beads là vô nghĩa. Mốc tràng hạt bổ sung trong spec R2.2 (thêm vào `STAT_MILESTONES` + dòng thứ 5 trong `stats.ts`).
- **Số liệu bắt đầu từ 0** cho mọi người chơi khi tính năng lên sóng, không hồi tố (không có dữ liệu nguồn). Tin "Có gì mới" nói "từ nay" để phản ánh đúng điều này.
- Hai hành động liên tiếp cùng vượt mốc chỉ nhận thưởng một lần nhờ `INSERT OR IGNORE`. Nếu người chơi vượt nhiều mốc cùng một bước (ví dụ helper cộng lớn), vòng lặp trao hết các mốc đã đủ ngưỡng.
- Thưởng mốc cộng xu trực tiếp nên không hiện chữ nổi công đức; người chơi thấy toast "Đạt mốc thành tựu…".
- Khi chạy ảnh banner, script phải chờ vào chùa xong (`__co.me()`) rồi mới đọc banner; lần đầu gặp banner rỗng chỉ do chưa vào chùa, không phải lỗi mã.

### Việc còn treo
- Mốc tràng hạt + đếm `beads_rounds` (R2.2). Bia đá vinh danh (R3.3). Chưa deploy.
- Chưa chạy E2E bằng trình duyệt thật cho toast `milestone` (chỉ kiểm bằng socket); mã toast là một dòng `ctx.toast`.
- Quy ước đứng: mỗi tính năng mới thêm entry vào đầu `NEWS` và tăng `LATEST_NEWS_ID`.

## UI điện thoại — thu nhỏ HUD (dọc compact + chế độ ngang) (commit `3631a8f` dọc, `cee1cdd` ngang)

### Đã làm
- Chỉ sửa CSS (`src/style.css`, `src/menu.css`), không đụng TS hay DOM. Desktop (> 760px, không phải màn ngang thấp) giữ nguyên: xem `shots/uim-desktop.png`.
- **Dọc (`@media (max-width: 760px)`):** theo bảng spec. Marquee 22px; hồ sơ top 30, avatar 34, thanh cấp 80×5; `#online` top 78; nút hành động 48×48 (icon 20, nhãn 9.5), cột `right: 6`, `gap: 5`, cao 366px (từ 470px); chat cảm ứng top 116, rộng `min(228px, 58vw)`, cao tối đa `min(38dvh, 100dvh − 380px − safe)`; banner giờ lễ/boost top 106/144; joystick 104 (`left: 14`, stick 46 tại 29/29, `#joyGrip` 30); `#couplet` bottom 148. Nút `teacher/zone` min-width 64, nhãn 10px/max 84px. Menu: nút 54×50, padding/gap 3, icon 19/nhãn 9, nút Thu gọn cảm ứng 54×50 (min 48) tại bottom `208px + safe`.
- **Giữ nguyên theo spec:** `#soundBtn` 38×38, `#chatToggle` cảm ứng 40×40, `#chatInput` font 16px.
- **Ngang (mới):** điều kiện của khối HUD mobile mở rộng thành `(max-width: 760px), (orientation: landscape) and (max-height: 500px)`; thêm khối `@media (orientation: landscape) and (max-height: 500px)` ở cuối `style.css` và cuối phần menu của `menu.css`, đúng bảng vị trí trong spec.
- Phần ghi đè riêng cho `#joyGrip` 30px và nút teacher/zone nằm ở một khối media riêng cuối `style.css` (vì các quy tắc gốc của chúng đứng sau khối mobile chính trong file nên phải đặt sau mới thắng).

### Lệch nhẹ so với spec (cần biết)
- `.pinfo { line-height: 1.1 }`, `.pinfo b { display: block }`, `.bar { margin-top: 3px }` trong media mobile: với đúng các số của spec, hồ sơ cao 52px nên đè `#online` (top 78) 4px. Ba dòng này kéo hồ sơ xuống 47px, hết chồng.
- Khối ngang: `#actions` thêm `flex-wrap: wrap-reverse; align-content: flex-start; max-height: calc(100dvh - 142px - safe)`. Với 7 nút × 48 + gap = 366px, cột đơn vượt quá 390px chiều cao nên tràn lên trên màn hình (nút đầu ở y = −46) và đè cụm `#topright`. Giờ cột tự tách thành 2 cột khi hết chỗ: ở 844×390 là 2 cột, hộp 101×207, không tràn. Spec ghi "cột hành động dọc bên phải", vẫn đúng nhưng là 2 cột dọc ở máy 390px cao.
- Chat cảm ứng ở khối ngang: `max-height: 56dvh` đặt trên `body.touch #chat:not(.collapsed)` (cùng độ đặc hiệu với quy tắc max-height của khối mobile) chứ không phải `body.touch #chat`, nếu không sẽ bị quy tắc `calc(100dvh − 380px …)` thắng và khung chat co về 0 ở màn ngang.

### Kiểm chứng
- `npm run typecheck` pass.
- Số đo từ `tools/steps-uim.mjs` (`UIM=portrait|chat|landscape|desktop`, chạy bằng `tools/shot.mjs`, `?touch=1`), kiểm tra chồng chéo giữa profile, online, topright, banner, chat, actions, joystick, menu, couplet:
  - `shots/uim-portrait.png` (390×844): cột hành động 366px (y 406–772), nút 48×48, nhãn "Thắp hương" không tràn (`scrollWidth ≤ clientWidth`); joystick 104×104; menu cao 58px; không chồng nhau.
  - `shots/uim-chat.png` (390×844, đồng hồ giả 05:30 ICT): chat mở cao 158px (giới hạn 38dvh = 321px); `#boostBanner` hidden (rider R1.5 còn đúng); ô nhập hiện đủ, font 16px; gõ "xin chao" + Enter ra tin trong `#msgs`.
  - `shots/uim-landscape.png` (844×390): profile (28), online cạnh profile (left 190, top 34), 2 cột hành động ở y 113–320, joystick 96, menu cao 54 sát đáy (y 332–386); không phần tử nào quá 390. Giao nhau duy nhất đo được là `#couplet` với `#menu`, nhưng `#couplet` chỉ là hộp ẩn mờ khi không phát (opacity 0).
  - `shots/uim-desktop.png` (1280×800): các hộp khớp giá trị CSS gốc (nút hành động 78×78, menu 64×62, hồ sơ 210×62); mọi quy tắc mới đều nằm trong media mobile/ngang nên không chạm desktop (không chụp bản trước để so từng pixel).
- Chưa kiểm tay trên điện thoại thật (bấm lần lượt 7 nút hành động) — việc của người dùng.

### Lưu ý
- `src/menu.css` trong working tree còn các dòng `.bd-*` (giao diện lần hạt, R2.2) chưa commit từ trước, không thuộc spec này nên không đưa vào commit; cũng vậy cho các file `server/`, `shared/`, `src/main.ts`, `src/menu.ts`, `src/data/news.ts`, `src/features/stats.ts`.

## R2.2 — Lần hạt 108 (giao diện lần tràng hạt + thưởng vòng + mốc thành tựu)
Baseline: `main` sau commit `8d7fb8b`; không đổi schema DB.

### Đã làm
- **Server (`server/index.ts`):** `Session.beadStart?: number` (bộ nhớ). `beads:start` ghi `Date.now()` (gọi lại = ghi đè), ack `{ ok: true }`. `beads:done` luôn xóa mốc; thiếu mốc, `elapsed < 45_000` hoặc `> 30 phút` → `{ ok: false }`, không đếm, không thưởng. Hợp lệ: `countStatSafe(s, 'beads_rounds')` (luôn đếm, kể cả hết lượt, mốc bắn qua `countStat`), rồi `claimMinigame(pid, 'lanhat', 5)`; nếu được thưởng: `merit = Math.round(10 × meritBoost().mult)`, `grantRewards(s, merit, 5)`, `questEvent(s, 'beads')`. Ack `{ ok: true, rewarded, merit }`, rồi emit `beads { rewarded: minigameCount('lanhat') }`; cũng emit lúc join cạnh `spin`. Hằng số `BEAD_ROUND_MIN_MS`, `BEAD_ROUND_REWARD`, `BEAD_DAILY_CAP` đặt cạnh `MINIGAMES` (khai báo cục bộ trong khối connection, cùng chỗ với `MG_COOLDOWN_MS`; `BEAD_ROUND_MAX_MS = 30 phút` thêm cạnh). Nhánh animation beads trong `action` giữ nguyên.
- **Mở rộng có chủ đích R1.4:** công đức của vòng nhân hệ số giờ lễ (`meritBoost`, `Math.round`), nhất quán với thắp hương/tụng kinh. Xu (5) không nhân.
- **Mốc (`shared/game.ts`):** thêm `bead5` (5 vòng, 20 xu), `bead25` (25, 50 xu + Hương trầm), `bead100` (100, 120 xu + Đèn hoa đăng); kiểu `BeadsState`, `BeadsAck`. `stats.ts` thêm track thứ 5 "📿 Vòng hạt", đơn vị mặc định lấy số, mốc từ `STAT_MILESTONES`.
- **Client:** `src/features/beads.ts` (`initBeads`, `openBeads`, `beadsPending`); nút menu "Lần hạt" (icon `beads`) + chấm đỏ khi vòng đã thưởng hôm nay < 5. Panel: vòng SVG 108 chấm (hạt mốc 27/54/81 to hơn, tô đỏ khi đã lần), hạt lớn 132px, số đếm `n / 108`, Space/chạm/click (`pointerdown`). Lần chạm đầu của vòng emit `beads:start` trước khi đếm; đủ 108 emit `beads:done` và hiện ba dạng dòng kết quả đúng chữ trong spec; nút "Bắt đầu vòng mới". Đóng panel: bỏ vòng dở phía client, hủy listener phím và nhịp hiện diện.
- **Hiện diện trong phòng:** `MenuCtx.act(kind)` mới, `main.ts` nối vào `doAction`. Khi vòng đang dở, panel gọi `ctx.act('beads')` ngay lúc bắt đầu rồi mỗi 2,5 giây (cooldown phía game là 2,4 giây nên không bị nuốt); dừng khi hoàn thành hoặc đóng panel. Không sửa animation beads.
- **News:** entry "Lần hạt 108" đứng đầu, `LATEST_NEWS_ID` 4 → 5.
- Ghi chú ở mục "UI điện thoại" ở trên về các dòng `.bd-*` chưa commit nay đã lỗi thời: chúng được commit cùng R2.2.

### Kiểm chứng
- `npm run typecheck` pass.
- `node tools/steps-verify-beads.mjs` (DB tạm, server thật; các ca cần chờ chạy song song nên mất một lần chờ ~47 giây, tổng ~80 giây): TẤT CẢ PASS (27 kiểm tra): done khi chưa start → false, rounds 0; start rồi done ngay → false; start lại giữa chừng ghi đè mốc (đã trôi 20 giây từ lần đầu vẫn bị chặn); vòng hợp lệ → `{ ok: true, rewarded: true }`, công đức +`Math.round(10 × mult)` (lúc chạy mult = 1 nên +10), xu +5, rounds = 1, event `beads { rewarded: 1 }`; seed `beads_rounds = 4` → vòng kế nhận đúng một event `bead5`, xu +25 (5 vòng + 20 mốc), `claimStatReward('bead5')` lần hai = false; seed `minigame_daily lanhat = 5` → `{ ok: true, rewarded: false, merit: 0 }`, rounds +1, công đức/xu không đổi; reconnect → `stats:get` có beadsRounds 5 và claimed chứa `bead5`; hồi quy incense `Math.round(1 × mult)` + 1 xu, action `beads` không công đức/xu và không đếm vòng.
- Ảnh (`tools/steps-r22-beads.mjs` qua `tools/shot.mjs`, DB tạm; `MODE=desktop|mobile`): `shots/r22-panel.png` (1280×800, 54/108, hạt mốc 27/54 thấy rõ), `shots/r22-done.png` (dòng "Hoàn thành một vòng · +10 công đức · +5 xu" + nút Bắt đầu vòng mới), `shots/r22-m-panel.png` (390×844, hạt lớn 128px tại y 335–463, `scrollWidth` của trang = 390, panel 338px trong thẻ 363px, không tràn).

### Chưa chắc chắn / việc còn treo
- Hệ số giờ lễ khác ×1 chỉ kiểm được qua công thức; E2E chạy ở mult thực lúc chạy (×1).
- Ảnh dùng sự kiện `pointerdown` giả lập qua CDP, chưa thử chạm thật trên điện thoại; chưa kiểm tay phím Space ngoài trình duyệt headless.
- Ngày thưởng theo `dayKey()` UTC như các minigame khác (UI các nơi vẫn nói 07:00 VN).
- Chưa deploy.

## Rider — bong bóng chat tông kính tối
- `src/character.ts::say()`: chỉ đổi 3 màu. Nền `rgba(255,250,238,.97)` → `rgba(38,24,14,.88)`, viền `rgba(120,80,30,.55)` → `rgba(246,217,138,.75)`, chữ `#2a170a` → `#FAF3E3` (cùng bộ `--glass`/`--gold2`/`--cream` của HUD). Đuôi bong bóng dùng chung fillStyle của nền nên tự đổi. Kích thước canvas, font, ngắt dòng, đuôi, thời gian hiện, scale sprite và bảng tên giữ nguyên. Áp dụng cho mọi nhân vật, kể cả NPC.
- `npm run typecheck` pass. Ảnh `shots/bubble-dark.png` (390×844, `?touch=1`, tin gửi qua form chat thật, `tools/steps-bubble-dark.mjs`): nền nâu tối, viền vàng nhạt, chữ kem đọc rõ, bảng tên bên dưới không đổi.
- Chưa kiểm trên điện thoại thật.

## Vá R2.2 — hạ sàn thời gian vòng hạt 45s → 30s
- `server/index.ts`: `BEAD_ROUND_MIN_MS` 45_000 → 30_000. Lý do: người chơi thật lần đủ 108 hạt trên điện thoại dưới 45 giây và bị báo "Vòng chưa hợp lệ" (nhịp bấm nhanh nhất ~0,3 giây/hạt ≈ 32 giây/vòng). Giữ nguyên mọi thứ khác: mốc hết hạn 30 phút, cap 5 vòng/ngày, thưởng 10 công đức/5 xu, cách đếm stat, nội dung chữ trong panel.
- `tools/steps-verify-beads.mjs`: ca chờ hợp lệ từ ~46 giây xuống ~32 giây; thêm ca biên (done ở ~29 giây → `{ ok: false }`, rounds = 0; done ở ~32 giây → hợp lệ); ca ghi đè mốc đổi từ 20 giây sang ~31 giây. Kết quả: TẤT CẢ PASS 28/28 (trước 27), tổng ~59 giây (trước ~80 giây). `npm run typecheck` pass.
- Grep code còn một chỗ nhắc 45 giây: `tools/steps-r22-beads.mjs` (script chụp ảnh, chờ 46,5 giây và log "đủ 45s"). Không sửa vì ngoài phạm vi spec; script vẫn chạy đúng với sàn mới, chỉ chờ lâu hơn cần thiết. Các mục R2.2 phía trên trong file này ghi 45 giây là lịch sử, không sửa.
- Không đổi giao diện, không đổi tin "Có gì mới" (`LATEST_NEWS_ID` giữ 5).
