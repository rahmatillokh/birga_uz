// "Oyoq uchida ko‘tarilish" (yassi oyoqlik profilaktikasi):
// tovon (29/30) va to‘piq (27/28) oyoq uchiga (31/32) nisbatan qanchalik ko‘tarilgani —
// 3-2-1 vaqtida olingan boshlang‘ich holatga nisbatan, boldir uzunligiga bo‘lib o‘lchanadi.
import { clamp01, dist2, mean, median, P, v2, visible } from "../geometry";
import { Stable } from "../smoothing";
import type { FrameInput, Hint, Visibility } from "../types";
import { BaseAnalyzer, hint, type Step } from "./base";

export const E_RISE = "Tovonni balandroq ko‘taring";
export const E_BOTH = "Ikkala tovonni birga ko‘taring";

const UP = 0.1;
const DOWN = 0.04;
const PARTIAL = 0.055;
const ASYM = 0.09;
/** progress shkalasi: shu ko‘tarilish = 1 */
const FULL_SCALE = 0.22;

interface Foot {
  knee: number;
  ankle: number;
  heel: number;
  toe: number;
}
const FEET: Foot[] = [
  { knee: P.lKnee, ankle: P.lAnkle, heel: P.lHeel, toe: P.lFoot },
  { knee: P.rKnee, ankle: P.rAnkle, heel: P.rHeel, toe: P.rFoot },
];

interface FootM {
  a: number;
  h: number;
}

export class TiptoeAnalyzer extends BaseAnalyzer {
  readonly id = "tiptoe" as const;
  private phase: "down" | "up" = "down";
  private upS = new Stable(false, 100, 100);
  private downS = new Stable(true, 150, 80);
  private samples: FootM[][] = [[], []];
  private base: (FootM | null)[] = [null, null];
  private attempt = false;
  private peak = 0;
  private peakAsym = 0;
  private asymSince: number | null = null;

  constructor() {
    super("tiptoe");
  }

  visibility(f: FrameInput): Visibility {
    const lm = f.pose;
    if (!lm) return { ok: false, reason: "Kamera oldiga turing — boshdan oyoqqacha ko‘rinsin" };
    const feet = [P.lAnkle, P.rAnkle, P.lFoot, P.rFoot].every((i) => visible(lm, i, 0.45, 0.02));
    if (!feet) return { ok: false, reason: "Oyoqlaringiz ko‘rinmayapti — kamerani pastroq qo‘ying" };
    if (!visible(lm, P.lKnee, 0.4) || !visible(lm, P.rKnee, 0.4)) return { ok: false, reason: "Orqaroq turing — tizzalaringiz ham ko‘rinsin" };
    return { ok: true };
  }

  private measure(f: FrameInput): FootM[] {
    const lm = f.pose!;
    const a = f.aspect;
    return FEET.map((ft) => {
      const knee = v2(lm[ft.knee], a);
      const ankle = v2(lm[ft.ankle], a);
      const toe = v2(lm[ft.toe], a);
      const shin = Math.max(0.03, dist2(knee, ankle));
      const heelOk = visible(lm, ft.heel, 0.3, 0.02);
      return {
        a: (toe.y - ankle.y) / shin,
        h: heelOk ? (toe.y - v2(lm[ft.heel], a).y) / shin : NaN,
      };
    });
  }

  private pushSamples(m: FootM[]) {
    m.forEach((s, i) => {
      if (this.samples[i].length < 90) this.samples[i].push(s);
    });
  }

  private finalize(): boolean {
    for (const i of [0, 1]) {
      const list = this.samples[i];
      if (list.length < 8) return false;
      this.base[i] = { a: median(list.map((s) => s.a)), h: median(list.map((s) => s.h)) };
    }
    return true;
  }

  calibrate(f: FrameInput) {
    if (this.visibility(f).ok) this.pushSamples(this.measure(f));
  }

  start(t: number) {
    super.start(t);
    if (!this.finalize()) this.samples = [[], []];
  }

  private rise(m: FootM, b: FootM): number {
    return mean([m.a - b.a, Number.isFinite(b.h) ? m.h - b.h : NaN]);
  }

  protected step(f: FrameInput, t: number): Step {
    const m = this.measure(f);
    if (!this.base[0] || !this.base[1]) {
      // 3-2-1 vaqtida ko‘rinmagan bo‘lsa — hozir o‘rganamiz
      this.pushSamples(m);
      this.finalize();
      return { hint: hint("Tik turing, tovonlar yerda…", "info", "🧍"), progress: 0, progressGoal: UP / FULL_SCALE };
    }
    const rL = this.rise(m[0], this.base[0]);
    const rR = this.rise(m[1], this.base[1]);
    const rise = (rL + rR) / 2;
    const asym = Math.abs(rL - rR);
    const up = this.upS.update(rise > UP, t);
    const down = this.downS.update(rise < DOWN, t);
    const progress = clamp01(rise / FULL_SCALE);
    const bad: number[] = [];
    let fallback: Hint = hint("Oyoq uchida ko‘tariling", "info", "⬆️");

    if (this.phase === "down") {
      if (up) {
        this.phase = "up";
        this.peak = rise;
        this.peakAsym = 0;
        this.asymSince = null;
      } else if (!down) {
        // Tovonlar ko‘tarila boshladi
        this.attempt = true;
        this.peak = Math.max(this.peak, rise);
      } else if (this.attempt) {
        if (this.peak > PARTIAL) {
          this.reps.abort(E_RISE);
          this.hints.show(hint(E_RISE, "bad", "⬆️"), t, 1700);
        } else this.reps.discard();
        this.attempt = false;
        this.peak = 0;
      } else if (!this.attempt && down && (Math.abs(rise) < 0.03 || rise < -0.05)) {
        // Siljishni kompensatsiya qilish: bola biroz yurib ketsa (sekin) yoki boshlang‘ich holat
        // oyoq uchida olingan bo‘lsa (manfiy ko‘tarilish — tovondan past bo‘lib bo‘lmaydi, tez)
        const k = rise < -0.05 ? 0.15 : 0.01;
        for (const i of [0, 1]) {
          const b = this.base[i]!;
          b.a += k * (m[i].a - b.a);
          if (Number.isFinite(b.h) && Number.isFinite(m[i].h)) b.h += k * (m[i].h - b.h);
        }
      }
      fallback =
        this.attempt && this.peak > PARTIAL * 0.8 && !up
          ? hint("Yana balandroq!", "info", "⬆️")
          : hint("Oyoq uchida ko‘tariling", "info", "⬆️");
    }

    if (this.phase === "up") {
      this.peak = Math.max(this.peak, rise);
      if (rise > UP * 0.8) this.peakAsym = Math.max(this.peakAsym, asym);
      const asymNow = asym > ASYM && rise > UP * 0.8;
      if (asymNow) {
        this.asymSince ??= t;
        if (t - this.asymSince > 200) bad.push(rL < rR ? P.lHeel : P.rHeel, rL < rR ? P.lAnkle : P.rAnkle);
      } else this.asymSince = null;
      fallback = bad.length ? hint(E_BOTH, "warn", "🦶") : hint("Zo‘r! Endi sekin tushing", "good", "⬇️");
      if (down) {
        if (this.peakAsym > ASYM) this.reps.flag(E_BOTH);
        this.completeRep(t);
        this.phase = "down";
        this.attempt = false;
        this.peak = 0;
      }
    }

    return { hint: fallback, progress, progressGoal: UP / FULL_SCALE, bad };
  }
}
