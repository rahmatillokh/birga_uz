"use client";

import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { getExercise } from "@/data/exercises";
import { useChildData, useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import { AI_CHECKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createAnalyzer } from "@/lib/vision/analyzers";
import { attachStream, CAMERA_ERRORS, CameraError, cameraSupport, openCamera, stopStream } from "@/lib/vision/camera";
import { CHECK_META } from "@/lib/vision/catalog";
import { getDetector, preloadDetector, VisionLoadError, type DetectResult, type Detector, type LoadProgress } from "@/lib/vision/loader";
import { errorsForDetails, isMeaningful, recommendNext, starsFor, type Recommendation } from "@/lib/vision/result";
import { LandmarkSmoother } from "@/lib/vision/smoothing";
import { createSynth, SYNTH_LEAD_MS, type Synth } from "@/lib/vision/synthetic";
import type { Analyzer, CameraCheckId, FrameInput, LiveState, Summary } from "@/lib/vision/types";
import { drawCartoonFace, drawDemoBackground, drawDemoFigure, drawFace, drawPose } from "./draw";
import { Hud } from "./hud";
import { ErrorPanel, IntroPanel, type Failure } from "./intro";
import { CountdownOverlay, LoadingOverlay, PositionOverlay } from "./overlays";
import { ResultCard, type SaveState } from "./result-card";

type Stage = "intro" | "loading" | "position" | "countdown" | "live" | "result" | "error";

const COUNTDOWN_MS = SYNTH_LEAD_MS;
/** kadrda shuncha vaqt to‘liq ko‘ringach, 3-2-1 avtomatik boshlanadi */
const POSITION_HOLD_MS = 1000;
/** xavfsizlik uchun: sessiya bundan uzoq davom etmaydi */
const MAX_SESSION_MS = 180_000;
const SOUND_KEY = "yq-ai-sound";

interface Engine {
  run: number;
  stage: Stage;
  demo: boolean;
  stream: MediaStream | null;
  detector: Detector | null;
  analyzer: Analyzer | null;
  synth: Synth | null;
  raf: number;
  finishTimer: number;
  src: { w: number; h: number };
  box: { w: number; h: number };
  demoAt: number;
  countdownAt: number;
  liveAt: number;
  lastCount: number;
  lastVideoTime: number;
  visibleSince: number;
  lastPos: number;
  posOk: boolean;
  lastHud: number;
  lastLive: LiveState | null;
  lastFlash: number;
  fpsN: number;
  fpsAt: number;
  errors: number;
  finishing: boolean;
  recovering: boolean;
  smooth: { pose: LandmarkSmoother; world: LandmarkSmoother; face: LandmarkSmoother };
  audio: AudioContext | null;
  sound: boolean;
}

function readSoundPref(): boolean {
  try {
    return typeof window === "undefined" || localStorage.getItem(SOUND_KEY) !== "0";
  } catch {
    return true;
  }
}

function createEngine(): Engine {
  return {
    run: 0,
    stage: "intro",
    demo: false,
    stream: null,
    detector: null,
    analyzer: null,
    synth: null,
    raf: 0,
    finishTimer: 0,
    src: { w: 640, h: 480 },
    box: { w: 0, h: 0 },
    demoAt: 0,
    countdownAt: 0,
    liveAt: 0,
    lastCount: 3,
    lastVideoTime: -1,
    visibleSince: 0,
    lastPos: 0,
    posOk: false,
    lastHud: 0,
    lastLive: null,
    lastFlash: 0,
    fpsN: 0,
    fpsAt: 0,
    errors: 0,
    finishing: false,
    recovering: false,
    smooth: { pose: new LandmarkSmoother(), world: new LandmarkSmoother(), face: new LandmarkSmoother(1.2, 2) },
    audio: null,
    sound: readSoundPref(),
  };
}

/** Qisqa ovozli signal (takror, 3-2-1) — fayllarsiz, WebAudio orqali */
function tone(ctx: AudioContext | null, freq: number, ms = 130, delay = 0, vol = 0.07) {
  if (!ctx || ctx.state === "closed") return;
  try {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + ms / 1000 + 0.03);
  } catch {
    /* ovoz — ixtiyoriy */
  }
}

// Katta ekran (Safari uchun webkit prefiksi bilan)
type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void; webkitFullscreenEnabled?: boolean };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => void };
const noopSubscribe = () => () => {};
function fsElement(): Element | null {
  if (typeof document === "undefined") return null;
  return document.fullscreenElement ?? (document as FsDoc).webkitFullscreenElement ?? null;
}
function fsEnabled(): boolean {
  return typeof document !== "undefined" && !!(document.fullscreenEnabled || (document as FsDoc).webkitFullscreenEnabled);
}
function subscribeFs(cb: () => void) {
  document.addEventListener("fullscreenchange", cb);
  document.addEventListener("webkitfullscreenchange", cb);
  return () => {
    document.removeEventListener("fullscreenchange", cb);
    document.removeEventListener("webkitfullscreenchange", cb);
  };
}
function exitFullscreen() {
  if (!fsElement()) return;
  try {
    if (document.exitFullscreen) void document.exitFullscreen().catch(() => {});
    else (document as FsDoc).webkitExitFullscreen?.();
  } catch {
    /* e’tiborsiz */
  }
}

function modelFailure(err: unknown): Failure {
  const code = err instanceof VisionLoadError ? err.code : "init";
  if (code === "offline") {
    return {
      emoji: "📡",
      title: "Internet aloqasi yo‘q",
      text: "AI modeli hali yuklanmagan. Internetga ulanib qayta urinib ko‘ring yoki demo rejimdan foydalaning.",
    };
  }
  if (code === "init") {
    return {
      emoji: "🤖",
      title: "AI ishga tushmadi",
      text: "Brauzer AI tahlilini qo‘llab-quvvatlamasligi mumkin. Chrome yoki Safari’ning yangi versiyasida urinib ko‘ring yoki demo rejimdan foydalaning.",
    };
  }
  return {
    emoji: "📦",
    title: "AI modelini yuklab bo‘lmadi",
    text: "Internet aloqasini tekshirib, qayta urinib ko‘ring. Aloqa bo‘lmasa — demo rejimdan foydalaning.",
  };
}

export function AiCheckSession({ id, exerciseId }: { id: CameraCheckId; exerciseId?: string }) {
  const meta = CHECK_META[id];
  const info = AI_CHECKS[id];
  const face = meta.kind === "face";
  const exercise = useMemo(() => getExercise(exerciseId), [exerciseId]);
  const act = useApp((s) => s.act);
  const view = useView();
  const { child, activities } = useChildData();
  const consent = view.user.consents.videoAnalysis !== false;

  const [stage, setStage] = useState<Stage>("intro");
  const [demo, setDemo] = useState(false);
  const [progress, setProgress] = useState<LoadProgress | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [live, setLive] = useState<LiveState | null>(null);
  const [pos, setPos] = useState<{ ok: boolean; reason?: string }>({ ok: false });
  const [count, setCount] = useState(3);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [save, setSave] = useState<SaveState>("idle");
  const [fps, setFps] = useState(0);
  const [aspect, setAspect] = useState(4 / 3);
  const [sound, setSound] = useState(readSoundPref);
  const [consentBusy, setConsentBusy] = useState(false);

  const cameraIssue = useSyncExternalStore(noopSubscribe, cameraSupport, () => null);
  const canFs = useSyncExternalStore(noopSubscribe, fsEnabled, () => false);
  const isFs = useSyncExternalStore(subscribeFs, () => !!fsElement(), () => false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const engRef = useRef<Engine | null>(null);
  const latest = useRef({ child, act, activities, exerciseId: exercise?.id });

  useEffect(() => {
    latest.current = { child, act, activities, exerciseId: exercise?.id };
  });

  const E = (): Engine => (engRef.current ??= createEngine());

  // Sahifadan chiqilganda: kamera, sikl, taymer va ovoz to‘liq to‘xtatiladi
  useEffect(() => {
    const e = (engRef.current ??= createEngine());
    const box = boxRef.current;
    let ro: ResizeObserver | null = null;
    if (box && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver((entries) => {
        const r = entries[0]?.contentRect;
        if (r) e.box = { w: r.width, h: r.height };
      });
      ro.observe(box);
    }
    return () => {
      ro?.disconnect();
      e.run++;
      if (e.raf) cancelAnimationFrame(e.raf);
      e.raf = 0;
      if (e.finishTimer) window.clearTimeout(e.finishTimer);
      e.finishTimer = 0;
      stopStream(e.stream);
      e.stream = null;
      if (e.audio && e.audio.state !== "closed") e.audio.close().catch(() => {});
      e.audio = null;
      exitFullscreen();
    };
  }, []);

  // Modelni oldindan yuklab qo‘yish — bola qo‘llanmani o‘qiguncha tayyor bo‘ladi
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData || navigator.onLine === false) return;
    const t = window.setTimeout(() => preloadDetector(meta.kind), 700);
    return () => window.clearTimeout(t);
  }, [meta.kind]);

  // -------------------------------------------------------------------------
  // Yordamchilar (faqat hodisa va sikl ichidan chaqiriladi)
  // -------------------------------------------------------------------------

  const go = (s: Stage) => {
    E().stage = s;
    setStage(s);
  };

  const sfx = (freq: number, ms?: number, delay?: number) => {
    const e = E();
    if (e.sound) tone(e.audio, freq, ms, delay);
  };

  const ensureAudio = () => {
    const e = E();
    if (!e.audio || e.audio.state === "closed") {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      try {
        e.audio = Ctx ? new Ctx() : null;
      } catch {
        e.audio = null;
      }
    }
    e.audio?.resume?.().catch(() => {});
  };

  const stopLoop = () => {
    const e = E();
    if (e.raf) cancelAnimationFrame(e.raf);
    e.raf = 0;
  };

  const clearFinishTimer = () => {
    const e = E();
    if (e.finishTimer) window.clearTimeout(e.finishTimer);
    e.finishTimer = 0;
  };

  const releaseCamera = () => {
    const e = E();
    stopStream(e.stream);
    e.stream = null;
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.srcObject = null;
    }
    setCamOn(false);
  };

  const resetTracking = (e: Engine) => {
    e.smooth = { pose: new LandmarkSmoother(), world: new LandmarkSmoother(), face: new LandmarkSmoother(1.2, 2) };
    e.lastVideoTime = -1;
    e.errors = 0;
    e.finishing = false;
    e.lastFlash = 0;
    e.lastLive = null;
    e.lastHud = 0;
    e.visibleSince = 0;
    e.fpsN = 0;
    e.fpsAt = performance.now();
  };

  const fail = (f: Failure) => {
    const e = E();
    e.run++;
    stopLoop();
    clearFinishTimer();
    releaseCamera();
    exitFullscreen();
    setFailure(f);
    go("error");
  };

  const draw = (e: Engine, f: FrameInput, bad: number[], warn: boolean, now: number) => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const { w: sw, h: sh } = e.src;
    if (!sw || !sh) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const bw = e.box.w || c.clientWidth || sw;
    const bh = e.box.h || c.clientHeight || sh;
    const s = Math.min(3, Math.max(0.5, Math.max(bw / sw, bh / sh) * dpr));
    const W = Math.round(sw * s);
    const H = Math.round(sh * s);
    if (c.width !== W || c.height !== H) {
      c.width = W;
      c.height = H;
    }
    ctx.clearRect(0, 0, W, H);
    if (e.demo) {
      drawDemoBackground(ctx, W, H, face);
      if (f.face) drawCartoonFace(ctx, W, H, f.face.blend, warn);
      if (f.pose) drawDemoFigure(ctx, f.pose, W, H);
    } else if (f.face) {
      drawFace(ctx, f.face.landmarks, W, H, { warn, lips: e.detector?.lips, oval: e.detector?.oval });
    }
    if (f.pose) drawPose(ctx, f.pose, W, H, { bad, t: now });
  };

  // -------------------------------------------------------------------------
  // Asosiy sikl: kadr → MediaPipe → silliqlash → tahlil → HUD va chizish
  // -------------------------------------------------------------------------

  /** now — requestAnimationFrame vaqt belgisi (performance.now() bilan bir xil soat) */
  const tick = (now: number) => {
    const e = engRef.current;
    if (!e) return;
    e.raf = requestAnimationFrame(tick);
    const an = e.analyzer;
    if (!an) return;

    let f: FrameInput;
    if (e.demo) {
      if (!e.synth) return;
      f = e.synth.frame(now - e.demoAt, now);
    } else {
      const v = videoRef.current;
      const det = e.detector;
      if (!v || !det || v.readyState < 2 || !v.videoWidth) return;
      if (v.currentTime === e.lastVideoTime) return; // yangi kadr yo‘q
      e.lastVideoTime = v.currentTime;
      if (v.videoWidth !== e.src.w || v.videoHeight !== e.src.h) {
        // telefon burilganda kadr o‘lchami o‘zgaradi
        e.src = { w: v.videoWidth, h: v.videoHeight };
        setAspect(v.videoWidth / v.videoHeight);
      }
      let r: DetectResult;
      try {
        r = det.detect(v, now);
        e.errors = 0;
      } catch {
        if (++e.errors >= 5) void recover();
        return;
      }
      f = {
        t: now,
        aspect: v.videoWidth / v.videoHeight,
        pose: e.smooth.pose.smooth(r.pose, now),
        world: e.smooth.world.smooth(r.world, now),
        face: r.face ? { landmarks: e.smooth.face.smooth(r.face.landmarks, now) ?? r.face.landmarks, blend: r.face.blend } : null,
      };
    }

    e.fpsN++;
    if (now - e.fpsAt >= 1000) {
      setFps(Math.round((e.fpsN * 1000) / (now - e.fpsAt)));
      e.fpsN = 0;
      e.fpsAt = now;
    }

    let bad: number[] = [];
    let warn = false;
    if (e.stage === "position") {
      const vis = an.visibility(f);
      if (vis.ok) e.visibleSince ||= now;
      else e.visibleSince = 0;
      if (now - e.lastPos > 200 || vis.ok !== e.posOk) {
        e.lastPos = now;
        e.posOk = vis.ok;
        setPos({ ok: vis.ok, reason: vis.reason });
      }
      if (e.visibleSince && now - e.visibleSince >= POSITION_HOLD_MS) beginCountdown();
    } else if (e.stage === "countdown") {
      an.calibrate(f);
      // kadr vaqt belgisi tugma bosilgan paytdan biroz oldin bo‘lishi mumkin
      const el = Math.max(0, now - e.countdownAt);
      const left = Math.max(1, 3 - Math.floor(el / 1000));
      if (left !== e.lastCount) {
        e.lastCount = left;
        setCount(left);
        sfx(660, 110);
      }
      if (el >= COUNTDOWN_MS) {
        an.start(now);
        e.liveAt = now;
        go("live");
        sfx(990, 200);
        haptic("medium");
      }
    } else if (e.stage === "live") {
      const s = an.update(f);
      bad = s.bad;
      warn = s.warn;
      if (s.repFlash !== e.lastFlash) {
        e.lastFlash = s.repFlash;
        sfx(s.lastRepClean ? 880 : 520, 140);
        haptic(s.lastRepClean ? "light" : "warning");
      }
      const p = e.lastLive;
      if (!p || now - e.lastHud > 90 || s.reps !== p.reps || s.holding !== p.holding || s.visible !== p.visible || s.hint.text !== p.hint.text) {
        e.lastHud = now;
        e.lastLive = s;
        setLive(s);
      }
      if (!e.finishing && (s.done || now - e.liveAt > MAX_SESSION_MS)) {
        e.finishing = true;
        if (s.done) {
          sfx(784, 150);
          sfx(988, 150, 0.15);
          sfx(1319, 280, 0.3);
          haptic("success");
        }
        e.finishTimer = window.setTimeout(() => finish(), s.done ? 900 : 0);
      }
    }
    draw(e, f, bad, warn, now);
  };

  const startLoop = () => {
    const e = E();
    if (e.raf) cancelAnimationFrame(e.raf);
    e.raf = requestAnimationFrame(tick);
  };

  const beginCountdown = () => {
    const e = E();
    const now = performance.now();
    e.countdownAt = now;
    if (e.demo) e.demoAt = now;
    e.lastCount = 3;
    setCount(3);
    go("countdown");
    sfx(660, 110);
  };

  const beginPosition = () => {
    const e = E();
    e.analyzer = createAnalyzer(id);
    resetTracking(e);
    e.posOk = false;
    setPos({ ok: false });
    setLive(null);
    go("position");
    startLoop();
  };

  // GPU’da ketma-ket xatolik bo‘lsa — CPU bilan qayta yaratamiz; bo‘lmasa — do‘stona xabar
  const recover = async () => {
    const e = E();
    if (e.recovering) return;
    e.recovering = true;
    stopLoop();
    const run = e.run;
    if (e.detector?.delegate === "GPU") {
      try {
        toast.info("AI qayta sozlanmoqda…", "⚙️");
        const d = await getDetector(meta.kind, undefined, { forceCpu: true });
        e.recovering = false;
        if (run !== e.run) return;
        e.detector = d;
        e.errors = 0;
        startLoop();
        return;
      } catch {
        /* quyida */
      }
    }
    e.recovering = false;
    if (run !== e.run) return;
    fail({
      emoji: "🤖",
      title: "AI tahlilida xatolik",
      text: "Qurilma AI tahlilini bajara olmadi. Sahifani yangilab ko‘ring yoki demo rejimdan foydalaning.",
    });
  };

  // -------------------------------------------------------------------------
  // Foydalanuvchi harakatlari
  // -------------------------------------------------------------------------

  const startCamera = async () => {
    const e = E();
    const run = ++e.run;
    stopLoop();
    clearFinishTimer();
    ensureAudio();
    e.demo = false;
    e.synth = null;
    setDemo(false);
    setFailure(null);
    setSummary(null);
    setSave("idle");
    setLive(null);
    setCamOn(false);
    go("loading");

    const detP = getDetector(meta.kind, (p) => {
      if (run === e.run) setProgress(p);
    });
    detP.catch(() => {}); // xato quyida ko‘rsatiladi

    try {
      const stream = await openCamera();
      if (run !== e.run) {
        stopStream(stream);
        return;
      }
      e.stream = stream;
      const v = videoRef.current;
      if (!v) throw new CameraError("unknown");
      await attachStream(v, stream);
      if (run !== e.run) return;
      e.src = { w: v.videoWidth, h: v.videoHeight };
      setAspect(v.videoWidth / v.videoHeight);
      setCamOn(true);
    } catch (err) {
      if (run !== e.run) return;
      fail(CAMERA_ERRORS[err instanceof CameraError ? err.code : "unknown"]);
      return;
    }

    try {
      const d = await detP;
      if (run !== e.run) return;
      e.detector = d;
    } catch (err) {
      if (run !== e.run) return;
      fail(modelFailure(err));
      return;
    }
    beginPosition();
  };

  const startDemo = () => {
    const e = E();
    e.run++;
    stopLoop();
    clearFinishTimer();
    releaseCamera();
    ensureAudio();
    const narrow = (e.box.w || panelRef.current?.clientWidth || 640) < 560;
    const asp = narrow ? 3 / 4 : 4 / 3;
    e.demo = true;
    e.src = narrow ? { w: 480, h: 640 } : { w: 640, h: 480 };
    e.synth = createSynth(id, asp);
    e.analyzer = createAnalyzer(id);
    resetTracking(e);
    setDemo(true);
    setAspect(asp);
    setFailure(null);
    setSummary(null);
    setSave("idle");
    setLive(null);
    beginCountdown();
    startLoop();
  };

  const restart = () => {
    const e = E();
    clearFinishTimer();
    e.analyzer = createAnalyzer(id);
    if (e.demo) e.synth = createSynth(id, e.src.w / e.src.h);
    resetTracking(e);
    setLive(null);
    beginCountdown();
    if (!e.raf) startLoop();
  };

  const persist = async (s: Summary, isDemo: boolean) => {
    const { child: c, act: doAct, exerciseId: ex } = latest.current;
    if (!isMeaningful(s)) {
      setSave("skipped");
      return;
    }
    if (!c) {
      setSave("nochild");
      return;
    }
    setSave("saving");
    const details: Record<string, string | number | boolean | string[]> = {
      reps: s.reps,
      target: s.target,
      holdSec: s.holdSec,
      errors: errorsForDetails(s),
      accuracy: s.accuracy,
      stars: starsFor(s),
      mode: s.mode,
    };
    if (s.stability !== undefined) details.stability = s.stability;
    if (isDemo) details.demo = true;
    if (ex) details.exerciseId = ex;
    try {
      const r = await doAct(
        {
          type: "activity.log",
          childId: c.id,
          kind: "ai_check",
          refId: id,
          title: info.title,
          domain: info.domain,
          score: s.accuracy,
          durationSec: s.durationSec,
          details,
        },
        { rewardTitle: "AI tekshiruv saqlandi!" },
      );
      if (r.ok) setSave("saved");
      else {
        setSave("error");
        toast.error(r.error ?? "Natijani saqlab bo‘lmadi");
      }
    } catch {
      setSave("error");
      toast.error("Natijani saqlab bo‘lmadi — internet aloqasini tekshiring");
    }
  };

  const finish = () => {
    const e = E();
    clearFinishTimer();
    if (e.stage === "result" || e.stage === "intro") return;
    const an = e.analyzer;
    const wasLive = e.stage === "live";
    e.run++;
    stopLoop();
    releaseCamera();
    exitFullscreen();
    e.analyzer = null;
    setLive(null);
    if (!wasLive || !an) {
      go("intro");
      return;
    }
    const s = an.summary(performance.now());
    setSummary(s);
    setRecs(recommendNext(id, s, latest.current.activities));
    go("result");
    void persist(s, e.demo);
  };

  const giveConsent = async () => {
    setConsentBusy(true);
    try {
      const r = await act({ type: "user.consents", consents: { videoAnalysis: true } }, { silent: true });
      if (!r.ok) toast.error("Rozilikni saqlab bo‘lmadi");
    } catch {
      toast.error("Rozilikni saqlab bo‘lmadi");
    } finally {
      setConsentBusy(false);
    }
  };

  const toggleSound = () => {
    const v = !sound;
    setSound(v);
    E().sound = v;
    try {
      localStorage.setItem(SOUND_KEY, v ? "1" : "0");
    } catch {
      /* e’tiborsiz */
    }
    if (v) {
      ensureAudio();
      sfx(880, 90);
    }
  };

  const toggleFullscreen = () => {
    if (fsElement()) {
      exitFullscreen();
      return;
    }
    const el = panelRef.current as FsEl | null;
    try {
      if (el?.requestFullscreen) void el.requestFullscreen().catch(() => {});
      else el?.webkitRequestFullscreen?.();
    } catch {
      /* e’tiborsiz */
    }
  };

  const running = stage === "loading" || stage === "position" || stage === "countdown" || stage === "live";
  const stars = summary ? starsFor(summary) : 0;

  return (
    <div className="space-y-4">
      {stage === "intro" && (
        <IntroPanel
          id={id}
          cameraIssue={cameraIssue}
          consent={consent}
          consentBusy={consentBusy}
          onConsent={giveConsent}
          onCamera={startCamera}
          onDemo={startDemo}
        />
      )}

      {stage === "error" && failure && <ErrorPanel failure={failure} onRetry={startCamera} onDemo={startDemo} onBack={() => go("intro")} />}

      {stage === "result" && summary && (
        <ResultCard
          summary={summary}
          stars={stars}
          demo={demo}
          save={save}
          childName={child?.name}
          recs={recs}
          exercise={exercise}
          onRetry={demo ? startDemo : startCamera}
          onRetrySave={() => void persist(summary, demo)}
        />
      )}

      {/* Kamera sahnasi doim DOM’da (ref’lar barqaror bo‘lishi uchun), kerak bo‘lmaganda yashiriladi */}
      <div
        ref={panelRef}
        className={cn(
          "space-y-3 [&:fullscreen]:flex [&:fullscreen]:flex-col [&:fullscreen]:justify-center [&:fullscreen]:bg-slate-950 [&:fullscreen]:p-4",
          !running && "hidden",
        )}
      >
        <div
          ref={boxRef}
          className={cn(
            "@container relative mx-auto overflow-hidden bg-slate-900",
            face ? "rounded-[40px] shadow-pop outline outline-4 outline-offset-[6px] outline-brand-300 ring-[6px] ring-white" : "rounded-3xl shadow-pop ring-1 ring-black/5",
          )}
          style={{
            aspectRatio: String(aspect),
            width: isFs ? `min(100%, calc((100dvh - 120px) * ${aspect}))` : `min(100%, calc(72dvh * ${aspect}))`,
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            aria-label="Kamera tasviri"
            className={cn("absolute inset-0 h-full w-full -scale-x-100 object-cover", demo && "invisible")}
          />
          <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />

          {stage === "loading" && <LoadingOverlay camOn={camOn} progress={progress} />}
          {stage === "position" && <PositionOverlay ok={pos.ok} reason={pos.reason} meta={meta} onStart={beginCountdown} />}
          {stage === "countdown" && <CountdownOverlay count={count} meta={meta} />}
          {stage === "live" && live && <Hud live={live} fps={fps} demo={demo} />}
          {demo && stage === "countdown" && (
            <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-warn px-3 py-1 text-xs font-black text-ink shadow">
              DEMO — kamerasiz namoyish
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {stage === "live" ? (
            <>
              <Button size="lg" variant="dark" onClick={finish}>
                🏁 Yakunlash
              </Button>
              <Button size="lg" variant="secondary" onClick={restart}>
                🔁 Qayta boshlash
              </Button>
            </>
          ) : (
            <Button size="lg" variant="secondary" onClick={finish}>
              ✖️ Bekor qilish
            </Button>
          )}
          <Button size="icon" variant="secondary" className="h-14 w-14 rounded-2xl" onClick={toggleSound} aria-label={sound ? "Ovozni o‘chirish" : "Ovozni yoqish"}>
            {sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          {canFs && (
            <Button size="icon" variant="secondary" className="h-14 w-14 rounded-2xl" onClick={toggleFullscreen} aria-label={isFs ? "Kichik ekran" : "Katta ekran"}>
              {isFs ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
          )}
        </div>
        {!isFs && (stage === "position" || stage === "live") && !demo && (
          <p className="text-center text-xs font-semibold text-muted">🔒 Video qurilmangizda tahlil qilinadi va hech qayerga yuborilmaydi</p>
        )}
      </div>
    </div>
  );
}
