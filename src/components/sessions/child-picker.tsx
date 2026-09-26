"use client";

import { Check } from "lucide-react";
import { useView } from "@/lib/client/hooks";
import { ageOf, cn } from "@/lib/utils";

/** Yozilish uchun bolani tanlash (bitta bola bo‘lsa — shunchaki ko‘rsatiladi) */
export function ChildPicker({ value, onChange, label = "Kim uchun?" }: { value?: string; onChange: (id: string) => void; label?: string }) {
  const children = useView().children;
  if (!children.length) return null;

  if (children.length === 1) {
    const c = children[0];
    return (
      <div>
        <div className="mb-1.5 text-sm font-bold text-ink-2">{label}</div>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-slate-50/70 p-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xl shadow-card">{c.avatar}</span>
          <div className="min-w-0">
            <div className="truncate font-extrabold text-ink">{c.name}</div>
            <div className="text-xs font-semibold text-muted">{ageOf(c.birthDate).label}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1.5 text-sm font-bold text-ink-2">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {children.map((c) => {
          const on = c.id === value;
          return (
            <button
              type="button"
              key={c.id}
              onClick={() => onChange(c.id)}
              aria-pressed={on}
              className={cn(
                "relative flex min-h-[56px] items-center gap-2.5 rounded-2xl border p-2.5 text-left transition",
                on ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-line bg-white hover:border-brand-200",
              )}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-card">{c.avatar}</span>
              <span className="min-w-0">
                <span className="block truncate font-extrabold text-ink">{c.name}</span>
                <span className="block truncate text-xs font-semibold text-muted">{ageOf(c.birthDate).label}</span>
              </span>
              {on && (
                <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
