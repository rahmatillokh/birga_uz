"use client";

import { LoaderCircle, Mic, Square } from "lucide-react";
import { haptic } from "@/lib/client/telegram";
import { cn } from "@/lib/utils";

export type MicButtonState = "idle" | "listening" | "recording" | "busy";

/** Katta, bolalarga qulay mikrofon tugmasi (tinglayotganda pulsatsiyalanuvchi halqa bilan) */
export function MicButton({
  state,
  onClick,
  disabled,
  className,
  label,
}: {
  state: MicButtonState;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const active = state === "listening" || state === "recording";
  return (
    <div className={cn("relative grid place-items-center", className)}>
      <span
        aria-hidden
        className={cn(
          "absolute h-36 w-36 rounded-full transition-colors sm:h-40 sm:w-40",
          active ? "bg-brand-100" : "bg-brand-50",
        )}
      />
      <button
        type="button"
        onClick={() => {
          haptic("medium");
          onClick();
        }}
        disabled={disabled || state === "busy"}
        aria-pressed={active}
        aria-label={label ?? (active ? "To‘xtatish" : "Gapirish")}
        className={cn(
          "relative grid h-28 w-28 place-items-center rounded-full bg-brand-gradient text-white shadow-brand ring-4 ring-white transition active:scale-95 disabled:opacity-50 sm:h-32 sm:w-32",
          active && "animate-pulse-ring",
        )}
      >
        {state === "busy" ? (
          <LoaderCircle className="h-11 w-11 animate-spin" />
        ) : active ? (
          <Square className="h-10 w-10 fill-current" />
        ) : (
          <Mic className="h-12 w-12" strokeWidth={2.4} />
        )}
        {state === "recording" && (
          <span className="absolute right-3 top-3 h-4 w-4 animate-pulse rounded-full bg-[#ef4444] ring-2 ring-white" aria-hidden />
        )}
      </button>
    </div>
  );
}
