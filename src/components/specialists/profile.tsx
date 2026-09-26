"use client";

import { BadgeCheck, CalendarPlus, ChevronRight, Star, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { districtLabel, regionName } from "@/data/regions";
import { sessionsForRegion } from "@/data/sessions";
import { getSpecialist } from "@/data/specialists";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Avatar, EmojiTile, EmptyState, InfoNote, PageHeader, Skeleton } from "@/components/ui/misc";
import { SESSION_TYPES, SPECIALTIES } from "@/lib/constants";
import { useIsPremium, useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { openExternal } from "@/lib/client/telegram";
import type { Booking, Specialist } from "@/lib/types";
import { cn, formatDate, formatMoney, formatNumber, meetUrl } from "@/lib/utils";
import { calendarToast } from "@/components/sessions/booking-card";
import { BookingStatusBadge } from "@/components/sessions/booking-status";
import { dayLabel, displayStatus, hasStarted, isUpcoming, relativeTag, sortByTime } from "@/components/sessions/booking-utils";
import { CancelBookingSheet } from "@/components/sessions/cancel-sheet";
import { addToCalendar, bookingEvent } from "@/components/sessions/ics";
import { MapBlock } from "@/components/sessions/map-block";
import { BookingSheet } from "./booking-sheet";
import { activeShareWith, firstName, modePrice, nextFree, priceFrom, specialistDays, telegramUrl, type SlotDay } from "./helpers";
import { RatingSummary, ReviewCard } from "./rating";
import { SlotPicker } from "./slot-picker";

const CAPABILITIES: { emoji: string; title: string; text: string; color: string }[] = [
  { emoji: "📊", title: "Natijalarni ko‘rish", text: "Baholash, mashqlar va AI tahlillari bitta hisobotda", color: "#e7f0fb" },
  { emoji: "📝", title: "Individual topshiriq", text: "Bolaga mos uy vazifalarini beradi", color: "#fdeee7" },
  { emoji: "🎯", title: "Mashqlar belgilash", text: "Mashqlar bolaning rejasiga avtomatik qo‘shiladi", color: "#e3f6ef" },
  { emoji: "📈", title: "Natijalarni kuzatish", text: "Har bir bajarilgan mashq va o‘sishni ko‘radi", color: "#fdf3dc" },
  { emoji: "💡", title: "Tavsiya berish", text: "Tavsiyalar sizga Telegram orqali keladi", color: "#fcecf2" },
  { emoji: "📁", title: "Hisobot", text: "Rivojlanish bo‘yicha xulosa va hisobot tayyorlaydi", color: "#e0f2fe" },
  { emoji: "🤝", title: "Ma’lumot almashish", text: "Mutaxassislar o‘rtasida — faqat roziligingiz bilan", color: "#efeaff" },
];

/** /specialists/[id] sahifasi mazmuni */
export function SpecialistProfile({ id }: { id: string }) {
  const sp = getSpecialist(id);
  if (!sp) {
    return (
      <div className="animate-fade-up">
        <PageHeader back="/specialists" title="Mutaxassis topilmadi" />
        <EmptyState
          emoji="🔍"
          title="Bunday mutaxassis topilmadi"
          text="Havola eskirgan bo‘lishi mumkin. Katalogdan boshqa mutaxassisni tanlang."
          action={<Button href="/specialists">👨‍⚕️ Mutaxassislar katalogi</Button>}
        />
      </div>
    );
  }
  return <Profile sp={sp} />;
}

function Profile({ sp }: { sp: Specialist }) {
  const view = useView();
  const params = useSearchParams();
  const premium = useIsPremium();
  const role = useApp((s) => s.role);
  const selfId = useApp((s) => s.specialistId);
  const isSelf = role === "specialist" && selfId === sp.id;

  const spec = SPECIALTIES[sp.specialty];
  const tgUrl = telegramUrl(sp.telegram);
  const price = priceFrom(sp);
  const freeConsult = premium && (view.user.premium.consultationsLeft ?? 0) > 0;

  const days = useMemo(() => specialistDays(sp.id, view.bookings), [sp.id, view.bookings]);
  const next = nextFree(days);
  const [date, setDate] = useState<string | undefined>(() => next?.date ?? days.find((d) => d.slots.length)?.date);
  const [booking, setBooking] = useState<{ date?: string; time?: string; n: number } | null>(() =>
    !isSelf && params.get("book") === "1" ? { n: 1 } : null,
  );
  const [cancel, setCancel] = useState<Booking | null>(null);

  const openBooking = useCallback((d?: string, t?: string) => setBooking({ date: d, time: t, n: Date.now() }), []);
  const closeBooking = useCallback(() => setBooking(null), []);
  const closeCancel = useCallback(() => setCancel(null), []);

  const mine = useMemo(
    () =>
      view.bookings
        .filter((b) => b.kind === "consultation" && b.specialistId === sp.id)
        .sort((a, b) => {
          const ua = isUpcoming(a);
          const ub = isUpcoming(b);
          if (ua !== ub) return ua ? -1 : 1;
          return ua ? sortByTime(a, b) : sortByTime(b, a);
        }),
    [view.bookings, sp.id],
  );
  const sessions = useMemo(
    () => (sp.freeSessions ? sessionsForRegion(sp.region).filter((s) => s.specialistIds.includes(sp.id) && !hasStarted(s.date, s.time)) : []),
    [sp],
  );
  const share = activeShareWith(view.shares, sp.id);
  const shareChild = share ? view.children.find((c) => c.id === share.childId) : undefined;
  const name1 = firstName(sp.name);

  const slots = (
    <SlotsCard
      days={days}
      date={date}
      onDate={setDate}
      next={next}
      price={price}
      freeConsult={freeConsult}
      readOnly={isSelf}
      onPick={(d, t) => openBooking(d, t)}
      onBook={() => openBooking()}
    />
  );

  return (
    <div className="animate-fade-up">
      <PageHeader back="/specialists" title="Mutaxassis profili" subtitle={`${spec.label} · ${regionName(sp.region)}`} />

      {isSelf && (
        <InfoNote emoji="👀" className="mb-4">
          Bu sizning ommaviy profilingiz — ota-onalar uni aynan shunday ko‘radi.
        </InfoNote>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="min-w-0 space-y-5">
          {/* Hero */}
          <Card className="overflow-hidden p-0">
            <div
              className="relative h-24 sm:h-28"
              style={{ background: `linear-gradient(120deg, ${sp.color} 0%, ${sp.color}cc 45%, ${sp.color}55 100%)` }}
            >
              <div className="absolute inset-0 bg-dots opacity-70" />
              <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
                {sp.verified && (
                  <Badge tone="white">
                    <BadgeCheck className="h-3.5 w-3.5 text-brand-500" /> Tasdiqlangan
                  </Badge>
                )}
                {sp.freeSessions && <Badge tone="white">🏢 Bepul sessiyalar</Badge>}
              </div>
            </div>
            <div className="px-4 pb-5 sm:px-6">
              <div className="relative z-10 -mt-12 inline-block rounded-full bg-white p-1.5 shadow-card">
                <Avatar name={sp.name} color={sp.color} size={92} />
              </div>
              <h2 className="mt-2 flex items-center gap-1.5 text-[24px] font-black leading-tight text-ink sm:text-[28px]">
                <span className="min-w-0">{sp.name}</span>
                {sp.verified && <BadgeCheck className="h-6 w-6 shrink-0 text-brand-500" aria-label="Tasdiqlangan mutaxassis" />}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-[15px] font-extrabold text-brand-700">
                  {spec.emoji} {spec.label}
                </span>
                <span className="text-faint">·</span>
                <span className="text-sm font-semibold text-muted">{sp.title}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniStat
                  value={
                    <>
                      <Star className="h-4 w-4" fill="#f5b50a" strokeWidth={0} />
                      {sp.rating.toFixed(1)}
                    </>
                  }
                  label={`${formatNumber(sp.reviewsCount)} ta fikr`}
                />
                <MiniStat value={`${sp.experienceYears} yil`} label="tajriba" />
                <MiniStat
                  value={<span className="text-[13px] leading-tight">{sp.languages.length ? sp.languages.join(", ") : "O‘zbek"}</span>}
                  label="tillar"
                />
              </div>

              {!isSelf && (
                <div className="mt-4 grid grid-cols-1 gap-2 sm:flex">
                  <div className="flex gap-2 sm:flex-1">
                    <Button size="lg" className="flex-1" onClick={() => openBooking()}>
                      📅 Yozilish
                    </Button>
                    {tgUrl && (
                      <Button size="lg" variant="secondary" className="px-4 sm:hidden" onClick={() => openExternal(tgUrl)}>
                        💬 Telegram
                      </Button>
                    )}
                  </div>
                  <Button size="lg" variant="secondary" className="sm:flex-1" href={`/passport?share=${sp.id}`}>
                    📁 Natijalarni ko‘rsatish
                  </Button>
                  {tgUrl && (
                    <Button size="lg" variant="secondary" className="hidden sm:inline-flex" onClick={() => openExternal(tgUrl)}>
                      💬 Telegram
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Shu mutaxassisdagi yozilishlar */}
          {!isSelf && mine.length > 0 && (
            <Card className="p-4 sm:p-5">
              <CardTitle
                action={
                  <Link href="/sessions?tab=my" className="text-sm font-bold text-brand-600 hover:text-brand-700">
                    Barchasi
                  </Link>
                }
              >
                🗓️ Sizning yozilishlaringiz
              </CardTitle>
              <div className="space-y-2">
                {mine.slice(0, 4).map((b) => (
                  <SpBookingRow key={b.id} booking={b} onCancel={setCancel} />
                ))}
              </div>
            </Card>
          )}

          <div className="xl:hidden">{slots}</div>

          {/* Natijalarni ko‘rsatish */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-start gap-3 bg-gradient-to-br from-brand-50 to-white p-4 sm:p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-card">📁</span>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold leading-snug text-ink">Bolaning barcha natijalari — bitta tayyor hisobotda</div>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {name1} birinchi uchrashuvdayoq baholashlar, bajarilgan mashqlar va AI natijalarini ko‘radi — vaqt tejaladi, tavsiyalar aniqroq bo‘ladi.
                </p>
                {share && (
                  <div className="mt-2.5 flex items-start gap-1.5 rounded-xl bg-good/10 px-2.5 py-1.5 text-xs font-extrabold leading-snug text-[#006300] ring-1 ring-good/20">
                    <span>✅</span>
                    <span>
                      {shareChild ? `${shareChild.name}ning pasporti` : "Pasport"} ulashilgan — {formatDate(share.expiresAt)} gacha
                    </span>
                  </div>
                )}
              </div>
            </div>
            {!isSelf && (
              <div className="border-t border-line px-4 py-3 sm:px-5">
                <Button variant="soft" block href={`/passport?share=${sp.id}`}>
                  📁 Natijalarni ko‘rsatish
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>

          {/* Haqida */}
          <Card className="p-4 sm:p-5">
            <CardTitle>👋 Haqida</CardTitle>
            <p className="text-[15px] leading-relaxed text-ink-2">{sp.about}</p>
          </Card>

          {/* Yo‘nalishlar */}
          {sp.approach.length > 0 && (
            <Card className="p-4 sm:p-5">
              <CardTitle>🎯 Yo‘nalishlar</CardTitle>
              <div className="flex flex-wrap gap-2">
                {sp.approach.map((a) => (
                  <span key={a} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700 ring-1 ring-brand-100">
                    {a}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Xizmat turlari */}
          <Card className="p-4 sm:p-5">
            <CardTitle>🧾 Xizmat turlari</CardTitle>
            <div className="space-y-2">
              {sp.services.includes("online") && (
                <ServiceRow emoji="💻" title="Online konsultatsiya" text="Video qo‘ng‘iroq orqali — uydan chiqmasdan" price={modePrice(sp, "online")} />
              )}
              {sp.services.includes("offline") && (
                <ServiceRow emoji="🏥" title="Offline qabul" text={`${sp.workplace}, ${districtLabel(sp.district)}`} price={modePrice(sp, "offline")} />
              )}
              {sp.freeSessions && <ServiceRow emoji="🏢" title="Bepul tuman sessiyalari" text="YuniQo sessiyalarida bepul maslahat beradi" free />}
            </div>
            {freeConsult && !isSelf && (
              <InfoNote emoji="💎" className="mt-3">
                Premium obunangiz bo‘yicha bu oy <b>1 ta konsultatsiya bepul</b>.
              </InfoNote>
            )}
            {sp.freeSessions && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-sm font-extrabold text-ink-2">Yaqin bepul sessiyalar</div>
                  {sessions.length > 3 && (
                    <Link href={`/sessions?region=${sp.region}&district=all`} className="shrink-0 text-sm font-bold text-brand-600 hover:text-brand-700">
                      Barchasi ({sessions.length})
                    </Link>
                  )}
                </div>
                {sessions.length ? (
                  <div className="space-y-2">
                    {sessions.slice(0, 3).map((s) => {
                      const t = SESSION_TYPES[s.type];
                      return (
                        <Link
                          key={s.id}
                          href={`/sessions?session=${encodeURIComponent(s.id)}`}
                          className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5 ring-1 ring-line/70 transition hover:bg-brand-50/60"
                        >
                          <EmojiTile emoji={t.emoji} color={`${t.color}1f`} size={42} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-extrabold text-ink">{s.title}</span>
                            <span className="block truncate text-xs font-semibold text-muted">
                              {formatDate(s.date, { weekday: true })}, {s.time} · {districtLabel(s.district)}
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-muted">
                    Yaqin 4 haftada rejalashtirilgan sessiya yo‘q — yangilari har hafta qo‘shiladi.
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Sertifikatlar */}
          <Card className="p-4 sm:p-5">
            <CardTitle>🎓 Sertifikatlar</CardTitle>
            {sp.certificates.length ? (
              <ul className="space-y-2">
                {[...sp.certificates]
                  .sort((a, b) => b.year - a.year)
                  .map((c) => (
                    <li key={`${c.title}-${c.year}`} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-line/70">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-card">🎓</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold leading-snug text-ink">{c.title}</div>
                        <div className="mt-0.5 text-[13px] font-semibold text-muted">{c.issuer}</div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-white px-2 py-0.5 text-xs font-black text-ink-2 ring-1 ring-line tabular">{c.year}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm font-semibold text-muted">Sertifikatlar hali qo‘shilmagan.</p>
            )}
            {sp.verified && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted">
                <BadgeCheck className="h-4 w-4 text-brand-500" /> Diplom va sertifikatlar YuniQo tomonidan tekshirilgan
              </p>
            )}
          </Card>

          {/* Ish joyi va hudud */}
          <Card className="p-4 sm:p-5">
            <CardTitle>📍 Ish joyi va hudud</CardTitle>
            <MapBlock title={sp.workplace} address={`${districtLabel(sp.district)}, ${regionName(sp.region)}`} color={sp.color} />
            {sp.services.includes("online") && (
              <p className="mt-3 text-sm font-semibold text-muted">💻 Online konsultatsiya — O‘zbekistonning istalgan hududidan.</p>
            )}
          </Card>

          {/* Reyting va fikrlar */}
          <Card className="p-4 sm:p-5">
            <CardTitle>⭐ Reyting va fikrlar</CardTitle>
            <RatingSummary sp={sp} />
            {sp.reviews.length > 0 ? (
              <div className="mt-5 space-y-2.5">
                {sp.reviews.map((r, i) => (
                  <ReviewCard key={`${r.author}-${i}`} review={r} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-muted">Hali yozma fikrlar yo‘q.</p>
            )}
          </Card>

          {/* Platformadagi imkoniyatlar */}
          <Card className="p-4 sm:p-5">
            <CardTitle>🧩 Platformadagi imkoniyatlar</CardTitle>
            <p className="-mt-1 mb-3 text-sm text-muted">{name1} YuniQo orqali bolangiz bilan shunday ishlaydi:</p>
            <div className="grid grid-cols-2 gap-2 [&>*:last-child:nth-child(odd)]:col-span-2">
              {CAPABILITIES.map((c) => (
                <div key={c.title} className="flex flex-col gap-2 rounded-2xl border border-line p-3 sm:flex-row sm:items-start sm:gap-3">
                  <EmojiTile emoji={c.emoji} color={c.color} size={38} />
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-extrabold leading-snug text-ink">{c.title}</div>
                    <div className="mt-0.5 text-xs leading-snug text-muted">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="hidden xl:sticky xl:top-24 xl:block">{slots}</aside>
      </div>

      {booking && (
        <BookingSheet key={booking.n} specialist={sp} initialDate={booking.date} initialTime={booking.time} onClose={closeBooking} />
      )}
      <CancelBookingSheet booking={cancel} onClose={closeCancel} />
    </div>
  );
}

function MiniStat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-2xl bg-slate-50 px-1.5 py-2.5 text-center ring-1 ring-line/70">
      <div className="flex min-h-[24px] items-center justify-center gap-1 text-[16px] font-black leading-tight text-ink">{value}</div>
      <div className="mt-0.5 text-[11px] font-bold text-muted">{label}</div>
    </div>
  );
}

function ServiceRow({ emoji, title, text, price, free }: { emoji: string; title: string; text: string; price?: number; free?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line p-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-xl">{emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="font-extrabold leading-snug text-ink">{title}</div>
        <div className="mt-0.5 text-xs font-semibold leading-snug text-muted">{text}</div>
        <div className="mt-1.5">
          {free ? (
            <span className="inline-block rounded-lg bg-good/10 px-2 py-0.5 text-sm font-black text-[#006300]">Bepul</span>
          ) : (
            <span className="text-[15px] font-black text-brand-700">
              {price ? formatMoney(price) : "Narx kelishiladi"}
              {price && <span className="text-xs font-bold text-muted"> / 1 seans</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SlotsCard({
  days,
  date,
  onDate,
  next,
  price,
  freeConsult,
  readOnly,
  onPick,
  onBook,
}: {
  days: SlotDay[];
  date?: string;
  onDate: (d: string) => void;
  next?: { date: string; time: string };
  price?: number;
  freeConsult: boolean;
  readOnly: boolean;
  onPick: (date: string, time: string) => void;
  onBook: () => void;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <CardTitle
        action={
          next ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-good/10 px-2.5 py-1 text-xs font-extrabold text-[#006300] ring-1 ring-good/20">
              <span className="h-1.5 w-1.5 rounded-full bg-good" />
              {dayLabel(next.date)} {next.time}
            </span>
          ) : undefined
        }
      >
        🕒 Bo‘sh vaqtlar
      </CardTitle>
      <SlotPicker days={days} date={date} onDate={onDate} onTime={(d, t) => !readOnly && onPick(d, t)} gridClassName="grid-cols-4" />
      {!readOnly && (
        <>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3.5 py-2.5 ring-1 ring-line/70">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-muted">Konsultatsiya narxi</div>
              <div className={cn("font-black", freeConsult ? "text-faint line-through" : "text-ink")}>
                {price ? `${formatNumber(price)} so‘mdan` : "Kelishiladi"}
              </div>
            </div>
            {freeConsult && <Badge tone="premium">💎 1 ta bepul</Badge>}
          </div>
          <Button block size="lg" className="mt-3" onClick={onBook}>
            📅 Yozilish
          </Button>
          <p className="mt-2 text-center text-xs font-semibold text-muted">Vaqtni bosing — yozilish oynasi ochiladi</p>
        </>
      )}
    </Card>
  );
}

function SpBookingRow({ booking: b, onCancel }: { booking: Booking; onCancel: (b: Booking) => void }) {
  const view = useView();
  const status = displayStatus(b);
  const active = status === "kutilmoqda" || status === "tasdiqlandi";
  const child = view.children.find((c) => c.id === b.childId);
  const rel = active ? relativeTag(b.date) : undefined;
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border border-line p-3", !active && "bg-slate-50/70")}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-xl">{b.mode === "online" ? "💻" : "🏥"}</span>
      <div className="min-w-0 flex-1">
        <div className="font-extrabold leading-snug text-ink">
          {rel && <span className="text-brand-700">{rel} · </span>}
          {formatDate(b.date, { weekday: true })}, {b.time}
        </div>
        <div className="mt-0.5 text-xs font-semibold leading-snug text-muted">
          {b.mode === "online" ? "Online konsultatsiya" : "Offline qabul"}
          {child ? ` · ${child.avatar} ${child.name}` : ""}
          {b.premium ? " · 💎 Premium" : ""}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <BookingStatusBadge status={status} />
          {status === "tasdiqlandi" && b.mode === "online" && (
            <Button size="sm" className="h-8 px-3" onClick={() => openExternal(meetUrl(b.id))}>
              🎥 Video qo‘ng‘iroq
            </Button>
          )}
          {active && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2.5"
                onClick={() => calendarToast(addToCalendar(bookingEvent(b, child?.name)))}
              >
                <CalendarPlus className="h-4 w-4" />
                Kalendarga
              </Button>
              <Button size="sm" variant="ghost" className="h-8 px-2.5 text-danger hover:bg-danger/10" onClick={() => onCancel(b)}>
                <X className="h-4 w-4" />
                Bekor qilish
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div>
      <Skeleton className="h-14 w-2/3" />
      <div className="mt-2 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
        <Skeleton className="hidden h-96 rounded-3xl xl:block" />
      </div>
    </div>
  );
}
