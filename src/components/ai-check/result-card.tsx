"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/ui/misc";
import { AI_CHECKS, scoreLevel } from "@/lib/constants";
import type { Exercise } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatSec, resultTitle, type Recommendation, type Stars } from "@/lib/vision/result";
import type { Summary } from "@/lib/vision/types";
import { formatClock } from "./hud";

export type SaveState = "idle" | "saving" | "saved" | "error" | "skipped" | "nochild";

export function StarRow({ stars, size = "text-4xl" }: { stars: Stars; size?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-1", size)} aria-label={`${stars} yulduz`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cn("transition", i <= stars ? "animate-pop" : "opacity-30 grayscale")} style={{ animationDelay: `${i * 120}ms` }}>
          ⭐
        </span>
      ))}
    </div>
  );
}

export function ResultCard({
  summary: s,
  stars,
  demo,
  save,
  childName,
  recs,
  exercise,
  onRetry,
  onRetrySave,
}: {
  summary: Summary;
  stars: Stars;
  demo: boolean;
  save: SaveState;
  childName?: string;
  recs: Recommendation[];
  exercise?: Exercise;
  onRetry: () => void;
  onRetrySave: () => void;
}) {
  const info = AI_CHECKS[s.id];
  const head = resultTitle(stars);
  const lvl = scoreLevel(s.accuracy);
  const hold = s.mode === "hold";
  const maxErr = Math.max(1, ...s.errors.map((e) => e.count));

  return (
    <Card className="overflow-hidden">
      <div className="relative bg-brand-gradient px-5 pb-6 pt-7 text-center text-white">
        <div className="text-6xl animate-pop sm:text-7xl">{head.emoji}</div>
        <h2 className="mt-2 text-2xl font-black sm:text-3xl">{head.title}</h2>
        <p className="mt-1 text-sm font-semibold text-white/90 sm:text-base">{head.text}</p>
        <div className="mt-3">
          <StarRow stars={stars} size="text-4xl sm:text-5xl" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Badge tone="white">
            {info.emoji} {info.title}
          </Badge>
          {demo && <Badge tone="white">▶️ Demo rejim</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
        {hold ? (
          <StatTile label="Ushlab turish" emoji="⏱" value={formatSec(s.holdSec)} hint={`Maqsad: ${s.target} s`} />
        ) : (
          <StatTile label="Takrorlar" emoji="🔁" value={`${s.reps}/${s.target}`} hint={s.reps >= s.target ? "Maqsad bajarildi" : "marta"} />
        )}
        <StatTile
          label="Aniqlik"
          emoji="🎯"
          value={<span style={{ color: lvl.color }}>{s.accuracy}%</span>}
          hint={`${lvl.icon} ${lvl.label}`}
        />
        <StatTile label="Vaqt" emoji="🕒" value={formatClock(s.durationSec)} hint="daqiqa:soniya" />
        {s.stability !== undefined ? (
          <StatTile label="Barqarorlik" emoji="⚖️" value={`${s.stability}%`} hint="chayqalish kamligi" />
        ) : (
          <StatTile
            label={hold ? "Xatosiz soniyalar" : "Xatosiz takrorlar"}
            emoji="✅"
            value={`${s.cleanUnits}/${s.totalUnits}`}
            hint={hold ? "soniya" : "marta"}
          />
        )}
      </div>

      <div className="px-4 sm:px-5">
        <h3 className="mb-2 text-[15px] font-extrabold text-ink">Ko‘p uchragan xatolar</h3>
        {s.errors.length === 0 ? (
          <div className="flex items-center gap-2 rounded-2xl bg-good/10 p-3.5 text-[15px] font-bold text-[#006300]">
            <span>✅</span> Xatolar topilmadi — zo‘r!
          </div>
        ) : (
          <ul className="space-y-2">
            {s.errors.slice(0, 3).map((e) => (
              <li key={e.text} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-line">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[15px] font-bold text-ink">
                    <span aria-hidden>⚠️</span>
                    {e.text}
                  </span>
                  <span className="shrink-0 rounded-full bg-warn/15 px-2.5 py-0.5 text-xs font-black text-[#8a5a00]">×{e.count}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-warn" style={{ width: `${(e.count / maxErr) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {recs.length > 0 && (
        <div className="px-4 pt-5 sm:px-5">
          <h3 className="mb-2 text-[15px] font-extrabold text-ink">🤖 AI tavsiyasi — keyingi mashq</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {recs.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-3 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-2xl">{r.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-extrabold leading-tight text-ink">{r.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted">{r.reason}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-faint transition group-hover:text-brand-600" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-5 sm:px-5">
        <SaveLine save={save} childName={childName} onRetry={onRetrySave} />
      </div>

      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:p-5">
        <Button size="lg" onClick={onRetry} className="sm:flex-1">
          🔁 Yana urinish
        </Button>
        <Button size="lg" variant="secondary" href="/ai-check" className="sm:flex-1">
          📋 Boshqa mashqlar
        </Button>
        {exercise && (
          <Button size="lg" variant="soft" href={`/exercises/${exercise.id}`} className="sm:flex-1">
            {exercise.emoji} Mashqqa qaytish
          </Button>
        )}
      </div>
    </Card>
  );
}

function SaveLine({ save, childName, onRetry }: { save: SaveState; childName?: string; onRetry: () => void }) {
  if (save === "saving") {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-brand-50 p-3 text-sm font-bold text-brand-700 ring-1 ring-brand-100">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Natija profilga saqlanmoqda…
      </div>
    );
  }
  if (save === "saved") {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-good/10 p-3 text-sm font-bold text-[#006300] ring-1 ring-good/20">
        ✅ Natija {childName ? `${childName}ning` : "bola"} profiliga saqlandi — «Progress» bo‘limida ko‘rinadi
      </div>
    );
  }
  if (save === "error") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-danger/10 p-3 text-sm font-bold text-danger ring-1 ring-danger/20">
        <span>⚠️ Natijani saqlab bo‘lmadi</span>
        <Button size="sm" variant="danger" onClick={onRetry}>
          Qayta saqlash
        </Button>
      </div>
    );
  }
  if (save === "nochild") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-100 p-3 text-sm font-semibold text-ink-2">
        <span>ℹ️ Natijani saqlash uchun bola profilini yarating</span>
        <Button size="sm" variant="soft" href="/onboarding?add=1">
          Profil yaratish
        </Button>
      </div>
    );
  }
  if (save === "skipped") {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-3 text-sm font-semibold text-ink-2">
        ℹ️ Mashq bajarilmagani uchun natija saqlanmadi
      </div>
    );
  }
  return null;
}
