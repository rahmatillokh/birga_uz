"use client";

import { BadgeCheck, CalendarPlus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Avatar, InfoNote } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { SPECIALTIES } from "@/lib/constants";
import { useActiveChild, useIsPremium, useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { Specialist } from "@/lib/types";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { calendarToast } from "@/components/sessions/booking-card";
import { ChildPicker } from "@/components/sessions/child-picker";
import { addToCalendar, bookingEvent } from "@/components/sessions/ics";
import { activeShareWith, firstName, modePrice, slotKey, specialistDays } from "./helpers";
import { SlotPicker } from "./slot-picker";

type Mode = "online" | "offline";

const MODE_META: Record<Mode, { emoji: string; label: string; hint: string }> = {
  online: { emoji: "💻", label: "Online", hint: "Video qo‘ng‘iroq orqali" },
  offline: { emoji: "🏥", label: "Offline", hint: "Mutaxassis qabulxonasida" },
};

/**
 * Konsultatsiyaga yozilish oynasi. Ota komponent uni faqat ochiq holatda va
 * yangi `key` bilan chiqaradi — shunda har safar holat toza boshlanadi.
 */
export function BookingSheet({
  specialist: sp,
  initialDate,
  initialTime,
  onClose,
}: {
  specialist: Specialist;
  initialDate?: string;
  initialTime?: string;
  onClose: () => void;
}) {
  const view = useView();
  const premium = useIsPremium();
  const act = useApp((s) => s.act);
  const activeChild = useActiveChild();

  const [busyKeys, setBusyKeys] = useState<Set<string>>(() => new Set());
  const days = useMemo(() => specialistDays(sp.id, view.bookings, busyKeys), [sp.id, view.bookings, busyKeys]);
  const modes: Mode[] = sp.services.length ? sp.services : ["online"];

  const [childId, setChildId] = useState<string | undefined>(activeChild?.id);
  const [mode, setMode] = useState<Mode>(modes[0]);
  const [date, setDate] = useState<string | undefined>(
    () => initialDate ?? days.find((d) => d.slots.some((s) => s.state === "free"))?.date ?? days[0]?.date,
  );
  const [time, setTime] = useState<string | undefined>(initialTime);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  const spec = SPECIALTIES[sp.specialty];
  const freeConsult = premium && (view.user.premium.consultationsLeft ?? 0) > 0;
  const price = modePrice(sp, mode);
  const consent = view.user.consents.shareWithSpecialists;
  const child = view.children.find((c) => c.id === childId);
  const existingShare = activeShareWith(view.shares, sp.id, childId);
  const slotFree = !!date && !!time && !!days.find((d) => d.date === date)?.slots.some((s) => s.time === time && s.state === "free");

  async function submit() {
    if (!date || !time || !slotFree || sending) return;
    setSending(true);
    try {
      const r = await act({
        type: "booking.create",
        kind: "consultation",
        specialistId: sp.id,
        mode,
        date,
        time,
        childId,
        note: note.trim() || undefined,
      });
      if (r.ok) {
        haptic("success");
        setDoneId(r.createdId ?? "ok");
      } else {
        toast.error(r.error ?? "So‘rovni yuborib bo‘lmadi");
        if (r.error && /band/i.test(r.error)) {
          // Boshqa oila allaqachon band qilgan vaqt — belgilab qo‘yamiz
          setBusyKeys((prev) => new Set(prev).add(slotKey(date, time)));
          setTime(undefined);
        }
      }
    } catch {
      toast.error("Internet aloqasini tekshirib, qayta urinib ko‘ring");
    } finally {
      setSending(false);
    }
  }

  // ------------------------------------------------------------------ Muvaffaqiyat
  if (doneId) {
    const b = view.bookings.find((x) => x.id === doneId);
    const kid = view.children.find((c) => c.id === (b?.childId ?? childId));
    const shared = kid ? activeShareWith(view.shares, sp.id, kid.id) : undefined;
    const bDate = b?.date ?? date;
    const bMode = b?.mode ?? mode;
    return (
      <Sheet
        open
        onClose={onClose}
        title="Konsultatsiyaga yozilish"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" block href="/sessions?tab=my">
              Yozilishlarim
            </Button>
            <Button block onClick={onClose}>
              Tayyor
            </Button>
          </div>
        }
      >
        <div className="pb-1 pt-2 text-center">
          <div className="mx-auto grid h-20 w-20 animate-pop place-items-center rounded-full bg-good/10 text-4xl">📨</div>
          <div className="mt-3 text-xl font-black text-ink">So‘rov yuborildi!</div>
          <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-muted">Mutaxassis tasdiqlagach Telegram orqali xabar olasiz</p>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 ring-1 ring-line/70">
          <div className="flex items-center gap-3">
            <Avatar name={sp.name} color={sp.color} size={44} />
            <div className="min-w-0">
              <div className="truncate font-extrabold text-ink">{sp.name}</div>
              <div className="truncate text-xs font-semibold text-muted">
                {spec.emoji} {spec.label}
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-ink-2">
            {bDate && (
              <div>
                📅 <b>{formatDate(bDate, { weekday: true })}</b>, {b?.time ?? time}
              </div>
            )}
            <div>
              {MODE_META[bMode].emoji} {bMode === "online" ? "Online konsultatsiya" : "Offline qabul"}
            </div>
            {kid && (
              <div>
                {kid.avatar} {kid.name} uchun
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="warn">⏳ Tasdiq kutilmoqda</Badge>
            {b?.premium && <Badge tone="premium">💎 Premium — bepul</Badge>}
          </div>
        </div>

        {shared && kid && (
          <InfoNote emoji="📁" className="mt-3">
            {kid.name}ning rivojlanish pasporti {firstName(sp.name)} bilan {formatDate(shared.expiresAt)} gacha ulashilgan — mutaxassis natijalarni oldindan
            ko‘rib chiqadi.
          </InfoNote>
        )}

        {b && (
          <Button variant="ghost" block className="mt-3" onClick={() => calendarToast(addToCalendar(bookingEvent(b, kid?.name)))}>
            <CalendarPlus className="h-4 w-4" />
            Kalendarga qo‘shish
          </Button>
        )}
      </Sheet>
    );
  }

  // ------------------------------------------------------------------ Forma
  return (
    <Sheet
      open
      onClose={onClose}
      title="Konsultatsiyaga yozilish"
      footer={
        <Button block size="lg" loading={sending} disabled={!slotFree} onClick={submit}>
          {slotFree ? (freeConsult ? "💎 Bepul so‘rov yuborish" : "So‘rov yuborish") : "Vaqtni tanlang"}
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Mutaxassis */}
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-line/70">
          <Avatar name={sp.name} color={sp.color} size={48} />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="truncate font-extrabold text-ink">{sp.name}</span>
              {sp.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" aria-label="Tasdiqlangan" />}
            </div>
            <div className="truncate text-xs font-semibold text-muted">
              {spec.emoji} {spec.label} · ⭐ {sp.rating.toFixed(1)} · {sp.experienceYears} yil tajriba
            </div>
          </div>
        </div>

        <ChildPicker value={childId} onChange={setChildId} />

        {/* Konsultatsiya turi */}
        <div>
          <div className="mb-1.5 text-sm font-bold text-ink-2">Konsultatsiya turi</div>
          <div className={cn("grid gap-2", modes.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {modes.map((m) => {
              const on = m === mode;
              const p = modePrice(sp, m);
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-2xl border p-3 text-left transition",
                    on ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-line bg-white hover:border-brand-200",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{MODE_META[m].emoji}</span>
                    <span className="font-extrabold text-ink">{MODE_META[m].label}</span>
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-muted">{MODE_META[m].hint}</div>
                  {freeConsult ? (
                    <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 text-sm font-black">
                      {p && <span className="text-faint line-through">{formatMoney(p)}</span>}
                      <span className="text-[#5b3fe0]">💎 Bepul</span>
                    </div>
                  ) : (
                    <div className="mt-1.5 text-sm font-black text-ink">{p ? formatMoney(p) : "Narx kelishiladi"}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sana va vaqt */}
        <div>
          <div className="mb-1.5 text-sm font-bold text-ink-2">Sana va vaqt</div>
          <SlotPicker
            days={days}
            date={date}
            time={time}
            onDate={(d) => {
              setDate(d);
              setTime(undefined);
            }}
            onTime={(d, t) => {
              setDate(d);
              setTime(t);
            }}
          />
        </div>

        {/* Izoh */}
        <div>
          <label htmlFor="bk-note" className="mb-1.5 block text-sm font-bold text-ink-2">
            Mutaxassisga izoh <span className="font-semibold text-faint">(ixtiyoriy)</span>
          </label>
          <Textarea
            id="bk-note"
            value={note}
            maxLength={400}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Masalan: «R» tovushini talaffuz qilishda qiynalyapti, uy mashqlari bo‘yicha maslahat kerak"
          />
        </div>

        {/* Rozilik */}
        {consent ? (
          <div className="flex items-start gap-2.5 rounded-2xl bg-good/10 p-3 ring-1 ring-good/20">
            <span className="text-lg leading-none">✅</span>
            <div className="text-sm leading-snug">
              <div className="font-extrabold text-ink">Bolaning rivojlanish pasporti mutaxassisga ulashiladi (30 kun)</div>
              <div className="mt-0.5 text-xs font-semibold text-ink-2">
                {existingShare ? `Allaqachon ulashilgan — ${formatDate(existingShare.expiresAt)} gacha. ` : "Baholash, mashqlar va AI natijalari. "}
                <Link href="/settings" className="font-extrabold text-brand-600 hover:text-brand-700">
                  Sozlamalar
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3 ring-1 ring-line">
            <span className="text-lg leading-none">🔒</span>
            <div className="text-sm leading-snug">
              <div className="font-extrabold text-ink">Natijalar avtomatik ulashilmaydi</div>
              <div className="mt-0.5 text-xs font-semibold text-ink-2">
                Mutaxassisga ulashish sozlamalarda o‘chirilgan.{" "}
                <Link href="/settings" className="font-extrabold text-brand-600 hover:text-brand-700">
                  Yoqish
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Narx */}
        {freeConsult ? (
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#f4f0ff] to-white p-3.5 ring-1 ring-[#e4dcff]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#efeaff] text-xl">💎</span>
            <div className="min-w-0">
              <div className="font-extrabold text-[#5b3fe0]">Premium: bepul konsultatsiya (oyiga 1 ta)</div>
              <div className="text-xs font-semibold text-muted">
                Bu konsultatsiya uchun to‘lov olinmaydi{price ? ` (odatda ${formatMoney(price)})` : ""}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-line/70">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-muted">1 seans narxi</span>
              <span className="text-lg font-black text-ink">{price ? formatMoney(price) : "Kelishiladi"}</span>
            </div>
            <p className="mt-1 text-xs leading-snug text-muted">
              Hozir hech narsa to‘lanmaydi — avval mutaxassis vaqtni tasdiqlaydi.{" "}
              {!premium && (
                <Link href="/premium" className="font-extrabold text-[#5b3fe0]">
                  💎 Premium bilan oyiga 1 ta konsultatsiya bepul
                </Link>
              )}
            </p>
          </div>
        )}

        {child && date && time && slotFree && (
          <p className="text-center text-xs font-semibold text-muted">
            {child.avatar} {child.name} · {formatDate(date, { weekday: true })}, {time} · {MODE_META[mode].label.toLowerCase()}
          </p>
        )}
      </div>
    </Sheet>
  );
}
