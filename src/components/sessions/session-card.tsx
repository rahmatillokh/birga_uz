"use client";

import { Clock, MapPin, Users } from "lucide-react";
import { getSpecialist } from "@/data/specialists";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, EmojiTile } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { SESSION_TYPES, STATUS } from "@/lib/constants";
import type { FreeSession, Specialist } from "@/lib/types";
import { cn } from "@/lib/utils";
import { addMinutes, durationLabel } from "./booking-utils";

/** Band va bo‘sh joylar (seed + foydalanuvchilar yozilishlari) */
export function seatsOf(s: FreeSession, extra: number) {
  const taken = Math.min(s.capacity, Math.max(0, s.booked + extra));
  return { taken, left: s.capacity - taken };
}

export function sessionSpecialists(s: FreeSession): Specialist[] {
  return s.specialistIds.map((id) => getSpecialist(id)).filter(Boolean) as Specialist[];
}

export function SeatsBar({ session, extra, className }: { session: FreeSession; extra: number; className?: string }) {
  const { taken, left } = seatsOf(session, extra);
  const full = left <= 0;
  const few = !full && left <= 3;
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs font-extrabold">
        <span className={full ? "text-danger" : few ? "text-[#8a5a00]" : "text-ink-2"}>
          {full ? "⛔ Joy qolmadi" : few ? `🔥 Faqat ${left} ta joy qoldi` : `🎟️ ${left} ta bo‘sh joy`}
        </span>
        <span className="text-faint tabular">
          {taken}/{session.capacity}
        </span>
      </div>
      <ProgressBar value={taken} max={session.capacity} height={6} color={full ? STATUS.critical : few ? STATUS.warning : undefined} />
    </div>
  );
}

export function SessionCard({
  session,
  extra,
  booked,
  onOpen,
}: {
  session: FreeSession;
  extra: number;
  booked: boolean;
  onOpen: (id: string) => void;
}) {
  const t = SESSION_TYPES[session.type];
  const { left } = seatsOf(session, extra);
  const full = left <= 0;
  const sps = sessionSpecialists(session);

  return (
    <Card
      onClick={() => onOpen(session.id)}
      className={cn("relative overflow-hidden p-4 pl-5 lg:flex lg:gap-6 lg:p-5 lg:pl-7", booked && "border-good/40 ring-1 ring-good/25")}
    >
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: t.color }} aria-hidden />
      <div className="min-w-0 lg:flex-1">
        <div className="flex items-start gap-3">
          <EmojiTile emoji={t.emoji} color={`${t.color}1a`} size={48} />
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-extrabold uppercase tracking-wide" style={{ color: t.color }}>
              {t.label}
            </span>
            <h3 className="mt-0.5 text-[15.5px] font-extrabold leading-snug text-ink">{session.title}</h3>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-[13.5px] text-ink-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-brand-500" aria-hidden />
            <span>
              <span className="font-extrabold tabular">
                {session.time}–{addMinutes(session.time, session.durationMin)}
              </span>
              <span className="text-muted"> · {durationLabel(session.durationMin)}</span>
            </span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-[3px] h-4 w-4 shrink-0 text-brand-500" aria-hidden />
            <span className="min-w-0 leading-snug">
              <span className="font-bold">{session.venue}</span>
              <span className="block text-[12.5px] text-muted">{session.address}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-brand-500" aria-hidden />
            <span className="font-semibold">{session.ageRange}</span>
          </div>
        </div>
      </div>

      <div className="lg:flex lg:w-[270px] lg:shrink-0 lg:flex-col lg:justify-between lg:gap-4 lg:border-l lg:border-line lg:pl-6">
        {sps.length > 0 && (
          <div className="mt-3 flex items-center gap-2.5 lg:mt-0">
            <div className="flex shrink-0 -space-x-2">
              {sps.map((sp) => (
                <span key={sp.id} className="rounded-full ring-2 ring-white">
                  <Avatar name={sp.name} color={sp.color} size={28} />
                </span>
              ))}
            </div>
            <span className="min-w-0 truncate text-[13px] font-semibold text-muted">{sps.map((sp) => sp.name).join(", ")}</span>
          </div>
        )}

        <div className="mt-3 flex items-end gap-3 border-t border-line pt-3 lg:mt-auto lg:flex-col lg:items-stretch lg:border-t-0 lg:pt-0">
          <SeatsBar session={session} extra={extra} className="flex-1 lg:flex-none" />
          <Button
            size="sm"
            variant={booked ? "soft" : "primary"}
            disabled={full && !booked}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(session.id);
            }}
            className="shrink-0 lg:h-10 lg:w-full"
          >
            {booked ? "Yozilgansiz ✅" : full ? "Joy yo‘q" : "Yozilish"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
