# Prompt: A2.4 — Điện Tam Thế (0, −54) — dựng từ zero

Mục tiêu: dựng Điện Tam Thế — điện lớn nhất và cao nhất của chùa, đích cao nhất của trục hành hương — trên nền ~3.0 ở phía Bắc. Đây là hạng mục A2.4 (không phải GĐ2 Mục 16 cũ — lộ trình tổng hợp đã đổi tên: Phần A đã xong, Điện Tam Thế chuyển sang A2.4). Bảo Tháp (−17, −52) đã dựng xong trước đó, không đụng tới.

**Quy tắc làm việc (bắt buộc):** trước khi làm bất cứ việc gì, tạo **todo list bằng `todowrite`** liệt kê đủ các việc dưới đây; luôn chỉ có 1 việc `in_progress`; xong việc nào cập nhật todo list ngay việc đó; toàn bộ gói này **1 commit riêng** (`git add` từng đường dẫn, không `git add -A`), làm xong thì **push luôn trong cùng session** (`pull --rebase` trước, không force-push) — quyết định của chủ dự án 2026-11-11. Không sửa tượng (v4 là việc riêng), không sửa NPC/animation, không thêm chữ Hán (chỉ tiếng Việt).

## 0. Đối chiếu code hiện tại trước khi làm (đừng đoán)

- Head GitHub hiện tại là `bb147d9` (A2.1 đã xong). `WALL` là x ±62, zN −82, zS 45; `CORR.half` 2.6. `TAM_THE = { x: 0, z: -54 }` trong `src/layout.ts` — **chỉ là hằng số đặt chỗ, điện chưa hề tồn tại** (đã kiểm code 2026-11-11, không có nền, không có điện, không có tượng). Nếu trong code trên máy đã có điện rồi thì dừng lại và báo — đừng làm lại.
- Hàng xóm quanh (0, −54): Bảo Tháp `BAO_THAP` (−17, −52) phía Tây; Nhà Tổ (36, −68) phía sau; Viện Tổ phía Đông–Bắc, Viện Khách Tăng phía Tây–Bắc. Không lấn vào vùng của chúng.
- Khung tham chiếu là Điện Pháp Chủ hiện có: `HALL` (0, −32), hx 17, hz 10, nền h 1.35 (`src/layout.ts`); `buildHall()` trong `src/hall.ts` — cột cao 7.6, mái 3 tầng, bàn thờ + 5 tượng clone từ `buildBuddha()` (`src/statues.ts`, hàm `place()` clone + scale), zone `tamBao` r 6.2, ghế bồ đoàn trong điện, `sealArchitectureJoints(g, { maxGap: 0.9 })`.
- Bài học từ Bảo Tháp (đừng lặp lại): nền cao mà `groundY()` không biết thì nhân vật không bước lên được — Bảo Tháp phải thêm `BAO_THAP_PLAT` + 2 bậc thềm phía Nam; và `clickTarget` đi thẳng bị kẹt nên đã có `planPath` (Dijkstra) trong `src/main.ts` — đi thử bằng nút bản đồ phải chờ đủ lâu tới khi nhân vật tới nơi thật, không kết luận sớm.
- Concept tượng đã có trong repo, **tracked**: `phan-a2/Concept A Di Đà.webp` + `phan-a2/Concept Di Lặc.webp` (cùng thư mục với `phan-a2-mo-rong-chua-online.md` mục 5). Kiểm tra đầu session: nếu 2 file này không có trong repo trên máy thì dừng lại và báo.

## 1. Nền ~3.0 + thang lớn giữa trục + groundY

- Nền Điện Tam Thế cao **~3.0** (theo tổng mặt bằng gốc; chính điện là 1.35). Dựng bệ đá nhiều bậc quanh nền, thang lớn giữa trục dẫn từ chính điện (z −32) lên nền điện — đi bộ lên được, không phải nhảy bậc (làm đoạn dốc/bậc như `PIER_RAMP` ở Thủy Đình hay `BAO_THAP_PLAT`, không để bậc cao 1.35m chặn đường).
- `groundY()` trong `src/layout.ts` phải biết nền mới (thêm hằng số kiểu `TAM_THE_PLAT`, như cách `BAO_THAP_PLAT` đã làm): đứng trên nền thì y ≈ 3.0, đứng trên thang thì y theo bậc. Đường trục từ chính điện lên điện mới lát đá như đoạn hiện hữu.
- `blocked()` giữ vùng cấm quanh nền điện để cây/hoa ngẫu nhiên không mọc đè (đã có vùng cấm giữ chỗ từ trước — kiểm tra lại, chỉ bổ sung nếu thiếu).
- Không lấn vào vùng đã có: Bảo Tháp (−17, −52, collider r 4.6 + nền của nó), dải hậu chẩm (z ≈ −78..−82).

## 2. Dựng điện — lớn hơn Điện Pháp Chủ, mái 3 tầng

- Mở rộng bộ khung chính điện hiện có (`buildHall` làm mẫu — viết hàm riêng, ví dụ `buildTamThe()` trong `src/hall.ts` hoặc `src/temple.ts`, đừng sửa `buildHall` của Pháp Chủ): quy mô **lớn hơn** Pháp Chủ (rộng/sâu hơn hx 17 / hz 10, cột cao hơn 7.6), **mái 3 tầng**. Tổng chiều cao sau khi dựng phải **vượt chính điện (22.47 + nền)** theo spec — đo và ghi con số thật vào báo cáo.
- Biển tên **"ĐIỆN TAM THẾ"** tiếng Việt (không chữ Hán), câu đối tiếng Việt trên 2 cột tiền đường (tự soạn 2 câu đối xứng, đúng nội dung Tam Thế — quá khứ/hiện tại/vị lai).
- Chừa lối cửa Nam thông với thang trục; cột không chặn lối đi giữa (như Pháp Chủ: không cột giữa trước bàn thờ). `sealArchitectureJoints` cho điện mới, gapdump còn 0 khe lớn (ngưỡng như các gói trước).

## 3. Trong điện: bộ ba tượng Tam Thế + bàn thờ + bồ đoàn

- Trong điện thờ đúng **3 tượng Tam Thế** trên bệ thờ, theo thứ tự: **A Di Đà (trái) — Thích Ca (giữa, lớn nhất) — Di Lặc (phải)**. Dùng `buildBuddha()` đã có theo đúng kiểu `place()` trong `hall.ts` (clone + scale + xoay nhẹ), tượng giữa lớn nhất, 2 tượng bên nhỏ hơn đối xứng. **Không thiết kế lại tượng** — builder hiện tại chưa đạt chuẩn v4, việc sửa tượng là gói riêng; phân biệt 3 tượng bằng tỉ lệ/tư thế/phụ kiện theo concept, không tạc mặt mới.
- Mẫu tượng: Thích Ca theo concept Phật Tổ đã duyệt; A Di Đà và Di Lặc theo 2 file concept trong `phan-a2/` (đã kiểm tra ở bước 0). Giữ nguyên quy tắc chống creepy đã chốt: mặt trơn, chi tiết vẽ bằng nét cong, không hốc mắt/mũi sắc.
- Bàn thờ + lư hương + bàn cúng (bát hương, hoa, đèn) trước 3 tượng, hàng bồ đoàn phía trước trong điện (đăng ký vào danh sách ghế như Pháp Chủ để nút "Lạy Phật" tự chạy tới bồ đoàn trống được — nhớ bài học Thủy Đình: ghế nào gắn cờ `rest` thì nút Lạy sẽ không kéo người ra đó, nên ghế trong điện này phải là ghế lạy bình thường; nếu khuôn viên không cho phép thì bỏ ghế, ghi rõ trong báo cáo).

## 4. Zone + câu đối + bản đồ

- Zone `tamThe` (r ~6) quanh điện, popup câu đối + giải thích Tam Thế trong `COUPLETS` (`src/couplets.ts`), hiện khi vào zone qua cơ chế `updateCouplet` sẵn có.
- Thêm mục "Điện Tam Thế" vào `PLACES` trong `src/features/map.ts` dùng `TAM_THE` (0, −54) — không dùng PAGODA. Tên phải khác "Bảo tháp" và "Tháp cảnh".

## 5. Nghiệm thu

- `npm run typecheck` + `npm run build` sạch; gapdump 0 khe lớn.
- Đi bộ kiểm: từ Tam Quan đi hết trục lên tới Điện Tam Thế, nhân vật thực sự đứng trên nền (y ≈ 3.0), zone + popup hiện; bấm nút bản đồ "Điện Tam Thế" thì nhân vật tới nơi thật (chờ đủ lâu, dùng `planPath`).
- 5 ảnh vào `shots/`: điện từ trục nhìn lên, cận cảnh bàn thờ + 3 tượng, trong điện nhìn ra, bản đồ sau khi thêm, đi bộ tới nơi.
- Cập nhật `HANDOFF.md` (mục A2.4) + thêm mục tin tức "Có gì mới" vào đầu `src/data/news.ts` (tăng `LATEST_NEWS_ID`) — thiếu mục tin tức = không đạt nghiệm thu.

> Nhiệm vụ: dựng Điện Tam Thế (A2.4) tại TAM_THE (0, −54) theo đúng thứ tự (0 đối chiếu → 1 nền + thang + groundY → 2 dựng điện → 3 bộ ba tượng + bàn thờ → 4 zone + bản đồ → 5 nghiệm thu), 1 commit riêng rồi push. **Việc đầu tiên là tạo todo list bằng `todowrite` liệt kê đủ các việc.** Học theo khung Điện Pháp Chủ sẵn có và 2 file concept trong `phan-a2/`; toàn bộ code tự viết mới, **giữ nguyên lễ lạy và NPC/animation**. Chạy `npm run typecheck` + `npm run build` sau từng việc, chụp kiểm tra theo mục 5 rồi mới báo xong.
