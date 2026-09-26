"use client";

import { ArrowRight, Copy, Download, KeyRound, Laptop, Lock, Smartphone, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { DemoControls } from "@/components/account/demo-controls";
import { shareState } from "@/components/account/meta";
import { ShareList } from "@/components/account/share-list";
import { SwitchRow } from "@/components/account/switch-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmojiTile, PageHeader, Section } from "@/components/ui/misc";
import { useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { tg } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { Consents, UserView } from "@/lib/types";
import { cn, todayKey } from "@/lib/utils";

const CONSENTS: { key: keyof Consents; emoji: string; color: string; label: string; description: string; required?: boolean }[] = [
  {
    key: "dataProcessing",
    emoji: "📄",
    color: "#e0f2fe",
    label: "Ma’lumotlarni qayta ishlashga rozilik",
    required: true,
    description:
      "Ilova ishlashi uchun zarur: bola profili, baholash natijalari va mashqlar tarixi xavfsiz saqlanadi. O‘zbekiston Respublikasining «Shaxsga doir ma’lumotlar to‘g‘risida»gi qonuniga muvofiq.",
  },
  {
    key: "videoAnalysis",
    emoji: "🎥",
    color: "#e7f0fb",
    label: "Video tahlil (kamera, qurilmada)",
    description: "AI video nazorat kamerani faqat mashq paytida ishlatadi. Tasvir qurilmangizda tahlil qilinadi va hech qayerga yuborilmaydi.",
  },
  {
    key: "audioAnalysis",
    emoji: "🎙️",
    color: "#fdeee7",
    label: "Audio tahlil (mikrofon)",
    description: "Talaffuzni tekshirish uchun mikrofon ishlatiladi. Ovoz yozuvi saqlanmaydi — faqat natija (ball) saqlanadi.",
  },
  {
    key: "shareWithSpecialists",
    emoji: "👩‍⚕️",
    color: "#fcecf2",
    label: "Mutaxassislarga ulashish",
    description: "Konsultatsiyaga yozilganingizda natijalar tanlangan mutaxassisga 30 kunga avtomatik ulashiladi.",
  },
  {
    key: "specialistExchange",
    emoji: "🤝",
    color: "#e3f6ef",
    label: "Mutaxassislar o‘rtasida ma’lumot almashish",
    description: "Farzandingiz bilan ishlayotgan mutaxassislar bir-birining tavsiyalarini ko‘radi — yondashuv yagona bo‘ladi.",
  },
  {
    key: "community",
    emoji: "👨‍👩‍👧",
    color: "#fdf3dc",
    label: "Hamjamiyatda ismim ko‘rinsin",
    description: "O‘chirilsa, savol va javoblaringiz «Anonim ota-ona» nomi bilan chiqadi.",
  },
];

const SAVED = [
  { ok: true, text: "Ball va aniqlik (%)" },
  { ok: true, text: "Takrorlar soni" },
  { ok: true, text: "Ushlab turish vaqti (soniya)" },
  { ok: false, text: "Video va rasmlar" },
  { ok: false, text: "Ovoz yozuvlari" },
];

// ---------------------------------------------------------------------------
// Qurilma nomi (faqat brauzerda aniqlanadi)
const noopSubscribe = () => () => {};

function deviceLabel(): string {
  const ua = navigator.userAgent;
  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X|Macintosh/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "Qurilma";
  if (tg()) return `Telegram · ${os}`;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /YaBrowser/.test(ua)
        ? "Yandex Browser"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Firefox\//.test(ua)
            ? "Firefox"
            : /Safari\//.test(ua)
              ? "Safari"
              : "Brauzer";
  return `${browser} · ${os}`;
}

function isMobileUa(): boolean {
  return /iPhone|iPad|iPod|Android/.test(navigator.userAgent);
}

/** Shaxsiy ma’lumotlar eksporti (boshqa foydalanuvchilarning postlarisiz) */
function exportData(view: UserView) {
  return {
    app: "YuniQo",
    exportedAt: new Date().toISOString(),
    user: view.user,
    children: view.children,
    assessments: view.assessments,
    activities: view.activities,
    plans: view.plans,
    bookings: view.bookings,
    assignments: view.assignments,
    notes: view.notes,
    shares: view.shares,
    orders: view.orders,
    posts: view.posts.filter((p) => p.authorUid === view.user.uid),
  };
}

export default function SettingsPage() {
  const view = useView();
  const act = useApp((s) => s.act);
  const mode = useApp((s) => s.mode);
  const c = view.user.consents;
  const device = useSyncExternalStore(noopSubscribe, deviceLabel, () => "Shu qurilma");
  const mobile = useSyncExternalStore(noopSubscribe, isMobileUa, () => false);

  // /settings#demo — sahifa yuklangach demo bo‘limiga o‘tish
  useEffect(() => {
    if (window.location.hash !== "#demo") return;
    const t = setTimeout(() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    return () => clearTimeout(t);
  }, []);

  const nowIso = new Date().toISOString();
  const counts = { active: 0, expired: 0, revoked: 0 };
  for (const s of view.shares) counts[shareState(s, nowIso)]++;

  const setConsent = async (key: keyof Consents, value: boolean) => {
    if (key === "dataProcessing" && !value) {
      toast.info("Bu rozilik ilova ishlashi uchun zarur. Uni bekor qilish — hisobni o‘chirish demakdir.", "🔒");
      return;
    }
    const prev = useApp.getState().view;
    if (prev) useApp.getState().setView({ ...prev, user: { ...prev.user, consents: { ...prev.user.consents, [key]: value } } });
    try {
      const r = await act({ type: "user.consents", consents: { [key]: value } }, { silent: true });
      if (r.ok) toast.success("Saqlandi");
      else {
        if (prev) useApp.getState().setView(prev);
        toast.error(r.error ?? "Saqlab bo‘lmadi");
      }
    } catch {
      if (prev) useApp.getState().setView(prev);
      toast.error("Saqlab bo‘lmadi. Internet aloqasini tekshiring");
    }
  };

  const download = () => {
    try {
      const json = JSON.stringify(exportData(view), null, 2);
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `yuniqo-malumotlarim-${todayKey()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success("Fayl yuklab olindi", "⬇️");
    } catch {
      toast.error("Yuklab bo‘lmadi — «Nusxa olish»ni sinab ko‘ring");
    }
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData(view), null, 2));
      toast.success("Ma’lumotlar nusxalandi (JSON)", "📋");
    } catch {
      toast.error("Nusxa olib bo‘lmadi");
    }
  };

  return (
    <div>
      <PageHeader title="Xavfsizlik va maxfiylik" subtitle="Ma’lumotlaringiz qanday ishlatilishini o‘zingiz boshqarasiz" emoji="🔐" />

      {/* ------------------------------------------------ Ishonch banneri */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white p-5 shadow-card sm:p-6">
        <div className="relative flex items-start gap-4">
          <EmojiTile emoji="🛡️" color="#ffffff" size={52} className="shadow-card" />
          <div className="min-w-0">
            <h2 className="text-lg font-black leading-tight text-ink sm:text-xl">Farzandingiz ma’lumotlari himoyalangan</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Hech qanday ma’lumot sizning roziligingizsiz ulashilmaydi. Har bir ruxsatni shu yerda ko‘rib, istalgan vaqtda bekor qilishingiz mumkin.
            </p>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2">
          {["📱 AI tahlil qurilmada", "🔑 Ulashish faqat ruxsat bilan", "↩️ Istalgan vaqtda bekor qilish"].map((t) => (
            <span key={t} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink-2 ring-1 ring-brand-100">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------ Roziliklar */}
      <Section title="Rozilik va ruxsatlar">
        <Card className="px-5 py-2">
          <div className="divide-y divide-line">
            {CONSENTS.map((it) => (
              <SwitchRow
                key={it.key}
                emoji={it.emoji}
                color={it.color}
                label={it.label}
                badge={
                  it.required ? (
                    <Badge tone="gray">
                      <Lock className="h-3 w-3" />
                      Majburiy
                    </Badge>
                  ) : undefined
                }
                description={it.description}
                checked={c[it.key]}
                onChange={(v) => void setConsent(it.key, v)}
                className="py-3"
              />
            ))}
          </div>
        </Card>
      </Section>

      {/* ------------------------------------------------ Ulashishlar */}
      <Section
        title="Mutaxassisga ma’lumot berish ruxsatlari"
        action={
          <span className="hidden text-xs font-bold text-muted sm:block">
            {counts.active} faol · {counts.expired} tugagan · {counts.revoked} bekor
          </span>
        }
      >
        <p className="-mt-1 mb-3 text-sm leading-relaxed text-muted">
          Har bir ruxsatda mutaxassis nimani ko‘ra olishi va qachongacha amal qilishi ko‘rsatilgan. Bekor qilingan havola darhol ishlamay qoladi.
        </p>
        <ShareList shares={view.shares} />
        <Link
          href="/passport"
          className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-brand-200 bg-white/60 py-3 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
        >
          Rivojlanish pasporti orqali yangi ruxsat berish
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Section>

      {/* ------------------------------------------------ Video va audio */}
      <Section title="Video va audio ma’lumotlar">
        <Card className="p-5">
          <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <FlowStep emoji="📷" color="#e7f0fb" title="Kamera va mikrofon" text="Faqat mashq vaqtida yoqiladi" />
            <FlowArrow />
            <FlowStep emoji="📱" color="#e0f2fe" title="Qurilmada AI tahlil" text="Telefon yoki kompyuteringiz ichida" highlight />
            <FlowArrow />
            <FlowStep emoji="📊" color="#e3f6ef" title="Faqat natija saqlanadi" text="Ball, takrorlar, vaqt" />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ul className="space-y-2.5 text-sm leading-relaxed text-ink-2">
              <li className="flex gap-2.5">
                <span>🧠</span>
                <span>
                  <b className="text-ink">AI video va audio tahlil qurilmada bajariladi</b> — MediaPipe modeli brauzerning o‘zida ishlaydi.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span>☁️</span>
                <span>
                  <b className="text-ink">Yozuvlar serverga yuklanmaydi</b> — kamera tasviri va ovoz hech qayerga yuborilmaydi va saqlanmaydi.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span>🎛️</span>
                <span>Kamera va mikrofon ruxsatini yuqoridagi «Rozilik va ruxsatlar» bo‘limida istalgan vaqtda o‘chirishingiz mumkin.</span>
              </li>
            </ul>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-line">
              <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">Nima saqlanadi</div>
              <ul className="space-y-1.5">
                {SAVED.map((s) => (
                  <li key={s.text} className="flex items-center gap-2 text-sm font-semibold">
                    <span className={cn("grid h-5 w-5 place-items-center rounded-full text-[11px] font-black", s.ok ? "bg-good/15 text-[#006300]" : "bg-danger/10 text-danger")}>
                      {s.ok ? "✓" : "✕"}
                    </span>
                    <span className={s.ok ? "text-ink-2" : "text-muted line-through decoration-danger/40"}>{s.text}</span>
                    {!s.ok && <span className="text-xs font-bold text-muted">— saqlanmaydi</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </Section>

      {/* ------------------------------------------------ Hisob xavfsizligi */}
      <Section title="Hisob xavfsizligi">
        <Card className="divide-y divide-line px-5">
          <SecurityRow
            icon={<KeyRound className="h-5 w-5" />}
            title="Telegram orqali kirish"
            badge={mode === "telegram" ? <Badge tone="good">✓ Faol</Badge> : <Badge tone="warn">Demo rejim</Badge>}
            text="Parol kerak emas: har bir so‘rov Telegram imzosi (initData, HMAC-SHA256) bilan serverda tekshiriladi. Soxta so‘rovlar rad etiladi."
          />
          <SecurityRow
            icon={mobile ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
            title="Faol seanslar"
            badge={<Badge tone="good">● Hozir faol</Badge>}
            text={
              <>
                <b className="text-ink-2">Shu qurilma</b> · {device}. Boshqa faol seanslar yo‘q.
              </>
            }
          />
          <SecurityRow
            icon={<Download className="h-5 w-5" />}
            title="Ma’lumotlarni yuklab olish (JSON)"
            text={`Profil, ${view.children.length} ta bola, ${view.assessments.length} ta baholash, ${view.activities.length} ta mashg‘ulot, ${view.bookings.length} ta yozilish va ruxsatlar — bitta faylda.`}
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={download}>
                  <Download className="h-4 w-4" />
                  Yuklab olish
                </Button>
                <Button size="sm" variant="ghost" onClick={copyJson} aria-label="JSON nusxasini olish">
                  <Copy className="h-4 w-4" />
                  Nusxa olish
                </Button>
              </div>
            }
          />
          <SecurityRow
            icon={<Trash2 className="h-5 w-5" />}
            danger
            title="Hisobni o‘chirish"
            text="Demo rejimda o‘chirib bo‘lmaydi. Haqiqiy hisobda barcha ma’lumotlar (bolalar profili, natijalar, ruxsatlar) 30 kun ichida serverdan butunlay o‘chiriladi."
            action={
              <Button size="sm" variant="danger" disabled>
                Hisobni o‘chirish
              </Button>
            }
          />
        </Card>
      </Section>

      {/* ------------------------------------------------ Demo boshqaruvi */}
      <div id="demo" className="scroll-mt-24">
        <Section title="Ko‘rgazma (demo) boshqaruvi">
          <DemoControls />
        </Section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function FlowStep({ emoji, color, title, text, highlight }: { emoji: string; color: string; title: string; text: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 sm:flex-col sm:text-center",
        highlight ? "border-brand-200 bg-brand-50/60" : "border-line bg-white",
      )}
    >
      <EmojiTile emoji={emoji} color={color} size={44} />
      <div className="min-w-0">
        <div className="text-sm font-extrabold leading-snug text-ink">{title}</div>
        <div className="text-xs font-semibold text-muted">{text}</div>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="grid place-items-center text-brand-400" aria-hidden>
      <ArrowRight className="h-5 w-5 rotate-90 sm:rotate-0" />
    </div>
  );
}

function SecurityRow({
  icon,
  title,
  text,
  badge,
  action,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  text: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl", danger ? "bg-danger/10 text-danger" : "bg-brand-50 text-brand-600")}>{icon}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] font-extrabold text-ink">{title}</span>
            {badge}
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-muted">{text}</p>
        </div>
      </div>
      {action && <div className="shrink-0 pl-[52px] sm:pl-0">{action}</div>}
    </div>
  );
}
