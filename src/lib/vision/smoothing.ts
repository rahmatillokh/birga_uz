// Shovqinni kamaytirish: One Euro filtri, EMA, vaqtga asoslangan "barqaror" bayroq
import type { Lm } from "./types";

function alpha(cutoffHz: number, dtSec: number): number {
  const tau = 1 / (2 * Math.PI * cutoffHz);
  return 1 / (1 + tau / dtSec);
}

/**
 * One Euro filtri (Casiez va b., 2012): harakatsiz holatda titrashni yo‘qotadi,
 * tez harakatda esa kechikmaydi.
 */
export class OneEuro {
  private x: number | null = null;
  private dx = 0;
  private t = 0;

  constructor(
    private minCutoff = 1.5,
    private beta = 4,
    private dCutoff = 1,
  ) {}

  reset() {
    this.x = null;
    this.dx = 0;
  }

  filter(v: number, tMs: number): number {
    if (this.x === null || !Number.isFinite(this.x)) {
      this.x = v;
      this.t = tMs;
      this.dx = 0;
      return v;
    }
    const dt = (tMs - this.t) / 1000;
    if (dt <= 0) return this.x;
    this.t = tMs;
    const rawDx = (v - this.x) / dt;
    this.dx += alpha(this.dCutoff, dt) * (rawDx - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += alpha(cutoff, dt) * (v - this.x);
    return this.x;
  }
}

/** Nuqtalar massivini silliqlash. Odam kadrdan yo‘qolsa, filtr qayta boshlanadi. */
export class LandmarkSmoother {
  private fx: OneEuro[] = [];
  private fy: OneEuro[] = [];
  private fz: OneEuro[] = [];
  private vis: number[] = [];
  private lastT = -Infinity;

  constructor(
    private minCutoff = 1.5,
    private beta = 4,
    private resetAfterMs = 400,
  ) {}

  reset() {
    this.fx = [];
    this.fy = [];
    this.fz = [];
    this.vis = [];
    this.lastT = -Infinity;
  }

  smooth(lms: Lm[] | null | undefined, t: number): Lm[] | null {
    if (!lms || lms.length === 0) return null;
    if (t - this.lastT > this.resetAfterMs || lms.length !== this.fx.length) this.reset();
    this.lastT = t;
    const out: Lm[] = new Array(lms.length);
    for (let i = 0; i < lms.length; i++) {
      const p = lms[i];
      if (!this.fx[i]) {
        this.fx[i] = new OneEuro(this.minCutoff, this.beta);
        this.fy[i] = new OneEuro(this.minCutoff, this.beta);
        this.fz[i] = new OneEuro(this.minCutoff, this.beta);
        this.vis[i] = p.visibility ?? 1;
      }
      const vis = (this.vis[i] = this.vis[i] * 0.4 + (p.visibility ?? 1) * 0.6);
      out[i] = {
        x: this.fx[i].filter(p.x, t),
        y: this.fy[i].filter(p.y, t),
        z: this.fz[i].filter(p.z, t),
        visibility: vis,
      };
    }
    return out;
  }
}

/** Vaqt doimiysiga asoslangan eksponensial o‘rtacha (kadr tezligiga bog‘liq emas) */
export class Ema {
  private v: number | null = null;
  private t = 0;

  constructor(private tauMs = 100) {}

  update(x: number, t: number): number {
    if (!Number.isFinite(x)) return this.v ?? x;
    if (this.v === null) {
      this.v = x;
      this.t = t;
      return x;
    }
    const dt = Math.max(0, t - this.t);
    this.t = t;
    this.v += (1 - Math.exp(-dt / this.tauMs)) * (x - this.v);
    return this.v;
  }

  get value(): number {
    return this.v ?? NaN;
  }

  reset() {
    this.v = null;
  }
}

/**
 * Shart kamida onMs davomida bajarilsa — true, kamida offMs davomida bajarilmasa — false.
 * Bir-ikki kadrlik "sakrash"larni e’tiborsiz qoldiradi.
 */
export class Stable {
  private v: boolean;
  private pending: boolean | null = null;
  private since = 0;

  constructor(
    initial = false,
    private onMs = 120,
    private offMs = 120,
  ) {
    this.v = initial;
  }

  update(cond: boolean, t: number): boolean {
    if (cond === this.v) {
      this.pending = null;
      return this.v;
    }
    if (this.pending !== cond) {
      this.pending = cond;
      this.since = t;
    }
    if (t - this.since >= (cond ? this.onMs : this.offMs)) {
      this.v = cond;
      this.pending = null;
    }
    return this.v;
  }

  get value(): boolean {
    return this.v;
  }

  set(v: boolean) {
    this.v = v;
    this.pending = null;
  }
}

/** Welford usulida o‘rtacha va dispersiya */
export class RunningStats {
  n = 0;
  private m = 0;
  private s = 0;

  push(x: number) {
    if (!Number.isFinite(x)) return;
    this.n++;
    const d = x - this.m;
    this.m += d / this.n;
    this.s += d * (x - this.m);
  }

  get mean(): number {
    return this.m;
  }

  /** populyatsiya dispersiyasi */
  get variance(): number {
    return this.n > 1 ? this.s / this.n : 0;
  }

  reset() {
    this.n = 0;
    this.m = 0;
    this.s = 0;
  }
}
