# Ghi chú bàn giao

## Chạy dự án
- `npm install`
- `npm run dev` chạy cả API (cổng 3001) và Vite (cổng 5173).
- `npm run typecheck` kiểm tra kiểu. Thư mục `data` không nằm trong repo, copy riêng nếu cần dữ liệu cũ.

## Đã làm (src/character.ts, 4 nhân vật monk/nun/male/female)
- Tay buông thõng mặc định. Bàn tay tròn, không ngón, đường kính 0.09×H (`HAND_R`), màu da #F7DFC0, khoảng 1/4 quả cầu chìm trong tay áo.
- Chỉ chắp tay khi `incense`, `chant`, `bow` (`RITUAL`, trọng số `prayW`, IK hai xương `solveArm`). Hương (`holdInc`) và hoa sen (`holdLotus`) chỉ hiện lúc đó.
- Chuỗi hạt sư là vòng 3D 14 hạt. Vai bo tròn (`shCap`).
- Đã bỏ cơ chế kéo giãn tay (`setReach`). Độ dài tay cố định `AL1`, `AL2`.
- Thắp hương: đạt (chắp tay trước ngực, 3 nén hương).

## Việc còn dở
1. **Lạy sâu (`anim === 'bow'`) chưa đạt.** Tay chắp được cắm vào điểm cố định `BOW_HAND` trên sàn trước đầu gối (đổi sang không gian thân theo góc cúi `th`). Ảnh nhìn nghiêng cho thấy nhân vật nằm sấp ngang thay vì quỳ gấp lưng, chưa xác nhận tay chạm sàn. Cần chỉnh `th` (đang 1.35), `BOW_HAND`, độ cao hông `hy`, `kneel`.
2. Người dùng chưa xác nhận bản tay ngắn 0.09H ở màn chọn nhân vật. Nếu tay trông quá trắng so với đầu, đổi `handM` (đang `MeshBasicMaterial`) sang chất liệu toon giống đầu.
3. Chụp lại ảnh màn chọn cho nun và male.
4. Commit riêng cho phần tay chưa tách (đang nằm trong commit import đầu tiên).

## Chụp ảnh kiểm tra
- `STEPS=./steps-X.mjs node tools/shot.mjs /tmp/shots/<prefix>` (Chrome headless, swiftshader). Mỗi file steps xuất mặc định một hàm nhận `{ ev, shot, sleep }`. Xem `tools/steps-*.mjs` làm mẫu.
- Swiftshader chạy chậm, hành động 2.5 giây dễ bị chụp lệch khung. Cách ổn định: thêm tạm hook dev ở `src/main.ts` (trong vòng `remotes.forEach`) gọi `animateCharacter(char, anim, 100 + e)` với `e` cố định, chụp, rồi gỡ hook. Ví dụ lạy sâu: `e` khoảng 1.7 (lúc `down` gần 1).
- Hook dev hiện có: `window.__co` (`me`, `remotes`, `camera`, `pick`, `freeze`, `pvRot`...) chỉ có ở bản DEV.
- Trước khi chạy lại: `pkill -f remote-debugging-port`. Trên macOS tránh `timeout` và `sed -i` kiểu GNU.
