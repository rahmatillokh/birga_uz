"use client";

import { Check, Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { FloatingCart, MarketHeaderActions } from "@/components/market/floating-cart";
import { ProductCard } from "@/components/market/product-card";
import { ageOverlaps, DOMAIN_REASON, fitsAge } from "@/components/market/shared";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { DomainBadge, EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { Chips } from "@/components/ui/tabs";
import { PRODUCTS } from "@/data/products";
import { useChildData, useView } from "@/lib/client/hooks";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { focusDomains } from "@/lib/core/plan";
import type { Domain, Product, ProductCategory } from "@/lib/types";
import { ageOf, cn, normalizeText } from "@/lib/utils";

type Sort = "popular" | "cheap" | "expensive";
type Band = { value: string; label: string; min: number; max: number };

const AGE_BANDS: Band[] = [
  { value: "0-3", label: "0–3 yosh", min: 0, max: 3 },
  { value: "3-5", label: "3–5 yosh", min: 3, max: 5 },
  { value: "5-7", label: "5–7 yosh", min: 5, max: 7 },
  { value: "7+", label: "7 yoshdan katta", min: 7, max: 99 },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: "popular", label: "Mashhur" },
  { value: "cheap", label: "Arzonroq" },
  { value: "expensive", label: "Qimmatroq" },
];

const CATEGORY_KEYS = Object.keys(PRODUCT_CATEGORIES) as ProductCategory[];

const PERKS = [
  { emoji: "👩‍⚕️", text: "Mutaxassislar tanlovi" },
  { emoji: "🚚", text: "Toshkentda 1 kunda" },
  { emoji: "🎁", text: "300 000 so‘mdan — bepul yetkazish" },
  { emoji: "💳", text: "Click · Payme · Uzum · naqd" },
];

function isCategory(v: string | null): v is ProductCategory {
  return !!v && v in PRODUCT_CATEGORIES;
}

export default function MarketPage() {
  return (
    <Suspense fallback={<MarketSkeleton />}>
      <Market />
    </Suspense>
  );
}

function Market() {
  const params = useSearchParams();
  const view = useView();
  const { child, latest } = useChildData();
  const paramCat = params.get("category");

  const [cat, setCat] = useState<ProductCategory | "all">(isCategory(paramCat) ? paramCat : "all");
  const [q, setQ] = useState("");
  const [recOnly, setRecOnly] = useState(false);
  const [age, setAge] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("popular");

  const years = child ? ageOf(child.birthDate).years : undefined;

  // "Siz uchun": bolaning eng zaif yo‘nalishlariga mos mahsulotlar
  const forYou = useMemo(() => {
    if (!child) return { weak: [] as Domain[], items: [] as { p: Product; d: Domain }[] };
    const weak = focusDomains(child, latest);
    const yrs = ageOf(child.birthDate).years;
    const items = PRODUCTS.filter((p) => p.inStock)
      .map((p) => {
        const d = weak.find((w) => p.domains.includes(w));
        if (!d) return null;
        const rank = weak.indexOf(d) - (fitsAge(p, yrs) ? 0.5 : 0) - (p.recommendedBy ? 0.2 : 0);
        return { p, d, rank };
      })
      .filter((x): x is { p: Product; d: Domain; rank: number } => !!x)
      .sort((a, b) => a.rank - b.rank || b.p.rating - a.p.rating)
      .slice(0, 8);
    return { weak, items };
  }, [child, latest]);

  const list = useMemo(() => {
    const nq = normalizeText(q);
    const band = AGE_BANDS.find((b) => b.value === age);
    const arr = PRODUCTS.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (recOnly && !p.recommendedBy) return false;
      if (age === "child" && years !== undefined && !fitsAge(p, years)) return false;
      if (band && !ageOverlaps(p, band.min, band.max)) return false;
      if (nq) {
        const hay = normalizeText([p.title, p.description, p.features.join(" "), PRODUCT_CATEGORIES[p.category].label, p.seller].join(" "));
        if (!hay.includes(nq)) return false;
      }
      return true;
    });
    return arr.sort((a, b) => {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      if (sort === "cheap") return a.price - b.price;
      if (sort === "expensive") return b.price - a.price;
      return b.reviews - a.reviews || b.rating - a.rating;
    });
  }, [q, cat, recOnly, age, sort, years]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: PRODUCTS.length };
    for (const k of CATEGORY_KEYS) m[k] = PRODUCTS.filter((p) => p.category === k).length;
    return m;
  }, []);

  const filtered = cat !== "all" || recOnly || age !== "all" || q.trim().length > 0;

  const chooseCat = (v: ProductCategory | "all") => setCat(v);

  const reset = () => {
    setQ("");
    setRecOnly(false);
    setAge("all");
    setSort("popular");
    chooseCat("all");
  };

  return (
    <div>
      <PageHeader
        emoji="🛒"
        title="YuniQo Market"
        subtitle="Mutaxassislar tavsiya qilgan rivojlantiruvchi mahsulotlar — uyingizgacha yetkazamiz"
        actions={<MarketHeaderActions ordersCount={view.orders.length} />}
      />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {PERKS.map((p) => (
          <div key={p.text} className="flex shrink-0 items-center gap-2 rounded-2xl bg-white px-3 py-2 text-[13px] font-bold text-ink-2 ring-1 ring-line">
            <span className="text-base leading-none">{p.emoji}</span>
            {p.text}
          </div>
        ))}
      </div>

      {/* Qidiruv */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-faint" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Mahsulot qidirish: kartochka, pazl, kitob…"
          className="pl-12 pr-11"
          aria-label="Mahsulot qidirish"
          inputMode="search"
          enterKeyHint="search"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-muted hover:bg-slate-100"
            aria-label="Tozalash"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Kategoriyalar */}
      <Chips
        className="mt-3"
        value={cat}
        onChange={chooseCat}
        items={[
          { value: "all" as const, emoji: "🛍️", label: <ChipLabel text="Barchasi" count={counts.all} /> },
          ...CATEGORY_KEYS.map((k) => ({
            value: k,
            emoji: PRODUCT_CATEGORIES[k].emoji,
            label: <ChipLabel text={PRODUCT_CATEGORIES[k].label} count={counts[k]} />,
          })),
        ]}
      />

      {/* Filtrlar */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={recOnly}
          onClick={() => setRecOnly((v) => !v)}
          className={cn(
            "flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition",
            recOnly ? "border-[#1baf7a] bg-[#e3f6ef] text-[#0b7a52]" : "border-line bg-white text-ink-2 hover:border-brand-200",
          )}
        >
          <span>👩‍⚕️</span>
          Mutaxassis tavsiya qilgan
          {recOnly && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>
        <Select
          value={age}
          onChange={(e) => setAge(e.target.value)}
          aria-label="Yosh bo‘yicha"
          className={cn("h-10 w-auto rounded-full pl-3.5 pr-9 text-sm font-bold", age !== "all" && "border-brand-400 bg-brand-50 text-brand-700")}
        >
          <option value="all">Barcha yoshlar</option>
          {child && years !== undefined && (
            <option value="child">
              {child.name} uchun ({years} yosh)
            </option>
          )}
          {AGE_BANDS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </Select>
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Saralash"
          className="h-10 w-auto rounded-full pl-3.5 pr-9 text-sm font-bold"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              ↕ {s.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Siz uchun */}
      {!q.trim() && child && forYou.items.length > 0 && (
        <section className="mt-6">
          <div className="mb-3">
            <h2 className="text-lg font-black text-ink">✨ Siz uchun</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-muted">
              <span>
                {child.name}ning {latest ? "oxirgi baholash natijalariga" : "ehtiyojlariga"} ko‘ra:
              </span>
              {forYou.weak.map((d) => (
                <DomainBadge key={d} domain={d} />
              ))}
            </div>
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:scroll-px-0 sm:px-0 xl:grid xl:grid-cols-4 xl:overflow-visible">
            {forYou.items.map(({ p, d }, i) => (
              <ProductCard
                key={p.id}
                product={p}
                reason={DOMAIN_REASON[d]}
                className={cn("w-[46%] min-w-[168px] shrink-0 snap-start sm:w-[220px] xl:w-auto", i >= 4 && "xl:hidden")}
              />
            ))}
          </div>
        </section>
      )}

      {/* Katalog */}
      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-ink">{cat === "all" ? "Barcha mahsulotlar" : PRODUCT_CATEGORIES[cat].label}</h2>
            <div className="text-[13px] font-semibold text-muted">{list.length} ta mahsulot</div>
          </div>
          {filtered && (
            <button onClick={reset} className="flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700">
              <X className="h-4 w-4" />
              Filtrlarni tozalash
            </button>
          )}
        </div>

        {PRODUCTS.length === 0 ? (
          <EmptyState emoji="📦" title="Mahsulotlar tez orada qo‘shiladi" text="Market to‘ldirilmoqda — birozdan keyin qayta kiring." />
        ) : list.length === 0 ? (
          <EmptyState
            emoji="🔎"
            title="Hech narsa topilmadi"
            text="Boshqa so‘z bilan qidirib ko‘ring yoki filtrlarni tozalang."
            action={
              <Button variant="soft" onClick={reset}>
                Filtrlarni tozalash
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <FloatingCart />
    </div>
  );
}

function ChipLabel({ text, count }: { text: string; count?: number }) {
  return (
    <span className="flex items-center gap-1.5">
      {text}
      {typeof count === "number" && <span className="text-xs font-extrabold opacity-60">{count}</span>}
    </span>
  );
}

function MarketSkeleton() {
  return (
    <div>
      <PageHeader emoji="🛒" title="YuniQo Market" subtitle="Yuklanmoqda…" />
      <Skeleton className="h-12 w-full" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}
