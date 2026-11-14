export interface NewsItem {
  title: string;
  date: string;
  items: string[];
}

export const LATEST_NEWS_ID = 62;

export const NEWS: NewsItem[] = [
  {
    title: 'Ngồi thiền thấy rõ chân bắt chéo',
    date: '2026-11-14',
    items: [
      'Lúc ngồi thiền giờ thấy rõ 2 chân bắt chéo, đầu gối chìa ra 2 bên, giày/dép lộ ra, không còn như một cục tròn.',
      'Áp dụng cho cả người chơi lẫn sư/NPC ngồi tụng. Tư thế đứng, đi, lạy không đổi.',
    ],
  },
  {
    title: 'Tên NPC không còn chồng lên nhau',
    date: '2026-11-14',
    items: [
      'Khi nhiều NPC tụ lại ở cổng hoặc sân, tên của họ giờ xếp tầng dọc, mỗi tên một hàng, vẫn đọc được thay vì chồng thành một đống.',
      'Dấu "!" nhiệm vụ vẫn luôn hiện trên đầu NPC có quest; tên người chơi không bao giờ bị ẩn hay dời.',
    ],
  },
  {
    title: 'Xin xăm ở giá treo quẻ',
    date: '2026-11-14',
    items: [
      'Giá treo quẻ gần Chính Điện giờ đã xin được xăm: tới gần giá, bấm "Xin xăm", lắc ống xăm để rút một quẻ trong ngày.',
      'Bộ 33 quẻ viết riêng cho chùa (thơ 4 câu, lời giải công việc / tình cảm / sức khỏe / tài lộc); mỗi ngày được xin một quẻ miễn phí, do server rút và ghi nhận — mở lại trong ngày vẫn thấy đúng quẻ đã rút; quẻ chỉ để giải trí và suy ngẫm.',
    ],
  },
  {
    title: 'Danh hiệu hiển thị trên đầu nhân vật',
    date: '2026-11-14',
    items: [
      'Người chơi giờ có danh hiệu (ví dụ Sơ phát tâm, Thí Chủ, Đại Thí Chủ) hiện bằng chữ vàng ngay trên tên nhân vật trong game; khi đạt danh hiệu mới sẽ có thông báo riêng và một tin chúc mừng trên chat chung.',
      'Mở bảng Cấp độ để xem toàn bộ 24 danh hiệu kèm điều kiện đạt: theo cấp, nhiệm vụ đã hoàn thành, tổng xu đóng góp, tụng kinh, thắp hương, lạy Phật, thả đèn, lần hạt và ngồi thiền. Danh hiệu nào đã đạt thì chạm để đeo; mặc định đeo danh hiệu cao nhất đã đạt.',
      'Danh hiệu theo nhiệm vụ và thắp hương tính từ bản này trở đi (không cộng dồn phần đã làm trước đó).',
    ],
  },
  {
    title: 'Quầy chợ dồn về một bên đường, mặt quay vào trong chùa',
    date: '2026-11-14',
    items: [
      '5 quầy bán và 6 quầy trống được dồn hết sang phía Đông thành 1 hàng dọc, thay chỗ quầy phở chay cũ.',
      'Mặt quầy quay vào trong chùa; người bán đứng sau quầy, quay mặt ra khách tới mua.',
      'Lối đi giữa thông thoáng. Giá, hàng và nhiệm vụ không đổi.',
    ],
  },
  {
    title: 'Mèo Mướp hay quanh quẩn ở sân trước và ao hơn',
    date: '2026-11-14',
    items: [
      'Mèo Mướp giờ hay đi lại ở sân trước, cầu và khu vực ao phía nam hơn, thay vì phần lớn thời gian ở vườn sau phía bắc; người chơi gặp mèo thường xuyên hơn khi đi dạo quanh sân và ao phóng sinh.',
      'Mèo vẫn đi khắp chùa như cũ, vẫn ngồi/ngủ và vẫn tham gia cho ăn (Q23) và tìm mèo đi lạc (Q24) bình thường.',
    ],
  },
  {
    title: 'Ba chó lớn ngang mèo Mướp',
    date: '2026-11-14',
    items: [
      'Ba chó Collie, Munchkin và Labrador giờ cao khoảng 1,12 m, ngang với mèo Mướp, dễ thấy hơn khi đi quanh sân và vườn.',
      'Cho chó mèo ăn (Q23) và tìm chó mèo đi lạc (Q24) không đổi; tốc độ đi và cách cho ăn giữ nguyên.',
    ],
  },
  {
    title: 'Đóng góp từ 50 xu trở lên đã được thông báo cho cả chùa',
    date: '2026-11-14',
    items: [
      'Đóng góp công đức từ 50 xu trở lên giờ hiện dải chữ chạy trên màn hình và tin nhắn cảm ơn trên chat chung cho mọi người đang trong chùa.',
      'Đóng góp dưới 50 xu vẫn nhận đủ công đức (1 xu = 1 công đức) nhưng chỉ hiện thông báo riêng cho người đóng góp.',
    ],
  },
  {
    title: 'Sư Thầy Trực Ban và người bán hàng quay đúng hướng',
    date: '2026-11-14',
    items: [
      'Sư Thầy Trực Ban trong Phòng ghi công đức giờ ngồi quay mặt ra cửa phía Đông, đối diện người tới bàn công đức, không còn quay ngang về phía Bắc như trước.',
      'Người bán hàng ngoài chợ (trà, hoa quả, bánh, hương hoa, chim cá) giờ đứng sau quầy và quay mặt ra lối đi giữa, đối diện khách tới mua.',
    ],
  },
  {
    title: 'Tượng Phật vàng trong Đền Trình',
    date: '2026-11-14',
    items: [
      'Đền Trình giờ có tượng Phật ngồi mạ vàng trên bệ đá giữa đền, thay cho bàn thờ đá trống trước đây; lư hương dời xuống sàn, đặt sát mặt trước bệ thờ.',
      'Tượng cao đúng 1,6 m, vừa trong lòng đền, không chạm trần và không chắn lối vào; đường đi và điểm tương tác trong đền không đổi.',
    ],
  },
  {
    title: 'Hai chó mới: Collie và chó Munchkin thay chó khối vuông',
    date: '2026-11-14',
    items: [
      'Hai chó Kenney khối vuông được thay bằng chó Collie (mõm dài, tai dựng) và chó Munchkin nâu (đầu to, tai cụp), nhìn giống chó thật hơn; cả hai cao khoảng nửa mét đến 7 tấc, đi lại bình thường.',
      'Cho chó mèo ăn (Q23) và tìm chó mèo đi lạc (Q24) không đổi; chó vẫn đi quanh sân và vườn sau như cũ.',
    ],
  },
  {
    title: 'Quầy chợ xếp lại hai bên đường, thông lối đi giữa',
    date: '2026-11-14',
    items: [
      '5 quầy mua bán xếp thành 2 hàng dọc hai bên đường, mặt quầy quay ra đường; giữa đường để trống lối đi thẳng rộng cho người chơi và khách đi lại.',
      'Quầy phóng sinh dời khỏi giữa đường sang bên phải; người bán hàng đứng ngay sau quầy của mình.',
      'Tất cả quầy trong chợ, kể cả 6 quầy trống phía sau, giờ cùng một mẫu mái sọc, không còn mái đỏ phẳng lệch tông.',
    ],
  },
  {
    title: 'Thêm chó Labrador làm chó thứ 3 trong chùa',
    date: '2026-11-14',
    items: [
      'Chó Labrador (bản làm nhẹ từ 72 nghìn mặt xuống còn gần 6 nghìn mặt) gia nhập sân chùa làm chó thứ 3, cao khoảng 6 tấc, đi lại quanh sân và vườn như 2 chó còn lại.',
      'Cho chó mèo ăn (Q23) và tìm chó mèo đi lạc (Q24) không đổi; Labrador cũng được cho ăn như 2 chó kia.',
    ],
  },
  {
    title: 'Bảng ước nguyện, đèn đá, vườn cát và hành lang cao hơn',
    date: '2026-11-14',
    items: [
      'Thêm bảng ước nguyện mới gần sân trước chùa.',
      'Thêm 6 đèn đá dọc lối đi và quanh vườn; vườn cát thiền phóng to thêm một phần ba (từ 4,5×3 m lên 6×4 m), đèn đá cũ quanh vườn vẫn giữ nguyên.',
      'Hành lang hai bên cao thêm 0,65 m, cột và mái nâng đồng bộ, tượng La Hán và ghế giữ nguyên vị trí.',
    ],
  },
  {
    title: 'Hòm công đức, ghế hành lang, đèn lồng và tháp nhỏ đổi sang model 3D',
    date: '2026-11-14',
    items: [
      'Hòm công đức trong Phòng ghi công đức giờ là hòm gỗ có khe bỏ xu, thay cho hộp gỗ cũ; vị trí, điểm va chạm và cách đóng góp không đổi.',
      'Ghế hành lang đổi sang ghế gỗ 3D; đèn dọc lối đi và quanh vườn Thiền đổi sang đèn lồng đỏ treo cột gỗ, vẫn phát sáng ban đêm.',
      'Tháp nhỏ đổi sang tháp 3 tầng mái ngói đỏ, cao như cũ; thêm giá treo quẻ gần Chính Điện, chuẩn bị cho tính năng xin xăm sau này.',
    ],
  },
  {
    title: 'Khách đi dạo quanh chùa trước khi ra về',
    date: '2026-11-14',
    items: [
      'Sau khi lạy và tụng xong, khoảng 6 trên 10 vị khách giờ đi dạo 1-3 điểm quanh chùa (vườn Thiền, Bảo Tháp, hồ Koi, hành lang...) rồi mới ra cổng Tam Quan.',
      'Khách có nhiệm vụ vẫn ở lại làm nhiệm vụ, không đi dạo hay ra về; nhịp tụng 30 giây sau thắp hương không đổi.',
    ],
  },
  {
    title: 'Đàn chim thành chim cổ đỏ cỡ chim sẻ, mèo Mướp to gấp đôi',
    date: '2026-11-14',
    items: [
      'Đàn chim mặt đất giờ là chim cổ đỏ (robin) cỡ chim sẻ, có clip nhảy, mổ đất và đứng yên, thay cho gà con và vẹt to trước đây.',
      'Mèo Mướp to gấp đôi nên dễ thấy hơn; cho chim ăn, cho chó mèo ăn và các nhiệm vụ liên quan không đổi.',
    ],
  },
  {
    title: 'Dẫn đường tới chợ không còn đứng yên',
    date: '2026-11-14',
    items: [
      'Bấm "Dẫn đường" tới quầy chợ giờ đi xuyên cổng Tam Quan tới tận quầy, không còn đứng yên ở Đền Trình.',
      'Sửa lỗi đường đi: hai đoạn đường qua cổng chợ bị đứt khỏi bản đồ đường nên máy tính nhầm là đã tới nơi.',
      'Thêm lớp phòng thủ: đường tới đích bị chặn cũng không còn làm nhân vật đứng treo.',
      'Nhiệm vụ Quét sân chùa: bấm Dẫn đường giờ đi hết cả 3 điểm quét, không còn dừng lại sau điểm đầu tiên.',
      'Nút "Sư thầy" khi đứng gần sư thầy giờ cùng cỡ với các nút hành động khác.',
    ],
  },
  {
    title: 'Bồ đoàn ngoài sân và các điện giống điện chính',
    date: '2026-11-14',
    items: [
      'Bồ đoàn ở sân thiền, Điện Mẫu và Thiền Đường giờ cùng kích thước với bồ đoàn trong Chính Điện, chùa nhìn nhất quán hơn.',
      'Vị trí ngồi, chiều cao mặt đệm và chiếu giữ nguyên nên ngồi tụng và lạy Phật hoạt động như trước.',
    ],
  },
  {
    title: 'Bồ đoàn mới kiểu zafu',
    date: '2026-11-14',
    items: [
      'Bồ đoàn trong mọi điện giờ là đệm tròn kiểu zafu: thân cầu dẹt, vòng khâu vàng quanh mép và nút vàng giữa mặt trên, thay cho trụ dẹt cũ.',
      'Vị trí ngồi, bồ đoàn và chiếu giữ nguyên nên ngồi tụng và lạy Phật hoạt động như trước.',
    ],
  },
  {
    title: 'Đàn chim không vào trong điện nữa',
    date: '2026-11-14',
    items: [
      'Đàn chim mặt đất (3 gà con, 3 vẹt) giờ chỉ đậu và đi lại ngoài trời: sân trước, vườn và bờ hồ.',
      'Chim không còn đi vào trong các điện nữa.',
    ],
  },
  {
    title: 'Sửa cầu thang Tam Thế, tượng vàng hành lang, sạp chợ, NPC cổng và Phòng ghi công đức',
    date: '2026-11-14',
    items: [
      'Cầu thang Điện Tam Thế nối liền vào bậc thềm điện, không còn khe hở giữa bậc trên cùng và sàn điện.',
      'Tượng vàng hành lang giờ tự tải lại khi mạng yếu, không còn kẹt ở tượng chibi.',
      'Hai sạp Bán chim phóng sinh và Phở chay dời ra khỏi quầy Trà và Hương hoa, chợ ngoài cổng ngay ngắn hơn.',
      'Khách vào chùa giờ đã rải sẵn khắp sân và các điện thay vì xếp hàng hết ở cổng Tam Quan.',
      'Phòng ghi công đức xoay mặt mở về hướng Đông, nhìn ra lối đi chính; Sư Thầy Trực Ban vẫn ngồi ở bàn trực.',
      'Hòm công đức to gấp 3 lần, đặt ngay bên trái lối vào phòng.',
      'Bảng vinh danh dời ra cạnh lối lên hồ cá Koi, dễ thấy ngay khi đi về phía hồ.',
    ],
  },
  {
    title: 'Cho chim và chó mèo ăn',
    date: '2026-11-14',
    items: [
      'Đàn chim 6 con (3 gà con, 3 vẹt) đậu quanh sân trước chùa, vị trí đổi theo thời gian.',
      'Mua Túi thức ăn cho chim hoặc Túi thức ăn cho chó mèo ở quầy Bác Bán Chim Cá, mỗi túi 5 xu.',
      'Lại gần đàn chim hoặc chó mèo rồi bấm Cho ăn: mỗi ngày nhận công đức tối đa 3 lần cho chim và 3 lần riêng cho chó mèo.',
      'Nhiệm vụ mới: Cho đàn chim ăn — nhận ở Bác Bán Chim Cá.',
    ],
  },
  {
    title: 'Sư Phó về chùa và nhiệm vụ mới Q22',
    date: '2026-11-14',
    items: [
      'Thêm NPC Sư Phó, Phó trụ trì, đi dạo quanh chùa và cùng tham dự các buổi tụng kinh.',
      'Nhiệm vụ hằng ngày mới Q22: thắp hương hộ Sư Phó ở Điện Tam Thế, rồi quay lại nhận thưởng từ Sư Phó.',
      'Sư Phó là vị sư cao niên thứ hai trong chùa, sau Sư Thầy trụ trì.',
    ],
  },
  {
    title: 'Thông báo đóng góp: chạy chữ và tin nhắn chung',
    date: '2026-11-14',
    items: [
      'Đóng góp trên 50 xu giờ hiện dải chữ chạy trên màn hình cho mọi người đang trong chùa, kể cả người đóng góp.',
      'Kênh chat chung cũng nhận 1 tin hệ thống ghi lại lần đóng góp, ai mở chat sau vẫn thấy.',
      'Lời cảm ơn xoay ngẫu nhiên 5 mẫu cho đỡ trùng lặp.',
    ],
  },
  {
    title: 'Quầy chim cá phóng sinh ngoài cổng chùa',
    date: '2026-11-14',
    items: [
      'Chợ ngoài cổng Tam Quan có thêm quầy thứ 5 bán chim cá phóng sinh, do Bác Bán Chim Cá trông coi.',
      'Mua chim 20 xu hoặc cá 10 xu rồi mang tới bến thả ở hồ phóng sinh để thả, nhận 20 hoặc 10 công đức.',
      'Nhiệm vụ mới: Phóng sinh lần đầu — gặp Bác Bán Chim Cá để nhận việc.',
    ],
  },
  {
    title: 'Chó, mèo và chim về chùa, thêm hai nhiệm vụ mới',
    date: '2026-11-14',
    items: [
      'Trong chùa có thêm hai chú chó Vàng và Đen, mèo Mướp, ba con cú bay lượn và hai con chim đậu quanh vườn và bờ ao.',
      'Nhiệm vụ mới "Cho chó mèo ăn": nhận từ thầy ở Trai Đường, lại gần chó hoặc mèo rồi bấm Cho ăn.',
      'Nhiệm vụ mới "Tìm chó mèo đi lạc": nhận từ Tiểu Quét Sân, tìm con vật đang trốn quanh chùa rồi lại gần để dắt về.',
    ],
  },
  {
    title: 'Đóng góp công đức',
    date: '2026-11-14',
    items: [
      'Hòm công đức mới đặt trong Phòng ghi công đức, cạnh bàn của Sư Thầy Trực Ban.',
      'Nói chuyện với Sư Thầy Trực Ban để đóng góp xu — 1 xu = 1 công đức.',
      'Đóng góp trên 50 xu sẽ được thông báo cho mọi người đang trong chùa.',
      'Bảng vinh danh top 10 người đóng góp nhiều nhất đặt ngay cạnh cổng Tam Quan.',
    ],
  },
  {
    title: 'Cầu thang Điện Tam Thế: bậc gỗ đặc, liền khối',
    date: '2026-11-14',
    items: [
      'Sửa hình học cầu thang Điện Tam Thế: 20 bậc gỗ giờ đặc và khít nhau, không còn khe hở hay khoảng rỗng bên dưới cầu thang.',
      'Bậc dưới cùng chạm nền gạch, đi lên xuống bình thường.',
    ],
  },
  {
    title: 'Sửa vòng Lạy, thêm tượng Điện Mẫu, dời tượng hành lang và cây gần Bảo Tháp',
    date: '2026-11-14',
    items: [
      'Nút Lạy giờ chọn đúng điện đang đứng hoặc điện gần nhất, rồi đi tới bồ đoàn thông đường nhất thay vì vòng quanh cả sân.',
      'Khi đường vòng quá dài mà giữa đường chỉ có vài cây nhỏ, nhân vật đi thẳng tới bồ đoàn và trượt qua cây.',
      'Điện Mẫu có tượng Quan Âm ngồi dát vàng trên bệ đá, đặt sau hai bồ đoàn và quay mặt ra cửa.',
      'Tượng La Hán hai hành lang dời ra giữa các cột, còn 5 tượng mỗi bên, cách đều nhau và không còn dính cột.',
      'Cây tre và cây phong phía tây bắc Bảo Tháp dời ra xa hơn để không che dáng tháp.',
    ],
  },
  {
    title: 'Am Cố và Phòng ghi công đức xoay đúng hướng',
    date: '2026-11-13',
    items: [
      'Am Cố xoay mặt tiền về hướng Nam, nhìn ra sân chùa thay vì quay vào tường bao phía Đông.',
      'Phòng ghi công đức xoay mặt mở về hướng Bắc, nhìn ra sân chính; Sư Thầy Trực Ban vẫn ngồi ở bàn trực, quay mặt ra cửa.',
      'Sửa tên "Nhân viên văn phòng" không còn dính ký tự lạ phía sau.',
    ],
  },
  {
    title: 'Camera tự zoom gần khi vào trong nhà',
    date: '2026-11-14',
    items: [
      'Vào trong nhà hoặc điện, camera giờ tự zoom lại gần để luôn thấy nhân vật trong phòng, không còn bị mái nhà che khuất.',
      'Ra ngoài sân, camera trở lại khoảng cách cũ một cách mượt mà; lăn chuột hoặc chụm tay để zoom vẫn hoạt động như trước.',
    ],
  },
  {
    title: 'Hai sư thầy lớn giờ có râu trắng và lông mày trắng',
    date: '2026-11-14',
    items: [
      'Sư Thầy Trụ trì và Sư Thầy Trực Ban giờ có râu trắng dài tới ngực và lông mày trắng rậm, nhìn già dặn và hiền hơn.',
      'Râu gắn theo đầu nên khi cúi lạy hay ngồi tụng kinh vẫn tự nhiên, không trôi và không xuyên qua áo.',
      'Các tiểu, sư ni và nhân vật người chơi không thay đổi.',
    ],
  },
  {
    title: 'NPC thắp hương xong ngồi tụng kinh rồi mới ra về',
    date: '2026-11-14',
    items: [
      'Khách viếng sau khi thắp hương xong sẽ đi tới bồ đoàn trống trong cùng điện, ngồi tụng kinh khoảng 30 giây rồi mới ra cổng về.',
      'Khách mới sẽ tới thay để chùa luôn đông vui; NPC đang có nhiệm vụ cho người chơi thì không ra về.',
      'Hết bồ đoàn trống thì khách đi thẳng ra về, không đứng kẹt.',
    ],
  },
  {
    title: 'Lạy Phật đi thẳng tới bồ đoàn khi đường vòng bị cụt',
    date: '2026-11-13',
    items: [
      'Khi đường tới bồ đoàn phải vòng xa vì đang đứng sát vật cản, nhân vật giờ đi thẳng ra khỏi chỗ vướng thay vì quay vòng.',
      'Bấm Lạy Phật lúc nút còn đang nghỉ không còn bị bỏ qua: nhân vật vẫn tới bồ đoàn, ngồi và lạy ngay khi hết thời gian chờ.',
    ],
  },
  {
    title: 'Dẫn đường không còn kẹt ở cầu sen',
    date: '2026-11-13',
    items: [
      'Bấm "Dẫn đường" giờ đưa nhân vật tới tận điểm quét dưới cây anh đào, không còn đứng treo ở đầu cầu bắc.',
      'Sửa lỗi đường đi: điểm quét nằm trong gốc cây nên máy tính nhầm là đã tới nơi, cứ cho đi rồi hủy liên tục.',
      'Bấm vào khung chỉ đường cũng gỡ kẹt và tính lại đường; khung chỉ đường không còn mở tra từ điển khi chạm vào chữ.',
      'Nút "Nói chuyện" giờ nhỏ bằng các nút khác, không còn tràn hai dòng.',
    ],
  },
  {
    title: 'Hệ thống nhiệm vụ: 21 việc cùng 28 vị trong chùa',
    date: '2026-11-13',
    items: [
      'Thêm 21 nhiệm vụ mỗi ngày: quét sân, dâng lễ, thắp hương, tụng kinh, mua đồ ở chợ rồi mang về cho người nhờ.',
      'Chợ ngoài cổng Tam Quan có 4 quầy hoa quả, bánh, trà, hương hoa; mua đồ tốn 10 xu.',
      'Gặp người trong chùa để nói chuyện, nhận việc và trả việc; nhiệm vụ có đường dẫn sáng trên mặt đất và mũi tên chỉ hướng.',
      'Thêm 16 người mới: người bán hàng, học sinh, nhân viên văn phòng, cụ già, du khách và hai sư ni ngồi tụng kinh trong điện.',
    ],
  },
  {
    title: 'Lạy Phật không còn kẹt ở bồ đoàn',
    date: '2026-11-13',
    items: [
      'Ấn Lạy Phật giờ luôn ngồi xuống bồ đoàn rồi lạy, không còn đứng treo ở cạnh bồ đoàn.',
      'Sửa lỗi ngưỡng dừng đi bộ và ngưỡng lạy lệch nhau khiến nhân vật dừng cách bồ đoàn nửa mét mà không lạy.',
    ],
  },
  {
    title: 'Tượng hành lang to gấp đôi, cầu thang Tam Thế đổi gỗ sáng',
    date: '2026-11-13',
    items: [
      'Tượng dọc hai hành lang to gấp đôi, đặt trên bệ rộng hơn; đáy tượng chạm sát mặt bệ, không còn lơ lửng.',
      'Thềm đá bệ Điện Tam Thế đổi sang gỗ, đồng bộ với 20 bậc thang.',
    ],
  },
  {
    title: 'Dời cây tre khỏi Bảo Tháp',
    date: '2026-11-13',
    items: [
      'Bụi tre mọc sát Bảo Tháp đã dời ra phía Tây, thân và tán tre giờ cách thân tháp hơn 1,5 m.',
      'Không còn cây nào chạm vào Bảo Tháp; các cây khác quanh tháp vẫn giữ nguyên vị trí.',
    ],
  },
  {
    title: 'Cầu thang Tam Thế đúng chiều, bậc cùng màu sàn gỗ',
    date: '2026-11-13',
    items: [
      'Thành cầu thang Tam Thế hết nghiêng ngược: dốc cùng chiều với bậc thang.',
      'Bậc thang đổi sang sàn gỗ, cùng tông với sàn trong điện.',
    ],
  },
  {
    title: 'Tượng hành lang quay mặt vào trung tâm',
    date: '2026-11-13',
    items: [
      'Tượng hai hành lang giờ đều quay mặt vào sân chùa, không còn tượng quay dọc hành lang.',
      'Hai tượng Quan Âm đã xoay lại cho đồng bộ với các tượng La Hán.',
    ],
  },
  {
    title: 'Điện Tam Thế lùi ra sau, sân trước rộng hơn',
    date: '2026-11-13',
    items: [
      'Điện Tam Thế lùi ra sau 6 m: khoảng trống phía trước điện tăng từ 2 m lên 8 m.',
      'Sân trước thoáng hơn, nhìn trọn các bậc thang lên điện.',
      'Đường đi và thang dời theo vị trí mới, đi lại vẫn thông suốt.',
    ],
  },
  {
    title: 'Đi lại nhanh hơn, hết kẹt cửa nhà',
    date: '2026-11-13',
    items: [
      'Đường đi trong chùa ngắn lại: đi từ quảng trường tới Bảo Tháp, Am Cổ hay bờ ao Phóng Sinh giờ chỉ dài hơn đường thẳng một chút, không còn vòng xa gấp đôi gấp ba.',
      'Đã vào được trong Trai Đường, Nhà Khách và Am Cổ: lối vào thông thoáng, không còn kẹt ở ngưỡng cửa hay tường nhà.',
      'Chậu bonsai chắn cửa Bảo Tháp đã dời đi; bảng câu đối của các nhà nhỏ lại, chữ không còn bị nút tắt che mất.',
    ],
  },
  {
    title: 'Vườn sống động',
    date: '2026-11-13',
    items: [
      'Sân chùa có thêm cây anh đào hồng, phong đỏ, tre xanh, đèn đá, tháp nhỏ và vườn cát Thiền — nhìn sống động hơn hẳn cây đá xám cũ.',
      'Cây anh đào nở hồng ở mép quảng trường; phong đỏ và tre ở Vườn Thiền; tháp nhỏ và đèn đá ở Vườn Tháp.',
      'Vườn cát Thiền nằm giữa Vườn Thiền, hai bên có đèn đá.',
    ],
  },
  {
    title: 'Sửa lỗi đơ máy và kẹt sau chùa',
    date: '2026-11-12',
    items: [
      'Đã sửa lỗi game đơ 20–40 giây khi bấm đi xa: đường đi giờ tính trong chưa tới 1 mili giây thay vì 5–28 giây.',
      'Nhân vật không còn kẹt ở hàng rào hai viện: hàng rào đổi thành tường liên tục, vẫn chặn được nhưng trượt dọc mượt, cổng vẫn đi qua được.',
      'Điện Tam Thế dời ra xa Chính Điện 8 m; Bảo Tháp dời về phía tây, không còn đè lên nền Tam Thế; cầu thang Tam Thế dài ra thành 20 bậc, dốc vừa phải.',
      'Ao Vườn Phóng Sinh có 6 cá koi bơi; bảng câu đối của các nhà thu nhỏ lại, vừa màn hình điện thoại.',
    ],
  },
  {
    title: 'Thêm sư thầy trực bàn, chú tiểu và phật tử',
    date: '2026-11-12',
    items: [
      'Chùa có 12 NPC: sư thầy trực bàn ghi công đức, 4 chú tiểu quét dọn, tiểu đánh chuông và 5 phật tử đi lễ.',
      'Tiểu đánh chuông đi lại quanh tháp và vườn cột kinh, về thỉnh chuông đúng giờ.',
      'Chú tiểu làm theo ca 20 phút, hết ca về tăng xá nằm nghỉ 10 phút trên giường rồi quay lại làm.',
      'Phật tử đi lễ có lúc rẽ thăm bến thả cá, bàn công đức, Điện Tam Thế hoặc đường hậu.',
    ],
  },
  {
    title: 'Sửa lỗi kẹt trong nhà',
    date: '2026-11-12',
    items: [
      'Đã sửa lỗi nhân vật bị kẹt khi đi lại trong các nhà: vật cản trong nhà và tường nhà không còn chồng lên nhau.',
      'Đèn dầu (đế gạch với chóp vàng) đã được dỡ khỏi các nhà vì đặt không hợp lý, nhất là trong thiền đường.',
    ],
  },
  {
    title: 'Tượng Quan Âm chibi mới',
    date: '2026-11-12',
    items: [
      'Tượng Quan Âm sân tượng vẽ lại theo thiết kế chibi v4: đầu to gần nửa chiều cao, mặt 3D mắt nhắm cười, má hồng to.',
      'Bình cam lộ đổi sang màu ngọc xanh, cành liễu lá tròn to, tay cầm chắc và rõ; vương miện vẫn có tượng Phật A Di Đà nhỏ.',
    ],
  },
  {
    title: 'Nội thất trong 7 nhà',
    date: '2026-11-12',
    items: [
      'Nhà Khách có bộ bàn trà và băng ghế dài; Tăng Xá có hai giường gỗ cùng bàn đèn dầu nhỏ.',
      'Trai Đường có bàn ăn dài, Nhà Tổ có ban thờ tổ với bài vị, lư hương và đôi bình hoa.',
      'Thiền Đường lát sàn gỗ, xếp hai dãy bồ đoàn ngồi thiền được thật cùng chiếc mõ gỗ; Phòng Ghi Công Đức có bàn dài, ghế trực và kệ sổ; Am Cổ có giường nhỏ, bồ đoàn và bàn trà.',
    ],
  },
  {
    title: 'Đi được tới Am Cổ',
    date: '2026-11-12',
    items: [
      'Sửa lỗi nhân vật bị chặn vô hình ở phía Bắc khuôn viên, nay có thể đi tới Am Cổ và vùng sát tường rào phía Bắc.',
    ],
  },
  {
    title: 'Tải mượt hơn, chuông đúng dáng',
    date: '2026-11-12',
    items: [
      'Gộp mesh các nhà (Nhà Tổ, Tăng Xá, Điện Mẫu, Nhà Khách, Thiền Đường, Trai Đường, Phòng Công Đức, Am Cổ) để giảm tải đồ họa.',
      'Chuông ở Tháp Chuông đã quay đúng chiều: miệng chuông hướng xuống.',
      'Ghế gỗ trong vườn giờ là vật cản.',
    ],
  },
  {
    title: 'Hành lang tượng vàng',
    date: '2026-11-12',
    items: [
      '12 tượng La Hán dọc hai hành lang giờ là 4 tượng cổ bằng vàng: La Hán cầm bình, nhà sư gỗ, Quan Âm ngồi và Quan Âm Thủy Nguyệt.',
    ],
  },
  {
    title: 'Tượng Phật vàng ở Vườn Tháp',
    date: '2026-11-12',
    items: [
      'Vườn Tháp có thêm một pho tượng Phật ngồi dát vàng bóng, đặt trên bệ đá, được dựng từ bản quét 3D của Bảo tàng Nghệ thuật Cleveland (CC0).',
      'Đi tới Vườn Tháp để ngắm tượng; tượng và bệ đá là vật cản nên nhân vật sẽ đi vòng quanh.',
    ],
  },
  {
    title: 'Chuyển động mượt hơn',
    date: '2026-11-12',
    items: [
      'Nhân vật tăng tốc và giảm tốc từ từ khi đi, chạy và dừng lại, không còn bật tắt đột ngột.',
      'Bước chân khớp với tốc độ di chuyển nên chân không còn trượt trên mặt đất.',
      'Khi bấm đi tới một điểm, nhân vật chậm dần khi đến gần; khi đổi hướng ngược lại sẽ giảm tốc rồi mới quay đầu.',
    ],
  },
  {
    title: 'Điện Tam Thế',
    date: '2026-11-12',
    items: [
      'Phía sau chánh điện có thêm Điện Tam Thế thờ ba vị Phật quá khứ, hiện tại và vị lai; đi từ tam quan lên qua các bậc thềm là tới nơi.',
      'Bản đồ chùa được chỉnh lại, nhãn các địa điểm không còn chồng lên nhau.',
      'Vào bên trong điện, góc nhìn tự lùi ra một chút để thấy đủ ba pho tượng.',
    ],
  },
  {
    title: 'Mở rộng khuôn viên chùa',
    date: '2026-11-11',
    items: [
      'Khuôn viên chùa rộng thêm hẳn: phía sau có Viện Khách Tăng và Viện Tổ — Tưởng niệm, mỗi viện một sân riêng có cổng.',
      'Mới có Vườn Phóng Sinh ở phía Đông chánh điện với ao và bến thả cá, phố nhỏ trước cổng chùa bán cơm chay, trà đá, phở chay.',
      'Thiền đường dời về bên vườn thiền, mặt hướng Đông; thêm Phòng Ghi Công Đức ở góc Tây Nam. Hành lang La Hán cũng rộng và thoáng hơn.',
    ],
  },
  {
    title: 'Lần hạt 108',
    date: '2026-11-11',
    items: [
      'Thêm tính năng Lần hạt: chạm từng hạt, đủ 108 hạt là hoàn thành một vòng — nhận công đức và xu.',
      'Mỗi ngày thưởng tối đa 5 vòng; các vòng sau vẫn tính vào Thành tựu tích lũy.',
      'Thêm 3 mốc thành tựu mới cho người lần hạt: 5, 25 và 100 vòng (xem trong mục Cấp độ).',
      'Vào giờ lễ và ngày Mùng 1, Rằm, công đức lần hạt cũng được nhân như các hành lễ khác.',
    ],
  },
  {
    title: 'Thành tựu tích lũy',
    date: '2026-11-11',
    items: [
      'Từ nay mỗi lần lễ Phật, tụng kinh, thả đèn và ngồi thiền đều được nhà chùa ghi nhận vào thành tựu tích lũy trọn đời.',
      'Đạt các mốc 100 lần lạy, 50 lượt kinh, 20 đèn hoa đăng, 30 phút thiền… là nhận xu và lễ vật ngay. Xem tiến độ trong mục Cấp độ.',
    ],
  },
  {
    title: 'Giờ lễ nhân công đức',
    date: '2026-11-11',
    items: [
      'Vào giờ tụng kinh 05:00, 12:00 và 20:00 mỗi ngày, mọi công đức từ thắp hương, lễ Phật, tụng kinh và thả đèn được nhân đôi (×2).',
      'Ngày Mùng 1 và Rằm âm lịch, công đức được nhân ×1,5 cả ngày; trùng giờ tụng kinh thì nhân ×3.',
    ],
  },
  {
    title: 'Vòng quay may mắn',
    date: '2026-11-11',
    items: [
      'Mỗi ngày quay 1 lượt miễn phí trong mục Trò chơi: trúng công đức, xu, Hương trầm và ô ĐẠI CÁT 100 công đức + 100 xu.',
    ],
  },
  {
    title: 'Hòm thư nhà chùa',
    date: '2026-11-11',
    items: [
      'Mở mục Hòm thư để đọc thư chào mừng kèm quà khi mới vào chùa: 20 công đức, 30 xu và lễ vật.',
      'Phật tử đã đồng hành từ trước cũng có quà ra mắt trong hòm thư — nhớ mở ra nhận nhé.',
    ],
  },
  {
    title: 'Điểm danh mỗi ngày',
    date: '2026-11-11',
    items: [
      'Mỗi ngày vào mục Điểm danh nhận công đức và xu; giữ chuỗi đủ 7 ngày để nhận thêm Đèn hoa đăng.',
      'Ngày mới bắt đầu lúc 07:00 giờ Việt Nam.',
    ],
  },
  {
    title: 'Chào mừng đến Chùa Online',
    date: '2026-01-01',
    items: [
      'Dạo quanh khuôn viên chùa, thắp hương và tụng kinh để tích công đức.',
      'Xin xăm mỗi ngày một quẻ, tham gia các trò chơi nhỏ trong chùa.',
    ],
  },
];
