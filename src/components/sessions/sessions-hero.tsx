import { sessionStats } from "@/data/sessions";
import { SESSION_TYPES } from "@/lib/constants";
import type { Booking, SessionType } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";
import { bookingInfo, isUpcoming, relativeTag, sortByTime } from "./booking-utils";

export const SESSION_TYPE_ORDER: SessionType[] = ["konsultatsiya", "seminar", "amaliy", "uchrashuv"];

export const SHORT_TYPE_LABEL: Record<SessionType, string> = {
  konsultatsiya: "Konsultatsiya",
  seminar: "Seminar",
  amaliy: "Amaliy mashg‘ulot",
  uchrashuv: "Uchrashuv",
};

/** Bepul sessiyalar sahifasi uchun hero: qadriyat, statistika va sessiya turlari */
export function SessionsHero() {
  const stats = sessionStats();
  const items = [
    { value: formatNumber(stats.regions), label: "hudud" },
    { value: formatNumber(stats.districts), label: "tuman" },
    { value: `~${formatNumber(stats.perWeek)}`, label: "haftalik sessiya" },
  ];
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-brand-gradient p-5 text-white shadow-brand sm:p-7">
      <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-24 right-28 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute right-10 top-1/2 hidden h-56 w-56 -translate-y-1/2 xl:block" aria-hidden>
        <div className="absolute inset-8 grid place-items-center rounded-[44px] bg-white/15 text-[76px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)] backdrop-blur">
          🏢
        </div>
        {SESSION_TYPE_ORDER.map((t, i) => (
          <span
            key={t}
            className={[
              "absolute grid h-14 w-14 animate-float place-items-center rounded-2xl bg-white text-[28px] shadow-pop",
              ["left-0 top-2", "right-0 top-6", "left-3 bottom-2", "right-2 bottom-0"][i],
            ].join(" ")}
            style={{ animationDelay: `${i * 0.45}s` }}
          >
            {SESSION_TYPES[t].emoji}
          </span>
        ))}
      </div>
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold backdrop-blur">
          🎁 Mutlaqo bepul · yashash joyingizga yaqin
        </div>
        <h2 className="mt-3 max-w-xl text-[24px] font-black leading-tight sm:text-[30px]">Har bir tumanda bepul YuniQo sessiyalari</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/90 sm:text-[15px]">
          Mutaxassis konsultatsiyasi, ota-onalar seminari va bolalar uchun amaliy mashg‘ulotlar. Yoziling — Telegram bot bir kun oldin eslatadi.
        </p>

        <div className="mt-5 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
          {items.map((it) => (
            <div key={it.label} className="rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3">
              <div className="text-[22px] font-black leading-none tabular sm:text-[28px]">{it.value}</div>
              <div className="mt-1 text-[11.5px] font-bold leading-tight text-white/85 sm:text-xs">{it.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5 sm:gap-2 xl:max-w-[620px]">
          {SESSION_TYPE_ORDER.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/95 py-1 pl-1.5 pr-3 text-[12px] font-extrabold text-ink shadow-sm"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full text-[12px]" style={{ background: `${SESSION_TYPES[t].color}22` }}>
                {SESSION_TYPES[t].emoji}
              </span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: SESSION_TYPES[t].color }} />
              <span className="sm:hidden">{SHORT_TYPE_LABEL[t]}</span>
              <span className="hidden sm:inline">{SESSION_TYPES[t].label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** "Mening yozilishlarim" uchun ixcham sarlavha: nechta uchrashuv va eng yaqini */
export function MyBookingsHero({ bookings }: { bookings: Booking[] }) {
  const upcoming = bookings.filter(isUpcoming).sort(sortByTime);
  const next = upcoming[0];
  const info = next ? bookingInfo(next) : undefined;
  const rel = next ? relativeTag(next.date) : undefined;
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-brand-gradient p-4 text-white shadow-brand sm:p-5">
      <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-3.5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-3xl backdrop-blur">🎟️</span>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-black leading-tight sm:text-xl">
            {upcoming.length ? `${upcoming.length} ta yaqin uchrashuv` : "Yaqin uchrashuvlar yo‘q"}
          </div>
          <div className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-white/90">
            {next && info
              ? `Keyingisi: ${rel ? `${rel}, ` : ""}${formatDate(next.date, { weekday: !rel })}, ${next.time} — ${info.title}`
              : "Bepul sessiya yoki mutaxassis konsultatsiyasiga yoziling"}
          </div>
        </div>
      </div>
    </div>
  );
}
