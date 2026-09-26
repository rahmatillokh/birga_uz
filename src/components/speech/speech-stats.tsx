"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SPEECH_SOUNDS } from "@/data/speech";
import { scoreLevel } from "@/lib/constants";
import type { SpeechStats } from "@/lib/speech/stats";
import { cn, dayKey, formatDate, relativeDay } from "@/lib/utils";
import { Sparkline } from "./sparkline";

/** Hub tepasidagi statistika: oxirgi natija + trend (sparkline) + tovushlar bo‘yicha oxirgi ball */
export function SpeechStatsStrip({ stats }: { stats: SpeechStats }) {
  const { last, prev, trend, trendAvg, lastBySound, weekCount } = stats;
  const sounds = SPEECH_SOUNDS.length
    ? SPEECH_SOUNDS.map((s) => ({ id: s.id, label: s.sound }))
    : Object.keys(lastBySound).map((id) => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }));
  const labelOf = (id: string) => sounds.find((s) => s.id === id)?.label ?? id.toUpperCase();
  const delta = typeof last?.score === "number" && typeof prev?.score === "number" ? last.score - prev.score : null;

  return (
    <Card className="p-4 sm:p-5">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-7">
        {/* Trend */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[13px] font-bold text-muted">Talaffuz natijasi</div>
            <div className="text-xs font-semibold text-muted">Bu hafta: {weekCount} ta mashq</div>
          </div>
          {last && typeof last.score === "number" ? (
            <>
              <div className="mt-1.5 flex items-end gap-2.5">
                <div className="text-[34px] font-black leading-none text-ink">
                  {last.score}
                  <span className="ml-0.5 text-base font-bold text-muted">/100</span>
                </div>
                {delta !== null && delta !== 0 && (
                  <span
                    className={cn(
                      "mb-1 rounded-full px-2 py-0.5 text-xs font-extrabold",
                      delta > 0 ? "bg-good/10 text-[#006300]" : "bg-warn/15 text-[#8a5a00]",
                    )}
                    title="Oldingi mashqqa nisbatan"
                  >
                    {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs font-semibold text-muted">
                «{labelOf(last.refId)}» tovushi · {relativeDay(dayKey(last.at))}
                {trendAvg !== null && ` · o‘rtacha ${trendAvg}`}
              </div>
              {trend.length > 1 && (
                <>
                  <Sparkline
                    className="mt-3"
                    values={trend.map((a) => a.score ?? 0)}
                    labels={trend.map((a) => `«${labelOf(a.refId)}» · ${formatDate(a.at)}`)}
                    ariaLabel={`So‘nggi ${trend.length} ta talaffuz natijasi: ${trend.map((a) => a.score).join(", ")}`}
                  />
                  <div className="mt-1 flex justify-between text-[11px] font-semibold text-faint">
                    <span>So‘nggi {trend.length} ta mashq</span>
                    <span>oxirgisi</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm leading-snug text-muted">
              Hali talaffuz mashqi bajarilmagan. Pastdan tovushni tanlang va birinchi mashqni boshlang! 🎙️
            </p>
          )}
        </div>

        {/* Tovushlar */}
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-muted">Tovushlar bo‘yicha oxirgi natija</div>
          {sounds.length ? (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {sounds.map((s) => {
                const a = lastBySound[s.id];
                const lvl = typeof a?.score === "number" ? scoreLevel(a.score) : null;
                return (
                  <Link
                    key={s.id}
                    href={`/speech/${s.id}`}
                    className="rounded-2xl border border-line bg-white px-1 py-2 text-center transition hover:border-brand-200 hover:bg-brand-50"
                    aria-label={`«${s.label}» tovushi: ${a?.score ?? "natija yo‘q"}`}
                  >
                    <div className="text-lg font-black leading-none text-ink">{s.label}</div>
                    <div className="mt-1 text-xs font-bold text-ink-2">
                      {lvl && a ? (
                        <>
                          <span aria-hidden>{lvl.icon}</span> {a.score}
                        </>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">Tovushlar ro‘yxati tez orada qo‘shiladi.</p>
          )}
          <p className="mt-2 text-[11px] font-semibold text-faint">✅ 70+ yaxshi · 🟡 45–69 rivojlanmoqda · ❗ 45 dan past</p>
        </div>
      </div>
    </Card>
  );
}
