import { applyAction } from "@/lib/core/reducer";
import { userView } from "@/lib/core/views";
import type { Action } from "@/lib/types";
import { isBotRequest } from "@/server/auth";
import { getDB, saveDB } from "@/server/db";
import { afterAction } from "@/server/effects";

/** Bot: foydalanuvchi nomidan amal bajarish (web ilova bilan bir xil reducer) */
export async function POST(req: Request) {
  if (!isBotRequest(req)) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const { tgId, action } = (await req.json()) as { tgId: number; action: Action };
  if (!tgId || !action?.type) return Response.json({ error: "tgId va action kerak" }, { status: 400 });
  const db = getDB();
  const actor = { type: "user" as const, uid: `tg:${tgId}` };
  const result = applyAction(db, actor, action);
  saveDB();
  void afterAction(db, actor, action, result, { fromBot: true });
  return Response.json({ result, view: userView(db, actor.uid) }, { status: result.ok ? 200 : 422 });
}
