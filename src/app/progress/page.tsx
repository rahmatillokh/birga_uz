"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { ActivityBars, DomainRadar, DomainTrend, ScoreLine } from "@/components/charts/charts";
import { AiInsight } from "@/components/home/daily-tip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState, LockedOverlay, PageHeader, Section, StatTile } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { AI_CHECKS, DOMAINS, DOMAIN_ORDER, WEEKDAYS_SHORT } from "@/lib/constants";
import { activitiesInRange, dailySeries, domainActivityCounts, weeklySeries } from "@/lib/core/stats";
import { useChildData, useIsPremium } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import type { Activity, ActivityKind } from "@/lib/types";
import { addDays, cn, formatDate, formatDateTime, todayKey } from "@/lib/utils";

const KIND: Record<ActivityKind, { label: string; emoji: string }> = {
  exercise: { label: "Mashq", emoji: "🎯" },
  game: { label: "O‘yin", emoji: "🎮" },
  video: { label: "Video", emoji: "🎥" },
  ai_check: { label: "AI video nazorat", emoji: "📹" },
  speech: { label: "Talaffuz", emoji: "🎙️" },
  lesson: { label: "AI darsi", emoji: "✨" },
  assessment: { label: "Baholash", emoji: "🧠" },
  article: { label: "Maqola", emoji: "📚" },
};

type Period = "7" | "30" | "90";

export default function ProgressPage() {
  const { child, activities, assessments, latest, first, points, level, streak } = useChildData();
  const premium = useIsPremium();
  const act = useApp((s) => s.act);
  const [period, setPeriod] = useState<Period>("30");
  const [kindFilter, setKindFilter] = useState<ActivityKind | "all">("all");

  const days = Number(period);
  const from = addDays(todayKey(), -(days - 1));
  const inRange = useMemo(() => activitiesInRange(activities, from), [activities, from]);
  const prevRange = useMemo(() => activitiesInRange(activities, addDays(from, -days), addDays(from, -1)), [activities, from, days]);

  const scored = inRange.filter((a) => typeof a.score === "number" && a.kind !== "assessment");
  const avg = scored.length ? Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length) : 0;
  const prevScored = prevRange.filter((a) => typeof a.score === "number" && a.kind !== "assessment");
  const prevAvg = prevScored.length ? Math.round(prevScored.reduce((s, a) => s + (a.score ?? 0), 0) / prevScored.length) : 0;
  const activeDays = new Set(inRange.map((a) => a.at.slice(0, 10))).size;
  const minutes = Math.round(inRange.reduce((s, a) => s + (a.durationSec ?? 0), 0) / 60);

  const bars = useMemo(() => {
    if (days <= 30) {
      return dailySeries(activities, days).map((d) => ({
        label: days === 7 ? WEEKDAYS_SHORT[d.weekday - 1] : d.day.slice(8),
        value: d.count,
        tooltip: formatDate(d.day, { weekday: true }),
      }));
    }
    return weeklySeries(activities, 13).map((w) => ({ label: formatDate(w.start).replace(/ .*/, "") + "." + w.start.slice(5, 7), value: w.count, tooltip: `${formatDate(w.start)} haftasi` }));
  }, [activities, days]);

  const byDomain = domainActivityCounts(inRange);
  const maxDomain = Math.max(1, ...Object.values(byDomain));

  const aiSeries = useMemo(
    () =>
      activities
        .filter((a) => a.kind === "ai_check" && typeof a.score === "number")
        .slice(-14)
        .map((a) => ({ label: formatDate(a.at), value: a.score! })),
    [activities],
  );
  const speechSeries = useMemo(
    () =>
      activities
        .filter((a) => a.kind === "speech" && typeof a.score === "number")
        .slice(-14)
        .map((a) => ({ label: formatDate(a.at), value: a.score! })),
    [activities],
  );

  const history = useMemo(
    () => [...inRange].filter((a) => kindFilter === "all" || a.kind === kindFilter).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 25),
    [inRange, kindFilter],
  );

  if (!child) return null;
  const deltaCount = inRange.length - prevRange.length;

  return (
    <div className="animate-fade-up">
      <PageHeader emoji="📈" title="Progress va monitoring" subtitle={`${child.name}ning barcha mashqlari, o‘yinlari, AI natijalari va baholashlari bir joyda`} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={period}
          onChange={(p) => setPeriod(p)}
          items={[
            { value: "7", label: "7 kun" },
            { value: "30", label: "30 kun" },
            { value: "90", label: "90 kun" },
          ]}
          className="sm:w-80"
        />
        <div className="flex items-center gap-2 text-sm font-bold text-muted">
          {level.emoji} {level.title} · {points} ball · 🔥 {streak.current} kun
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Mashg‘ulotlar"
          value={inRange.length}
          emoji="🎯"
          color="#e0f2fe"
          hint={
            <span className={deltaCount >= 0 ? "text-[#006300]" : "text-danger"}>
              {deltaCount >= 0 ? "▲" : "▼"} {Math.abs(deltaCount)} oldingi davrga nisbatan
            </span>
          }
        />
        <StatTile
          label="O‘rtacha natija"
          value={`${avg}%`}
          emoji="⭐"
          color="#fdf3dc"
          hint={prevAvg ? <span className={avg >= prevAvg ? "text-[#006300]" : "text-danger"}>{avg >= prevAvg ? "▲" : "▼"} {Math.abs(avg - prevAvg)} ball</span> : "—"}
        />
        <StatTile label="Faol kunlar" value={`${activeDays}/${days}`} emoji="📅" color="#e3f6ef" hint={`eng uzun seriya: ${streak.best} kun`} />
        <StatTile label="Mashg‘ulot vaqti" value={`${minutes} daq`} emoji="⏱️" color="#efeaff" hint={`kuniga o‘rtacha ${Math.round(minutes / days)} daq`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <CardTitle>📊 Faollik</CardTitle>
          <ActivityBars data={bars} height={220} />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <CardTitle>🧭 Yo‘nalishlar bo‘yicha mashg‘ulotlar</CardTitle>
          <div className="space-y-3">
            {DOMAIN_ORDER.map((d) => (
              <div key={d}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-bold text-ink-2">
                    {DOMAINS[d].emoji} {DOMAINS[d].label}
                  </span>
                  <span className="font-black text-ink tabular">{byDomain[d]}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full" style={{ background: DOMAINS[d].soft }}>
                  <div className="h-full rounded-full" style={{ width: `${(byDomain[d] / maxDomain) * 100}%`, background: DOMAINS[d].color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Section title="Avvalgi va hozirgi natijalar" href="/assessment" linkLabel="Baholashlar">
        {latest ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <DomainRadar current={latest.scores} previous={first && first.id !== latest.id ? first.scores : undefined} />
            </Card>
            <Card className="overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-extrabold uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Yo‘nalish</th>
                    <th className="px-2 py-3 text-right">Avval</th>
                    <th className="px-2 py-3 text-right">Hozir</th>
                    <th className="px-4 py-3 text-right">O‘zgarish</th>
                  </tr>
                </thead>
                <tbody>
                  {DOMAIN_ORDER.map((d) => {
                    const a = first?.scores[d] ?? 0;
                    const b = latest.scores[d];
                    return (
                      <tr key={d} className="border-t border-line">
                        <td className="px-4 py-3 font-bold text-ink">
                          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: DOMAINS[d].color }} />
                          {DOMAINS[d].label}
                        </td>
                        <td className="px-2 py-3 text-right font-semibold text-muted tabular">{a}%</td>
                        <td className="px-2 py-3 text-right font-black text-ink tabular">{b}%</td>
                        <td className={cn("px-4 py-3 text-right font-black tabular", b - a > 0 ? "text-[#006300]" : b - a < 0 ? "text-danger" : "text-muted")}>
                          {b - a > 0 ? "▲ " : b - a < 0 ? "▼ " : ""}
                          {Math.abs(b - a)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-line bg-brand-50/50">
                    <td className="px-4 py-3 font-black text-ink">Umumiy</td>
                    <td className="px-2 py-3 text-right font-semibold text-muted tabular">{first?.overall ?? 0}%</td>
                    <td className="px-2 py-3 text-right font-black text-ink tabular">{latest.overall}%</td>
                    <td className="px-4 py-3 text-right font-black text-[#006300] tabular">▲ {latest.overall - (first?.overall ?? 0)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="px-4 py-3 text-xs font-semibold text-muted">
                {first ? `${formatDate(first.at, { year: true })} → ${formatDate(latest.at, { year: true })} · ${assessments.length} ta baholash` : ""}
              </div>
            </Card>
          </div>
        ) : (
          <EmptyState emoji="🧠" title="Baholash yo‘q" action={<Button href="/assessment">Baholashdan o‘tish</Button>} />
        )}
      </Section>

      {assessments.length >= 2 && (
        <Section title="Rivojlanish grafigi">
          <Card className="p-5">
            <DomainTrend assessments={assessments} />
          </Card>
        </Section>
      )}

      <Section title="AI natijalari">
        {premium ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <CardTitle action={<Badge tone="brand">📹 kamera</Badge>}>AI video nazorat aniqligi</CardTitle>
              <ScoreLine data={aiSeries} name="Aniqlik" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(Object.keys(AI_CHECKS) as (keyof typeof AI_CHECKS)[])
                  .filter((k) => AI_CHECKS[k].kind !== "speech")
                  .map((k) => {
                    const n = activities.filter((a) => a.kind === "ai_check" && a.refId === k).length;
                    return n ? (
                      <Badge key={k} tone="gray">
                        {AI_CHECKS[k].emoji} {AI_CHECKS[k].title}: {n}
                      </Badge>
                    ) : null;
                  })}
              </div>
            </Card>
            <Card className="p-5">
              <CardTitle action={<Badge tone="brand">🎙️ mikrofon</Badge>}>Talaffuz natijalari</CardTitle>
              <ScoreLine data={speechSeries} name="Talaffuz" color="#2a78d6" />
            </Card>
          </div>
        ) : (
          <LockedOverlay title="Kengaytirilgan progress" text="AI video nazorat va talaffuz natijalari dinamikasi Premium tarifda." />
        )}
      </Section>

      <div className="mt-2 grid gap-5 lg:grid-cols-5">
        <Section title="Maqsadlar" className="lg:col-span-2" href="/child" linkLabel="Tahrirlash">
          <Card className="p-4">
            <div className="space-y-2">
              {child.goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => act({ type: "child.goal.toggle", childId: child.id, goalId: g.id }, { silent: true })}
                  className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left hover:bg-slate-50"
                >
                  <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2", g.done ? "border-good bg-good text-white" : "border-slate-300")}>
                    {g.done && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  <span className={cn("flex-1 text-sm font-bold", g.done ? "text-muted line-through" : "text-ink")}>{g.text}</span>
                  <span className="text-lg">{DOMAINS[g.domain].emoji}</span>
                </button>
              ))}
              {!child.goals.length && <p className="p-2 text-sm text-muted">Maqsadlar hali qo‘shilmagan.</p>}
            </div>
          </Card>
          <AiInsight childId={child.id} kind="progress" title="AI progress tahlili" className="mt-4" />
        </Section>

        <Section
          title="Mashg‘ulotlar tarixi"
          className="lg:col-span-3"
          action={
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as ActivityKind | "all")}
              className="rounded-xl border border-line bg-white px-3 py-1.5 text-sm font-bold text-ink-2"
            >
              <option value="all">Barchasi</option>
              {(Object.keys(KIND) as ActivityKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND[k].emoji} {KIND[k].label}
                </option>
              ))}
            </select>
          }
        >
          <Card className="divide-y divide-line p-0">
            {history.map((a) => (
              <HistoryRow key={a.id} a={a} />
            ))}
            {!history.length && <p className="p-5 text-sm text-muted">Bu davrda mashg‘ulotlar yo‘q.</p>}
          </Card>
        </Section>
      </div>
    </div>
  );
}

function HistoryRow({ a }: { a: Activity }) {
  const k = KIND[a.kind];
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg" style={{ background: DOMAINS[a.domain].soft }}>
        {k.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold text-ink">{a.title}</div>
        <div className="text-xs font-semibold text-muted">
          {k.label} · {formatDateTime(a.at)}
          {a.assignmentId ? " · 👩‍🏫 topshiriq" : ""}
        </div>
      </div>
      <div className="text-right">
        {typeof a.score === "number" && <div className="text-sm font-black text-ink tabular">{a.score}%</div>}
        <div className="text-xs font-bold text-brand-600">+{a.points}</div>
      </div>
    </div>
  );
}
