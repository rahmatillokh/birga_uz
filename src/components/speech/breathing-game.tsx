"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { InfoNote, PageHeader } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { Chips } from "@/components/ui/tabs";
import { haptic } from "@/lib/client/telegram";
import { useActivitySaver, useMic, useRafLoop } from "@/lib/speech/hooks";
import { cn } from "@/lib/utils";
import { DeviceErrorNote, PermissionNote, ResultHero } from "./bits";
import { Cake, type FlameState } from "./cake";

const CANDLES = 3;
/** Sham o‘chishi uchun to‘xtovsiz puflash (soniya) */
const HOLD_SEC = 2;
/** Bitta sham uchun vaqt chegarasi (soniya) */
const CANDLE_LIMIT = 15;
/** Atrof shovqinini o‘lchash (soniya) */
const CALIBRATE_SEC = 1;
/** O‘lchagichda chegara chizig‘i joyi (0..1) */
const MARK = 0.45;

type Phase = "intro" | "calibrating" | "play" | "between" | "done";
type Outcome = "ok" | "miss" | null;
type Input = "mic" | "button";

const SENS = {
  past: { label: "Past", k: 1.6 },
  orta: { label: "O‘rta", k: 1 },
  yuqori: { label: "Yuqori", k: 0.6 },
} as const;
type Sens = keyof typeof SENS;

interface GameRef {
  phase: Phase;
  samples: number[];
  t: number;
  base: number;
  smooth: number;
  progress: number;
  elapsed: number;
  pressed: boolean;
  current: number;
  outcomes: Outcome[];
  times: (number | null)[];
}

const freshGame = (): GameRef => ({
  phase: "intro",
  samples: [],
  t: 0,
  base: 0.05,
  smooth: 0,
  progress: 0,
  elapsed: 0,
  pressed: false,
  current: 0,
  outcomes: Array(CANDLES).fill(null),
  times: Array(CANDLES).fill(null),
});

export function BreathingGame() {
  const mic = useMic({ raw: true });
  const saver = useActivitySaver();
  const [phase, setPhase] = useState<Phase>("intro");
  const [input, setInput] = useState<Input>("mic");
  const [sens, setSens] = useState<Sens>("orta");
  const [current, setCurrent] = useState(0);
  const [outcomes, setOutcomes] = useState<Outcome[]>(() => Array(CANDLES).fill(null));
  const [times, setTimes] = useState<(number | null)[]>(() => Array(CANDLES).fill(null));
  const [view, setView] = useState({ level: 0, progress: 0, blowing: false, left: CANDLE_LIMIT, calib: 0 });
  const g = useRef<GameRef>(freshGame());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    const timer = timerRef;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const go = (p: Phase) => {
    g.current.phase = p;
    setPhase(p);
  };

  function startCandle(i: number) {
    const s = g.current;
    s.current = i;
    s.progress = 0;
    s.elapsed = 0;
    s.smooth = 0;
    setCurrent(i);
    setView((v) => ({ ...v, level: 0, progress: 0, blowing: false, left: CANDLE_LIMIT }));
    go("play");
  }

  function finishGame() {
    const s = g.current;
    const ok = s.outcomes.filter((o) => o === "ok").length;
    go("done");
    mic.stop();
    void saver.save(
      {
        kind: "speech",
        refId: "nafas",
        title: "Nafas mashqi: Shamni o‘chir",
        domain: "nutq",
        score: Math.round((ok / CANDLES) * 100),
        durationSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
        details: { candles: CANDLES, blownOut: ok, input: input === "button" ? "tugma" : "mikrofon" },
      },
      "Nafas mashqi saqlandi!",
    );
  }

  function endCandle(result: "ok" | "miss") {
    const s = g.current;
    const i = s.current;
    s.outcomes[i] = result;
    s.times[i] = result === "ok" ? Math.round(s.elapsed * 10) / 10 : null;
    s.pressed = false;
    setOutcomes([...s.outcomes]);
    setTimes([...s.times]);
    setView((v) => ({ ...v, level: 0, blowing: false, progress: result === "ok" ? 1 : v.progress }));
    haptic(result === "ok" ? "success" : "warning");
    go("between");
    timerRef.current = setTimeout(() => {
      if (i + 1 < CANDLES) startCandle(i + 1);
      else finishGame();
    }, result === "ok" ? 1700 : 1500);
  }

  async function start(how: Input) {
    if (timerRef.current) clearTimeout(timerRef.current);
    g.current = freshGame();
    setInput(how);
    setOutcomes(Array(CANDLES).fill(null));
    setTimes(Array(CANDLES).fill(null));
    setCurrent(0);
    setView({ level: 0, progress: 0, blowing: false, left: CANDLE_LIMIT, calib: 0 });
    saver.reset();
    startedAtRef.current = Date.now();
    if (how === "button") {
      mic.stop();
      startCandle(0);
      return;
    }
    const ok = await mic.start();
    if (!ok) {
      go("intro");
      return;
    }
    go("calibrating");
  }

  function stopGame() {
    if (timerRef.current) clearTimeout(timerRef.current);
    mic.stop();
    g.current = freshGame();
    setOutcomes(Array(CANDLES).fill(null));
    go("intro");
  }

  useRafLoop(phase === "calibrating" || phase === "play", (dt) => {
    const s = g.current;
    const an = mic.analyserRef.current;
    const raw = input === "button" ? (s.pressed ? 1 : 0) : an ? 0.65 * an.lowRms() + 0.35 * an.rms() : 0;

    if (s.phase === "calibrating") {
      s.samples.push(raw);
      s.t += dt;
      setView((v) => ({ ...v, calib: Math.min(1, s.t / CALIBRATE_SEC), level: 0 }));
      if (s.t >= CALIBRATE_SEC) {
        const n = s.samples.length || 1;
        const mean = s.samples.reduce((a, b) => a + b, 0) / n;
        const sd = Math.sqrt(s.samples.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
        // Moslashuvchan chegara: atrof shovqinidan ancha yuqori, lekin juda past ham emas
        s.base = Math.max(mean * 4, mean + 6 * sd, 0.03);
        startCandle(0);
      }
      return;
    }
    if (s.phase !== "play") return;

    const threshold = input === "button" ? 0.5 : s.base * SENS[sens].k;
    s.smooth += (raw - s.smooth) * (raw > s.smooth ? 0.5 : 0.2);
    const blowing = s.smooth > threshold;
    s.progress = blowing ? s.progress + dt : Math.max(0, s.progress - dt * 1.2);
    s.elapsed += dt;
    const level = Math.min(1, (s.smooth / threshold) * MARK);
    setView({ level, progress: Math.min(1, s.progress / HOLD_SEC), blowing, left: Math.max(0, CANDLE_LIMIT - s.elapsed), calib: 1 });
    if (s.progress >= HOLD_SEC) endCandle("ok");
    else if (s.elapsed >= CANDLE_LIMIT) endCandle("miss");
  });

  const flames: FlameState[] = outcomes.map((o) => (o === "ok" ? "out" : "lit"));
  const okCount = outcomes.filter((o) => o === "ok").length;
  // O‘yin davomida mikrofon uzilsa (ruxsat qaytarib olindi, qurilma o‘chdi) — xabar ko‘rsatamiz
  const micLost = input === "mic" && (phase === "calibrating" || phase === "play" || phase === "between") && mic.status === "idle";
  const last = outcomes[current];

  return (
    <div className="animate-fade-up">
      <PageHeader back="/speech" emoji="🎂" title="Shamni o‘chir" subtitle="Nafas mashqi — uzun va kuchli havo oqimini o‘rganamiz" />

      {phase === "intro" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
          <Card className="overflow-hidden p-0 lg:self-start">
            <div className="bg-gradient-to-b from-[#fff7ed] to-white px-4 pt-5">
              <Cake flames={["lit", "lit", "lit"]} className="mx-auto max-w-[380px]" />
            </div>
            <div className="px-5 pb-6 text-center">
              <div className="text-xl font-black text-ink">Tug‘ilgan kun torti tayyor! 🎉</div>
              <p className="mx-auto mt-1 max-w-sm text-sm leading-snug text-muted">
                3 ta shamni puflab o‘chiramiz. Har bir sham uchun {HOLD_SEC} soniya to‘xtovsiz puflash kerak.
              </p>
            </div>
          </Card>
          <div className="space-y-3">
            <Card className="p-5">
              <CardTitle>Qanday o‘ynaymiz?</CardTitle>
              <ol className="space-y-2.5 text-[15px] leading-snug text-ink-2">
                <Step n={1}>Burun orqali chuqur nafas oling 👃</Step>
                <Step n={2}>Lablarni naycha qilib, mikrofonga uzoq va bir tekis puflang 💨</Step>
                <Step n={3}>Olov kichrayib, sham o‘chguncha puflashda davom eting 🕯️</Step>
              </ol>
            </Card>
            <PermissionNote
              device="mic"
              purpose="Puflashni mikrofon orqali sezamiz. Telefonni bolaning og‘zidan 10–15 sm uzoqlikda ushlang."
              privacy="Ovoz faqat shu qurilmada tahlil qilinadi, yozib olinmaydi va hech qayerga yuborilmaydi."
            />
            {mic.error && (
              <DeviceErrorNote failure={mic.error} onRetry={() => void start("mic")}>
                <Button size="sm" variant="soft" onClick={() => void start("button")}>
                  Tugma bilan o‘ynash
                </Button>
              </DeviceErrorNote>
            )}
            <Button size="lg" block loading={mic.status === "requesting"} onClick={() => void start("mic")}>
              💨 Boshlash
            </Button>
            <button
              type="button"
              onClick={() => void start("button")}
              className="w-full text-center text-sm font-bold text-muted transition hover:text-ink"
            >
              Mikrofonsiz o‘ynash: ota-ona tugmani bosib turadi
            </button>
            <InfoNote emoji="🩺">
              Nafas mashqlari nutq uchun to‘g‘ri havo oqimini shakllantiradi. Boshi aylansa — to‘xtab, dam oling. Kuniga 3–5 daqiqa yetarli.
            </InfoNote>
          </div>
        </div>
      )}

      {(phase === "calibrating" || phase === "play" || phase === "between") && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr]">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-2 px-5 pt-4">
              <Badge tone="brand">
                🕯️ {current + 1}-sham / {CANDLES}
              </Badge>
              <div className="flex items-center gap-1.5" aria-label={`${okCount} ta sham o‘chdi`}>
                {outcomes.map((o, i) => (
                  <span
                    key={i}
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full text-sm",
                      o === "ok" ? "bg-good/15" : o === "miss" ? "bg-slate-100" : i === current ? "bg-brand-100 ring-2 ring-brand-300" : "bg-slate-100",
                    )}
                  >
                    {o === "ok" ? "✅" : o === "miss" ? "➖" : "🕯️"}
                  </span>
                ))}
              </div>
              <span className="tabular w-12 text-right text-sm font-bold text-muted">{phase === "play" ? `⏱ ${Math.ceil(view.left)}` : ""}</span>
            </div>
            <div className="bg-gradient-to-b from-white to-[#fff7ed] px-4 pt-1">
              <Cake
                flames={flames}
                active={phase === "play" ? current : -1}
                strength={view.level}
                progress={view.progress}
                blowing={view.blowing}
                className="mx-auto max-w-[420px]"
              />
            </div>
            <div className="px-5 pb-5 pt-2 text-center" aria-live="polite">
              {phase === "calibrating" ? (
                <>
                  <div className="text-xl font-black text-ink">🤫 Jim turing…</div>
                  <div className="mt-0.5 text-sm text-muted">Xonadagi shovqinni o‘lchayapmiz</div>
                  <ProgressBar value={view.calib * 100} className="mt-3" />
                </>
              ) : phase === "between" ? (
                <div className="animate-pop text-xl font-black text-ink">
                  {last === "ok" ? "Sham o‘chdi! 🎉" : "Hechqisi yo‘q, keyingisini o‘chiramiz! 💪"}
                </div>
              ) : (
                <>
                  <div className="text-xl font-black text-ink">
                    {view.blowing ? "Zo‘r! Puflashda davom et! 💨" : view.progress > 0 ? "Yana puflang — olov kichraymoqda! 🌬️" : "Chuqur nafas ol va shamga puf de! 🌬️"}
                  </div>
                  <div className="mt-0.5 text-sm text-muted">Olov o‘chguncha to‘xtamasdan puflang</div>
                  {input === "button" && (
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        g.current.pressed = true;
                        haptic("light");
                        try {
                          e.currentTarget.setPointerCapture(e.pointerId);
                        } catch {
                          /* ba’zi brauzerlarda qo‘llab-quvvatlanmaydi */
                        }
                      }}
                      onPointerUp={() => {
                        g.current.pressed = false;
                      }}
                      onPointerCancel={() => {
                        g.current.pressed = false;
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      className="mt-4 h-16 w-full touch-none select-none rounded-3xl bg-brand-gradient text-lg font-black text-white shadow-brand transition active:scale-[0.98] active:brightness-110"
                    >
                      💨 Bosib turing — bola puflayapti
                    </button>
                  )}
                </>
              )}
            </div>
          </Card>

          <div className="space-y-3">
            <Card className="p-5">
              <div className="text-sm font-bold text-muted">Puflash kuchi</div>
              <div className="relative mt-2 h-5 w-full overflow-hidden rounded-full bg-brand-100/70">
                <div className="h-full rounded-full bg-brand-gradient transition-[width] duration-75" style={{ width: `${view.level * 100}%` }} />
                <div className="absolute inset-y-0 w-0.5 bg-ink/60" style={{ left: `${MARK * 100}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[11px] font-semibold text-faint">
                <span>Sust</span>
                <span>Chiziqdan o‘tsa — sham kichrayadi</span>
                <span>Kuchli</span>
              </div>
              <div className="mt-4 text-sm font-bold text-muted">Sham o‘chishiga</div>
              <ProgressBar value={view.progress * 100} height={12} className="mt-2" />
            </Card>
            {input === "mic" && (
              <Card className="p-4">
                <div className="mb-2 text-sm font-bold text-ink">Sezgirlik</div>
                <Chips<Sens> value={sens} onChange={setSens} items={(Object.keys(SENS) as Sens[]).map((k) => ({ value: k, label: SENS[k].label }))} />
                <p className="mt-2 text-xs leading-snug text-muted">Shovqinli joyda «Past»ni tanlang. Sham qiyin o‘chsa — «Yuqori».</p>
              </Card>
            )}
            {micLost && (
              <DeviceErrorNote failure={{ code: "unknown", title: "Mikrofon uzildi", text: "Mikrofon ishlamay qoldi. O‘yinni qayta boshlang yoki tugma bilan davom eting." }}>
                <Button size="sm" variant="secondary" onClick={() => void start("mic")}>
                  Qayta boshlash
                </Button>
                <Button size="sm" variant="soft" onClick={() => void start("button")}>
                  Tugma bilan o‘ynash
                </Button>
              </DeviceErrorNote>
            )}
            <Button variant="ghost" block onClick={stopGame}>
              To‘xtatish
            </Button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ResultHero
            score={Math.round((okCount / CANDLES) * 100)}
            emoji={okCount === CANDLES ? "🎂" : okCount > 0 ? "🕯️" : "🌬️"}
            title={okCount === CANDLES ? "Barcha shamlar o‘chdi!" : okCount > 0 ? `${okCount} ta sham o‘chdi!` : "Keyingi safar albatta!"}
            text={okCount === CANDLES ? "Nafasing juda kuchli va uzun — xuddi haqiqiy tug‘ilgan kundagidek!" : "Har kuni ozgina mashq qilsak, nafas kuchayib boradi."}
            save={saver.state}
            onRetrySave={saver.retry}
          />
          <div className="space-y-3">
            <Card className="p-5">
              <Cake flames={flames} className="mx-auto max-w-[320px]" />
              <ul className="mt-3 divide-y divide-line">
                {outcomes.map((o, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-[15px]">
                    <span className="font-bold text-ink">{i + 1}-sham</span>
                    <span className={cn("font-extrabold", o === "ok" ? "text-[#006300]" : "text-muted")}>
                      {o === "ok" ? `✅ O‘chdi${times[i] ? ` · ${times[i]} s` : ""}` : "➖ Yonib qoldi"}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
            <div className="grid grid-cols-2 gap-2">
              <Button size="lg" onClick={() => void start(input)}>
                🔁 Yana o‘ynash
              </Button>
              <Button size="lg" variant="secondary" href="/speech">
                Nutq bo‘limi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-black text-brand-700">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
