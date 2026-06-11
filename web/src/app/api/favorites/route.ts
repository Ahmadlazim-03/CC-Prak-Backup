import { ok, fail, preflight } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase";
import { mapRow } from "@/lib/places";
import type { Place } from "@/lib/types";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// GET /api/favorites?user_id=...            -> daftar tempat favorit (Place[])
// GET /api/favorites?user_id=...&place_id=X -> { place_id, favorited }
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const userId = sp.get("user_id");
  if (!userId) return fail(400, "user_id wajib diisi");

  const placeId = sp.get("place_id");
  if (placeId) {
    const { data, error } = await supabaseAdmin
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("place_id", Number(placeId))
      .maybeSingle();
    if (error) return fail(500, error.message);
    return ok({ place_id: Number(placeId), favorited: Boolean(data) });
  }

  const { data, error } = await supabaseAdmin
    .from("favorites")
    .select("place_id, places(*, categories(name, icon))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return fail(500, error.message);

  const places = (data ?? [])
    .map((row) => (row as { places: unknown }).places)
    .filter(Boolean)
    .map((p) => mapRow(p as never));
  return ok<Place[]>(places);
}

// POST /api/favorites  body { user_id, place_id }  -> tambah favorit
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "Body JSON tidak valid");
  }
  const userId = typeof body.user_id === "string" ? body.user_id.trim() : "";
  const placeId = Number(body.place_id);
  if (!userId) return fail(400, "user_id wajib diisi");
  if (!Number.isInteger(placeId) || placeId <= 0) return fail(400, "place_id tidak valid");

  const { error } = await supabaseAdmin
    .from("favorites")
    .upsert({ user_id: userId, place_id: placeId }, { onConflict: "place_id,user_id", ignoreDuplicates: true });
  if (error) return fail(500, error.message);
  return ok({ place_id: placeId, favorited: true }, 201);
}

// DELETE /api/favorites?user_id=...&place_id=...  -> hapus favorit
export async function DELETE(req: Request) {
  const sp = new URL(req.url).searchParams;
  const userId = sp.get("user_id");
  const placeId = Number(sp.get("place_id"));
  if (!userId) return fail(400, "user_id wajib diisi");
  if (!Number.isInteger(placeId) || placeId <= 0) return fail(400, "place_id tidak valid");

  const { error } = await supabaseAdmin
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("place_id", placeId);
  if (error) return fail(500, error.message);
  return ok({ place_id: placeId, favorited: false });
}
