// AI video nazorat — umumiy turlar (MediaPipe natijalari va mashq tahlili)
import type { AiCheckId } from "@/lib/types";

/** Kamera orqali tekshiriladigan mashqlar ("speech" — mikrofon, alohida bo‘lim) */
export type CameraCheckId = Exclude<AiCheckId, "speech">;

export type VisionKind = "pose" | "face";

/** MediaPipe NormalizedLandmark / Landmark bilan mos nuqta */
export interface Lm {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface FaceFrame {
  /** 478 ta normallashtirilgan nuqta */
  landmarks: Lm[];
  /** Blendshape nomi → 0..1 (mouthSmileLeft, mouthPucker, ...) */
  blend: Record<string, number>;
}

/** Tahlilchiga beriladigan bitta kadr (koordinatalar — ko‘zgusiz, kameraning o‘z tasviri) */
export interface FrameInput {
  /** ms (performance.now) */
  t: number;
  /** video eni / bo‘yi */
  aspect: number;
  /** 33 ta tana nuqtasi (0..1) */
  pose?: Lm[] | null;
  /** 33 ta tana nuqtasi, metrda (markaz — son suyaklari o‘rtasi) */
  world?: Lm[] | null;
  face?: FaceFrame | null;
}

export type Tone = "good" | "info" | "warn" | "bad";

export interface Hint {
  text: string;
  tone: Tone;
  emoji: string;
}

export interface Meter {
  key: string;
  label: string;
  emoji: string;
  /** 0..1 */
  value: number;
  /** hisoblash chegarasi (0..1) */
  threshold: number;
  color: string;
}

/** Jonli holat — HUD shu asosida chiziladi */
export interface LiveState {
  mode: "reps" | "hold";
  reps: number;
  target: number;
  /** joriy uzluksiz ushlab turish (soniya) */
  holdSec: number;
  bestHoldSec: number;
  holding: boolean;
  /** joriy harakat amplitudasi 0..1 (masalan, o‘tirish chuqurligi) */
  progress: number;
  /** takror hisoblanadigan chegara (0..1) */
  progressGoal: number;
  hint: Hint;
  /** asosiy nuqtalar kadrda ko‘rinadimi (barqarorlashtirilgan) */
  visible: boolean;
  /** ko‘rinmasa — nima qilish kerakligi */
  guide?: string;
  /** 0..100, birinchi takrorgacha null */
  accuracy: number | null;
  meters?: Meter[];
  /** 0..100 (muvozanat) */
  stability?: number;
  /** qizil bilan belgilanadigan nuqtalar */
  bad: number[];
  /** yuz mashqida lablarni qizil qilish */
  warn: boolean;
  /** har bir yakunlangan takrorda oshadi (animatsiya uchun) */
  repFlash: number;
  lastRepClean: boolean;
  elapsedSec: number;
  done: boolean;
}

export interface ErrorCount {
  text: string;
  count: number;
}

export interface Summary {
  id: CameraCheckId;
  mode: "reps" | "hold";
  reps: number;
  target: number;
  /** eng uzun uzluksiz ushlab turish (soniya) */
  holdSec: number;
  /** 0..100 — xatosiz takrorlar (yoki xatosiz soniyalar) ulushi */
  accuracy: number;
  cleanUnits: number;
  totalUnits: number;
  errors: ErrorCount[];
  stability?: number;
  durationSec: number;
  /** 0..1 — maqsadga qanchalik yetildi */
  completion: number;
}

export interface Visibility {
  ok: boolean;
  reason?: string;
}

export interface Analyzer {
  readonly id: CameraCheckId;
  readonly kind: VisionKind;
  readonly mode: "reps" | "hold";
  readonly target: number;
  /** kadrda kerakli nuqtalar bormi (debounce’siz) */
  visibility(f: FrameInput): Visibility;
  /** 3-2-1 vaqtida: boshlang‘ich holatni o‘lchash */
  calibrate(f: FrameInput): void;
  start(t: number): void;
  update(f: FrameInput): LiveState;
  summary(t: number): Summary;
}
