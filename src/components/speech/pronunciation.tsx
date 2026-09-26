"use client";

import { ArrowRight, ChevronRight, Play, RotateCcw, SkipForward, Volume2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmojiTile, EmptyState, InfoNote, PageHeader } from "@/components/ui/misc";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { SPEECH_SOUNDS } from "@/data/speech";
import { useView } from "@/lib/client/hooks";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import { DOMAINS, scoreLevel } from "@/lib/constants";
import { startRecording, type Recording } from "@/lib/speech/audio";
import {
  useActivitySaver,
  useIsMobile,
  useMic,
  useOnline,
  useRecognitionSupported,
  useRecorderSupported,
  useSpeechPrefs,
  useUzbekVoice,
} from "@/lib/speech/hooks";
import { setAiBroken, setPreferManual } from "@/lib/speech/prefs";
import { cancelSpeech, isFatalRecognitionError, listen, speakWord, type ListenHandle } from "@/lib/speech/recognition";
import { feedbackFor, pickWords, POSITION_LABEL, scoreAttempt, starsFor, type Feedback, type SpeechWord } from "@/lib/speech/text";
import type { SpeechSound } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DeviceErrorNote, HighlightedWord, PermissionNote, ResultHero, Stars } from "./bits";
import { LevelMeter } from "./level-meter";
import { MicButton } from "./mic-button";

type Mode = "ai" | "manual";
type ManualReason = "consent" | "unsupported" | "offline" | "failed" | "user";
type Via = "ai" | "ota-ona";
type ListenState = "idle" | "listening" | "recording" | "recorded";

interface WordResult {
  word: SpeechWord;
  score: number | null;
  heard: string;
  via: Via | null;
  attempts: number;
}

interface Attempt {
  score: number;
  heard: string;
  via: Via;
  fb: Feedback;
}

const RATINGS = [
  { score: 100, label: "To‘g‘ri", emoji: "✅", cls: "bg-good/10 text-[#006300] ring-good/25 hover:bg-good/15" },
  { score: 60, label: "Qisman", emoji: "🟡", cls: "bg-warn/15 text-[#8a5a00] ring-warn/30 hover:bg-warn/25" },
  { score: 20, label: "Yana mashq", emoji: "🔁", cls: "bg-brand-50 text-brand-700 ring-brand-100 hover:bg-brand-100" },
] as const;

const MAX_WORDS = 9;

/** /speech/[sound] — tovushni topib, mashqni ko‘rsatadi */
export function PronunciationPage({ soundId }: { soundId: string }) {
  const id = soundId.toLowerCase();
  const sound = SPEECH_SOUNDS.find((s) => s.id.toLowerCase() === id);
  if (!sound || !sound.words.length) {
    return (
      <div>
        <PageHeader title="Talaffuz tekshiruvi" emoji="🎙️" back="/speech" />
        <EmptyState
          emoji="🔤"
          title={sound ? "So‘zlar hali qo‘shilmagan" : "Tovush topilmadi"}
          text={SPEECH_SOUNDS.length ? "Bu tovush uchun mashq hali tayyor emas. Boshqa tovushni tanlang." : "Tovushlar ro‘yxati tez orada qo‘shiladi."}
          action={<Button href="/speech">Nutq bo‘limiga qaytish</Button>}
        />
      </div>
    );
  }
  return <PronunciationSession key={sound.id} sound={sound} />;
}

export function PronunciationSession({ sound }: { sound: SpeechSound }) {
  const consentAudio = useView().user.consents?.audioAnalysis !== false;
  const recSupported = useRecognitionSupported();
  const canRecord = useRecorderSupported();
  const online = useOnline();
  const mobile = useIsMobile();
  const voiceURI = useUzbekVoice();
  const { preferManual, aiBroken } = useSpeechPrefs();
  const mic = useMic();
  const saver = useActivitySaver();

  const aiReady = recSupported && consentAudio && online && !aiBroken;
  const mode: Mode = aiReady && !preferManual ? "ai" : "manual";
  const manualReason: ManualReason | null =
    mode === "ai" ? null : !consentAudio ? "consent" : !recSupported ? "unsupported" : !online ? "offline" : aiBroken ? "failed" : "user";

  const [phase, setPhase] = useState<"intro" | "practice" | "summary">("intro");
  const [words, setWords] = useState<SpeechWord[]>([]);
  const [results, setResults] = useState<WordResult[]>([]);
  const [index, setIndex] = useState(0);
  const [listenState, setListenState] = useState<ListenState>("idle");
  const [interim, setInterim] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [recUrl, setRecUrl] = useState<string | null>(null);
  const [meterOn, setMeterOn] = useState(false);

  const handleRef = useRef<ListenHandle | null>(null);
  const recordingRef = useRef<Recording | null>(null);
  const recTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAtRef = useRef(0);
  const noSpeechRef = useRef(0);
  const aliveRef = useRef(true);

  // Sahifadan chiqilganda: tinglash, yozish va ovozni to‘xtatamiz
  useEffect(() => {
    aliveRef.current = true;
    const handle = handleRef;
    const recording = recordingRef;
    const timer = recTimerRef;
    const url = urlRef;
    return () => {
      aliveRef.current = false;
      handle.current?.abort();
      handle.current = null;
      recording.current?.cancel();
      recording.current = null;
      if (timer.current) clearTimeout(timer.current);
      if (url.current) URL.revokeObjectURL(url.current);
      url.current = null;
      cancelSpeech();
    };
  }, []);

  const current = words[index];
  const isLast = index + 1 >= words.length;

  // ------------------------------------------------------------------ yordamchilar
  function stopActivity() {
    handleRef.current?.abort();
    handleRef.current = null;
    recordingRef.current?.cancel();
    recordingRef.current = null;
    if (recTimerRef.current) clearTimeout(recTimerRef.current);
    recTimerRef.current = null;
    audioRef.current?.pause();
  }

  function resetWordUi() {
    setAttempt(null);
    setInterim("");
    setNotice(null);
    setSpeaking(false);
    setListenState("idle");
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setRecUrl(null);
  }

  function begin() {
    stopActivity();
    const picked = pickWords(sound.words, MAX_WORDS);
    setWords(picked);
    setResults(picked.map((w) => ({ word: w, score: null, heard: "", via: null, attempts: 0 })));
    setIndex(0);
    resetWordUi();
    saver.reset();
    startedAtRef.current = Date.now();
    noSpeechRef.current = 0;
    setPhase("practice");
    // Ota-ona rejimida — yozib olish uchun; AI rejimida kompyuterda — jonli o‘lchagich uchun.
    // Telefonda AI rejimida mikrofonni band qilmaymiz (nutqni tanib olish bilan to‘qnashadi).
    if (mode === "manual" ? canRecord : !mobile) {
      const wantMeter = mode === "ai";
      void mic.start().then((ok) => {
        if (ok && wantMeter && aliveRef.current) setMeterOn(true);
      });
    }
  }

  function applyScore(score: number, heard: string, soundOk: boolean, via: Via, override = false) {
    const w = words[index];
    if (!w) return;
    const fb = feedbackFor(score, soundOk, w.word, sound.sound, w.position);
    setAttempt({ score, heard, via, fb });
    setResults((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const better = override || r.score === null || score >= r.score;
        return {
          ...r,
          attempts: r.attempts + (override ? 0 : 1),
          score: better ? score : r.score,
          heard: better ? heard : r.heard,
          via: better ? via : r.via,
        };
      }),
    );
    haptic(score >= 85 ? "success" : score >= 60 ? "light" : "warning");
  }

  // ------------------------------------------------------------------ AI rejimi
  async function toggleListen() {
    if (handleRef.current) {
      handleRef.current.stop();
      return;
    }
    const w = words[index];
    if (!w) return;
    setAttempt(null);
    setNotice(null);
    setInterim("");
    setSpeaking(false);
    setListenState("listening");
    const h = listen({
      lang: "uz-UZ",
      maxAlternatives: 5,
      maxMs: 6500,
      onInterim: (t) => {
        if (aliveRef.current) setInterim(t);
      },
      onSpeech: () => {
        if (aliveRef.current) setSpeaking(true);
      },
    });
    handleRef.current = h;
    const out = await h.result;
    if (handleRef.current === h) handleRef.current = null;
    if (!aliveRef.current) return;
    setListenState("idle");
    setSpeaking(false);
    if (out.ok) {
      noSpeechRef.current = 0;
      const r = scoreAttempt(w.word, sound.sound, out.alternatives.map((a) => a.transcript));
      applyScore(r.score, r.heard || out.alternatives[0]?.transcript || "", r.soundOk, "ai");
      return;
    }
    if (out.error === "aborted") return;
    if (out.error === "no-speech") {
      noSpeechRef.current += 1;
      setNotice(
        noSpeechRef.current >= 3
          ? "Ovoz eshitilmayapti 🙉 Mikrofonni tekshiring yoki «Ota-ona baholaydi» rejimiga o‘ting."
          : "Hech narsa eshitilmadi 🙉 Mikrofonga yaqinroq kelib, balandroq ayt!",
      );
      return;
    }
    if (out.error === "audio-capture" && meterOn) {
      // Ba’zi qurilmalar mikrofonni bir vaqtda ikki joyga bermaydi — o‘lchagichni o‘chirib, qayta urinamiz
      mic.stop();
      setMeterOn(false);
      setNotice("Mikrofon band edi — tugmani yana bir marta bosing.");
      return;
    }
    if (isFatalRecognitionError(out.error)) {
      setAiBroken(true);
      if (out.error === "not-allowed" || out.error === "service-not-allowed") {
        toast.error("Mikrofon yoki nutq xizmatiga ruxsat berilmadi — endi ota-ona baholaydi", "🎙️");
      } else {
        toast.info("Nutqni avtomatik tanib olish bu qurilmada ishlamadi — endi ota-ona baholaydi", "👂");
      }
    }
  }

  // ------------------------------------------------------------------ Ota-ona rejimi
  async function finishRecording() {
    const rec = recordingRef.current;
    if (!rec) return;
    recordingRef.current = null;
    if (recTimerRef.current) clearTimeout(recTimerRef.current);
    recTimerRef.current = null;
    const blob = await rec.stop();
    if (!aliveRef.current) return;
    if (blob && blob.size > 0) {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setRecUrl(url);
      setListenState("recorded");
    } else {
      setListenState("idle");
      setNotice("Yozuv chiqmadi — qayta urinib ko‘ring.");
    }
  }

  async function toggleRecord() {
    if (recordingRef.current) {
      await finishRecording();
      return;
    }
    setAttempt(null);
    setNotice(null);
    const ok = await mic.start();
    if (!ok || !aliveRef.current) return;
    const stream = mic.streamRef.current;
    const rec = stream ? startRecording(stream) : null;
    if (!rec) {
      setNotice("Yozib olish imkoni yo‘q — bola aytganda tinglab, darhol baholang.");
      return;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setRecUrl(null);
    recordingRef.current = rec;
    setListenState("recording");
    recTimerRef.current = setTimeout(() => void finishRecording(), 5000);
  }

  function playRecording() {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    void a.play().catch(() => toast.error("Yozuvni ijro etib bo‘lmadi"));
  }

  function rate(score: number, label: string) {
    const override = mode === "ai" && attempt?.via === "ai";
    if (recordingRef.current) void finishRecording();
    applyScore(score, label, score >= 60, "ota-ona", override);
    if (!override) setListenState("idle");
  }

  // ------------------------------------------------------------------ Navigatsiya
  function retry() {
    stopActivity();
    resetWordUi();
  }

  function finish(list: WordResult[]) {
    stopActivity();
    mic.stop();
    setMeterOn(false);
    setPhase("summary");
    const done = list.filter((r) => r.score !== null);
    if (!done.length) return;
    const avg = Math.round(done.reduce((s, r) => s + (r.score ?? 0), 0) / done.length);
    const aiCount = done.filter((r) => r.via === "ai").length;
    void saver.save(
      {
        kind: "speech",
        refId: sound.id,
        title: `Talaffuz: «${sound.sound}» tovushi`,
        domain: "nutq",
        score: avg,
        durationSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
        details: {
          words: done.length,
          heard: done.map((r) => r.heard || "—"),
          targets: done.map((r) => r.word.word),
          mode: aiCount >= done.length / 2 ? "ai" : "ota-ona",
        },
      },
      "Talaffuz mashqi saqlandi!",
    );
  }

  function next() {
    stopActivity();
    resetWordUi();
    if (index + 1 < words.length) setIndex(index + 1);
    else finish(results);
  }

  function switchMode(to: "manual" | "ai" | "retry-ai") {
    stopActivity();
    resetWordUi();
    if (to === "manual") setPreferManual(true);
    else if (to === "ai") setPreferManual(false);
    else setAiBroken(false);
  }

  const modeNote = <ModeNote mode={mode} reason={manualReason} onSwitch={switchMode} />;

  // ------------------------------------------------------------------ Kirish
  if (phase === "intro") {
    const count = Math.min(MAX_WORDS, sound.words.length);
    const byPos = (["bosh", "orta", "oxir"] as const).map((p) => ({ p, n: sound.words.filter((w) => w.position === p).length })).filter((x) => x.n);
    return (
      <div className="animate-fade-up">
        <PageHeader back="/speech" emoji="🎙️" title={`«${sound.sound}» tovushi`} subtitle="Talaffuz tekshiruvi" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
          <Card className="overflow-hidden p-0">
            <div className="bg-brand-gradient px-5 pb-6 pt-6 text-white sm:px-6">
              <div className="flex items-center gap-4">
                <div className="grid h-24 w-24 shrink-0 place-items-center rounded-[28px] bg-white/20 text-[56px] font-black leading-none ring-4 ring-white/30">
                  {sound.sound}
                </div>
                <div className="min-w-0">
                  <div className="text-4xl leading-none">{sound.emoji}</div>
                  <div className="mt-2 text-xl font-black leading-tight">«{sound.sound}» tovushini mashq qilamiz</div>
                </div>
              </div>
              {sound.description && <p className="mt-4 text-[15px] leading-relaxed text-white/90">{sound.description}</p>}
            </div>
            <div className="p-5 sm:p-6">
              <div className="text-sm font-bold text-muted">So‘zlar</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sound.words.slice(0, 12).map((w) => (
                  <span key={`${w.word}-${w.position}`} className="inline-flex items-center gap-1.5 rounded-2xl bg-canvas px-3 py-1.5 text-[15px] font-extrabold text-ink ring-1 ring-line">
                    <span aria-hidden>{w.emoji}</span>
                    <HighlightedWord text={w.word} sound={sound.sound} />
                  </span>
                ))}
                {sound.words.length > 12 && <span className="self-center text-sm font-bold text-muted">+{sound.words.length - 12}</span>}
              </div>
              {byPos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {byPos.map((x) => (
                    <Badge key={x.p} tone="gray">
                      {POSITION_LABEL[x.p]} · {x.n}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-3">
            <Card className="p-5">
              {mode === "ai" ? (
                <PermissionNote
                  className="bg-transparent p-0 ring-0"
                  device="mic"
                  purpose="Bola so‘zni aytganda telefon uni tinglaydi va talaffuzni baholaydi. Brauzer so‘raganda «Ruxsat berish»ni bosing."
                  privacy="So‘zni tanib olish brauzerning nutq xizmati orqali bajariladi. Ovoz yozuvlari YuniQo’da saqlanmaydi."
                />
              ) : (
                <PermissionNote
                  className="bg-transparent p-0 ring-0"
                  device="mic"
                  purpose="Bola aytgan so‘zni yozib olamiz — siz tinglab, baholaysiz. Mikrofonsiz ham bo‘ladi: shunchaki tinglab baholang."
                  privacy="Yozuv faqat shu qurilmada, mashq davomida turadi va hech qayerga yuborilmaydi."
                />
              )}
              <div className="mt-4 flex items-center gap-3 border-t border-line pt-4 text-sm leading-snug text-ink-2">
                <span className="text-2xl" aria-hidden>
                  📋
                </span>
                <div>
                  <b className="text-ink">{count} ta so‘z</b> · boshida, o‘rtasida va oxirida · taxminan {Math.max(2, Math.ceil(count * 0.4))} daqiqa
                </div>
              </div>
              <Button size="lg" block className="mt-4" onClick={begin}>
                🎙️ Boshlash
              </Button>
            </Card>
            {modeNote}
            <InfoNote emoji="👨‍👩‍👧">Mashqni bola bilan birga bajaring: avval so‘zni o‘zingiz aniq aytib bering, keyin bola takrorlasin.</InfoNote>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ Yakun
  if (phase === "summary") {
    const done = results.filter((r) => r.score !== null);
    const avg = done.length ? Math.round(done.reduce((s, r) => s + (r.score ?? 0), 0) / done.length) : 0;
    return (
      <div className="animate-fade-up">
        <PageHeader back="/speech" emoji="🏁" title={`«${sound.sound}» tovushi — natija`} subtitle="Talaffuz tekshiruvi yakunlandi" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.15fr]">
          <div className="space-y-4">
            {done.length ? (
              <ResultHero
                score={avg}
                emoji={avg >= 85 ? "🏆" : avg >= 60 ? "💪" : "🌱"}
                title={avg >= 85 ? "Ajoyib natija!" : avg >= 60 ? "Yaxshi, davom etamiz!" : "Har kuni ozgina — albatta chiqadi!"}
                text={`«${sound.sound}» tovushi · ${done.length} ta so‘z`}
                save={saver.state}
                onRetrySave={saver.retry}
              />
            ) : (
              <EmptyState emoji="🙈" title="Hech bir so‘z baholanmadi" text="Mashqni qaytadan boshlab ko‘ring — bu safar albatta chiqadi!" />
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button size="lg" onClick={begin}>
                <RotateCcw className="h-5 w-5" />
                Yana mashq
              </Button>
              <Button size="lg" variant="secondary" href="/speech">
                Boshqa tovush
              </Button>
            </div>
            {done.length > 0 && avg < 60 && (
              <Card href="/specialists?type=logoped" className="flex items-center gap-3 p-4">
                <EmojiTile emoji="👩‍🏫" color={DOMAINS.nutq.soft} size={48} />
                <div className="min-w-0 flex-1 text-sm leading-snug">
                  <div className="font-extrabold text-ink">Logoped bilan maslahatlashing</div>
                  <div className="text-muted">Tovush qo‘yishda mutaxassis yordami tezroq natija beradi.</div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="p-4 sm:p-5">
              <CardTitle>So‘zlar bo‘yicha natija</CardTitle>
              <ul className="divide-y divide-line">
                {results.map((r, i) => (
                  <li key={`${r.word.word}-${i}`} className="flex items-center gap-3 py-2.5">
                    <span className="w-10 shrink-0 text-center text-3xl leading-none" aria-hidden>
                      {r.word.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-black leading-tight text-ink">
                        <HighlightedWord text={r.word.word} sound={sound.sound} />
                      </div>
                      <div className="truncate text-xs font-semibold text-muted">
                        {r.score === null ? "O‘tkazib yuborildi" : r.via === "ai" ? `Eshitildi: «${r.heard || "—"}»` : `Ota-ona bahosi: ${r.heard}`}
                      </div>
                    </div>
                    {r.score !== null ? (
                      <div className="shrink-0 text-right">
                        <div className="text-lg font-black leading-none text-ink">{r.score}</div>
                        <Stars value={starsFor(r.score)} size="sm" className="mt-1 justify-end" />
                      </div>
                    ) : (
                      <span className="shrink-0 text-lg font-black text-faint">—</span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
            {sound.phrases.length > 0 && (
              <Card className="p-4 sm:p-5">
                <CardTitle>🗣️ Bonus: tez aytishlar</CardTitle>
                <ul className="space-y-2">
                  {sound.phrases.map((p) => (
                    <li key={p} className="rounded-2xl bg-canvas px-3.5 py-2.5 text-[15px] font-bold leading-snug text-ink">
                      <HighlightedWord text={p} sound={sound.sound} />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ Mashq
  const listening = listenState === "listening";
  const recording = listenState === "recording";
  const doneCount = results.filter((r) => r.score !== null).length;

  return (
    <div className="animate-fade-up">
      <PageHeader back="/speech" emoji="🎙️" title={`«${sound.sound}» tovushi`} subtitle="Talaffuz tekshiruvi" />
      <div className="mb-4 flex items-center gap-3">
        <span className="tabular shrink-0 text-sm font-black text-ink">
          {index + 1} / {words.length}
        </span>
        <div className="min-w-0 flex-1">
          <ProgressBar value={doneCount} max={words.length} height={10} />
        </div>
        <Button variant="ghost" size="sm" onClick={() => finish(results)}>
          Yakunlash
        </Button>
      </div>

      {current && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* So‘z kartasi */}
          <Card className="flex flex-col items-center justify-center p-6 text-center">
            <Badge tone="brand">{POSITION_LABEL[current.position] ?? "So‘z"}</Badge>
            <div key={`${current.word}-${index}`} className="mt-4 animate-pop text-[104px] leading-none sm:text-[128px]" aria-hidden>
              {current.emoji}
            </div>
            <div className="mt-5 break-words text-[44px] font-black leading-none tracking-tight text-ink sm:text-6xl">
              <HighlightedWord text={current.word} sound={sound.sound} />
            </div>
            {voiceURI ? (
              <Button variant="soft" size="sm" className="mt-4" onClick={() => speakWord(current.word, voiceURI)}>
                <Volume2 className="h-4 w-4" />
                Namunani tinglash
              </Button>
            ) : (
              <p className="mt-4 text-xs font-semibold text-muted">👂 Avval o‘zingiz aytib bering, keyin bola takrorlasin</p>
            )}
            <div className="mt-5 flex flex-wrap justify-center gap-1.5" aria-hidden>
              {results.map((r, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition",
                    i === index ? "scale-125 bg-brand-500 ring-2 ring-brand-200" : r.score !== null ? "bg-brand-300" : "bg-slate-200",
                  )}
                />
              ))}
            </div>
          </Card>

          {/* Boshqaruv */}
          <Card className="flex flex-col items-center p-5 text-center sm:p-6">
            {mode === "ai" ? (
              <>
                <MicButton state={listening ? "listening" : "idle"} onClick={() => void toggleListen()} className="mt-2" />
                <div className="mt-5 min-h-7 text-lg font-black text-ink" aria-live="polite">
                  {listening ? (speaking ? "Eshityapman… 👂" : "Tinglayapman… so‘zni ayt!") : attempt ? "Yana aytib ko‘rasanmi? 🎙️" : "Tugmani bos va so‘zni ayt!"}
                </div>
                <LevelMeter source={mic.analyserRef} active={listening} synthetic={!meterOn} lively={speaking} className="mt-1" />
                <div className="min-h-6 text-base font-bold text-brand-700">{listening && interim ? `«${interim}»` : ""}</div>
              </>
            ) : (
              <>
                {canRecord && mic.status !== "error" ? (
                  <>
                    <MicButton
                      state={recording ? "recording" : mic.status === "requesting" ? "busy" : "idle"}
                      onClick={() => void toggleRecord()}
                      label={recording ? "Yozishni to‘xtatish" : "Yozib olish"}
                      className="mt-2"
                    />
                    <div className="mt-5 min-h-7 text-lg font-black text-ink" aria-live="polite">
                      {recording
                        ? "Yozyapman… so‘zni ayt! 🎙️"
                        : attempt
                          ? "Yana aytib ko‘rasanmi? 🎙️"
                          : recUrl
                            ? "Tinglab, baholang 👇"
                            : "Bos — bola so‘zni aytsin"}
                    </div>
                    <LevelMeter source={mic.analyserRef} active={recording} className="mt-1" />
                    {recUrl && (
                      <div className="mb-1 flex flex-wrap justify-center gap-2">
                        <Button variant="soft" onClick={playRecording}>
                          <Play className="h-4 w-4 fill-current" />
                          Yozuvni tinglash
                        </Button>
                      </div>
                    )}
                    <audio ref={audioRef} src={recUrl ?? undefined} preload="auto" className="hidden" />
                  </>
                ) : (
                  <div className="mt-2 w-full rounded-3xl bg-canvas p-5 text-[15px] font-semibold leading-snug text-ink-2">
                    <div className="mb-2 text-4xl">👂</div>
                    Bola so‘zni aytsin — siz tinglab, darhol baholang.
                  </div>
                )}
                {mic.error && (
                  <DeviceErrorNote failure={mic.error} className="mt-3 w-full text-left">
                    <span className="self-center text-xs font-semibold text-muted">Yozuvsiz ham baholash mumkin 👇</span>
                  </DeviceErrorNote>
                )}
                {!attempt && (
                  <div className="mt-4 w-full">
                    <div className="mb-2 text-sm font-bold text-muted">Qanday aytdi?</div>
                    <RatingButtons onRate={rate} />
                  </div>
                )}
              </>
            )}

            {notice && <p className="mt-2 w-full rounded-2xl bg-warn/10 px-3 py-2 text-sm font-semibold text-[#8a5a00]">{notice}</p>}

            {attempt && <ResultPanel attempt={attempt} showOverride={mode === "ai" && attempt.via === "ai"} onOverride={rate} />}

            {attempt ? (
              <div className="mt-4 grid w-full grid-cols-2 gap-2">
                <Button variant="secondary" size="lg" className="px-3" onClick={retry}>
                  <RotateCcw className="h-5 w-5" />
                  Qayta
                </Button>
                <Button size="lg" className="px-3" onClick={next}>
                  {isLast ? "Natija" : "Keyingi"}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={next}
                disabled={listening || recording}
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-muted transition hover:text-ink disabled:opacity-40"
              >
                O‘tkazib yuborish
                <SkipForward className="h-4 w-4" />
              </button>
            )}
          </Card>
        </div>
      )}

      <div className="mt-4">{modeNote}</div>
    </div>
  );
}

function RatingButtons({ onRate }: { onRate: (score: number, label: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {RATINGS.map((r) => (
        <button
          key={r.score}
          type="button"
          onClick={() => {
            haptic("select");
            onRate(r.score, r.label);
          }}
          className={cn(
            "flex h-20 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[13px] font-extrabold leading-tight ring-1 transition active:scale-95 sm:text-sm",
            r.cls,
          )}
        >
          <span className="text-2xl leading-none">{r.emoji}</span>
          {r.label}
        </button>
      ))}
    </div>
  );
}

function ResultPanel({
  attempt,
  showOverride,
  onOverride,
}: {
  attempt: Attempt;
  showOverride: boolean;
  onOverride: (score: number, label: string) => void;
}) {
  const { score, heard, via, fb } = attempt;
  const lvl = scoreLevel(score);
  return (
    <div className="mt-4 w-full animate-fade-up rounded-3xl bg-canvas p-4 text-left ring-1 ring-line" aria-live="polite">
      <div className="flex items-center gap-4">
        <ProgressRing value={score / 100} size={76} stroke={8} color={lvl.color}>
          <span className="text-2xl font-black text-ink">{score}</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <Stars value={starsFor(score)} />
          <div className="mt-1 truncate text-sm text-muted">
            {via === "ai" ? "Eshitildi: " : "Ota-ona bahosi: "}
            <span className="font-extrabold text-ink">{via === "ai" ? `«${heard || "—"}»` : heard}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[17px] font-extrabold leading-snug text-ink">
        {fb.emoji} {fb.title}{" "}
        {fb.tone === "great" ? (
          fb.text
        ) : fb.hint ? (
          <>
            «<HighlightedWord segments={fb.hint.segments} />» — {fb.tip}
          </>
        ) : null}
      </p>
      {showOverride && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3 text-xs font-bold text-muted">
          <span className="mr-0.5">Ota-ona bahosi:</span>
          {RATINGS.map((r) => (
            <button
              key={r.score}
              type="button"
              onClick={() => onOverride(r.score, r.label)}
              className="rounded-xl bg-white px-2.5 py-1.5 text-ink-2 ring-1 ring-line transition hover:bg-brand-50"
            >
              {r.emoji} {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ModeNote({
  mode,
  reason,
  onSwitch,
}: {
  mode: Mode;
  reason: ManualReason | null;
  onSwitch: (to: "manual" | "ai" | "retry-ai") => void;
}) {
  const texts: Record<ManualReason, string> = {
    consent: "Sozlamalarda «mikrofon orqali nutq tahlili» o‘chirilgan — ovozni yozib olasiz va o‘zingiz baholaysiz.",
    unsupported: "Bu brauzerda (masalan, Telegram yoki Firefox ichida) nutqni avtomatik tanib olish yo‘q — ovozni yozib olasiz va o‘zingiz baholaysiz.",
    offline: "Internet yo‘q — ovozni yozib olasiz va o‘zingiz baholaysiz.",
    failed: "Nutqni tanib olish xizmati bu qurilmada javob bermadi — ota-ona baholash rejimi yoqildi.",
    user: "Ovozni yozib olasiz, tinglaysiz va o‘zingiz baholaysiz.",
  };
  const action =
    mode === "ai"
      ? { label: "Ota-ona baholashiga o‘tish", to: "manual" as const }
      : reason === "failed"
        ? { label: "AI’ni qayta sinash", to: "retry-ai" as const }
        : reason === "user"
          ? { label: "AI rejimiga qaytish", to: "ai" as const }
          : null;
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-line">
      <span className="text-xl leading-none" aria-hidden>
        {mode === "ai" ? "🤖" : "👂"}
      </span>
      <div className="min-w-0 flex-1 text-sm leading-snug">
        <div className="font-extrabold text-ink">{mode === "ai" ? "AI rejimi: talaffuzni sun’iy intellekt baholaydi" : "Ota-ona rejimi: siz baholaysiz"}</div>
        <p className="mt-0.5 text-muted">
          {mode === "ai"
            ? "Bola so‘zni aytadi, brauzerning nutqni tanib olish xizmati uni eshitib, so‘z bilan solishtiradi."
            : texts[reason ?? "user"]}
        </p>
        {action && (
          <button type="button" onClick={() => onSwitch(action.to)} className="mt-1.5 font-bold text-brand-600 hover:text-brand-700">
            {action.label} →
          </button>
        )}
        {reason === "consent" && (
          <Link href="/settings" className="mt-1.5 inline-block font-bold text-brand-600 hover:text-brand-700">
            Sozlamalarni ochish →
          </Link>
        )}
      </div>
    </div>
  );
}
