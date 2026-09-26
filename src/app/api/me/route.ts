import { userView } from "@/lib/core/views";
import { getDB, saveDB } from "@/server/db";
import { identify } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const db = getDB();
  const id = identify(req, db);
  if ("error" in id) return Response.json({ error: id.error }, { status: 401 });
  const view = userView(db, id.uid);
  saveDB();
  return Response.json({
    mode: id.mode,
    view,
    ai: !!process.env.ANTHROPIC_API_KEY,
    bot: { username: process.env.TELEGRAM_BOT_USERNAME || null, connected: !!process.env.TELEGRAM_BOT_TOKEN },
  });
}
