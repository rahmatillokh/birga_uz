"use client";

import { Bell, ChevronDown, Plus, Stethoscope, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSpecialist } from "@/data/specialists";
import { SPECIALTIES } from "@/lib/constants";
import { useActiveChild, useIsPremium, useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic, setupTelegram, tg } from "@/lib/client/telegram";
import { ageOf, cn } from "@/lib/utils";
import { Logo, LogoMark } from "@/components/ui/logo";
import { Sheet } from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/misc";
import { BOTTOM_NAV, isActive, NAV_GROUPS, SPECIALIST_NAV } from "./nav";
import { RewardOverlay } from "./reward-overlay";
import { Toaster } from "./toaster";

const NO_SHELL = ["/onboarding", "/r/"];

/** Mutaxassis kabineti yo‘llari (/specialists — ota-onalar uchun katalog, unga kirmaydi) */
function isSpecialistPath(p: string): boolean {
  return p === "/specialist" || p.startsWith("/specialist/");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const status = useApp((s) => s.status);
  const init = useApp((s) => s.init);
  const role = useApp((s) => s.role);
  const view = useApp((s) => s.view);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setupTelegram();
    // Telegram skripti kechroq yuklansa ham sozlab qo‘yamiz
    const t = setTimeout(setupTelegram, 800);
    void init();
    return () => clearTimeout(t);
  }, [init]);

  // Botda yoki boshqa qurilmada qilingan o‘zgarishlar: oynaga qaytilganda yangilash
  const refresh = useApp((s) => s.refresh);
  useEffect(() => {
    let last = Date.now();
    const onBack = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < 4000) return;
      last = Date.now();
      void refresh();
    };
    document.addEventListener("visibilitychange", onBack);
    window.addEventListener("focus", onBack);
    return () => {
      document.removeEventListener("visibilitychange", onBack);
      window.removeEventListener("focus", onBack);
    };
  }, [refresh]);

  // Telegram "Orqaga" tugmasi
  useEffect(() => {
    const w = tg();
    if (!w?.BackButton) return;
    const onBack = () => router.back();
    if (pathname !== "/" && pathname !== "/specialist") {
      w.BackButton.show();
      w.BackButton.onClick(onBack);
    } else {
      w.BackButton.hide();
    }
    return () => w.BackButton.offClick(onBack);
  }, [pathname, router]);

  // Yangi foydalanuvchi — onboarding
  useEffect(() => {
    if (status !== "ready" || !view) return;
    const bare = NO_SHELL.some((p) => pathname.startsWith(p));
    if (!bare && role === "parent" && view.children.length === 0 && !isSpecialistPath(pathname)) {
      router.replace("/onboarding");
    }
  }, [status, view, pathname, role, router]);

  const bare = NO_SHELL.some((p) => pathname.startsWith(p));
  if (bare) {
    return (
      <>
        {children}
        <Toaster />
        <RewardOverlay />
      </>
    );
  }

  if (status !== "ready" || !view) return <Splash />;

  const specialistMode = role === "specialist" || isSpecialistPath(pathname);

  return (
    <div className="min-h-dvh overflow-x-clip lg:pl-[272px]">
      <Sidebar specialistMode={specialistMode} />
      <TopBar specialistMode={specialistMode} />
      <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-4 sm:px-6 lg:pb-16 lg:pt-6">{children}</main>
      {!specialistMode && <BottomNav />}
      {specialistMode && <SpecialistBottomNav />}
      <Toaster />
      <RewardOverlay />
    </div>
  );
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas">
      <div className="flex flex-col items-center">
        <LogoMark size={76} className="animate-float" />
        <div className="mt-4 text-2xl font-black text-ink">YuniQo</div>
        <div className="mt-1 text-sm font-semibold text-muted">Har bir bola uchun imkoniyat</div>
        <div className="mt-6 h-1.5 w-32 overflow-hidden rounded-full bg-brand-100">
          <div className="h-full w-1/2 animate-[float_1s_ease-in-out_infinite] rounded-full bg-brand-gradient" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Sidebar({ specialistMode }: { specialistMode: boolean }) {
  const pathname = usePathname();
  const premium = useIsPremium();
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-line bg-white/95 backdrop-blur lg:flex">
      <div className="px-5 pb-3 pt-5">
        <Link href={specialistMode ? "/specialist" : "/"}>
          <Logo tagline />
        </Link>
      </div>
      <div className="px-4 pb-2">
        <RoleSwitch />
      </div>
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        {specialistMode ? (
          <div className="mt-2 space-y-0.5">
            {SPECIALIST_NAV.map((it) => (
              <NavLink key={it.href} {...it} active={isActive(pathname, it.href) && !it.href.includes("?")} />
            ))}
          </div>
        ) : (
          NAV_GROUPS.map((g) => (
            <div key={g.title} className="mt-3">
              <div className="px-3 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-faint">{g.title}</div>
              <div className="space-y-0.5">
                {g.items.map((it) => (
                  <NavLink key={it.href} {...it} active={isActive(pathname, it.href)} showLock={it.premium && !premium} />
                ))}
              </div>
            </div>
          ))
        )}
      </nav>
      {!specialistMode && !premium && (
        <Link href="/premium" className="m-3 rounded-2xl bg-gradient-to-br from-[#8b6cff] to-[#5b3fe0] p-4 text-white">
          <div className="text-sm font-black">💎 YuniQo Premium</div>
          <div className="mt-0.5 text-xs text-white/85">AI yordamchi, AI video nazorat va batafsil hisobotlar</div>
        </Link>
      )}
    </aside>
  );
}

function NavLink({ href, label, emoji, active, showLock }: { href: string; label: string; emoji: string; active: boolean; showLock?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2 text-[14.5px] font-bold transition",
        active ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100" : "text-ink-2 hover:bg-slate-50",
      )}
    >
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-[17px] shadow-[0_1px_3px_rgb(15_23_42/0.08)]">{emoji}</span>
      <span className="flex-1">{label}</span>
      {showLock && <span className="text-[11px]">💎</span>}
    </Link>
  );
}

export function RoleSwitch({ className }: { className?: string }) {
  const role = useApp((s) => s.role);
  const setRole = useApp((s) => s.setRole);
  const refresh = useApp((s) => s.refresh);
  const loadSpecialist = useApp((s) => s.loadSpecialist);
  const router = useRouter();
  const pathname = usePathname();
  const specialistMode = role === "specialist" || isSpecialistPath(pathname);
  return (
    <div className={cn("flex rounded-2xl bg-slate-100 p-1", className)}>
      {(
        [
          { v: "parent", label: "Ota-ona", icon: Users, href: "/" },
          { v: "specialist", label: "Mutaxassis", icon: Stethoscope, href: "/specialist" },
        ] as const
      ).map((o) => {
        const on = o.v === "specialist" ? specialistMode : !specialistMode;
        return (
          <button
            key={o.v}
            onClick={() => {
              haptic("select");
              setRole(o.v);
              // rol almashganda eng so‘nggi ma’lumotlar (mutaxassis topshirig‘i ota-onada darhol ko‘rinsin)
              if (o.v === "parent") void refresh();
              else void loadSpecialist();
              router.push(o.href);
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-extrabold transition",
              on ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            <o.icon className="h-4 w-4" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------

function TopBar({ specialistMode }: { specialistMode: boolean }) {
  const mode = useApp((s) => s.mode);
  const specialistId = useApp((s) => s.specialistId);
  const view = useView();
  const sp = getSpecialist(specialistId);
  const upcoming = view.bookings.filter((b) => b.status !== "bekor" && b.status !== "otdi").length;
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Link href={specialistMode ? "/specialist" : "/"} className="lg:hidden">
          <LogoMark size={36} />
        </Link>
        {specialistMode ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={sp?.name} color={sp?.color} size={36} />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-extrabold text-ink">{sp?.name}</div>
              <div className="truncate text-xs font-semibold text-muted">{sp ? SPECIALTIES[sp.specialty].label : ""} · kabinet</div>
            </div>
          </div>
        ) : (
          <ChildSwitcher />
        )}
        <div className="ml-auto flex items-center gap-2">
          <ModePill mode={mode} />
          <div className="hidden w-56 sm:block lg:hidden">
            <RoleSwitch />
          </div>
          {!specialistMode && (
            <Link href="/reminders" className="relative grid h-10 w-10 place-items-center rounded-2xl border border-line bg-white text-ink-2 hover:bg-brand-50" aria-label="Eslatmalar">
              <Bell className="h-5 w-5" />
              {upcoming > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-black text-white">{upcoming}</span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function ModePill({ mode }: { mode: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    telegram: { label: "Telegram", cls: "bg-[#e5f3fd] text-[#1d8ad6]" },
    demo: { label: "Demo", cls: "bg-warn/15 text-[#8a5a00]" },
    offline: { label: "Oflayn", cls: "bg-slate-200 text-ink-2" },
  };
  const m = map[mode] ?? map.demo;
  return (
    <Link href="/settings#demo" className={cn("hidden rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide sm:inline-block", m.cls)}>
      {m.label}
    </Link>
  );
}

function ChildSwitcher() {
  const view = useView();
  const child = useActiveChild();
  const act = useApp((s) => s.act);
  const [open, setOpen] = useState(false);
  if (!child) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-line bg-white py-1.5 pl-1.5 pr-3 hover:border-brand-200"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-xl">{child.avatar}</span>
        <span className="min-w-0 text-left leading-tight">
          <span className="block truncate text-sm font-extrabold text-ink">{child.name}</span>
          <span className="block truncate text-xs font-semibold text-muted">{ageOf(child.birthDate).label}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Farzandlarim" size="sm">
        <div className="space-y-2">
          {view.children.map((c) => (
            <button
              key={c.id}
              onClick={async () => {
                setOpen(false);
                if (c.id !== child.id) await act({ type: "child.select", childId: c.id }, { silent: true });
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                c.id === child.id ? "border-brand-400 bg-brand-50" : "border-line hover:border-brand-200",
              )}
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-card">{c.avatar}</span>
              <span className="flex-1">
                <span className="block font-extrabold text-ink">{c.name}</span>
                <span className="block text-sm text-muted">
                  {ageOf(c.birthDate).label} · {c.gender}
                </span>
              </span>
              {c.id === child.id && <span className="text-sm font-bold text-brand-600">Tanlangan</span>}
            </button>
          ))}
          <Link
            href="/onboarding?add=1"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-brand-300 p-3 font-bold text-brand-700 hover:bg-brand-50"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50">
              <Plus className="h-5 w-5" />
            </span>
            Yangi bola profili qo‘shish
          </Link>
        </div>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <div className="mx-auto grid h-[68px] max-w-lg grid-cols-5 items-end px-2">
        {BOTTOM_NAV.map((it, i) => {
          const active = isActive(pathname, it.href);
          if (i === 2) {
            return (
              <Link key={it.href} href={it.href} className="flex flex-col items-center gap-1 pb-2" onClick={() => haptic("light")}>
                <span
                  className={cn(
                    "-mt-6 grid h-14 w-14 place-items-center rounded-[20px] bg-brand-gradient text-2xl shadow-brand ring-4 ring-white transition",
                    active && "scale-105",
                  )}
                >
                  {it.emoji}
                </span>
                <span className={cn("text-[11px] font-extrabold", active ? "text-brand-700" : "text-muted")}>{it.label}</span>
              </Link>
            );
          }
          return (
            <Link key={it.href} href={it.href} className="flex flex-col items-center gap-1 pb-2.5" onClick={() => haptic("light")}>
              <span className={cn("grid h-9 w-12 place-items-center rounded-2xl text-[22px] transition", active ? "bg-brand-50 scale-105" : "grayscale-[0.4] opacity-80")}>
                {it.emoji}
              </span>
              <span className={cn("text-[11px] font-extrabold", active ? "text-brand-700" : "text-muted")}>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function SpecialistBottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/specialist", label: "Kabinet", emoji: "🩺" },
    { href: "/specialists/sp-dilnoza", label: "Profilim", emoji: "👩‍🏫" },
    { href: "/community", label: "Savollar", emoji: "💬" },
    { href: "/", label: "Ota-ona", emoji: "👨‍👩‍👧" },
  ];
  const setRole = useApp((s) => s.setRole);
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <div className="mx-auto grid h-[64px] max-w-lg grid-cols-4 items-center px-2">
        {items.map((it) => {
          const active = isActive(pathname, it.href) && it.href !== "/";
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => {
                if (it.href === "/") {
                  setRole("parent");
                  void useApp.getState().refresh();
                }
              }}
              className="flex flex-col items-center gap-0.5"
            >
              <span className={cn("grid h-8 w-12 place-items-center rounded-2xl text-xl", active && "bg-brand-50")}>{it.emoji}</span>
              <span className={cn("text-[11px] font-extrabold", active ? "text-brand-700" : "text-muted")}>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
