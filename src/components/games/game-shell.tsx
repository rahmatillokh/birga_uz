"use client";

import { Play, Volume2, VolumeX, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DomainBadge, EmojiTile } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import type { GameMeta } from "@/data/games";
import { useActiveChild } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import { ageOf, cn } from "@/lib/utils";
import { GameStyles } from "./kit";
import { LEVELS, levelForAge, levelLabel, newSeed, tint } from "./lib";
import { ResultScreen } from "./result-screen";
import { isMuted, setMuted, sfx } from "./sfx";
import type { GameDef, GameResult, Level } from "./types";

type Phase = "intro" | "play" | "result";

interface Outcome {
  result: GameResult;
  durationSec: number;
  level: Level;
}

/** O‘yin sahifasi: yuqori panel + kirish / o‘yin / natija */
export function GameShell({ game, def }: { game: GameMeta; def: GameDef }) {
  const router = useRouter();
  const child = useActiveChild();
  const act = useApp((s) => s.act);
  const age = child ? ageOf(child.birthDate) : undefined;
  const autoLevel = levelForAge(age?.years);

  const [level, setLevel] = useState<Level>(autoLevel);
  const [phase, setPhase] = useState<Phase>("intro");
  const [run, setRun] = useState(0);
  const [seed, setSeed] = useState(1);
  const [progress, setProgress] = useState<{ value: number; max: number; label?: string }>({ value: 0, max: 0 });
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [muted, setMutedState] = useState(() => isMuted());
  const startedAt = useRef(0);
  const loggedRun = useRef(0);

  const Game = def.component;

  const start = (lvl: Level = level) => {
    sfx.unlock();
    setLevel(lvl);
    setSeed(newSeed());
    setRun((r) => r + 1);
    setProgress({ value: 0, max: 0 });
    setOutcome(null);
    startedAt.current = Date.now();
    setPhase("play");
  };

  const changeLevel = (l: Level) => {
    if (l === level) return;
    haptic("select");
    if (phase === "intro") setLevel(l);
    else start(l);
  };

  const onProgress = useCallback((value: number, max: number, label?: string) => {
    setProgress((p) => (p.value === value && p.max === max && p.label === label ? p : { value, max, label }));
  }, []);

  const onFinish = useCallback(
    (res: GameResult) => {
      if (loggedRun.current === run) return; // bir o‘yin — bir yozuv
      loggedRun.current = run;
      const durationSec = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
      const score = Math.max(0, Math.min(100, Math.round(res.score)));
      const result = { ...res, score };
      setOutcome({ result, durationSec, level });
      setPhase("result");
      sfx.win();
      if (!child) return;
      act(
        {
          type: "activity.log",
          childId: child.id,
          kind: "game",
          refId: game.id,
          title: game.title,
          domain: game.domain,
          score,
          durationSec,
          details: { level, correct: result.correct, total: result.total },
        },
        { rewardTitle: "O‘yin yakunlandi!" },
      ).catch(() => toast.error("Natijani saqlab bo‘lmadi — internetni tekshiring"));
    },
    [run, level, child, act, game],
  );

  const toggleSound = () => {
    const v = !muted;
    setMuted(v);
    setMutedState(v);
    if (!v) sfx.pop();
  };

  const exit = () => {
    haptic("light");
    router.push("/games");
  };

  const progressLabel = progress.max > 0 ? (progress.label ?? `${progress.value}/${progress.max}`) : "";

  return (
    <div className="animate-fade-up">
      <GameStyles />

      {/* Yuqori panel */}
      <div className="mb-3 rounded-3xl border border-line bg-white p-2.5 shadow-card sm:p-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="secondary" size="sm" onClick={exit} className="shrink-0 px-3" aria-label="O‘yindan chiqish">
            <X className="h-4 w-4" />
            Chiqish
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <EmojiTile emoji={game.emoji} color={tint(game.color, "22")} size={38} className="rounded-xl" />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[15px] font-black text-ink sm:text-base">{game.title}</div>
              <div className="truncate text-xs font-bold text-muted">{game.skill}</div>
            </div>
          </div>
          <div className="hidden shrink-0 sm:block">
            <LevelSwitch value={level} auto={autoLevel} onChange={changeLevel} />
          </div>
          <div className="hidden w-36 shrink-0 items-center gap-2 sm:flex lg:w-44">
            <GameProgress progress={progress} label={progressLabel} color={game.color} />
          </div>
          <button
            type="button"
            onClick={toggleSound}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-ink-2 transition hover:bg-brand-50"
            aria-label={muted ? "Ovozni yoqish" : "Ovozni o‘chirish"}
            aria-pressed={!muted}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
        <div className="mt-2.5 flex items-center gap-3 sm:hidden">
          <LevelSwitch value={level} auto={autoLevel} onChange={changeLevel} />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <GameProgress progress={progress} label={progressLabel} color={game.color} />
          </div>
        </div>
      </div>

      {/* O‘yin maydoni */}
      <div
        className="relative flex min-h-[500px] flex-col overflow-hidden rounded-[28px] border border-line p-3 shadow-card [-webkit-touch-callout:none] sm:min-h-[560px] sm:p-5"
        style={{ background: `linear-gradient(180deg, ${tint(game.color, "14")} 0%, #ffffff 42%)` }}
      >
        {phase === "intro" && (
          <Intro
            game={game}
            def={def}
            level={level}
            autoLevel={autoLevel}
            childName={child?.name}
            ageLabel={age?.label}
            onStart={() => start()}
          />
        )}
        {phase === "play" && <Game key={run} level={level} seed={seed} color={game.color} onProgress={onProgress} onFinish={onFinish} />}
        {phase === "result" && outcome && (
          <ResultScreen
            result={outcome.result}
            durationSec={outcome.durationSec}
            level={outcome.level}
            childName={child?.name}
            parentTip={def.parentTip}
            onReplay={() => start(outcome.level)}
            onLevelUp={outcome.level < 3 ? () => start((outcome.level + 1) as Level) : undefined}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function GameProgress({ progress, label, color }: { progress: { value: number; max: number }; label: string; color: string }) {
  return (
    <>
      <ProgressBar value={progress.max > 0 ? progress.value : 0} max={progress.max || 1} color={color} height={10} />
      <span className="tabular min-w-[3.2rem] shrink-0 text-right text-sm font-black text-ink-2">{label}</span>
    </>
  );
}

function LevelSwitch({ value, auto, onChange }: { value: Level; auto: Level; onChange: (l: Level) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-extrabold text-muted max-[359px]:hidden">Daraja:</span>
      <div role="radiogroup" aria-label="Daraja" className="flex rounded-2xl bg-slate-100 p-1">
        {LEVELS.map((l) => {
          const on = value === l.value;
          return (
            <button
              key={l.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(l.value)}
              title={l.value === auto ? "Bolaning yoshiga mos daraja" : undefined}
              className={cn(
                "relative h-9 rounded-xl px-2.5 text-[13px] font-extrabold transition sm:px-3",
                on ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {l.label}
              {l.value === auto && <span aria-hidden className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-brand-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Intro({
  game,
  def,
  level,
  autoLevel,
  childName,
  ageLabel,
  onStart,
}: {
  game: GameMeta;
  def: GameDef;
  level: Level;
  autoLevel: Level;
  childName?: string;
  ageLabel?: string;
  onStart: () => void;
}) {
  const note = def.levelNote?.[level];
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2 py-4 text-center">
      <div className="animate-float">
        <EmojiTile emoji={game.emoji} color={tint(game.color, "26")} size={96} className="rounded-[28px] shadow-card ring-4 ring-white" />
      </div>
      <h2 className="mt-4 text-[26px] font-black leading-tight text-ink sm:text-3xl">{game.title}</h2>
      <p className="mt-2 max-w-md text-[15px] font-semibold leading-relaxed text-ink-2 sm:text-base">{def.howTo}</p>
      {note && <p className="mt-2 max-w-md rounded-2xl bg-warn/15 px-3 py-1.5 text-sm font-bold text-[#8a5a00]">{note}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Badge tone="gray">⏱ {def.duration}</Badge>
        <Badge tone="brand">Daraja: {levelLabel(level)}</Badge>
        <DomainBadge domain={game.domain} />
      </div>
      {childName && ageLabel && (
        <p className="mt-3 max-w-sm text-xs font-semibold text-muted">
          {level === autoLevel
            ? `Daraja ${childName}ning yoshiga (${ageLabel}) qarab avtomatik tanlandi.`
            : `Yoshiga mos daraja — ${levelLabel(autoLevel)}. Siz «${levelLabel(level)}»ni tanladingiz.`}
        </p>
      )}
      <Button size="lg" onClick={onStart} className="mt-5 min-w-[220px] text-lg animate-pulse-ring" aria-label={`«${game.title}» o‘yinini boshlash`}>
        <Play className="h-5 w-5 fill-current" />
        Boshlash
      </Button>
    </div>
  );
}
