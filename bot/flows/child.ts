import type { Bot } from "grammy";
import { districtLabel, getRegion } from "@/data/regions";
import { CONCERN_OPTIONS } from "@/lib/constants";
import { todayTasks } from "@/lib/core/stats";
import type { Child, UserView } from "@/lib/types";
import { todayKey } from "@/lib/utils";
import { actAs, viewOf } from "../api";
import type { BotContext, ChildDraft } from "../context";
import { activeChild, ageText, childData } from "../data";
import { screens, steps } from "../nav";
import { registerPicker, showRegions } from "../pickers";
import { appBtn, btn, clip, esc, kb, nbtn, render, send, toast, type Btn } from "../ui";

/**
 * 1. 👶 Bola profilini yaratish: ism → yosh → jins → tashvishlar → hudud → tuman → tasdiq → child.create
 * Bir nechta farzand: ro‘yxat va faol profilni tanlash (child.select).
 */
export function registerChild(bot: Bot<BotContext>): void {
  screens.set("child", openChildren);
  steps.set("cc.name", onName);

  bot.callbackQuery("cc:new", startCreate);
  bot.callbackQuery("cc:x", async (ctx) => {
    ctx.session.draft = undefined;
    ctx.session.step = undefined;
    toast(ctx, "Bekor qilindi");
    await render(ctx, "✖️ Profil yaratish bekor qilindi.\nIstalgan vaqtda «👶 Bola profili» bo‘limidan qayta boshlashingiz mumkin.");
  });

  bot.callbackQuery(/^cc:a:([1-7])$/, async (ctx) => {
    const d = await needDraft(ctx);
    if (!d) return;
    d.age = Number(ctx.match[1]);
    await showGender(ctx, d);
  });

  bot.callbackQuery(/^cc:g:([oq])$/, async (ctx) => {
    const d = await needDraft(ctx);
    if (!d) return;
    d.gender = ctx.match[1] === "q" ? "qiz" : "o‘g‘il";
    await showConcerns(ctx, d);
  });

  bot.callbackQuery(/^cc:c:(\d+)$/, async (ctx) => {
    const d = await needDraft(ctx);
    if (!d) return;
    const i = Number(ctx.match[1]);
    if (i < 0 || i >= CONCERN_OPTIONS.length) return;
    d.concerns = d.concerns.includes(i) ? d.concerns.filter((x) => x !== i) : [...d.concerns, i];
    await showConcerns(ctx, d);
  });

  bot.callbackQuery("cc:cd", async (ctx) => {
    const d = await needDraft(ctx);
    if (!d) return;
    await showRegions(ctx, "cc", undefined, d.regionId);
  });

  bot.callbackQuery(/^cc:b:(age|gender|concerns)$/, async (ctx) => {
    const d = await needDraft(ctx);
    if (!d) return;
    const to = ctx.match[1];
    if (to === "age") await showAge(ctx, d);
    else if (to === "gender") await showGender(ctx, d);
    else await showConcerns(ctx, d);
  });

  registerPicker(bot, "cc", {
    regionsText:
      "📍 <b>Qaysi hududda yashaysiz?</b>\n\nBu sizga eng yaqin bepul YuniQo sessiyalari va mutaxassislarni topishga yordam beradi.",
    districtsText: (name) => `🏘 <b>${esc(name)}</b>\nTuman yoki shaharni tanlang:`,
    bottomRows: [[btn("⬅️ Orqaga", "cc:b:concerns"), btn("✖️ Bekor qilish", "cc:x")]],
    onDistrict: async (ctx, regionId, district) => {
      const d = await needDraft(ctx);
      if (!d) return;
      d.regionId = regionId;
      d.district = district;
      await showConfirm(ctx, d);
    },
  });

  bot.callbackQuery("cc:ok", save);

  bot.callbackQuery(/^ch:s:(.+)$/, async (ctx) => {
    const { result, view } = await actAs(ctx, { type: "child.select", childId: ctx.match[1] });
    if (!result.ok) {
      toast(ctx, result.error ?? "Profil topilmadi", true);
      return;
    }
    const c = view.children.find((x) => x.id === ctx.match[1]);
    toast(ctx, `✅ Faol profil: ${c?.name ?? ""}`);
    await renderChildren(ctx, view);
  });
}

// ---------------------------------------------------------------------------
// Farzandlar ro‘yxati
// ---------------------------------------------------------------------------

async function openChildren(ctx: BotContext): Promise<void> {
  const view = await viewOf(ctx);
  if (!view.children.length) return startCreate(ctx);
  await renderChildren(ctx, view);
}

async function renderChildren(ctx: BotContext, view: UserView): Promise<void> {
  const active = activeChild(view);
  const lines = [view.children.length > 1 ? "👶 <b>Farzandlaringiz</b>" : "👶 <b>Bola profili</b>", ""];
  for (const c of view.children) {
    const d = childData(view, c.id);
    const isActive = c.id === active?.id;
    const tasks = todayTasks(d.plan, d.assignments, d.activities);
    lines.push(`${isActive && view.children.length > 1 ? "✅ " : ""}${c.avatar} <b>${esc(c.name)}</b> — ${ageText(c)}, ${c.gender === "qiz" ? "qiz" : "o‘g‘il"}`);
    const where = c.district ? `📍 ${esc(districtLabel(c.district))}` : "";
    const score = d.latest ? `🧠 Oxirgi baholash: ${d.latest.overall}%` : "🧠 Baholanmagan";
    lines.push(`    ${[where, score].filter(Boolean).join(" · ")}`);
    lines.push(`    🎯 Bugun: ${tasks.filter((t) => t.done).length}/${tasks.length} mashq`);
    if (c.concerns.length) lines.push(`    🤔 ${esc(clip(c.concerns.join(", "), 90))}`);
    lines.push("");
  }
  if (view.children.length > 1) lines.push("✅ — faol profil: mashqlar, progress va eslatmalar shu bola uchun ko‘rsatiladi.");

  const rows: Btn[][] = view.children
    .filter((c) => c.id !== active?.id)
    .map((c) => [btn(`👉 ${c.avatar} ${clip(c.name, 18)} — faol qilish`, `ch:s:${c.id}`)]);
  if (active && !childData(view, active.id).latest) rows.push([nbtn(`📝 ${clip(active.name, 16)}ni baholash`, `qz:i:${active.id}`)]);
  rows.push([btn("➕ Yangi bola qo‘shish", "cc:new")]);
  rows.push([appBtn("🌐 Ilovada ko‘rish", "/child")]);
  await render(ctx, lines.join("\n").trim(), kb(rows));
}

// ---------------------------------------------------------------------------
// Yaratish bosqichlari
// ---------------------------------------------------------------------------

async function startCreate(ctx: BotContext): Promise<void> {
  ctx.session.draft = { concerns: [] };
  ctx.session.step = "cc.name";
  await render(
    ctx,
    [
      "👶 <b>Bola profilini yaratamiz</b> — 6 ta qisqa qadam",
      "",
      "✍️ <b>Farzandingizning ismi nima?</b>",
      "Ismni yozib yuboring, masalan: <i>Aziz</i>",
    ].join("\n"),
    kb([[btn("✖️ Bekor qilish", "cc:x")]]),
  );
}

/** Jarayon eskirgan bo‘lsa (masalan bot qayta ishga tushgan) — boshidan boshlaymiz */
async function needDraft(ctx: BotContext): Promise<ChildDraft | undefined> {
  const d = ctx.session.draft;
  if (d?.name) return d;
  toast(ctx, "Jarayon eskirgan — keling, qaytadan boshlaymiz");
  await startCreate(ctx);
  return undefined;
}

/** Oddiy ASCII apostroflarni o‘zbekcha belgilarga almashtirish: G'ayrat → G‘ayrat */
function normalizeName(raw: string): string {
  const s = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/([oOgG])['`ʻʼ’‘]/g, "$1‘")
    .replace(/['`ʻʼ]/g, "’");
  return s
    .split(" ")
    .map((w) => (w ? w[0].toLocaleUpperCase("uz") + w.slice(1) : w))
    .join(" ");
}

async function onName(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text;
  if (!text) {
    await send(ctx, "✍️ Iltimos, farzandingiz ismini matn ko‘rinishida yozing.");
    return;
  }
  const name = normalizeName(text);
  if (name.length < 2 || name.length > 30 || /\d|[<>@#/\\]/.test(name)) {
    await send(ctx, "🙂 Ism 2–30 ta harfdan iborat bo‘lishi kerak. Qaytadan yozing, masalan: <i>Malika</i>", kb([[btn("✖️ Bekor qilish", "cc:x")]]));
    return;
  }
  const d = ctx.session.draft ?? { concerns: [] };
  d.name = name;
  ctx.session.draft = d;
  ctx.session.step = undefined;
  await showAge(ctx, d);
}

async function showAge(ctx: BotContext, d: ChildDraft): Promise<void> {
  const ageBtn = (n: number) => btn(`${d.age === n ? "✅ " : ""}${n} yosh`, `cc:a:${n}`);
  await render(
    ctx,
    `🎂 <b>${esc(d.name)} necha yoshda?</b>\n\nTo‘liq yoshini tanlang. Aniq tug‘ilgan sanani keyinroq ilovada kiritishingiz mumkin.`,
    kb([[1, 2, 3, 4].map(ageBtn), [5, 6, 7].map(ageBtn), [btn("✖️ Bekor qilish", "cc:x")]]),
  );
}

async function showGender(ctx: BotContext, d: ChildDraft): Promise<void> {
  await render(
    ctx,
    `👤 <b>${esc(d.name)} — o‘g‘il bolami yoki qiz bola?</b>`,
    kb([
      [btn(`${d.gender === "o‘g‘il" ? "✅ " : ""}👦 O‘g‘il bola`, "cc:g:o"), btn(`${d.gender === "qiz" ? "✅ " : ""}👧 Qiz bola`, "cc:g:q")],
      [btn("⬅️ Orqaga", "cc:b:age"), btn("✖️ Bekor qilish", "cc:x")],
    ]),
  );
}

async function showConcerns(ctx: BotContext, d: ChildDraft): Promise<void> {
  const selected = d.concerns.map((i) => CONCERN_OPTIONS[i]).filter(Boolean);
  const lines = [
    "🤔 <b>Nimalar sizni tashvishlantiradi?</b>",
    "",
    "Bir nechtasini tanlashingiz mumkin — individual reja shunga qarab tuziladi. Hech biri bo‘lmasa, «Tayyor»ni bosing.",
  ];
  if (selected.length) lines.push("", `✅ Tanlandi: <i>${esc(selected.join(", "))}</i>`);

  // Qisqa variantlar ikki ustunda, uzunlari alohida qatorda
  const rows: Btn[][] = [];
  let pair: Btn[] = [];
  CONCERN_OPTIONS.forEach((label, i) => {
    const b = btn(`${d.concerns.includes(i) ? "✅" : "▫️"} ${label}`, `cc:c:${i}`);
    if (label.length > 20) {
      if (pair.length) rows.push(pair);
      pair = [];
      rows.push([b]);
    } else {
      pair.push(b);
      if (pair.length === 2) {
        rows.push(pair);
        pair = [];
      }
    }
  });
  if (pair.length) rows.push(pair);
  rows.push([btn(`✅ Tayyor${selected.length ? ` (${selected.length})` : ""}`, "cc:cd")]);
  rows.push([btn("⬅️ Orqaga", "cc:b:gender"), btn("✖️ Bekor qilish", "cc:x")]);
  await render(ctx, lines.join("\n"), kb(rows));
}

function draftSummary(d: ChildDraft): string {
  const region = getRegion(d.regionId);
  const concerns = d.concerns.map((i) => CONCERN_OPTIONS[i]).filter(Boolean);
  return [
    `${d.gender === "qiz" ? "👧" : "👦"} Ism: <b>${esc(d.name)}</b>`,
    `🎂 Yoshi: <b>${d.age} yosh</b>`,
    `👤 Jinsi: ${d.gender === "qiz" ? "qiz bola" : "o‘g‘il bola"}`,
    `🤔 Tashvishlar: ${concerns.length ? esc(concerns.join(", ")) : "<i>yo‘q</i>"}`,
    `📍 Hudud: ${region ? esc(region.name) : "—"}${d.district ? `, ${esc(districtLabel(d.district))}` : ""}`,
  ].join("\n");
}

async function showConfirm(ctx: BotContext, d: ChildDraft): Promise<void> {
  if (!d.age || !d.gender) {
    await showAge(ctx, d);
    return;
  }
  await render(
    ctx,
    `📋 <b>Ma’lumotlarni tekshiring</b>\n\n${draftSummary(d)}\n\n🔐 Ma’lumotlar faqat sizga va siz ruxsat bergan mutaxassislarga ko‘rinadi.`,
    kb([
      [btn("✅ Saqlash", "cc:ok")],
      [btn("✏️ Qaytadan", "cc:new"), btn("✖️ Bekor qilish", "cc:x")],
    ]),
  );
}

/** Yosh → tug‘ilgan sana: bugundan (yosh + 0,5) yil oldin, oy o‘rtasi */
function birthDateFor(age: number): string {
  const d = new Date(`${todayKey()}T00:00:00Z`);
  d.setUTCDate(15);
  d.setUTCMonth(d.getUTCMonth() - (age * 12 + 6));
  return d.toISOString().slice(0, 10);
}

async function save(ctx: BotContext): Promise<void> {
  const d = await needDraft(ctx);
  if (!d) return;
  if (!d.age || !d.gender || !d.regionId || !d.district) {
    await showConfirm(ctx, d);
    return;
  }
  const concerns = d.concerns.map((i) => CONCERN_OPTIONS[i]).filter(Boolean);
  const { result, view } = await actAs(ctx, {
    type: "child.create",
    child: {
      name: d.name ?? "",
      birthDate: birthDateFor(d.age),
      gender: d.gender,
      region: d.regionId,
      district: d.district,
      concerns,
    },
  });
  if (!result.ok || !result.createdId) {
    toast(ctx, result.error ?? "Saqlab bo‘lmadi", true);
    return;
  }
  ctx.session.draft = undefined;
  ctx.session.step = undefined;

  // Foydalanuvchi hududini ham yangilaymiz (sessiyalar, mutaxassislar va eslatmalar uchun)
  let finalView = view;
  if (view.user.region !== d.regionId || view.user.district !== d.district || !view.user.onboarded) {
    const upd = await actAs(ctx, { type: "user.update", patch: { region: d.regionId, district: d.district, onboarded: true } });
    finalView = upd.view;
  }

  const child = finalView.children.find((c) => c.id === result.createdId) as Child | undefined;
  const cd = child ? childData(finalView, child.id) : undefined;
  const tasks = cd ? todayTasks(cd.plan, cd.assignments, cd.activities) : [];
  toast(ctx, "🎉 Profil yaratildi!");
  await render(
    ctx,
    [
      `🎉 <b>${esc(d.name)} profili yaratildi!</b>`,
      "",
      draftSummary(d),
      "",
      tasks.length
        ? `🎯 Individual reja tayyor — bugun <b>${tasks.length} ta</b> mashq kutmoqda.`
        : "🎯 Individual reja tayyor.",
      "📝 Keyingi qadam: 24 ta qisqa savol orqali rivojlanishni baholang (5–7 daqiqa) — reja aniqroq bo‘ladi.",
    ].join("\n"),
    kb([
      [nbtn("📝 Savolnomani boshlash", `qz:i:${result.createdId}`)],
      [btn("🎯 Bugungi mashqlar", "m:ex"), appBtn("🌐 Ilovada ko‘rish", "/child")],
    ]),
  );
}
