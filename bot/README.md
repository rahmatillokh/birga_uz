# YuniQo Telegram bot

**YuniQo — Har bir bola uchun imkoniyat.** Bot — tezkor yordam, yozilishlar, eslatmalar va asosiy mahsulot — YuniQo web ilovasiga (Telegram Mini App) yo‘naltirish.

Bot foydalanuvchi ma’lumotlarini hech qachon to‘g‘ridan-to‘g‘ri bazaga yozmaydi: barcha o‘zgarishlar web API orqali o‘tadi (`POST /api/bot/act`, `POST /api/bot/view`, `GET /api/bot/reminders`). Shuning uchun bot va ilova doim sinxron — botda yaratilgan bola profili ilovada darhol ko‘rinadi va aksincha.

## 1. BotFather sozlamalari

1. Telegram’da [@BotFather](https://t.me/BotFather) → `/newbot` → bot nomi va username (masalan `YuniQo_bot`) → **tokenni** oling.
2. (Ixtiyoriy) `/setuserpic` — logotip. Buyruqlar ro‘yxati, bot tavsifi va Mini App menyu tugmasini bot ishga tushganda **o‘zi o‘rnatadi**.
3. **Mini App menyu tugmasi.** `WEBAPP_URL` `https://` bilan boshlansa, bot chat pastidagi «YuniQo» tugmasini avtomatik o‘rnatadi (`setChatMenuButton`). Qo‘lda qilish (muqobil): `/mybots` → bot → *Bot Settings* → *Menu Button* → URL, yoki `/setmenubutton` buyrug‘i.
4. **Mini App domeni.** Ilova bot ichidagi `web_app` tugmalari orqali ochiladi — domenni alohida ro‘yxatdan o‘tkazish shart emas, faqat manzil **HTTPS** bo‘lishi kerak. `t.me/<bot>/app` ko‘rinishidagi to‘g‘ridan-to‘g‘ri havola kerak bo‘lsa — `/newapp` orqali Mini App yarating (URL sifatida `WEBAPP_URL` ni kiriting).
5. **Qo‘llab-quvvatlash guruhi (ixtiyoriy).** Botni adminlar guruhiga qo‘shing, guruhda `/id` yozing — bot chat ID ni ko‘rsatadi. Uni `ADMIN_CHAT_ID` ga yozing. Foydalanuvchi murojaati shu guruhga keladi; murojaat xabariga **Reply** qilsangiz, javob foydalanuvchiga yuboriladi.

## 2. Muhit o‘zgaruvchilari (`.env.local`)

`.env.example` dan nusxa oling: `cp .env.example .env.local`. Bot avval `.env.local`, keyin `.env` faylini o‘qiydi.

| O‘zgaruvchi | Majburiy | Tavsif |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | ha | @BotFather bergan token. Bo‘lmasa bot tushuntirish yozib, jim to‘xtaydi (web ilova demo rejimda ishlayveradi). |
| `WEBAPP_URL` | tavsiya | Web ilovaning ommaviy manzili, masalan `https://yuniqo.uz`. **https** bo‘lsa — Mini App tugmalari; bo‘lmasa ilova tugmalari ko‘rsatilmaydi, bot baribir to‘liq ishlaydi. |
| `API_URL` | yo‘q | Bot murojaat qiladigan web API. Standart: `http://localhost:3000` (bot va web bitta serverda). |
| `BOT_API_SECRET` | yo‘q | Bot ↔ API maxfiy kaliti. Berilmasa, ikkala tomon ham uni tokendan hosil qiladi: `sha256("yuniqo-bot:" + token).slice(0, 32)`. Web server va bot **bir xil** qiymat bilan ishlashi shart. |
| `ADMIN_CHAT_ID` | yo‘q | Qo‘llab-quvvatlash murojaatlari yuboriladigan chat (guruh ID si odatda `-100…`). |
| `COMMUNITY_URL` | yo‘q | Ota-onalar Telegram guruhiga havola (`https://t.me/...`). |

> Tokenni `.env.local` ga yozgach, `next dev` ni ham qayta ishga tushiring — web server va bot bir xil kalit bilan ishlashi kerak. Aks holda bot logida `403 — x-bot-secret mos kelmadi` ogohlantirishi chiqadi.

## 3. Ishga tushirish

```bash
npm run bot       # faqat bot (web server alohida ishlab turishi kerak: npm run dev)
npm run dev:all   # web (next dev) + bot (tsx watch) birga, fayl o‘zgarsa bot qayta yuklanadi
```

Ishga tushganda bot:
- buyruqlar ro‘yxatini (`/start`, `/menu`, `/profil`, `/baholash`, `/mashqlar`, `/sessiyalar`, `/mutaxassis`, `/progress`, `/hisobot`, `/premium`, `/yordam`) va bot tavsifini o‘rnatadi;
- `WEBAPP_URL` https bo‘lsa — «YuniQo» Mini App menyu tugmasini o‘rnatadi;
- web API ishlayotganini va maxfiy kalit to‘g‘riligini tekshiradi;
- long polling’ni boshlaydi (`drop_pending_updates`) va har daqiqada eslatmalarni tekshiradi (Toshkent vaqti, UTC+5).

Web API vaqtincha ishlamasa, bot qulamaydi — foydalanuvchiga «Server bilan aloqa yo‘q, birozdan so‘ng urinib ko‘ring» deb javob beradi.

## 4. HTTPS: cloudflared tunnel (ko‘rgazma / lokal sinov)

Telegram Mini App faqat **HTTPS** manzilda ochiladi. Lokal kompyuterdagi ilovani tezda HTTPS orqali ochish:

```bash
brew install cloudflared                       # macOS (Windows/Linux: cloudflare.com dan yuklab oling)
cloudflared tunnel --url http://localhost:3000 # → https://xxxx-xxxx.trycloudflare.com
```

1. Chiqqan `https://….trycloudflare.com` manzilini `.env.local` dagi `WEBAPP_URL` ga yozing.
2. Botni qayta ishga tushiring (`npm run dev:all` ni to‘xtatib, qayta yoqing) — menyu tugmasi yangi manzilga o‘rnatiladi.
3. Telegram’da botni oching → «YuniQo» tugmasi yoki «🚀 YuniQo ilovasini ochish».

> Tezkor tunnel manzili har safar o‘zgaradi. Doimiy manzil uchun Cloudflare akkauntida nomlangan tunnel (`cloudflared tunnel create yuniqo`) yoki o‘z domeningizdan foydalaning. `ngrok http 3000` ham xuddi shunday ishlaydi.

## 5. Bot imkoniyatlari

| # | Bo‘lim | Qanday ishlaydi |
| --- | --- | --- |
| 1 | 👶 Bola profili | Ism → yosh (1–7) → jins → tashvishlar (bir nechta) → hudud → tuman → tasdiq. Bir nechta farzand, faol profilni tanlash. |
| 2 | 📝 Savolnoma | Yoshga mos 24 savol, bitta xabarda ketma-ket: ✅ Ha / 🟡 Ba’zan / ❌ Yo‘q, «5/24» progress, orqaga qaytish. |
| 3 | 🧠 Baholash natijasi | 6 yo‘nalish bo‘yicha ▰▰▰▱ chiziqlar, darajalar, xulosa va tavsiyalar; mashqlar, to‘liq natija va mutaxassis tugmalari. |
| 4 | 🎯 Bugungi mashqlar | Individual rejadan bugungi vazifalar; «✅ Bajarildi» → +10 ball va seriya; «▶️ Ilovada ochish». |
| 5 | 🔔 Eslatmalar | Vaqt (08:00…20:00 yoki o‘zingiz yozasiz), har kuni / ish kunlari, yoqish/o‘chirish, namuna ko‘rish. |
| 6 | 📅 Bepul sessiyalar | Hudud → tuman → sessiyalar (bo‘sh joylar bilan) → karta → yozilish (+ `.ics` kalendar fayli); «Mening yozilishlarim» va bekor qilish. |
| 7 | 📍 Tuman sessiyalari | Tumandagi yaqin 5 ta sessiya, sessiya kunlari va oylik kalendar. |
| 8 | 👨‍⚕️ Mutaxassislar | Yo‘nalish (10 ta) → hudud filtri → reyting, tajriba, narx → karta (sertifikatlar, bo‘sh vaqtlar). |
| 9 | 📞 Bog‘lanish | Online/offline → kun → vaqt → izoh → konsultatsiya so‘rovi; natijalar rozilik asosida avtomatik ulashiladi. |
| 10 | 🏢 Sessiya xabarlari | Tumandagi sessiyalar haqida xabarni yoqish/o‘chirish + eng yaqin sessiya. |
| 11 | 📊 Progress | Ball, daraja, seriya 🔥, haftalik faollik, birinchi → oxirgi baholash ▲▼, mutaxassis topshiriqlari. |
| 12 | 📁 Hisobot | Mutaxassis uchun 7 kunlik havola (`/r/<token>`) + qisqa matnli hisobot, «📤 Mutaxassisga yuborish». |
| 13 | 👨‍👩‍👧 Hamjamiyat | Telegram guruhi (`COMMUNITY_URL`) va ilovadagi hamjamiyat. |
| 14 | 🎥 Videolar | Kategoriyalar — ilovadagi videolarga to‘g‘ridan-to‘g‘ri. |
| 15 | 🛒 Market | Bolaning ehtiyojiga mos 3 ta tavsiya + Market. |
| 16 | 💎 Premium | Bepul va Premium taqqoslash, narxlar, «🎁 7 kun bepul sinash». |
| 17 | ❓ Savol-javob | Mavzular bo‘yicha FAQ; oddiy matnli savolga eng mos javob + «AI» taklifi. |
| 18 | 📢 Yangiliklar | Yangiliklar va tadbirlar (kelgusi tadbirlar 🗓️ bilan). |
| 19 | 🆘 Qo‘llab-quvvatlash | Xabar admin chatga boradi, admin javobi foydalanuvchiga qaytadi. |

Qo‘shimcha: `/menu`, `/app`, `/help`, `/id`. Istalgan payt asosiy menyu tugmasini bosish joriy jarayonni bekor qiladi.

## 6. Tuzilma

```
bot/
  index.ts        — kirish nuqtasi: .env, token tekshiruvi, buyruqlar, menyu tugmasi, polling, eslatmalar
  bot.ts          — middleware (xatolar, sessiya, callback javoblari) va barcha bo‘limlarni ulash
  api.ts          — web API mijozi (x-bot-secret bilan)
  scheduler.ts    — har daqiqalik eslatmalar (429 va bloklangan foydalanuvchilarni hisobga oladi)
  telegram.ts     — standart HTML parse_mode, noto‘g‘ri URL tugmalardan himoya
  ui.ts, texts.ts, pickers.ts, data.ts, nav.ts, context.ts, config.ts, env.ts
  flows/          — home, child, assessment, exercises, reminders, sessions, specialists,
                    progress, extras (hamjamiyat, video, market, premium, yangiliklar), faq, support
```

Statik katalog ma’lumotlari (hududlar, sessiyalar, mutaxassislar, savolnoma, mashqlar, FAQ, yangiliklar, mahsulotlar) `src/data/*` dan to‘g‘ridan-to‘g‘ri import qilinadi; foydalanuvchi ma’lumotlari — faqat API orqali.
