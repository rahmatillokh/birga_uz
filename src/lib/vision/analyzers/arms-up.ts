// "Qo‘llarni yuqoriga ko‘tarish": pastda → yuqorida → pastda = 1 takror
import { angle2, angle3, dist2, P, v2, v3, visible } from "../geometry";
import { Stable } from "../smoothing";
import type { FrameInput, Hint, Visibility } from "../types";
import { BaseAnalyzer, hint, type Step } from "./base";

export const E_FULL = "Qo‘llarni to‘liq ko‘taring";
export const E_SYNC = "Ikkala qo‘lni birga ko‘taring";
export const E_ELBOW = "Tirsaklarni to‘g‘rilang";

const ELBOW_MIN = 150;
/** "yuqorida" chegarasi progress shkalasida */
const UP_GOAL = 0.85;

export class ArmsUpAnalyzer extends BaseAnalyzer {
  readonly id = "arms-up" as const;
  private phase: "down" | "up" = "down";
  private bothUp = new Stable(false, 90, 90);
  private bothDown = new Stable(true, 120, 90);
  private attempt = false;
  private peak = 0;
  private asymSince: number | null = null;
  private partialSince: number | null = null;
  private elbowMax: [number, number] = [0, 0];

  constructor() {
    super("arms-up");
  }

  visibility(f: FrameInput): Visibility {
    const lm = f.pose;
    if (!lm) return { ok: false, reason: "Kamera oldiga turing" };
    if (!visible(lm, P.nose) || !visible(lm, P.lShoulder) || !visible(lm, P.rShoulder)) {
      return { ok: false, reason: "Yuzingiz va yelkalaringiz kadrda ko‘rinsin" };
    }
    if (!visible(lm, P.lElbow, 0.3, 0.3) || !visible(lm, P.rElbow, 0.3, 0.3)) {
      return { ok: false, reason: "Orqaroq turing — qo‘llaringiz ko‘rinsin" };
    }
    return { ok: true };
  }

  private elbowAngle(f: FrameInput, s: number, e: number, w: number): number {
    const lm = f.pose!;
    const a = angle2(v2(lm[s], f.aspect), v2(lm[e], f.aspect), v2(lm[w], f.aspect));
    const b = f.world ? angle3(v3(f.world[s]), v3(f.world[e]), v3(f.world[w])) : NaN;
    // Ikkala baholashdan kattarog‘i — bolalarga nisbatan yumshoqroq
    return Math.max(Number.isFinite(a) ? a : 0, Number.isFinite(b) ? b : 0);
  }

  protected step(f: FrameInput, t: number): Step {
    const lm = f.pose!;
    const a = f.aspect;
    const ls = v2(lm[P.lShoulder], a);
    const rs = v2(lm[P.rShoulder], a);
    const nose = v2(lm[P.nose], a);
    const lw = v2(lm[P.lWrist], a);
    const rw = v2(lm[P.rWrist], a);
    const le = v2(lm[P.lElbow], a);
    const re = v2(lm[P.rElbow], a);

    const scale = Math.max(0.06, dist2(ls, rs));
    const shoulderY = (ls.y + rs.y) / 2;
    // y pastga qarab o‘sadi: kichik y — balandroq
    const upLine = Math.min(nose.y, shoulderY - 0.4 * scale) - 0.05 * scale;
    const downLine = shoulderY + 0.3 * scale;

    // Qo‘l kadrdan yuqoriga chiqib ketsa ham (ko‘rinuvchanlik past), tirsak yelkadan baland bo‘lsa — yuqorida
    const armUp = (w: { y: number }, e: { y: number }, wi: number) =>
      w.y < upLine && ((lm[wi].visibility ?? 1) > 0.2 || e.y < shoulderY);
    const lUp = armUp(lw, le, P.lWrist);
    const rUp = armUp(rw, re, P.rWrist);
    const lDown = lw.y > downLine;
    const rDown = rw.y > downLine;
    const up = this.bothUp.update(lUp && rUp, t);
    const down = this.bothDown.update(lDown && rDown, t);

    // 0 — pastda, 1 — "yuqorida" chizig‘i
    const raw = (w: { y: number }) => (downLine - w.y) / Math.max(1e-6, downLine - upLine);
    const rawL = raw(lw);
    const rawR = raw(rw);
    const progress = Math.max(0, Math.min(1, ((rawL + rawR) / 2) * UP_GOAL));

    const bad: number[] = [];
    let fallback: Hint | null = null;

    if (this.phase === "down") {
      // Bir qo‘l yuqorida, ikkinchisi hali yelkadan past — nosimmetrik
      const asym = (lUp && rawR < 0.5) || (rUp && rawL < 0.5);
      if (asym) {
        this.asymSince ??= t;
        if (t - this.asymSince > 300) {
          if (!this.reps.has(E_SYNC)) {
            this.reps.flag(E_SYNC);
            this.hints.show(hint(E_SYNC, "warn", "🙌"), t, 1600);
          }
          bad.push(...(lUp ? [P.rWrist, P.rElbow] : [P.lWrist, P.lElbow]));
        }
      } else this.asymSince = null;

      const avg = (rawL + rawR) / 2;
      if (up) {
        this.phase = "up";
        this.elbowMax = [0, 0];
        this.attempt = false;
        this.peak = 0;
        this.partialSince = null;
      } else if (!down) {
        // Qo‘llar pastki holatdan chiqdi — urinish davom etmoqda
        this.attempt = true;
        this.peak = Math.max(this.peak, avg);
      } else if (this.attempt) {
        // Qo‘llar yuqoriga yetmay qaytib tushdi
        if (this.peak >= 0.5) {
          this.reps.abort(E_FULL);
          this.hints.show(hint(E_FULL, "bad", "⬆️"), t, 1800);
        } else this.reps.discard();
        this.attempt = false;
        this.peak = 0;
      }

      if (this.phase === "down") {
        if (this.attempt && !lUp && !rUp && avg > 0.5) {
          this.partialSince ??= t;
          if (t - this.partialSince > 700) fallback = hint("Yuqoriroq! Qo‘llarni to‘liq ko‘taring", "warn", "⬆️");
        } else this.partialSince = null;
        fallback ??= hint("Qo‘llarni yuqoriga ko‘taring", "info", "⬆️");
      }
    }

    if (this.phase === "up") {
      const eL = this.elbowAngle(f, P.lShoulder, P.lElbow, P.lWrist);
      const eR = this.elbowAngle(f, P.rShoulder, P.rElbow, P.rWrist);
      // Tirsaklar faqat qo‘llar haqiqatan tepada turganda baholanadi (tushayotganda emas)
      const top = lUp && rUp;
      if (top || this.elbowMax[0] === 0) this.elbowMax = [Math.max(this.elbowMax[0], eL), Math.max(this.elbowMax[1], eR)];
      const bent = top && Math.min(eL, eR) < ELBOW_MIN;
      if (bent) {
        if (eL < ELBOW_MIN) bad.push(P.lElbow);
        if (eR < ELBOW_MIN) bad.push(P.rElbow);
      }
      fallback = bent ? hint(E_ELBOW, "warn", "💪") : hint("Endi pastga tushiring", "good", "⬇️");
      if (down) {
        if (Math.min(this.elbowMax[0], this.elbowMax[1]) < ELBOW_MIN) this.reps.flag(E_ELBOW);
        this.completeRep(t);
        this.phase = "down";
        this.asymSince = null;
      }
    }

    return { hint: fallback ?? hint("Qo‘llarni yuqoriga ko‘taring", "info", "⬆️"), progress, progressGoal: UP_GOAL, bad };
  }
}
