# ChuaOnline trên Fly.io — host tạm trong lúc chờ Oracle có capacity

Mục tiêu: game chạy thật trên Fly.io, bill tháng dưới $5 để được miễn ($0).

## Cách chạy (không sửa code game)

- Server Node đọc `PORT` (mặc định 3001); trên Fly đặt `PORT=8080` trong
  `fly.toml` `[env]`, `internal_port = 8080`. Server tự bind 0.0.0.0.
- DB: không đặt `TURSO_DATABASE_URL` thì server dùng SQLite local.
  `DB_FILE=/data/chuaonline.db`, volume 1 GB mount tại `/data`
  (máy Fly không giữ đĩa khi deploy lại — bắt buộc có volume).
- Build y hệt Render: `npm ci && npm run build` rồi `npm start`.

## Chi phí ước tính / tháng (giá kiểm chứng 16/11/2026, fly.io/pricing)

| Hạng mục | Giá |
|---|---|
| Máy shared-cpu-1x 256MB, Singapore (sin) | ~$2,78 |
| Volume 1 GB | $0,15 |
| Egress châu Á–Thái Bình Dương $0,04/GB (tháng 11 Render dùng ~6,8 GB → ~$0,27; kể cả 50 GB cũng chỉ $2,00) | ~$0,27 |
| Snapshot volume (10 GB đầu miễn phí, volume chỉ 1 GB) | $0 |
| Shared IPv4 Anycast (KHÔNG lấy dedicated IPv4 $2/tháng) | $0 |
| **Tổng điển hình** | **~$3,20 → dưới $5 → được miễn → $0** |

Lưu ý: Fly.io KHÔNG còn free tier cho tài khoản mới. Tài khoản mới chỉ có
trial $1 dùng 7 ngày, không cần thẻ — nhưng máy trial tự dừng sau 5 phút
chạy, không dùng làm host game được. Muốn bill dưới $5 được miễn thì tài
khoản phải ở chế độ Pay As You Go, mà chế độ này **cần thẻ tín dụng trên
file** — chỉ user mới thêm thẻ được, agent không tự thêm.

## Lần đầu setup (theo thứ tự)

1. Đăng ký tài khoản Fly.io (bằng GitHub byluvtn hoặc Google
   ngant.iuh@gmail.com). `fly auth signup` in ra URL, hoàn tất trên trình
   duyệt; hoặc `fly auth login --code <mã>` để kết thúc phiên đăng nhập
   đang chờ.
2. User tự thêm thẻ tín dụng trên dashboard Fly.io (Billing) để bật
   Pay As You Go — bắt buộc, nếu không máy trial dừng sau 5 phút.
3. Tạo app + volume (từ thư mục repo, đã đăng nhập flyctl):
   `fly apps create chua247` (nếu tên đã có người lấy, đổi thành
   `chua247-top` và sửa `app =` trong fly.toml),
   `fly volumes create chua_data --size 1 --region sin`
4. Deploy lần đầu: `fly deploy --remote-only`
5. Verify: `https://chua247.fly.dev` trả 200, game load được,
   socket.io kết nối được (`/socket.io/?EIO=4&transport=polling` trả sid).
6. Bật auto-deploy: tạo deploy token `fly tokens create deploy`, thêm vào
   GitHub repo secret `FLY_API_TOKEN`; workflow
   `.github/workflows/deploy-fly.yml` sẽ deploy mỗi lần push lên main.

## Kiểm tra bill

`fly orgs show` / dashboard Fly.io → Billing: xem bill tháng hiện tại,
phải dưới $5. Nếu egress tăng vọt (game đông người), bill có thể chạm
$5 — lúc đó cân nhắc lại (vẫn rẻ hơn Render Pro $25/tháng).

## Dọn dẹp khi Oracle xong

`fly apps destroy chua247` (xóa cả máy + volume; nhớ backup
`/data/chuaonline.db` trước nếu cần dữ liệu người chơi trên host tạm).
