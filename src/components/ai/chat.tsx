"use client";

import { Mic, SendHorizonal, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fallbackAnswer, fallbackKidAnswer } from "@/lib/ai/fallback";
import { apiStream } from "@/lib/client/api";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";

export type ChatMsg = { role: "user" | "assistant"; content: string };

type SR = {
  lang: string;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getRecognition(): SR | null {
  if (typeof window === "undefined") return null;
  const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  const C = W.SpeechRecognition ?? W.webkitSpeechRecognition;
  return C ? new C() : null;
}

/**
 * AI chat (ota-ona / bola / mutaxassis rejimlari).
 * Server: /api/ai/chat — Claude (yoki kalitsiz demo). Oflayn rejimda — lokal javoblar.
 */
export function AiChat({
  mode,
  storageKey,
  childId,
  childName,
  specialistId,
  greeting,
  suggestions,
  placeholder = "Savolingizni yozing…",
  limit,
  onLimit,
  big,
  className,
  initialInput,
}: {
  mode: "parent" | "kid" | "specialist";
  storageKey: string;
  childId?: string;
  childName?: string;
  specialistId?: string;
  greeting: string;
  suggestions: string[];
  placeholder?: string;
  /** kuniga savollar limiti (bepul tarif) */
  limit?: number;
  onLimit?: () => void;
  big?: boolean;
  className?: string;
  /** masalan, botdan kelgan savol (/ai?q=...) */
  initialInput?: string;
}) {
  const appMode = useApp((s) => s.mode);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState(initialInput ?? "");
  const [busy, setBusy] = useState(false);
  const [aiMode, setAiMode] = useState<string>("");
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setMsgs(raw ? JSON.parse(raw) : []);
    } catch {
      setMsgs([]);
    }
    setCanListen(!!getRecognition());
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(msgs.slice(-40)));
    } catch {
      /* ignore */
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, storageKey]);

  function usedToday(): number {
    try {
      const k = `yq-ai-count-${new Date().toISOString().slice(0, 10)}`;
      return Number(localStorage.getItem(k) ?? 0);
    } catch {
      return 0;
    }
  }
  function bumpUsage() {
    try {
      const k = `yq-ai-count-${new Date().toISOString().slice(0, 10)}`;
      localStorage.setItem(k, String(usedToday() + 1));
    } catch {
      /* ignore */
    }
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    if (limit !== undefined && usedToday() >= limit) {
      onLimit?.();
      return;
    }
    haptic("light");
    const history: ChatMsg[] = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    bumpUsage();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const update = (full: string) =>
      setMsgs((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: full };
        return copy;
      });
    try {
      if (appMode === "offline") throw new Error("offline");
      const { mode: m } = await apiStream("/api/ai/chat", { mode, messages: history.slice(-12), childId, specialistId }, update, ctrl.signal);
      setAiMode(m);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        const ans = mode === "kid" ? fallbackKidAnswer(q, childName) : fallbackAnswer(q, childName);
        // oflayn — asta-sekin chiqarish
        const parts = ans.match(/\S+\s*/g) ?? [ans];
        let acc = "";
        for (const p of parts) {
          acc += p;
          update(acc);
          await new Promise((r) => setTimeout(r, 18));
        }
        setAiMode("demo");
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = getRecognition();
    if (!rec) return;
    rec.lang = "uz-UZ";
    rec.interimResults = true;
    rec.onresult = (e) => {
      let t = "";
      for (let k = 0; k < e.results.length; k++) t += e.results[k][0].transcript;
      setInput(t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  const empty = msgs.length === 0;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex-1 space-y-4">
        {/* Salomlashish */}
        <Bubble role="assistant" big={big}>
          <Markdown text={greeting} className={big ? "text-lg" : undefined} />
        </Bubble>
        {empty && (
          <div className="flex flex-wrap gap-2 pl-12">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className={cn(
                  "rounded-2xl border border-brand-200 bg-white px-3.5 py-2 text-left font-bold text-brand-700 transition hover:bg-brand-50",
                  big ? "text-base" : "text-sm",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, k) => (
          <Bubble key={k} role={m.role} big={big}>
            {m.role === "assistant" ? (
              m.content ? (
                <Markdown text={m.content} className={big ? "text-lg" : undefined} />
              ) : (
                <span className="flex gap-1 py-1">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: `${d * 120}ms` }} />
                  ))}
                </span>
              )
            ) : (
              <span className={cn("whitespace-pre-wrap", big && "text-lg")}>{m.content}</span>
            )}
          </Bubble>
        ))}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+84px)] z-10 mt-4 lg:bottom-4">
        <div className="flex items-end gap-2 rounded-3xl border border-line bg-white p-2 shadow-pop">
          {msgs.length > 0 && (
            <button onClick={() => setMsgs([])} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-faint hover:bg-slate-50 hover:text-danger" aria-label="Suhbatni tozalash">
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder={listening ? "Gapiring, eshitayapman…" : placeholder}
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] outline-none placeholder:text-faint"
          />
          {canListen && (
            <button
              onClick={toggleMic}
              className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition", listening ? "bg-danger text-white animate-pulse-ring" : "text-muted hover:bg-brand-50")}
              aria-label="Ovozli kiritish"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
          {busy ? (
            <button onClick={() => abortRef.current?.abort()} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink text-white" aria-label="To‘xtatish">
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand disabled:opacity-40"
              aria-label="Yuborish"
            >
              <SendHorizonal className="h-5 w-5" />
            </button>
          )}
        </div>
        {aiMode && (
          <div className="mt-1.5 text-center text-[11px] font-bold text-faint">
            {aiMode === "claude" ? "✨ Claude AI javob bermoqda · tashxis qo‘ymaydi" : "Demo AI rejimi · tashxis qo‘ymaydi, mutaxassis bilan maslahatlashing"}
          </div>
        )}
      </div>
    </div>
  );
}

function Bubble({ role, children, big }: { role: "user" | "assistant"; children: React.ReactNode; big?: boolean }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className={cn("max-w-[85%] rounded-3xl rounded-br-lg bg-brand-gradient px-4 py-2.5 font-semibold text-white shadow-brand", big && "px-5 py-3")}>{children}</div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5">
      <div className={cn("grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#efeaff] to-brand-50 shadow-card", big ? "h-12 w-12 text-2xl" : "h-10 w-10 text-xl")}>🤖</div>
      <div className="max-w-[88%] rounded-3xl rounded-tl-lg border border-line bg-white px-4 py-3 shadow-card">{children}</div>
    </div>
  );
}
