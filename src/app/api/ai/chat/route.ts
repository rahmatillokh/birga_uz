import { fallbackAnswer, fallbackKidAnswer } from "@/lib/ai/fallback";
import { DEMO_SPECIALIST_ID } from "@/lib/constants";
import { identify } from "@/server/auth";
import { aiEnabled, streamChat, type ChatMode } from "@/server/ai";
import { parentChildContext, specialistChildContext } from "@/server/ai-context";
import { getDB } from "@/server/db";

type Msg = { role: "user" | "assistant"; content: string };

function fakeStream(text: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const parts = text.match(/\S+\s*/g) ?? [text];
  return new ReadableStream({
    async start(controller) {
      for (let i = 0; i < parts.length; i += 2) {
        controller.enqueue(enc.encode(parts.slice(i, i + 2).join("")));
        await new Promise((r) => setTimeout(r, 28));
      }
      controller.close();
    },
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { mode?: ChatMode; messages?: Msg[]; childId?: string; specialistId?: string };
  const mode: ChatMode = body.mode === "kid" || body.mode === "specialist" ? body.mode : "parent";
  const messages = (body.messages ?? []).filter((m) => m.content?.trim()).slice(-16);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "Xabar bo‘sh" }, { status: 400 });
  }
  const db = getDB();
  let ctx: { child?: { name: string }; text: string };
  if (mode === "specialist") {
    ctx = body.childId ? specialistChildContext(db, body.specialistId || DEMO_SPECIALIST_ID, body.childId) : { text: "" };
  } else {
    const id = identify(req, db);
    if ("error" in id) return Response.json({ error: id.error }, { status: 401 });
    ctx = parentChildContext(db, id.uid, body.childId);
  }

  const headers = { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" };
  if (!aiEnabled()) {
    const last = messages[messages.length - 1].content;
    const name = ctx.child?.name ?? (mode === "kid" ? "do‘stim" : "farzandingiz");
    const text = mode === "kid" ? fallbackKidAnswer(last, name) : fallbackAnswer(last, name);
    return new Response(fakeStream(text), { headers: { ...headers, "x-ai-mode": "demo" } });
  }
  return new Response(
    streamChat(
      mode,
      ctx.text,
      messages.map((m) => ({ role: m.role, content: m.content })),
    ),
    { headers: { ...headers, "x-ai-mode": "claude" } },
  );
}
