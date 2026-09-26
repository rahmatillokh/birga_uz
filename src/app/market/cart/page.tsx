"use client";

import confetti from "canvas-confetti";
import { Check, ChevronRight, Lock, Trash } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { OrdersList } from "@/components/market/orders";
import { ProductCard, QtyStepper } from "@/components/market/product-card";
import {
  cartLines,
  cartTotals,
  discountPct,
  FREE_DELIVERY_FROM,
  orderNo,
  PAYMENT_METHODS,
  paymentLabel,
  type CartLine,
} from "@/components/market/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { EmojiTile, EmptyState, PageHeader } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { PRODUCTS } from "@/data/products";
import { districtLabel, getRegion, REGIONS } from "@/data/regions";
import { useCart } from "@/lib/client/cart";
import { useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { ActResult, Order } from "@/lib/types";
import { cn, formatMoney, sleep } from "@/lib/utils";

type Payment = Order["payment"];

interface Placed {
  id: string;
  name: string;
  phone: string;
  address: string;
  payment: Payment;
  count: number;
  total: number;
  eta: string;
}

function etaFor(regionId: string) {
  return regionId === "toshkent-sh" ? "Toshkent bo‘ylab — 1 kun ichida" : "Viloyatlarga — 2–4 kun ichida";
}

export default function CartPage() {
  const view = useView();
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.set);
  const clear = useCart((s) => s.clear);
  const act = useApp((s) => s.act);

  const lines = useMemo(() => cartLines(items), [items]);
  const totals = cartTotals(lines);
  const [placed, setPlaced] = useState<Placed | null>(null);

  // Hash (#buyurtmalar) bilan kelinganda — buyurtmalarga aylantirish
  useEffect(() => {
    if (window.location.hash !== "#buyurtmalar") return;
    const t = setTimeout(() => document.getElementById("buyurtmalar")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    return () => clearTimeout(t);
  }, []);

  if (placed) {
    return (
      <div>
        <PageHeader back="/market" emoji="🛒" title="Buyurtma" subtitle="YuniQo Market" />
        <SuccessCard placed={placed} />
        <OrdersList orders={view.orders} highlightId={placed.id} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        back="/market"
        emoji="🛒"
        title="Savat"
        subtitle={totals.count ? `${totals.count} ta mahsulot · rasmiylashtirish` : "Tanlangan mahsulotlar va buyurtmalar"}
      />

      {lines.length === 0 ? (
        <EmptyCart />
      ) : (
        <Checkout
          lines={lines}
          totals={totals}
          onQty={setQty}
          onPlace={async (data) => {
            let res: ActResult;
            try {
              res = await act(
                {
                  type: "order.create",
                  items: lines.map((l) => ({ productId: l.product.id, qty: l.qty, price: l.product.price })),
                  address: data.address,
                  phone: data.phone,
                  payment: data.payment,
                },
                { silent: true },
              );
            } catch {
              res = { ok: false, error: "Internet aloqasini tekshirib, qayta urinib ko‘ring" };
            }
            if (!res.ok) {
              toast.error(res.error ?? "Buyurtmani yuborib bo‘lmadi");
              return false;
            }
            setPlaced({ ...data, id: res.createdId ?? "", count: totals.count, total: totals.total });
            clear();
            haptic("success");
            confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 }, colors: ["#38bdf8", "#0ea5e9", "#1baf7a", "#eda100", "#e87ba4"], disableForReducedMotion: true });
            window.scrollTo({ top: 0, behavior: "smooth" });
            return true;
          }}
        />
      )}

      <OrdersList orders={view.orders} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function Checkout({
  lines,
  totals,
  onQty,
  onPlace,
}: {
  lines: CartLine[];
  totals: ReturnType<typeof cartTotals>;
  onQty: (id: string, qty: number) => void;
  onPlace: (d: Omit<Placed, "id" | "count" | "total">) => Promise<boolean>;
}) {
  const { user, orders } = useView();
  const lastStreet = useMemo(() => {
    const last = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (!last) return "";
    return last.address
      .replace(/\s*\(qabul qiluvchi:[^)]*\)\s*$/, "")
      .split(", ")
      .slice(2)
      .join(", ");
  }, [orders]);

  const initialRegion = user.region && getRegion(user.region) ? user.region : "toshkent-sh";
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "+998 ");
  const [region, setRegion] = useState(initialRegion);
  const [district, setDistrict] = useState(() => {
    const r = getRegion(initialRegion);
    return user.district && r?.districts.includes(user.district) ? user.district : "";
  });
  const [street, setStreet] = useState(lastStreet);
  const [payment, setPayment] = useState<Payment>("click");
  const [tried, setTried] = useState(false);
  const [stage, setStage] = useState<"idle" | "paying" | "sending">("idle");

  const regionObj = getRegion(region);
  const errors = {
    name: name.trim().length < 2 ? "Ismingizni kiriting" : "",
    phone: phone.replace(/\D/g, "").length < 9 ? "Telefon raqamini to‘liq kiriting" : "",
    district: !district ? "Tumanni tanlang" : "",
    street: street.trim().length < 3 ? "Ko‘cha va uy raqamini kiriting" : "",
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const busy = stage !== "idle";

  const submit = async () => {
    setTried(true);
    if (hasErrors) {
      toast.error("Yetkazib berish ma’lumotlarini to‘ldiring");
      document.getElementById("manzil")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (payment !== "naqd") {
      setStage("paying");
      await sleep(1300);
    }
    setStage("sending");
    const address = `${regionObj?.name ?? ""}, ${districtLabel(district)}, ${street.trim()} (qabul qiluvchi: ${name.trim()})`;
    const ok = await onPlace({ name: name.trim(), phone: phone.trim(), address, payment, eta: etaFor(region) });
    if (!ok) setStage("idle");
  };

  const method = PAYMENT_METHODS.find((m) => m.id === payment)!;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="space-y-4">
        {/* Mahsulotlar */}
        <Card className="p-0">
          <div className="flex items-center justify-between px-4 pb-1 pt-4 sm:px-5">
            <h2 className="text-[17px] font-extrabold text-ink">Savatdagi mahsulotlar</h2>
            <span className="text-sm font-bold text-muted">{totals.count} ta</span>
          </div>
          <div className="divide-y divide-line">
            {lines.map(({ product: p, qty }) => {
              const off = discountPct(p);
              return (
                <div key={p.id} className="flex gap-3 px-4 py-3.5 sm:px-5">
                  <Link href={`/market/${p.id}`} className="shrink-0" aria-label={p.title}>
                    <EmojiTile emoji={p.emoji} color={p.color} size={68} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <Link href={`/market/${p.id}`} className="line-clamp-2 flex-1 text-[15px] font-extrabold leading-snug text-ink hover:text-brand-700">
                        {p.title}
                      </Link>
                      <button
                        onClick={() => {
                          onQty(p.id, 0);
                          toast.info("Mahsulot savatdan olib tashlandi", "🗑️");
                        }}
                        className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-faint transition hover:bg-danger/10 hover:text-danger"
                        aria-label="Savatdan olib tashlash"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-muted tabular">
                      {formatMoney(p.price)} / dona
                      {off > 0 && <span className="ml-1.5 font-extrabold text-[#e5484d]">−{off}%</span>}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <QtyStepper size="sm" value={qty} onChange={(n) => onQty(p.id, n)} className="w-[116px]" />
                      <div className="text-[15px] font-black text-ink tabular">{formatMoney(p.price * qty)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Manzil */}
        <Card className="scroll-mt-24 p-4 sm:p-5" id="manzil">
          <CardTitle>📍 Yetkazib berish</CardTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Qabul qiluvchi">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism va familiya" autoComplete="name" />
              {tried && errors.name && <FieldError text={errors.name} />}
            </Field>
            <Field label="Telefon raqami">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" inputMode="tel" autoComplete="tel" />
              {tried && errors.phone && <FieldError text={errors.phone} />}
            </Field>
            <Field label="Viloyat">
              <Select
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setDistrict("");
                }}
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tuman / shahar">
              <Select value={district} onChange={(e) => setDistrict(e.target.value)} className={cn(!district && "text-faint")}>
                <option value="">Tanlang…</option>
                {regionObj?.districts.map((d) => (
                  <option key={d} value={d}>
                    {districtLabel(d)}
                  </option>
                ))}
              </Select>
              {tried && errors.district && <FieldError text={errors.district} />}
            </Field>
            <Field label="Manzil" className="sm:col-span-2">
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Ko‘cha, uy, xonadon (masalan: Bunyodkor ko‘chasi, 12-uy)"
                autoComplete="street-address"
              />
              {tried && errors.street && <FieldError text={errors.street} />}
            </Field>
          </div>
          <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-brand-50 px-3.5 py-2.5 text-sm font-bold text-ink-2 ring-1 ring-brand-100">
            <span className="text-lg leading-none">🚚</span>
            {etaFor(region)}
            {totals.delivery === 0 ? <span className="text-[#0b7a52]">· bepul</span> : <span className="text-muted">· {formatMoney(totals.delivery)}</span>}
          </div>
        </Card>

        {/* To‘lov */}
        <Card className="p-4 sm:p-5">
          <CardTitle action={<Badge tone="warn">🧪 demo to‘lov</Badge>}>💳 To‘lov usuli</CardTitle>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {PAYMENT_METHODS.map((m) => {
              const on = payment === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    haptic("select");
                    setPayment(m.id);
                  }}
                  className={cn(
                    "relative flex flex-col items-start gap-2.5 rounded-2xl border p-3 text-left transition",
                    on ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-line bg-white hover:border-brand-200",
                  )}
                >
                  <PayMark method={m} />
                  <span>
                    <span className="block text-[15px] font-extrabold text-ink">{m.label}</span>
                    <span className="block text-xs font-semibold leading-snug text-muted">{m.hint}</span>
                  </span>
                  {on && (
                    <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Lock className="h-3.5 w-3.5" />
            Bu ko‘rgazma uchun demo to‘lov — kartangizdan pul yechilmaydi.
          </p>
        </Card>
      </div>

      {/* Hisob */}
      <Card className="p-5 lg:sticky lg:top-24">
        <CardTitle>Buyurtma xulosasi</CardTitle>
        <div className="space-y-2.5 text-[15px]">
          <SummaryRow label={`Mahsulotlar (${totals.count} ta)`} value={formatMoney(totals.subtotal)} />
          {totals.saved > 0 && <SummaryRow label="Chegirma bilan tejaldi" value={`−${formatMoney(totals.saved)}`} tone="good" />}
          <SummaryRow label="Yetkazib berish" value={totals.delivery ? formatMoney(totals.delivery) : "Bepul"} tone={totals.delivery ? undefined : "good"} />
        </div>
        <div className="my-4 h-px bg-line" />
        <div className="flex items-end justify-between gap-3">
          <span className="text-[15px] font-bold text-ink-2">Jami</span>
          <span className="text-[26px] font-black leading-none text-ink tabular">{formatMoney(totals.total)}</span>
        </div>

        {totals.subtotal < FREE_DELIVERY_FROM ? (
          <div className="mt-4 rounded-2xl bg-brand-50 p-3 ring-1 ring-brand-100">
            <div className="text-[13px] font-bold leading-snug text-ink-2">
              🎁 Yana <span className="text-brand-700">{formatMoney(FREE_DELIVERY_FROM - totals.subtotal)}lik</span> xarid qiling — yetkazib berish bepul
              bo‘ladi
            </div>
            <ProgressBar value={totals.subtotal} max={FREE_DELIVERY_FROM} trackClassName="mt-2" height={6} />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-[#e3f6ef] p-3 text-[13px] font-bold text-[#0b7a52]">🎉 Yetkazib berish bepul!</div>
        )}

        <Button size="lg" block className="mt-4" loading={busy} onClick={submit}>
          {stage === "paying" ? "To‘lov…" : stage === "sending" ? "Yuborilmoqda…" : `Buyurtma berish`}
          {!busy && <ChevronRight className="h-5 w-5" />}
        </Button>
        <p className="mt-2.5 text-center text-xs font-semibold text-muted">
          {method.label} orqali · buyurtma berish bilan{" "}
          <Link href="/help" className="underline decoration-dotted underline-offset-2 hover:text-ink-2">
            shartlarga
          </Link>{" "}
          rozilik bildirasiz
        </p>
      </Card>

      {stage === "paying" && <PayingOverlay method={method} amount={totals.total} />}
    </div>
  );
}

function FieldError({ text }: { text: string }) {
  return <p className="text-xs font-bold text-danger">⚠️ {text}</p>;
}

function SummaryRow({ label, value, tone }: { label: string; value: string; tone?: "good" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-2">{label}</span>
      <span className={cn("font-extrabold tabular", tone === "good" ? "text-[#0b7a52]" : "text-ink")}>{value}</span>
    </div>
  );
}

function PayMark({ method, large }: { method: (typeof PAYMENT_METHODS)[number]; large?: boolean }) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-xl px-2 font-black lowercase tracking-tight",
        large ? "h-14 min-w-14 text-lg" : "h-9 min-w-9 text-[13px]",
      )}
      style={{ background: method.bg, color: method.fg }}
    >
      {method.mark}
    </span>
  );
}

function PayingOverlay({ method, amount }: { method: (typeof PAYMENT_METHODS)[number]; amount: number }) {
  return (
    <div className="fixed inset-0 z-[85] grid place-items-center bg-ink/40 p-6 backdrop-blur-[2px]" role="alertdialog" aria-live="assertive">
      <div className="w-full max-w-sm animate-pop rounded-[28px] bg-white p-6 text-center shadow-pop">
        <div className="flex justify-center">
          <PayMark method={method} large />
        </div>
        <div className="mt-4 text-lg font-black text-ink">{method.label} orqali to‘lov</div>
        <div className="mt-1 text-2xl font-black text-ink tabular">{formatMoney(amount)}</div>
        <div className="mx-auto mt-5 h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
        <p className="mt-4 text-sm font-semibold text-muted">To‘lov tasdiqlanmoqda… Demo rejim — haqiqiy pul yechilmaydi.</p>
      </div>
    </div>
  );
}

function SuccessCard({ placed }: { placed: Placed }) {
  const firstName = placed.name.split(/\s+/)[0] || placed.name;
  const rows = [
    { emoji: "📦", label: "Mahsulotlar", value: `${placed.count} ta` },
    { emoji: "🚚", label: "Yetkazib berish", value: placed.eta },
    {
      emoji: "💳",
      label: "To‘lov",
      value: placed.payment === "naqd" ? "Naqd — qabul qilganda" : `${paymentLabel(placed.payment)} — to‘landi (demo)`,
    },
    { emoji: "📍", label: "Manzil", value: placed.address },
    { emoji: "📞", label: "Aloqa", value: `Operator ${placed.phone} raqamiga qo‘ng‘iroq qiladi` },
  ];
  return (
    <Card className="mx-auto max-w-xl overflow-hidden p-0">
      <div className="bg-gradient-to-b from-[#e3f6ef] to-white px-6 pb-5 pt-8 text-center">
        <div className="mx-auto grid h-24 w-24 animate-pop place-items-center rounded-full bg-white text-5xl shadow-card ring-8 ring-white/60">🎉</div>
        <h2 className="mt-4 text-[26px] font-black leading-tight text-ink">Buyurtma qabul qilindi!</h2>
        <p className="mt-1.5 text-[15px] text-ink-2">
          Rahmat, {firstName}! Buyurtma raqami: <span className="font-black text-ink">{orderNo(placed.id)}</span>
        </p>
      </div>
      <div className="space-y-3 px-5 pb-5 sm:px-6">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-canvas text-lg">{r.emoji}</span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-muted">{r.label}</div>
              <div className="text-[14.5px] font-bold leading-snug text-ink">{r.value}</div>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-2xl bg-canvas px-4 py-3">
          <span className="font-bold text-ink-2">Jami</span>
          <span className="text-xl font-black text-ink tabular">{formatMoney(placed.total)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-line p-4 sm:flex-row">
        <Button
          variant="secondary"
          block
          onClick={() => document.getElementById("buyurtmalar")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          📦 Buyurtma holati
        </Button>
        <Button block href="/market">
          Xaridni davom ettirish
        </Button>
      </div>
    </Card>
  );
}

function EmptyCart() {
  const picks = PRODUCTS.filter((p) => p.inStock && p.recommendedBy)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);
  return (
    <div>
      <EmptyState
        emoji="🛒"
        title="Savat hozircha bo‘sh"
        text="Mutaxassislar tavsiya qilgan rivojlantiruvchi o‘yinchoqlar, kitoblar va mashg‘ulot vositalarini ko‘rib chiqing."
        action={<Button href="/market">Marketga o‘tish</Button>}
      />
      {picks.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 text-lg font-black text-ink">👩‍⚕️ Mutaxassislar tavsiya qiladi</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {picks.map((p, i) => (
              <ProductCard key={p.id} product={p} className={cn(i === 3 && "sm:hidden xl:flex")} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
