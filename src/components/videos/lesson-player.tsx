"use client";

import { ChevronRight, Maximize, Minimize, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/client/telegram";
import type { Video } from "@/lib/types";
import { cn } from "@/lib/utils";
import { accentOf, formatClock, lessonScenes, MASCOTS, mascotLine } from "./shared";

// ---------------------------------------------------------------------------
// Holat mashinasi
// ---------------------------------------------------------------------------

type Phase = "cover" | "play" | "done";
interface PState {
  phase: Phase;
  index: number;
  t: number; // joriy sahnada o‘tgan vaqt (ms)
  playing: boolean;
}
type PAction =
  | { type: "start" }
  | { type: "toggle" }
  | { type: "pause" }
  | { type: "tick"; dt: number; ms: number[] }
  | { type: "next"; ms: number[] }
  | { type: "prev" };

const START: PState = { phase: "play", index: 0, t: 0, playing: true };

function reducer(s: PState, a: PAction): PState {
  switch (a.type) {
    case "start":
      return START;
    case "toggle":
      if (s.phase !== "play") return START;
      return { ...s, playing: !s.playing };
    case "pause":
      return s.playing ? { ...s, playing: false } : s;
    case "tick": {
      if (s.phase !== "play" || !s.playing) return s;
      const t = s.t + a.dt;
      if (t < a.ms[s.index]) return { ...s, t };
      if (s.index + 1 < a.ms.length) return { ...s, index: s.index + 1, t: 0 };
      return { ...s, phase: "done", playing: false, t: 0 };
    }
    case "next":
      if (s.phase !== "play") return s;
      if (s.index + 1 < a.ms.length) return { ...s, index: s.index + 1, t: 0 };
      return { ...s, phase: "done", playing: false, t: 0 };
    case "prev":
      if (s.phase !== "play") return s;
      if (s.t > 1500 || s.index === 0) return { ...s, t: 0 };
      return { ...s, index: s.index - 1, t: 0 };
  }
}

// ---------------------------------------------------------------------------
// Rang yordamchilari
// ---------------------------------------------------------------------------

function rgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number): string {
  const pa = rgb(a);
  const pb = rgb(b);
  if (!pa || !pb) return a;
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

function isLight(hex: string): boolean {
  const p = rgb(hex);
  if (!p) return true;
  return (0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) / 255 > 0.6;
}

const subscribeNoop = () => () => {};

// ---------------------------------------------------------------------------

/**
 * Interaktiv video-dars: qadamlar vaqt bo‘yicha animatsiyali sahnalar sifatida o‘ynaladi
 * (katta emoji, katta yozuv, har bir qadam uchun progress, qahramon pufakchasi).
 * Klaviatura: Probel — pauza, ← → — qadamlar, F — to‘liq ekran.
 */
export function LessonPlayer({
  video,
  childName,
  onComplete,
  nextHref,
}: {
  video: Video;
  childName?: string;
  onComplete?: (watchedSec: number) => void;
  nextHref?: string;
}) {
  const scenes = useMemo(() => lessonScenes(video), [video]);
  const ms = useMemo(() => scenes.map((x) => x.ms), [scenes]);
  const total = useMemo(() => ms.reduce((a, b) => a + b, 0), [ms]);
  const [s, dispatch] = useReducer(reducer, { phase: "cover", index: 0, t: 0, playing: false });
  const boxRef = useRef<HTMLDivElement>(null);
  const watchedRef = useRef(0);
  const doneRef = useRef(false);
  const [isFs, setIsFs] = useState(false);
  const fsSupported = useSyncExternalStore(subscribeNoop, () => !!document.fullscreenEnabled, () => false);

  const accent = accentOf(video.category);
  const mascot = MASCOTS[video.category];
  const light = isLight(video.color);
  const bg = `radial-gradient(110% 80% at 50% 0%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%), linear-gradient(165deg, ${video.color} 0%, ${mix(video.color, accent, 0.32)} 100%)`;

  // Taymer
  useEffect(() => {
    if (s.phase !== "play" || !s.playing) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(400, now - last);
      last = now;
      watchedRef.current += dt;
      dispatch({ type: "tick", dt, ms });
    }, 100);
    return () => window.clearInterval(id);
  }, [s.phase, s.playing, ms]);

  // Yakunlanganda
  useEffect(() => {
    if (s.phase === "done" && !doneRef.current) {
      doneRef.current = true;
      haptic("success");
      onComplete?.(Math.max(1, Math.round(watchedRef.current / 1000)));
    }
    if (s.phase !== "done") doneRef.current = false;
  }, [s.phase, onComplete]);

  // Boshqa oynaga o‘tilsa — pauza
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) dispatch({ type: "pause" });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // To‘liq ekran
  useEffect(() => {
    const onFs = () => setIsFs(!!boxRef.current && document.fullscreenElement === boxRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFs = useCallback(() => {
    const el = boxRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void el.requestFullscreen?.().catch(() => {});
  }, []);

  const start = useCallback(() => {
    watchedRef.current = 0;
    haptic("light");
    dispatch({ type: "start" });
  }, []);

  const toggle = useCallback(() => {
    haptic("light");
    if (s.phase !== "play") watchedRef.current = 0;
    dispatch({ type: "toggle" });
  }, [s.phase]);

  // Klaviatura
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      if (e.key === " " || e.key === "k") {
        if (tag === "BUTTON" || tag === "A") return; // fokusdagi tugma o‘zi ishlaydi
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight") dispatch({ type: "next", ms });
      else if (e.key === "ArrowLeft") dispatch({ type: "prev" });
      else if (e.key === "f" || e.key === "F") toggleFs();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ms, toggle, toggleFs]);

  const scene = scenes[s.index];
  const elapsed = s.phase === "done" ? total : s.phase === "cover" ? 0 : ms.slice(0, s.index).reduce((a, b) => a + b, 0) + s.t;
  const len = scene?.text.length ?? 0;
  const bubble =
    s.phase === "cover"
      ? `Salom${childName ? `, ${childName}` : ""}! Men ${mascot.name}. Birga o‘ynaymizmi?`
      : s.phase === "done"
        ? "Sen haqiqiy qahramonsan! 🏆"
        : !s.playing
          ? "Dam olyapmizmi? Tayyor bo‘lsang — davom etamiz ▶️"
          : mascotLine(s.index, scenes.length, childName);
  const bubbleKey = `${s.phase}-${s.index}-${s.playing}`;

  const pill = light ? "bg-white/80 text-ink" : "bg-white/20 text-white";
  const ctrl = cn(
    "grid place-items-center rounded-full shadow-sm transition active:scale-95 disabled:pointer-events-none disabled:opacity-40",
    light ? "bg-white/85 text-ink hover:bg-white" : "bg-white/20 text-white hover:bg-white/30",
    isFs ? "h-16 w-16" : "h-11 w-11",
  );

  return (
    <div
      ref={boxRef}
      role="region"
      aria-label={`Interaktiv video-dars: ${video.title}`}
      className={cn(
        "relative w-full select-none overflow-hidden",
        light ? "text-ink" : "text-white",
        isFs ? "h-full" : "aspect-[4/5] rounded-[28px] shadow-pop ring-1 ring-black/5 sm:aspect-[4/3] xl:aspect-video",
      )}
      style={{ background: bg }}
    >
      {/* Bezaklar */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/30 blur-2xl" />
        <div className="absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-white/25 blur-2xl" />
        <div className="absolute inset-0 bg-dots opacity-50" />
        {[
          { e: "⭐", c: "left-[7%] top-[22%]", d: "0s" },
          { e: "☁️", c: "right-[8%] top-[18%]", d: "0.8s" },
          { e: "✨", c: "left-[12%] bottom-[34%]", d: "1.6s" },
          { e: "🎈", c: "right-[10%] bottom-[38%]", d: "0.4s" },
        ].map((d) => (
          <span key={d.e} className={cn("absolute animate-float opacity-50", d.c, isFs ? "text-6xl" : "text-2xl sm:text-3xl")} style={{ animationDelay: d.d }}>
            {d.e}
          </span>
        ))}
      </div>

      <div className={cn("absolute inset-0 flex flex-col", isFs ? "p-8" : "p-3 sm:p-4 xl:p-5")}>
        {/* Qadamlar progressi */}
        <div className="flex gap-1.5" aria-hidden>
          {scenes.map((sc, i) => {
            const pct = s.phase === "done" || (s.phase === "play" && i < s.index) ? 100 : s.phase === "play" && i === s.index ? Math.min(100, (s.t / sc.ms) * 100) : 0;
            return (
              <div key={i} className={cn("flex-1 overflow-hidden rounded-full", light ? "bg-ink/10" : "bg-white/30", isFs ? "h-2.5" : "h-1.5")}>
                <div className="h-full rounded-full transition-[width] duration-100 ease-linear" style={{ width: `${pct}%`, background: light ? accent : "#fff" }} />
              </div>
            );
          })}
        </div>
        <div className={cn("mt-2 flex items-center justify-between gap-2 font-extrabold", isFs ? "text-lg" : "text-[11px] sm:text-xs")}>
          <span className={cn("rounded-full px-2.5 py-1", pill)}>
            {s.phase === "play" ? `Qadam ${s.index + 1}/${scenes.length}` : s.phase === "done" ? "✅ Dars tugadi" : `🎬 ${scenes.length} qadamli dars`}
          </span>
          <span className={cn("rounded-full px-2.5 py-1 tabular", pill)}>
            {formatClock(elapsed / 1000)} / {formatClock(total / 1000)}
          </span>
        </div>

        {/* Sahna */}
        <div
          className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-2 text-center"
          onClick={() => {
            if (s.phase === "play") toggle();
          }}
        >
          {s.phase === "cover" && (
            <div className="flex animate-fade-up flex-col items-center">
              <div
                className={cn(
                  "grid place-items-center rounded-full bg-white/85 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] ring-8 ring-white/40",
                  isFs ? "h-64 w-64" : "h-[112px] w-[112px] sm:h-[136px] sm:w-[136px] xl:h-[150px] xl:w-[150px]",
                )}
              >
                <span className={cn("animate-float leading-none", isFs ? "text-[150px]" : "text-[60px] sm:text-[72px] xl:text-[84px]")}>{video.emoji}</span>
              </div>
              <div className={cn("mt-3 font-extrabold uppercase tracking-wider", isFs ? "text-xl" : "text-[11px] sm:text-xs")} style={{ color: light ? accent : "#fff" }}>
                Interaktiv video-dars
              </div>
              <h3 className={cn("mt-1 max-w-[26ch] font-black leading-tight", isFs ? "text-5xl" : "text-[20px] sm:text-[26px] xl:text-[30px]")}>{video.title}</h3>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  start();
                }}
                className={cn(
                  "mt-4 flex animate-pulse-ring items-center gap-2 rounded-full font-black text-white shadow-lg transition hover:brightness-110 active:scale-95",
                  isFs ? "h-20 px-12 text-3xl" : "h-12 px-6 text-[17px] sm:h-14 sm:px-8 sm:text-lg",
                )}
                style={{ background: accent }}
              >
                <Play className={cn("fill-white", isFs ? "h-8 w-8" : "h-5 w-5")} />
                Boshlash
              </button>
            </div>
          )}

          {s.phase === "play" && scene && (
            <div key={s.index} className="flex flex-col items-center">
              <div
                className={cn(
                  "grid animate-pop place-items-center rounded-full bg-white/85 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] ring-8 ring-white/40",
                  isFs ? "h-72 w-72" : "h-[124px] w-[124px] sm:h-[140px] sm:w-[140px] xl:h-[160px] xl:w-[160px]",
                )}
              >
                <span className={cn("animate-float leading-none", isFs ? "text-[170px]" : "text-[66px] sm:text-[76px] xl:text-[88px]")}>{scene.emoji}</span>
              </div>
              <p
                aria-live="polite"
                className={cn(
                  "mt-4 max-w-[24ch] animate-fade-up font-black leading-[1.15] [text-wrap:balance] sm:mt-5",
                  isFs
                    ? len > 70
                      ? "text-5xl"
                      : "text-6xl"
                    : len > 70
                      ? "text-[19px] sm:text-[23px] xl:text-[27px]"
                      : len > 45
                        ? "text-[21px] sm:text-[26px] xl:text-[31px]"
                        : "text-[24px] sm:text-[30px] xl:text-[36px]",
                )}
              >
                {scene.text}
              </p>
            </div>
          )}

          {s.phase === "play" && !s.playing && (
            <div className="absolute inset-0 grid place-items-center rounded-3xl bg-white/35 backdrop-blur-[1.5px]">
              <span
                className={cn("grid animate-pop place-items-center rounded-full text-white shadow-lg", isFs ? "h-32 w-32" : "h-20 w-20")}
                style={{ background: accent }}
              >
                <Play className={cn("translate-x-[2px] fill-white", isFs ? "h-14 w-14" : "h-9 w-9")} />
              </span>
            </div>
          )}

          {s.phase === "done" && (
            <div className="flex flex-col items-center">
              <div className={cn("animate-pop leading-none", isFs ? "text-[160px]" : "text-[56px] sm:text-[68px] xl:text-[80px]")}>🏆</div>
              <div
                className={cn("mt-1 font-black leading-none", isFs ? "text-8xl" : "text-[38px] sm:text-[46px] xl:text-[56px]")}
                style={{ color: light ? accent : "#fff" }}
              >
                Barakalla!
              </div>
              <p className={cn("mt-2 font-bold opacity-80", isFs ? "text-3xl" : "text-[15px] sm:text-lg")}>
                {childName ? `${childName}, ` : ""}darsni oxirigacha bajarding!
              </p>
              <div className={cn("mt-2 flex gap-2", isFs ? "text-7xl" : "text-[28px] sm:text-[34px]")}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="animate-pop [animation-fill-mode:both]" style={{ animationDelay: `${250 + i * 220}ms` }}>
                    ⭐
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Qahramon */}
        <div className="flex items-end gap-2">
          <div
            className={cn(
              "grid shrink-0 animate-float place-items-center rounded-full bg-white shadow-md ring-4 ring-white/50",
              isFs ? "h-24 w-24 text-6xl" : "h-11 w-11 text-[26px] sm:h-14 sm:w-14 sm:text-[32px]",
            )}
            aria-hidden
          >
            {mascot.emoji}
          </div>
          <div
            key={bubbleKey}
            className={cn(
              "relative mb-1.5 max-w-[82%] animate-fade-up rounded-2xl rounded-bl-md bg-white px-3 py-1.5 text-left font-bold leading-snug text-ink shadow-md sm:mb-2 sm:max-w-[70%]",
              isFs ? "px-5 py-3 text-2xl" : "text-[12.5px] sm:text-[14px]",
            )}
          >
            <span className={cn("block font-extrabold uppercase tracking-wide", isFs ? "text-base" : "text-[9.5px] sm:text-[10px]")} style={{ color: accent }}>
              {mascot.name}
            </span>
            {bubble}
          </div>
        </div>

        {/* Boshqaruv */}
        {s.phase === "done" ? (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Button variant="secondary" size={isFs ? "lg" : "md"} onClick={start}>
              <RotateCcw className="h-4 w-4" />
              Qayta ko‘rish
            </Button>
            {nextHref && (
              <Button size={isFs ? "lg" : "md"} href={nextHref}>
                Keyingi video
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center">
            <div />
            <div className="flex items-center gap-3 sm:gap-4">
              <button type="button" className={ctrl} onClick={() => dispatch({ type: "prev" })} disabled={s.phase !== "play"} aria-label="Oldingi qadam">
                <SkipBack className={cn("fill-current", isFs ? "h-7 w-7" : "h-[18px] w-[18px]")} />
              </button>
              <button
                type="button"
                onClick={toggle}
                aria-label={s.phase === "play" && s.playing ? "Pauza" : "Boshlash"}
                className={cn("grid place-items-center rounded-full text-white shadow-lg transition hover:brightness-110 active:scale-95", isFs ? "h-24 w-24" : "h-14 w-14 sm:h-16 sm:w-16")}
                style={{ background: accent }}
              >
                {s.phase === "play" && s.playing ? (
                  <Pause className={cn("fill-white", isFs ? "h-10 w-10" : "h-6 w-6")} />
                ) : (
                  <Play className={cn("translate-x-[2px] fill-white", isFs ? "h-10 w-10" : "h-6 w-6")} />
                )}
              </button>
              <button type="button" className={ctrl} onClick={() => dispatch({ type: "next", ms })} disabled={s.phase !== "play"} aria-label="Keyingi qadam">
                <SkipForward className={cn("fill-current", isFs ? "h-7 w-7" : "h-[18px] w-[18px]")} />
              </button>
            </div>
            <div className="flex justify-end">
              {fsSupported && (
                <button type="button" className={ctrl} onClick={toggleFs} aria-label={isFs ? "To‘liq ekrandan chiqish" : "To‘liq ekran"}>
                  {isFs ? <Minimize className="h-7 w-7" /> : <Maximize className="h-[18px] w-[18px]" />}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
