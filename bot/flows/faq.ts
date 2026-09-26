import type { Bot } from "grammy";
import { FAQ } from "@/data/faq";
import type { FaqItem } from "@/lib/types";
import { normalizeText } from "@/lib/utils";
import type { BotContext } from "../context";
import { screens } from "../nav";
import { MENU, type ScreenKey } from "../texts";
import { appBtn, btn, clip, esc, kb, mainMenu, nbtn, render, send, type Btn } from "../ui";

/**
 * 17. ❓ Savol-javob: mavzular → savollar → javob.
 * Erkin matn (menyu buyrug‘i emas va jarayon faol emas) → eng mos FAQ javobi + «Ustoz AI» taklifi.
 */

const CATS: Record<FaqItem["category"], string> = {
  umumiy: "📌 Umumiy",
  baholash: "🧠 Baholash",
  mutaxassis: "👨‍⚕️ Mutaxassislar",
  premium: "💎 Premium",
  xavfsizlik: "🔐 Xavfsizlik",
};
const CAT_KEYS = Object.keys(CATS) as FaqItem["category"][];

export function registerFaq(bot: Bot<BotContext>): void {
  screens.set("faq", openFaq);
  bot.callbackQuery("fq:l", openFaq);
  bot.callbackQuery(/^fq:c:(\w+)$/, (ctx) => openCategory(ctx, ctx.match[1] as FaqItem["category"]));
  bot.callbackQuery(/^fq:q:(\d+)$/, (ctx) => openAnswer(ctx, Number(ctx.match[1])));
}

/** Oxirgi middleware: erkin matnli savollar */
export function registerFreeText(bot: Bot<BotContext>): void {
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) {
      await send(ctx, "🤔 Bunday buyruq yo‘q. /menu — asosiy menyu, /yordam — barcha buyruqlar.");
      return;
    }
    await answerFreeText(ctx, text);
  });
  bot.on("message", async (ctx) => {
    await send(ctx, "🙂 Menyudan bo‘limni tanlang yoki savolingizni matn bilan yozing 👇", mainMenu());
  });
}

async function openFaq(ctx: BotContext): Promise<void> {
  const lines = ["❓ <b>Savol-javob</b>", ""];
  if (!FAQ.length) {
    lines.push("Savol-javoblar tez orada qo‘shiladi. Hozircha savolingizni shu yerga yozing yoki Ustoz AI’dan so‘rang 👩‍🏫");
  } else {
    lines.push("Mavzuni tanlang yoki savolingizni shunchaki yozib yuboring ✍️");
  }
  const cats = CAT_KEYS.map((c) => ({ c, n: FAQ.filter((f) => f.category === c).length })).filter((x) => x.n);
  const rows: Btn[][] = cats.map((x) => [btn(`${CATS[x.c]} (${x.n})`, `fq:c:${x.c}`)]);
  rows.push([appBtn("👩‍🏫 Ustoz AI", "/ustoz"), nbtn("🆘 Operator", "m:sup")]);
  await render(ctx, lines.join("\n"), kb(rows));
}

async function openCategory(ctx: BotContext, cat: FaqItem["category"]): Promise<void> {
  const items = FAQ.map((f, i) => ({ f, i })).filter((x) => x.f.category === cat);
  if (!items.length) return openFaq(ctx);
  const lines = [`${CATS[cat] ?? "❓"} — <b>savollar</b>`, ""];
  items.forEach((x, n) => lines.push(`${n + 1}. ${esc(x.f.q)}`));
  const rows: Btn[][] = items.slice(0, 20).map((x, n) => [btn(`${n + 1}. ${clip(x.f.q, 48)}`, `fq:q:${x.i}`)]);
  rows.push([btn("⬅️ Mavzular", "fq:l")]);
  await render(ctx, lines.join("\n"), kb(rows));
}

async function openAnswer(ctx: BotContext, idx: number): Promise<void> {
  const f = FAQ[idx];
  if (!f) return openFaq(ctx);
  await render(
    ctx,
    `❓ <b>${esc(f.q)}</b>\n\n${esc(clip(f.a, 3500))}`,
    kb([
      [btn("⬅️ Orqaga", `fq:c:${f.category}`), appBtn("👩‍🏫 Ustoz AI", "/ustoz")],
      [nbtn("🆘 Operatorga yozish", "m:sup")],
    ]),
  );
}

// ---------------------------------------------------------------------------
// Erkin matn
// ---------------------------------------------------------------------------

const STOP = new Set(
  [
    "va", "bilan", "uchun", "qanday", "qanaqa", "nima", "nimaga", "nega", "qachon", "qayerda", "qaysi", "bu", "shu", "u", "men",
    "mening", "menga", "bizga", "siz", "sizning", "ham", "yoki", "agar", "bir", "necha", "kerak", "mumkin", "emas", "bor", "yoq",
    "bola", "bolam", "bolamni", "bolamga", "bolaning", "bolani", "bolaga", "farzandim", "qilsa", "qilish", "qilib", "boladi",
    "bolsa", "bolyapti", "qiladi", "qila", "olaman", "olamanmi", "mi", "chi", "edi", "juda", "salom",
  ].map((w) => normalizeText(w)),
);

function tokens(s: string): Set<string> {
  return new Set(
    normalizeText(s)
      .split(" ")
      .filter((w) => w.length >= 3 && !STOP.has(w))
      .map((w) => w.slice(0, 5)),
  );
}

const FAQ_INDEX = FAQ.map((f) => ({ q: tokens(f.q), a: tokens(f.a) }));

function bestFaq(text: string): { idx: number; score: number }[] {
  const qt = tokens(text);
  if (!qt.size) return [];
  return FAQ_INDEX.map((ix, idx) => {
    let score = 0;
    for (const t of qt) {
      if (ix.q.has(t)) score += 2;
      else if (ix.a.has(t)) score += 0.5;
    }
    return { idx, score: score / Math.sqrt(qt.size) };
  })
    .filter((x) => x.score >= 1.2)
    .sort((a, b) => b.score - a.score);
}

/** Matndagi kalit so‘zlar bo‘yicha tegishli bo‘limga yo‘naltirish */
const INTENTS: { re: RegExp; key: ScreenKey; label: string }[] = [
  { re: /mashq|topshiriq|vazifa/, key: "ex", label: MENU.ex },
  { re: /savolnoma|baho|test/, key: "quiz", label: MENU.quiz },
  { re: /sessiya|seminar|uchrashuv/, key: "ss", label: MENU.ss },
  { re: /mutaxassis|logoped|defektolog|psixolog|shifokor|pediatr|konsultats/, key: "sp", label: MENU.sp },
  { re: /premium|obuna|narx|tolov/, key: "pm", label: MENU.pm },
  { re: /eslatma/, key: "rem", label: MENU.rem },
  { re: /progress|natija|hisobot/, key: "pr", label: MENU.pr },
  { re: /video/, key: "vid", label: MENU.vid },
  { re: /market|oyinchoq|dokon|sotib/, key: "mkt", label: MENU.mkt },
  { re: /hamjamiyat|guruh/, key: "com", label: MENU.com },
];

async function answerFreeText(ctx: BotContext, text: string): Promise<void> {
  const norm = normalizeText(text);
  if (/^(salom|assalom|assalomu|hello|hi|hey|привет|здравствуйте)/.test(norm)) {
    await send(ctx, `Va alaykum assalom${ctx.from?.first_name ? `, ${esc(ctx.from.first_name)}` : ""}! 😊\nMenyudan bo‘limni tanlang yoki savolingizni yozing — yordam beraman.`, mainMenu());
    return;
  }
  if (/^(rahmat|raxmat|tashakkur|спасибо|thanks|thank you)/.test(norm)) {
    await send(ctx, "Arzimaydi! 😊 Yana savollar bo‘lsa, bemalol yozing.");
    return;
  }

  const intent = INTENTS.find((i) => i.re.test(norm));
  const intentRow: Btn[] = intent ? [nbtn(intent.label, `m:${intent.key}`)] : [];
  const ustoz = appBtn("👩‍🏫 Ustoz AI’dan so‘rash", `/ustoz?q=${encodeURIComponent(clip(text, 300))}`);
  const matches = bestFaq(text);

  if (matches.length) {
    const f = FAQ[matches[0].idx];
    const lines = [`💡 <b>${esc(f.q)}</b>`, "", esc(clip(f.a, 3000))];
    const others = matches.slice(1, 3);
    lines.push("", "Aniqroq javob kerakmi? <b>Ustoz AI</b> bolangiz ma’lumotlarini hisobga olib, batafsil tushuntiradi 👩‍🏫");
    if (others.length) lines.push("", "Shunga o‘xshash savollar 👇");
    await send(
      ctx,
      lines.join("\n"),
      kb([
        ...others.map((m) => [btn(`❓ ${clip(FAQ[m.idx].q, 48)}`, `fq:q:${m.idx}`)]),
        intentRow,
        [ustoz],
        [btn("❓ Barcha savollar", "fq:l"), nbtn("🆘 Operator", "m:sup")],
      ]),
    );
    return;
  }

  await send(
    ctx,
    [
      "🤔 Bu savolga tayyor javob topa olmadim.",
      "",
      "👩‍🏫 <b>Ustoz AI</b> — YuniQo ilovasidagi sun’iy intellekt yordamchisi — bolangiz haqidagi ma’lumotlarni hisobga olib, batafsil javob beradi.",
      "Yoki savolingizni jamoamizga yuboring — odam javob beradi 🆘",
    ].join("\n"),
    kb([intentRow, [ustoz], [btn("❓ Savol-javob", "fq:l"), nbtn("🆘 Operatorga yozish", "m:sup")]]),
  );
}
