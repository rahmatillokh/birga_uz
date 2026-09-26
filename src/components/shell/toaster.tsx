"use client";

import { useToasts } from "@/lib/client/toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const items = useToasts((s) => s.items);
  const remove = useToasts((s) => s.remove);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-[95] flex flex-col items-center gap-2 px-4 lg:bottom-6">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => remove(t.id)}
          className={cn(
            "pointer-events-auto flex max-w-md animate-fade-up items-center gap-2.5 rounded-2xl px-4 py-3 text-left text-sm font-bold shadow-pop",
            t.tone === "error" ? "bg-[#fff1f1] text-danger ring-1 ring-danger/20" : "bg-ink text-white",
          )}
        >
          {t.emoji && <span className="text-lg">{t.emoji}</span>}
          {t.text}
        </button>
      ))}
    </div>
  );
}
