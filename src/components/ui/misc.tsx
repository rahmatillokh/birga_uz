"use client";

import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DOMAINS } from "@/lib/constants";
import type { Domain } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { Button } from "./button";

/** Sahifa sarlavhasi */
export function PageHeader({
  title,
  subtitle,
  emoji,
  back,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  emoji?: string;
  back?: string | boolean;
  actions?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <div className={cn("mb-5 flex items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {back && (
          <button
            onClick={() => (typeof back === "string" ? router.push(back) : router.back())}
            className="no-print mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-line bg-white text-ink-2 hover:bg-brand-50"
            aria-label="Orqaga"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {emoji && <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-card">{emoji}</div>}
        <div className="min-w-0">
          <h1 className="text-[22px] font-black leading-tight text-ink sm:text-[26px]">{title}</h1>
          {subtitle && <p className="mt-1 text-sm leading-snug text-muted sm:text-[15px]">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="no-print flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Bo‘lim sarlavhasi (+ "Barchasi" havolasi) */
export function Section({
  title,
  href,
  linkLabel = "Barchasi",
  children,
  className,
  action,
}: {
  title: React.ReactNode;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("mt-7", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-ink">{title}</h2>
        {href ? (
          <Link href={href} className="flex items-center gap-0.5 text-sm font-bold text-brand-600 hover:text-brand-700">
            {linkLabel}
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          action
        )}
      </div>
      {children}
    </section>
  );
}

/** Emoji plitka (ikonka o‘rnida) */
export function EmojiTile({ emoji, color, size = 48, className }: { emoji: string; color?: string; size?: number; className?: string }) {
  return (
    <div
      className={cn("grid shrink-0 place-items-center rounded-2xl", className)}
      style={{ width: size, height: size, background: color ?? "#e0f2fe", fontSize: size * 0.5 }}
    >
      <span className="leading-none">{emoji}</span>
    </div>
  );
}

export function Avatar({ name, emoji, color = "#0ea5e9", size = 44, src }: { name?: string; emoji?: string; color?: string; size?: number; src?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? ""} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-black text-white"
      style={{ width: size, height: size, background: emoji ? `${color}22` : color, fontSize: emoji ? size * 0.55 : size * 0.36 }}
    >
      {emoji ?? initials(name ?? "?")}
    </div>
  );
}

export function DomainBadge({ domain, className, withLabel = true }: { domain: Domain; className?: string; withLabel?: boolean }) {
  const d = DOMAINS[domain];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold text-ink-2", className)} style={{ background: d.soft }}>
      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
      {withLabel && d.label}
    </span>
  );
}

export function EmptyState({
  emoji = "🌱",
  title,
  text,
  action,
  className,
}: {
  emoji?: string;
  title: string;
  text?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-3xl border border-dashed border-brand-200 bg-white/60 px-6 py-10 text-center", className)}>
      <div className="mb-3 text-5xl">{emoji}</div>
      <div className="text-lg font-extrabold text-ink">{title}</div>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  emoji,
  hint,
  color = "#e0f2fe",
  className,
}: {
  label: string;
  value: React.ReactNode;
  emoji?: string;
  hint?: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-line bg-white p-4 shadow-card print-plain", className)}>
      <div className="flex items-center gap-2 text-[13px] font-bold text-muted">
        {emoji && (
          <span className="grid h-7 w-7 place-items-center rounded-xl text-base" style={{ background: color }}>
            {emoji}
          </span>
        )}
        {label}
      </div>
      <div className="mt-2 text-[26px] font-black leading-none text-ink">{value}</div>
      {hint && <div className="mt-1.5 text-xs font-semibold text-muted">{hint}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-slate-200/70", className)} />;
}

export function LockedOverlay({ title = "Premium imkoniyat", text, compact }: { title?: string; text?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-[#f4f0ff] to-white p-6 text-center ring-1 ring-[#e4dcff]", compact && "p-4")}>
      <div className="mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-[#efeaff] text-[#5b3fe0]">
        <Lock className="h-6 w-6" />
      </div>
      <div className="text-lg font-extrabold text-ink">{title}</div>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      <Button variant="premium" className="mt-4" href="/premium">
        💎 Premium’ni ochish
      </Button>
      <p className="mt-2 text-xs font-semibold text-muted">7 kun bepul sinab ko‘ring</p>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line", className)} />;
}

export function InfoNote({ children, emoji = "💡", className }: { children: React.ReactNode; emoji?: string; className?: string }) {
  return (
    <div className={cn("flex gap-3 rounded-2xl bg-brand-50 p-3.5 text-sm leading-relaxed text-ink-2 ring-1 ring-brand-100", className)}>
      <span className="text-lg leading-none">{emoji}</span>
      <div>{children}</div>
    </div>
  );
}
