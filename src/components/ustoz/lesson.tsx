"use client";

import { ArrowLeft, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LESSON_QUESTIONS, LESSON_TOPICS } from "@/data/lessons";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { DOMAINS } from "@/lib/constants";
import { useActiveChild, useChildData } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import type { LessonQuestion, LessonTopic } from "@/lib/types";
import { ageOf, cn } from "@/lib/utils";

const ROUNDS = 8;
const PRAISE = ["Barakalla! 🌟", "Zo‘r! 🎉", "Ajoyib! 👏", "Qoyil! 💪", "To‘ppa-to‘g‘ri! ⭐", "Juda aqllisan! 🧠"];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find((x) => x.lang.toLowerCase().startsWith("uz"));
  if (!v) return;
  const u = new SpeechSynthesisUtterance(text.replace(/[«»]/g, ""));
  u.voice = v;
  u.lang = v.lang;
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/** Ustoz AI — bola bilan moslashuvchan interaktiv dars */
export function KidLesson() {
  const child = useActiveChild();
  const { activities } = useChildData();
  const [topic, setTopic] = useState<LessonTopic | null>(null);
  const [hasVoice, setHasVoice] = useState(false);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const check = () => setHasVoice(window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith("uz")));
    check();
    window.speechSynthesis.onvoiceschanged = check;
  }, []);

  const best = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of activities) if (a.kind === "lesson") m.set(a.refId, Math.max(m.get(a.refId) ?? 0, a.score ?? 0));
    return m;
  }, [activities]);

  if (topic) return <LessonRun topic={topic} onExit={() => setTopic(null)} hasVoice={hasVoice} startLevel={child && ageOf(child.birthDate).years <= 4 ? 1 : 2} />;

  if (!LESSON_TOPICS.length) {
    return <div className="rounded-3xl border border-dashed border-brand-200 p-8 text-center text-muted">Darslar yuklanmoqda…</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 rounded-3xl bg-gradient-to-r from-[#fff7e6] to-white p-4 ring-1 ring-[#fde7b0]">
        <span className="text-5xl animate-float">👩‍🏫</span>
        <div>
          <div className="text-lg font-black text-ink">Salom, {child?.name ?? "do‘stim"}! Bugun nimani o‘rganamiz?</div>
          <div className="text-sm text-ink-2">Ustoz AI savollarni sening darajangga moslab beradi. Ota-ona savolni ovoz chiqarib o‘qib bersin.</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LESSON_TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              haptic("light");
              setTopic(t);
            }}
            className="group flex flex-col items-center rounded-3xl border border-line bg-white p-4 text-center shadow-card transition hover:-translate-y-1 hover:shadow-pop"
          >
            <span className="grid h-20 w-20 place-items-center rounded-[26px] text-5xl transition group-hover:scale-105" style={{ background: `${t.color}1f` }}>
              {t.emoji}
            </span>
            <span className="mt-2 text-[15px] font-black text-ink">{t.title}</span>
            <span className="mt-0.5 line-clamp-2 text-xs text-muted">{t.description}</span>
            {best.has(t.id) && <span className="mt-1.5 text-xs font-extrabold text-[#006300]">⭐ Eng yaxshi: {best.get(t.id)}%</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function pickQuestion(topic: string, level: 1 | 2 | 3, used: Set<string>): LessonQuestion | undefined {
  const pool = LESSON_QUESTIONS.filter((q) => q.topic === topic && q.level === level && !used.has(q.id));
  const any = pool.length ? pool : LESSON_QUESTIONS.filter((q) => q.topic === topic && !used.has(q.id));
  return any[Math.floor(Math.random() * any.length)];
}

function LessonRun({ topic, onExit, hasVoice, startLevel }: { topic: LessonTopic; onExit: () => void; hasVoice: boolean; startLevel: 1 | 2 }) {
  const child = useActiveChild();
  const act = useApp((s) => s.act);
  const [level, setLevel] = useState<1 | 2 | 3>(startLevel);
  const [used] = useState(() => new Set<string>());
  const [q, setQ] = useState<LessonQuestion | undefined>();
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [missStreak, setMissStreak] = useState(0);
  const [correctFirst, setCorrectFirst] = useState(0);
  const [done, setDone] = useState(false);
  const [praise, setPraise] = useState(PRAISE[0]);
  const [levelMsg, setLevelMsg] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const savedRef = useRef(false);

  useEffect(() => {
    const first = pickQuestion(topic.id, startLevel, used);
    if (first) used.add(first.id);
    setQ(first);
  }, [topic.id, startLevel, used]);

  const solved = picked !== null && q && picked === q.answer;

  function choose(i: number) {
    if (!q || solved) return;
    if (i === q.answer) {
      haptic("success");
      setPicked(i);
      setPraise(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
      if (!wrong.length) {
        setCorrectFirst((c) => c + 1);
        const s = streak + 1;
        setStreak(s);
        setMissStreak(0);
        if (s >= 2 && level < 3) {
          setLevel((l) => (l + 1) as 1 | 2 | 3);
          setStreak(0);
          setLevelMsg("Daraja oshdi! 🚀 Endi qiyinroq savollar");
        }
      } else {
        setStreak(0);
      }
      if (hasVoice) speak(q.explain);
    } else {
      haptic("error");
      setWrong((w) => [...w, i]);
      const m = missStreak + 1;
      setMissStreak(m);
      setStreak(0);
      if (m >= 2 && level > 1) {
        setLevel((l) => (l - 1) as 1 | 2 | 3);
        setMissStreak(0);
        setLevelMsg("Keling, osonroq savollardan davom etamiz 🙂");
      }
    }
  }

  function next() {
    setLevelMsg(null);
    if (round + 1 >= ROUNDS) {
      setDone(true);
      return;
    }
    const nq = pickQuestion(topic.id, level, used);
    if (nq) used.add(nq.id);
    setQ(nq);
    setRound(round + 1);
    setPicked(null);
    setWrong([]);
  }

  const score = Math.round((correctFirst / ROUNDS) * 100);

  useEffect(() => {
    if (!done || savedRef.current || !child) return;
    savedRef.current = true;
    void act(
      {
        type: "activity.log",
        childId: child.id,
        kind: "lesson",
        refId: topic.id,
        title: `Ustoz AI darsi: ${topic.title}`,
        domain: topic.domain,
        score,
        durationSec: Math.round((Date.now() - startedAt.current) / 1000),
        details: { level, correct: correctFirst, total: ROUNDS },
      },
      { rewardTitle: "Dars yakunlandi!" },
    );
  }, [done, child, act, topic, score, level, correctFirst]);

  if (done) {
    const stars = score >= 85 ? 3 : score >= 55 ? 2 : 1;
    return (
      <div className="mx-auto max-w-lg animate-pop rounded-[32px] border border-line bg-white p-6 text-center shadow-card">
        <div className="text-6xl">{"⭐".repeat(stars)}</div>
        <h2 className="mt-3 text-3xl font-black text-ink">Dars tugadi!</h2>
        <p className="mt-1 text-muted">
          {child?.name}, sen {ROUNDS} ta savoldan {correctFirst} tasiga birinchi urinishda to‘g‘ri javob berding!
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-brand-50 p-3">
            <div className="text-2xl font-black text-ink">{score}%</div>
            <div className="text-xs font-bold text-muted">natija</div>
          </div>
          <div className="rounded-2xl bg-[#fdf3dc] p-3">
            <div className="text-2xl font-black text-ink">{level}</div>
            <div className="text-xs font-bold text-muted">daraja</div>
          </div>
          <div className="rounded-2xl bg-[#e3f6ef] p-3">
            <div className="text-2xl font-black text-ink">{Math.round((Date.now() - startedAt.current) / 60000) || 1}</div>
            <div className="text-xs font-bold text-muted">daqiqa</div>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onExit}>
            Boshqa mavzu
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              savedRef.current = false;
              startedAt.current = Date.now();
              setDone(false);
              setRound(0);
              setCorrectFirst(0);
              setPicked(null);
              setWrong([]);
              used.clear();
              const nq = pickQuestion(topic.id, level, used);
              if (nq) used.add(nq.id);
              setQ(nq);
            }}
          >
            Yana o‘ynaymiz
          </Button>
        </div>
      </div>
    );
  }

  if (!q) return <div className="p-8 text-center text-muted">Savollar topilmadi</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onExit} className="grid h-11 w-11 place-items-center rounded-2xl border border-line bg-white" aria-label="Chiqish">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs font-extrabold text-muted">
            <span>
              {topic.emoji} {topic.title} · {level}-daraja
            </span>
            <span>
              {round + 1}/{ROUNDS}
            </span>
          </div>
          <ProgressBar value={round + (solved ? 1 : 0)} max={ROUNDS} color={topic.color} />
        </div>
      </div>

      <div className="rounded-[32px] border border-line bg-white p-5 text-center shadow-card sm:p-7" key={q.id}>
        <div className="flex items-start gap-3 text-left">
          <span className="text-5xl">👩‍🏫</span>
          <div className="relative flex-1 rounded-3xl rounded-tl-md px-4 py-3" style={{ background: DOMAINS[topic.domain].soft }}>
            <div className="text-xl font-black leading-snug text-ink sm:text-2xl">{q.prompt}</div>
            {hasVoice && (
              <button onClick={() => speak(q.prompt)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-xl bg-white/70 text-ink-2" aria-label="Ovoz chiqarib o‘qish">
                <Volume2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {q.visual && <div className="mt-5 animate-pop break-words text-[56px] leading-tight tracking-wider sm:text-[72px]">{q.visual}</div>}
        <div className={cn("mt-5 grid gap-3", q.options.length === 4 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3")}>
          {q.options.map((o, i) => {
            const isWrong = wrong.includes(i);
            const isRight = solved && i === q.answer;
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={isWrong || !!solved}
                className={cn(
                  "flex min-h-20 items-center justify-center gap-3 rounded-3xl border-2 px-4 py-3 text-xl font-black transition active:scale-95",
                  isRight ? "animate-pop border-good bg-good/10 text-[#006300]" : isWrong ? "animate-shake border-danger/40 bg-danger/5 text-danger/70" : "border-line bg-white text-ink hover:border-brand-300 hover:bg-brand-50",
                )}
              >
                {o.emoji && <span className="text-4xl">{o.emoji}</span>}
                <span>{o.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 min-h-16">
          {solved ? (
            <div className="animate-fade-up">
              <div className="text-2xl font-black text-[#006300]">{praise}</div>
              <p className="mt-1 text-[15px] text-ink-2">{q.explain}</p>
              {levelMsg && <p className="mt-1 text-sm font-extrabold text-brand-600">{levelMsg}</p>}
              <Button size="lg" className="mt-4 min-w-48" onClick={next}>
                {round + 1 >= ROUNDS ? "Natijani ko‘rish 🏁" : "Keyingi savol →"}
              </Button>
            </div>
          ) : wrong.length ? (
            <div className="animate-fade-up rounded-2xl bg-[#fff7e6] p-3 text-[15px] font-bold text-[#8a5a00]">
              💡 {q.hint}
              {levelMsg && <div className="mt-1 text-sm text-brand-600">{levelMsg}</div>}
            </div>
          ) : (
            <p className="text-sm font-semibold text-muted">To‘g‘ri javobni tanlang</p>
          )}
        </div>
      </div>
    </div>
  );
}
