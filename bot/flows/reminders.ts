import type { Bot } from "grammy";
import { WEEKDAYS_SHORT } from "@/lib/constants";
import type { UserView } from "@/lib/types";
import { actAs, viewOf } from "../api";
import type { BotContext } from "../context";
import { screens, steps } from "../nav";
import { reminderFromView, reminderMessage } from "../scheduler";
import { appBtn, btn, kb, render, send, toast } from "../ui";

/** 5. 🔔 Kunlik mashq eslatmalari — vaqt, kunlar, yoqish/o‘chirish (user.reminders) */

const PRESETS = ["08:00", "12:00", "16:00", "18:30", "20:00"];
const EVERYDAY = [1, 2, 3, 4, 5, 6, 7];
const WEEKDAYS_ONLY = [1, 2, 3, 4, 5];

export function registerReminders(bot: Bot<BotContext>): void {
  screens.set("rem", openReminders);
  steps.set("rem.time", onCustomTime);

  bot.callbackQuery(/^rm:t:(\d{2})(\d{2})$/, async (ctx) => {
    const time = `${ctx.match[1]}:${ctx.match[2]}`;
    const { view } = await actAs(ctx, { type: "user.reminders", reminders: { time, enabled: true } });
    toast(ctx, `✅ Eslatma vaqti: ${time}`);
    await renderSettings(ctx, view);
  });

  bot.callbackQuery("rm:tc", async (ctx) => {
    ctx.session.step = "rem.time";
    await render(
      ctx,
      "⏰ <b>Qulay vaqtni yozing</b>\n\nSoat va daqiqani <b>SS:DD</b> ko‘rinishida yuboring (Toshkent vaqti), masalan: <code>19:15</code>",
      kb([[btn("⬅️ Orqaga", "rm:back")]]),
    );
  });

  bot.callbackQuery("rm:back", async (ctx) => {
    ctx.session.step = undefined;
    await renderSettings(ctx, await viewOf(ctx));
  });

  bot.callbackQuery(/^rm:d:([aw])$/, async (ctx) => {
    const days = ctx.match[1] === "w" ? WEEKDAYS_ONLY : EVERYDAY;
    const { view } = await actAs(ctx, { type: "user.reminders", reminders: { days } });
    toast(ctx, ctx.match[1] === "w" ? "📅 Faqat ish kunlari" : "📅 Har kuni");
    await renderSettings(ctx, view);
  });

  bot.callbackQuery(/^rm:(on|off)$/, async (ctx) => {
    const enabled = ctx.match[1] === "on";
    const { view } = await actAs(ctx, { type: "user.reminders", reminders: { enabled } });
    toast(ctx, enabled ? "🔔 Eslatmalar yoqildi" : "🔕 Eslatmalar o‘chirildi");
    await renderSettings(ctx, view);
  });

  bot.callbackQuery("rm:test", async (ctx) => {
    const view = await viewOf(ctx);
    const msg = reminderMessage(reminderFromView(view));
    if (!msg) {
      toast(ctx, view.children.length ? "Hozir eslatadigan narsa yo‘q — bugungi mashqlar bajarilgan 🎉" : "Avval bola profilini yarating 👶", true);
      return;
    }
    toast(ctx, "Namuna yuborildi 👇");
    await send(ctx, `<i>Namuna — eslatma shunday ko‘rinadi:</i>\n\n${msg.text}`, msg.markup);
  });
}

function daysLabel(days: number[]): string {
  const set = [...new Set(days)].sort((a, b) => a - b);
  if (set.length === 7) return "Har kuni";
  if (set.join() === WEEKDAYS_ONLY.join()) return "Ish kunlari (Du–Ju)";
  if (!set.length) return "Kunlar tanlanmagan";
  return set.map((d) => WEEKDAYS_SHORT[d - 1]).join(", ");
}

async function openReminders(ctx: BotContext): Promise<void> {
  await renderSettings(ctx, await viewOf(ctx));
}

async function renderSettings(ctx: BotContext, view: UserView, header?: string): Promise<void> {
  const r = view.user.reminders;
  const everyday = r.days.length === 7;
  const workdays = [...r.days].sort().join() === WEEKDAYS_ONLY.join();
  const timeBtn = (t: string) => btn(`${r.time === t ? "✅" : "⏰"} ${t}`, `rm:t:${t.replace(":", "")}`);
  const custom = !PRESETS.includes(r.time);
  const lines = [
    "🔔 <b>Kunlik mashq eslatmalari</b>",
    "",
    `Holat: ${r.enabled ? "✅ Yoqilgan" : "🔕 O‘chirilgan"}`,
    `⏰ Vaqt: <b>${r.time}</b> (Toshkent vaqti)`,
    `📅 Kunlar: <b>${daysLabel(r.days)}</b>`,
    "",
    "Eslatmada: bugungi mashqlar 🎯, mutaxassis topshiriqlari 👩‍🏫, ertangi yozilishlar 📅 va tumaningizdagi bepul sessiyalar 🏢.",
  ];
  if (header) lines.unshift(header);
  await render(
    ctx,
    lines.join("\n"),
    kb([
      PRESETS.slice(0, 3).map(timeBtn),
      [...PRESETS.slice(3).map(timeBtn), btn(`${custom ? `✅ ${r.time}` : "✍️ Boshqa vaqt"}`, "rm:tc")],
      [btn(`${everyday ? "✅ " : ""}📅 Har kuni`, "rm:d:a"), btn(`${workdays ? "✅ " : ""}💼 Ish kunlari`, "rm:d:w")],
      [r.enabled ? btn("🔕 O‘chirish", "rm:off") : btn("🔔 Yoqish", "rm:on"), btn("👀 Namuna ko‘rish", "rm:test")],
      [appBtn("⚙️ Ilovada sozlash", "/reminders")],
    ]),
  );
}

/** "7:05", "19.30", "1930", "19 30" → "07:05" / "19:30" */
function parseTime(raw: string): string | null {
  const m = /^\s*([01]?\d|2[0-3])\s*[:.\s-]?\s*([0-5]\d)\s*$/.exec(raw);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null;
}

async function onCustomTime(ctx: BotContext): Promise<void> {
  const time = parseTime(ctx.message?.text ?? "");
  if (!time) {
    await send(ctx, "🙂 Vaqtni <b>SS:DD</b> ko‘rinishida yozing, masalan: <code>07:45</code> yoki <code>19:15</code>", kb([[btn("⬅️ Orqaga", "rm:back")]]));
    return;
  }
  ctx.session.step = undefined;
  const { view } = await actAs(ctx, { type: "user.reminders", reminders: { time, enabled: true } });
  await renderSettings(ctx, view, `✅ Saqlandi! Eslatma vaqti: <b>${time}</b> (${daysLabel(view.user.reminders.days).toLowerCase()}).\n`);
}
