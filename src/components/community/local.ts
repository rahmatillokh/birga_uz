"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Hamjamiyatdagi shaxsiy holat (qurilmada saqlanadi): yoqtirishlar, guruhlar, eslatmalar */
interface CommunityLocal {
  liked: Record<string, true>;
  joined: Record<string, true>;
  reminders: Record<string, true>;
  helpful: Record<string, true>;
  like: (id: string) => void;
  toggleJoin: (id: string) => boolean;
  toggleReminder: (id: string) => boolean;
  toggleHelpful: (id: string) => void;
}

function toggled(map: Record<string, true>, id: string): Record<string, true> {
  const next = { ...map };
  if (next[id]) delete next[id];
  else next[id] = true;
  return next;
}

export const useCommunityLocal = create<CommunityLocal>()(
  persist(
    (set, get) => ({
      liked: {},
      joined: {},
      reminders: {},
      helpful: {},
      like: (id) => set((s) => ({ liked: { ...s.liked, [id]: true } })),
      toggleJoin: (id) => {
        set((s) => ({ joined: toggled(s.joined, id) }));
        return !!get().joined[id];
      },
      toggleReminder: (id) => {
        set((s) => ({ reminders: toggled(s.reminders, id) }));
        return !!get().reminders[id];
      },
      toggleHelpful: (id) => set((s) => ({ helpful: toggled(s.helpful, id) })),
    }),
    { name: "yuniqo-community" },
  ),
);
