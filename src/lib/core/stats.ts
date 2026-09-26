import { getExercise } from "@/data/exercises";
import { DOMAIN_ORDER, LEVELS } from "@/lib/constants";
import type { Activity, Assessment, Assignment, Booking, Domain, Exercise, Plan } from "@/lib/types";
import { addDays, dayKey, todayKey, weekdayOf } from "@/lib/utils";
import { isScheduled } from "./plan";

export function totalPoints(activities: Activity[]): number {
  return activities.reduce((s, a) => s + a.points, 0);
}

export function levelFor(points: number) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].min) idx = i;
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const progress = next ? (points - cur.min) / (next.min - cur.min) : 1;
  return { index: idx + 1, ...cur, next, progress, toNext: next ? next.min - points : 0 };
}

/** Ketma-ket faol kunlar (bugun hali mashq qilinmagan bo‘lsa, kechagidan hisoblanadi) */
export function streakOf(activities: Activity[]): { current: number; best: number; activeToday: boolean } {
  const days = new Set(activities.map((a) => dayKey(a.at)));
  const today = todayKey();
  const activeToday = days.has(today);
  let cur = 0;
  let d = activeToday ? today : addDays(today, -1);
  while (days.has(d)) {
    cur++;
    d = addDays(d, -1);
  }
  // eng uzun seriya
  const sorted = Array.from(days).sort();
  let best = 0;
  let run = 0;
  let prev = "";
  for (const k of sorted) {
    run = prev && addDays(prev, 1) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return { current: cur, best: Math.max(best, cur), activeToday };
}

/** Oxirgi n kun bo‘yicha kunlik statistika */
export function dailySeries(activities: Activity[], days = 14) {
  const today = todayKey();
  const map = new Map<string, { count: number; points: number; minutes: number }>();
  for (const a of activities) {
    const k = dayKey(a.at);
    const cur = map.get(k) ?? { count: 0, points: 0, minutes: 0 };
    cur.count++;
    cur.points += a.points;
    cur.minutes += Math.round((a.durationSec ?? 0) / 60);
    map.set(k, cur);
  }
  const out: { day: string; weekday: number; count: number; points: number; minutes: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = addDays(today, -i);
    out.push({ day: k, weekday: weekdayOf(k), ...(map.get(k) ?? { count: 0, points: 0, minutes: 0 }) });
  }
  return out;
}

/** Oxirgi n hafta bo‘yicha (dushanbadan boshlanadigan) statistika */
export function weeklySeries(activities: Activity[], weeks = 8) {
  const today = todayKey();
  const monday = addDays(today, -(weekdayOf(today) - 1));
  const out: { start: string; count: number; points: number; avgScore: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(monday, -7 * i);
    const end = addDays(start, 7);
    const list = activities.filter((a) => {
      const k = dayKey(a.at);
      return k >= start && k < end;
    });
    const scored = list.filter((a) => typeof a.score === "number");
    out.push({
      start,
      count: list.length,
      points: totalPoints(list),
      avgScore: scored.length ? Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length) : 0,
    });
  }
  return out;
}

export function activitiesInRange(activities: Activity[], fromKey: string, toKey: string = todayKey()) {
  return activities.filter((a) => {
    const k = dayKey(a.at);
    return k >= fromKey && k <= toKey;
  });
}

export function domainActivityCounts(activities: Activity[]): Record<Domain, number> {
  const out = Object.fromEntries(DOMAIN_ORDER.map((d) => [d, 0])) as Record<Domain, number>;
  for (const a of activities) out[a.domain]++;
  return out;
}

export interface TodayTask {
  exercise: Exercise;
  done: boolean;
  reason: string;
  assignedBy?: string;
  assignmentId?: string;
}

/** Bugungi vazifalar: reja + mutaxassis topshiriqlari */
export function todayTasks(plan: Plan | undefined, assignments: Assignment[], activities: Activity[], key = todayKey()): TodayTask[] {
  const doneIds = new Set(activities.filter((a) => a.kind === "exercise" && dayKey(a.at) === key).map((a) => a.refId));
  const out: TodayTask[] = [];
  const seen = new Set<string>();
  for (const a of assignments.filter((x) => x.status === "faol" && x.exerciseId)) {
    const ex = getExercise(a.exerciseId);
    if (!ex || seen.has(ex.id) || !isScheduled(a, key)) continue;
    seen.add(ex.id);
    out.push({ exercise: ex, done: doneIds.has(ex.id), reason: a.title, assignedBy: a.specialistId, assignmentId: a.id });
  }
  for (const it of plan?.items ?? []) {
    const ex = getExercise(it.exerciseId);
    if (!ex || seen.has(ex.id) || !isScheduled(it, key)) continue;
    seen.add(ex.id);
    out.push({ exercise: ex, done: doneIds.has(ex.id), reason: it.reason, assignedBy: it.assignedBy });
  }
  return out;
}

/** Rejaning bajarilish foizi (oxirgi 7 kun) */
export function adherence(plan: Plan | undefined, assignments: Assignment[], activities: Activity[], days = 7): number {
  let planned = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const k = addDays(todayKey(), -i - 1);
    const tasks = todayTasks(plan, assignments, activities, k);
    planned += tasks.length;
    done += tasks.filter((t) => t.done).length;
  }
  return planned ? Math.round((done / planned) * 100) : 0;
}

export interface Badge {
  id: string;
  title: string;
  emoji: string;
  description: string;
  earned: boolean;
  progress: number; // 0..1
  hint: string;
}

export function badgesFor(activities: Activity[], assessments: Assessment[], bookings: Booking[]): Badge[] {
  const count = (pred: (a: Activity) => boolean) => activities.filter(pred).length;
  const streak = streakOf(activities);
  const ex = count((a) => a.kind === "exercise");
  const speech = count((a) => a.kind === "speech" || (a.kind === "exercise" && a.domain === "nutq"));
  const memory = count((a) => a.kind === "game");
  const motor = count((a) => a.domain === "yirik_motorika" || a.domain === "mayda_motorika");
  const ai = count((a) => a.kind === "ai_check");
  const lessons = count((a) => a.kind === "lesson");
  const consult = bookings.filter((b) => b.kind === "consultation" && b.status !== "bekor").length;
  const sessions = bookings.filter((b) => b.kind === "session" && b.status !== "bekor").length;
  const mk = (id: string, title: string, emoji: string, description: string, value: number, target: number, hint: string): Badge => ({
    id,
    title,
    emoji,
    description,
    earned: value >= target,
    progress: Math.min(1, value / target),
    hint: value >= target ? "Qo‘lga kiritildi" : `${value}/${target} — ${hint}`,
  });
  return [
    mk("first-step", "Birinchi qadam", "👣", "Birinchi mashqni bajardi", ex, 1, "1 ta mashq bajaring"),
    mk("assessed", "O‘zini bil", "🧭", "Rivojlanish baholashidan o‘tdi", assessments.length, 1, "baholashdan o‘ting"),
    mk("reassessed", "O‘sish nazorati", "📈", "Kamida 2 marta baholandi", assessments.length, 2, "qayta baholang"),
    mk("streak-7", "7 kunlik seriya", "🔥", "7 kun ketma-ket mashg‘ulot", streak.best, 7, "har kuni mashq qiling"),
    mk("streak-30", "30 kunlik seriya", "🌟", "30 kun ketma-ket mashg‘ulot", streak.best, 30, "har kuni mashq qiling"),
    mk("speech-20", "Nutq ustasi", "🗣️", "20 ta nutq mashqi", speech, 20, "nutq mashqlarini bajaring"),
    mk("games-15", "Xotira qahramoni", "🧠", "15 ta rivojlantiruvchi o‘yin", memory, 15, "o‘yinlarni o‘ynang"),
    mk("motor-25", "Harakatchan", "🤸", "25 ta motorika mashqi", motor, 25, "motorika mashqlarini bajaring"),
    mk("ai-5", "AI do‘sti", "🤖", "5 marta AI video nazoratdan o‘tdi", ai, 5, "AI tekshiruvdan o‘ting"),
    mk("lesson-10", "Zukko shogird", "🎓", "AI bilan 10 ta dars", lessons, 10, "AI bilan dars qiling"),
    mk("consult", "Mutaxassis bilan", "👨‍⚕️", "Birinchi konsultatsiya", consult, 1, "konsultatsiyaga yoziling"),
    mk("session", "Jamoa bilan", "🏢", "Bepul YuniQo sessiyasiga yozildi", sessions, 1, "bepul sessiyaga yoziling"),
    mk("century", "100 ta mashg‘ulot", "💯", "Jami 100 ta faoliyat", activities.length, 100, "mashg‘ulotlarni davom ettiring"),
  ];
}

/** Haftalik maqsadlar */
export function weeklyGoals(activities: Activity[]) {
  const today = todayKey();
  const monday = addDays(today, -(weekdayOf(today) - 1));
  const week = activitiesInRange(activities, monday, today);
  const activeDays = new Set(week.map((a) => dayKey(a.at))).size;
  return [
    { id: "w-ex", title: "Haftada 20 ta mashq", emoji: "🎯", value: week.filter((a) => a.kind === "exercise").length, target: 20 },
    { id: "w-days", title: "5 kun mashg‘ulot", emoji: "📅", value: activeDays, target: 5 },
    { id: "w-speech", title: "6 ta nutq mashqi", emoji: "🗣️", value: week.filter((a) => a.domain === "nutq").length, target: 6 },
    { id: "w-games", title: "5 ta o‘yin", emoji: "🎮", value: week.filter((a) => a.kind === "game").length, target: 5 },
  ];
}

export function latestAssessment(assessments: Assessment[], childId: string): Assessment | undefined {
  return assessments.filter((a) => a.childId === childId).sort((a, b) => b.at.localeCompare(a.at))[0];
}

export function firstAssessment(assessments: Assessment[], childId: string): Assessment | undefined {
  return assessments.filter((a) => a.childId === childId).sort((a, b) => a.at.localeCompare(b.at))[0];
}
