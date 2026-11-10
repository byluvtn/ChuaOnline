# Đối chiếu: chuaonline.org vs game Chùa Online của jenyfer

*Ngày: 2026-11-10. Nguồn dữ kiện: phía họ — trang bìa + bundle client công khai của chuaonline.org (trích xuất ~1.800 chuỗi tiếng Việt trong file game 696KB đã nén, danh sách API/WebSocket trong code). Phía mình — repo `byluvtn/ChuaOnline` tại HEAD `6871320`: `server/index.ts`, `package.json`, `HANDOFF.md`, các spec đã kiểm chứng.*
*Mục đích: phân tích tính năng và kiến trúc để tự thiết kế lại cho game của mình. Không sao chép code, thơ quẻ hay nội dung biên soạn của họ.*

## 1. Bảng đối chiếu theo hệ thống

| Hệ thống | chuaonline.org | Game của mày | Nhận định |
|---|---|---|---|
| Engine / build | Vite + Three.js, chia chunk (vào trang 24KB, bấm Chơi mới tải 696KB game) | Vite 6 + Three 0.170 | Ngang. Họ tối ưu tải lần đầu tốt hơn |
| Multiplayer | WebSocket thuần `/ws/chua`, một thế giới chung | **socket.io, nhiều phòng chùa** (vào phòng, đầy thì báo, "viếng chùa" qua lại giữa các phòng) | Ngang, khác triết lý: họ 1 thế giới đông, mày nhiều phòng nhỏ |
| Tài khoản | Tài khoản nội bộ + **Google** + **chơi thử 15 phút** không cần đăng ký | Tài khoản nội bộ (token), chưa Google, chưa chơi thử | Họ hơn ở cửa vào cho người mới |
| Tiền tệ | **Sen + Ngọc** (Ngọc: tiền tệ hiếm, qua nhiệm vụ ngày) + công đức | Sen + công đức (xu trong code = Sen) | Họ có 2 lớp tiền, mày 1 lớp — chưa phải vấn đề |
| Cấp độ | 6 cấp tu có tên (Sơ tâm → An lạc), mốc công đức rõ | Có cấp từ công đức + thưởng mốc cấp tự động (`level:bonus`) | Ngang về cơ chế; họ hơn ở trình bày/tên gọi |
| Nhiệm vụ | Nhiệm vụ ngày (thưởng Ngọc), nhiệm vụ tuần | **14 nhiệm vụ ngày + 3 nhiệm vụ tuần**, reset theo `day_key`/`week_key` | **Ngang, thậm chí mày nhiều hơn** |
| Điểm danh / streak | **Lịch điểm danh 7 ngày, thưởng tăng dần, đứt chuỗi tính lại; push nhắc khi sắp đứt** | Chưa có (mới có reset ngày cho nhiệm vụ/minigame) | **Khoảng trống thật — hệ giữ chân quan trọng nhất đang thiếu** |
| Hòm thư | **Có**: quà nhập môn 100 Sen + lễ vật, thư tặng quà, chấm đỏ chưa đọc | Chưa có | Khoảng trống thật |
| Tặng quà người chơi | **Có**: tặng lễ vật kèm lời nhắn qua hòm thư | Chưa có | Khoảng trống (xã hội) |
| Vòng quay lộc | **Có**: miễn phí 1 lượt/ngày | Chưa có (có khung `minigame:reward` theo ngày để gắn vào) | Khoảng trống, làm rẻ |
| Tụng kinh | Chọn bài, đọc từng câu, gõ mõ tay/tự động | **Có**: 3 bài (Bát Nhã, Chú Đại Bi, Niệm Phật 108), karaoke highlight, mõ tự gõ 40–120 nhịp | Ngang |
| Tràng hạt | UI lần tay từng hạt trong vòng 108, ngồi bồ đoàn | Tràng hạt là vật phẩm + niệm 108 trong panel tụng kinh | Họ hơn ở trải nghiệm riêng; mày gộp panel |
| Xin xăm | **60 quẻ** tự biên soạn, mỗi ngày 1 quẻ cố định trong ngày | Chưa thấy trong code | Khoảng trống (nội dung) |
| Thả đèn hoa đăng | Đèn trôi trên hồ, **kèm điều ước + pháp danh hiện cho mọi người** | Có hành động thả đèn (nhiệm vụ đèn 1/3), server đã nhận tham số `wish` | Gần ngang — kiểm tra mức hiển thị điều ước hiện tại |
| Quét lá | Lá rụng mỗi 15 giây, đứng gần giữ 5 giây để quét, tính công đức | Có khung minigame theo ngày, chưa rõ gồm trò nào | Họ có minigame môi trường cụ thể; mày có khung |
| Linh thú | Đi theo, **cưỡi được**, cho ăn, **đua thú cưỡi** 8 cột mốc + bảng xếp hạng ngày | Có nhóm đồ Linh thú + Đồ linh thú trong shop | Họ là hệ thống sống; mày mới là vật phẩm |
| Trồng cây | Mua cây non 30 Sen, trồng ở vườn, cây cảnh/cây cho quả | Shop có nhóm "Cây Phật", chưa thấy cơ chế trồng | Khoảng trống (hệ thống con) |
| Thiền | Đồng hồ thiền, mốc 60 phút tự ghi, thưởng mốc dài hạn (300 lạy, 60' thiền, 7 chuỗi...) | Có hành động thiền (nhiệm vụ thiền 2/5 phút) | Họ hơn ở **mốc thành tựu dài hạn** |
| Hệ số thời khoá | **×2 công đức** vào 5:00–5:20, 12:00–12:30, 20:00–20:30; **×1,5** ngày Mùng 1/Rằm | Chưa có (boost hiện tại từ vật phẩm: nến, tràng hạt) | Khoảng trống — **rẻ mà hiệu quả giữ chân theo giờ** |
| Chat | Có, reply theo dòng, lọc từ nhạy cảm cho pháp danh | Có chat + nhiệm vụ chat | Ngang |
| NPC | Sư thầy và các tiểu đi lại trong sân, đối thoại dẫn dắt người mới | Chưa thấy NPC đối thoại (có tượng, cá koi, môi trường) | Họ hơn ở "độ sống" và hướng dẫn người mới |
| Chụp ảnh trong game | **Có nút chụp, ảnh đóng watermark chuaonline.org** | Chưa có (ảnh chụp hiện là việc phía dev/admin) | Khoảng trống nhỏ, giá trị lan truyền cao |
| Bảng xếp hạng | Công đức + ủng hộ + đua thú theo ngày | Có `rank:get` (xếp hạng) | Ngang cơ bản |
| Bia công đức / ủng hộ | **Bia trước cổng ghi tên người góp nhiều nhất; Sổ cảm ơn; xếp hạng ủng hộ (donate thật)** | Chưa có | Họ đã monetize bằng donate cộng đồng |
| PWA / push | Cài như app, service worker, **push nhắc streak + ngày Rằm** | Chưa có | Khoảng trống phát hành |
| Trang bìa / SEO | Landing page SEO đầy đủ, fanpage Facebook | `index.html` là trang game trần | Khoảng trống phát hành |
| Hạ tầng dữ liệu | Không rõ (nginx tự host) | Render + **Turso** (72 tài khoản thật, sống qua restart), admin account + free cam | Mày rõ ràng và đã kiểm chứng |
| Thế giới / kiến trúc | Một khuôn viên cố định, hoàn thiện | Khuôn viên đang mở rộng theo **masterplan 3 giai đoạn** (GĐ1: gác trống, Đền Trình, cột kinh, Thủy Đình, hành lang La Hán...) | **Mày hơn về chiều sâu thế giới đang lớn lên** |

## 2. Kết luận nhanh

- Game của mày **không hề thua xa** như cảm giác ban đầu: nền multiplayer thời gian thực, nhiệm vụ ngày/tuần, tụng kinh, shop 22 món/11 nhóm, xếp hạng, minigame — đều đã có khung hoặc có thật.
- Khoảng trống lớn nhất của mày không nằm ở "thiếu tính năng tu tập" mà ở **lớp giữ chân (retention)**: điểm danh–streak, hòm thư, vòng quay hằng ngày, hệ số thời khoá. Đây là lớp khiến người chơi quay lại mỗi ngày, và nó **rẻ để làm** vì mày đã có sẵn `day_key`, `minigame_daily`, `level_rewards`.
- Khoảng trống thứ hai là **lớp phát hành**: trang bìa SEO, PWA, fanpage — họ có người chơi một phần vì lớp này.
- Đừng đuổi theo: đua thú cưỡi, trồng cây, bản đồ hành hương, Google OAuth, donate thật. Đó là các hệ thống con tốn tuần công, chỉ đáng làm khi đã có cộng đồng.

## 3. Đề xuất đưa vào masterplan — làm SAU khi hoàn thành toàn bộ khuôn viên (GĐ1 → GĐ2 → GĐ3), theo thứ tự R1 → R2 → R3 → R4 (người dùng chốt 2026-11-10)

**Gói R1 — Giữ chân (ưu tiên cao nhất, phần lớn là Dễ–Trung bình):**
1. Điểm danh 7 ngày + streak: dùng luôn `day_key` hiện có; thưởng tăng dần bằng Sen/vật phẩm; đứt 1 ngày quay về ngày 1. Server chốt, client chỉ hiển thị lịch.
2. Hòm thư tối thiểu: thư hệ thống + quà nhập môn cho tài khoản mới (Sen + hương/nến/đèn), chấm đỏ chưa đọc. Đây là nền cho tặng quà sau này.
3. Vòng quay lộc 1 lượt/ngày: gắn vào `minigame:reward` sẵn có, thưởng Sen nhỏ + thỉnh thoảng vật phẩm.
4. Hệ số thời khoá trong `ACTION_RULES`: ×2 công đức 3 khung giờ (5:00, 12:00, 20:00 — tự chọn thời lượng), ×1,5 Mùng 1/Rằm âm lịch. Chỉ là nhân hệ số phía server + 1 dòng thông báo trong game.
5. Mốc thành tựu dài hạn: bảng đếm tích lũy (tổng lạy, tổng phút thiền, tổng chuỗi hoàn thành) + thưởng mốc kiểu `level_rewards` đã có.

**Gói R2 — Nghi lễ sâu (Trung bình, thiên về nội dung):**
6. Xin xăm: cơ chế ngày-1-quẻ (seed theo ngày + tài khoản, xin lại ra quẻ cũ). **Tự viết** bộ quẻ riêng (có thể ít hơn 60 lúc đầu, 30 cũng được) — không dùng thơ/lời giải của họ.
7. Tràng hạt lần tay: tách niệm Phật thành UI vòng 108 hạt riêng (chạm/Space từng hạt), tái dùng logic đếm hiện có trong panel tụng kinh.
8. Đèn hoa đăng: kiểm tra bản hiện tại đã hiện điều ước cho cả phòng chưa (server đã có `wish`); chưa thì bổ sung chữ trôi trên đèn.

**Gói R3 — Xã hội & lan truyền (Trung bình):**
9. Tặng quà qua hòm thư (dựa trên R1.2): tặng lễ vật + lời nhắn, giới hạn ngày chống farm.
10. Chụp ảnh trong game: nút chụp canvas + đóng dấu tên game — người chơi tự quảng bá cho mày.
11. Bia công đức ở sân trước cổng (khớp quy hoạch GĐ1/GĐ2): ghi tên người chơi công đức cao nhất tuần — phiên bản của mình, không gắn tiền thật.

**Gói R4 — Phát hành (khi sẵn sàng public):**
12. Trang bìa SEO riêng trước cổng game (giới thiệu, cách chơi, ảnh chụp thật từ admin cam).
13. PWA: manifest + service worker để cài lên màn hình điện thoại; push notification để sau cùng (cần người dùng cấp quyền, làm khi đã có người chơi quen).

## 4. Hai lưu ý không thuộc kỹ thuật

- **Tên game:** "Chùa Online" đã có một sản phẩm đang sống dùng đúng tên này, có fanpage và tuyên bố bản quyền. Trước khi public rộng, cân nhắc tên phân biệt (ví dụ thêm tiền tố/hậu tố riêng) hoặc ít nhất ý thức rủi ro nhầm lẫn và khiếu nại.
- **Nội dung:** kinh Phật gốc thuộc về truyền thống chung, nhưng bản dịch, thơ quẻ xăm và lời giải là sáng tạo của từng bên — phần nội dung cho game của mày phải tự viết hoặc dùng nguồn phổ thông được phép, không chép từ bản của họ.
