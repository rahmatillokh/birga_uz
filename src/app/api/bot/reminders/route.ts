import { sessionsForDistrict } from "@/data/sessions";
import { latestAssessment, todayTasks } from "@/lib/core/stats";
import { isBotRequest } from "@/server/auth";
import { getDB } from "@/server/db";
import { addDays, todayKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Kundalik eslatmalari o‘chirilgan, lekin sessiya xabarlariga obuna bo‘lganlarga — shu vaqtda */
const SESSION_ALERT_TIME = "10:00";

/**
 * Bot rejalashtiruvchisi har daqiqada chaqiradi: ?hhmm=18:30&weekday=5
 * Shu daqiqada xabar olishi kerak bo‘lgan Telegram foydalanuvchilari ro‘yxati.
 */
export async function GET(req: Request) {
  if (!isBotRequest(req)) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const url = new URL(req.url);
  const hhmm = url.searchParams.get("hhmm") ?? "";
  const weekday = Number(url.searchParams.get("weekday") ?? 0);
  const db = getDB();
  const today = todayKey();
  const tomorrow = addDays(today, 1);
  const monthAgo = addDays(today, -30);

  const out = [];
  for (const u of Object.values(db.users)) {
    if (!u.tgId) continue;
    const dailyDue = u.reminders.enabled && u.reminders.time === hhmm && u.reminders.days.includes(weekday);
    const session =
      u.sessionAlerts && u.region && u.district ? sessionsForDistrict(u.region, u.district).find((s) => s.date === tomorrow) : undefined;
    const sessionOnlyDue = !u.reminders.enabled && hhmm === SESSION_ALERT_TIME && !!session;
    if (!dailyDue && !sessionOnlyDue) continue;

    const children = db.children.filter((c) => c.ownerUid === u.uid);
    const perChild = dailyDue
      ? children.map((c) => {
          const plan = db.plans.find((p) => p.childId === c.id);
          const asg = db.assignments.filter((a) => a.childId === c.id);
          const tasks = todayTasks(plan, asg, db.activities.filter((a) => a.childId === c.id));
          return {
            childId: c.id,
            childName: c.name,
            avatar: c.avatar,
            left: tasks.filter((t) => !t.done).map((t) => ({ emoji: t.exercise.emoji, title: t.exercise.title, durationMin: t.exercise.durationMin, fromSpecialist: !!t.assignedBy })),
            done: tasks.filter((t) => t.done).length,
          };
        })
      : [];
    const reassessDue =
      dailyDue && u.reminders.types.reassessment
        ? children
            .filter((c) => {
              const last = latestAssessment(db.assessments.filter((a) => a.childId === c.id), c.id);
              return !last || last.at.slice(0, 10) <= monthAgo;
            })
            .map((c) => c.name)
        : [];
    out.push({
      tgId: u.tgId,
      name: u.name,
      types: u.reminders.types,
      daily: dailyDue,
      children: perChild,
      bookingsTomorrow: dailyDue ? db.bookings.filter((b) => b.uid === u.uid && b.date === tomorrow && b.status !== "bekor") : [],
      sessionTomorrow: session && (sessionOnlyDue || u.reminders.types.sessions) ? session : undefined,
      reassessDue,
    });
  }
  return Response.json({ users: out });
}
