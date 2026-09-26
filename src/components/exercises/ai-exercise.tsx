"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { templateExercise, type GeneratedExercise } from "@/lib/ai/exercise-templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOMAINS, DOMAIN_ORDER } from "@/lib/constants";
import { apiPost } from "@/lib/client/api";
import { useActiveChild } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import type { Domain } from "@/lib/types";
import { cn } from "@/lib/utils";

/** 🤖 AI individual mashq — bolaning qiziqishi va zaif yo‘nalishiga moslashgan yangi mashq */
export function AiExerciseGenerator({ className }: { className?: string }) {
  const child = useActiveChild();
  const mode = useApp((s) => s.mode);
  const act = useApp((s) => s.act);
  const [domain, setDomain] = useState<Domain | "auto">("auto");
  const [ex, setEx] = useState<GeneratedExercise | null>(null);
  const [ai, setAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function generate() {
    if (!child) return;
    setBusy(true);
    setDone(false);
    try {
      if (mode === "offline") throw new Error("offline");
      const { data } = await apiPost<{ exercise: GeneratedExercise; ai: boolean }>("/api/ai/exercise", {
        childId: child.id,
        domain: domain === "auto" ? undefined : domain,
      });
      setEx(data.exercise);
      setAi(data.ai);
    } catch {
      setEx(templateExercise(domain === "auto" ? "nutq" : domain, child.interests, child.name));
      setAi(false);
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (!child || !ex) return;
    await act(
      {
        type: "activity.log",
        childId: child.id,
        kind: "exercise",
        refId: `ai-${ex.domain}`,
        title: `AI mashq: ${ex.title}`,
        domain: ex.domain,
        score: 80,
        durationSec: ex.durationMin * 60,
        details: { aiGenerated: true },
      },
      { rewardTitle: "AI mashq bajarildi!" },
    );
    setDone(true);
  }

  return (
    <div className={cn("overflow-hidden rounded-3xl border border-[#e4dcff] bg-gradient-to-br from-[#f6f3ff] via-white to-brand-50 shadow-card", className)}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-card">🤖</span>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-black text-ink">AI individual mashq</div>
            <p className="text-sm text-ink-2">
              Ustoz AI {child?.name ?? "bola"}ning qiziqishlari ({child?.interests.slice(0, 2).join(", ") || "o‘yinchoqlar"}) va rivojlanish natijalariga moslab yangi mashq tuzadi.
            </p>
          </div>
        </div>
        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {(["auto", ...DOMAIN_ORDER] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-extrabold transition",
                domain === d ? "border-[#6d4fe6] bg-[#6d4fe6] text-white" : "border-line bg-white text-ink-2 hover:border-[#cfc3ff]",
              )}
            >
              {d === "auto" ? "✨ Eng kerakli yo‘nalish" : `${DOMAINS[d].emoji} ${DOMAINS[d].label}`}
            </button>
          ))}
        </div>
        <Button variant="premium" className="mt-3" onClick={generate} loading={busy}>
          <Sparkles className="h-4 w-4" /> {ex ? "Boshqa mashq yaratish" : "Mashq yaratish"}
        </Button>
      </div>

      {ex && (
        <div className="animate-fade-up border-t border-[#e4dcff] bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl" style={{ background: DOMAINS[ex.domain]?.soft ?? "#e0f2fe" }}>
              {ex.emoji}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="premium">{ai ? "✨ Claude AI" : "🤖 YuniQo AI"}</Badge>
                {DOMAINS[ex.domain] && <Badge tone="gray">{DOMAINS[ex.domain].emoji} {DOMAINS[ex.domain].label}</Badge>}
                <Badge tone="gray">⏱ {ex.durationMin} daq</Badge>
              </div>
              <div className="mt-1 text-lg font-black leading-snug text-ink">{ex.title}</div>
              <p className="text-sm text-ink-2">{ex.goal}</p>
            </div>
          </div>
          {ex.materials.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ex.materials.map((m) => (
                <span key={m} className="rounded-xl bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800">
                  {m}
                </span>
              ))}
            </div>
          )}
          <ol className="mt-3 space-y-2">
            {ex.steps.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-2xl bg-slate-50 p-2.5 text-sm leading-relaxed text-ink-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#6d4fe6] text-xs font-black text-white">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          {ex.tips.length > 0 && <p className="mt-3 text-xs font-semibold text-muted">💡 {ex.tips.join(" · ")}</p>}
          <Button className="mt-4" block onClick={complete} disabled={done}>
            {done ? "✅ Bajarildi — pasportga saqlandi" : "✅ Bajardik!"}
          </Button>
        </div>
      )}
    </div>
  );
}
