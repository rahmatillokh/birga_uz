"use client";

import { Play } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { levelForAge, levelLabel } from "@/components/games/lib";
import { Badge } from "@/components/ui/badge";
import { DomainBadge, EmojiTile, EmptyState, InfoNote, PageHeader } from "@/components/ui/misc";
import { Chips } from "@/components/ui/tabs";
import { GAMES, type GameMeta } from "@/data/games";
import { useActiveChild, useChildData } from "@/lib/client/hooks";
import { addDays, ageOf, dayKey, todayKey, weekdayOf } from "@/lib/utils";

type FilterId = "all" | "xotira" | "diqqat" | "mantiq" | "rang" | "moslash" | "ketma" | "muammo" | "ijtimoiy" | "motorika";

const FILTERS: { value: FilterId; label: string; emoji: string; test: (g: GameMeta) => boolean }[] = [
  { value: "all", label: "Barchasi", emoji: "✨", test: () => true },
  { value: "xotira", label: "Xotira", emoji: "🧠", test: (g) => g.skill === "Xotira" },
  { value: "diqqat", label: "Diqqat", emoji: "🔍", test: (g) => g.skill === "Diqqat" },
  { value: "mantiq", label: "Mantiq", emoji: "🧩", test: (g) => g.skill === "Mantiq" },
  { value: "rang", label: "Rang va shakllar", emoji: "🎨", test: (g) => g.skill === "Rang va shakllar" },
  { value: "moslash", label: "Moslashtirish", emoji: "🔗", test: (g) => g.skill === "Moslashtirish" },
  { value: "ketma", label: "Ketma-ketlik", emoji: "🔢", test: (g) => g.skill === "Ketma-ketlik" },
  { value: "muammo", label: "Muammo yechish", emoji: "💡", test: (g) => g.skill === "Muammo yechish" },
  { value: "ijtimoiy", label: "Ijtimoiy", emoji: "🤝", test: (g) => g.domain === "ijtimoiy" },
  { value: "motorika", label: "Motorika", emoji: "✋", test: (g) => g.domain === "mayda_motorika" || g.domain === "yirik_motorika" },
];

interface GameStats {
  count: number;
  best: number | null;
}

export default function GamesPage() {
  const child = useActiveChild();
  const { activities } = useChildData();
  const [filter, setFilter] = useState<FilterId>("all");
  const age = child ? ageOf(child.birthDate) : undefined;
  const autoLevel = levelForAge(age?.years);

  const plays = useMemo(() => activities.filter((a) => a.kind === "game"), [activities]);

  const byGame = useMemo(() => {
    const m = new Map<string, GameStats>();
    for (const a of plays) {
      const cur = m.get(a.refId) ?? { count: 0, best: null };
      cur.count += 1;
      if (typeof a.score === "number") cur.best = Math.max(cur.best ?? 0, a.score);
      m.set(a.refId, cur);
    }
    return m;
  }, [plays]);

  const week = useMemo(() => {
    const today = todayKey();
    const monday = addDays(today, -(weekdayOf(today) - 1));
    const list = plays.filter((a) => dayKey(a.at) >= monday);
    const scored = list.filter((a) => typeof a.score === "number");
    const avg = scored.length ? Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length) : null;
    return { count: list.length, avg };
  }, [plays]);

  const favorite = useMemo(() => {
    let fav: { game: GameMeta; count: number } | null = null;
    for (const g of GAMES) {
      const c = byGame.get(g.id)?.count ?? 0;
      if (c > 0 && (!fav || c > fav.count)) fav = { game: g, count: c };
    }
    return fav;
  }, [byGame]);

  const test = (FILTERS.find((f) => f.value === filter) ?? FILTERS[0]).test;
  const list = GAMES.filter(test);

  return (
    <div className="animate-fade-up">
      <PageHeader emoji="🎮" title="Rivojlantiruvchi o‘yinlar" subtitle="Xotira, diqqat, mantiq va chaqqonlikni o‘stiradigan qisqa, quvnoq o‘yinlar" />

      {/* Statistika */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <MiniStat emoji="🎮" color="#e0f2fe" value={week.count} label="o‘yin bu hafta" />
        <MiniStat emoji="🎯" color="#fdeee7" value={week.avg ?? "—"} label={week.avg === null ? "o‘rtacha ball" : "o‘rtacha ball (100 dan)"} />
        {favorite ? (
          <Link
            href={`/games/${favorite.game.id}`}
            className="col-span-2 flex min-w-0 items-center gap-3 rounded-3xl border border-line bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop sm:col-span-1 sm:p-4"
            aria-label={`Sevimli o‘yin: ${favorite.game.title}`}
          >
            <EmojiTile emoji={favorite.game.emoji} color={`${favorite.game.color}22`} size={46} />
            <div className="min-w-0">
              <div className="text-[12px] font-bold text-muted sm:text-[13px]">💖 Sevimli o‘yin</div>
              <div className="truncate text-[15px] font-black text-ink sm:text-base">{favorite.game.title}</div>
              <div className="text-[12px] font-semibold text-muted">{favorite.count} marta o‘ynalgan</div>
            </div>
          </Link>
        ) : (
          <MiniStat className="col-span-2 sm:col-span-1" emoji="💖" color="#fcecf2" value="—" label="sevimli o‘yin hali yo‘q" />
        )}
      </div>

      <InfoNote emoji="🧒" className="mt-4">
        Har bir o‘yin 1–3 daqiqa davom etadi.{" "}
        {child && age ? (
          <>
            Daraja <b className="text-ink">{child.name}</b>ning yoshiga ({age.label}) qarab avtomatik tanlanadi —{" "}
            <b className="text-ink">«{levelLabel(autoLevel)}»</b>. Xohlasangiz, o‘yin ichida o‘zgartirishingiz mumkin.
          </>
        ) : (
          <>Daraja bolaning yoshiga qarab avtomatik tanlanadi va o‘yin ichida o‘zgartiriladi.</>
        )}
      </InfoNote>

      <Chips
        className="mt-5"
        value={filter}
        onChange={setFilter}
        items={FILTERS.map(({ value, label, emoji }) => ({ value, label, emoji }))}
      />

      {list.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((g) => (
            <GameCard key={g.id} game={g} stats={byGame.get(g.id)} />
          ))}
        </div>
      ) : (
        <EmptyState className="mt-4" emoji="🎲" title="Bu yo‘nalishda o‘yin yo‘q" text="Boshqa yo‘nalishni tanlang yoki «Barchasi»ni bosing." />
      )}
    </div>
  );
}

function MiniStat({ emoji, color, value, label, className }: { emoji: string; color: string; value: React.ReactNode; label: string; className?: string }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-3xl border border-line bg-white p-3 shadow-card sm:p-4 ${className ?? ""}`}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl sm:h-12 sm:w-12 sm:text-2xl" style={{ background: color }}>
        {emoji}
      </span>
      <div className="min-w-0">
        <div className="tabular text-[24px] font-black leading-none text-ink sm:text-[26px]">{value}</div>
        <div className="mt-1 truncate text-[12px] font-bold text-muted sm:text-[13px]">{label}</div>
      </div>
    </div>
  );
}

function GameCard({ game, stats }: { game: GameMeta; stats?: GameStats }) {
  const best = stats?.best ?? null;
  return (
    <Link
      href={`/games/${game.id}`}
      aria-label={`«${game.title}» o‘yinini o‘ynash`}
      className="group flex h-full flex-col rounded-3xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop"
    >
      <div className="flex items-start gap-3.5">
        <EmojiTile
          emoji={game.emoji}
          color={`${game.color}1f`}
          size={64}
          className="rounded-[20px] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-black leading-tight text-ink">{game.title}</h3>
          <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-muted">{game.description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <DomainBadge domain={game.domain} />
        <Badge tone="gray">{game.ageMin}+ yosh</Badge>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <div className="min-w-0 text-[13px] font-bold text-muted">
          {best !== null ? (
            <>
              <div className="truncate">
                🏆 Eng yaxshi: <b className="tabular text-ink">{best}</b>
              </div>
              <div className="truncate text-xs font-semibold text-faint">{stats?.count} marta o‘ynalgan</div>
            </>
          ) : stats?.count ? (
            <span>{stats.count} marta o‘ynalgan</span>
          ) : (
            <span>✨ Hali o‘ynalmagan</span>
          )}
        </div>
        <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-2xl bg-brand-gradient px-4 text-sm font-extrabold text-white shadow-brand transition group-hover:brightness-105">
          <Play className="h-4 w-4 fill-current" />
          O‘ynash
        </span>
      </div>
    </Link>
  );
}
