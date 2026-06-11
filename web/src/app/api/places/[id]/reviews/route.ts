import { ok, fail, preflight } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase";
import type { Review } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return preflight();
}

// GET /api/places/{id}/reviews
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) return fail(400, "id tidak valid");

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("place_id", pid)
    .order("created_at", { ascending: false });
  if (error) return fail(500, error.message);
  return ok<Review[]>((data ?? []) as Review[]);
}

// POST /api/places/{id}/reviews  (pengguna; tidak perlu API key)
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) return fail(400, "id tidak valid");

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "Body JSON tidak valid");
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return fail(400, "rating harus bilangan 1..5");
  const userId = typeof body.user_id === "string" && body.user_id.trim() ? body.user_id.trim() : "anon";
  const comment = typeof body.comment === "string" ? body.comment.trim() : null;

  // Pastikan tempatnya ada.
  const { data: place } = await supabaseAdmin.from("places").select("id").eq("id", pid).maybeSingle();
  if (!place) return fail(404, "Tempat tidak ditemukan");

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert({ place_id: pid, user_id: userId, rating, comment })
    .select("*")
    .single();
  if (error) return fail(500, error.message);

  return ok<Review>(data as Review, 201);
}
