import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MONTHS, WEEKDAYS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Qisqa tasodifiy id */
export function uid(prefix = ""): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  const t = Date.now().toString(36).slice(-4);
  return `${prefix}${prefix ? "-" : ""}${t}${rnd}`;
}

/** Deterministik psevdo-tasodifiy generator (seed ma’lumotlar uchun) */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Sana va vaqt (Toshkent vaqti, UTC+5)
// ---------------------------------------------------------------------------

const TZ_OFFSET_MIN = 5 * 60;

/** Toshkent vaqtidagi "YYYY-MM-DD" */
export function dayKey(date: Date | string | number = new Date()): string {
  const d = new Date(date);
  const local = new Date(d.getTime() + TZ_OFFSET_MIN * 60_000);
  return local.toISOString().slice(0, 10);
}

export function todayKey(): string {
  return dayKey(new Date());
}

/** "YYYY-MM-DD" ga n kun qo‘shish */
export function addDays(key: string, n: number): string {
  const d = new Date(key + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86_400_000);
}

/** Toshkent vaqtidagi soat:daqiqa */
export function tashkentTime(date: Date = new Date()): { hh: number; mm: number; weekday: number } {
  const local = new Date(date.getTime() + TZ_OFFSET_MIN * 60_000);
  const wd = local.getUTCDay(); // 0 = Yakshanba
  return { hh: local.getUTCHours(), mm: local.getUTCMinutes(), weekday: wd === 0 ? 7 : wd };
}

/** Hafta kuni (1 = Dushanba ... 7 = Yakshanba) "YYYY-MM-DD" uchun */
export function weekdayOf(key: string): number {
  const wd = new Date(key + "T00:00:00Z").getUTCDay();
  return wd === 0 ? 7 : wd;
}

/** "26 sentabr" / "26 sentabr, 2026" */
export function formatDate(input: string | Date, opts: { year?: boolean; weekday?: boolean } = {}): string {
  const key = typeof input === "string" && input.length === 10 ? input : dayKey(input);
  const [y, m, d] = key.split("-").map(Number);
  let s = `${d} ${MONTHS[m - 1]}`;
  if (opts.year) s += `, ${y}`;
  if (opts.weekday) s = `${WEEKDAYS[weekdayOf(key) - 1]}, ${s}`;
  return s;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const { hh, mm } = tashkentTime(d);
  return `${formatDate(iso)}, ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** "Bugun", "Kecha", "3 kun oldin", "Ertaga", "5 kundan keyin" */
export function relativeDay(key: string): string {
  const diff = daysBetween(todayKey(), key.length === 10 ? key : dayKey(key));
  if (diff === 0) return "Bugun";
  if (diff === -1) return "Kecha";
  if (diff === 1) return "Ertaga";
  if (diff < 0) return `${-diff} kun oldin`;
  return `${diff} kundan keyin`;
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "hozirgina";
  if (min < 60) return `${min} daqiqa oldin`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} kun oldin`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} oy oldin`;
  return `${Math.floor(mo / 12)} yil oldin`;
}

/** Yoshi: { years, months, label: "5 yosh 2 oy" } */
export function ageOf(birthDate: string, at: Date = new Date()): { years: number; months: number; total: number; label: string } {
  const b = new Date(birthDate + "T00:00:00Z");
  let months = (at.getUTCFullYear() - b.getUTCFullYear()) * 12 + (at.getUTCMonth() - b.getUTCMonth());
  if (at.getUTCDate() < b.getUTCDate()) months -= 1;
  months = Math.max(0, months);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const label = years > 0 ? `${years} yosh${rest ? ` ${rest} oy` : ""}` : `${rest} oylik`;
  return { years, months: rest, total: months, label };
}

// ---------------------------------------------------------------------------
// Raqamlar
// ---------------------------------------------------------------------------

/** 79000 -> "79 000 so‘m" */
export function formatMoney(n: number): string {
  return `${formatNumber(n)} so‘m`;
}

export function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec} soniya`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return s ? `${m} daq ${s} s` : `${m} daqiqa`;
  const h = Math.floor(m / 60);
  return `${h} soat ${m % 60} daq`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Matnlarni solishtirish uchun normallashtirish (o‘zbek apostroflari bilan) */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ʻʼ‘’`']/g, "")
    .replace(/[^a-zа-яёқғҳўʼ0-9\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 0..1 o‘xshashlik (Levenshtein asosida) */
export function similarity(a: string, b: string): number {
  const s = normalizeText(a);
  const t = normalizeText(b);
  if (!s.length && !t.length) return 1;
  const m = s.length;
  const n = t.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = s[i - 1] === t[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return 1 - dp[n] / Math.max(m, n);
}

export function pluralize(n: number, word: string): string {
  return `${formatNumber(n)} ta ${word}`;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Online konsultatsiya uchun video qo‘ng‘iroq xonasi (Jitsi Meet — bepul, ro‘yxatdan o‘tmasdan) */
export function meetUrl(bookingId: string): string {
  return `https://meet.jit.si/YuniQo-${bookingId.replace(/[^a-zA-Z0-9]/g, "")}`;
}
