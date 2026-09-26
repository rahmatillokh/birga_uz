import type { ComponentType } from "react";

/** O‘yin darajasi: 1 — Oson, 2 — O‘rta, 3 — Qiyin */
export type Level = 1 | 2 | 3;

export interface GameResult {
  /** To‘g‘ri javoblar / topilganlar soni */
  correct: number;
  /** Jami (raundlar, nishonlar, yurishlar …) */
  total: number;
  /** 0..100 */
  score: number;
  /** Natija ekranidagi uchinchi plitka (bo‘lmasa — «To‘g‘ri: correct/total») */
  stat?: { label: string; value: string };
}

export interface GameProps {
  level: Level;
  /** Tasodifiy kontent uchun urug‘ (har bir o‘yinda yangi) */
  seed: number;
  /** O‘yin rangi (GAMES[].color) */
  color: string;
  /** Yuqori paneldagi progress: value / max, ixtiyoriy yozuv */
  onProgress: (value: number, max: number, label?: string) => void;
  /** O‘yin tugaganda bir marta chaqiriladi */
  onFinish: (result: GameResult) => void;
}

export interface GameDef {
  component: ComponentType<GameProps>;
  /** Boshlashdan oldingi qisqa ko‘rsatma */
  howTo: string;
  /** Darajaga xos qo‘shimcha eslatma */
  levelNote?: Partial<Record<Level, string>>;
  /** Ota-onaga maslahat (natija ekranida) */
  parentTip: string;
  /** Taxminiy davomiylik: "1–2 daqiqa" */
  duration: string;
}
