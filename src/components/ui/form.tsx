"use client";

import { cn } from "@/lib/utils";

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("mb-1.5 block text-sm font-bold text-ink-2", className)}>{children}</label>;
}

export function Field({ label, hint, children, className }: { label?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && <Label>{label}</Label>}
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

const base =
  "w-full rounded-2xl border border-line bg-white px-4 text-[15px] text-ink placeholder:text-faint outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(base, "h-12", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cn(base, "py-3 leading-relaxed", props.className)} />;
}

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export function Select({ className, children, style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(base, "h-12 appearance-none pr-10", className)}
      style={{ backgroundImage: CHEVRON, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", backgroundSize: "18px", ...style }}
    >
      {children}
    </select>
  );
}

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; description?: React.ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-2 text-left"
    >
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-[15px] font-bold text-ink">{label}</span>}
          {description && <span className="mt-0.5 block text-[13px] leading-snug text-muted">{description}</span>}
        </span>
      )}
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition", checked ? "bg-brand-500" : "bg-slate-300")}>
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </span>
    </button>
  );
}

export function OptionPills<T extends string>({
  value,
  onChange,
  options,
  multiple,
}: {
  value: T | T[];
  onChange: (v: T | T[]) => void;
  options: { value: T; label: React.ReactNode }[];
  multiple?: boolean;
}) {
  const selected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => {
            if (multiple && Array.isArray(value)) onChange(selected(o.value) ? value.filter((x) => x !== o.value) : [...value, o.value]);
            else onChange(o.value);
          }}
          className={cn(
            "rounded-2xl border px-3.5 py-2 text-sm font-bold transition",
            selected(o.value) ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100" : "border-line bg-white text-ink-2 hover:border-brand-200",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
