"use client";

import { Printer, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ReportView } from "@/components/report/report-view";
import { Button } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/ui/logo";
import type { SpecialistPatient } from "@/lib/types";
import { formatDate } from "@/lib/utils";

/** Mutaxassis uchun ulashilgan hisobot (login talab qilinmaydi) */
export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SpecialistPatient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/${token}`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Xatolik");
        setData(j.report);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="no-print sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4">
          <Logo size={34} tagline />
          {data && (
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> PDF / Chop etish
            </Button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        {error ? (
          <div className="mx-auto mt-16 max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
            <div className="text-5xl">🔒</div>
            <h1 className="mt-3 text-xl font-black text-ink">Hisobotni ochib bo‘lmadi</h1>
            <p className="mt-1 text-sm text-muted">{error}. Ota-onadan yangi havola so‘rang.</p>
          </div>
        ) : !data ? (
          <div className="grid min-h-[50vh] place-items-center">
            <LogoMark size={60} className="animate-float" />
          </div>
        ) : (
          <>
            <div className="no-print mb-4 flex items-start gap-3 rounded-3xl bg-[#e3f6ef] p-4 ring-1 ring-good/20">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#006300]" />
              <div className="text-sm leading-relaxed text-ink-2">
                <b className="text-ink">Ota-ona ruxsati bilan ulashilgan hisobot.</b> Havola{" "}
                {data.share ? `${formatDate(data.share.expiresAt, { year: true })} gacha amal qiladi` : "cheklangan muddatga amal qiladi"}. Ma’lumotlarni uchinchi shaxslarga
                bermang.
              </div>
            </div>
            <ReportView data={data} audience="shared" shareUrl={typeof window !== "undefined" ? window.location.href : undefined} />
            <div className="no-print mt-6 rounded-3xl border border-line bg-white p-5 text-center shadow-card">
              <div className="text-lg font-black text-ink">Siz mutaxassismisiz?</div>
              <p className="mt-1 text-sm text-muted">YuniQo mutaxassis kabinetida bolaga topshiriq bering, natijalarni kuzating va hamkasblar bilan ma’lumot almashing.</p>
              <Button href="/specialist" className="mt-3">
                🩺 Mutaxassis kabinetini ko‘rish
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
