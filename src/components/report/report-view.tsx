"use client";

import { QRCodeSVG } from "qrcode.react";
import { useMemo } from "react";
import { getExercise } from "@/data/exercises";
import { GAMES } from "@/data/games";
import { SPEECH_SOUNDS } from "@/data/speech";
import { getSpecialist } from "@/data/specialists";
import { districtLabel, regionName } from "@/data/regions";
import { ActivityBars, DomainRadar, DomainTrend } from "@/components/charts/charts";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/ui/logo";
import { Avatar } from "@/components/ui/misc";
import { ProgressRing } from "@/components/ui/progress";
import { AI_CHECKS, DOMAINS, DOMAIN_ORDER, SPECIALTIES, scoreLevel } from "@/lib/constants";
import { FREQUENCY_LABEL } from "@/lib/core/plan";
import { adherence, streakOf, weeklySeries } from "@/lib/core/stats";
import type { AiCheckId, SpecialistPatient } from "@/lib/types";
import { ageOf, cn, formatDate, formatDateTime } from "@/lib/utils";

const NOTE_KIND: Record<string, { label: string; tone: "brand" | "good" | "premium" }> = {
  tavsiya: { label: "Tavsiya", tone: "brand" },
  xulosa: { label: "Xulosa", tone: "good" },
  hamkasb: { label: "Mutaxassislararo", tone: "premium" },
};

/** Bolaning yagona rivojlanish hisoboti (ota-ona pasporti, mutaxassis kabineti va ulashilgan havola uchun) */
export function ReportView({
  data,
  shareUrl,
  audience = "parent",
  className,
}: {
  data: SpecialistPatient;
  shareUrl?: string;
  audience?: "parent" | "specialist" | "shared";
  className?: string;
}) {
  const { child, assessments, activities, plan, assignments, notes } = data;
  const scopes = new Set(data.share?.scopes ?? ["baholash", "mashqlar", "ai", "kuzatuvlar", "mutaxassis"]);
  const sorted = useMemo(() => [...assessments].sort((a, b) => a.at.localeCompare(b.at)), [assessments]);
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  const age = ageOf(child.birthDate);

  const practice = useMemo(() => activities.filter((a) => a.kind !== "assessment"), [activities]);
  const byKind = (k: string) => practice.filter((a) => a.kind === k);
  const minutes = Math.round(practice.reduce((s, a) => s + (a.durationSec ?? 0), 0) / 60);
  const adh = adherence(plan, assignments, activities, 14);
  const streak = streakOf(activities);
  const weeks = weeklySeries(practice, 8).map((w) => ({ label: formatDate(w.start).split(" ")[0] + "." + w.start.slice(5, 7), value: w.count, tooltip: `${formatDate(w.start)} haftasi` }));

  const aiRows = useMemo(() => {
    const ids = Array.from(new Set(byKind("ai_check").map((a) => a.refId))) as AiCheckId[];
    return ids.map((id) => {
      const list = byKind("ai_check").filter((a) => a.refId === id).sort((a, b) => a.at.localeCompare(b.at));
      const scores = list.map((a) => a.score ?? 0);
      const holds = list.map((a) => Number(a.details?.holdSec ?? 0)).filter(Boolean);
      return {
        id,
        meta: AI_CHECKS[id],
        count: list.length,
        firstScore: scores[0] ?? 0,
        lastScore: scores[scores.length - 1] ?? 0,
        best: Math.max(0, ...scores),
        bestHold: holds.length ? Math.max(...holds) : undefined,
        firstHold: holds[0],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities]);

  const speechRows = useMemo(() => {
    const list = byKind("speech");
    const ids = Array.from(new Set(list.map((a) => a.refId)));
    return ids.map((id) => {
      const l = list.filter((a) => a.refId === id).sort((a, b) => a.at.localeCompare(b.at));
      const half = Math.max(1, Math.floor(l.length / 2));
      const avg = (arr: typeof l) => (arr.length ? Math.round(arr.reduce((s, a) => s + (a.score ?? 0), 0) / arr.length) : 0);
      const snd = SPEECH_SOUNDS.find((s) => s.id === id);
      return { id, label: snd ? `«${snd.sound}» tovushi` : (l[0]?.title ?? id).replace(/^Talaffuz:\s*/, ""), count: l.length, early: avg(l.slice(0, half)), recent: avg(l.slice(-half)) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities]);

  const gameRows = useMemo(() => {
    return GAMES.map((g) => {
      const l = byKind("game").filter((a) => a.refId === g.id);
      return { g, count: l.length, avg: l.length ? Math.round(l.reduce((s, a) => s + (a.score ?? 0), 0) / l.length) : 0 };
    }).filter((r) => r.count > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities]);

  const specialistNotes = [...notes].sort((a, b) => b.at.localeCompare(a.at));
  const reportId = `YQ-${child.id.slice(-4).toUpperCase()}-${(latest?.at ?? new Date().toISOString()).slice(2, 10).replace(/-/g, "")}`;
  const lvl = latest ? scoreLevel(latest.overall) : undefined;

  return (
    <div className={cn("space-y-5", className)}>
      {/* Sarlavha */}
      <div className="print-plain overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-brand-50 via-white to-white p-5">
          <div className="flex items-center gap-3">
            <LogoMark size={46} />
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-brand-700">YuniQo · Rivojlanish pasporti</div>
              <div className="text-xl font-black text-ink sm:text-2xl">Bolaning rivojlanish hisoboti</div>
              <div className="text-xs font-semibold text-muted">
                Hisobot № {reportId} · tuzilgan sana: {formatDate(new Date(), { year: true })}
              </div>
            </div>
          </div>
          {shareUrl && (
            <div className="hidden shrink-0 flex-col items-center sm:flex">
              <QRCodeSVG value={shareUrl} size={78} fgColor="#0f172a" level="M" />
              <div className="mt-1 text-[10px] font-bold text-muted">Jonli versiya</div>
            </div>
          )}
        </div>
        <div className="grid gap-4 border-t border-line p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-brand-50 text-5xl">{child.avatar}</div>
          <div className="min-w-0">
            <div className="text-2xl font-black text-ink">{child.name}</div>
            <div className="mt-0.5 text-sm font-semibold text-ink-2">
              {age.label} ({formatDate(child.birthDate, { year: true })}) · {child.gender === "qiz" ? "qiz" : "o‘g‘il"}
              {child.region ? ` · ${regionName(child.region)}${child.district ? `, ${districtLabel(child.district)}` : ""}` : ""}
            </div>
            <div className="mt-0.5 text-xs font-semibold text-muted">Ota-ona: {data.parentName}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {child.concerns.map((c) => (
                <Badge key={c} tone="warn">
                  {c}
                </Badge>
              ))}
              {child.diagnoses.map((c) => (
                <Badge key={c} tone="gray">
                  🩺 {c}
                </Badge>
              ))}
            </div>
          </div>
          {latest && lvl && (
            <div className="flex items-center gap-3 sm:flex-col">
              <ProgressRing value={latest.overall / 100} size={86} stroke={9}>
                <span className="text-xl font-black text-ink">{latest.overall}%</span>
              </ProgressRing>
              <div className="text-center text-xs font-extrabold" style={{ color: lvl.key === "warning" ? "#8a5a00" : lvl.color }}>
                {lvl.icon} {lvl.label}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Asosiy ko‘rsatkichlar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["🧠", "Baholashlar", `${assessments.length} ta`, first && latest && first.id !== latest.id ? `${formatDate(first.at)} — ${formatDate(latest.at)}` : ""],
          ["🎯", "Mashg‘ulotlar", `${practice.length} ta`, `${minutes} daqiqa jami`],
          ["📊", "Rejaga amal", `${adh}%`, "oxirgi 14 kun"],
          ["🔥", "Muntazamlik", `${streak.current} kun`, `eng uzun seriya ${streak.best} kun`],
        ].map(([e, l, v, h]) => (
          <div key={l} className="print-plain rounded-3xl border border-line bg-white p-4 shadow-card">
            <div className="text-xs font-bold text-muted">
              {e} {l}
            </div>
            <div className="mt-1 text-2xl font-black text-ink">{v}</div>
            {h && <div className="text-[11px] font-semibold text-muted">{h}</div>}
          </div>
        ))}
      </div>

      {scopes.has("baholash") && latest && (
        <Block title="1. Rivojlanish baholashi natijalari" emoji="🧠">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="print-avoid">
              <DomainRadar current={latest.scores} previous={first && first.id !== latest.id ? first.scores : undefined} height={250} />
            </div>
            <table className="w-full self-start text-sm">
              <thead>
                <tr className="text-left text-[11px] font-extrabold uppercase tracking-wide text-muted">
                  <th className="py-2">Yo‘nalish</th>
                  <th className="py-2 text-right">Birinchi</th>
                  <th className="py-2 text-right">So‘nggi</th>
                  <th className="py-2 text-right">O‘zgarish</th>
                </tr>
              </thead>
              <tbody>
                {DOMAIN_ORDER.map((d) => {
                  const a = first?.scores[d] ?? latest.scores[d];
                  const b = latest.scores[d];
                  const l = scoreLevel(b);
                  return (
                    <tr key={d} className="border-t border-line">
                      <td className="py-2.5 font-bold text-ink">
                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: DOMAINS[d].color }} />
                        {DOMAINS[d].label}
                        <div className="pl-[18px] text-[11px] font-bold" style={{ color: l.key === "warning" ? "#8a5a00" : l.color }}>
                          {l.icon} {l.label}
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-muted tabular">{a}%</td>
                      <td className="py-2.5 text-right font-black text-ink tabular">{b}%</td>
                      <td className={cn("py-2.5 text-right font-black tabular", b - a > 0 ? "text-[#006300]" : b - a < 0 ? "text-danger" : "text-muted")}>
                        {b - a > 0 ? "▲" : b - a < 0 ? "▼" : ""} {Math.abs(b - a)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {sorted.length >= 2 && (
            <div className="print-avoid mt-4">
              <div className="mb-1 text-sm font-extrabold text-ink">Dinamika ({sorted.length} ta baholash)</div>
              <DomainTrend assessments={sorted} height={220} />
            </div>
          )}
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#f6f3ff] to-brand-50 p-4">
            <div className="mb-1 text-xs font-extrabold uppercase tracking-wide text-[#6d4fe6]">{latest.aiGenerated ? "Claude AI xulosasi" : "YuniQo AI xulosasi"}</div>
            <p className="text-[15px] leading-relaxed text-ink">{latest.summary}</p>
          </div>
        </Block>
      )}

      {scopes.has("mashqlar") && (
        <Block title="2. Mashqlar va mashg‘ulotlar" emoji="🎯">
          <div className="grid gap-3 sm:grid-cols-5">
            {[
              ["🎯", "Mashqlar", byKind("exercise").length],
              ["🎮", "O‘yinlar", byKind("game").length],
              ["👩‍🏫", "AI darslar", byKind("lesson").length],
              ["🎥", "Videolar", byKind("video").length],
              ["📚", "Maqolalar", byKind("article").length],
            ].map(([e, l, v]) => (
              <div key={l as string} className="rounded-2xl bg-slate-50 p-3 text-center">
                <div className="text-lg">{e}</div>
                <div className="text-xl font-black text-ink">{v}</div>
                <div className="text-[11px] font-bold text-muted">{l}</div>
              </div>
            ))}
          </div>
          <div className="print-avoid mt-4">
            <div className="mb-1 text-sm font-extrabold text-ink">Haftalik faollik (8 hafta)</div>
            <ActivityBars data={weeks} height={170} />
          </div>
          {gameRows.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-sm font-extrabold text-ink">Rivojlantiruvchi o‘yinlar natijalari</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {gameRows.map((r) => (
                  <div key={r.g.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-bold text-ink-2">
                      {r.g.emoji} {r.g.title} <span className="text-muted">({r.g.skill})</span>
                    </span>
                    <span className="font-black text-ink">
                      {r.avg}% <span className="text-xs font-semibold text-muted">· {r.count} marta</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Block>
      )}

      {scopes.has("ai") && (aiRows.length > 0 || speechRows.length > 0) && (
        <Block title="3. AI natijalari (video nazorat va talaffuz)" emoji="🤖">
          {aiRows.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-extrabold uppercase tracking-wide text-muted">
                  <th className="py-2">AI video nazorat mashqi</th>
                  <th className="py-2 text-right">Seanslar</th>
                  <th className="py-2 text-right">Aniqlik (birinchi → so‘nggi)</th>
                  <th className="py-2 text-right">Eng yaxshi</th>
                </tr>
              </thead>
              <tbody>
                {aiRows.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-2.5 font-bold text-ink">
                      {r.meta?.emoji} {r.meta?.title ?? r.id}
                    </td>
                    <td className="py-2.5 text-right text-muted tabular">{r.count}</td>
                    <td className="py-2.5 text-right font-bold text-ink tabular">
                      {r.firstScore}% → {r.lastScore}%{" "}
                      <span className={r.lastScore >= r.firstScore ? "text-[#006300]" : "text-danger"}>
                        ({r.lastScore >= r.firstScore ? "+" : ""}
                        {r.lastScore - r.firstScore})
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-black text-ink tabular">{r.bestHold ? `${r.bestHold} s` : `${r.best}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {speechRows.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {speechRows.map((r) => (
                <div key={r.id} className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-extrabold text-ink">🎙️ Talaffuz: {r.label}</span>
                    <span className="text-xs font-bold text-muted">{r.count} mashq</span>
                  </div>
                  <div className="mt-1 text-sm text-ink-2">
                    Boshida o‘rtacha <b>{r.early}%</b> → hozir <b className="text-ink">{r.recent}%</b>{" "}
                    <span className={r.recent >= r.early ? "font-black text-[#006300]" : "font-black text-danger"}>
                      ({r.recent >= r.early ? "+" : ""}
                      {r.recent - r.early})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs font-semibold text-muted">AI video tahlili qurilmada bajarilgan; videoyozuvlar saqlanmaydi — faqat natijalar (takrorlar, aniqlik, xatolar).</p>
        </Block>
      )}

      {scopes.has("mutaxassis") && specialistNotes.length > 0 && (
        <Block title="4. Mutaxassislar xulosalari va tavsiyalari" emoji="👩‍⚕️">
          <div className="space-y-3">
            {specialistNotes.map((n) => {
              const sp = getSpecialist(n.specialistId);
              return (
                <div key={n.id} className="print-avoid flex gap-3 rounded-2xl border border-line p-3.5">
                  <Avatar name={sp?.name} color={sp?.color} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-ink">{sp?.name}</span>
                      <span className="text-xs font-semibold text-muted">{sp ? SPECIALTIES[sp.specialty].label : ""}</span>
                      <Badge tone={NOTE_KIND[n.kind].tone}>{NOTE_KIND[n.kind].label}</Badge>
                      <span className="text-xs text-faint">{formatDateTime(n.at)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink-2">{n.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Block>
      )}

      {plan && (
        <Block title="5. Joriy individual reja va topshiriqlar" emoji="📋">
          <p className="text-sm leading-relaxed text-ink-2">{plan.summary}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {plan.items.map((it) => {
              const ex = getExercise(it.exerciseId);
              if (!ex) return null;
              const sp = it.assignedBy ? getSpecialist(it.assignedBy) : undefined;
              return (
                <div key={it.exerciseId} className="flex items-center gap-2.5 rounded-2xl bg-slate-50 px-3 py-2">
                  <span className="text-xl">{ex.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-extrabold text-ink">{ex.title}</div>
                    <div className="truncate text-[11px] font-semibold text-muted">
                      {FREQUENCY_LABEL[it.frequency]} · {DOMAINS[ex.domain].label}
                      {sp ? ` · ${sp.name.split(" ")[0]} topshirig‘i` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {assignments.filter((a) => a.status === "faol").length > 0 && (
            <div className="mt-3 text-xs font-bold text-muted">
              Faol mutaxassis topshiriqlari: {assignments.filter((a) => a.status === "faol").length} ta · bajarilgan: {assignments.filter((a) => a.status === "bajarildi").length} ta
            </div>
          )}
        </Block>
      )}

      {scopes.has("kuzatuvlar") && child.observations.length > 0 && (
        <Block title="6. Ota-ona kuzatuvlari" emoji="📝">
          <div className="grid gap-2 sm:grid-cols-2">
            {child.observations.slice(0, 6).map((o) => (
              <div key={o.id} className="flex gap-2.5 rounded-2xl bg-slate-50 p-3 text-sm">
                <span className="text-xl">{o.mood ?? "📝"}</span>
                <div>
                  <p className="leading-relaxed text-ink-2">{o.text}</p>
                  <div className="text-[11px] font-semibold text-faint">{formatDate(o.at, { year: true })}</div>
                </div>
              </div>
            ))}
          </div>
        </Block>
      )}

      {latest && (
        <Block title="7. Keyingi davr uchun tavsiyalar" emoji="🧭">
          <ol className="space-y-2">
            {latest.recommendations.map((r, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-black text-brand-700">{i + 1}</span>
                {r}
              </li>
            ))}
          </ol>
        </Block>
      )}

      <div className="print-plain rounded-3xl border border-dashed border-line bg-white/70 p-4 text-xs leading-relaxed text-muted">
        <b className="text-ink-2">Muhim:</b> Ushbu hisobot ota-ona javoblari, uy mashqlari va qurilmadagi AI tahlil natijalari asosida YuniQo platformasi tomonidan
        avtomatik shakllantirilgan. U tibbiy tashxis emas va mutaxassis ko‘rigi o‘rnini bosmaydi.
        {audience === "shared" && data.share && ` Ota-ona ruxsati bilan ${formatDate(data.share.createdAt)} kuni ulashilgan, havola ${formatDate(data.share.expiresAt, { year: true })} gacha amal qiladi.`}
      </div>
    </div>
  );
}

function Block({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section className="print-plain rounded-3xl border border-line bg-white p-5 shadow-card">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-ink [break-after:avoid]">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-lg">{emoji}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}
