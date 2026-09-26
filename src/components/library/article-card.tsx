"use client";

import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { getSpecialist } from "@/data/specialists";
import { ARTICLE_TOPICS } from "@/lib/constants";
import type { Article, ArticleTopic } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

/** Hex rangga shaffoflik qo‘shish: ("#2a78d6", 0.12) -> "#2a78d61f" */
export function tint(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${a}` : hex;
}

export function authorEmoji(article: Article): string {
  const sp = getSpecialist(article.authorId);
  if (!sp) return "📝";
  return sp.gender === "ayol" ? "👩‍⚕️" : "👨‍⚕️";
}

/** Ro‘yxatdagi maqola kartasi */
export function ArticleRow({ article, read, className }: { article: Article; read?: boolean; className?: string }) {
  const t = ARTICLE_TOPICS[article.topic];
  return (
    <Link
      href={`/library/${article.id}`}
      className={cn(
        "group flex gap-3.5 rounded-3xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop",
        className,
      )}
    >
      <div
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[28px] transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16 sm:text-[32px]"
        style={{ background: tint(t.color, 0.12) }}
      >
        {article.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-muted">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: t.color }} />
          <span className="truncate">{t.label}</span>
          {read && <span className="ml-auto shrink-0 rounded-full bg-[#e3f6ef] px-2 py-0.5 text-[11px] font-extrabold text-[#0b7a52]">✓ O‘qilgan</span>}
        </div>
        <div className="mt-1 line-clamp-2 text-[15.5px] font-extrabold leading-snug text-ink group-hover:text-brand-700">{article.title}</div>
        <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-muted">{article.summary}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.readMin} daqiqa
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <span>{authorEmoji(article)}</span>
            <span className="truncate">{article.author}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Tavsiya etilgan (katta) maqola */
export function FeaturedArticle({ article, read }: { article: Article; read?: boolean }) {
  const t = ARTICLE_TOPICS[article.topic];
  return (
    <Link
      href={`/library/${article.id}`}
      className="group relative block overflow-hidden rounded-[28px] border border-line p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop sm:p-7"
      style={{ background: `linear-gradient(135deg, ${tint(t.color, 0.16)} 0%, #ffffff 62%)` }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full" style={{ background: tint(t.color, 0.1) }} />
      <div className="relative flex items-start gap-4 sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-ink shadow-sm">⭐ Tavsiya etamiz</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
              {t.label}
            </span>
            {read && <span className="rounded-full bg-[#e3f6ef] px-2 py-0.5 text-[11px] font-extrabold text-[#0b7a52]">✓ O‘qilgan</span>}
          </div>
          <h2 className="mt-3 text-[21px] font-black leading-tight text-ink sm:text-[26px]">{article.title}</h2>
          <p className="mt-2 line-clamp-3 text-[14.5px] leading-relaxed text-ink-2 sm:text-[15px]">{article.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-semibold text-muted">
            <span>
              {authorEmoji(article)} {article.author}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {article.readMin} daqiqa
            </span>
            <span>{formatDate(article.date)}</span>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition group-hover:gap-2.5">
            O‘qish <ArrowRight className="h-4 w-4" />
          </span>
        </div>
        <div
          className="hidden h-28 w-28 shrink-0 place-items-center rounded-[28px] bg-white text-6xl shadow-card sm:grid"
          aria-hidden
        >
          <span className="animate-float">{article.emoji}</span>
        </div>
      </div>
    </Link>
  );
}

/** Mavzu kartasi (tanlanadigan) */
export function TopicCard({
  topic,
  count,
  active,
  onClick,
  className,
}: {
  topic: ArticleTopic | "all";
  count: number;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  const meta = topic === "all" ? { label: "Barcha mavzular", emoji: "📚", color: "#0ea5e9" } : ARTICLE_TOPICS[topic];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-start gap-2 rounded-3xl border bg-white p-3.5 text-left transition hover:-translate-y-0.5",
        active ? "shadow-pop" : "border-line shadow-card hover:border-brand-200",
        className,
      )}
      style={active ? { borderColor: meta.color, boxShadow: `0 0 0 3px ${tint(meta.color, 0.2)}` } : undefined}
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl text-2xl" style={{ background: tint(meta.color, 0.14) }}>
        {meta.emoji}
      </span>
      <span className="line-clamp-2 min-h-[2.4em] text-[14px] font-extrabold leading-tight text-ink">{meta.label}</span>
      <span className="text-xs font-semibold text-muted">{count} ta maqola</span>
    </button>
  );
}
