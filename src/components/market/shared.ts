import { PRODUCTS } from "@/data/products";
import type { Domain, Order, Product } from "@/lib/types";

/** Yetkazib berish narxi va bepul yetkazish chegarasi */
export const DELIVERY_FEE = 25_000;
export const FREE_DELIVERY_FROM = 300_000;
export const MAX_QTY = 20;

export function deliveryFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
}

export function discountPct(p: Pick<Product, "price" | "oldPrice">): number {
  if (!p.oldPrice || p.oldPrice <= p.price) return 0;
  return Math.round((1 - p.price / p.oldPrice) * 100);
}

/** "3–8 yosh" -> [3, 8]; "3+ yosh" / "3 yoshdan" -> [3, 99]; "6 oy – 3 yosh" -> [0.5, 3] */
export function parseAgeRange(text: string): [number, number] {
  const s = (text ?? "").toLowerCase().replace(/,/g, ".");
  const nums = Array.from(s.matchAll(/(\d+(?:\.\d+)?)\s*(oy)?/g)).map((m) => {
    const n = parseFloat(m[1]);
    return m[2] ? n / 12 : n;
  });
  if (!nums.length) return [0, 99];
  if (nums.length === 1) {
    if (s.includes("+") || s.includes("dan")) return [nums[0], 99];
    return [nums[0], nums[0] + 1];
  }
  return [Math.min(nums[0], nums[1]), Math.max(nums[0], nums[1])];
}

/** Mahsulot yosh oralig‘i [min, max] bilan kesishadimi */
export function ageOverlaps(p: Product, min: number, max: number): boolean {
  const [a, b] = parseAgeRange(p.ageRange);
  return a <= max && b >= min;
}

/** Bola yoshiga mosmi (butun yillarda) */
export function fitsAge(p: Product, years: number): boolean {
  const [a, b] = parseAgeRange(p.ageRange);
  return years >= Math.floor(a) && years <= b;
}

/** "Siz uchun" qatorida ko‘rsatiladigan sabab */
export const DOMAIN_REASON: Record<Domain, string> = {
  nutq: "Nutq rivojlanishi uchun",
  kognitiv: "Diqqat va tafakkur uchun",
  mayda_motorika: "Mayda motorika uchun",
  yirik_motorika: "Harakat va muvozanat uchun",
  ijtimoiy: "Muloqot ko‘nikmalari uchun",
  mustaqillik: "Mustaqillik uchun",
};

export const PAYMENT_METHODS: {
  id: Order["payment"];
  label: string;
  hint: string;
  mark: string;
  bg: string;
  fg: string;
}[] = [
  { id: "click", label: "Click", hint: "Bank kartasi orqali", mark: "click", bg: "#0a8cff", fg: "#ffffff" },
  { id: "payme", label: "Payme", hint: "Uzcard / Humo", mark: "payme", bg: "#e6fbfb", fg: "#0c8a8a" },
  { id: "uzum", label: "Uzum", hint: "Uzum Bank / Nasiya", mark: "uzum", bg: "#7000ff", fg: "#ffffff" },
  { id: "naqd", label: "Naqd", hint: "Qabul qilganda to‘lash", mark: "💵", bg: "#e3f6ef", fg: "#0b7a52" },
];

export function paymentLabel(id: Order["payment"]): string {
  return PAYMENT_METHODS.find((p) => p.id === id)?.label ?? id;
}

export const ORDER_STEPS: { id: Order["status"]; label: string; emoji: string }[] = [
  { id: "qabul_qilindi", label: "Qabul qilindi", emoji: "📝" },
  { id: "yigilmoqda", label: "Yig‘ilmoqda", emoji: "📦" },
  { id: "yolda", label: "Yo‘lda", emoji: "🚚" },
  { id: "yetkazildi", label: "Yetkazildi", emoji: "🏠" },
];

/**
 * Buyurtma holati. Demo uchun vaqt o‘tishi bilan holat avtomatik oldinga siljiydi
 * (saqlangan holatdan orqaga qaytmaydi).
 */
export function orderStepIndex(order: Order, now: number = Date.now()): number {
  const stored = Math.max(0, ORDER_STEPS.findIndex((s) => s.id === order.status));
  const hours = (now - new Date(order.createdAt).getTime()) / 3_600_000;
  const simulated = hours >= 26 ? 3 : hours >= 4 ? 2 : hours >= 0.25 ? 1 : 0;
  return Math.max(stored, simulated);
}

export interface CartLine {
  product: Product;
  qty: number;
}

export function cartLines(items: Record<string, number>): CartLine[] {
  const out: CartLine[] = [];
  for (const [id, qty] of Object.entries(items)) {
    const product = PRODUCTS.find((p) => p.id === id);
    if (product && qty > 0) out.push({ product, qty });
  }
  return out;
}

export function cartTotals(lines: CartLine[]) {
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.product.price, 0);
  const saved = lines.reduce((s, l) => s + l.qty * Math.max(0, (l.product.oldPrice ?? l.product.price) - l.product.price), 0);
  const delivery = deliveryFee(subtotal);
  return { count, subtotal, saved, delivery, total: subtotal + delivery };
}

/** "Dilnoza Karimova" -> "D. Karimova" */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

/** "or-1001" -> "#1001" */
export function orderNo(id: string): string {
  return `#${id.replace(/^or-/, "")}`;
}
