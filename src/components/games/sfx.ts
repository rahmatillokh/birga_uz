"use client";

/**
 * O‘yinlar uchun juda yengil ovoz effektlari (Web Audio, fayllarsiz).
 * AudioContext faqat birinchi bosishda yaratiladi — brauzer ogohlantirishlari chiqmaydi.
 */

const KEY = "yuniqo-games-sound";
let ctx: AudioContext | null = null;
let muted: boolean | null = null;

export function isMuted(): boolean {
  if (muted === null) {
    try {
      muted = localStorage.getItem(KEY) === "off";
    } catch {
      muted = false;
    }
  }
  return muted;
}

export function setMuted(v: boolean) {
  muted = v;
  try {
    localStorage.setItem(KEY, v ? "off" : "on");
  } catch {
    /* ignore */
  }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  // Foydalanuvchi sahifa bilan hali o‘zaro ta’sir qilmagan bo‘lsa, brauzer ovozga ruxsat bermaydi — jim o‘tamiz
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  if (activation && !activation.hasBeenActive) return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => undefined);
  return ctx;
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = "sine", vol = 0.1, slideTo?: number) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + at;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function play(fn: () => void) {
  if (isMuted()) return;
  try {
    fn();
  } catch {
    /* ovoz — ixtiyoriy */
  }
}

export const sfx = {
  /** Foydalanuvchi bosganda chaqiring — iOS/Telegram’da ovozni «ochadi» */
  unlock: () => {
    if (!isMuted()) audio();
  },
  good: () =>
    play(() => {
      tone(660, 0, 0.12, "triangle", 0.09);
      tone(990, 0.09, 0.2, "triangle", 0.09);
    }),
  bad: () => play(() => tone(300, 0, 0.24, "sine", 0.08, 190)),
  pop: () => play(() => tone(620, 0, 0.09, "triangle", 0.07, 1100)),
  flip: () => play(() => tone(440, 0, 0.06, "triangle", 0.05)),
  tick: () => play(() => tone(880, 0, 0.07, "sine", 0.05)),
  win: () =>
    play(() => {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.24, "triangle", 0.08));
    }),
};
