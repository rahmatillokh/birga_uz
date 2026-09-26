"use client";

import { ArrowRight, BadgeCheck, Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { REGIONS, districtLabel, getRegion } from "@/data/regions";
import { SPECIALISTS } from "@/data/specialists";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { Chips } from "@/components/ui/tabs";
import { SPECIALTIES, SPECIALTY_ORDER } from "@/lib/constants";
import { useView } from "@/lib/client/hooks";
import { haptic } from "@/lib/client/telegram";
import type { Specialist, SpecialtyId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SelectField } from "@/components/sessions/select-field";
import { BookingSheet } from "./booking-sheet";
import { matchesQuery, priceFrom } from "./helpers";
import { SpecialistCard } from "./specialist-card";
import { SpecialtyTiles } from "./specialty-tiles";

type Service = "" | "online" | "offline";
type Sort = "rating" | "experience" | "price";

interface Filters {
  specialty: SpecialtyId | "";
  q: string;
  region: string; // "" — barcha hududlar
  district: string; // "" — barcha tumanlar
  service: Service;
  free: boolean;
  sort: Sort;
}

const STORE_KEY = "yq-specialists-filters";
const FILTER_KEYS = ["type", "region", "district", "q", "service", "mode", "free", "sort"];

const SORTERS: Record<Sort, (a: Specialist, b: Specialist) => number> = {
  rating: (a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount,
  experience: (a, b) => b.experienceYears - a.experienceYears || b.rating - a.rating,
  price: (a, b) => (priceFrom(a) ?? Number.MAX_SAFE_INTEGER) - (priceFrom(b) ?? Number.MAX_SAFE_INTEGER) || b.rating - a.rating,
};

function validRegion(id?: string | null): id is string {
  return !!id && REGIONS.some((r) => r.id === id);
}

function defaults(userRegion: string): Filters {
  return { specialty: "", q: "", region: userRegion, district: "", service: "", free: false, sort: "rating" };
}

/** URL (yoki saqlangan) parametrlardan filtrlar: ?type=logoped&region=toshkent-sh&service=online&free=1 */
function readFilters(p: URLSearchParams, userRegion: string): Filters {
  const type = p.get("type");
  const r = p.get("region");
  const region = r === "all" ? "" : validRegion(r) ? r : userRegion;
  const d = p.get("district");
  const s = p.get("service") ?? p.get("mode");
  const sort = p.get("sort");
  return {
    specialty: type && SPECIALTY_ORDER.includes(type as SpecialtyId) ? (type as SpecialtyId) : "",
    q: p.get("q") ?? "",
    region,
    district: region && d && getRegion(region)?.districts.includes(d) ? d : "",
    service: s === "online" || s === "offline" ? s : "",
    free: p.get("free") === "1",
    sort: sort === "experience" || sort === "price" ? sort : "rating",
  };
}

function toQuery(f: Filters, userRegion: string): string {
  const p = new URLSearchParams();
  if (f.specialty) p.set("type", f.specialty);
  if (f.region !== userRegion) p.set("region", f.region || "all");
  if (f.district) p.set("district", f.district);
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.service) p.set("service", f.service);
  if (f.free) p.set("free", "1");
  if (f.sort !== "rating") p.set("sort", f.sort);
  return p.toString();
}

export function SpecialistsCatalog() {
  const params = useSearchParams();
  const view = useView();
  const userRegion = validRegion(view.user.region) ? view.user.region : "";

  const [f, setF] = useState<Filters>(() => {
    let src = new URLSearchParams(params.toString());
    if (!FILTER_KEYS.some((k) => src.has(k))) {
      try {
        const saved = sessionStorage.getItem(STORE_KEY);
        if (saved) src = new URLSearchParams(saved);
      } catch {
        /* ignore */
      }
    }
    return readFilters(src, userRegion);
  });
  const [booking, setBooking] = useState<{ sp: Specialist; n: number } | null>(null);

  const set = useCallback((patch: Partial<Filters>) => setF((prev) => ({ ...prev, ...patch })), []);
  const closeBooking = useCallback(() => setBooking(null), []);
  const openBooking = useCallback((sp: Specialist) => setBooking({ sp, n: Date.now() }), []);

  // Filtrlarni URL va sessiya xotirasida saqlaymiz (orqaga qaytganda tiklanadi)
  useEffect(() => {
    const qs = toQuery(f, userRegion);
    try {
      sessionStorage.setItem(STORE_KEY, qs);
    } catch {
      /* ignore */
    }
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== cur) window.history.replaceState(null, "", next);
  }, [f, userRegion]);

  const base = useMemo(
    () =>
      SPECIALISTS.filter(
        (sp) =>
          (!f.region || sp.region === f.region) &&
          (!f.district || sp.district === f.district) &&
          (!f.service || sp.services.includes(f.service)) &&
          (!f.free || sp.freeSessions) &&
          matchesQuery(sp, f.q),
      ),
    [f.region, f.district, f.service, f.free, f.q],
  );
  const counts = useMemo(() => {
    const c: Partial<Record<SpecialtyId, number>> = {};
    for (const sp of base) c[sp.specialty] = (c[sp.specialty] ?? 0) + 1;
    return c;
  }, [base]);
  const list = useMemo(
    () => (f.specialty ? base.filter((sp) => sp.specialty === f.specialty) : [...base]).sort(SORTERS[f.sort]),
    [base, f.specialty, f.sort],
  );
  const onlineElsewhere = useMemo(() => {
    if (!f.region || f.service === "offline") return 0;
    return SPECIALISTS.filter(
      (sp) =>
        sp.region !== f.region &&
        sp.services.includes("online") &&
        (!f.specialty || sp.specialty === f.specialty) &&
        (!f.free || sp.freeSessions) &&
        matchesQuery(sp, f.q),
    ).length;
  }, [f.region, f.service, f.specialty, f.free, f.q]);

  const region = getRegion(f.region);
  const dirty =
    !!f.specialty || !!f.q.trim() || f.region !== userRegion || !!f.district || !!f.service || f.free || f.sort !== "rating";
  const reset = () => setF(defaults(userRegion));
  const where = f.district ? `${districtLabel(f.district)}, ${region?.name}` : region ? region.name : "Butun O‘zbekiston";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Mutaxassislar"
        subtitle="Tasdiqlangan logoped, defektolog, psixolog va boshqa mutaxassislar — online yoki yaqiningizda"
        emoji="👨‍⚕️"
      />

      {/* Asosiy qadriyat */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-4 text-white shadow-brand sm:p-5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3 sm:flex-1 sm:items-center">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl backdrop-blur">📁</span>
            <div className="min-w-0">
              <div className="text-[15px] font-extrabold leading-snug sm:text-base">
                Bolaning barcha baholari va AI natijalari bitta tayyor rivojlanish hisobotida mutaxassisga ko‘rsatiladi
              </div>
              <div className="mt-0.5 text-[13px] font-semibold text-white/85">
                Yozilganingizda (roziligingiz bilan) pasport 30 kunga ulashiladi — mutaxassis birinchi uchrashuvdanoq to‘liq manzarani ko‘radi.
              </div>
            </div>
          </div>
          <Link
            href="/passport"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-xl bg-white px-4 text-sm font-extrabold text-brand-700 transition hover:bg-brand-50 sm:self-center"
          >
            Pasportni ko‘rish
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Mutaxassisliklar */}
      <div className="mb-3 mt-6 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-ink">Mutaxassislik bo‘yicha</h2>
        {f.specialty && (
          <button type="button" onClick={() => set({ specialty: "" })} className="text-sm font-extrabold text-brand-600 hover:text-brand-700">
            Barchasi
          </button>
        )}
      </div>
      <SpecialtyTiles value={f.specialty} onChange={(v) => set({ specialty: v })} counts={counts} />

      {/* Qidiruv va filtrlar */}
      <Card className="mt-4 p-3.5 sm:p-4">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-faint" aria-hidden />
            <Input
              value={f.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Ism, ish joyi yoki yo‘nalish…"
              aria-label="Mutaxassislarni qidirish"
              inputMode="search"
              enterKeyHint="search"
              className="pl-11 pr-11"
            />
            {f.q && (
              <button
                type="button"
                onClick={() => set({ q: "" })}
                aria-label="Qidiruvni tozalash"
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <SelectField
            value={f.region}
            onChange={(e) => set({ region: e.target.value, district: "" })}
            aria-label="Hudud"
            className="pl-3.5 pr-9 text-sm font-semibold sm:text-[15px]"
            iconClassName="right-3"
          >
            <option value="">Barcha hududlar</option>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            value={f.district}
            onChange={(e) => set({ district: e.target.value })}
            disabled={!region}
            aria-label="Tuman"
            className="pl-3.5 pr-9 text-sm font-semibold disabled:opacity-60 sm:text-[15px]"
            iconClassName="right-3"
          >
            <option value="">{region ? "Barcha tumanlar" : "Tuman (ixtiyoriy)"}</option>
            {(region?.districts ?? []).map((d) => (
              <option key={d} value={d}>
                {districtLabel(d)}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Chips<Service>
            value={f.service}
            onChange={(v) => set({ service: v })}
            items={[
              { value: "", label: "Barchasi" },
              { value: "online", label: "Online", emoji: "💻" },
              { value: "offline", label: "Offline", emoji: "🏥" },
            ]}
          />
          <button
            type="button"
            role="switch"
            aria-checked={f.free}
            onClick={() => {
              haptic("select");
              set({ free: !f.free });
            }}
            className={cn(
              "flex min-h-[40px] items-center gap-2.5 rounded-full border py-1.5 pl-3.5 pr-2 text-sm font-bold transition",
              f.free ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-white text-ink-2 hover:border-brand-200",
            )}
          >
            🏢 Bepul sessiyalarda qatnashadi
            <span className={cn("relative h-6 w-10 shrink-0 rounded-full transition", f.free ? "bg-brand-500" : "bg-slate-300")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", f.free ? "left-[18px]" : "left-0.5")} />
            </span>
          </button>
        </div>
      </Card>

      {/* Natijalar */}
      <div className="mb-3 mt-6 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-ink">
            {list.length} ta mutaxassis{f.specialty ? ` · ${SPECIALTIES[f.specialty].label}` : ""}
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs font-bold text-muted">
            <span>📍 {where}</span>
            {dirty && (
              <button type="button" onClick={reset} className="font-extrabold text-brand-600 hover:text-brand-700">
                Filtrlarni tozalash
              </button>
            )}
          </div>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm font-bold text-muted">
          <span className="hidden sm:inline">Saralash:</span>
          <SelectField
            value={f.sort}
            onChange={(e) => set({ sort: e.target.value as Sort })}
            aria-label="Saralash"
            className="h-10 w-auto rounded-xl pl-3 pr-9 text-sm font-bold"
            iconClassName="right-2.5 h-4 w-4"
          >
            <option value="rating">⭐ Reyting</option>
            <option value="experience">🏅 Tajriba</option>
            <option value="price">💰 Narx</option>
          </SelectField>
        </label>
      </div>

      {list.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          {list.map((sp) => (
            <SpecialistCard key={sp.id} sp={sp} bookings={view.bookings} onBook={openBooking} showRegion={!f.region} />
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="🔎"
          title="Mos mutaxassis topilmadi"
          text={
            onlineElsewhere > 0
              ? "Bu hududda mos mutaxassis yo‘q, lekin online konsultatsiya butun O‘zbekiston bo‘ylab ishlaydi."
              : "Qidiruv so‘zini yoki filtrlarni o‘zgartirib ko‘ring."
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {onlineElsewhere > 0 && (
                <Button onClick={() => set({ region: "", district: "", service: "online" })}>💻 Online mutaxassislar ({onlineElsewhere})</Button>
              )}
              {dirty && (
                <Button variant="secondary" onClick={reset}>
                  Filtrlarni tozalash
                </Button>
              )}
            </div>
          }
        />
      )}

      {list.length > 0 && list.length < 4 && onlineElsewhere > 0 && (
        <Card className="mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-2xl">💻</span>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-ink">Boshqa hududlardan yana {onlineElsewhere} ta mutaxassis online qabul qiladi</div>
            <div className="text-sm text-muted">Online konsultatsiya uchun qayerda yashashingiz muhim emas.</div>
          </div>
          <Button variant="soft" className="shrink-0" onClick={() => set({ region: "", district: "", service: "online" })}>
            Ko‘rsatish
          </Button>
        </Card>
      )}

      <p className="mx-auto mt-6 max-w-md text-center text-xs font-semibold leading-relaxed text-muted">
        <BadgeCheck className="mr-1 inline h-4 w-4 align-[-3px] text-brand-500" aria-hidden />
        belgisi — diplomi va sertifikatlari YuniQo tomonidan tekshirilgan mutaxassis
      </p>

      {booking && <BookingSheet key={booking.n} specialist={booking.sp} onClose={closeBooking} />}
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div>
      <Skeleton className="h-14 w-2/3" />
      <Skeleton className="mt-4 h-24 w-full rounded-3xl" />
      <div className="mt-6 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-24 shrink-0" />
        ))}
      </div>
      <Skeleton className="mt-4 h-32 w-full rounded-3xl" />
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    </div>
  );
}
