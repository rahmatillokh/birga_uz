import { adminAllowed } from "@/server/admin";
import { resetAll, resetDemo } from "@/server/db";

/** Demo ma’lumotlarni tiklash. ?all=1 — barcha foydalanuvchilarni ham tozalash (ADMIN_KEY bilan himoyalangan) */
export async function POST(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("all") === "1") {
    if (!adminAllowed(req)) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
    resetAll();
    return Response.json({ ok: true, all: true });
  }
  resetDemo();
  return Response.json({ ok: true });
}
