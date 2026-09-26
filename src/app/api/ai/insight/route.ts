import { DOMAINS, DOMAIN_ORDER, DEMO_SPECIALIST_ID } from "@/lib/constants";
import { firstAssessment, latestAssessment, streakOf, weeklySeries } from "@/lib/core/stats";
import type { DB } from "@/lib/types";
import { identify } from "@/server/auth";
import { aiEnabled, aiText, describeError } from "@/server/ai";
import { parentChildContext, specialistChildContext } from "@/server/ai-context";
import { getDB } from "@/server/db";

type Kind = "daily" | "progress" | "report";

const INSTRUCTIONS: Record<Kind, string> = {
  daily:
    "Write today's short tip for the parent (max 60 words): one concrete 5-minute activity tailored to the child's weakest area and interests, plus one sentence of encouragement. No bullet list, no heading.",
  progress:
    "Analyse the child's progress (max 130 words): what improved with numbers, what needs attention, how consistent the practice was, and 2–3 concrete next steps. Use 2–4 short '- ' bullets after one intro sentence.",
  report:
    "Draft a professional specialist conclusion (Mutaxassis xulosasi) of 150–220 words: current level by domain with numbers, dynamics since the first assessment, practice adherence, AI-check observations if present, and 4 recommendations with home exercises. Plain paragraphs and '- ' bullets only.",
};

function fallbackInsight(db: DB, childId: string | undefined, kind: Kind): string {
  const child = db.children.find((c) => c.id === childId);
  if (!child) return "Bola profili topilmadi.";
  const as = db.assessments.filter((a) => a.childId === child.id);
  const last = latestAssessment(as, child.id);
  const first = firstAssessment(as, child.id);
  const acts = db.activities.filter((a) => a.childId === child.id);
  const streak = streakOf(acts).current;
  const weeks = weeklySeries(acts, 4);
  if (!last) return `${child.name} uchun rivojlanish baholashidan o‘ting — shundan so‘ng Ustoz AI shaxsiy tavsiyalar beradi.`;
  const weakest = [...DOMAIN_ORDER].sort((a, b) => last.scores[a] - last.scores[b])[0];
  if (kind === "daily") {
    const tips: Record<string, string> = {
      nutq: "Bugun kechki ovqatdan keyin 5 daqiqa «Otcha» va «Barabanchi» mashqlarini ko‘zgu oldida bajaring, keyin R tovushli 5 ta so‘zni birga ayting.",
      kognitiv: "Bugun «Nima o‘zgardi?» o‘ynang: stolga 5 ta o‘yinchoq qo‘ying, bittasini yashiring — bola topsin.",
      mayda_motorika: "Bugun 5 daqiqa plastilindan «munchoqlar» yasang va ularni ipga tering.",
      yirik_motorika: "Bugun 5 daqiqa oyoq uchida yurish va bir oyoqda turish musobaqasini o‘tkazing.",
      ijtimoiy: "Bugun navbat bilan o‘ynaladigan o‘yin o‘ynang va har bir hissiyotni so‘z bilan nomlang.",
      mustaqillik: "Bugun bola o‘zi kiyinishiga 5 daqiqa ko‘proq vaqt bering va har qadamni maqtang.",
    };
    return `${tips[weakest]} ${child.name} ${streak} kundan beri har kuni shug‘ullanmoqda — ajoyib natija! 🌟`;
  }
  const lines = DOMAIN_ORDER.map((d) => {
    const delta = first && first.id !== last.id ? last.scores[d] - first.scores[d] : 0;
    return `- ${DOMAINS[d].label}: ${last.scores[d]}%${delta ? ` (${delta > 0 ? "+" : ""}${delta})` : ""}`;
  });
  const best = first && first.id !== last.id ? [...DOMAIN_ORDER].sort((a, b) => last.scores[b] - first.scores[b] - (last.scores[a] - first.scores[a]))[0] : undefined;
  const intro =
    kind === "report"
      ? `Mutaxassis xulosasi (qoralama). ${child.name} bilan YuniQo platformasida ${acts.length} ta mashg‘ulot bajarilgan, oxirgi 4 haftada haftasiga o‘rtacha ${Math.round(weeks.reduce((s, w) => s + w.count, 0) / 4)} ta.`
      : `${child.name}ning rivojlanishi ijobiy dinamikada: umumiy ko‘rsatkich ${last.overall}%.`;
  return `${intro}${best ? ` Eng katta o‘sish — ${DOMAINS[best].label.toLowerCase()} yo‘nalishida.` : ""}\n\n${lines.join("\n")}\n\nKeyingi qadamlar: ${DOMAINS[weakest].label.toLowerCase()} yo‘nalishiga ko‘proq e’tibor bering, mashqlarni har kuni bir xil vaqtda bajaring va 4 haftadan so‘ng qayta baholang.`;
}

export async function POST(req: Request) {
  const db = getDB();
  const body = (await req.json()) as { childId?: string; kind?: Kind; specialistId?: string };
  const kind: Kind = body.kind === "progress" || body.kind === "report" ? body.kind : "daily";
  let ctx: { child?: { id: string }; text: string };
  if (kind === "report") {
    ctx = body.childId ? specialistChildContext(db, body.specialistId || DEMO_SPECIALIST_ID, body.childId) : { text: "" };
  } else {
    const id = identify(req, db);
    if ("error" in id) return Response.json({ error: id.error }, { status: 401 });
    ctx = parentChildContext(db, id.uid, body.childId);
  }
  if (!ctx.child) return Response.json({ text: "Bola profili topilmadi.", ai: false });
  if (!aiEnabled()) return Response.json({ text: fallbackInsight(db, ctx.child.id, kind), ai: false });
  try {
    const text = await aiText(kind === "report" ? "specialist" : "parent", ctx.text, INSTRUCTIONS[kind]);
    return Response.json({ text, ai: true });
  } catch (e) {
    return Response.json({ text: fallbackInsight(db, ctx.child.id, kind), ai: false, error: describeError(e) });
  }
}
