"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCart = create<{
  items: Record<string, number>;
  add: (id: string, qty?: number) => void;
  set: (id: string, qty: number) => void;
  clear: () => void;
}>()(
  persist(
    (set) => ({
      items: {},
      add: (id, qty = 1) => set((s) => ({ items: { ...s.items, [id]: (s.items[id] ?? 0) + qty } })),
      set: (id, qty) =>
        set((s) => {
          const items = { ...s.items };
          if (qty <= 0) delete items[id];
          else items[id] = qty;
          return { items };
        }),
      clear: () => set({ items: {} }),
    }),
    { name: "yuniqo-cart" },
  ),
);
