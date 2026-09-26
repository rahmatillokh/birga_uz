"use client";

import { RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress";
import { scoreLevel } from "@/lib/constants";
import type { DeviceFailure } from "@/lib/speech/audio";
import type { SaveState } from "@/lib/speech/hooks";
import { highlightSegments, starsFor, type Seg } from "@/lib/speech/text";
import { cn } from "@/lib/utils";

/** So‘z ichida kerakli tovush ajratib ko‘rsatiladi: «**R**ak» */
export function HighlightedWord({
  text,
  sound,
  segments,
  className,
  hitClassName,
}: {
  text?: string;
  sound?: string;
  segments?: Seg[];
  className?: string;
  hitClassName?: string;
}) {
  const segs = segments ?? highlightSegments(text ?? "", sound ?? "");
  return (
    <span className={className}>
      {segs.map((s, i) =>
        s.hit ? (
          <mark key={i} className={cn("rounded-lg bg-brand-100 px-[0.08em] text-brand-600", hitClassName)}>
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </span>
  );
}

export function Stars({ value, max = 3, size = "md", className }: { value: number; max?: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const cls = size === "sm" ? "text-sm" : size === "lg" ? "text-4xl" : "text-2xl";
  return (
    <div className={cn("flex items-center gap-0.5", className)} role="img" aria-label={`${value} / ${max} yulduz`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn("leading-none", cls, i < value ? "animate-pop [animation-fill-mode:both]" : "opacity-25 grayscale")}
          style={i < value ? { animationDelay: `${i * 120}ms` } : undefined}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

/** Ruxsat so‘rashdan oldin tushuntirish */
export function PermissionNote({
  device,
  purpose,
  privacy,
  className,
}: {
  device: "mic" | "camera";
  purpose: React.ReactNode;
  privacy: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-line", className)}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-2xl">{device === "mic" ? "🎙️" : "📷"}</span>
      <div className="min-w-0 text-sm leading-snug text-ink-2">
        <div className="font-extrabold text-ink">{device === "mic" ? "Mikrofon kerak bo‘ladi" : "Kamera kerak bo‘ladi"}</div>
        <p className="mt-0.5">{purpose}</p>
        <p className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-muted">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-good" />
          <span>{privacy}</span>
        </p>
      </div>
    </div>
  );
}

export function DeviceErrorNote({
  failure,
  onRetry,
  children,
  className,
}: {
  failure: DeviceFailure;
  onRetry?: () => void;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl bg-[#fff6f2] p-3.5 text-sm ring-1 ring-serious/30", className)} role="alert">
      <div className="flex items-start gap-2.5">
        <span className="text-lg leading-none">⚠️</span>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-ink">{failure.title}</div>
          <p className="mt-0.5 leading-snug text-ink-2">{failure.text}</p>
          {(onRetry || children) && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {onRetry && (
                <Button size="sm" variant="secondary" onClick={onRetry}>
                  <RefreshCw className="h-4 w-4" />
                  Qayta urinish
                </Button>
              )}
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SaveStatus({ state, onRetry, className }: { state: SaveState; onRetry?: () => void; className?: string }) {
  if (state === "idle") return null;
  return (
    <div className={cn("flex items-center justify-center gap-2 text-sm font-bold", className)} aria-live="polite">
      {state === "saving" && (
        <span className="flex items-center gap-2 text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
          Saqlanmoqda…
        </span>
      )}
      {state === "saved" && <span className="text-[#006300]">✅ Natija saqlandi</span>}
      {state === "error" && (
        <span className="flex flex-wrap items-center justify-center gap-2 text-danger">
          ⚠️ Saqlab bo‘lmadi
          {onRetry && (
            <Button size="sm" variant="secondary" onClick={onRetry}>
              Qayta saqlash
            </Button>
          )}
        </span>
      )}
    </div>
  );
}

/** O‘yin/mashq yakunidagi katta natija kartasi */
export function ResultHero({
  score,
  emoji,
  title,
  text,
  save,
  onRetrySave,
  children,
}: {
  score: number;
  emoji: string;
  title: string;
  text?: React.ReactNode;
  save: SaveState;
  onRetrySave?: () => void;
  children?: React.ReactNode;
}) {
  const lvl = scoreLevel(score);
  const tone = lvl.key === "good" ? "good" : lvl.key === "warning" ? "warn" : "danger";
  return (
    <Card className="animate-fade-up p-6 text-center">
      <div className="mx-auto w-fit">
        <ProgressRing value={score / 100} size={136} stroke={12}>
          <div className="leading-none">
            <div className="text-[40px] font-black text-ink">{score}</div>
            <div className="mt-1 text-xs font-bold text-muted">/ 100</div>
          </div>
        </ProgressRing>
      </div>
      <Stars value={starsFor(score)} size="lg" className="mt-3 justify-center" />
      <h2 className="mt-3 text-2xl font-black text-ink">
        {emoji} {title}
      </h2>
      {text && <p className="mx-auto mt-1 max-w-md text-[15px] text-muted">{text}</p>}
      <div className="mt-3 flex justify-center">
        <Badge tone={tone}>
          {lvl.icon} {lvl.label}
        </Badge>
      </div>
      <SaveStatus state={save} onRetry={onRetrySave} className="mt-3" />
      {children}
    </Card>
  );
}
