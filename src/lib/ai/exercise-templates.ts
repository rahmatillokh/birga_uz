import type { Domain } from "@/lib/types";

/** AI mashq generatori uchun oflayn shablonlar (Claude kaliti bo‘lmaganda) */
export interface GeneratedExercise {
  title: string;
  emoji: string;
  domain: Domain;
  goal: string;
  materials: string[];
  steps: string[];
  tips: string[];
  durationMin: number;
}

const INTEREST_THEMES: Record<string, { word: string; emoji: string; items: string[]; animate: boolean }> = {
  Mashinalar: { word: "mashina", emoji: "🚗", items: ["o‘yinchoq mashinalar", "karton yo‘l"], animate: true },
  Dinozavrlar: { word: "dinozavr", emoji: "🦖", items: ["dinozavr o‘yinchoqlari", "qog‘oz"], animate: true },
  Hayvonlar: { word: "hayvoncha", emoji: "🐾", items: ["hayvon o‘yinchoqlari yoki rasmlari"], animate: true },
  "Qo‘g‘irchoqlar": { word: "qo‘g‘irchoq", emoji: "🪆", items: ["qo‘g‘irchoqlar", "kichik idishlar"], animate: true },
  "Rasm chizish": { word: "qalam", emoji: "🖍️", items: ["rangli qalamlar", "oq qog‘oz"], animate: false },
  Konstruktor: { word: "kubik", emoji: "🧱", items: ["konstruktor kubiklari"], animate: false },
};

const DEFAULT_THEME = { word: "ayiqcha", emoji: "🧸", items: ["yumshoq o‘yinchoqlar"], animate: true };

export function templateExercise(domain: Domain, interests: string[], name: string, seed = Date.now()): GeneratedExercise {
  const needAnimate = domain === "yirik_motorika" || domain === "ijtimoiy";
  const known = interests.map((i) => INTEREST_THEMES[i]).filter((t) => t && (!needAnimate || t.animate));
  const theme = known.length ? known[Math.abs(Math.floor(seed / 1000)) % known.length] : DEFAULT_THEME;
  const w = theme.word;
  switch (domain) {
    case "nutq":
      return {
        title: `«${w[0].toUpperCase() + w.slice(1)}lar sayohati» — tovushlar o‘yini`,
        emoji: theme.emoji,
        domain,
        goal: `${name}ning sevimli ${w}lari yordamida qiyin tovushlarni bo‘g‘in va so‘zlarda mashq qilish, so‘z boyligini oshirish.`,
        materials: [...theme.items, "ko‘zgu"],
        steps: [
          `${w[0].toUpperCase() + w.slice(1)}larni stolga qo‘ying va har biriga «ism» qo‘ying — ismida R yoki Sh tovushi bo‘lsin (masalan, «Rustam», «Shoxa»).`,
          `Har bir ${w}ni harakatlantirganda uning ismini birga baland ovozda ayting.`,
          `${w[0].toUpperCase() + w.slice(1)} «tepalikka chiqsa» — tovushni cho‘zib ayting: «Rrrr-ustam!».`,
          `${name} xato aytsa, tuzatmang — o‘zingiz to‘g‘ri aytib, qaytaring.`,
          "Oxirida 3 ta so‘zdan gap tuzing: «Rustam tez yuradi».",
        ],
        tips: ["5–7 daqiqadan oshirmang", "Har to‘g‘ri urinishni maqtang", "Ko‘zgu oldida lab va til holatini ko‘rsating"],
        durationMin: 7,
      };
    case "kognitiv":
      return {
        title: `«Qaysi ${w} yo‘qoldi?» — diqqat va xotira`,
        emoji: theme.emoji,
        domain,
        goal: `${name}ning ko‘rish xotirasi va diqqatini qiziqarli ${w}lar orqali mashq qilish.`,
        materials: [...theme.items, "ro‘molcha"],
        steps: [
          `Stolga 4–5 ta ${w}ni qator qilib qo‘ying va ${name} bilan birga nomlang.`,
          "Bolaga 10 soniya diqqat bilan qarashni ayting.",
          "Ro‘molcha bilan yoping va bittasini yashirib oling.",
          "Ro‘molchani oling: «Qaysi biri yo‘qoldi?» deb so‘rang.",
          "Muvaffaqiyatli bo‘lsa, buyumlar sonini 1 taga oshiring yoki tartibini almashtiring.",
        ],
        tips: ["Qiyin bo‘lsa, 3 ta buyumdan boshlang", "Rollarni almashtiring — endi bola yashirsin"],
        durationMin: 6,
      };
    case "mayda_motorika":
      return {
        title: `«${w[0].toUpperCase() + w.slice(1)} uchun yo‘l» — barmoqlar mashqi`,
        emoji: theme.emoji,
        domain,
        goal: "Barmoqlar kuchi, aniqligi va qalam ushlash ko‘nikmasini rivojlantirish.",
        materials: ["plastilin", "qog‘oz", "qalam", ...theme.items.slice(0, 1)],
        steps: [
          `Qog‘ozga egri-bugri «yo‘l» chizing — ${w} shu yo‘ldan o‘tadi.`,
          `${name} barmog‘i bilan yo‘l bo‘ylab yurib chiqsin, keyin qalam bilan chizsin.`,
          "Plastilindan kichik «toshlar» (sharchalar) yasab, yo‘l bo‘ylab tering.",
          `${w[0].toUpperCase() + w.slice(1)}ni yo‘ldan olib o‘ting — toshlarga tegmasin.`,
        ],
        tips: ["Qalamni uch barmoq bilan ushlashni kuzating", "Mayda buyumlar bilan faqat kattalar nazoratida o‘ynang"],
        durationMin: 8,
      };
    case "yirik_motorika":
      return {
        title: `«${w[0].toUpperCase() + w.slice(1)} bilan orolchalar sayohati» — muvozanat o‘yini`,
        emoji: theme.emoji,
        domain,
        goal: "Muvozanat, koordinatsiya va oyoq mushaklarini mustahkamlash (yassi oyoqlik profilaktikasi).",
        materials: ["yalangoyoq", "yostiq yoki gilamcha", ...theme.items.slice(0, 1)],
        steps: [
          `Yerga 5–6 ta «orolcha» (yostiq/gilamcha) qo‘ying, oxirgisiga ${w}ni qo‘ying — uni «qutqarish» kerak.`,
          "Orolchadan orolchaga oyoq uchida o‘ting.",
          "Har bir orolchada bir oyoqda 5 soniya turing.",
          "Qaytishda tovonda yuring.",
          "AI video nazorat bilan «Bir oyoqda turish» ni tekshirib ko‘ring.",
        ],
        tips: ["Sirpanchiq bo‘lmagan joyda bajaring", "Og‘riq bo‘lsa to‘xtating"],
        durationMin: 8,
      };
    case "ijtimoiy":
      return {
        title: `«${w[0].toUpperCase() + w.slice(1)}ning kayfiyati» — hissiyotlar o‘yini`,
        emoji: theme.emoji,
        domain,
        goal: "Hissiyotlarni tanish, nomlash va navbat bilan o‘ynash ko‘nikmasini rivojlantirish.",
        materials: [...theme.items, "hissiyotlar kartochkalari (😊😢😠😨)"],
        steps: [
          `${w[0].toUpperCase() + w.slice(1)} bilan qisqa sahna o‘ynang: u o‘yinchog‘ini yo‘qotdi — qanday his qiladi?`,
          `${name} tegishli yuz kartochkasini tanlasin va hissiyotni nomlasin.`,
          "«Unga qanday yordam beramiz?» deb so‘rang.",
          "Navbat bilan rollarni almashtiring.",
        ],
        tips: ["O‘z hissiyotlaringizni ham so‘z bilan ayting", "To‘g‘ri javobni emas, fikrni maqtang"],
        durationMin: 7,
      };
    default:
      return {
        title: `«${w[0].toUpperCase() + w.slice(1)}ni yig‘ishtiramiz» — mustaqillik`,
        emoji: theme.emoji,
        domain: "mustaqillik",
        goal: "Kundalik ishlarni ketma-ket bajarish va mustaqillik ko‘nikmasini shakllantirish.",
        materials: [...theme.items, "savat yoki quti"],
        steps: [
          "O‘yindan keyin «yig‘ishtirish qo‘shig‘ini» boshlang.",
          `${name} ${w}larni rangiga yoki turiga qarab savatga tersin.`,
          "Har bir qadamni rasm bilan ko‘rsating: yig‘ish → qo‘yish → qo‘l yuvish.",
          "Tugagach, birgalikda «besh» qiling ✋.",
        ],
        tips: ["Taymer qo‘ying — o‘yin kabi qiziqarli bo‘ladi", "Oxirgi qadamni bolaga qoldiring"],
        durationMin: 5,
      };
  }
}
