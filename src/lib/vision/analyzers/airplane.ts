// "Samolyotcha": qo‘llar yon tomonga, yelka balandligida, tirsaklar to‘g‘ri — ushlab turish vaqti.
import { angle2, angle3, clamp01, DEG, dist2, P, v2, v3, visible } from "../geometry";
import { Stable } from "../smoothing";
import type { FrameInput, Hint, Visibility } from "../types";
import { BaseAnalyzer, Episode, hint, type Step } from "./base";

export const E_DROP = "Qo‘llarni tushirmang";
export const E_ELBOW = "Tirsaklarni to‘g‘rilang";
export const E_LEVEL = "Qo‘llarni bir tekis tuting";
export const E_HIGH = "Qo‘llarni yelka balandligida tuting";

interface Arm {
  /** yelka→bilak chizig‘ining gorizontga nisbatan balandligi (gradus, + yuqori) */
  elev: number;
  /** yon tomonga yozilganlik (0..1) */
  spread: number;
  elbow: number;
  outward: boolean;
}

export class AirplaneAnalyzer extends BaseAnalyzer {
  readonly id = "airplane" as const;
  private ok = new Stable(false, 250, 400);
  private drop = new Episode(300, 400);
  private elbow = new Episode(400, 400);
  private level = new Episode(400, 400);
  private high = new Episode(400, 400);

  constructor() {
    super("airplane");
  }

  visibility(f: FrameInput): Visibility {
    const lm = f.pose;
    if (!lm) return { ok: false, reason: "Kamera oldiga turing" };
    if (!visible(lm, P.lShoulder) || !visible(lm, P.rShoulder)) return { ok: false, reason: "Yelkalaringiz kadrda ko‘rinsin" };
    const arms = [P.lElbow, P.rElbow, P.lWrist, P.rWrist].every((i) => visible(lm, i, 0.4, 0.03));
    if (!arms) return { ok: false, reason: "Orqaroq turing — yozilgan qo‘llaringiz to‘liq ko‘rinsin" };
    return { ok: true };
  }

  private arm(f: FrameInput, s: number, e: number, w: number, other: number): Arm {
    const lm = f.pose!;
    const a = f.aspect;
    const S = v2(lm[s], a);
    const E = v2(lm[e], a);
    const W = v2(lm[w], a);
    const O = v2(lm[other], a);
    const dx = W.x - S.x;
    const len = Math.max(1e-4, dist2(S, E) + dist2(E, W));
    const e2 = angle2(S, E, W);
    const e3 = f.world ? angle3(v3(f.world[s]), v3(f.world[e]), v3(f.world[w])) : NaN;
    return {
      elev: Math.atan2(S.y - W.y, Math.abs(dx)) * DEG,
      spread: Math.abs(dx) / len,
      elbow: Math.max(Number.isFinite(e2) ? e2 : 0, Number.isFinite(e3) ? e3 : 0),
      outward: Math.sign(dx) === Math.sign(S.x - O.x),
    };
  }

  protected step(f: FrameInput, t: number): Step {
    const L = this.arm(f, P.lShoulder, P.lElbow, P.lWrist, P.rShoulder);
    const R = this.arm(f, P.rShoulder, P.rElbow, P.rWrist, P.lShoulder);
    const armOk = (x: Arm) => x.outward && x.spread > 0.55 && Math.abs(x.elev) < 30 && x.elbow > 125;
    const holdingNow = this.ok.update(armOk(L) && armOk(R), t);
    const attempt = holdingNow || this.hold.holding;

    const dropping = attempt && Math.min(L.elev, R.elev) < -18;
    const bentNow = attempt && Math.min(L.elbow, R.elbow) < 155;
    const uneven = attempt && Math.abs(L.elev - R.elev) > 22;
    const tooHigh = attempt && Math.max(L.elev, R.elev) > 25;

    const flag = (ep: Episode, cond: boolean, text: string, emoji: string) => {
      if (ep.update(cond, t)) {
        this.tally.add(text);
        this.hints.show(hint(text, "warn", emoji), t, 1400);
      }
    };
    flag(this.drop, dropping, E_DROP, "✈️");
    flag(this.elbow, bentNow, E_ELBOW, "💪");
    flag(this.level, uneven && !dropping, E_LEVEL, "⚖️");
    flag(this.high, tooHigh && !uneven, E_HIGH, "↔️");
    const dirty = this.drop.active || this.elbow.active || this.level.active || this.high.active;

    const ev = this.hold.update(holdingNow, t, dirty);
    if (ev === "stop" && this.hold.lastDuration >= 1 && this.hold.best < this.target) {
      // Ushlab turish uzildi — ko‘pincha qo‘llar tushib ketgani uchun
      if (!this.drop.active) this.tally.add(E_DROP);
      this.hints.show(hint(`${E_DROP} — yana urinib ko‘ring`, "bad", "✈️"), t, 1800);
    }

    const bad: number[] = [];
    if (dropping) bad.push(...(L.elev < R.elev ? [P.lWrist, P.lElbow] : [P.rWrist, P.rElbow]));
    if (bentNow) bad.push(...(L.elbow < R.elbow ? [P.lElbow] : [P.rElbow]));
    if (uneven && !dropping) bad.push(P.lWrist, P.rWrist);

    let fallback: Hint;
    if (!this.hold.holding) fallback = hint("Qo‘llarni yon tomonga yozing", "info", "✈️");
    else if (dropping) fallback = hint(E_DROP, "warn", "✈️");
    else if (bentNow) fallback = hint(E_ELBOW, "warn", "💪");
    else if (uneven) fallback = hint(E_LEVEL, "warn", "⚖️");
    else if (tooHigh) fallback = hint(E_HIGH, "warn", "↔️");
    else {
      const left = Math.max(0, Math.ceil(this.target - this.hold.current));
      fallback = hint(left > 0 ? `Uchyapmiz! Ushlab turing… ${left}` : "Barakalla!", "good", "✈️");
    }

    return { hint: fallback, progress: clamp01(this.hold.current / this.target), progressGoal: 1, bad };
  }
}
