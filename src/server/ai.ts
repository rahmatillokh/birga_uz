import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import { EXERCISES } from "@/data/exercises";
import { DOMAIN_ORDER } from "@/lib/constants";

/**
 * Claude API integratsiyasi (Ustoz AI, AI xulosa, AI reja).
 * ANTHROPIC_API_KEY bo‘lmasa — chaqiruvchi kod oflayn demo javoblarga o‘tadi.
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

export function aiEnabled(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

/** Server tomonidagi zaxira model (safety-classifier rad etsa) — faqat Opus 5 / Fable uchun */
function fallbackParams(): { betas?: string[]; fallbacks?: "default" } {
  if (/^claude-(opus-5|fable-5)/.test(AI_MODEL)) {
    return { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" };
  }
  return {};
}

const LANGUAGE_RULES = `Always answer in Uzbek (Latin script). Write oʻ/gʻ with the character ‘ (e.g. "o‘yin", "bog‘cha") and the tutuq belgisi with ’ (e.g. "ta’lim"). Use simple, warm, everyday Uzbek that parents in any region of Uzbekistan understand.`;

export const SYSTEM_PROMPTS = {
  parent: `You are "Ustoz AI", the assistant inside YuniQo ("Har bir bola uchun imkoniyat") — a platform that helps parents of children aged 1–7, including children with developmental differences (speech delay, autism spectrum, Down syndrome, motor delays, flat feet, attention difficulties).
${LANGUAGE_RULES}
How to answer:
- Be warm, encouraging and practical. Keep answers short (about 120–200 words) unless the parent asks for more detail.
- Structure with a one-line direct answer, then 3–6 bullet points of concrete at-home activities (5–10 minutes, household items), then one line on when to see a specialist if relevant. You may use **bold** and "- " bullets; no tables or headings.
- Personalize using the child profile below (name, age, latest scores, plan, specialist notes). Do not invent facts about the child that are not in the profile.
- You do not diagnose and do not prescribe medication. For red flags (loss of skills, no words by 18 months, seizures, pain, feeding/breathing problems, self-harm) clearly advise seeing the right specialist (logoped, defektolog, bolalar psixologi, fizioterapevt, pediatr) and mention that YuniQo has free sessions in every district.
- Use person-first, non-stigmatizing language. Never shame the parent.
- When useful, point to YuniQo features: exercises library, AI video check, talaffuz (pronunciation) check, games, development passport to share with a specialist.`,
  kid: `You are "Ustoz AI", a kind cartoon teacher talking DIRECTLY to a young child (3–7 years old) inside the YuniQo app. A parent is next to the child.
${LANGUAGE_RULES}
Rules: very short replies (1–3 short sentences), very simple words, 1–2 emoji, always praise effort, and end with ONE simple question or mini-task (name a color, count objects, make an animal sound, show a body part). Topics: animals, colors, counting, shapes, fruits, sounds, feelings, daily routines. Never ask for personal information (address, phone, school). If the child says something sad or unsafe, gently say to tell mom or dad. Use the child's name from the profile.`,
  specialist: `You are "Ustoz AI" assisting a certified child-development specialist (logoped, defektolog, psixolog, fizioterapevt, etc.) inside the YuniQo specialist cabinet. The specialist can see the child's data shared by the parent (profile, assessment scores, exercise and AI-check results, notes from other specialists).
${LANGUAGE_RULES}
Write in a concise professional tone. When asked to draft a conclusion, recommendation or report, base it strictly on the provided data, state the observed dynamics with numbers, list 3–5 concrete recommendations and home exercises, and note limitations of parent-reported screening. Never state a medical diagnosis as fact.`,
} as const;

export type ChatMode = keyof typeof SYSTEM_PROMPTS;

/** Oqimli (streaming) chat — matn bo‘laklarini ReadableStream orqali qaytaradi */
export function streamChat(mode: ChatMode, context: string, messages: Anthropic.Beta.BetaMessageParam[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const stream = anthropic().beta.messages.stream({
    model: AI_MODEL,
    max_tokens: 8000,
    system: [
      { type: "text", text: SYSTEM_PROMPTS[mode] },
      { type: "text", text: `Child profile / context:\n${context || "(profil hali to‘ldirilmagan)"}` },
    ],
    messages,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    ...fallbackParams(),
  });
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      stream.on("text", (t) => controller.enqueue(enc.encode(t)));
      try {
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(enc.encode("\n\nKechirasiz, bu savolga javob bera olmayman. Iltimos, mutaxassis bilan maslahatlashing."));
        }
      } catch (e) {
        controller.enqueue(enc.encode(`\n\n⚠️ AI bilan bog‘lanishda xatolik: ${describeError(e)}`));
      }
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });
}

export function describeError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return "API kaliti noto‘g‘ri";
  if (e instanceof Anthropic.RateLimitError) return "so‘rovlar limiti oshdi, birozdan so‘ng urinib ko‘ring";
  if (e instanceof Anthropic.APIError) return `API xatosi (${e.status ?? "?"})`;
  return (e as Error)?.message ?? "noma’lum xato";
}

// ---------------------------------------------------------------------------
// Tuzilgan (structured) generatsiya
// ---------------------------------------------------------------------------

const AssessmentSchema = z.object({
  summary: z.string().describe("3–5 sentence summary for parents in Uzbek: strengths, areas to develop, dynamics vs previous assessment"),
  recommendations: z.array(z.string()).describe("4–6 concrete recommendations in Uzbek, each one sentence"),
});

export async function aiAssessmentSummary(context: string, assessmentText: string) {
  const res = await anthropic().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 16000,
    system: `${SYSTEM_PROMPTS.parent}\n\nYou are now writing the written result of a parent-reported developmental screening (not a diagnosis).`,
    messages: [
      {
        role: "user",
        content: `Child profile:\n${context}\n\nNew assessment result:\n${assessmentText}\n\nWrite the summary and recommendations for the parent.`,
      },
    ],
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: betaZodOutputFormat(AssessmentSchema) },
    ...fallbackParams(),
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error("AI javob bermadi");
  return res.parsed_output;
}

export async function aiPlan(context: string, ageYears: number) {
  const allowed = EXERCISES.filter((e) => ageYears >= e.ageMin - 1 && ageYears <= e.ageMax + 1);
  const ids = allowed.map((e) => e.id) as [string, ...string[]];
  const PlanSchema = z.object({
    summary: z.string().describe("2–3 sentences in Uzbek explaining the plan focus to the parent"),
    focus: z.array(z.enum(DOMAIN_ORDER as [string, ...string[]])).describe("2–3 focus domains"),
    goals: z
      .array(z.object({ domain: z.enum(DOMAIN_ORDER as [string, ...string[]]), text: z.string(), target: z.number() }))
      .describe("one measurable goal per focus domain; target = score (0-100) to reach in 6 weeks"),
    items: z
      .array(
        z.object({
          exerciseId: z.enum(ids),
          frequency: z.enum(["har_kuni", "haftada_3", "haftada_2"]),
          reason: z.string().describe("short reason in Uzbek, max 10 words"),
        }),
      )
      .describe("7–9 exercises; include every active specialist assignment exercise first"),
  });
  const catalog = allowed.map((e) => `${e.id} | ${e.title} | ${e.domain} | ${e.topic} | ${e.durationMin} daq`).join("\n");
  const res = await anthropic().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 16000,
    system: `${SYSTEM_PROMPTS.parent}\n\nYou are now building a 6-week individual development plan (Individual rivojlanish rejasi) from the exercise catalog. Total daily time should be about 15–25 minutes.`,
    messages: [
      {
        role: "user",
        content: `Child profile:\n${context}\n\nExercise catalog (id | title | domain | topic | duration):\n${catalog}\n\nBuild the plan.`,
      },
    ],
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: betaZodOutputFormat(PlanSchema) },
    ...fallbackParams(),
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error("AI javob bermadi");
  return res.parsed_output;
}

/** Qisqa matn (kunlik tavsiya, progress tahlili, hisobot qoralamasi) */
export async function aiText(mode: ChatMode, context: string, instruction: string): Promise<string> {
  const res = await anthropic().beta.messages.create({
    model: AI_MODEL,
    max_tokens: 16000,
    system: [
      { type: "text", text: SYSTEM_PROMPTS[mode] },
      { type: "text", text: `Child profile / context:\n${context}` },
    ],
    messages: [{ role: "user", content: instruction }],
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    ...fallbackParams(),
  });
  if (res.stop_reason === "refusal") throw new Error("AI javob bermadi");
  return res.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

// ---------------------------------------------------------------------------
// AI individual mashq (bolaning qiziqishi va zaif yo‘nalishiga moslashgan)
// ---------------------------------------------------------------------------
const ExerciseSchema = z.object({
  title: z.string().describe("short playful exercise name in Uzbek"),
  emoji: z.string().describe("one emoji"),
  domain: z.enum(DOMAIN_ORDER as [string, ...string[]]),
  goal: z.string().describe("1–2 sentences: developmental goal"),
  materials: z.array(z.string()).describe("household items, may be empty"),
  steps: z.array(z.string()).describe("4–6 concrete steps for the parent"),
  tips: z.array(z.string()).describe("2–3 short tips incl. safety"),
  durationMin: z.number().describe("5–10 minutes"),
});

export async function aiExercise(context: string, domain: string) {
  const res = await anthropic().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 16000,
    system: `${SYSTEM_PROMPTS.parent}\n\nYou now design ONE new, safe, playful home exercise (5–10 minutes) personalized to the child's interests and age, targeting the requested development domain. Use only household items. It must be different from standard textbook exercises — weave the child's interests into it.`,
    messages: [{ role: "user", content: `Child profile:\n${context}\n\nTarget domain: ${domain}. Create the exercise.` }],
    thinking: { type: "adaptive" },
    output_config: { effort: "low", format: betaZodOutputFormat(ExerciseSchema) },
    ...fallbackParams(),
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error("AI javob bermadi");
  return res.parsed_output;
}
