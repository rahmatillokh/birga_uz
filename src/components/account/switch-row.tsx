"use client";

import { Switch } from "@/components/ui/form";
import { EmojiTile } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

/** Emoji plitka + sarlavha + izoh + o‘ng tomonda Switch */
export function SwitchRow({
  emoji,
  color = "#e0f2fe",
  label,
  description,
  checked,
  onChange,
  badge,
  className,
}: {
  emoji: string;
  color?: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 py-2.5", className)}>
      <EmojiTile emoji={emoji} color={color} size={42} className="mt-1.5" />
      <div className="min-w-0 flex-1">
        <Switch
          checked={checked}
          onChange={onChange}
          label={
            badge ? (
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {label}
                {badge}
              </span>
            ) : (
              label
            )
          }
          description={description}
        />
      </div>
    </div>
  );
}
