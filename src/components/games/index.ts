import { AttentionGame } from "./attention-game";
import { EmotionGame } from "./emotion-game";
import { MatchGame } from "./match-game";
import { MemoryGame } from "./memory-game";
import { PatternGame } from "./pattern-game";
import { ProblemGame } from "./problem-game";
import { SequenceGame } from "./sequence-game";
import { SortGame } from "./sort-game";
import { TapGame } from "./tap-game";
import type { GameDef } from "./types";

/** O‘yin id (src/data/games.ts) → komponent va ko‘rsatmalar */
export const GAME_REGISTRY: Record<string, GameDef> = {
  xotira: {
    component: MemoryGame,
    howTo: "Kartalarni ikkitadan oching va bir xil rasmlar juftini toping. Boshida rasmlarni yaxshilab eslab qoling!",
    parentTip: "Xotira o‘yinlari ko‘rish xotirasi va diqqatni mustahkamlaydi. Karta ochilganda rasm nomini birga ayting — so‘z boyligi ham oshadi.",
    duration: "1–2 daqiqa",
  },
  diqqat: {
    component: AttentionGame,
    howTo: "Tepadagi rasmga qarang va katakchalar orasidan uning hammasini tezroq toping.",
    levelNote: { 3: "Diqqat: bir-biriga juda o‘xshash rasmlar bor!" },
    parentTip: "Tanlab diqqat qilish — maktabga tayyorgarlikning muhim qismi. Shoshirmang: avval to‘g‘ri, keyin tez topishga undang.",
    duration: "1–2 daqiqa",
  },
  mantiq: {
    component: PatternGame,
    howTo: "Qatorga diqqat bilan qarang: rasmlar qanday takrorlanyapti? Keyingi rasmni tanlang.",
    parentTip: "Qonuniyatni topish matematik tafakkurning asosi. Qatorni birga ovoz chiqarib o‘qing: «olma, banan, olma, banan…».",
    duration: "1–2 daqiqa",
  },
  "rang-shakl": {
    component: SortGame,
    howTo: "Shaklni bosing yoki barmoq bilan sudrang va uni to‘g‘ri savatga joylang.",
    levelNote: { 3: "Diqqat: o‘yin o‘rtasida qoida o‘zgaradi!" },
    parentTip: "Saralash rang va shakllarni farqlashni, qoidaga amal qilishni o‘rgatadi. Uyda ham o‘yinchoqlarni rangiga qarab birga yig‘ishtiring.",
    duration: "1–2 daqiqa",
  },
  moslash: {
    component: MatchGame,
    howTo: "Chapdagi rasmni, keyin o‘ngdagi uning juftini bosing — ular chiziq bilan bog‘lanadi.",
    parentTip: "Moslashtirish narsalar orasidagi bog‘lanishni tushunishga yordam beradi. «Nega kuchukchaga suyak?» deb so‘rang va javobini tinglang.",
    duration: "1–2 daqiqa",
  },
  "ketma-ketlik": {
    component: SequenceGame,
    howTo: "Nima avval, nima keyin? Rasmlarni to‘g‘ri tartibda birma-bir bosing.",
    parentTip: "Ketma-ketlikni tushunish kun tartibiga o‘rganish va hikoya qilishga yordam beradi. Rasmlarni «avval…, keyin…» deb birga aytib bering.",
    duration: "1–2 daqiqa",
  },
  muammo: {
    component: ProblemGame,
    howTo: "Vaziyatga qarang va eng to‘g‘ri yechimni tanlang.",
    levelNote: { 2: "Sanash va «ortiqchasini top» savollari ham bor.", 3: "Sanash, qo‘shish-ayirish va mantiqiy savollar ham bor." },
    parentTip: "Hayotiy vaziyatlarni muhokama qilish mustaqillik va xavfsizlik ko‘nikmalarini shakllantiradi. «Sen nima qilarding?» deb so‘rang.",
    duration: "≈ 2 daqiqa",
  },
  hissiyot: {
    component: EmotionGame,
    howTo: "Yuzchaga yoki vaziyatga qarang va u qanday his qilayotganini toping.",
    parentTip: "Hissiyotni nomlay olish — o‘zini boshqarishning birinchi qadami. Kun davomida «Hozir qanday his qilyapsan?» deb so‘rab turing.",
    duration: "≈ 2 daqiqa",
  },
  "tez-barmoq": {
    component: TapGame,
    howTo: "Yulduzchalar paydo bo‘lishi bilan ularni tez bosing! 30 soniyada iloji boricha ko‘p yulduz yig‘ing.",
    levelNote: { 3: "Diqqat: 💣 bombani bosmang!" },
    parentTip: "Tez reaksiya va ko‘z-qo‘l koordinatsiyasi yozish va rasm chizish uchun muhim. Ko‘rsatkich barmoq bilan bosishga undang.",
    duration: "30 soniya",
  },
};

export function getGameDef(id?: string): GameDef | undefined {
  return id && Object.prototype.hasOwnProperty.call(GAME_REGISTRY, id) ? GAME_REGISTRY[id] : undefined;
}

export { GameShell } from "./game-shell";
export { levelForAge, levelLabel, starsFor } from "./lib";
export type { GameDef, GameProps, GameResult, Level } from "./types";
