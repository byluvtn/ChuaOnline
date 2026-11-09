// Persisted user settings (localStorage 'co:settings') with a tiny pub/sub.
export interface Settings {
  sound: boolean;
  volume: number; // 0..1
  quality: 'low' | 'medium' | 'high';
  showCouplets: boolean;
  showNames: boolean;
  showBubbles: boolean;
  showTips: boolean;
}
const DEFAULTS: Settings = { sound: true, volume: 0.8, quality: 'high', showCouplets: true, showNames: true, showBubbles: true, showTips: true };
const KEY = 'co:settings';

function load(): Settings {
  const s: Settings = { ...DEFAULTS };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    if (typeof raw.sound === 'boolean') s.sound = raw.sound;
    if (typeof raw.volume === 'number' && raw.volume >= 0 && raw.volume <= 1) s.volume = raw.volume;
    if (raw.quality === 'low' || raw.quality === 'medium' || raw.quality === 'high') s.quality = raw.quality;
    for (const k of ['showCouplets', 'showNames', 'showBubbles', 'showTips'] as const) if (typeof raw[k] === 'boolean') s[k] = raw[k];
  } catch { /* ignore corrupt storage */ }
  return s;
}

/** Live settings object (read-only for consumers; change through setSetting). */
export const settings: Settings = load();
type Cb = (s: Readonly<Settings>, changed: keyof Settings | null) => void;
const subs = new Set<Cb>();

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  if (settings[key] === value) return;
  settings[key] = value;
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* storage full/blocked */ }
  subs.forEach((cb) => cb(settings, key));
}

/** Calls cb immediately (changed = null) and on every change. Returns an unsubscribe function. */
export function onSettings(cb: Cb): () => void {
  subs.add(cb);
  cb(settings, null);
  return () => subs.delete(cb);
}
