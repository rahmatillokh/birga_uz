/**
 * Oflayn "demo AI" — Claude API kaliti bo‘lmaganda ham Ustoz AI ishlashi uchun.
 * Kalit so‘zlar bo‘yicha oldindan tayyorlangan, mutaxassislar tavsiyalariga asoslangan javoblar.
 */

type Topic = { keys: RegExp; answer: (name: string) => string };

const TOPICS: Topic[] = [
  {
    keys: /\br\s*(harf|tovush)|«r»|\brrr/i,
    answer: (n) => `R tovushi odatda 5–6 yoshgacha shakllanadi, shuning uchun xavotir olmang — to‘g‘ri mashqlar bilan ${n} albatta o‘rganadi. 💪

**Har kuni 7–10 daqiqa, ko‘zgu oldida:**
- 🐴 **«Otcha»** — til uchini tanglayga yopishtirib «taq-taq» qilish (10–15 marta)
- 🥁 **«Barabanchi»** — til uchi yuqori tishlar orqasida: «d-d-d-d» (til titrashiga tayyorlaydi)
- 🍯 **«Mazali murabbo»** — yuqori labni til bilan yalash
- 🎙️ So‘ng bo‘g‘inlar: **RA–RO–RU**, keyin so‘zlar: *rak, ruchka, arra, anor*

**Maslahat:** bola xato aytsa, tuzatmang — o‘zingiz to‘g‘ri aytib, qaytaring: «Ha, bu *rrrak*!». Mashqni o‘yin qiling va har urinishni maqtang.

Agar 5 yoshdan keyin ham R umuman chiqmasa yoki boshqa tovushlar ham almashsa, logoped bilan maslahatlashing — YuniQo’dagi bepul tuman sessiyasiga yozilishingiz mumkin.`,
  },
  {
    keys: /\bsh\b|sh tovush|sh harf|shivil/i,
    answer: (n) => `Sh tovushi uchun til «kosacha» shaklida yuqoriga ko‘tarilishi kerak. ${n} bilan shu mashqlarni qiling:

- ☕ **«Kosacha»** — tilni chiqarib, chetlarini yuqoriga ko‘tarish (5 soniya ushlash)
- 🌬️ **«Shamolcha»** — kosachadagi «shamol» bilan paxta bo‘lagini puflash
- 🐍 **«Ilon vishillashi»** — «shshsh» cho‘zib aytish
- 🎙️ So‘zlar: *shar, shapka, mushuk, qoshiq, quyosh*

Kuniga 2 marta, 5 daqiqadan. YuniQo’dagi «Talaffuz» bo‘limida so‘zlarni AI bilan tekshirib borishingiz mumkin.`,
  },
  {
    keys: /gapirmay|gapirmaydi|nutq kech|so‘z aytmay|so'z aytmay|kam gapir|gapira olmay|nutqi yo‘q|nutqi kech/i,
    answer: (n) => `Nutq rivojlanishi har bir bolada har xil tezlikda bo‘ladi, lekin erta yordam juda muhim. ${n} uchun uyda:

- 🗣️ **Kun bo‘yi sharhlang:** «Mana, choy. Choy issiq. Oyi choy ichyapti» — qisqa, aniq gaplar
- ⏸️ **Pauza qiling:** savol berib, 5–7 soniya javob kuting
- 📚 **Rasmli kitoblar:** har kuni 10 daqiqa — rasmlarni nomlang, bolaning o‘zi ko‘rsatishini so‘rang
- 🎵 **Qo‘shiq va she’rlar:** oxirgi so‘zni bolaga qoldiring
- 📵 **Ekran vaqtini** kamaytiring — jonli muloqot o‘rnini hech narsa bosa olmaydi

**Qachon mutaxassisga borish kerak:** 1,5 yoshda so‘z bo‘lmasa, 2 yoshda 2 so‘zli ibora bo‘lmasa, yoki bola avval aytgan so‘zlarini yo‘qotsa — logoped va pediatrga murojaat qiling.`,
  },
  {
    keys: /diqqat|jamlay|chalg‘i|chalg'i|giperaktiv|o‘tirmaydi|o'tirmaydi|tinch o‘tir/i,
    answer: (n) => `Diqqatni jamlash — mashq bilan o‘sadigan ko‘nikma. ${n} bilan:

- ⏱️ **Qisqa seanslar:** 5–7 daqiqadan boshlang, har hafta 1–2 daqiqaga uzaytiring
- 🧩 **O‘yinlar:** «Nima o‘zgardi?», «Ortiqchasini top», xotira kartalari (YuniQo’dagi o‘yinlar bo‘limida bor)
- 🎯 **Bitta ko‘rsatma:** «Qizil kubikni ol» — keyin ikkinchi qadam
- 🏃 **Harakat tanaffusi:** har 10 daqiqada 1–2 daqiqa sakrash yoki cho‘zilish
- 🌙 **Uyqu tartibi:** 10–12 soat uyqu diqqatga bevosita ta’sir qiladi

Maqtovni aniq qiling: «Rasmni oxirigacha bo‘yading, barakalla!» Agar diqqat muammosi bog‘cha va uyda doimiy bo‘lsa, defektolog yoki bolalar psixologi bilan maslahatlashing.`,
  },
  {
    keys: /yassi|oyoq gumbaz|tovon|oyog‘i|oyogi|ortoped/i,
    answer: (n) => `Ko‘pchilik bolalarda 5–6 yoshgacha fiziologik yassi oyoqlik bo‘ladi — oyoq gumbazi asta-sekin shakllanadi. ${n} uchun uy mashqlari (yalangoyoq, kuniga 10 daqiqa):

- 🩰 **Oyoq uchida ko‘tarilish** — 10 marta (YuniQo AI video nazorat bilan tekshirsa bo‘ladi)
- 🧣 **Ro‘molcha yig‘ish** — oyoq barmoqlari bilan
- ✏️ **Qalam terish** — barmoqlar bilan mayda buyumlarni olish
- 🦶 **Tovonda va oyoq tashqi qirrasida yurish**
- ⚽ **Kichik to‘pni oyoq ostida aylantirish**
- 🏖️ **Qum, maysa, toshchalarda yalangoyoq yurish**

**Mutaxassisga murojaat qiling**, agar oyoqda og‘riq bo‘lsa, bola tez charchasa, poyabzal bir tomoni tez yeyilsa yoki 6 yoshdan keyin ham gumbaz ko‘rinmasa (fizioterapevt yoki ortoped).`,
  },
  {
    keys: /qalam|qaychi|mayda motor|barmoq|yoza olmay|chiza olmay/i,
    answer: (n) => `Mayda motorika — nutq va yozish bilan chambarchas bog‘liq. ${n} bilan kuniga 10–15 daqiqa:

- 🟠 **Plastilin:** sharcha, «chuvalchang» yasash
- 📿 **Munchoq yoki makaron terish** ipga
- 🧷 **Kiyim qisqichlari** bilan karton «tipratikan» yasash
- ✂️ **Qaychi:** avval qalin qog‘ozni bir urinishda qirqish, keyin chiziq bo‘ylab
- ✋ **Barmoq o‘yinlari** — she’r bilan

Qalamni to‘g‘ri ushlash uchun qisqa, uchburchak qalamlar yaxshi yordam beradi. ⚠️ Mayda buyumlar bilan faqat kattalar nazoratida o‘ynang.`,
  },
  {
    keys: /autizm|ko‘z kontakt|ko'z kontakt|ismiga javob|stereotip|takrorlay/i,
    answer: () => `Autizm spektri — bolaning dunyoni o‘ziga xos tarzda qabul qilishi bilan bog‘liq rivojlanish xususiyati. Tashxisni faqat mutaxassislar (bolalar psixiatri, nevrolog, psixolog) kompleks tekshiruv asosida qo‘yadi.

**E’tibor beriladigan belgilar:** ismiga kam javob berish, ko‘z kontaktining kamligi, qiziqishlarini ko‘rsatmaslik (barmoq bilan ko‘rsatish), takroriy harakatlar, o‘zgarishlarga qiyin moslashish.

**Uyda nima qilish mumkin:**
- 🗓️ Barqaror kun tartibi va **rasmli jadval**
- 🗣️ Qisqa, aniq gaplar; bolaning qiziqishidan boshlash
- 🧸 Bolaning o‘yiniga qo‘shiling, uni boshqarmang
- 🔇 Sensor yuklamani kamaytiring (shovqin, yorug‘lik)

Erta yordam juda samarali. YuniQo’dagi bepul tuman sessiyasida psixolog va defektolog bilan uchrashishingiz mumkin. 💙`,
  },
  {
    keys: /jahl|injiq|yig‘la|yig'la|tantrum|urish|qaysar|xulq/i,
    answer: (n) => `Jahl va injiqlik — bola hissiyotlarini hali so‘z bilan ifodalay olmasligining belgisi. ${n} bilan:

- 🫂 **Avval tinchlaning, keyin tinchlantiring:** past, sokin ovoz
- 🏷️ **Hissiyotni nomlang:** «Sen jahling chiqdi, chunki o‘yinchoq sinib qoldi»
- ✅ **Tanlov bering:** «Qizil yoki ko‘k kosadan ichasanmi?»
- 📅 **Oldindan ogohlantiring:** «5 daqiqadan keyin o‘yinni tugatamiz»
- 🌟 **Yaxshi xulqni ko‘proq payqang** — maqtov jazodan samaraliroq

YuniQo’dagi «Hissiyotlar» o‘yini bolaga his-tuyg‘ularni tanishga yordam beradi. Agar jahl tez-tez va kuchli bo‘lsa, bolalar psixologi bilan maslahatlashing.`,
  },
  {
    keys: /telefon|planshet|ekran|multfilm|televizor/i,
    answer: () => `Mutaxassislar tavsiyasi: 2 yoshgacha ekrandan iloji boricha voz kechish, 2–5 yoshda kuniga 1 soatdan oshmasligi — va iloji bo‘lsa, kattalar bilan birga ko‘rish.

- ⏰ Aniq vaqt belgilang (masalan, kechki ovqatdan keyin 20 daqiqa)
- 🍽️ Ovqat va uxlashdan oldin ekransiz
- 🎥 Rivojlantiruvchi kontentni tanlang va ko‘rganingizdan keyin suhbatlashing: «Kim nima qildi?»
- 🔁 Ekran o‘rniga: rasm chizish, konstruktor, birga ovqat tayyorlash

YuniQo videolari qisqa (2–10 daqiqa) va interaktiv — bola videodan keyin mashqni takrorlaydi.`,
  },
  {
    keys: /uxla|uyqu|kechasi/i,
    answer: (n) => `Sifatli uyqu rivojlanish, diqqat va xulq uchun juda muhim. ${n} yoshidagi bolalarga kuniga 10–13 soat uyqu kerak.

- 🌙 Har kuni bir xil vaqtda yotish (±30 daqiqa)
- 🛁 Yotish oldi marosimi: cho‘milish → pijama → kitob → uyqu
- 📵 Yotishdan 1 soat oldin ekransiz
- 🌡️ Xona salqin, qorong‘i va sokin bo‘lsin

Agar bola kechasi tez-tez uyg‘onsa, xurrak otsa yoki kunduzi haddan tashqari charchoq bo‘lsa, pediatrga murojaat qiling.`,
  },
  {
    keys: /ovqat|yemaydi|ishtaha/i,
    answer: () => `Ovqat tanlash bolalarda keng tarqalgan holat. Yordam beradigan usullar:

- 🍽️ Yangi taomni tanish taom bilan birga, kichik miqdorda bering
- 🔁 Bola yangi taomni 10–15 martagacha tatib ko‘rgandan keyin qabul qilishi mumkin
- 👩‍🍳 Birga tayyorlang — bola o‘zi yuvgan sabzini yeyishga moyilroq
- 🚫 Majburlamang va ovqatni mukofot sifatida ishlatmang

Agar vazn yo‘qotish, chaynash/yutishda qiyinchilik bo‘lsa — pediatr va logoped (oral-motor ko‘nikmalar) bilan maslahatlashing.`,
  },
  {
    keys: /kiyin|mustaqil|tish yuv|hojat|tugma/i,
    answer: (n) => `Mustaqillik ko‘nikmalarini bosqichma-bosqich o‘rgatish eng samarali:

- 🖼️ **Rasmli ketma-ketlik:** har bir qadam rasmi (masalan, tish yuvish: pasta → tish → chayish)
- ↩️ **Oxiridan boshlash:** avval siz qilasiz, oxirgi qadamni ${n} qiladi, asta-sekin ko‘proq qadamlar
- ⏳ **Vaqt bering** — shoshilmaydigan paytda mashq qiling
- 👕 Katta tugmali, rezinkali kiyimlardan boshlang

YuniQo’dagi «Kun tartibi» o‘yini ketma-ketlikni o‘rgatishga yordam beradi.`,
  },
  {
    keys: /maktab|harf|o‘qish|o'qish|sanash/i,
    answer: (n) => `Maktabga tayyorgarlik faqat harf va raqamlar emas — diqqat, mustaqillik va muloqot ham muhim. ${n} bilan:

- 🔤 Tovushlarni eshitish: «Mushuk so‘zi qaysi tovush bilan boshlanadi?»
- 🔢 Buyumlarni 10 gacha sanash, «ko‘p–kam» taqqoslash
- ✏️ Qalam bilan yo‘lak, labirint chizish
- ⏱️ 15 daqiqa bitta topshiriqqa jamlanish
- 🤝 Navbat bilan o‘ynash, qoidaga amal qilish

Defektolog mashqlari bo‘limidagi «Maktabga tayyorgarlik» mavzusidan har kuni bittadan bajaring.`,
  },
];

const GENERIC = (n: string) => `Ajoyib savol! Umumiy tavsiyalarim:

- 🎯 **Kichik qadamlar:** har kuni 15–20 daqiqa, bir xil vaqtda mashg‘ulot
- 🎲 **O‘yin shaklida:** ${n} charchamasligi uchun mashqlarni o‘yinga aylantiring
- 🌟 **Maqtov:** natijani emas, harakatni maqtang
- 📊 **Kuzatib boring:** YuniQo’da har bir mashqdan keyin natijani belgilang — progress grafigida o‘sishni ko‘rasiz
- 👨‍⚕️ **Mutaxassis bilan ishlang:** rivojlanish pasportini mutaxassisga ulashing, u aniq tavsiya beradi

Savolingizni aniqroq yozsangiz (masalan, «R tovushi», «diqqat», «yassi oyoq»), batafsil maslahat beraman.`;

/** Turli apostroflarni (ʻ ʼ ’ ` ') bitta ‘ ga keltirish — kalit so‘zlar hammasi bilan mos kelsin */
function norm(s: string): string {
  return s.toLowerCase().replace(/[ʻʼ’`']/g, "‘");
}

export function fallbackAnswer(question: string, childName = "farzandingiz"): string {
  const q = norm(question);
  for (const t of TOPICS) if (t.keys.test(q)) return t.answer(childName);
  if (/salom|assalom/i.test(q)) {
    return `Assalomu alaykum! 👋 Men Ustoz AI — YuniQo yordamchisiman. ${childName === "farzandingiz" ? "Farzandingiz" : childName} rivojlanishi, mashqlar, nutq, diqqat, motorika yoki kundalik tartib haqida savol bering — bajonidil yordam beraman.`;
  }
  if (/reja|bugun|nima qil/i.test(q)) {
    return `Bugungi mashg‘ulot uchun taklif (${childName}, ~20 daqiqa):

1. 🗣️ **Artikulyatsion gimnastika** — 5 daqiqa («Otcha», «Kurakcha», «Soat mili»)
2. 🧠 **Diqqat o‘yini** — 5 daqiqa (xotira kartalari yoki «Nima o‘zgardi?»)
3. ✋ **Mayda motorika** — 5 daqiqa (plastilin yoki munchoq terish)
4. 🦶 **Harakat** — 5 daqiqa (oyoq uchida yurish, bir oyoqda turish)

Har bir mashqdan keyin YuniQo’da «Bajarildi» tugmasini bosing — natijalar pasportga yig‘iladi. 🌟`;
  }
  return GENERIC(childName);
}

/** Bola bilan suhbat rejimi uchun oddiy javoblar */
export function fallbackKidAnswer(message: string, childName = "do‘stim"): string {
  const m = norm(message);
  if (/mushuk|kuchuk|hayvon|sher|it\b/.test(m)) return `Voy, qanday ajoyib! 🐱 Mushuk «miyov» deydi, kuchuk esa «vov-vov». ${childName}, sher qanday bo‘kiradi? Qani, birga bo‘kiramiz: «R-r-r-r!» 🦁`;
  if (/rang|qizil|ko‘k|sariq/.test(m)) return `Ranglar juda chiroyli! 🌈 Olma qizil 🍎, osmon ko‘k 💙, quyosh sariq ☀️. ${childName}, sening sevimli ranging qaysi?`;
  if (/salom|assalom/.test(m)) return `Salom, ${childName}! 👋 Men Ustoz AI. Bugun birga o‘ynaymizmi? Hayvonlar, ranglar yoki sanash — qaysi birini tanlaysan? 😊`;
  if (/\d|sana/.test(m)) return `Keling, sanaymiz! 🍎🍎🍎 Bu yerda nechta olma bor? Barmoqchalaring bilan sanab ko‘r! ✋`;
  return `Zo‘r aytding, ${childName}! 🌟 Sen juda aqllisan. Keling, o‘yin o‘ynaymiz: men hayvon aytaman, sen uning ovozini chiqarasan. Sigir! 🐄 U qanday deydi?`;
}
