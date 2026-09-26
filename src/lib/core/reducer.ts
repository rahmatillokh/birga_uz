import { getExercise } from "@/data/exercises";
import { getProduct } from "@/data/products";
import { getSession } from "@/data/sessions";
import { POINTS } from "@/lib/constants";
import type {
  Action,
  ActResult,
  Activity,
  Actor,
  Assessment,
  Child,
  DB,
  Share,
  User,
} from "@/lib/types";
import { addDays, todayKey, uid } from "@/lib/utils";
import { generatePlan } from "./plan";
import { computeScores, ruleSummary } from "./scoring";
import { badgesFor, latestAssessment } from "./stats";
import { newUser } from "./seed";

function fail(error: string): ActResult {
  return { ok: false, error };
}

export function ensureUser(db: DB, uidValue: string, name = "Ota-ona", extra: Partial<User> = {}): User {
  if (!db.users[uidValue]) db.users[uidValue] = newUser(uidValue, name, extra);
  return db.users[uidValue];
}

function ownChild(db: DB, uidValue: string, childId: string): Child | undefined {
  return db.children.find((c) => c.id === childId && c.ownerUid === uidValue);
}

/** Mutaxassisga ulashilgan (faol, muddati o‘tmagan) bolami */
export function activeShareFor(db: DB, specialistId: string, childId: string): Share | undefined {
  const now = new Date().toISOString();
  return db.shares.find(
    (s) => s.childId === childId && s.specialistId === specialistId && s.active && s.expiresAt > now,
  );
}

function specialistCanAccess(db: DB, specialistId: string, childId: string): boolean {
  if (activeShareFor(db, specialistId, childId)) return true;
  return db.bookings.some((b) => b.childId === childId && b.specialistId === specialistId && b.status !== "bekor");
}

function badgeSnapshot(db: DB, childId: string, ownerUid: string): Set<string> {
  const acts = db.activities.filter((a) => a.childId === childId);
  const as = db.assessments.filter((a) => a.childId === childId);
  const bks = db.bookings.filter((b) => b.uid === ownerUid);
  return new Set(badgesFor(acts, as, bks).filter((b) => b.earned).map((b) => b.id));
}

function refreshPlan(db: DB, child: Child) {
  const a = latestAssessment(db.assessments, child.id);
  const asg = db.assignments.filter((x) => x.childId === child.id);
  const p = generatePlan(child, a, asg);
  const idx = db.plans.findIndex((x) => x.childId === child.id);
  const plan = { id: `plan-${child.id}-${Date.now().toString(36)}`, childId: child.id, createdAt: new Date().toISOString(), ...p };
  if (idx >= 0) db.plans[idx] = plan;
  else db.plans.push(plan);
}

function premiumActive(u: User): boolean {
  return u.premium.plan === "premium" && (!u.premium.until || u.premium.until > new Date().toISOString());
}

/**
 * Yagona o‘zgartirish nuqtasi: web ilova, Telegram bot va mutaxassis kabineti
 * barcha o‘zgarishlarni shu funksiya orqali amalga oshiradi. DB joyida o‘zgartiriladi.
 */
export function applyAction(db: DB, actor: Actor, action: Action): ActResult {
  const nowIso = new Date().toISOString();

  // ------------------------------------------------------------ Mutaxassis harakatlari
  if (action.type.startsWith("sp.")) {
    if (actor.type !== "specialist") return fail("Faqat mutaxassis uchun");
    const spId = actor.id;
    switch (action.type) {
      case "sp.note": {
        if (!specialistCanAccess(db, spId, action.childId)) return fail("Bolaning ma’lumotlariga ruxsat yo‘q");
        const id = uid("n");
        db.notes.push({
          id,
          childId: action.childId,
          specialistId: spId,
          at: nowIso,
          kind: action.kind,
          text: action.text.trim(),
          visibleToParent: action.visibleToParent,
        });
        return { ok: true, createdId: id };
      }
      case "sp.assign": {
        if (!specialistCanAccess(db, spId, action.childId)) return fail("Bolaning ma’lumotlariga ruxsat yo‘q");
        const id = uid("asg");
        db.assignments.push({
          id,
          childId: action.childId,
          specialistId: spId,
          exerciseId: action.exerciseId && getExercise(action.exerciseId) ? action.exerciseId : undefined,
          title: action.title.trim(),
          note: action.note.trim(),
          frequency: action.frequency,
          dueDate: action.dueDate,
          status: "faol",
          createdAt: nowIso,
        });
        const child = db.children.find((c) => c.id === action.childId);
        if (child) refreshPlan(db, child);
        return { ok: true, createdId: id };
      }
      case "sp.assignment.status": {
        const a = db.assignments.find((x) => x.id === action.assignmentId && x.specialistId === spId);
        if (!a) return fail("Topshiriq topilmadi");
        a.status = action.status;
        return { ok: true };
      }
      case "sp.booking.status": {
        const b = db.bookings.find((x) => x.id === action.bookingId && x.specialistId === spId);
        if (!b) return fail("Yozilish topilmadi");
        b.status = action.status;
        return { ok: true };
      }
    }
    return fail("Noma’lum amal");
  }

  if (actor.type !== "user") return fail("Foydalanuvchi aniqlanmadi");
  const user = ensureUser(db, actor.uid);

  switch (action.type) {
    case "user.update": {
      Object.assign(user, action.patch);
      return { ok: true };
    }
    case "user.consents": {
      user.consents = { ...user.consents, ...action.consents };
      return { ok: true };
    }
    case "user.reminders": {
      user.reminders = {
        ...user.reminders,
        ...action.reminders,
        types: { ...user.reminders.types, ...(action.reminders.types ?? {}) },
      };
      return { ok: true };
    }
    case "user.sessionAlerts": {
      user.sessionAlerts = action.enabled;
      return { ok: true };
    }
    case "user.premium": {
      if (action.plan === "free") {
        user.premium = { plan: "free" };
      } else {
        const days = action.trial ? 7 : action.period === "year" ? 365 : 30;
        user.premium = {
          plan: "premium",
          trial: !!action.trial,
          period: action.trial ? undefined : action.period ?? "month",
          until: new Date(Date.now() + days * 86_400_000).toISOString(),
          consultationsLeft: action.trial ? 0 : 1,
        };
      }
      return { ok: true };
    }

    // ---------------------------------------------------------- Bola profili
    case "child.create": {
      const c = action.child;
      if (!c.name?.trim()) return fail("Ism kiritilmagan");
      const id = uid("ch");
      const child: Child = {
        id,
        ownerUid: user.uid,
        name: c.name.trim(),
        birthDate: c.birthDate,
        gender: c.gender,
        avatar: c.avatar ?? (c.gender === "qiz" ? "👧" : "👦"),
        region: c.region ?? user.region,
        district: c.district ?? user.district,
        concerns: c.concerns ?? [],
        diagnoses: c.diagnoses ?? [],
        interests: c.interests ?? [],
        strengths: c.strengths ?? [],
        needs: c.needs ?? [],
        goals: [],
        observations: [],
        history: [
          { id: uid("h"), date: c.birthDate, title: "Tug‘ildi", type: "milestone" },
          { id: uid("h"), date: todayKey(), title: "YuniQo’da profil yaratildi", type: "milestone" },
        ],
        createdAt: nowIso,
      };
      db.children.push(child);
      user.activeChildId = id;
      if (!user.region && c.region) user.region = c.region;
      if (!user.district && c.district) user.district = c.district;
      refreshPlan(db, child);
      return { ok: true, createdId: id };
    }
    case "child.update": {
      const child = ownChild(db, user.uid, action.childId);
      if (!child) return fail("Bola topilmadi");
      Object.assign(child, action.patch);
      return { ok: true };
    }
    case "child.delete": {
      const child = ownChild(db, user.uid, action.childId);
      if (!child) return fail("Bola topilmadi");
      db.children = db.children.filter((c) => c.id !== child.id);
      db.activities = db.activities.filter((a) => a.childId !== child.id);
      db.assessments = db.assessments.filter((a) => a.childId !== child.id);
      db.plans = db.plans.filter((p) => p.childId !== child.id);
      db.shares = db.shares.filter((s) => s.childId !== child.id);
      if (user.activeChildId === child.id) user.activeChildId = db.children.find((c) => c.ownerUid === user.uid)?.id;
      return { ok: true };
    }
    case "child.select": {
      if (!ownChild(db, user.uid, action.childId)) return fail("Bola topilmadi");
      user.activeChildId = action.childId;
      return { ok: true };
    }
    case "child.observation": {
      const child = ownChild(db, user.uid, action.childId);
      if (!child) return fail("Bola topilmadi");
      const id = uid("o");
      child.observations.unshift({ id, at: nowIso, text: action.text.trim(), mood: action.mood });
      return { ok: true, createdId: id };
    }
    case "child.goal.add": {
      const child = ownChild(db, user.uid, action.childId);
      if (!child) return fail("Bola topilmadi");
      const id = uid("g");
      child.goals.push({ id, text: action.text.trim(), domain: action.domain, done: false, createdAt: nowIso });
      return { ok: true, createdId: id };
    }
    case "child.goal.toggle": {
      const child = ownChild(db, user.uid, action.childId);
      const goal = child?.goals.find((g) => g.id === action.goalId);
      if (!child || !goal) return fail("Maqsad topilmadi");
      goal.done = !goal.done;
      if (goal.done) {
        child.history.push({ id: uid("h"), date: todayKey(), title: `Maqsadga erishildi: ${goal.text}`, type: "achievement" });
      }
      return { ok: true };
    }
    case "child.goal.remove": {
      const child = ownChild(db, user.uid, action.childId);
      if (!child) return fail("Bola topilmadi");
      child.goals = child.goals.filter((g) => g.id !== action.goalId);
      return { ok: true };
    }

    // ---------------------------------------------------------- Baholash va reja
    case "assessment.submit": {
      const child = ownChild(db, user.uid, action.childId);
      if (!child) return fail("Bola topilmadi");
      const before = badgeSnapshot(db, child.id, user.uid);
      const prev = latestAssessment(db.assessments, child.id);
      const { scores, overall } = computeScores(action.band, action.answers);
      const { summary, recommendations } = ruleSummary(child, scores, prev?.scores);
      const a: Assessment = {
        id: uid("as"),
        childId: child.id,
        at: nowIso,
        band: action.band,
        answers: action.answers,
        scores,
        overall,
        source: action.source ?? "web",
        summary,
        recommendations,
      };
      db.assessments.push(a);
      db.activities.push({
        id: uid("act"),
        childId: child.id,
        at: nowIso,
        kind: "assessment",
        refId: a.id,
        title: prev ? "Qayta baholash" : "Rivojlanish baholashi",
        domain: "kognitiv",
        score: overall,
        points: POINTS.assessment,
      });
      child.history.push({
        id: uid("h"),
        date: todayKey(),
        title: prev ? `Qayta baholash: umumiy ${overall - prev.overall >= 0 ? "+" : ""}${overall - prev.overall} ball` : "Birinchi rivojlanish baholashi",
        type: "assessment",
      });
      refreshPlan(db, child);
      const after = badgeSnapshot(db, child.id, user.uid);
      return { ok: true, createdId: a.id, pointsEarned: POINTS.assessment, newBadges: [...after].filter((b) => !before.has(b)) };
    }
    case "assessment.summary": {
      const a = db.assessments.find((x) => x.id === action.assessmentId);
      if (!a || !ownChild(db, user.uid, a.childId)) return fail("Baholash topilmadi");
      a.summary = action.summary;
      a.recommendations = action.recommendations;
      a.aiGenerated = true;
      return { ok: true };
    }
    case "plan.generate": {
      const child = ownChild(db, user.uid, action.childId);
      if (!child) return fail("Bola topilmadi");
      refreshPlan(db, child);
      return { ok: true };
    }
    case "plan.set": {
      const child = ownChild(db, user.uid, action.childId);
      if (!child) return fail("Bola topilmadi");
      const items = action.plan.items.filter((i) => getExercise(i.exerciseId));
      if (!items.length) return fail("Reja bo‘sh");
      const idx = db.plans.findIndex((x) => x.childId === child.id);
      const plan = { ...action.plan, items, id: uid("plan"), childId: child.id, createdAt: nowIso };
      if (idx >= 0) db.plans[idx] = plan;
      else db.plans.push(plan);
      return { ok: true, createdId: plan.id };
    }

    // ---------------------------------------------------------- Faoliyat (mashq, o‘yin, video, AI)
    case "activity.log": {
      const child = ownChild(db, user.uid, action.childId);
      if (!child) return fail("Bola topilmadi");
      const before = badgeSnapshot(db, child.id, user.uid);
      let points = POINTS[action.kind] ?? 5;
      if (action.kind === "game" && typeof action.score === "number") points += Math.round(action.score / 20);
      if (action.assignmentId) points += 5;
      const act: Activity = {
        id: uid("act"),
        childId: child.id,
        at: nowIso,
        kind: action.kind,
        refId: action.refId,
        title: action.title,
        domain: action.domain,
        score: typeof action.score === "number" ? Math.round(action.score) : undefined,
        durationSec: action.durationSec,
        points,
        feeling: action.feeling,
        assignmentId: action.assignmentId,
        details: action.details,
      };
      db.activities.push(act);
      const after = badgeSnapshot(db, child.id, user.uid);
      const newBadges = [...after].filter((b) => !before.has(b));
      return { ok: true, createdId: act.id, pointsEarned: points, newBadges };
    }

    // ---------------------------------------------------------- Yozilishlar
    case "booking.create": {
      if (action.childId && !ownChild(db, user.uid, action.childId)) return fail("Bola topilmadi");
      if (action.kind === "session") {
        const s = action.sessionId ? getSession(action.sessionId) : undefined;
        if (!s) return fail("Sessiya topilmadi");
        if (db.bookings.some((b) => b.uid === user.uid && b.sessionId === s.id && b.status !== "bekor")) {
          return fail("Siz bu sessiyaga allaqachon yozilgansiz");
        }
        const extra = db.sessionBookings[s.id] ?? 0;
        if (s.booked + extra >= s.capacity) return fail("Afsuski, bo‘sh joy qolmadi");
        db.sessionBookings[s.id] = extra + 1;
        const id = uid("bk");
        db.bookings.push({
          id,
          uid: user.uid,
          childId: action.childId,
          kind: "session",
          sessionId: s.id,
          mode: "offline",
          date: s.date,
          time: s.time,
          status: "tasdiqlandi",
          note: action.note,
          createdAt: nowIso,
          source: action.source ?? "web",
        });
        return { ok: true, createdId: id };
      }
      if (!action.specialistId) return fail("Mutaxassis tanlanmagan");
      const clash = db.bookings.some(
        (b) => b.specialistId === action.specialistId && b.date === action.date && b.time === action.time && b.status !== "bekor",
      );
      if (clash) return fail("Bu vaqt band. Boshqa vaqtni tanlang");
      const usePremium = premiumActive(user) && (user.premium.consultationsLeft ?? 0) > 0;
      if (usePremium) user.premium.consultationsLeft = (user.premium.consultationsLeft ?? 1) - 1;
      const id = uid("bk");
      db.bookings.push({
        id,
        uid: user.uid,
        childId: action.childId,
        kind: "consultation",
        specialistId: action.specialistId,
        mode: action.mode,
        date: action.date,
        time: action.time,
        status: "kutilmoqda",
        note: action.note,
        premium: usePremium,
        createdAt: nowIso,
        source: action.source ?? "web",
      });
      // Konsultatsiyaga yozilganda — bola natijalarini mutaxassisga avtomatik ulashish (rozilik bo‘lsa)
      if (action.childId && user.consents.shareWithSpecialists && !activeShareFor(db, action.specialistId, action.childId)) {
        db.shares.push({
          id: uid("sh"),
          token: uid("t").replace(/-/g, ""),
          childId: action.childId,
          uid: user.uid,
          specialistId: action.specialistId,
          createdAt: nowIso,
          expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
          scopes: ["baholash", "mashqlar", "ai"],
          views: 0,
          active: true,
        });
      }
      return { ok: true, createdId: id };
    }
    case "booking.cancel": {
      const b = db.bookings.find((x) => x.id === action.bookingId && x.uid === user.uid);
      if (!b) return fail("Yozilish topilmadi");
      if (b.status === "bekor") return { ok: true };
      b.status = "bekor";
      if (b.sessionId && db.sessionBookings[b.sessionId]) db.sessionBookings[b.sessionId]--;
      if (b.premium) user.premium.consultationsLeft = (user.premium.consultationsLeft ?? 0) + 1;
      return { ok: true };
    }

    // ---------------------------------------------------------- Ulashish
    case "share.create": {
      const child = ownChild(db, user.uid, action.childId);
      if (!child) return fail("Bola topilmadi");
      if (!action.scopes.length) return fail("Kamida bitta bo‘limni tanlang");
      const token = Math.random().toString(36).slice(2, 7) + Math.random().toString(36).slice(2, 7);
      db.shares.push({
        id: uid("sh"),
        token,
        childId: child.id,
        uid: user.uid,
        specialistId: action.specialistId,
        createdAt: nowIso,
        expiresAt: new Date(Date.now() + Math.max(1, action.days) * 86_400_000).toISOString(),
        scopes: action.scopes,
        views: 0,
        active: true,
      });
      return { ok: true, createdId: token };
    }
    case "share.revoke": {
      const s = db.shares.find((x) => x.id === action.shareId && x.uid === user.uid);
      if (!s) return fail("Topilmadi");
      s.active = false;
      return { ok: true };
    }

    // ---------------------------------------------------------- Market
    case "order.create": {
      if (!action.items.length) return fail("Savat bo‘sh");
      const items = action.items
        .map((i) => ({ ...i, price: getProduct(i.productId)?.price ?? i.price }))
        .filter((i) => i.qty > 0);
      const total = items.reduce((s, i) => s + i.price * i.qty, 0);
      const id = `or-${Math.floor(1000 + Math.random() * 9000)}`;
      db.orders.push({
        id,
        uid: user.uid,
        items,
        total,
        address: action.address,
        phone: action.phone,
        payment: action.payment,
        status: "qabul_qilindi",
        createdAt: nowIso,
      });
      return { ok: true, createdId: id };
    }

    // ---------------------------------------------------------- Hamjamiyat
    case "post.create": {
      if (!action.text.trim()) return fail("Matn bo‘sh");
      const id = uid("post");
      db.posts.unshift({
        id,
        groupId: action.groupId,
        author: user.consents.community ? user.name : "Anonim ota-ona",
        authorUid: user.uid,
        role: "ota-ona",
        at: nowIso,
        title: action.title.trim(),
        text: action.text.trim(),
        tags: action.tags ?? [],
        likes: 0,
        answers: [],
        kind: action.kind,
      });
      return { ok: true, createdId: id };
    }
    case "post.like": {
      db.postLikes[action.postId] = (db.postLikes[action.postId] ?? 0) + 1;
      return { ok: true };
    }
    case "post.answer": {
      if (!action.text.trim()) return fail("Matn bo‘sh");
      const post = db.posts.find((p) => p.id === action.postId);
      const answer = {
        id: uid("ans"),
        author: user.consents.community ? user.name : "Anonim ota-ona",
        role: "ota-ona" as const,
        text: action.text.trim(),
        at: nowIso,
        likes: 0,
      };
      if (post) {
        post.answers.push(answer);
      } else {
        // seed postlarga javoblar alohida saqlanadi
        db.posts.push({
          id: `reply-${action.postId}-${answer.id}`,
          groupId: "__reply__",
          author: answer.author,
          authorUid: user.uid,
          role: "ota-ona",
          at: nowIso,
          title: action.postId,
          text: answer.text,
          tags: [],
          likes: 0,
          answers: [],
          kind: "savol",
        });
      }
      return { ok: true };
    }
  }
  return fail("Noma’lum amal");
}

/** Qayta baholash vaqti keldimi (oxirgi baholashdan 30+ kun) */
export function reassessmentDue(db: DB, childId: string): boolean {
  const a = latestAssessment(db.assessments, childId);
  if (!a) return true;
  return a.at.slice(0, 10) <= addDays(todayKey(), -30);
}
