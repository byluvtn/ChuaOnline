// shared/roads.ts
// Road graph. Pure data and pure functions (imports only the pure shared Dijkstra, server + client safe).
// No src/ import here on purpose: every coordinate below is a literal mirror of the
// 24/7 campus constants (shared/campus.ts, src/layout.ts) so the server graph and the
// scene cannot drift apart, and the graph stays usable from the client too.
//
// â”€â”€ 24/7 campus (17.11.2026 plan) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Compound is now 184 Ã— 167 m: wall x Â±92, z âˆ’122â€¦45, side gates at (Â±92, 2) on the
// cross path z = 2, south gate (0, 45), no north gate. The old Â±62 / âˆ’82 compound ring
// is gone, so the garden ring moved out to x = Â±59 (rearW / rearE keep their ids; the
// "rear road" is still z = âˆ’46).
//
// Moved landmarks used below:
//   koi lake (0, 14) a 14 Ã— b 10 â†’ water z 4â€¦24, bridge deck z 2â€¦26 (x Â±1.15)
//   bell tower (+34, âˆ’6) Â· drum tower (âˆ’34, âˆ’6)
//   Báº£o ThÃ¡p (âˆ’34, âˆ’15): octagon platform out to r â‰ˆ 6.8, south steps z âˆ’10â€¦âˆ’8.2
//   rest area (-35, 33), merit office (35, 33), west door (30.5, 33)
//   TÄƒng XÃ¡ (âˆ’64, âˆ’74) with its south door (âˆ’64, âˆ’70.5); three tá»‹nh tháº¥t at
//   (âˆ’67,âˆ’67), (âˆ’61,âˆ’67), (âˆ’64,âˆ’63.8). The OLD TÄƒng XÃ¡ site (âˆ’41, âˆ’71) is empty:
//   no node and no edge goes there any more.
//   VÆ°á»n ThÃ¡p (cemetery) (50, âˆ’94), entered from the north bypass at (50, âˆ’82)
//   lotus lake (âˆ’78, âˆ’2) a 10 Ã— b 7, boardwalk on z = 2 (x âˆ’88â€¦âˆ’66), pavilion (âˆ’70, 5)
//   vÆ°á»n rau (âˆ’76, âˆ’42) with the small pond (âˆ’70, âˆ’35); its ONLY gate is the east gap
//   in the fence at (âˆ’64, z âˆ’44â€¦âˆ’40)
//   Äiá»‡n DÆ°á»£c SÆ° (77, âˆ’38), south door / steps at z â‰ˆ âˆ’33, westward lane at x = 69
//   rá»«ng trÃºc (80, âˆ’3) Â· vÆ°á»n hoa (79, 28)
//   east river x 63â€¦67, z âˆ’82â€¦14, crossed only at z = 2 and z = âˆ’38
//   ChÃ¹a Ngá»c stairs x = 0, z âˆ’82â€¦âˆ’112 (height is the client's business)
//   Ä‘á»™ng thiá»n (âˆ’26, âˆ’104), mouth opens south at z â‰ˆ âˆ’103.4
//
// AXIS CHANGE: the lake grew north to z = 4, so the old plaza (0, 6) and both bridge
// nodes stood in water. plaza is now the crossroads of the axis and the cross path at
// (0, 2) â€” the north head of the bridge deck; bridgeN (0, 1.5) is the last dry point
// north of the deck, bridgeS (0, 26.5) the first dry point south of it.
//
// CROSS PATH z = 2 is dry everywhere (the koi lake starts at z = 4):
//   sideGateW â†’ lotus boardwalk (âˆ’88â€¦âˆ’66) â†’ pathW4â€¦pathW1 â†’ plaza â†’ pathE1â€¦pathE4
//   â†’ river bridge at x = 65 â†’ rá»«ng trÃºc â†’ sideGateE.
// The Quan Ã‚m and Pháº­t TÃ¢y spokes join it through quanSE / buddhaYard, never with a
// straight line through the statue courts.
//
// PLATFORM NOTE (Tam Tháº¿, unchanged): footprint x âˆ’20â€¦20, z âˆ’80â€¦âˆ’56, top y = 3.0. The
// only walkable entry is the central stair on the south face (|x| <= 4.2, z âˆ’50 â†’ âˆ’56);
// the other three faces are a 3 m wall. z = âˆ’40 for |x| < 17 is ON the hall floor, so the
// stair approach is still the east-aisle run (hallIn â†’ hallAisleE â†’ hallAisleN â†’
// stairApp â†’ stairTop). The north side is reachable only by the bypass at z = âˆ’82 that
// hugs the platform's north wall (westRearGate â†’ bypassW â†’ caveBypass â†’ ngocBase â†’
// pineBypass â†’ bypassE â†’ cemeteryGate â†’ eastRearGate). The ChÃ¹a Ngá»c stair starts at
// (0, âˆ’82), i.e. on that bypass, so the summit needs no platform or hall crossing.
//
// Building / water rules encoded below (main's live diagnostics, 17.11.2026):
//   Â· no edge crosses the koi lake, the lotus lake, the farm pond or the east river
//     except on the deck corridors named above;
//   Â· the farm is entered through its east gate only (the fence has no other gap);
//   Â· Báº£o ThÃ¡p is circled (baoE / baoW) instead of being crossed;
//   Â· ktYard no longer runs straight to the moved TÄƒng XÃ¡ door;
//   Â· Äiá»‡n DÆ°á»£c SÆ° is entered from the west river bank at x = 69 and then along the
//     south lane â€” never through its west wall;
//   Â· the rest garden reaches the cross path along the paved z â‰ˆ 41 lane, not across
//     the koi lake.

import { dijkstra, reconstructPath, type DijkstraEdge } from './dijkstra';
import { BAMBOO, DUOC_SU_DOOR, duocSuWorld, FLOWER_HILL, NGOC, NORTH_WALK_Z, PHONG_CD_DOOR, RIVER_BRIDGES, RIVER_EAST_WALK_X, TINH_THAT, TINH_THAT_LANE_Z, WALL } from './campus';

export type Pt = { x: number; z: number }

export interface RoadNode {
  id: string
  x: number
  z: number
}

const [northRiverBridge, southRiverBridge] = RIVER_BRIDGES;

export const ROAD_NODES: RoadNode[] = [
  // â”€â”€ Axis (koi bridge deck z 2â€¦26 is the only crossing on the axis) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'gate', x: 0, z: 43.5 },
  { id: 'bridgeS', x: 0, z: 26.5 }, // was (0, 30.2); lake now reaches z = 24
  { id: 'bridgeN', x: 0, z: 1.5 }, // was (0, 13.8); lake now starts at z = 4
  { id: 'plaza', x: 0, z: 2 }, // was (0, 6) â€” axis / cross-path crossroads
  { id: 'axisMid', x: 4.2, z: -17 }, // east of the centered courtyard incense urn
  { id: 'hallFront', x: 0, z: -20 },
  { id: 'hallIn', x: 0, z: -24 },
  { id: 'hallWestWp', x: -21, z: -12.5 }, // west of the x=-18.1 colonnade
  { id: 'hallEastWp', x: 24.5, z: -12.3 }, // gap between columns (22.5,-13.5) and (22.9,-11.2)
  { id: 'hallSE', x: 20, z: -19 }, // outside the hall corner (hx 17, south face z -22)
  { id: 'corrW2', x: -24, z: -16 }, // west of the La HÃ¡n corridor (x -20.5 half 2.6)
  // â”€â”€ Cross path z = 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'pathW1', x: -16, z: 2 },
  { id: 'pathW2', x: -28, z: 2 },
  { id: 'pathW3', x: -40, z: 2 },
  { id: 'pathW4', x: -52, z: 2 },
  { id: 'pathE1', x: 16, z: 2 },
  { id: 'pathE2', x: 28, z: 2 },
  { id: 'pathE3', x: 40, z: 2 },
  { id: 'pathE4', x: 52, z: 2 },
  { id: 'sideGateW', x: WALL.xW, z: WALL.sideGateZ },
  // â”€â”€ Rear road z = âˆ’46 (garden ring x = Â±59) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'rearW', x: -59, z: -46 },
  { id: 'rearKT', x: -30, z: -46 },
  { id: 'rearTO', x: 30, z: -46 },
  { id: 'rearE', x: 59, z: -46 },
  { id: 'westMid', x: -22, z: -26 },
  { id: 'westNorth', x: -22, z: -46 },
  { id: 'eastMid', x: 22, z: -26 },
  { id: 'eastNorth', x: 22, z: -46 },
  // â”€â”€ Stair route (east aisle around the altar) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'hallAisleE', x: 14, z: -38 },
  { id: 'hallAisleN', x: 14, z: -41.8 },
  { id: 'stairApp', x: 4, z: -55.8 },
  { id: 'stairTop', x: 0, z: -56 },
  { id: 'tamThe', x: 0, z: -58 },
  // â”€â”€ Towers, yards, halls (ids preserved; positions follow the moved landmarks) â”€
  { id: 'bellTower', x: 34, z: -6 }, // bell tower = +34
  { id: 'bellW', x: 28, z: -6 }, // paved lane x = 28 under the bell tower
  { id: 'drumTower', x: -34, z: -6 }, // drum tower = âˆ’34
  { id: 'drumTowerW', x: -40, z: -8 }, // west of the drum tower
  { id: 'zenOut', x: -28.3, z: -8 }, // east of the drum tower, at the z = -17 wall gap
  { id: 'quanYard', x: 28, z: 19.5 },
  { id: 'quanE', x: 34, z: 14 }, // east of the Quan Ã‚m court (statue at 28,14)
  { id: 'quanSE', x: 34, z: 7 },
  { id: 'buddhaYard', x: -22.6, z: 14 },
  { id: 'denTrinh', x: 11, z: 39 },
  { id: 'restArea', x: -35, z: 33 }, // khu nghá»‰ (WEST now)
  { id: 'restEast', x: -27, z: 33 },
  { id: 'restSE', x: -27, z: 39 },
  { id: 'laneSW2', x: -27, z: 41.5 }, // paved south lane (z 39.8â€¦42.2)
  { id: 'laneSW1', x: -14, z: 41.5 },
  { id: 'laneSE1', x: 14, z: 41.5 },
  { id: 'denN', x: 11.5, z: 35.5 },
  { id: 'denE', x: 18, z: 37 },
  { id: 'denE2', x: 18, z: 42 },
  { id: 'dienMau', x: 39, z: 14.5 },
  { id: 'dienMauW', x: 33, z: 11 }, // paved lane x 27â€¦36 to the Äiá»‡n Máº«u forecourt
  { id: 'bodhiTree', x: 35.5, z: 20 },
  // Báº£o ThÃ¡p (âˆ’34, âˆ’15): stop south of the steps, two cipher lanes east / west.
  { id: 'baoThap', x: -34, z: -7.6 },
  { id: 'baoE', x: -25, z: -11 },
  { id: 'baoW', x: -41, z: -11 },
  { id: 'phongCDDoor', ...PHONG_CD_DOOR },
  { id: 'phongCDLane', x: PHONG_CD_DOOR.x - 3.2, z: PHONG_CD_DOOR.z },
  { id: 'phongCDSouth', x: PHONG_CD_DOOR.x - 3.2, z: 41.5 },
  // â”€â”€ VÆ°á»n TÃ¢y (ornamental garden) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'gateW', x: -10.6, z: 40.7 },
  { id: 'vuonCayE', x: -37.8, z: 28.4 },
  { id: 'vuonCay', x: -48, z: 24.5 },
  { id: 'vuonCayIn', x: -48, z: 22 },
  { id: 'vuonCayE2', x: -42, z: 22 },
  { id: 'vuonCayLane', x: -42, z: 18 },
  { id: 'vuonCayNW', x: -58, z: 6 },
  { id: 'vuonCayN', x: -48, z: 6 },
  { id: 'vuonCayNE', x: -38, z: 6 },
  // â”€â”€ Zen garden, phÃ³ng sinh pond, pond pier â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'psPier', x: 30, z: -31 },
  { id: 'psW', x: 25.5, z: -31 },
  { id: 'thienDuong', x: -39.5, z: -27.5 },
  { id: 'zenGarden', x: -35.75, z: -27.25 },
  { id: 'corrW', x: -20.5, z: -6 },
  { id: 'corrWMid', x: -20.5, z: -16.6 }, // trục giữa hành lang tây, lối vào corrW tránh bệ tượng (-22.35,-16.6)
  { id: 'pillars', x: 0, z: -5.9 },
  { id: 'zenIn', x: -28.3, z: -27 },
  { id: 'zenW', x: -26, z: -26.6 },
  { id: 'zenE1', x: -18, z: -20 },
  { id: 'zenE2', x: -18, z: -24 },
  // â”€â”€ West monastery (Viá»‡n KhÃ¡ch TÄƒng) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'ktGate', x: -30, z: -54 },
  { id: 'ktIn', x: -30, z: -57 },
  { id: 'ktMid', x: -34, z: -56 },
  { id: 'ktYard', x: -41, z: -60 },
  // â”€â”€ East monastery (Viá»‡n Tá»•) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'toGate', x: 30, z: -54 },
  { id: 'toIn', x: 30, z: -58 },
  { id: 'toYard', x: 41, z: -58 },
  { id: 'toE', x: 50, z: -58 },
  { id: 'amCoE1', x: 57, z: -58 },
  { id: 'amCoE2', x: 57, z: -68.5 },
  { id: 'amCoDoor', x: 53, z: -71 },
  { id: 'amCoEast', x: 57.2, z: -75 },
  // â”€â”€ Market outside the south gate (quest v1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'marketGate', x: 0, z: 46 },
  { id: 'marketW1', x: -4.5, z: 47 },
  { id: 'marketE1', x: 4.5, z: 47 },
  { id: 'marketW2', x: -4.5, z: 54 },
  { id: 'marketE2', x: 4.5, z: 54 },
  { id: 'marketS', x: 0, z: 56 },
  { id: 'marketR1', x: 7, z: 51 },
  { id: 'marketR2', x: 12, z: 51 },
  { id: 'marketR3', x: 17, z: 51 },
  { id: 'marketR4', x: 22, z: 51 },
  { id: 'marketR5', x: 27, z: 51 },
  { id: 'marketR6', x: 32, z: 51 },
  { id: 'marketR7', x: 37, z: 51 },
  { id: 'marketR8', x: 42, z: 51 },
  { id: 'marketR9', x: 47, z: 51 },
  { id: 'marketR10', x: 52, z: 51 },
  { id: 'marketS1', x: 7, z: 58 },
  { id: 'marketS2', x: 12, z: 58 },
  { id: 'marketS3', x: 17, z: 58 },
  { id: 'marketS4', x: 22, z: 58 },
  { id: 'marketS5', x: 27, z: 58 },
  { id: 'marketS6', x: 32, z: 58 },
  { id: 'marketS7', x: 37, z: 58 },
  { id: 'marketS8', x: 42, z: 58 },
  { id: 'marketS9', x: 47, z: 58 },
  { id: 'marketS10', x: 52, z: 58 },
  // â”€â”€ WEST BRANCH: lotus lake â†’ vÆ°á»n rau â†’ TÄƒng XÃ¡ + tá»‹nh tháº¥t â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'lotusBridgeW', x: -88, z: 2 },
  { id: 'lotusBridgeS', x: -78, z: 2 },
  { id: 'lotusBridgeE', x: -66, z: 2 },
  { id: 'lotusPavE', x: -66, z: 8 }, // dry bank east of the lake, clear of the bridge rail
  { id: 'lotusPavS', x: -70, z: 9.2 }, // south of the pavilion (its east rail ends at z 7.3)
  { id: 'lotusPavilion', x: -70, z: 5.5 }, // inside the pavilion, between its four columns
  { id: 'lotusNE', x: -66, z: -13 }, // dry east bank, north of the lake (lake ends z âˆ’9)
  { id: 'westRingN', x: -59, z: -20 }, // garden ring, north end
  { id: 'farmGate', x: -64, z: -42 }, // the fence's only gap (east side, z âˆ’44â€¦âˆ’40)
  { id: 'farm', x: -76, z: -44.2 }, // inside the vÆ°á»n rau, clear of the vegetable beds
  { id: 'tangXaJct', x: -64, z: -69.5 }, // south lane node in front of TÄƒng XÃ¡ (clear of its SE corner post at -59,-71.5 r1.14)
  { id: 'tangxaMid', x: -59, z: -59.5 }, // west of the Viá»‡n KhÃ¡ch TÄƒng fence (x âˆ’58)
  { id: 'tangXaDoor', x: -64, z: -70.5 }, // TÄƒng XÃ¡ (âˆ’64,âˆ’74) south door
  { id: 'westOuterN', x: -71.5, z: -59.5 },
  { id: 'westOuterM', x: -71.5, z: -68.4 },
  { id: 'westOuterS', x: -71.5, z: -79 },
  { id: 'tinhThatJct', x: -71.5, z: TINH_THAT_LANE_Z },
  { id: 'tangXaApproach', x: -64, z: -68.4 },
  ...TINH_THAT.map(({ x }, i) => ({ id: `tinhThat${i + 1}`, x, z: TINH_THAT_LANE_Z })),
  // â”€â”€ EAST BRANCH: river, rá»«ng trÃºc, Äiá»‡n DÆ°á»£c SÆ°, vÆ°á»n hoa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'riverBankW', x: southRiverBridge.x - southRiverBridge.halfSpan, z: southRiverBridge.z },
  { id: 'riverBridgeS', x: southRiverBridge.x, z: southRiverBridge.z },
  { id: 'riverBankE', x: RIVER_EAST_WALK_X, z: southRiverBridge.z },
  { id: 'bamboo', ...BAMBOO },
  { id: 'bambooS2', x: BAMBOO.x, z: southRiverBridge.z },
  { id: 'bambooN', x: BAMBOO.x, z: -20 },
  { id: 'bambooS', x: FLOWER_HILL.x, z: 10 },
  { id: 'riverPathN', x: RIVER_EAST_WALK_X, z: -20 },
  { id: 'riverBridgeN', x: northRiverBridge.x, z: northRiverBridge.z },
  { id: 'riverNorthW', x: 59, z: northRiverBridge.z },
  { id: 'riverNorthE', x: RIVER_EAST_WALK_X, z: northRiverBridge.z },
  { id: 'duocSuDoor', ...DUOC_SU_DOOR },
  { id: 'duocSu', ...duocSuWorld(0, 2.5) },
  { id: 'flowerHill', ...FLOWER_HILL },
  { id: 'sideGateE', x: WALL.xE, z: WALL.sideGateZ },
  // â”€â”€ NORTH BRANCH: bypass behind Tam Tháº¿, Ngá»c stairs, cave, cemetery â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'westRearGate', x: -68, z: -82 }, // ring turns west around the r1.14 corner at (-59,-71.5)
  { id: 'bypassW', x: -40, z: -82 },
  { id: 'caveBypass', x: -16, z: -82 },
  { id: 'ngocApproach', x: NGOC.x, z: NORTH_WALK_Z },
  { id: 'ngocBase', x: NGOC.x, z: NGOC.stairStart },
  { id: 'ngocMid', x: NGOC.x, z: (NGOC.stairStart + NGOC.stairTop) / 2 },
  { id: 'ngocTop', x: NGOC.x, z: NGOC.stairTop },
  { id: 'ngocCourt', x: NGOC.x, z: NGOC.z },
  { id: 'pineBypass', x: 18, z: -82 },
  { id: 'bypassE', x: 40, z: -82 },
  { id: 'cemeteryGate', x: 50, z: -82 },
  { id: 'eastRearGate', x: 59, z: -82 },
  { id: 'cemetery', x: 50, z: -90 }, // VÆ°á»n ThÃ¡p má»›i â€” stop at the lawn edge, short of the r0.85 grave marker at (50,-93.8)
  { id: 'caveEntry', x: -16, z: -86 },
  { id: 'caveMid', x: -16, z: -92 },
  { id: 'caveElbow', x: -24, z: -96 },
  { id: 'cavePath', x: -24, z: -101 },
  { id: 'cave', x: -26, z: -104 }, // Ä‘á»™ng thiá»n, entered through the open south mouth
  { id: 'pineRestW', x: -30, z: -95 },
  { id: 'pineEntry', x: 18, z: -88 },
  { id: 'pinePath', x: 26, z: -92 },
  { id: 'pineRestE', x: 28, z: -100 },
]

export const HOUSE_DOORS: { id: string; x: number; z: number }[] = [
  { id: 'traiDuong', x: -29, z: -58.25 },
  { id: 'nhaKhach', x: -47, z: -56.55 },
  { id: 'amCo', x: 53, z: -72.25 },
  { id: 'tangXa', x: -64, z: -70.5 },
  { id: 'thienDuong', x: -40.5, z: -27 },
  { id: 'phongCongDuc', ...PHONG_CD_DOOR },
  { id: 'nhaTo', x: 36, z: -64.75 },
  { id: 'duocSu', ...DUOC_SU_DOOR },
]

export const ROAD_EDGES: [string, string][] = [
  // â”€â”€ Axis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['gate', 'bridgeS'], ['bridgeS', 'bridgeN'], ['bridgeN', 'plaza'],
  ['plaza', 'axisMid'], ['axisMid', 'hallFront'], ['hallFront', 'hallIn'],
  ['plaza', 'pillars'],
  // â”€â”€ Cross path z = 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['plaza', 'pathW1'], ['pathW1', 'pathW2'], ['pathW2', 'pathW3'], ['pathW3', 'pathW4'], ['pathW4', 'lotusBridgeE'],
  ['plaza', 'pathE1'], ['pathE1', 'pathE2'], ['pathE2', 'pathE3'], ['pathE3', 'pathE4'], ['pathE4', 'riverBankW'],
  ['sideGateW', 'lotusBridgeW'], ['lotusBridgeW', 'lotusBridgeS'], ['lotusBridgeS', 'lotusBridgeE'],
  // â”€â”€ Hall / corridors / stair â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['hallFront', 'hallWestWp'], ['hallWestWp', 'corrW'], ['corrW', 'corrWMid'], ['corrWMid', 'westMid'], ['corrW', 'corrW2'], ['corrW2', 'westMid'],
  ['hallFront', 'hallSE'], ['hallSE', 'eastMid'],
  ['pathE1', 'hallEastWp'],
  ['hallIn', 'hallAisleE'], ['hallAisleE', 'hallAisleN'], ['hallAisleN', 'stairApp'], ['stairApp', 'stairTop'], ['stairTop', 'tamThe'],
  // â”€â”€ Towers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['pathE2', 'bellW'], ['bellW', 'bellTower'], ['hallEastWp', 'bellTower'],
  ['drumTower', 'drumTowerW'], ['drumTower', 'zenOut'], ['zenOut', 'pathW2'],
  // â”€â”€ Rear road z = âˆ’46 and bypasses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['westMid', 'westNorth'], ['westNorth', 'rearKT'], ['rearKT', 'rearW'], ['rearW', 'westRingN'],
  ['eastMid', 'eastNorth'], ['eastNorth', 'rearTO'], ['rearTO', 'rearE'], ['rearE', 'riverNorthW'],
  ['psPier', 'psW'], ['psW', 'eastMid'],
  // â”€â”€ West monastery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['rearKT', 'ktGate'], ['ktGate', 'ktIn'], ['ktIn', 'ktMid'], ['ktMid', 'ktYard'],
  // â”€â”€ East monastery (Am Cá»•) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['rearTO', 'toGate'], ['toGate', 'toIn'], ['toIn', 'toYard'], ['toYard', 'toE'], ['toE', 'amCoE1'],
  ['amCoE1', 'amCoE2'], ['amCoE2', 'amCoDoor'], ['amCoE2', 'amCoEast'],
  // â”€â”€ Quan Ã‚m / Pháº­t TÃ¢y / Äiá»‡n Máº«u â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['quanYard', 'quanE'], ['quanE', 'quanSE'], ['quanSE', 'pathE2'],
  ['quanYard', 'dienMau'], ['dienMau', 'dienMauW'], ['dienMauW', 'quanSE'], ['bodhiTree', 'dienMau'],
  ['buddhaYard', 'pathW2'], ['buddhaYard', 'restArea'],
  // â”€â”€ Rest garden + south lanes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['restArea', 'restEast'], ['restEast', 'restSE'], ['restSE', 'laneSW2'],
  ['laneSW2', 'laneSW1'], ['laneSW1', 'gate'],
  // â”€â”€ Äá»n TrÃ¬nh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['gate', 'denTrinh'], ['denTrinh', 'denN'], ['denN', 'denE'], ['denE', 'denE2'],
  ['denE2', 'laneSE1'], ['laneSE1', 'gate'],
  // â”€â”€ Báº£o ThÃ¡p (circled, never crossed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['baoThap', 'baoE'], ['baoE', 'zenIn'], ['baoThap', 'baoW'], ['baoW', 'thienDuong'],
  ['baoW', 'drumTowerW'],
  // â”€â”€ Zen garden â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['zenIn', 'zenGarden'], ['zenGarden', 'thienDuong'], ['zenIn', 'zenW'], ['zenW', 'zenE2'],
  ['zenE2', 'zenE1'], ['zenE1', 'hallFront'],
  // â”€â”€ PhÃ²ng Ghi CÃ´ng Äá»©c â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['phongCDDoor', 'phongCDLane'], ['phongCDLane', 'phongCDSouth'], ['phongCDSouth', 'denE2'],
  // â”€â”€ VÆ°á»n TÃ¢y â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['gate', 'gateW'], ['gateW', 'vuonCayE'], ['vuonCayE', 'vuonCay'],
  ['vuonCay', 'vuonCayIn'], ['vuonCayIn', 'vuonCayE2'], ['vuonCayE2', 'vuonCayLane'],
  ['vuonCayNW', 'vuonCayN'], ['vuonCayN', 'vuonCayNE'], ['vuonCayNE', 'vuonCayE'],
  // â”€â”€ Market â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['gate', 'marketGate'], ['marketGate', 'marketW1'], ['marketGate', 'marketE1'],
  ['marketW1', 'marketW2'], ['marketE1', 'marketE2'],
  ['marketW2', 'marketS'], ['marketE2', 'marketS'],
  ['marketE1', 'marketR1'], ['marketR1', 'marketR2'], ['marketR2', 'marketR3'], ['marketR3', 'marketR4'], ['marketR4', 'marketR5'],
  ['marketR5', 'marketR6'], ['marketR6', 'marketR7'], ['marketR7', 'marketR8'], ['marketR8', 'marketR9'], ['marketR9', 'marketR10'],
  ['marketS', 'marketS1'], ['marketS1', 'marketS2'], ['marketS2', 'marketS3'], ['marketS3', 'marketS4'], ['marketS4', 'marketS5'],
  ['marketS5', 'marketS6'], ['marketS6', 'marketS7'], ['marketS7', 'marketS8'], ['marketS8', 'marketS9'], ['marketS9', 'marketS10'],
  // â”€â”€ WEST BRANCH: lotus lake, pavilion, farm, TÄƒng XÃ¡ + tá»‹nh tháº¥t â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Boardwalk spur: east end of the deck â†’ dry bank â†’ south of the pavilion â†’ inside.
  ['lotusBridgeE', 'lotusPavE'], ['lotusPavE', 'lotusPavS'], ['lotusPavS', 'lotusPavilion'],
  ['lotusBridgeE', 'lotusNE'], ['lotusNE', 'westRingN'],
  ['westRingN', 'rearW'],
  ['rearW', 'farmGate'], ['farmGate', 'farm'], // fence gate only, never over the farm fence
  ['rearW', 'tangxaMid'], ['tangxaMid', 'tangXaApproach'],
  ['tangXaApproach', 'tangXaJct'], ['tangXaJct', 'tangXaDoor'],
  ['tangXaApproach', 'westOuterM'], ['westOuterM', 'tinhThatJct'],
  ['tinhThatJct', 'tinhThat3'], ['tinhThat3', 'tinhThat2'], ['tinhThat2', 'tinhThat1'],
  // Northbound lane runs between the huts and Tang Xa before joining the rear loop.
  ['tangxaMid', 'westOuterN'], ['westOuterM', 'westOuterN'], ['tinhThatJct', 'westOuterS'],
  ['westOuterS', 'westRearGate'],
  // â”€â”€ EAST BRANCH: river crossings, rá»«ng trÃºc, Äiá»‡n DÆ°á»£c SÆ°, vÆ°á»n hoa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['riverBankW', 'riverBridgeS'], ['riverBridgeS', 'riverBankE'], // river bridge at z = 2
  // East gate line runs along the cross path at z = 2 (bambooS2), below the culm field,
  // instead of cutting diagonally through the dense bamboo at (83â€¦85, âˆ’1).
  ['riverBankE', 'bamboo'], ['riverBankE', 'bambooS2'], ['bambooS2', 'sideGateE'],
  ['riverBankE', 'riverPathN'], ['duocSuDoor', 'duocSu'],
  ['bamboo', 'bambooN'], ['bamboo', 'bambooS2'], ['bambooS2', 'bambooS'], ['bambooS', 'flowerHill'],
  ['bambooN', 'riverPathN'], ['riverPathN', 'riverNorthE'],
  ['riverBridgeN', 'riverNorthW'], ['riverBridgeN', 'riverNorthE'], // river bridge at z = âˆ’38
  ['riverNorthE', 'duocSuDoor'],
  // â”€â”€ NORTH BRANCH: bypass z = âˆ’82, Ngá»c stairs, cave, cemetery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ['westRearGate', 'bypassW'], ['bypassW', 'caveBypass'],
  ['caveBypass', 'ngocApproach'], ['ngocApproach', 'pineBypass'], ['pineBypass', 'bypassE'],
  ['ngocApproach', 'ngocBase'],
  ['bypassE', 'cemeteryGate'], ['cemeteryGate', 'eastRearGate'], ['eastRearGate', 'rearE'],
  ['ngocBase', 'ngocMid'], ['ngocMid', 'ngocTop'], // 299 steps in 3 flights + 2 landings
  ['ngocTop', 'ngocCourt'],
  ['cemeteryGate', 'cemetery'],
  ['caveBypass', 'caveEntry'], ['caveEntry', 'caveMid'], ['caveMid', 'caveElbow'],
  ['caveElbow', 'cavePath'], ['cavePath', 'cave'],
  ['caveElbow', 'pineRestW'],
  ['pineBypass', 'pineEntry'], ['pineEntry', 'pinePath'], ['pinePath', 'pineRestE'],
]

const NODE_BY_ID = new Map<string, RoadNode>(ROAD_NODES.map((n) => [n.id, n]))

// Index adjacency for the shared Dijkstra (Fable #56). Node ids in ROAD_NODES order.
const IDX = new Map<string, number>(ROAD_NODES.map((n, i) => [n.id, i]))
const ADJ_IDX: DijkstraEdge[][] = ROAD_NODES.map(() => [])
for (const [a, b] of ROAD_EDGES) {
  const ia = IDX.get(a)
  const ib = IDX.get(b)
  if (ia === undefined || ib === undefined) continue
  const w = Math.hypot(ROAD_NODES[ia].x - ROAD_NODES[ib].x, ROAD_NODES[ia].z - ROAD_NODES[ib].z)
  ADJ_IDX[ia].push({ to: ib, w })
  ADJ_IDX[ib].push({ to: ia, w })
}

/** Dijkstra over the edge list; node ids from -> to inclusive, [] if unreachable/unknown.
 *  Uses the shared Dijkstra (shared/dijkstra.ts) with the roads tie-break (smaller id wins). */
export function roadPath(fromId: string, toId: string): string[] {
  const from = IDX.get(fromId)
  const to = IDX.get(toId)
  if (from === undefined || to === undefined) return []
  if (from === to) return [fromId]
  const ids = ROAD_NODES.map((n) => n.id)
  const { prev } = dijkstra(ADJ_IDX, from, to, (a, b) => ids[a] < ids[b])
  return reconstructPath(prev, from, to).map((i) => ids[i])
}

/** Waypoints of roadPath: excludes the start node, includes the destination. */
export function roadRoute(fromId: string, toId: string): Pt[] {
  return roadPath(fromId, toId)
    .slice(1)
    .map((id) => {
      const n = NODE_BY_ID.get(id)!
      return { x: n.x, z: n.z }
    })
}

/** Id of the node closest to p (first in ROAD_NODES order on ties). */
export function nearestNode(p: Pt): string {
  let bestId = ROAD_NODES[0].id
  let bestD = Infinity
  for (const n of ROAD_NODES) {
    const d = (n.x - p.x) * (n.x - p.x) + (n.z - p.z) * (n.z - p.z)
    if (d < bestD) {
      bestD = d
      bestId = n.id
    }
  }
  return bestId
}

/** Waypoints from an arbitrary point to node toId; never empty for a known toId. */
export function routeFrom(from: Pt, toId: string): Pt[] {
  const dest = NODE_BY_ID.get(toId)
  if (!dest) return []
  const startId = nearestNode(from)
  const start = NODE_BY_ID.get(startId)!
  const near = Math.hypot(start.x - from.x, start.z - from.z) <= 0.5
  const route = roadRoute(startId, toId)
  if (near) {
    return route.length ? route : [{ x: dest.x, z: dest.z }]
  }
  // Away from every node: walk to the nearest node first, then follow the road.
  const out: Pt[] = [{ x: start.x, z: start.z }, ...route]
  return out.length ? out : [{ x: dest.x, z: dest.z }]
}
