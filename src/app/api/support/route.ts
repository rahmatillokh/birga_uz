import { identify } from "@/server/auth";
import { getDB } from "@/server/db";
import { botToken, escapeHtml, sendTelegram } from "@/server/telegram";

/** Qo‘llab-quvvatlash xabari — ADMIN_CHAT_ID ga Telegram bot orqali yuboriladi */
export async function POST(req: Request) {
  const db = getDB();
  const id = identify(req, db);
  if ("error" in id) return Response.json({ error: id.error }, { status: 401 });
  const { topic, text } = (await req.json()) as { topic?: string; text?: string };
  if (!text || text.trim().length < 3) return Response.json({ ok: false, error: "Xabar bo‘sh" }, { status: 400 });
  const ticket = `YQ-${Math.floor(1000 + Math.random() * 9000)}`;
  const admin = process.env.ADMIN_CHAT_ID;
  let delivered = false;
  if (admin && botToken()) {
    const u = db.users[id.uid];
    delivered = await sendTelegram(
      admin,
      `🆘 <b>Qo‘llab-quvvatlash</b> #${ticket} (web ilova)\n👤 ${escapeHtml(u?.name ?? "—")}${u?.username ? ` @${escapeHtml(u.username)}` : ""}${u?.tgId ? ` · id ${u.tgId}` : " · demo"}\n📌 ${escapeHtml(topic ?? "Umumiy")}\n\n${escapeHtml(text.trim()).slice(0, 3000)}`,
    );
  }
  return Response.json({ ok: true, ticket, delivered });
}
