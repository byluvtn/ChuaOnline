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
  baoThap: {
    id: 'baoThap', where: 'Bảo Tháp — nơi thờ xá lợi',
    am: ['Xá lợi cung tàng, bảo tháp thập trùng quang chiếu thế', 'Giác hoa thường thịnh, từ bi nhất niệm phổ lưu phương'],
    nghia: 'Xá lợi được tôn thờ trong tháp báu nhiều tầng, ánh sáng soi khắp cõi đời; hoa giác ngộ mãi nở, một niệm từ bi lan tỏa muôn nơi.',
  },
  nhaTo: {
    id: 'nhaTo', where: 'Nhà Tổ — thờ chư vị tổ sư',
    am: ['Tổ đức lưu phương, đèn tuệ soi đường muôn kiếp', 'Thiền phong truyền thế, nguồn từ thấm đượm ngàn đời'],
    nghia: 'Đức Tổ sư lưu truyền, đèn tuệ soi đường muôn kiếp; thiền phong nối tiếp, nguồn từ bi thấm đượm ngàn đời.',
  },
  tangXa: {
    id: 'tangXa', where: 'Tăng xá — nơi chư tăng tu học',
    am: ['Tăng xá thanh u, sớm chuông chiều mõ nuôi đạo hạnh', 'Thiền phòng tĩnh tại, đèn kinh một ngọn sáng lòng người'],
    nghia: 'Nhà tăng thanh tịnh, chuông mai mõ chiều nuôi dưỡng đạo hạnh; thiền phòng yên lặng, một ngọn đèn kinh sáng lòng người.',
  },
  dienMau: {
    id: 'dienMau', where: 'Điện Mẫu — thờ Thánh Mẫu',
    am: ['Mẫu nghi thiên hạ, lòng từ che chở đàn con', 'Đức rộng sông trời, ơn người nuôi dưỡng muôn nhà'],
    nghia: 'Mẫu là bậc mẹ của muôn dân, lòng từ che chở đàn con; đức rộng như sông trời, ơn nuôi dưỡng trải khắp muôn nhà.',
  },
  nhaKhach: {
    id: 'nhaKhach', where: 'Nhà khách — đón khách thập phương',
    am: ['Cửa chùa rộng mở, khách bốn phương đều là bạn', 'Chén trà thanh đạm, duyên lành gặp gỡ ngàn xưa'],
    nghia: 'Cửa chùa luôn rộng mở, khách bốn phương đều thành bạn; chén trà thanh đạm gợi duyên lành gặp gỡ từ ngàn xưa.',
  },
  thienDuong: {
    id: 'thienDuong', where: 'Thiền đường — nơi ngồi thiền tĩnh tâm',
    am: ['Ngồi lặng giữa đời, tâm tĩnh như trăng soi đáy nước', 'Thở nhẹ theo hơi, lòng yên tựa núi giữa mây trời'],
    nghia: 'Ngồi lặng giữa cõi đời, tâm tĩnh như trăng soi đáy nước; thở nhẹ theo hơi, lòng yên như núi giữa mây trời.',
  },
  vuonThap: {
    id: 'vuonThap', where: 'Vườn Tháp — nơi an nghỉ chư tăng',
    am: ['Tháp cổ rêu phong, bóng thiền lặng giữ ngàn năm', 'Nắm tro đã tịnh, hương linh về cõi Niết Bàn'],
    nghia: 'Tháp xưa rêu phủ, bóng thiền lặng lẽ giữ ngàn năm; nắm tro đã tịnh, hương linh về cõi Niết Bàn.',
  },
  amCo: {
    id: 'amCo', where: 'Am Cổ — nơi tĩnh tu',
    am: ['Am cổ u tịch, một nén hương trầm thông cõi tịnh', 'Rêu xanh phủ mái, ngàn năm tiếng kệ vọng non cao'],
    nghia: 'Am xưa vắng lặng, một nén hương trầm nối về cõi tịnh; rêu xanh phủ mái, tiếng kệ ngàn năm còn vọng núi cao.',
  },
  thap: {
    id: 'thap', where: 'Tháp Quan Âm',
    am: ['Bảo tháp lăng vân thiên thu bất hoại', 'Kim thân ánh nhật vạn thế thường tồn'],
    nghia: 'Tháp báu vươn mây, ngàn thu chẳng hư hoại; thân vàng soi nắng, muôn đời còn mãi.',
  },
};

