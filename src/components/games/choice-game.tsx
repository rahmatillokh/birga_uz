"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChoiceButton, FeedbackBubble, StageTitle, useFeedback, useTimeouts, type ChoiceState } from "./kit";
import { credit, pct } from "./lib";
import type { GameProps } from "./types";

/** Variantli o‘yinlar uchun umumiy dvigatel (mantiq, muammo, hissiyot) */
export interface ChoiceRoundBase {
  answer: number;
  options: readonly unknown[];
}

interface ChoiceGameProps<R extends ChoiceRoundBase> extends Pick<GameProps, "onProgress" | "onFinish"> {
  rounds: R[];
  title: (r: R) => React.ReactNode;
  sub?: (r: R) => React.ReactNode;
  scene: (r: R, solved: boolean) => React.ReactNode;
  option: (r: R, i: number) => React.ReactNode;
  optionLabel: (r: R, i: number) => string;
  success?: (r: R) => string;
  optionClassName?: string;
  optionsClassName?: string;
  sceneClassName?: string;
}

export function ChoiceGame<R extends ChoiceRoundBase>({
  rounds,
  title,
  sub,
  scene,
  option,
  optionLabel,
  success,
  optionClassName,
  optionsClassName,
  sceneClassName,
  onProgress,
  onFinish,
}: ChoiceGameProps<R>) {
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const totals = useRef({ credit: 0, first: 0 });
  const later = useTimeouts();
  const { fb, good, bad } = useFeedback();
  const round = rounds[idx];

  useEffect(() => {
    onProgress(idx + (solved ? 1 : 0), rounds.length);
  }, [idx, solved, rounds.length, onProgress]);

  const next = (i: number) => {
    if (i + 1 >= rounds.length) {
      const t = totals.current;
      onFinish({ correct: t.first, total: rounds.length, score: pct(t.credit, rounds.length) });
      return;
    }
    setIdx(i + 1);
    setWrong([]);
    setSolved(false);
  };

  const choose = (i: number) => {
    if (solved || wrong.includes(i)) return;
    if (i === round.answer) {
      setSolved(true);
      totals.current.credit += credit(wrong.length);
      if (wrong.length === 0) totals.current.first += 1;
      good(success?.(round));
      later(() => next(idx), 1300);
    } else {
      setWrong([...wrong, i]);
      bad();
    }
  };

  return (
    <div className="relative flex flex-1 flex-col">
      <FeedbackBubble fb={fb} />
      <div key={idx} className="flex flex-1 flex-col animate-[yq-fade_0.35s_ease-out]">
        <StageTitle sub={sub?.(round)}>{title(round)}</StageTitle>
        <div className={cn("flex min-h-[150px] flex-1 items-center justify-center sm:min-h-[180px]", sceneClassName)}>{scene(round, solved)}</div>
        <div className={cn("mx-auto flex w-full max-w-[720px] flex-wrap justify-center gap-2 pt-4 sm:gap-3", optionsClassName)}>
          {round.options.map((_, i) => {
            const state: ChoiceState = solved ? (i === round.answer ? "correct" : "dim") : wrong.includes(i) ? "wrong" : "idle";
            return (
              <ChoiceButton key={i} state={state} onClick={() => choose(i)} label={optionLabel(round, i)} className={optionClassName}>
                {option(round, i)}
              </ChoiceButton>
            );
          })}
        </div>
      </div>
    </div>
  );
}
