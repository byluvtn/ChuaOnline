# Prompt: Sông Đông uốn hình chữ S + thác Bản Giốc mở rộng

## Bối cảnh

- Sông Đông hiện là một đoạn thẳng: `RIVER = { x: 65, x0: 63, x1: 67, z0: -82, z1: 14, pond: { x: 65, z: 16, a: 3, b: 4 }, bridges: [-38, 2], bridgeHalf: 1.4 }` (`shared/campus.ts:8`), rộng 4 m, thác Bản Giốc ở đầu nguồn (65, −82), rộng ~12,4 m, 3 tầng (`src/river-waterfall.ts`).
- User yêu cầu: thác nước và suối mở rộng ra gần bờ tường Đông, đến đoạn Điện Dược Sư thì cong và nhỏ lại, sau đó lại to ra — như hình chữ S.

## Thiết kế: đường tim sông hình chữ S

Đường tim + nửa chiều rộng theo z (nội suy tuyến tính giữa các mốc). Chảy từ bắc (thác) xuống nam (ao):

| z | tim x | nửa rộng | rộng | Ghi chú |
|---|-------|----------|------|---------|
| −82 | 79 | 5.5 | 11 | đầu nguồn, rộng, gần tường Đông (x=92) |
| −70 | 77 | 4.5 | 9 | đoạn bắc rộng |
| −58 | 72 | 4.0 | 8 | bắt đầu cong về tây |
| −48 | 67 | 2.5 | 5 | thu hẹp dần |
| −38 | 65 | 1.5 | 3 | hẹp nhất, ngang Điện Dược Sư — cầu đá z=−38 GIỮ NGUYÊN |
| −28 | 65.5 | 2.0 | 4 | mở lại |
| −15 | 66 | 3.0 | 6 | mở rộng |
| 2 | 66 | 3.0 | 6 | cầu đá z=2 GIỮ NGUYÊN (sông 63..69, cầu phủ 59.7..70.3) |
| 14 | 66 | 3.5 | 7 | cuối sông, nối vào ao |

Ràng buộc (đã kiểm tra, không được vi phạm):
- Rừng trúc: x 70..90, z −20..14 (`src/features/map.ts:67`) — mép đông sông đoạn nam tối đa x 69.5.
- Vườn hoa: x 68..90, z 15..40 (`map.ts:68`) — ao cuối sông GIỮ NGUYÊN (65,16,a3,b4), không dời/đông rộng về phía đông.
- Điện Dược Sư: x 71..83, z −42.5..−33.5 — sông đoạn hẹp (mép đông 66.5) cách mép tây điện 4.5 m.
- Tường Đông x=92 — thác mở rộng tới x≈88, chừa 4 m bờ.
- Góc đông-bắc (x 67..92, z −82..−55) hiện là cỏ trống — sông đoạn bắc thoải mái mở rộng về đông.
- Cầu đá z=−38 và z=2 đều GIỮ NGUYÊN vị trí (tim sông tại 2 vĩ độ cầu vẫn ≈65–66, cầu phủ đủ).

## Thác Bản Giốc mở rộng

- Nhóm thác dời từ (65, −82) sang (80, −82), mở rộng ~12,4 m → ~16 m (local x −8..+8, world 72..88).
- Kè đá (shelf): mở rộng outline mặt trước 3 tầng về phía đông theo tỉ lệ mới; thêm cột đá (boulder) ở 2 bên theo đúng mẫu hiện có (icosahedron + moss).
- Rèm nước (curtain): tầng 3: 2 → 3 rèm; tầng 2: 3 → 4 rèm; tầng 1: 4 → 6 cửa xả. Hai cửa xả ngoài cùng tầng 1 vẫn hơi cong vào trong để rơi vào bể đầu nguồn (rộng 11 m), không cong gắt như cũ (kỹ thuật cũ: "landing inside the original four-metre river").
- Hồ ngọc (jade pools): mở rộng rx tầng 2/1 (4.28/4.76 → ~6.5). Tấm bọt (foam): mở rộng theo. Karst sau lưng: thêm 1–2 khối đá phía đông. Cây bụi trên gờ: thêm cây ở gờ mới phía đông.
- Khung vách đá quanh đầu thác ở `src/expansion.ts` (3 `wallLine` quanh `RIVER.x ± 5.6`, z0−1.96..−13.4): dời tâm về x=80, mở rộng nửa rộng ~10.

## Thay đổi code (theo file)

1. `shared/campus.ts`:
   - Thay rect sông bằng `RIVER_PATH` (bảng trên) + helper `riverAt(z)` nội suy tuyến tính (trả `{ x, hw }`).
   - `expansionWaterBlocked` (dòng ~85): thay test rect bằng test khoảng cách tới đường tim — điểm (x,z) bị chặn khi `|x − riverAt(z).x| < riverAt(z).hw + 0.25` (giữ nguyên ngoại lệ cầu: không chặn trong `|z − bz| <= bridgeHalf − 0.4`). Giữ nguyên test ao (ellipse).
   - Giữ `RIVER.pond`, `RIVER.bridges`, `RIVER.bridgeHalf`. Xóa `x0/x1/z0/z1/x` sau khi đã sửa hết nơi dùng (grep `RIVER\.` toàn repo trước khi xóa).
2. `src/expansion.ts` (mục 7, dòng ~677):
   - Mặt nước: thay `waterRect` bằng dải ribbon theo đường tim — dựng từ đoạn thẳng ~2 m nối các mốc (mỗi đoạn là quad ngang sông, UV v chạy dọc dòng để shader chảy đúng hướng; đọc `waterM` tại chỗ để khớp hướng scroll). Giữ `waterEllipse` cho ao.
   - Bờ kè: thay 2 đường kè thẳng bằng kè đoạn theo 2 mép sông (tái dùng `addBox` stone + trụ stoneDark mỗi ~4 m dọc đường cong). Tính mép từ `riverAt(z)`.
   - Đường thiền hành ven sông (bờ đông, z −30..12): dời theo mép đông mới (`x = riverAt(z).x + riverAt(z).hw + 1.6`), vẫn chừa 2 đầu cầu.
   - Biển SÔNG ĐÔNG: dời tới mép đông mới tại z=−42.5 (x ≈ tim + hw + 1.7, tính tại build).
   - Zone sông tại 2 cầu: giữ nguyên (tim sông tại cầu không đổi).
3. `src/river-waterfall.ts`: nhóm thác dời sang (80, −82) + mở rộng như mục trên. Cá (7 con, lanes theo z local): x của cá phải bám đường tim mới — tính `x = riverAt(worldZ).x − groupX` mỗi frame thay cho dao động quanh 0 hiện tại.
4. `src/features/map.ts`: vẽ sông bằng polyline/ribbon theo `RIVER_PATH` thay cho `rect(RIVER.x0...)` (dòng ~63); ao giữ nguyên; cầu giữ nguyên (vị trí không đổi).
5. KHÔNG đụng: `places.ts` điểm Sông Đông (65,2) vẫn nằm trên sông; ngoại lệ cầu trong `walkY`/`groundYBase` (x 60.5..69.5) vẫn phủ đủ 2 cầu; `blocked()` scatter cây; nhiệm vụ đi bộ ven sông/trúc.

## Tin tức (1 entry, LATEST + 1 tại thời điểm build)

- Đọc `LATEST_NEWS_ID` hiện tại trong `src/data/news.ts` rồi +1 (không hard-code số).
- Title: `Sông Đông uốn hình chữ S, thác Bản Giốc mở rộng`
- Body: `Dòng sông Đông giờ uốn lượn như chữ S: thác đầu nguồn mở rộng gần tới tường Đông, đoạn qua Điện Dược Sư cong lại và thu hẹp, rồi lại mở rộng về phía nam. Hai cầu đá vẫn bắc qua sông như cũ, đường thiền hành ven sông cũng uốn theo bờ mới.`
- Date: `2026-11-18`. Entry mới lên đầu danh sách (newest-first).

## Nghiệm thu

1. `npm run typecheck` + `npm run build` PASS.
2. Ảnh: (a) toàn cảnh thác mới từ phía nam (rộng, gần tường Đông); (b) đoạn cong hẹp ngang Điện Dược Sư (nhìn rõ sông thu hẹp + điện bên phải); (c) đoạn nam mở rộng + ao; (d) cả 2 cầu đá (người đi bộ qua được, mặt cầu phủ hết mặt sông); (e) minimap (sông vẽ cong đúng hình S).
3. Walk test: chạy lại verify script đi bộ — đi qua cả 2 cầu không bị kẹt; đi dọc đường thiền hành ven sông không rơi xuống nước; thử lội xuống sông ở 3 đoạn (bắc/giữa/nam) đều bị chặn (server + client).
4. Cá vẫn bơi trong lòng sông đoạn bắc (không bơi trên cạn sau khi sông dời).
5. Không có lỗi console; không regression ở Rừng trúc / Vườn hoa / Điện Dược Sư (ảnh spot-check 3 chỗ).

## Commit & Push

- `git add` từng file đã sửa (không `git add -A`).
- `git pull --rebase origin main` trước khi push.
- Một commit duy nhất, message: `feat: song Dong uon chu S, mo rong thac Ban Gioc`.
- `git push origin main` (lỗi HTTP 400 thì thử lại một lần với `-c http.postBuffer=524288000`). Không force-push. Lỗi khác thì dừng và báo nguyên văn.
- Báo HEAD mới sau khi push.
