"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useChildData } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { toast } from "@/lib/client/toast";
import type { Action } from "@/lib/types";
import {
  createMicAnalyser,
  describeDeviceError,
  isMobileDevice,
  newAudioContext,
  recorderSupported,
  requestCamera,
  requestMic,
  stopStream,
  type DeviceFailure,
  type MicAnalyser,
} from "./audio";
import { speechPrefsSnapshot, subscribeSpeechPrefs } from "./prefs";
import { findUzbekVoiceURI, isRecognitionSupported } from "./recognition";

const noopSubscribe = () => () => {};

// ---------------------------------------------------------------------------
// Brauzer imkoniyatlari (SSR’da — xavfsiz standart qiymat)
// ---------------------------------------------------------------------------

export function useRecognitionSupported(): boolean {
  return useSyncExternalStore(noopSubscribe, isRecognitionSupported, () => false);
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(noopSubscribe, isMobileDevice, () => false);
}

export function useRecorderSupported(): boolean {
  return useSyncExternalStore(noopSubscribe, recorderSupported, () => false);
}

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

function subscribeVoices(cb: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  const synth = window.speechSynthesis;
  synth.addEventListener?.("voiceschanged", cb);
  return () => synth.removeEventListener?.("voiceschanged", cb);
}

/** Qurilmada o‘zbekcha TTS ovozi bo‘lsa — uning voiceURI’si, aks holda "" */
export function useUzbekVoice(): string {
  return useSyncExternalStore(subscribeVoices, findUzbekVoiceURI, () => "");
}

export function useSpeechPrefs(): { preferManual: boolean; aiBroken: boolean } {
  const snap = useSyncExternalStore(subscribeSpeechPrefs, speechPrefsSnapshot, () => "00");
  return { preferManual: snap[0] === "1", aiBroken: snap[1] === "1" };
}

// ---------------------------------------------------------------------------
// requestAnimationFrame sikli
// ---------------------------------------------------------------------------

/** `active` bo‘lganda har kadrda `cb(dt)` chaqiriladi (dt — soniyada, ≤ 0.1) */
export function useRafLoop(active: boolean, cb: (dt: number) => void) {
  const cbRef = useRef(cb);
  useEffect(() => {
    cbRef.current = cb;
  });
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      cbRef.current(dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

// ---------------------------------------------------------------------------
// Mikrofon + tahlilchi
// ---------------------------------------------------------------------------

export type DeviceStatus = "idle" | "requesting" | "ready" | "error";

/**
 * Mikrofonni boshqarish: `start()` — faqat tugma bosilganda chaqiring (AudioContext
 * sinxron yaratiladi). Komponent yopilganda oqim va AudioContext avtomatik to‘xtatiladi.
 */
export function useMic(opts: { raw?: boolean } = {}) {
  const raw = !!opts.raw;
  const [status, setStatus] = useState<DeviceStatus>("idle");
  const [error, setError] = useState<DeviceFailure | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<MicAnalyser | null>(null);
  const pendingRef = useRef<Promise<boolean> | null>(null);
  const aliveRef = useRef(true);

  const release = useCallback(() => {
    analyserRef.current?.close();
    analyserRef.current = null;
    stopStream(streamRef.current);
    streamRef.current = null;
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      release();
    };
  }, [release]);

  const start = useCallback((): Promise<boolean> => {
    if (streamRef.current?.active) return Promise.resolve(true);
    if (pendingRef.current) return pendingRef.current;
    const ctx = newAudioContext();
    setStatus("requesting");
    setError(null);
    const p = (async () => {
      try {
        const stream = await requestMic(raw);
        if (!aliveRef.current) {
          stopStream(stream);
          void ctx?.close().catch(() => {});
          return false;
        }
        release();
        streamRef.current = stream;
        if (ctx) {
          analyserRef.current = createMicAnalyser(ctx, stream);
          await ctx.resume().catch(() => {});
        }
        stream.getAudioTracks()[0]?.addEventListener("ended", () => {
          if (streamRef.current !== stream || !aliveRef.current) return;
          release();
          setStatus("idle");
        });
        setStatus("ready");
        return true;
      } catch (e) {
        void ctx?.close().catch(() => {});
        if (aliveRef.current) {
          setError(describeDeviceError(e, "mic"));
          setStatus("error");
        }
        return false;
      } finally {
        pendingRef.current = null;
      }
    })();
    pendingRef.current = p;
    return p;
  }, [raw, release]);

  const stop = useCallback(() => {
    release();
    setStatus((s) => (s === "error" ? s : "idle"));
  }, [release]);

  return { status, error, start, stop, streamRef, analyserRef };
}

// ---------------------------------------------------------------------------
// Old kamera (ko‘zgu)
// ---------------------------------------------------------------------------

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const aliveRef = useRef(true);
  const [status, setStatus] = useState<DeviceStatus>("idle");
  const [error, setError] = useState<DeviceFailure | null>(null);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current?.active) return true;
    setStatus("requesting");
    setError(null);
    try {
      const stream = await requestCamera();
      if (!aliveRef.current) {
        stopStream(stream);
        return false;
      }
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play().catch(() => {});
      }
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (streamRef.current !== stream || !aliveRef.current) return;
        streamRef.current = null;
        setStatus("idle");
      });
      setStatus("ready");
      return true;
    } catch (e) {
      if (aliveRef.current) {
        setError(describeDeviceError(e, "camera"));
        setStatus("error");
      }
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }, []);

  return { videoRef, status, error, start, stop };
}

// ---------------------------------------------------------------------------
// Natijani bir marta saqlash
// ---------------------------------------------------------------------------

export type SaveState = "idle" | "saving" | "saved" | "error";
export type ActivityInput = Omit<Extract<Action, { type: "activity.log" }>, "type" | "childId">;

export function useActivitySaver() {
  const act = useApp((s) => s.act);
  const { child } = useChildData();
  const [state, setState] = useState<SaveState>("idle");
  const lockRef = useRef(false);
  const lastRef = useRef<{ input: ActivityInput; rewardTitle: string } | null>(null);

  const save = useCallback(
    async (input: ActivityInput, rewardTitle: string) => {
      if (lockRef.current) return;
      lastRef.current = { input, rewardTitle };
      if (!child) {
        setState("error");
        toast.error("Natijani saqlash uchun bola profilini tanlang");
        return;
      }
      lockRef.current = true;
      setState("saving");
      try {
        const res = await act({ type: "activity.log", childId: child.id, ...input }, { rewardTitle });
        if (!res.ok) throw new Error(res.error);
        setState("saved");
      } catch {
        lockRef.current = false;
        setState("error");
        toast.error("Natijani saqlab bo‘lmadi. Qayta urinib ko‘ring");
      }
    },
    [act, child],
  );

  const retry = useCallback(() => {
    const last = lastRef.current;
    if (last) void save(last.input, last.rewardTitle);
  }, [save]);

  const reset = useCallback(() => {
    lockRef.current = false;
    lastRef.current = null;
    setState("idle");
  }, []);

  return { state, save, retry, reset };
}
