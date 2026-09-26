import { InputFile, type Bot } from "grammy";
import { REGIONS, districtLabel, getRegion } from "@/data/regions";
import { getSpecialist } from "@/data/specialists";
import { MONTHS, SESSION_TYPES, SPECIALTIES, WEEKDAYS } from "@/lib/constants";
import type { Booking, FreeSession, SessionType, UserView } from "@/lib/types";
import { todayKey, weekdayOf } from "@/lib/utils";
import { actAs, viewOf } from "../api";
import type { BotContext } from "../context";
import { activeChild, districtIndex, findSession, freeSeats, regionIndex, upcomingSessions } from "../data";
import { screens } from "../nav";
import { myDistrictRows, registerPicker, shortRegion, showRegions } from "../pickers";
import { BOOKING_STATUS, MODE_LABEL } from "../texts";
import { appBtn, btn, capitalize, clip, esc, kb, longDate, nbtn, pad2, render, shortDate, toast, type Btn } from "../ui";

/**
 * 6. 📅 Bepul sessiyalarga yozilish (hudud → tuman → ro‘yxat → karta → booking.create) + «Mening yozilishlarim»
 * 7. 📍 Tumandagi sessiyalar haqida ma’lumot (kelgusi 5 ta + oylik kalendar)
 * 10. 🏢 Yaqin sessiya haqida xabar (user.sessionAlerts)
 */
export function registerSessions(bot: Bot<BotContext>): void {
  screens.set("ss", openSessions);
  screens.set("dz", openDistrictInfo);
  screens.set("al", openAlerts);
  screens.set("bk", (ctx) => openBookings(ctx));

  // --- 6. Sessiyalarga yozilish
  registerPicker(bot, "ss", {
    regionsText: sessionsIntro(),
    districtsText: (name) => `🏘 <b>${esc(name)}</b>\nTuman yoki shaharni tanlang — u yerdagi bepul sessiyalarni ko‘rsataman:`,
    topRows: async (ctx) => myDistrictRows(await viewOf(ctx), "ss"),
    bottomRows: [[btn("📋 Mening yozilishlarim", "bk:l")]],
    onDistrict: (ctx, regionId, district) => showDistrictSessions(ctx, regionId, district),
  });
  bot.callbackQuery(/^ss:s:(.+)$/, (ctx) => showSession(ctx, ctx.match[1]));
  bot.callbackQuery(/^ss:b:(.+)$/, (ctx) => bookSession(ctx, ctx.match[1]));
  bot.callbackQuery(/^ss:sv:(\d+):(\d+)$/, async (ctx) => {
    const region = REGIONS[Number(ctx.match[1])];
    const district = region?.districts[Number(ctx.match[2])];
    if (!region || !district) return;
    await actAs(ctx, { type: "user.update", patch: { region: region.id, district } });
    toast(ctx, `📌 ${districtLabel(district)} profilingizga saqlandi`);
    await showDistrictSessions(ctx, region.id, district);
  });

  // --- Mening yozilishlarim
  bot.callbackQuery("bk:l", (ctx) => openBookings(ctx));
  bot.callbackQuery(/^bk:c:(.+)$/, (ctx) => confirmCancel(ctx, ctx.match[1]));
  bot.callbackQuery(/^bk:y:(.+)$/, async (ctx) => {
    const { result, view } = await actAs(ctx, { type: "booking.cancel", bookingId: ctx.match[1] });
    if (!result.ok) {
      toast(ctx, result.error ?? "Bekor qilib bo‘lmadi", true);
      return;
    }
    toast(ctx, "❌ Yozilish bekor qilindi");
    await openBookings(ctx, view);
  });

  // --- 7. Tuman ma’lumoti
  registerPicker(bot, "dz", {
    regionsText: "📍 <b>Qaysi tumanda yashaysiz?</b>\n\nTumaningizdagi bepul YuniQo sessiyalari, kunlari va kalendarini ko‘rsataman.",
    onDistrict: async (ctx, regionId, district) => {
      const { view } = await actAs(ctx, { type: "user.update", patch: { region: regionId, district } });
      toast(ctx, `📌 ${districtLabel(district)} saqlandi`);
      await render(ctx, districtInfoText(view, regionId, district), districtInfoKb(view, regionId, district));
    },
  });

  // --- 10. Sessiya xabarlari
  registerPicker(bot, "al", {
    regionsText: "🏢 <b>Qaysi tumandagi sessiyalar haqida xabar beray?</b>\n\nHududingizni tanlang:",
    onDistrict: async (ctx, regionId, district) => {
      const { view } = await actAs(ctx, { type: "user.update", patch: { region: regionId, district } });
      toast(ctx, `📌 ${districtLabel(district)} saqlandi`);
      await render(ctx, alertsText(view), alertsKb(view));
    },
  });
  bot.callbackQuery(/^al:(on|off):([az])$/, async (ctx) => {
    const enabled = ctx.match[1] === "on";
    let { view } = await actAs(ctx, { type: "user.sessionAlerts", enabled });
    // Xabarlar eslatmalar bilan birga keladi — sessiya turini ham yoqib qo‘yamiz
    if (enabled && !view.user.reminders.types.sessions) {
      ({ view } = await actAs(ctx, {
        type: "user.reminders",
        reminders: { types: { ...view.user.reminders.types, sessions: true } },
      }));
    }
    toast(ctx, enabled ? "🔔 Sessiya xabarlari yoqildi" : "🔕 Sessiya xabarlari o‘chirildi");
    const { region, district } = view.user;
    if (ctx.match[2] === "z" && region && district) await render(ctx, districtInfoText(view, region, district), districtInfoKb(view, region, district));
    else await render(ctx, alertsText(view), alertsKb(view));
  });
}

// ---------------------------------------------------------------------------
// 6. Sessiyalar
// ---------------------------------------------------------------------------

function sessionsIntro(): string {
  return [
    "📅 <b>Bepul YuniQo sessiyalari</b>",
    "",
    "Har bir tumanda haftasiga 2 marta: 🩺 mutaxassis konsultatsiyasi, 🎓 ota-onalar seminari, 🧸 bolalar uchun amaliy mashg‘ulot va 🤝 mutaxassislar bilan uchrashuv. Barchasi bepul!",
    "",
    "Hududingizni tanlang 👇",
  ].join("\n");
}

async function openSessions(ctx: BotContext): Promise<void> {
  await showRegions(ctx, "ss");
}

function seatsLabel(n: number): string {
  if (n <= 0) return "🔴 joy qolmagan";
  if (n <= 3) return `🟠 ${n} ta joy qoldi`;
  return `🟢 ${n} ta bo‘sh joy`;
}

async function showDistrictSessions(ctx: BotContext, regionId: string, district: string): Promise<void> {
  const view = await viewOf(ctx);
  const region = getRegion(regionId);
  const list = upcomingSessions(regionId, district).slice(0, 8);
  const rIdx = regionIndex(regionId);
  const dIdx = districtIndex(regionId, district);
  const lines = [`📅 <b>${esc(districtLabel(district))}</b> · ${esc(region?.name ?? "")}`, ""];
  if (!list.length) {
    lines.push("Yaqin 4 haftada bu tumanda sessiya rejalashtirilmagan. Qo‘shni tumanlarni ko‘rib chiqing 🙏");
  } else {
    lines.push("Yaqin bepul sessiyalar:", "");
    list.forEach((s, i) => {
      const t = SESSION_TYPES[s.type];
      const mine = view.bookings.some((b) => b.sessionId === s.id && b.status !== "bekor");
      lines.push(`${i + 1}. ${t.emoji} <b>${longDate(s.date)}</b> · ${s.time}${mine ? " · ✅ siz yozilgansiz" : ""}`);
      lines.push(`     ${esc(t.label)} · ${seatsLabel(freeSeats(s, view))}`);
    });
  }
  const rows: Btn[][] = list.map((s) => {
    const t = SESSION_TYPES[s.type];
    const free = freeSeats(s, view);
    return [btn(`${t.emoji} ${shortDate(s.date)} · ${s.time} · ${free > 0 ? `${free} joy` : "to‘lgan"}`, `ss:s:${s.id}`)];
  });
  if (!view.user.district && rIdx >= 0 && dIdx >= 0) rows.push([btn("📌 Shu tumanni profilimga saqlash", `ss:sv:${rIdx}:${dIdx}`)]);
  rows.push([btn("🔄 Boshqa tuman", rIdx >= 0 ? `ss:r:${rIdx}` : "ss:rs"), btn("📋 Yozilishlarim", "bk:l")]);
  await render(ctx, lines.join("\n"), kb(rows));
}

function sessionCard(s: FreeSession, view: UserView): string {
  const t = SESSION_TYPES[s.type];
  const free = freeSeats(s, view);
  const taken = s.capacity - free;
  const lines = [
    `${t.emoji} <b>${esc(s.title)}</b>`,
    `<i>${esc(t.label)}</i>`,
    "",
    `📅 ${longDate(s.date)} · ${s.time} (${durationLabel(s.durationMin)})`,
    `📍 ${esc(s.venue)}`,
    `🏠 ${esc(s.address)}`,
    `👶 ${esc(s.ageRange)}`,
    `👥 Joylar: ${taken}/${s.capacity} band · ${seatsLabel(free)}`,
  ];
  const sps = s.specialistIds.map((id) => getSpecialist(id)).filter(Boolean);
  if (sps.length) {
    lines.push("", "👩‍⚕️ <b>Mutaxassislar:</b>");
    for (const sp of sps) if (sp) lines.push(`• ${esc(sp.name)} — ${esc(SPECIALTIES[sp.specialty].label)}${sp.verified ? " ✔️" : ""}`);
  }
  lines.push("", esc(s.description), "", "💚 Qatnashish bepul. Ro‘yxatdan o‘tish shart — joylar soni cheklangan.");
  return lines.join("\n");
}

async function showSession(ctx: BotContext, id: string): Promise<void> {
  const s = findSession(id);
  if (!s) {
    toast(ctx, "Sessiya topilmadi", true);
    return;
  }
  const view = await viewOf(ctx);
  const booking = view.bookings.find((b) => b.sessionId === s.id && b.status !== "bekor");
  const free = freeSeats(s, view);
  const rIdx = regionIndex(s.region);
  const dIdx = districtIndex(s.region, s.district);
  const text = booking ? `✅ <b>Siz bu sessiyaga yozilgansiz</b>\n\n${sessionCard(s, view)}` : sessionCard(s, view);
  await render(
    ctx,
    text,
    kb([
      [booking ? btn("❌ Yozilishni bekor qilish", `bk:c:${booking.id}`) : free > 0 ? btn("✅ Yozilish", `ss:b:${s.id}`) : undefined],
      [rIdx >= 0 && dIdx >= 0 ? btn("⬅️ Sessiyalar", `ss:d:${rIdx}:${dIdx}`) : undefined, appBtn("🌐 Ilovada", "/sessions")],
    ]),
  );
}

async function bookSession(ctx: BotContext, id: string): Promise<void> {
  const s = findSession(id);
  if (!s) {
    toast(ctx, "Sessiya topilmadi", true);
    return;
  }
  const view = await viewOf(ctx);
  const child = activeChild(view);
  const { result, view: v2 } = await actAs(ctx, {
    type: "booking.create",
    kind: "session",
    sessionId: s.id,
    mode: "offline",
    date: s.date,
    time: s.time,
    childId: child?.id,
    source: "bot",
  });
  if (!result.ok) {
    toast(ctx, result.error ?? "Yozilib bo‘lmadi", true);
    await showSession(ctx, id);
    return;
  }
  toast(ctx, "✅ Yozildingiz!");
  await render(ctx, `✅ <b>Siz bu sessiyaga yozilgansiz</b>\n\n${sessionCard(s, v2)}`, kb([
    [btn("❌ Yozilishni bekor qilish", `bk:c:${result.createdId}`)],
    [btn("📋 Mening yozilishlarim", "bk:l")],
  ]));

  const end = addMinutes(s.time, s.durationMin);
  const [y, m, d] = s.date.split("-");
  const lines = [
    "🎉 <b>Bepul YuniQo sessiyasiga yozildingiz!</b>",
    "",
    `📌 ${esc(s.title)}`,
    `📅 ${longDate(s.date)}, ${s.time}`,
    `📍 ${esc(s.venue)}`,
    `🏠 ${esc(s.address)}`,
    child ? `👶 ${child.avatar} ${esc(child.name)}` : "",
    "",
    "🗓 <b>Kalendar uchun eslatma:</b>",
    `<code>YuniQo: ${esc(SESSION_TYPES[s.type].label)}\n${d}.${m}.${y}, ${s.time}–${end}\n${esc(s.venue)}</code>`,
    "",
    "🔔 Sessiyadan bir kun oldin eslatib qo‘yamiz. Rejangiz o‘zgarsa, «📋 Mening yozilishlarim» orqali bekor qiling — joy boshqa oilaga beriladi.",
  ].filter((l, i, arr) => l || arr[i - 1] !== "");
  ctx.forceNew = true;
  await render(ctx, lines.join("\n"), kb([[appBtn("📅 Ilovada ko‘rish", "/sessions?tab=my")]]));
  try {
    await ctx.replyWithDocument(new InputFile(Buffer.from(icsFor(s), "utf8"), "yuniqo-sessiya.ics"), {
      caption: "📅 Faylni oching — sessiya telefoningiz kalendariga qo‘shiladi.",
    });
  } catch (e) {
    console.warn("[sessiya] .ics yuborilmadi:", (e as Error).message);
  }
}

function durationLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} daqiqa`;
  return m ? `${h} soat ${m} daqiqa` : `${h} soat`;
}

function addMinutes(hhmm: string, min: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const t = h * 60 + m + min;
  return `${pad2(Math.floor(t / 60) % 24)}:${pad2(t % 60)}`;
}

/** iCalendar fayli (Toshkent vaqti → UTC) */
function icsFor(s: FreeSession): string {
  const [h, m] = s.time.split(":").map(Number);
  const start = new Date(`${s.date}T00:00:00Z`);
  start.setUTCHours(h - 5, m, 0, 0);
  const end = new Date(start.getTime() + s.durationMin * 60_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const escIcs = (v: string) => v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const fold = (line: string) => {
    const out: string[] = [];
    for (let i = 0; i < line.length; i += 60) out.push((i ? " " : "") + line.slice(i, i + 60));
    return out.join("\r\n");
  };
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//YuniQo//Telegram bot//UZ",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${s.id}@yuniqo`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escIcs(`YuniQo: ${s.title}`)}`,
    `LOCATION:${escIcs(`${s.venue}, ${s.address}`)}`,
    `DESCRIPTION:${escIcs(`${SESSION_TYPES[s.type].label}. ${s.description}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escIcs("YuniQo sessiyasi 2 soatdan keyin")}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n");
}

// ---------------------------------------------------------------------------
// Mening yozilishlarim
// ---------------------------------------------------------------------------

function bookingLines(b: Booking, view: UserView): string[] {
  const child = view.children.find((c) => c.id === b.childId);
  const who = child ? ` · ${child.avatar} ${esc(child.name)}` : "";
  if (b.kind === "session") {
    const s = b.sessionId ? findSession(b.sessionId) : undefined;
    return [
      `🏢 <b>Bepul sessiya</b> — ${BOOKING_STATUS[b.status] ?? b.status}`,
      s ? `     📌 ${esc(clip(s.title, 70))}` : "",
      `     📅 ${longDate(b.date)} · ${b.time}${who}`,
      s ? `     📍 ${esc(s.venue)}` : "",
    ].filter(Boolean);
  }
  const sp = getSpecialist(b.specialistId);
  return [
    `📞 <b>Konsultatsiya</b> — ${BOOKING_STATUS[b.status] ?? b.status}`,
    sp ? `     👩‍⚕️ ${esc(sp.name)} (${esc(SPECIALTIES[sp.specialty].label)}) · ${MODE_LABEL[b.mode]}` : `     ${MODE_LABEL[b.mode]}`,
    `     📅 ${longDate(b.date)} · ${b.time}${who}${b.premium ? " · 💎 Premium" : ""}`,
  ];
}

async function openBookings(ctx: BotContext, v?: UserView): Promise<void> {
  const view = v ?? (await viewOf(ctx));
  const today = todayKey();
  const upcoming = view.bookings
    .filter((b) => b.date >= today && b.status !== "bekor" && b.status !== "otdi")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = view.bookings.filter((b) => b.date < today || b.status === "otdi").length;
  const lines = ["📋 <b>Mening yozilishlarim</b>", ""];
  if (!upcoming.length) {
    lines.push("Hozircha faol yozilishlar yo‘q.", "", "📅 Bepul sessiyaga yoki 👨‍⚕️ mutaxassis konsultatsiyasiga yozilishingiz mumkin.");
  } else {
    for (const b of upcoming.slice(0, 8)) lines.push(...bookingLines(b, view), "");
  }
  if (past) lines.push(`🗂 O‘tgan yozilishlar: ${past} ta (ilovada)`);
  const rows: Btn[][] = upcoming.slice(0, 8).map((b) => [
    btn(`❌ Bekor qilish: ${b.kind === "session" ? "sessiya" : "konsultatsiya"}, ${shortDate(b.date)} ${b.time}`, `bk:c:${b.id}`),
  ]);
  rows.push([nbtn("📅 Sessiyalar", "m:ss"), nbtn("👨‍⚕️ Mutaxassislar", "m:sp")]);
  rows.push([appBtn("🌐 Ilovada ko‘rish", "/sessions?tab=my")]);
  await render(ctx, lines.join("\n").trim(), kb(rows));
}

async function confirmCancel(ctx: BotContext, bookingId: string): Promise<void> {
  const view = await viewOf(ctx);
  const b = view.bookings.find((x) => x.id === bookingId);
  if (!b || b.status === "bekor") {
    toast(ctx, "Yozilish topilmadi yoki allaqachon bekor qilingan");
    await openBookings(ctx, view);
    return;
  }
  await render(
    ctx,
    ["❓ <b>Yozilishni bekor qilasizmi?</b>", "", ...bookingLines(b, view)].join("\n"),
    kb([[btn("✅ Ha, bekor qilish", `bk:y:${b.id}`), btn("⬅️ Yo‘q, qolsin", "bk:l")]]),
  );
}

// ---------------------------------------------------------------------------
// 7. Tumandagi sessiyalar haqida ma’lumot
// ---------------------------------------------------------------------------

async function openDistrictInfo(ctx: BotContext): Promise<void> {
  const view = await viewOf(ctx);
  const { region, district } = view.user;
  if (!region || !district || districtIndex(region, district) < 0) {
    await showRegions(ctx, "dz");
    return;
  }
  await render(ctx, districtInfoText(view, region, district), districtInfoKb(view, region, district));
}

/** Oylik kalendar (monospace): sessiya kunlari [29] ko‘rinishida belgilanadi */
function monthGrid(year: number, month: number, marked: Set<string>): string {
  const mm = pad2(month);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: string[] = Array(weekdayOf(`${year}-${mm}-01`) - 1).fill("    ");
  for (let d = 1; d <= days; d++) {
    const n = String(d).padStart(2, " ");
    cells.push(marked.has(`${year}-${mm}-${pad2(d)}`) ? `[${n}]` : ` ${n} `);
  }
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7).join("").trimEnd());
  const title = `${capitalize(MONTHS[month - 1])} ${year}`;
  return [title.padStart(Math.floor((28 + title.length) / 2)), " Du  Se  Ch  Pa  Ju  Sh  Ya", ...rows].join("\n");
}

function districtInfoText(view: UserView, regionId: string, district: string): string {
  const region = getRegion(regionId);
  const list = upcomingSessions(regionId, district);
  const lines = [`📍 <b>${esc(districtLabel(district))}</b> · ${esc(region?.name ?? "")}`, ""];
  if (!list.length) {
    lines.push("Yaqin 4 haftada bu tumanda bepul sessiya rejalashtirilmagan.");
    return lines.join("\n");
  }
  lines.push("🏢 <b>Yaqin bepul sessiyalar:</b>");
  list.slice(0, 5).forEach((s, i) => {
    const t = SESSION_TYPES[s.type];
    lines.push(`${i + 1}. ${t.emoji} <b>${shortDate(s.date)}</b> · ${s.time} — ${esc(t.label)}`);
    lines.push(`     📍 ${esc(s.venue)} · ${seatsLabel(freeSeats(s, view))}`);
  });

  const weekdays = [...new Set(list.map((s) => weekdayOf(s.date)))].sort();
  lines.push("", `📆 Sessiya kunlari: har ${weekdays.map((w) => WEEKDAYS[w - 1].toLowerCase()).join(" va ")}`);

  // Oylar bo‘yicha kalendar va turlar statistikasi
  const months = [...new Set(list.map((s) => s.date.slice(0, 7)))].slice(0, 2);
  const marked = new Set(list.map((s) => s.date));
  const grids = months.map((ym) => monthGrid(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), marked));
  lines.push("", `<pre>${grids.join("\n\n")}</pre>`, "<i>[ ] — bepul sessiya kuni</i>");
  for (const ym of months) {
    const inMonth = list.filter((s) => s.date.startsWith(ym));
    const byType = (Object.keys(SESSION_TYPES) as SessionType[])
      .map((t) => ({ t, n: inMonth.filter((s) => s.type === t).length }))
      .filter((x) => x.n);
    lines.push(
      `🗓 ${capitalize(MONTHS[Number(ym.slice(5, 7)) - 1])}: <b>${inMonth.length} ta</b> sessiya — ${byType.map((x) => `${SESSION_TYPES[x.t].emoji} ${x.n}`).join(" · ")}`,
    );
  }
  lines.push("", "🩺 konsultatsiya · 🎓 seminar · 🧸 amaliy mashg‘ulot · 🤝 uchrashuv");
  return lines.join("\n");
}

function districtInfoKb(view: UserView, regionId: string, district: string) {
  const rIdx = regionIndex(regionId);
  const dIdx = districtIndex(regionId, district);
  return kb([
    [btn("📅 Sessiyaga yozilish", `ss:d:${rIdx}:${dIdx}`)],
    [view.user.sessionAlerts ? btn("🔕 Xabarlarni o‘chirish", "al:off:z") : btn("🔔 Sessiyalar haqida xabar olish", "al:on:z")],
    [btn("🔄 Tumanni o‘zgartirish", "dz:rs"), appBtn("🌐 Ilovada", "/sessions")],
  ]);
}

// ---------------------------------------------------------------------------
// 10. Yaqin sessiya haqida xabar
// ---------------------------------------------------------------------------

async function openAlerts(ctx: BotContext): Promise<void> {
  const view = await viewOf(ctx);
  const { region, district } = view.user;
  if (!region || !district || districtIndex(region, district) < 0) {
    await showRegions(ctx, "al");
    return;
  }
  await render(ctx, alertsText(view), alertsKb(view));
}

function alertsText(view: UserView): string {
  const u = view.user;
  const region = getRegion(u.region);
  const lines = [
    "🏢 <b>Yaqin YuniQo sessiyalari haqida xabar</b>",
    `📍 ${esc(districtLabel(u.district ?? ""))} · ${esc(region ? shortRegion(region.name) : "")}`,
    "",
    `Holat: ${u.sessionAlerts ? "🔔 <b>Yoqilgan</b>" : "🔕 <b>O‘chirilgan</b>"}`,
    u.sessionAlerts
      ? `Tumaningizda bepul sessiya bo‘lishidan bir kun oldin, eslatma vaqtingizda (<b>${u.reminders.time}</b>) xabar yuboramiz.`
      : "Yoqsangiz, tumaningizda bepul sessiya bo‘lishidan bir kun oldin xabar yuboramiz.",
  ];
  if (u.sessionAlerts && !u.reminders.enabled) {
    lines.push("", "⚠️ Kunlik eslatmalar o‘chirilgan — sessiya xabarlari ham eslatma bilan birga keladi. Eslatmalarni yoqing 👇");
  }
  const next = u.region && u.district ? upcomingSessions(u.region, u.district)[0] : undefined;
  if (next) {
    const t = SESSION_TYPES[next.type];
    lines.push(
      "",
      "🗓 <b>Eng yaqin sessiya:</b>",
      `${t.emoji} ${esc(next.title)}`,
      `📅 ${longDate(next.date)} · ${next.time}`,
      `📍 ${esc(next.venue)}`,
      `👥 ${seatsLabel(freeSeats(next, view))}`,
    );
  } else {
    lines.push("", "Yaqin 4 haftada tumaningizda sessiya rejalashtirilmagan.");
  }
  return lines.join("\n");
}

function alertsKb(view: UserView) {
  const u = view.user;
  const next = u.region && u.district ? upcomingSessions(u.region, u.district)[0] : undefined;
  return kb([
    [u.sessionAlerts ? btn("🔕 O‘chirish", "al:off:a") : btn("🔔 Xabarlarni yoqish", "al:on:a")],
    [u.sessionAlerts && !u.reminders.enabled ? btn("🔔 Eslatmalarni yoqish", "rm:on") : undefined],
    [next ? nbtn("✅ Shu sessiyaga yozilish", `ss:s:${next.id}`) : undefined, nbtn("📍 Barcha sessiyalar", "m:dz")],
    [btn("🔄 Tumanni o‘zgartirish", "al:rs")],
  ]);
}
