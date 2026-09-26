"use client";

import { Printer, Share2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { getSpecialist } from "@/data/specialists";
import { ReportView } from "@/components/report/report-view";
import { SCOPES, ShareSheet, shareLink } from "@/components/report/share-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, EmptyState, LockedOverlay, PageHeader, Section } from "@/components/ui/misc";
import { SPECIALTIES } from "@/lib/constants";
import { useChildData, useIsPremium, useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { toast } from "@/lib/client/toast";
import type { SpecialistPatient } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function PassportPage() {
  return (
    <Suspense>
      <Passport />
    </Suspense>
  );
}

function Passport() {
  const params = useSearchParams();
  const view = useView();
  const premium = useIsPremium();
  const act = useApp((s) => s.act);
  const { child, assessments, activities, plan, assignments, notes, shares } = useChildData();
  const preselect = params.get("share") ?? undefined;
  const [open, setOpen] = useState(!!preselect);

  useEffect(() => {
    if (preselect) setOpen(true);
  }, [preselect]);

  const data: SpecialistPatient | null = useMemo(
    () =>
      child
        ? {
            child,
            parentName: view.user.name,
            assessments,
            activities,
            plan,
            assignments,
            notes,
            bookings: view.bookings.filter((b) => b.childId === child.id),
          }
        : null,
    [child, view, assessments, activities, plan, assignments, notes],
  );

  if (!child || !data) return <EmptyState emoji="📁" title="Bola profili yo‘q" />;
  const now = new Date().toISOString();
  const active = shares.filter((s) => s.active && s.expiresAt > now);

  return (
    <div className="animate-fade-up">
      <PageHeader
        className="no-print"
        emoji="📁"
        title="Rivojlanish pasporti"
        subtitle="Barcha baholashlar, mashqlar, AI natijalari va mutaxassis xulosalari — bitta tayyor hisobotda"
        actions={
          <>
            <Button variant="secondary" onClick={() => (premium ? window.print() : toast.info("PDF hisobot Premium tarifda", "💎"))} className="hidden sm:inline-flex">
              <Printer className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Mutaxassisga</span> ulashish
            </Button>
          </>
        }
      />

      <div className="no-print mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4 sm:col-span-2">
          <span className="text-3xl">💡</span>
          <p className="text-sm leading-relaxed text-ink-2">
            <b className="text-ink">Eng muhim funksiya:</b> YuniQo bolaning barcha baholari va AI natijalarini yig‘adi va mutaxassisga bitta tayyor rivojlanish hisobotini ko‘rsatadi. Qabulga borishda QR kodni
            ko‘rsating — mutaxassis bir necha soniyada to‘liq manzarani ko‘radi.
          </p>
        </Card>
        <Card className="flex flex-col justify-center gap-2 p-4">
          <Button block onClick={() => setOpen(true)}>
            📤 QR / havola yaratish
          </Button>
          <Button block variant="secondary" onClick={() => (premium ? window.print() : toast.info("PDF hisobot Premium tarifda", "💎"))}>
            🖨️ PDF yuklab olish
          </Button>
        </Card>
      </div>

      <ReportView data={data} shareUrl={active[0] ? shareLink(active[0].token) : undefined} />

      {!premium && (
        <div className="no-print mt-5">
          <LockedOverlay title="Batafsil hisobot va PDF" text="Premium tarifda hisobotni PDF ko‘rinishida yuklab olish va cheksiz ulashish mumkin." />
        </div>
      )}

      <Section title="Kimga ulashilgan" className="no-print">
        <div className="space-y-2.5">
          {shares.length === 0 && <p className="text-sm text-muted">Hali hech kimga ulashilmagan.</p>}
          {[...shares]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((s) => {
              const sp = s.specialistId ? getSpecialist(s.specialistId) : undefined;
              const alive = s.active && s.expiresAt > now;
              return (
                <Card key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  {sp ? <Avatar name={sp.name} color={sp.color} size={44} /> : <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-xl">🔗</span>}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-ink">{sp ? sp.name : "Havola orqali"}</span>
                      {sp && <span className="text-xs font-semibold text-muted">{SPECIALTIES[sp.specialty].label}</span>}
                      <Badge tone={alive ? "good" : "gray"}>{alive ? "Faol" : s.active ? "Muddati tugagan" : "Bekor qilingan"}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.scopes.map((sc) => (
                        <span key={sc} className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-ink-2">
                          {SCOPES.find((x) => x.v === sc)?.label}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-muted">
                      {formatDate(s.createdAt)} — {formatDate(s.expiresAt, { year: true })} · 👁️ {s.views} marta ko‘rilgan
                    </div>
                  </div>
                  {alive && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" href={`/r/${s.token}`}>
                        Ochish
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          await act({ type: "share.revoke", shareId: s.id }, { silent: true });
                          toast.success("Ulashish bekor qilindi", "🔒");
                        }}
                      >
                        Bekor qilish
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      </Section>

      <ShareSheet open={open} onClose={() => setOpen(false)} childId={child.id} preselect={preselect} />
    </div>
  );
}
