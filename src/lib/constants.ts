import type {
  AgeBand,
  AiCheckId,
  ArticleTopic,
  Domain,
  ProductCategory,
  Section,
  SessionType,
  SpecialtyId,
  VideoCategory,
} from "./types";

export const APP_NAME = "YuniQo";
export const APP_TAGLINE = "Har bir bola uchun imkoniyat";

/**
 * Rivojlanish yo‘nalishlari. Ranglar tekshirilgan kategorial palitradan
 * (rangni ajrata olmaydiganlar uchun ham farqlanadi) — tartibini o‘zgartirmang.
 */
export const DOMAINS: Record<
  Domain,
  { label: string; short: string; emoji: string; color: string; soft: string; description: string }
> = {
  nutq: {
    label: "Nutq",
    short: "Nutq",
    emoji: "🗣️",
    color: "#2a78d6",
    soft: "#e7f0fb",
    description: "Talaffuz, so‘z boyligi, gap tuzish va tushunish",
  },
  kognitiv: {
    label: "Diqqat va tafakkur",
    short: "Kognitiv",
    emoji: "🧠",
    color: "#eb6834",
    soft: "#fdeee7",
    description: "Diqqat, xotira, idrok va mantiqiy fikrlash",
  },
  mayda_motorika: {
    label: "Mayda motorika",
    short: "Mayda mot.",
    emoji: "✋",
    color: "#1baf7a",
    soft: "#e3f6ef",
    description: "Barmoqlar harakati, qalam ushlash, qaychi bilan ishlash",
  },
  yirik_motorika: {
    label: "Yirik motorika",
    short: "Yirik mot.",
    emoji: "🏃",
    color: "#eda100",
    soft: "#fdf3dc",
    description: "Yugurish, sakrash, muvozanat va koordinatsiya",
  },
  ijtimoiy: {
    label: "Ijtimoiy-emotsional",
    short: "Ijtimoiy",
    emoji: "🤝",
    color: "#e87ba4",
    soft: "#fcecf2",
    description: "Muloqot, hissiyotlarni boshqarish, o‘yinda ishtirok",
  },
  mustaqillik: {
    label: "Mustaqillik",
    short: "Mustaqillik",
    emoji: "🧦",
    color: "#008300",
    soft: "#e2f2e2",
    description: "Kundalik hayot ko‘nikmalari: kiyinish, ovqatlanish, gigiyena",
  },
};

export const DOMAIN_ORDER: Domain[] = [
  "nutq",
  "kognitiv",
  "mayda_motorika",
  "yirik_motorika",
  "ijtimoiy",
  "mustaqillik",
];

/** Holat ranglari — faqat daraja/holat uchun, har doim ikonka va yozuv bilan */
export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export function scoreLevel(score: number): {
  key: "good" | "warning" | "critical";
  label: string;
  color: string;
  icon: string;
} {
  if (score >= 70) return { key: "good", label: "Yaxshi", color: STATUS.good, icon: "✅" };
  if (score >= 45) return { key: "warning", label: "Rivojlanmoqda", color: STATUS.warning, icon: "🟡" };
  return { key: "critical", label: "E’tibor kerak", color: STATUS.critical, icon: "❗" };
}

export const SECTIONS: Record<
  Section,
  { label: string; emoji: string; color: string; soft: string; description: string; specialty: SpecialtyId }
> = {
  logoped: {
    label: "Logoped mashqlari",
    emoji: "🗣️",
    color: "#2a78d6",
    soft: "#e7f0fb",
    description: "Artikulyatsiya, talaffuz, nafas va so‘z boyligi",
    specialty: "logoped",
  },
  defektolog: {
    label: "Defektolog mashqlari",
    emoji: "🧩",
    color: "#eb6834",
    soft: "#fdeee7",
    description: "Diqqat, xotira, idrok, tafakkur, maktabga tayyorgarlik",
    specialty: "defektolog",
  },
  motorika: {
    label: "Motorika va yassi oyoqlik",
    emoji: "🦶",
    color: "#1baf7a",
    soft: "#e3f6ef",
    description: "Mayda va yirik motorika, muvozanat, yassi oyoqlik mashqlari",
    specialty: "fizioterapevt",
  },
};

export const SPECIALTIES: Record<SpecialtyId, { label: string; emoji: string; description: string }> = {
  logoped: { label: "Logoped", emoji: "👩‍🏫", description: "Nutq va talaffuz buzilishlarini tuzatish" },
  defektolog: { label: "Defektolog", emoji: "🧩", description: "Rivojlanishida o‘ziga xosligi bor bolalar bilan ishlash" },
  psixolog: { label: "Bolalar psixologi", emoji: "🧠", description: "Xulq, hissiyot va ijtimoiy moslashuv" },
  fizioterapevt: { label: "Fizioterapevt", emoji: "🦶", description: "Harakat, tayanch-harakat tizimi, yassi oyoqlik" },
  reabilitolog: { label: "Reabilitolog", emoji: "🏃", description: "Reabilitatsiya va tiklanish dasturlari" },
  pediatr: { label: "Pediatr", emoji: "👨‍⚕️", description: "Bolalar salomatligi va umumiy rivojlanish" },
  surdopedagog: { label: "Surdopedagog", emoji: "👂", description: "Eshitishida muammosi bor bolalar bilan ishlash" },
  tiflopedagog: { label: "Tiflopedagog", emoji: "👁️", description: "Ko‘rishida muammosi bor bolalar bilan ishlash" },
  maxsus_pedagog: { label: "Maxsus pedagog", emoji: "🧑‍🏫", description: "Individual ta’lim dasturlari" },
  nutq_terapevti: { label: "Nutq terapevti", emoji: "🗣️", description: "Nutq va muloqot terapiyasi" },
};

export const SPECIALTY_ORDER: SpecialtyId[] = [
  "logoped",
  "defektolog",
  "psixolog",
  "fizioterapevt",
  "reabilitolog",
  "pediatr",
  "surdopedagog",
  "tiflopedagog",
  "maxsus_pedagog",
  "nutq_terapevti",
];

export const SESSION_TYPES: Record<SessionType, { label: string; emoji: string; color: string }> = {
  konsultatsiya: { label: "Bepul dastlabki konsultatsiya", emoji: "🩺", color: "#2a78d6" },
  seminar: { label: "Ota-onalar uchun seminar", emoji: "🎓", color: "#eb6834" },
  amaliy: { label: "Bolalar uchun amaliy mashg‘ulot", emoji: "🧸", color: "#1baf7a" },
  uchrashuv: { label: "Mutaxassislar bilan uchrashuv", emoji: "🤝", color: "#e87ba4" },
};

export const PRODUCT_CATEGORIES: Record<ProductCategory, { label: string; emoji: string }> = {
  oyinchoq: { label: "Rivojlantiruvchi o‘yinchoqlar", emoji: "🧸" },
  logopedik: { label: "Logopedik materiallar", emoji: "🗣️" },
  didaktik: { label: "Didaktik materiallar", emoji: "🧩" },
  motorika: { label: "Motorika vositalari", emoji: "✋" },
  jihoz: { label: "Mashg‘ulot jihozlari", emoji: "🦶" },
  kitob: { label: "Kitoblar", emoji: "📚" },
};

export const ARTICLE_TOPICS: Record<ArticleTopic, { label: string; emoji: string; color: string }> = {
  autizm: { label: "Autizm", emoji: "🧩", color: "#2a78d6" },
  daun: { label: "Daun sindromi", emoji: "💛", color: "#eda100" },
  nutq: { label: "Nutq kechikishi", emoji: "🗣️", color: "#eb6834" },
  motorika: { label: "Motorik rivojlanish", emoji: "🤸", color: "#1baf7a" },
  yassi_oyoq: { label: "Yassi oyoqlik", emoji: "🦶", color: "#e87ba4" },
  organish: { label: "O‘rganish qiyinchiliklari", emoji: "📖", color: "#008300" },
  qollanma: { label: "Ota-onalar uchun qo‘llanmalar", emoji: "👨‍👩‍👧", color: "#4a3aa7" },
};

export const VIDEO_CATEGORIES: Record<VideoCategory, { label: string; emoji: string; domain: Domain }> = {
  nutq: { label: "Nutq", emoji: "🗣️", domain: "nutq" },
  motorika: { label: "Motorika", emoji: "🤸", domain: "yirik_motorika" },
  diqqat: { label: "Diqqat", emoji: "🎯", domain: "kognitiv" },
  xotira: { label: "Xotira", emoji: "🧠", domain: "kognitiv" },
  mantiq: { label: "Mantiq", emoji: "🧩", domain: "kognitiv" },
  ijtimoiy: { label: "Ijtimoiy ko‘nikmalar", emoji: "🤝", domain: "ijtimoiy" },
  kundalik: { label: "Kundalik hayot ko‘nikmalari", emoji: "🪥", domain: "mustaqillik" },
};

export const AGE_BANDS: Record<AgeBand, { label: string; min: number; max: number }> = {
  "1-3": { label: "1–3 yosh", min: 1, max: 3 },
  "3-5": { label: "3–5 yosh", min: 3, max: 5 },
  "5-7": { label: "5–7 yosh", min: 5, max: 7 },
};

export function bandForAge(ageYears: number): AgeBand {
  if (ageYears < 3) return "1-3";
  if (ageYears < 5) return "3-5";
  return "5-7";
}

export const AI_CHECKS: Record<
  AiCheckId,
  { title: string; emoji: string; domain: Domain; description: string; kind: "pose" | "face" | "speech" }
> = {
  "arms-up": {
    title: "Qo‘llarni yuqoriga ko‘tarish",
    emoji: "🙌",
    domain: "yirik_motorika",
    description: "Ikkala qo‘lni boshdan baland ko‘tarib, pastga tushirish",
    kind: "pose",
  },
  squat: {
    title: "O‘tirib-turish",
    emoji: "🏋️",
    domain: "yirik_motorika",
    description: "Tizzalarni bukib o‘tirish va qaddini rostlab turish",
    kind: "pose",
  },
  balance: {
    title: "Bir oyoqda turish",
    emoji: "🦩",
    domain: "yirik_motorika",
    description: "Muvozanatni saqlab, bir oyoqda imkon qadar uzoq turish",
    kind: "pose",
  },
  tiptoe: {
    title: "Oyoq uchida ko‘tarilish",
    emoji: "🩰",
    domain: "yirik_motorika",
    description: "Yassi oyoqlik profilaktikasi: tovonni ko‘tarib, oyoq uchida turish",
    kind: "pose",
  },
  airplane: {
    title: "Samolyotcha",
    emoji: "✈️",
    domain: "yirik_motorika",
    description: "Qo‘llarni yon tomonga yozib, tana holatini ushlab turish",
    kind: "pose",
  },
  "smile-pucker": {
    title: "Tabassum — Naycha",
    emoji: "😁",
    domain: "nutq",
    description: "Artikulyatsion gimnastika: lablarni tabassum va naycha holatiga keltirish",
    kind: "face",
  },
  speech: {
    title: "Talaffuzni tekshirish",
    emoji: "🎙️",
    domain: "nutq",
    description: "So‘zlarni aytish va AI orqali talaffuzni baholash",
    kind: "speech",
  },
};

/** Bolaning tashvishlari (profil yaratishda tanlanadi) */
export const CONCERN_OPTIONS = [
  "Nutq kechikishi",
  "Tovushlarni noto‘g‘ri talaffuz qilish",
  "Diqqatni jamlay olmaslik",
  "Giperaktivlik",
  "Mayda motorika sustligi",
  "Yassi oyoqlik",
  "Muvozanat va koordinatsiya",
  "Muloqotdan qochish",
  "Xulq-atvor qiyinchiliklari",
  "Maktabga tayyorgarlik",
  "Eshitish muammosi",
  "Ko‘rish muammosi",
];

export const INTEREST_OPTIONS = [
  "Mashinalar",
  "Hayvonlar",
  "Rasm chizish",
  "Musiqa",
  "Konstruktor",
  "Qo‘g‘irchoqlar",
  "Dinozavrlar",
  "Kitoblar",
  "Raqs",
  "To‘p o‘yinlari",
  "Multfilmlar",
  "Plastilin",
];

export const CHILD_AVATARS = ["🧒", "👦", "👧", "🧑‍🚀", "🦁", "🐻", "🐰", "🦊", "🐼", "🐯", "🦄", "🐸"];

/** Ball tizimi */
export const POINTS: Record<string, number> = {
  exercise: 10,
  game: 5,
  video: 3,
  ai_check: 15,
  speech: 10,
  lesson: 8,
  assessment: 20,
  article: 2,
};

export const LEVELS = [
  { min: 0, title: "Kichik qadam", emoji: "🌱" },
  { min: 200, title: "Izlanuvchi", emoji: "🔎" },
  { min: 600, title: "Harakatchan", emoji: "🚀" },
  { min: 1200, title: "Bilimdon", emoji: "📘" },
  { min: 2000, title: "Yulduzcha", emoji: "⭐" },
  { min: 3000, title: "Chempion", emoji: "🏆" },
  { min: 4500, title: "Qahramon", emoji: "🦸" },
  { min: 6500, title: "Afsona", emoji: "👑" },
];

export const PREMIUM_PRICES = {
  month: 79000,
  year: 690000,
  consultation: 150000,
};

export const PREMIUM_FEATURES: { title: string; emoji: string; free: boolean | string; premium: boolean | string }[] = [
  { title: "Asosiy rivojlanish baholashi", emoji: "🧠", free: true, premium: true },
  { title: "Mashqlar kutubxonasi", emoji: "🎯", free: "Cheklangan", premium: "To‘liq" },
  { title: "Rivojlantiruvchi videolar", emoji: "🎥", free: true, premium: "+ Premium videolar" },
  { title: "Ota-onalar hamjamiyati", emoji: "👨‍👩‍👧", free: true, premium: true },
  { title: "Bepul tuman sessiyalari", emoji: "🏢", free: true, premium: true },
  { title: "AI yordamchi", emoji: "✨", free: "Kuniga 3 savol", premium: "Cheksiz" },
  { title: "AI video nazorat", emoji: "📹", free: false, premium: true },
  { title: "Individual rivojlanish dasturi", emoji: "📋", free: "Asosiy", premium: "AI bilan kengaytirilgan" },
  { title: "Kengaytirilgan progress va grafiklar", emoji: "📈", free: false, premium: true },
  { title: "Mutaxassis konsultatsiyalari", emoji: "📞", free: false, premium: "Oyiga 1 ta bepul" },
  { title: "Batafsil rivojlanish hisoboti (PDF)", emoji: "📁", free: false, premium: true },
];

export const WEEKDAYS_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
export const WEEKDAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
export const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

/** Demo rejimdagi foydalanuvchi va mutaxassis */
export const DEMO_UID = "demo";
export const DEMO_SPECIALIST_ID = "sp-dilnoza";
