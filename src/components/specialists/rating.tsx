import { Star } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress";
import type { Specialist } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { daysAgoLabel, ratingBreakdown } from "./helpers";

const GOLD = "#f5b50a";

/** 5 yulduzli reyting (yarim yulduz bilan) */
export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`Reyting: ${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = value >= i - 0.25 ? 1 : value >= i - 0.75 ? 0.5 : 0;
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} strokeWidth={0} fill="#e2e8f0" className="absolute inset-0" />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: fill === 1 ? "100%" : "50%" }}>
                <Star size={size} strokeWidth={0} fill={GOLD} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** Reyting taqsimoti (5★…1★) va fikrlar */
export function RatingSummary({ sp }: { sp: Specialist }) {
  const counts = ratingBreakdown(sp.rating, sp.reviewsCount);
  const total = Math.max(1, sp.reviewsCount);
  return (
    <div className="flex items-center gap-5">
      <div className="shrink-0 text-center">
        <div className="text-[44px] font-black leading-none text-ink tabular">{sp.rating.toFixed(1)}</div>
        <Stars value={sp.rating} size={15} className="mt-2" />
        <div className="mt-1 text-xs font-bold text-muted">{formatNumber(sp.reviewsCount)} ta fikr</div>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {counts.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-bold text-muted">
            <span className="w-7 shrink-0 tabular">{5 - i} ★</span>
            <ProgressBar value={c} max={total} height={8} color={GOLD} trackClassName="bg-slate-100" />
            <span className="w-8 shrink-0 text-right tabular">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewCard({ review }: { review: Specialist["reviews"][number] }) {
  const letter = review.author.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-line/70">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-brand-700 shadow-card">{letter}</span>
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold text-ink">{review.author}</div>
            <Stars value={review.rating} size={12} />
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold text-faint">{daysAgoLabel(review.daysAgo)}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{review.text}</p>
    </div>
  );
}
