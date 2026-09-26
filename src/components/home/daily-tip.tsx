"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiPost } from "@/lib/client/api";
import { useApp } from "@/lib/client/store";
import { Markdown } from "@/components/ui/markdown";
import { Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

/** AI — kunlik tavsiya / progress tahlili (Claude yoki oflayn) */
export function AiInsight({
  childId,
  kind = "daily",
  title = "AI’dan bugungi tavsiya",
  className,
  specialistId,
}: {
  childId?: string;
  kind?: "daily" | "progress" | "report";
  title?: string;
  className?: string;
  specialistId?: string;
}) {
  const mode = useApp((s) => s.mode);
  const [text, setText] = useState<string | null>(null);
  const [ai, setAi] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    try {
      if (mode === "offline") throw new Error("offline");
      const { data } = await apiPost<{ text: string; ai: boolean }>("/api/ai/insight", { childId, kind, specialistId });
      setText(data.text);
      setAi(!!data.ai);
    } catch {
      setText("Bugun 10 daqiqa bola bilan birga o‘ynang: rasmlarni nomlang, sanang va har urinishni maqtang. Kichik qadamlar — katta natija! 🌟");
      setAi(false);
    } finally {
      setLoading(false);
    }
  }, [childId, kind, mode, specialistId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-[#e4dcff] bg-gradient-to-br from-[#f6f3ff] via-white to-[#eef8ff] p-5 shadow-card print-plain", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-xl shadow-card">🤖</div>
          <div>
            <div className="text-[15px] font-extrabold text-ink">{title}</div>
            <div className="flex items-center gap-1 text-xs font-bold text-[#6d4fe6]">
              <Sparkles className="h-3.5 w-3.5" />
              {ai ? "Claude AI tahlili" : "YuniQo AI tavsiyasi"}
            </div>
          </div>
        </div>
        <button onClick={load} className="no-print grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-white" aria-label="Yangilash">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>
      {loading && !text ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        <Markdown text={text ?? ""} className={cn("text-[15px]", loading && "opacity-60")} />
      )}
    </div>
  );
}
