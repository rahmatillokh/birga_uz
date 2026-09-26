import { getExercise } from "@/data/exercises";
import { getSpecialist } from "@/data/specialists";
import { DOMAINS, DOMAIN_ORDER, SPECIALTIES } from "@/lib/constants";
import { firstAssessment, latestAssessment, streakOf, weeklySeries } from "@/lib/core/stats";
import type { Activity, Assessment, Assignment, Child, Plan, SpecialistNote } from "@/lib/types";
import { ageOf, dayKey, formatDate } from "@/lib/utils";

export interface ChildContextInput {
  child: Child;
  assessments: Assessment[];
  activities: Activity[];
  plan?: Plan;
  assignments: Assignment[];
  notes: SpecialistNote[];
}

/** AI uchun bolaning qisqa profili (matn ko‘rinishida) */
export function childContext({ child, assessments, activities, plan, assignments, notes }: ChildContextInput): string {
  const age = ageOf(child.birthDate);
  const last = latestAssessment(assessments, child.id);
  const first = firstAssessment(assessments, child.id);
  const acts = activities.filter((a) => a.childId === child.id);
  const streak = streakOf(acts);
  const weeks = weeklySeries(acts, 4);
  const lines: string[] = [];
  lines.push(`Bola: ${child.name}, ${child.gender}, ${age.label}.`);
  if (child.concerns.length) lines.push(`Ota-ona tashvishlari: ${child.concerns.join(", ")}.`);
  if (child.diagnoses.length) lines.push(`Ota-ona kiritgan tashxis/xulosalar: ${child.diagnoses.join("; ")}.`);
  if (child.interests.length) lines.push(`Qiziqishlari: ${child.interests.join(", ")}.`);
  if (child.strengths.length) lines.push(`Kuchli tomonlari: ${child.strengths.join(", ")}.`);
  if (child.needs.length) lines.push(`Rivojlantirish kerak: ${child.needs.join(", ")}.`);
  if (last) {
    lines.push(
      `So‘nggi baholash (${formatDate(last.at, { year: true })}): ` +
        DOMAIN_ORDER.map((d) => `${DOMAINS[d].label} ${last.scores[d]}%`).join(", ") +
        `; umumiy ${last.overall}%.`,
    );
    if (first && first.id !== last.id) {
      lines.push(
        `Birinchi baholashga nisbatan o‘zgarish: ` +
          DOMAIN_ORDER.map((d) => `${DOMAINS[d].label} ${last.scores[d] - first.scores[d] >= 0 ? "+" : ""}${last.scores[d] - first.scores[d]}`).join(", ") +
          ".",
      );
    }
  } else {
    lines.push("Hali rivojlanish baholashidan o‘tmagan.");
  }
  if (plan) {
    const items = plan.items
      .map((i) => getExercise(i.exerciseId))
      .filter(Boolean)
      .map((e) => `${e!.title} (${DOMAINS[e!.domain].label})`);
    lines.push(`Joriy reja (${plan.weeks} hafta): ${items.join(", ")}.`);
  }
  const activeAsg = assignments.filter((a) => a.childId === child.id && a.status === "faol");
  if (activeAsg.length) {
    lines.push(
      `Mutaxassis topshiriqlari: ${activeAsg
        .map((a) => `${a.title} (${getSpecialist(a.specialistId)?.name ?? "mutaxassis"})`)
        .join("; ")}.`,
    );
  }
  const recentNotes = notes.filter((n) => n.childId === child.id).slice(-3);
  for (const n of recentNotes) {
    const sp = getSpecialist(n.specialistId);
    lines.push(`Mutaxassis izohi — ${sp?.name ?? ""} (${sp ? SPECIALTIES[sp.specialty].label : ""}): ${n.text}`);
  }
  lines.push(
    `Faollik: ketma-ket ${streak.current} kun; oxirgi 4 hafta mashg‘ulotlari soni: ${weeks.map((w) => w.count).join(", ")}; o‘rtacha natijalar: ${weeks
      .map((w) => w.avgScore || "-")
      .join(", ")}.`,
  );
  const today = dayKey(new Date());
  const todays = acts.filter((a) => dayKey(a.at) === today);
  if (todays.length) lines.push(`Bugun bajarilgan: ${todays.map((a) => a.title).join(", ")}.`);
  const obs = child.observations.slice(0, 3);
  if (obs.length) lines.push(`Ota-ona kuzatuvlari: ${obs.map((o) => `«${o.text}»`).join(" ")}`);
  return lines.join("\n");
}
