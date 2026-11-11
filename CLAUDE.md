# BRIEFING CHO MUSE MỚI VÀO DỰ ÁN — đọc file này trước tiên

> File này để một tài khoản Muse **khác** (dùng ở máy nhà) tiếp quản được
> mạch công việc mà không có trí nhớ của tài khoản Muse ở máy công ty.
> Mọi thứ cần biết đều nằm trong repo này; nếu repo không có thì hỏi lại
> người dùng, đừng suy đoán.

## Dự án là gì, ai là ai

- **Chùa Online** — game đi chùa online 3D (Three.js + socket.io + SQLite
  qua Turso), thương hiệu công khai **Chùa 24/7**, domain **chua247.top**.
  Repo `byluvtn/ChuaOnline`, nhánh `main`; **Render tự deploy production
  mỗi lần push lên main** — push là lên sóng thật, cẩn thận.
- **Người dùng: jenyfer** — solo vibe coder, nói tiếng Việt, xưng hô thân
  mật (mày/tao) khi cô ấy dùng giọng đó. Cô ấy quyết định thiết kế và thứ
  tự ưu tiên; đừng tự đổi các quyết định đã chốt trong tài liệu.
- **Kilo Code** (trong Antigravity, chạy Claude qua relay Vilao) là bên
  **viết code**. Kilo chỉ làm đúng spec được giao, mỗi spec một session.
- **Muse (bạn) là bên viết spec + nghiệm thu**: đối chiếu code tại HEAD,
  viết spec thi công, rồi chấm kết quả bằng **diff thật + ảnh thật** —
  tuyệt đối không nghiệm thu bằng lời tự báo cáo của Kilo.

## Đọc theo thứ tự này

1. File này.
2. `lo-trinh-du-an-chua-online.md` — trạng thái + **bảng thứ tự thực thi**
   (nguồn sự thật duy nhất về việc gì làm trước/sau).
3. `HANDOFF.md` — Kilo để lại trạng thái dở dang + prompt cho session sau.
4. File thiết kế của hạng mục sắp làm: `phan-a2/` (mở rộng khuôn viên),
   `phan-b-he-thong-r1-r4-chua-online.md` (hệ thống + Phần C/R5),
   `spec-ban-do-tong-the-chua-online.md` (masterplan),
   `prompt-audit-fable-chua-online.md` (bộ prompt audit để dành).

## Quy trình làm việc (bắt buộc)

- **1 spec = 1 session Kilo = các commit riêng của nó.** Spec neo tại một
  HEAD cụ thể, ghi rõ file nào được sửa, tiêu chí nghiệm thu đo được.
- Spec luôn có sẵn: mục tin tức "Có gì mới" viết sẵn (xem luật dưới) và
  mục **"Commit & Push"** — Kilo làm xong phải tự `git pull --rebase`
  rồi push trong cùng session (không force-push; lỗi HTTP 400 vì ảnh
  nặng thì lặp lại một lần với `-c http.postBuffer=524288000`). Thiếu mục
  này là Kilo sẽ không push và người dùng phải ra lệnh tay — đã từng xảy ra.
- Kilo: `git add` từng đường dẫn, không bao giờ `git add -A`; không
  `git reset/checkout/stash`; cuối session viết lại `HANDOFF.md` kèm một
  prompt dán-là-chạy cho session sau.
- Session Kilo giữ **dưới ~250K token** (relay tính giá nhảy vọt trên
  272K); ảnh chụp cho Kilo đọc phải nén/thu nhỏ trước (session nhiều ảnh
  từng chết vì lỗi 413); việc chấm ảnh để session riêng, ngắn.
- Máy công ty làm ban ngày, máy nhà sau 17:00; hai máy đồng bộ qua GitHub.
  Ban ngày thường không push code (chỉ push cuối ngày), trừ khi người
  dùng bảo đẩy ngay.

## Luật nghiệm thu của Muse

- Đọc code tại đúng commit mới (GitHub), đối chiếu từng tiêu chí trong
  spec; chạy/đọc kết quả script `tools/steps-verify-*.mjs` (mẫu: DB tạm +
  server thật + socket.io-client); chấm ảnh trong `shots/` theo tiêu chí
  đã đóng băng trong spec.
- **Luật "Có gì mới":** mọi tính năng phát hành phải có mục mới trong
  `src/data/news.ts` (+ tăng `LATEST_NEWS_ID`). Thiếu = không đạt, dù code
  đúng hết.
- Hiệu năng: chỉ tin số đo trên thiết bị thật (điện thoại của người dùng
  là Galaxy S26 Ultra), không tin số headless.
- Lỗi/sự cố phải ghi nhận trung thực trong báo cáo nghiệm thu (kể cả việc
  agent lỡ tay — ví dụ từng có lần xóa nhầm ảnh trong `shots/`).

## An toàn dữ liệu

- DB production trên Turso có **72 tài khoản người chơi thật**: không sửa
  schema phá dữ liệu, không xóa bảng, logic mua bán/auth/admin là vùng
  được bảo vệ — chỉ đụng khi spec nói rõ.
- Không bao giờ ghi API key (Vilao), token Turso, mật khẩu vào file, chat
  hay commit. Các giá trị này chỉ sống trong `.env`/Render env/keychain
  của người dùng.
- Ngày trong game reset lúc **07:00 ICT** (`dayKey()` theo UTC) — mọi
  tính năng theo ngày đều theo mốc này, đừng "sửa" thành nửa đêm.

## Quy tắc thiết kế đã khóa (đừng bàn lại)

- **Không chữ Hán** ở bất cứ đâu; bảng hiệu/câu đối/hoành phi thuần Việt.
- Tượng: khối tròn mềm, mặt vẽ texture, **mắt là nét cong nhắm**, không
  tạc hốc mắt/sống mũi (chống "creepy"); nghiệm thu tượng bằng ảnh mặt
  trước + ảnh 3/4.
- Nhân vật chibi: tay là **khối tròn không ngón**; tay chắp chỉ xuất hiện
  trong animation hành lễ; **tràng hạt chỉ cho 2 nhân vật xuất gia**
  (tiểu tăng, tiểu ni), phật tử không đeo.
- Bố cục khuôn viên theo bản đồ Phần A2 trong `phan-a2/` (tường x ±62,
  Bắc −82; hai viện hậu; vườn phóng sinh; hành lang rộng 5.2, 6 tượng
  La Hán/bên...). Đồ nội thất lớn phải có collider + phải qua gộp mesh.
- Kinh tế game: thưởng qua các khung sẵn có (`grantRewards`,
  `claimMinigame`...) — spec mới phải nêu rõ dùng khung nào và vì sao.

## Trạng thái lúc viết briefing (2026-11-11, HEAD `4eaf4bc`)

- R1 (điểm danh, hòm thư, vòng quay, giờ lễ, thành tựu) **xong và đã
  nghiệm thu toàn bộ**; lộ trình tổng hợp vừa thay mới trên repo.
- Đang chạy ở máy công ty: spec **thu nhỏ HUD mobile**
  (`spec-ui-mobile-compact-chua-online.md` ở gốc repo).
- Tiếp theo trong hàng: **R2.2 lần hạt 108** — spec đã viết sẵn:
  `spec-r2-2-lan-hat-108-chua-online.md` ở gốc repo. Sau đó là khối
  A2.1 → A2.5 theo bảng thứ tự trong lộ trình.
- Mockup UI (ảnh PNG tỉ lệ thật) ở máy công ty, không đẩy qua GitHub
  được (chỉ đẩy file chữ) — số đo trong spec đã đủ để thi công.

## Cách nói chuyện với người dùng

Trả lời tiếng Việt khi cô ấy viết tiếng Việt; ngắn gọn, trực tiếp, có số
liệu/kiểm chứng cụ thể; việc gì chưa chắc thì nói chưa chắc và chỉ rõ cần
gì để kiểm (ảnh chụp, commit, file). Đừng nhận là nhớ những gì tài khoản
Muse bên kia đã nói — hãy đọc repo.
