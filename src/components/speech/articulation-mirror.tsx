"use client";

import { Camera, CameraOff, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmojiTile, EmptyState, PageHeader } from "@/components/ui/misc";
import { Chips } from "@/components/ui/tabs";
import { EXERCISES } from "@/data/exercises";
import { useChildData, useIsPremium } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import { AI_CHECKS, DOMAINS } from "@/lib/constants";
import { useCamera, useRafLoop } from "@/lib/speech/hooks";
import type { Exercise } from "@/lib/types";
import { clamp, cn } from "@/lib/utils";

type TimerPhase = "idle" | "ready" | "hold" | "rest" | "done";
const READY_SEC = 3;
const REST_SEC = 3;

/** Mashq matnidan taymer rejasini chiqaramiz: «5 soniya ushlab turing», «10–15 marta» */
function timerPlan(ex: Exercise) {
  const all = [ex.reps ?? "", ...ex.steps, ex.goal].join(" ").toLowerCase();
  const holdM = /(\d+)\s*(?:[–-]\s*\d+\s*)?soniya/.exec(all);
  const repRe = /(\d+)\s*(?:[–-]\s*\d+\s*)?marta/;
  const repsM = repRe.exec(ex.reps ?? "") ?? repRe.exec(all);
  const hold = clamp(holdM ? Number(holdM[1]) : 5, 3, 15);
  const reps = clamp(repsM ? Number(repsM[1]) : 5, 3, 10);
  const isStatic = !!holdM && /ushla|saqla/.test(all);
  return { hold, reps, verb: isStatic ? "Ushlab tur" : "Bajar" };
}

export function ArticulationMirror({ initialId }: { initialId?: string }) {
  const list = useMemo(() => EXERCISES.filter((e) => e.section === "logoped" && e.topic === "Artikulyatsiya"), []);
  const [exId, setExId] = useState<string | undefined>(() => (initialId && list.some((e) => e.id === initialId) ? initialId : list[0]?.id));
  const ex = list.find((e) => e.id === exId) ?? list[0];
  const plan = useMemo(() => (ex ? timerPlan(ex) : { hold: 5, reps: 5, verb: "Bajar" }), [ex]);
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState<{ phase: TimerPhase; rep: number; left: number }>({ phase: "idle", rep: 0, left: 0 });
  const [logged, setLogged] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { videoRef, status: camStatus, error: camError, start: startCam, stop: stopCam } = useCamera();
  const act = useApp((s) => s.act);
  const { child } = useChildData();
  const premium = useIsPremium();
  const t = useRef({ phase: "idle" as TimerPhase, rep: 0, left: 0, emit: 0 });
  const openedAtRef = useRef(0);

  useEffect(() => {
    openedAtRef.current = Date.now();
  }, []);

  const running = timer.phase === "ready" || timer.phase === "hold" || timer.phase === "rest";

  useRafLoop(running, (dt) => {
    const s = t.current;
    s.left -= dt;
    s.emit += dt;
    if (s.left > 0) {
      if (s.emit >= 0.1) {
        s.emit = 0;
        setTimer({ phase: s.phase, rep: s.rep, left: s.left });
      }
      return;
    }
    if (s.phase === "ready" || s.phase === "rest") {
      s.phase = "hold";
      s.left = plan.hold;
      haptic("medium");
    } else if (s.phase === "hold") {
      s.rep += 1;
      if (s.rep >= plan.reps) {
        s.phase = "done";
        s.left = 0;
        haptic("success");
      } else {
        s.phase = "rest";
        s.left = REST_SEC;
        haptic("light");
      }
    }
    s.emit = 0;
    setTimer({ phase: s.phase, rep: s.rep, left: Math.max(0, s.left) });
  });

  function startTimer() {
    t.current = { phase: "ready", rep: 0, left: READY_SEC, emit: 0 };
    setTimer({ phase: "ready", rep: 0, left: READY_SEC });
  }

  function resetTimer() {
    t.current = { phase: "idle", rep: 0, left: 0, emit: 0 };
    setTimer({ phase: "idle", rep: 0, left: 0 });
  }

  function selectExercise(id: string) {
    setExId(id);
    setStep(0);
    resetTimer();
    openedAtRef.current = Date.now();
  }

  async function markDone() {
    if (!ex || saving) return;
    if (!child) {
      toast.error("Avval bola profilini tanlang");
      return;
    }
    setSaving(true);
    const durationSec = Math.max(20, Math.round((Date.now() - openedAtRef.current) / 1000));
    const res = await act(
      {
        type: "activity.log",
        childId: child.id,
        kind: "exercise",
        refId: ex.id,
        title: ex.title,
        domain: ex.domain,
        durationSec,
        details: { mirror: true, camera: camStatus === "ready", reps: plan.reps },
      },
      { rewardTitle: `«${ex.title}» mashqi bajarildi!` },
    ).catch(() => null);
    setSaving(false);
    if (res?.ok) setLogged((l) => [...l, ex.id]);
    else toast.error("Saqlab bo‘lmadi. Qayta urinib ko‘ring");
  }

  const header = (
    <PageHeader
      back="/speech"
      emoji="🪞"
      title="Ko‘zgu oldida gimnastika"
      subtitle="Artikulyatsion mashqlar: bola o‘zini ko‘rib, lab va tilni to‘g‘ri harakatlantiradi"
    />
  );

  if (!ex) {
    return (
      <div className="animate-fade-up">
        {header}
        <EmptyState
          emoji="👅"
          title="Mashqlar tayyorlanmoqda"
          text="Artikulyatsion gimnastika mashqlari tez orada qo‘shiladi."
          action={<Button href="/speech">Nutq bo‘limiga qaytish</Button>}
        />
      </div>
    );
  }

  const isLogged = logged.includes(ex.id);
  const idx = list.findIndex((e) => e.id === ex.id);
  const nextEx = list.length > 1 ? list[(idx + 1) % list.length] : undefined;
  const stepsLen = ex.steps.length;
  const phaseTitle =
    timer.phase === "ready" ? "Tayyorlan…" : timer.phase === "hold" ? `${plan.verb}!` : timer.phase === "rest" ? "Dam ol 😌" : timer.phase === "done" ? "Barakalla! 🎉" : "";
  const phaseTotal = timer.phase === "ready" ? READY_SEC : timer.phase === "hold" ? plan.hold : timer.phase === "rest" ? REST_SEC : 1;

  return (
    <div className="animate-fade-up">
      {header}

      {list.length > 1 && (
        <Chips
          className="mb-4"
          value={ex.id}
          onChange={selectExercise}
          items={list.map((e) => ({ value: e.id, label: e.title, emoji: logged.includes(e.id) ? "✅" : e.emoji }))}
        />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        {/* Ko‘zgu va taymer */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-700 to-slate-900 shadow-pop ring-4 ring-white">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn("h-full w-full object-cover", camStatus !== "ready" && "invisible")}
              style={{ transform: "scaleX(-1)" }}
            />
            <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">🪞 Ko‘zgu</span>
            {camStatus === "ready" ? (
              <button
                type="button"
                onClick={stopCam}
                className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-2xl bg-black/35 text-white backdrop-blur transition hover:bg-black/50"
                aria-label="Kamerani o‘chirish"
              >
                <CameraOff className="h-5 w-5" />
              </button>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center text-white">
                <div className="text-5xl leading-none">🪞</div>
                <p className="mt-3 max-w-xs text-sm leading-snug text-white/85">
                  Old kamerani yoqing — bola o‘zini ko‘rib, harakatni to‘g‘ri bajaradi. Tasvir yozib olinmaydi va hech qayerga yuborilmaydi.
                </p>
                {camError && (
                  <p className="mt-2 max-w-xs rounded-xl bg-white/10 px-3 py-2 text-xs leading-snug">
                    <b>{camError.title}.</b> {camError.text}
                  </p>
                )}
                <Button className="mt-4" loading={camStatus === "requesting"} onClick={() => void startCam()}>
                  <Camera className="h-5 w-5" />
                  {camError ? "Qayta urinish" : "Kamerani yoqish"}
                </Button>
                {camError && <p className="mt-2 text-xs text-white/70">Oddiy ko‘zgu oldida bajarsangiz ham bo‘ladi 🪞</p>}
              </div>
            )}
            {camStatus === "ready" && timer.phase !== "idle" && (
              <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-black/45 p-2.5 text-white backdrop-blur">
                {timer.phase !== "done" && <Countdown left={timer.left} total={phaseTotal} dark />}
                <div className="min-w-0">
                  <div className="text-lg font-black leading-tight">{phaseTitle}</div>
                  <div className="text-sm text-white/80">
                    {timer.phase === "done" ? `${plan.reps} marta bajarildi` : `${Math.min(timer.rep + 1, plan.reps)} / ${plan.reps} marta`}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold text-muted">Mashq taymeri</div>
                <div className="text-lg font-black leading-tight text-ink">
                  {plan.verb}: {plan.hold} soniya × {plan.reps} marta
                </div>
              </div>
              {running ? (
                <Button variant="secondary" onClick={resetTimer}>
                  <Pause className="h-4 w-4" />
                  To‘xtatish
                </Button>
              ) : (
                <Button onClick={startTimer}>
                  <Play className="h-4 w-4 fill-current" />
                  {timer.phase === "done" ? "Yana" : "Boshlash"}
                </Button>
              )}
            </div>
            {timer.phase !== "idle" && (
              <div className="mt-4 flex items-center gap-4">
                {timer.phase !== "done" ? (
                  <Countdown left={timer.left} total={phaseTotal} />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-good/10 text-3xl">🎉</span>
                )}
                <div className="min-w-0">
                  <div className="text-xl font-black text-ink" aria-live="polite">
                    {phaseTitle}
                  </div>
                  <div className="text-sm text-muted">
                    {timer.phase === "done"
                      ? "Hammasi bajarildi — endi «Bajarildi» tugmasini bosing"
                      : timer.phase === "rest"
                        ? "Keyingisiga tayyorlan"
                        : `${Math.min(timer.rep + 1, plan.reps)}-marta`}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-1.5" aria-label={`${timer.rep} / ${plan.reps} marta bajarildi`}>
              {Array.from({ length: plan.reps }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2.5 flex-1 rounded-full transition",
                    i < timer.rep ? "bg-brand-500" : i === timer.rep && timer.phase === "hold" ? "animate-pulse bg-brand-300" : "bg-slate-200",
                  )}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Ko‘rsatma */}
        <div className="space-y-3">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <EmojiTile emoji={ex.emoji} color={DOMAINS.nutq.soft} size={56} />
              <div className="min-w-0 flex-1">
                <div className="text-xl font-black leading-tight text-ink">{ex.title}</div>
                <p className="mt-1 text-sm leading-snug text-muted">{ex.goal}</p>
              </div>
            </div>
            {stepsLen > 0 && (
              <div className="mt-4 rounded-3xl bg-canvas p-4 ring-1 ring-line">
                <div className="flex items-center justify-between gap-2 text-xs font-bold text-muted">
                  <span>
                    Qadam {step + 1} / {stepsLen}
                  </span>
                  {ex.reps && <span className="truncate">🔁 {ex.reps}</span>}
                </div>
                <p key={`${ex.id}-${step}`} className="mt-2 min-h-[4.5rem] animate-fade-up text-lg font-extrabold leading-snug text-ink">
                  {ex.steps[step]}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Button variant="secondary" size="icon" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} aria-label="Oldingi qadam">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {ex.steps.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setStep(i)}
                        className={cn("h-2.5 rounded-full transition-all", i === step ? "w-6 bg-brand-500" : "w-2.5 bg-slate-300 hover:bg-slate-400")}
                        aria-label={`${i + 1}-qadam`}
                      />
                    ))}
                  </div>
                  <Button
                    variant={step + 1 < stepsLen ? "primary" : "secondary"}
                    size="icon"
                    onClick={() => setStep((s) => Math.min(stepsLen - 1, s + 1))}
                    disabled={step + 1 >= stepsLen}
                    aria-label="Keyingi qadam"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
            {ex.materials.length > 0 && <p className="mt-3 text-sm text-muted">🧰 Kerak: {ex.materials.join(", ")}</p>}
            <Button size="lg" block className="mt-4" variant={isLogged ? "secondary" : "primary"} disabled={isLogged} loading={saving} onClick={() => void markDone()}>
              {isLogged ? "Belgilandi ✅" : "✅ Bajarildi"}
            </Button>
            {isLogged && nextEx && nextEx.id !== ex.id && (
              <Button variant="soft" block className="mt-2" onClick={() => selectExercise(nextEx.id)}>
                Keyingi: {nextEx.emoji} {nextEx.title}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <EmojiTile emoji={AI_CHECKS["smile-pucker"].emoji} color="#efeaff" size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 font-extrabold text-ink">
                  {AI_CHECKS["smile-pucker"].title}
                  {!premium && <Badge tone="premium">💎 Premium</Badge>}
                </div>
                <p className="mt-0.5 text-sm leading-snug text-muted">Lablar harakatini kamera orqali sun’iy intellekt kuzatib, baholaydi.</p>
              </div>
            </div>
            <Button variant="soft" block className="mt-3" href="/ai-check/smile-pucker">
              🤖 AI bilan tekshirish
            </Button>
          </Card>

          {ex.tips && ex.tips.length > 0 && (
            <Card className="p-4 sm:p-5">
              <CardTitle>Ota-onaga maslahat</CardTitle>
              <ul className="space-y-1.5 text-sm leading-snug text-ink-2">
                {ex.tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span aria-hidden>💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Countdown({ left, total, dark }: { left: number; total: number; dark?: boolean }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const v = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  return (
    <div className="relative grid h-16 w-16 shrink-0 place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="32" r={r} stroke={dark ? "rgba(255,255,255,0.25)" : "#e0f2fe"} strokeWidth="6" fill="none" />
        <circle
          cx="32"
          cy="32"
          r={r}
          stroke={dark ? "#7dd3fc" : "#0ea5e9"}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      <span className={cn("tabular text-2xl font-black", dark ? "text-white" : "text-ink")}>{Math.max(0, Math.ceil(left))}</span>
    </div>
  );
}
