# SPEC CUỐI: Dời DB người chơi Chùa Online sang Turso (libSQL)

> Bản này đã gộp spec của Lux + bản kế hoạch bên ngoài (đã đối chiếu với code thật
> `server/db.ts`, `server/index.ts`, `render.yaml` tại HEAD `4dae30a`, 2026-11-10).
> Đây là tài liệu thi công duy nhất cho việc này — các bản trước đó bỏ.

## 0. Hiện trạng & quyết định nền

- Server dùng `node:sqlite` (`DatabaseSync`, đồng bộ) qua một module duy nhất
  `server/db.ts`; deploy Render free (Singapore), **không có đĩa bền — file DB reset
  sau mỗi lần deploy**. Hôm nay đã push ít nhất 2 commit, nên dữ liệu production
  gần như chắc chắn đã bị reset: **không cứu dữ liệu từ Render** (xem mục 5 — đường
  endpoint backup bị loại vì tự mâu thuẫn: deploy endpoint lên là reset luôn file cần cứu).
- Nguồn dữ liệu hạt giống = **file local `data/chuaonline.db` trên máy dev** (chứa các
  tài khoản test hiện có, gồm `quantri`). Nạp nguyên file lên Turso để giữ nguyên
  tài khoản, `pass_hash` và phiên đăng nhập.
- Turso free tier (kiểm chứng 2026-11-10): 5 GB, 100 databases, 500 triệu dòng
  đọc + 10 triệu dòng ghi / tháng, không cần thẻ. Dư rất xa so với nhu cầu game.
- Tạo **2 databases**: `chuaonline` (thật) và `chuaonline-dev` (test local).
  Location: gần nhất với Render Singapore — ưu tiên Singapore, không có thì Tokyo.

## 1. Phần NGƯỜI DÙNG làm — chuẩn bị Turso (trước hoặc song song phần code)

```bash
brew install tursodatabase/tap/turso
turso auth login
```

Chuẩn bị file hạt giống (checkpoint WAL trước, không là mất phần ghi mới nhất —
file `-wal` đang chứa ~3,8 MB dữ liệu chưa nhập vào file chính):

```bash
cd /Users/user/Downloads/chuaonline
sqlite3 data/chuaonline.db "PRAGMA wal_checkpoint(TRUNCATE); PRAGMA integrity_check;"
sqlite3 data/chuaonline.db "SELECT COUNT(*) FROM players;"
cp data/chuaonline.db ~/chuaonline-seed.db   # giữ 1 bản sao ngoài thư mục project
```

Tạo databases và lấy thông tin kết nối:

```bash
turso db create chuaonline-dev                      # DB test, để trống, schema tự tạo khi server chạy
turso db create chuaonline --from-file data/chuaonline.db
# Nếu --from-file bị từ chối: sqlite3 data/chuaonline.db .dump > dump.sql
# rồi: turso db create chuaonline --from-dump dump.sql
turso db shell chuaonline "SELECT COUNT(*) FROM players; SELECT COUNT(*) FROM inventory;"
turso db show chuaonline --url
turso db tokens create chuaonline
turso db show chuaonline-dev --url
turso db tokens create chuaonline-dev
```

**Bảo mật token:** token = mật khẩu DB. Chỉ đặt trong Render Environment và file
`.env` local (kiểm tra `.env` đã có trong `.gitignore`). KHÔNG dán vào chat, KHÔNG
đưa cho Kilo, KHÔNG commit. Khi test local (mục 3), tự tay điền token của
`chuaonline-dev` vào `.env` — Kilo không cần và không được nhận bất kỳ token nào.

## 2. Phần KILO làm — chuyển code sang @libsql/client

### 2.1. `server/db.ts`
- `npm i @libsql/client`; bỏ hẳn `node:sqlite`.
- Thay `openDb()` bằng:

```ts
import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? (process.env.DB_FILE ? `file:${process.env.DB_FILE}` : 'file:data/chuaonline.db'),
  authToken: process.env.TURSO_AUTH_TOKEN,
});
```

- Chạy schema hiện tại bằng `await db.executeMultiple(...)` — **giữ nguyên văn** các
  `CREATE TABLE IF NOT EXISTS`, kèm khối migration `is_admin` (try/catch) đang có.
  Bỏ `PRAGMA journal_mode = WAL` (Turso tự quản). Kiểm tra `PRAGMA foreign_keys`
  qua `db.execute` một lần lúc khởi động và ghi log kết quả.
- Mọi hàm export chuyển sang `async`, giữ nguyên tên và ngữ nghĩa. Bảng đổi API:

  | node:sqlite | @libsql/client |
  |---|---|
  | `db.prepare(sql).run(a, b)` | `await db.execute({ sql, args: [a, b] })` |
  | `.get(...)` | `(await db.execute({ sql, args })).rows[0]` |
  | `.all(...)` | `(await db.execute({ sql, args })).rows` |
  | `r.changes` | `r.rowsAffected` |
  | `Number(r.lastInsertRowid)` | `Number(r.lastInsertRowid)` (kiểu bigint) |

- `syncAdmins()` thành async và phải `await` ở điểm khởi động (và trong `register`).
- Thao tác nhiều bước phải nguyên tử: cặp trừ xu + cộng vật phẩm ở luồng mua đồ
  (hiện là 2 lời gọi riêng ở `index.ts`) chuyển thành `db.batch([...], 'write')`
  hoặc bọc trong một hàm duy nhất phía `db.ts`. Các câu lệnh đơn vốn đã nguyên tử
  (`ON CONFLICT ... DO UPDATE`, `UPDATE ... WHERE coins >= ?`) giữ nguyên.

### 2.2. `server/index.ts`
- Thêm `await` vào mọi lời gọi hàm của `db.ts` (~40 điểm); handler socket.io khai
  báo `async`; chú ý các chỗ dùng kết quả trong `cb?.(...)`.
- `npm run typecheck` phải pass — không né bằng `as any` tràn lan (chỉ chấp nhận
  cast kiểu hàng tại điểm đọc row như code hiện tại vẫn làm).

### 2.3. Dọn dẹp
- `render.yaml`: bỏ comment `DB_FILE`/đĩa trả phí và ghi chú `NODE_VERSION` vì
  `node:sqlite` (thay bằng ghi chú DB ở Turso qua 2 biến `TURSO_*`); thêm 2 biến
  `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` dạng `sync: false`.
- Đảm bảo `.env` nằm trong `.gitignore`.

### 2.4. Commit
- Một commit riêng, add từng đường dẫn (`package-lock.json` thay đổi là hệ quả đúng
  của `npm i`, đưa vào commit này):
  `feat: move player DB to Turso (libSQL), seed from local file, dev fallback`

## 3. Nghiệm thu theo thứ tự (không bỏ bước)

1. Typecheck pass.
2. **Chế độ file local** (không đặt `TURSO_*`): boot, đăng nhập bằng tài khoản có
   sẵn trong file local, chơi thử — hành vi như cũ.
3. **Trỏ vào `chuaonline-dev`** (người dùng tự điền env vào `.env`): đăng nhập
   `quantri`, kiểm tra công đức/xu/túi đồ/bảng xếp hạng; restart server, đăng nhập
   lại — dữ liệu còn nguyên; vào Turso dashboard thấy dữ liệu trong DB dev.
4. **Cutover production** (người dùng làm): đặt `TURSO_*` của DB `chuaonline` lên
   Render → deploy → đăng nhập bằng tài khoản đã nạp hạt giống (giữ nguyên mật khẩu
   cũ) → **deploy/restart thêm một lần** → đăng nhập lại, dữ liệu còn nguyên.
   Đây là bài test mà hiện trạng Render free trượt chắc chắn.
5. Luồng khách (guest), nhiệm vụ, nhận thưởng, mua đồ trong shop chạy đúng ở cả
   hai chế độ file và Turso.

## 4. Sau cutover — vận hành & dự phòng

- **Rollback khẩn cấp:** xoá 2 biến `TURSO_*` trên Render → server về chế độ file
  local và boot bình thường (dữ liệu trên Turso không mất, chỉ tạm không được đọc).
- **Backup lạnh định kỳ:** giữ file `~/chuaonline-seed.db`; thỉnh thoảng chạy
  `turso db shell chuaonline .dump > backup.sql` và cất cùng chỗ.
- **Độ trễ:** mỗi query là một vòng mạng Render ↔ Turso (cùng khu vực nên nhỏ).
  Không đưa lời gọi DB vào vòng lặp tick game/real-time — hiện tại code không làm
  vậy, giữ nguyên.
- **DB free lâu không hoạt động** có thể bị Turso archive: nếu chùa vắng khách
  dài ngày, vào dashboard unarchive một click.

## 5. Đã cân nhắc và LOẠI

- **Endpoint `/api/_backup` tải file từ Render:** tự mâu thuẫn — deploy endpoint
  lên sẽ reset chính file cần cứu trước khi endpoint kịp đọc; cộng thêm dữ liệu
  production hôm nay đã bị reset bởi các lần push. Không làm.
- **Embedded replica** (file local đồng bộ lên cloud): thừa phức tạp ở quy mô này.
- **Mua đĩa bền của Render:** tốn tiền, trái mục tiêu free.
