// Natija: yulduzlar, keyingi mashq tavsiyasi, profilga saqlanadigan ma’lumotlar
import { EXERCISES } from "@/data/exercises";
import { AI_CHECKS } from "@/lib/constants";
import type { Activity, AiCheckId, Exercise } from "@/lib/types";
import { CAMERA_CHECKS, CHECK_META, isCameraCheck } from "./catalog";
import type { CameraCheckId, Summary } from "./types";

export type Stars = 0 | 1 | 2 | 3;

/** Bajarilganlik (55%) + aniqlik (45%) */
export function starsFor(s: Summary): Stars {
  if (s.totalUnits === 0 && s.holdSec < 1) return 0;
  const v = 0.55 * s.completion + 0.45 * (s.accuracy / 100);
  return v >= 0.85 ? 3 : v >= 0.6 ? 2 : 1;
}

export function resultTitle(stars: Stars): { emoji: string; title: string; text: string } {
  switch (stars) {
    case 3:
      return { emoji: "🏆", title: "Ajoyib natija!", text: "Mashq a’lo darajada bajarildi" };
    case 2:
      return { emoji: "🌟", title: "Juda yaxshi!", text: "Yana ozgina mashq — va a’lo bo‘ladi" };
    case 1:
      return { emoji: "💪", title: "Yaxshi harakat!", text: "Har bir urinish bilan kuchliroq bo‘lasiz" };
    default:
      return { emoji: "🙂", title: "Keling, yana urinib ko‘ramiz", text: "Kameraga to‘liq ko‘rinib, mashqni boshlang" };
  }
}

/** Mashq bajarildi deb hisoblash uchun yetarli harakat bo‘ldimi (profilga saqlashga arziydimi) */
export function isMeaningful(s: Summary): boolean {
  return s.totalUnits > 0 || s.holdSec >= 1;
}

/** Profilga saqlanadigan xatolar ro‘yxati: "Chuqurroq o‘tiring — 2 marta" */
export function errorsForDetails(s: Summary): string[] {
  return s.errors.slice(0, 5).map((e) => `${e.text} — ${e.count} marta`);
}

export interface Recommendation {
  kind: "check" | "speech" | "exercise";
  href: string;
  emoji: string;
  title: string;
  reason: string;
  label: string;
}

const NEXT: Record<CameraCheckId, { id: AiCheckId; reason: string }> = {
  "arms-up": { id: "airplane", reason: "Qo‘llar kuchaydi — endi ularni samolyot qanotidek ushlab turamiz" },
  airplane: { id: "balance", reason: "Qo‘llar bilan muvozanat topildi — endi bir oyoqda turib ko‘ramiz" },
  squat: { id: "balance", reason: "Oyoq mushaklari ishladi — endi muvozanatni sinab ko‘ramiz" },
  balance: { id: "tiptoe", reason: "Muvozanat yaxshi — endi oyoq uchida ko‘tarilamiz (yassi oyoqlik profilaktikasi)" },
  tiptoe: { id: "squat", reason: "Oyoq panjalari mashq qildi — endi o‘tirib-turish" },
  "smile-pucker": { id: "speech", reason: "Lablar qizidi — endi so‘zlarni aytib, talaffuzni tekshiramiz" },
};

function libraryExercise(id: AiCheckId): Exercise | undefined {
  return EXERCISES.find((e) => e.aiCheck === id);
}

function checkRec(id: AiCheckId, reason: string): Recommendation {
  const meta = AI_CHECKS[id];
  if (id === "speech") return { kind: "speech", href: "/speech", emoji: meta.emoji, title: meta.title, reason, label: "Boshlash" };
  return { kind: "check", href: `/ai-check/${id}`, emoji: meta.emoji, title: meta.title, reason, label: "AI bilan tekshirish" };
}

function exerciseRec(e: Exercise, reason: string): Recommendation {
  return { kind: "exercise", href: `/exercises/${e.id}`, emoji: e.emoji, title: e.title, reason, label: "Mashqni ochish" };
}

/** Oxirgi AI natijalari: id → { score, at } */
function lastResults(activities: Activity[]): Map<string, { score: number; at: string }> {
  const m = new Map<string, { score: number; at: string }>();
  for (const a of activities) {
    if (a.kind !== "ai_check") continue;
    const prev = m.get(a.refId);
    if (!prev || prev.at < a.at) m.set(a.refId, { score: a.score ?? 0, at: a.at });
  }
  return m;
}

/**
 * Keyingi mashq tavsiyasi:
 *  - natija past bo‘lsa — shu mashqni takrorlash (+ kutubxonadagi mos mashq),
 *  - yaxshi bo‘lsa — mantiqiy keyingi AI tekshiruv (yaqinda a’lo bajarilgan bo‘lsa — boshqasi).
 */
export function recommendNext(current: CameraCheckId, s: Summary, activities: Activity[]): Recommendation[] {
  const stars = starsFor(s);
  const out: Recommendation[] = [];
  const topError = s.errors[0]?.text;

  if (stars <= 1) {
    out.push(
      checkRec(current, topError ? `Yana bir marta — bu safar «${topError}» ga e’tibor bering` : "Yana bir marta, shoshilmasdan bajaring"),
    );
    const ex = libraryExercise(current);
    if (ex) out.push(exerciseRec(ex, "Avval bajarish tartibini ota-ona bilan birga ko‘rib chiqing"));
    return out;
  }

  const last = lastResults(activities);
  const recentlyGood = (id: string) => {
    const r = last.get(id);
    return !!r && r.score >= 80 && Date.now() - new Date(r.at).getTime() < 3 * 86_400_000;
  };
  let next = NEXT[current];
  if (next.id !== "speech" && recentlyGood(next.id)) {
    const candidates = CAMERA_CHECKS.filter((id) => id !== current && !recentlyGood(id)).sort((a, b) => {
      const ra = last.get(a);
      const rb = last.get(b);
      if (!ra !== !rb) return ra ? 1 : -1; // hali bajarilmaganlar oldinda
      return (ra?.score ?? 0) - (rb?.score ?? 0);
    });
    const alt = candidates[0];
    if (alt) {
      next = {
        id: alt,
        reason: last.has(alt) ? "Oxirgi natija pastroq edi — keling, uni ham yaxshilaymiz" : "Bu mashqni hali sinab ko‘rmadingiz — qiziqarli bo‘ladi!",
      };
    }
  }
  out.push(checkRec(next.id, next.reason));

  if (stars === 2 && topError) {
    const ex = libraryExercise(current);
    if (ex) out.push(exerciseRec(ex, `Mustahkamlash uchun: «${topError}» ustida ishlang`));
  }
  if (out.length < 2 && isCameraCheck(next.id)) {
    const ex = libraryExercise(next.id);
    if (ex) out.push(exerciseRec(ex, "Kutubxonada batafsil bajarish tartibi bor"));
  }
  return out.slice(0, 2);
}

// ---------------------------------------------------------------------------
// Saqlangan faoliyatni ko‘rsatish (markaz sahifasi, tarix)
// ---------------------------------------------------------------------------

const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

export function formatSec(sec: number): string {
  return `${(Math.round(sec * 10) / 10).toString().replace(".", ",")} s`;
}

/** "8/10 · 85%" yoki "7,5 s · 90%" */
export function activityResultLine(a: Activity): string {
  const d = a.details ?? {};
  const reps = num(d.reps);
  const target = num(d.target);
  const hold = num(d.holdSec);
  const holdMode = d.mode === "hold" || (isCameraCheck(a.refId) && CHECK_META[a.refId].mode === "hold");
  const parts: string[] = [];
  if (holdMode && hold !== undefined) parts.push(`⏱ ${formatSec(hold)}`);
  else if (reps !== undefined) parts.push(target ? `${reps}/${target} marta` : `${reps} marta`);
  else if (hold !== undefined) parts.push(`⏱ ${formatSec(hold)}`);
  if (typeof a.score === "number") parts.push(`${a.score}%`);
  return parts.join(" · ") || "Bajarildi";
}

export function starsOfActivity(a: Activity): Stars {
  const s = num(a.details?.stars);
  if (s !== undefined) return Math.max(0, Math.min(3, Math.round(s))) as Stars;
  const score = a.score ?? 0;
  return score >= 85 ? 3 : score >= 60 ? 2 : 1;
}

export function isDemoActivity(a: Activity): boolean {
  return a.details?.demo === true;
}
