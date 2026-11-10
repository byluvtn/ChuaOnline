# Round 2 — ChuaOnline: cá koi, bồ đoàn, lạy Phật tự chạy, tụng kinh, nhiệm vụ, shop
# (prompt bổ sung, chèn vào task đang chạy trong Kilo)

## 0. Cách chèn vào task đang chạy

- Copy file này sang máy (`E:\Code\ChuaOnline-main\prompt-round2.md`), rồi nhắn thêm vào Kilo bằng cách **gõ tin nhắn rồi nhấn Enter để xếp vào hàng đợi (Queue)** — đừng bấm "Send now" (nó ngắt task đang làm). Tin nhắn chèn:
  > Làm thêm các task round 2 trong file @prompt-round2.md (cá koi, bồ đoàn, lạy Phật tự chạy tới bồ đoàn, cửa sổ tụng kinh, thêm nhiệm vụ, mở rộng shop), theo đúng thứ tự trong file, sau khi xong các việc round 1. Mỗi việc xong thì cập nhật todo list ngay.
- **Lưu ý: code trên máy có thể mới hơn main GitHub 59f1a42** (task round 1 đang sửa dở + shop trên máy đã có category và item mà bản 59f1a42 chưa có — ví dụ ảnh chụp shop có Nến sáp ong, Hoa dâng Phật, giá khác bản này). **Đọc lại toàn bộ file hiện tại trước khi sửa, đừng tin số dòng hay anchor trong prompt này**, tìm đúng vị trí bằng tên hàm/hằng.
- Thứ tự làm round 2 (sau round 1): (1) cá koi → (2) bồ đoàn → (3) lạy Phật tự chạy → (4) tụng kinh → (5) nhiệm vụ → (6) shop. Mỗi việc xong mới sang việc sau, vì đều đụng `shared/game.ts` / `panels.ts` / `main.ts`.

## 1. Vẽ lại cá koi cho giống thật (`src/temple.ts`, đoạn hồ cá)

- Hiện tại: 9 con koi, mỗi con là 1 sphere dẹt (`SphereGeometry(0.24)` scale (2.0, 0.35, 0.7)) + đuôi cone, màu trơn 1 màu, bơi theo ellipse, đuôi không vẫy (`temple.ts` ~dòng 234–242, hàm `update` ~dòng 333).
- Thiết kế lại, giữ nguyên cách bơi ellipse + công thức hướng hiện tại, chỉ thay hình dạng:
  - Mỗi con là 1 Group: thân cá chép thật — sphere kéo dài, dẹt 2 bên (scale khoảng (2.2, 0.5, 0.8)), đầu tù, đuôi thon; vây đuôi = 2 mặt phẳng/cone dẹt xòe ra sau, **vẫy được** (trong `update`, cho đuôi `rotation.y = sin(t * tốc độ + pha) * 0.4`); thêm vây lưng mỏng trên lưng + 2 vây ngực nhỏ 2 bên.
  - Mắt: 2 sphere đen nhỏ 2 bên đầu. Râu: 2 cylinder mỏng ngắn trước miệng.
  - Màu theo mẫu cá koi thật, không tô 1 màu trơn: dùng CanvasTexture vẽ loang (hoặc 2–3 mảng màu gộp) — các mẫu: Kohaku (trắng + đốm đỏ cam), Yamabuki (vàng), Shiro Utsuri (trắng + đốm đen), Hi (đỏ cam). Mỗi con 1 mẫu, đủ 9 con.
  - Giữ số lượng 9 con, giữ tốc độ + bán kính ellipse hiện tại (`rx`/`rz` theo `LAKE.a`/`LAKE.b` — hồ đã dời ra giữa sân ở round 1 nên cá phải bơi theo `LAKE` mới, không hardcode tọa độ cũ).
- Không thêm asset, không đổi kích thước hồ.

## 2. Thiết kế lại bồ đoàn (`src/temple.ts`, đoạn meditation decks)

- Hiện tại: 2 dãy thiền đường (`DECK`), mỗi dãy 9 hàng × 9 cột = 81 chỗ, tổng 162 chỗ. Chiếu ngồi `BoxGeometry(1.1, 0.04, 1.05)` vàng, bồ đoàn `CylinderGeometry(0.34, 0.38, 0.1)` đỏ, đều là InstancedMesh.
- Thiết kế lại:
  - **Rộng thêm 30%:** bồ đoàn r 0.34 → 0.44 (đáy 0.38 → 0.49), chiếu 1.1 → 1.43 (dài giữ tỉ lệ). Tăng khoảng cách giữa các chỗ để không chồng lên nhau: bước hàng 1.5 → ~1.9, bước cột 1.3 → ~1.7 — tính lại số hàng/cột cho vừa khít 2 dãy thiền đường (`DECK` x 4.6–17.2, z -18.6–-4), số chỗ sẽ giảm (khoảng 7×7×2 = 98) — chấp nhận giảm, vì chỗ ngồi rộng + thưa mới đúng chùa thật.
  - **Cánh sen xung quanh bồ đoàn:** mỗi bồ đoàn thêm 8 cánh sen xếp vòng tròn quanh mép (dùng `petalGeometry` như đài sen của tượng, hoặc sphere dẹt), màu hồng/trắng xen kẽ, hơi ngửa lên. Làm bằng **1 InstancedMesh riêng** (8 cánh × ~98 chỗ ≈ 784 instance — vẫn 1 draw call), đặt cùng vị trí/ma trận với bồ đoàn.
  - Giữ nguyên: 2 dãy 2 bên, chiếu vàng + bồ đoàn đỏ, `world.seats` (tọa độ + hướng `ry: Math.PI` của từng chỗ) vẫn phải đúng — vì mục 3 dùng danh sách này để tìm chỗ ngồi.
- Kiểm tra bằng ảnh chụp: bồ đoàn phải thấy rõ cánh sen, không chồng lấn nhau.

## 3. Lạy Phật: nhân vật tự chạy đến bồ đoàn rồi ngồi xuống lạy (`src/main.ts`)

- Hiện tại: nút "Lạy Phật" (`index.html` `#actions [data-act="bow"]`) gọi `doAction('bow')` — nhân vật **lạy tại chỗ**, không di chuyển. Đã có sẵn cơ chế ngồi: `setSitting(true)` tìm chỗ ngồi trống gần nhất trong `world.seats` (bán kính 3.2m) và **dịch chuyển tức thời** tới đó; di chuyển bằng `clickTarget` (nhân vật đi bộ tới điểm, tới nơi khi cách < 0.2 thì dừng).
- Thiết kế mới khi ấn "Lạy Phật":
  1. Tìm bồ đoàn trống **gần nhất** (dùng lại cách tìm của `setSitting`: duyệt `world.seats`, bỏ chỗ đã có người khác ngồi trong bán kính 0.6) — **bỏ giới hạn 3.2m**, tìm trên toàn sân. Nếu không còn chỗ trống → lạy tại chỗ như cũ.
  2. Đặt `clickTarget` = vị trí bồ đoàn đó, nhân vật **tự chạy bộ tới** (dùng đúng hệ di chuyển hiện tại, tốc độ đi bộ thường, không dịch chuyển tức thời).
  3. Tới nơi (cách < 0.5) → ngồi xuống (`setSitting(true)`) rồi lạy (`me.anim = 'bow'`, `myActionUntil` như hiện tại) và gửi `'action', 'bow'` lên server như cũ (công đức theo `ACTION_RULES.bow`).
  4. Nếu người chơi bấm di chuyển (click/joystick) giữa đường thì hủy hành trình (đặt `clickTarget` theo lệnh mới, không lạy nữa).
- Giữ nguyên cooldown + merit của `bow`. Không đổi animation lạy trong `character.ts`.

## 4. Cửa sổ tụng kinh (`src/panels.ts`, `shared/game.ts`, `src/main.ts`, `src/audio.ts`)

- Hiện tại: **chưa có cửa sổ tụng kinh**. Nút "Tụng kinh" (`data-act="chant"`) chỉ chạy animation + cộng 2 công đức (`ACTION_RULES.chant`, cooldown 10s). Âm thanh gõ mõ đã có sẵn: `audio.play('moh')`.
- Thiết kế mới:
  - Nút "Tụng kinh" đổi thành **mở cửa sổ tụng kinh** (thêm `PanelKind 'chant'` trong `panels.ts`, theo đúng mẫu `renderShop`/`renderQuests` hiện tại: `TITLES`, `render()`, `refreshPanel()`). Không xóa action `chant` — cửa sổ sẽ gọi nó theo từng đoạn kinh hoàn thành.
  - **Bước 1 — chọn kinh:** danh sách bài kinh, mỗi bài có tên + số biến/lần đọc + công đức nhận được. Thêm `SUTRAS` vào `shared/game.ts`: ít nhất 3 bài, lời kinh thật (chỉ lấy kinh truyền thống): Bát Nhã Tâm Kinh, Chú Đại Bi, Niệm Phật A Di Đà (108 lần, rút gọn hiển thị theo câu). Mỗi bài có `lines[]` là từng câu kinh thật để hiển thị.
  - **Bước 2 — bấm "Bắt đầu":** hiện ra bài kinh đã chọn ở chế độ đọc: **hiệu ứng chạy chữ** — từng dòng kinh hiện dần + dòng đang đọc được tô sáng (highlight) và tự cuộn xuống theo tiến độ (kiểu karaoke), tốc độ đọc chỉnh được.
  - **Gõ mõ tự động:** trong lúc đọc, tự động gõ mõ theo nhịp (mặc định 60 nhịp/phút, có nút bật/tắt + chỉnh nhịp 40–120), mỗi tiếng mõ dùng `audio.play('moh')` có sẵn. Mõ gõ đúng nhịp với dòng đang đọc.
  - Hoàn thành 1 biến/lần đọc → cộng công đức theo `ACTION_RULES.chant` (giữ nguyên luật cộng hiện tại, không tự chế luật mới). Đóng cửa sổ thì dừng đọc + dừng mõ.
- Không thêm dependency, không đổi server trừ khi cần event cộng công đức theo đoạn (nếu cần thì thêm 1 event gọn, theo đúng mẫu `shop:buy`/`quest:claim`).

## 5. Thêm nhiệm vụ để lên cấp (`shared/game.ts`, `server/index.ts`, `src/panels.ts`)

- Hiện tại đã có: 6 nhiệm vụ hằng ngày (`QUESTS`: lạy 5, thắp hương 3, tụng 2, thả đèn 1, chia sẻ 3, thiền 2 phút), reset mỗi ngày giờ UTC, nhận thưởng xu + công đức (`quest:claim`), chấm đỏ `questDot` khi xong. Cấp độ đã có (`levelOf`/`meritForLevel` theo công đức).
- Thiết kế thêm, giữ nguyên luồng `QuestState` + reset ngày + nhận thưởng hiện tại:
  - **Thêm nhiệm vụ hằng ngày** (tổng ~12): tụng kinh 1 bài hoàn chỉnh, thả đèn 3 lần, thiền 5 phút, mua 1 vật phẩm ở shop, vào 3 phòng chùa khác nhau, lạy Phật 10 lần, thắp hương 5 lần, chia sẻ 5 lời hiền. Phần thưởng xu + công đức theo độ khó (khó hơn thì thưởng nhiều hơn, bám theo mức hiện tại).
  - **Thêm nhiệm vụ tuần** (mục riêng trong cửa sổ Nhiệm vụ, reset thứ 2 hằng tuần): tích 100 công đức/tuần, lạy 50 lần/tuần, tụng 10 bài/tuần — thưởng lớn (50–100 xu + 30–50 công đức).
  - **Thưởng mốc cấp:** lên cấp mới thì tự nhận thưởng (xu + mở khóa vật phẩm shop theo cấp — xem mục 6). Hiển thị thanh tiến độ cấp trong cửa sổ Nhiệm vụ (cấp hiện tại, còn bao nhiêu công đức thì lên cấp — dùng `meritForLevel` có sẵn).
- Không đổi cơ chế reset ngày, không đổi `QuestState`.

## 6. Mở rộng shop vật phẩm (`shared/game.ts`, `src/panels.ts`, `server/index.ts`)

- Hiện tại: shop chỉ có 6 món (`ITEMS`: Hương trầm, Hoa sen, Đèn hoa đăng, Mũ sen, Hào quang, Khăn đỏ), không có category, tiền chỉ có Sen (`coins`). Ảnh chụp shop trên máy đã có category + món mới (Nến sáp ong, Hoa dâng Phật...) — **đọc lại `ITEMS`/`renderShop` trên máy trước, giữ lại những gì đã có, chỉ thêm vào**.
- Thiết kế thêm:
  - **Category (tab) trong shop**, theo đúng các tab ở ảnh chụp: Lễ vật, Cây Phật, Áo tràng, Tràng hạt, Bồ đoàn, Mũ, Pháp khí, Mây, Linh thú, Diều, Đồ linh thú. Thêm trường `category` vào `ShopItem`, `renderShop` vẽ tab category + chỉ hiện món của tab đang chọn.
  - **Thêm món vào từng category**, theo đúng 2 mẫu đã có (không chế hệ thống mới): (a) consumable có `boostItem`/`boostMerit` trong `ACTION_RULES` (ví dụ: Nến sáp ong +5 công đức khi tụng kinh, Hoa dâng Phật +4 khi lạy, Tràng hạt +2 mỗi lần niệm Phật...); (b) accessory đeo được qua `inv:equip` có sẵn (Áo tràng các màu, Mũ các loại, Khăn, Pháp khí cầm tay...). Bồ đoàn trong shop = skin đổi màu bồ đoàn của người chơi (nếu làm được gọn bằng cách đổi màu cushion của chỗ ngồi — nếu phức tạp thì để món này ở dạng accessory hiển thị trong Túi đồ).
  - **Mua số lượng:** thêm nút "Mua 5" cho món consumable (giá = 5 × giá lẻ, như ảnh chụp "Mua 5 · 50 Sen").
  - **Mở khóa theo cấp:** món xịn (Hào quang, Áo tràng vàng, Linh thú...) yêu cầu cấp tối thiểu — chưa đủ cấp thì hiện ổ khóa + "Cần cấp X", đủ cấp mới mua được.
  - Tiền tệ: giữ Sen (`coins`) làm tiền chính. **Ngọc: chỉ thêm nếu code trên máy đã có sẵn hệ Ngọc** (ảnh chụp hiện "0 Ngọc") — nếu chưa có thì bỏ qua, không chế thêm tiền tệ mới.
- Giữ nguyên luồng mua (`shop:buy`), Túi đồ (`renderBag`), đeo/tháo (`inv:equip`). Không đổi giá món hiện có.

## 7. Kiểm chứng (bắt buộc trước khi báo xong)

1. `npm run typecheck` — sạch. `npm run build` — build được.
2. Chụp kiểm tra trên máy (`STEPS=./steps-temple.mjs node tools/shot.mjs /tmp/shots/round2` + mở shop/nhiệm vụ/tụng kinh chụp màn hình UI): (a) cá koi thấy rõ thân + vây + đuôi vẫy + đốm màu; (b) bồ đoàn rộng hơn, có cánh sen, không chồng lấn; (c) ấn Lạy Phật → nhân vật chạy tới bồ đoàn trống, ngồi xuống, lạy; (d) ấn Tụng kinh → cửa sổ hiện danh sách kinh → Bắt đầu → chữ chạy từng dòng + mõ tự gõ; (e) cửa sổ Nhiệm vụ có thêm nhiệm vụ ngày + tuần + thanh tiến độ cấp; (f) shop có tab category, món mới, Mua 5, khóa theo cấp.
3. Báo cáo lại: file đã sửa, kết quả typecheck/build, mô tả từng ảnh chụp + video/giấy kiểm tra hành vi (nếu có).

---

# PROMPT GỬI OPUS 5 (copy nguyên đoạn dưới, dán vào Kilo — hoặc copy file này sang máy rồi @ file trong tin nhắn queue)

> Bạn là Opus 5, làm việc trong Kilo Code, có quyền đọc và sửa file trong repo ChuaOnline tại `E:\Code\ChuaOnline-main` (TypeScript + Vite, three 0.170.0).
>
> Nhiệm vụ: làm thêm round 2 (6 việc, theo đúng thứ tự mục 0–6 trong file này), SAU KHI xong các việc round 1 (tượng + kiến trúc + hồ + chữ Hán). Trước khi sửa từng việc, đọc lại file hiện tại trên máy (code có thể mới hơn main GitHub 59f1a42 — đặc biệt shop đã có category + item mới; đừng tin số dòng hay anchor trong prompt này, hãy tự tìm đúng vị trí bằng tên hàm/hằng).
>
> Tóm tắt 6 việc: (1) vẽ lại cá koi cho giống thật (thân + vây + đuôi vẫy + đốm màu koi, giữ cách bơi ellipse); (2) bồ đoàn rộng thêm 30% + cánh sen xung quanh + sắp xếp lại thưa hơn; (3) ấn Lạy Phật thì nhân vật tự chạy tới bồ đoàn trống gần nhất, ngồi xuống rồi lạy (dùng clickTarget + setSitting có sẵn, không teleport); (4) cửa sổ tụng kinh mới (chọn kinh → bắt đầu → chữ chạy từng dòng + gõ mõ tự động bằng audio 'moh'); (5) thêm nhiệm vụ ngày + nhiệm vụ tuần + thưởng mốc cấp; (6) mở rộng shop (tab category, thêm món theo 2 mẫu consumable/accessory có sẵn, nút Mua 5, khóa theo cấp).
>
> Ràng buộc: chỉ sửa file cần thiết cho từng việc (`src/temple.ts`, `src/main.ts`, `src/panels.ts`, `shared/game.ts`, `server/index.ts` khi cần event mới, `index.html` cho nút Tụng kinh); giữ nguyên luồng hiện có (shop:buy, quest:claim, inv:equip, ACTION_RULES, QuestState, reset ngày); không thêm asset/dependency; không chế tiền tệ mới; code TypeScript sạch.
>
> Làm xong mỗi việc thì cập nhật todo list ngay. Cuối cùng chạy `npm run typecheck` và `npm run build`, chụp kiểm tra theo mục 7 và báo cáo lại: đã sửa gì, kết quả typecheck/build, mô tả từng ảnh chụp. Nếu lỗi thì tự sửa cho tới khi sạch rồi mới báo xong.
