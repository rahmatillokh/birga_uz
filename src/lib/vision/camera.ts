// Kamerani yoqish/o‘chirish va xatolarni ota-onaga tushunarli qilib tasniflash
export type CameraErrorCode = "insecure" | "unsupported" | "denied" | "notfound" | "busy" | "unknown";

export class CameraError extends Error {
  constructor(
    readonly code: CameraErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "CameraError";
  }
}

export const CAMERA_ERRORS: Record<CameraErrorCode, { emoji: string; title: string; text: string }> = {
  insecure: {
    emoji: "🔒",
    title: "Kamera xavfsiz ulanishda ishlaydi",
    text: "Brauzer kamerani faqat https yoki localhost manzilida ochadi. Ilovani https orqali (yoki Telegram’da) oching.",
  },
  unsupported: {
    emoji: "📵",
    title: "Brauzer kamerani qo‘llab-quvvatlamaydi",
    text: "Chrome yoki Safari’ning yangi versiyasida oching.",
  },
  denied: {
    emoji: "🙈",
    title: "Kameraga ruxsat berilmadi",
    text: "Manzil satridagi 🔒 belgisini bosib, «Kamera — Ruxsat berish»ni tanlang va qayta urinib ko‘ring. Telegram’da: Sozlamalar → Maxfiylik → Kamera.",
  },
  notfound: {
    emoji: "📷",
    title: "Kamera topilmadi",
    text: "Qurilmada kamera borligini va u ulanganini tekshiring.",
  },
  busy: {
    emoji: "⏳",
    title: "Kamera band",
    text: "Kamera boshqa ilova (Zoom, Telegram qo‘ng‘irog‘i va h.k.) tomonidan ishlatilmoqda. Uni yoping va qayta urinib ko‘ring.",
  },
  unknown: {
    emoji: "😕",
    title: "Kamerani yoqib bo‘lmadi",
    text: "Sahifani yangilab, qayta urinib ko‘ring.",
  },
};

/** Oldindan tekshiruv: kamera umuman mavjud bo‘lishi mumkinmi */
export function cameraSupport(): CameraErrorCode | null {
  if (typeof window === "undefined") return "unsupported";
  if (!window.isSecureContext) return "insecure";
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  return null;
}

function classify(e: unknown): CameraErrorCode {
  const name = (e as { name?: string } | null)?.name ?? "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "notfound";
  if (name === "NotReadableError" || name === "TrackStartError") return "busy";
  return "unknown";
}

/** Old (selfi) kamerani ochish. Talablar bajarilmasa — soddaroq talablar bilan qayta urinadi. */
export async function openCamera(): Promise<MediaStream> {
  const pre = cameraSupport();
  if (pre) throw new CameraError(pre);
  const tries: MediaStreamConstraints[] = [
    { audio: false, video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } },
    { audio: false, video: { facingMode: "user" } },
    { audio: false, video: true },
  ];
  let last: unknown = null;
  for (const c of tries) {
    try {
      return await navigator.mediaDevices.getUserMedia(c);
    } catch (e) {
      last = e;
      const code = classify(e);
      if (code === "denied" || code === "notfound") throw new CameraError(code);
    }
  }
  throw new CameraError(classify(last));
}

export function stopStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((t) => {
    try {
      t.stop();
    } catch {
      /* allaqachon to‘xtagan */
    }
  });
}

/** Oqimni <video> ga ulab, birinchi kadr kelguncha kutish */
export async function attachStream(video: HTMLVideoElement, stream: MediaStream, timeoutMs = 8000): Promise<void> {
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.srcObject = stream;
  video.play().catch(() => {
    /* autoplay siyosati — quyida qayta uriniladi */
  });
  const t0 = performance.now();
  while (!(video.videoWidth > 0 && video.readyState >= 2)) {
    if (performance.now() - t0 > timeoutMs) throw new CameraError("unknown", "Video oqimi boshlanmadi");
    await new Promise((r) => setTimeout(r, 60));
    if (video.paused) video.play().catch(() => {});
  }
}
