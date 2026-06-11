import { fail, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// GET /api/photo?mid=<mapillary id>   → foto street-level Mapillary (redirect)
// GET /api/photo?gp=<google place_id> → foto Google Places (proxy bytes, key disembunyikan)
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const mid = sp.get("mid");
  const gp = sp.get("gp");

  // ---- Google Places ----
  if (gp) {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return fail(503, "GOOGLE_MAPS_API_KEY belum di-set");
    try {
      // place_id → photo_reference (Place Details, field 'photos')
      const det = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(gp)}&fields=photos&key=${key}`,
        { cache: "no-store" },
      );
      const dj = (await det.json()) as {
        result?: { photos?: { photo_reference: string }[] };
      };
      const ref = dj.result?.photos?.[0]?.photo_reference;
      if (!ref) return fail(404, "Tidak ada foto");
      // photo_reference → bytes gambar (ikuti redirect; bytes di-proxy agar key aman)
      const img = await fetch(
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${key}`,
      );
      const buf = await img.arrayBuffer();
      return new Response(buf, {
        headers: {
          "Content-Type": img.headers.get("content-type") ?? "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch (e) {
      return fail(502, e instanceof Error ? e.message : "Gagal mengambil foto Google");
    }
  }

  // ---- Mapillary ----
  if (mid) {
    const token = process.env.MAPILLARY_TOKEN;
    if (!token) return fail(503, "MAPILLARY_TOKEN belum di-set");
    try {
      const r = await fetch(
        `https://graph.mapillary.com/${encodeURIComponent(mid)}?access_token=${encodeURIComponent(token)}&fields=thumb_1024_url`,
        { cache: "no-store" },
      );
      const j = (await r.json()) as { thumb_1024_url?: string };
      if (!j.thumb_1024_url) return fail(404, "Foto tidak ditemukan");
      return new Response(null, {
        status: 302,
        headers: { Location: j.thumb_1024_url, "Cache-Control": "public, max-age=3600" },
      });
    } catch (e) {
      return fail(502, e instanceof Error ? e.message : "Gagal mengambil foto");
    }
  }

  return fail(400, "Parameter mid atau gp wajib");
}
