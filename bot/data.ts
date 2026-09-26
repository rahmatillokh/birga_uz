import { REGIONS } from "@/data/regions";
import { getSession, sessionsForDistrict } from "@/data/sessions";
import type { Child, FreeSession, UserView } from "@/lib/types";
import { ageOf, todayKey } from "@/lib/utils";
import { nowHHMM } from "./ui";

/** UserView ustidagi yordamchi hisob-kitoblar (bot faqat o‘qiydi) */

export function activeChild(view: UserView): Child | undefined {
  return view.children.find((c) => c.id === view.user.activeChildId) ?? view.children[0];
}

export function childData(view: UserView, childId: string) {
  const activities = view.activities.filter((a) => a.childId === childId);
  const assessments = view.assessments
    .filter((a) => a.childId === childId)
    .sort((a, b) => a.at.localeCompare(b.at));
  const plan = view.plans.find((p) => p.childId === childId);
  const assignments = view.assignments.filter((a) => a.childId === childId);
  return {
    activities,
    assessments,
    first: assessments[0],
    latest: assessments[assessments.length - 1],
    previous: assessments.length > 1 ? assessments[assessments.length - 2] : undefined,
    plan,
    assignments,
  };
}

export function ageText(child: Child): string {
  return ageOf(child.birthDate).label;
}

export function isPremium(view: UserView): boolean {
  const p = view.user.premium;
  return p.plan === "premium" && (!p.until || p.until > new Date().toISOString());
}

export function regionIndex(id?: string): number {
  return REGIONS.findIndex((r) => r.id === id);
}

export function districtIndex(regionId?: string, district?: string): number {
  const r = REGIONS.find((x) => x.id === regionId);
  return r && district ? r.districts.indexOf(district) : -1;
}

/**
 * Sessiyani id bo‘yicha topish — ro‘yxatda ko‘rsatilgan ma’lumot bilan bir xil bo‘lishi uchun
 * avval bugundan boshlangan generatsiyadan qidiramiz, topilmasa getSession().
 */
export function findSession(id: string): FreeSession | undefined {
  const m = /^ses_(.+)_(\d+)_(\d{4}-\d{2}-\d{2})_(\d)$/.exec(id);
  if (!m) return undefined;
  const region = REGIONS.find((r) => r.id === m[1]);
  const district = region?.districts[Number(m[2])];
  if (region && district) {
    const hit = sessionsForDistrict(region.id, district, todayKey()).find((s) => s.id === id);
    if (hit) return hit;
  }
  return getSession(id);
}

/** Tumandagi kelgusi sessiyalar (bugun vaqti o‘tganlari chiqarib tashlanadi) */
export function upcomingSessions(regionId: string, district: string): FreeSession[] {
  const today = todayKey();
  const now = nowHHMM();
  return sessionsForDistrict(regionId, district, today)
    .filter((s) => s.date > today || (s.date === today && s.time > now))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export function freeSeats(s: FreeSession, view?: UserView): number {
  return Math.max(0, s.capacity - s.booked - (view?.sessionBookings?.[s.id] ?? 0));
}
