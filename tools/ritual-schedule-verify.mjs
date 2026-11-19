import assert from 'node:assert/strict';
process.env.DB_FILE = ':memory:';
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;

{
  const { db } = await import('../server/db.ts');
  const { createRitualTick } = await import('../server/rituals.ts');
  const { claimReward } = await import('../server/db-rituals.ts');
  const { festivalKeyNow, activeFestival } = await import('../shared/seasons.ts');
  const { groupWindowAt } = await import('../shared/rituals.ts');
  const time = (s) => Date.parse(`${s}+07:00`);
  const player = async (name, room) => {
    const r = await db.execute({ sql: 'INSERT INTO players (name, created_at) VALUES (?,?)', args: [name, Date.now()] });
    const pid = Number(r.lastInsertRowid);
    const events = new Map();
    return { pid, room, events, state: { id: name, anim: 'sit' }, socket: { emit: (ev, p) => events.set(ev, p) } };
  };
  const a = await player('a', 'west'), b = await player('b', 'east');
  const sessions = new Map([['a', a], ['b', b]]);
  const halos = [];
  const env = { sessions, afterReward: async () => {}, groupHalo: async (s) => { halos.push(s.pid); } };
  const tick = createRitualTick(env);
  const noon = time('2026-11-19T12:00:00');
  assert.equal(groupWindowAt(new Date(noon + 321)).endsAt, noon + 900_000);
  assert.equal(groupWindowAt(new Date(noon + 900_000)), null);
  await tick(noon);
  for (let sec = 5; sec <= 305; sec += 5) await tick(noon + sec * 1000);
  assert.equal(a.events.get('group:state').mySec, 0);
  assert.equal(a.events.has('group:done'), false);
  assert.ok(a.events.has('bell:ritual') && b.events.has('bell:ritual'));
  b.room = 'west';
  await tick(noon + 310_000);
  assert.deepEqual(a.events.get('group:state').auraIds, ['a', 'b']);
  for (let sec = 315; sec <= 615; sec += 5) await tick(noon + sec * 1000);
  assert.equal(a.events.get('group:state').claimed, true);
  assert.equal(b.events.get('group:state').claimed, true);
  assert.deepEqual(halos, [a.pid, b.pid]);
  await tick(noon + 900_000);
  assert.deepEqual(a.events.get('group:state').auraIds, []);
  const wallet = await db.execute('SELECT merit, coins FROM players ORDER BY id');
  assert.deepEqual(wallet.rows.map((r) => [r.merit, r.coins]), [[37, 15], [37, 15]]);
  const repeat = createRitualTick(env);
  await repeat(noon + 5000);
  assert.deepEqual((await db.execute('SELECT merit FROM players ORDER BY id')).rows.map((r) => r.merit), [37, 37]);

  const tet = new Date(time('2026-02-17T10:00:00'));
  assert.equal(festivalKeyNow(tet), festivalKeyNow(new Date(time('2026-02-16T10:00:00'))));
  assert.equal(activeFestival(new Date(time('2026-09-25T10:00:00')))?.key, 'trungThu');
  const gift = activeFestival(tet).gift;
  assert.equal(await claimReward(a.pid, 'fest', festivalKeyNow(tet), gift), 37);
  assert.equal(await claimReward(a.pid, 'fest', festivalKeyNow(tet), gift), null);
  console.log('PASS: lunar festivals, bell across rooms, group time and aura, idempotent payouts');
}
