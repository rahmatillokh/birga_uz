import { GrammyError, type Bot, type NextFunction } from "grammy";
import type { UserView } from "@/lib/types";
import { districtLabel, regionName } from "@/data/regions";
import { viewOf, type TgFrom } from "../api";
import { adminChatId } from "../config";
import type { BotContext } from "../context";
import { ageText, isPremium } from "../data";
import { screens, steps } from "../nav";
import { appBtn, btn, clip, esc, kb, nbtn, render, send } from "../ui";

/**
 * 19. 🆘 Qo‘llab-quvvatlash: foydalanuvchi xabari → ADMIN_CHAT_ID (foydalanuvchi ma’lumotlari bilan).
 * Admin shu xabarga «Reply» qilsa — javob foydalanuvchiga yuboriladi.
 */

/** admin chatdagi xabar id → foydalanuvchi tg id (bot qayta ishga tushsa, 🆔 qatoridan tiklanadi) */
const tickets = new Map<number, number>();

function remember(messageId: number, userId: number): void {
  tickets.set(messageId, userId);
  if (tickets.size > 5000) tickets.delete(tickets.keys().next().value as number);
}

export function registerSupport(bot: Bot<BotContext>): void {
  screens.set("sup", openSupport);
  steps.set("support", onSupportMessage);
  bot.callbackQuery("sup:x", async (ctx) => {
    ctx.session.step = undefined;
    await render(ctx, "✖️ Murojaat bekor qilindi. Kerak bo‘lsa, «🆘 Qo‘llab-quvvatlash» tugmasini qayta bosing.");
  });
}

async function openSupport(ctx: BotContext): Promise<void> {
  ctx.session.step = "support";
  await render(
    ctx,
    [
      "🆘 <b>Qo‘llab-quvvatlash</b>",
      "",
      "Savolingiz, taklifingiz yoki muammoingizni <b>bitta xabarda</b> yozib yuboring (rasm yoki ovozli xabar ham mumkin).",
      "YuniQo jamoasi imkon qadar tez javob beradi 💙",
    ].join("\n"),
    kb([[btn("✖️ Bekor qilish", "sup:x")], [nbtn("❓ Avval savol-javobni ko‘rish", "m:faq")]]),
  );
}

function header(from: TgFrom, view?: UserView): string {
  const name = [from.first_name, from.last_name].filter(Boolean).join(" ") || "Foydalanuvchi";
  const lines = [
    "🆘 <b>Yangi murojaat</b>",
    `👤 <a href="tg://user?id=${from.id}">${esc(name)}</a>${from.username ? ` (@${esc(from.username)})` : ""}`,
    `🆔 ${from.id}${from.language_code ? ` · 🌐 ${esc(from.language_code)}` : ""}`,
  ];
  if (view) {
    const u = view.user;
    if (u.district) lines.push(`📍 ${esc(districtLabel(u.district))}, ${esc(regionName(u.region))}`);
    if (view.children.length) lines.push(`👶 ${view.children.map((c) => `${esc(c.name)} (${ageText(c)})`).join(", ")}`);
    lines.push(`💎 Premium: ${isPremium(view) ? "ha" : "yo‘q"}`);
  }
  return lines.join("\n");
}

async function onSupportMessage(ctx: BotContext): Promise<void> {
  const msg = ctx.message;
  const from = ctx.from;
  if (!msg || !from || !ctx.chat) return;
  ctx.session.step = undefined;
  const admin = adminChatId();

  if (!admin) {
    console.log(`[yordam] ${from.id} (${from.first_name ?? ""}): ${msg.text ?? msg.caption ?? "[media]"}`);
    await send(
      ctx,
      "✅ <b>Rahmat! Xabaringiz qabul qilindi.</b>\nJamoamiz uni ko‘rib chiqadi. Tezkor javob uchun «❓ Savol-javob» bo‘limi yoki ilovadagi Ustoz AI yordam beradi.",
      kb([[nbtn("❓ Savol-javob", "m:faq"), appBtn("👩‍🏫 Ustoz AI", "/ustoz")]]),
    );
    return;
  }

  let view: UserView | undefined;
  try {
    view = await viewOf(ctx);
  } catch {
    view = undefined; // API ishlamasa ham murojaat yetib borsin
  }
  const head = header(from, view);
  const footer = "\n\n↩️ <i>Javob berish uchun shu xabarga «Reply» qiling.</i>";
  try {
    if (msg.text) {
      const m = await ctx.api.sendMessage(admin, `${head}\n\n💬 ${esc(clip(msg.text, 3000))}${footer}`, { parse_mode: "HTML" });
      remember(m.message_id, from.id);
    } else {
      const copied = await ctx.api.copyMessage(admin, ctx.chat.id, msg.message_id);
      remember(copied.message_id, from.id);
      const m = await ctx.api.sendMessage(admin, `${head}\n\n📎 Yuqoridagi xabar (media)${footer}`, {
        parse_mode: "HTML",
        reply_parameters: { message_id: copied.message_id, allow_sending_without_reply: true },
      });
      remember(m.message_id, from.id);
    }
    await send(
      ctx,
      "✅ <b>Xabaringiz yuborildi!</b>\nJavob shu chatga keladi. Odatda bir necha soat ichida javob beramiz 💙",
      kb([[nbtn("✍️ Yana yozish", "m:sup")]]),
    );
  } catch (e) {
    console.warn("[yordam] admin chatga yuborilmadi:", (e as Error).message);
    await send(ctx, "✅ Xabaringiz qabul qilindi. Jamoamiz tez orada bog‘lanadi.");
  }
}

/**
 * Admin chatdagi javoblar: murojaat xabariga «Reply» → foydalanuvchiga.
 * Bu middleware shaxsiy chat filtridan OLDIN ulanadi (admin chat guruh bo‘lishi mumkin).
 */
export async function adminRelay(ctx: BotContext, next: NextFunction): Promise<void> {
  const admin = adminChatId();
  const msg = ctx.message;
  if (!admin || !msg || ctx.chat?.id !== admin) return next();
  const reply = msg.reply_to_message;
  if (!reply || reply.from?.id !== ctx.me.id) return next();
  const fromText = /🆔\s*(\d{4,})/.exec(reply.text ?? reply.caption ?? "")?.[1];
  const target = tickets.get(reply.message_id) ?? (fromText ? Number(fromText) : undefined);
  if (!target) return next();

  try {
    if (msg.text) {
      await ctx.api.sendMessage(target, `💬 <b>YuniQo qo‘llab-quvvatlash xizmati:</b>\n\n${esc(msg.text)}`, {
        parse_mode: "HTML",
        reply_markup: kb([[btn("✍️ Javob yozish", "m:sup")]]),
      });
    } else {
      await ctx.api.sendMessage(target, "💬 <b>YuniQo qo‘llab-quvvatlash xizmati:</b>", { parse_mode: "HTML" });
      await ctx.api.copyMessage(target, msg.chat.id, msg.message_id);
    }
    try {
      await ctx.react("👍");
    } catch {
      await ctx.reply("✅ Javob yuborildi", { reply_parameters: { message_id: msg.message_id } });
    }
  } catch (e) {
    const blocked = e instanceof GrammyError && e.error_code === 403;
    await ctx
      .reply(blocked ? "❌ Yuborilmadi: foydalanuvchi botni bloklagan." : `❌ Yuborilmadi: ${esc((e as Error).message)}`, {
        reply_parameters: { message_id: msg.message_id },
      })
      .catch(() => undefined);
  }
}
