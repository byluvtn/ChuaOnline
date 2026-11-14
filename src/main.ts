import * as THREE from 'three';
import { io, type Socket } from 'socket.io-client';
import { api, clearToken, getToken, setToken } from './api';
import { BOW_MS, animateCharacter, buildCharacter, type Character } from './character';
import { audio } from './audio';
import { initMenu } from './menu';
import { onSettings, settings } from './settings';
import { COUPLETS } from './couplets';
import { clampToCompound, resolveBridge } from './layout';
import { hydrateIcons, iconSvg } from './icons';
import { closePanel, h, openCustomPanel, openDonatePanel, openDonorsPanel, openPanel, panelOpen, refreshPanel } from './panels';
import { createPost } from './post';
import { createWorld } from './world';
import { initAnimals, updateAnimals, nearestFeedable, lostAnimal } from './animals';
import { createKoi } from './koi';
import { buildBuddha, buildQuanAm } from './statues';
import { ACTION_RULES, CHAIN_QUESTS, MARKET_STALLS, NPC_QUESTS, ROOMS, type MeditationInfo, type QuestState, type QuestZone } from '../shared/game';
import { DIALOGUES } from './data/dialogues';
import { createPathfinder } from '../shared/pathfind';
import { nearestNode, routeFrom, type Pt } from '../shared/roads';
import {
  MAP_HALF, MAP_Z_MIN, OUTFIT_COLOR, levelOf, meritForLevel,
  type ActionKind, type Anim, type AnimalState, type ChatMessage, type Lantern, type Outfit, type PlayerState, type Profile,
} from '../shared/types';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const isTouch = matchMedia('(pointer: coarse)').matches || location.search.includes('touch=1');
if (isTouch) document.body.classList.add('touch');
hydrateIcons();

const COLORS = ['#d9a62b', '#778c96', '#72818e', '#bc7672', '#c0561f', '#e8821e', '#7a6130', '#5b6377', '#2f5aa8', '#a3343f', '#3b8a52', '#c27d1e', '#7a3f8f', '#e3b341', '#d99a1e', '#8fb0c4', '#5a3a22', '#6f93b5'];
const NAMES = ['Chân Hạnh', 'Thiện Tâm', 'Minh Đạt', 'Từ Bi', 'An Nhiên', 'Tịnh Hòa', 'Diệu Hạnh', 'Giác Ngộ', 'Hỷ Xả'];
const randName = () => `${NAMES[Math.floor(Math.random() * NAMES.length)]} ${Math.floor(Math.random() * 99) + 1}`;

// ---------- State ----------
let outfit: Outfit = (localStorage.getItem('co:outfit') as Outfit) || 'monk';
let color = localStorage.getItem('co:color') || '#d99a1e';
let roomId = localStorage.getItem('co:room') || ROOMS[0].id;
let profile: Profile | null = null;
let quests: QuestState[] = [];
let latestAnimals: AnimalState[] = [];
const nameInput = $<HTMLInputElement>('name');
nameInput.value = localStorage.getItem('co:name') || randName();

// ---------- Login preview ----------
const previewCanvas = $<HTMLCanvasElement>('preview');
const pr = new THREE.WebGLRenderer({ canvas: previewCanvas, alpha: true, antialias: true });
pr.setPixelRatio(Math.min(devicePixelRatio, 2));
pr.setSize(600, 440, false);
pr.toneMapping = THREE.ACESFilmicToneMapping;
const pScene = new THREE.Scene();
pScene.add(new THREE.HemisphereLight(0xffffff, 0x887766, 1.6));
const pl = new THREE.DirectionalLight(0xffffff, 1.4);
pl.position.set(2, 4, 4);
pScene.add(pl);
const rim = new THREE.DirectionalLight(0xffcf8a, 1.2);
rim.position.set(-3, 3, -3);
pScene.add(rim);
const pCam = new THREE.PerspectiveCamera(30, 600 / 440, 0.1, 50);
pCam.position.set(0, 1.4, 5.5);
pCam.lookAt(0, 1.12, 0);
let pChar = null as Character | null;
function rebuildPreview() {
  if (pChar) pScene.remove(pChar.root);
  pChar = buildCharacter(outfit, color, '');
  pChar.label.visible = false;
  pChar.setAccessory(profile?.accessory ?? null);
  pScene.add(pChar.root);
}
function buildPickers() {
  const wrap = $('colors');
  wrap.innerHTML = '';
  COLORS.forEach((c) => {
    const b = document.createElement('button');
    b.style.background = c;
    b.setAttribute('aria-label', `Màu ${c}`);
    if (c === color) b.className = 'on';
    b.onclick = () => { color = c; buildPickers(); rebuildPreview(); };
    wrap.appendChild(b);
  });
  document.querySelectorAll<HTMLButtonElement>('#outfits button').forEach((b) => {
    b.classList.toggle('on', b.dataset.outfit === outfit);
    b.onclick = () => { outfit = b.dataset.outfit as Outfit; color = OUTFIT_COLOR[outfit]; buildPickers(); rebuildPreview(); };
  });
}
buildPickers();
rebuildPreview();
$('rand').onclick = () => (nameInput.value = randName());

let previewRunning = true;
(function loopPreview(t = 0) {
  if (!previewRunning) return;
  requestAnimationFrame(loopPreview);
  if (pChar) {
    pChar.root.rotation.y = import.meta.env.DEV && (window as any).__co?.pvRot !== undefined ? (window as any).__co.pvRot : Math.sin(t / 1000) * 0.5;
    animateCharacter(pChar, 'idle', t / 1000);
  }
  pr.render(pScene, pCam);
})();

// ---------- Auth UI ----------
function refreshAuthButton() {
  const b = $('authOpen');
  b.textContent = profile?.username ? `Đăng xuất (${profile.username})` : 'Đã có tài khoản? Đăng nhập / Đăng ký';
}
async function loadSession() {
  if (!getToken()) return;
  try {
    profile = await api.me();
    nameInput.value = profile.name;
    outfit = profile.outfit;
    color = profile.color;
    buildPickers();
    rebuildPreview();
  } catch (e) { if ((e as { status?: number }).status === 401) { clearToken(); profile = null; } }
  refreshAuthButton();
}
refreshAuthButton();
const sessionReady = loadSession();

let authMode: 'login' | 'register' = 'login';
function setAuthMode(m: typeof authMode) {
  authMode = m;
  $('tabLogin').classList.toggle('on', m === 'login');
  $('tabReg').classList.toggle('on', m === 'register');
  $('authTitle').textContent = m === 'login' ? 'Đăng nhập' : 'Đăng ký';
  $('authHint').textContent = m === 'register' ? 'Đăng ký sẽ giữ lại công đức hiện tại của bạn.' : 'Đăng nhập sẽ thay thế tiến trình khách hiện tại.';
  $<HTMLInputElement>('ap').autocomplete = m === 'login' ? 'current-password' : 'new-password';
  $('authErr').textContent = '';
}
$('tabLogin').onclick = () => setAuthMode('login');
$('tabReg').onclick = () => setAuthMode('register');
$('authCancel').onclick = () => ($('authModal').hidden = true);
$('authOpen').onclick = async () => {
  if (profile?.username) {
    try { await api.logout(); } catch { /* ignore */ }
    clearToken();
    location.reload();
    return;
  }
  setAuthMode('login');
  $('authModal').hidden = false;
  $('au').focus();
};
$<HTMLFormElement>('authForm').onsubmit = async (e) => {
  e.preventDefault();
  const u = $<HTMLInputElement>('au').value.trim();
  const p = $<HTMLInputElement>('ap').value;
  try {
    const r = authMode === 'login' ? await api.login(u, p) : await api.register(u, p);
    setToken(r.token);
    $('authModal').hidden = true;
    $<HTMLInputElement>('ap').value = '';
    await loadSession();
  } catch (err) {
    $('authErr').textContent = (err as Error).message;
  }
};

// ---------- 3D scene ----------
const canvas = $<HTMLCanvasElement>('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = isTouch ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
const world = createWorld(renderer);
initAnimals(world.scene, () => settings.showNames);
const pathfinder = createPathfinder(world.colliders);
const post = createPost(renderer, world.scene, camera, isTouch);
const prewarm = () => {
  const seen = new Set<THREE.Texture>();
  world.scene.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!m) return;
    for (const mat of Array.isArray(m) ? m : [m]) {
      for (const v of Object.values(mat as unknown as Record<string, unknown>)) {
        const t = v as THREE.Texture;
        if (t && t.isTexture && !seen.has(t)) { seen.add(t); renderer.initTexture(t); }
      }
    }
  });
  renderer.compile(world.scene, camera);
};
const resize = () => {
  renderer.setSize(innerWidth, innerHeight, false);
  post.resize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};
addEventListener('resize', resize);
resize();

interface Remote { char: Character; target: THREE.Vector3; ry: number; anim: Anim; actionUntil: number; data: PlayerState; prevAnim?: Anim; lastX?: number; lastZ?: number; lastMoveAt?: number; lodAt?: number; lodAnim?: string; lodStill?: number; lastRingAt?: number }
const remotes = new Map<string, Remote>();
let socket: Socket | null = null;
let myId = '';
let me: Remote | null = null;
let meditation: MeditationInfo = { sitting: 0, minutes: 0, goal: 500, bonus: false };

const keys = new Set<string>();
let camYaw = 0, camPitch = isTouch ? 0.55 : 0.45, camDist = isTouch ? 12 : 9;
let freeCam = false;
let pavF = 0;
let houseF = 0;
let savedOutDist: number | null = null;
let savedBump: number | null = null;
const freePos = new THREE.Vector3();
const camMaxDist = () => (profile?.admin ? 160 : 18);
const camMaxPitch = () => (profile?.admin ? 1.55 : 1.3);
const PAVILION_ZONES = ['tamBao', 'tamThe'];
const HOUSE_CAM: Record<string, { dist: number; bump: number }> = {
  dienMau: { dist: 2.6, bump: -0.05 },
  traiDuong: { dist: 3.0, bump: 0 },
  amCo: { dist: 3.0, bump: 0 },
  nhaTo: { dist: 3.4, bump: 0 },
  nhaKhach: { dist: 3.4, bump: 0 },
  tangXa: { dist: 3.4, bump: 0 },
  thienDuong: { dist: 3.4, bump: 0 },
  phongCongDuc: { dist: 3.4, bump: 0 },
};
let clickTarget: THREE.Vector3 | null = null;
let guideQuestId: string | null = null;
let guideTarget: Pt | null = null;
let guideWaypoints: Pt[] = [];
const guideGroup = new THREE.Group();
guideGroup.visible = false;
world.scene.add(guideGroup);
let dragging = false, dragMoved = 0;
let sitting = false;
const joy = { x: 0, y: 0, id: -1 };

function addPlayer(p: PlayerState) {
  if (remotes.has(p.id)) return remotes.get(p.id)!;
  const char = p.npc ? buildCharacter(p.outfit, p.color, p.name, { scale: p.role === 'abbot' ? 1.15 : p.role === 'lay' ? 1 : 0.9, role: p.role }) : buildCharacter(p.outfit, p.color, p.name);
  char.setLabel(p.name, p.npc ? undefined : levelOf(p.merit), p.id === myId);
  char.label.visible = settings.showNames;
  char.setAccessory(p.accessory);
  char.root.position.set(p.x, 0, p.z);
  if (p.npc) char.root.visible = settings.showNpcs;
  world.scene.add(char.root);
  const r: Remote = { char, target: new THREE.Vector3(p.x, world.groundY(p.x, p.z), p.z), ry: p.ry, anim: p.anim, actionUntil: 0, data: p };
  remotes.set(p.id, r);
  return r;
}
function clearPlayers() {
  remotes.forEach((r) => { world.scene.remove(r.char.root); r.char.dispose(); });
  remotes.clear();
  me = null;
}

// ---------- HUD ----------
function toast(text: string) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

const DONATE_MS = 10000;
const donateQueue: string[] = [];
let donateBusy = false;
function showNextDonate() {
  const next = donateQueue.shift();
  if (next === undefined) { donateBusy = false; return; }
  donateBusy = true;
  const box = $('donateMarquee');
  const span = box.firstElementChild as HTMLElement;
  span.textContent = next;
  box.hidden = false;
  span.style.animation = 'none';
  void span.offsetWidth;
  span.style.animation = '';
  box.classList.add('show');
  setTimeout(() => {
    box.classList.remove('show');
    setTimeout(() => { box.hidden = true; showNextDonate(); }, 600);
  }, DONATE_MS);
}
function enqueueDonate(text: string) {
  donateQueue.push(text);
  if (!donateBusy) showNextDonate();
}
let lastMerit = -1, lastCoins = -1, lastLevel = 0;
function floatText(text: string, cls = '') {
  if (!me) return;
  const v = me.char.root.position.clone();
  v.y = 3.3;
  v.project(camera);
  const el = document.createElement('div');
  el.className = 'float ' + cls;
  el.textContent = text;
  el.style.left = `${(v.x * 0.5 + 0.5) * innerWidth + (Math.random() - 0.5) * 50}px`;
  el.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`;
  $('floats').appendChild(el);
  setTimeout(() => el.remove(), 1700);
}
function updateProfileHud() {
  if (!profile) return;
  const lv = levelOf(profile.merit);
  if (lastMerit >= 0 && profile.merit > lastMerit) floatText(`+${profile.merit - lastMerit} công đức`);
  if (lastCoins >= 0 && profile.coins > lastCoins) { audio.play('coin'); $('coins').classList.remove('bump'); void $('coins').offsetWidth; $('coins').classList.add('bump'); }
  if (lastLevel && lv > lastLevel) {
    $('levelN').textContent = String(lv);
    const el = $('levelup'); el.hidden = false; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    setTimeout(() => (el.hidden = true), 2600);
    audio.play('levelup');
    if (me) world.spawnBurst(me.char.root.position.x, me.char.root.position.z);
  }
  lastMerit = profile.merit; lastCoins = profile.coins; lastLevel = lv;
  if (me) me.char.setLabel(profile.name, lv, true);
  const lo = meritForLevel(lv), hi = meritForLevel(lv + 1);
  $('pname').textContent = profile.name;
  $('plevel').textContent = `Cấp ${lv} · ${profile.merit} công đức`;
  $('pbar').style.width = `${Math.min(100, ((profile.merit - lo) / (hi - lo)) * 100)}%`;
  $('coinN').textContent = String(profile.coins);
  $('avatar').textContent = profile.name.charAt(0).toUpperCase();
  if (me) { me.char.setAccessory(profile.accessory); me.data.accessory = profile.accessory; }
}
function updateQuestDot() {
  $('questDot').hidden = !quests.some((q) => q.progress >= q.target && !q.claimed);
}
function updateMeditationHud() {
  const b = $('medBanner');
  if (!meditation.sitting) { b.hidden = true; return; }
  b.hidden = false;
  b.classList.toggle('bonus', meditation.bonus);
  b.textContent = `Tĩnh lặng cả chùa: ${meditation.sitting} người đang thiền · ${meditation.minutes}/${meditation.goal} phút` + (meditation.bonus ? ' · Thiền tập thể x2' : ' · cần 3 người để x2');
}
const chatLog: ChatMessage[] = [];
function addChat(m: ChatMessage) {
  chatLog.push(m);
  if (chatLog.length > 100) chatLog.shift();
  const box = $('msgs');
  const p = document.createElement('p');
  if (m.sys) {
    p.className = 'sys';
    p.textContent = m.text;
  } else {
    const b = document.createElement('b');
    b.textContent = m.name + ': ';
    p.append(b, document.createTextNode(m.text));
  }
  box.appendChild(p);
  while (box.childElementCount > 80) box.firstElementChild!.remove();
  box.scrollTop = box.scrollHeight;
  if (!m.sys && m.sid && settings.showBubbles) remotes.get(m.sid)?.char.say(m.text);
}
function addLanternFeed(l: Lantern, fresh: boolean) {
  const list = $('lanternList');
  const d = document.createElement('div');
  d.className = 'item';
  d.textContent = `“${l.wish}”`;
  const s = document.createElement('small');
  s.textContent = l.name;
  d.appendChild(s);
  list.prepend(d);
  while (list.childElementCount > 30) list.lastElementChild!.remove();
  if (fresh) {
    const r = [...remotes.values()].find((x) => x.data.name === l.name);
    world.spawnLantern(r?.char.root.position.x ?? 0, r?.char.root.position.z ?? 8);
    audio.play('lantern');
  }
}
const syncSound = () => {
  const m = audio.isMuted();
  $('soundBtn').classList.toggle('off', m);
  $('soundBtn').innerHTML = iconSvg(m ? 'mute' : 'sound');
};
$('soundBtn').onclick = () => { audio.unlock(); audio.setMuted(!audio.isMuted()); syncSound(); audio.play('click'); };
syncSound();
$('chatToggle').onclick = () => $('chat').classList.toggle('collapsed');
if (isTouch) $('chat').classList.add('collapsed');

let curZone: string | null = null;
const dismissed = new Set<string>();
onSettings((st, key) => {
  if (key === null || key === 'sound') { if (audio.isMuted() === st.sound) { audio.setMuted(!st.sound); syncSound(); } }
  if (key === null || key === 'quality') {
    const cap = st.quality === 'low' ? 1 : st.quality === 'medium' ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(devicePixelRatio, cap));
    post.bloom.enabled = st.quality !== 'low';
    world.sun.castShadow = st.quality !== 'low';
    resize();
  }
  if (key === null || key === 'showNames') remotes.forEach((r) => (r.char.label.visible = st.showNames));
  if (key === null || key === 'showNpcs') remotes.forEach((r) => { if (r.data.npc) r.char.root.visible = st.showNpcs; });
  if (key === null || key === 'showCouplets') { if (!st.showCouplets) hideCouplet(); else curZone = null; }
  if (key === 'showTips' || key === null) $('marquee').style.display = st.showTips ? '' : 'none';
});

// ---------- Networking ----------
function sendJoin() {
  const room = ROOMS.find((r) => r.id === roomId) ?? ROOMS[0];
  world.setMood(room.id);
  $('roomName').textContent = room.name;
  socket!.emit('join', { name: nameInput.value, outfit, color, room: roomId });
}
function connect() {
  socket = io({ auth: { token: getToken() } });
  const s = socket;
  s.on('connect', sendJoin);
  s.on('connect_error', () => { toast('Mất kết nối máy chủ'); });
  s.on('kicked', () => { toast('Tài khoản đang đăng nhập nơi khác'); setTimeout(() => location.reload(), 1500); });
  s.on('join:error', (m: string) => toast(m));
  s.on('welcome', (w: { id: string; room: string; players: PlayerState[]; chat: ChatMessage[]; lanterns: Lantern[]; meditation: MeditationInfo }) => {
    myId = w.id;
    roomId = w.room;
    localStorage.setItem('co:room', roomId);
    const room = ROOMS.find((r) => r.id === roomId) ?? ROOMS[0];
    world.setMood(room.id);
    $('roomName').textContent = room.name;
    clearPlayers();
    w.players.forEach(addPlayer);
    startMenu();
    me = remotes.get(myId) ?? null;
    sitting = false;
    $('sitBtn').classList.remove('on');
    $('msgs').innerHTML = '';
    w.chat.forEach(addChat);
    $('lanternList').innerHTML = '';
    w.lanterns.forEach((l) => addLanternFeed(l, false));
    meditation = w.meditation;
    updateMeditationHud();
    updateProfileHud();
  });
  s.on('profile', (p: Profile) => { profile = p; updateProfileHud(); refreshPanel(); });
  s.on('level:bonus', ({ level, coins, merit }: { level: number; coins: number; merit: number }) => {
    toast(`Lên cấp ${level}! Thưởng +${coins} xu, +${merit} công đức`);
  });
  s.on('quests', (q: QuestState[]) => {
    quests = q; updateQuestDot(); refreshPanel();
    updateNpcMarkers();
    updateGuideTarget(); updateGuidePath();
    if (dialogueNpc) { if (panelOpen()) openDialogue(dialogueNpc); else dialogueNpc = null; }
  });
  s.on('meditation', (m: MeditationInfo) => { meditation = m; updateMeditationHud(); });
  s.on('player:join', addPlayer);
  s.on('player:leave', (id: string) => {
    const r = remotes.get(id);
    if (r) { world.scene.remove(r.char.root); r.char.dispose(); }
    const ms = markerSprites.get(id);
    if (ms) { world.scene.remove(ms); markerSprites.delete(id); }
    remotes.delete(id);
  });
  s.on('player:look', ({ id, accessory }: { id: string; accessory: string | null }) => remotes.get(id)?.char.setAccessory(accessory));
  s.on('state', (st: { online: number; players: Pick<PlayerState, 'id' | 'x' | 'z' | 'ry' | 'anim'>[]; animals?: AnimalState[] }) => {
    $('onlineN').textContent = String(st.online);
    latestAnimals = st.animals ?? [];
    for (const p of st.players) {
      const r = remotes.get(p.id);
      if (!r || p.id === myId) continue;
      r.target.set(p.x, world.groundY(p.x, p.z), p.z);
      r.ry = p.ry;
      if (performance.now() > r.actionUntil) r.anim = p.anim;
    }
  });
  s.on('chat', addChat);
  s.on('lantern', (l: Lantern) => addLanternFeed(l, true));
  s.on('donation', (d: { name: string; amount: number; text: string }) => { enqueueDonate(d.text || `🙏 Cảm ơn phật tử ${d.name} đã đóng góp ${d.amount.toLocaleString('vi-VN')} xu giúp xây dựng chùa`); });
  s.on('player:action', ({ id, kind }: { id: string; kind: ActionKind }) => {
    const r = remotes.get(id);
    if (!r || id === myId) return;
    r.anim = kind;
    r.actionUntil = performance.now() + actionMs(kind);
    if (kind === 'incense') world.spawnIncense(r.char.root.position.x, r.char.root.position.z);
  });
  s.on('player:release', ({ id, kind }: { id: string; kind: 'bird' | 'fish' }) => {
    const root = id === myId ? me?.char.root : remotes.get(id)?.char.root;
    if (!root) return;
    startReleaseAnim(root.position.x, root.position.z, kind);
  });
}

$('enter').onclick = async () => {
  const btn = $<HTMLButtonElement>('enter');
  btn.disabled = true;
  try {
    await sessionReady;
    if (!getToken()) setToken((await api.guest()).token);
    localStorage.setItem('co:name', nameInput.value);
    localStorage.setItem('co:outfit', outfit);
    localStorage.setItem('co:color', color);
    previewRunning = false;
    $('login').hidden = true;
    $('hud').hidden = false;
    $('joystick').hidden = !isTouch;
    audio.unlock();
    audio.startAmbient();
    connect();
  } catch (e) {
    btn.disabled = false;
    alert((e as Error).message);
  }
};

function switchRoom(id: string) {
  if (id === roomId || !socket) return;
  roomId = id;
  sendJoin();
}

// ---------- Panels / menu ----------
const panelCtx = () => ({
  socket: socket!, profile: () => profile, quests: () => quests, room: () => roomId, switchRoom, toast,
  guideTo: (qid: string) => { startGuide(qid); },
});
$('panelClose').onclick = closePanel;
$('panel').addEventListener('pointerdown', (e) => { if (e.target === $('panel')) closePanel(); });
async function logout() {
  if (!profile?.username && !confirm('Bạn đang chơi khách. Thoát sẽ mất tiến trình trên thiết bị này nếu chưa đăng ký. Tiếp tục?')) return;
  try { await api.logout(); } catch { /* ignore */ }
  clearToken();
  location.reload();
}
function changeLook(name: string, o: Outfit, c: string) {
  nameInput.value = name; outfit = o; color = c;
  localStorage.setItem('co:name', name); localStorage.setItem('co:outfit', o); localStorage.setItem('co:color', c);
  socket?.emit('join', { name, outfit: o, color: c, room: roomId });
}
function startMenu() {
  initMenu({
    socket: socket!, profile: () => profile, quests: () => quests, room: () => roomId, switchRoom, toast, logout,
    myPos: () => (me ? { x: me.char.root.position.x, z: me.char.root.position.z } : null),
    players: () => [...remotes.entries()].filter(([, r]) => !r.data.npc).map(([id, r]) => ({ id, name: r.data.name, x: r.char.root.position.x, z: r.char.root.position.z, level: levelOf(r.data.merit) })),
    goTo: (x, z) => { clickTarget = new THREE.Vector3(x, 0, z); bowSeat = null; setSitting(false); },
    changeLook, chatLog: () => chatLog,
    act: (kind) => doAction(kind),
    guideTo: (qid: string) => { startGuide(qid); },
  });
}
// ---------- Input ----------
const typing = () => document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closePanel(); $('wishModal').hidden = true; return; }
  if (typing() || panelOpen()) return;
  if (e.code === 'KeyF' && profile?.admin && !e.repeat) {
    freeCam = !freeCam;
    if (freeCam) freePos.copy(camera.position);
    toast(freeCam ? 'Camera tự do: WASD di chuyển, Space/E bay lên, Q xuống, lăn chuột zoom, Shift nhanh, kéo chuột để xoay, F để thoát' : 'Đã thoát camera tự do');
    return;
  }
  if (e.code === 'Space' && freeCam && profile?.admin) e.preventDefault();
  keys.add(e.code);
  if (e.key === 'Enter') { e.preventDefault(); $('chatInput').focus(); }
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

canvas.addEventListener('pointerdown', () => { dragging = true; dragMoved = 0; });
addEventListener('pointerup', (e) => {
  if (dragging && dragMoved < 5 && e.target === canvas && me) {
    const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(world.ground)[0];
    if (hit) { if (guideQuestId) stopGuide(); sweepState = null; clickTarget = hit.point.clone(); bowSeat = null; setSitting(false); }
  }
  dragging = false;
});
addEventListener('pointermove', (e) => {
  if (!dragging) return;
  dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
  camYaw -= e.movementX * 0.005;
  camPitch = Math.min(camMaxPitch(), Math.max(profile?.admin ? -1.2 : 0.1, camPitch + e.movementY * 0.004));
});
canvas.addEventListener('wheel', (e) => {
  if (freeCam && profile?.admin) {
    const k = -e.deltaY * 0.05;
    freePos.x += -Math.sin(camYaw) * Math.cos(camPitch) * k;
    freePos.y = Math.max(0.5, Math.min(250, freePos.y - Math.sin(camPitch) * k));
    freePos.z += -Math.cos(camYaw) * Math.cos(camPitch) * k;
    return;
  }
  camDist = Math.min(camMaxDist(), Math.max(4, camDist + e.deltaY * (profile?.admin ? 0.03 : 0.01)));
}, { passive: true });

// Joystick (touch)
const joyEl = $('joystick'), stick = $('stick');
function joyMove(e: PointerEvent) {
  const r = joyEl.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy;
  const max = r.width / 2 - 10;
  const len = Math.hypot(dx, dy);
  if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
  stick.style.transform = `translate(${dx}px, ${dy}px)`;
  const dead = 0.2;
  joy.x = Math.abs(dx / max) > dead ? dx / max : 0;
  joy.y = Math.abs(dy / max) > dead ? dy / max : 0;
}
joyEl.addEventListener('pointerdown', (e) => { joy.id = e.pointerId; joyEl.setPointerCapture(e.pointerId); joyMove(e); e.preventDefault(); });
joyEl.addEventListener('pointermove', (e) => { if (e.pointerId === joy.id) joyMove(e); });
const joyEnd = (e: PointerEvent) => { if (e.pointerId !== joy.id) return; joy.id = -1; joy.x = joy.y = 0; stick.style.transform = ''; };
joyEl.addEventListener('pointerup', joyEnd);
joyEl.addEventListener('pointercancel', joyEnd);

// Joystick có thể kéo tới vị trí tuỳ ý bằng tay nắm ở góc; vị trí được nhớ giữa các lần mở game.
const JOY_POS_KEY = 'co:joyPos';
const clampJoy = (x: number, y: number) => {
  const w = joyEl.offsetWidth || 124, h = joyEl.offsetHeight || 124;
  return { x: Math.max(6, Math.min(innerWidth - w - 6, x)), y: Math.max(6, Math.min(innerHeight - h - 6, y)) };
};
const placeJoy = (x: number, y: number) => {
  const p = clampJoy(x, y);
  joyEl.style.left = `${p.x}px`; joyEl.style.top = `${p.y}px`; joyEl.style.bottom = 'auto';
  return p;
};
if (isTouch) {
  const grip = document.createElement('div');
  grip.id = 'joyGrip';
  grip.setAttribute('aria-label', 'Kéo để di chuyển nút điều hướng');
  grip.innerHTML = '<span data-icon="move"></span>';
  joyEl.append(grip);
  hydrateIcons(grip);
  let drag: { id: number; ox: number; oy: number } | null = null;
  grip.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    const r = joyEl.getBoundingClientRect();
    drag = { id: e.pointerId, ox: e.clientX - r.left, oy: e.clientY - r.top };
    try { grip.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    joyEl.classList.add('moving');
  });
  grip.addEventListener('pointermove', (e) => { if (drag && e.pointerId === drag.id) placeJoy(e.clientX - drag.ox, e.clientY - drag.oy); });
  const gripEnd = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null; joyEl.classList.remove('moving');
    const r = joyEl.getBoundingClientRect();
    try { localStorage.setItem(JOY_POS_KEY, JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top) })); } catch { /* storage blocked */ }
  };
  grip.addEventListener('pointerup', gripEnd);
  grip.addEventListener('pointercancel', gripEnd);
  grip.addEventListener('dblclick', () => {
    joyEl.style.left = joyEl.style.top = joyEl.style.bottom = '';
    try { localStorage.removeItem(JOY_POS_KEY); } catch { /* storage blocked */ }
  });
  const restoreJoy = () => {
    try {
      const s = JSON.parse(localStorage.getItem(JOY_POS_KEY) ?? 'null');
      if (s && Number.isFinite(s.x) && Number.isFinite(s.y)) placeJoy(s.x, s.y);
    } catch { /* ignore */ }
  };
  restoreJoy();
  addEventListener('resize', () => { if (joyEl.style.top) { const r = joyEl.getBoundingClientRect(); placeJoy(r.left, r.top); } });
}

// Pinch zoom
const touches = new Map<number, { x: number; y: number }>();
canvas.addEventListener('pointerdown', (e) => touches.set(e.pointerId, { x: e.clientX, y: e.clientY }));
canvas.addEventListener('pointermove', (e) => {
  const prev = touches.get(e.pointerId);
  if (!prev) return;
  if (touches.size === 2) {
    const other = [...touches.entries()].find(([id]) => id !== e.pointerId)![1];
    const before = Math.hypot(prev.x - other.x, prev.y - other.y);
    const after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
    camDist = Math.min(camMaxDist(), Math.max(4, camDist - (after - before) * 0.03));
    dragMoved = 99;
  }
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
});
const touchEnd = (e: PointerEvent) => touches.delete(e.pointerId);
canvas.addEventListener('pointerup', touchEnd);
canvas.addEventListener('pointercancel', touchEnd);

$<HTMLFormElement>('chatForm').onsubmit = (e) => {
  e.preventDefault();
  const i = $<HTMLInputElement>('chatInput');
  if (i.value.trim()) socket?.emit('chat', i.value);
  i.value = '';
  i.blur();
};

let myActionUntil = 0;
let sweepState: { qid: string; point: Pt; until: number } | null = null;
let lastSweepCheck = 0;
let lastSwept: { qid: string; x: number; z: number } | null = null;
/** Điểm bồ đoàn đang trên đường tới để lạy (null = không có hành trình). */
let bowSeat: { x: number; z: number } | null = null;
/** Đi thẳng tới đệm (bỏ road graph). Chỉ có nghĩa khi bowSeat != null; startBow luôn ghi lại giá trị này. */
let bowDirect = false;

type SeatT = (typeof world.seats)[number];
type BowGroup = 'chinhDien' | 'tamThe' | 'thienDuong' | 'dienMau';
const inBox = (x: number, z: number, x0: number, x1: number, z0: number, z1: number) => x >= x0 && x <= x1 && z >= z0 && z <= z1;

/** Nhóm điện của một đệm (bbox tường minh, không dùng world.zoneAt). Đệm sân thiền thuộc nhóm Chính Điện. */
function seatGroup(x: number, z: number): BowGroup | null {
  if (inBox(x, z, 35, 41, 8, 12)) return 'dienMau';
  if (inBox(x, z, -20, 20, -78, -58)) return 'tamThe';
  if (Math.hypot(x + 47, z + 27) <= 8) return 'thienDuong';
  if (Math.abs(x) <= 17 && z >= -42 && z <= -6) return 'chinhDien';
  return null;
}

/** Người chơi đang đứng trong bbox của điện nào (sân thiền ngoài trời không tính). */
function insideHall(x: number, z: number): BowGroup | null {
  if (inBox(x, z, 35, 41, 8, 12)) return 'dienMau';
  if (inBox(x, z, -20, 20, -78, -58)) return 'tamThe';
  if (Math.hypot(x + 47, z + 27) <= 8) return 'thienDuong';
  if (inBox(x, z, -17, 17, -42, -22)) return 'chinhDien';
  return null;
}

function seatTaken(st: { x: number; z: number }): boolean {
  let taken = false;
  remotes.forEach((r, id) => { if (id !== myId && !r.data.npc && Math.hypot(r.target.x - st.x, r.target.z - st.z) < 0.6) taken = true; });
  return taken;
}

/** Độ dài route thật; Infinity nếu đường vòng không tới được đích (lastFallback). */
function routeLength(ax: number, az: number, bx: number, bz: number): number {
  const pts = pathfinder.findPath({ x: ax, z: az }, { x: bx, z: bz });
  if (pathfinder.lastFallback) return Infinity;
  let len = 0, px = ax, pz = az;
  for (const p of pts) { len += Math.hypot(p.x - px, p.z - pz); px = p.x; pz = p.z; }
  return len;
}

/** Collider nằm trên đoạn thẳng a->b (cùng ngưỡng với pathfinder: r + 0.55). */
function segmentBlockers(ax: number, az: number, bx: number, bz: number): { x: number; z: number; r: number }[] {
  const out: { x: number; z: number; r: number }[] = [];
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
  for (const c of world.colliders) {
    const t = Math.max(0, Math.min(1, ((c.x - ax) * dx + (c.z - az) * dz) / l2));
    if (Math.hypot(ax + t * dx - c.x, az + t * dz - c.z) < c.r + 0.55) out.push(c);
  }
  return out;
}

/** Đường vòng dài > 2 lần đường thẳng và đoạn thẳng chỉ bị chặn bởi <= 3 vật nhỏ (r <= 1.0): đi thẳng. */
function shouldWalkDirect(ax: number, az: number, bx: number, bz: number): boolean {
  const direct = Math.hypot(bx - ax, bz - az);
  if (direct <= 0 || !(routeLength(ax, az, bx, bz) > 2 * direct)) return false;
  const bl = segmentBlockers(ax, az, bx, bz);
  return bl.length > 0 && bl.length <= 3 && bl.every((c) => c.r <= 1.0);
}

/**
 * Chọn đệm Lạy: (1) nhóm điện: đang trong bbox điện nào thì chỉ điện đó; ngoài trời thì nhóm có tâm gần nhất,
 * không xét Điện Mẫu. (2) trong nhóm: đệm gần nhất theo Euclid có segmentClear; nếu không có đệm nào thông thì
 * đệm có route thật ngắn nhất trong 12 đệm gần nhất.
 */
function pickBowSeat(): SeatT | null {
  if (!me) return null;
  const px = me.char.root.position.x, pz = me.char.root.position.z;
  const groups = new Map<BowGroup, SeatT[]>();
  for (const st of world.seats) {
    if (st.rest) continue;
    const g = seatGroup(st.x, st.z);
    if (!g) continue;
    const arr = groups.get(g);
    if (arr) arr.push(st); else groups.set(g, [st]);
  }
  const here = insideHall(px, pz);
  let order: BowGroup[];
  if (here) order = [here];
  else {
    const dist = (g: BowGroup) => {
      const a = groups.get(g)!;
      let sx = 0, sz = 0;
      for (const s of a) { sx += s.x; sz += s.z; }
      return Math.hypot(sx / a.length - px, sz / a.length - pz);
    };
    order = [...groups.keys()].filter((g) => g !== 'dienMau').sort((a, b) => dist(a) - dist(b));
  }
  for (const g of order) {
    const cand = (groups.get(g) ?? []).filter((st) => !seatTaken(st));
    if (!cand.length) continue;
    const dEu = (st: SeatT) => Math.hypot(st.x - px, st.z - pz);
    cand.sort((a, b) => dEu(a) - dEu(b));
    for (const st of cand) if (pathfinder.segmentClear(px, pz, st.x, st.z)) return st;
    let best = cand[0], bl = Infinity;
    for (const st of cand.slice(0, 12)) {
      const l = routeLength(px, pz, st.x, st.z);
      if (l < bl) { bl = l; best = st; }
    }
    return best;
  }
  return null;
}

/** Chỗ ngồi trống gần nhất trên toàn sân (bỏ giới hạn 3.2m của setSitting). */
function nearestFreeSeat(limit = Infinity): { x: number; z: number; ry: number } | null {
  if (!me) return null;
  if (limit === Infinity) return pickBowSeat();
  const root = me.char.root;
  let best: { x: number; z: number; ry: number } | null = null, bd = limit;
  for (const st of world.seats) {
    const d = Math.hypot(st.x - root.position.x, st.z - root.position.z);
    if (d >= bd) continue;
    if (st.rest && limit === Infinity) continue;
    let taken = false;
    remotes.forEach((r, id) => { if (id !== myId && !r.data.npc && Math.hypot(r.target.x - st.x, r.target.z - st.z) < 0.6) taken = true; });
    if (!taken) { best = st; bd = d; }
  }
  return best;
}

function setSitting(v: boolean) {
  if (v && !sitting && me) {
    const root = me.char.root;
    const best = nearestFreeSeat(3.2);
    if (best) { root.position.set(best.x, world.groundY(best.x, best.z), best.z); me.ry = best.ry; }
  }
  sitting = v;
  $('sitBtn').classList.toggle('on', v);
}
const actionMs = (kind: ActionKind) => (kind === 'bow' ? BOW_MS : kind === 'palms' ? 1500 : kind === 'beads' ? 2400 : 2500);
const cooling: Partial<Record<ActionKind, number>> = {};
function startCooldown(kind: ActionKind) {
  const ms = ACTION_RULES[kind].cooldownMs;
  cooling[kind] = performance.now() + ms;
  document.querySelectorAll<HTMLElement>(`#actions [data-act="${kind}"]`).forEach((b) => {
    const cd = b.querySelector<HTMLElement>('.cd');
    b.classList.add('cooling');
    if (cd) { cd.style.transition = 'none'; cd.style.height = '100%'; void cd.offsetHeight; cd.style.transition = `height ${ms}ms linear`; cd.style.height = '0'; }
    setTimeout(() => b.classList.remove('cooling'), ms);
  });
}
function doAction(kind: ActionKind, wish?: string, keepSeat = false): boolean {
  if (!me || !socket) return false;
  if (kind !== 'bow') bowSeat = null;
  if (performance.now() < (cooling[kind] ?? 0)) return false;
  audio.unlock();
  if (kind !== 'palms' && kind !== 'beads') audio.play(kind);
  startCooldown(kind);
  if (kind === 'bow' || kind === 'chant') world.spawnBurst(me.char.root.position.x, me.char.root.position.z, 0xffe9a0);
  if (!keepSeat) setSitting(false);
  me.anim = kind;
  myActionUntil = performance.now() + actionMs(kind);
  clickTarget = null;
  socket.emit('action', kind, wish);
  if (kind === 'incense') world.spawnIncense(me.char.root.position.x, me.char.root.position.z);
  return true;
}

/**
 * Lạy Phật: tự đi bộ tới bồ đoàn trống gần nhất (toàn sân), tới nơi thì ngồi
 * xuống rồi lạy. Không còn chỗ trống → lạy tại chỗ như cũ.
 */
function startBow() {
  if (!me || !socket) return;
  if (sitting) { doAction('bow'); return; }             // đang ngồi sẵn: lạy luôn
  const seat = nearestFreeSeat();
  if (!seat) { doAction('bow'); return; }
  const root = me.char.root;
  if (Math.hypot(seat.x - root.position.x, seat.z - root.position.z) < 0.5) {
    root.position.set(seat.x, world.groundY(seat.x, seat.z), seat.z);
    setSitting(true);
    doAction('bow');
    return;
  }
  bowSeat = { x: seat.x, z: seat.z };
  bowDirect = shouldWalkDirect(root.position.x, root.position.z, seat.x, seat.z);
  clickTarget = new THREE.Vector3(seat.x, 0, seat.z);
  toast('Đang tới bồ đoàn gần nhất...');
}
document.querySelectorAll<HTMLButtonElement>('#actions [data-act]').forEach((b) => (b.onclick = () => {
  const kind = b.dataset.act as ActionKind;
  if (kind === 'bow') startBow();
  else if (kind === 'chant') openPanel('chant', panelCtx());
  else doAction(kind);
}));
$('sitBtn').onclick = () => { clickTarget = null; bowSeat = null; setSitting(!sitting); if (sitting) toast('Thiền định... công đức được cộng mỗi 10 giây'); };
$('lanternBtn').onclick = () => { $('wishModal').hidden = false; $<HTMLTextAreaElement>('wishText').focus(); };
$('wishCancel').onclick = () => ($('wishModal').hidden = true);
$('wishOk').onclick = () => {
  const t = $<HTMLTextAreaElement>('wishText');
  doAction('lantern', t.value);
  t.value = '';
  $('wishModal').hidden = true;
  toast('Đèn nguyện đã được thả');
};
// On mobile there is no sidebar for lantern feed; expose wish via chat toggle button row
if (isTouch) {
  const b = document.createElement('button');
  b.className = 'act';
  b.innerHTML = `<span class="ico">${iconSvg('lantern')}</span><span class="lb">Đèn</span>`;
  b.onclick = $('lanternBtn').onclick;
  $('actions').appendChild(b);
}

// ---------- Loop ----------
const clock = new THREE.Clock();
let lastSend = 0;
const tmp = new THREE.Vector3();

let pathQueue: THREE.Vector3[] = [];
let pathTarget: THREE.Vector3 | null = null;

const ACCEL_S = 0.25, DECEL_S = 0.25, WALK_SPEED = 3.8, RUN_SPEED = 7, ARRIVE_DIST = 1.5;
const STRIDE_M = WALK_SPEED * 1.24;
let curSpeed = 0, gaitPhase = 0;
const moveDir = new THREE.Vector3(0, 0, 1);
function rampSpeed(target: number, dt: number) {
  const rate = (target > curSpeed ? RUN_SPEED / ACCEL_S : RUN_SPEED / DECEL_S) * dt;
  curSpeed = target > curSpeed ? Math.min(target, curSpeed + rate) : Math.max(target, curSpeed - rate);
  if (curSpeed < 0.02 && target === 0) curSpeed = 0;
}

const prevPos = { x: 0, z: 0 };
function collide(pos: THREE.Vector3) {
  const onDeck = resolveBridge(pos, prevPos);
  for (const c of world.colliders) {
    const w = c as typeof c & { x2?: number; z2?: number };
    let cx = c.x, cz = c.z;
    if (w.x2 !== undefined && w.z2 !== undefined) {
      const sx = w.x2 - c.x, sz = w.z2 - c.z;
      const t = Math.max(0, Math.min(1, ((pos.x - c.x) * sx + (pos.z - c.z) * sz) / (sx * sx + sz * sz)));
      cx = c.x + sx * t; cz = c.z + sz * t;
    }
    const dx = pos.x - cx, dz = pos.z - cz;
    const d = Math.hypot(dx, dz), min = c.r + 0.4;
    if (d < min && d > 0.0001) { pos.x = cx + (dx / d) * min; pos.z = cz + (dz / d) * min; }
  }
  world.resolveWater(pos, onDeck);
  clampToCompound(pos);
  pos.x = Math.max(-MAP_HALF, Math.min(MAP_HALF, pos.x));
  pos.z = Math.max(MAP_Z_MIN, Math.min(MAP_HALF, pos.z));
  prevPos.x = pos.x; prevPos.z = pos.z;
}

const teacherBtn = $('teacherBtn');
teacherBtn.onclick = () => openPanel('teacher', panelCtx());
function updateTeacherBtn() {
  const abbot = remotes.get('npc1');
  const near = !!(me && abbot && abbot.char.root.visible && Math.hypot(abbot.char.root.position.x - me.char.root.position.x, abbot.char.root.position.z - me.char.root.position.z) < 3);
  if (teacherBtn.hidden === near) teacherBtn.hidden = !near;
}

const ALL_NPC_QUESTS = [...NPC_QUESTS, ...CHAIN_QUESTS];
const VENDOR_STALL: Record<string, string> = { npc15: 'stall_fruit', npc16: 'stall_cake', npc17: 'stall_tea', npc18: 'stall_incense' };
const VENDOR_GOODS: Record<string, string> = { npc15: 'hoa quả', npc16: 'bánh', npc17: 'trà', npc18: 'hoa' };

type TimeSlot = 'morning' | 'noon' | 'afternoon' | 'evening' | 'any';
function timeSlot(): TimeSlot {
  const hr = new Date().getHours();
  if (hr >= 5 && hr <= 10) return 'morning';
  if (hr >= 11 && hr <= 13) return 'noon';
  if (hr >= 14 && hr <= 17) return 'afternoon';
  if (hr >= 18 && hr <= 20) return 'evening';
  return 'any';
}
function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}
function pickLine(lines: { time: TimeSlot; text: string }[]): string {
  if (!lines || !lines.length) return '';
  const slot = timeSlot();
  let cand = lines.filter((l) => l.time === slot);
  if (!cand.length) cand = lines.filter((l) => l.time === 'any');
  if (!cand.length) cand = lines;
  return cand[dayOfYear() % cand.length].text;
}
function pickRot(list: string[]): string {
  if (!list || !list.length) return '';
  return list[dayOfYear() % list.length];
}
function questLinesFor(npcId: string, qid: string): { offer: string; reminder: string; done: string } {
  const dlg = DIALOGUES[npcId];
  const ql = dlg?.questLines?.[qid];
  if (ql) return ql;
  return { offer: dlg?.questOffer ?? '', reminder: dlg?.questReminder ?? '', done: dlg?.questDone ?? '' };
}
function npcQuests(npcId: string): QuestState[] {
  return quests.filter((q) => q.giver === npcId);
}
function questDef(qid: string) {
  return ALL_NPC_QUESTS.find((d) => d.id === qid);
}
function currentStep(q: QuestState): string | null {
  const def = questDef(q.id);
  const steps = def?.steps;
  if (!steps || !steps.length) return null;
  if (q.progress >= q.target) return null;
  return steps[Math.min(q.progress, steps.length - 1)] ?? null;
}

let dialogueNpc: string | null = null;
function openDialogue(npcId: string): void {
  const dlg = DIALOGUES[npcId];
  if (!dlg) return;
  const sock = socket;
  if (!sock) return;
  dialogueNpc = npcId;
  const failToast = (r: { ok: boolean; error?: string }) => { if (!r.ok) toast(r.error ?? 'Lỗi'); };
  openCustomPanel(dlg.name, (body: HTMLElement) => {
    body.appendChild(h('p', { class: 'hint' }, dlg.role));
    const greet = pickLine(dlg.greetings);
    if (greet) body.appendChild(h('p', {}, greet));

    const farewell = () => {
      const f = pickRot(dlg.farewell);
      if (f) body.appendChild(h('p', { class: 'hint' }, f));
    };

    // Chanting: short talk only, no quest / vendor blocks.
    if (remotes.get(npcId)?.data.anim === 'chant') {
      body.appendChild(h('p', {}, dlg.chanting ?? ''));
      farewell();
      return;
    }

    // Quest block: single most relevant quest.
    const qs = npcQuests(npcId);
    if (qs.length) {
      let pick: QuestState | undefined;
      let kind: 'claim' | 'deliver' | 'remind' | 'offer' | null = null;
      pick = qs.find((q) => q.progress >= q.target && !q.claimed);
      if (pick) kind = 'claim';
      if (!pick) {
        pick = qs.find((q) => q.accepted && !q.claimed && currentStep(q) === 'deliver' && questDef(q.id)?.receiver === npcId);
        if (pick) kind = 'deliver';
      }
      if (!pick) {
        pick = qs.find((q) => q.accepted && !q.claimed && q.progress < q.target);
        if (pick) kind = 'remind';
      }
      if (!pick) {
        pick = qs.find((q) => !q.accepted);
        if (pick) kind = 'offer';
      }
      if (pick && kind) {
        const lines = questLinesFor(npcId, pick.id);
        const q = pick;
        if (kind === 'claim') {
          const def = questDef(q.id);
          body.appendChild(h('p', {}, lines.done));
          body.appendChild(h('div', { class: 'qrow' },
            h('button', {
              onclick: () => { sock.emit('quest:claim', q.id); },
            }, `Nhận thưởng +${def?.coins ?? 0} xu · +${def?.merit ?? 0} công đức`)));
        } else if (kind === 'deliver') {
          body.appendChild(h('p', {}, lines.done));
          body.appendChild(h('div', { class: 'qrow' },
            h('button', {
              onclick: () => { sock.emit('quest:deliver', q.id, failToast); },
            }, 'Đưa đồ')));
        } else if (kind === 'remind') {
          body.appendChild(h('p', {}, lines.reminder));
        } else {
          body.appendChild(h('p', {}, lines.offer));
          body.appendChild(h('div', { class: 'qrow' },
            h('button', {
              onclick: () => { sock.emit('quest:accept', q.id, failToast); },
            }, 'Nhận việc')));
        }
        if (qs.length > 1) {
          body.appendChild(h('small', { class: 'hint' }, 'Người này còn việc khác — làm xong việc này rồi quay lại nhé.'));
        }
      }
    }

    // Vendor block.
    const stall = VENDOR_STALL[npcId];
    if (stall) {
      body.appendChild(h('p', {}, dlg.shopGreeting ?? ''));
      body.appendChild(h('div', { class: 'qrow' },
        h('button', {
          onclick: () => {
            sock.emit('market:buy', stall, (r: { ok: boolean; error?: string }) => {
              if (!r.ok) toast(r.error ?? 'Lỗi'); else toast('Đã mua');
            });
          },
        }, `Mua ${VENDOR_GOODS[npcId]} · 10 xu`)));
    }
    if (npcId === 'npc6') {
      body.appendChild(h('div', { class: 'qrow' }, h('button', {
        onclick: () => { dialogueNpc = null; openDonatePanel(panelCtx()); },
      }, '🙏 Đóng góp công đức')));
    }
    if (npcId === 'npc30') {
      body.appendChild(h('p', {}, dlg.shopGreeting ?? ''));
      body.appendChild(h('div', { class: 'qrow' },
        h('button', {
          onclick: () => {
            sock.emit('shop:buy', 'chim_phong_sinh', (r: { ok: boolean; error?: string }) => {
              if (!r.ok) toast(r.error ?? 'Lỗi'); else toast('Đã mua Chim phóng sinh');
            });
          },
        }, 'Mua Chim phóng sinh · 20 xu'),
        h('button', {
          onclick: () => {
            sock.emit('shop:buy', 'ca_phong_sinh', (r: { ok: boolean; error?: string }) => {
              if (!r.ok) toast(r.error ?? 'Lỗi'); else toast('Đã mua Cá phóng sinh');
            });
          },
        }, 'Mua Cá phóng sinh · 10 xu')));
    }

    const st = pickRot(dlg.smallTalk);
    if (st) body.appendChild(h('p', {}, st));
    farewell();

    if (npcId === 'npc1') {
      body.appendChild(h('div', { class: 'qrow' }, h('button', {
        onclick: () => { dialogueNpc = null; openPanel('teacher', panelCtx()); },
      }, '📖 Về chùa Online')));
    }
  });
}

const talkBtn = $('talkBtn');
talkBtn.onclick = () => { const n = nearestTalkNpc(); if (n) openDialogue(n); };
const donorBtn = $('donorBtn');
donorBtn.onclick = () => openDonorsPanel(panelCtx());
// quest tracker: styled once here (no CSS file change); display is driven by updateTracker().
const questTrackerEl = $('questTracker');
questTrackerEl.hidden = false;
let guideFeedX = 0, guideFeedZ = 0, guideFeedPX = 0, guideFeedPZ = 0, guideFeedN = 0;
let guideRefreshT = 0, guideStillT = 0, guideStuckN = 0, guideMoveX = 0, guideMoveZ = 0;
function guideGiveUp() {
  if (guideWaypoints.length > 1) guideWaypoints.shift();
  else { stopGuide(); toast('Không tới được, thử đi bộ tới gần hơn'); }
  guideFeedN = 0;
}
questTrackerEl.style.cssText = 'display:none;position:fixed;left:50%;top:12px;transform:translateX(-50%);align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:rgba(20,14,6,.72);color:#ffe9a8;font-weight:700;font-size:14px;cursor:pointer;z-index:30;backdrop-filter:blur(6px);border:1px solid rgba(255,214,90,.5);user-select:none;-webkit-user-select:none;';
(questTrackerEl.querySelector('.qt-arrow') as HTMLElement).style.display = 'inline-block';
questTrackerEl.onclick = () => { if (guideQuestId) { updateGuideTarget(); updateGuidePath(); } };
const trackerRefresh = questTrackerEl.onclick;
questTrackerEl.onclick = (e) => {
  if (guideQuestId) { clickTarget = null; pathTarget = null; pathQueue = []; guideFeedN = 0; guideStuckN = 0; }
  trackerRefresh?.call(questTrackerEl, e);
};
const DONOR_BOARD = { x: -7, z: 42 };
function nearestTalkNpc(): string | null {
  if (!me) return null;
  let best: string | null = null; let bestD = 2; // design: approach within ~2 m
  for (const [id, r] of remotes) {
    if (!r.data.npc || !r.char.root.visible || !DIALOGUES[id]) continue;
    const d = Math.hypot(r.char.root.position.x - me.char.root.position.x, r.char.root.position.z - me.char.root.position.z);
    if (d < bestD) { bestD = d; best = id; }
  }
  return best;
}
function updateTalkBtn() {
  const n = nearestTalkNpc();
  if (!n) {
    if (!talkBtn.hidden) talkBtn.hidden = true;
    return;
  }
  if (talkBtn.hidden) talkBtn.hidden = false;
  const lb = talkBtn.querySelector('.lb')!;
  const label = 'Nói chuyện';
  if (lb.textContent !== label) lb.textContent = label;
}
function myPos(): Pt | null {
  return me ? { x: me.char.root.position.x, z: me.char.root.position.z } : null;
}

const animalBtn = $('animalBtn') as HTMLButtonElement;
let animalAct: { event: 'feed' | 'find'; id: string } | null = null;
animalBtn.addEventListener('click', () => {
  const a = animalAct;
  if (!a || !socket) return;
  socket.emit(
    a.event === 'feed' ? 'quest:feed' : 'quest:find',
    { animalId: a.id },
    (r: { ok: boolean; error?: string }) => { if (!r.ok) toast(r.error ?? 'Lỗi'); },
  );
});

function updateAnimalBtn() {
  const p = myPos();
  let act: { event: 'feed' | 'find'; id: string } | null = null;
  if (p) {
    for (const q of quests) {
      if (q.claimed || q.progress >= q.target) continue;
      const step = currentStep(q);
      const a = step === 'feed' ? nearestFeedable(p) : step === 'find' ? lostAnimal() : null;
      if (a && Math.hypot(a.x - p.x, a.z - p.z) <= 2) {
        act = { event: step === 'feed' ? 'feed' : 'find', id: a.id };
        break;
      }
    }
  }
  animalAct = act;
  if (!act) { if (!animalBtn.hidden) animalBtn.hidden = true; return; }
  if (animalBtn.hidden) animalBtn.hidden = false;
  const lb = animalBtn.querySelector('.lb')!;
  const label = act.event === 'feed' ? 'Cho ăn' : 'Tìm thấy';
  if (lb.textContent !== label) lb.textContent = label;
}

function updateDonorBtn() {
  if (!me) { if (!donorBtn.hidden) donorBtn.hidden = true; return; }
  const d = Math.hypot(DONOR_BOARD.x - me.char.root.position.x, DONOR_BOARD.z - me.char.root.position.z);
  if (d > 3.5) { if (!donorBtn.hidden) donorBtn.hidden = true; return; }
  if (donorBtn.hidden) donorBtn.hidden = false;
  const lb = donorBtn.querySelector('.lb')!;
  if (lb.textContent !== 'Bảng vinh danh') lb.textContent = 'Bảng vinh danh';
}

function npcPos(id: string | undefined): Pt | null {
  const r = id ? remotes.get(id) : undefined;
  return r ? { x: r.char.root.position.x, z: r.char.root.position.z } : null;
}
function zoneCenter(zone: QuestZone | undefined): Pt | null {
  if (!zone) return null;
  if ('r' in zone) return { x: zone.x, z: zone.z };
  return { x: (zone.x0 + zone.x1) / 2, z: (zone.z0 + zone.z1) / 2 };
}
function questTarget(q: QuestState): Pt | null {
  const def = questDef(q.id);
  if (!def) return null;
  // Finished and unclaimed: return to the giver to claim.
  if (q.progress >= q.target && !q.claimed) return npcPos(q.giver);
  // Sweep: next un-swept point (progress counts swept points).
  if (def.event === 'sweep') return def.points?.[q.progress] ?? zoneCenter(def.zone);
  if (def.steps) {
    const step = currentStep(q);
    if (step === 'talk') return npcPos(q.giver);
    if (step === 'deliver') return npcPos(def.receiver);
    if (step === 'marketbuy') { const s = MARKET_STALLS.find((x) => x.id === def.stall); return s ? { x: s.x, z: s.z } : null; }
    if (step === 'visit') return zoneCenter(def.zone);
    if (step === 'buyphongsinh') { const s = MARKET_STALLS.find((x) => x.id === def.stall); return s ? { x: s.x, z: s.z } : null; }
    if (step === 'release') return zoneCenter(def.zone);
    if (step === 'feed') { const p = myPos(); const a = p ? nearestFeedable(p) : null; return a ? { x: a.x, z: a.z } : null; }
    if (step === 'find') { const a = lostAnimal(); return a ? { x: a.x, z: a.z } : null; }
    return zoneCenter(def.zone);
  }
  if (def.event === 'talk') return npcPos(q.giver); // Q10 bell
  return zoneCenter(def.zone); // Q7/Q8/Q9/Q15/Q21 worship at a zone
}
function startGuide(qid: string): void {
  guideQuestId = qid;
  clickTarget = null; pathTarget = null; pathQueue = []; guideFeedN = 0; guideStuckN = 0;
  updateGuideTarget();
  updateGuidePath();
  updateTracker();
}
function stopGuide(): void {
  guideQuestId = null;
  guideTarget = null;
  guideWaypoints = [];
  guideGroup.visible = false;
  clickTarget = null;
  pathTarget = null;
  pathQueue = [];
  const qt = document.getElementById('questTracker') as HTMLElement | null;
  if (qt) qt.style.display = 'none';
}
function updateGuideTarget(): void {
  if (!guideQuestId) return;
  const q = quests.find((x) => x.id === guideQuestId);
  if (!q || q.claimed) { stopGuide(); return; }
  const t = questTarget(q);
  if (!t) { stopGuide(); return; }
  guideTarget = t;
}
function guideStep(): string | null {
  const q = quests.find((x) => x.id === guideQuestId);
  return q ? currentStep(q) : null;
}

function updateGuidePath(): void {
  if (guideStep() === 'find') { guideGroup.visible = false; guideWaypoints = []; return; }
  if (!guideTarget || !me) { guideGroup.visible = false; return; }
  const p = me.char.root.position;
  const from = { x: p.x, z: p.z };
  let pts = routeFrom(from, nearestNode(guideTarget));
  if (!pts.length) pts = [from, guideTarget];
  else pts = [...pts, guideTarget];
  // Cap the discs at 40: if the route is longer, take every Nth waypoint.
  const step = Math.max(1, Math.ceil(pts.length / 40));
  const sampled = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
  guideGroup.clear();
  const linePts = sampled.map((w) => new THREE.Vector3(w.x, world.groundY(w.x, w.z) + 0.08, w.z));
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffd65a, transparent: true, opacity: 0.9 }));
  guideGroup.add(line);
  const discGeo = new THREE.CircleGeometry(0.35, 12);
  const discMat = new THREE.MeshBasicMaterial({ color: 0xffd65a, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false });
  for (const w of sampled) {
    const d = new THREE.Mesh(discGeo, discMat);
    d.rotation.x = -Math.PI / 2;
    d.position.set(w.x, world.groundY(w.x, w.z) + 0.06, w.z);
    guideGroup.add(d);
  }
  guideWaypoints = sampled;
  guideGroup.visible = true;
}
function updateTracker(): void {
  const qt = document.getElementById('questTracker') as HTMLElement | null;
  if (!qt) return;
  if (!guideTarget || !me || !guideQuestId) { qt.style.display = 'none'; return; }
  const q = quests.find((x) => x.id === guideQuestId);
  if (!q) { qt.style.display = 'none'; return; }
  const p = me.char.root.position;
  const dx = guideTarget.x - p.x, dz = guideTarget.z - p.z;
  const d = Math.hypot(dx, dz);
  if (d < 1.5) { stopGuide(); return; }
  qt.style.display = 'flex';
  const label = qt.querySelector('.qt-label');
  const dist = qt.querySelector('.qt-dist');
  const arrow = qt.querySelector('.qt-arrow') as HTMLElement | null;
  if (label) label.textContent = q.label;
  if (dist) dist.textContent = `${Math.round(d)} m`;
  if (arrow) {
    // Camera looks along (-sin(camYaw), -cos(camYaw)); screen-right is
    // (cos(camYaw), -sin(camYaw)). Arrow points up at rotate(0).
    const rot = Math.atan2(dx * Math.cos(camYaw) - dz * Math.sin(camYaw), -dx * Math.sin(camYaw) - dz * Math.cos(camYaw));
    arrow.style.transform = `rotate(${rot}rad)`;
  }
}

function updateSweep(now: number): void {
  if (!me || !socket) return;
  // Finish a sweep in progress: report the swept point to the server.
  if (sweepState) {
    if (now >= sweepState.until) {
      const s = sweepState;
      sweepState = null;
      lastSwept = { qid: s.qid, x: s.point.x, z: s.point.z };
      socket.emit('quest:sweep', { qid: s.qid, point: s.point }, (r: { ok: boolean; error?: string }) => {
        if (!r.ok) { lastSwept = null; toast(r.error ?? 'Lỗi'); }
      });
    }
    return;
  }
  // Throttle the arrival check to twice a second.
  if (now - lastSweepCheck < 500) return;
  lastSweepCheck = now;
  if (sitting || clickTarget) return;
  const p = me.char.root.position;
  for (const q of quests) {
    if (!q.accepted || q.claimed || q.progress >= q.target) continue;
    const def = questDef(q.id);
    if (!def || def.event !== 'sweep' || !def.points?.length) continue;
    const pt = def.points[q.progress];
    if (!pt) continue;
    if (lastSwept && q.id === lastSwept.qid && pt.x === lastSwept.x && pt.z === lastSwept.z) continue;
    if (Math.hypot(pt.x - p.x, pt.z - p.z) < 1.5) {
      clickTarget = null;
      me.anim = 'sweep';
      myActionUntil = now + 3000;
      sweepState = { qid: q.id, point: pt, until: now + 3000 };
      toast('Đang quét...');
      return;
    }
  }
}

function makeMarkerTex(ch: '!' | '?', color: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d')!;
  g.font = 'bold 44px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 6;
  g.strokeStyle = '#2a1f10';
  g.strokeText(ch, 32, 34);
  g.fillStyle = color;
  g.fillText(ch, 32, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const markerTex: Record<'!' | '?', THREE.CanvasTexture> = {
  '!': makeMarkerTex('!', '#ffd65a'),
  '?': makeMarkerTex('?', '#7dd87d'),
};
const markerSprites = new Map<string, THREE.Sprite>();
function markerFor(npcId: string): '!' | '?' | null {
  const r = remotes.get(npcId);
  if (!r || !r.data.npc || r.data.anim === 'chant') return null; // NO '!' while chanting
  const qs = npcQuests(npcId);
  if (qs.some((q) => q.progress >= q.target && !q.claimed)) return '?';
  if (qs.some((q) => { const d = questDef(q.id); return q.accepted && !q.claimed && currentStep(q) === 'deliver' && d?.receiver === npcId; })) return '?';
  if (qs.some((q) => !q.accepted)) return '!';
  return null;
}
function updateNpcMarkers() {
  for (const [id, r] of remotes) {
    if (!r.data.npc) continue;
    const m = markerFor(id);
    const spr = markerSprites.get(id);
    if (!m) { if (spr) spr.visible = false; continue; }
    let s = spr;
    if (!s) {
      s = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTex[m], transparent: true, depthTest: false }));
      s.scale.set(0.55, 0.55, 1);
      world.scene.add(s);
      markerSprites.set(id, s);
    }
    const mat = s.material as THREE.SpriteMaterial;
    if (mat.map !== markerTex[m]) { mat.map = markerTex[m]; mat.needsUpdate = true; }
    s.visible = r.char.root.visible;
    s.position.set(r.char.root.position.x, r.char.root.position.y + 2.6, r.char.root.position.z);
  }
}

function releasePhongSinh(): void {
  if (!socket) return;
  const inv = profile?.inventory ?? {};
  const kind = (inv['chim_phong_sinh'] ?? 0) > 0 ? 'bird' : (inv['ca_phong_sinh'] ?? 0) > 0 ? 'fish' : null;
  if (!kind) { toast('Bạn chưa có chim hay cá phóng sinh'); return; }
  socket.emit('release:phongsinh', { kind }, (r: { ok: boolean; error?: string; merit?: number }) => {
    if (!r.ok) toast(r.error ?? 'Lỗi');
    else { toast(`Đã phóng sinh, +${r.merit ?? 0} công đức`); audio.play('lantern'); }
  });
}

const zoneBtn = $('zoneBtn');
const ZONE_ACTIONS: Record<string, { label: string; run: () => void }> = {
  chuong: { label: 'Đánh chuông', run: () => { world.ringBell(); audio.play('bow'); } },
  trong: { label: 'Đánh trống', run: () => { world.ringDrum(); audio.play('bow'); } },
  thuyDinh: { label: 'Thả đèn nguyện', run: () => { $('wishModal').hidden = false; $<HTMLTextAreaElement>('wishText').focus(); } },
  phongSinh: { label: 'Phóng sinh', run: () => releasePhongSinh() },
};
let zoneBtnId = '';
zoneBtn.onclick = () => ZONE_ACTIONS[zoneBtnId]?.run();
function updateZoneBtn() {
  const id = me ? world.zoneAt(me.char.root.position.x, me.char.root.position.z) : null;
  let key = id && ZONE_ACTIONS[id] ? id : '';
  if (key === 'phongSinh' && (profile?.inventory?.['chim_phong_sinh'] ?? 0) <= 0 && (profile?.inventory?.['ca_phong_sinh'] ?? 0) <= 0) key = '';
  if (key === zoneBtnId) return;
  zoneBtnId = key;
  zoneBtn.hidden = !key;
  if (key) zoneBtn.querySelector('.lb')!.textContent = ZONE_ACTIONS[key].label;
}

function hideCouplet() { $('couplet').classList.remove('show'); }
function updateCouplet() {
  if (!me) return;
  if (!settings.showCouplets) return;
  const id = world.zoneAt(me.char.root.position.x, me.char.root.position.z);
  if (id === curZone) return;
  curZone = id;
  const c = id ? COUPLETS[id] : null;
  if (!c || dismissed.has(c.id)) { hideCouplet(); return; }
  const el = $('couplet');
  el.replaceChildren();
  const mk = (tag: string, cls: string, text: string) => { const n = document.createElement(tag); if (cls) n.className = cls; n.textContent = text; return n; };
  const close = mk('button', 'cclose', '×');
  close.setAttribute('aria-label', 'Tắt bảng giải nghĩa');
  close.onclick = () => { dismissed.add(c.id); hideCouplet(); };
  el.append(close, mk('small', '', c.where), mk('p', '', c.am.join(' / ')), mk('em', '', c.nghia));
  el.classList.add('show');
}

const releaseAnims: { g: THREE.Group; t: number; kind: 'bird' | 'fish'; x0: number; z0: number }[] = [];

function startReleaseAnim(x: number, z: number, kind: 'bird' | 'fish') {
  const g = new THREE.Group();
  if (kind === 'bird') {
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xe8c84a }),
    );
    g.add(body);
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.name = side < 0 ? 'wingL' : 'wingR';
      const wing = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.12),
        new THREE.MeshBasicMaterial({ color: 0xf2dc78, side: THREE.DoubleSide }),
      );
      wing.rotation.x = -Math.PI / 2;
      wing.position.x = side * 0.15;
      pivot.add(wing);
      g.add(pivot);
    }
    g.position.set(x, 1.2, z);
  } else {
    g.add(createKoi('kohaku', 0.8).root);
    g.position.set(x, 0.3, z);
  }
  world.scene.add(g);
  releaseAnims.push({ g, t: 0, kind, x0: x, z0: z });
}

function updateReleaseAnims(dt: number) {
  for (let i = releaseAnims.length - 1; i >= 0; i--) {
    const a = releaseAnims[i];
    a.t += dt;
    let done = false;
    if (a.kind === 'bird') {
      a.g.position.set(
        a.x0 + Math.cos(a.t * 2) * a.t * 1.5,
        1.2 + a.t * 2,
        a.z0 + Math.sin(a.t * 2) * a.t * 1.5,
      );
      const flap = Math.sin(a.t * 18) * 0.7;
      const wl = a.g.getObjectByName('wingL');
      const wr = a.g.getObjectByName('wingR');
      if (wl) wl.rotation.z = flap;
      if (wr) wr.rotation.z = -flap;
      if (a.t > 3.5) {
        const opacity = Math.max(0, 1 - (a.t - 3.5));
        a.g.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.Material | undefined;
          if (m) {
            m.transparent = true;
            m.opacity = opacity;
          }
        });
        if (a.t >= 4.5) done = true;
      }
    } else {
      const k = Math.min(a.t / 1.2, 1);
      a.g.position.set(
        a.x0 + (38 - a.x0) * k,
        0.3 + Math.sin(Math.PI * k) * 2,
        a.z0 + (-31 - a.z0) * k,
      );
      if (a.t >= 1.2) {
        world.spawnBurst(38, -31, 0x6ab8d8);
        done = true;
      }
    }
    if (done) {
      world.scene.remove(a.g);
      if (a.kind === 'bird') {
        a.g.traverse((o) => {
          const m = o as THREE.Mesh;
          m.geometry?.dispose();
          (m.material as THREE.Material | undefined)?.dispose();
        });
      }
      releaseAnims.splice(i, 1);
    }
  }
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;
  const now = performance.now();

  if (!me) {
    // login / connecting backdrop: slow cinematic orbit around the plaza
    const a = t * 0.07;
    camera.position.set(Math.sin(a) * 22, 8, -2 + Math.cos(a) * 22);
    camera.lookAt(0, 3.5, -12);
  }
  if (me && socket) {
    const root = me.char.root;
    let ix = joy.x, iz = joy.y;
    if (!freeCam) {
      if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    }
    const mag = Math.min(1, Math.hypot(ix, iz));
    const running = keys.has('ShiftLeft') || keys.has('ShiftRight') || (joy.id !== -1 && mag > 0.85);
    const speed = running ? RUN_SPEED : WALK_SPEED;
    let moving = false;
    let targetSpeed = 0;

    // guide watchdog: refresh a moving NPC target every 2 s; unstick a clickTarget that makes no progress
    if (guideQuestId && guideTarget && me) {
      const p = me.char.root.position;
      guideRefreshT += dt;
      if (guideRefreshT >= 2) {
        guideRefreshT = 0;
        const ox = guideTarget.x, oz = guideTarget.z;
        updateGuideTarget();
        if (guideTarget && Math.hypot(guideTarget.x - ox, guideTarget.z - oz) > 1) updateGuidePath();
      }
      if (!clickTarget || Math.hypot(p.x - guideMoveX, p.z - guideMoveZ) > 0.3) { guideMoveX = p.x; guideMoveZ = p.z; guideStillT = 0; if (clickTarget) guideStuckN = 0; }
      else if ((guideStillT += dt) > 3) {
        guideStillT = 0;
        clickTarget = null; pathTarget = null; pathQueue = [];
        if (++guideStuckN < 2) updateGuidePath();
        else { guideStuckN = 0; guideGiveUp(); }
      }
    }
    // quest auto-walk: feed the next road waypoint as clickTarget
    if (guideQuestId && guideTarget && me && !clickTarget && !sitting && guideStep() !== 'find') {
      const p = me.char.root.position;
      const d = Math.hypot(guideTarget.x - p.x, guideTarget.z - p.z);
      if (d < 1.5) { stopGuide(); }
      else {
        const wp = guideWaypoints.length ? guideWaypoints[0] : guideTarget;
        const wd = Math.hypot(wp.x - p.x, wp.z - p.z);
        if (wd < 1.2 && guideWaypoints.length > 1) guideWaypoints.shift();
        else {
          let fx = wp.x, fz = wp.z;
          if (guideWaypoints.length <= 1) { fx = guideTarget.x - (guideTarget.x - p.x) / d * 1.0; fz = guideTarget.z - (guideTarget.z - p.z) / d * 1.0; }
          if (Math.hypot(fx - guideFeedX, fz - guideFeedZ) < 0.3 && Math.hypot(p.x - guideFeedPX, p.z - guideFeedPZ) < 0.3) guideFeedN++;
          else { guideFeedX = fx; guideFeedZ = fz; guideFeedPX = p.x; guideFeedPZ = p.z; guideFeedN = 1; }
          if (guideFeedN >= 3) guideGiveUp();
          else clickTarget = new THREE.Vector3(fx, 0, fz);
        }
      }
    }

    if (mag > 0) {
      if (guideQuestId) stopGuide();
      clickTarget = null;
      bowSeat = null;                       // người chơi tự di chuyển → huỷ hành trình lạy
      setSitting(false);
      myActionUntil = 0;
      sweepState = null;
      const len = Math.hypot(ix, iz);
      const s = Math.sin(camYaw), c = Math.cos(camYaw);
      const dx = (ix * c + iz * s) / len, dz = (-ix * s + iz * c) / len;
      targetSpeed = speed * (joy.id !== -1 ? Math.max(0.5, mag) : 1);
      if (curSpeed > 0.5 && moveDir.x * dx + moveDir.z * dz < 0) targetSpeed = 0;
      else moveDir.set(dx, 0, dz);
      me.ry = Math.atan2(dx, dz);
      moving = true;
    } else if (clickTarget) {
      if (pathTarget !== clickTarget) { pathTarget = clickTarget; pathQueue = (bowSeat && bowDirect) ? [new THREE.Vector3(clickTarget.x, 0, clickTarget.z)] : pathfinder.findPath({ x: root.position.x, z: root.position.z }, { x: clickTarget.x, z: clickTarget.z }).map((p) => new THREE.Vector3(p.x, 0, p.z)); }
      const wp = pathQueue.length ? pathQueue[0] : clickTarget;
      tmp.copy(wp).sub(root.position);
      tmp.y = 0;
      const wpDist = tmp.length();
      const arrived = wpDist < 0.2 || (pathQueue.length <= 1 && wpDist < (guideQuestId ? 0.25 : 0.9) && (curSpeed < 1.6 || tmp.x * moveDir.x + tmp.z * moveDir.z < 0));
      if (wpDist < 0.3 && pathQueue.length > 1) { pathQueue.shift(); }
      else if (arrived && bowSeat && pathfinder.lastFallback && (wp.x !== clickTarget.x || wp.z !== clickTarget.z) && Math.hypot(clickTarget.x - root.position.x, clickTarget.z - root.position.z) > 1.2) {
        pathQueue = [clickTarget.clone()];   // đường vòng cụt: đi thẳng tới đệm, collide() trượt dọc tường
      }
      else if (arrived) { clickTarget = null; pathTarget = null; pathQueue = []; }
      else {
        tmp.normalize();
        let remain = wpDist;
        for (let i = 1; i < pathQueue.length; i++) remain += Math.hypot(pathQueue[i].x - pathQueue[i - 1].x, pathQueue[i].z - pathQueue[i - 1].z);
        targetSpeed = speed * Math.min(1, Math.max(0.12, remain / ARRIVE_DIST));
        if (curSpeed > 0.5 && moveDir.x * tmp.x + moveDir.z * tmp.z < 0) targetSpeed = 0;
        else moveDir.copy(tmp);
        me.ry = Math.atan2(tmp.x, tmp.z);
        moving = true;
      }
    }
    rampSpeed(targetSpeed, dt);
    if (curSpeed > 0) {
      root.position.x += moveDir.x * curSpeed * dt;
      root.position.z += moveDir.z * curSpeed * dt;
      gaitPhase += (curSpeed * dt) / STRIDE_M;
      if (curSpeed > 0.05) moving = true;
    }
    me.char.gait = curSpeed > 0.05 ? gaitPhase : -1;
    if (bowSeat) {
      const d = Math.hypot(bowSeat.x - root.position.x, bowSeat.z - root.position.z);
      const stopped = !clickTarget; // đi bộ đã kết thúc
      if (d < 0.5 || (stopped && d < 1.2)) {
        root.position.set(bowSeat.x, world.groundY(bowSeat.x, bowSeat.z), bowSeat.z);
        clickTarget = null;
        moving = false;
        if (!sitting) setSitting(true);
        if (doAction('bow', undefined, true)) bowSeat = null;   // bị cooldown: giữ bowSeat, thử lại frame sau
      } else if (stopped) {
        // dừng xa bồ đoàn (đường bị chặn): không để bowSeat treo, lạy tại chỗ
        clickTarget = null;
        moving = false;
        if (doAction('bow', undefined, true)) bowSeat = null;
      }
    }
    if (moving) myActionUntil = 0;
    collide(root.position);
    root.position.y += (world.groundY(root.position.x, root.position.z) - root.position.y) * Math.min(1, dt * 14);
    me.anim = now < myActionUntil ? me.anim : sitting ? 'sit' : moving ? (running ? 'run' : 'walk') : 'idle';

    if (now - lastSend > 60) {
      lastSend = now;
      socket.volatile.emit('move', { x: root.position.x, z: root.position.z, ry: me.ry, anim: me.anim });
    }

    const camZone = world.zoneAt(root.position.x, root.position.z);
    const inPavilion = camZone !== null && PAVILION_ZONES.indexOf(camZone) >= 0;
    const houseCam = camZone !== null ? HOUSE_CAM[camZone] : undefined;
    pavF += ((inPavilion ? 1 : 0) - pavF) * Math.min(1, dt * 3);
    houseF += ((houseCam ? 1 : 0) - houseF) * Math.min(1, dt * 3);
    if (houseF > 0.5 && savedOutDist === null && houseCam) {
      savedOutDist = camDist;
      savedBump = houseCam.bump;
      if (camDist > houseCam.dist) camDist = houseCam.dist;
    } else if (houseF < 0.5 && savedOutDist !== null) {
      camDist = savedOutDist;
      savedOutDist = null;
      savedBump = null;
    }
    const effDist = camDist + pavF * 3.5;
    const effPitch = camPitch + pavF * 0.18 + houseF * (savedBump ?? 0);
    const cx = root.position.x + Math.sin(camYaw) * Math.cos(effPitch) * effDist;
    const cy = root.position.y + 1.4 + Math.sin(effPitch) * effDist;
    const cz = root.position.z + Math.cos(camYaw) * Math.cos(effPitch) * effDist;
    if (freeCam && profile?.admin) {
      const fs = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 40 : 14) * dt;
      const fx = -Math.sin(camYaw) * Math.cos(camPitch), fy = -Math.sin(camPitch), fz = -Math.cos(camYaw) * Math.cos(camPitch);
      const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
      if (keys.has('KeyW') || keys.has('ArrowUp')) freePos.x += fx * fs, freePos.y += fy * fs, freePos.z += fz * fs;
      if (keys.has('KeyS') || keys.has('ArrowDown')) freePos.x -= fx * fs, freePos.y -= fy * fs, freePos.z -= fz * fs;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) freePos.x -= rx * fs, freePos.z -= rz * fs;
      if (keys.has('KeyD') || keys.has('ArrowRight')) freePos.x += rx * fs, freePos.z += rz * fs;
      if (keys.has('KeyE') || keys.has('Space')) freePos.y += fs;
      if (keys.has('KeyQ')) freePos.y -= fs;
      freePos.y = Math.max(0.5, Math.min(250, freePos.y));
      camera.position.copy(freePos);
      camera.lookAt(freePos.x + fx * 10, freePos.y + fy * 10, freePos.z + fz * 10);
    } else if (!(import.meta.env.DEV && (window as any).__co?.freeze)) {
      camera.position.lerp(tmp.set(cx, cy, cz), 1 - Math.pow(0.001, dt));
      camera.lookAt(root.position.x, root.position.y + 1.3, root.position.z);
    }
  }

  remotes.forEach((r, id) => {
    if (id !== myId) {
      const px = r.char.root.position.x, pz = r.char.root.position.z;
      r.char.root.position.lerp(r.target, 1 - Math.pow(0.0005, dt));
      if (!r.data.npc && now > r.actionUntil && /^(bow|incense|chant|lantern|palms|beads)$/.test(r.anim)) r.anim = 'idle';
      if (r.data.npc) {
        // NPC đi bộ nhưng vị trí đứng yên quá 0.5 giây thì ép về idle để không trượt chân
        if (Math.hypot(r.char.root.position.x - px, r.char.root.position.z - pz) > 0.004 || r.lastMoveAt === undefined) r.lastMoveAt = now;
        if (r.anim === 'walk' && now - r.lastMoveAt > 500) r.anim = 'idle';
        if (id === 'npc4' && r.anim === 'ring' && (r.prevAnim !== 'ring' || now - (r.lastRingAt ?? 0) > 4000)) { r.lastRingAt = now; world.ringBell(); audio.play('bow'); }
        r.prevAnim = r.anim;
      }
    }
    let d = r.ry - r.char.root.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    r.char.root.rotation.y += d * Math.min(1, dt * 12);
    if (r.data.npc && id !== myId) {
      // LOD: NPCs farther than 30 m only refresh their pose twice a second (position / rotation still lerp every frame);
      // a still, far NPC also stops recomputing its world matrix. An anim change or coming back within range updates at once.
      const far = r.char.root.position.distanceToSquared(camera.position) > LOD_DIST * LOD_DIST;
      const still = r.char.root.position.distanceToSquared(r.target) < 4e-6 && Math.abs(d) < 2e-3;
      r.lodStill = far && still ? (r.lodStill ?? 0) + 1 : 0;
      r.char.root.matrixWorldAutoUpdate = r.lodStill < 3;
      if (far && r.anim === r.lodAnim && t - (r.lodAt ?? -9) < 0.5) return;
      r.lodAt = t; r.lodAnim = r.anim;
    }
    animateCharacter(r.char, r.anim, t);
  });

  if (t - lastDrum > 45) { lastDrum = t; if (me) { world.ringDrum(); audio.play('bow'); } }
  updateTeacherBtn();
  updateTalkBtn();
  updateDonorBtn();
  updateAnimalBtn();
  updateNpcMarkers();
  updateTracker();
  updateAnimals(latestAnimals, dt);
  updateSweep(now);
  updateZoneBtn();
  updateReleaseAnims(dt);
  updateCouplet();
  world.update(t, me ? me.char.root.position : focusIdle);
  post.render();
  if (!loadedHidden) {
    loadedHidden = true;
    prewarm();
    const l = $('loading');
    l.classList.add('done');
    setTimeout(() => l.remove(), 700);
  }
}
let lastDrum = 42;
const LOD_DIST = 30;
const focusIdle = new THREE.Vector3(0, 0, 8);
let loadedHidden = false;
requestAnimationFrame(loop);

if (import.meta.env.DEV) (window as any).__co = { walkTo: (x: number, z: number) => { setSitting(false); clickTarget = new THREE.Vector3(x, 0, z); }, me: () => me, remotes, world, camera, THREE, audio, openPanel, panelCtx: () => panelCtx(), quests: () => quests, pick: (o: Outfit) => { outfit = o; color = OUTFIT_COLOR[o]; buildPickers(); rebuildPreview(); }, pv: () => pChar, build: (o: Outfit) => buildCharacter(o, OUTFIT_COLOR[o], ''), anim: animateCharacter, pScene, pCam, pr, buildBuddha, buildQuanAm };
