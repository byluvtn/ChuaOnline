export interface NewsItem {
  title: string;
  date: string;
  items: string[];
}

export const LATEST_NEWS_ID = 1;

export const NEWS: NewsItem[] = [
  {
    title: 'Chào mừng đến Chùa Online',
    date: '2026-01-01',
    items: [
      'Dạo quanh khuôn viên chùa, thắp hương và tụng kinh để tích công đức.',
      'Xin xăm mỗi ngày một quẻ, tham gia các trò chơi nhỏ trong chùa.',
    ],
  },
];
