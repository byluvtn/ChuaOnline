# SPEC — Vườn cây & khu nghỉ ngơi cho khuôn viên Chùa Online (dán vào Kilo)

Ảnh mẫu: bản đồ tổng thể `so-do-vuon-chua` (nhìn từ trên xuống). Sân chính đã lát gạch xong; spec này lấp các bãi cỏ trống bằng 3 khu vườn/nghỉ theo đúng toạ độ hiện có trong `src/layout.ts`. Điều kiện tiên quyết: tháp Quan Âm đã dời về (28, 14) — Vườn Thiền dùng lại đúng nền đất tháp cũ ở góc Tây–Bắc.

Nguyên tắc chung:
- Mọi thứ bo tròn, toon, đồng bộ vật liệu hiện có (đá `stoneM`, gỗ, đỏ `redM`, vàng `goldM`). Cây/hoa dùng kỹ thuật sẵn có của project (sphere/flat-shading cho tán cây, InstancedMesh cho hoa/sỏi khi số lượng lớn).
- KHÔNG đổi bất kỳ hằng số layout hiện có nào (HALL, DECK, LAKE, BRIDGE, PLAZA, BELL, QUAN, PAGODA, BUDDHA_YARD, WALL). Chỉ THÊM hằng số mới.
- Mỗi khu 1 commit riêng. Chụp nghiệm thu: 1 tấm từ trên cao toàn khuôn viên + 1 tấm tầm mắt người đứng trong từng khu.

## Khu 1 — Vườn Thiền (góc Tây–Bắc, tĩnh nhất khuôn viên)

- Hằng số mới: `ZEN = { x: -34, z: -26 }` (đúng vị trí tháp Quan Âm cũ), bán kính khu ~10.
- Mặt đất: vòng tròn sỏi/cát trắng đường kính ~7 ở tâm (CircleGeometry màu cát sáng `#E4DCC8` + vòng đá cuội viền), phần còn lại giữ cỏ.
- Rặng tre dọc tường Bắc và tường Tây của khu: các khóm tre (thân cylinder mảnh cao 4–6, tán lá dẹt xanh `#4E9A3D`) trồng thành hàng x từ -45 tới -25 ở z ≈ -40 và z từ -40 tới -16 ở x ≈ -44. Collider nhỏ r 0.4 mỗi khóm hoặc 1 collider dài theo hàng.
- 4 chậu bonsai trên đôn đá (đôn = cylinder đá, cây = thân cong ngắn + 2–3 tầng tán cầu dẹt) đặt quanh vòng sỏi.
- 2 ghế đá dài + 1 bộ bàn ghế đá (bàn cylinder r 0.8, 4 đôn tròn) hướng vào vòng sỏi.
- 4 đèn đá (trụ + hộp đèn + chóp) ở 4 góc vòng sỏi — dùng lại `glowSpr` vàng ấm buổi tối nếu hợp mood.
- Hàng rào cây xanh thấp (các cầu xanh r 0.7 xếp liền) bọc cạnh Nam và Đông của khu, chừa 1 lối mở rộng ~2.4 hướng ra đường phụ x = -28.
- Zone mới: `zones.push({ x: ZEN.x, z: ZEN.z, r: 9, id: 'vuonThien' })`.

## Khu 2 — Vườn hoa hai bờ hồ (Đông + Tây, đối xứng)

- Hai bồn hoa cong ôm bờ hồ: tâm bồn Đông (16.5, 23), bồn Tây (-16.5, 23); mỗi bồn là mảng ellipse ~10 × 7 (đất nâu `#6B4A2E` làm nền, viền đá cuội nhỏ). Giữ khoảng cách với vành đá hồ (hồ a = 9 + đá tới ~10.8) — bồn bắt đầu từ |x| ≈ 12.
- Trong bồn: thảm hoa 3 màu hồng `#F4978E` / vàng `#F2C14E` / tím `#9B7EDE` (cụm cầu dẹt nhỏ hoặc InstancedMesh), xen bụi cây tròn xanh r 0.5–0.8.
- Mỗi bờ 2 cây hoa (thân + tán cầu hồng `#F6B8C1` kiểu cây đào/anh đào như cây cảnh hiện có trong sân), 2 ghế gỗ quay mặt ra hồ.
- Không cần zone riêng. Collider chỉ cho thân cây (r 0.35).

## Khu 3 — Khu nghỉ bóng cây (bãi cỏ Đông–Nam)

- Hằng số mới: `REST = { x: 27, z: 31 }`, khu ~16 × 12, giữ nền cỏ.
- 3 cây bóng mát lớn (thân r 0.45 cao ~3, tán = 3–4 cầu xanh chồng nhau đường kính tổng ~5–6) trồng tam giác quanh tâm khu — lớn hơn hẳn cây cảnh thường để tạo bóng.
- Dưới bóng cây: 2 bộ bàn ghế đá (như Khu 1) + 3 ghế gỗ dài.
- 1 lối lát đá nhỏ nối từ khu ra đường cổng–cầu (trục x = 0) hoặc ra đường ngang PATH_Z tuỳ phía gần hơn — vẽ bằng `pathRect` sẵn có.
- Zone mới: `zones.push({ x: REST.x, z: REST.z, r: 8, id: 'nghiChan' })`.

## Việc kỹ thuật bắt buộc

1. `layout.ts`: thêm `ZEN`, `REST` và mô tả 2 bồn hoa; mở rộng `blocked()` để cây/hoa spawn ngẫu nhiên KHÔNG mọc vào trong 3 khu vườn (vườn trồng theo thiết kế, không trồng random đè lên) — Vườn Thiền r 10.5 quanh ZEN, bồn hoa theo ellipse của chúng, Khu nghỉ r 9 quanh REST.
2. Dựng hình trong `temple.ts` (hoặc `compound.ts` nếu hợp cấu trúc hơn): 3 hàm `buildZenGarden`, `buildFlowerBeds`, `buildRestArea`; thêm collider cho cây lớn, khóm tre, bộ bàn đá; ghế và bồn hoa không cần collider.
3. `npm run typecheck` phải pass. Không sửa `statues.ts`, `hall.ts`, logic gameplay.
4. Commit từng khu: `feat: zen garden at NW corner`, `feat: lakeside flower beds`, `feat: shade rest area SE`.

## Checklist nghiệm thu

- [ ] Tấm từ trên cao: thấy rõ 3 khu mới đúng vị trí như bản đồ mẫu, trục chính cổng → cầu → quảng trường không bị chắn.
- [ ] Vườn Thiền: vào bằng lối mở từ đường x = -28, tre không đâm xuyên tường, vòng sỏi + bonsai + đèn đá đọc rõ.
- [ ] Bồn hoa không đè lên vành đá/cá trong hồ; ghế quay ra mặt hồ.
- [ ] Khu nghỉ: tán cây phủ bóng lên bàn ghế; nhân vật đi vào khu được, không kẹt collider vô hình.
- [ ] Không cây/hoa random mọc giữa vườn, giữa đường, hay giữa quảng trường sau khi sửa `blocked()`.
