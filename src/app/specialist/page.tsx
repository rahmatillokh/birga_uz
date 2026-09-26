"use client";

import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { getSession } from "@/data/sessions";
import { SPECIALISTS, getSpecialist } from "@/data/specialists";
import { Sparkline } from "@/components/charts/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { Avatar, EmptyState, PageHeader, Skeleton, StatTile } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { SPECIALTIES } from "@/lib/constants";
import { adherence, latestAssessment } from "@/lib/core/stats";
import { useApp } from "@/lib/client/store";
import { toast } from "@/lib/client/toast";
import type { BookingStatus } from "@/lib/types";
import { ageOf, cn, formatDate, meetUrl, relativeDay, timeAgo, todayKey } from "@/lib/utils";
import { openExternal } from "@/lib/client/telegram";

type Tab = "bemorlar" | "jadval" | "sorovlar";

export default function SpecialistPage() {
  return (
    <Suspense>
      <SpecialistCabinet />
    </Suspense>
  );
}

const STATUS: Record<BookingStatus, { label: string; tone: "warn" | "good" | "gray" | "danger" }> = {
  kutilmoqda: { label: "⏳ Kutilmoqda", tone: "warn" },
  tasdiqlandi: { label: "✅ Tasdiqlangan", tone: "good" },
  bekor: { label: "Bekor qilingan", tone: "danger" },
  otdi: { label: "O‘tdi", tone: "gray" },
};

function SpecialistCabinet() {
  const params = useSearchParams();
  const router = useRouter();
  const spView = useApp((s) => s.spView);
  const specialistId = useApp((s) => s.specialistId);
  const loadSpecialist = useApp((s) => s.loadSpecialist);
  const spAct = useApp((s) => s.spAct);
  const setRole = useApp((s) => s.setRole);
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "bemorlar");

  useEffect(() => {
    setRole("specialist");
    void loadSpecialist();
  }, [loadSpecialist, setRole]);

  useEffect(() => {
    const t = params.get("tab") as Tab | null;
    if (t) setTab(t);
  }, [params]);

  const sp = getSpecialist(specialistId);
  const today = todayKey();
  const bookings = spView?.bookings ?? [];
  const requests = bookings.filter((b) => b.status === "kutilmoqda");
  const todays = bookings.filter((b) => b.date === today && b.status !== "bekor");
  const upcoming = bookings.filter((b) => b.date >= today && b.status !== "bekor");
  const patients = spView?.patients ?? [];
  const activeAsg = patients.reduce((n, p) => n + p.assignments.filter((a) => a.specialistId === specialistId && a.status === "faol").length, 0);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof upcoming>();
    for (const b of upcoming) {
      if (!m.has(b.date)) m.set(b.date, []);
      m.get(b.date)!.push(b);
    }
    return Array.from(m.entries());
  }, [upcoming]);

  async function setStatus(id: string, status: BookingStatus) {
    const r = await spAct({ type: "sp.booking.status", bookingId: id, status });
    if (r.ok) toast.success(status === "tasdiqlandi" ? "Qabul tasdiqlandi — ota-onaga Telegram orqali xabar yuborildi" : "Qabul bekor qilindi", status === "tasdiqlandi" ? "✅" : "❌");
  }

  if (!sp) return null;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Mutaxassis kabineti"
        subtitle={`${formatDate(today, { weekday: true })} · ota-onalar ulashgan bolalar, qabullar va topshiriqlar`}
        actions={
          <Select
            value={specialistId}
            onChange={(e) => {
              void loadSpecialist(e.target.value);
              toast.info(`Demo: ${getSpecialist(e.target.value)?.name} kabineti`, "🩺");
            }}
            className="hidden h-10 w-56 text-sm sm:block"
            aria-label="Demo mutaxassis"
          >
            {SPECIALISTS.filter((s) => ["sp-dilnoza", "sp-jasur", "sp-malika", "sp-nodira"].includes(s.id)).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {SPECIALTIES[s.specialty].label}
              </option>
            ))}
          </Select>
        }
      />

      <Card className="mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <Avatar name={sp.name} color={sp.color} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl font-black text-ink">{sp.name}</span>
            {sp.verified && <Badge tone="good">✔️ Tasdiqlangan</Badge>}
          </div>
          <div className="text-sm font-semibold text-muted">
            {sp.title} · {sp.workplace}
          </div>
          <div className="mt-1 text-sm font-bold text-ink-2">
            ⭐ {sp.rating} ({sp.reviewsCount} ta fikr) · {sp.experienceYears} yil tajriba
          </div>
        </div>
        <Button variant="secondary" href={`/specialists/${sp.id}`}>
          Ommaviy profilim
        </Button>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Bemorlar" value={patients.length} emoji="👶" color="#e0f2fe" hint="ota-onalar ruxsat bergan" />
        <StatTile label="Bugungi qabullar" value={todays.length} emoji="📅" color="#e3f6ef" hint={todays[0] ? `birinchisi ${todays[0].time}` : "bugun bo‘sh"} />
        <StatTile label="Yangi so‘rovlar" value={requests.length} emoji="🔔" color="#fdf3dc" hint="tasdiqlash kutilmoqda" />
        <StatTile label="Faol topshiriqlar" value={activeAsg} emoji="📋" color="#efeaff" hint="bolalarga berilgan" />
      </div>

      <Tabs
        value={tab}
        onChange={(t) => {
          setTab(t);
          router.replace(`/specialist?tab=${t}`, { scroll: false });
        }}
        items={[
          { value: "bemorlar", label: "👶 Bemorlar", count: patients.length },
          { value: "jadval", label: "📅 Qabul jadvali", count: upcoming.length },
          { value: "sorovlar", label: "🔔 So‘rovlar", count: requests.length },
        ]}
        className="mt-5"
      />

      <div className="mt-4">
        {!spView ? (
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : tab === "bemorlar" ? (
          patients.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {patients.map((p) => {
                const last = latestAssessment(p.assessments, p.child.id);
                const firstA = [...p.assessments].sort((a, b) => a.at.localeCompare(b.at))[0];
                const trend = [...p.assessments].sort((a, b) => a.at.localeCompare(b.at)).map((a) => a.overall);
                const lastAct = [...p.activities].sort((a, b) => b.at.localeCompare(a.at))[0];
                const adh = adherence(p.plan, p.assignments, p.activities, 7);
                const myAsg = p.assignments.filter((a) => a.specialistId === specialistId && a.status === "faol").length;
                return (
                  <Link key={p.child.id} href={`/specialist/patients/${p.child.id}`}>
                    <Card className="h-full p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop">
                      <div className="flex items-start gap-3">
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-3xl">{p.child.avatar}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-lg font-black text-ink">{p.child.name}</span>
                            <ChevronRight className="h-5 w-5 text-faint" />
                          </div>
                          <div className="text-xs font-semibold text-muted">
                            {ageOf(p.child.birthDate).label} · ota-ona: {p.parentName}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {p.child.concerns.slice(0, 2).map((c) => (
                              <Badge key={c} tone="warn">
                                {c}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-2xl bg-slate-50 p-2">
                          <div className="text-[11px] font-bold text-muted">Umumiy</div>
                          <div className="flex items-center justify-center gap-1 font-black text-ink">
                            {last ? `${last.overall}%` : "—"}
                            {last && firstA && last.id !== firstA.id && <span className="text-xs text-[#006300]">▲{last.overall - firstA.overall}</span>}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-2">
                          <div className="text-[11px] font-bold text-muted">Rejaga amal</div>
                          <div className="font-black text-ink">{p.activities.length ? `${adh}%` : "—"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-2">
                          <div className="text-[11px] font-bold text-muted">Topshiriqlar</div>
                          <div className="font-black text-ink">{myAsg}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted">
                        <span>{lastAct ? `Oxirgi mashg‘ulot: ${timeAgo(lastAct.at)}` : p.share ? "Faoliyat ma’lumotlari ulashilmagan" : "Faqat qabul ma’lumotlari"}</span>
                        {trend.length > 1 && <Sparkline values={trend} />}
                      </div>
                      {p.share && (
                        <div className="mt-2 text-[11px] font-bold text-[#006300]">🔓 Ulashilgan: {formatDate(p.share.expiresAt)} gacha</div>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState emoji="👶" title="Hali bemorlar yo‘q" text="Ota-onalar rivojlanish pasportini ulashganda yoki qabulga yozilganda shu yerda ko‘rinadi." />
          )
        ) : tab === "jadval" ? (
          grouped.length ? (
            <div className="space-y-5">
              {grouped.map(([date, list]) => (
                <div key={date}>
                  <div className="mb-2 flex items-center gap-2 text-sm font-black text-ink">
                    <CalendarDays className="h-4 w-4 text-brand-500" />
                    {formatDate(date, { weekday: true })} <span className="font-bold text-muted">· {relativeDay(date)}</span>
                  </div>
                  <div className="space-y-2">
                    {list.map((b) => (
                      <BookingRow key={b.id} b={b} onStatus={setStatus} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState emoji="📅" title="Yaqin qabullar yo‘q" />
          )
        ) : requests.length ? (
          <div className="space-y-2">
            {requests.map((b) => (
              <BookingRow key={b.id} b={b} onStatus={setStatus} />
            ))}
          </div>
        ) : (
          <EmptyState emoji="🎉" title="Yangi so‘rovlar yo‘q" text="Barcha so‘rovlar ko‘rib chiqilgan." />
        )}
      </div>
    </div>
  );
}

function BookingRow({
  b,
  onStatus,
}: {
  b: NonNullable<ReturnType<typeof useApp.getState>["spView"]>["bookings"][number];
  onStatus: (id: string, s: BookingStatus) => void;
}) {
  const session = b.sessionId ? getSession(b.sessionId) : undefined;
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="grid h-12 w-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-lg font-black text-brand-700">{b.time}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-ink">{b.childName ?? "—"}</span>
          <span className="text-xs font-semibold text-muted">ota-ona: {b.parentName}</span>
          <Badge tone={STATUS[b.status].tone}>{STATUS[b.status].label}</Badge>
          {b.premium && <Badge tone="premium">💎 Premium</Badge>}
          <Badge tone="gray">{b.source === "bot" ? "🤖 Telegram bot" : "🌐 Web"}</Badge>
        </div>
        <div className="mt-0.5 text-sm text-ink-2">
          {session ? `Bepul sessiya: ${session.title}` : b.mode === "online" ? "💻 Online konsultatsiya" : "🏥 Offline qabul"}
          {b.note ? ` · «${b.note}»` : ""}
        </div>
      </div>
      <div className="flex gap-2">
        {b.childId && (
          <Button size="sm" variant="secondary" href={`/specialist/patients/${b.childId}`}>
            Pasport
          </Button>
        )}
        {b.status === "kutilmoqda" && (
          <>
            <Button size="sm" onClick={() => onStatus(b.id, "tasdiqlandi")}>
              Tasdiqlash
            </Button>
            <Button size="sm" variant="danger" onClick={() => onStatus(b.id, "bekor")}>
              Rad etish
            </Button>
          </>
        )}
        {b.status === "tasdiqlandi" && b.mode === "online" && b.kind === "consultation" && (
          <Button size="sm" onClick={() => openExternal(meetUrl(b.id))}>
            🎥 Video qo‘ng‘iroq
          </Button>
        )}
        {b.status === "tasdiqlandi" && b.date <= todayKey() && (
          <Button size="sm" variant="soft" className={cn()} onClick={() => onStatus(b.id, "otdi")}>
            O‘tkazildi
          </Button>
        )}
      </div>
    </Card>
  );
}
