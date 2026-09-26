"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const W = 240;
const H = 52;
const PAD_X = 8;
const PAD_Y = 8;
const LINE = "#0ea5e9"; // brand-500 — trend chizig‘i
const ACCENT = "#0369a1"; // brand-700 — oxirgi natija

/**
 * Oddiy SVG sparkline (0..100 ballar). Y o‘qi doim 0–100 — trend bo‘rttirilmaydi.
 * Sichqoncha/barmoq bilan nuqta ustiga borilsa — qiymat va sana ko‘rinadi.
 */
export function Sparkline({
  values,
  labels,
  className,
  ariaLabel,
}: {
  values: number[];
  labels?: string[];
  className?: string;
  ariaLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");
  const n = values.length;
  if (!n) return null;

  const x = (i: number) => (n === 1 ? W / 2 : PAD_X + (i * (W - 2 * PAD_X)) / (n - 1));
  const y = (v: number) => PAD_Y + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - 2 * PAD_Y);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const area = `M${x(0).toFixed(1)},${H - PAD_Y} L${pts.join(" L")} L${x(n - 1).toFixed(1)},${H - PAD_Y} Z`;
  const last = n - 1;

  const pick = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < n; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    setHover(best);
  };

  return (
    <div className={cn("relative select-none", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full touch-pan-y overflow-visible"
        role="img"
        aria-label={ariaLabel ?? `Natijalar: ${values.join(", ")}`}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={LINE} stopOpacity="0.18" />
            <stop offset="1" stopColor={LINE} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* 60 ball — «yaxshi» chegarasi, juda och chiziq */}
        <line x1={PAD_X} x2={W - PAD_X} y1={y(60)} y2={y(60)} stroke="#e3ebf5" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {n > 1 && <path d={area} fill={`url(#spark-${gid})`} />}
        {n > 1 && (
          <polyline
            points={pts.join(" ")}
            fill="none"
            stroke={LINE}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={2} y2={H - 2} stroke="#94a3b8" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        )}
        {hover !== null && hover !== last && <circle cx={x(hover)} cy={y(values[hover])} r={4} fill={LINE} stroke="#fff" strokeWidth={2} />}
        <circle cx={x(last)} cy={y(values[last])} r={5} fill={ACCENT} stroke="#fff" strokeWidth={2} />
      </svg>
      {hover !== null && (
        <div
          className={cn(
            "pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-xl bg-ink px-2.5 py-1.5 text-xs text-white shadow-pop",
            x(hover) / W < 0.25 ? "translate-x-[-12px]" : x(hover) / W > 0.75 ? "-translate-x-[calc(100%-12px)]" : "-translate-x-1/2",
          )}
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <span className="font-black">{values[hover]}</span>
          {labels?.[hover] && <span className="ml-1.5 font-semibold text-white/75">{labels[hover]}</span>}
        </div>
      )}
    </div>
  );
}
