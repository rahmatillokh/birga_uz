"use client";

import { Check, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiTile } from "@/components/ui/misc";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { CommunityGroup } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { useCommunityLocal } from "./local";

/** Guruh kartasi: a’zolar soni, "Qo‘shilish" (qurilmada saqlanadi) va postlarga o‘tish */
export function GroupCard({
  group,
  postsCount,
  mine,
  onOpen,
  className,
}: {
  group: CommunityGroup;
  postsCount: number;
  mine?: boolean;
  onOpen: () => void;
  className?: string;
}) {
  const joined = useCommunityLocal((s) => !!s.joined[group.id]);
  const toggleJoin = useCommunityLocal((s) => s.toggleJoin);
  return (
    <div className={cn("flex flex-col rounded-3xl border bg-white p-4 shadow-card", joined ? "border-brand-200" : "border-line", className)}>
      <div className="flex items-start gap-3">
        <EmojiTile emoji={group.emoji} size={52} color={group.type === "hudud" ? "#e0f2fe" : "#fdf3dc"} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15.5px] font-extrabold leading-snug text-ink">{group.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-muted">
            <span>👥 {formatNumber(group.members + (joined ? 1 : 0))} a’zo</span>
            <span aria-hidden>·</span>
            <span>{postsCount} ta post</span>
            {mine && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-extrabold text-brand-700">📍 Sizning hududingiz</span>}
          </div>
        </div>
      </div>
      <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-snug text-ink-2">{group.description}</p>
      <div className="mt-auto flex gap-2 pt-3">
        <Button
          size="sm"
          variant={joined ? "soft" : "primary"}
          className="flex-1"
          aria-pressed={joined}
          onClick={() => {
            const on = toggleJoin(group.id);
            haptic(on ? "success" : "light");
            if (on) toast.success(`«${group.name}» guruhiga qo‘shildingiz`, "🎉");
            else toast.info("Guruhdan chiqdingiz", "👋");
          }}
        >
          {joined ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" strokeWidth={3} />}
          {joined ? "A’zosiz" : "Qo‘shilish"}
        </Button>
        <Button size="sm" variant="secondary" className="flex-1" onClick={onOpen}>
          Postlar
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
