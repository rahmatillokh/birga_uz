import type { Action, ActResult, Booking, FreeSession, ReminderSettings, UserView } from "@/lib/types";
import { apiUrl, botSecret } from "./config";

/**
 * Web API bilan aloqa. Barcha foydalanuvchi ma’lumotlari faqat shu yerdan o‘zgaradi:
 * POST /api/bot/view, POST /api/bot/act, GET /api/bot/reminders (x-bot-secret bilan).
 */

/** API ishlamayapti / javob bermayapti → foydalanuvchiga «Server bilan aloqa yo‘q» */
export class ApiDown extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiDown";
  }
}

export interface TgFrom {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface ReminderTask {
  emoji: string;
  title: string;
  durationMin: number;
  fromSpecialist: boolean;
}

export interface ReminderChild {
  childId?: string;
  childName: string;
  avatar: string;
  left: ReminderTask[];
  done: number;
}

/** GET /api/bot/reminders javobidagi bitta foydalanuvchi */
export interface ReminderUser {
  tgId: number;
  name: string;
  types: ReminderSettings["types"];
  children: ReminderChild[];
  bookingsTomorrow: Booking[];
  sessionTomorrow?: FreeSession;
  /** kundalik eslatma vaqti (false — faqat sessiya haqida xabar) */
  daily?: boolean;
  /** qayta baholash vaqti kelgan bolalar */
  reassessDue?: string[];
}

let forbiddenWarned = false;

async function call<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}, accept: number[] = [200]): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiUrl()}${path}`, {
      method: init.method ?? "GET",
      headers: { "content-type": "application/json", "x-bot-secret": botSecret() },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    throw new ApiDown(`${path}: ${(e as Error).message}`);
  }
  if (res.status === 403) {
    if (!forbiddenWarned) {
      forbiddenWarned = true;
      console.error(
        "[api] 403 — x-bot-secret mos kelmadi. Web server va bot bir xil TELEGRAM_BOT_TOKEN / BOT_API_SECRET bilan ishga tushirilganini tekshiring.",
      );
    }
    throw new ApiDown(`${path}: 403 (x-bot-secret mos emas)`);
  }
  const data = (await res.json().catch(() => null)) as T | null;
  if (data === null || !accept.includes(res.status)) {
    if (res.status >= 400 && res.status < 500) throw new Error(`API ${path}: HTTP ${res.status} ${JSON.stringify(data)}`);
    throw new ApiDown(`${path}: HTTP ${res.status}`);
  }
  return data;
}

function tgPayload(from: TgFrom): TgFrom {
  return {
    id: from.id,
    first_name: from.first_name,
    last_name: from.last_name,
    username: from.username,
    language_code: from.language_code,
  };
}

/** Foydalanuvchini ro‘yxatdan o‘tkazadi (kerak bo‘lsa) va uning barcha ma’lumotlarini qaytaradi */
export async function getView(from: TgFrom): Promise<UserView> {
  const data = await call<{ view?: UserView }>("/api/bot/view", { method: "POST", body: { tg: tgPayload(from) } });
  if (!data.view) throw new ApiDown("/api/bot/view: view yo‘q");
  return data.view;
}

/** Foydalanuvchi nomidan amal (web ilova bilan bir xil reducer). result.ok=false bo‘lsa — error matni bor */
export async function act(tgId: number, action: Action): Promise<{ result: ActResult; view: UserView }> {
  return call<{ result: ActResult; view: UserView }>("/api/bot/act", { method: "POST", body: { tgId, action } }, [200, 422]);
}

/** Shu daqiqada eslatma olishi kerak bo‘lgan foydalanuvchilar */
export async function getReminders(hhmm: string, weekday: number): Promise<ReminderUser[]> {
  const q = new URLSearchParams({ hhmm, weekday: String(weekday) });
  const data = await call<{ users?: ReminderUser[] }>(`/api/bot/reminders?${q}`);
  return data.users ?? [];
}

/** Ishga tushishdagi tekshiruv: API ishlayaptimi va maxfiy kalit to‘g‘rimi */
export async function selfCheck(): Promise<"ok" | "forbidden" | "down"> {
  try {
    const res = await fetch(`${apiUrl()}/api/bot/reminders?hhmm=99:99&weekday=0`, {
      headers: { "x-bot-secret": botSecret() },
      signal: AbortSignal.timeout(8_000),
    });
    if (res.status === 403) return "forbidden";
    return res.ok ? "ok" : "down";
  } catch {
    return "down";
  }
}

// ---------------------------------------------------------------------------
// ctx bilan qulay yordamchilar
// ---------------------------------------------------------------------------

export function who(ctx: { from?: TgFrom }): TgFrom {
  if (!ctx.from) throw new Error("Foydalanuvchi aniqlanmadi (ctx.from yo‘q)");
  return ctx.from;
}

export function viewOf(ctx: { from?: TgFrom }): Promise<UserView> {
  return getView(who(ctx));
}

export function actAs(ctx: { from?: TgFrom }, action: Action): Promise<{ result: ActResult; view: UserView }> {
  return act(who(ctx).id, action);
}
