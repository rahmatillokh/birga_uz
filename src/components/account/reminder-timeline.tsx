"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getSession, sessionsForDistrict } from "@/data/sessions";
import { districtLabel } from "@/data/regions";
import { getSpecialist } from "@/data/specialists";
import { LogoMark } from "@/components/ui/logo";
import { SESSION_TYPES, SPECIALTIES } from "@/lib/constants";
import { todayTasks, type TodayTask } from "@/lib/core/stats";
import type { Activity, Assessment, Assignment, Child, Plan, UserView } from "@/lib/types";
import { addDays, cn, dayKey, formatDate, relativeDay, tashkentTime, todayKey, weekdayOf } from "@/lib/utils";
import { pad2 } from "./meta";

export interface TimelineItem {
  id: string;
  emoji: string;
  color: string;
  title: string;
  subtitle?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  href: string;
  state?: "sent" | "done" | "due";
  tag?: string;
}

export function nowHHMM(): string {
  const { hh, mm } = tashkentTime();
  return `${pad2(hh)}:${pad2(mm)}`;
}

/** Eslatma yuboriladigan keyingi kun (bugun — agar vaqti hali o‘tmagan bo‘lsa) */
export function nextReminderDay(days: number[], time: string): string | undefined {
  const today = todayKey();
  const now = nowHHMM();
  for (let i = 0; i < 8; i++) {
    const k = addDays(today, i);
    if (!days.includes(weekdayOf(k))) continue;
    if (i === 0 && time <= now) continue;
    return k;
  }
  return undefined;
}

function preview(tasks: TodayTask[]): string {
  const names = tasks.slice(0, 3).map((t) => `${t.exercise.emoji} ${t.exercise.title}`);
  return names.join(" · ") + (tasks.length > 3 ? ` va yana ${tasks.length - 3} ta` : "");
}

/** Faol bola uchun yaqin eslatmalar (reja, topshiriqlar, yozilishlar, qayta baholash, yangi sessiyalar) */
export function buildTimeline(input: {
  view: UserView;
  child?: Child;
  plan?: Plan;
  assignments: Assignment[];
  activities: Activity[];
  latest?: Assessment;
}): TimelineItem[] {
  const { view, child, plan, assignments, activities, latest } = input;
  const { user } = view;
  const r = user.reminders;
  const today = todayKey();
  const now = nowHHMM();
  const items: TimelineItem[] = [];

  // 1) Bugungi (va keyingi) mashqlar
  if (child && r.types.daily) {
    const todayOn = r.days.includes(weekdayOf(today));
    const tasks = todayTasks(plan, assignments, activities, today);
    const left = tasks.filter((t) => !t.done);
    if (todayOn && left.length) {
      items.push({
        id: "daily-today",
        emoji: "🎯",
        color: "#fdeee7",
        title: `Bugungi mashqlar — ${left.length} ta qoldi`,
        subtitle: preview(left),
        date: today,
        time: r.time,
        href: "/plan",
        state: r.time <= now ? "sent" : undefined,
      });
    } else if (tasks.length && !left.length) {
      items.push({
        id: "daily-done",
        emoji: "🎉",
        color: "#e3f6ef",
        title: "Bugungi reja to‘liq bajarildi!",
        subtitle: `${tasks.length} ta mashq — barakalla, ${child.name}!`,
        date: today,
        href: "/progress",
        state: "done",
      });
    }
    for (let i = 1; i <= 7; i++) {
      const k = addDays(today, i);
      if (!r.days.includes(weekdayOf(k))) continue;
      const next = todayTasks(plan, assignments, activities, k);
      if (!next.length) continue;
      items.push({
        id: `daily-${k}`,
        emoji: "⏰",
        color: "#fdf3dc",
        title: `Mashg‘ulot eslatmasi — ${next.length} ta mashq`,
        subtitle: preview(next),
        date: k,
        time: r.time,
        href: "/plan",
      });
      break;
    }
  }

  // 2) Mutaxassis topshiriqlari (muddati bo‘yicha)
  if (child && r.types.specialist) {
    const list = assignments
      .filter((a) => a.status === "faol")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3);
    for (const a of list) {
      const sp = getSpecialist(a.specialistId);
      const overdue = a.dueDate < today;
      items.push({
        id: `asg-${a.id}`,
        emoji: "👩‍🏫",
        color: "#e7f0fb",
        title: a.title,
        subtitle: `${sp?.name ?? "Mutaxassis"} topshirig‘i · muddati ${formatDate(a.dueDate)}`,
        date: overdue ? today : a.dueDate,
        href: a.exerciseId ? `/exercises/${a.exerciseId}` : "/plan",
        state: overdue ? "due" : undefined,
        tag: overdue ? "Muddati o‘tgan" : "Muddat",
      });
    }
  }

  // 3) Yozilishlar: sessiyalar va konsultatsiyalar
  if (r.types.sessions) {
    const bookings = view.bookings
      .filter((b) => b.status !== "bekor" && b.status !== "otdi" && b.date >= today && (!child || !b.childId || b.childId === child.id))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 4);
    for (const b of bookings) {
      if (b.kind === "session") {
        const s = b.sessionId ? getSession(b.sessionId) : undefined;
        items.push({
          id: `bk-${b.id}`,
          emoji: s ? SESSION_TYPES[s.type].emoji : "🏢",
          color: "#e2f2e2",
          title: s?.title ?? "Bepul YuniQo sessiyasi",
          subtitle: s ? `📍 ${s.venue} · 1 kun oldin eslatamiz` : "1 kun oldin eslatamiz",
          date: b.date,
          time: b.time,
          href: "/sessions?tab=my",
          tag: "Sessiya",
        });
      } else {
        const sp = getSpecialist(b.specialistId);
        items.push({
          id: `bk-${b.id}`,
          emoji: "📞",
          color: "#fcecf2",
          title: `Konsultatsiya: ${sp?.name ?? "mutaxassis"}`,
          subtitle: [sp ? SPECIALTIES[sp.specialty].label : null, b.mode === "online" ? "online" : "offline qabul", b.status === "kutilmoqda" ? "tasdiq kutilmoqda" : null]
            .filter(Boolean)
            .join(" · "),
          date: b.date,
          time: b.time,
          href: sp ? `/specialists/${sp.id}` : "/specialists",
          tag: "Qabul",
        });
      }
    }
  }

  // 4) Hududdagi yangi bepul sessiya
  if (user.sessionAlerts && r.types.sessions && user.region && user.district) {
    const booked = new Set(view.bookings.filter((b) => b.sessionId && b.status !== "bekor").map((b) => b.sessionId));
    const next = sessionsForDistrict(user.region, user.district).find((s) => (s.date > today || (s.date === today && s.time > now)) && !booked.has(s.id));
    if (next) {
      items.push({
        id: `ses-${next.id}`,
        emoji: "📣",
        color: "#e0f2fe",
        title: `Yangi bepul sessiya: ${next.title}`,
        subtitle: `${districtLabel(user.district)} · ${next.venue}`,
        date: next.date,
        time: next.time,
        href: "/sessions",
        tag: "Hududingizda",
      });
    }
  }

  // 5) Qayta baholash (oxirgi baholash + 30 kun)
  if (child && r.types.reassessment) {
    if (!latest) {
      items.push({
        id: "reassess-first",
        emoji: "🧠",
        color: "#efeaff",
        title: "Birinchi rivojlanish baholashi",
        subtitle: "10 daqiqalik savolnoma — individual reja shunga qarab tuziladi",
        date: today,
        href: "/assessment",
        state: "due",
      });
    } else {
      const due = addDays(dayKey(latest.at), 30);
      const isDue = due <= today;
      items.push({
        id: "reassess",
        emoji: "🧠",
        color: "#efeaff",
        title: isDue ? "Qayta baholash vaqti keldi!" : "Qayta baholash",
        subtitle: `Oxirgi baholash: ${formatDate(latest.at)} · umumiy ${latest.overall}%`,
        date: isDue ? today : due,
        time: r.time,
        href: "/assessment",
        state: isDue ? "due" : undefined,
      });
    }
  }

  return items.sort((a, b) => (a.date + (a.time ?? "99:99")).localeCompare(b.date + (b.time ?? "99:99")));
}

/** Kunlar bo‘yicha guruhlangan vaqt chizig‘i */
export function ReminderTimeline({ items, muted }: { items: TimelineItem[]; muted?: boolean }) {
  const groups: { date: string; items: TimelineItem[] }[] = [];
  for (const it of items) {
    const g = groups[groups.length - 1];
    if (g && g.date === it.date) g.items.push(it);
    else groups.push({ date: it.date, items: [it] });
  }
  return (
    <div className={cn("space-y-4 transition", muted && "opacity-55 grayscale-[0.5]")}>
      {groups.map((g) => (
        <div key={g.date}>
          <div className="mb-1.5 flex items-baseline gap-2 px-1">
            <span className="text-sm font-black text-ink">{relativeDay(g.date)}</span>
            <span className="text-xs font-semibold text-muted">{formatDate(g.date, { weekday: true })}</span>
          </div>
          <ol className="space-y-1">
            {g.items.map((it, i) => (
              <li key={it.id} className="relative">
                {i < g.items.length - 1 && <span aria-hidden className="absolute -bottom-2 left-[83px] top-[52px] w-0.5 rounded-full bg-line" />}
                <Link href={it.href} className="group flex items-start gap-3 rounded-2xl p-1.5 transition hover:bg-brand-50/70">
                  <span className="w-11 shrink-0 pt-3 text-right text-[13px] font-black tabular text-ink-2">{it.time ?? "—"}</span>
                  <span
                    className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[22px] ring-4 ring-white"
                    style={{ background: it.color }}
                  >
                    {it.emoji}
                  </span>
                  <span className="min-w-0 flex-1 pt-0.5">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[14.5px] font-extrabold leading-snug text-ink">{it.title}</span>
                      {it.state === "sent" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-muted">✓ yuborilgan</span>}
                      {it.state === "done" && <span className="rounded-full bg-good/10 px-2 py-0.5 text-[11px] font-bold text-[#006300]">✓ bajarildi</span>}
                      {it.state === "due" && <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[11px] font-bold text-[#8a5a00]">❗ {it.tag ?? "Vaqti keldi"}</span>}
                      {it.state === undefined && it.tag && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">{it.tag}</span>}
                    </span>
                    {it.subtitle && <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-muted">{it.subtitle}</span>}
                  </span>
                  <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

/** Bot yuboradigan eslatmaning Telegram’dagi ko‘rinishi (namuna) */
export function TelegramPreview({ childName, tasks, time }: { childName?: string; tasks: TodayTask[]; time: string }) {
  const left = tasks.filter((t) => !t.done);
  const show = left.length ? left : tasks;
  const list = show.slice(0, 4);
  return (
    <div
      className="rounded-3xl bg-[#cfe0ea] p-3 sm:p-4"
      style={{ backgroundImage: "radial-gradient(rgb(255 255 255 / 0.45) 1.2px, transparent 1.2px)", backgroundSize: "16px 16px" }}
    >
      <div className="flex items-end gap-2">
        <LogoMark size={32} className="shrink-0 rounded-full" />
        <div className="min-w-0 max-w-[88%] rounded-2xl rounded-bl-md bg-white px-3.5 pb-1.5 pt-2.5 shadow-sm">
          <div className="text-[13px] font-extrabold text-[#1d8ad6]">YuniQo</div>
          <div className="mt-0.5 text-[14px] leading-snug text-ink">
            <b>🔔 {childName ? `${childName} bilan mashg‘ulot vaqti!` : "Mashg‘ulot vaqti keldi!"}</b>
            {list.length > 0 && (
              <>
                <div className="mt-2">{left.length ? `Bugun ${left.length} ta mashq qoldi:` : `Bugungi reja — ${tasks.length} ta mashq:`}</div>
                {list.map((t) => (
                  <div key={t.exercise.id} className="truncate">
                    {t.exercise.emoji} {t.exercise.title} — {t.exercise.durationMin} daq
                  </div>
                ))}
                {show.length > list.length && <div className="text-muted">… va yana {show.length - list.length} ta</div>}
              </>
            )}
            <div className="mt-2">Har kuni 15–20 daqiqa — katta natija! 💪</div>
          </div>
          <div className="mt-1 text-right text-[11px] text-faint">{time}</div>
        </div>
      </div>
      <div className="ml-10 mt-1.5 max-w-[88%] rounded-xl bg-white/75 py-2 text-center text-[13px] font-bold text-[#1d8ad6] backdrop-blur-sm">
        ▶️ Mashg‘ulotni boshlash
      </div>
    </div>
  );
}
