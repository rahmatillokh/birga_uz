import { DOMAINS, DOMAIN_ORDER } from "@/lib/constants";
import { applyAction } from "@/lib/core/reducer";
import { userView } from "@/lib/core/views";
import { identify } from "@/server/auth";
import { aiAssessmentSummary, aiEnabled, describeError } from "@/server/ai";
import { parentChildContext } from "@/server/ai-context";
import { getDB, saveDB } from "@/server/db";

/** Baholash natijasiga AI xulosa va tavsiyalar yozish */
export async function POST(req: Request) {
  const db = getDB();
  const id = identify(req, db);
  if ("error" in id) return Response.json({ error: id.error }, { status: 401 });
  const { assessmentId } = (await req.json()) as { assessmentId: string };
  const a = db.assessments.find((x) => x.id === assessmentId);
  const child = a && db.children.find((c) => c.id === a.childId && c.ownerUid === id.uid);
  if (!a || !child) return Response.json({ error: "Baholash topilmadi" }, { status: 404 });
  if (!aiEnabled()) return Response.json({ ok: true, ai: false, view: userView(db, id.uid) });
  try {
    const ctx = parentChildContext(db, id.uid, child.id);
    const text = DOMAIN_ORDER.map((d) => `${DOMAINS[d].label}: ${a.scores[d]}%`).join("\n") + `\nUmumiy: ${a.overall}%`;
    const out = await aiAssessmentSummary(ctx.text, text);
    applyAction(db, { type: "user", uid: id.uid }, {
      type: "assessment.summary",
      assessmentId,
      summary: out.summary,
      recommendations: out.recommendations,
    });
    saveDB();
    return Response.json({ ok: true, ai: true, view: userView(db, id.uid) });
  } catch (e) {
    return Response.json({ ok: false, ai: true, error: describeError(e), view: userView(db, id.uid) });
  }
}
