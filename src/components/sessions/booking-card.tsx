"use client";

import { CalendarDays, CalendarPlus, ChevronRight, MapPin, MessageSquareText, RotateCcw, Video, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, EmojiTile } from "@/components/ui/misc";
import { useView } from "@/lib/client/hooks";
import { openExternal } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { Booking } from "@/lib/types";
import { cn, formatDate, meetUrl } from "@/lib/utils";
import { BookingStatusBadge } from "./booking-status";
import { addMinutes, bookingInfo, displayStatus, relativeTag, sessionDuration } from "./booking-utils";
import { addToCalendar, bookingEvent } from "./ics";

function Row({ icon: Icon, children }: { icon: typeof CalendarDays; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-[3px] h-4 w-4 shrink-0 text-brand-500" aria-hidden />
      <div className="min-w-0 leading-snug">{children}</div>
    </div>
  );
}

export function calendarToast(result: "file" | "link") {
  if (result === "file") toast.success("Kalendar fayli (.ics) yuklab olindi — uni oching", "📅");
}

/** "Mening yozilishlarim" kartasi: sessiya yoki konsultatsiya */
export function BookingCard({
  booking,
  onCancel,
  onOpenSession,
  className,
}: {
  booking: Booking;
  onCancel?: (b: Booking) => void;
  onOpenSession?: (sessionId: string) => void;
  className?: string;
}) {
  const view = useView();
  const status = displayStatus(booking);
  const info = bookingInfo(booking);
  const child = view.children.find((c) => c.id === booking.childId);
  const active = status === "kutilmoqda" || status === "tasdiqlandi";
  const rel = active ? relativeTag(booking.date) : undefined;
  const end = addMinutes(booking.time, sessionDuration(booking));
  const sp = info.specialist;

  return (
    <Card className={cn("p-4", !active && "bg-white/75 shadow-none", className)}>
      <div className="flex items-start gap-3">
        {booking.kind === "consultation" && sp ? (
          <Avatar name={sp.name} color={sp.color} size={48} />
        ) : (
          <EmojiTile emoji={info.emoji} color={`${info.color}1f`} size={48} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: info.color }}>
              {booking.kind === "session" ? "Bepul sessiya" : "Konsultatsiya"}
            </span>
            <BookingStatusBadge status={status} />
          </div>
          <div className={cn("mt-0.5 line-clamp-2 text-[15.5px] font-extrabold leading-snug", active ? "text-ink" : "text-ink-2")}>{info.title}</div>
          <div className="mt-0.5 text-[13px] font-semibold text-muted">{info.subtitle}</div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-[13.5px] text-ink-2">
        <Row icon={CalendarDays}>
          {rel && <span className="font-extrabold text-brand-700">{rel} · </span>}
          <span className="font-bold">{formatDate(booking.date, { weekday: true })}</span>, {booking.time}–{end}
        </Row>
        <Row icon={booking.mode === "online" ? Video : MapPin}>{info.place}</Row>
        {child && (
          <div className="flex items-center gap-2">
            <span className="grid h-4 w-4 place-items-center text-sm leading-none">{child.avatar}</span>
            <span>
              <span className="font-bold">{child.name}</span> uchun
            </span>
          </div>
        )}
        {booking.note && <Row icon={MessageSquareText}>«{booking.note}»</Row>}
      </div>

      {(booking.premium || booking.source === "bot") && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {booking.premium && <Badge tone="premium">💎 Premium — bepul</Badge>}
          {booking.source === "bot" && <Badge tone="gray">🤖 Telegram bot orqali</Badge>}
        </div>
      )}

      {active && status === "kutilmoqda" && booking.kind === "consultation" && (
        <p className="mt-2.5 rounded-xl bg-warn/10 px-3 py-2 text-xs font-semibold leading-snug text-[#8a5a00]">
          ⏳ Mutaxassis tasdiqlashi kutilmoqda — tasdiqlangach Telegram orqali xabar olasiz.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        {status === "tasdiqlandi" && booking.kind === "consultation" && booking.mode === "online" && (
          <Button size="sm" onClick={() => openExternal(meetUrl(booking.id))}>
            🎥 Video qo‘ng‘iroq
          </Button>
        )}
        {active && (
          <Button size="sm" variant="secondary" onClick={() => calendarToast(addToCalendar(bookingEvent(booking, child?.name)))}>
            <CalendarPlus className="h-4 w-4" />
            Kalendarga qo‘shish
          </Button>
        )}
        {booking.kind === "session" && booking.sessionId && onOpenSession && (
          <Button size="sm" variant="ghost" onClick={() => onOpenSession(booking.sessionId!)}>
            Batafsil
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        {booking.kind === "consultation" && sp && (
          <Button size="sm" variant="ghost" href={active ? `/specialists/${sp.id}` : `/specialists/${sp.id}?book=1`}>
            {active ? (
              <>
                Profil
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Qayta yozilish
              </>
            )}
          </Button>
        )}
        {active && onCancel && (
          <Button size="sm" variant="ghost" className="ml-auto text-danger hover:bg-danger/10" onClick={() => onCancel(booking)}>
            <X className="h-4 w-4" />
            Bekor qilish
          </Button>
        )}
      </div>
    </Card>
  );
}
