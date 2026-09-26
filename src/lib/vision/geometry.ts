// Tana nuqtalari va geometriya yordamchilari (sof funksiyalar)
import type { Lm } from "./types";

/** BlazePose (33 nuqta) indekslari. "l" — odamning o‘zining chap tomoni. */
export const P = {
  nose: 0,
  lEye: 2,
  rEye: 5,
  lEar: 7,
  rEar: 8,
  mouthL: 9,
  mouthR: 10,
  lShoulder: 11,
  rShoulder: 12,
  lElbow: 13,
  rElbow: 14,
  lWrist: 15,
  rWrist: 16,
  lPinky: 17,
  rPinky: 18,
  lIndex: 19,
  rIndex: 20,
  lThumb: 21,
  rThumb: 22,
  lHip: 23,
  rHip: 24,
  lKnee: 25,
  rKnee: 26,
  lAnkle: 27,
  rAnkle: 28,
  lHeel: 29,
  rHeel: 30,
  lFoot: 31,
  rFoot: 32,
} as const;

/** Chiziladigan suyaklar (yuz nuqtalarisiz) */
export const BODY_CONNECTIONS: readonly [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [15, 19],
  [12, 14],
  [14, 16],
  [16, 20],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [27, 29],
  [29, 31],
  [27, 31],
  [24, 26],
  [26, 28],
  [28, 30],
  [30, 32],
  [28, 32],
];

/** Nuqta sifatida chiziladigan bo‘g‘imlar */
export const BODY_JOINTS: readonly number[] = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

export interface V2 {
  x: number;
  y: number;
}
export interface V3 {
  x: number;
  y: number;
  z: number;
}

export const DEG = 180 / Math.PI;

/** Normallashtirilgan nuqta → proporsiyasi to‘g‘rilangan 2D (x eni/bo‘yi nisbatiga ko‘paytiriladi) */
export function v2(lm: Lm, aspect: number): V2 {
  return { x: lm.x * aspect, y: lm.y };
}

export function v3(lm: Lm): V3 {
  return { x: lm.x, y: lm.y, z: lm.z };
}

export function dist2(a: V2, b: V2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function mid2(a: V2, b: V2): V2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function mid3(a: V3, b: V3): V3 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

const safeAcos = (v: number) => Math.acos(Math.max(-1, Math.min(1, v)));

/** b nuqtadagi burchak (gradus), a-b-c */
export function angle2(a: V2, b: V2, c: V2): number {
  const ux = a.x - b.x;
  const uy = a.y - b.y;
  const wx = c.x - b.x;
  const wy = c.y - b.y;
  const n = Math.hypot(ux, uy) * Math.hypot(wx, wy);
  if (n < 1e-9) return NaN;
  return safeAcos((ux * wx + uy * wy) / n) * DEG;
}

export function angle3(a: V3, b: V3, c: V3): number {
  const ux = a.x - b.x;
  const uy = a.y - b.y;
  const uz = a.z - b.z;
  const wx = c.x - b.x;
  const wy = c.y - b.y;
  const wz = c.z - b.z;
  const n = Math.hypot(ux, uy, uz) * Math.hypot(wx, wy, wz);
  if (n < 1e-9) return NaN;
  return safeAcos((ux * wx + uy * wy + uz * wz) / n) * DEG;
}

/** from→to vektori va "tik yuqoriga" yo‘nalish orasidagi burchak (0 = tik). y pastga qarab o‘sadi. */
export function tiltUp2(from: V2, to: V2): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const n = Math.hypot(dx, dy);
  if (n < 1e-9) return NaN;
  return safeAcos(-dy / n) * DEG;
}

export function tiltUp3(from: V3, to: V3): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const n = Math.hypot(dx, dy, dz);
  if (n < 1e-9) return NaN;
  return safeAcos(-dy / n) * DEG;
}

/** cos(θ) = ratio bo‘lganda θ (gradus). Qisqarish (foreshortening) orqali og‘ishni baholash. */
export function acosDeg(ratio: number): number {
  return safeAcos(ratio) * DEG;
}

/** Nuqta yetarlicha ishonchli va kadr ichida (kichik chetlanish bilan) */
export function visible(lms: Lm[] | null | undefined, i: number, thr = 0.5, margin = 0.04): boolean {
  const p = lms?.[i];
  if (!p) return false;
  if ((p.visibility ?? 1) < thr) return false;
  return p.x > -margin && p.x < 1 + margin && p.y > -margin && p.y < 1 + margin;
}

export function allVisible(lms: Lm[] | null | undefined, idx: readonly number[], thr = 0.5, margin = 0.04): boolean {
  return idx.every((i) => visible(lms, i, thr, margin));
}

/** NaN qiymatlarni tashlab, medianani qaytaradi (bo‘sh bo‘lsa NaN) */
export function median(xs: readonly number[]): number {
  const a = xs.filter(Number.isFinite).sort((p, q) => p - q);
  if (!a.length) return NaN;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export function mean(xs: readonly number[]): number {
  const a = xs.filter(Number.isFinite);
  if (!a.length) return NaN;
  return a.reduce((s, v) => s + v, 0) / a.length;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** v ni [a..b] oralig‘idan [0..1] ga o‘tkazish (a > b bo‘lishi ham mumkin) */
export function norm(v: number, a: number, b: number): number {
  if (!Number.isFinite(v)) return 0;
  return clamp01((v - a) / (b - a));
}

/** NaN bo‘lmagan birinchi qiymat */
export function firstFinite(...xs: number[]): number {
  for (const x of xs) if (Number.isFinite(x)) return x;
  return NaN;
}
