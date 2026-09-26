"use client";

import { create } from "zustand";

export interface ToastItem {
  id: number;
  text: string;
  tone: "success" | "error" | "info";
  emoji?: string;
}

export const useToasts = create<{ items: ToastItem[]; push: (t: Omit<ToastItem, "id">) => void; remove: (id: number) => void }>((set) => ({
  items: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items.slice(-2), { ...t, id }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((x) => x.id !== id) })), 3200);
  },
  remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (text: string, emoji = "✅") => useToasts.getState().push({ text, tone: "success", emoji }),
  error: (text: string, emoji = "⚠️") => useToasts.getState().push({ text, tone: "error", emoji }),
  info: (text: string, emoji = "💡") => useToasts.getState().push({ text, tone: "info", emoji }),
};
