import type { SpeechSound } from "@/lib/types";
import { hashString, normalizeText, similarity } from "@/lib/utils";

/**
 * Talaffuz mashqi uchun matn yordamchilari: tovushni ajratib ko‘rsatish,
 * «Rrr-ak» kabi maslahat, nutqni tanib olish natijasini baholash.
 */

export type SpeechWord = SpeechSound["words"][number];
export type WordPosition = SpeechWord["position"];

export const POSITION_LABEL: Record<WordPosition, string> = {
  bosh: "So‘z boshida",
  orta: "So‘z o‘rtasida",
  oxir: "So‘z oxirida",
};

export interface Seg {
  text: string;
  hit: boolean;
}

const APOS_RE = /[‘’ʻʼ'`]/;
const APOS_RE_G = /[‘’ʻʼ'`]/g;

/** O‘zbek kirill harflarini lotinga (ba’zi qurilmalar natijani kirillda qaytaradi) */
const CYR_TO_LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k",
  л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "s",
  ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya", ў: "o‘", қ: "q",
  ғ: "g‘", ҳ: "h",
};

export function toLatin(s: string): string {
  let out = "";
  for (const ch of s.toLowerCase()) out += CYR_TO_LAT[ch] ?? ch;
  return out;
}

function unitKey(u: string): string {
  return u.toLowerCase().replace(APOS_RE_G, "‘");
}

/** So‘zni harf birliklariga ajratadi: «sh», «ch», «o‘», «g‘» — bitta birlik */
export function letterUnits(word: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < word.length) {
    const a = word[i];
    const b = word[i + 1] ?? "";
    const la = a.toLowerCase();
    if ((la === "s" || la === "c") && b.toLowerCase() === "h") {
      out.push(a + b);
      i += 2;
    } else if ((la === "o" || la === "g") && b && APOS_RE.test(b)) {
      out.push(a + b);
      i += 2;
    } else {
      out.push(a);
      i += 1;
    }
  }
  return out;
}

function pushSeg(segs: Seg[], text: string, hit: boolean) {
  if (!text) return;
  const last = segs[segs.length - 1];
  if (last && last.hit === hit) last.text += text;
  else segs.push({ text, hit });
}

/** So‘z (yoki gap) ichida kerakli tovushni topib, bo‘laklarga ajratadi: «**R**ak» */
export function highlightSegments(text: string, sound: string): Seg[] {
  const key = unitKey(sound.trim());
  const segs: Seg[] = [];
  if (!key) return [{ text, hit: false }];
  const units = letterUnits(text);
  if (units.some((u) => unitKey(u) === key)) {
    for (const u of units) pushSeg(segs, u, unitKey(u) === key);
    return segs;
  }
  // Boshqa ko‘p harfli tovushlar (masalan, «ng») — oddiy qidiruv
  if (key.length > 1) {
    const lower = unitKey(text);
    let i = 0;
    while (i < text.length) {
      const j = lower.indexOf(key, i);
      if (j < 0) {
        pushSeg(segs, text.slice(i), false);
        break;
      }
      pushSeg(segs, text.slice(i, j), false);
      pushSeg(segs, text.slice(j, j + key.length), true);
      i = j + key.length;
    }
    return segs.length ? segs : [{ text, hit: false }];
  }
  return [{ text, hit: false }];
}

/**
 * Cho‘zib aytsa bo‘ladigan (sirg‘aluvchi, sonor) tovushlar.
 * «j» bu yerda yo‘q: «jo‘ja»dagi j — qorishiq (affrikata), uni bo‘g‘inlab aytish to‘g‘riroq.
 */
const CONTINUANTS = new Set(["r", "l", "s", "sh", "z", "v", "f", "m", "n", "x", "h", "y"]);

export function isContinuant(sound: string): boolean {
  return CONTINUANTS.has(unitKey(sound.trim()));
}

const VOWELS = new Set(["a", "e", "i", "o", "u", "o‘"]);

/** Oddiy bo‘g‘inlarga ajratish: «Ka-lit», «Choy-nak», «Qo‘-zi-qo-rin» */
export function syllabify(units: string[]): string[][] {
  const vowelIdx = units.flatMap((u, i) => (VOWELS.has(unitKey(u)) ? [i] : []));
  if (vowelIdx.length <= 1) return [units];
  const cuts: number[] = [];
  for (let k = 0; k < vowelIdx.length - 1; k++) {
    const a = vowelIdx[k];
    const b = vowelIdx[k + 1];
    cuts.push(b - a - 1 <= 0 ? b : b - 1);
  }
  const out: string[][] = [];
  let start = 0;
  for (const c of cuts) {
    if (c > start) out.push(units.slice(start, c));
    start = Math.max(start, c);
  }
  out.push(units.slice(start));
  return out.filter((s) => s.length);
}

function pickHit(hits: number[], position: WordPosition | undefined, len: number): number {
  if (position === "oxir") return hits[hits.length - 1];
  if (position === "orta") return hits.find((i) => i > 0 && i < len - 1) ?? hits[0];
  return hits[0];
}

/**
 * Qayta aytish uchun namuna: «Rrr-ak», «Qa-rrr-ga», «Mu-shhh-uk».
 * Portlovchi tovushlarda (K, Ch, Q …) — bo‘g‘inlab: «Ka-lit».
 */
export function stretchHint(word: string, sound: string, position?: WordPosition): { text: string; segments: Seg[] } {
  const key = unitKey(sound.trim());
  const units = letterUnits(word);
  const hits = units.flatMap((u, i) => (unitKey(u) === key ? [i] : []));
  if (!key || !hits.length) {
    const segments = highlightSegments(word, sound);
    return { text: word, segments };
  }
  const segs: Seg[] = [];
  if (CONTINUANTS.has(key)) {
    let idx = pickHit(hits, position, units.length);
    // «Arra» kabi qo‘sh harf — bitta cho‘ziq tovush sifatida
    while (idx > 0 && unitKey(units[idx - 1]) === key) idx--;
    let end = idx + 1;
    while (end < units.length && unitKey(units[end]) === key) end++;
    const pre = units.slice(0, idx).join("");
    const run = units.slice(idx, end).join("");
    const tail = run.slice(-1).toLowerCase();
    const post = units.slice(end).join("");
    if (pre) pushSeg(segs, `${pre}-`, false);
    pushSeg(segs, run + tail + tail, true);
    if (post) pushSeg(segs, `-${post}`, false);
  } else {
    syllabify(units).forEach((syl, si) => {
      if (si > 0) pushSeg(segs, "-", false);
      for (const u of syl) pushSeg(segs, u, unitKey(u) === key);
    });
  }
  return { text: segs.map((s) => s.text).join(""), segments: segs };
}

// ---------------------------------------------------------------------------
// Baholash
// ---------------------------------------------------------------------------

function countSound(normText: string, key: string): number {
  if (!key) return 0;
  const n = letterUnits(normText).filter((u) => unitKey(u) === key).length;
  if (n || key.length === 1 || key === "sh" || key === "ch") return n;
  let c = 0;
  let i = normText.indexOf(key);
  while (i >= 0) {
    c++;
    i = normText.indexOf(key, i + key.length);
  }
  return c;
}

function candidatesOf(norm: string): string[] {
  const words = norm.split(" ").filter(Boolean);
  const out = new Set<string>([norm, ...words]);
  for (let i = 0; i + 1 < words.length; i++) out.add(words[i] + words[i + 1]);
  return Array.from(out);
}

export interface AttemptScore {
  /** 0..100 */
  score: number;
  /** Eng mos kelgan eshitilgan matn */
  heard: string;
  /** Kerakli tovush eshitildimi */
  soundOk: boolean;
}

/**
 * Nutqni tanib olish variantlarini (maxAlternatives) maqsadli so‘z bilan solishtiradi.
 * Har bir variant va undagi alohida so‘zlar tekshiriladi; kerakli tovush yo‘q bo‘lsa
 * ball 55 dan oshmaydi; pastroq o‘rindagi variantlarga kichik jarima.
 */
export function scoreAttempt(target: string, sound: string, alternatives: string[]): AttemptScore {
  const t = normalizeText(toLatin(target));
  const key = normalizeText(toLatin(sound)).replace(/\s+/g, "");
  const need = Math.max(1, countSound(t, key));
  const first = alternatives.find((a) => a.trim())?.trim() ?? "";
  let best: AttemptScore = { score: 0, heard: first, soundOk: false };
  alternatives.slice(0, 5).forEach((alt, rank) => {
    const norm = normalizeText(toLatin(alt));
    if (!norm) return;
    for (const cand of candidatesOf(norm)) {
      const soundOk = !key || countSound(cand, key) >= need;
      let sim = similarity(cand, t);
      if (!soundOk) sim = Math.min(sim, 0.55);
      const score = Math.max(0, Math.round(sim * 100) - rank * 3);
      if (score > best.score) best = { score, heard: alt.trim(), soundOk };
    }
  });
  return best;
}

export function starsFor(score: number): number {
  if (score >= 85) return 3;
  if (score >= 60) return 2;
  if (score >= 30) return 1;
  return 0;
}

export type FeedbackTone = "great" | "good" | "retry";

export interface Feedback {
  tone: FeedbackTone;
  emoji: string;
  title: string;
  text?: string;
  hint?: { text: string; segments: Seg[] };
  tip?: string;
}

const PRAISE = ["Zo‘r!", "Barakalla!", "Ajoyib!", "Qoyil!", "Zo‘r!"];

/** Bolaga do‘stona fikr: «Zo‘r! «Rak» so‘zini aniq aytding!» / «Yana bir bor: «Rrr-ak» — R ni cho‘zib ayt» */
export function feedbackFor(score: number, soundOk: boolean, word: string, sound: string, position?: WordPosition): Feedback {
  if (score >= 85) {
    return { tone: "great", emoji: "🌟", title: PRAISE[hashString(word) % PRAISE.length], text: `«${word}» so‘zini aniq aytding!` };
  }
  const hint = stretchHint(word, sound, position);
  const tip = `${sound} ni ${isContinuant(sound) ? "cho‘zib" : "aniq va kuchli"} ayt`;
  if (score >= 60 && soundOk) return { tone: "good", emoji: "👍", title: "Yaxshi! Yana biroz aniqroq:", hint, tip };
  return { tone: "retry", emoji: "🔁", title: "Yana bir bor:", hint, tip };
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ORDER: WordPosition[] = ["bosh", "orta", "oxir"];

/**
 * Mashq uchun 6–9 so‘z: har bir o‘rindan (bosh, o‘rta, oxir) 3 tadan,
 * yetmasa — boshqalaridan to‘ldiriladi. Logopedik tartib: bosh → o‘rta → oxir.
 */
export function pickWords(words: SpeechWord[], max = 9): SpeechWord[] {
  if (!words.length) return [];
  const groups = ORDER.map((p) => shuffle(words.filter((w) => w.position === p)));
  const other = words.filter((w) => !ORDER.includes(w.position));
  const chosen = groups.map((g) => g.slice(0, 3));
  const used = chosen.reduce((s, g) => s + g.length, 0);
  const rest = shuffle([...groups.flatMap((g) => g.slice(3)), ...other]).slice(0, Math.max(0, max - used));
  for (const w of rest) {
    const gi = ORDER.indexOf(w.position);
    chosen[gi >= 0 ? gi : ORDER.length - 1].push(w);
  }
  const out = chosen.flat();
  return out.length ? out : shuffle(words).slice(0, max);
}
