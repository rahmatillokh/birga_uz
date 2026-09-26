"use client";

import { BadgeCheck, CalendarDays, CalendarPlus, ChevronRight, Clock, QrCode, Ticket, Users, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, EmojiTile, InfoNote } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { SESSION_TYPES, SPECIALTIES } from "@/lib/constants";
import { useActiveChild, useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { Booking, FreeSession, SessionType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { calendarToast } from "./booking-card";
import { addMinutes, durationLabel, hasStarted, relativeTag } from "./booking-utils";
import { ChildPicker } from "./child-picker";
import { addToCalendar, bookingEvent } from "./ics";
import { MapBlock } from "./map-block";
import { SeatsBar, seatsOf, sessionSpecialists } from "./session-card";

const WHAT_HAPPENS: Record<SessionType, string[]> = {
  konsultatsiya: [
    "Mutaxassis bola bilan qisqa suhbat va o‘yin orqali tanishadi",
    "Nutq, diqqat va motorika bo‘yicha dastlabki xulosa beriladi",
    "Uyda davom ettirish uchun aniq tavsiyalar olasiz",
  ],
  seminar: [
    "Mavzu bo‘yicha qisqa va tushunarli ma’ruza",
    "Uyda qilinadigan amaliy mashqlar namoyishi",
    "Savol-javob — o‘z savollaringizni bering",
  ],
  amaliy: [
    "Bolalar o‘yin shaklida guruhda mashq qiladi",
    "Ota-onalar mashqlarni to‘g‘ri bajarishni ko‘radi",
    "Uy topshiriqlari ilovaga qo‘shiladi",
  ],
  uchrashuv: [
    "Bir nechta mutaxassis bilan jonli muloqot",
    "Hududdagi ota-onalar bilan tanishish va tajriba almashish",
    "Savollaringizga amaliy javoblar",
  ],
};

const EXTRA_BRING: Record<SessionType, { emoji: string; text: string }> = {
  konsultatsiya: { emoji: "🧸", text: "Bolaning sevimli o‘yinchog‘i — tanishuv osonroq kechadi" },
  seminar: { emoji: "📝", text: "Daftar va oldindan yozib olingan savollaringiz" },
  amaliy: { emoji: "🧦", text: "Almashtirish uchun paypoq yoki yengil poyabzal" },
  uchrashuv: { emoji: "📝", text: "Mutaxassislarga beriladigan savollaringiz" },
};

function Fact({ icon: Icon, label, value, hint }: { icon: typeof Clock; label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-line/70">
      <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted">
        <Icon className="h-3.5 w-3.5 text-brand-500" aria-hidden />
        {label}
      </div>
      <div className="mt-1 text-[14.5px] font-extrabold leading-snug text-ink">{value}</div>
      {hint && <div className="text-xs font-semibold text-muted">{hint}</div>}
    </div>
  );
}

/** Sessiya tafsilotlari va yozilish oynasi (ota komponent `key={session.id}` bilan chiqaradi) */
export function SessionSheet({
  session,
  onClose,
  onCancel,
}: {
  session: FreeSession;
  onClose: () => void;
  onCancel?: (b: Booking) => void;
}) {
  const view = useView();
  const act = useApp((s) => s.act);
  const activeChild = useActiveChild();
  const [childId, setChildId] = useState<string | undefined>(activeChild?.id);
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  const t = SESSION_TYPES[session.type];
  const extra = view.sessionBookings[session.id] ?? 0;
  const { left } = seatsOf(session, extra);
  const full = left <= 0;
  const started = hasStarted(session.date, session.time);
  const myBooking = view.bookings.find((b) => b.kind === "session" && b.sessionId === session.id && b.status !== "bekor");
  const bookedChild = view.children.find((c) => c.id === myBooking?.childId);
  const sps = sessionSpecialists(session);
  const rel = relativeTag(session.date);
  const end = addMinutes(session.time, session.durationMin);

  async function book() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await act({
        type: "booking.create",
        kind: "session",
        sessionId: session.id,
        mode: "offline",
        date: session.date,
        time: session.time,
        childId,
      });
      if (r.ok) {
        haptic("success");
        setDoneId(r.createdId ?? "ok");
      } else {
        toast.error(r.error ?? "Yozilib bo‘lmadi. Qayta urinib ko‘ring");
      }
    } catch {
      toast.error("Internet aloqasini tekshirib, qayta urinib ko‘ring");
    } finally {
      setBusy(false);
    }
  }

  const toCalendar = (b: Booking | undefined) => {
    if (!b) return;
    calendarToast(addToCalendar(bookingEvent(b, view.children.find((c) => c.id === b.childId)?.name)));
  };

  // ------------------------------------------------------------------ Muvaffaqiyat holati
  if (doneId) {
    const b = view.bookings.find((x) => x.id === doneId) ?? myBooking;
    const kid = view.children.find((c) => c.id === (b?.childId ?? childId));
    return (
      <Sheet
        open
        onClose={onClose}
        title="Yozilish tasdiqlandi"
        footer={
          <div className="flex gap-2">
            {b && (
              <Button variant="secondary" block onClick={() => toCalendar(b)}>
                <CalendarPlus className="h-4 w-4" />
                Kalendarga qo‘shish
              </Button>
            )}
            <Button block onClick={onClose}>
              Tayyor
            </Button>
          </div>
        }
      >
        <div className="pb-1 pt-2 text-center">
          <div className="mx-auto grid h-20 w-20 animate-pop place-items-center rounded-full bg-good/10 text-4xl">🎉</div>
          <div className="mt-3 text-xl font-black text-ink">Siz yozildingiz!</div>
          <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-muted">
            Joyingiz band qilindi. Telegram bot sessiyadan bir kun oldin eslatadi.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-line/70">
          <EmojiTile emoji={t.emoji} color={`${t.color}1f`} size={48} />
          <div className="min-w-0">
            <div className="line-clamp-2 font-extrabold leading-snug text-ink">{session.title}</div>
            <div className="mt-0.5 text-sm font-semibold text-muted">
              {formatDate(session.date, { weekday: true })}, {session.time} · {session.venue}
            </div>
            {kid && (
              <div className="mt-0.5 text-sm font-semibold text-ink-2">
                {kid.avatar} {kid.name} bilan
              </div>
            )}
          </div>
        </div>
        <InfoNote emoji="📱" className="mt-3">
          Kirishda bolaning <b>rivojlanish pasporti QR kodini</b> ko‘rsating — mutaxassislar natijalarni darhol ko‘radi.
        </InfoNote>
      </Sheet>
    );
  }

  // ------------------------------------------------------------------ Tafsilotlar
  const footer = myBooking ? (
    <div className="flex gap-2">
      <Button variant="secondary" block onClick={() => toCalendar(myBooking)}>
        <CalendarPlus className="h-4 w-4" />
        Kalendarga qo‘shish
      </Button>
      <Button variant="soft" block onClick={onClose}>
        Yopish
      </Button>
    </div>
  ) : started ? (
    <Button block disabled>
      Sessiya boshlangan
    </Button>
  ) : full ? (
    <Button block disabled>
      Joy qolmadi — boshqa sanani tanlang
    </Button>
  ) : (
    <Button block size="lg" loading={busy} onClick={book}>
      🎟️ Bepul yozilish
    </Button>
  );

  return (
    <Sheet open onClose={onClose} title="Sessiya tafsilotlari" footer={footer}>
      <div className="space-y-5">
        {/* Sarlavha */}
        <div className="flex items-start gap-3">
          <EmojiTile emoji={t.emoji} color={`${t.color}1f`} size={56} />
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: t.color }}>
              {t.label} · bepul
            </div>
            <h2 className="mt-0.5 text-lg font-black leading-snug text-ink">{session.title}</h2>
          </div>
        </div>

        {/* Asosiy ma’lumotlar */}
        <div className="grid grid-cols-2 gap-2">
          <Fact icon={CalendarDays} label="Sana" value={formatDate(session.date, { weekday: true })} hint={rel} />
          <Fact icon={Clock} label="Vaqt" value={`${session.time}–${end}`} hint={durationLabel(session.durationMin)} />
          <Fact icon={Users} label="Kimlar uchun" value={session.ageRange} />
          <Fact icon={Ticket} label="Joylar" value={full ? "Joy qolmadi" : `${left} ta bo‘sh`} hint={`jami ${session.capacity} ta joy`} />
        </div>
        <SeatsBar session={session} extra={extra} />

        {/* Yozilgan bo‘lsa */}
        {myBooking && (
          <div className="flex items-center gap-3 rounded-2xl bg-good/10 p-3 ring-1 ring-good/20">
            <span className="text-2xl">✅</span>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-[#006300]">Siz bu sessiyaga yozilgansiz</div>
              <div className="text-xs font-semibold text-ink-2">
                {bookedChild ? `${bookedChild.avatar} ${bookedChild.name} bilan · ` : ""}Telegram bot bir kun oldin eslatadi
              </div>
            </div>
            {onCancel && (
              <Button size="sm" variant="ghost" className="shrink-0 text-danger hover:bg-danger/10" onClick={() => onCancel(myBooking)}>
                <X className="h-4 w-4" />
                Bekor
              </Button>
            )}
          </div>
        )}

        {/* Tavsif */}
        <div>
          <h3 className="mb-1.5 text-[15px] font-extrabold text-ink">Sessiya haqida</h3>
          <p className="text-[14.5px] leading-relaxed text-ink-2">{session.description}</p>
          <ul className="mt-2.5 space-y-1.5">
            {WHAT_HAPPENS[session.type].map((w) => (
              <li key={w} className="flex items-start gap-2 text-sm text-ink-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.color }} />
                {w}
              </li>
            ))}
          </ul>
        </div>

        {/* Mutaxassislar */}
        {sps.length > 0 && (
          <div>
            <h3 className="mb-2 text-[15px] font-extrabold text-ink">Mutaxassislar</h3>
            <div className="space-y-2">
              {sps.map((sp) => (
                <Link
                  key={sp.id}
                  href={`/specialists/${sp.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line p-2.5 transition hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <Avatar name={sp.name} color={sp.color} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 font-extrabold text-ink">
                      <span className="truncate">{sp.name}</span>
                      {sp.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" aria-label="Tasdiqlangan" />}
                    </span>
                    <span className="block truncate text-xs font-semibold text-muted">
                      {SPECIALTIES[sp.specialty].emoji} {SPECIALTIES[sp.specialty].label} · ⭐ {sp.rating.toFixed(1)}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Nima olib kelish kerak */}
        <div>
          <h3 className="mb-2 text-[15px] font-extrabold text-ink">O‘zingiz bilan olib keling</h3>
          <div className="space-y-2">
            <Link
              href="/passport"
              className="flex items-center gap-3 rounded-2xl bg-brand-50 p-3 ring-1 ring-brand-100 transition hover:bg-brand-100/70"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-card">
                <QrCode className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="block font-extrabold text-ink">Bolaning rivojlanish pasporti QR kodi — ilovada</span>
                <span className="block text-xs font-semibold text-muted">Mutaxassis barcha baholar va AI natijalarini bir zumda ko‘radi</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-brand-400" />
            </Link>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-ink-2 ring-1 ring-line/70">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-card">👕</span>
              Qulay kiyim
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-ink-2 ring-1 ring-line/70">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-card">
                {EXTRA_BRING[session.type].emoji}
              </span>
              {EXTRA_BRING[session.type].text}
            </div>
          </div>
        </div>

        {/* Manzil */}
        <div>
          <h3 className="mb-2 text-[15px] font-extrabold text-ink">Manzil</h3>
          <MapBlock title={session.venue} address={session.address} color={t.color} />
        </div>

        {/* Yozilish */}
        {!myBooking && !started && !full && (
          <div className="space-y-3 rounded-3xl border border-brand-100 bg-brand-50/50 p-4">
            <ChildPicker value={childId} onChange={setChildId} label="Kim bilan borasiz?" />
            <p className="text-xs font-semibold leading-relaxed text-muted">
              🎁 Sessiya mutlaqo bepul. Yozilgach, Telegram bot sizga sessiyadan bir kun oldin eslatadi.
            </p>
          </div>
        )}
      </div>
    </Sheet>
  );
}
