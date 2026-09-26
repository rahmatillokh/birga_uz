// "Bir oyoqda turish": bir to‘piq ikkinchisidan aniq baland — ushlab turish vaqti hisoblanadi.
// Barqarorlik — son suyaklari markazining chayqalishi (o‘rtacha kvadratik og‘ish) bo‘yicha.
import { clamp01, dist2, mid2, P, v2, visible } from "../geometry";
import { Ema, RunningStats, Stable } from "../smoothing";
import type { FrameInput, Hint, Visibility } from "../types";
import { BaseAnalyzer, Episode, hint, type Step } from "./base";

export const E_BAL = "Muvozanatni saqlang";
export const E_HIGH = "Oyoqni balandroq ko‘taring";

/** oyoq uzunligiga nisbatan ko‘tarilish */
const LIFT_ON = 0.15;
const LIFT_PARTIAL = 0.06;
/** chayqalish tezligi (oyoq uzunligi / soniya): tinch turish ≈ 0.05–0.1, chayqalish ≈ 0.4+ */
const WOBBLE_SPEED = 0.25;
/** ushlab turish boshidagi o‘tish qismi barqarorlikka kiritilmaydi */
const SETTLE_MS = 400;

export class BalanceAnalyzer extends BaseAnalyzer {
  readonly id = "balance" as const;
  private lifted = new Stable(false, 200, 350);
  private wobble = new Episode(250, 450);
  private partial = new Episode(700, 300);
  private partialHint = new Stable(false, 350, 120);
  private speed = new Ema(150);
  private prev: { x: number; y: number; t: number } | null = null;
  private sx = new RunningStats();
  private sy = new RunningStats();
  private swaySum = 0;
  private swayN = 0;

  constructor() {
    super("balance");
  }

  visibility(f: FrameInput): Visibility {
    const lm = f.pose;
    if (!lm) return { ok: false, reason: "Kamera oldiga turing" };
    if (!visible(lm, P.lHip) || !visible(lm, P.rHip)) return { ok: false, reason: "Orqaroq turing — butun gavdangiz ko‘rinsin" };
    if (!visible(lm, P.lKnee, 0.4) || !visible(lm, P.rKnee, 0.4) || !visible(lm, P.lAnkle, 0.4) || !visible(lm, P.rAnkle, 0.4)) {
      return { ok: false, reason: "Oyoqlaringiz ko‘rinmayapti — orqaroq turing" };
    }
    return { ok: true };
  }

  protected stabilityNow(): number | undefined {
    const n = this.swayN + this.sx.n;
    if (n < 15) return undefined;
    const cur = (this.sx.variance + this.sy.variance) * this.sx.n;
    const rms = Math.sqrt((this.swaySum + cur) / n);
    return Math.round(100 * (1 - clamp01((rms - 0.006) / 0.09)));
  }

  private closeSway() {
    if (this.sx.n > 0) {
      this.swaySum += (this.sx.variance + this.sy.variance) * this.sx.n;
      this.swayN += this.sx.n;
    }
    this.sx.reset();
    this.sy.reset();
  }

  protected step(f: FrameInput, t: number): Step {
    const lm = f.pose!;
    const a = f.aspect;
    const lh = v2(lm[P.lHip], a);
    const rh = v2(lm[P.rHip], a);
    const la = v2(lm[P.lAnkle], a);
    const ra = v2(lm[P.rAnkle], a);
    const legLen = Math.max(0.05, dist2(lh, la), dist2(rh, ra));
    const lift = Math.abs(la.y - ra.y) / legLen;
    const raised = la.y < ra.y ? P.lAnkle : P.rAnkle;
    const isLifted = this.lifted.update(lift > LIFT_ON, t);

    // Son markazining tezligi (chayqalish)
    const hip = mid2(lh, rh);
    let v = 0;
    if (this.prev && t > this.prev.t) v = dist2(hip, this.prev) / legLen / ((t - this.prev.t) / 1000);
    this.prev = { x: hip.x, y: hip.y, t };
    const speed = this.speed.update(v, t);

    const wobbleStart = this.wobble.update(isLifted && speed > WOBBLE_SPEED, t);
    if (wobbleStart) {
      this.tally.add(E_BAL);
      this.hints.show(hint(E_BAL, "warn", "⚖️"), t, 1400);
    }

    const ev = this.hold.update(isLifted, t, this.wobble.active);
    if (ev === "start") this.closeSway();
    if (ev === "stop") {
      this.closeSway();
      this.wobble.reset();
      if (this.hold.lastDuration >= 1 && this.hold.best < this.target) {
        this.tally.add(E_BAL);
        this.hints.show(hint("Muvozanatni saqlang — yana urinib ko‘ring", "bad", "⚖️"), t, 1800);
      }
    }
    if (this.hold.holding && t - this.hold.start > SETTLE_MS) {
      this.sx.push(hip.x / legLen);
      this.sy.push(hip.y / legLen);
    }

    // Oyoq biroz ko‘tarilgan, lekin yetarli emas
    const partialNow = !isLifted && lift > LIFT_PARTIAL && lift <= LIFT_ON;
    if (this.partial.update(partialNow, t)) this.tally.add(E_HIGH);
    const showPartial = this.partialHint.update(partialNow, t);

    const bad: number[] = [];
    let fallback: Hint;
    if (!isLifted) {
      if (partialNow && showPartial) {
        fallback = hint(E_HIGH, "warn", "⬆️");
        bad.push(raised);
      } else fallback = hint("Bir oyoqni ko‘taring — laylak kabi", "info", "🦩");
    } else if (this.wobble.active) {
      fallback = hint(E_BAL, "warn", "⚖️");
      bad.push(P.lHip, P.rHip);
    } else if (lift < 0.2) {
      fallback = hint(E_HIGH, "info", "⬆️");
    } else {
      const left = Math.max(0, Math.ceil(this.target - this.hold.current));
      fallback = hint(left > 0 ? `Zo‘r! Ushlab turing… ${left}` : "Barakalla!", "good", "🦩");
    }

    return {
      hint: fallback,
      progress: clamp01(this.hold.current / this.target),
      progressGoal: 1,
      bad,
    };
  }
}
