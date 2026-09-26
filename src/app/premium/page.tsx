"use client";

import confetti from "canvas-confetti";
import { Check, Lock, Minus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { FAQ } from "@/data/faq";
import { SPECIALISTS } from "@/data/specialists";
import { safeAct } from "@/components/account/act";
import { useConfirm } from "@/components/account/confirm";
import { FaqList } from "@/components/account/faq-list";
import { premiumInfo, untilLabel } from "@/components/account/meta";
import { PaymentSheet, PERIODS, YEAR_SAVING, type PremiumPeriod } from "@/components/account/payment-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, EmojiTile, PageHeader, Section } from "@/components/ui/misc";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { PREMIUM_FEATURES, PREMIUM_PRICES, SPECIALTIES } from "@/lib/constants";
import { useView } from "@/lib/client/hooks";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { Specialist } from "@/lib/types";
import { cn, formatMoney } from "@/lib/utils";

const PERKS = [
  { emoji: "👩‍🏫", title: "Ustoz AI — cheksiz", text: "Kuniga 3 ta savol o‘rniga cheksiz suhbat va darslar", color: "#efeaff" },
  { emoji: "📹", title: "AI video nazorat", text: "Mashq to‘g‘ri bajarilganini kamera orqali tekshirish", color: "#e7f0fb" },
  { emoji: "📞", title: "Bepul konsultatsiya", text: `Har oy 1 ta mutaxassis konsultatsiyasi (${formatMoney(PREMIUM_PRICES.consultation)} qiymatida)`, color: "#fcecf2" },
  { emoji: "📁", title: "PDF hisobot", text: "Mutaxassis uchun batafsil rivojlanish hisoboti", color: "#e3f6ef" },
];

const TOP_SPECIALISTS: Specialist[] = [...SPECIALISTS].sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount).slice(0, 4);

const FULL_YEAR = PREMIUM_PRICES.month * 12;

function celebrate() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#8b6cff", "#5b3fe0", "#ffd65a", "#38bdf8", "#e87ba4"], disableForReducedMotion: true });
}

export default function PremiumPage() {
  const view = useView();
  const prem = premiumInfo(view.user.premium);
  const [pay, setPay] = useState<PremiumPeriod | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, confirmUi] = useConfirm();
  const premiumFaq = FAQ.filter((f) => f.category === "premium");
  const paidActive = prem.active && !prem.trial;

  const startTrial = async () => {
    setBusy(true);
    const r = await safeAct({ type: "user.premium", plan: "premium", trial: true }, { silent: true });
    setBusy(false);
    if (r.ok) {
      haptic("success");
      celebrate();
      toast.success("7 kunlik bepul sinov boshlandi!", "🎁");
    } else {
      toast.error(r.error ?? "Faollashtirib bo‘lmadi");
    }
  };

  const cancel = async () => {
    const ok = await confirm({
      title: "Premium’ni bekor qilasizmi?",
      emoji: "🥺",
      text: "Cheksiz Ustoz AI, AI video nazorat va bepul konsultatsiya yopiladi. Bu demo — istalgan vaqtda qayta yoqishingiz mumkin.",
      confirmLabel: "Ha, bekor qilish",
      cancelLabel: "Premium qolsin",
      tone: "danger",
    });
    if (!ok) return;
    const r = await safeAct({ type: "user.premium", plan: "free" }, { silent: true });
    if (r.ok) toast.success("Bepul tarifga o‘tdingiz", "👋");
    else toast.error(r.error ?? "Bekor qilib bo‘lmadi");
  };

  return (
    <div>
      <PageHeader title="Premium tarif" subtitle="Farzandingiz rivojlanishi uchun kengaytirilgan imkoniyatlar" emoji="💎" />

      {/* ------------------------------------------------ Hero */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#8b6cff] to-[#5b3fe0] p-6 text-white shadow-[0_24px_50px_-24px_rgb(91_63_224/0.8)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-60 w-60 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute right-8 top-8 hidden animate-float text-[96px] leading-none drop-shadow-[0_12px_24px_rgb(40_20_120/0.45)] md:block">
          💎
        </div>
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wide ring-1 ring-white/25">
            💎 YuniQo Premium
          </span>
          <h2 className="mt-3 max-w-xl text-[27px] font-black leading-[1.15] sm:text-[34px]">Farzandingiz rivojlanishi uchun to‘liq imkoniyatlar</h2>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-white/85">
            Cheksiz Ustoz AI, AI video nazorat, oyiga 1 ta bepul mutaxassis konsultatsiyasi va batafsil rivojlanish hisoboti.
          </p>

          <div className="mt-5 max-w-md rounded-2xl bg-white/15 p-4 ring-1 ring-white/25 backdrop-blur-sm">
            {paidActive ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black">✅ Premium faol</span>
                  <span className="text-sm font-bold text-white/85">{prem.period === "year" ? "Yillik tarif" : "Oylik tarif"}</span>
                </div>
                <div className="mt-1 text-sm text-white/85">
                  {prem.until ? `${untilLabel(prem.until)} · ` : ""}
                  {prem.daysText}
                </div>
                {prem.until && <ProgressBar value={prem.daysLeft} max={prem.period === "year" ? 365 : 30} color="#ffffff" trackClassName="mt-3 bg-white/20" height={6} />}
              </>
            ) : prem.trial ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black">🎁 Sinov davri</span>
                  <span className="text-sm font-bold text-white/85">{prem.daysText}</span>
                </div>
                <div className="mt-1 text-sm text-white/85">
                  {prem.until ? `${untilLabel(prem.until)} barcha imkoniyatlar ochiq. ` : ""}Davom ettirish uchun obunani tanlang.
                </div>
                <ProgressBar value={prem.daysLeft} max={7} color="#ffffff" trackClassName="mt-3 bg-white/20" height={6} />
              </>
            ) : prem.expired ? (
              <>
                <div className="font-black">⌛ Premium muddati tugagan</div>
                <div className="mt-1 text-sm text-white/85">Obunani yangilang — barcha natijalar va reja saqlanib qolgan.</div>
              </>
            ) : (
              <>
                <div className="font-black">Hozirgi tarif: Bepul</div>
                <div className="mt-1 text-sm text-white/85">7 kun bepul sinab ko‘ring — karta talab qilinmaydi.</div>
              </>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {!prem.active && (
              <Button size="lg" variant="secondary" className="border-transparent text-[#5b3fe0] hover:border-transparent hover:bg-white/90" loading={busy} onClick={startTrial}>
                🎁 7 kun bepul sinab ko‘rish
              </Button>
            )}
            {!paidActive && (
              <Button
                size="lg"
                variant={prem.active ? "secondary" : "ghost"}
                className={prem.active ? "border-transparent text-[#5b3fe0] hover:border-transparent hover:bg-white/90" : "bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25"}
                onClick={() => setPay("year")}
              >
                Sotib olish — oyiga {formatMoney(Math.round(PREMIUM_PRICES.year / 12))}dan
              </Button>
            )}
            {paidActive && (
              <>
                <Button size="lg" variant="secondary" className="border-transparent text-[#5b3fe0] hover:border-transparent hover:bg-white/90" href="/ustoz">
                  👩‍🏫 Ustoz AI’ni ochish
                </Button>
                <Button size="lg" variant="ghost" className="bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25" href="/ai-check">
                  📹 AI video nazorat
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ Afzalliklar */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {PERKS.map((p) => (
          <div key={p.title} className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <EmojiTile emoji={p.emoji} color={p.color} size={44} />
            <div className="mt-2.5 text-[15px] font-extrabold leading-snug text-ink">{p.title}</div>
            <div className="mt-0.5 text-[13px] leading-snug text-muted">{p.text}</div>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------ Tariflar */}
      <Section title="Tariflar">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <PlanCard
            title="Bepul"
            emoji="🌱"
            price="0 so‘m"
            per="doimo bepul"
            features={["Rivojlanish baholashi", "Mashqlar (cheklangan)", "Ustoz AI — kuniga 3 savol", "Bepul tuman sessiyalari", "Ota-onalar hamjamiyati"]}
            action={
              !prem.active ? (
                <CurrentPill />
              ) : (
                <div className="py-2 text-center text-xs font-semibold text-muted">Premium tugagach avtomatik shu tarif</div>
              )
            }
          />
          <PlanCard
            title="Premium oylik"
            emoji="💎"
            price={formatMoney(PERIODS.month.price)}
            per="oyiga"
            features={["Barcha mashqlar va premium videolar", "Ustoz AI — cheksiz", "AI video nazorat", "Oyiga 1 ta bepul konsultatsiya", "Batafsil PDF hisobot"]}
            action={
              paidActive && prem.period === "month" ? (
                <CurrentPill premium />
              ) : (
                <Button variant="soft" block className="bg-[#efeaff] text-[#5b3fe0] hover:bg-[#e4dcff]" onClick={() => setPay("month")}>
                  {paidActive ? "Oylikka o‘tish" : "Sotib olish"}
                </Button>
              )
            }
          />
          <PlanCard
            title="Premium yillik"
            emoji="👑"
            price={formatMoney(PERIODS.year.price)}
            per="yiliga"
            oldPrice={formatMoney(FULL_YEAR)}
            note={`oyiga atigi ${formatMoney(Math.round(PREMIUM_PRICES.year / 12))} · ${formatMoney(FULL_YEAR - PREMIUM_PRICES.year)} tejaysiz`}
            ribbon="Eng foydali"
            discount={`−${YEAR_SAVING}%`}
            highlight
            features={["Oylik tarifning barcha imkoniyatlari", "12 ta bepul konsultatsiya (yiliga)", "Ustuvor qo‘llab-quvvatlash", "Yangi imkoniyatlar birinchi bo‘lib"]}
            action={
              paidActive && prem.period === "year" ? (
                <CurrentPill premium />
              ) : (
                <Button variant="premium" block onClick={() => setPay("year")}>
                  {paidActive ? "Yillikka o‘tish" : "Sotib olish"}
                </Button>
              )
            }
          />
        </div>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs font-semibold text-muted">
          <ShieldCheck className="h-3.5 w-3.5" />
          Xavfsiz to‘lov: Click · Payme · Uzum · Telegram Stars — istalgan vaqtda bekor qilish mumkin
        </p>
      </Section>

      {/* ------------------------------------------------ Solishtirish */}
      <Section title="Imkoniyatlarni solishtirish">
        <Card className="overflow-hidden">
          <table className="w-full table-fixed text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-muted">Imkoniyat</th>
                <th className="w-[24%] px-2 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-muted sm:w-[20%]">Bepul</th>
                <th className="w-[28%] bg-[#f6f3ff] px-2 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-[#5b3fe0] sm:w-[22%]">💎 Premium</th>
              </tr>
            </thead>
            <tbody>
              {PREMIUM_FEATURES.map((f) => (
                <tr key={f.title} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="shrink-0 text-lg leading-none">{f.emoji}</span>
                      <span className="text-sm font-bold leading-snug text-ink">{f.title}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <FeatureCell value={f.free} />
                  </td>
                  <td className="bg-[#f6f3ff] px-2 py-3 text-center">
                    <FeatureCell value={f.premium} premium />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        {!prem.active && (
          <div className="mt-4 flex justify-center">
            <Button variant="premium" size="lg" loading={busy} onClick={startTrial}>
              🎁 7 kun bepul sinab ko‘rish
            </Button>
          </div>
        )}
      </Section>

      {/* ------------------------------------------------ Konsultatsiyalar */}
      <Section title="📞 Premium konsultatsiyalar">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[330px_minmax(0,1fr)]">
            <div className="bg-gradient-to-br from-[#f6f3ff] to-white p-5">
              <p className="text-[15px] leading-relaxed text-ink-2">
                Premium obunachilarga har oy <b className="text-ink">1 ta mutaxassis konsultatsiyasi bepul</b> — odatda{" "}
                {formatMoney(PREMIUM_PRICES.consultation)}. Online yoki offline, o‘zingiz tanlagan mutaxassis bilan.
              </p>
              <ConsultationCounter paidActive={paidActive} trial={prem.trial} left={prem.consultationsLeft} />
              <ol className="mt-4 space-y-2">
                {["Mutaxassisni tanlang", "Qulay kun va vaqtni belgilang", "Yozilishda bepul konsultatsiya avtomatik qo‘llanadi"].map((s, i) => (
                  <li key={s} className="flex items-start gap-2.5 text-sm font-semibold text-ink-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#efeaff] text-xs font-black text-[#5b3fe0]">{i + 1}</span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-ink-2">⭐ Eng yuqori baholangan mutaxassislar</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {TOP_SPECIALISTS.map((sp) => (
                  <SpecialistMini key={sp.id} sp={sp} free={paidActive && prem.consultationsLeft > 0} />
                ))}
              </div>
              <Button variant="ghost" block className="mt-3" href="/specialists">
                Barcha mutaxassislar →
              </Button>
            </div>
          </div>
        </Card>
      </Section>

      {/* ------------------------------------------------ FAQ */}
      {premiumFaq.length > 0 && (
        <Section title="Savol-javob" href="/help" linkLabel="Barcha savollar">
          <FaqList items={premiumFaq} />
        </Section>
      )}

      {prem.active && (
        <div className="mt-8 text-center">
          <button type="button" onClick={cancel} className="text-sm font-bold text-muted underline-offset-4 hover:text-danger hover:underline">
            Premium’ni bekor qilish (demo)
          </button>
        </div>
      )}

      {pay && <PaymentSheet period={pay} onClose={() => setPay(null)} />}
      {confirmUi}
    </div>
  );
}

// ---------------------------------------------------------------------------

function CurrentPill({ premium }: { premium?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-11 items-center justify-center gap-1.5 rounded-2xl text-[15px] font-bold",
        premium ? "bg-[#efeaff] text-[#5b3fe0]" : "bg-slate-100 text-ink-2",
      )}
    >
      <Check className="h-4 w-4" strokeWidth={3} />
      Joriy tarif
    </div>
  );
}

function PlanCard({
  title,
  emoji,
  price,
  per,
  oldPrice,
  note,
  ribbon,
  discount,
  highlight,
  features,
  action,
}: {
  title: string;
  emoji: string;
  price: string;
  per: string;
  oldPrice?: string;
  note?: string;
  ribbon?: string;
  discount?: string;
  highlight?: boolean;
  features: string[];
  action: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border bg-white p-5 shadow-card",
        highlight ? "border-[#b9a6ff] ring-2 ring-[#8b6cff]/40 md:-translate-y-1" : "border-line",
      )}
    >
      {ribbon && (
        <span className="absolute -top-3 left-5 rounded-full bg-gradient-to-br from-[#8b6cff] to-[#5b3fe0] px-3 py-1 text-xs font-black text-white shadow-[0_8px_16px_-8px_rgb(91_63_224/0.8)]">
          ⭐ {ribbon}
        </span>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{emoji}</span>
          <span className="text-[17px] font-extrabold text-ink">{title}</span>
        </div>
        {discount && <Badge tone="good">{discount}</Badge>}
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[28px] font-black leading-none text-ink">{price}</span>
        <span className="text-sm font-bold text-muted">/ {per}</span>
      </div>
      {oldPrice && <div className="mt-1 text-sm font-semibold text-faint line-through">{oldPrice}</div>}
      {note && <div className="mt-1 text-[13px] font-bold text-[#006300]">{note}</div>}
      <ul className="mb-5 mt-4 flex-1 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm font-semibold text-ink-2">
            <Check className={cn("mt-0.5 h-4 w-4 shrink-0", highlight ? "text-[#5b3fe0]" : "text-good")} strokeWidth={3} />
            {f}
          </li>
        ))}
      </ul>
      {action}
    </div>
  );
}

function FeatureCell({ value, premium }: { value: boolean | string; premium?: boolean }) {
  if (value === true) {
    return (
      <span className="inline-grid place-items-center">
        <Check className={cn("h-5 w-5", premium ? "text-[#5b3fe0]" : "text-good")} strokeWidth={3} aria-hidden />
        <span className="sr-only">Bor</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-grid place-items-center">
        <Minus className="h-5 w-5 text-faint" aria-hidden />
        <span className="sr-only">Yo‘q</span>
      </span>
    );
  }
  return <span className={cn("text-[13px] font-bold leading-snug", premium ? "text-[#5b3fe0]" : "text-ink-2")}>{value}</span>;
}

function ConsultationCounter({ paidActive, trial, left }: { paidActive: boolean; trial: boolean; left: number }) {
  let title: string;
  let sub: string;
  if (paidActive) {
    title = left > 0 ? `Bu oy ${left} ta bepul konsultatsiya qoldi` : "Bu oylik bepul konsultatsiya ishlatilgan";
    sub = left > 0 ? "Mutaxassisga yozilishda avtomatik qo‘llanadi" : "Keyingi oy yana 1 ta beriladi";
  } else if (trial) {
    title = "Sinov davrida bepul konsultatsiya kirmaydi";
    sub = "To‘liq obunada — har oy 1 ta";
  } else {
    title = "Premium bilan oyiga 1 ta bepul";
    sub = "Obunasiz — mutaxassis narxida";
  }
  return (
    <div className="mt-4 flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-[#e4dcff]">
      <ProgressRing value={paidActive ? Math.min(1, left) : 0} size={60} stroke={6} color="#7c5cff" track="#efeaff">
        {paidActive ? <span className="text-xl font-black text-ink">{left}</span> : <Lock className="h-5 w-5 text-[#7c5cff]" />}
      </ProgressRing>
      <div className="min-w-0">
        <div className="font-extrabold leading-snug text-ink">{title}</div>
        <div className="mt-0.5 text-xs font-semibold text-muted">{sub}</div>
      </div>
    </div>
  );
}

function SpecialistMini({ sp, free }: { sp: Specialist; free: boolean }) {
  const prices = [sp.priceOnline, sp.priceOffline].filter((p): p is number => typeof p === "number");
  const from = prices.length ? Math.min(...prices) : undefined;
  const spec = SPECIALTIES[sp.specialty];
  return (
    <div className="flex flex-col rounded-2xl border border-line p-3 transition hover:border-[#d9ceff]">
      <div className="flex items-start gap-3">
        <Avatar name={sp.name} color={sp.color} size={46} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate font-extrabold text-ink">{sp.name}</span>
            {sp.verified && <span className="shrink-0 text-xs text-brand-500" title="Tasdiqlangan mutaxassis">✔︎</span>}
          </div>
          <div className="truncate text-[13px] text-muted">
            {spec.emoji} {spec.label} · {sp.experienceYears} yil
          </div>
          <div className="mt-0.5 text-xs font-bold text-ink-2">
            ⭐ {sp.rating.toFixed(1)} <span className="font-semibold text-muted">({sp.reviewsCount} ta sharh)</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="min-w-0 text-[13px] leading-tight">
          {from !== undefined && (
            <div className={cn("font-bold", free ? "text-faint line-through" : "text-ink-2")}>{formatMoney(from)}dan</div>
          )}
          {free && <div className="font-extrabold text-[#5b3fe0]">Premium bilan bepul</div>}
        </div>
        <Button size="sm" variant="premium" href={`/specialists/${sp.id}`}>
          Yozilish
        </Button>
      </div>
    </div>
  );
}
