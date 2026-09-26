"use client";

import { cn } from "@/lib/utils";

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: React.ReactNode; count?: number }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("no-scrollbar flex gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1", className)} role="tablist">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-bold transition",
            size === "md" ? "h-10 px-4 text-sm" : "h-8 px-3 text-xs",
            value === it.value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {it.label}
          {typeof it.count === "number" && (
            <span className={cn("rounded-full px-1.5 text-[11px]", value === it.value ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-muted")}>
              {it.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: React.ReactNode; emoji?: string }[];
  className?: string;
}) {
  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1", className)}>
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold transition",
            value === it.value ? "border-brand-500 bg-brand-500 text-white shadow-brand" : "border-line bg-white text-ink-2 hover:border-brand-200",
          )}
        >
          {it.emoji && <span>{it.emoji}</span>}
          {it.label}
        </button>
      ))}
    </div>
  );
}
