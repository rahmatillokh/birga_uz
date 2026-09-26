import { EXERCISES, getExercise } from "@/data/exercises";
import { DOMAINS, DOMAIN_ORDER } from "@/lib/constants";
import type { Assessment, Assignment, Child, Domain, Exercise, Plan, PlanItem } from "@/lib/types";
import { ageOf, weekdayOf } from "@/lib/utils";

const CONCERN_DOMAIN: Record<string, Domain> = {
  "Nutq kechikishi": "nutq",
  "Tovushlarni noto‘g‘ri talaffuz qilish": "nutq",
  "Diqqatni jamlay olmaslik": "kognitiv",
  Giperaktivlik: "kognitiv",
  "Mayda motorika sustligi": "mayda_motorika",
  "Yassi oyoqlik": "yirik_motorika",
  "Muvozanat va koordinatsiya": "yirik_motorika",
  "Muloqotdan qochish": "ijtimoiy",
  "Xulq-atvor qiyinchiliklari": "ijtimoiy",
  "Maktabga tayyorgarlik": "kognitiv",
  "Eshitish muammosi": "nutq",
  "Ko‘rish muammosi": "kognitiv",
};

const DOMAIN_GOAL: Record<Domain, string> = {
  nutq: "Tovushlarni so‘z va gaplarda to‘g‘ri talaffuz qilish, so‘z boyligini kengaytirish",
  kognitiv: "Diqqatni 10–15 daqiqa jamlash, xotira va mantiqiy fikrlashni mustahkamlash",
  mayda_motorika: "Qalam va qaychini to‘g‘ri ushlash, barmoqlar kuchi va aniqligini oshirish",
  yirik_motorika: "Muvozanat va koordinatsiyani yaxshilash, oyoq gumbazini mustahkamlash",
  ijtimoiy: "Navbat bilan o‘ynash, hissiyotlarni so‘z bilan ifodalash",
  mustaqillik: "Kiyinish va gigiyena ko‘nikmalarini mustaqil bajarish",
};

/** Bolaning yoshiga mos, yo‘nalish bo‘yicha mashqlar */
function pick(domain: Domain, age: number, n: number, exclude: Set<string>, preferYassi = false): Exercise[] {
  let pool = EXERCISES.filter(
    (e) => e.domain === domain && age >= e.ageMin - 1 && age <= e.ageMax + 1 && !exclude.has(e.id),
  );
  if (preferYassi) pool = [...pool].sort((a, b) => Number(b.topic === "Yassi oyoqlik") - Number(a.topic === "Yassi oyoqlik"));
  else pool = [...pool].sort((a, b) => a.difficulty - b.difficulty);
  return pool.slice(0, n);
}

export function focusDomains(child: Child, assessment?: Assessment): Domain[] {
  if (assessment) {
    return [...DOMAIN_ORDER].sort((a, b) => assessment.scores[a] - assessment.scores[b]).slice(0, 3);
  }
  const fromConcerns = Array.from(new Set(child.concerns.map((c) => CONCERN_DOMAIN[c]).filter(Boolean)));
  const rest = DOMAIN_ORDER.filter((d) => !fromConcerns.includes(d));
  return [...fromConcerns, ...rest].slice(0, 3);
}

/** Qoidaga asoslangan individual rivojlanish rejasi */
export function generatePlan(
  child: Child,
  assessment: Assessment | undefined,
  assignments: Assignment[] = [],
): Omit<Plan, "id" | "childId" | "createdAt"> {
  const age = ageOf(child.birthDate).years;
  const focus = focusDomains(child, assessment);
  const used = new Set<string>();
  const items: PlanItem[] = [];

  // 1) Mutaxassis topshiriqlari — rejaga birinchi bo‘lib kiradi
  for (const a of assignments.filter((x) => x.status === "faol" && x.exerciseId)) {
    if (!getExercise(a.exerciseId) || used.has(a.exerciseId!)) continue;
    used.add(a.exerciseId!);
    items.push({ exerciseId: a.exerciseId!, frequency: a.frequency, reason: "Mutaxassis topshirig‘i", assignedBy: a.specialistId });
  }

  // 2) Asosiy yo‘nalishlar
  const flat = child.concerns.includes("Yassi oyoqlik");
  focus.forEach((d, i) => {
    const n = i === 2 ? 1 : 2;
    for (const e of pick(d, age, n, used, d === "yirik_motorika" && flat)) {
      used.add(e.id);
      items.push({
        exerciseId: e.id,
        frequency: i === 0 ? "har_kuni" : "haftada_3",
        reason: assessment
          ? `${DOMAINS[d].label}: ${assessment.scores[d]}% — asosiy yo‘nalish`
          : `${DOMAINS[d].label} — ota-ona tashvishi asosida`,
      });
    }
  });

  // 3) Qo‘llab-quvvatlovchi mashqlar (qolgan yo‘nalishlardan bittadan)
  for (const d of DOMAIN_ORDER.filter((x) => !focus.includes(x)).slice(0, 1)) {
    for (const e of pick(d, age, 1, used)) {
      used.add(e.id);
      items.push({ exerciseId: e.id, frequency: "haftada_2", reason: `${DOMAINS[d].label} — mustahkamlash` });
    }
  }

  // Kuniga 15–25 daqiqa: rejada ko‘pi bilan 9 ta mashq
  items.splice(9);

  const goals = focus.map((d) => ({
    domain: d,
    text: DOMAIN_GOAL[d],
    target: Math.min(100, Math.max(60, (assessment?.scores[d] ?? 50) + 15)),
  }));

  const summary = assessment
    ? `Reja ${child.name}ning so‘nggi baholash natijalari asosida tuzildi. Asosiy e’tibor: ${focus
        .map((d) => DOMAINS[d].label.toLowerCase())
        .join(", ")}. Kuniga 15–20 daqiqa, 6 hafta davomida.`
    : `Reja ota-ona ko‘rsatgan tashvishlar asosida tuzildi. Aniqroq reja uchun rivojlanish baholashidan o‘ting.`;

  return { source: "rule", focus, summary, goals, items, weeks: 6 };
}

/** Berilgan kunda rejadagi mashq bajarilishi kerakmi */
export function isScheduled(item: Pick<PlanItem, "frequency">, dayKey: string): boolean {
  const wd = weekdayOf(dayKey);
  if (item.frequency === "har_kuni") return true;
  if (item.frequency === "haftada_3") return wd === 1 || wd === 3 || wd === 5;
  return wd === 2 || wd === 4;
}

export const FREQUENCY_LABEL: Record<PlanItem["frequency"], string> = {
  har_kuni: "Har kuni",
  haftada_3: "Haftada 3 marta",
  haftada_2: "Haftada 2 marta",
};
