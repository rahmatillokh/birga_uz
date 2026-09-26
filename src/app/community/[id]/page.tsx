"use client";

import { BadgeCheck, Bell, BellRing, ChevronRight, MessageCircle, Pin, Send, Share2, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { authorMeta, avatarName, efirSchedule, groupOf, KIND_META, useCommunityPosts } from "@/components/community/data";
import { useCommunityLocal } from "@/components/community/local";
import { AuthorLine, KindBadge, LikeButton, PostCard } from "@/components/community/post-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/form";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/misc";
import { useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { ActResult, CommunityPost, PostAnswer } from "@/lib/types";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

export default function CommunityPostPage() {
  const params = useParams<{ id: string | string[] }>();
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = decodeURIComponent(raw ?? "");
  const posts = useCommunityPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) return <NotFound />;
  return <PostView key={post.id} post={post} all={posts} />;
}

function PostView({ post, all }: { post: CommunityPost; all: CommunityPost[] }) {
  const { user } = useView();
  const act = useApp((s) => s.act);
  const group = groupOf(post.groupId);
  const kind = KIND_META[post.kind];
  const isEfir = post.kind === "efir";
  const sch = isEfir ? efirSchedule(post) : undefined;
  const reminded = useCommunityLocal((s) => !!s.reminders[post.id]);
  const toggleReminder = useCommunityLocal((s) => s.toggleReminder);

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const shownAs = user.consents.community ? user.name || "Ota-ona" : "Anonim ota-ona";

  // Mutaxassis javoblari birinchi, qolganlari vaqt bo‘yicha
  const answers = useMemo(
    () => [...post.answers].sort((a, b) => Number(b.role === "mutaxassis") - Number(a.role === "mutaxassis") || a.at.localeCompare(b.at)),
    [post.answers],
  );

  const related = useMemo(
    () =>
      all
        .filter((p) => p.id !== post.id && p.kind !== "efir")
        .map((p) => ({
          p,
          score: (p.groupId === post.groupId ? 2 : 0) + p.tags.filter((t) => post.tags.includes(t)).length * 2 + (p.kind === post.kind ? 1 : 0),
        }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || b.p.at.localeCompare(a.p.at))
        .slice(0, 3)
        .map((x) => x.p),
    [all, post],
  );

  // #javoblar bilan kelinganda — javoblarga aylantirish
  useEffect(() => {
    if (window.location.hash !== "#javoblar") return;
    const t = setTimeout(() => document.getElementById("javoblar")?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    return () => clearTimeout(t);
  }, []);

  const submit = async () => {
    const body = text.trim();
    if (body.length < 3) {
      toast.error("Javob matnini yozing");
      return;
    }
    setBusy(true);
    let res: ActResult;
    try {
      res = await act({ type: "post.answer", postId: post.id, text: body }, { silent: true });
    } catch {
      res = { ok: false, error: "Internet aloqasini tekshirib, qayta urinib ko‘ring" };
    }
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "Yuborib bo‘lmadi");
      return;
    }
    setText("");
    haptic("success");
    toast.success(isEfir ? "Savolingiz efir uchun qabul qilindi" : "Javobingiz qo‘shildi. Rahmat!", "💬");
  };

  const share = async () => {
    const url = window.location.href.split("#")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Havola nusxalandi", "🔗");
    } catch {
      /* bekor qilindi */
    }
  };

  return (
    <div>
      <PageHeader back="/community" emoji={kind.emoji} title={kind.label} subtitle={group ? `${group.emoji} ${group.name}` : "Ota-onalar hamjamiyati"} />

      <div className="mx-auto max-w-3xl">
        {/* Post */}
        <Card className={cn("p-4 sm:p-6", post.pinned && "border-brand-200 ring-1 ring-brand-100")}>
          <AuthorLine post={post} size={46} />
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <KindBadge kind={post.kind} />
            {post.pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-extrabold text-brand-700 ring-1 ring-brand-100">
                <Pin className="h-3 w-3" /> Muhim
              </span>
            )}
          </div>
          <h1 className="mt-2 text-[22px] font-black leading-tight text-ink sm:text-[27px]">{post.title}</h1>
          <p className="mt-3 whitespace-pre-line text-[16px] leading-[1.7] text-ink-2">{post.text}</p>

          {isEfir && sch && (
            <div
              className={cn(
                "mt-4 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center",
                sch.live ? "bg-[#e5484d] text-white" : "bg-[#fff5f5] ring-1 ring-[#f6caca]",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className={cn("text-xs font-extrabold uppercase tracking-wide", sch.live ? "text-white/85" : "text-[#b42323]")}>
                  {sch.live ? "🔴 Hozir efirda" : "🎙️ Jonli efir"}
                  {sch.recurring ? " · har hafta" : ""}
                </div>
                <div className={cn("mt-0.5 text-[17px] font-black", sch.live ? "text-white" : "text-ink")}>
                  📅 {sch.dateLabel}, {sch.time}
                </div>
                <div className={cn("text-sm", sch.live ? "text-white/85" : "text-muted")}>YuniQo Telegram kanalida · bepul</div>
              </div>
              {!sch.live && (
                <Button
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
            </div>
          )}

          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-ink-2">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-line pt-3">
            <LikeButton post={post} />
            <a href="#javoblar" className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-ink-2 transition hover:bg-slate-100">
              <MessageCircle className="h-4 w-4" />
              {post.answers.length} {isEfir ? "savol" : "javob"}
            </a>
            <button onClick={share} className="ml-auto flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-ink-2 transition hover:bg-slate-100">
              <Share2 className="h-4 w-4" />
              Ulashish
            </button>
          </div>
        </Card>

        {/* Javoblar */}
        <section id="javoblar" className="mt-6 scroll-mt-24">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-ink">
            {isEfir ? "Efir uchun savollar" : "Javoblar"}
            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-extrabold text-ink-2">{post.answers.length}</span>
          </h2>
          {answers.length === 0 ? (
            <EmptyState
              emoji={isEfir ? "🎙️" : "💬"}
              title={isEfir ? "Hali savollar yo‘q" : "Hali javoblar yo‘q"}
              text={isEfir ? "Birinchi bo‘lib savol qoldiring — mutaxassis efirda javob beradi." : "Mutaxassislar tez orada javob beradi. Tajribangiz bo‘lsa — ulashing!"}
            />
          ) : (
            <div className="space-y-3">
              {answers.map((a) => (
                <AnswerCard key={a.id} answer={a} />
              ))}
            </div>
          )}

          {/* Javob yozish */}
          <Card className="mt-4 p-4 sm:p-5">
            <div className="mb-2.5 flex items-center gap-2.5">
              <Avatar name={user.name || "Ota-ona"} size={34} />
              <div className="min-w-0 text-sm">
                <div className="font-extrabold text-ink">{isEfir ? "Savol qoldirish" : "Javob yozish"}</div>
                <div className="truncate text-xs font-semibold text-muted">«{shownAs}» nomidan</div>
              </div>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={1500}
              placeholder={isEfir ? "Efirda qaysi savolga javob olmoqchisiz?" : "Tajribangiz yoki maslahatingizni yozing…"}
              aria-label={isEfir ? "Savol matni" : "Javob matni"}
            />
            <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              <p className="flex-1 text-xs leading-snug text-muted">
                🔒 Shaxsiy ma’lumotlar va bolalar suratlarini joylamang. Tibbiy tashxis qo‘ymang — mutaxassisga yo‘naltiring.
              </p>
              <Button onClick={submit} loading={busy} disabled={!text.trim()}>
                {!busy && <Send className="h-4 w-4" />}
                Yuborish
              </Button>
            </div>
          </Card>
        </section>

        {related.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black text-ink">O‘xshash muhokamalar</h2>
              <Link href="/community" className="flex items-center gap-0.5 text-sm font-bold text-brand-600 hover:text-brand-700">
                Barchasi <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AnswerCard({ answer }: { answer: PostAnswer }) {
  const { sp, specialty, color } = authorMeta(answer);
  const helpful = useCommunityLocal((s) => !!s.helpful[answer.id]);
  const toggleHelpful = useCommunityLocal((s) => s.toggleHelpful);
  const isSp = answer.role === "mutaxassis";
  const isMod = answer.role === "moderator";
  return (
    <div
      className={cn(
        "rounded-3xl border p-4 shadow-card sm:p-5",
        isSp ? "border-[#bfe8d6] bg-[#f3fbf7]" : isMod ? "border-brand-100 bg-brand-50/60" : "border-line bg-white",
      )}
    >
      {isSp && (
        <div className="mb-3 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#0b7a52]">
          <BadgeCheck className="h-4 w-4" /> Tasdiqlangan mutaxassis javobi
        </div>
      )}
      <div className="flex items-start gap-3">
        <Avatar name={avatarName(answer.author)} color={color} size={40} emoji={isMod ? "🛡️" : undefined} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {sp ? (
              <Link href={`/specialists/${sp.id}`} className="text-[15px] font-extrabold text-ink hover:text-brand-700">
                {answer.author}
              </Link>
            ) : (
              <span className="text-[15px] font-extrabold text-ink">{answer.author}</span>
            )}
            {isSp && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-[#0b7a52] ring-1 ring-[#bfe8d6]">
                ✔️ Tasdiqlangan mutaxassis
              </span>
            )}
            {isMod && <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-brand-700 ring-1 ring-brand-100">🛡️ Moderator</span>}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-muted">
            {specialty ? `${specialty} · ` : ""}
            {timeAgo(answer.at)}
          </div>
          <p className="mt-2.5 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{answer.text}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={helpful}
              onClick={() => {
                haptic("select");
                toggleHelpful(answer.id);
              }}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-bold transition active:scale-95",
                helpful ? "bg-brand-50 text-brand-700" : "text-ink-2 hover:bg-slate-100",
              )}
            >
              <ThumbsUp className={cn("h-3.5 w-3.5", helpful && "fill-current")} />
              Foydali · {formatNumber(answer.likes + (helpful ? 1 : 0))}
            </button>
            {sp && (
              <Link href={`/specialists/${sp.id}`} className="flex h-8 items-center gap-1 rounded-xl px-2.5 text-[13px] font-bold text-brand-600 hover:bg-brand-50">
                Profil va qabulga yozilish <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div>
      <PageHeader back="/community" emoji="👨‍👩‍👧" title="Post topilmadi" subtitle="Ota-onalar hamjamiyati" />
      <EmptyState
        emoji="🗨️"
        title="Bunday post yo‘q"
        text="Post o‘chirilgan yoki havola noto‘g‘ri bo‘lishi mumkin."
        action={<Button href="/community">Hamjamiyatga qaytish</Button>}
      />
    </div>
  );
}
