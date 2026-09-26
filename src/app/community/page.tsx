"use client";

import { BadgeCheck, ChevronDown, PenLine, Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AskSheet } from "@/components/community/ask-sheet";
import { COMMUNITY_RULES, efirSchedule, groupOf, isMyRegionGroup, useCommunityPosts, type PostKind } from "@/components/community/data";
import { GroupCard } from "@/components/community/groups";
import { useCommunityLocal } from "@/components/community/local";
import { EfirCard, PostCard } from "@/components/community/post-card";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { Avatar, EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { Chips } from "@/components/ui/tabs";
import { ARTICLES } from "@/data/articles";
import { GROUPS } from "@/data/community";
import { regionName } from "@/data/regions";
import { SPECIALISTS } from "@/data/specialists";
import { useView } from "@/lib/client/hooks";
import { haptic } from "@/lib/client/telegram";
import { SPECIALTIES } from "@/lib/constants";
import type { CommunityPost } from "@/lib/types";
import { cn, formatNumber, normalizeText } from "@/lib/utils";

type Tab = "lenta" | "guruhlar" | "savollar" | "efirlar";

const TABS: { value: Tab; label: string; emoji: string }[] = [
  { value: "lenta", label: "Lenta", emoji: "📰" },
  { value: "guruhlar", label: "Guruhlar", emoji: "👥" },
  { value: "savollar", label: "Savol-javob", emoji: "❓" },
  { value: "efirlar", label: "Efirlar", emoji: "🎙️" },
];

function parseTab(v: string | null): Tab {
  if (!v) return "lenta";
  if (v.startsWith("guruh")) return "guruhlar";
  if (v.startsWith("savol")) return "savollar";
  if (v.startsWith("efir")) return "efirlar";
  return "lenta";
}

const hasSpecialistAnswer = (p: CommunityPost) => p.answers.some((a) => a.role === "mutaxassis");

export default function CommunityPage() {
  return (
    <Suspense fallback={<CommunitySkeleton />}>
      <Community />
    </Suspense>
  );
}

function Community() {
  const params = useSearchParams();
  const { user } = useView();
  const posts = useCommunityPosts();
  const joined = useCommunityLocal((s) => s.joined);

  const [tab, setTab] = useState<Tab>(() => parseTab(params.get("tab")));
  const [group, setGroup] = useState<string | null>(() => {
    const g = params.get("group");
    return g && groupOf(g) ? g : null;
  });
  const [kindFilter, setKindFilter] = useState<"all" | Exclude<PostKind, "efir">>("all");
  const [qaFilter, setQaFilter] = useState<"all" | "answered" | "waiting">("all");
  const [q, setQ] = useState("");
  const [ask, setAsk] = useState<{ groupId?: string } | null>(null);
  const [freshId, setFreshId] = useState<string | undefined>();

  const nq = normalizeText(q);
  const matches = (p: CommunityPost) => !nq || normalizeText(`${p.title} ${p.text} ${p.tags.join(" ")} ${p.author}`).includes(nq);

  const feed = posts.filter((p) => (!group || p.groupId === group) && (kindFilter === "all" || p.kind === kindFilter) && matches(p));
  const questions = posts.filter(
    (p) => p.kind === "savol" && matches(p) && (qaFilter === "all" || (qaFilter === "answered" ? hasSpecialistAnswer(p) : !hasSpecialistAnswer(p))),
  );
  const efirs = useMemo(
    () =>
      posts
        .filter((p) => p.kind === "efir")
        .map((p) => ({ p, s: efirSchedule(p) }))
        .sort((a, b) => Number(b.s.live) - Number(a.s.live) || a.s.start - b.s.start),
    [posts],
  );
  const liveNow = efirs.some((e) => e.s.live);

  const postCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of posts) m[p.groupId] = (m[p.groupId] ?? 0) + 1;
    return m;
  }, [posts]);

  const myRegion = regionName(user.region);
  const totalMembers = GROUPS.reduce((s, g) => s + g.members, 0) + Object.keys(joined).length;
  const verified = SPECIALISTS.filter((s) => s.verified);
  const selectedGroup = group ? groupOf(group) : undefined;

  const openGroup = (id: string) => {
    haptic("select");
    setGroup(id);
    setKindFilter("all");
    setTab("lenta");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showSearch = tab === "lenta" || tab === "savollar";

  return (
    <div>
      <PageHeader
        emoji="👨‍👩‍👧"
        title="Ota-onalar hamjamiyati"
        subtitle="Tajriba almashing, savol bering — tasdiqlangan mutaxassislar javob beradi"
        actions={
          <Button className="hidden sm:inline-flex" onClick={() => setAsk({ groupId: group ?? undefined })}>
            <PenLine className="h-4 w-4" />
            Savol berish
          </Button>
        }
      />

      {/* Tanishtiruv va qoidalar */}
      <section className="relative overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-[#fdf2f8] via-white to-[#eef6ff] p-4 shadow-card sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#e87ba4]/10" />
        <div className="relative flex items-start gap-4">
          <div className="hidden text-5xl sm:block">🤗</div>
          <div className="min-w-0">
            <h2 className="text-[19px] font-black text-ink sm:text-[22px]">Siz yolg‘iz emassiz</h2>
            <p className="mt-1 text-[14.5px] leading-relaxed text-ink-2">
              Minglab ota-onalar tajriba almashadi, tasdiqlangan mutaxassislar esa savollaringizga javob beradi.
            </p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <Stat value={formatNumber(totalMembers)} label="a’zo" />
          <Stat value={String(verified.length)} label="mutaxassis ✔️" />
          <Stat value={String(posts.length)} label="muhokama" />
        </div>
        <div className="relative mt-3 flex flex-wrap gap-2 sm:grid sm:grid-cols-3">
          <Rule emoji="🛡️" title="Moderatsiya" text="Har bir post moderator tomonidan tekshiriladi" />
          <Rule emoji="✅" title="Ishonchli ma’lumot" text="Tibbiy maslahatlarni mutaxassislar tasdiqlaydi" />
          <Rule emoji="✔️" title="Tasdiqlangan mutaxassislar" text="Diplom va sertifikatlari tekshirilgan" />
        </div>
        <details className="group relative mt-3">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-xl py-1 text-sm font-bold text-brand-700 [&::-webkit-details-marker]:hidden">
            📜 Hamjamiyat qoidalari
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </summary>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-ink-2 marker:font-bold marker:text-brand-500">
            {COMMUNITY_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </details>
      </section>

      {/* Tablar */}
      <div role="tablist" className="mt-5 grid grid-cols-4 gap-1 rounded-2xl bg-slate-100/80 p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => {
              haptic("select");
              setTab(t.value);
            }}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[12px] font-extrabold transition sm:flex-row sm:gap-2 sm:py-2.5 sm:text-sm",
              tab === t.value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            <span className="text-lg leading-none sm:text-base">{t.emoji}</span>
            <span className="whitespace-nowrap">{t.label}</span>
            {t.value === "efirlar" && liveNow && <span className="absolute right-2 top-1.5 h-2 w-2 animate-pulse rounded-full bg-[#e5484d]" />}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-3">
          {showSearch && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-faint" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Postlarni qidirish: nutq, bog‘cha, uyqu…"
                className="pl-12 pr-11"
                aria-label="Postlarni qidirish"
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
          )}

          {/* ------------------------------------------------ Lenta */}
          {tab === "lenta" && (
            <>
              <Composer name={user.name} onOpen={() => setAsk({ groupId: group ?? undefined })} />
              {selectedGroup && (
                <div className="flex items-center gap-3 rounded-2xl bg-brand-50 px-3.5 py-2.5 ring-1 ring-brand-100">
                  <span className="text-2xl">{selectedGroup.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-extrabold text-ink">{selectedGroup.name}</div>
                    <div className="text-xs font-semibold text-muted">Guruh postlari</div>
                  </div>
                  <button onClick={() => setGroup(null)} className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm font-bold text-brand-700 hover:bg-brand-100">
                    <X className="h-4 w-4" /> Barchasi
                  </button>
                </div>
              )}
              <Chips
                value={kindFilter}
                onChange={setKindFilter}
                items={[
                  { value: "all", label: "Barchasi" },
                  { value: "savol", label: "Savollar", emoji: "❓" },
                  { value: "tajriba", label: "Tajribalar", emoji: "💬" },
                  { value: "maslahat", label: "Maslahatlar", emoji: "💡" },
                ]}
              />
              {feed.length === 0 ? (
                <EmptyState
                  emoji="🗨️"
                  title={posts.length ? "Hech narsa topilmadi" : "Hali postlar yo‘q"}
                  text={posts.length ? "Boshqa so‘z bilan qidiring yoki filtrni o‘zgartiring." : "Birinchi bo‘lib savol bering yoki tajribangizni ulashing."}
                  action={
                    <Button variant="soft" onClick={() => setAsk({ groupId: group ?? undefined })}>
                      ✍️ Post yozish
                    </Button>
                  }
                />
              ) : (
                feed.map((p) => (p.kind === "efir" ? <EfirCard key={p.id} post={p} /> : <PostCard key={p.id} post={p} highlight={p.id === freshId} />))
              )}
            </>
          )}

          {/* ------------------------------------------------ Guruhlar */}
          {tab === "guruhlar" &&
            (GROUPS.length === 0 ? (
              <EmptyState emoji="👥" title="Guruhlar tez orada ochiladi" text="Hududiy va mavzuli guruhlar tayyorlanmoqda." />
            ) : (
              <>
                {(["hudud", "mavzu"] as const).map((type) => {
                  const list = GROUPS.filter((g) => g.type === type).sort(
                    (a, b) => Number(isMyRegionGroup(b, myRegion)) - Number(isMyRegionGroup(a, myRegion)) || b.members - a.members,
                  );
                  if (!list.length) return null;
                  return (
                    <section key={type} className="pt-1">
                      <h2 className="mb-2.5 text-[17px] font-black text-ink">{type === "hudud" ? "📍 Hududiy guruhlar" : "💬 Mavzuli guruhlar"}</h2>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {list.map((g) => (
                          <GroupCard key={g.id} group={g} postsCount={postCounts[g.id] ?? 0} mine={isMyRegionGroup(g, myRegion)} onOpen={() => openGroup(g.id)} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </>
            ))}

          {/* ------------------------------------------------ Savol-javob */}
          {tab === "savollar" && (
            <>
              <Composer name={user.name} onOpen={() => setAsk({})} text="Savolingizni yozing — mutaxassislar javob beradi" />
              <Chips
                value={qaFilter}
                onChange={setQaFilter}
                items={[
                  { value: "all", label: "Barcha savollar" },
                  { value: "answered", label: "Mutaxassis javob bergan", emoji: "✔️" },
                  { value: "waiting", label: "Javob kutilmoqda", emoji: "⏳" },
                ]}
              />
              {questions.length === 0 ? (
                <EmptyState
                  emoji="❓"
                  title="Savollar topilmadi"
                  text="Savolingizni bering — tasdiqlangan mutaxassislar javob beradi."
                  action={<Button onClick={() => setAsk({})}>Savol berish</Button>}
                />
              ) : (
                questions.map((p) => <PostCard key={p.id} post={p} highlight={p.id === freshId} />)
              )}
            </>
          )}

          {/* ------------------------------------------------ Efirlar */}
          {tab === "efirlar" && (
            <>
              <div className="flex gap-3 rounded-3xl border border-[#f6caca] bg-gradient-to-br from-[#fff5f5] to-white p-4 shadow-card sm:p-5">
                <span className="text-3xl leading-none">🎙️</span>
                <div>
                  <div className="text-[16px] font-black text-ink">Mutaxassislar bilan jonli savol-javob</div>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
                    Har hafta tasdiqlangan mutaxassislar YuniQo Telegram kanalida bepul efir o‘tkazadi. Savollaringizni oldindan qoldiring — efirda
                    ismlar aytilmaydi, ma’lumotlaringiz maxfiy qoladi.
                  </p>
                </div>
              </div>
              {efirs.length === 0 ? (
                <EmptyState emoji="🎙️" title="Yaqin kunlarda efir rejalashtirilmagan" text="Yangi efirlar e’lon qilinishi bilan shu yerda paydo bo‘ladi." />
              ) : (
                efirs.map(({ p }) => <EfirCard key={p.id} post={p} />)
              )}
            </>
          )}
        </div>

        {/* Yon panel */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          {verified.length > 0 && (
            <Card className="p-4">
              <CardTitle
                action={
                  <Link href="/specialists" className="text-sm font-bold text-brand-600 hover:text-brand-700">
                    Barchasi
                  </Link>
                }
              >
                ✔️ Javob beradigan mutaxassislar
              </CardTitle>
              <div className="-mx-2 space-y-0.5">
                {verified.slice(0, 4).map((sp) => (
                  <Link key={sp.id} href={`/specialists/${sp.id}`} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-brand-50">
                    <Avatar name={sp.name} color={sp.color} size={40} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-sm font-extrabold text-ink">
                        <span className="truncate">{sp.name}</span>
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                      </div>
                      <div className="truncate text-xs font-semibold text-muted">
                        {SPECIALTIES[sp.specialty].label} · ⭐ {sp.rating.toFixed(1)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
          {ARTICLES.length > 0 && (
            <Card className="p-4">
              <CardTitle
                action={
                  <Link href="/library" className="text-sm font-bold text-brand-600 hover:text-brand-700">
                    Barchasi
                  </Link>
                }
              >
                📚 Foydali materiallar
              </CardTitle>
              <div className="-mx-2 space-y-0.5">
                {[...ARTICLES]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 3)
                  .map((a) => (
                    <Link key={a.id} href={`/library/${a.id}`} className="flex items-start gap-3 rounded-2xl p-2 transition hover:bg-brand-50">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-canvas text-xl">{a.emoji}</span>
                      <div className="min-w-0">
                        <div className="line-clamp-2 text-[13.5px] font-bold leading-snug text-ink">{a.title}</div>
                        <div className="mt-0.5 text-xs font-semibold text-muted">⏱ {a.readMin} daqiqa</div>
                      </div>
                    </Link>
                  ))}
              </div>
            </Card>
          )}
        </aside>
      </div>

      {/* Mobil: suzuvchi "Savol berish" tugmasi */}
      <button
        onClick={() => setAsk({ groupId: group ?? undefined })}
        className="no-print fixed bottom-[calc(env(safe-area-inset-bottom)+92px)] right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-brand-gradient pl-4 pr-5 text-[15px] font-black text-white shadow-brand ring-4 ring-white/70 transition active:scale-95 sm:hidden"
      >
        <PenLine className="h-5 w-5" />
        Savol berish
      </button>
      <div className="h-16 sm:hidden" aria-hidden />

      {ask && (
        <AskSheet
          defaultGroupId={ask.groupId}
          onClose={() => setAsk(null)}
          onPosted={(id, kind) => {
            setQ("");
            setKindFilter("all");
            setQaFilter("all");
            setTab(kind === "savol" && tab === "savollar" ? "savollar" : "lenta");
            setFreshId(id);
            setTimeout(() => document.getElementById(`post-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
          }}
        />
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/80 px-2 py-2.5 text-center ring-1 ring-line">
      <div className="text-[18px] font-black leading-none text-ink tabular sm:text-[20px]">{value}</div>
      <div className="mt-1 text-[11px] font-bold text-muted sm:text-xs">{label}</div>
    </div>
  );
}

function Rule({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-line sm:items-start sm:gap-2.5 sm:rounded-2xl sm:p-2.5">
      <span className="text-base leading-none sm:text-lg">{emoji}</span>
      <div className="min-w-0">
        <div className="text-[12.5px] font-extrabold leading-tight text-ink sm:text-[13px]">{title}</div>
        <div className="mt-0.5 hidden text-[12px] leading-snug text-muted sm:block">{text}</div>
      </div>
    </div>
  );
}

function Composer({ name, onOpen, text = "Farzandingiz haqida savol bering yoki tajriba ulashing…" }: { name: string; onOpen: () => void; text?: string }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-3xl border border-line bg-white p-3 text-left shadow-card transition hover:border-brand-200"
    >
      <Avatar name={name || "Ota-ona"} size={40} />
      <span className="min-w-0 flex-1 truncate rounded-2xl bg-canvas px-4 py-2.5 text-[14px] font-semibold text-muted">{text}</span>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand">
        <PenLine className="h-[18px] w-[18px]" />
      </span>
    </button>
  );
}

function CommunitySkeleton() {
  return (
    <div>
      <PageHeader emoji="👨‍👩‍👧" title="Ota-onalar hamjamiyati" subtitle="Yuklanmoqda…" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="mt-5 h-12 w-full" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
