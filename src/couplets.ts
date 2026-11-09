/** Câu đối / hoành phi thường treo ở chùa. Nguồn: tổng hợp từ dothosondong.com.vn (mẫu hoành phi câu đối ở chùa). */
export interface Couplet { id: string; where: string; han: [string, string]; am: [string, string]; nghia: string }

export const COUPLETS: Record<string, Couplet> = {
  tamBao: {
    id: 'tamBao', where: 'Điện thờ Tam Bảo',
    han: ['佛日增輝普照十方常朗照', '法輪常轉濟度群生盡皈依'],
    am: ['Phật nhật tăng huy, phổ chiếu thập phương thường lãng chiếu', 'Pháp luân thường chuyển, tế độ quần sinh tận quy y'],
    nghia: 'Ánh sáng Phật rực rỡ, chiếu soi khắp mười phương; bánh xe Pháp luôn chuyển, cứu độ chúng sinh đều nương tựa.',
  },
  tamBao2: {
    id: 'tamBao2', where: 'Cột tiền đường',
    han: ['佛法無邊度盡群生登彼岸', '慈悲有感超凡入聖證菩提'],
    am: ['Phật pháp vô biên độ tận quần sinh đăng bỉ ngạn', 'Từ bi hữu cảm siêu phàm nhập thánh chứng Bồ-đề'],
    nghia: 'Phật pháp vô biên, độ hết chúng sinh qua bờ giác; lòng từ bi cảm ứng, giúp người siêu phàm nhập thánh, chứng quả Bồ-đề.',
  },
  mon: {
    id: 'mon', where: 'Hiên chính điện',
    han: ['佛門廣大收羅十方來客', '法海深沉普度四眾群生'],
    am: ['Phật môn quảng đại thu la thập phương lai khách', 'Pháp hải thâm trầm phổ độ tứ chúng quần sinh'],
    nghia: 'Cửa Phật rộng lớn, đón khách mười phương; biển pháp sâu dày, độ khắp bốn chúng sinh.',
  },
  tamQuan: {
    id: 'tamQuan', where: 'Tam quan',
    han: ['佛國莊嚴三有路', '法雲普潤四生天'],
    am: ['Phật quốc trang nghiêm tam hữu lộ', 'Pháp vân phổ nhuận tứ sinh thiên'],
    nghia: 'Cõi Phật trang nghiêm, mở lối ba cõi; mây pháp nhuần thấm, che khắp bốn loài.',
  },
  chuong: {
    id: 'chuong', where: 'Tháp chuông',
    han: ['鐘鼓樓前聲聲警覺塵寰客', '香燈殿裏念念歸依極樂天'],
    am: ['Chung cổ lâu tiền thanh thanh cảnh giác trần hoàn khách', 'Hương đăng điện lý niệm niệm quy y Cực Lạc thiên'],
    nghia: 'Tiếng chuông trống vang nơi gác, cảnh tỉnh khách trần gian; trong điện hương đăng, niệm niệm quy y về cõi Cực Lạc.',
  },
  thap: {
    id: 'thap', where: 'Tháp Quan Âm',
    han: ['寶塔凌雲千秋不壞', '金身映日萬世常存'],
    am: ['Bảo tháp lăng vân thiên thu bất hoại', 'Kim thân ánh nhật vạn thế thường tồn'],
    nghia: 'Tháp báu vươn mây, ngàn thu chẳng hư hoại; thân vàng soi nắng, muôn đời còn mãi.',
  },
};

export const HOANH_PHI = { dien: '大雄寶殿', trong: '佛日增輝', hien: '慈悲普度', thap: '圓覺', chuong: '法雨' };
