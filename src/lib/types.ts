// YuniQo — umumiy turlar (web ilova, API va Telegram bot uchun yagona manba)

/** Rivojlanish yo‘nalishlari (baholash va progress shu bo‘yicha yuritiladi) */
export type Domain =
  | "nutq"
  | "kognitiv"
  | "mayda_motorika"
  | "yirik_motorika"
  | "ijtimoiy"
  | "mustaqillik";

/** Mashqlar bo‘limlari */
export type Section = "logoped" | "defektolog" | "motorika";

/** Yosh guruhlari (baholash savolnomasi uchun) */
export type AgeBand = "1-3" | "3-5" | "5-7";

export type SpecialtyId =
  | "logoped"
  | "defektolog"
  | "psixolog"
  | "fizioterapevt"
  | "reabilitolog"
  | "pediatr"
  | "surdopedagog"
  | "tiflopedagog"
  | "maxsus_pedagog"
  | "nutq_terapevti";

export type AiCheckId =
  | "arms-up"
  | "squat"
  | "balance"
  | "tiptoe"
  | "airplane"
  | "smile-pucker"
  | "speech";

// ---------------------------------------------------------------------------
// Statik kontent (src/data/*)
// ---------------------------------------------------------------------------

export interface Exercise {
  id: string; // "log-kurakcha"
  title: string; // "Kurakcha"
  emoji: string; // "👅"
  section: Section;
  topic: string; // "Artikulyatsiya", "Diqqat", "Yassi oyoqlik" ...
  domain: Domain;
  ageMin: number; // yil
  ageMax: number; // yil
  durationMin: number; // daqiqa
  difficulty: 1 | 2 | 3;
  goal: string; // Maqsad (1-2 gap)
  materials: string[]; // Kerakli jihozlar ([] bo‘lsa — hech narsa kerak emas)
  steps: string[]; // Bajarish tartibi (3-7 qadam)
  tips?: string[]; // Ota-onaga maslahatlar
  reps?: string; // "5-6 marta", "kuniga 2 marta"
  atHome: boolean; // uy sharoitida bajarsa bo‘ladimi
  premium?: boolean;
  aiCheck?: AiCheckId; // AI orqali tekshirish mavjud bo‘lsa
}

export interface AssessmentQuestion {
  id: string; // "a35-nutq-1"
  band: AgeBand;
  domain: Domain;
  text: string; // Savol (ota-onaga): "Bola 3-4 so‘zli gap tuza oladimi?"
  hint?: string; // Qisqa izoh/misol
}

export type AnswerValue = 0 | 1 | 2; // 0 — Yo‘q, 1 — Ba’zan, 2 — Ha

export interface Specialist {
  id: string; // "sp-dilnoza"
  name: string; // "Dilnoza Karimova"
  gender: "ayol" | "erkak";
  specialty: SpecialtyId;
  title: string; // "Oliy toifali logoped"
  experienceYears: number;
  certificates: { title: string; issuer: string; year: number }[];
  workplace: string;
  region: string; // region id
  district: string; // tuman nomi
  services: ("online" | "offline")[];
  priceOnline?: number; // so‘m, 1 seans
  priceOffline?: number;
  freeSessions: boolean; // bepul tuman sessiyalarida qatnashadi
  languages: string[];
  about: string;
  approach: string[]; // ish uslubi / yo‘nalishlar
  rating: number; // 4.5
  reviewsCount: number;
  reviews: { author: string; rating: number; text: string; daysAgo: number }[];
  verified: boolean;
  telegram?: string; // @username (demo)
  color: string; // avatar foni uchun hex
}

export interface Region {
  id: string; // "toshkent-sh"
  name: string; // "Toshkent shahri"
  districts: string[];
}

export type SessionType = "konsultatsiya" | "seminar" | "amaliy" | "uchrashuv";

export interface FreeSession {
  id: string;
  region: string; // region id
  district: string;
  type: SessionType;
  title: string;
  description: string;
  date: string; // ISO sana (YYYY-MM-DD)
  time: string; // "10:00"
  durationMin: number;
  venue: string;
  address: string;
  specialistIds: string[];
  capacity: number;
  booked: number;
  ageRange: string; // "2-7 yosh"
}

export type ProductCategory =
  | "oyinchoq"
  | "logopedik"
  | "didaktik"
  | "motorika"
  | "jihoz"
  | "kitob";

export interface Product {
  id: string;
  title: string;
  category: ProductCategory;
  price: number; // so‘m
  oldPrice?: number;
  rating: number;
  reviews: number;
  emoji: string;
  color: string; // karta foni (hex)
  description: string;
  features: string[];
  ageRange: string;
  domains: Domain[];
  recommendedBy?: string; // specialist id
  seller: string;
  inStock: boolean;
}

export type ArticleTopic =
  | "autizm"
  | "daun"
  | "nutq"
  | "motorika"
  | "yassi_oyoq"
  | "organish"
  | "qollanma";

export interface Article {
  id: string;
  topic: ArticleTopic;
  title: string;
  summary: string;
  readMin: number;
  author: string; // "YuniQo tahririyati" yoki mutaxassis ismi
  authorId?: string; // specialist id
  date: string; // ISO
  emoji: string;
  /** Oddiy markdown: "## Sarlavha", "- ro‘yxat", bo‘sh qator — paragraf */
  body: string;
  tags: string[];
}

export type VideoCategory =
  | "nutq"
  | "motorika"
  | "diqqat"
  | "xotira"
  | "mantiq"
  | "ijtimoiy"
  | "kundalik";

export interface Video {
  id: string;
  title: string;
  category: VideoCategory;
  ageMin: number;
  ageMax: number;
  durationSec: number;
  description: string;
  emoji: string;
  color: string;
  youtubeId?: string; // bo‘lsa — YouTube orqali ko‘rsatiladi
  steps?: string[]; // "Interaktiv dars" rejimi uchun qadamlar
  premium?: boolean;
}

export interface CommunityGroup {
  id: string;
  name: string;
  emoji: string;
  type: "hudud" | "mavzu";
  members: number;
  description: string;
}

export interface PostAnswer {
  id: string;
  author: string;
  role: "ota-ona" | "mutaxassis" | "moderator";
  specialistId?: string;
  text: string;
  at: string; // ISO
  likes: number;
}

export interface CommunityPost {
  id: string;
  groupId: string;
  author: string;
  authorUid?: string;
  role: "ota-ona" | "mutaxassis" | "moderator";
  specialistId?: string;
  at: string; // ISO
  title: string;
  text: string;
  tags: string[];
  likes: number;
  answers: PostAnswer[];
  pinned?: boolean;
  kind: "savol" | "tajriba" | "maslahat" | "efir";
}

export interface NewsItem {
  id: string;
  type: "yangilik" | "tadbir";
  title: string;
  text: string;
  date: string; // ISO
  emoji: string;
}

export interface FaqItem {
  q: string;
  a: string;
  category: "umumiy" | "baholash" | "mutaxassis" | "premium" | "xavfsizlik";
}

export interface LessonQuestion {
  id: string;
  topic: string; // lesson topic id
  level: 1 | 2 | 3;
  prompt: string; // "Qaysi hayvon «miyov» deydi?"
  visual?: string; // katta emoji yoki emoji qatori: "🍎🍎🍎"
  options: { label: string; emoji?: string }[];
  answer: number; // to‘g‘ri variant indeksi
  explain: string; // to‘g‘ri javobdan keyingi tushuntirish
  hint: string; // noto‘g‘ri javobda yordam
}

export interface LessonTopic {
  id: string;
  title: string;
  emoji: string;
  domain: Domain;
  color: string;
  description: string;
}

export interface SpeechSound {
  id: string; // "r"
  sound: string; // "R"
  emoji: string;
  description: string; // tovush haqida qisqa
  words: { word: string; emoji: string; position: "bosh" | "orta" | "oxir" }[];
  phrases: string[]; // tez aytish / qisqa gaplar
}

// ---------------------------------------------------------------------------
// Foydalanuvchi ma’lumotlari (server DB)
// ---------------------------------------------------------------------------

export interface ReminderSettings {
  enabled: boolean;
  time: string; // "18:00" (Toshkent vaqti)
  days: number[]; // 1..7 (Dushanba=1)
  types: {
    daily: boolean; // bugungi mashqlar
    specialist: boolean; // mutaxassis topshiriqlari
    reassessment: boolean; // qayta baholash
    sessions: boolean; // sessiyalar
  };
}

export interface Consents {
  dataProcessing: boolean; // ma’lumotlarni qayta ishlash
  videoAnalysis: boolean; // kamera orqali AI tahlil (qurilmada)
  audioAnalysis: boolean; // mikrofon orqali nutq tahlili
  shareWithSpecialists: boolean; // mutaxassislarga ulashish
  specialistExchange: boolean; // mutaxassislar o‘zaro ma’lumot almashishi
  community: boolean; // hamjamiyatda ism ko‘rinishi
}

export interface Premium {
  plan: "free" | "premium";
  until?: string; // ISO
  trial?: boolean;
  period?: "month" | "year";
  consultationsLeft?: number;
  consultationsMonth?: string; // "YYYY-MM" — oylik bepul konsultatsiya qaysi oy uchun
}

export interface User {
  uid: string; // "demo" | "tg:123456"
  name: string;
  tgId?: number;
  username?: string;
  photoUrl?: string;
  phone?: string;
  region?: string;
  district?: string;
  createdAt: string;
  activeChildId?: string;
  premium: Premium;
  reminders: ReminderSettings;
  consents: Consents;
  sessionAlerts: boolean; // hududdagi yangi sessiyalar haqida xabar
  onboarded: boolean;
}

export interface ChildGoal {
  id: string;
  text: string;
  domain: Domain;
  done: boolean;
  createdAt: string;
}

export interface Observation {
  id: string;
  at: string;
  text: string;
  mood?: string; // emoji
}

export interface HistoryEvent {
  id: string;
  date: string; // ISO
  title: string;
  description?: string;
  type: "milestone" | "medical" | "assessment" | "specialist" | "achievement";
}

export interface Child {
  id: string;
  ownerUid: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  gender: "o‘g‘il" | "qiz";
  avatar: string; // emoji
  region?: string;
  district?: string;
  concerns: string[]; // ota-ona tashvishlari (teglar)
  diagnoses: string[]; // ota-ona kiritgan tashxislar (ixtiyoriy)
  interests: string[];
  strengths: string[];
  needs: string[]; // rivojlantirilishi kerak bo‘lgan tomonlar
  goals: ChildGoal[];
  observations: Observation[];
  history: HistoryEvent[];
  createdAt: string;
}

export type Scores = Record<Domain, number>; // 0..100

export interface Assessment {
  id: string;
  childId: string;
  at: string;
  band: AgeBand;
  answers: Record<string, AnswerValue>;
  scores: Scores;
  overall: number;
  source: "web" | "bot" | "specialist";
  summary: string; // AI / qoidaga asoslangan xulosa
  recommendations: string[];
  aiGenerated?: boolean;
}

export type ActivityKind =
  | "exercise"
  | "game"
  | "video"
  | "ai_check"
  | "speech"
  | "lesson"
  | "assessment"
  | "article";

export interface Activity {
  id: string;
  childId: string;
  at: string;
  kind: ActivityKind;
  refId: string;
  title: string;
  domain: Domain;
  score?: number; // 0..100
  durationSec?: number;
  points: number;
  feeling?: "oson" | "orta" | "qiyin";
  assignmentId?: string;
  details?: Record<string, string | number | boolean | string[]>;
}

export interface PlanItem {
  exerciseId: string;
  frequency: "har_kuni" | "haftada_3" | "haftada_2";
  reason: string;
  assignedBy?: string; // specialist id
}

export interface Plan {
  id: string;
  childId: string;
  createdAt: string;
  source: "ai" | "rule" | "specialist";
  focus: Domain[];
  summary: string;
  goals: { domain: Domain; text: string; target: number }[];
  items: PlanItem[];
  weeks: number; // reja muddati (hafta)
}

export type BookingStatus = "kutilmoqda" | "tasdiqlandi" | "bekor" | "otdi";

export interface Booking {
  id: string;
  uid: string;
  childId?: string;
  kind: "session" | "consultation";
  sessionId?: string;
  specialistId?: string;
  mode: "online" | "offline";
  date: string; // YYYY-MM-DD
  time: string; // "16:00"
  status: BookingStatus;
  note?: string;
  premium?: boolean;
  createdAt: string;
  source: "web" | "bot";
}

export interface Assignment {
  id: string;
  childId: string;
  specialistId: string;
  exerciseId?: string;
  title: string;
  note: string;
  frequency: PlanItem["frequency"];
  dueDate: string; // YYYY-MM-DD
  status: "faol" | "bajarildi";
  createdAt: string;
}

export interface SpecialistNote {
  id: string;
  childId: string;
  specialistId: string;
  at: string;
  kind: "tavsiya" | "xulosa" | "hamkasb";
  text: string;
  visibleToParent: boolean;
}

export type ShareScope =
  | "baholash"
  | "mashqlar"
  | "ai"
  | "kuzatuvlar"
  | "mutaxassis";

export interface Share {
  id: string;
  token: string;
  childId: string;
  uid: string;
  specialistId?: string;
  createdAt: string;
  expiresAt: string;
  scopes: ShareScope[];
  views: number;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  uid: string;
  items: OrderItem[];
  total: number;
  address: string;
  phone: string;
  payment: "click" | "payme" | "uzum" | "naqd";
  status: "qabul_qilindi" | "yigilmoqda" | "yolda" | "yetkazildi";
  createdAt: string;
}

export interface DB {
  version: number;
  seededAt: string;
  users: Record<string, User>;
  children: Child[];
  assessments: Assessment[];
  activities: Activity[];
  plans: Plan[];
  bookings: Booking[];
  assignments: Assignment[];
  notes: SpecialistNote[];
  shares: Share[];
  orders: Order[];
  posts: CommunityPost[]; // foydalanuvchilar yozgan postlar (seed postlar src/data da)
  postLikes: Record<string, number>; // postId -> qo‘shimcha like
  sessionBookings: Record<string, number>; // sessionId -> qo‘shimcha yozilganlar
}

/** Foydalanuvchiga (ota-onaga) ko‘rinadigan ma’lumotlar */
export interface UserView {
  user: User;
  children: Child[];
  assessments: Assessment[];
  activities: Activity[];
  plans: Plan[];
  bookings: Booking[];
  assignments: Assignment[];
  notes: SpecialistNote[];
  shares: Share[];
  orders: Order[];
  posts: CommunityPost[];
  postLikes: Record<string, number>;
  sessionBookings: Record<string, number>;
}

/** Mutaxassis kabineti uchun ma’lumotlar */
export interface SpecialistPatient {
  child: Child;
  parentName: string;
  assessments: Assessment[];
  activities: Activity[];
  plan?: Plan;
  assignments: Assignment[];
  notes: SpecialistNote[];
  share?: Share;
  bookings: Booking[];
}

export interface SpecialistView {
  specialistId: string;
  patients: SpecialistPatient[];
  bookings: (Booking & { parentName: string; childName?: string })[];
}

// ---------------------------------------------------------------------------
// Harakatlar (actions) — web ilova, bot va mutaxassis kabineti shu orqali o‘zgartiradi
// ---------------------------------------------------------------------------

export type Actor =
  | { type: "user"; uid: string }
  | { type: "specialist"; id: string };

export type Action =
  | { type: "user.update"; patch: Partial<Pick<User, "name" | "phone" | "region" | "district" | "onboarded">> }
  | { type: "user.consents"; consents: Partial<Consents> }
  | { type: "user.reminders"; reminders: Partial<ReminderSettings> }
  | { type: "user.sessionAlerts"; enabled: boolean }
  | { type: "user.premium"; plan: "premium" | "free"; trial?: boolean; period?: "month" | "year" }
  | {
      type: "child.create";
      child: Pick<Child, "name" | "birthDate" | "gender"> &
        Partial<Pick<Child, "avatar" | "region" | "district" | "concerns" | "diagnoses" | "interests" | "strengths" | "needs">>;
    }
  | { type: "child.update"; childId: string; patch: Partial<Omit<Child, "id" | "ownerUid" | "createdAt">> }
  | { type: "child.delete"; childId: string }
  | { type: "child.select"; childId: string }
  | { type: "child.observation"; childId: string; text: string; mood?: string }
  | { type: "child.goal.add"; childId: string; text: string; domain: Domain }
  | { type: "child.goal.toggle"; childId: string; goalId: string }
  | { type: "child.goal.remove"; childId: string; goalId: string }
  | { type: "assessment.submit"; childId: string; band: AgeBand; answers: Record<string, AnswerValue>; source?: Assessment["source"] }
  | { type: "assessment.summary"; assessmentId: string; summary: string; recommendations: string[] }
  | { type: "plan.generate"; childId: string }
  | { type: "plan.set"; childId: string; plan: Omit<Plan, "id" | "childId" | "createdAt"> }
  | {
      type: "activity.log";
      childId: string;
      kind: ActivityKind;
      refId: string;
      title: string;
      domain: Domain;
      score?: number;
      durationSec?: number;
      feeling?: Activity["feeling"];
      assignmentId?: string;
      details?: Activity["details"];
    }
  | {
      type: "booking.create";
      kind: Booking["kind"];
      sessionId?: string;
      specialistId?: string;
      mode: Booking["mode"];
      date: string;
      time: string;
      childId?: string;
      note?: string;
      source?: Booking["source"];
    }
  | { type: "booking.cancel"; bookingId: string }
  | { type: "share.create"; childId: string; specialistId?: string; scopes: ShareScope[]; days: number }
  | { type: "share.revoke"; shareId: string }
  | { type: "order.create"; items: OrderItem[]; address: string; phone: string; payment: Order["payment"] }
  | { type: "post.create"; groupId: string; title: string; text: string; kind: CommunityPost["kind"]; tags?: string[] }
  | { type: "post.like"; postId: string }
  | { type: "post.answer"; postId: string; text: string }
  // Mutaxassis harakatlari
  | { type: "sp.note"; childId: string; kind: SpecialistNote["kind"]; text: string; visibleToParent: boolean }
  | { type: "sp.assign"; childId: string; exerciseId?: string; title: string; note: string; frequency: PlanItem["frequency"]; dueDate: string }
  | { type: "sp.assignment.status"; assignmentId: string; status: Assignment["status"] }
  | { type: "sp.booking.status"; bookingId: string; status: BookingStatus };

export type ActionType = Action["type"];

export interface ActResult {
  ok: boolean;
  error?: string;
  /** Yaratilgan obyekt id’si (child, booking, share token va h.k.) */
  createdId?: string;
  pointsEarned?: number;
  newBadges?: string[];
}
