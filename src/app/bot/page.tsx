"use client";

import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { InfoNote, PageHeader } from "@/components/ui/misc";
import { useApp } from "@/lib/client/store";
import { openExternal } from "@/lib/client/telegram";

const BOT_FEATURES: [string, string][] = [
  ["👶", "Bola profilini yaratish"],
  ["📝", "Boshlang‘ich savolnoma"],
  ["🧠", "Dastlabki rivojlanish baholashi"],
  ["🎯", "Mashqlarni tavsiya qilish"],
  ["🔔", "Kunlik mashq eslatmalari"],
  ["📅", "Bepul sessiyalarga yozilish"],
  ["📍", "Tumandagi sessiyalar haqida ma’lumot"],
  ["👨‍⚕️", "Mutaxassis topish"],
  ["📞", "Mutaxassis bilan bog‘lanish"],
  ["🏢", "Yaqin YuniQo sessiyasi haqida xabar"],
  ["📊", "Qisqa progress natijalari"],
  ["📁", "Rivojlanish hisobotini olish"],
  ["👨‍👩‍👧", "Ota-onalar hamjamiyatiga kirish"],
  ["🎥", "Rivojlantiruvchi videolarga yo‘naltirish"],
  ["🛒", "Marketga yo‘naltirish"],
  ["💎", "Premium obuna"],
  ["❓", "Savol-javob / FAQ"],
  ["📢", "YuniQo yangiliklari va tadbirlar"],
  ["🆘", "Qo‘llab-quvvatlash"],
];

const CHAT: { from: "bot" | "user"; text: string; buttons?: string[] }[] = [
  { from: "user", text: "/start" },
  {
    from: "bot",
    text: "Assalomu alaykum, Gulnoza! 👋\nYuniQo — Har bir bola uchun imkoniyat.\nQuyidagi menyudan kerakli bo‘limni tanlang.",
    buttons: ["🚀 YuniQo ilovasini ochish"],
  },
  { from: "user", text: "📊 Qisqa progress" },
  {
    from: "bot",
    text: "🦁 Amir — 🏆 Chempion, 🔥 12 kun seriya\n\n🗣️ Nutq  ▰▰▰▰▰▱▱▱ 63% ▲25\n🧠 Diqqat ▰▰▰▰▰▰▱▱ 75% ▲25\n🦶 Motorika ▰▰▰▰▰▰▱▱ 75% ▲12\n\nBu hafta: 27 ta mashg‘ulot (o‘tgan haftadan +4)",
    buttons: ["📈 Batafsil", "📁 Hisobot olish"],
  },
  { from: "user", text: "📅 Bepul sessiyalar" },
  {
    from: "bot",
    text: "🏢 Chilonzor tumani — yaqin sessiyalar:\n🩺 Chorshanba, 10:00 — Bepul konsultatsiya (7 joy)\n🎓 Shanba, 11:00 — Ota-onalar seminari (12 joy)",
    buttons: ["✅ Yozilish"],
  },
];

export default function BotPage() {
  const bot = useApp((s) => s.bot);
  const username = bot.username ?? "YuniQo_bot";
  const link = `https://t.me/${username}`;
  return (
    <div className="animate-fade-up">
      <PageHeader emoji="🤖" title="YuniQo Telegram bot" subtitle="Bot — tezkor yordam, yozilish, bildirishnoma va yo‘naltirish. Ilova — asosiy mahsulot. Ikkalasi bitta ma’lumotlar bazasida ishlaydi." />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="flex flex-col items-center p-6 text-center lg:col-span-2">
          <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <QRCodeSVG value={link} size={220} fgColor="#0f172a" level="M" imageSettings={{ src: "/icon.svg", height: 40, width: 40, excavate: true }} />
          </div>
          <div className="mt-4 text-2xl font-black text-ink">@{username}</div>
          <p className="mt-1 text-sm text-muted">Telefon kamerasi bilan skanerlang va botga /start yozing</p>
          <Button className="mt-4" onClick={() => openExternal(link)}>
            📱 Telegramda ochish
          </Button>
          {!bot.connected && <InfoNote className="mt-4 text-left" emoji="ℹ️">Bot hali ulanmagan: `.env.local` fayliga TELEGRAM_BOT_TOKEN va TELEGRAM_BOT_USERNAME yozib, `npm run dev:all` bilan ishga tushiring.</InfoNote>}
        </Card>

        <Card className="p-5 lg:col-span-3">
          <CardTitle>💬 Bot qanday ishlaydi</CardTitle>
          <div className="space-y-3 rounded-3xl bg-[#e7f1f9] p-4">
            {CHAT.map((m, i) => (
              <div key={i} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={m.from === "user" ? "max-w-[80%] rounded-2xl rounded-br-md bg-[#d9fdd3] px-3.5 py-2 text-sm font-semibold text-ink shadow-sm" : "max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-sm text-ink shadow-sm"}>
                  <div className="whitespace-pre-line leading-relaxed">{m.text}</div>
                  {m.buttons && (
                    <div className="mt-2 grid gap-1.5">
                      {m.buttons.map((b) => (
                        <span key={b} className="rounded-xl bg-[#e8f3fc] px-3 py-1.5 text-center text-xs font-bold text-[#1d8ad6]">
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <CardTitle>Botdagi 19 ta funksiya</CardTitle>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BOT_FEATURES.map(([e, t], i) => (
            <div key={t} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-card">{e}</span>
              <span className="text-sm font-bold text-ink-2">
                <span className="text-faint">{i + 1}.</span> {t}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ["🔗", "Yagona ma’lumot", "Botda yaratilgan profil va baholash ilovada darhol ko‘rinadi"],
          ["🔔", "Bildirishnomalar", "Yozilish, mutaxassis topshirig‘i va eslatmalar botga keladi"],
          ["🔐", "Xavfsiz kirish", "Mini App Telegram initData (HMAC) orqali tasdiqlanadi"],
        ].map(([e, t, d]) => (
          <Card key={t} className="p-4">
            <div className="text-2xl">{e}</div>
            <div className="mt-1 font-extrabold text-ink">{t}</div>
            <div className="text-sm text-muted">{d}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
