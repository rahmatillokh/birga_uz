"use client";

import { BadgeCheck, Check, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { FloatingCart, MarketHeaderActions } from "@/components/market/floating-cart";
import { AddToCart, ProductCard, Rating } from "@/components/market/product-card";
import { DELIVERY_FEE, discountPct, fitsAge, FREE_DELIVERY_FROM } from "@/components/market/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Avatar, DomainBadge, EmptyState, InfoNote, PageHeader, Section } from "@/components/ui/misc";
import { getProduct, PRODUCTS } from "@/data/products";
import { getSpecialist } from "@/data/specialists";
import { useCart } from "@/lib/client/cart";
import { useChildData, useView } from "@/lib/client/hooks";
import { DOMAINS, PRODUCT_CATEGORIES, SPECIALTIES } from "@/lib/constants";
import { focusDomains } from "@/lib/core/plan";
import type { Product } from "@/lib/types";
import { ageOf, cn, formatMoney, formatNumber } from "@/lib/utils";

export default function ProductPage() {
  const params = useParams<{ id: string | string[] }>();
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  const product = getProduct(decodeURIComponent(raw ?? ""));
  if (!product) return <NotFound />;
  return <ProductView key={product.id} product={product} />;
}

function ProductView({ product }: { product: Product }) {
  const view = useView();
  const { child, latest } = useChildData();
  const inCart = useCart((s) => s.items[product.id] ?? 0);
  const sp = getSpecialist(product.recommendedBy);
  const cat = PRODUCT_CATEGORIES[product.category];
  const off = discountPct(product);
  const years = child ? ageOf(child.birthDate).years : undefined;
  const matchDomain = child ? focusDomains(child, latest).find((d) => product.domains.includes(d)) : undefined;

  const similar = useMemo(
    () =>
      PRODUCTS.filter((p) => p.id !== product.id)
        .map((p) => ({
          p,
          score:
            (p.category === product.category ? 2 : 0) +
            p.domains.filter((d) => product.domains.includes(d)).length +
            (p.recommendedBy && p.recommendedBy === product.recommendedBy ? 1 : 0),
        }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating)
        .slice(0, 4)
        .map((x) => x.p),
    [product],
  );

  return (
    <div>
      <PageHeader back="/market" emoji={cat.emoji} title={cat.label} subtitle="YuniQo Market" actions={<MarketHeaderActions ordersCount={view.orders.length} />} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        {/* Katta rasm */}
        <div className="lg:sticky lg:top-24">
          <div
            className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[32px] border border-line shadow-card lg:aspect-square"
            style={{ background: product.color }}
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/35" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/25" />
            <div className="pointer-events-none absolute bottom-10 right-10 h-10 w-10 rounded-full bg-white/40" />
            <span className="relative animate-float text-[104px] leading-none drop-shadow-md sm:text-[150px]">{product.emoji}</span>
            {off > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-[#e5484d] px-3 py-1 text-sm font-black text-white shadow-sm">−{off}% chegirma</span>
            )}
            {sp && (
              <span className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] truncate rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-[#0b7a52] shadow-sm">
                {sp.gender === "ayol" ? "👩‍⚕️" : "👨‍⚕️"} Mutaxassis tavsiyasi
              </span>
            )}
          </div>
        </div>

        {/* Ma’lumotlar */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gray">
                {cat.emoji} {cat.label}
              </Badge>
              {product.inStock ? <Badge tone="good">✔ Sotuvda bor</Badge> : <Badge tone="danger">⏳ Vaqtincha tugagan</Badge>}
            </div>
            <h1 className="mt-3 text-[23px] font-black leading-tight text-ink sm:text-[28px]">{product.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <Rating value={product.rating} className="text-sm" />
              <span className="font-semibold text-muted">{formatNumber(product.reviews)} ta sharh</span>
              <span className="font-semibold text-muted">
                Sotuvchi: <span className="font-bold text-ink-2">{product.seller}</span>
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
              <div className="text-[30px] font-black leading-none text-ink tabular">{formatMoney(product.price)}</div>
              {off > 0 && product.oldPrice && (
                <>
                  <div className="text-base font-semibold text-faint line-through tabular">{formatMoney(product.oldPrice)}</div>
                  <span className="rounded-full bg-[#e5484d] px-2 py-0.5 text-xs font-black text-white">−{off}%</span>
                </>
              )}
            </div>
            {off > 0 && product.oldPrice && (
              <div className="mt-1.5 text-sm font-bold text-[#0b7a52]">Tejaysiz: {formatMoney(product.oldPrice - product.price)}</div>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <AddToCart product={product} size="lg" className="sm:flex-1" label="Savatga qo‘shish" />
              {inCart > 0 && (
                <Button href="/market/cart" size="lg" variant="dark" className="sm:flex-1">
                  Rasmiylashtirish
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
            </div>
          </Card>

          {child && matchDomain && (
            <InfoNote emoji="✨">
              <span className="font-extrabold text-ink">{child.name} uchun foydali.</span> Bu mahsulot «{DOMAINS[matchDomain].label}» yo‘nalishini
              rivojlantirishga yordam beradi —{" "}
              {latest ? "oxirgi baholashda aynan shu yo‘nalishga e’tibor kerakligi aniqlangan." : "bu yo‘nalish farzandingiz ehtiyojlari orasida bor."}
              {years !== undefined && (fitsAge(product, years) ? ` Yoshi ham mos (${years} yosh).` : ` Tavsiya etilgan yosh: ${product.ageRange}.`)}
            </InfoNote>
          )}

          {sp && (
            <Card href={`/specialists/${sp.id}`} className="p-5">
              <div className="text-xs font-extrabold uppercase tracking-wide text-[#0b7a52]">
                {sp.gender === "ayol" ? "👩‍⚕️" : "👨‍⚕️"} Kim tavsiya qiladi
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={sp.name} color={sp.color} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-ink">
                    <span className="truncate">{sp.name}</span>
                    {sp.verified && <BadgeCheck className="h-[18px] w-[18px] shrink-0 text-brand-500" aria-label="Tasdiqlangan" />}
                  </div>
                  <div className="truncate text-sm text-muted">{sp.title}</div>
                  <div className="mt-0.5 text-xs font-bold text-ink-2">
                    ⭐ {sp.rating.toFixed(1)} · {sp.experienceYears} yil tajriba
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
              </div>
              <p className="mt-3 rounded-2xl bg-[#e3f6ef] px-3.5 py-3 text-sm leading-relaxed text-[#2f6b55]">
                {SPECIALTIES[sp.specialty].label} sifatida ushbu mahsulotni uydagi mashg‘ulotlar uchun tavsiya qiladi.{" "}
                <span className="font-extrabold">Profilni ko‘rish →</span>
              </p>
            </Card>
          )}

          <Card className="p-5">
            <CardTitle>Mahsulot haqida</CardTitle>
            <p className="text-[15px] leading-relaxed text-ink-2">{product.description}</p>
            {product.features.length > 0 && (
              <ul className="mt-4 space-y-2.5">
                {product.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e3f6ef] text-[#0b7a52]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-[15px] leading-snug text-ink-2">{f}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <SpecTile emoji="👶" label="Yosh" value={product.ageRange} />
              <SpecTile emoji="🏪" label="Sotuvchi" value={product.seller} />
            </div>
            {product.domains.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-sm font-bold text-ink-2">Rivojlantiradigan yo‘nalishlar</div>
                <div className="flex flex-wrap gap-1.5">
                  {product.domains.map((d) => (
                    <DomainBadge key={d} domain={d} className="py-1 text-[13px]" />
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <CardTitle>🚚 Yetkazib berish va to‘lov</CardTitle>
            <div className="divide-y divide-line">
              <DeliveryRow emoji="🏙️" title="Toshkent shahri bo‘ylab" value="1 kun" />
              <DeliveryRow emoji="🗺️" title="Viloyatlarga" value="2–4 kun" />
              <DeliveryRow emoji="🎁" title={`${formatNumber(FREE_DELIVERY_FROM)} so‘mdan yuqori xaridlar`} value="Bepul" highlight />
              <DeliveryRow emoji="💳" title="To‘lov usullari" value="Click · Payme · Uzum · naqd" />
              <DeliveryRow emoji="↩️" title="Qaytarish" value="14 kun ichida" />
            </div>
            <p className="mt-3 text-xs font-semibold text-muted">Boshqa hollarda yetkazib berish narxi — {formatMoney(DELIVERY_FEE)}.</p>
          </Card>
        </div>
      </div>

      {similar.length > 0 && (
        <Section title="O‘xshash mahsulotlar" href="/market" linkLabel="Katalog">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {similar.map((p, i) => (
              <ProductCard key={p.id} product={p} className={cn(i === 3 && "sm:hidden xl:flex")} />
            ))}
          </div>
        </Section>
      )}

      <FloatingCart />
    </div>
  );
}

function SpecTile({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-canvas px-3.5 py-3 ring-1 ring-line">
      <div className="text-xs font-bold text-muted">
        {emoji} {label}
      </div>
      <div className="mt-0.5 truncate text-[15px] font-extrabold text-ink">{value}</div>
    </div>
  );
}

function DeliveryRow({ emoji, title, value, highlight }: { emoji: string; title: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-lg">{emoji}</span>
      <span className="min-w-0 flex-1 text-[14.5px] font-semibold text-ink-2">{title}</span>
      <span className={cn("shrink-0 text-right text-[14.5px] font-extrabold", highlight ? "text-[#0b7a52]" : "text-ink")}>{value}</span>
    </div>
  );
}

function NotFound() {
  return (
    <div>
      <PageHeader back="/market" emoji="🛒" title="Mahsulot topilmadi" subtitle="YuniQo Market" />
      <EmptyState
        emoji="🔎"
        title="Bunday mahsulot yo‘q"
        text="Mahsulot sotuvdan olingan yoki havola noto‘g‘ri bo‘lishi mumkin."
        action={<Button href="/market">Marketga qaytish</Button>}
      />
    </div>
  );
}
