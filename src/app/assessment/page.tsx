"use client";

import { ArrowLeft, ChevronRight, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { questionsFor } from "@/data/assessment";
import { DomainTrend } from "@/components/charts/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { InfoNote, PageHeader, Section } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { AGE_BANDS, DOMAINS, DOMAIN_ORDER, bandForAge, scoreLevel } from "@/lib/constants";
import { apiPost } from "@/lib/client/api";
import { useChildData } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { AnswerValue, UserView } from "@/lib/types";
import { ageOf, cn, formatDate } from "@/lib/utils";

const ANSWERS: { v: AnswerValue; label: string; emoji: string; cls: string }[] = [
  { v: 2, label: "Ha", emoji: "✅", cls: "hover:border-good/50 hover:bg-good/5" },
  { v: 1, label: "Ba’zan", emoji: "🟡", cls: "hover:border-warn/60 hover:bg-warn/10" },
  { v: 0, label: "Yo‘q", emoji: "❌", cls: "hover:border-danger/40 hover:bg-danger/5" },
];

export default function AssessmentPage() {
  const router = useRouter();
  const { child, assessments } = useChildData();
  const act = useApp((s) => s.act);
  const mode = useApp((s) => s.mode);
  const setView = useApp((s) => s.setView);
  const [phase, setPhase] = useState<"intro" | "quiz" | "analyzing">("intro");
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [flash, setFlash] = useState<AnswerValue | null>(null);

  const age = child ? ageOf(child.birthDate).years : 4;
  const band = bandForAge(age);
  const questions = useMemo(() => questionsFor(band), [band]);
  const history = [...assessments].sort((a, b) => b.at.localeCompare(a.at));

  if (!child) return null;

  async function submit(final: Record<string, AnswerValue>) {
    if (!child) return;
    setPhase("analyzing");
    const started = Date.now();
    const res = await act({ type: "assessment.submit", childId: child.id, band, answers: final }, { rewardTitle: "Baholash yakunlandi!" });
    if (!res.ok || !res.createdId) {
      toast.error(res.error ?? "Saqlab bo‘lmadi");
      setPhase("quiz");
      return;
    }
    // Claude AI xulosasi (bo‘lmasa — qoidaga asoslangan xulosa qoladi)
    if (mode !== "offline") {
      try {
        const { data } = await apiPost<{ view?: UserView }>("/api/ai/assessment", { assessmentId: res.createdId });
        if (data.view) setView(data.view);
      } catch {
        /* xulosa baribir mavjud */
      }
    }
    const wait = 1800 - (Date.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    router.push(`/assessment/${res.createdId}?new=1`);
  }

  function answer(v: AnswerValue) {
    const q = questions[i];
    haptic("select");
    setFlash(v);
    const next = { ...answers, [q.id]: v };
    setAnswers(next);
    setTimeout(() => {
      setFlash(null);
      if (i < questions.length - 1) setI(i + 1);
      else void submit(next);
    }, 220);
  }

  if (phase === "analyzing") {
    return (
      <div className="grid min-h-[60vh] place-items-center text-center">
        <div>
          <div className="relative mx-auto grid h-32 w-32 place-items-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-brand-200/60" />
            <div className="relative grid h-28 w-28 place-items-center rounded-full bg-brand-gradient text-5xl shadow-brand">🧠</div>
          </div>
          <h2 className="mt-8 text-2xl font-black text-ink">AI natijalarni tahlil qilmoqda…</h2>
          <p className="mt-2 text-muted">6 ta yo‘nalish bo‘yicha profil, tavsiyalar va individual reja tayyorlanmoqda</p>
          <div className="mx-auto mt-6 flex max-w-xs flex-wrap justify-center gap-2">
            {DOMAIN_ORDER.map((d, k) => (
              <span key={d} className="animate-fade-up rounded-full px-3 py-1 text-xs font-extrabold text-ink-2" style={{ background: DOMAINS[d].soft, animationDelay: `${k * 180}ms` }}>
                {DOMAINS[d].emoji} {DOMAINS[d].short}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "quiz") {
    const q = questions[i];
    const dm = DOMAINS[q.domain];
    const domainIdx = DOMAIN_ORDER.indexOf(q.domain);
    return (
      <div className="mx-auto max-w-2xl animate-fade-up">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => (i === 0 ? setPhase("intro") : setI(i - 1))}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-line bg-white"
            aria-label="Orqaga"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="mb-1 flex justify-between text-xs font-extrabold text-muted">
              <span>
                {child.avatar} {child.name} · {AGE_BANDS[band].label}
              </span>
              <span className="tabular">
                {i + 1}/{questions.length}
              </span>
            </div>
            <ProgressBar value={i + 1} max={questions.length} />
          </div>
        </div>
        <div className="mb-3 flex gap-1.5">
          {DOMAIN_ORDER.map((d, k) => (
            <span key={d} className={cn("h-1.5 flex-1 rounded-full", k < domainIdx ? "opacity-100" : k === domainIdx ? "opacity-100" : "opacity-25")} style={{ background: DOMAINS[d].color }} />
          ))}
        </div>
        <Card className="overflow-hidden p-0" key={q.id}>
          <div className="flex items-center gap-3 px-5 pt-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl text-2xl" style={{ background: dm.soft }}>
              {dm.emoji}
            </span>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wide" style={{ color: dm.color }}>
                {dm.label}
              </div>
              <div className="text-xs font-semibold text-muted">{dm.description}</div>
            </div>
          </div>
          <div className="animate-fade-up px-5 pb-5 pt-4">
            <h2 className="text-[22px] font-black leading-snug text-ink sm:text-2xl">{q.text}</h2>
            {q.hint && <p className="mt-2 text-sm leading-relaxed text-muted">💡 {q.hint}</p>}
            <div className="mt-5 grid gap-2.5">
              {ANSWERS.map((a) => (
                <button
                  key={a.v}
                  onClick={() => answer(a.v)}
                  className={cn(
                    "flex h-16 items-center gap-4 rounded-2xl border-2 border-line bg-white px-5 text-left text-lg font-extrabold text-ink transition active:scale-[0.99]",
                    a.cls,
                    (answers[q.id] === a.v || flash === a.v) && "border-brand-500 bg-brand-50",
                  )}
                >
                  <span className="text-2xl">{a.emoji}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
        <p className="mt-4 text-center text-xs font-semibold text-muted">Bolangiz odatda qanday bo‘lsa, shunday javob bering — to‘g‘ri yoki noto‘g‘ri javob yo‘q.</p>
      </div>
    );
  }

  // Kirish ekrani
  return (
    <div className="animate-fade-up">
      <PageHeader emoji="🧠" title="Rivojlanish baholash" subtitle="AI yordamida bolaning 6 ta yo‘nalish bo‘yicha rivojlanish profilini aniqlang" />
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="overflow-hidden p-0 lg:col-span-3">
          <div className="bg-brand-gradient p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/95 text-3xl">{child.avatar}</div>
              <div>
                <div className="text-xl font-black">{child.name}</div>
                <div className="text-sm font-semibold text-white/85">
                  {ageOf(child.birthDate).label} · savolnoma: {AGE_BANDS[band].label}
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1">
                <Clock className="h-4 w-4" /> ~5 daqiqa
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1">📝 {questions.length} ta savol</span>
              <span className="rounded-full bg-white/20 px-3 py-1">🤖 AI xulosa</span>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DOMAIN_ORDER.map((d) => (
                <div key={d} className="flex items-center gap-2 rounded-2xl p-2.5" style={{ background: DOMAINS[d].soft }}>
                  <span className="text-xl">{DOMAINS[d].emoji}</span>
                  <span className="text-xs font-extrabold leading-tight text-ink-2">{DOMAINS[d].label}</span>
                </div>
              ))}
            </div>
            <Button size="lg" block className="mt-5" onClick={() => { setI(0); setAnswers({}); setPhase("quiz"); }} disabled={!questions.length}>
              {history.length ? "Qayta baholashni boshlash" : "Baholashni boshlash"} <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted">
              <ShieldCheck className="h-4 w-4 text-good" /> Javoblar faqat sizga va siz ruxsat bergan mutaxassisga ko‘rinadi
            </div>
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <CardTitle>Qanday ishlaydi?</CardTitle>
            <ol className="space-y-3">
              {[
                ["📝", "Savollarga javob bering", "Bolaning kundalik hayotdagi ko‘nikmalari haqida"],
                ["🤖", "AI tahlil qiladi", "Yoshga mos me’yorlar bilan solishtirib, kuchli va zaif tomonlarni aniqlaydi"],
                ["🎯", "Individual reja", "Mashqlar va tavsiyalar avtomatik tuziladi"],
                ["🔁", "Qayta baholash", "4–6 haftada bir marta — o‘sish dinamikasini ko‘rasiz"],
              ].map(([e, t, s]) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-lg">{e}</span>
                  <span>
                    <span className="block text-sm font-extrabold text-ink">{t}</span>
                    <span className="block text-xs text-muted">{s}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
          <InfoNote emoji="ℹ️">Bu skrining (dastlabki baholash) vositasi, tibbiy tashxis emas. Natijalarni mutaxassis bilan muhokama qilish tavsiya etiladi.</InfoNote>
        </div>
      </div>

      {history.length > 0 && (
        <>
          {history.length >= 2 && (
            <Section title="Rivojlanish dinamikasi">
              <Card className="p-5">
                <DomainTrend assessments={assessments} />
              </Card>
            </Section>
          )}
          <Section title="Baholashlar tarixi">
            <div className="space-y-2.5">
              {history.map((a, k) => {
                const prev = history[k + 1];
                const delta = prev ? a.overall - prev.overall : 0;
                const lvl = scoreLevel(a.overall);
                return (
                  <Link key={a.id} href={`/assessment/${a.id}`}>
                    <Card className="flex items-center gap-4 p-4 transition hover:border-brand-200">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xl font-black text-brand-700">{a.overall}%</div>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-ink">{formatDate(a.at, { year: true })}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted">
                          <span>{AGE_BANDS[a.band].label}</span>
                          <span>·</span>
                          <span>{a.source === "bot" ? "Telegram bot orqali" : a.source === "specialist" ? "Mutaxassis" : "Web ilova"}</span>
                          {a.aiGenerated && <Badge tone="premium">🤖 AI xulosa</Badge>}
                        </div>
                      </div>
                      {prev && (
                        <span className={cn("text-sm font-black", delta >= 0 ? "text-[#006300]" : "text-danger")}>
                          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}
                        </span>
                      )}
                      <span className="hidden text-xs font-extrabold sm:inline" style={{ color: lvl.color }}>
                        {lvl.icon} {lvl.label}
                      </span>
                      <ChevronRight className="h-5 w-5 text-faint" />
                    </Card>
                  </Link>
                );
              })}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
