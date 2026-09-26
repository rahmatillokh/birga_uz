import type { Activity } from "@/lib/types";
import { addDays, dayKey, todayKey } from "@/lib/utils";

/** Nutq bo‘limidagi talaffuzdan tashqari mashqlar (kind: "speech") */
export const SPEECH_GAME_REFS = { nafas: "nafas", ovoz: "ovoz" } as const;

export function isPronunciation(a: Activity): boolean {
  return a.kind === "speech" && a.refId !== SPEECH_GAME_REFS.nafas && a.refId !== SPEECH_GAME_REFS.ovoz;
}

export interface SpeechStats {
  /** Talaffuz mashqlari (vaqt bo‘yicha o‘sish tartibida) */
  pronunciation: Activity[];
  /** Oxirgi 8 ta talaffuz natijasi */
  trend: Activity[];
  last?: Activity;
  prev?: Activity;
  /** Tovush id → oxirgi natija */
  lastBySound: Record<string, Activity>;
  /** Oxirgi 8 tasining o‘rtachasi */
  trendAvg: number | null;
  /** Oxirgi 7 kundagi barcha nutq mashqlari soni */
  weekCount: number;
  breathLast?: Activity;
  loudLast?: Activity;
  mirrorCount: number;
}

export function speechStats(activities: Activity[], mirrorExerciseIds: string[] = []): SpeechStats {
  const scored = activities
    .filter((a) => a.kind === "speech" && typeof a.score === "number")
    .sort((a, b) => a.at.localeCompare(b.at));
  const pronunciation = scored.filter(isPronunciation);
  const lastBySound: Record<string, Activity> = {};
  for (const a of pronunciation) lastBySound[a.refId] = a;
  const trend = pronunciation.slice(-8);
  const trendAvg = trend.length ? Math.round(trend.reduce((s, a) => s + (a.score ?? 0), 0) / trend.length) : null;
  const from = addDays(todayKey(), -6);
  const weekCount = activities.filter((a) => a.kind === "speech" && dayKey(a.at) >= from).length;
  const breath = scored.filter((a) => a.refId === SPEECH_GAME_REFS.nafas);
  const loud = scored.filter((a) => a.refId === SPEECH_GAME_REFS.ovoz);
  const ids = new Set(mirrorExerciseIds);
  return {
    pronunciation,
    trend,
    last: pronunciation[pronunciation.length - 1],
    prev: pronunciation[pronunciation.length - 2],
    lastBySound,
    trendAvg,
    weekCount,
    breathLast: breath[breath.length - 1],
    loudLast: loud[loud.length - 1],
    mirrorCount: activities.filter((a) => a.kind === "exercise" && ids.has(a.refId)).length,
  };
}
