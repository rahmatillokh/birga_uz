import type { BookingStatus, FaqItem, Order, Premium, Share, ShareScope } from "@/lib/types";
import { dayKey, formatDate } from "@/lib/utils";

type Tone = "brand" | "gray" | "good" | "warn" | "danger" | "premium";

/** Yozilish holatlari */
export const BOOKING_STATUS: Record<BookingStatus, { label: string; tone: Tone; emoji: string }> = {
  kutilmoqda: { label: "Tasdiq kutilmoqda", tone: "warn", emoji: "⏳" },
  tasdiqlandi: { label: "Tasdiqlandi", tone: "good", emoji: "✅" },
  bekor: { label: "Bekor qilingan", tone: "danger", emoji: "✖️" },
  otdi: { label: "O‘tdi", tone: "gray", emoji: "✔️" },
};

/** Buyurtma holatlari */
export const ORDER_STATUS: Record<Order["status"], { label: string; tone: Tone; emoji: string }> = {
  qabul_qilindi: { label: "Qabul qilindi", tone: "brand", emoji: "📥" },
  yigilmoqda: { label: "Yig‘ilmoqda", tone: "warn", emoji: "📦" },
  yolda: { label: "Yo‘lda", tone: "brand", emoji: "🚚" },
  yetkazildi: { label: "Yetkazildi", tone: "good", emoji: "✅" },
};

export const PAYMENT_LABEL: Record<Order["payment"], string> = {
  click: "Click",
  payme: "Payme",
  uzum: "Uzum",
  naqd: "Naqd pul",
};

/** Mutaxassisga ulashiladigan bo‘limlar */
export const SHARE_SCOPES: Record<ShareScope, { label: string; emoji: string }> = {
  baholash: { label: "Baholash natijalari", emoji: "🧠" },
  mashqlar: { label: "Mashqlar tarixi", emoji: "🎯" },
  ai: { label: "AI tahlil natijalari", emoji: "🤖" },
  kuzatuvlar: { label: "Kuzatuvlar", emoji: "📝" },
  mutaxassis: { label: "Mutaxassis izohlari", emoji: "👩‍⚕️" },
};

/** FAQ bo‘limlari */
export const FAQ_CATEGORIES: Record<FaqItem["category"], { label: string; short: string; emoji: string }> = {
  umumiy: { label: "Umumiy savollar", short: "Umumiy", emoji: "💬" },
  baholash: { label: "Baholash va individual reja", short: "Baholash", emoji: "🧠" },
  mutaxassis: { label: "Mutaxassislar va sessiyalar", short: "Mutaxassislar", emoji: "👩‍⚕️" },
  premium: { label: "Premium va to‘lov", short: "Premium", emoji: "💎" },
  xavfsizlik: { label: "Xavfsizlik va maxfiylik", short: "Xavfsizlik", emoji: "🔐" },
};

export const FAQ_ORDER: FaqItem["category"][] = ["umumiy", "baholash", "mutaxassis", "premium", "xavfsizlik"];

/** Premium holati: faolmi, sinov davrimi, necha kun qoldi */
export function premiumInfo(p: Premium, now: Date = new Date()) {
  const nowIso = now.toISOString();
  const isPremium = p.plan === "premium";
  const active = isPremium && (!p.until || p.until > nowIso);
  const expired = isPremium && !!p.until && p.until <= nowIso;
  const daysLeft = active && p.until ? Math.max(0, Math.ceil((new Date(p.until).getTime() - now.getTime()) / 86_400_000)) : 0;
  return {
    active,
    expired,
    trial: active && !!p.trial,
    daysLeft,
    /** "24 kun qoldi" (muddatsiz bo‘lsa — "Muddatsiz") */
    daysText: active && !p.until ? "Muddatsiz" : `${daysLeft} kun qoldi`,
    until: p.until,
    period: p.period,
    consultationsLeft: p.consultationsLeft ?? 0,
  };
}

export type ShareState = "active" | "expired" | "revoked";

export function shareState(s: Share, nowIso: string = new Date().toISOString()): ShareState {
  if (!s.active) return "revoked";
  if (s.expiresAt <= nowIso) return "expired";
  return "active";
}

export const SHARE_STATE: Record<ShareState, { label: string; tone: Tone }> = {
  active: { label: "Faol", tone: "good" },
  expired: { label: "Muddati tugagan", tone: "gray" },
  revoked: { label: "Bekor qilingan", tone: "danger" },
};

/** "https://t.me/username" */
export function botLink(username: string): string {
  return `https://t.me/${username.replace(/^@/, "")}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "19 oktabrgacha" (boshqa yil bo‘lsa: "2027-yil 26 sentabrgacha") */
export function untilLabel(iso: string, now: Date = new Date()): string {
  const key = dayKey(iso);
  const year = Number(key.slice(0, 4));
  const base = `${formatDate(key)}gacha`;
  return year !== Number(dayKey(now).slice(0, 4)) ? `${year}-yil ${base}` : base;
}
