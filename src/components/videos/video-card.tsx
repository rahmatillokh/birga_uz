"use client";

import { Check, Lock, Play } from "lucide-react";
import Link from "next/link";
import { VIDEO_CATEGORIES } from "@/lib/constants";
import type { Video } from "@/lib/types";
import { cn } from "@/lib/utils";
import { accentOf, formatClock, videoSeconds } from "./shared";

/** Video eskizi: emoji rangli fon ustida + play belgisi + davomiylik */
export function VideoThumb({
  video,
  watched,
  locked,
  size = "md",
  className,
}: {
  video: Video;
  watched?: boolean;
  locked?: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  const accent = accentOf(video.category);
  return (
    <div className={cn("relative grid aspect-video place-items-center overflow-hidden", className)} style={{ background: video.color }}>
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/40" />
      <div className="pointer-events-none absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/35" />
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-60" />
      <span
        className={cn(
          "relative leading-none drop-shadow-sm transition-transform duration-300 group-hover:scale-110",
          size === "lg" ? "text-[84px] sm:text-[104px]" : "text-[52px] sm:text-[60px]",
          locked && "opacity-70",
        )}
      >
        {video.emoji}
      </span>

      {/* Play */}
      <span
        className={cn(
          "absolute bottom-2.5 left-2.5 grid place-items-center rounded-full text-white shadow-lg ring-4 ring-white/60 transition group-hover:scale-110",
          size === "lg" ? "h-12 w-12" : "h-9 w-9",
        )}
        style={{ background: accent }}
      >
        {locked ? <Lock className="h-4 w-4" /> : <Play className={cn("translate-x-[1px] fill-white", size === "lg" ? "h-5 w-5" : "h-4 w-4")} />}
      </span>

      {/* Davomiylik */}
      <span className="absolute bottom-2.5 right-2.5 rounded-full bg-ink/75 px-2 py-0.5 text-[11px] font-bold text-white tabular">
        {formatClock(videoSeconds(video))}
      </span>

      {/* Belgilar */}
      <div className="absolute left-2.5 right-2.5 top-2.5 flex items-start justify-between gap-2">
        {watched ? (
          <span className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-extrabold text-[#0b7a52] shadow-sm">
            <Check className="h-3 w-3" strokeWidth={3.5} /> Ko‘rilgan
          </span>
        ) : !video.youtubeId ? (
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-extrabold text-ink shadow-sm">🎬 Interaktiv</span>
        ) : (
          <span />
        )}
        {video.premium && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold shadow-sm",
              locked ? "bg-[#5b3fe0] text-white" : "bg-[#efeaff] text-[#5b3fe0]",
            )}
          >
            💎{locked && <Lock className="h-3 w-3" />}
          </span>
        )}
      </div>
    </div>
  );
}

export function VideoCard({ video, watched, locked, className }: { video: Video; watched?: boolean; locked?: boolean; className?: string }) {
  const cat = VIDEO_CATEGORIES[video.category];
  return (
    <Link
      href={`/videos/${video.id}`}
      className={cn(
        "group block overflow-hidden rounded-3xl border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop",
        className,
      )}
    >
      <VideoThumb video={video} watched={watched} locked={locked} className="aspect-[4/3] sm:aspect-video" />
      <div className="p-3 sm:p-3.5">
        <div className="line-clamp-2 text-[14px] font-extrabold leading-snug text-ink group-hover:text-brand-700 sm:text-[15px]">{video.title}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] font-semibold text-muted">
          <span>
            {cat.emoji} {cat.label}
          </span>
          <span className="text-faint">·</span>
          <span>
            {video.ageMin}–{video.ageMax} yosh
          </span>
        </div>
      </div>
    </Link>
  );
}
