/**
 * Muhit o‘zgaruvchilarini yuklash. index.ts da ENG BIRINCHI import qilinadi —
 * boshqa modullar process.env ni o‘qishidan oldin.
 * Tartib: .env.local (ustun) → .env. Mavjud muhit o‘zgaruvchilari ustiga yozilmaydi.
 */
import path from "node:path";
import { config } from "dotenv";

config({
  path: [".env.local", ".env"].map((f) => path.resolve(process.cwd(), f)),
  quiet: true,
});
