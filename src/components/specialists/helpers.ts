import { specialistSlots } from "@/data/specialists";
import { SPECIALTIES } from "@/lib/constants";
import type { Booking, Share, Specialist } from "@/lib/types";
import { normalizeText, todayKey } from "@/lib/utils";
import { nowHM } from "@/components/sessions/booking-utils";

export type SlotState = "free" | "mine" | "busy";
export interface SlotDay {
  date: string;
  slots: { time: string; state: SlotState }[];
}

export const slotKey = (date: string, time: string) => `${date} ${time}`;

/**
 * Mutaxassisning kelgusi 7 kunlik vaqtlari: o‘tib ketgan vaqtlar olib tashlanadi,
 * foydalanuvchining shu mutaxassisdagi yozilishlari — "mine", boshqa band vaqtlari — "busy".
 */
export function specialistDays(spId: string, bookings: Booking[], extraBusy?: ReadonlySet<string>): SlotDay[] {
  const today = todayKey();
  const now = nowHM();
  const active = bookings.filter((b) => b.status !== "bekor");
  const mineHere = active.filter((b) => b.kind === "consultation" && b.specialistId === spId);
  const mine = new Set(mineHere.map((b) => slotKey(b.date, b.time)));
  const other = new Set(active.filter((b) => !(b.kind === "consultation" && b.specialistId === spId)).map((b) => slotKey(b.date, b.time)));
  return specialistSlots(spId).map((d) => {
    const times = new Set(d.times);
    for (const b of mineHere) if (b.date === d.date) times.add(b.time);
    const slots = [...times]
      .sort()
      .filter((t) => d.date !== today || t > now)
      .map((t) => {
        const k = slotKey(d.date, t);
        const state: SlotState = mine.has(k) ? "mine" : other.has(k) || extraBusy?.has(k) ? "busy" : "free";
        return { time: t, state };
      });
    return { date: d.date, slots };
  });
}

export function nextFree(days: SlotDay[]): { date: string; time: string } | undefined {
  for (const d of days) {
    const s = d.slots.find((x) => x.state === "free");
    if (s) return { date: d.date, time: s.time };
  }
  return undefined;
}

export function modePrice(sp: Specialist, mode: "online" | "offline"): number | undefined {
  const p = mode === "online" ? sp.priceOnline : sp.priceOffline;
  return typeof p === "number" && p > 0 ? p : undefined;
}

/** Eng arzon xizmat narxi ("120 000 so‘mdan") */
export function priceFrom(sp: Specialist): number | undefined {
  const prices = sp.services.map((m) => modePrice(sp, m)).filter((x): x is number => typeof x === "number");
  return prices.length ? Math.min(...prices) : undefined;
}

/** Qidiruv: ism, lavozim, ish joyi, tuman, mutaxassislik va yo‘nalishlar (apostroflarsiz) */
export function matchesQuery(sp: Specialist, q: string): boolean {
  const n = normalizeText(q);
  if (!n) return true;
  const hay = normalizeText(
    [sp.name, sp.title, sp.workplace, sp.district, SPECIALTIES[sp.specialty]?.label ?? "", ...sp.approach].join(" "),
  );
  return n.split(" ").every((w) => hay.includes(w));
}

/** 5★…1★ taqsimoti (reyting va fikrlar sonidan deterministik) — indeks 0 = 5★ */
export function ratingBreakdown(rating: number, total: number): number[] {
  if (!total || total < 0) return [0, 0, 0, 0, 0];
  const r = Math.min(5, Math.max(1, rating || 5));
  const d = 5 - r;
  let p = [1 - (0.62 * d + 0.12 * d + 0.03 * d + 0.0125 * d), 0.62 * d, 0.12 * d, 0.03 * d, 0.0125 * d];
  if (p[0] < 0.15) {
    // Past reytinglar uchun — reyting atrofida silliq taqsimot
    const w = [5, 4, 3, 2, 1].map((k) => Math.exp(-((k - r) ** 2) / (2 * 0.8 ** 2)));
    const s = w.reduce((a, b) => a + b, 0);
    p = w.map((x) => x / s);
  }
  const counts = p.map((x) => Math.max(0, Math.round(x * total)));
  const diff = total - counts.reduce((a, b) => a + b, 0);
  const top = counts.indexOf(Math.max(...counts));
  counts[top] = Math.max(0, counts[top] + diff);
  return counts;
}

export function daysAgoLabel(n: number): string {
  if (n <= 0) return "Bugun";
  if (n === 1) return "Kecha";
  if (n < 7) return `${n} kun oldin`;
  if (n < 30) return `${Math.floor(n / 7)} hafta oldin`;
  if (n < 365) return `${Math.floor(n / 30)} oy oldin`;
  return `${Math.floor(n / 365)} yil oldin`;
}

export function telegramUrl(handle?: string): string | undefined {
  if (!handle) return undefined;
  const h = handle
    .trim()
    .replace(/^https?:\/\/t\.me\//, "")
    .replace(/^@/, "");
  return /^[A-Za-z0-9_]{3,}$/.test(h) ? `https://t.me/${h}` : undefined;
}

/** Mutaxassis bilan faol (muddati o‘tmagan) ulashish */
export function activeShareWith(shares: Share[], spId: string, childId?: string): Share | undefined {
  const now = new Date().toISOString();
  return shares.find((s) => s.specialistId === spId && s.active && s.expiresAt > now && (!childId || s.childId === childId));
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
