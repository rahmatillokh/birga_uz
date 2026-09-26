import type { AgeBand, AssessmentQuestion } from "@/lib/types";

/**
 * Boshlang‘ich rivojlanish savolnomasi — har bir yosh guruhi uchun
 * 6 yo‘nalish × 4 savol. Javoblar: Ha (2) / Ba’zan (1) / Yo‘q (0).
 * Kontent agenti tomonidan to‘ldiriladi — helper funksiyalarni o‘zgartirmang.
 *
 * Savollar ota-onaga qaratilgan va yosh guruhining yuqori chegarasidagi odatiy
 * ko‘nikmalarga asoslangan: «Ha» — ko‘nikma shakllangan. Bu skrining, tashxis emas.
 */
export const QUESTIONS: AssessmentQuestion[] = [
  // ===========================================================================
  // 1–3 yosh
  // ===========================================================================
  // Nutq
  { id: "a13-nutq-1", band: "1-3", domain: "nutq", text: "Bola 2–3 so‘zdan iborat qisqa gaplar tuza oladimi?", hint: "Masalan: «Oyi, suv ber», «Dada ketdi», «Katta mashina»." },
  { id: "a13-nutq-2", band: "1-3", domain: "nutq", text: "Bola rasmdagi tanish narsalarni ko‘rsatib, nomini ayta oladimi?" },
  { id: "a13-nutq-3", band: "1-3", domain: "nutq", text: "Bola ikki bosqichli oddiy topshiriqni imo-ishorasiz tushunib bajaradimi?", hint: "Masalan: «To‘pni ol va menga olib kel»." },
  { id: "a13-nutq-4", band: "1-3", domain: "nutq", text: "Bola «Bu nima?», «Qani?» kabi savollar beradimi?" },
  // Kognitiv
  { id: "a13-kognitiv-1", band: "1-3", domain: "kognitiv", text: "Bola narsalarni rangi yoki shakliga qarab saralay oladimi?", hint: "Masalan, qizil kubiklarni bir tomonga, ko‘klarini boshqa tomonga ajratadi." },
  { id: "a13-kognitiv-2", band: "1-3", domain: "kognitiv", text: "Bola 3–4 bo‘lakli oddiy boshqotirmani (pazlni) yig‘a oladimi?" },
  { id: "a13-kognitiv-3", band: "1-3", domain: "kognitiv", text: "Bola o‘yinda kattalarga taqlid qiladimi: qo‘g‘irchoqni ovqatlantiradi, ayiqchani uxlatadi, «telefonda gaplashadi»?" },
  { id: "a13-kognitiv-4", band: "1-3", domain: "kognitiv", text: "Bola «katta» va «kichik» tushunchalarini farqlaydimi?", hint: "«Katta to‘pni ber» desangiz, to‘g‘risini tanlaydi." },
  // Mayda motorika
  { id: "a13-mayda_motorika-1", band: "1-3", domain: "mayda_motorika", text: "Bola 6 ta va undan ko‘p kubikdan minora qura oladimi?" },
  { id: "a13-mayda_motorika-2", band: "1-3", domain: "mayda_motorika", text: "Siz ko‘rsatganingizdan keyin bola qalam bilan doira chiza oladimi?", hint: "Doira biroz qiyshiq bo‘lsa ham, chiziq uchlari tutashsa yetarli." },
  { id: "a13-mayda_motorika-3", band: "1-3", domain: "mayda_motorika", text: "Bola kitob varaqlarini bittadan varaqlay oladimi?" },
  { id: "a13-mayda_motorika-4", band: "1-3", domain: "mayda_motorika", text: "Bola idishning burama qopqog‘ini o‘zi ocha oladimi?", hint: "Masalan, suv shishasi yoki o‘yinchoq qutisining qopqog‘i." },
  // Yirik motorika
  { id: "a13-yirik_motorika-1", band: "1-3", domain: "yirik_motorika", text: "Bola yiqilmasdan erkin yugura oladimi?" },
  { id: "a13-yirik_motorika-2", band: "1-3", domain: "yirik_motorika", text: "Bola ikki oyoqlab joyida sakray oladimi?", hint: "Ikkala oyog‘i bir vaqtda yerdan uziladi va birga qo‘nadi." },
  { id: "a13-yirik_motorika-3", band: "1-3", domain: "yirik_motorika", text: "Bola tutqichni ushlab, zinapoyadan o‘zi chiqa oladimi?", hint: "3 yoshga yaqin ko‘p bolalar oyoqlarini navbatma-navbat qo‘yib chiqa boshlaydi." },
  { id: "a13-yirik_motorika-4", band: "1-3", domain: "yirik_motorika", text: "Bola to‘pni oyog‘i bilan oldinga tepa oladimi?" },
  // Ijtimoiy
  { id: "a13-ijtimoiy-1", band: "1-3", domain: "ijtimoiy", text: "Bola boshqa bolalarga qiziqadimi va ular bilan birga o‘ynashga intiladimi?" },
  { id: "a13-ijtimoiy-2", band: "1-3", domain: "ijtimoiy", text: "Bola sizga qiziq narsani ko‘rsatish uchun barmog‘i bilan ishora qiladimi yoki uni olib keladimi?", hint: "Masalan, samolyotni ko‘rib, sizga qaraydi va osmonni ko‘rsatadi." },
  { id: "a13-ijtimoiy-3", band: "1-3", domain: "ijtimoiy", text: "Bola yaqinlari xafa bo‘lsa yoki yig‘lasa, buni payqaydimi (qaraydi, yoniga keladi, quchoqlaydi)?" },
  { id: "a13-ijtimoiy-4", band: "1-3", domain: "ijtimoiy", text: "Bola siz bilan xayrlashgandan keyin (masalan, bog‘chada) 10 daqiqa ichida tinchlanadimi?", hint: "Biroz yig‘lash tabiiy; muhimi — tez orada o‘yinga qaytishi." },
  // Mustaqillik
  { id: "a13-mustaqillik-1", band: "1-3", domain: "mustaqillik", text: "Bola qoshiq bilan o‘zi ovqatlana oladimi (biroz to‘kib bo‘lsa ham)?" },
  { id: "a13-mustaqillik-2", band: "1-3", domain: "mustaqillik", text: "Bola ba’zi kiyimlarini o‘zi yecha oladimi?", hint: "Masalan: paypoq, keng shim, tugmasi ochiq ustki kiyim." },
  { id: "a13-mustaqillik-3", band: "1-3", domain: "mustaqillik", text: "Bola hojatga borish kerakligini so‘z yoki ishora bilan bildiradimi?", hint: "Kunduzi tuvak yoki hojatxonaga o‘tirishga tayyorlik belgilarini ko‘rsatadi." },
  { id: "a13-mustaqillik-4", band: "1-3", domain: "mustaqillik", text: "Bola kattalar yordamida qo‘lini yuvib, sochiqqa arta oladimi?" },

  // ===========================================================================
  // 3–5 yosh
  // ===========================================================================
  // Nutq
  { id: "a35-nutq-1", band: "3-5", domain: "nutq", text: "Bola 4 va undan ko‘p so‘zli gaplar bilan gapiradimi?", hint: "Masalan: «Men bog‘chada katta uy chizdim»." },
  { id: "a35-nutq-2", band: "3-5", domain: "nutq", text: "Bola kun davomida bo‘lgan voqeani yoki eshitgan ertagini bir-biriga bog‘lab aytib bera oladimi?" },
  { id: "a35-nutq-3", band: "3-5", domain: "nutq", text: "Bola «Kim?», «Nima?», «Qayerda?», «Nega?» savollariga mos javob beradimi?", hint: "Masalan: «Issiq kiyim nima uchun kerak?» — «Sovqotmaslik uchun»." },
  { id: "a35-nutq-4", band: "3-5", domain: "nutq", text: "Bolaning nutqini notanish odamlar ham deyarli to‘liq tushuna oladimi?", hint: "Bu yoshda R, Sh, J kabi ayrim tovushlar hali shakllanayotgan bo‘lishi mumkin — asosiysi, gapi tushunarli bo‘lsin." },
  // Kognitiv
  { id: "a35-kognitiv-1", band: "3-5", domain: "kognitiv", text: "Bola kamida 4 ta asosiy rangni to‘g‘ri nomlay oladimi?", hint: "Qizil, sariq, ko‘k, yashil." },
  { id: "a35-kognitiv-2", band: "3-5", domain: "kognitiv", text: "Bola kamida 5 ta narsani to‘g‘ri sanab, «Jami nechta?» savoliga javob bera oladimi?" },
  { id: "a35-kognitiv-3", band: "3-5", domain: "kognitiv", text: "Bola narsalarni guruhlarga ajrata oladimi (mevalar, hayvonlar, transport)?", hint: "Masalan, «olma, nok, mashina» ichidan ortiqchasini topadi." },
  { id: "a35-kognitiv-4", band: "3-5", domain: "kognitiv", text: "Bola bitta o‘yin yoki mashg‘ulotga 5–10 daqiqa davomida diqqatini qarata oladimi?" },
  // Mayda motorika
  { id: "a35-mayda_motorika-1", band: "3-5", domain: "mayda_motorika", text: "Bola qalamni musht qilib emas, barmoqlari bilan ushlaydimi?", hint: "Qalam bosh, ko‘rsatkich va o‘rta barmoq orasida turadi." },
  { id: "a35-mayda_motorika-2", band: "3-5", domain: "mayda_motorika", text: "Bola namunaga qarab kvadrat va xoch (+) chiza oladimi?" },
  { id: "a35-mayda_motorika-3", band: "3-5", domain: "mayda_motorika", text: "Bola bolalar qaychisi bilan qog‘ozni to‘g‘ri chiziq bo‘ylab qirqa oladimi?" },
  { id: "a35-mayda_motorika-4", band: "3-5", domain: "mayda_motorika", text: "Bola boshi, tanasi, qo‘l va oyoqlari bor odam rasmini chiza oladimi?", hint: "Chiroyli bo‘lishi shart emas — tana qismlarini tanib olish mumkin bo‘lsa yetarli." },
  // Yirik motorika
  { id: "a35-yirik_motorika-1", band: "3-5", domain: "yirik_motorika", text: "Bola bir oyoqda kamida 5 soniya tura oladimi?" },
  { id: "a35-yirik_motorika-2", band: "3-5", domain: "yirik_motorika", text: "Bola bir oyoqda ketma-ket bir necha marta sakray oladimi?", hint: "Kamida 3–5 marta, yiqilmasdan." },
  { id: "a35-yirik_motorika-3", band: "3-5", domain: "yirik_motorika", text: "Bola sizga otilgan katta to‘pni ikki qo‘li bilan ilib ola oladimi?", hint: "Taxminan 1,5–2 metr masofadan." },
  { id: "a35-yirik_motorika-4", band: "3-5", domain: "yirik_motorika", text: "Bola zinapoyadan tutqichsiz, oyoqlarini navbatma-navbat qo‘yib tusha oladimi?" },
  // Ijtimoiy
  { id: "a35-ijtimoiy-1", band: "3-5", domain: "ijtimoiy", text: "Bola boshqa bolalar bilan birgalikda o‘ynaydimi — rollarga bo‘linadi, birga nimadir quradi?" },
  { id: "a35-ijtimoiy-2", band: "3-5", domain: "ijtimoiy", text: "Bola o‘yinda navbatini kuta oladimi va oddiy qoidalarga amal qiladimi?" },
  { id: "a35-ijtimoiy-3", band: "3-5", domain: "ijtimoiy", text: "Bola his-tuyg‘ularini so‘z bilan ifodalay oladimi?", hint: "Masalan: «Men xafa bo‘ldim», «Qo‘rqdim», «Xursandman»." },
  { id: "a35-ijtimoiy-4", band: "3-5", domain: "ijtimoiy", text: "Bola boshqa bola yig‘lasa yoki yiqilsa, uni yupatishga yoki yordam berishga harakat qiladimi?", hint: "Quchoqlaydi, o‘yinchog‘ini beradi yoki kattalarni chaqiradi." },
  // Mustaqillik
  { id: "a35-mustaqillik-1", band: "3-5", domain: "mustaqillik", text: "Bola ko‘pchilik kiyimlarini o‘zi kiya oladimi (shim, ko‘ylak, paypoq)?", hint: "Tugma yoki zamokda ozgina yordam kerak bo‘lsa ham «Ha» deb belgilang." },
  { id: "a35-mustaqillik-2", band: "3-5", domain: "mustaqillik", text: "Bola kunduzi hojatxonadan o‘zi foydalana oladimi?" },
  { id: "a35-mustaqillik-3", band: "3-5", domain: "mustaqillik", text: "Bola qo‘lini o‘zi sovunlab yuvib, arta oladimi?" },
  { id: "a35-mustaqillik-4", band: "3-5", domain: "mustaqillik", text: "Bola qoshiq va sanchqidan foydalanib, deyarli to‘kmasdan o‘zi ovqatlanadimi?" },

  // ===========================================================================
  // 5–7 yosh
  // ===========================================================================
  // Nutq
  { id: "a57-nutq-1", band: "5-7", domain: "nutq", text: "Bola barcha tovushlarni, jumladan R, Sh, J va Ch tovushlarini to‘g‘ri talaffuz qiladimi?", hint: "Masalan, «rasm» o‘rniga «lasm» yoki «yasm» demaydi." },
  { id: "a57-nutq-2", band: "5-7", domain: "nutq", text: "Bola rasm yoki voqea asosida 5–6 gapdan iborat bog‘lanishli hikoya tuza oladimi?" },
  { id: "a57-nutq-3", band: "5-7", domain: "nutq", text: "Bola so‘zdagi birinchi tovushni aniqlay oladimi?", hint: "Masalan: «Mushuk so‘zi qaysi tovush bilan boshlanadi?» — «M»." },
  { id: "a57-nutq-4", band: "5-7", domain: "nutq", text: "Bola «chunki», «agar», «lekin» kabi so‘zlar bilan qo‘shma gaplar tuzadimi?" },
  // Kognitiv
  { id: "a57-kognitiv-1", band: "5-7", domain: "kognitiv", text: "Bola 15–20 daqiqa davomida bitta mashg‘ulotga diqqatini jamlay oladimi?", hint: "Masalan, rasm chizish, konstruktor yig‘ish yoki kitob tinglash." },
  { id: "a57-kognitiv-2", band: "5-7", domain: "kognitiv", text: "Bola 10 ichida oddiy qo‘shish va ayirishni barmoq yoki narsalar yordamida bajara oladimi?", hint: "Masalan: «3 ta olmaga yana 2 ta qo‘shsak, nechta bo‘ladi?»" },
  { id: "a57-kognitiv-3", band: "5-7", domain: "kognitiv", text: "Bola to‘rtta narsadan ortiqchasini topib, nega ortiqcha ekanini tushuntira oladimi?", hint: "Masalan: olma, nok, sabzi, uzum — «Sabzi meva emas»." },
  { id: "a57-kognitiv-4", band: "5-7", domain: "kognitiv", text: "Bola o‘ng va chap qo‘lini adashtirmay ko‘rsata oladimi?" },
  // Mayda motorika
  { id: "a57-mayda_motorika-1", band: "5-7", domain: "mayda_motorika", text: "Bola qaychi bilan doira kabi oddiy shaklni chiziq bo‘ylab qirqib ola oladimi?" },
  { id: "a57-mayda_motorika-2", band: "5-7", domain: "mayda_motorika", text: "Bola o‘z ismini harflar bilan yoza oladimi?", hint: "Harflar notekis bo‘lsa ham, o‘qib bo‘ladigan bo‘lsa yetarli." },
  { id: "a57-mayda_motorika-3", band: "5-7", domain: "mayda_motorika", text: "Bola namunaga qarab uchburchak va romb chiza oladimi?" },
  { id: "a57-mayda_motorika-4", band: "5-7", domain: "mayda_motorika", text: "Bola rasmni chegarasidan deyarli chiqmasdan bo‘yay oladimi?", hint: "Qalamni barmoqlari bilan boshqarib, kichik joylarni ham bo‘yaydi." },
  // Yirik motorika
  { id: "a57-yirik_motorika-1", band: "5-7", domain: "yirik_motorika", text: "Bola bir oyoqda 10 soniya va undan ko‘p tura oladimi?" },
  { id: "a57-yirik_motorika-2", band: "5-7", domain: "yirik_motorika", text: "Bola bir oyoqda oldinga qarab 5–10 marta sakray oladimi?" },
  { id: "a57-yirik_motorika-3", band: "5-7", domain: "yirik_motorika", text: "Bola arg‘amchida ketma-ket bir necha marta sakray oladimi?", hint: "Arg‘amchini o‘zi aylantirib, kamida 3–5 marta." },
  { id: "a57-yirik_motorika-4", band: "5-7", domain: "yirik_motorika", text: "Bola tennis to‘pidek kichik to‘pni qo‘llari bilan ilib ola oladimi?", hint: "Taxminan 2 metr masofadan, ko‘kragiga bosmasdan, kaftlari bilan." },
  // Ijtimoiy
  { id: "a57-ijtimoiy-1", band: "5-7", domain: "ijtimoiy", text: "Bola tengdoshlari bilan qoidali o‘yinlarni o‘ynay oladimi?", hint: "Masalan: quvlashmachoq, berkinmachoq, stol o‘yinlari." },
  { id: "a57-ijtimoiy-2", band: "5-7", domain: "ijtimoiy", text: "Bolaning birga o‘ynashni yoqtiradigan do‘sti yoki do‘stlari bormi?" },
  { id: "a57-ijtimoiy-3", band: "5-7", domain: "ijtimoiy", text: "Bola yutqazganda yoki xohlagani bo‘lmaganda o‘zini bosib, tez tinchlana oladimi?" },
  { id: "a57-ijtimoiy-4", band: "5-7", domain: "ijtimoiy", text: "Bola tengdoshlari bilan kelishmovchilikni urishmasdan, so‘z bilan hal qilishga harakat qiladimi?", hint: "Masalan, navbat bilan o‘ynashni taklif qiladi yoki kattalardan yordam so‘raydi." },
  // Mustaqillik
  { id: "a57-mustaqillik-1", band: "5-7", domain: "mustaqillik", text: "Bola o‘zi mustaqil kiyina oladimi (tugmalarni qadash va zamokni tortish bilan)?" },
  { id: "a57-mustaqillik-2", band: "5-7", domain: "mustaqillik", text: "Bola tishlarini o‘zi yuvadimi (kattalar faqat tekshirib turadi)?" },
  { id: "a57-mustaqillik-3", band: "5-7", domain: "mustaqillik", text: "Bola oyoq kiyimining bog‘ichini o‘zi bog‘lay oladimi?", hint: "Ko‘pchilik bolalar bu ko‘nikmani 6–7 yoshda egallaydi." },
  { id: "a57-mustaqillik-4", band: "5-7", domain: "mustaqillik", text: "Bola oddiy uy yumushlarida muntazam yordam beradimi?", hint: "Masalan: dasturxon yozishga yordamlashadi, gul sug‘oradi, o‘yinchoqlarini yig‘ishtiradi." },
];

export function questionsFor(band: AgeBand): AssessmentQuestion[] {
  return QUESTIONS.filter((q) => q.band === band);
}
