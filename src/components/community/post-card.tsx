"use client";

import { BadgeCheck, Bell, BellRing, MessageCircle, Pin, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { CommunityPost } from "@/lib/types";
import { cn, formatNumber, timeAgo } from "@/lib/utils";
import { authorMeta, avatarName, efirSchedule, groupOf, KIND_META, type PostKind } from "./data";
import { useCommunityLocal } from "./local";

export function KindBadge({ kind, className }: { kind: PostKind; className?: string }) {
  const k = KIND_META[kind];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-extrabold ring-1", k.cls, className)}>
      <span>{k.emoji}</span>
      {k.label}
    </span>
  );
}

export function RoleBadge({ role, specialty }: { role: CommunityPost["role"]; specialty?: string }) {
  if (role === "mutaxassis") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#e3f6ef] px-2 py-0.5 text-[11px] font-extrabold text-[#0b7a52]">
        <BadgeCheck className="h-3.5 w-3.5" />
        Mutaxassis{specialty ? ` · ${specialty}` : ""}
      </span>
    );
  }
  if (role === "moderator") {
    return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-extrabold text-brand-700">🛡️ Moderator</span>;
  }
  return null;
}

/** Muallif, roli, guruhi va vaqti */
export function AuthorLine({ post, size = 42 }: { post: CommunityPost; size?: number }) {
  const { user } = useView();
  const { specialty, color } = authorMeta(post);
  const group = groupOf(post.groupId);
  const mine = !!post.authorUid && post.authorUid === user.uid;
  return (
    <div className="flex items-start gap-3">
      <Avatar name={avatarName(post.author)} color={color} size={size} emoji={post.role === "moderator" ? "🛡️" : undefined} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className="text-[15px] font-extrabold leading-tight text-ink">{post.author}</span>
          <RoleBadge role={post.role} specialty={specialty} />
          {mine && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-ink-2">Siz</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs font-semibold text-muted">
          {group && (
            <span className="truncate">
              {group.emoji} {group.name}
            </span>
          )}
          {group && <span aria-hidden>·</span>}
          <span className="whitespace-nowrap">{timeAgo(post.at)}</span>
        </div>
      </div>
    </div>
  );
}

/** 👍 — bir marta bosiladi (qurilmada eslab qolinadi) */
export function LikeButton({ post, className }: { post: CommunityPost; className?: string }) {
  const liked = useCommunityLocal((s) => !!s.liked[post.id]);
  const like = useCommunityLocal((s) => s.like);
  const act = useApp((s) => s.act);
  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "Yoqtirilgan" : "Yoqtirish"}
      onClick={() => {
        haptic(liked ? "light" : "success");
        if (liked) return;
        like(post.id);
        act({ type: "post.like", postId: post.id }, { silent: true }).catch(() => {});
      }}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition active:scale-95",
        liked ? "bg-brand-50 text-brand-700" : "text-ink-2 hover:bg-slate-100",
        className,
      )}
    >
      <ThumbsUp className={cn("h-4 w-4 transition", liked && "animate-pop fill-current")} />
      <span className="tabular">{formatNumber(post.likes)}</span>
    </button>
  );
}

/** Lenta / savol-javob uchun post kartasi */
export function PostCard({ post, highlight, className }: { post: CommunityPost; highlight?: boolean; className?: string }) {
  const specialistAnswered = post.answers.some((a) => a.role === "mutaxassis");
  const href = `/community/${post.id}`;
  return (
    <article
      id={`post-${post.id}`}
      className={cn(
        "scroll-mt-24 rounded-3xl border bg-white p-4 shadow-card transition hover:border-brand-200 sm:p-5",
        post.pinned ? "border-brand-200 ring-1 ring-brand-100" : "border-line",
        highlight && "animate-fade-up border-brand-300 ring-4 ring-brand-100",
        className,
      )}
    >
      <AuthorLine post={post} />
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <KindBadge kind={post.kind} />
        {post.pinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-extrabold text-brand-700 ring-1 ring-brand-100">
            <Pin className="h-3 w-3" /> Muhim
          </span>
        )}
      </div>
      <Link href={href} className="group mt-2 block">
        <h3 className="text-[16.5px] font-black leading-snug text-ink transition group-hover:text-brand-700">{post.title}</h3>
        <p className="mt-1.5 line-clamp-4 whitespace-pre-line text-[14.5px] leading-relaxed text-ink-2">{post.text}</p>
      </Link>
      {post.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {post.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-ink-2">
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-line pt-2.5">
        <LikeButton post={post} />
        <Link href={`${href}#javoblar`} className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-ink-2 transition hover:bg-slate-100">
          <MessageCircle className="h-4 w-4" />
          {post.answers.length} {post.kind === "efir" ? "savol" : "javob"}
        </Link>
        {specialistAnswered && (
          <span className="ml-auto inline-flex items-center gap-1 pr-1 text-xs font-extrabold text-[#0b7a52]">
            <BadgeCheck className="h-4 w-4" /> Mutaxassis javob bergan
          </span>
        )}
      </div>
    </article>
  );
}

/** "Jonli efir: autizm …" -> "Autizm …" */
export function efirTitle(title: string): string {
  const t = title.replace(/^jonli efir:\s*/i, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Jonli efir (mutaxassis bilan ochiq savol-javob) kartasi */
export function EfirCard({ post, className }: { post: CommunityPost; className?: string }) {
  const sch = efirSchedule(post);
  const { sp, specialty, color } = authorMeta(post);
  const reminded = useCommunityLocal((s) => !!s.reminders[post.id]);
  const toggleReminder = useCommunityLocal((s) => s.toggleReminder);
  const href = `/community/${post.id}`;
  return (
    <article className={cn("overflow-hidden rounded-3xl border bg-white shadow-card", sch.live ? "border-[#f6caca] ring-2 ring-[#fde2e2]" : "border-line", className)}>
      <div className="flex gap-4 p-4 sm:p-5">
        <div
          className={cn(
            "flex w-[68px] shrink-0 flex-col items-center justify-center rounded-2xl py-2.5 text-center",
            sch.live ? "bg-[#e5484d] text-white" : "bg-[#fff1f1] text-[#b42323]",
          )}
        >
          <span className="text-[11px] font-extrabold uppercase tracking-wide">{sch.monthShort}</span>
          <span className="text-[28px] font-black leading-none">{sch.day}</span>
          <span className="mt-1 text-[12px] font-extrabold tabular">{sch.time}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {sch.live ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5484d] px-2.5 py-0.5 text-xs font-extrabold text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Hozir efirda
              </span>
            ) : (
              <KindBadge kind="efir" />
            )}
            {sch.recurring && <span className="text-xs font-bold text-muted">🔁 Har hafta</span>}
          </div>
          <Link href={href} className="group mt-1.5 block">
            <h3 className="text-[16px] font-black leading-snug text-ink transition group-hover:text-brand-700">{efirTitle(post.title)}</h3>
          </Link>
          <div className="mt-1 text-[13px] font-bold text-ink-2">
            📅 {sch.dateLabel}, {sch.time} · YuniQo Telegram kanali
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <Avatar name={avatarName(post.author)} color={color} size={30} />
            <div className="min-w-0 text-[13px] leading-tight">
              <div className="flex items-center gap-1 font-extrabold text-ink">
                <span className="truncate">{post.author}</span>
                {sp?.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-label="Tasdiqlangan" />}
              </div>
              <div className="truncate text-muted">{specialty ?? "Mutaxassis"}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas/60 px-4 py-3 sm:px-5">
        {sch.live ? (
          <Button size="sm" variant="dark" href={`${href}#javoblar`}>
            🔴 Savol yuborish
          </Button>
        ) : (
          <Button
            size="sm"
            variant={reminded ? "soft" : "primary"}
            onClick={() => {
              const on = toggleReminder(post.id);
              haptic(on ? "success" : "light");
              if (on) toast.success(`Eslatma qo‘yildi: ${sch.dateLabel.toLowerCase()}, ${sch.time}. Efir oldidan xabar beramiz`, "🔔");
              else toast.info("Eslatma bekor qilindi", "🔕");
            }}
          >
            {reminded ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {reminded ? "Eslatma qo‘yilgan" : "Eslatma qo‘yish"}
          </Button>
        )}
        <Button size="sm" variant="secondary" href={`${href}#javoblar`}>
          <MessageCircle className="h-4 w-4" />
          Savollar · {post.answers.length}
        </Button>
      </div>
    </article>
  );
}
