/** Bot matnlari va menyu tuzilmasi (UI tili — o‘zbek, lotin) */

export const BRAND = "YuniQo — Har bir bola uchun imkoniyat";
export const SERVER_DOWN = "Server bilan aloqa yo‘q, birozdan so‘ng urinib ko‘ring";

/** Asosiy menyu (reply keyboard) tugmalari */
export const MENU = {
  child: "👶 Bola profili",
  quiz: "📝 Savolnoma",
  result: "🧠 Baholash natijasi",
  ex: "🎯 Bugungi mashqlar",
  ss: "📅 Bepul sessiyalar",
  dz: "📍 Tuman sessiyalari",
  sp: "👨‍⚕️ Mutaxassislar",
  pr: "📊 Progress",
  rp: "📁 Hisobot olish",
  rem: "🔔 Eslatmalar",
  al: "🏢 Sessiya xabarlari",
  com: "👨‍👩‍👧 Hamjamiyat",
  vid: "🎥 Videolar",
  mkt: "🛒 Market",
  pm: "💎 Premium",
  news: "📢 Yangiliklar",
  faq: "❓ Savol-javob",
  sup: "🆘 Qo‘llab-quvvatlash",
} as const;

export type MenuKey = keyof typeof MENU;
export type ScreenKey = MenuKey | "home" | "app" | "help" | "bk";

/** 2 ustunli asosiy menyu */
export const MENU_LAYOUT: MenuKey[][] = [
  ["child", "quiz"],
  ["result", "ex"],
  ["ss", "dz"],
  ["sp", "pr"],
  ["rp", "rem"],
  ["al", "com"],
  ["vid", "mkt"],
  ["pm", "news"],
  ["faq", "sup"],
];

export const MENU_TEXTS = new Set<string>(Object.values(MENU));

/** setMyCommands ro‘yxati */
export const COMMANDS: { command: string; description: string; screen: ScreenKey }[] = [
  { command: "start", description: "Botni ishga tushirish", screen: "home" },
  { command: "menu", description: "Asosiy menyu", screen: "home" },
  { command: "profil", description: "Bola profili", screen: "child" },
  { command: "baholash", description: "Rivojlanish savolnomasi", screen: "quiz" },
  { command: "mashqlar", description: "Bugungi mashqlar", screen: "ex" },
  { command: "sessiyalar", description: "Bepul sessiyalarga yozilish", screen: "ss" },
  { command: "mutaxassis", description: "Mutaxassis topish", screen: "sp" },
  { command: "progress", description: "Qisqa progress", screen: "pr" },
  { command: "hisobot", description: "Rivojlanish hisobotini olish", screen: "rp" },
  { command: "premium", description: "Premium obuna", screen: "pm" },
  { command: "yordam", description: "Yordam va savol-javob", screen: "help" },
];

/** Ro‘yxatda ko‘rinmaydigan qo‘shimcha buyruqlar */
export const EXTRA_COMMANDS: { command: string; screen: ScreenKey }[] = [
  { command: "app", screen: "app" },
  { command: "help", screen: "help" },
  { command: "natija", screen: "result" },
  { command: "eslatmalar", screen: "rem" },
  { command: "yozilishlar", screen: "bk" },
  { command: "tuman", screen: "dz" },
  { command: "xabarlar", screen: "al" },
  { command: "hamjamiyat", screen: "com" },
  { command: "videolar", screen: "vid" },
  { command: "market", screen: "mkt" },
  { command: "yangiliklar", screen: "news" },
  { command: "faq", screen: "faq" },
  { command: "support", screen: "sup" },
];

export const BOOKING_STATUS: Record<string, string> = {
  kutilmoqda: "⏳ Tasdiq kutilmoqda",
  tasdiqlandi: "✅ Tasdiqlandi",
  bekor: "❌ Bekor qilingan",
  otdi: "✔️ O‘tdi",
};

export const MODE_LABEL = {
  online: "💻 Online",
  offline: "🏥 Offline qabul",
} as const;

export const DISCLAIMER = "ℹ️ <i>Bu tibbiy tashxis emas — natijalar mutaxassis bilan maslahatlashish uchun yo‘nalish beradi.</i>";
