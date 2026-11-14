import { NextRequest } from "next/server";
import { bus } from "@/lib/realtime/bus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// SSE stream — broadcast only; clients refetch authoritative state on each event.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const b = bus();
  const channel = `auction:${id}`;

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (payload: unknown) => {
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          /* closed */
        }
      };
      const onEvent = (payload: unknown) => send(payload);
      b.on(channel, onEvent);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(enc.encode(`: hb\n\n`));
        } catch {
          /* closed */
        }
      }, 25_000);

      send({ event: "connected", auctionId: id });
      return () => {
        b.off(channel, onEvent);
        clearInterval(heartbeat);
      };
    },
    cancel() {
      b.removeAllListeners(channel);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
