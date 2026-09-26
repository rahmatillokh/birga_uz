"use client";

import { useMemo } from "react";
import { badgesFor, firstAssessment, latestAssessment, levelFor, streakOf, totalPoints } from "@/lib/core/stats";
import type { UserView } from "@/lib/types";
import { useApp } from "./store";

const EMPTY: UserView = {
  user: {
    uid: "",
    name: "",
    createdAt: "",
    premium: { plan: "free" },
    reminders: { enabled: false, time: "18:30", days: [], types: { daily: true, specialist: true, reassessment: true, sessions: true } },
    consents: { dataProcessing: true, videoAnalysis: true, audioAnalysis: true, shareWithSpecialists: true, specialistExchange: true, community: true },
    sessionAlerts: true,
    onboarded: false,
  },
  children: [],
  assessments: [],
  activities: [],
  plans: [],
  bookings: [],
  assignments: [],
  notes: [],
  shares: [],
  orders: [],
  posts: [],
  postLikes: {},
  sessionBookings: {},
};

/** Ota-ona ma’lumotlari (AppGate ichida har doim mavjud) */
export function useView(): UserView {
  return useApp((s) => s.view) ?? EMPTY;
}

export function useIsPremium(): boolean {
  const p = useView().user.premium;
  return p.plan === "premium" && (!p.until || p.until > new Date().toISOString());
}

export function useActiveChild() {
  const view = useView();
  return view.children.find((c) => c.id === view.user.activeChildId) ?? view.children[0];
}

/** Faol bola bo‘yicha barcha ma’lumotlar va hisoblangan ko‘rsatkichlar */
export function useChildData(childId?: string) {
  const view = useView();
  const active = useActiveChild();
  const child = childId ? view.children.find((c) => c.id === childId) : active;
  return useMemo(() => {
    const id = child?.id ?? "";
    const activities = view.activities.filter((a) => a.childId === id);
    const assessments = view.assessments.filter((a) => a.childId === id).sort((a, b) => a.at.localeCompare(b.at));
    const plan = view.plans.find((p) => p.childId === id);
    const assignments = view.assignments.filter((a) => a.childId === id);
    const notes = view.notes.filter((n) => n.childId === id).sort((a, b) => b.at.localeCompare(a.at));
    const bookings = view.bookings.filter((b) => !b.childId || b.childId === id);
    const points = totalPoints(activities);
    return {
      child,
      activities,
      assessments,
      latest: latestAssessment(assessments, id),
      first: firstAssessment(assessments, id),
      plan,
      assignments,
      notes,
      bookings,
      shares: view.shares.filter((s) => s.childId === id),
      points,
      level: levelFor(points),
      streak: streakOf(activities),
      badges: badgesFor(activities, assessments, view.bookings),
    };
  }, [child, view]);
}
