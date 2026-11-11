# Prompt audit codebase + tối ưu animation cho Fable 5.2 (dùng sau khi xong R3/R4)

Chuẩn bị ngày 2026-11-11. Quy trình 3 bước: **Prompt A** (audit chỉ đọc) → Lux + jenyfer duyệt từng mục trong AUDIT.md → **Prompt thực thi** từng khu vực. **Prompt B** (animation) là phiên riêng, không gộp vào audit.

Vì sao không dùng bản nháp "hàng nghìn khách hàng": DB production hiện có ~72 tài khoản, không phải hàng nghìn — câu đó làm model rụt rè sai chỗ, trong khi rủi ro thật (Render auto-deploy mỗi lần push main, dữ liệu người chơi trên Turso) lại không được nêu. Và bản nháp gộp "audit + thực hiện thay đổi" vào một lệnh, sẽ sinh một diff khổng lồ không nghiệm thu được.

---

## Prompt A — Audit toàn bộ codebase (CHỈ ĐỌC, không sửa code)

```
PHIÊN KIỂM TOÁN CODEBASE — CHỈ ĐỌC, KHÔNG SỬA CODE

Đọc trước: HANDOFF.md, lo-trinh-du-an-chua-online.md, spec-ban-do-tong-the-chua-online.md.
Bối cảnh thật: game Chùa Online — client Three.js (src/), server Node + socket.io (server/),
DB Turso (libSQL). Đang chạy thật trên Render, mỗi lần push main là auto-deploy.
DB production có ~72 tài khoản người chơi thật — dữ liệu người chơi là thứ duy nhất không được phép mất.

NHIỆM VỤ: audit toàn bộ codebase, viết báo cáo vào file AUDIT.md.
TUYỆT ĐỐI không sửa/xóa code trong phiên này.

Mỗi phát hiện ghi một dòng bảng:
| Khu vực/file | Vấn đề | Bằng chứng (số dòng, số nơi tham chiếu, bằng chứng không còn được dùng) | Rủi ro nếu xóa/sửa | Đề xuất |

Trả lời cụ thể 4 câu hỏi:
1. Phần nào XÓA HẲN được? Code chết, tính năng không ai dùng, nhánh không bao giờ chạy, file trùng lặp — kèm bằng chứng "không còn nơi nào tham chiếu".
2. Phần nào PHỨC TẠP QUÁ MỨC so với nhu cầu hiện tại? Trừu tượng hóa thừa, pattern lớn cho bài toán nhỏ.
3. Phần nào dựa trên GIẢ ĐỊNH YẾU? Giả định về số người chơi, thiết bị, độ trễ mạng, hành vi người dùng...
4. Sau khi xóa các mục ở (1), phần nào ĐƠN GIẢN HÓA được tiếp?

Thứ tự ưu tiên khi đề xuất: xóa > đơn giản hóa > tối ưu > tự động hóa.
Không đề xuất tính năng mới. Không đề xuất đổi framework/thư viện.

DANH SÁCH CẤM ĐỀ XUẤT XÓA (chỉ được nêu quan sát):
- tools/steps-*.mjs và mọi script kiểm chứng trong tools/ — harness nghiệm thu.
- shots/ — lưu trữ ảnh nghiệm thu.
- Các file spec, lo-trinh, HANDOFF.md trong repo.
- Schema DB, logic auth/admin, xử lý purchase trong server/.
- Mọi thứ chạm vào dữ liệu người chơi.

Ràng buộc phiên: bám ngân sách context của skill vibe-game-workflow; nếu chạm ngưỡng,
dừng lại, ghi rõ trong AUDIT.md mục "còn khu vực chưa audit: ..." rồi báo để mở phiên mới.

Cuối phiên: tóm tắt 10 phát hiện quan trọng nhất, xếp theo (tác động × độ an toàn).
Commit duy nhất được phép là AUDIT.md. Dừng lại chờ duyệt — không tự thực hiện bất kỳ thay đổi nào.
```

---

## Prompt B — Tối ưu animation nhân vật (phiên riêng)

```
PHIÊN TỐI ƯU ANIMATION NHÂN VẬT — CHỈ XỬ LÝ ANIMATION

Phạm vi: chỉ sửa code animation của nhân vật người chơi + NPC (src/character.ts, phần
animation trong src/main.ts và file liên quan trực tiếp). Không đụng gameplay, server, DB, UI.

"Mượt" được đo bằng 4 tiêu chí nghiệm thu sau — không chấp nhận nhận xét cảm tính:
1. Không "pop": mọi chuyển đổi idle/walk/run/sit/bow/chắp tay/lần hạt đều có crossfade
   từ 0.12s trở lên; chụp chuỗi khung hình tại điểm chuyển đổi để chứng minh không nhảy hình.
2. Không phụ thuộc FPS: mọi chuyển động tính theo delta-time; kiểm chứng ở 30 FPS
   (throttle tab hoặc giả lập) — tốc độ chuyển động không đổi.
3. Không trượt chân (foot sliding) khi walk/run: tốc độ di chuyển khớp nhịp bước.
4. NPC ở xa: chuyển mức LOD không gây pop-in; chụp ảnh trước/sau tại ranh giới LOD.

Quy trình từng tiêu chí: chụp ảnh "trước" → sửa → chụp ảnh "sau" cùng góc, cùng tư thế
đóng băng → tự chấm đạt/chưa đạt trong báo cáo. Tiêu chí nào sửa 2 lần không đạt thì
dừng, báo cáo nguyên nhân, không cố lần thứ 3.

Mỗi tiêu chí một commit riêng, message: fix: <tiêu chí> — ví dụ "fix: crossfade all
action transitions". Typecheck pass trước mỗi commit. git add từng đường dẫn, không git add -A.
```

---

## Mẫu prompt thực thi (dùng sau khi AUDIT.md đã được duyệt)

```
Thực hiện các mục đã duyệt trong AUDIT.md thuộc khu vực <TÊN KHU VỰC> — chỉ các mục
đánh dấu [DUYỆT], bỏ qua mọi mục khác. Từng mục một commit riêng, message:
"refactor: <tên mục>". Sau mỗi mục: chạy npm run typecheck + script kiểm chứng liên
quan trong tools/; mục nào không qua kiểm chứng thì revert đúng mục đó và báo cáo,
không tự sửa tiếp theo cách khác. Cuối phiên: báo cáo bảng mục đã làm / đã revert / còn lại.
```

---

## Ghi chú vận hành

- Nếu lúc đó Vilao chưa có listing Fable 5.2 tử tế, chạy Prompt A bằng Opus 5.5 cũng được — audit là việc đọc là chính.
- Thời điểm gợi ý: chèn audit vào giữa R3 và R4, để bản public đầu tiên (landing + PWA) chạy trên codebase đã dọn; hoặc ngay sau R4 cũng chấp nhận được.
- Kỳ vọng thực tế: audit toàn repo sẽ dài hơn một phiên — AUDIT.md có mục "còn khu vực chưa audit" để nối phiên sau, đừng ép nó làm trọn trong một phiên.
