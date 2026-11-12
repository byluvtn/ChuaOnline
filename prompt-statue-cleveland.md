# Prompt: Gắn tượng Phật ngồi scan 3D (Cleveland, CC0) vào Vườn Tháp

> **XẾP HÀNG SAU A2.4 + A2.5** — hai gói đó đã xong + push (994827e, 56c5196); gói này làm tiếp được. **Quyết định của chủ dự án 2026-11-12 15:30: GIỮ tượng Cleveland, phủ vật liệu vàng bóng trong game** (xem mục 1) — các mẫu vàng bóng trên Sketchfab đều không tải được/không có license dùng được, scan bảo tàng CC0 đều phủ patina đỏ/sẫm, nên không đổi mẫu khác.

Mục tiêu: đặt một tượng Phật ngồi bằng đá (scan 3D thật của bảo tàng) ở Vườn Tháp làm tượng nền trang trí — cho khu vườn tưởng niệm có một điểm nhấn thật, đỡ phải thiết kế thêm. Đây KHÔNG phải tượng chính điện và KHÔNG phải bộ ba Tam Thế (A2.4): không đụng `src/statues.ts`, `src/hall.ts`, không sửa tượng procedural nào.

**Quy tắc làm việc (bắt buộc):** trước khi làm bất cứ việc gì, tạo **todo list bằng `todowrite`** liệt kê đủ các việc dưới đây; luôn chỉ có 1 việc `in_progress`; xong việc nào cập nhật todo list ngay việc đó; toàn bộ gói này **1 commit riêng** (`git add` từng đường dẫn, không `git add -A`), làm xong thì **push luôn trong cùng session** (`pull --rebase` trước, không force-push) — quyết định của chủ dự án 2026-11-11. Không thêm chữ Hán.

## 0. Đối chiếu file + giấy phép trước khi làm (đừng đoán)

- File `public/models/seated-buddha.glb` CHƯA có trong repo (file nhị phân không push qua được công cụ của trợ lý) — tải về từ https://www.yeldabalta.com/models/seated-buddha.glb vào `public/models/`, rồi kiểm tra: kích thước ~10,3 MB và SHA-256 phải là `cb326ff926c1767cdf21fa64b96ade71d042b93d98bf0af72769d2e05c0c78be`. Nếu hash sai thì tải lại, không dùng file khác. Commit file .glb này cùng với code trong gói này.
- Nguồn + giấy phép (đã kiểm 2026-11-12): scan 3D "1973.85.a Seated Buddha (sculpture)" của **Cleveland Museum of Art**, giấy phép **CC0 1.0** (dùng tự do, kể cả thương mại, không bắt buộc ghi credit; credit đã ghi trong `public/models/README.md`). Gốc: https://sketchfab.com/3d-models/197385a-seated-buddha-sculpture-c9e0d5000ca345ea9dacf35f25db57b2. Đây là tượng Phật ngồi thật, KHÔNG phải tranh tường (bản The Met "Buddha of Medicine" đã loại vì chỉ là tranh phẳng, sâu 0,00 m).
- Số liệu thật của file (đã đo): **150.622 tris, 4 meshes, 1 material, 3 textures**, kích thước thật 0,58 × 0,72 × 0,85 m (rộng × cao × sâu). File nặng 10,3 MB — chấp nhận được cho MỘT tượng nền ở một góc vườn (chỉ tải một lần, có cache), nhưng phải có bước kiểm FPS ở mục 4.
- Mẫu load GLB đã có sẵn: `src/models.ts` dùng `GLTFLoader` (khe `lantern.glb` đang chạy); server đã serve `.glb` (`model/gltf-binary`). Đọc `src/models.ts` + `public/models/README.md` trước khi code.

## 1. Đặt tượng ở Vườn Tháp

- Vị trí: **Vườn Tháp, `VUON_THAP` (49, −63)**, nền `VUON_THAP_PLAT` (hx 7.0, hz 5.0, y 0.2) trong `src/layout.ts`. Dựng thêm **bệ đá** (procedural, như bệ tượng ở các sân khác) dưới chân tượng để nó đọc là tượng đá cổ trong vườn, không đặt trực tiếp xuống đất.
- Tượng thật chỉ cao 0,72 m — **scale lên ~2,5–3×** (cao ~1,8–2,2 m cả bệ) để nhìn ra tượng vườn từ đường đi; giữ nguyên tỉ lệ 3 chiều, không kéo dãn. Xoay mặt tượng về phía đường vào vườn (hướng Nam / lối đi), không quay lưng vào đường.
- **Phủ vàng bóng (quyết định của chủ dự án 2026-11-12 15:30):** bản scan gốc màu đồng sẫm bụi bặm — sau khi load GLB, duyệt toàn bộ mesh và thay material bằng **vàng bóng**: `MeshStandardMaterial` màu vàng gold (~`0xD4AF37`), `metalness: 1.0`, `roughness: ~0.2` (bóng như tượng sơn vàng trong chùa, không bóng gương). Bỏ qua texture đồng sẫm gốc (vẫn nằm trong file nhưng không dùng). Mặt mũi tượng là hình khối thật trong scan (mắt nhắm, mũi, miệng đều là geometry) nên phủ vàng không làm mất nét mặt. Không gắn outline toon (tượng realistic, đứng riêng một góc vườn). Bệ đá procedural giữ màu đá xám để tương phản với vàng.
- Không lấn vào: Bảo Tháp (−17, −52), Am Cổ (53, −75), Nhà Tổ (36, −68), rào Viện Tổ và đường đi trong vườn.

## 2. Collider + zone (nếu chưa có)

- Thêm collider cho tượng + bệ (r ~1,2) để nhân vật không đi xuyên. Kiểm tra zone Vườn Tháp đã có chưa trong `src/temple.ts` / `src/couplets.ts`: nếu chưa có popup khi vào vườn, thêm mục `vuonThap` ngắn (1–2 câu giới thiệu chung về Vườn Tháp và tượng đá cổ, tiếng Việt, không chữ Hán; không gán tên Phật cụ thể vì không rõ niên đại/loại tượng).
- Không đăng ký ghế, không thêm nút hành động mới.

## 3. Load an toàn (không được làm sập game)

- Load GLB **bất đồng bộ, không chặn** màn hình loading/chọn nhân vật: nếu file lỗi hoặc tải chậm, game vẫn chạy; tượng hiện sau khi load xong. Nếu load thất bại: log warning, **giữ một khối đá procedural đơn giản làm chỗ giữ chỗ** (hoặc để trống), tuyệt đối không crash, không màn hình trắng.
- Không load lại file mỗi lần vào vườn (load 1 lần lúc khởi động scene, cache lại như `lantern.glb`).

## 4. Nghiệm thu

- `npm run typecheck` + `npm run build` sạch.
- Đi bộ kiểm: từ cổng Nam tới Vườn Tháp, đứng trước tượng, đi vòng quanh — không xuyên tượng/bệ, popup vườn hiện (nếu có).
- Ảnh vào `shots/`: toàn cảnh vườn có tượng, cận cảnh tượng, bản đồ (Vườn Tháp). **Ảnh cận cảnh phải thấy rõ tượng VÀNG BÓNG** (không còn màu đồng sẫm bụi như bản scan gốc).
- **Kiểm FPS trên điện thoại thật** khi nhìn thẳng tượng (150k tris): ghi số FPS, so với khi không nhìn tượng. Nếu tụt rõ rệt thì báo lại (hướng xử lý sau: giảm poly), không tự ý xóa tượng.
- Cập nhật `HANDOFF.md` (mục tượng scan Vườn Tháp) + thêm mục tin tức "Có gì mới" vào đầu `src/data/news.ts` (tăng `LATEST_NEWS_ID`).

> Nhiệm vụ: gắn tượng Phật ngồi scan 3D (Cleveland, CC0) vào Vườn Tháp theo đúng thứ tự (0 đối chiếu file + hash → 1 đặt tượng + bệ đá + **phủ vật liệu vàng bóng** → 2 collider + zone → 3 load an toàn → 4 nghiệm thu), 1 commit riêng rồi push. **Việc đầu tiên là tạo todo list bằng `todowrite` liệt kê đủ các việc.** Đọc `src/models.ts` + `public/models/README.md` trước khi code; chỉ làm tượng nền ở Vườn Tháp, **không đụng tượng chính điện, bộ ba Tam Thế, NPC, animation**. Chạy `npm run typecheck` + `npm run build` sau từng việc, nghiệm thu theo mục 4 rồi mới báo xong.
