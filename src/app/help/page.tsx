"use client";

import { Mail, Phone, Search, Send } from "lucide-react";
import { apiPost } from "@/lib/client/api";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FAQ } from "@/data/faq";
import { NEWS } from "@/data/news";
import { TelegramButton, TelegramTile } from "@/components/account/bot-card";
import { FaqList } from "@/components/account/faq-list";
import { FAQ_CATEGORIES, FAQ_ORDER } from "@/components/account/meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { EmojiTile, EmptyState, InfoNote, PageHeader } from "@/components/ui/misc";
import { Chips, Tabs } from "@/components/ui/tabs";
import { MONTHS } from "@/lib/constants";
import { useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { FaqItem, NewsItem } from "@/lib/types";
import { addDays, cn, formatDate, normalizeText, relativeDay, sleep, todayKey } from "@/lib/utils";

type Tab = "faq" | "news" | "support";

const TOPICS = [
  "Ilova ishlashi bo‘yicha savol",
  "Baholash va individual reja",
  "Mutaxassis va konsultatsiya",
  "Bepul sessiyalar",
  "Premium va to‘lov",
  "Market buyurtmasi",
  "Taklif yoki fikr",
  "Boshqa",
];

const EVENT_KEY = "yuniqo-event-reminders";

export default function HelpPage() {
  return (
    <Suspense fallback={null}>
      <HelpContent />
    </Suspense>
  );
}

function HelpContent() {
  const params = useSearchParams();
  const initial = params.get("tab");
  const [tab, setTab] = useState<Tab>(initial === "news" || initial === "support" ? initial : "faq");

  return (
    <div>
      <PageHeader title="Yordam" subtitle="Savol-javoblar, yangiliklar va qo‘llab-quvvatlash xizmati" emoji="❓" />
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-5"
        items={[
          {
            value: "faq",
            label: (
              <>
                <span className="hidden sm:inline">💬</span>Savol-javob
              </>
            ),
          },
          {
            value: "news",
            label: (
              <>
                <span className="hidden sm:inline">📰</span>
                <span className="sm:hidden">Yangiliklar</span>
                <span className="hidden sm:inline">Yangiliklar va tadbirlar</span>
              </>
            ),
          },
          {
            value: "support",
            label: (
              <>
                <span className="hidden sm:inline">🎧</span>
                <span className="sm:hidden">Aloqa</span>
                <span className="hidden sm:inline">Qo‘llab-quvvatlash</span>
              </>
            ),
          },
        ]}
      />
      {tab === "faq" && <FaqTab onSupport={() => setTab("support")} />}
      {tab === "news" && <NewsTab />}
      {tab === "support" && <SupportTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Savol-javob

function FaqTab({ onSupport }: { onSupport: () => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<FaqItem["category"] | "all">("all");
  const needle = normalizeText(q);
  const filtered = FAQ.filter((f) => (cat === "all" || f.category === cat) && (!needle || normalizeText(`${f.q} ${f.a}`).includes(needle)));
  const groups = FAQ_ORDER.map((c) => ({ c, items: filtered.filter((f) => f.category === c) })).filter((g) => g.items.length);
  const present = FAQ_ORDER.filter((c) => FAQ.some((f) => f.category === c));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start">
      <div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Savolingizni yozing, masalan: premium" className="pl-11" aria-label="Savollar bo‘yicha qidirish" />
        </div>
        {present.length > 1 && (
          <Chips
            className="mt-3 sm:flex-wrap"
            value={cat}
            onChange={setCat}
            items={[{ value: "all" as const, label: "Barchasi" }, ...present.map((c) => ({ value: c, label: FAQ_CATEGORIES[c].short, emoji: FAQ_CATEGORIES[c].emoji }))]}
          />
        )}

        {groups.length ? (
          groups.map((g) => (
            <section key={g.c} className="mt-6">
              <h2 className="mb-2.5 flex items-center gap-2 text-base font-black text-ink">
                <span>{FAQ_CATEGORIES[g.c].emoji}</span>
                {FAQ_CATEGORIES[g.c].label}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-muted">{g.items.length}</span>
              </h2>
              <FaqList items={g.items} />
            </section>
          ))
        ) : (
          <EmptyState
            className="mt-5"
            emoji={FAQ.length ? "🔍" : "📭"}
            title={FAQ.length ? "Hech narsa topilmadi" : "Savol-javoblar tez orada"}
            text="Savolingizni qo‘llab-quvvatlash xizmatiga yozing — Telegram bot orqali javob beramiz."
            action={
              <Button size="sm" onClick={onSupport}>
                Savol yuborish
              </Button>
            }
          />
        )}
      </div>

      <Card className="p-5 lg:sticky lg:top-24">
        <div className="text-4xl">🙋</div>
        <div className="mt-2 text-lg font-black leading-tight text-ink">Javob topmadingizmi?</div>
        <p className="mt-1 text-sm leading-relaxed text-muted">Qo‘llab-quvvatlash jamoamiz ish vaqtida odatda 1 soat ichida javob beradi.</p>
        <Button block className="mt-4" onClick={onSupport}>
          ✍️ Savol yuborish
        </Button>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Yangiliklar va tadbirlar

function readReminded(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(EVENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function NewsTab() {
  const today = todayKey();
  const [reminded, setReminded] = useState<string[]>(readReminded);
  const upcoming = NEWS.filter((n) => n.type === "tadbir" && n.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const rest = NEWS.filter((n) => !(n.type === "tadbir" && n.date >= today)).sort((a, b) => b.date.localeCompare(a.date));

  const toggle = (n: NewsItem) => {
    const on = reminded.includes(n.id);
    const next = on ? reminded.filter((x) => x !== n.id) : [...reminded, n.id];
    setReminded(next);
    try {
      localStorage.setItem(EVENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    haptic(on ? "light" : "success");
    if (on) toast.info("Eslatma olib tashlandi", "🔕");
    else {
      const day = addDays(n.date, -1);
      toast.success(day > today ? `Eslatma qo‘yildi — ${formatDate(day)} kuni Telegram orqali eslatamiz` : "Eslatma qo‘yildi — Telegram orqali eslatamiz", "🔔");
    }
  };

  if (!NEWS.length) {
    return <EmptyState emoji="📰" title="Yangiliklar tez orada" text="YuniQo yangiliklari va tadbirlari shu yerda e’lon qilinadi." />;
  }

  return (
    <div className="space-y-7">
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-ink">🗓️ Yaqinlashayotgan tadbirlar</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {upcoming.map((n) => {
              const on = reminded.includes(n.id);
              return (
                <Card key={n.id} className="flex flex-col p-5">
                  <div className="flex items-start gap-3">
                    <CalendarTile date={n.date} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone="brand">🗓️ Tadbir</Badge>
                        <Badge tone="gray">{relativeDay(n.date)}</Badge>
                      </div>
                      <h3 className="mt-1.5 text-[16px] font-extrabold leading-snug text-ink">
                        {n.emoji} {n.title}
                      </h3>
                    </div>
                  </div>
                  <ExpandableText text={n.text} className="mt-3 flex-1" />
                  <Button variant={on ? "secondary" : "soft"} className="mt-4" block onClick={() => toggle(n)} aria-pressed={on}>
                    {on ? "✓ Eslatma qo‘yilgan" : "🔔 Eslatma"}
                  </Button>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-ink">📰 Yangiliklar</h2>
          <div className="space-y-3">
            {rest.map((n) => (
              <Card key={n.id} className="p-4 sm:p-5">
                <div className="flex gap-3.5 sm:gap-4">
                  <EmojiTile emoji={n.emoji} color={n.type === "tadbir" ? "#f1f5f9" : "#e0f2fe"} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={n.type === "tadbir" ? "gray" : "brand"}>{n.type === "tadbir" ? "O‘tgan tadbir" : "Yangilik"}</Badge>
                      <span className="text-xs font-bold text-muted">{formatDate(n.date, { year: true })}</span>
                    </div>
                    <h3 className="mt-1.5 text-[16px] font-extrabold leading-snug text-ink">{n.title}</h3>
                    <ExpandableText text={n.text} className="mt-1" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CalendarTile({ date }: { date: string }) {
  const [, m, d] = date.split("-").map(Number);
  return (
    <div className="w-14 shrink-0 overflow-hidden rounded-2xl bg-white text-center shadow-card ring-1 ring-brand-100">
      <div className="bg-brand-gradient py-0.5 text-[10px] font-black uppercase tracking-wide text-white">{MONTHS[m - 1]?.slice(0, 3)}</div>
      <div className="py-1.5 text-2xl font-black leading-none text-ink">{d}</div>
    </div>
  );
}

function ExpandableText({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 180;
  return (
    <div className={className}>
      <p className={cn("text-sm leading-relaxed text-ink-2", long && !open && "line-clamp-3")}>{text}</p>
      {long && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-1 text-sm font-bold text-brand-600 hover:text-brand-700">
          {open ? "Yopish" : "Batafsil"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Qo‘llab-quvvatlash

function SupportTab() {
  const view = useView();
  const bot = useApp((s) => s.bot);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);

  const submit = async () => {
    if (text.trim().length < 10) {
      toast.error("Xabarni batafsilroq yozing (kamida 10 ta belgi)");
      return;
    }
    setSending(true);
    let ticketId = `YQ-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const { data } = await apiPost<{ ok: boolean; ticket?: string }>("/api/support", { topic, text });
      if (data.ticket) ticketId = data.ticket;
    } catch {
      await sleep(600); // oflayn rejim
    }
    setSending(false);
    setTicket(ticketId);
    setText("");
    haptic("success");
    toast.success("Xabaringiz yuborildi! Javob Telegram bot orqali keladi", "📨");
  };

  const linkBtn =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3.5 text-sm font-bold text-ink transition hover:border-brand-200 hover:bg-brand-50";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="flex flex-col p-5 sm:col-span-2">
          <div className="flex items-center gap-3">
            <TelegramTile size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[16px] font-extrabold text-ink">Telegram bot</span>
                <Badge tone="good">24/7</Badge>
              </div>
              <div className="truncate text-sm font-bold text-[#1d8ad6]">{bot.username ? `@${bot.username}` : "YuniQo boti"}</div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Eng tez yo‘l: savolingizni botga yozing — avtomatik yordamchi darhol javob beradi, kerak bo‘lsa operator ulanadi.
          </p>
          {bot.username ? (
            <TelegramButton username={bot.username} label="Botga yozish" className="mt-4 sm:w-auto sm:self-start" block />
          ) : (
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-[13px] font-semibold text-muted ring-1 ring-line">
              Bot hali ulanmagan — hozircha quyidagi forma, telefon yoki email orqali murojaat qiling.
            </div>
          )}
        </Card>

        <Card className="flex flex-col p-5">
          <EmojiTile emoji="📞" color="#e3f6ef" size={44} />
          <div className="mt-3 text-sm font-bold text-muted">Telefon</div>
          <div className="text-[16px] font-extrabold text-ink">+998 71 200 00 00 (demo)</div>
          <a href="tel:+998712000000" className={cn(linkBtn, "mt-3 self-start")}>
            <Phone className="h-4 w-4" />
            Qo‘ng‘iroq qilish
          </a>
        </Card>

        <Card className="flex flex-col p-5">
          <EmojiTile emoji="✉️" color="#fdf3dc" size={44} />
          <div className="mt-3 text-sm font-bold text-muted">Email</div>
          <div className="text-[16px] font-extrabold text-ink">info@yuniqo.uz</div>
          <a href="mailto:info@yuniqo.uz" className={cn(linkBtn, "mt-3 self-start")}>
            <Mail className="h-4 w-4" />
            Xat yozish
          </a>
        </Card>

        <Card className="p-5 sm:col-span-2">
          <div className="flex items-start gap-3">
            <EmojiTile emoji="🕘" color="#efeaff" size={44} />
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-extrabold text-ink">Ish vaqti</div>
              <div className="mt-1 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-3 text-ink-2">
                  <span>Dushanba – Shanba</span>
                  <b className="text-ink">09:00 – 18:00</b>
                </div>
                <div className="flex justify-between gap-3 text-ink-2">
                  <span>Yakshanba</span>
                  <b className="text-muted">Dam olish</b>
                </div>
                <div className="flex justify-between gap-3 text-ink-2">
                  <span>Telegram bot</span>
                  <b className="text-ink">24/7</b>
                </div>
                <div className="flex justify-between gap-3 text-ink-2">
                  <span>O‘rtacha javob</span>
                  <b className="text-ink">~1 soat</b>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="order-first p-5 lg:order-none">
        <CardTitle>✍️ Xabar yuborish</CardTitle>
        {ticket ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="grid h-16 w-16 animate-pop place-items-center rounded-3xl bg-good/10 text-3xl">✅</div>
            <div className="mt-3 text-lg font-black text-ink">Murojaat #{ticket} qabul qilindi</div>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted">
              Javob Telegram bot orqali keladi — ish vaqtida odatda 1 soat ichida. Rahmat, {view.user.name.split(" ")[0] || "hurmatli ota-ona"}!
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => setTicket(null)}>
              Yangi murojaat
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Mavzu">
              <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Xabar" hint={`${text.length}/1000`}>
              <Textarea
                rows={5}
                maxLength={1000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Savolingiz yoki taklifingizni batafsil yozing…"
              />
            </Field>
            <InfoNote emoji="🤖">
              Xabaringiz <b>Telegram bot</b> orqali qo‘llab-quvvatlash jamoasiga yetkaziladi — javob ham botga keladi.
            </InfoNote>
            <Button block size="lg" loading={sending} onClick={submit}>
              {!sending && <Send className="h-4 w-4" />}
              Yuborish
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
