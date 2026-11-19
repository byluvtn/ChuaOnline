import type { BondNpcDef } from './rituals.js';

/** Sáu người phụ trách có truyện riêng. id trùng NPC_DEFS. */
export const BOND_NPCS: BondNpcDef[] = [
  {
    id: 'npc42',
    chapters: [
      { title: 'Đèn trên cầu sen', story: 'Cô kể mình trông đình sen đã nhiều năm, mỗi tối đều thắp một ngọn đèn nhỏ cho khách đi muộn. Tuần này hết dầu, cô nhờ bạn mang một đèn hoa đăng.', ask: { item: 'den_hoa_dang', qty: 1 }, reward: { merit: 20, coins: 20 } },
      { title: 'Hoa sen đầu mùa', story: 'Cô bảo búp sen đầu mùa luôn nở bên mép đình. Cô muốn cắm hai bông sen lên bàn thờ nhỏ trong đình và nhờ bạn mang giúp.', ask: { item: 'hoa_sen', qty: 2 }, reward: { merit: 35, coins: 30 } },
      { title: 'Lời cảm ơn của cô', story: 'Cô nói đã lâu mới có người ngồi nghe cô kể chuyện đình sen. Cô muốn thắp ba nén hương trầm tạ ơn trời đất, và tặng bạn một món quà nhỏ.', ask: { item: 'huong_tram', qty: 3 }, reward: { merit: 60, coins: 50, item: 'hoa_dang_phat' } },
    ],
  },
  {
    id: 'npc40',
    chapters: [
      { title: 'Luống rau đầu tiên', story: 'Chú tiểu kể phải gánh nước từ ao sen nhỏ mỗi sáng mới đủ tưới cả luống cải. Chú nhờ bạn mang một ly trà đá cho đỡ khát.', ask: { item: 'tra_da', qty: 1 }, reward: { merit: 20, coins: 20 } },
      { title: 'Hạt giống mới', story: 'Chú muốn gieo thêm một luống mới nhưng đã hết hạt. Chú nhờ bạn kiếm giúp hai hạt sồi từ Vườn Cây.', ask: { item: 'hat_soi', qty: 2 }, reward: { merit: 35, coins: 30 } },
      { title: 'Bữa cơm rau', story: 'Chú mời bạn bữa cơm chay đầu tiên từ rau chính tay chú trồng. Chú chỉ xin bạn một tô phở chay để ăn cùng.', ask: { item: 'pho_chay', qty: 1 }, reward: { merit: 60, coins: 50, item: 'huong_tram' } },
    ],
  },
  {
    id: 'npc39',
    chapters: [
      { title: 'Lời nguyện Dược Sư', story: 'Sư cô trông điện Dược Sư kể mỗi ngày có nhiều người đến cầu cho người thân mau khỏe. Sư cô cần thêm nến để thắp trước bàn thờ.', ask: { item: 'nen_sap_ong', qty: 2 }, reward: { merit: 20, coins: 20 } },
      { title: 'Bát nước lưu ly', story: 'Sư cô kể về bát thuốc nước vàng trên tay Đức Phật Dược Sư. Sư cô muốn dâng một bông hoa sen.', ask: { item: 'hoa_sen', qty: 1 }, reward: { merit: 35, coins: 30 } },
      { title: 'Ngọn đèn chữa lành', story: 'Sư cô muốn thắp một ngọn đèn hoa đăng cầu an cho tất cả người đang bệnh và tặng bạn lời chúc bình an.', ask: { item: 'den_hoa_dang', qty: 2 }, reward: { merit: 60, coins: 50, item: 'trang_hat' } },
    ],
  },
  {
    id: 'npc41',
    chapters: [
      { title: 'Ba trăm bậc thang', story: 'Chú tiểu quét thang Ngọc kể mỗi ngày phải quét gần ba trăm bậc, lá rụng chưa kịp sạch đã đầy. Chú nhờ bạn mang trà đá cho đỡ mệt.', ask: { item: 'tra_da', qty: 2 }, reward: { merit: 20, coins: 20 } },
      { title: 'Nghỉ chân trên chiếu nghỉ', story: 'Chú kể mình thích ngồi ở chiếu nghỉ giữa thang nhìn xuống sân chùa. Chú muốn thắp một nén hương ở đó.', ask: { item: 'huong_tram', qty: 1 }, reward: { merit: 35, coins: 30 } },
      { title: 'Đỉnh Chùa Ngọc', story: 'Chú hứa sẽ dẫn bạn lên đỉnh ngắm cả khuôn viên khi trời quang. Chú nhờ bạn mang theo một đèn hoa đăng để thắp trên đó.', ask: { item: 'den_hoa_dang', qty: 1 }, reward: { merit: 60, coins: 50, item: 'hoa_dang_phat' } },
    ],
  },
  {
    id: 'npc13',
    chapters: [
      { title: 'Điện Mẫu đầu năm', story: 'Sư cô trông điện Mẫu kể ngày rằm người đến đông, hương khói không ngớt. Sư cô nhờ bạn một bó hương trầm.', ask: { item: 'huong_tram', qty: 2 }, reward: { merit: 20, coins: 20 } },
      { title: 'Hoa dâng Mẫu', story: 'Sư cô muốn bày một lẵng hoa trước ban thờ. Sư cô nhờ bạn mang hai bông hoa dâng.', ask: { item: 'hoa_dang_phat', qty: 2 }, reward: { merit: 35, coins: 30 } },
      { title: 'Lời chúc của Mẫu', story: 'Sư cô nói bạn đã là người quen của điện Mẫu. Sư cô xin một đèn hoa đăng để cầu bình an cho mọi người rồi tặng bạn một món quà.', ask: { item: 'den_hoa_dang', qty: 1 }, reward: { merit: 60, coins: 50, item: 'hoa_sen' } },
    ],
  },
  {
    id: 'npc38',
    chapters: [
      { title: 'Cây đầu tiên', story: 'Chú tiểu trồng cây kể gốc bồ đề đầu tiên trong vườn do chính chú gieo. Chú nhờ bạn một hạt sồi để gieo thử.', ask: { item: 'hat_soi', qty: 1 }, reward: { merit: 20, coins: 20 } },
      { title: 'Hạt bồ đề', story: 'Chú bảo hạt bồ đề lâu lớn nhưng cây rất thiêng. Chú xin bạn một hạt bồ đề để trồng ở góc vườn.', ask: { item: 'hat_bo_de', qty: 1 }, reward: { merit: 35, coins: 30 } },
      { title: 'Bóng mát cho người sau', story: 'Chú nói cây trồng hôm nay là bóng mát cho người đến sau. Chú xin hai hạt thông để trồng thêm và tặng bạn một món quà.', ask: { item: 'hat_thong', qty: 2 }, reward: { merit: 60, coins: 50, item: 'hat_bo_de' } },
    ],
  },
];

export const BOND_BY_ID: Record<string, BondNpcDef> = Object.fromEntries(BOND_NPCS.map((n) => [n.id, n]));
