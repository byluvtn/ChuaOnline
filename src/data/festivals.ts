export interface Festival {
  name: string;
  desc: string;
  lunarDay: number;
  lunarMonth: number;
  monthly?: boolean;
}

export const FESTIVALS: Festival[] = [
  { name: 'Rằm tháng Giêng', desc: 'Ngày rằm đầu năm, cầu an và lễ Phật.', lunarDay: 15, lunarMonth: 1 },
  { name: 'Vu Lan', desc: 'Lễ báo hiếu, cầu siêu cho ông bà cha mẹ.', lunarDay: 15, lunarMonth: 7 },
  { name: 'Rằm hằng tháng', desc: 'Ngày rằm mỗi tháng âm lịch.', lunarDay: 15, lunarMonth: 1, monthly: true },
];
