"use client";

import { useState } from "react";
import { ChoiceGame } from "./choice-game";
import { pick, rng, sample, shuffle, type Rng } from "./lib";
import type { GameProps, Level } from "./types";

/** Hissiyotlar: yuz ifodasi yoki vaziyatga qarab his-tuyg‘uni topish */

type EmotionId = "xursand" | "xafa" | "jahl" | "qorqqan" | "hayron";

const EMOTIONS: Record<EmotionId, { e: string; label: string; faces: string[]; cat?: string; say: string }> = {
  xursand: { e: "😊", label: "Xursand", faces: ["😊", "😄", "😁", "😃"], cat: "😸", say: "U xursand!" },
  xafa: { e: "😢", label: "Xafa", faces: ["😢", "😭", "😞", "😔"], cat: "😿", say: "U xafa bo‘ldi" },
  jahl: { e: "😠", label: "Jahli chiqqan", faces: ["😠", "😡"], cat: "😾", say: "Uning jahli chiqdi" },
  qorqqan: { e: "😨", label: "Qo‘rqqan", faces: ["😨", "😱", "😰"], say: "U qo‘rqib ketdi" },
  hayron: { e: "😲", label: "Hayron", faces: ["😲", "😮", "😯"], say: "U hayron qoldi" },
};
const IDS = Object.keys(EMOTIONS) as EmotionId[];

interface Story {
  scene: string;
  text: string;
  ans: EmotionId;
  /** Bu vaziyatda ikkinchi to‘g‘ri bo‘lib ko‘rinishi mumkin bo‘lgan his — variantlarga qo‘shilmaydi */
  avoid?: EmotionId;
}

const STORIES: Story[] = [
  { scene: "🧸🎁", text: "Do‘sti unga o‘yinchog‘ini berdi.", ans: "xursand", avoid: "hayron" },
  { scene: "🎂🎈", text: "Bugun uning tug‘ilgan kuni!", ans: "xursand", avoid: "hayron" },
  { scene: "⚽", text: "Do‘stlari bilan birga to‘p o‘ynadi.", ans: "xursand" },
  { scene: "👵🍪", text: "Buvisi unga shirin pechenye pishirib berdi.", ans: "xursand", avoid: "hayron" },
  { scene: "🍦", text: "Muzqaymog‘i yerga tushib ketdi.", ans: "xafa", avoid: "jahl" },
  { scene: "🤕", text: "Yiqilib, tizzasini og‘ritib oldi.", ans: "xafa", avoid: "qorqqan" },
  { scene: "🎈", text: "Shari qo‘lidan chiqib, uchib ketdi.", ans: "xafa", avoid: "hayron" },
  { scene: "🏰", text: "Kimdir u qurgan qasrni ataylab buzib yubordi.", ans: "jahl", avoid: "xafa" },
  { scene: "📄", text: "Ukasi uning rasmini yirtib qo‘ydi.", ans: "jahl", avoid: "xafa" },
  { scene: "🎠", text: "Navbatda turgan edi, bir bola oldiga o‘tib oldi.", ans: "jahl", avoid: "xafa" },
  { scene: "⛈️", text: "Qattiq momaqaldiroq gumburladi.", ans: "qorqqan", avoid: "hayron" },
  { scene: "🐕", text: "Katta it unga qarab qattiq vovulladi.", ans: "qorqqan", avoid: "jahl" },
  { scene: "🌑", text: "Qorong‘i xonada yolg‘iz qoldi.", ans: "qorqqan", avoid: "xafa" },
  { scene: "🕷️", text: "Devorda katta o‘rgimchak ko‘rdi.", ans: "qorqqan", avoid: "hayron" },
  { scene: "🎁🐰", text: "Qutini ochgan edi, ichidan quyoncha sakrab chiqdi!", ans: "hayron", avoid: "xursand" },
  { scene: "🎩🕊️", text: "Sehrgar shlyapadan kaptar chiqardi!", ans: "hayron", avoid: "xursand" },
  { scene: "❄️", text: "Ertalab uyg‘onsa, hamma yoqni oppoq qor qoplabdi!", ans: "hayron", avoid: "xursand" },
];

interface EmotionRound {
  kind: "face" | "cat" | "story";
  scene: string;
  text?: string;
  ans: EmotionId;
  options: EmotionId[];
  answer: number;
}

function makeOptions(r: Rng, ans: EmotionId, count: number, avoid?: EmotionId): { options: EmotionId[]; answer: number } {
  const others = sample(
    r,
    IDS.filter((id) => id !== ans && id !== avoid),
    count - 1,
  );
  const options = shuffle(r, [ans, ...others]);
  return { options, answer: options.indexOf(ans) };
}

/** O‘rta/qiyin daraja: boshqacha ko‘rinishdagi yuzlar yoki mushukcha yuzi */
function faceRound(r: Rng, ans: EmotionId, count: number): EmotionRound {
  const em = EMOTIONS[ans];
  if (em.cat && r() < 0.35) return { kind: "cat", scene: em.cat, ans, ...makeOptions(r, ans, count) };
  return { kind: "face", scene: pick(r, em.faces.slice(1)), ans, ...makeOptions(r, ans, count) };
}

function buildRounds(seed: number, level: Level): EmotionRound[] {
  const r = rng(seed);
  const count = level === 1 ? 3 : 4;
  if (level === 1) {
    // Har xil hissiyotlar navbatma-navbat chiqsin
    const order = shuffle(r, IDS);
    return order.map((ans) => ({ kind: "face" as const, scene: EMOTIONS[ans].faces[0], ans, ...makeOptions(r, ans, count) }));
  }
  const nFaces = level === 2 ? 3 : 2;
  const nStories = level === 2 ? 3 : 5;
  const faces = sample(r, IDS, nFaces).map((ans) => faceRound(r, ans, count));
  const stories = sample(r, STORIES, nStories).map((st) => ({
    kind: "story" as const,
    scene: st.scene,
    text: st.text,
    ans: st.ans,
    ...makeOptions(r, st.ans, count, st.avoid),
  }));
  return shuffle(r, [...faces, ...stories]);
}

export function EmotionGame({ level, seed, onProgress, onFinish }: GameProps) {
  const [rounds] = useState(() => buildRounds(seed, level));
  return (
    <ChoiceGame
      rounds={rounds}
      onProgress={onProgress}
      onFinish={onFinish}
      title={(rd) => (rd.kind === "story" ? "U qanday his qildi?" : rd.kind === "cat" ? "Mushukcha qanday his qilyapti?" : "Bu yuzcha qanday his qilyapti?")}
      scene={(rd) =>
        rd.kind === "story" ? (
          <div className="flex max-w-[520px] flex-col items-center gap-3 px-2 text-center">
            <span className="animate-float text-[60px] leading-none sm:text-[76px]">{rd.scene}</span>
            <p className="rounded-2xl bg-white px-4 py-2.5 text-[16px] font-extrabold leading-snug text-ink shadow-card ring-1 ring-line sm:text-lg">
              «{rd.text}»
            </p>
          </div>
        ) : (
          <span className="animate-float text-[96px] leading-none sm:text-[120px]">{rd.scene}</span>
        )
      }
      option={(rd, i) => {
        const em = EMOTIONS[rd.options[i]];
        return (
          <>
            <span className="text-[40px] leading-none sm:text-[48px]">{em.e}</span>
            <span className="text-[13px] font-extrabold leading-tight text-ink-2 sm:text-[15px]">{em.label}</span>
          </>
        );
      }}
      optionLabel={(rd, i) => EMOTIONS[rd.options[i]].label}
      success={(rd) => `${EMOTIONS[rd.ans].say} ${EMOTIONS[rd.ans].e}`}
      optionClassName="h-[100px] w-[calc(50%-4px)] sm:h-[120px] sm:w-[calc(25%-9px)]"
    />
  );
}
