import { cn } from "@/lib/utils";

type Tone = "brand" | "gray" | "good" | "warn" | "danger" | "premium" | "white";
const TONES: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  gray: "bg-slate-100 text-ink-2 ring-slate-200/60",
  good: "bg-good/10 text-[#006300] ring-good/20",
  warn: "bg-warn/15 text-[#8a5a00] ring-warn/30",
  danger: "bg-danger/10 text-danger ring-danger/20",
  premium: "bg-[#efeaff] text-[#5b3fe0] ring-[#ddd3ff]",
  white: "bg-white/90 text-ink ring-white",
};

export function Badge({
  tone = "brand",
  className,
  children,
  style,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={style}
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 whitespace-nowrap", TONES[tone], className)}
    >
      {children}
    </span>
  );
}
