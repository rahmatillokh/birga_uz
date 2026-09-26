"use client";

import { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/client/telegram";
import { cn } from "@/lib/utils";
import { FeedbackBubble, StageTitle, useFeedback, useTimeouts } from "./kit";
import { pct, range, rng, shuffle, type Rng } from "./lib";
import { sfx } from "./sfx";
import type { GameProps, Level } from "./types";

/** «Juftini top»: hayvon ↔ uning sevimli narsasi, buyum ↔ vazifasi */

interface Pair {
  a: string;
  aT: string;
  b: string;
  bT: string;
  /** Bir raundda birga chiqmasligi kerak bo‘lgan (chalkash) juftlar guruhi */
  g?: string[];
}

const ANIMAL_PAIRS: Pair[] = [
  { a: "🐶", aT: "Kuchukcha", b: "🦴", bT: "Suyak" },
  { a: "🐝", aT: "Asalari", b: "🍯", bT: "Asal", g: ["gul"] },
  { a: "🐰", aT: "Quyoncha", b: "🥕", bT: "Sabzi" },
  { a: "🐟", aT: "Baliq", b: "🌊", bT: "Suv" },
  { a: "🐦", aT: "Qushcha", b: "🌳", bT: "Daraxt", g: ["daraxt", "qush"] },
  { a: "🐄", aT: "Sigir", b: "🌾", bT: "Pichan", g: ["don"] },
  { a: "🐒", aT: "Maymun", b: "🍌", bT: "Banan", g: ["daraxt"] },
  { a: "🐭", aT: "Sichqoncha", b: "🧀", bT: "Pishloq" },
  { a: "🐱", aT: "Mushuk", b: "🧶", bT: "Ip koptok" },
  { a: "🐼", aT: "Panda", b: "🎋", bT: "Bambuk" },
  { a: "🐿️", aT: "Olmaxon", b: "🌰", bT: "Yong‘oq", g: ["daraxt"] },
  { a: "🐧", aT: "Pingvin", b: "❄️", bT: "Qor" },
  { a: "🐫", aT: "Tuya", b: "🏜️", bT: "Cho‘l" },
  { a: "🦋", aT: "Kapalak", b: "🌸", bT: "Gul", g: ["gul"] },
  { a: "🐸", aT: "Qurbaqa", b: "🦟", bT: "Chivin" },
  { a: "🐔", aT: "Tovuq", b: "🌽", bT: "Makkajo‘xori", g: ["qush", "don"] },
];

const OBJECT_PAIRS: Pair[] = [
  { a: "🔑", aT: "Kalit", b: "🚪", bT: "Eshik" },
  { a: "✏️", aT: "Qalam", b: "📒", bT: "Daftar", g: ["qogoz", "rasm", "maktab"] },
  { a: "✂️", aT: "Qaychi", b: "📄", bT: "Qog‘oz", g: ["qogoz"] },
  { a: "🧦", aT: "Paypoq", b: "🦶", bT: "Oyoq" },
  { a: "👟", aT: "Krossovka", b: "🦶", bT: "Oyoq" },
  { a: "🧤", aT: "Qo‘lqop", b: "✋", bT: "Qo‘l", g: ["qol"] },
  { a: "🧼", aT: "Sovun", b: "👐", bT: "Qo‘llar", g: ["qol", "yuvish"] },
  { a: "🧽", aT: "Gubka", b: "🍽️", bT: "Idishlar", g: ["yuvish"] },
  { a: "👓", aT: "Ko‘zoynak", b: "👀", bT: "Ko‘zlar", g: ["koz"] },
  { a: "🕶️", aT: "Quyosh ko‘zoynagi", b: "☀️", bT: "Quyosh", g: ["koz"] },
  { a: "🥄", aT: "Qoshiq", b: "🥣", bT: "Bo‘tqa" },
  { a: "☂️", aT: "Soyabon", b: "🌧️", bT: "Yomg‘ir" },
  { a: "🖌️", aT: "Mo‘yqalam", b: "🎨", bT: "Bo‘yoqlar", g: ["rasm"] },
  { a: "⚽", aT: "To‘p", b: "🥅", bT: "Darvoza" },
  { a: "🎣", aT: "Qarmoq", b: "🐟", bT: "Baliq" },
  { a: "🛏️", aT: "Karavot", b: "😴", bT: "Uyqu" },
  { a: "🔦", aT: "Fonar", b: "🌑", bT: "Qorong‘i" },
  { a: "🎒", aT: "Sumka", b: "📚", bT: "Kitoblar", g: ["maktab"] },
];

const PAIR_COLORS = ["#0ea5e9", "#1baf7a", "#eda100", "#e87ba4", "#8b5cf6"];

type Cat = "animal" | "object";
interface MatchRound {
  cat: Cat;
  pairs: Pair[];
  left: number[]; // juftlar indekslari chap ustunda
  right: number[]; // o‘ng ustunda
}

function choosePairs(r: Rng, pool: Pair[], n: number): Pair[] {
  const out: Pair[] = [];
  const groups = new Set<string>();
  const rights = new Set<string>();
  for (const p of shuffle(r, pool)) {
    if (out.length >= n) break;
    if (rights.has(p.b) || p.g?.some((g) => groups.has(g))) continue;
    out.push(p);
    rights.add(p.b);
    p.g?.forEach((g) => groups.add(g));
  }
  return out;
}

function buildRounds(seed: number, level: Level): MatchRound[] {
  const r = rng(seed);
  const n = level === 1 ? 3 : level === 2 ? 4 : 5;
  const cats: Cat[] = level === 1 ? ["animal", "animal", "animal"] : level === 2 ? ["animal", "object", "animal"] : ["animal", "object", "object"];
  const used = new Set<string>();
  return cats.map((cat) => {
    const pool = cat === "animal" ? ANIMAL_PAIRS : OBJECT_PAIRS;
    const fresh = pool.filter((p) => !used.has(p.a));
    let pairs = choosePairs(r, fresh, n);
    if (pairs.length < n) pairs = choosePairs(r, pool, n);
    pairs.forEach((p) => used.add(p.a));
    const left = shuffle(r, range(pairs.length));
    let right = shuffle(r, range(pairs.length));
    // Juftlar to‘g‘ridan-to‘g‘ri qarshisida turmasin
    for (let k = 0; k < 6 && right.every((v, i) => v === left[i]); k++) right = shuffle(r, range(pairs.length));
    return { cat, pairs, left, right };
  });
}

type Side = "L" | "R";

export function MatchGame({ level, seed, onProgress, onFinish }: GameProps) {
  const [rounds] = useState(() => buildRounds(seed, level));
  const [idx, setIdx] = useState(0);
  const [matched, setMatched] = useState<number[]>([]);
  const [sel, setSel] = useState<{ side: Side; pair: number } | null>(null);
  const [shake, setShake] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const totals = useRef({ mistakes: 0, wrong: new Set<string>() });
  const later = useTimeouts();
  const { fb, good, bad } = useFeedback();

  const round = rounds[idx];
  const n = round.pairs.length;
  const totalPairs = rounds.reduce((s, x) => s + x.pairs.length, 0);
  const before = rounds.slice(0, idx).reduce((s, x) => s + x.pairs.length, 0);

  useEffect(() => {
    onProgress(before + matched.length, totalPairs);
  }, [before, matched.length, totalPairs, onProgress]);

  const next = (i: number) => {
    if (i + 1 >= rounds.length) {
      const t = totals.current;
      onFinish({
        correct: Math.max(0, totalPairs - t.wrong.size),
        total: totalPairs,
        score: pct(totalPairs, totalPairs + t.mistakes),
      });
      return;
    }
    setIdx(i + 1);
    setMatched([]);
    setSel(null);
    setShake([]);
    setDone(false);
  };

  const tap = (side: Side, pair: number) => {
    if (done || matched.includes(pair)) return;
    if (!sel || sel.side === side) {
      setSel(sel && sel.side === side && sel.pair === pair ? null : { side, pair });
      haptic("select");
      sfx.pop();
      return;
    }
    if (sel.pair === pair) {
      const m = [...matched, pair];
      setMatched(m);
      setSel(null);
      if (m.length === n) {
        setDone(true);
        good("Hammasi to‘g‘ri! 🎉");
        later(() => next(idx), 1400);
      } else {
        good();
      }
    } else {
      totals.current.mistakes += 1;
      totals.current.wrong.add(`${idx}:${sel.pair}`);
      totals.current.wrong.add(`${idx}:${pair}`);
      setShake([`${sel.side}${sel.pair}`, `${side}${pair}`]);
      later(() => setShake([]), 450);
      bad();
    }
  };

  const colorOf = (pair: number) => PAIR_COLORS[matched.indexOf(pair) % PAIR_COLORS.length];

  const item = (side: Side, pair: number, row: number) => {
    const p = round.pairs[pair];
    const emoji = side === "L" ? p.a : p.b;
    const label = side === "L" ? p.aT : p.bT;
    const isMatched = matched.includes(pair);
    const isSel = sel?.side === side && sel.pair === pair;
    const color = isMatched ? colorOf(pair) : undefined;
    return (
      <div key={`${side}${pair}`} className="py-1" style={{ gridColumn: side === "L" ? 1 : 3, gridRow: row + 1 }}>
        <button
          type="button"
          onClick={() => tap(side, pair)}
          aria-pressed={isSel}
          aria-label={isMatched ? `${label} — juftlandi` : label}
          className={cn(
            "relative flex h-full min-h-[62px] w-full select-none items-center gap-2 rounded-2xl border-2 bg-white px-2 py-1.5 transition-[transform,box-shadow,border-color,background-color] duration-150 [touch-action:manipulation] sm:min-h-[78px] sm:gap-3 sm:px-3",
            side === "R" ? "flex-row-reverse text-right" : "text-left",
            !isMatched && !isSel && "border-line shadow-card hover:border-brand-200 active:scale-[0.97]",
            isSel && "border-brand-500 shadow-pop ring-4 ring-brand-200",
            isMatched && "animate-[yq-bounce_0.5s_ease-out]",
            shake.includes(`${side}${pair}`) && "animate-shake",
          )}
          style={isMatched ? { borderColor: color, backgroundColor: `${color}14` } : undefined}
        >
          <span className="text-[34px] leading-none sm:text-[44px]">{emoji}</span>
          <span className="min-w-0 flex-1 text-[12.5px] font-extrabold leading-tight text-ink-2 sm:text-[15px]">{label}</span>
          {/* Ulagich nuqta — chiziq shu yerdan boshlanadi */}
          <span
            aria-hidden
            className={cn(
              "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-white shadow",
              side === "L" ? "-right-[10px]" : "-left-[10px]",
              !isMatched && !isSel && "bg-slate-300",
              isSel && "animate-pulse bg-brand-500",
            )}
            style={isMatched ? { backgroundColor: color } : undefined}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="relative flex flex-1 flex-col">
      <FeedbackBubble fb={fb} />
      <div key={idx} className="flex flex-1 flex-col animate-[yq-fade_0.35s_ease-out]">
        <StageTitle sub={round.cat === "animal" ? "Hayvonni bosing, keyin uning juftini" : "Buyumni bosing, keyin uning juftini"}>
          {round.cat === "animal" ? "Kim nimani yaxshi ko‘radi?" : "Bu buyum nima uchun kerak?"}
        </StageTitle>

        <div className="flex flex-1 items-center">
          <div
            className="mx-auto grid w-full max-w-[640px]"
            style={{
              gridTemplateColumns: "minmax(0, 1fr) clamp(40px, 14vw, 150px) minmax(0, 1fr)",
              gridTemplateRows: `repeat(${n}, minmax(0, 1fr))`,
            }}
          >
            {round.left.map((pair, row) => item("L", pair, row))}
            <div className="relative" style={{ gridColumn: 2, gridRow: `1 / span ${n}` }} aria-hidden>
              <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                {matched.map((pair) => {
                  const li = round.left.indexOf(pair);
                  const ri = round.right.indexOf(pair);
                  return (
                    <line
                      key={pair}
                      x1="0"
                      y1={((li + 0.5) * 100) / n}
                      x2="100"
                      y2={((ri + 0.5) * 100) / n}
                      stroke={colorOf(pair)}
                      strokeWidth={5}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      className="animate-[yq-fade_0.3s_ease-out]"
                    />
                  );
                })}
              </svg>
            </div>
            {round.right.map((pair, row) => item("R", pair, row))}
          </div>
        </div>
      </div>
    </div>
  );
}
