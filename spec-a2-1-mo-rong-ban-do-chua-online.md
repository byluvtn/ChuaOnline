# SPEC A2.1 — MỞ RỘNG BẢN ĐỒ: TƯỜNG MỚI, HAI VIỆN, DI DỜI NHÀ, VƯỜN PHÓNG SINH, PHỐ TRƯỚC CỔNG, MẠNG ĐƯỜNG

> Giao cho Kilo Code (Antigravity), repo `chuaonline`, baseline `main` @ `dfc0fcd`.
> **1 spec = 1 session.** Đây là gói nền của Phần A2 — chỉ làm mặt bằng, vỏ nhà, đường đi.
> Nội thất (A2.3), trị đơ/merge (A2.2), Điện Tam Thế (A2.4), NPC (A2.5) KHÔNG thuộc gói này.
> Tài liệu gốc phải đọc trước: `phan-a2/phan-a2-mo-rong-chua-online.md` + bản đồ v7 trong cùng thư mục.
> Trục thiêng giữ nguyên tuyệt đối: tam quan (0,45) → hồ (0,22) → sân (0,6) → chính điện (0,−32) → đất Tam Thế (0,−54).
> Không đổi vị trí: tháp chuông (−34,−6), gác trống (34,−6), hai sân tượng (±28,14), đền trình (11,39),
> vườn cột kinh, điện mẫu (39,10), khu nghỉ (27,31), bảo tháp (−17,−52), vườn thiền (−34,−26), thủy đình, hồ, cầu.

## 1. `src/layout.ts` — hằng số

Đổi:
- `WALL = { x: 62, zN: -82, zS: 45, gate: 4.4 }` (cũ 47/−64).
- `CORR.half: 1.9 → 2.6` (hành lang rộng 5.2).
- `PAGODA = { x: 34, z: -15 }` (cũ (38,−14) — thẳng cột x=34 với gác trống).
- `NHA_KHACH = (-47,-61)`, PLAT hx 6.0, hz 4.25, y 0.25 (nhà 12×8.5).
- `TANG_XA = (-41,-71)`, PLAT hx 7.5, hz 4.0, y 0.25 (nhà gộp 15×8).
- `TRAI_DUONG = (-29,-61)`, PLAT hx 6.0, hz 3.75, y 0.25 (nhà 12×7.5) — trai đường từ nay là nhà
  trong Viện Khách Tăng, xây bằng pattern nhà thường (xem mục 4), KHÔNG còn là longHouse.
- `NHA_TO = (36,-68)`, PLAT hx 6.0, hz 4.25, y 0.3.
- `AM_CO = (53,-75)`, PLAT hx 3.25, hz 2.75, y 0.35 (6.5×5.5).
- `VUON_THAP = (49,-63)`, PLAT hx 7.0, hz 5.0, y 0.2 (~14×10).
- `THIEN_DUONG = (-47,-27)`, PLAT (hướng thế giới) hx 6.5, hz 4.5, y 0.25 — nhà 9×13, mặt tiền hướng ĐÔNG (mục 4).

Thêm:
- `PHONG_CD = { x: -42, z: 35 }`, `PHONG_CD_PLAT = { hx: 6.5, hz: 4.5, y: 0.25, ramp: 0.8 }` (13×9).
- `VIEN_KT = { x0: -58, x1: -22, z0: -80, z1: -54, gateX: -30 }` (Viện Khách Tăng).
- `VIEN_TO = { x0: 24, x1: 58, z0: -80, z1: -54, gateX: 30 }` (Viện Tổ).
- `PS = { x: 41, z: -31, w: 30, d: 22 }` (Vườn Phóng Sinh), `PS_POND = { x: 41, z: -31, a: 7.5, b: 5.5 }` (ao 15×11),
  `PS_PIER = { x0: 25.5, x1: 34, z: -31, hw: 1.5, y: 0.35, ramp: 1.3 }` (bến thả cá bờ Tây của ao, công thức mặt sàn như `PIER`).

Xóa hẳn (sau khi grep xác nhận không còn nơi nào dùng — kể cả `server/`):
- `TANG_XA_TAY`, `TANG_XA_TAY_PLAT`, `TANG_XA_TAY_DOOR`, `TRAI_DUONG_PLAT` cũ được thay bằng PLAT mới ở trên,
  `TRAI_DUONG_DOOR`. (NPC server chỉ import BELL/BRIDGE/yards/HALL/PLAZA/QUAN/WALL/ZEN + clamp/inLake — đã kiểm —
  nhưng vẫn phải grep lại toàn repo trước khi xóa.)

`groundY()`: danh sách nền nhà thay `TANG_XA_TAY_PLAT` bằng `TRAI_DUONG_PLAT` (mới) và thêm `PHONG_CD_PLAT`;
thêm một hạng cho `PS_PIER` (ramp từ x0 như `PIER`).

`blocked()` (chặn cây/hoa rải):
- XÓA: dải đất tây cũ `x < -37.5 && z > -21.5 && z < 3.5` và hai dải cửa `TANG_XA_TAY_DOOR`/`TRAI_DUONG_DOOR`
  (đất này thành vườn tre — cho rải lại).
- THÊM: hai hình viện `VIEN_KT`/`VIEN_TO` (nới 1 đơn vị mỗi phía); elip ao phóng sinh `PS_POND` (nới 1);
  dải bến `PS_PIER`; dải phố trước cổng `|x| < 63 && z > 44 && z < 59.5`; các dải đường mới ở mục 8
  (đường hậu, vành đai, cổng viện) — đường nhánh nhỏ đi qua `pathRect` thì cộng dải tương ứng nếu chưa có vùng chặn phủ.
- Các mục theo hằng số (nhà, tháp…) tự đi theo vị trí mới — không sửa tay từng mục đó.

`clampToCompound()` — mở đường ra phố, sửa luôn lỗi xuyên tường ở cổng:
- Giữ nguyên kẹp Bắc/Tây/Đông theo `WALL` mới.
- Vùng ngoài tường Nam: người chơi được đi trong dải phố `|x| ≤ WALL.x - 0.8`, `z ≤ WALL.zS + 13` (tới 58).
- Hành lang cổng (`|x| ≤ WALL.gate`) là lối duy nhất qua tường: khi KHÔNG ở hành lang cổng mà `z` lọt vào
  dải `WALL.zS - 0.8 .. WALL.zS + 0.8` thì đẩy `z` về mép gần nhất (trong → `zS - 0.8`, ngoài → `zS + 0.8`).
  Cách này chặn cả hai chiều xuyên tường mà không cần biết hướng đi. NPC dùng chung hàm này và không ra phố — không ảnh hưởng.

`resolveWater()`: thêm ao phóng sinh — ở trong elip `PS_POND` mà không đứng trên bến `PS_PIER` thì đẩy ra
bờ theo cùng công thức elip như hồ chính.

`MAP_HALF` (68, `shared/types.ts`): **giữ nguyên, không đụng** — mật độ rải cây/hoa ngoài khuôn viên không đổi;
hai viện nằm ngoài tầm rải là đúng ý (sân viện là sân lát, không rải).

## 2. Tường bao + tam quan (temple.ts)

`wallSeg` và cổng đã suy theo `WALL` — không sửa code, chỉ kiểm chứng bằng ảnh: tường Bắc ở −82,
tường Đông/Tây ở ±62, cổng Nam giữ nguyên. Chiều dài sân lát `paveCompound` cũng tự theo `WALL`.

## 3. Hành lang La Hán (temple.ts)

- Sàn hành lang tự theo `CORR.half` (2.6). Cột: hai hàng cột đang cứng ở lệch ±1.7 → đổi thành
  ±(CORR.half − 0.2) = ±2.4 (cột đi theo mép sàn mới; collider cột giữ r 0.22, tự theo vị trí mới).
- Xà ngang giữ; hai tấm mái dốc: nới theo bề rộng mới (tấm rộng ~3.4, lệch ±1.55) sao cho mái phủ hết
  sàn 5.2 + nhô mép như cũ. Đèn lồng lệch ±1.15 → ±1.5. Bảng chữ ở đầu hành lang giữ nguyên công thức.
- Ghế đá: vẫn hàng trong, lệch −side × 1.55 (sát hàng cột trong mới), giữ các z hiện tại. Collider ghế: A2.2 lo — gói này không thêm.
- **Tượng La Hán: còn 6 tượng/bên**, toàn bộ chuyển ra **bệ đá ngoài hành lang**: thêm một dải bệ thấp
  (cao 0.12 như sàn hành lang, vật liệu như sàn) dọc |x| = CORR.x + CORR.half + 0.55 ≈ 23.65, z từ −19 tới −1.
  Tượng đặt trên bệ đó tại z = −17.5 + 3k (k = 0..5: −17.5, −14.5, −11.5, −8.5, −5.5, −2.5), quay mặt vào trục như cũ,
  bệ tượng + collider r 0.42 giữ như cũ, biến thể tượng quay vòng 3 mẫu như cũ. Bỏ hẳn cơ chế trong/ngoài `ARHAT_INNER`.
  (Đặt ngoài sàn để tượng không ăn vào lối đi 5.2 và không chạm hàng cột ngoài ở ±2.4.)

## 4. Các nhà — di dời, gộp, xây mới (temple.ts)

Quy ước đã kiểm chứng trong code: nhà xây bằng `buildHouse`/`extraHouse` với `wide = PLAT.hx − 1.4`,
`deep = PLAT.hz − 1.0`; collider + zone suy theo các tham số đó nên tự đi theo. Mặt tiền mặc định hướng Nam (+z).

| Nhà | Cách làm | Vị trí mới | PLAT (hx×hz) | wide × deep |
|---|---|---|---|---|
| Nhà khách | `extraHouse` như cũ, đổi hằng số | (−47,−61) | 6.0×4.25 | 4.6 × 3.25 |
| Tăng xá (gộp) | block `buildHouse` 'tang-xa' như cũ, đổi hằng số; **xóa** lời gọi `longHouse('tang-xa-tay', …)` | (−41,−71) | 7.5×4.0 | 6.1 × 3.0 |
| Trai đường | **xóa** `longHouse('trai-duong', …)`; dựng lại bằng `extraHouse('trai-duong', …, 'TRAI ĐƯỜNG', 'traiDuong', …, true)` | (−29,−61) | 6.0×3.75 | 4.6 × 2.75 |
| Nhà tổ | block `buildHouse` 'nha-to' như cũ, đổi hằng số | (36,−68) | 6.0×4.25 | 4.6 × 3.25 |
| Am cổ | builder riêng như cũ, đổi hằng số (nó tự suy theo PLAT) | (53,−75) | 3.25×2.75 | — |
| Vườn tháp | builder như cũ, đổi hằng số; rải lại các tháp con trong nền 14×10 (giữ số lượng + collider từng tháp) | (49,−63) | 7.0×5.0 | — |
| Thiền đường | `extraHouse` nhưng **xoay mặt tiền ra hướng Đông** (xem dưới) | (−47,−27) | 6.5×4.5 (thế giới) | façade 9, sâu 13 |
| Phòng Ghi Công Đức | `extraHouse('phong-cong-duc', PHONG_CD, PHONG_CD_PLAT, 'PHÒNG GHI CÔNG ĐỨC', 'phongCongDuc', 5.1, 3.5, true)` | (−42,35) | 6.5×4.5 | 5.1 × 3.5 |

- Zone: giữ id cũ cho mọi nhà dời (`nhaKhach`, `tangXa`, `traiDuong`, `nhaTo`, `amCo`, `vuonThap`, `thienDuong`)
  để popup câu đối chạy tiếp; zone `tangXaTay` biến mất cùng longHouse (mục dữ liệu trong `couplets.ts` giữ nguyên, không xóa).
  Phòng công đức có zone `phongCongDuc` (chưa có câu đối popup là bình thường — A2.3 bổ sung sau).
- **Thiền đường hướng Đông:** cơ chế tùy Kilo (xoay group `ry = ±π/2` rồi hoán đổi vai trò hx/hz khi tính
  collider, hoặc tham số hướng cho builder) nhưng kết quả bắt buộc: biển "THIỀN ĐƯỜNG" + hai bảng câu đối
  ở mặt ĐÔNG (nhìn từ chính điện thấy mặt tiền), mặt tiền thoáng vào được từ phía Đông, collider nằm đúng
  trên cột/tường thật (tường hậu thành phía Tây), nền `groundY` theo PLAT thế giới ở `layout.ts`.
  Ghế ngồi thiền trong thiền đường: gói này KHÔNG thêm (hiện tại nhà trống, A2.3 làm nội thất + ghế `seats`).
- Tháp nhỏ (PAGODA): builder đặt theo hằng số — tự dời theo; 5 khoảng hở mái của nó thuộc A2.2, không xử lý ở đây.

## 5. Hàng rào hai viện + cổng viện (temple.ts)

Mỗi viện một hàng rào khép kín theo hình `VIEN_KT`/`VIEN_TO`, chừa **cổng rộng 3.2 ở mặt Nam tại `gateX`**
(KT: (−30,−54), Tổ: (30,−54)):
- Rào: cột gỗ/đá thấp cách nhau ~1.1 + hai thanh ngang, cao tổng ~1.1 — dùng InstancedMesh hoặc merge
  (không thêm hàng trăm mesh lẻ). Cột rào đứng theo `groundY` tại chỗ (đoạn gần nền Bảo Tháp phải bám nền).
- Người chơi KHÔNG xuyên qua rào: collider tròn r 0.6 đặt dọc tuyến rào, cách nhau ≤1.1 (hai đầu cổng cũng có collider của trụ cổng).
- Trụ cổng: 2 trụ đá/gỗ cao ~2.2 hai bên cổng + biển treo trên cổng: "VIỆN KHÁCH TĂNG" / "VIỆN TỔ"
  (dùng lại cơ chế `signTexture`/`labelBoard` của nhà).
- Mặt Bắc của viện (z = −80) cách tường bao (−82) 2 đơn vị: cứ dựng rào đủ 4 mặt trừ cổng.

## 6. Vườn Phóng Sinh (temple.ts + layout.ts)

Ô đất (41,−31) cỡ 30×22 (x 26..56, z −42..−20), lối vào từ đầu Nam hành lang Đông:
- Mặt vườn: một mặt cỏ phẳng 30×22 ở y 0.02 (trên sân lát, dưới các `pathRect` 0.028) + hàng cây hàng rào
  (hedge như vườn thiền, không collider) dọc 4 mép, chừa cửa vào phía Tây và lối dạo bờ Nam ao.
- Ao 15×11 giữa vườn: elip nước (vật liệu nước như hồ chính, không koi) lõm nhẹ, viền đá quanh bờ.
- Bến thả cá: sàn gỗ từ mép Tây vườn (x 25.5) tới qua bờ ao (x 34) theo `PS_PIER` (cao 0.35, có ramp ở đầu Tây,
  trụ + lan can thấp hai bên như thủy đình thu nhỏ); mặt sàn đi được qua `groundY`; không rơi xuống ao nhờ `resolveWater`.
- Trồng sẵn 3–4 cây bóng mát ở các góc vườn (có collider thân cây như cây thường) — cây/hoa rải tự do bị chặn
  ở ao + bến + đường, phần cỏ còn lại CHO rải hoa.
- Zone: `zones.push({ x: 41, z: -31, r: 13, id: 'vuonPhongSinh' })`.
- Cơ chế mua/thả chim cá: KHÔNG thuộc gói này — chỉ dựng cảnh.

## 7. Phố trước cổng (temple.ts)

Dải đất ngoài tường Nam, z 45..58, chạy hết chiều ngang tường mới — chỉ dựng cảnh (cơ chế mua bán là spec riêng sau):

- Mặt phố lát phẳng như sân trong: `pathRect(-62, 45, 62, 58)` (sân cổng + mặt đường một dải).
- **6 sạp** quay mặt về cổng (hướng Bắc), tâm z = 54.5, tại x = −42, −26, −10, +10, +26, +42.
  Tên theo thứ tự Tây → Đông: `CƠM CHAY`, `TRÀ ĐÁ`, `BÁN CHIM PHÓNG SINH`, `PHỞ CHAY`, `TRÀ ĐÁ`, `BÁN CÁ PHÓNG SINH`.
  Chừa trống trục cổng |x| < 6.
- Một helper dựng sạp dùng chung: 4 trụ gỗ góc, quầy phía trước (phía Bắc), mái che dốc trên cao ~2.6,
  biển tên bằng `signTexture` treo mặt trước mái. Props tượng trưng theo loại hàng (chỉ trang trí):
  cơm chay/phở — nồi + chồng bát; trà đá — ấm + cốc trên quầy; bán chim — 2–3 lồng (khung nan mảnh + cục chim nhỏ bên trong);
  bán cá — bể kính (hộp trong suốt + nước xanh bên trong).
- Collider: một hàng vòng r 0.5 cách ~1.0 dọc mép quầy trước mỗi sạp + trụ góc r 0.35 —
  người chơi không đi xuyên qua quầy; đi vòng sau sạp (ra tới mép clamp 58) thì được.
- Không NPC bán hàng, không mua bán, không zone ở gói này.

## 8. Mạng đường (temple.ts — dùng `pathRect` sẵn có)

XÓA các `pathRect` sau (nhà đã dời / đất đã đổi công năng):
- Đường dài từ `NHA_TO` và `TANG_XA` (vị trí cũ) về `PATH_Z`; đường từ `VUON_THAP` cũ về `PATH_Z`.
- Hai đường vào am cổ cũ (`AM_CO.x + hx → -SIDE_X` và đoạn dọc `-SIDE_X` từ `AM_CO.z` tới `ZEN.z`).
- Hai đường cửa `TANG_XA_TAY_DOOR` / `TRAI_DUONG_DOOR`.

GIỮ nguyên: trục quảng trường → cầu → cổng, đường ngang z=2, đường dọc hai sân tượng, đường tháp chuông/gác
trống, đường đền trình, đường khu nghỉ, đường dọc vườn thiền (kéo dài z0 từ `ZEN.z` xuống −28.5 để nối đường thiền đường).

THÊM (tọa độ `pathRect(x0, z0, x1, z1)`, bề rộng mặc định của helper là 2.4):
1. **Đường hậu** z=−46: `pathRect(-56, -47.5, 56, -44.5)`.
2. **Vành đai**: Tây `pathRect(-60.3, -78, -57.7, 41)`; Đông `pathRect(57.7, -78, 60.3, 41)`; Nam `pathRect(-58, 39.8, 58, 42.2)`.
3. **Trục nối Tam Thế**: `pathRect(-1.4, -50, 1.4, -42)` (nối nền chính điện ra đường hậu, dừng ở đất Tam Thế).
4. **Cổng viện**: KT `pathRect(-31.2, -54, -28.8, -44.5)`; Tổ `pathRect(28.8, -54, 31.2, -44.5)` (từ đường hậu vào cổng viện).
5. **Bảo tháp**: `pathRect(-18.2, -47.5, -15.8, -44.8)` (đường hậu → bậc Nam của nền tháp).
6. **Thiền đường**: `pathRect(-40.5, -28.2, -28, -25.8)` (đường dọc Tây → cửa Đông của thiền đường, z=−27).
7. **Điện mẫu**: `pathRect(28, 8.8, 35, 11.2)` (đường dọc Đông → cửa điện mẫu).
8. **Vườn phóng sinh**: `pathRect(19.8, -31, 22.2, -19)` (từ đầu Nam hành lang Đông đi xuống) +
   `pathRect(19.8, -32.2, 25.5, -29.8)` (rẽ Đông vào bến) + lối dạo bờ Đông/Nam ao:
   `pathRect(48.8, -31, 50.2, -23.4)` và `pathRect(33, -24.8, 50.2, -23.4)`.
9. **Phòng công đức**: `pathRect(-43.2, 39.5, -40.8, 42.2)` (vành đai Nam → cửa phòng).
10. **Trong hai viện** (đường nội bộ): nguyên tắc nghiệm thu — từ cổng viện đi theo đường lát tới được
    cửa TỪNG nhà mà không cắt qua nhà/rào. Gợi ý tuyến: KT — xương sống z=−58 từ x −48 tới −27,
    rẽ Bắc tại x=−41 lên cửa tăng xá (−41,−67); Tổ — xương sống z=−58 từ x 27 tới 50, rẽ Bắc tại x=36
    lên cửa nhà tổ (36,−63.75), tuyến dọc mép Nam vườn tháp tới am cổ (cửa am cổ theo đúng phía cửa
    của builder hiện tại). Kilo được lệch tọa độ nhỏ cho khớp cửa thật, nhưng phải liệt kê các
    `pathRect` nội bộ đã vẽ trong báo cáo.

## 9. Đất Tây cũ thành vườn tre + dọn vườn thiền (compound.ts / temple.ts)

- Đất hai longHouse cũ (x ≈ −46..−39, z −21..4): trồng **rặng tre mở rộng** — tái dùng `clump` tre của
  vườn thiền (đưa `clump` thành hàm dùng chung hoặc sao chép tối thiểu): 2–3 hàng cụm tre dọc x ≈ −44..−40,
  z từ −20 tới 3, mỗi cụm có collider r 0.4 như tre vườn thiền. Đất còn lại để cỏ + rải tự nhiên (đã mở `blocked()` ở mục 1).
- Vườn thiền — dọn cho thiền đường mới (nền x −53.5..−40.5, z −31.5..−22.5):
  - Hàng tre phía Tây của vườn thiền (x≈−44) hiện chạy z −38.3..−23 → **cắt ngắn, chỉ giữ z ≤ −33**
    (phần z −31..−23 nằm trong nền thiền đường; collider của các cụm bị xóa cũng phải mất theo).
  - Ghế đá ở (−41,−27.5) nằm trong nền thiền đường → dời tới (−38.5,−20.5) trong vườn (hoặc điểm trống
    gần nhất ở góc Đông–Nam vườn; nếu đổi chỗ khác phải báo cáo tọa độ mới).

## 10. Bản đồ trong game (`src/features/map.ts`)

- Khung bản đồ riêng (không dùng `MAP_HALF` nữa): x −66..66, z −88..64 — vẽ vừa canvas vuông, Bắc vẫn ở trên.
- `PLACES`: các điểm theo hằng số tự đi theo (Nhà Tổ, Tăng xá, Am Cổ, Vườn Tháp, Tháp cảnh…).
  Đổi điểm đến của các nhà trong viện thành **điểm trước cửa** (đừng để `goTo` dắt người chơi đâm vào rào):
  Nhà khách (−47,−55.5), Tăng xá (−41,−65.5), Trai đường (−29,−55.5), Nhà Tổ (36,−62.5), Am Cổ (50,−72).
  Thêm: Thiền đường (−39.5,−27) "Thiền đường", Phòng Ghi Công Đức (−42,41.5), Vườn Phóng Sinh (28,−31) (điểm bến),
  Điện Mẫu (39,10), Đền Trình (11,39). Xóa điểm nào trùng/thừa thì báo cáo.
- Vẽ lại `drawStatic` theo mặt bằng mới: hai hình viện (nét rào), vườn phóng sinh + elip ao, dải phố
  trước cổng (z 45..58), thiền đường theo kích thước thế giới (sâu 13 theo x, rộng 9 theo z), các nhà
  mới theo `*_PLAT`, đường ngang z=2 vẽ tới ±58, trục chính kéo lên đất Tam Thế (0,−54), hành lang theo `CORR` mới (tự động).

## 11. Tin tức "Có gì mới" (bắt buộc — luật phát hành)

Thêm vào `src/data/news.ts`, `LATEST_NEWS_ID` 5 → 6:

- title: `Mở rộng khuôn viên chùa`
- date: ngày làm (định dạng như các mục cũ)
- lines:
  - `Khuôn viên chùa rộng thêm hẳn: phía sau có Viện Khách Tăng và Viện Tổ — Tưởng niệm, mỗi viện một sân riêng có cổng.`
  - `Mới có Vườn Phóng Sinh ở phía Đông chánh điện với ao và bến thả cá, phố nhỏ trước cổng chùa bán cơm chay, trà đá, phở chay.`
  - `Thiền đường dời về bên vườn thiền, mặt hướng Đông; thêm Phòng Ghi Công Đức ở góc Tây Nam. Hành lang La Hán cũng rộng và thoáng hơn.`

## 12. Kiểm chứng & ảnh nghiệm thu (bắt buộc)

- `npm run typecheck` pass. Grep toàn repo xác nhận không còn tham chiếu tới các hằng số đã xóa.
- **Hồi quy server:** khởi động server thật + chạy một script kiểm chứng sẵn có (ví dụ
  `tools/steps-verify-beads.mjs`) — phải pass như trước (layout.ts được server import qua `npcs.ts`).
- Script chụp (theo mẫu `tools/steps-*.mjs`, dùng camera admin/F hoặc `goTo` của harness sẵn có):
  1. `a21-overview.png` — toàn cảnh từ cao phía Đông–Nam: thấy tường mới, phố trước cổng, trục nguyên vẹn.
  2. `a21-vien-kt.png` — trong sân Viện Khách Tăng: 3 nhà + rào + cổng viện + đường nội bộ.
  3. `a21-vien-to.png` — Viện Tổ: nhà tổ, vườn tháp nở rộng, am cổ ở góc xa.
  4. `a21-thien-duong.png` — mặt tiền thiền đường nhìn từ phía Đông (thấy biển + bảng), vườn thiền bên cạnh đã dọn.
  5. `a21-phong-sinh.png` — vườn phóng sinh từ bến nhìn qua ao.
  6. `a21-pho.png` — đứng ở cổng nhìn ra phố: đủ 6 sạp có biển, sân cổng lát.
  7. `a21-hanh-lang.png` — trong hành lang: lối đi rộng 5.2, 6 tượng trên bệ ngoài, ghế hàng trong.
  8. `a21-map.png` — mở panel Bản đồ: đủ địa điểm mới, viện + vườn + phố hiện đúng chỗ.
- Tự đi bộ kiểm (qua harness): cổng Nam ra phố và quay vào được; vào được hai cổng viện; tới được cửa
  mọi nhà theo đường lát; đứng được trên bến phóng sinh; không xuyên rào, không xuyên tường ở hai phía cổng.
  Báo cáo kết quả từng tuyến trong HANDOFF/báo cáo cuối.

## 13. Commit & Push (làm ngay trong session này, không chờ lệnh thêm)

1. Commit theo cụm, add từng file theo đường dẫn, **không bao giờ `git add -A`**:
   - `feat: expand compound walls and layout constants (A2.1)` — layout.ts (+ file liên quan nếu có).
   - `feat: relocate service houses, widen corridors, new merit office (A2.1)` — temple.ts (+ compound.ts nếu sửa ở đây).
   - `feat: two rear courtyards, release garden and gate street (A2.1)` — temple.ts/compound.ts phần còn lại.
   - `feat: redraw path network and in-game map for expanded compound (A2.1)` — temple.ts paths + map.ts.
   - `feat: news entry for compound expansion (A2.1)` — news.ts.
   - `docs: update HANDOFF for A2.1` — HANDOFF.md.
   (Gộp/tách khác đi một chút cũng được, miễn mỗi commit một cụm việc rõ ràng và không trộn file ngoài phạm vi.)
2. Trước khi push: `git pull --rebase origin main`. Xung đột thì DỪNG và báo nguyên văn, không tự xử.
3. `git push origin main`. Lỗi HTTP 400 (ảnh nặng) thì chạy lại đúng một lần:
   `git -c http.postBuffer=524288000 push origin main`.
4. **Không force-push trong mọi trường hợp.** Lỗi khác: dừng, báo nguyên văn.
5. Báo cáo cuối: HEAD mới, danh sách `pathRect` nội bộ hai viện đã vẽ, mọi lệch tọa độ so với spec
   (nếu có) kèm lý do, kết quả đi bộ kiểm từng tuyến, số tượng La Hán đếm được mỗi bên trong ảnh.
