"use client";

import { BadgeCheck, ChevronRight, Clock, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArticleRow, tint } from "@/components/library/article-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { Avatar, EmojiTile, EmptyState, PageHeader } from "@/components/ui/misc";
import { ARTICLES, getArticle } from "@/data/articles";
import { getSpecialist } from "@/data/specialists";
import { useChildData } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import { ARTICLE_TOPICS } from "@/lib/constants";
import type { Article } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export default function ArticlePage() {
  const params = useParams<{ id: string | string[] }>();
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  const article = getArticle(decodeURIComponent(raw ?? ""));
  if (!article) return <NotFound />;
  return <ArticleView key={article.id} article={article} />;
}

function ArticleView({ article }: { article: Article }) {
  const t = ARTICLE_TOPICS[article.topic];
  const sp = getSpecialist(article.authorId);
  const authorName = sp?.name ?? article.author;
  const act = useApp((s) => s.act);
  const { child, activities } = useChildData();
  const readBefore = useMemo(() => activities.some((a) => a.kind === "article" && a.refId === article.id), [activities, article.id]);

  const [done, setDone] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [progress, setProgress] = useState(0);
  const loggedRef = useRef(false);
  const articleRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  /** Bir marta: oxirigacha o‘qilganda yoki "O‘qib chiqdim" bosilganda */
  const markRead = useCallback(
    async (manual: boolean) => {
      if (loggedRef.current) {
        if (manual) toast.info("Bu maqola o‘qilgan deb belgilangan", "📘");
        return;
      }
      loggedRef.current = true;
      setDone(true);
      if (manual) {
        haptic("success");
        toast.success("Ajoyib! Maqola o‘qilganlar ro‘yxatiga qo‘shildi", "✅");
      }
      if (child) {
        try {
          await act(
            { type: "activity.log", childId: child.id, kind: "article", refId: article.id, title: article.title, domain: "kognitiv" },
            { silent: true },
          );
        } catch {
          /* tarmoq xatosi — o‘qish tajribasiga xalaqit bermaydi */
        }
      }
    },
    [act, article.id, article.title, child],
  );

  // Oxiriga yetib kelganda (kamida bir necha soniya o‘qigandan keyin) avtomatik belgilash
  useEffect(() => {
    const el = endRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const start = Date.now();
    const minMs = Math.min(20_000, Math.max(6_000, article.readMin * 4_000));
    let timer: ReturnType<typeof setTimeout> | undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (timer) clearTimeout(timer);
        timer = undefined;
        if (!entry.isIntersecting) return;
        timer = setTimeout(() => void markRead(false), Math.max(0, minMs - (Date.now() - start)));
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [markRead, article.readMin]);

  // O‘qish jarayoni chizig‘i
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.7;
      setProgress(total > 0 ? Math.min(1, Math.max(0, (80 - rect.top) / total)) : 1);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const related = useMemo(
    () =>
      ARTICLES.filter((a) => a.id !== article.id)
        .map((a) => ({
          a,
          score: (a.topic === article.topic ? 3 : 0) + a.tags.filter((tg) => article.tags.includes(tg)).length + (a.authorId && a.authorId === article.authorId ? 1 : 0),
        }))
        .filter((x) => x.score > 0)
        .sort((x, y) => y.score - x.score || y.a.date.localeCompare(x.a.date))
        .slice(0, 3)
        .map((x) => x.a),
    [article],
  );

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: article.title, text: article.summary, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Havola nusxalandi", "🔗");
    } catch {
      /* foydalanuvchi bekor qildi */
    }
  };

  const castVote = (v: "up" | "down") => {
    haptic("select");
    setVote(v);
    if (v === "up") toast.success("Rahmat! Fikringiz biz uchun muhim", "💙");
    else toast.info("Rahmat! Maqolani yanada yaxshilashga harakat qilamiz", "📝");
  };

  const read = done || readBefore;

  return (
    <div>
      {/* O‘qish jarayoni */}
      <div className="no-print pointer-events-none fixed inset-x-0 top-0 z-50 h-1 lg:left-[272px]" aria-hidden>
        <div className="h-full rounded-r-full bg-brand-gradient transition-[width] duration-150 ease-out" style={{ width: `${progress * 100}%` }} />
      </div>

      <PageHeader
        back="/library"
        emoji="📚"
        title="Bilim bazasi"
        subtitle={`${t.emoji} ${t.label}`}
        actions={
          <button
            onClick={share}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-line bg-white text-ink-2 transition hover:border-brand-200 hover:bg-brand-50"
            aria-label="Ulashish"
          >
            <Share2 className="h-[18px] w-[18px]" />
          </button>
        }
      />

      <article ref={articleRef} className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/library?topic=${article.topic}`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-extrabold text-ink transition hover:brightness-95"
            style={{ background: tint(t.color, 0.14) }}
          >
            <span>{t.emoji}</span>
            {t.label}
          </Link>
          {read && <span className="rounded-full bg-[#e3f6ef] px-2.5 py-1 text-[12px] font-extrabold text-[#0b7a52]">✓ O‘qilgan</span>}
        </div>

        <div className="mt-4 flex items-start gap-4">
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl text-[34px] sm:h-20 sm:w-20 sm:text-[44px]"
            style={{ background: tint(t.color, 0.14) }}
            aria-hidden
          >
            {article.emoji}
          </div>
          <h1 className="text-[25px] font-black leading-[1.15] text-ink sm:text-[34px]">{article.title}</h1>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px] font-semibold text-muted">
          <span className="inline-flex items-center gap-2">
            <Avatar name={authorName} color={sp?.color ?? "#0ea5e9"} size={30} />
            <span className="font-bold text-ink-2">{authorName}</span>
            {sp?.verified && <BadgeCheck className="h-4 w-4 text-brand-500" aria-label="Tasdiqlangan mutaxassis" />}
          </span>
          <span>📅 {formatDate(article.date, { year: true })}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {article.readMin} daqiqa o‘qish
          </span>
        </div>

        <p
          className="mt-6 rounded-2xl border-l-4 bg-white px-4 py-3.5 text-[17px] font-semibold leading-relaxed text-ink shadow-card sm:px-5"
          style={{ borderLeftColor: t.color }}
        >
          {article.summary}
        </p>

        <Markdown
          text={article.body}
          className="mt-7 space-y-4 text-[17px] text-ink-2 [&_h3]:pt-4 [&_h3]:text-[21px] [&_h3]:leading-snug [&_li]:leading-[1.7] [&_ol]:space-y-2 [&_p]:leading-[1.8] [&_ul]:space-y-2"
        />

        {/* Ogohlantirish */}
        <div className="mt-8 flex gap-3 rounded-2xl bg-[#fff8e6] p-4 text-[14.5px] leading-relaxed text-ink-2 ring-1 ring-[#fde3a7]">
          <span className="text-xl leading-none">🩺</span>
          <div>
            <span className="font-extrabold text-ink">Maqola mutaxassis maslahatini almashtirmaydi.</span> Farzandingiz holati bo‘yicha savollaringiz bo‘lsa,
            logoped, defektolog yoki pediatr bilan maslahatlashing.{" "}
            <Link href="/specialists" className="font-bold text-brand-700 underline decoration-brand-300 underline-offset-2">
              Mutaxassis topish
            </Link>
          </div>
        </div>

        {article.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {article.tags.map((tg) => (
              <Link
                key={tg}
                href={`/library?q=${encodeURIComponent(tg)}`}
                className="rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-ink-2 ring-1 ring-line transition hover:bg-brand-50 hover:ring-brand-200"
              >
                #{tg}
              </Link>
            ))}
          </div>
        )}

        {/* Maqola oxiri */}
        <div ref={endRef} className="mt-8 rounded-3xl border border-line bg-white p-5 text-center shadow-card sm:p-6">
          {done ? (
            <div className="animate-fade-up">
              <div className="text-4xl">✅</div>
              <div className="mt-2 text-lg font-black text-ink">Maqola o‘qildi!</div>
              <p className="mt-1 text-sm text-muted">Bilimga sarflangan har bir daqiqa — farzandingiz rivoji uchun katta qadam.</p>
            </div>
          ) : (
            <>
              <div className="text-[15px] font-bold text-ink-2">Maqolani oxirigacha o‘qidingizmi?</div>
              <Button className="mt-3" size="lg" onClick={() => void markRead(true)}>
                O‘qib chiqdim ✅
              </Button>
            </>
          )}
          <div className="my-5 h-px bg-line" />
          <div className="text-[15px] font-extrabold text-ink">Foydali bo‘ldimi?</div>
          <div className="mt-3 flex justify-center gap-3">
            <VoteButton active={vote === "up"} onClick={() => castVote("up")} emoji="👍" label="Ha, foydali" />
            <VoteButton active={vote === "down"} onClick={() => castVote("down")} emoji="👎" label="Unchalik emas" />
          </div>
          {vote && <p className="mt-3 animate-fade-up text-xs font-semibold text-muted">Fikringiz uchun rahmat!</p>}
        </div>

        {/* Muallif */}
        {sp ? (
          <Card href={`/specialists/${sp.id}`} className="mt-4 flex items-center gap-4 p-4">
            <Avatar name={sp.name} color={sp.color} size={56} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-muted">Muallif</div>
              <div className="flex items-center gap-1.5 text-[16px] font-extrabold text-ink">
                <span className="truncate">{sp.name}</span>
                {sp.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" />}
              </div>
              <div className="truncate text-sm text-muted">
                {sp.title} · {sp.experienceYears} yil tajriba
              </div>
            </div>
            <span className="hidden text-sm font-bold text-brand-600 sm:block">Profil</span>
            <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
          </Card>
        ) : (
          <Card className="mt-4 flex items-center gap-4 p-4">
            <EmojiTile emoji="📝" size={56} />
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-muted">Muallif</div>
              <div className="text-[16px] font-extrabold text-ink">{article.author}</div>
              <div className="text-sm leading-snug text-muted">Maqolalar mutaxassislar bilan hamkorlikda tayyorlanadi va tekshiriladi.</div>
            </div>
          </Card>
        )}

        {/* Savol qoldimi */}
        <div className="mt-4 flex flex-col items-start gap-3 rounded-3xl bg-brand-50 p-5 ring-1 ring-brand-100 sm:flex-row sm:items-center">
          <div className="text-3xl">💬</div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold text-ink">Savolingiz qoldimi?</div>
            <div className="text-sm text-ink-2">Hamjamiyatda so‘rang — tasdiqlangan mutaxassislar javob beradi.</div>
          </div>
          <Button href="/community" variant="primary" size="sm">
            Savol berish
          </Button>
        </div>

        {related.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-black text-ink">Shu mavzuda yana</h2>
            <div className={cn("grid grid-cols-1 gap-3")}>
              {related.map((a) => (
                <ArticleRow key={a.id} article={a} read={activities.some((x) => x.kind === "article" && x.refId === a.id)} />
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

function VoteButton({ active, onClick, emoji, label }: { active: boolean; onClick: () => void; emoji: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-12 items-center gap-2 rounded-2xl border px-4 text-sm font-bold transition active:scale-[0.97]",
        active ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100" : "border-line bg-white text-ink-2 hover:border-brand-200",
      )}
    >
      <span className={cn("text-xl transition", active && "animate-pop")}>{emoji}</span>
      {label}
    </button>
  );
}

function NotFound() {
  return (
    <div>
      <PageHeader back="/library" emoji="📚" title="Maqola topilmadi" subtitle="Bilim bazasi" />
      <EmptyState
        emoji="📖"
        title="Bunday maqola yo‘q"
        text="Maqola o‘chirilgan yoki havola noto‘g‘ri bo‘lishi mumkin."
        action={<Button href="/library">Bilim bazasiga qaytish</Button>}
      />
    </div>
  );
}
