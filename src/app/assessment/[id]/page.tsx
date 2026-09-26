"use client";

import { Sparkles } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { SPECIALISTS } from "@/data/specialists";
import { DomainRadar } from "@/components/charts/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Avatar, EmptyState, InfoNote, PageHeader, Section } from "@/components/ui/misc";
import { ProgressRing } from "@/components/ui/progress";
import { AGE_BANDS, DOMAINS, DOMAIN_ORDER, SPECIALTIES, scoreLevel } from "@/lib/constants";
import { specialistForDomain } from "@/lib/core/scoring";
import { useChildData, useView } from "@/lib/client/hooks";
import { cn, formatDate } from "@/lib/utils";

export default function AssessmentResultPage() {
  return (
    <Suspense>
      <Result />
    </Suspense>
  );
}

function Result() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const view = useView();
  const a = view.assessments.find((x) => x.id === id);
  const child = view.children.find((c) => c.id === a?.childId);
  const { assessments } = useChildData(child?.id);
  const sorted = [...assessments].sort((x, y) => x.at.localeCompare(y.at));
  const idx = sorted.findIndex((x) => x.id === id);
  const prev = idx > 0 ? sorted[idx - 1] : undefined;
  const firstA = sorted[0];

  const weak = useMemo(() => (a ? [...DOMAIN_ORDER].sort((x, y) => a.scores[x] - a.scores[y]).slice(0, 2) : []), [a]);
  const suggested = useMemo(() => {
    const region = child?.region ?? view.user.region;
    return weak
      .map((d) => {
        const spec = specialistForDomain(d);
        const list = SPECIALISTS.filter((s) => s.specialty === spec).sort((x, y) => Number(y.region === region) - Number(x.region === region) || y.rating - x.rating);
        return list[0] ? { d, sp: list[0] } : undefined;
      })
      .filter(Boolean) as { d: (typeof weak)[number]; sp: (typeof SPECIALISTS)[number] }[];
  }, [weak, child, view.user.region]);

  if (!a || !child) return <EmptyState emoji="🔍" title="Baholash topilmadi" action={<Button href="/assessment">Orqaga</Button>} />;
  const lvl = scoreLevel(a.overall);
  const isNew = params.get("new") === "1";

  return (
    <div className="animate-fade-up">
      <PageHeader back="/assessment" title={isNew ? "Baholash natijalari tayyor! 🎉" : "Baholash natijalari"} subtitle={`${child.name} · ${formatDate(a.at, { year: true })} · ${AGE_BANDS[a.band].label} savolnomasi`} />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-4">
            <ProgressRing value={a.overall / 100} size={112} stroke={11}>
              <div className="text-center leading-none">
                <div className="text-3xl font-black text-ink">{a.overall}%</div>
                <div className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-muted">umumiy</div>
              </div>
            </ProgressRing>
            <div>
              <div className="text-sm font-bold text-muted">Umumiy rivojlanish</div>
              <div className="mt-1 text-lg font-black" style={{ color: lvl.color }}>
                {lvl.icon} {lvl.label}
              </div>
              {prev && (
                <div className={cn("mt-1 text-sm font-extrabold", a.overall >= prev.overall ? "text-[#006300]" : "text-danger")}>
                  {a.overall >= prev.overall ? "▲" : "▼"} {Math.abs(a.overall - prev.overall)} ball oldingi baholashga nisbatan
                </div>
              )}
            </div>
          </div>
          <div className="mt-5 space-y-2.5">
            {DOMAIN_ORDER.map((d) => {
              const s = a.scores[d];
              const l = scoreLevel(s);
              const delta = prev ? s - prev.scores[d] : 0;
              return (
                <div key={d} className="flex items-center gap-3 rounded-2xl p-2.5" style={{ background: DOMAINS[d].soft }}>
                  <span className="text-xl">{DOMAINS[d].emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-extrabold text-ink">{DOMAINS[d].label}</div>
                    <div className="text-xs font-bold" style={{ color: l.key === "warning" ? "#8a5a00" : l.color }}>
                      {l.icon} {l.label}
                    </div>
                  </div>
                  {prev && delta !== 0 && (
                    <span className={cn("text-xs font-black", delta > 0 ? "text-[#006300]" : "text-danger")}>
                      {delta > 0 ? "▲" : "▼"}
                      {Math.abs(delta)}
                    </span>
                  )}
                  <span className="w-12 text-right text-lg font-black text-ink tabular">{s}%</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-3">
          <CardTitle>🕸️ Rivojlanish profili</CardTitle>
          <DomainRadar current={a.scores} previous={firstA && firstA.id !== a.id ? firstA.scores : undefined} currentLabel="Shu baholash" />
        </Card>
      </div>

      <Section title="AI xulosa va tavsiyalar">
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-br from-[#f6f3ff] via-white to-brand-50 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="premium">
                <Sparkles className="h-3.5 w-3.5" /> {a.aiGenerated ? "Claude AI xulosasi" : "YuniQo AI xulosasi"}
              </Badge>
            </div>
            <p className="text-[15px] leading-relaxed text-ink">{a.summary}</p>
          </div>
          <div className="p-5">
            <div className="mb-2 text-sm font-extrabold text-ink">Tavsiyalar:</div>
            <ul className="space-y-2">
              {a.recommendations.map((r, k) => (
                <li key={k} className="flex gap-3 text-[15px] leading-relaxed text-ink-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-black text-brand-700">{k + 1}</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </Section>

      <div className="mt-2 grid gap-5 lg:grid-cols-2">
        <Section title="Keyingi qadamlar">
          <div className="space-y-2.5">
            <Card href="/plan" className="flex items-center gap-3 p-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e3f6ef] text-2xl">🎯</span>
              <div>
                <div className="font-extrabold text-ink">Individual reja tayyor</div>
                <div className="text-sm text-muted">Natijalarga moslashtirilgan kundalik mashqlar</div>
              </div>
            </Card>
            <Card href="/passport" className="flex items-center gap-3 p-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl">📁</span>
              <div>
                <div className="font-extrabold text-ink">Mutaxassisga ko‘rsatish</div>
                <div className="text-sm text-muted">Natijalar rivojlanish pasportiga qo‘shildi — bir tugma bilan ulashing</div>
              </div>
            </Card>
            <Card href="/sessions" className="flex items-center gap-3 p-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fdeee7] text-2xl">🏢</span>
              <div>
                <div className="font-extrabold text-ink">Bepul YuniQo sessiyasi</div>
                <div className="text-sm text-muted">Tumaningizdagi mutaxassis bilan bepul uchrashuv</div>
              </div>
            </Card>
          </div>
        </Section>

        <Section title="Tavsiya etilgan mutaxassislar">
          <div className="space-y-2.5">
            {suggested.map(({ d, sp }) => (
              <Card key={d} href={`/specialists/${sp.id}`} className="flex items-center gap-3 p-4">
                <Avatar name={sp.name} color={sp.color} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-ink">{sp.name}</div>
                  <div className="text-xs font-bold text-muted">
                    {SPECIALTIES[sp.specialty].label} · ⭐ {sp.rating} · {sp.experienceYears} yil
                  </div>
                  <div className="mt-1 text-xs font-bold" style={{ color: DOMAINS[d].color }}>
                    {DOMAINS[d].emoji} {DOMAINS[d].label}: {a.scores[d]}%
                  </div>
                </div>
              </Card>
            ))}
            <InfoNote emoji="ℹ️">Natijalar ota-ona javoblariga asoslangan skrining. Aniq xulosa uchun mutaxassis ko‘rigi tavsiya etiladi.</InfoNote>
          </div>
        </Section>
      </div>
    </div>
  );
}
