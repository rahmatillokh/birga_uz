import fs from "node:fs";
import path from "node:path";
import { createSeedDB, DB_VERSION } from "@/lib/core/seed";
import { DEMO_UID } from "@/lib/constants";
import type { DB } from "@/lib/types";

/**
 * Oddiy JSON-fayl ma’lumotlar bazasi (ko‘rgazma / MVP uchun).
 * Bitta Node jarayoni ichida globalThis orqali saqlanadi, o‘zgarishlar fayllarga yoziladi.
 * Keyingi bosqichda PostgreSQL bilan almashtirish oson: barcha o‘zgarishlar applyAction() orqali o‘tadi.
 */
const FILE = process.env.YUNIQO_DB_FILE || path.join(process.cwd(), ".data", "db.json");

type Store = { db: DB; timer?: ReturnType<typeof setTimeout>; writable: boolean };
const g = globalThis as unknown as { __yuniqo?: Store };

function load(): DB {
  try {
    if (fs.existsSync(FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FILE, "utf8")) as DB;
      if (parsed.version === DB_VERSION) return parsed;
    }
  } catch (e) {
    console.warn("[db] faylni o‘qib bo‘lmadi, yangi seed yaratiladi:", e);
  }
  return createSeedDB();
}

function store(): Store {
  if (!g.__yuniqo) {
    g.__yuniqo = { db: load(), writable: true };
    persistNow();
  }
  return g.__yuniqo;
}

export function getDB(): DB {
  return store().db;
}

function persistNow() {
  const s = g.__yuniqo;
  if (!s || !s.writable) return;
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(s.db));
    fs.renameSync(tmp, FILE);
  } catch (e) {
    s.writable = false;
    console.warn("[db] faylga yozib bo‘lmadi — ma’lumotlar faqat xotirada saqlanadi:", (e as Error).message);
  }
}

/** O‘zgarishlardan keyin chaqiriladi (300 ms debounce) */
export function saveDB() {
  const s = store();
  if (s.timer) clearTimeout(s.timer);
  s.timer = setTimeout(persistNow, 300);
}

const SEED_UIDS = new Set([DEMO_UID, "u-mock-1", "u-mock-2", "u-mock-3"]);

/**
 * Demo ma’lumotlarni boshlang‘ich holatga qaytarish.
 * Haqiqiy Telegram foydalanuvchilarining ma’lumotlari saqlanib qoladi.
 */
/** Hammasini tozalab, noldan seed (ko‘rgazmadan oldin: /api/demo/reset?all=1) */
export function resetAll(): DB {
  const fresh = createSeedDB();
  store().db = fresh;
  persistNow();
  return fresh;
}

export function resetDemo(): DB {
  const old = getDB();
  const fresh = createSeedDB();
  const realChildIds = new Set(old.children.filter((c) => !SEED_UIDS.has(c.ownerUid)).map((c) => c.id));
  for (const [uid, u] of Object.entries(old.users)) if (!SEED_UIDS.has(uid)) fresh.users[uid] = u;
  fresh.children.push(...old.children.filter((c) => realChildIds.has(c.id)));
  fresh.assessments.push(...old.assessments.filter((a) => realChildIds.has(a.childId)));
  fresh.activities.push(...old.activities.filter((a) => realChildIds.has(a.childId)));
  fresh.plans.push(...old.plans.filter((p) => realChildIds.has(p.childId)));
  fresh.assignments.push(...old.assignments.filter((a) => realChildIds.has(a.childId)));
  fresh.notes.push(...old.notes.filter((n) => realChildIds.has(n.childId)));
  fresh.shares.push(...old.shares.filter((s) => !SEED_UIDS.has(s.uid)));
  fresh.bookings.push(...old.bookings.filter((b) => !SEED_UIDS.has(b.uid)));
  fresh.orders.push(...old.orders.filter((o) => !SEED_UIDS.has(o.uid)));
  fresh.posts = old.posts.filter((p) => !p.authorUid || !SEED_UIDS.has(p.authorUid));
  store().db = fresh;
  persistNow();
  return fresh;
}
