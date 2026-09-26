import type { Domain } from "@/lib/types";

export interface GameMeta {
  id: string;
  title: string;
  emoji: string;
  domain: Domain;
  skill: string; // "Xotira o‘yinlari", "Diqqat o‘yinlari" ...
  description: string;
  ageMin: number;
  color: string;
}

/** Rivojlantiruvchi o‘yinlar ro‘yxati (komponentlar: src/components/games/*) */
export const GAMES: GameMeta[] = [
  {
    id: "xotira",
    title: "Xotira kartalari",
    emoji: "🃏",
    domain: "kognitiv",
    skill: "Xotira",
    description: "Kartalarni ochib, bir xil rasmlar juftini toping.",
    ageMin: 3,
    color: "#eb6834",
  },
  {
    id: "diqqat",
    title: "Diqqatni top",
    emoji: "🔍",
    domain: "kognitiv",
    skill: "Diqqat",
    description: "Ko‘plab rasmlar orasidan kerakli rasmni tez toping.",
    ageMin: 3,
    color: "#2a78d6",
  },
  {
    id: "mantiq",
    title: "Keyingisi qaysi?",
    emoji: "🧩",
    domain: "kognitiv",
    skill: "Mantiq",
    description: "Qatordagi qonuniyatni topib, keyingi rasmni tanlang.",
    ageMin: 4,
    color: "#4a3aa7",
  },
  {
    id: "rang-shakl",
    title: "Rang va shakllar",
    emoji: "🔺",
    domain: "kognitiv",
    skill: "Rang va shakllar",
    description: "Shakllarni rangi va turiga qarab to‘g‘ri savatga joylang.",
    ageMin: 2,
    color: "#1baf7a",
  },
  {
    id: "moslash",
    title: "Juftini top",
    emoji: "🔗",
    domain: "kognitiv",
    skill: "Moslashtirish",
    description: "Hayvonni uyi bilan, buyumni vazifasi bilan moslang.",
    ageMin: 3,
    color: "#eda100",
  },
  {
    id: "ketma-ketlik",
    title: "Kun tartibi",
    emoji: "🌅",
    domain: "mustaqillik",
    skill: "Ketma-ketlik",
    description: "Rasmlarni to‘g‘ri tartibda joylashtiring: avval nima, keyin nima?",
    ageMin: 4,
    color: "#008300",
  },
  {
    id: "muammo",
    title: "Kichik muammolar",
    emoji: "💡",
    domain: "kognitiv",
    skill: "Muammo yechish",
    description: "Hayotiy vaziyatlarda to‘g‘ri yechimni toping.",
    ageMin: 4,
    color: "#eb6834",
  },
  {
    id: "hissiyot",
    title: "Hissiyotlar",
    emoji: "😊",
    domain: "ijtimoiy",
    skill: "Ijtimoiy ko‘nikmalar",
    description: "Yuz ifodasiga qarab hissiyotni aniqlang.",
    ageMin: 3,
    color: "#e87ba4",
  },
  {
    id: "tez-barmoq",
    title: "Chaqqon barmoqlar",
    emoji: "👆",
    domain: "mayda_motorika",
    skill: "Ko‘z-qo‘l koordinatsiyasi",
    description: "Ekranda paydo bo‘lgan yulduzchalarni tezda bosing.",
    ageMin: 3,
    color: "#1baf7a",
  },
];

export function getGame(id?: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}
