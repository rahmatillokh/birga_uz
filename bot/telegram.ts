import type { Api, Transformer } from "grammy";
import type { InlineKeyboardButton } from "grammy/types";

/**
 * Bot API transformerlari:
 *  1) standart parse_mode = HTML va havola preview’siz;
 *  2) Telegram URL/web_app tugmasini rad etsa (noto‘g‘ri WEBAPP_URL) — xabar tugmalarsiz qayta yuboriladi,
 *     shunda bot hech qachon «jim» qolmaydi.
 */

const HTML_METHODS = new Set(["sendMessage", "editMessageText", "sendDocument", "sendPhoto", "editMessageCaption"]);
const TEXT_METHODS = new Set(["sendMessage", "editMessageText"]);
const BAD_URL = /BUTTON_URL_INVALID|WEB_APP_URL|BUTTON_TYPE_INVALID|wrong HTTP URL|URL_INVALID|host is empty/i;

const defaultHtml: Transformer = (prev, method, payload, signal) => {
  const p = payload as unknown as Record<string, unknown> | undefined;
  if (p && HTML_METHODS.has(method) && p.parse_mode === undefined && p.entities === undefined && p.caption_entities === undefined) {
    const next: Record<string, unknown> = { ...p, parse_mode: "HTML" };
    if (TEXT_METHODS.has(method) && next.link_preview_options === undefined) next.link_preview_options = { is_disabled: true };
    return prev(method, next as unknown as typeof payload, signal);
  }
  return prev(method, payload, signal);
};

const stripBadUrlButtons: Transformer = async (prev, method, payload, signal) => {
  const res = await prev(method, payload, signal);
  if (res.ok || res.error_code !== 400 || !BAD_URL.test(res.description)) return res;
  const p = payload as unknown as Record<string, unknown> | undefined;
  const markup = p?.reply_markup as { inline_keyboard?: InlineKeyboardButton[][] } | undefined;
  if (!markup?.inline_keyboard) return res;
  const rows = markup.inline_keyboard
    .map((r) => r.filter((b) => !("url" in b) && !("web_app" in b)))
    .filter((r) => r.length);
  console.warn(`[bot] ${method}: Telegram havola tugmasini rad etdi (${res.description}) — tugmasiz qayta yuborildi. WEBAPP_URL ni tekshiring.`);
  const next = { ...p, reply_markup: rows.length ? { inline_keyboard: rows } : undefined };
  return prev(method, next as unknown as typeof payload, signal);
};

export function installTransformers(api: Api): void {
  api.config.use(stripBadUrlButtons);
  api.config.use(defaultHtml);
}
