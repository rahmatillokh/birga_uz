import crypto from "node:crypto";
import { DEMO_UID } from "@/lib/constants";
import { ensureUser } from "@/lib/core/reducer";
import type { DB } from "@/lib/types";
import { botToken } from "./telegram";

export interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

/**
 * Telegram Mini App initData tekshiruvi (HMAC-SHA256).
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyInitData(initData: string, token: string): TgUser | null {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  const calc = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  if (calc.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
  const authDate = Number(params.get("auth_date") ?? 0);
  if (authDate && Date.now() / 1000 - authDate > 7 * 86400) return null;
  try {
    return JSON.parse(params.get("user") ?? "null");
  } catch {
    return null;
  }
}

function parseUnverified(initData: string): TgUser | null {
  try {
    return JSON.parse(new URLSearchParams(initData).get("user") ?? "null");
  } catch {
    return null;
  }
}

export type Identity = { uid: string; mode: "telegram" | "demo"; tg?: TgUser };

/**
 * So‘rov kimdan kelganini aniqlash:
 *  - Telegram Mini App ichida: `x-tg-init-data` sarlavhasi (bot tokeni bilan tekshiriladi)
 *  - Oddiy brauzerda: demo foydalanuvchi
 */
export function identify(req: Request, db: DB): Identity | { error: string } {
  const initData = req.headers.get("x-tg-init-data");
  if (initData) {
    const token = botToken();
    const tg = token ? verifyInitData(initData, token) : parseUnverified(initData);
    if (!tg?.id) return { error: "Telegram ma’lumotlari tasdiqlanmadi" };
    const uid = `tg:${tg.id}`;
    const name = [tg.first_name, tg.last_name].filter(Boolean).join(" ") || tg.username || "Ota-ona";
    const u = ensureUser(db, uid, name, { tgId: tg.id });
    u.username = tg.username ?? u.username;
    u.photoUrl = tg.photo_url ?? u.photoUrl;
    u.tgId = tg.id;
    return { uid, mode: "telegram", tg };
  }
  return { uid: DEMO_UID, mode: "demo" };
}

/** Bot → API so‘rovlari uchun maxfiy kalit */
export function botSecret(): string {
  const explicit = process.env.BOT_API_SECRET;
  if (explicit) return explicit;
  const token = botToken() ?? "yuniqo-dev";
  return crypto.createHash("sha256").update(`yuniqo-bot:${token}`).digest("hex").slice(0, 32);
}

export function isBotRequest(req: Request): boolean {
  const got = req.headers.get("x-bot-secret");
  return !!got && got === botSecret();
}
