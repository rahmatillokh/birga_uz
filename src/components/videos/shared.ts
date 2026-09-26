import { DOMAINS, VIDEO_CATEGORIES } from "@/lib/constants";
import type { Video, VideoCategory } from "@/lib/types";

/** Interaktiv darsdagi bitta sahna */
export interface Scene {
  emoji: string;
  text: string;
  ms: number;
}

// Emoji klasteri (ZWJ, variation selector, teri rangi bilan). RegExp satr orqali — TS target’dan qat’i nazar ishlaydi.
const CLUSTER = "\\p{Extended_Pictographic}(?:\\uFE0F|\\u20E3|\\p{Emoji_Modifier}|\\u200D\\p{Extended_Pictographic}\\uFE0F?)*";
const LEADING = new RegExp(`^((?:${CLUSTER}\\s*)+)`, "u");
const TRAILING = new RegExp(`((?:\\s*${CLUSTER})+)$`, "u");

/** "Tilni chiqaring 👅" -> { emoji: "👅", text: "Tilni chiqaring" } (bosh yoki oxiridagi emoji) */
export function splitEmoji(raw: string): { emoji?: string; text: string } {
  const s = raw.trim();
  const lead = LEADING.exec(s);
  if (lead) return { emoji: lead[1].replace(/\s+/g, ""), text: s.slice(lead[0].length).trim() };
  const trail = TRAILING.exec(s);
  if (trail) return { emoji: trail[1].replace(/\s+/g, ""), text: s.slice(0, trail.index).trim() };
  return { text: s };
}

const CATEGORY_EMOJI: Record<VideoCategory, string[]> = {
  nutq: ["🗣️", "👄", "🎵", "🦜", "⭐"],
  motorika: ["🤸", "🙌", "🦶", "🏃", "⭐"],
  diqqat: ["🎯", "👀", "🔍", "💡", "⭐"],
  xotira: ["🧠", "🃏", "🔁", "💡", "⭐"],
  mantiq: ["🧩", "🔺", "🔢", "💡", "⭐"],
  ijtimoiy: ["🤝", "😊", "👋", "💞", "⭐"],
  kundalik: ["🪥", "🧼", "👕", "🥄", "⭐"],
};

/** Har bir qadam 6–8 soniya; sanoqli harakatlar ("5 soniya", "10 marta") — 8 soniya */
function stepMs(text: string): number {
  if (/\d+\s*(marta|soniya|sekund)/i.test(text)) return 8000;
  return Math.round(Math.min(8000, Math.max(6000, 4800 + text.length * 45)));
}

function fallbackSteps(video: Video): string[] {
  const sentences = (video.description.match(/[^.!?]+[.!?]?/g) ?? [])
    .map((x) => x.trim())
    .filter((x) => x.length > 2)
    .slice(0, 4);
  return [`${video.emoji} Bugungi dars: «${video.title}»`, ...sentences, "⭐ Zo‘r! Endi hammasini yana bir marta takrorlaymiz"];
}

export function lessonScenes(video: Video): Scene[] {
  const raw = video.steps?.length ? video.steps : fallbackSteps(video);
  const pool = CATEGORY_EMOJI[video.category] ?? ["⭐"];
  return raw.map((step, i) => {
    const { emoji, text } = splitEmoji(step);
    return {
      emoji: emoji || (i === 0 ? video.emoji : pool[(i - 1) % pool.length]),
      text: text || step,
      ms: stepMs(text || step),
    };
  });
}

/** Kartada ko‘rsatiladigan davomiylik (soniya): YouTube — asl uzunlik, interaktiv dars — sahnalar yig‘indisi */
export function videoSeconds(video: Video): number {
  if (video.youtubeId) return video.durationSec;
  return Math.round(lessonScenes(video).reduce((s, x) => s + x.ms, 0) / 1000);
}

/** 125 -> "2:05" */
export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Kategoriya bo‘yicha urg‘u rangi (progress, tugmalar) */
export function accentOf(category: VideoCategory): string {
  return DOMAINS[VIDEO_CATEGORIES[category].domain].color;
}

/** Har bir kategoriyaning do‘stona qahramoni */
export const MASCOTS: Record<VideoCategory, { emoji: string; name: string }> = {
  nutq: { emoji: "🦜", name: "To‘tiqush Tuti" },
  motorika: { emoji: "🐯", name: "Yo‘lbarscha Chaqqon" },
  diqqat: { emoji: "🦉", name: "Boyo‘g‘li Donish" },
  xotira: { emoji: "🐘", name: "Filcha Esli" },
  mantiq: { emoji: "🦊", name: "Tulkicha Zukko" },
  ijtimoiy: { emoji: "🐻", name: "Ayiqcha Do‘stjon" },
  kundalik: { emoji: "🐰", name: "Quyoncha Ozoda" },
};

const CHEERS = [
  "Zo‘r! Men bilan birga takrorla 👍",
  "Diqqat bilan qara 👀",
  "Juda yaxshi ketyapsan!",
  "Ofarin! Yana bir qadam",
  "Sen uddalaysan! 💪",
  "Qoyil! Davom etamiz",
];

export function mascotLine(index: number, total: number, childName?: string): string {
  if (index === 0) return `Salom${childName ? `, ${childName}` : ""}! Qani, boshladik!`;
  if (index === total - 1) return "Oxirgi qadam! Sen uddalaysan 💪";
  return CHEERS[(index - 1) % CHEERS.length];
}

/** Keyingi tavsiya etiladigan video (avval shu kategoriyadan) */
export function nextVideo(list: Video[], current: Video): Video | undefined {
  const idx = list.findIndex((v) => v.id === current.id);
  const ordered = [...list.slice(idx + 1), ...list.slice(0, Math.max(0, idx))];
  return ordered.find((v) => v.category === current.category && !v.premium) ?? ordered.find((v) => !v.premium) ?? ordered[0];
}
