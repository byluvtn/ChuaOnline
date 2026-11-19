/** Câu đối / hoành phi thường treo ở chùa. Nguồn: tổng hợp từ dothosondong.com.vn (mẫu hoành phi câu đối ở chùa). */
export interface Couplet { id: string; where: string; am: [string, string]; nghia: string }

export const COUPLETS: Record<string, Couplet> = {
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
  tamThe: {
    id: 'tamThe', where: 'Điện Tam Thế — thờ ba đời chư Phật',
    am: ['Quá khứ hiện tại vị lai, ba đời chư Phật cùng một ánh từ quang', 'Một niệm tỉnh thức sáng soi, mười phương muôn cõi về nương cửa thiền'],
    nghia: 'Chư Phật ba đời quá khứ, hiện tại, vị lai cùng chiếu một ánh từ quang; một niệm tỉnh thức soi sáng, muôn cõi mười phương cùng về nương nơi cửa thiền.',
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
  tangXaTay: {
    id: 'tangXaTay', where: 'Tăng xá — nơi chư tăng nghỉ ngơi',
    am: ['Hiên vắng mái êm, chuông khuya đưa giấc ngủ', 'Phòng thanh gió nhẹ, kệ sớm gọi tâm an'],
    nghia: 'Hiên vắng, mái êm, tiếng chuông khuya đưa người vào giấc ngủ; phòng thanh, gió nhẹ, câu kệ buổi sớm gọi lòng trở về yên tĩnh.',
  },
  traiDuong: {
    id: 'traiDuong', where: 'Trai đường — nơi thọ trai',
    am: ['Bát cơm đạm bạc, nhớ ơn người gieo hạt', 'Chén canh thanh tịnh, nuôi lòng chẳng vướng tham'],
    nghia: 'Bát cơm đạm bạc, nhớ ơn người đã gieo trồng; chén canh thanh tịnh, nuôi thân mà lòng không vướng tham.',
  },
  dienMau: {
    id: 'dienMau', where: 'Điện Mẫu — thờ Thánh Mẫu',
    am: ['Mẫu nghi thiên hạ, lòng từ che chở đàn con', 'Đức rộng sông trời, ơn người nuôi dưỡng muôn nhà'],
    nghia: 'Mẫu là bậc mẹ của muôn dân, lòng từ che chở đàn con; đức rộng như sông trời, ơn nuôi dưỡng trải khắp muôn nhà.',
  },
  ngoc: {
    id: 'ngoc', where: 'Chùa Ngọc',
    am: ['Ngàn bậc thang đưa lên chùa Ngọc', 'Muôn đóa sen nở đón khách thiền'],
    nghia: 'Mỗi bậc thang lên chùa là một bước lắng lòng; hoa sen nở đón người tìm về chốn yên tĩnh.',
  },
  duocSu: {
    id: 'duocSu', where: 'Điện Dược Sư — thờ Phật Dược Sư',
    am: ['Ánh từ Dược Sư, bệnh khổ tiêu tan', 'Sen vàng tịnh độ, thân tâm an lạc'],
    nghia: 'Ánh từ bi của Phật Dược Sư nhắc người viếng mở lòng với những ai đang đau bệnh; sen vàng gợi sự bình an của thân và tâm.',
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
  phongSinh: {
    id: 'phongSinh', where: 'Nơi phóng sinh',
    am: ['Thả chim về trời rộng, thả cá về sông trong, lòng từ mở khắp muôn loài', 'Một niệm lành gieo xuống, muôn loài được sống, phước đức theo về'],
    nghia: 'Thả chim về trời, thả cá về sông là gieo một niệm lành; muôn loài được tự do, phước đức cũng theo đó mà lớn lên.',
  },
  vuonPhongSinh: {
    id: 'vuonPhongSinh', where: 'Vườn phóng sinh',
    am: ['Cây xanh chim hót giữa vườn, nắng mai soi rọi muôn loài', 'Người đi lòng nhẹ bước chân, gieo duyên lành khắp cỏ hoa'],
    nghia: 'Vườn phóng sinh là nơi chim cá được trở về tự nhiên; người tới đây lòng nhẹ nhõm, một bước chân cũng là một duyên lành.',
  },
  omikuji: {
    id: 'omikuji', where: 'Nơi xin xăm',
    am: ['Một quẻ xin xăm, lòng thành gửi gắm điều mong ước', 'Một lời Phật dạy, tâm an bước tiếp tháng ngày bình an'],
    nghia: 'Xin xăm là gieo một quẻ để lắng nghe lời Phật dạy; dù quẻ tốt hay chưa tốt, lòng thành và tâm an mới là điều quan trọng nhất.',
  },
  vuoncay: {
    id: 'vuoncay', where: 'Vườn Tây — Vườn cây',
    am: ['Tay gieo hạt nhỏ, cây lớn thành bóng mát che đời', 'Lòng tưới từng ngày, công đức theo cây lớn dần lên'],
    nghia: 'Vườn cây là nơi tự tay gieo hạt, tưới nước mỗi ngày; cây lớn lên thành bóng mát, công đức cũng theo đó mà lớn dần.',
  },
  phongCongDuc: {
    id: 'phongCongDuc', where: 'Phòng Công Đức',
    am: ['Sổ vàng ghi rõ, từng việc lành đều thành công đức', 'Lòng thành gửi gắm, từng đồng công quả đều sáng ngời'],
    nghia: 'Phòng Công Đức là nơi ghi lại mọi việc lành và công quả; từng việc nhỏ đều được trân trọng, từng đồng công đức đều sáng ngời.',
  },
  vienToGate: {
    id: 'vienToGate', where: 'Cổng Viện Tổ',
    am: ['Qua cổng Viện Tổ, lòng thành hướng về chư vị tổ sư', 'Bước chân thanh tịnh, một niệm tri ân nối dài muôn đời'],
    nghia: 'Viện Tổ là nơi thờ chư vị tổ sư đã khai sơn lập chùa; qua cổng này, người tới với một niệm tri ân và lòng thành kính.',
  },
  vienKtGate: {
    id: 'vienKtGate', where: 'Cổng Viện Khách Tăng',
    am: ['Viện Khách Tăng mở cửa, đón chư tăng bốn phương về tu học', 'Chốn thanh tịnh yên bình, tiếng kinh sớm chiều nuôi đạo hạnh'],
    nghia: 'Viện Khách Tăng là nơi chư tăng từ bốn phương về ở và tu học; chốn này thanh tịnh, tiếng kinh sớm chiều nuôi dưỡng đạo hạnh.',
  },
};

