"use client";

import { useEffect, useRef } from "react";
import type { MicAnalyser } from "@/lib/speech/audio";
import { cn } from "@/lib/utils";

const BARS = 15;
/** O‘rtadagi ustunlar balandroq — «ovoz to‘lqini» ko‘rinishi */
const SHAPE = Array.from({ length: BARS }, (_, i) => {
  const x = (i - (BARS - 1) / 2) / ((BARS - 1) / 2);
  return 0.45 + 0.55 * Math.cos((x * Math.PI) / 2);
});
const MIN = 0.08;

/**
 * Jonli ovoz o‘lchagichi — bola o‘z ovozini «ko‘radi».
 * React qayta chizmaydi: ustunlar rAF ichida to‘g‘ridan-to‘g‘ri yangilanadi.
 * Haqiqiy mikrofon tahlilchisi bo‘lmasa (masalan, AI rejimi telefonda) — «tinglayapman» animatsiyasi.
 */
export function LevelMeter({
  source,
  active,
  synthetic = false,
  lively = false,
  className,
}: {
  source: React.RefObject<MicAnalyser | null>;
  active: boolean;
  /** Haqiqiy daraja o‘rniga animatsiya */
  synthetic?: boolean;
  /** Animatsiya rejimida: ovoz eshitilmoqda */
  lively?: boolean;
  className?: string;
}) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const bars = barsRef.current;
    const setAll = (fn: (i: number) => number) => {
      for (let i = 0; i < BARS; i++) {
        const b = bars[i];
        if (b) b.style.transform = `scaleY(${fn(i).toFixed(3)})`;
      }
    };
    if (!active) {
      setAll(() => MIN);
      return;
    }
    let raf = 0;
    let level = 0;
    const tick = (now: number) => {
      const an = source.current;
      const real = !synthetic && !!an;
      let target: number;
      if (real && an) {
        target = Math.min(1, Math.max(0, (an.db() + 58) / 46));
      } else {
        target = lively ? 0.72 + 0.2 * Math.sin(now / 140) : 0.32 + 0.12 * Math.sin(now / 260);
      }
      level += (target - level) * (target > level ? 0.45 : 0.14);
      setAll((i) => {
        const wobble = real ? 0.85 + 0.15 * Math.sin(now / 90 + i * 1.7) : 0.55 + 0.45 * Math.sin(now / 150 + i * 0.8);
        return Math.max(MIN, Math.min(1, level * SHAPE[i] * wobble * 1.3));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, synthetic, lively, source]);

  return (
    <div className={cn("flex h-16 items-center justify-center gap-1.5", className)} aria-hidden>
      {SHAPE.map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          className={cn("h-full w-2 origin-center rounded-full", active ? "bg-brand-gradient" : "bg-brand-200")}
          style={{ transform: `scaleY(${MIN})` }}
        />
      ))}
    </div>
  );
}
