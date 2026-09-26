"use client";

import { Fragment, useEffect, useReducer, useRef, useState } from "react";
import { haptic } from "@/lib/client/telegram";
import { cn } from "@/lib/utils";
import { FeedbackBubble, useFeedback, useTimeouts } from "./kit";
import { pct } from "./lib";
import { sfx } from "./sfx";
import type { GameProps, Level } from "./types";

/** «Chaqqon barmoqlar»: 30 soniyada iloji boricha ko‘p yulduzchani bosish */

const DURATION = 30_000;

const CONFIG: Record<Level, { size: number; life: number; every: number; max: number; bomb: number; mx: number; my: number }> = {
  1: { size: 92, life: 2400, every: 950, max: 2, bomb: 0, mx: 16, my: 15 },
  2: { size: 74, life: 1800, every: 750, max: 3, bomb: 0, mx: 14, my: 13 },
  3: { size: 62, life: 1450, every: 600, max: 4, bomb: 0.25, mx: 12, my: 11 },
};

interface Spot {
  id: number;
  x: number; // %
  y: number; // %
  kind: "star" | "bomb";
  born: number;
  life: number;
  hitAt?: number;
}

interface TapState {
  level: Level;
  t: number;
  spots: Spot[];
  hits: number;
  misses: number;
  nextId: number;
  lastSpawn: number;
  over: boolean;
}

type TapAction = { type: "tick"; t: number; rnd: number[] } | { type: "hit"; id: number };

function init(level: Level): TapState {
  return { level, t: 0, spots: [], hits: 0, misses: 0, nextId: 1, lastSpawn: -Infinity, over: false };
}

/** Toza reducer: tasodifiy sonlar harakat (action) bilan keladi — StrictMode’da ham ikki marta sanalmaydi */
function reducer(s: TapState, a: TapAction): TapState {
  if (s.over) return s;
  if (a.type === "hit") {
    const sp = s.spots.find((x) => x.id === a.id);
    if (!sp || sp.hitAt !== undefined) return s;
    // Bosish vaqti — oxirgi «tick» vaqti (80 ms aniqlik animatsiya uchun yetarli)
    const spots = s.spots.map((x) => (x.id === a.id ? { ...x, hitAt: s.t } : x));
    return sp.kind === "star" ? { ...s, spots, hits: s.hits + 1 } : { ...s, spots, misses: s.misses + 1 };
  }

  const cfg = CONFIG[s.level];
  const t = a.t;
  let misses = s.misses;
  const spots: Spot[] = [];
  for (const sp of s.spots) {
    if (sp.hitAt !== undefined) {
      if (t - sp.hitAt < 550) spots.push(sp); // «portlash» animatsiyasi uchun biroz qoladi
      continue;
    }
    if (t - sp.born >= sp.life) {
      if (sp.kind === "star") misses += 1; // ulgurilmagan yulduz — o‘tkazib yuborildi
      continue;
    }
    spots.push(sp);
  }
  if (t >= DURATION) return { ...s, t: DURATION, spots: [], misses, over: true };

  let { nextId, lastSpawn } = s;
  const alive = spots.filter((x) => x.hitAt === undefined).length;
  if (t - lastSpawn >= cfg.every && alive < cfg.max) {
    const [kindR, ...coords] = a.rnd;
    const kind = cfg.bomb > 0 && kindR < cfg.bomb ? "bomb" : "star";
    for (let k = 0; k + 1 < coords.length; k += 2) {
      const x = cfg.mx + coords[k] * (100 - 2 * cfg.mx);
      const y = cfg.my + coords[k + 1] * (100 - 2 * cfg.my);
      if (spots.every((o) => Math.hypot(o.x - x, o.y - y) > 24)) {
        spots.push({ id: nextId, x, y, kind, born: t, life: kind === "bomb" ? cfg.life * 1.3 : cfg.life });
        nextId += 1;
        lastSpawn = t;
        break;
      }
    }
  }
  return { ...s, t, spots, misses, nextId, lastSpawn };
}

export function TapGame({ level, onProgress, onFinish }: GameProps) {
  const cfg = CONFIG[level];
  const [phase, setPhase] = useState<"ready" | "play">("ready");
  const [count, setCount] = useState(3);
  const [s, dispatch] = useReducer(reducer, level, init);
  const [shaking, setShaking] = useState(false);
  const startAt = useRef(0);
  const finished = useRef(false);
  const later = useTimeouts();
  const { fb, bad } = useFeedback();
  const left = Math.max(0, Math.ceil((DURATION - s.t) / 1000));

  // 3 – 2 – 1 – boshladik!
  useEffect(() => {
    if (phase !== "ready") return;
    const id = setTimeout(() => {
      if (count <= 1) {
        startAt.current = performance.now();
        setPhase("play");
        sfx.good();
      } else {
        setCount(count - 1);
        sfx.tick();
      }
    }, 800);
    return () => clearTimeout(id);
  }, [phase, count]);

  // O‘yin sikli
  useEffect(() => {
    if (phase !== "play" || s.over) return;
    const id = setInterval(() => {
      const rnd = Array.from({ length: 17 }, () => Math.random());
      dispatch({ type: "tick", t: performance.now() - startAt.current, rnd });
    }, 80);
    return () => clearInterval(id);
  }, [phase, s.over]);

  // Yakun
  useEffect(() => {
    if (!s.over || finished.current) return;
    finished.current = true;
    const total = s.hits + s.misses;
    later(
      () =>
        onFinish({
          correct: s.hits,
          total,
          score: pct(s.hits, total),
          stat: { label: "Yulduzlar", value: String(s.hits) },
        }),
      900,
    );
  }, [s.over, s.hits, s.misses, onFinish, later]);

  useEffect(() => {
    onProgress(30 - left, 30, `${left} s`);
  }, [left, onProgress]);

  const hit = (sp: Spot) => {
    if (phase !== "play" || s.over || sp.hitAt !== undefined) return;
    dispatch({ type: "hit", id: sp.id });
    if (sp.kind === "star") {
      haptic("medium");
      sfx.pop();
    } else {
      setShaking(true);
      later(() => setShaking(false), 450);
      bad("Bomba! Uni bosmang 💣");
    }
  };

  return (
    <div className="relative flex flex-1 flex-col">
      <FeedbackBubble fb={fb} />

      <div className="mb-3 flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-1.5 rounded-2xl bg-white px-3 py-1.5 shadow-card ring-1 ring-line" aria-label={`${s.hits} ta yulduzcha`}>
          <span className="text-2xl leading-none">⭐</span>
          <span className="tabular min-w-[2ch] text-2xl font-black text-ink">{s.hits}</span>
        </div>
        <div className="text-center text-[13px] font-extrabold leading-tight text-muted sm:text-sm">
          {level === 3 ? "⭐ bosing, 💣 bosmang!" : "Yulduzchalarni tez bosing!"}
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white px-3 py-1.5 shadow-card ring-1 ring-line" aria-label={`${left} soniya qoldi`}>
          <span className="text-2xl leading-none">⏱</span>
          <span className={cn("tabular min-w-[2ch] text-2xl font-black", phase === "play" && left <= 5 ? "text-danger" : "text-ink")}>{left}</span>
        </div>
      </div>

      <div
        className={cn(
          "relative min-h-[340px] w-full flex-1 select-none overflow-hidden rounded-3xl border-2 border-dashed border-brand-200 [touch-action:manipulation] sm:min-h-[420px]",
          shaking && "animate-shake",
        )}
        style={{ background: "radial-gradient(circle at 18% 12%, #ffffff 0, transparent 38%), linear-gradient(180deg, #e6f4ff, #f7fbff)" }}
      >
        {s.spots.map((sp) =>
          sp.hitAt !== undefined ? (
            <Fragment key={sp.id}>
              <span
                aria-hidden
                className="pointer-events-none absolute text-[length:calc(var(--s)*0.8)] leading-none sm:text-[length:calc(var(--s)*1.04)]"
                style={{ left: `${sp.x}%`, top: `${sp.y}%`, "--s": `${cfg.size}px`, animation: "yq-burst 0.45s ease-out forwards" } as React.CSSProperties}
              >
                {sp.kind === "star" ? "✨" : "💥"}
              </span>
              {sp.kind === "star" && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute text-2xl font-black text-good"
                  style={{ left: `${sp.x}%`, top: `${sp.y}%`, animation: "yq-rise 0.55s ease-out forwards" }}
                >
                  +1
                </span>
              )}
            </Fragment>
          ) : (
            <button
              key={sp.id}
              type="button"
              aria-label={sp.kind === "star" ? "Yulduzcha" : "Bomba — bosmang"}
              onPointerDown={(e) => {
                e.preventDefault();
                hit(sp);
              }}
              onClick={(e) => {
                // Klaviatura (Enter/Space) uchun — sichqoncha/barmoq bosishi pointerdown’da hisoblangan
                if (e.detail === 0) hit(sp);
              }}
              className="absolute grid h-[var(--s)] w-[var(--s)] place-items-center rounded-full text-[length:calc(var(--s)*0.74)] leading-none [touch-action:manipulation] sm:h-[calc(var(--s)*1.3)] sm:w-[calc(var(--s)*1.3)] sm:text-[length:calc(var(--s)*0.96)]"
              style={
                {
                  left: `${sp.x}%`,
                  top: `${sp.y}%`,
                  "--s": `${cfg.size}px`,
                  animation: `yq-life ${sp.life}ms linear forwards`,
                } as React.CSSProperties
              }
            >
              <span className={sp.kind === "star" ? "drop-shadow-[0_4px_10px_rgb(234_179_8/0.5)]" : "drop-shadow-[0_4px_8px_rgb(15_23_42/0.3)]"}>
                {sp.kind === "star" ? "⭐" : "💣"}
              </span>
            </button>
          ),
        )}

        {phase === "ready" && (
          <div className="absolute inset-0 grid place-items-center bg-white/40">
            <div className="flex flex-col items-center">
              <span key={count} className="text-[96px] font-black leading-none text-brand-600 animate-[yq-count_0.8s_ease-out_forwards] sm:text-[120px]">
                {count}
              </span>
              <span className="mt-2 text-base font-extrabold text-ink-2">Tayyorlaning…</span>
            </div>
          </div>
        )}

        {s.over && (
          <div className="absolute inset-0 grid place-items-center bg-white/55">
            <span className="animate-pop rounded-3xl bg-white px-6 py-4 text-2xl font-black text-ink shadow-pop sm:text-3xl">Vaqt tugadi! ⏰</span>
          </div>
        )}
      </div>
    </div>
  );
}
