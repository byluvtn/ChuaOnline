# Sơ đồ mặt bằng chùa Việt Nam: tham chiếu mở rộng khuôn viên Chùa Online

> Tài liệu tham khảo, không phải spec thi công. Tọa độ theo hệ của `src/layout.ts`: trục x ngang (Đông dương), trục z dọc, **Bắc = z âm**, **Nam = z dương**. Cổng chính ở phía Nam (z = 45), chính điện ở phía Bắc (z = -32), quay mặt về Nam. Đơn vị là mét trong game.

## 1. Nguyên tắc bố cục chùa Việt

1. **Trục thần đạo Bắc-Nam**: mọi công trình chính xếp trên một trục thẳng từ cổng ra điện chính. Công trình phụ đối xứng hai bên trục.
2. **Thứ tự đi vào**: cổng tam quan, sân/hồ, lầu chuông-trống, tiền đường, chính điện, hậu đường/nhà tổ. Càng vào sâu càng cao, càng thiêng.
3. **Nền cao dần**: sân thấp, hiên đài cao hơn, chính điện trên bệ cao nhất (game: `HALL.h = 1.35`).
4. **Nước phía trước, núi/cây phía sau**: hồ hoặc ao sen ở phía trước (phong thủy minh đường), vườn, rừng cây, tháp phía sau hoặc hai bên.
5. **Hành lang bao quanh**: nối các công trình, là nơi đặt tượng La Hán, bia, phù điêu (Bái Đính có hành lang 500 tượng La Hán dài hơn 1 km).
6. **Đối xứng lệch chức năng**: bên Đông thường là khu tăng xá, bên Tây khu thờ phụ (ví dụ nhà Tổ, nhà Mẫu), nhưng game có thể đảo tùy ý.

## 2. Bảng tham chiếu ba chùa nổi tiếng

| Yếu tố | Bái Đính (Ninh Bình) | Tam Chúc (Hà Nam) | Chùa Hương (Hà Nội) |
|---|---|---|---|
| Kiểu bố cục | Trục thẳng, nhiều lớp điện, hành lang bao | Quần thể ven hồ, trục chính + nhiều chùa con | Phân tán theo núi, đi thuyền rồi leo núi |
| Cổng | Tam quan lớn, có cổng phụ | Cổng tam quan + bến thuyền | Bến Đục, đền Trình |
| Công trình trung tâm | Điện Pháp Chủ, Tam Thế, Tam Bảo | Điện Tam Thế, chùa Ngọc | Động Hương Tích |
| Tháp/chuông | Tháp Bảo Thiên 13 tầng, gác chuông | Tượng Phật Di Lặc, tháp, gác chuông | Chùa Thiên Trù có gác chuông |
| Nước | Hồ phía trước | Hồ Tam Chúc là trung tâm | Suối Yến |
| Điểm đáng học | Hành lang La Hán, trục thẳng | Quảng trường lớn + nước | Hành trình đi bộ, nhiều điểm dừng |

Gợi ý cho game: dùng **Bái Đính** làm khung (trục thẳng, hành lang), **Tam Chúc** cho mảng nước và khu mở rộng, **Chùa Hương** cho cảm giác nhiều điểm dừng trên đường đi.

## 3. Hiện trạng khuôn viên (từ `src/layout.ts`)

| Hạng mục | Tọa độ | Ghi chú |
|---|---|---|
| Tường rào | x ±47, z từ -45 đến 45 | Cổng ở nam, rộng `gate` 4.4 mỗi bên trục |
| Chính điện | (0, -32), nửa rộng 17 × nửa sâu 10 | Bệ cao 1.35, dốc `ramp` 1.1 |
| Sân đài thiền (DECK) | x từ 4.6 đến 17.2, z từ -18.6 đến -4 | Đối xứng hai bên trục (|x|) |
| Hành lang (CORR) | x = ±20.5, z từ -19 đến -1 | Rộng 3.8, nối tiền đường với đường ngang |
| Quảng trường (PLAZA) | (0, 6), r 8.4 | Sân trước chính điện |
| Đường ngang (PATH_Z) | z = 2 | Chạy x từ -40 đến 40 |
| Hồ cá koi (LAKE) | (0, 22), a 9 × b 6.5 | Elip giữa tam quan và sân |
| Cầu cong (BRIDGE) | x = 0, z từ 14.2 đến 29.8 | Rộng 2.3, đỉnh cao 1.4 |
| Tháp chuông (BELL) | (-34, -6) | Tây |
| Tháp Quan Âm (QUAN) | (28, 14) | Đông, 4 trụ vuông |
| Tượng Phật sân Tây (BUDDHA_YARD) | (-28, 14) | |
| Bảo tháp (PAGODA) | (38, -14) | Đông Bắc |
| Vườn thiền (ZEN) | (-34, -26) | Tây Bắc |
| Khu nghỉ bóng cây (REST) | (27, 31) | Đông Nam |
| Hai bồn hoa bên hồ | (±16.5, 23), a 5 × b 3.5 | |

Đối chiếu với nguyên tắc chùa Việt: trục thần đạo (x=0) đã có đủ cổng, cầu, hồ, quảng trường, chính điện. Hai bên đã có tháp chuông (Tây) và tháp Quan Âm (Đông). **Phần còn thiếu** là: tam quan có mái đúng nghĩa, lầu trống đối xứng lầu chuông, hậu đường/nhà Tổ phía sau chính điện, tăng xá, khu hành lang bao quanh sân, và khoảng trống lớn ở rìa Tây Nam, Đông Bắc.

## 4. Sơ đồ mặt bằng đề xuất (khuôn viên hiện tại, thêm bố trí)

```
                       BẮC (z = -45)
   x=-47                                              x=+47
    +------------------------------------------------+
    |  [R] rừng cây phía sau, tường hậu              |
    |                                                |
    |   [ZEN]        [NHÀ TỔ]*        [BẢO THÁP]     |  z -30..-14
    |  vườn thiền   +----------+    (38,-14)         |
    |  (-34,-26)    | HẬU ĐƯỜNG|                      |
    |               +----------+                      |
    |            +--------------------+               |
    |            |   CHÍNH ĐIỆN       |   z=-32       |
    |            |  (Đại Hùng Bảo Điện)               |
    |            +--------------------+               |
    |   [TĂNG XÁ]*   |  tiền đường |   [NHÀ KHÁCH]*   |  z -19..-4
    |  hành lang X   |  (đài thiền)|   hành lang X    |
    |   (±20.5)      |             |                  |
    |   [CHUÔNG]     |             |    [LẦU TRỐNG]*  |  z -6
    |   (-34,-6)     |  QUẢNG TRƯỜNG (0,6) r8.4       |
    |----------------+------+------+-----------------|  z = 2 (đường ngang)
    |  [BUDDHA_YARD]        |      |  [THÁP QUAN ÂM]  |  z 14
    |   (-28,14)     [BỒN HOA] hồ [BỒN HOA]  (28,14)  |
    |                 (±16.5,23) (0,22)               |
    |                       cầu cong                  |
    |                   [KHU NGHỈ]  (27,31)           |
    |                                                |
    +--------------[ TAM QUAN  z=45 ]----------------+
                       NAM (z = +45)
   * = hạng mục đề xuất thêm (chưa có)
```

## 5. Mô tả từng khu vực và quan hệ giữa chúng

### 5.1. Cổng tam quan (z ≈ 45, x = 0)
- Ba lối: giữa to (rộng 4.4 theo `WALL.gate`), hai lối phụ nhỏ hơn. Mái 2 tầng, nên cao khoảng 9-10.
- Trục từ tam quan đi thẳng lên cầu cong, không lệch.
- Hai bên tam quan đặt tượng Hộ Pháp hoặc bảng giờ lễ, tránh chắn tầm nhìn người chơi mới vào.
- Quan hệ: nơi spawn của người chơi, vì vậy cần thấy ngay chính điện ở xa, tạo cảm giác "hành hương".

### 5.2. Hồ và cầu (z từ 14 đến 30)
- Hồ đã đặt ở giữa trục, cầu đi qua là phần hay nhất của bố cục hiện tại, giữ nguyên.
- Hai bồn hoa đối xứng giữ khoảng đệm giữa hồ và hai tháp.
- Có thể thêm **đình thủy tạ** nhỏ ở bờ phía Đông hồ, để người chơi ngồi ngắm cá.

### 5.3. Sân chùa / quảng trường (0, 6)
- Điểm tụ hội, nơi người chơi chat, lạy, thắp hương ngoài trời.
- Bán kính 8.4 đã đủ, không nên mở rộng để giữ cảm giác sân chùa gọn.
- Đường ngang z = 2 chia sân thành hai nửa: phía Bắc là khu thờ cúng, phía Nam là khu cảnh quan.

### 5.4. Lầu chuông và lầu trống (đối xứng quanh trục, z ≈ -6)
- **Hiện có**: tháp chuông ở (-34, -6), nằm khá xa trục.
- **Đề xuất**: thêm lầu trống ở (34, -6) đối xứng, hai lầu nằm hai bên sân, vừa đóng vai trò đối trọng thị giác vừa là điểm tương tác (gõ chuông, đánh trống).
- Gần trục hơn thì dùng x = ±22 thay vì ±34, nhưng điều đó chạm hành lang ở x = ±20.5.

### 5.5. Hành lang kết nối (x = ±20.5)
- Hành lang hiện có (z từ -19 đến -1) nối tiền đường với đường ngang.
- **Mở rộng**: kéo hành lang nối vòng quanh sân đài thiền và sang chuông-trống, thành khung bao quanh sân chính theo kiểu Bái Đính.
- Dọc hành lang đặt bia, tượng La Hán, lan can gỗ. Mái hành lang thấp hơn chính điện để không át công trình chính.

### 5.6. Chính điện (0, -32)
- Giữ nguyên, 8 cột, mái 3 tầng, cao 22.47.
- **Tiền đường** (đài thiền hai bên, `DECK`) là nơi người chơi đứng lạy trước khi vào điện.
- Phía sau chính điện nên có **hậu đường/nhà Tổ** để hoàn chỉnh chuỗi "tiền đường, chính điện, hậu đường" (kiểu chữ Công/chữ Đinh).

### 5.7. Nhà thiền và tăng xá (đề xuất, hai bên chính điện)
- Bên Tây: **thiền đường** lớn (đã có vườn thiền ở Tây Bắc, nên gom lại thành cụm).
- Bên Đông: **tăng xá/nhà khách**, nơi đặt NPC hoặc khu cửa hàng (shop) nếu muốn gắn với game.
- Đặt cách chính điện 6-8 m để không dính vào nhau, nhưng vẫn nối bằng hành lang.

### 5.8. Vườn thiền (-34, -26) và bảo tháp (38, -14)
- Vườn thiền ở Tây Bắc là khu yên tĩnh, phù hợp với ngồi thiền nhóm.
- Bảo tháp ở Đông Bắc cân đối với vườn thiền; thêm đường đá nối từ hành lang sang tháp.
- Phía sau (Bắc) giữ rừng cây dày để tạo "hậu chẩm" (núi tựa), che tường hậu.

## 6. Đề xuất mở rộng khuôn viên

Tường rào hiện rộng 94 × 90 m. Nếu cần mở rộng, thêm theo thứ tự ưu tiên:

| Ưu tiên | Hạng mục | Vị trí gợi ý | Ghi chú kỹ thuật |
|---|---|---|---|
| 1 | Lầu trống đối xứng chuông | (34, -6) | Dùng lại hàm dựng tháp chuông, đổi hình khối |
| 2 | Hậu đường/nhà Tổ | (0, -50), cần dời tường Bắc ra z = -62 | Dời `WALL.zN` |
| 3 | Hành lang bao sân | Vòng quanh PLAZA, x ±20.5 nối sang ±34 | Cập nhật `CORR` và `blocked()` |
| 4 | Thiền đường + tăng xá | (-30, -18) và (30, -26) | Thêm collider và cập nhật `blocked()` |
| 5 | Đình thủy tạ ven hồ | (14, 28) | Nằm trong vùng bồn hoa Đông |
| 6 | Khu vườn phụ phía Nam | Hai bên tam quan z từ 35 đến 44 | Cây, đá, lối đi nhỏ |

**Nếu mở rộng tường rào**: sửa `WALL` trong `src/layout.ts`, rồi kiểm tra `clampToCompound()`, `blocked()` và vùng sinh cây ngẫu nhiên ở `src/world.ts` để cây không mọc đè công trình mới.

## 7. Khoảng cách và tỷ lệ tham chiếu

| Quan hệ | Khoảng cách gợi ý (m) |
|---|---|
| Tam quan đến tâm hồ | 15-20 |
| Cầu cong đến quảng trường | 8-10 |
| Quảng trường đến chân chính điện | 12-15 |
| Chuông và trống cách trục | 22-34 |
| Công trình phụ cách chính điện | 6-10 |
| Bề rộng lối đi chính | 4-5 |
| Bề rộng hành lang | 3.8 (hiện tại) |

Chiều cao tương đối: chính điện cao nhất (≈22), bảo tháp gần ngang hoặc hơn, tam quan 9-10, chuông-trống 10-12, hành lang và tăng xá 5-6.

## 8. Luồng người chơi (gợi ý trải nghiệm)

1. Vào cổng nam, thấy tam quan rồi cầu cong qua hồ.
2. Qua cầu, đến quảng trường: thắp hương, chat, nhận nhiệm vụ.
3. Rẽ trái (Tây) đến chuông, vườn thiền; rẽ phải (Đông) đến Quan Âm, bảo tháp.
4. Đi thẳng vào chính điện: lạy Phật, tụng kinh.
5. Phía sau có nhà Tổ làm điểm dừng cuối (nơi đặt nhiệm vụ đặc biệt).

Tuyến này giống hành hương Chùa Hương (nhiều điểm dừng) nhưng gọn trong một khuôn viên.

## 9. Lưu ý khi triển khai

- Giữ trục x = 0 thông suốt: không đặt vật cản trên trục từ tam quan đến chính điện.
- Mọi công trình mới phải thêm vào `blocked()` và collider để người chơi không đi xuyên.
- Theo nguyên tắc "mọi thứ phải chạm nhau" của dự án: công trình nối với hành lang qua bậc thềm, không để hở.
- Mô hình mới nên dùng lại vật liệu `tileM`, `redM`, `goldM` để đồng bộ phong cách.
- Số liệu khoảng cách ở mục 7 chỉ là gợi ý; điều chỉnh sau khi xem trực tiếp trong game.
