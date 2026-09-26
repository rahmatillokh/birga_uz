# YuniQo — Har bir bola uchun imkoniyat

YuniQo — bolaning rivojlanishini **baholash → individual reja → AI bilan mashq → video orqali tekshirish → natijalarni yig‘ish → mutaxassisga ko‘rsatish** zanjirini bitta platformada birlashtiruvchi web ilova va Telegram bot.

- 🌐 **Web ilova** (Next.js 16) — asosiy mahsulot. Oddiy brauzerda ham, **Telegram Mini App** sifatida ham ishlaydi.
- 🤖 **Telegram bot** (grammY) — tezkor yordam, sessiyalarga yozilish, eslatmalar, hisobot olish va ilovaga yo‘naltirish.
- 🧠 **AI** — Claude (AI yordamchi, AI xulosa, AI reja), MediaPipe (kamera orqali mashqni tekshirish — qurilmaning o‘zida), Web Speech (talaffuz).

Bot va web ilova **bitta ma’lumotlar bazasi va bitta API** orqali ishlaydi: botda yaratilgan bola profili ilovada darhol ko‘rinadi, ilovada qilingan yozilish esa botdan bildirishnoma bo‘lib keladi.

---

## Tezkor ishga tushirish

```bash
npm install                 # MediaPipe modellari ham avtomatik yuklab olinadi
cp .env.example .env.local  # kerakli kalitlarni kiriting (ixtiyoriy)
npm run dev                 # http://localhost:3000 — demo rejim
```

Bot bilan birga:

```bash
npm run dev:all             # web (3000-port) + Telegram bot
```

Ko‘rgazma (production) rejimi:

```bash
npm run build
npm run start:all           # web + bot
```

> Hech qanday kalitsiz ham ilova to‘liq ishlaydi: **demo rejim** (Amir va Madina — namuna oila, 72 kunlik tarix), oflayn “demo AI” javoblari va mutaxassis kabineti.

### Muhit o‘zgaruvchilari (`.env.local`)

| O‘zgaruvchi | Vazifasi |
|---|---|
| `TELEGRAM_BOT_TOKEN` | @BotFather bergan token. Bo‘lmasa bot ishga tushmaydi, web demo rejimda ishlaydi |
| `TELEGRAM_BOT_USERNAME` | Bot username (ilovadagi “Botni ochish” tugmasi uchun) |
| `WEBAPP_URL` | Ilovaning **HTTPS** manzili (Mini App uchun majburiy): `https://yuniqo.uz` yoki tunnel manzili |
| `API_URL` | Bot → web API manzili (odatda `http://localhost:3000`) |
| `ANTHROPIC_API_KEY` | Claude API kaliti — AI yordamchi, AI xulosa va AI reja haqiqiy AI bilan ishlaydi |
| `ANTHROPIC_MODEL` | Standart: `claude-opus-5` |
| `ADMIN_CHAT_ID` | Qo‘llab-quvvatlash xabarlari keladigan chat |
| `COMMUNITY_URL` | Ota-onalar Telegram guruhi havolasi |
| `BOT_API_SECRET` | Bot ↔ API maxfiy kaliti (ixtiyoriy) |
| `ADMIN_KEY` | Ko‘rgazma paneli (`/admin?key=...`) himoyasi |

### Telegram Mini App’ni ulash (5 daqiqa)

1. @BotFather → `/newbot` → tokenni `.env.local` ga yozing.
2. HTTPS manzil oling. Lokal kompyuterdan eng tez yo‘l:
   ```bash
   brew install cloudflared
   cloudflared tunnel --url http://localhost:3000
   ```
   Chiqqan `https://xxxx.trycloudflare.com` manzilni `WEBAPP_URL` ga yozing.
3. `npm run build && npm run start:all` — bot ishga tushganda menyu tugmasini (Mini App) avtomatik o‘rnatadi.
4. Telegram’da botga `/start` yozing → **“🚀 YuniQo ilovasini ochish”**.

Mini App ichida foydalanuvchi Telegram `initData` (HMAC-SHA256, bot tokeni bilan) orqali tasdiqlanadi — alohida login kerak emas.

---

## Arxitektura

```
src/
  app/                 Sahifalar (Next.js App Router) va API (app/api/*)
    api/me, api/act    Foydalanuvchi ma’lumotlari va yagona "amal" (action) endpointi
    api/bot/*          Bot uchun API (maxfiy kalit bilan)
    api/ai/*           Claude: chat (stream), baholash xulosasi, AI reja, tahlil
    api/share/[token]  Mutaxassisga ulashilgan hisobot
  components/          UI (ui/, shell/, charts/, report/, games/, ai-check/, speech/ …)
  data/                Kontent: mashqlar, savolnoma, mutaxassislar, hududlar, sessiyalar, market, maqolalar, videolar
  lib/core/            Biznes-mantiq: reducer (barcha o‘zgarishlar), baholash, reja, statistika, seed
  lib/client/          Brauzer: store (zustand), Telegram WebApp, API
  lib/vision/          MediaPipe: pose va yuz tahlili
  server/              JSON-DB, Telegram initData tekshiruvi, bildirishnomalar, Claude
bot/                   Telegram bot (grammY)
```

- **Yagona reducer** (`src/lib/core/reducer.ts`): web ilova, bot va mutaxassis kabineti barcha o‘zgarishlarni bir xil `applyAction()` orqali bajaradi → ma’lumotlar doim mos.
- **Ma’lumotlar bazasi**: ko‘rgazma uchun JSON-fayl (`.data/db.json`). Keyingi bosqichda PostgreSQL’ga o‘tkazish oson — faqat `src/server/db.ts` almashadi.
- **Oflayn rejim**: server bo‘lmasa (masalan, statik hosting) ilova brauzer ichidagi demo bazada ishlaydi.
- **Xavfsizlik**: kamera/mikrofon tahlili qurilmada bajariladi, video serverga yuborilmaydi; mutaxassisga ulashish — muddatli, bo‘limlar bo‘yicha va istalgan vaqtda bekor qilinadi.

---

## Funksiyalar xaritasi

| Talab | Qayerda |
|---|---|
| 👶 Bola profili (tarix, qiziqishlar, kuchli/zaif tomonlar, kuzatuvlar, maqsadlar) | `/child`, bir nechta bola — yuqoridagi tanlagich, `/onboarding` |
| 🧠 Rivojlanish baholash (AI xulosa, qayta baholash, dinamika) | `/assessment`, `/assessment/[id]` |
| 🎯 Individual rivojlanish rejasi (AI reja) | `/plan` |
| 🏠 Uy sharoitidagi mashqlar | `/exercises?tab=uy` |
| 🗣️ Logoped · 🧩 Defektolog · 🦶 Motorika va yassi oyoqlik | `/exercises?section=…`, `/exercises/[id]` (qadam-baqadam rejim) |
| 🎥 Rivojlantiruvchi videolar | `/videos` (YouTube + interaktiv video-dars) |
| 🤖 AI mashqlar · ✨ AI | `/ai` (ota-onaga chat, bola bilan moslashuvchan dars, bola bilan suhbat) |
| 📹 AI orqali mashqni video bilan tekshirish | `/ai-check` (MediaPipe: qo‘l ko‘tarish, o‘tirib-turish, muvozanat, oyoq uchida, samolyotcha, tabassum–naycha) |
| 🗣️ Nutq/talaffuz tahlili | `/speech` (talaffuz, «Shamni o‘chir» nafas mashqi, ovoz kuchi, ko‘zgu rejimi) |
| 🎮 Rivojlantiruvchi o‘yinlar | `/games` (9 ta o‘yin) |
| 📊 Baholar va natijalar · 📈 Monitoring | `/progress` |
| 🏆 Progress va yutuqlar | `/achievements` |
| 📁 Natijalarni mutaxassisga ko‘rsatish · 📝 Hisobot | `/passport` (QR, havola, PDF), `/r/[token]` |
| 👨‍⚕️ Mutaxassislar (10 yo‘nalish, profil, filtrlar, online/offline) | `/specialists`, `/specialists/[id]` |
| 🩺 Mutaxassis kabineti (natijalar, topshiriq, tavsiya, hisobot, hamkasblar) | `/specialist`, `/specialist/patients/[id]` |
| 🏢 Har bir tumanda bepul sessiyalar · 📅 Yozilish | `/sessions` (14 hudud, barcha tumanlar) |
| 🛒 YuniQo Market | `/market` |
| 📚 O‘zbek tilidagi bilim bazasi | `/library` |
| 👨‍👩‍👧 Ota-onalar hamjamiyati | `/community` |
| 🔔 Eslatmalar | `/reminders` + bot rejalashtiruvchisi |
| 👨‍👩‍👧 Ota-ona kabineti | `/cabinet` |
| 💎 Premium · 📞 Premium konsultatsiyalar | `/premium` |
| 🔐 Xavfsizlik va maxfiylik | `/settings` |
| 🤖 Telegram bot (19 funksiya) | `bot/` — batafsil: `bot/README.md` |

---

## Ko‘rgazma uchun demo ssenariy (7–10 daqiqa)

1. **Bosh sahifa** — Amir (5 yosh): bugungi reja, 🔥 seriya, AI tavsiya, “Barcha imkoniyatlar” va YuniQo konsepti zanjiri.
2. **Baholash** → *Qayta baholash* → 24 savol → “AI tahlil qilmoqda…” → radar, dinamika, AI xulosa, tavsiya etilgan mutaxassislar.
3. **Individual reja** → *AI bilan yangilash* → mashq kartasi → *Mashqni boshlash* (qadam-baqadam) → ball va konfetti.
4. **AI video nazorat** → *O‘tirib-turish* yoki *Tabassum — Naycha* → kamera oldida bajarib ko‘rsating (takrorlar, xatolar, aniqlik).
5. **Talaffuz** → R tovushi → mikrofonga “Rak” deng; **Shamni o‘chir** — mikrofonga puflang.
6. **AI** → ota-ona savoli (“R harfini ayta olmayapti”) va **Bola bilan dars**.
7. **Rivojlanish pasporti** → *QR / havola yaratish* → telefon bilan QR’ni skanerlang — mutaxassis hisobotni ko‘radi → *PDF*.
8. Yuqoridagi **Ota-ona / Mutaxassis** tugmasi → **mutaxassis kabineti**: bemorlar, qabul so‘rovini tasdiqlash, **topshiriq berish** → ota-ona rejasida darhol paydo bo‘ladi; **AI xulosa qoralamasi**; **hamkasblar** bilan ma’lumot almashish.
9. **Bepul sessiyalar** → viloyat/tuman → yozilish. **Mutaxassislar** → profil → konsultatsiyaga yozilish.
10. **Telegram**: telefonda botni oching → `/start` → bola profili → savolnoma → natija → “Ilovani ochish” (Mini App) — o‘sha ma’lumotlar ilovada.

**Ko‘rgazma paneli** — `/admin`: katta ekranda bot QR kodi, Telegram orqali qo‘shilgan ota-onalar soni, jonli lenta va barcha foydalanuvchilarga xabar (7 kunlik Premium sovg‘a bilan).

Demo ma’lumotlarni qaytarish: **Xavfsizlik → Ko‘rgazma boshqaruvi → “Demo ma’lumotlarni tiklash”** (haqiqiy Telegram foydalanuvchilari ma’lumotlari saqlanadi). Ko‘rgazmadan oldin hammasini noldan boshlash: `curl -X POST "http://localhost:3000/api/demo/reset?all=1&key=ADMIN_KEY"`.

---

## Docker bilan

```bash
docker compose up -d --build   # .env.local faylini tayyorlab qo‘ying
```

## Muhim eslatma

YuniQo tibbiy tashxis qo‘ymaydi. Baholash — ota-ona javoblariga asoslangan skrining, AI tavsiyalari mutaxassis maslahatini almashtirmaydi.
