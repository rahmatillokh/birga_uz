"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChoiceGame } from "./choice-game";
import { pick, randInt, range, rng, sample, shuffle, type Rng } from "./lib";
import type { GameProps, Level } from "./types";

/** «Kichik muammolar»: hayotiy vaziyatlar + (yuqori darajada) sanash va mantiq */

interface Opt {
  e: string;
  t?: string;
  digit?: boolean;
}

type Scene =
  | { kind: "big"; e: string }
  | { kind: "many"; e: string; n: number }
  | { kind: "math"; e: string; a: number; b: number; op: "+" | "-" };

interface ProblemRound {
  scene: Scene;
  prompt: string;
  options: Opt[];
  answer: number;
  success?: string;
}

interface Life {
  scene: string;
  q: string;
  ok: [string, string];
  no: [string, string][];
}

const LIFE: Life[] = [
  { scene: "🌧️", q: "Yomg‘ir yog‘yapti. Nima olamiz?", ok: ["☂️", "Soyabon"], no: [["🕶️", "Ko‘zoynak"], ["🍦", "Muzqaymoq"], ["⚽", "To‘p"]] },
  { scene: "🤲", q: "Qo‘llar kir bo‘lib qoldi. Nima kerak?", ok: ["🧼", "Sovun"], no: [["🍪", "Pechenye"], ["🧸", "Ayiqcha"], ["📺", "Televizor"]] },
  { scene: "🥶", q: "Tashqarida juda sovuq. Nima kiyamiz?", ok: ["🧥", "Issiq kurtka"], no: [["🩳", "Shortik"], ["🕶️", "Ko‘zoynak"], ["👒", "Shlyapa"]] },
  { scene: "🥵", q: "Chanqab qoldim. Nima ichamiz?", ok: ["💧", "Suv"], no: [["🍬", "Konfet"], ["🧂", "Tuz"], ["👟", "Krossovka"]] },
  { scene: "🌑", q: "Xona qorong‘i. Nima yordam beradi?", ok: ["🔦", "Fonar"], no: [["🎈", "Shar"], ["🍎", "Olma"], ["🧦", "Paypoq"]] },
  { scene: "🧸💔", q: "O‘yinchoq sinib qoldi. Nima qilamiz?", ok: ["🙋", "Kattalardan yordam so‘raymiz"], no: [["😭", "Yig‘lab o‘tiramiz"], ["🗑️", "Tashlab yuboramiz"], ["😠", "Jahl qilamiz"]] },
  { scene: "🥱", q: "Uyqum keldi. Qayerga boramiz?", ok: ["🛏️", "Yotoqqa"], no: [["🎢", "Attraksionga"], ["⚽", "Maydonga"], ["🏊", "Hovuzga"]] },
  { scene: "🤒", q: "Isitmam chiqdi. Kim yordam beradi?", ok: ["👩‍⚕️", "Shifokor"], no: [["👨‍🍳", "Oshpaz"], ["🤡", "Masxaraboz"], ["👷", "Quruvchi"]] },
  { scene: "☀️", q: "Quyosh qattiq qizdiryapti. Boshga nima kiyamiz?", ok: ["🧢", "Kepka"], no: [["🧣", "Sharf"], ["🧤", "Qo‘lqop"], ["🧦", "Paypoq"]] },
  { scene: "🐶", q: "Kuchukcha och qoldi. Unga nima beramiz?", ok: ["🦴", "Suyak"], no: [["🧦", "Paypoq"], ["🎈", "Shar"], ["📚", "Kitob"]] },
  { scene: "🚦", q: "Svetoforda qizil chiroq yondi. Nima qilamiz?", ok: ["✋", "To‘xtaymiz"], no: [["🏃", "Yuguramiz"], ["💃", "Raqs tushamiz"], ["🚲", "Velosipedda o‘tamiz"]] },
  { scene: "😢", q: "Do‘sting yig‘layapti. Nima qilasan?", ok: ["🤗", "Yupataman"], no: [["😂", "Kulaman"], ["🙈", "Ko‘rmaganga olaman"], ["🏃", "Qochib ketaman"]] },
  { scene: "🥛", q: "Sut to‘kilib ketdi. Nima qilamiz?", ok: ["🧽", "Artib qo‘yamiz"], no: [["🙈", "Yashirinamiz"], ["🎨", "Rasm chizamiz"], ["😴", "Uxlaymiz"]] },
  { scene: "❄️", q: "Qor yog‘di! Tepalikdan nimada uchamiz?", ok: ["🛷", "Chana"], no: [["⛵", "Qayiq"], ["🚲", "Velosiped"], ["🛴", "Samokat"]] },
  { scene: "🎁", q: "Do‘sting sovg‘a berdi. Nima deysan?", ok: ["🙏", "Rahmat!"], no: [["😠", "Kerak emas!"], ["🙊", "Hech narsa"], ["😴", "Uxlayman"]] },
  { scene: "🦶", q: "Ko‘chaga chiqamiz. Oyoqqa nima kiyamiz?", ok: ["👟", "Oyoq kiyim"], no: [["🧤", "Qo‘lqop"], ["🎩", "Shlyapa"], ["👓", "Ko‘zoynak"]] },
  { scene: "🥀", q: "Gulimiz so‘lib qoldi. Unga nima kerak?", ok: ["💧", "Suv"], no: [["🍭", "Konfet"], ["🧸", "O‘yinchoq"], ["👕", "Futbolka"]] },
  { scene: "🍽️", q: "Ovqatdan oldin nima qilamiz?", ok: ["🧼", "Qo‘l yuvamiz"], no: [["📺", "Multfilm ko‘ramiz"], ["⚽", "To‘p o‘ynaymiz"], ["🛏️", "Uxlaymiz"]] },
];

const ODD_SETS = [
  { name: "mevalar", items: ["🍎", "🍌", "🍇", "🍓", "🍊", "🍐", "🍒"] },
  { name: "hayvonlar", items: ["🐶", "🐱", "🐰", "🐻", "🐼", "🐸", "🐵"] },
  { name: "transport", items: ["🚗", "🚌", "🚀", "✈️", "🚲", "⛵", "🚂"] },
  { name: "kiyimlar", items: ["👕", "👖", "🧦", "🧢", "👗", "🧥", "👟"] },
  { name: "o‘yinchoqlar", items: ["⚽", "🧸", "🎈", "🎲", "🧩", "🏀"] },
];

const COUNTABLE = [
  { e: "🎈", t: "shar" },
  { e: "🍎", t: "olma" },
  { e: "⭐", t: "yulduz" },
  { e: "🐥", t: "jo‘ja" },
  { e: "🌸", t: "gul" },
  { e: "🚗", t: "mashina" },
];

const SIZES = [
  { e: "🐜", t: "Chumoli" },
  { e: "🐭", t: "Sichqon" },
  { e: "🐰", t: "Quyon" },
  { e: "🐴", t: "Ot" },
  { e: "🐘", t: "Fil" },
];

function digits(r: Rng, ans: number, count: number, min = 0): Opt[] {
  const pool = [ans - 1, ans + 1, ans + 2, ans - 2, ans + 3].filter((x) => x >= min && x !== ans);
  return shuffle(r, [ans, ...pool.slice(0, count - 1)]).map((x) => ({ e: String(x), digit: true }));
}

function lifeRound(r: Rng, item: Life, optCount: number): ProblemRound {
  const ok: Opt = { e: item.ok[0], t: item.ok[1] };
  const wrong = sample(r, item.no, optCount - 1).map(([e, t]) => ({ e, t }));
  const options = shuffle(r, [ok, ...wrong]);
  return { scene: { kind: "big", e: item.scene }, prompt: item.q, options, answer: options.indexOf(ok) };
}

function oddRound(r: Rng): ProblemRound {
  const [base, other] = sample(r, ODD_SETS, 2);
  const odd: Opt = { e: pick(r, other.items) };
  const options = shuffle(r, [...sample(r, base.items, 3).map((e) => ({ e })), odd]);
  return { scene: { kind: "big", e: "🤔" }, prompt: "Qaysi biri ortiqcha?", options, answer: options.indexOf(odd), success: `To‘g‘ri! Qolganlari — ${base.name}` };
}

function countRound(r: Rng, min: number, max: number, optCount: number): ProblemRound {
  const c = pick(r, COUNTABLE);
  const n = randInt(r, min, max);
  const options = digits(r, n, optCount, 1);
  return { scene: { kind: "many", e: c.e, n }, prompt: `Nechta ${c.t} bor?`, options, answer: options.findIndex((o) => o.e === String(n)), success: `To‘g‘ri! ${n} ta ${c.t} 👏` };
}

function mathRound(r: Rng): ProblemRound {
  const c = pick(r, COUNTABLE);
  const plus = r() < 0.5;
  const a = plus ? randInt(r, 1, 4) : randInt(r, 3, 6);
  const b = plus ? randInt(r, 1, 3) : randInt(r, 1, Math.min(3, a - 1));
  const ans = plus ? a + b : a - b;
  const options = digits(r, ans, 4, 0);
  return {
    scene: { kind: "math", e: c.e, a, b, op: plus ? "+" : "-" },
    prompt: plus ? "Hammasi nechta bo‘ldi?" : "Nechta qoldi?",
    options,
    answer: options.findIndex((o) => o.e === String(ans)),
    success: `To‘g‘ri! ${a} ${plus ? "+" : "−"} ${b} = ${ans}`,
  };
}

function sizeRound(r: Rng): ProblemRound {
  const picks = sample(r, range(SIZES.length), 3).sort((x, y) => x - y);
  const big = r() < 0.5;
  const ansIdx = big ? picks[picks.length - 1] : picks[0];
  const options = shuffle(
    r,
    picks.map((i) => ({ e: SIZES[i].e, t: SIZES[i].t })),
  );
  return {
    scene: { kind: "big", e: "🤔" },
    prompt: big ? "Qaysi biri eng katta?" : "Qaysi biri eng kichik?",
    options,
    answer: options.findIndex((o) => o.e === SIZES[ansIdx].e),
    success: `To‘g‘ri! ${SIZES[ansIdx].t} — eng ${big ? "katta" : "kichik"}`,
  };
}

function buildRounds(seed: number, level: Level): ProblemRound[] {
  const r = rng(seed);
  // Bir o‘yinda bir xil javobli vaziyatlar takrorlanmasin
  const lives: Life[] = [];
  const seen = new Set<string>();
  for (const l of shuffle(r, LIFE)) {
    if (seen.has(l.ok[0])) continue;
    seen.add(l.ok[0]);
    lives.push(l);
  }
  if (level === 1) return lives.slice(0, 5).map((l) => lifeRound(r, l, 3));
  if (level === 2) {
    return shuffle(r, [...lives.slice(0, 4).map((l) => lifeRound(r, l, 3)), oddRound(r), countRound(r, 2, 5, 3)]);
  }
  return shuffle(r, [...lives.slice(0, 3).map((l) => lifeRound(r, l, 4)), oddRound(r), countRound(r, 4, 9, 4), mathRound(r), sizeRound(r)]);
}

function Group({ e, n, className }: { e: string; n: number; className?: string }) {
  return (
    <span className={cn("flex max-w-[260px] flex-wrap items-center justify-center gap-0.5 leading-none", className)}>
      {range(n).map((k) => (
        <span key={k}>{e}</span>
      ))}
    </span>
  );
}

function SceneView({ scene }: { scene: Scene }) {
  if (scene.kind === "big") {
    return <span className="animate-float text-[76px] leading-none sm:text-[96px]">{scene.e}</span>;
  }
  if (scene.kind === "many") {
    return (
      <div className="rounded-3xl bg-white/80 px-4 py-3 shadow-card ring-1 ring-line">
        <Group e={scene.e} n={scene.n} className="max-w-[230px] text-[38px] sm:max-w-[320px] sm:text-[48px]" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-3xl bg-white/80 px-3 py-3 shadow-card ring-1 ring-line sm:gap-4 sm:px-5">
      <Group e={scene.e} n={scene.a} className="max-w-[120px] text-[30px] sm:max-w-[190px] sm:text-[42px]" />
      <span className="text-3xl font-black text-brand-600 sm:text-4xl">{scene.op === "+" ? "+" : "−"}</span>
      <Group e={scene.e} n={scene.b} className="max-w-[90px] text-[30px] sm:max-w-[140px] sm:text-[42px]" />
      <span className="text-3xl font-black text-muted sm:text-4xl">=</span>
      <span className="text-3xl font-black text-brand-600 sm:text-4xl">?</span>
    </div>
  );
}

export function ProblemGame({ level, seed, onProgress, onFinish }: GameProps) {
  const [rounds] = useState(() => buildRounds(seed, level));
  return (
    <ChoiceGame
      rounds={rounds}
      onProgress={onProgress}
      onFinish={onFinish}
      title={(rd) => rd.prompt}
      scene={(rd) => <SceneView scene={rd.scene} />}
      option={(rd, i) => {
        const o = rd.options[i];
        if (o.digit) return <span className="text-[44px] font-black leading-none text-ink sm:text-[54px]">{o.e}</span>;
        return (
          <>
            <span className={cn("leading-none", o.t ? "text-[38px] sm:text-[46px]" : "text-[48px] sm:text-[58px]")}>{o.e}</span>
            {o.t && <span className="line-clamp-2 text-[12.5px] font-extrabold leading-tight text-ink-2 sm:text-sm">{o.t}</span>}
          </>
        );
      }}
      optionLabel={(rd, i) => {
        const o = rd.options[i];
        return o.digit ? `Javob: ${o.e}` : o.t ? `${o.t} ${o.e}` : `Variant: ${o.e}`;
      }}
      success={(rd) => rd.success ?? "To‘g‘ri yechim! 💡"}
      optionClassName="h-[108px] w-[calc(50%-4px)] sm:h-[128px] sm:w-[calc(25%-9px)]"
    />
  );
}
