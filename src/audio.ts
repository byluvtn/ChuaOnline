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

// Tiếng trống đi qua bus riêng: nhân đôi âm lượng (E2) rồi qua soft-clip giữ đỉnh
// dưới 0 dBFS, nên ở âm lượng tối đa vẫn to hơn hẳn mà không vỡ tiếng.
// Chuông/mõ/nhạc nền không đổi.
const DRUM_GAIN = 2;
const DRUM_KNEE = .68; // dưới ngưỡng này đường cong là tuyến tính, trên thì bão hoà dần
let drumBus: GainNode | null = null;
let drumClip: Float32Array | null = null;
function softClipCurve() {
  if (drumClip) return drumClip;
  const n = 2048, curve = new Float32Array(n), span = 1 - DRUM_KNEE;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1, a = Math.abs(x);
    const y = a <= DRUM_KNEE ? a : DRUM_KNEE + span * Math.tanh((a - DRUM_KNEE) / span);
    curve[i] = x < 0 ? -y : y;
  }
  return (drumClip = curve);
}
function drumOutput() {
  const c = ensure();
  if (!drumBus) {
    const bus = c.createGain();
    bus.gain.value = DRUM_GAIN;
    const clip = c.createWaveShaper();
    clip.curve = softClipCurve();
    clip.oversample = '4x';
    bus.connect(clip).connect(master!);
    drumBus = bus;
  }
  return drumBus;
}

function tone(freq: number, dur: number, gain: number, type: OscillatorType = 'sine', when = 0, slideTo?: number,
  dest?: AudioNode) {
  const c = ensure();
  const out = dest ?? master!;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(out);
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
  const out = isBell ? master! : drumOutput();
  source.buffer = strikeNoise;
  filter.type = 'bandpass';
  filter.frequency.value = isBell ? 2350 : 620;
  filter.Q.value = isBell ? 1.1 : 0.65;
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime((isBell ? 0.16 : 0.34) * strength, now + 0.003);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + (isBell ? 0.12 : 0.16));
  source.connect(filter).connect(envelope).connect(out);
  source.start(now);

  if (isBell) {
    for (const [freq, gain, dur] of [[174, 0.29, 5.6], [349, 0.17, 3.7], [423, 0.13, 3.1],
      [668, 0.10, 2.35], [711, 0.07, 1.7], [1101, 0.065, 1.15], [1860, 0.029, 0.48]]) {
      tone(freq, dur, gain * strength);
    }
  } else {
    const drumTone = (freq: number, dur: number, gain: number, slideTo?: number) =>
      tone(freq, dur, gain * strength, 'sine', 0, slideTo, drumOutput());
    drumTone(112, 0.65, 0.40, 68);
    drumTone(199, 0.38, 0.19, 146);
    drumTone(317, 0.23, 0.13, 248);
    drumTone(540, 0.13, 0.075, 410);
  }
}
let fireworkNoise: AudioBuffer | undefined;
type FireworkEffect = 'launch' | 'burst' | 'dragon' | 'phoenix';
// Tiếng rít dài đúng thời gian bay của quả pháo: ROCKET_TIME = 1 trong fireworks.ts.
const ROCKET_TIME = 1;
const SHAPE_TIME = 1.5;
// Mọi tiếng pháo đi qua một limiter chung: giữ đỉnh dưới 0 dBFS khi nhiều lớp
// (nổ + rồng gầm + phượng kêu) trùng nhau, nên không vỡ tiếng ở âm lượng tối đa.
let fireworkBus: DynamicsCompressorNode | null = null;
function fireworkOutput() {
  const c = ensure();
  if (!fireworkBus) {
    const limiter = c.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    limiter.connect(master!);
    fireworkBus = limiter;
  }
  return fireworkBus;
}
function fireworkSound(effect: FireworkEffect, strength: number, crackle: boolean) {
  const c = ensure();
  if (c.state !== 'running') return;
  const t0 = c.currentTime;
  if (!fireworkNoise) {
    fireworkNoise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const samples = fireworkNoise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }
  const out = fireworkOutput();
  // hold: phần đầu giữ nguyên âm lượng (0..1 của dur) rồi mới tắt dần.
  const noise = (delay: number, dur: number, gain: number, from: number, to: number, type: BiquadFilterType,
    hold = 0) => {
    const start = t0 + delay;
    const src = c.createBufferSource(); src.buffer = fireworkNoise!;
    const filter = c.createBiquadFilter(); filter.type = type;
    filter.frequency.setValueAtTime(from, start);
    filter.frequency.exponentialRampToValueAtTime(to, start + dur);
    const envelope = c.createGain();
    const peak = Math.max(.0002, gain * strength);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(peak, start + .009);
    if (hold > 0) envelope.gain.setValueAtTime(peak, start + dur * hold);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + dur);
    src.connect(filter).connect(envelope).connect(out);
    // Luôn đọc đủ `dur`: buffer chỉ dài 1 giây nên chặn điểm bắt đầu cho khỏi hụt tiếng.
    const offset = Math.min(Math.random() * .2, Math.max(0, fireworkNoise!.duration - dur));
    src.start(start, offset, dur);
  };
  // Quét tần số: giữ âm lượng tới `hold` rồi tắt nhanh. Dùng cho rít, gầm, kêu.
  const sweep = (delay: number, dur: number, gain: number, from: number, to: number, type: OscillatorType,
    hold = .72) => {
    const start = t0 + delay;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, start);
    o.frequency.exponentialRampToValueAtTime(to, start + dur);
    const envelope = c.createGain();
    const peak = gain * strength;
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.linearRampToValueAtTime(peak, start + .018);
    envelope.gain.setValueAtTime(peak, start + dur * hold);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + dur);
    o.connect(envelope).connect(out);
    o.start(start); o.stop(start + dur + .02);
  };
  if (effect === 'launch') {
    // Tiếng rít bay lên: cao dần suốt thời gian bay, ngân tới sát lúc quả pháo nổ.
    sweep(0, ROCKET_TIME, .17, 420, 1760, 'sine', .86);
    sweep(0, ROCKET_TIME, .05, 840, 3520, 'triangle', .86);
    noise(0, ROCKET_TIME, .20, 700, 4200, 'bandpass', .8);
    noise(0, .18, .24, 940, 380, 'lowpass');
    tone(410, .35, .065 * strength, 'sine', .045, 1150, out);
  } else if (effect === 'dragon') {
    // Rồng gầm: nền trầm 110 Hz hạ xuống 52 Hz, thêm nhiễu dải thấp, ngân 1,5 giây.
    sweep(0, SHAPE_TIME, .31, 110, 52, 'sawtooth');
    sweep(0, SHAPE_TIME, .18, 72, 44, 'sine');
    noise(0, SHAPE_TIME, .26, 420, 110, 'lowpass');
  } else if (effect === 'phoenix') {
    // Phượng kêu: ba nốt cao xuống dần, mỗi nốt có họa âm để nghe lảnh lót.
    [0, .36, .72].forEach((delay, i) => {
      sweep(delay, .48, .24, 1720 - i * 250, 1180 - i * 190, 'sine');
      sweep(delay, .44, .09, 2580 - i * 330, 1900 - i * 260, 'triangle');
    });
  } else {
    noise(0, .62, .60, 5300, 160, 'lowpass');
    tone(94, .48, .24 * strength, 'sine', 0, 42, out);
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
  firework(phase: 'launch' | 'burst' | 'dragon' | 'phoenix', strength: number, crackle = false) {
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
