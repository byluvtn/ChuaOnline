// Usage: npx tsx tools/npc-day-audit.ts <existing output directory> [source root] [seed]
import assert from 'node:assert/strict';
import { createWriteStream, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { once } from 'node:events';
import { createServer } from 'vite';
import type { createNpcRoom as CreateRoom } from '../server/npcs';
import type { Collider } from '../shared/pathfind';
import type { Pt } from '../shared/roads';

const [outDir, sourceRoot = '.', seedArg = '78293'] = process.argv.slice(2);
assert(outDir, 'Pass an existing output directory outside the repo');
const seed = Number(seedArg);
assert(Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff, 'Expected a uint32 seed');
const source = (p: string) => pathToFileURL(resolve(sourceRoot, p)).href;
const MIN = 60_000, TICK = 100, DAY = 1440 * MIN, VN = 420 * MIN;
const base = Date.UTC(2026, 10, 19) - VN;
const fmt = (now: number) => new Date(now + VN).toISOString().slice(11, 23);
const rng = (initial: number) => () => {
  initial = (initial + 0x6d2b79f5) >>> 0;
  let t = Math.imul(initial ^ (initial >>> 15), initial | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const point = (p: Pt) => ({ x: +p.x.toFixed(4), z: +p.z.toFixed(4) });
const distance = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.z - b.z);
const seatKey = (s: Pt & { hall?: string }) => `${s.hall ?? 'bench'}:${s.x},${s.z}`;
type Npc = ReturnType<typeof CreateRoom>['npcs'][number];
type Counter = Record<string, number>;
const inc = (o: Counter, k: string, n = 1) => { o[k] = (o[k] ?? 0) + n; };
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
function fingerprint() {
  const walk = (dir: string): string[] => readdirSync(resolve(sourceRoot, dir), { withFileTypes: true })
    .flatMap(e => e.isDirectory() ? walk(`${dir}/${e.name}`) : /\.[cm]?[jt]sx?$/.test(e.name) ? [`${dir}/${e.name}`] : []);
  const files = ['package.json', ...['server', 'shared', 'src'].flatMap(walk)].sort();
  const sha256 = Object.fromEntries(files.map(file => [file, hash(readFileSync(resolve(sourceRoot, file)))]));
  return { sha256, aggregateSha256: hash(JSON.stringify(sha256)) };
}

async function main() {
  const startRevision = fingerprint();
  process.env.NPC_CLOCK_OFFSET_MIN = '0';
  const npcs: typeof import('../server/npcs') = await import(source('server/npcs.ts'));
  const layout: typeof import('../src/layout') = await import(source('src/layout.ts'));
  const campus: typeof import('../shared/campus') = await import(source('shared/campus.ts'));
  const types: typeof import('../shared/types') = await import(source('shared/types.ts'));
  const { GUEST_BEDS }: typeof import('../src/guest-beds') = await import(source('src/guest-beds.ts'));

  // Use the production world constructor with inert canvas drawing. No WebGL or asset fetches;
  // the returned array is the synchronous/procedural subset of client collision geometry.
  const gradient = { addColorStop() {} };
  const canvas = new Proxy({}, { get: (_obj, key) => key === 'measureText' ? () => ({ width: 0 })
    : String(key).startsWith('create') ? () => gradient : () => {} });
  const oldRandom = Math.random;
  const oldTimeout = globalThis.setTimeout;
  const oldFetch = globalThis.fetch;
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    createElement(tag: string) { assert.equal(tag, 'canvas'); return { getContext: () => canvas }; },
  } });
  globalThis.fetch = async () => new Response(null, { status: 404 });
  Math.random = rng(91823);
  let world: ReturnType<typeof import('../src/world')['createWorld']>;
  try {
    // Vite supplies import.meta.env and loads the world just as it does for the client.
    const vite = await createServer({ root: resolve(sourceRoot), configFile: false, appType: 'custom',
      server: { middlewareMode: true, watch: null, ws: false } });
    try {
      const { createWorld } = await vite.ssrLoadModule('/src/world.ts') as typeof import('../src/world');
      // Keep the model retry path without its seven-second wall-clock wait.
      globalThis.setTimeout = ((cb: () => void, ms?: number, ...args: unknown[]) =>
        oldTimeout(cb, ms === 2000 || ms === 5000 || ms === 20000 ? 0 : ms, ...args)) as typeof setTimeout;
      world = createWorld({ getPixelRatio: () => 1 } as Parameters<typeof createWorld>[0]);
      await new Promise<void>((done) => oldTimeout(done, 50));
    } finally { await vite.close(); }
  } finally {
    Math.random = oldRandom;
    globalThis.fetch = oldFetch;
    globalThis.setTimeout = oldTimeout;
    Reflect.deleteProperty(globalThis, 'document');
  }
  const colliders = world.colliders.map((c, i) => ({ ...c, i }));
  type AuditCollider = Collider & { i: number };
  type Hit = { kind: string; collider?: AuditCollider };
  assert(colliders.length > 0, 'No client colliders collected');
  writeFileSync(resolve(outDir, 'colliders.json'), JSON.stringify(colliders) + '\n');
  const cell = (x: number, z: number) => Math.floor(x / 4) * 10000 + Math.floor(z / 4);
  const grid = new Map<number, (Collider & { i: number })[]>();
  const PAD = 0.4; // src/main.ts collide(), not the larger client pathfinder clearance.
  const colliderDistance = (p: Pt, c: Collider) => {
    const dx = (c.x2 ?? c.x) - c.x, dz = (c.z2 ?? c.z) - c.z;
    const t = Math.max(0, Math.min(1, ((p.x - c.x) * dx + (p.z - c.z) * dz) / (dx * dx + dz * dz || 1)));
    return Math.hypot(p.x - c.x - t * dx, p.z - c.z - t * dz);
  };
  for (const c of colliders) {
    const r = c.r + PAD, x2 = c.x2 ?? c.x, z2 = c.z2 ?? c.z;
    for (let x = Math.floor((Math.min(c.x, x2) - r) / 4); x <= Math.floor((Math.max(c.x, x2) + r) / 4); x++)
      for (let z = Math.floor((Math.min(c.z, z2) - r) / 4); z <= Math.floor((Math.max(c.z, z2) + r) / 4); z++) {
        const k = cell(x * 4, z * 4);
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k)!.push(c);
      }
  }
  function collision(p: Pt) {
    let clearance: (Collider & { i: number }) | undefined;
    for (const c of grid.get(cell(p.x, p.z)) ?? []) {
      const d = colliderDistance(p, c);
      if (d < c.r) return { kind: 'collider-core', collider: c };
      if (d < c.r + PAD) clearance ??= c;
    }
    if (clearance) return { kind: 'collider-clearance', collider: clearance };
  }
  const bounds = (p: Pt) => !Number.isFinite(p.x) || !Number.isFinite(p.z) || Math.abs(p.x) > types.MAP_HALF
    || p.z < types.MAP_Z_MIN || p.z > types.MAP_Z_MAX;
  const water = (p: Pt) => layout.inLake(p.x, p.z) || campus.expansionWaterBlocked(p.x, p.z);
  function blocked(p: Pt): Hit | undefined {
    const q = { ...p };
    layout.clampToCompound(q);
    return bounds(p) ? { kind: 'bounds' } : water(p) ? { kind: 'water' }
      : q.x !== p.x || q.z !== p.z ? { kind: 'compound-clamp' } : collision(p);
  }
  function routeWitness(a: Pt, b: Pt) {
    const len = distance(a, b);
    if (!Number.isFinite(len)) return [{ kind: 'bounds', sample: point(b) }];
    const count = Math.max(1, Math.ceil(len / 0.25));
    const found = new Map<string, Hit & { sample: Pt }>();
    for (let i = 0; i <= count; i++) {
      const x = a.x + (b.x - a.x) * i / count, z = a.z + (b.z - a.z) * i / count;
      const hit = blocked({ x, z });
      if (hit) {
        const k = hit.collider ? `${hit.kind}:${hit.collider.i}` : hit.kind;
        if (!found.has(k)) found.set(k, { ...hit, sample: point({ x, z }), kind: hit.kind });
      }
    }
    return [...found.values()];
  }

  Math.random = rng(seed);
  const room = npcs.createNpcRoom(base);
  const roomNpcs = new Map(room.npcs.map(n => [n.def.id, n]));
  const chair = campus.phongCdWorld(0, -2.4);
  const benchSeats = npcs.CORRIDOR_BENCH_SEATS;
  // Match exact furniture geometry, not collider indices that can shift between revisions.
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
  type Furniture = { kind: string; target?: Pt; keys?: string[]; index?: number };
  const monkBeds = [-3, 3].map(x => ({ x: layout.TANG_XA.x + x, z: layout.TANG_XA.z - 1.55 }));
  const furniture = Object.fromEntries(colliders.flatMap<[number, Furniture]>(c => {
    if (c.x2 !== undefined || c.z2 !== undefined) return [];
    if (near(c.r, 0.3) && distance(c, chair) < 1e-6) return [[c.i, { kind: 'desk-chair', target: chair }]];
    const keys = near(c.r, 0.5) ? benchSeats.filter(b => near(b.x, c.x) && near(Math.abs(b.z - c.z), 0.4)).map(seatKey) : [];
    if (keys.length) return [[c.i, { kind: 'bench', keys }]];
    const guest = near(c.r, 0.45) && GUEST_BEDS.find(b => near(b.x, c.x) && [0, -0.7, 0.7].some(dz => near(b.z + dz, c.z)));
    if (guest) return [[c.i, { kind: 'guest-bed', index: guest.id, target: point(guest) }]];
    // Tăng Xá uses 2 m beds along X; reconstruct the three client circles from temple.ts.
    const index = monkBeds.findIndex(b => near(c.r, 0.45) && near(b.z, c.z) && [0, -0.7, 0.7].some(dx => near(c.x, b.x + dx)));
    if (index >= 0) return [[c.i, { kind: 'monk-bed', index, target: monkBeds[index] }]];
    return [];
  }));
  const log = createWriteStream(resolve(outDir, 'trace.ndjson'));
  const contactsLog = createWriteStream(resolve(outDir, 'contacts.ndjson'));
  const queue: string[] = [];
  const contactQueue: string[] = [];
  let now = base;
  function event(kind: string, n?: Npc, extra: object = {}) {
    const state = n && { id: n.def.id, ...point(n.state), y: n.state.y ?? null, mode: n.mode, stage: n.stage,
      anim: n.state.anim, phase: n.phase, tourIdx: n.tourIdx, tour: n.tourStops.map(s => s.kind),
      tourPhase: n.tourPhase, scriptStep: n.script?.i ?? null, gone: n.gone,
      seatClaims: [...room.seats].filter(([, id]) => id === n.def.id).map(([k]) => k),
      bedId: n.bedId, guestBedId: n.guestBedId, routeHead: n.route[0] && point(n.route[0]),
      routeGoal: n.route.length ? point(n.route.at(-1)!) : null };
    queue.push(JSON.stringify({ timeVN: fmt(now), elapsedMs: now - base, ...state, ...extra, kind }));
  }
  const stats = room.npcs.map(() => ({ ticks: {} as Counter, modes: {} as Counter, arrivals: {} as Counter,
    routeHits: {} as Counter, positionHits: {} as Counter, seatErrorTicks: 0, seatErrorMax: 0,
    departures: 0, returns: 0, overdueReturns: 0, closeReturns: 0,
    boundsTicks: 0, waterTicks: 0, routeAborts: 0, confirmedRouteAborts: 0, claimIssues: 0, postTicks: 0,
    offPostNormalTicks: 0, longestOffPostNormalMs: 0, scriptStarts: 0, scriptCompletes: 0, scriptResets: 0,
    longestStaticMs: 0, longestTravelStaticMs: 0, stuckEpisodes: 0, longestOverdueMs: 0,
    minX: Infinity, minZ: Infinity, maxX: -Infinity, maxZ: -Infinity }));
  const previous = room.npcs.map(n => ({
    x: n.state.x, z: n.state.z, anchor: point(n.state), stillFrom: base, travelFrom: base, offPostFrom: base,
    key: '', route: undefined as Pt[] | undefined, next: undefined as Pt | undefined, goal: undefined as Pt | undefined,
    phase: '', gone: n.gone, goneUntil: n.goneUntil, script: undefined as Npc['script'], scriptStep: 0,
    hit: '', lastPositionHit: undefined as ReturnType<typeof blocked>, claimIssue: '', stuck: false, overdue: false,
    contacts: [] as number[], contactKey: '', supportKey: '',
  }));
  const sessions: Record<string, { roster: string[]; ticks: Counter; first: Record<string, string> }> = {};
  const bells: Record<string, { ticks: number; first: string | null; last: string | null }> = {};
  const occupancy = { maxSeats: 0, maxBeds: 0, maxGuestBeds: 0, orphanTicks: 0, overlapTicks: 0 };
  let lastOverlap = '';
  let lastOrphans = '';
  const supportTol = 0.08;
  // Character poses own bed/seat lifts; this checks only the server override of the root.
  // The Bodhi bench is the explicit-Y exception in server/npcs.ts, backed by its client seat.
  const bodhi = { x: 35.5, z: 20, y: 0.619 };
  contactQueue.push(JSON.stringify({ kind: 'meta', version: 1, tickMs: TICK, ticks: DAY / TICK,
    seed, revision: startRevision.aggregateSha256, furniture, supportTol }));
  const tourValid = (n: Npc) => n.tourIdx >= 0 && (n.tourStops.length ? n.tourIdx < n.tourStops.length : n.tourIdx === 0);
  event('meta', undefined, { seed, sourceRoot: resolve(sourceRoot), tickMs: TICK, baseUtc: new Date(base).toISOString(),
    dayMinutes: DAY / MIN, online: 1, colliders: colliders.length, clearance: PAD, segmentSampleSpacing: 0.25 });
  for (now = base; now < base + DAY; now += TICK) {
    const present = npcs.tickNpcs(room, now, 1);
    const session = npcs.activeSession(now);
    const bell = npcs.activeBell(now);
    const attendance = session && (sessions[session.key] ??= { roster: [...room.chantRoster], ticks: {}, first: {} });
    const ring = bell && (bells[bell.key] ??= { ticks: 0, first: null, last: null });
    const departureEvents = new Set(room.left.splice(0));
    const returnEvents = new Set(room.joined.splice(0).map(s => s.id));
    for (const chat of room.outbox.splice(0)) event('chat', roomNpcs.get(chat.npcId), { text: chat.text });
    for (const fx of room.fx.splice(0)) event('fx', roomNpcs.get(fx.id), { fx });
    const actualClaims = new Map<string, string>(room.seats);
    room.beds.forEach((id, i) => { if (id) actualClaims.set(`bed:${i}`, id); });
    room.guestBeds.forEach((id, i) => { if (id) actualClaims.set(`guestBed:${i}`, id); });
    const expectedClaims = new Map<string, string[]>();
    occupancy.maxSeats = Math.max(occupancy.maxSeats, room.seats.size);
    occupancy.maxBeds = Math.max(occupancy.maxBeds, room.beds.filter(Boolean).length);
    occupancy.maxGuestBeds = Math.max(occupancy.maxGuestBeds, room.guestBeds.filter(Boolean).length);
    for (let i = 0; i < room.npcs.length; i++) {
      const n = room.npcs[i], p = previous[i], s = n.state, st = stats[i], id = n.def.id;
      const expected: string[] = [];
      if (n.chantSeat) expected.push(seatKey(n.chantSeat));
      if (n.benchSeat) expected.push(seatKey(n.benchSeat));
      if (n.bedId !== null) expected.push(`bed:${n.bedId}`);
      if (n.guestBedId !== null) expected.push(`guestBed:${n.guestBedId}`);
      for (let j = n.tourIdx; j < n.tourStops.length; j++) {
        const stop = n.tourStops[j];
        if (stop.seat) expected.push(seatKey(stop.seat));
      }
      for (const k of expected) {
        if (!expectedClaims.has(k)) expectedClaims.set(k, []);
        const owners = expectedClaims.get(k)!;
        if (owners.at(-1) !== id) owners.push(id);
      }
      const issues = expected.filter(k => actualClaims.get(k) !== id);
      if (n.gone && expected.length) issues.push('gone-with-claim');
      if (!tourValid(n)) issues.push('tour-index');
      const targetSeat = ['chanting', 'seatChant'].includes(n.mode) ? n.chantSeat : n.stage === 'stroll'
        ? n.tourStops[n.tourIdx]?.seat : n.mode === 'benchRest' || n.stage === 'benchRest' ? n.benchSeat : null;
      const seat = targetSeat ?? (id === 'npc6' && s.anim === 'sit' ? chair : null);
      const moved = p.gone || !p.key || s.x !== p.x || s.z !== p.z;
      if (!n.gone && moved) {
        // Positive encodes padding, negative encodes core. Offset IDs so collider zero is representable.
        p.contacts = [];
        for (const c of grid.get(cell(s.x, s.z)) ?? []) {
          const d = colliderDistance(s, c);
          if (d < c.r + PAD) p.contacts.push((c.i + 1) * (d < c.r ? -1 : 1));
        }
      }
      const bench = n.benchSeat && seatKey(n.benchSeat);
      const contactKey = !n.gone && p.contacts.length
        ? `${p.contacts.join(',')}|${n.phase}|${n.mode}|${n.stage}|${s.anim}|${bench}|${n.guestBedId}|${n.bedId}` : '';
      if (contactKey !== p.contactKey) {
        contactQueue.push(JSON.stringify(contactKey ? { kind: 'contacts', tick: (now - base) / TICK, timeVN: fmt(now), id,
          ...point(s), y: s.y ?? null, phase: n.phase, mode: n.mode, stage: n.stage, anim: s.anim, contacts: p.contacts,
          bench, bedId: n.bedId, guestBedId: n.guestBedId,
          routeHead: n.route[0] && point(n.route[0]), routeGoal: n.route.at(-1) && point(n.route.at(-1)!) }
          : { kind: 'contacts', tick: (now - base) / TICK, id, contacts: [] }));
        p.contactKey = contactKey;
      }
      const supportKey = n.gone ? 'gone' : s.y === undefined ? 'ground-default'
        : ['sit', 'bench'].includes(s.anim) && distance(s, bodhi) < 0.15 && Math.abs(s.y - bodhi.y) <= supportTol ? 'matched-seat'
        : Math.abs(s.y - world.groundY(s.x, s.z)) <= supportTol ? 'matched-floor' : 'explicit-y-anomaly';
      if (supportKey !== p.supportKey) {
        const floorY = n.gone ? null : world.groundY(s.x, s.z);
        contactQueue.push(JSON.stringify({ kind: 'support', tick: (now - base) / TICK, timeVN: fmt(now), id,
          support: supportKey, ...point(s), phase: n.phase, mode: n.mode, stage: n.stage, anim: s.anim,
          floorY, overrideY: s.y ?? null, deltaY: s.y !== undefined && floorY !== null ? s.y - floorY : null }));
        p.supportKey = supportKey;
      }
      if (seat) {
        const error = distance(s, seat);
        if (error > 0.001) { st.seatErrorTicks++; st.seatErrorMax = Math.max(st.seatErrorMax, error); }
        if (error > 0.45) issues.push('active-seat-position');
      }
      if ((n.mode === 'guestRest' || n.stage === 'guestRest') && n.guestBedId !== null
        && distance(s, GUEST_BEDS[n.guestBedId]) > 0.45) issues.push('guest-bed-position');
      const issueKey = issues.join('|');
      if (issueKey) {
        st.claimIssues++;
        if (issueKey !== p.claimIssue) event('claim-invariant', n, { issues, expected });
      }
      p.claimIssue = issueKey;
      if (p.gone !== n.gone) {
        if (n.gone) st.departures++; else st.returns++;
        const neighbors = n.gone ? [] : room.npcs.filter(other => other !== n && !other.gone && distance(s, other.state) < 1.2)
          .map(other => ({ id: other.def.id, distance: distance(s, other.state), at: point(other.state) }));
        if (neighbors.length) st.closeReturns++;
        event(n.gone ? 'departure' : 'return', n, { scheduledVN: fmt(n.gone ? n.goneUntil : p.goneUntil),
          lateMs: n.gone ? null : now - p.goneUntil, broadcast: n.gone ? departureEvents.has(id) : returnEvents.has(id), neighbors });
      }
      if (attendance && !n.gone && ((id === 'npc1' && n.mode === 'sitting') || (n.mode === 'chanting' && n.chantSeat?.hall === 'chinhDien'))) {
        inc(attendance.ticks, id); attendance.first[id] ??= fmt(now);
      }
      if (ring && id === 'npc4' && s.anim === 'ring') { ring.ticks++; ring.first ??= fmt(now); ring.last = fmt(now); }
      if (n.gone && now >= n.goneUntil) {
        if (!p.overdue) { st.overdueReturns++; event('overdue-return', n, { scheduledVN: fmt(n.goneUntil) }); }
        p.overdue = true;
      } else p.overdue = false;

      const key = `${n.gone}|${n.phase}|${n.mode}|${n.stage}|${s.anim}|${n.tourIdx}|${n.tourPhase}|${n.script?.i}|${expected.join('|')}`;
      if (key !== p.key || (now - base) % MIN === 0) {
        if (n.stage === 'stroll' && key !== p.key && n.tourStops[n.tourIdx]) {
          // Count stop arrivals, not animation changes within one stop.
          if (p.key.split('|')[3] !== 'stroll' || p.key.split('|')[5] !== String(n.tourIdx)) inc(st.arrivals, n.tourStops[n.tourIdx].kind);
        }
        event(key === p.key ? 'minute' : 'transition', n, { homeSlot: n.homeSlot, expected,
          untilVN: fmt(n.until), shiftEndVN: n.shiftEnd ? fmt(n.shiftEnd) : null });
      }
      if (!n.gone) {
        inc(st.ticks, s.anim); inc(st.modes, n.mode);
        st.minX = Math.min(st.minX, s.x); st.maxX = Math.max(st.maxX, s.x);
        st.minZ = Math.min(st.minZ, s.z); st.maxZ = Math.max(st.maxZ, s.z);
        if (n.def.post && distance(s, n.def.post) <= 1) st.postTicks++;
        const offPost = n.def.post && !n.script && n.mode === 'normal' && distance(s, n.def.post) > 1;
        if (offPost) {
          st.offPostNormalTicks++;
          st.longestOffPostNormalMs = Math.max(st.longestOffPostNormalMs, now - p.offPostFrom);
        } else p.offPostFrom = now;
        const hit = p.gone || !p.key || s.x !== p.x || s.z !== p.z ? blocked(s) : p.lastPositionHit;
        p.lastPositionHit = hit;
        if (hit?.kind === 'bounds') st.boundsTicks++;
        if (hit?.kind === 'water') st.waterTicks++;
        const hitKey = hit ? `${hit.kind}:${hit.collider?.i ?? ''}:${n.phase}` : '';
        if (hit) {
          inc(st.positionHits, `${hit.kind}:${n.phase}`);
          if (hitKey !== p.hit) event('position-hit', n, { ...hit, detectedKind: hit.kind });
        }
        p.hit = hitKey;
        if (p.gone || distance(p.anchor, s) >= 0.3) {
          p.anchor = point(s); p.stillFrom = now; p.travelFrom = now; p.stuck = false;
        }
        const travel = n.phase === 'walk' || n.mode.startsWith('to') || n.stage.startsWith('to');
        if (!travel) { p.travelFrom = now; p.stuck = false; }
        st.longestStaticMs = Math.max(st.longestStaticMs, now - p.stillFrom);
        st.longestTravelStaticMs = Math.max(st.longestTravelStaticMs, now - p.travelFrom);
        if (travel && !p.stuck && now - p.travelFrom > 10 * MIN) {
          p.stuck = true; st.stuckEpisodes++; event('stuck-travel', n, { sinceVN: fmt(p.travelFrom), anchor: p.anchor });
        }
        if (n.until < now && n.phase !== 'walk') st.longestOverdueMs = Math.max(st.longestOverdueMs, now - n.until);
      } else { p.travelFrom = p.stillFrom = p.offPostFrom = now; p.stuck = false; p.hit = ''; }

      if (!n.gone && n.route.length && n.route !== p.route) {
        let from = { x: p.x, z: p.z };
        for (let j = 0; j < n.route.length; j++) {
          const to = n.route[j];
          for (const hit of routeWitness(from, to)) {
            inc(st.routeHits, hit.kind);
            event('planned-segment-hit', n, { from: point(from), to: point(to), waypoint: j,
              ...hit, detectedKind: hit.kind });
          }
          from = to;
        }
      }
      if (!n.gone && p.phase === 'walk' && n.phase === 'idle' && p.next && !n.route.length && distance(s, p.next) >= 0.12) {
        st.routeAborts++;
        const d = distance(s, p.next), k = Math.min(1, n.speed * TICK / 1000 / d);
        const step = { x: s.x + (p.next.x - s.x) * k, z: s.z + (p.next.z - s.z) * k };
        const hit = blocked(step);
        if (hit && !hit.collider) st.confirmedRouteAborts++;
        event('route-ended-short', n, { previousHead: point(p.next), previousGoal: p.goal && point(p.goal),
          nextSample: point(step), detectedKind: hit?.kind, collider: hit?.collider });
      }
      if (p.script !== n.script) {
        if (p.script) {
          const finished = p.scriptStep >= p.script.steps.length && !p.script.last;
          if (finished) st.scriptCompletes++; else st.scriptResets++;
          event(finished ? 'script-complete' : 'script-reset', n, { endedStep: p.scriptStep, steps: p.script.steps.length,
            expectedEnd: p.script.last && point(p.script.last) });
        }
        if (n.script) { st.scriptStarts++; event('script-start', n, { steps: n.script.steps.length }); }
      }
      Object.assign(p, { x: s.x, z: s.z, phase: n.phase, key, route: n.route, next: n.route[0], goal: n.route.at(-1),
        gone: n.gone, goneUntil: n.goneUntil, script: n.script, scriptStep: n.script?.i ?? 0 });
    }
    const orphans = [...actualClaims].filter(([k, id]) => !expectedClaims.get(k)?.includes(id) || roomNpcs.get(id)?.gone);
    if (orphans.length) occupancy.orphanTicks++;
    const orphanKey = JSON.stringify(orphans);
    if (orphans.length && orphanKey !== lastOrphans) event('orphan-claims', undefined, { orphans });
    lastOrphans = orphanKey;
    const overlaps = [...expectedClaims].filter(([, ids]) => ids.length > 1);
    if (overlaps.length) occupancy.overlapTicks++;
    const overlapKey = JSON.stringify(overlaps);
    if (overlaps.length && overlapKey !== lastOverlap) event('duplicate-claims', undefined, { overlaps });
    lastOverlap = overlapKey;
    assert.equal(present.length, room.npcs.length - room.npcs.filter(n => n.gone).length);
    if (queue.length >= 512 && !log.write(queue.splice(0).join('\n') + '\n')) await once(log, 'drain');
    if (contactQueue.length >= 512 && !contactsLog.write(contactQueue.splice(0).join('\n') + '\n')) await once(contactsLog, 'drain');
  }
  log.end(queue.length ? queue.join('\n') + '\n' : '');
  contactsLog.end(contactQueue.length ? contactQueue.join('\n') + '\n' : '');
  await Promise.all([once(log, 'finish'), once(contactsLog, 'finish')]);
  Math.random = oldRandom;
  const endRevision = fingerprint();
  const changed = Object.keys({ ...startRevision.sha256, ...endRevision.sha256 })
    .filter(file => startRevision.sha256[file] !== endRevision.sha256[file]);
  writeFileSync(resolve(outDir, 'revision.json'), JSON.stringify({ ...startRevision, endAggregateSha256: endRevision.aggregateSha256,
    changed, auditSha256: hash(readFileSync(new URL(import.meta.url))) }, null, 2) + '\n');
  assert.equal(changed.length, 0, `Source changed during run: ${changed.join(', ')}`);
  const summary = { seed, sourceRoot: resolve(sourceRoot), baseUtc: new Date(base).toISOString(), tickMs: TICK,
    ticks: DAY / TICK, colliders: colliders.length, occupancy, bells, sessions,
    npcs: Object.fromEntries(room.npcs.map((n, i) => [n.def.id, { behavior: n.def.behavior, post: n.def.post,
      goneAtEnd: n.gone, scheduledReturnVN: n.gone ? fmt(n.goneUntil) : null, ...stats[i] }])) };
  writeFileSync(resolve(outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify({ ...summary, npcs: Object.keys(summary.npcs).length, output: resolve(outDir) }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
