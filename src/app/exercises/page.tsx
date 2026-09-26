"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { EXERCISES, topicsOf } from "@/data/exercises";
import { Card } from "@/components/ui/card";
import { Chips } from "@/components/ui/tabs";
import { EmojiTile, EmptyState, PageHeader, Section } from "@/components/ui/misc";
import { ExerciseCard } from "@/components/exercises/exercise-card";
import { AiExerciseGenerator } from "@/components/exercises/ai-exercise";
import { Switch } from "@/components/ui/form";
import { SECTIONS } from "@/lib/constants";
import { useActiveChild, useChildData, useIsPremium } from "@/lib/client/hooks";
import type { Section as SectionId } from "@/lib/types";
import { ageOf, dayKey, todayKey } from "@/lib/utils";

type Tab = "all" | SectionId | "uy" | "ai";

export default function ExercisesPage() {
  return (
    <Suspense>
      <Exercises />
    </Suspense>
  );
}

function Exercises() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = (params.get("section") as SectionId | null) ?? (params.get("tab") === "uy" ? "uy" : params.get("tab") === "ai" ? "ai" : "all");
  const [tab, setTab] = useState<Tab>(initial);
  const [topic, setTopic] = useState("all");
  const [q, setQ] = useState("");
  const child = useActiveChild();
  const [ageOnly, setAgeOnly] = useState(true);
  const age = child ? ageOf(child.birthDate).years : undefined;
  const { activities } = useChildData();
  const premium = useIsPremium();

  const doneToday = useMemo(() => new Set(activities.filter((a) => a.kind === "exercise" && dayKey(a.at) === todayKey()).map((a) => a.refId)), [activities]);
  const doneCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of activities) if (a.kind === "exercise") m.set(a.refId, (m.get(a.refId) ?? 0) + 1);
    return m;
  }, [activities]);

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (tab === "uy" && !e.atHome) return false;
      if (tab === "ai" && !e.aiCheck) return false;
      if (tab !== "all" && tab !== "uy" && tab !== "ai" && e.section !== tab) return false;
      if (topic !== "all" && e.topic !== topic) return false;
      if (ageOnly && age !== undefined && (age < e.ageMin - 1 || age > e.ageMax + 1)) return false;
      if (qq && !`${e.title} ${e.topic} ${e.goal}`.toLowerCase().includes(qq)) return false;
      return true;
    });
  }, [tab, topic, ageOnly, age, q]);

  const topics = tab === "logoped" || tab === "defektolog" || tab === "motorika" ? topicsOf(tab) : [];

  const selectTab = (t: Tab) => {
    setTab(t);
    setTopic("all");
    const url = t === "all" ? "/exercises" : t === "uy" || t === "ai" ? `/exercises?tab=${t}` : `/exercises?section=${t}`;
    router.replace(url, { scroll: false });
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        emoji="🎯"
        title="Mashqlar"
        subtitle="Logoped, defektolog va fizioterapevtlar tavsiya qiladigan uy mashqlari — qadam-baqadam ko‘rsatmalar bilan"
      />

      <Chips
        value={tab}
        onChange={selectTab}
        items={[
          { value: "all", label: "Barchasi", emoji: "✨" },
          { value: "logoped", label: "Logoped", emoji: "🗣️" },
          { value: "defektolog", label: "Defektolog", emoji: "🧩" },
          { value: "motorika", label: "Motorika va yassi oyoq", emoji: "🦶" },
          { value: "uy", label: "Uy sharoitida", emoji: "🏠" },
          { value: "ai", label: "AI tekshiruvli", emoji: "🤖" },
        ]}
      />

      {tab === "all" && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(Object.keys(SECTIONS) as SectionId[]).map((s) => {
            const meta = SECTIONS[s];
            const count = EXERCISES.filter((e) => e.section === s).length;
            return (
              <button key={s} onClick={() => selectTab(s)} className="text-left">
                <Card className="flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-200">
                  <EmojiTile emoji={meta.emoji} color={meta.soft} size={52} />
                  <div className="min-w-0">
                    <div className="font-extrabold text-ink">{meta.label}</div>
                    <div className="line-clamp-2 text-xs font-semibold text-muted">{meta.description}</div>
                    <div className="mt-1 text-xs font-extrabold" style={{ color: meta.color }}>
                      {count} ta mashq
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {(tab === "all" || tab === "ai") && <AiExerciseGenerator className="mt-4" />}

      {tab === "uy" && (
        <div className="mt-4 rounded-3xl bg-gradient-to-r from-[#fff7e6] to-white p-4 ring-1 ring-[#fde7b0]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏠</span>
            <div>
              <div className="font-extrabold text-ink">Uy sharoitidagi mashqlar</div>
              <div className="text-sm text-ink-2">Qoshiq, ro‘molcha, qalam, plastilin — oddiy uy buyumlari bilan kuniga 15–20 daqiqa.</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Mashq qidirish…"
            className="h-12 w-full rounded-2xl border border-line bg-white pl-10 pr-4 text-[15px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </div>
        {child && (
          <div className="rounded-2xl border border-line bg-white px-4 sm:w-72">
            <Switch checked={ageOnly} onChange={setAgeOnly} label={`${child.name} yoshiga mos (${age} yosh)`} />
          </div>
        )}
      </div>

      {topics.length > 0 && (
        <div className="mt-3">
          <Chips value={topic} onChange={setTopic} items={[{ value: "all", label: "Barcha mavzular" }, ...topics.map((t) => ({ value: t, label: t }))]} />
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => (
          <ExerciseCard key={e.id} e={e} done={doneToday.has(e.id)} count={doneCount.get(e.id) ?? 0} locked={!!e.premium && !premium} />
        ))}
      </div>
      {!list.length && <EmptyState emoji="🔍" title="Mashq topilmadi" text="Filtrlarni o‘zgartirib ko‘ring." className="mt-4" />}

      <Section title="Boshqa mashg‘ulotlar">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/games", emoji: "🎮", label: "Rivojlantiruvchi o‘yinlar", color: "#fdf3dc" },
            { href: "/videos", emoji: "🎥", label: "Videodarslar", color: "#fcecf2" },
            { href: "/ai-check", emoji: "📹", label: "AI video nazorat", color: "#e0f2fe" },
            { href: "/speech", emoji: "🎙️", label: "Talaffuz AI", color: "#efeaff" },
          ].map((m) => (
            <Card key={m.href} href={m.href} className="flex items-center gap-3 p-3.5">
              <EmojiTile emoji={m.emoji} color={m.color} size={44} />
              <span className="text-sm font-extrabold leading-tight text-ink">{m.label}</span>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
