"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { haptic } from "@/lib/client/telegram";
import { cn } from "@/lib/utils";
import { FeedbackBubble, TimerBar, useFeedback, useTimeouts } from "./kit";
import { pct, pick, randInt, range, rng, sample } from "./lib";
import { CATEGORIES, LOOKALIKES } from "./pools";
import { sfx } from "./sfx";
import type { GameProps, Level } from "./types";

type Mode = "easy" | "category" | "lookalike";

/** Diqqat: 3×3 / 4×4 / 5×5, 1 / 1–2 / 2–3 nishon, raund taymeri */
const CONFIG: Record<Level, { rounds: number; cols: number; targets: [number, number]; time: number; mode: Mode; grid: string; emoji: string }> = {
  1: { rounds: 5, cols: 3, targets: [1, 1], time: 15000, mode: "easy", grid: "max-w-[330px] gap-2.5 sm:max-w-[360px] sm:gap-3", emoji: "text-[44px] sm:text-[52px]" },
  2: { rounds: 6, cols: 4, targets: [1, 2], time: 14000, mode: "category", grid: "max-w-[400px] gap-2 sm:max-w-[390px] sm:gap-2.5", emoji: "text-[34px] sm:text-[40px]" },
  3: { rounds: 7, cols: 5, targets: [2, 3], time: 13000, mode: "lookalike", grid: "max-w-[440px] gap-1.5 sm:max-w-[400px] sm:gap-2", emoji: "text-[28px] sm:text-[34px]" },
};

interface AttentionRound {
  target: string;
  cells: string[];
  count: number;
}

function buildRounds(seed: number, level: Level): AttentionRound[] {
  const r = rng(seed);
  const cfg = CONFIG[level];
  const size = cfg.cols * cfg.cols;
  const used = new Set<string>();
  const groups = sample(r, LOOKALIKES, LOOKALIKES.length);
  const out: AttentionRound[] = [];

  for (let k = 0; k < cfg.rounds; k++) {
    let target: string;
    let distractors: string[];
    if (cfg.mode === "lookalike" && k < groups.length && r() < 0.8) {
      // Qiyin: bir-biriga o‘xshash rasmlar orasidan topish
      const group = groups[k];
      const fresh = group.filter((e) => !used.has(e));
      target = pick(r, fresh.length ? fresh : group);
      const others = CATEGORIES.flat().filter((e) => !group.includes(e));
      distractors = [...group.filter((e) => e !== target), ...sample(r, others, 2)];
    } else {
      const cat = pick(r, CATEGORIES);
      const fresh = cat.filter((e) => !used.has(e));
      target = pick(r, fresh.length ? fresh : cat);
      if (cfg.mode === "easy") {
        // Oson: boshqa turkumdagi (yaqqol farq qiladigan) rasmlar orasida
        const others = CATEGORIES.filter((c) => c !== cat)
          .flat()
          .filter((e) => e !== target);
        distractors = sample(r, others, 3);
      } else {
        // O‘rta: bir turkum ichida (hayvonlar orasida hayvon)
        distractors = sample(
          r,
          cat.filter((e) => e !== target),
          cfg.mode === "category" ? 6 : 7,
        );
      }
    }
    used.add(target);
    const count = randInt(r, cfg.targets[0], cfg.targets[1]);
    const spots = new Set(sample(r, range(size), count));
    const cells = range(size).map((i) => (spots.has(i) ? target : pick(r, distractors)));
    out.push({ target, cells, count });
  }
  return out;
}

export function AttentionGame({ level, seed, color, onProgress, onFinish }: GameProps) {
  const cfg = CONFIG[level];
  const [rounds] = useState(() => buildRounds(seed, level));
  const [idx, setIdx] = useState(0);
  const [found, setFound] = useState<number[]>([]);
  const [status, setStatus] = useState<"play" | "done" | "timeout">("play");
  const [shake, setShake] = useState<{ cell: number; n: number } | null>(null);
  const totals = useRef({ found: 0, misses: 0 });
  const later = useTimeouts();
  const { fb, good, bad, info } = useFeedback();
  const round = rounds[idx];

  useEffect(() => {
    onProgress(idx + (status === "play" ? 0 : 1), rounds.length);
  }, [idx, status, rounds.length, onProgress]);

  const advance = (i: number) => {
    if (i + 1 >= rounds.length) {
      const t = totals.current;
      const all = rounds.reduce((s, x) => s + x.count, 0);
      onFinish({
        correct: t.found,
        total: all,
        score: pct(t.found, all + t.misses * 0.5),
        stat: { label: "Topildi", value: `${t.found}/${all}` },
      });
      return;
    }
    setIdx(i + 1);
    setFound([]);
    setShake(null);
    setStatus("play");
  };

  const onTimeUp = useEffectEvent(() => {
    setStatus("timeout");
    haptic("warning");
    sfx.bad();
    info("Vaqt tugadi! Mana ular 👆");
    later(() => advance(idx), 1800);
  });

  // Raund taymeri
  useEffect(() => {
    if (status !== "play") return;
    const t = setTimeout(() => onTimeUp(), cfg.time);
    return () => clearTimeout(t);
  }, [idx, status, cfg.time]);

  const tap = (i: number) => {
    if (status !== "play" || found.includes(i)) return;
    if (round.cells[i] === round.target) {
      const f = [...found, i];
      setFound(f);
      totals.current.found += 1;
      if (f.length >= round.count) {
        setStatus("done");
        good();
        later(() => advance(idx), 1000);
      } else {
        haptic("success");
        sfx.pop();
      }
    } else {
      totals.current.misses += 1;
      setShake((s) => ({ cell: i, n: (s?.n ?? 0) + 1 }));
      bad("Bu boshqa rasm");
    }
  };

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Pufak nishon rasmini yopmasin — sarlavhadan pastroqda */}
      <FeedbackBubble fb={fb} className="top-[64px] sm:top-[70px]" />

      <div className="mb-2 flex min-h-[70px] items-center justify-center gap-3 sm:min-h-[76px]">
        <span className="text-[18px] font-black text-ink sm:text-xl">Toping:</span>
        <span
          key={idx}
          className="grid h-16 w-16 place-items-center rounded-2xl border-[3px] bg-white text-[40px] leading-none shadow-card animate-pop sm:h-[72px] sm:w-[72px] sm:text-[46px]"
          style={{ borderColor: color }}
        >
          {round.target}
        </span>
        <div className="flex flex-col items-start gap-1.5" aria-label={`${found.length} / ${round.count} topildi`}>
          <span className="text-sm font-extrabold text-ink-2">{round.count} ta</span>
          <div className="flex gap-1">
            {range(round.count).map((k) => (
              <span
                key={k}
                className={cn("h-3.5 w-3.5 rounded-full border-2 transition-colors", k < found.length ? "border-good bg-good" : "border-slate-300 bg-white")}
              />
            ))}
          </div>
        </div>
      </div>

      <TimerBar key={idx} ms={cfg.time} running={status === "play"} className="mx-auto mb-3 max-w-[440px]" />

      <div
        key={`grid-${idx}`}
        className={cn("mx-auto grid w-full animate-[yq-fade_0.3s_ease-out]", cfg.grid)}
        style={{ gridTemplateColumns: `repeat(${cfg.cols}, minmax(0, 1fr))` }}
      >
        {round.cells.map((e, i) => {
          const isFound = found.includes(i);
          const reveal = status === "timeout" && e === round.target && !isFound;
          const shaking = shake?.cell === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => tap(i)}
              aria-label={isFound ? `${e} — topildi` : e}
              className={cn(
                "relative grid aspect-square select-none place-items-center rounded-2xl border-2 bg-white leading-none transition-[background-color,border-color,transform] duration-150 [touch-action:manipulation]",
                cfg.emoji,
                isFound
                  ? "border-good bg-[#effbef] animate-[yq-bounce_0.5s_ease-out]"
                  : reveal
                    ? "border-brand-400 bg-brand-50 animate-[yq-hint_1s_ease-in-out_infinite]"
                    : "border-line hover:border-brand-200 active:scale-95",
              )}
            >
              <span key={shaking ? shake.n : 0} className={cn("block", shaking && "animate-shake")}>
                {e}
              </span>
              {isFound && (
                <span className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-good text-[11px] font-black text-white" aria-hidden>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
