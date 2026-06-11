// SSE realtime — server subscribe ke Supabase Realtime, lalu stream perubahan
// ke client lewat Server-Sent Events. Client TIDAK pernah konek ke DB langsung,
// sehingga aturan "semua data lewat API" tetap terjaga.
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createRealtimeClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*" },
  });
}

export async function GET() {
  const supabase = createRealtimeClient();
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let channel: RealtimeChannel | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, payload: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
        } catch {
          /* controller sudah tertutup */
        }
      };

      send("ready", { time: new Date().toISOString() });

      channel = supabase.channel("amd-stream");
      (["places", "reviews", "favorites", "live_locations"] as const).forEach((table) => {
        channel!.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => {
            send("change", {
              table,
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old,
            });
          },
        );
      });
      channel.subscribe();

      // Heartbeat agar koneksi tidak ditutup proxy.
      heartbeat = setInterval(() => send("ping", Date.now()), 25_000);
    },
    async cancel() {
      if (heartbeat) clearInterval(heartbeat);
      if (channel) await supabase.removeChannel(channel);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
    },
  });
}
