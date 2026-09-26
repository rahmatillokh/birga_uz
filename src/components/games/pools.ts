/**
 * O‘yinlar uchun emoji to‘plamlari.
 * Faqat keng tarqalgan emoji (Emoji ≤ 12) — eski telefon va kompyuterlarda ham to‘g‘ri ko‘rinadi.
 */

export const ANIMALS = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐤", "🦆", "🦉", "🐴", "🐝", "🐞", "🐢", "🐙", "🐠", "🐬", "🦒", "🐘", "🦓"];
export const FOOD = ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒", "🍑", "🍍", "🥝", "🥕", "🌽", "🥦", "🍄", "🧀", "🍪", "🍩", "🍦"];
export const VEHICLES = ["🚗", "🚕", "🚌", "🚓", "🚑", "🚒", "🚜", "🚲", "🛵", "✈️", "🚀", "🚁", "⛵", "🚂"];
export const THINGS = ["⚽", "🏀", "🎈", "🎁", "🧸", "🎨", "🥁", "🎺", "🎸", "📚", "✏️", "🔑", "⏰", "☂️", "🧩", "👑"];
export const NATURE = ["🌸", "🌻", "🌷", "🌈", "⭐", "🌙", "☀️", "☁️", "❄️", "🍀", "🌵", "🌲", "🍁", "🔥", "💧", "🌊"];

export const CATEGORIES: readonly string[][] = [ANIMALS, FOOD, VEHICLES, THINGS, NATURE];

/** Xotira kartalari uchun — bir-biridan yaqqol farq qiladigan rasmlar */
export const MEMORY_POOL = [
  "🐶", "🐱", "🐰", "🦊", "🐻", "🐼", "🐸", "🐵", "🦁", "🐷", "🐧", "🐢", "🐙", "🦋", "🐞",
  "🍎", "🍌", "🍇", "🍓", "🍉", "🍒", "⚽", "🎈", "🚗", "🚀", "🌈", "⭐", "🌻", "🍦", "🎁",
];

/** Bir-biriga o‘xshash rasmlar guruhlari (qiyin daraja uchun) */
export const LOOKALIKES: readonly string[][] = [
  ["🐶", "🐕", "🐺", "🦊"],
  ["🐱", "🐈", "🐯", "🦁"],
  ["🍎", "🍅", "🍒", "🍓"],
  ["🍊", "🍑", "🍋", "🥭"],
  ["🚗", "🚙", "🚕", "🚓"],
  ["🌸", "🌺", "🌷", "🌹"],
  ["⭐", "🌟", "✨", "💫"],
  ["🐤", "🐥", "🐣", "🐔"],
  ["🐸", "🐢", "🦎", "🐊"],
  ["🐭", "🐹", "🐰", "🐨"],
  ["⚽", "🏀", "🏐", "🎾"],
];
