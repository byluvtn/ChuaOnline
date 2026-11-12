export interface NewsItem {
  title: string;
  date: string;
  items: string[];
}

export const LATEST_NEWS_ID = 7;

export const NEWS: NewsItem[] = [
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
