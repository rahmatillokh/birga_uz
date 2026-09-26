"use client";

import { SESSION_TYPES, WEEKDAYS_SHORT } from "@/lib/constants";
import { haptic } from "@/lib/client/telegram";
import type { SessionType } from "@/lib/types";
import { cn, todayKey, weekdayOf } from "@/lib/utils";

const MONTHS_SHORT = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

/** 14 kunlik gorizontal kalendar: har bir kunda qaysi turdagi sessiyalar borligi nuqtalar bilan */
export function CalendarStrip({
  days,
  selected,
  onSelect,
  typesByDay,
}: {
  days: string[];
  selected: string | null;
  onSelect: (day: string | null) => void;
  typesByDay: Map<string, SessionType[]>;
}) {
  const today = todayKey();
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-[repeat(14,minmax(0,1fr))] lg:gap-1.5">
      {days.map((d, i) => {
        const types = typesByDay.get(d) ?? [];
        const has = types.length > 0;
        const on = selected === d;
        const [, m, dd] = d.split("-").map(Number);
        const showMonth = i === 0 || dd === 1;
        return (
          <button
            key={d}
            type="button"
            disabled={!has}
            aria-pressed={on}
            aria-label={`${d}${has ? `, ${types.length} turdagi sessiya` : ", sessiya yo‘q"}`}
            onClick={() => {
              haptic("select");
              onSelect(on ? null : d);
            }}
            className={cn(
              "relative flex h-[76px] w-[54px] shrink-0 flex-col items-center justify-center rounded-2xl border text-center transition lg:w-auto",
              on
                ? "border-brand-500 bg-brand-500 text-white shadow-brand"
                : has
                  ? "border-line bg-white text-ink hover:border-brand-300"
                  : "cursor-default border-transparent bg-slate-100/70 text-faint",
            )}
          >
            <span className={cn("text-[11px] font-extrabold uppercase", on ? "text-white/90" : d === today ? "text-brand-600" : "text-muted")}>
              {d === today ? "Bugun" : WEEKDAYS_SHORT[weekdayOf(d) - 1]}
            </span>
            <span className="text-lg font-black leading-tight tabular">{dd}</span>
            <span className={cn("h-3 text-[9.5px] font-bold leading-3", on ? "text-white/80" : "text-faint")}>
              {showMonth ? MONTHS_SHORT[m - 1] : ""}
            </span>
            <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
              {types.map((t) => (
                <span
                  key={t}
                  className={cn("h-1.5 w-1.5 rounded-full", on && "ring-1 ring-white")}
                  style={{ background: SESSION_TYPES[t].color }}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
