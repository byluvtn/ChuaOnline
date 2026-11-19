import type { Server, Socket } from 'socket.io';
import {
  BELL_RITUAL_REWARD, BODHI_GROVE, BODHI_REACH, BODHI_SLOTS, BODHI_STAGE_NAMES, BODHI_WATER_REWARD, BOND_CHAPTER_POINTS, BOND_GIFT_ITEMS, BOND_GIFT_POINTS,
  BOND_GIFTS_PER_DAY, BOND_REACH, BOND_TALK_POINTS, GROUP_MIN_PLAYERS, GROUP_NEED_SEC, GROUP_REWARD, RETREAT_THEMES, bodhiSlotPos, groupWindowAt, nextGroupStart,
  type BodhiAck, type BodhiFeed, type BodhiTree, type BondAck, type BondState, type FestivalStateMsg, type GroupState, type JournalAck, type RetreatAck,
} from '../shared/rituals.js';
import { BOND_BY_ID } from '../shared/bonds.js';
import { activeFestival, festivalKeyNow } from '../shared/seasons.js';
import { ITEM_BY_ID } from '../shared/game.js';
import { dayKeyICT } from '../shared/time.js';
import type { PlayerState } from '../shared/types.js';
import * as db from './db.js';
import * as rdb from './db-rituals.js';
import { activeBell } from './npcs.js';

interface Rt {
  bellKey?: string;
  groupKey?: string;
  groupSec: number;
  groupDone: boolean;
  visitDay?: string;
  festivalDay?: string;
  lastTick?: number;
  groupRoom?: string;
}
export interface RtSession { pid: number; state: PlayerState; room: string; socket: Socket; rt?: Rt; haloLevel?: 0 | 1 | 2; haloDay?: string }

export interface RitualEnv {
  io: Server;
  sessions: Map<string, RtSession>;
  afterReward(s: RtSession, merit: number, coins: number, before: number): Promise<void>;
  syncProfile(s: RtSession): Promise<void>;
  pushSys(room: string, text: string): void;
  npcPos(s: RtSession, npcId: string): { x: number; z: number } | undefined;
  groupHalo(s: RtSession): Promise<void>;
  badges(s: RtSession): Promise<void>;
}

const rt = (s: RtSession): Rt => (s.rt ??= { groupSec: 0, groupDone: false });
const TICK_MS = 5000;

export function festivalState(claimed: boolean): FestivalStateMsg {
  const f = activeFestival();
  const key = festivalKeyNow();
  return f && key
    ? { key, name: f.name, desc: f.desc, gift: f.gift, claimed }
    : { key: null, name: '', desc: '', gift: null, claimed: false };
}

async function sendFestival(s: RtSession): Promise<void> {
  const key = festivalKeyNow();
  const claimed = key ? await rdb.hasClaimed(s.pid, 'fest', key) : false;
  s.socket.emit('festival', festivalState(claimed));
}

function groupStateFor(env: RitualEnv, s: RtSession, now = new Date()): GroupState {
  const w = groupWindowAt(now);
  const next = nextGroupStart(now);
  const sitters = [...env.sessions.values()].filter((x) => x.room === s.room && x.state.anim === 'sit').map((x) => x.state.id);
  const r = rt(s);
  return {
    active: !!w, label: w?.label ?? '', endsAt: w?.endsAt ?? 0, sitting: sitters.length,
    auraIds: w && sitters.length >= GROUP_MIN_PLAYERS ? sitters : [],
    nextLabel: next.label, nextAt: next.at, need: GROUP_NEED_SEC,
    mySec: w && r.groupKey === w.key ? Math.floor(r.groupSec) : 0, claimed: !!w && r.groupKey === w.key && r.groupDone,
  };
}

export async function ritualOnJoin(env: RitualEnv, s: RtSession): Promise<void> {
  const day = dayKeyICT();
  await rdb.markVisit(s.pid, day);
  rt(s).visitDay = day;
  await sendFestival(s);
  rt(s).festivalDay = day;
  s.socket.emit('group:state', groupStateFor(env, s));
  s.socket.emit('bodhi:trees', { me: s.pid, trees: await rdb.bodhiList() } satisfies BodhiFeed);
}

async function announceBodhi(env: RitualEnv, trees?: BodhiTree[]): Promise<void> {
  const list = trees ?? await rdb.bodhiList();
  for (const s of env.sessions.values()) s.socket.emit('bodhi:trees', { me: s.pid, trees: list } satisfies BodhiFeed);
}

let loopsStarted = false;
export function startRitualLoops(env: RitualEnv): void {
  if (loopsStarted) return;
  loopsStarted = true;
  const tick = createRitualTick(env);
  let running = false;
  setInterval(async () => {
    if (running || !env.sessions.size || !db.dbBackgroundAllowed()) return;
    running = true;
    try { await tick(); db.dbBackgroundResult(); }
    catch (e) { db.dbBackgroundResult(e); console.warn('[ritual]', (e as Error).message); }
    finally { running = false; }
  }, TICK_MS);
}

export function createRitualTick(env: RitualEnv) {
  let sweptDay = '';
  return async (nowMs = Date.now()) => {
      const now = new Date(nowMs);
      const today = dayKeyICT(now);
      if (sweptDay !== today) { await rdb.bodhiSweepStale(); await announceBodhi(env); sweptDay = today; }
      const bell = activeBell(nowMs);
      const win = groupWindowAt(now);
      const sittingByRoom = new Map<string, number>();
      for (const s of env.sessions.values()) if (s.state.anim === 'sit') sittingByRoom.set(s.room, (sittingByRoom.get(s.room) ?? 0) + 1);
      for (const s of [...env.sessions.values()]) {
        const r = rt(s);
        if (r.visitDay !== today) { await rdb.markVisit(s.pid, today); r.visitDay = today; }
        if (r.festivalDay !== today) { await sendFestival(s); r.festivalDay = today; }
        if (bell && r.bellKey !== bell.key) {
          const before = await rdb.claimReward(s.pid, 'bell', bell.key, BELL_RITUAL_REWARD);
          r.bellKey = bell.key;
          if (before !== null) {
            s.socket.emit('bell:ritual', { merit: BELL_RITUAL_REWARD.merit, coins: BELL_RITUAL_REWARD.coins });
            await syncReward(env, s, BELL_RITUAL_REWARD, before);
          }
        }
        const dt = r.lastTick ? Math.max(0, Math.min(10, (nowMs - r.lastTick) / 1000)) : 0;
        r.lastTick = nowMs;
        if (win) {
          if (r.groupKey !== win.key) { r.groupDone = await rdb.hasClaimed(s.pid, 'group', win.key); r.groupKey = win.key; r.groupSec = 0; r.groupRoom = undefined; }
          const room = s.state.anim === 'sit' && (sittingByRoom.get(s.room) ?? 0) >= GROUP_MIN_PLAYERS ? s.room : undefined;
          if (room && r.groupRoom === room) r.groupSec += dt;
          r.groupRoom = room;
          if (!r.groupDone && r.groupSec >= GROUP_NEED_SEC && room) {
            const before = await rdb.claimReward(s.pid, 'group', win.key, GROUP_REWARD);
            r.groupDone = true;
            if (before !== null) {
              s.socket.emit('group:done', { merit: GROUP_REWARD.merit, coins: GROUP_REWARD.coins, label: win.label });
              await syncReward(env, s, GROUP_REWARD, before);
              await env.groupHalo(s);
            }
          }
        } else if (r.groupKey) { r.groupKey = undefined; r.groupRoom = undefined; r.groupSec = 0; r.groupDone = false; }
        s.socket.emit('group:state', groupStateFor(env, s, now));
      }
  };
}

async function syncReward(env: RitualEnv, s: RtSession, reward: { merit: number; coins: number }, before: number) {
  try { await env.afterReward(s, reward.merit, reward.coins, before); }
  catch (e) { console.warn('[ritual] reward follow-up:', e); }
}

type Ack<T> = (r: T) => void;

export function bindRitualSocket(env: RitualEnv, socket: Socket, me: () => RtSession | undefined): void {
  const need = <T extends { ok: boolean; error?: string }>(cb: Ack<T> | undefined): [RtSession | null, (r: T) => void] => {
    const reply = (r: T) => { if (typeof cb === 'function') cb(r); };
    const s = me();
    if (!s) { reply({ ok: false, error: 'Chưa vào chùa' } as T); return [null, reply]; }
    return [s, reply];
  };

  // ---- lễ hội âm lịch ----
  socket.on('festival:get', async (cb?: Ack<FestivalStateMsg>) => {
    const s = me();
    const key = festivalKeyNow();
    const claimed = s && key ? await rdb.hasClaimed(s.pid, 'fest', key) : false;
    if (typeof cb === 'function') cb(festivalState(claimed));
  });
  socket.on('festival:claim', async (cb?: Ack<{ ok: boolean; error?: string; merit?: number; coins?: number }>) => {
    const [s, reply] = need(cb);
    if (!s) return;
    const f = activeFestival();
    const key = festivalKeyNow();
    if (!f || !key) return reply({ ok: false, error: 'Hôm nay chưa có lễ hội' });
    const before = await rdb.claimReward(s.pid, 'fest', key, f.gift);
    if (before === null) return reply({ ok: false, error: 'Bạn đã nhận quà lễ hội này rồi' });
    await syncReward(env, s, f.gift, before);
    reply({ ok: true, merit: f.gift.merit, coins: f.gift.coins });
    await sendFestival(s);
  });

  // ---- khóa thiền nhóm ----
  socket.on('group:get', (cb?: Ack<GroupState>) => {
    const s = me();
    if (s && typeof cb === 'function') cb(groupStateFor(env, s));
  });

  // ---- nhật ký tu tập ----
  socket.on('journal:get', async (cb?: Ack<JournalAck>) => {
    const [s, reply] = need(cb);
    if (!s) return;
    reply({ ok: true, state: await rdb.journalState(s.pid) });
  });

  // ---- cây bồ đề ----
  socket.on('bodhi:list', async (cb?: Ack<BodhiAck>) => {
    if (typeof cb === 'function') cb({ ok: true, trees: await rdb.bodhiList(), me: me()?.pid });
  });
  socket.on('bodhi:plant', async (cb?: Ack<BodhiAck>) => {
    const [s, reply] = need(cb);
    if (!s) return;
    if (Math.hypot(s.state.x - BODHI_GROVE.x, s.state.z - BODHI_GROVE.z) > BODHI_REACH) return reply({ ok: false, error: 'Hãy tới vườn bồ đề để trồng cây' });
    const r = await rdb.bodhiPlant(s.pid);
    if (!r.ok) return reply({ ok: false, error: r.error });
    env.pushSys(s.room, `🌱 Phật tử ${s.state.name} vừa gieo một cây bồ đề trong vườn bồ đề.`);
    const trees = await rdb.bodhiList();
    reply({ ok: true, trees });
    await announceBodhi(env, trees);
  });
  socket.on('bodhi:water', async (cb?: Ack<BodhiAck>) => {
    const [s, reply] = need(cb);
    if (!s) return;
    const mine = (await rdb.bodhiList()).find((t) => t.pid === s.pid);
    if (!mine) return reply({ ok: false, error: 'Bạn chưa có cây bồ đề' });
    const p = bodhiSlotPos(mine.slot);
    if (Math.hypot(s.state.x - p.x, s.state.z - p.z) > 8) return reply({ ok: false, error: 'Hãy đứng gần cây bồ đề của bạn để tưới' });
    const before = await rdb.bodhiWater(s.pid);
    if (before === null) return reply({ ok: false, error: 'Hôm nay bạn đã tưới rồi, mai quay lại nhé' });
    await syncReward(env, s, BODHI_WATER_REWARD, before);
    const trees = await rdb.bodhiList();
    const after = trees.find((t) => t.pid === s.pid);
    if (after && after.stage > mine.stage) env.pushSys(s.room, `🌳 Cây bồ đề của ${s.state.name} đã lớn thành ${BODHI_STAGE_NAMES[after.stage]}!`);
    reply({ ok: true, merit: BODHI_WATER_REWARD.merit, trees });
    await announceBodhi(env, trees);
  });

  // ---- NPC thân thiết ----
  const bondList = async (pid: number): Promise<BondState[]> => {
    const today = dayKeyICT();
    const rows = new Map((await rdb.bondRows(pid)).map((r) => [r.npc_id, r]));
    return Object.keys(BOND_BY_ID).map((npc) => {
      const r = rows.get(npc);
      return {
        npc, points: r?.points ?? 0, done: r?.done ?? 0,
        talkedToday: r?.talk_day === today, giftsToday: r && r.gift_day === today ? r.gifts_today : 0,
      };
    });
  };
  const bondNear = (s: RtSession, npc: string): string | null => {
    if (!Object.hasOwn(BOND_BY_ID, npc)) return 'NPC này chưa có truyện riêng';
    const pos = env.npcPos(s, npc);
    if (!pos || Math.hypot(s.state.x - pos.x, s.state.z - pos.z) > BOND_REACH) return 'Bạn đứng quá xa người này';
    return null;
  };
  socket.on('bond:list', async (cb?: Ack<BondAck>) => {
    const [s, reply] = need(cb);
    if (!s) return;
    reply({ ok: true, bonds: await bondList(s.pid) });
  });
  socket.on('bond:talk', async (npc: unknown, cb?: Ack<BondAck>) => {
    const [s, reply] = need(cb);
    if (!s) return;
    const id = String(npc);
    const bad = bondNear(s, id);
    if (bad) return reply({ ok: false, error: bad });
    if (!(await rdb.bondTalk(s.pid, id, BOND_TALK_POINTS))) return reply({ ok: false, error: 'Hôm nay bạn đã tâm sự với người này rồi' });
    reply({ ok: true, msg: `Thân thiết +${BOND_TALK_POINTS}`, bonds: await bondList(s.pid) });
  });
  socket.on('bond:gift', async (npc: unknown, item: unknown, cb?: Ack<BondAck>) => {
    const [s, reply] = need(cb);
    if (!s) return;
    const id = String(npc), it = String(item);
    const bad = bondNear(s, id);
    if (bad) return reply({ ok: false, error: bad });
    if (!BOND_GIFT_ITEMS.includes(it)) return reply({ ok: false, error: 'Người này không nhận món này làm quà' });
    if ((await db.itemQty(s.pid, it)) < 1) return reply({ ok: false, error: 'Bạn không có món này trong túi' });
    if (!(await rdb.bondGift(s.pid, id, it, BOND_GIFT_POINTS, BOND_GIFTS_PER_DAY))) return reply({ ok: false, error: 'Bạn đã tặng đủ quà hôm nay hoặc món quà không còn trong túi' });
    await env.syncProfile(s);
    await env.badges(s);
    reply({ ok: true, msg: `Thân thiết +${BOND_GIFT_POINTS}`, bonds: await bondList(s.pid) });
  });
  socket.on('bond:chapter', async (npc: unknown, cb?: Ack<BondAck>) => {
    const [s, reply] = need(cb);
    if (!s) return;
    const id = String(npc);
    const bad = bondNear(s, id);
    if (bad) return reply({ ok: false, error: bad });
    const def = BOND_BY_ID[id];
    const st = (await bondList(s.pid)).find((b) => b.npc === id)!;
    const ch = def.chapters[st.done];
    if (!ch) return reply({ ok: false, error: 'Bạn đã nghe hết truyện của người này' });
    if (st.points < BOND_CHAPTER_POINTS[st.done]) return reply({ ok: false, error: `Cần ${BOND_CHAPTER_POINTS[st.done]} điểm thân thiết để nghe tiếp` });
    if ((await db.itemQty(s.pid, ch.ask.item)) < ch.ask.qty) return reply({ ok: false, error: `Cần ${ch.ask.qty} ${ITEM_BY_ID[ch.ask.item]?.name ?? ch.ask.item} trong túi` });
    const before = await rdb.bondFinishChapter(s.pid, id, st.done, ch);
    if (before === null) return reply({ ok: false, error: 'Chương đã hoàn thành hoặc vật phẩm không còn đủ' });
    await syncReward(env, s, ch.reward, before);
    await env.badges(s);
    reply({ ok: true, msg: `Hoàn thành chương "${ch.title}": +${ch.reward.merit} công đức, +${ch.reward.coins} xu${ch.reward.item ? ` và ${ITEM_BY_ID[ch.reward.item]?.name ?? ''}` : ''}`, bonds: await bondList(s.pid) });
  });

  // ---- tịnh thất riêng ----
  const ownedDecor = (inventory: Record<string, number>) => Object.keys(inventory).filter((id) => inventory[id] > 0 && ITEM_BY_ID[id]?.kind === 'decor');
  socket.on('retreat:get', async (target: unknown, cb?: Ack<RetreatAck>) => {
    const [s, reply] = need(cb);
    if (!s) return;
    const other = typeof target === 'number' && Number.isInteger(target) && target > 0 && target !== s.pid ? target : null;
    const pid = other ?? s.pid;
    const prof = await db.getProfile(pid);
    if (!prof) return reply({ ok: false, error: 'Không tìm thấy người chơi' });
    const room = await rdb.retreatGet(pid);
    reply({ ok: true, ownerName: prof.name, state: { placed: room.placed, theme: room.theme, owned: other ? [] : ownedDecor(prof.inventory) } });
  });
  socket.on('retreat:save', async (payload: unknown, cb?: Ack<RetreatAck>) => {
    const [s, reply] = need(cb);
    if (!s) return;
    const p = (payload ?? {}) as { theme?: unknown; placed?: unknown };
    const theme = Number(p.theme);
    if (!Number.isInteger(theme) || theme < 0 || theme >= RETREAT_THEMES.length) return reply({ ok: false, error: 'Màu tường không hợp lệ' });
    const list = Array.isArray(p.placed) ? p.placed.map(String) : [];
    const owned = new Set(ownedDecor((await db.getProfile(s.pid))?.inventory ?? {}));
    const placed = [...new Set(list)].filter((id) => owned.has(id)).slice(0, 12);
    await rdb.retreatSave(s.pid, theme, placed);
    reply({ ok: true, state: { placed, theme, owned: [...owned] }, ownerName: s.state.name });
  });
}

export const RITUAL_SLOT_COUNT = BODHI_SLOTS;
