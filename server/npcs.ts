import { BELL, BRIDGE, BUDDHA_YARD, DEN_TRINH, PLAZA, QUAN, ZEN, clampToCompound, inLake } from '../src/layout.js';
import type { Anim, Outfit, PlayerState } from '../shared/types.js';

type Behavior = 'wander' | 'sweepPlaza' | 'sweepBridge' | 'bell';
type Phase = 'idle' | 'walk' | 'act';
type Pt = { x: number; z: number };

export interface NpcDef {
  id: string; name: string; outfit: Outfit; color: string; scale: number; role: 'abbot' | 'novice'; behavior: Behavior;
}

export const NPC_DEFS: NpcDef[] = [
  { id: 'npc1', name: 'Sư Thầy', outfit: 'monk', color: '#d9a62b', scale: 1.15, role: 'abbot', behavior: 'wander' },
  { id: 'npc2', name: 'Tiểu Quét Lá', outfit: 'monk', color: '#8a5a2b', scale: 0.9, role: 'novice', behavior: 'sweepPlaza' },
  { id: 'npc3', name: 'Tiểu Quét Lá', outfit: 'monk', color: '#8c8c90', scale: 0.9, role: 'novice', behavior: 'sweepBridge' },
  { id: 'npc4', name: 'Tiểu Đánh Chuông', outfit: 'monk', color: '#8a5a2b', scale: 0.9, role: 'novice', behavior: 'bell' },
];

/*
 * blocked() trong layout.ts là mặt nạ "không đặt cây cối" (đúng ở mọi điểm neo), không phải vật cản,
 * còn collider chỉ có ở client. Vì vậy sư thầy đi theo các "nan hoa" từ sân chùa tới từng điểm neo;
 * mỗi nan hoa đã được kiểm tra không cắt hồ, tháp, cột hay tường. Điểm neo bị collider chiếm
 * (sân tượng Phật r=4, Đền Trình) được dời ra sát mép để không đứng trong vật cản.
 */
const HUB: Pt = { x: PLAZA.x, z: PLAZA.z };
const SPOKES: { name: string; to: Pt; via: Pt[] }[] = [
  { name: 'plaza', to: HUB, via: [] },
  { name: 'bell', to: { x: BELL.x, z: BELL.z }, via: [{ x: -6, z: 6 }] },
  { name: 'quan', to: { x: QUAN.x, z: QUAN.z + 5.5 }, via: [] },
  { name: 'buddha', to: { x: BUDDHA_YARD.x + 5.4, z: BUDDHA_YARD.z }, via: [] },
  { name: 'denTrinh', to: { x: DEN_TRINH.x - 1, z: DEN_TRINH.z }, via: [{ x: 1, z: 32 }] },
  { name: 'zen', to: { x: ZEN.x, z: ZEN.z }, via: [{ x: -19, z: -9 }, { x: -22, z: -10 }, { x: -23, z: -11 }, { x: -28, z: -16 }] },
  { name: 'hall', to: { x: 0, z: -20 }, via: [{ x: 3, z: -17 }] },
];
const PLAZA_LAMPS: Pt[] = [{ x: -4, z: 12 }, { x: 4, z: 12 }, { x: -4, z: 5 }, { x: 4, z: 5 }];
const SOUTH_END = { x: BRIDGE.x, z: BRIDGE.z0 - 1.2 }, NORTH_END = { x: BRIDGE.x, z: BRIDGE.z1 + 1.2 };

const R = (a: number, b: number) => a + Math.random() * (b - a);
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.z - b.z);

interface Npc {
  def: NpcDef; state: PlayerState; phase: Phase; until: number; speed: number;
  route: Pt[]; spoke: number; side: number; nextRing: number;
}
export interface NpcRoom { npcs: Npc[]; lastTick: number; sleeping: boolean }

export function createNpcRoom(now = Date.now()): NpcRoom {
  const npcs = NPC_DEFS.map((def, i): Npc => {
    const start: Pt = def.behavior === 'wander' ? HUB : def.behavior === 'bell' ? SPOKES[1].to
      : def.behavior === 'sweepBridge' ? { x: SOUTH_END.x - 1.5, z: SOUTH_END.z } : { x: PLAZA.x + 3, z: PLAZA.z - 2 };
    return {
      def, phase: 'idle', until: now + R(1000, 3000) + i * 700, speed: 1.2, route: [], spoke: 0, side: 0, nextRing: now + 8000,
      state: { id: def.id, name: def.name, outfit: def.outfit, color: def.color, accessory: null, x: start.x, z: start.z, ry: Math.PI, anim: 'idle', merit: 0, npc: true, role: def.role },
    };
  });
  return { npcs, lastTick: now, sleeping: false };
}

/** Vị trí hợp lệ: ngoài hồ, trong tường, không dính cột đèn ở sân chùa. */
function walkable(p: Pt): boolean {
  if (inLake(p.x, p.z)) return false;
  const q = { x: p.x, z: p.z };
  clampToCompound(q);
  return q.x === p.x && q.z === p.z && PLAZA_LAMPS.every((l) => dist(l, p) > 1.1);
}

function spokeOf(p: Pt): number {
  let best = 0, bd = Infinity;
  SPOKES.forEach((s, i) => { const d = dist(s.to, p); if (d < bd) { bd = d; best = i; } });
  return best;
}

function routeAnchor(from: Pt, fromSpoke: number, toSpoke: number): Pt[] {
  const out: Pt[] = [];
  const a = SPOKES[fromSpoke];
  for (let i = a.via.length - 1; i >= 0; i--) out.push(a.via[i]);
  if (fromSpoke !== 0) out.push(HUB);
  const b = SPOKES[toSpoke];
  if (toSpoke !== 0) { out.push(...b.via, b.to); } else out.push(HUB);
  return out.filter((p) => dist(p, from) > 0.2);
}

function pickDest(n: Npc): { to: Pt; route: Pt[] } | null {
  const cur = n.state;
  for (let tries = 0; tries < 12; tries++) {
    switch (n.def.behavior) {
      case 'wander': {
        const k = Math.floor(Math.random() * SPOKES.length);
        if (k === n.spoke || dist(SPOKES[k].to, cur) < 0.8) continue;
        const route = routeAnchor(cur, n.spoke, k);
        n.spoke = k;
        return { to: SPOKES[k].to, route };
      }
      case 'sweepPlaza': {
        const a = R(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 6;
        const p = { x: PLAZA.x + Math.cos(a) * r, z: PLAZA.z + Math.sin(a) * r };
        if (dist(p, cur) < 0.8 || !walkable(p)) continue;
        return { to: p, route: [p] };
      }
      case 'sweepBridge': {
        n.side ^= 1;
        const e = n.side ? NORTH_END : SOUTH_END;
        const p = { x: e.x + R(-2.6, 2.6), z: e.z + R(-0.8, 0.8) };
        if (dist(p, cur) < 0.8 || !walkable(p)) continue;
        const wasNorth = cur.z > BRIDGE.z1;
        const wasSouth = cur.z < BRIDGE.z0;
        const route: Pt[] = [];
        if (wasSouth && n.side) route.push({ x: BRIDGE.x, z: BRIDGE.z0 - 0.4 }, { x: BRIDGE.x, z: BRIDGE.z1 + 0.4 });
        if (wasNorth && !n.side) route.push({ x: BRIDGE.x, z: BRIDGE.z1 + 0.4 }, { x: BRIDGE.x, z: BRIDGE.z0 - 0.4 });
        route.push(p);
        return { to: p, route };
      }
      default: return null;
    }
  }
  return null;
}

function startWalk(n: Npc, route: Pt[], speed: number) {
  n.route = route; n.speed = speed; n.phase = 'walk'; n.state.anim = 'walk';
}

function arrive(n: Npc, now: number) {
  const s = n.state;
  if (n.def.behavior === 'wander') { n.phase = 'act'; s.anim = Math.random() < 0.5 ? 'chant' : 'bow'; n.until = now + (s.anim === 'bow' ? 3000 : 2500); return; }
  if (n.def.behavior === 'bell') { n.phase = 'idle'; s.anim = 'idle'; n.until = now + 1000; return; }
  n.phase = 'act'; s.anim = 'sweep'; n.until = now + R(6000, 12000);
}

function decide(n: Npc, now: number) {
  const s = n.state;
  if (n.def.behavior === 'bell') {
    if (n.phase === 'act') { n.phase = 'idle'; s.anim = 'idle'; n.until = now + 500; }
    else if (now >= n.nextRing) { n.phase = 'act'; s.anim = 'ring'; n.until = now + 2500; n.nextRing = now + 45000; }
    else n.until = n.nextRing;
    return;
  }
  const slow = n.def.behavior !== 'wander';
  if (n.phase === 'act' && !slow) { n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(3000, 8000); return; }
  const d = pickDest(n);
  if (!d) { n.phase = 'idle'; s.anim = 'idle'; n.until = now + 2000; return; }
  startWalk(n, d.route, slow ? 0.6 : 1.2);
}

function step(n: Npc, dt: number, now: number) {
  const s = n.state, to = n.route[0];
  if (!to) { arrive(n, now); return; }
  const d = dist(s, to);
  if (d < 0.12) { n.route.shift(); if (!n.route.length) arrive(n, now); return; }
  const k = Math.min(1, (n.speed * dt) / d);
  const q = { x: s.x + (to.x - s.x) * k, z: s.z + (to.z - s.z) * k };
  const onDeck = Math.abs(q.x - BRIDGE.x) <= BRIDGE.hw && q.z >= BRIDGE.z0 && q.z <= BRIDGE.z1;
  const before = { x: q.x, z: q.z };
  clampToCompound(q);
  if ((inLake(q.x, q.z) && !onDeck) || q.x !== before.x || q.z !== before.z) {
    n.route = []; n.phase = 'idle'; s.anim = 'idle'; n.until = now + 1500; return;
  }
  s.ry = Math.atan2(to.x - s.x, to.z - s.z);
  s.x = q.x; s.z = q.z;
}

export function tickNpcs(room: NpcRoom, now = Date.now()): PlayerState[] {
  if (room.sleeping) return room.npcs.map((n) => n.state);
  const dt = Math.min(0.5, (now - room.lastTick) / 1000);
  room.lastTick = now;
  for (const n of room.npcs) {
    if (n.phase === 'walk') step(n, dt, now);
    else if (now >= n.until) decide(n, now);
  }
  return room.npcs.map((n) => n.state);
}

/** Phòng vừa có người quay lại sau lúc trống: bỏ thời gian dồn để NPC tiếp tục từ trạng thái đã đóng băng. */
export function resumeNpcs(room: NpcRoom, now = Date.now()) {
  if (!room.sleeping) return;
  room.sleeping = false;
  const gap = now - room.lastTick;
  room.lastTick = now;
  for (const n of room.npcs) { n.until += gap; n.nextRing += gap; }
}
