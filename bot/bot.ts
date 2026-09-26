import { Bot, GrammyError, HttpError, session, type BotConfig, type NextFunction } from "grammy";
import { ApiDown } from "./api";
import type { BotContext, SessionData } from "./context";
import { registerAssessment } from "./flows/assessment";
import { registerChild } from "./flows/child";
import { registerExercises } from "./flows/exercises";
import { registerExtras } from "./flows/extras";
import { registerFaq, registerFreeText } from "./flows/faq";
import { registerHome } from "./flows/home";
import { registerProgress } from "./flows/progress";
import { registerReminders } from "./flows/reminders";
import { registerSessions } from "./flows/sessions";
import { registerSpecialists } from "./flows/specialists";
import { adminRelay, registerSupport } from "./flows/support";
import { steps } from "./nav";
import { installTransformers } from "./telegram";
import { MENU_TEXTS, SERVER_DOWN } from "./texts";
import { toast } from "./ui";

/** API ishlamasa — «Server bilan aloqa yo‘q»; har bir callback_query albatta javob oladi */
async function boundary(ctx: BotContext, next: NextFunction): Promise<void> {
  try {
    await next();
  } catch (e) {
    if (e instanceof ApiDown) {
      console.warn("[api]", e.message);
      if (ctx.callbackQuery) ctx.cbAnswer = { text: `⚠️ ${SERVER_DOWN}`, show_alert: true };
      else if (ctx.chat) await ctx.reply(`⚠️ ${SERVER_DOWN}`).catch(() => undefined);
      return;
    }
    if (ctx.callbackQuery) ctx.cbAnswer = { text: "😔 Xatolik yuz berdi, qaytadan urinib ko‘ring" };
    throw e;
  } finally {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery(ctx.cbAnswer ?? {}).catch(() => undefined);
  }
}

/** Foydalanuvchi bo‘limlari faqat shaxsiy chatda ishlaydi */
async function privateOnly(ctx: BotContext, next: NextFunction): Promise<void> {
  if (ctx.chat?.type === "private") await next();
}

/** "…!" bilan tugagan callback — natija yangi xabarda ochiladi */
async function newMessageMarker(ctx: BotContext, next: NextFunction): Promise<void> {
  const q = ctx.callbackQuery;
  if (q?.data?.endsWith("!")) {
    q.data = q.data.slice(0, -1);
    ctx.forceNew = true;
  }
  await next();
}

/** Asosiy menyu tugmasi yoki buyruq — joriy matnli jarayonni bekor qiladi */
async function menuCancelsFlow(ctx: BotContext, next: NextFunction): Promise<void> {
  const t = ctx.message?.text;
  if (t && (t.startsWith("/") || MENU_TEXTS.has(t))) ctx.session.step = undefined;
  await next();
}

/** Matn kutilayotgan qadam bo‘lsa — shu qadamning ishlovchisi */
async function stepDispatcher(ctx: BotContext, next: NextFunction): Promise<void> {
  const step = ctx.session.step;
  const handler = step ? steps.get(step) : undefined;
  if (!handler) return next();
  await handler(ctx);
}

/** Barcha middleware va bo‘limlari ulangan bot (tarmoqqa hali ulanmagan) */
export function createBot(token: string, config?: BotConfig<BotContext>): Bot<BotContext> {
  const bot = new Bot<BotContext>(token, config);
  installTransformers(bot.api);

  bot.use(boundary);
  // Chat ID ni bilish (ADMIN_CHAT_ID sozlash uchun) — guruhda ham ishlaydi
  bot.command("id", (ctx) => ctx.reply(`🆔 Chat ID: <code>${ctx.chat.id}</code>`, { parse_mode: "HTML" }));
  bot.use(adminRelay);
  bot.use(privateOnly);
  bot.use(session({ initial: (): SessionData => ({}) }));
  bot.use(newMessageMarker);
  bot.use(menuCancelsFlow);

  registerHome(bot);
  registerChild(bot);
  registerAssessment(bot);
  registerExercises(bot);
  registerReminders(bot);
  registerSessions(bot);
  registerSpecialists(bot);
  registerProgress(bot);
  registerExtras(bot);
  registerFaq(bot);
  registerSupport(bot);

  bot.callbackQuery("noop", () => undefined);
  bot.on("callback_query:data", (ctx) => toast(ctx, "Bu tugma eskirgan. Menyudan qaytadan tanlang 🙂"));
  bot.on("message", stepDispatcher);
  registerFreeText(bot);

  bot.catch((err) => {
    const e = err.error;
    if (e instanceof GrammyError) console.error(`[telegram] ${e.method}: ${e.description}`);
    else if (e instanceof HttpError) console.error("[telegram] tarmoq xatosi:", e.message);
    else console.error("[bot] kutilmagan xatolik:", e);
    if (!(e instanceof GrammyError) && !(e instanceof HttpError) && err.ctx.chat?.type === "private" && !err.ctx.callbackQuery) {
      void err.ctx.reply("😔 Kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring yoki /menu ni bosing.").catch(() => undefined);
    }
  });

  return bot;
}
