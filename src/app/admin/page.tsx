"use client";

import { QRCodeSVG } from "qrcode.react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Switch, Textarea } from "@/components/ui/form";
import { InfoNote, PageHeader, StatTile } from "@/components/ui/misc";
import { toast } from "@/lib/client/toast";
import { timeAgo } from "@/lib/utils";

interface Stats {
  users: number;
  usersToday: number;
  children: number;
  assessments: number;
  activities: number;
  activitiesToday: number;
  bookings: number;
  shares: number;
  premium: number;
  byRegion: [string, number][];
  feed: { at: string; text: string }[];
  bot: { connected: boolean; username: string | null };
}

export default function AdminPage() {
  return (
    <Suspense>
      <Admin />
    </Suspense>
  );
}

/** Ko‘rgazma paneli — katta ekranda jonli statistika va xabar yuborish */
function Admin() {
  const params = useSearchParams();
  const key = params.get("key") ?? "";
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("YuniQo ko‘rgazmasiga tashrif buyurganingiz uchun rahmat! Farzandingiz uchun bepul rivojlanish baholashidan o‘ting 💙");
  const [gift, setGift] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/stats${key ? `?key=${encodeURIComponent(key)}` : ""}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setStats(j);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [key]);

  useEffect(() => {
    void load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function broadcast() {
    setSending(true);
    try {
      const r = await fetch(`/api/admin/broadcast${key ? `?key=${encodeURIComponent(key)}` : ""}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, gift }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error ?? "Xatolik");
      toast.success(`${j.sent}/${j.total} foydalanuvchiga yuborildi`, "📢");
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (error) return <InfoNote emoji="🔒">Panelni ochib bo‘lmadi: {error}</InfoNote>;
  const botLink = stats?.bot.username ? `https://t.me/${stats.bot.username}` : "https://t.me/YuniQo_bot";

  return (
    <div className="animate-fade-up">
      <PageHeader emoji="📺" title="Ko‘rgazma paneli" subtitle="Telegram orqali qo‘shilgan ota-onalar — jonli statistika (har 5 soniyada yangilanadi)" />
      <div className="grid gap-5 lg:grid-cols-4">
        <Card className="flex flex-col items-center p-5 text-center">
          <QRCodeSVG value={botLink} size={170} fgColor="#0f172a" level="M" />
          <div className="mt-3 text-lg font-black text-ink">{stats?.bot.username ? `@${stats.bot.username}` : "@YuniQo_bot"}</div>
          <div className="text-sm text-muted">Skanerlang va /start bosing</div>
          {!stats?.bot.connected && <div className="mt-2 text-xs font-bold text-danger">Bot tokeni o‘rnatilmagan</div>}
        </Card>
        <div className="grid grid-cols-2 gap-3 lg:col-span-3 lg:grid-cols-4">
          <StatTile label="Ota-onalar" value={stats?.users ?? "—"} emoji="👨‍👩‍👧" color="#e0f2fe" hint={`bugun +${stats?.usersToday ?? 0}`} />
          <StatTile label="Bola profillari" value={stats?.children ?? "—"} emoji="👶" color="#fdf3dc" />
          <StatTile label="Baholashlar" value={stats?.assessments ?? "—"} emoji="🧠" color="#fdeee7" />
          <StatTile label="Mashg‘ulotlar" value={stats?.activities ?? "—"} emoji="🎯" color="#e3f6ef" hint={`bugun ${stats?.activitiesToday ?? 0}`} />
          <StatTile label="Yozilishlar" value={stats?.bookings ?? "—"} emoji="📅" color="#efeaff" />
          <StatTile label="Mutaxassisga ulashildi" value={stats?.shares ?? "—"} emoji="📁" color="#e0f2fe" />
          <StatTile label="Premium" value={stats?.premium ?? "—"} emoji="💎" color="#efeaff" />
          <StatTile label="Hududlar" value={stats?.byRegion.length ?? "—"} emoji="🗺️" color="#e2f2e2" />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <CardTitle>⚡ Jonli lenta</CardTitle>
          <div className="space-y-2">
            {stats?.feed.length ? (
              stats.feed.map((f, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 text-sm">
                  <span className="font-bold text-ink-2">{f.text}</span>
                  <span className="shrink-0 text-xs font-semibold text-faint">{timeAgo(f.at)}</span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted">Hozircha faoliyat yo‘q — botni skanerlab birinchi bo‘ling! 🚀</p>
            )}
          </div>
        </Card>
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <CardTitle>🗺️ Hududlar bo‘yicha</CardTitle>
            <div className="space-y-2">
              {(stats?.byRegion ?? []).map(([r, n]) => (
                <div key={r} className="flex items-center justify-between text-sm">
                  <span className="font-bold text-ink-2">{r}</span>
                  <span className="font-black text-ink">{n}</span>
                </div>
              ))}
              {!stats?.byRegion.length && <p className="text-sm text-muted">Ma’lumot yo‘q</p>}
            </div>
          </Card>
          <Card className="p-5">
            <CardTitle>📢 Barcha foydalanuvchilarga xabar</CardTitle>
            <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
            <div className="mt-2 rounded-2xl border border-line px-4">
              <Switch checked={gift} onChange={setGift} label="🎁 7 kunlik Premium sovg‘a" />
            </div>
            <Button block className="mt-3" onClick={broadcast} loading={sending} disabled={!text.trim()}>
              Telegram orqali yuborish
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
