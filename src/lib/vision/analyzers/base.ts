// Barcha mashq tahlilchilari uchun umumiy hisob-kitob (takrorlar, ushlab turish, xatolar, maslahatlar)
import { CHECK_META } from "../catalog";
import { Stable } from "../smoothing";
import type { Analyzer, CameraCheckId, ErrorCount, FrameInput, Hint, LiveState, Meter, Summary, Tone, Visibility, VisionKind } from "../types";

export function hint(text: string, tone: Tone = "info", emoji = "💡"): Hint {
  return { text, tone, emoji };
}

const PRAISE: [string, string][] = [
  ["Zo‘r!", "👍"],
  ["Barakalla!", "🌟"],
  ["Ajoyib!", "🎉"],
  ["Juda yaxshi!", "💪"],
  ["Qoyil!", "⭐"],
  ["Super!", "🔥"],
];

export const NOT_VISIBLE = "Kameraga to‘liq ko‘rinishingiz kerak";

/** Qisqa muddatli ("yopishqoq") maslahat: xato yoki maqtov bir necha soniya ko‘rinib turadi */
export class HintBox {
  private h: Hint | null = null;
  private until = 0;

  show(h: Hint, t: number, ms = 1400) {
    this.h = h;
    this.until = t + ms;
  }

  get(t: number, fallback: Hint): Hint {
    return this.h && t < this.until ? this.h : fallback;
  }

  /** Joriy yopishqoq maslahat xato/ogohlantirishmi */
  alarming(t: number): boolean {
    return !!this.h && t < this.until && (this.h.tone === "bad" || this.h.tone === "warn");
  }
}

/** Xatolar hisobi */
export class Tally {
  private m = new Map<string, number>();

  add(text: string, n = 1) {
    this.m.set(text, (this.m.get(text) ?? 0) + n);
  }

  list(): ErrorCount[] {
    return [...this.m.entries()].map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count);
  }
}

/** Takrorlar: har bir takror davomida uchragan xatolar yig‘iladi */
export class Reps {
  count = 0;
  clean = 0;
  flash = 0;
  lastClean = true;
  private cur = new Set<string>();

  constructor(private tally: Tally) {}

  flag(err: string) {
    this.cur.add(err);
  }

  has(err: string) {
    return this.cur.has(err);
  }

  get errors(): string[] {
    return [...this.cur];
  }

  /** Takror yakunlandi. true — xatosiz. */
  complete(): boolean {
    this.count++;
    const ok = this.cur.size === 0;
    if (ok) this.clean++;
    for (const e of this.cur) this.tally.add(e);
    this.cur.clear();
    this.flash++;
    this.lastClean = ok;
    return ok;
  }

  /** Chala urinish: takror hisoblanmaydi, lekin xatolar yoziladi */
  abort(extra?: string) {
    if (extra) this.cur.add(extra);
    for (const e of this.cur) this.tally.add(e);
    this.cur.clear();
  }

  /** Urinish bekor (kichik tasodifiy harakat) — hech narsa yozilmaydi */
  discard() {
    this.cur.clear();
  }
}

/** Ushlab turish: har bir to‘liq soniya — "birlik", xato bo‘lmasa — "toza" */
export class Hold {
  holding = false;
  start = 0;
  current = 0;
  best = 0;
  total = 0;
  ticks = 0;
  cleanTicks = 0;
  private tickStart = 0;
  private tickDirty = false;
  private lastT = 0;

  /** true qaytarsa — ushlab turish shu kadrda uzildi (oldingi davomiylik: lastDuration) */
  lastDuration = 0;

  update(holding: boolean, t: number, dirty: boolean): "start" | "stop" | null {
    let ev: "start" | "stop" | null = null;
    if (holding && !this.holding) {
      this.holding = true;
      this.start = t;
      this.tickStart = t;
      this.tickDirty = dirty;
      this.lastT = t;
      ev = "start";
    } else if (!holding && this.holding) {
      this.holding = false;
      this.lastDuration = this.current;
      this.current = 0;
      ev = "stop";
    }
    if (this.holding) {
      this.total += Math.max(0, t - this.lastT) / 1000;
      this.lastT = t;
      this.current = (t - this.start) / 1000;
      this.best = Math.max(this.best, this.current);
      if (dirty) this.tickDirty = true;
      while (t - this.tickStart >= 1000) {
        this.ticks++;
        if (!this.tickDirty) this.cleanTicks++;
        this.tickStart += 1000;
        this.tickDirty = dirty;
      }
    }
    return ev;
  }
}

/** Uzoq davom etgan holatni "epizod" sifatida bir marta hisoblash (masalan, chayqalish) */
export class Episode {
  private since: number | null = null;
  private clearSince: number | null = null;
  active = false;

  constructor(
    private onMs = 300,
    private offMs = 450,
  ) {}

  /** true qaytarsa — yangi epizod boshlandi */
  update(cond: boolean, t: number): boolean {
    if (cond) {
      this.clearSince = null;
      this.since ??= t;
      if (!this.active && t - this.since >= this.onMs) {
        this.active = true;
        return true;
      }
    } else {
      this.since = null;
      if (this.active) {
        this.clearSince ??= t;
        if (t - this.clearSince >= this.offMs) {
          this.active = false;
          this.clearSince = null;
        }
      }
    }
    return false;
  }

  reset() {
    this.since = null;
    this.clearSince = null;
    this.active = false;
  }
}

export interface Step {
  hint: Hint;
  progress?: number;
  progressGoal?: number;
  bad?: number[];
  warn?: boolean;
  meters?: Meter[];
  stability?: number;
}

export abstract class BaseAnalyzer implements Analyzer {
  abstract readonly id: CameraCheckId;
  readonly kind: VisionKind;
  readonly mode: "reps" | "hold";
  readonly target: number;

  protected tally = new Tally();
  protected reps = new Reps(this.tally);
  protected hold = new Hold();
  protected hints = new HintBox();
  private gate = new Stable(false, 250, 650);
  private gateReason = "";
  protected startT = 0;
  private praiseI = 0;
  private last: Step = { hint: hint("Tayyorlaning", "info", "⏳") };

  constructor(id: CameraCheckId) {
    const m = CHECK_META[id];
    this.kind = m.kind;
    this.mode = m.mode;
    this.target = m.target;
  }

  abstract visibility(f: FrameInput): Visibility;
  protected abstract step(f: FrameInput, t: number): Step;

  calibrate(f: FrameInput): void {
    void f;
  }

  start(t: number) {
    this.startT = t;
  }

  /** Kadr ko‘rinmay qolganda (uzoq vaqt) chaqiriladi */
  protected onLost(t: number) {
    if (this.hold.holding) this.hold.update(false, t, false);
  }

  protected praise(): Hint {
    const [text, emoji] = PRAISE[this.praiseI++ % PRAISE.length];
    return hint(text, "good", emoji);
  }

  /** Takrorni yakunlab, maqtov yoki xato maslahatini ko‘rsatadi */
  protected completeRep(t: number) {
    const errs = this.reps.errors;
    const ok = this.reps.complete();
    if (ok) this.hints.show(this.praise(), t, 1100);
    else this.hints.show(hint(errs[0], "bad", "⚠️"), t, 1800);
  }

  protected accuracyNow(): number | null {
    if (this.mode === "reps") return this.reps.count ? Math.round((this.reps.clean / this.reps.count) * 100) : null;
    return this.hold.ticks ? Math.round((this.hold.cleanTicks / this.hold.ticks) * 100) : null;
  }

  protected stabilityNow(): number | undefined {
    return undefined;
  }

  isDone(): boolean {
    return this.mode === "reps" ? this.reps.count >= this.target : this.hold.best >= this.target;
  }

  update(f: FrameInput): LiveState {
    const t = f.t;
    const vis = this.visibility(f);
    if (!vis.ok && vis.reason) this.gateReason = vis.reason;
    const shown = this.gate.update(vis.ok, t);
    if (vis.ok) this.last = this.step(f, t);
    else if (!shown) this.onLost(t);

    const s = this.last;
    const visible = shown || vis.ok;
    return {
      mode: this.mode,
      reps: this.reps.count,
      target: this.target,
      holdSec: this.hold.current,
      bestHoldSec: this.hold.best,
      holding: this.hold.holding,
      progress: vis.ok ? (s.progress ?? 0) : 0,
      progressGoal: s.progressGoal ?? 1,
      hint: visible ? this.hints.get(t, s.hint) : hint(NOT_VISIBLE, "warn", "📷"),
      visible,
      guide: visible ? undefined : this.gateReason || undefined,
      accuracy: this.accuracyNow(),
      meters: s.meters,
      stability: s.stability ?? this.stabilityNow(),
      bad: vis.ok ? (s.bad ?? []) : [],
      warn: vis.ok && (!!s.warn || this.hints.alarming(t)),
      repFlash: this.reps.flash,
      lastRepClean: this.reps.lastClean,
      elapsedSec: Math.max(0, (t - this.startT) / 1000),
      done: this.isDone(),
    };
  }

  summary(t: number): Summary {
    const reps = this.mode === "reps";
    const completion = reps ? Math.min(1, this.reps.count / this.target) : Math.min(1, this.hold.best / this.target);
    return {
      id: this.id,
      mode: this.mode,
      reps: reps ? this.reps.count : 0,
      target: this.target,
      holdSec: Math.round(this.hold.best * 10) / 10,
      accuracy: this.accuracyNow() ?? 0,
      cleanUnits: reps ? this.reps.clean : this.hold.cleanTicks,
      totalUnits: reps ? this.reps.count : this.hold.ticks,
      errors: this.tally.list(),
      stability: this.stabilityNow(),
      durationSec: Math.max(1, Math.round((t - this.startT) / 1000)),
      completion,
    };
  }
}
