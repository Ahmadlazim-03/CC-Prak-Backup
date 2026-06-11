import { ok, fail, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// GET /api/route?fromLat&fromLng&toLat&toLng[&profile=driving|walking|cycling]
// Proxy ke OSRM (server publik, tanpa key). Mengembalikan geometri GeoJSON + jarak + durasi.
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const num = (k: string) => Number(sp.get(k));
  const fromLat = num("fromLat");
  const fromLng = num("fromLng");
  const toLat = num("toLat");
  const toLng = num("toLng");
  for (const [k, v] of Object.entries({ fromLat, fromLng, toLat, toLng })) {
    if (Number.isNaN(v)) return fail(400, `Parameter ${k} tidak valid`);
  }
  const p = sp.get("profile") ?? "driving";
  const profile = ["driving", "walking", "cycling"].includes(p) ? p : "driving";

  const url = `https://router.project-osrm.org/route/v1/${profile}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
  try {
    const r = await fetch(url, { cache: "no-store" });
    const j = (await r.json()) as {
      code?: string;
      routes?: { geometry: unknown; distance: number; duration: number }[];
    };
    if (j.code !== "Ok" || !j.routes?.length) return fail(502, "Rute tidak ditemukan");
    const route = j.routes[0];
    return ok({
      geometry: route.geometry,
      distance_m: Math.round(route.distance),
      duration_s: Math.round(route.duration),
      profile,
    });
  } catch (e) {
    return fail(502, e instanceof Error ? e.message : "Gagal mengambil rute");
  }
}
