"use client";

import { ArrowRight, CalendarDays, MapPin, Play } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { getSession, sessionsForDistrict } from "@/data/sessions";
import { getSpecialist } from "@/data/specialists";
import { districtLabel } from "@/data/regions";
import { ActivityBars, DomainBars } from "@/components/charts/charts";
import { AiInsight } from "@/components/home/daily-tip";
import { TaskRow } from "@/components/home/task-row";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Avatar, EmptyState, Section } from "@/components/ui/misc";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { SESSION_TYPES, SPECIALTIES, WEEKDAYS_SHORT } from "@/lib/constants";
import { dailySeries, todayTasks } from "@/lib/core/stats";
import { useChildData, useIsPremium, useView } from "@/lib/client/hooks";
import { ageOf, formatDate, meetUrl, relativeDay, timeAgo, todayKey } from "@/lib/utils";
import { openExternal } from "@/lib/client/telegram";

const MODULES: { href: string; emoji: string; label: string; color: string }[] = [
  { href: "/child", emoji: "👶", label: "Bola profili", color: "#e7f0fb" },
  { href: "/assessment", emoji: "🧠", label: "Rivojlanish baholash", color: "#fdeee7" },
  { href: "/plan", emoji: "🎯", label: "Individual reja", color: "#e3f6ef" },
  { href: "/exercises?tab=uy", emoji: "🏠", label: "Uy mashqlari", color: "#fdf3dc" },
  { href: "/videos", emoji: "🎥", label: "Videolar", color: "#fcecf2" },
  { href: "/ai", emoji: "✨", label: "AI", color: "#efeaff" },
  { href: "/ai-check", emoji: "📹", label: "AI video nazorat", color: "#e0f2fe" },
  { href: "/exercises?section=logoped", emoji: "🗣️", label: "Logoped", color: "#e7f0fb" },
  { href: "/exercises?section=defektolog", emoji: "🧩", label: "Defektolog", color: "#fdeee7" },
  { href: "/exercises?section=motorika", emoji: "🦶", label: "Motorika va yassi oyoq", color: "#e3f6ef" },
  { href: "/games", emoji: "🎮", label: "O‘yinlar", color: "#fdf3dc" },
  { href: "/speech", emoji: "🎙️", label: "Talaffuz AI", color: "#fcecf2" },
  { href: "/progress", emoji: "📈", label: "Monitoring", color: "#e2f2e2" },
  { href: "/passport", emoji: "📁", label: "Rivojlanish pasporti", color: "#e0f2fe" },
  { href: "/specialists", emoji: "👨‍⚕️", label: "Mutaxassislar", color: "#e7f0fb" },
  { href: "/sessions", emoji: "🏢", label: "Bepul sessiyalar", color: "#fdeee7" },
  { href: "/market", emoji: "🛒", label: "YuniQo Market", color: "#e3f6ef" },
  { href: "/library", emoji: "📚", label: "Bilim bazasi", color: "#fdf3dc" },
  { href: "/community", emoji: "👨‍👩‍👧", label: "Hamjamiyat", color: "#fcecf2" },
  { href: "/achievements", emoji: "🏆", label: "Yutuqlar", color: "#fdf3dc" },
  { href: "/reminders", emoji: "🔔", label: "Eslatmalar", color: "#e0f2fe" },
  { href: "/premium", emoji: "💎", label: "Premium", color: "#efeaff" },
  { href: "/bot", emoji: "🤖", label: "Telegram bot", color: "#e0f2fe" },
  { href: "/about", emoji: "💡", label: "Loyiha haqida", color: "#fdf3dc" },
];

const FLOW = [
  { emoji: "🧠", label: "Bahola", href: "/assessment" },
  { emoji: "🎯", label: "Reja tuz", href: "/plan" },
  { emoji: "🤖", label: "AI bilan mashq qil", href: "/ai" },
  { emoji: "📹", label: "Video orqali tekshir", href: "/ai-check" },
  { emoji: "📊", label: "Natijani yig‘", href: "/progress" },
  { emoji: "👨‍⚕️", label: "Mutaxassisga ko‘rsat", href: "/passport" },
  { emoji: "📈", label: "Rivojlanishni kuzat", href: "/progress" },
  { emoji: "🛒", label: "Kerakli mahsulotni top", href: "/market" },
  { emoji: "👨‍👩‍👧", label: "Hamjamiyatdan yordam ol", href: "/community" },
];

function greeting(): string {
  const h = (new Date().getUTCHours() + 5) % 24;
  if (h < 5) return "Xayrli tun";
  if (h < 11) return "Xayrli tong";
  if (h < 18) return "Xayrli kun";
  return "Xayrli kech";
}

export default function HomePage() {
  const view = useView();
  const premium = useIsPremium();
  const data = useChildData();
  const { child, plan, assignments, activities, latest, first, streak, level, points, notes } = data;

  const tasks = useMemo(() => todayTasks(plan, assignments, activities), [plan, assignments, activities]);
  const done = tasks.filter((t) => t.done).length;
  const week = useMemo(
    () =>
      dailySeries(activities, 7).map((d) => ({
        label: WEEKDAYS_SHORT[d.weekday - 1],
        value: d.count,
        tooltip: formatDate(d.day, { weekday: true }),
      })),
    [activities],
  );

  const upcoming = view.bookings
    .filter((b) => b.status !== "bekor" && b.status !== "otdi" && b.date >= todayKey())
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 3);
  const region = child?.region ?? view.user.region;
  const district = child?.district ?? view.user.district;
  const nearSession = region && district ? sessionsForDistrict(region, district).find((s) => s.date >= todayKey()) : undefined;
  const lastNote = notes[0];
  const noteSp = lastNote ? getSpecialist(lastNote.specialistId) : undefined;

  if (!child) {
    return <EmptyState emoji="👶" title="Bola profili yo‘q" text="Boshlash uchun farzandingiz profilini yarating." action={<Button href="/onboarding">Profil yaratish</Button>} />;
  }
  const firstName = view.user.name.split(" ")[0];

  return (
    <div className="animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[32px] bg-brand-gradient p-5 text-white shadow-brand sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-bold text-white/85">
              {greeting()}, {firstName}! 👋 · {formatDate(todayKey(), { weekday: true })}
            </div>
            <div className="mt-3 flex items-center gap-3.5">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white/95 text-4xl shadow-lg">{child.avatar}</div>
              <div className="min-w-0">
                <div className="truncate text-[26px] font-black leading-tight sm:text-3xl">{child.name}</div>
                <div className="mt-0.5 text-sm font-semibold text-white/90">
                  {ageOf(child.birthDate).label} · {level.emoji} {level.title} · {points} ball
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-extrabold backdrop-blur">🔥 {streak.current} kunlik seriya</span>
              {latest && <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-extrabold backdrop-blur">🧠 Umumiy rivojlanish: {latest.overall}%</span>}
              {premium && <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-extrabold backdrop-blur">💎 Premium</span>}
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-3xl bg-white/15 p-3.5 backdrop-blur sm:flex-col sm:items-center sm:px-6 sm:py-4">
            <ProgressRing value={tasks.length ? done / tasks.length : 0} size={84} stroke={8} color="#ffffff" track="rgb(255 255 255 / 0.25)">
              <div className="text-center leading-none">
                <div className="text-2xl font-black">
                  {done}/{tasks.length}
                </div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/85">bugun</div>
              </div>
            </ProgressRing>
            <Button href="/plan" variant="secondary" className="min-w-0 flex-1 whitespace-normal border-0 text-center leading-tight text-brand-700 sm:flex-none">
              <Play className="h-4 w-4 fill-current" />
              {done === tasks.length && tasks.length ? "Qo‘shimcha mashq" : "Mashg‘ulotni boshlash"}
            </Button>
          </div>
        </div>
      </div>

      {/* YuniQo konsepti */}
      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {FLOW.map((f, i) => (
          <Link
            key={f.label}
            href={f.href}
            className="flex shrink-0 items-center gap-2 rounded-2xl border border-line bg-white py-2 pl-2 pr-3 text-[13px] font-extrabold text-ink-2 shadow-card hover:border-brand-200"
          >
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-brand-50 text-base">{f.emoji}</span>
            <span className="text-faint">{i + 1}.</span>
            {f.label}
            {i < FLOW.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-faint" />}
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        {/* Bugungi reja */}
        <Card className="p-5 lg:col-span-3">
          <CardTitle
            action={
              <Link href="/plan" className="text-sm font-bold text-brand-600">
                To‘liq reja
              </Link>
            }
          >
            🎯 Bugungi mashg‘ulotlar
          </CardTitle>
          {tasks.length ? (
            <>
              <div className="mb-3 flex items-center gap-3">
                <ProgressBar value={done} max={tasks.length} />
                <span className="shrink-0 text-sm font-extrabold text-ink-2 tabular">
                  {done}/{tasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {tasks.slice(0, 5).map((t) => (
                  <TaskRow key={t.exercise.id} task={t} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState emoji="🗓️" title="Bugun reja bo‘sh" text="Rivojlanish baholashidan o‘ting — individual reja avtomatik tuziladi." action={<Button href="/assessment">Baholashni boshlash</Button>} className="py-6" />
          )}
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <AiInsight childId={child.id} />
          {lastNote && noteSp && (
            <Card className="p-5" href="/passport">
              <div className="mb-2 flex items-center gap-3">
                <Avatar name={noteSp.name} color={noteSp.color} size={40} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-ink">{noteSp.name}</div>
                  <div className="text-xs font-semibold text-muted">
                    {SPECIALTIES[noteSp.specialty].label} · {timeAgo(lastNote.at)}
                  </div>
                </div>
              </div>
              <p className="line-clamp-3 text-sm leading-relaxed text-ink-2">💬 {lastNote.text}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Modullar */}
      <Section title="Barcha imkoniyatlar">
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 lg:grid-cols-8">
          {MODULES.map((m) => (
            <Link key={m.href} href={m.href} className="group flex flex-col items-center gap-1.5 rounded-2xl p-1.5 text-center">
              <span
                className="grid h-14 w-14 place-items-center rounded-[20px] text-[26px] shadow-card ring-1 ring-black/[0.03] transition group-hover:-translate-y-0.5 group-hover:shadow-pop"
                style={{ background: m.color }}
              >
                {m.emoji}
              </span>
              <span className="text-[11.5px] font-bold leading-tight text-ink-2">{m.label}</span>
            </Link>
          ))}
        </div>
      </Section>

      <div className="mt-2 grid gap-5 lg:grid-cols-2">
        <Section title="Rivojlanish ko‘rsatkichlari" href="/progress" linkLabel="Batafsil">
          <Card className="p-5">
            {latest ? (
              <>
                <div className="mb-4 flex items-center justify-between text-xs font-bold text-muted">
                  <span>So‘nggi baholash: {formatDate(latest.at)}</span>
                  {first && first.id !== latest.id && <span>▲ birinchi baholashga nisbatan</span>}
                </div>
                <DomainBars scores={latest.scores} previous={first && first.id !== latest.id ? first.scores : undefined} />
              </>
            ) : (
              <EmptyState emoji="🧠" title="Baholash hali o‘tkazilmagan" text="5 daqiqalik savolnoma orqali bolaning rivojlanish profilini oling." action={<Button href="/assessment">Boshlash</Button>} className="py-6" />
            )}
          </Card>
        </Section>

        <Section title="Shu hafta" href="/progress" linkLabel="Monitoring">
          <Card className="p-5">
            <div className="mb-2 flex items-end justify-between">
              <div>
                <div className="text-3xl font-black text-ink">{week.reduce((s, d) => s + d.value, 0)}</div>
                <div className="text-xs font-bold text-muted">mashg‘ulot oxirgi 7 kunda</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-ink">🔥 {streak.current}</div>
                <div className="text-xs font-bold text-muted">kun ketma-ket (rekord {streak.best})</div>
              </div>
            </div>
            <ActivityBars data={week} height={170} />
          </Card>
        </Section>
      </div>

      <div className="mt-2 grid gap-5 lg:grid-cols-2">
        <Section title="Yaqin uchrashuvlar" href="/sessions?tab=my">
          <div className="space-y-2.5">
            {upcoming.length ? (
              upcoming.map((b) => {
                const s = b.sessionId ? getSession(b.sessionId) : undefined;
                const sp = b.specialistId ? getSpecialist(b.specialistId) : undefined;
                return (
                  <Card key={b.id} className="flex items-center gap-3 p-4" href={b.kind === "session" ? "/sessions?tab=my" : `/specialists/${b.specialistId}`}>
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-2xl">{s ? SESSION_TYPES[s.type].emoji : b.mode === "online" ? "💻" : "🏥"}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-extrabold text-ink">{s ? s.title : `${sp?.name} — ${sp ? SPECIALTIES[sp.specialty].label : ""}`}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {relativeDay(b.date)}, {b.time} · {b.kind === "session" ? "bepul sessiya" : b.mode === "online" ? "online" : "offline qabul"}
                      </div>
                    </div>
                    {b.status === "tasdiqlandi" && b.kind === "consultation" && b.mode === "online" ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          openExternal(meetUrl(b.id));
                        }}
                        className="shrink-0 rounded-xl bg-brand-500 px-3 py-2 text-xs font-extrabold text-white shadow-brand"
                      >
                        🎥 Qo‘ng‘iroq
                      </button>
                    ) : (
                      <span className={b.status === "tasdiqlandi" ? "text-xs font-extrabold text-[#006300]" : "text-xs font-extrabold text-[#8a5a00]"}>
                        {b.status === "tasdiqlandi" ? "✅ Tasdiqlandi" : "⏳ Kutilmoqda"}
                      </span>
                    )}
                  </Card>
                );
              })
            ) : (
              <EmptyState emoji="📅" title="Rejalashtirilgan uchrashuv yo‘q" text="Mutaxassisga yoziling yoki bepul sessiyani tanlang." className="py-6" />
            )}
          </div>
        </Section>

        <Section title="Tumaningizda bepul sessiya" href="/sessions">
          {nearSession ? (
            <Card className="overflow-hidden p-0" href="/sessions">
              <div className="flex items-center gap-3 p-4" style={{ background: `${SESSION_TYPES[nearSession.type].color}14` }}>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-card">{SESSION_TYPES[nearSession.type].emoji}</div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold uppercase tracking-wide text-muted">{SESSION_TYPES[nearSession.type].label}</div>
                  <div className="text-[15px] font-extrabold text-ink">{nearSession.title}</div>
                </div>
              </div>
              <div className="space-y-1.5 p-4 text-sm font-semibold text-ink-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-brand-500" />
                  {formatDate(nearSession.date, { weekday: true })}, {nearSession.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-500" />
                  {nearSession.venue}
                </div>
                <div className="pt-2 text-xs font-bold text-muted">
                  {district ? districtLabel(district) : ""} · {nearSession.capacity - nearSession.booked - (view.sessionBookings[nearSession.id] ?? 0)} ta bo‘sh joy
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState emoji="🏢" title="Hududingizni tanlang" text="Profilga tuman kiriting — yaqin sessiyalarni ko‘rsatamiz." className="py-6" />
          )}
        </Section>
      </div>
    </div>
  );
}
