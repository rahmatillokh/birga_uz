import { questionsFor } from "@/data/assessment";
import { DOMAINS, DOMAIN_ORDER, SPECIALTIES } from "@/lib/constants";
import type { AgeBand, AnswerValue, Child, Domain, Scores, SpecialtyId } from "@/lib/types";

export function emptyScores(v = 0): Scores {
  return { nutq: v, kognitiv: v, mayda_motorika: v, yirik_motorika: v, ijtimoiy: v, mustaqillik: v };
}

/** Javoblardan yo‘nalishlar bo‘yicha ball (0..100) */
export function computeScores(band: AgeBand, answers: Record<string, AnswerValue>): { scores: Scores; overall: number } {
  const qs = questionsFor(band);
  const scores = emptyScores();
  for (const d of DOMAIN_ORDER) {
    const dq = qs.filter((q) => q.domain === d);
    if (!dq.length) continue;
    const sum = dq.reduce((s, q) => s + (answers[q.id] ?? 0), 0);
    scores[d] = Math.round((sum / (dq.length * 2)) * 100);
  }
  const overall = Math.round(DOMAIN_ORDER.reduce((s, d) => s + scores[d], 0) / DOMAIN_ORDER.length);
  return { scores, overall };
}

/** Maqsadli ballarga yaqin javoblar to‘plami (seed/demo uchun) */
export function answersForTargets(band: AgeBand, targets: Scores): Record<string, AnswerValue> {
  const qs = questionsFor(band);
  const out: Record<string, AnswerValue> = {};
  for (const d of DOMAIN_ORDER) {
    const dq = qs.filter((q) => q.domain === d);
    let pts = Math.round((targets[d] / 100) * dq.length * 2);
    dq.forEach((q, i) => {
      const left = dq.length - i;
      const v = Math.min(2, Math.max(0, Math.ceil(pts / left))) as AnswerValue;
      out[q.id] = v;
      pts -= v;
    });
  }
  return out;
}

const DOMAIN_SPECIALIST: Record<Domain, SpecialtyId> = {
  nutq: "logoped",
  kognitiv: "defektolog",
  mayda_motorika: "defektolog",
  yirik_motorika: "fizioterapevt",
  ijtimoiy: "psixolog",
  mustaqillik: "maxsus_pedagog",
};

const DOMAIN_ADVICE: Record<Domain, string> = {
  nutq: "Har kuni 5–7 daqiqa artikulyatsion gimnastika qiling va bola bilan rasmlar asosida ko‘proq suhbatlashing.",
  kognitiv: "Qisqa (5–10 daqiqalik) diqqat va xotira o‘yinlarini kuniga 2 marta o‘ynang, vaqtni asta-sekin uzaytiring.",
  mayda_motorika: "Plastilin, munchoq terish va qisqichlar bilan kuniga 10 daqiqa barmoq mashqlarini bajaring.",
  yirik_motorika: "Muvozanat, sakrash va oyoq uchida yurish mashqlarini o‘yin tarzida har kuni bajaring.",
  ijtimoiy: "Navbat bilan o‘ynaladigan o‘yinlar va hissiyotlarni nomlash mashqlarini oilaviy tarzda o‘tkazing.",
  mustaqillik: "Kiyinish, tish yuvish kabi kundalik ishlarni rasmli ketma-ketlik bilan bosqichma-bosqich o‘rgating.",
};

export function specialistForDomain(d: Domain): SpecialtyId {
  return DOMAIN_SPECIALIST[d];
}

/** Qoidaga asoslangan xulosa (AI mavjud bo‘lmaganda ham ishlaydi) */
export function ruleSummary(
  child: Pick<Child, "name">,
  scores: Scores,
  prev?: Scores,
): { summary: string; recommendations: string[] } {
  const sorted = [...DOMAIN_ORDER].sort((a, b) => scores[b] - scores[a]);
  const strong = sorted.slice(0, 2);
  const weak = sorted.slice(-2).reverse();
  const fmt = (d: Domain) => `${DOMAINS[d].label.toLowerCase()} (${scores[d]}%)`;
  let summary = `${child.name}ning eng kuchli tomonlari — ${strong.map(fmt).join(" va ")}. `;
  summary += `Ko‘proq e’tibor talab qiladigan yo‘nalishlar — ${weak.map(fmt).join(" va ")}.`;
  if (prev) {
    const deltas = DOMAIN_ORDER.map((d) => ({ d, delta: scores[d] - prev[d] })).sort((a, b) => b.delta - a.delta);
    const best = deltas[0];
    if (best.delta > 0) {
      summary += ` Oldingi baholashga nisbatan eng katta o‘sish ${DOMAINS[best.d].label.toLowerCase()} yo‘nalishida: +${best.delta} ball.`;
    }
    const drop = deltas[deltas.length - 1];
    if (drop.delta < -5) {
      summary += ` ${DOMAINS[drop.d].label} bo‘yicha natija ${-drop.delta} ballga pasaygan — bunga e’tibor bering.`;
    }
  }
  const recommendations = weak.map((d) => DOMAIN_ADVICE[d]);
  const lowest = weak[0];
  if (scores[lowest] < 50) {
    recommendations.push(
      `${DOMAINS[lowest].label} bo‘yicha ${SPECIALTIES[DOMAIN_SPECIALIST[lowest]].label.toLowerCase()} konsultatsiyasi tavsiya etiladi — hududingizdagi bepul YuniQo sessiyasiga yozilishingiz mumkin.`,
    );
  }
  recommendations.push("Mashqlarni har kuni bir xil vaqtda bajaring va 4–6 haftadan so‘ng qayta baholang.");
  return { summary, recommendations };
}
