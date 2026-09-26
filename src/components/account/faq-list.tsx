import { ChevronDown } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import type { FaqItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Savol-javob akkordeoni (<details>) */
export function FaqList({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((f) => (
        <details
          key={f.q}
          className="group rounded-2xl border border-line bg-white shadow-card transition open:border-brand-200 open:ring-2 open:ring-brand-50 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[15px] font-extrabold leading-snug text-ink">
            <span>{f.q}</span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-50 text-muted transition group-open:rotate-180 group-open:bg-brand-50 group-open:text-brand-600">
              <ChevronDown className="h-4.5 w-4.5" />
            </span>
          </summary>
          <div className="px-4 pb-4">
            <Markdown text={f.a} className="text-[14.5px]" />
          </div>
        </details>
      ))}
    </div>
  );
}
