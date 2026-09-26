"use client";

import { ChevronRight, Send } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/misc";
import { useApp } from "@/lib/client/store";
import { openExternal } from "@/lib/client/telegram";
import { cn } from "@/lib/utils";
import { botLink } from "./meta";

/** Telegram uslubidagi ko‘k plitka (qog‘oz samolyot) */
export function TelegramTile({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("grid shrink-0 place-items-center rounded-2xl text-white shadow-[0_8px_18px_-10px_rgb(34_158_217/0.9)]", className)}
      style={{ width: size, height: size, background: "linear-gradient(135deg, #37aee2 0%, #1e96c8 100%)" }}
    >
      <Send style={{ width: size * 0.44, height: size * 0.44 }} className="-ml-0.5 mt-0.5" strokeWidth={2.4} />
    </div>
  );
}

/** Telegram ko‘k rangidagi tugma */
export function TelegramButton({ username, label = "Botni ochish", className, block, size = "md" }: { username: string; label?: string; className?: string; block?: boolean; size?: "sm" | "md" | "lg" }) {
  return (
    <Button
      variant="dark"
      size={size}
      block={block}
      className={cn("bg-[#229ED9] hover:bg-[#1e8dc2]", className)}
      onClick={() => openExternal(botLink(username))}
    >
      <Send className="h-4 w-4" />
      {label}
    </Button>
  );
}

const BOT_FEATURES = [
  { emoji: "🔔", title: "Kunlik eslatmalar", text: "Siz tanlagan vaqtda bugungi mashqlar ro‘yxati" },
  { emoji: "📅", title: "Sessiya va konsultatsiyaga yozilish", text: "Bepul tuman sessiyalari va mutaxassis qabuli — botning o‘zidan" },
  { emoji: "📊", title: "Hisobot olish", text: "Haftalik progress va baholash natijalari qisqacha" },
  { emoji: "👩‍🏫", title: "Mutaxassis xabarlari", text: "Yangi topshiriq, tavsiya va qabul tasdig‘i haqida bildirishnoma" },
];

/** Telegram bot haqida karta: nima qiladi va qanday ochiladi */
export function BotCard({ className }: { className?: string }) {
  const bot = useApp((s) => s.bot);
  const mode = useApp((s) => s.mode);
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-center gap-3 bg-gradient-to-br from-[#eaf6fd] to-white px-5 pb-4 pt-5">
        <TelegramTile />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[17px] font-extrabold leading-tight text-ink">YuniQo Telegram boti</span>
            <Badge tone={bot.connected ? "good" : "gray"}>{bot.connected ? "● Ishlamoqda" : "Sozlanmagan"}</Badge>
          </div>
          <div className="mt-0.5 truncate text-sm font-bold text-[#1d8ad6]">{bot.username ? `@${bot.username}` : "Telegram’dagi yordamchingiz"}</div>
        </div>
      </div>
      <div className="px-5 pb-5 pt-1">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BOT_FEATURES.map((f) => (
            <li key={f.title} className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eaf6fd] text-lg">{f.emoji}</span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-ink">{f.title}</span>
                <span className="block text-[13px] leading-snug text-muted">{f.text}</span>
              </span>
            </li>
          ))}
        </ul>
        {bot.username ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <TelegramButton username={bot.username} className="sm:w-auto" block />
            <p className="text-xs font-semibold text-muted sm:ml-2">
              {mode === "telegram" ? "✅ Siz Telegram orqali kirgansiz — xabarlar shu akkauntga keladi" : "Botda /start bosing — ilova va bot bitta hisob bilan ishlaydi"}
            </p>
          </div>
        ) : (
          <InfoNote emoji="🛠️" className="mt-4">
            Bot hali ulanmagan. Server sozlamalarida <b>TELEGRAM_BOT_TOKEN</b> va <b>TELEGRAM_BOT_USERNAME</b> ko‘rsatilgach, bu yerda
            «Botni ochish» tugmasi paydo bo‘ladi. Ungacha ilova demo rejimda to‘liq ishlaydi.
          </InfoNote>
        )}
        <Link href="/bot" className="mt-3 inline-flex items-center gap-0.5 text-sm font-bold text-brand-600 hover:text-brand-700">
          Bot imkoniyatlari haqida batafsil
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
