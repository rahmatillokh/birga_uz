"use client";

import { haptic } from "@/lib/client/telegram";
import { WEEKDAYS_SHORT } from "@/lib/constants";
import { cn, formatDate, todayKey, weekdayOf } from "@/lib/utils";
import { dayLabel } from "@/components/sessions/booking-utils";
import type { SlotDay } from "./helpers";

/** 7 kunlik sana chizig‘i + vaqtlar to‘ri */
export function SlotPicker({
  days,
  date,
  time,
  onDate,
  onTime,
  className,
  gridClassName = "grid-cols-4 sm:grid-cols-5",
}: {
  days: SlotDay[];
  date?: string;
  time?: string;
  onDate: (date: string) => void;
  onTime: (date: string, time: string) => void;
  className?: string;
  gridClassName?: string;
}) {
  const cur = days.find((d) => d.date === date) ?? days.find((d) => d.slots.length) ?? days[0];
  const hasMine = !!cur?.slots.some((s) => s.state === "mine");
  const hasBusy = !!cur?.slots.some((s) => s.state === "busy");
  const today = todayKey();

  return (
    <div className={className}>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const free = d.slots.filter((s) => s.state === "free").length;
          const on = d.date === cur?.date;
          const off = d.slots.length === 0;
          const isToday = d.date === today;
          return (
            <button
              key={d.date}
              type="button"
              disabled={off}
              aria-pressed={on}
              aria-label={`${formatDate(d.date, { weekday: true })}: ${off ? "dam olish kuni" : free ? `${free} ta bo‘sh vaqt` : "bo‘sh vaqt yo‘q"}`}
              onClick={() => {
                haptic("select");
                onDate(d.date);
              }}
              className={cn(
                "relative flex h-[68px] min-w-0 flex-col items-center justify-center rounded-2xl border transition",
                on
                  ? "border-brand-500 bg-brand-500 text-white shadow-brand"
                  : off
                    ? "cursor-default border-transparent bg-slate-100/70 text-faint"
                    : cn("bg-white text-ink hover:border-brand-300", isToday ? "border-brand-300" : "border-line"),
              )}
            >
              <span className={cn("text-[10.5px] font-extrabold uppercase", on ? "text-white/90" : isToday ? "text-brand-600" : "text-muted")}>
                {WEEKDAYS_SHORT[weekdayOf(d.date) - 1]}
              </span>
              <span className="text-lg font-black leading-tight tabular">{Number(d.date.slice(8, 10))}</span>
              <span className={cn("text-[10px] font-extrabold", on ? "text-white/85" : off ? "text-faint" : free ? "text-[#006300]" : "text-faint")}>
                {off ? "dam" : free ? `${free} ta` : "band"}
              </span>
            </button>
          );
        })}
      </div>
      {cur && (
        <div className="mt-2 text-[13px] font-extrabold text-ink-2">
          {dayLabel(cur.date)}, {formatDate(cur.date)}
        </div>
      )}

      {cur && cur.slots.length > 0 ? (
        <div className={cn("mt-2 grid gap-2", gridClassName)}>
          {cur.slots.map((s) => {
            const on = s.state === "free" && s.time === time && cur.date === date;
            return (
              <button
                key={s.time}
                type="button"
                disabled={s.state !== "free"}
                aria-pressed={on}
                aria-label={`${s.time}${s.state === "mine" ? " — sizning yozilishingiz" : s.state === "busy" ? " — band" : ""}`}
                onClick={() => {
                  haptic("select");
                  onTime(cur.date, s.time);
                }}
                className={cn(
                  "relative h-11 rounded-xl border text-[15px] font-extrabold tabular transition",
                  on
                    ? "border-brand-500 bg-brand-500 text-white shadow-brand"
                    : s.state === "mine"
                      ? "border-good/30 bg-good/10 text-[#006300]"
                      : s.state === "busy"
                        ? "border-transparent bg-slate-100 text-faint line-through"
                        : "border-line bg-white text-ink hover:border-brand-300 hover:bg-brand-50",
                )}
              >
                {s.time}
                {s.state === "mine" && (
                  <span className="absolute -right-1.5 -top-2 rounded-full bg-good px-1.5 py-px text-[9.5px] font-black text-white shadow-sm">siz</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm font-semibold text-muted">
          Bu kunga bo‘sh vaqt yo‘q — boshqa kunni tanlang
        </div>
      )}

      {(hasMine || hasBusy) && (
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] font-bold text-muted">
          {hasMine && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-good/60" /> sizning yozilishingiz
            </span>
          )}
          {hasBusy && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> band
            </span>
          )}
        </div>
      )}
    </div>
  );
}
