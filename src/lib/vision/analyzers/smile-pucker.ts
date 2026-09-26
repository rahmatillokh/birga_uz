// "Tabassum — Naycha" (artikulyatsion gimnastika): FaceLandmarker blendshape’lari asosida.
// 1 takror = tabassum → naycha. Neytral yuz 3-2-1 vaqtida o‘lchanadi.
import { median } from "../geometry";
import { Ema, Stable } from "../smoothing";
import type { FrameInput, Hint, Visibility } from "../types";
import { BaseAnalyzer, hint, type Step } from "./base";

export const E_SMILE = "Lablarni kengroq cho‘zing";
export const E_PUCKER = "Lablarni oldinga cho‘zing";
export const E_SYM = "Ikki tomonga teng tabassum qiling";

/** "sifatli" bajarish chegaralari */
const GOOD_SMILE = 0.65;
const GOOD_PUCKER = 0.6;
const ASYM = 0.3;

export const SMILE_COLOR = "#eda100";
export const PUCKER_COLOR = "#e87ba4";

export class SmilePuckerAnalyzer extends BaseAnalyzer {
  readonly id = "smile-pucker" as const;
  private phase: "wait" | "smile" | "pucker" = "wait";
  private smileE = new Ema(60);
  private puckerE = new Ema(60);
  private smileOn = new Stable(false, 120, 150);
  private puckerOn = new Stable(false, 120, 150);
  private cal: { s: number[]; p: number[] } = { s: [], p: [] };
  private s0 = 0;
  private p0 = 0;
  private peakSmile = 0;
  private peakPucker = 0;
  private asymMax = 0;
  private puckerSince = 0;
  private weakSince: number | null = null;

  constructor() {
    super("smile-pucker");
  }

  visibility(f: FrameInput): Visibility {
    const face = f.face;
    if (!face || face.landmarks.length < 10) return { ok: false, reason: "Yuzingizni kameraga qarating" };
    let minX = 1;
    let maxX = 0;
    let minY = 1;
    let maxY = 0;
    for (const p of face.landmarks) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const w = (maxX - minX) * f.aspect;
    if (w < 0.13) return { ok: false, reason: "Kameraga yaqinroq keling" };
    if (minX < -0.02 || maxX > 1.02 || minY < -0.03 || maxY > 1.03) return { ok: false, reason: "Yuzingiz ramka o‘rtasida bo‘lsin" };
    return { ok: true };
  }

  private read(f: FrameInput) {
    const b = f.face!.blend;
    const sL = b.mouthSmileLeft ?? 0;
    const sR = b.mouthSmileRight ?? 0;
    return {
      sL,
      sR,
      smile: (sL + sR) / 2,
      pucker: Math.max(b.mouthPucker ?? 0, (b.mouthFunnel ?? 0) * 0.9),
    };
  }

  calibrate(f: FrameInput) {
    if (!this.visibility(f).ok || this.cal.s.length >= 90) return;
    const r = this.read(f);
    this.cal.s.push(r.smile);
    this.cal.p.push(r.pucker);
  }

  start(t: number) {
    super.start(t);
    if (this.cal.s.length >= 6) {
      // Neytral yuz biroz "jilmaygan" bo‘lishi mumkin — chegaralarni moslashtiramiz (yuqori chegara bilan)
      this.s0 = Math.min(0.3, median(this.cal.s));
      this.p0 = Math.min(0.3, median(this.cal.p));
    }
  }

  protected step(f: FrameInput, t: number): Step {
    const r = this.read(f);
    const smile = this.smileE.update(r.smile, t);
    const pucker = this.puckerE.update(r.pucker, t);
    const sOn = Math.max(0.45, this.s0 + 0.28);
    const sOff = Math.max(0.25, this.s0 + 0.12);
    const pOn = Math.max(0.4, this.p0 + 0.28);
    const pOff = Math.max(0.2, this.p0 + 0.12);
    const isSmile = this.smileOn.update(smile > (this.smileOn.value ? sOff : sOn), t);
    const isPucker = this.puckerOn.update(pucker > (this.puckerOn.value ? pOff : pOn), t);

    let fallback: Hint = hint("Keng tabassum qiling", "info", "😁");
    let warn = false;

    const startSmile = () => {
      this.phase = "smile";
      this.peakSmile = smile;
      this.asymMax = 0;
      this.weakSince = null;
    };

    if (this.phase === "wait") {
      if (isSmile) startSmile();
      else if (smile > 0.22 && smile < sOn) {
        this.weakSince ??= t;
        if (t - this.weakSince > 900) {
          fallback = hint(E_SMILE, "warn", "😁");
          warn = true;
        }
      } else this.weakSince = null;
    }

    if (this.phase === "smile") {
      this.peakSmile = Math.max(this.peakSmile, smile);
      if (smile > sOn) this.asymMax = Math.max(this.asymMax, Math.abs(r.sL - r.sR));
      if (isPucker) {
        if (this.peakSmile < GOOD_SMILE) this.reps.flag(E_SMILE);
        if (this.asymMax > ASYM) this.reps.flag(E_SYM);
        this.phase = "pucker";
        this.puckerSince = t;
        this.peakPucker = pucker;
        this.weakSince = null;
      } else if (this.peakSmile < GOOD_SMILE && t - (this.weakSince ??= t) > 700) {
        fallback = hint("Kengroq! Lablarni cho‘zing", "warn", "😁");
        warn = true;
      } else {
        fallback = hint("Endi lablarni naycha qiling", "good", "😗");
      }
    }

    if (this.phase === "pucker") {
      this.peakPucker = Math.max(this.peakPucker, pucker);
      const released = !isPucker && t - this.puckerSince > 250;
      if (released || (isSmile && t - this.puckerSince > 250)) {
        if (this.peakPucker < GOOD_PUCKER) this.reps.flag(E_PUCKER);
        this.completeRep(t);
        if (isSmile) startSmile();
        else this.phase = "wait";
      } else if (this.peakPucker < GOOD_PUCKER && t - this.puckerSince > 700) {
        fallback = hint("Lablarni oldinga cho‘zing", "warn", "😗");
        warn = true;
      } else {
        fallback = hint("Zo‘r! Endi yana tabassum", "good", "😁");
      }
    }

    return {
      hint: fallback,
      progress: Math.max(smile, pucker),
      progressGoal: 0.5,
      warn,
      meters: [
        { key: "smile", label: "Tabassum", emoji: "😁", value: Math.min(1, smile), threshold: sOn, color: SMILE_COLOR },
        { key: "pucker", label: "Naycha", emoji: "😗", value: Math.min(1, pucker), threshold: pOn, color: PUCKER_COLOR },
      ],
    };
  }
}
