"use client";

import { useEffect, useRef } from "react";
import { scoreLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { NOT_VISIBLE } from "@/lib/vision/analyzers/base";
import { formatSec } from "@/lib/vision/result";
import type { Hint, LiveState, Meter, Tone } from "@/lib/vision/types";

const TONE: Record<Tone, string> = {
  good: "bg-good text-white",
  info: "bg-white text-ink",
  warn: "bg-warn text-ink",
  bad: "bg-danger text-white",
};

const glass = "rounded-3xl bg-slate-950/55 text-white shadow-lg ring-1 ring-white/10 backdrop-blur-md";

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Ring({ value, size, children }: { value: number; size: number; children: React.ReactNode }) {
  const stroke = Math.round(size * 0.11);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={v >= 1 ? "#22c55e" : "#38bdf8"}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

function Counter({ live }: { live: LiveState }) {
  if (live.mode === "hold") {
    return (
      <div className={cn(glass, "flex items-center gap-3 p-2 pr-4")}>
        <Ring value={live.holdSec / live.target} size={68}>
          <span className="text-2xl font-black tabular">{Math.floor(live.holdSec)}</span>
        </Ring>
        <div className="leading-tight">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">Ushlab turish</div>
          <div className="font-black tabular">
            <span className="text-2xl @xl:text-4xl">{formatSec(live.holdSec)}</span>
            <span className="text-base text-white/60 @xl:text-xl"> / {live.target} s</span>
          </div>
          {live.bestHoldSec >= 1 && <div className="text-xs font-bold text-white/70">Eng yaxshi: {formatSec(live.bestHoldSec)}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className={cn(glass, "px-4 py-2")}>
      <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">Takrorlar</div>
      <div className="flex items-baseline gap-1 font-black leading-none tabular">
        <span className="text-5xl @xl:text-7xl">{live.reps}</span>
        <span className="text-xl text-white/60 @xl:text-3xl">/{live.target}</span>
      </div>
    </div>
  );
}

function Accuracy({ value }: { value: number | null }) {
  const lvl = value === null ? null : scoreLevel(value);
  return (
    <div className={cn(glass, "px-3.5 py-2 text-center")}>
      <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">Aniqlik</div>
      <div className="flex items-center justify-center gap-1.5 font-black leading-tight tabular">
        {lvl && <span className="text-base @xl:text-xl">{lvl.icon}</span>}
        <span className="text-2xl @xl:text-4xl">{value === null ? "—" : `${value}%`}</span>
      </div>
    </div>
  );
}

export function HintPill({ hint, className }: { hint: Hint; className?: string }) {
  return (
    <div
      key={hint.text}
      role="status"
      aria-live="polite"
      className={cn(
        "mx-auto flex w-fit max-w-[94%] animate-pop items-center justify-center gap-2 rounded-full px-5 py-2.5 text-lg font-black shadow-pop @md:text-2xl @3xl:gap-3 @3xl:px-8 @3xl:py-4 @3xl:text-4xl",
        TONE[hint.tone],
        className,
      )}
    >
      <span className="shrink-0">{hint.emoji}</span>
      <span className="min-w-0 text-balance text-center leading-tight">{hint.text}</span>
    </div>
  );
}

/** Harakat amplitudasi: chiziq — takror hisoblanadigan chegara */
function Gauge({ progress, goal }: { progress: number; goal: number }) {
  const reached = progress >= goal;
  return (
    <div className="absolute right-3 top-1/2 h-[42%] w-3.5 -translate-y-1/2 rounded-full bg-white/25 ring-1 ring-white/30 @xl:right-5 @xl:w-5">
      <div
        className={cn("absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-100", reached ? "bg-good" : "bg-brand-400")}
        style={{ height: `${Math.round(progress * 100)}%` }}
      />
      <div className="absolute -inset-x-1.5 h-1 rounded-full bg-white shadow" style={{ bottom: `${Math.round(goal * 100)}%` }} />
    </div>
  );
}

function MeterBar({ m, side }: { m: Meter; side: "left" | "right" }) {
  const reached = m.value >= m.threshold;
  return (
    <div className={cn("absolute bottom-[16%] top-[30%] flex w-14 flex-col items-center gap-1.5 @xl:w-20", side === "left" ? "left-3 @xl:left-5" : "right-3 @xl:right-5")}>
      <div className="relative w-4 flex-1 overflow-hidden rounded-full bg-white/30 ring-1 ring-white/40 @xl:w-6">
        <div className="absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-100" style={{ height: `${Math.round(m.value * 100)}%`, background: m.color }} />
        <div className="absolute inset-x-0 h-1 bg-white" style={{ bottom: `${Math.round(m.threshold * 100)}%` }} />
      </div>
      <div className={cn("grid h-11 w-11 place-items-center rounded-2xl text-2xl shadow-lg transition @xl:h-14 @xl:w-14 @xl:text-3xl", reached ? "scale-110 bg-white" : "bg-white/70")}>
        {m.emoji}
      </div>
      <div className="rounded-full bg-slate-950/55 px-2 py-0.5 text-[11px] font-extrabold text-white @xl:text-xs">{m.label}</div>
    </div>
  );
}

/** Takror yakunlanganda "+1" chaqnashi */
function RepBurst({ flash, clean }: { flash: number; clean: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!flash || !el || typeof el.animate !== "function") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const a = el.animate(
      [
        { opacity: 0, transform: "scale(0.5)" },
        { opacity: 1, transform: "scale(1.15)", offset: 0.25 },
        { opacity: 1, transform: "scale(1)", offset: 0.55 },
        { opacity: 0, transform: "translateY(-40px) scale(0.95)" },
      ],
      { duration: 950, easing: "ease-out" },
    );
    return () => a.cancel();
  }, [flash]);
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 text-6xl font-black opacity-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] @xl:text-8xl",
        clean ? "text-[#4ade80]" : "text-[#fbbf24]",
      )}
    >
      {clean ? "+1 ✨" : "+1"}
    </div>
  );
}

export function Hud({ live, fps, demo }: { live: LiveState; fps: number; demo: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* maqsad sari progress */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-white/20">
        <div
          className="h-full bg-brand-gradient transition-[width] duration-300"
          style={{ width: `${Math.min(100, ((live.mode === "hold" ? live.bestHoldSec : live.reps) / live.target) * 100)}%` }}
        />
      </div>

      <div className="absolute left-3 top-4 flex items-start gap-2 @xl:left-5 @xl:top-5 @xl:gap-3">
        <Counter live={live} />
        <Accuracy value={live.accuracy} />
      </div>

      <div className="absolute right-3 top-4 flex flex-col items-end gap-1.5 @xl:right-5 @xl:top-5">
        <div className={cn(glass, "rounded-2xl px-3 py-1.5 text-lg font-black tabular @xl:text-2xl")}>⏱ {formatClock(live.elapsedSec)}</div>
        <div className="rounded-full bg-slate-950/45 px-2.5 py-0.5 text-[11px] font-extrabold text-white/90 backdrop-blur">
          {demo ? "DEMO" : `AI · ${fps || "…"} fps`}
        </div>
        {live.stability !== undefined && (
          <div className="rounded-full bg-slate-950/45 px-2.5 py-0.5 text-[11px] font-extrabold text-white/90 backdrop-blur">
            ⚖️ Barqarorlik {live.stability}%
          </div>
        )}
      </div>

      {live.meters ? (
        live.meters.map((m, i) => <MeterBar key={m.key} m={m} side={i === 0 ? "left" : "right"} />)
      ) : live.mode === "reps" ? (
        <Gauge progress={live.progress} goal={live.progressGoal} />
      ) : null}

      <RepBurst flash={live.repFlash} clean={live.lastRepClean} />

      <div className="absolute inset-x-0 bottom-4 px-3 @xl:bottom-6">
        <HintPill hint={live.hint} />
      </div>

      {!live.visible && <NotVisible guide={live.guide} />}
    </div>
  );
}

export function NotVisible({ guide }: { guide?: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-slate-950/40 backdrop-blur-[2px]">
      <div className="mx-4 max-w-md animate-pop rounded-3xl bg-white/95 p-5 text-center shadow-pop @xl:p-7">
        <div className="text-4xl @xl:text-6xl">📷</div>
        <div className="mt-1 text-lg font-black text-ink @xl:text-3xl">{NOT_VISIBLE}</div>
        {guide && <div className="mt-1 text-sm font-bold text-muted @xl:text-lg">{guide}</div>}
      </div>
    </div>
  );
}
