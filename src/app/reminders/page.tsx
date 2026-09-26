"use client";

import { BellRing } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { districtLabel } from "@/data/regions";
import { TelegramButton, TelegramTile } from "@/components/account/bot-card";
import { buildTimeline, nextReminderDay, ReminderTimeline, TelegramPreview } from "@/components/account/reminder-timeline";
import { SwitchRow } from "@/components/account/switch-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { EmptyState, InfoNote, PageHeader } from "@/components/ui/misc";
import { WEEKDAYS, WEEKDAYS_SHORT } from "@/lib/constants";
import { todayTasks } from "@/lib/core/stats";
import { apiPost } from "@/lib/client/api";
import { useChildData, useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { ReminderSettings, UserView } from "@/lib/types";
import { cn, relativeDay, weekdayOf } from "@/lib/utils";

const PRESETS = [
  { time: "08:00", label: "Ertalab", emoji: "🌅" },
  { time: "12:00", label: "Tushda", emoji: "☀️" },
  { time: "16:00", label: "Kunduzi", emoji: "🌤️" },
  { time: "18:30", label: "Oqshom", emoji: "🌆" },
  { time: "20:00", label: "Kechasi", emoji: "🌙" },
];

const DAY_PRESETS = [
  { label: "Har kuni", days: [1, 2, 3, 4, 5, 6, 7] },
  { label: "Ish kunlari", days: [1, 2, 3, 4, 5] },
  { label: "Dam olish kunlari", days: [6, 7] },
];

const TYPES: { key: keyof ReminderSettings["types"]; emoji: string; color: string; label: string; description: string }[] = [
  { key: "daily", emoji: "🎯", color: "#fdeee7", label: "Bugungi mashqlar", description: "Individual reja bo‘yicha bugun bajariladigan mashqlar ro‘yxati" },
  { key: "specialist", emoji: "👩‍🏫", color: "#e7f0fb", label: "Mutaxassis topshiriqlari", description: "Yangi topshiriq kelganda va muddati yaqinlashganda" },
  { key: "reassessment", emoji: "🧠", color: "#efeaff", label: "Qayta baholash", description: "Har 30 kunda — rivojlanishni qayta baholash vaqti kelganda" },
  { key: "sessions", emoji: "🏢", color: "#e2f2e2", label: "Sessiyalar", description: "Yozilgan sessiya va konsultatsiyadan 1 kun oldin" },
];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function sameDays(a: number[], b: number[]) {
  return a.length === b.length && [...a].sort().join() === [...b].sort().join();
}

function daysLabel(days: number[]): string {
  const hit = DAY_PRESETS.find((p) => sameDays(p.days, days));
  if (hit) return hit.label;
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAYS_SHORT[d - 1])
    .join(", ");
}

/** Optimistik yangilash: avval ekranda o‘zgaradi, keyin serverga yuboriladi */
function patchView(view: UserView, fn: (v: UserView) => UserView) {
  useApp.getState().setView(fn(view));
}

export default function RemindersPage() {
  const view = useView();
  const act = useApp((s) => s.act);
  const mode = useApp((s) => s.mode);
  const bot = useApp((s) => s.bot);
  const { child, plan, assignments, activities, latest } = useChildData();
  const r = view.user.reminders;
  const [draft, setDraft] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const t = timer;
    return () => clearTimeout(t.current);
  }, []);

  const tasksToday = useMemo(() => todayTasks(plan, assignments, activities), [plan, assignments, activities]);
  const items = useMemo(() => buildTimeline({ view, child, plan, assignments, activities, latest }), [view, child, plan, assignments, activities, latest]);
  const next = r.enabled ? nextReminderDay(r.days, r.time) : undefined;
  const place = view.user.district ? districtLabel(view.user.district) : "";

  const save = async (patch: Partial<ReminderSettings>, msg = "Saqlandi") => {
    const prev = useApp.getState().view;
    if (prev) {
      patchView(prev, (v) => ({
        ...v,
        user: { ...v.user, reminders: { ...v.user.reminders, ...patch, types: { ...v.user.reminders.types, ...(patch.types ?? {}) } } },
      }));
    }
    try {
      const res = await act({ type: "user.reminders", reminders: patch }, { silent: true });
      if (res.ok) toast.success(msg);
      else {
        if (prev) useApp.getState().setView(prev);
        toast.error(res.error ?? "Saqlab bo‘lmadi");
      }
    } catch {
      if (prev) useApp.getState().setView(prev);
      toast.error("Saqlab bo‘lmadi. Internet aloqasini tekshiring");
    }
  };

  const setAlerts = async (enabled: boolean) => {
    const prev = useApp.getState().view;
    if (prev) patchView(prev, (v) => ({ ...v, user: { ...v.user, sessionAlerts: enabled } }));
    try {
      const res = await act({ type: "user.sessionAlerts", enabled }, { silent: true });
      if (res.ok) toast.success(enabled ? "Yangi sessiyalar haqida xabar beramiz" : "Saqlandi");
      else {
        if (prev) useApp.getState().setView(prev);
        toast.error(res.error ?? "Saqlab bo‘lmadi");
      }
    } catch {
      if (prev) useApp.getState().setView(prev);
      toast.error("Saqlab bo‘lmadi. Internet aloqasini tekshiring");
    }
  };

  const commitTime = (t: string) => {
    clearTimeout(timer.current);
    setDraft(null);
    const current = useApp.getState().view?.user.reminders.time;
    if (TIME_RE.test(t) && t !== current) void save({ time: t }, `Eslatma vaqti: ${t}`);
  };

  const onTimeInput = (t: string) => {
    setDraft(t);
    clearTimeout(timer.current);
    if (TIME_RE.test(t)) timer.current = setTimeout(() => commitTime(t), 900);
  };

  const toggleDay = (d: number) => {
    haptic("select");
    const has = r.days.includes(d);
    if (has && r.days.length === 1) {
      toast.error("Kamida bitta kunni tanlang");
      return;
    }
    const days = has ? r.days.filter((x) => x !== d) : [...r.days, d].sort((a, b) => a - b);
    void save({ days });
  };

  const sendTest = async () => {
    setSending(true);
    try {
      const { status, data } = await apiPost<{ ok?: boolean; reason?: string; error?: string }>("/api/notify/test", {});
      if (data.ok) toast.success("Test eslatma yuborildi — Telegram’ni tekshiring", "📨");
      else if (data.reason === "no-bot") toast.error("Bot hali ulanmagan (TELEGRAM_BOT_TOKEN)");
      else if (data.reason === "not-telegram") toast.error("Telegram ichida oching");
      else if (status === 401) toast.error(data.error ?? "Telegram ma’lumotlari tasdiqlanmadi");
      else toast.error("Yuborib bo‘lmadi. Botga /start yuborganingizni tekshiring");
    } catch {
      toast.error("Internet aloqasini tekshiring");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Eslatmalar" subtitle="Smart Reminder — mashg‘ulot vaqtini o‘z vaqtida eslatib turamiz" emoji="🔔" />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6">
        {/* ------------------------------------------------ Sozlamalar */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-5 text-white shadow-brand">
            <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/10" />
            <div className="relative flex items-center gap-4">
              <div className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-3xl", r.enabled && "animate-float")}>
                {r.enabled ? "🔔" : "🔕"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-black leading-tight">Smart Reminder</div>
                <div className="mt-0.5 text-sm font-semibold text-white/85">{r.enabled ? `${daysLabel(r.days)} · ${r.time} da` : "Hozir o‘chirilgan"}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={r.enabled}
                aria-label="Eslatmalarni yoqish"
                onClick={() => void save({ enabled: !r.enabled }, r.enabled ? "Eslatmalar o‘chirildi" : "Eslatmalar yoqildi")}
                className={cn("relative h-8 w-14 shrink-0 rounded-full transition", r.enabled ? "bg-white" : "bg-white/30")}
              >
                <span className={cn("absolute top-1 h-6 w-6 rounded-full shadow transition-all", r.enabled ? "left-7 bg-brand-500" : "left-1 bg-white")} />
              </button>
            </div>
            <div className="relative mt-4 flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold ring-1 ring-white/20">
              <BellRing className="h-4 w-4 shrink-0" />
              {r.enabled
                ? next
                  ? `Keyingi eslatma: ${relativeDay(next)}${relativeDay(next).includes("kun") ? ` (${WEEKDAYS[weekdayOf(next) - 1]})` : ""}, ${r.time}`
                  : "Eslatma kunlarini tanlang"
                : "Yoqing — farzandingiz mashg‘ulotlarni o‘tkazib yubormaydi"}
            </div>
          </div>

          <div className={cn("space-y-4 transition", !r.enabled && "opacity-60")}>
            <Card className="p-5">
              <CardTitle action={<span className="text-xs font-bold text-muted">Toshkent vaqti</span>}>⏰ Eslatma vaqti</CardTitle>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {PRESETS.map((p) => {
                  const on = (draft ?? r.time) === p.time;
                  return (
                    <button
                      key={p.time}
                      type="button"
                      onClick={() => {
                        haptic("select");
                        commitTime(p.time);
                      }}
                      aria-pressed={on}
                      className={cn(
                        "flex flex-col items-center rounded-2xl border px-1 py-2.5 transition",
                        on ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-line bg-white hover:border-brand-200",
                      )}
                    >
                      <span className="text-lg leading-none">{p.emoji}</span>
                      <span className={cn("mt-1.5 text-[15px] font-black tabular leading-none", on ? "text-brand-700" : "text-ink")}>{p.time}</span>
                      <span className="mt-1 max-w-full truncate text-[10.5px] font-bold text-muted">{p.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label htmlFor="rem-time" className="text-sm font-bold text-ink-2">
                  Boshqa vaqt:
                </label>
                <Input
                  id="rem-time"
                  type="time"
                  step={300}
                  value={draft ?? r.time}
                  onChange={(e) => onTimeInput(e.target.value)}
                  onBlur={(e) => commitTime(e.target.value)}
                  className="h-11 w-36 font-bold tabular"
                />
              </div>
            </Card>

            <Card className="p-5">
              <CardTitle action={<span className="text-xs font-bold text-muted">{daysLabel(r.days)}</span>}>📅 Hafta kunlari</CardTitle>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS_SHORT.map((d, i) => {
                  const n = i + 1;
                  const on = r.days.includes(n);
                  return (
                    <button
                      key={d}
                      type="button"
                      title={WEEKDAYS[i]}
                      aria-pressed={on}
                      onClick={() => toggleDay(n)}
                      className={cn(
                        "grid h-12 place-items-center rounded-2xl text-sm font-extrabold transition",
                        on ? "bg-brand-500 text-white shadow-brand" : "bg-slate-100 text-muted hover:bg-slate-200",
                      )}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {DAY_PRESETS.map((p) => {
                  const on = sameDays(p.days, r.days);
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => !on && void save({ days: p.days }, `${p.label} eslatamiz`)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                        on ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-white text-ink-2 hover:border-brand-200",
                      )}
                    >
                      {on && "✓ "}
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <CardTitle>🔔 Nimalar haqida eslatamiz</CardTitle>
              <div className="divide-y divide-line">
                {TYPES.map((t) => (
                  <SwitchRow
                    key={t.key}
                    emoji={t.emoji}
                    color={t.color}
                    label={t.label}
                    description={t.description}
                    checked={r.types[t.key]}
                    onChange={(v) => void save({ types: { ...r.types, [t.key]: v } })}
                  />
                ))}
              </div>
              <div className="mt-3 rounded-2xl bg-brand-50/70 px-3 ring-1 ring-brand-100">
                <SwitchRow
                  emoji="📣"
                  color="#ffffff"
                  label="Hududdagi yangi sessiyalar haqida xabar"
                  description={
                    place
                      ? `${place}da yangi bepul YuniQo sessiyasi e’lon qilinganda darhol xabar beramiz`
                      : "Hududingizdagi yangi bepul sessiyalar haqida xabar beramiz (kabinetda hududni tanlang)"
                  }
                  checked={view.user.sessionAlerts}
                  onChange={(v) => void setAlerts(v)}
                />
              </div>
            </Card>
          </div>
        </div>

        {/* ------------------------------------------------ Kanal va vaqt chizig‘i */}
        <div className="space-y-4">
          <Card className="p-5">
            <CardTitle>📨 Eslatmalar qayerga keladi</CardTitle>
            <div className="flex items-center gap-3 rounded-2xl bg-[#eaf6fd] p-3">
              <TelegramTile size={44} />
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-ink">Telegram bot orqali</div>
                <div className="text-[13px] font-semibold text-muted">
                  {mode === "telegram"
                    ? "Shu Telegram akkauntingizga keladi"
                    : bot.username
                      ? `@${bot.username} — botda /start bosing`
                      : "Bot hali ulanmagan"}
                </div>
              </div>
              {mode === "telegram" && bot.connected && <Badge tone="good">✓ Ulangan</Badge>}
            </div>

            {mode === "telegram" ? (
              <Button variant="secondary" block className="mt-3" loading={sending} onClick={sendTest}>
                🔔 Test eslatma yuborish
              </Button>
            ) : (
              <>
                <InfoNote emoji="📱" className="mt-3">
                  Eslatmalar Telegram orqali keladi. Ilovani <b>Telegram ichida</b> oching — sozlamalar avtomatik bog‘lanadi va shu yerda «Test eslatma» tugmasi
                  paydo bo‘ladi.
                </InfoNote>
                {bot.username && <TelegramButton username={bot.username} block className="mt-3" />}
              </>
            )}

            <div className="mt-4">
              <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">Xabar namunasi</div>
              <TelegramPreview childName={child?.name} tasks={tasksToday} time={r.time} />
            </div>
          </Card>

          <Card className="p-5">
            <CardTitle
              action={
                child && (
                  <Badge tone="brand">
                    {child.avatar} {child.name}
                  </Badge>
                )
              }
            >
              🗓️ Yaqin eslatmalar
            </CardTitle>
            {!r.enabled && (
              <InfoNote emoji="🔕" className="mb-3">
                Eslatmalar o‘chirilgan — yoqsangiz, quyidagilar haqida o‘z vaqtida xabar beramiz.
              </InfoNote>
            )}
            {items.length ? (
              <ReminderTimeline items={items} muted={!r.enabled} />
            ) : (
              <EmptyState
                emoji="🌤️"
                title="Yaqin eslatmalar yo‘q"
                text={child ? "Eslatma turlarini yoqing yoki individual rejani yangilang." : "Avval bola profilini yarating."}
                className="py-8"
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
