import crypto from "node:crypto";

/** Bot sozlamalari — har safar process.env dan o‘qiladi (dotenv yuklangandan keyin) */

export function botToken(): string {
  return (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
}

/** Web API manzili (bot → Next.js). Standart: http://localhost:3000 */
export function apiUrl(): string {
  return (process.env.API_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
}

/** Web ilovaning ommaviy manzili (Mini App uchun https majburiy) */
export function webAppBase(): string {
  return (process.env.WEBAPP_URL ?? "").trim().replace(/\/+$/, "");
}

export function isHttpsApp(): boolean {
  return webAppBase().startsWith("https://");
}

/** Ilova sahifasining to‘liq manzili yoki undefined (WEBAPP_URL berilmagan bo‘lsa) */
export function appUrl(path = "/"): string | undefined {
  const base = webAppBase();
  if (!base) return undefined;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function adminChatId(): number | undefined {
  const raw = process.env.ADMIN_CHAT_ID?.trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n !== 0 ? n : undefined;
}

export function communityUrl(): string | undefined {
  return process.env.COMMUNITY_URL?.trim() || undefined;
}

/**
 * Bot → API maxfiy kaliti. src/server/auth.ts dagi botSecret() bilan AYNAN bir xil:
 * BOT_API_SECRET yoki sha256("yuniqo-bot:" + TELEGRAM_BOT_TOKEN).slice(0, 32)
 */
export function botSecret(): string {
  const explicit = process.env.BOT_API_SECRET;
  if (explicit) return explicit;
  const token = process.env.TELEGRAM_BOT_TOKEN || "yuniqo-dev";
  return crypto.createHash("sha256").update(`yuniqo-bot:${token}`).digest("hex").slice(0, 32);
}

/**
 * Telegram tugmasida ishlatish mumkin bo‘lgan ommaviy URL.
 * localhost / lokal tarmoq manzillarini Telegram rad etadi (BUTTON_URL_INVALID).
 */
export function isPublicUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const h = u.hostname.toLowerCase();
    if (!h || h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.includes(":")) return false;
    if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return false;
    return h.includes(".");
  } catch {
    return false;
  }
}
