// MediaPipe modellarini yuklash (faqat brauzerda, effekt ichidan chaqiriladi).
//
// Tartib: avval mahalliy fayllar (/mediapipe/..., scripts/setup-mediapipe.mjs tayyorlaydi),
// topilmasa — wasm jsDelivr CDN’dan, model esa storage.googleapis.com’dan.
// Video hech qayerga yuborilmaydi: tahlil to‘liq qurilmada (WebAssembly) bajariladi.
import type { FaceFrame, Lm, VisionKind } from "./types";

type Vision = typeof import("@mediapipe/tasks-vision");
type PoseLandmarkerT = import("@mediapipe/tasks-vision").PoseLandmarker;
type FaceLandmarkerT = import("@mediapipe/tasks-vision").FaceLandmarker;
type WasmFileset = Awaited<ReturnType<Vision["FilesetResolver"]["forVisionTasks"]>>;

/** package.json dagi @mediapipe/tasks-vision versiyasi bilan bir xil bo‘lishi shart (CDN zaxirasi uchun) */
export const MEDIAPIPE_VERSION = "1.0.1";

const LOCAL_WASM = "/mediapipe/wasm";
const CDN_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODELS: Record<VisionKind, { local: string; remote: string; label: string }> = {
  pose: {
    local: "/mediapipe/pose_landmarker_lite.task",
    remote: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    label: "Harakat modeli",
  },
  face: {
    local: "/mediapipe/face_landmarker.task",
    remote: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    label: "Yuz modeli",
  },
};
/** MediaPipe’ning ichki statistikasi yuboriladigan manzil */
const TELEMETRY_HOST = "https://odml.pa.googleapis.com/";

export type Source = "local" | "cdn";
export type Delegate = "GPU" | "CPU";

export interface LoadProgress {
  stage: "lib" | "wasm" | "model" | "init" | "ready";
  /** 0..1 */
  ratio: number;
  text: string;
}

export interface Connection {
  start: number;
  end: number;
}

export interface DetectResult {
  pose: Lm[] | null;
  world: Lm[] | null;
  face: FaceFrame | null;
}

export interface Detector {
  readonly kind: VisionKind;
  readonly delegate: Delegate;
  readonly source: Source;
  /** yuz: lablar va yuz ovali chiziqlari */
  readonly lips?: Connection[];
  readonly oval?: Connection[];
  detect(video: HTMLVideoElement, now: number): DetectResult;
  close(): void;
}

export class VisionLoadError extends Error {
  constructor(
    readonly code: "offline" | "lib" | "wasm" | "model" | "init",
    message: string,
  ) {
    super(message);
    this.name = "VisionLoadError";
  }
}

const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;
const pct = (r: number) => `${Math.round(Math.max(0, Math.min(1, r)) * 100)}%`;

// ---------------------------------------------------------------------------
// Muhit sozlamalari
// ---------------------------------------------------------------------------

let libPromise: Promise<Vision> | null = null;
function loadLib(): Promise<Vision> {
  libPromise ??= import("@mediapipe/tasks-vision").catch((e) => {
    libPromise = null;
    throw e;
  });
  return libPromise;
}

/**
 * MediaPipe 1.x foydalanish statistikasini Google’ga yuboradi (video emas, faqat tezlik ko‘rsatkichlari).
 * Bola ma’lumotlari maxfiyligi va internetsiz (ko‘rgazma) ishlash uchun bu so‘rovlar tarmoqqa chiqmaydi.
 */
function installTelemetryGuard() {
  if (typeof window === "undefined") return;
  const w = window as Window & { __yqMpGuard?: boolean };
  if (w.__yqMpGuard) return;
  w.__yqMpGuard = true;
  const orig = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith(TELEMETRY_HOST)) return Promise.resolve(new Response("", { status: 200 }));
    return orig(input, init);
  }) as typeof window.fetch;
}

/**
 * WebAssembly modulining stdout/stderr xabarlari (masalan, "Created TensorFlow Lite XNNPACK delegate")
 * standart holatda console.error’ga chiqadi. Ular ma’lumot uchun — debug darajasiga o‘tkazamiz.
 * MediaPipe yuklash vaqtida global `Module` obyektini o‘qiydi va keyin o‘zi tozalaydi.
 */
function setModuleHooks() {
  const g = globalThis as { Module?: unknown; dbg?: (...a: unknown[]) => void };
  const log = (...a: unknown[]) => console.debug("[mediapipe]", ...a);
  g.Module = { print: log, printErr: log };
  // GL diagnostikasi (masalan, "OpenGL error checking is disabled") global `dbg` bo‘lmasa console.warn’ga chiqadi
  g.dbg ??= log;
}

function clearModuleHooks() {
  const g = globalThis as { Module?: unknown };
  g.Module = undefined;
}

/** iOS/Safari (Telegram iOS ham WebKit) — CPU barqarorroq; qolganlarida GPU tezroq */
function preferCpu(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const safari = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(ua);
  return iOS || safari;
}

// ---------------------------------------------------------------------------
// Yuklab olish (jarayon foizi bilan)
// ---------------------------------------------------------------------------

async function download(url: string, onRatio: (r: number) => void, keep: boolean): Promise<Uint8Array | null> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if ((res.headers.get("content-type") ?? "").includes("text/html")) throw new Error("fayl topilmadi");
  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body || typeof res.body.getReader !== "function") {
    const buf = new Uint8Array(await res.arrayBuffer());
    onRatio(1);
    return keep ? buf : null;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    got += value.byteLength;
    if (keep) chunks.push(value);
    if (total) onRatio(Math.min(1, got / total));
  }
  onRatio(1);
  if (!keep) return null;
  const out = new Uint8Array(got);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.byteLength;
  }
  return out;
}

/** wasm: mahalliy → CDN. Ikkilik fayl oldindan yuklanadi (HTTP keshga tushadi, foiz ko‘rinadi). */
async function resolveWasm(vision: Vision, onRatio: (r: number) => void): Promise<{ fileset: WasmFileset; source: Source }> {
  const bases: [string, Source][] = [
    [LOCAL_WASM, "local"],
    [CDN_WASM, "cdn"],
  ];
  for (const [base, source] of bases) {
    try {
      const fileset = await vision.FilesetResolver.forVisionTasks(base);
      await download(String(fileset.wasmBinaryPath), onRatio, false);
      return { fileset, source };
    } catch {
      /* keyingi manba */
    }
  }
  throw new VisionLoadError(isOffline() ? "offline" : "wasm", "AI dvigatelini yuklab bo‘lmadi");
}

async function fetchModel(kind: VisionKind, onRatio: (r: number) => void): Promise<Uint8Array> {
  const m = MODELS[kind];
  for (const url of [m.local, m.remote]) {
    try {
      const buf = await download(url, onRatio, true);
      if (buf && buf.byteLength > 100_000) return buf;
    } catch {
      /* keyingi manba */
    }
  }
  throw new VisionLoadError(isOffline() ? "offline" : "model", "AI modelini yuklab bo‘lmadi");
}

// ---------------------------------------------------------------------------
// Detektorlar
// ---------------------------------------------------------------------------

function poseDetector(lm: PoseLandmarkerT, delegate: Delegate, source: Source): Detector {
  let last = 0;
  return {
    kind: "pose",
    delegate,
    source,
    detect(video, now) {
      // VIDEO rejimida vaqt belgisi qat’iy o‘sib borishi shart
      const ts = Math.max(now, last + 1);
      last = ts;
      const r = lm.detectForVideo(video, ts);
      const pose = r.landmarks?.[0];
      const world = r.worldLandmarks?.[0];
      r.close?.();
      return { pose: pose?.length ? pose : null, world: world?.length ? world : null, face: null };
    },
    close() {
      try {
        lm.close();
      } catch {
        /* allaqachon yopilgan */
      }
    },
  };
}

function faceDetector(lm: FaceLandmarkerT, vision: Vision, delegate: Delegate, source: Source): Detector {
  let last = 0;
  return {
    kind: "face",
    delegate,
    source,
    lips: vision.FaceLandmarker.FACE_LANDMARKS_LIPS,
    oval: vision.FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
    detect(video, now) {
      const ts = Math.max(now, last + 1);
      last = ts;
      const r = lm.detectForVideo(video, ts);
      const landmarks = r.faceLandmarks?.[0];
      if (!landmarks?.length) return { pose: null, world: null, face: null };
      const blend: Record<string, number> = {};
      for (const c of r.faceBlendshapes?.[0]?.categories ?? []) blend[c.categoryName] = c.score;
      return { pose: null, world: null, face: { landmarks, blend } };
    },
    close() {
      try {
        lm.close();
      } catch {
        /* allaqachon yopilgan */
      }
    },
  };
}

async function create(kind: VisionKind, emit: (p: LoadProgress) => void, forceCpu: boolean): Promise<Detector> {
  emit({ stage: "lib", ratio: 0.02, text: "AI kutubxonasi yuklanmoqda…" });
  let vision: Vision;
  try {
    vision = await loadLib();
  } catch {
    throw new VisionLoadError(isOffline() ? "offline" : "lib", "AI kutubxonasini yuklab bo‘lmadi");
  }
  installTelemetryGuard();

  const { fileset, source } = await resolveWasm(vision, (r) =>
    emit({ stage: "wasm", ratio: 0.05 + 0.6 * r, text: `AI dvigateli yuklanmoqda… ${pct(r)}` }),
  );
  const model = await fetchModel(kind, (r) =>
    emit({ stage: "model", ratio: 0.65 + 0.3 * r, text: `${MODELS[kind].label} yuklanmoqda… ${pct(r)}` }),
  );
  emit({ stage: "init", ratio: 0.97, text: "AI ishga tushirilmoqda…" });

  const order: Delegate[] = forceCpu ? ["CPU"] : preferCpu() ? ["CPU", "GPU"] : ["GPU", "CPU"];
  for (const delegate of order) {
    try {
      setModuleHooks();
      if (kind === "pose") {
        const lm = await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetBuffer: model, delegate },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: false,
        });
        return poseDetector(lm, delegate, source);
      }
      const lm = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetBuffer: model, delegate },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
      });
      return faceDetector(lm, vision, delegate, source);
    } catch {
      clearModuleHooks();
      /* keyingi delegat */
    }
  }
  throw new VisionLoadError("init", "AI modelini ishga tushirib bo‘lmadi");
}

// ---------------------------------------------------------------------------
// Kesh: har bir tur uchun bitta detektor; boshqa tur so‘ralsa — oldingisi yopiladi (xotira)
// ---------------------------------------------------------------------------

interface Entry {
  promise: Promise<Detector>;
  progress: LoadProgress;
  listeners: Set<(p: LoadProgress) => void>;
  detector?: Detector;
}

const entries: Partial<Record<VisionKind, Entry>> = {};

function dispose(kind: VisionKind) {
  const e = entries[kind];
  if (!e) return;
  delete entries[kind];
  e.promise.then((d) => d.close()).catch(() => {});
}

/** Barcha yuklangan modellarni yopish */
export function disposeDetectors() {
  dispose("pose");
  dispose("face");
}

/**
 * Detektorni olish (bir marta yuklanadi, keyin keshdan). onProgress — yuklanish foizi.
 * forceCpu — GPU’da xatolik bo‘lsa, CPU bilan qayta yaratish.
 */
export function getDetector(kind: VisionKind, onProgress?: (p: LoadProgress) => void, opts?: { forceCpu?: boolean }): Promise<Detector> {
  let e = entries[kind];
  if (e && opts?.forceCpu && e.detector?.delegate !== "CPU") {
    dispose(kind);
    e = undefined;
  }
  if (!e) {
    (Object.keys(entries) as VisionKind[]).forEach((k) => k !== kind && dispose(k));
    const entry: Entry = {
      progress: { stage: "lib", ratio: 0, text: "AI tayyorlanmoqda…" },
      listeners: new Set(),
      promise: Promise.resolve(null as unknown as Detector),
    };
    const emit = (p: LoadProgress) => {
      entry.progress = p;
      entry.listeners.forEach((l) => l(p));
    };
    entry.promise = create(kind, emit, !!opts?.forceCpu).then(
      (d) => {
        entry.detector = d;
        emit({ stage: "ready", ratio: 1, text: "AI tayyor" });
        return d;
      },
      (err) => {
        if (entries[kind] === entry) delete entries[kind];
        throw err instanceof VisionLoadError ? err : new VisionLoadError("init", "AI modelini ishga tushirib bo‘lmadi");
      },
    );
    entries[kind] = entry;
    e = entry;
  }
  if (onProgress) {
    const entry = e;
    entry.listeners.add(onProgress);
    onProgress(entry.progress);
    entry.promise.then(
      () => entry.listeners.delete(onProgress),
      () => entry.listeners.delete(onProgress),
    );
  }
  return e.promise;
}

/** Oldindan yuklab qo‘yish (xatolar e’tiborsiz) */
export function preloadDetector(kind: VisionKind): void {
  getDetector(kind).catch(() => {});
}

/** Yuklanganmi (kutmasdan) */
export function isDetectorReady(kind: VisionKind): boolean {
  return !!entries[kind]?.detector;
}
