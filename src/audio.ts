// Procedural temple sounds (WebAudio). No assets needed.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = (() => { try { return localStorage.getItem('co:mute') === '1'; } catch { return false; } })();
let ambientOn = false;
let vol = 1;
let bgm: HTMLAudioElement | null = null;
const BGM_GAIN = 0.3;
const applyBgm = () => { if (bgm) bgm.volume = muted ? 0 : Math.min(1, BGM_GAIN * vol); };
const BGM_TRACKS = ['/audio/spiritual-ambient.mp3', '/audio/placid-ambient.mp3'];
let bgmIdx = 0;
function startBgm() {
  if (!bgm) {
    const a = new Audio(BGM_TRACKS[bgmIdx]);
    a.preload = 'auto';
    a.addEventListener('ended', () => { bgmIdx = (bgmIdx + 1) % BGM_TRACKS.length; a.src = BGM_TRACKS[bgmIdx]; void a.play().catch(() => {}); });
    a.addEventListener('error', () => { if (bgm === a) bgm = null; });
    document.addEventListener('visibilitychange', () => { if (!bgm) return; if (document.hidden) bgm.pause(); else if (!muted) void bgm.play().catch(() => {}); });
    bgm = a;
  }
  applyBgm();
  void bgm.play().catch(() => {});
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

export const audio = {
  isMuted: () => muted,
  setMuted(v: boolean) {
    muted = v;
    try { localStorage.setItem('co:mute', v ? '1' : '0'); } catch { /* storage blocked */ }
    if (master && ctx) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.05);
    applyBgm();
    if (!v && bgm && bgm.paused && !document.hidden) void bgm.play().catch(() => {});
  },
  setVolume(v: number) {
    vol = Math.max(0, Math.min(1, v));
    if (master && ctx) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.05);
    applyBgm();
  },
  unlock() { ensure(); },
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
