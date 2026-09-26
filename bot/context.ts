import type { Context, SessionFlavor } from "grammy";

/** Bola profili yaratish jarayoni (qadam-baqadam) */
export interface ChildDraft {
  name?: string;
  age?: number;
  gender?: "o‘g‘il" | "qiz";
  /** CONCERN_OPTIONS indekslari */
  concerns: number[];
  regionId?: string;
  district?: string;
}

/** Mutaxassisga yozilish (izoh va tasdiqlash bosqichlari uchun) */
export interface ConsultDraft {
  spId: string;
  mode: "online" | "offline";
  date: string;
  time: string;
  childId?: string;
  note?: string;
}

/** Matn kutilayotgan qadamlar */
export type Step = "cc.name" | "rem.time" | "sp.note" | "support";

export interface SessionData {
  step?: Step;
  draft?: ChildDraft;
  consult?: ConsultDraft;
}

export interface BotFlavor {
  /** callback_query javobi (toast / alert) — middleware oxirida bir marta yuboriladi */
  cbAnswer?: { text?: string; show_alert?: boolean };
  /** true bo‘lsa render() eski xabarni tahrirlamaydi, yangi xabar yuboradi */
  forceNew?: boolean;
}

export type BotContext = Context & SessionFlavor<SessionData> & BotFlavor;
