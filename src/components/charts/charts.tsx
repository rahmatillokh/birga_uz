"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DOMAINS, DOMAIN_ORDER } from "@/lib/constants";
import type { Assessment, Domain, Scores } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

// Grafik "siyohi" — matn va chiziqlar uchun tokenlar (ma’lumot rangi matnga berilmaydi)
const INK = { primary: "#0f172a", secondary: "#475569", muted: "#8a94a6", grid: "#e6edf5", axis: "#c9d4e2" };
const PREV = "#9aa8bb"; // oldingi natija — neytral kulrang
const BRAND = "#0ea5e9";

type TipRow = { name: string; value: number | string; color: string; unit?: string };

function TipCard({ title, rows }: { title?: string; rows: TipRow[] }) {
  return (
    <div className="min-w-[150px] rounded-2xl border border-line bg-white px-3 py-2.5 shadow-pop">
      {title && <div className="mb-1.5 text-xs font-bold text-muted">{title}</div>}
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-2 text-sm">
            <span className="h-0.5 w-3.5 rounded-full" style={{ background: r.color, height: 3 }} />
            <span className="font-black text-ink tabular">
              {r.value}
              {r.unit ?? ""}
            </span>
            <span className="text-xs font-semibold text-ink-2">{r.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendItem({ color, label, kind = "line", dim }: { color: string; label: string; kind?: "line" | "rect"; dim?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold text-ink-2", dim && "opacity-40")}>
      {kind === "line" ? (
        <span className="inline-block h-[3px] w-4 rounded-full" style={{ background: color }} />
      ) : (
        <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />
      )}
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// 6 yo‘nalish bo‘yicha radar: birinchi vs hozirgi
// ---------------------------------------------------------------------------
export function DomainRadar({
  current,
  previous,
  currentLabel = "Hozirgi",
  previousLabel = "Birinchi baholash",
  height = 280,
}: {
  current: Scores;
  previous?: Scores;
  currentLabel?: string;
  previousLabel?: string;
  height?: number;
}) {
  const data = DOMAIN_ORDER.map((d) => ({
    key: d,
    label: `${DOMAINS[d].emoji} ${DOMAINS[d].short}`,
    cur: current[d],
    prev: previous?.[d] ?? null,
  }));
  return (
    <div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke={INK.grid} />
            <PolarAngleAxis dataKey="label" tick={{ fill: INK.secondary, fontSize: 12, fontWeight: 700 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} tickCount={5} />
            {previous && (
              <Radar name={previousLabel} dataKey="prev" stroke={PREV} strokeWidth={2} fill={PREV} fillOpacity={0.08} dot={{ r: 3, fill: PREV, strokeWidth: 0 }} isAnimationActive={false} />
            )}
            <Radar name={currentLabel} dataKey="cur" stroke={BRAND} strokeWidth={2} fill={BRAND} fillOpacity={0.14} dot={{ r: 4, fill: BRAND, stroke: "#fff", strokeWidth: 2 }} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as (typeof data)[number];
                const rows: TipRow[] = [{ name: currentLabel, value: row.cur, color: BRAND, unit: "%" }];
                if (row.prev !== null) rows.push({ name: previousLabel, value: row.prev, color: PREV, unit: "%" });
                return <TipCard title={DOMAINS[row.key].label} rows={rows} />;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-4">
        <LegendItem color={BRAND} label={currentLabel} />
        {previous && <LegendItem color={PREV} label={previousLabel} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Baholashlar bo‘yicha yo‘nalishlar dinamikasi (chiziqli grafik)
// ---------------------------------------------------------------------------
export function DomainTrend({ assessments, height = 260 }: { assessments: Assessment[]; height?: number }) {
  const [hidden, setHidden] = useState<Set<Domain>>(new Set());
  const data = useMemo(
    () =>
      [...assessments]
        .sort((a, b) => a.at.localeCompare(b.at))
        .map((a) => ({ date: formatDate(a.at), ...a.scores })),
    [assessments],
  );
  if (data.length < 2) {
    return <div className="grid h-40 place-items-center text-sm font-semibold text-muted">Dinamikani ko‘rish uchun kamida 2 ta baholash kerak</div>;
  }
  return (
    <div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: -18 }}>
            <CartesianGrid stroke={INK.grid} vertical={false} />
            <XAxis dataKey="date" tick={{ fill: INK.muted, fontSize: 12, fontWeight: 600 }} axisLine={{ stroke: INK.axis }} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: INK.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ stroke: INK.axis, strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const rows = DOMAIN_ORDER.filter((d) => !hidden.has(d)).map((d) => ({
                  name: DOMAINS[d].label,
                  value: (payload[0].payload as Record<string, number>)[d],
                  color: DOMAINS[d].color,
                  unit: "%",
                }));
                return <TipCard title={String(label)} rows={rows} />;
              }}
            />
            {DOMAIN_ORDER.filter((d) => !hidden.has(d)).map((d) => (
              <Line
                key={d}
                type="monotone"
                dataKey={d}
                name={DOMAINS[d].label}
                stroke={DOMAINS[d].color}
                strokeWidth={2}
                strokeLinecap="round"
                dot={{ r: 4, fill: DOMAINS[d].color, stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {DOMAIN_ORDER.map((d) => (
          <button
            key={d}
            onClick={() =>
              setHidden((s) => {
                const n = new Set(s);
                if (n.has(d)) n.delete(d);
                else if (n.size < DOMAIN_ORDER.length - 1) n.add(d);
                return n;
              })
            }
            aria-pressed={!hidden.has(d)}
          >
            <LegendItem color={DOMAINS[d].color} label={DOMAINS[d].label} dim={hidden.has(d)} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Faollik ustunlari (kunlik / haftalik)
// ---------------------------------------------------------------------------
export function ActivityBars({
  data,
  height = 200,
  unit = " ta",
  name = "Mashg‘ulotlar",
  highlightLast = true,
}: {
  data: { label: string; value: number; tooltip?: string }[];
  height?: number;
  unit?: string;
  name?: string;
  highlightLast?: boolean;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid stroke={INK.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: INK.muted, fontSize: 12, fontWeight: 600 }} axisLine={{ stroke: INK.axis }} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={{ fill: INK.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgb(14 165 233 / 0.06)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as (typeof data)[number];
              return <TipCard title={row.tooltip ?? row.label} rows={[{ name, value: row.value, color: BRAND, unit }]} />;
            }}
          />
          <Bar
            dataKey="value"
            maxBarSize={24}
            radius={[4, 4, 0, 0]}
            shape={(props: unknown) => {
              const p = props as { x: number; y: number; width: number; height: number; index: number };
              const last = highlightLast && p.index === data.length - 1;
              const r = Math.min(4, p.width / 2, p.height);
              if (p.height <= 0) return <g />;
              return (
                <path
                  d={`M${p.x},${p.y + p.height} L${p.x},${p.y + r} Q${p.x},${p.y} ${p.x + r},${p.y} L${p.x + p.width - r},${p.y} Q${p.x + p.width},${p.y} ${p.x + p.width},${p.y + r} L${p.x + p.width},${p.y + p.height} Z`}
                  fill={last ? BRAND : "#7dd3fc"}
                />
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bitta ko‘rsatkich dinamikasi (masalan, AI tekshiruv aniqligi)
// ---------------------------------------------------------------------------
export function ScoreLine({
  data,
  height = 180,
  name = "Natija",
  color = BRAND,
  unit = "%",
}: {
  data: { label: string; value: number }[];
  height?: number;
  name?: string;
  color?: string;
  unit?: string;
}) {
  if (data.length < 2) return <div className="grid h-24 place-items-center text-sm font-semibold text-muted">Ma’lumot yetarli emas</div>;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -24 }}>
          <CartesianGrid stroke={INK.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: INK.muted, fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: INK.axis }} tickLine={false} minTickGap={16} />
          <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fill: INK.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ stroke: INK.axis, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return <TipCard title={String(label)} rows={[{ name, value: payload[0].value as number, color, unit }]} />;
            }}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3.5, fill: color, stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Kichik sparkline (SVG, interaktiv emas — faqat trend ko‘rsatkichi) */
export function Sparkline({ values, color = BRAND, width = 96, height = 28 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - 4) + 2;
    const y = height - 2 - ((v - min) / (max - min || 1)) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const [lx, ly] = pts[pts.length - 1].split(",").map(Number);
  return (
    <svg width={width} height={height} aria-hidden>
      <polyline points={pts.join(" ")} fill="none" stroke="#bae6fd" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} />
    </svg>
  );
}

/** Yo‘nalishlar bo‘yicha gorizontal ko‘rsatkichlar (radar o‘rniga ixcham ko‘rinish) */
export function DomainBars({ scores, previous, compact }: { scores: Scores; previous?: Scores; compact?: boolean }) {
  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {DOMAIN_ORDER.map((d) => {
        const v = scores[d];
        const delta = previous ? v - previous[d] : 0;
        return (
          <div key={d}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-bold text-ink-2">
                <span>{DOMAINS[d].emoji}</span>
                {DOMAINS[d].label}
              </span>
              <span className="flex items-center gap-2">
                {previous && delta !== 0 && (
                  <span className={cn("text-xs font-extrabold", delta > 0 ? "text-[#006300]" : "text-danger")}>
                    {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
                  </span>
                )}
                <span className="font-black text-ink tabular">{v}%</span>
              </span>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full" style={{ background: DOMAINS[d].soft }}>
              {previous && <div className="absolute inset-y-0 left-0 rounded-full bg-slate-300/70" style={{ width: `${previous[d]}%` }} />}
              <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700" style={{ width: `${v}%`, background: DOMAINS[d].color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
