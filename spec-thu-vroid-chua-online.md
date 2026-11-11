# SPEC THÍ NGHIỆM — VROID / VRM TRONG CHÙA ONLINE (CÓ ĐƯỜNG LUI)

> Giao cho Kilo Code (Antigravity), repo `chuaonline`.
> **Chỉ chạy khi working tree sạch và KHÔNG có session nào khác đang làm dở** (đang xếp sau A2.1).
> Đây là THÍ NGHIỆM ĐÁNH GIÁ, không phải tích hợp. Mục đích: trả lời bằng bằng chứng thật
> "nhân vật VRM có hợp với game này không?" — chưa có quyết định thay nhân vật hiện tại.

## Đường lui (ràng buộc cứng — vi phạm là dừng ngay)

1. **Không sửa bất kỳ file production nào**: cấm đụng `index.html`, `src/main.ts`, `src/character.ts`,
   `src/temple.ts`, `package.json`, `package-lock.json` và mọi file game hiện hữu khác.
2. Thí nghiệm sống trong đúng 3 thứ MỚI:
   - `vrm-test.html` (trang độc lập ở gốc repo, KHÔNG được link từ `index.html`),
   - `tools/steps-vrm-test.mjs` (script chụp ảnh),
   - thư mục `vrm-test-assets/` (model .vrm dùng thử + ghi chú nguồn/giấy phép trong `README.md` con).
3. Thư viện `@pixiv/three-vrm` nạp qua **CDN (esm)** trong trang test — không cài npm.
   Three.js trong trang test dùng đúng phiên bản game đang dùng (kiểm `package.json` để lấy số version, nạp CDN cùng version).
4. Xóa 3 thứ trên là game trở lại nguyên trạng 100%. Mọi commit của thí nghiệm chỉ chứa các file mới này,
   để có thể revert bằng một commit xóa sạch.
5. Ghi HEAD trước thí nghiệm vào báo cáo + HANDOFF (mốc đường lui).

## Bước 1 — Chứng minh đường ống bằng model mẫu (Kilo làm trước)

- Tải một model VRM mẫu có giấy phép cho phép phân phối lại (ưu tiên mẫu CC0 dòng AvatarSample β của
  VRoid Project; nếu không tải được thì dùng model ví dụ trong repo `pixiv/three-vrm`).
  Ghi rõ nguồn + giấy phép vào `vrm-test-assets/README.md`. Model mẫu CHỈ để test, không phải ứng viên cho game.
- `vrm-test.html`: nạp model, đặt trên một sân lát đơn giản có đèn giống tông game (hemi + directional),
  nền trời giống game. Điều khiển tối thiểu: xoay camera orbit, nút chuyển tư thế:
  `Đứng yên` (idle: thở + chớp mắt qua `vrm.update`), `Đi` (xương chân/tay đung đưa thủ tục theo khung xương humanoid),
  **`Lạy` (quan trọng nhất)**: gập spine/neck/cánh tay bằng xương humanoid để mô phỏng cúi lạy —
  đích ngắm là lưng gập rõ, đầu cúi thấp, hai tay đưa về trước. Đây là phép thử quyết định vì các nghi lễ
  của game (lạy, chắp tay) đều là tư thế thủ tục trên khung xương.
- Đo và ghi vào báo cáo: dung lượng file .vrm, thời gian nạp, FPS khi 1 model và khi **10 bản sao** đứng cùng sân
  (multiplayer thật sẽ có nhiều người — chi phí `vrm.update` + spring bone nhân theo số người là rủi ro lớn nhất).
- Ảnh: `shots/vrm-sample-idle.png`, `shots/vrm-sample-bow.png`, `shots/vrm-sample-10x.png` (10 bản sao + FPS hiển thị).

## Bước 2 — Model tự thiết kế (user làm trong VRoid Studio, ngoài repo)

User tự nặn **tiểu tăng thử nghiệm** theo checklist Lux đưa riêng (trọc đầu, áo vàng #D9A62B, tỉ lệ kéo về
chibi tối đa VRoid cho phép), xuất `.vrm`, bỏ file vào `vrm-test-assets/tieu-tang.vrm`.
Bước này không thuộc việc của Kilo; Kilo chỉ chờ file. Tràng hạt chưa cần ở vòng thử này (ghi là khoảng trống đã biết).

## Bước 3 — Thay model của user vào trang test (Kilo, sau khi có file từ Bước 2)

- Trỏ trang test sang `tieu-tang.vrm` (giữ khả năng chuyển qua lại mẫu/tự thiết kế bằng query `?model=`).
- Chụp lại bộ ảnh: idle, lạy, 10 bản sao + FPS, và **ảnh đặt cạnh nhân vật chibi hiện tại**
  (nạp thêm model chibi hiện tại của game vào cùng sân test bằng cách import `src/character.ts` CHỈ ĐỌC —
  trang test được import để dựng một nhân vật hiện tại đứng cạnh; không sửa file đó).
- Báo cáo đối chiếu theo 4 tiêu chí chốt trước:
  1. **Hòa nhập phong cách**: đứng trong sân chùa có lạc quẻ không (user phán từ ảnh).
  2. **Lạy được không**: tư thế lạy ở mức chấp nhận được hay gượng.
  3. **Hiệu năng**: FPS 10 người + dung lượng tải thêm mỗi model (game web phải nhẹ).
  4. **Chi phí nhân rộng**: công sức ước tính để làm đủ 4 nhân vật + áo theo hạng (R5) bằng pipeline này.

## Cổng quyết định (sau Bước 3)

- User + Lux xem ảnh/báo cáo rồi quyết GO / NO-GO.
- GO → Lux viết spec tích hợp riêng (đó mới là lúc bàn thay thế/bổ sung hệ nhân vật, npm, animation).
- NO-GO → xóa 3 thứ của thí nghiệm trong một commit `chore: remove VRM experiment`, game chưa từng bị đụng.
- **Không tự ý tích hợp vào game trong bất kỳ tình huống nào ở spec này.**

## Commit & Push

1. Commit chỉ các file mới của thí nghiệm, add từng file, **không `git add -A`**:
   `test: standalone VRM experiment page (no game integration)` → HANDOFF `docs: update HANDOFF for VRM experiment`.
2. `git pull --rebase origin main` trước khi push; xung đột thì dừng, báo nguyên văn.
3. `git push origin main`; lỗi HTTP 400 thì một lần với `-c http.postBuffer=524288000`. Không force-push.
4. Báo cáo cuối: HEAD trước/sau thí nghiệm, số đo Bước 1 (dung lượng, FPS 1 vs 10), đường dẫn các ảnh.
