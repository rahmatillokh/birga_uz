/**
 * Mikrofon/kamera, Web Audio tahlili va MediaRecorder bilan ishlash.
 * Barcha funksiyalar faqat brauzerda (hodisa ishlovchilari ichida) chaqiriladi.
 */

export type DeviceKind = "mic" | "camera";
export type DeviceErrorCode = "insecure" | "unsupported" | "denied" | "notfound" | "busy" | "unknown";

export interface DeviceFailure {
  code: DeviceErrorCode;
  title: string;
  text: string;
}

export class DeviceError extends Error {
  code: DeviceErrorCode;
  constructor(code: DeviceErrorCode) {
    super(code);
    this.code = code;
  }
}

function errorCode(err: unknown): DeviceErrorCode {
  if (err instanceof DeviceError) return err.code;
  const name = (err as { name?: string } | null)?.name ?? "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") return "notfound";
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") return "busy";
  return "unknown";
}

export function describeDeviceError(err: unknown, device: DeviceKind): DeviceFailure {
  const code = errorCode(err);
  const mic = device === "mic";
  const name = mic ? "Mikrofon" : "Kamera";
  const acc = mic ? "mikrofonga" : "kameraga";
  switch (code) {
    case "insecure":
      return { code, title: "Xavfsiz ulanish kerak", text: `${name} faqat https orqali ochilgan sahifada ishlaydi.` };
    case "unsupported":
      return { code, title: `${name} qo‘llab-quvvatlanmaydi`, text: "Sahifani Chrome yoki Safari brauzerining yangi versiyasida oching." };
    case "denied":
      return {
        code,
        title: `${name}ga ruxsat berilmadi`,
        text: `Manzil satridagi 🔒 belgisini bosib, ${acc} ruxsat bering. Telegram’da: telefon sozlamalarida Telegram ilovasiga ${acc} ruxsat bering.`,
      };
    case "notfound":
      return { code, title: `${name} topilmadi`, text: `Qurilmada ${mic ? "mikrofon" : "kamera"} ulanganini tekshiring.` };
    case "busy":
      return { code, title: `${name} band`, text: `${name}ni boshqa ilova ishlatayotgan bo‘lishi mumkin. Uni yopib, qayta urinib ko‘ring.` };
    default:
      return { code, title: `${name}ni yoqib bo‘lmadi`, text: "Sahifani yangilab, qayta urinib ko‘ring." };
  }
}

async function getMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (typeof window === "undefined") throw new DeviceError("unsupported");
  if (!window.isSecureContext) throw new DeviceError("insecure");
  if (!navigator.mediaDevices?.getUserMedia) throw new DeviceError("unsupported");
  return navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Mikrofon. `raw` — shovqinni bostirish va avtomatik kuchaytirishsiz:
 * puflash va ovoz balandligi o‘yinlari uchun shart (aks holda brauzer ularni «tekislab» yuboradi).
 */
export async function requestMic(raw = false): Promise<MediaStream> {
  if (!raw) return getMedia({ audio: true });
  try {
    return await getMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  } catch (e) {
    if (errorCode(e) === "notfound") return getMedia({ audio: true });
    throw e;
  }
}

export function requestCamera(): Promise<MediaStream> {
  return getMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } }, audio: false });
}

export function stopStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((t) => {
    try {
      t.stop();
    } catch {
      /* ignore */
    }
  });
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

// ---------------------------------------------------------------------------
// Web Audio: ovoz darajasi
// ---------------------------------------------------------------------------

/** Foydalanuvchi bosgan zahoti (sinxron) yaratilishi kerak — iOS talabi */
export function newAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

export interface MicAnalyser {
  /** To‘liq signal RMS (0..1) */
  rms(): number;
  /** Past chastotali (~300 Hz gacha) signal RMS — puflash (shamol shovqini) shu yerda kuchli */
  lowRms(): number;
  /** To‘liq signal darajasi, dBFS (−100..0) */
  db(): number;
  close(): void;
}

export function createMicAnalyser(ctx: AudioContext, stream: MediaStream): MicAnalyser {
  const source = ctx.createMediaStreamSource(stream);
  const full = ctx.createAnalyser();
  full.fftSize = 1024;
  full.smoothingTimeConstant = 0.2;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 300;
  lowpass.Q.value = 0.7;
  const low = ctx.createAnalyser();
  low.fftSize = 1024;
  // Ba’zi Safari versiyalarida tugun "destination"ga ulanmasa ma’lumot bermaydi — ovozsiz ulaymiz
  const mute = ctx.createGain();
  mute.gain.value = 0;
  source.connect(full);
  source.connect(lowpass);
  lowpass.connect(low);
  full.connect(mute);
  low.connect(mute);
  mute.connect(ctx.destination);

  const floatBuf = new Float32Array(full.fftSize);
  const byteBuf = new Uint8Array(full.fftSize);
  const rmsOf = (an: AnalyserNode): number => {
    let sum = 0;
    if (typeof an.getFloatTimeDomainData === "function") {
      an.getFloatTimeDomainData(floatBuf);
      for (let i = 0; i < floatBuf.length; i++) sum += floatBuf[i] * floatBuf[i];
      return Math.sqrt(sum / floatBuf.length);
    }
    an.getByteTimeDomainData(byteBuf);
    for (let i = 0; i < byteBuf.length; i++) {
      const v = (byteBuf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / byteBuf.length);
  };

  let closed = false;
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return {
    rms: () => (closed ? 0 : rmsOf(full)),
    lowRms: () => (closed ? 0 : rmsOf(low)),
    db: () => {
      const r = closed ? 0 : rmsOf(full);
      return r > 0 ? Math.max(-100, 20 * Math.log10(r)) : -100;
    },
    close: () => {
      if (closed) return;
      closed = true;
      try {
        source.disconnect();
        lowpass.disconnect();
        full.disconnect();
        low.disconnect();
        mute.disconnect();
      } catch {
        /* ignore */
      }
      void ctx.close().catch(() => {});
    },
  };
}

// ---------------------------------------------------------------------------
// MediaRecorder: ovozni yozib olish (ota-ona tinglab baholashi uchun)
// ---------------------------------------------------------------------------

export function recorderSupported(): boolean {
  return typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined";
}

function pickMime(): string | undefined {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  for (const t of types) {
    try {
      if (MediaRecorder.isTypeSupported?.(t)) return t;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

export interface Recording {
  stop(): Promise<Blob | null>;
  cancel(): void;
}

export function startRecording(stream: MediaStream): Recording | null {
  if (!recorderSupported()) return null;
  let rec: MediaRecorder;
  const mime = pickMime();
  try {
    rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  } catch {
    try {
      rec = new MediaRecorder(stream);
    } catch {
      return null;
    }
  }
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };
  try {
    rec.start();
  } catch {
    return null;
  }
  const toBlob = () => (chunks.length ? new Blob(chunks, { type: rec.mimeType || chunks[0].type || mime || "audio/webm" }) : null);
  return {
    stop: () =>
      new Promise<Blob | null>((resolve) => {
        if (rec.state === "inactive") {
          resolve(toBlob());
          return;
        }
        rec.onstop = () => resolve(toBlob());
        try {
          rec.stop();
        } catch {
          resolve(toBlob());
        }
      }),
    cancel: () => {
      rec.ondataavailable = null;
      rec.onstop = null;
      try {
        if (rec.state !== "inactive") rec.stop();
      } catch {
        /* ignore */
      }
    },
  };
}
