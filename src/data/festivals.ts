export interface Festival {
  name: string;
  desc: string;
  lunarDay: number;
  lunarMonth: number;
  monthly?: boolean;
}

export const FESTIVALS: Festival[] = [
  { name: 'Tết Nguyên Đán', desc: 'Đón năm mới, thăm chùa và nhận lộc đầu năm.', lunarDay: 1, lunarMonth: 1 },
  { name: 'Vía Phật Di Lặc', desc: 'Ngày vía đức Phật Di Lặc, đầu năm cầu an vui.', lunarDay: 1, lunarMonth: 1 },
  { name: 'Lễ Thượng Nguyên', desc: 'Rằm tháng Giêng, cầu an đầu năm.', lunarDay: 15, lunarMonth: 1 },
  { name: 'Phật Thích Ca xuất gia', desc: 'Ngày đức Phật Thích Ca xuất gia tìm đạo.', lunarDay: 8, lunarMonth: 2 },
  { name: 'Phật nhập Niết-bàn', desc: 'Ngày đức Phật nhập Niết-bàn.', lunarDay: 15, lunarMonth: 2 },
  { name: 'Vía Quan Âm đản sinh', desc: 'Ngày vía Bồ Tát Quan Âm đản sinh.', lunarDay: 19, lunarMonth: 2 },
  { name: 'Đại lễ Phật Đản', desc: 'Ngày đức Phật đản sinh, lễ Vesak.', lunarDay: 15, lunarMonth: 4 },
  { name: 'Vía Quan Âm thành đạo', desc: 'Ngày vía Bồ Tát Quan Âm thành đạo.', lunarDay: 19, lunarMonth: 6 },
  { name: 'Lễ Vu Lan báo hiếu', desc: 'Lễ báo hiếu, cầu siêu cho ông bà cha mẹ.', lunarDay: 15, lunarMonth: 7 },
  { name: 'Vía Địa Tạng', desc: 'Ngày vía Bồ Tát Địa Tạng.', lunarDay: 30, lunarMonth: 7 },
  { name: 'Tết Trung Thu', desc: 'Rằm tháng Tám, rước đèn và ngắm trăng.', lunarDay: 15, lunarMonth: 8 },
  { name: 'Vía Quan Âm xuất gia', desc: 'Ngày vía Bồ Tát Quan Âm xuất gia.', lunarDay: 19, lunarMonth: 9 },
  { name: 'Lễ Hạ Nguyên', desc: 'Rằm tháng Mười, lễ Hạ Nguyên tạ ơn.', lunarDay: 15, lunarMonth: 10 },
  { name: 'Vía Phật A Di Đà', desc: 'Ngày vía đức Phật A Di Đà.', lunarDay: 17, lunarMonth: 11 },
  { name: 'Phật Thích Ca thành đạo', desc: 'Ngày đức Phật Thích Ca thành đạo.', lunarDay: 8, lunarMonth: 12 },
];
