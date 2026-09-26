"use client";

import { create } from "zustand";
import { DEMO_SPECIALIST_ID } from "@/lib/constants";
import { applyAction } from "@/lib/core/reducer";
import { createSeedDB } from "@/lib/core/seed";
import { specialistView, userView } from "@/lib/core/views";
import type { Action, ActResult, DB, SpecialistView, UserView } from "@/lib/types";
import { apiGet, apiPost } from "./api";
import { haptic, isTelegram } from "./telegram";

type Mode = "telegram" | "demo" | "offline";
type Role = "parent" | "specialist";

interface Reward {
  id: number;
  points: number;
  badges: string[];
  title?: string;
}

interface AppState {
  status: "idle" | "loading" | "ready" | "error";
  mode: Mode;
  aiEnabled: boolean;
  bot: { username: string | null; connected: boolean };
  view: UserView | null;
  role: Role;
  specialistId: string;
  spView: SpecialistView | null;
  reward: Reward | null;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  act: (action: Action, opts?: { silent?: boolean; rewardTitle?: string }) => Promise<ActResult>;
  spAct: (action: Action) => Promise<ActResult>;
  loadSpecialist: (id?: string) => Promise<void>;
  setRole: (r: Role) => void;
  setView: (v: UserView) => void;
  clearReward: () => void;
  resetDemo: () => Promise<void>;
}

// --------------------------------------------------------------------------
// Oflayn rejim (server bo‘lmasa — masalan, statik hosting): brauzer ichida DB
// --------------------------------------------------------------------------
const OFFLINE_KEY = "yuniqo-offline-db";
let offlineDb: DB | null = null;

function loadOffline(): DB {
  if (offlineDb) return offlineDb;
  try {
    const raw = localStorage.getItem(OFFLINE_KEY);
    if (raw) offlineDb = JSON.parse(raw);
  } catch {
    /* ignore */
  }
  if (!offlineDb) offlineDb = createSeedDB();
  return offlineDb;
}
/** Oflayn DB joyida o‘zgaradi — UI yangilanishi uchun har safar nusxa beramiz */
function offlineView(db: DB): UserView {
  return structuredClone(userView(db, "demo"));
}
function offlineSpView(db: DB, id: string): SpecialistView {
  return structuredClone(specialistView(db, id));
}

function saveOffline() {
  try {
    if (offlineDb) localStorage.setItem(OFFLINE_KEY, JSON.stringify(offlineDb));
  } catch {
    /* ignore */
  }
}

const ROLE_KEY = "yuniqo-role";

export const useApp = create<AppState>((set, get) => ({
  status: "idle",
  mode: "demo",
  aiEnabled: false,
  bot: { username: null, connected: false },
  view: null,
  role: "parent",
  specialistId: DEMO_SPECIALIST_ID,
  spView: null,
  reward: null,

  init: async () => {
    if (get().status === "loading" || get().status === "ready") return;
    set({ status: "loading" });
    try {
      const role = (localStorage.getItem(ROLE_KEY) as Role | null) ?? "parent";
      if (role === "specialist" && !isTelegram()) set({ role });
    } catch {
      /* ignore */
    }
    try {
      const r = await apiGet<{ mode: Mode; view: UserView; ai: boolean; bot: AppState["bot"] }>("/api/me");
      set({ status: "ready", mode: r.mode, view: r.view, aiEnabled: r.ai, bot: r.bot });
    } catch {
      const db = loadOffline();
      set({ status: "ready", mode: "offline", view: offlineView(db) });
      saveOffline();
    }
  },

  refresh: async () => {
    const { mode } = get();
    if (mode === "offline") {
      set({ view: offlineView(loadOffline()) });
      return;
    }
    try {
      const r = await apiGet<{ view: UserView }>("/api/me");
      set({ view: r.view });
    } catch {
      /* tarmoq xatosi — eski ma’lumot qoladi */
    }
  },

  act: async (action, opts) => {
    let result: ActResult;
    if (get().mode === "offline") {
      const db = loadOffline();
      result = applyAction(db, { type: "user", uid: "demo" }, action);
      saveOffline();
      set({ view: offlineView(db) });
    } else {
      const { data } = await apiPost<{ result: ActResult; view?: UserView; error?: string }>("/api/act", { action });
      result = data.result ?? { ok: false, error: data.error ?? "Xatolik" };
      if (data.view) set({ view: data.view });
    }
    if (result.ok && !opts?.silent && ((result.pointsEarned ?? 0) > 0 || (result.newBadges?.length ?? 0) > 0)) {
      haptic("success");
      set({ reward: { id: Date.now(), points: result.pointsEarned ?? 0, badges: result.newBadges ?? [], title: opts?.rewardTitle } });
    }
    if (!result.ok) haptic("error");
    return result;
  },

  spAct: async (action) => {
    const id = get().specialistId;
    if (get().mode === "offline") {
      const db = loadOffline();
      const result = applyAction(db, { type: "specialist", id }, action);
      saveOffline();
      set({ spView: offlineSpView(db, id), view: offlineView(db) });
      return result;
    }
    const { data } = await apiPost<{ result: ActResult; spView?: SpecialistView }>("/api/act", { action, as: { type: "specialist", id } });
    if (data.spView) set({ spView: data.spView });
    return data.result ?? { ok: false, error: "Xatolik" };
  },

  loadSpecialist: async (id) => {
    const spId = id ?? get().specialistId;
    set({ specialistId: spId });
    if (get().mode === "offline") {
      set({ spView: offlineSpView(loadOffline(), spId) });
      return;
    }
    try {
      const r = await apiGet<{ spView: SpecialistView }>(`/api/specialist/${spId}`);
      set({ spView: r.spView });
    } catch {
      set({ spView: offlineSpView(loadOffline(), spId) });
    }
  },

  setRole: (role) => {
    set({ role });
    try {
      localStorage.setItem(ROLE_KEY, role);
    } catch {
      /* ignore */
    }
  },

  setView: (view) => set({ view }),
  clearReward: () => set({ reward: null }),

  resetDemo: async () => {
    if (get().mode === "offline") {
      offlineDb = createSeedDB();
      saveOffline();
      set({ view: offlineView(offlineDb), spView: null });
      return;
    }
    await apiPost("/api/demo/reset", {});
    set({ spView: null });
    await get().refresh();
  },
}));
