import type { Bot } from "grammy";
import { REGIONS, districtLabel } from "@/data/regions";
import type { UserView } from "@/lib/types";
import type { BotContext } from "./context";
import { districtIndex, regionIndex } from "./data";
import { btn, chunk, esc, kb, render, type Btn } from "./ui";

/** Hudud → tuman tanlash (sahifalangan) — bir nechta bo‘limda qayta ishlatiladi */

const PER_PAGE = 12;

/** "Andijon viloyati" → "Andijon"; Toshkent shahri/viloyati o‘zgarmaydi */
export function shortRegion(name: string): string {
  return name.startsWith("Toshkent") ? name : name.replace(/ (viloyati|Respublikasi)$/, "");
}

export function regionRows(prefix: string, selectedId?: string): Btn[][] {
  return chunk(
    REGIONS.map((r, i) => btn(`${r.id === selectedId ? "📍 " : ""}${shortRegion(r.name)}`, `${prefix}:r:${i}`)),
    2,
  );
}

export function districtRows(prefix: string, rIdx: number, page: number, selected?: string): Btn[][] {
  const region = REGIONS[rIdx];
  if (!region) return [];
  const pages = Math.max(1, Math.ceil(region.districts.length / PER_PAGE));
  const p = Math.min(Math.max(0, page), pages - 1);
  const items = region.districts
    .slice(p * PER_PAGE, (p + 1) * PER_PAGE)
    .map((d, j) => btn(`${d === selected ? "📍 " : ""}${d}`, `${prefix}:d:${rIdx}:${p * PER_PAGE + j}`));
  const rows: Btn[][] = chunk(items, 2);
  if (pages > 1) {
    rows.push([
      p > 0 ? btn("◀️ Oldingi", `${prefix}:dp:${rIdx}:${p - 1}`) : undefined,
      btn(`${p + 1}/${pages}`, "noop"),
      p < pages - 1 ? btn("Keyingi ▶️", `${prefix}:dp:${rIdx}:${p + 1}`) : undefined,
    ]);
  }
  rows.push([btn("⬅️ Hududlar", `${prefix}:rs`)]);
  return rows;
}

/** Profildagi tuman bo‘yicha tezkor tugma: «📍 Mening tumanim: Chilonzor» */
export function myDistrictRows(view: UserView, prefix: string): Btn[][] {
  const r = regionIndex(view.user.region);
  const d = districtIndex(view.user.region, view.user.district);
  if (r < 0 || d < 0 || !view.user.district) return [];
  return [[btn(`📍 Mening tumanim: ${districtLabel(view.user.district)}`, `${prefix}:d:${r}:${d}`)]];
}

export interface PickerOptions {
  /** Hududlar ro‘yxati sarlavhasi */
  regionsText: string;
  /** Tumanlar sarlavhasi */
  districtsText?: (regionName: string) => string;
  /** Hududlar ustidan qo‘shimcha tugmalar (masalan «📍 Mening tumanim») */
  topRows?: (ctx: BotContext) => Promise<Btn[][]> | Btn[][];
  /** Hududlar ostidan qo‘shimcha tugmalar (masalan «⬅️ Orqaga») */
  bottomRows?: Btn[][];
  onDistrict: (ctx: BotContext, regionId: string, district: string) => Promise<void>;
}

const registry = new Map<string, PickerOptions>();

export async function showRegions(ctx: BotContext, prefix: string, text?: string, selectedId?: string): Promise<void> {
  const opts = registry.get(prefix);
  const top = opts?.topRows ? await opts.topRows(ctx) : [];
  await render(
    ctx,
    text ?? opts?.regionsText ?? "📍 <b>Hududni tanlang</b>",
    kb([...top, ...regionRows(prefix, selectedId), ...(opts?.bottomRows ?? [])]),
  );
}

export async function showDistricts(ctx: BotContext, prefix: string, rIdx: number, page = 0): Promise<void> {
  const region = REGIONS[rIdx];
  if (!region) return showRegions(ctx, prefix);
  const opts = registry.get(prefix);
  const title = opts?.districtsText?.(region.name) ?? `🏘 <b>${esc(region.name)}</b>\nTuman yoki shaharni tanlang:`;
  await render(ctx, title, kb(districtRows(prefix, rIdx, page)));
}

/** prefix:rs, prefix:r:<i>, prefix:dp:<i>:<page>, prefix:d:<i>:<j> callback’larini ro‘yxatdan o‘tkazadi */
export function registerPicker(bot: Bot<BotContext>, prefix: string, opts: PickerOptions): void {
  registry.set(prefix, opts);
  bot.callbackQuery(`${prefix}:rs`, (ctx) => showRegions(ctx, prefix));
  bot.callbackQuery(new RegExp(`^${prefix}:r:(\\d+)$`), (ctx) => showDistricts(ctx, prefix, Number(ctx.match[1]), 0));
  bot.callbackQuery(new RegExp(`^${prefix}:dp:(\\d+):(\\d+)$`), (ctx) =>
    showDistricts(ctx, prefix, Number(ctx.match[1]), Number(ctx.match[2])),
  );
  bot.callbackQuery(new RegExp(`^${prefix}:d:(\\d+):(\\d+)$`), async (ctx) => {
    const region = REGIONS[Number(ctx.match[1])];
    const district = region?.districts[Number(ctx.match[2])];
    if (!region || !district) return showRegions(ctx, prefix);
    await opts.onDistrict(ctx, region.id, district);
  });
}
