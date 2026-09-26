"use client";

import confetti from "canvas-confetti";
import { Check, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { PREMIUM_PRICES } from "@/lib/constants";
import { useView } from "@/lib/client/hooks";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import { cn, formatMoney, sleep } from "@/lib/utils";
import { safeAct } from "./act";
import { untilLabel } from "./meta";

export type PremiumPeriod = "month" | "year";

type MethodId = "click" | "payme" | "uzum" | "stars";

const METHODS: { id: MethodId; name: string; sub: string; logo: React.ReactNode; bg: string; fg: string }[] = [
  { id: "click", name: "Click", sub: "Uzcard · Humo", logo: "click", bg: "linear-gradient(135deg, #1a9bff, #0066ff)", fg: "#fff" },
  { id: "payme", name: "Payme", sub: "Karta orqali", logo: "payme", bg: "linear-gradient(135deg, #2fd3d0, #00a8b5)", fg: "#fff" },
  { id: "uzum", name: "Uzum Bank", sub: "Uzum ilovasi", logo: "uzum", bg: "linear-gradient(135deg, #8a3dff, #6200ee)", fg: "#fff" },
  { id: "stars", name: "Telegram Stars", sub: "Telegram’da", logo: <span className="text-xl leading-none">⭐</span>, bg: "linear-gradient(135deg, #ffd65a, #f5a300)", fg: "#3d2800" },
];

export const PERIODS: Record<PremiumPeriod, { label: string; per: string; price: number }> = {
  month: { label: "Oylik", per: "oyiga", price: PREMIUM_PRICES.month },
  year: { label: "Yillik", per: "yiliga", price: PREMIUM_PRICES.year },
};

/** Yillik tarifdagi tejash foizi (79 000 × 12 ga nisbatan) */
export const YEAR_SAVING = Math.round((1 - PREMIUM_PRICES.year / (PREMIUM_PRICES.month * 12)) * 100);

const UNLOCKED = ["Ustoz AI — cheksiz", "AI video nazorat", "Oyiga 1 ta bepul konsultatsiya", "Batafsil PDF hisobot"];

/**
 * Premium to‘lov oynasi (demo): usul tanlash → 1.2 s «ishlov berish» → faollashtirish.
 * Ochilganda render qiling: {period && <PaymentSheet period={period} onClose={…} />}
 */
export function PaymentSheet({ period: initial, onClose }: { period: PremiumPeriod; onClose: () => void }) {
  const view = useView();
  const [period, setPeriod] = useState<PremiumPeriod>(initial);
  const [method, setMethod] = useState<MethodId>("click");
  const [step, setStep] = useState<"choose" | "processing" | "done">("choose");
  const [receipt, setReceipt] = useState("");
  const p = PERIODS[period];

  const close = () => {
    if (step !== "processing") onClose();
  };

  const pay = async () => {
    setStep("processing");
    await sleep(1200);
    const r = await safeAct({ type: "user.premium", plan: "premium", period }, { silent: true });
    if (!r.ok) {
      toast.error(r.error ?? "To‘lov amalga oshmadi. Qayta urinib ko‘ring");
      setStep("choose");
      return;
    }
    setReceipt(`YQ-${Math.floor(100000 + Math.random() * 900000)}`);
    setStep("done");
    haptic("success");
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.65 }, colors: ["#8b6cff", "#5b3fe0", "#ffd65a", "#38bdf8", "#e87ba4"], disableForReducedMotion: true });
  };

  const methodName = METHODS.find((m) => m.id === method)?.name ?? "";

  if (step === "done") {
    return (
      <Sheet open onClose={onClose} size="sm" title="">
        <div className="flex flex-col items-center pb-2 text-center">
          <div className="grid h-20 w-20 animate-pop place-items-center rounded-[28px] bg-gradient-to-br from-[#8b6cff] to-[#5b3fe0] text-4xl shadow-[0_14px_30px_-12px_rgb(91_63_224/0.8)]">💎</div>
          <div className="mt-4 text-2xl font-black text-ink">Tabriklaymiz!</div>
          <p className="mt-1 text-[15px] text-ink-2">
            YuniQo Premium faollashtirildi
            {view.user.premium.until && (
              <>
                {" — "}
                <b>{untilLabel(view.user.premium.until)}</b>
              </>
            )}
          </p>
          <div className="mt-4 w-full rounded-2xl bg-[#f6f3ff] p-4 text-left ring-1 ring-[#e4dcff]">
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#5b3fe0]">Endi sizga ochiq</div>
            <ul className="space-y-1.5">
              {UNLOCKED.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Check className="h-4 w-4 text-[#5b3fe0]" strokeWidth={3} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3 text-xs font-semibold text-muted">
            Chek: {receipt} · {methodName} · {formatMoney(p.price)} (demo)
          </div>
          <div className="mt-5 flex w-full flex-col gap-2">
            <Button variant="premium" size="lg" block onClick={onClose}>
              Ajoyib!
            </Button>
            <Button variant="ghost" block href="/ustoz">
              👩‍🏫 Ustoz AI bilan boshlash
            </Button>
          </div>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      onClose={close}
      size="md"
      title="💎 Premium’ga obuna"
      footer={
        <div className="space-y-2">
          <Button variant="premium" size="lg" block loading={step === "processing"} onClick={pay}>
            {step === "processing" ? "To‘lov amalga oshirilmoqda…" : `${formatMoney(p.price)} to‘lash`}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-muted">
            <ShieldCheck className="h-3.5 w-3.5" />
            Xavfsiz to‘lov · istalgan vaqtda bekor qilish mumkin
          </p>
        </div>
      }
    >
      <div className={cn("space-y-5 pt-2", step === "processing" && "pointer-events-none opacity-60")}>
        {/* Tarif */}
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PERIODS) as PremiumPeriod[]).map((k) => {
            const it = PERIODS[k];
            const on = k === period;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setPeriod(k)}
                className={cn(
                  "relative rounded-2xl border-2 p-3 text-left transition",
                  on ? "border-[#7c5cff] bg-[#f6f3ff]" : "border-line bg-white hover:border-[#d9ceff]",
                )}
              >
                {k === "year" && (
                  <Badge tone="good" className="absolute -top-2.5 right-2 bg-[#e3f6e3]">
                    −{YEAR_SAVING}%
                  </Badge>
                )}
                <div className="text-sm font-extrabold text-ink-2">{it.label}</div>
                <div className="mt-0.5 text-lg font-black text-ink">{formatMoney(it.price)}</div>
                <div className="text-xs font-semibold text-muted">{k === "year" ? `oyiga ${formatMoney(Math.round(it.price / 12))}` : it.per}</div>
              </button>
            );
          })}
        </div>

        {/* To‘lov usuli */}
        <div>
          <div className="mb-2 text-sm font-extrabold text-ink-2">To‘lov usuli</div>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => {
              const on = m.id === method;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    haptic("select");
                    setMethod(m.id);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl border-2 p-2.5 text-left transition",
                    on ? "border-[#7c5cff] bg-[#f6f3ff]" : "border-line bg-white hover:border-[#d9ceff]",
                  )}
                  aria-pressed={on}
                >
                  <span
                    className="grid h-10 w-[52px] shrink-0 place-items-center rounded-xl text-[12.5px] font-black lowercase tracking-tight shadow-sm"
                    style={{ background: m.bg, color: m.fg }}
                  >
                    {m.logo}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold leading-tight text-ink">{m.name}</span>
                    <span className="mt-0.5 block truncate text-[11.5px] font-semibold text-muted">{m.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hisob */}
        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between font-semibold text-ink-2">
            <span>YuniQo Premium · {p.label.toLowerCase()}</span>
            <span>{formatMoney(p.price)}</span>
          </div>
          {period === "year" && (
            <div className="mt-1 flex justify-between font-semibold text-[#006300]">
              <span>Tejaysiz</span>
              <span>−{formatMoney(PREMIUM_PRICES.month * 12 - PREMIUM_PRICES.year)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-black text-ink">
            <span>Jami</span>
            <span>{formatMoney(p.price)}</span>
          </div>
        </div>

        <div className="flex gap-3 rounded-2xl bg-warn/10 p-3.5 text-[13px] leading-relaxed text-ink-2 ring-1 ring-warn/25">
          <span className="text-lg leading-none">🧪</span>
          <div>
            <b>Demo to‘lov.</b> Ko‘rgazma uchun to‘lov jarayoni simulyatsiya qilinadi — kartangizdan pul yechilmaydi.
          </div>
        </div>
      </div>
    </Sheet>
  );
}
