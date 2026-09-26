"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ArticleRow, FeaturedArticle, TopicCard } from "@/components/library/article-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { ARTICLES } from "@/data/articles";
import { useChildData } from "@/lib/client/hooks";
import { ARTICLE_TOPICS } from "@/lib/constants";
import type { ArticleTopic } from "@/lib/types";
import { normalizeText } from "@/lib/utils";

const TOPIC_KEYS = Object.keys(ARTICLE_TOPICS) as ArticleTopic[];

function isTopic(v: string | null): v is ArticleTopic {
  return !!v && v in ARTICLE_TOPICS;
}

const MORE = [
  { href: "/videos", emoji: "🎥", title: "Rivojlantiruvchi videolar", text: "Bola bilan birga ko‘riladigan interaktiv darslar" },
  { href: "/community", emoji: "👨‍👩‍👧", title: "Ota-onalar hamjamiyati", text: "Savol bering — mutaxassislar javob beradi" },
  { href: "/ustoz", emoji: "👩‍🏫", title: "Ustoz AI’dan so‘rang", text: "Farzandingiz haqida shaxsiy maslahat oling" },
];

export default function LibraryPage() {
  return (
    <Suspense fallback={<LibrarySkeleton />}>
      <Library />
    </Suspense>
  );
}

function Library() {
  const params = useSearchParams();
  const [topic, setTopic] = useState<ArticleTopic | "all">(() => {
    const t = params.get("topic");
    return isTopic(t) ? t : "all";
  });
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const { activities } = useChildData();

  const readIds = useMemo(() => new Set(activities.filter((a) => a.kind === "article").map((a) => a.refId)), [activities]);

  const sorted = useMemo(() => [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date)), []);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: ARTICLES.length };
    for (const k of TOPIC_KEYS) m[k] = ARTICLES.filter((a) => a.topic === k).length;
    return m;
  }, []);

  const list = useMemo(() => {
    const nq = normalizeText(q);
    return sorted.filter((a) => {
      if (topic !== "all" && a.topic !== topic) return false;
      if (!nq) return true;
      const hay = normalizeText([a.title, a.summary, a.tags.join(" "), a.author, ARTICLE_TOPICS[a.topic].label, a.body].join(" "));
      return hay.includes(nq);
    });
  }, [sorted, topic, q]);

  const searching = q.trim().length > 0;
  const featured = topic === "all" && !searching ? list[0] : undefined;
  const rest = featured ? list.slice(1) : list;

  const choose = (t: ArticleTopic | "all") => setTopic(t === topic ? "all" : t);

  return (
    <div>
      <PageHeader emoji="📚" title="Bilim bazasi" subtitle="O‘zbek tilidagi ishonchli maqolalar va qo‘llanmalar — mutaxassislar tomonidan tayyorlangan" />

      {/* Qidiruv */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-faint" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Qidirish: autizm, nutq, yassi oyoqlik…"
          className="pl-12 pr-11"
          aria-label="Maqolalarni qidirish"
          inputMode="search"
          enterKeyHint="search"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-muted hover:bg-slate-100"
            aria-label="Tozalash"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mavzular */}
      <section className="mt-5">
        <h2 className="mb-3 text-lg font-black text-ink">Mavzular</h2>
        <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0">
          <TopicCard topic="all" count={counts.all} active={topic === "all"} onClick={() => choose("all")} className="w-[142px] shrink-0 snap-start sm:w-auto" />
          {TOPIC_KEYS.map((k) => (
            <TopicCard key={k} topic={k} count={counts[k]} active={topic === k} onClick={() => choose(k)} className="w-[142px] shrink-0 snap-start sm:w-auto" />
          ))}
        </div>
      </section>

      {featured && (
        <section className="mt-7">
          <FeaturedArticle article={featured} read={readIds.has(featured.id)} />
        </section>
      )}

      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-ink">
              {searching ? "Qidiruv natijalari" : topic === "all" ? "Barcha maqolalar" : `${ARTICLE_TOPICS[topic].emoji} ${ARTICLE_TOPICS[topic].label}`}
            </h2>
            <div className="text-[13px] font-semibold text-muted">{list.length} ta maqola</div>
          </div>
          {(topic !== "all" || searching) && (
            <button
              onClick={() => {
                setQ("");
                choose("all");
              }}
              className="flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700"
            >
              <X className="h-4 w-4" />
              Tozalash
            </button>
          )}
        </div>

        {ARTICLES.length === 0 ? (
          <EmptyState emoji="📖" title="Maqolalar tez orada qo‘shiladi" text="Mutaxassislarimiz yangi maqolalar tayyorlamoqda." />
        ) : list.length === 0 ? (
          <EmptyState
            emoji="🔎"
            title="Hech narsa topilmadi"
            text="Boshqa so‘z bilan qidirib ko‘ring yoki boshqa mavzuni tanlang."
            action={
              <Button
                variant="soft"
                onClick={() => {
                  setQ("");
                  choose("all");
                }}
              >
                Barcha maqolalar
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {rest.map((a) => (
              <ArticleRow key={a.id} article={a} read={readIds.has(a.id)} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-black text-ink">Yana nimalar bor</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MORE.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center gap-3 rounded-3xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-2xl">{m.emoji}</span>
              <span className="min-w-0">
                <span className="block text-[15px] font-extrabold text-ink">{m.title}</span>
                <span className="block text-[13px] leading-snug text-muted">{m.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <div>
      <PageHeader emoji="📚" title="Bilim bazasi" subtitle="Yuklanmoqda…" />
      <Skeleton className="h-12 w-full" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
