import { getExercise } from "@/data/exercises";
import { getSession } from "@/data/sessions";
import { getSpecialist } from "@/data/specialists";
import { SPECIALTIES } from "@/lib/constants";
import type { Action, ActResult, Actor, DB } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";
import { appButton, escapeHtml, notifyUid } from "./telegram";

/**
 * Harakatlardan keyingi yon ta’sirlar: foydalanuvchiga Telegram bot orqali bildirishnoma.
 * (Botda qilingan harakatlar uchun bot o‘zi javob beradi — source === "bot" bo‘lsa yubormaymiz.)
 */
export async function afterAction(db: DB, actor: Actor, action: Action, result: ActResult, opts: { fromBot?: boolean } = {}) {
  if (!result.ok) return;
  try {
    if (actor.type === "user") {
      // Bot o‘z harakatlariga o‘zi javob beradi — ikki marta xabar yubormaymiz
      if (opts.fromBot) return;
      const uid = actor.uid;
      switch (action.type) {
        case "booking.create": {
          if (action.source === "bot") return;
          if (action.kind === "session" && action.sessionId) {
            const s = getSession(action.sessionId);
            if (!s) return;
            await notifyUid(
              uid,
              `✅ <b>Bepul YuniQo sessiyasiga yozildingiz!</b>\n\n📌 ${escapeHtml(s.title)}\n📅 ${formatDate(s.date, { weekday: true })}, ${s.time}\n📍 ${escapeHtml(s.venue)}\n${escapeHtml(s.address)}\n\nSessiyadan bir kun oldin eslatib qo‘yamiz 🔔`,
              [[appButton("📅 Mening yozilishlarim", "/sessions?tab=my")]],
            );
          } else if (action.specialistId) {
            const sp = getSpecialist(action.specialistId);
            await notifyUid(
              uid,
              `📞 <b>Konsultatsiya so‘rovi yuborildi</b>\n\n👩‍⚕️ ${escapeHtml(sp?.name ?? "")} — ${sp ? SPECIALTIES[sp.specialty].label : ""}\n📅 ${formatDate(action.date, { weekday: true })}, ${action.time}\n💻 ${action.mode === "online" ? "Online" : "Offline qabul"}\n\nMutaxassis tasdiqlagach xabar beramiz.`,
              [[appButton("👨‍⚕️ Konsultatsiyalarim", "/cabinet")]],
            );
          }
          return;
        }
        case "user.premium": {
          if (action.plan !== "premium") return;
          await notifyUid(
            uid,
            action.trial
              ? "💎 <b>Premium sinov davri faollashtirildi!</b>\n7 kun davomida Ustoz AI, AI video nazorat va kengaytirilgan hisobotlardan foydalaning."
              : "💎 <b>YuniQo Premium faollashtirildi!</b>\nRahmat! Barcha imkoniyatlar ochildi.",
            [[appButton("🚀 Ilovani ochish", "/")]],
          );
          return;
        }
        case "order.create": {
          const o = db.orders.find((x) => x.id === result.createdId);
          if (!o) return;
          await notifyUid(
            uid,
            `🛒 <b>Buyurtma qabul qilindi</b> (#${o.id})\n\nMahsulotlar: ${o.items.length} ta\nJami: ${formatMoney(o.total)}\nManzil: ${escapeHtml(o.address)}\n\nKuryer siz bilan bog‘lanadi.`,
          );
          return;
        }
      }
    } else {
      // Mutaxassis harakatlari → ota-onaga bildirishnoma
      const sp = getSpecialist(actor.id);
      const name = sp?.name ?? "Mutaxassis";
      if (action.type === "sp.assign") {
        const child = db.children.find((c) => c.id === action.childId);
        if (!child) return;
        const ex = getExercise(action.exerciseId);
        await notifyUid(
          child.ownerUid,
          `👩‍🏫 <b>${escapeHtml(name)} yangi topshiriq berdi</b>\n\n${child.avatar} ${escapeHtml(child.name)} uchun: <b>${escapeHtml(action.title)}</b>\n${escapeHtml(action.note)}${ex ? `\n\n🎯 Mashq: ${escapeHtml(ex.title)}` : ""}\n📅 Muddat: ${formatDate(action.dueDate)}`,
          [[appButton("▶️ Topshiriqni boshlash", ex ? `/exercises/${ex.id}` : "/plan")]],
        );
      } else if (action.type === "sp.note" && action.visibleToParent && action.kind !== "hamkasb") {
        const child = db.children.find((c) => c.id === action.childId);
        if (!child) return;
        await notifyUid(
          child.ownerUid,
          `💬 <b>${escapeHtml(name)}dan yangi ${action.kind === "xulosa" ? "xulosa" : "tavsiya"}</b>\n\n${escapeHtml(action.text).slice(0, 700)}`,
          [[appButton("📁 Rivojlanish pasporti", "/passport")]],
        );
      } else if (action.type === "sp.booking.status") {
        const b = db.bookings.find((x) => x.id === action.bookingId);
        if (!b) return;
        const text =
          action.status === "tasdiqlandi"
            ? `✅ <b>Konsultatsiya tasdiqlandi</b>\n\n👩‍⚕️ ${escapeHtml(name)}\n📅 ${formatDate(b.date, { weekday: true })}, ${b.time} (${b.mode === "online" ? "online" : "offline"})`
            : action.status === "bekor"
              ? `❌ ${escapeHtml(name)} ${formatDate(b.date)} ${b.time} dagi konsultatsiyani bekor qildi. Boshqa vaqtni tanlashingiz mumkin.`
              : "";
        if (text) await notifyUid(b.uid, text, [[appButton("👨‍⚕️ Batafsil", "/cabinet")]]);
      }
    }
  } catch (e) {
    console.warn("[effects]", (e as Error).message);
  }
}
