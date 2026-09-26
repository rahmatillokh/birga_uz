import { ensureUser } from "@/lib/core/reducer";
import { userView } from "@/lib/core/views";
import { isBotRequest, type TgUser } from "@/server/auth";
import { getDB, saveDB } from "@/server/db";

/** Bot: Telegram foydalanuvchisini ro‘yxatdan o‘tkazish va uning ma’lumotlarini olish */
export async function POST(req: Request) {
  if (!isBotRequest(req)) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const { tg } = (await req.json()) as { tg: TgUser };
  if (!tg?.id) return Response.json({ error: "tg.id kerak" }, { status: 400 });
  const db = getDB();
  const uid = `tg:${tg.id}`;
  const name = [tg.first_name, tg.last_name].filter(Boolean).join(" ") || tg.username || "Ota-ona";
  const u = ensureUser(db, uid, name, { tgId: tg.id });
  u.tgId = tg.id;
  if (tg.username) u.username = tg.username;
  saveDB();
  return Response.json({ view: userView(db, uid) });
}
