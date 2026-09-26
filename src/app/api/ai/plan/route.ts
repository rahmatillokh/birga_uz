import { applyAction } from "@/lib/core/reducer";
import { userView } from "@/lib/core/views";
import type { Domain, PlanItem } from "@/lib/types";
import { ageOf } from "@/lib/utils";
import { identify } from "@/server/auth";
import { aiEnabled, aiPlan, describeError } from "@/server/ai";
import { parentChildContext } from "@/server/ai-context";
import { getDB, saveDB } from "@/server/db";

/** AI yordamida individual rivojlanish rejasini tuzish (kalit bo‘lmasa — qoidaga asoslangan reja) */
export async function POST(req: Request) {
  const db = getDB();
  const id = identify(req, db);
  if ("error" in id) return Response.json({ error: id.error }, { status: 401 });
  const { childId } = (await req.json()) as { childId: string };
  const actor = { type: "user" as const, uid: id.uid };
  const child = db.children.find((c) => c.id === childId && c.ownerUid === id.uid);
  if (!child) return Response.json({ error: "Bola topilmadi" }, { status: 404 });
  if (!aiEnabled()) {
    applyAction(db, actor, { type: "plan.generate", childId });
    saveDB();
    return Response.json({ ok: true, ai: false, view: userView(db, id.uid) });
  }
  try {
    const ctx = parentChildContext(db, id.uid, childId);
    const out = await aiPlan(ctx.text, ageOf(child.birthDate).years);
    const assigned = new Map(
      db.assignments.filter((a) => a.childId === childId && a.status === "faol" && a.exerciseId).map((a) => [a.exerciseId!, a.specialistId]),
    );
    const res = applyAction(db, actor, {
      type: "plan.set",
      childId,
      plan: {
        source: "ai",
        focus: out.focus as Domain[],
        summary: out.summary,
        goals: out.goals.map((g) => ({ domain: g.domain as Domain, text: g.text, target: Math.round(g.target) })),
        items: out.items.map((i) => ({ ...i, assignedBy: assigned.get(i.exerciseId) }) as PlanItem),
        weeks: 6,
      },
    });
    if (!res.ok) applyAction(db, actor, { type: "plan.generate", childId });
    saveDB();
    return Response.json({ ok: true, ai: res.ok, view: userView(db, id.uid) });
  } catch (e) {
    applyAction(db, actor, { type: "plan.generate", childId });
    saveDB();
    return Response.json({ ok: true, ai: false, error: describeError(e), view: userView(db, id.uid) });
  }
}
