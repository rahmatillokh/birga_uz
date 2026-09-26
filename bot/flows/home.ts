import type { Bot } from "grammy";
import { streakOf, todayTasks } from "@/lib/core/stats";
import type { UserView } from "@/lib/types";
import { viewOf } from "../api";
import { appUrl } from "../config";
import type { BotContext } from "../context";
import { activeChild, childData } from "../data";
import { isScreenKey, open, screens } from "../nav";
import { BRAND, COMMANDS, EXTRA_COMMANDS, MENU, type MenuKey } from "../texts";
import { appBtn, btn, esc, kb, mainMenu, nbtn, render, send } from "../ui";

/** /start, /menu, /app, /help, asosiy menyu tugmalari va m:<ekran> tugmalari */
export function registerHome(bot: Bot<BotContext>): void {
  screens.set("home", showMenu);
  screens.set("app", showApp);
  screens.set("help", showHelp);

  bot.command("start", async (ctx) => {
    ctx.session.step = undefined;
    ctx.session.draft = undefined;
    ctx.session.consult = undefined;
    const view = await viewOf(ctx);
    await greet(ctx, view);
    // Deep link: t.me/<bot>?start=sessions kabi
    const payload = String(ctx.match ?? "").trim().toLowerCase();
    const alias: Record<string, string> = { sessions: "ss", profile: "child", report: "rp", support: "sup", reminders: "rem" };
    const key = alias[payload] ?? payload;
    if (key && key !== "home" && isScreenKey(key)) {
      ctx.forceNew = true;
      await open(key, ctx);
    }
  });

  for (const c of [...COMMANDS, ...EXTRA_COMMANDS]) {
    if (c.command === "start") continue;
    bot.command(c.command, (ctx) => open(c.screen, ctx));
  }

  for (const key of Object.keys(MENU) as MenuKey[]) {
    bot.hears(MENU[key], (ctx) => open(key, ctx));
  }

  bot.callbackQuery(/^m:(\w+)$/, async (ctx) => {
    const key = ctx.match[1];
    if (!isScreenKey(key)) return;
    ctx.forceNew = true;
    await open(key, ctx);
  });
}

async function greet(ctx: BotContext, view: UserView): Promise<void> {
  const name = ctx.from?.first_name;
  const child = activeChild(view);
  const lines = [
    `👋 Assalomu alaykum${name ? `, <b>${esc(name)}</b>` : ""}!`,
    "",
    `💙 <b>${BRAND}</b>`,
    "",
    "Men YuniQo yordamchisiman. Shu yerning o‘zida:",
    "👶 bola profilini yaratish va rivojlanishini baholash,",
    "🎯 har kuni mashqlar va eslatmalar olish,",
    "📅 bepul sessiyalar va mutaxassislarga yozilish,",
    "📊 progress va hisobotlarni ko‘rish mumkin.",
    "",
    appUrl() ? "Eng to‘liq imkoniyatlar — YuniQo ilovasida 👇" : "Boshlash uchun pastdagi tugmani bosing 👇",
  ];
  await send(
    ctx,
    lines.join("\n"),
    kb([
      [appBtn("🚀 YuniQo ilovasini ochish", "/")],
      [child ? btn("🎯 Bugungi mashqlar", "m:ex") : nbtn("👶 Bola profilini yaratish", "cc:new")],
    ]),
  );

  let status = "📋 Asosiy menyu pastda. Savolingizni oddiy matn bilan yozsangiz ham bo‘ladi 💬";
  if (child) {
    const d = childData(view, child.id);
    const tasks = todayTasks(d.plan, d.assignments, d.activities);
    const done = tasks.filter((t) => t.done).length;
    const streak = streakOf(d.activities).current;
    status =
      `${child.avatar} <b>${esc(child.name)}</b> · bugun ${done}/${tasks.length} ta mashq bajarildi` +
      (streak ? ` · 🔥 ${streak} kun` : "") +
      `\n\n${status}`;
  }
  await send(ctx, status, mainMenu());
}

async function showMenu(ctx: BotContext): Promise<void> {
  ctx.session.step = undefined;
  await send(ctx, "🏠 <b>Asosiy menyu</b>\nKerakli bo‘limni tanlang 👇", mainMenu());
}

async function showApp(ctx: BotContext): Promise<void> {
  const button = appBtn("🚀 YuniQo ilovasini ochish", "/");
  if (!button) {
    await render(
      ctx,
      "ℹ️ <b>Ilova manzili hali sozlanmagan</b>\n\nAdministrator <code>WEBAPP_URL</code> ni (https) ko‘rsatgach, ilovani shu yerdan ochish mumkin bo‘ladi. Hozircha barcha asosiy imkoniyatlar botda ishlaydi 👇",
      kb([[btn("🎯 Bugungi mashqlar", "m:ex"), btn("📝 Savolnoma", "m:quiz")]]),
    );
    return;
  }
  await render(
    ctx,
    [
      "🚀 <b>YuniQo ilovasi</b>",
      "",
      "Rivojlanish baholashi, individual reja, Ustoz AI, AI video nazorat, o‘yinlar, progress grafiklari va rivojlanish pasporti — barchasi bir joyda.",
      "",
      "Telegram ichida ochiladi, alohida o‘rnatish shart emas ✨",
    ].join("\n"),
    kb([[button], [appBtn("👩‍🏫 Ustoz AI", "/ustoz"), appBtn("📈 Progress", "/progress")]]),
  );
}

async function showHelp(ctx: BotContext): Promise<void> {
  const lines = [
    "❓ <b>Yordam</b>",
    "",
    "Asosiy buyruqlar:",
    "/profil — 👶 bola profili",
    "/baholash — 📝 rivojlanish savolnomasi",
    "/mashqlar — 🎯 bugungi mashqlar",
    "/sessiyalar — 📅 bepul sessiyalar",
    "/mutaxassis — 👨‍⚕️ mutaxassis topish",
    "/progress — 📊 qisqa progress",
    "/hisobot — 📁 rivojlanish hisoboti",
    "/premium — 💎 Premium obuna",
    "/menu — 🏠 asosiy menyu",
    "/app — 🚀 ilovani ochish",
    "",
    "💬 Savolingizni oddiy matn bilan yozsangiz ham bo‘ladi — javob topishga harakat qilaman.",
  ];
  await render(
    ctx,
    lines.join("\n"),
    kb([
      [btn("❓ Savol-javob", "m:faq"), btn("🆘 Qo‘llab-quvvatlash", "m:sup")],
      [appBtn("🚀 YuniQo ilovasi", "/"), appBtn("📘 Yordam markazi", "/help")],
    ]),
  );
}
