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
import { closePanel, openPanel, panelOpen, refreshPanel } from './panels';
import { createPost } from './post';
import { createWorld } from './world';
import { buildBuddha, buildQuanAm } from './statues';
import { ACTION_RULES, ROOMS, type MeditationInfo, type QuestState } from '../shared/game';
import {
  MAP_HALF, OUTFIT_COLOR, levelOf, meritForLevel,
  type ActionKind, type Anim, type ChatMessage, type Lantern, type Outfit, type PlayerState, type Profile,
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
const world = createWorld();
const post = createPost(renderer, world.scene, camera, isTouch);
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
const freePos = new THREE.Vector3();
const camMaxDist = () => (profile?.admin ? 160 : 18);
const camMaxPitch = () => (profile?.admin ? 1.55 : 1.3);
let clickTarget: THREE.Vector3 | null = null;
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
  const b = document.createElement('b');
  b.textContent = m.name + ': ';
  p.append(b, document.createTextNode(m.text));
  box.appendChild(p);
  while (box.childElementCount > 80) box.firstElementChild!.remove();
  box.scrollTop = box.scrollHeight;
  if (m.sid && settings.showBubbles) remotes.get(m.sid)?.char.say(m.text);
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
  s.on('quests', (q: QuestState[]) => { quests = q; updateQuestDot(); refreshPanel(); });
  s.on('meditation', (m: MeditationInfo) => { meditation = m; updateMeditationHud(); });
  s.on('player:join', addPlayer);
  s.on('player:leave', (id: string) => {
    const r = remotes.get(id);
    if (r) { world.scene.remove(r.char.root); r.char.dispose(); }
    remotes.delete(id);
  });
  s.on('player:look', ({ id, accessory }: { id: string; accessory: string | null }) => remotes.get(id)?.char.setAccessory(accessory));
  s.on('state', (st: { online: number; players: Pick<PlayerState, 'id' | 'x' | 'z' | 'ry' | 'anim'>[] }) => {
    $('onlineN').textContent = String(st.online);
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
  s.on('player:action', ({ id, kind }: { id: string; kind: ActionKind }) => {
    const r = remotes.get(id);
    if (!r || id === myId) return;
    r.anim = kind;
    r.actionUntil = performance.now() + actionMs(kind);
    if (kind === 'incense') world.spawnIncense(r.char.root.position.x, r.char.root.position.z);
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
    goTo: (x, z) => { clickTarget = new THREE.Vector3(x, 0, z); setSitting(false); },
    changeLook, chatLog: () => chatLog,
    act: (kind) => doAction(kind),
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
    if (hit) { clickTarget = hit.point.clone(); setSitting(false); }
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
/** Điểm bồ đoàn đang trên đường tới để lạy (null = không có hành trình). */
let bowSeat: { x: number; z: number } | null = null;

/** Chỗ ngồi trống gần nhất trên toàn sân (bỏ giới hạn 3.2m của setSitting). */
function nearestFreeSeat(limit = Infinity): { x: number; z: number; ry: number } | null {
  if (!me) return null;
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
function doAction(kind: ActionKind, wish?: string, keepSeat = false) {
  if (!me || !socket) return;
  if (performance.now() < (cooling[kind] ?? 0)) return;
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
function segmentClear(ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz;
  for (const c of world.colliders) {
    const t = len2 < 1e-6 ? 0 : Math.max(0, Math.min(1, ((c.x - ax) * dx + (c.z - az) * dz) / len2));
    const px = ax + dx * t, pz = az + dz * t;
    if (Math.hypot(c.x - px, c.z - pz) < c.r + 0.4 + 0.15) return false;
  }
  return true;
}
function planPath(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
  if (segmentClear(from.x, from.z, to.x, to.z)) return [to.clone()];
  const nodes: { x: number; z: number }[] = [{ x: from.x, z: from.z }, { x: to.x, z: to.z }];
  const STEP = 1.2;
  for (const c of world.colliders) {
    if (c.r < 0.3) continue;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2, rr = c.r + 0.4 + 0.5;
      nodes.push({ x: c.x + Math.cos(a) * rr, z: c.z + Math.sin(a) * rr });
    }
  }
  for (let z = -62; z <= 44; z += 6) for (const x of [-6.5, 0, 6.5]) nodes.push({ x, z });
  const free = nodes.filter((n, i) => i < 2 || world.colliders.every((c) => Math.hypot(c.x - n.x, c.z - n.z) > c.r + 0.45));
  const N = free.length;
  const dist = new Array(N).fill(Infinity), prev = new Array(N).fill(-1), done = new Array(N).fill(false);
  dist[0] = 0;
  for (let it = 0; it < N; it++) {
    let u = -1;
    for (let i = 0; i < N; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity) break;
    done[u] = true;
    if (u === 1) break;
    for (let v = 0; v < N; v++) {
      if (done[v]) continue;
      const d = Math.hypot(free[u].x - free[v].x, free[u].z - free[v].z);
      if (d > 40 || d < STEP * 0.1) continue;
      if (dist[u] + d < dist[v] && segmentClear(free[u].x, free[u].z, free[v].x, free[v].z)) { dist[v] = dist[u] + d; prev[v] = u; }
    }
  }
  if (prev[1] < 0) return [to.clone()];
  const out: THREE.Vector3[] = [];
  for (let i = 1; i >= 0 && i !== -1; i = prev[i]) { if (i !== 0) out.unshift(new THREE.Vector3(free[i].x, 0, free[i].z)); if (prev[i] < 0) break; }
  return out.length ? out : [to.clone()];
}

const prevPos = { x: 0, z: 0 };
function collide(pos: THREE.Vector3) {
  const onDeck = resolveBridge(pos, prevPos);
  for (const c of world.colliders) {
    const dx = pos.x - c.x, dz = pos.z - c.z;
    const d = Math.hypot(dx, dz), min = c.r + 0.4;
    if (d < min && d > 0.0001) { pos.x = c.x + (dx / d) * min; pos.z = c.z + (dz / d) * min; }
  }
  world.resolveWater(pos, onDeck);
  clampToCompound(pos);
  pos.x = Math.max(-MAP_HALF, Math.min(MAP_HALF, pos.x));
  pos.z = Math.max(-MAP_HALF, Math.min(MAP_HALF, pos.z));
  prevPos.x = pos.x; prevPos.z = pos.z;
}

const teacherBtn = $('teacherBtn');
teacherBtn.onclick = () => openPanel('teacher', panelCtx());
function updateTeacherBtn() {
  const abbot = remotes.get('npc1');
  const near = !!(me && abbot && abbot.char.root.visible && Math.hypot(abbot.char.root.position.x - me.char.root.position.x, abbot.char.root.position.z - me.char.root.position.z) < 3);
  if (teacherBtn.hidden === near) teacherBtn.hidden = !near;
}

const zoneBtn = $('zoneBtn');
const ZONE_ACTIONS: Record<string, { label: string; run: () => void }> = {
  chuong: { label: 'Đánh chuông', run: () => { world.ringBell(); audio.play('bow'); } },
  trong: { label: 'Đánh trống', run: () => { world.ringDrum(); audio.play('bow'); } },
  thuyDinh: { label: 'Thả đèn nguyện', run: () => { $('wishModal').hidden = false; $<HTMLTextAreaElement>('wishText').focus(); } },
};
let zoneBtnId = '';
zoneBtn.onclick = () => ZONE_ACTIONS[zoneBtnId]?.run();
function updateZoneBtn() {
  const id = me ? world.zoneAt(me.char.root.position.x, me.char.root.position.z) : null;
  const key = id && ZONE_ACTIONS[id] ? id : '';
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
    const speed = running ? 7 : 3.8;
    let moving = false;

    if (mag > 0) {
      clickTarget = null;
      bowSeat = null;                       // người chơi tự di chuyển → huỷ hành trình lạy
      setSitting(false);
      myActionUntil = 0;
      const len = Math.hypot(ix, iz);
      const s = Math.sin(camYaw), c = Math.cos(camYaw);
      const dx = (ix * c + iz * s) / len, dz = (-ix * s + iz * c) / len;
      const sp = speed * (joy.id !== -1 ? Math.max(0.5, mag) : 1);
      root.position.x += dx * sp * dt;
      root.position.z += dz * sp * dt;
      me.ry = Math.atan2(dx, dz);
      moving = true;
    } else if (clickTarget) {
      if (pathTarget !== clickTarget) { pathTarget = clickTarget; pathQueue = planPath(root.position, clickTarget); }
      const wp = pathQueue.length ? pathQueue[0] : clickTarget;
      tmp.copy(wp).sub(root.position);
      tmp.y = 0;
      if (tmp.length() < 0.3 && pathQueue.length > 1) { pathQueue.shift(); }
      else if (tmp.length() < 0.2) { clickTarget = null; pathTarget = null; pathQueue = []; }
      else {
        tmp.normalize();
        root.position.addScaledVector(tmp, speed * dt);
        me.ry = Math.atan2(tmp.x, tmp.z);
        moving = true;
      }
    }
    // tới bồ đoàn đã chọn → ngồi xuống rồi lạy
    if (bowSeat && Math.hypot(bowSeat.x - root.position.x, bowSeat.z - root.position.z) < 0.5) {
      root.position.set(bowSeat.x, world.groundY(bowSeat.x, bowSeat.z), bowSeat.z);
      bowSeat = null;
      clickTarget = null;
      moving = false;
      setSitting(true);
      doAction('bow', undefined, true);
    }
    if (moving) myActionUntil = 0;
    collide(root.position);
    root.position.y += (world.groundY(root.position.x, root.position.z) - root.position.y) * Math.min(1, dt * 14);
    me.anim = now < myActionUntil ? me.anim : sitting ? 'sit' : moving ? (running ? 'run' : 'walk') : 'idle';

    if (now - lastSend > 60) {
      lastSend = now;
      socket.volatile.emit('move', { x: root.position.x, z: root.position.z, ry: me.ry, anim: me.anim });
    }

    const cx = root.position.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist;
    const cy = 1.4 + Math.sin(camPitch) * camDist;
    const cz = root.position.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist;
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
      camera.lookAt(root.position.x, 1.3, root.position.z);
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
  updateZoneBtn();
  updateCouplet();
  world.update(t, me ? me.char.root.position : focusIdle);
  post.render();
  if (!loadedHidden) {
    loadedHidden = true;
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
