"use client";

import confetti from "canvas-confetti";
import { Check, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DomainBadge, EmojiTile, EmptyState, InfoNote, LockedOverlay, PageHeader, Section } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { LessonPlayer } from "@/components/videos/lesson-player";
import { formatClock, lessonScenes, MASCOTS, nextVideo, videoSeconds } from "@/components/videos/shared";
import { VideoCard, VideoThumb } from "@/components/videos/video-card";
import { EXERCISES } from "@/data/exercises";
import { getVideo, VIDEOS } from "@/data/videos";
import { useChildData, useIsPremium } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { DOMAINS, SECTIONS, VIDEO_CATEGORIES } from "@/lib/constants";
import type { Video } from "@/lib/types";
import { ageOf } from "@/lib/utils";

export default function VideoPage() {
  const params = useParams<{ id: string | string[] }>();
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  const video = getVideo(decodeURIComponent(raw ?? ""));
  if (!video) return <NotFound />;
  return <VideoView key={video.id} video={video} />;
}

function VideoView({ video }: { video: Video }) {
  const cat = VIDEO_CATEGORIES[video.category];
  const domain = cat.domain;
  const isPremium = useIsPremium();
  const locked = !!video.premium && !isPremium;
  const { child, activities } = useChildData();
  const act = useApp((s) => s.act);
  const years = child ? ageOf(child.birthDate).years : undefined;
  const hasLesson = !!video.steps?.length || !video.youtubeId;
  const [mode, setMode] = useState<"youtube" | "lesson">(video.youtubeId ? "youtube" : "lesson");
  const [justWatched, setJustWatched] = useState(false);
  const loggedRef = useRef(false);

  const watchedBefore = activities.some((a) => a.kind === "video" && a.refId === video.id);
  const watched = watchedBefore || justWatched;
  const next = nextVideo(VIDEOS, video);

  const logWatch = useCallback(
    async (sec: number) => {
      if (loggedRef.current) return;
      loggedRef.current = true;
      setJustWatched(true);
      if (!child) {
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, disableForReducedMotion: true });
        return;
      }
      try {
        await act(
          { type: "activity.log", childId: child.id, kind: "video", refId: video.id, title: video.title, domain, durationSec: sec },
          { rewardTitle: "Video-dars ko‘rildi — barakalla!" },
        );
      } catch {
        /* tarmoq xatosi — ko‘rish tajribasiga xalaqit bermaydi */
      }
    },
    [act, child, domain, video.id, video.title],
  );

  const exercises = useMemo(() => {
    const fit = (min: number, max: number) => years === undefined || (years >= min - 1 && years <= max + 1);
    return EXERCISES.filter((e) => e.domain === domain)
      .sort((a, b) => Number(fit(b.ageMin, b.ageMax)) - Number(fit(a.ageMin, a.ageMax)) || a.difficulty - b.difficulty)
      .slice(0, 4);
  }, [domain, years]);

  const more = useMemo(() => {
    const fit = (v: Video) => years === undefined || (years >= v.ageMin && years <= v.ageMax);
    return VIDEOS.filter((v) => v.id !== video.id)
      .map((v) => ({ v, score: (v.category === video.category ? 2 : 0) + (fit(v) ? 1 : 0) + (VIDEO_CATEGORIES[v.category].domain === domain ? 0.5 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.v);
  }, [video, years, domain]);

  const scenesCount = hasLesson ? lessonScenes(video).length : 0;

  return (
    <div>
      <PageHeader
        back="/videos"
        emoji={cat.emoji}
        title={video.title}
        subtitle={`${cat.label} · ${video.ageMin}–${video.ageMax} yosh · ${formatClock(videoSeconds(video))}`}
      />

      {video.youtubeId && hasLesson && !locked && (
        <Tabs
          className="mb-3"
          value={mode}
          onChange={setMode}
          items={[
            { value: "youtube", label: "▶️ Video" },
            { value: "lesson", label: "🎬 Interaktiv dars" },
          ]}
        />
      )}

      {/* Pleyer */}
      {locked ? (
        <div className="relative overflow-hidden rounded-[28px] shadow-card ring-1 ring-line">
          <VideoThumb video={video} locked size="lg" className="aspect-[4/5] sm:aspect-video" />
          <div className="absolute inset-0 grid place-items-center bg-white/45 p-4 backdrop-blur-[3px]">
            <div className="w-full max-w-sm shadow-pop">
              <LockedOverlay
                title="Premium video-dars"
                text="Bu dars YuniQo Premium obunachilari uchun. Premium bilan barcha video-darslar, AI video nazorat va Ustoz AI cheksiz ochiladi."
              />
            </div>
          </div>
        </div>
      ) : mode === "youtube" && video.youtubeId ? (
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-[28px] bg-ink shadow-pop ring-1 ring-black/5">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1&playsinline=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <div className="mt-3 flex flex-col items-start gap-3 rounded-3xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-extrabold text-ink">{watched ? "Barakalla! Video ko‘rildi ✅" : "Videoni birga ko‘rib bo‘ldingizmi?"}</div>
              <div className="text-sm text-muted">
                {watched
                  ? `${child ? `${child.name}ning` : "Farzandingiz"} rivojlanish tarixiga yozib qo‘yildi.`
                  : "Belgilab qo‘ying — natija farzandingiz progressiga qo‘shiladi."}
              </div>
            </div>
            {!justWatched && (
              <Button onClick={() => void logWatch(video.durationSec)} variant={watchedBefore ? "secondary" : "primary"}>
                <Check className="h-4 w-4" strokeWidth={3} />
                {watchedBefore ? "Yana ko‘rdik" : "Ko‘rib bo‘ldik"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <LessonPlayer
          video={video}
          childName={child?.name}
          onComplete={(sec) => void logWatch(sec)}
          nextHref={next ? `/videos/${next.id}` : undefined}
        />
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* Dars haqida */}
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gray">
              {cat.emoji} {cat.label}
            </Badge>
            {DOMAINS[domain].label !== cat.label && <DomainBadge domain={domain} className="py-1" />}
            <Badge tone="brand">
              👶 {video.ageMin}–{video.ageMax} yosh
            </Badge>
            {video.premium && <Badge tone="premium">💎 Premium</Badge>}
            {watched && <Badge tone="good">✓ Ko‘rilgan</Badge>}
          </div>
          <h2 className="mt-3 text-[19px] font-black leading-snug text-ink">{video.title}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{video.description}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatClock(videoSeconds(video))}
            </span>
            {hasLesson && <span>🎬 {scenesCount} qadamli interaktiv dars</span>}
            <span>
              {MASCOTS[video.category].emoji} Qahramon: {MASCOTS[video.category].name}
            </span>
          </div>
          <InfoNote emoji="👨‍👩‍👧" className="mt-4">
            <span className="font-bold text-ink">Ota-onaga maslahat:</span> videoni farzandingiz bilan birga ko‘ring, har bir qadamni birga bajaring
            va maqtashni unutmang. Kichkintoylar uchun 10–15 daqiqalik ekran vaqti yetarli.
          </InfoNote>
        </Card>

        {/* Mashqlar */}
        <Card className="p-5">
          <CardTitle action={<Link href="/exercises" className="text-sm font-bold text-brand-600 hover:text-brand-700">Barchasi</Link>}>
            🎯 Mavzuga oid mashqlar
          </CardTitle>
          {exercises.length === 0 ? (
            <p className="text-sm text-muted">Bu yo‘nalish bo‘yicha mashqlar tez orada qo‘shiladi.</p>
          ) : (
            <div className="-mx-2 space-y-1">
              {exercises.map((e) => (
                <Link key={e.id} href={`/exercises/${e.id}`} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-brand-50">
                  <EmojiTile emoji={e.emoji} color={DOMAINS[e.domain].soft} size={46} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[14.5px] font-extrabold text-ink">{e.title}</span>
                      {e.premium && !isPremium && <span className="shrink-0 text-xs">💎</span>}
                    </div>
                    <div className="truncate text-xs font-semibold text-muted">
                      {SECTIONS[e.section].emoji} {e.topic} · {e.durationMin} daqiqa · {e.ageMin}–{e.ageMax} yosh
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {more.length > 0 && (
        <Section title="Yana videolar" href="/videos">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {more.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                watched={activities.some((a) => a.kind === "video" && a.refId === v.id)}
                locked={!!v.premium && !isPremium}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function NotFound() {
  return (
    <div>
      <PageHeader back="/videos" emoji="🎥" title="Video topilmadi" subtitle="Rivojlantiruvchi videolar" />
      <EmptyState
        emoji="🎬"
        title="Bunday video yo‘q"
        text="Video o‘chirilgan yoki havola noto‘g‘ri bo‘lishi mumkin."
        action={<Button href="/videos">Videolarga qaytish</Button>}
      />
    </div>
  );
}
