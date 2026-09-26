"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChoiceGame } from "./choice-game";
import { pick, range, rng, sample, shuffle, type Rng } from "./lib";
import type { GameProps, Level } from "./types";

/** «Keyingisi qaysi?» — qonuniyatni topish */

interface Tile {
  e: string;
  n: number; // nechta rasm (o‘suvchi sonlar uchun)
}

interface PatternRound {
  kind: "seq" | "count";
  seq: Tile[];
  options: Tile[];
  answer: number;
}

const UNITS: Record<string, number[]> = {
  AB: [0, 1],
  AAB: [0, 0, 1],
  ABB: [0, 1, 1],
  ABC: [0, 1, 2],
  AABB: [0, 0, 1, 1],
  ABAC: [0, 1, 0, 2],
  ABCD: [0, 1, 2, 3],
};

const PLAN: Record<Level, string[]> = {
  1: ["AB", "AB", "AB", "AAB", "ABB"],
  2: ["AB", "AAB", "ABB", "ABC", "AABB", "UP"],
  3: ["ABC", "AABB", "ABAC", "ABCD", "AAB", "UP", "DOWN"],
};

/** Nechta rasm ko‘rsatiladi («?» dan oldin) */
const SHOWN: Record<Level, number> = { 1: 5, 2: 6, 3: 7 };
const OPTIONS: Record<Level, number> = { 1: 3, 2: 4, 3: 4 };

const BASIC_POOLS = [
  ["🔴", "🔵", "🟢", "🟡"],
  ["🍎", "🍌", "🍇", "🍊"],
  ["🐶", "🐱", "🐰", "🐸"],
  ["❤️", "💛", "💚", "💙"],
];
const EXTRA_POOLS = [
  ["⭐", "🌙", "☀️", "☁️", "❄️"],
  ["🚗", "🚌", "🚀", "✈️", "⛵"],
  ["🟥", "🟦", "🟩", "🟨", "🟪"],
  ["🐵", "🐷", "🐼", "🐯", "🐧"],
];
const COUNT_EMOJI = ["🍎", "⭐", "🎈", "🐥", "🌸", "🍓"];

function countRound(r: Rng, level: Level, dir: "UP" | "DOWN"): PatternRound {
  const e = pick(r, COUNT_EMOJI);
  const counts = dir === "UP" ? (level === 2 ? [1, 2, 3] : [1, 2, 3, 4]) : [5, 4, 3];
  const last = counts[counts.length - 1];
  const ans = dir === "UP" ? last + 1 : last - 1;
  const wrong = [ans - 1, ans + 1, ans + 2, ans - 2].filter((n) => n >= 1 && n <= 6 && n !== ans).slice(0, OPTIONS[level] - 1);
  const opts = shuffle(r, [ans, ...wrong]);
  return {
    kind: "count",
    seq: counts.map((n) => ({ e, n })),
    options: opts.map((n) => ({ e, n })),
    answer: opts.indexOf(ans),
  };
}

function buildRounds(seed: number, level: Level): PatternRound[] {
  const r = rng(seed);
  const pools = level === 1 ? BASIC_POOLS : [...BASIC_POOLS, ...EXTRA_POOLS];
  return shuffle(r, PLAN[level]).map((kind) => {
    if (kind === "UP" || kind === "DOWN") return countRound(r, level, kind);
    const unit = UNITS[kind];
    const distinct = Math.max(...unit) + 1;
    const pool = pick(r, pools.filter((p) => p.length >= Math.max(distinct, OPTIONS[level])));
    const symbols = sample(r, pool, distinct);
    const shown = SHOWN[level];
    const seq = range(shown).map((i) => ({ e: symbols[unit[i % unit.length]], n: 1 }));
    const answerE = symbols[unit[shown % unit.length]];
    // Chalg‘ituvchi variantlar: avval qatordagi boshqa rasmlar, keyin tashqaridan
    const inPattern = shuffle(
      r,
      symbols.filter((s) => s !== answerE),
    );
    const outside = shuffle(
      r,
      pool.filter((s) => !symbols.includes(s)),
    );
    const wrong = [...inPattern, ...outside].slice(0, OPTIONS[level] - 1);
    const opts = shuffle(r, [answerE, ...wrong]);
    return { kind: "seq", seq, options: opts.map((e) => ({ e, n: 1 })), answer: opts.indexOf(answerE) };
  });
}

/** Katak ichidagi rasm(lar) — o‘lcham qator uzunligiga qarab (container query) */
function TileContent({ tile, cols, group, className }: { tile: Tile; cols: number; group?: boolean; className?: string }) {
  if (!group) {
    return (
      <span className={cn("leading-none", className)} style={{ fontSize: `min(${(62 / cols).toFixed(2)}cqw, 52px)` }}>
        {tile.e}
      </span>
    );
  }
  return (
    <span className={cn("flex max-w-[92%] flex-wrap items-center justify-center leading-none", className)} style={{ fontSize: `min(${(26 / cols).toFixed(2)}cqw, 30px)` }}>
      {range(tile.n).map((k) => (
        <span key={k}>{tile.e}</span>
      ))}
    </span>
  );
}

function OptionContent({ tile, group }: { tile: Tile; group?: boolean }) {
  if (!group) return <span className="text-[40px] leading-none sm:text-[52px]">{tile.e}</span>;
  return (
    <span className="flex max-w-[78px] flex-wrap items-center justify-center text-[19px] leading-none sm:max-w-[96px] sm:text-[25px]">
      {range(tile.n).map((k) => (
        <span key={k}>{tile.e}</span>
      ))}
    </span>
  );
}

function Sequence({ round, solved, color }: { round: PatternRound; solved: boolean; color: string }) {
  const cols = round.seq.length + 1;
  const answer = round.options[round.answer];
  return (
    <div className="@container mx-auto w-full max-w-[680px]">
      <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {round.seq.map((t, i) => (
          <div key={i} className="grid aspect-square place-items-center rounded-2xl border-2 border-line bg-white shadow-card">
            <TileContent tile={t} cols={cols} group={round.kind === "count"} />
          </div>
        ))}
        <div
          className={cn(
            "grid aspect-square place-items-center rounded-2xl border-[3px]",
            solved ? "border-good bg-[#effbef]" : "border-dashed bg-white animate-[yq-hint_1.4s_ease-in-out_infinite]",
          )}
          style={solved ? undefined : { borderColor: color }}
        >
          {solved ? (
            <TileContent tile={answer} cols={cols} group={round.kind === "count"} className="animate-[yq-fly-in_0.4s_ease-out]" />
          ) : (
            <span className="font-black leading-none" style={{ color, fontSize: `min(${(52 / cols).toFixed(2)}cqw, 44px)` }}>
              ?
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function PatternGame({ level, seed, color, onProgress, onFinish }: GameProps) {
  const [rounds] = useState(() => buildRounds(seed, level));
  const four = OPTIONS[level] === 4;
  return (
    <ChoiceGame
      rounds={rounds}
      onProgress={onProgress}
      onFinish={onFinish}
      title={() => "Keyingisi qaysi?"}
      sub={(rd) => (rd.kind === "count" ? "Har safar nechta bo‘lyapti? Sanab ko‘ring" : "Rasmlar qanday takrorlanyapti?")}
      scene={(rd, solved) => <Sequence round={rd} solved={solved} color={color} />}
      option={(rd, i) => <OptionContent tile={rd.options[i]} group={rd.kind === "count"} />}
      optionLabel={(rd, i) => {
        const t = rd.options[i];
        return rd.kind === "count" ? `Variant: ${t.n} ta ${t.e}` : `Variant: ${t.e}`;
      }}
      success={(rd) => (rd.kind === "count" ? `To‘g‘ri! ${rd.options[rd.answer].n} ta 👏` : "To‘g‘ri! Qator davom etdi 👏")}
      optionsClassName="max-w-[560px] flex-nowrap"
      optionClassName={cn("h-[92px] min-w-0 flex-1 sm:h-[116px]", four ? "max-w-[128px]" : "max-w-[150px]")}
    />
  );
}
