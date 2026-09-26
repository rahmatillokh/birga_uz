import type { Bot } from "grammy";
import { questionsFor } from "@/data/assessment";
import { AGE_BANDS, DOMAINS, DOMAIN_ORDER, SPECIALTIES, SPECIALTY_ORDER, bandForAge, scoreLevel } from "@/lib/constants";
import { specialistForDomain } from "@/lib/core/scoring";
import { badgesFor } from "@/lib/core/stats";
import type { AnswerValue, Assessment, AssessmentQuestion, Child, UserView } from "@/lib/types";
import { ageOf, formatDate } from "@/lib/utils";
import { actAs, viewOf } from "../api";
import type { BotContext } from "../context";
import { activeChild, ageText, childData } from "../data";
import { screens } from "../nav";
import { DISCLAIMER } from "../texts";
import { appBtn, bar, btn, childSwitchRows, esc, kb, nbtn, needChild, render, toast, trend, type Btn } from "../ui";

/**
 * 2. 📝 Boshlang‘ich savolnoma — har bir savol bitta xabarni tahrirlash orqali.
 * Holat to‘liq callback_data ichida saqlanadi: "qa:<childId>:<javoblar>" (masalan "qa:ch-1a2b:2102"),
 * shuning uchun bot qayta ishga tushsa ham savolnoma uzilmaydi.
 * 3. 🧠 Dastlabki rivojlanish baholashi — assessment.submit va natija kartasi.
 */
export function registerAssessment(bot: Bot<BotContext>): void {
  screens.set("quiz", (ctx) => openQuiz(ctx));
  screens.set("result", (ctx) => openResult(ctx));

  bot.callbackQuery(/^qz:i:(.+)$/, (ctx) => openQuiz(ctx, ctx.match[1]));
  bot.callbackQuery(/^qa:([^:]+):([012]*)$/, (ctx) => onAnswer(ctx, ctx.match[1], ctx.match[2]));
  bot.callbackQuery("qz:x", async (ctx) => {
    toast(ctx, "Savolnoma to‘xtatildi");
    await render(
      ctx,
      "⏸ <b>Savolnoma to‘xtatildi.</b>\nIstalgan vaqtda «📝 Savolnoma» tugmasi orqali qaytadan boshlashingiz mumkin.",
      kb([[btn("📝 Qaytadan boshlash", "m:quiz")]]),
    );
  });
  bot.callbackQuery(/^rs:(.+)$/, (ctx) => openResult(ctx, ctx.match[1]));
}

function questionsForChild(child: Child): { band: ReturnType<typeof bandForAge>; qs: AssessmentQuestion[] } {
  const band = bandForAge(ageOf(child.birthDate).years);
  return { band, qs: questionsFor(band) };
}

// ---------------------------------------------------------------------------
// Kirish
// ---------------------------------------------------------------------------

async function openQuiz(ctx: BotContext, childId?: string): Promise<void> {
  const view = await viewOf(ctx);
  if (!view.children.length) return needChild(ctx, "Savolnoma bolaning yoshiga qarab tuziladi — avval profil yarating (1 daqiqa).");
  let child = childId ? view.children.find((c) => c.id === childId) : undefined;
  if (!child && view.children.length > 1) {
    await render(
      ctx,
      "📝 <b>Qaysi farzandingiz uchun savolnomani to‘ldiramiz?</b>",
      kb(view.children.map((c) => [btn(`${c.avatar} ${c.name} — ${ageText(c)}`, `qz:i:${c.id}`)])),
    );
    return;
  }
  child ??= view.children[0];
  if (child.id !== view.user.activeChildId) await actAs(ctx, { type: "child.select", childId: child.id });

  const { band, qs } = questionsForChild(child);
  if (!qs.length) {
    await render(
      ctx,
      `📝 <b>${esc(child.name)} uchun savolnoma tayyorlanmoqda</b>\n\n${AGE_BANDS[band].label} guruhi savollari tez orada qo‘shiladi. Hozircha baholashni ilovada o‘tishingiz mumkin.`,
      kb([[appBtn("🌐 Ilovada baholash", "/assessment")]]),
    );
    return;
  }
  const latest = childData(view, child.id).latest;
  const lines = [
    `📝 <b>Boshlang‘ich savolnoma</b> · ${child.avatar} ${esc(child.name)} (${ageText(child)})`,
    "",
    `${qs.length} ta qisqa savol · 6 yo‘nalish · 5–7 daqiqa`,
    `Savollar ${AGE_BANDS[band].label} guruhi uchun tuzilgan.`,
    "",
    "Bolangizning <b>hozirgi</b> holatiga qarab javob bering:",
    "✅ <b>Ha</b> — muntazam, mustaqil qila oladi",
    "🟡 <b>Ba’zan</b> — ba’zida yoki yordam bilan",
    "❌ <b>Yo‘q</b> — hali qila olmaydi",
  ];
  if (latest) {
    lines.push("", `📊 Oxirgi baholash: ${formatDate(latest.at)} — <b>${latest.overall}%</b>. Qayta baholash o‘sishni ko‘rsatadi 📈`);
  }
  lines.push("", "🔐 Javoblar faqat sizga va siz ruxsat bergan mutaxassislarga ko‘rinadi.");
  await render(
    ctx,
    lines.join("\n"),
    kb([
      [btn("▶️ Boshlash", `qa:${child.id}:`)],
      [appBtn("🌐 Ilovada to‘ldirish", "/assessment")],
      ...childSwitchRows(view, child, "qz:i"),
    ]),
  );
}

// ---------------------------------------------------------------------------
// Savollar
// ---------------------------------------------------------------------------

async function onAnswer(ctx: BotContext, childId: string, answers: string): Promise<void> {
  const view = await viewOf(ctx);
  const child = view.children.find((c) => c.id === childId);
  if (!child) {
    toast(ctx, "Profil topilmadi", true);
    return;
  }
  const { band, qs } = questionsForChild(child);
  if (!qs.length || answers.length > qs.length) {
    toast(ctx, "Savolnoma yangilangan — qaytadan boshlaymiz");
    await openQuiz(ctx, childId);
    return;
  }
  if (answers.length < qs.length) {
    await render(ctx, questionText(child, qs, answers), questionKb(child, qs, answers));
    return;
  }
  await submit(ctx, view, child, band, qs, answers);
}

function questionText(child: Child, qs: AssessmentQuestion[], answers: string): string {
  const i = answers.length;
  const q = qs[i];
  const d = DOMAINS[q.domain];
  const lines = [
    `📝 <b>Savolnoma</b> · ${child.avatar} ${esc(child.name)}`,
    `<b>${i + 1}/${qs.length}</b>  ${bar((i / qs.length) * 100, 12)}`,
    "",
    `${d.emoji} <i>${esc(d.label)}</i>`,
    `<b>${esc(q.text)}</b>`,
  ];
  if (q.hint) lines.push(`💡 <i>${esc(q.hint)}</i>`);
  return lines.join("\n");
}

function questionKb(child: Child, qs: AssessmentQuestion[], answers: string) {
  const base = `qa:${child.id}:${answers}`;
  const back = answers.length === 0 ? `qz:i:${child.id}` : `qa:${child.id}:${answers.slice(0, -1)}`;
  return kb([
    [btn("✅ Ha", `${base}2`), btn("🟡 Ba’zan", `${base}1`), btn("❌ Yo‘q", `${base}0`)],
    [btn("⬅️ Orqaga", back), btn("✖️ To‘xtatish", "qz:x")],
  ]);
}

function sameAnswers(a: Record<string, AnswerValue>, b: Record<string, AnswerValue>): boolean {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
}

async function submit(
  ctx: BotContext,
  view: UserView,
  child: Child,
  band: ReturnType<typeof bandForAge>,
  qs: AssessmentQuestion[],
  answers: string,
): Promise<void> {
  const map: Record<string, AnswerValue> = {};
  qs.forEach((q, i) => {
    map[q.id] = Number(answers[i]) as AnswerValue;
  });

  // Ikki marta bosilsa — takroriy baholash yaratmaymiz
  const d = childData(view, child.id);
  if (d.latest && Date.now() - Date.parse(d.latest.at) < 5 * 60_000 && sameAnswers(d.latest.answers, map)) {
    await render(ctx, resultText(child, d.latest, d.previous), resultKb(view, child, d.latest, false));
    return;
  }

  const { result, view: v2 } = await actAs(ctx, { type: "assessment.submit", childId: child.id, band, answers: map, source: "bot" });
  if (!result.ok) {
    toast(ctx, result.error ?? "Natijani saqlab bo‘lmadi", true);
    return;
  }
  const d2 = childData(v2, child.id);
  const a = d2.assessments.find((x) => x.id === result.createdId) ?? d2.latest;
  if (!a) {
    toast(ctx, "Natija topilmadi", true);
    return;
  }
  const prev = d2.assessments.filter((x) => x.id !== a.id).pop();
  const newBadges = badgesFor(d2.activities, d2.assessments, v2.bookings).filter((b) => result.newBadges?.includes(b.id));
  toast(ctx, `🎉 Baholash yakunlandi! +${result.pointsEarned ?? 20} ball`);
  const extra = [
    `🌟 +${result.pointsEarned ?? 20} ball`,
    ...newBadges.map((b) => `🏅 Yangi nishon: ${b.emoji} <b>${esc(b.title)}</b>`),
    "🎯 Individual reja yangi natijalar asosida yangilandi.",
  ];
  await render(ctx, `${resultText(child, a, prev)}\n\n${extra.join("\n")}`, resultKb(v2, child, a, false));
}

// ---------------------------------------------------------------------------
// Natija
// ---------------------------------------------------------------------------

function resultText(child: Child, a: Assessment, prev?: Assessment): string {
  const lvl = scoreLevel(a.overall);
  const lines = [
    `🧠 <b>${esc(child.name)} — rivojlanish baholashi</b>`,
    `📅 ${formatDate(a.at)} · ${AGE_BANDS[a.band].label} savolnomasi`,
    "",
    `Umumiy natija: <b>${a.overall}%</b> ${lvl.icon} ${lvl.label}${prev ? ` (${trend(a.overall - prev.overall)})` : ""}`,
    "",
  ];
  for (const dm of DOMAIN_ORDER) {
    const s = a.scores[dm];
    const delta = prev ? `  ${trend(s - prev.scores[dm])}` : "";
    lines.push(`${DOMAINS[dm].emoji} ${bar(s, 10)} <b>${s}%</b> ${scoreLevel(s).icon} ${esc(DOMAINS[dm].short)}${delta}`);
  }
  lines.push("", "✅ Yaxshi · 🟡 Rivojlanmoqda · ❗ E’tibor kerak");
  if (a.summary) lines.push("", "📋 <b>Xulosa</b>", esc(a.summary));
  if (a.recommendations.length) {
    lines.push("", "💡 <b>Tavsiyalar</b>");
    for (const r of a.recommendations.slice(0, 3)) lines.push(`• ${esc(r)}`);
  }
  lines.push("", DISCLAIMER);
  return lines.join("\n");
}

function weakestDomain(a: Assessment) {
  return [...DOMAIN_ORDER].sort((x, y) => a.scores[x] - a.scores[y])[0];
}

function resultKb(view: UserView, child: Child, a: Assessment, withSwitch: boolean) {
  const specialty = specialistForDomain(weakestDomain(a));
  const specIdx = SPECIALTY_ORDER.indexOf(specialty);
  const rows: Btn[][] = [
    [nbtn("🎯 Mashqlar", `ex:v:${child.id}`), appBtn("📊 To‘liq natija", "/assessment")],
    [nbtn(`👨‍⚕️ Mutaxassis topish (${SPECIALTIES[specialty].label})`, `sp:t:${specIdx}`)],
    [btn("🔁 Qayta baholash", `qz:i:${child.id}`)],
  ];
  if (withSwitch) rows.push(...childSwitchRows(view, child, "rs"));
  return kb(rows);
}

async function openResult(ctx: BotContext, childId?: string): Promise<void> {
  const view = await viewOf(ctx);
  const child = (childId && view.children.find((c) => c.id === childId)) || activeChild(view);
  if (!child) return needChild(ctx);
  if (childId && child.id !== view.user.activeChildId) await actAs(ctx, { type: "child.select", childId: child.id });
  const d = childData(view, child.id);
  if (!d.latest) {
    await render(
      ctx,
      [
        `🧠 <b>${esc(child.name)} hali baholanmagan</b>`,
        "",
        "24 ta qisqa savol · 5–7 daqiqa — va siz 6 yo‘nalish bo‘yicha rivojlanish xaritasi, xulosa va shaxsiy tavsiyalarni olasiz.",
      ].join("\n"),
      kb([[btn("📝 Savolnomani boshlash", `qz:i:${child.id}`)], ...childSwitchRows(view, child, "rs")]),
    );
    return;
  }
  await render(ctx, resultText(child, d.latest, d.previous), resultKb(view, child, d.latest, true));
}
