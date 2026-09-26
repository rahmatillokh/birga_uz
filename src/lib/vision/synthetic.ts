// Demo rejim: kamera bo‘lmasa, mashqni bajarayotgan sun’iy "bola" harakatini yaratadi.
// Natija haqiqiy tahlilchilardan o‘tadi — raqamlar ishonarli, ba’zi xatolar ham bor.
import { mulberry32 } from "@/lib/utils";
import { CHECK_META } from "./catalog";
import type { CameraCheckId, FaceFrame, FrameInput, Lm, VisionKind } from "./types";

/** 3-2-1 tayyorlanish vaqti (sun’iy bola tik turadi — kalibrovka uchun) */
export const SYNTH_LEAD_MS = 3000;

// Bola tanasi o‘lchamlari (metr)
const D = {
  shoulderHalf: 0.14,
  hipHalf: 0.09,
  footHalf: 0.1,
  torso: 0.36,
  neck: 0.07,
  headR: 0.09,
  upperArm: 0.19,
  forearm: 0.17,
  hand: 0.06,
  thigh: 0.29,
  shin: 0.27,
  ankleH: 0.055,
  footFwd: 0.11,
  heelBack: 0.045,
};

/** normallashtirilgan balandlik birligi / metr */
const K = 0.62;
const GROUND = 0.93;
const RAD = Math.PI / 180;

interface Pose {
  /** qo‘l abduksiyasi: 0 — pastda, 90 — yon tomonga, 180 — tepada [chap, o‘ng] */
  arm: [number, number];
  /** tirsak bukilishi */
  elbow: [number, number];
  /** o‘tirish: sonning oldinga og‘ishi */
  squatT: number;
  /** o‘tirish: boldirning oldinga og‘ishi */
  squatS: number;
  /** tananing oldinga egilishi */
  lean: number;
  /** ko‘tarilgan oyoq (son bukilishi), 0 — tayanch oyoq */
  lift: [number, number];
  /** tovon ko‘tarilishi (gradus) */
  heel: [number, number];
  /** yon tomonga chayqalish (metr, bosh balandligida) */
  sway: number;
}

const NEUTRAL: Pose = { arm: [12, 12], elbow: [8, 8], squatT: 0, squatS: 0, lean: 0, lift: [0, 0], heel: [0, 0], sway: 0 };

type P3 = [number, number, number]; // X (odamning chap tomoni +), Y (yuqoriga +), Z (kameraga qarab +)

const add = (a: P3, b: P3): P3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: P3, k: number): P3 => [a[0] * k, a[1] * k, a[2] * k];
const midP = (a: P3, b: P3): P3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];

/** Oyoq panjasini oyoq uchi atrofida burish (tovon ko‘tariladi) */
function rotFoot(rel: [number, number], phi: number): [number, number] {
  const [y, z] = rel;
  const c = Math.cos(phi * RAD);
  const s = Math.sin(phi * RAD);
  return [y * c - z * s, y * s + z * c];
}

/** Pozadan 33 ta nuqta (dunyo koordinatalari, Y yuqoriga) */
function build(p: Pose): P3[] {
  const pts: P3[] = new Array(33).fill(null).map(() => [0, 0, 0] as P3);
  const hips: P3[] = [
    [0, 0, 0],
    [0, 0, 0],
  ];
  const stance = [p.lift[0] <= 0, p.lift[1] <= 0];
  const idx = [
    { hip: 23, knee: 25, ankle: 27, heel: 29, toe: 31 },
    { hip: 24, knee: 26, ankle: 28, heel: 30, toe: 32 },
  ];

  // 1) Tayanch oyoqlar: oyoq uchidan yuqoriga qarab
  for (const i of [0, 1]) {
    if (!stance[i]) continue;
    const s = i === 0 ? 1 : -1;
    const toe: P3 = [s * D.footHalf, 0.012, D.footFwd];
    const [ay, az] = rotFoot([D.ankleH, -D.footFwd], p.heel[i]);
    const [hy, hz] = rotFoot([0.02, -(D.footFwd + D.heelBack)], p.heel[i]);
    const ankle = add(toe, [0, ay, az]);
    const heel = add(toe, [0, hy, hz]);
    const knee = add(ankle, [0, D.shin * Math.cos(p.squatS * RAD), D.shin * Math.sin(p.squatS * RAD)]);
    const hip = add(knee, [0, D.thigh * Math.cos(p.squatT * RAD), -D.thigh * Math.sin(p.squatT * RAD)]);
    knee[0] = s * (D.footHalf + D.hipHalf) * 0.5;
    hip[0] = s * D.hipHalf;
    Object.assign(pts, { [idx[i].toe]: toe, [idx[i].ankle]: ankle, [idx[i].heel]: heel, [idx[i].knee]: knee, [idx[i].hip]: hip });
    hips[i] = hip;
  }
  // 2) Ko‘tarilgan oyoq: tos darajasi tayanch oyoqdan olinadi
  for (const i of [0, 1]) {
    if (stance[i]) continue;
    const s = i === 0 ? 1 : -1;
    const other = hips[1 - i];
    const hip: P3 = [s * D.hipHalf, other[1], other[2]];
    const th = p.lift[i] * RAD;
    const knee = add(hip, [0, -D.thigh * Math.cos(th), D.thigh * Math.sin(th)]);
    const back = 12 * RAD;
    const ankle = add(knee, [0, -D.shin * Math.cos(back), -D.shin * Math.sin(back)]);
    Object.assign(pts, {
      [idx[i].hip]: hip,
      [idx[i].knee]: knee,
      [idx[i].ankle]: ankle,
      [idx[i].toe]: add(ankle, [0, -D.ankleH * 0.6, D.footFwd * 0.9]),
      [idx[i].heel]: add(ankle, [0, -D.ankleH * 0.7, -D.heelBack]),
    });
    hips[i] = hip;
  }

  // 3) Tana, bosh
  const hipMid = midP(hips[0], hips[1]);
  const up: P3 = [0, Math.cos(p.lean * RAD), Math.sin(p.lean * RAD)];
  const shMid = add(hipMid, mul(up, D.torso));
  const sh: P3[] = [add(shMid, [D.shoulderHalf, 0, 0]), add(shMid, [-D.shoulderHalf, 0, 0])];
  pts[11] = sh[0];
  pts[12] = sh[1];
  const head = add(add(shMid, mul(up, D.neck)), mul(up, D.headR));
  pts[0] = add(head, [0, -0.015, 0.085]);
  pts[1] = add(head, [0.02, 0.02, 0.078]);
  pts[2] = add(head, [0.032, 0.02, 0.075]);
  pts[3] = add(head, [0.045, 0.02, 0.07]);
  pts[4] = add(head, [-0.02, 0.02, 0.078]);
  pts[5] = add(head, [-0.032, 0.02, 0.075]);
  pts[6] = add(head, [-0.045, 0.02, 0.07]);
  pts[7] = add(head, [0.078, 0, 0]);
  pts[8] = add(head, [-0.078, 0, 0]);
  pts[9] = add(head, [0.028, -0.045, 0.075]);
  pts[10] = add(head, [-0.028, -0.045, 0.075]);

  // 4) Qo‘llar (old tekislikda)
  for (const i of [0, 1]) {
    const s = i === 0 ? 1 : -1;
    const a = p.arm[i] * RAD;
    const b = (p.arm[i] + p.elbow[i]) * RAD;
    const dA: P3 = [s * Math.sin(a), -Math.cos(a), 0];
    const dF: P3 = [s * Math.sin(b), -Math.cos(b), 0];
    const S = sh[i];
    const E = add(S, mul(dA, D.upperArm));
    const W = add(E, mul(dF, D.forearm));
    pts[13 + i] = E;
    pts[15 + i] = W;
    pts[17 + i] = add(add(W, mul(dF, D.hand * 0.85)), [0, 0, -0.02]);
    pts[19 + i] = add(W, mul(dF, D.hand));
    pts[21 + i] = add(add(W, mul(dF, 0.04)), [0, 0, 0.03]);
  }

  // 5) Chayqalish (to‘piqdan yuqoriga qarab kuchayadi)
  if (p.sway) for (const q of pts) q[0] += p.sway * Math.max(0, Math.min(1, q[1] / 1.2));
  return pts;
}

// ---------------------------------------------------------------------------
// Harakat ssenariylari
// ---------------------------------------------------------------------------

const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * u));

/** 0 → 1 → 0: r ms ko‘tarilish, h ms ushlash, f ms tushish */
function bump(t: number, r: number, h: number, f: number): number {
  if (t <= 0) return 0;
  if (t < r) return ease(t / r);
  if (t < r + h) return 1;
  if (t < r + h + f) return 1 - ease((t - r - h) / f);
  return 0;
}

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

interface Script {
  duration: number;
  pose(t: number): Pose;
}

/** Ketma-ket takrorlar: har birining turi va davomiyligi */
function sequence<T extends string>(kinds: T[], len: (k: T) => number, fn: (k: T, t: number) => Pose): Script {
  const starts: number[] = [];
  let acc = 0;
  for (const k of kinds) {
    starts.push(acc);
    acc += len(k);
  }
  return {
    duration: acc,
    pose(t) {
      for (let i = kinds.length - 1; i >= 0; i--) if (t >= starts[i]) return fn(kinds[i], t - starts[i]);
      return NEUTRAL;
    },
  };
}

function armsUpScript(): Script {
  type K = "n" | "bent" | "asym" | "partial";
  const kinds: K[] = ["n", "n", "bent", "n", "n", "asym", "n", "partial", "n", "n", "n"];
  return sequence<K>(
    kinds,
    (k) => (k === "asym" ? 2600 : 1700),
    (k, t) => {
      if (k === "asym") {
        const l = bump(t, 600, 1150, 600);
        const r = bump(t - 900, 600, 250, 600);
        return { ...NEUTRAL, arm: [lerp(12, 172, l), lerp(12, 172, r)] };
      }
      const u = bump(t, 600, 250, 600);
      const peak = k === "partial" ? 108 : k === "bent" ? 165 : 172;
      const el = k === "bent" ? lerp(8, 75, u) : 8;
      return { ...NEUTRAL, arm: [lerp(12, peak, u), lerp(12, peak, u)], elbow: [el, el] };
    },
  );
}

function squatScript(): Script {
  type K = "n" | "shallow" | "lean";
  const kinds: K[] = ["n", "n", "n", "shallow", "n", "lean", "n", "n"];
  return sequence<K>(
    kinds,
    () => 2300,
    (k, t) => {
      const u = bump(t, 800, 300, 800);
      const T = k === "shallow" ? 40 : 72;
      const S = k === "shallow" ? 12 : 24;
      const L = k === "lean" ? 62 : k === "shallow" ? 10 : 22;
      return { ...NEUTRAL, squatT: T * u, squatS: S * u, lean: L * u, arm: [lerp(12, 35, u), lerp(12, 35, u)] };
    },
  );
}

function balanceScript(): Script {
  return {
    duration: 18500,
    pose(t) {
      const armsOut = ease(t / 500);
      const base: Pose = { ...NEUTRAL, arm: [lerp(12, 70, armsOut), lerp(12, 70, armsOut)] };
      const slow = 0.012 * Math.sin((t / 1000) * Math.PI * 0.9) + 0.005 * Math.sin((t / 1000) * Math.PI * 2.3);
      if (t < 4800) {
        // 1-urinish: chap oyoq, chayqalib tushib ketadi
        const u = t < 500 ? 0 : t < 900 ? ease((t - 500) / 400) : t < 4400 ? 1 : 1 - ease((t - 4400) / 400);
        const wob = t > 3500 && t < 4400 ? 0.075 * Math.sin(((t - 3500) / 1000) * 2 * Math.PI * 1.6) : 0;
        return { ...base, lift: [75 * u, 0], sway: slow + wob };
      }
      if (t < 6000) return base;
      // 2-urinish: o‘ng oyoq, 10+ soniya
      const u = ease((t - 6000) / 400);
      const wob = t > 9800 && t < 10740 ? 0.09 * Math.sin(((t - 9800) / 1000) * 2 * Math.PI * 1.6) : 0;
      return { ...base, lift: [0, 78 * u], sway: slow + wob };
    },
  };
}

function tiptoeScript(): Script {
  type K = "n" | "partial" | "asym";
  const kinds: K[] = ["n", "n", "n", "partial", "n", "n", "asym", "n", "n", "n", "n"];
  return sequence<K>(
    kinds,
    () => 1600,
    (k, t) => {
      const u = bump(t, 450, 350, 450);
      const l = k === "partial" ? 8 : 34;
      const r = k === "partial" ? 8 : k === "asym" ? 6 : 34;
      return { ...NEUTRAL, heel: [l * u, r * u] };
    },
  );
}

function airplaneScript(): Script {
  return {
    duration: 17000,
    pose(t) {
      const raise = ease(t / 700);
      const osc = 3 * Math.sin((t / 1000) * 2 * Math.PI * 0.6);
      let l = lerp(12, 90, raise) + osc * raise;
      let r = lerp(12, 90, raise) - osc * raise;
      let el = 8;
      // o‘ng qo‘l tushib ketadi
      if (t > 3200 && t < 5000) {
        const d = t < 3500 ? ease((t - 3200) / 300) : t < 4600 ? 1 : 1 - ease((t - 4600) / 400);
        r = lerp(r, 40, d);
      }
      // tirsaklar bukiladi
      if (t > 8500 && t < 9500) el = lerp(8, 40, bump(t - 8500, 200, 550, 200));
      // qanotlar qiyshayadi
      if (t > 12000 && t < 12800) {
        const d = bump(t - 12000, 200, 400, 200);
        l += 14 * d;
        r -= 10 * d;
      }
      return { ...NEUTRAL, arm: [l, r], elbow: [el, el] };
    },
  };
}

// ---------------------------------------------------------------------------

export interface Synth {
  readonly kind: VisionKind;
  readonly aspect: number;
  readonly duration: number;
  /** tMs — demo boshlanganidan beri o‘tgan vaqt; now — performance.now() */
  frame(tMs: number, now: number): FrameInput;
}

function poseSynth(script: Script, aspect: number, seed: number): Synth {
  const rnd = mulberry32(seed);
  const jit = () => (rnd() - 0.5) * 0.0024;
  return {
    kind: "pose",
    aspect,
    duration: SYNTH_LEAD_MS + script.duration,
    frame(tMs, now) {
      const t = tMs - SYNTH_LEAD_MS;
      const p = t < 0 || t > script.duration ? NEUTRAL : script.pose(t);
      const pts = build(p);
      const hip = midP(pts[23], pts[24]);
      const pose: Lm[] = pts.map((q, i) => ({
        x: 0.5 + (q[0] * K) / aspect + jit(),
        y: GROUND - q[1] * K + jit(),
        z: -q[2] * K,
        visibility: i === 29 || i === 30 ? 0.86 : 0.99,
      }));
      const world: Lm[] = pts.map((q) => ({ x: q[0] - hip[0], y: -(q[1] - hip[1]), z: -(q[2] - hip[2]), visibility: 0.99 }));
      return { t: now, aspect, pose, world };
    },
  };
}

function faceSynth(aspect: number, seed: number): Synth {
  const rnd = mulberry32(seed);
  const cycle = 2200;
  const reps = CHECK_META["smile-pucker"].target;
  const duration = cycle * reps + 600;
  // Yuz chegarasi (bbox) uchun oval nuqtalar
  const ring = (cx: number, cy: number, rx: number, ry: number): Lm[] =>
    Array.from({ length: 36 }, (_, i) => {
      const a = (i / 36) * Math.PI * 2;
      return { x: cx + (Math.cos(a) * rx) / aspect, y: cy + Math.sin(a) * ry, z: 0, visibility: 1 };
    });
  return {
    kind: "face",
    aspect,
    duration: SYNTH_LEAD_MS + duration,
    frame(tMs, now) {
      const t = tMs - SYNTH_LEAD_MS;
      let smile = 0.04;
      let pucker = 0.03;
      if (t >= 0 && t < cycle * reps) {
        const i = Math.floor(t / cycle);
        const u = t - i * cycle;
        const sPeak = i === 2 ? 0.52 : 0.86;
        const pPeak = i === 5 ? 0.5 : 0.84;
        smile += (sPeak - 0.04) * bump(u, 350, 450, 250);
        pucker += (pPeak - 0.03) * bump(u - 1100, 350, 450, 250);
      }
      const n = () => (rnd() - 0.5) * 0.03;
      const bob = Math.sin(tMs / 900) * 0.006;
      const face: FaceFrame = {
        landmarks: ring(0.5 + bob, 0.47, 0.17, 0.22),
        blend: {
          mouthSmileLeft: Math.max(0, smile + n()),
          mouthSmileRight: Math.max(0, smile + n()),
          mouthPucker: Math.max(0, pucker + n()),
          mouthFunnel: Math.max(0, pucker * 0.55),
          jawOpen: 0.04 + smile * 0.08,
        },
      };
      return { t: now, aspect, face };
    },
  };
}

export function createSynth(id: CameraCheckId, aspect: number, seed = Date.now() % 100000): Synth {
  switch (id) {
    case "arms-up":
      return poseSynth(armsUpScript(), aspect, seed);
    case "squat":
      return poseSynth(squatScript(), aspect, seed);
    case "balance":
      return poseSynth(balanceScript(), aspect, seed);
    case "tiptoe":
      return poseSynth(tiptoeScript(), aspect, seed);
    case "airplane":
      return poseSynth(airplaneScript(), aspect, seed);
    case "smile-pucker":
      return faceSynth(aspect, seed);
  }
}
