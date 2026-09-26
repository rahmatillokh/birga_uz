import { templateExercise } from "@/lib/ai/exercise-templates";
import { DOMAIN_ORDER } from "@/lib/constants";
import { latestAssessment } from "@/lib/core/stats";
import type { Domain } from "@/lib/types";
import { identify } from "@/server/auth";
import { aiEnabled, aiExercise, describeError } from "@/server/ai";
import { parentChildContext } from "@/server/ai-context";
import { getDB } from "@/server/db";

/** AI individual mashq: bolaning qiziqishlari va eng zaif yo‘nalishiga moslab yangi mashq tuzadi */
export async function POST(req: Request) {
  const db = getDB();
  const id = identify(req, db);
  if ("error" in id) return Response.json({ error: id.error }, { status: 401 });
  const body = (await req.json()) as { childId?: string; domain?: Domain };
  const ctx = parentChildContext(db, id.uid, body.childId);
  const child = ctx.child;
  if (!child) return Response.json({ error: "Bola topilmadi" }, { status: 404 });
  const last = latestAssessment(db.assessments.filter((a) => a.childId === child.id), child.id);
  const domain: Domain =
    body.domain && DOMAIN_ORDER.includes(body.domain) ? body.domain : last ? [...DOMAIN_ORDER].sort((a, b) => last.scores[a] - last.scores[b])[0] : "nutq";
  if (!aiEnabled()) {
    return Response.json({ exercise: templateExercise(domain, child.interests, child.name), ai: false });
  }
  try {
    const ex = await aiExercise(ctx.text, domain);
    return Response.json({ exercise: { ...ex, domain: ex.domain as Domain, durationMin: Math.round(ex.durationMin) }, ai: true });
  } catch (e) {
    return Response.json({ exercise: templateExercise(domain, child.interests, child.name), ai: false, error: describeError(e) });
  }
}
