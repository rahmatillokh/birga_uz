import { regionName } from "@/data/regions";
import { adminAllowed } from "@/server/admin";
import { getDB } from "@/server/db";
import { dayKey, todayKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Ko‘rgazma paneli: jonli statistika (shaxsiy ma’lumotlarsiz) */
export async function GET(req: Request) {
  if (!adminAllowed(req)) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const db = getDB();
  const today = todayKey();
  const tgUsers = Object.values(db.users).filter((u) => u.uid.startsWith("tg:"));
  const tgUids = new Set(tgUsers.map((u) => u.uid));
  const tgChildren = db.children.filter((c) => tgUids.has(c.ownerUid));
  const tgChildIds = new Set(tgChildren.map((c) => c.id));
  const byRegion = new Map<string, number>();
  for (const c of tgChildren) {
    const r = regionName(c.region ?? db.users[c.ownerUid]?.region) || "Ko‘rsatilmagan";
    byRegion.set(r, (byRegion.get(r) ?? 0) + 1);
  }
  const feed = [
    ...tgUsers.map((u) => ({ at: u.createdAt, text: `👋 ${u.name.split(" ")[0]} YuniQo’ga qo‘shildi` })),
    ...tgChildren.map((c) => ({ at: c.createdAt, text: `👶 Yangi bola profili: ${c.avatar} ${c.name}` })),
    ...db.assessments.filter((a) => tgChildIds.has(a.childId)).map((a) => ({ at: a.at, text: `🧠 Rivojlanish baholashi yakunlandi (${a.overall}%) ${a.source === "bot" ? "· bot" : "· ilova"}` })),
    ...db.bookings.filter((b) => tgUids.has(b.uid)).map((b) => ({ at: b.createdAt, text: b.kind === "session" ? "🏢 Bepul sessiyaga yozilish" : "📞 Mutaxassis konsultatsiyasiga so‘rov" })),
    ...db.activities
      .filter((a) => tgChildIds.has(a.childId) && a.kind !== "assessment")
      .slice(-40)
      .map((a) => ({ at: a.at, text: `${a.kind === "ai_check" ? "📹" : a.kind === "game" ? "🎮" : a.kind === "speech" ? "🎙️" : a.kind === "lesson" ? "✨" : "🎯"} ${a.title}` })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 25);
  return Response.json({
    users: tgUsers.length,
    usersToday: tgUsers.filter((u) => dayKey(u.createdAt) === today).length,
    children: tgChildren.length,
    assessments: db.assessments.filter((a) => tgChildIds.has(a.childId)).length,
    activities: db.activities.filter((a) => tgChildIds.has(a.childId)).length,
    activitiesToday: db.activities.filter((a) => tgChildIds.has(a.childId) && dayKey(a.at) === today).length,
    bookings: db.bookings.filter((b) => tgUids.has(b.uid) && b.status !== "bekor").length,
    shares: db.shares.filter((s) => tgUids.has(s.uid)).length,
    premium: tgUsers.filter((u) => u.premium.plan === "premium").length,
    byRegion: Array.from(byRegion.entries()).sort((a, b) => b[1] - a[1]),
    feed,
    bot: { connected: !!process.env.TELEGRAM_BOT_TOKEN, username: process.env.TELEGRAM_BOT_USERNAME || "YuniQo_bot" },
  });
}
