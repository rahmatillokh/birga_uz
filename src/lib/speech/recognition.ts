/**
 * Web Speech API (SpeechRecognition) ustidan yupqa qatlam.
 * Chrome/Edge/Safari’da ishlaydi; Telegram WebView va Firefox’da odatda yo‘q —
 * bunday holda chaqiruvchi «ota-ona baholaydi» rejimiga o‘tadi.
 */

export type RecognitionError =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-allowed"
  | "language-not-supported"
  | "unsupported"
  | "timeout"
  | "unknown";

export interface Alternative {
  transcript: string;
  confidence: number;
}

export type ListenOutcome = { ok: true; alternatives: Alternative[] } | { ok: false; error: RecognitionError };

export interface ListenHandle {
  result: Promise<ListenOutcome>;
  /** Tinglashni tugatib, natijani olish */
  stop(): void;
  /** Bekor qilish (natijasiz) */
  abort(): void;
}

// Brauzer turlari standart lib.dom’da to‘liq yo‘q — kerakli qismini o‘zimiz yozamiz
interface SRAlternativeLike {
  readonly transcript: string;
  readonly confidence: number;
}
interface SRResultLike {
  readonly length: number;
  readonly isFinal: boolean;
  readonly [index: number]: SRAlternativeLike;
}
interface SRResultListLike {
  readonly length: number;
  readonly [index: number]: SRResultLike;
}
interface SRResultEventLike {
  readonly results: SRResultListLike;
}
interface SRErrorEventLike {
  readonly error: string;
}
interface SRInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SRResultEventLike) => void) | null;
  onerror: ((e: SRErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onnomatch: (() => void) | null;
  onspeechstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SRConstructor = new () => SRInstance;

export function getRecognitionCtor(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isRecognitionSupported(): boolean {
  return !!getRecognitionCtor();
}

const KNOWN: RecognitionError[] = [
  "no-speech",
  "aborted",
  "audio-capture",
  "network",
  "not-allowed",
  "service-not-allowed",
  "language-not-supported",
];

function mapError(code: string): RecognitionError {
  return (KNOWN as string[]).includes(code) ? (code as RecognitionError) : "unknown";
}

/** Bu xatolardan keyin AI rejimi shu qurilmada ishlamaydi deb hisoblaymiz */
export function isFatalRecognitionError(e: RecognitionError): boolean {
  return e !== "no-speech" && e !== "aborted";
}

const failed = (error: RecognitionError): ListenHandle => ({
  result: Promise.resolve({ ok: false, error }),
  stop() {},
  abort() {},
});

/**
 * Bitta so‘zni tinglash. `maxMs` dan keyin avtomatik to‘xtaydi;
 * brauzer umuman javob bermasa (ba’zi WebView’lar) — "timeout".
 */
export function listen(
  opts: {
    lang?: string;
    maxAlternatives?: number;
    maxMs?: number;
    onInterim?: (text: string) => void;
    onSpeech?: () => void;
  } = {},
): ListenHandle {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return failed("unsupported");
  let rec: SRInstance;
  try {
    rec = new Ctor();
    rec.lang = opts.lang ?? "uz-UZ";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = opts.maxAlternatives ?? 5;
  } catch {
    return failed("unsupported");
  }

  let finals: Alternative[] = [];
  let interim = "";
  let error: RecognitionError | null = null;
  let settled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  let resolveOutcome: (o: ListenOutcome) => void = () => {};
  const result = new Promise<ListenOutcome>((r) => {
    resolveOutcome = r;
  });

  const settle = (o: ListenOutcome) => {
    if (settled) return;
    settled = true;
    timers.forEach(clearTimeout);
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    rec.onnomatch = null;
    rec.onspeechstart = null;
    resolveOutcome(o);
  };

  const finish = () => {
    if (finals.length) settle({ ok: true, alternatives: finals });
    else if (interim.trim() && error !== "aborted") settle({ ok: true, alternatives: [{ transcript: interim.trim(), confidence: 0 }] });
    else settle({ ok: false, error: error ?? "no-speech" });
  };

  rec.onresult = (e) => {
    const finalResults: SRResultLike[] = [];
    let live = "";
    for (let i = 0; i < e.results.length; i++) {
      const r = e.results[i];
      if (!r || !r.length) continue;
      live += (live ? " " : "") + r[0].transcript.trim();
      if (r.isFinal) finalResults.push(r);
    }
    interim = live;
    opts.onInterim?.(live);
    if (finalResults.length) {
      const alts: Alternative[] = [];
      if (finalResults.length > 1) {
        alts.push({ transcript: finalResults.map((r) => r[0].transcript.trim()).join(" "), confidence: finalResults[0][0].confidence });
      }
      for (const r of finalResults) {
        for (let j = 0; j < r.length; j++) alts.push({ transcript: r[j].transcript, confidence: r[j].confidence });
      }
      finals = alts;
    }
  };
  rec.onspeechstart = () => opts.onSpeech?.();
  rec.onnomatch = () => {
    if (!error) error = "no-speech";
  };
  rec.onerror = (e) => {
    error = mapError(e.error);
  };
  rec.onend = () => finish();

  try {
    rec.start();
  } catch {
    return failed("unknown");
  }

  const maxMs = opts.maxMs ?? 7000;
  timers.push(
    setTimeout(() => {
      try {
        rec.stop();
      } catch {
        finish();
      }
    }, maxMs),
  );
  // Xavfsizlik: ba’zi WebView’larda "end" hodisasi umuman kelmaydi
  timers.push(
    setTimeout(() => {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      if (finals.length || interim.trim()) finish();
      else settle({ ok: false, error: error && error !== "no-speech" ? error : "timeout" });
    }, maxMs + 5000),
  );

  return {
    result,
    stop: () => {
      try {
        rec.stop();
      } catch {
        finish();
      }
    },
    abort: () => {
      error = "aborted";
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      settle({ ok: false, error: "aborted" });
    },
  };
}

// ---------------------------------------------------------------------------
// Namuna talaffuz (faqat qurilmada o‘zbekcha ovoz bo‘lsa)
// ---------------------------------------------------------------------------

export function findUzbekVoiceURI(): string {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return "";
  try {
    const v = window.speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith("uz"));
    return v?.voiceURI ?? "";
  } catch {
    return "";
  }
}

export function speakWord(text: string, voiceURI: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const synth = window.speechSynthesis;
    const voice = synth.getVoices().find((v) => v.voiceURI === voiceURI);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? "uz-UZ";
    if (voice) u.voice = voice;
    u.rate = 0.8;
    synth.cancel();
    synth.speak(u);
  } catch {
    /* ignore */
  }
}

export function cancelSpeech() {
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
