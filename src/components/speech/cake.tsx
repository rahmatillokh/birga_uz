"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

export type FlameState = "lit" | "out";

const CANDLES = [
  { x: 100, body: "#7dd3fc", stripe: "#e0f2fe" },
  { x: 160, body: "#fcd34d", stripe: "#fef9c3" },
  { x: 220, body: "#86efac", stripe: "#dcfce7" },
];
const WICK_TOP = 80;
const OUTER = "M0 0 C -12 0 -13 -16 0 -40 C 13 -16 12 0 0 0 Z";
const INNER = "M0 -2 C -6 -2 -7 -11 0 -24 C 7 -11 6 -2 0 -2 Z";
const SPRINKLES = [
  { x: 62, y: 214, r: -25, c: "#38bdf8" },
  { x: 96, y: 186, r: 30, c: "#fbbf24" },
  { x: 128, y: 220, r: 10, c: "#34d399" },
  { x: 158, y: 184, r: -40, c: "#a78bfa" },
  { x: 190, y: 216, r: 35, c: "#fb7185" },
  { x: 224, y: 188, r: -15, c: "#38bdf8" },
  { x: 256, y: 218, r: 20, c: "#fbbf24" },
];
const DRIPS = [
  { x: 56, r: 9 },
  { x: 88, r: 11 },
  { x: 126, r: 8 },
  { x: 164, r: 12 },
  { x: 204, r: 9 },
  { x: 240, r: 11 },
  { x: 268, r: 8 },
];

/**
 * Tug‘ilgan kun torti va 3 ta sham. Faol shamning olovi puflash kuchiga qarab
 * egiladi va kichrayadi; o‘chganda tutun ko‘tariladi.
 */
export function Cake({
  flames,
  active = -1,
  strength = 0,
  progress = 0,
  blowing = false,
  className,
}: {
  flames: FlameState[];
  active?: number;
  /** 0..1 — hozirgi puflash kuchi */
  strength?: number;
  /** 0..1 — faol sham o‘chishiga qancha qoldi */
  progress?: number;
  blowing?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const flameId = `flame-${uid}`;
  const glowId = `glow-${uid}`;

  return (
    <svg viewBox="0 0 320 252" className={cn("block h-auto w-full", className)} role="img" aria-label={`Tort: ${flames.filter((f) => f === "lit").length} ta sham yonib turibdi`}>
      <defs>
        <linearGradient id={flameId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f97316" />
          <stop offset="0.55" stopColor="#fb923c" />
          <stop offset="1" stopColor="#facc15" />
        </linearGradient>
        <radialGradient id={glowId}>
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Likopcha */}
      <ellipse cx="160" cy="238" rx="150" ry="12" fill="#e2e8f0" />

      {/* Shamlar (tort ortida — pastki qismi krem bilan yopiladi) */}
      {CANDLES.map((c, i) => {
        const lit = flames[i] === "lit";
        const isActive = i === active && lit;
        const scale = isActive ? Math.max(0.2, 1 - 0.78 * progress) : 1;
        const lean = isActive && blowing ? -(8 + strength * 22) : 0;
        return (
          <g key={i}>
            {isActive && (
              <circle cx={c.x} cy={WICK_TOP - 18} r={36} fill="none" stroke="#38bdf8" strokeWidth={2.5} strokeDasharray="5 7" opacity={0.8}>
                <animateTransform attributeName="transform" type="rotate" from={`0 ${c.x} ${WICK_TOP - 18}`} to={`360 ${c.x} ${WICK_TOP - 18}`} dur="8s" repeatCount="indefinite" />
              </circle>
            )}
            <rect x={c.x - 10} y={WICK_TOP + 8} width={20} height={66} rx={6} fill={c.body} />
            <rect x={c.x - 10} y={WICK_TOP + 20} width={20} height={6} fill={c.stripe} />
            <rect x={c.x - 10} y={WICK_TOP + 38} width={20} height={6} fill={c.stripe} />
            <line x1={c.x} y1={WICK_TOP + 8} x2={c.x} y2={WICK_TOP} stroke="#475569" strokeWidth={2.5} strokeLinecap="round" />
            {lit ? (
              <g transform={`translate(${c.x} ${WICK_TOP})`}>
                <circle cx={0} cy={-18 * scale} r={30 * scale + (isActive ? strength * 6 : 0)} fill={`url(#${glowId})`} />
                <g transform={`scale(${scale.toFixed(3)}) skewX(${lean.toFixed(1)})`}>
                  <g key={isActive && blowing ? "fast" : "calm"}>
                    <animateTransform
                      attributeName="transform"
                      type="scale"
                      values="1 1;0.93 1.06;1.05 0.95;1 1"
                      dur={isActive && blowing ? "0.24s" : "0.9s"}
                      repeatCount="indefinite"
                    />
                    <path d={OUTER} fill={`url(#${flameId})`} />
                    <path d={INNER} fill="#fff7cd" />
                  </g>
                </g>
              </g>
            ) : (
              <>
                <circle cx={c.x} cy={WICK_TOP} r={2} fill="#f97316" opacity={0.6} />
                <Smoke x={c.x} y={WICK_TOP - 2} />
              </>
            )}
          </g>
        );
      })}

      {/* Tort */}
      <rect x="38" y="150" width="244" height="86" rx="22" fill="#f9a8d4" />
      <rect x="38" y="194" width="244" height="12" fill="#fbcfe8" />
      {SPRINKLES.map((s, i) => (
        <rect key={i} x={s.x - 5} y={s.y - 1.5} width="10" height="3.5" rx="1.75" fill={s.c} transform={`rotate(${s.r} ${s.x} ${s.y})`} />
      ))}
      <rect x="32" y="142" width="256" height="26" rx="13" fill="#fff1f2" />
      {DRIPS.map((d, i) => (
        <ellipse key={i} cx={d.x} cy={166} rx={d.r * 0.8} ry={d.r} fill="#fff1f2" />
      ))}
    </svg>
  );
}

/** Sham o‘chganda ko‘tariladigan tutun (Web Animations API) */
function Smoke({ x, y }: { x: number; y: number }) {
  const ref = useRef<SVGGElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== "function") return;
    const anim = el.animate(
      [
        { opacity: 0.9, transform: "translateY(0px) scale(0.6)" },
        { opacity: 0, transform: "translateY(-48px) scale(1.6)" },
      ],
      { duration: 1900, easing: "ease-out", fill: "forwards" },
    );
    return () => anim.cancel();
  }, []);
  return (
    <g transform={`translate(${x} ${y})`}>
      <g ref={ref} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <circle cx={-4} cy={-6} r={6} fill="#cbd5e1" />
        <circle cx={5} cy={-15} r={7} fill="#e2e8f0" />
        <circle cx={-2} cy={-26} r={8} fill="#f1f5f9" />
      </g>
    </g>
  );
}
