"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmojiTile } from "@/components/ui/misc";
import { AI_CHECKS, DOMAINS } from "@/lib/constants";
import type { Activity } from "@/lib/types";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { CHECK_META, isAiCheckId, isCameraCheck } from "@/lib/vision/catalog";
import { activityResultLine, isDemoActivity, starsOfActivity } from "@/lib/vision/result";
import type { CameraCheckId } from "@/lib/vision/types";

function Stars({ n }: { n: number }) {
  return (
    <span className="whitespace-nowrap text-[13px] leading-none" aria-label={`${n} yulduz`}>
      {"⭐".repeat(n)}
      <span className="opacity-25 grayscale">{"⭐".repeat(Math.max(0, 3 - n))}</span>
    </span>
  );
}

/** Markaz sahifasidagi mashq kartasi (oxirgi natija bilan) */
export function CheckCard({ id, last }: { id: CameraCheckId; last?: Activity }) {
  const info = AI_CHECKS[id];
  const meta = CHECK_META[id];
  const d = DOMAINS[info.domain];
  return (
    <Card href={`/ai-check/${id}`} className="group flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        <EmojiTile emoji={info.emoji} color={d.soft} size={56} />
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-extrabold leading-tight text-ink">{info.title}</div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{info.description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="brand">🎯 {meta.targetLabel}</Badge>
        <Badge tone="gray">
          {meta.view.emoji} {meta.view.label}
        </Badge>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3">
        {last ? (
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-faint">Oxirgi natija</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Stars n={starsOfActivity(last)} />
              <span className="truncate text-sm font-bold text-ink-2 tabular">{activityResultLine(last)}</span>
            </div>
            <div className="text-xs text-muted">{timeAgo(last.at)}</div>
          </div>
        ) : (
          <div className="text-sm font-semibold text-muted">Hali bajarilmagan</div>
        )}
        <span className="shrink-0 rounded-2xl bg-brand-gradient px-3.5 py-2 text-sm font-extrabold text-white shadow-brand transition group-hover:brightness-105">
          Boshlash
        </span>
      </div>
    </Card>
  );
}

/** "Talaffuzni tekshirish" — nutq bo‘limiga havola */
export function SpeechCheckCard({ last }: { last?: Activity }) {
  const info = AI_CHECKS.speech;
  return (
    <Card href="/speech" className="group flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        <EmojiTile emoji={info.emoji} color={DOMAINS[info.domain].soft} size={56} />
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-extrabold leading-tight text-ink">{info.title}</div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{info.description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="brand">🎙️ Mikrofon orqali</Badge>
        <Badge tone="gray">🗣️ Nutq bo‘limida</Badge>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3">
        {last ? (
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-faint">Oxirgi natija</div>
            <div className="truncate text-sm font-bold text-ink-2">{typeof last.score === "number" ? `${last.score}%` : last.title}</div>
            <div className="text-xs text-muted">{timeAgo(last.at)}</div>
          </div>
        ) : (
          <div className="text-sm font-semibold text-muted">So‘zlarni aytib, talaffuzni baholang</div>
        )}
        <span className="flex shrink-0 items-center gap-0.5 rounded-2xl bg-brand-50 px-3 py-2 text-sm font-extrabold text-brand-700 transition group-hover:bg-brand-100">
          Ochish <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}

/** Tarix qatori */
export function HistoryRow({ a }: { a: Activity }) {
  const info = isAiCheckId(a.refId) ? AI_CHECKS[a.refId] : null;
  const href = isCameraCheck(a.refId) ? `/ai-check/${a.refId}` : "/speech";
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 transition hover:bg-brand-50/60">
      <EmojiTile emoji={info?.emoji ?? "📹"} color={DOMAINS[a.domain]?.soft} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-bold text-ink">{a.title}</span>
          {isDemoActivity(a) && <Badge tone="warn">Demo</Badge>}
        </div>
        <div className="text-xs text-muted">{formatDateTime(a.at)}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-extrabold text-ink tabular">{activityResultLine(a)}</div>
        <Stars n={starsOfActivity(a)} />
      </div>
    </Link>
  );
}
