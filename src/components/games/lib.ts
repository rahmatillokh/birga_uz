import { mulberry32 } from "@/lib/utils";
import type { Level } from "./types";

// ---------------------------------------------------------------------------
// Tasodifiylik: kontent urug‘ (seed) asosida yaratiladi — render toza qoladi
// ---------------------------------------------------------------------------

export type Rng = () => number;

export function rng(seed: number): Rng {
  return mulberry32(seed);
}

/** Yangi urug‘ — faqat hodisa ishlovchilarida chaqiring (render paytida emas) */
export function newSeed(): number {
  return Math.floor(Math.random() * 2_000_000_000) + 1;
}

export function randInt(r: Rng, min: number, max: number): number {
  return min + Math.floor(r() * (max - min + 1));
}

export function pick<T>(r: Rng, arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

export function shuffle<T>(r: Rng, arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(r: Rng, arr: readonly T[], n: number): T[] {
  return shuffle(r, arr).slice(0, n);
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/** Tartibi asl holatiga to‘g‘ri kelmaydigan aralashtirish (kamida 2 ta element bo‘lsa) */
export function shuffleUnsorted(r: Rng, n: number): number[] {
  const base = range(n);
  if (n < 2) return base;
  for (let k = 0; k < 12; k++) {
    const s = shuffle(r, base);
    if (s.some((v, i) => v !== i)) return s;
  }
  return [...base.slice(1), base[0]];
}

// ---------------------------------------------------------------------------
// Darajalar
// ---------------------------------------------------------------------------

export const LEVELS: { value: Level; label: string }[] = [
  { value: 1, label: "Oson" },
  { value: 2, label: "O‘rta" },
  { value: 3, label: "Qiyin" },
];

export function levelLabel(l: Level): string {
  return LEVELS[l - 1].label;
}

/** Bolaning yoshiga mos daraja: 2–3 yosh — Oson, 4–5 — O‘rta, 6+ — Qiyin */
export function levelForAge(years?: number): Level {
  if (years === undefined) return 2;
  if (years < 4) return 1;
  if (years < 6) return 2;
  return 3;
}

// ---------------------------------------------------------------------------
// Ball va yulduzlar
// ---------------------------------------------------------------------------

export function starsFor(score: number): 1 | 2 | 3 {
  if (score >= 85) return 3;
  if (score >= 60) return 2;
  return 1;
}

/** Raund uchun ulush: xatosiz — 1, bitta xato — 0.6, ikki — 0.35, ko‘p — 0.2 */
export function credit(mistakes: number): number {
  if (mistakes <= 0) return 1;
  if (mistakes === 1) return 0.6;
  if (mistakes === 2) return 0.35;
  return 0.2;
}

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

/** "45 s" yoki "1:24" */
export function clock(sec: number): string {
  if (sec < 60) return `${sec} s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Rangga shaffoflik qo‘shish: "#eb6834" -> "#eb68341f" */
export function tint(hex: string, alpha = "1f"): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : hex;
}

// ---------------------------------------------------------------------------
// Rag‘batlantiruvchi so‘zlar (faqat hodisa ishlovchilarida chaqiriladi)
// ---------------------------------------------------------------------------

const PRAISE = ["Barakalla!", "Zo‘r!", "Ajoyib!", "Qoyil!", "Juda yaxshi!", "Ofarin!", "Sen zo‘rsan!"];
const ENCOURAGE = ["Yana urinib ko‘r!", "Deyarli! Yana bir bor", "Hechqisi yo‘q, yana sinab ko‘r!", "Diqqat bilan qara 👀"];

export function praise(): string {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}

export function encourage(): string {
  return ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)];
}
