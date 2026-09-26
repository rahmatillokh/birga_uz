"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DomainBadge, EmojiTile } from "@/components/ui/misc";
import { DOMAINS, SECTIONS } from "@/lib/constants";
import type { Exercise } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ExerciseCard({ e, done, count, locked }: { e: Exercise; done?: boolean; count?: number; locked?: boolean }) {
  const d = DOMAINS[e.domain];
  return (
    <Link href={`/exercises/${e.id}`} className="group">
      <Card className="flex h-full flex-col p-4 transition group-hover:-translate-y-0.5 group-hover:border-brand-200 group-hover:shadow-pop">
        <div className="flex items-start gap-3">
          <div className="relative">
            <EmojiTile emoji={e.emoji} color={d.soft} size={54} />
            {done && (
              <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-good text-white ring-2 ring-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="font-extrabold leading-snug text-ink">{e.title}</div>
              {locked && <Badge tone="premium">💎</Badge>}
            </div>
            <div className="mt-0.5 text-xs font-bold text-muted">
              {SECTIONS[e.section].emoji} {e.topic} · {e.ageMin}–{e.ageMax} yosh
            </div>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-snug text-ink-2">{e.goal}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
          <DomainBadge domain={e.domain} />
          <Badge tone="gray">⏱ {e.durationMin} daq</Badge>
          <Badge tone="gray">
            {"●".repeat(e.difficulty)}
            <span className="text-slate-300">{"●".repeat(3 - e.difficulty)}</span>
          </Badge>
          {e.aiCheck && <Badge tone="brand">🤖 AI</Badge>}
          {!!count && <span className={cn("ml-auto text-xs font-bold text-muted")}>{count} marta</span>}
        </div>
      </Card>
    </Link>
  );
}
