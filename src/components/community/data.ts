"use client";

import { useMemo } from "react";
import { GROUPS, SEED_POSTS } from "@/data/community";
import { getSpecialist } from "@/data/specialists";
import { useView } from "@/lib/client/hooks";
import { MONTHS, SPECIALTIES, WEEKDAYS } from "@/lib/constants";
import type { CommunityGroup, CommunityPost, PostAnswer } from "@/lib/types";
import { addDays, hashString, tashkentTime, todayKey } from "@/lib/utils";

export type PostKind = CommunityPost["kind"];

export const KIND_META: Record<PostKind, { label: string; emoji: string; cls: string }> = {
  savol: { label: "Savol", emoji: "❓", cls: "bg-brand-50 text-brand-700 ring-brand-100" },
  tajriba: { label: "Tajriba", emoji: "💬", cls: "bg-[#fcecf2] text-[#9b2c57] ring-[#f6d3e1]" },
  maslahat: { label: "Maslahat", emoji: "💡", cls: "bg-[#fdf3dc] text-[#7a5200] ring-[#f3e0ae]" },
  efir: { label: "Jonli efir", emoji: "🎙️", cls: "bg-[#fff1f1] text-[#b42323] ring-[#f6caca]" },
};

export const COMMUNITY_RULES = [
  "Bir-biringizga hurmat bilan munosabatda bo‘ling — har bir bola o‘ziga xos.",
  "Bolalar suratlari, to‘liq ism-familiya, manzil va telefon raqamlarini joylamang.",
  "Tashxis va dori-darmon bo‘yicha qarorni faqat shifokor qabul qiladi.",
  "Reklama va tekshirilmagan «mo‘jizaviy» usullarni tarqatish taqiqlanadi.",
  "Qoidalarni buzgan postlar moderatorlar tomonidan o‘chiriladi.",
];

export const TAG_SUGGESTIONS = ["nutq", "autizm", "motorika", "diqqat", "bog‘cha", "yassi oyoq", "uyqu", "ovqatlanish", "maktabga tayyorlov"];

/** Guruhlar bo‘sh bo‘lsa ham forma ishlashi uchun */
export const FALLBACK_GROUP: CommunityGroup = {
  id: "umumiy",
  name: "Umumiy savollar",
  emoji: "💬",
  type: "mavzu",
  members: 0,
  description: "Har qanday mavzudagi savollar",
};

export function allGroups(): CommunityGroup[] {
  return GROUPS.length ? GROUPS : [FALLBACK_GROUP];
}

export function groupOf(id: string): CommunityGroup | undefined {
  return GROUPS.find((g) => g.id === id) ?? (id === FALLBACK_GROUP.id ? FALLBACK_GROUP : undefined);
}

const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#0ea5e9"];

export function colorFor(name: string): string {
  return PALETTE[hashString(name) % PALETTE.length];
}

/** Avatar bosh harflari uchun: "Nigina (Behruzning onasi)" -> "Nigina" */
export function avatarName(author: string): string {
  const clean = author.replace(/\([^)]*\)/g, " ").replace(/[^\p{L}\s'‘’-]/gu, " ").replace(/\s+/g, " ").trim();
  return clean || author;
}

/** Muallif haqida: mutaxassis bo‘lsa — mutaxassislik va rang */
export function authorMeta(p: Pick<PostAnswer, "author" | "role" | "specialistId">) {
  const sp = p.role === "mutaxassis" ? getSpecialist(p.specialistId) : undefined;
  return {
    sp,
    specialty: sp ? SPECIALTIES[sp.specialty].label : undefined,
    color: sp?.color ?? (p.role === "moderator" ? "#0ea5e9" : colorFor(p.author)),
  };
}

/** Seed postlar + foydalanuvchi postlari; "__reply__" yozuvlari ota-postning javoblariga qo‘shiladi */
export function useCommunityPosts(): CommunityPost[] {
  // Oflayn rejimda massivlar joyida o‘zgaradi — shuning uchun butun view obyektiga bog‘lanamiz (u har amaldan keyin yangilanadi)
  const view = useView();
  return useMemo(() => {
    const { posts, postLikes } = view;
    const replies = new Map<string, PostAnswer[]>();
    const own: CommunityPost[] = [];
    for (const p of posts) {
      if (p.groupId === "__reply__") {
        const list = replies.get(p.title) ?? [];
        list.push({ id: p.id, author: p.author, role: p.role, specialistId: p.specialistId, text: p.text, at: p.at, likes: p.likes });
        replies.set(p.title, list);
      } else {
        own.push(p);
      }
    }
    const seen = new Set<string>();
    const out: CommunityPost[] = [];
    for (const p of [...own, ...SEED_POSTS]) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push({
        ...p,
        likes: p.likes + (postLikes[p.id] ?? 0),
        answers: [...p.answers, ...(replies.get(p.id) ?? [])].sort((a, b) => a.at.localeCompare(b.at)),
      });
    }
    return out.sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.at.localeCompare(a.at));
  }, [view]);
}

// ---------------------------------------------------------------------------
// Jonli efir jadvali: matndan hafta kuni va vaqtni topib, eng yaqin sanani hisoblaymiz
// ---------------------------------------------------------------------------

const WEEKDAY_RE = WEEKDAYS.map((w, i) => ({ n: i + 1, re: new RegExp(`\\b${w.toLowerCase()}\\b`) }));

export interface EfirSchedule {
  start: number; // ms
  live: boolean;
  past: boolean;
  recurring: boolean;
  dateLabel: string; // "Bugun" | "Ertaga" | "Payshanba, 1 oktabr"
  time: string; // "20:00"
  day: number;
  monthShort: string;
}

export function efirSchedule(post: CommunityPost, now: number = Date.now()): EfirSchedule {
  const text = `${post.title} ${post.text}`.toLowerCase();
  const wd = WEEKDAY_RE.find((w) => w.re.test(text))?.n;
  const tm = /(\d{1,2})[:.](\d{2})/.exec(text);
  const hh = tm ? Math.min(23, Number(tm[1])) : 20;
  const mm = tm ? Math.min(59, Number(tm[2])) : 0;
  const time = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  const today = todayKey();
  const at = (key: string) => new Date(`${key}T${time}:00+05:00`).getTime();
  const DURATION = 60 * 60_000;

  let start: number;
  const postAt = new Date(post.at).getTime();
  if (wd) {
    const cur = tashkentTime(new Date(now)).weekday;
    let key = addDays(today, (wd - cur + 7) % 7);
    if (at(key) + DURATION < now) key = addDays(key, 7);
    start = at(key);
  } else if (postAt > now) {
    start = postAt;
  } else {
    let key = addDays(today, 1);
    if (at(key) + DURATION < now) key = addDays(key, 1);
    start = at(key);
  }

  const startKey = new Date(start + 5 * 3600_000).toISOString().slice(0, 10);
  const diffDays = Math.round((new Date(`${startKey}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000);
  const [, m, d] = startKey.split("-").map(Number);
  const weekdayName = WEEKDAYS[tashkentTime(new Date(start)).weekday - 1];
  const dateLabel = diffDays === 0 ? "Bugun" : diffDays === 1 ? "Ertaga" : `${weekdayName}, ${d} ${MONTHS[m - 1]}`;

  return {
    start,
    live: now >= start && now < start + DURATION,
    past: now >= start + DURATION,
    recurring: !!wd && /\bhar\b/.test(text),
    dateLabel,
    time,
    day: d,
    monthShort: MONTHS[m - 1].slice(0, 3),
  };
}

/** Foydalanuvchi hududiga mos hududiy guruh(lar) */
export function isMyRegionGroup(g: CommunityGroup, regionName: string): boolean {
  if (g.type !== "hudud" || !regionName) return false;
  const word = regionName.split(/\s+/)[0];
  return !!word && `${g.name} ${g.description}`.includes(word);
}
