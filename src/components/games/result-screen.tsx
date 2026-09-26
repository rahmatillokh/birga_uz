"use client";

import { Gamepad2, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoNote } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { clock, levelLabel, starsFor } from "./lib";
import type { GameResult, Level } from "./types";

const HEAD = {
  3: { emoji: "🏆", title: "Ajoyib natija!" },
  2: { emoji: "🎉", title: "Juda yaxshi!" },
  1: { emoji: "👏", title: "Yaxshi harakat!" },
} as const;

function message(stars: 1 | 2 | 3, score: number, name?: string): string {
  const n = name ? `, ${name}` : "";
  const variants: Record<1 | 2 | 3, string[]> = {
    3: [`Qoyil${n}! Sen haqiqiy chempionsan! 🏆`, `Zo‘r${n}! Hammasini a’lo bajarding! 🌟`],
    2: [`Juda yaxshi${n}! Yana bir oz mashq — va uchta yulduz seniki! ⭐`, `Barakalla${n}! Sen tobora chaqqon bo‘lyapsan! 💪`],
    1: [`Yaxshi harakat${n}! Har bir o‘yin seni kuchliroq qiladi. Yana o‘ynaymizmi? 💪`, `Ofarin${n}, urinishing zo‘r! Keling, yana bir bor sinab ko‘ramiz 🙂`],
  };
  const list = variants[stars];
  return list[score % list.length];
}

export function ResultScreen({
  result,
  durationSec,
  level,
  childName,
  parentTip,
  onReplay,
  onLevelUp,
}: {
  result: GameResult;
  durationSec: number;
  level: Level;
  childName?: string;
  parentTip: string;
  onReplay: () => void;
  onLevelUp?: () => void;
}) {
  const stars = starsFor(result.score);
  const head = HEAD[stars];
  const tiles = [
    { emoji: "🎯", label: "Natija", value: String(result.score), suffix: "/100" },
    { emoji: "⏱", label: "Vaqt", value: clock(durationSec) },
    { emoji: "✅", label: result.stat?.label ?? "To‘g‘ri", value: result.stat?.value ?? `${result.correct}/${result.total}` },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-1 text-center animate-[yq-fade_0.35s_ease-out]" aria-live="polite">
      <div className="text-[60px] leading-none animate-pop sm:text-[72px]">{head.emoji}</div>
      <h2 className="mt-2 text-[24px] font-black leading-tight text-ink sm:text-3xl">{head.title}</h2>

      {/* Yulduzlar */}
      <div className="mt-2 flex items-end justify-center gap-1.5" aria-label={`${stars} ta yulduz (3 tadan)`}>
        {[1, 2, 3].map((k) => {
          const on = k <= stars;
          return (
            <Star
              key={k}
              aria-hidden
              className={cn(
                k === 2 ? "h-14 w-14 -translate-y-1.5 sm:h-16 sm:w-16" : "h-11 w-11 sm:h-12 sm:w-12",
                on ? "fill-[#fbbf24] text-[#f59e0b] animate-[yq-star-in_0.55s_cubic-bezier(.34,1.56,.64,1)_both]" : "fill-slate-100 text-slate-200",
              )}
              style={on ? { animationDelay: `${150 + k * 170}ms` } : undefined}
              strokeWidth={1.6}
            />
          );
        })}
      </div>

      <div className="mt-3 grid w-full max-w-md grid-cols-3 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl bg-white px-2 py-2.5 shadow-card ring-1 ring-line">
            <div className="flex items-center justify-center gap-1 text-[11.5px] font-bold text-muted sm:text-xs">
              <span aria-hidden>{t.emoji}</span>
              <span className="truncate">{t.label}</span>
            </div>
            <div className="tabular mt-1 text-[22px] font-black leading-none text-ink sm:text-2xl">
              {t.value}
              {t.suffix && <span className="text-xs font-bold text-muted">{t.suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 max-w-md px-2 text-[15px] font-bold leading-snug text-ink-2 sm:text-base">{message(stars, result.score, childName)}</p>

      <div className="mt-4 grid w-full max-w-md grid-cols-2 gap-2">
        <Button onClick={onReplay} className="px-3" aria-label="Yana o‘ynash">
          <RotateCcw className="h-4 w-4" />
          Yana o‘ynash
        </Button>
        <Button variant="secondary" href="/games" className="px-3">
          <Gamepad2 className="h-4 w-4" />
          Boshqa o‘yinlar
        </Button>
      </div>

      {onLevelUp && stars === 3 && level < 3 && (
        <button type="button" onClick={onLevelUp} className="mt-3 rounded-xl px-2 py-1 text-sm font-extrabold text-brand-600 hover:bg-brand-50 hover:text-brand-700">
          Qiyinroq darajani sinab ko‘ramizmi? → {levelLabel((level + 1) as Level)}
        </button>
      )}

      <InfoNote emoji="💡" className="mt-4 max-w-md text-left text-[13px] leading-snug">
        <b className="text-ink">Ota-onaga:</b> {parentTip}
      </InfoNote>
    </div>
  );
}
