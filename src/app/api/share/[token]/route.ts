import { sharedReport } from "@/lib/core/views";
import { getDB, saveDB } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const res = sharedReport(getDB(), token);
  saveDB();
  if (!res.ok) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ report: res.data });
}
