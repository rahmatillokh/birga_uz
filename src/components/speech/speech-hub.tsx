"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmojiTile, EmptyState, InfoNote, PageHeader, Section } from "@/components/ui/misc";
import { EXERCISES } from "@/data/exercises";
import { SPEECH_SOUNDS } from "@/data/speech";
import { useChildData } from "@/lib/client/hooks";
import { DOMAINS, scoreLevel } from "@/lib/constants";
import { speechStats } from "@/lib/speech/stats";
import type { Activity, SpeechSound } from "@/lib/types";
import { SpeechStatsStrip } from "./speech-stats";

export function SpeechHub() {
  const { activities } = useChildData();
  const artic = useMemo(() => EXERCISES.filter((e) => e.section === "logoped" && e.topic === "Artikulyatsiya"), []);
  const stats = useMemo(() => speechStats(activities, artic.map((e) => e.id)), [activities, artic]);
  const breathScore = stats.breathLast?.score;
  const loudScore = stats.loudLast?.score;

  return (
    <div className="animate-fade-up">
      <PageHeader
        emoji="🗣️"
        title="Nutq va talaffuz"
        subtitle="Logoped bilan uyda ishlash uchun: talaffuz, nafas, ovoz kuchi va artikulyatsiya mashqlari — o‘yin tarzida."
      />

      <SpeechStatsStrip stats={stats} />

      <Section title="🎙️ Talaffuz tekshiruvi (AI)">
        <p className="-mt-1 mb-3 text-sm text-muted">Tovushni tanlang: bola so‘zni aytadi, AI eshitib baholaydi va maslahat beradi.</p>
        {SPEECH_SOUNDS.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SPEECH_SOUNDS.map((s) => (
              <SoundTile key={s.id} sound={s} last={stats.lastBySound[s.id]} />
            ))}
          </div>
        ) : (
          <EmptyState emoji="🔤" title="Tovushlar tayyorlanmoqda" text="Talaffuz uchun so‘zlar ro‘yxati tez orada qo‘shiladi." />
        )}
      </Section>

      <Section title="🎲 Nutq o‘yinlari">
        <div className="grid gap-3 md:grid-cols-3">
          <GameCard
            href="/speech/nafas"
            emoji="🎂"
            color="#fdeee7"
            tag="Nafas mashqi"
            title="Shamni o‘chir"
            text="Mikrofonga puflab, tortdagi shamlarni o‘chiring — uzun va kuchli havo oqimi to‘g‘ri nutq uchun muhim."
            meta={typeof breathScore === "number" ? `Oxirgi: ${Math.round((breathScore / 100) * 3)}/3 sham` : "Hali o‘ynalmagan"}
          />
          <GameCard
            href="/speech/ovoz"
            emoji="🦁"
            color="#fdf3dc"
            tag="Ovoz kuchi"
            title="Sher va sichqoncha"
            text="Sherdek baland, sichqonchadek sekin — ovoz balandligini boshqarishni o‘yin orqali o‘rganamiz."
            meta={typeof loudScore === "number" ? `Oxirgi: ${loudScore} ball` : "Hali o‘ynalmagan"}
          />
          <GameCard
            href="/speech/gimnastika"
            emoji="🪞"
            color="#e3f6ef"
            tag="Artikulyatsiya"
            title="Ko‘zgu oldida gimnastika"
            text="Old kamera — ko‘zgu: qadamma-qadam ko‘rsatma va taymer bilan lab va til mashqlari."
            meta={artic.length ? `${artic.length} ta mashq${stats.mirrorCount ? ` · ✅ ${stats.mirrorCount}` : ""}` : "Tez orada"}
          />
        </div>
      </Section>

      <Section title="👩‍🏫 Logoped yordami">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
          <Card href="/specialists?type=logoped" className="flex items-center gap-4 p-5">
            <EmojiTile emoji="👩‍🏫" color={DOMAINS.nutq.soft} size={56} />
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-extrabold text-ink">Logoped bilan maslahatlashing</div>
              <p className="mt-0.5 text-sm leading-snug text-muted">
                Uydagi mashqlar mutaxassis mashg‘ulotlarini to‘ldiradi. Tovush qo‘yish va nutq kechikishida tajribali logopedlar yordam beradi.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
          </Card>
          <InfoNote>
            Kuniga <b>10–15 daqiqa</b> yetarli. Mashqni o‘yin kabi o‘tkazing va har bir urinishni maqtang — natijadan ko‘ra harakat muhimroq.
          </InfoNote>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          🔒 Mikrofon va kamera faqat mashq vaqtida, sizning ruxsatingiz bilan yoqiladi. Ovoz va tasvir yozuvlari YuniQo’da saqlanmaydi.
        </p>
      </Section>
    </div>
  );
}

function SoundTile({ sound, last }: { sound: SpeechSound; last?: Activity }) {
  const lvl = typeof last?.score === "number" ? scoreLevel(last.score) : null;
  const tone = lvl?.key === "good" ? "good" : lvl?.key === "warning" ? "warn" : "danger";
  return (
    <Link
      href={`/speech/${sound.id}`}
      className="relative flex flex-col items-center rounded-3xl border border-line bg-white p-4 text-center shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop"
    >
      <span className="absolute right-3 top-3 text-xl leading-none" aria-hidden>
        {sound.emoji}
      </span>
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient text-[28px] font-black text-white shadow-brand">
        {sound.sound}
      </span>
      <span className="mt-2.5 text-[15px] font-extrabold text-ink">«{sound.sound}» tovushi</span>
      <span className="text-xs font-semibold text-muted">{sound.words.length} ta so‘z</span>
      <span className="mt-2">
        {lvl && last ? (
          <Badge tone={tone}>
            {lvl.icon} {last.score}
          </Badge>
        ) : (
          <Badge tone="brand">Boshlash</Badge>
        )}
      </span>
    </Link>
  );
}

function GameCard({
  href,
  emoji,
  color,
  tag,
  title,
  text,
  meta,
}: {
  href: string;
  emoji: string;
  color: string;
  tag: string;
  title: string;
  text: string;
  meta: string;
}) {
  return (
    <Card href={href} className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <EmojiTile emoji={emoji} color={color} size={60} />
        <Badge tone="gray">{tag}</Badge>
      </div>
      <div className="mt-3 text-lg font-black text-ink">{title}</div>
      <p className="mt-1 flex-1 text-sm leading-snug text-muted">{text}</p>
      <div className="mt-4 flex items-center justify-between gap-2 text-sm font-bold">
        <span className="truncate text-ink-2">{meta}</span>
        <span className="flex shrink-0 items-center text-brand-600">
          Boshlash
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}
