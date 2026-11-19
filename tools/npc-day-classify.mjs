// Usage: node tools/npc-day-classify.mjs <completed audit directory>
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

const dir = process.argv[2];
assert(dir, 'Pass a completed audit directory');
const read = name => JSON.parse(readFileSync(join(dir, name), 'utf8'));
const summary = read('summary.json');
const revision = read('revision.json');
const colliders = new Map(read('colliders.json').map(c => [c.i, c]));
assert.equal(revision.aggregateSha256, revision.endAggregateSha256, 'Source changed during audit');

const axes = () => ({ all: { ticks: 0, episodes: 0 }, walk: { ticks: 0, episodes: 0 },
  idle: { ticks: 0, episodes: 0 }, act: { ticks: 0, episodes: 0 } });
const npc = Object.fromEntries(Object.entries(summary.npcs).map(([id, src]) => [id, {
  behavior: src.behavior, contacts: {}, overlap: {}, support: {}, presentTicks: Object.values(src.ticks).reduce((a, b) => a + b, 0),
}]));
const totals = { contacts: {}, overlap: {}, support: {} };
const active = new Map();
const support = new Map();
const distance = (a, b) => a && b ? Math.hypot(a.x - b.x, a.z - b.z) : Infinity;
const snapshot = ({ tick, timeVN, x, z, y, phase, mode, stage, anim, routeHead, routeGoal }) =>
  ({ tick, timeVN, x, z, y, phase, mode, stage, anim, routeHead, routeGoal });

function disposition(row, furniture, collider) {
  if (!furniture) {
    // The back wall circles overlap the authored monk bed ends. Keep the measured wall
    // contact visible and separate from both matching mattress and ordinary path blocking.
    const monkRest = row.bedId != null && ['toRest', 'resting', 'toWork'].includes(row.mode);
    const adjacentWall = monkRest && Math.abs(collider.z + 76.5) < 1e-6
      && Math.abs(collider.r - 7 / 12) < 1e-6 && Math.abs(collider.x - (row.bedId === 0 ? -67 - 1 / 3 : -61 + 1 / 3)) < 1e-6;
    return adjacentWall ? 'ambiguous-adjacent-bed-wall' : 'blocking';
  }
  const { kind, target, keys, index } = furniture;
  let matching = false;
  if (kind === 'desk-chair') matching = row.id === 'npc6';
  if (kind === 'bench') matching = keys.includes(row.bench);
  if (kind === 'monk-bed') matching = row.bedId === index && ['resting', 'toRest', 'toWork'].includes(row.mode);
  if (kind === 'guest-bed') matching = row.guestBedId === index && (row.stage === 'guestRest' || row.stage === 'toGuestRest' || row.phase === 'walk');
  if (matching) return `furniture-${kind}`;
  // Claimed furniture is intentional; an unclaimed collider might be an exit or another
  // piece of furniture. Do not silently exempt it or label it a confirmed blocker.
  if ((kind === 'monk-bed' && row.bedId != null && row.bedId !== index)
    || (kind === 'guest-bed' && row.guestBedId != null && row.guestBedId !== index)
    || (kind === 'desk-chair' && row.id !== 'npc6')) return `blocking-nonmatching-${kind}`;
  if (distance(row, target) < Infinity || keys) return `ambiguous-unclaimed-${kind}`;
  throw new Error(`Invalid furniture signature ${kind}`);
}

function addTicks(to, phase, duration) {
  to.all.ticks += duration;
  to[phase].ticks += duration;
}
function addEpisode(to, phase, entering, phaseEntering) {
  if (entering) to.all.episodes++;
  if (phaseEntering) to[phase].episodes++;
}

function closeContacts(id, nextTick) {
  const prev = active.get(id);
  if (!prev) return;
  const duration = nextTick - prev.row.tick;
  assert(duration >= 0, 'Out-of-order contact samples');
  const { phase } = prev.row;
  const entries = npc[id];
  const families = new Set();
  for (const [key, entry] of prev.contacts) {
    const { category, depth, collider, entering, phaseEntering } = entry;
    const global = (totals.contacts[category] ??= axes());
    const row = (entries.contacts[key] ??= { category, depth, collider, metrics: axes(), first: snapshot(prev.row), firstByPhase: {} });
    row.firstByPhase[phase] ??= snapshot(prev.row);
    for (const metric of [global, row.metrics]) {
      addTicks(metric, phase, duration);
      addEpisode(metric, phase, entering, phaseEntering);
    }
    families.add(category);
  }
  for (const category of families) {
    const entering = !prev.previousCategories.has(category);
    const phaseEntering = entering || prev.phaseChanged;
    for (const metric of [totals.overlap[category] ??= axes(), entries.overlap[category] ??= axes()]) {
      addTicks(metric, phase, duration);
      addEpisode(metric, phase, entering, phaseEntering);
    }
  }
}

function closeSupport(id, nextTick) {
  const prev = support.get(id);
  if (!prev) return;
  const duration = nextTick - prev.tick;
  assert(duration >= 0, 'Out-of-order support samples');
  const group = (npc[id].support[prev.support] ??= { ticks: 0, episodes: 0, first: prev });
  const total = (totals.support[prev.support] ??= { ticks: 0, episodes: 0 });
  for (const metric of [group, total]) {
    metric.ticks += duration;
    metric.episodes++;
  }
}

let meta;
for await (const line of createInterface({ input: createReadStream(join(dir, 'contacts.ndjson')), crlfDelay: Infinity })) {
  if (!line) continue;
  const row = JSON.parse(line);
  if (row.kind === 'meta') {
    assert(!meta && row.version === 1, 'Unexpected contacts schema');
    assert.equal(row.revision, revision.aggregateSha256);
    assert.deepEqual([row.tickMs, row.ticks, row.seed], [summary.tickMs, summary.ticks, summary.seed]);
    meta = row;
    continue;
  }
  assert(meta && npc[row.id] && Number.isInteger(row.tick) && row.tick >= 0 && row.tick < summary.ticks, 'Invalid NPC contact record');
  if (row.kind === 'support') {
    closeSupport(row.id, row.tick);
    support.set(row.id, row);
    continue;
  }
  assert.equal(row.kind, 'contacts');
  const prev = active.get(row.id);
  const contacts = new Map();
  for (const signed of row.contacts) {
    const id = Math.abs(signed) - 1, collider = colliders.get(id);
    assert(collider, `Unknown collider ${id}`);
    const depth = signed < 0 ? 'core' : 'padding';
    const category = `${disposition(row, meta.furniture[id], collider)}:${depth}`;
    const key = `${id}/${category}`;
    const entering = !prev?.contacts.has(key);
    contacts.set(key, { category, depth, collider, entering, phaseEntering: entering || prev.row.phase !== row.phase });
  }
  closeContacts(row.id, row.tick);
  if (contacts.size) {
    assert(['walk', 'idle', 'act'].includes(row.phase));
    active.set(row.id, { row, contacts, phaseChanged: prev?.row.phase !== row.phase,
      previousCategories: new Set([...(prev?.contacts.values() ?? [])].map(e => e.category)) });
  } else active.delete(row.id);
}
assert(meta && support.size === Object.keys(npc).length, 'Missing contact coverage');
for (const id of Object.keys(npc)) {
  closeContacts(id, summary.ticks);
  closeSupport(id, summary.ticks);
  const supportTicks = Object.entries(npc[id].support).reduce((sum, [kind, row]) => sum + (kind === 'gone' ? 0 : row.ticks), 0);
  assert.equal(supportTicks, npc[id].presentTicks, `${id} support interval coverage differs from audit`);
  npc[id].contacts = Object.values(npc[id].contacts);
}

const out = join(dir, 'classification.json');
const classifierSha256 = createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');
const definitions = {
  contacts: 'Each simultaneous collider contributes independently; episodes start on entry or depth/class change.',
  overlap: 'NPC-ticks and interval entries by category, deduplicated across simultaneous colliders of that category.',
  phases: 'All phase entries count continuous same-category contact; walk/idle/act entries also start when phase changes.',
  support: `Counts explicit root height overrides more than ${meta.supportTol} m above or below client groundY, except the matching Bodhi seat. Default ground uses the same groundY by construction. No claim about rendered limbs, furniture poses, roof meshes, or interpolation.`,
  clearance: 'Padding-only means outside the collider core, but inside the client player radius; it is not a core penetration.',
};
writeFileSync(out, JSON.stringify({ seed: summary.seed, tickMs: summary.tickMs, ticks: summary.ticks,
  sourceSha256: revision.aggregateSha256, auditSha256: revision.auditSha256, classifierSha256, definitions, totals, npcs: npc }, null, 2) + '\n');
console.log(JSON.stringify({ output: out, npcs: Object.keys(npc).length, totals }, null, 2));
