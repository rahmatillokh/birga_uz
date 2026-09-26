import { getSession } from "@/data/sessions";
import { getSpecialist } from "@/data/specialists";
import { districtLabel, regionName } from "@/data/regions";
import { SESSION_TYPES, SPECIALTIES, WEEKDAYS } from "@/lib/constants";
import type { Booking, BookingStatus, FreeSession, Specialist } from "@/lib/types";
import { daysBetween, formatDate, tashkentTime, todayKey, weekdayOf } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

/** Toshkent vaqti bo‘yicha hozirgi "HH:MM" */
export function nowHM(): string {
  const { hh, mm } = tashkentTime();
  return `${pad(hh)}:${pad(mm)}`;
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** "10:00" + 90 -> "11:30" */
export function addMinutes(time: string, min: number): string {
  const total = Math.max(0, toMinutes(time) + min);
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

/** 60 -> "1 soat", 90 -> "1,5 soat", 45 -> "45 daqiqa" */
export function durationLabel(min: number): string {
  if (min < 60) return `${min} daqiqa`;
  if (min % 60 === 0) return `${min / 60} soat`;
  if (min % 30 === 0) return `${Math.floor(min / 60)},5 soat`;
  return `${Math.floor(min / 60)} soat ${min % 60} daqiqa`;
}

/** Boshlanish vaqti o‘tganmi (Toshkent vaqti) */
export function hasStarted(date: string, time: string): boolean {
  const today = todayKey();
  if (date !== today) return date < today;
  return toMinutes(time) <= toMinutes(nowHM());
}

/** Uchrashuv tugaganmi (Toshkent vaqti) */
export function isOver(date: string, time: string, durationMin = 60): boolean {
  const today = todayKey();
  if (date !== today) return date < today;
  return toMinutes(time) + durationMin <= toMinutes(nowHM());
}

/** "Bugun" / "Ertaga" / "Payshanba" / "3 oktabr, Shanba" */
export function dayLabel(date: string): string {
  const diff = daysBetween(todayKey(), date);
  if (diff === 0) return "Bugun";
  if (diff === 1) return "Ertaga";
  if (diff > 1 && diff < 7) return WEEKDAYS[weekdayOf(date) - 1];
  return formatDate(date, { weekday: true });
}

/** Sanani to‘liq ko‘rsatish: "Payshanba, 1 oktabr" (+ "Bugun"/"Ertaga" belgisi alohida) */
export function relativeTag(date: string): string | undefined {
  const diff = daysBetween(todayKey(), date);
  if (diff === 0) return "Bugun";
  if (diff === 1) return "Ertaga";
  return undefined;
}

/** Sessiyani id bo‘yicha topish (o‘tib ketgan sessiyalar ham qayta tiklanadi) */
export function findSession(id?: string): FreeSession | undefined {
  return id ? getSession(id) : undefined;
}

export function sessionDuration(b: Booking): number {
  if (b.kind === "session" && b.sessionId) return findSession(b.sessionId)?.durationMin ?? 90;
  return 60;
}

/** Ko‘rsatish uchun holat: muddati o‘tgan faol yozilish — "o‘tdi" */
export function displayStatus(b: Booking): BookingStatus {
  if (b.status === "bekor" || b.status === "otdi") return b.status;
  return isOver(b.date, b.time, sessionDuration(b)) ? "otdi" : b.status;
}

export function isUpcoming(b: Booking): boolean {
  const s = displayStatus(b);
  return s === "kutilmoqda" || s === "tasdiqlandi";
}

export const STATUS_META: Record<BookingStatus, { label: string; tone: "warn" | "good" | "danger" | "gray" }> = {
  kutilmoqda: { label: "Kutilmoqda", tone: "warn" },
  tasdiqlandi: { label: "Tasdiqlandi", tone: "good" },
  bekor: { label: "Bekor qilingan", tone: "danger" },
  otdi: { label: "O‘tdi", tone: "gray" },
};

export function sortByTime(a: { date: string; time: string }, b: { date: string; time: string }): number {
  return (a.date + a.time).localeCompare(b.date + b.time);
}

/** Yozilish haqidagi barcha ko‘rsatiladigan ma’lumotlar */
export function bookingInfo(b: Booking): {
  session?: FreeSession;
  specialist?: Specialist;
  title: string;
  subtitle: string;
  place: string;
  emoji: string;
  color: string;
} {
  const session = b.kind === "session" && b.sessionId ? findSession(b.sessionId) : undefined;
  const specialist = b.specialistId ? getSpecialist(b.specialistId) : undefined;
  if (b.kind === "session") {
    const t = session ? SESSION_TYPES[session.type] : undefined;
    return {
      session,
      specialist,
      title: session?.title ?? "Bepul YuniQo sessiyasi",
      subtitle: t ? `${t.label} · bepul` : "Bepul sessiya",
      place: session ? `${session.venue} — ${session.address}` : "Manzil aniqlanmoqda",
      emoji: t?.emoji ?? "🏢",
      color: t?.color ?? "#0ea5e9",
    };
  }
  const spec = specialist ? SPECIALTIES[specialist.specialty] : undefined;
  return {
    session,
    specialist,
    title: specialist?.name ?? "Mutaxassis",
    subtitle: `${spec?.label ?? "Konsultatsiya"} · ${b.mode === "online" ? "online konsultatsiya" : "offline qabul"}`,
    place:
      b.mode === "online"
        ? "Online — video qo‘ng‘iroq (tasdiqlangach shu yerda ochiladi)"
        : specialist
          ? `${specialist.workplace} — ${districtLabel(specialist.district)}, ${regionName(specialist.region)}`
          : "Mutaxassis qabulxonasi",
    emoji: b.mode === "online" ? "💻" : "🏥",
    color: specialist?.color ?? "#0ea5e9",
  };
}
