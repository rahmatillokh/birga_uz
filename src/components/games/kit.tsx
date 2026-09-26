"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/client/telegram";
import { cn } from "@/lib/utils";
import { encourage, praise } from "./lib";
import { sfx } from "./sfx";

// ---------------------------------------------------------------------------
// O‘yinlar uchun animatsiyalar (globals.css’ga tegmasdan, React 19 <style> orqali)
// ---------------------------------------------------------------------------

const KEYFRAMES = `
@keyframes yq-bounce{0%{transform:scale(1)}30%{transform:scale(1.15)}55%{transform:scale(.95)}75%{transform:scale(1.04)}100%{transform:scale(1)}}
@keyframes yq-bubble{0%{opacity:0;transform:translate(-50%,-8px) scale(.85)}14%{opacity:1;transform:translate(-50%,0) scale(1.06)}24%{transform:translate(-50%,0) scale(1)}82%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,-6px) scale(1)}}
@keyframes yq-star-in{0%{opacity:0;transform:scale(0) rotate(-45deg)}60%{opacity:1;transform:scale(1.25) rotate(8deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
@keyframes yq-life{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}10%{opacity:1;transform:translate(-50%,-50%) scale(1.12)}18%{opacity:1;transform:translate(-50%,-50%) scale(1)}72%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:.15;transform:translate(-50%,-50%) scale(.75)}}
@keyframes yq-burst{0%{opacity:1;transform:translate(-50%,-50%) scale(.7)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.9)}}
@keyframes yq-rise{0%{opacity:1;transform:translate(-50%,-50%)}100%{opacity:0;transform:translate(-50%,-190%)}}
@keyframes yq-fly-in{0%{opacity:0;transform:translateY(-18px) scale(.5)}70%{opacity:1;transform:translateY(2px) scale(1.08)}100%{opacity:1;transform:none}}
@keyframes yq-fade{from{opacity:0}to{opacity:1}}
@keyframes yq-count{0%{opacity:0;transform:scale(2.2)}30%{opacity:1;transform:scale(1)}80%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.8)}}
@keyframes yq-glow{0%{box-shadow:0 0 0 0 rgb(12 163 12 / .45)}100%{box-shadow:0 0 0 16px rgb(12 163 12 / 0)}}
@keyframes yq-hint{0%,100%{box-shadow:0 0 0 0 rgb(14 165 233 / .5)}50%{box-shadow:0 0 0 10px rgb(14 165 233 / 0)}}
`;

export function GameStyles() {
  return (
    <style href="yuniqo-games-keyframes" precedence="default">
      {KEYFRAMES}
    </style>
  );
}

// ---------------------------------------------------------------------------
// Taymerlar
// ---------------------------------------------------------------------------

/** Komponent yopilganda avtomatik tozalanadigan setTimeout (hodisa ishlovchilarida ishlating) */
export function useTimeouts() {
  const ids = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const set = ids.current;
    return () => {
      set.forEach((id) => clearTimeout(id));
      set.clear();
    };
  }, []);
  return useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      ids.current.delete(id);
      fn();
    }, ms);
    ids.current.add(id);
    return id;
  }, []);
}

// ---------------------------------------------------------------------------
// Tezkor fikr-mulohaza: «Barakalla!» / «Yana urinib ko‘r!»
// ---------------------------------------------------------------------------

export type FeedbackKind = "good" | "bad" | "info";
export interface Feedback {
  kind: FeedbackKind;
  text: string;
  id: number;
}

export function useFeedback() {
  const [fb, setFb] = useState<Feedback | null>(null);
  const later = useTimeouts();
  const seq = useRef(0);

  const show = useCallback(
    (kind: FeedbackKind, text: string, ms = 1100) => {
      const id = ++seq.current;
      setFb({ kind, text, id });
      later(() => setFb((cur) => (cur?.id === id ? null : cur)), ms);
    },
    [later],
  );

  /** To‘g‘ri: yashil pufak + haptic("success") + ovoz */
  const good = useCallback(
    (text?: string) => {
      haptic("success");
      sfx.good();
      show("good", text ?? praise());
    },
    [show],
  );

  /** Noto‘g‘ri: yumshoq sariq pufak + haptic("error") + ovoz */
  const bad = useCallback(
    (text?: string) => {
      haptic("error");
      sfx.bad();
      show("bad", text ?? encourage());
    },
    [show],
  );

  const info = useCallback((text: string) => show("info", text, 1500), [show]);

  return { fb, good, bad, info };
}

/** Tezkor pufak; `className` bilan joyini o‘zgartirish mumkin (masalan, nishonni yopmasligi uchun) */
export function FeedbackBubble({ fb, className }: { fb: Feedback | null; className?: string }) {
  return (
    <div aria-live="polite" className={cn("pointer-events-none absolute inset-x-0 top-0 z-30 h-0", className)}>
      {fb && (
        <div
          key={fb.id}
          className={cn(
            "absolute left-1/2 top-1 flex max-w-[92%] items-center gap-2 rounded-full px-4 py-2 text-[15px] font-black shadow-pop sm:text-base",
            "animate-[yq-bubble_1.1s_ease-out_forwards]",
            fb.kind === "good" && "bg-good text-white",
            fb.kind === "bad" && "bg-warn text-ink",
            fb.kind === "info" && "bg-ink text-white",
          )}
        >
          <span aria-hidden>{fb.kind === "good" ? "🎉" : fb.kind === "bad" ? "🙂" : "💡"}</span>
          <span className="truncate">{fb.text}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vaqt chizig‘i (raund taymeri) — Web Animations API, har soniyada qayta chizilmaydi
// ---------------------------------------------------------------------------

export function TimerBar({ ms, running, className }: { ms: number; running: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== "function") return;
    const a = el.animate(
      [
        { transform: "scaleX(1)", backgroundColor: "#1baf7a" },
        { transform: "scaleX(0.45)", backgroundColor: "#eda100", offset: 0.55 },
        { transform: "scaleX(0)", backgroundColor: "#d03b3b" },
      ],
      { duration: ms, easing: "linear", fill: "forwards" },
    );
    anim.current = a;
    return () => a.cancel();
  }, [ms]);

  useEffect(() => {
    if (!running) anim.current?.pause();
  }, [running]);

  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-slate-100", className)} role="presentation">
      <div ref={ref} className="h-full w-full origin-left rounded-full bg-good" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sahna sarlavhasi va variant tugmasi
// ---------------------------------------------------------------------------

export function StageTitle({ children, sub, className }: { children: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex min-h-[54px] flex-col items-center justify-center px-2 text-center sm:mb-4", className)}>
      <h2 className="text-[19px] font-black leading-tight text-ink sm:text-[22px]">{children}</h2>
      {sub && <p className="mt-1 text-[13px] font-bold text-muted sm:text-sm">{sub}</p>}
    </div>
  );
}

export type ChoiceState = "idle" | "correct" | "wrong" | "dim";

export function ChoiceButton({
  state,
  onClick,
  label,
  children,
  className,
}: {
  state: ChoiceState;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={state !== "idle" || undefined}
      onClick={onClick}
      className={cn(
        "relative flex select-none flex-col items-center justify-center gap-1 rounded-3xl border-2 bg-white p-2 text-center transition-[transform,box-shadow,background-color,border-color,opacity] duration-200 [touch-action:manipulation]",
        state === "idle" && "border-line shadow-card hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop active:scale-95",
        state === "correct" && "z-10 border-good bg-[#effbef] ring-4 ring-good/25 animate-[yq-bounce_0.55s_ease-out]",
        state === "wrong" && "border-warn/70 bg-warn/10 opacity-60 animate-shake",
        state === "dim" && "border-line opacity-40",
        className,
      )}
    >
      {children}
      {state === "correct" && (
        <span className="absolute -right-1.5 -top-1.5 grid h-7 w-7 place-items-center rounded-full bg-good text-sm font-black text-white shadow-card" aria-hidden>
          ✓
        </span>
      )}
      {state === "wrong" && (
        <span className="absolute -right-1.5 -top-1.5 grid h-7 w-7 place-items-center rounded-full bg-warn text-sm font-black text-ink shadow-card" aria-hidden>
          ✕
        </span>
      )}
    </button>
  );
}
