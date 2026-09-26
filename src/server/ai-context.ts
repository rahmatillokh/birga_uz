import { childContext } from "@/lib/ai/context";
import { patientData } from "@/lib/core/views";
import { activeShareFor } from "@/lib/core/reducer";
import type { DB } from "@/lib/types";

/** Ota-ona uchun: o‘z bolasining konteksti */
export function parentChildContext(db: DB, uid: string, childId?: string) {
  const user = db.users[uid];
  const child =
    db.children.find((c) => c.id === childId && c.ownerUid === uid) ??
    db.children.find((c) => c.id === user?.activeChildId && c.ownerUid === uid) ??
    db.children.find((c) => c.ownerUid === uid);
  if (!child) return { child: undefined, text: "" };
  const text = childContext({
    child,
    assessments: db.assessments.filter((a) => a.childId === child.id),
    activities: db.activities.filter((a) => a.childId === child.id),
    plan: db.plans.find((p) => p.childId === child.id),
    assignments: db.assignments.filter((a) => a.childId === child.id),
    notes: db.notes.filter((n) => n.childId === child.id && n.visibleToParent),
  });
  return { child, text };
}

/** Mutaxassis uchun: ulashilgan ma’lumotlar doirasida kontekst */
export function specialistChildContext(db: DB, specialistId: string, childId: string) {
  const p = patientData(db, childId, activeShareFor(db, specialistId, childId), specialistId);
  if (!p) return { child: undefined, text: "" };
  const text = childContext({
    child: p.child,
    assessments: p.assessments,
    activities: p.activities,
    plan: p.plan,
    assignments: p.assignments,
    notes: p.notes,
  });
  return { child: p.child, text: `Ota-ona: ${p.parentName}\n${text}` };
}
