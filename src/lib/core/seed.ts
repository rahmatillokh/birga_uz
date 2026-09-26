import { EXERCISES, getExercise } from "@/data/exercises";
import { GAMES } from "@/data/games";
import { LESSON_TOPICS } from "@/data/lessons";
import { PRODUCTS } from "@/data/products";
import { sessionsForDistrict } from "@/data/sessions";
import { SPEECH_SOUNDS } from "@/data/speech";
import { VIDEOS } from "@/data/videos";
import { AI_CHECKS, DEMO_UID, POINTS, VIDEO_CATEGORIES } from "@/lib/constants";
import type {
  Activity,
  AgeBand,
  Assessment,
  Assignment,
  Booking,
  Child,
  Consents,
  DB,
  Domain,
  Plan,
  ReminderSettings,
  Scores,
  Share,
  SpecialistNote,
  User,
} from "@/lib/types";
import { addDays, mulberry32, todayKey } from "@/lib/utils";
import { generatePlan, isScheduled } from "./plan";
import { answersForTargets, computeScores, ruleSummary } from "./scoring";

export const DB_VERSION = 3;

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: true,
  time: "18:30",
  days: [1, 2, 3, 4, 5, 6, 7],
  types: { daily: true, specialist: true, reassessment: true, sessions: true },
};

export const DEFAULT_CONSENTS: Consents = {
  dataProcessing: true,
  videoAnalysis: true,
  audioAnalysis: true,
  shareWithSpecialists: true,
  specialistExchange: true,
  community: true,
};

export function newUser(uid: string, name: string, extra: Partial<User> = {}): User {
  return {
    uid,
    name,
    createdAt: new Date().toISOString(),
    premium: { plan: "free" },
    reminders: { ...DEFAULT_REMINDERS, types: { ...DEFAULT_REMINDERS.types } },
    consents: { ...DEFAULT_CONSENTS },
    sessionAlerts: true,
    onboarded: false,
    ...extra,
  };
}

/** "YYYY-MM-DD" + "HH:MM" (Toshkent) -> ISO */
function at(key: string, hh: number, mm = 0): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCHours(hh - 5, mm, 0, 0);
  return d.toISOString();
}

function tokenFor(n: number): string {
  const r = mulberry32(n);
  return Array.from({ length: 10 }, () => "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(r() * 31)]).join("");
}

interface ChildSeedOpts {
  child: Child;
  days: number;
  seed: number;
  /** har kuni faol bo‘lish ehtimoli */
  activeRate: number;
  /** oxirgi n kun uzluksiz faol (streak) */
  streakDays: number;
  domains: Domain[]; // asosiy yo‘nalishlar
  plan?: Plan;
  assignments?: Assignment[];
}

function genActivities(o: ChildSeedOpts): Activity[] {
  const rnd = mulberry32(o.seed);
  const today = todayKey();
  const out: Activity[] = [];
  const exPool = EXERCISES.filter((e) => o.domains.includes(e.domain));
  const asgByEx = new Map((o.assignments ?? []).filter((a) => a.exerciseId).map((a) => [a.exerciseId!, a]));
  let n = 0;
  const id = () => `act-${o.seed}-${++n}`;

  const pushExercise = (exId: string, t: string, score: number) => {
    const ex = getExercise(exId);
    if (!ex) return;
    const asg = asgByEx.get(ex.id);
    const withAsg = asg && t >= asg.createdAt;
    out.push({
      id: id(),
      childId: o.child.id,
      at: t,
      kind: "exercise",
      refId: ex.id,
      title: ex.title,
      domain: ex.domain,
      score,
      durationSec: ex.durationMin * 60 + Math.floor(rnd() * 120),
      points: POINTS.exercise + (withAsg ? 5 : 0),
      feeling: score > 80 ? "oson" : score > 62 ? "orta" : "qiyin",
      assignmentId: withAsg ? asg!.id : undefined,
    });
  };

  for (let i = o.days; i >= 0; i--) {
    const k = addDays(today, -i);
    const inStreak = i <= o.streakDays;
    if (!inStreak && rnd() > o.activeRate) continue;
    const progress = 1 - i / o.days; // 0..1
    const scoreNow = () => Math.max(25, Math.min(100, Math.round(52 + progress * 30 + (rnd() - 0.5) * 18)));
    let hh = 9 + Math.floor(rnd() * 3);
    const nextTime = () => {
      hh = Math.min(20, hh + (rnd() < 0.5 ? 0 : 1));
      return at(k, hh, Math.floor(rnd() * 60));
    };

    // Bugun — faqat ertalabki 1 ta mashq (qolganlari ko‘rgazmada jonli bajariladi)
    if (i === 0) {
      const first = o.plan?.items.find((it) => isScheduled(it, k));
      if (first) pushExercise(first.exerciseId, at(k, 8, 10), scoreNow());
      continue;
    }

    // 1) Rejadagi mashqlar (bajarilish ehtimoli vaqt o‘tishi bilan oshadi)
    const planned = (o.plan?.items ?? []).filter((it) => isScheduled(it, k));
    if (planned.length) {
      for (const it of planned) if (rnd() < 0.62 + progress * 0.3) pushExercise(it.exerciseId, nextTime(), scoreNow());
    } else if (exPool.length) {
      pushExercise(exPool[Math.floor(rnd() * exPool.length)].id, nextTime(), scoreNow());
    }

    // 2) Qo‘shimcha faoliyatlar: o‘yin, video, AI tekshiruv, talaffuz, Ustoz AI darsi
    const extras = 1 + Math.floor(rnd() * 2);
    for (let j = 0; j < extras; j++) {
      const roll = rnd();
      const t = nextTime();
      const score = scoreNow();
      if (roll < 0.34 && GAMES.length) {
        const g = GAMES[Math.floor(rnd() * GAMES.length)];
        out.push({ id: id(), childId: o.child.id, at: t, kind: "game", refId: g.id, title: g.title, domain: g.domain, score, durationSec: 90 + Math.floor(rnd() * 200), points: POINTS.game + Math.round(score / 20) });
      } else if (roll < 0.5 && VIDEOS.length) {
        const v = VIDEOS[Math.floor(rnd() * VIDEOS.length)];
        out.push({ id: id(), childId: o.child.id, at: t, kind: "video", refId: v.id, title: v.title, domain: VIDEO_CATEGORIES[v.category].domain, durationSec: v.durationSec, points: POINTS.video });
      } else if (roll < 0.68) {
        const ids = ["balance", "tiptoe", "squat", "arms-up", "smile-pucker"] as const;
        const cid = ids[Math.floor(rnd() * ids.length)];
        const meta = AI_CHECKS[cid];
        const reps = 6 + Math.floor(rnd() * 5);
        out.push({
          id: id(),
          childId: o.child.id,
          at: t,
          kind: "ai_check",
          refId: cid,
          title: meta.title,
          domain: meta.domain,
          score,
          durationSec: 60 + Math.floor(rnd() * 90),
          points: POINTS.ai_check,
          details: cid === "balance" ? { holdSec: Math.round(4 + progress * 7 + rnd() * 2), target: 10 } : { reps, target: 10, accuracy: score },
        });
      } else if (roll < 0.84) {
        const snd = SPEECH_SOUNDS.length ? SPEECH_SOUNDS[Math.floor(rnd() * Math.min(2, SPEECH_SOUNDS.length))] : undefined;
        out.push({
          id: id(),
          childId: o.child.id,
          at: t,
          kind: "speech",
          refId: snd?.id ?? "r",
          title: `Talaffuz: «${snd?.sound ?? "R"}» tovushi`,
          domain: "nutq",
          score: Math.max(20, Math.min(100, Math.round(42 + progress * 40 + (rnd() - 0.5) * 14))),
          durationSec: 120 + Math.floor(rnd() * 120),
          points: POINTS.speech,
        });
      } else if (LESSON_TOPICS.length) {
        const lt = LESSON_TOPICS[Math.floor(rnd() * LESSON_TOPICS.length)];
        out.push({ id: id(), childId: o.child.id, at: t, kind: "lesson", refId: lt.id, title: `Ustoz AI darsi: ${lt.title}`, domain: lt.domain, score, durationSec: 240 + Math.floor(rnd() * 180), points: POINTS.lesson });
      }
    }
  }
  return out;
}

function mkAssessment(child: Child, id: string, key: string, band: AgeBand, targets: Scores, prev?: Scores): Assessment {
  const answers = answersForTargets(band, targets);
  const { scores, overall } = computeScores(band, answers);
  const { summary, recommendations } = ruleSummary(child, scores, prev);
  return {
    id,
    childId: child.id,
    at: at(key, 19, 10),
    band,
    answers,
    scores,
    overall,
    source: "web",
    summary,
    recommendations,
  };
}

function mkPlan(child: Child, a: Assessment | undefined, assignments: Assignment[], createdKey: string): Plan {
  const p = generatePlan(child, a, assignments);
  return { id: `plan-${child.id}`, childId: child.id, createdAt: at(createdKey, 19, 20), ...p };
}

export function createSeedDB(): DB {
  const today = todayKey();
  const d = (n: number) => addDays(today, n);
  const now = new Date().toISOString();

  // ------------------------------------------------------------------ Foydalanuvchilar
  const demo = newUser(DEMO_UID, "Gulnoza Rahimova", {
    phone: "+998 90 123 45 67",
    region: "toshkent-sh",
    district: "Chilonzor",
    createdAt: at(d(-75), 10),
    activeChildId: "ch-amir",
    premium: { plan: "premium", until: at(d(23), 23, 59), period: "month", consultationsLeft: 1 },
    onboarded: true,
  });
  const mock1 = newUser("u-mock-1", "Sardor Aliyev", { region: "toshkent-sh", district: "Chilonzor", onboarded: true });
  const mock2 = newUser("u-mock-2", "Nilufar Qodirova", { region: "toshkent-sh", district: "Olmazor", onboarded: true });
  const mock3 = newUser("u-mock-3", "Dilfuza Yo‘ldosheva", { region: "toshkent-sh", district: "Uchtepa", onboarded: true });

  // ------------------------------------------------------------------ Bolalar
  const amir: Child = {
    id: "ch-amir",
    ownerUid: DEMO_UID,
    name: "Amir",
    birthDate: "2021-03-14",
    gender: "o‘g‘il",
    avatar: "🦁",
    region: "toshkent-sh",
    district: "Chilonzor",
    concerns: ["Tovushlarni noto‘g‘ri talaffuz qilish", "Diqqatni jamlay olmaslik", "Yassi oyoqlik"],
    diagnoses: ["Yassi oyoqlikning boshlang‘ich bosqichi (ortoped xulosasi, 2025)"],
    interests: ["Mashinalar", "Dinozavrlar", "Rasm chizish", "Musiqa"],
    strengths: ["Yaxshi vizual xotira", "Harakatchan va qiziquvchan", "Hayvonlarni yaxshi ko‘radi", "Musiqaga ritmik javob beradi"],
    needs: ["R va Sh tovushlari talaffuzi", "Diqqatni uzoq jamlash", "Qaychi va qalam bilan ishlash", "Oyoq gumbazini mustahkamlash"],
    goals: [
      { id: "g1", text: "R tovushini so‘zlarda to‘g‘ri aytish", domain: "nutq", done: false, createdAt: at(d(-70), 20) },
      { id: "g2", text: "Qaychi bilan to‘g‘ri chiziq bo‘ylab kesish", domain: "mayda_motorika", done: false, createdAt: at(d(-70), 20) },
      { id: "g3", text: "15 daqiqa diqqatni bitta ishga jamlash", domain: "kognitiv", done: false, createdAt: at(d(-35), 20) },
      { id: "g4", text: "Bir oyoqda 10 soniya turish", domain: "yirik_motorika", done: true, createdAt: at(d(-70), 20) },
      { id: "g5", text: "Mustaqil kiyinish (tugmalarni qadash)", domain: "mustaqillik", done: true, createdAt: at(d(-60), 20) },
    ],
    observations: [
      { id: "o1", at: at(d(-1), 20, 15), text: "O‘yin paytida o‘zi «rrr-mashina» deb o‘ynadi, R tovushi aniq chiqdi!", mood: "😊" },
      { id: "o2", at: at(d(-3), 19, 40), text: "Qaychi bilan kesishda tez charchayapti, 5 daqiqadan keyin tanaffus so‘radi.", mood: "😐" },
      { id: "o3", at: at(d(-5), 18, 50), text: "Kechqurun mashqlarni o‘zi eslatdi — «Oyi, Otcha qilamizmi?»", mood: "🤩" },
      { id: "o4", at: at(d(-9), 17, 30), text: "Bog‘chada tarbiyachi nutqi ancha yaxshilanganini aytdi.", mood: "😊" },
      { id: "o5", at: at(d(-14), 19, 5), text: "Bir oyoqda 8 soniya turdi, muvozanatni yaxshi saqlayapti.", mood: "💪" },
    ],
    history: [
      { id: "h1", date: "2021-03-14", title: "Tug‘ildi", description: "3,4 kg, 52 sm", type: "milestone" },
      { id: "h2", date: "2022-04-10", title: "Birinchi so‘zlar", description: "«Ona», «ota», «bar»", type: "milestone" },
      { id: "h3", date: "2023-09-01", title: "Bog‘chaga bordi", type: "milestone" },
      { id: "h4", date: "2024-11-20", title: "Logoped tekshiruvi", description: "Nutqning fonetik tomoni yoshiga nisbatan biroz orqada, R va Sh tovushlari almashtiriladi.", type: "specialist" },
      { id: "h5", date: "2025-05-15", title: "Ortoped ko‘rigi", description: "Yassi oyoqlikning boshlang‘ich belgilari. Mashqlar va yalangoyoq yurish tavsiya etildi.", type: "medical" },
      { id: "h6", date: d(-75), title: "YuniQo’da profil yaratildi", type: "milestone" },
      { id: "h7", date: d(-70), title: "Birinchi rivojlanish baholashi", type: "assessment" },
      { id: "h8", date: d(-35), title: "Qayta baholash: nutq +12 ball", type: "assessment" },
      { id: "h9", date: d(-20), title: "R tovushi alohida holatda chiqdi! 🎉", type: "achievement" },
      { id: "h10", date: d(-6), title: "Uchinchi baholash: umumiy +19 ball", type: "assessment" },
    ],
    createdAt: at(d(-75), 10, 5),
  };

  const madina: Child = {
    id: "ch-madina",
    ownerUid: DEMO_UID,
    name: "Madina",
    birthDate: "2023-06-02",
    gender: "qiz",
    avatar: "🐰",
    region: "toshkent-sh",
    district: "Chilonzor",
    concerns: ["Nutq kechikishi"],
    diagnoses: [],
    interests: ["Qo‘g‘irchoqlar", "Musiqa", "Hayvonlar"],
    strengths: ["Mehribon va quvnoq", "Musiqaga qiziqadi"],
    needs: ["So‘z boyligini oshirish", "Mayda motorika"],
    goals: [{ id: "g1", text: "20 ta yangi so‘z o‘rganish", domain: "nutq", done: false, createdAt: at(d(-3), 20) }],
    observations: [{ id: "o1", at: at(d(-2), 20), text: "«Mushuk», «kuchuk» so‘zlarini takrorladi.", mood: "😊" }],
    history: [
      { id: "h1", date: "2023-06-02", title: "Tug‘ildi", type: "milestone" },
      { id: "h2", date: d(-4), title: "YuniQo’da profil yaratildi", type: "milestone" },
      { id: "h3", date: d(-3), title: "Birinchi rivojlanish baholashi", type: "assessment" },
    ],
    createdAt: at(d(-4), 12),
  };

  const sardorbek: Child = {
    id: "ch-sardorbek",
    ownerUid: "u-mock-1",
    name: "Sardorbek",
    birthDate: "2020-05-10",
    gender: "o‘g‘il",
    avatar: "🐻",
    region: "toshkent-sh",
    district: "Chilonzor",
    concerns: ["Nutq kechikishi", "Maktabga tayyorgarlik"],
    diagnoses: [],
    interests: ["Futbol", "Konstruktor"],
    strengths: ["Mantiqiy fikrlash yaxshi"],
    needs: ["Gap tuzish", "L va R tovushlari"],
    goals: [],
    observations: [],
    history: [],
    createdAt: at(d(-40), 11),
  };
  const zarina: Child = {
    id: "ch-zarina",
    ownerUid: "u-mock-2",
    name: "Zarina",
    birthDate: "2022-02-18",
    gender: "qiz",
    avatar: "🦄",
    region: "toshkent-sh",
    district: "Olmazor",
    concerns: ["Nutq kechikishi", "Muloqotdan qochish"],
    diagnoses: ["Autizm spektri (tashxis bosqichida)"],
    interests: ["Rasm chizish", "Suv bilan o‘yin"],
    strengths: ["Vizual xotirasi kuchli", "Ranglarni yaxshi ajratadi"],
    needs: ["Ko‘z kontakti", "So‘rov bildirish", "Navbat bilan o‘ynash"],
    goals: [],
    observations: [],
    history: [],
    createdAt: at(d(-30), 11),
  };
  const bobur: Child = {
    id: "ch-bobur",
    ownerUid: "u-mock-3",
    name: "Bobur",
    birthDate: "2021-08-30",
    gender: "o‘g‘il",
    avatar: "🐯",
    region: "toshkent-sh",
    district: "Uchtepa",
    concerns: ["Tovushlarni noto‘g‘ri talaffuz qilish"],
    diagnoses: [],
    interests: ["Mashinalar", "Multfilmlar"],
    strengths: ["Faol va kirishimli"],
    needs: ["Sh va J tovushlari"],
    goals: [],
    observations: [],
    history: [],
    createdAt: at(d(-20), 11),
  };

  // ------------------------------------------------------------------ Baholashlar
  const a1 = mkAssessment(amir, "as-amir-1", d(-70), "5-7", {
    nutq: 38, kognitiv: 50, mayda_motorika: 50, yirik_motorika: 63, ijtimoiy: 50, mustaqillik: 63,
  });
  const a2 = mkAssessment(
    amir, "as-amir-2", d(-35), "5-7",
    { nutq: 50, kognitiv: 63, mayda_motorika: 50, yirik_motorika: 75, ijtimoiy: 63, mustaqillik: 63 },
    a1.scores,
  );
  const a3 = mkAssessment(
    amir, "as-amir-3", d(-6), "5-7",
    { nutq: 63, kognitiv: 75, mayda_motorika: 63, yirik_motorika: 75, ijtimoiy: 75, mustaqillik: 75 },
    a2.scores,
  );
  const aM = mkAssessment(madina, "as-madina-1", d(-3), "3-5", {
    nutq: 38, kognitiv: 63, mayda_motorika: 50, yirik_motorika: 75, ijtimoiy: 63, mustaqillik: 50,
  });
  const aS = mkAssessment(sardorbek, "as-sardorbek-1", d(-30), "5-7", {
    nutq: 38, kognitiv: 63, mayda_motorika: 63, yirik_motorika: 75, ijtimoiy: 63, mustaqillik: 75,
  });
  const aZ = mkAssessment(zarina, "as-zarina-1", d(-25), "3-5", {
    nutq: 25, kognitiv: 50, mayda_motorika: 63, yirik_motorika: 75, ijtimoiy: 25, mustaqillik: 38,
  });
  const aB = mkAssessment(bobur, "as-bobur-1", d(-15), "3-5", {
    nutq: 50, kognitiv: 75, mayda_motorika: 63, yirik_motorika: 75, ijtimoiy: 75, mustaqillik: 63,
  });

  // ------------------------------------------------------------------ Mutaxassis topshiriqlari
  const has = (id: string) => !!getExercise(id);
  const assignments: Assignment[] = [
    {
      id: "asg-1",
      childId: "ch-amir",
      specialistId: "sp-dilnoza",
      exerciseId: has("log-baraban") ? "log-baraban" : undefined,
      title: "«Barabanchi» — R tovushiga tayyorgarlik",
      note: "Kuniga 2 marta, 1 daqiqadan. Pastki jag‘ qimirlamasligini ko‘zgu orqali kuzating.",
      frequency: "har_kuni",
      dueDate: d(10),
      status: "faol",
      createdAt: at(d(-6), 16),
    },
    {
      id: "asg-2",
      childId: "ch-amir",
      specialistId: "sp-dilnoza",
      exerciseId: has("log-r-tovush") ? "log-r-tovush" : undefined,
      title: "R tovushini bo‘g‘inlarda avtomatlashtirish",
      note: "RA-RO-RU-RI, keyin so‘zlar: rak, ruchka, arra. AI talaffuz tekshiruvida natijani saqlang.",
      frequency: "har_kuni",
      dueDate: d(14),
      status: "faol",
      createdAt: at(d(-6), 16, 5),
    },
    {
      id: "asg-3",
      childId: "ch-amir",
      specialistId: "sp-malika",
      exerciseId: has("mot-romolcha") ? "mot-romolcha" : undefined,
      title: "Yassi oyoq: oyoq barmoqlari bilan ro‘molcha yig‘ish",
      note: "Har bir oyoq bilan 5 martadan, yalangoyoq holda. Og‘riq bo‘lsa to‘xtating.",
      frequency: "har_kuni",
      dueDate: d(20),
      status: "faol",
      createdAt: at(d(-12), 11),
    },
    {
      id: "asg-4",
      childId: "ch-amir",
      specialistId: "sp-jasur",
      exerciseId: has("def-nima-ozgardi") ? "def-nima-ozgardi" : undefined,
      title: "«Nima o‘zgardi?» — ko‘rish xotirasi",
      note: "5 ta buyumdan boshlang, muvaffaqiyatli bo‘lsa 7 taga oshiring.",
      frequency: "haftada_3",
      dueDate: d(7),
      status: "faol",
      createdAt: at(d(-10), 15),
    },
    {
      id: "asg-5",
      childId: "ch-zarina",
      specialistId: "sp-dilnoza",
      exerciseId: has("log-soz-boyligi") ? "log-soz-boyligi" : undefined,
      title: "Rasmli kartochkalar bilan so‘rov bildirish",
      note: "Kuniga 3 marta: bola kerakli narsani kartochka ko‘rsatib so‘rashi.",
      frequency: "har_kuni",
      dueDate: d(12),
      status: "faol",
      createdAt: at(d(-5), 12),
    },
  ].filter((a) => a.exerciseId || a.childId !== "ch-amir") as Assignment[];

  // ------------------------------------------------------------------ Rejalar
  const plans: Plan[] = [
    mkPlan(amir, a3, assignments.filter((a) => a.childId === "ch-amir"), d(-6)),
    mkPlan(madina, aM, [], d(-3)),
    mkPlan(sardorbek, aS, [], d(-30)),
    mkPlan(zarina, aZ, assignments.filter((a) => a.childId === "ch-zarina"), d(-25)),
    mkPlan(bobur, aB, [], d(-15)),
  ];
  plans[0].source = "ai";
  plans[0].summary =
    "Reja Amirning 3 ta baholash natijalari, logoped va fizioterapevt topshiriqlari asosida tuzildi. Asosiy e’tibor: R tovushini avtomatlashtirish, diqqatni 15 daqiqagacha uzaytirish va oyoq gumbazini mustahkamlash. Kuniga 20 daqiqa, 6 hafta.";

  // ------------------------------------------------------------------ Faoliyatlar
  const activities: Activity[] = [
    ...genActivities({ child: amir, days: 72, seed: 11, activeRate: 0.72, streakDays: 12, domains: ["nutq", "kognitiv", "yirik_motorika", "mayda_motorika"], plan: plans[0], assignments }),
    ...genActivities({ child: madina, days: 3, seed: 23, activeRate: 1, streakDays: 3, domains: ["nutq", "mayda_motorika"], plan: plans[1] }),
    ...genActivities({ child: sardorbek, days: 30, seed: 31, activeRate: 0.7, streakDays: 4, domains: ["nutq", "kognitiv"], plan: plans[2] }),
    ...genActivities({ child: zarina, days: 25, seed: 41, activeRate: 0.75, streakDays: 6, domains: ["nutq", "ijtimoiy"], plan: plans[3], assignments }),
    ...genActivities({ child: bobur, days: 15, seed: 51, activeRate: 0.8, streakDays: 2, domains: ["nutq"], plan: plans[4] }),
  ];
  // Baholash faoliyatlari
  for (const a of [a1, a2, a3, aM, aS, aZ, aB]) {
    activities.push({
      id: `act-${a.id}`,
      childId: a.childId,
      at: a.at,
      kind: "assessment",
      refId: a.id,
      title: "Rivojlanish baholashi",
      domain: "kognitiv",
      score: a.overall,
      points: POINTS.assessment,
    });
  }

  // ------------------------------------------------------------------ Mutaxassis izohlari
  const notes: SpecialistNote[] = [
    {
      id: "n1",
      childId: "ch-amir",
      specialistId: "sp-dilnoza",
      at: at(d(-6), 16, 20),
      kind: "tavsiya",
      text: "Amirda R tovushi alohida holatda to‘g‘ri chiqmoqda, hozir bo‘g‘inlarda avtomatlashtirish bosqichidamiz. Har kuni «Otcha» va «Barabanchi» mashqlarini 2 martadan bajaring. Sh tovushiga keyingi oy o‘tamiz.",
      visibleToParent: true,
    },
    {
      id: "n2",
      childId: "ch-amir",
      specialistId: "sp-malika",
      at: at(d(-12), 11, 30),
      kind: "tavsiya",
      text: "Oyoq gumbazi yoshiga mos shakllanmoqda, chap oyoqda biroz yassilanish bor. Ro‘molcha yig‘ish va oyoq uchida ko‘tarilish mashqlarini davom ettiring; qum va maysada yalangoyoq yurish foydali. AI video nazorat natijalari yaxshi — oyoq uchida ushlab turish 4 soniyadan 9 soniyagacha oshgan.",
      visibleToParent: true,
    },
    {
      id: "n3",
      childId: "ch-amir",
      specialistId: "sp-jasur",
      at: at(d(-10), 15, 40),
      kind: "xulosa",
      text: "Diqqat barqarorligi 8–10 daqiqaga yetdi (dastlab 4–5 daqiqa edi). Xotira o‘yinlarida o‘rtacha natija 70% dan yuqori. Maktabga tayyorgarlik dasturining 1-bosqichini boshlash mumkin.",
      visibleToParent: true,
    },
    {
      id: "n4",
      childId: "ch-amir",
      specialistId: "sp-dilnoza",
      at: at(d(-5), 18),
      kind: "hamkasb",
      text: "Jasur Rahimovich, Amir bilan diqqat mashqlarida ko‘rsatmalarni qisqa (3–4 so‘z) bering — shunda tushunishi yaxshiroq. Nutqiy javob talab qiladigan topshiriqlarda R tovushli so‘zlarni ko‘proq ishlating, avtomatlashtirishga yordam beradi.",
      visibleToParent: true,
    },
    {
      id: "n5",
      childId: "ch-amir",
      specialistId: "sp-nodira",
      at: at(d(-4), 12, 10),
      kind: "hamkasb",
      text: "Hamkasblar uchun: Amir yangi odamlar bilan birinchi 5 daqiqada tortinchoq, keyin yaxshi kontakt o‘rnatadi. Mashg‘ulot boshida sevimli mashinasini qo‘lida ushlab turishiga ruxsat bering — xavotir pasayadi.",
      visibleToParent: true,
    },
    {
      id: "n6",
      childId: "ch-zarina",
      specialistId: "sp-dilnoza",
      at: at(d(-5), 12, 30),
      kind: "tavsiya",
      text: "Muqobil kommunikatsiya (rasmli kartochkalar) kiritildi. Kuniga kamida 3 marta kartochka orqali so‘rov bildirishni rag‘batlantiring.",
      visibleToParent: true,
    },
  ];

  // ------------------------------------------------------------------ Ulashishlar
  const shares: Share[] = [
    { id: "sh1", token: tokenFor(1), childId: "ch-amir", uid: DEMO_UID, specialistId: "sp-dilnoza", createdAt: at(d(-20), 10), expiresAt: at(d(25), 10), scopes: ["baholash", "mashqlar", "ai", "kuzatuvlar", "mutaxassis"], views: 7, active: true },
    { id: "sh2", token: tokenFor(2), childId: "ch-amir", uid: DEMO_UID, specialistId: "sp-malika", createdAt: at(d(-12), 10), expiresAt: at(d(18), 10), scopes: ["baholash", "mashqlar", "ai"], views: 3, active: true },
    { id: "sh3", token: tokenFor(3), childId: "ch-amir", uid: DEMO_UID, specialistId: "sp-jasur", createdAt: at(d(-11), 10), expiresAt: at(d(19), 10), scopes: ["baholash", "mashqlar", "ai", "mutaxassis"], views: 2, active: true },
    { id: "sh4", token: tokenFor(4), childId: "ch-amir", uid: DEMO_UID, specialistId: "sp-nodira", createdAt: at(d(-5), 10), expiresAt: at(d(25), 10), scopes: ["baholash", "kuzatuvlar", "mutaxassis"], views: 1, active: true },
    { id: "sh5", token: tokenFor(5), childId: "ch-sardorbek", uid: "u-mock-1", specialistId: "sp-dilnoza", createdAt: at(d(-30), 10), expiresAt: at(d(30), 10), scopes: ["baholash", "mashqlar", "ai", "kuzatuvlar", "mutaxassis"], views: 4, active: true },
    { id: "sh6", token: tokenFor(6), childId: "ch-zarina", uid: "u-mock-2", specialistId: "sp-dilnoza", createdAt: at(d(-25), 10), expiresAt: at(d(35), 10), scopes: ["baholash", "mashqlar", "ai", "kuzatuvlar", "mutaxassis"], views: 9, active: true },
    { id: "sh7", token: tokenFor(7), childId: "ch-zarina", uid: "u-mock-2", specialistId: "sp-jasur", createdAt: at(d(-20), 10), expiresAt: at(d(40), 10), scopes: ["baholash", "mashqlar", "mutaxassis"], views: 2, active: true },
    { id: "sh8", token: tokenFor(8), childId: "ch-bobur", uid: "u-mock-3", specialistId: "sp-dilnoza", createdAt: at(d(-15), 10), expiresAt: at(d(15), 10), scopes: ["baholash", "mashqlar", "ai"], views: 1, active: true },
  ];

  // ------------------------------------------------------------------ Yozilishlar
  const chilonzor = sessionsForDistrict("toshkent-sh", "Chilonzor").filter((s) => s.date > today);
  const bookings: Booking[] = [
    { id: "bk1", uid: DEMO_UID, childId: "ch-amir", kind: "consultation", specialistId: "sp-dilnoza", mode: "online", date: d(3), time: "16:00", status: "tasdiqlandi", note: "R tovushi avtomatlashtirish natijalarini ko‘rib chiqish", premium: true, createdAt: at(d(-2), 12), source: "web" },
    { id: "bk2", uid: DEMO_UID, childId: "ch-amir", kind: "consultation", specialistId: "sp-jasur", mode: "offline", date: d(6), time: "11:00", status: "kutilmoqda", note: "Maktabga tayyorgarlik dasturi", createdAt: at(d(-1), 9), source: "bot" },
    { id: "bk3", uid: DEMO_UID, childId: "ch-amir", kind: "consultation", specialistId: "sp-malika", mode: "offline", date: d(-12), time: "10:00", status: "otdi", createdAt: at(d(-15), 9), source: "web" },
    { id: "bk4", uid: "u-mock-1", childId: "ch-sardorbek", kind: "consultation", specialistId: "sp-dilnoza", mode: "offline", date: d(1), time: "10:00", status: "tasdiqlandi", createdAt: at(d(-3), 9), source: "web" },
    { id: "bk5", uid: "u-mock-2", childId: "ch-zarina", kind: "consultation", specialistId: "sp-dilnoza", mode: "online", date: d(0), time: "17:00", status: "kutilmoqda", note: "Kartochkalar bilan ishlash bo‘yicha savollar", createdAt: at(d(0), 8), source: "bot" },
    { id: "bk6", uid: "u-mock-3", childId: "ch-bobur", kind: "consultation", specialistId: "sp-dilnoza", mode: "offline", date: d(2), time: "15:00", status: "tasdiqlandi", createdAt: at(d(-4), 9), source: "web" },
  ];
  if (chilonzor[0]) {
    bookings.push({
      id: "bk7",
      uid: DEMO_UID,
      childId: "ch-amir",
      kind: "session",
      sessionId: chilonzor[0].id,
      mode: "offline",
      date: chilonzor[0].date,
      time: chilonzor[0].time,
      status: "tasdiqlandi",
      createdAt: at(d(-1), 20),
      source: "bot",
    });
  }

  // ------------------------------------------------------------------ Buyurtmalar
  const orders = PRODUCTS.length
    ? [
        {
          id: "or-1001",
          uid: DEMO_UID,
          items: PRODUCTS.slice(0, 2).map((p) => ({ productId: p.id, qty: 1, price: p.price })),
          total: PRODUCTS.slice(0, 2).reduce((s, p) => s + p.price, 0),
          address: "Toshkent sh., Chilonzor tumani, 9-kvartal, 12-uy",
          phone: "+998 90 123 45 67",
          payment: "click" as const,
          status: "yetkazildi" as const,
          createdAt: at(d(-18), 14),
        },
      ]
    : [];

  return {
    version: DB_VERSION,
    seededAt: now,
    users: { [demo.uid]: demo, [mock1.uid]: mock1, [mock2.uid]: mock2, [mock3.uid]: mock3 },
    children: [amir, madina, sardorbek, zarina, bobur],
    assessments: [a1, a2, a3, aM, aS, aZ, aB],
    activities: activities.sort((a, b) => a.at.localeCompare(b.at)),
    plans,
    bookings,
    assignments,
    notes,
    shares,
    orders,
    posts: [],
    postLikes: {},
    sessionBookings: {},
  };
}
