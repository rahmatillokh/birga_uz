"use client";

import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getSpecialist } from "@/data/specialists";
import { DOMAINS } from "@/lib/constants";
import type { TodayTask } from "@/lib/core/stats";
import { cn } from "@/lib/utils";

export function TaskRow({ task, compact }: { task: TodayTask; compact?: boolean }) {
  const ex = task.exercise;
  const sp = task.assignedBy ? getSpecialist(task.assignedBy) : undefined;
  const d = DOMAINS[ex.domain];
  return (
    <Link
      href={`/exercises/${ex.id}${task.assignmentId ? `?assignment=${task.assignmentId}` : ""}`}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border p-3 transition",
        task.done ? "border-good/20 bg-good/5" : "border-line bg-white hover:border-brand-200 hover:bg-brand-50/40",
      )}
    >
      <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: d.soft }}>
        {ex.emoji}
        {task.done && (
          <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-good text-white ring-2 ring-white">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-[15px] font-extrabold", task.done ? "text-ink-2 line-through decoration-2 decoration-good/40" : "text-ink")}>{ex.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-muted">
          <span>{ex.durationMin} daq</span>
          <span className="h-1 w-1 rounded-full bg-faint" />
          <span>{ex.topic}</span>
          {sp && !compact && (
            <>
              <span className="h-1 w-1 rounded-full bg-faint" />
              <span className="font-bold text-[#6d4fe6]">👩‍🏫 {sp.name.split(" ")[0]} topshirig‘i</span>
            </>
          )}
          {ex.aiCheck && !compact && (
            <>
              <span className="h-1 w-1 rounded-full bg-faint" />
              <span className="font-bold text-brand-600">🤖 AI tekshiruv</span>
            </>
          )}
        </div>
      </div>
      {task.done ? (
        <span className="text-xs font-extrabold text-[#006300]">Bajarildi</span>
      ) : (
        <ChevronRight className="h-5 w-5 text-faint transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
      )}
    </Link>
  );
}
