# Rà soát hành động NPC, 2026-11-20

Base: `8fbaf9d` trên `origin/main`. 41 NPC, gồm cả `npc39` đến `npc42`; không có `npc35`. Gói sửa thang Ngọc đã có trên base. Không đổi tên, lời thoại, công trình hay nội dung nhiệm vụ.

## Cách đọc bằng chứng

`npx tsx tools/npc-day-audit.ts <thư-mục-kết-quả-đã-tồn-tại> [thư-mục-source] 78293` chạy `NpcRoom` thật từ 00:00 đến 24:00 ngày 19/11 theo giờ Việt Nam, 864.000 bước 100 ms, luôn có một người online. Chạy hai lần cùng seed, lần đầu dùng source của base. `trace.ndjson` ghi thời gian, tọa độ, mode, chặng, tour, ghế/giường, va chạm và chuyển trạng thái. `summary.json` tổng hợp theo NPC. `colliders.json` ghi hình học dùng khi kiểm tra. Chạy thêm các ca độc lập với seed 1, 7, 19, phòng ngủ/thức và mục tiêu nhiệm vụ được bảo vệ.

Không đếm dự báo đường đi thành sự cố đã xảy ra. Phân biệt tâm nhân vật lọt vào vật thể, chạm vùng đệm 0,4 m dành cho người chơi, và tiếp xúc đúng ghế/giường của mình. Nhiệm vụ và tư thế không được suy ra từ log tọa độ: kiểm tra riêng bằng client và Socket.IO local.

## Lỗi và cách sửa

| NPC | Bằng chứng trước sửa (giờ Việt Nam nếu không ghi khác) | Nguyên nhân và sửa chữa |
|---|---|---|
| `npc4`, Tiểu Đánh Chuông | Ngày seed 78293, hai hồi 05:00 và 12:00 chỉ rung 13 giây. Ở seed 7, 20:00:56,5 mới bắt đầu rung tại `(34,-6)`. | NPC vẫn có thể đi lang thang hoặc nhận ca nghỉ khi không còn đủ thời gian quay về. Cho quay về trước giờ, không nhận chuyến nghỉ nếu thiếu thời gian đi và về; giữ nguyên bốn khung giờ. |
| `npc27`, `npc28` | 22:00 seed 7, `npc27` ở `(-45,-27)` rồi đi tới `(-43,-27)` trong khi giữ cả hai đệm. `npc28` tương tự ở Điện Mẫu. Khi phòng hoạt động lại lúc 05:35 có thể vẫn tụng dù phiên kết thúc 05:20. | Khởi tạo đã giữ đệm nhưng tick đầu lại đi tìm đệm khác. Tụng trên đệm đã giữ; kết thúc phiên theo đồng hồ Việt Nam, không gia hạn phiên vì phòng tạm ngưng. |
| NPC có ghế tụng và `npc6` | `npc10` lúc 22:02:23 ở `(-3,316;-35,118)` thay vì đệm `(-3,4;-35,2)`. `npc6` lúc 22:06:47,5 ở `(37,416;33,078)` thay vì ghế `(37,4;33)`. | Khoảng dung sai kết thúc bước đi được dùng làm tọa độ ngồi. Khi đến nơi, đặt nhân vật đúng tâm đệm hoặc ghế mà nó đang giữ. |
| `npc1`, `npc29`, `npc37`, `npc28`, người tới đệm và khách rời hành lang | 00:48:13,1, `npc37` thắp hương trong bàn thờ Tam Thế tại `(1,248;-69,845)`. `npc28` ở `(37;10)` trùng phần tường Điện Mẫu. `npc29` 00:17:46 băng qua `(9,387;-41,571)` trên đường sang điện khác ngồi. | Đích thắp hương sâu quá 2,7 m; một số tọa độ đệm server khác đệm thật; có đường đi thẳng giữa hai điện. Đổi đích về phía trước bàn thờ, dùng tâm đệm thật, qua lối vào và ra thay vì nối thẳng hai đích. Không di chuyển đệm hay bàn thờ; đệm Điện Mẫu áp tường không được cấp cho NPC. |
| `npc6`, Sư Thầy Trực Ban | 00:00:08,5 đi tại `(38,152;29,993)` xuyên cột tường sau; 00:00:38,6 tại `(34,210;37,185)` cắt góc tường bên. Trong hai giờ đầu có 438,2 giây đi trong tường. | Vòng kiểm tra bàn và lối vào/ra ghế cũ sát tường. Đổi điểm vòng trong phòng và đi vào sau ghế. Không dịch ghế, bàn hoặc bỏ chuyến tuần. |
| 13 khách: `npc5`, `npc9`–`npc12`, `npc19`–`npc26` | Seed 7 lúc 22:14:21,5, `npc19` xuất hiện tại `(-2,848;-33,072)` sát `npc12` ở `(-3,4;-33,4)`. Lúc 22:42:18, sự kiện vào phòng báo đang tụng nhưng trường hoạt động rỗng. | Một nhánh chọn chỗ trong điện không xét khoảng cách; gói vào phòng mang nhãn cũ. Chọn điểm trống sau khi những NPC khác đã di chuyển xong tick, rồi tính lại hoạt động trước khi phát sự kiện. Vẫn rời chùa và quay lại sau tour. |
| Khách nghỉ Nhà Khách; `npc2`, `npc3`, `npc4`, `npc7`, `npc8` nghỉ Tăng xá | Seed 1, `npc20` 22:08:48 nằm tại `(-50;-59,1)` nhưng bắt đầu đường ra của giường khác. Ba ngày kiểm tra thấy 1.181 lần đi thẳng vào tâm giường khách và 589 lần giường tăng được nhả trước khi người nằm bước khỏi đó. | Dùng điểm đứng bên cạnh giường thật, giữ ID tới sau khi ra khỏi giường và nhả đúng chỗ. Khách đã có người cần gặp được đánh thức; không xóa ca nghỉ của tăng. Không tái hiện hai NPC sở hữu đồng thời cùng một giường. |
| Khách tham quan Ngọc, gồm `npc19` | Seed 1, `npc22` 22:04:09 tại `(0;-119,96)` chuyển từ đến đỉnh sang chờ, bỏ qua thắp hương. 1.112 lượt trước sửa đều bỏ qua. | Điều kiện chờ che mất nhánh thắp hương. Sửa thứ tự các pha. Không sửa trùng lỗi leo thang cũ; bài thử hành trình riêng qua đủ mốc trong 104/104 tour. |
| Khách và người đi lang thang, gồm `npc19` | 00:07:11,3, `npc19` thực sự đi vào vật thể tại `(-68,532;-15,220)` trên đường đình sen. Seed 7 lúc 22:12:06 đi từ `(15,9;25,7)` đến `(0;26,5)` cắt vật ven hồ. | Cạnh thẳng và đoạn nối vào đồ thị đường không phản ánh gờ hồ, trụ, luống và lối ven sông. Dùng điểm trung gian đã đo cho NPC, vẫn dùng đồ thị chung để chọn hành trình và không đổi đường của người chơi. |
| `npc7`, Tiểu Quét Vườn | 22:02:10,25, chặng từ `(-37,370;-27,229)` đến `(-34,195;-25,568)` cắt khu đá/cát. Sau tụng, đường ra từ đệm Chính Điện có thể cắt bàn thờ. | Chọn làn quét đi được quanh vườn, rời đệm qua lối vào điện. Trong client, việc `nq_sweep_zen` đạt `0 → 1 → 2 → 3` với các điểm gốc. |
| `npc2`, `npc3`, `npc8`; khách quay lại và người đi ngang khu nghỉ | `npc2` quét qua gờ sân tại `(5,664;2,681)`. `npc3` đi sát gờ hồ. `npc8` lúc 10:37:13,1 cắt góc Nhà Khách tại `(-41,926;-57,125)`. `npc5` 13:44:21,4 ở trong bàn khu nghỉ `(-33,6;33)`; `npc19` 09:00:48,2 xuất hiện trong vách tịnh thất tại `(-80,171;-73,197)`. | Điều chỉnh dải quét và lối vào đường, vòng đầu bàn và kiểm tra chỗ trống khi đặt khách ở Đền Trình, rừng trúc, tịnh thất và trước điện. Không bỏ các đích tham quan. |
| `npc39`, Sư Cô Trông Điện Dược Sư | 00:01:37,4 tại `(93,264;-33,022)`, tâm NPC nằm trong cột góc điện. | Đường nối chéo hai mặt điện cắt góc nhà. Thêm điểm rẽ ngoài hai góc; giữ đủ vòng tuần và lượt vào điện. |
| `npc40`, Tiểu Trồng Rau | 00:00:42,3 tại `(-72,057;-41,724)`, tâm NPC đi xuyên thành luống. | Lối lấy nước cũ chạy dọc luống thay vì giữa hai đầu luống. Đi hành lang giữa luống và qua cổng vườn; giữ công việc múc nước, tưới, quét và chuyến đi đồi hoa, bờ sen. Thu hoạch trong định nghĩa nhiệm vụ là việc của người chơi; không thêm hành vi thu hoạch mới vào NPC. |
| `npc42`, Cô Trông Đình Sen; khách ghé bờ sen | Spawn ở `(-70;5,5)`, còn đình trên bản đồ ở `(-70;-13)`. Vòng quét hoàn tất trên đất đi được nhưng sai nơi, cách đình 18,06–22,47 m. Khách ghé bờ dùng điểm cũ `(-78;2)`. | Lấy điểm đứng và điểm tuần từ tọa độ đình thật, còn chặng bờ sen của khách dùng bến `(-78;-14,5)`. Sau sửa, `npc42` tuần trong bán kính 1,42 m và không chạm cột; không dịch đình. |
| NPC đi bộ, quét, lạy, chắp tay, ngồi ghế; `npc37`, `npc39`, `npc40`, `npc41`, `npc7`, `npc19` có ảnh tư thế | `npc37` chắp tay nhưng hai tâm bàn tay cách nhau 29,2 cm thay vì 21,3 cm để chạm nhau, gậy vẫn hiện; ghế lệch theo tỉ lệ nhân vật khoảng 9,3 cm. Giày `npc19` chìm 7,5 cm ở pha đứng dậy sau lạy; chổi `npc7` lệch khỏi tay. | Hiệu chỉnh riêng tư thế NPC: điểm chắp tay/cầm cán, thời điểm hiện gậy, cao độ chân khi bước hoặc đứng dậy, chiều cao ngồi theo tỉ lệ. Không đổi nhân vật người chơi. Tư thế ngủ nằm của `npc20` được xác minh, không sửa. |
| Dẫn việc cho thú ăn của `npc14`; người giao/nhận đang ngủ hoặc đã rời phòng | Client baseline, 18:36:49 UTC: người chơi ở `(-6,95;-19,47)`, tracker tắt ngay trước khi bấm cho chó ăn, thú đi xa và nút biến mất. | Bộ dẫn coi đến gần thú là kết thúc, dù bước `feed` chưa xong. Giữ theo dõi tới thao tác cho ăn. Đồng bộ tư thế server cho logic tương tác và không dẫn tới NPC đang nằm; khi đích không có, dừng an toàn và báo cho người chơi. Client sau sửa: nút thật đưa việc từ `1/2` lên `2/2`; khi phát lại trạng thái ngủ của người giao, tracker tắt và có thông báo. |

## Kiểm tra riêng

- **Đối thoại:** 41/41 nút mở đúng tên và có lời thoại không rỗng, kiểm tra qua client local; `npc15` được kiểm tra thêm bằng thao tác chuột. Không đổi `src/data/dialogues.ts`.
- **Lịch:** kiểm tra 05:00, 12:00, 18:00, 20:00 và ba phiên tụng. Không tính thời gian đang đi từ chỗ làm đến đệm là thời gian ngồi tụng.
- **Hiện diện:** chỉ kết luận khách trở lại trễ nếu đã quá hạn quay lại theo đồng hồ mô phỏng. Khách rời chùa sát nửa đêm và còn thời hạn sang ngày tiếp theo không phải mất vĩnh viễn.
- **Hình ảnh:** ảnh khu vực và ảnh NPC đang vận hành khác với ảnh tư thế đặt ở cùng một pha để so sánh. Ảnh tư thế không chứng minh lịch làm việc, việc giữ giường, hoặc chân nào đang chuyển động theo thời gian.
- **Số NPC đã sửa:** 33 ID có bằng chứng lỗi được khắc phục: `npc1`–`npc14`, `npc18`–`npc31`, `npc37`, `npc39`–`npc42`. Một người bị nhiều lỗi chỉ tính một lần. Tám ID còn lại vẫn được kiểm tra; không tính thêm chỉ vì dùng chung mã.
- **17 người có vị trí trực:** `npc13` (Điện Mẫu), `npc14` (Trai Đường), `npc15`–`npc18` và `npc30`–`npc34`, `npc36` (quầy), `npc38` (vườn cây), `npc39`–`npc42` (bốn vòng việc). Kiểm tra vị trí trong ca trực riêng với lúc được chọn đi tụng. Không chuyển nhà hoặc quầy. Trong ngày mô phỏng không có người chơi đi lại trong lối, nên không dùng số liệu này để kết luận người chơi không bao giờ bị che đường.
- **Bản production:** đã vào phòng Chùa Vô Lượng trên Chrome với bản `dist` (một người online, không có `__co`, không lỗi console). Kiểm tra từng nhân vật và pha hoạt ảnh dùng client local có công cụ điều khiển camera.
- **Ảnh trước/sau:** [41 NPC, phần 1](../shots/npc-audit-2026-11-20/01-roster-1.jpg), [phần 2](../shots/npc-audit-2026-11-20/01-roster-2.jpg), [phần 3](../shots/npc-audit-2026-11-20/01-roster-3.jpg), [10 tư thế cùng pha](../shots/npc-audit-2026-11-20/02-matched-poses.jpg), [bàn trực và đình sen](../shots/npc-audit-2026-11-20/03-final-locations.jpg). Ảnh PNG riêng và 21 cặp ảnh khu vực trên máy kiểm thử nằm trong `%TEMP%\kilo\npc-visual-qa`.

## Ca còn lại

- **`npc11`, Cô Gái Trẻ:** seed 78293, 20:55:39,9, đang đi tại `(30,977;-29,423)` về bến Phóng Sinh `(30;-31)`, chạm trụ tâm `(30,8;-29,5)`, bán kính 0,2 m.
- **`npc19`, Học sinh nam:** cùng seed, 01:03:36,3, xuất hiện ở `(-62,629;-71,177)` trong collider tâm `(-62,5;-71,5)` cạnh Tăng xá. Có 14 tick chờ và 2 tick đi trong vật. Đây không phải lỗi thang Ngọc.
- **`npc12`, Bác Nông Dân:** seed 7, 12:25:52, đang đi tại `(-46,414;24,283)` về vườn cây `(-48;24,5)`, chạm vật tâm `(-46,3;23,8)`, bán kính 0,5 m.

Các ca xảy ra lúc đặt khách hoặc nối vị trí xuất phát vào đường. Chưa có một cách sửa đoạn nối được kiểm chứng cho cả hai seed mà không đẩy khách vào một vật khác. Giữ nguyên trong số liệu, không bỏ lượt khách, xóa điểm ghé hay coi vật cản là ghế. Các proxy cục bộ không thay cho toàn bộ hình học dựng ở client.

## Kết quả đối chiếu cuối

| Chỉ số, cùng seed 78293 và 24 giờ | Base | Bản sửa |
|---|---:|---:|
| NPC đang phải đi nhưng đứng yên hơn 10 phút | 0 | 0 |
| NPC có tâm trong lõi vật cản không phải ghế/giường | 28 | 2 |
| Số đợt lọt lõi vật cản, mọi trạng thái | 16.813 | 2 |
| Số mẫu NPC trong lõi vật cản (100 ms/mẫu) | 1.082.167 | 19 |
| Mẫu NPC ở trong nước hoặc ngoài biên | 0 | 0 |
| Hai NPC giữ cùng chỗ | 0 | 0 |
| Tick phòng có chỗ bị giữ mà không có chủ tương ứng | 5.570 | 0 |
| Mẫu ngồi lệch tâm ghế/đệm được cấp hơn 1 mm | 2.091.631 | 0 |
| Khách rời chùa / quay lại trong cửa sổ đo | 1.046 / 1.044 | 1.037 / 1.037 |
| Khách quá hạn quay lại | 0 | 0 |
| Thời gian đánh chuông 05h / 12h / 18h / 20h (giây) | 13 / 13 / 60 / 60 | 60 / 60 / 60 / 60 |
| Vòng việc hoàn tất của `npc39 / npc40 / npc41 / npc42` | 279 / 69 / 671 / 734 | 267 / 69 / 671 / 1.116 |

Đợt được tính từ khi một NPC bắt đầu chạm lõi, không cộng nhiều lần nếu đồng thời chạm nhiều collider. `19` mẫu là tổng 1,9 giây-NPC, không phải 19 vị trí duy nhất. Tách riêng tiếp xúc ghế không còn giữ lúc đứng dậy, tường sát đầu giường Tăng xá và vùng đệm 0,4 m của người chơi (bản cuối có 428.676 mẫu `blocking:padding`). Không coi những nhóm này là bằng chứng không va chạm. Mô phỏng không đo xuyên mái bằng hình học toàn bộ mesh; trong ngày này NPC không gửi cao độ khác với mặt nền do client tính.

Chạy `node tools/npc-day-classify.mjs <thư-mục-kết-quả>` sau harness để tái tạo `classification.json`, gồm tọa độ, trạng thái và collider đầu tiên của từng nhóm cho từng NPC. Trên máy nghiệm thu, dữ liệu trước và sau nằm tại `%TEMP%\kilo\npc-audit-definitive-base` và `%TEMP%\kilo\npc-audit-frozen-final`. `revision.json` cho phép đối chiếu mã nguồn lúc bắt đầu và kết thúc. **Chưa đạt tiêu chí 0 vị trí không đi được.**
