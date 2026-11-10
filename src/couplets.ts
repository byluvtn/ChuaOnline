/** Câu đối / hoành phi thường treo ở chùa. Nguồn: tổng hợp từ dothosondong.com.vn (mẫu hoành phi câu đối ở chùa). */
export interface Couplet { id: string; where: string; am: [string, string]; nghia: string }

export const COUPLETS: Record<string, Couplet> = {
  tamBao: {
    id: 'tamBao', where: 'Điện thờ Tam Bảo',
    am: ['Phật nhật tăng huy, phổ chiếu thập phương thường lãng chiếu', 'Pháp luân thường chuyển, tế độ quần sinh tận quy y'],
    nghia: 'Ánh sáng Phật rực rỡ, chiếu soi khắp mười phương; bánh xe Pháp luôn chuyển, cứu độ chúng sinh đều nương tựa.',
  },
  tamQuan: {
    id: 'tamQuan', where: 'Tam quan',
    am: ['Phật quốc trang nghiêm tam hữu lộ', 'Pháp vân phổ nhuận tứ sinh thiên'],
    nghia: 'Cõi Phật trang nghiêm, mở lối ba cõi; mây pháp nhuần thấm, che khắp bốn loài.',
  },
  chuong: {
    id: 'chuong', where: 'Tháp chuông',
    am: ['Chung cổ lâu tiền thanh thanh cảnh giác trần hoàn khách', 'Hương đăng điện lý niệm niệm quy y Cực Lạc thiên'],
    nghia: 'Tiếng chuông trống vang nơi gác, cảnh tỉnh khách trần gian; trong điện hương đăng, niệm niệm quy y về cõi Cực Lạc.',
  },
  trong: {
    id: 'trong', where: 'Tháp trống',
    am: ['Cổ thanh viễn chấn thiền đình, phiền não tùy thanh tiêu tán', 'Pháp cổ cao minh Phật địa, thành tâm nhất niệm giác viên'],
    nghia: 'Tiếng trống vang xa sân thiền, phiền não theo tiếng mà tan; trống pháp vọng nơi cõi Phật, một lòng thành đã tỏ.',
  },
  denTrinh: {
    id: 'denTrinh', where: 'Đền Trình',
    am: ['Nhập môn tiên bái, trần ai nhất niệm tẩy', 'Trình diện đầu hương, tịnh tâm vạn lự thanh'],
    nghia: 'Vừa vào cửa chùa, dừng chân thắp nén hương trình diện; một niệm gột sạch bụi trần, lòng tịnh thì muôn nỗi lo cũng lắng.',
  },
  thuyDinh: {
    id: 'thuyDinh', where: 'Thủy Đình',
    am: ['Thủy thượng đình đài, nhất niệm tâm đăng chiếu bích ba', 'Liên trung thiền ảnh, vạn duyên trần cảnh tận thành không'],
    nghia: 'Đình dựng trên mặt nước, một niệm đèn tâm soi sáng làn sóng biếc; bóng thiền giữa hoa sen, muôn duyên bụi trần đều hóa thành không.',
  },
  thap: {
    id: 'thap', where: 'Tháp Quan Âm',
    am: ['Bảo tháp lăng vân thiên thu bất hoại', 'Kim thân ánh nhật vạn thế thường tồn'],
    nghia: 'Tháp báu vươn mây, ngàn thu chẳng hư hoại; thân vàng soi nắng, muôn đời còn mãi.',
  },
};

