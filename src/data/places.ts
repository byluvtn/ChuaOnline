import { BAO_THAP, BELL, DRUM, BUDDHA_YARD, DECK, HALL, LAKE, PAGODA, PLAZA, QUAN, TAM_THE, THIEN_DUONG, VUON_THAP, WALL, ZEN, REST, TANG_XA } from '../layout';
import { BAMBOO, DUOC_SU_DOOR, FLOWER_HILL, NGOC, PHONG_CD_DOOR, RIVER_BRIDGES, TINH_THAT, TINH_THAT_LANE_Z, FARM, FARM_POND, LOTUS, LOTUS_PAVILION } from '../../shared/campus';
import { RIVER_DOCK } from '../../shared/river-tour';

export interface Place { name: string; x: number; z: number; r: number; ly?: number }

/**
 * Bản đồ điểm đến. Mọi toạ độ lấy từ hằng số layout/campus (không viết cứng vị trí công trình),
 * trừ vài điểm đứng ngoài hằng số (chợ phiên, bến thả cá).
 */
export const PLACES: Place[] = [
  { name: 'Chánh điện', x: HALL.x, z: HALL.z, r: 8 },
  { name: 'Sân thiền trái', x: -(DECK.x0 + DECK.x1) / 2, z: (DECK.z0 + DECK.z1) / 2, r: 5 },
  { name: 'Sân thiền phải', x: (DECK.x0 + DECK.x1) / 2, z: (DECK.z0 + DECK.z1) / 2, r: 5 },
  { name: 'Sân chùa', x: PLAZA.x, z: PLAZA.z, r: 8 },
  { name: 'Gác chuông', x: BELL.x, z: BELL.z, r: 4 },
  { name: 'Gác trống', x: DRUM.x, z: DRUM.z, r: 4 },
  { name: 'Sân Quan Âm', x: QUAN.x, z: QUAN.z, r: 4 },
  { name: 'Đại Phật', x: BUDDHA_YARD.x, z: BUDDHA_YARD.z, r: 5 },
  // A3: Bảo tháp dời về Tây-Bắc Động Thiền; chip đứng ở bậc thềm phía Nam.
  { name: 'Bảo tháp', x: BAO_THAP.x, z: BAO_THAP.z + 8, r: 4 },
  { name: 'Điện Tam Thế', x: TAM_THE.x, z: TAM_THE.z + 6, r: 8 },
  { name: 'Tháp cảnh', x: PAGODA.x, z: PAGODA.z, r: 4 },
  { name: 'Nhà Tổ', x: 36, z: -62.5, r: 4 },
  { name: 'Tăng xá', x: TANG_XA.x, z: TANG_XA.z + 4.5, r: 4 },
  { name: 'Nhà khách', x: -47, z: -55.5, r: 4 },
  { name: 'Trai đường', x: -29, z: -55.5, r: 4 },
  { name: 'Am Cổ', x: 50, z: -72, r: 4 },
  { name: 'Vườn Tháp', x: VUON_THAP.x, z: VUON_THAP.z + 4, r: 4 },
  { name: 'Thiền đường', x: THIEN_DUONG.x, z: -27, r: 4 },
  { name: 'Phòng Ghi Công Đức', ...PHONG_CD_DOOR, r: 4 },
  { name: 'Khu nghỉ', x: REST.x, z: REST.z, r: 4 },
  { name: 'Vườn Phóng Sinh', x: 30, z: -31, r: 4 },
  // C2: bến thả cá ở bờ Tây ao phóng sinh, không phải tâm vườn.
  { name: 'Bến thả phóng sinh', x: 27.5, z: -31, r: 3 },
  { name: 'Điện Mẫu', x: 39, z: 10, r: 4 },
  { name: 'Đền Trình', x: 11, z: 39, r: 4 },
  // C1/L1: hồ cá koi không còn cầu đỏ; điểm đứng ở bờ Nam hồ.
  { name: 'Hồ cá koi', x: LAKE.x, z: LAKE.z + LAKE.b + 3.5, r: 5 },
  // C2: hai làn bờ hồ thay cho cầu đỏ đã bỏ.
  { name: 'Bờ Đông hồ koi', x: LAKE.a + 2.4, z: LAKE.z, r: 4 },
  { name: 'Bờ Tây hồ koi', x: -LAKE.a - 2.4, z: LAKE.z, r: 4 },
  { name: 'Bia công đức', x: 18.8, z: 11.4, r: 3 },
  { name: 'Tam quan', x: 0, z: WALL.zS - 4, r: 4 },
  { name: 'Rừng trúc', x: BAMBOO.x, z: (BAMBOO.z0 + BAMBOO.z1) / 2, r: 5 },
  { name: 'Vườn rau chùa', x: FARM.x, z: FARM.z, r: 6 },
  // C2: cổng vườn rau đúng khe hàng rào phía Đông, và bờ ao vườn rau.
  { name: 'Cổng vườn rau', x: -64, z: -42, r: 3 },
  { name: 'Ao vườn rau', x: FARM_POND.x, z: FARM_POND.z + FARM_POND.b + 1.6, r: 3 },
  { name: 'Tịnh thất', x: TINH_THAT[1].x, z: TINH_THAT_LANE_Z, r: 3 },
  // A4: hồ sen dời lên cạnh vườn rau; chip đứng ở bờ Nam hồ, chỗ có lối lát.
  { name: 'Hồ sen Tây', x: LOTUS.x, z: LOTUS.z + LOTUS.b + 3.5, r: 5 },
  { name: 'Đình ngắm sen', x: LOTUS_PAVILION.x, z: LOTUS_PAVILION.z - 4, r: 3 },
  { name: 'Điện Dược Sư', ...DUOC_SU_DOOR, r: 4 },
  { name: 'Vườn hoa', x: FLOWER_HILL.x, z: (FLOWER_HILL.z0 + FLOWER_HILL.z1) / 2, r: 6 },
  { name: 'Chùa Ngọc', x: NGOC.x, z: NGOC.z, r: 4, ly: NGOC.y },
  { name: 'Động thiền', x: -26, z: -102, r: 4 },
  { name: 'Rừng thông', x: 26, z: -108, r: 5 },
  // C2: giữ điểm cầu Nam (z = 2) và thêm điểm cầu Bắc (z = −38).
  { name: 'Sông Đông', x: RIVER_BRIDGES[1].x, z: RIVER_BRIDGES[1].z, r: 3 },
  { name: 'Cầu Sông Đông Bắc', x: RIVER_BRIDGES[0].x, z: RIVER_BRIDGES[0].z, r: 3 },
  { name: 'Bến thuyền', ...RIVER_DOCK },
  { name: 'Cổng Tây', x: WALL.xW + 2, z: WALL.sideGateZ, r: 3 },
  { name: 'Cổng Đông', x: WALL.xE - 2, z: WALL.sideGateZ, r: 3 },
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
  // Cố tình đứng phía nam bảo tháp, chỗ có bậc thềm: 8 đơn vị về phía nam tâm tháp.
  { label: 'Bảo Tháp (phía nam)', ...at('Bảo tháp') },
  { label: 'Hồ cá koi (bờ nam)', ...at('Hồ cá koi') },
  { label: 'Sân Quan Âm', ...at('Sân Quan Âm') },
  { label: 'Sân Phật (phía Tây)', ...at('Đại Phật') },
  { label: 'Điện Mẫu', ...at('Điện Mẫu') },
  // Phố trước cổng, ngoài tường chùa, không có trong PLACES.
  { label: 'Chợ phiên', x: 47, z: 50 },
  { label: 'Vườn Phóng Sinh (bến thả)', ...at('Bến thả phóng sinh') },
  { label: 'Thiền đường', ...at('Thiền đường') },
  { label: 'Vườn Thiền', x: ZEN.x, z: ZEN.z },
  ...['Rừng trúc', 'Vườn rau chùa', 'Cổng vườn rau', 'Ao vườn rau', 'Tịnh thất', 'Hồ sen Tây', 'Đình ngắm sen', 'Điện Dược Sư', 'Vườn hoa', 'Chùa Ngọc', 'Động thiền', 'Rừng thông', 'Vườn Tháp', 'Sông Đông', 'Cầu Sông Đông Bắc', 'Cổng Tây', 'Cổng Đông'].map(name => ({ label: name, ...at(name) })),
];
