"use client";

/** Telegram Mini App (WebApp) bilan ishlash uchun yordamchilar */

type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";

interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string }; start_param?: string };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  isExpanded: boolean;
  ready(): void;
  expand(): void;
  close(): void;
  setHeaderColor(c: string): void;
  setBackgroundColor(c: string): void;
  enableClosingConfirmation?(): void;
  disableVerticalSwipes?(): void;
  openLink(url: string, opts?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  showAlert?(msg: string): void;
  BackButton: { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void; isVisible: boolean };
  HapticFeedback?: {
    impactOccurred(style: HapticStyle): void;
    notificationOccurred(type: "error" | "success" | "warning"): void;
    selectionChanged(): void;
  };
  isVersionAtLeast?(v: string): boolean;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

const KEY = "yq_tg_init";

export function tg(): TgWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window.Telegram?.WebApp;
  return w && (w.initData || w.platform !== "unknown") ? w : undefined;
}

/** initData: skript yuklangan bo‘lsa undan, aks holda URL hash’dan (tgWebAppData) */
export function tgInitData(): string {
  if (typeof window === "undefined") return "";
  const fromSdk = window.Telegram?.WebApp?.initData;
  if (fromSdk) return fromSdk;
  try {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const fromHash = hash.get("tgWebAppData");
    if (fromHash) {
      sessionStorage.setItem(KEY, fromHash);
      return fromHash;
    }
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function isTelegram(): boolean {
  return !!tgInitData();
}

export function tgUser() {
  const data = tgInitData();
  if (!data) return undefined;
  try {
    return JSON.parse(new URLSearchParams(data).get("user") ?? "null") as TgWebApp["initDataUnsafe"]["user"];
  } catch {
    return undefined;
  }
}

export function haptic(kind: HapticStyle | "success" | "error" | "warning" | "select" = "light") {
  const h = tg()?.HapticFeedback;
  if (!h) return;
  try {
    if (kind === "success" || kind === "error" || kind === "warning") h.notificationOccurred(kind);
    else if (kind === "select") h.selectionChanged();
    else h.impactOccurred(kind);
  } catch {
    /* eski versiyalar */
  }
}

export function setupTelegram() {
  const w = tg();
  if (!w) return;
  try {
    w.ready();
    w.expand();
    w.setHeaderColor("#f3f8fd");
    w.setBackgroundColor("#f3f8fd");
    w.disableVerticalSwipes?.();
  } catch {
    /* ignore */
  }
}

/** Tashqi havolani ochish (Telegram ichida — Telegram orqali) */
export function openExternal(url: string) {
  const w = tg();
  if (w) {
    if (url.startsWith("https://t.me/")) w.openTelegramLink(url);
    else w.openLink(url);
  } else {
    window.open(url, "_blank", "noopener");
  }
}
