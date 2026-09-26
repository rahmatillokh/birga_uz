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

const ROUNDS = 4;
/** O‘lchagich shkalasi: shovqin darajasidan yuqori 0..40 dB */
const SCALE_DB = 40;
const LION_HOLD = 0.8;
const MOUSE_HOLD = 1.5;
const LION_LIMIT = 8;
const MOUSE_LIMIT = 10;
const CALIBRATE_SEC = 1;

/** Chegaralar — atrof shovqinidan necha dB yuqori */
const PRESETS = {
  tinch: { label: "Tinch xona", lion: 30, lo: 5, hi: 18 },
  orta: { label: "O‘rtacha", lion: 24, lo: 4, hi: 15 },
  shovqin: { label: "Shovqinli joy", lion: 17, lo: 2, hi: 10 },
} as const;
type Preset = keyof typeof PRESETS;

type Who = "lion" | "mouse";
type Phase = "intro" | "calibrating" | Who | "feedback" | "done";
type Input = "mic" | "manual";
interface Mark {
  lion: boolean | null;
  mouse: boolean | null;
}

const emptyMarks = (): Mark[] => Array.from({ length: ROUNDS }, () => ({ lion: null, mouse: null }));

const FEEDBACK: Record<Who, { ok: string; fail: string }> = {
  lion: { ok: "Rrrr! Haqiqiy sher bo‘lding!", fail: "Sher yana balandroq o‘kiradi — keyingi safar!" },
  mouse: { ok: "Pi-pi! Juda yoqimli, sekin ovoz!", fail: "Sichqoncha uchun sekinroq kerak edi — mayli!" },
};

interface GameRef {
  phase: Phase;
  samples: number[];
  t: number;
  floor: number;
  smooth: number;
  hold: number;
  elapsed: number;
  loud: number;
  round: number;
  marks: Mark[];
}

const freshGame = (): GameRef => ({
  phase: "intro",
  samples: [],
  t: 0,
  floor: -70,
  smooth: 0,
  hold: 0,
  elapsed: 0,
  loud: 0,
  round: 0,
  marks: emptyMarks(),
});

export function LoudnessGame() {
  const mic = useMic({ raw: true });
  const saver = useActivitySaver();
  const [phase, setPhase] = useState<Phase>("intro");
  const [input, setInput] = useState<Input>("mic");
  const [preset, setPreset] = useState<Preset>("orta");
  const [round, setRound] = useState(0);
  const [who, setWho] = useState<Who>("lion");
  const [marks, setMarks] = useState<Mark[]>(emptyMarks);
  const [fb, setFb] = useState<{ ok: boolean; who: Who } | null>(null);
  const [view, setView] = useState({ v: 0, hold: 0, left: LION_LIMIT, tooLoud: false, calib: 0 });
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

  function startPhase(p: Who, r: number) {
    const s = g.current;
    s.round = r;
    s.hold = 0;
    s.elapsed = 0;
    s.loud = 0;
    s.smooth = 0;
    setRound(r);
    setWho(p);
    setFb(null);
    setView((v) => ({ ...v, v: 0, hold: 0, left: p === "lion" ? LION_LIMIT : MOUSE_LIMIT, tooLoud: false }));
    go(p);
  }

  function finishGame() {
    const s = g.current;
    const lion = s.marks.filter((m) => m.lion).length;
    const mouse = s.marks.filter((m) => m.mouse).length;
    go("done");
    mic.stop();
    void saver.save(
      {
        kind: "speech",
        refId: "ovoz",
        title: "Ovoz kuchi: Sher va sichqoncha",
        domain: "nutq",
        score: Math.round(((lion + mouse) / (ROUNDS * 2)) * 100),
        durationSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
        details: { rounds: ROUNDS, baland: lion, sekin: mouse, input: input === "mic" ? "mikrofon" : "ota-ona" },
      },
      "Ovoz mashqi saqlandi!",
    );
  }

  function endPhase(ok: boolean) {
    const s = g.current;
    if (s.phase !== "lion" && s.phase !== "mouse") return;
    const w: Who = s.phase;
    s.marks[s.round] = { ...s.marks[s.round], [w]: ok };
    setMarks(s.marks.map((m) => ({ ...m })));
    setFb({ ok, who: w });
    haptic(ok ? "success" : "warning");
    go("feedback");
    timerRef.current = setTimeout(() => {
      if (w === "lion") startPhase("mouse", s.round);
      else if (s.round + 1 < ROUNDS) startPhase("lion", s.round + 1);
      else finishGame();
    }, 1700);
  }

  async function start(how: Input) {
    if (timerRef.current) clearTimeout(timerRef.current);
    g.current = freshGame();
    setInput(how);
    setMarks(emptyMarks());
    setView({ v: 0, hold: 0, left: LION_LIMIT, tooLoud: false, calib: 0 });
    saver.reset();
    startedAtRef.current = Date.now();
    if (how === "manual") {
      mic.stop();
      startPhase("lion", 0);
      return;
    }
    const ok = await mic.start();
    if (!ok) {
      go("intro");
      return;
    }
    setWho("lion");
    setRound(0);
    go("calibrating");
  }

  function stopGame() {
    if (timerRef.current) clearTimeout(timerRef.current);
    mic.stop();
    g.current = freshGame();
    setMarks(emptyMarks());
    go("intro");
  }

  useRafLoop(input === "mic" && (phase === "calibrating" || phase === "lion" || phase === "mouse"), (dt) => {
    const s = g.current;
    const an = mic.analyserRef.current;
    if (!an) return;
    const db = an.db();
    if (s.phase === "calibrating") {
      s.samples.push(db);
      s.t += dt;
      setView((v) => ({ ...v, calib: Math.min(1, s.t / CALIBRATE_SEC) }));
      if (s.t >= CALIBRATE_SEC) {
        const sorted = [...s.samples].sort((a, b) => a - b);
        // 60-persentil: tasodifiy keskin tovushlarni hisobga olmaymiz
        s.floor = Math.min(-30, sorted[Math.floor(sorted.length * 0.6)] ?? -70);
        startPhase("lion", 0);
      }
      return;
    }
    if (s.phase !== "lion" && s.phase !== "mouse") return;
    const P = PRESETS[preset];
    const rel = Math.max(0, db - s.floor);
    s.smooth += (rel - s.smooth) * (rel > s.smooth ? 0.35 : 0.12);
    s.elapsed += dt;
    let tooLoud = false;
    if (s.phase === "lion") {
      if (s.smooth >= P.lion) s.hold += dt;
      if (s.hold >= LION_HOLD) return endPhase(true);
      if (s.elapsed >= LION_LIMIT) return endPhase(false);
    } else {
      if (s.smooth > P.hi) {
        s.loud += dt;
        s.hold = Math.max(0, s.hold - dt * 1.5);
      } else {
        s.loud = 0;
        if (s.smooth >= P.lo) s.hold += dt;
      }
      tooLoud = s.loud > 0.2;
      if (s.hold >= MOUSE_HOLD) return endPhase(true);
      if (s.elapsed >= MOUSE_LIMIT) return endPhase(false);
    }
    const need = s.phase === "lion" ? LION_HOLD : MOUSE_HOLD;
    const limit = s.phase === "lion" ? LION_LIMIT : MOUSE_LIMIT;
    setView({ v: Math.min(1, s.smooth / SCALE_DB), hold: Math.min(1, s.hold / need), left: Math.max(0, limit - s.elapsed), tooLoud, calib: 1 });
  });

  const P = PRESETS[preset];
  const playing = phase === "lion" || phase === "mouse";
  // O‘yin davomida mikrofon uzilsa — xabar va davom etish yo‘llari
  const micLost = input === "mic" && (phase === "calibrating" || playing || phase === "feedback") && mic.status === "idle";
  const success = marks.reduce((n, m) => n + (m.lion ? 1 : 0) + (m.mouse ? 1 : 0), 0);
  const score = Math.round((success / (ROUNDS * 2)) * 100);
  const presetChips = (
    <Chips<Preset> value={preset} onChange={setPreset} items={(Object.keys(PRESETS) as Preset[]).map((k) => ({ value: k, label: PRESETS[k].label }))} />
  );

  return (
    <div className="animate-fade-up">
      <PageHeader back="/speech" emoji="🦁" title="Sher va sichqoncha" subtitle="Ovoz kuchi — baland va sekin gapirishni boshqarishni o‘rganamiz" />

      {phase === "intro" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
          <Card className="overflow-hidden p-0 lg:self-start">
            <div className="grid grid-cols-2 gap-3 bg-gradient-to-b from-[#fdf3dc] to-white p-5 sm:p-6">
              <div className="rounded-3xl bg-white p-4 text-center shadow-card">
                <div className="animate-float text-7xl leading-none">🦁</div>
                <div className="mt-3 text-lg font-black text-ink">Sher</div>
                <div className="text-sm text-muted">Baland: «A-A-A!»</div>
              </div>
              <div className="rounded-3xl bg-white p-4 text-center shadow-card">
                <div className="animate-float text-7xl leading-none [animation-delay:0.6s]">🐭</div>
                <div className="mt-3 text-lg font-black text-ink">Sichqoncha</div>
                <div className="text-sm text-muted">Sekin: «a-a-a»</div>
              </div>
            </div>
            <div className="px-5 pb-6 text-center">
              <div className="text-xl font-black text-ink">Ovozingni boshqar! 🎚️</div>
              <p className="mx-auto mt-1 max-w-sm text-sm leading-snug text-muted">
                {ROUNDS} raund: avval sherdek baland, keyin sichqonchadek sekin. Ovoz ustunini kuzatib boring.
              </p>
            </div>
          </Card>
          <div className="space-y-3">
            <Card className="p-5">
              <CardTitle>Qayerda o‘ynayapsiz?</CardTitle>
              {presetChips}
              <p className="mt-2 text-xs leading-snug text-muted">Shovqinli joyda chegaralar pastroq qo‘yiladi — o‘yin oson bo‘ladi.</p>
            </Card>
            <PermissionNote
              device="mic"
              purpose="Ovoz balandligini mikrofon orqali o‘lchaymiz. Telefonni bolaning og‘zidan 20–30 sm uzoqlikda ushlang."
              privacy="Ovoz faqat shu qurilmada tahlil qilinadi, yozib olinmaydi va hech qayerga yuborilmaydi."
            />
            {mic.error && (
              <DeviceErrorNote failure={mic.error} onRetry={() => void start("mic")}>
                <Button size="sm" variant="soft" onClick={() => void start("manual")}>
                  Ota-ona baholaydi
                </Button>
              </DeviceErrorNote>
            )}
            <Button size="lg" block loading={mic.status === "requesting"} onClick={() => void start("mic")}>
              🦁 Boshlash
            </Button>
            <button type="button" onClick={() => void start("manual")} className="w-full text-center text-sm font-bold text-muted transition hover:text-ink">
              Mikrofonsiz o‘ynash: ota-ona tinglab baholaydi
            </button>
            <InfoNote emoji="🩺">
              Ovoz kuchini boshqarish — nutqning muhim qismi. Baland ovoz — baqiriq emas: qorin bilan, tomoqni zo‘riqtirmasdan gapiramiz.
            </InfoNote>
          </div>
        </div>
      )}

      {(phase === "calibrating" || playing || phase === "feedback") && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <Badge tone="brand">
                {round + 1}-raund / {ROUNDS}
              </Badge>
              <span className="tabular text-sm font-bold text-muted">{playing && input === "mic" ? `⏱ ${Math.ceil(view.left)}` : ""}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1" aria-label={`${success} ta topshiriq bajarildi`}>
              {marks.map((m, i) => (
                <span key={i} className={cn("flex gap-0.5 rounded-full px-1 py-0.5", i === round ? "bg-brand-50 ring-1 ring-brand-200" : "")}>
                  <MarkDot value={m.lion} />
                  <MarkDot value={m.mouse} />
                </span>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
              <Animal emoji="🦁" label="Baland" active={who === "lion"} scale={who === "lion" && playing ? 1 + view.v * 0.55 : 1} />
              {input === "mic" ? (
                <VolumeMeter v={phase === "calibrating" ? 0 : view.v} lion={P.lion} lo={P.lo} hi={P.hi} />
              ) : (
                <div className="grid h-40 w-12 place-items-center text-3xl" aria-hidden>
                  ↔️
                </div>
              )}
              <Animal
                emoji={who === "mouse" && view.tooLoud && playing ? "🙀" : "🐭"}
                label="Sekin"
                active={who === "mouse"}
                scale={who === "mouse" && playing && !view.tooLoud ? 1 + Math.min(view.v, 0.4) * 0.4 : 1}
              />
            </div>

            <div className="mt-5 min-h-24 text-center" aria-live="polite">
              {phase === "calibrating" && (
                <>
                  <div className="text-xl font-black text-ink">🤫 Jim turing…</div>
                  <div className="mt-0.5 text-sm text-muted">Xonadagi shovqinni o‘lchayapmiz</div>
                  <ProgressBar value={view.calib * 100} className="mx-auto mt-3 max-w-xs" />
                </>
              )}
              {phase === "lion" && (
                <>
                  <div className="text-2xl font-black text-ink">
                    Sherdek baland ayt: <span className="whitespace-nowrap">«A-A-A!»</span>
                  </div>
                  <div className="mt-0.5 text-sm text-muted">{input === "mic" ? "Ustun sariq chiziqdan o‘tsin 🦁" : "Bola sherdek baland aytsin, siz baholang"}</div>
                </>
              )}
              {phase === "mouse" && (
                <>
                  <div className="text-2xl font-black text-ink">
                    Endi sichqonchadek sekin: <span className="whitespace-nowrap">«a-a-a»</span>
                  </div>
                  <div className={cn("mt-0.5 text-sm", view.tooLoud && input === "mic" ? "font-bold text-[#8a5a00]" : "text-muted")}>
                    {input === "mic"
                      ? view.tooLoud
                        ? "Sekinroq! Sichqoncha qo‘rqib ketdi 🙀"
                        : "Ustun yashil yo‘lakda tursin 🐭"
                      : "Bola sichqonchadek sekin aytsin, siz baholang"}
                  </div>
                </>
              )}
              {phase === "feedback" && fb && (
                <div className="animate-pop text-2xl font-black text-ink">
                  {fb.who === "lion" ? "🦁" : "🐭"} {FEEDBACK[fb.who][fb.ok ? "ok" : "fail"]}
                </div>
              )}
              {playing && input === "mic" && <ProgressBar value={view.hold * 100} height={10} className="mx-auto mt-3 max-w-xs" />}
              {playing && input === "manual" && (
                <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-2">
                  <Button size="lg" className="px-3" onClick={() => endPhase(true)}>
                    ✅ Uddaladi
                  </Button>
                  <Button size="lg" variant="secondary" className="px-3" onClick={() => endPhase(false)}>
                    🔁 Bo‘lmadi
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-3">
            <Card className="p-5">
              <CardTitle>Maslahat</CardTitle>
              <ul className="space-y-2.5 text-[15px] leading-snug text-ink-2">
                <li className="flex gap-2.5">
                  <span className="text-xl leading-none">🦁</span>
                  <span>Sher — chuqur nafas olib, qorin bilan kuchli ovoz. Baqirmaymiz!</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-xl leading-none">🐭</span>
                  <span>Sichqoncha — sekin, lekin eshitiladigan ovoz. Pichirlamaymiz.</span>
                </li>
              </ul>
            </Card>
            {input === "mic" && (
              <Card className="p-4">
                <div className="mb-2 text-sm font-bold text-ink">Joy</div>
                {presetChips}
              </Card>
            )}
            {micLost && (
              <DeviceErrorNote failure={{ code: "unknown", title: "Mikrofon uzildi", text: "Mikrofon ishlamay qoldi. O‘yinni qayta boshlang yoki ota-ona baholashi bilan davom eting." }}>
                <Button size="sm" variant="secondary" onClick={() => void start("mic")}>
                  Qayta boshlash
                </Button>
                <Button size="sm" variant="soft" onClick={() => void start("manual")}>
                  Ota-ona baholaydi
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
            score={score}
            emoji={score >= 85 ? "🏆" : score >= 50 ? "🎚️" : "🌱"}
            title={score >= 85 ? "Ovozingni zo‘r boshqarding!" : score >= 50 ? "Yaxshi natija!" : "Mashq qilsak, albatta chiqadi!"}
            text={`${ROUNDS * 2} ta topshiriqdan ${success} tasi bajarildi`}
            save={saver.state}
            onRetrySave={saver.retry}
          />
          <div className="space-y-3">
            <Card className="p-4 sm:p-5">
              <CardTitle>Raundlar</CardTitle>
              <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-2 text-[15px]">
                <span className="text-xs font-bold text-muted">Raund</span>
                <span className="text-xs font-bold text-muted">🦁 Baland</span>
                <span className="text-xs font-bold text-muted">🐭 Sekin</span>
                {marks.map((m, i) => (
                  <RoundRow key={i} n={i + 1} mark={m} />
                ))}
              </div>
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

function RoundRow({ n, mark }: { n: number; mark: Mark }) {
  const cell = (v: boolean | null) => (
    <span className={cn("font-extrabold", v ? "text-[#006300]" : "text-muted")}>{v ? "✅ Bajarildi" : v === false ? "➖ Bo‘lmadi" : "—"}</span>
  );
  return (
    <>
      <span className="font-black text-ink">{n}</span>
      {cell(mark.lion)}
      {cell(mark.mouse)}
    </>
  );
}

function MarkDot({ value }: { value: boolean | null }) {
  return (
    <span
      className={cn(
        "grid h-5 w-5 place-items-center rounded-full text-[10px] leading-none",
        value ? "bg-good/15" : value === false ? "bg-slate-200" : "bg-slate-100",
      )}
      aria-hidden
    >
      {value ? "✅" : value === false ? "➖" : ""}
    </span>
  );
}

function Animal({ emoji, label, active, scale }: { emoji: string; label: string; active: boolean; scale: number }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center rounded-3xl px-2 py-4 transition sm:p-5",
        active ? "bg-brand-50 ring-2 ring-brand-200" : "opacity-50 grayscale-[0.4]",
      )}
    >
      <div className="text-6xl leading-none transition-transform duration-100 sm:text-7xl" style={{ transform: `scale(${scale.toFixed(3)})` }}>
        {emoji}
      </div>
      <div className="mt-3 text-sm font-extrabold text-ink">{label}</div>
    </div>
  );
}

/** Vertikal ovoz ustuni: tepada «sher zonasi», pastroqda «sichqoncha yo‘lagi» */
function VolumeMeter({ v, lion, lo, hi }: { v: number; lion: number; lo: number; hi: number }) {
  const pct = (db: number) => Math.min(100, (db / SCALE_DB) * 100);
  return (
    <div className="relative h-60 w-16 sm:h-72 sm:w-20" role="meter" aria-label="Ovoz balandligi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)}>
      <div className="absolute inset-0 overflow-hidden rounded-[22px] bg-slate-100 ring-1 ring-line">
        <div className="absolute inset-x-0 top-0 bg-[#fdf3dc]" style={{ bottom: `${pct(lion)}%` }} />
        <div className="absolute inset-x-0 border-y-2 border-[#1baf7a]/50 bg-[#e3f6ef]" style={{ bottom: `${pct(lo)}%`, height: `${pct(hi) - pct(lo)}%` }} />
        <div
          className="absolute inset-x-2 bottom-0 rounded-t-2xl bg-brand-gradient transition-[height] duration-75"
          style={{ height: `${Math.max(2, v * 100)}%` }}
        />
        <span className="absolute inset-x-0 text-center text-lg leading-none" style={{ bottom: `calc(${(pct(lion) + 100) / 2}% - 9px)` }}>
          🦁
        </span>
        <span className="absolute inset-x-0 text-center text-lg leading-none" style={{ bottom: `calc(${(pct(lo) + pct(hi)) / 2}% - 9px)` }}>
          🐭
        </span>
      </div>
      <div className="absolute -inset-x-1.5 h-1.5 rounded-full bg-[#eda100] shadow-sm" style={{ bottom: `calc(${pct(lion)}% - 3px)` }} />
    </div>
  );
}
