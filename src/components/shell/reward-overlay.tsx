"use client";

import confetti from "canvas-confetti";
import { useEffect } from "react";
import { useApp } from "@/lib/client/store";
import { useChildData } from "@/lib/client/hooks";

export function RewardOverlay() {
  const reward = useApp((s) => s.reward);
  const clear = useApp((s) => s.clearReward);
  const { badges } = useChildData();

  useEffect(() => {
    if (!reward) return;
    const colors = ["#38bdf8", "#0ea5e9", "#eda100", "#e87ba4", "#1baf7a"];
    confetti({ particleCount: reward.badges.length ? 140 : 70, spread: 75, origin: { y: 0.7 }, colors, disableForReducedMotion: true });
    const t = setTimeout(clear, reward.badges.length ? 3600 : 2200);
    return () => clearTimeout(t);
  }, [reward, clear]);

  if (!reward) return null;
  const earned = badges.filter((b) => reward.badges.includes(b.id));
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+72px)] z-[90] flex justify-center px-4">
      <div className="pointer-events-auto animate-pop rounded-3xl bg-white px-5 py-4 text-center shadow-pop ring-1 ring-brand-100" onClick={clear}>
        {earned.length ? (
          <>
            <div className="text-5xl animate-float">{earned[0].emoji}</div>
            <div className="mt-2 text-xs font-bold uppercase tracking-wide text-brand-600">Yangi yutuq!</div>
            <div className="text-lg font-black text-ink">{earned[0].title}</div>
            <div className="text-sm text-muted">{earned[0].description}</div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="text-3xl">🌟</div>
            <div className="text-left">
              <div className="text-lg font-black text-ink">+{reward.points} ball</div>
              <div className="text-sm text-muted">{reward.title ?? "Barakalla! Davom eting"}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
