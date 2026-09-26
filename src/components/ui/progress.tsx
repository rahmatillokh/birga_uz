import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  color,
  className,
  trackClassName,
  fillClassName,
  height = 8,
}: {
  value: number;
  max?: number;
  color?: string;
  /** tashqi (trek) elementi uchun: joylashuv, kenglik, margin */
  className?: string;
  trackClassName?: string;
  /** to‘ldiruvchi qism uchun */
  fillClassName?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-brand-100/70", trackClassName, className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", !color && "bg-brand-gradient", fillClassName)}
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 64,
  stroke = 7,
  color = "#0ea5e9",
  track = "#e0f2fe",
  children,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
