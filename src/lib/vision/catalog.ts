// Kamera mashqlari katalogi: maqsad, rejim, to‘g‘ri holat bo‘yicha qo‘llanma
import type { AiCheckId } from "@/lib/types";
import type { CameraCheckId, VisionKind } from "./types";

export interface CheckMeta {
  kind: VisionKind;
  mode: "reps" | "hold";
  /** takrorlar soni yoki ushlab turish soniyasi */
  target: number;
  /** "10 marta" / "10 soniya" */
  targetLabel: string;
  /** kadrda nima ko‘rinishi kerak */
  view: { emoji: string; label: string };
  /** to‘g‘ri holat — katta emoji */
  poseEmoji: string;
  /** bajarish tartibi (qisqa, bolaga tushunarli) */
  steps: string[];
  /** kamerani qanday joylashtirish */
  camera: string;
  /** AI nimalarni tekshiradi */
  checks: string[];
}

export const CAMERA_CHECKS: CameraCheckId[] = ["arms-up", "squat", "balance", "tiptoe", "airplane", "smile-pucker"];

export function isCameraCheck(id: string | undefined | null): id is CameraCheckId {
  return !!id && (CAMERA_CHECKS as string[]).includes(id);
}

export function isAiCheckId(id: string | undefined | null): id is AiCheckId {
  return isCameraCheck(id) || id === "speech";
}

export const CHECK_META: Record<CameraCheckId, CheckMeta> = {
  "arms-up": {
    kind: "pose",
    mode: "reps",
    target: 10,
    targetLabel: "10 marta",
    view: { emoji: "🧍", label: "Boshdan belgacha" },
    poseEmoji: "🙌",
    steps: ["Kameraga yuzlanib, tik turing", "Ikkala qo‘lni birga boshdan baland ko‘taring", "Qo‘llarni pastga tushiring — bu 1 marta"],
    camera: "Kameradan 2 qadam uzoqda turing: qo‘llar yuqorida ham kadrga sig‘sin.",
    checks: ["Qo‘llar to‘liq ko‘tarildimi", "Ikkala qo‘l birga harakatlandimi", "Tirsaklar to‘g‘rimi"],
  },
  squat: {
    kind: "pose",
    mode: "reps",
    target: 8,
    targetLabel: "8 marta",
    view: { emoji: "🧍", label: "Boshdan oyoqqacha" },
    poseEmoji: "🏋️",
    steps: ["Oyoqlarni yelka kengligida qo‘ying", "Stulga o‘tirgandek, tizzalarni bukib o‘tiring", "Qaddingizni tik tutib, qayta turing"],
    camera: "Kamerani bel balandligiga qo‘ying va 2–3 qadam orqaga turing — butun gavdangiz ko‘rinsin.",
    checks: ["O‘tirish chuqurligi", "Qomat (oldinga egilmaslik)", "Tizzalar oldinga ketmasligi"],
  },
  balance: {
    kind: "pose",
    mode: "hold",
    target: 10,
    targetLabel: "10 soniya",
    view: { emoji: "🧍", label: "Boshdan oyoqqacha" },
    poseEmoji: "🦩",
    steps: ["Tik turing, qo‘llarni yon tomonga yozing", "Bir oyoqni tizzadan bukib ko‘taring — laylak kabi", "10 soniya qimirlamay turing"],
    camera: "Butun gavdangiz, ayniqsa oyoqlaringiz kadrga to‘liq sig‘sin.",
    checks: ["Oyoq yetarli ko‘tarildimi", "Tana chayqalmayaptimi (barqarorlik)", "Qancha vaqt ushlab turildi"],
  },
  tiptoe: {
    kind: "pose",
    mode: "reps",
    target: 10,
    targetLabel: "10 marta",
    view: { emoji: "🦶", label: "Boshdan oyoq uchigacha" },
    poseEmoji: "🩰",
    steps: ["Tik turing, oyoqlar birga", "Tovonlarni ko‘tarib, oyoq uchida turing", "Sekin tushing — bu 1 marta"],
    camera: "Kamerani pastroq (tizza balandligida) qo‘ying va 2–3 qadam orqaga turing — boshdan oyoq uchigacha ko‘rinsin.",
    checks: ["Tovonlar yetarli ko‘tarildimi", "Ikkala tovon birga ko‘tarildimi"],
  },
  airplane: {
    kind: "pose",
    mode: "hold",
    target: 10,
    targetLabel: "10 soniya",
    view: { emoji: "🧍", label: "Boshdan belgacha" },
    poseEmoji: "✈️",
    steps: ["Tik turing", "Qo‘llarni yon tomonga, yelka balandligida yozing", "Samolyot qanotidek 10 soniya ushlab turing"],
    camera: "Kameradan 2 qadam uzoqda turing: yozilgan qo‘llaringiz kadrga to‘liq sig‘sin.",
    checks: ["Qo‘llar yelka balandligidami", "Tirsaklar to‘g‘rimi", "Qanotlar bir tekismi"],
  },
  "smile-pucker": {
    kind: "face",
    mode: "reps",
    target: 8,
    targetLabel: "8 marta",
    view: { emoji: "🙂", label: "Yuz" },
    poseEmoji: "😁",
    steps: ["Yuzingizni ko‘zgu ramkasiga joylang", "Keng tabassum qiling — lablar cho‘zilsin", "Lablarni naycha qilib oldinga cho‘zing — bu 1 marta"],
    camera: "Kameraga yaqin o‘tiring, yuzingiz yorug‘ va to‘liq ko‘rinsin.",
    checks: ["Tabassum kengligi", "Naycha — lablar oldinga cho‘zilganmi", "Tabassum ikki tomonga tengmi"],
  },
};

/** Takrorlar/soniyalar birligi */
export function unitOf(id: CameraCheckId): string {
  return CHECK_META[id].mode === "hold" ? "soniya" : "marta";
}
