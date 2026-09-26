"use client";

import { SESSION_TYPES, SPECIALTIES } from "@/lib/constants";
import { isTelegram, openExternal } from "@/lib/client/telegram";
import type { Booking } from "@/lib/types";
import { meetUrl } from "@/lib/utils";
import { bookingInfo, sessionDuration } from "./booking-utils";

/** Kalendar hodisasi (sana va vaqt — Toshkent vaqti, UTC+5) */
export interface CalEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMin: number;
}

/** Toshkent vaqti -> UTC "YYYYMMDDTHHMMSSZ" */
function utcStamp(date: string, time: string, plusMin = 0): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCMinutes((h || 0) * 60 + (m || 0) - 5 * 60 + plusMin);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

/** RFC 5545: satrlar 75 oktetdan uzun bo‘lmasligi kerak */
function fold(line: string): string {
  const enc = new TextEncoder();
  const parts: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + b > limit) {
      parts.push(cur);
      cur = ch;
      bytes = b;
    } else {
      cur += ch;
      bytes += b;
    }
  }
  parts.push(cur);
  return parts.join("\r\n ");
}

export function buildIcs(ev: CalEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//YuniQo//YuniQo UZ//UZ",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.uid}@yuniqo.uz`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${utcStamp(ev.date, ev.time)}`,
    `DTEND:${utcStamp(ev.date, ev.time, ev.durationMin)}`,
    `SUMMARY:${escapeText(ev.title)}`,
    ev.description ? `DESCRIPTION:${escapeText(ev.description)}` : "",
    ev.location ? `LOCATION:${escapeText(ev.location)}` : "",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-PT1H",
    `DESCRIPTION:${escapeText(`1 soatdan keyin: ${ev.title}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function googleCalendarUrl(ev: CalEvent): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${utcStamp(ev.date, ev.time)}/${utcStamp(ev.date, ev.time, ev.durationMin)}`,
    details: ev.description ?? "",
    location: ev.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

/**
 * .ics faylni yuklab berish. Telegram Mini App ichida fayl yuklab bo‘lmaydi —
 * u yerda Google Kalendar havolasi ochiladi.
 */
export function addToCalendar(ev: CalEvent): "file" | "link" {
  if (isTelegram()) {
    openExternal(googleCalendarUrl(ev));
    return "link";
  }
  const blob = new Blob([buildIcs(ev)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `yuniqo-${ev.date}-${ev.time.replace(":", "")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "file";
}

/** Yozilishdan kalendar hodisasi */
export function bookingEvent(b: Booking, childName?: string): CalEvent {
  const info = bookingInfo(b);
  const forChild = childName ? `Bola: ${childName}.` : "";
  if (b.kind === "session") {
    const s = info.session;
    return {
      uid: b.id,
      title: `YuniQo: ${info.title}`,
      description: [
        s ? `${SESSION_TYPES[s.type].label} (bepul).` : "Bepul YuniQo sessiyasi.",
        forChild,
        "Bolaning rivojlanish pasporti QR kodini (YuniQo ilovasida) va qulay kiyim olib keling.",
      ]
        .filter(Boolean)
        .join("\n"),
      location: s ? `${s.venue}, ${s.address}` : undefined,
      date: b.date,
      time: b.time,
      durationMin: sessionDuration(b),
    };
  }
  const sp = info.specialist;
  return {
    uid: b.id,
    title: `YuniQo: ${sp ? `${sp.name} — ${SPECIALTIES[sp.specialty].label.toLowerCase()}` : "mutaxassis"} konsultatsiyasi`,
    description: [
      b.mode === "online" ? `Online konsultatsiya. Video qo‘ng‘iroq: ${meetUrl(b.id)}` : "Offline qabul.",
      forChild,
      b.note ? `Izoh: ${b.note}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    location: b.mode === "online" ? meetUrl(b.id) : info.place,
    date: b.date,
    time: b.time,
    durationMin: 60,
  };
}
