"use client";

import { Check, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmojiTile } from "@/components/ui/misc";
import { getProduct } from "@/data/products";
import { useCart } from "@/lib/client/cart";
import { toast } from "@/lib/client/toast";
import type { Order } from "@/lib/types";
import { cn, formatDateTime, formatMoney } from "@/lib/utils";
import { deliveryFee, ORDER_STEPS, orderNo, orderStepIndex, paymentLabel } from "./shared";

/** Buyurtma holati: Qabul qilindi → Yig‘ilmoqda → Yo‘lda → Yetkazildi */
export function OrderSteps({ step }: { step: number }) {
  const last = ORDER_STEPS.length - 1;
  return (
    <div className="grid grid-cols-4" role="list" aria-label="Buyurtma holati">
      {ORDER_STEPS.map((s, i) => {
        const done = i < step || (i === step && step === last);
        const current = i === step && step !== last;
        return (
          <div key={s.id} role="listitem" className="relative flex flex-col items-center text-center" aria-current={i === step ? "step" : undefined}>
            {i > 0 && <div className={cn("absolute right-1/2 top-4 h-1 w-full -translate-y-1/2 rounded-full", i <= step ? "bg-brand-400" : "bg-slate-200")} />}
            <div
              className={cn(
                "relative z-10 grid h-8 w-8 place-items-center rounded-full text-sm ring-4 ring-white transition",
                done && "bg-brand-500 text-white",
                current && "animate-pulse-ring bg-brand-gradient text-white",
                !done && !current && "bg-slate-100 grayscale",
              )}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <span className="leading-none">{s.emoji}</span>}
            </div>
            <div className={cn("mt-1.5 text-[11px] font-bold leading-tight sm:text-xs", i <= step ? "text-ink" : "text-faint")}>{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export function OrderCard({ order, highlight }: { order: Order; highlight?: boolean }) {
  const add = useCart((s) => s.add);
  const step = orderStepIndex(order);
  const lines = order.items.map((i) => ({ ...i, product: getProduct(i.productId) }));
  const total = order.total + deliveryFee(order.total);
  const reorderable = lines.filter((l) => l.product?.inStock);

  return (
    <Card className={cn("p-4 sm:p-5", highlight && "ring-2 ring-brand-300")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-black text-ink">Buyurtma {orderNo(order.id)}</div>
          <div className="mt-0.5 text-xs font-semibold text-muted">
            {formatDateTime(order.createdAt)} · {paymentLabel(order.payment)}
          </div>
        </div>
        <Badge tone={step === ORDER_STEPS.length - 1 ? "good" : "brand"} className="shrink-0">
          {ORDER_STEPS[step].emoji} {ORDER_STEPS[step].label}
        </Badge>
      </div>

      <div className="mt-4">
        <OrderSteps step={step} />
      </div>

      <div className="mt-4 space-y-2.5">
        {lines.map((l) => (
          <div key={l.productId} className="flex items-center gap-3">
            <EmojiTile emoji={l.product?.emoji ?? "📦"} color={l.product?.color} size={40} />
            <div className="min-w-0 flex-1">
              {l.product ? (
                <Link href={`/market/${l.product.id}`} className="block truncate text-sm font-bold text-ink hover:text-brand-700">
                  {l.product.title}
                </Link>
              ) : (
                <div className="truncate text-sm font-bold text-ink">Mahsulot</div>
              )}
              <div className="text-xs font-semibold text-muted tabular">
                {l.qty} × {formatMoney(l.price)}
              </div>
            </div>
            <div className="shrink-0 text-sm font-extrabold text-ink tabular">{formatMoney(l.qty * l.price)}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-3">
        <div className="min-w-0 flex-1 text-xs font-semibold leading-snug text-muted">📍 {order.address}</div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] font-bold text-muted">Jami</div>
          <div className="text-[16px] font-black text-ink tabular">{formatMoney(total)}</div>
        </div>
      </div>
      {reorderable.length > 0 && (
        <button
          onClick={() => {
            reorderable.forEach((l) => add(l.productId, l.qty));
            toast.success("Mahsulotlar savatga qayta qo‘shildi", "🔁");
          }}
          className="mt-3 flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700"
        >
          <RotateCcw className="h-4 w-4" />
          Qayta buyurtma berish
        </button>
      )}
    </Card>
  );
}

export function OrdersList({ orders, highlightId, className }: { orders: Order[]; highlightId?: string; className?: string }) {
  if (!orders.length) return null;
  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <section id="buyurtmalar" className={cn("mt-8 scroll-mt-24", className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-lg font-black text-ink">📦 Buyurtmalarim</h2>
        <span className="text-[13px] font-semibold text-muted">{sorted.length} ta</span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {sorted.map((o) => (
          <OrderCard key={o.id} order={o} highlight={o.id === highlightId} />
        ))}
      </div>
    </section>
  );
}
