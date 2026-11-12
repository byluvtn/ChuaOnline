# HANDOFF — Session mới cho gói A2.8 (tượng hành lang) + A2.2 (đang dở)

> Đọc file này đầu tiên. Session trước (tab "Thay 12 tượng chibi bằng 4 tượng scan vàng", 659.6K tokens) bị lỗi compaction 3 lần ("Compaction did not run: the summary was cut off at the output limit" + "Request Entity Too Large") nên KHÔNG tóm tắt được. File này là bản tổng hợp thay thế, viết từ working tree thật trên máy (đã kiểm chứng bằng git diff + SHA-256 + xem ảnh chụp).
> Quy tắc session: todowrite TRƯỚC khi làm. 1 gói = 1 commit + push. Không bịa số đo.

## 0. Hiện trạng (HEAD vẫn 0997bc4, CHƯA commit gì — mọi thứ dưới đây đang nằm trong working tree, chưa push)

- Git log: `0997bc4` (prompt Quan Âm) → `cd2ff0a` (A2.6) → `21d8eb0` → `56c5196` (A2.5) → `994827e` (A2.4).
- `git status`: 11 file tracked bị sửa + nhiều file untracked (xem §3). **A2.2 và A2.8 đang TRỘN trong cùng 1 working tree** — khi commit phải tách riêng bằng `git add <từng đường dẫn>`, KHÔNG dùng `git add -A`.

## 1. A2.8 — Thay 12 tượng La Hán chibi bằng 4 tượng scan vàng: CODE ĐÃ XONG, còn 2 việc nhỏ

### Đã làm xong (kiểm chứng từ working tree)
- `src/statue-corridor.ts` (MỚI, 74 dòng, untracked): `CORRIDOR_STATUE_NAMES = ['arhat-binh','monk-go','guanyin-ngoi','guanyin-go-minh']`, cao mục tiêu `TARGET_HEIGHT = 0.8`, `FACE_OFFSET` (arhat-binh 0, monk-go 0, guanyin-ngoi π/2, guanyin-go-minh π/2), `UPRIGHT_X` (arhat-binh −π/2 — tượng này nằm nghiêng trong file gốc), vàng bóng 0xD4AF37 / metalness 1.0 / roughness 0.2 + RoomEnvironment/PMREM, load qua `loadModel`, lỗi → fallback chibi + `console.warn`.
- `src/temple.ts` (đã sửa): import `buildCorridorStatues`; khe hành lang theo đúng prompt — `modelIndex = (k + (side > 0 ? 2 : 0)) % 4` (trái bắt đầu A, phải bắt đầu C), collider r 0.42 giữ nguyên, fallback `buildArhat(v)` giữ lại, `sealArchitectureJoints` sau khi thay.
- `public/models/`: cả 4 GLB đã có mặt, **SHA-256 đã kiểm chứng khớp 100%**:
  - `arhat-binh.glb` — **ĐÃ DECIMATE bằng gltfpack -si 0.4**: 13.183.332 B → **6.303.376 B**, 358.748 → **143.498 mặt**, 1 mesh, SHA `d7cd30e8…65ede`. Tổng 12 tượng = 143.498×3 + 50.000×3 + 200.000×3 + 53.958×3 ≈ **1.342.368 mặt < 1,5M** → đạt quy tắc §0.3 trong prompt, KHÔNG cần cắt thêm.
  - `monk-go.glb` 5.435.936 B / 50.000 mặt, SHA `e6be082c…f542` ✓
  - `guanyin-ngoi.glb` 9.603.608 B / 200.000 mặt, SHA `11ae46c7…fc13` ✓
  - `guanyin-go-minh.glb` 7.434.520 B / 53.958 mặt, SHA `e044dd79…b32` ✓ (CC-BY, credit đã ghi)
- `public/models/README.md`: đã thêm 4 dòng credit (arhat-binh ghi rõ bản decimate + SHA mới; guanyin-go-minh có dòng credit `Water Moon Guanyin by nebulousflynn, CC-BY-4.0`).
- Ảnh chụp (đã xem bằng mắt): `shots/corr-wide.png` (toàn cảnh — cột kinh NAM MÔ BỔN SƯ THÍCH CA hai bên), `corr-east-k0-guanyin-ngoi.png` (**tượng vàng RÕ, ngồi thiền, mặt hướng vào trục hành lang, đứng trên bệ đá**), `corr-close-monk-go.png` (sư nhỏ vàng, mặt hướng đúng), `corr-close-{arhat-binh,guanyin-ngoi,guanyin-go-minh}.png`, `corr-map.png`, `corr-wide-east/west.png`, `corr-east-k1..k3.png` + bộ `corr2-*` (chụp lại lần 2), `face-{front,back,left,right}-{4 tượng}.png` (16 ảnh kiểm tra hướng mặt). Tools: `tools/steps-corridor.mjs`, `steps-corridor-face.mjs`, `steps-corridor-walk.mjs`.
- **Kết quả xem ảnh**: vàng bóng rõ, tượng đứng đúng trên bệ, mặt hướng vào giữa hành lang. LƯU Ý: trong ảnh `corr-close-monk-go.png` có 1 tượng vàng lớn ở mép phải bị cắt nửa (góc chụp gần) và 1 bệ trống ở giữa (không tượng) — kiểm tra lại xem đó là tượng kề hay bệ bị thiếu tượng; ảnh wide thì hai dãy bệ nhìn đều có tượng.

### CÒN THIẾU — làm ngay trong session này (theo đúng prompt `prompt-tuong-hanh-lang.md`, file .md ở `~/workspace/chuaonline/` bản máy trợ lý, KHÔNG nằm trong repo)
1. **Tin tức**: `src/data/news.ts` hiện `LATEST_NEWS_ID = 10` (mục "Đi được tới Am Cổ" của A2.2). Thêm mục mới tiêu đề `Hành lang tượng vàng`, `LATEST_NEWS_ID` 10 → **11**. ⚠️ Đừng hardcode 11 nếu file đã đổi — lấy giá trị hiện tại trong file rồi +1.
2. **HANDOFF.md**: chưa có mục A2.8 nào (grep 0 kết quả — mục A2.7 trong diff là của A2.2). Thêm mục `## A2.8 — 4 tượng scan vàng thay 12 La Hán hành lang` ghi: 4 file GLB + SHA + số mặt sau decimate, tổng ~1,34M mặt, thứ tự xen kẽ, FACE_OFFSET/UPRIGHT_X, fallback chibi, ảnh chụp đã xem, và việc còn treo (kiểm tra bệ trống trong ảnh close-monk-go).
3. **Kiểm chứng rồi commit + push**: `npm run typecheck` sạch, `npm run build` sạch, walk-sim 2 hành lang 0 xuyên collider (tool `steps-corridor-walk.mjs` đã có), rồi commit RIÊNG gói A2.8: `git add src/statue-corridor.ts src/temple.ts public/models/arhat-binh.glb public/models/monk-go.glb public/models/guanyin-ngoi.glb public/models/guanyin-go-minh.glb public/models/README.md src/data/news.ts HANDOFF.md shots/corr*.png shots/face-*.png tools/steps-corridor*.mjs` → 1 commit `feat: 4 tuong scan vang thay 12 La Han hanh lang (A2.8)` → `git pull --rebase` rồi push. (Nếu A2.2 commit trước thì thứ tự file trong `git add` phải tách đúng: temple.ts + news.ts + HANDOFF.md đang chứa cả 2 gói — commit A2.2 TRƯỚC, rồi mới add phần còn lại cho A2.8, hoặc gộp 1 commit ghi rõ cả 2 gói. KHÔNG commit gộp vô tội vạ.)

## 2. A2.2 — Sửa lag (merge nhà + pre-warm + chuông ngược + collider ghế): ĐANG DỞ, CHƯA COMMIT

- Đã có trong working tree: `MAP_Z_MIN = -82` (`shared/types.ts:40`), kẹp z `[MAP_Z_MIN, MAP_HALF]` ở `src/main.ts:774` + `server/index.ts:259` — **đây là bản sửa lỗi kẹt ở z = −68, đã tự kiểm chứng**: đi tới z −70/−75/−80 giữ vị trí, z −85 kẹp về −81.06; `walkTo(48,−75)` tới sát cửa Đông Am Cổ; ảnh `shots/a22-amco-amco-inside.png` có popup "AM CỔ — NƠI TĨNH TU" (chưa xem trực tiếp ảnh). News đã có mục "Đi được tới Am Cổ" (id 10). HANDOFF có mục `## A2.7 — Sửa biên đi lại phía Bắc (vào được Am Cổ)`.
- Typecheck Sonnet báo sạch (chưa chạy lại độc lập). **Chưa chạy `npm run build`, chưa deploy, chưa đo FPS trên máy thật** (headless ~2 FPS nên đo đi bộ dài dừng sớm — không phải do collider). LƯU Ý trong HANDOFF A2.7: `npm run dev` (concurrently -k) tự tắt khi `dev:server` thoát; phải chạy `dev:server` và `dev:client` riêng.
- Các file A2.2 đang sửa: `server/index.ts`, `shared/types.ts`, `src/compound.ts`, `src/main.ts`, `src/temple.ts`, `src/world.ts`, `tools/steps-cost.mjs`, `tools/steps-fps.mjs` + shots `a22-*` + tools `steps-a22-*.mjs`.
- Nhiệm vụ session này (nếu A2.2 chưa xong): hoàn thiện theo prompt `prompt-a2-2-tri-do.md` (merge 7 nhà + am cổ, pre-warm, lật chuông, collider `woodBench`), đo lại, commit RIÊNG 1 commit A2.2 rồi push. Số đo máy thật: nếu không đo được thì ghi rõ "chờ số đo máy thật", KHÔNG bịa số FPS.

## 3. Quan Âm chibi vẽ lại (prompt 0997bc4, đã push lên GitHub) — CHƯA CÓ DẤU VẾT TRONG TREE NÀY

- `src/statues.ts` KHÔNG bị sửa trong working tree → bản vẽ lại Quan Âm (mặt 3D thật, vương miện có Phật A Di Đà nhỏ, bình ngọc jade, lá liễu tròn) **chưa làm hoặc đang ở session/worktree khác**. Session này KIỂM TRA riêng: nếu chưa làm thì làm theo prompt `prompt-quanam-chibi-scan-ref.md` (ref: file scan local `E:\Code\ChuaOnline-main\12th_c_ce_water-moon_guanyin\` + ảnh design v4; **scan chỉ làm ref, KHÔNG commit thư mục scan, KHÔNG load vào game**). News của gói này sẽ là id 12 nếu A2.8 lấy 11 (lấy giá trị hiện tại +1, đừng hardcode).
- ⚠️ Link ảnh design v4 hết hạn ~15:34 ngày 14/11/2026 — nếu cần xem lại thì hỏi user gửi lại.
- ❌ KHÔNG dùng tượng Retro Guanyin đã chỉnh sửa làm ref — user đã chê xấu và bỏ (17:13 ngày 12/11).

## 4. Vì sao session cũ chết — và cách tránh lặp lại

- Context phình tới ~659,6K tokens (cache 848,7K) vì session ôm cả A2.2 + A2.8 + nhiều lần chụp/đo; `/compact` thử 3 lần đều lỗi: tóm tắt bị cắt ở giới hạn output ("summary was cut off at the output limit") + 1 lần "Request Entity Too Large" (413).
- Bài học cho session mới: **đừng ôm 2 gói trong 1 session**; làm xong 1 gói → commit + push → mở session mới; giữ mỗi session ngắn; khi context tới ~70% thì tự tóm tắt ra file `.md` rồi mở session mới, đừng đợi auto-compaction; đừng paste lại toàn bộ lịch sử chat vào session mới — chỉ đưa file HANDOFF này + prompt file của gói đang làm.
