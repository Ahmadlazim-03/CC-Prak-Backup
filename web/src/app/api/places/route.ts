import { ok, fail, preflight, hasValidApiKey } from "@/lib/http";
import { fetchPlaces, validatePlace, mapRow } from "@/lib/places";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// GET /api/places?category=&q=&sort=distance|rating&lat=&lng=&limit=&offset=
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const num = (k: string): number | null => {
    const v = sp.get(k);
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };
  const sortRaw = sp.get("sort");
  const sort = sortRaw === "distance" || sortRaw === "rating" ? sortRaw : null;

  try {
    const places = await fetchPlaces({
      category: sp.get("category"),
      q: sp.get("q"),
      sort,
      lat: num("lat"),
      lng: num("lng"),
      limit: num("limit"),
      offset: num("offset"),
    });
    return ok(places);
  } catch (e) {
    return fail(500, e instanceof Error ? e.message : "Gagal mengambil data tempat");
  }
}

// POST /api/places  (admin, perlu X-API-Key)
export async function POST(req: Request) {
  if (!hasValidApiKey(req)) return fail(401, "X-API-Key tidak valid atau tidak ada");

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "Body JSON tidak valid");
  }

  const v = validatePlace(body, false);
  if (!v.ok) return fail(400, v.message);

  const { data: cat } = await supabaseAdmin
    .from("categories")
    .select("id")
    .eq("id", v.value.category_id as number)
    .maybeSingle();
  if (!cat) return fail(400, "category_id tidak ditemukan di tabel categories");

  const { data, error } = await supabaseAdmin
    .from("places")
    .insert(v.value)
    .select("*, categories(name, icon)")
    .single();
  if (error) return fail(500, error.message);

  return ok(mapRow(data as never), 201);
}
