"use client";

import { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/client/telegram";
import { cn } from "@/lib/utils";
import { FeedbackBubble, StageTitle, TimerBar, useFeedback, useTimeouts } from "./kit";
import { rng, sample, shuffle } from "./lib";
import { MEMORY_POOL } from "./pools";
import { sfx } from "./sfx";
import type { GameProps, Level } from "./types";

/** Xotira kartalari: 3×2 / 4×3 / 4×4 */
const CONFIG: Record<Level, { cols: number; pairs: number; preview: number; grid: string; emoji: string }> = {
  1: { cols: 3, pairs: 3, preview: 3000, grid: "max-w-[400px] gap-3", emoji: "text-[50px] sm:text-[62px]" },
  2: { cols: 4, pairs: 6, preview: 3000, grid: "max-w-[460px] gap-2.5 sm:gap-3", emoji: "text-[38px] sm:text-[50px]" },
  3: { cols: 4, pairs: 8, preview: 2500, grid: "max-w-[440px] gap-2 sm:max-w-[400px] sm:gap-3", emoji: "text-[32px] sm:text-[42px]" },
};

interface MemoryCard {
  id: number;
  emoji: string;
}

function buildDeck(seed: number, level: Level): MemoryCard[] {
  const r = rng(seed);
  const emojis = sample(r, MEMORY_POOL, CONFIG[level].pairs);
  return shuffle(r, [...emojis, ...emojis]).map((emoji, id) => ({ id, emoji }));
}

export function MemoryGame({ level, seed, color, onProgress, onFinish }: GameProps) {
  const cfg = CONFIG[level];
  const [deck] = useState(() => buildDeck(seed, level));
  const [preview, setPreview] = useState(true);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const token = useRef(0);
  const later = useTimeouts();
  const { fb, good, info } = useFeedback();

  // Boshida kartalar bir necha soniya ochiq turadi — eslab qolish uchun
  useEffect(() => {
    const t = setTimeout(() => {
      setPreview(false);
      sfx.flip();
    }, cfg.preview);
    return () => clearTimeout(t);
  }, [cfg.preview]);

  useEffect(() => {
    onProgress(matched.length, cfg.pairs);
  }, [matched.length, cfg.pairs, onProgress]);

  const finishWith = (mv: number) => {
    // «Yaxshi» natija — juftlar sonining 1.5 baravarigacha yurish
    const par = Math.ceil(cfg.pairs * 1.5);
    const score = mv <= par ? 100 : Math.max(30, Math.round(100 - ((mv - par) * 70) / (cfg.pairs * 1.5)));
    onFinish({ correct: cfg.pairs, total: mv, score, stat: { label: "Yurishlar", value: String(mv) } });
  };

  const flip = (i: number) => {
    if (preview) {
      info("Avval rasmlarni eslab qoling 👀");
      return;
    }
    const card = deck[i];
    if (matched.includes(card.emoji) || open.includes(i)) return;

    // Ikki xil karta hali ochiq bo‘lsa — darhol yopib, yangisini ochamiz
    let cur = open;
    if (cur.length >= 2) {
      token.current += 1;
      cur = [];
      setWrong([]);
    }
    const next = [...cur, i];
    setOpen(next);
    if (next.length < 2) {
      sfx.flip();
      haptic("light");
      return;
    }

    const mv = moves + 1;
    setMoves(mv);
    const [a, b] = next;
    if (deck[a].emoji === deck[b].emoji) {
      const m = [...matched, deck[a].emoji];
      setMatched(m);
      setOpen([]);
      const done = m.length === cfg.pairs;
      good(done ? "Hammasini topding! 🏆" : undefined);
      if (done) later(() => finishWith(mv), 1000);
    } else {
      sfx.flip();
      const t = ++token.current;
      later(() => {
        if (token.current !== t) return;
        setWrong([a, b]);
        haptic("error");
        sfx.bad();
      }, 450);
      later(() => {
        if (token.current !== t) return;
        setOpen([]);
        setWrong([]);
      }, 1250);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col">
      <FeedbackBubble fb={fb} />
      <StageTitle className="mb-1 sm:mb-1">{preview ? "Eslab qoling! 👀" : "Bir xil rasmlar juftini toping"}</StageTitle>
      <div className="mx-auto mb-3 flex h-7 w-full max-w-[260px] items-center justify-center sm:mb-4">
        {preview ? (
          <TimerBar ms={cfg.preview} running />
        ) : (
          <span className="text-sm font-bold text-muted">
            Yurishlar: <b className="tabular text-ink">{moves}</b> · Juftlar:{" "}
            <b className="tabular text-ink">
              {matched.length}/{cfg.pairs}
            </b>
          </span>
        )}
      </div>

      <div className="flex flex-1 items-center">
        <div className={cn("mx-auto grid w-full", cfg.grid)} style={{ gridTemplateColumns: `repeat(${cfg.cols}, minmax(0, 1fr))` }}>
          {deck.map((c, i) => {
            const isMatched = matched.includes(c.emoji);
            const faceUp = preview || isMatched || open.includes(i);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => flip(i)}
                aria-label={faceUp ? `${i + 1}-karta: ${c.emoji}` : `${i + 1}-karta, yopiq`}
                aria-pressed={faceUp}
                className={cn(
                  "relative aspect-square select-none rounded-2xl [perspective:900px] [touch-action:manipulation]",
                  wrong.includes(i) && "animate-shake",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-0 rounded-2xl transition-transform duration-500 ease-out [transform-style:preserve-3d]",
                    faceUp && "[transform:rotateY(180deg)]",
                  )}
                >
                  {/* Orqa tomoni */}
                  <span
                    className="absolute inset-0 grid place-items-center rounded-2xl shadow-card [-webkit-backface-visibility:hidden] [backface-visibility:hidden]"
                    style={{
                      backgroundImage: `radial-gradient(rgb(255 255 255 / 0.22) 1.5px, transparent 1.5px), linear-gradient(135deg, ${color}, ${color}b3)`,
                      backgroundSize: "14px 14px, 100% 100%",
                    }}
                  >
                    <span className="grid h-[52%] w-[52%] place-items-center rounded-xl border-2 border-dashed border-white/70 text-xl font-black text-white sm:text-3xl">
                      ?
                    </span>
                  </span>
                  {/* Old tomoni */}
                  <span
                    className={cn(
                      "absolute inset-0 grid place-items-center rounded-2xl border-2 bg-white shadow-card [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:rotateY(180deg)]",
                      isMatched ? "border-good bg-[#effbef]" : wrong.includes(i) ? "border-warn" : "border-line",
                    )}
                  >
                    <span className={cn("leading-none", cfg.emoji, isMatched && "animate-[yq-bounce_0.6s_ease-out]")}>{c.emoji}</span>
                    {isMatched && (
                      <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-good text-[11px] font-black text-white sm:h-6 sm:w-6 sm:text-xs" aria-hidden>
                        ✓
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
