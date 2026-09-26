"use client";

import { cn } from "@/lib/utils";
import type { CheckMeta } from "@/lib/vision/catalog";
import type { LoadProgress } from "@/lib/vision/loader";

/** Kamera ruxsati va AI modeli yuklanishi */
export function LoadingOverlay({ camOn, progress }: { camOn: boolean; progress: LoadProgress | null }) {
  const pct = Math.round((progress?.ratio ?? 0) * 100);
  return (
    <div className={cn("absolute inset-0 grid place-items-center p-4", camOn ? "bg-slate-950/35" : "bg-slate-900")}>
      <div className="w-full max-w-sm animate-pop rounded-3xl bg-white/95 p-5 text-center shadow-pop @xl:max-w-md @xl:p-7">
        {!camOn ? (
          <>
            <div className="text-5xl animate-float">📷</div>
            <div className="mt-2 text-lg font-black text-ink @xl:text-2xl">Kameraga ruxsat bering</div>
            <p className="mt-1 text-sm font-semibold text-muted">Brauzer so‘rasa, «Ruxsat berish» tugmasini bosing</p>
          </>
        ) : (
          <>
            <div className="text-5xl animate-float">🤖</div>
            <div className="mt-2 text-lg font-black text-ink @xl:text-2xl">AI tayyorlanmoqda</div>
            <p className="mt-1 text-sm font-semibold text-muted">Birinchi marta bir necha soniya oladi</p>
          </>
        )}
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-brand-100">
          <div className="h-full rounded-full bg-brand-gradient transition-[width] duration-300" style={{ width: `${Math.max(4, pct)}%` }} />
        </div>
        <div className="mt-2 text-xs font-bold text-muted tabular">{progress?.text ?? "AI tayyorlanmoqda…"}</div>
      </div>
    </div>
  );
}

/** Kadrga to‘g‘ri joylashish: ko‘ringach, 3-2-1 avtomatik boshlanadi */
export function PositionOverlay({
  ok,
  reason,
  meta,
  onStart,
}: {
  ok: boolean;
  reason?: string;
  meta: CheckMeta;
  onStart: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {meta.kind === "face" && <FaceGuide ok={ok} />}
      <div className="absolute inset-x-0 top-4 flex justify-center px-3 @xl:top-6">
        <div
          key={ok ? "ok" : "no"}
          className={cn(
            "flex max-w-[94%] animate-pop items-center gap-3 rounded-3xl px-4 py-3 shadow-pop @xl:px-6 @xl:py-4",
            ok ? "bg-good text-white" : "bg-white/95 text-ink",
          )}
        >
          <span className="text-3xl @xl:text-5xl">{ok ? "✅" : meta.view.emoji}</span>
          <div className="min-w-0">
            <div className="text-base font-black leading-tight @xl:text-2xl">{ok ? "Zo‘r, sizni ko‘ryapman!" : "Kameraga to‘liq ko‘rinishingiz kerak"}</div>
            <div className={cn("text-sm font-bold @xl:text-lg", ok ? "text-white/90" : "text-muted")}>
              {ok ? "Hozir boshlaymiz…" : (reason ?? meta.camera)}
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-auto absolute inset-x-0 bottom-4 flex justify-center @xl:bottom-6">
        <button
          onClick={onStart}
          className="rounded-full bg-white/90 px-5 py-2.5 text-sm font-extrabold text-ink shadow-pop ring-1 ring-black/5 transition hover:bg-white active:scale-95 @xl:text-base"
        >
          ▶️ Hozir boshlash
        </button>
      </div>
    </div>
  );
}

function FaceGuide({ ok }: { ok: boolean }) {
  return (
    <div
      className={cn(
        "absolute left-1/2 top-[48%] aspect-[3/4] h-[68%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-4 border-dashed transition-colors",
        ok ? "border-good/80" : "border-white/80",
      )}
    />
  );
}

export function CountdownOverlay({ count, meta }: { count: number; meta: CheckMeta }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-950/25">
      <div className="flex flex-col items-center text-center">
        <div
          key={count}
          className="grid h-32 w-32 animate-pop place-items-center rounded-full bg-brand-gradient text-7xl font-black text-white shadow-brand ring-8 ring-white/80 @xl:h-48 @xl:w-48 @xl:text-9xl"
        >
          {count}
        </div>
        <div className="mt-4 rounded-full bg-white/95 px-5 py-2 text-lg font-black text-ink shadow-pop @xl:text-3xl">
          {meta.poseEmoji} Tayyorlaning!
        </div>
      </div>
    </div>
  );
}
