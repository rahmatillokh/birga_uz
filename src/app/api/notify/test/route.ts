import { todayTasks } from "@/lib/core/stats";
import { identify } from "@/server/auth";
import { getDB } from "@/server/db";
import { appButton, botToken, escapeHtml, notifyUid } from "@/server/telegram";

/** "Test eslatma" — Telegram orqali darhol eslatma yuborish */
export async function POST(req: Request) {
  const db = getDB();
  const id = identify(req, db);
  if ("error" in id) return Response.json({ error: id.error }, { status: 401 });
  if (!botToken()) return Response.json({ ok: false, reason: "no-bot" });
  if (id.mode !== "telegram") return Response.json({ ok: false, reason: "not-telegram" });
  const user = db.users[id.uid];
  const child = db.children.find((c) => c.id === user?.activeChildId) ?? db.children.find((c) => c.ownerUid === id.uid);
  let text = "🔔 <b>YuniQo eslatmasi</b>\n\nMashg‘ulot vaqti keldi!";
  if (child) {
    const plan = db.plans.find((p) => p.childId === child.id);
    const tasks = todayTasks(plan, db.assignments.filter((a) => a.childId === child.id), db.activities.filter((a) => a.childId === child.id));
    const left = tasks.filter((t) => !t.done);
    text = `🔔 <b>${escapeHtml(child.name)} bilan mashg‘ulot vaqti!</b>\n\nBugun ${left.length} ta mashq qoldi:\n${left
      .slice(0, 5)
      .map((t) => `${t.exercise.emoji} ${escapeHtml(t.exercise.title)} — ${t.exercise.durationMin} daq`)
      .join("\n")}\n\nHar kuni 15–20 daqiqa — katta natija! 💪`;
  }
  const ok = await notifyUid(id.uid, text, [[appButton("▶️ Mashg‘ulotni boshlash", "/plan")]]);
  return Response.json({ ok });
}
