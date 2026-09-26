"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getExercise } from "@/data/exercises";
import { getSpecialist } from "@/data/specialists";
import { TaskRow } from "@/components/home/task-row";
import { AiExerciseGenerator } from "@/components/exercises/ai-exercise";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Avatar, EmptyState, PageHeader, Section, StatTile } from "@/components/ui/misc";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { DOMAINS, SPECIALTIES, WEEKDAYS_SHORT } from "@/lib/constants";
import { FREQUENCY_LABEL, isScheduled } from "@/lib/core/plan";
import { adherence, todayTasks } from "@/lib/core/stats";
import { apiPost } from "@/lib/client/api";
import { useChildData } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { toast } from "@/lib/client/toast";
import type { UserView } from "@/lib/types";
import { addDays, cn, dayKey, formatDate, todayKey, weekdayOf } from "@/lib/utils";

export default function PlanPage() {
  const { child, plan, assignments, activities, latest } = useChildData();
  const mode = useApp((s) => s.mode);
  const act = useApp((s) => s.act);
  const setView = useApp((s) => s.setView);
  const [busy, setBusy] = useState(false);

  const tasks = useMemo(() => todayTasks(plan, assignments, activities), [plan, assignments, activities]);
  const done = tasks.filter((t) => t.done).length;
  const adh = useMemo(() => adherence(plan, assignments, activities), [plan, assignments, activities]);

  const today = todayKey();
  const monday = addDays(today, -(weekdayOf(today) - 1));
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const doneByDay = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const a of activities) {
      if (a.kind !== "exercise") continue;
      const k = dayKey(a.at);
      if (!m.has(k)) m.set(k, new Set());
      m.get(k)!.add(a.refId);
    }
    return m;
  }, [activities]);

  if (!child) return null;

  async function regenerate() {
    if (!child) return;
    setBusy(true);
    try {
      if (mode === "offline") {
        await act({ type: "plan.generate", childId: child.id }, { silent: true });
        toast.success("Reja yangilandi");
        return;
      }
      const { data } = await apiPost<{ ok: boolean; ai: boolean; view?: UserView; error?: string }>("/api/ai/plan", { childId: child.id });
      if (data.view) setView(data.view);
      toast.success(data.ai ? "Claude AI yangi individual reja tuzdi" : "Reja natijalar asosida yangilandi", "🤖");
    } catch {
      toast.error("Rejani yangilab bo‘lmadi");
    } finally {
      setBusy(false);
    }
  }

  const activeAsg = assignments.filter((a) => a.status === "faol");

  return (
    <div className="animate-fade-up">
      <PageHeader
        emoji="🎯"
        title="Individual rivojlanish rejasi"
        subtitle={`${child.name} uchun — baholash natijalari va mutaxassis topshiriqlari asosida`}
        actions={
          <Button variant="soft" onClick={regenerate} loading={busy} className="hidden sm:inline-flex">
            <Sparkles className="h-4 w-4" /> AI bilan yangilash
          </Button>
        }
      />

      {!plan ? (
        <EmptyState emoji="🧠" title="Reja hali tuzilmagan" text="Rivojlanish baholashidan o‘ting — reja avtomatik tuziladi." action={<Button href="/assessment">Baholashni boshlash</Button>} />
      ) : (
        <>
          <Card className="overflow-hidden p-0">
            <div className="bg-gradient-to-br from-brand-50 via-white to-[#f4f0ff] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={plan.source === "ai" ? "premium" : plan.source === "specialist" ? "good" : "brand"}>
                  {plan.source === "ai" ? "🤖 AI tomonidan tuzilgan" : plan.source === "specialist" ? "👩‍⚕️ Mutaxassis rejasi" : "📋 Natijalar asosida"}
                </Badge>
                <Badge tone="gray">📅 {formatDate(plan.createdAt, { year: true })}</Badge>
                <Badge tone="gray">⏳ {plan.weeks} hafta</Badge>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{plan.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {plan.focus.map((d) => (
                  <span key={d} className="rounded-full px-3 py-1 text-sm font-extrabold text-ink" style={{ background: DOMAINS[d].soft }}>
                    {DOMAINS[d].emoji} {DOMAINS[d].label}
                  </span>
                ))}
              </div>
              <Button variant="soft" onClick={regenerate} loading={busy} className="mt-4 sm:hidden" block>
                <Sparkles className="h-4 w-4" /> AI bilan yangilash
              </Button>
            </div>
          </Card>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Bugun" value={`${done}/${tasks.length}`} emoji="✅" hint="bajarilgan mashqlar" color="#e3f6ef" />
            <StatTile label="Rejaga amal" value={`${adh}%`} emoji="📊" hint="oxirgi 7 kun" color="#e0f2fe" />
            <StatTile label="Mashqlar" value={plan.items.length} emoji="🎯" hint="rejada" color="#fdf3dc" />
            <StatTile label="Topshiriqlar" value={activeAsg.length} emoji="👩‍🏫" hint="mutaxassisdan" color="#efeaff" />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-5">
            <Card className="p-5 lg:col-span-3">
              <CardTitle action={<ProgressRing value={tasks.length ? done / tasks.length : 0} size={44} stroke={5}><span className="text-[11px] font-black">{tasks.length ? Math.round((done / tasks.length) * 100) : 0}%</span></ProgressRing>}>
                📅 Bugungi mashg‘ulotlar
              </CardTitle>
              <div className="space-y-2">
                {tasks.map((t) => (
                  <TaskRow key={t.exercise.id} task={t} />
                ))}
                {!tasks.length && <p className="py-4 text-center text-sm text-muted">Bugun dam olish kuni 🌿 Xohlasangiz o‘yin o‘ynang!</p>}
              </div>
            </Card>

            <Card className="p-5 lg:col-span-2">
              <CardTitle>🏁 6 haftalik maqsadlar</CardTitle>
              <div className="space-y-4">
                {plan.goals.map((g) => {
                  const cur = latest?.scores[g.domain] ?? 0;
                  return (
                    <div key={g.domain}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-extrabold text-ink">
                          {DOMAINS[g.domain].emoji} {DOMAINS[g.domain].label}
                        </span>
                        <span className="text-xs font-bold text-muted tabular">
                          {cur}% → {g.target}%
                        </span>
                      </div>
                      <p className="mb-1.5 mt-0.5 text-xs leading-snug text-muted">{g.text}</p>
                      <ProgressBar value={cur} max={g.target} color={DOMAINS[g.domain].color} />
                    </div>
                  );
                })}
              </div>
              <Button href="/assessment" variant="secondary" block className="mt-5">
                🧠 Qayta baholash
              </Button>
            </Card>
          </div>

          <Section title="Haftalik jadval">
            <Card className="overflow-x-auto p-4">
              <div className="grid min-w-[640px] grid-cols-[minmax(160px,1.6fr)_repeat(7,minmax(52px,1fr))] gap-1.5">
                <div />
                {week.map((k) => (
                  <div key={k} className={cn("rounded-xl py-1.5 text-center text-xs font-extrabold", k === today ? "bg-brand-500 text-white" : "text-muted")}>
                    {WEEKDAYS_SHORT[weekdayOf(k) - 1]}
                    <div className={cn("text-[10px] font-bold", k === today ? "text-white/80" : "text-faint")}>{k.slice(8)}</div>
                  </div>
                ))}
                {plan.items.map((it) => {
                  const ex = getExercise(it.exerciseId);
                  if (!ex) return null;
                  return (
                    <div key={it.exerciseId} className="contents">
                      <Link href={`/exercises/${ex.id}`} className="flex items-center gap-2 truncate rounded-xl px-2 py-1.5 text-sm font-bold text-ink hover:bg-brand-50">
                        <span>{ex.emoji}</span>
                        <span className="truncate">{ex.title}</span>
                      </Link>
                      {week.map((k) => {
                        const sched = isScheduled(it, k);
                        const ok = doneByDay.get(k)?.has(ex.id);
                        return (
                          <div key={k} className="grid place-items-center">
                            {sched ? (
                              <span
                                className={cn(
                                  "grid h-8 w-8 place-items-center rounded-xl text-sm font-black",
                                  ok ? "bg-good/15 text-[#006300]" : k < today ? "bg-slate-100 text-faint" : "bg-brand-50 text-brand-600",
                                )}
                                title={ok ? "Bajarildi" : "Rejada"}
                              >
                                {ok ? "✓" : "•"}
                              </span>
                            ) : (
                              <span className="h-8 w-8" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-muted">
                <span className="flex items-center gap-1.5"><span className="grid h-5 w-5 place-items-center rounded-lg bg-good/15 text-[#006300]">✓</span> Bajarildi</span>
                <span className="flex items-center gap-1.5"><span className="grid h-5 w-5 place-items-center rounded-lg bg-brand-50 text-brand-600">•</span> Rejada</span>
                <span className="flex items-center gap-1.5"><span className="grid h-5 w-5 place-items-center rounded-lg bg-slate-100 text-faint">•</span> O‘tkazib yuborilgan</span>
              </div>
            </Card>
          </Section>

          <Section title="Rejadagi mashqlar">
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.items.map((it) => {
                const ex = getExercise(it.exerciseId);
                if (!ex) return null;
                const sp = it.assignedBy ? getSpecialist(it.assignedBy) : undefined;
                return (
                  <Card key={it.exerciseId} href={`/exercises/${ex.id}`} className="flex items-center gap-3 p-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: DOMAINS[ex.domain].soft }}>
                      {ex.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-extrabold text-ink">{ex.title}</div>
                      <div className="truncate text-xs font-semibold text-muted">{it.reason}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge tone="gray">{FREQUENCY_LABEL[it.frequency]}</Badge>
                        {sp && <Badge tone="premium">👩‍🏫 {sp.name.split(" ")[0]}</Badge>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Section>

          <Section title="AI individual mashq">
            <AiExerciseGenerator />
          </Section>

          {activeAsg.length > 0 && (
            <Section title="Mutaxassis topshiriqlari">
              <div className="space-y-2.5">
                {activeAsg.map((a) => {
                  const sp = getSpecialist(a.specialistId);
                  const ex = getExercise(a.exerciseId);
                  return (
                    <Card key={a.id} className="flex gap-3 p-4" href={ex ? `/exercises/${ex.id}?assignment=${a.id}` : undefined}>
                      <Avatar name={sp?.name} color={sp?.color} size={42} />
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-ink">{a.title}</div>
                        <div className="text-xs font-bold text-muted">
                          {sp?.name} · {sp ? SPECIALTIES[sp.specialty].label : ""} · {FREQUENCY_LABEL[a.frequency]} · muddat {formatDate(a.dueDate)}
                        </div>
                        <p className="mt-1 text-sm text-ink-2">{a.note}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
