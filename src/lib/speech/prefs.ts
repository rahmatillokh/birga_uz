/**
 * Talaffuz rejimi sozlamalari (kichik tashqi store — useSyncExternalStore uchun):
 * - preferManual: ota-ona baholash rejimi qo‘lda tanlangan (localStorage)
 * - aiBroken: shu seansda nutqni tanib olish ishlamadi (sessionStorage)
 */

const MANUAL_KEY = "yq-speech-manual";
const BROKEN_KEY = "yq-speech-ai-broken";
const listeners = new Set<() => void>();

function read(kind: "local" | "session", key: string): boolean {
  try {
    return (kind === "local" ? localStorage : sessionStorage).getItem(key) === "1";
  } catch {
    return false;
  }
}

function write(kind: "local" | "session", key: string, value: boolean) {
  try {
    const s = kind === "local" ? localStorage : sessionStorage;
    if (value) s.setItem(key, "1");
    else s.removeItem(key);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function subscribeSpeechPrefs(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Primitiv (satr) qaytaramiz — useSyncExternalStore uchun barqaror qiymat */
export function speechPrefsSnapshot(): string {
  return `${read("local", MANUAL_KEY) ? 1 : 0}${read("session", BROKEN_KEY) ? 1 : 0}`;
}

export function setPreferManual(v: boolean) {
  write("local", MANUAL_KEY, v);
}

export function setAiBroken(v: boolean) {
  write("session", BROKEN_KEY, v);
}
