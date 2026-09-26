import type { Bot } from "grammy";
import { districtLabel, regionName } from "@/data/regions";
import { getSpecialist } from "@/data/specialists";
import { DOMAINS, DOMAIN_ORDER, scoreLevel } from "@/lib/constants";
import { activitiesInRange, adherence, badgesFor, levelFor, streakOf, totalPoints, weeklySeries } from "@/lib/core/stats";
import type { Child, ShareScope, UserView } from "@/lib/types";
import { addDays, dayKey, daysBetween, formatDate, formatNumber, todayKey } from "@/lib/utils";
import { actAs, viewOf } from "../api";
import { appUrl, isPublicUrl } from "../config";
import type { BotContext } from "../context";
import { activeChild, ageText, childData } from "../data";
import { screens } from "../nav";
import { appBtn, childSwitchRows, esc, kb, nbtn, needChild, render, toast, trend, urlBtn } from "../ui";

/**
 * 11. 📊 Qisqa progress natijalari
 * 12. 📁 Rivojlanish hisobotini olish (share.create → /r/<token> havolasi + qisqa matnli hisobot)
 */
export function registerProgress(bot: Bot<BotContext>): void {
  screens.set("pr", (ctx) => openProgress(ctx));
  screens.set("rp", (ctx) => openReport(ctx));
  bot.callbackQuery(/^pr:(.+)$/, (ctx) => openProgress(ctx, ctx.match[1]));
  bot.callbackQuery(/^rp:(.+)$/, (ctx) => openReport(ctx, ctx.match[1]));
}

async function pickChild(ctx: BotContext, childId?: string): Promise<{ view: UserView; child: Child } | undefined> {
  const view = await viewOf(ctx);
  const child = (childId && view.children.find((c) => c.id === childId)) || activeChild(view);
  if (!child) {
    await needChild(ctx);
    return undefined;
  }
  if (childId && child.id !== view.user.activeChildId) await actAs(ctx, { type: "child.select", childId: child.id });
  return { view, child };
}

// ---------------------------------------------------------------------------
// 11. Progress
// ---------------------------------------------------------------------------

async function openProgress(ctx: BotContext, childId?: string): Promise<void> {
  const picked = await pickChild(ctx, childId);
  if (!picked) return;
  const { view, child } = picked;
  const d = childData(view, child.id);
  const points = totalPoints(d.activities);
  const lvl = levelFor(points);
  const st = streakOf(d.activities);
  const [prevW, curW] = weeklySeries(d.activities, 2);
  const ageDays = daysBetween(dayKey(child.createdAt), todayKey());

  const lines = [
    `📊 <b>${esc(child.name)} — qisqa progress</b>`,
    `${child.avatar} ${ageText(child)}`,
    "",
    `⭐ Ball: <b>${formatNumber(points)}</b> · ${lvl.emoji} ${lvl.title} (${lvl.index}-daraja)`,
    lvl.next ? `     Keyingi darajagacha: ${formatNumber(lvl.toNext)} ball` : "     🏆 Eng yuqori daraja!",
    `🔥 Seriya: <b>${st.current}</b> kun${st.best > st.current ? ` (rekord: ${st.best})` : ""}`,
    `📅 Bu hafta: <b>${curW.count}</b> ta mashg‘ulot · o‘tgan hafta: ${prevW.count} (${trend(curW.count - prevW.count)})`,
  ];
  const adhDays = Math.min(7, ageDays);
  if (adhDays >= 1) lines.push(`✅ Reja bajarilishi (${adhDays} kun): <b>${adherence(d.plan, d.assignments, d.activities, adhDays)}%</b>`);
  if (st.current && !st.activeToday) lines.push("💡 Bugun ham bitta mashq bajaring — seriya uzilmasin!");

  if (d.latest && d.first) {
    const same = d.first.id === d.latest.id;
    lines.push(
      "",
      same
        ? `🧠 <b>Baholash natijalari</b> (${formatDate(d.latest.at)}) — umumiy ${d.latest.overall}%`
        : `🧠 <b>Rivojlanish dinamikasi</b> (${formatDate(d.first.at)} → ${formatDate(d.latest.at)})`,
    );
    for (const dm of DOMAIN_ORDER) {
      const cur = d.latest.scores[dm];
      const was = d.first.scores[dm];
      lines.push(
        same
          ? `${DOMAINS[dm].emoji} ${DOMAINS[dm].short}: <b>${cur}%</b> ${scoreLevel(cur).icon}`
          : `${DOMAINS[dm].emoji} ${DOMAINS[dm].short}: ${was}% → <b>${cur}%</b> ${trend(cur - was)}`,
      );
    }
    if (!same) lines.push(`Umumiy: ${d.first.overall}% → <b>${d.latest.overall}%</b> ${trend(d.latest.overall - d.first.overall)}`);
    else lines.push("<i>Qayta baholashdan so‘ng o‘zgarishlar shu yerda ▲▼ bilan ko‘rinadi.</i>");
  } else {
    lines.push("", "🧠 Baholash hali o‘tkazilmagan — savolnomani to‘ldirsangiz, 6 yo‘nalish bo‘yicha dinamika ko‘rinadi.");
  }

  if (d.assignments.length) {
    const active = d.assignments.filter((a) => a.status === "faol");
    const done = d.assignments.length - active.length;
    lines.push("", `👩‍🏫 <b>Mutaxassis topshiriqlari:</b> ${active.length} ta faol · ${done} ta bajarilgan`);
    for (const a of active.slice(0, 3)) {
      const sp = getSpecialist(a.specialistId);
      lines.push(`• ${esc(a.title)}${sp ? ` — ${esc(sp.name)}` : ""} (muddat: ${formatDate(a.dueDate)})`);
    }
  }

  const earned = badgesFor(d.activities, d.assessments, view.bookings).filter((b) => b.earned);
  if (earned.length) lines.push("", `🏅 Nishonlar: ${earned.map((b) => b.emoji).join(" ")} (${earned.length} ta)`);

  await render(
    ctx,
    lines.join("\n"),
    kb([
      [appBtn("📈 Batafsil", "/progress"), nbtn("📁 Hisobot olish", `rp:${child.id}`)],
      [d.latest ? undefined : nbtn("📝 Savolnomani boshlash", `qz:i:${child.id}`), nbtn("🎯 Bugungi mashqlar", `ex:v:${child.id}`)],
      ...childSwitchRows(view, child, "pr"),
    ]),
  );
}

// ---------------------------------------------------------------------------
// 12. Hisobot
// ---------------------------------------------------------------------------

const ALL_SCOPES: ShareScope[] = ["baholash", "mashqlar", "ai", "kuzatuvlar", "mutaxassis"];

async function openReport(ctx: BotContext, childId?: string): Promise<void> {
  const picked = await pickChild(ctx, childId);
  if (!picked) return;
  let { view } = picked;
  const { child } = picked;

  // So‘nggi 24 soatda bot yaratgan to‘liq havola bo‘lsa — qayta ishlatamiz (ortiqcha havolalar ko‘paymasin)
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const nowIso = new Date().toISOString();
  let share = view.shares.find(
    (s) =>
      s.childId === child.id &&
      s.active &&
      !s.specialistId &&
      s.expiresAt > nowIso &&
      s.createdAt > dayAgo &&
      ALL_SCOPES.every((x) => s.scopes.includes(x)),
  );
  if (!share) {
    const res = await actAs(ctx, { type: "share.create", childId: child.id, scopes: ALL_SCOPES, days: 7 });
    if (!res.result.ok || !res.result.createdId) {
      toast(ctx, res.result.error ?? "Havola yaratib bo‘lmadi", true);
      return;
    }
    view = res.view;
    share = view.shares.find((s) => s.token === res.result.createdId);
  }
  const token = share?.token;
  if (!token) {
    toast(ctx, "Havola yaratib bo‘lmadi", true);
    return;
  }

  const link = appUrl(`/r/${token}`);
  const d = childData(view, child.id);
  const acts30 = activitiesInRange(d.activities, addDays(todayKey(), -29));
  const activeDays = new Set(acts30.map((a) => dayKey(a.at))).size;
  const place = [child.district ? districtLabel(child.district) : "", child.region ? regionName(child.region) : ""].filter(Boolean).join(", ");

  const lines = [
    `📁 <b>${esc(child.name)} — rivojlanish hisoboti</b>`,
    `${child.avatar} ${ageText(child)}${place ? ` · ${esc(place)}` : ""}`,
    "",
  ];
  if (d.latest) {
    const lvl = scoreLevel(d.latest.overall);
    lines.push(`🧠 Oxirgi baholash (${formatDate(d.latest.at)}): <b>${d.latest.overall}%</b> ${lvl.icon} ${lvl.label}`);
    for (const dm of DOMAIN_ORDER) {
      const cur = d.latest.scores[dm];
      const delta = d.first && d.first.id !== d.latest.id ? ` ${trend(cur - d.first.scores[dm])}` : "";
      lines.push(`${DOMAINS[dm].emoji} ${DOMAINS[dm].short}: ${cur}% ${scoreLevel(cur).icon}${delta}`);
    }
    if (d.assessments.length > 1 && d.first) {
      lines.push(`📈 Dinamika: ${d.assessments.length} ta baholash, umumiy ${trend(d.latest.overall - d.first.overall)} ball`);
    }
  } else {
    lines.push("🧠 Baholash hali o‘tkazilmagan — hisobot to‘liqroq bo‘lishi uchun savolnomani to‘ldiring.");
  }
  const adhDays = Math.min(7, daysBetween(dayKey(child.createdAt), todayKey()));
  if (adhDays >= 1) lines.push(`🎯 Reja bajarilishi (${adhDays} kun): <b>${adherence(d.plan, d.assignments, d.activities, adhDays)}%</b>`);
  lines.push(`🏃 So‘nggi 30 kun: ${acts30.length} ta mashg‘ulot, ${activeDays} faol kun · 🔥 seriya ${streakOf(d.activities).current} kun`);
  if (d.assignments.length) {
    const active = d.assignments.filter((a) => a.status === "faol").length;
    lines.push(`👩‍🏫 Mutaxassis topshiriqlari: ${active} ta faol, ${d.assignments.length - active} ta bajarilgan`);
  }
  lines.push("");
  if (link) {
    lines.push("🔗 <b>Mutaxassis uchun havola</b> (ro‘yxatdan o‘tmasdan ochiladi):", esc(link));
  } else {
    lines.push(`🔗 Hisobot kodi: <code>${esc(token)}</code>`, "<i>Ilova manzili (WEBAPP_URL) sozlanganda bu yerda havola chiqadi.</i>");
  }
  const until = share ? formatDate(share.expiresAt) : "";
  lines.push(
    "",
    `⏳ Havola 7 kun amal qiladi${until ? ` (${until} gacha)` : ""}.`,
    "🔐 Uni ilovadagi «Xavfsizlik» bo‘limida istalgan vaqtda bekor qilishingiz mumkin.",
  );

  const publicLink = link && isPublicUrl(link) ? link : undefined;
  const shareUrl = publicLink
    ? `https://t.me/share/url?url=${encodeURIComponent(publicLink)}&text=${encodeURIComponent(`${child.name}ning YuniQo rivojlanish hisoboti`)}`
    : undefined;

  ctx.forceNew = true;
  await render(
    ctx,
    lines.join("\n"),
    kb([
      [urlBtn("📁 Hisobotni ochish", publicLink)],
      [urlBtn("📤 Mutaxassisga yuborish", shareUrl)],
      [appBtn("🔐 Ulashishni boshqarish", "/settings"), appBtn("📘 Rivojlanish pasporti", "/passport")],
      ...childSwitchRows(view, child, "rp"),
    ]),
  );
}
