// Procedural temple sounds (WebAudio). No assets needed.
import { settings, setSetting, onSettings } from './settings';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
// Một nguồn trạng thái âm thanh duy nhất: settings (sound/volume). Key cũ co:mute
// chỉ dùng để di trú một lần rồi xóa.
try {
  const legacy = localStorage.getItem('co:mute');
  if (legacy !== null) {
    if (legacy === '1') setSetting('sound', false);
    localStorage.removeItem('co:mute');
  }
} catch { /* storage blocked */ }
let muted = !settings.sound;
let vol = settings.volume;
let ambientOn = false;
let bgm: HTMLAudioElement | null = null;
const BGM_GAIN = 0.3;
const applyBgm = () => {
  if (!bgm) return;
  bgm.volume = muted ? 0 : Math.min(1, BGM_GAIN * vol);
  if (muted && !bgm.paused) bgm.pause();
};
const BGM_TRACKS = ['/audio/spiritual-ambient.mp3', '/audio/placid-ambient.mp3', '/audio/om-mani-padme-hum.mp3', '/audio/dai-bi-than-chu.mp3'];
let bgmIdx = 0;
let bgmFail = 0;
function nextTrack(a: HTMLAudioElement) {
  bgmIdx = (bgmIdx + 1) % BGM_TRACKS.length;
  a.src = BGM_TRACKS[bgmIdx];
  if (!muted) void a.play().catch(() => {});
}
function startBgm() {
  if (!bgm) {
    const a = new Audio(BGM_TRACKS[bgmIdx]);
    a.preload = 'auto';
    a.addEventListener('ended', () => nextTrack(a));
    a.addEventListener('error', () => {
      if (bgm !== a) return;
      bgmFail++;
      if (bgmFail >= BGM_TRACKS.length) { bgm = null; return; } // mọi bài đều lỗi — bỏ nhạc
      nextTrack(a);
    });
    a.addEventListener('canplay', () => { bgmFail = 0; });
    document.addEventListener('visibilitychange', () => { if (!bgm) return; if (document.hidden) bgm.pause(); else if (!muted) void bgm.play().catch(() => {}); });
    bgm = a;
  }
  applyBgm();
  if (!muted) void bgm.play().catch(() => {});
}
const level = () => (muted ? 0 : 0.7 * vol);

function ensure() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = level();
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, gain: number, type: OscillatorType = 'sine', when = 0, slideTo?: number) {
  const c = ensure();
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master!);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}
function bell(base: number, gain = 0.18, dur = 3.2) {
  [1, 2.76, 5.4, 8.93].forEach((m, i) => tone(base * m, dur / (1 + i * 0.7), gain / (1 + i * 1.3)));
}
type TempleStrike = 'bell' | 'drum';
let strikeNoise: AudioBuffer | undefined;
let lastTempleStrike = -1;

function templeStrike(kind: TempleStrike, strength: number) {
  const c = ensure(), now = c.currentTime;
  if (now - lastTempleStrike < 0.24) return;
  lastTempleStrike = now;
  if (!strikeNoise) {
    strikeNoise = c.createBuffer(1, Math.ceil(c.sampleRate * 0.24), c.sampleRate);
    const samples = strikeNoise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }
  const source = c.createBufferSource(), filter = c.createBiquadFilter(), envelope = c.createGain();
  const isBell = kind === 'bell';
  source.buffer = strikeNoise;
  filter.type = 'bandpass';
  filter.frequency.value = isBell ? 2350 : 620;
  filter.Q.value = isBell ? 1.1 : 0.65;
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime((isBell ? 0.16 : 0.34) * strength, now + 0.003);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + (isBell ? 0.12 : 0.16));
  source.connect(filter).connect(envelope).connect(master!);
  source.start(now);

  if (isBell) {
    for (const [freq, gain, dur] of [[174, 0.29, 5.6], [349, 0.17, 3.7], [423, 0.13, 3.1],
      [668, 0.10, 2.35], [711, 0.07, 1.7], [1101, 0.065, 1.15], [1860, 0.029, 0.48]]) {
      tone(freq, dur, gain * strength);
    }
  } else {
    tone(112, 0.65, 0.40 * strength, 'sine', 0, 68);
    tone(199, 0.38, 0.19 * strength, 'sine', 0, 146);
    tone(317, 0.23, 0.13 * strength, 'sine', 0, 248);
    tone(540, 0.13, 0.075 * strength, 'sine', 0, 410);
  }
}
let fireworkNoise: AudioBuffer | undefined;
function fireworkSound(phase: 'launch' | 'burst', strength: number, crackle: boolean) {
  const c = ensure();
  if (c.state !== 'running') return;
  const t0 = c.currentTime;
  if (!fireworkNoise) {
    fireworkNoise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const samples = fireworkNoise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }
  const noise = (delay: number, dur: number, gain: number, from: number, to: number, type: BiquadFilterType) => {
    const start = t0 + delay;
    const src = c.createBufferSource(); src.buffer = fireworkNoise!;
    const filter = c.createBiquadFilter(); filter.type = type;
    filter.frequency.setValueAtTime(from, start);
    filter.frequency.exponentialRampToValueAtTime(to, start + dur);
    const envelope = c.createGain();
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(.0002, gain * strength), start + .009);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + dur);
    src.connect(filter).connect(envelope).connect(master!);
    src.start(start, Math.random() * .2, dur);
  };
  if (phase === 'launch') {
    noise(0, .18, .24, 940, 380, 'lowpass');
    tone(410, .35, .065 * strength, 'sine', .045, 1150);
  } else {
    noise(0, .62, .60, 5300, 160, 'lowpass');
    tone(94, .48, .24 * strength, 'sine', 0, 42);
    if (crackle) for (let i = 0; i < 5; i++) noise(.44 + i * .055, .08, .14, 3000, 1100, 'bandpass');
  }
}

const applyLevels = () => {
  if (master && ctx) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.05);
  applyBgm();
};
onSettings((s) => {
  muted = !s.sound;
  vol = s.volume;
  applyLevels();
  if (!muted && bgm && bgm.paused && !document.hidden) void bgm.play().catch(() => {});
});

export const audio = {
  isMuted: () => muted,
  setMuted(v: boolean) { setSetting('sound', !v); },
  setVolume(v: number) { setSetting('volume', Math.max(0, Math.min(1, v))); },
  unlock() { ensure(); },
  strike(kind: TempleStrike, strength = 1) {
    if (!muted && vol > 0 && strength >= 0.05 && !document.hidden) templeStrike(kind, Math.min(1, strength));
  },
  firework(phase: 'launch' | 'burst', strength: number, crackle = false) {
    if (!muted && vol > 0 && strength > .02 && !document.hidden) fireworkSound(phase, strength, crackle);
  },
  play(name: 'bow' | 'incense' | 'chant' | 'lantern' | 'coin' | 'levelup' | 'click' | 'moh') {
    if (muted) return;
    switch (name) {
      case 'bow': bell(196, 0.16, 3.6); break;
      case 'incense': tone(880, 1.4, 0.07, 'sine'); tone(1320, 1.8, 0.04, 'sine', 0.08); break;
      case 'chant': for (let i = 0; i < 6; i++) tone(520, 0.14, 0.22, 'triangle', i * 0.42, 260); break; // mõ
      case 'lantern': bell(330, 0.12, 2.4); tone(990, 1.2, 0.05, 'sine', 0.15); break;
      case 'coin': tone(1320, 0.18, 0.09, 'square'); tone(1760, 0.3, 0.08, 'square', 0.09); break;
      case 'levelup': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.9, 0.1, 'sine', i * 0.13)); bell(261, 0.1, 3); break;
      case 'moh': tone(380, 0.16, 0.34, 'triangle', 0, 190); tone(760, 0.07, 0.1, 'square'); tone(95, 0.22, 0.2, 'sine'); break; // gõ mõ
      case 'click': tone(700, 0.05, 0.04, 'triangle'); break;
    }
  },
  startAmbient() {
    if (ambientOn) return;
    ambientOn = true;
    startBgm();
    const c = ensure();
    // wind: filtered noise with slow LFO
    const buf = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const src = c.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    const g = c.createGain(); g.gain.value = 0.22;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.08;
    const lg = c.createGain(); lg.gain.value = 0.1;
    lfo.connect(lg).connect(g.gain);
    src.connect(lp).connect(g).connect(master!);
    src.start(); lfo.start();
    // distant bell now and then
    const ring = () => { if (!muted && !document.hidden) bell(147, 0.05, 5); setTimeout(ring, 28000 + Math.random() * 30000); };
    setTimeout(ring, 9000);
  },
};
