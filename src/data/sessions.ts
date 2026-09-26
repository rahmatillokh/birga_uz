import type { FreeSession, SessionType } from "@/lib/types";
import { addDays, daysBetween, hashString, mulberry32, todayKey, weekdayOf } from "@/lib/utils";
import { REGIONS, districtLabel } from "./regions";
import { SPECIALISTS } from "./specialists";

/**
 * Bepul YuniQo sessiyalari — har bir tuman uchun deterministik tarzda
 * kelgusi 4 haftaga generatsiya qilinadi (ma’lumotlar hech qachon eskirmaydi).
 */

const TEMPLATES: Record<SessionType, { title: string; description: string; durationMin: number; age: string }[]> = {
  konsultatsiya: [
    {
      title: "Logoped va defektolog bilan bepul dastlabki konsultatsiya",
      description:
        "Mutaxassislar bolaning nutqi, diqqati va umumiy rivojlanishini qisqa suhbat va o‘yin orqali baholaydi, ota-onaga keyingi qadamlar bo‘yicha tavsiya beradi.",
      durationMin: 120,
      age: "2–7 yosh",
    },
    {
      title: "Bolaning rivojlanishini bepul baholash kuni",
      description:
        "YuniQo savolnomasi va mutaxassis kuzatuvi asosida bolaning 6 ta yo‘nalish bo‘yicha rivojlanish profili tuziladi. Natijalar ilovaga saqlanadi.",
      durationMin: 180,
      age: "1–7 yosh",
    },
  ],
  seminar: [
    {
      title: "Nutq kechikishi: ota-onalar nimalarga e’tibor berishi kerak?",
      description:
        "Nutq rivojlanishining yoshga mos bosqichlari, xavotirli belgilar va uyda har kuni qilinadigan oddiy mashqlar haqida amaliy seminar.",
      durationMin: 90,
      age: "Ota-onalar uchun",
    },
    {
      title: "Uyda motorikani rivojlantirish — amaliy seminar",
      description:
        "Oddiy uy buyumlari yordamida mayda va yirik motorikani rivojlantirish, yassi oyoqlik profilaktikasi bo‘yicha mashqlar ko‘rsatiladi.",
      durationMin: 90,
      age: "Ota-onalar uchun",
    },
    {
      title: "Autizm spektri: erta belgilar va yordam yo‘llari",
      description:
        "Bolalar psixologi va defektolog autizm spektridagi bolalarning o‘ziga xosliklari, kundalik tartib va muloqotni qo‘llab-quvvatlash haqida gapiradi.",
      durationMin: 120,
      age: "Ota-onalar uchun",
    },
  ],
  amaliy: [
    {
      title: "Artikulyatsion gimnastika — guruh mashg‘uloti",
      description:
        "Logoped rahbarligida bolalar o‘yin shaklida artikulyatsion mashqlarni bajaradi. Ota-onalar uyda davom ettirish uchun topshiriq oladi.",
      durationMin: 60,
      age: "3–7 yosh",
    },
    {
      title: "Sensor o‘yinlar va diqqat mashg‘uloti",
      description:
        "Ranglar, shakllar va teksturalar bilan ishlash orqali diqqat, idrok va mayda motorikani rivojlantiruvchi guruh mashg‘uloti.",
      durationMin: 60,
      age: "2–6 yosh",
    },
    {
      title: "Harakatli o‘yinlar va muvozanat mashqlari",
      description:
        "Fizioterapevt bilan muvozanat, koordinatsiya va yassi oyoqlik profilaktikasiga qaratilgan quvnoq harakatli mashg‘ulot.",
      durationMin: 60,
      age: "3–7 yosh",
    },
  ],
  uchrashuv: [
    {
      title: "Mutaxassislar bilan ochiq uchrashuv: savol-javob",
      description:
        "Logoped, defektolog, psixolog va fizioterapevt ota-onalarning savollariga javob beradi. Oldindan savollaringizni ilovada qoldirishingiz mumkin.",
      durationMin: 90,
      age: "Ota-onalar uchun",
    },
    {
      title: "Ota-onalar klubi: tajriba almashish",
      description:
        "Hududdagi ota-onalar bilan tanishish, tajriba almashish va mutaxassis moderatorligida qo‘llab-quvvatlovchi suhbat.",
      durationMin: 90,
      age: "Ota-onalar uchun",
    },
  ],
};

const VENUES = [
  (d: string) => `${d} bolalar poliklinikasi`,
  (d: string) => `${d} inklyuziv ta’lim markazi`,
  (d: string) => `${d} madaniyat markazi`,
  (d: string) => `${d} axborot-kutubxona markazi`,
  (d: string) => `${d} «Mehr» reabilitatsiya markazi`,
  (d: string) => `${d} yoshlar markazi`,
];

const STREETS = [
  "Mustaqillik",
  "Alisher Navoiy",
  "Amir Temur",
  "Bobur",
  "Istiqlol",
  "Do‘stlik",
  "Yoshlik",
  "Bunyodkor",
  "Mirzo Ulug‘bek",
  "Nurafshon",
  "Guliston",
  "Oqtepa",
];

const TIMES = ["10:00", "11:00", "14:00", "15:30", "16:00"];
const TYPE_ORDER: SessionType[] = ["konsultatsiya", "amaliy", "seminar", "uchrashuv"];

function weekStart(key: string): string {
  return addDays(key, -(weekdayOf(key) - 1));
}

/** Bitta tuman uchun sessiyalar (joriy haftadan boshlab 4 hafta) */
export function sessionsForDistrict(regionId: string, district: string, fromKey: string = todayKey()): FreeSession[] {
  const region = REGIONS.find((r) => r.id === regionId);
  if (!region) return [];
  const dIndex = region.districts.indexOf(district);
  if (dIndex < 0) return [];
  const seed = hashString(`${regionId}|${district}`);
  const rnd = mulberry32(seed);
  const label = districtLabel(district);
  // Har bir tuman uchun haftasiga 2 kun (masalan, Chorshanba va Shanba)
  const dayA = 1 + Math.floor(rnd() * 3); // Du–Ch
  const dayB = 5 + Math.floor(rnd() * 2); // Ju–Sh
  const venueIdx = Math.floor(rnd() * VENUES.length);
  const street = STREETS[Math.floor(rnd() * STREETS.length)];
  const house = 3 + Math.floor(rnd() * 90);
  const regionalSpecialists = SPECIALISTS.filter((s) => s.freeSessions && s.region === regionId);
  const pool = regionalSpecialists.length >= 2 ? regionalSpecialists : SPECIALISTS.filter((s) => s.freeSessions);

  const out: FreeSession[] = [];
  const start = weekStart(fromKey);
  for (let w = 0; w < 4; w++) {
    // Mutlaq hafta raqami — sessiya qaysi sanadan so‘ralishidan qat’i nazar bir xil bo‘lishi uchun
    const absWeek = Math.floor(daysBetween("2024-01-01", addDays(start, w * 7)) / 7);
    for (const [slot, wd] of [dayA, dayB].entries()) {
      const date = addDays(start, w * 7 + (wd - 1));
      if (date < fromKey) continue;
      const typeIdx = (absWeek * 2 + slot + (seed % 4)) % TYPE_ORDER.length;
      const type = TYPE_ORDER[typeIdx];
      const tmplList = TEMPLATES[type];
      const tmpl = tmplList[(absWeek + slot + seed) % tmplList.length];
      const r2 = mulberry32(hashString(`${regionId}|${district}|${date}|${slot}`));
      const capacity = type === "seminar" || type === "uchrashuv" ? 30 : 15;
      const booked = Math.floor(r2() * capacity * 0.8);
      const spA = pool[Math.floor(r2() * pool.length)];
      const spB = pool[Math.floor(r2() * pool.length)];
      const venueFn = VENUES[(venueIdx + absWeek) % VENUES.length];
      out.push({
        id: `ses_${regionId}_${dIndex}_${date}_${slot}`,
        region: regionId,
        district,
        type,
        title: tmpl.title,
        description: tmpl.description,
        date,
        time: TIMES[Math.floor(r2() * TIMES.length)],
        durationMin: tmpl.durationMin,
        venue: venueFn(label),
        address: `${region.name}, ${label}, ${street} ko‘chasi, ${house}-uy`,
        specialistIds: Array.from(new Set([spA?.id, spB?.id].filter(Boolean) as string[])),
        capacity,
        booked,
        ageRange: tmpl.age,
      });
    }
  }
  return out;
}

export function sessionsForRegion(regionId: string, fromKey: string = todayKey()): FreeSession[] {
  const region = REGIONS.find((r) => r.id === regionId);
  if (!region) return [];
  return region.districts
    .flatMap((d) => sessionsForDistrict(regionId, d, fromKey))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

/** Sessiyani id bo‘yicha qayta tiklash */
export function getSession(id: string): FreeSession | undefined {
  const m = /^ses_(.+)_(\d+)_(\d{4}-\d{2}-\d{2})_(\d)$/.exec(id);
  if (!m) return undefined;
  const [, regionId, dIdx, date] = m;
  const region = REGIONS.find((r) => r.id === regionId);
  const district = region?.districts[Number(dIdx)];
  if (!region || !district) return undefined;
  // Sessiya o‘tib ketgan bo‘lsa ham topilishi uchun o‘sha haftadan generatsiya qilamiz
  return sessionsForDistrict(regionId, district, weekStart(date)).find((s) => s.id === id);
}

/** Barcha hududlar bo‘yicha statistika (bosh sahifa uchun) */
export function sessionStats() {
  const districts = REGIONS.reduce((n, r) => n + r.districts.length, 0);
  return { regions: REGIONS.length, districts, perWeek: districts * 2 };
}
