import type { Bot } from "grammy";
import { getExercise } from "@/data/exercises";
import { badgesFor, streakOf, todayTasks, totalPoints, type TodayTask } from "@/lib/core/stats";
import type { Child, UserView } from "@/lib/types";
import { formatNumber, todayKey } from "@/lib/utils";
import { actAs, viewOf } from "../api";
import type { BotContext } from "../context";
import { activeChild, childData } from "../data";
import { screens } from "../nav";
import { appBtn, bar, btn, childSwitchRows, clip, esc, kb, longDate, needChild, render, send, toast, type Btn } from "../ui";

/**
 * 4. 🎯 Mashqlarni tavsiya qilish — bolaning individual rejasidan bugungi vazifalar
 * (todayTasks), «✅ Bajarildi» → activity.log, «▶️ Ilovada ochish» → /exercises/<id>.
 */
export function registerExercises(bot: Bot<BotContext>): void {
  screens.set("ex", (ctx) => openExercises(ctx));
  bot.callbackQuery(/^ex:v:(.+)$/, (ctx) => openExercises(ctx, ctx.match[1]));
  bot.callbackQuery(/^ex:d:([^:]+):(.+)$/, (ctx) => onDone(ctx, ctx.match[1], ctx.match[2]));
  bot.callbackQuery(/^ex:i:([^:]+):(\d+)$/, (ctx) => onDone(ctx, ctx.match[1], undefined, Number(ctx.match[2])));
}

function tasksOf(view: UserView, childId: string): TodayTask[] {
  const d = childData(view, childId);
  return todayTasks(d.plan, d.assignments, d.activities);
}

async function openExercises(ctx: BotContext, childId?: string): Promise<void> {
  const view = await viewOf(ctx);
  const child = (childId && view.children.find((c) => c.id === childId)) || activeChild(view);
  if (!child) return needChild(ctx, "Mashqlar bolaning yoshi va ehtiyojlariga qarab tanlanadi — avval profil yarating (1 daqiqa).");
  if (childId && child.id !== view.user.activeChildId) await actAs(ctx, { type: "child.select", childId: child.id });
  const v = exercisesView(view, child);
  await render(ctx, v.text, v.markup);
}

function doneData(childId: string, exId: string, index: number): string {
  const data = `ex:d:${childId}:${exId}`;
  return Buffer.byteLength(data, "utf8") <= 64 ? data : `ex:i:${childId}:${index}`;
}

function exercisesView(view: UserView, child: Child) {
  const d = childData(view, child.id);
  const tasks = todayTasks(d.plan, d.assignments, d.activities);
  const done = tasks.filter((t) => t.done).length;
  const streak = streakOf(d.activities);
  const lines = [
    `🎯 <b>${esc(child.name)} uchun bugungi mashqlar</b>`,
    `📅 ${longDate(todayKey())} · ✅ ${done}/${tasks.length} bajarildi`,
  ];
  if (tasks.length) lines.push(bar((done / tasks.length) * 100, 10));
  lines.push("");

  if (!tasks.length) {
    lines.push("🌿 Bugun rejada mashq yo‘q — dam oling yoki ilovadagi mashqlar kutubxonasidan xohlaganini tanlang.");
  }
  tasks.forEach((t, i) => {
    const e = t.exercise;
    if (t.done) {
      lines.push(`${i + 1}. ✅ ${e.emoji} <s>${esc(e.title)}</s> · ${e.durationMin} daq`);
    } else {
      lines.push(`${i + 1}. ⬜ ${e.emoji} <b>${esc(e.title)}</b> · ${e.durationMin} daq${t.assignedBy ? " · 👩‍🏫" : ""}`);
      lines.push(`     <i>${esc(clip(e.goal, 110))}</i>`);
    }
  });
  if (tasks.some((t) => t.assignedBy && !t.done)) lines.push("", "👩‍🏫 — mutaxassis topshirig‘i (+5 qo‘shimcha ball)");
  lines.push("", `🔥 Seriya: <b>${streak.current}</b> kun · ⭐ <b>${formatNumber(totalPoints(d.activities))}</b> ball`);
  if (tasks.length && done === tasks.length) lines.push("", "🏆 Bugungi barcha mashqlar bajarildi — ajoyib natija!");
  else if (tasks.length) lines.push("", "Mashqni bajargach «✅» tugmasini bosing — ball va seriya hisoblanadi.");

  const rows: Btn[][] = [];
  tasks.forEach((t, i) => {
    if (t.done || rows.length >= 8) return;
    rows.push([
      btn(`✅ ${clip(t.exercise.title, 20)}`, doneData(child.id, t.exercise.id, i)),
      appBtn("▶️ Ilovada ochish", `/exercises/${t.exercise.id}`),
    ]);
  });
  rows.push([appBtn("📋 Butun reja", "/plan"), appBtn("🧩 Kutubxona", "/exercises")]);
  rows.push(...childSwitchRows(view, child, "ex:v"));
  return { text: lines.join("\n"), markup: kb(rows) };
}

async function onDone(ctx: BotContext, childId: string, exId?: string, index?: number): Promise<void> {
  const view = await viewOf(ctx);
  const child = view.children.find((c) => c.id === childId);
  if (!child) {
    toast(ctx, "Profil topilmadi", true);
    return;
  }
  const tasks = tasksOf(view, childId);
  const task = exId ? tasks.find((t) => t.exercise.id === exId) : index !== undefined ? tasks[index] : undefined;
  const ex = task?.exercise ?? getExercise(exId);
  if (!ex) {
    toast(ctx, "Mashq topilmadi — ro‘yxat yangilandi");
    const v = exercisesView(view, child);
    await render(ctx, v.text, v.markup);
    return;
  }
  if (task?.done) {
    toast(ctx, "Bu mashq bugun allaqachon bajarilgan ✅");
    const v = exercisesView(view, child);
    await render(ctx, v.text, v.markup);
    return;
  }

  const { result, view: v2 } = await actAs(ctx, {
    type: "activity.log",
    childId,
    kind: "exercise",
    refId: ex.id,
    title: ex.title,
    domain: ex.domain,
    durationSec: ex.durationMin * 60,
    assignmentId: task?.assignmentId,
    details: { source: "bot" },
  });
  if (!result.ok) {
    toast(ctx, result.error ?? "Saqlab bo‘lmadi", true);
    return;
  }
  const pts = result.pointsEarned ?? 10;
  toast(ctx, `+${pts} ball 🌟`);
  const v = exercisesView(v2, child);
  await render(ctx, v.text, v.markup);

  const d2 = childData(v2, childId);
  const streak = streakOf(d2.activities).current;
  const left = tasksOf(v2, childId).filter((t) => !t.done).length;
  const badges = badgesFor(d2.activities, d2.assessments, v2.bookings).filter((b) => result.newBadges?.includes(b.id));
  const lines = [
    `🎉 <b>Barakalla!</b> «${esc(ex.title)}» bajarildi.`,
    `+${pts} ball 🌟 · 🔥 Seriya: <b>${streak}</b> kun`,
    ...badges.map((b) => `🏅 Yangi nishon: ${b.emoji} <b>${esc(b.title)}</b>`),
    left ? `💪 Yana ${left} ta mashq qoldi.` : "🏆 Bugungi barcha mashqlar bajarildi! Ertaga davom etamiz.",
  ];
  await send(ctx, lines.join("\n"));
}
