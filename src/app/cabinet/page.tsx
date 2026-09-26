"use client";

import { ChevronRight, Pencil, Plus, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { getProduct } from "@/data/products";
import { districtLabel, regionName } from "@/data/regions";
import { getSession } from "@/data/sessions";
import { getSpecialist } from "@/data/specialists";
import { safeAct } from "@/components/account/act";
import { BotCard } from "@/components/account/bot-card";
import { BOOKING_STATUS, ORDER_STATUS, PAYMENT_LABEL, premiumInfo, shareState } from "@/components/account/meta";
import { ProfileSheet } from "@/components/account/profile-sheet";
import { ShareList } from "@/components/account/share-list";
import { RoleSwitch } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, EmojiTile, EmptyState, PageHeader, Section } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { MONTHS, SESSION_TYPES, SPECIALTIES } from "@/lib/constants";
import { badgesFor, latestAssessment, levelFor, streakOf, totalPoints } from "@/lib/core/stats";
import { useChildData, useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { openExternal } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { Booking, Child, Order } from "@/lib/types";
import { ageOf, cn, dayKey, daysBetween, formatDate, formatMoney, formatNumber, meetUrl, relativeDay, todayKey } from "@/lib/utils";

export default function CabinetPage() {
  const view = useView();
  const [editing, setEditing] = useState(false);
  const today = todayKey();
  const nowIso = new Date().toISOString();

  const upcoming = view.bookings
    .filter((b) => b.status !== "bekor" && b.status !== "otdi" && b.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const activeShares = view.shares.filter((s) => shareState(s, nowIso) === "active");
  const orders = [...view.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <PageHeader title="Ota-ona kabineti" subtitle="Profil, farzandlar, uchrashuvlar va sozlamalar — bir joyda" emoji="👨‍👩‍👧" />

      <ProfileHeader onEdit={() => setEditing(true)} stats={{ upcoming: upcoming.length, shares: activeShares.length, orders: orders.length }} />

      <Section
        title="Farzandlarim"
        action={
          <Link href="/onboarding?add=1" className="flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700">
            <Plus className="h-4 w-4" />
            Qo‘shish
          </Link>
        }
      >
        <ChildrenGrid />
      </Section>

      <Section title="Tezkor o‘tish">
        <QuickGrid upcoming={upcoming.length} />
      </Section>

      <div className="grid grid-cols-1 items-start gap-x-6 lg:grid-cols-2">
        <Section title="Yaqin uchrashuvlar" href="/sessions?tab=my">
          {upcoming.length ? (
            <div className="space-y-2.5">
              {upcoming.slice(0, 4).map((b) => (
                <BookingRow key={b.id} b={b} />
              ))}
              {upcoming.length > 4 && (
                <Link href="/sessions?tab=my" className="block py-1 text-center text-sm font-bold text-brand-600">
                  Yana {upcoming.length - 4} ta uchrashuv
                </Link>
              )}
            </div>
          ) : (
            <EmptyState
              emoji="📅"
              title="Yaqin uchrashuvlar yo‘q"
              text="Mutaxassis konsultatsiyasiga yoki tumaningizdagi bepul YuniQo sessiyasiga yoziling."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" href="/specialists">
                    Mutaxassis topish
                  </Button>
                  <Button size="sm" variant="secondary" href="/sessions">
                    Bepul sessiyalar
                  </Button>
                </div>
              }
            />
          )}
        </Section>

        <Section title="Buyurtmalarim" href="/market/cart">
          {orders.length ? (
            <div className="space-y-2.5">
              {orders.slice(0, 3).map((o) => (
                <OrderRow key={o.id} o={o} />
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="🛒"
              title="Hali buyurtma yo‘q"
              text="Mutaxassislar tavsiya qilgan rivojlantiruvchi o‘yinchoq va materiallar — YuniQo Market’da."
              action={
                <Button size="sm" href="/market">
                  Marketga o‘tish
                </Button>
              }
            />
          )}
        </Section>
      </div>

      <div className="grid grid-cols-1 items-start gap-x-6 lg:grid-cols-2">
        <Section title="Mutaxassislar bilan ulashilgan" href="/settings" linkLabel="Boshqarish">
          <ShareList shares={view.shares} onlyActive />
        </Section>
        <Section title="Telegram bot">
          <BotCard />
        </Section>
      </div>

      <Section title="Ko‘rgazma uchun: rolni almashtirish">
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-start gap-3">
              <EmojiTile emoji="🔁" color="#fdf3dc" size={46} />
              <div className="min-w-0">
                <div className="font-extrabold text-ink">Ota-ona ↔ mutaxassis kabineti</div>
                <p className="mt-0.5 text-sm leading-snug text-muted">
                  Mutaxassis kabinetida ulashilgan bolalar, topshiriqlar va qabul jadvali ko‘rinadi. Ikkala tomon bitta ma’lumotlar bazasi bilan ishlaydi —
                  o‘zgarishlar darhol ko‘rinadi.
                </p>
                <Link href="/settings#demo" className="mt-1 inline-flex items-center gap-0.5 text-sm font-bold text-brand-600 hover:text-brand-700">
                  Demo boshqaruvi
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <RoleSwitch className="sm:w-72 sm:shrink-0" />
          </div>
        </Card>
      </Section>

      {editing && <ProfileSheet onClose={() => setEditing(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ProfileHeader({ onEdit, stats }: { onEdit: () => void; stats: { upcoming: number; shares: number; orders: number } }) {
  const view = useView();
  const mode = useApp((s) => s.mode);
  const { user } = view;
  const prem = premiumInfo(user.premium);
  const place = [user.district ? districtLabel(user.district) : "", regionName(user.region)].filter(Boolean).join(", ");
  const memberDays = user.createdAt ? Math.max(0, daysBetween(dayKey(user.createdAt), todayKey())) : 0;

  return (
    <Card className="overflow-hidden">
      <div className="relative h-24 overflow-hidden bg-brand-gradient sm:h-28">
        <div
          className="absolute inset-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(rgb(255 255 255 / 0.55) 1px, transparent 1px)", backgroundSize: "14px 14px" }}
        />
        <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-24 h-32 w-32 rounded-full bg-white/10" />
      </div>
      <div className="px-5 pb-5">
        <div className="-mt-11 flex items-end justify-between gap-3">
          <div className="relative rounded-full bg-white p-1 shadow-card">
            <Avatar src={user.photoUrl} name={user.name || "Ota-ona"} size={84} color="#0ea5e9" />
            {prem.active && (
              <span className="absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#8b6cff] to-[#5b3fe0] text-sm ring-[3px] ring-white">
                💎
              </span>
            )}
          </div>
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Tahrirlash
          </Button>
        </div>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-[22px] font-black leading-tight text-ink sm:text-2xl">{user.name || "Ota-ona"}</h2>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-muted">
              <span>📞 {user.phone || "Telefon kiritilmagan"}</span>
              <span>📍 {place || "Hudud tanlanmagan"}</span>
              {user.username && <span>✈️ @{user.username}</span>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {prem.active ? (
                <Link href="/premium">
                  <Badge tone="premium" className="py-1 text-[13px]">
                    💎 {prem.trial ? "Premium sinov" : "Premium"} · {prem.daysText}
                  </Badge>
                </Link>
              ) : (
                <>
                  <Badge tone="gray" className="py-1 text-[13px]">
                    Bepul tarif
                  </Badge>
                  <Link href="/premium" className="text-[13px] font-extrabold text-[#5b3fe0] hover:underline">
                    💎 Premium’ga o‘tish →
                  </Link>
                </>
              )}
              <ModeBadge mode={mode} />
              {memberDays > 0 && <span className="text-[13px] font-semibold text-muted">YuniQo’da {memberDays} kundan beri</span>}
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-line rounded-2xl bg-slate-50 py-3 text-center ring-1 ring-line/70 lg:w-[400px] lg:shrink-0">
            <MiniStat value={view.children.length} label="Farzand" />
            <MiniStat value={stats.upcoming} label="Uchrashuv" />
            <MiniStat value={stats.shares} label="Ruxsat" />
            <MiniStat value={stats.orders} label="Buyurtma" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-1">
      <div className="text-xl font-black leading-none text-ink">{value}</div>
      <div className="mt-1 truncate text-[11px] font-bold text-muted">{label}</div>
    </div>
  );
}

function ModeBadge({ mode }: { mode: string }) {
  if (mode === "telegram") {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e5f3fd] px-2.5 py-1 text-[13px] font-bold text-[#1d8ad6] ring-1 ring-[#cfe8fa]">
        <Send className="h-3.5 w-3.5" />
        Telegram orqali ulangan
      </span>
    );
  }
  return (
    <Link href="/settings#demo">
      <Badge tone={mode === "offline" ? "gray" : "warn"} className="py-1 text-[13px]">
        {mode === "offline" ? "📴 Oflayn rejim" : "🧪 Demo rejim"}
      </Badge>
    </Link>
  );
}

// ---------------------------------------------------------------------------

function ChildrenGrid() {
  const view = useView();
  const router = useRouter();
  const activeId = view.user.activeChildId ?? view.children[0]?.id;

  const rows = useMemo(
    () =>
      view.children.map((c) => {
        const acts = view.activities.filter((a) => a.childId === c.id);
        const points = totalPoints(acts);
        return { child: c, points, level: levelFor(points), streak: streakOf(acts).current, latest: latestAssessment(view.assessments, c.id) };
      }),
    [view],
  );

  const select = async (c: Child, go?: string) => {
    if (c.id !== activeId) {
      const r = await safeAct({ type: "child.select", childId: c.id }, { silent: true });
      if (!r.ok) {
        toast.error(r.error ?? "Tanlab bo‘lmadi");
        return;
      }
      if (!go) toast.success(`Faol profil: ${c.name}`, c.avatar);
    }
    if (go) router.push(go);
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(({ child: c, points, level, streak, latest }) => {
        const active = c.id === activeId;
        return (
          <Card key={c.id} className={cn("flex flex-col p-4", active && "border-brand-300 ring-2 ring-brand-100")}>
            <div className="flex items-start gap-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-[38px] leading-none">{c.avatar}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-lg font-black text-ink">{c.name}</span>
                  {active && <Badge tone="brand">Faol</Badge>}
                </div>
                <div className="text-sm font-semibold text-muted">
                  {ageOf(c.birthDate).label} · {c.gender}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="gray">
                    {level.emoji} {level.title}
                  </Badge>
                  {streak > 0 && <Badge tone="warn">🔥 {streak} kun</Badge>}
                  {latest && latest.overall > 0 && <Badge tone="gray">🧠 {latest.overall}%</Badge>}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2 text-xs font-bold text-muted">
                <span className="text-ink-2">{formatNumber(points)} ball</span>
                <span className="truncate">{level.next ? `${level.next.emoji} ${level.next.title}gacha ${formatNumber(level.toNext)} ball` : "Eng yuqori daraja!"}</span>
              </div>
              <ProgressBar value={level.progress * 100} className="mt-1.5" />
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="soft" className="flex-1" onClick={() => select(c, "/child")}>
                👤 Profil
              </Button>
              {active ? (
                <span className="flex h-9 flex-1 items-center justify-center gap-1 rounded-xl bg-slate-50 text-sm font-bold text-muted ring-1 ring-line">✓ Tanlangan</span>
              ) : (
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => select(c)}>
                  Faol qilish
                </Button>
              )}
            </div>
          </Card>
        );
      })}
      <Link
        href="/onboarding?add=1"
        className="flex min-h-[176px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-brand-200 bg-white/60 p-4 text-center transition hover:border-brand-300 hover:bg-brand-50/60"
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Plus className="h-7 w-7" />
        </span>
        <span className="font-extrabold text-brand-700">Bola qo‘shish</span>
        <span className="max-w-[220px] text-[13px] text-muted">Har bir farzand uchun alohida baholash, reja va progress</span>
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------

function QuickGrid({ upcoming }: { upcoming: number }) {
  const view = useView();
  const { activities, assessments } = useChildData();
  const prem = premiumInfo(view.user.premium);
  const r = view.user.reminders;
  const earned = useMemo(() => badgesFor(activities, assessments, view.bookings).filter((b) => b.earned).length, [activities, assessments, view.bookings]);

  const items: { href: string; label: string; emoji: string; color: string; hint?: string }[] = [
    { href: "/child", label: "Bola profili", emoji: "👶", color: "#e0f2fe" },
    { href: "/passport", label: "Rivojlanish pasporti", emoji: "📁", color: "#e7f0fb" },
    { href: "/plan", label: "Individual reja", emoji: "🎯", color: "#fdeee7" },
    { href: "/progress", label: "Progress", emoji: "📈", color: "#e3f6ef" },
    { href: "/achievements", label: "Yutuqlar", emoji: "🏆", color: "#fdf3dc", hint: earned ? `${earned} ta` : undefined },
    { href: "/specialists", label: "Mutaxassislar", emoji: "👨‍⚕️", color: "#fcecf2" },
    { href: "/sessions?tab=my", label: "Sessiyalar", emoji: "📅", color: "#e2f2e2", hint: upcoming ? `${upcoming} ta yaqin` : undefined },
    { href: "/market/cart", label: "Market", emoji: "🛒", color: "#fff1e6" },
    { href: "/reminders", label: "Eslatmalar", emoji: "🔔", color: "#fef6d8", hint: r.enabled ? r.time : "O‘chiq" },
    { href: "/premium", label: "Premium", emoji: "💎", color: "#efeaff", hint: prem.active ? (prem.until ? `${prem.daysLeft} kun` : "Faol") : "Bepul" },
    { href: "/settings", label: "Xavfsizlik", emoji: "🔐", color: "#eef2f7" },
    { href: "/help", label: "Yordam", emoji: "❓", color: "#e0f2fe" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="group flex flex-col items-center gap-2 rounded-3xl border border-line bg-white px-2 pb-3 pt-3.5 text-center shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop"
        >
          <EmojiTile emoji={it.emoji} color={it.color} size={46} className="transition group-hover:scale-105" />
          <span className="text-[13px] font-extrabold leading-tight text-ink">{it.label}</span>
          {it.hint && <span className="-mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-muted">{it.hint}</span>}
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

function DateTile({ date, time }: { date: string; time: string }) {
  const [, m, d] = date.split("-").map(Number);
  return (
    <div className="w-14 shrink-0 overflow-hidden rounded-2xl bg-brand-50 text-center ring-1 ring-brand-100">
      <div className="bg-brand-500 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">{MONTHS[m - 1]?.slice(0, 3)}</div>
      <div className="pt-1 text-xl font-black leading-none text-ink">{d}</div>
      <div className="pb-1.5 pt-0.5 text-[11px] font-bold text-brand-700">{time}</div>
    </div>
  );
}

function BookingRow({ b }: { b: Booking }) {
  const view = useView();
  const child = view.children.find((c) => c.id === b.childId);
  const st = BOOKING_STATUS[b.status];
  let title: string;
  let sub: string;
  let href: string;
  let tag: string;
  if (b.kind === "session") {
    const s = b.sessionId ? getSession(b.sessionId) : undefined;
    title = s?.title ?? "Bepul YuniQo sessiyasi";
    sub = s ? `${SESSION_TYPES[s.type].emoji} ${s.venue}` : "Bepul tuman sessiyasi";
    href = "/sessions?tab=my";
    tag = "Bepul sessiya";
  } else {
    const sp = getSpecialist(b.specialistId);
    title = sp?.name ?? "Mutaxassis";
    sub = `${sp ? SPECIALTIES[sp.specialty].label : "Konsultatsiya"} · ${b.mode === "online" ? "💻 Online" : "🏥 Offline qabul"}`;
    href = sp ? `/specialists/${sp.id}` : "/specialists";
    tag = "Konsultatsiya";
  }
  const joinable = b.kind === "consultation" && b.mode === "online" && b.status === "tasdiqlandi";
  return (
    <div className="relative flex items-center gap-3 rounded-3xl border border-line bg-white p-3 shadow-card transition hover:border-brand-200">
      <Link href={href} className="absolute inset-0 rounded-3xl" aria-label={title} />
      <DateTile date={b.date} time={b.time} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-brand-600">{tag}</span>
          <span className="shrink-0 text-xs font-bold text-muted">{relativeDay(b.date)}</span>
        </div>
        <div className="truncate font-extrabold text-ink">{title}</div>
        <div className="truncate text-[13px] text-muted">{sub}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge tone={st.tone}>
            {st.emoji} {st.label}
          </Badge>
          {b.premium && <Badge tone="premium">💎 Premium</Badge>}
          {child && (
            <Badge tone="gray">
              {child.avatar} {child.name}
            </Badge>
          )}
          {joinable && (
            <button
              type="button"
              onClick={() => openExternal(meetUrl(b.id))}
              className="relative z-10 ml-auto rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-extrabold text-white shadow-brand transition hover:bg-brand-600"
            >
              🎥 Qo‘ng‘iroqqa qo‘shilish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const ORDER_STEPS: Order["status"][] = ["qabul_qilindi", "yigilmoqda", "yolda", "yetkazildi"];

function OrderRow({ o }: { o: Order }) {
  const st = ORDER_STATUS[o.status];
  const products = o.items.map((i) => getProduct(i.productId)).filter((p): p is NonNullable<typeof p> => !!p);
  const count = o.items.reduce((s, i) => s + i.qty, 0);
  const step = ORDER_STEPS.indexOf(o.status);
  return (
    <div className="rounded-3xl border border-line bg-white p-3.5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 -space-x-3">
          {(products.length ? products.slice(0, 3) : [null]).map((p, i) => (
            <span
              key={p?.id ?? i}
              className="grid h-11 w-11 place-items-center rounded-2xl text-[22px] ring-2 ring-white"
              style={{ background: p?.color ?? "#fff1e6" }}
            >
              {p?.emoji ?? "📦"}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-extrabold text-ink">Buyurtma #{o.id.replace(/^or-/, "")}</span>
            <span className="shrink-0 font-black text-ink">{formatMoney(o.total)}</span>
          </div>
          <div className="truncate text-[13px] text-muted">
            {formatDate(o.createdAt)} · {count} ta mahsulot · {PAYMENT_LABEL[o.payment]}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Badge tone={st.tone}>
          {st.emoji} {st.label}
        </Badge>
        <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden>
          {ORDER_STEPS.map((s, i) => (
            <div key={s} className={cn("h-1.5 rounded-full", i <= step ? "bg-brand-400" : "bg-slate-200")} />
          ))}
        </div>
      </div>
      {products[0] && (
        <div className="mt-2 truncate text-xs font-semibold text-muted">
          {products[0].title}
          {products.length > 1 ? ` va yana ${products.length - 1} ta` : ""}
        </div>
      )}
    </div>
  );
}
