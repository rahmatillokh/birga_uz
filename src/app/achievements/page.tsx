"use client";

import { useMemo, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { PageHeader, Section } from "@/components/ui/misc";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { LEVELS, WEEKDAYS_SHORT } from "@/lib/constants";
import { weeklyGoals } from "@/lib/core/stats";
import { useChildData } from "@/lib/client/hooks";
import { toast } from "@/lib/client/toast";
import { addDays, cn, dayKey, formatDate, todayKey, weekdayOf } from "@/lib/utils";

const STICKERS = ["🦁", "🐼", "🦄", "🐸", "🐯", "🐰", "🦊", "🐻", "🐨", "🐧", "🦋", "🐢", "🐬", "🦒", "🐙", "🦖"];

export default function AchievementsPage() {
  const { child, activities, points, level, streak, badges } = useChildData();
  const goals = useMemo(() => weeklyGoals(activities), [activities]);
  const [reward, setReward] = useState(() => {
    if (typeof window === "undefined") return "Hayvonot bog‘iga sayohat 🦒";
    return localStorage.getItem("yq-reward") ?? "Hayvonot bog‘iga sayohat 🦒";
  });

  // 5 haftalik faollik kalendari
  const today = todayKey();
  const start = addDays(today, -(weekdayOf(today) - 1) - 28);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of activities) {
      const k = dayKey(a.at);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [activities]);
  const cells = Array.from({ length: 35 }, (_, i) => addDays(start, i));
  const shade = (n: number) => (n === 0 ? "#eef3f9" : n <= 1 ? "#bae6fd" : n <= 3 ? "#7dd3fc" : n <= 5 ? "#38bdf8" : "#0284c7");

  if (!child) return null;
  const earned = badges.filter((b) => b.earned);
  const stars = Math.floor(points / 100);
  const toNextStar = 100 - (points % 100);
  const rewardEvery = 10; // har 10 yulduzda sovg‘a
  const rewardProgress = stars % rewardEvery;

  return (
    <div className="animate-fade-up">
      <PageHeader emoji="🏆" title="Progress va yutuqlar" subtitle={`${child.name} uchun ball, yutuq nishonlari, seriya va haftalik maqsadlar`} />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="overflow-hidden p-0 lg:col-span-2">
          <div className="flex flex-col gap-5 bg-gradient-to-br from-[#fff7e6] via-white to-brand-50 p-6 sm:flex-row sm:items-center">
            <ProgressRing value={level.progress} size={128} stroke={12} color="#eda100" track="#fdf0cf">
              <div className="text-center">
                <div className="text-5xl">{level.emoji}</div>
              </div>
            </ProgressRing>
            <div className="flex-1">
              <div className="text-sm font-extrabold uppercase tracking-wide text-[#8a5a00]">{level.index}-daraja</div>
              <div className="text-3xl font-black text-ink">{level.title}</div>
              <div className="mt-1 text-[15px] font-semibold text-ink-2">
                {points} ball {level.next ? `· keyingi daraja «${level.next.title}»gacha ${level.toNext} ball` : "· eng yuqori daraja!"}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-ink shadow-card">🔥 {streak.current} kun seriya</span>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-ink shadow-card">🏅 {earned.length}/{badges.length} nishon</span>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-ink shadow-card">⭐ {stars} yulduz</span>
              </div>
            </div>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-6 py-4">
            {LEVELS.map((l, i) => (
              <div key={l.title} className={cn("flex shrink-0 flex-col items-center rounded-2xl px-3 py-2", i + 1 <= level.index ? "bg-[#fdf3dc]" : "bg-slate-100 opacity-60")}>
                <span className="text-2xl">{l.emoji}</span>
                <span className="text-[11px] font-extrabold text-ink-2">{l.title}</span>
                <span className="text-[10px] font-bold text-muted">{l.min}+</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <CardTitle>🔥 Faollik kalendari</CardTitle>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS_SHORT.map((w) => (
              <div key={w} className="text-center text-[10px] font-extrabold text-muted">
                {w}
              </div>
            ))}
            {cells.map((k) => {
              const n = counts.get(k) ?? 0;
              const future = k > today;
              return (
                <div
                  key={k}
                  title={`${formatDate(k, { weekday: true })}: ${n} ta mashg‘ulot`}
                  className={cn("aspect-square rounded-lg", k === today && "ring-2 ring-brand-500 ring-offset-1", future && "opacity-30")}
                  style={{ background: future ? "#f1f5f9" : shade(n) }}
                />
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-muted">
            <span>Kam</span>
            <div className="flex gap-1">
              {[0, 1, 3, 5, 6].map((n) => (
                <span key={n} className="h-3 w-3 rounded" style={{ background: shade(n) }} />
              ))}
            </div>
            <span>Ko‘p</span>
          </div>
          <div className="mt-3 rounded-2xl bg-brand-50 p-3 text-sm font-bold text-ink-2">
            Eng uzun seriya: <span className="text-ink">{streak.best} kun</span>. {streak.activeToday ? "Bugun ham mashq qildingiz! ✅" : "Bugun mashq qilsangiz, seriya davom etadi!"}
          </div>
        </Card>
      </div>

      <Section title="Yutuq nishonlari">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((b) => (
            <Card key={b.id} className={cn("p-4 text-center", !b.earned && "bg-slate-50/70")}>
              <div className={cn("mx-auto grid h-16 w-16 place-items-center rounded-3xl text-4xl", b.earned ? "bg-[#fdf3dc] animate-pop" : "bg-slate-100 grayscale opacity-50")}>{b.emoji}</div>
              <div className="mt-2 text-sm font-black text-ink">{b.title}</div>
              <div className="text-xs text-muted">{b.description}</div>
              {b.earned ? (
                <div className="mt-2 text-xs font-extrabold text-[#006300]">✅ Qo‘lga kiritildi</div>
              ) : (
                <div className="mt-2">
                  <ProgressBar value={b.progress * 100} height={6} />
                  <div className="mt-1 text-[11px] font-bold text-muted">{b.hint}</div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Section>

      <div className="mt-2 grid gap-5 lg:grid-cols-2">
        <Section title="Haftalik maqsadlar">
          <Card className="space-y-4 p-5">
            {goals.map((g) => (
              <div key={g.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-extrabold text-ink">
                    {g.emoji} {g.title}
                  </span>
                  <span className={cn("font-black tabular", g.value >= g.target ? "text-[#006300]" : "text-ink-2")}>
                    {Math.min(g.value, g.target)}/{g.target} {g.value >= g.target && "✅"}
                  </span>
                </div>
                <ProgressBar value={g.value} max={g.target} color={g.value >= g.target ? "#0ca30c" : undefined} />
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Yulduzlar kolleksiyasi">
          <Card className="p-5">
            <p className="text-sm text-ink-2">
              Har 100 ball = 1 yulduz ⭐. Keyingi yulduzgacha <b className="text-ink">{toNextStar} ball</b>.
            </p>
            <div className="mt-3 grid grid-cols-8 gap-1.5">
              {Array.from({ length: 16 }, (_, i) => (
                <div key={i} className={cn("grid aspect-square place-items-center rounded-xl text-xl", i < Math.min(stars, 16) ? "bg-[#fdf3dc]" : "bg-slate-100 opacity-40 grayscale")}>
                  {STICKERS[i]}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#f4f0ff] to-white p-4 ring-1 ring-[#e4dcff]">
              <div className="text-sm font-extrabold text-ink">🎁 Oilaviy sovg‘a — har {rewardEvery} yulduzda</div>
              <div className="mt-2 flex gap-2">
                <Input value={reward} onChange={(e) => setReward(e.target.value)} className="h-10 text-sm" />
                <button
                  className="shrink-0 rounded-xl bg-[#6d4fe6] px-3 text-sm font-bold text-white"
                  onClick={() => {
                    localStorage.setItem("yq-reward", reward);
                    toast.success("Sovg‘a saqlandi", "🎁");
                  }}
                >
                  Saqlash
                </button>
              </div>
              <ProgressBar value={rewardProgress} max={rewardEvery} className="mt-3" color="#6d4fe6" trackClassName="bg-[#ebe5ff] mt-3" />
              <div className="mt-1 text-xs font-bold text-muted">
                {rewardProgress}/{rewardEvery} yulduz — bola maqsadni ko‘rib turadi va motivatsiyasi oshadi
              </div>
            </div>
          </Card>
        </Section>
      </div>
    </div>
  );
}
