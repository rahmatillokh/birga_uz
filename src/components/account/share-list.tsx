"use client";

import { Eye, Link2 } from "lucide-react";
import { getSpecialist } from "@/data/specialists";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, EmojiTile } from "@/components/ui/misc";
import { SPECIALTIES } from "@/lib/constants";
import { useView } from "@/lib/client/hooks";
import { toast } from "@/lib/client/toast";
import type { Share } from "@/lib/types";
import { cn, dayKey, daysBetween, formatDate, todayKey } from "@/lib/utils";
import { safeAct } from "./act";
import { useConfirm } from "./confirm";
import { SHARE_SCOPES, SHARE_STATE, shareState, untilLabel } from "./meta";

const ORDER = { active: 0, expired: 1, revoked: 2 } as const;

/**
 * Mutaxassislarga berilgan ruxsatlar (ulashishlar) ro‘yxati.
 * `onlyActive` — faqat faol ruxsatlar (kabinet uchun), aks holda barchasi holati bilan.
 */
export function ShareList({ shares, onlyActive, className }: { shares: Share[]; onlyActive?: boolean; className?: string }) {
  const view = useView();
  const [confirm, confirmUi] = useConfirm();
  const nowIso = new Date().toISOString();
  const today = todayKey();

  const list = shares
    .map((s) => ({ s, state: shareState(s, nowIso) }))
    .filter((x) => !onlyActive || x.state === "active")
    .sort((a, b) => ORDER[a.state] - ORDER[b.state] || (a.state === "active" ? a.s.expiresAt.localeCompare(b.s.expiresAt) : b.s.createdAt.localeCompare(a.s.createdAt)));

  const revoke = async (s: Share) => {
    const sp = getSpecialist(s.specialistId);
    const child = view.children.find((c) => c.id === s.childId);
    const ok = await confirm({
      title: "Ruxsatni bekor qilasizmi?",
      emoji: "🔒",
      text: (
        <>
          <b>{sp?.name ?? "Havola egasi"}</b> endi {child ? <b>{child.name}</b> : "bola"}ning ma’lumotlarini ko‘ra olmaydi. Kerak bo‘lsa, keyinroq yangi ruxsat berishingiz mumkin.
        </>
      ),
      confirmLabel: "Ha, bekor qilish",
      cancelLabel: "Qolsin",
      tone: "danger",
    });
    if (!ok) return;
    const r = await safeAct({ type: "share.revoke", shareId: s.id }, { silent: true });
    if (r.ok) toast.success("Ruxsat bekor qilindi", "🔒");
    else toast.error(r.error ?? "Bekor qilib bo‘lmadi");
  };

  const copyLink = async (s: Share) => {
    const url = `${window.location.origin}/r/${s.token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Havola nusxalandi", "🔗");
    } catch {
      toast.info(url, "🔗");
    }
  };

  if (!list.length) {
    return (
      <div className={cn("rounded-3xl border border-dashed border-brand-200 bg-white/60 px-5 py-8 text-center", className)}>
        <div className="text-4xl">🔐</div>
        <div className="mt-2 font-extrabold text-ink">{onlyActive ? "Faol ruxsatlar yo‘q" : "Hali hech kimga ruxsat berilmagan"}</div>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Konsultatsiyaga yozilganingizda yoki rivojlanish pasportini ulashganingizda ruxsatlar shu yerda ko‘rinadi.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {list.map(({ s, state }) => {
        const sp = getSpecialist(s.specialistId);
        const child = view.children.find((c) => c.id === s.childId);
        const left = daysBetween(today, dayKey(s.expiresAt));
        const st = SHARE_STATE[state];
        return (
          <div
            key={s.id}
            className={cn("rounded-3xl border border-line bg-white p-4 shadow-card", state !== "active" && "bg-slate-50/70 shadow-none")}
          >
            <div className="flex items-start gap-3">
              {sp ? (
                <Avatar name={sp.name} color={sp.color} size={46} />
              ) : (
                <EmojiTile emoji="🔗" color="#e0f2fe" size={46} className="rounded-full" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={cn("font-extrabold text-ink", state !== "active" && "text-ink-2")}>{sp?.name ?? "Havola orqali ulashish"}</span>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>
                <div className="mt-0.5 text-[13px] font-semibold text-muted">
                  {sp ? `${SPECIALTIES[sp.specialty].emoji} ${SPECIALTIES[sp.specialty].label}` : "Havolani ochgan mutaxassis ko‘radi"}
                  {child && (
                    <>
                      {" · "}
                      {child.avatar} {child.name}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.scopes.map((sc) => (
                <span key={sc} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-ink-2">
                  <span>{SHARE_SCOPES[sc].emoji}</span>
                  {SHARE_SCOPES[sc].label}
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-semibold text-muted">
                <span>
                  {state === "active" ? (
                    <>
                      ⏳ {untilLabel(s.expiresAt)}
                      <span className={cn("ml-1 font-extrabold", left <= 3 ? "text-[#8a5a00]" : "text-ink-2")}>({left > 0 ? `${left} kun qoldi` : "bugun tugaydi"})</span>
                    </>
                  ) : state === "expired" ? (
                    <>⌛ {formatDate(s.expiresAt)}da tugagan</>
                  ) : (
                    <>🚫 Siz tomondan bekor qilingan</>
                  )}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {s.views} marta ko‘rilgan
                </span>
              </div>
              {state === "active" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => copyLink(s)} aria-label="Havolani nusxalash">
                    <Link2 className="h-4 w-4" />
                    Havola
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => revoke(s)}>
                    Bekor qilish
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {confirmUi}
    </div>
  );
}
