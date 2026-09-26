import { getSpecialist } from "@/data/specialists";
import { specialistView } from "@/lib/core/views";
import { getDB } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!getSpecialist(id)) return Response.json({ error: "Mutaxassis topilmadi" }, { status: 404 });
  return Response.json({ spView: specialistView(getDB(), id) });
}
