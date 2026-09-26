"use client";

import { useMemo } from "react";
import { CheckCard, HistoryRow, SpeechCheckCard } from "@/components/ai-check/check-card";
import { PRIVACY_TEXT } from "@/components/ai-check/intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, InfoNote, PageHeader, Section, StatTile } from "@/components/ui/misc";
import { useChildData, useIsPremium } from "@/lib/client/hooks";
import type { Activity } from "@/lib/types";
import { CAMERA_CHECKS } from "@/lib/vision/catalog";
import { formatSec } from "@/lib/vision/result";

const HOW = [
  { emoji: "📷", title: "Kamerani yoqing", text: "Telefon yoki noutbuk kamerasi" },
  { emoji: "🤸", title: "Mashqni bajaring", text: "3-2-1 dan keyin boshlanadi" },
  { emoji: "🤖", title: "AI kuzatadi", text: "Sanaydi va xatoni darhol aytadi" },
  { emoji: "📈", title: "Natija saqlanadi", text: "Profil va progressda ko‘rinadi" },
];

export default function AiCheckHubPage() {
  const { child, activities } = useChildData();
  const premium = useIsPremium();

  const checks = useMemo(() => activities.filter((a) => a.kind === "ai_check").sort((a, b) => b.at.localeCompare(a.at)), [activities]);
  const lastSpeech = useMemo(() => activities.filter((a) => a.kind === "speech").sort((a, b) => b.at.localeCompare(a.at))[0], [activities]);
  const lastBy = useMemo(() => {
    const m = new Map<string, Activity>();
    for (const a of checks) if (!m.has(a.refId)) m.set(a.refId, a);
    return m;
  }, [checks]);
  const stats = useMemo(() => {
    const scored = checks.filter((a) => typeof a.score === "number");
    const avg = scored.length ? Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length) : null;
    const holds = checks.filter((a) => a.refId === "balance").map((a) => Number(a.details?.holdSec ?? 0));
    const bestBalance = holds.length ? Math.max(...holds) : 0;
    const distinct = new Set(checks.map((a) => a.refId).filter((r) => (CAMERA_CHECKS as string[]).includes(r))).size;
    return { avg, bestBalance, distinct };
  }, [checks]);

  return (
    <div>
      <PageHeader
        title="AI video nazorat"
        subtitle="Bola kamera oldida mashq qiladi — AI takrorlarni sanaydi, xatolarni ko‘rsatadi va keyingi mashqni tavsiya qiladi"
        emoji="📹"
        actions={!premium ? <Badge tone="premium">💎 Premium</Badge> : undefined}
      />

      <Card className="overflow-hidden">
        <div className="relative bg-brand-gradient p-5 text-white sm:p-7">
          <div className="pointer-events-none absolute -right-6 -top-8 text-[140px] leading-none opacity-15 sm:text-[180px]">📹</div>
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold">🤖 Sun’iy intellekt · real vaqtda</div>
              <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">Mashqni kamera oldida bajaring — AI kuzatib boradi</h2>
              <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/90">
                Tana (33 nuqta) va yuz harakatlari kuzatiladi: takrorlar sanaladi, to‘g‘ri bajarilishi tekshiriladi, xatolar esa ekranda darhol
                ko‘rinadi.
              </p>
            </div>
            <div className="hidden text-8xl sm:block">🤸</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4 sm:gap-3 sm:p-5">
          {HOW.map((s, i) => (
            <div key={s.title} className="rounded-2xl bg-brand-50 p-3 ring-1 ring-brand-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{s.emoji}</span>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-black text-brand-700">{i + 1}</span>
              </div>
              <div className="mt-1.5 text-sm font-extrabold text-ink">{s.title}</div>
              <div className="text-xs leading-snug text-muted">{s.text}</div>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <InfoNote emoji="🔒">
            <b className="text-ink">{PRIVACY_TEXT}.</b> Kamera faqat mashq vaqtida yonadi. Profilga faqat natija saqlanadi: takrorlar, aniqlik va
            xatolar.
          </InfoNote>
        </div>
      </Card>

      {!premium && (
        <div className="mt-4 flex flex-col gap-3 rounded-3xl bg-gradient-to-br from-[#f4f0ff] to-white p-4 ring-1 ring-[#e4dcff] sm:flex-row sm:items-center sm:p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#efeaff] text-2xl">💎</div>
          <div className="flex-1">
            <div className="font-extrabold text-ink">AI video nazorat — Premium imkoniyat</div>
            <div className="text-sm text-muted">Mashqlarni ko‘rib chiqishingiz mumkin. Kamera bilan tekshirish uchun Premium’ni yoqing — 7 kun bepul.</div>
          </div>
          <Button variant="premium" href="/premium">
            Premium’ni ochish
          </Button>
        </div>
      )}

      {checks.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Tekshiruvlar" emoji="📹" value={checks.length} hint={child ? `${child.name} bajargan` : undefined} />
          <StatTile label="O‘rtacha aniqlik" emoji="🎯" value={stats.avg === null ? "—" : `${stats.avg}%`} hint="xatosiz takrorlar ulushi" />
          <StatTile label="Eng uzoq muvozanat" emoji="🦩" value={stats.bestBalance ? formatSec(stats.bestBalance) : "—"} hint="bir oyoqda turish" />
          <StatTile label="Sinalgan mashqlar" emoji="🧩" value={`${stats.distinct}/${CAMERA_CHECKS.length}`} hint="kamera mashqlari" />
        </div>
      )}

      <Section title="Mashqni tanlang">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAMERA_CHECKS.map((id) => (
            <CheckCard key={id} id={id} last={lastBy.get(id)} />
          ))}
          <SpeechCheckCard last={lastSpeech} />
        </div>
      </Section>

      <Section title="So‘nggi AI tekshiruvlar">
        {checks.length ? (
          <Card className="divide-y divide-line overflow-hidden">
            {checks.slice(0, 8).map((a) => (
              <HistoryRow key={a.id} a={a} />
            ))}
          </Card>
        ) : (
          <EmptyState emoji="📹" title="Hali AI tekshiruvlar yo‘q" text="Yuqoridan birinchi mashqni tanlang — natija shu yerda paydo bo‘ladi" />
        )}
      </Section>
    </div>
  );
}
