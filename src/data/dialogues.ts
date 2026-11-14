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

  // npc2 — Tiểu Quét Sân. Giao Q1: quét 3 điểm dưới 3 cây anh đào quảng trường.
  npc2: {
    name: 'Tiểu Quét Sân',
    role: 'Tiểu quét sân chùa',
    greetings: [
      { time: 'morning', text: 'Chào thí chủ! Con đang quét dở, sân lá rụng nhiều quá.' },
      { time: 'noon', text: 'Trưa nắng rồi mà lá vẫn rụng, con quét mãi không hết.' },
      { time: 'afternoon', text: 'Chào thí chủ! Chiều nay gió to, lá anh đào bay đầy sân.' },
    ],
    questOffer: 'Sân chùa lá rụng nhiều quá, một mình con quét không xuể. Thí chủ giúp con quét ba chỗ dưới cây anh đào nhé, chổi con để sẵn rồi.',
    questReminder: 'Thí chủ quét được mấy chỗ rồi? Còn đống lá dưới cây anh đào kia nữa nhé.',
    questDone: 'Sân sạch bong rồi! Cảm ơn thí chủ nhiều lắm.',
    questLines: {
      nq_find_lost_pet: {
        offer: 'Trời ơi, Vàng với Mướp chạy đâu mất tiêu rồi. Tôi quét sân mãi mà không thấy. Con tìm giúp tôi với, tụi nó hay trốn sau Bảo Tháp, trong vườn hay bờ ao lắm.',
        reminder: 'Con tìm quanh chùa thử xem, nhớ nhìn kỹ sau mấy cái cây, cái cột. Tụi nó khéo trốn lắm.',
        done: 'Tìm thấy rồi à, may quá! Cảm ơn con nhiều, để tôi dắt nó về sân.',
      },
    },
    smallTalk: [
      'Con quét sân từ 5 giờ sáng, giờ tay quen chổi lắm rồi.',
      'Mùa này lá anh đào rụng đẹp ơi là đẹp, mà quét thì mệt ơi là mệt.',
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
    ],
    questOffer: 'Cầu sen lá rụng đầy cả mặt cầu, một mình con quét không kịp. Thí chủ giúp con quét hai chỗ dưới tán cây gần cầu nhé.',
    questReminder: 'Cầu còn lá ở hai đầu đấy, thí chủ giúp con cho sạch nhé.',
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
    ],
    questOffer: 'Vườn Thiền lá phong với lá tre rụng đầy lối đi, thí chủ giúp con quét ba chỗ dưới cây phong và khóm tre nhé.',
    questReminder: 'Còn đống lá dưới cây phong với khóm tre đấy, thí chủ quét nốt giúp con nhé.',
    questDone: 'Vườn sạch rồi, lối đi thông thoáng hẳn! Cảm ơn thí chủ nhiều lắm.',
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
    ],
    questOffer: 'Đường chính lá rụng nhiều quá, thí chủ giúp con quét ba chỗ dưới mấy cây dọc đường nhé.',
    questReminder: 'Đường còn lá ở mấy gốc cây đấy, thí chủ giúp con nốt nhé.',
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
        offer: 'Chó mèo trong chùa đói bụng rồi, mà tôi đang bận dưới bếp. Đồ ăn để sẵn ở Trai Đường, con cho hai bé ăn giúp thầy nhé.',
        reminder: 'Chó mèo đang quanh quẩn ngoài sân đó. Con lại gần rồi bấm Cho ăn là được.',
        done: 'Cảm ơn con. Hai bé ăn no, nằm ngoan rồi. Con có lòng lắm.',
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
    ],
    questOffer: 'Anh ơi chụp giúp em tấm ảnh ở Bảo Tháp với, em đi với bạn mà không ai chụp cho cả nhóm.',
    questReminder: 'Tấm ảnh ở Bảo Tháp chụp giúp em chưa? Bọn em đợi ở đây nhé.',
    questDone: 'Ảnh đẹp ơi là đẹp, cảm ơn anh nhiều lắm, bọn em thích lắm!',
    smallTalk: [
      'Bảo Tháp là chỗ em thích chụp nhất, đứng từ xa lấy được cả tháp lẫn cây.',
      'Cuối tuần em hay rủ bạn qua chùa, cả nhóm ai cũng thích chụp ảnh ở Bảo Tháp.',
      'Chùa này cây cối nhiều, chụp ảnh lên hình đẹp ơi là đẹp.',
    ],
    farewell: [
      'Em cảm ơn anh nhiều lắm, ảnh đẹp ơi là đẹp!',
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
    ],
    questOffer: 'Chị ngồi đây đọc sách, em mua giúp chị chai nước ở quán ngoài cổng nhé, chị khát quá.',
    questReminder: 'Chai nước mua giúp chị chưa? Chị ngồi đây đọc sách đợi nhé.',
    questDone: 'Cảm ơn em nhiều lắm, nước mát quá, đúng lúc chị đang khát.',
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
};
