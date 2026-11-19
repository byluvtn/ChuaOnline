# Ghi chú bàn giao

## Chạy dự án
- `npm install`
- `npm run dev` chạy cả API (cổng 3001) và Vite (cổng 5173).
- `npm run typecheck` kiểm tra kiểu. `npm run build` cho bản production.
- Thư mục `data` không nằm trong repo, copy riêng nếu cần dữ liệu cũ.

## Bàn giao cho Muse ở nhà — prompt thiền định (2026-11-18 16:45) — ✅ XONG 18/11 (f6816cc, live 17:30, tin 138–139)

- ✅ ĐÃ XONG 18/11 17:29 (commit `f6816cc`, live 17:30): hào quang 2 tầng đúng spec + giãn cách bồ đoàn 60/24/72 + 2 tin tức (138–139). Hình đệm là thiết kế lathe+cánh sen của `225234e` (giữ nguyên zafu.ts, chỉ đổi lưới ngồi). Đừng chạy lại file prompt này.
- VIỆC CHÍNH (user giao cho Muse ở nhà làm): implement theo file `prompt-thien-dinh-hao-quang-bo-doan.md` ở gốc repo — 1 session Kilo, 1 commit chung. Phần A: hào quang thiền định 2 tầng theo ngày (ngồi liên tục 10 phút → hào quang thường, 20 phút → hào quang lớn; qua 00:00 mất, hôm sau thiền lại; xóa `hao_quang` khỏi shop; NPC role `abbot` có hào quang mặc định). Phần B: bồ đoàn cánh sen (2 vòng cánh hồng) + giãn cách lưới ngồi (Chính Điện 96→60, Tam Thế 48→24, deck 98→72, thiền đường 12→10; 2 bồ đoàn tụng kinh ở (0,2)/(0,4) GIỮ NGUYÊN — vị trí quest CHANT_SEATS). Spec đầy đủ, tin tức (2 entries, LATEST +2) và nghiệm thu đều trong file đó. Hai file spec riêng trước đó đã gộp — chỉ chạy file gộp này.
- HEAD lúc bàn giao: `a85877b`, `LATEST_NEWS_ID = 137`, live trên Oracle (auto-pull 5 phút).
- Quy tắc nhớ: mỗi tính năng phải có tin tức; commit message tiếng Việt không dấu như các commit trước; `git add` từng file, không `git add -A`; không force-push.

## Việc thêm cho Muse ở nhà (2026-11-18 16:49–16:52)

- Hào quang tượng: thêm hào quang cho 8 tượng trong Chính Điện + Điện Tam Thế ("tam bảo" trong tin nhắn user = Điện Tam Thế). Làm theo file `prompt-hao-quang-tuong-dien.md` ở gốc repo (1 session Kilo, 1 commit, 1 tin tức). Bối cảnh: tượng fallback cũ có hào quang lửa (`buildHalo`) nhưng bị xóa cùng fallback khi GLB thay vào — tượng GLB hiện không có hào quang.
- Xóa câu đối "Phật nhật tăng huy" ở Chính Điện: dòng `COUPLETS.daiHung.am[0]` trong `src/couplets.ts:7`. LƯU Ý: câu đối này CHỈ hiện trong bảng giải nghĩa khi bước vào vùng daiHung (`src/main.ts` hàm `updateCouplet` ~:2380, `c.am.join(' / ')`) — Chính Điện KHÔNG có bảng câu đối 3D (bảng 3D trong điện là COLUMN_LABELS tiếng Việt, giữ nguyên). HỎI USER trước khi làm: xóa cả cặp câu đối daiHung (bảng giải nghĩa sẽ không hiện nữa khi vào điện) hay chỉ thay dòng 1 bằng câu khác? Không có tin tức (sửa nội dung nhỏ).
- Lư hương sân trước Chính Điện bị lệch: lư đồng lớn ngoài trời ở `src/world.ts` (mục "Incense urn", `altar.position.set(3.4, groundY(3.4, -20.5), -20.5)`, collider r 1.9 cùng tọa độ) — đang lệch phải, sát góc cột/cuối bậc thềm (vị trí này có từ commit mở rộng `06d6d0e`, x 3.4 thẳng hàng với dãy cột kinh đông). Đưa về giữa trục, phía nam bậc thềm: đề xuất (0, -17) (cách mép thềm ~4 m, không đụng cột kinh gần nhất ở (±3.4, -10.4)); dời collider theo; chạy lại walk test (lư nằm trên trục đi bộ) và chụp ảnh nghiệm thu từ sân (lư cân giữa trước điện, bậc thềm thông). Không có tin tức.
- Xóa hàng rào hai viện để mở lối lên Chùa Ngọc: `buildVienFence` ở `src/temple.ts:1393-1449`, gọi ở :1465-1466 cho VIEN_KT (x −58..−22, z −80..−54, chứa Trai Đường (−29,−61)) và VIEN_TO (x 24..58, z −80..−54, chứa Nhà Tổ (36,−68)). Xóa cả 2 lần gọi + hàm builder (cổng + biển viện nằm trong hàm — nếu user muốn giữ cổng làm cổng vòm độc lập thì hỏi lại). Collider hàng rào (line-collider) nằm trong hàm nên tự mất theo; pathfinder dùng chung collider list nên đường đi tự mở. KHÔNG đụng `blocked()` ở `src/layout.ts:273` (chỉ dùng cho scatter cây, `src/world.ts:222/256-257` — giữ nguyên để sân viện không bị trồng cây lung tung) và WALKWAY_RECTS cổng (`layout.ts:94-95`). Server không có logic riêng về viện (đã kiểm tra — không có VIEN/collider ở `server/`). Minimap: `src/features/map.ts:42` vẽ rect hai viện — bỏ phần vẽ rect (hàng rào đã mất) nhưng giữ label nếu có. Nghiệm thu: đi bộ được từ sân chính vòng qua Tam Thế lên chân thang Chùa Ngọc (z −90) cả 2 phía đông/tây; chạy walk test. 1 tin tức (viết sẵn): title `Mở lối lên Chùa Ngọc: dỡ hàng rào hai viện` / body `Hàng rào bao quanh Viện Khách Tăng và Viện Tổ đã được dỡ bỏ — giờ thí chủ có thể đi bộ từ sân chính vòng qua Điện Tam Thế lên chân thang Chùa Ngọc cả hai phía đông và tây. Nhà Tổ và Trai Đường vẫn ở nguyên vị trí, chỉ không còn hàng rào ngăn lối.` / date 2026-11-18, LATEST +1 tại thời điểm build.
- Biển lơ lửng: một số biển khu mở rộng không có cột cắm, đứng giữa không trung (user chụp biển SÔNG ĐÔNG). Nguyên nhân: `addSign` ở `src/expansion.ts:235-242` chỉ tạo mặt biển, không có cột. 6 biển độc lập cần thêm cột (mẫu chuẩn: cột gỗ đơn của biển VƯỜN THÁP ở `src/temple.ts:578-581` — BoxGeometry(0.2, h, 0.2), màu 0x5a3a22, từ mặt đất tới mép dưới biển): HỒ SEN (:369, y 0.95), VƯỜN RAU (:437, y 1.05), RỪNG TRÚC (:554, y 1.1), VƯỜN HOA (:670, y 1.1), SÔNG ĐÔNG (:709, y 1.0), CÂY CỔ THỤ (:1030, y 1.35 — lơ lửng cao nhất, mép dưới ở 1.1 m). 8 biển còn lại gắn trên công trình/cổng (ĐÌNH SEN, KHO NÔNG CỤ, TỊNH THẤT, ĐIỆN DƯỢC SƯ, LỐI LÊN CHÙA NGỌC, CHÙA NGỌC, ĐỘNG THIỀN, NHÀ NGHỈ CHÂN) — kiểm tra bằng ảnh, không sửa nếu đã gắn chắc. Biển ở `temple.ts` (tháp chuông/trống, AM CỔ, VƯỜN THÁP đã có cột, biển nhà A2.3, THỦY ĐÌNH, CỔNG TÂY/ĐÔNG) và market/fireworks đều gắn trên công trình — kiểm tra bằng ảnh luôn. Chú ý cao độ: cột phải chạm mặt đất thật tại (x,z) (`expansionGroundY`). Nghiệm thu: ảnh từng biển sau sửa (đủ 6 biển + spot-check biển gắn công trình). Không có tin tức (sửa lỗi hiển thị).
- Sông Đông chữ S + thác mở rộng: làm theo file `prompt-song-dong-chu-s.md` ở gốc repo (1 session Kilo, 1 commit, 1 tin tức). Thiết kế đã chốt trong file: đường tim sông 9 mốc (bắc rộng 11 m gần tường Đông, hẹp nhất 3 m ngang Điện Dược Sư, nam mở lại 7 m); thác dời sang (80, −82), mở rộng ~12,4 m → ~16 m; 2 cầu đá giữ nguyên vị trí; ao cuối sông giữ nguyên. Ràng buộc quan trọng: rừng trúc (x 70..90, z −20..14) và vườn hoa (x 68..90, z 15..40) giới hạn mép đông sông đoạn nam.
- Thứ tự tin tức: các prompt ghi "LATEST + N tại thời điểm build" — Kilo đọc `LATEST_NEWS_ID` hiện tại rồi cộng, đừng hard-code số.
- Nâng cao Chùa Ngọc + Điện Dược Sư thêm ~40% (user thêm 17:40 18/11): CHỈ nâng cao, không nới nền, không dời vị trí. Chùa Ngọc: tổng cao thang/đồi 6 m (`ngocStepProfile()`, 299 bậc + 2 chiếu nghỉ) → ~8,4 m; tháp trên đỉnh ~7–8 m → ~10–11 m; giữ nguyên 299 bậc (bước cao ~0,02 → ~0,028 m), scale `groundY`/collider 2 bên thang theo; chân thang z −90, đỉnh z −120 giữ nguyên. Điện Dược Sư: GLB `dien-duoc-su-blender.glb` cao 10,05 m → ~14 m, nền 12×9 m giữ nguyên; làm lại từ file Blender gốc `tools/blender/campus-architecture.blend` (đừng chỉ scale Y trong code — méo mái/cửa sổ), collider + zone Dược Sư + biển gắn điện dời theo cao mới. Nghiệm thu: ảnh từ sân chính + chân thang (tỉ lệ mới, không che điện khác), walk test leo đủ 299 bậc lên đỉnh, quest visit Chùa Ngọc vẫn tới đích. 1 session Kilo, 1 commit, 1 tin tức.

## Tượng chibi GLB — 8/9 đã live (2026-11-18)

- Commit `a85877b` thêm 8 GLB vào `public/models/`: chibi-a-di-da (3,9 MB), chibi-di-lac (5,7 MB), chibi-dia-tang (4,6 MB), chibi-duoc-su (4,2 MB), chibi-nhien-dang (4,6 MB), chibi-pho-hien (5,5 MB), chibi-thich-ca (2,9 MB), chibi-van-thu (6,5 MB). Tổng ~37 MB.
- Code nối tượng ở commit `8762007` (đã verify sạch): 5 vị trí Chính Điện (Địa Tạng, Văn Thù, A Di Đà, Phổ Hiền, Dược Sư), 3 vị trí Tam Thế (Nhiên Đăng, Thích Ca, Di Lặc), hành lang luân phiên Quan Âm/Văn Thù/Phổ Hiền/Địa Tạng. Fallback-first qua `replaceModel` — GLB tới là tự thay.
- User kiểm chứng trong game: 5 tượng Chính Điện + 3 tượng Tam Thế đã là GLB thật; không còn hào quang fallback chồng lên GLB; không còn quả cầu bụng giả của Di Lặc.
- THIẾU: `chibi-quan-am.glb` chưa có — hành lang vẫn giữ fallback ở các vị trí Quan Âm. Khi nào export xong GLB Quan Âm đứng đúng tên `chibi-quan-am` thì push lên, hành lang tự thay, không cần sửa code. Tin 137 đã viết cho đợt đặt tượng.
- Quy tắc tai tượng: tai ngắn, "earlobes reaching just below the jawline" — user đã chê tai dài một lần, đừng vẽ tai dài nữa.

## Nút Quản trị đã sửa + acc quantri đã xóa (2026-11-18, đừng làm lại)

- Nút "Quản trị" của acc `byluvtn` bị mất vì `ADMIN_USERNAMES` không có trên Oracle: `syncAdmins()` chạy mỗi lần boot, reset hết `is_admin = 0` rồi chỉ bật lại tên trong danh sách — danh sách rỗng nên cả 114 acc đều 0. Biến này có trên hosting cũ nhưng không mang sang lúc cutover.
- ĐÃ SỬA: drop-in `/etc/systemd/system/chua247.service.d/admin.conf` với `Environment=ADMIN_USERNAMES=byluvtn` + restart. Đã verify: `byluvtn` (id 108) `is_admin = 1`, đúng 1 admin, nút hiện lại sau reload. Deploy sau đó (8762007) restart vẫn giữ nguyên — fix bền vững.
- Acc test `quantri` (id 68) ĐÃ XÓA theo lệnh user (1 dòng players + 17 dòng liên quan). Backup DB trước khi xóa: `/home/ubuntu/chua247-data/chuaonline.db.pre-quantri-del-20261118` trên Oracle. Tổng players còn 113. Đừng tạo lại acc này.

## Việc còn tồn (2026-11-18 16:45)

- ~~`d5736ee` ("expand Chua Ngoc and redesign its approach", 10 files, expansion.ts 230 dòng) KHÔNG có tin tức~~ — ✅ ĐÃ BỔ SUNG 19/11 (commit `2a48214`, tin 141 'Lối lên Chùa Ngọc rộng hơn...'; cùng commit bổ sung tin 142 'Chuông, trống chùa có tiếng thật' cho `225234e`).
- Thác Bản Giốc `2f58d35` (3 tầng, tin 136) — ✅ ĐÃ REVIEW 18/11 (Lux): PASS — 3 tầng (2.16/4.96/8.48 m), 9 rèm nước, hồ ngọc 0x35a0a8, karst, cá 7 con, update đã nối; rộng ~12,4 m thay vì ~14 m như prompt, không đáng kể.
- User báo "không vào được chua247" lúc 13:31 — server kiểm tra bình thường (site 200, service active, socket.io OK), nghi stale service-worker cache; đã dặn user đóng tab mở lại, đang chờ user trả lời (ảnh chụp + thiết bị). Đừng đụng vào server vì vụ này khi chưa có thêm thông tin.
- Sau đợt thiền định: Prompt B (animation pass — crossfades ≥0.12s, FPS independence, no foot sliding, no LOD pop-in; kit ở `prompt-audit-fable-chua-online.md`) rồi R4. NPC 25 cạnh đường trung tâm vẫn lỗi (HANDOFF cũ ghi rõ).

## Cập nhật ba gói pháo hoa (2026-11-18)

- Gói nhỏ 100 xu / 6 quả, gói to 200 xu / 12 quả, gói rồng phượng 1.000 xu / 20 quả tính cả ba quả kết. Menu và máy chủ lấy giá từ `FIREWORKS`.
- Chỉ hiện hiệu ứng ở phòng bắn. Tin hệ thống của gói rồng phượng gửi đến mọi phòng. `LATEST_NEWS_ID` 134 → 135.

## Làm rõ pháo hoa rồng phượng (2026-11-18)

- `src/fireworks.ts` dùng một `THREE.Points` cho mỗi quả, dựng vệt sáng bằng shader. Các nét rồng và phượng từ `src/data/firework-shapes.ts` hướng về camera và có viền tương phản.
- Hộp pháo là đạo cụ tạm đặt cạnh người bắn. Tiếng phóng và nổ bám theo từng quả, giảm theo khoảng cách và theo cài đặt âm thanh. Đổi phòng dọn hiệu ứng cũ.
- Giữ nguyên giá và số quả chính. Ba quả cuối bắn sau pha phượng. Tin mới `LATEST_NEWS_ID` 133 → 134.

## Lát đường và nới lối lên Chùa Ngọc (2026-11-18)

- Sân chính, lối nhánh và mặt cầu khu mở rộng dùng chung mẫu đá. Vùng tránh trồng cây lấy theo mặt đường lát trong `src/layout.ts`.
- Chùa Ngọc và cầu thang lùi 8 m về Bắc; chân thang ở `z = -90`, đỉnh ở `z = -120`, tường Bắc ở `z = -130`. Giữ đường ngang ở `z = -82`, bổ sung lối lát rộng 9 m vào chân thang.
- Dùng tọa độ mới cho dẫn đường, bản đồ trong game và nhiệm vụ hành hương. Lưới tìm đường dự phòng lấy kích thước từ giới hạn bản đồ. Bản vẽ quy hoạch SVG độc lập không đổi.
- Tin mới `LATEST_NEWS_ID` 132 → 133.

## Remodel tượng và cảnh quan bằng Blender (2026-11-18, local)

- Blender 5.3 tạo 7 GLB từ `tools/build-sacred-assets.py`; file nguồn `tools/blender/sacred-assets.blend`, số liệu `tools/blender/sacred-assets-audit.json`. Tái xuất tại gốc repo: `& "C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" --background --factory-startup --python tools/build-sacred-assets.py`.
- `public/models/{buddha-sculpted,guanyin-sculpted,bao-thap-blender,dinh-sen-blender,thien-duong-blender,oak-natural,pine-natural}.glb`: gốc tọa độ mét/Y-up; có nguồn chỉnh sửa Blender. Hai tượng sân dựa trên scan `seated-buddha.glb` và `guanyin-ngoi.glb` có sẵn, decimate từ ~151k/~200k còn ~18k tam giác mỗi tượng, **giữ texture gốc** và file GLB cỡ 4,9/2,2 MB. Năm model kiến trúc/cây dùng màu PBR không texture rời. Tháp chỉ thay thân, giữ bệ đi bộ/bậc/collider; đình sen giữ ghế/biển/cầu; Thiền Đường giữ biển/câu đối/nội thất/zone; sồi và một số thông thay tán dạng khối cũ. GLB lỗi vẫn có bản dự phòng.
- `npm run build` và `$env:STEPS='./steps-sacred-assets.mjs'; node shot.mjs ../shots/sacred http://localhost:5173/ 1100 760` chạy từ `tools` để xem số mesh/tam giác, vùng/thềm và render cô lập 5 công trình. Thêm `BLOCK_SACRED=1` để chặn 5 GLB và kiểm chứng cả 5 fallback. Chưa đo FPS trên điện thoại với bộ model mới. Tượng có dữ liệu scan thật nhưng **kiến trúc/cây chưa phải phục dựng đúng địa điểm ngoài đời** vì chưa có ảnh và kích thước công trình thực làm đối chiếu.
- Tin mới `LATEST_NEWS_ID` 130 → 131.
- Hai tượng scan tại sân Đông/Tây dùng chung vật liệu vàng bóng và map phản xạ với tượng hành lang. GLB nguồn vẫn giữ texture scan. Kiểm tra trình duyệt xác nhận cả hai quay vào sân, giữ bệ và collider cũ; đáy lưới Quan Âm được căn theo tâm bệ, không theo gốc GLB.

## Mái Blender Chính Điện và Điện Tam Thế (2026-11-17, local)

- Dựng hai mái ba tầng chồng diêm riêng trong Blender 5.3, mái cong, góc đầu đao, gân ngói, bờ nóc, song trang trí cổ diêm, bánh xe pháp luân. Nguồn chỉnh sửa `tools/blender/main-roofs.blend`; tái xuất bằng `& "C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" --background --factory-startup --python tools/build-main-roofs.py`.
- `public/models/chinh-dien-roof.glb` và `public/models/dien-tam-the-roof.glb` dùng mặt trước +Z, mét, Y-up và scale 1, lần lượt 33.696/32.104 tam giác, 5 mesh, không texture ngoài. Giữ cột, xà, bệ, cầu thang, chữ Việt, tượng, ghế, zones, collider và groundY hiện hữu; chỉ thay mái. Khi tải lỗi, mái procedural vẫn hiển thị.
- Đạt `node tools/verify-main-roofs.mjs`, `npm run typecheck`, `npm run build` (cảnh báo bundle >500 kB vốn có). Kiểm tra trong trình duyệt: cả 2 GLB hiện đúng, biển điện không bị mái che; ảnh `shots/chinh-dien-blender-roof.png`, `shots/tam-the-blender-roof.png`. Chặn GLB kiểm tra cả 2 fallback, groundY vẫn 1,35/3 m, zone vẫn `daiHung`/`tamThe`.
- Đã đo Note20 thật qua USB/ADB: SM-N981N, Chrome Android, viewport 384×716 CSS px, canvas 576×1074 px, Chrome hiển thị, Vite dev qua USB reverse. Mỗi góc camera tĩnh làm nóng 2 giây rồi lấy 8 giây `requestAnimationFrame`, đếm riêng `renderer.render` của scene, không phải GPU timer. GLB lượt 1: sân chính 16,30 FPS, Chính Điện gần 23,15, Tam Thế gần 29,81; mái procedural (chặn hai GLB): 17,06 / 23,48 / 29,92; GLB lượt 2: 17,77 / 22,73 / 29,53. File gốc: `shots/note20-main-roofs-blender.json`, `shots/note20-main-roofs-procedural.json`, `shots/note20-main-roofs-blender-repeat.json`. Số FPS giữa các lượt chồng lấn nhau, chưa đủ kết luận GLB làm chậm/tăng tốc; sân chính vẫn chỉ ~16–18 FPS. Nhiệt pin đọc qua ADB từ 32,0°C lên 36,2°C sau ba lượt, màn hình vẫn sáng.
- Đây là thiết kế theo ngôn ngữ mái chùa Việt, **chưa phải phục dựng chính xác công trình thật** vì chưa có ảnh/đo vẽ tham chiếu; chưa dựng trọn kiến trúc hai điện và chưa thay Điện Mẫu, Nhà Tổ hay các nhà khác. Cần đối chiếu ảnh chùa thật trước khi tăng độ chi tiết ở khu trung tâm.
- Tin mới `LATEST_NEWS_ID` 129 → 130. Chưa commit/push.

### Điều tra FPS sân chính trên Note20 (2026-11-17, local)

- Đo trực tiếp Note20/Chrome (viewport 384×716, canvas 576×1074), camera tĩnh `(0,10,32)` nhìn `(0,2,-10)`, mỗi phép A/B làm nóng 1,5 s rồi lấy mẫu 6 s và trở lại baseline xen kẽ. Dữ liệu `shots/note20-court-profile.json`; phân nhóm draw call một frame tại `shots/note20-court-draws.json`. Script chạy từ `tools`: `node note20-court-profile.mjs` / `node note20-court-draws.mjs`; cần kết nối CDP cổng 9222 trên Chrome Note20.
- Máy đã nóng (pin ~39–40°C) nên baseline thấp hơn lượt trước: khoảng 14–15 FPS. Mỗi frame sân chính ~1.400–1.700 draw call / ~1,0–1,1 triệu tam giác, trong khi riêng `renderer.render()` mất ~60–65 ms (wall time JS/driver), phần còn lại khoảng 4–7 ms. Có ~9.200 object trong scene, ~6.800 mesh, ~2.800 mesh castShadow; camera gần Tam Thế chỉ ~359 draw call màu theo lượt phân nhóm. Không suy diễn đây là thời gian GPU thuần.
- Shadow map mặt trời 1024² cập nhật hằng frame: tắt castShadow tạm thời ~20–21 FPS, đóng băng shadow map ~19–20 FPS so với baseline ~14–15. Tắt riêng castShadow của nhóm La Hán không cải thiện, dù chúng góp nhiều tam giác trong shadow pass. Không giữ shadow map đóng băng vì mặt trời/NPC di chuyển.
- Độ phân giải halving (canvas 288×537), bỏ post hay bỏ riêng bloom hầu như không cải thiện FPS; nút thắt chính không phải fill-rate hoặc hậu kỳ. Ẩn thử NPC: ~17 FPS; ẩn thử Chính Điện: ~15,8 FPS; ẩn thử Tam Thế: ~15,3 FPS, chỉ dùng để quy nguồn tải, không phải giải pháp thực tế. Góc sân chính cần vẽ đồng thời ~351 call Chính Điện, ~277 Tam Thế, ~321 nhân vật, ~164 hồ koi (số nhóm từ một frame; có dao động do NPC).
- Hướng tối ưu ưu tiên: giảm số mesh/draw call của nội thất hai điện và NPC bằng gộp/instancing theo vật liệu trong từng cụm; giảm số caster động/không nhìn thấy trong shadow frustum hoặc tách bóng tĩnh và động trước khi cân nhắc đóng băng map. Không giảm pixel ratio hay tắt bloom làm bước đầu. Chưa áp dụng thay đổi chất lượng/kiến trúc nào từ phép thử này.

## Model Blender đợt 1 (2026-11-17, local)

- Thay kiến trúc Điện Dược Sư và ba tịnh thất trong `src/expansion.ts`; chưa chuyển các công trình khác. Giữ nội thất, tượng, biển chữ Việt, ghế, collider, zones và groundY trong game.
- Nguồn chỉnh sửa: `tools/blender/campus-architecture.blend`, hai collection riêng. Trong file nguồn tịnh thất được đặt lệch x=20 để dễ xem; khi xuất GLB cả hai asset đều ở gốc, đơn vị mét, Y-up, mặt trước +Z, scale 1.
- Dựng lại bằng `& "C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" --background --factory-startup --python tools/build-architecture.py` tại gốc repo. Script ghi lại hai GLB, `.blend` và `tools/blender/architecture-audit.json`.
- `public/models/dien-duoc-su-blender.glb`: 13.704 tam giác, 6 mesh/vật liệu, 732.832 byte; bao mái khoảng 15,13 × 11,53 m, cao 10,05 m; nền 12 × 9 m, cao 0,45 m.
- `public/models/tinh-that-blender.glb`: 2.744 tam giác, 6 mesh/vật liệu, 149.860 byte; bao mái 4,33 × 3,73 m, cao 3,95 m; nền 3,2 × 2,5 m, cao 0,16 m. Ba bản sao dùng chung geometry/material và chỉ tải một file.
- Vật liệu PBR màu, opaque, single-sided; không có texture ngoài, animation hoặc phụ thuộc file rời. Mái cong có độ dày, đường gân ngói và diềm; cửa sổ là lỗ thật với chấn song.
- Loader thay đúng nhóm kiến trúc sau khi tải thành công và dispose geometry fallback; không dispose vật liệu dùng chung. Nếu tải lỗi vẫn giữ kiến trúc procedural.
- Đạt `node tools/verify-architecture.mjs`, `npm run build`, `npx tsx tools/verify-expansion.ts`. Browser xác nhận 4 instance, kích thước đúng, 7 ghế, groundY 0,45/0,16 và zone Dược Sư còn nguyên. Chặn hai URL GLB vẫn giữ đủ 4 fallback.
- Ảnh: `shots/blender-duoc-su.png`, `shots/blender-tinh-that.png` và bản `-ingame.png`; số đo `shots/blender-architecture-metrics.json`. Render riêng không shadow: Điện 6 calls, ba tịnh thất 18 calls, chưa tính sàn test. Chi tiết mesh tăng so với kiến trúc khối cũ.
- Đã đo **Note20 thật** qua USB/ADB: SM-N981N, Chrome Android, màn hình 1080×2400, viewport 384×716 CSS px, canvas 576×1074 px, Vite dev với 4 GLB tải thành công. Script `tools/note20-fps.mjs` dùng `requestAnimationFrame` và đếm riêng `renderer.render` của scene (không lấy `renderer.info` sau post-pass làm số draw call); mỗi góc làm nóng 2 giây rồi đo 8 giây, camera đứng yên. Bản GLB lần đầu: sân chính **19,12 FPS**, Dược Sư gần/xa **34,17/32,59**, tịnh thất gần/xa **37,50/37,05**, thang Ngọc **37,19**. Chi tiết ở `shots/note20-fps-blender.json` (lượt đầu trước khi thêm đếm render).
- Đối chứng 3,5 giây/góc trên máy đã ấm: GLB Dược Sư **27,39 FPS render**, tịnh thất **29,31**; chặn GLB để dùng procedural: **27,17/29,61**. Lưu `shots/note20-fps-blender-quick.json`, `shots/note20-fps-procedural-quick.json`. Lượt GLB sau khi bật lại: **28,35/31,91**. Khác biệt nhỏ hơn dao động giữa các lượt, **không đủ kết luận GLB tăng/giảm FPS**. Nhiệt pin đọc bằng ADB tăng từ 30,5°C lên khoảng 37,7°C; có lượt Chrome timeout và màn hình tắt, đã loại khỏi kết quả. Góc sân chính còn ~14–19 FPS tùy lượt, vấn đề hiệu năng toàn cảnh chưa giải quyết; chưa đo frame GPU hay thử nhiều máy.
- Tin mới `LATEST_NEWS_ID` 128 → 129. Chưa commit/push. Lỗi đường NPC trung tâm của đợt trước chưa được xử lý trong đợt model này.

## Mở rộng khuôn viên 24/7 (2026-11-17, tích hợp local; còn lỗi đường NPC trung tâm)

### Phạm vi và trải nghiệm
- User cho phép thi công theo bản đồ ngày 17/11 sau khi đọc GitHub. Nền code: `origin/main` tại `3e28376`, đã `git pull --rebase`, không có commit mới.
- Mục tiêu: người chơi đi từ Tam Quan qua khuôn viên cũ tới các cảnh quan mới và đỉnh Chùa Ngọc. Các cầu phải thông, nước không đi xuyên được, cao độ nhân vật khớp mặt nền.
- Vòng chơi dùng hệ thống hiện có: nhận nhiệm vụ từ NPC, đi tới điểm hành hương/thiền hành hoặc dâng hương, quay về nhận công đức. Không thêm chiến đấu hay cơ chế thua.
- Khu Nam và điện cũ giữ vai trò định hướng. Tây là đời sống tăng đoàn/hồ sen; Đông là Dược Sư, rừng trúc, sông và vườn hoa; Bắc là đường núi và điểm nhìn cao nhất.
- Ban đầu kiến trúc procedural, gộp mesh theo vật liệu và theo từng cụm để giữ culling. Đợt Blender phía trên thay kiến trúc Dược Sư và tịnh thất bằng GLB; các phần khác giữ nguyên.

### Quy hoạch đã áp
- Tường `x ±92`, Bắc `z −122`, Nam `45`; hai cổng phụ `(±92, 2)`, không cổng Bắc. Dữ liệu dùng chung ở `shared/campus.ts`.
- Chuông `(34, −6)`, trống `(−34, −6)`, Bảo Tháp `(−34, −15)`, phòng công đức `(35, 33)`, khu nghỉ `(−35, 33)`.
- Hồ koi `(0, 14)`, elip `14 × 10`, cầu trục `z 2..26`; bỏ quảng trường tròn. Bồn hoa và Thủy Đình giữ tọa độ đã chốt.
- Tăng xá dời tới `(−64, −74)`, thu thân nhà vào vùng `x −70..−58`; ba tịnh thất phía Nam. Vườn Tháp dời tới `(50, −94)`, mang cả tượng Cleveland theo hằng tọa độ; không thay model tượng.
- Các hạng mục mới: vườn rau/ao sen, hồ sen Tây và đình; rừng trúc, Dược Sư, vườn hoa; sông `x 63..67 / z −82..14` với ao cuối `(65,16)`; Chùa Ngọc, động thiền, rừng thông, hai đình nghỉ.
- Cầu bắt buộc: hồ sen Tây `z 2`; sông Đông `z −38` và `z 2`. Biên client/server và pathfinder cập nhật cùng bản đồ.
- `ngocStepProfile()` là nguồn chung cho hình học và cao độ: 299 bậc + 2 chiếu nghỉ 1 m; bước sâu `(30−2)/299`, tổng cao 6 m. Bậc được gộp, không tạo 299 draw call.
- Giữ lối giữa sân: dời lư hương rời ngoài sân từ `(0,−13)` sang `(3.4,−20.5)`. Không thay bàn thờ hay tượng trong các điện cũ.
- Các điểm quét sân/cây ở `(±8.5,12)` được dời tới `(±16.5,1)` vì hồ mới chiếm chỗ cũ. NPC, map, danh sách địa điểm và giới hạn được cập nhật cùng tọa độ.

### Gameplay và giới hạn
- Thêm nhiệm vụ visit Chùa Ngọc, rừng trúc, bờ sông và nhiệm vụ dâng đèn tại Dược Sư trên hệ thống nhiệm vụ hiện có.
- Thả hoa đăng tại hồ sen Tây và sông Đông tái dùng action/reward hiện có; sông có chuyển động đèn theo dòng. Payload đèn chứa tọa độ để cả phòng thấy đúng điểm thả.
- Nút Dược Sư dâng đèn cầu an bằng action `lantern` hiện có, hiệu ứng đèn đứng trước bàn thờ. Server kiểm tra đúng vùng cho nhiệm vụ lantern; không thêm tiền tệ hay chỉ số sức khỏe mới. Rota chấp tác rau và lộ trình tu sĩ R5 chưa triển khai; không coi cảnh luống rau là hệ thống thu hoạch.
- Nhiệm vụ Chùa Ngọc kiểm tra điểm đến như các nhiệm vụ visit khác; không có bộ đếm từng bậc hay chống teleport mới.
- FPS/frame-time điện thoại thật: **chờ số đo máy thật**. Chưa commit/push/deploy đợt mở rộng này.

### Kiểm chứng
- `npm run typecheck`, `npm run build`: đạt; build còn cảnh báo bundle >500 kB.
- `npx tsx tools/verify-expansion.ts`: đạt 299 bậc/2 chiếu nghỉ, groundY, khe cổng, chặn nước, vị trí cũ đã giải phóng, điểm sinh và graph liên thông.
- `node tools/verify-expansion-server.mjs`: đạt spawn ngoài hồ; nhận 4 quest mới, hoàn thành 3 quest visit; cầu an chỉ tính trong vùng Dược Sư; đèn broadcast đúng gốc tọa độ. Move vào sông bị từ chối; reconnect giữ vị trí khô trên cầu. Test tạo khách local mới, không sửa tài khoản có sẵn.
- `tools/steps-expansion-paths.mjs`: 30 tuyến từ `(0,30)` tới khu mới/công trình di dời đều tới đúng đích, không fallback. Lấy mẫu mỗi 0,12 m bằng hàm `collide` thật, độ đẩy lệch lớn nhất bằng 0. Đây là kiểm tra hình học tuyến, không mô phỏng input từng frame.
- Kiểm tra riêng vòng lặp click-to-walk thật từ chân thang `(0,−82)` tới `(0,−112.5)`: nhân vật lên được mặt nền cao 6 m, dừng cách đích khoảng 0,54 m theo ngưỡng client. Không dùng dịch chuyển để thay cho đoạn leo thang.
- Chạy thực qua cầu hồ sen Tây `(-90,2) → (-66,2)` và cầu sông Đông `(60,-38) → (70,-38)`: tới đích trong ngưỡng 1 m. Bật test này bằng `$env:WALK_INPUT='1'` khi chạy `steps-expansion-paths.mjs`; script mặc định chỉ kiểm tra hình học để không phải chờ các lượt đi dài.
- Pathfinder có A* lưới giới hạn trong bản đồ khi graph không tìm được đường. Bộ tìm đường dựng lại khi model tải thêm collider. Các điểm Bảo Tháp, Vườn Tháp và tịnh thất dùng vị trí tiếp cận thay vì tâm bị vật thể chiếm chỗ.
- `tools/steps-expansion.mjs`: 6 đường tâm cầu/cổng/thang không bị đẩy lệch. Cao độ mỗi bậc Ngọc khoảng 0,02007 m; đầu cầu đá vẫn đổi cao độ 0,28 m, chưa có ramp mượt.
- Đã chụp 16 góc cảnh cùng bản đồ trong `shots/expansion-*.png`; số đo ở `shots/expansion-metrics.json`. Bản đồ desktop không cắt ngang; mobile cuộn được tới các địa điểm phía Đông, không tràn trang. Khu mới gộp theo vật liệu từng khu; Dược Sư 19 mesh, Chùa Ngọc 16 mesh; riêng mặt bậc Ngọc là 1 mesh.
- Render trực tiếp ở 1280×800, ánh sáng kiểm chứng và tắt fog: góc toàn cảnh khoảng 6.400 calls / 3,73 triệu triangles, gồm cả cảnh cũ và shadow pass. Không phải chi phí riêng phần mở rộng, cũng không phải FPS. Chờ số đo máy thật trước khi kết luận hiệu năng đạt.
- Mạng NPC có 181 node/193 cạnh, liên thông và không qua nước mới ngoài cầu. Các cạnh khu mở rộng phía Tây/Đông/Bắc đã lấy mẫu collider thật, không bị đẩy lệch. Còn 25 cạnh qua khu trung tâm/công trình di dời bị đẩy hơn 0,06 m (có đoạn tới 1,63 m); chi tiết ở `shots/expansion-path-diagnostics.json`. Không coi toàn mạng NPC đã nghiệm thu.
- Review: sửa predicate spawn NPC loại nước mới, phục hồi vị trí resume bằng giới hạn tường và điểm khô gần nhất. Bước khỏi mép cầu vào nước mới bị trả về vị trí trước, không còn chiếu xuyên vài mét tới bờ xa. Test thêm chỗ sông/ao chồng nhau và mặt sàn Ngọc phía Bắc. Hai cổng phụ vẫn cho đứng trong túi ngoài tường 4 m tại dải cổng; ngoài dải đó bị clamp vào trong.
- Tin mở rộng thêm đầu `src/data/news.ts`, `LATEST_NEWS_ID` **127 → 128** (không dùng id từ các mốc A2 cũ).

## Commit gần nhất: 7a70bf1 (fix admin log, 2026-11-17) — HANDOFF bắt kịp tới tin 129
Push lên `origin/main` (byluvtn/ChuaOnline).

## Việc để lại làm sau ở nhà (user dặn 2026-11-17 17:00)

### 1. Phân tán NPC khỏi khu giữa (✅ XONG 19/11 — b2ece2b)

- Vấn đề (user quan sát 2026-11-17): NPC tập trung đông ở giữa
  (quảng trường/cầu/sân điện); luồng đi của NPC là vào cổng → qua cầu
  → thắp hương → qua cầu về.
- Nguyên nhân đã biết: `server/npcs.ts` đã có `SPREAD_ROUTE_POOL`
  (20 điểm, gồm `tamThe`) + `pickDest` với logic qua cầu khi đổi phía
  Nam/Bắc, nhưng cầu là đường duy nhất qua lại Nam/Bắc nên NPC luôn
  dồn về trục giữa; pool có nhiều điểm giữa (plaza, hallFront,
  axisMid, pillars, bridgeS, bridgeN).
- Việc làm: giảm mật độ NPC ở giữa, tăng ở Điện Tam Thế + khu Bắc
  (sân Tam Thế, vườn tháp, am, hành lang Bắc) và xung quanh (vườn
  thiền, hồ, Điện Mẫu, sân Phật/Quan Âm). Gợi ý: trọng số pool lệch
  về Bắc/ngoại vi, thời gian dừng lâu hơn ở Tam Thế, một số NPC
  "cư trú" quanh Tam Thế ít về giữa.
- Giữ nguyên: 37 NPC, behavior (tụng kinh, đánh chuông, dialogue,
  nhiệm vụ) — chỉ đổi PHÂN BỔ + ĐIỂM ĐẾN, không đổi hệ thống.
- File: `server/npcs.ts` (+ `shared/roads.ts` nếu cần thêm node đường).
- Nghiệm thu: đếm NPC theo vùng trước/sau (server đang chạy) hoặc
  ảnh chụp minimap/sân giữa/sân Tam Thế cho thấy NPC rải ra;
  `npx tsc --noEmit` phải PASS. Không thêm mục tin (chỉnh cân bằng,
  không phải tính năng mới).
- Lưu ý: Lux đã cho agent làm thử lúc 16:53 nhưng user bảo dừng để
  về nhà tự làm — agent tắt khi mới đang clone, chưa viết code nào.
- ✅ XONG 19/11 09:46 (commit `b2ece2b`): phân tán NPC v2 + THÊM 4 người phụ trách khu mới (Sư Cô trông Điện Dược Sư, Tiểu Trồng Rau, Tiểu Quét Thang, Cô Trông Đình) với nhiệm vụ hằng ngày tại chỗ (+115 xu, +70 công đức/ngày). Vì thêm NPC + nhiệm vụ mới (tính năng, không chỉ cân bằng) nên đợt này CÓ tin tức — tin 140.

### 2. Đợt 3 còn lại: 3.15 + 3.16 (✅ XONG 17/11)

- Bối cảnh: Đợt 3 (sửa lỗi theo `AUDIT.md`) đã xong 3.1–3.13, 3.14
  đang làm dở lúc viết handoff này; Lux push 3.1–3.14 lên main trong
  ngày 2026-11-17 — kiểm tra `git log` để xác nhận trước khi làm
  3.15/3.16. Mô tả lỗi đầy đủ ở `AUDIT.md` (gốc repo, mục #30/#31/#57).
- **3.15 Service worker (#30, #31).** #30: `public/sw.js` — mọi
  navigation ghi đè khóa `'/'` kể cả phản hồi lỗi; cache không đổi
  phiên bản nên bundle cũ tích lũy → kiểm `res.ok`, cache có phiên
  bản, chỉ cache đúng pathname `/`. #31: SW chỉ đăng ký trong
  `initMenu` (sau đăng nhập) → đăng ký SW trước đăng nhập. File:
  `public/sw.js`, `src/menu.ts`, `src/main.ts`. Ghi chú: có thể gộp
  vào R4.2 (PWA) thay vì làm riêng.
  → ✅ XONG 17/11 (commit e7a5275, không tăng news): cache 'co-shell-v2',
  navigate chỉ cache khi res.ok + pathname '/', đăng ký SW chuyển sang
  main.ts top-level (trước đăng nhập), bỏ khỏi initMenu.
- **3.16 Deploy (#57) — ✅ XONG 17/11 (chọn (a): xóa hẳn).** Spec gốc:
  thêm `concurrency` cho workflow, ghim action thay `@master`, sửa
  comment nhắc Turso sai bối cảnh (file `.github/workflows/deploy-fly.yml`,
  `fly.toml`). NHƯNG game đã chuyển khỏi Fly sang Oracle ngày 2026-11-17:
  workflow deploy-fly.yml đã `disabled_manually` trên GitHub (verify qua
  API 17/11; lần chạy cuối 17/11 08:30Z) + Fly đã chết/máy đã dừng, nên
  spec gốc không còn ý nghĩa — xóa hẳn `.github/workflows/deploy-fly.yml`
  + `fly.toml` trong commit 3.16 này. Không còn tham chiếu live nào (chỉ
  còn nhắc trong AUDIT.md / flyio-deploy.md / Dockerfile — tài liệu/lịch
  sử, để nguyên). ✅ Lọc `.md`-only cho auto-pull Oracle ĐÃ CÓ (phát hiện 18/11: log ghi "docs-only changes — pulling without rebuild/restart", 8 lần) — push chỉ có .md không restart game nữa. Không rõ ai làm, khi nào.

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

## A2.1 — Mở rộng khuôn viên: ĐÃ XONG §1 (layout.ts) + §3 (hành lang + La Hán)
Nguồn thiết kế: `phan-a2/phan-a2-mo-rong-chua-online.md` (không có file spec A2.1 riêng). Baseline: `main` sau commit `dfc0fcd`. Commit: `dce2a94` (layout), `dab445e` (hành lang + La Hán); đã push `origin/main`.

### Đã làm
- **§1 `src/layout.ts`:** `CORR.half` 1.9 → 2.6 (hành lang rộng 3.8 → 5.2). `groundY()` và `src/features/map.ts` dùng `CORR.half` nên tự theo, không sửa thêm.
- **§3 `src/temple.ts` (khối hành lang):** mái `slabG` rộng 2.7 → 3.4; cột `off` ±1.7 → ±2.4; vị trí tấm mái `s * 1.18` → `s * 1.62`; đèn lồng `off` ±1.15 → ±1.65; ghế đá `side * 1.3` → `side * 1.7`; bảng hiệu cột `CORR.x - 1.7` → `CORR.x - 2.4`.
- **La Hán:** 10 → 6 tượng mỗi bên, `z = -16.5 + 3k` (k = 0..5), cách nhau 3, xếp mép NGOÀI hành lang `x = side * CORR.x + side * 2.0`. Bỏ `ARHAT_INNER` (không còn hàng trong), cập nhật comment tương ứng.
- **Collider:** thêm collider cho ghế đá hành lang (`r: 0.5`); collider tượng La Hán giữ `r: 0.42`, tự theo vị trí mới.

### Kiểm chứng
- `npm run typecheck` pass; grep không còn tham chiếu `ARHAT_INNER`.
- Chưa chụp ảnh / chưa chạy game để nhìn hành lang mới; chưa đối chiếu cột mới với `blocked()` (vùng cấm cây/hoa quanh hành lang ở `layout.ts` dòng 121, 143 còn theo bề rộng cũ).

### Phần còn lại của A2.1 (§4–§13), chia cho các session sau
Spec gốc của `phan-a2/...md` đánh số theo mục 1–9 (không có §10–§13 trong file đọc được); thứ tự gói đề xuất ở mục 9 của spec:
1. **A2.1 (tiếp):** mở map (tường ±62, Bắc −82), dời/nới nhà (hai viện, thiền đường, phòng công đức, vườn phóng sinh, tháp nhỏ), phố trước cổng, mạng đường 4 cấp (mục 1–2). Chưa làm: đổi `WALL`, tọa độ các nhà, `blocked()` cho vùng mới.
2. **A2.2:** trị đơ trên máy thật (merge mesh cho `buildHouse`/`extraHouse`/am cổ, pre-warm, đo frame-time) + lỗi lẻ (chuông treo ngược, collider) — mục 4 + 7.
3. **A2.3:** nội thất 6 nhà — mục 3.
4. **A2.4:** Điện Tam Thế + bộ ba tượng — mục 5.
5. **A2.5:** NPC mở rộng + ca trực/nghỉ + di chuyển theo mạng đường — mục 6.

### Prompt sẵn để mở session mới làm tiếp §4 + §5
```
Đọc HANDOFF.md (mục "A2.1" cuối file) và phan-a2/phan-a2-mo-rong-chua-online.md mục 4 (Trị đơ trên máy thật) + mục 5 (Điện Tam Thế — dựng từ zero). A2.1 §1 + §3 đã xong (CORR.half 2.6, 6 La Hán/bên) — không làm lại.
Phạm vi session này: CHỈ mục 4 và mục 5 của spec. Không mở rộng sang mở map, nội thất, NPC.
Mục 4: mở rộng mergeStaticByMaterial cho buildHouse, extraHouse, builder am cổ; pre-warm (renderer.compile + nạp trước texture bảng hiệu); nghiệm thu bằng frame-time trên máy thật theo tuyến cố định qua 5 nhà, có số liệu trước/sau.
Mục 5: dựng Điện Tam Thế tại TAM_THE (0,-54): nền cao ~3.0, bậc lên từ đường trục, bộ ba tượng A Di Đà (trái) - Thích Ca (giữa, lớn nhất) - Di Lặc (phải), ban thờ phía trước; mẫu tượng theo Concept A Di Đà.webp / Concept Di Lặc.webp.
Sau khi xong: typecheck, commit theo cụm, push, cập nhật HANDOFF.md.
```

### Lưu ý
- Working tree còn nhiều file untracked không thuộc phạm vi (ảnh `shots/*.png`, `Bản đồ Phần A2 v7.png`, `Concept *.webp` ở gốc và trong `phan-a2/`); không đưa vào commit.

## A2.1 (tiếp) — ĐÃ XONG §1 còn lại + §4 + §5 (layout, nhà, hàng rào + cổng hai viện)
Nguồn: `spec-a2-1-mo-rong-ban-do-chua-online.md`. Baseline: `d58bdea`.

### Đã làm
- **`src/layout.ts`:** `WALL` x 62 / zN -82 / zS 45; dời `PAGODA`, `NHA_TO`, `TANG_XA` (gộp), `AM_CO`, `NHA_KHACH`, `THIEN_DUONG`, `TRAI_DUONG`, `VUON_THAP` theo spec; thêm `PHONG_CD`, `VIEN_KT`, `VIEN_TO`, `PS`, `PS_POND`, `PS_PIER`, `inPsPond`; xóa `TANG_XA_TAY*`, `TRAI_DUONG_DOOR`. Cập nhật `groundY` (PHONG_CD_PLAT, bến PS_PIER), `blocked`, `clampToCompound` (mở lối ra phố, chặn xuyên tường hai chiều), `resolveWater` (ao phóng sinh).
- **`src/temple.ts` §4:** đổi kích thước nhà tổ/tăng xá/nhà khách; thiền đường xoay hướng Đông (`ry = π/2`, collider hoán đổi trục); trai đường dựng bằng `extraHouse`; thêm Phòng Ghi Công Đức; xóa hẳn `longHouse`.
- **`src/temple.ts` §5:** `buildVienFence` cho hai viện (InstancedMesh, bám `groundY`, collider r 0.6 cách ≤1.1, cổng rộng 3.2 có trụ + biển). Mạng `pathRect` cũ thay bằng đường mới (vành đai, đường hậu, cổng viện, bến phóng sinh, thiền đường, điện mẫu, phòng công đức, bảo tháp).

### Kiểm chứng
- `npm run typecheck` + `npm run build` sạch; grep không còn `longHouse`/`TANG_XA_TAY*`/`TRAI_DUONG_DOOR`; `tools/npc-sim.mjs` (chạy qua `npx tsx`) chạy bình thường với layout mới.
- Chưa chụp ảnh, chưa đi bộ kiểm trong game.

### Chưa làm (còn lại của spec A2.1)
§6 Vườn Phóng Sinh (dựng cảnh), §7 phố trước cổng, §8 phần map.ts, tin tức, hành lang La Hán đã xong ở phiên trước; script chụp `a21-*.png`.

## A2.1 (lát 4) — ĐÃ XONG §10 bản đồ + §11 tin tức + §12 nghiệm thu
Baseline: `ba8b0c1`. Commit: `3cc7dbd` (map.ts), `5eb81d5` (news.ts, `LATEST_NEWS_ID` 5 → 6).

### Đã làm
- **`src/features/map.ts`:** khung bản đồ riêng x −66..66, z −88..64; `PLACES` dùng điểm trước cửa (Nhà khách, Tăng xá, Trai đường, Nhà Tổ, Am Cổ) và thêm Thiền đường, Phòng Ghi Công Đức, Vườn Phóng Sinh, Điện Mẫu, Đền Trình; `drawStatic` vẽ lại hai viện, vườn phóng sinh + ao, phố trước cổng, các nhà theo `*_PLAT`.
- **`src/data/news.ts`:** mục "Mở rộng khuôn viên chùa", `LATEST_NEWS_ID` = 6.
- **Script nghiệm thu:** `tools/steps-a21.mjs` (chụp 8 ảnh `shots/a21-*.png`, đếm La Hán) và `tools/steps-a21-walk.mjs` (đi bộ kiểm bằng mô phỏng `collide` của game, dt cố định 0.05, không phụ thuộc FPS).

### Kiểm chứng
- `npm run typecheck` sạch. `tools/steps-verify-beads.mjs` (server thật) TẤT CẢ PASS.
- 8 ảnh `a21-overview/vien-kt/vien-to/thien-duong/phong-sinh/pho/hanh-lang/map.png` đã chụp.
- **Số tượng La Hán đếm được:** Tây 6, Đông 6 (tổng 12).
- **Đi bộ kiểm 19/19 PASS:** cổng Nam ra phố và quay vào; vào cổng Viện Khách Tăng và Viện Tổ; tới cửa Nhà khách (−47,−57.5), Tăng xá, Trai đường, Nhà Tổ, Am Cổ, Thiền đường, Phòng Ghi Công Đức, Điện Mẫu (39,13), Đền Trình; đứng được trên bến phóng sinh (28,−31) và (33,−31); không xuyên tường Nam (cả hai chiều), không xuyên rào Viện KT và Viện Tổ.

### Lệch so với spec / ghi chú
- Cửa Nhà khách thực tế quay Nam (`z + hz`), cột mặt tiền chắn phía Bắc: điểm "trước cửa" spec ghi (−47,−55.5) nằm sát hàng cột ở z −54; đi bộ kiểm dùng điểm (−47,−57.5) và lộ trình vòng từ phía Nam.
- Cửa Điện Mẫu (39,10) nằm trong nhà; hàng cột Bắc ở z 7.8, mặt hở phía Nam (z ≈ 12.2): điểm kiểm dùng (39,13), vào từ phía Đông–Nam. `PLACES` vẫn giữ (39,10) theo spec; `goTo` dùng `planPath` nên tự vòng được.
- Chrome headless (SwiftShader) chỉ đạt ~1–1.7 FPS nên đi bộ kiểm qua `goTo` thật bị chậm; đã chuyển sang mô phỏng trong trang với đúng logic collider của game.
- Ngưỡng kiểm "không xuyên tường Nam từ phố vào" là z > 45.4 (collider cột tường r 0.55 + bán kính người 0.4 giữ ở z ≈ 45.8).

## A2.4 — Điện Tam Thế + chỉnh nhãn bản đồ + camera trong điện
Baseline: `0ba70ff`. Thay đổi tập trung ở `src/tamthe.ts` (mới), `src/temple.ts`, `src/layout.ts`, `src/couplets.ts`, `src/features/map.ts`, `src/main.ts`.

### Đã làm
- **Điện Tam Thế** tại `TAM_THE` (0,−54), dựng trong `src/tamthe.ts` và gắn vào `temple.ts` (zone `tamThe`, câu đối trong `couplets.ts`). Nền cao ~3.0, đi được từ tam quan lên qua các bậc (độ cao 0 → 1.35 → 3.0), bộ ba tượng A Di Đà – Thích Ca – Di Lặc.
- **`src/features/map.ts`:** thêm bảng `LABEL_DZ` để dời nhãn riêng từng địa điểm, hết chồng nhãn: Điện Tam Thế (−7), Bảo tháp (4.5), Vườn Tháp (−3.5), Nhà Tổ (4), Sân thiền trái/phải (−2.5); Hồ cá koi và Cầu cong giữ như cũ.
- **`src/main.ts`:** camera bù khi vào zone `tamThe`: biến `camInside` (mượt, hệ số `dt * 3`) cộng thêm 3.5 vào khoảng cách và 0.18 vào góc nâng; vị trí và điểm nhìn camera cộng thêm `root.position.y` để bám độ cao nền điện.

### Kiểm chứng
- `npm run typecheck` sạch.
- `tools/steps-tamthe.mjs` (`STEPS=./steps-tamthe.mjs`, chạy bằng `shot.mjs`): nhân vật đi từ tam quan lên nền điện (y = 3), zone `tamThe`, câu đối hiện. Ảnh nghiệm thu `shots/tamthe4-tamthe-map-after.png` (nhãn bản đồ đọc rõ) và `shots/tamthe4-tamthe-inside.png` (thấy đủ ba tượng, không bị che). Các ảnh `tamthe-*`, `tamthe2-*`, `tamthe3-*` là các lần chụp trung gian.
- Gapdump `vuonThap` còn `remaining=40` và `pagoda` còn `remaining=5` (đã có từ trước, không thuộc phạm vi lần này).

### Chưa chắc chắn / việc còn treo
- Mức bù camera (3.5 / 0.18) chỉnh bằng mắt trên ảnh headless, chưa thử trên máy thật hay điện thoại.
- `LABEL_DZ` dời nhãn theo từng tên cụ thể; thêm địa điểm mới có thể cần bổ sung ở đây.
- Chưa chạy lại đi bộ kiểm toàn khuôn viên sau thay đổi camera (không đụng collider).
- Chưa deploy.
- Tin tức: thêm entry "Điện Tam Thế", `LATEST_NEWS_ID` 6 → 7.

## A2.5 — Làm mượt chuyển động nhân vật (accel/decel + bước chân khớp tốc độ)
Chỉ đụng `src/main.ts` (vòng lặp `loop()`), `src/character.ts`, `src/data/news.ts`. Không đổi collider, layout hay mạng.

### Đã làm
- **`src/main.ts`:** thêm trạng thái `curSpeed`, `moveDir`, `gaitPhase` và hàm `rampSpeed(target, dt)`. Tăng/giảm tốc ~0.25 s (hằng `ACCEL_S`, `DECEL_S`, tốc độ trần `RUN_SPEED`), dùng chung cho phím, joystick và click-to-move. Thả phím vẫn trượt tiếp theo `moveDir` rồi dừng dần.
- **Quay đầu >90°:** khi `curSpeed > 0.5` và hướng mới ngược `moveDir` thì `targetSpeed = 0`, giữ `moveDir` cũ cho tới khi gần dừng rồi mới nhận hướng mới.
- **Tới đích click/planPath:** `targetSpeed` giảm theo quãng đường còn lại (`ARRIVE_DIST` = 1.5, sàn 0.12 tốc độ); dừng ở waypoint cuối khi `wpDist < 0.9` và (chậm hoặc hướng đã đảo ngược) để hết dao động quanh đích.
- **`src/character.ts`:** thêm trường `gait` (pha bước theo quãng đường, `-1` khi không dùng). Với anim walk/run pha chân lấy từ `gait % 1` thay vì thời gian clip, nên bước chân khớp tốc độ và không reset khi đổi anim. `gaitPhase += curSpeed * dt / STRIDE_M` với `STRIDE_M = WALK_SPEED * 1.24`.

### Kiểm chứng
- `npm run typecheck` và `npm run build` sạch.
- `tools/steps-smooth4.mjs` (`STEPS=./steps-smooth4.mjs`, chạy bằng `shot.mjs` với viewport 320x200): đo `curSpeed`/pha theo frame mô phỏng. Tăng tốc 0 → 3.8 đúng giới hạn accel*dt, giảm tốc về 0, phanh quay đầu 3.8 → 2.4 → 1 → 0 rồi tăng tốc lại hướng ngược, pha bước liên tục. Ảnh `shots/smooth4-turn-end.png`.

### Chưa chắc chắn / việc còn treo
- Headless chỉ ~3 FPS nên `dt` bị chặn 0.05 và vận tốc theo giờ thực không đo được; số liệu dựa trên bước mô phỏng, chưa thử cảm giác trên máy thật hay điện thoại.
- Hằng số 0.25 s, `ARRIVE_DIST` và ngưỡng phanh quay đầu chỉnh theo số liệu, chưa tinh chỉnh bằng tay.
- Animation khác (ngồi, lạy, NPC) không đổi; NPC/remote vẫn dùng pha theo thời gian vì `gait = -1`.
- Chưa deploy.
- Tin tức: thêm entry "Chuyển động mượt hơn", `LATEST_NEWS_ID` 7 → 8.

## A2.6 — Tượng Phật scan vàng bóng ở Vườn Tháp
Chỉ đụng `src/statue-scan.ts` (mới), `src/world.ts`, `src/main.ts`, `src/data/news.ts`, `public/models/seated-buddha.glb`, `tools/steps-statue-scan*.mjs`, `shots/statue-scan-*.png`.

### Đã làm
- **`public/models/seated-buddha.glb`:** tải từ https://www.yeldabalta.com/models/seated-buddha.glb, 10.282.820 byte, SHA-256 khớp `cb326ff9...0c78be` (CC0, Cleveland Museum of Art).
- **`src/statue-scan.ts`:** `buildSeatedBuddhaStatue(scene, renderer, colliders)` dựng bệ đá procedural (1,9×1,9×0,55 + mũ bệ) tại tọa độ cục bộ (−5,4; 2,3) trong Vườn Tháp (thế giới ≈ 43,6; −60,7), nạp GLB qua `loadModel`, phủ vàng bóng (0xD4AF37, metalness 1, roughness 0,2) với `envMap` cục bộ từ `RoomEnvironment` + PMREM (scene không có environment nên metalness 1 sẽ render đen; không đổi `scene.environment`). Tượng cao 1,6 m trên bệ, cả khối ~2,3 m. Lỗi hoặc thiếu file: `console.warn` và giữ khối đá giữ chỗ, không crash. Collider r 1,2.
- **`src/world.ts` / `src/main.ts`:** `createWorld(renderer)` nhận renderer và gọi `buildSeatedBuddhaStatue` sau `buildTemple`.

### Kiểm chứng
- `npm run typecheck` và `npm run build` sạch.
- `tools/steps-statue-scan.mjs`: ảnh `shots/statue-scan-wide.png`, `statue-scan-close.png`, `statue-scan-map.png`; zone `vuonThap` và popup hiện.
- `tools/steps-statue-scan-walk.mjs`: mô phỏng 7.434 điểm quanh tượng với collider thật, `minD` 1,6, 0 điểm xuyên.

### Chưa chắc chắn / việc còn treo
- Chưa đo FPS trên máy thật (headless SwiftShader chỉ ~1–3 FPS); GLB nặng cần theo dõi trên điện thoại.
- Cỡ tượng và vị trí chỉnh bằng mắt trên ảnh headless.
- Gapdump `vuonThap` vẫn `remaining=40` (có từ trước).
- Chưa deploy.
- Tin tức: thêm entry "Tượng Phật vàng ở Vườn Tháp", `LATEST_NEWS_ID` 8 → 9.
## A2.8 — 4 tượng scan vàng thay 12 La Hán hành lang
Chỉ đụng `src/statue-corridor.ts` (mới), `src/temple.ts` (đoạn La Hán), `public/models/*.glb` + `README.md`, `src/data/news.ts`, `tools/steps-corridor*.mjs`.

### 4 tượng (đã đối chiếu SHA-256 với file user gửi; riêng arhat-binh là bản decimate)
| Tên file | Tượng / nguồn | Giấy phép | Byte | Mặt | SHA-256 |
|---|---|---|---|---|---|
| `arhat-binh.glb` | Figure of seated arhat with a vase (Bảo tàng Quốc gia Kraków) | CC0 | 6.303.376 (gốc 13.183.332) | 143.498 (gốc 358.748) | `d7cd30e88642c78b053a729b349fbc0d46c76e11cb01432b65001b37a4a65ede` (gốc `40334c2b…9d06`) |
| `monk-go.glb` | 10th C BCE Chinese monk (Minneapolis Institute of Art) | CC0 | 5.435.936 | 50.000 | `e6be082c2d0ead8c7e94a2f55deffab279dc7dcb9a76003ff783a482f434f542` |
| `guanyin-ngoi.glb` | Seated bodhisattva Guanyin, 12th C. CE (Minneapolis Institute of Art) | CC0 | 9.603.608 | 200.000 | `11ae46c74552e88e9e338cc5017a6571e20f56d5afa8ae7b2712a13aefb5fc13` |
| `guanyin-go-minh.glb` | Water Moon Guanyin, nebulousflynn | CC-BY-4.0 (credit trong `public/models/README.md`) | 7.434.520 | 53.958 | `e044dd79d10cf9f52720f43ab6af9e363d76069c9896dd566acdbf46cba47b32` |

### Giảm tải (§0.3)
- Tổng mặt 12 tượng trước decimate: 358.748×3 + 50.000×3 + 200.000×3 + 53.958×3 = 1.988.118 (> 1,5 triệu).
- Decimate arhat-binh bằng `gltfpack -si 0.4`: 358.748 → 143.498 mặt, 4 mesh → 1 mesh. Tổng 12 tượng sau: **1.342.368 mặt**. Không cần giảm số bản.
- Đo trong scene (`tools/steps-corridor-slots.mjs` đã chạy): từng khe đúng 143.498 / 50.000 / 200.000 / 53.958 tris, tất cả mesh có `metalness === 1` (vàng).

### Xếp xen kẽ và hướng mặt
- `modelIndex = (k + (side > 0 ? 2 : 0)) % 4` với [A arhat-binh, B monk-go, C guanyin-ngoi, D guanyin-go-minh]: bên Tây (side −1) bắt đầu từ A, bên Đông bắt đầu từ C; hai tượng đối diện nhau luôn khác mẫu.
- Hướng mặt: `rotation.y = -side * PI / 2` cộng góc bù từng mẫu trong `FACE_OFFSET`: arhat-binh 0, monk-go 0, guanyin-ngoi +PI/2, guanyin-go-minh +PI/2. arhat-binh nằm ngang trong file gốc nên có `UPRIGHT_X = -PI/2`. Góc bù xác định bằng ảnh `shots/face-{front,back,left,right}-*.png`.
- Cao 0,8 m (`fitModel` kiểu: đo bbox, scale về `TARGET_HEIGHT`), đáy đặt đúng mặt bục (CORR.y + 0,55). Vàng 0xD4AF37, metalness 1.0, roughness 0.2, envMap RoomEnvironment + PMREM; bỏ texture gốc, không viền toon.
- Tải bất đồng bộ: khối chibi `buildArhat` hiện trước, thay bằng tượng scan khi GLB tải xong; mẫu nào lỗi thì giữ chibi và `console.warn` (không crash). Lần chạy nghiệm thu không có mẫu nào rơi về fallback.
- Vị trí, bục đá, collider r 0.42 và `sealArchitectureJoints` của hành lang giữ nguyên.

### Nghiệm thu
- `npm run typecheck` sạch; `npm run build` sạch (chỉ cảnh báo chunk > 500 kB có từ trước).
- Ảnh đã xem bằng mắt: `shots/corr2-wide.png`, `shots/corr-close-*.png` / `corr2-close-*.png` (4 mẫu), `shots/corr-map.png`, `shots/face-*.png`. Vàng bóng rõ, tượng đứng trên bục, mặt hướng vào trục hành lang.
- Ảnh `corr2-close-monk-go.png` có một bục trống ở giữa khung hình. Đã chụp góc cao (không commit) kiểm tra: bục đó có tượng nhà sư vàng ngồi trên (do tượng nhỏ 0,24 m gốc nên bị khuất sau cột/bục ở góc thấp), không phải khe thiếu tượng. Số đếm scene xác nhận đủ 12 khe có tượng vàng.
- Walk-sim (`tools/steps-corridor-walk.mjs`): 2 hành lang × 21.168 điểm, khoảng cách nhỏ nhất tới tâm tượng 0,82 m, 0 điểm lọt vào bán kính collider 0,42.
- FPS máy thật: **chờ số đo máy thật** (headless chỉ ~2 FPS). Chưa đo bảng mesh/triangles trước-sau bằng `steps-cost.mjs`; chỉ có số tris từng khe ở trên.
- Chưa deploy.

### Việc người dùng
- Các GLB đã nằm trong `public/models/`; thư mục trung gian `statues-hanh-lang/` và các file scan gốc khác (`figure_of_seated_arhat_with_a_vase.glb`, `10th_c_bce_chinese_monk.glb`, thư mục `12th_c_ce_water-moon_guanyin*`) KHÔNG commit.
- Tin tức: thêm entry "Hành lang tượng vàng", `LATEST_NEWS_ID` 9 → 10.

## A2.2 — Gộp mesh nhà, sửa chuông, collider ghế, pre-warm
Đụng `src/temple.ts`, `src/compound.ts`, `src/main.ts` (hàm `prewarm`), `src/data/news.ts`, `tools/steps-cost.mjs`, `tools/steps-fps.mjs`.

### Đã làm
- `mergeStaticByMaterial` chuyển lên trước Am Cổ và gọi sau `sealArchitectureJoints` cho Am Cổ, Nhà Tổ, Tăng Xá, các nhà phụ (Điện Mẫu, Nhà Khách, Trai Đường, Phòng Công Đức) và Thiền Đường.
- Chuông: đảo profile Lathe (miệng chuông nằm dưới, quai trên).
- `woodBench` thêm 3 collider r 0,5 dọc ghế.
- `prewarm()` trong `src/main.ts`: `renderer.initTexture` mọi texture và `renderer.compile` scene một lần khi ẩn màn loading.

### Đo (headless, `tools/steps-cost.mjs`)
- Scene: 4.503 mesh, 2.487.476 tris.
- Mesh/tris sau gộp: nha-to 8/978, tang-xa 8/654, dien-mau 8/978, nha-khach 8/978, thien-duong 8/978, trai-duong 8/978, phong-cong-duc 6/974, am-co 9/1042.
- `npm run typecheck` và `npm run build` sạch (chỉ cảnh báo chunk > 500 kB có từ trước).
- FPS headless chỉ ~0,6–2,0, không phản ánh máy thật; FPS máy thật: chờ số đo. Chưa so bảng trước-sau.
- Chưa deploy.
- Tin tức: thêm entry "Tải mượt hơn, chuông đúng dáng", `LATEST_NEWS_ID` 10 → 11.

## A2.7 — Sửa biên đi lại phía Bắc (vào được Am Cổ)
Chỉ đụng `shared/types.ts`, `src/main.ts`, `server/index.ts`, `src/data/news.ts`, `tools/steps-a22-*.mjs`.

### Nguyên nhân
- `MAP_HALF = 68` kẹp `z` về `[-68, 68]` ở client (`src/main.ts`) và server (`server/index.ts`), trong khi tường Bắc ở `WALL.zN = -82`. Vùng z ∈ [-82, -68] không đi vào được nên Am Cổ (z = -75) bị cắt; nhân vật bị ép về đúng z = -68 trên mọi x.

### Đã làm
- `shared/types.ts`: thêm `MAP_Z_MIN = -82`, giữ nguyên `MAP_HALF` (còn dùng để rải cây/hoa trong `src/world.ts`).
- `src/main.ts` và `server/index.ts`: kẹp `z` bằng `[MAP_Z_MIN, MAP_HALF]`.

### Kiểm chứng
- `npm run typecheck` sạch.
- `tools/steps-a22-verify.mjs`: dịch chuyển tới z = -70/-75/-80 giữ nguyên vị trí, z = -85 kẹp về -81.06 (`clampToCompound`); `walkTo(48,-75)` tới (48.26, -74.53) sát cửa Đông Am Cổ rồi dừng ở collider tường bên. Ảnh `shots/a22-amco-amco-inside.png` hiện popup Am Cổ.
- Đã đo đi bộ tại ghế (`woodBench`), tường Nhà Khách, Tăng Xá, Nhà Tổ, hàng La Hán: không xuyên collider.

### Chưa chắc chắn / việc còn treo
- Headless chỉ ~2 FPS nên các ca đo đi bộ dài dừng sớm do thiếu thời gian, không phải do collider; chưa thử trên máy thật.
- `npm run dev` (concurrently -k) tự tắt khi `dev:server` thoát; đã chạy `dev:server` và `dev:client` riêng để đo.
- Chưa chạy `npm run build`. Chưa deploy.
- Tin tức: thêm entry "Đi được tới Am Cổ", `LATEST_NEWS_ID` 11 → 12.

## A2.3 — Nội thất 7 nhà
Chỉ đụng `src/temple.ts`, `src/data/news.ts`, `HANDOFF.md`.

### Đối chiếu code (khác spec cũ)
- Có **7 nhà**, không phải 6 (nhà tổ, tăng xá, am cổ, nhà khách, thiền đường, trai đường, phòng công đức). Điện Mẫu không có nội thất.
- **Không có bếp** ở trai đường trong code, nên không xây bếp.
- **Không có model mõ 3D** có sẵn (chỉ có âm thanh và minigame), mõ được dựng mới bằng primitives.
- `server/npcs.ts` không có logic nghỉ/giường NPC; gói này chỉ đặt giường và ghi tọa độ bên dưới, không nối NPC, không đăng ký giường làm `seats`.

### Đã làm
- Mục `// ---- A2.3 interiors ----` trong `src/temple.ts` (sau `void pcd;`): 5 group `<tên-nhà>-in` (nha-khach-in, tang-xa-in, trai-duong-in, nha-to-in, thien-duong-in) và phong-cong-duc-in; mỗi group gọi `mergeStaticByMaterial` rồi `scene.add`, dùng chung `woodM`/`matM`/`cushM`/`c.goldM` và một `lamb` cho mỗi màu giấy/mực.
- Am Cổ: props thêm thẳng vào group `amCo` trước `mergeStaticByMaterial(amCo)`.
- Thiền đường: 10 bồ đoàn đăng ký vào `seats` (tọa độ world qua `twd()`, `ry = 3π/2`, không `rest`).
- Collider chỉ cho vật lớn (bàn trà, giường, bàn dài, ban thờ tổ, kệ, mõ); lối vào giữa và lối đi giữa thiền đường thông.

### Mesh/tri trước/sau từng nhà
| Nhà | Trước | Sau |
| --- | --- | --- |
| Nhà Tổ | chưa đo | chưa đo |
| Tăng Xá | chưa đo | chưa đo |
| Am Cổ | chưa đo | chưa đo |
| Nhà Khách | chưa đo | chưa đo |
| Thiền Đường | chưa đo | chưa đo |
| Trai Đường | chưa đo | chưa đo |
| Phòng Ghi Công Đức | chưa đo | chưa đo |

Số mesh/tri thực tế từng nhà: chưa đo (không có quyền chạy dev server trong lượt viết patch này). Cần đo bằng `renderer.info` trước/sau trên máy thật hoặc headless rồi điền bảng.

### Tọa độ giường Tăng Xá (chưa nối NPC)
- 2 giường Tăng Xá, tâm world: **(-44, -73.05)** và **(-38, -73.05)**, mặt giường (mặt chiếu) y = 0.6, đầu giường hướng Bắc (đầu giường ở z = -73.4).
- Ghế trực Phòng Ghi Công Đức, tâm world **(-42, 32.6)** (local (0, -2.4) từ `PHONG_CD = {x: -42, z: 35}`).
- Giường Am Cổ: local `(-acHx + 0.9, acBase + 0.325, 0)` → world **(51.7, -75)**, mặt giường (mặt chiếu) y = 0.7 (acBase = 0.35).

### Kiểm chứng
- Chưa chạy `npm run typecheck`, `npm run build`, chưa chụp ảnh (không có công cụ). Cần chạy lại và kiểm tra bằng mắt từng nhà trước khi merge.
- Cần kiểm tra: bồ đoàn Thiền Đường ngồi được và hướng ngồi đúng (nhìn về phía tường hậu), props không đè lên bàn thờ có sẵn ở tường hậu, lối vào giữa mỗi nhà vẫn thông.

### Chưa chắc chắn / việc còn treo
- Tọa độ `seats` của Thiền Đường suy ra từ `twd()` với `ry = 3π/2`; chưa xác nhận bằng cách ngồi thử.
- Collider là ước lượng bằng tay, chưa đo đi bộ.
- Chưa deploy.
- Tin tức: thêm entry "Nội thất trong 7 nhà", `LATEST_NEWS_ID` 12 → 13.

### Sửa lỗi sau A2.3 (fix, thêm tin 15)
- Xóa đèn dầu (đế gạch + chóp vàng) khỏi cả 7 nhà và Điện Mẫu — vật phi lý trong thiền đường, xóa hẳn chứ không thay bằng đèn khác.
- Sửa collider nội thất: chia lại chuỗi collider tường vỏ và thu nhỏ/dời tâm collider đồ nội thất để các vòng loại trừ (r + 0,4) không còn chồng nhau; mô phỏng kiểm tra cho `inside = 0` ở 6/7 nhà, riêng Am Cổ còn 54 điểm kẹt do cột rào VIEN (ngoài phạm vi sửa — không phải do nội thất nhà).
- Tin tức: thêm entry "Sửa lỗi kẹt trong nhà", `LATEST_NEWS_ID` 14 → 15.

## Quan Âm chibi v4 — vẽ lại tượng Quan Âm (mặt 3D, bình ngọc, liễu lá tròn)

### Đối chiếu code (khác spec cũ)
- Giữ dáng ĐỨNG theo ảnh thiết kế v4 (spec cũ nói "ngồi kiết già" là sai).
- Mặt 2D CanvasTexture đổi thành mặt 3D bằng mesh (mắt nhắm cong, cười, má hồng to).
- Bình vàng đổi thành ngọc xanh; liễu 5 lá dẹt đổi thành lá tròn to; lụa trắng đổi thành vàng kim.
- Thêm cổ chữ V, tay chunky và bàn chân lộ dưới gấu áo.

### Tỉ lệ đầu
- Trước: 1.30 / ~3.6 ≈ 36%.
- Sau: 1.76 / 3.63 ≈ 48% (đo bằng mô phỏng headless: headDia=1.76, totalH=3.63, ratio=0.484).

### Nghiệm thu
- Checklist bằng mắt: đầu to gần nửa chiều cao; mặt 3D mắt nhắm cười, má hồng to; bình ngọc xanh; cành liễu lá tròn to; tay cầm bình/liễu chắc và rõ; vương miện còn tượng Phật A Di Đà nhỏ; thấy bàn chân dưới gấu áo.
- Ảnh sẽ chụp: `shots/quanam.png`, `shots/yard.png`.
- **Chưa kiểm chứng runtime** (không chụp được trong lượt viết patch này).

### Tin tức
- Tin tức: thêm entry "Tượng Quan Âm chibi mới", `LATEST_NEWS_ID` 13 → 14.

## A2.9 — Mở rộng NPC: roster 5 → 12, ca trực + nghỉ, di chuyển theo mạng đường

### Đối chiếu thực trạng (bước 0 — khác spec cũ)
- `planPath` (main.ts:718) KHÔNG phải đồ thị đường: nó là Dijkstra riêng của client cho người chơi. NPC dùng đồ thị mới `shared/roads.ts` — hai hệ độc lập.
- Câu đóng cuối phiên của sư thầy có sĩ số ĐÃ CÓ SẴN trong code cũ (không làm lại): sim bắt được `05:20:00 VN Hết thời khóa. Hiện có 3 đạo hữu đang ở trong chùa. Mang sự bình an này về với gia đình và bạn bè. A Di Đà Phật.`
- Đường hậu (§0.12): KHÔNG có đường thẳng dọc z = −46 và KHÔNG có đường vòng z = −40 (z = −40, |x| < 17 là sàn chính điện, y = 1.35, nằm trong nhà). Đường hậu CHIA ĐÔI đông/tây; qua giữa chỉ bằng chính điện + cầu thang giữa (qua hành lang đông hallIn → hallAisleE → hallAisleN → stairApp → stairTop → tamThe).
- Ban thờ chính điện là khối đặc 24 m × 3,3 m tại (0,−40), mặt trên y = 1,9; bậc dưới của cầu thang Tam Thế NẰM TRONG khối ban thờ — nên tuyến thẳng hallIn → stairBase đi XUYÊN ban thờ. Đã sửa bằng tuyến hành lang đông (nút hallAisleE (14,−38), hallAisleN (14,−41.8), stairApp (4,−41.8)).
- Nút baoThap ban đầu (−17,−45) NẰM TRONG footprint Điện Tam Thế (nền cao 3,0) — NPC sẽ trèo lên nền Tam Thế để thăm Bảo Tháp. Đã dời về (−17,−41), phía nam mặt nam của nền (z = −42). Bản thân hai công trình vẫn chồng footprint — đó là lỗi kiến trúc (xem mục phản hồi sau chùa), không sửa trong gói này.
- **Hướng nằm trên giường — spec cũ SAI:** giường tăng xá dài 2,0 m theo trục X, sâu chỉ 0,9 m; NPC cao 2,12 m KHÔNG THỂ nằm bắc-nam (chân thò ra ngoài giường 1,2 m). Nằm ĐÔNG-TÂY, đầu hướng TÂY, ry = +PI/2. Tư thế `lie` nghiêng người NGỬA (mặt hướng lên, đầu về local −Z) — nghiêng tới (+PI/2) sẽ úp mặt xuống, đọc như ngã. Nâng thân 0,65 (mặt nệm +0,35 so với gốc nhóm, bán kính áo ~0,33) và nghiêng đầu lên 0,13 rad để đầu (r 0,53) không chìm vào nệm; dịch thân +0,8 theo z để thân căn giữa giường 2,0 m.
- Màu npc4 `#7a4a6a` là lựa chọn của người viết gói (spec chỉ nói "khác npc2").

### Roster cuối (12 NPC)
| id | Tên | Outfit | Màu | Scale | Role | Behavior | Slot / vị trí |
| npc1 | Sư Thầy | monk | #d9a62b | 1.15 | abbot | wander | đi lễ quanh chùa, giữ thời khóa |
| npc2 | Tiểu Quét Sân | monk | #8a5a2b | 0.9 | novice | sweepPlaza | quét sân chùa (plaza) |
| npc3 | Tiểu Quét Cầu | monk | #8c8c90 | 0.9 | novice | sweepBridge | quét cầu (đi hai đầu cầu) |
| npc4 | Tiểu Đánh Chuông | monk | #7a4a6a | 0.9 | novice | bell | tháp chuông, roam corrW → pillars → corrW → bellTower |
| npc5 | Phật Tử Đi Lễ | female | #bc7672 | 1.0 | lay | visitor | vòng cổng → ban thờ → sân → cổng, 30% rẽ nhánh |
| npc6 | Sư Thầy Trực Bàn | monk | #b98a2e | 1.15 | abbot | desk | ngồi ghế trực (−42, 32.6), ry = 0, anim 'sit' |
| npc7 | Tiểu Quét Vườn | monk | #7a6a8a | 0.9 | novice | sweepZen | quét vườn thiền (zenGarden) |
| npc8 | Tiểu Quét Đường | monk | #5a7a5a | 0.9 | novice | sweepRoad | quét đường hậu (một phía đông/tây, không sang giữa) |
| npc9 | Cụ Ông Đi Lễ | male | #72818e | 1.0 | lay | visitor | như npc5 |
| npc10 | Cụ Bà Đi Lễ | female | #a86a7a | 1.0 | lay | visitor | như npc5 |
| npc11 | Cô Gái Đi Lễ | female | #d98a7a | 1.0 | lay | visitor | như npc5 |
| npc12 | Chàng Trai Đi Lễ | male | #5a7a8a | 1.0 | lay | visitor | như npc5 |

### Mạng đường (shared/roads.ts — 37 nút, 47 cạnh)
Kiểm tra bằng `check-roads.ts` (23/23 PASS: đồ thị liên thông từ cổng, không cạnh nào cắt hồ/vườn phóng sinh, không cạnh nào lọt vào footprint chính điện/Tam Thế) và bằng sim (0 lần `step()` hủy tuyến trong cả 3 kịch bản). Bảng nút (đã kiểm tra từng cạnh — xem cạnh dưới):
| id | x | z | id | x | z | id | x | z |
| gate | 0 | 43.5 | bridgeS | 0 | 30.2 | bridgeN | 0 | 13.8 |
| plaza | 0 | 6 | axisMid | 3 | -17 | hallFront | 0 | -20 |
| hallIn | 0 | -24 | rearW | -46 | -46 | rearKT | -30 | -46 |
| rearTO | 30 | -46 | rearE | 46 | -46 | westMid | -22 | -26 |
| westNorth | -22 | -46 | eastMid | 22 | -26 | eastNorth | 22 | -46 |
| hallAisleE | 14 | -38 | hallAisleN | 14 | -41.8 | stairApp | 4 | -41.8 |
| stairTop | 0 | -42 | tamThe | 0 | -44 | bellTower | -34 | -6 |
| drumTower | 34 | -6 | quanYard | 28 | 19.5 | buddhaYard | -22.6 | 14 |
| denTrinh | 10 | 39 | restArea | 27 | 31 | dienMau | 39 | 14.5 |
| baoThap | -17 | -41 | phongCDDoor | -42 | 39.5 | psPier | 30 | -31 |
| thienDuong | -39.5 | -27 | zenGarden | -34 | -26 | corrW | -20.5 | -6 |
| pillars | 0 | -5.9 | ktGate | -30 | -49 | ktYard | -41 | -60 |
| tangXaDoor | -41 | -68 | | | | | | |
Cạnh (47, đã kiểm tra): gate–bridgeS, bridgeS–bridgeN, bridgeN–plaza, plaza–axisMid, axisMid–hallFront, hallFront–hallIn, hallFront–corrW, hallFront–drumTower, plaza–pillars, pillars–axisMid, corrW–pillars, drumTower–pillars, corrW–westMid, westMid–westNorth, westNorth–rearKT, rearKT–rearW, rearKT–ktGate, ktGate–ktYard, ktYard–tangXaDoor, drumTower–eastMid, eastMid–eastNorth, eastNorth–rearTO, rearTO–rearE, hallIn–hallAisleE, hallAisleE–hallAisleN, hallAisleN–stairApp, stairApp–stairTop, stairTop–tamThe, bellTower–corrW, bellTower–baoThap, baoThap–zenGarden, zenGarden–thienDuong, zenGarden–westMid, quanYard–plaza, quanYard–restArea, quanYard–dienMau, buddhaYard–plaza, buddhaYard–bridgeN, denTrinh–gate, denTrinh–restArea, restArea–plaza, dienMau–restArea, phongCDDoor–gate, phongCDDoor–denTrinh, psPier–dienMau, psPier–eastNorth, thienDuong–westNorth.

### Ca trực + nghỉ (20' làm / 10' nghỉ)
- Ca đầu: tạo phòng + 20 phút + chỉ số NPC × 5 phút (npc2 +25', npc3 +30', npc4 +35', npc7 +50', npc8 +55') để các chú tiểu không nghỉ cùng lúc.
- Hết ca: giữ 1 trong 2 giường (`room.beds[2]`, giường 0 x = −44, giường 1 x = −38, tâm z = −73.05); hết giường thì làm tiếp, thử lại sau 60 giây.
- Đi nghỉ: theo đồ thị tới ktGate → ktYard → tangXaDoor → điểm đứng cạnh giường (bedX, −72.0) → tâm giường (bedX, −73.05). Dậy: ngược lại về slot quét (HOME_NODE: sweepPlaza→plaza, sweepBridge→bridgeS, sweepZen→zenGarden, sweepRoad→rearKT, bell→bellTower).
- Tiểu đánh chuông: không bắt đầu nghỉ nếu đang trong cửa sổ chuông hoặc chuông còn < 4 phút (guard đã nới từ 2' lên 4' vì đi tới giường ~110 giây, về ~80 giây); đang nằm thì dậy trước chuông 2 phút.
- `resumeNpcs` dịch cả `shiftEnd`/`restEnd` theo khoảng phòng trống, như `until`/`nextChat` — NPC không dậy sai giờ VN khi phòng có người quay lại.
- Rẽ nhánh phật tử (§1.6): sau tụng kinh, 30% rẽ tới 1 trong 5 điểm (psPier, phongCDDoor, tamThe, rearKT, rearTO), đứng 5–10 giây rồi về sân và tiếp tục vòng.

### Nghiệm thu sim (§5.1 — `npx tsx tools/npc-a29-sim.mjs`, 24/24 PASS)
- Kịch bản A (04:50→05:35 VN, phiên sáng + chuông 05:00): roster 12 tên không trùng; npc6 ngồi (−42, 32.6) ry 0 anim 'sit'; 2 chú tiểu hoàn thành đủ vòng nghỉ (npc2 về plaza d = 0,0; npc3 về bridgeS d = 0,1); tối đa 2 NPC resting cùng lúc; 0 hủy tuyến; câu đóng cuối phiên có sĩ số; cả 5 phật tử đều rẽ nhánh và quay về.
- Kịch bản B (17:50→18:15, chuông 18:00): npc4 roam xa tháp nhất 34,0 m trước chuông, `ring` bắt đầu đúng 18:00:00, kéo dài 60 giây, đi lại tiếp lúc 18:01:00.
- Kịch bản C (40 phút tùy ý): npc2 hoàn thành đủ vòng nghỉ (về plaza d = 0,0); tối đa 2 resting; 0 hủy tuyến; 4/5 phật tử rẽ nhánh và quay về.
- `npx tsc --noEmit`: 0 lỗi.

### Ảnh (§5.2 — `STEPS=./tools/steps-a29-npc.mjs node tools/shot.mjs shots/a29`)
- `a29-roster.png`, `a29-bell-roam.png`, `a29-bell-ring.png`, `a29-desk-monk.png`, `a29-rest-bed1.png`, `a29-rest-bed2.png`, `a29-visitor-tamthe.png`, `a29-visitor-ps-pier.png`.
- **Chưa kiểm chứng runtime** (chưa chạy headless/điện thoại trong lượt viết patch này): tư thế nằm phải đọc được là ngủ (không phải ngã, đầu hướng tây, thân trên nệm), npc6 ngồi yên ở bàn, npc4 phải thấy đi lại quanh tháp.
- Người chơi tự đi bộ tuyến nghỉ (cổng viện → sân chung → cửa tăng xá → điểm đứng cạnh giường) bằng `window.__co.walkTo` trong cùng script để chứng minh cạnh thông thật.

### Chưa chắc chắn / việc còn treo
- Số đo TRÊN MÁY THẬT (§5.3, user làm cùng): đứng sân quan sát 10 phút giờ thực — tiểu đánh chuông có rời tháp không, chú tiểu nào về tăng xá nằm không, sư thầy trực bàn có ngồi yên không, khách có rẽ vào khu mới không; đứng trước cửa tăng xá nhìn vào: NPC nằm có đúng trên giường không (đầu tây, không lơ lửng/chìm).
- Hai công trình vẫn chồng footprint (Bảo Tháp (−17,−52) nằm trong nền Điện Tam Thế) — nút baoThap đã dời ra ngoài nhưng kiến trúc cần sửa riêng (gói phản hồi sau chùa).
- Tin tức: thêm entry "Thêm sư thầy trực bàn, chú tiểu và phật tử", `LATEST_NEWS_ID` 15 → 16.

## Phản hồi sau chùa (điện thoại) — sửa đơ máy, kẹt hàng rào, dời Tam Thế/Bảo Tháp, ao cá, bảng nhà

### §0. Baseline đã đo (điện thoại thật Note20, giờ VN 2026-11-12)
- FPS nền 36,2.
- Dạng A (đơ): `planPath` cũ mất 5–28 giây mỗi click (7208 nút, 0,7–1,7 triệu lần `segmentClear`, 986 collider). 3/7 tuyến có `prev[1] = -1` nên code trả `[to]` và nhân vật đi thẳng vào rào.
- Dạng B (kẹt): kẹt cứng tại (-45,33; -54,85) trên rào Nam VIEN_KT.
- Sim hàng rào baseline: 2762 mẫu kẹt.
- Tọa độ đo: Tam Thế–Chính Điện 0 m; bậc Tam Thế 14 bậc, run 1,8 m, rise 3,0 m (~59°); bệ tháp giao nền Tam Thế ~9,8×13,6 m.

### §1. Sửa đơ và kẹt
- Module mới `shared/pathfind.ts` (152 dòng): spatial hash ô 4 m, Dijkstra trên đồ thị đường. `findPath` không bao giờ trả `[to]` khi đoạn thẳng bị chặn. `lastFallback` và `console.warn` khi đích không tới được.
- `main.ts`: xóa `segmentClear` và `planPath` cũ, dùng `createPathfinder(world.colliders)`.
- Đồ thị `shared/roads.ts`: 56 nút, 57 cạnh, probe 0 cạnh xấu, 0 nút xấu. Có đi qua khe tường ngang z=-17, x≈-28,5 để nối cụm Bảo Tháp và Vườn Thiền.
- `buildVienFence` đổi sang collider capsule `{x,z,r,x2?,z2?}`, r≈0,15, đoạn thẳng giữa 2 cột kề. `collide()` đẩy theo điểm gần nhất trên đoạn.
- Bỏ collider cổng r0,45: cột cuối tuyến đã ở gateX ± 1,6, khe cổng ~2,1 m vẫn đi qua được.

### §2. Bố cục
- `TAM_THE.z` -54 → **-62** (nền z -74..-50; cách Chính Điện 8,0 m, cách tường Bắc 8,0 m).
- `TAM_THE_PLAT.zStart` -40,2 → **-44** (thang dài 6,0 m).
- `BAO_THAP` (-17,-52) → **(-30,-38)**: bệ x -36,8..-23,2, z -44,8..-31,2; bậc tháp phía nam z -33..-31,2.
- 4 khoảng đo: 8,0 m (Tam Thế–Chính Điện) / 3,2 m (bệ tháp–nền Tam Thế) / 1,2 m (bệ tháp–đường hậu z=-46) / 3,7 m.

### §3. Bậc Tam Thế
- `nSteps` 14 → **20**: rise 0,15 m/bậc, tread 0,30 m/bậc, dốc 26,6°.

### §4. Ao cá
- 6 cá koi `createKoi`/`swimKoi` (xoay 4 mẫu, scale 0,85–1,09), tọa độ tuyệt đối, rx tối đa 4,9 (điểm Tây nhất x=36,1, không chạm bến).

### §5. Bảng nhà
- `#couplet` (không phải `#panel`, vì panel là overlay Shop/Quests, không đụng): `width: min(280px, 88vw)` (280 px trên điện thoại 390 px), chữ 10/11/10,5 px, nút X 44×44, `max-height: 38vh` + cuộn.

### Nghiệm thu (coordinator đo trên cây thật)
- `npx tsc --noEmit` 0 lỗi; `npm run build` sạch (trừ warning chunk > 500 kB đã có từ trước); sim NPC 24/24 PASS; probe đồ thị 0/0; benchmark 8 tuyến median 0,04–0,37 ms (trước: 5–28 giây), `createPathfinder` 3 ms; sim hàng rào 0 mẫu kẹt (trước: 2762), 8 phía vẫn chặn, 2 cổng vẫn qua; 0 chữ Hán; file LF.

### Chưa chắc chắn / việc còn treo (làm cùng user, máy thật)
- Chụp lại ảnh điện thoại sau sửa (8 tuyến đi bộ, ngồi thiền, bảng nhà); đo FPS thực trên máy thật; kiểm tra cá koi trong ao PS trên điện thoại; kiểm tra hàng rào trượt dọc mượt.

## Vườn sống động — cây + đèn + tháp nhỏ (news 18)

- Module mới `src/garden.ts` (109 dòng): load 6 GLB low-poly bằng `loadModel`,
  convert vật liệu sang MeshToonMaterial bằng `toon()` (giữ `map` nếu có), fit
  chiều cao bằng `fitModel`, đặt theo tọa độ tuyệt đối, ry cố định. Collider
  đẩy đồng bộ vào `colliders` ngay khi `buildGarden` chạy (trước khi GLB load
  xong) để pathfinder trong `main.ts` thấy đủ.
- 6 model (tổng 752 tris cho 1 cái mỗi loại, ~12 instance): cherry_tree (10.424 B,
  80 tris, cao 4,7 m, 3 cây mép quảng trường), maple_tree (8.380 B, 60 tris,
  cao 4,5 m, 2 cây Vườn Thiền), bamboo_cluster (26.924 B, 288 tris, cao 4,4 m,
  2 cụm: bắc Vườn Thiền + gần ao PS), stone_lantern (8.568 B, 82 tris, cao
  2,15 m, 2 cái hai bên vườn cát + 1 cái Vườn Tháp), pagoda (12.424 B, 118 tris,
  cao 5,1 m, 1 tháp Vườn Tháp), zen_sand_garden (13.684 B, 124 tris, scale 1,5,
  giữa Vườn Thiền, không collider).
- Nguồn: LowPolyShrinePack (free) — cherry/maple/bamboo/lantern/pagoda/sand_garden.
  User chọn đúng 6 model này trên WhatsApp 2026-11-13 00:06 sau khi xem preview;
  loại tree_palm (tán lưa thưa rách), tree_oak (khối xanh đậm đơn điệu, đúng kiểu
  "chán"), flower_redA (đỏ tối, thô), Tree_02_Art (xoáy tím ảo giác),
  tree_pineTallB (xanh đậm như oak, để đợt sau).
- Collider: cây/tre r0,4, đèn r0,3, tháp r0,6; vườn cát không collider. Sim kiểm
  tra không collider nào trong 0,5 m của node/cạnh đường (`shared/roads.ts`).
## Fix sau test điện thoại #2 — route ngắn, hết kẹt nhà, bảng nhỏ (news 19)

- R1: thêm fallback qua cửa trong `shared/pathfind.ts` (bảng `HOUSE_DOORS` 7 cửa trong `shared/roads.ts`). Mở lối hàng rào Đông vườn Thiền tại z=-26,6 trong `src/compound.ts` (bỏ 3 bụi rào, thêm node zenE1 (-18,-20), zenE2 (-18,-24), zenW (-26,-26,6)). Route từ trục (-10,48,-16,26) tới cửa Bảo Tháp (-30,-31): 3,29x → 1,00x (24,5 m, đi thẳng).
- R1b: thêm 2 cạnh Đông `['plaza', 'eastMid']`, `['hallFront', 'eastMid']`. Spawn → bờ ao Phóng Sinh (41,-23,5): 2,10x → 1,34x. Spawn → cửa Am Cổ: 1,69x → 1,29x (sau R3 thành 1,37x vì đi qua node amCoEast mới).
- R3: dời vật cản chắn cửa.
  - Trai Đường: băng ghế Nam chẻ đôi, chừa lối 1,8 m giữa.
  - Nhà Khách: bộ bàn trà dời 1,6 m về Bắc, băng ghế dài dời sát tường Tây.
  - Am Cổ: bàn trà dời về Nam (53,9,-75,9), thêm node amCoEast (57,2,-75) và cạnh amCoE2→amCoEast. KHÔNG thu collider góc tường: cạnh clear với biên 0,07 m.
  - Vườn Thiền: bonsai i=3 góc 315° → 250°.
  - Hàng rào Viện Tổ và tường Am Cổ không đụng tới.
- R4: `#couplet` trên mobile 190 px (trước 280 px = 73% màn hình), padding phải 48 px (cả base lẫn mobile), nút X giữ 44×44. Đo bằng Chrome thật trên PC với nội dung câu đối Nhà Tổ: mobile 190 px, mép chữ chạm mép trái nút X, không giao nhau (trước: chữ lấn 38 px dưới nút). Desktop 1280 px vẫn 280 px, chữ không đè nút X. `.panel` không đụng.
- Route sau fix (bench findPath trên 993→990 collider thật, median 0,01–0,72 ms), cả 5 cặp ≤ 1,5x đường thẳng:
  - trục → cửa Bảo Tháp 1,00x (trước 3,29x)
  - spawn → cửa Tăng Xá 1,39x (trước 1,64x)
  - spawn → Phong Công Đức 1,48x (giữ nguyên)
  - spawn → bờ ao PS 1,34x (trước 2,10x)
  - spawn → cửa Am Cổ 1,37x (trước 1,69x)
- Vào nhà (walk sim tái tạo vòng lặp `main.ts`, từ quảng trường, budget 60 s): Trai Đường, Nhà Khách, Am Cổ, Tăng Xá, Thiền Đường, Nhà Tổ, Phong Công Đức, cửa Bảo Tháp đều dist 0,57–0,58 m, 0 kẹt. Trước fix: Trai Đường 3,23 m, Nhà Khách 4,51 m, Am Cổ 4,47 m (dừng đúng điểm kẹt test điện thoại (53,33,-70,55)). findPath tới đích trong 5 nhà: endDist 0,00 m, fallback=false (trước: fallback dừng ngoài tường).
- Cá koi: đếm trong scene thật được 15 koi-body, gồm 9 ở hồ chính và 6 ở ao PS (41,-31). Không đổi code.
- Nghiệm thu: `npx tsc --noEmit` 0 lỗi; bench 5 cặp route ≤ 1,5x và 5 đích trong nhà endDist 0,00 m; walk sim 9/9 leg PASS (dist 0,57–0,58 m, 0 kẹt); koi 15 mesh; 0 chữ Hán; file LF.

### Việc còn treo (làm cùng user, máy thật)

- Test điện thoại lần 3: quay lại 5 nhà, cửa Bảo Tháp và bờ ao (đi bộ thật, đo FPS, chụp ảnh).
- Re-probe cá koi: sau khi tới bến (30,-31) phải xoay camera về phía ao (41,-31) rồi mới chụp. Lần trước camera quay về Bắc nên không thấy ao và cá dù mesh đủ 6 con.
- Tăng Xá đi từ quảng trường mất ~30,5 s (route 116 m), sát budget 30 s của test điện thoại. Lần test sau nên xuất phát gần hơn hoặc nới budget.
- Công đức hiện "9" rồi về "0" (quan sát test #2): chưa đụng tới, chỉ ghi nhận.
- Nội thất Điện Tam Thế tối: chưa đụng tới, chỉ ghi nhận.
## Lùi Điện Tam Thế ra sau 6 m, sân trước rộng hơn (news 20)

- Lùi toàn bộ cụm Tam Thế về phía Bắc 6 m: TAM_THE.z -62 → -68, zStart -44 → -50, nền -50..-74 → -56..-80, chân thang -44 → -50. Khoảng trống Chính Điện → chân thang: 2 m → 8 m; mép Bắc nền cách tường Bắc: 8 m → 2 m.
- Đồ thị đường: dời 3 node stairApp (4,-55.8), stairTop (0,-56), tamThe (0,-58); cập nhật comment đầu shared/roads.ts (footprint z -80..-56, thang z -50 → -56).
- blocked(): dải trục nới từ z > -51 thành z > -57 (khớp lối lát đá trục tới thang mới); giữ nguyên dải z -48..-43 (khớp lối lát đá ngang sau Chính Điện, không thuộc Tam Thế).
- tools/steps-tamthe.mjs: arrivedAt p.z < -51 && p.z > -68.
- Còn treo: chụp ảnh điện thoại thật từ sân Chính Điện để user xác nhận khoảng trống đã đủ.
- Nghiệm thu: `npx tsc --noEmit` 0 lỗi, build sạch; walk sim tới cửa (0,-68) và trong điện (0,-66) dist 0,57–0,58 m, 0 kẹt; bench plaza→cửa route 88,2 m (trước 83,8 m, 1,05x), tỉ lệ 1,19x đường thẳng; groundY thang 0→3,0 đều; 0 chữ Hán.

## Tượng hành lang quay mặt vào trung tâm (news 21)

- Đo trục mặt trước 4 mẫu GLB bằng render 4 phía (headless Chrome + three.js): cả 4 đều +z (arhat-binh sau UPRIGHT_X, monk-go, guanyin-ngoi, guanyin-go-minh).
- FACE_OFFSET: guanyin-ngoi π/2 → 0, guanyin-go-minh π/2 → 0; arhat-binh và monk-go giữ 0. Chibi buildArhat mặt +z, rotation −side·π/2 đã đúng, không sửa.
- Sau sửa: hành lang Tây (x=−22.5) mặt hướng +x, hành lang Đông (x=+22.5) mặt hướng −x; 12/12 tượng quay vào trung tâm.
- Còn treo: chụp ảnh điện thoại thật 2 hành lang từ giữa sân để xác nhận bằng mắt.

## Cầu thang Tam Thế: thành đúng chiều, bậc cùng màu sàn gỗ (news 22)

- Thành cầu thang: `rail.rotation.x` từ `atan2(BASE, sz1 - sz0)` = `atan2(3, -6)` ≈ +153,4° (≡ −26,6°, dốc ngược) sang `atan2(BASE, sz0 - sz1)` = `atan2(3, 6)` ≈ +26,6° (khớp dốc thang `atan(3/6)`). Tâm, kích thước, vật liệu `stoneM` giữ nguyên.
- Bậc thang: vật liệu `lamb(0xb9ae98)` be trơn sang `woodFloorM` = `lamb(0xffffff, { map: woodTexture([14, 7]), roughness: 0.7 })`, dùng chung với `floor`.
- Nghiệm thu: `npx tsc --noEmit` 0 lỗi (VM + PC), build sạch; walk sim lên thang tới trong điện (0,−66) dist 0,15 m, cửa (0,−68) dist 0,06 m, 0 kẹt; groundY thang 0→1,5→3,0 không đổi; render trước/sau (headless Chrome, PC): thành dốc cùng chiều bậc, đầu cao phía nền điện; bậc gỗ có vân, cùng tông sàn điện. Vân gỗ repeat [14,7] trên hộp bậc nhỏ không bị kéo méo trong render.
- Cần treo: ảnh điện thoại thật chụp cầu thang từ bên hông và từ chân thang để user xác nhận bằng mắt.

## Dời cây tre chọc xuyên Bảo Tháp (news 23)

- Cây lỗi: `bamboo_cluster` (-34,-33) → (-39,-36), dời 5,83 m, giữ ry 1,1 / height 4,4 / colliderR 0,4. Chỉ sửa 1 dòng trong `GARDEN_PLACEMENTS` (`src/garden.ts`); `GARDEN_COLLIDERS` suy ra từ `GARDEN_PLACEMENTS` nên collider tự đi theo.
- Cách đo: vertex GLB thật (áp transform `buildInstance`) vs profile bán kính-theo-chiều-cao của tháp: 120/720 đỉnh nằm trong khối tháp, minClear −0,80 m (thân tre đâm xuyên nền đá r 6,8) → sau dời towerClear 2,00 m (đo bằng vertex, kỳ vọng ≥ 1,54 m theo bbox), cách tâm tháp 9,22 m, `blocked()` = false.
- Đã minh oan: `maple_tree` (-38,-31) minClear 3,55 m; `stone_lantern` 4,80 m; `zen_sand_garden` 3,50 m; 90 cây rải rác gần nhất cách tâm tháp 27,2 m (luật `blocked()` cấm trong 9 m, không sửa).
- Quét lan: không cây nào xuyên Tam Thế / Chính Điện / hành lang (cây vườn gần nhất 10,19 m; cây rải rác gần nhất 7,23 m tới tường hành lang), không cần sửa thêm.
- Còn treo: chụp ảnh điện thoại thật từ phía Nam Bảo Tháp để user xác nhận bằng mắt.

## Tượng hành lang to gấp đôi, cầu thang Tam Thế gỗ sáng (news 24)

- Tượng hành lang (GLB + chibi) phóng to gấp đôi: `TARGET_HEIGHT` 0.8 → 1.6; chibi `ARHAT_SCALE` 0.868 → 0.595 để chibi cao ~1.6 m bằng GLB (trước chibi cao 2.34 m, to hơn GLB 46%). Bệ 0.8×0.55×0.8 → 1.5×0.55×1.5, tâm dịch vào x = ±22.35 để không lấn tường hành lang (tường x = ±23.1); lối đi còn 3.7 m. Collider r 0.85 giữ nguyên.
- Hết lơ lửng: `prepare()` đo bằng `vertexBox` (bbox từ POSITION từng đỉnh qua matrixWorld), bỏ `visibleBaseY` (phân vị diện tích — sai: monk-go 3202 cm, guanyin-ngoi −17 cm) và bỏ `Box3.setFromObject` để tính tỉ lệ (monk-go Box3 cao hơn đỉnh thật 36%). Đo thật: cả 4 GLB cao đúng 1.600 m, đáy 0. Hở trước (base): monk-go +18 cm (cao chỉ 0.59 m), guanyin-ngoi 0, guanyin-go-minh 0; chibi mép áo chạm bệ (hở 0, bbox min −7.8 cm là phần khuất trong bệ).
- Cầu thang Tam Thế: 20 bậc ĐÃ là gỗ nâu từ news 22 (xác nhận bằng render game thật 6 góc — user chụp nhầm thềm đá). 3 bậc thềm đá của bệ (xám) đổi sang gỗ (`ledgeMats`, mặt trên repeat 10×6, mặt đứng 10×1) cho đồng bộ. Không đụng 3 bậc đá trước Chính Điện.
- `FACE_OFFSET` giữ 0 (ảnh game thật: cả 2 GLB đều quay mặt vào giữa hành lang; hướng không phải lỗi — news 21 sửa một lỗi không tồn tại).
- `models.ts`: không cache null, cho phép thử lại khi lỗi mạng thoáng qua.
- Còn treo: ảnh điện thoại thật 2 hành lang từ giữa sân + cầu thang từ góc user để xác nhận bằng mắt (GLB hay tải lỗi trong headless nên chưa chụp được GLB sau sửa ở game thật — chỉ đo được bằng render mặt trước + chibi fallback).

## Cây liễu cổ thụ bên bờ hồ Tây (news 105)

- Model: `/models/willow-sketchfab-S.glb` (do coordinator cung cấp riêng, không nằm trong diff), SHA256 `48f971f12792fe3c25ca1636e88d5ab6c32e4e10888ab10268369936cd6415cc`, 5.510.480 byte. 9.082 tris / 2 mesh (thân `bark10_0` 3.898 tris, lá `willow branch_1` 5.184 tris), đủ 5 texture PNG nhúng.
- Vị trí: `p('willow-sketchfab-S', -14, 30, 0.4, 13, null, 1.0)` — tâm (-14, 30), cao 13 m, collider r=1.0 (tự đi theo `GARDEN_COLLIDERS`). `blocked()=false`, `groundY=0`.
- Khoảng cách đã đo (tính từ tâm cây): đường Vườn Tây (cạnh gateW–vuonCayE) 8,35 m; mép hồ 7,81 m; cột đèn (-9.5, 26) 6,02 m; bồn hoa Tây (-16.5, 23) 3,79 m; cây anh đào castle-cherry-tree (-8, 30) 6,00 m; cây rải rác gần nhất 9,28 m. Tán rộng ~13,9 m (bán kính ~6,95 m): mép tán cách đường 1,40 m, cách mặt nước 0,86 m.
- Độ lệch so với yêu cầu: yêu cầu gốc là tâm cây cách đường/nhà/mép nước ≥8 m, nhưng scan cho thấy không có điểm nào ở bờ Tây hồ đạt 8 m cho mọi hướng (tốt nhất là 6,85 m). (-14, 30) là điểm cân bằng tốt nhất; chọn scale 13 m thay vì 15 m để mọi khoảng trống chức năng đều dương.
- `toToon()` sửa để giữ `alphaTest` (lá liễu: alphaMode MASK, alphaCutoff 0.246), `side: DoubleSide` và `alphaMap` nếu có; áp dụng cho cả 3 nhánh (có map / vertexColors / trơn). Material không có alpha không đổi hành vi.
- `tools/willow-sim.mjs`: chạy `npx tsx tools/willow-sim.mjs` ra `WILLOW_SIM: ALL PASS` — A1 GLB đúng size/tris/meshes (5.510.480 B, 9.082 tris, 2 mesh, 1 material MASK cutoff 0,246); A2 vị trí (-14, 30) đúng, 25 placements; A3 blocked=false, groundY=0; B 90 node đường tới được từ plaza; C collider cách đường gần nhất 7,349 m; D đường 8,349 / hồ 7,814 / đèn 6,021 / bồn hoa 3,792 / anh đào 6,000; E `garden.ts` có `alphaTest`.
- Còn treo: ảnh điện thoại thật từ quảng trường và từ bờ hồ để user xác nhận bằng mắt.

## Bắt kịp tin 25–129 — gộp 2026-11-17

Gộp bởi Lux, đối chiếu với `git log` + `src/data/news.ts` + soi code trực tiếp
trên GitHub (2026-11-13→17). HANDOFF.md trước bản gộp này dừng ở tin 105
(entry cây liễu, đuôi file) và header vẫn ghi commit `605c05d` — các tin
25–104 chưa từng có entry, tin 106–129 cũng chưa. Entry cây liễu (105) đã có
sẵn ở trên, không ghi lại ở đây.

Trạng thái lúc gộp: HEAD `7a70bf1` (2026-11-17). Tin "Có gì mới":
`LATEST_NEWS_ID` = 129, 131 entries trong mảng (chênh +2 là quirk cũ từ đầu
dự án, KHÔNG phải lệch đếm). R3 XONG CẢ 3 (R3.1 tặng quà 86, R3.3 bia tuần 87,
R3.2 chụp ảnh 88). R2.1 xin xăm XONG (tin 60). A2 XONG (tin 11–24).
Thứ tự khóa tiếp theo: **Fable audit + animation → R4** (kit:
`prompt-audit-fable-chua-online.md`, chủ dự án đang duyệt nội dung 17/11).
Roadmap + phan-b stale nặng (dừng ở 2026-11-11) — cập nhật sau nghiệm thu,
không cập nhật lẻ từng tin.

### Tin 25–36 — blitz đêm 13→14 (HEAD `d85de5f`, 12 commit)
- Hệ nhiệm vụ v1 (26): 21 nhiệm vụ/ngày, chợ 4 quầy ngoài Tam Quan
  (hoa quả/bánh/trà/hương hoa, 10 xu/món), guide path + mũi tên, +16 NPC → 28.
- Camera tự zoom trong nhà (31). Tượng hành lang còn **5/bên** (spec A2.1 chốt 6 —
  coi như đổi thiết kế, không phải lỗi).
- Hòm công đức (35): đóng góp xu game qua Sư Thầy Trực Ban, 1 xu = 1 công đức,
  >50 xu thông báo cả phòng, bảng vinh danh top 10 ở Tam Quan. Chỉ xu game.
- Thú cưng (36): chó Vàng/Đen, mèo Mướp, 3 cú, 2 chim + 2 nhiệm vụ cho ăn/tìm thú lạc.
- Quầy chim cá phóng sinh (37, `0acdea7`): chim 20 xu, cá 10 xu, thả ở bến
  hồ phóng sinh +20/+10 công đức, nhiệm vụ "Phóng sinh lần đầu".
- Thông báo đóng góp (38, `6b7067f`): ≥50 xu → chữ chạy + tin hệ thống, 5 mẫu
  cảm ơn xoay. **Tin 55 KHÔNG trùng 38** (55 chỉ thêm: <50 xu vẫn có thông báo
  riêng) — đừng xóa/gộp, sẽ lệch số tin sau. Lần sau tinh chỉnh kiểu này đặt
  tiêu đề nêu đúng phần mới, vd "Đóng góp nhỏ cũng có thông báo riêng".

### Tin 39–61 — blitz ngày 14 (HEAD `c573e1f`, 23 commit)
- Sư Phó + Q22 (39); cho chim/thú ăn + Q26 (40); sửa world v2 (41: cầu thang
  Tam Thế, tượng vàng retry, quầy chợ, Phòng ghi công đức quay ĐÔNG, hòm công
  đức ×3, bảng vinh danh dời ra đường hồ Koi).
- Đệm zafu (43/44); guide chợ + Q1 (45); Mướp ×2, đi lại sân trước/ao (46/57);
  khách dạo trước khi về (47); props 3D (48: hòm công đức, ghế đá, đèn lồng,
  tháp mini + giá treo quẻ); bảng ước, đèn đá, vườn cát lớn hơn, hành lang cao
  hơn (49); Labrador chó thứ 3 (50); chợ 2 hàng (51); Collie + Munchkin thay
  chó khối (52); tượng Phật vàng trong Đền Trình (53); đóng góp ≥50 xu thông
  báo (55 — xem ghi chú ở trên); chợ về 1 hàng Đông (58).
- **Hệ Danh hiệu (59): 24 danh hiệu, chữ vàng trên đầu nhân vật**, điều kiện theo
  cấp/nhiệm vụ/đóng góp/tụng/thắp hương/lạy/thả đèn/lần hạt/thiền, mặc định đeo
  danh hiệu cao nhất; danh hiệu nhiệm vụ/hương tính từ phiên bản này trở đi.
  (Tin 123 sau này đổi thành tự chọn 1 danh hiệu để đeo.)
- **R2.1 xin xăm (60, commit `80fc1ff`, ĐÃ SOI CODE):** bảng `fortune_daily`
  (player_id, day_key) PK, `getFortuneToday` + `saveFortune` ON CONFLICT DO NOTHING, handler `fortune:get`/`fortune:draw`, 33 quẻ thơ 4 câu (11 Thượng /
  13 Trung / 9 Hạ), localStorage đã bỏ hẳn. 2 lệch so với spec Lux: (1) lần bốc
  đầu trong ngày phải đứng trong 3.5m của giá treo quẻ ở (24,−24) (mở lại quẻ
  cũ thì ở đâu cũng được); (2) lần bốc đầu dùng Math.random rồi lưu, không phải
  bốc xác định theo tài khoản+ngày — nhưng ON CONFLICT nên trong ngày vẫn 1 quẻ.
- Tên NPC xếp tầng (61).

### Tin 62–84 — blitz đêm 14→15 (HEAD `7a70c98`, 23 commit)
- Sửa loạt 62–81: ngồi xếp bằng, quầy chợ đều, nhãn NPC, đệm bỏ viền sen,
  tên không nhảy khi xếp chồng, quầy phóng sinh gộp 1, NPC rải khi vào, đăng
  nhập lại giữ vị trí, **bảng vinh danh chạy thật (70)**, NPC rảnh làm việc vặt
  (71), NPC nói 1 câu (72), **giảm nóng máy (73): cap 60fps, điện thoại mặc
  định đồ họa Vừa, bóng 1024**, guide quét phủ hết điểm (74), sư trực đi lại
  phòng công đức (75), bảng lễ 13 lễ âm lịch (76), NPC tour làm 6 việc (77),
  dòng trạng thái dưới tên NPC (78), không đi xuyên đồ vật (79), sửa chim vườn
  cát (80), shop trung tâm bỏ 7 món trùng chợ (81).
- **Vườn trồng cây (82):** 8 luống Vườn Tây, hạt Sồi 10 / Thông 12 / Anh Đào 15 /
  Bồ Đề 20 xu, lớn sau ~20 phút nếu tưới, thu hoạch 15 công đức + 5–10 xu +
  1–2 hạt, héo sau 24h không tưới, mất sau 48h, Q27–Q30, thư chào mừng tặng
  1 hạt Sồi miễn phí. (Trồng cây từng bị gạch trong bản đối chiếu — giờ đã
  vào game, cần xếp chỗ trong lộ trình.)
- **Sư Ông npc37 (83–84):** kho 9→10 việc, giao 3 việc/ngày (cùng 3 việc cho
  mọi người, reset 00:00 VN), dấu "!" + nút guide; việc mới "Tưới 1 cây"
  20 xu + 10 công đức (84; nước tưới 10→9 công đức ở tin 85, cap ngày 36).
  Trùng ý tưởng rota chấp tác 3 việc/ngày của R5.2, khác ở chỗ cho MỌI người
  chơi chứ không riêng người tu.

### Tin 85–104 — blitz ngày 15 (HEAD `55bbcdc`, 20 commit)
- Tưới cây 10→9 công đức (85, commit `888ffa9`).
- **R3.1 tặng quà (86, `fe379be`, ĐÃ SOI CODE):** `db.sendGift` transaction
  (trừ túi qty≥1 → thư kind 'gift' qua cleanGift → cap 5/ngày bằng
  minigame_daily 'gift' WHERE count<5), handler `gift:send` cùng phòng +
  không tự tặng + chỉ lễ vật/consumable, UI trong mail.ts. 2 lệch so với spec
  Lux: lời nhắn 120 ký tự (spec 100); người nhận PHẢI online cùng phòng
  (spec nói offline vẫn nhận được).
- **R3.3 bia tuần (87, `21484ca`):** bia đá ở (10,14) rìa quảng trường,
  `db.topWeekly` → `rank:get` → `setStele`, refresh 5 phút — khớp thiết kế.
- **R3.2 chụp ảnh (88, `1c084cc`, ĐÃ SOI CODE):** `src/features/photo.ts`,
  post.render() + toDataURL cùng task (không ảnh đen), CSS `.photo-mode` ẩn
  HUD, watermark "Chùa Online • chua247.top" + pháp danh + ngày, tải PNG.
  Lệch: watermark ghi "Chùa Online", chưa phải thương hiệu **Chùa 24/7** —
  ĐÃ SỬA 2026-11-17 (`2436a30`, xem mục fix sau tin 129).
- Quét guide 89–90; râu Sư Ông 91; chổi to hơn 92; cây cao hơn 93; điểm quét
  Q2–Q4 dời 94; bảng lễ quay ra cổng 95; nút di chuyển iPhone 96; khách rải
  2 bên 97; tìm đường guide 98.
- **Áo mới (99, `a20fcb0`):** áo dài hồng sen 90 / vàng nhạt 100, bà ba nâu/tím
  70, áo lam 60, nón lá 50, khăn đóng 60 — đều kind 'accessory' trong shop.
- Đèn lồng xếp lại (100, `ab6807d` — tiêu đề tin này ban đầu copy nhầm của
  tin 95, ĐÃ SỬA 2026-11-17 `4af3bdd`); cảnh: tháp 5 tầng + cầu đá + bồ đề cổ
  (101); thông báo không bị chat che (102); chỉnh vườn (103); tụng chung
  nhóm (104, `55bbcdc`): roster tụng + ghế tụng ở 5 điện, nghỉ đúng 2 giường
  theo thiết kế của chủ dự án.

### Tin 105–107 — tối 16/11 (HEAD `f6aa784`, 5 commit)
- Cây liễu cổ thụ bên bờ hồ Tây (105, `9490e2a` — entry chi tiết đã có ở trên,
  cuối file trước bản gộp này).
- **Fly.io làm host tạm vì Oracle hết capacity** (`2750eb8` + workflow
  auto-deploy `c0b63a4`): app `chua247`, region sin, máy 512MB (~$3.88) +
  volume 1GB ($0.15) + egress ~$0.27 ≈ $4.30/tháng → được miễn → $0.
  Máy 256MB crash liên tục, chủ dự án nâng lên 512MB lúc 22:36 ngày 16/11 —
  không hạ xuống nếu không có lệnh của chủ dự án.
- Camera tự do trên điện thoại cho admin (106, `0e1ee20`): joystick lái,
  kéo xoay, nút ▲/▼ bay lên xuống; máy tính vẫn phím F.
- **Bảng quản trị (107, `f6aa784`, ĐÃ SOI CODE — xem mục "ĐÃ KIỂM CHỨNG")**:
  tìm người chơi, tặng xu/công đức, khóa/mở tài khoản, gửi tin cho mọi người
  online, dịch chuyển tới bất cứ khu nào, thống kê online/người mới/tổng quyên
  góp. Quyền admin giờ rộng hơn hẳn thời chỉ có camera.

### Tin 108–129 — blitz đêm 16→17 (HEAD `b7250ac`, 22 commit)
- Sửa crash Turso fetch-fail (`e5eb809`, không ghi tin); joystick landscape
  (108, `53cb6a5`); bảng Đại Hùng Bảo Điện + 7 bảng mới (109, `869835b`).
- **Chống sập Turso (`ba85036`, không ghi tin, ĐÃ SOI CODE):** timeout 5s
  (AbortSignal) cho mọi fetch Turso, nhận diện lỗi transient (fetch failed /
  UND_ERR_SOCKET… — lỗi SQL không retry), circuit breaker cho job nền (mở sau
  3 lỗi, backoff 30s→120s), `withDbRetry` tối đa 3 lần, `safeHandler` bọc hết
  socket listener để lỗi không giết server. Làm nghiêm túc.
- Fly 256→512MB (`46df098`, chủ dự án chọn, vẫn <$5 = miễn phí).
- Sửa pathfinder line-collider (110, `bd83385`); râu Sư Ông ×2 (111 `480a373` +
  126 `a667abc` — lần sửa râu thứ 3); nút hành động xếp cột dọc (112, `78be24f`);
  guide tới người trên cầu (113, `5c181c3`); chó Trắng/Nâu vào, Đen ra
  (114, `5cc0a4d`); bậc thềm chánh điện (115, `8a5748f`); thú vs đệm
  (116, `d70ce5e`); **admin tự tặng mình (117, `38f9146`)**; biển ống
  xăm (118, `3ea3ad2`); mèo Bông/Mun (119, `c5b02a9`); 2 track tụng
  tiếng Pali (120, `b100c79`); **minimap tròn (121, `9feb69d`, ĐÃ SOI
  CODE: `#minimapWrap` 150px, `border-radius: 50%`)**; Sư Ông ngồi ghế
  bồ đề (122, `616ec7e`); **hồ sơ + danh hiệu (123, `0056ca5`, ĐÃ SOI
  CODE: cột bio + age, lưu trên server; danh hiệu giờ tự chọn 1 cái để
  đeo, thay được — thay cho mặc định đeo cao nhất)**; chim to hơn
  (124, `1ce53f2`); **quẻ thêm Lời giải (125, `553f772`, ĐÃ SOI CODE:
  vẫn 33 quẻ 11/13/9, thơ 4 câu, tất cả có thêm field `general`)**;
  bỏ cây anh đào hồng + tre ở Bảo Tháp (127, `4d62890` — migration cẩn
  thận: anh_dao → sồi, hạt trong túi người chơi được gộp sang sồi chứ
  không mất); bịt khe giữa các tầng mái (128, `c0b6ee1`).
- **Đèn trời + pháo hoa (129, `b7250ac`, ĐÃ SOI CODE):** đèn trời 15 xu,
  +2 công đức, chờ 60s, chỉ ngoài sân, cả phòng thấy, tính vào stat đèn;
  pháo hoa 3 cỡ, cooldown theo cỡ, khóa 1 màn/phòng, mở khóa đúng cả
  đường lỗi, rồng phượng báo cả chùa.

### Fix sau tin 129 — sáng 17/11 (không ghi tin mới, HEAD `7a70bf1`)
- `4af3bdd`: tin 100 đổi tiêu đề thành "Đèn lồng đỏ dời khỏi cột đá và đèn đá,
  không còn chồng chéo" (tiêu đề cũ trùng tin 95).
- `2436a30`: watermark ảnh thành "Chùa 24/7 • chua247.top".
- `b3b3799`: xóa đoạn đường thừa phía nam Phòng Ghi Công Đức (temple.ts,
  rect stale `(-43.2, 39.5, -40.8, 42.2)`; rect live phía bắc còn nguyên).
- `7a70bf1`: `admin:grant` thêm 1 dòng ghi `admin_log` (trước đó chỉ
  selfgrant mới ghi — xem rider 6 cũ, nay đã xong).
- 4 commit này chạy qua vòng mới: **Lux viết prompt → Sonnet qua Vilao viết
  code → Lux soi + áp + push** (nối 2026-11-17, key Vilao của chủ dự án;
  Sonnet ưu tiên butterfly → stey → nra, lỗi thì sang Opus 5.5 cùng thứ tự).
  Chủ dự án cho phép Lux tự push lên GitHub không cần hỏi trước.

### ĐÃ KIỂM CHỨNG bằng code (không theo tự báo cáo)
- A2: merge gọi ở 11 chỗ trong temple.ts (trước là 0); chuông đã lật đúng;
  prewarm nối trong main.ts; tin sạch, A2.2 ở ID 11.
- R2.1 + R3: xem mục trên. Vườn cây: migration có PRAGMA-guard + backfill,
  giai đoạn 15 phút (hạt tốt 10 phút), 25% hạt tốt, thu hoạch tốt +15 xu.
- A2.1 lát 4 (HEAD `bb147d9`): map bounds x −66..66, z −88..64; tin 5→6;
  ảnh hành lang PASS; ảnh toàn cảnh mờ do sương (chấp nhận).
- **Bảng quản trị (tin 107, ĐÃ SOI CODE 2026-11-17):** `requireAdmin` kiểm
  `is_admin` phía server trên mọi handler; `admin:grant` tặng người khác cap
  100k; `admin:selfgrant` cap 1M + ghi `admin_log`; `admin:ban` cấm tự khóa
  mình + cấm khóa admin khác, xóa hết session, và **login chặn tài khoản bị
  khóa** (kiểm sau mật khẩu nên không lộ tài khoản nào bị khóa); `listPlayers`
  escape ký tự LIKE; `admin:broadcast` cooldown 5s, 1–200 ký tự; `admin:stats`
  đếm đúng. Sót duy nhất lúc đó (`admin:grant` không ghi log) ĐÃ SỬA
  (`7a70bf1`). Teleport chỉ client-side (panels.ts, không có endpoint server
  — hợp với kiểu di chuyển client-authoritative của game, không tính là lỗi).
- **Hạ tầng Fly.io (ĐÃ SOI CODE): fly.toml đặt `DB_FILE=/data/chuaonline.db`
  trên volume, KHÔNG có `TURSO_*` — Fly đang chạy SQLite local, không nối
  Turso.** Nghĩa là 72 tài khoản trên Turso với dữ liệu trên Fly là 2 DB
  riêng; đâu là production thật + dữ liệu nào là chuẩn thì CHƯA RÕ — chờ
  quyết của chủ dự án (đã hỏi sáng 17/11), đừng tự gộp hay tự chọn DB.
- Đèn trời + pháo hoa, hồ sơ + danh hiệu, quẻ Lời giải, minimap tròn: xem
  mục tin 108–129 trên. Tin sạch: LATEST 129, 131 entries (offset-2 giữ).

### CHƯA KIỂM CHỨNG — đừng ghi là xong
- Ảnh nghiệm thu loạt tin 25–129 (đặc biệt 39–129): CHƯA CÓ.
- Test máy thật Galaxy S26 Ultra: tuyến 5 nhà (nhà khách → tăng xá → nhà tổ →
  am cổ → thiền đường) sau fix đơ + camera zoom (31) + tượng vàng 10MB +
  model 3D (48) + nhãn mới (61) + giảm nóng (73) + vườn cây (82) + Sư Ông
  (83–84) + chụp ảnh/bia tuần/áo mới (88/87/99) + bảng quản trị, đèn trời/
  pháo hoa, minimap tròn, hồ sơ (105–129). Headless không tính.
- Nội thất 7 nhà (A2.3), ca trực/nghỉ NPC, fix đơ trên máy thật, số draw-call:
  chưa đo. Không có script verify nào cho loạt tính năng blitz (tools/ chỉ có
  verify thời R1/R2.2: beads/boost/bow/checkin/mail/shop/spin/stats).
- Ảnh `a21-pho.png` KHÔNG đạt làm bằng chứng §12.6 — chụp lại từ cổng (0,44)
  nhìn ra phố. Nhãn bản đồ còn chồng 4 chỗ.

### RIDER — đã xong trong đợt này
- ~~PHONG_CD duplicate~~ — XONG `b3b3799` (xóa rect stale phía nam).
- ~~Tin 100 trùng tiêu đề tin 95~~ — XONG `4af3bdd`.
- ~~Watermark R3.2 "Chùa Online"~~ — XONG `2436a30` (thành "Chùa 24/7").
- ~~Admin audit-log thiếu (admin:grant không ghi log)~~ — XONG `7a70bf1`.

### RIDER CÒN TREO
- **Đường tới am cổ** còn thiếu (đi bộ kiểm lát 4 tới được là nhờ đi trên cỏ).
  Ranh giới bắc đã mở ở A2.7 nên tới được Am Cổ, nhưng đường lát tới đó chưa có.
- **Shop bán áo tu — CHỜ QUYẾT của chủ dự án:** áo tràng nâu 120 / vàng 320 /
  trúc 150 + áo lam 60 bán bằng xu như phụ kiện, đụng luật Phần C "áo tu chỉ
  đạt bằng tu tập, không bán"; áo tràng vàng còn ghi "chỉ dành cho bậc cao cấp"
  nhưng trả 320 xu là có. Giữ bán hay rút lại để dành cho Phần C?

### QUYẾT ĐỊNH CÒN TREO (chủ dự án)
- Áo tu trong shop: giữ hay rút (mục trên).
- Hòm công đức + hệ nhiệm vụ/thú cưng + danh hiệu + vườn cây + Sư Ông xếp ở
  đâu trong lộ trình (sau R2.1 theo thứ tự khóa là R3 — R3 đã xong; roadmap
  cập nhật sau nghiệm thu).
- **Đâu là production thật — Fly SQLite local hay Turso?** Fly chạy
  `DB_FILE=/data/chuaonline.db`, không nối Turso; 72 tài khoản Turso và dữ
  liệu Fly là 2 DB riêng. Chủ dự án xác nhận đâu là chuẩn rồi mới tính chuyện
  gộp/migrate — đừng tự chọn.
- Fable audit: chủ dự án đang duyệt nội dung kit (`prompt-audit-fable-chua-online.md`,
  17/11); chạy Prompt A sau khi duyệt xong, trước R4.
