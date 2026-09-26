"use client";

import { Play } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { Chips, Tabs } from "@/components/ui/tabs";
import { VideoCard, VideoThumb } from "@/components/videos/video-card";
import { accentOf, formatClock, videoSeconds } from "@/components/videos/shared";
import { VIDEOS } from "@/data/videos";
import { useChildData, useIsPremium } from "@/lib/client/hooks";
import { VIDEO_CATEGORIES } from "@/lib/constants";
import { focusDomains } from "@/lib/core/plan";
import type { Video, VideoCategory } from "@/lib/types";
import { ageOf } from "@/lib/utils";

const CATEGORY_KEYS = Object.keys(VIDEO_CATEGORIES) as VideoCategory[];

function isCategory(v: string | null): v is VideoCategory {
  return !!v && v in VIDEO_CATEGORIES;
}

export default function VideosPage() {
  return (
    <Suspense fallback={<VideosSkeleton />}>
      <Videos />
    </Suspense>
  );
}

function Videos() {
  const params = useSearchParams();
  const { child, latest, activities } = useChildData();
  const isPremium = useIsPremium();
  const years = child ? ageOf(child.birthDate).years : undefined;

  const [cat, setCat] = useState<VideoCategory | "all">(() => {
    const c = params.get("category");
    return isCategory(c) ? c : "all";
  });
  const [ageMode, setAgeMode] = useState<"child" | "all">(years !== undefined ? "child" : "all");

  const watched = useMemo(() => new Set(activities.filter((a) => a.kind === "video").map((a) => a.refId)), [activities]);
  const fitsChild = (v: Video) => years === undefined || (years >= v.ageMin && years <= v.ageMax);

  const list = VIDEOS.filter((v) => (cat === "all" || v.category === cat) && (ageMode === "all" || fitsChild(v)));

  // Bugungi tavsiya: bolaning yoshiga mos, hali ko‘rilmagan, zaif yo‘nalishga oid video
  const featured = useMemo(() => {
    if (!child || years === undefined) return undefined;
    const weak = focusDomains(child, latest);
    const rank = (v: Video) => {
      const i = weak.indexOf(VIDEO_CATEGORIES[v.category].domain);
      return i === -1 ? 9 : i;
    };
    return VIDEOS.filter((v) => years >= v.ageMin && years <= v.ageMax && !watched.has(v.id) && (!v.premium || isPremium)).sort(
      (a, b) => rank(a) - rank(b),
    )[0];
  }, [child, latest, years, watched, isPremium]);

  const watchedCount = VIDEOS.filter((v) => watched.has(v.id)).length;

  return (
    <div>
      <PageHeader
        emoji="🎥"
        title="Rivojlantiruvchi videolar"
        subtitle="Yoshga mos interaktiv video-darslar: nutq, motorika, diqqat, xotira va boshqalar"
      />

      {child && VIDEOS.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-3xl border border-line bg-white p-3.5 shadow-card">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-2xl">{child.avatar}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 text-sm font-bold text-ink-2">
              <span className="truncate">
                {child.name} {watchedCount} ta videoni ko‘rdi
              </span>
              <span className="shrink-0 text-xs font-extrabold text-muted tabular">
                {watchedCount}/{VIDEOS.length}
              </span>
            </div>
            <ProgressBar value={watchedCount} max={VIDEOS.length} trackClassName="mt-2" height={7} />
          </div>
        </div>
      )}

      {cat === "all" && featured && <FeaturedVideo video={featured} childName={child?.name} />}

      <Chips
        className="mt-5"
        value={cat}
        onChange={setCat}
        items={[
          { value: "all" as const, emoji: "🎬", label: "Barchasi" },
          ...CATEGORY_KEYS.map((k) => ({ value: k, emoji: VIDEO_CATEGORIES[k].emoji, label: VIDEO_CATEGORIES[k].label })),
        ]}
      />

      {child && years !== undefined && (
        <Tabs
          className="mt-3"
          value={ageMode}
          onChange={setAgeMode}
          items={[
            { value: "child", label: `${child.avatar} ${child.name} uchun (${years} yosh)` },
            { value: "all", label: "Barcha yoshlar" },
          ]}
        />
      )}

      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-black text-ink">
            {cat === "all" ? "Barcha videolar" : `${VIDEO_CATEGORIES[cat].emoji} ${VIDEO_CATEGORIES[cat].label}`}
          </h2>
          <span className="text-[13px] font-semibold text-muted">{list.length} ta</span>
        </div>

        {VIDEOS.length === 0 ? (
          <EmptyState emoji="🎬" title="Videolar tez orada qo‘shiladi" text="Mutaxassislarimiz yangi video-darslar tayyorlamoqda." />
        ) : list.length === 0 ? (
          <EmptyState
            emoji="🔎"
            title="Bu bo‘limda mos video topilmadi"
            text={ageMode === "child" ? "Barcha yoshlar uchun videolarni ko‘rib chiqing." : "Boshqa bo‘limni tanlab ko‘ring."}
            action={
              ageMode === "child" ? (
                <Button variant="soft" onClick={() => setAgeMode("all")}>
                  Barcha yoshlarni ko‘rsatish
                </Button>
              ) : (
                <Button variant="soft" onClick={() => setCat("all")}>
                  Barcha videolar
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {list.map((v) => (
              <VideoCard key={v.id} video={v} watched={watched.has(v.id)} locked={!!v.premium && !isPremium} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FeaturedVideo({ video, childName }: { video: Video; childName?: string }) {
  const cat = VIDEO_CATEGORIES[video.category];
  const accent = accentOf(video.category);
  return (
    <Link
      href={`/videos/${video.id}`}
      className="group grid overflow-hidden rounded-[28px] border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-pop sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      <VideoThumb video={video} size="lg" />
      <div className="flex flex-col justify-center p-4 sm:p-6">
        <div className="text-xs font-extrabold uppercase tracking-wide" style={{ color: accent }}>
          ▶️ Bugun {childName ? `${childName} uchun` : "siz uchun"}
        </div>
        <h2 className="mt-1.5 text-[20px] font-black leading-tight text-ink sm:text-[24px]">{video.title}</h2>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{video.description}</p>
        <div className="mt-2 text-[13px] font-bold text-ink-2">
          {cat.emoji} {cat.label} · {video.ageMin}–{video.ageMax} yosh · {formatClock(videoSeconds(video))}
        </div>
        <span
          className="mt-4 inline-flex w-fit items-center gap-2 rounded-2xl px-5 py-3 text-[15px] font-black text-white shadow-lg transition group-hover:brightness-110"
          style={{ background: accent }}
        >
          <Play className="h-4 w-4 fill-white" />
          Ko‘rishni boshlash
        </span>
      </div>
    </Link>
  );
}

function VideosSkeleton() {
  return (
    <div>
      <PageHeader emoji="🎥" title="Rivojlantiruvchi videolar" subtitle="Yuklanmoqda…" />
      <Skeleton className="h-56 w-full" />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
