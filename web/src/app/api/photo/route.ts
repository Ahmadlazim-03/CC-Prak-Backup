import { fail, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// GET /api/photo?mid=<mapillary image id>
// Meresolusi URL foto Mapillary terkini (URL aslinya kedaluwarsa) lalu redirect.
// Token Mapillary tetap di server (MAPILLARY_TOKEN), tidak diekspos ke client.
export async function GET(req: Request) {
  const mid = new URL(req.url).searchParams.get("mid");
  const token = process.env.MAPILLARY_TOKEN;
  if (!mid) return fail(400, "mid wajib");
  if (!token) return fail(503, "MAPILLARY_TOKEN belum di-set");

  try {
    const r = await fetch(
      `https://graph.mapillary.com/${encodeURIComponent(mid)}?access_token=${token}&fields=thumb_1024_url`,
      { cache: "no-store" },
    );
    const j = (await r.json()) as { thumb_1024_url?: string };
    if (!j.thumb_1024_url) return fail(404, "Foto tidak ditemukan");
    return new Response(null, {
      status: 302,
      headers: {
        Location: j.thumb_1024_url,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return fail(502, e instanceof Error ? e.message : "Gagal mengambil foto");
  }
}
