"use client";

import { Minus, Plus, ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSpecialist } from "@/data/specialists";
import { useCart } from "@/lib/client/cart";
import { haptic } from "@/lib/client/telegram";
import type { Product } from "@/lib/types";
import { cn, formatMoney, formatNumber } from "@/lib/utils";
import { discountPct, MAX_QTY } from "./shared";

type Size = "sm" | "md" | "lg";
const HEIGHT: Record<Size, string> = { sm: "h-9", md: "h-11", lg: "h-14" };
const BTN: Record<Size, string> = { sm: "h-9 w-9", md: "h-11 w-11", lg: "h-14 w-14" };

/** Miqdor tanlagich: [-] 2 [+] */
export function QtyStepper({
  value,
  onChange,
  size = "md",
  className,
  max = MAX_QTY,
}: {
  value: number;
  onChange: (n: number) => void;
  size?: Size;
  className?: string;
  max?: number;
}) {
  return (
    <div className={cn("flex items-center justify-between rounded-2xl bg-brand-50 ring-1 ring-brand-100", HEIGHT[size], className)}>
      <button
        type="button"
        aria-label="Kamaytirish"
        onClick={() => {
          haptic("light");
          onChange(value - 1);
        }}
        className={cn("grid shrink-0 place-items-center rounded-2xl text-brand-700 transition hover:bg-brand-100 active:scale-95", BTN[size])}
      >
        <Minus className="h-4 w-4" strokeWidth={2.75} />
      </button>
      <span className={cn("min-w-6 text-center font-black text-ink tabular", size === "lg" ? "text-lg" : "text-[15px]")}>{value}</span>
      <button
        type="button"
        aria-label="Ko‘paytirish"
        disabled={value >= max}
        onClick={() => {
          haptic("light");
          onChange(value + 1);
        }}
        className={cn(
          "grid shrink-0 place-items-center rounded-2xl text-brand-700 transition hover:bg-brand-100 active:scale-95 disabled:opacity-40",
          BTN[size],
        )}
      >
        <Plus className="h-4 w-4" strokeWidth={2.75} />
      </button>
    </div>
  );
}

/** "Savatga" tugmasi — savatda bo‘lsa miqdor tanlagichga aylanadi */
export function AddToCart({ product, size = "md", className, label = "Savatga" }: { product: Product; size?: Size; className?: string; label?: string }) {
  const qty = useCart((s) => s.items[product.id] ?? 0);
  const add = useCart((s) => s.add);
  const set = useCart((s) => s.set);

  if (!product.inStock) {
    return (
      <Button variant="secondary" size={size} disabled className={cn("w-full", className)}>
        Vaqtincha tugagan
      </Button>
    );
  }
  if (qty > 0) {
    return <QtyStepper value={qty} size={size} className={className} onChange={(n) => set(product.id, Math.min(MAX_QTY, n))} />;
  }
  return (
    <Button
      size={size}
      className={cn("w-full", className)}
      onClick={() => {
        add(product.id);
        haptic("success");
      }}
    >
      <ShoppingCart className="h-4 w-4" />
      {label}
    </Button>
  );
}

export function Rating({ value, reviews, className }: { value: number; reviews?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-bold text-ink-2", className)}>
      <Star className="h-3.5 w-3.5 fill-[#fab219] text-[#fab219]" />
      {value.toFixed(1)}
      {typeof reviews === "number" && <span className="font-semibold text-muted">({formatNumber(reviews)})</span>}
    </span>
  );
}

/** Mahsulot kartasi (katalog va "Siz uchun" qatori) */
export function ProductCard({ product, reason, className }: { product: Product; reason?: string; className?: string }) {
  const sp = product.recommendedBy ? getSpecialist(product.recommendedBy) : undefined;
  const off = discountPct(product);
  const href = `/market/${product.id}`;
  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop",
        className,
      )}
    >
      <Link href={href} className="relative block" aria-label={product.title}>
        <div className="relative grid aspect-[4/3] place-items-center overflow-hidden" style={{ background: product.color }}>
          <div className="pointer-events-none absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-white/35" />
          <div className="pointer-events-none absolute -left-5 -top-6 h-16 w-16 rounded-full bg-white/30" />
          <span className="relative text-[58px] leading-none drop-shadow-sm transition-transform duration-300 group-hover:scale-110 sm:text-[68px]">
            {product.emoji}
          </span>
          {off > 0 && (
            <span className="absolute right-2.5 top-2.5 rounded-full bg-[#e5484d] px-2 py-0.5 text-[11px] font-black text-white shadow-sm">−{off}%</span>
          )}
          {reason && (
            <span className="absolute bottom-2 left-2 right-2 line-clamp-2 rounded-xl bg-white/95 px-2 py-1 text-center text-[11px] font-extrabold leading-tight text-ink shadow-sm">
              ✨ {reason}
            </span>
          )}
          {!product.inStock && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-ink/75 px-2 py-0.5 text-[11px] font-bold text-white">Tugagan</span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <Link href={href} className="line-clamp-2 text-[14px] font-extrabold leading-snug text-ink hover:text-brand-700 sm:text-[15px]">
          {product.title}
        </Link>
        <Rating value={product.rating} reviews={product.reviews} className="mt-1.5" />
        {sp && (
          <div className="mt-2 rounded-xl bg-[#e3f6ef] px-2 py-1.5 text-[11px] leading-tight">
            <div className="font-extrabold text-[#0b7a52]">{sp.gender === "ayol" ? "👩‍⚕️" : "👨‍⚕️"} Mutaxassis tavsiyasi</div>
            <div className="mt-0.5 truncate font-semibold text-[#2f6b55]">{sp.name}</div>
          </div>
        )}
        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-[15.5px] font-black text-ink tabular sm:text-[17px]">{formatMoney(product.price)}</span>
            {off > 0 && product.oldPrice && <span className="text-xs font-semibold text-faint line-through tabular">{formatNumber(product.oldPrice)}</span>}
          </div>
          <AddToCart product={product} size="sm" className="mt-2.5" />
        </div>
      </div>
    </div>
  );
}
