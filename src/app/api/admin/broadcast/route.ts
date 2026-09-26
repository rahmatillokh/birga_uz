import { applyAction } from "@/lib/core/reducer";
import { adminAllowed } from "@/server/admin";
import { getDB, saveDB } from "@/server/db";
import { appButton, botToken, escapeHtml, sendTelegram } from "@/server/telegram";

/** Barcha Telegram foydalanuvchilariga xabar (ixtiyoriy: 7 kunlik Premium sovg‘a) */
export async function POST(req: Request) {
  if (!adminAllowed(req)) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  if (!botToken()) return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN o‘rnatilmagan" }, { status: 400 });
  const { text, gift } = (await req.json()) as { text?: string; gift?: boolean };
  if (!text?.trim()) return Response.json({ ok: false, error: "Matn bo‘sh" }, { status: 400 });
  const db = getDB();
  const users = Object.values(db.users).filter((u) => u.tgId);
  let sent = 0;
  for (const u of users) {
    if (gift && u.premium.plan !== "premium") applyAction(db, { type: "user", uid: u.uid }, { type: "user.premium", plan: "premium", trial: true });
    const ok = await sendTelegram(u.tgId!, `📢 <b>YuniQo</b>\n\n${escapeHtml(text.trim())}${gift ? "\n\n🎁 Sizga <b>7 kunlik Premium</b> sovg‘a qilindi!" : ""}`, [
      [appButton("🚀 YuniQo ilovasini ochish", "/")],
    ]);
    if (ok) sent++;
    await new Promise((r) => setTimeout(r, 45)); // Telegram limitlari (~25 xabar/soniya)
  }
  saveDB();
  return Response.json({ ok: true, sent, total: users.length });
}
