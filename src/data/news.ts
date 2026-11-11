export interface NewsItem {
  title: string;
  date: string;
  items: string[];
}

export const LATEST_NEWS_ID = 2;

export const NEWS: NewsItem[] = [
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
