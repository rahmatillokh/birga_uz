import type { Bot } from "grammy";
import { REGIONS, districtLabel, regionName } from "@/data/regions";
import { SPECIALISTS, getSpecialist, specialistSlots, specialistsBy } from "@/data/specialists";
import { DOMAINS, DOMAIN_ORDER, SPECIALTIES, SPECIALTY_ORDER } from "@/lib/constants";
import { specialistForDomain } from "@/lib/core/scoring";
import type { Specialist, SpecialtyId, UserView } from "@/lib/types";
import { todayKey } from "@/lib/utils";
import { actAs, viewOf } from "../api";
import type { BotContext, ConsultDraft } from "../context";
import { activeChild, childData, isPremium, regionIndex } from "../data";
import { screens, steps } from "../nav";
import { shortRegion } from "../pickers";
import { MODE_LABEL } from "../texts";
import { appBtn, btn, chunk, clip, dayLabel, esc, kb, longDate, money, nbtn, nowHHMM, render, send, shortDate, toast, type Btn } from "../ui";

/**
 * 8. 👨‍⚕️ Mutaxassis topish: yo‘nalish → hudud filtri → ro‘yxat → karta
 * 9. 📞 Mutaxassis bilan bog‘lanish: online/offline → kun → vaqt → izoh → booking.create (kind: consultation)
 */
export function registerSpecialists(bot: Bot<BotContext>): void {
  screens.set("sp", openSpecialties);
  steps.set("sp.note", onNote);

  bot.callbackQuery("sp:home", openSpecialties);
  bot.callbackQuery(/^sp:t:(\d+)$/, (ctx) => showList(ctx, Number(ctx.match[1])));
  bot.callbackQuery(/^sp:l:(\d+):(a|\d+)$/, (ctx) => showList(ctx, Number(ctx.match[1]), ctx.match[2]));
  bot.callbackQuery(/^sp:rg:(\d+)$/, (ctx) => chooseRegion(ctx, Number(ctx.match[1])));
  bot.callbackQuery(/^sp:v:([^:]+):(a|\d+)$/, (ctx) => showCard(ctx, ctx.match[1], ctx.match[2]));
  bot.callbackQuery(/^sp:c:([^:]+)$/, (ctx) => chooseMode(ctx, ctx.match[1]));
  bot.callbackQuery(/^sp:m:([^:]+):([of])$/, (ctx) => chooseDate(ctx, ctx.match[1], ctx.match[2] === "o" ? "online" : "offline"));
  bot.callbackQuery(/^sp:d:([^:]+):([of]):(\d{4}-\d{2}-\d{2})$/, (ctx) =>
    chooseTime(ctx, ctx.match[1], ctx.match[2] === "o" ? "online" : "offline", ctx.match[3]),
  );
  bot.callbackQuery(/^sp:h:([^:]+):([of]):(\d{4}-\d{2}-\d{2}):(\d{2})(\d{2})$/, (ctx) =>
    askNote(ctx, {
      spId: ctx.match[1],
      mode: ctx.match[2] === "o" ? "online" : "offline",
      date: ctx.match[3],
      time: `${ctx.match[4]}:${ctx.match[5]}`,
    }),
  );
  bot.callbackQuery("sp:nn", async (ctx) => {
    const c = ctx.session.consult;
    ctx.session.step = undefined;
    if (!c) return expired(ctx);
    await showConfirm(ctx, c);
  });
  bot.callbackQuery(/^sp:k:(.+)$/, async (ctx) => {
    const c = ctx.session.consult;
    if (!c) return expired(ctx);
    c.childId = ctx.match[1];
    await showConfirm(ctx, c);
  });
  bot.callbackQuery("sp:ok", confirmBooking);
  bot.callbackQuery("sp:x", async (ctx) => {
    ctx.session.consult = undefined;
    ctx.session.step = undefined;
    toast(ctx, "Bekor qilindi");
    await render(ctx, "✖️ Yozilish bekor qilindi.", kb([[btn("👨‍⚕️ Mutaxassislar", "sp:home")]]));
  });
}

async function expired(ctx: BotContext): Promise<void> {
  toast(ctx, "Jarayon eskirgan — mutaxassisni qaytadan tanlang", true);
  await openSpecialties(ctx);
}

// ---------------------------------------------------------------------------
// 8. Yo‘nalishlar va ro‘yxat
// ---------------------------------------------------------------------------

async function openSpecialties(ctx: BotContext): Promise<void> {
  const view = await viewOf(ctx);
  const child = activeChild(view);
  const latest = child ? childData(view, child.id).latest : undefined;
  const lines = [
    "👨‍⚕️ <b>Mutaxassis topish</b>",
    "",
    `YuniQo’dagi <b>${SPECIALISTS.length} ta</b> tekshirilgan mutaxassis: logopedlar, defektologlar, psixologlar va boshqalar. Online yoki offline konsultatsiyaga shu yerning o‘zida yozilasiz.`,
  ];
  let recommended: SpecialtyId | undefined;
  if (child && latest) {
    const weak = [...DOMAIN_ORDER].sort((a, b) => latest.scores[a] - latest.scores[b])[0];
    recommended = specialistForDomain(weak);
    lines.push("", `💡 ${esc(child.name)} uchun tavsiya: <b>${SPECIALTIES[recommended].label}</b> (${DOMAINS[weak].label.toLowerCase()} — ${latest.scores[weak]}%)`);
  }
  lines.push("", "Yo‘nalishni tanlang 👇");
  const buttons = SPECIALTY_ORDER.map((id, i) => {
    const s = SPECIALTIES[id];
    const n = specialistsBy({ specialty: id }).length;
    return btn(`${id === recommended ? "⭐ " : ""}${s.emoji} ${s.label} (${n})`, `sp:t:${i}`);
  });
  await render(ctx, lines.join("\n"), kb([...chunk(buttons, 2), [btn("📋 Mening yozilishlarim", "bk:l")]]));
}

function sortSpecialists(list: Specialist[]): Specialist[] {
  return [...list].sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
}

function priceLine(s: Specialist): string {
  const parts: string[] = [];
  if (s.services.includes("online")) parts.push(`💻 Online ${money(s.priceOnline)}`);
  if (s.services.includes("offline")) parts.push(`🏥 Offline ${money(s.priceOffline)}`);
  return parts.join(" · ");
}

async function showList(ctx: BotContext, specIdx: number, rTok?: string): Promise<void> {
  const specialty = SPECIALTY_ORDER[specIdx];
  if (!specialty) return openSpecialties(ctx);
  const view = await viewOf(ctx);
  const info = SPECIALTIES[specialty];

  // Hudud: tanlangan / foydalanuvchi hududi (u yerda mutaxassis bo‘lsa) / barcha hududlar
  let regionId: string | undefined;
  if (rTok === undefined) {
    const ur = view.user.region;
    regionId = ur && specialistsBy({ specialty, region: ur }).length ? ur : undefined;
  } else if (rTok !== "a") {
    regionId = REGIONS[Number(rTok)]?.id;
  }
  const token = regionId ? String(regionIndex(regionId)) : "a";
  const list = sortSpecialists(specialistsBy({ specialty, region: regionId }));

  const lines = [
    `${info.emoji} <b>${esc(info.label)}</b> · ${regionId ? `📍 ${esc(regionName(regionId))}` : "🌍 Barcha hududlar"}`,
    `<i>${esc(info.description)}</i>`,
    "",
  ];
  if (!list.length) {
    lines.push("Bu hududda hozircha bu yo‘nalish bo‘yicha mutaxassis yo‘q 😔", "Online konsultatsiya uchun boshqa hududlardagi mutaxassislarni ko‘ring 👇");
  } else {
    lines.push(`Topildi: <b>${list.length} ta</b> mutaxassis`, "");
    list.slice(0, 8).forEach((s, i) => {
      lines.push(`${i + 1}. <b>${esc(s.name)}</b>${s.verified ? " ✔️" : ""}`);
      lines.push(`     ⭐ ${s.rating} (${s.reviewsCount} sharh) · ${s.experienceYears} yil tajriba`);
      lines.push(`     ${priceLine(s)}`);
      lines.push(`     📍 ${regionId ? esc(districtLabel(s.district)) : `${esc(shortRegion(regionName(s.region)))}, ${esc(districtLabel(s.district))}`}`);
    });
    if (list.length > 8) lines.push("", `… va yana ${list.length - 8} ta — barchasi ilovada.`);
  }
  const userR = regionIndex(view.user.region);
  const rows: Btn[][] = list.slice(0, 8).map((s) => [btn(`👤 ${s.name} · ⭐ ${s.rating}`, `sp:v:${s.id}:${token}`)]);
  rows.push([
    btn(`📍 ${regionId ? `${shortRegion(regionName(regionId))} ✓` : "Hududni tanlash"}`, `sp:rg:${specIdx}`),
    btn(`🌍 Barcha hududlar${regionId ? "" : " ✓"}`, `sp:l:${specIdx}:a`),
  ]);
  if (userR >= 0 && regionId !== view.user.region) rows.push([btn(`🏠 Mening hududim: ${shortRegion(regionName(view.user.region))}`, `sp:l:${specIdx}:${userR}`)]);
  rows.push([btn("⬅️ Yo‘nalishlar", "sp:home"), appBtn("🌐 Ilovada", "/specialists")]);
  await render(ctx, lines.join("\n"), kb(rows));
}

async function chooseRegion(ctx: BotContext, specIdx: number): Promise<void> {
  const specialty = SPECIALTY_ORDER[specIdx];
  if (!specialty) return openSpecialties(ctx);
  const buttons = REGIONS.map((r, i) => {
    const n = specialistsBy({ specialty, region: r.id }).length;
    return btn(`${shortRegion(r.name)}${n ? ` (${n})` : ""}`, `sp:l:${specIdx}:${i}`);
  });
  await render(
    ctx,
    `📍 <b>Hududni tanlang</b>\n${SPECIALTIES[specialty].emoji} ${esc(SPECIALTIES[specialty].label)} — qavs ichida mutaxassislar soni.`,
    kb([...chunk(buttons, 2), [btn("🌍 Barcha hududlar", `sp:l:${specIdx}:a`)], [btn("⬅️ Orqaga", `sp:t:${specIdx}`)]]),
  );
}

// ---------------------------------------------------------------------------
// Karta
// ---------------------------------------------------------------------------

/** Bugundan boshlab bo‘sh vaqtlar (bugungi o‘tgan soatlarsiz) */
function freeSlots(spId: string): { date: string; times: string[] }[] {
  const today = todayKey();
  const now = nowHHMM();
  return specialistSlots(spId, today)
    .map((d) => ({ date: d.date, times: d.times.filter((t) => d.date !== today || t > now) }))
    .filter((d) => d.times.length);
}

async function showCard(ctx: BotContext, spId: string, rTok: string): Promise<void> {
  const s = getSpecialist(spId);
  if (!s) {
    toast(ctx, "Mutaxassis topilmadi", true);
    return;
  }
  const info = SPECIALTIES[s.specialty];
  const lines = [
    `${info.emoji} <b>${esc(s.name)}</b>${s.verified ? " ✔️ <i>tasdiqlangan</i>" : ""}`,
    `${esc(s.title)} · ${esc(info.label)}`,
    `⭐ ${s.rating} (${s.reviewsCount} ta sharh) · ${s.experienceYears} yil tajriba`,
    "",
    `🏥 ${esc(s.workplace)}`,
    `📍 ${esc(regionName(s.region))}, ${esc(districtLabel(s.district))}`,
    `💰 ${priceLine(s)}`,
    `🗣 Tillar: ${esc(s.languages.join(", "))}`,
    s.freeSessions ? "🏢 Bepul tuman sessiyalarida qatnashadi" : "",
    "",
    `📝 ${esc(clip(s.about, 600))}`,
  ].filter((l, i, arr) => l || arr[i - 1] !== "");
  if (s.approach.length) lines.push("", `🎯 <b>Yo‘nalishlari:</b> ${esc(s.approach.slice(0, 4).join(", "))}`);
  if (s.certificates.length) {
    lines.push("", "🎓 <b>Sertifikatlar:</b>");
    for (const c of s.certificates.slice(0, 4)) lines.push(`• ${esc(c.title)} — ${esc(c.issuer)}, ${c.year}`);
  }
  const slots = freeSlots(s.id).slice(0, 3);
  lines.push("", "🗓 <b>Yaqin bo‘sh vaqtlar:</b>");
  if (slots.length) {
    for (const d of slots) lines.push(`• ${dayLabel(d.date)}: ${d.times.slice(0, 5).join(", ")}${d.times.length > 5 ? " …" : ""}`);
  } else {
    lines.push("Yaqin kunlarda bo‘sh vaqt yo‘q.");
  }
  const back = rTok === "a" || /^\d+$/.test(rTok) ? `sp:l:${SPECIALTY_ORDER.indexOf(s.specialty)}:${rTok}` : "sp:home";
  await render(
    ctx,
    lines.join("\n"),
    kb([
      [btn("📞 Bog‘lanish", `sp:c:${s.id}`), appBtn("👤 Profil", `/specialists/${s.id}`)],
      [btn("⬅️ Ro‘yxatga qaytish", back)],
    ]),
  );
}

// ---------------------------------------------------------------------------
// 9. Bog‘lanish (konsultatsiyaga yozilish)
// ---------------------------------------------------------------------------

function premiumNote(view: UserView): string {
  if (isPremium(view) && (view.user.premium.consultationsLeft ?? 0) > 0) {
    return "💎 Premium: bu konsultatsiya siz uchun <b>bepul</b> (oylik limitdan).";
  }
  return "";
}

async function chooseMode(ctx: BotContext, spId: string): Promise<void> {
  const s = getSpecialist(spId);
  if (!s) return expired(ctx);
  const view = await viewOf(ctx);
  const lines = [`📞 <b>${esc(s.name)} bilan bog‘lanish</b>`, "", "Konsultatsiya turini tanlang:"];
  if (s.services.includes("online")) lines.push("💻 <b>Online</b> — video qo‘ng‘iroq orqali, uydan turib");
  if (s.services.includes("offline")) lines.push(`🏥 <b>Offline</b> — ${esc(s.workplace)}da`);
  const note = premiumNote(view);
  if (note) lines.push("", note);
  await render(
    ctx,
    lines.join("\n"),
    kb([
      s.services.includes("online") ? [btn(`💻 Online · ${money(s.priceOnline)}`, `sp:m:${s.id}:o`)] : [],
      s.services.includes("offline") ? [btn(`🏥 Offline · ${money(s.priceOffline)}`, `sp:m:${s.id}:f`)] : [],
      [btn("⬅️ Orqaga", `sp:v:${s.id}:a`)],
    ]),
  );
}

function modeCode(mode: "online" | "offline"): string {
  return mode === "online" ? "o" : "f";
}

async function chooseDate(ctx: BotContext, spId: string, mode: "online" | "offline"): Promise<void> {
  const s = getSpecialist(spId);
  if (!s) return expired(ctx);
  const slots = freeSlots(s.id);
  if (!slots.length) {
    await render(ctx, `😔 ${esc(s.name)}da yaqin 7 kunda bo‘sh vaqt qolmagan.\nBoshqa mutaxassisni tanlang yoki keyinroq urinib ko‘ring.`, kb([[btn("⬅️ Orqaga", `sp:v:${s.id}:a`)]]));
    return;
  }
  const buttons = slots.map((d) => btn(`${d.date === todayKey() ? "Bugun" : shortDate(d.date)} · ${d.times.length} ta vaqt`, `sp:d:${s.id}:${modeCode(mode)}:${d.date}`));
  await render(
    ctx,
    `📅 <b>Qulay kunni tanlang</b>\n${esc(s.name)} · ${MODE_LABEL[mode]}`,
    kb([...chunk(buttons, 2), [btn("⬅️ Orqaga", `sp:c:${s.id}`)]]),
  );
}

async function chooseTime(ctx: BotContext, spId: string, mode: "online" | "offline", date: string): Promise<void> {
  const s = getSpecialist(spId);
  if (!s) return expired(ctx);
  const day = freeSlots(s.id).find((d) => d.date === date);
  if (!day) {
    toast(ctx, "Bu kunda bo‘sh vaqt qolmadi");
    await chooseDate(ctx, spId, mode);
    return;
  }
  const buttons = day.times.map((t) => btn(`🕐 ${t}`, `sp:h:${s.id}:${modeCode(mode)}:${date}:${t.replace(":", "")}`));
  await render(
    ctx,
    `🕐 <b>Vaqtni tanlang</b>\n${esc(s.name)} · ${MODE_LABEL[mode]}\n📅 ${longDate(date)}`,
    kb([...chunk(buttons, 3), [btn("⬅️ Boshqa kun", `sp:m:${s.id}:${modeCode(mode)}`)]]),
  );
}

async function askNote(ctx: BotContext, draft: Omit<ConsultDraft, "childId" | "note">): Promise<void> {
  const s = getSpecialist(draft.spId);
  if (!s) return expired(ctx);
  const view = await viewOf(ctx);
  ctx.session.consult = { ...draft, childId: activeChild(view)?.id };
  ctx.session.step = "sp.note";
  await render(
    ctx,
    [
      "📝 <b>Mutaxassisga izoh qoldirasizmi?</b>",
      "",
      "Bolangiz haqida qisqacha yozing — masalan: <i>«3 yosh, kam gapiradi, «r» tovushini aytolmaydi»</i>. Bu ixtiyoriy.",
    ].join("\n"),
    kb([[btn("⏭️ Izohsiz davom etish", "sp:nn")], [btn("✖️ Bekor qilish", "sp:x")]]),
  );
}

async function onNote(ctx: BotContext): Promise<void> {
  const c = ctx.session.consult;
  const text = ctx.message?.text?.trim();
  if (!c) {
    ctx.session.step = undefined;
    return expired(ctx);
  }
  if (!text) {
    await send(ctx, "✍️ Izohni matn ko‘rinishida yozing yoki «Izohsiz davom etish»ni bosing.", kb([[btn("⏭️ Izohsiz davom etish", "sp:nn")]]));
    return;
  }
  c.note = clip(text, 500);
  ctx.session.step = undefined;
  await showConfirm(ctx, c);
}

async function showConfirm(ctx: BotContext, c: ConsultDraft): Promise<void> {
  const s = getSpecialist(c.spId);
  if (!s) return expired(ctx);
  const view = await viewOf(ctx);
  const child = view.children.find((x) => x.id === c.childId) ?? activeChild(view);
  c.childId = child?.id;
  const price = c.mode === "online" ? s.priceOnline : s.priceOffline;
  const premium = premiumNote(view);
  const lines = [
    "✅ <b>Yozilishni tasdiqlang</b>",
    "",
    `👩‍⚕️ ${esc(s.name)} — ${esc(SPECIALTIES[s.specialty].label)}`,
    `${MODE_LABEL[c.mode]}`,
    `📅 ${longDate(c.date)} · ${c.time}`,
    premium ? premium : `💰 ${money(price)}`,
    child ? `👶 Bola: ${child.avatar} ${esc(child.name)}` : "👶 Bola profili tanlanmagan",
    c.note ? `📝 Izoh: <i>${esc(c.note)}</i>` : "",
    "",
    view.user.consents.shareWithSpecialists && child
      ? `🔐 Yozilgach, ${esc(child.name)}ning baholash natijalari va mashqlar tarixi mutaxassisga <b>avtomatik ulashiladi</b> (siz bergan rozilik asosida). Buni ilovadagi «Xavfsizlik» bo‘limida boshqarishingiz mumkin.`
      : "🔐 Natijalarni mutaxassisga ulashish o‘chirilgan — kerak bo‘lsa, ilovadagi «Xavfsizlik» bo‘limida yoqishingiz mumkin.",
  ].filter((l, i, arr) => l || arr[i - 1] !== "");
  const rows: Btn[][] = [[btn("✅ Tasdiqlash", "sp:ok"), btn("✖️ Bekor qilish", "sp:x")]];
  if (view.children.length > 1) {
    rows.push(
      ...chunk(
        view.children.map((x) => btn(`${x.id === child?.id ? "✅" : "▫️"} ${x.avatar} ${clip(x.name, 14)}`, `sp:k:${x.id}`)),
        2,
      ),
    );
  }
  await render(ctx, lines.join("\n"), kb(rows));
}

async function confirmBooking(ctx: BotContext): Promise<void> {
  const c = ctx.session.consult;
  if (!c) return expired(ctx);
  const s = getSpecialist(c.spId);
  if (!s) return expired(ctx);
  const { result, view } = await actAs(ctx, {
    type: "booking.create",
    kind: "consultation",
    specialistId: c.spId,
    mode: c.mode,
    date: c.date,
    time: c.time,
    childId: c.childId,
    note: c.note,
    source: "bot",
  });
  if (!result.ok) {
    toast(ctx, result.error ?? "Yozilib bo‘lmadi", true);
    if (/band/i.test(result.error ?? "")) await chooseTime(ctx, c.spId, c.mode, c.date);
    return;
  }
  ctx.session.consult = undefined;
  ctx.session.step = undefined;
  const booking = view.bookings.find((b) => b.id === result.createdId);
  const child = view.children.find((x) => x.id === c.childId);
  const shared = !!child && view.user.consents.shareWithSpecialists;
  toast(ctx, "📨 So‘rov yuborildi!");
  await render(
    ctx,
    [
      "📨 <b>So‘rov yuborildi!</b>",
      "",
      `${esc(s.name)} so‘rovingizni ko‘rib chiqib <b>tasdiqlaydi</b> — tasdiqlanganda shu yerga xabar keladi 🔔`,
      "",
      `📅 ${longDate(c.date)} · ${c.time}`,
      `${MODE_LABEL[c.mode]}${booking?.premium ? " · 💎 Premium (bepul)" : ""}`,
      child ? `👶 ${child.avatar} ${esc(child.name)}` : "",
      "",
      shared
        ? `🔐 ${esc(child?.name ?? "")}ning natijalari mutaxassisga avtomatik ulashildi (rozilik asosida). Ulashishni ilovadagi «Xavfsizlik» bo‘limida istalgan vaqtda boshqarishingiz mumkin.`
        : "🔐 Natijalar ulashilmadi. Ilovadagi «Xavfsizlik» bo‘limida sozlashingiz mumkin.",
    ]
      .filter((l, i, arr) => l || arr[i - 1] !== "")
      .join("\n"),
    kb([
      [btn("📋 Mening yozilishlarim", "bk:l"), appBtn("👨‍⚕️ Konsultatsiyalarim", "/cabinet")],
      [appBtn("🔐 Xavfsizlik", "/settings")],
      [nbtn("🎯 Bugungi mashqlar", "m:ex")],
    ]),
  );
}
