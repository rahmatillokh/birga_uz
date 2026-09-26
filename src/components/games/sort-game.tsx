"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { haptic } from "@/lib/client/telegram";
import { cn } from "@/lib/utils";
import { FeedbackBubble, StageTitle, useFeedback, useTimeouts } from "./kit";
import { credit, pct, pick, range, rng, sample, shuffle } from "./lib";
import type { GameProps, Level } from "./types";

/** Rang va shakllar: shaklni to‘g‘ri savatga joylash (bosish yoki sudrash) */

type ColorId = "qizil" | "kok" | "yashil" | "sariq";
type ShapeId = "doira" | "kvadrat" | "uchburchak" | "yulduz";
type Rule = "color" | "shape";

const COLORS: Record<ColorId, { label: string; fill: string; stroke: string; soft: string }> = {
  qizil: { label: "Qizil", fill: "#ef4444", stroke: "#b91c1c", soft: "#fee2e2" },
  kok: { label: "Ko‘k", fill: "#3b82f6", stroke: "#1d4ed8", soft: "#dbeafe" },
  yashil: { label: "Yashil", fill: "#22c55e", stroke: "#15803d", soft: "#dcfce7" },
  sariq: { label: "Sariq", fill: "#facc15", stroke: "#ca8a04", soft: "#fef9c3" },
};
const SHAPES: Record<ShapeId, { label: string; plural: string }> = {
  doira: { label: "Doira", plural: "Doiralar" },
  kvadrat: { label: "Kvadrat", plural: "Kvadratlar" },
  uchburchak: { label: "Uchburchak", plural: "Uchburchaklar" },
  yulduz: { label: "Yulduzcha", plural: "Yulduzchalar" },
};
const COLOR_IDS = Object.keys(COLORS) as ColorId[];
const SHAPE_IDS = Object.keys(SHAPES) as ShapeId[];

interface SortItem {
  id: number;
  color: ColorId;
  shape: ShapeId;
}
interface SortPhase {
  rule: Rule;
  bins: string[];
  items: SortItem[];
}

export function ShapeIcon({
  shape,
  fill,
  stroke,
  dashed,
  className,
}: {
  shape: ShapeId;
  fill: string;
  stroke: string;
  dashed?: boolean;
  className?: string;
}) {
  const p = {
    fill,
    stroke,
    strokeWidth: 6,
    strokeLinejoin: "round" as const,
    strokeDasharray: dashed ? "11 8" : undefined,
  };
  return (
    <svg viewBox="0 0 100 100" className={cn("block", className)} aria-hidden>
      {shape === "doira" && <circle cx="50" cy="50" r="42" {...p} />}
      {shape === "kvadrat" && <rect x="9" y="9" width="82" height="82" rx="14" {...p} />}
      {shape === "uchburchak" && <path d="M50 9 L93 88 H7 Z" {...p} />}
      {shape === "yulduz" && <path d="M50 6 L62.3 35 L93.7 37.8 L70 58.5 L77 89.2 L50 73 L23 89.2 L30 58.5 L6.3 37.8 L37.7 35 Z" {...p} />}
    </svg>
  );
}

function buildPhases(seed: number, level: Level): SortPhase[] {
  const r = rng(seed);
  let id = 0;
  const make = (rule: Rule, nBins: number, nItems: number, fixedShape?: ShapeId): SortPhase => {
    const bins: string[] = rule === "color" ? sample(r, COLOR_IDS, nBins) : sample(r, SHAPE_IDS, nBins);
    // Har bir savatga teng miqdorda
    const assign = shuffle(
      r,
      range(nItems).map((i) => bins[i % nBins]),
    );
    const items = assign.map((b): SortItem => {
      const itemId = id++;
      return rule === "color"
        ? { id: itemId, color: b as ColorId, shape: fixedShape ?? pick(r, SHAPE_IDS) }
        : { id: itemId, shape: b as ShapeId, color: pick(r, COLOR_IDS) };
    });
    return { rule, bins, items };
  };
  if (level === 1) return [make("color", 2, 6, pick(r, ["doira", "kvadrat"] as ShapeId[]))];
  if (level === 2) return [make(r() < 0.5 ? "color" : "shape", 3, 8)];
  // Qiyin: o‘yin o‘rtasida qoida almashadi (rang → shakl yoki aksincha)
  const first: Rule = r() < 0.5 ? "color" : "shape";
  return [make(first, 3, 5), make(first === "color" ? "shape" : "color", 3, 5)];
}

function itemLabel(it: SortItem) {
  return `${COLORS[it.color].label} ${SHAPES[it.shape].label.toLowerCase()}`;
}

function binLabel(rule: Rule, bin: string) {
  return rule === "color" ? COLORS[bin as ColorId].label : SHAPES[bin as ShapeId].plural;
}

export function SortGame({ level, seed, onProgress, onFinish }: GameProps) {
  const [phases] = useState(() => buildPhases(seed, level));
  const [pi, setPi] = useState(0);
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [shakeBin, setShakeBin] = useState<{ bin: string; n: number } | null>(null);
  const [shakeItem, setShakeItem] = useState<{ id: number; n: number } | null>(null);
  const [drag, setDrag] = useState<{ id: number; x: number; y: number } | null>(null);
  const [hoverBin, setHoverBin] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const mistakes = useRef<Record<number, number>>({});
  const dragRef = useRef<{ id: number; pointerId: number; sx: number; sy: number; moved: boolean } | null>(null);
  const hoverRef = useRef<string | null>(null);
  const suppressClick = useRef(false);
  const ghostRef = useRef<HTMLDivElement>(null);
  const later = useTimeouts();
  const { fb, good, bad } = useFeedback();

  const phase = phases[pi];
  const total = phases.reduce((s, p) => s + p.items.length, 0);
  const doneCount = Object.keys(placed).length;
  const remaining = phase.items.filter((it) => placed[it.id] === undefined);
  // Tanlangan shakl bo‘lmasa — navbatdagisi avtomatik tanlanadi (kichkintoylar uchun bitta bosish yetadi)
  const current = selected !== null && remaining.some((it) => it.id === selected) ? selected : (remaining[0]?.id ?? null);
  const dragItem = drag ? phase.items.find((it) => it.id === drag.id) : undefined;

  useEffect(() => {
    onProgress(doneCount, total);
  }, [doneCount, total, onProgress]);

  const finish = () => {
    const items = phases.flatMap((p) => p.items);
    const m = mistakes.current;
    const credits = items.reduce((s, it) => s + credit(m[it.id] ?? 0), 0);
    const first = items.filter((it) => !m[it.id]).length;
    onFinish({ correct: first, total: items.length, score: pct(credits, items.length) });
  };

  const place = (itemId: number, bin: string) => {
    if (locked || placed[itemId] !== undefined) return;
    const item = phase.items.find((x) => x.id === itemId);
    if (!item) return;
    const key = phase.rule === "color" ? item.color : item.shape;
    if (key === bin) {
      const next = { ...placed, [itemId]: bin };
      setPlaced(next);
      setSelected(null);
      const left = phase.items.filter((x) => next[x.id] === undefined).length;
      if (left > 0) {
        good();
        return;
      }
      setLocked(true);
      if (pi + 1 < phases.length) {
        good("Barakalla! Endi qoida o‘zgaradi 👀");
        later(() => {
          setPi(pi + 1);
          setLocked(false);
        }, 1500);
      } else {
        good("Hammasi joyida! 🎉");
        later(finish, 1000);
      }
    } else {
      const n = (mistakes.current[itemId] ?? 0) + 1;
      mistakes.current[itemId] = n;
      setShakeBin((s) => ({ bin, n: (s?.n ?? 0) + 1 }));
      setShakeItem((s) => ({ id: itemId, n: (s?.n ?? 0) + 1 }));
      setSelected(itemId);
      // Ikkinchi xatodan keyin — yumshoq yordam
      const hint = phase.rule === "color" ? `${COLORS[item.color].label} savatni top!` : `${SHAPES[item.shape].plural} savatini top!`;
      bad(n >= 2 ? hint : undefined);
    }
  };

  const select = (id: number) => {
    if (locked || placed[id] !== undefined) return;
    setSelected(id);
    haptic("select");
  };

  // ------------------------------------------------------------- Sudrash
  const binAt = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y);
    const bin = el instanceof Element ? el.closest("[data-bin]") : null;
    return bin?.getAttribute("data-bin") ?? null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, id: number) => {
    suppressClick.current = false;
    if (locked || (e.pointerType === "mouse" && e.button !== 0)) return;
    dragRef.current = { id, pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 8) return;
      d.moved = true;
      setSelected(d.id);
      setDrag({ id: d.id, x: e.clientX, y: e.clientY });
      haptic("light");
    }
    const g = ghostRef.current;
    if (g) g.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    const bin = binAt(e.clientX, e.clientY);
    if (bin !== hoverRef.current) {
      hoverRef.current = bin;
      setHoverBin(bin);
    }
  };

  const endDrag = () => {
    dragRef.current = null;
    hoverRef.current = null;
    setDrag(null);
    setHoverBin(null);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (!d.moved) {
      dragRef.current = null;
      return; // oddiy bosish — onClick tanlaydi
    }
    // Sudrashdan keyingi «click» hodisasini e’tiborsiz qoldiramiz
    suppressClick.current = true;
    later(() => {
      suppressClick.current = false;
    }, 60);
    const bin = binAt(e.clientX, e.clientY);
    endDrag();
    if (bin) place(d.id, bin);
  };

  const onPointerCancel = () => {
    endDrag();
  };

  const ruleTitle = phase.rule === "color" ? "Rangiga qarab joylang 🎨" : "Shakliga qarab joylang 🔷";

  return (
    <div className="relative flex flex-1 flex-col">
      <FeedbackBubble fb={fb} />
      <StageTitle key={pi} className={pi > 0 ? "animate-pop" : undefined} sub={level === 1 ? "Shaklni bosing yoki savatga sudrang" : "Shaklni tanlang, keyin to‘g‘ri savatni bosing"}>
        {ruleTitle}
      </StageTitle>

      {/* Shakllar */}
      <div className="flex flex-1 items-center py-1">
        <div className="mx-auto flex w-full max-w-[520px] flex-wrap justify-center gap-2 sm:max-w-[600px] sm:gap-3">
          {phase.items.map((it) => {
            if (placed[it.id] !== undefined) {
              return <span key={it.id} aria-hidden className="aspect-square w-[calc(25%-6px)] sm:w-[calc(20%-10px)]" />;
            }
            const isCurrent = current === it.id;
            const shaking = shakeItem?.id === it.id;
            return (
              <button
                key={it.id}
                type="button"
                onPointerDown={(e) => onPointerDown(e, it.id)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  select(it.id);
                }}
                aria-label={itemLabel(it)}
                aria-pressed={isCurrent}
                className={cn(
                  "relative grid aspect-square w-[calc(25%-6px)] select-none place-items-center rounded-2xl p-2 transition-[box-shadow,background-color,opacity,scale] duration-200 [touch-action:none] sm:w-[calc(20%-10px)] sm:p-2.5",
                  isCurrent ? "z-10 scale-105 bg-white shadow-pop ring-4 ring-brand-300" : "bg-white/70 ring-1 ring-line hover:bg-white",
                  drag?.id === it.id && "opacity-30",
                  locked && "pointer-events-none",
                )}
              >
                <span key={shaking ? shakeItem.n : 0} className={cn("block h-full w-full", shaking && "animate-shake")}>
                  <span className={cn("block h-full w-full", isCurrent && !drag && "animate-float")}>
                    <ShapeIcon shape={it.shape} fill={COLORS[it.color].fill} stroke={COLORS[it.color].stroke} className="h-full w-full" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Savatlar */}
      <div className="mx-auto grid w-full max-w-[560px] gap-2 pt-4 sm:max-w-[600px] sm:gap-3" style={{ gridTemplateColumns: `repeat(${phase.bins.length}, minmax(0, 1fr))` }}>
        {phase.bins.map((bin) => {
          const isColor = phase.rule === "color";
          const c = isColor ? COLORS[bin as ColorId] : null;
          const inBin = phase.items.filter((it) => placed[it.id] === bin);
          const shaking = shakeBin?.bin === bin;
          return (
            <button
              key={`${pi}-${bin}`}
              type="button"
              data-bin={bin}
              onClick={() => current !== null && place(current, bin)}
              aria-label={`${binLabel(phase.rule, bin)} savati`}
              className={cn(
                "relative flex h-[124px] flex-col items-center rounded-b-[28px] rounded-t-2xl border-[3px] border-t-[7px] px-1.5 pb-2 pt-1.5 transition-[scale,box-shadow] duration-150 [touch-action:manipulation] sm:h-[150px]",
                hoverBin === bin ? "scale-[1.05] shadow-pop" : "shadow-card hover:shadow-pop",
                pi > 0 && "animate-[yq-fly-in_0.4s_ease-out]",
              )}
              style={{
                borderColor: c ? c.fill : "#94a3b8",
                backgroundColor: c ? c.soft : "#f8fafc",
                backgroundImage: "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.45) 0 6px, transparent 6px 14px)",
              }}
            >
              <span key={shaking ? shakeBin.n : 0} className={cn("flex w-full flex-1 flex-col items-center", shaking && "animate-shake")}>
                <span className="flex items-center gap-1.5 rounded-full bg-white/85 px-2 py-0.5 shadow-sm">
                  {c ? (
                    <span className="h-5 w-5 rounded-full sm:h-6 sm:w-6" style={{ background: c.fill }} />
                  ) : (
                    <ShapeIcon shape={bin as ShapeId} fill="#e2e8f0" stroke="#475569" dashed className="h-6 w-6 sm:h-7 sm:w-7" />
                  )}
                  <span className="text-[12.5px] font-black text-ink-2 sm:text-sm">{binLabel(phase.rule, bin)}</span>
                </span>
                <span className="mt-1.5 flex flex-wrap justify-center gap-1">
                  {inBin.map((it) => (
                    <ShapeIcon
                      key={it.id}
                      shape={it.shape}
                      fill={COLORS[it.color].fill}
                      stroke={COLORS[it.color].stroke}
                      className="h-6 w-6 animate-[yq-fly-in_0.35s_ease-out] sm:h-8 sm:w-8"
                    />
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {drag &&
        dragItem &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={ghostRef}
            className="pointer-events-none fixed left-0 top-0 z-[85]"
            style={{ transform: `translate(${drag.x}px, ${drag.y}px) translate(-50%, -50%)` }}
            aria-hidden
          >
            <div className="h-20 w-20 rotate-6 drop-shadow-xl sm:h-24 sm:w-24">
              <ShapeIcon shape={dragItem.shape} fill={COLORS[dragItem.color].fill} stroke={COLORS[dragItem.color].stroke} className="h-full w-full" />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
