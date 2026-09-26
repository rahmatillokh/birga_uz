"use client";

import { Award, BadgeCheck, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { districtLabel, regionName } from "@/data/regions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/misc";
import { SPECIALTIES } from "@/lib/constants";
import type { Booking, Specialist } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { dayLabel } from "@/components/sessions/booking-utils";
import { nextFree, priceFrom, specialistDays } from "./helpers";

export function ServiceBadges({ sp, className }: { sp: Specialist; className?: string }) {
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1.5">
        {sp.services.includes("online") && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-extrabold text-brand-700 ring-1 ring-brand-100">
            💻 Online
          </span>
        )}
        {sp.services.includes("offline") && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e3f6ef] px-2.5 py-1 text-xs font-extrabold text-[#0f7a55] ring-1 ring-[#c9ecdf]">
            🏥 Offline
          </span>
        )}
        {sp.freeSessions && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf3dc] px-2.5 py-1 text-xs font-extrabold text-[#8a5a00] ring-1 ring-[#f6e2b3]">
            🏢 Bepul sessiyalar
          </span>
        )}
      </div>
    </div>
  );
}

/** Katalogdagi mutaxassis kartasi */
export function SpecialistCard({
  sp,
  bookings,
  onBook,
  showRegion,
}: {
  sp: Specialist;
  bookings: Booking[];
  onBook: (sp: Specialist) => void;
  showRegion?: boolean;
}) {
  const spec = SPECIALTIES[sp.specialty];
  const next = useMemo(() => nextFree(specialistDays(sp.id, bookings)), [sp.id, bookings]);
  const price = priceFrom(sp);
  const href = `/specialists/${sp.id}`;

  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <Link href={href} className="group flex items-start gap-3.5">
        <Avatar name={sp.name} color={sp.color} size={60} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-[16.5px] font-black leading-tight text-ink group-hover:text-brand-700">{sp.name}</span>
            {sp.verified && <BadgeCheck className="h-[18px] w-[18px] shrink-0 text-brand-500" aria-label="Tasdiqlangan mutaxassis" />}
          </div>
          <div className="mt-0.5 text-[13.5px] font-extrabold text-brand-700">
            {spec.emoji} {spec.label}
          </div>
          <div className="truncate text-[13px] text-muted">{sp.title}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="inline-flex items-center gap-1 rounded-xl bg-[#fff7e0] px-2 py-1 text-sm font-black text-ink ring-1 ring-[#fbe7ad]">
            <Star className="h-3.5 w-3.5" fill="#f5b50a" strokeWidth={0} />
            {sp.rating.toFixed(1)}
          </div>
          <div className="mt-1 text-[11px] font-bold text-muted">{formatNumber(sp.reviewsCount)} ta fikr</div>
        </div>
      </Link>

      <div className="mt-3 space-y-1.5 text-[13px] text-ink-2">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 shrink-0 text-brand-500" aria-hidden />
          <span>
            <b>{sp.experienceYears} yil tajriba</b>
            {sp.languages.length > 0 && <span className="text-muted"> · {sp.languages.join(", ")}</span>}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-[2px] h-4 w-4 shrink-0 text-brand-500" aria-hidden />
          <span className="line-clamp-2 leading-snug">
            {sp.workplace} · {districtLabel(sp.district)}
            {showRegion && <span className="text-muted">, {regionName(sp.region)}</span>}
          </span>
        </div>
      </div>

      <ServiceBadges sp={sp} className="mt-3" />

      <div className="mt-auto pt-3">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-line/60">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-muted">Narxi</div>
            <div className="truncate text-[15px] font-black text-ink">{price ? `${formatNumber(price)} so‘mdan` : "Kelishiladi"}</div>
          </div>
          <div className="min-w-0 text-right">
            <div className="text-[11px] font-bold text-muted">Eng yaqin vaqt</div>
            {next ? (
              <div className="inline-flex items-center gap-1.5 text-[15px] font-black text-[#006300]">
                <span className="h-2 w-2 shrink-0 rounded-full bg-good" aria-hidden />
                <span className="truncate">
                  {dayLabel(next.date)} {next.time}
                </span>
              </div>
            ) : (
              <div className="text-[13px] font-bold text-muted">Hafta band</div>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="secondary" href={href}>
            Profil
          </Button>
          <Button onClick={() => onBook(sp)}>Yozilish</Button>
        </div>
      </div>
    </Card>
  );
}
