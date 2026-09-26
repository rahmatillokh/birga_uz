import type { Article } from "@/lib/types";

/**
 * O‘zbek tilidagi bilim bazasi (yangilari birinchi).
 * body — oddiy markdown: "## " sarlavha, "- " ro‘yxat, bo‘sh qator — yangi paragraf.
 */
export const ARTICLES: Article[] = [
  {
    id: "nutq-kechikishi-qachon-xavotirlanish",
    topic: "nutq",
    title: "Nutq kechikishi: qachon xavotirlanish kerak?",
    summary:
      "Bolalar turli sur’atda gapira boshlaydi, lekin ba’zi belgilar kutib turish emas, mutaxassisga murojaat qilish vaqti kelganini bildiradi. Yoshga oid asosiy mo‘ljallar va uyda nima qilish mumkinligi haqida.",
    readMin: 5,
    author: "Dilnoza Karimova",
    authorId: "sp-dilnoza",
    date: "2026-09-22",
    emoji: "🗣️",
    tags: ["nutq", "erta belgilar", "logoped"],
    body: `Ko‘p ota-onalar «hali kichkina, o‘zi gapirib ketadi» degan gapni eshitgan. Haqiqatan ham, bolalar turli sur’atda rivojlanadi va bir-ikki oylik farq odatda xavotirga sabab bo‘lmaydi. Lekin nutqdagi kechikishni erta payqash va o‘z vaqtida yordam berish bolaning keyingi rivojlanishi uchun juda muhim. Shubha tug‘ilganda kutib turishdan ko‘ra mutaxassisga ko‘rsatib olish har doim xavfsizroq.

## Nutq faqat so‘zlardan iborat emas

Nutq rivojlanishi bola birinchi so‘zni aytishidan ancha oldin boshlanadi. Chaqaloq ovozingiz kelgan tomonga qaraydi, jilmayadi, turli tovushlar chiqaradi, keyin «ba-ba», «da-da» kabi bo‘g‘inlarni takrorlaydi. So‘ngra imo-ishoralar paydo bo‘ladi: qo‘l silkitib xayrlashish, barmoq bilan ko‘rsatish, «ber» degandek qo‘l cho‘zish. Nutqni tushunish ham gapirish kabi muhim. Bola oddiy iltimoslarni bajara oladimi, tanish narsalarni nomi aytilganda ko‘rsata oladimi — bularga ham e’tibor bering.

## Yoshga oid taxminiy mo‘ljallar

Quyidagi mo‘ljallar ko‘pchilik bolalarga xos. Ular qat’iy me’yor emas, balki kuzatish uchun yo‘nalish:

- Taxminan 12 oylikda: ismini aytganda qayrilib qaraydi, bo‘g‘inlarni takrorlaydi, bir-ikki oddiy so‘z aytishi mumkin.
- 18 oylikda: bir nechta so‘z ishlatadi, oddiy iltimoslarni tushunadi, kerakli narsani barmoq bilan ko‘rsatadi.
- 2 yoshda: so‘z boyligi tez o‘sadi, ikki so‘zni qo‘shib aytadi: «oyi, ber», «mashina ketdi».
- 3 yoshda: 3–4 so‘zli oddiy gaplar tuzadi, oila a’zolari uning nutqini ko‘p hollarda tushunadi.

## Qachon mutaxassisga murojaat qilish kerak

Quyidagi holatlardan birortasi kuzatilsa, logoped yoki pediatrga murojaat qilishni kechiktirmang:

- 12 oylikda g‘o‘ldiramasa, qo‘l silkitish yoki barmoq bilan ko‘rsatish kabi imo-ishoralardan foydalanmasa.
- 16 oylikda birorta ham so‘z aytmasa.
- 2 yoshda mustaqil ravishda ikki so‘zli ibora tuzmasa (eshitganini takrorlashi hisobga olinmaydi).
- 3 yoshda uning nutqini yaqinlari ham ko‘pincha tushunmasa.
- Oddiy iltimoslarni tushunmayotgandek tuyulsa yoki ismiga qaramasa.
- Istalgan yoshda ilgari aytgan so‘zlarini yoki boshqa ko‘nikmalarini yo‘qota boshlasa.

Nutq kechikishida dastlabki qadamlardan biri — eshitishni tekshirtirish. Hatto yengil eshitish pasayishi ham nutq rivojlanishiga ta’sir qilishi mumkin.

## Kimga murojaat qilish kerak

Pediatr bolaning umumiy rivojlanishini ko‘rib chiqadi va kerak bo‘lsa, eshitishni tekshirishga yo‘llanma beradi. Logoped nutqni tushunish va gapirishni baholaydi, mashg‘ulotlar rejasini tuzadi. Nutq kechikishi boshqa sohalardagi qiyinchiliklar bilan birga kuzatilsa, nevrolog, defektolog yoki bolalar psixologi ko‘rigi ham kerak bo‘lishi mumkin. Hududingizdagi bepul YuniQo sessiyalarida logoped bilan dastlabki maslahat olishingiz mumkin.

## Keng tarqalgan noto‘g‘ri tushunchalar

«O‘g‘il bolalar kech gapiradi» yoki «otasi ham kech gapirgan» degan gaplarni tez-tez eshitamiz. Bolalar o‘rtasida kichik farqlar bo‘lishi mumkin, ammo bu kutib turishga asos bo‘lmaydi. Ikki tilli oilada o‘sish ham nutq kechikishiga sabab bo‘lmaydi: bola ikki tilni ham o‘zlashtira oladi, faqat har ikki tilda muloqot yetarli va izchil bo‘lishi kerak.

## Uyda nima qilish mumkin

- Kun davomida qilayotgan ishlaringizni oddiy so‘zlar bilan izohlang: «Mana, olmani yuvyapmiz».
- Bola aytgan so‘zni biroz kengaytirib qaytaring: bola «mashina» desa, siz «katta mashina ketdi» deng.
- Savol berganingizdan keyin javob uchun 5–10 soniya kuting, shoshirmang.
- Har kuni birga rasmli kitob ko‘ring va rasmlar haqida gaplashing.
- Ekran vaqtini kamaytirib, jonli muloqotga ko‘proq vaqt ajrating.
- Bolani «ayt!» deb majburlamang — bosim ko‘pincha teskari natija beradi.

YuniQo ilovasidagi rivojlanish baholashi bolaning nutqini boshqa yo‘nalishlar bilan birga kuzatishga yordam beradi. Natijalarni mutaxassisga ko‘rsatsangiz, suhbat aniqroq va samaraliroq bo‘ladi.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "yuniqo-hisobotidan-foydalanish",
    topic: "qollanma",
    title: "YuniQo rivojlanish hisobotidan mutaxassis bilan qanday foydalanish kerak",
    summary:
      "Hisobot bolaning uydagi kundalik hayotini mutaxassisga qisqa vaqtda ko‘rsatib beradi. Uni qanday o‘qish, qanday ulashish va qabulda qanday ishlatish haqida amaliy yo‘riqnoma.",
    readMin: 4,
    author: "YuniQo tahririyati",
    date: "2026-09-15",
    emoji: "📊",
    tags: ["YuniQo", "hisobot", "mutaxassis", "maxfiylik"],
    body: `Mutaxassis qabulida vaqt cheklangan, bola esa notanish joyda o‘zini uydagidan boshqacha tutishi mumkin. YuniQo rivojlanish hisoboti aynan shu bo‘shliqni to‘ldirish uchun yaratilgan. U sizning kuzatuvlaringizni, baholash natijalarini va uyda bajarilgan mashqlarni bir joyga jamlaydi. Shunda mutaxassis bolani faqat bir soatlik uchrashuv orqali emas, balki haftalar davomidagi kundalik hayoti orqali ham ko‘ra oladi.

## Hisobotda nimalar bor

- Oltita yo‘nalish bo‘yicha rivojlanish profili: nutq, diqqat va tafakkur, mayda motorika, yirik motorika, ijtimoiy-emotsional rivojlanish va mustaqillik.
- Har bir yo‘nalish bo‘yicha daraja: «Yaxshi», «Rivojlanmoqda» yoki «E’tibor kerak».
- Vaqt o‘tishi bilan o‘zgarishlar: qayta baholash natijalari va progress grafiklari.
- Bajarilgan mashqlar, AI tekshiruvlari natijalari va bolaning mashqlarga munosabati.
- Siz yozib borgan kuzatuvlar va qo‘yilgan maqsadlar.

## Muhim: hisobot tashxis emas

Hisobot sizning javoblaringiz va uydagi mashg‘ulotlar asosida tuziladi. U bolaning qaysi sohada ko‘proq qo‘llab-quvvatlashga ehtiyoji borligini ko‘rsatadi, lekin tashxis qo‘ymaydi. «E’tibor kerak» belgisi vahima uchun emas, balki mutaxassis bilan maslahatlashish uchun signal. Tashxis va davolash rejasini faqat mutaxassis belgilaydi.

## Hisobotni qanday o‘qish kerak

Bitta raqamga emas, umumiy manzaraga qarang. Bir yo‘nalishdagi pastroq natija boshqa yo‘nalishlardagi kuchli tomonlar bilan birga ko‘rilgandagina to‘g‘ri ma’no kasb etadi. O‘zgarishlarni bir necha hafta davomida kuzating: bola charchagan, betob yoki kayfiyatsiz bo‘lgan kunlari natijalar pastroq bo‘lishi tabiiy. Eng muhimi — vaqt o‘tishi bilan qaysi yo‘nalishda siljish borligi va qayerda qo‘shimcha yordam kerakligi.

## Hisobotni qanday ulashish mumkin

Bolangiz haqidagi ma’lumotlarni kim ko‘rishini faqat siz hal qilasiz:

- Mutaxassis uchun alohida havola yarating va unda nimalar ko‘rinishini tanlang: baholash, mashqlar, AI natijalari, kuzatuvlar yoki mutaxassis eslatmalari.
- Havolaning amal qilish muddatini belgilang.
- Ruxsatni istalgan vaqtda bekor qilishingiz mumkin — shundan so‘ng mutaxassis ma’lumotlarni ko‘ra olmaydi.
- Premium foydalanuvchilar batafsil hisobotni PDF shaklida yuklab olishi va qabulga chop etib olib borishi mumkin.

## Qabulda hisobotdan qanday foydalanish kerak

- Qabuldan oldin hisobotni o‘zingiz ko‘rib chiqing va eng muhim 2–3 savolingizni yozib qo‘ying.
- Mutaxassisga faqat raqamlarni emas, aniq misollarni ham aytib bering: bola qaysi mashqni yaxshi ko‘radi, qaysi biridan qochadi.
- Biror natija sizni ajablantirgan bo‘lsa, buni ochiq ayting. Ota-onaning kuzatuvi va mutaxassis ko‘rigi birgalikda to‘liqroq manzara beradi.
- Mutaxassisdan uyda bajariladigan mashqlarni ilova orqali biriktirishni so‘rang. Topshiriqlar bolangizning rejasida paydo bo‘ladi, eslatmalar esa ularni unutmaslikka yordam beradi.

## Qabuldan keyin

Mutaxassis tavsiyalari asosida maqsadlarni yangilang va ularni kichik, aniq qadamlarga bo‘ling. Masalan, «nutqni rivojlantirish» o‘rniga «bir oy ichida kundalik iltimoslarni ikki so‘z bilan aytish». Qayta baholashni muntazam o‘tkazing — ilova buni eslatib turadi. Keyingi qabulda o‘zgarishlarni grafikda ko‘rsatish ancha oson bo‘ladi.

Esda tuting: hisobot siz va mutaxassis o‘rtasidagi hamkorlik vositasidir. Siz bolangizni hammadan yaxshi bilasiz, mutaxassis esa bilim va tajriba olib keladi. Ikkalasi birlashganda bola uchun eng to‘g‘ri yo‘l topiladi.`,
  },
  {
    id: "yassi-oyoqlik-qachon-normal",
    topic: "yassi_oyoq",
    title: "Bolalardagi yassi oyoqlik: qachon normal, qachon e’tibor kerak?",
    summary:
      "Kichik yoshdagi bolalarning ko‘pchiligida oyoq tagi yassi ko‘rinadi va bu ko‘pincha rivojlanishning tabiiy bosqichi. Qaysi belgilar ortopedga ko‘rsatish vaqti kelganini bildirishini bilib oling.",
    readMin: 4,
    author: "Malika Tursunova",
    authorId: "sp-malika",
    date: "2026-09-02",
    emoji: "🦶",
    tags: ["yassi oyoqlik", "ortopediya", "poyabzal"],
    body: `«Bolamning oyog‘i yassi, unga maxsus poyabzal kerakmi?» — bu savolni fizioterapevt va ortopedlar juda tez-tez eshitadi. Yaxshi xabar shundaki, kichik yoshdagi bolalarda yassi oyoqlik ko‘pincha rivojlanishning tabiiy bosqichi bo‘ladi va bola o‘sgani sari o‘zgarib boradi.

## Nega kichkintoylarning oyog‘i yassi ko‘rinadi

Chaqaloq va kichik bolalarning oyoq tagida yumshoq yog‘ qatlami bor, bo‘g‘imlari egiluvchan, mushaklari esa hali to‘liq mustahkamlanmagan. Shuning uchun oyoq gumbazi, ya’ni oyoq tagining ichki tomonidagi egilish, ko‘zga tashlanmaydi. Bola yurib, yugurib, sakrab o‘sgani sari gumbaz asta-sekin shakllanadi. Ko‘plab bolalarda fiziologik yassi oyoqlik taxminan 5–6 yoshgacha saqlanib qolishi normal hisoblanadi.

## Egiluvchan va qattiq yassi oyoqlik

Uyda oddiy kuzatuv o‘tkazishingiz mumkin. Bolani tik turg‘izing, keyin oyoq uchiga ko‘tarilishini so‘rang. Agar oyoq uchida turganda gumbaz paydo bo‘lsa, bu egiluvchan yassi oyoqlik. U odatda og‘riqsiz bo‘ladi va ko‘p hollarda maxsus davolashni talab qilmaydi.

Agar oyoq uchida turganda ham oyoq tagi tekisligicha qolsa, oyoq qattiq va kam harakatchan bo‘lsa, bu qattiq yassi oyoqlik belgisi bo‘lishi mumkin. Bunday holatda mutaxassis ko‘rigi zarur.

Kuzatuvni bola yalangoyoq, tekis polda turganda o‘tkazing. Orqa tomondan ham qarang: tovonlar ichkariga sezilarli og‘ib turadimi, ikkala oyoq bir xilmi? Kuzatuvlaringizni suratga olib, mutaxassisga ko‘rsatishingiz mumkin.

YuniQo ilovasidagi «Oyoq uchida ko‘tarilish» mashqi bu harakatni o‘yin tarzida muntazam bajarishga yordam beradi.

## Qachon mutaxassisga murojaat qilish kerak

- Bola oyog‘i, tovoni yoki boldiri og‘riyotganidan shikoyat qilsa.
- Tengdoshlariga qaraganda tez charchasa, yurish yoki o‘ynashdan bosh tortsa.
- Oyoq uchida turganda ham gumbaz paydo bo‘lmasa.
- Bir oyoq ikkinchisidan sezilarli farq qilsa.
- Poyabzali g‘ayrioddiy tarzda, masalan, faqat ichki tomondan tez yeyilsa.
- Yurishi o‘zgarsa, tez-tez qoqilsa yoki yiqilsa.
- Yassi oyoqlik 6–7 yoshdan keyin ham saqlanib, bolani bezovta qilsa.

## Poyabzal va ortopedik tagliklar haqida

Og‘riq bermaydigan egiluvchan yassi oyoqlikda maxsus ortopedik poyabzal yoki tagliklar (stelkalar) gumbaz shakllanishini tezlashtirishi isbotlanmagan. Shuning uchun ularni barcha bolalarga bir xilda buyurish shart emas — bu masalani ko‘rikdan so‘ng mutaxassis hal qiladi.

Kundalik poyabzal tanlashda quyidagilarga e’tibor bering:

- O‘lchami mos bo‘lsin: barmoqlar erkin qimirlasin, lekin oyoq poyabzal ichida sirpanib ketmasin.
- Tagi egiluvchan, tovon qismi esa oyoqni yaxshi ushlab turadigan bo‘lsin.
- Iloji bo‘lsa, boshqa bolaning ko‘p kiyilgan poyabzalini kiydirmang: u avvalgi egasining oyog‘i shakliga moslashib qolgan bo‘lishi mumkin.

## Uyda nima qilish mumkin

- Xavfsiz joylarda — qumda, maysada, gilamda — yalangoyoq yurishga imkon bering.
- Oyoq barmoqlari bilan ro‘molcha yoki kichik yumshoq o‘yinchoqlarni ko‘tarish o‘yinini o‘ynang.
- Oyoq uchida va tovonda yurish, sakrash, zinaga chiqish kabi harakatlarni kundalik o‘yinlarga qo‘shing.
- To‘p tepish, yugurish, bolalar maydonchasida o‘ynash kabi faol o‘yinlar oyoq mushaklarini tabiiy ravishda mustahkamlaydi.
- Bolaning faol harakatlanishini va sog‘lom vaznini qo‘llab-quvvatlang.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "ota-ona-salomatligi",
    topic: "qollanma",
    title: "Ota-onaning o‘z holati ham muhim: charchoq va stressni qanday yengish mumkin",
    summary:
      "Rivojlanishida o‘ziga xosligi bor bolani tarbiyalash katta mehr va kuch talab qiladi. O‘zingizga g‘amxo‘rlik qilish xudbinlik emas — bu bolangiz uchun ham zarur.",
    readMin: 4,
    author: "Nodira Azimova",
    authorId: "sp-nodira",
    date: "2026-08-26",
    emoji: "🌿",
    tags: ["ota-onalar", "stress", "psixologik yordam"],
    body: `Bolaning rivojlanishidagi o‘ziga xoslik haqida bilganingizda turli his-tuyg‘ular paydo bo‘lishi tabiiy: xavotir, qo‘rquv, aybdorlik, qayg‘u, ba’zan g‘azab yoki charchoq. Bu his-tuyg‘ular sizni yomon ota yoki ona qilib qo‘ymaydi. Ular farzandingizni qanchalik sevishingiz va unga qanchalik g‘amxo‘rlik qilayotganingizni ko‘rsatadi.

## Nega o‘zingizga ham e’tibor berish kerak

Mashg‘ulotlar, shifokor qabullari, kundalik g‘amxo‘rlik va uy yumushlari ko‘pincha bir kishining zimmasiga tushadi. Uzoq davom etgan zo‘riqish esa hissiy toliqishga olib keladi. Toliqqan ota-onaga sabrli bo‘lish, bola bilan o‘ynash va uning kichik yutuqlarini payqash qiyinlashadi. Shuning uchun o‘zingizga g‘amxo‘rlik qilish xudbinlik emas, balki bolangizga g‘amxo‘rlik qilishning bir qismi.

## Hissiy toliqish belgilari

- Uyqudan keyin ham ketmaydigan doimiy charchoq.
- Arzimagan narsaga jahl chiqishi, sabrsizlik.
- Ilgari quvontirgan narsalarga qiziqishning yo‘qolishi.
- Uyqu yoki ishtahaning buzilishi.
- «Hech narsa o‘zgarmaydi», «men uddalay olmayapman» degan fikrlar.
- Odamlardan uzoqlashish, yolg‘izlik hissi.

## Har kuni qilish mumkin bo‘lgan kichik qadamlar

- Kuniga kamida 10–15 daqiqa faqat o‘zingiz uchun vaqt ajrating: choy ichish, sayr, sevimli musiqa.
- Yordam so‘rashdan tortinmang. Turmush o‘rtog‘ingiz, buvi-buvalar yoki boshqa yaqinlaringiz bilan vazifalarni bo‘lishing.
- Otalarning ishtiroki juda muhim: bola bilan har kuni birga o‘ynash yoki mashq qilish oiladagi yukni teng taqsimlaydi.
- Maqsadlarni real qo‘ying. Har kuni barcha mashqlarni bajarish shart emas — kichik, lekin muntazam qadamlar ko‘proq foyda beradi.
- Bolangizni boshqa bolalar bilan solishtirmang. Uning bugungi holatini o‘tgan oydagi holati bilan solishtiring.
- Kichik yutuqlarni nishonlang — ular sizga ham kuch beradi.
- Uyqu, ovqatlanish va harakatga e’tibor bering: hatto qisqa sayr ham kayfiyatni yaxshilaydi.

## Siz yolg‘iz emassiz

Xuddi shunday yo‘ldan o‘tayotgan ota-onalar bilan suhbatlashish katta yengillik beradi. YuniQo hamjamiyatidagi hududiy va mavzuli guruhlarda tajriba almashishingiz, savol berishingiz mumkin. Bepul tuman sessiyalarida esa mutaxassislar bilan uchrashasiz va boshqa ota-onalar bilan tanishasiz.

## Oiladagi boshqa farzandlar

Aka-uka va opa-singillar ham e’tiborga muhtoj. Ular bilan har kuni oz bo‘lsa ham alohida vaqt o‘tkazing, uka yoki singlisining holatini yoshiga mos so‘zlar bilan tushuntiring. Ularni kattalar vazifasini bajarishga majburlamang, lekin yordam berishni istashsa, buni rag‘batlantiring va minnatdorchilik bildiring.

## Qachon mutaxassisga murojaat qilish kerak

Agar tushkunlik, uyqu va ishtahaning buzilishi, hech narsadan quvonmaslik ikki haftadan ortiq davom etsa, psixolog yoki shifokorga murojaat qiling. Bu zaiflik emas, balki o‘zingiz va oilangiz oldidagi mas’uliyat. Agar o‘zingizga zarar yetkazish haqida fikrlar paydo bo‘lsa, zudlik bilan yaqinlaringizga ayting va shifokorga yoki tez tibbiy yordamga (103) murojaat qiling.

Esda tuting: kuchli bo‘lish hamma narsani yolg‘iz ko‘tarish degani emas. Sizning sog‘lom va xotirjam bo‘lishingiz ham bolangiz uchun eng yaxshi sovg‘alardan biri.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "maktabga-tayyorgarlik",
    topic: "organish",
    title: "Maktabga tayyorgarlik: harflarni bilishdan ham muhimroq ko‘nikmalar",
    summary:
      "Maktabga tayyor bo‘lish faqat o‘qish va sanashni bilish emas. Diqqat, o‘zini boshqarish, fonematik eshitish va mustaqillik kabi ko‘nikmalarni uyda qanday rivojlantirish mumkinligini bilib oling.",
    readMin: 5,
    author: "Jasur Rahimov",
    authorId: "sp-jasur",
    date: "2026-08-17",
    emoji: "🎒",
    tags: ["maktabga tayyorgarlik", "o‘qish", "diqqat"],
    body: `Ko‘p ota-onalar maktabga tayyorgarlikni harflar va raqamlarni yodlash bilan bog‘laydi. Albatta, bu ham foydali. Lekin birinchi sinfda muvaffaqiyatli o‘qish uchun boshqa ko‘nikmalar ham kamida shunchalik muhim. Ular bola o‘qish va yozishni o‘rganadigan poydevor hisoblanadi.

## Maktabga tayyorgarlikning asosiy tomonlari

- Diqqat va o‘zini boshqarish: qisqa topshiriqni oxiriga yetkazish, navbat kutish, xafa bo‘lganda tinchlana olish.
- Ko‘rsatmalarni tushunish: «daftaringni ol, birinchi betini och va rasm chiz» kabi 2–3 bosqichli ko‘rsatmani bajarish.
- Nutq: voqeani ketma-ket so‘zlab berish, savol berish, o‘z fikrini tushuntirish.
- Fonematik eshitish: so‘zdagi tovushlarni ajrata olish, so‘zlarni bo‘g‘inlarga bo‘lish, qofiyani sezish.
- Mayda motorika: qalamni to‘g‘ri ushlash, qaychi bilan qirqish, tugma qadash.
- Mustaqillik: hojatxonadan mustaqil foydalanish, kiyinish, o‘z narsalariga qarash.
- Ijtimoiy ko‘nikmalar: tengdoshlar bilan o‘ynash, yordam so‘ray olish, kattalar bilan muloqot qilish.

## Uyda o‘ynab o‘rganish

Maktabga tayyorlanish uchun uyda «dars» o‘tkazish shart emas. Eng yaxshi natija kundalik o‘yinlar orqali keladi:

- Har kuni bolaga ovoz chiqarib kitob o‘qing va o‘qilgan voqea haqida savollar bering.
- «So‘z qaysi tovush bilan boshlanadi?» o‘yinini o‘ynang: «olma — O, baliq — B».
- So‘zlarni qarsak chalib bo‘g‘inlarga bo‘ling: «ki-tob», «ma-shi-na».
- Qofiyadosh so‘zlar toping: «qo‘l — yo‘l», «tosh — bosh».
- Kundalik hayotda sanang: zinapoyalar, olmalar, qoshiqlar.
- Navbat bilan o‘ynaladigan stol o‘yinlari sabr, qoidaga amal qilish va sanashni birga o‘rgatadi.
- Rasm chizish, bo‘yash, plastilin va qaychi bilan ishlash qo‘lni yozuvga tayyorlaydi.
- Maktab haqida ijobiy gapiring, maktab yonidan birga sayr qiling va kelajakdagi kun tartibini o‘yin tarzida mashq qiling.

## O‘rganish qiyinchiliklari belgilari

Har bir bola o‘z sur’atida o‘rganadi. Lekin ba’zi belgilar e’tibor talab qiladi:

- Ko‘p takrorlashga qaramay harflar va ularning tovushlarini eslab qolish juda qiyin bo‘lsa.
- Qofiyani sezmasa, so‘zdagi birinchi tovushni ajrata olmasa.
- Hafta kunlari yoki fasllar kabi ketma-ketliklarni o‘rganish qiyin kechsa.
- Oddiy ko‘rsatmalarni tez-tez unutsa yoki chalkashtirsa.
- Qalam ushlash va chizishdan doimiy qochsa, qo‘li tez charchasa.
- Topshiriqlardan doimiy qochsa, «men uddalay olmayman» deb aytsa.

Bu belgilar bolaning aqliy qobiliyati past ekanini anglatmaydi. Masalan, disleksiyada bola aqlli va qiziquvchan bo‘lsa-da, o‘qishni o‘zlashtirish unga alohida qiyinchilik tug‘diradi. Qiyinchilik qanchalik erta aniqlansa, u bilan ishlash shunchalik oson kechadi.

## Birinchi sinfga moslashish

Maktabning ilk haftalari hamma bola uchun ham oson kechmaydi: charchoq, injiqlik va uyqudagi o‘zgarishlar tabiiy. Bu davrda kun tartibini barqaror saqlang, maktabdan keyin dam olish va o‘yin uchun vaqt qoldiring, o‘qituvchi bilan muntazam aloqada bo‘ling. Agar bolangizning tayyorligi haqida ikkilansangiz, tarbiyachi va mutaxassis bilan oldindan maslahatlashing — ular ilk oylarni yengillashtirish yo‘llarini tavsiya qiladi.

## Qachon mutaxassisga murojaat qilish kerak

Agar yuqoridagi belgilar bir necha oy davomida saqlanib qolsa, defektolog yoki logopedga murojaat qiling. Talaffuzda kamchiliklar bo‘lsa, maktabdan oldin logoped bilan ishlash ayniqsa muhim, chunki nutqdagi qiyinchiliklar keyinchalik yozuvda ham aks etishi mumkin. Ko‘rish va eshitishni tekshirtirishni ham unutmang.

YuniQo ilovasidagi baholash «Diqqat va tafakkur», «Nutq» va «Mayda motorika» yo‘nalishlarida bolaning kuchli tomonlarini va yordamga muhtoj jihatlarini ko‘rsatadi. Defektolog mashqlari bo‘limida esa maktabga tayyorgarlik uchun o‘yinli topshiriqlar bor.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "ekran-vaqti",
    topic: "qollanma",
    title: "Ekran vaqti: telefon va multfilmlar bilan sog‘lom muvozanat",
    summary:
      "Ekranni butunlay taqiqlash shart emas, lekin u jonli muloqot, uyqu va harakat o‘rnini egallamasligi kerak. Yoshga mos tavsiyalar va amaliy maslahatlar.",
    readMin: 4,
    author: "Nodira Azimova",
    authorId: "sp-nodira",
    date: "2026-08-05",
    emoji: "📱",
    tags: ["ekran vaqti", "kun tartibi", "nutq"],
    body: `Telefon va televizor bugungi hayotning bir qismiga aylangan. Ba’zan ovqat pishirayotganda yoki navbatda kutayotganda multfilm qo‘yib berish ota-onaga biroz nafas rostlash imkonini beradi va bunda uyaladigan joy yo‘q. Muhimi — ekran bolaning kunida qancha joy egallashi va nimaning o‘rnini bosayotgani.

## Ekranning asosiy xavfi nimada

Kichik bolaning miyasi jonli muloqot orqali rivojlanadi: u yuzingizga qaraydi, ovozingizni eshitadi, javob beradi va sizning javobingizni kutadi. Ekran bunday muloqotni bera olmaydi. Bundan tashqari, uzoq ekran vaqti ko‘pincha harakat, o‘yin va uyqu vaqtini qisqartiradi. Hatto «orqa fonda» ishlab turgan televizor ham kattalar va bola o‘rtasidagi suhbatni kamaytiradi.

## Yoshga mos tavsiyalar

Jahon sog‘liqni saqlash tashkiloti va bolalar shifokorlari tavsiyalari umumiy yo‘nalish beradi:

- 2 yoshgacha: ekran vaqti tavsiya etilmaydi. Yaqinlar bilan videoqo‘ng‘iroq bundan mustasno, chunki bu ham jonli muloqot.
- 2–5 yosh: kuniga 1 soatdan oshmasin, qanchalik kam bo‘lsa, shunchalik yaxshi. Sifatli va yoshga mos ko‘rsatuvlarni tanlang.
- Barcha yoshda: ovqatlanish paytida va uxlashdan taxminan bir soat oldin ekranni o‘chiring.

## Birga ko‘rish — oddiy, lekin samarali usul

Bola multfilm ko‘rayotganda iloji boricha yonida bo‘ling. Ko‘rganlaringizni muhokama qiling: «Mushukcha nima qildi? Nega u xafa bo‘ldi?» Shunda ekran vaqti ham muloqotga aylanadi. YuniQo ilovasidagi mashqlar va videolar ham ota-ona bilan birga bajarish uchun mo‘ljallangan: bola faqat ekranga emas, sizga va harakatga e’tibor qaratadi.

## Sifatli kontentni qanday tanlash kerak

- Sur’ati sekin, voqealari tushunarli va qisqa ko‘rsatuvlarni tanlang.
- Ona tilidagi sifatli multfilmlar va qo‘shiqlarga ustunlik bering.
- Reklamasiz va keyingi videoni avtomatik qo‘ymaydigan ilova va sozlamalardan foydalaning.
- Qo‘rqinchli yoki zo‘ravonlik sahnalari bor kontentdan saqlaning.
- Yangi ko‘rsatuvni bolaga qo‘yishdan oldin o‘zingiz ko‘rib chiqing.

## Amaliy maslahatlar

- Ekransiz joy va vaqtlarni belgilang: ovqat stoli, yotoqxona, sayr.
- Ekranni o‘chirishdan oldin ogohlantiring: «Yana bitta multfilm, keyin o‘yinga chiqamiz». Taymer ham yordam beradi.
- Ekranni bolani tinchlantirishning yagona usuliga aylantirmang. Quchoqlash, suv bilan o‘yin, sokin musiqa kabi muqobillarni sinab ko‘ring.
- Ekran o‘rniga oddiy mashg‘ulotlarni tayyorlab qo‘ying: kitoblar, konstruktor, plastilin, rangli qalamlar.
- O‘zingizning telefondan foydalanishingizga ham e’tibor bering. Bola bilan o‘ynayotganda telefonni chetga qo‘ying — u sizdan o‘rganadi.
- Ekran vaqtini birdaniga taqiqlamang, asta-sekin kamaytiring. Keskin o‘zgarish ko‘proq qarshilikka sabab bo‘ladi.

## Qachon mutaxassisga murojaat qilish kerak

Agar bola ekransiz bir necha daqiqa ham tura olmasa, telefonni olganingizda uzoq va kuchli jazavaga tushsa, nutqi kechikayotgan bo‘lsa yoki boshqa bolalar bilan o‘ynashga qiziqmasa, bolalar psixologi yoki logopedga murojaat qiling. Bunday holatlarda sabab faqat ekranda bo‘lmasligi mumkin va mutaxassis to‘liqroq baho beradi.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "mayda-motorika-uyda",
    topic: "motorika",
    title: "Mayda motorika: kichik barmoqlar — katta imkoniyatlar",
    summary:
      "Qoshiq ushlash, tugma qadash va qalam bilan chizish — bularning barchasi mayda motorikaga bog‘liq. Uyda oddiy buyumlar bilan o‘tkaziladigan o‘yinlar va e’tibor berish kerak bo‘lgan belgilar.",
    readMin: 4,
    author: "Malika Tursunova",
    authorId: "sp-malika",
    date: "2026-07-28",
    emoji: "✋",
    tags: ["mayda motorika", "uy o‘yinlari", "mustaqillik"],
    body: `Mayda motorika — qo‘l va barmoqlarning aniq, muvofiqlashgan harakatlari. Bola qoshiq bilan ovqatlanganda, tugma qadaganda, qalam bilan chizganda yoki kichik narsani barmoqlari bilan olganda aynan shu ko‘nikmadan foydalanadi. Mayda motorika mustaqillik, o‘yin va keyinchalik yozuv uchun asos bo‘ladi.

## Mayda motorika va nutq

Barmoq o‘yinlari nutqni rivojlantiradi degan fikr keng tarqalgan. Qo‘l va nutq a’zolari harakatini boshqaradigan miya sohalari haqiqatan ham bir-biriga yaqin joylashgan va bu ko‘nikmalar ko‘pincha yonma-yon rivojlanadi. Lekin barmoq mashqlari o‘z-o‘zidan nutqni «ochib yubormaydi» va logoped mashg‘ulotlari o‘rnini bosmaydi. Eng yaxshi natija barmoq o‘yinlari so‘z, qo‘shiq va jonli muloqot bilan birga olib borilganda kuzatiladi.

## Yoshga oid taxminiy mo‘ljallar

- 9–12 oylikda: mayda narsani bosh va ko‘rsatkich barmoqlari bilan chimdib oladi.
- 1,5–2 yoshda: qalam bilan chiziqlar chizadi, bir nechta kubikni ustma-ust qo‘yadi.
- 3 yoshda: aylana chizishga harakat qiladi, yirik munchoqlarni ipga tizadi.
- 4–5 yoshda: qaychi bilan chiziq bo‘ylab qirqadi, oddiy shakllarni chizadi, katta tugmalarni qadaydi.

## Uyda oddiy buyumlar bilan o‘yinlar

- Plastilin yoki xamirdan yumaloq va uzun shakllar yasash, uni chimdish va ezish.
- Qog‘ozni mayda bo‘laklarga yirtish va ulardan applikatsiya yopishtirish.
- Kir qisqichlarini karton chetiga qistirib, «quyosh nurlari» yoki «tipratikan ignalari» yasash.
- Yirik munchoq yoki makaronlarni ipga tizish.
- Qoshiq bilan donlarni bir idishdan ikkinchisiga o‘tkazish.
- Qopqoqlarni burab ochish va yopish, tugma qadash va yechish.
- Devorga yopishtirilgan qog‘ozga yoki tik turgan doskaga rasm chizish — bu yelka va bilakni ham mustahkamlaydi.
- 3–4 yoshdan boshlab uchi to‘mtoq bolalar qaychisi bilan qirqish.
- Oshxonada yordam: xamir yoyish, yuvilgan sabzavotlarni savatga terish, salfetka buklash.

Kichik buyumlar — munchoq, don, tugma — bilan o‘ynaganda bolani yolg‘iz qoldirmang: ular nafas yo‘liga tiqilib qolishi mumkin. 3 yoshgacha bo‘lgan bolalarga faqat yirik buyumlarni bering.

## Kundalik hayot — eng yaxshi mashg‘ulot

Bolaga o‘zi ovqatlanish, kiyinish va tugma qadash imkonini bering, garchi bu ko‘proq vaqt olsa ham. Har bir kundalik yumush — tabiiy mashg‘ulot. Yordam kerak bo‘lsa, ishni to‘liq bajarib bermang: harakatni boshlab bering va oxirini bolaning o‘ziga qoldiring. Shunda u muvaffaqiyat hissini tuyadi.

## Qachon mutaxassisga murojaat qilish kerak

- Bir yoshga yaqinlashganda ham narsalarni qo‘li bilan olish va ushlab turishga qiynalsa.
- 18 oylikdan oldin bir qo‘lni aniq afzal ko‘rib, ikkinchisidan deyarli foydalanmasa.
- Qo‘llarida doimiy titrash, haddan tashqari bo‘shashganlik yoki taranglik sezilsa.
- Kiyinish, ovqatlanish kabi kundalik ishlarda tengdoshlariga qaraganda ancha qiynalsa.
- Chizish, qirqish kabi mashg‘ulotlardan doimiy qochsa yoki ular uni juda tez charchatsa.
- Ilgari egallagan ko‘nikmalarini yo‘qotsa.

Bunday holatlarda pediatr, bolalar nevrologi yoki fizioterapevtga murojaat qiling. Mutaxassis sababni aniqlab, bolaga mos mashqlar dasturini tuzadi.

YuniQo ilovasining motorika bo‘limida yoshga mos mashqlar bor, rivojlanish baholashi esa mayda motorikani alohida yo‘nalish sifatida kuzatib boradi.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "uyda-nutqni-rivojlantirish",
    topic: "nutq",
    title: "Uyda nutqni rivojlantirish: har kuni 10 daqiqalik o‘yinlar",
    summary:
      "Nutq kundalik hayotdagi ko‘plab kichik suhbatlar orqali rivojlanadi. Logoped tavsiya qiladigan oddiy usullar va o‘yinlar, ularni kun tartibiga qanday qo‘shish haqida.",
    readMin: 4,
    author: "Dilnoza Karimova",
    authorId: "sp-dilnoza",
    date: "2026-07-14",
    emoji: "🧸",
    tags: ["nutq", "uy o‘yinlari", "artikulyatsiya"],
    body: `Bolaning nutqi logoped kabinetida emas, avvalo uyda — ovqatlanish, cho‘milish, sayr va o‘yin paytidagi ko‘plab kichik suhbatlarda rivojlanadi. Mutaxassis bilan mashg‘ulotlar juda muhim, lekin haftada bir-ikki soatlik darsni har kungi uy muloqoti to‘ldirib turishi kerak. Yaxshi xabar: buning uchun maxsus jihoz ham, ko‘p vaqt ham shart emas — kuniga 10 daqiqalik maqsadli o‘yin ham katta farq qiladi.

## Asosiy qoidalar

- Bola bilan bir balandlikda bo‘ling: cho‘kkalab yoki polga o‘tiring, yuzingiz unga ko‘rinib tursin.
- Bolaning qiziqishiga ergashing. U mashina bilan o‘ynayotgan bo‘lsa, gapni ham mashina haqida boshlang.
- Qisqa va aniq gapiring. Bola bitta so‘z bilan gapirsa, siz ikki-uch so‘zli gaplar bilan javob bering.
- Javob kutishni o‘rganing. Savoldan keyin sabr bilan jim turing — bolaga o‘ylash uchun vaqt kerak.
- Xatoni tuzatmang, to‘g‘ri namunani bering. Bola «sippak» desa, «ha, bu shippak, qizil shippak» deng va qaytarishga majburlamang.

## Kundalik vaziyatlardagi o‘yinlar

- «Nima qilyapmiz?» o‘yini — ishlaringizni so‘z bilan izohlang: «Kiyinyapmiz. Avval paypoq, endi shim».
- Tanlov bering: «Olma yeysanmi yoki banan?» Bola barmog‘i bilan ko‘rsatsa ham, so‘zni aytib qo‘ying.
- Qo‘shiq va she’rlar: tanish qo‘shiqni aytib, oxirgi so‘zda to‘xtang — bola uni o‘zi aytishga harakat qiladi.
- Kitob o‘qish: rasmlarni ko‘rsatib «Bu kim? U nima qilyapti?» deb so‘rang va bolaning har bir urinishini qo‘llab-quvvatlang.
- «Sehrli xaltacha»: xaltachaga tanish buyumlarni solib, ularni bittadan chiqaring va nomini ayting.
- Rolli o‘yinlar: qo‘g‘irchoqni ovqatlantirish, do‘kon-do‘kon o‘ynash, o‘yinchoq telefonda «gaplashish».

## Nafas va artikulyatsiya uchun o‘yinlar

- Sovun pufaklarini puflash, paxta bo‘lagini stol ustidagi «darvoza»ga puflab kiritish.
- Naycha orqali ichish, suvda pufakchalar hosil qilish.
- Ko‘zgu oldida yuz bilan o‘yinlar: tabassum qilish, lablarni cho‘chaytirish, tilni chiqarib yuqoriga va pastga harakatlantirish.
- Hayvonlar ovoziga taqlid qilish: «miyov», «hav-hav», «g‘ag‘-g‘ag‘». Bunday tovushlar nutqqa tayyorlaydi.

## Kunlik 10 daqiqa: namunaviy reja

- 2 daqiqa: ko‘zgu oldida artikulyatsion o‘yinlar.
- 3 daqiqa: rasmli kitob bilan suhbat.
- 3 daqiqa: qo‘shiq, she’r yoki barmoq o‘yini.
- 2 daqiqa: puflash o‘yinlari.

Bu reja qat’iy emas: bola charchasa yoki qiziqmasa, to‘xtab, keyinroq davom eting. Eng muhimi — muntazamlik va yoqimli kayfiyat.

## Nimalardan saqlanish kerak

- «Ayt! Qaytar!» deb majburlashdan. Bosim ostida bola ko‘pincha umuman gapirishdan bosh tortadi.
- Bolaning har bir istagini u so‘ramasidan oldin bajarib qo‘yishdan. Unga so‘rash uchun sabab qoldiring.
- Uzoq vaqt ekran oldida qoldirishdan. Multfilm jonli suhbat o‘rnini bosa olmaydi.

## Qachon mutaxassisga murojaat qilish kerak

Agar muntazam uy mashg‘ulotlariga qaramay bir necha oy davomida nutqda o‘zgarish sezilmasa, bola sizni tushunmayotgandek tuyulsa yoki ilgari aytgan so‘zlarini yo‘qotsa, logopedga murojaat qiling. YuniQo ilovasidagi logoped mashqlari va «Tabassum — Naycha» mashqi uy mashg‘ulotlarini qiziqarli va muntazam qilishga yordam beradi.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "autizm-kundalik-hayot",
    topic: "autizm",
    title: "Autizm spektridagi bola bilan kundalik hayot: tartib, sensor ehtiyojlar va muloqot",
    summary:
      "Oldindan bilinadigan kun tartibi, sensor ehtiyojlarni tushunish va muloqotning turli shakllarini qo‘llab-quvvatlash bolaga ham, oilaga ham kundalik hayotni yengillashtiradi.",
    readMin: 4,
    author: "Jasur Rahimov",
    authorId: "sp-jasur",
    date: "2026-07-01",
    emoji: "🌈",
    tags: ["autizm", "sensor ehtiyojlar", "muloqot", "kun tartibi"],
    body: `Autizm spektridagi har bir bola o‘ziga xos: birining kuchli tomoni — ajoyib xotira, boshqasiniki — raqamlar, musiqa yoki texnikaga chuqur qiziqish. Shu bilan birga, autizm spektridagi ko‘plab bolalar uchun kutilmagan o‘zgarishlar, shovqin yoki odamlar bilan muloqot qiyinroq bo‘lishi mumkin. Quyidagi maslahatlar kundalik hayotni bola uchun tushunarli va xotirjamroq qilishga yordam beradi.

## Oldindan bilinadigan kun tartibi

Nima bo‘lishini oldindan bilish bolaning xavotirini kamaytiradi. Kun tartibini rasmlar yoki fotosuratlar orqali ko‘rsating: uyg‘onish, nonushta, kiyinish, bog‘cha, sayr. Bajarilgan ishni rasmli jadvaldan olib qo‘yish yoki belgilash bolaga kun qanday o‘tayotganini ko‘rishga yordam beradi.

- Bir ishdan boshqasiga o‘tishdan oldin ogohlantiring: «Yana 5 daqiqa o‘ynaymiz, keyin cho‘milamiz». Taymer yoki qum soati ham qo‘l keladi.
- «Avval — keyin» qoidasidan foydalaning: «Avval qo‘l yuvamiz, keyin olma yeymiz».
- Kutilmagan o‘zgarish bo‘lsa, iloji boricha oldindan tushuntiring va rasm bilan ko‘rsating.

## Sensor ehtiyojlarni tushunish

Ba’zi bolalar tovush, yorug‘lik, hid, ta’m yoki teginishni boshqalarga qaraganda kuchliroq his qiladi, ba’zilari esa, aksincha, kuchli sezgilarni izlaydi. Kiyimdagi yorliq, changyutkich ovozi yoki ovqatning tuzilishi bola uchun haqiqiy noqulaylik manbai bo‘lishi mumkin.

- Bolani kuzating: qaysi vaziyatlar uni bezovta qiladi, qaysilari tinchlantiradi?
- Uyda tinch burchak tashkil qiling: yumshoq yostiqlar, sevimli o‘yinchoq, xira yorug‘lik.
- Shovqinli joylarga borganda shovqinni pasaytiruvchi quloqchinlar yordam berishi mumkin.
- Ba’zi bolalarni tebranish, sakrash yoki arg‘imchoq uchish tinchlantiradi — bunday imkoniyatlarni kun davomida bering.

## Muloqotning turli shakllari

Muloqot faqat so‘zdan iborat emas. Imo-ishoralar, rasmli kartochkalar yoki planshetdagi maxsus dasturlar kabi muqobil muloqot vositalari bolaga o‘z xohishini ifodalash imkonini beradi. Tadqiqotlar bunday vositalar nutq paydo bo‘lishiga to‘sqinlik qilmasligini, aksincha, ko‘pincha uni qo‘llab-quvvatlashini ko‘rsatadi.

- Qisqa va aniq gapiring, ko‘rsatmani bir marta ayting va javob uchun vaqt bering.
- Bolaning qiziqishlaridan foydalaning: u poyezdlarni yaxshi ko‘rsa, yangi so‘zlar va sanashni ham poyezdlar orqali o‘rgating.
- Uning o‘yiniga qo‘shiling va harakatlarini takrorlang — bu birgalikdagi diqqatni rivojlantiradi.
- Ko‘zga qarashga majburlamang. Autizm spektridagi ko‘plab bolalar uchun bu noqulay va tinglashga xalaqit berishi mumkin.

## Xulq — bu ham xabar

Kuchli hayajon yoki jazava ko‘pincha «menga qiyin» degan xabar bo‘ladi: bola charchagan, och, shovqindan bezovta yoki nima bo‘layotganini tushunmayapti. Bunday paytda tanbeh emas, xotirjamlik kerak. Keyinroq sababini tahlil qiling: undan oldin nima bo‘ldi, vaziyat qanday edi? Shunda keyingi safar bunday holatning oldini olish osonlashadi.

## Qachon mutaxassisga murojaat qilish kerak

Agar bola o‘ziga yoki boshqalarga zarar yetkazayotgan bo‘lsa, uyqu yoki ovqatlanishda jiddiy qiyinchiliklar bo‘lsa, ilgari egallagan ko‘nikmalarini yo‘qotsa yoki oila kundalik vaziyatlarni uddalay olmayotgan bo‘lsa, bolalar psixologi, defektolog yoki nevrologga murojaat qiling. Mutaxassis bola va oilaga mos individual reja tuzishga yordam beradi.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "yassi-oyoqlik-mashqlari",
    topic: "yassi_oyoq",
    title: "Yassi oyoqlikda uyda bajariladigan o‘yin-mashqlar",
    summary:
      "Oyoq mushaklarini mustahkamlovchi, muvozanat va chidamlilikni oshiruvchi oddiy mashqlar. Ularni har kuni 10–15 daqiqalik o‘yin tarzida bajarish mumkin.",
    readMin: 4,
    author: "YuniQo tahririyati",
    date: "2026-06-17",
    emoji: "👣",
    tags: ["yassi oyoqlik", "mashqlar", "yirik motorika"],
    body: `Kichik yoshdagi bolalarning ko‘pchiligida oyoq tagi yassi ko‘rinishi tabiiy holat va u yosh o‘tishi bilan o‘zgarib boradi. Shunday bo‘lsa-da, oyoq mushaklarini mustahkamlovchi harakatlar barcha bolalar uchun foydali: ular muvozanat, chidamlilik va umumiy harakat ko‘nikmalarini yaxshilaydi. Agar mutaxassis bolangizga mashqlar tavsiya qilgan bo‘lsa, quyidagi o‘yinlar ularni qiziqarli va muntazam bajarishga yordam beradi.

## Mashq qilishdan oldin

- Mashqlarni yalangoyoq, sirpanchiq bo‘lmagan pol yoki gilam ustida bajaring.
- Kuniga 10–15 daqiqa kifoya. Muntazamlik davomiylikdan muhimroq.
- Mashqlarni bola tetik bo‘lgan paytda bajaring, to‘yib ovqatlangandan keyin darhol emas.
- Har bir mashqni o‘yinga aylantiring: hikoya, qo‘shiq yoki kichik musobaqa qo‘shing.
- Oila a’zolari bilan birga bajaring: bolalar kattalarga taqlid qilishni yaxshi ko‘radi.
- Bola og‘riqdan shikoyat qilsa, mashqni to‘xtating va mutaxassis bilan maslahatlashing.

## O‘yin-mashqlar

- «Ro‘molchani ushla»: polga ro‘molcha yoki kichik sochiq yozing. Bola uni oyoq barmoqlari bilan g‘ijimlab, o‘ziga tortadi.
- «Xazina yig‘ish»: yumshoq o‘yinchoqlar yoki yirik kubiklarni oyoq barmoqlari bilan olib, savatchaga soling.
- «Balerina»: oyoq uchida xona bo‘ylab yurish yoki bir joyda turib 5–10 marta oyoq uchiga ko‘tarilib tushish.
- «Pingvin»: tovonda bir necha qadam yurish.
- «Ayiqcha»: oyoqning tashqi qirrasida bir necha qadam yurish.
- «Qurtcha»: oyoq barmoqlarini bukib-yozib, oldinga asta siljish.
- «Dumalatish»: oyoq tagi bilan kichik to‘p yoki plastik butilkani oldinga-orqaga dumalatish.
- «Rassom»: oyoq barmoqlari orasiga qalam qistirib, qog‘ozga chiziq yoki doira chizish.
- Turli yuzalarda yurish: qum, maysa, massaj gilamchasi, yostiqlardan yasalgan «so‘qmoq».

Har safar hammasini bajarish shart emas: kuniga 3–4 ta mashqni tanlang va ularni almashtirib turing. Har bir mashqni 5–10 marta takrorlash yetarli. Bola charchagani yoki zerikkanini sezsangiz, to‘xtang — mashg‘ulot yoqimli kayfiyat bilan tugagani ma’qul.

## Kundalik hayotdagi imkoniyatlar

- Bolalar maydonchasidagi narvon va shved devoriga chiqish oyoq mushaklarini yaxshi mustahkamlaydi.
- Sakrash, arg‘amchi bilan o‘ynash va velosiped haydash ham foydali.
- Yozda qum va maysada yalangoyoq yurish — eng oddiy va tabiiy «massaj».

YuniQo ilovasida «Oyoq uchida ko‘tarilish» mashqi bor. Premium obunada uni AI video nazorat bilan bajarish mumkin: kamera harakatni kuzatib, bolaga o‘yin tarzida baho beradi. Tahlil qurilmaning o‘zida bajariladi, video hech qayerga yuklanmaydi.

## Muhim eslatma

Mashqlar oyoq mushaklarini mustahkamlaydi, lekin fiziologik yassi oyoqlikda gumbaz asosan bolaning o‘sishi bilan tabiiy shakllanadi. Shuning uchun mashqlardan tezkor «tuzatish»ni kutmang — ularning asosiy maqsadi bolaning kuchli, chaqqon va harakatchan bo‘lishi.

## Qachon mutaxassisga murojaat qilish kerak

Agar bola oyog‘i yoki boldiri og‘riyotganidan shikoyat qilsa, tez charchasa, oyoq uchida turganda ham gumbaz ko‘rinmasa yoki yurishida o‘zgarish sezsangiz, fizioterapevt yoki ortopedga murojaat qiling. Mutaxassis bolaga mos individual mashqlar to‘plamini tanlaydi.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "daun-sindromi-nutq-va-muloqot",
    topic: "daun",
    title: "Daun sindromi bo‘lgan bolada nutq va muloqotni qo‘llab-quvvatlash",
    summary:
      "Daun sindromi bo‘lgan bolalar ko‘pincha aytishdan ko‘ra ko‘proq narsani tushunadi. Ko‘rish orqali o‘rganish, imo-ishoralar va kundalik o‘yinlar muloqotga qanday yordam berishi haqida.",
    readMin: 4,
    author: "Dilnoza Karimova",
    authorId: "sp-dilnoza",
    date: "2026-06-03",
    emoji: "💬",
    tags: ["Daun sindromi", "nutq", "imo-ishoralar", "logoped"],
    body: `Daun sindromi bo‘lgan bolalar odatda muloqotga juda intiladi: ular yuzlarni kuzatadi, jilmayadi, odamlar bilan aloqaga qiziqadi. Shu bilan birga, nutq ko‘pincha boshqa ko‘nikmalarga qaraganda sekinroq rivojlanadi. Buning sabablarini tushunish va to‘g‘ri yordam berish bolaning o‘zini ifodalash imkoniyatlarini sezilarli kengaytiradi.

## Nega nutq sekinroq rivojlanadi

- Tushunish va gapirish o‘rtasidagi farq. Ko‘p bolalar aytishdan ko‘ra ancha ko‘p narsani tushunadi. Bola kam gapirsa ham, aslida ko‘p narsani biladi.
- Mushak tonusining pastligi. Lab, til va yuz mushaklarining bo‘shligi aniq talaffuzni qiyinlashtiradi.
- Eshitish. Daun sindromi bo‘lgan bolalarda o‘rta quloqda suyuqlik yig‘ilishi va eshitish pasayishi ko‘proq uchraydi. Hatto vaqtinchalik eshitish pasayishi ham nutqqa ta’sir qiladi.
- Eshitish xotirasi. Eshitganini eslab qolish qiyinroq bo‘lishi mumkin, ko‘rganini eslab qolish esa ko‘pincha kuchli tomon hisoblanadi.

## Ko‘rish orqali o‘rganish — kuchli tomon

Bolaning ko‘rish qobiliyatiga tayangan usullar ayniqsa samarali:

- Imo-ishoralar. So‘zni aytish bilan birga oddiy ishorani ham ko‘rsating: «ber», «yana», «tamom», «ichish». Imo-ishoralar nutqni to‘xtatib qo‘ymaydi — aksincha, bola o‘zini ifodalay boshlaydi, so‘zlar paydo bo‘lgach esa ishoralar tabiiy ravishda kamayadi.
- Rasmlar va fotosuratlar. Oila a’zolari, sevimli ovqatlar va o‘yinchoqlar suratlaridan kichik albom tuzing va u bilan birga «gaplashing».
- Yozilgan so‘zlar. Ba’zi mutaxassislar tanish so‘zlarni kartochkada yozib ko‘rsatishni tavsiya qiladi: yozilgan so‘z ko‘rish orqali eslab qolishga va talaffuzga yordam beradi.

## Uyda har kuni

- Bola bilan yuzma-yuz o‘tiring, shunda u lablaringiz harakatini ko‘radi.
- Sekin, aniq va qisqa gapiring, muhim so‘zlarni takrorlang.
- Javob uchun vaqt bering — ba’zan 10 soniyadan ham ko‘proq kutish kerak bo‘ladi.
- Bola aytgan so‘zni kengaytiring: «to‘p» — «qizil to‘p», «to‘pni ot».
- Qo‘shiqlar, qarsak chalib aytiladigan she’rlar va takrorlanuvchi o‘yinlardan foydalaning.
- Og‘iz mushaklari uchun o‘yinlar o‘ynang: sovun pufaklarini puflash, naycha orqali ichish, ko‘zgu oldida yuz ifodalarini takrorlash.
- Har bir muloqot urinishini — so‘z, ishora yoki nigohni — qadrlang va unga javob bering.
- Kundalik vaziyatlardan foydalaning: ovqatlanish, kiyinish va cho‘milish paytida bir xil so‘z va ishoralarni takrorlang.

Oiladagi barcha kattalar bir xil imo-ishora va so‘zlardan foydalansa, bola ularni tezroq o‘zlashtiradi. Ishlatiladigan ishoralar ro‘yxatini ko‘rinadigan joyga ilib qo‘ying va uni bog‘cha tarbiyachisi bilan ham bo‘lishing.

## Qachon mutaxassisga murojaat qilish kerak

Daun sindromi bo‘lgan bola bilan logoped mashg‘ulotlarini imkon qadar erta, ko‘pincha birinchi yilning o‘zidayoq boshlash tavsiya etiladi. Eshitishni muntazam tekshirtirib turing, ayniqsa bola tez-tez shamollasa yoki qulog‘i og‘risa. Agar nutqda uzoq vaqt siljish bo‘lmasa, ilgari aytgan so‘zlar yo‘qolsa yoki bola muloqotdan qocha boshlasa, bu haqda mutaxassisga albatta ayting.

YuniQo ilovasidagi rivojlanish baholashi nutqdagi o‘zgarishlarni vaqt o‘tishi bilan kuzatishga yordam beradi, logoped mashqlari esa uy mashg‘ulotlarini rejalashtirishni osonlashtiradi.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "mutaxassis-qabuliga-tayyorgarlik",
    topic: "qollanma",
    title: "Mutaxassis qabuliga qanday tayyorlanish kerak: ota-onalar uchun yo‘riqnoma",
    summary:
      "Yaxshi tayyorgarlik qisqa qabulni ham samarali qiladi. Nimalarni yozib olish, qaysi hujjatlarni olish, bolani qanday tayyorlash va qanday savollar berish haqida.",
    readMin: 4,
    author: "YuniQo tahririyati",
    date: "2026-05-20",
    emoji: "🩺",
    tags: ["mutaxassis", "qabul", "tayyorgarlik"],
    body: `Mutaxassis qabuli odatda qisqa davom etadi, bola esa notanish joyda charchashi, uyalishi yoki o‘zini uydagidan butunlay boshqacha tutishi mumkin. Shuning uchun oldindan tayyorgarlik ko‘rish juda muhim: bu sizga xotirjamroq bo‘lishga, mutaxassisga esa bolani to‘liqroq tushunishga yordam beradi.

## Qabuldan bir necha kun oldin

- Tashvishlaringizni yozib chiqing. «Yaxshi gapirmaydi» o‘rniga aniqroq yozing: «2,5 yoshda 10 ga yaqin so‘z aytadi, ikki so‘zni qo‘shib gapirmaydi».
- Misollar to‘plang: bu holat qachon, qayerda va qanchalik tez-tez kuzatiladi?
- Uyda bolaning o‘yini, nutqi yoki harakatlarini ko‘rsatuvchi 1–2 daqiqalik videolar yozib oling. Qabulda bola o‘zini boshqacha tutsa, ular juda qo‘l keladi.
- Hujjatlarni yig‘ing: avvalgi xulosalar, tahlillar, eshitish va ko‘rish tekshiruvlari natijalari.
- Homiladorlik, tug‘ilish va birinchi yil haqidagi muhim ma’lumotlarni yozib qo‘ying: bola qachon o‘tirgan, yurgan, birinchi so‘zini aytgan.
- YuniQo rivojlanish hisobotini mutaxassis bilan ulashing yoki Premium obunada uni PDF shaklida yuklab oling.
- Eng muhim 3–4 savolingizni alohida yozing.

## Bolani tayyorlash

- Qayerga borishingizni oddiy so‘zlar bilan oldindan ayting: «Ertaga bir xola bilan o‘ynagani boramiz».
- Qabul vaqti bolaning uxlash yoki ovqatlanish vaqtiga to‘g‘ri kelmasligiga harakat qiling.
- Sevimli o‘yinchog‘i, suv va yengil tamaddi olib oling.
- Bolani «u yerda jim o‘tirmasang...» deb qo‘rqitmang.

## Qabul paytida

- Ochiq va aniq gapiring. Qiyinchiliklarni kichraytirmang ham, bo‘rttirmang ham.
- Bolaning kuchli tomonlari va qiziqishlari haqida ham ayting — bu mutaxassisga u bilan tezroq til topishishga yordam beradi.
- Tushunmagan atamangiz bo‘lsa, qayta so‘rang. Bu mutlaqo normal.
- Asosiy tavsiyalarni yozib oling yoki mutaxassisdan yozma xulosa so‘rang.

## Onlayn konsultatsiya bo‘lsa

- Internet aloqasi va qurilma quvvatini oldindan tekshiring.
- Yorug‘ va tinch joy tanlang, kamerani bola ko‘rinib turadigan qilib joylashtiring.
- Mutaxassis so‘rashi mumkin bo‘lgan o‘yinchoqlar, qalam va qog‘ozni yoningizda tayyorlab qo‘ying.
- Iloji bo‘lsa, oiladan yana bir kishi yordam bersin: biri bola bilan shug‘ullanadi, ikkinchisi mutaxassis bilan gaplashadi.

## Mutaxassisga beriladigan foydali savollar

- Bu natija yoki xulosa nimani anglatadi?
- Uyda har kuni nima qilishimiz mumkin?
- Qanday o‘zgarishlarni kutsak bo‘ladi va qachon qayta ko‘rishamiz?
- Qaysi holatda sizga muddatidan oldin murojaat qilishimiz kerak?
- Boshqa mutaxassislar ko‘rigi ham kerakmi?

## Qabuldan keyin

Tavsiyalar asosida 1–2 ta asosiy maqsad tanlang va ularni kun tartibiga qo‘shing. Mutaxassis ilova orqali topshiriq biriktirgan bo‘lsa, ular rejangizda paydo bo‘ladi. Mashg‘ulotlar davomida kuzatuvlaringizni yozib boring — keyingi qabulda bu ma’lumotlar juda asqotadi. Agar xulosa sizda savol yoki shubha uyg‘otsa, boshqa mutaxassis fikrini so‘rash ham mutlaqo to‘g‘ri qaror.

Qayerdan boshlashni bilmasangiz, hududingizdagi bepul YuniQo sessiyalaridan boshlang: u yerda logoped, defektolog va boshqa mutaxassislar dastlabki konsultatsiya beradi va keyingi qadamlarni tushuntiradi.`,
  },
  {
    id: "diqqatni-jamlash-qiyinchiliklari",
    topic: "organish",
    title: "Diqqatni jamlash qiyin bo‘lganda: uyda qanday yordam berish mumkin",
    summary:
      "Bolaning tez chalg‘ishi har doim ham muammo emas, lekin ba’zan qo‘shimcha yordam kerak bo‘ladi. Diqqatni qo‘llab-quvvatlovchi uy sharoiti, oddiy usullar va mutaxassisga murojaat qilish belgilari.",
    readMin: 4,
    author: "Nodira Azimova",
    authorId: "sp-nodira",
    date: "2026-05-06",
    emoji: "🎯",
    tags: ["diqqat", "giperaktivlik", "o‘rganish"],
    body: `«Bir joyda o‘tirmaydi», «gapimni eshitmaydi», «hech narsani oxiriga yetkazmaydi» — bunday shikoyatlarni ko‘p ota-onalardan eshitamiz. Kichik yoshdagi bolalarning diqqati tabiiy ravishda qisqa bo‘ladi va yosh bilan asta-sekin uzayadi. Harakatchanlik va qiziquvchanlik ham bolalikning ajralmas qismi. Shuning uchun avvalo bolaga yoshiga mos talablar qo‘yish muhim.

## Diqqatga nimalar ta’sir qiladi

- Uyqu yetishmasligi. Charchagan bola ko‘pincha sustlashmaydi, aksincha, bezovta va haddan tashqari harakatchan bo‘lib qoladi.
- Ochlik va tanaffussiz uzoq mashg‘ulotlar.
- Harakat yetishmasligi: kun davomida yugurib o‘ynamagan bola kechqurun o‘zini tiyishga qiynaladi.
- Shovqinli muhit, yoqilgan televizor, atrofda juda ko‘p o‘yinchoqlar.
- Topshiriqning juda qiyin yoki juda oson bo‘lishi.
- Eshitish yoki ko‘rishdagi aniqlanmagan muammolar.
- Xavotir, oiladagi o‘zgarishlar va boshqa hissiy holatlar.

## Diqqat yetishmasligi va giperaktivlik sindromi haqida

Ba’zi bolalarda diqqatni jamlash, bir joyda o‘tirish va o‘zini tiyish qiyinchiliklari tengdoshlariga qaraganda ancha kuchli bo‘ladi va kundalik hayotga sezilarli ta’sir qiladi. Bunday holatlarda mutaxassis diqqat yetishmasligi va giperaktivlik sindromi (xalqaro qisqartmasi — ADHD) ehtimolini ko‘rib chiqishi mumkin. Bu tashxis faqat mutaxassis tomonidan, belgilar uzoq vaqt davomida va turli joylarda — uyda, bog‘chada — kuzatilgandan so‘ng qo‘yiladi. Bu holat tarbiyadagi xato ham, bolaning «dangasaligi» ham emas. Bu miya rivojlanishining o‘ziga xosligi bo‘lib, to‘g‘ri yordam bilan bola muvaffaqiyatli o‘qishi va rivojlanishi mumkin.

## Uyda nima qilish mumkin

- Ko‘rsatmani qisqa va bittadan bering. Gapirishdan oldin bolaning e’tiborini torting: ismini ayting, yoniga boring, yelkasiga yengil teging.
- Katta vazifani kichik qadamlarga bo‘ling: «Avval kubiklarni qutiga yig‘amiz. Endi mashinalarni».
- Mashg‘ulotlarni qisqa qiling va orasida harakatli tanaffuslar qo‘shing: sakrash, cho‘zilish, yugurib kelish.
- Mashg‘ulot joyini tartibga soling: stol ustida faqat kerakli narsalar tursin, televizor o‘chiq bo‘lsin.
- Vaqtni ko‘rinadigan qiling: taymer yoki qum soati bolaga qancha vaqt qolganini tushunishga yordam beradi.
- Natijani emas, urinishni darhol va aniq maqtang: «Qiyin bo‘lsa ham, oxirigacha harakat qilding, barakalla!»
- Kun tartibini barqaror saqlang, yetarli uyqu va har kuni ochiq havoda faol harakatni ta’minlang.

## Diqqatni rivojlantiruvchi o‘yinlar

- «Nima yo‘qoldi?»: stolga 4–5 ta o‘yinchoq qo‘ying, bola ko‘zini yumganda bittasini olib qo‘ying.
- «Juftini top»: rasmli kartochkalarni teskari qo‘yib, bir xil rasmlarni toping.
- Boshqotirmalar, konstruktor va rasmdagi farqlarni topish.
- «Qarsak» o‘yini: siz aytayotgan so‘zlar orasida hayvon nomi eshitilganda bola qarsak chaladi.

## Qachon mutaxassisga murojaat qilish kerak

- Diqqat va xulq bilan bog‘liq qiyinchiliklar bir necha oy davomida saqlanib qolsa.
- Ular faqat uyda emas, bog‘chada yoki mehmonda ham kuzatilsa.
- Bola tez-tez xavfli harakatlar qilsa va jarohat olsa.
- Tengdoshlari bilan o‘ynash, o‘rganish yoki oilaviy hayot jiddiy qiyinlashsa.

Bunday holatlarda bolalar psixologi, defektolog yoki bolalar nevrologiga murojaat qiling. YuniQo ilovasidagi baholash «Diqqat va tafakkur» yo‘nalishidagi o‘zgarishlarni kuzatishga, defektolog mashqlari esa uyda muntazam mashq qilishga yordam beradi.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "yirik-motorika-va-muvozanat",
    topic: "motorika",
    title: "Yirik motorika va muvozanat: yugurish, sakrash va koordinatsiya",
    summary:
      "Yurish, yugurish, sakrash va muvozanat saqlash bolaning mustaqilligi va o‘ziga ishonchi uchun muhim. Yoshga oid mo‘ljallar, uydagi harakatli o‘yinlar va e’tibor talab qiladigan belgilar.",
    readMin: 4,
    author: "Malika Tursunova",
    authorId: "sp-malika",
    date: "2026-04-22",
    emoji: "⚽",
    tags: ["yirik motorika", "muvozanat", "harakatli o‘yinlar"],
    body: `Yirik motorika — katta mushak guruhlari ishtirokidagi harakatlar: emaklash, yurish, yugurish, sakrash, zinaga chiqish, to‘p tepish. Bu ko‘nikmalar bolaga atrof-olamni mustaqil o‘rganish, tengdoshlari bilan o‘ynash va o‘ziga ishonch hosil qilish imkonini beradi. Bundan tashqari, faol harakat diqqat, uyqu va kayfiyatga ham ijobiy ta’sir qiladi.

## Yoshga oid taxminiy mo‘ljallar

Har bir bola o‘z sur’atida rivojlanadi, quyidagilar faqat umumiy yo‘nalish:

- 6–9 oylikda: tayanchsiz o‘tiradi, emaklashga harakat qiladi.
- 12–15 oylikda: ko‘pchilik bolalar mustaqil yura boshlaydi.
- 2 yoshda: yuguradi, to‘pni tepadi, qo‘ldan ushlab zinaga chiqadi.
- 3 yoshda: ikki oyoqlab sakraydi, zinaga oyoqlarini navbatma-navbat qo‘yib chiqadi.
- 4–5 yoshda: bir oyoqda bir necha soniya turadi, bir oyoqda sakrashni o‘rganadi, katta to‘pni ilib oladi.

## Uyda va hovlida harakatli o‘yinlar

- To‘siqli yo‘l: yostiqlar ustidan o‘tish, stol ostidan emaklab o‘tish, polga yotqizilgan arqon bo‘ylab yurish.
- Polga yopishqoq lenta bilan chiziq torting — bola undan chiqib ketmasdan yurishga harakat qilsin.
- Hayvonlarga taqlid: ayiqdek to‘rt oyoqlab yurish, qurbaqadek sakrash, laylakdek bir oyoqda turish.
- To‘p o‘yinlari: dumalatish, otish, ilib olish, tepish. Katta va yumshoq to‘pdan boshlang.
- «Samolyotcha»: qo‘llarni yonga yozib, bir oyoqda turish.
- Bolalar maydonchasi: tepalikka chiqish, arg‘imchoq uchish, narvonga tirmashish.
- Musiqa ostida raqs va «to‘xta» o‘yini: musiqa to‘xtaganda hamma qotib qoladi.

YuniQo ilovasida «Bir oyoqda turish», «Samolyotcha» va «O‘tirib-turish» mashqlari bor. Premium obunada ularni AI video nazorat bilan bajarish mumkin: tahlil qurilmaning o‘zida bajariladi, video hech qayerga yuklanmaydi.

## Kuniga qancha harakat kerak

Jahon sog‘liqni saqlash tashkiloti tavsiyasiga ko‘ra, 1–4 yoshli bolalar kun davomida jami kamida 3 soat turli harakatli faoliyat bilan band bo‘lishi kerak. Bu bir martalik mashg‘ulot degani emas: sayr, o‘yin, uy yumushlarida yordam — barchasi hisobga kiradi. Bola aravacha yoki baland stulchada bir soatdan ortiq harakatsiz o‘tirib qolmasligiga harakat qiling.

## Koordinatsiyada qiynaladigan bolalar

Ba’zi bolalar boshqa sohalarda yaxshi rivojlansa ham, harakatlarni muvofiqlashtirishda qiynaladi: tez-tez qoqiladi, to‘pni ilib ololmaydi, kiyinishga ko‘p vaqt sarflaydi. Bu dangasalik yoki «beso‘naqaylik» emas va tanbeh bilan o‘zgarmaydi. Bunday bolaga sabr, ko‘proq mashq qilish imkoniyati va zarur bo‘lsa, mutaxassis yordami kerak.

## Qachon mutaxassisga murojaat qilish kerak

- 9–10 oylikda tayanchsiz o‘tira olmasa.
- 18 oylikda mustaqil yurmasa.
- Tanasining bir tomonini ikkinchisiga qaraganda kamroq ishlatsa.
- Mushaklari juda bo‘sh («latta qo‘g‘irchoqdek») yoki, aksincha, juda tarang bo‘lsa.
- 2–3 yoshdan keyin ham asosan oyoq uchida yursa.
- Tengdoshlariga qaraganda ancha ko‘p yiqilsa, qoqilsa yoki tez charchasa.
- Ilgari egallagan harakat ko‘nikmalarini yo‘qotsa yoki harakatlanganda og‘riq sezsa.

Bunday holatlarda pediatr, bolalar nevrologi yoki fizioterapevtga murojaat qiling. Erta boshlangan mashg‘ulotlar bolaga o‘z imkoniyatlarini to‘liqroq ochishga yordam beradi.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "autizm-spektri-erta-belgilar",
    topic: "autizm",
    title: "Autizm spektri: erta belgilar va birinchi qadamlar",
    summary:
      "Autizm spektri bolaning muloqoti, o‘yini va atrofni his qilishiga ta’sir qiladi. Qaysi erta belgilarga e’tibor berish, kimga murojaat qilish va tashxisni kutayotganda uyda nima qilish mumkinligi haqida.",
    readMin: 5,
    author: "Nodira Azimova",
    authorId: "sp-nodira",
    date: "2026-04-02",
    emoji: "🧩",
    tags: ["autizm", "erta belgilar", "muloqot"],
    body: `Har yili 2-aprel — Butunjahon autizm haqida xabardorlik kuni. Bu kun jamiyatni autizm spektridagi insonlarni tushunishga va qo‘llab-quvvatlashga chorlaydi. Ota-onalar uchun esa eng muhim savol ko‘pincha bitta: bolamdagi o‘ziga xosliklar qachon e’tibor talab qiladi?

## Autizm spektri nima

Autizm spektri — miya rivojlanishi bilan bog‘liq o‘ziga xoslik. U bolaning boshqalar bilan muloqot qilishi, o‘ynashi, tovush va teginishlarni his qilishi hamda o‘zgarishlarga moslashishiga ta’sir qiladi. «Spektr» so‘zi bejiz ishlatilmaydi: har bir bola betakror. Kimdir ko‘p gapiradi, kimdir so‘zsiz muloqot qiladi; kimgadir kundalik hayotda ko‘p yordam kerak, kimgadir kamroq.

Autizm tarbiyadagi xato yoki ota-onaning aybi bilan paydo bo‘lmaydi. Emlashlar autizmga sabab bo‘lmasligi ko‘plab yirik tadqiqotlarda isbotlangan.

## Erta belgilar

Quyidagi belgilar autizm borligini anglatmaydi, lekin mutaxassis bilan maslahatlashish uchun asos bo‘ladi:

- 6 oylikka kelib keng tabassum va quvonchli ifodalar juda kam yoki umuman yo‘q bo‘lsa.
- 9 oylikka kelib siz bilan tovush, tabassum va yuz ifodalari orqali «navbatma-navbat» muloqot qilmasa.
- 12 oylikka kelib g‘o‘ldiramasa, barmoq bilan ko‘rsatmasa, qo‘l silkitmasa.
- 12 oylikdan keyin ismini aytib chaqirganda ko‘pincha qayrilib qaramasa.
- 16 oylikka kelib birorta so‘z aytmasa, 2 yoshda mustaqil ikki so‘zli ibora tuzmasa.
- Qiziq narsani sizga ko‘rsatish uchun olib kelmasa yoki barmog‘i bilan ko‘rsatmasa.
- Qo‘l silkitish, aylanish kabi takroriy harakatlar yoki o‘yinchoqlarni qatorga terish odati juda kuchli bo‘lsa.
- Kichik o‘zgarishlarga juda qattiq ta’sirlansa, tovush, yorug‘lik yoki kiyimga odatdan tashqari sezgir bo‘lsa.
- Istalgan yoshda nutq yoki ijtimoiy ko‘nikmalarini yo‘qotsa.

## Qachon va kimga murojaat qilish kerak

Agar bu belgilardan bir nechtasini kuzatsangiz, «kutib ko‘ramiz» demang. Avval pediatrga murojaat qiling va eshitishni tekshirtiring. Keyingi bosqichda bolalar psixiatri, nevrolog yoki bolalar psixologi chuqurroq baholash o‘tkazadi. Tashxis bitta qisqa test bilan emas, balki bolani kuzatish va ota-ona bilan batafsil suhbat asosida qo‘yiladi.

Autizmni «davolab yuboradigan» dori yoki usul yo‘q, bunday va’da beradiganlardan ehtiyot bo‘ling. Lekin muloqot, o‘yin va kundalik ko‘nikmalarni rivojlantiruvchi mashg‘ulotlar ko‘plab bolalarga sezilarli yordam beradi. Yordam qanchalik erta boshlansa, shunchalik yaxshi.

## Kuchli tomonlarga tayaning

Autizm spektridagi ko‘plab bolalarning o‘ziga xos kuchli tomonlari bor: kuchli ko‘rish xotirasi, tafsilotlarga e’tibor, qoidalarga sodiqlik, sevimli mavzu bo‘yicha chuqur bilim. Mashg‘ulotlarni aynan shu qiziqishlar atrofida quring. Maqsad bolani «boshqalardek» qilish emas, balki unga muloqot qilish, o‘zini ifodalash va imkon qadar mustaqil yashash uchun kerakli ko‘nikmalarni berishdir.

## Tashxisni kutayotganda uyda nima qilish mumkin

- Bolaning qiziqishiga ergashing va o‘yiniga qo‘shiling. U mashina g‘ildiragini aylantirayotgan bo‘lsa, yonida o‘tirib siz ham aylantiring.
- Qisqa va oddiy so‘zlardan foydalaning, muhim so‘zlarni imo-ishoralar bilan qo‘llab-quvvatlang.
- Kun tartibini barqaror saqlang va o‘zgarishlar haqida oldindan ogohlantiring.
- Bolaning kuchli tomonlarini yozib boring: nimaga qiziqadi, nimada zo‘r? Bu ma’lumot mutaxassis uchun juda qimmatli.
- Kuzatuvlaringizni YuniQo ilovasiga yozib boring va rivojlanish baholashidan o‘ting. Natijalarni mutaxassis bilan ulashish qabulni samaraliroq qiladi.

YuniQo tashxis qo‘ymaydi, lekin kuzatuvlaringizni tartibga solish va to‘g‘ri mutaxassisni topishda yordam beradi. Hududingizdagi bepul YuniQo sessiyalarida bolalar psixologi va defektolog bilan dastlabki maslahat olishingiz mumkin.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "daun-sindromi-birinchi-qadamlar",
    topic: "daun",
    title: "Daun sindromi: tashxisdan keyingi birinchi qadamlar",
    summary:
      "Daun sindromi haqida bilganingizda ko‘p savollar tug‘iladi. Bu holat nima, qaysi tibbiy tekshiruvlar muhim va bolaning rivojlanishini birinchi kunlardan qanday qo‘llab-quvvatlash mumkinligi haqida.",
    readMin: 5,
    author: "YuniQo tahririyati",
    date: "2026-03-21",
    emoji: "💛",
    tags: ["Daun sindromi", "erta yordam", "salomatlik"],
    body: `Har yili 21-mart — Butunjahon Daun sindromi kuni. Sana bejiz tanlanmagan: Daun sindromi 21-xromosomaning uch nusxada bo‘lishi bilan bog‘liq. Bu kun Daun sindromi bo‘lgan insonlar ham o‘qishi, ishlashi, do‘stlashishi va to‘laqonli hayot kechirishi mumkinligini eslatadi.

## Daun sindromi nima

Odatda har bir hujayrada 21-xromosoma ikki nusxada bo‘ladi. Daun sindromida esa bu xromosomaning qo‘shimcha nusxasi (to‘liq yoki qisman) mavjud. Bu genetik holat bo‘lib, u homiladorlik paytida ota-onaning biror harakati yoki xatosi tufayli paydo bo‘lmaydi. Daun sindromi «davolanib ketadigan» holat emas — bu bolaning umrbod o‘ziga xosligi. Shu bilan birga, har bir bola betakror: uning xarakteri, qiziqishlari va qobiliyatlari faqat unga xos.

Ko‘pchilik bolalarda mushak tonusi past bo‘ladi, shuning uchun o‘tirish, yurish va gapirish kabi ko‘nikmalar odatda kechroq shakllanadi. Lekin bola butun hayoti davomida o‘rganishda va rivojlanishda davom etadi. Ko‘p bolalarning kuchli tomoni — ko‘rish orqali o‘rganish, taqlid qilish va odamlarga iliq munosabat.

## His-tuyg‘ularingiz haqida

Tashxisni eshitgan ko‘plab ota-onalar avvaliga sarosima, qayg‘u yoki xavotirni boshdan kechiradi. Bu tabiiy. O‘zingizga vaqt bering, savollaringizni yozib boring va ma’lumotni ishonchli manbalardan oling. Vaqt o‘tishi bilan ko‘plab oilalar farzandining har bir yutug‘idan alohida quvonch topishini aytadi.

## Salomatlik bo‘yicha muhim tekshiruvlar

Daun sindromi bo‘lgan bolalarda ba’zi sog‘liq muammolari ko‘proq uchraydi. Ularni o‘z vaqtida aniqlash bolaning rivojlanishiga katta yordam beradi:

- Yurak: tug‘ma yurak nuqsonlari ko‘proq uchragani uchun hayotning ilk haftalaridayoq kardiolog ko‘rigi va yurak ultratovush tekshiruvi (exokardiografiya) tavsiya etiladi.
- Eshitish: eshitish tug‘ilganda va keyinchalik muntazam tekshirib turiladi.
- Ko‘rish: ko‘z shifokori ko‘rigi muntazam bo‘lishi kerak.
- Qalqonsimon bez: gormonlar tahlili muntazam topshiriladi.
- O‘sish va ovqatlanish: pediatr kuzatuvi doimiy bo‘lishi lozim.

Ko‘riklar jadvalini pediatr yoki genetik bilan kelishib oling.

## Erta yordam — rivojlanish poydevori

Mutaxassislar bilan ishlashni imkon qadar erta boshlash tavsiya etiladi:

- Fizioterapevt yoki reabilitolog harakat ko‘nikmalarini rivojlantirish va mushaklarni mustahkamlashga yordam beradi.
- Logoped ovqatlanish, og‘iz mushaklari va muloqotning ilk bosqichlarida yordam beradi.
- Defektolog yoki maxsus pedagog o‘yin orqali bilish ko‘nikmalarini rivojlantiradi.

## Uyda nima qilish mumkin

- Chaqaloqni uyg‘oq paytida qorni bilan yotqizing — bu bo‘yin, yelka va orqa mushaklarini mustahkamlaydi.
- U bilan ko‘p gaplashing, qo‘shiq aytib bering, yuz ifodalaringizni ko‘rsating.
- «Yana», «tamom», «ber» kabi oddiy imo-ishoralarni erta qo‘llang.
- Har kuni birga rasmli kitob ko‘ring, qo‘shiq ayting va o‘ynang.
- Mustaqillikka imkon bering: sekinroq bo‘lsa ham, bola o‘zi ovqatlanishi va kiyinishiga vaqt ajrating.
- Kichik yutuqlarni nishonlang va bolani boshqalar bilan solishtirmang.
- O‘zingizga ham g‘amxo‘rlik qiling. Boshqa ota-onalar bilan tajriba almashish katta kuch beradi — YuniQo hamjamiyatidagi mavzuli guruhlarda bunday suhbatlar uchun joy bor.

## Bog‘cha va tengdoshlar davrasi

Daun sindromi bo‘lgan bolalar tengdoshlari bilan birga o‘ynab, ulardan ko‘p narsani o‘rganadi. Bog‘cha tanlashda tarbiyachilar bilan oldindan gaplashing, bolaning kuchli tomonlari va ehtiyojlari haqida ayting. Inklyuziv muhit nafaqat sizning farzandingizga, balki boshqa bolalarga ham mehr va bag‘rikenglikni o‘rgatadi.

## Qachon mutaxassisga murojaat qilish kerak

Bola tez charchasa, nafas olishi qiyinlashsa yoki lablari ko‘karsa, ovqatlanishda qiyinchilik bo‘lsa, eshitish yoki ko‘rish pasayganini sezsangiz, shuningdek ilgari egallagan ko‘nikmalar yo‘qolsa, shifokorga kechiktirmay murojaat qiling.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
  {
    id: "togri-maqtash-va-motivatsiya",
    topic: "qollanma",
    title: "To‘g‘ri maqtash: bolani qanday rag‘batlantirish kerak?",
    summary:
      "Aniq va samimiy maqtov bolaga nimani yaxshi qilganini tushunishga va yana urinishga yordam beradi. Maqtov, mukofot va motivatsiya bo‘yicha amaliy maslahatlar.",
    readMin: 4,
    author: "Jasur Rahimov",
    authorId: "sp-jasur",
    date: "2026-03-04",
    emoji: "⭐",
    tags: ["maqtov", "motivatsiya", "tarbiya"],
    body: `Maqtov — bola uchun eng kuchli rag‘batlardan biri. U bolaga «sen buni uddalading, men seni ko‘ryapman» degan xabarni yetkazadi. Rivojlanishida o‘ziga xosligi bor bolalar uchun har bir yangi ko‘nikma katta mehnat evaziga keladi, shuning uchun to‘g‘ri rag‘bat ular uchun yanada muhim. Lekin maqtovning ham o‘z qoidalari bor.

## Aniq maqtang

«Barakalla» yoki «zo‘r» degan so‘zlar yoqimli, lekin bola nima uchun maqtalayotganini har doim ham tushunavermaydi. Aniq maqtov esa nima to‘g‘ri bo‘lganini ko‘rsatadi va uni takrorlashga undaydi:

- «Minorani o‘zing qurding, kubiklarni juda ehtiyotkorlik bilan qo‘yding!»
- «Poyabzalingni o‘zing kiyding, barakalla!»
- «Mashinangni ukang bilan bo‘lishding — bu juda chiroyli ish!»

## Natijani emas, urinishni maqtang

«Sen juda aqllisan» deyishdan ko‘ra «Qiyin bo‘lsa ham, oxirigacha harakat qilding» degan maqtov foydaliroq. Urinish maqtalganda bola qiyinchilikdan qo‘rqmaydi va xato qilishdan cho‘chimaydi. Bu, ayniqsa, mashg‘ulotlar qiyin kechadigan bolalar uchun muhim: natija bugun bo‘lmasa ham, harakatning o‘zi qadrli.

## Maqtovni o‘z vaqtida bering

- Maqtovni harakatdan keyin darhol ayting, ayniqsa kichik bolalarga.
- Katta natijani kutmang: kichik qadamni ham payqang va qadrlang.
- So‘zsiz maqtovdan ham foydalaning: tabassum, quchoq, kaftma-kaft urishtirish.
- Samimiy bo‘ling. Bolalar soxta maqtovni tez sezadi.

## Har bir bolaning o‘z mukofoti

Hamma bolalarni ham bir xil narsa quvontirmaydi. Nutqi hali cheklangan bola uchun so‘zli maqtovdan ko‘ra sevimli harakat — aylantirish, qitiqlash, qo‘shiq aytib berish — kuchliroq rag‘bat bo‘lishi mumkin. Bolangizni nima chin dildan quvontirishini kuzating va shundan foydalaning.

## Mukofot va «pora»ning farqi

Stikerlar jadvali kabi mukofot tizimlari yangi ko‘nikmani o‘rganishda yordam berishi mumkin. Masalan, har kuni tish yuvganda bitta stiker, beshta stiker yig‘ilganda esa birga bog‘ga sayrga borish. Muhim qoidalar:

- Mukofot oldindan kelishiladi va bola nimaga erishishi kerakligini aniq biladi.
- Maqsad bitta va aniq bo‘lsin: «yaxshi bola bo‘lish» emas, «ovqatdan keyin qo‘l yuvish».
- Ko‘nikma odatga aylangach, mukofotni asta-sekin kamaytiring, maqtovni esa saqlab qoling.
- Jazava paytida «to‘xtasang, shokolad beraman» deyish mukofot emas, balki «pora». U bolaga jazava natija berishini o‘rgatib qo‘yadi.

## Nimalardan saqlanish kerak

- Boshqa bolalar bilan solishtirish: «Qo‘shnining o‘g‘li allaqachon gapiryapti». Bu bolaning ham, sizning ham kayfiyatingizni tushiradi.
- Maqtovga tanbeh qo‘shish: «Zo‘r, lekin kecha nega qilmading?»
- Mehrni faqat natija uchun ko‘rsatish. Bola har qanday holatda ham sevilishini bilishi kerak.

## Qachon mutaxassisga murojaat qilish kerak

Agar bola hech qanday rag‘batga qiziqmasa, maqtov va e’tiborga befarq bo‘lsa yoki xulq-atvordagi qiyinchiliklar oila hayotini jiddiy qiyinlashtirsa, bolalar psixologi bilan maslahatlashing. Mutaxassis bolangizga mos rag‘batlantirish tizimini tuzishga yordam beradi.

YuniQo ilovasida bola mashqlarni bajarib ball va nishonlar to‘playdi. Bu yoqimli qo‘shimcha, lekin eng katta mukofot baribir sizning e’tiboringiz, quvonchingiz va yaqinligingiz bo‘lib qoladi.`,
  },
  {
    id: "kun-tartibi",
    topic: "qollanma",
    title: "Kun tartibi: bola uchun xotirjamlik va rivojlanish asosi",
    summary:
      "Barqaror kun tartibi bolaga xavfsizlik hissini beradi, xulq-atvorni yengillashtiradi va mashg‘ulotlarni odatga aylantiradi. Uni qanday tuzish va hayotga tatbiq etish haqida.",
    readMin: 4,
    author: "Jasur Rahimov",
    authorId: "sp-jasur",
    date: "2026-02-10",
    emoji: "🗓️",
    tags: ["kun tartibi", "uyqu", "odatlar"],
    body: `Bola uchun dunyo katta va ko‘pincha oldindan aytib bo‘lmaydigan joy. Kun tartibi bu dunyoni tushunarli qiladi: bola nima bo‘lishini bilsa, o‘zini xavfsiz his qiladi, kamroq injiqlik qiladi va yangi ko‘nikmalarni osonroq o‘zlashtiradi. Bu, ayniqsa, autizm spektridagi, diqqatni jamlashda qiynaladigan yoki rivojlanishida boshqa o‘ziga xosliklari bor bolalar uchun muhim.

## Kun tartibi — qat’iy jadval emas

Kun tartibi daqiqama-daqiqa bajariladigan reja emas, balki har kuni takrorlanadigan ketma-ketlik. Masalan, «uyg‘onish — yuvinish — nonushta — o‘yin» tartibi har kuni bir xil bo‘lsa, soatlar biroz o‘zgarib tursa ham, bola o‘zini ishonchli his qiladi. Mehmonlar, bayramlar va safarlar ham hayotning bir qismi. Bunday kunlarda asosiy tayanch nuqtalarni — ovqatlanish va uyqu oldi odatlarini saqlashga harakat qiling.

## Kun tartibi namunasi

- Ertalab: uyg‘onish, yuvinish, kiyinish, nonushta.
- Kunduzi: o‘yin, ochiq havoda sayr, tushlik, kunduzgi uyqu yoki dam olish.
- Kunning ikkinchi yarmi: 10–15 daqiqalik mashg‘ulot, masalan, YuniQo ilovasidagi bugungi mashqlar, so‘ng erkin o‘yin.
- Kechqurun: kechki ovqat, cho‘milish, kitob o‘qish va uyqu.

## Uyqu — rivojlanishning muhim qismi

Yetarli uyqu diqqat, xotira, kayfiyat va xulq-atvorga bevosita ta’sir qiladi. Mutaxassislarning umumiy tavsiyalariga ko‘ra, 1–2 yoshli bolalarga kuniga taxminan 11–14 soat, 3–5 yoshlilarga esa 10–13 soat uyqu kerak (kunduzgi uyqu bilan birga). Har kuni bir vaqtda yotish va turish, uxlashdan oldingi tinch odatlar — cho‘milish, kitob, ertak, sokin musiqa — bolaga tezroq uxlab qolishga yordam beradi. Uxlashdan taxminan bir soat oldin ekranlarni o‘chiring.

## Kun tartibini qanday joriy qilish kerak

- Bir-ikki tayanch nuqtadan boshlang, masalan, doimiy uyqu vaqti va ertalabki odatlar.
- Rasmli jadval tuzing: har bir faoliyat uchun rasm yoki fotosurat. Bajarilgan ishni bola o‘zi belgilashi mumkin.
- Bir ishdan boshqasiga o‘tishdan oldin ogohlantiring: «5 daqiqadan keyin cho‘milamiz». Qo‘shiq yoki taymer ham yordam beradi.
- Imkon qadar tanlov bering: «Avval tish yuvamizmi yoki pijama kiyamizmi?»
- Oiladagi barcha kattalar bir xil tartibga amal qilishi muhim.
- Dam olish kunlari ham uyg‘onish va uxlash vaqtini imkon qadar o‘zgartirmang.
- Tartibga amal qilgani uchun bolani maqtang: «Bugun tishingni o‘zing yuvding, barakalla!»
- Sabrli bo‘ling: yangi tartibga ko‘nikish uchun bir necha hafta kerak bo‘lishi mumkin.

## Mashg‘ulotlarni odatga aylantirish

Mutaxassis tavsiya qilgan mashqlar bir martalik uzoq mashg‘ulotdan ko‘ra har kuni qisqa vaqt bajarilganda yaxshiroq natija beradi. Ularni kundalik vaziyatlarga bog‘lang: nonushtadan keyin artikulyatsion gimnastika, sayr paytida muvozanat o‘yinlari. YuniQo ilovasi va @YuniQo_bot Telegram boti siz tanlagan vaqtda bugungi mashqlarni eslatib turadi.

## Qachon mutaxassisga murojaat qilish kerak

Agar tartibga qaramay bola uxlab qolishda doimiy qiynalsa, kechasi tez-tez uyg‘onsa, kunduzi haddan tashqari charchoq yoki kuchli jazavalar davom etsa, pediatr yoki bolalar psixologiga murojaat qiling.

Eslatma: bu maqola umumiy ma’lumot beradi va mutaxassis konsultatsiyasi o‘rnini bosmaydi.`,
  },
];

export function getArticle(id?: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}
