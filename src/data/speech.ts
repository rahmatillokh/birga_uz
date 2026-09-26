import type { SpeechSound } from "@/lib/types";

/**
 * Talaffuz mashqlari uchun tovushlar va so‘zlar.
 * Har bir tovushda 9 ta so‘z: 3 tasida tovush so‘z boshida («bosh»), 3 tasida o‘rtasida («orta»),
 * 3 tasida oxirida («oxir»). Tavsif ota-onalar uchun yozilgan.
 */
export const SPEECH_SOUNDS: SpeechSound[] = [
  {
    id: "r",
    sound: "R",
    emoji: "🐯",
    description:
      "R — til uchi yuqori tishlar ortidagi do‘mboqchada tez-tez titrab aytiladi. Eng qiyin tovushlardan biri: bolalar uni ko‘pincha «l» yoki «y» ga almashtiradi yoki tomoqdan aytadi; odatda 5–6 yoshda to‘liq shakllanadi.",
    words: [
      { word: "Rak", emoji: "🦞", position: "bosh" },
      { word: "Raketa", emoji: "🚀", position: "bosh" },
      { word: "Robot", emoji: "🤖", position: "bosh" },
      { word: "Arra", emoji: "🪚", position: "orta" },
      { word: "Tarvuz", emoji: "🍉", position: "orta" },
      { word: "Qurbaqa", emoji: "🐸", position: "orta" },
      { word: "Qor", emoji: "❄️", position: "oxir" },
      { word: "Sigir", emoji: "🐄", position: "oxir" },
      { word: "Daftar", emoji: "📓", position: "oxir" },
    ],
    phrases: [
      "Ra-ra-ra — robot raketada uchar.",
      "Qor yog‘ar, qor yog‘ar, Qorbobo keldi!",
      "Sigir, sigir, sut ber, Rustamjonga sut ber!",
    ],
  },
  {
    id: "sh",
    sound: "Sh",
    emoji: "🤫",
    description:
      "Sh — lablar oldinga cho‘zilib «karnaycha» bo‘ladi, til uchi yuqoriga ko‘tarilib «kosacha» hosil qiladi, kaftga iliq havo chiqadi. Bolalar ko‘pincha uni «s» ga almashtiradi (shar — «sar»).",
    words: [
      { word: "Shar", emoji: "🎈", position: "bosh" },
      { word: "Sher", emoji: "🦁", position: "bosh" },
      { word: "Shaftoli", emoji: "🍑", position: "bosh" },
      { word: "Mushuk", emoji: "🐱", position: "orta" },
      { word: "Mashina", emoji: "🚗", position: "orta" },
      { word: "Qoshiq", emoji: "🥄", position: "orta" },
      { word: "Quyosh", emoji: "☀️", position: "oxir" },
      { word: "Qush", emoji: "🐦", position: "oxir" },
      { word: "Tish", emoji: "🦷", position: "oxir" },
    ],
    phrases: [
      "Sha-sha-sha — mushukcha juda yaxshi.",
      "Shamol esdi, shar uchdi, shoxda qushcha sayradi.",
      "Shoshmagan toshbaqa shaftoli bog‘iga yetib keldi.",
    ],
  },
  {
    id: "s",
    sound: "S",
    emoji: "💧",
    description:
      "S — hushtakli tovush: lablar jilmayib turadi, til uchi pastki tishlar ortiga tiraladi va o‘rtadan ingichka salqin havo oqimi chiqadi. Ko‘p uchraydigan xatolar — tilni tishlar orasiga chiqarib aytish yoki «sh» ga almashtirish.",
    words: [
      { word: "Sut", emoji: "🥛", position: "bosh" },
      { word: "Soat", emoji: "⏰", position: "bosh" },
      { word: "Sichqon", emoji: "🐭", position: "bosh" },
      { word: "Asal", emoji: "🍯", position: "orta" },
      { word: "Kosa", emoji: "🥣", position: "orta" },
      { word: "Musiqa", emoji: "🎵", position: "orta" },
      { word: "Ananas", emoji: "🍍", position: "oxir" },
      { word: "Avtobus", emoji: "🚌", position: "oxir" },
      { word: "Tovus", emoji: "🦚", position: "oxir" },
    ],
    phrases: [
      "Sa-sa-sa — sichqoncha sut so‘radi.",
      "Sanam sabzi va asal sotib oldi.",
      "Sichqoncha soydan suv simirdi.",
    ],
  },
  {
    id: "l",
    sound: "L",
    emoji: "🌷",
    description:
      "L — til uchi yuqori tishlar ortiga tiraladi, havo tilning ikki yonidan chiqadi, ovoz jaranglaydi. Bolalar ko‘pincha uni «y» yoki «v» ga almashtiradi yoki umuman tushirib qoldiradi (lola — «yoya»).",
    words: [
      { word: "Limon", emoji: "🍋", position: "bosh" },
      { word: "Lola", emoji: "🌷", position: "bosh" },
      { word: "Lab", emoji: "👄", position: "bosh" },
      { word: "Olma", emoji: "🍎", position: "orta" },
      { word: "Qalam", emoji: "✏️", position: "orta" },
      { word: "Tulki", emoji: "🦊", position: "orta" },
      { word: "Fil", emoji: "🐘", position: "oxir" },
      { word: "Gul", emoji: "🌸", position: "oxir" },
      { word: "Qo‘l", emoji: "✋", position: "oxir" },
    ],
    phrases: [
      "La-la-la — lolalar ochildi.",
      "Tulki tolning tagida lola ko‘rdi.",
      "Lola bilan Laylo lagandan olma oldi.",
    ],
  },
  {
    id: "j",
    sound: "J",
    emoji: "🐥",
    description:
      "J — jarangli tovush: lablar biroz oldinga cho‘ziladi, til old qismi tanglayga tegib ochiladi va ovoz qo‘shiladi («jo‘ja»dagi kabi); o‘zlashma so‘zlarda (jirafa, plyaj) yumshoqroq aytiladi. Bolalar ko‘pincha uni «z» yoki jarangsiz «ch» ga almashtiradi (jo‘ja — «zo‘za», «cho‘cha»).",
    words: [
      { word: "Jo‘ja", emoji: "🐥", position: "bosh" },
      { word: "Jirafa", emoji: "🦒", position: "bosh" },
      { word: "Jo‘mrak", emoji: "🚰", position: "bosh" },
      { word: "Ajdar", emoji: "🐉", position: "orta" },
      { word: "Masjid", emoji: "🕌", position: "orta" },
      { word: "Makkajo‘xori", emoji: "🌽", position: "orta" },
      { word: "Toj", emoji: "👑", position: "oxir" },
      { word: "Plyaj", emoji: "🏖️", position: "oxir" },
      { word: "Massaj", emoji: "💆", position: "oxir" },
    ],
    phrases: [
      "Ja-ja-ja — jajji jo‘ja, jo‘jajonim.",
      "Jirafa jo‘jaga jilmaydi.",
      "Ajdar tojini javonga qo‘ydi.",
    ],
  },
  {
    id: "ch",
    sound: "Ch",
    emoji: "🚂",
    description:
      "Ch — til old qismi tanglayga tegib turadi va keskin ochiladi: «t» bilan «sh» qo‘shilgandek qisqa tovush chiqadi. Bolalar ko‘pincha uni «s», «t» yoki «sh» ga almashtiradi (choy — «soy»).",
    words: [
      { word: "Choy", emoji: "🍵", position: "bosh" },
      { word: "Chumoli", emoji: "🐜", position: "bosh" },
      { word: "Chana", emoji: "🛷", position: "bosh" },
      { word: "Qaychi", emoji: "✂️", position: "orta" },
      { word: "Kuchuk", emoji: "🐶", position: "orta" },
      { word: "Pichoq", emoji: "🔪", position: "orta" },
      { word: "Qilich", emoji: "🗡️", position: "oxir" },
      { word: "Guruch", emoji: "🍚", position: "oxir" },
      { word: "Yog‘och", emoji: "🪵", position: "oxir" },
    ],
    phrases: [
      "Cha-cha-cha — choynakda issiq choy.",
      "Chaqqon chumoli chelak ko‘tardi.",
      "Chigirtka chiroq yonida chirilladi.",
    ],
  },
  {
    id: "z",
    sound: "Z",
    emoji: "🐝",
    description:
      "Z — «s» ning jarangli jufti: lablar jilmayib turadi, til uchi pastki tishlar ortida, havo oqimiga ovoz qo‘shilib «z-z-z» deb jaranglaydi. Bolalar ko‘pincha uni jarangsiz «s» ga yoki «j» ga almashtiradi (zina — «sina»).",
    words: [
      { word: "Zebra", emoji: "🦓", position: "bosh" },
      { word: "Zina", emoji: "🪜", position: "bosh" },
      { word: "Zamburug‘", emoji: "🍄", position: "bosh" },
      { word: "Uzum", emoji: "🍇", position: "orta" },
      { word: "Ko‘zoynak", emoji: "👓", position: "orta" },
      { word: "Muzqaymoq", emoji: "🍦", position: "orta" },
      { word: "Muz", emoji: "🧊", position: "oxir" },
      { word: "Yulduz", emoji: "⭐", position: "oxir" },
      { word: "Xo‘roz", emoji: "🐓", position: "oxir" },
    ],
    phrases: [
      "Za-za-za — Zafar zinadan tushdi.",
      "Zamira bozordan uzum oldi.",
      "Muzqaymoq muzdek, mazasi zo‘r!",
    ],
  },
  {
    id: "k",
    sound: "K",
    emoji: "🦋",
    description:
      "K — tilning orqa qismi yumshoq tanglayga tegib, havo bilan keskin ochiladi, til uchi esa pastki tishlar ortida turadi. Bolalar ko‘pincha uni «t» ga almashtiradi (kalit — «talit»); uni chuqurroq aytiladigan «q» dan farqlashni ham o‘rgatish kerak.",
    words: [
      { word: "Kalit", emoji: "🔑", position: "bosh" },
      { word: "Kitob", emoji: "📖", position: "bosh" },
      { word: "Kema", emoji: "🚢", position: "bosh" },
      { word: "Echki", emoji: "🐐", position: "orta" },
      { word: "Maktab", emoji: "🏫", position: "orta" },
      { word: "Akula", emoji: "🦈", position: "orta" },
      { word: "Etik", emoji: "👢", position: "oxir" },
      { word: "Yurak", emoji: "❤️", position: "oxir" },
      { word: "Varrak", emoji: "🪁", position: "oxir" },
    ],
    phrases: [
      "Ka-ka-ka — kapalak keldi.",
      "Kichkina kuchukcha kalitni topdi.",
      "Ko‘k kema ko‘lda suzdi.",
    ],
  },
];

export function getSound(id?: string): SpeechSound | undefined {
  return SPEECH_SOUNDS.find((s) => s.id === id);
}
