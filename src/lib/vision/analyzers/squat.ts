// "O‘tirib-turish": tizza burchagi (son-tizza-to‘piq) < ~115° — pastda, > ~155° — turgan holat.
//
// Kameraga yuzma-yuz turilganda 2D burchak deyarli o‘zgarmaydi (son kameraga qarab qisqaradi),
// shuning uchun uchta baholashning medianasi olinadi:
//   1) 2D tasvirdagi burchak (yon tomondan to‘g‘ri),
//   2) 3D "world" nuqtalardagi burchak,
//   3) son va boldirning tik proyeksiyasi qisqarishi (tik turgan holatga nisbatan).
import { acosDeg, angle2, angle3, dist2, median, mid2, mid3, norm, P, tiltUp2, tiltUp3, v2, v3, visible } from "../geometry";
import { Ema, Stable } from "../smoothing";
import type { FrameInput, Hint, Visibility } from "../types";
import { BaseAnalyzer, hint, type Step } from "./base";

export const E_DEPTH = "Chuqurroq o‘tiring";
export const E_BACK = "Qaddingizni tik tuting";
export const E_KNEE = "Tizzalar oldinga ketmasin";

const START_DOWN = 145;
const FULL = 115;
const SHALLOW = 138;
const STAND = 155;
const LEAN_MAX = 50;
const SHIN_MAX = 42;

interface Side {
  hip: number;
  knee: number;
  ankle: number;
}
const LEFT: Side = { hip: P.lHip, knee: P.lKnee, ankle: P.lAnkle };
const RIGHT: Side = { hip: P.rHip, knee: P.rKnee, ankle: P.rAnkle };

interface Measure {
  knee: number;
  lean: number;
  shin: number;
  /** tik turgandagi kalibrovka uchun */
  thighN: [number, number];
  shinN: [number, number];
  torsoN: number;
  a2: number;
  a3: number;
}

export class SquatAnalyzer extends BaseAnalyzer {
  readonly id = "squat" as const;
  private phase: "up" | "down" = "up";
  private goingDown = new Stable(false, 80, 150);
  private standing = new Stable(true, 150, 80);
  private kneeEma = new Ema(60);
  private minKnee = 180;
  private maxLean = 0;
  private maxShin = 0;
  private cal = { thigh: [[], []] as number[][], shin: [[], []] as number[][], torso: [] as number[] };
  private thigh0: [number, number] = [NaN, NaN];
  private shin0: [number, number] = [NaN, NaN];
  private torso0 = NaN;
  private calibrated = false;

  constructor() {
    super("squat");
  }

  visibility(f: FrameInput): Visibility {
    const lm = f.pose;
    if (!lm) return { ok: false, reason: "Kamera oldiga turing" };
    if (!visible(lm, P.lShoulder) && !visible(lm, P.rShoulder)) return { ok: false, reason: "Orqaroq turing — butun gavdangiz ko‘rinsin" };
    if (!visible(lm, P.lHip) || !visible(lm, P.rHip)) return { ok: false, reason: "Orqaroq turing — butun gavdangiz ko‘rinsin" };
    const leg = (s: Side) => visible(lm, s.hip) && visible(lm, s.knee) && visible(lm, s.ankle);
    if (!leg(LEFT) && !leg(RIGHT)) return { ok: false, reason: "Oyoqlaringiz ko‘rinmayapti — orqaroq turing" };
    return { ok: true };
  }

  private measure(f: FrameInput): Measure {
    const lm = f.pose!;
    const w = f.world;
    const a = f.aspect;
    const ls = v2(lm[P.lShoulder], a);
    const rs = v2(lm[P.rShoulder], a);
    const shoulderW = Math.max(0.04, dist2(ls, rs));
    const shMid = mid2(ls, rs);
    const hipMid = mid2(v2(lm[P.lHip], a), v2(lm[P.rHip], a));

    const knees: number[] = [];
    const shins: number[] = [];
    const thighN: [number, number] = [NaN, NaN];
    const shinN: [number, number] = [NaN, NaN];
    let a2s = NaN;
    let a3s = NaN;
    [LEFT, RIGHT].forEach((s, i) => {
      if (!(visible(lm, s.hip) && visible(lm, s.knee) && visible(lm, s.ankle))) return;
      const h = v2(lm[s.hip], a);
      const k = v2(lm[s.knee], a);
      const an = v2(lm[s.ankle], a);
      const a2 = angle2(h, k, an);
      const a3 = w ? angle3(v3(w[s.hip]), v3(w[s.knee]), v3(w[s.ankle])) : NaN;
      const tv = (k.y - h.y) / shoulderW;
      const sv = (an.y - k.y) / shoulderW;
      thighN[i] = tv;
      shinN[i] = sv;
      // Qisqarish orqali: cos(og‘ish) = joriy proyeksiya / tik turgandagi proyeksiya
      let aR = NaN;
      let sR = NaN;
      if (Number.isFinite(this.thigh0[i]) && Number.isFinite(this.shin0[i])) {
        const tt = acosDeg(tv / this.thigh0[i]);
        sR = acosDeg(Math.max(0, sv / this.shin0[i]));
        aR = 180 - tt - sR;
      } else {
        const r = tv / Math.max(1e-3, sv);
        aR = 180 - acosDeg(r);
      }
      knees.push(median([a2, a3, aR]));
      // Boldirning oldinga og‘ishi (tizza oldinga ketishi)
      const s2 = tiltUp2(an, k);
      const s3 = w ? tiltUp3(v3(w[s.ankle]), v3(w[s.knee])) : NaN;
      shins.push(median([s2, s3, sR]));
      a2s = Number.isFinite(a2s) ? Math.max(a2s, a2) : a2;
      a3s = Number.isFinite(a3s) ? Math.max(a3s, a3) : a3;
    });

    // Tananing oldinga egilishi
    const l2 = tiltUp2(hipMid, shMid);
    const l3 = w ? tiltUp3(mid3(v3(w[P.lHip]), v3(w[P.rHip])), mid3(v3(w[P.lShoulder]), v3(w[P.rShoulder]))) : NaN;
    const torsoN = (hipMid.y - shMid.y) / shoulderW;
    const lR = Number.isFinite(this.torso0) ? acosDeg(torsoN / this.torso0) : NaN;

    return {
      knee: knees.length ? knees.reduce((s, v) => s + v, 0) / knees.length : NaN,
      lean: median([l2, l3, lR]),
      shin: shins.length ? Math.max(...shins.filter(Number.isFinite), 0) : 0,
      thighN,
      shinN,
      torsoN,
      a2: a2s,
      a3: a3s,
    };
  }

  /** Tik turgan holat namunasini yig‘ish */
  private collect(m: Measure) {
    if (this.cal.torso.length >= 60) return;
    const straight = (m.a2 > 160 || !Number.isFinite(m.a2)) && (m.a3 > 155 || !Number.isFinite(m.a3));
    if (!straight) return;
    for (const i of [0, 1]) {
      if (Number.isFinite(m.thighN[i]) && m.thighN[i] > 0) this.cal.thigh[i].push(m.thighN[i]);
      if (Number.isFinite(m.shinN[i]) && m.shinN[i] > 0) this.cal.shin[i].push(m.shinN[i]);
    }
    if (Number.isFinite(m.torsoN) && m.torsoN > 0) this.cal.torso.push(m.torsoN);
  }

  private finalizeCalibration() {
    for (const i of [0, 1]) {
      if (this.cal.thigh[i].length >= 6) this.thigh0[i] = median(this.cal.thigh[i]);
      if (this.cal.shin[i].length >= 6) this.shin0[i] = median(this.cal.shin[i]);
    }
    if (this.cal.torso.length >= 6) this.torso0 = median(this.cal.torso);
    const leg = [0, 1].some((i) => Number.isFinite(this.thigh0[i]) && Number.isFinite(this.shin0[i]));
    this.calibrated = leg && Number.isFinite(this.torso0);
  }

  calibrate(f: FrameInput) {
    if (!this.visibility(f).ok) return;
    this.collect(this.measure(f));
  }

  start(t: number) {
    super.start(t);
    this.finalizeCalibration();
  }

  protected step(f: FrameInput, t: number): Step {
    const m = this.measure(f);
    // Kalibrovka bo‘lmagan bo‘lsa — tik turgan kadrlardan o‘rganib olamiz
    if (this.phase === "up" && !this.calibrated && this.cal.torso.length < 60) {
      this.collect(m);
      if (this.cal.torso.length >= 8) this.finalizeCalibration();
    }
    const knee = this.kneeEma.update(m.knee, t);
    const down = this.goingDown.update(knee < START_DOWN, t);
    const up = this.standing.update(knee > STAND, t);
    const progress = norm(knee, 170, 95);
    const goal = norm(FULL, 170, 95);
    const bad: number[] = [];
    let fallback: Hint = hint("Stulga o‘tirgandek o‘tiring", "info", "⬇️");

    if (this.phase === "up" && down) {
      this.phase = "down";
      this.minKnee = knee;
      this.maxLean = 0;
      this.maxShin = 0;
    }

    if (this.phase === "down") {
      this.minKnee = Math.min(this.minKnee, knee);
      const deep = knee < 130;
      if (deep) {
        if (Number.isFinite(m.lean)) this.maxLean = Math.max(this.maxLean, m.lean);
        if (Number.isFinite(m.shin)) this.maxShin = Math.max(this.maxShin, m.shin);
      }
      const leaning = deep && m.lean > LEAN_MAX;
      const kneesFwd = deep && m.shin > SHIN_MAX;
      if (leaning) bad.push(P.lShoulder, P.rShoulder, P.lHip, P.rHip);
      if (kneesFwd) bad.push(P.lKnee, P.rKnee);
      fallback = leaning
        ? hint(E_BACK, "warn", "🧍")
        : kneesFwd
          ? hint(E_KNEE, "warn", "🦵")
          : this.minKnee < FULL
            ? hint("Zo‘r! Endi turing", "good", "⬆️")
            : hint("Yana biroz pastroq", "info", "⬇️");

      if (up) {
        if (this.minKnee < SHALLOW) {
          if (this.minKnee >= FULL) this.reps.flag(E_DEPTH);
          if (this.maxLean > LEAN_MAX) this.reps.flag(E_BACK);
          if (this.maxShin > SHIN_MAX) this.reps.flag(E_KNEE);
          this.completeRep(t);
        } else {
          // Juda sayoz — takror hisoblanmaydi
          this.reps.abort(E_DEPTH);
          this.hints.show(hint(E_DEPTH, "bad", "⬇️"), t, 1600);
        }
        this.phase = "up";
        fallback = hint("Stulga o‘tirgandek o‘tiring", "info", "⬇️");
      }
    }

    return { hint: fallback, progress, progressGoal: goal, bad };
  }
}

