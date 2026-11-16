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
import { closePanel, h, openAdminPanel, openCustomPanel, openDonatePanel, openDonorsPanel, openPanel, panelOpen, refreshPanel } from './panels';
import { openFortune } from './features/fortune';
import { getLastPhoto, takePhoto } from './features/photo';
import { openFestivals } from './features/festivals';
import { createPost } from './post';
import { createWorld } from './world';
import { setStallClosed } from './market';
import { renderGardenTrees, setGardenGateBoard } from './vuoncay';
import { initAnimals, updateAnimals, nearestFeedable, lostAnimal, flockPos } from './animals';
import { createKoi } from './koi';
import { buildBuddha, buildQuanAm } from './statues';
import { ACTION_RULES, CHAIN_QUESTS, GARDEN_GOOD_SEEDS, GARDEN_PLOTS, GARDEN_SEEDS, MARKET_STALLS, NPC_QUESTS, ROOMS, TITLES, defaultTitle, titleName, type GardenPlotState, type GardenSpecies, type MeditationInfo, type QuestState, type QuestZone } from '../shared/game';
import { weekKey } from '../shared/time';
import { DIALOGUES } from './data/dialogues';
import { createPathfinder } from '../shared/pathfind';
import { nearestNode, routeFrom, type Pt } from '../shared/roads';
import {
  MAP_HALF, MAP_Z_MIN, OUTFIT_COLOR, levelOf, meritForLevel,
  type ActionKind, type Anim, type AnimalState, type ChatMessage, type Lantern, type NpcAct, type Outfit, type PlayerState, type Profile,
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
    syncCamUi();
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

interface Remote { char: Character; target: THREE.Vector3; ry: number; anim: Anim; actionUntil: number; data: PlayerState; act?: NpcAct | null; prevAnim?: Anim; lastX?: number; lastZ?: number; lastMoveAt?: number; lodAt?: number; lodAnim?: string; lodStill?: number; lastRingAt?: number }
const remotes = new Map<string, Remote>();
let socket: Socket | null = null;
let myId = '';
let me: Remote | null = null;
let meditation: MeditationInfo = { sitting: 0, minutes: 0, goal: 500, bonus: false };

const keys = new Set<string>();
let camYaw = 0, camPitch = isTouch ? 0.55 : 0.45, camDist = isTouch ? 12 : 9;
let freeCam = false;
let camUp = false;
let camDown = false;
let camBtn: HTMLButtonElement | null = null;
let camUpBtn: HTMLButtonElement | null = null;
let camDownBtn: HTMLButtonElement | null = null;
let adminBtn: HTMLButtonElement | null = null;

function syncCamUi() {
  const adminTouch = !!profile?.admin && isTouch;
  if (camBtn) {
    camBtn.style.display = adminTouch ? '' : 'none';
    camBtn.classList.toggle('on', freeCam);
  }
  const showUpDown = adminTouch && freeCam;
  if (camUpBtn) camUpBtn.style.display = showUpDown ? '' : 'none';
  if (camDownBtn) camDownBtn.style.display = showUpDown ? '' : 'none';
  if (!showUpDown) { camUp = false; camDown = false; }
}

function syncAdminUi() {
  if (adminBtn) adminBtn.style.display = profile?.admin ? '' : 'none';
}

function toggleFreeCam() {
  if (!profile?.admin) return;
  freeCam = !freeCam;
  if (freeCam) freePos.copy(camera.position);
  toast(freeCam
    ? (isTouch
      ? 'Camera tự do: joystick di chuyển, kéo để xoay, nút lên/xuống để bay, bấm nút Camera để thoát'
      : 'Camera tự do: WASD di chuyển, Space/E bay lên, Q xuống, lăn chuột zoom, Shift nhanh, kéo chuột để xoay, F để thoát')
    : 'Đã thoát camera tự do');
  syncCamUi();
}
let pavF = 0;
let houseF = 0;
let savedOutDist: number | null = null;
let savedBump: number | null = null;
const freePos = new THREE.Vector3();
const camMaxDist = () => (profile?.admin ? 160 : 18);
const camMaxPitch = () => (profile?.admin ? 1.55 : 1.3);
const PAVILION_ZONES = ['daiHung', 'tamThe'];
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

const STATUS_TEXT: Record<NpcAct, string> = {
  chant: 'Đang tụng kinh…',
  meditate: 'Đang thiền…',
  sweep: 'Đang quét sân…',
  ring: 'Đang rung chuông…',
  rest: 'Đang nghỉ…',
};
const statusText = (a?: NpcAct | null) => (a ? STATUS_TEXT[a] : undefined);

/** Vẽ lại nhãn tên (tên + level + danh hiệu + dòng trạng thái). Chỉ gọi khi có gì đổi,
 * không gọi mỗi frame — nhãn chỉ đổi CHỮ, vị trí chip không bao giờ dời (news 66). */
function refreshLabel(r: Remote) {
  if (r.data.id === myId && profile) {
    const curTitleId = profile.title ?? defaultTitle(profile.titles);
    r.char.setLabel(profile.name, levelOf(profile.merit), true, curTitleId ? titleName(curTitleId) : undefined, statusText(r.act));
  } else {
    r.char.setLabel(r.data.name, r.data.npc ? undefined : levelOf(r.data.merit), r.data.id === myId, r.data.npc ? undefined : (r.data.title ? titleName(r.data.title) : undefined), statusText(r.act));
  }
}

function addPlayer(p: PlayerState) {
  if (remotes.has(p.id)) return remotes.get(p.id)!;
  const char = p.npc ? buildCharacter(p.outfit, p.color, p.name, { scale: p.role === 'abbot' ? 1.15 : p.role === 'lay' ? 1 : 0.9, role: p.role, cane: p.role === 'abbot' && p.accessory === 'cane' }) : buildCharacter(p.outfit, p.color, p.name);
  char.setLabel(p.name, p.npc ? undefined : levelOf(p.merit), p.id === myId, p.npc ? undefined : (p.title ? titleName(p.title) : undefined));
  char.label.visible = settings.showNames;
  char.setAccessory(p.accessory);
  char.root.position.set(p.x, 0, p.z);
  if (p.npc) char.root.visible = settings.showNpcs;
  world.scene.add(char.root);
  const r: Remote = { char, target: new THREE.Vector3(p.x, world.groundY(p.x, p.z), p.z), ry: p.ry, anim: p.anim, actionUntil: 0, data: p, act: null };
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
  const curTitleId = profile.title ?? defaultTitle(profile.titles);
  const curTitle = curTitleId ? titleName(curTitleId) : null;
  if (me) me.char.setLabel(profile.name, lv, true, curTitle ?? undefined, statusText(me.act));
  const lo = meritForLevel(lv), hi = meritForLevel(lv + 1);
  $('pname').textContent = profile.name;
  $('ptitle').textContent = curTitle ?? '';
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
    const shadowSize = isTouch || st.quality !== 'high' ? 1024 : 2048;
    if (world.sun.shadow.mapSize.x !== shadowSize) {
      world.sun.shadow.mapSize.set(shadowSize, shadowSize);
      world.sun.shadow.map?.dispose(); // bắt buộc, nếu không three.js giữ target 2048 cũ
      world.sun.shadow.map = null;
    }
    resize();
  }
  if (key === null || key === 'showNames') remotes.forEach((r) => (r.char.label.visible = st.showNames));
  if (key === null || key === 'showNpcs') remotes.forEach((r) => { if (r.data.npc) r.char.root.visible = st.showNpcs; });
  if (key === null || key === 'showCouplets') { if (!st.showCouplets) hideCouplet(); else curZone = null; }
  if (key === 'showTips' || key === null) $('marquee').style.display = st.showTips ? '' : 'none';
});

// ---------- Networking ----------
const resumeToken: string = (() => {
  try {
    let t = sessionStorage.getItem('co:resume');
    if (!t) {
      t = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('co:resume', t);
    }
    return t;
  } catch {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
})();

function sendJoin() {
  const room = ROOMS.find((r) => r.id === roomId) ?? ROOMS[0];
  world.setMood(room.id);
  $('roomName').textContent = room.name;
  socket!.emit('join', { name: nameInput.value, outfit, color, room: roomId, resume: resumeToken });
}
// Bảng vinh danh: tải top 10 khi vào phòng; khi có donation thì tải lại, tối thiểu cách nhau HONOR_MIN_GAP ms.
const HONOR_MIN_GAP = 3000;
let honorLast = 0;
let honorTimer: number | undefined;
function loadHonor() {
  honorLast = performance.now();
  socket?.emit('donors:get', (rows: { name: string; coins?: number; merit?: number }[]) => {
    if (!Array.isArray(rows)) return;
    world.setHonorBoard(rows.slice(0, 10).map((r) => ({ name: String(r.name ?? ''), coins: Number(r.coins) || 0, merit: Number(r.merit) || 0 })));
  });
}
function loadHonorThrottled() {
  const wait = honorLast + HONOR_MIN_GAP - performance.now();
  if (wait <= 0) loadHonor();
  else if (honorTimer === undefined) honorTimer = window.setTimeout(() => { honorTimer = undefined; loadHonor(); }, wait);
}
const STELE_MIN_GAP = 10_000;
let steleLast = -Infinity;
let steleTimer: number | undefined;
let lastSteleWeek = '';
let steleIntervalStarted = false;
function loadStele() {
  steleLast = performance.now();
  socket?.emit('rank:get', (res: { weekly?: { name: string; merit: number }[] } | undefined) => {
    const wk = weekKey();
    lastSteleWeek = wk;
    const top = res?.weekly?.[0];
    world.setStele(top && top.merit > 0 ? { name: top.name, merit: top.merit, weekKey: wk } : null);
  });
}
function loadSteleThrottled() {
  const wait = steleLast + STELE_MIN_GAP - performance.now();
  if (wait <= 0) loadStele();
  else if (steleTimer === undefined) steleTimer = window.setTimeout(() => { steleTimer = undefined; loadStele(); }, wait);
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
    loadHonor();
    loadStele();
    if (!steleIntervalStarted) {
      steleIntervalStarted = true;
      window.setInterval(() => {
        if (!socket?.connected) return;
        if (weekKey() !== lastSteleWeek) loadSteleThrottled();
        else loadStele();
      }, 5 * 60 * 1000);
    }
  });
  s.on('profile', (p: Profile) => { profile = p; updateProfileHud(); refreshPanel(); syncCamUi(); syncAdminUi(); });
  s.on('level:bonus', ({ level, coins, merit }: { level: number; coins: number; merit: number }) => {
    toast(`Lên cấp ${level}! Thưởng +${coins} xu, +${merit} công đức`);
  });
  s.on('title', ({ titles }: { titles: { id: string; title: string }[] }) => {
    if (!titles?.length) return;
    const rank = (id: string) => TITLES.findIndex((r) => r.id === id);
    const top = titles.reduce((a, b) => (rank(b.id) > rank(a.id) ? b : a));
    toast(titles.length === 1 ? `Đạt danh hiệu mới: ${top.title}` : `Đạt danh hiệu mới: ${top.title} và ${titles.length - 1} danh hiệu khác`);
  });
  s.on('player:title', ({ id, title }: { id: string; title: string | null }) => {
    const r = remotes.get(id);
    if (!r || r.data.npc) return;
    r.data.title = title;
    if (id === myId && profile) profile.title = title;
    refreshLabel(r);
  });
  s.on('quests', (q: QuestState[]) => {
    quests = q; updateQuestDot(); refreshPanel();
    updateNpcMarkers();
    updateGuideTarget(); updateGuidePath();
    if (dialogueNpc) { if (panelOpen()) openDialogue(dialogueNpc); else { dialogueNpc = null; dialogueSocialNpc = null; } }
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
  const STALL_VENDORS: { stall: string; npc: string; x: number; z: number }[] = [
    { stall: 'stall_fruit', npc: 'npc15', x: 7, z: 57 },
    { stall: 'stall_cake', npc: 'npc16', x: 12, z: 57 },
    { stall: 'stall_tea', npc: 'npc17', x: 17, z: 57 },
    { stall: 'stall_pho', npc: 'npc31', x: 22, z: 57 },
    { stall: 'stall_trada', npc: 'npc32', x: 27, z: 57 },
    { stall: 'stall_incense', npc: 'npc18', x: 32, z: 57 },
    { stall: 'stall_phongsinh', npc: 'npc30', x: 37, z: 57 },
    { stall: 'stall_com', npc: 'npc33', x: 42, z: 57 },
    { stall: 'stall_chim', npc: 'npc34', x: 47, z: 57 },
    { stall: 'stall_trada2', npc: 'npc36', x: 52, z: 57 },
  ];
  const stallAway = new Map<string, boolean>();
  s.on('state', (st: { online: number; players: Pick<PlayerState, 'id' | 'x' | 'z' | 'ry' | 'anim' | 'act'>[]; animals?: AnimalState[] }) => {
    $('onlineN').textContent = String(st.online);
    latestAnimals = st.animals ?? [];
    for (const p of st.players) {
      const r = remotes.get(p.id);
      if (!r || p.id === myId) continue;
      r.target.set(p.x, world.groundY(p.x, p.z), p.z);
      r.ry = p.ry;
      if (performance.now() > r.actionUntil) r.anim = p.anim;
      if (p.act !== r.act) { r.act = p.act ?? null; refreshLabel(r); }
    }
    for (const v of STALL_VENDORS) {
      const t = remotes.get(v.npc)?.target;
      if (!t) continue;
      const away = Math.hypot(t.x - v.x, t.z - v.z) > 4;
      if (away === (stallAway.get(v.stall) ?? false)) continue;
      stallAway.set(v.stall, away);
      setStallClosed(v.stall, away);
    }
  });
  s.on('chat', addChat);
  s.on('lantern', (l: Lantern) => addLanternFeed(l, true));
  s.on('donation', (d: { name: string; amount: number; text: string }) => {
    enqueueDonate(d.text || `🙏 Cảm ơn phật tử ${d.name} đã đóng góp ${d.amount.toLocaleString('vi-VN')} xu giúp xây dựng chùa`);
    loadHonorThrottled();
  });
  s.on('announce', (a: { text: string; t: number }) => { enqueueDonate(a.text); addChat({ id: 0, name: '', text: a.text, t: a.t || Date.now(), sys: true }); });
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
  onDonated: () => loadHonor(),
  teleport: (x: number, z: number) => teleportTo(x, z),
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
    takePhoto: () => takePhoto(canvas, post, () => profile?.name ?? 'Phật tử', toast),
  });
}
// ---------- Input ----------
const typing = () => document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closePanel(); $('wishModal').hidden = true; return; }
  if (typing() || panelOpen()) return;
  if (e.code === 'KeyF' && profile?.admin && !e.repeat) {
    toggleFreeCam();
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
    const boardHit = ray.intersectObject(world.noticeBoard, true)[0];
    if (boardHit) {
      const dist = Math.hypot(NOTICE_BOARD.x - me.char.root.position.x, NOTICE_BOARD.z - me.char.root.position.z);
      if (dist <= 3.5) {
        openFestivals();
        dragging = false;
        return;
      }
    }
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
const JOY_GRIP_OVERHANG = 10; // tay nắm thò ra ngoài top: -10px
const JOY_TOP_SAFE = 36; // chừa chỗ cho banner đỏ (30px) + lề
// Kích thước viewport đáng tin; trả null khi đang ở trạng thái suy biến lúc xoay màn hình.
const viewportSize = (): { vw: number; vh: number } | null => {
  const vw = visualViewport?.width || innerWidth, vh = visualViewport?.height || innerHeight;
  const w = joyEl.offsetWidth || 124, h = joyEl.offsetHeight || 124;
  if (!Number.isFinite(vw) || !Number.isFinite(vh) || vw < w + 12 || vh < h + JOY_TOP_SAFE + 12) return null;
  return { vw, vh };
};
const clampJoy = (x: number, y: number) => {
  const vp = viewportSize();
  if (!vp) return { x, y };
  const w = joyEl.offsetWidth || 124, h = joyEl.offsetHeight || 124;
  const minY = JOY_TOP_SAFE + JOY_GRIP_OVERHANG;
  const maxY = Math.max(minY, vp.vh - h - 6);
  const maxX = Math.max(6, vp.vw - w - 6);
  return { x: Math.max(6, Math.min(maxX, x)), y: Math.max(minY, Math.min(maxY, y)) };
};
const resetJoy = () => { joyEl.style.left = joyEl.style.top = joyEl.style.bottom = ''; };
const placeJoy = (x: number, y: number) => {
  const p = clampJoy(x, y);
  joyEl.style.left = `${p.x}px`; joyEl.style.top = `${p.y}px`; joyEl.style.bottom = 'auto';
  return p;
};
// Joystick đang ở nửa trên màn hình => coi là bị kẹt, cần tự chữa.
const joyStuckTop = () => {
  const vp = viewportSize();
  if (!vp) return false;
  return joyEl.getBoundingClientRect().top < vp.vh * 0.25;
};
const saveJoy = () => {
  const vp = viewportSize();
  if (!vp) return;
  const r = joyEl.getBoundingClientRect();
  const fx = (r.left + r.width / 2) / vp.vw, fy = (r.top + r.height / 2) / vp.vh;
  try { localStorage.setItem(JOY_POS_KEY, JSON.stringify({ fx: +fx.toFixed(4), fy: +fy.toFixed(4) })); } catch { /* storage blocked */ }
};
if (isTouch) {
  const grip = document.createElement('div');
  grip.id = 'joyGrip';
  grip.setAttribute('aria-label', 'Kéo để di chuyển nút điều hướng');
  grip.innerHTML = '<span data-icon="move"></span>';
  joyEl.append(grip);
  hydrateIcons(grip);
  let drag: { id: number; ox: number; oy: number; sx: number; sy: number } | null = null;
  grip.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    const r = joyEl.getBoundingClientRect();
    drag = { id: e.pointerId, ox: e.clientX - r.left, oy: e.clientY - r.top, sx: r.left, sy: r.top };
    try { grip.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    joyEl.classList.add('moving');
  });
  grip.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const cx = e.clientX, cy = e.clientY;
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || cx < 0 || cy < 0 || (cx === 0 && cy === 0)) return;
    placeJoy(cx - drag.ox, cy - drag.oy);
  });
  const gripEnd = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { sx, sy } = drag;
    drag = null; joyEl.classList.remove('moving');
    if (!joyStuckTop()) {
      saveJoy();
    } else {
      placeJoy(sx, sy);
    }
  };
  grip.addEventListener('pointerup', gripEnd);
  grip.addEventListener('pointercancel', gripEnd);
  grip.addEventListener('dblclick', () => {
    resetJoy();
    try { localStorage.removeItem(JOY_POS_KEY); } catch { /* storage blocked */ }
  });
  const restoreJoy = () => {
    const vp = viewportSize();
    if (!vp) return; // viewport chưa ổn định, chờ lần resize sau
    try {
      const s = JSON.parse(localStorage.getItem(JOY_POS_KEY) ?? 'null');
      const w = joyEl.offsetWidth || 124, h = joyEl.offsetHeight || 124;
      let x = NaN, y = NaN;
      if (s && Number.isFinite(s.fx) && Number.isFinite(s.fy) && s.fx >= 0 && s.fx <= 1 && s.fy >= 0 && s.fy <= 1) {
        // Dạng mới: tỉ lệ theo viewport (tâm joystick)
        x = s.fx * vp.vw - w / 2; y = s.fy * vp.vh - h / 2;
      } else if (s && Number.isFinite(s.x) && Number.isFinite(s.y)) {
        // Dạng cũ: px tuyệt đối — vẫn đọc được để không mất vị trí của người chơi
        x = s.x; y = s.y;
      }
      if (Number.isFinite(x) && Number.isFinite(y)) {
        const p = placeJoy(x, y);
        if (p.y < vp.vh * 0.25) { resetJoy(); localStorage.removeItem(JOY_POS_KEY); }
      } else if (s) {
        localStorage.removeItem(JOY_POS_KEY);
      }
    } catch { /* ignore */ }
  };
  restoreJoy();
  let reclampTimer = 0;
  const reclamp = () => {
    clearTimeout(reclampTimer);
    // Debounce: đợi viewport hết dao động khi xoay màn hình rồi mới tính lại.
    reclampTimer = window.setTimeout(() => {
      if (joyEl.classList.contains('moving')) return; // đang kéo tay nắm, đừng giật về vị trí đã lưu
      if (!viewportSize()) return; // viewport suy biến, bỏ qua
      if (!joyEl.style.top) return; // đang dùng vị trí mặc định của CSS
      if (joyStuckTop()) { resetJoy(); return; } // tự chữa: kẹt ở trên => về góc dưới-trái
      // Giữ đúng tỉ lệ vị trí giữa hai hướng màn hình
      restoreJoy();
    }, 150);
  };
  addEventListener('resize', reclamp);
  addEventListener('orientationchange', reclamp);
  visualViewport?.addEventListener('resize', reclamp);
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
    if (freeCam && profile?.admin) {
      const k = (after - before) * 0.05;
      freePos.x += -Math.sin(camYaw) * Math.cos(camPitch) * k;
      freePos.y = Math.max(0.5, Math.min(250, freePos.y - Math.sin(camPitch) * k));
      freePos.z += -Math.cos(camYaw) * Math.cos(camPitch) * k;
    } else {
      camDist = Math.min(camMaxDist(), Math.max(4, camDist - (after - before) * 0.03));
    }
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
let lastSweptAt = 0;
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

function teleportTo(x: number, z: number) {
  if (!me) return;
  const y = world.groundY(x, z);
  me.char.root.position.set(x, y, z);
  me.target.set(x, y, z);
  clickTarget = null;
  bowSeat = null;
  setSitting(false);
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

  camBtn = document.createElement('button');
  camBtn.className = 'act';
  camBtn.style.display = 'none';
  camBtn.innerHTML = `<span class="ico">${iconSvg('camera')}</span><span class="lb">Camera</span>`;
  camBtn.onclick = () => toggleFreeCam();
  $('actions').appendChild(camBtn);

  const mkUpDown = (label: string, set: (v: boolean) => void) => {
    const el = document.createElement('button');
    el.className = 'act';
    el.style.display = 'none';
    el.innerHTML = `<span class="ico">${label}</span>`;
    el.addEventListener('pointerdown', (e) => { set(true); el.setPointerCapture(e.pointerId); e.preventDefault(); e.stopPropagation(); });
    const off = () => set(false);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerleave', off);
    $('actions').appendChild(el);
    return el;
  };
  camUpBtn = mkUpDown('▲', (v) => { camUp = v; });
  camDownBtn = mkUpDown('▼', (v) => { camDown = v; });
  syncCamUi();
}

// Nút Quản trị tạo NGOÀI khối isTouch để hiện cả PC lẫn điện thoại (không nằm trong khối trên).
adminBtn = document.createElement('button');
adminBtn.className = 'act';
adminBtn.style.display = 'none';
adminBtn.innerHTML = `<span class="ico">${iconSvg('settings')}</span><span class="lb">Quản trị</span>`;
adminBtn.onclick = () => openAdminPanel(panelCtx());
$('actions').appendChild(adminBtn);

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
// Vendors added in market part B: sell through shop:buy (no market:buy / quest requirement).
const SHOP_VENDOR_GOODS: Record<string, { item: string; label: string; price: number }[]> = {
  npc31: [{ item: 'pho_chay', label: 'Phở chay', price: 10 }],
  npc32: [{ item: 'tra_da', label: 'Trà đá', price: 5 }],
  npc33: [{ item: 'com_chay', label: 'Cơm chay', price: 10 }],
  npc34: [
    { item: 'chim_phong_sinh', label: 'Chim phóng sinh', price: 20 },
    { item: 'ca_phong_sinh', label: 'Cá phóng sinh', price: 10 },
    { item: 'thuc_an_chim', label: 'Túi thức ăn cho chim', price: 5 },
  ],
  npc36: [{ item: 'tra_da', label: 'Trà đá', price: 5 }],
  npc38: [
    { item: 'hat_soi', label: 'Hạt sồi', price: 10 },
    { item: 'hat_thong', label: 'Hạt thông', price: 12 },
    { item: 'hat_anh_dao', label: 'Hạt anh đào', price: 15 },
    { item: 'hat_bo_de', label: 'Hạt bồ đề', price: 20 },
  ],
};

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

let dialogueSocialNpc: string | null = null;
let dialogueSocialLine = '';

function pickSocialLine(dlg: (typeof DIALOGUES)[string]): string {
  const cands = [pickLine(dlg.greetings), pickRot(dlg.smallTalk), pickRot(dlg.farewell)]
    .filter((s) => !!s);
  if (!cands.length) return '';
  return cands[Math.floor(Math.random() * cands.length)];
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
  if (!panelOpen() || dialogueSocialNpc !== npcId) {
    dialogueSocialNpc = npcId;
    dialogueSocialLine = pickSocialLine(dlg);
  }
  const failToast = (r: { ok: boolean; error?: string }) => { if (!r.ok) toast(r.error ?? 'Lỗi'); };
  openCustomPanel(dlg.name, (body: HTMLElement) => {
    body.appendChild(h('p', { class: 'hint' }, dlg.role));
    if (dialogueSocialLine) body.appendChild(h('p', {}, dialogueSocialLine));

    // Chanting: short talk only, no quest / vendor blocks.
    if (remotes.get(npcId)?.data.anim === 'chant') {
      body.appendChild(h('p', {}, dlg.chanting ?? ''));
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
        } else if (npcId !== 'npc37') {
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
      // Sư Ông: nhận tất cả việc hôm nay còn chưa nhận bằng một nút (thay cho nút "Nhận việc" từng cái).
      if (npcId === 'npc37') {
        const unaccepted = qs.filter((x) => x.id.startsWith('dq_') && !x.accepted);
        if (unaccepted.length) {
          body.appendChild(h('div', { class: 'qrow' },
            h('button', {
              onclick: () => { for (const u of unaccepted) sock.emit('quest:accept', u.id, failToast); },
            }, `Nhận ${unaccepted.length} việc hôm nay`)));
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
        onclick: () => { dialogueNpc = null; dialogueSocialNpc = null; openDonatePanel(panelCtx()); },
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
        }, 'Mua Cá phóng sinh · 10 xu'),
        h('button', {
          onclick: () => {
            sock.emit('shop:buy', 'thuc_an_chim', (r: { ok: boolean; error?: string }) => {
              if (!r.ok) toast(r.error ?? 'Lỗi'); else toast('Đã mua Túi thức ăn cho chim');
            });
          },
        }, 'Mua Túi thức ăn cho chim · 5 xu'),
        h('button', {
          onclick: () => {
            sock.emit('shop:buy', 'thuc_an_cho_meo', (r: { ok: boolean; error?: string }) => {
              if (!r.ok) toast(r.error ?? 'Lỗi'); else toast('Đã mua Túi thức ăn cho chó mèo');
            });
          },
        }, 'Mua Túi thức ăn cho chó mèo · 5 xu')));
    }
    const shopGoods = SHOP_VENDOR_GOODS[npcId];
    if (shopGoods) {
      body.appendChild(h('p', {}, dlg.shopGreeting ?? ''));
      body.appendChild(h('div', { class: 'qrow' },
        ...shopGoods.map((g) => h('button', {
          onclick: () => {
            sock.emit('shop:buy', g.item, (r: { ok: boolean; error?: string }) => {
              if (!r.ok) toast(r.error ?? 'Lỗi'); else toast(`Đã mua ${g.label}`);
            });
          },
        }, `Mua ${g.label} · ${g.price} xu`))));
    }

    if (npcId === 'npc1') {
      body.appendChild(h('div', { class: 'qrow' }, h('button', {
        onclick: () => { dialogueNpc = null; dialogueSocialNpc = null; openPanel('teacher', panelCtx()); },
      }, '📖 Về chùa Online')));
    }
  });
}

const talkBtn = $('talkBtn');
talkBtn.onclick = () => { const n = nearestTalkNpc(); if (n) openDialogue(n); };
const donorBtn = $('donorBtn');
donorBtn.onclick = () => openDonorsPanel(panelCtx());
const noticeBtn = $('noticeBtn');
noticeBtn.onclick = () => openFestivals();
// quest tracker: styled once here (no CSS file change); display is driven by updateTracker().
const questTrackerEl = $('questTracker');
questTrackerEl.hidden = false;
let guideFeedX = 0, guideFeedZ = 0, guideFeedN = 0;
let guideRefreshT = 0, guideStillT = 0, guideStuckN = 0, guideMoveX = 0, guideMoveZ = 0;
// Theo doi TIEN DO toi dich (chong ket truot vong / ping-pong): chi reset khi
// khoang cach toi dich cai thien, khong reset khi nguoi choi nhuc nhich bat ky.
// guideFeedPD: khoang cach toi dich luc feed gan nhat (de guideFeedN dem dung).
let guideBestD = Infinity, guideBestT = 0, guideStallN = 0, guideFeedPD = Infinity;
let guideSide: { x: number; z: number } | null = null;
let guideStepKey = '';
function resetGuideProgress(): void {
  guideBestD = Infinity; guideBestT = 0; guideStallN = 0; guideSide = null; guideFeedPD = Infinity;
}
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
const DONOR_BOARD = { x: -5, z: 32 };
const NOTICE_BOARD = { x: 5, z: 32 };
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
type AnimalAct = { event: 'feed' | 'find' | 'feedBird' | 'feedPet'; id?: string };
let animalAct: AnimalAct | null = null;
animalBtn.addEventListener('click', () => {
  const a = animalAct;
  if (!a || !socket) return;
  const cb = (r: { ok: boolean; error?: string }) => { if (!r.ok) toast(r.error ?? 'Lỗi'); };
  if (a.event === 'feedBird') socket.emit('animal:feed', { kind: 'bird' }, cb);
  else if (a.event === 'feedPet') socket.emit('animal:feed', { kind: 'pet', id: a.id }, cb);
  else socket.emit(a.event === 'feed' ? 'quest:feed' : 'quest:find', { animalId: a.id }, cb);
});

function updateAnimalBtn() {
  const p = myPos();
  let act: AnimalAct | null = null;
  if (p) {
    for (const q of quests) {
      if (q.claimed || q.progress >= q.target) continue;
      if (q.id === 'nq_feed_birds') continue; // Q26 step 'feed' đi qua chế độ lặp lại (animal:feed kind bird), không dùng quest:feed
      const step = currentStep(q);
      const a = step === 'feed' ? nearestFeedable(p) : step === 'find' ? lostAnimal() : null;
      if (a && Math.hypot(a.x - p.x, a.z - p.z) <= 2) {
        act = { event: step === 'feed' ? 'feed' : 'find', id: a.id };
        break;
      }
    }
  }
  if (!act && p) {
    const fl = flockPos();
    const hasBirdFood = (profile?.inventory?.['thuc_an_chim'] ?? 0) > 0;
    if (fl && hasBirdFood && Math.hypot(fl.x - p.x, fl.z - p.z) <= 3) act = { event: 'feedBird' };
  }
  if (!act && p) {
    const pa = nearestFeedable(p);
    const hasPetFood = (profile?.inventory?.['thuc_an_cho_meo'] ?? 0) > 0;
    if (pa && hasPetFood && Math.hypot(pa.x - p.x, pa.z - p.z) <= 3) act = { event: 'feedPet', id: pa.id };
  }
  animalAct = act;
  if (!act) { if (!animalBtn.hidden) animalBtn.hidden = true; return; }
  if (animalBtn.hidden) animalBtn.hidden = false;
  const lb = animalBtn.querySelector('.lb')!;
  const label = act.event === 'feedBird' ? 'Cho chim ăn'
    : act.event === 'find' ? 'Tìm thấy' : 'Cho ăn';
  if (lb.textContent !== label) lb.textContent = label;
}

function updateDonorBtn() {
  if (!me) { if (!donorBtn.hidden) donorBtn.hidden = true; return; }
  const d = Math.hypot(DONOR_BOARD.x - me.char.root.position.x, DONOR_BOARD.z - me.char.root.position.z);
  if (d > 3.5) { if (!donorBtn.hidden) donorBtn.hidden = true; return; }
  if (donorBtn.hidden) donorBtn.hidden = false;
  const lb = donorBtn.querySelector('.lb')!;
  if (lb.textContent !== 'Vinh danh') lb.textContent = 'Vinh danh';
}

function updateNoticeBtn() {
  if (!me) { if (!noticeBtn.hidden) noticeBtn.hidden = true; return; }
  const d = Math.hypot(NOTICE_BOARD.x - me.char.root.position.x, NOTICE_BOARD.z - me.char.root.position.z);
  if (d > 3.5) { if (!noticeBtn.hidden) noticeBtn.hidden = true; return; }
  if (noticeBtn.hidden) noticeBtn.hidden = false;
  const lb = noticeBtn.querySelector('.lb')!;
  if (lb.textContent !== 'Ngày lễ') lb.textContent = 'Ngày lễ';
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
  // Việc Sư Ông chưa nhận: dẫn tới gặp ông (ông đi lang thang, target là vị trí live, watchdog 2 s tự bám theo).
  if (q.id.startsWith('dq_') && !q.accepted) return npcPos(q.giver);
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
    if (step === 'feed') {
      if (q.id === 'nq_feed_birds') return flockPos();
      const p = myPos(); const a = p ? nearestFeedable(p) : null; return a ? { x: a.x, z: a.z } : null;
    }
    if (step === 'find') { const a = lostAnimal(); return a ? { x: a.x, z: a.z } : null; }
    return zoneCenter(def.zone);
  }
  if (def.event === 'talk') return npcPos(q.giver); // Q10 bell
  const zc = zoneCenter(def.zone);
  // Việc Sư Ông không có điểm cố định (thắp hương bất kỳ đâu): dẫn về gặp ông (nơi trả việc).
  if (!zc && q.id.startsWith('dq_')) return npcPos(q.giver);
  return zc; // Q7/Q8/Q9/Q15/Q21 worship at a zone
}
function startGuide(qid: string): void {
  const q = quests.find((x) => x.id === qid);
  // Dẫn đường cho nhiệm vụ NPC chưa nhận: nhận hộ trước (server quest:accept),
  // vì updateSweep chỉ quét nhiệm vụ đã nhận — nếu không, guide đi tới nơi rồi
  // đứng im, không bao giờ cầm chổi (bug sweep v3, user 11:09 15/11).
  if (q && !q.accepted && !q.claimed && (qid.startsWith('nq_') || qid.startsWith('dq_') || qid.startsWith('c_'))) {
    socket?.emit('quest:accept', qid, (r: { ok: boolean; error?: string }) => {
      if (r.ok) {
        // Lật accepted tại chỗ, không chờ push 'quests' (push mất thì lại kẹt — đúng lỗi news 89).
        const qq = quests.find((x) => x.id === qid);
        if (qq) qq.accepted = true;
        return;
      }
      if (r.error === 'Đã nhận hoặc đã hoàn thành nhiệm vụ này') return; // đã nhận (race) — quests push sẽ cập nhật
      if (guideQuestId === qid) stopGuide();
      toast(r.error ?? 'Lỗi');
    });
  }
  guideQuestId = qid;
  clickTarget = null; pathTarget = null; pathQueue = []; guideFeedN = 0; guideStuckN = 0;
  guideStepKey = ''; resetGuideProgress();
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
  // Buoc nhiem vu doi (diem quet ke tiep, buoc moi): do lai tien do tu dau.
  // NPC dang di (cung buoc, dich troi dan) thi KHONG reset — nguoi choi van
  // duoi kip duoc, best-distance van cai thien binh thuong.
  const key = guideQuestId + ':' + (currentStep(q) ?? '') + ':' + q.progress;
  if (key !== guideStepKey) { guideStepKey = key; resetGuideProgress(); }
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
  // Duong dan ve bang findPath (tranh collider, co tangent detour) de hinh
  // ve trung voi duong nguoi choi thuc su di; chi dung routeFrom khi findPath
  // fallback (dich khong toi duoc) hoac tra ve rong.
  let pts = pathfinder.findPath(from, guideTarget);
  if (pathfinder.lastFallback || !pts.length) {
    pts = routeFrom(from, nearestNode(guideTarget));
    if (!pts.length) pts = [from, guideTarget];
    else pts = [...pts, guideTarget];
  } else pts = [from, ...pts];
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
// Quest quet: giu guide song khi dang o diem quet (cho updateSweep quet + watchdog doi sang diem ke).
// Quet xong het diem thi chi giu song cho toi khi guideTarget doi sang nguoi giao; toi noi (<1.5 m) thi cho dung.
function sweepGuideKeepAlive(q: (typeof quests)[number], px: number, pz: number): boolean {
  if (questDef(q.id)?.event !== 'sweep') return false;
  if (q.progress < q.target) return true;
  const t = questTarget(q);
  return !!t && Math.hypot(t.x - px, t.z - pz) >= 1.5;
}

/** Tên khu vực theo tọa độ — dùng cho tracker khi dẫn tới NPC đang đi (Sư Ông). Thứ tự: điện/phòng trước, sân/chợ/hồ sau. */
function zoneNameOf(x: number, z: number): string {
  const inRect = (x0: number, x1: number, z0: number, z1: number) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
  const near = (cx: number, cz: number, r: number) => Math.hypot(x - cx, z - cz) <= r;
  if (inRect(-17, 17, -42, -22)) return 'Chính Điện';
  if (inRect(-20, 20, -80, -56)) return 'Điện Tam Thế';
  if (near(-47, -27, 8)) return 'Thiền Đường';
  if (near(39, 10, 6)) return 'Điện Mẫu';
  if (near(-30, -38, 7)) return 'Bảo Tháp';
  if (near(36, -68, 8)) return 'Nhà Tổ';
  if (near(-47, -61, 8)) return 'Nhà Khách';
  if (near(-29, -61, 8)) return 'Trai Đường';
  if (near(49, -63, 9)) return 'Vườn Tháp';
  if (near(-34, -6, 6)) return 'Tháp Chuông';
  if (near(34, -6, 6)) return 'Tháp Trống';
  if (near(30, -31, 5)) return 'Bến Phóng Sinh';
  if (inRect(-2, 2, 14, 30)) return 'Cầu Sen';
  if (near(0, 22, 10)) return 'Hồ Sen';
  if (inRect(5, 55, 47, 60)) return 'Chợ';
  if (near(11, 39, 5)) return 'Đền Trình';
  if (inRect(-17, 17, -14, 14)) return 'Sân Chùa';
  return 'Trong Chùa';
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
  if (d < 1.5 && !sweepGuideKeepAlive(q, p.x, p.z)) { stopGuide(); return; }
  qt.style.display = 'flex';
  const label = qt.querySelector('.qt-label');
  const dist = qt.querySelector('.qt-dist');
  const arrow = qt.querySelector('.qt-arrow') as HTMLElement | null;
  if (label) {
    // Dẫn tới Sư Ông (đang đi): hiện tên khu vực ông đang ở thay vì tên việc.
    // Hỏi đích TƯƠI của bước hiện tại (questTarget tính lại ngay lúc này) thay vì
    // guideTarget đã lưu (cũ tới 2 s trong khi ông đi ~1,5 m/s) — nếu không nhãn nhấp nháy.
    // questTarget trả đúng npcPos('npc37') khi bước hiện tại dẫn tới ông (cùng 1 tick nên
    // khoảng cách ~0); các bước dẫn đi chỗ khác (vd. dẫn tới npc4, tới con vật) thì không khớp.
    const giverPos = q.id.startsWith('dq_') ? npcPos('npc37') : null;
    const freshTarget = giverPos ? questTarget(q) : null;
    label.textContent = (giverPos && freshTarget && Math.hypot(freshTarget.x - giverPos.x, freshTarget.z - giverPos.z) < 0.5)
      ? `Sư Ông đang ở ${zoneNameOf(guideTarget.x, guideTarget.z)}`
      : q.label;
  }
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
      lastSweptAt = now;
      socket.emit('quest:sweep', { qid: s.qid, point: s.point }, (r: { ok: boolean; error?: string; progress?: number }) => {
        const applyProgress = (): boolean => {
          if (typeof r.progress !== 'number') return false;
          const q = quests.find((x) => x.id === s.qid);
          if (q && r.progress > q.progress) {
            q.progress = r.progress;
            updateGuideTarget();
            updateGuidePath();
            return true;
          }
          return false;
        };
        if (r.ok) { applyProgress(); return; }
        if (r.error === 'Điểm này đã quét rồi') {
          if (applyProgress()) { lastSwept = null; return; }
        }
        lastSwept = null;
        toast(r.error ?? 'Lỗi');
      });
    }
    return;
  }
  // Throttle the arrival check to twice a second.
  if (now - lastSweepCheck < 500) return;
  lastSweepCheck = now;
  // Tự hồi phục nếu bản cập nhật tiến độ bị mất (ack không bao giờ tới).
  if (lastSwept && now - lastSweptAt > 10000) lastSwept = null;
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
  thuyDinh: { label: 'Thả đèn', run: () => { $('wishModal').hidden = false; $<HTMLTextAreaElement>('wishText').focus(); } },
  phongSinh: { label: 'Phóng sinh', run: () => releasePhongSinh() },
  omikuji: { label: 'Xin xăm', run: () => openFortune(panelCtx()) },
};
let zoneBtnId = '';
let gardenStates: GardenPlotState[] = [];
let gardenPanelOpen = false;
let gardenZoneRun: (() => void) | null = null;
let gardenBtnSig = '';
let inGardenZone = false;

function gardenGrowing(): number {
  return gardenStates.filter((s) => s.species && s.stage < 4 && !s.wilted && !s.harvested).length;
}

function applyGardenStates(states: GardenPlotState[]) {
  gardenStates = states;
  setGardenGateBoard(gardenGrowing());
  void renderGardenTrees(gardenStates);
  if (gardenPanelOpen) openGardenPanel();
}

function refreshGarden() {
  if (!socket) return;
  socket.emit('garden:list', (r: { ok: boolean; states?: GardenPlotState[]; error?: string }) => {
    if (!r.ok || !r.states) { if (r.error) toast(r.error); return; }
    applyGardenStates(r.states);
  });
}

function gardenPlant(plot: number, seed: string) {
  if (!socket) return;
  socket.emit('garden:plant', { plot, seed }, (r: { ok: boolean; states?: GardenPlotState[]; error?: string }) => {
    if (!r.ok) { toast(r.error ?? 'Lỗi'); return; }
    if (r.states) applyGardenStates(r.states);
    toast('Đã gieo hạt');
  });
}

function gardenWater(plot: number) {
  if (!socket) return;
  socket.emit('garden:water', { plot }, (r: { ok: boolean; states?: GardenPlotState[]; error?: string }) => {
    if (!r.ok) { toast(r.error ?? 'Lỗi'); return; }
    if (r.states) applyGardenStates(r.states);
    toast('Đã tưới nước');
  });
}

function gardenHarvest(plot: number) {
  if (!socket) return;
  socket.emit('garden:harvest', { plot }, (r: { ok: boolean; states?: GardenPlotState[]; error?: string; merit?: number; coins?: number; seeds?: number; goodSeeds?: number }) => {
    if (!r.ok) { toast(r.error ?? 'Lỗi'); return; }
    if (r.states) applyGardenStates(r.states);
    toast(`Thu hoạch +${r.merit ?? 0} công đức${(r.coins ?? 0) > 0 ? `, +${r.coins} xu` : ''}, được ${r.seeds ?? 0} hạt${(r.goodSeeds ?? 0) > 0 ? ` (trong đó ${r.goodSeeds} hạt tốt!)` : ''}`);
  });
}

const GARDEN_STAGE_NAME = ['', 'Mầm', 'Non', 'Nhỡ', 'Lớn'];

function openGardenPanel() {
  openCustomPanel('Vườn Cây', (body) => {
    gardenPanelOpen = true;
    for (const def of GARDEN_PLOTS) {
      const st = gardenStates.find((s) => s.plot === def.id);
      const row = h('div', { class: 'qrow' });
      if (!st || !st.species) {
        row.append(h('span', {}, `Luống ${def.id} — Trống`),
          h('button', { onclick: () => { closePanel(); openSeedPicker(def.id); } }, 'Gieo hạt'));
      } else {
        const status = st.harvested ? 'Đã thu hoạch, đang nghỉ'
          : st.wilted ? 'Héo — cần tưới'
          : st.stage >= 4 ? 'Lớn, thu hoạch được'
          : st.progress > 0 ? 'Đang lớn'
          : st.waterCooldownMs > 0 ? `Chờ tưới lại sau ${Math.ceil(st.waterCooldownMs / 60000)} phút`
          : 'Cần tưới';
        row.append(
          h('div', {},
            h('div', {}, `Luống ${def.id} — ${(st.quality === 'good' ? GARDEN_GOOD_SEEDS : GARDEN_SEEDS)[st.species].name} • ${GARDEN_STAGE_NAME[st.stage]} • ${status} (đã tưới ${st.waters}/${st.quality === 'good' ? 2 : 3})`),
            h('progress', { max: 100, value: Math.round(st.progress * 100) })),
          h('button', {
            disabled: st.harvested || (!st.harvestable && st.waterCooldownMs > 0 && !st.wilted),
            onclick: () => {
              if (st.harvestable) gardenHarvest(def.id);
              else gardenWater(def.id);
            },
          }, st.harvestable ? 'Thu hoạch' : st.waterCooldownMs > 0 && !st.wilted ? `Tưới lại sau ${Math.ceil(st.waterCooldownMs / 60000)} phút` : 'Tưới nước'),
        );
      }
      body.appendChild(row);
    }
    body.appendChild(h('p', {}, `Đang lớn: ${gardenGrowing()}/8 — cây thường: tưới 3 lần, mỗi lần cách 15 phút, lớn sau ~45 phút; cây hạt tốt: tưới 2 lần, mỗi lần cách 10 phút, lớn sau ~20 phút; thu hoạch +15 công đức + 1–2 hạt, cây hạt tốt thêm 15 xu; quá 24 h không tưới thì héo, quá 48 h cây biến mất.`));
    return () => { gardenPanelOpen = false; };
  });
}

function openSeedPicker(plot: number) {
  openCustomPanel('Gieo hạt', (body) => {
    for (const k of Object.keys(GARDEN_SEEDS) as GardenSpecies[]) {
      const s = GARDEN_SEEDS[k];
      const have = profile?.inventory?.[s.item] ?? 0;
      body.appendChild(h('div', { class: 'qrow' },
        h('span', {}, `${s.name} — ${s.price} xu/hạt (đang có ${have})`),
        h('button', {
          disabled: have <= 0,
          onclick: () => { closePanel(); gardenPlant(plot, s.item); },
        }, 'Gieo')));
    }
    // Hạt TỐT: chỉ có từ thu hoạch, không bán ở shop.
    for (const k of Object.keys(GARDEN_GOOD_SEEDS) as GardenSpecies[]) {
      const s = GARDEN_GOOD_SEEDS[k];
      const have = profile?.inventory?.[s.item] ?? 0;
      body.appendChild(h('div', { class: 'qrow' },
        h('span', {}, `★ ${s.name} — chỉ từ thu hoạch (đang có ${have})`),
        h('button', {
          disabled: have <= 0,
          onclick: () => { closePanel(); gardenPlant(plot, s.item); },
        }, 'Gieo')));
    }
    body.appendChild(h('p', {}, 'Chưa có hạt? Mua ở Tiểu Trồng Cây trong vườn.'));
  });
}

function nearestGardenPlot(): { def: (typeof GARDEN_PLOTS)[number]; st: GardenPlotState } | null {
  if (!me) return null;
  const px = me.char.root.position.x, pz = me.char.root.position.z;
  let best: { def: (typeof GARDEN_PLOTS)[number]; st: GardenPlotState } | null = null;
  let bd = Infinity;
  for (const def of GARDEN_PLOTS) {
    const st = gardenStates.find((s) => s.plot === def.id);
    if (!st) continue;
    const d = Math.hypot(px - def.x, pz - def.z);
    if (d < bd) { bd = d; best = { def, st }; }
  }
  return bd <= 4 ? best : null;
}

zoneBtn.onclick = () => { if (zoneBtnId === 'vuoncay' && gardenZoneRun) gardenZoneRun(); else ZONE_ACTIONS[zoneBtnId]?.run(); };
function updateZoneBtn() {
  const id = me ? world.zoneAt(me.char.root.position.x, me.char.root.position.z) : null;
  // Vườn Cây: nút động theo luống gần nhất (≤ 4 m); không gần luống nào → mở panel vườn.
  if (id === 'vuoncay') {
    if (!inGardenZone) { inGardenZone = true; refreshGarden(); }
    const near = nearestGardenPlot();
    let label = 'Vườn Cây';
    let run: () => void = () => openGardenPanel();
    if (near) {
      const { def, st } = near;
      if (!st.species) { label = 'Gieo hạt'; run = () => openSeedPicker(def.id); }
      else if (st.harvestable) { label = 'Thu hoạch'; run = () => gardenHarvest(def.id); }
      else if (!st.harvested && (st.waterCooldownMs === 0 || st.wilted)) { label = 'Tưới nước'; run = () => gardenWater(def.id); }
    }
    const sig = `vuoncay:${label}:${near?.def.id ?? 0}`;
    if (sig !== gardenBtnSig) {
      gardenBtnSig = sig;
      zoneBtnId = 'vuoncay';
      gardenZoneRun = run;
      zoneBtn.hidden = false;
      zoneBtn.querySelector('.lb')!.textContent = label;
    }
    return;
  }
  if (inGardenZone) inGardenZone = false;
  gardenBtnSig = '';
  gardenZoneRun = null;
  let key = id && ZONE_ACTIONS[id] ? id : '';
  if (key === 'phongSinh' && (profile?.inventory?.['chim_phong_sinh'] ?? 0) <= 0 && (profile?.inventory?.['ca_phong_sinh'] ?? 0) <= 0) key = '';
  if (key === zoneBtnId) return;
  zoneBtnId = key;
  zoneBtn.hidden = !key;
  if (key) zoneBtn.querySelector('.lb')!.textContent = ZONE_ACTIONS[key].label;
}

setInterval(() => { if (inGardenZone) refreshGarden(); }, 60000);

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

const FRAME_MS = 1000 / 60;
const FRAME_TOLERANCE_MS = 1; // rAF 60Hz hay lệch ±0.2ms, tránh bị rơi xuống 30 FPS
let lastRenderAt = 0;

function loop(now: number = performance.now()) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;

  if (!me) {
    // login / connecting backdrop: slow cinematic orbit around the plaza
    const a = t * 0.07;
    camera.position.set(Math.sin(a) * 22, 8, -2 + Math.cos(a) * 22);
    camera.lookAt(0, 3.5, -12);
  }
  if (me && socket) {
    const root = me.char.root;
    let ix = freeCam ? 0 : joy.x, iz = freeCam ? 0 : joy.y;
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
      // Theo doi TIEN DO toi dich (khac voi do chuyen dong): truot vong quanh
      // vat can hay ping-pong giua 2 node deu doi vi tri lien tuc nhung khong
      // lai gan dich — watchdog do chuyen dong khong thay duoc. Chi reset
      // guideStuckN khi khoang cach toi dich cai thien (khong reset khi nguoi
      // choi nhuc nhich bat ky nua — do la loi lam re-plan mai khong giveUp).
      // Bo qua khi da o trong tam trigger 1,5 m (dang dung quet / cho, khong phai ket).
      const dT = Math.hypot(guideTarget.x - p.x, guideTarget.z - p.z);
      guideBestT += dt;
      if (dT < guideBestD - 0.5) { guideBestD = dT; guideBestT = 0; guideStuckN = 0; guideFeedN = 0; }
      else if (guideBestT > 6 && dT >= 1.5) {
        guideBestT = 0;
        if (++guideStallN >= 2) {
          guideStallN = 0;
          stopGuide();
          toast('Không tới được, thử đi bộ tới gần hơn');
        } else {
          // Ne sang ben 2 m vuong goc huong toi dich, chon phia co doan sach;
          // diem ne chen len dau guideWaypoints de feeder di qua no truoc.
          const hx = guideTarget.x - p.x, hz = guideTarget.z - p.z;
          const hl = Math.hypot(hx, hz) || 1;
          guideSide = null;
          for (const s of [1, -1]) {
            const sx = p.x - (hz / hl) * 2 * s, sz = p.z + (hx / hl) * 2 * s;
            if (pathfinder.segmentClear(p.x, p.z, sx, sz)) { guideSide = { x: sx, z: sz }; break; }
          }
          clickTarget = null; pathTarget = null; pathQueue = [];
          if (guideSide) guideWaypoints = [guideSide, ...guideWaypoints];
          else updateGuidePath();
        }
      }
      if (!clickTarget || Math.hypot(p.x - guideMoveX, p.z - guideMoveZ) > 0.3) { guideMoveX = p.x; guideMoveZ = p.z; guideStillT = 0; }
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
      if (d < 1.5) {
        const gq = quests.find((x) => x.id === guideQuestId);
        if (gq && sweepGuideKeepAlive(gq, p.x, p.z)) {
          // diem quet: giu guide song de updateSweep quet; event quests se doi target sang diem ke tiep
          clickTarget = null; pathTarget = null; pathQueue.length = 0;
        } else { stopGuide(); }
      } else {
        const wp = guideWaypoints.length ? guideWaypoints[0] : guideTarget;
        const wd = Math.hypot(wp.x - p.x, wp.z - p.z);
        if (wd < 1.2 && guideWaypoints.length > 1) guideWaypoints.shift();
        else {
          let fx = wp.x, fz = wp.z;
          if (guideWaypoints.length <= 1) { fx = guideTarget.x - (guideTarget.x - p.x) / d * 1.0; fz = guideTarget.z - (guideTarget.z - p.z) / d * 1.0; }
          // Chi dem khi cung 1 diem feed lap lai MA khong lai gan dich tu lan
          // feed truoc (truot vong / ping-pong deu doi vi tri nhung khong tien
          // toi dich, nen dem theo vi tri nhu cu se reset mai khong bao gio du).
          const dFeed = Math.hypot(guideTarget.x - p.x, guideTarget.z - p.z);
          if (Math.hypot(fx - guideFeedX, fz - guideFeedZ) < 0.3 && dFeed > guideFeedPD - 0.3) guideFeedN++;
          else { guideFeedX = fx; guideFeedZ = fz; guideFeedPD = dFeed; guideFeedN = 1; }
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
      else if (arrived && pathfinder.lastFallback && pathQueue.length === 1 && wpDist < 0.3 && (wp.x !== clickTarget.x || wp.z !== clickTarget.z) && Math.hypot(clickTarget.x - root.position.x, clickTarget.z - root.position.z) > 3) {
        pathQueue = [clickTarget.clone()];   // chuỗi suy biến tại chân nhân vật, đích còn xa: không coi là đã tới, đi thẳng tới đích
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
    // Trạng thái của chính mình: tụng kinh → 'chant', ngồi thiền → 'meditate'; chỉ vẽ lại khi đổi.
    const myAct: NpcAct | null = me.anim === 'chant' ? 'chant' : sitting ? 'meditate' : null;
    if (myAct !== me.act) { me.act = myAct; refreshLabel(me); }

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
      const js = 14 * dt;
      freePos.x += (fx * -joy.y + rx * joy.x) * js;
      freePos.y += fy * -joy.y * js;
      freePos.z += (fz * -joy.y + rz * joy.x) * js;
      if (camUp) freePos.y += js;
      if (camDown) freePos.y -= js;
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
        if (r.data.npc && r.anim === 'ring' && (r.prevAnim !== 'ring' || now - (r.lastRingAt ?? 0) > 4000)) { r.lastRingAt = now; world.ringBell(); audio.play('bow'); }
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
  updateNoticeBtn();
  updateAnimalBtn();
  updateNpcMarkers();
  updateTracker();
  updateAnimals(latestAnimals, dt);
  updateSweep(now);
  updateZoneBtn();
  updateReleaseAnims(dt);
  updateCouplet();
  world.update(t, me ? me.char.root.position : focusIdle);
  if (now - lastRenderAt >= FRAME_MS - FRAME_TOLERANCE_MS) {
    lastRenderAt += FRAME_MS;
    if (now - lastRenderAt > FRAME_MS) lastRenderAt = now; // đã trễ quá 1 frame (tab vừa hiện lại, lag): đặt lại mốc
    post.render();
  }
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

if (import.meta.env.DEV) (window as any).__co = { walkTo: (x: number, z: number) => { setSitting(false); clickTarget = new THREE.Vector3(x, 0, z); }, me: () => me, remotes, world, camera, THREE, audio, openPanel, panelCtx: () => panelCtx(), quests: () => quests, pick: (o: Outfit) => { outfit = o; color = OUTFIT_COLOR[o]; buildPickers(); rebuildPreview(); }, pv: () => pChar, build: (o: Outfit) => buildCharacter(o, OUTFIT_COLOR[o], ''), anim: animateCharacter, pScene, pCam, pr, buildBuddha, buildQuanAm, photo: () => getLastPhoto() };
