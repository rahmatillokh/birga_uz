"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { RoleSwitch } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmojiTile } from "@/components/ui/misc";
import { useApp } from "@/lib/client/store";
import { toast } from "@/lib/client/toast";
import { cn } from "@/lib/utils";
import { useConfirm } from "./confirm";

const MODES = {
  telegram: {
    label: "Telegram Mini App",
    tone: "brand",
    emoji: "✈️",
    text: "Ilova Telegram ichida ochilgan: ma’lumotlar serverda, Telegram akkauntingizga bog‘langan.",
  },
  demo: {
    label: "Demo rejim",
    tone: "warn",
    emoji: "🧪",
    text: "Oddiy brauzer: ko‘rgazma uchun umumiy demo hisob ishlatilmoqda (ma’lumotlar serverda).",
  },
  offline: {
    label: "Oflayn rejim",
    tone: "gray",
    emoji: "📴",
    text: "Server bilan aloqa yo‘q — ilova to‘liq ishlaydi, ma’lumotlar shu brauzerda saqlanadi.",
  },
} as const;

function Row({ emoji, color, title, badge, text }: { emoji: string; color: string; title: string; badge: React.ReactNode; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <EmojiTile emoji={emoji} color={color} size={42} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[15px] font-extrabold text-ink">{title}</span>
          {badge}
        </div>
        <p className="mt-0.5 text-[13px] leading-snug text-muted">{text}</p>
      </div>
    </div>
  );
}

/** Ko‘rgazma (demo) boshqaruvi: rejim, AI, bot holati, demo’ni tiklash, rolni almashtirish */
export function DemoControls({ className }: { className?: string }) {
  const mode = useApp((s) => s.mode);
  const aiEnabled = useApp((s) => s.aiEnabled);
  const bot = useApp((s) => s.bot);
  const resetDemo = useApp((s) => s.resetDemo);
  const [busy, setBusy] = useState(false);
  const [confirm, confirmUi] = useConfirm();
  const m = MODES[mode] ?? MODES.demo;

  const reset = async () => {
    const ok = await confirm({
      title: "Demo ma’lumotlarni tiklaysizmi?",
      emoji: "🔄",
      text: "Demo hisobdagi bolalar, mashqlar, yozilishlar va sozlamalar boshlang‘ich holatga qaytadi. Telegram foydalanuvchilarining haqiqiy ma’lumotlari o‘zgarmaydi.",
      confirmLabel: "Ha, tiklash",
      cancelLabel: "Bekor",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await resetDemo();
      toast.success("Demo ma’lumotlar tiklandi", "🔄");
    } catch {
      toast.error("Tiklab bo‘lmadi. Internet aloqasini tekshiring");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={cn("p-5", className)}>
      <div className="divide-y divide-line">
        <Row emoji={m.emoji} color="#fdf3dc" title="Ish rejimi" badge={<Badge tone={m.tone}>{m.label}</Badge>} text={m.text} />
        <Row
          emoji="🤖"
          color="#efeaff"
          title="Sun’iy intellekt"
          badge={<Badge tone={aiEnabled ? "good" : "gray"}>{aiEnabled ? "● Claude AI ulangan" : "Oflayn demo AI"}</Badge>}
          text={
            aiEnabled
              ? "AI yordamchi javoblari, baholash xulosalari va individual reja Claude orqali real vaqtda yaratiladi."
              : "AI kaliti (ANTHROPIC_API_KEY) yo‘q — AI yordamchi va xulosalar tayyor namunalar asosida ishlaydi."
          }
        />
        <Row
          emoji="📨"
          color="#e5f3fd"
          title="Telegram bot"
          badge={<Badge tone={bot.connected ? "good" : "gray"}>{bot.connected ? (bot.username ? `● @${bot.username}` : "● Ulangan") : "Ulanmagan"}</Badge>}
          text={
            bot.connected
              ? "Eslatmalar, yozilish tasdiqlari va mutaxassis xabarlari bot orqali yuboriladi."
              : "TELEGRAM_BOT_TOKEN ko‘rsatilmagan — bildirishnomalar yuborilmaydi, ilova esa to‘liq ishlaydi."
          }
        />
      </div>

      <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
        <div>
          <div className="text-sm font-extrabold text-ink">Rolni almashtirish</div>
          <p className="mb-2 mt-0.5 text-[13px] text-muted">Ota-ona va mutaxassis kabinetlari bitta ma’lumotlar bazasi bilan ishlaydi.</p>
          <RoleSwitch />
        </div>
        <div>
          <div className="text-sm font-extrabold text-ink">Demo ma’lumotlar</div>
          <p className="mb-2 mt-0.5 text-[13px] text-muted">Har bir mehmondan keyin boshlang‘ich holatga qaytaring.</p>
          <Button variant="secondary" block loading={busy} onClick={reset}>
            {!busy && <RotateCcw className="h-4 w-4" />}
            Demo ma’lumotlarni tiklash
          </Button>
        </div>
      </div>
      {confirmUi}
    </Card>
  );
}
