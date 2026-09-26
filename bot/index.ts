/**
 * YuniQo Telegram bot — tezkor yordam, yozilishlar, eslatmalar va web ilovaga (Mini App) yo‘naltirish.
 * Ishga tushirish: `npm run bot` yoki `npm run dev:all` (web + bot).
 * Barcha foydalanuvchi ma’lumotlari web API orqali o‘zgaradi (POST /api/bot/act) — bot va ilova doim sinxron.
 */
import "./env";
import { GrammyError, type Bot } from "grammy";
import { sleep } from "@/lib/utils";
import { selfCheck } from "./api";
import { createBot } from "./bot";
import { apiUrl, appUrl, botToken, isHttpsApp, webAppBase } from "./config";
import type { BotContext } from "./context";
import { startScheduler } from "./scheduler";
import { BRAND, COMMANDS } from "./texts";

function exitWithoutToken(): never {
  console.log(
    [
      "",
      "🤖 YuniQo bot: TELEGRAM_BOT_TOKEN topilmadi — bot ishga tushirilmadi.",
      "",
      "UZ  Botni yoqish uchun:",
      "    1) Telegram’da @BotFather → /newbot → tokenni oling",
      "    2) Loyiha ildizidagi .env.local fayliga yozing:  TELEGRAM_BOT_TOKEN=123456789:AA...",
      "    3) Qayta ishga tushiring:  npm run bot   (yoki web bilan birga: npm run dev:all)",
      "    Web ilova token bo‘lmasa ham demo rejimda ishlayveradi.",
      "",
      "EN  TELEGRAM_BOT_TOKEN is not set — the bot was not started.",
      "    1) Create a bot with @BotFather (/newbot) and copy the token",
      "    2) Put it into .env.local:  TELEGRAM_BOT_TOKEN=123456789:AA...",
      "    3) Run again:  npm run bot   (or web + bot: npm run dev:all)",
      "    The web app keeps working in demo mode without a token.",
      "",
    ].join("\n"),
  );
  process.exit(0);
}

/** Buyruqlar ro‘yxati, Mini App menyu tugmasi va bot tavsifi */
async function setupProfile(bot: Bot<BotContext>): Promise<void> {
  try {
    await bot.api.setMyCommands(COMMANDS.map(({ command, description }) => ({ command, description })));
  } catch (e) {
    console.warn("[bot] setMyCommands:", (e as Error).message);
  }
  try {
    const url = appUrl("/");
    if (url && isHttpsApp()) {
      await bot.api.setChatMenuButton({ menu_button: { type: "web_app", text: "YuniQo", web_app: { url } } });
    } else {
      await bot.api.setChatMenuButton({ menu_button: { type: "commands" } });
    }
  } catch (e) {
    console.warn("[bot] setChatMenuButton:", (e as Error).message);
  }
  // Tavsif (yangi foydalanuvchi /start dan oldin ko‘radi) — faqat o‘zgargan bo‘lsa yangilanadi
  try {
    const description = `${BRAND} 💙\n\nBolangiz rivojlanishini baholang, har kuni mashqlar va eslatmalar oling, bepul tuman sessiyalari va mutaxassislarga yoziling. «Boshlash» tugmasini bosing 👇`;
    const short = `${BRAND}. Baholash, mashqlar, bepul sessiyalar va mutaxassislar.`;
    if ((await bot.api.getMyDescription()).description !== description) await bot.api.setMyDescription(description);
    if ((await bot.api.getMyShortDescription()).short_description !== short) await bot.api.setMyShortDescription(short);
  } catch (e) {
    console.warn("[bot] tavsifni yangilab bo‘lmadi:", (e as Error).message);
  }
}

/** Tarmoq bo‘lmasa kutib qayta urinadi; token noto‘g‘ri bo‘lsa aniq xabar bilan to‘xtaydi */
async function initWithRetry(bot: Bot<BotContext>): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await bot.init();
      return;
    } catch (e) {
      if (e instanceof GrammyError && (e.error_code === 401 || e.error_code === 404)) {
        console.error(
          "\n❌ TELEGRAM_BOT_TOKEN noto‘g‘ri (Unauthorized). @BotFather dan olingan tokenni tekshiring.\n   Invalid bot token — please check TELEGRAM_BOT_TOKEN.\n",
        );
        process.exit(1);
      }
      const wait = Math.min(60, 5 * attempt);
      console.warn(`[bot] Telegram’ga ulanib bo‘lmadi (${(e as Error).message}). ${wait} soniyadan so‘ng qayta urinamiz…`);
      await sleep(wait * 1000);
    }
  }
}

async function main(): Promise<void> {
  const token = botToken();
  if (!token) exitWithoutToken();

  const bot = createBot(token);
  await initWithRetry(bot);
  await setupProfile(bot);

  const health = await selfCheck();
  if (health === "forbidden") {
    console.warn("⚠️  Web API x-bot-secret ni rad etdi (403). Web server va bot bir xil TELEGRAM_BOT_TOKEN / BOT_API_SECRET bilan ishlashi kerak.");
  } else if (health === "down") {
    console.warn(`⚠️  Web API (${apiUrl()}) hozircha javob bermayapti — «npm run dev» ishga tushganini tekshiring. Bot kutib turadi.`);
  }

  const stopScheduler = startScheduler(bot);
  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    console.log(`\n[bot] ${signal} — to‘xtatilmoqda…`);
    stopScheduler();
    await bot.stop().catch(() => undefined);
    process.exit(0);
  };
  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  await bot.start({
    drop_pending_updates: true,
    allowed_updates: ["message", "callback_query", "my_chat_member"],
    onStart: (me) => {
      const app = webAppBase();
      console.log(`✅ YuniQo bot ishga tushdi: @${me.username}`);
      console.log(`   API: ${apiUrl()} · Mini App: ${app || "— (WEBAPP_URL berilmagan)"}${app && !isHttpsApp() ? " (https emas — web_app tugmalari o‘chirilgan)" : ""}`);
      console.log("   Eslatmalar rejalashtiruvchisi: har daqiqa (Toshkent vaqti)");
    },
  });
}

main().catch((e) => {
  if (e instanceof GrammyError && e.error_code === 409) {
    console.error(
      "\n❌ Shu token bilan boshqa joyda bot allaqachon ishlayapti (409 Conflict). Boshqa nusxani to‘xtating yoki webhook’ni o‘chiring.\n   Another instance is already polling with this token.\n",
    );
  } else {
    console.error("[bot] ishga tushirishda xatolik:", e);
  }
  process.exit(1);
});
