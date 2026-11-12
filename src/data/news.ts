export interface NewsItem {
  title: string;
  date: string;
  items: string[];
}

export const LATEST_NEWS_ID = 17;

export const NEWS: NewsItem[] = [
  {
    title: 'Sửa lỗi đơ máy và kẹt sau chùa',
    date: '2026-11-12',
    items: [
      'Đã sửa lỗi game đơ 20–40 giây khi bấm đi xa: đường đi giờ tính trong chưa tới 1 mili giây thay vì 5–28 giây.',
      'Nhân vật không còn kẹt ở hàng rào hai viện: hàng rào đổi thành tường liên tục, vẫn chặn được nhưng trượt dọc mượt, cổng vẫn đi qua được.',
      'Điện Tam Thế dời ra xa Chính Điện 8 m; Bảo Tháp dời về phía tây, không còn đè lên nền Tam Thế; cầu thang Tam Thế dài ra thành 20 bậc, dốc vừa phải.',
      'Ao Vườn Phóng Sinh có 6 cá koi bơi; bảng câu đối của các nhà thu nhỏ lại, vừa màn hình điện thoại.',
    ],
  },
  {
    title: 'Thêm sư thầy trực bàn, chú tiểu và phật tử',
    date: '2026-11-12',
    items: [
      'Chùa có 12 NPC: sư thầy trực bàn ghi công đức, 4 chú tiểu quét dọn, tiểu đánh chuông và 5 phật tử đi lễ.',
      'Tiểu đánh chuông đi lại quanh tháp và vườn cột kinh, về thỉnh chuông đúng giờ.',
      'Chú tiểu làm theo ca 20 phút, hết ca về tăng xá nằm nghỉ 10 phút trên giường rồi quay lại làm.',
      'Phật tử đi lễ có lúc rẽ thăm bến thả cá, bàn công đức, Điện Tam Thế hoặc đường hậu.',
    ],
  },
  {
    title: 'Sửa lỗi kẹt trong nhà',
    date: '2026-11-12',
    items: [
      'Đã sửa lỗi nhân vật bị kẹt khi đi lại trong các nhà: vật cản trong nhà và tường nhà không còn chồng lên nhau.',
      'Đèn dầu (đế gạch với chóp vàng) đã được dỡ khỏi các nhà vì đặt không hợp lý, nhất là trong thiền đường.',
    ],
  },
  {
    title: 'Tượng Quan Âm chibi mới',
    date: '2026-11-12',
    items: [
      'Tượng Quan Âm sân tượng vẽ lại theo thiết kế chibi v4: đầu to gần nửa chiều cao, mặt 3D mắt nhắm cười, má hồng to.',
      'Bình cam lộ đổi sang màu ngọc xanh, cành liễu lá tròn to, tay cầm chắc và rõ; vương miện vẫn có tượng Phật A Di Đà nhỏ.',
    ],
  },
  {
    title: 'Nội thất trong 7 nhà',
    date: '2026-11-12',
    items: [
      'Nhà Khách có bộ bàn trà và băng ghế dài; Tăng Xá có hai giường gỗ cùng bàn đèn dầu nhỏ.',
      'Trai Đường có bàn ăn dài, Nhà Tổ có ban thờ tổ với bài vị, lư hương và đôi bình hoa.',
      'Thiền Đường lát sàn gỗ, xếp hai dãy bồ đoàn ngồi thiền được thật cùng chiếc mõ gỗ; Phòng Ghi Công Đức có bàn dài, ghế trực và kệ sổ; Am Cổ có giường nhỏ, bồ đoàn và bàn trà.',
    ],
  },
  {
    title: 'Đi được tới Am Cổ',
    date: '2026-11-12',
    items: [
      'Sửa lỗi nhân vật bị chặn vô hình ở phía Bắc khuôn viên, nay có thể đi tới Am Cổ và vùng sát tường rào phía Bắc.',
    ],
  },
  {
    title: 'Tải mượt hơn, chuông đúng dáng',
    date: '2026-11-12',
    items: [
      'Gộp mesh các nhà (Nhà Tổ, Tăng Xá, Điện Mẫu, Nhà Khách, Thiền Đường, Trai Đường, Phòng Công Đức, Am Cổ) để giảm tải đồ họa.',
      'Chuông ở Tháp Chuông đã quay đúng chiều: miệng chuông hướng xuống.',
      'Ghế gỗ trong vườn giờ là vật cản.',
    ],
  },
  {
    title: 'Hành lang tượng vàng',
    date: '2026-11-12',
    items: [
      '12 tượng La Hán dọc hai hành lang giờ là 4 tượng cổ bằng vàng: La Hán cầm bình, nhà sư gỗ, Quan Âm ngồi và Quan Âm Thủy Nguyệt.',
    ],
  },
  {
    title: 'Tượng Phật vàng ở Vườn Tháp',
    date: '2026-11-12',
    items: [
      'Vườn Tháp có thêm một pho tượng Phật ngồi dát vàng bóng, đặt trên bệ đá, được dựng từ bản quét 3D của Bảo tàng Nghệ thuật Cleveland (CC0).',
      'Đi tới Vườn Tháp để ngắm tượng; tượng và bệ đá là vật cản nên nhân vật sẽ đi vòng quanh.',
    ],
  },
  {
    title: 'Chuyển động mượt hơn',
    date: '2026-11-12',
    items: [
      'Nhân vật tăng tốc và giảm tốc từ từ khi đi, chạy và dừng lại, không còn bật tắt đột ngột.',
      'Bước chân khớp với tốc độ di chuyển nên chân không còn trượt trên mặt đất.',
      'Khi bấm đi tới một điểm, nhân vật chậm dần khi đến gần; khi đổi hướng ngược lại sẽ giảm tốc rồi mới quay đầu.',
    ],
  },
  {
    title: 'Điện Tam Thế',
    date: '2026-11-12',
    items: [
      'Phía sau chánh điện có thêm Điện Tam Thế thờ ba vị Phật quá khứ, hiện tại và vị lai; đi từ tam quan lên qua các bậc thềm là tới nơi.',
      'Bản đồ chùa được chỉnh lại, nhãn các địa điểm không còn chồng lên nhau.',
      'Vào bên trong điện, góc nhìn tự lùi ra một chút để thấy đủ ba pho tượng.',
    ],
  },
  {
    title: 'Mở rộng khuôn viên chùa',
    date: '2026-11-11',
    items: [
      'Khuôn viên chùa rộng thêm hẳn: phía sau có Viện Khách Tăng và Viện Tổ — Tưởng niệm, mỗi viện một sân riêng có cổng.',
      'Mới có Vườn Phóng Sinh ở phía Đông chánh điện với ao và bến thả cá, phố nhỏ trước cổng chùa bán cơm chay, trà đá, phở chay.',
      'Thiền đường dời về bên vườn thiền, mặt hướng Đông; thêm Phòng Ghi Công Đức ở góc Tây Nam. Hành lang La Hán cũng rộng và thoáng hơn.',
    ],
  },
  {
    title: 'Lần hạt 108',
    date: '2026-11-11',
    items: [
      'Thêm tính năng Lần hạt: chạm từng hạt, đủ 108 hạt là hoàn thành một vòng — nhận công đức và xu.',
      'Mỗi ngày thưởng tối đa 5 vòng; các vòng sau vẫn tính vào Thành tựu tích lũy.',
      'Thêm 3 mốc thành tựu mới cho người lần hạt: 5, 25 và 100 vòng (xem trong mục Cấp độ).',
      'Vào giờ lễ và ngày Mùng 1, Rằm, công đức lần hạt cũng được nhân như các hành lễ khác.',
    ],
  },
  {
    title: 'Thành tựu tích lũy',
    date: '2026-11-11',
    items: [
      'Từ nay mỗi lần lễ Phật, tụng kinh, thả đèn và ngồi thiền đều được nhà chùa ghi nhận vào thành tựu tích lũy trọn đời.',
      'Đạt các mốc 100 lần lạy, 50 lượt kinh, 20 đèn hoa đăng, 30 phút thiền… là nhận xu và lễ vật ngay. Xem tiến độ trong mục Cấp độ.',
    ],
  },
  {
    title: 'Giờ lễ nhân công đức',
    date: '2026-11-11',
    items: [
      'Vào giờ tụng kinh 05:00, 12:00 và 20:00 mỗi ngày, mọi công đức từ thắp hương, lễ Phật, tụng kinh và thả đèn được nhân đôi (×2).',
      'Ngày Mùng 1 và Rằm âm lịch, công đức được nhân ×1,5 cả ngày; trùng giờ tụng kinh thì nhân ×3.',
    ],
  },
  {
    title: 'Vòng quay may mắn',
    date: '2026-11-11',
    items: [
      'Mỗi ngày quay 1 lượt miễn phí trong mục Trò chơi: trúng công đức, xu, Hương trầm và ô ĐẠI CÁT 100 công đức + 100 xu.',
    ],
  },
  {
    title: 'Hòm thư nhà chùa',
    date: '2026-11-11',
    items: [
      'Mở mục Hòm thư để đọc thư chào mừng kèm quà khi mới vào chùa: 20 công đức, 30 xu và lễ vật.',
      'Phật tử đã đồng hành từ trước cũng có quà ra mắt trong hòm thư — nhớ mở ra nhận nhé.',
    ],
  },
  {
    title: 'Điểm danh mỗi ngày',
    date: '2026-11-11',
    items: [
      'Mỗi ngày vào mục Điểm danh nhận công đức và xu; giữ chuỗi đủ 7 ngày để nhận thêm Đèn hoa đăng.',
      'Ngày mới bắt đầu lúc 07:00 giờ Việt Nam.',
    ],
  },
  {
    title: 'Chào mừng đến Chùa Online',
    date: '2026-01-01',
    items: [
      'Dạo quanh khuôn viên chùa, thắp hương và tụng kinh để tích công đức.',
      'Xin xăm mỗi ngày một quẻ, tham gia các trò chơi nhỏ trong chùa.',
    ],
  },
];
