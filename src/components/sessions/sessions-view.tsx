"use client";

import { ChevronDown, MapPin } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { REGIONS, districtLabel, getRegion } from "@/data/regions";
import { sessionsForDistrict, sessionsForRegion } from "@/data/sessions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmojiTile, EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { Chips, Tabs } from "@/components/ui/tabs";
import { SESSION_TYPES } from "@/lib/constants";
import { useView } from "@/lib/client/hooks";
import type { Booking, FreeSession, SessionType } from "@/lib/types";
import { addDays, formatDate, todayKey } from "@/lib/utils";
import { findSession, hasStarted, isUpcoming, relativeTag, sortByTime } from "./booking-utils";
import { CalendarStrip } from "./calendar-strip";
import { CancelBookingSheet } from "./cancel-sheet";
import { MyBookings } from "./my-bookings";
import { SessionCard } from "./session-card";
import { SelectField } from "./select-field";
import { SessionSheet } from "./session-sheet";
import { MyBookingsHero, SESSION_TYPE_ORDER, SHORT_TYPE_LABEL, SessionsHero } from "./sessions-hero";

type Tab = "list" | "my";
type TypeFilter = SessionType | "all";

const PAGE = 12;

function validRegion(id?: string | null): id is string {
  return !!id && REGIONS.some((r) => r.id === id);
}

/** URL’ni sahifani qayta yuklamasdan yangilash (Telegram hash saqlanadi) */
function replaceQuery(query: Record<string, string | undefined>) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v) p.set(k, v);
  const qs = p.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
}

export function SessionsView() {
  const params = useSearchParams();
  const view = useView();
  const user = view.user;

  // ------------------------------------------------------------------ Boshlang‘ich holat (URL -> state)
  const [initial] = useState(() => {
    const sid = params.get("session");
    const deep = sid ? findSession(sid) : undefined;
    const pRegion = params.get("region");
    const region = deep?.region ?? (validRegion(pRegion) ? pRegion : validRegion(user.region) ? user.region : REGIONS[0].id);
    const districts = getRegion(region)?.districts ?? [];
    const pDistrict = params.get("district");
    const district =
      deep?.district ??
      (pDistrict === "all"
        ? ""
        : pDistrict && districts.includes(pDistrict)
          ? pDistrict
          : region === user.region && user.district && districts.includes(user.district)
            ? user.district
            : "");
    const pType = params.get("type");
    const type: TypeFilter = pType && SESSION_TYPE_ORDER.includes(pType as SessionType) ? (pType as SessionType) : "all";
    return { region, district, type, openId: deep?.id ?? null };
  });

  const tabParam: Tab = params.get("tab") === "my" ? "my" : "list";
  const [tab, setTab] = useState<Tab>(tabParam);
  const [prevTabParam, setPrevTabParam] = useState<Tab>(tabParam);
  if (tabParam !== prevTabParam) {
    // Tashqaridan (masalan, menyudan) ?tab o‘zgarsa — kuzatib boramiz
    setPrevTabParam(tabParam);
    setTab(tabParam);
  }

  const [region, setRegion] = useState(initial.region);
  const [district, setDistrict] = useState(initial.district);
  const [type, setType] = useState<TypeFilter>(initial.type);
  const [day, setDay] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(initial.openId);
  const [cancel, setCancel] = useState<Booking | null>(null);

  const changeTab = useCallback((t: Tab) => {
    setTab(t);
    setOpenId(null);
    replaceQuery({ tab: t === "my" ? "my" : undefined });
  }, []);

  const openSession = useCallback((id: string) => setOpenId(id), []);
  const closeSession = useCallback(() => {
    setOpenId(null);
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("session")) {
      replaceQuery({ tab: tab === "my" ? "my" : undefined });
    }
  }, [tab]);
  const askCancel = useCallback((b: Booking) => {
    setOpenId(null);
    setCancel(b);
  }, []);
  const closeCancel = useCallback(() => setCancel(null), []);

  // ------------------------------------------------------------------ Ma’lumotlar
  const today = todayKey();
  const days14 = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), [today]);
  const regionObj = getRegion(region);
  const all = useMemo(() => (district ? sessionsForDistrict(region, district) : sessionsForRegion(region)), [region, district]);
  const upcoming = useMemo(() => all.filter((s) => !hasStarted(s.date, s.time)).sort(sortByTime), [all]);
  const typed = useMemo(() => (type === "all" ? upcoming : upcoming.filter((s) => s.type === type)), [upcoming, type]);
  const typesByDay = useMemo(() => {
    const m = new Map<string, SessionType[]>();
    for (const s of typed) {
      const arr = m.get(s.date) ?? [];
      if (!arr.includes(s.type)) arr.push(s.type);
      m.set(s.date, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => SESSION_TYPE_ORDER.indexOf(a) - SESSION_TYPE_ORDER.indexOf(b));
    return m;
  }, [typed]);
  const visible = useMemo(() => (day ? typed.filter((s) => s.date === day) : typed), [typed, day]);
  const groups = useMemo(() => {
    const out: { date: string; items: FreeSession[] }[] = [];
    for (const s of visible.slice(0, limit)) {
      const g = out[out.length - 1];
      if (g && g.date === s.date) g.items.push(s);
      else out.push({ date: s.date, items: [s] });
    }
    return out;
  }, [visible, limit]);

  const bookedIds = useMemo(
    () => new Set(view.bookings.filter((b) => b.kind === "session" && b.status !== "bekor" && b.sessionId).map((b) => b.sessionId as string)),
    [view.bookings],
  );
  const upcomingCount = useMemo(() => view.bookings.filter(isUpcoming).length, [view.bookings]);
  const current = useMemo(() => (openId ? (all.find((s) => s.id === openId) ?? findSession(openId)) : undefined), [openId, all]);

  const homeDistrict = user.district && getRegion(user.region)?.districts.includes(user.district) ? user.district : "";
  const atHomeArea = region === user.region && district === homeDistrict;
  const isHome = atHomeArea && !!homeDistrict;
  const canGoHome = validRegion(user.region) && !atHomeArea;
  const areaLabel = district ? districtLabel(district) : `${regionObj?.name ?? ""} — barcha tumanlar`;

  const resetFilters = () => {
    setType("all");
    setDay(null);
    setLimit(PAGE);
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Bepul YuniQo sessiyalari"
        subtitle="Tumaningizdagi bepul konsultatsiya, seminar va amaliy mashg‘ulotlar"
        emoji="🏢"
      />

      {tab === "list" ? <SessionsHero /> : <MyBookingsHero bookings={view.bookings} />}

      <Tabs<Tab>
        className="mt-5"
        value={tab}
        onChange={changeTab}
        items={[
          { value: "list", label: "📅 Sessiyalar" },
          { value: "my", label: "🎟️ Mening yozilishlarim", count: upcomingCount },
        ]}
      />

      {tab === "list" ? (
        <div className="mt-4">
          {/* Hudud va filtrlar */}
          <Card className="p-3.5 sm:p-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="sr-only">Hudud</span>
                <SelectField
                  value={region}
                  onChange={(e) => {
                    const r = e.target.value;
                    const ds = getRegion(r)?.districts ?? [];
                    setRegion(r);
                    setDistrict(r === user.region && user.district && ds.includes(user.district) ? user.district : "");
                    setDay(null);
                    setLimit(PAGE);
                  }}
                >
                  {REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </SelectField>
              </label>
              <label className="block">
                <span className="sr-only">Tuman</span>
                <SelectField
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setDay(null);
                    setLimit(PAGE);
                  }}
                >
                  <option value="">Barcha tumanlar ({regionObj?.districts.length ?? 0})</option>
                  {(regionObj?.districts ?? []).map((d) => (
                    <option key={d} value={d}>
                      {districtLabel(d)}
                    </option>
                  ))}
                </SelectField>
              </label>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-0.5">
              <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold text-ink-2">
                <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
                <span className="truncate">{areaLabel}</span>
                {isHome && <Badge tone="brand">Sizning tumaningiz</Badge>}
              </div>
              {canGoHome && (
                <button
                  type="button"
                  onClick={() => {
                    setRegion(user.region as string);
                    setDistrict(homeDistrict);
                    setDay(null);
                    setLimit(PAGE);
                  }}
                  className="text-[13px] font-extrabold text-brand-600 hover:text-brand-700"
                >
                  📍 Mening tumanim
                </button>
              )}
            </div>
            <Chips<TypeFilter>
              className="mt-3"
              value={type}
              onChange={(v) => {
                setType(v);
                setLimit(PAGE);
              }}
              items={[
                { value: "all", label: "Barchasi" },
                ...SESSION_TYPE_ORDER.map((t) => ({ value: t, label: SHORT_TYPE_LABEL[t], emoji: SESSION_TYPES[t].emoji })),
              ]}
            />
          </Card>

          {/* 14 kunlik kalendar */}
          <div className="mb-2 mt-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-ink">🗓️ Keyingi 14 kun</h2>
            {day ? (
              <button type="button" onClick={() => setDay(null)} className="text-sm font-extrabold text-brand-600 hover:text-brand-700">
                Barcha kunlar
              </button>
            ) : (
              <span className="text-xs font-bold text-muted">Kunni tanlang</span>
            )}
          </div>
          <CalendarStrip
            days={days14}
            selected={day}
            onSelect={(d) => {
              setDay(d);
              setLimit(PAGE);
            }}
            typesByDay={typesByDay}
          />

          {/* Ro‘yxat */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-ink-2">
              {day ? formatDate(day, { weekday: true }) : "Yaqin sessiyalar"} · <span className="text-muted">{visible.length} ta</span>
            </div>
            {(type !== "all" || day) && (
              <button type="button" onClick={resetFilters} className="text-sm font-extrabold text-brand-600 hover:text-brand-700">
                Filtrlarni tozalash
              </button>
            )}
          </div>

          {groups.length ? (
            <div className="mt-1 space-y-2">
              {groups.map((g) => {
                const rel = relativeTag(g.date);
                return (
                  <section key={g.date}>
                    <div className="sticky top-16 z-10 -mx-4 bg-canvas/90 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-black text-ink">{formatDate(g.date, { weekday: true })}</h3>
                        {rel && <Badge tone="brand">{rel}</Badge>}
                        <span className="ml-auto text-xs font-bold text-muted">{g.items.length} ta sessiya</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {g.items.map((s) => (
                        <SessionCard key={s.id} session={s} extra={view.sessionBookings[s.id] ?? 0} booked={bookedIds.has(s.id)} onOpen={openSession} />
                      ))}
                    </div>
                  </section>
                );
              })}
              {visible.length > limit && (
                <div className="pt-3 text-center">
                  <Button variant="secondary" onClick={() => setLimit((n) => n + PAGE)}>
                    <ChevronDown className="h-4 w-4" />
                    Yana ko‘rsatish ({visible.length - limit} ta)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              className="mt-3"
              emoji="🔎"
              title={upcoming.length ? "Bu filtr bo‘yicha sessiya topilmadi" : "Bu hududda yaqin sessiya yo‘q"}
              text={
                upcoming.length
                  ? "Boshqa kun yoki sessiya turini tanlab ko‘ring."
                  : "Qo‘shni tumanni yoki «Barcha tumanlar»ni tanlab ko‘ring — yangi sessiyalar har hafta qo‘shiladi."
              }
              action={
                upcoming.length ? (
                  <Button variant="secondary" onClick={resetFilters}>
                    Filtrlarni tozalash
                  </Button>
                ) : district ? (
                  <Button variant="secondary" onClick={() => setDistrict("")}>
                    Barcha tumanlar
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      ) : (
        <MyBookings onOpenSession={openSession} onCancel={askCancel} onBrowse={() => changeTab("list")} />
      )}

      {/* Eslatma haqida */}
      <Card className="mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <EmojiTile emoji="🔔" color="#e0f2fe" size={48} />
          <div className="min-w-0">
            <div className="font-extrabold leading-snug text-ink">Telegram bot sizga sessiyadan bir kun oldin eslatadi</div>
            <div className="mt-0.5 text-sm text-muted">Eslatma vaqti va hududingizdagi yangi sessiyalar haqidagi xabarlarni sozlang.</div>
          </div>
        </div>
        <Button variant="soft" href="/reminders" className="shrink-0">
          Eslatmalarni sozlash
        </Button>
      </Card>

      {current && <SessionSheet key={current.id} session={current} onClose={closeSession} onCancel={askCancel} />}
      <CancelBookingSheet booking={cancel} onClose={closeCancel} />
    </div>
  );
}

export function SessionsSkeleton() {
  return (
    <div>
      <Skeleton className="h-14 w-2/3" />
      <Skeleton className="mt-4 h-56 w-full rounded-[32px]" />
      <Skeleton className="mt-5 h-12 w-full" />
      <Skeleton className="mt-4 h-40 w-full rounded-3xl" />
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Skeleton className="h-60 rounded-3xl" />
        <Skeleton className="h-60 rounded-3xl" />
      </div>
    </div>
  );
}
