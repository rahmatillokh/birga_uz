import { GrammyError, type Bot, type InlineKeyboard } from "grammy";
import { sessionsForDistrict } from "@/data/sessions";
import { getSpecialist } from "@/data/specialists";
import { SESSION_TYPES } from "@/lib/constants";
import { todayTasks } from "@/lib/core/stats";
import type { UserView } from "@/lib/types";
import { addDays, sleep, tashkentTime, todayKey } from "@/lib/utils";
import { act, ApiDown, getReminders, type ReminderUser } from "./api";
import type { BotContext } from "./context";
import { childData, findSession } from "./data";
import { appBtn, btn, esc, kb, pad2 } from "./ui";

/**
 * 5. 🔔 Kunlik eslatmalar: har daqiqa boshida Toshkent vaqti bo‘yicha
 * GET /api/bot/reminders?hhmm=HH:MM&weekday=N → har bir foydalanuvchiga xabar.
 * 429 (retry_after) va botni bloklagan foydalanuvchilar hisobga olinadi.
 */

// ---------------------------------------------------------------------------
// Xabar matni (scheduler va «Namuna ko‘rish» uchun umumiy)
// ---------------------------------------------------------------------------

/** API bilan bir xil tuzilma — UserView dan (namunani oldindan ko‘rish uchun) */
export function reminderFromView(view: UserView): ReminderUser {
  const u = view.user;
  const tomorrow = addDays(todayKey(), 1);
  return {
    tgId: u.tgId ?? 0,
    name: u.name,
    types: u.reminders.types,
    children: view.children.map((c) => {
      const d = childData(view, c.id);
      const tasks = todayTasks(d.plan, d.assignments, d.activities);
      return {
        childName: c.name,
        avatar: c.avatar,
        left: tasks
          .filter((t) => !t.done)
          .map((t) => ({ emoji: t.exercise.emoji, title: t.exercise.title, durationMin: t.exercise.durationMin, fromSpecialist: !!t.assignedBy })),
        done: tasks.filter((t) => t.done).length,
      };
    }),
    bookingsTomorrow: view.bookings.filter((b) => b.date === tomorrow && b.status !== "bekor"),
    sessionTomorrow:
      u.sessionAlerts && u.region && u.district && u.reminders.types.sessions
        ? sessionsForDistrict(u.region, u.district).find((s) => s.date === tomorrow)
        : undefined,
  };
}

function greeting(): string {
  const { hh } = tashkentTime();
  if (hh < 11) return "Xayrli tong";
  if (hh < 17) return "Xayrli kun";
  return "Xayrli kech";
}

/** Eslatma xabari. Aytadigan gap bo‘lmasa (hammasi bajarilgan, yozilish yo‘q) — null */
export function reminderMessage(u: ReminderUser): { text: string; markup?: InlineKeyboard } | null {
  const first = u.name.split(" ")[0] || "";
  const lines: string[] = [
    u.daily === false
      ? `🏢 <b>${greeting()}${first ? `, ${esc(first)}` : ""}!</b> Tumaningizdagi YuniQo sessiyasi haqida xabar`
      : `🔔 <b>${greeting()}${first ? `, ${esc(first)}` : ""}!</b> Mashg‘ulot vaqti keldi ⏰`,
    "",
  ];
  let hasContent = false;
  let hasSpecialist = false;

  for (const c of u.children) {
    const left = c.left.filter((t) => (t.fromSpecialist ? u.types.specialist !== false : u.types.daily !== false));
    if (!left.length) {
      if (c.done > 0 && u.types.daily !== false) lines.push(`${c.avatar} <b>${esc(c.childName)}</b> — bugungi mashqlar bajarilgan 🎉`, "");
      continue;
    }
    hasContent = true;
    lines.push(`${c.avatar} <b>${esc(c.childName)}</b> — ${left.length} ta mashq qoldi${c.done ? ` (${c.done} tasi bajarildi)` : ""}:`);
    for (const t of left.slice(0, 5)) {
      if (t.fromSpecialist) hasSpecialist = true;
      lines.push(`• ${t.emoji} ${esc(t.title)} · ${t.durationMin} daq${t.fromSpecialist ? " 👩‍🏫" : ""}`);
    }
    if (left.length > 5) lines.push(`• … yana ${left.length - 5} ta`);
    lines.push("");
  }

  if (u.bookingsTomorrow.length) {
    hasContent = true;
    lines.push("📅 <b>Ertangi yozilishlaringiz:</b>");
    for (const b of [...u.bookingsTomorrow].sort((a, z) => a.time.localeCompare(z.time))) {
      if (b.kind === "session") {
        const s = b.sessionId ? findSession(b.sessionId) : undefined;
        lines.push(`• ${b.time} — 🏢 Bepul sessiya${s ? `: ${esc(s.title)} (${esc(s.venue)})` : ""}`);
      } else {
        const sp = getSpecialist(b.specialistId);
        lines.push(`• ${b.time} — 📞 Konsultatsiya${sp ? `: ${esc(sp.name)}` : ""} (${b.mode === "online" ? "online" : "offline"})`);
      }
    }
    lines.push("");
  }

  if (u.reassessDue?.length) {
    hasContent = true;
    lines.push(`🧠 <b>Qayta baholash vaqti keldi:</b> ${u.reassessDue.map(esc).join(", ")} — 5 daqiqalik savolnoma rivojlanish dinamikasini ko‘rsatadi.`, "");
  }

  const s = u.sessionTomorrow;
  if (s) {
    hasContent = true;
    const t = SESSION_TYPES[s.type];
    lines.push("🏢 <b>Ertaga tumaningizda bepul sessiya!</b>", `${t.emoji} ${esc(s.title)}`, `🕙 ${s.time} · 📍 ${esc(s.venue)}`, "");
  }

  if (!hasContent) return null;
  if (hasSpecialist) lines.push("👩‍🏫 — mutaxassis topshirig‘i");
  if (u.daily !== false) lines.push("Har kuni 15–20 daqiqa — katta natija 💪");

  const markup = kb([
    [appBtn("▶️ Boshlash", "/plan"), btn("🎯 Botda ko‘rish", "m:ex")],
    [s ? btn("✅ Sessiyaga yozilish", `ss:s:${s.id}!`) : undefined],
    [btn("⚙️ Eslatma sozlamalari", "m:rem")],
  ]);
  return { text: lines.join("\n").trim(), markup };
}

// ---------------------------------------------------------------------------
// Yuborish
// ---------------------------------------------------------------------------

type SendResult = "ok" | "blocked" | "failed";

async function sendWithRetry(bot: Bot<BotContext>, chatId: number, text: string, markup?: InlineKeyboard): Promise<SendResult> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await bot.api.sendMessage(chatId, text, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        reply_markup: markup,
      });
      return "ok";
    } catch (e) {
      if (e instanceof GrammyError) {
        if (e.error_code === 429) {
          const wait = (e.parameters.retry_after ?? 3) + 1;
          console.warn(`[eslatma] 429 — ${wait} soniya kutamiz`);
          await sleep(wait * 1000);
          continue;
        }
        if (e.error_code === 403 && /blocked|deactivated/i.test(e.description)) return "blocked";
        console.warn(`[eslatma] ${chatId}: ${e.description}`);
        return "failed";
      }
      // tarmoq xatosi — biroz kutib qayta urinamiz
      await sleep(2000);
    }
  }
  return "failed";
}

/** Bitta daqiqa uchun eslatmalarni yuborish (sinov uchun ham eksport qilingan) */
export async function runMinute(bot: Bot<BotContext>, at: Date): Promise<void> {
  const { hh, mm, weekday } = tashkentTime(at);
  const hhmm = `${pad2(hh)}:${pad2(mm)}`;
  const users = await getReminders(hhmm, weekday);
  if (!users.length) return;
  let sent = 0;
  let skipped = 0;
  for (const u of users) {
    if (!u.tgId) continue;
    const msg = reminderMessage(u);
    if (!msg) {
      skipped++;
      continue;
    }
    const res = await sendWithRetry(bot, u.tgId, msg.text, msg.markup);
    if (res === "ok") sent++;
    if (res === "blocked") {
      // Botni bloklagan — eslatmalarni o‘chirib qo‘yamiz (qayta yoqish ilovada yoki botda)
      await act(u.tgId, { type: "user.reminders", reminders: { enabled: false } }).catch(() => undefined);
      console.log(`[eslatma] ${u.tgId} botni bloklagan — eslatmalar o‘chirildi`);
    }
    await sleep(45); // ~20 xabar/soniya — Telegram limitidan past
  }
  console.log(`[eslatma] ${hhmm} (hafta kuni ${weekday}): ${users.length} ta foydalanuvchi, ${sent} ta yuborildi, ${skipped} ta — eslatadigan narsa yo‘q`);
}

/** Har daqiqa boshida ishga tushadi. O‘tkazib yuborilgan daqiqalar (10 tagacha) qayta ishlanadi. */
export function startScheduler(bot: Bot<BotContext>): () => void {
  let last = Math.floor(Date.now() / 60_000); // joriy daqiqa — qayta ishga tushganda takror yubormaslik uchun
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let running = false;

  const tick = async () => {
    if (stopped || running) return;
    running = true;
    try {
      const now = Math.floor(Date.now() / 60_000);
      for (let m = Math.max(last + 1, now - 10); m <= now; m++) {
        await runMinute(bot, new Date(m * 60_000 + 1000));
        last = m;
      }
    } catch (e) {
      if (e instanceof ApiDown) console.warn("[eslatma] web API javob bermadi — keyingi daqiqada qayta urinamiz:", e.message);
      else console.error("[eslatma] xatolik:", e);
    } finally {
      running = false;
      schedule();
    }
  };

  const schedule = () => {
    if (stopped) return;
    const ms = 60_000 - (Date.now() % 60_000) + 500;
    timer = setTimeout(() => void tick(), ms);
  };

  schedule();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
