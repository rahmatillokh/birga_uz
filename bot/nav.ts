import type { BotContext, Step } from "./context";
import type { ScreenKey } from "./texts";

/**
 * Ekranlar va matn-qadamlar reyestri: bo‘limlar bir-birini to‘g‘ridan-to‘g‘ri
 * import qilmasdan ochishi uchun (aylanma importlarsiz).
 */
export type Screen = (ctx: BotContext, arg?: string) => Promise<void>;

export const screens = new Map<ScreenKey, Screen>();
export const steps = new Map<Step, (ctx: BotContext) => Promise<void>>();

export function isScreenKey(s: string): s is ScreenKey {
  return screens.has(s as ScreenKey);
}

export async function open(key: ScreenKey, ctx: BotContext, arg?: string): Promise<void> {
  const fn = screens.get(key);
  if (!fn) throw new Error(`Ekran topilmadi: ${key}`);
  await fn(ctx, arg);
}
