"use client";

import { ArrowRight } from "lucide-react";
import { ARTICLES } from "@/data/articles";
import { QUESTIONS } from "@/data/assessment";
import { EXERCISES } from "@/data/exercises";
import { GAMES } from "@/data/games";
import { LESSON_QUESTIONS } from "@/data/lessons";
import { PRODUCTS } from "@/data/products";
import { sessionStats } from "@/data/sessions";
import { SPECIALISTS } from "@/data/specialists";
import { VIDEOS } from "@/data/videos";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogoMark } from "@/components/ui/logo";
import { Section } from "@/components/ui/misc";
import { PREMIUM_PRICES } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";

const FLOW = [
  ["🧠", "Bahola"],
  ["🎯", "Reja tuz"],
  ["🤖", "AI bilan mashq qil"],
  ["📹", "Video orqali tekshir"],
  ["📊", "Natijani yig‘"],
  ["👨‍⚕️", "Mutaxassisga ko‘rsat"],
  ["📈", "Rivojlanishni kuzat"],
  ["🛒", "Kerakli mahsulotni top"],
  ["👨‍👩‍👧", "Hamjamiyatdan yordam ol"],
];

export default function AboutPage() {
  const s = sessionStats();
  const numbers: [string, string][] = [
    [`${EXERCISES.length}`, "uy mashqlari (logoped, defektolog, motorika)"],
    [`${QUESTIONS.length}`, "savolli rivojlanish savolnomasi (3 yosh guruhi)"],
    [`${LESSON_QUESTIONS.length}`, "AI dars savollari"],
    [`${GAMES.length}`, "rivojlantiruvchi o‘yin"],
    [`${VIDEOS.length}`, "rivojlantiruvchi video"],
    [`${ARTICLES.length}`, "o‘zbek tilidagi maqola"],
    [`${SPECIALISTS.length}`, "mutaxassis, 10 yo‘nalish"],
    [`${s.districts}`, `tuman va shahar (${s.regions} hudud)`],
    [`${PRODUCTS.length}`, "market mahsuloti"],
    ["19", "Telegram bot funksiyasi"],
    ["6", "AI video nazorat mashqi"],
    ["8", "talaffuz tovushi (AI tahlil)"],
  ];
  return (
    <div className="animate-fade-up">
      <div className="relative overflow-hidden rounded-[36px] bg-brand-gradient p-7 text-white shadow-brand sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white p-1.5">
              <LogoMark size={52} />
            </div>
            <div>
              <div className="text-4xl font-black">YuniQo</div>
              <div className="font-bold text-white/85">Har bir bola uchun imkoniyat</div>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-relaxed text-white/95 sm:text-xl">
            YuniQo — oddiy “bolalar uchun mashqlar ilovasi” emas. U <b>bola + ota-ona + AI + mutaxassis + bepul hududiy sessiyalar + market</b>ni yagona tizimga birlashtiradi.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/" variant="secondary" className="border-0 text-brand-700">
              ▶️ Demo’ni ko‘rish
            </Button>
            <Button href="/bot" variant="ghost" className="bg-white/15 text-white hover:bg-white/25">
              🤖 Telegram bot
            </Button>
          </div>
        </div>
      </div>

      <Section title="⭐ YuniQo konsepti">
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            {FLOW.map(([e, t], i) => (
              <div key={t} className="flex items-center gap-2">
                <span className="flex items-center gap-2 rounded-2xl bg-brand-50 px-3 py-2 text-sm font-extrabold text-ink">
                  <span className="text-lg">{e}</span>
                  {t}
                </span>
                {i < FLOW.length - 1 && <ArrowRight className="h-4 w-4 text-brand-300" />}
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <div className="mt-2 grid gap-5 lg:grid-cols-2">
        <Section title="😟 Muammo">
          <Card className="space-y-3 p-5 text-[15px] leading-relaxed text-ink-2">
            {[
              "Ota-ona bolaning rivojlanishida muammo borligini kech payqaydi va qayerdan boshlashni bilmaydi.",
              "Logoped, defektolog va reabilitologlar asosan yirik shaharlarda; tumanlarda ularga yetib borish qiyin.",
              "Uyda qilinadigan mashqlar nazoratsiz qoladi — to‘g‘ri bajarilayaptimi, natija bormi, noma’lum.",
              "Natijalar turli daftar, xulosa va telefonlarda tarqoq — mutaxassis har safar noldan boshlaydi.",
              "O‘zbek tilidagi ishonchli, sodda va amaliy ma’lumotlar yetishmaydi.",
            ].map((t) => (
              <p key={t} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-danger/70" />
                {t}
              </p>
            ))}
          </Card>
        </Section>
        <Section title="💡 Yechim">
          <Card className="space-y-3 p-5 text-[15px] leading-relaxed text-ink-2">
            {[
              "AI yordamida 5 daqiqalik baholash va avtomatik individual rivojlanish rejasi.",
              "Uy mashqlari: qadam-baqadam ko‘rsatmalar, AI video nazorat va talaffuz tahlili — mashq to‘g‘ri bajarilganini tekshiradi.",
              "Barcha natijalar bitta «Rivojlanish pasporti»ga yig‘iladi va QR orqali mutaxassisga ko‘rsatiladi.",
              "Mutaxassis kabineti: topshiriq berish, natijani kuzatish, hamkasblar bilan ma’lumot almashish.",
              "Har bir tumanda bepul YuniQo sessiyalari va Telegram bot orqali yozilish va eslatmalar.",
            ].map((t) => (
              <p key={t} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-good" />
                {t}
              </p>
            ))}
          </Card>
        </Section>
      </div>

      <Section title="👥 Kimlar uchun">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["👨‍👩‍👧", "Ota-onalar", "Baholash, reja, uy mashqlari, AI yordamchi, eslatmalar, hamjamiyat"],
            ["👩‍⚕️", "Mutaxassislar", "Tayyor hisobot, masofaviy topshiriq va nazorat, yangi mijozlar"],
            ["🏫", "Markazlar va bog‘chalar", "Guruhlar monitoringi, hududiy sessiyalar, uy dasturlari"],
            ["🏛️", "Hududlar", "Har bir tumanda bepul sessiyalar, erta aniqlash va yo‘naltirish"],
          ].map(([e, t, d]) => (
            <Card key={t} className="p-4">
              <div className="text-3xl">{e}</div>
              <div className="mt-2 font-black text-ink">{t}</div>
              <div className="text-sm text-muted">{d}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="🤖 Texnologiyalar">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["✨", "Claude AI", "AI yordamchi, baholash xulosasi, individual reja va mashqlar, mutaxassis uchun hisobot qoralamasi"],
            ["📹", "MediaPipe", "Kamera orqali tana va yuz harakatlarini qurilmaning o‘zida tahlil qilish — video yuborilmaydi"],
            ["🎙️", "Nutq tahlili", "Talaffuzni aniqlash, nafas va ovoz kuchi mashqlari (mikrofon)"],
            ["📱", "Telegram Mini App", "Bot + web ilova yagona hisobda, initData orqali xavfsiz kirish"],
          ].map(([e, t, d]) => (
            <Card key={t} className="p-4">
              <div className="text-3xl">{e}</div>
              <div className="mt-2 font-black text-ink">{t}</div>
              <div className="text-sm text-muted">{d}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="📊 Platforma raqamlarda">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {numbers.map(([n, t]) => (
            <Card key={t} className="p-4">
              <div className="text-3xl font-black text-brand-600">{n}</div>
              <div className="text-sm font-semibold text-ink-2">{t}</div>
            </Card>
          ))}
        </div>
      </Section>

      <div className="mt-2 grid gap-5 lg:grid-cols-2">
        <Section title="💰 Biznes-model">
          <Card className="space-y-3 p-5">
            {[
              ["💎", "Premium obuna", `${formatMoney(PREMIUM_PRICES.month)}/oy yoki ${formatMoney(PREMIUM_PRICES.year)}/yil — AI yordamchi, AI video nazorat, batafsil hisobot`],
              ["📞", "Konsultatsiyalar", "Online/offline mutaxassis qabullari — platforma komissiyasi"],
              ["🛒", "YuniQo Market", "Rivojlantiruvchi va logopedik mahsulotlar savdosi — hamkorlardan ulush"],
              ["🏢", "B2B / B2G", "Markazlar, bog‘chalar va hududlar uchun litsenziya va bepul sessiyalar dasturi"],
            ].map(([e, t, d]) => (
              <div key={t} className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xl">{e}</span>
                <div>
                  <div className="font-extrabold text-ink">{t}</div>
                  <div className="text-sm text-muted">{d}</div>
                </div>
              </div>
            ))}
          </Card>
        </Section>
        <Section title="🗺️ Rivojlanish rejasi">
          <Card className="p-5">
            <ol className="space-y-3">
              {[
                ["✅", "MVP", "Web ilova + Telegram bot, AI baholash, mashqlar, AI video nazorat, mutaxassis kabineti"],
                ["🧪", "Pilot", "Bir nechta tumanda bepul sessiyalar va mutaxassislar bilan sinov"],
                ["🤝", "Tarmoq", "Mutaxassislar va reabilitatsiya markazlari bilan hamkorlik, tasdiqlash tizimi"],
                ["🚀", "Masshtab", "Barcha hududlarda sessiyalar, mobil ilova, o‘zbek tilidagi nutq modeli"],
              ].map(([e, t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-xl">{e}</span>
                  <div>
                    <div className="font-extrabold text-ink">{t}</div>
                    <div className="text-sm text-muted">{d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </Section>
      </div>

      <Card className="mt-7 flex flex-col items-center gap-3 p-6 text-center">
        <div className="text-2xl font-black text-ink">Har bir bola uchun imkoniyat 💙</div>
        <p className="max-w-xl text-sm text-muted">YuniQo tibbiy tashxis qo‘ymaydi — u ota-ona va mutaxassisning ishini osonlashtiradi, bolaning rivojlanishini muntazam va o‘lchanadigan qiladi.</p>
        <div className="flex gap-2">
          <Button href="/">Demo’ni boshlash</Button>
          <Button href="/specialist" variant="secondary">
            Mutaxassis kabineti
          </Button>
        </div>
      </Card>
    </div>
  );
}
