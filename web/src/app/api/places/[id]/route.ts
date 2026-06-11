import { ok, fail, preflight, hasValidApiKey } from "@/lib/http";
import { fetchPlaceDetail, validatePlace, mapRow } from "@/lib/places";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return preflight();
}

// GET /api/places/{id}?lat=&lng=
export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) return fail(400, "id tidak valid");

  const sp = new URL(req.url).searchParams;
  const lat = sp.get("lat") ? Number(sp.get("lat")) : null;
  const lng = sp.get("lng") ? Number(sp.get("lng")) : null;

  try {
    const detail = await fetchPlaceDetail(pid, lat, lng);
    if (!detail) return fail(404, "Tempat tidak ditemukan");
    return ok(detail);
  } catch (e) {
    return fail(500, e instanceof Error ? e.message : "Gagal mengambil detail tempat");
  }
}

// PUT /api/places/{id}  (admin)
export async function PUT(req: Request, ctx: Ctx) {
  if (!hasValidApiKey(req)) return fail(401, "X-API-Key tidak valid atau tidak ada");
  const { id } = await ctx.params;
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) return fail(400, "id tidak valid");

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "Body JSON tidak valid");
  }

  const v = validatePlace(body, true); // partial update
  if (!v.ok) return fail(400, v.message);
  if (Object.keys(v.value).length === 0) return fail(400, "Tidak ada field yang diperbarui");

  const { data, error } = await supabaseAdmin
    .from("places")
    .update(v.value)
    .eq("id", pid)
    .select("*, categories(name, icon)")
    .maybeSingle();
  if (error) return fail(500, error.message);
  if (!data) return fail(404, "Tempat tidak ditemukan");

  return ok(mapRow(data as never));
}

// DELETE /api/places/{id}  (admin)
export async function DELETE(req: Request, ctx: Ctx) {
  if (!hasValidApiKey(req)) return fail(401, "X-API-Key tidak valid atau tidak ada");
  const { id } = await ctx.params;
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) return fail(400, "id tidak valid");

  const { data, error } = await supabaseAdmin
    .from("places")
    .delete()
    .eq("id", pid)
    .select("id")
    .maybeSingle();
  if (error) return fail(500, error.message);
  if (!data) return fail(404, "Tempat tidak ditemukan");

  return ok({ id: pid, deleted: true });
}
