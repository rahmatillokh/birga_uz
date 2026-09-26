import { GrammyError, InlineKeyboard, Keyboard } from "grammy";
import type { InlineKeyboardButton } from "grammy/types";
import { MONTHS, WEEKDAYS, WEEKDAYS_SHORT } from "@/lib/constants";
import type { Child, UserView } from "@/lib/types";
import { daysBetween, formatMoney, tashkentTime, todayKey, weekdayOf } from "@/lib/utils";
import { appUrl, isPublicUrl } from "./config";
import type { BotContext } from "./context";
import { MENU, MENU_LAYOUT } from "./texts";

export type Btn = InlineKeyboardButton | undefined | null | false;

// ---------------------------------------------------------------------------
// Matn
// ---------------------------------------------------------------------------

/** HTML parse_mode uchun xavfsiz matn */
export function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function clip(s: string, n: number): string {
  const t = s.trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
}

/** ▰▰▰▰▱▱ ko‘rinishidagi chiziq */
export function bar(pct: number, n = 10): string {
  const f = Math.max(0, Math.min(n, Math.round((pct / 100) * n)));
  return "▰".repeat(f) + "▱".repeat(n - f);
}

/** ▲ +5 / ▼ −3 / ▪️ 0 */
export function trend(delta: number): string {
  if (delta > 0) return `▲ +${delta}`;
  if (delta < 0) return `▼ −${Math.abs(delta)}`;
  return "▪️ 0";
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Toshkent vaqti "HH:MM" */
export function nowHHMM(): string {
  const { hh, mm } = tashkentTime();
  return `${pad2(hh)}:${pad2(mm)}`;
}

const MONTHS_SHORT = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

/** "Sh, 26 sen" */
export function shortDate(key: string): string {
  const k = key.slice(0, 10);
  const [, m, d] = k.split("-").map(Number);
  return `${WEEKDAYS_SHORT[weekdayOf(k) - 1]}, ${d} ${MONTHS_SHORT[m - 1]}`;
}

/** "Shanba, 26 sentabr" */
export function longDate(key: string): string {
  const k = key.slice(0, 10);
  const [, m, d] = k.split("-").map(Number);
  return `${WEEKDAYS[weekdayOf(k) - 1]}, ${d} ${MONTHS[m - 1]}`;
}

/** "Bugun" / "Ertaga" / "Shanba, 26 sentabr" */
export function dayLabel(key: string): string {
  const diff = daysBetween(todayKey(), key.slice(0, 10));
  if (diff === 0) return "Bugun";
  if (diff === 1) return "Ertaga";
  return longDate(key);
}

export function money(n?: number): string {
  return typeof n === "number" ? formatMoney(n) : "—";
}

export function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// ---------------------------------------------------------------------------
// Tugmalar
// ---------------------------------------------------------------------------

/** Callback tugmasi (callback_data ≤ 64 bayt) */
export function btn(text: string, data: string): InlineKeyboardButton {
  if (Buffer.byteLength(data, "utf8") > 64) console.warn(`[bot] callback_data 64 baytdan uzun: ${data}`);
  return InlineKeyboard.text(text, data);
}

/** Yangi xabar ochadigan callback tugmasi ("!" — render() eski xabarni tahrirlamaydi) */
export function nbtn(text: string, data: string): InlineKeyboardButton {
  return btn(text, `${data}!`);
}

/** Tashqi havola (faqat Telegram qabul qiladigan ommaviy URL bo‘lsa) */
export function urlBtn(text: string, url?: string): InlineKeyboardButton | undefined {
  return url && isPublicUrl(url) ? InlineKeyboard.url(text, url) : undefined;
}

/**
 * Ilova sahifasini ochuvchi tugma: WEBAPP_URL https bo‘lsa — Mini App (web_app),
 * ommaviy http bo‘lsa — oddiy havola, aks holda tugma chiqmaydi.
 */
export function appBtn(text: string, path = "/"): InlineKeyboardButton | undefined {
  const url = appUrl(path);
  if (!url) return undefined;
  if (url.startsWith("https://")) return InlineKeyboard.webApp(text, url);
  return isPublicUrl(url) ? InlineKeyboard.url(text, url) : undefined;
}

export function kb(rows: Btn[][]): InlineKeyboard | undefined {
  const clean = rows.map((r) => r.filter(Boolean) as InlineKeyboardButton[]).filter((r) => r.length);
  return clean.length ? new InlineKeyboard(clean) : undefined;
}

/** Boshqa farzandga o‘tish tugmalari */
export function childSwitchRows(view: UserView, current: Child, prefix: string): Btn[][] {
  const others = view.children.filter((c) => c.id !== current.id);
  return chunk(
    others.map((c) => btn(`🔄 ${c.avatar} ${clip(c.name, 14)}`, `${prefix}:${c.id}`)),
    2,
  );
}

/** Asosiy menyu — reply keyboard, 2 ustun */
export function mainMenu(): Keyboard {
  const k = new Keyboard();
  for (const row of MENU_LAYOUT) {
    for (const key of row) k.text(MENU[key]);
    k.row();
  }
  return k.resized().placeholder("Bo‘limni tanlang yoki savolingizni yozing…");
}

// ---------------------------------------------------------------------------
// Xabar yuborish
// ---------------------------------------------------------------------------

type Markup = InlineKeyboard | Keyboard | undefined;

export async function send(ctx: BotContext, text: string, markup?: Markup): Promise<void> {
  await ctx.reply(text, {
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: markup,
  });
}

/**
 * Tugma bosilganda — o‘sha xabarni tahrirlaydi (chat toza qoladi),
 * aks holda yoki tahrirlab bo‘lmasa — yangi xabar yuboradi.
 */
export async function render(ctx: BotContext, text: string, markup?: InlineKeyboard): Promise<void> {
  const msg = ctx.callbackQuery?.message as { text?: string; date?: number } | undefined;
  if (!ctx.forceNew && msg?.date && typeof msg.text === "string") {
    try {
      await ctx.editMessageText(text, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        reply_markup: markup,
      });
      return;
    } catch (e) {
      if (e instanceof GrammyError && /message is not modified/i.test(e.description)) return;
      if (!(e instanceof GrammyError && e.error_code === 400)) throw e;
      // tahrirlab bo‘lmadi (eski / media xabar) — yangisini yuboramiz
    }
  }
  await send(ctx, text, markup);
}

/** Tugma bosilganda ko‘rinadigan qisqa bildirishnoma */
export function toast(ctx: BotContext, text: string, alert = false): void {
  ctx.cbAnswer = { text: clip(text, 190), show_alert: alert };
}

/** Bola profili yo‘q bo‘lsa */
export async function needChild(ctx: BotContext, hint?: string): Promise<void> {
  await render(
    ctx,
    `👶 <b>Avval farzandingiz profilini yarating</b>\n\n${hint ?? "Bu bor-yo‘g‘i 1 daqiqa vaqt oladi — shundan so‘ng baholash, mashqlar va progress ochiladi."}`,
    kb([[btn("👶 Profil yaratish", "cc:new")], [appBtn("🚀 Ilovada yaratish", "/")]]),
  );
}
