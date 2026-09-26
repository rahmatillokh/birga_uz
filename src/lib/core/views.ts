import type { DB, Share, SpecialistPatient, SpecialistView, UserView } from "@/lib/types";
import { activeShareFor, ensureUser } from "./reducer";

/** Ota-ona ko‘radigan ma’lumotlar */
export function userView(db: DB, uidValue: string): UserView {
  const user = ensureUser(db, uidValue);
  // Premium (sinov emas): har oy 1 ta bepul konsultatsiya
  const month = new Date().toISOString().slice(0, 7);
  const p = user.premium;
  if (p.plan === "premium" && !p.trial && (!p.until || p.until > new Date().toISOString()) && p.consultationsMonth !== month) {
    if (p.consultationsMonth) p.consultationsLeft = 1;
    p.consultationsMonth = month;
  }
  const children = db.children.filter((c) => c.ownerUid === uidValue);
  const ids = new Set(children.map((c) => c.id));
  if (user.activeChildId && !ids.has(user.activeChildId)) user.activeChildId = children[0]?.id;
  if (!user.activeChildId && children[0]) user.activeChildId = children[0].id;
  return {
    user,
    children,
    assessments: db.assessments.filter((a) => ids.has(a.childId)),
    activities: db.activities.filter((a) => ids.has(a.childId)),
    plans: db.plans.filter((p) => ids.has(p.childId)),
    bookings: db.bookings.filter((b) => b.uid === uidValue),
    assignments: db.assignments.filter((a) => ids.has(a.childId)),
    notes: db.notes.filter((n) => ids.has(n.childId) && n.visibleToParent),
    shares: db.shares.filter((s) => s.uid === uidValue),
    orders: db.orders.filter((o) => o.uid === uidValue),
    posts: db.posts,
    postLikes: db.postLikes,
    sessionBookings: db.sessionBookings,
  };
}

/** Ulashish doirasiga (scopes) qarab bola ma’lumotlari */
export function patientData(db: DB, childId: string, share?: Share, forSpecialist?: string): SpecialistPatient | undefined {
  const child = db.children.find((c) => c.id === childId);
  if (!child) return undefined;
  const scopes = new Set(share?.scopes ?? []);
  const parent = db.users[child.ownerUid];
  const exchangeAllowed = parent?.consents.specialistExchange !== false;
  return {
    child: scopes.has("kuzatuvlar") ? child : { ...child, observations: [] },
    parentName: parent?.name ?? "Ota-ona",
    assessments: scopes.has("baholash") ? db.assessments.filter((a) => a.childId === childId) : [],
    activities: scopes.has("mashqlar") || scopes.has("ai")
      ? db.activities.filter(
          (a) =>
            a.childId === childId &&
            ((scopes.has("mashqlar") && a.kind !== "ai_check" && a.kind !== "speech") ||
              (scopes.has("ai") && (a.kind === "ai_check" || a.kind === "speech"))),
        )
      : [],
    plan: db.plans.find((p) => p.childId === childId),
    assignments: db.assignments.filter((a) => a.childId === childId),
    notes: scopes.has("mutaxassis")
      ? db.notes.filter(
          (n) =>
            n.childId === childId &&
            (n.specialistId === forSpecialist || n.visibleToParent || (n.kind === "hamkasb" && exchangeAllowed)),
        )
      : db.notes.filter((n) => n.childId === childId && n.specialistId === forSpecialist),
    share,
    bookings: db.bookings.filter((b) => b.childId === childId && (!forSpecialist || b.specialistId === forSpecialist)),
  };
}

/** Mutaxassis kabineti */
export function specialistView(db: DB, specialistId: string): SpecialistView {
  const childIds = new Set<string>();
  for (const s of db.shares) {
    if (s.specialistId === specialistId && activeShareFor(db, specialistId, s.childId)) childIds.add(s.childId);
  }
  for (const b of db.bookings) {
    if (b.specialistId === specialistId && b.childId && b.status !== "bekor") childIds.add(b.childId);
  }
  const patients = Array.from(childIds)
    .map((id) => patientData(db, id, activeShareFor(db, specialistId, id), specialistId))
    .filter(Boolean) as SpecialistPatient[];
  const bookings = db.bookings
    .filter((b) => b.specialistId === specialistId)
    .map((b) => ({
      ...b,
      parentName: db.users[b.uid]?.name ?? "Ota-ona",
      childName: db.children.find((c) => c.id === b.childId)?.name,
    }))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return { specialistId, patients, bookings };
}

/** Ulashilgan havola orqali hisobot (mutaxassis login qilmasdan ko‘radi) */
export function sharedReport(db: DB, token: string): { ok: true; data: SpecialistPatient } | { ok: false; error: string } {
  const share = db.shares.find((s) => s.token === token);
  if (!share) return { ok: false, error: "Havola topilmadi" };
  if (!share.active) return { ok: false, error: "Ota-ona bu havolani bekor qilgan" };
  if (share.expiresAt < new Date().toISOString()) return { ok: false, error: "Havolaning amal qilish muddati tugagan" };
  share.views++;
  const data = patientData(db, share.childId, share, share.specialistId);
  if (!data) return { ok: false, error: "Ma’lumot topilmadi" };
  return { ok: true, data };
}
