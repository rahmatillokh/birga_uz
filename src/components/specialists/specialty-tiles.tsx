"use client";

import { SPECIALTIES, SPECIALTY_ORDER } from "@/lib/constants";
import { haptic } from "@/lib/client/telegram";
import type { SpecialtyId } from "@/lib/types";
import { cn } from "@/lib/utils";

export const SPECIALTY_BG: Record<SpecialtyId, string> = {
  logoped: "#e7f0fb",
  defektolog: "#fdeee7",
  psixolog: "#fcecf2",
  fizioterapevt: "#e3f6ef",
  reabilitolog: "#fdf3dc",
  pediatr: "#e0f2fe",
  surdopedagog: "#efeaff",
  tiflopedagog: "#e2f2e2",
  maxsus_pedagog: "#fff1e6",
  nutq_terapevti: "#eaf0ff",
};

/** 10 ta mutaxassislik plitkasi — bosilganda filtr (qayta bosilsa — bekor) */
export function SpecialtyTiles({
  value,
  onChange,
  counts,
}: {
  value: SpecialtyId | "";
  onChange: (v: SpecialtyId | "") => void;
  counts: Partial<Record<SpecialtyId, number>>;
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
      {SPECIALTY_ORDER.map((id) => {
        const s = SPECIALTIES[id];
        const on = value === id;
        const n = counts[id] ?? 0;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            title={s.description}
            onClick={() => {
              haptic("select");
              onChange(on ? "" : id);
            }}
            className={cn(
              "relative flex w-[96px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-1.5 pb-2.5 pt-2 text-center transition sm:w-auto xl:flex-row xl:gap-2 xl:px-2.5 xl:py-2 xl:text-left",
              on ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-line bg-white hover:border-brand-200 hover:shadow-card",
              !on && n === 0 && "opacity-60",
            )}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl xl:h-9 xl:w-9 xl:rounded-xl xl:text-lg" style={{ background: SPECIALTY_BG[id] }}>
              {s.emoji}
            </span>
            <span
              className={cn(
                "line-clamp-2 min-h-[2.4em] text-[11.5px] font-extrabold leading-tight [overflow-wrap:anywhere] xl:min-h-0 xl:flex-1 xl:text-[12.5px] xl:[overflow-wrap:normal]",
                on ? "text-brand-700" : "text-ink-2",
              )}
            >
              {s.label}
            </span>
            <span
              className={cn(
                "absolute right-1.5 top-1.5 min-w-[18px] rounded-full px-1 text-[10px] font-black leading-[18px] xl:static xl:shrink-0",
                on ? "bg-brand-500 text-white" : "bg-slate-100 text-muted",
              )}
            >
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
}
