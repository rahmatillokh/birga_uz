"use client";

import { Check, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { EXERCISES, getExercise } from "@/data/exercises";
import { getSpecialist } from "@/data/specialists";
import { ExerciseCard } from "@/components/exercises/exercise-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Avatar, DomainBadge, EmojiTile, EmptyState, InfoNote, LockedOverlay, PageHeader, Section } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { AI_CHECKS, DOMAINS, SECTIONS, SPECIALTIES } from "@/lib/constants";
import { useActiveChild, useChildData, useIsPremium } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import type { Activity } from "@/lib/types";
import { cn, dayKey, formatDate, todayKey } from "@/lib/utils";

export default function ExerciseDetailPage() {
  return (
    <Suspense>
      <ExerciseDetail />
    </Suspense>
  );
}

const FEELINGS: { v: NonNullable<Activity["feeling"]>; emoji: string; label: string; score: number }[] = [
  { v: "oson", emoji: "😄", label: "Oson bajardi", score: 92 },
  { v: "orta", emoji: "🙂", label: "Yaxshi, biroz yordam bilan", score: 74 },
  { v: "qiyin", emoji: "😓", label: "Qiyin bo‘ldi", score: 50 },
];

function ExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const ex = getExercise(id);
  const child = useActiveChild();
  const premium = useIsPremium();
  const { activities, assignments } = useChildData();
  const act = useApp((s) => s.act);
  const [guided, setGuided] = useState(false);
  const [finish, setFinish] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);

  const assignmentId = params.get("assignment") ?? undefined;
  const assignment = assignments.find((a) => (assignmentId ? a.id === assignmentId : a.exerciseId === id && a.status === "faol"));
  const sp = assignment ? getSpecialist(assignment.specialistId) : undefined;

  const history = useMemo(() => activities.filter((a) => a.kind === "exercise" && a.refId === id).sort((a, b) => b.at.localeCompare(a.at)), [activities, id]);
  const doneToday = history.some((a) => dayKey(a.at) === todayKey());
  const related = useMemo(() => (ex ? EXERCISES.filter((e) => e.id !== ex.id && e.topic === ex.topic).slice(0, 3) : []), [ex]);

  if (!ex) return <EmptyState emoji="🔍" title="Mashq topilmadi" action={<Button href="/exercises">Mashqlarga qaytish</Button>} />;
  const d = DOMAINS[ex.domain];
  const locked = !!ex.premium && !premium;

  async function save(feeling: (typeof FEELINGS)[number]) {
    if (!child || !ex) return;
    setSaving(true);
    await act(
      {
        type: "activity.log",
        childId: child.id,
        kind: "exercise",
        refId: ex.id,
        title: ex.title,
        domain: ex.domain,
        score: feeling.score,
        feeling: feeling.v,
        durationSec: Math.max(elapsed, 30),
        assignmentId: assignment?.id,
      },
      { rewardTitle: `«${ex.title}» bajarildi!` },
    );
    setSaving(false);
    setFinish(false);
    setGuided(false);
  }

  const soundMatch = /^log-([a-z]+)-tovush$/.exec(ex.id);
  const aiHref = ex.aiCheck
    ? ex.aiCheck === "speech"
      ? soundMatch
        ? `/speech/${soundMatch[1]}`
        : "/speech"
      : `/ai-check/${ex.aiCheck}?exercise=${ex.id}`
    : undefined;
  const mirrorHref = ex.section === "logoped" && ex.topic === "Artikulyatsiya" ? `/speech/gimnastika?ex=${ex.id}` : undefined;

  return (
    <div className="animate-fade-up">
      <PageHeader back title={ex.title} subtitle={`${SECTIONS[ex.section].label} · ${ex.topic}`} />

      {assignment && sp && (
        <div className="mb-4 flex gap-3 rounded-3xl bg-[#f4f0ff] p-4 ring-1 ring-[#e4dcff]">
          <Avatar name={sp.name} color={sp.color} size={42} />
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-ink">
              👩‍🏫 {sp.name} topshirig‘i · {SPECIALTIES[sp.specialty].label}
            </div>
            <div className="mt-0.5 text-sm text-ink-2">{assignment.note}</div>
            <div className="mt-1 text-xs font-bold text-[#6d4fe6]">Muddat: {formatDate(assignment.dueDate)} · bajarilganda +5 qo‘shimcha ball</div>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center gap-4 p-5" style={{ background: `linear-gradient(135deg, ${d.soft}, #ffffff)` }}>
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-[28px] bg-white text-6xl shadow-card">{ex.emoji}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  <DomainBadge domain={ex.domain} className="bg-white" />
                  {ex.aiCheck && <Badge tone="brand">🤖 AI tekshiruv</Badge>}
                  {ex.premium && <Badge tone="premium">💎 Premium</Badge>}
                  {doneToday && <Badge tone="good">✅ Bugun bajarildi</Badge>}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <Info label="Davomiyligi" value={`${ex.durationMin} daq`} />
                  <Info label="Yosh" value={`${ex.ageMin}–${ex.ageMax}`} />
                  <Info label="Qiyinlik" value={["Oson", "O‘rta", "Qiyin"][ex.difficulty - 1]} />
                </div>
              </div>
            </div>
            <div className="p-5 pt-4">
              <div className="text-xs font-extrabold uppercase tracking-wide text-muted">🎯 Maqsad</div>
              <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{ex.goal}</p>
              {ex.reps && (
                <p className="mt-2 text-sm font-bold text-ink">
                  🔁 Takrorlash: <span className="font-semibold text-ink-2">{ex.reps}</span>
                </p>
              )}
            </div>
          </Card>

          {locked ? (
            <LockedOverlay text="Bu mashq Premium tarifda mavjud. 7 kunlik bepul sinov bilan oching." />
          ) : (
            <Card className="p-5">
              <CardTitle>📋 Bajarish tartibi</CardTitle>
              <ol className="space-y-2.5">
                {ex.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl text-sm font-black text-white" style={{ background: d.color }}>
                      {i + 1}
                    </span>
                    <span className="text-[15px] leading-relaxed text-ink-2">{s}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button size="lg" className="flex-1" onClick={() => setGuided(true)}>
                  <Play className="h-5 w-5 fill-current" /> Mashqni boshlash
                </Button>
                {aiHref && (
                  <Button size="lg" variant="soft" className="flex-1" href={aiHref}>
                    🤖 AI bilan tekshirish
                  </Button>
                )}
                {mirrorHref && !aiHref && (
                  <Button size="lg" variant="soft" className="flex-1" href={mirrorHref}>
                    🪞 Ko‘zgu rejimida
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <CardTitle>🧺 Kerakli jihozlar</CardTitle>
            {ex.materials.length ? (
              <div className="flex flex-wrap gap-2">
                {ex.materials.map((m) => (
                  <span key={m} className="rounded-xl bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-800">
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Hech narsa kerak emas — faqat siz va bolangiz 💙</p>
            )}
          </Card>

          {!!ex.tips?.length && (
            <Card className="p-5">
              <CardTitle>💡 Ota-onaga maslahat</CardTitle>
              <ul className="space-y-2">
                {ex.tips.map((t) => (
                  <li key={t} className="flex gap-2 text-sm leading-relaxed text-ink-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {ex.aiCheck && (
            <Card className="p-5" href={aiHref}>
              <div className="flex items-center gap-3">
                <EmojiTile emoji={AI_CHECKS[ex.aiCheck].emoji} color="#e0f2fe" />
                <div>
                  <div className="font-extrabold text-ink">AI nazorat: {AI_CHECKS[ex.aiCheck].title}</div>
                  <div className="text-sm text-muted">
                    {AI_CHECKS[ex.aiCheck].kind === "speech" ? "Talaffuzni mikrofon orqali tekshiradi" : "Kamera orqali to‘g‘ri bajarilishini tekshiradi"}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <CardTitle>📈 Bajarilish tarixi</CardTitle>
            {history.length ? (
              <div className="space-y-2">
                {history.slice(0, 5).map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-semibold text-ink-2">{formatDate(h.at, { weekday: true })}</span>
                    <span className="font-extrabold text-ink">{FEELINGS.find((f) => f.v === h.feeling)?.emoji ?? "✅"} {h.score ? `${h.score}%` : ""}</span>
                  </div>
                ))}
                <div className="pt-1 text-xs font-bold text-muted">Jami: {history.length} marta bajarilgan</div>
              </div>
            ) : (
              <p className="text-sm text-muted">Hali bajarilmagan. Birinchi marta bajarib, natijani saqlang!</p>
            )}
          </Card>

          <InfoNote emoji="⚠️">Mashq paytida bola og‘riq sezsa yoki charchasa — to‘xtating. Mashqlar tashxis va davolash o‘rnini bosmaydi.</InfoNote>
        </div>
      </div>

      {related.length > 0 && (
        <Section title="O‘xshash mashqlar">
          <div className="grid gap-3 sm:grid-cols-3">
            {related.map((e) => (
              <ExerciseCard key={e.id} e={e} />
            ))}
          </div>
        </Section>
      )}

      {guided && (
        <GuidedRun
          steps={ex.steps}
          emoji={ex.emoji}
          title={ex.title}
          color={d.color}
          soft={d.soft}
          totalSec={ex.durationMin * 60}
          onClose={() => setGuided(false)}
          onDone={(sec) => {
            setElapsed(sec);
            setFinish(true);
          }}
        />
      )}

      {finish && (
        <div className="fixed inset-0 z-[85] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-pop rounded-[32px] bg-white p-6 text-center shadow-pop">
            <div className="text-6xl">🎉</div>
            <h2 className="mt-3 text-2xl font-black text-ink">Barakalla, {child?.name}!</h2>
            <p className="mt-1 text-sm text-muted">Mashq qanday o‘tdi? Natija rivojlanish pasportiga saqlanadi.</p>
            <div className="mt-5 space-y-2">
              {FEELINGS.map((f) => (
                <button
                  key={f.v}
                  disabled={saving}
                  onClick={() => save(f)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line p-3.5 text-left font-bold text-ink transition hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50"
                >
                  <span className="text-3xl">{f.emoji}</span>
                  {f.label}
                </button>
              ))}
            </div>
            <button className="mt-4 text-sm font-bold text-muted" onClick={() => setFinish(false)}>
              Keyinroq
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 px-2 py-1.5">
      <div className="text-[11px] font-bold text-muted">{label}</div>
      <div className="text-sm font-black text-ink">{value}</div>
    </div>
  );
}

/** To‘liq ekranli, qadam-baqadam mashq rejimi (taymer bilan) */
function GuidedRun({
  steps,
  emoji,
  title,
  color,
  soft,
  totalSec,
  onClose,
  onDone,
}: {
  steps: string[];
  emoji: string;
  title: string;
  color: string;
  soft: string;
  totalSec: number;
  onClose: () => void;
  onDone: (sec: number) => void;
}) {
  const [i, setI] = useState(0);
  const [running, setRunning] = useState(true);
  const [sec, setSec] = useState(0);
  const started = useRef(Date.now());
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  const last = i === steps.length - 1;
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-canvas">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))]">
        <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-2xl border border-line bg-white" aria-label="Yopish">
          <X className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-extrabold text-ink">{title}</div>
          <ProgressBar value={i + 1} max={steps.length} color={color} />
        </div>
        <div className="rounded-2xl bg-white px-3 py-2 font-mono text-lg font-black text-ink shadow-card tabular">
          {mm}:{ss}
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 text-center" key={i}>
        <div className="grid h-40 w-40 place-items-center rounded-[48px] text-[88px] animate-pop" style={{ background: soft }}>
          {emoji}
        </div>
        <div className="mt-6 text-sm font-extrabold uppercase tracking-wider" style={{ color }}>
          {i + 1}-qadam / {steps.length}
        </div>
        <p className="mt-2 max-w-xl text-2xl font-extrabold leading-snug text-ink sm:text-3xl">{steps[i]}</p>
        <div className="mt-4 text-sm font-semibold text-muted">Tavsiya etilgan vaqt: {Math.round(totalSec / 60)} daqiqa</div>
      </div>
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <Button variant="secondary" size="lg" className="w-14 px-0" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="Oldingi">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button variant="secondary" size="lg" className="w-14 px-0" onClick={() => setRunning(!running)} aria-label={running ? "Pauza" : "Davom etish"}>
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        {last ? (
          <Button
            size="lg"
            className="flex-1"
            onClick={() => {
              haptic("success");
              onDone(Math.max(sec, Math.round((Date.now() - started.current) / 1000)));
            }}
          >
            <Check className="h-5 w-5" /> Tugatdik!
          </Button>
        ) : (
          <Button size="lg" className={cn("flex-1")} onClick={() => setI(i + 1)}>
            Keyingi qadam <ChevronRight className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="lg" className="w-14 px-0" onClick={() => { setI(0); setSec(0); }} aria-label="Qaytadan">
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
