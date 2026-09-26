"use client";

import { useApp } from "@/lib/client/store";
import type { Action, ActResult } from "@/lib/types";

/** act() — tarmoq uzilganda ham istisno otmaydi, xatoni natija sifatida qaytaradi */
export async function safeAct(action: Action, opts?: { silent?: boolean; rewardTitle?: string }): Promise<ActResult> {
  try {
    return await useApp.getState().act(action, opts);
  } catch {
    return { ok: false, error: "Aloqa uzildi. Internetni tekshirib, qayta urinib ko‘ring" };
  }
}
