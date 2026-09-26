"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AiCheckSession } from "@/components/ai-check/session";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DomainBadge, EmojiTile, EmptyState, LockedOverlay, PageHeader, Skeleton } from "@/components/ui/misc";
import { getExercise } from "@/data/exercises";
import { useIsPremium } from "@/lib/client/hooks";
import { AI_CHECKS } from "@/lib/constants";
import type { Exercise } from "@/lib/types";
import { CHECK_META, isCameraCheck } from "@/lib/vision/catalog";
import type { CameraCheckId } from "@/lib/vision/types";

export default function AiCheckSessionPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SessionPage />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-14 w-2/3" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

function SessionPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const premium = useIsPremium();
  const rawId = decodeURIComponent(String(params?.id ?? ""));
  const exercise = getExercise(search.get("exercise") ?? undefined);

  // "speech" tekshiruvi — mikrofon, alohida bo‘limda
  useEffect(() => {
    if (rawId === "speech") router.replace("/speech");
  }, [rawId, router]);

  if (rawId === "speech") return <PageSkeleton />;

  if (!isCameraCheck(rawId)) {
    return (
      <div>
        <PageHeader title="Mashq topilmadi" emoji="🤔" back="/ai-check" />
        <EmptyState
          emoji="🔎"
          title="Bunday AI tekshiruv topilmadi"
          text="Havola eskirgan bo‘lishi mumkin. Mashqlar ro‘yxatidan tanlang."
          action={<Button href="/ai-check">📋 Barcha mashqlar</Button>}
        />
      </div>
    );
  }

  const id = rawId;
  const info = AI_CHECKS[id];
  return (
    <div>
      <PageHeader
        title={info.title}
        subtitle={info.description}
        emoji={info.emoji}
        back={exercise ? `/exercises/${exercise.id}` : "/ai-check"}
        actions={<DomainBadge domain={info.domain} className="hidden sm:inline-flex" />}
      />
      {exercise && <FromExercise exercise={exercise} />}
      {premium ? <AiCheckSession key={id} id={id} exerciseId={exercise?.id} /> : <Locked id={id} />}
    </div>
  );
}

function FromExercise({ exercise }: { exercise: Exercise }) {
  return (
    <Link
      href={`/exercises/${exercise.id}`}
      className="mb-4 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-line transition hover:ring-brand-200"
    >
      <EmojiTile emoji={exercise.emoji} size={40} />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-muted">📚 Kutubxonadagi mashqdan ochildi</div>
        <div className="truncate font-extrabold text-ink">{exercise.title}</div>
      </div>
      <span className="flex shrink-0 items-center text-sm font-bold text-brand-600">
        Mashqqa qaytish <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function Locked({ id }: { id: CameraCheckId }) {
  const meta = CHECK_META[id];
  return (
    <div className="space-y-4">
      <LockedOverlay
        title="AI video nazorat — Premium"
        text="Kamera orqali mashqni tekshirish: AI takrorlarni sanaydi, xatolarni ko‘rsatadi va natijani bola profiliga saqlaydi."
      />
      <Card className="p-5">
        <CardTitle>
          {meta.poseEmoji} Mashq qanday bajariladi
        </CardTitle>
        <ol className="space-y-2.5">
          {meta.steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-black text-brand-700">{i + 1}</span>
              <span className="pt-1 text-[15px] font-semibold text-ink-2">{s}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted">
          🎯 Maqsad: {meta.targetLabel} · {meta.view.emoji} {meta.view.label}
        </p>
      </Card>
    </div>
  );
}
