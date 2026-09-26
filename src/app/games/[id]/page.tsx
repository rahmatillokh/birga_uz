"use client";

import { useParams } from "next/navigation";
import { GameShell, getGameDef } from "@/components/games";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { getGame } from "@/data/games";

export default function GamePlayPage() {
  const params = useParams<{ id: string }>();
  const raw = params?.id as string | string[] | undefined;
  const id = Array.isArray(raw) ? raw[0] : raw;
  const game = getGame(id);
  const def = getGameDef(game?.id);

  if (!game || !def) {
    return (
      <div className="animate-fade-up">
        <PageHeader emoji="🎮" title="O‘yin topilmadi" back="/games" />
        <EmptyState
          emoji="🧩"
          title="Bunday o‘yin topilmadi"
          text="Havola eskirgan bo‘lishi mumkin. Ro‘yxatdan boshqa qiziqarli o‘yinni tanlang!"
          action={<Button href="/games">🎮 O‘yinlar ro‘yxati</Button>}
        />
      </div>
    );
  }

  return <GameShell key={game.id} game={game} def={def} />;
}
