import { BAO_THAP, BELL, DRUM, BRIDGE, BUDDHA_YARD, DECK, HALL, LAKE, PAGODA, PLAZA, QUAN, TAM_THE, THIEN_DUONG, VUON_THAP, WALL, ZEN, PHONG_CD, REST, TANG_XA } from '../layout';
import { NGOC } from '../../shared/campus';

export interface Place { name: string; x: number; z: number; r: number; ly?: number }

export const PLACES: Place[] = [
  { name: 'Chánh điện', x: HALL.x, z: HALL.z, r: 8 },
  { name: 'Sân thiền trái', x: -(DECK.x0 + DECK.x1) / 2, z: (DECK.z0 + DECK.z1) / 2, r: 5 },
  { name: 'Sân thiền phải', x: (DECK.x0 + DECK.x1) / 2, z: (DECK.z0 + DECK.z1) / 2, r: 5 },
  { name: 'Sân chùa', x: PLAZA.x, z: PLAZA.z, r: 8 },
  { name: 'Gác chuông', x: BELL.x, z: BELL.z, r: 4 },
  { name: 'Gác trống', x: DRUM.x, z: DRUM.z, r: 4 },
  { name: 'Tháp Quan Âm', x: QUAN.x, z: QUAN.z, r: 4 },
  { name: 'Đại Phật', x: BUDDHA_YARD.x, z: BUDDHA_YARD.z, r: 5 },
  { name: 'Bảo tháp', x: BAO_THAP.x, z: BAO_THAP.z + 7.4, r: 4 },
  { name: 'Điện Tam Thế', x: TAM_THE.x, z: TAM_THE.z + 6, r: 8 },
  { name: 'Tháp cảnh', x: PAGODA.x, z: PAGODA.z, r: 4 },
  { name: 'Nhà Tổ', x: 36, z: -62.5, r: 4 },
  { name: 'Tăng xá', x: TANG_XA.x, z: TANG_XA.z + 4.5, r: 4 },
  { name: 'Nhà khách', x: -47, z: -55.5, r: 4 },
  { name: 'Trai đường', x: -29, z: -55.5, r: 4 },
  { name: 'Am Cổ', x: 50, z: -72, r: 4 },
  { name: 'Vườn Tháp', x: VUON_THAP.x, z: VUON_THAP.z + 4, r: 4 },
  { name: 'Thiền đường', x: THIEN_DUONG.x, z: -27, r: 4 },
  { name: 'Phòng Ghi Công Đức', x: PHONG_CD.x + 4.5, z: PHONG_CD.z, r: 4 },
  { name: 'Khu nghỉ', x: REST.x, z: REST.z, r: 4 },
  { name: 'Vườn Phóng Sinh', x: 30, z: -31, r: 4 },
  { name: 'Điện Mẫu', x: 39, z: 10, r: 4 },
  { name: 'Đền Trình', x: 11, z: 39, r: 4 },
  { name: 'Hồ cá koi', x: LAKE.x, z: BRIDGE.z1 + 1.5, r: 4 },
  { name: 'Cầu cong', x: BRIDGE.x, z: (BRIDGE.z0 + BRIDGE.z1) / 2, r: 3 },
  { name: 'Tam quan', x: 0, z: WALL.zS - 4, r: 4 },
  { name: 'Rừng trúc', x: 80, z: 2, r: 5 },
  { name: 'Vườn rau chùa', x: -76, z: -42, r: 6 },
  { name: 'Tịnh thất', x: -64, z: -61.4, r: 3 },
  { name: 'Hồ sen Tây', x: -78, z: 2, r: 5 },
  { name: 'Đình ngắm sen', x: -70, z: 5, r: 3 },
  { name: 'Điện Dược Sư', x: 77, z: -32, r: 4 },
  { name: 'Vườn hoa', x: 79, z: 28, r: 6 },
  { name: 'Chùa Ngọc', x: NGOC.x, z: NGOC.z, r: 4, ly: NGOC.y },
  { name: 'Động thiền', x: -26, z: -102, r: 4 },
  { name: 'Rừng thông', x: 26, z: -108, r: 5 },
  { name: 'Sông Đông', x: 65, z: 2, r: 3 },
  { name: 'Cổng Tây', x: -90, z: 2, r: 3 },
  { name: 'Cổng Đông', x: 90, z: 2, r: 3 },
];

const BY_NAME = new Map(PLACES.map((p) => [p.name, p] as const));

/** Tra tọa độ theo tên trong PLACES, cộng thêm offset. Báo lỗi ngay lúc load module nếu tên không tồn tại. */
function at(name: string, dx = 0, dz = 0): { x: number; z: number } {
  const p = BY_NAME.get(name);
  if (!p) throw new Error(`places: không có địa điểm "${name}" trong PLACES`);
  return { x: p.x + dx, z: p.z + dz };
}

/** Điểm dịch chuyển của quản trị viên (tab "Dịch chuyển"). */
export const TELEPORT_DEST: { label: string; x: number; z: number }[] = [
  { label: 'Sân trước điện', ...at('Sân chùa') },
  // Cố tình đứng trước thềm: 12 đơn vị về phía nam tâm điện, không phải tâm điện.
  { label: 'Chính Điện (trước thềm)', ...at('Chánh điện', 0, 12) },
  // Cố tình đứng ở chân cầu thang: 12 đơn vị về phía nam điểm của Điện Tam Thế.
  { label: 'Điện Tam Thế (chân cầu thang)', ...at('Điện Tam Thế', 0, 12) },
  // Cố tình đứng phía nam bảo tháp, chỗ có bậc thềm: 7 đơn vị về phía nam tâm tháp.
  { label: 'Bảo Tháp (phía nam)', ...at('Bảo tháp') },
  { label: 'Cầu cong giữa hồ', ...at('Cầu cong') },
  { label: 'Sân Quan Âm', ...at('Tháp Quan Âm') },
  { label: 'Sân Phật (phía Tây)', ...at('Đại Phật') },
  { label: 'Điện Mẫu', ...at('Điện Mẫu') },
  // Phố trước cổng, ngoài tường chùa, không có trong PLACES.
  { label: 'Chợ phiên', x: 47, z: 50 },
  { label: 'Vườn Phóng Sinh (bến thả)', ...at('Vườn Phóng Sinh') },
  { label: 'Thiền đường', ...at('Thiền đường') },
  { label: 'Vườn Thiền', x: ZEN.x, z: ZEN.z },
  ...['Rừng trúc', 'Vườn rau chùa', 'Tịnh thất', 'Hồ sen Tây', 'Điện Dược Sư', 'Vườn hoa', 'Chùa Ngọc', 'Động thiền', 'Rừng thông', 'Vườn Tháp', 'Sông Đông', 'Cổng Tây', 'Cổng Đông'].map(name => ({ label: name, ...at(name) })),
];
