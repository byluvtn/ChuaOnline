export interface Fortune {
  grade: string;
  poem: string[];
  career: string;
  love: string;
  health: string;
  wealth: string;
}

export const FORTUNES: Fortune[] = [
  {
    grade: 'Thượng thượng',
    poem: ['Mây tan trăng sáng giữa trời', 'Lòng ngay một dạ, đường đời rộng thênh'],
    career: 'Thuận lợi, có quý nhân giúp đỡ.',
    love: 'Duyên lành gặp gỡ, kết đôi hòa hợp.',
    health: 'Bình an, tinh thần sáng khoái.',
    wealth: 'Tiền tài dồi dào, của cải hanh thông.',
  },
  {
    grade: 'Trung bình',
    poem: ['Gió nhẹ đưa thuyền qua sông', 'Chậm mà chắc, dạ vững lòng an'],
    career: 'Cần kiên nhẫn, việc lớn nên chia nhỏ.',
    love: 'Nhẹ nhàng, cần thêm thời gian thấu hiểu.',
    health: 'Ổn định, nên giữ nếp sinh hoạt đều.',
    wealth: 'Vừa đủ, tránh đầu tư mạo hiểm.',
  },
  {
    grade: 'Hạ hạ',
    poem: ['Mưa dầm che khuất lối đi', 'Giữ tâm tĩnh lặng, sóng kia sẽ tàn'],
    career: 'Có trở ngại, nên cẩn trọng lời ăn tiếng nói.',
    love: 'Dễ hiểu lầm, cần mở lòng thật thà.',
    health: 'Chú ý nghỉ ngơi, giữ ấm cơ thể.',
    wealth: 'Hạn chế chi tiêu, giữ của phòng thân.',
  },
];
