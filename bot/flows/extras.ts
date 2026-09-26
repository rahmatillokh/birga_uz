import type { Bot } from "grammy";
import { GROUPS } from "@/data/community";
import { NEWS } from "@/data/news";
import { PRODUCTS } from "@/data/products";
import { getSpecialist } from "@/data/specialists";
import { VIDEOS } from "@/data/videos";
import { DOMAINS, DOMAIN_ORDER, PREMIUM_FEATURES, PREMIUM_PRICES, SPECIALTIES, VIDEO_CATEGORIES } from "@/lib/constants";
import type { Domain, UserView, VideoCategory } from "@/lib/types";
import { formatDate, formatMoney, formatNumber, todayKey } from "@/lib/utils";
import { actAs, viewOf } from "../api";
import { communityUrl } from "../config";
import type { BotContext } from "../context";
import { activeChild, childData, isPremium } from "../data";
import { screens } from "../nav";
import { appBtn, btn, chunk, clip, esc, kb, longDate, render, toast, urlBtn, type Btn } from "../ui";

/**
 * 13. 👨‍👩‍👧 Hamjamiyat · 14. 🎥 Videolar · 15. 🛒 Market · 16. 💎 Premium · 18. 📢 Yangiliklar
 */
export function registerExtras(bot: Bot<BotContext>): void {
  screens.set("com", openCommunity);
  screens.set("vid", openVideos);
  screens.set("mkt", openMarket);
  screens.set("pm", (ctx) => openPremium(ctx));
  screens.set("news", (ctx) => openNews(ctx, 0));

  bot.callbackQuery(/^nw:(\d+)$/, (ctx) => openNews(ctx, Number(ctx.match[1])));
  bot.callbackQuery("pm:trial", async (ctx) => {
    const view = await viewOf(ctx);
    if (isPremium(view)) {
      toast(ctx, "💎 Premium allaqachon faol");
      await openPremium(ctx, view);
      return;
    }
    const { result, view: v2 } = await actAs(ctx, { type: "user.premium", plan: "premium", trial: true });
    if (!result.ok) {
      toast(ctx, result.error ?? "Faollashtirib bo‘lmadi", true);
      return;
    }
    toast(ctx, "🎁 7 kunlik Premium faollashtirildi!");
    await openPremium(ctx, v2, true);
  });
}

/** Faol bolaning eng zaif yo‘nalishlari (oxirgi baholash bo‘yicha) */
function weakDomains(view: UserView, n = 2): { childName?: string; domains: Domain[] } {
  const child = activeChild(view);
  const latest = child ? childData(view, child.id).latest : undefined;
  if (!child || !latest) return { domains: [] };
  return { childName: child.name, domains: [...DOMAIN_ORDER].sort((a, b) => latest.scores[a] - latest.scores[b]).slice(0, n) };
}

// ---------------------------------------------------------------------------
// 13. Hamjamiyat
// ---------------------------------------------------------------------------

async function openCommunity(ctx: BotContext): Promise<void> {
  const lines = [
    "👨‍👩‍👧 <b>Ota-onalar hamjamiyati</b>",
    "",
    "Siz yolg‘iz emassiz 💙 Bu yerda ota-onalar tajriba almashadi, mutaxassislar savollarga javob beradi, hududingizdagi oilalar bilan tanishasiz.",
  ];
  if (GROUPS.length) {
    const members = GROUPS.reduce((s, g) => s + g.members, 0);
    lines.push("", `👥 <b>${formatNumber(members)}</b> ota-ona · ${GROUPS.length} ta guruh`);
    for (const g of [...GROUPS].sort((a, b) => b.members - a.members).slice(0, 5)) {
      lines.push(`${g.emoji} ${esc(g.name)} — ${formatNumber(g.members)} a’zo`);
    }
  }
  lines.push("", "📌 Qoidalar: hurmat, maxfiylik va faqat foydali maslahatlar.");
  const tg = urlBtn("💬 Telegram guruhiga qo‘shilish", communityUrl());
  const app = appBtn("👨‍👩‍👧 Ilovada hamjamiyat", "/community");
  if (!tg && !app) lines.push("", "ℹ️ Hamjamiyat havolasi tez orada qo‘shiladi.");
  await render(ctx, lines.join("\n"), kb([[tg], [app]]));
}

// ---------------------------------------------------------------------------
// 14. Videolar
// ---------------------------------------------------------------------------

async function openVideos(ctx: BotContext): Promise<void> {
  const view = await viewOf(ctx);
  const weak = weakDomains(view, 2);
  const cats = Object.entries(VIDEO_CATEGORIES) as [VideoCategory, (typeof VIDEO_CATEGORIES)[VideoCategory]][];
  const count = (id: VideoCategory) => VIDEOS.filter((v) => v.category === id).length;
  const recommended = cats.filter(([, c]) => weak.domains.includes(c.domain)).map(([id]) => id);

  const lines = [
    "🎥 <b>Rivojlantiruvchi videolar</b>",
    "",
    "Nutq, motorika, diqqat va kundalik ko‘nikmalar bo‘yicha qisqa videodarslar — bola bilan birga ko‘ring va takrorlang.",
  ];
  if (VIDEOS.length) lines.push("", `📚 Jami: <b>${VIDEOS.length} ta</b> video`);
  if (weak.childName && recommended.length) {
    lines.push("", `💡 ${esc(weak.childName)} uchun tavsiya: ${recommended.map((id) => `${VIDEO_CATEGORIES[id].emoji} ${VIDEO_CATEGORIES[id].label}`).join(", ")}`);
  }
  const buttons = cats.map(([id, c]) => {
    const n = count(id);
    return appBtn(`${recommended.includes(id) ? "⭐ " : ""}${c.emoji} ${c.label}${n ? ` (${n})` : ""}`, `/videos?category=${id}`);
  });
  if (!buttons.some(Boolean)) {
    lines.push("", "Kategoriyalar:", ...cats.map(([id, c]) => `${c.emoji} ${c.label}${count(id) ? ` — ${count(id)} ta` : ""}`));
    lines.push("", "ℹ️ Videolarni ko‘rish uchun YuniQo ilovasini oching.");
  } else {
    lines.push("", "Kategoriyani tanlang 👇");
  }
  await render(ctx, lines.join("\n"), kb([...chunk(buttons.filter(Boolean) as Btn[], 2), [appBtn("🎬 Barcha videolar", "/videos")]]));
}

// ---------------------------------------------------------------------------
// 15. Market
// ---------------------------------------------------------------------------

async function openMarket(ctx: BotContext): Promise<void> {
  const view = await viewOf(ctx);
  const weak = weakDomains(view, 2);
  const picks = PRODUCTS.filter((p) => p.inStock)
    .map((p) => ({
      p,
      score: (p.recommendedBy ? 2 : 0) + (p.domains.some((d) => weak.domains.includes(d)) ? 3 : 0) + p.rating / 5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.p);

  const lines = ["🛒 <b>YuniQo Market</b>", "", "Mutaxassislar tavsiya qilgan rivojlantiruvchi o‘yinchoqlar, logopedik va didaktik materiallar."];
  if (weak.childName && weak.domains.length) {
    lines.push("", `💡 ${esc(weak.childName)} uchun tanlov: ${weak.domains.map((d) => `${DOMAINS[d].emoji} «${DOMAINS[d].label}»`).join(" va ")} yo‘nalishlari`);
  }
  lines.push("");
  picks.forEach((p, i) => {
    const sp = getSpecialist(p.recommendedBy);
    lines.push(`${i + 1}. ${p.emoji} <b>${esc(p.title)}</b>`);
    lines.push(`     💰 <b>${formatMoney(p.price)}</b>${p.oldPrice ? ` <s>${formatMoney(p.oldPrice)}</s>` : ""} · ⭐ ${p.rating} (${p.reviews})`);
    lines.push(`     ${esc(clip(p.description, 120))}`);
    if (sp) lines.push(`     👩‍⚕️ Tavsiya: ${esc(sp.name)}, ${SPECIALTIES[sp.specialty].label.toLowerCase()}`);
    lines.push("");
  });
  if (!picks.length) lines.push("Mahsulotlar tez orada qo‘shiladi.", "");
  lines.push("💳 To‘lov: Click, Payme, Uzum yoki naqd pul.");
  const app = appBtn("🛒 Marketni ochish", "/market");
  if (!app) lines.push("", "ℹ️ Buyurtma berish uchun YuniQo ilovasini oching.");
  await render(ctx, lines.join("\n"), kb([[app]]));
}

// ---------------------------------------------------------------------------
// 16. Premium
// ---------------------------------------------------------------------------

function mark(v: boolean | string): string {
  if (v === true) return "✅";
  if (v === false) return "—";
  return v;
}

async function openPremium(ctx: BotContext, v?: UserView, justActivated = false): Promise<void> {
  const view = v ?? (await viewOf(ctx));
  const active = isPremium(view);
  const p = view.user.premium;
  const lines: string[] = [];
  if (justActivated) lines.push("🎉 <b>Tabriklaymiz! 7 kunlik bepul Premium faollashtirildi.</b>", "");
  lines.push("💎 <b>YuniQo Premium</b>");
  if (active) {
    lines.push(`✅ Sizda Premium faol${p.trial ? " (sinov davri)" : ""}${p.until ? ` — ${formatDate(p.until, { year: true })} gacha` : ""}.`);
    if (p.consultationsLeft) lines.push(`📞 Bepul konsultatsiyalar: ${p.consultationsLeft} ta`);
  } else {
    lines.push("Bolangiz rivojlanishi uchun barcha imkoniyatlar — bitta obunada.");
  }
  lines.push("", "<b>Bepul</b> va <b>Premium</b> imkoniyatlari:");
  for (const f of PREMIUM_FEATURES) {
    lines.push(`${f.emoji} ${esc(f.title)}`, `     Bepul: ${esc(mark(f.free))} · Premium: <b>${esc(mark(f.premium))}</b>`);
  }
  const yearly = PREMIUM_PRICES.year;
  const save = Math.round((1 - yearly / (PREMIUM_PRICES.month * 12)) * 100);
  lines.push(
    "",
    "💳 <b>Narxlar:</b>",
    `• Oylik — <b>${formatMoney(PREMIUM_PRICES.month)}</b>`,
    `• Yillik — <b>${formatMoney(yearly)}</b> (oyiga ${formatMoney(Math.round(yearly / 12))}, ${save}% tejaysiz)`,
    `• Qo‘shimcha konsultatsiya — ${formatMoney(PREMIUM_PRICES.consultation)}`,
  );
  if (!active) lines.push("", "🎁 7 kun bepul sinab ko‘ring — karta talab qilinmaydi.");
  await render(
    ctx,
    lines.join("\n"),
    kb([
      [active ? undefined : btn("🎁 7 kun bepul sinash", "pm:trial")],
      [appBtn(active ? "💎 Obunani boshqarish" : "💳 Sotib olish", "/premium")],
    ]),
  );
}

// ---------------------------------------------------------------------------
// 18. Yangiliklar va tadbirlar
// ---------------------------------------------------------------------------

const NEWS_PER_PAGE = 4;

async function openNews(ctx: BotContext, page: number): Promise<void> {
  const today = todayKey();
  const items = [...NEWS].sort((a, b) => b.date.localeCompare(a.date));
  const pages = Math.max(1, Math.ceil(items.length / NEWS_PER_PAGE));
  const p = Math.min(Math.max(0, page), pages - 1);
  const lines = ["📢 <b>YuniQo yangiliklari va tadbirlar</b>", ""];
  if (!items.length) lines.push("Hozircha yangiliklar yo‘q — tez orada qiziqarli xabarlar bilan qaytamiz!");
  for (const n of items.slice(p * NEWS_PER_PAGE, (p + 1) * NEWS_PER_PAGE)) {
    const upcoming = n.type === "tadbir" && n.date.slice(0, 10) >= today;
    const when = upcoming ? `🗓️ Kelgusi tadbir · ${longDate(n.date)}` : `${n.type === "tadbir" ? "Tadbir" : "Yangilik"} · ${formatDate(n.date, { year: true })}`;
    lines.push(`${n.emoji} <b>${esc(n.title)}</b>`, `<i>${when}</i>`, esc(clip(n.text, 260)), "");
  }
  if (items.some((n) => n.type === "tadbir" && n.date.slice(0, 10) >= today)) lines.push("🗓️ — kelgusi tadbir");
  const nav: Btn[] = [];
  if (p > 0) nav.push(btn("◀️ Yangiroq", `nw:${p - 1}`));
  if (pages > 1) nav.push(btn(`${p + 1}/${pages}`, "noop"));
  if (p < pages - 1) nav.push(btn("Oldingi ▶️", `nw:${p + 1}`));
  await render(ctx, lines.join("\n").trim(), kb([nav, [appBtn("🚀 Ilovada ko‘rish", "/")]]));
}
