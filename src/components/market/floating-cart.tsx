"use client";

import { Package, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/client/cart";
import { haptic } from "@/lib/client/telegram";
import { cn, formatMoney } from "@/lib/utils";
import { cartLines, cartTotals } from "./shared";

function useCartSummary() {
  const items = useCart((s) => s.items);
  return cartTotals(cartLines(items));
}

/** Pastda suzib yuruvchi savat tugmasi (mobil pastki menyu ustida) */
export function FloatingCart() {
  const { count, subtotal } = useCartSummary();
  if (!count) return null;
  return (
    <>
      {/* Oxirgi kartalar tugma ostida qolmasligi uchun joy */}
      <div className="h-16 lg:h-4" aria-hidden />
      <Link
        href="/market/cart"
        onClick={() => haptic("light")}
        aria-label={`Savat: ${count} ta mahsulot`}
        className="no-print fixed bottom-[calc(env(safe-area-inset-bottom)+92px)] right-4 z-40 flex animate-pop items-center gap-3 rounded-full bg-brand-gradient py-1.5 pl-1.5 pr-5 text-white shadow-brand ring-4 ring-white/70 transition hover:brightness-105 active:scale-[0.98] lg:bottom-8 lg:right-8"
      >
        <span className="relative grid h-11 w-11 place-items-center rounded-full bg-white/20">
          <ShoppingCart className="h-5 w-5" />
          <span
            key={count}
            className="absolute -right-1 -top-1 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-[#e5484d] px-1 text-[11px] font-black text-white ring-2 ring-white"
          >
            {count}
          </span>
        </span>
        <span className="leading-tight">
          <span className="block text-[11px] font-bold text-white/85">Savatni ko‘rish</span>
          <span className="block text-[15px] font-black tabular">{formatMoney(subtotal)}</span>
        </span>
      </Link>
    </>
  );
}

/** Sarlavhadagi savat / buyurtmalar tugmalari */
export function MarketHeaderActions({ ordersCount = 0 }: { ordersCount?: number }) {
  const { count } = useCartSummary();
  const cls =
    "relative flex h-10 min-w-10 items-center justify-center rounded-2xl border border-line bg-white text-ink-2 transition hover:border-brand-200 hover:bg-brand-50";
  return (
    <>
      {ordersCount > 0 && (
        <Link href="/market/cart#buyurtmalar" className={cn(cls, "sm:gap-2 sm:px-3.5")} aria-label="Buyurtmalarim">
          <Package className="h-5 w-5" />
          <span className="hidden text-sm font-bold sm:inline">Buyurtmalarim</span>
        </Link>
      )}
      <Link href="/market/cart" className={cls} aria-label="Savat">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#e5484d] px-1 text-[11px] font-black text-white ring-2 ring-canvas">
            {count}
          </span>
        )}
      </Link>
    </>
  );
}
