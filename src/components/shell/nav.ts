export interface NavItem {
  href: string;
  label: string;
  emoji: string;
  premium?: boolean;
}

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Asosiy",
    items: [
      { href: "/", label: "Bosh sahifa", emoji: "🏠" },
      { href: "/child", label: "Bola profili", emoji: "👶" },
      { href: "/assessment", label: "Rivojlanish baholash", emoji: "🧠" },
      { href: "/plan", label: "Individual reja", emoji: "🎯" },
    ],
  },
  {
    title: "Mashg‘ulotlar",
    items: [
      { href: "/exercises", label: "Mashqlar", emoji: "🧩" },
      { href: "/ai", label: "AI", emoji: "✨" },
      { href: "/ai-check", label: "AI video nazorat", emoji: "📹", premium: true },
      { href: "/speech", label: "Nutq va talaffuz", emoji: "🗣️" },
      { href: "/games", label: "O‘yinlar", emoji: "🎮" },
      { href: "/videos", label: "Videolar", emoji: "🎥" },
    ],
  },
  {
    title: "Natijalar",
    items: [
      { href: "/progress", label: "Progress", emoji: "📈" },
      { href: "/achievements", label: "Yutuqlar", emoji: "🏆" },
      { href: "/passport", label: "Rivojlanish pasporti", emoji: "📁" },
    ],
  },
  {
    title: "Yordam",
    items: [
      { href: "/specialists", label: "Mutaxassislar", emoji: "👨‍⚕️" },
      { href: "/sessions", label: "Bepul sessiyalar", emoji: "🏢" },
      { href: "/community", label: "Hamjamiyat", emoji: "👨‍👩‍👧" },
      { href: "/library", label: "Bilim bazasi", emoji: "📚" },
      { href: "/market", label: "YuniQo Market", emoji: "🛒" },
    ],
  },
  {
    title: "Kabinet",
    items: [
      { href: "/cabinet", label: "Ota-ona kabineti", emoji: "👨‍👩‍👧" },
      { href: "/reminders", label: "Eslatmalar", emoji: "🔔" },
      { href: "/premium", label: "Premium", emoji: "💎" },
      { href: "/settings", label: "Xavfsizlik", emoji: "🔐" },
      { href: "/help", label: "Yordam va FAQ", emoji: "❓" },
    ],
  },
  {
    title: "YuniQo",
    items: [
      { href: "/bot", label: "Telegram bot", emoji: "🤖" },
      { href: "/about", label: "Loyiha haqida", emoji: "💡" },
      { href: "/admin", label: "Ko‘rgazma paneli", emoji: "📺" },
    ],
  },
];

export const BOTTOM_NAV: NavItem[] = [
  { href: "/", label: "Asosiy", emoji: "🏠" },
  { href: "/exercises", label: "Mashqlar", emoji: "🎯" },
  { href: "/ai", label: "AI", emoji: "✨" },
  { href: "/progress", label: "Progress", emoji: "📊" },
  { href: "/cabinet", label: "Kabinet", emoji: "👤" },
];

export const SPECIALIST_NAV: NavItem[] = [
  { href: "/specialist", label: "Mutaxassis kabineti", emoji: "🩺" },
  { href: "/specialist?tab=jadval", label: "Qabul jadvali", emoji: "📅" },
  { href: "/specialists/sp-dilnoza", label: "Mening profilim", emoji: "👩‍🏫" },
  { href: "/community", label: "Hamjamiyat savollari", emoji: "💬" },
  { href: "/library", label: "Bilim bazasi", emoji: "📚" },
];

export function isActive(pathname: string, href: string): boolean {
  const path = href.split("?")[0];
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}
