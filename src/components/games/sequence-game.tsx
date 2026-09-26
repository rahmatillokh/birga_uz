"use client";

import { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/client/telegram";
import { cn } from "@/lib/utils";
import { FeedbackBubble, StageTitle, useFeedback, useTimeouts } from "./kit";
import { credit, pct, range, rng, sample, shuffleUnsorted } from "./lib";
import { sfx } from "./sfx";
import type { GameProps, Level } from "./types";

/** «Kun tartibi»: rasmlarni to‘g‘ri ketma-ketlikda bosish */

interface Step {
  e: string;
  t: string;
}
interface Scenario {
  title: string;
  emoji: string;
  steps: Step[];
}

const s = (e: string, t: string): Step => ({ e, t });

const SEQ3: Scenario[] = [
  { title: "Ertalab", emoji: "🌅", steps: [s("🛏️", "Uyg‘onamiz"), s("🥣", "Nonushta"), s("🏫", "Bog‘chaga")] },
  { title: "Gul o‘smoqda", emoji: "🌻", steps: [s("🌱", "Nihol"), s("🌿", "O‘simlik"), s("🌻", "Gul")] },
  { title: "Kapalak", emoji: "🦋", steps: [s("🥚", "Tuxum"), s("🐛", "Qurtcha"), s("🦋", "Kapalak")] },
  { title: "Olma", emoji: "🍎", steps: [s("🌸", "Gul"), s("🍏", "Olmacha"), s("🍎", "Pishgan olma")] },
  { title: "Uyquga tayyorlanamiz", emoji: "🌙", steps: [s("🛁", "Cho‘milamiz"), s("📖", "Ertak"), s("😴", "Uxlaymiz")] },
  { title: "Rasm chizamiz", emoji: "🎨", steps: [s("✏️", "Chizamiz"), s("🖍️", "Bo‘yaymiz"), s("🖼️", "Rasm tayyor")] },
  { title: "Uy quramiz", emoji: "🏠", steps: [s("🧱", "G‘ishtlar"), s("🏗️", "Quramiz"), s("🏠", "Uy tayyor")] },
  { title: "Yomg‘irdan keyin", emoji: "🌈", steps: [s("☁️", "Bulut"), s("🌧️", "Yomg‘ir"), s("🌈", "Kamalak")] },
  { title: "Jo‘ja", emoji: "🐥", steps: [s("🥚", "Tuxum"), s("🐣", "Chiqyapti"), s("🐥", "Jo‘ja")] },
  { title: "Sayohat", emoji: "🧳", steps: [s("🧳", "Yig‘inamiz"), s("🚗", "Yo‘lga chiqamiz"), s("🏖️", "Dam olamiz")] },
];

const SEQ4: Scenario[] = [
  { title: "Ertalab", emoji: "🌅", steps: [s("🛏️", "Uyg‘onamiz"), s("🧼", "Yuvinamiz"), s("🥣", "Nonushta"), s("🏫", "Bog‘chaga")] },
  { title: "Gul o‘stiramiz", emoji: "🌻", steps: [s("🌰", "Urug‘ ekamiz"), s("🌱", "Nihol chiqadi"), s("🌿", "O‘sadi"), s("🌻", "Gulladi")] },
  { title: "Jo‘ja", emoji: "🐥", steps: [s("🥚", "Tuxum"), s("🐣", "Chiqyapti"), s("🐥", "Jo‘ja"), s("🐔", "Tovuq")] },
  { title: "Qor odam", emoji: "⛄", steps: [s("🌨️", "Qor yog‘di"), s("⛄", "Qor odam yasadik"), s("☀️", "Quyosh chiqdi"), s("💧", "Erib ketdi")] },
  { title: "Bir kun", emoji: "🌞", steps: [s("🌅", "Tong"), s("☀️", "Kunduz"), s("🌇", "Kechqurun"), s("🌙", "Tun")] },
  { title: "Uyquga tayyorlanamiz", emoji: "🌙", steps: [s("🛁", "Cho‘milamiz"), s("🦷", "Tish yuvamiz"), s("📖", "Ertak"), s("😴", "Uxlaymiz")] },
  { title: "Rasm chizamiz", emoji: "🎨", steps: [s("📄", "Qog‘oz olamiz"), s("✏️", "Chizamiz"), s("🖍️", "Bo‘yaymiz"), s("🖼️", "Rasm tayyor")] },
  { title: "Olma", emoji: "🍎", steps: [s("🌳", "Daraxt"), s("🌸", "Gulladi"), s("🍏", "Olmacha"), s("🍎", "Pishdi")] },
  { title: "O‘samiz", emoji: "🧒", steps: [s("👶", "Chaqaloq"), s("🧒", "Bola"), s("🧑", "Katta odam"), s("👴", "Bobo")] },
  { title: "Qo‘l yuvamiz", emoji: "🧼", steps: [s("🚰", "Suvni ochamiz"), s("🧼", "Sovunlaymiz"), s("💦", "Chayamiz"), s("🧻", "Artamiz")] },
];

const SEQ5: Scenario[] = [
  { title: "Ertalab", emoji: "🌅", steps: [s("🛏️", "Uyg‘onamiz"), s("🧼", "Yuvinamiz"), s("🥣", "Nonushta"), s("👕", "Kiyinamiz"), s("🏫", "Bog‘chaga")] },
  { title: "Qo‘l yuvamiz", emoji: "🧼", steps: [s("🚰", "Suvni ochamiz"), s("🧼", "Sovunlaymiz"), s("👐", "Ishqalaymiz"), s("💦", "Chayamiz"), s("🧻", "Artamiz")] },
  { title: "Gul o‘stiramiz", emoji: "🌻", steps: [s("🌰", "Urug‘ ekamiz"), s("💧", "Suv quyamiz"), s("🌱", "Nihol chiqadi"), s("🌿", "O‘sadi"), s("🌻", "Gulladi")] },
  { title: "Tort pishiramiz", emoji: "🎂", steps: [s("🥚", "Tuxum chaqamiz"), s("🥣", "Aralashtiramiz"), s("🔥", "Pishiramiz"), s("🎂", "Bezaymiz"), s("🥳", "Bayram!")] },
];

const POOL: Record<Level, Scenario[]> = { 1: SEQ3, 2: SEQ4, 3: SEQ5 };
const ROUNDS = 4;

/** Kartalar kengligi (mobil / kompyuter) */
const CARD_W: Record<Level, string> = {
  1: "w-[calc(33.333%-6px)] sm:w-[calc(33.333%-8px)]",
  2: "w-[calc(50%-4px)] sm:w-[calc(25%-9px)]",
  3: "w-[calc(33.333%-6px)] sm:w-[calc(20%-10px)]",
};

interface SeqRound extends Scenario {
  order: number[];
}

function buildRounds(seed: number, level: Level): SeqRound[] {
  const r = rng(seed);
  return sample(r, POOL[level], ROUNDS).map((sc) => ({ ...sc, order: shuffleUnsorted(r, sc.steps.length) }));
}

export function SequenceGame({ level, seed, color, onProgress, onFinish }: GameProps) {
  const [rounds] = useState(() => buildRounds(seed, level));
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [shake, setShake] = useState<{ step: number; n: number } | null>(null);
  const totals = useRef({ credit: 0, first: 0 });
  const later = useTimeouts();
  const { fb, good, bad } = useFeedback();
  const round = rounds[idx];
  const n = round.steps.length;
  const complete = placed.length === n;

  useEffect(() => {
    onProgress(idx + (complete ? 1 : 0), rounds.length);
  }, [idx, complete, rounds.length, onProgress]);

  const next = (i: number) => {
    if (i + 1 >= rounds.length) {
      const t = totals.current;
      onFinish({ correct: t.first, total: rounds.length, score: pct(t.credit, rounds.length) });
      return;
    }
    setIdx(i + 1);
    setPlaced([]);
    setMisses(0);
    setShake(null);
  };

  const tap = (step: number) => {
    if (complete || placed.includes(step)) return;
    if (step === placed.length) {
      const p = [...placed, step];
      setPlaced(p);
      if (p.length === n) {
        totals.current.credit += credit(misses);
        if (misses === 0) totals.current.first += 1;
        good("To‘g‘ri tartib! 🎉");
        later(() => next(idx), 1600);
      } else {
        haptic("success");
        sfx.pop();
      }
    } else {
      setMisses(misses + 1);
      setShake((sh) => ({ step, n: (sh?.n ?? 0) + 1 }));
      bad(placed.length === 0 ? "Avval nima bo‘ladi?" : "Bu keyinroq bo‘ladi");
    }
  };

  return (
    <div className="relative flex flex-1 flex-col">
      <FeedbackBubble fb={fb} />
      <div key={idx} className="flex flex-1 flex-col animate-[yq-fade_0.35s_ease-out]">
        <StageTitle sub="Nima avval, nima keyin? Rasmlarni tartib bilan bosing">
          {round.emoji} {round.title}
        </StageTitle>

        {/* Joylar: 1, 2, 3 … */}
        <div className="mx-auto grid w-full gap-1.5 sm:gap-2.5" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, maxWidth: n * 136 }}>
          {range(n).map((k) => {
            const st = placed[k];
            const filled = st !== undefined;
            return (
              <div
                key={k}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 px-1 sm:aspect-[4/5]",
                  filled ? (complete ? "border-good bg-[#effbef] animate-[yq-bounce_0.6s_ease-out_both]" : "bg-white shadow-card") : "border-dashed border-slate-300 bg-white/60",
                )}
                style={complete ? { animationDelay: `${k * 90}ms` } : filled ? { borderColor: color } : undefined}
              >
                <span className="absolute left-1.5 top-1 text-[11px] font-black text-faint sm:left-2 sm:top-1.5 sm:text-xs">{k + 1}</span>
                {filled ? (
                  <>
                    <span className="animate-[yq-fly-in_0.35s_ease-out] text-[28px] leading-none sm:text-[42px]">{round.steps[st].e}</span>
                    <span className="mt-1.5 hidden text-center text-xs font-bold leading-tight text-ink-2 sm:block">{round.steps[st].t}</span>
                  </>
                ) : (
                  <span className="text-lg font-black text-slate-300 sm:text-2xl">?</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Aralashtirilgan kartalar */}
        <div className="mx-auto mt-auto flex w-full max-w-[680px] flex-wrap justify-center gap-2 pt-4 sm:gap-3">
          {round.order.map((st) => {
            if (placed.includes(st)) return <span key={st} aria-hidden className={cn("h-[104px] sm:h-[124px]", CARD_W[level])} />;
            const hint = misses >= 2 && st === placed.length;
            const shaking = shake?.step === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => tap(st)}
                aria-label={round.steps[st].t}
                className={cn(
                  "flex h-[104px] select-none flex-col items-center justify-center gap-1.5 rounded-3xl border-2 bg-white p-2 shadow-card transition-[transform,box-shadow,border-color] duration-150 [touch-action:manipulation] hover:-translate-y-0.5 hover:shadow-pop active:scale-95 sm:h-[124px]",
                  CARD_W[level],
                  hint ? "border-brand-400 animate-[yq-hint_1.2s_ease-in-out_infinite]" : "border-line hover:border-brand-200",
                )}
              >
                <span key={shaking ? shake.n : 0} className={cn("block text-[40px] leading-none sm:text-[50px]", shaking && "animate-shake")}>
                  {round.steps[st].e}
                </span>
                <span className="text-[12.5px] font-extrabold leading-tight text-ink-2 sm:text-sm">{round.steps[st].t}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
