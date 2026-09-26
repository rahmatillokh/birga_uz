import { DEMO_SPECIALIST_ID } from "@/lib/constants";
import { applyAction } from "@/lib/core/reducer";
import { specialistView, userView } from "@/lib/core/views";
import type { Action, Actor } from "@/lib/types";
import { identify } from "@/server/auth";
import { getDB, saveDB } from "@/server/db";
import { afterAction } from "@/server/effects";

export async function POST(req: Request) {
  const db = getDB();
  let body: { action?: Action; as?: { type: "specialist"; id?: string } };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Noto‘g‘ri so‘rov" }, { status: 400 });
  }
  if (!body.action?.type) return Response.json({ error: "Amal ko‘rsatilmagan" }, { status: 400 });

  let actor: Actor;
  if (body.as?.type === "specialist") {
    // Demo: mutaxassis kabineti (keyingi bosqichda — mutaxassis autentifikatsiyasi)
    actor = { type: "specialist", id: body.as.id || DEMO_SPECIALIST_ID };
  } else {
    const id = identify(req, db);
    if ("error" in id) return Response.json({ error: id.error }, { status: 401 });
    actor = { type: "user", uid: id.uid };
  }

  const result = applyAction(db, actor, body.action);
  saveDB();
  void afterAction(db, actor, body.action, result);
  const view = actor.type === "user" ? userView(db, actor.uid) : undefined;
  const spView = actor.type === "specialist" ? specialistView(db, actor.id) : undefined;
  return Response.json({ result, view, spView }, { status: result.ok ? 200 : 422 });
}
