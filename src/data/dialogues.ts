export type TimeSlot = 'morning' | 'noon' | 'afternoon' | 'evening' | 'any';

export interface GreetingLine {
  /** Khung giờ dùng câu này. */
  time: TimeSlot;
  text: string;
}

export interface NpcDialogue {
  name: string;
  role: string;
  /** 2–3 câu chào, mỗi câu ghi rõ khung giờ (xem quy ước ở đầu file). */
  greetings: GreetingLine[];
  /** Câu giao việc. "" = NPC không giao việc. */
  questOffer: string;
  /** Câu nhắc việc khi đã nhận mà chưa xong. "" = không giao việc. */
  questReminder: string;
  /** Lời cảm ơn khi trả việc / nhận đồ. "" = không giao/nhận việc. */
  questDone: string;
  /** Lời giao/nhắc/cảm ơn RIÊNG cho từng nhiệm vụ phụ của NPC nhiều việc
      (key = quest id trong shared/game.ts NPC_QUESTS). NPC chỉ có 1 việc thì
      không cần field này — dùng questOffer/questReminder/questDone chính. */
  questLines?: Record<string, { offer: string; reminder: string; done: string }>;
  /** 2–3 câu tán gẫu, xoay vòng theo ngày. */
  smallTalk: string[];
  /** 1–2 câu tạm biệt. */
  farewell: string[];
  /** Chỉ NPC ngồi tụng kinh: 1 câu ngắn hiện khi đang tụng. */
  chanting?: string;
  /** Chỉ người bán hàng (npc15–npc18): câu chào bán ở quầy. */
  shopGreeting?: string;
}

export const DIALOGUES: Record<string, NpcDialogue> = {
  // npc1 — Sư Thầy, trụ trì. Giao: C1 (chuỗi nhập môn), Q8, Q9, Q11, Q14.
  npc1: {
    name: 'Sư Thầy',
    role: 'Trụ trì',
    greetings: [
      { time: 'morning', text: 'Mô Phật. Buổi sáng an lành, thí chủ dậy sớm lễ Phật à?' },
      { time: 'noon', text: 'Mô Phật. Trưa rồi, thí chủ đã dùng cơm chay chưa?' },
      { time: 'evening', text: 'Mô Phật. Chiều tối rồi, thí chủ lễ Phật xong thì về cẩn thận nhé.' },
    ],
    questOffer: 'Vào chùa thì tâm phải tĩnh. Con lạy Phật một lạy ở Chính Điện đi, rồi hẵng làm việc khác.',
    questReminder: 'Con lạy Phật ở Chính Điện chưa? Xong rồi quay lại đây gặp thầy nhé.',
    questDone: 'Tốt lắm. Tâm con đã tĩnh hơn rồi đấy, cứ giữ như vậy mà tu tập.',
    questLines: {
      nq_ngoc_pilgrimage: {
        offer: 'Con đi vòng qua Điện Tam Thế, theo thang 299 bậc lên Chùa Ngọc rồi quay về gặp thầy nhé.',
        reminder: 'Chùa Ngọc ở trên đồi phía Bắc, sau Điện Tam Thế. Con đi thong thả thôi.',
        done: 'Con đã tới đỉnh đồi rồi. Ngồi nghỉ một chút, giữ tâm an nhé.',
      },
      nq_bow_tamthe: {
        offer: 'Con đảnh lễ Tam Thế ba lạy giúp thầy nhé, lòng có thành thì Phật mới chứng.',
        reminder: 'Ba lạy trước điện Tam Thế con đã lạy xong chưa? Xong rồi quay lại gặp thầy nhé.',
        done: 'Ba lạy thành tâm lắm, thầy mừng cho con. Mô Phật.',
      },
      nq_chant_thienduong: {
        offer: 'Con vào Thiền Đường tụng kinh một lát đi, tụng xong lòng sẽ nhẹ hẳn.',
        reminder: 'Con tụng kinh ở Thiền Đường xong chưa? Thầy chờ con về kể thầy nghe nhé.',
        done: 'Tiếng kinh của con hay lắm, thầy nghe vọng tới tận đây. Mô Phật.',
      },
      nq_buy_cake: {
        offer: 'Con ra quầy Bác Bán Bánh mua giúp thầy một ít bánh, mang về đây thầy dùng nhé.',
        reminder: 'Bánh ở quầy Bác Bán Bánh con mua chưa? Thầy đang đợi đây nhé.',
        done: 'Bánh thơm quá, cảm ơn con. Thầy sẽ dâng cúng trước rồi mới dùng.',
      },
      nq_buy_fruit: {
        offer: 'Con ra quầy Cô Bán Hoa Quả mua giúp thầy ít trái cây, thầy dùng làm mâm cúng nhé.',
        reminder: 'Trái cây ở quầy Cô Bán Hoa Quả con mua chưa? Mua xong mang về cho thầy nhé.',
        done: 'Trái cây tươi ngon quá, cảm ơn con. Mâm cúng hôm nay đầy đủ rồi.',
      },
    },
    smallTalk: [
      'Chùa này xây đã lâu, cây bồ đề trước sân là do sư ông trồng đấy.',
      'Tâm an thì đi đâu cũng là chùa.',
      'Ngày rằm chùa đông lắm, thí chủ nhớ về sớm kẻo hết chỗ ngồi thiền.',
    ],
    farewell: [
      'Mô Phật, thí chủ về bình an.',
      'Đi thong thả, nhớ giữ tâm an nhé.',
    ],
    chanting: 'Mô Phật, thí chủ cứ tự nhiên lễ Phật.',
  },

  // npc37 — Sư Ông, trụ trì già cầm gậy. Giao 3 việc mỗi ngày, xoay cửa sổ 3 việc/ngày (dq_*), reset 00:00 VN.
  npc37: {
    name: 'Sư Ông',
    role: 'Trụ trì già',
    greetings: [
      { time: 'morning', text: 'Mô Phật. Sáng rồi, thí chủ dậy sớm thế. Thầy đang đi dạo một vòng cho khỏe chân.' },
      { time: 'noon', text: 'Mô Phật. Trưa rồi, thí chủ ghé chùa giữa nắng thế này, quý lắm.' },
      { time: 'evening', text: 'Mô Phật. Chiều tối rồi, thí chủ còn ở chùa thì ở lại nghe một thời kinh đã nhé.' },
    ],
    questOffer: 'Mô Phật. Mỗi ngày thầy có ba việc nhỏ trong chùa, thí chủ giúp thầy một tay nhé. Nhận cả ba rồi làm dần, xong việc nào thì quay lại đây gặp thầy.',
    questReminder: 'Ba việc hôm nay con làm tới đâu rồi? Xong việc nào thì cứ về đây gặp thầy, thầy trả công ngay.',
    questDone: 'Tốt lắm, con làm chu đáo lắm. Thầy mừng cho con, cứ giữ như vậy mà tu tập.',
    questLines: {
      dq_sweep: {
        offer: 'Sân chùa lá rụng nhiều quá, thí chủ giúp thầy quét ba chỗ dưới cây sồi nhé.',
        reminder: 'Sân còn lá ở mấy chỗ dưới cây sồi đấy, thí chủ quét nốt giúp thầy nhé.',
        done: 'Sân sạch rồi, cảm ơn con nhiều lắm.',
      },
      dq_bow: {
        offer: 'Con vào Điện Tam Thế đảnh lễ ba lạy giúp thầy nhé, lòng có thành thì Phật mới chứng.',
        reminder: 'Ba lạy trước điện Tam Thế con lạy xong chưa? Xong rồi quay lại gặp thầy nhé.',
        done: 'Ba lạy thành tâm lắm, thầy mừng cho con. Mô Phật.',
      },
      dq_sutra: {
        offer: 'Con vào Thiền Đường tụng một bài kinh giúp thầy nhé, tụng xong lòng sẽ nhẹ hẳn.',
        reminder: 'Bài kinh ở Thiền Đường con tụng xong chưa? Thầy chờ con về kể thầy nghe nhé.',
        done: 'Tiếng kinh của con hay lắm, thầy nghe vọng tới tận đây. Mô Phật.',
      },
      dq_incense: {
        offer: 'Con thắp giúp thầy ba nén hương nhé, thắp ở đâu cũng được, miễn là lòng thành.',
        reminder: 'Ba nén hương con thắp xong chưa? Xong rồi về đây gặp thầy nhé.',
        done: 'Hương thơm bay khắp chùa rồi, cảm ơn con nhé.',
      },
      dq_lantern: {
        offer: 'Con thả giúp thầy một đèn hoa đăng xuống hồ sen nhé, đèn mang điều ước của con đi xa lắm.',
        reminder: 'Đèn hoa đăng con thả xuống hồ sen chưa? Thả rồi thì về gặp thầy nhé.',
        done: 'Đèn sáng đẹp quá, điều ước của con nhất định thành. Mô Phật.',
      },
      dq_feed: {
        offer: 'Chó mèo trong chùa đói rồi, thí chủ cho tụi nó ăn một bữa giúp thầy nhé.',
        reminder: 'Chó mèo còn đợi con cho ăn đấy, lại gần tụi nó rồi cho ăn nhé.',
        done: 'Tụi nó ăn no rồi, quấn con lắm đấy. Cảm ơn con nhé.',
      },
      dq_release: {
        offer: 'Con ra quầy mua chim hay cá rồi thả ở bến phóng sinh giúp thầy nhé, cứu một mạng cũng là gieo một hạt lành.',
        reminder: 'Chim cá con mua rồi thì mang ra bến thả đi, xong rồi nhớ quay lại đây gặp thầy nhé.',
        done: 'Phóng sinh xong rồi, công đức của con lớn lắm. Mô Phật.',
      },
      dq_bell: {
        offer: 'Con ghé tháp chuông gặp Tiểu Đánh Chuông, thỉnh một tiếng chuông giúp thầy nhé.',
        reminder: 'Tiếng chuông con thỉnh chưa? Tiểu Đánh Chuông đang đợi con ở tháp chuông đấy.',
        done: 'Tiếng chuông vang hay quá, thầy nghe thấy rồi. Cảm ơn con nhé.',
      },
      dq_meditate: {
        offer: 'Con vào Thiền Đường ngồi thiền hai phút giúp thầy nhé, ngồi yên thì tâm mới lắng.',
        reminder: 'Hai phút thiền con ngồi xong chưa? Ngồi cho đủ rồi về gặp thầy nhé.',
        done: 'Thiền xong rồi, mặt con tươi hẳn ra. Tốt lắm, cứ giữ như vậy nhé.',
      },
      dq_water: {
        offer: 'Con ra Vườn Tây tưới giúp thầy một cây nhé, cây khát nước rồi, tưới xong nó lại xanh tốt.',
        reminder: 'Cây trong vườn con tưới chưa? Tưới một cây thôi, xong rồi về gặp thầy nhé.',
        done: 'Cây được tưới rồi, lá lại xanh mơn mởn. Cảm ơn con nhé.',
      },
    },
    smallTalk: [
      'Cây bồ đề trước sân là do thầy trồng hồi còn trẻ đấy, giờ nó che mát cả một góc sân rồi.',
      'Thầy già rồi, chân chậm nên cứ đi dạo quanh chùa thế này, gặp ai cũng vui.',
      'Ngày nào cũng có ba việc nhỏ, làm xong ba việc là thầy thấy ngày hôm đó trọn vẹn.',
    ],
    farewell: [
      'Mô Phật, thí chủ về bình an.',
      'Thầy đi dạo tiếp đây, thí chủ cứ tự nhiên nhé.',
    ],
  },
  // npc2 — Tiểu Quét Sân. Giao Q1: quét 3 điểm dưới 3 cây sồi quảng trường.
  npc2: {
    name: 'Tiểu Quét Sân',
    role: 'Tiểu quét sân chùa',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ! Con đang quét dở, sân lá rụng nhiều quá.' },
      { time: 'noon', text: 'Trưa nắng rồi mà lá vẫn rụng, con quét mãi không hết.' },
      { time: 'afternoon', text: 'Chào thí chủ! Chiều nay gió to, lá bay đầy sân.' },
      { time: 'evening', text: 'Chào thí chủ! Chiều muộn rồi, con quét nốt lượt lá cuối rồi vào tụng kinh tối.' },
    ],
    questOffer: 'Sân chùa lá rụng nhiều quá, một mình con quét không xuể. Thí chủ giúp con quét ba chỗ dưới cây sồi nhé, chổi con để sẵn rồi.',
    questReminder: 'Thí chủ quét được mấy chỗ rồi? Còn đống lá dưới cây sồi kia nữa nhé.',
    questDone: 'Sân sạch bong rồi! Cảm ơn thí chủ nhiều lắm.',
    questLines: {
      nq_find_lost_pet: {
        offer: 'Vàng với Mướp chạy đâu mất tiêu rồi. Con quét sân mãi mà không thấy. Thí chủ tìm giúp con với, tụi nó hay trốn sau Bảo Tháp, trong vườn hay bờ ao lắm.',
        reminder: 'Thí chủ tìm quanh chùa thử xem, nhớ nhìn kỹ sau mấy cái cây, cái cột. Tụi nó khéo trốn lắm.',
        done: 'Tìm thấy rồi à, may quá! Cảm ơn thí chủ nhiều, để con dắt nó về sân.',
      },
    },
    smallTalk: [
      'Con quét sân từ 5 giờ sáng, giờ tay quen chổi lắm rồi.',
      'Mùa này lá rụng đẹp ơi là đẹp, mà quét thì mệt ơi là mệt.',
      'Thí chủ cẩn thận trơn, con vừa tưới cây xong.',
    ],
    farewell: [
      'Thí chủ đi thong thả nhé!',
      'Hẹn gặp lại thí chủ ở sân chùa nhé!',
    ],
    chanting: 'Mô Phật, thí chủ cứ tự nhiên, con tụng xong thời kinh này đã.',
  },

  // npc3 — Tiểu Quét Cầu. Giao Q2: quét 2 điểm dưới cây gần cầu sen nhất.
  npc3: {
    name: 'Tiểu Quét Cầu',
    role: 'Tiểu quét cầu sen',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ! Sáng nay sương còn đọng trên cầu sen, đi cẩn thận kẻo trơn nhé.' },
      { time: 'noon', text: 'Trưa rồi, con quét cầu xong là ra ao xem cá chép ăn.' },
      { time: 'afternoon', text: 'Chào thí chủ! Chiều nay sen nở đẹp lắm, đứng trên cầu ngắm là thích nhất.' },
      { time: 'evening', text: 'Chào thí chủ! Trời nhá nhem rồi, thí chủ qua cầu sen thì bước chậm kẻo trượt, con quét lần cuối đây.' },
    ],
    questOffer: 'Cầu sen lá rụng đầy cả mặt cầu, một mình con quét không kịp. Thí chủ giúp con quét hai chỗ ngay giữa mặt cầu nhé.',
    questReminder: 'Cầu còn lá ở giữa mặt cầu đấy, thí chủ giúp con cho sạch nhé.',
    questDone: 'Cầu sạch rồi, đi lại an toàn hẳn! Cảm ơn thí chủ nhé.',
    smallTalk: [
      'Cá chép dưới ao dạn lắm, cứ thấy bóng người là bơi lại xin ăn.',
      'Hoa sen tháng này nở to nhất, sáng nào con cũng ra ngắm trước khi quét.',
      'Cầu gỗ này trời mưa là trơn lắm, thí chủ đi chậm thôi.',
    ],
    farewell: [
      'Thí chủ đi cẩn thận nhé, cầu sen trơn lắm!',
      'Lần sau qua cầu nhớ ngắm sen nhé!',
    ],
    chanting: 'Mô Phật, thí chủ cứ tự nhiên lễ Phật, con tụng nốt câu kinh này.',
  },

  // npc4 — Tiểu Đánh Chuông. Giao Q10: thỉnh chuông 1 lần. Không ngồi tụng.
  npc4: {
    name: 'Tiểu Đánh Chuông',
    role: 'Tiểu đánh chuông',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ! Sáng nay con đánh chuông rồi, tiếng vang khắp chùa.' },
      { time: 'noon', text: 'Trưa nay yên ắng, chuông nghỉ một lát rồi chiều mới thỉnh tiếp.' },
      { time: 'evening', text: 'Chào thí chủ! Chuông chiều sắp thỉnh rồi, đứng gần nghe cho rõ nhé.' },
    ],
    questOffer: 'Thí chủ có muốn thỉnh chuông không? Thỉnh một tiếng cho lòng an, con chỉ cách cho.',
    questReminder: 'Thí chủ chưa thỉnh chuông mà, lại đây con đưa dùi cho.',
    questDone: 'Tiếng chuông vang hay quá! Thí chủ có duyên với chuông lắm đấy.',
    smallTalk: [
      'Chuông này mỗi lần thỉnh là vang khắp chùa, cá dưới ao cũng giật mình.',
      'Con đánh chuông ba năm rồi, tay cầm dùi quen đến nỗi nhắm mắt cũng biết nhịp.',
      'Chiều tối nghe chuông là lòng nhẹ hẳn, thí chủ thử đứng đây nghe một lần đi.',
    ],
    farewell: [
      'Thí chủ về bình an nhé!',
      'Lần sau lại thỉnh chuông cùng con nhé!',
    ],
  },

  // npc5 — Phật Tử Đi Lễ. Việc nhờ vặt: nhờ qua Bảo Tháp thắp hương hộ người nhà ốm.
  npc5: {
    name: 'Phật Tử Đi Lễ',
    role: 'Phật tử đi lễ',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay chùa đông vui quá.' },
      { time: 'noon', text: 'Trưa rồi mà chùa vẫn đông, chắc hôm nay là ngày tốt.' },
      { time: 'afternoon', text: 'Chào thí chủ, chiều nay mát quá, đi lễ một vòng là nhẹ cả người.' },
      { time: 'evening', text: 'Chào thí chủ, chùa lên đèn đẹp quá, con nán lại lễ Phật cho trọn rồi mới về.' },
    ],
    questOffer: 'Nhà con có người ốm không đi lễ được, thí chủ tiện đường qua Bảo Tháp thì thắp giúp nhà con một nén hương nhé.',
    questReminder: 'Thí chủ qua Bảo Tháp chưa? Nhà con trông lắm đấy.',
    questDone: 'Cảm ơn thí chủ nhiều lắm, nhà con mà biết chắc mừng lắm.',
    smallTalk: [
      'Con đi lễ chùa này từ hồi còn bé, giờ lớn rồi vẫn thích qua.',
      'Hôm nay con mang ít hoa quả cúng, để lát dâng lên bàn thờ.',
      'Đi lễ xong ra ao sen ngồi một lát là thấy lòng yên hẳn.',
    ],
    farewell: [
      'Thí chủ cứ tự nhiên đi lễ tiếp nhé.',
      'Hẹn gặp thí chủ ở chùa lần sau nhé.',
    ],
  },

  // npc6 — Sư Thầy Trực Ban. Giao: Q5, Q6, Q12. Ngồi tụng kinh lúc không trực.
  npc6: {
    name: 'Sư Thầy Trực Ban',
    role: 'Sư thầy trực ban',
    greetings: [
      { time: 'morning', text: 'Mô Phật. Thí chủ cần gì thì cứ hỏi thầy, thầy trực ở đây cả ngày.' },
      { time: 'noon', text: 'Mô Phật. Trưa nay chùa đông, thí chủ lễ Phật nhớ xếp hàng nhé.' },
      { time: 'evening', text: 'Mô Phật. Chiều muộn rồi, thí chủ có việc gì gấp thì nói nhanh với thầy nhé.' },
    ],
    questOffer: 'Bó hương này mang sang Điện Mẫu giúp thầy nhé, đi đường nhớ cẩn thận đừng để rơi.',
    questReminder: 'Bó hương mang tới Điện Mẫu chưa? Sư Cô đang đợi đấy.',
    questDone: 'Mang tới nơi rồi, tốt lắm. Cảm ơn thí chủ đã giúp thầy.',
    questLines: {
      nq_deliver_water: {
        offer: 'Bình nước này mang sang Trai Đường đưa Tiểu Quản giúp thầy nhé, các thầy sắp dùng cơm.',
        reminder: 'Bình nước tới Trai Đường chưa? Tiểu Quản đang chờ đấy.',
        done: 'Nước tới đúng lúc rồi, cảm ơn thí chủ đã chạy giúp thầy.',
      },
      nq_buy_tea: {
        offer: 'Thí chủ ra quầy Cô Bán Trà mua giúp thầy một ít trà, mang về đây thầy pha nhé.',
        reminder: 'Trà ở quầy Cô Bán Trà mua chưa? Thầy đang chờ pha đây.',
        done: 'Trà thơm quá, cảm ơn thí chủ. Lát nữa thầy mời thí chủ một chén.',
      },
    },
    smallTalk: [
      'Sổ công đức hôm nay ghi kín rồi, phật tử tới đông lắm.',
      'Ai tới chùa hỏi đường thì cứ tìm thầy, thầy thuộc hết chùa này rồi.',
      'Buổi trưa thầy trực ở đây, có việc gì thí chủ cứ ghé qua.',
    ],
    farewell: [
      'Mô Phật, thầy chúc thí chủ một ngày an lành.',
      'Có việc gì thì quay lại bàn trực tìm thầy nhé.',
    ],
    chanting: 'Mô Phật, thầy đang tụng kinh, thí chủ cứ tự nhiên nhé.',
  },

  // npc7 — Tiểu Quét Vườn. Giao Q3: quét 3 điểm dưới cây phong + khóm tre.
  npc7: {
    name: 'Tiểu Quét Vườn',
    role: 'Tiểu quét vườn Thiền',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ! Sáng nay vườn Thiền yên ắng lắm, chỉ có tiếng chim.' },
      { time: 'noon', text: 'Trưa rồi, con quét vườn xong là vào bóng cây phong ngồi nghỉ.' },
      { time: 'afternoon', text: 'Chào thí chủ! Chiều nay vườn Thiền mát rượi, đi dạo là thích nhất.' },
      { time: 'evening', text: 'Chào thí chủ! Tối rồi vườn Thiền chỉ còn tiếng dế, con cất chổi rồi vào tụng kinh tối đây.' },
    ],
    questOffer: 'Vườn Thiền lá phong với lá tre rụng đầy lối đi, thí chủ giúp con quét ba chỗ dưới cây phong và khóm tre nhé.',
    questReminder: 'Còn đống lá dưới cây phong với khóm tre đấy, thí chủ quét nốt giúp con nhé.',
    questDone: 'Vườn sạch rồi, lối đi thông thoáng hẳn! Cảm ơn thí chủ nhiều lắm.',
    questLines: {
      nq_bamboo_walk: {
        offer: 'Thí chủ sang rừng trúc phía Đông, đi một đoạn đường thiền hành rồi quay lại đây nhé.',
        reminder: 'Đi qua cầu sông Đông trên đường ngang, rồi theo lối đá vào rừng trúc.',
        done: 'Đi giữa rừng trúc chắc mát lắm. Cảm ơn thí chủ đã ghé kể con nghe.',
      },
      nq_river_walk: {
        offer: 'Thí chủ đi dạo trên bờ Đông sông, tới đoạn giữa rừng trúc và Điện Dược Sư nhé.',
        reminder: 'Đường bờ sông nằm phía Đông dòng nước; đừng đi xuống lòng sông nhé.',
        done: 'Nghe nước chảy, đi chậm một chút là lòng nhẹ hơn rồi.',
      },
    },
    smallTalk: [
      'Cây phong trong vườn này mùa thu lá đỏ rực, đẹp ơi là đẹp.',
      'Khóm tre sau vườn là do sư ông trồng, gió thổi nghe xào xạc thích lắm.',
      'Con thích quét vườn nhất, vừa làm vừa nghe chim hót.',
    ],
    farewell: [
      'Thí chủ ra vườn Thiền chơi tiếp đi nhé!',
      'Lần sau lại ghé vườn Thiền chơi nhé!',
    ],
    chanting: 'Mô Phật, thí chủ cứ tự nhiên dạo vườn, con tụng nốt thời kinh này.',
  },

  // npc8 — Tiểu Quét Đường. Giao Q4: quét 3 điểm dưới cây dọc đường chính.
  npc8: {
    name: 'Tiểu Quét Đường',
    role: 'Tiểu quét đường chùa',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ! Sáng nay con quét đường chính, lá rụng dọc hai bên lối đi.' },
      { time: 'noon', text: 'Trưa nắng chang chang mà đường vẫn mát nhờ bóng cây hai bên.' },
      { time: 'afternoon', text: 'Chào thí chủ! Chiều nay đường chính đông người qua lại, con quét dọn cho sạch.' },
      { time: 'evening', text: 'Chào thí chủ! Đèn dọc đường chính sắp lên rồi, con quét nốt đoạn cuối cho khách về đỡ vướng lá.' },
    ],
    questOffer: 'Đường chợ ngoài cửa chùa lá rụng nhiều quá, thí chủ giúp con quét ba chỗ dọc đường chợ, trước các quầy nhé.',
    questReminder: 'Đường chợ còn lá ở trước mấy quầy đấy, thí chủ giúp con nốt nhé.',
    questDone: 'Đường thông thoáng rồi, đi lại dễ hẳn! Cảm ơn thí chủ nhé.',
    smallTalk: [
      'Đường chính là lối ai vào chùa cũng đi qua, nên con quét kỹ lắm.',
      'Mấy cây dọc đường này che bóng mát cả ngày, đi lễ không sợ nắng.',
      'Con quét đường từ cổng Tam Quan lên tới Chính Điện, ngày nào cũng đi hết một vòng.',
    ],
    farewell: [
      'Thí chủ đi đường cẩn thận, trời sắp tối rồi!',
      'Hẹn gặp lại thí chủ trên đường chùa nhé!',
    ],
    chanting: 'Mô Phật, thí chủ cứ tự nhiên đi lễ, con tụng xong rồi ra quét đường tiếp.',
  },

  npc9: {
    name: 'Cô Đồng',
    role: 'Phật tử đi lễ',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay cô đi lễ sớm, chùa yên ắng thích quá.' },
      { time: 'noon', text: 'Trưa rồi, cô ngồi nghỉ ở ghế đá một lát rồi mới về.' },
      { time: 'afternoon', text: 'Chào thí chủ, chiều nay cô qua chùa dâng hoa, tiện thể ngắm ao sen.' },
      { time: 'evening', text: 'Chào thí chủ, chiều tối rồi, cô ngồi ghế đá nghe nốt chuông chiều rồi về, thí chủ về cẩn thận nhé.' },
    ],
    questOffer: 'Cô quên mua hoa dâng Phật, thí chủ tiện ra chợ ngoài cổng thì mua giúp cô một bó hoa huệ nhé.',
    questReminder: 'Bó hoa huệ mua giúp cô chưa? Cô ngồi ghế đá đợi nhé.',
    questDone: 'Hoa đẹp quá, cảm ơn thí chủ nhé, để cô dâng lên bàn thờ.',
    smallTalk: [
      'Cô hay đi lễ chùa này vào ngày rằm, đông vui mà ai cũng hiền.',
      'Hoa huệ trắng tinh dâng Phật là đẹp nhất, cô mua quen rồi.',
      'Đi lễ xong cô hay ngồi ghế đá nghe chuông chiều, lòng nhẹ hẳn.',
    ],
    farewell: [
      'Thí chủ cứ đi lễ tiếp đi, cô ngồi đây nghỉ một lát.',
      'Lần sau gặp lại ở chùa nhé, thí chủ.',
    ],
  },

  // npc10 — Cô Ba Đi Lễ. Giao: Q7, Q13 (mua hoa dâng Phật).
  npc10: {
    name: 'Cô Ba Đi Lễ',
    role: 'Phật tử đi lễ',
    greetings: [
      { time: 'morning', text: 'Con lễ Phật xong chưa? Bà ngồi đây nghỉ chân một lát.' },
      { time: 'noon', text: 'Trưa rồi, bà ngồi đây cho mát, chân đau đi không nhanh được.' },
      { time: 'afternoon', text: 'Chiều nay bà ra chùa muộn, may mà vẫn kịp thắp hương.' },
      { time: 'evening', text: 'Chiều tối rồi, chân bà đau nên bà về sớm kẻo tối khó đi, con ở lại lễ Phật thì cẩn thận nhé.' },
    ],
    questOffer: 'Chân bà đau không lên điện được, con thắp giúp bà một nén hương ở Chính Điện nhé, bà cảm ơn con.',
    questReminder: 'Con thắp hương ở Chính Điện giúp bà chưa? Bà đợi ở đây nhé.',
    questDone: 'Bà cảm ơn con nhiều lắm, Phật sẽ phù hộ cho con.',
    questLines: {
      nq_buy_flower: {
        offer: 'Con ra quầy Bác Bán Hương Hoa mua giúp bà một bó hoa, rồi dâng lên Chính Điện hộ bà nhé.',
        reminder: 'Hoa mua ở quầy Bác Bán Hương Hoa con dâng lên Chính Điện chưa? Bà đợi tin con đấy.',
        done: 'Hoa dâng lên rồi, bà yên lòng quá. Bà cảm ơn con nhiều lắm.',
      },
    },
    smallTalk: [
      'Bà đi lễ chùa này từ hồi còn trẻ, giờ già rồi vẫn không bỏ được.',
      'Hôm nay bà mang ít bánh đậu xanh cúng, để lát dâng lên bàn thờ.',
      'Đi lễ xong bà hay ngồi đây ngắm người qua lại, vui lắm.',
    ],
    farewell: [
      'Con về cẩn thận nhé, bà cảm ơn con nhiều.',
      'Lần sau lại ghé thăm bà nhé con.',
    ],
  },

  // npc11 — Cô Gái Trẻ. Việc nhờ vặt: nhờ chụp ảnh hộ ở cầu sen.
  npc11: {
    name: 'Cô Gái Trẻ',
    role: 'Phật tử đi lễ',
    greetings: [
      { time: 'morning', text: 'Chào anh/chị! Sáng nay em qua chùa sớm, sen nở đẹp quá.' },
      { time: 'noon', text: 'Trưa nắng mà cầu sen vẫn mát, em đứng đây chụp ảnh nãy giờ.' },
      { time: 'afternoon', text: 'Chào anh/chị! Chiều nay em rủ bạn qua chùa chơi, ai cũng khen chùa đẹp.' },
      { time: 'evening', text: 'Chào anh/chị! Chùa lên đèn lung linh quá, em chụp nốt mấy tấm ảnh đèn rồi mới về.' },
    ],
    questOffer: 'Anh/chị chụp giúp em một tấm ảnh ở cầu sen với, em đi một mình không ai chụp cho.',
    questReminder: 'Tấm ảnh ở cầu sen chụp giúp em chưa? Em đứng đây đợi nhé.',
    questDone: 'Ảnh đẹp quá, cảm ơn anh/chị nhiều lắm!',
    smallTalk: [
      'Em thích nhất là cầu sen, đứng đó chụp ảnh góc nào cũng đẹp.',
      'Cuối tuần em hay rủ bạn qua chùa, vừa lễ Phật vừa chụp ảnh.',
      'Em thích nhất là hoa sen hồng, nở to mà thơm dịu.',
    ],
    farewell: [
      'Em cảm ơn anh/chị nhé, hẹn gặp lại ở chùa!',
      'Anh/chị đi thong thả nhé!',
    ],
  },

  // npc12 — Bác Nông Dân. Việc nhờ vặt: nhờ mang giúp bao gạo tới Trai Đường.
  npc12: {
    name: 'Bác Nông Dân',
    role: 'Phật tử đi lễ',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay bác gánh gạo lên chùa cúng, nặng ơi là nặng.' },
      { time: 'noon', text: 'Trưa rồi, bác ngồi nghỉ dưới bóng cây một lát rồi mới về.' },
      { time: 'afternoon', text: 'Chào thí chủ, chiều nay bác qua chùa muộn, may mà vẫn kịp giờ.' },
      { time: 'evening', text: 'Chào thí chủ, chiều tối rồi, bác lễ xong là về ngay kẻo đường xa, mai còn ra đồng sớm.' },
    ],
    questOffer: 'Bác mang bao gạo lên cúng Trai Đường mà nặng quá, thí chủ khỏe thì mang giúp bác một đoạn nhé.',
    questReminder: 'Bao gạo mang tới Trai Đường giúp bác chưa? Bác ngồi đây đợi nhé.',
    questDone: 'Cảm ơn thí chủ nhiều lắm, bao gạo tới nơi rồi, các thầy có gạo nấu cơm.',
    smallTalk: [
      'Vụ lúa năm nay được mùa, bác mang gạo lên chùa cúng tạ ơn.',
      'Bác đi lễ chùa này từ hồi còn trẻ, giờ có con cháu rồi vẫn đi.',
      'Đi lễ xong bác hay ra cổng Tam Quan đứng ngắm người qua lại, vui lắm.',
    ],
    farewell: [
      'Thí chủ về cẩn thận nhé, đường về xa đấy.',
      'Lần sau bác lại mang gạo lên chùa, gặp thí chủ nhé.',
    ],
  },

  // npc13 — Sư Cô Trông Điện Mẫu. NPC NHẬN ở đích (Q5): không giao việc.
  npc13: {
    name: 'Sư Cô Trông Điện Mẫu',
    role: 'Sư cô trông Điện Mẫu',
    greetings: [
      { time: 'morning', text: 'Mô Phật, thí chủ vào điện lễ Mẫu đi, trong điện mát lắm.' },
      { time: 'noon', text: 'Mô Phật. Trưa nay điện Mẫu vắng, thí chủ vào lễ cho tĩnh tâm.' },
      { time: 'evening', text: 'Mô Phật. Chiều rồi, thí chủ lễ Mẫu xong thì về cẩn thận nhé.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: 'Cảm ơn con, hương thơm quá, để cô thắp lên bàn thờ Mẫu.',
    smallTalk: [
      'Hoa huệ trên bàn thờ là phật tử cúng sáng nay, thơm lắm.',
      'Điện Mẫu lúc nào cũng mát, thí chủ ngồi thiền một lát rồi hẵng về.',
      'Cô trông điện này mấy năm rồi, ngày nào cũng thắp hương sớm.',
    ],
    farewell: [
      'Mô Phật, thí chủ lễ xong thì về cẩn thận nhé.',
      'Thí chủ cứ ở lại điện ngồi thiền thêm một lát cũng được.',
    ],
    chanting: 'Mô Phật, cô đang tụng kinh, thí chủ cứ tự nhiên lễ Mẫu nhé.',
  },

  // npc14 — Tiểu Quản Trai Đường. NPC NHẬN ở đích (Q6, Q18): không giao việc.
  npc14: {
    name: 'Tiểu Quản Trai Đường',
    role: 'Tiểu quản Trai Đường',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ! Sáng nay con chuẩn bị cơm chay cho các thầy, bận ơi là bận.' },
      { time: 'noon', text: 'Trưa rồi, các thầy sắp dùng cơm, con dọn bàn nãy giờ.' },
      { time: 'afternoon', text: 'Chào thí chủ! Chiều nay Trai Đường vắng, con tranh thủ dọn dẹp.' },
      { time: 'evening', text: 'Chào thí chủ! Chiều tối rồi, con dọn xong mâm bát là đóng bếp cho các thầy nghỉ.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: 'Nước tới đúng lúc quá, các thầy sắp dùng cơm rồi, cảm ơn thí chủ!',
    questLines: {
      nq_deliver_rice: {
        offer: '',
        reminder: '',
        done: 'Bao gạo tới rồi, cảm ơn thí chủ nhiều, con nấu cơm cho các thầy ngay đây!',
      },
      nq_feed_pets: {
        offer: 'Chó mèo trong chùa đói bụng rồi, mà con đang bận dưới bếp. Đồ ăn để sẵn ở Trai Đường, thí chủ cho các bé ăn giúp con nhé.',
        reminder: 'Chó mèo đang quanh quẩn ngoài sân đó. Thí chủ lại gần rồi bấm Cho ăn là được.',
        done: 'Cảm ơn thí chủ. Các bé ăn no, nằm ngoan rồi. Thí chủ có lòng lắm.',
      },
    },
    smallTalk: [
      'Cơm chay ở Trai Đường nấu bằng rau trong vườn chùa, ngon lắm.',
      'Con quản Trai Đường được một năm rồi, giờ nấu cơm quen tay lắm.',
      'Buổi trưa Trai Đường đông nhất, ai cũng khen cơm chay ngon.',
    ],
    farewell: [
      'Thí chủ về cẩn thận nhé, trưa nắng lắm!',
      'Lần sau lại ghé Trai Đường chơi nhé!',
    ],
    chanting: 'Mô Phật, thí chủ cứ tự nhiên vào Trai Đường, con tụng nốt câu kinh này.',
  },

  npc15: {
    name: 'Cô Bán Hoa Quả',
    role: 'Người bán hoa quả',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay cô bày hoa quả tươi lắm, ghé xem đi.' },
      { time: 'noon', text: 'Trưa rồi, hoa quả cô vẫn tươi, thí chủ mua về dâng Phật đi.' },
      { time: 'afternoon', text: 'Chào thí chủ, chiều nay cô còn ít hoa quả, mua giúp cô nhé.' },
      { time: 'evening', text: 'Chào thí chủ, chiều tối rồi, cô sắp dọn quầy, trái cây còn lại thí chủ mua về dâng Phật tối nay nhé.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: 'Mâm trái cây đây, thí chủ mang về cẩn thận nhé, đừng để dập.',
    smallTalk: [
      'Cam nhà cô trồng không phun thuốc, ăn ngọt lắm.',
      'Mâm trái cây cúng rằm là cô bày đẹp nhất, ai mua cũng khen.',
      'Sáng nào cô cũng dậy sớm hái quả mang ra chợ, quen rồi.',
    ],
    farewell: [
      'Thí chủ đi thong thả nhé, lần sau lại ghé quầy cô!',
      'Cảm ơn thí chủ đã ghé, chúc thí chủ bình an.',
    ],
    shopGreeting: 'Trái cây tươi mới hái sáng nay, dâng Phật thì tốt lắm.',
  },

  // npc16 — Bác Bán Bánh (quầy Đông, z ~48). Người bán: không giao việc,
  // questDone = câu tiễn sau khi bán (Q11: gói bánh cho thầy).
  npc16: {
    name: 'Bác Bán Bánh',
    role: 'Người bán bánh',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay bánh mới ra lò, còn nóng hổi đây.' },
      { time: 'noon', text: 'Trưa rồi, bánh nhà bác vẫn còn nhiều, thí chủ mua về ăn trưa đi.' },
      { time: 'afternoon', text: 'Chào thí chủ, chiều nay bánh đậu xanh còn ít, mua nhanh kẻo hết.' },
      { time: 'evening', text: 'Chào thí chủ, chiều tối rồi, bác sắp dọn hàng, bánh còn lại thí chủ mua về dâng cúng tối nay nhé.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: 'Gói bánh đây, thí chủ mang về cho thầy cẩn thận nhé, còn nóng đấy.',
    smallTalk: [
      'Bánh đậu xanh nhà bác làm theo công thức của bà ngoại, ngọt vừa phải.',
      'Bánh chưng nhỏ nhà bác gói tay từng cái, ăn dẻo lắm.',
      'Sáng nào bác cũng dậy từ 4 giờ để làm bánh kịp ra chợ.',
    ],
    farewell: [
      'Thí chủ về cẩn thận nhé, bánh còn nóng đấy!',
      'Cảm ơn thí chủ đã ghé, chúc thí chủ một ngày tốt lành.',
    ],
    shopGreeting: 'Bánh mới ra lò còn nóng, thầy ăn chắc thích.',
  },

  // npc17 — Cô Bán Trà (quầy Tây, z ~53). Người bán: không giao việc,
  // questDone = câu tiễn sau khi bán (Q12: ấm trà cho thầy).
  npc17: {
    name: 'Cô Bán Trà',
    role: 'Người bán trà',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay cô pha trà sen thơm lắm, ghé uống một chén đi.' },
      { time: 'noon', text: 'Trưa rồi, uống chén trà cho mát rồi hẵng về nhé.' },
      { time: 'afternoon', text: 'Chào thí chủ, chiều nay trà nhà cô mới ướp xong, thơm ơi là thơm.' },
      { time: 'evening', text: 'Chào thí chủ, tối rồi, cô sắp dọn ấm chén, thí chủ uống chén trà cuối ngày cho ấm bụng rồi hẵng về nhé.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: 'Ấm trà đây, thí chủ mang về cho thầy cẩn thận nhé, đừng để đổ.',
    smallTalk: [
      'Trà sen nhà cô ướp bằng sen trong ao chùa, thơm tự nhiên.',
      'Uống trà phải từ từ, nhấp từng ngụm mới thấy ngon.',
      'Cô bán trà ở chợ này mười năm rồi, khách quen nhiều lắm.',
    ],
    farewell: [
      'Thí chủ về cẩn thận nhé, trà còn nóng đấy!',
      'Cảm ơn thí chủ đã ghé, chúc thí chủ an lành.',
    ],
    shopGreeting: 'Trà sen nhà cô ướp cả đêm, thơm lắm.',
  },

  // npc18 — Bác Bán Hương Hoa (quầy Đông, z ~53). Người bán: không giao
  // việc, questDone = câu tiễn sau khi bán (Q13: bó hoa huệ dâng Phật).
  npc18: {
    name: 'Bác Bán Hương Hoa',
    role: 'Người bán hương hoa',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay hương hoa nhà bác mới về, thơm lắm.' },
      { time: 'noon', text: 'Trưa rồi, hương trầm nhà bác vẫn còn nhiều, thí chủ mua về đốt cho thơm nhà đi.' },
      { time: 'afternoon', text: 'Chào thí chủ, chiều nay hoa huệ nhà bác nở đẹp lắm, mua về dâng Phật đi.' },
      { time: 'evening', text: 'Chào thí chủ, chiều tối rồi, thí chủ cần nén hương dâng Phật buổi tối thì lấy đi, bác sắp dọn quầy.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: 'Bó hoa huệ đây, thí chủ mang vào dâng Phật cẩn thận nhé, đừng để gãy.',
    smallTalk: [
      'Hoa huệ nhà bác trồng không phun thuốc, trắng tinh mà thơm.',
      'Hương trầm nhà bác đốt khói bay nhẹ, không cay mắt.',
      'Sáng nào bác cũng dậy sớm bó hoa mang ra chợ, quen rồi.',
    ],
    farewell: [
      'Thí chủ về cẩn thận nhé, hoa còn tươi đấy!',
      'Lần sau cần hương hoa thì cứ ghé quầy bác nhé.',
    ],
    shopGreeting: 'Hoa huệ trắng tinh, dâng Phật là đẹp nhất.',
  },

  // npc19 — Học sinh nam. Việc nhờ vặt (chưa có mã Q): nhờ chụp ảnh hộ ở
  // Bảo Tháp — dùng cơ chế talk + visit có sẵn.
  npc19: {
    name: 'Học sinh nam',
    role: 'Học sinh đi lễ',
    greetings: [
      { time: 'morning', text: 'Chào anh/chị! Sáng nay em với bạn qua chùa sớm, Bảo Tháp nhìn từ xa đẹp ơi là đẹp.' },
      { time: 'noon', text: 'Trưa rồi mà Bảo Tháp vẫn đông người chụp ảnh, em với bạn đứng đợi nãy giờ.' },
      { time: 'afternoon', text: 'Chào anh/chị! Chiều nay em với bạn qua Bảo Tháp chụp ảnh, nắng đẹp lắm.' },
      { time: 'evening', text: 'Chào anh/chị! Trời tối rồi, em với bạn chụp nốt ảnh Bảo Tháp lúc lên đèn rồi về kẻo muộn.' },
    ],
    questOffer: 'Anh/chị ơi chụp giúp em tấm ảnh ở Bảo Tháp với, em đi với bạn mà không ai chụp cho cả nhóm.',
    questReminder: 'Tấm ảnh ở Bảo Tháp chụp giúp em chưa? Bọn em đợi ở đây nhé.',
    questDone: 'Ảnh đẹp ơi là đẹp, cảm ơn anh/chị nhiều lắm, bọn em thích lắm!',
    smallTalk: [
      'Bảo Tháp là chỗ em thích chụp nhất, đứng từ xa lấy được cả tháp lẫn cây.',
      'Cuối tuần em hay rủ bạn qua chùa, cả nhóm ai cũng thích chụp ảnh ở Bảo Tháp.',
      'Chùa này cây cối nhiều, chụp ảnh lên hình đẹp ơi là đẹp.',
    ],
    farewell: [
      'Em cảm ơn anh/chị nhiều lắm, ảnh đẹp ơi là đẹp!',
      'Anh/chị về cẩn thận nhé!',
    ],
  },

  // npc20 — Sinh viên nữ. Việc nhờ vặt (chưa có mã Q): nhờ mua hộ chai
  // nước ở quán ngoài cổng — dùng cơ chế deliver có sẵn.
  npc20: {
    name: 'Sinh viên nữ',
    role: 'Sinh viên đi lễ',
    greetings: [
      { time: 'morning', text: 'Chào anh/chị! Sáng nay em qua chùa sớm, ngồi ghế đá đọc sách.' },
      { time: 'noon', text: 'Trưa nắng mà vườn Thiền vẫn mát, em ngồi đây đọc sách nãy giờ.' },
      { time: 'afternoon', text: 'Chào anh/chị! Chiều nay em ra vườn Thiền đọc sách, gió mát thích lắm.' },
      { time: 'evening', text: 'Chào anh/chị! Chiều tối rồi, đọc sách không còn rõ chữ nữa, em gấp sách lại rồi về đây.' },
    ],
    questOffer: 'Em ngồi đây đọc sách, anh/chị mua giúp em chai nước ở quán ngoài cổng nhé, em khát quá.',
    questReminder: 'Chai nước mua giúp em chưa? Em ngồi đây đọc sách đợi nhé.',
    questDone: 'Cảm ơn anh/chị nhiều lắm, nước mát quá, đúng lúc em đang khát.',
    smallTalk: [
      'Chiều chiều ra đây ngồi đọc sách, gió mát mà yên tĩnh hơn ở nhà.',
      'Vườn Thiền là chỗ em thích nhất trong chùa, vừa đẹp vừa yên.',
      'Em đang ôn thi, ra chùa ngồi học cho tĩnh tâm.',
    ],
    farewell: [
      'Em cảm ơn anh/chị nhiều lắm, nước mát quá!',
      'Anh/chị đi thong thả nhé, em ngồi đọc sách tiếp đây.',
    ],
  },

  // npc21 — Nhân viên văn phòng nam. Chỉ tán gẫu, không giao việc.
  npc21: {
    name: 'Nhân viên văn phòng nam',
    role: 'Nhân viên văn phòng đi lễ',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay em qua chùa sớm trước giờ làm, lễ Phật cho tĩnh tâm.' },
      { time: 'noon', text: 'Trưa nay em tranh thủ qua thắp hương, chiều về làm việc cho nhẹ đầu.' },
      { time: 'afternoon', text: 'Chào thí chủ, chiều nay em tan làm ghé qua chùa, ngồi một lát rồi mới về.' },
      { time: 'evening', text: 'Chào thí chủ, đèn chùa lên rồi, em nghe nốt chuông chiều cho nhẹ đầu rồi mới về nhà.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: '',
    smallTalk: [
      'Dự án bên em sắp xong rồi, qua cầu cho mọi sự suôn sẻ.',
      'Đi làm áp lực lắm, trưa nào rảnh em cũng qua chùa ngồi một lát.',
      'Sếp em cũng hay đi lễ chùa, chắc tại ai cũng cần chỗ tĩnh tâm.',
    ],
    farewell: [
      'Em về làm việc tiếp đây, hẹn gặp thí chủ ở chùa nhé.',
      'Thí chủ cứ đi lễ tiếp đi, em về làm việc đây.',
    ],
  },

  // npc22 — Nhân viên văn phòng nữ. Chỉ tán gẫu, không giao việc.
  npc22: {
    name: 'Nhân viên văn phòng nữ',
    role: 'Nhân viên văn phòng đi lễ',
    greetings: [
      { time: 'morning', text: 'Sáng nay em với đồng nghiệp qua chùa sớm, tiện thể ghé thăm Sư Thầy luôn.' },
      { time: 'noon', text: 'Trưa nay em với đồng nghiệp qua chùa, ngồi Thiền Đường một lát rồi mới về làm.' },
      { time: 'afternoon', text: 'Chiều nay em tan làm ghé qua chùa cùng đồng nghiệp, ngồi ao sen ngắm cá rồi mới về.' },
      { time: 'evening', text: 'Chiều tối rồi, em ra ao sen nhìn đèn chùa soi mặt nước một lát rồi mới về, thí chủ cũng về cẩn thận nhé.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: '',
    smallTalk: [
      'Cuối tuần nào em cũng ghé đây cho lòng nhẹ nhõm.',
      'Đi làm cả tuần mệt lắm, ra chùa ngồi một lát là thấy khỏe hẳn.',
      'Đồng nghiệp em ai cũng thích chùa này, vừa đẹp vừa yên tĩnh.',
    ],
    farewell: [
      'Em về đây, hẹn gặp thí chủ ở chùa nhé.',
      'Thí chủ cứ đi lễ tiếp đi, em về trước nhé.',
    ],
  },

  // npc23 — Bà cụ. Việc nhờ vặt (chưa có mã Q): nhờ thắp hương hộ ở Chính
  // Điện — dùng cơ chế lễ bái tại chỗ, kiểu Q7.
  npc23: {
    name: 'Bà cụ',
    role: 'Phật tử lớn tuổi đi lễ',
    greetings: [
      { time: 'morning', text: 'Chào con, sáng nay bà ra chùa sớm, ngồi nghỉ ở ghế đá một lát.' },
      { time: 'noon', text: 'Trưa rồi, bà ngồi đây cho mát, già rồi đi một lát là mỏi.' },
      { time: 'afternoon', text: 'Chào con, chiều nay bà ra chùa muộn, may mà vẫn kịp thắp hương.' },
      { time: 'evening', text: 'Chào con, chùa lên đèn rồi, bà ngồi nghe nốt chuông chiều rồi mới về, con về cẩn thận nhé.' },
    ],
    questOffer: 'Bà già rồi đi chậm, con thắp giúp bà một nén hương ở Chính Điện nhé, bà cảm ơn con.',
    questReminder: 'Con thắp hương giúp bà chưa? Bà ngồi đây đợi con nhé.',
    questDone: 'Bà cảm ơn con nhiều lắm, chân bà đau mà con giúp bà thì quý quá.',
    smallTalk: [
      'Bà đi lễ chùa này mấy chục năm rồi, cây nào trong chùa bà cũng nhớ.',
      'Ngày xưa chùa này còn nhỏ xíu, giờ khang trang quá.',
      'Đi lễ xong bà hay ngồi ghế đá nghe chuông chiều, lòng nhẹ hẳn.',
    ],
    farewell: [
      'Con về cẩn thận nhé, bà ngồi đây nghỉ thêm một lát.',
      'Bà chúc con một ngày an lành nhé.',
    ],
  },

  // npc24 — Ông cụ. Chỉ tán gẫu, không giao việc.
  npc24: {
    name: 'Ông cụ',
    role: 'Phật tử lớn tuổi đi lễ',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay ông ra chùa sớm, ngồi ngắm ao sen từ sáng.' },
      { time: 'noon', text: 'Trưa rồi, ông ngồi dưới bóng cây nghe ve kêu, mát ơi là mát.' },
      { time: 'afternoon', text: 'Chào thí chủ, chiều nay ông ra chùa muộn, may mà vẫn kịp ngắm hoàng hôn ở ao sen.' },
      { time: 'evening', text: 'Chào thí chủ, tối rồi, ao sen soi đèn chùa đẹp lắm, ông ngắm thêm chút nữa rồi mới về.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: '',
    smallTalk: [
      'Chùa mình yên tĩnh quá, ông ngồi đây cả buổi cũng được.',
      'Ông ngồi ngắm ao sen từ sáng, cá chép vàng bơi đẹp lắm.',
      'Ông nhớ hồi chùa còn lợp mái ngói cũ, giờ mái mới đẹp hẳn.',
    ],
    farewell: [
      'Thí chủ cứ đi lễ tiếp đi, ông ngồi đây ngắm ao sen.',
      'Lần sau ra ao sen lại gặp nhau nhé, thí chủ.',
    ],
  },

  // npc25 — Du khách nước ngoài. Thoại song ngữ đơn giản (1 câu Anh + 1 câu
  // Việt). Chỉ tán gẫu, không giao việc.
  npc25: {
    name: 'Du khách nước ngoài',
    role: 'Du khách tham quan',
    greetings: [
      { time: 'morning', text: 'Hello! Good morning! This temple is so beautiful in the morning light! / Xin chào! Buổi sáng chùa đẹp quá!' },
      { time: 'noon', text: 'Hello! It is so peaceful here at noon. / Xin chào! Buổi trưa ở đây yên tĩnh quá!' },
      { time: 'afternoon', text: 'Hello! I have taken so many photos today! / Xin chào! Hôm nay tôi chụp nhiều ảnh lắm!' },
      { time: 'evening', text: 'Hello! The lanterns are lit and the temple looks magical tonight. / Xin chào! Đèn đã lên, chùa buổi tối đẹp quá!' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: '',
    smallTalk: [
      'I love the lotus pond. Very peaceful here. / Tôi thích ao sen lắm, yên tĩnh quá.',
      'The tower is amazing! I have never seen anything like it. / Bảo Tháp đẹp quá, tôi chưa từng thấy cái nào như vậy.',
      'Vietnamese temples are so colorful. I love it here. / Chùa Việt Nam nhiều màu sắc, tôi thích lắm.',
    ],
    farewell: [
      'Goodbye! Thank you! / Tạm biệt! Cảm ơn nhé!',
      'See you again! / Hẹn gặp lại nhé!',
    ],
  },

  // npc26 — Mẹ trẻ bồng con. Chỉ tán gẫu, không giao việc.
  npc26: {
    name: 'Mẹ trẻ bồng con',
    role: 'Phật tử đi lễ',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay em cho bé ra chùa sớm, hít thở không khí trong lành.' },
      { time: 'noon', text: 'Trưa rồi, em cho bé ra ao sen xem cá, bé thích lắm.' },
      { time: 'afternoon', text: 'Chào thí chủ, chiều nay em cho bé ra chùa chơi, mát quá.' },
      { time: 'evening', text: 'Chào thí chủ, tối rồi, bé buồn ngủ nên em bế bé về kẻo bé quấy, thí chủ ở lại thì cẩn thận nhé.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: '',
    smallTalk: [
      'Con xem cá kìa, cá chép vàng đẹp quá!',
      'Bé nhà em cứ ra ao sen là cười tít mắt.',
      'Em cho bé ra chùa từ lúc bé xíu, giờ bé quen rồi, cứ thấy chùa là cười.',
    ],
    farewell: [
      'Em cho bé về đây, hẹn gặp thí chủ ở chùa nhé.',
      'Thí chủ cứ đi lễ tiếp đi, em cho bé về trước.',
    ],
  },

  // npc27 — Sư Ni Diệu An. Ngồi tụng ở Thiền Đường, thi thoảng ra vườn
  // Thiền tản bộ. Không giao việc.
  npc27: {
    name: 'Sư Ni Diệu An',
    role: 'Sư ni ở Thiền Đường',
    greetings: [
      { time: 'morning', text: 'Mô Phật. Sáng nay Thiền Đường yên ắng lắm, thí chủ vào ngồi một lát đi.' },
      { time: 'noon', text: 'Mô Phật. Trưa nay Thiền Đường vắng, thí chủ vào ngồi thiền một lát đi.' },
      { time: 'afternoon', text: 'Mô Phật. Chiều rồi, thí chủ ra vườn Thiền tản bộ cùng cô nhé.' },
      { time: 'evening', text: 'Mô Phật. Đèn Thiền Đường đã lên, cô vào tụng kinh tối, thí chủ muốn ngồi lặng thì vào cùng cô nhé.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: '',
    smallTalk: [
      'Ngồi thiền ở Thiền Đường mà nghe chuông chiều thì lòng yên hẳn.',
      'Cô hay ra vườn Thiền tản bộ sau giờ tụng kinh, vừa đi vừa niệm Phật.',
      'Hoa trong vườn Thiền là do các cô trồng, sáng nào cũng ra tưới.',
    ],
    farewell: [
      'Mô Phật, chúc thí chủ một ngày an lành.',
      'Thí chủ ra vườn Thiền tản bộ thêm một lát cũng được.',
    ],
    chanting: 'Mô Phật, cô đang tụng kinh, thí chủ cứ tự nhiên nhé.',
  },

  // npc28 — Sư Ni Diệu Tâm. Ngồi tụng ở Điện Mẫu cùng Sư Cô, thi thoảng
  // quét sân chùa. Không giao việc.
  npc28: {
    name: 'Sư Ni Diệu Tâm',
    role: 'Sư ni ở Điện Mẫu',
    greetings: [
      { time: 'morning', text: 'Mô Phật. Sáng nay cô dậy sớm tụng kinh, thí chủ vào lễ Mẫu đi.' },
      { time: 'noon', text: 'Mô Phật. Trưa nay cô ở điện Mẫu một mình, thí chủ vào lễ cùng cô cho vui.' },
      { time: 'afternoon', text: 'Mô Phật. Chiều rồi, cô quét sân xong thì vào điện tụng kinh, thí chủ cứ tự nhiên nhé.' },
      { time: 'evening', text: 'Mô Phật. Đèn điện Mẫu đã thắp, cô cất chổi rồi vào tụng kinh tối, thí chủ cứ tự nhiên lễ nhé.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: '',
    smallTalk: [
      'Điện Mẫu lúc nào cũng mát, thí chủ ngồi một lát rồi hẵng về.',
      'Cô quét sân chùa mỗi chiều, vừa làm vừa niệm Phật.',
      'Cô trông điện Mẫu cùng Sư Cô, ngày nào cũng thắp hương sớm.',
    ],
    farewell: [
      'Mô Phật, chúc thí chủ thân tâm an lạc.',
      'Thí chủ lễ Mẫu xong thì về cẩn thận nhé.',
    ],
    chanting: 'Mô Phật, cô đang tụng kinh ở điện Mẫu, thí chủ lễ xong thì ngồi nghỉ một lát nhé.',
  },
  // npc30 — Bác Bán Chim Cá. Bán chim cá phóng sinh ở quầy ngoài cổng chùa. Giao Q25.
  npc30: {
    name: 'Bác Bán Chim Cá',
    role: 'Người bán chim cá phóng sinh',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay chim hót hay lắm, mua một con về thả lấy phước đi.' },
      { time: 'noon', text: 'Trưa rồi, cá trong chậu vẫn khỏe, thí chủ mua về thả ở hồ phóng sinh nhé.' },
      { time: 'afternoon', text: 'Chào thí chủ, chiều nay bác còn ít chim cá, mua giúp bác nhé.' },
      { time: 'evening', text: 'Chiều muộn rồi thí chủ ơi, quầy bác sắp dọn, chim cá còn ít mà khỏe, mua về mai sớm thả lấy phước nhé.' },
    ],
    questOffer: 'Thí chủ mua giúp bác một con chim phóng sinh rồi mang ra bến thả ở hồ phóng sinh thả nhé, thả xong quay lại đây bác cảm ơn.',
    questReminder: 'Chim thí chủ mua chưa? Mua rồi thì mang ra bến thả ở hồ phóng sinh, thả xong quay lại gặp bác nhé.',
    questDone: 'Thí chủ thả chim rồi à, bác cảm ơn nhiều lắm. Phóng sinh là việc thiện, công đức vô lượng.',
    questLines: {
      nq_feed_birds: {
        offer: 'Đàn chim trong chùa hay đậu ở sân trước, thí chủ mua giúp bác một túi thức ăn cho chim rồi ra cho đàn ăn nhé, cho ăn xong quay lại đây bác cảm ơn.',
        reminder: 'Thí chủ mua túi thức ăn cho chim chưa? Mua rồi thì ra sân trước tìm đàn chim mà cho ăn, xong quay lại gặp bác nhé.',
        done: 'Đàn chim ăn no rồi, thí chủ có lòng lắm. Cảm ơn thí chủ đã giúp bác.',
      },
    },
    shopGreeting: 'Bác có chim phóng sinh, cá phóng sinh, thức ăn cho chim và thức ăn cho chó mèo nữa, thí chủ mua về thả và cho chúng ăn lấy phước nhé.',
    smallTalk: [
      'Chim bác nuôi đều khỏe mạnh, thả ra là bay vút lên trời ngay.',
      'Hồ phóng sinh ở phía đông Chính Điện, bến thả ngay mép ao, thí chủ cứ đi thẳng là tới.',
      'Mỗi con chim con cá thả đi là một mạng sống được cứu, phước báu lắm đấy.',
    ],
    farewell: [
      'Thí chủ đi thong thả, nhớ ghé lại nhé.',
      'Mô Phật, chúc thí chủ an lành.',
    ],
  },

  // npc38 — Tiểu Trồng Cây. Giữ Vườn Cây, bán hạt giống. Giao Q27–Q30 (gq_*).
  npc38: {
    name: 'Tiểu Trồng Cây',
    role: 'Người giữ Vườn Cây',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay tiểu vừa tưới hết luống rồi, cây đang lớn tốt lắm.' },
      { time: 'noon', text: 'Trưa nắng rồi, thí chủ nhớ tưới cây hôm nay chưa? Cây khát là héo đấy.' },
      { time: 'afternoon', text: 'Chiều mát, thí chủ ra vườn gieo thử một hạt đi, cây lớn nhanh lắm.' },
      { time: 'evening', text: 'Chào thí chủ, tối rồi, tiểu tưới lần cuối cho cây trong vườn rồi mới nghỉ, thí chủ cũng nhớ tưới cây mình trồng nhé.' },
    ],
    questOffer: 'Thí chủ mua hạt giống ở tiểu rồi gieo vào luống trống nhé, hạt thường tưới đủ 3 lần là cây lớn sau khoảng 45 phút.',
    questReminder: 'Thí chủ làm xong việc vườn chưa? Gieo hạt, tưới nước, chăm cây lớn rồi thu hoạch, xong quay lại gặp tiểu nhé.',
    questDone: 'Cây thí chủ chăm lớn tốt lắm, tiểu cảm ơn thí chủ nhé.',
    questLines: {
      gq_plant: {
        offer: 'Thí chủ gieo hạt đầu tiên giúp tiểu nhé: mua một hạt giống rồi gieo vào luống trống trong vườn.',
        reminder: 'Thí chủ gieo hạt chưa? Mua hạt giống ở tiểu rồi gieo vào luống trống nhé.',
        done: 'Hạt đã nảy mầm rồi, thí chủ chăm sóc tốt lắm.',
      },
      gq_water: {
        offer: 'Mỗi ngày thí chủ tưới giúp tiểu 3 cây nhé, cây nào chưa tưới hôm nay thì tưới luôn.',
        reminder: 'Hôm nay thí chủ tưới đủ 3 cây chưa? Cây khát nước là dừng lớn đấy.',
        done: 'Cây được tưới no nước rồi, mai lại tưới tiếp nhé.',
      },
      gq_grow: {
        offer: 'Thí chủ chăm một cây lớn hẳn giúp tiểu nhé, tưới đủ 3 lần là cây lớn sau khoảng 45 phút.',
        reminder: 'Cây thí chủ chăm đã lớn hẳn chưa? Nhớ tưới đủ 3 lần thì cây mới lớn.',
        done: 'Có cây lớn hẳn rồi, vườn thêm xanh tốt, tiểu cảm ơn thí chủ.',
      },
      gq_harvest: {
        offer: 'Cây nào lớn hẳn thì thí chủ thu hoạch giúp tiểu nhé, đứng gần cây lớn rồi thu hoạch.',
        reminder: 'Thí chủ thu hoạch cây lớn chưa? Cây lớn hẳn đứng gần là thu hoạch được.',
        done: 'Thu hoạch tốt lắm, vừa có công đức vừa có hạt mới để gieo tiếp.',
      },
    },
    shopGreeting: 'Tiểu có hạt sồi, hạt thông, hạt bồ đề. Thí chủ mua hạt rồi gieo vào luống trống trong vườn nhé.',
    smallTalk: [
      'Mỗi giai đoạn cây lớn sau 15 phút kể từ lần tưới, tưới đủ 3 lần là khoảng 45 phút cây lớn hẳn.',
      'Cây quá 24 giờ không tưới thì héo, quá 48 giờ thì biến mất, thí chủ nhớ tưới mỗi ngày.',
      'Thu hoạch cây lớn được 15 công đức với thêm hạt giống để gieo tiếp; cây trồng từ hạt tốt còn thêm xu.',
    ],
    farewell: [
      'Thí chủ chăm cây vui nhé, nhớ tưới mỗi ngày.',
      'Mô Phật, chúc thí chủ an lành.',
    ],
  },

  // npc39 — Sư Cô Trông Điện Dược Sư. Trông Điện Dược Sư. Giao nq_duocsu_sweep, nq_duocsu_prayer.
  npc39: {
    name: 'Sư Cô Trông Điện Dược Sư',
    role: 'Người trông Điện Dược Sư',
    greetings: [
      { time: 'morning', text: 'Mô Phật. Sáng nay thí chủ lễ Phật Dược Sư cầu bình an à?' },
      { time: 'noon', text: 'Mô Phật. Trưa rồi, thí chủ vào điện ngồi một lát cho mát nhé.' },
      { time: 'afternoon', text: 'Mô Phật. Chiều mát, thí chủ dâng đèn cầu an rồi hẵng về.' },
      { time: 'evening', text: 'Mô Phật. Tối rồi, thí chủ lễ Phật xong thì về cẩn thận nhé.' },
    ],
    questOffer: 'Điện Dược Sư cần người trông nom mỗi ngày. Thí chủ giúp sư cô quét điện với dâng đèn cầu an nhé.',
    questReminder: 'Thí chủ làm xong việc trong điện chưa? Quét điện với dâng đèn xong rồi quay lại gặp sư cô nhé.',
    questDone: 'Điện đã sạch sẽ, đèn đã sáng. Sư cô cảm ơn thí chủ nhé.',
    questLines: {
      nq_duocsu_sweep: {
        offer: 'Thí chủ quét giúp sư cô trong điện nhé, quét 3 chỗ: giữa điện với hai bên bàn thờ.',
        reminder: 'Thí chủ quét đủ 3 chỗ trong điện chưa? Quét xong rồi quay lại gặp sư cô nhé.',
        done: 'Điện sạch sẽ rồi, thí chủ quét cẩn thận lắm.',
      },
      nq_duocsu_prayer: {
        offer: 'Thí chủ dâng một ngọn đèn cầu bình an ở Điện Dược Sư giúp sư cô nhé.',
        reminder: 'Thí chủ dâng đèn chưa? Đến Điện Dược Sư, bấm Dâng đèn cầu an trước bàn thờ nhé.',
        done: 'Ngọn đèn đã được dâng lên. Sư cô chúc thí chủ và gia đình bình an.',
      },
    },
    smallTalk: [
      'Điện Dược Sư thờ Phật Dược Sư, cầu cho người bệnh mau khỏe, người nhà bình an.',
      'Mỗi sáng sư cô lau bàn thờ với thắp hương trước, rồi mới mở cửa điện đón khách.',
      'Thí chủ ngồi thiền trong điện một lát cũng tốt, lòng tĩnh thì bệnh cũng nhẹ đi.',
    ],
    farewell: [
      'Mô Phật, chúc thí chủ thân tâm an lạc.',
      'Thí chủ đi thong thả nhé.',
    ],
  },

  // npc40 — Tiểu Trồng Rau. Trồng rau vườn chùa. Giao nq_farm_water, nq_farm_harvest.
  npc40: {
    name: 'Tiểu Trồng Rau',
    role: 'Người trồng rau vườn chùa',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay tiểu vừa tưới hết luống rau rồi, rau đang lớn tốt lắm.' },
      { time: 'noon', text: 'Trưa nắng rồi, thí chủ nhớ tưới rau hôm nay chưa? Rau khát là héo đấy.' },
      { time: 'afternoon', text: 'Chiều mát, thí chủ ra vườn rau phụ tiểu một tay đi, rau lớn nhanh lắm.' },
      { time: 'evening', text: 'Chào thí chủ, tối rồi, tiểu tưới lần cuối cho rau rồi mới nghỉ, thí chủ cũng nhớ tưới rau mình trồng nhé.' },
    ],
    questOffer: 'Vườn rau chùa có 4 luống mới, thí chủ giúp tiểu tưới rau với thu hoạch nhé.',
    questReminder: 'Thí chủ làm xong việc vườn rau chưa? Tưới rau với thu hoạch xong rồi quay lại gặp tiểu nhé.',
    questDone: 'Rau được chăm tốt lắm, tiểu cảm ơn thí chủ nhé.',
    questLines: {
      nq_farm_water: {
        offer: 'Thí chủ tưới giúp tiểu 3 luống rau nhé, luống nào chưa tưới hôm nay thì tưới luôn.',
        reminder: 'Hôm nay thí chủ tưới đủ 3 luống rau chưa? Rau khát nước là dừng lớn đấy.',
        done: 'Rau được tưới no nước rồi, mai lại tưới tiếp nhé.',
      },
      nq_farm_harvest: {
        offer: 'Luống rau nào lớn hẳn thì thí chủ thu hoạch giúp tiểu nhé, đứng gần luống rau lớn rồi thu hoạch.',
        reminder: 'Thí chủ thu hoạch rau chưa? Luống rau lớn hẳn đứng gần là thu hoạch được.',
        done: 'Thu hoạch tốt lắm, vừa có công đức vừa có rau mới để gieo tiếp.',
      },
    },
    smallTalk: [
      'Rau vườn chùa trồng để nấu cơm chay cho chùa, thí chủ ăn cơm chùa là ăn rau tiểu trồng đấy.',
      'Mỗi luống rau tưới đủ 3 lần là lớn hẳn, giống như cây ở Vườn Tây vậy.',
      'Thu hoạch rau lớn được công đức với thêm hạt giống để gieo tiếp.',
    ],
    farewell: [
      'Thí chủ chăm rau vui nhé, nhớ tưới mỗi ngày.',
      'Mô Phật, chúc thí chủ an lành.',
    ],
  },

  // npc41 — Tiểu Quét Thang Ngọc. Quét thang lên Chùa Ngọc. Giao nq_ngoc_sweep.
  npc41: {
    name: 'Tiểu Quét Thang Ngọc',
    role: 'Người quét thang Chùa Ngọc',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay tiểu vừa quét hết thang rồi, 299 bậc sạch bong.' },
      { time: 'noon', text: 'Trưa nắng rồi, thí chủ leo thang nhớ đi thong thả, bậc cao thì nghỉ một lát.' },
      { time: 'afternoon', text: 'Chiều mát, thí chủ leo lên Chùa Ngọc ngắm cảnh đi, đẹp lắm.' },
      { time: 'evening', text: 'Chào thí chủ, tối rồi, tiểu quét lần cuối rồi mới xuống núi, thí chủ leo thang nhớ cẩn thận nhé.' },
    ],
    questOffer: 'Thí chủ quét giúp tiểu 3 đoạn thang lên Chùa Ngọc nhé: chân thang, giữa thang với gần đỉnh.',
    questReminder: 'Thí chủ quét đủ 3 đoạn thang chưa? Quét xong rồi quay lại gặp tiểu nhé.',
    questDone: 'Thang sạch rồi, thí chủ quét cẩn thận lắm, mai lại giúp tiểu nhé.',
    smallTalk: [
      'Thang lên Chùa Ngọc có 299 bậc, leo hết là tới đỉnh đồi, đứng trên đó nhìn xuống thấy cả chùa.',
      'Tiểu quét thang mỗi ngày hai lần, sáng một lần chiều một lần, lá rụng là quét ngay.',
    ],
    farewell: [
      'Thí chủ leo thang vui nhé, đi thong thả thôi.',
      'Mô Phật, chúc thí chủ an lành.',
    ],
  },

  // npc42 — Cô Trông Đình Sen. Trông đình ngắm sen. Giao nq_lotus_lantern, nq_lotus_sweep.
  npc42: {
    name: 'Cô Trông Đình Sen',
    role: 'Người trông đình ngắm sen',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay sen nở đẹp lắm, thí chủ ra đình ngắm sen đi.' },
      { time: 'noon', text: 'Trưa nắng rồi, thí chủ vào đình ngồi nghỉ một lát cho mát nhé.' },
      { time: 'afternoon', text: 'Chiều mát, sen thơm lắm, thí chủ thả đèn ở cầu sen rồi hẵng về.' },
      { time: 'evening', text: 'Chào thí chủ, tối rồi, sen khép cánh rồi, thí chủ ngắm sen xong thì về cẩn thận nhé.' },
    ],
    questOffer: 'Đình sen với cầu sen cần người trông nom mỗi ngày. Thí chủ giúp cô thả đèn với quét đình nhé.',
    questReminder: 'Thí chủ làm xong việc ở đình sen chưa? Thả đèn với quét đình xong rồi quay lại gặp cô nhé.',
    questDone: 'Đình đã sạch, đèn đã thả. Cô cảm ơn thí chủ nhé.',
    questLines: {
      nq_lotus_lantern: {
        offer: 'Thí chủ thả một đèn hoa đăng ở cầu sen giúp cô nhé, đứng trên cầu ván rồi thả đèn.',
        reminder: 'Thí chủ thả đèn chưa? Ra cầu sen thả một đèn hoa đăng giúp cô nhé.',
        done: 'Đèn đã thả xuống hồ sen rồi, cô chúc thí chủ an lành.',
      },
      nq_lotus_sweep: {
        offer: 'Thí chủ quét giúp cô đình sen với cầu sen nhé, quét 2 chỗ là xong.',
        reminder: 'Thí chủ quét đủ đình với cầu chưa? Quét xong rồi quay lại gặp cô nhé.',
        done: 'Đình với cầu sạch sẽ rồi, thí chủ quét cẩn thận lắm.',
      },
    },
    smallTalk: [
      'Hồ sen Tây trồng sen ta, sáng nở thơm cả một góc chùa, chiều khép cánh lại.',
      'Đình ngắm sen là chỗ nghỉ chân của khách đi dạo quanh hồ, thí chủ ngồi nghỉ rồi hẵng đi tiếp.',
    ],
    farewell: [
      'Thí chủ ngắm sen vui nhé, nhớ ghé lại.',
      'Mô Phật, chúc thí chủ an lành.',
    ],
  },

  // npc31 — Cô Bán Phở Chay. Chỉ bán hàng, không giao quest.
  npc31: {
    name: 'Cô Bán Phở Chay',
    role: 'Người bán phở chay',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, phở chay nóng hổi buổi sáng đây, ăn một tô cho ấm bụng nhé.' },
      { time: 'noon', text: 'Trưa rồi, thí chủ ghé ăn tô phở chay cho khỏe đi lễ nhé.' },
      { time: 'afternoon', text: 'Chiều rồi mà nồi nước dùng vẫn thơm, thí chủ ăn một tô nhé.' },
      { time: 'evening', text: 'Chiều tối rồi, cô sắp tắt bếp, thí chủ ghé ăn tô phở chay nhẹ bụng trước khi về nhé.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: 'Cảm ơn thí chủ đã ủng hộ, ăn ngon miệng nhé.',
    shopGreeting: 'Phở chay của cô nấu nước dùng từ rau củ, thí chủ ăn thử nhé.',
    smallTalk: [
      'Nước dùng cô hầm từ nấm, cà rốt với củ cải, không dùng gì mặn đâu.',
      'Khách đi lễ xong hay ghé ăn tô phở chay rồi mới về.',
      'Rau thơm cô mua buổi sáng sớm, lúc nào cũng tươi.',
    ],
    farewell: [
      'Thí chủ đi thong thả, lần sau ghé ăn tiếp nhé.',
      'Mô Phật, chúc thí chủ an lành.',
    ],
  },

  // npc32 — Bác Bán Trà Đá. Chỉ bán hàng, không giao quest.
  npc32: {
    name: 'Bác Bán Trà Đá',
    role: 'Người bán trà đá',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng sớm uống ly trà đá cho tỉnh táo nhé.' },
      { time: 'noon', text: 'Trưa nắng quá, thí chủ uống ly trà đá cho mát nhé.' },
      { time: 'afternoon', text: 'Chiều nay oi lắm, trà đá của bác còn mát đây.' },
      { time: 'evening', text: 'Tối rồi, trà đá bác còn mát, thí chủ uống ly cuối ngày cho đỡ khát đường về nhé.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: 'Cảm ơn thí chủ, uống cho mát nhé.',
    shopGreeting: 'Trà đá của bác mát lạnh, thí chủ uống cho đỡ khát nhé.',
    smallTalk: [
      'Trà bác pha đậm vừa, đá bỏ nhiều nên uống rất mát.',
      'Đi bộ dưới nắng lâu thì nên ghé uống ly trà cho đỡ mệt.',
      'Quầy bác ngồi ở đây mấy năm rồi, khách quen nhiều lắm.',
    ],
    farewell: [
      'Thí chủ đi thong thả, nhớ ghé lại nhé.',
      'Mô Phật, chúc thí chủ an lành.',
    ],
  },

  // npc33 — Cô Bán Cơm Chay. Chỉ bán hàng, không giao quest.
  npc33: {
    name: 'Cô Bán Cơm Chay',
    role: 'Người bán cơm chay',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ, sáng nay cô có xôi và cơm chay, thí chủ dùng một phần nhé.' },
      { time: 'noon', text: 'Trưa rồi, thí chủ ăn phần cơm chay cho đủ sức nhé.' },
      { time: 'afternoon', text: 'Chiều rồi, cô còn ít phần cơm chay, thí chủ dùng giúp cô nhé.' },
      { time: 'evening', text: 'Tối rồi, cô dọn dần mâm bát, thí chủ dùng bữa cơm chay nhẹ bụng rồi về nghỉ ngơi nhé.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: 'Cảm ơn thí chủ, dùng cơm ngon miệng nhé.',
    shopGreeting: 'Cơm chay của cô có đậu hũ, rau xào và canh, thí chủ dùng thử nhé.',
    smallTalk: [
      'Đậu hũ cô tự chiên, rau thì mua mỗi sáng ở chợ.',
      'Cơm chay ăn thanh đạm, đi lễ xong ăn vào nhẹ bụng lắm.',
      'Món canh nấm hôm nay cô nấu hơi nhiều, thí chủ ăn thử nhé.',
    ],
    farewell: [
      'Thí chủ đi thong thả, lần sau ghé ăn tiếp nhé.',
      'Mô Phật, chúc thí chủ an lành.',
    ],
  },

  // npc34 — Bác Bán Phóng Sinh (quầy gộp chim + cá). Chỉ bán hàng, không giao quest.
  npc34: {
    name: 'Bác Bán Phóng Sinh',
    role: 'Người bán phóng sinh',
    greetings: [
      { time: 'morning', text: 'Mô Phật, chào thí chủ. Thả chim thả cá phải nhẹ tay, thí chủ nhớ niệm một câu Phật hiệu rồi hẵng thả nhé.' },
      { time: 'noon', text: 'Mô Phật. Trưa rồi, thí chủ cứ thong thả. Phóng sinh thì phải thả đúng chỗ, ra bến thả ở mép hồ chứ đừng thả bừa.' },
      { time: 'afternoon', text: 'Chiều rồi, thí chủ có lòng phóng sinh thì ra bến thả cho sớm, lòng thành mới có phước.' },
      { time: 'evening', text: 'Mô Phật. Chiều muộn rồi, thí chủ phóng sinh thì ra bến thả khi còn nhìn rõ mặt nước, vừa thả vừa niệm Phật cho lòng thành nhé.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: 'Cảm ơn thí chủ, thả chim thả cá xong nhớ niệm Phật nhé.',
    shopGreeting: 'Bác có chim và cá để thí chủ phóng sinh, với thức ăn cho chim nữa. Mua về thì ra bến thả, vừa thả vừa niệm Phật nhé.',
    smallTalk: [
      'Bến thả ở mép hồ phía đông Chính Điện, thí chủ ra đó thả cho đúng chỗ nhé.',
      'Thả cá thì thả sát mặt nước, đừng ném từ trên cao, cá mới không bị choáng.',
      'Thả chim thì mở lồng cho chim tự bay, đừng vội xua, để nó định thần đã.',
      'Thả xong thì chắp tay niệm một câu Phật hiệu, hồi hướng phước lành cho muôn loài.',
    ],
    farewell: [
      'Mô Phật, thí chủ thả xong nhớ niệm một câu Phật hiệu nhé.',
      'Thí chủ đi thong thả, giữ lòng từ bi nhé.',
    ],
  },

  // npc36 — Bà Bán Trà Đá. Chỉ bán hàng, không giao quest.
  npc36: {
    name: 'Bà Bán Trà Đá',
    role: 'Người bán trà đá',
    greetings: [
      { time: 'morning', text: 'Chào con, sáng sớm uống ly trà đá cho tỉnh người nhé.' },
      { time: 'noon', text: 'Trưa nắng thế này, con uống ly trà đá cho mát nhé.' },
      { time: 'afternoon', text: 'Chiều rồi, con ghé uống ly trà đá cho đỡ mệt nhé.' },
      { time: 'evening', text: 'Chiều tối rồi, con đi lễ cả ngày chắc mỏi chân, ghé quầy bà ngồi uống ly trà rồi hẵng về nhé.' },
    ],
    questOffer: '',
    questReminder: '',
    questDone: 'Cảm ơn con, uống cho mát nhé.',
    shopGreeting: 'Trà đá của bà mát lạnh, con uống cho đỡ khát nhé.',
    smallTalk: [
      'Bà bán trà ở đây từ hồi chợ còn nhỏ xíu.',
      'Trà bà nấu từ lá, thơm và mát, uống quen rồi là nhớ.',
      'Đi lễ xa thì ghé quầy bà nghỉ chân một lát nhé.',
    ],
    farewell: [
      'Con đi thong thả, lần sau ghé bà nhé.',
      'Mô Phật, chúc con an lành.',
    ],
  },

  // npc29 — Sư Phó, Phó trụ trì. Giao Q22: thắp hương hộ ở Điện Tam Thế.
  npc29: {
    name: 'Sư Phó',
    role: 'Phó trụ trì',
    greetings: [
      { time: 'morning', text: 'A Di Đà Phật. Sáng sớm đã thấy thí chủ ghé chùa, thật là có duyên.' },
      { time: 'evening', text: 'A Di Đà Phật. Chiều muộn rồi, thí chủ còn đi lễ chùa sao?' },
      { time: 'any', text: 'A Di Đà Phật. Lão tăng chào thí chủ.' },
    ],
    questOffer: 'Thí chủ ơi, chân lão tăng đã yếu, đi lên Điện Tam Thế không nổi. Thí chủ làm phước thắp giúp lão tăng một nén hương ở đó nhé. Lễ xong thì về đây báo lại cho lão tăng.',
    questReminder: 'Thí chủ đã thắp hương ở Điện Tam Thế giúp lão tăng chưa? Khi nào xong thì quay lại đây nhé.',
    questDone: 'A Di Đà Phật. Cảm ơn thí chủ đã thắp hương hộ lão tăng. Phước lành của thí chủ sẽ được ghi nhận.',
    smallTalk: [
      'Tu hành không cần đi đâu xa, giữ lòng thanh tịnh là đủ.',
      'Lão tăng ở chùa này đã nhiều năm, mỗi sáng nghe tiếng chuông vẫn thấy lòng nhẹ nhàng.',
    ],
    farewell: [
      'A Di Đà Phật. Thí chủ đi bình an.',
      'Mong thí chủ thân tâm thường an lạc.',
    ],
    chanting: 'Nam mô A Di Đà Phật...',
  },
};
