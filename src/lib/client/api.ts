"use client";

import { tgInitData } from "./telegram";

export function authHeaders(): Record<string, string> {
  const init = tgInitData();
  return init ? { "x-tg-init-data": init } : {};
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function apiPost<T>(url: string, body: unknown): Promise<{ status: number; data: T }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

/** Oqimli matn (AI chat) */
export async function apiStream(url: string, body: unknown, onChunk: (full: string) => void, signal?: AbortSignal): Promise<{ text: string; mode: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`${res.status}`);
  const mode = res.headers.get("x-ai-mode") ?? "demo";
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += dec.decode(value, { stream: true });
    onChunk(text);
  }
  return { text, mode };
}
