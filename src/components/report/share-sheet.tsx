"use client";

import { Check, Copy, Send } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { SPECIALISTS, getSpecialist } from "@/data/specialists";
import { Button } from "@/components/ui/button";
import { Field, OptionPills, Select } from "@/components/ui/form";
import { Avatar, InfoNote } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { SPECIALTIES } from "@/lib/constants";
import { useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { openExternal } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { ShareScope } from "@/lib/types";
import { cn } from "@/lib/utils";

export const SCOPES: { v: ShareScope; label: string; desc: string }[] = [
  { v: "baholash", label: "🧠 Baholashlar", desc: "Natijalar, radar va dinamika, AI xulosa" },
  { v: "mashqlar", label: "🎯 Mashqlar va o‘yinlar", desc: "Bajarilgan mashg‘ulotlar, faollik" },
  { v: "ai", label: "🤖 AI natijalari", desc: "Video nazorat va talaffuz natijalari (videosiz)" },
  { v: "kuzatuvlar", label: "📝 Ota-ona kuzatuvlari", desc: "Siz yozgan qaydlar" },
  { v: "mutaxassis", label: "👩‍⚕️ Mutaxassislar xulosalari", desc: "Boshqa mutaxassislarning tavsiyalari" },
];

export function shareLink(token: string): string {
  if (typeof window === "undefined") return `/r/${token}`;
  return `${window.location.origin}/r/${token}`;
}

export function ShareSheet({ open, onClose, childId, preselect }: { open: boolean; onClose: () => void; childId: string; preselect?: string }) {
  const view = useView();
  const act = useApp((s) => s.act);
  const [target, setTarget] = useState<string>(preselect ?? "");
  const [scopes, setScopes] = useState<ShareScope[]>(["baholash", "mashqlar", "ai", "mutaxassis"]);
  const [days, setDays] = useState("30");
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setToken(null);
      setTarget(preselect ?? "");
    }
  }, [open, preselect]);

  // Tanish mutaxassislar: yozilishlar va ulashishlardan
  const known = useMemo(() => {
    const ids = new Set<string>();
    view.bookings.forEach((b) => b.specialistId && ids.add(b.specialistId));
    view.shares.forEach((s) => s.specialistId && ids.add(s.specialistId));
    if (preselect) ids.add(preselect);
    return Array.from(ids).map((id) => getSpecialist(id)).filter(Boolean) as NonNullable<ReturnType<typeof getSpecialist>>[];
  }, [view, preselect]);

  async function create() {
    setBusy(true);
    const res = await act({ type: "share.create", childId, specialistId: target || undefined, scopes, days: Number(days) }, { silent: true });
    setBusy(false);
    if (!res.ok || !res.createdId) {
      toast.error(res.error ?? "Xatolik");
      return;
    }
    setToken(res.createdId);
  }

  const url = token ? shareLink(token) : "";
  const sp = target ? getSpecialist(target) : undefined;

  return (
    <Sheet open={open} onClose={onClose} title={token ? "Havola tayyor ✅" : "Mutaxassisga ulashish"} size="md">
      {token ? (
        <div className="text-center">
          <div className="mx-auto inline-block rounded-3xl border border-line bg-white p-4 shadow-card">
            <QRCodeSVG value={url} size={180} fgColor="#0f172a" level="M" />
          </div>
          <p className="mt-3 text-sm text-muted">
            {sp ? `${sp.name} QR kodni skanerlashi yoki havolani ochishi kifoya` : "Mutaxassis QR kodni skanerlasin yoki havolani oching"} — ro‘yxatdan o‘tish shart emas.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-50 p-2 pl-3 text-left">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-2">{url}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                } catch {
                  /* ignore */
                }
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Nusxalandi" : "Nusxa"}
            </Button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button
              variant="primary"
              onClick={() => openExternal(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent("YuniQo: bolaning rivojlanish hisoboti")}`)}
            >
              <Send className="h-4 w-4" /> Telegram orqali yuborish
            </Button>
            <Button variant="secondary" href={`/r/${token}`}>
              Hisobotni ko‘rish
            </Button>
          </div>
          <p className="mt-3 text-xs font-semibold text-muted">Havola {days} kun amal qiladi. Istalgan vaqtda «Xavfsizlik» bo‘limida bekor qilishingiz mumkin.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <Field label="Kimga ulashasiz?">
            <div className="space-y-2">
              <button
                onClick={() => setTarget("")}
                className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left", !target ? "border-brand-400 bg-brand-50" : "border-line")}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow-card">🔗</span>
                <span className="flex-1">
                  <span className="block text-sm font-extrabold text-ink">Havola / QR kod orqali</span>
                  <span className="block text-xs text-muted">Istalgan mutaxassisga (masalan, poliklinikada)</span>
                </span>
              </button>
              {known.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setTarget(s.id)}
                  className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left", target === s.id ? "border-brand-400 bg-brand-50" : "border-line")}
                >
                  <Avatar name={s.name} color={s.color} size={40} />
                  <span className="flex-1">
                    <span className="block text-sm font-extrabold text-ink">{s.name}</span>
                    <span className="block text-xs text-muted">{SPECIALTIES[s.specialty].label} · kabinetida ko‘rinadi</span>
                  </span>
                </button>
              ))}
              <Select value={known.some((k) => k.id === target) ? "" : target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Boshqa mutaxassisni tanlash…</option>
                {SPECIALISTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {SPECIALTIES[s.specialty].label}
                  </option>
                ))}
              </Select>
            </div>
          </Field>

          <Field label="Nimalarni ko‘rsatamiz?">
            <div className="space-y-2">
              {SCOPES.map((s) => {
                const on = scopes.includes(s.v);
                return (
                  <button
                    key={s.v}
                    onClick={() => setScopes(on ? scopes.filter((x) => x !== s.v) : [...scopes, s.v])}
                    className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left", on ? "border-brand-300 bg-brand-50/60" : "border-line")}
                  >
                    <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2", on ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300")}>
                      {on && <Check className="h-4 w-4" strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-ink">{s.label}</span>
                      <span className="block text-xs text-muted">{s.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Amal qilish muddati">
            <OptionPills
              value={days}
              onChange={(v) => setDays(v as string)}
              options={[
                { value: "1", label: "1 kun" },
                { value: "7", label: "7 kun" },
                { value: "30", label: "30 kun" },
                { value: "90", label: "90 kun" },
              ]}
            />
          </Field>
          <InfoNote emoji="🔐">Video va audio yozuvlar ulashilmaydi — faqat natijalar. Ulashishni istalgan vaqtda bekor qilishingiz mumkin.</InfoNote>
          <Button block size="lg" onClick={create} loading={busy} disabled={!scopes.length}>
            📤 Havola va QR kod yaratish
          </Button>
        </div>
      )}
    </Sheet>
  );
}
