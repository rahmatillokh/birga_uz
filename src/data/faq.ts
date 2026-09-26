import type { FaqItem } from "@/lib/types";

/** Ko‘p so‘raladigan savollar (kategoriyalar tartibida). */
export const FAQ: FaqItem[] = [
  // Umumiy
  {
    category: "umumiy",
    q: "YuniQo nima va u kimlar uchun?",
    a: "YuniQo — erta yoshdagi bolalarning rivojlanishini qo‘llab-quvvatlovchi platforma. Unda rivojlanish baholashi, mashqlar, AI vositalari, mutaxassislar katalogi, bepul tuman sessiyalari, YuniQo Market va bilimlar bazasi bor. Platforma barcha oilalar, jumladan nutq kechikishi, autizm spektri, Daun sindromi, motorika yoki o‘rganishdagi qiyinchiliklari bor bolalarning ota-onalari uchun mo‘ljallangan.",
  },
  {
    category: "umumiy",
    q: "@YuniQo_bot Telegram boti nima uchun kerak?",
    a: "@YuniQo_bot YuniQo imkoniyatlariga Telegram orqali tezkor kirishni ta’minlaydi. Bot bugungi mashqlar va qayta baholash haqida eslatib turadi, bepul tuman sessiyalariga yozilishga yordam beradi. Eslatmalar vaqti va kunlarini o‘zingizga qulay qilib sozlashingiz mumkin.",
  },
  {
    category: "umumiy",
    q: "Bepul tuman sessiyalari nima?",
    a: "Bu O‘zbekistonning har bir tumanida o‘tkaziladigan bepul uchrashuvlar: mutaxassislar bilan dastlabki konsultatsiya, ota-onalar uchun seminarlar, bolalar uchun amaliy mashg‘ulotlar va mutaxassislar bilan uchrashuvlar. Hududingizdagi yaqin sessiyalarni ilovada ko‘rib, joy band qilishingiz yoki @YuniQo_bot orqali yozilishingiz mumkin.",
  },

  // Baholash
  {
    category: "baholash",
    q: "Rivojlanish baholashi qanday o‘tkaziladi?",
    a: "Siz bolaning yoshiga mos savollarga «Ha», «Ba’zan» yoki «Yo‘q» deb javob berasiz. Savolnoma 1–3, 3–5 va 5–7 yoshli bolalar uchun alohida tuzilgan va oltita yo‘nalishni qamrab oladi: nutq, diqqat va tafakkur, mayda motorika, yirik motorika, ijtimoiy-emotsional rivojlanish va mustaqillik. Asosiy baholash bepul va ko‘p vaqt olmaydi.",
  },
  {
    category: "baholash",
    q: "YuniQo tashxis qo‘yadimi?",
    a: "Yo‘q. YuniQo tashxis qo‘ymaydi va shifokor yoki mutaxassis ko‘rigi o‘rnini bosmaydi. Uning vazifasi — ota-onaga bolani kuzatish va uyda mashq qilishda yordam berish hamda mutaxassislar bilan ishlashni osonlashtirish. Tashxis va davolash rejasini faqat mutaxassis belgilaydi.",
  },
  {
    category: "baholash",
    q: "Natijalar nimani anglatadi va keyin nima qilish kerak?",
    a: "Har bir yo‘nalish bo‘yicha ball va daraja ko‘rsatiladi: «Yaxshi», «Rivojlanmoqda» yoki «E’tibor kerak». «E’tibor kerak» belgisi vahima uchun emas — bu shu yo‘nalishni mutaxassis bilan muhokama qilish uchun signal. Natijalar asosida ilova mashqlar rejasini taklif qiladi, qayta baholash vaqti kelganda esa eslatma yuboradi.",
  },

  // Mutaxassis
  {
    category: "mutaxassis",
    q: "Mutaxassisni qanday tanlash mumkin?",
    a: "Mutaxassislar katalogida logoped, defektolog, bolalar psixologi, fizioterapevt va boshqa mutaxassislarni hudud, xizmat turi (onlayn yoki oflayn) va narx bo‘yicha saralash mumkin. Har bir profilda tajriba, sertifikatlar, ish uslubi va ota-onalarning sharhlari ko‘rsatilgan. Tasdiqlangan mutaxassislar maxsus belgi bilan ajratiladi.",
  },
  {
    category: "mutaxassis",
    q: "Bepul konsultatsiya olsa bo‘ladimi?",
    a: "Ha. Har bir tumanda o‘tkaziladigan bepul YuniQo sessiyalarida mutaxassislar dastlabki konsultatsiya beradi. Premium obunachilarga esa har oy bitta mutaxassis konsultatsiyasi bepul taqdim etiladi.",
  },
  {
    category: "mutaxassis",
    q: "Mutaxassis uyga vazifa bera oladimi?",
    a: "Ha. Siz ruxsat bergan mutaxassis ilova orqali bolaga mashqlar va topshiriqlar biriktirishi, tavsiyalar yozishi mumkin. Topshiriqlar bolaning rejasida paydo bo‘ladi, bajarilganini esa mutaxassis kuzatib boradi. Shunday qilib, mashg‘ulotlar qabullar oralig‘ida ham uzilmaydi.",
  },

  // Premium
  {
    category: "premium",
    q: "Qaysi imkoniyatlar bepul?",
    a: "Asosiy rivojlanish baholashi, mashqlarning cheklangan to‘plami, rivojlantiruvchi videolar, ota-onalar hamjamiyati va bepul tuman sessiyalari barcha foydalanuvchilar uchun bepul. AI yordamchiga ham kuniga 3 tagacha savolni bepul berish mumkin.",
  },
  {
    category: "premium",
    q: "Premium nimalarni beradi va narxi qancha?",
    a: "Premium narxi — oyiga 79 000 so‘m yoki yiliga 690 000 so‘m; yillik obuna oylik to‘lovga qaraganda arzonroq tushadi. Premium AI yordamchi bilan cheksiz suhbat, AI video nazorat, AI yordamida tuzilgan individual rivojlanish dasturi, kengaytirilgan progress va grafiklar, har oy 1 ta bepul mutaxassis konsultatsiyasi hamda batafsil PDF rivojlanish hisobotini ochib beradi.",
  },
  {
    category: "premium",
    q: "Premiumni bepul sinab ko‘rsa bo‘ladimi?",
    a: "Ha, Premium obunaning 7 kunlik bepul sinov muddati bor. Shu vaqt ichida barcha Premium imkoniyatlarini sinab ko‘rasiz, so‘ng obunani davom ettirish yoki bepul tarifda qolishni o‘zingiz hal qilasiz.",
  },

  // Xavfsizlik
  {
    category: "xavfsizlik",
    q: "AI video nazoratda bolamning videosi qayerga yuboriladi?",
    a: "Hech qayerga. Kamera orqali AI tahlil to‘liq sizning qurilmangizda bajariladi, video serverga yuklanmaydi. Ilovada faqat mashq natijasi saqlanadi. Kameradan foydalanishga ruxsatni istalgan vaqtda sozlamalarda o‘chirib qo‘yishingiz mumkin.",
  },
  {
    category: "xavfsizlik",
    q: "Bolam haqidagi ma’lumotlarni kim ko‘ra oladi?",
    a: "Faqat siz va siz ruxsat bergan mutaxassislar. Mutaxassis bilan nimani ulashishni — baholash natijalari, mashqlar, AI tekshiruvlari, kuzatuvlar yoki mutaxassis eslatmalarini — o‘zingiz tanlaysiz va ruxsat muddatini belgilaysiz. Ruxsatni istalgan vaqtda bekor qilishingiz mumkin, shundan so‘ng mutaxassis ma’lumotlarni ko‘ra olmaydi.",
  },
];
