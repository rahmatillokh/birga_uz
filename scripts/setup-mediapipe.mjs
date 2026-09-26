#!/usr/bin/env node
/**
 * YuniQo — «AI video nazorat» uchun MediaPipe fayllarini tayyorlash.
 *
 *  1. node_modules/@mediapipe/tasks-vision/wasm/*  →  public/mediapipe/wasm/
 *  2. Modellar (agar yo‘q bo‘lsa) →  public/mediapipe/pose_landmarker_lite.task
 *                                    public/mediapipe/face_landmarker.task
 *
 * Fayllar mahalliy bo‘lsa, ilova internetsiz ham ishlaydi (ko‘rgazma uchun muhim).
 * Hech narsa topilmasa ham ilova ishlaydi — brauzer CDN’dan yuklab oladi.
 *
 * Skript HECH QACHON xato bilan tugamaydi (postinstall’da ishlaydi).
 * Yuklab olishni o‘tkazib yuborish: MEDIAPIPE_SKIP_DOWNLOAD=1
 */
import { createWriteStream } from "node:fs";
import { copyFile, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PKG_DIR = path.join(ROOT, "node_modules", "@mediapipe", "tasks-vision");
const SRC_WASM = path.join(PKG_DIR, "wasm");
const OUT_DIR = path.join(ROOT, "public", "mediapipe");
const OUT_WASM = path.join(OUT_DIR, "wasm");
const VERSION_FILE = path.join(OUT_WASM, ".version");

const MODELS = [
  {
    file: "pose_landmarker_lite.task",
    url: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    minBytes: 1_000_000,
  },
  {
    file: "face_landmarker.task",
    url: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    minBytes: 1_000_000,
  },
];

const DOWNLOAD_TIMEOUT_MS = 180_000;
const TAG = "[mediapipe]";
const log = (...a) => console.log(TAG, ...a);
const warn = (...a) => console.warn(TAG, ...a);

async function sizeOf(p) {
  try {
    const s = await stat(p);
    return s.isFile() ? s.size : -1;
  } catch {
    return -1;
  }
}

function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 1-qadam: wasm fayllarini nusxalash (versiya yoki hajm o‘zgargan bo‘lsa — qayta) */
async function copyWasm() {
  let files;
  try {
    files = (await readdir(SRC_WASM)).filter((f) => f.endsWith(".js") || f.endsWith(".wasm"));
  } catch {
    warn("@mediapipe/tasks-vision topilmadi — wasm nusxalanmadi (brauzer CDN’dan yuklaydi).");
    return { ok: false, copied: 0 };
  }
  if (files.length === 0) {
    warn("wasm fayllari topilmadi — brauzer CDN’dan yuklaydi.");
    return { ok: false, copied: 0 };
  }

  let version = "unknown";
  try {
    version = JSON.parse(await readFile(path.join(PKG_DIR, "package.json"), "utf8")).version ?? version;
  } catch {
    /* versiya muhim emas */
  }
  let prevVersion = "";
  try {
    prevVersion = (await readFile(VERSION_FILE, "utf8")).trim();
  } catch {
    /* birinchi marta */
  }

  await mkdir(OUT_WASM, { recursive: true });
  let copied = 0;
  let failed = 0;
  for (const f of files) {
    const src = path.join(SRC_WASM, f);
    const dst = path.join(OUT_WASM, f);
    try {
      const [a, b] = await Promise.all([sizeOf(src), sizeOf(dst)]);
      if (prevVersion === version && a === b && b > 0) continue;
      await copyFile(src, dst);
      copied++;
    } catch (e) {
      failed++;
      warn(`${f} nusxalanmadi: ${e instanceof Error ? e.message : e}`);
    }
  }
  if (failed === 0) {
    try {
      await writeFile(VERSION_FILE, `${version}\n`);
    } catch {
      /* ixtiyoriy */
    }
  }
  log(copied > 0 ? `✓ wasm (v${version}): ${copied} ta fayl nusxalandi → public/mediapipe/wasm/` : `✓ wasm (v${version}) allaqachon joyida`);
  return { ok: failed === 0, copied };
}

/** 2-qadam: modelni yuklab olish (vaqtinchalik .part fayl orqali — chala fayl qolmaydi) */
async function downloadModel(m) {
  const dst = path.join(OUT_DIR, m.file);
  const existing = await sizeOf(dst);
  if (existing >= m.minBytes) {
    log(`✓ ${m.file} allaqachon bor (${mb(existing)})`);
    return true;
  }
  if (process.env.MEDIAPIPE_SKIP_DOWNLOAD) {
    warn(`${m.file} yuklab olinmadi (MEDIAPIPE_SKIP_DOWNLOAD) — brauzer CDN’dan yuklaydi.`);
    return false;
  }
  if (typeof fetch !== "function") {
    warn(`Node ${process.version} da fetch yo‘q — ${m.file} yuklab olinmadi (brauzer CDN’dan yuklaydi).`);
    return false;
  }

  const tmp = `${dst}.part`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    await mkdir(OUT_DIR, { recursive: true });
    log(`↓ ${m.file} yuklab olinmoqda…`);
    const res = await fetch(m.url, { signal: ctrl.signal });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
    const got = await sizeOf(tmp);
    const expected = Number(res.headers.get("content-length") ?? 0);
    if (got < m.minBytes || (expected > 0 && got !== expected)) throw new Error(`fayl chala yuklandi (${got} bayt)`);
    await rename(tmp, dst);
    log(`✓ ${m.file} yuklandi (${mb(got)})`);
    return true;
  } catch (e) {
    const reason = ctrl.signal.aborted ? "vaqt tugadi" : e instanceof Error ? e.message : String(e);
    warn(`${m.file} yuklab olinmadi (${reason}) — brauzer uni CDN’dan yuklaydi (internet kerak bo‘ladi).`);
    await rm(tmp, { force: true }).catch(() => {});
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const wasm = await copyWasm().catch((e) => {
    warn(`wasm nusxalashda xatolik: ${e instanceof Error ? e.message : e}`);
    return { ok: false, copied: 0 };
  });
  let modelsOk = true;
  for (const m of MODELS) {
    const ok = await downloadModel(m).catch(() => false);
    modelsOk = modelsOk && ok;
  }
  if (wasm.ok && modelsOk) {
    log("Tayyor! AI video nazorat to‘liq oflayn ishlaydi (video qurilmada tahlil qilinadi).");
  } else {
    log("Ba’zi fayllar tayyor emas — ilova baribir ishlaydi: yetishmagan fayllar brauzerda CDN’dan yuklanadi.");
    log("Keyinroq qayta urinish: npm run setup:mediapipe");
  }
}

main()
  .catch((e) => warn(`kutilmagan xatolik: ${e instanceof Error ? e.message : e}`))
  .finally(() => {
    process.exitCode = 0;
  });
