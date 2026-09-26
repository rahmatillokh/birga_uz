/**
 * Server tomonidan Telegram Bot API’ga to‘g‘ridan-to‘g‘ri xabar yuborish
 * (web ilovadagi harakatlar — yozilish, topshiriq, premium — botda bildirishnoma bo‘lib keladi).
 */
export type InlineButton = { text: string; url?: string; web_app?: { url: string }; callback_data?: string };

export function botToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN || undefined;
}

export function webAppUrl(path = "/"): string | undefined {
  const base = process.env.WEBAPP_URL?.replace(/\/$/, "");
  if (!base) return undefined;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** web_app tugmasi (faqat https bo‘lsa), aks holda oddiy url tugmasi */
export function appButton(text: string, path = "/"): InlineButton | undefined {
  const url = webAppUrl(path);
  if (!url) return undefined;
  return url.startsWith("https://") ? { text, web_app: { url } } : { text, url };
}

export async function sendTelegram(
  chatId: number | string,
  text: string,
  buttons: (InlineButton | undefined)[][] = [],
): Promise<boolean> {
  const token = botToken();
  if (!token) return false;
  const rows = buttons.map((r) => r.filter(Boolean) as InlineButton[]).filter((r) => r.length);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: rows.length ? { inline_keyboard: rows } : undefined,
      }),
    });
    if (!res.ok) console.warn("[telegram] sendMessage:", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.warn("[telegram] xato:", (e as Error).message);
    return false;
  }
}

/** uid "tg:123" bo‘lsa — foydalanuvchiga xabar */
export async function notifyUid(uid: string, text: string, buttons: (InlineButton | undefined)[][] = []) {
  if (!uid.startsWith("tg:")) return false;
  return sendTelegram(uid.slice(3), text, buttons);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
